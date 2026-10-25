/* AfterStreet Maps Builder: one whole build, run in the background worker. Saves every square to the builder's own storage as it goes,
   so a phone never holds the whole region at once, then reports the map's index, the accuracy report and a light preview.
   Classic script, installs into L (see inflate.js). */
(window.BLIB = window.BLIB || {}).build = function(L){
'use strict';
/* ---- the builder's storage (IndexedDB 'afterstreet-builder'): projects, squares, previews ---- */
L.db = function(){
  return new Promise(function(res, rej){
    var q; try { q = indexedDB.open('afterstreet-builder', 1); } catch (e){ rej(e); return; }
    q.onupgradeneeded = function(){ var d = q.result; ['projects', 'squares', 'preview'].forEach(function(s){ if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); }); };
    q.onsuccess = function(){ res(q.result); }; q.onerror = function(){ rej(q.error || new Error('this browser has no storage for the builder')); };
  });
};
L.dbDo = function(store, mode, fn){ return L.db().then(function(d){ return new Promise(function(res, rej){ var tx = d.transaction(store, mode), rq = fn(tx.objectStore(store)); tx.oncomplete = function(){ d.close(); res(rq ? rq.result : null); }; tx.onerror = tx.onabort = function(){ d.close(); rej(tx.error || new Error('storage failed (the device may be full)')); }; }); }); };
L.dbPut = function(store, key, val){ return L.dbDo(store, 'readwrite', function(s){ return s.put(val, key); }); };
L.dbGet = function(store, key){ return L.dbDo(store, 'readonly', function(s){ return s.get(key); }); };
L.dbKeys = function(store, prefix){ return L.dbDo(store, 'readonly', function(s){ return prefix ? s.getAllKeys(IDBKeyRange.bound(prefix, prefix + '￿')) : s.getAllKeys(); }); };
L.dbDel = function(store, prefix){ return L.dbDo(store, 'readwrite', function(s){ return s.delete(IDBKeyRange.bound(prefix, prefix + '￿')); }); };

/* what the free map server is asked for when the builder downloads a small area itself */
L.overpassQuery = function(b){
  return '[out:json][timeout:180][bbox:' + [b[1], b[0], b[3], b[2]].map(function(v){ return v.toFixed(5); }).join(',') + '];(' +
    'way[building];way["building:part"];way[highway];way[railway];way[waterway];way[natural];way[landuse];way[leisure];way[amenity];way[man_made];way[power];way[barrier];way[aeroway];way[place];way["area:highway"];' +
    'relation[type=multipolygon];' +
    'node[shop];node[amenity];node[healthcare];node[craft];node[office];node[tourism];node[emergency];node[power];node[man_made];node[barrier];node[entrance];node[railway];node[public_transport];node[place];node["addr:housenumber"];' +
    'node[natural~"^(tree|peak|spring)$"];node[highway~"^(traffic_signals|stop|give_way|crossing|street_lamp|bus_stop)$"];);out geom;';
};

/* job: {proj, area:{id,name,lat,lon,miles}, osm:{kind:'pbf'|'xml'|'overpass'|'geojson'|'download', file|text}, tiffs:[File], overture:[File], opts:{fill, step, tiles}} */
L.runBuild = async function(job, post, stop){
  var t0 = Date.now(), A = job.area, R = L.regionOf(A), loc = L.local(A.lat, A.lon), say = function(f, text){ post({t:'progress', f:f, text:text}); };
  var o = job.osm, F, stats = {};
  /* 1. OpenStreetMap */
  say(0, 'Reading OpenStreetMap');
  if (o.kind === 'pbf') F = await L.readPbfArea(o.file, R.read, function(f, txt){ say(f*0.45, txt); }, stop);
  else {
    var text = o.text;
    if (o.kind === 'download'){
      say(0.02, 'Downloading OpenStreetMap for the area (this can take a minute)');
      var r = await fetch('https://overpass-api.de/api/interpreter', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:'data=' + encodeURIComponent(L.overpassQuery(R.read))});
      if (!r.ok) throw new Error('the OpenStreetMap server answered ' + r.status + (r.status === 429 || r.status === 504 ? ' (it is busy; try again in a few minutes, or upload a file)' : ''));
      text = await r.text();
    } else if (!text && o.file) text = await o.file.text();
    say(0.3, 'Reading OpenStreetMap');
    var tt = text.replace(/^﻿/, '').trim();
    if (tt[0] === '<') F = L.readOsmXml(tt, R.read);
    else { var j = JSON.parse(tt); F = j.elements ? L.readOverpass(j, R.read) : L.readGeoJson(j, R.read); }
  }
  if (stop()) throw new Error('stopped');
  stats.osm = {ways:F.ways.length, pois:F.pois.length, places:F.places.length, buildings:F.ways.filter(function(w){ return w.t.building; }).length};
  if (!F.ways.length) throw new Error('the OpenStreetMap data has nothing inside the chosen area. Check that the file is for this place');
  /* 2. Overture buildings */
  if (job.overture && job.overture.length){
    say(0.46, 'Adding Overture buildings'); var ov = [];
    for (var k = 0; k < job.overture.length; k++){ var oj = JSON.parse(await job.overture[k].text()); ov = ov.concat(L.readOverture(oj)); }
    var bw = R.read; ov = ov.filter(function(w){ return w.c[0] >= bw[0] && w.c[0] <= bw[2] && w.c[1] >= bw[1] && w.c[1] <= bw[3]; });
    stats.overture = L.mergeOverture(F, ov, loc);
  }
  /* 3. gaps */
  if (job.opts.fill){ say(0.5, 'Filling gaps in the data with marked made-up homes and farms'); stats.fill = L.fillGaps(F, loc, 6000); }
  /* 4. squares */
  say(0.55, 'Cutting the map into squares');
  var S = L.cutSquares(R, F);
  /* 5. ground, square by square, saved as it goes */
  var tiffs = [];
  for (var q = 0; q < (job.tiffs || []).length; q++){ try { tiffs.push(await L.tiffOpen(job.tiffs[q])); } catch (e){ post({t:'warn', text:job.tiffs[q].name + ': ' + e.message}); } }
  tiffs.sort(function(a, b){ return a.res - b.res; });
  var terr = job.opts.tiles ? L.Terrarium() : null;
  await L.dbDel('squares', job.proj + ':');
  var index = [], rep = {squares:[], tot:{osm:0, overture:0, gen:0, height:0, levels:0, roof:0, addr:0, roads:0, named:0, lanes:0, width:0}, elev:{file:0, tiles:0, none:0}, fileRes:0}, done = 0, total = R.squares.length, bytes = 0;
  var credit = '© OpenStreetMap contributors (ODbL)' + (stats.overture && stats.overture.added ? '; buildings also from Overture Maps (ODbL)' : '') + (tiffs.length ? '; elevation: ' + tiffs.map(function(t){ return t.name; }).join(', ') : '') + (terr ? '; elevation: AWS Terrain Tiles (SRTM/3DEP)' : '');
  for (var s = 0; s < R.squares.length; s++){
    if (stop()) throw new Error('stopped');
    var i = R.squares[s][0], jj = R.squares[s][1], sq = S.get(i + ':' + jj), b = R.box(i, jj);
    var core = Math.hypot(i*R.dLon*Math.cos(R.lat*Math.PI/180)*111.32, jj*R.dLat*110.54) <= 15, step = core ? job.opts.step : Math.max(job.opts.step, 60);
    var eg = await L.elevGrid(R, i, jj, tiffs, terr, step);
    var m = {lastblockMap:1, format:L.FORMAT, name:A.name, attribution:credit, zone:{s:+b.s.toFixed(6), n:+b.n.toFixed(6), w:+b.w.toFixed(6), e:+b.e.toFixed(6)}, ways:sq.ways, pois:sq.pois, elev:eg.grid};
    if (sq.holes.length) m.holes = sq.holes;
    m.builder = {v:L.VERSION, counts:sq.n, elev:eg.src, step:step};
    var text2 = JSON.stringify(m); bytes += text2.length;
    await L.dbPut('squares', job.proj + ':' + i + ':' + jj, text2);
    var nb = sq.n.osm + sq.n.overture + sq.n.gen; index.push([i, jj, nb]);
    for (var kk in rep.tot) rep.tot[kk] += sq.n[kk];
    rep.squares.push([i, jj, sq.n.osm, sq.n.overture, sq.n.gen, sq.n.height, sq.n.levels, sq.n.roads, sq.n.named, eg.src]);
    rep.elev.file += eg.share.file; rep.elev.tiles += eg.share.tiles; rep.elev.none += eg.share.none; if (eg.fileRes && (!rep.fileRes || eg.fileRes < rep.fileRes)) rep.fileRes = eg.fileRes;
    done++; say(0.58 + 0.38*done/total, 'Ground and squares: ' + done + ' of ' + total);
  }
  if (A.miles > 2) tiffs.forEach(function(t){ t.free(); });
  rep.elev.file /= total; rep.elev.tiles /= total; rep.elev.none /= total;
  /* 6. a single map file for small areas (the game's "Load map file" opens it today) */
  var single = null;
  if (A.miles <= 2){
    say(0.97, 'Making the single map file');
    var all = {ways:[], pois:F.pois.map(function(p){ return [Math.round(p.lon*1e6)/1e6, Math.round(p.lat*1e6)/1e6, p.t]; }), holes:[]};
    var rb = R.read, rad = A.miles*1609 + 500, keep = function(w){ var c = w.c; for (var z = 0; z < c.length; z += 2){ var p = loc.m(c[z], c[z + 1]); if (Math.hypot(p[0], p[1]) <= rad) return true; } return false; };
    F.ways.forEach(function(w){ if (!keep(w)) return; all.ways.push([w.t, w.c.map(function(v){ return Math.round(v*1e6)/1e6; })]); if (w.holes) w.holes.forEach(function(h){ all.holes.push([all.ways.length - 1, h.map(function(v){ return Math.round(v*1e6)/1e6; })]); }); });
    var RR = {box:function(){ var d = rad/110540, dx = rad/loc.kx; return {s:A.lat - d, n:A.lat + d, w:A.lon - dx, e:A.lon + dx}; }, my:0, mx:0, lat:A.lat};
    var st2 = Math.max(job.opts.step, Math.ceil(2*rad/1990)), eg2 = await L.elevGrid(RR, 0, 0, tiffs, terr, st2);
    tiffs.forEach(function(t){ t.free(); });
    single = {lastblockMap:1, format:L.FORMAT, name:A.name, attribution:credit, ways:all.ways, pois:all.pois, elev:eg2.grid, spawn:[A.lon, A.lat]};
    if (all.holes.length) single.holes = all.holes;
    single = JSON.stringify(single);
  }
  /* 7. the index, like assets/map.js */
  var man = {format:L.FORMAT, builder:L.VERSION, made:new Date().toISOString(),
    region:{id:A.id, name:A.name, lat:A.lat, lon:A.lon, miles:A.miles, dLat:R.dLat, dLon:R.dLon},
    squares:index, places:F.places, attribution:credit, stats:stats, report:rep, bytes:bytes, ms:Date.now() - t0,
    sources:{osm:o.name || o.kind, tiffs:(job.tiffs || []).map(function(f){ return f.name; }), overture:(job.overture || []).map(function(f){ return f.name; }), tiles:!!terr}};
  say(0.99, 'Drawing the preview');
  var pv = L.preview(F, loc);
  return {man:man, preview:pv, single:single};
};
/* a light 2D preview of the whole map: line segments and polygons in local metres */
L.preview = function(F, loc){
  var segs = [], scls = [], pts = [], pofs = [0], pcls = [];
  var RC = {motorway:1, trunk:1, primary:1, secondary:1, motorway_link:1, trunk_link:1, primary_link:1, secondary_link:1, tertiary:2, tertiary_link:2, residential:2, unclassified:2, living_street:2, service:3, track:3};
  F.ways.forEach(function(w){
    var t = w.t, c = w.c, cls = 0;
    if (w.poly){
      if (t.building) cls = w.src === 'overture' ? 2 : w.src === 'gen' ? 3 : 1;
      else if (t.natural === 'water' || t.waterway || t.landuse === 'reservoir' || t.landuse === 'basin') cls = 4;
      else if (t.natural === 'wood' || t.landuse === 'forest' || t.leisure === 'park' || t.landuse === 'grass' || t.leisure === 'golf_course' || t.landuse === 'meadow' || t.natural === 'scrub') cls = 5;
      else return;
      for (var i = 0; i < c.length; i += 2){ var p = loc.m(c[i], c[i + 1]); pts.push(p[0], p[1]); } pofs.push(pts.length/2); pcls.push(cls); return;
    }
    if (t.highway) cls = RC[t.highway] || 4; else if (t.railway) cls = 5; else if (t.waterway) cls = 6; else if (t.power === 'line' || t.power === 'minor_line') cls = 7; else return;
    var prev = loc.m(c[0], c[1]);
    for (var k = 2; k < c.length; k += 2){ var q = loc.m(c[k], c[k + 1]); segs.push(prev[0], prev[1], q[0], q[1]); scls.push(cls); prev = q; }
  });
  return {segs:new Float32Array(segs), scls:new Uint8Array(scls), pts:new Float32Array(pts), pofs:new Uint32Array(pofs), pcls:new Uint8Array(pcls)};
};
/* the map file: a plain zip (no compression; the squares are already compact), built from parts so it never needs one huge array */
L.zipParts = function(entries){   /* entries: [{name, data:Uint8Array}] -> array of Blob parts */
  var parts = [], central = [], off = 0, enc = new TextEncoder(), dos = function(){ var d = new Date(); return [((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff, (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff]; }(), n = 0;
  entries.forEach(function(e){
    var nm = enc.encode(e.name), crc = L.crc32(e.data), h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dos[0], true); h.setUint16(12, dos[1], true);
    h.setUint32(14, crc, true); h.setUint32(18, e.data.length, true); h.setUint32(22, e.data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(h.buffer, nm, e.data);
    var c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dos[0], true); c.setUint16(14, dos[1], true);
    c.setUint32(16, crc, true); c.setUint32(20, e.data.length, true); c.setUint32(24, e.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    central.push(c.buffer, nm); off += 30 + nm.length + e.data.length; n++;
  });
  var cs = 0; central.forEach(function(p){ cs += p.byteLength; });
  var end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, n, true); end.setUint16(10, n, true); end.setUint32(12, cs, true); end.setUint32(16, off, true);
  return parts.concat(central, [end.buffer]);
};
/* reading a map file back (for opening one in the builder) */
L.unzip = async function(file){
  var size = file.size, tail = new Uint8Array(await file.slice(Math.max(0, size - 65558), size).arrayBuffer()), dv = new DataView(tail.buffer), p = -1;
  for (var i = tail.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50){ p = i; break; }
  if (p < 0) throw new Error('this is not an AfterStreet map file');
  var n = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 12, true), co = dv.getUint32(p + 16, true), cd = new Uint8Array(await file.slice(co, co + cs).arrayBuffer()), cv = new DataView(cd.buffer), out = {}, q = 0, td = new TextDecoder();
  for (var k = 0; k < n; k++){
    var meth = cv.getUint16(q + 10, true), csz = cv.getUint32(q + 20, true), nl = cv.getUint16(q + 28, true), el = cv.getUint16(q + 30, true), cl = cv.getUint16(q + 32, true), lo = cv.getUint32(q + 42, true), name = td.decode(cd.subarray(q + 46, q + 46 + nl));
    out[name] = {meth:meth, size:csz, off:lo}; q += 46 + nl + el + cl;
  }
  return {names:Object.keys(out), text:async function(name){ var e = out[name]; if (!e) return null; var lh = new DataView(await file.slice(e.off, e.off + 30).arrayBuffer()), start = e.off + 30 + lh.getUint16(26, true) + lh.getUint16(28, true), d = new Uint8Array(await file.slice(start, start + e.size).arrayBuffer()); if (e.meth === 8) d = await L.inflate(d, true); return td.decode(d); }};
};
};
