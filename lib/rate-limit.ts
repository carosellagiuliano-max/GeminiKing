interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  window: number;
}

const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowInSeconds: number): RateLimitResult {
  const now = Math.floor(Date.now() / 1000);
  const existing = store.get(key);
  if (!existing || existing.reset <= now) {
    store.set(key, { count: 1, reset: now + windowInSeconds });
    return { allowed: true, remaining: limit - 1, reset: now + windowInSeconds, window: windowInSeconds };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, reset: existing.reset, window: windowInSeconds };
  }

  existing.count += 1;
  store.set(key, existing);
  return { allowed: true, remaining: Math.max(0, limit - existing.count), reset: existing.reset, window: windowInSeconds };
}

export function rateLimitHeaders(limit: number, remaining: number, reset: number, windowInSeconds: number) {
  return {
    'RateLimit-Policy': `${limit};w=${windowInSeconds}`,
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(remaining),
    'RateLimit-Reset': String(reset),
  };
}
