import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  window: number;
}

const inMemoryStore = new Map<string, { count: number; reset: number }>();

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
    'RateLimit-Remaining': String(remaining),
    'RateLimit-Reset': String(reset),
  };
}
