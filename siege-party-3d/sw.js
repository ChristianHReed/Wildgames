/* Offline copy for the web address. The newest page from the web wins; the saved copy is
   only used without a connection. Other games share this web address (the painted Siege Party
   next door among them), so only this version's own old caches, "siege-party-3d-...", are removed. */
const CACHE = "siege-party-3d-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.png", "icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith("siege-party-3d-") && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then((c) =>
      fetch(e.request, { cache: "no-store" })
        .then((r) => {
          if (r.ok) c.put(e.request, r.clone());
          return r;
        })
        .catch(async () => (await c.match(e.request, { ignoreSearch: true })) || Response.error()),
    ),
  );
});
