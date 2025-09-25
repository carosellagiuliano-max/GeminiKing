import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  window: number;
}

const inMemoryStore = new Map<string, { count: number; reset: number }>();
const limiterCache = new Map<string, Ratelimit>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisClient = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

function getUpstashLimiter(limit: number, windowInSeconds: number) {
  if (!redisClient) {
    return null;
  }

  const cacheKey = `${limit}:${windowInSeconds}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.fixedWindow(limit, `${windowInSeconds}s`),
    analytics: true,
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

async function rateLimitMemory(key: string, limit: number, windowInSeconds: number): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const existing = inMemoryStore.get(key);
  if (!existing || existing.reset <= now) {
    inMemoryStore.set(key, { count: 1, reset: now + windowInSeconds });
    return { allowed: true, remaining: limit - 1, reset: now + windowInSeconds, window: windowInSeconds };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, reset: existing.reset, window: windowInSeconds };
  }

  existing.count += 1;
  inMemoryStore.set(key, existing);
  return { allowed: true, remaining: Math.max(0, limit - existing.count), reset: existing.reset, window: windowInSeconds };
}

async function rateLimitUpstash(key: string, limit: number, windowInSeconds: number): Promise<RateLimitResult | null> {
  const limiter = getUpstashLimiter(limit, windowInSeconds);
  if (!limiter) {
    return null;
  }

  const result = await limiter.limit(key);
  const remaining = Math.max(0, result.remaining ?? limit - 1);
  return {
    allowed: result.success,
    remaining,
    reset: Math.floor((result.reset ?? Date.now()) / 1000),
    window: windowInSeconds,
  };
}

async function rateLimitSupabase(key: string, limit: number, windowInSeconds: number): Promise<RateLimitResult> {
  const supabase = createSupabaseServiceRoleClient();
  const since = new Date(Date.now() - windowInSeconds * 1000).toISOString();

  const { count = 0, error } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_name', 'rate_limit.hit')
    .eq('event_properties->>key', key)
    .gte('occurred_at', since);

  if (error) {
    console.error('Rate limit supabase lookup failed', error);
    return rateLimitMemory(key, limit, windowInSeconds);
  }

  const hits = count ?? 0;
  if (hits >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + windowInSeconds,
      window: windowInSeconds,
    };
  }

  await supabase.from('analytics_events').insert({
    event_name: 'rate_limit.hit',
    event_properties: { key },
  });

  const remaining = Math.max(0, limit - (hits + 1));
  return {
    allowed: true,
    remaining,
    reset: Math.floor(Date.now() / 1000) + windowInSeconds,
    window: windowInSeconds,
  };
}

export async function rateLimit(key: string, limit: number, windowInSeconds: number): Promise<RateLimitResult> {
  const upstashResult = await rateLimitUpstash(key, limit, windowInSeconds);
  if (upstashResult) {
    return upstashResult;
  }

  const persistence = process.env.RATE_LIMIT_PERSISTENCE?.toLowerCase();
  if (persistence === 'supabase') {
    return rateLimitSupabase(key, limit, windowInSeconds);
  }

  return rateLimitMemory(key, limit, windowInSeconds);
}

export function rateLimitHeaders(limit: number, remaining: number, reset: number, windowInSeconds: number) {
  return {
    'RateLimit-Policy': `${limit};w=${windowInSeconds}`,
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(Math.max(0, remaining)),
    'RateLimit-Reset': String(reset),
  };
}
