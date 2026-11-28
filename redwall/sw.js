/* This game is now Siege Party, at ../siege-party/. Remove the old offline copy. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith("redwall-")).map((n) => caches.delete(n))))
      .then(() => self.registration.unregister()),
  );
});
