/* AfterStreet Maps Builder: structures. Finds bridges, overpasses, tunnels, culverts, dams and the like in a map square, and writes them as a
   `structures` list beside `ways` and `pois`. What it learns from: the OpenStreetMap tags (bridge, tunnel, layer, waterway=dam, ...) and, where the
   tags are silent, the geometry (a road that crosses a river with no bridge mapped, a motorway crossing a street with no junction).
   The rules and where they come from are in docs/MAP_STRUCTURES.md. Classic script, installs into L (see inflate.js).

   Each entry of `structures`:  {k, w, lon, lat, len, l, src, ...}
     k    what: bridge, tunnel, culvert, passage, ford, overpass, underpass (a tunnel below a road at ground level), dam, weir, lock, gate, fall, pier, ramp, breakwater, dyke, wall, bank, support, bend, check
     w    index of the way in this square's `ways` (for an overpass, the way that goes over; `u` is the way that goes under)
     lon, lat  the middle of it;  len  metres along the way;  l  level (layer): 1 and up over, -1 and down under, 0 on the ground
     src  'osm' (mapped) or 'inferred' (worked out by these rules);  cl  metres of clearance the deck should have over what is under it
     o    what a bridge crosses: water, road, rail, land;  st  how it is built (beam, arch, truss, suspension, movable, ...);  n  name;  h  height in metres
   Only structures whose middle lies inside the square itself are kept, so two squares never list the same one twice. */
(window.BLIB = window.BLIB || {}).structures = function(L){
'use strict';

/* what each kind of way is, for deciding what can pass over what */
var ROADS = {motorway:10, motorway_link:9, trunk:9, trunk_link:8, primary:8, primary_link:7, secondary:7, secondary_link:6, tertiary:6, tertiary_link:5, unclassified:5, residential:5, living_street:4, service:3, track:2, road:4};
var PATHS = {footway:1, path:1, cycleway:1, pedestrian:1, steps:1, bridleway:1, corridor:0};
var RAILS = {rail:1, light_rail:1, tram:1, subway:1, narrow_gauge:1, preserved:1, monorail:1, funicular:1, miniature:1};
var RIVERS = {river:11, canal:8, stream:3, ditch:2, drain:2, brook:3};     /* the widths the game draws (engine/world.js WW) */
var BIGWATER = {river:1, canal:1};
/* clearance a deck keeps over what is under it, metres (the rules Arnis and OSM2World use; see docs/MAP_STRUCTURES.md) */
var CLEAR = {road:6, path:5, rail:8, river:4, stream:2, deck:6};

function num(v){ var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
function isBridge(t){ return !!t.bridge && t.bridge !== 'no' && t.bridge !== 'low_water_crossing' && t.bridge !== 'abandoned' && t.bridge !== 'construction' && t.bridge !== 'retired_road_bridge'; }
function isTunnel(t){ return !!t.tunnel && t.tunnel !== 'no' && t.tunnel !== 'building_passage' && t.tunnel !== 'passage' && t.tunnel !== 'No,_open'; }
function level(t){ var l = num(t.layer); if (isBridge(t)) return Math.max(1, l); if (isTunnel(t)) return Math.min(-1, l); return l; }
function wayClass(t){
  if (t.highway && !t['area:highway'] && t.area !== 'yes'){ if (ROADS[t.highway]) return 'road'; if (PATHS[t.highway]) return 'path'; return null; }
  if (t.railway && RAILS[t.railway] && !t.abandoned && !t.disused) return 'rail';
  if (t.waterway && RIVERS[t.waterway]) return 'water';
  return null;
}
function isWaterArea(t){ return t.natural === 'water' || t.landuse === 'reservoir' || t.landuse === 'basin' || t.waterway === 'riverbank'; }
function rankOf(t){ return t.highway ? (ROADS[t.highway] || 1) : 0; }
function clearOver(cls, t){ return cls === 'rail' ? CLEAR.rail : cls === 'path' ? CLEAR.path : cls === 'water' ? (BIGWATER[t.waterway] ? CLEAR.river : CLEAR.stream) : CLEAR.road; }

/* box: {w, e, s, n} of the square itself; sq: {ways:[[tags, [lon,lat,...]]], pois:[[lon,lat,tags]]}. Returns {list, counts} */
L.structures = function(box, sq, elev){
  var lon0 = (box.w + box.e)/2, lat0 = (box.s + box.n)/2, kx = 111320*Math.cos(lat0*Math.PI/180), ky = 110540, ways = sq.ways, n = ways.length;
  var list = [], counts = {};
  var toM = function(c){ var m = new Array(c.length); for (var i = 0; i < c.length; i += 2){ m[i] = (c[i] - lon0)*kx; m[i + 1] = (c[i + 1] - lat0)*ky; } return m; };
  var inBox = function(x, y){ return x >= (box.w - lon0)*kx && x <= (box.e - lon0)*kx && y >= (box.s - lat0)*ky && y <= (box.n - lat0)*ky; };
  var push = function(r, x, y){
    if (!inBox(x, y)) return false;
    r.lon = Math.round((lon0 + x/kx)*1e6)/1e6; r.lat = Math.round((lat0 + y/ky)*1e6)/1e6; if (r.len !== undefined) r.len = Math.round(r.len);
    list.push(r); var c = counts[r.k] = counts[r.k] || {osm:0, inferred:0}; c[r.src]++; return true;
  };
  /* the length of a way and the point half way along it */
  var half = function(m){ var tot = 0, i; for (i = 0; i + 3 < m.length; i += 2) tot += Math.hypot(m[i + 2] - m[i], m[i + 3] - m[i + 1]); var h = tot/2, acc = 0;
    for (i = 0; i + 3 < m.length; i += 2){ var l = Math.hypot(m[i + 2] - m[i], m[i + 3] - m[i + 1]); if (acc + l >= h && l > 0){ var u = (h - acc)/l; return {len:tot, x:m[i] + (m[i + 2] - m[i])*u, y:m[i + 1] + (m[i + 3] - m[i + 1])*u}; } acc += l; }
    return {len:tot, x:m[0], y:m[1]}; };
  var marinas = [];   /* where marinas are (leisure=marina or harbour), so piers and ramps near one can be told from a lone jetty */
  for (var mi = 0; mi < n; mi++){ var mt = ways[mi][0]; if ((mt.leisure === 'marina' || mt.harbour === 'yes' || mt.man_made === 'harbour') && ways[mi][1] && ways[mi][1].length >= 2){ var mc = ways[mi][1], mmx = 0, mmy = 0, mn2 = mc.length/2; for (var mk = 0; mk < mc.length; mk += 2){ mmx += mc[mk]; mmy += mc[mk + 1]; } marinas.push([(mmx/mn2 - lon0)*kx, (mmy/mn2 - lat0)*ky, mc.length >= 8 ? Math.sqrt(Math.abs(mc[0] - mc[mc.length - 4]) * kx * Math.abs(mc[1] - mc[mc.length - 3]) * ky) + 60 : 80]); } }
  (sq.pois || []).forEach(function(p){ var pt = p[2] || {}; if (pt.leisure === 'marina' || pt.harbour === 'yes') marinas.push([(p[0] - lon0)*kx, (p[1] - lat0)*ky, 120]); });
  var nearMarina = function(x, y){ for (var q = 0; q < marinas.length; q++) if (Math.hypot(marinas[q][0] - x, marinas[q][1] - y) < marinas[q][2] + 60) return 1; return undefined; };
  var info = new Array(n), lines = [], areas = [], i;
  for (i = 0; i < n; i++){
    var t = ways[i][0], c = ways[i][1]; if (!c || c.length < 4) continue;
    var m = toM(c), cls = wayClass(t), closed = c.length >= 8 && c[0] === c[c.length - 2] && c[1] === c[c.length - 1];
    info[i] = {t:t, m:m, cls:cls, lv:level(t), h:half(m)};
    if (cls) lines.push(i); else if (isWaterArea(t) && closed) areas.push(i);
    /* ---- what the tags say ---- */
    var h = info[i].h, k = null, src = 'osm', r = null;
    if (isBridge(t) && (cls || t.waterway)){
      r = {k:'bridge', w:i, len:h.len, l:info[i].lv, src:'osm', t:t.bridge === 'yes' ? undefined : t.bridge, st:t['bridge:structure'] || (t.bridge === 'movable' ? 'movable' : t.bridge === 'viaduct' || t.bridge === 'trestle' ? 'beam' : undefined), n:t.name};
      push(r, h.x, h.y);
    } else if (isTunnel(t) && (cls || t.waterway)){
      var culv = t.tunnel === 'culvert' || (t.waterway && t.tunnel !== 'no');
      push({k:culv ? 'culvert' : 'tunnel', w:i, len:h.len, l:info[i].lv, src:'osm', n:t.name}, h.x, h.y);
    } else if (t.tunnel === 'building_passage' || t.tunnel === 'passage'){ push({k:'passage', w:i, len:h.len, l:0, src:'osm'}, h.x, h.y); }
    if (cls && (t.ford === 'yes' || t.bridge === 'low_water_crossing' || t.ford === 'stepping_stones')) push({k:'ford', w:i, len:h.len, l:0, src:'osm'}, h.x, h.y);
    if (t.waterway === 'dam' || t.man_made === 'dam') push({k:'dam', w:i, len:h.len, l:0, src:'osm', n:t.name, h:t.height ? parseFloat(t.height) || undefined : undefined}, h.x, h.y);
    else if (t.waterway === 'weir') push({k:'weir', w:i, len:h.len, l:0, src:'osm', n:t.name}, h.x, h.y);
    else if (t.waterway === 'lock_gate') push({k:'gate', w:i, len:h.len, l:0, src:'osm'}, h.x, h.y);
    else if (t.waterway === 'lock' || t.lock === 'yes') push({k:'lock', w:i, len:h.len, l:0, src:'osm', n:t.name}, h.x, h.y);
    else if (t.man_made === 'pier') push({k:'pier', w:i, len:h.len, l:0, src:'osm', n:t.name, mar:nearMarina(h.x, h.y)}, h.x, h.y);
    else if (t.waterway === 'boat_ramp' || t.leisure === 'slipway' || t.man_made === 'slipway') push({k:'ramp', w:i, len:h.len, l:0, src:'osm', n:t.name, mar:nearMarina(h.x, h.y)}, h.x, h.y);
    else if (t.man_made === 'breakwater' || t.man_made === 'groyne') push({k:'breakwater', w:i, len:h.len, l:0, src:'osm'}, h.x, h.y);
    else if (t.man_made === 'dyke') push({k:'dyke', w:i, len:h.len, l:0, src:'osm', h:t.height ? parseFloat(t.height) || undefined : undefined}, h.x, h.y);
    else if (t.barrier === 'retaining_wall') push({k:'wall', w:i, len:h.len, l:0, src:'osm', h:t.height ? parseFloat(t.height) || undefined : undefined}, h.x, h.y);
    else if (t.man_made === 'bridge' && closed) push({k:'bridge', w:i, len:h.len, l:1, src:'osm', o:'area', n:t.name}, h.x, h.y);
    else if (cls && ((t.embankment && t.embankment !== 'no') || (t.cutting && t.cutting !== 'no') || t.man_made === 'embankment')) push({k:'bank', w:i, len:h.len, l:0, src:'osm', t:t.cutting && t.cutting !== 'no' ? 'cutting' : 'embankment'}, h.x, h.y);
  }
  (sq.pois || []).forEach(function(p){
    var t = p[2] || {}, x = (p[0] - lon0)*kx, y = (p[1] - lat0)*ky;
    if (t['bridge:support']) push({k:'support', w:-1, l:1, src:'osm', t:t['bridge:support']}, x, y);
    else if (t.waterway === 'dam') push({k:'dam', w:-1, len:0, l:0, src:'osm'}, x, y);
    else if (t.waterway === 'weir') push({k:'weir', w:-1, len:0, l:0, src:'osm'}, x, y);
    else if (t.waterway === 'waterfall') push({k:'fall', w:-1, len:0, l:0, src:'osm', n:t.name}, x, y);
    else if (t.waterway === 'lock_gate') push({k:'gate', w:-1, len:0, l:0, src:'osm'}, x, y);
  });

  /* ---- where lines cross lines: an index over every segment of roads, paths, rails and waterways ---- */
  var segs = [], total = 0; lines.forEach(function(w){ total += info[w].m.length/2 - 1; });
  var idx = L.spatial(Math.max(1, total)), SW = [], SK = [];
  lines.forEach(function(w){ var m = info[w].m; for (var q = 0; q + 3 < m.length; q += 2){ idx.add(Math.min(m[q], m[q + 2]), Math.min(m[q + 1], m[q + 3]), Math.max(m[q], m[q + 2]), Math.max(m[q + 1], m[q + 3])); SW.push(w); SK.push(q); } });
  idx.finish();
  var seen = {};   /* one record per pair of ways close together */
  var near = function(a, b, x, y){ var k = Math.min(a, b) + ':' + Math.max(a, b), l = seen[k]; if (l) for (var q = 0; q < l.length; q++) if (Math.hypot(l[q][0] - x, l[q][1] - y) < 40) return true; (seen[k] = seen[k] || []).push([x, y]); return false; };
  var nodeNear = function(m, x, y){ for (var q = 0; q < m.length; q += 2) if (Math.abs(m[q] - x) < 1.6 && Math.abs(m[q + 1] - y) < 1.6) return true; return false; };
  var wetRuns = [];   /* inferred bridges over water areas, so a river's centreline does not make a second one */
  /* water areas: where a road or rail at ground level runs through a lake, river or pond */
  if (areas.length){
    var ai = L.spatial(areas.length); areas.forEach(function(w){ var m = info[w].m, b = [1e18, 1e18, -1e18, -1e18]; for (var q = 0; q < m.length; q += 2){ b[0] = Math.min(b[0], m[q]); b[2] = Math.max(b[2], m[q]); b[1] = Math.min(b[1], m[q + 1]); b[3] = Math.max(b[3], m[q + 1]); } ai.add(b[0], b[1], b[2], b[3]); }); ai.finish();
    lines.forEach(function(w){
      var I = info[w]; if ((I.cls !== 'road' && I.cls !== 'rail') || I.lv !== 0 || I.t.ford || I.t.bridge === 'low_water_crossing') return;
      var m = I.m, b = [1e18, 1e18, -1e18, -1e18], q; for (q = 0; q < m.length; q += 2){ b[0] = Math.min(b[0], m[q]); b[2] = Math.max(b[2], m[q]); b[1] = Math.min(b[1], m[q + 1]); b[3] = Math.max(b[3], m[q + 1]); }
      var cand = ai.search(b[0], b[1], b[2], b[3]); if (!cand.length) return;
      var run = null, s = 0;
      for (q = 0; q + 3 < m.length; q += 2){
        var L2 = Math.hypot(m[q + 2] - m[q], m[q + 3] - m[q + 1]), steps = Math.max(1, Math.ceil(L2/3));
        for (var st = 0; st <= steps; st++){
          var u = st/steps, x = m[q] + (m[q + 2] - m[q])*u, y = m[q + 1] + (m[q + 3] - m[q + 1])*u, wet = false;
          for (var c = 0; c < cand.length && !wet; c++) if (L.pip(info[areas[cand[c]]].m, x, y)) wet = true;
          var pos = s + L2*u;
          if (wet && !run) run = {a:pos, x0:x, y0:y};
          if (!wet && run){ endRun(w, run, pos, x, y); run = null; }
        }
        s += L2;
      }
      if (run) endRun(w, run, s, m[m.length - 2], m[m.length - 1]);
    });
  }
  function endRun(w, run, pos, x, y){
    var len = pos - run.a; if (len < 7) return; var I = info[w], cx = (run.x0 + x)/2, cy = (run.y0 + y)/2;
    if (len >= 160){ push({k:'check', w:w, len:len, l:0, src:'inferred', t:'long wet crossing', fe:I.cls === 'road' && rankOf(I.t) >= 4 ? 1 : undefined}, cx, cy); return; }
    wetRuns.push({w:w, x:cx, y:cy, r:len/2 + 12});
    push({k:'bridge', w:w, len:len + 12, l:1, src:'inferred', o:'water', st:'beam', cl:CLEAR.river, n:I.t.name}, cx, cy);
  }
  /* crossings */
  for (var s0 = 0; s0 < SW.length; s0++){
    var wa = SW[s0], A = info[wa], qa = SK[s0], ax = A.m[qa], ay = A.m[qa + 1], bx = A.m[qa + 2], by = A.m[qa + 3], hit = idx.search(Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by));
    for (var h2 = 0; h2 < hit.length; h2++){
      var s1 = hit[h2]; if (s1 <= s0) continue; var wb = SW[s1]; if (wb === wa) continue; var B = info[wb], qb = SK[s1];
      if (A.cls === 'water' && B.cls === 'water') continue;
      var cx = B.m[qb], cy = B.m[qb + 1], dx = B.m[qb + 2], dy = B.m[qb + 3], d = (bx - ax)*(dy - cy) - (by - ay)*(dx - cx); if (Math.abs(d) < 1e-9) continue;
      var u = ((cx - ax)*(dy - cy) - (cy - ay)*(dx - cx))/d, v = ((cx - ax)*(by - ay) - (cy - ay)*(bx - ax))/d; if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      var x = ax + u*(bx - ax), y = ay + u*(by - ay);
      if (nodeNear(A.m, x, y) && nodeNear(B.m, x, y)) continue;   /* they share a point: a junction, not a crossing */
      cross(wa, wb, A, B, x, y);
    }
  }
  function cross(wa, wb, A, B, x, y){
    /* a waterway against a road, path or rail */
    if (A.cls === 'water' || B.cls === 'water'){
      var wi = A.cls === 'water' ? wa : wb, ri = wi === wa ? wb : wa, W = info[wi], R = info[ri];
      if (R.lv !== 0 || R.t.ford || R.t.bridge === 'low_water_crossing' || R.t.tunnel === 'building_passage') return;   /* already a bridge, a tunnel, or a ford */
      if (W.lv < 0 || isTunnel(W.t)){ if (!near(wi, ri, x, y)) push({k:'culvert', w:wi, u:ri, len:(RIVERS[W.t.waterway] || 3) + 8, l:-1, src:'osm', o:R.cls}, x, y); return; }
      if (near(wi, ri, x, y)) return;
      var width = parseFloat(W.t.width) || RIVERS[W.t.waterway] || 3;
      if (BIGWATER[W.t.waterway]){
        for (var q = 0; q < wetRuns.length; q++) if (wetRuns[q].w === ri && Math.hypot(wetRuns[q].x - x, wetRuns[q].y - y) < wetRuns[q].r) return;   /* the river is also mapped as an area, already bridged above */
        if (R.cls === 'path' && width < 6) return;
        push({k:'bridge', w:ri, len:width + 12, l:1, src:'inferred', o:'water', st:'beam', cl:CLEAR.river, n:R.t.name}, x, y);
      } else if (R.cls !== 'path'){ push({k:'culvert', w:wi, u:ri, len:width + 8, l:-1, src:'inferred', o:R.cls}, x, y); }
      return;
    }
    /* two ways for people or vehicles: who goes over whom */
    if (near(wa, wb, x, y)) return;
    var over, under, la = A.lv, lb = B.lv;
    if (la !== lb){ over = la > lb ? wa : wb; under = over === wa ? wb : wa; var O = info[over], U = info[under];
      push({k:O.lv > 0 ? 'overpass' : 'underpass', w:over, u:under, l:O.lv, d:Math.abs(la - lb), src:'osm', cl:clearOver(U.cls, U.t) + CLEAR.deck*(Math.abs(la - lb) - 1), o:U.cls}, x, y); return; }
    /* the same level, no shared point: only worth saying when both carry vehicles or trains (footpaths and drives often cross without a mapped point) */
    var vehA = A.cls === 'road' && rankOf(A.t) >= 4 || A.cls === 'rail', vehB = B.cls === 'road' && rankOf(B.t) >= 4 || B.cls === 'rail';
    if (!vehA || !vehB) return;
    if (la !== 0) return;   /* two bridges on the same level crossing: a mapping slip, left alone */
    var hwA = A.cls === 'road' && rankOf(A.t) >= 8, hwB = B.cls === 'road' && rankOf(B.t) >= 8;   /* motorway, trunk, primary: the engine's rule keeps these on the ground */
    if ((hwA || A.cls === 'rail') !== (hwB || B.cls === 'rail') || (A.cls === 'rail') !== (B.cls === 'rail')){
      var keepA = A.cls === 'rail' || (A.cls === 'road' && rankOf(A.t) >= 9), keepB = B.cls === 'rail' || (B.cls === 'road' && rankOf(B.t) >= 9);
      if (keepA !== keepB){ over = keepA ? wb : wa; under = keepA ? wa : wb; var U2 = info[under];
        push({k:'overpass', w:over, u:under, l:1, d:1, src:'inferred', cl:clearOver(U2.cls, U2.t), o:U2.cls}, x, y); return; }
    }
    push({k:'check', w:wa, u:wb, l:0, src:'inferred', t:'crossing with no junction and no bridge'}, x, y);
  }

  /* ---- dams: what they hold back and whether a road runs along the top ---- */
  list.forEach(function(r){
    if (r.k !== 'dam' || r.w < 0) return; var D = info[r.w], dm = D.m, onTop = 0, sum = 0;
    for (var q = 0; q + 3 < dm.length; q += 2){ var l = Math.hypot(dm[q + 2] - dm[q], dm[q + 3] - dm[q + 1]); sum += l; }
    var bb = [1e18, 1e18, -1e18, -1e18]; for (var z = 0; z < dm.length; z += 2){ bb[0] = Math.min(bb[0], dm[z]); bb[2] = Math.max(bb[2], dm[z]); bb[1] = Math.min(bb[1], dm[z + 1]); bb[3] = Math.max(bb[3], dm[z + 1]); }
    var found = idx.search(bb[0] - 10, bb[1] - 10, bb[2] + 10, bb[3] + 10), hits = {};
    found.forEach(function(sg){ var wr = SW[sg], R = info[wr]; if (R.cls === 'road' && !R.t.bridge && !R.t.tunnel){ var q2 = SK[sg], mx = (R.m[q2] + R.m[q2 + 2])/2, my = (R.m[q2 + 1] + R.m[q2 + 3])/2, best = 1e9;
        for (var z2 = 0; z2 + 3 < dm.length; z2 += 2){ var px = dm[z2 + 2] - dm[z2], py = dm[z2 + 3] - dm[z2 + 1], l2 = px*px + py*py || 1, tt = Math.max(0, Math.min(1, ((mx - dm[z2])*px + (my - dm[z2 + 1])*py)/l2)); best = Math.min(best, Math.hypot(dm[z2] + px*tt - mx, dm[z2 + 1] + py*tt - my)); }
        if (best < 7) hits[wr] = (hits[wr] || 0) + 1; } });
    if (Object.keys(hits).length) r.road = true;
    var across = 0; found.forEach(function(sg){ var R = info[SW[sg]]; if (R.cls === 'water') across++; }); if (across) r.o = 'water';
  });
  /* the deepest rule about piers: a mapped bridge:support node near a bridge says it stands on piers */
  list.forEach(function(r){ if (r.k === 'support'){ for (var q = 0; q < list.length; q++){ var b = list[q]; if (b.k === 'bridge' && b.src === 'osm' && Math.hypot((b.lon - r.lon)*kx, (b.lat - r.lat)*ky) < 60){ b.piers = (b.piers || 0) + 1; break; } } } });
  list.forEach(function(r){ for (var k in r) if (r[k] === undefined) delete r[k]; });
  /* ---- bends: where a stream or river turns sharply (30 degrees or more over 40 m), which side is the outside of the bend ('s':'left'|'right' looking
     downstream, the way the line is drawn), so the game can put a pool and an undercut bank there and bars on the inside. Asked for by the content chat. ---- */
  lines.forEach(function(wi){
    var D = info[wi], wt = D.t.waterway; if (D.cls !== 'water' || D.lv !== 0 || D.t.tunnel || !(wt === 'stream' || wt === 'river' || wt === 'brook')) return;
    var m = D.m, S = [], acc = 0, nx = 0, a;
    for (a = 0; a + 3 < m.length; a += 2){ var dx = m[a + 2] - m[a], dy = m[a + 3] - m[a + 1], sl = Math.hypot(dx, dy); if (!sl) continue;
      for (; nx <= acc + sl; nx += 10){ var u = (nx - acc)/sl; S.push({x:m[a] + dx*u, y:m[a + 1] + dy*u}); } acc += sl; }
    if (S.length < 9) return;
    var turn = [], best = null, last = -99;
    for (var q = 0; q < S.length; q++){ var b0 = S[Math.max(0, q - 2)], c0 = S[q], d0 = S[Math.min(S.length - 1, q + 2)];
      var h1 = Math.atan2(c0.y - b0.y, c0.x - b0.x), h2 = Math.atan2(d0.y - c0.y, d0.x - c0.x), da = h2 - h1; while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
      turn.push(da*180/Math.PI); }
    for (var q2 = 2; q2 < S.length - 2; q2++){ var tq = turn[q2]; if (Math.abs(tq) < 30) continue;
      var isMax = true; for (var z = -3; z <= 3; z++){ var ti = turn[q2 + z]; if (ti !== undefined && Math.abs(ti) > Math.abs(tq) + 1e-9) isMax = false; }
      if (isMax && q2 - last >= 6){ last = q2; push({k:'bend', w:wi, len:0, l:0, src:'inferred', s:tq > 0 ? 'right' : 'left', a:Math.round(Math.abs(tq))}, S[q2].x, S[q2].y); } }
  });
  /* ---- cuts and fills: where a road or railway on the ground sits in a cutting (ground higher on both sides) or on an embankment (lower on both sides),
     read from the ground heights every 20 m. Asked for by the content chat (docs/LANDSCAPE.md) so the game can place cut_* and fill_* pieces. ---- */
  if (elev && elev.d && elev.cols > 1 && elev.rows > 1){
    var bin = atob(elev.d), EH = new Int16Array(elev.cols*elev.rows); for (var q = 0; q < EH.length; q++){ var vv = bin.charCodeAt(q*2) | (bin.charCodeAt(q*2 + 1) << 8); EH[q] = vv > 32767 ? vv - 65536 : vv; }
    var gh = function(x, y){   /* metres from the square's middle -> height in metres, bilinear */
      var u = ((lon0 + x/kx) - elev.w)/(elev.e - elev.w)*(elev.cols - 1), v = (elev.n - (lat0 + y/ky))/(elev.n - elev.s)*(elev.rows - 1);
      u = Math.max(0, Math.min(elev.cols - 1.001, u)); v = Math.max(0, Math.min(elev.rows - 1.001, v)); var a = Math.floor(u), b = Math.floor(v), fu = u - a, fv = v - b, I = b*elev.cols + a;
      return (EH[I]*(1 - fu)*(1 - fv) + EH[I + 1]*fu*(1 - fv) + EH[I + elev.cols]*(1 - fu)*fv + EH[I + elev.cols + 1]*fu*fv)/10; };
    lines.forEach(function(wi){
      var D = info[wi]; if ((D.cls !== "road" && D.cls !== 'rail') || D.lv !== 0 || D.t.tunnel || D.t.bridge || D.t.embankment || D.t.cutting || (D.cls === 'road' && rankOf(D.t) < 4)) return;
      var m = D.m, off = D.cls === 'rail' ? 6 : 8, run = null, runs = [], acc = 0, nextS = 0;
      for (var a2 = 0; a2 + 3 < m.length; a2 += 2){
        var dx = m[a2 + 2] - m[a2], dy = m[a2 + 3] - m[a2 + 1], sl = Math.hypot(dx, dy); if (!sl) continue;
        for (; nextS <= acc + sl; nextS += 20){
          var u2 = (nextS - acc)/sl, px = m[a2] + dx*u2, py = m[a2 + 1] + dy*u2, nx = -dy/sl, ny = dx/sl, c0 = gh(px, py), hl = gh(px + nx*off, py + ny*off), hr = gh(px - nx*off, py - ny*off);
          var cut = Math.min(hl, hr) - c0, fill = c0 - Math.max(hl, hr), kd = cut >= 1.5 ? 'cut' : fill >= 1.5 ? 'fill' : null, dep = kd === 'cut' ? cut : fill;
          if (kd && run && run.t === kd && run.n >= 10){ runs.push(run); run = {t:kd, n:1, sum:dep, x:[px], y:[py]}; }
          else if (kd && run && run.t === kd){ run.n++; run.sum += dep; run.x.push(px); run.y.push(py); }
          else { if (run && run.n >= 3) runs.push(run); run = kd ? {t:kd, n:1, sum:dep, x:[px], y:[py]} : null; }
        }
        acc += sl;
      }
      if (run && run.n >= 3) runs.push(run);
      runs.forEach(function(r){ var mid = Math.floor(r.n/2); push({k:'bank', w:wi, len:(r.n - 1)*20 + 20, l:0, src:'inferred', t:r.t, h:Math.round(r.sum/r.n*10)/10}, r.x[mid], r.y[mid]); });
    });
  }
  return {list:list, counts:counts};
};
};
