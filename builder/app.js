/* AfterStreet Maps Builder: the page. Area, map data, build, report and export, and the flat preview map.
   Classic script. The heavy work runs in the background worker (worker.js); this file only drives the page. */
(function(){
'use strict';
var L = {}; ['lib_flatbush', 'lib_polylabel', 'lib_fflate', 'lib_fzstd', 'lib_hyparquet', 'inflate', 'geo', 'pbf', 'tiff', 'gen', 'build'].forEach(function(k){ if (window.BLIB[k]) window.BLIB[k](L); });
var $ = function(id){ return document.getElementById(id); };
var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]; }); };
var fmtN = function(n){ return Math.round(n).toLocaleString('en-US'); };
var fmtMB = function(b){ return b >= 1e9 ? (b/1e9).toFixed(1) + ' GB' : b >= 1e6 ? (b/1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b/1e3)) + ' KB'; };
var slug = function(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'map'; };
var lsGet = function(k){ try { return localStorage.getItem(k); } catch (e){ return null; } };
var lsSet = function(k, v){ try { localStorage.setItem(k, v); return true; } catch (e){ return false; } };
var toastT = 0; function toast(t, s){ var e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function(){ e.classList.remove('on'); }, (s || 3)*1000); }
$('ver').textContent = 'v' + L.VERSION;

/* ---------------- state ---------------- */
var SGF = {lat:37.2089, lon:-93.2923, name:'Springfield, MO'};
var S = {area:{lat:SGF.lat, lon:SGF.lon, miles:5, name:SGF.name}, opts:{fill:true, step:20, tiles:true}, proj:null, osm:null, tiffs:[], tiffInfo:[], overture:[], man:null, single:null, preview:null, building:false};
try { var saved = JSON.parse(lsGet('asmb:state') || 'null'); if (saved && saved.area && isFinite(saved.area.lat)){ S.area = saved.area; S.opts = saved.opts || S.opts; S.proj = saved.proj || null; } } catch (e){}
function saveState(){ lsSet('asmb:state', JSON.stringify({area:S.area, opts:S.opts, proj:S.proj})); }

/* ---------------- device budget ---------------- */
var DEV = (function(){
  var ua = navigator.userAgent, phone = /iPhone|Android.+Mobile/.test(ua), pad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), mem = navigator.deviceMemory || (phone ? 4 : pad ? 6 : 8);
  var miles = mem <= 3 ? 3 : mem <= 4 ? 8 : mem <= 6 ? 25 : 50;
  if (phone) miles = Math.min(miles, 8); else if (pad) miles = Math.min(miles, 25);   /* browsers report memory loosely; a phone or tablet tab gets far less than the device has */
  return {kind:phone ? 'phone' : pad ? 'tablet' : 'computer', mem:mem, miles:miles};
})();
$('devInfo').textContent = 'This ' + DEV.kind + ' should handle up to about ' + DEV.miles + ' miles. Bigger areas may still work, slowly.';

/* ---------------- area ---------------- */
function areaUI(){
  $('lat').value = S.area.lat.toFixed(5); $('lon').value = S.area.lon.toFixed(5); $('miles').value = S.area.miles; $('milesV').textContent = S.area.miles + ' mi';
  $('mapName').value = S.area.name || '';
  var R = L.regionOf({id:'x', name:'x', lat:S.area.lat, lon:S.area.lon, miles:S.area.miles}), km = S.area.miles*1.609;
  $('areaInfo').innerHTML = R.squares.length + ' map square' + (R.squares.length > 1 ? 's' : '') + ' of about 5.6 km &middot; ' + fmtN(Math.PI*km*km) + ' km&sup2;' + (S.area.miles > DEV.miles ? ' &middot; <b style="color:var(--clayDeep)">bigger than this device is comfortable with</b>' : '');
  $('dlOsm').disabled = S.area.miles > 3; $('dlOsm').title = S.area.miles > 3 ? 'Downloads are for areas up to 3 miles; for bigger areas upload your state file' : '';
  if (S.osm && S.osm.kind === 'download') setOsm(null);
  checkElev(); drawSoon();
}
function setArea(a, fit){ for (var k in a) S.area[k] = a[k]; S.area.miles = Math.max(0.5, Math.min(50, +S.area.miles || 5)); saveState(); areaUI(); if (fit) fitArea(); }
$('miles').addEventListener('input', function(){ setArea({miles:+this.value}); });
$('lat').addEventListener('change', function(){ var v = parseFloat(this.value); if (isFinite(v) && Math.abs(v) < 85) setArea({lat:v}, true); else areaUI(); });
$('lon').addEventListener('change', function(){ var v = parseFloat(this.value); if (isFinite(v) && Math.abs(v) <= 180) setArea({lon:v}, true); else areaUI(); });
$('mapName').addEventListener('change', function(){ setArea({name:this.value.trim().slice(0, 40) || 'My map'}); });
$('presetSgf').addEventListener('click', function(){ setArea({lat:SGF.lat, lon:SGF.lon, name:SGF.name}, true); });
$('locMe').addEventListener('click', function(){
  if (!navigator.geolocation){ toast('This browser cannot tell the location.'); return; }
  navigator.geolocation.getCurrentPosition(function(p){ setArea({lat:p.coords.latitude, lon:p.coords.longitude, name:'My area'}, true); }, function(){ toast('Location was not allowed or not found.'); }, {timeout:15000});
});
async function search(){
  var q = $('q').value.trim(); if (!q) return;
  try {
    var r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q)); if (!r.ok) throw new Error(r.status);
    var j = await r.json(); if (!j.length){ toast('That place was not found.'); return; }
    setArea({lat:+j[0].lat, lon:+j[0].lon, name:String(j[0].display_name || q).split(',').slice(0, 2).join(',').trim().slice(0, 40)}, true);
  } catch (e){ toast('The place search needs an internet connection. You can type the latitude and longitude instead.', 5); }
}
$('qGo').addEventListener('click', search); $('q').addEventListener('keydown', function(e){ if (e.key === 'Enter') search(); });
var tapMode = false; $('tapSet').addEventListener('click', function(){ tapMode = !tapMode; this.classList.toggle('on', tapMode); note(tapMode ? 'Tap the map where the centre should be' : ''); });

/* ---------------- map data ---------------- */
function kindOf(name){ var n = name.toLowerCase(); return /\.pbf$/.test(n) ? 'pbf' : /\.(osm|xml)$/.test(n) ? 'xml' : 'json'; }
function setOsm(o){
  S.osm = o; var c = $('cOsm'), st = $('stOsm');
  c.classList.toggle('ok', !!o); c.classList.toggle('need', !o);
  st.innerHTML = !o ? 'No file yet.' : o.kind === 'download' ? '<b>Ready:</b> will download this area from OpenStreetMap when you build.' : '<b>Ready:</b> ' + esc(o.name) + ' (' + fmtMB(o.size) + ')' + (o.kind === 'pbf' ? ', read in two passes; only your area is kept.' : '.');
  $('stage').textContent = o ? 'Ready to build.' : 'Waiting for map data.';
}
$('fOsm').addEventListener('change', function(){ var f = this.files[0]; if (f) setOsm({kind:kindOf(f.name), file:f, name:f.name, size:f.size}); this.value = ''; });
$('dlOsm').addEventListener('click', function(){ if (!navigator.onLine){ toast('Downloading needs an internet connection.'); return; } setOsm({kind:'download', name:'OpenStreetMap download', size:0}); });
$('fTif').addEventListener('change', async function(){
  var fs = Array.prototype.slice.call(this.files); this.value = '';
  for (var i = 0; i < fs.length; i++){
    try { var T = await L.tiffOpen(fs[i]); S.tiffs.push(fs[i]); S.tiffInfo.push({name:fs[i].name, size:fs[i].size, res:T.res, proj:T.proj.name, epsg:T.epsg, T:T}); }
    catch (e){ toast(fs[i].name + ': ' + e.message, 7); }
  }
  checkElev(); drawSoon();
});
$('useTiles').addEventListener('change', function(){ S.opts.tiles = this.checked; saveState(); checkElev(); });
function coverage(T){
  var n = 0, inn = 0, loc = L.local(S.area.lat, S.area.lon), r = S.area.miles*1609;
  for (var a = -10; a <= 10; a++) for (var b = -10; b <= 10; b++){ var x = a/10*r, y = b/10*r; if (Math.hypot(x, y) > r) continue; n++; var ll = loc.ll(x, y); if (T.some(function(t){ return t.covers(ll[0], ll[1]); })) inn++; }
  return n ? inn/n : 0;
}
function checkElev(){
  var st = $('stElev'), c = $('cElev'), cov = S.tiffInfo.length ? coverage(S.tiffInfo.map(function(t){ return t.T; })) : 0;
  $('useTiles').checked = S.opts.tiles;
  var h = '';
  if (S.tiffInfo.length){
    h = S.tiffInfo.map(function(t, i){ return '<div>' + esc(t.name) + ' &middot; ' + fmtMB(t.size) + ' &middot; ' + (t.res < 2 ? t.res.toFixed(1) : Math.round(t.res)) + ' m detail &middot; ' + esc(t.proj) + ' <a href="#" data-rm="' + i + '">remove</a></div>'; }).join('');
    h += '<div><b>' + Math.round(cov*100) + '%</b> of your area is covered by these files' + (cov < 0.99 ? (S.opts.tiles ? '; terrain tiles fill the rest.' : '; the rest is filled from the edges. Add more files or tick the terrain tiles.') : '.') + '</div>';
  } else h = S.opts.tiles ? 'Free terrain tiles will be fetched while building (about 15 m detail). For the real 1 m ground, add USGS files.' : 'No elevation: the ground will be flat.';
  st.innerHTML = h; c.classList.toggle('ok', cov > 0.98 || (S.opts.tiles && navigator.onLine));
}
$('stElev').addEventListener('click', function(e){ var i = e.target.getAttribute('data-rm'); if (i === null) return; e.preventDefault(); S.tiffs.splice(+i, 1); S.tiffInfo.splice(+i, 1); checkElev(); drawSoon(); });
$('fOvt').addEventListener('change', function(){ S.overture = S.overture.concat(Array.prototype.slice.call(this.files)); this.value = ''; ovtUI(); });
function ovtUI(){ var c = $('cOvt'); c.classList.toggle('ok', S.overture.length > 0); $('stOvt').innerHTML = S.overture.length ? '<b>Ready:</b> ' + S.overture.map(function(f){ return esc(f.name) + ' (' + fmtMB(f.size) + ')'; }).join(', ') + ' <a href="#" id="ovtClr">clear</a>' : 'No files yet.'; var cl = $('ovtClr'); if (cl) cl.onclick = function(e){ e.preventDefault(); S.overture = []; ovtUI(); }; }
$('optFill').addEventListener('change', function(){ S.opts.fill = this.checked; saveState(); });
$('optStep').addEventListener('change', function(){ S.opts.step = +this.value; saveState(); });

/* ---------------- build ---------------- */
var W = window.BuildWorker(onWorker);
$('build').addEventListener('click', function(){
  if (S.building) return;
  if (!S.osm){ toast('Add OpenStreetMap data first (step 2).', 4); $('cOsm').scrollIntoView({behavior:'smooth', block:'center'}); return; }
  if (S.osm.kind === 'download' && !navigator.onLine){ toast('Downloading needs an internet connection.'); return; }
  S.proj = S.proj || slug(S.area.name) + '-' + Date.now().toString(36); saveState();
  var job = {proj:S.proj, area:{id:S.proj, name:S.area.name || 'My map', lat:S.area.lat, lon:S.area.lon, miles:S.area.miles}, osm:{kind:S.osm.kind, file:S.osm.file || null, name:S.osm.name},
    tiffs:S.tiffs.slice(), overture:S.overture.slice(), opts:{fill:S.opts.fill, step:S.opts.step, tiles:S.opts.tiles && navigator.onLine}};
  S.building = true; S.t0 = Date.now(); $('build').disabled = true; $('stop').classList.remove('hidden'); $('barI').style.width = '0%'; $('stage').textContent = 'Starting...';
  W.post({t:'build', job:job});
});
$('stop').addEventListener('click', function(){ W.post({t:'stop'}); $('stage').textContent = 'Stopping...'; });
function endBuild(){ S.building = false; $('build').disabled = false; $('stop').classList.add('hidden'); }
function onWorker(m){
  if (m.t === 'progress'){ $('barI').style.width = Math.round(m.f*100) + '%'; $('stage').textContent = m.text + '...'; }
  else if (m.t === 'warn') toast(m.text, 6);
  else if (m.t === 'error'){ endBuild(); $('stage').textContent = m.text === 'stopped' ? 'Stopped.' : 'The build stopped: ' + m.text + '.'; }
  else if (m.t === 'done'){
    endBuild(); $('barI').style.width = '100%';
    S.man = m.man; S.single = m.single; setPreview(m.preview, m.man.region);
    $('stage').textContent = 'Built in ' + Math.max(1, Math.round((Date.now() - S.t0)/1000)) + ' s. Saved on this device.';
    L.dbPut('projects', S.proj, {id:S.proj, man:S.man, single:S.single, saved:Date.now()}).catch(function(){});
    L.dbPut('preview', S.proj, {p:m.preview, region:m.man.region}).catch(function(){});
    report(); fitArea();
  }
}

/* ---------------- report ---------------- */
function pct(a, b){ return b ? Math.round(a/b*100) + '%' : '-'; }
function report(){
  var M = S.man; if (!M) return; $('s4').classList.remove('hidden');
  var t = M.report.tot, nb = t.osm + t.overture + t.gen, e = M.report.elev, st = M.stats || {};
  var h = '<table>';
  h += '<tr><th colspan="2">' + esc(M.region.name) + ', ' + M.region.miles + ' miles, ' + M.squares.length + ' squares, ' + fmtMB(M.bytes) + '</th></tr>';
  h += '<tr><td>Buildings from OpenStreetMap</td><td class="n">' + fmtN(t.osm) + '</td></tr>';
  if (t.overture) h += '<tr><td>Buildings from Overture</td><td class="n">' + fmtN(t.overture) + '</td></tr>';
  h += '<tr><td>Made-up buildings (marked)</td><td class="n">' + fmtN(t.gen) + '</td></tr>';
  h += '<tr><td>Real share of buildings</td><td class="n"><b>' + pct(t.osm + t.overture, nb) + '</b></td></tr>';
  h += '<tr><td>Buildings with a mapped height / storeys / roof</td><td class="n">' + fmtN(t.height) + ' / ' + fmtN(t.levels) + ' / ' + fmtN(t.roof) + '</td></tr>';
  h += '<tr><td>Buildings with an address</td><td class="n">' + fmtN(t.addr) + '</td></tr>';
  h += '<tr><td>Road pieces, named</td><td class="n">' + fmtN(t.roads) + ', ' + pct(t.named, t.roads) + '</td></tr>';
  h += '<tr><td>Road pieces with lanes / width mapped</td><td class="n">' + pct(t.lanes, t.roads) + ' / ' + pct(t.width, t.roads) + '</td></tr>';
  h += '<tr><td>Ground from your files / terrain tiles / guessed</td><td class="n">' + pct(e.file, 1) + ' / ' + pct(e.tiles, 1) + ' / ' + pct(e.none, 1) + '</td></tr>';
  if (M.report.fileRes) h += '<tr><td>Finest ground detail used</td><td class="n">' + (M.report.fileRes < 2 ? M.report.fileRes.toFixed(1) : Math.round(M.report.fileRes)) + ' m</td></tr>';
  if (st.overture) h += '<tr><td>Overture buildings skipped (already mapped)</td><td class="n">' + fmtN(st.overture.skipped) + '</td></tr>';
  h += '<tr><td>Places named</td><td class="n">' + fmtN(M.places.length) + '</td></tr>';
  h += '</table>';
  var tips = [];
  if (t.gen > t.osm*0.3) tips.push('Many buildings are made up. Adding <b>Overture buildings</b> (step 2) usually replaces most of them with real footprints.');
  if (e.tiles > 0.5 || e.none > 0.05) tips.push('For the real ground (kerbs, creek banks, ditches) add the <b>USGS 1 m elevation</b> files for your area.');
  if (t.roads && t.lanes/t.roads < 0.2) tips.push('Most roads have no lane count in OpenStreetMap; the game uses its usual widths for those.');
  if (tips.length) h += '<p class="muted">' + tips.join('<br>') + '</p>';
  $('report').innerHTML = h;
  $('exSingle').disabled = !S.single; $('exSingleNote').innerHTML = S.single ? 'Opens in today\'s game with <i>Load map file</i>. ' + fmtMB(S.single.length) + '.' : 'Only for areas up to 2 miles (this one is ' + M.region.miles + ').';
}

/* ---------------- export ---------------- */
function download(name, blob){
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000);
}
async function squaresOf(proj){
  var keys = await L.dbKeys('squares', proj + ':'), out = [];
  for (var i = 0; i < keys.length; i++){ var p = keys[i].split(':'); out.push({i:+p[p.length - 2], j:+p[p.length - 1], text:await L.dbGet('squares', keys[i])}); }
  return out;
}
$('exAsmap').addEventListener('click', async function(){
  if (!S.man) return; var b = this; b.disabled = true; b.textContent = 'Packing...';
  try {
    var enc = new TextEncoder(), sq = await squaresOf(S.proj), M = S.man, ents = [];
    var man = JSON.parse(JSON.stringify(M)); man.kind = 'afterstreet-map'; man.required = []; man.layers = {base:'squares/', edits:null, game:null, models:null};
    ents.push({name:'manifest.json', data:enc.encode(JSON.stringify(man, null, 1))});
    ents.push({name:'CREDITS.txt', data:enc.encode('Map: ' + M.region.name + '\nMade with AfterStreet Maps Builder ' + L.VERSION + ' on ' + M.made + '\n\n' + M.attribution + '\n\nOpenStreetMap data is available under the Open Database Licence: https://www.openstreetmap.org/copyright\n' +
      (M.stats && M.stats.overture ? 'Overture Maps data: https://docs.overturemaps.org/attribution/\n' : '') + 'USGS 3DEP elevation is in the public domain.\nBuildings tagged generated=yes are made up by the builder where the data had nothing.\n')});
    ents.push({name:'README.txt', data:enc.encode('This is an AfterStreet map file (a zip). Open it in the AfterStreet game or the Maps Builder.\nmanifest.json describes the map; squares/I_J.json are the game\'s map squares (0.05 degree squares around the centre).\n')});
    sq.forEach(function(q){ ents.push({name:'squares/' + q.i + '_' + q.j + '.json', data:enc.encode(q.text)}); });
    /* compressed with fflate (101arrowz/fflate, MIT): map squares shrink several times. A few at a time, so the page stays responsive */
    var raw = 0, packed = 0;
    for (var k = 0; k < ents.length; k++){
      if (L.fflate) ents[k].z = L.fflate.deflateSync(ents[k].data, {level:6});
      raw += ents[k].data.length; packed += (ents[k].z || ents[k].data).length;
      if (k % 8 === 7){ b.textContent = 'Packing ' + Math.round(k/ents.length*100) + '%'; await new Promise(function(r){ setTimeout(r, 0); }); }
    }
    download(slug(M.region.name) + '.asmap', new Blob(L.zipParts(ents), {type:'application/zip'}));
    toast('Map file saved: ' + sq.length + ' squares, ' + fmtMB(packed) + (packed < raw ? ' (' + fmtMB(raw) + ' before packing)' : '') + '.', 5);
  } catch (e){ toast('Could not pack the map file: ' + e.message, 6); }
  b.disabled = false; b.textContent = 'Save map file (.asmap)';
});
$('exSingle').addEventListener('click', function(){ if (S.single) download(slug(S.man.region.name) + '.json', new Blob([S.single], {type:'application/json'})); });
$('exGame').addEventListener('click', async function(){
  if (!S.man) return; var b = this; b.disabled = true;
  try {
    var R = S.man.region, sq = await squaresOf(S.proj);
    var db = await new Promise(function(res, rej){ var q = indexedDB.open('afterstreet', 1); q.onupgradeneeded = function(){ if (!q.result.objectStoreNames.contains('zones')) q.result.createObjectStore('zones'); }; q.onsuccess = function(){ res(q.result); }; q.onerror = function(){ rej(q.error); }; });
    await new Promise(function(res, rej){
      var tx = db.transaction('zones', 'readwrite'), st = tx.objectStore('zones');
      st.delete(IDBKeyRange.bound(R.id + ':', R.id + ':￿'));
      sq.forEach(function(q){ st.put(q.text, R.id + ':' + q.i + ':' + q.j); });
      tx.oncomplete = res; tx.onerror = tx.onabort = function(){ rej(tx.error || new Error('the device storage is full')); };
    });
    db.close();
    var list = []; try { list = JSON.parse(lsGet('lastblock:regions') || '[]'); if (!Array.isArray(list)) list = []; } catch (e){}
    list = list.filter(function(r){ return r && r.id !== R.id; });
    list.push({id:R.id, name:R.name, lat:R.lat, lon:R.lon, miles:R.miles, dLat:R.dLat, dLon:R.dLon, last:null, builder:L.VERSION});
    lsSet('lastblock:regions', JSON.stringify(list));
    toast('Sent: open the game, then Regions, and play ' + R.name + '.', 6);
  } catch (e){ toast('Could not send it to the game: ' + e.message, 6); }
  b.disabled = false;
});
/* opening a map file back into the builder */
$('openAsmap').addEventListener('change', async function(){
  var f = this.files[0]; this.value = ''; if (!f) return;
  try {
    var z = await L.unzip(f), man = JSON.parse(await z.text('manifest.json') || 'null'); if (!man || !man.region) throw new Error('it has no map description');
    var proj = man.region.id; S.proj = proj; S.man = man; S.single = null;
    await L.dbDel('squares', proj + ':');
    var F = {ways:[], pois:[]}, seen = new Set(), names = z.names.filter(function(n){ return /^squares\/-?\d+_-?\d+\.json$/.test(n); });
    for (var i = 0; i < names.length; i++){
      var tx = await z.text(names[i]), ij = names[i].match(/(-?\d+)_(-?\d+)/); await L.dbPut('squares', proj + ':' + ij[1] + ':' + ij[2], tx);
      var m = JSON.parse(tx); (m.ways || []).forEach(function(w){ var k = w[1].slice(0, 4).join(',') + w[1].length; if (seen.has(k)) return; seen.add(k); F.ways.push({t:w[0], c:w[1], poly:w[1].length >= 8 && w[1][0] === w[1][w[1].length - 2] && w[1][1] === w[1][w[1].length - 1] && !(w[0].highway || w[0].barrier || w[0].railway || w[0].waterway), src:w[0].generated ? 'gen' : w[0].src === 'overture' ? 'overture' : 'osm'}); });
      $('stage').textContent = 'Opening ' + f.name + ': ' + (i + 1) + ' of ' + names.length;
    }
    var pv = L.preview(F, L.local(man.region.lat, man.region.lon));
    setArea({lat:man.region.lat, lon:man.region.lon, miles:man.region.miles, name:man.region.name});
    setPreview(pv, man.region); saveState();
    L.dbPut('projects', proj, {id:proj, man:man, single:null, saved:Date.now()}).catch(function(){}); L.dbPut('preview', proj, {p:pv, region:man.region}).catch(function(){});
    $('stage').textContent = 'Opened ' + f.name + '. To rebuild it, add the map data again in step 2.'; report(); fitArea();
  } catch (e){ toast('Could not open ' + f.name + ': ' + e.message, 6); }
});

/* ---------------- the flat preview map ---------------- */
var cv = $('map2d'), cx = cv.getContext('2d'), DPR = 1, V = {x:0, y:0, s:0.05}, PV = null, needDraw = true, tiles = new Map(), useTiles = false;
/* view origin: the built map's centre if there is one, else the area centre. x east, y north, metres */
function origin(){ return PV ? PV.region : S.area; }
function O(){ var o = origin(); return L.local(o.lat, o.lon); }
function setPreview(p, region){ PV = {p:p, region:{lat:region.lat, lon:region.lon}}; $('legend').classList.remove('hidden'); drawSoon(); }
function resize(){ DPR = Math.min(2, window.devicePixelRatio || 1); var r = cv.getBoundingClientRect(); cv.width = Math.max(1, r.width*DPR); cv.height = Math.max(1, r.height*DPR); drawSoon(); }
window.addEventListener('resize', resize);
function fitArea(){ var o = O(), c = o.m(S.area.lon, S.area.lat), r = S.area.miles*1609*1.1, w = cv.width/DPR, h = cv.height/DPR; V.x = c[0]; V.y = c[1]; V.s = Math.min(w, h)/(2*r); drawSoon(); }
function drawSoon(){ if (needDraw) return; needDraw = true; requestAnimationFrame(draw); }
function toScr(x, y){ return [(x - V.x)*V.s + cv.width/DPR/2, -(y - V.y)*V.s + cv.height/DPR/2]; }
function toM(sx, sy){ return [(sx - cv.width/DPR/2)/V.s + V.x, -(sy - cv.height/DPR/2)/V.s + V.y]; }
function note(t){ var n = $('mapNote'); n.textContent = t; n.classList.toggle('hidden', !t); }
var SEGC = {1:['#c67139', 2.2], 2:['#8a7f72', 1.2], 3:['#b9ab97', 0.8], 4:['#cdbfa9', 0.6], 5:['#56504a', 1.4], 6:['#5f8a9a', 1.4], 7:['#8a6a8a', 0.7]};
var POLC = {1:'#3d3833', 2:'#5f8a9a', 3:'#c8452c', 4:'#8fb0bd', 5:'#b9c49a'};
function draw(){
  needDraw = false; var w = cv.width/DPR, h = cv.height/DPR, o = O();
  cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.fillStyle = '#ece0cb'; cx.fillRect(0, 0, w, h);
  if (useTiles) drawTiles(o, w, h);
  var a = toM(0, h), b = toM(w, 0), x0 = a[0], y0 = a[1], x1 = b[0], y1 = b[1];
  if (PV){
    var p = PV.p, pts = p.pts, of = p.pofs, small = V.s < 0.03;
    for (var pass = 0; pass < 2; pass++){   /* land and water first, then buildings */
      for (var k = 0; k < p.pcls.length; k++){
        var c = p.pcls[k]; if ((pass === 0) !== (c >= 4)) continue; if (c <= 3 && small) continue;
        var s0 = of[k], s1 = of[k + 1], bx0 = 1e18, by0 = 1e18, bx1 = -1e18, by1 = -1e18;
        for (var q = s0; q < s1; q++){ var px = pts[q*2], py = pts[q*2 + 1]; if (px < bx0) bx0 = px; if (px > bx1) bx1 = px; if (py < by0) by0 = py; if (py > by1) by1 = py; }
        if (bx1 < x0 || bx0 > x1 || by1 < y0 || by0 > y1) continue;
        cx.beginPath(); for (var q2 = s0; q2 < s1; q2++){ var sp = toScr(pts[q2*2], pts[q2*2 + 1]); if (q2 === s0) cx.moveTo(sp[0], sp[1]); else cx.lineTo(sp[0], sp[1]); }
        cx.fillStyle = POLC[c]; cx.fill();
      }
    }
    var sg = p.segs, sc = p.scls, cur = -1;
    for (var cl = 7; cl >= 1; cl--){
      if (small && (cl === 3 || cl === 4)) continue; var st = SEGC[cl]; cx.strokeStyle = st[0]; cx.lineWidth = st[1]*(V.s > 0.5 ? 1.6 : 1); cx.beginPath(); cur = 0;
      for (var i = 0; i < sc.length; i++){
        if (sc[i] !== cl) continue; var ax = sg[i*4], ay = sg[i*4 + 1], bx = sg[i*4 + 2], by = sg[i*4 + 3];
        if ((ax < x0 && bx < x0) || (ax > x1 && bx > x1) || (ay < y0 && by < y0) || (ay > y1 && by > y1)) continue;
        var p0 = toScr(ax, ay), p1 = toScr(bx, by); cx.moveTo(p0[0], p0[1]); cx.lineTo(p1[0], p1[1]); cur++;
      }
      if (cur) cx.stroke();
    }
  }
  /* the area: circle and its map squares */
  var c0 = o.m(S.area.lon, S.area.lat), R = L.regionOf({id:'x', name:'x', lat:S.area.lat, lon:S.area.lon, miles:S.area.miles});
  cx.setLineDash([4, 4]); cx.strokeStyle = 'rgba(61,48,41,.35)'; cx.lineWidth = 1;
  R.squares.forEach(function(q){ var bb = R.box(q[0], q[1]), p0 = o.m(bb.w, bb.s), p1 = o.m(bb.e, bb.n), s0 = toScr(p0[0], p0[1]), s1 = toScr(p1[0], p1[1]); cx.strokeRect(s0[0], s1[1], s1[0] - s0[0], s0[1] - s1[1]); });
  cx.setLineDash([]); var sc0 = toScr(c0[0], c0[1]);
  cx.strokeStyle = '#c67139'; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(sc0[0], sc0[1], S.area.miles*1609*V.s, 0, Math.PI*2); cx.stroke();
  cx.fillStyle = '#c67139'; cx.beginPath(); cx.arc(sc0[0], sc0[1], 5, 0, Math.PI*2); cx.fill();
  /* elevation file outlines */
  cx.strokeStyle = '#5f8a9a'; cx.lineWidth = 1.5;
  S.tiffInfo.forEach(function(t){ var bb = t.T.bbox, p0 = o.m(bb[0], bb[1]), p1 = o.m(bb[2], bb[3]), s0 = toScr(p0[0], p0[1]), s1 = toScr(p1[0], p1[1]); cx.strokeRect(s0[0], s1[1], s1[0] - s0[0], s0[1] - s1[1]); });
  /* scale bar */
  var mi = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20].filter(function(v){ return v*1609*V.s < 140; }).pop() || 0.1, px2 = mi*1609*V.s;
  cx.fillStyle = 'rgba(32,30,29,.8)'; cx.fillRect(w - px2 - 16, h - 40, px2, 3); cx.font = '12px system-ui, sans-serif'; cx.fillText(mi + ' mi', w - px2 - 16, h - 46);
}
/* street map underlay (online): OpenStreetMap's standard tiles, for finding the area */
function drawTiles(o, w, h){
  var lat = origin().lat, mpp = 1/V.s, z = Math.max(3, Math.min(18, Math.round(Math.log2(156543.03*Math.cos(lat*Math.PI/180)/mpp)))), n = Math.pow(2, z);
  var a = toM(0, h), b = toM(w, 0), ll0 = o.ll(a[0], a[1]), ll1 = o.ll(b[0], b[1]);
  var tx = function(lon){ return (lon + 180)/360*n; }, ty = function(la){ var r = la*Math.PI/180; return (1 - Math.log(Math.tan(r) + 1/Math.cos(r))/Math.PI)/2*n; };
  var lonOf = function(x){ return x/n*360 - 180; }, latOf = function(y){ return Math.atan(Math.sinh(Math.PI*(1 - 2*y/n)))*180/Math.PI; };
  var X0 = Math.floor(tx(ll0[0])), X1 = Math.floor(tx(ll1[0])), Y0 = Math.floor(ty(ll1[1])), Y1 = Math.floor(ty(ll0[1]));
  if ((X1 - X0 + 1)*(Y1 - Y0 + 1) > 120) return;
  cx.globalAlpha = 0.85;
  for (var X = X0; X <= X1; X++) for (var Y = Y0; Y <= Y1; Y++){
    var key = z + '/' + X + '/' + Y, im = tiles.get(key);
    if (!im){ im = new Image(); im.crossOrigin = 'anonymous'; im.onload = drawSoon; im.src = 'https://tile.openstreetmap.org/' + key + '.png'; tiles.set(key, im); if (tiles.size > 300){ tiles.delete(tiles.keys().next().value); } }
    if (!im.complete || !im.naturalWidth) continue;
    var p0 = o.m(lonOf(X), latOf(Y)), p1 = o.m(lonOf(X + 1), latOf(Y + 1)), s0 = toScr(p0[0], p0[1]), s1 = toScr(p1[0], p1[1]);
    cx.drawImage(im, s0[0], s0[1], s1[0] - s0[0] + 0.5, s1[1] - s0[1] + 0.5);
  }
  cx.globalAlpha = 1;
}
$('tilesBtn').addEventListener('click', function(){ useTiles = !useTiles; this.classList.toggle('on', useTiles); if (useTiles && !navigator.onLine) toast('The street map needs an internet connection.'); drawSoon(); });
$('zIn').addEventListener('click', function(){ V.s *= 1.6; drawSoon(); });
$('zOut').addEventListener('click', function(){ V.s /= 1.6; drawSoon(); });
$('fit').addEventListener('click', fitArea);
/* touch, pen and mouse: drag to move, pinch or wheel to zoom, tap to set the centre when that is on */
var ptrs = new Map(), downAt = null, pinch = null;
cv.addEventListener('pointerdown', function(e){ cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]); downAt = ptrs.size === 1 ? [e.offsetX, e.offsetY, Date.now()] : null; if (ptrs.size === 2){ var p = Array.from(ptrs.values()); pinch = {d:Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), s:V.s}; } });
cv.addEventListener('pointermove', function(e){
  if (!ptrs.has(e.pointerId)) return; var prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]);
  if (ptrs.size === 1){ V.x -= (e.offsetX - prev[0])/V.s; V.y += (e.offsetY - prev[1])/V.s; drawSoon(); }
  else if (ptrs.size === 2 && pinch){ var p = Array.from(ptrs.values()), d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]); V.s = Math.max(0.0005, Math.min(20, pinch.s*d/pinch.d)); drawSoon(); }
});
function up(e){
  var was = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
  if (downAt && was && Math.hypot(was[0] - downAt[0], was[1] - downAt[1]) < 6 && Date.now() - downAt[2] < 600 && tapMode){
    var m = toM(was[0], was[1]), ll = O().ll(m[0], m[1]); setArea({lat:ll[1], lon:ll[0]}); tapMode = false; $('tapSet').classList.remove('on'); note('');
  }
  downAt = null;
}
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('wheel', function(e){ e.preventDefault(); var m0 = toM(e.offsetX, e.offsetY); V.s = Math.max(0.0005, Math.min(20, V.s*Math.pow(1.0015, -e.deltaY))); var m1 = toM(e.offsetX, e.offsetY); V.x += m0[0] - m1[0]; V.y += m0[1] - m1[1]; drawSoon(); }, {passive:false});

/* ---------------- start: restore the last map (autosaved on this device) ---------------- */
areaUI(); setOsm(null); ovtUI(); $('optFill').checked = S.opts.fill; $('optStep').value = String(S.opts.step); resize(); fitArea();
if (S.proj){
  Promise.all([L.dbGet('projects', S.proj), L.dbGet('preview', S.proj)]).then(function(r){
    if (!r[0] || !r[0].man) return; S.man = r[0].man; S.single = r[0].single || null;
    if (r[1] && r[1].p) setPreview(r[1].p, r[1].region);
    report(); $('stage').textContent = 'Your last map is loaded. Add the map data again to rebuild it.'; drawSoon();
  }).catch(function(){});
}
needDraw = false; drawSoon();
})();
