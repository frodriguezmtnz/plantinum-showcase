/**
 * Fixed-window rate limiter for Server Actions.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured the
 * counters live in Upstash Redis (HTTP REST), so every serverless instance
 * shares them. Without those variables it falls back to a per-process map,
 * which is enough for local dev and a single-instance deployment.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, '');
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// One atomic round-trip: increment, set the TTL only on the first hit, and
// return both the counter and the remaining TTL.
const INCR_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return {count, redis.call('PTTL', KEYS[1])}
`;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function checkMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

async function checkRedis(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const response = await fetch(UPSTASH_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['EVAL', INCR_SCRIPT, '1', `ratelimit:${key}`, String(windowMs)]),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Upstash responded with ${response.status}`);
  }

  const payload = (await response.json()) as { result?: [number, number] };
  const count = Number(payload.result?.[0]);
  const ttlMs = Number(payload.result?.[1]);
  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    throw new Error('Upstash returned an unexpected payload');
  }

  return {
    ok: count <= limit,
    retryAfterSeconds: count <= limit ? 0 : Math.max(1, Math.ceil(ttlMs / 1000)),
  };
}

let warnedAboutRedis = false;

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await checkRedis(key, limit, windowMs);
    } catch (error) {
      // Never let a Redis outage lock everyone out: fall back per-process.
      if (!warnedAboutRedis) {
        warnedAboutRedis = true;
        console.error('[rate-limit] Upstash unavailable, using in-memory fallback:', error);
      }
    }
  }

  return checkMemory(key, limit, windowMs);
}
