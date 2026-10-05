// 🦅 GARUDA PAWAN Offline-First & Over-The-Air (OTA) Self-Updating Service Worker
const CACHE_NAME = "apex-dental-ai-cc251d96";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.svg",
  "./icon-512.svg"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => {})
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            console.log("[GARUDA-OTA] Purging outdated cache version:", k);
            return caches.delete(k);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Network-First for Navigation / HTML (Instant OTA updates when Pawan alters the app)
// Cache-First with Background Revalidation for static assets
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const isNavigation = e.request.mode === "navigate" || (e.request.headers.get("accept") && e.request.headers.get("accept").includes("text/html"));

  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Static Assets: Cache with Network Fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        }
        return networkResponse;
      });
    }).catch(() => caches.match("./index.html"))
  );
});
