/* Afterstreet offline copy. Only used when the game is opened from a web address (for iPhone and iPad).
   When there is internet the newest game is always fetched; the saved copy is used only when there is none. */
/* squares of the built-in Springfield region are kept in their own store, so a new version of the game does not throw them away */
var SQ = 'afterstreet-squares-2', CACHE = 'afterstreet-v61', FILES = ['./', 'index.html', 'play.html', 'manifest.webmanifest', 'icon.png', 'icon-180.png',
  'assets/icons.js', 'assets/weapons/cricket_bat.svg', 'assets/weapons/frying_pan.svg', 'assets/weapons/crowbar.svg', 'assets/weapons/hockey_stick.svg', 'assets/weapons/wrench.svg', 'assets/weapons/garden_rake.svg', 'assets/weapons/broom_spear.svg', 'assets/weapons/umbrella.svg', 'assets/ui/bleeding.svg', 'assets/ui/broken_leg.svg', 'assets/ui/build.svg', 'assets/ui/cold.svg', 'assets/ui/damage_arrow.svg', 'assets/ui/hot.svg', 'assets/ui/hungry.svg', 'assets/ui/infected.svg', 'assets/ui/jump.svg', 'assets/ui/low_health_vignette.svg', 'assets/ui/sick.svg', 'assets/ui/thirsty.svg', 'assets/ui/tired.svg', 'assets/ui/wet.svg', 'assets/ui/back.svg', 'assets/people_tex.js', 'assets/btex.js', 'assets/models.js', 'assets/nature.js', 'assets/vehicles.js', 'assets/rig.js', 'assets/shaped/shapes.js', 'assets/shaped/survivor.js', 'assets/shaped/aliens.js', 'assets/shaped/props.js', 'assets/shaped/held.js', 'assets/shaped/fx.js', 'assets/shaped/buildings.js', 'assets/map.js', 'assets/lite/atlas3.js', 'assets/lite/atlas.js', 'assets/lite/creatures.js', 'assets/lite/people.js', 'assets/sounds.js'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(FILES.map(function(f){ return fetch(f, {cache:'no-store'}).then(function(r){ if (r.ok) return c.put(f, r); }); })); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE && k !== SQ; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  /* test pages and old prototypes are separate from the game: load them straight from the web, never swap in the game */
  if (/\/(art-tests|prototypes)\//.test(new URL(e.request.url).pathname)) return;
  var sq = /\/assets\/springfield\//.test(new URL(e.request.url).pathname);
  e.respondWith(caches.open(sq ? SQ : CACHE).then(function(c){
    var saved = function(){ return c.match(e.request, {ignoreSearch:true}).then(function(hit){ return hit || (sq || /\.js$/.test(new URL(e.request.url).pathname) ? hit : c.match('play.html')); }); };
    var net = fetch(e.request.url, {cache:'no-store'}).then(function(r){ if (r && r.ok){ c.put(e.request, r.clone()); return r; } return saved(); });
    /* a slow or missing connection falls back to the saved copy after 6 seconds */
    return Promise.race([net, new Promise(function(res){ setTimeout(function(){ saved().then(function(h){ if (h) res(h); }); }, 6000); })]).catch(saved);
  }));
});
