/* This game is now RedWall, at ../redwall/. Remove the old offline copy. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith("two-halls-")).map((n) => caches.delete(n))))
      .then(() => self.registration.unregister()),
  );
});
