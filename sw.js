/* Afterstreet offline cache. Only used when the game is opened from a web address (for iPhone and iPad). */
var CACHE = 'afterstreet-v1', FILES = ['./', 'index.html', 'play.html', 'manifest.webmanifest', 'icon.png', 'icon-180.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
/* answer from the saved copy at once, and fetch a newer copy in the background for next time */
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(e.request, {ignoreSearch:true}).then(function(hit){
      var net = fetch(e.request).then(function(r){ if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(function(){ return hit; });
      return hit || net;
    });
  }));
});
