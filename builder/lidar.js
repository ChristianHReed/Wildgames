/* AfterStreet Maps Builder: lidar. Reads LAS and LAZ point clouds (the airborne lidar that USGS 3DEP, national mapping agencies and many cities publish free)
   and turns them into things the map can use: real heights and roof shapes for buildings, and real trees (position, height, crown width).
   LAZ is unpacked with laz-perf (Apache-2.0, lib/lazperf.js); LAS is read straight. Classic script, same pattern as the other libraries. */
window.BLIB = window.BLIB || {};
window.BLIB.lidar = function(L){
'use strict';
var CH = 128, CHN = CH*CH, CELL = 1;   /* the point grid: 1 m cells in the map's own flat metres, kept in 128 x 128 blocks so only covered ground costs memory */
var dv = function(buf){ return new DataView(buf.buffer || buf, buf.byteOffset || 0, buf.byteLength); };
var str = function(d, o, n){ var s = ''; for (var i = 0; i < n; i++){ var c = d.getUint8(o + i); if (!c) break; s += String.fromCharCode(c); } return s; };

/* ---- the header and the coordinate system ---- */
/* returns {name, ver, fmt, len, compressed, count, off, scale, offset, box:[minX,minY,maxX,maxY,minZ,maxZ], epsg, proj, zk} or throws a sentence the page can show */
L.lidarOpen = async function(file){
  var head = new Uint8Array(await file.slice(0, 375).arrayBuffer()), d = dv(head);
  if (head.length < 227 || str(d, 0, 4) !== 'LASF') throw new Error(file.name + ' is not a LAS or LAZ lidar file');
  var H = {name:file.name, size:file.size, ver:d.getUint8(24) + '.' + d.getUint8(25), hsize:d.getUint16(94, true), off:d.getUint32(96, true), nvlr:d.getUint32(100, true), fmtRaw:d.getUint8(104), len:d.getUint16(105, true)};
  H.compressed = !!(H.fmtRaw & 0x80) || /\.laz$/i.test(file.name); H.fmt = H.fmtRaw & 0x3f;
  H.count = d.getUint32(107, true);
  if (d.getUint8(25) >= 4 && head.length >= 375){ var lo = d.getUint32(247, true), hi = d.getUint32(251, true); if (lo || hi) H.count = hi*4294967296 + lo; }
  H.scale = [d.getFloat64(131, true), d.getFloat64(139, true), d.getFloat64(147, true)];
  H.offset = [d.getFloat64(155, true), d.getFloat64(163, true), d.getFloat64(171, true)];
  H.box = [d.getFloat64(187, true), d.getFloat64(203, true), d.getFloat64(179, true), d.getFloat64(195, true), d.getFloat64(211, true), d.getFloat64(219, true)];   /* minX minY maxX maxY minZ maxZ */
  if (H.fmt > 10) throw new Error(file.name + ': point format ' + H.fmt + ' is not one this builder reads');
  /* the variable length records (where the coordinate system is) */
  var vb = new Uint8Array(await file.slice(H.hsize, H.off).arrayBuffer()), vd = dv(vb), p = 0, keys = null, wkt = '', zip = false;
  for (var i = 0; i < H.nvlr && p + 54 <= vb.length; i++){
    var uid = str(vd, p + 2, 16), rid = vd.getUint16(p + 18, true), rl = vd.getUint16(p + 20, true), q = p + 54;
    if (uid === 'LASF_Projection' && rid === 34735){ keys = {}; var nk = vd.getUint16(q + 6, true); for (var k = 0; k < nk; k++){ var b = q + 8 + k*8; keys[vd.getUint16(b, true)] = vd.getUint16(b + 6, true); } }
    else if (uid === 'LASF_Projection' && (rid === 2112 || rid === 2111)) wkt = str(vd, q, rl);
    else if (uid === 'laszip encoded' && rid === 22204) zip = true;
    p = q + rl;
  }
  if (zip) H.compressed = true;
  var epsg = 0, vunit = 1;
  if (keys){
    var model = keys[1024]; epsg = model === 2 ? (keys[2048] || 0) : (keys[3072] || 0);
    if (keys[4099] === 9002 || keys[4099] === 9003) vunit = keys[4099] === 9002 ? 0.3048 : 0.3048006096;
    else if (!keys[4099] && (keys[3076] === 9002 || keys[3076] === 9003)) vunit = keys[3076] === 9002 ? 0.3048 : 0.3048006096;
  }
  if (!epsg && wkt){   /* the last EPSG id in the text is the whole coordinate system's (the datum and units come first) */
    var m, re = /(?:ID\s*\[\s*"EPSG"\s*,\s*(\d+)\s*\]|AUTHORITY\s*\[\s*"EPSG"\s*,\s*"(\d+)"\s*\])/g, last = 0; while ((m = re.exec(wkt))) last = +(m[1] || m[2]);
    epsg = last; if (/VERT_CS|VERTCRS/i.test(wkt) && /foot|ftUS/i.test(wkt.slice(wkt.search(/VERT_CS|VERTCRS/i)))) vunit = 0.3048;
  }
  H.epsg = epsg; H.vunit = vunit;
  var bx = H.box; if (!epsg){ if (bx[0] >= -180 && bx[2] <= 180 && bx[1] >= -90 && bx[3] <= 90) epsg = 4326; }
  H.proj = epsg ? L.projOf(epsg) : null;
  if (!H.proj) throw new Error(file.name + ': ' + (epsg ? 'its coordinate system (EPSG ' + epsg + ') is not one this builder knows. It knows WGS84 and NAD83 latitude and longitude, UTM zones, and Web Mercator. Ask the data provider for a UTM version, or reproject it first' : 'it does not say what coordinate system it uses'));
  H.epsg = epsg; return H;
};

/* ---- the point grid ---- */
/* grid: stores, per 1 m cell in local metres, the lowest ground return, the highest building return, the highest vegetation return, and the highest of everything else */
L.lidarGrid = function(){
  var G = {chunks:new Map(), n:0, cls:{}, bbox:[1e9, 1e9, -1e9, -1e9]};
  var key = function(ci, cj){ return (ci + 32768)*65536 + (cj + 32768); };
  G.chunk = function(ci, cj, make){
    var k = key(ci, cj), c = G.chunks.get(k);
    if (!c && make){ c = {g:new Float32Array(CHN).fill(Infinity), b:new Float32Array(CHN).fill(-Infinity), v:new Float32Array(CHN).fill(-Infinity), o:new Float32Array(CHN).fill(-Infinity), n:new Uint16Array(CHN)}; G.chunks.set(k, c); }
    return c;
  };
  /* cls: LAS class (2 ground, 3 4 5 vegetation, 6 building, 1 and 0 unclassified); x y are local metres, z metres */
  G.add = function(x, y, z, cls){
    var cx = Math.floor(x/CELL), cy = Math.floor(y/CELL), ci = cx >> 7, cj = cy >> 7, c = G.chunk(ci, cj, true), ix = (cy - cj*CH)*CH + (cx - ci*CH);
    if (cls === 2){ if (z < c.g[ix]) c.g[ix] = z; }
    else if (cls === 6){ if (z > c.b[ix]) c.b[ix] = z; }
    else if (cls >= 3 && cls <= 5){ if (z > c.v[ix]) c.v[ix] = z; }
    else if (cls === 0 || cls === 1 || cls === 8){ if (z > c.o[ix]) c.o[ix] = z; }
    else return;   /* noise (7, 18), water (9), rail, wire and so on are not used */
    c.n[ix]++; G.n++; G.cls[cls] = (G.cls[cls] || 0) + 1;
  };
  var cell = function(x, y){ var cx = Math.floor(x/CELL), cy = Math.floor(y/CELL), ci = cx >> 7, cj = cy >> 7, c = G.chunk(ci, cj, false); return c ? {c:c, i:(cy - cj*CH)*CH + (cx - ci*CH)} : null; };
  G.covered = function(x, y){ var q = cell(x, y); return !!(q && q.c.n[q.i]); };
  /* the ground height at a spot: the nearest ground return within 20 m, or NaN */
  G.ground = function(x, y){
    for (var r = 0; r <= 20; r += (r < 3 ? 1 : 3)){
      var best = Infinity, steps = Math.max(1, r*4);
      for (var s = 0; s < steps; s++){ var a = s/steps*6.2832, q = cell(x + Math.cos(a)*r, y + Math.sin(a)*r); if (q && q.c.g[q.i] < best) best = q.c.g[q.i]; if (r === 0) break; }
      if (best < Infinity) return best;
    }
    return NaN;
  };
  /* the top of whatever stands at a spot: building return, else vegetation, else other */
  G.topAt = function(x, y){ var q = cell(x, y); if (!q) return {b:-Infinity, v:-Infinity, o:-Infinity}; return {b:q.c.b[q.i], v:q.c.v[q.i], o:q.c.o[q.i]}; };
  return G;
};

/* ---- reading the points ---- */
/* local(x, y) for a header: LAS x y in the file's coordinate system to local metres. Geographic files go straight through; projected ones use the exact projection at the file's centre and its slope in x and y (a tile is a few km, so the error stays under a few centimetres) */
L.lidarLocal = function(H, loc){
  if (H.proj.deg) return function(x, y){ return loc.m(x, y); };
  var cx = (H.box[0] + H.box[2])/2, cy = (H.box[1] + H.box[3])/2, st = 100, f = function(x, y){ var a = H.proj.inv(x, y); return loc.m(a[0], a[1]); };
  var o = f(cx, cy), ex = f(cx + st, cy), ey = f(cx, cy + st), a = (ex[0] - o[0])/st, b = (ex[1] - o[1])/st, c = (ey[0] - o[0])/st, d = (ey[1] - o[1])/st;
  return function(x, y){ var dx = x - cx, dy = y - cy; return [o[0] + a*dx + c*dy, o[1] + b*dx + d*dy]; };
};
/* put every point of a file that lands inside box [x0, y0, x1, y1] (local metres) into the grid. LAS is read in slices; LAZ is unpacked whole (laz-perf needs the whole file in memory) */
L.lidarRead = async function(H, file, loc, box, grid, progress, stop){
  var to = L.lidarLocal(H, loc), N = H.count, sx = H.scale[0], sy = H.scale[1], sz = H.scale[2], ox = H.offset[0], oy = H.offset[1], oz = H.offset[2], vu = H.vunit;
  var big = H.fmt >= 6, clsAt = big ? 16 : 15, len = H.len, kept = 0;
  var take = function(rec, d, o){   /* one point: d is a DataView, o its start */
    var x = d.getInt32(o, true)*sx + ox, y = d.getInt32(o + 4, true)*sy + oy, z = (d.getInt32(o + 8, true)*sz + oz)*vu;
    var cb = d.getUint8(o + clsAt), cls = big ? cb : (cb & 31);
    if (!big && (cb & 128)) return;   /* withheld */
    if (big && (d.getUint8(o + 15) & 0x04)) return;   /* withheld is bit 2 of the classification flags byte in formats 6 and up */
    var q = to(x, y); if (q[0] < box[0] || q[0] > box[2] || q[1] < box[1] || q[1] > box[3]) return;
    grid.add(q[0], q[1], z, cls); kept++;
  };
  /* a quick reject by the file's own box, so a tile that is far from the area costs nothing */
  var c4 = [to(H.box[0], H.box[1]), to(H.box[2], H.box[1]), to(H.box[2], H.box[3]), to(H.box[0], H.box[3])], fx0 = Math.min(c4[0][0], c4[1][0], c4[2][0], c4[3][0]), fx1 = Math.max(c4[0][0], c4[1][0], c4[2][0], c4[3][0]), fy0 = Math.min(c4[0][1], c4[1][1], c4[2][1], c4[3][1]), fy1 = Math.max(c4[0][1], c4[1][1], c4[2][1], c4[3][1]);
  if (fx1 < box[0] || fx0 > box[2] || fy1 < box[1] || fy0 > box[3]) return 0;
  if (!H.compressed){
    var per = Math.max(1, Math.floor(16*1048576/len));
    for (var i = 0; i < N; i += per){
      if (stop && stop()) throw new Error('stopped');
      var n = Math.min(per, N - i), buf = new Uint8Array(await file.slice(H.off + i*len, H.off + (i + n)*len).arrayBuffer()), d = new DataView(buf.buffer);
      for (var k = 0; k < n; k++) take(null, d, k*len);
      if (progress) progress(i/N);
    }
    return kept;
  }
  if (!L.lazperf) throw new Error('the LAZ reader (laz-perf) did not load, so ' + H.name + ' cannot be read. A plain .las file works without it');
  var M = await L.lazperf.create(), z = new M.LASZip(), all = new Uint8Array(await file.arrayBuffer()), fp = M._malloc(all.length);
  try {
    M.HEAPU8.set(all, fp); all = null;
    z.open(fp, H.size); var cnt = z.getCount(), pl = z.getPointLength(), dp = M._malloc(pl);
    for (var j = 0; j < cnt; j++){
      if ((j & 0x3ffff) === 0){ if (stop && stop()) throw new Error('stopped'); if (progress) progress(j/cnt); await 0; }
      z.getPoint(dp); var heap = M.HEAPU8; take(null, new DataView(heap.buffer, dp, pl), 0);
    }
    M._free(dp);
  } finally { try { z.delete(); } catch (e){} M._free(fp); }
  return kept;
};

/* ---- from points to things ---- */
var pctl = function(a, p){ if (!a.length) return NaN; a.sort(function(u, v){ return u - v; }); return a[Math.min(a.length - 1, Math.floor(p*(a.length - 1) + 0.5))]; };

/* buildings: for every building footprint the grid covers, a height above the ground and a roof shape, written into the building's tags. Only fills what the footprint does not already state
   (a real height from OpenStreetMap or Overture stays; the lidar one is added as 'asmb:lidar_height' for the report when they differ a lot). Returns counts. */
L.lidarBuildings = function(F, grid, loc){
  var out = {seen:0, set:0, kept:0, flat:0, pitched:0, skipped:0}, bhave = grid.cls[6] > 0;
  F.ways.forEach(function(w){
    var t = w.t; if (!w.poly || !t.building || !w.c || w.c.length < 6) return;
    var ring = []; for (var i = 0; i < w.c.length; i += 2){ var m = loc.m(w.c[i], w.c[i + 1]); ring.push(m[0], m[1]); }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (i = 0; i < ring.length; i += 2){ if (ring[i] < x0) x0 = ring[i]; if (ring[i] > x1) x1 = ring[i]; if (ring[i + 1] < y0) y0 = ring[i + 1]; if (ring[i + 1] > y1) y1 = ring[i + 1]; }
    if (!grid.covered((x0 + x1)/2, (y0 + y1)/2) && !grid.covered(ring[0], ring[1])){ out.skipped++; return; }
    out.seen++;
    /* ground: the lowest ground return in a ring 2 m outside the walls (the footprint itself has no ground returns) */
    var gs = [], tops = [], nIn = 0;
    for (var y = Math.floor(y0); y <= y1; y++) for (var x = Math.floor(x0); x <= x1; x++){
      if (!L.pip(ring, x + 0.5, y + 0.5)) continue;
      nIn++; var T = grid.topAt(x + 0.5, y + 0.5), top = bhave ? T.b : Math.max(T.b, T.o); if (top > -Infinity) tops.push(top);
    }
    /* ground by sampling the border cells outside the footprint, within 4 m of it */
    for (i = 0; i < ring.length; i += 2){
      var ax = ring[i], ay = ring[i + 1], bx = ring[(i + 2) % ring.length], by = ring[(i + 3) % ring.length], dl = Math.hypot(bx - ax, by - ay) || 1, stp = Math.max(1, Math.floor(dl/2));
      var nx = -(by - ay)/dl, ny = (bx - ax)/dl, sgn = L.area(ring) > 0 ? 1 : -1;
      for (var s = 0; s <= stp; s++){ var px = ax + (bx - ax)*s/stp, py = ay + (by - ay)*s/stp, qx = px + nx*sgn*2.5, qy = py + ny*sgn*2.5;
        if (L.pip(ring, qx, qy)) { qx = px - nx*sgn*2.5; qy = py - ny*sgn*2.5; if (L.pip(ring, qx, qy)) continue; }
        var g2 = grid.ground(qx, qy); if (g2 === g2) gs.push(g2); }
    }
    if (tops.length < 4 || gs.length < 3){ out.skipped++; return; }
    var gr = pctl(gs, 0.3), hs = tops.map(function(v){ return v - gr; }).filter(function(v){ return v > 0.5; });
    if (hs.length < 4 || hs.length < nIn*0.25){ out.skipped++; return; }   /* too few roof returns: a shed under trees, a plane that missed it */
    var top95 = pctl(hs.slice(), 0.95), p20 = pctl(hs.slice(), 0.2), p50 = pctl(hs.slice(), 0.5), spread = top95 - p20;
    if (top95 < 2 || top95 > 600) { out.skipped++; return; }
    var have = parseFloat(t.height) || (parseInt(t['building:levels'], 10) > 0 ? parseInt(t['building:levels'], 10)*3.2 : 0);
    var flat = spread < 0.9 || spread < 0.12*top95, h;
    if (flat){ h = Math.round(p50*10)/10; }
    else { var eave = pctl(hs.slice(), 0.15); h = Math.round(eave*10)/10; t['roof:height'] = String(Math.max(0.8, Math.round((top95 - eave)*10)/10)); }
    t['asmb:lidar'] = 'yes';
    if (t.height && Math.abs(parseFloat(t.height) - h) > 3){ t['asmb:lidar_height'] = String(h); out.kept++; }
    else { t.height = String(h); out.set++; }
    if (!t['roof:shape']){ t['roof:shape'] = flat ? 'flat' : 'gabled'; }
    if (flat) out.flat++; else out.pitched++;
    void have;
  });
  return out;
};

/* trees: local maxima of the canopy height model (vegetation top minus ground), not inside buildings. Position, height, and crown width from where the canopy falls to half its peak */
L.lidarTrees = function(F, grid, loc, box, opts){
  opts = opts || {};
  var minH = opts.minHeight || 3, out = {trees:0, skipped:0, mean:0}, W = Math.ceil(box[2] - box[0]), Ht = Math.ceil(box[3] - box[1]);
  if (!(grid.cls[3] || grid.cls[4] || grid.cls[5]) && !(grid.cls[1] || grid.cls[0])) return out;
  var haveVeg = (grid.cls[3] || 0) + (grid.cls[4] || 0) + (grid.cls[5] || 0) > 0;
  /* a plain grid of the canopy height over the area, in blocks of 1024 so a big area stays small */
  var bx = Math.floor(box[0]), by = Math.floor(box[1]), chm = function(x, y){
    var T = grid.topAt(x, y), v = haveVeg ? T.v : T.o; if (!(v > -Infinity)) return 0; if (haveVeg && T.b > -Infinity && T.b >= v) return 0;
    var g = grid.ground(x, y); return g === g ? Math.max(0, v - g) : 0; };
  /* buildings out of the way: a cell inside any footprint is not a tree */
  var nbAll = 0; F.ways.forEach(function(w){ if (w.poly && w.t.building && w.c && w.c.length >= 6) nbAll++; });
  var bidx = L.spatial(Math.max(1, nbAll)), brs = [], nb = 0;
  F.ways.forEach(function(w){ if (w.poly && w.t.building && w.c && w.c.length >= 6){ var r = []; for (var i = 0; i < w.c.length; i += 2){ var m = loc.m(w.c[i], w.c[i + 1]); r.push(m[0], m[1]); }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (i = 0; i < r.length; i += 2){ x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); }
    bidx.add(x0 - 1, y0 - 1, x1 + 1, y1 + 1); brs.push(r); nb++; } });
  if (!nb) bidx.add(0, 0, 0, 0); bidx.finish();
  var inBld = function(x, y){ if (!nb) return false; var l = bidx.search(x, y, x, y); for (var i = 0; i < l.length; i++) if (L.pip(brs[l[i]], x, y)) return true; return false; };
  /* existing mapped trees: a lidar tree within 3 m of one is the same tree */
  var tidx = L.spatialGrow ? L.spatialGrow() : null, haveTrees = 0;
  F.pois.forEach(function(p){ if (p.t && p.t.natural === 'tree' && !p.t['asmb:lidar']){ var m = loc.m(p.lon, p.lat); if (tidx) tidx.add([m[0] - 3, m[1] - 3, m[0] + 3, m[1] + 3], {x:m[0], y:m[1]}); haveTrees++; } });
  var near = function(x, y){ if (!tidx) return false; return tidx.any([x - 3, y - 3, x + 3, y + 3], function(q){ return Math.hypot(q.x - x, q.y - y) < 3; }); };
  var cap = opts.cap || 600000, sumH = 0, win = 2;
  /* only walk blocks the grid holds */
  var seen = new Set();
  grid.chunks.forEach(function(c, k){ var ci = Math.floor(k/65536) - 32768, cj = (k % 65536) - 32768; seen.add(ci + ':' + cj); });
  var local = [];
  seen.forEach(function(s){
    var p = s.split(':'), ci = +p[0], cj = +p[1];
    for (var yy = 0; yy < CH; yy++) for (var xx = 0; xx < CH; xx++){
      var x = ci*CH + xx + 0.5, y = cj*CH + yy + 0.5; if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) continue;
      var h = chm(x, y); if (h < minH || h > 80) continue;
      var peak = true;
      for (var dy = -win; dy <= win && peak; dy++) for (var dx = -win; dx <= win; dx++){ if (!dx && !dy) continue; var h2 = chm(x + dx, y + dy); if (h2 > h || (h2 === h && (dy < 0 || (dy === 0 && dx < 0)))){ peak = false; break; } }
      if (!peak) continue;
      if (inBld(x, y)){ out.skipped++; continue; }
      /* crown width: out along eight directions until the canopy drops below half the peak, up to 9 m */
      var rs = 0; for (var a = 0; a < 8; a++){ var ca = Math.cos(a*0.7854), sa = Math.sin(a*0.7854), r = 1; while (r < 9 && chm(x + ca*r, y + sa*r) >= h*0.5) r++; rs += r; }
      var dia = Math.max(2, Math.min(18, Math.round(rs/8*2*10)/10));
      local.push([x, y, h, dia]);
    }
  });
  /* a flat crown can have several maxima: keep the tallest of any two closer than half the crown */
  local.sort(function(a, b){ return b[2] - a[2]; });
  var keptT = L.spatialGrow ? L.spatialGrow() : null, list = [];
  local.forEach(function(q){
    if (list.length >= cap) return;
    if (keptT && keptT.any([q[0] - q[3]/2, q[1] - q[3]/2, q[0] + q[3]/2, q[1] + q[3]/2], function(o){ return Math.hypot(o[0] - q[0], o[1] - q[1]) < Math.min(o[3], q[3])*0.45; })) return;
    if (near(q[0], q[1])) return;
    if (keptT) keptT.add([q[0] - q[3]/2, q[1] - q[3]/2, q[0] + q[3]/2, q[1] + q[3]/2], q);
    list.push(q);
  });
  list.forEach(function(q){
    var ll = loc.ll(q[0], q[1]), conifer = null;
    F.pois.push({lon:ll[0], lat:ll[1], t:{natural:'tree', height:String(Math.round(q[2]*10)/10), diameter_crown:String(q[3]), 'asmb:lidar':'yes', source:'lidar'}});
    sumH += q[2]; out.trees++;
    void conifer;
  });
  out.mean = out.trees ? Math.round(sumH/out.trees*10)/10 : 0; out.existing = haveTrees;
  return out;
};

/* the whole lidar step: open the files, read what lands in the area, make the products. files: File[]; area: [x0, y0, x1, y1] local metres */
L.lidarRun = async function(F, files, loc, area, say, stop, opts){
  opts = opts || {};
  var heads = [], rep = {files:[], points:0, buildings:null, trees:null, cls:{}, warn:[]}, grid = L.lidarGrid();
  for (var i = 0; i < files.length; i++){
    try { var H = await L.lidarOpen(files[i]); heads.push([H, files[i]]); } catch (e){ rep.warn.push(e.message); }
  }
  if (!heads.length) throw new Error(rep.warn.join('; ') || 'no lidar files could be read');
  for (i = 0; i < heads.length; i++){
    var H2 = heads[i][0], f = heads[i][1], n0 = grid.n;
    say(i/heads.length, 'Reading lidar ' + f.name + (H2.compressed ? ' (unpacking LAZ)' : ''));
    var kept = await L.lidarRead(H2, f, loc, area, grid, function(p){ say((i + p)/heads.length, 'Reading lidar ' + f.name + ' ' + Math.round(p*100) + '%'); }, stop);
    rep.files.push({name:f.name, points:H2.count, used:grid.n - n0, fmt:H2.fmt, compressed:H2.compressed, epsg:H2.epsg, crs:H2.proj.name, ver:H2.ver});
    if (!kept) rep.warn.push(f.name + ' has no points inside the chosen area');
  }
  rep.points = grid.n; rep.cls = grid.cls;
  if (!grid.n) throw new Error('none of the lidar points land inside the chosen area. Check that the lidar is for this place' + (rep.warn.length ? ' (' + rep.warn.join('; ') + ')' : ''));
  say(0.9, 'Measuring buildings and finding trees from lidar');
  rep.buildings = L.lidarBuildings(F, grid, loc);
  rep.trees = L.lidarTrees(F, grid, loc, area, opts);
  F.lidarCover = function(x, y){ return grid.covered(x, y); };
  F.lidarGround = grid; rep.hasGround = !!grid.cls[2];
  return rep;
};
};
