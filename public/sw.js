const CACHE = "chemvault-v4";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  // Hashed Vite assets and the worker script must never be served from a
  // previous deploy — that was pinning the old Virtual Lab catalogue.
  if (url.pathname.startsWith("/assets/") || url.pathname === "/sw.js") return;
  if (req.mode === "navigate" || req.destination === "document") return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.destination !== "script" && req.destination !== "style") {
          const copy = res.clone();
          void caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error())),
  );
});
