/**
 * Lightweight in-memory sliding window rate limiter.
 * Keyed by `${key}:${ip}` — e.g. "register:192.168.1.1"
 *
 * Works fine on a single Cloud Run instance. For multi-instance
 * deployments upgrade to Redis/Upstash-backed limiter.
 */

const store = new Map<string, number[]>();

// Clean up old entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  store.forEach((timestamps: number[], key: string) => {
    const recent = timestamps.filter((t: number) => now - t < 60 * 60 * 1000);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      store.set(key, recent);
    }
  });
}, 10 * 60 * 1000);

/**
 * Check if the request is within rate limits.
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfter: seconds }`
 */
export function rateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const storeKey = `${key}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps within the current window
  const timestamps = (store.get(storeKey) ?? []).filter(
    (t) => t > windowStart
  );

  if (timestamps.length >= limit) {
    // Oldest request in window — retry after it expires
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Allow — record this request
  timestamps.push(now);
  store.set(storeKey, timestamps);
  return { allowed: true };
}

/**
 * Extract the client IP from a NextRequest.
 * Handles reverse proxies (Cloud Run, Vercel, etc.).
 */
export function getIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
