/**
 * Cloudflare Worker — cdn.pamaptor.com
 *
 * Proxies requests to GCS and caches them at Cloudflare's edge.
 *
 * Deploy steps (see DEPLOY.md Phase 8 CDN section):
 *   1. Go to Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. Paste this file, set the GCS_BUCKET env variable to "pamaptor-media"
 *   3. Add a Custom Domain: cdn.pamaptor.com
 *
 * Request flow:
 *   https://cdn.pamaptor.com/posts/abc.jpg
 *       → Worker fetches https://storage.googleapis.com/pamaptor-media/posts/abc.jpg
 *       → Response is cached at Cloudflare edge (Cache-Control: 1 year)
 *       → Subsequent requests are served from cache — GCS is never hit again
 */

export default {
  async fetch(request, env) {
    const bucket = env.GCS_BUCKET || "pamaptor-media";
    const url = new URL(request.url);

    // Only allow GET and HEAD
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const gcsUrl = `https://storage.googleapis.com/${bucket}${url.pathname}`;

    // Check Cloudflare cache first
    const cacheKey = new Request(gcsUrl, request);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    // Fetch from GCS origin
    const originResponse = await fetch(gcsUrl);

    if (!originResponse.ok) {
      return new Response("Not Found", { status: originResponse.status });
    }

    // Build response with long-lived cache headers
    const response = new Response(originResponse.body, {
      status: originResponse.status,
      headers: {
        "Content-Type": originResponse.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "MISS",
      },
    });

    // Store in Cloudflare cache
    await cache.put(cacheKey, response.clone());

    return response;
  },
};
