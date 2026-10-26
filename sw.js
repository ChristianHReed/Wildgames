/* Afterstreet offline copy (web address only: iPhone, iPad). Every game file is asked for with its version (?v=BUILD, squares ?d=DATAV),
   so a saved file is either exactly right or never asked for again. Run tools/stamp_release.py to change BUILD / DATAV. */
var BUILD = '0.114.7', DATAV = '020fe026', CACHE = 'afterstreet-' + BUILD, SQ = 'afterstreet-squares';
var PAGES = ['./', 'index.html', 'play.html', 'builder.html', 'builder.webmanifest'];
var SCRIPTS = ['engine/core.js', 'engine/mapparse.js', 'engine/world.js', 'engine/dig.js', 'engine/meshes.js', 'engine/buildings.js', 'engine/interiors.js', 'engine/collision.js', 'engine/render.js', 'assets/icons.js', 'assets/btex.js', 'assets/models.js', 'assets/nature.js', 'assets/vehicles.js', 'assets/rig.js', 'assets/shaped/shapes.js', 'assets/shaped/survivor.js', 'assets/shaped/aliens.js', 'assets/shaped/props.js', 'assets/shaped/furniture2.js', 'assets/shaped/structures.js', 'assets/shaped/waterside.js', 'assets/shaped/bikes.js', 'assets/shaped/machinedig.js', 'assets/shaped/digging.js', 'assets/shaped/foodservice.js', 'assets/shaped/farm.js', 'assets/shaped/roadside.js', 'assets/shaped/parks.js', 'assets/shaped/autotrade.js', 'assets/shaped/services.js', 'assets/shaped/boats.js', 'builder/lib/flatbush.js', 'builder/geo.js', 'builder/gen.js', 'builder/uses.js', 'builder/structures.js', 'builder/build.js', 'assets/shaped/vehiclekit.js', 'assets/shaped/vehiclefit.js', 'assets/shaped/held.js', 'assets/shaped/fx.js', 'assets/shaped/buildings.js', 'assets/map.js', 'assets/lite/atlas3.js', 'assets/lite/atlas.js', 'assets/sounds.js', 'assets/shaped/walls.js', 'assets/shaped/power.js', 'assets/shaped/ground.js', 'assets/shaped/machines.js', 'assets/audio/sounds_design.js', 'assets/audio/sounds_content.js', 'assets/ui/portraits/old_ranger.png', 'assets/ui/portraits/medic.png', 'assets/ui/portraits/kid_hoodie.png', 'assets/ui/portraits/farmer.png', 'assets/ui/portraits/drifter.png', 'assets/ui/portraits/mechanic.png'];
var STATIC = ['builder/lib/flatbush.js', 'builder/lib/polylabel.js', 'builder/lib/fflate.js', 'builder/lib/fzstd.js', 'builder/lib/hyparquet.js', 'builder/inflate.js', 'builder/geo.js', 'builder/pbf.js', 'builder/tiff.js', 'builder/gen.js', 'builder/build.js', 'builder/worker.js', 'builder/app.js', 'builder/structures.js', 'builder/host.js', 'builder/view3d.js', 'manifest.webmanifest', 'icon.png', 'icon-180.png', 'assets/weapons/cricket_bat.svg', 'assets/weapons/frying_pan.svg', 'assets/weapons/crowbar.svg', 'assets/weapons/hockey_stick.svg', 'assets/weapons/wrench.svg', 'assets/weapons/garden_rake.svg', 'assets/weapons/broom_spear.svg', 'assets/weapons/umbrella.svg', 'assets/ui/bleeding.svg', 'assets/ui/broken_leg.svg', 'assets/ui/build.svg', 'assets/ui/cold.svg', 'assets/ui/damage_arrow.svg', 'assets/ui/hot.svg', 'assets/ui/hungry.svg', 'assets/ui/infected.svg', 'assets/ui/jump.svg', 'assets/ui/low_health_vignette.svg', 'assets/ui/sick.svg', 'assets/ui/thirsty.svg', 'assets/ui/tired.svg', 'assets/ui/wet.svg', 'assets/ui/back.svg'];
function vurl(f){ return f + '?v=' + BUILD; }
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){
  var all = PAGES.map(function(f){ return [f, f]; }).concat(SCRIPTS.map(function(f){ return [vurl(f), vurl(f)]; })).concat(STATIC.map(function(f){ return [f, f]; }));
  return Promise.all(all.map(function(p){ return fetch(p[1], {cache:'no-store'}).then(function(r){ if (r.ok) return c.put(p[0], r); }).catch(function(){}); }));
}).then(function(){ return self.skipWaiting(); })); });
/* leave only this version's files: other game caches go, and squares from an older map are dropped */
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){
  return Promise.all(ks.map(function(k){
    if (k === CACHE) return null;
    if (k === SQ) return caches.open(SQ).then(function(c){ return c.keys().then(function(rs){ return Promise.all(rs.filter(function(r){ return new URL(r.url).search !== '?d=' + DATAV; }).map(function(r){ return c.delete(r); })); }); });
    return caches.delete(k);
  }));
}).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/\/(art-tests|prototypes)\//.test(u.pathname)) return;
  var sq = /\/assets\/springfield\//.test(u.pathname), versioned = /^\?[vd]=/.test(u.search);
  if (versioned){
    /* an address that names its version never changes: saved copy first, the web only fills a gap */
    if (sq && u.search !== '?d=' + DATAV) return;
    e.respondWith(caches.open(sq ? SQ : CACHE).then(function(c){ return c.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(r){ if (r && r.ok) c.put(e.request, r.clone()); return r; });
    }); }));
    return;
  }
  /* the page itself: newest from the web, saved copy only when there is no connection */
  e.respondWith(caches.open(CACHE).then(function(c){
    return fetch(e.request, {cache:'no-store'}).then(function(r){ if (r && r.ok) c.put(e.request, r.clone()); return r; })
      .catch(function(){ return c.match(e.request, {ignoreSearch:true}).then(function(h){ return h || c.match('play.html'); }); });
  }));
});
