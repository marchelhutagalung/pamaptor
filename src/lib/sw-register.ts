export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}

export function clearDataCache() {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage("CLEAR_DATA_CACHE");
  }
}

export function clearAllCaches() {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage("CLEAR_ALL");
  }
}
