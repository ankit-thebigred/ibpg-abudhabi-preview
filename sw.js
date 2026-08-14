const CACHE = "ibpg-preview-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for the HTML document (so redeploys are never masked by a stale cache),
// cache-first for everything else (images/icons rarely change and benefit from offline reuse).
self.addEventListener("fetch", (e) => {
  const isNavigation = e.request.mode === "navigate" || e.request.destination === "document";
  if (isNavigation) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
