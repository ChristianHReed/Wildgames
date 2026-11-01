/* Shared engine: map file parsing (OSM XML, Overpass, GeoJSON, the compact map format).
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
/* ================= map file parsing ================= */
function same(a, b){ return a[0] === b[0] && a[1] === b[1]; }
function stitch(segs){
  var rings = []; segs = segs.filter(function(s){ return s.length > 1; });
  while (segs.length){
    var cur = segs.pop().slice(), guard = 0;
    while (!same(cur[0], cur[cur.length-1]) && guard++ < 5000){
      var end = cur[cur.length-1], found = false;
      for (var i = 0; i < segs.length; i++){
        var s = segs[i];
        if (same(s[0], end)) cur = cur.concat(s.slice(1));
        else if (same(s[s.length-1], end)) cur = cur.concat(s.slice(0, -1).reverse());
        else continue;
        segs.splice(i, 1); found = true; break;
      }
      if (!found) break;
    }
    if (cur.length >= 4 && same(cur[0], cur[cur.length-1])) rings.push(cur);
  }
  return rings;
}
function hasKeys(o){ for (var k in o) return true; return false; }
function fromOsmXml(text){
  var doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('This file is not valid OSM XML.');
  var nodes = new Map(), wayMap = new Map(), ways = [], pois = [], i, j, ch, n, c, tags;
  var ns = doc.getElementsByTagName('node');
  for (i = 0; i < ns.length; i++){
    n = ns[i]; var p = [+n.getAttribute('lon'), +n.getAttribute('lat')]; nodes.set(n.getAttribute('id'), p);
    if (n.children.length){
      tags = {}; for (j = 0; j < n.children.length; j++){ ch = n.children[j]; if (ch.tagName === 'tag') tags[ch.getAttribute('k')] = ch.getAttribute('v'); }
      pois.push({lon:p[0], lat:p[1], tags:tags});
    }
  }
  var ws = doc.getElementsByTagName('way');
  for (i = 0; i < ws.length; i++){
    c = []; tags = {};
    for (j = 0; j < ws[i].children.length; j++){
      ch = ws[i].children[j];
      if (ch.tagName === 'nd'){ var q = nodes.get(ch.getAttribute('ref')); if (q) c.push(q); }
      else if (ch.tagName === 'tag') tags[ch.getAttribute('k')] = ch.getAttribute('v');
    }
    var w = {c:c, tags:tags}; wayMap.set(ws[i].getAttribute('id'), w); ways.push(w);
  }
  var rs = doc.getElementsByTagName('relation');
  for (i = 0; i < rs.length; i++){
    tags = {}; var segs = [], mem = [];
    for (j = 0; j < rs[i].children.length; j++){
      ch = rs[i].children[j];
      if (ch.tagName === 'tag') tags[ch.getAttribute('k')] = ch.getAttribute('v');
      else if (ch.tagName === 'member' && ch.getAttribute('type') === 'way' && ch.getAttribute('role') !== 'inner') mem.push(wayMap.get(ch.getAttribute('ref')));
    }
    if (tags.type !== 'multipolygon') continue;
    mem.forEach(function(m){ if (m && !(m.tags.building && tags.building)) segs.push(m.c); });
    stitch(segs).forEach(function(r){ ways.push({c:r, tags:tags}); });
  }
  return {ways:ways, pois:pois};
}
function fromOverpass(j){
  var nodes = new Map(), wayMap = new Map(), ways = [], pois = [];
  j.elements.forEach(function(e){
    if (e.type === 'node'){ nodes.set(e.id, [e.lon, e.lat]); if (e.tags) pois.push({lon:e.lon, lat:e.lat, tags:e.tags}); }
  });
  var geo = function(g){ return g.filter(Boolean).map(function(p){ return [p.lon, p.lat]; }); };
  j.elements.forEach(function(e){
    if (e.type !== 'way') return;
    var c = e.geometry ? geo(e.geometry) : (e.nodes || []).map(function(id){ return nodes.get(id); }).filter(Boolean);
    var w = {c:c, tags:e.tags || {}}; wayMap.set(e.id, w); ways.push(w);
  });
  j.elements.forEach(function(e){
    if (e.type !== 'relation' || !e.tags || e.tags.type !== 'multipolygon') return;
    var segs = [];
    (e.members || []).forEach(function(m){
      if (m.type !== 'way' || m.role === 'inner') return;
      var w = wayMap.get(m.ref);
      if (w){ if (!(w.tags.building && e.tags.building)) segs.push(w.c); }
      else if (m.geometry) segs.push(geo(m.geometry));
    });
    stitch(segs).forEach(function(r){ ways.push({c:r, tags:e.tags}); });
  });
  return {ways:ways, pois:pois};
}
function fromGeoJson(j){
  var ways = [], pois = [], feats = j.features || [j];
  feats.forEach(function(f){
    var g = f.geometry; if (!g) return;
    var p = f.properties || {}, tags = (p.tags && typeof p.tags === 'object') ? p.tags : p;
    if (g.type === 'Point') pois.push({lon:g.coordinates[0], lat:g.coordinates[1], tags:tags});
    else if (g.type === 'LineString') ways.push({c:g.coordinates, tags:tags});
    else if (g.type === 'MultiLineString') g.coordinates.forEach(function(c){ ways.push({c:c, tags:tags}); });
    else if (g.type === 'Polygon') ways.push({c:g.coordinates[0], tags:tags});
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(function(c){ ways.push({c:c[0], tags:tags}); });
  });
  return {ways:ways, pois:pois};
}
var KEEP = ['office','tourism','building','building:levels','name','shop','amenity','highway','waterway','railway','natural','landuse','leisure','healthcare','craft','military','area','place','addr:housenumber','addr:street','ref'];
function keepTags(t){ var o = {}, n = 0; if (t) for (var i = 0; i < KEEP.length; i++) if (t[KEEP[i]] !== undefined){ o[KEEP[i]] = t[KEEP[i]]; n++; } return n ? o : null; }
/* compact map file: only the tags the game uses, coordinates rounded to about 10 cm */
function toCompact(raw, name){
  var ways = [], pois = [];
  raw.ways.forEach(function(w){
    var t = keepTags(w.tags); if (!t || !w.c || w.c.length < 2) return;
    var c = []; for (var i = 0; i < w.c.length; i++) c.push(+(+w.c[i][0]).toFixed(6), +(+w.c[i][1]).toFixed(6));
    ways.push([t, c]);
  });
  raw.pois.forEach(function(p){ var t = keepTags(p.tags); if (t && (t.natural === 'tree' || t.shop || t.amenity || t.healthcare || t.craft)) pois.push([+(+p.lon).toFixed(6), +(+p.lat).toFixed(6), t]); });
  var out = {lastblockMap:1, name:name, ways:ways, pois:pois}; if (raw.elev) out.elev = raw.elev; if (raw.zone) out.zone = raw.zone; return out;
}
function fromCompact(j){
  return {ways:(j.ways || []).map(function(w){ var c = []; for (var i = 0; i < w[1].length; i += 2) c.push([w[1][i], w[1][i+1]]); return {c:c, tags:w[0]}; }),
    pois:(j.pois || []).map(function(p){ return {lon:p[0], lat:p[1], tags:p[2]}; }), name:j.name ? String(j.name).replace(/[<>&"]/g, '').slice(0, 60) : '', spawn:Array.isArray(j.spawn) ? j.spawn : null, elev:j.elev && typeof j.elev === 'object' ? j.elev : null, tclass:j.tclass && typeof j.tclass === 'object' ? j.tclass : null, holes:Array.isArray(j.holes) ? j.holes : null, structures:Array.isArray(j.structures) ? j.structures : null, format:j.format | 0, attribution:j.attribution ? String(j.attribution).slice(0, 600) : '', zone:j.zone && j.zone.n > j.zone.s && j.zone.e > j.zone.w ? {s:+j.zone.s, n:+j.zone.n, w:+j.zone.w, e:+j.zone.e} : null};
}
function parseText(text){
  var t = text.replace(/^﻿/, '').trim();
  if (t[0] === '<') return fromOsmXml(t);
  if (t[0] === '{' || t[0] === '['){
    var j; try { j = JSON.parse(t); } catch (e) { throw new Error('This file is not valid JSON.'); }
    if (j.lastblockMap) return fromCompact(j);
    if (j.elements) return fromOverpass(j);
    if (j.features || j.type === 'Feature') return fromGeoJson(j);
  }
  throw new Error('Unrecognized file. Use a .osm export, Overpass JSON, or GeoJSON.');
}

/* 0.114.47: the test street (start screen, Test street tab). One street, flat, for trying a change before it goes into the main game. Only map tags that bring in the content chat's art:
   west side a house, a shop front and a tall apartment block; east side, across a river, a dense wood, a park and a field, with a footbridge over the river into the park.
   Nothing here is drawn by the engine's own art: every building, tree, bench, crop and bridge piece comes from the shaped packs. */
var TEST_ST = {x0:-310, x1:270, y0:-190, y1:240};   /* 0.114.66: the Test World is compact: everything within about 200 m of the spawn, a lake where the river ends */
/* the test sheet's ground (raw metres, x east, y south), in 2.5 m cells so the steep parts are crisp: flat by the street; the river in a real channel with a bank shelf at the height the waterways
   pieces' lip stands (bed -0.9 m, shelf +0.5 m); a steep hill the hill road climbs; a mountain; a gorge 14 m deep across the field */
function testSheetH(x, y){
  var h = 0.4, dx = Math.abs(x - 30);
  if (y < 92) h += dx < 5.5 ? -0.9 : dx < 8.5 ? 0.5 : 0;
  var q = Math.hypot((x - 95)/78, (y - 108)/36); if (q < 1.25){ var tq = q < 0.85 ? 1 : (1.25 - q)/0.4; h += -2.4*tq*tq*(3 - 2*tq); }   /* smooth bowl: the water's edge (q 1.18) is where the ground meets the water level, so no dry pit shows beside the lake */   /* the lake: a bowl 2.4 m deep, the river runs into it */
  var r = Math.hypot(x + 130, y + 110); if (r < 42) h += 28*(1 - r/42)*(1 + 0.05*Math.sin(x/5)*Math.cos(y/6));
  var m = Math.hypot(x + 205, y - 100)/100; if (m < 1) h += 85*Math.pow(1 - m, 1.25)*(1 + 0.12*Math.sin(x/9)*Math.cos(y/11));
  var gx = Math.abs(x - 215), gy = y > 58 && y < 140 ? 1 : y >= 140 && y < 150 ? (150 - y)/10 : y > 48 && y <= 58 ? (y - 48)/10 : 0;
  if (gy > 0 && gx < 8){ var dd = gx < 4 ? 1 : (8 - gx)/4; h -= 14*dd*gy; }
  return h;
}
function testStreetElev(){
  var u = 1/111320, v = 1/110540, cell = 2.5, cols = Math.round((TEST_ST.x1 - TEST_ST.x0)/cell) + 1, rows = Math.round((TEST_ST.y1 - TEST_ST.y0)/cell) + 1, d = new Int16Array(cols*rows);
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) d[j*cols + i] = Math.round(testSheetH(TEST_ST.x0 + i*cell, TEST_ST.y0 + j*cell)*10);
  return {s:-TEST_ST.y1*v, n:-TEST_ST.y0*v, w:TEST_ST.x0*u, e:TEST_ST.x1*u, cols:cols, rows:rows, d:b64of(new Uint8Array(d.buffer))};
}
function testStreetRaw(){
  var u = 1/111320, v = 1/110540, ways = [], pois = [];
  var LL = function(x, y){ return [x*u, -y*v]; };
  var poly = function(pts, tags){ var c = pts.map(function(p){ return LL(p[0], p[1]); }); c.push(c[0]); ways.push({c:c, tags:tags}); };
  var rect = function(x, y, w, h, tags){ poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], tags); };
  var line = function(pts, tags){ ways.push({c:pts.map(function(p){ return LL(p[0], p[1]); }), tags:tags}); };
  line([[0, -165], [0, 215]], {highway:'residential', name:'Test World'});
  rect(-24, -64, 16, 14, {building:'house', name:'The house'});
  rect(-26, -30, 18, 20, {building:'yes', shop:'convenience', name:'Shop front'});
  rect(-30, 8, 22, 26, {building:'apartments', 'building:levels':'8', name:'Apartment block'});
  line([[30, -165], [30, 90]], {waterway:'river', name:'Test River'});
  var lk = []; for (var li = 0; li < 28; li++){ var la = li/28*Math.PI*2; lk.push([95 + Math.cos(la)*78*1.18, 108 + Math.sin(la)*36*1.18]); }
  poly(lk, {natural:'water', name:'Test Lake'});
  poly([[44, -165], [250, -165], [250, -50], [44, -50]], {natural:'wood', name:'Dense forest'});
  poly([[44, -46], [200, -46], [200, 24], [44, 24]], {leisure:'park', name:'Test Park'});
  poly([[44, 28], [250, 28], [250, 235], [44, 235]], {landuse:'farmland', name:'Field'});
  line([[3.5, -12], [60, -12]], {highway:'footway', name:'Footbridge path'});
  /* the test sheet: more of everything that needs checking. Buildings west of the street (the item wall stands at y 56 to 92) */
  rect(-34, -158, 20, 16, {building:'yes', amenity:'fire_station', name:'Fire station'});
  rect(-44, -138, 32, 22, {building:'school', amenity:'school', name:'School'});
  rect(-30, -112, 14, 20, {building:'church', amenity:'place_of_worship', name:'Church'});
  rect(-40, 98, 34, 26, {building:'hospital', amenity:'hospital', name:'Hospital'});
  rect(-44, 128, 38, 26, {building:'warehouse', name:'Warehouse'});
  rect(-24, 158, 14, 10, {building:'yes', amenity:'fuel', name:'Gas station'});
  rect(-36, 172, 26, 18, {building:'yes', amenity:'police', name:'Police station'});
  rect(-30, 194, 20, 14, {building:'yes', amenity:'restaurant', name:'Diner'});
  rect(150, 56, 18, 12, {building:'barn', name:'Barn'});
  rect(178, 30, 12, 10, {building:'house', name:'Farmhouse'});
  /* the hill road: climbs the steep hill from the street (a steep street for the sunk-road kerbs) */
  line([[0, -140], [-45, -139], [-85, -134], [-110, -126], [-130, -112]], {highway:'residential', name:'Hill Road'});
  /* the gorge road: crosses the river on a bridge, then the gorge on a bridge over dry ground */
  line([[0, 45], [60, 45], [140, 45], [250, 45]], {highway:'residential', name:'Gorge Road'});
  /* a gravel track to the mountain's foot */
  line([[0, -170], [-100, -165], [-170, -60], [-200, 20]], {highway:'track', name:'Mountain track'});
  return {ways:ways, pois:pois, elev:testStreetElev(), hgCell:2.5, spawn:LL(-3, -40), name:'Test World'};
}
function demoRaw(){ var r = demoRaw0(); r.elev = demoElev(); return r; }
function DEMO_CK(x){ return 470 + 26*Math.sin(x/95) + 10*Math.sin(x/37); }
/* the demo town gets made-up rolling hills so terrain can be seen without downloading anything */
function demoElev(){
  var n = 161, d = new Int16Array(n*n), span = 0.012, u = 111320, v = 110540;
  for (var j = 0; j < n; j++) for (var i = 0; i < n; i++){ var x = (-span + 2*span*i/(n - 1))*u, y = (span - 2*span*j/(n - 1))*v; var yy = -y, dc = yy - DEMO_CK(x), h = 6*Math.sin(x/170) + 5*Math.cos(y/130) + 3*Math.sin((x + y)/75);
    h -= 9*Math.exp(-dc*dc/5000); if (x > -200 && x < 800) h += 13*sstep(18, 46, dc)*sstep(-200, -60, x)*(1 - sstep(660, 800, x));   /* the valley, and a bluff south of the creek */
    d[j*n + i] = Math.round(h*10); }
  return {s:-span, n:span, w:-span, e:span, cols:n, rows:n, d:b64of(new Uint8Array(d.buffer))};
}
function b64of(u8){ var t = ''; for (var i = 0; i < u8.length; i += 8000) t += String.fromCharCode.apply(null, u8.subarray(i, i + 8000)); return btoa(t); }
function demoRaw0(){
  var ways = [], pois = [], u = 1/111320, v = 1/110540, k = 0;
  var rnd = function(){ return hash(k++, 7, 99); };
  var LL = function(x, y){ return [x*u, -y*v]; };
  var poly = function(pts, tags){ var c = pts.map(function(p){ return LL(p[0], p[1]); }); c.push(c[0]); ways.push({c:c, tags:tags}); };
  var rect = function(x, y, w, h, tags){
    if (w > 14 && h > 12 && rnd() < 0.3) poly([[x,y],[x+w,y],[x+w,y+h*0.55],[x+w*0.5,y+h*0.55],[x+w*0.5,y+h],[x,y+h]], tags);
    else poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]], tags);
  };
  var BW = 80, BH = 64, G = 12, NX = 6, NY = 5, i, j;
  for (i = 0; i <= NX; i++) ways.push({c:[LL(i*(BW+G)-G/2, -G/2), LL(i*(BW+G)-G/2, NY*(BH+G)-G/2)], tags:{highway: i%3 === 0 ? 'secondary' : 'residential'}});
  for (j = 0; j <= NY; j++) ways.push({c:[LL(-G/2, j*(BH+G)-G/2), LL(NX*(BW+G)-G/2, j*(BH+G)-G/2)], tags:{highway: j%2 === 0 ? 'tertiary' : 'residential'}});
  var special = [{shop:'supermarket',name:'FreshMart'},{amenity:'pharmacy',name:'Corner Pharmacy'},{amenity:'police',name:'Police Station'},
    {amenity:'restaurant',name:"Rosa's Diner"},{building:'warehouse',name:'Depot 9'},{amenity:'hospital',name:'Mercy Clinic'},{shop:'hardware',name:'Bolt & Nail'},
    {shop:'convenience',name:'QuickStop'},{amenity:'cafe',name:'Bean There'},{shop:'clothes',name:'Thread & Co'},{amenity:'fire_station',name:'Fire Station 4'},{shop:'bakery',name:'Daily Bread'}];
  var count = 0, si = 0;
  var tagFor = function(){ count++; if (count % 7 === 3 && si < special.length) return Object.assign({building:'yes'}, special[si++]); return {building:'house'}; };
  for (var by = 0; by < NY; by++) for (var bx = 0; bx < NX; bx++){
    var x0 = bx*(BW+G), y0 = by*(BH+G), idx = by*NX + bx;
    if (idx === 8){
      rect(x0+2, y0+2, BW-4, BH-4, {leisure:'park', name:'Miller Park'});
      var pts = []; for (i = 0; i < 9; i++){ var a = i/9*6.283; pts.push([x0+BW/2+Math.cos(a)*(14+rnd()*5), y0+BH/2+Math.sin(a)*(10+rnd()*4)]); }
      poly(pts, {natural:'water'}); continue;
    }
    if (idx === 19 || idx === 26){ poly([[x0+2,y0+2],[x0+BW-2,y0+2],[x0+BW-2,y0+BH-2],[x0+2,y0+BH-2]], {natural:'wood'}); continue; }
    if (idx === 14){ poly([[x0+3,y0+34],[x0+BW-3,y0+34],[x0+BW-3,y0+BH-3],[x0+3,y0+BH-3]], {amenity:'parking'}); }
    var x = x0 + 3;
    while (x < x0 + BW - 10){
      var w = Math.min(10 + rnd()*13, x0 + BW - 3 - x), d1 = 10 + rnd()*11, d2 = 10 + rnd()*11;
      rect(x, y0+3, w, d1, tagFor());
      if (idx !== 14) rect(x, y0+BH-3-d2, w, d2, tagFor());
      x += w + 2 + rnd()*4;
    }
  }
  pois.push({lon:LL(140,150)[0], lat:LL(140,150)[1], tags:{amenity:'pharmacy', name:'Market Stall Medics'}});
  /* the country round the town: a creek in a valley to the south with a wooded bluff beyond it, meadows east and north. It is laid out
     evenly about the middle of the town, so the town keeps the same place on the map as before (saved games still line up) */
  var mx = (NX*(BW+G) - G)/2, my = (NY*(BH+G) - G)/2, X0 = mx - 730, X1 = mx + 730, ck = [], wd = [], q, bot = 0;
  for (q = X0; q < X1; q += 30) ck.push(LL(q, DEMO_CK(q))); ck.push(LL(X1, DEMO_CK(X1)));
  ways.push({c:ck, tags:{waterway:'stream', name:'Jordan Creek'}});
  for (q = X0; q < X1; q += 60) wd.push([q, DEMO_CK(q) + 34]); wd.push([X1, DEMO_CK(X1) + 34]);
  for (q = X1; q > X0; q -= 90){ var yb = DEMO_CK(q) + 300 + 60*Math.sin(q/130); wd.push([q, yb]); bot = Math.max(bot, yb); }
  wd.push([X0, DEMO_CK(X0) + 300]); bot = Math.max(bot, DEMO_CK(X0) + 300); poly(wd, {natural:'wood'});
  poly([[620, -60], [X1, -40], [X1, 380], [640, 400]], {landuse:'meadow'});
  poly([[-40, 2*my - bot], [560, 2*my - bot], [600, -50], [-60, -40]], {landuse:'farmland'});
  ways.push({c:[LL(NX*(BW+G)-G/2, 140), LL(700, 150), LL(900, 120)], tags:{highway:'track'}});
  return {ways:ways, pois:pois};
}

