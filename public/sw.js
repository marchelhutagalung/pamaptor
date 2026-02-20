const CACHE_NAME = "pamaptor-v1";
const IMAGE_CACHE = "pamaptor-images-v1";
const DATA_CACHE = "pamaptor-data-v1";

// Cache duration
const IMAGE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const DATA_MAX_AGE = 5 * 60 * 1000; // 5 minutes

// Install — pre-cache app shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CACHE_NAME, IMAGE_CACHE, DATA_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Determine request type
function isImageRequest(url) {
  return (
    url.pathname.startsWith("/uploads/") ||
    url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ||
    (url.hostname === "storage.googleapis.com" &&
      url.pathname.includes("pamaptor-media"))
  );
}

function isApiDataRequest(url) {
  return url.pathname.startsWith("/api/posts") && !url.pathname.includes("upload");
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Image requests — cache-first
  if (isImageRequest(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          return cached || new Response("", { status: 404 });
        }
      })
    );
    return;
  }

  // API data requests — stale-while-revalidate
  if (isApiDataRequest(url) && event.request.method === "GET") {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);

        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        // Return cached immediately if available, otherwise wait for network
        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  if (event.data === "CLEAR_DATA_CACHE") {
    caches.delete(DATA_CACHE);
  }
  if (event.data === "CLEAR_ALL") {
    caches.delete(CACHE_NAME);
    caches.delete(IMAGE_CACHE);
    caches.delete(DATA_CACHE);
  }
});
