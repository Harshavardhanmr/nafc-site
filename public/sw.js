/* NAFC FC — Service Worker for PWA offline support */
const CACHE = "nafc-v2";
const PRECACHE = ["/logo.png", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Network first for HTML, JS bundles, and Firebase calls
  if (
    e.request.mode === "navigate" ||
    e.request.url.includes("firestore") ||
    e.request.url.includes("firebase") ||
    e.request.url.endsWith(".html") ||
    e.request.url.includes("/static/js/")
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache first for images/media
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return response;
    }))
  );
});
