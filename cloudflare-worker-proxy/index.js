/**
 * Cloudflare Worker — pamaptor.com (reverse proxy)
 *
 * Proxies requests from pamaptor.com to Cloud Run,
 * rewriting the Host header so Cloud Run accepts them.
 *
 * This is needed because Cloudflare sends Host: pamaptor.com
 * but Cloud Run only accepts its own *.run.app hostname.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = env.CLOUD_RUN_ORIGIN;

    // Build the backend URL (same path/query, different origin)
    const backendUrl = new URL(url.pathname + url.search, origin);

    // Forward the request with the Cloud Run Host header
    const modifiedRequest = new Request(backendUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual",
    });

    // Override the Host header to match Cloud Run
    modifiedRequest.headers.set("Host", new URL(origin).hostname);
    // Pass the original host so the app can use it for redirects
    modifiedRequest.headers.set("X-Forwarded-Host", url.hostname);

    const response = await fetch(modifiedRequest);

    // Rewrite Location headers so redirects go back through Cloudflare
    const newHeaders = new Headers(response.headers);
    const location = newHeaders.get("Location");
    if (location) {
      try {
        const loc = new URL(location);
        if (loc.hostname === new URL(origin).hostname) {
          loc.hostname = url.hostname;
          loc.protocol = url.protocol;
          newHeaders.set("Location", loc.toString());
        }
      } catch {
        // relative URL, leave as-is
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
