import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Upstash Redis client — only initialised when env vars are present.
// Falls back to in-memory store so the app still works without Redis configured.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// ─── In-memory fallback (single-instance only) ────────────────────────────────

const store = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  store.forEach((timestamps, key) => {
    const recent = timestamps.filter((t) => now - t < 60 * 60 * 1000);
    if (recent.length === 0) store.delete(key);
    else store.set(key, recent);
  });
}, 10 * 60 * 1000);

function inMemoryRateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const storeKey = `${key}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (store.get(storeKey) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfter: Math.ceil((oldest + windowMs - now) / 1000) };
  }

  timestamps.push(now);
  store.set(storeKey, timestamps);
  return { allowed: true };
}

// ─── Upstash limiter cache (one Ratelimit instance per key+config) ─────────────

const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(key: string, limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${key}:${limit}:${windowMs}`;
  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(
      cacheKey,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: `rl:${key}`,
      })
    );
  }
  return limiterCache.get(cacheKey)!;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function rateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (!redis) {
    return inMemoryRateLimit(ip, key, limit, windowMs);
  }

  try {
    const limiter = getUpstashLimiter(key, limit, windowMs);
    const result = await limiter.limit(`${key}:${ip}`);
    if (result.success) return { allowed: true };
    const retryAfter = result.reset
      ? Math.ceil((result.reset - Date.now()) / 1000)
      : undefined;
    return { allowed: false, retryAfter };
  } catch {
    // Redis unavailable — degrade gracefully to in-memory
    return inMemoryRateLimit(ip, key, limit, windowMs);
  }
}

export function getIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
