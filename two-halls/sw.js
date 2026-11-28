/* Offline copy for the web address. The newest page from the web wins; the saved copy is
   only used without a connection. Other games share this web address, so only caches whose
   names start with "two-halls-" are ever removed. */
const CACHE = "two-halls-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.png", "icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith("two-halls-") && n !== CACHE).map((n) => caches.delete(n))))
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
