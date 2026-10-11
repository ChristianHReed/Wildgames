/* Afterstreet offline copy. Only used when the game is opened from a web address (for iPhone and iPad).
   When there is internet the newest game is always fetched; the saved copy is used only when there is none. */
var CACHE = 'afterstreet-v2', FILES = ['./', 'index.html', 'play.html', 'manifest.webmanifest', 'icon.png', 'icon-180.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(FILES.map(function(f){ return fetch(f, {cache:'no-store'}).then(function(r){ if (r.ok) return c.put(f, r); }); })); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function(c){
    var saved = function(){ return c.match(e.request, {ignoreSearch:true}).then(function(hit){ return hit || c.match('play.html'); }); };
    var net = fetch(e.request.url, {cache:'no-store'}).then(function(r){ if (r && r.ok){ c.put(e.request, r.clone()); return r; } return saved(); });
    /* a slow or missing connection falls back to the saved copy after 6 seconds */
    return Promise.race([net, new Promise(function(res){ setTimeout(function(){ saved().then(function(h){ if (h) res(h); }); }, 6000); })]).catch(saved);
  }));
});
