/* AfterStreet Maps Builder: the world generator. Reads OpenStreetMap (and Overture buildings), merges them, fills the gaps with
   marked made-up homes and farms, samples the ground, and cuts everything into the game's map squares (the same squares and compact
   format as tools/build_region.py and the game's own region downloads, with new information in new keys beside the old ones).
   Classic script, installs into L (see inflate.js). Needs inflate.js, geo.js, pbf.js, tiff.js. Runs in the background worker. */
(window.BLIB = window.BLIB || {}).gen = function(L){
'use strict';
L.FORMAT = 2;
L.VERSION = '1.13.0';
/* ---------------- which OpenStreetMap things are kept, and which of their tags ---------------- */
var WAYK = ['building', 'building:part', 'highway', 'railway', 'waterway', 'natural', 'landuse', 'leisure', 'amenity', 'man_made', 'power', 'barrier', 'aeroway', 'place', 'area:highway', 'public_transport', 'shop', 'tourism', 'military', 'historic', 'bridge:support', 'golf'];
var NODEK = ['shop', 'amenity', 'healthcare', 'craft', 'office', 'tourism', 'emergency', 'power', 'man_made', 'barrier', 'entrance', 'leisure', 'railway', 'public_transport', 'traffic_sign', 'traffic_calming', 'historic', 'military', 'place', 'addr:housenumber', 'natural', 'highway', 'advertising', 'street_lamp', 'waterway', 'bridge:support'];
var NODE_NAT = {tree:1, peak:1, spring:1, cave_entrance:1, rock:1}, NODE_HWY = {traffic_signals:1, stop:1, give_way:1, crossing:1, street_lamp:1, bus_stop:1, turning_circle:1, mini_roundabout:1, speed_camera:1, milestone:1, motorway_junction:1};
var KEEP = {};
('name alt_name old_name official_name short_name ref int_ref loc_name building height min_height est_height building:levels building:min_level roof:shape roof:levels roof:height roof:angle roof:direction roof:orientation roof:material roof:colour ' +
 'building:material building:colour building:part building:use building:flats amenity shop office tourism healthcare craft man_made power plant:source plant:output:electricity generator:source generator:method generator:output:electricity voltage cables frequency substation ' +
 'highway lanes lanes:forward lanes:backward oneway maxspeed surface smoothness bridge bridge:structure tunnel layer level junction sidewalk sidewalk:left sidewalk:right sidewalk:both cycleway cycleway:left cycleway:right footway crossing crossing:markings ' +
 'parking:lane:left parking:lane:right parking:lane:both parking:left parking:right parking:both parking lit width est_width service access motor_vehicle foot bicycle hgv toll covered ' +
 'embankment cutting ford maxheight lock bridge:support railway usage gauge electrified tracks waterway intermittent seasonal water natural landuse leisure sport golf barrier fence_type wall material colour entrance door emergency fire_hydrant:type traffic_sign traffic_signals traffic_calming ' +
 'leaf_type leaf_cycle genus species crop produce trees orchard karst geological boat sac_scale trail_visibility '+
 'place population ele religion denomination cuisine brand operator military aeroway public_transport historic ruins abandoned disused ' +
 'addr:housenumber addr:street addr:unit addr:city addr:postcode addr:state addr:place addr:interpolation location area area:highway tower:type height:hub pipeline substance capacity fuel content tank').split(' ').forEach(function(k){ KEEP[k] = 1; });
L.keepTags = function(t, extra){
  var o = null; if (!t) return null;
  for (var k in t){ if (KEEP[k] || (extra && extra[k])){ (o = o || {})[k] = String(t[k]).slice(0, 80); } }
  return o;
};
function anyKey(t, list){ if (!t) return false; for (var i = 0; i < list.length; i++) if (t[list[i]] !== undefined) return true; return false; }
L.wayWanted = function(t){ return anyKey(t, WAYK); };
L.nodeWanted = function(t){
  if (!t) return false;
  if (t.natural) return !!NODE_NAT[t.natural]; if (t.highway) return !!NODE_HWY[t.highway];
  return anyKey(t, NODEK);
};
var LINEONLY = function(t){
  if (t.area === 'yes' || t['area:highway']) return false;
  if (t.highway || t.barrier || t.railway || t.power === 'line' || t.power === 'minor_line' || t.power === 'cable') return true;
  if (t.waterway && t.waterway !== 'riverbank' && t.waterway !== 'dock' && t.waterway !== 'boatyard') return true;
  if (t.natural === 'coastline' || t.natural === 'tree_row' || t.natural === 'cliff' || t.natural === 'ridge' || t.natural === 'arete') return true;
  if (t.man_made === 'embankment' || t.man_made === 'cutline' || t.man_made === 'pipeline' || t.man_made === 'dyke') return true;
  return false;
};
L.isPoly = function(t, closed){ return closed && !LINEONLY(t); };

/* ---------------- reading OpenStreetMap ---------------- */
/* the result: {ways:[{t, c:[lon,lat,...], poly, holes?:[[...]], src}], pois:[{lon,lat,t}], places:[[name, lon, lat, place, rank]]} */
function inBox(b, lon, lat){ return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]; }
var PRANK = {city:1, town:2, suburb:3, village:3, quarter:4, neighbourhood:4, hamlet:4, isolated_dwelling:5, locality:5};
function addNode(R, b, lon, lat, t){
  if (!t || !inBox(b, lon, lat)) return;
  if (t.place && t.name && PRANK[t.place]) R.places.push([String(t.name).slice(0, 60), +lon.toFixed(5), +lat.toFixed(5), t.place, PRANK[t.place]]);
  if (L.nodeWanted(t)){ var k = L.keepTags(t); if (k) R.pois.push({lon:lon, lat:lat, t:k}); }
}
function addWay(R, t, flat, closedRefs, src){
  var k = L.keepTags(t); if (!k || flat.length < 4) return;
  var closed = closedRefs || (flat.length >= 8 && flat[0] === flat[flat.length - 2] && flat[1] === flat[flat.length - 1]);
  R.ways.push({t:k, c:flat, poly:L.isPoly(k, closed), src:src || 'osm'});
}
function addMulti(R, t, outers, inners){
  var k = L.keepTags(t); if (!k) return;
  outers.forEach(function(o){
    var flat = []; o.forEach(function(p){ flat.push(p[0], p[1]); });
    var holes = inners.filter(function(r){ return L.pip(flat, r[0][0], r[0][1]); }).map(function(r){ var f = []; r.forEach(function(p){ f.push(p[0], p[1]); }); return f; });
    var w = {t:k, c:flat, poly:true, src:'osm'}; if (holes.length) w.holes = holes; R.ways.push(w);
  });
}
L.readPbfArea = async function(file, b, progress, stop){
  var R = {ways:[], pois:[], places:[]};
  /* pass 1: nodes in the box (kept in sorted typed arrays), tagged nodes, multipolygon relations */
  var cap = 1 << 20, n = 0, ids = new Float64Array(cap), la = new Int32Array(cap), lo = new Int32Array(cap), sorted = true, last = -1, rels = [], memb = new Set();
  await L.pbfRead(file, {
    node:function(id, lat, lon, t){
      if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) return;
      if (n === cap){ cap *= 2; var a = new Float64Array(cap); a.set(ids); ids = a; var c = new Int32Array(cap); c.set(la); la = c; var d = new Int32Array(cap); d.set(lo); lo = d; }
      if (id < last) sorted = false; last = id; ids[n] = id; la[n] = Math.round(lat*1e7); lo[n] = Math.round(lon*1e7); n++;
      if (t) addNode(R, b, lon, lat, t);
    },
    rel:function(id, t, m){
      if (t.type !== 'multipolygon' || !L.wayWanted(t)) return;
      var ms = m.filter(function(x){ return x[0] === 'w'; }); if (!ms.length) return;
      rels.push({t:t, m:ms}); ms.forEach(function(x){ memb.add(x[1]); });
    }
  }, function(f){ if (progress) progress(f*0.5, 'Reading map points'); }, stop);
  if (!sorted){   /* rare: sort by id so ways can look nodes up quickly */
    var order = new Uint32Array(n); for (var i = 0; i < n; i++) order[i] = i;
    order.sort(function(x, y){ return ids[x] - ids[y]; });
    var i2 = new Float64Array(n), l2 = new Int32Array(n), o2 = new Int32Array(n); for (var j = 0; j < n; j++){ i2[j] = ids[order[j]]; l2[j] = la[order[j]]; o2[j] = lo[order[j]]; }
    ids = i2; la = l2; lo = o2;
  }
  function find(id){ var a = 0, z = n - 1; while (a <= z){ var mid = (a + z) >> 1, v = ids[mid]; if (v === id) return mid; if (v < id) a = mid + 1; else z = mid - 1; } return -1; }
  /* pass 2: ways */
  var geom = new Map();
  await L.pbfRead(file, {
    way:function(id, t, refs){
      var want = L.wayWanted(t), mem = memb.has(id); if (!want && !mem) return;
      var flat = [], any = false, miss = 0;
      for (var i = 0; i < refs.length; i++){ var k = find(refs[i]); if (k < 0){ miss++; continue; } flat.push(lo[k]*1e-7, la[k]*1e-7); any = true; }
      if (!any) return;
      var closed = refs.length >= 4 && refs[0] === refs[refs.length - 1];
      if (mem){ var pts = []; for (var q = 0; q < flat.length; q += 2) pts.push([flat[q], flat[q + 1]]); geom.set(id, miss ? null : pts); }
      if (want && flat.length >= 4){ if (closed && miss) return; addWay(R, t, flat, closed && !miss); }
    }
  }, function(f){ if (progress) progress(0.5 + f*0.5, 'Reading streets and buildings'); }, stop);
  rels.forEach(function(r){
    var out = [], inn = [], ok = true;
    r.m.forEach(function(x){ var g = geom.get(x[1]); if (g === null) ok = false; if (!g) return; (x[2] === 'inner' ? inn : out).push(g); });
    if (!ok && !out.length) return;
    addMulti(R, r.t, L.stitch(out), L.stitch(inn));
  });
  R.nodesInBox = n;
  return R;
};
/* Overpass JSON (out geom) */
L.readOverpass = function(j, b){
  var R = {ways:[], pois:[], places:[]};
  (j.elements || []).forEach(function(e){
    if (e.type === 'node') addNode(R, b, e.lon, e.lat, e.tags);
    else if (e.type === 'way' && e.geometry && L.wayWanted(e.tags)){
      var flat = []; e.geometry.forEach(function(g){ if (g) flat.push(g.lon, g.lat); });
      addWay(R, e.tags, flat, e.nodes && e.nodes.length >= 4 && e.nodes[0] === e.nodes[e.nodes.length - 1]);
    } else if (e.type === 'relation' && e.tags && e.tags.type === 'multipolygon' && L.wayWanted(e.tags)){
      var out = [], inn = [];
      (e.members || []).forEach(function(m){ if (m.type !== 'way' || !m.geometry) return; var g = m.geometry.filter(Boolean).map(function(p){ return [p.lon, p.lat]; }); (m.role === 'inner' ? inn : out).push(g); });
      addMulti(R, e.tags, L.stitch(out), L.stitch(inn));
    }
  });
  return R;
};
/* .osm XML (openstreetmap.org Export, JOSM) */
L.readOsmXml = function(text, b){
  var R = {ways:[], pois:[], places:[]}, nodes = new Map(), wayG = new Map(), attr = function(s, k){ var m = s.match(new RegExp('\\b' + k + '="([^"]*)"')); return m ? m[1] : null; };
  var unesc = function(s){ return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); };
  var tagsOf = function(body){ var t = null, re = /<tag\s+k="([^"]*)"\s+v="([^"]*)"/g, m; while ((m = re.exec(body))){ (t = t || {})[unesc(m[1])] = unesc(m[2]); } return t; };
  var re = /<(node|way|relation)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/g, m;
  while ((m = re.exec(text))){
    var kind = m[1], head = m[2], body = m[4] || '', id = attr(head, 'id');
    if (kind === 'node'){ var lat = +attr(head, 'lat'), lon = +attr(head, 'lon'); nodes.set(id, [lon, lat]); addNode(R, b, lon, lat, tagsOf(body)); }
    else if (kind === 'way'){
      var refs = [], r2 = /<nd\s+ref="(\d+)"/g, q; while ((q = r2.exec(body))) refs.push(q[1]);
      var pts = refs.map(function(x){ return nodes.get(x); }).filter(Boolean); wayG.set(id, pts);
      var t = tagsOf(body); if (!L.wayWanted(t)) continue;
      var flat = []; pts.forEach(function(p){ flat.push(p[0], p[1]); }); addWay(R, t, flat, refs.length >= 4 && refs[0] === refs[refs.length - 1] && pts.length === refs.length);
    } else {
      var tr = tagsOf(body); if (!tr || tr.type !== 'multipolygon' || !L.wayWanted(tr)) continue;
      var out = [], inn = [], r3 = /<member\b([^>]*)\/>/g, mm;
      while ((mm = r3.exec(body))){ if (attr(mm[1], 'type') !== 'way') continue; var g = wayG.get(attr(mm[1], 'ref')); if (g) (attr(mm[1], 'role') === 'inner' ? inn : out).push(g); }
      addMulti(R, tr, L.stitch(out), L.stitch(inn));
    }
  }
  return R;
};
/* GeoJSON (osmtogeojson, QGIS, the game's own exports) */
L.readGeoJson = function(j, b, src){
  var R = {ways:[], pois:[], places:[]}, feats = j.features || [j];
  feats.forEach(function(f){
    var g = f.geometry; if (!g) return; var p = f.properties || {}, t = (p.tags && typeof p.tags === 'object') ? p.tags : p;
    var ring = function(cs){ var flat = []; cs.forEach(function(c){ flat.push(+c[0], +c[1]); }); return flat; };
    if (g.type === 'Point') addNode(R, b, +g.coordinates[0], +g.coordinates[1], t);
    else if (!L.wayWanted(t)) return;
    else if (g.type === 'LineString') addWay(R, t, ring(g.coordinates), false, src);
    else if (g.type === 'MultiLineString') g.coordinates.forEach(function(c){ addWay(R, t, ring(c), false, src); });
    else if (g.type === 'Polygon' || g.type === 'MultiPolygon'){
      (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).forEach(function(pg){
        var k = L.keepTags(t); if (!k) return; var w = {t:k, c:ring(pg[0]), poly:true, src:src || 'osm'}; if (pg.length > 1) w.holes = pg.slice(1).map(ring); R.ways.push(w);
      });
    }
  });
  return R;
};
/* Overture buildings (GeoJSON from the Overture download tool or Explorer) to OSM-style tags */
L.readOverture = function(j){
  var out = [], feats = j.features || [];
  feats.forEach(function(f){
    var g = f.geometry, p = f.properties || {}; if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return;
    var t = {building:p.class || p.subtype || 'yes', src:'overture'}, hgt = Number(p.height), fl = Number(p.num_floors);   /* Number(): Parquet integers can arrive as BigInt */
    if (typeof p.names === 'string'){ try { p.names = JSON.parse(p.names); } catch (e){ p.names = null; } }
    if (hgt > 0) t.height = String(Math.round(hgt*10)/10);
    if (fl > 0) t['building:levels'] = String(Math.round(fl));
    if (p.roof_shape) t['roof:shape'] = String(p.roof_shape);
    if (p.facade_material) t['building:material'] = String(p.facade_material);
    var nm = p.names && (p.names.primary || (p.names.common && p.names.common.en)); if (nm) t.name = String(nm).slice(0, 60);
    (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).forEach(function(pg){ var flat = []; pg[0].forEach(function(c){ flat.push(+c[0], +c[1]); }); if (flat.length >= 8) out.push({t:t, c:flat, poly:true, src:'overture'}); });
  });
  return out;
};

/* Overture's own GeoParquet files (from the Overture download tool or the cloud release), read with hyparquet (hyparam/hyparquet, MIT).
   Overture compresses with ZSTD, decoded by fzstd (101arrowz/fzstd, MIT); GZIP by fflate. Only rows inside the box are kept, a slice at a time. */
L.parquetCompressors = function(){
  var c = {};
  if (L.fzstd) c.ZSTD = function(input, n){ return L.fzstd.decompress(input, new Uint8Array(n)); };
  if (L.fflate) c.GZIP = function(input, n){ return L.fflate.gunzipSync(input, {out:new Uint8Array(n)}); };
  return c;
};
L.readOvertureParquet = async function(file, b, progress){
  if (!L.hyparquet) throw new Error('the Parquet reader is missing (builder/lib/hyparquet.js)');
  var H = L.hyparquet, buf = {byteLength:file.size, slice:function(s, e){ return file.slice(s, e).arrayBuffer(); }};
  var md = await H.parquetMetadataAsync(buf), have = H.parquetSchema(md).children.map(function(c){ return c.element.name; });
  if (have.indexOf('geometry') < 0) throw new Error(file.name + ' has no geometry column; is it an Overture buildings file?');
  var cols = ['geometry', 'height', 'num_floors', 'class', 'subtype', 'names', 'roof_shape', 'facade_material', 'bbox'].filter(function(n){ return have.indexOf(n) >= 0; });
  var total = Number(md.num_rows), step = 20000, out = [], comp = L.parquetCompressors();
  for (var r = 0; r < total; r += step){
    var rows = await H.parquetReadObjects({file:buf, metadata:md, columns:cols, rowStart:r, rowEnd:Math.min(total, r + step), compressors:comp}), feats = [];
    for (var i = 0; i < rows.length; i++){
      var row = rows[i], bb = row.bbox, g = row.geometry;
      if (!g || (bb && (bb.xmax < b[0] || bb.xmin > b[2] || bb.ymax < b[1] || bb.ymin > b[3]))) continue;
      delete row.geometry; feats.push({geometry:g, properties:row});
    }
    out = out.concat(L.readOverture({features:feats}));
    if (progress) progress(Math.min(1, (r + step)/total));
  }
  return out;
};
/* ---------------- merging Overture into OpenStreetMap: added only where no OSM building is there ---------------- */
L.mergeOverture = function(R, ovt, loc){
  /* the OpenStreetMap buildings in a flatbush index (mourner/flatbush, ISC); each building's inside point from polylabel (mapbox/polylabel,
     ISC), which unlike a centroid is always inside, even for L and U shapes */
  var add = 0, skip = 0, osm = [];
  R.ways.forEach(function(w){ if (w.poly && w.t.building){ var m = toM(w.c, loc); osm.push({m:m, b:bbox(m), p:null}); } });
  var idx = L.spatial(osm.length || 1); osm.forEach(function(o){ idx.add(o.b[0], o.b[1], o.b[2], o.b[3]); }); if (!osm.length) idx.add(0, 0, 0, 0); idx.finish();
  var placed = L.spatialGrow();   /* Overture buildings already added, so Overture's own overlaps are not doubled either */
  ovt.forEach(function(o){
    var m = toM(o.c, loc), b = bbox(m), p = L.inside(m), hit = false, list = osm.length ? idx.search(b[0], b[1], b[2], b[3]) : [];
    for (var i = 0; i < list.length && !hit; i++){
      var w = osm[list[i]]; if (L.pip(w.m, p[0], p[1])){ hit = true; break; }
      if (!w.p) w.p = L.inside(w.m); if (L.pip(m, w.p[0], w.p[1])) hit = true;
    }
    if (!hit) hit = placed.any(b, function(q){ return L.pip(q.m, p[0], p[1]) || L.pip(m, q.p[0], q.p[1]); });
    if (hit){ skip++; return; }
    R.ways.push(o); placed.add(b, {m:m, p:p}); add++;
  });
  return {added:add, skipped:skip};
};
/* helpers over the packed libraries, with plain fallbacks so the generator still runs if a library file is missing */
L.spatial = function(n){
  if (L.flatbush) return new L.flatbush.default(Math.max(1, n));
  var boxes = []; return {add:function(a, b, c, d){ boxes.push([a, b, c, d]); }, finish:function(){}, search:function(a, b, c, d){ var o = []; for (var i = 0; i < boxes.length; i++){ var q = boxes[i]; if (q[0] <= c && q[2] >= a && q[1] <= d && q[3] >= b) o.push(i); } return o; }};
};
L.spatialGrow = function(cell){   /* a grid for things added while working (flatbush indexes are fixed once finished) */
  cell = cell || 100; var g = new Map();
  return {add:function(b, item){ item.b = b; for (var x = Math.floor(b[0]/cell); x <= Math.floor(b[2]/cell); x++) for (var y = Math.floor(b[1]/cell); y <= Math.floor(b[3]/cell); y++){ var k = x + ',' + y; if (!g.has(k)) g.set(k, []); g.get(k).push(item); } },
    any:function(b, test){ for (var x = Math.floor(b[0]/cell); x <= Math.floor(b[2]/cell); x++) for (var y = Math.floor(b[1]/cell); y <= Math.floor(b[3]/cell); y++){ var l = g.get(x + ',' + y); if (!l) continue; for (var i = 0; i < l.length; i++){ var q = l[i]; if (q.b[0] <= b[2] && q.b[2] >= b[0] && q.b[1] <= b[3] && q.b[3] >= b[1] && test(q)) return true; } } return false; }};
};
L.inside = function(m){   /* a point surely inside a flat ring [x,y,...] */
  if (L.polylabel){ var r = []; for (var i = 0; i < m.length; i += 2) r.push([m[i], m[i + 1]]); var p = L.polylabel.default([r], 0.5); if (isFinite(p[0]) && L.pip(m, p[0], p[1])) return [p[0], p[1]]; }
  return centroid(m);
};
function toM(c, loc){ var m = new Array(c.length); for (var i = 0; i < c.length; i += 2){ var p = loc.m(c[i], c[i + 1]); m[i] = p[0]; m[i + 1] = p[1]; } return m; }
function bbox(m){ var b = [1e18, 1e18, -1e18, -1e18]; for (var i = 0; i < m.length; i += 2){ if (m[i] < b[0]) b[0] = m[i]; if (m[i] > b[2]) b[2] = m[i]; if (m[i + 1] < b[1]) b[1] = m[i + 1]; if (m[i + 1] > b[3]) b[3] = m[i + 1]; } return b; }
function centroid(m){ var x = 0, y = 0, n = 0; for (var i = 0; i < m.length - 2; i += 2){ x += m[i]; y += m[i + 1]; n++; } return [x/n, y/n]; }

/* ---------------- filling the gaps: made-up homes, shops and farmsteads where the data has none, all tagged generated=yes ----------------
   The rules of tools/build_region.py, without its list of known missing boxes: a neighbourhood is filled where it has streets but almost no
   buildings at all, and farmsteads are added along country roads where there is nothing for 180 m. */
var RW = {motorway:11, trunk:8, primary:7, secondary:5, tertiary:4, residential:3.5, unclassified:3, service:2, track:1.8, living_street:3};
L.fillGaps = function(R, loc, centreR){
  var h3 = L.h3, G = 120, den = new Map(), bden = new Map(), occ = new Map(), roads = [];
  var gkey = function(x, y){ return Math.floor(x/G) + ',' + Math.floor(y/G); };
  var polys = [], segs = [];   /* land areas and road pieces, indexed with flatbush once all are read */
  R.ways.forEach(function(w){
    var t = w.t;
    if (w.poly){
      var m = toM(w.c, loc), b = bbox(m), kind = 0;
      if (t.building){ var c = centroid(m), ar = Math.abs(L.area(m)); occAdd(c[0], c[1], Math.sqrt(ar/Math.PI)*1.15); var bk = Math.floor(c[0]/250) + ',' + Math.floor(c[1]/250); bden.set(bk, (bden.get(bk) || 0) + 1); return; }
      if (t.natural === 'water' || t.landuse === 'reservoir' || t.landuse === 'basin' || t.waterway){ var cw = centroid(m); occAdd(cw[0], cw[1], Math.max(15, Math.sqrt(Math.abs(L.area(m))/Math.PI))); kind = 1; }
      else if (t.landuse === 'residential') kind = 2;
      else if (t.natural === 'wood' || t.landuse === 'forest' || t.natural === 'wetland' || t.landuse === 'industrial' || t.landuse === 'cemetery' || t.landuse === 'military' || t.landuse === 'quarry' || t.landuse === 'landfill' || t.landuse === 'railway' ||
               t.leisure === 'park' || t.leisure === 'golf_course' || t.leisure === 'nature_reserve' || t.leisure === 'pitch' || t.amenity === 'school' || t.amenity === 'university' || t.amenity === 'hospital' || t.amenity === 'parking' || t.aeroway) kind = 1;
      else if (t.landuse === 'commercial' || t.landuse === 'retail') kind = 3;
      if (!kind) return;
      polys.push({m:m, b:b, kind:kind});
      return;
    }
    var hw = t.highway; if (!hw || !RW[hw]) return;
    var pts = toM(w.c, loc); roads.push({hw:hw, pts:pts});
    for (var i = 0; i + 3 < pts.length; i += 2){
      var ax = pts[i], ay = pts[i + 1], bx2 = pts[i + 2], by = pts[i + 3], Lg = Math.hypot(bx2 - ax, by - ay);
      segs.push(ax, ay, bx2, by, RW[hw]);
      if (hw === 'residential' || hw === 'unclassified' || hw === 'tertiary' || hw === 'service' || hw === 'living_street'){ var dk = Math.floor((ax + bx2)/500) + ',' + Math.floor((ay + by)/500); den.set(dk, (den.get(dk) || 0) + Lg); }
    }
  });
  var pIdx = L.spatial(polys.length || 1); polys.forEach(function(p){ pIdx.add(p.b[0], p.b[1], p.b[2], p.b[3]); }); if (!polys.length) pIdx.add(-1e9, -1e9, -1e9, -1e9); pIdx.finish();
  var nSeg = segs.length/5, sIdx = L.spatial(nSeg || 1);
  for (var si = 0; si < nSeg; si++){ var o = si*5; sIdx.add(Math.min(segs[o], segs[o + 2]), Math.min(segs[o + 1], segs[o + 3]), Math.max(segs[o], segs[o + 2]), Math.max(segs[o + 1], segs[o + 3])); }
  if (!nSeg) sIdx.add(-1e9, -1e9, -1e9, -1e9); sIdx.finish();
  function occAdd(x, y, r){ var k = gkey(x, y); if (!occ.has(k)) occ.set(k, []); occ.get(k).push([x, y, r]); }
  function town(x, y){ var i = Math.floor(x/250), j = Math.floor(y/250), s = 0; for (var a = -1; a <= 1; a++) for (var b2 = -1; b2 <= 1; b2++) s += den.get((i + a) + ',' + (j + b2)) || 0; return s/9; }
  function homes(x, y){ var i = Math.floor(x/250), j = Math.floor(y/250), s = 0; for (var a = -1; a <= 1; a++) for (var b2 = -1; b2 <= 1; b2++) s += bden.get((i + a) + ',' + (j + b2)) || 0; return s; }
  function landAt(x, y){ if (!polys.length) return 0; var list = pIdx.search(x, y, x, y), best = 0; for (var i = 0; i < list.length; i++){ var p = polys[list[i]]; if (L.pip(p.m, x, y)){ if (p.kind === 1) return 1; best = Math.max(best, p.kind); } } return best; }
  function roadClear(x, y, extra){ if (!nSeg) return true; var r = 11 + extra, l = sIdx.search(x - r, y - r, x + r, y + r); for (var i = 0; i < l.length; i++){ var o = l[i]*5; if (L.segDist(x, y, segs[o], segs[o + 1], segs[o + 2], segs[o + 3]) < segs[o + 4] + extra) return false; } return true; }
  function free(x, y, r, gap){ var gx = Math.floor(x/G), gy = Math.floor(y/G); for (var i = gx - 1; i <= gx + 1; i++) for (var j = gy - 1; j <= gy + 1; j++){ var l = occ.get(i + ',' + j) || []; for (var k = 0; k < l.length; k++) if (Math.hypot(l[k][0] - x, l[k][1] - y) < r + l[k][2] + gap) return false; } return true; }
  function nearAny(x, y, r){ var gx = Math.floor(x/G), gy = Math.floor(y/G), n = Math.ceil(r/G); for (var i = gx - n; i <= gx + n; i++) for (var j = gy - n; j <= gy + n; j++){ var l = occ.get(i + ',' + j) || []; for (var k = 0; k < l.length; k++) if (Math.hypot(l[k][0] - x, l[k][1] - y) < r) return true; } return false; }
  function rect(cx, cy, ux, uy, w, d){ var vx = -uy, vy = ux, hw = w/2, hd = d/2; return [cx - ux*hw - vx*hd, cy - uy*hw - vy*hd, cx + ux*hw - vx*hd, cy + uy*hw - vy*hd, cx + ux*hw + vx*hd, cy + uy*hw + vy*hd, cx - ux*hw + vx*hd, cy - uy*hw + vy*hd]; }
  function fits(fp, extra){ for (var i = 0; i < fp.length; i += 2) if (!roadClear(fp[i], fp[i + 1], extra)) return false; return true; }
  var TAGS = {};   /* made-up buildings share one tag object per kind, which saves a lot of memory on big regions */
  function put(fp, tags){
    var flat = []; for (var i = 0; i < fp.length; i += 2){ var ll = loc.ll(fp[i], fp[i + 1]); flat.push(Math.round(ll[0]*1e6)/1e6, Math.round(ll[1]*1e6)/1e6); } flat.push(flat[0], flat[1]);
    var key = JSON.stringify(tags), t = TAGS[key]; if (!t){ t = {}; for (var k in tags) t[k] = tags[k]; t.generated = 'yes'; TAGS[key] = t; }
    R.ways.push({t:t, c:flat, poly:true, src:'gen'});
    var cx = (fp[0] + fp[4])/2, cy = (fp[1] + fp[5])/2; occAdd(cx, cy, Math.hypot(fp[0] - cx, fp[1] - cy));
  }
  var nGap = 0, nFarm = 0, nPond = 0;
  roads.forEach(function(rd, ri){
    var hw = rd.hw; if (['residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'living_street'].indexOf(hw) < 0) return;
    var pts = rd.pts, run = 15 + h3(ri, 1)*10, farmNext = 150 + h3(ri, 2)*400, rw = RW[hw];
    for (var k = 0; k + 3 < pts.length; k += 2){
      var ax = pts[k], ay = pts[k + 1], bx2 = pts[k + 2], by = pts[k + 3], Lg = Math.hypot(bx2 - ax, by - ay); if (Lg < 1) continue;
      var ux = (bx2 - ax)/Lg, uy = (by - ay)/Lg, vx = -uy, vy = ux, t = run;
      while (t < Lg){
        var x = ax + ux*t, y = ay + uy*t, tn = town(x, y), lu = landAt(x, y), ti = t | 0;
        if (hw !== 'primary' && lu !== 1 && (tn > 450 || lu === 2)){
          /* lot by lot: a home on every empty lot along a town street. Real buildings always win: a lot is used only when nothing stands
             within a lot's width of it, so a fully mapped street gets nothing and a half-mapped one gets only its missing homes */
          var dense = homes(x, y) >= 3;
          for (var sd = -1; sd <= 1; sd += 2){
            var shop = (hw === 'secondary' || hw === 'tertiary' || lu === 3) && h3(ri, k, ti, sd) < (lu === 3 ? 0.7 : 0.25);
            var w = shop ? 24 + h3(ri, k, ti, 3)*14 : 10 + h3(ri, k, ti, 3)*5, d = shop ? 18 + h3(ri, k, ti, 4)*10 : 8 + h3(ri, k, ti, 4)*4;
            var off = rw + (shop ? 14 : 6.5) + d/2, cx = x + vx*off*sd, cy = y + vy*off*sd;
            if (landAt(cx, cy) === 1 || h3(ri, k, ti, sd, 5) > 0.9) continue;
            var fp = rect(cx, cy, ux, uy, w, d);
            if (fits(fp, 2) && free(cx, cy, Math.hypot(w, d)/2, dense ? 8 : 2.5)){ put(fp, shop ? {building:'retail'} : {building:'house', 'building:levels':h3(ri, k, ti, 6) < 0.25 ? '2' : '1'}); nGap++; }
          }
          t += (hw === 'secondary' || hw === 'tertiary') ? 30 + h3(ri, k, ti, 7)*10 : 20 + h3(ri, k, ti, 7)*8; continue;
        }
        if ((hw === 'residential' || hw === 'unclassified') && tn < 400 && (Math.hypot(x, y) > centreR || tn < 150)){
          farmNext -= 25;
          if (farmNext <= 0){
            farmNext = 400 + h3(ri, k, ti, 8)*400;
            var s2 = h3(ri, k, ti, 9) < 0.5 ? 1 : -1;
            if (h3(ri, k, ti, 13) < 0.65 && landAt(x + vx*40*s2, y + vy*40*s2) !== 1 && !nearAny(x + vx*40*s2, y + vy*40*s2, 180)){
              var s0 = h3(ri, k, ti, 10), hx = x + vx*(rw + 18)*s2, hy = y + vy*(rw + 18)*s2, hfp = rect(hx, hy, ux, uy, 12 + s0*4, 9 + s0*3);
              if (fits(hfp, 4) && free(hx, hy, 9, 4)){
                put(hfp, {building:'house'}); nFarm++;
                var bx3 = hx + vx*42*s2 + ux*(14 - 28*s0), by3 = hy + vy*42*s2 + uy*(14 - 28*s0), bfp = rect(bx3, by3, ux, uy, 18 + s0*12, 12 + s0*6);
                if (fits(bfp, 6) && free(bx3, by3, 14, 4) && landAt(bx3, by3) !== 1) put(bfp, {building:'barn', 'building:levels':'2'});
                var sx = hx + vx*26*s2 - ux*(16 - 10*s0), sy = hy + vy*26*s2 - uy*(16 - 10*s0), sfp = rect(sx, sy, ux, uy, 6, 5);
                if (fits(sfp, 4) && free(sx, sy, 4, 3)) put(sfp, {building:'shed'});
                var a1 = loc.ll(x, y), a2 = loc.ll(hx - vx*6*s2, hy - vy*6*s2); R.ways.push({t:{highway:'service', service:'driveway', generated:'yes'}, c:[a1[0], a1[1], a2[0], a2[1]], poly:false, src:'gen'});
                if (h3(ri, k, ti, 11) < 0.7){
                  var px = hx + vx*(95 + s0*40)*s2 + ux*(30*s0 - 15), py = hy + vy*(95 + s0*40)*s2 + uy*(30*s0 - 15), pr = 12 + s0*12;
                  if (roadClear(px, py, pr + 15) && free(px, py, pr, 8) && landAt(px, py) === 0){
                    var ring = []; for (var q = 0; q < 14; q++){ var an = q/14*2*Math.PI, rr = pr*(0.8 + 0.35*h3(ri, k, q, 12)), ll = loc.ll(px + Math.cos(an)*rr, py + Math.sin(an)*rr*0.8); ring.push(ll[0], ll[1]); }
                    ring.push(ring[0], ring[1]); R.ways.push({t:{natural:'water', water:'pond', generated:'yes'}, c:ring, poly:true, src:'gen'}); occAdd(px, py, pr); nPond++;
                  }
                }
              }
            }
          }
        }
        t += 25;
      }
      run = Math.max(0, t - Lg);
    }
  });
  return {homes:nGap, farms:nFarm, ponds:nPond};
};

/* ---------------- the squares ---------------- */
L.regionOf = function(area){
  var lat0 = area.lat, dLat = 0.05, dLon = Math.round(0.05/Math.cos(lat0*Math.PI/180)*1e4)/1e4, my = 0.0045, mx = my/Math.cos(lat0*Math.PI/180);
  var R = {id:area.id, name:area.name, lat:area.lat, lon:area.lon, miles:area.miles, dLat:dLat, dLon:dLon, my:my, mx:mx};
  var n = Math.ceil(area.miles*1.609/(dLat*110.54)) + 1, sq = [];
  for (var j = -n; j <= n; j++) for (var i = -n; i <= n; i++) if (Math.hypot(i*dLon*Math.cos(lat0*Math.PI/180)*111.32, j*dLat*110.54) <= area.miles*1.609 + 3) sq.push([i, j]);
  R.squares = sq;
  R.box = function(i, j){ return {w:R.lon + (i - 0.5)*dLon, e:R.lon + (i + 0.5)*dLon, s:R.lat + (j - 0.5)*dLat, n:R.lat + (j + 0.5)*dLat}; };
  /* everything the build reads: all squares plus their margins */
  var bw = 1e9, bs = 1e9, be = -1e9, bn = -1e9; sq.forEach(function(q){ var b = R.box(q[0], q[1]); bw = Math.min(bw, b.w); be = Math.max(be, b.e); bs = Math.min(bs, b.s); bn = Math.max(bn, b.n); });
  R.read = [bw - mx*1.4, bs - my*1.4, be + mx*1.4, bn + my*1.4];
  return R;
};
L.cutSquares = function(R, F){
  var S = new Map(); R.squares.forEach(function(q){ S.set(q[0] + ':' + q[1], {ways:[], holes:[], pois:[], n:{osm:0, overture:0, gen:0, height:0, levels:0, roof:0, addr:0, roads:0, named:0, lanes:0, width:0}}); });
  var range = function(w, s, e, n){
    var i0 = Math.floor((w - R.mx - R.lon)/R.dLon + 0.5), i1 = Math.floor((e + R.mx - R.lon)/R.dLon + 0.5), j0 = Math.floor((s - R.my - R.lat)/R.dLat + 0.5), j1 = Math.floor((n + R.my - R.lat)/R.dLat + 0.5), out = [];
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++){ var q = S.get(i + ':' + j); if (q) out.push([i, j, q]); } return out;
  };
  var round = function(c){ var o = new Array(c.length); for (var i = 0; i < c.length; i++) o[i] = Math.round(c[i]*1e6)/1e6; return o; };
  F.ways.forEach(function(w){
    var c = w.c, xs0 = 1e9, ys0 = 1e9, xs1 = -1e9, ys1 = -1e9;
    for (var i = 0; i < c.length; i += 2){ if (c[i] < xs0) xs0 = c[i]; if (c[i] > xs1) xs1 = c[i]; if (c[i + 1] < ys0) ys0 = c[i + 1]; if (c[i + 1] > ys1) ys1 = c[i + 1]; }
    var t = w.t, list = range(xs0, ys0, xs1, ys1); if (!list.length) return;
    var cnt = function(q){
      if (t.building){ q.n[w.src]++; if (t.height) q.n.height++; if (t['building:levels']) q.n.levels++; if (t['roof:shape']) q.n.roof++; if (t['addr:housenumber']) q.n.addr++; }
      else if (t.highway && RW[t.highway]){ q.n.roads++; if (t.name || t.ref) q.n.named++; if (t.lanes) q.n.lanes++; if (t.width) q.n.width++; }
    };
    if (w.poly){
      var rc = round(c);
      list.forEach(function(e){ var q = e[2]; q.ways.push([t, rc]); if (w.holes) w.holes.forEach(function(h){ q.holes.push([q.ways.length - 1, round(h)]); }); cnt(q); });
      return;
    }
    list.forEach(function(e){   /* a line is cut into the runs that fall inside each square plus its margin */
      var b = R.box(e[0], e[1]), q = e[2], W = b.w - R.mx*1.2, E = b.e + R.mx*1.2, Sd = b.s - R.my*1.2, N = b.n + R.my*1.2, run = null, any = false;
      for (var k = 0; k + 3 < c.length; k += 2){
        var ax = c[k], ay = c[k + 1], bx = c[k + 2], by = c[k + 3], hit = !(Math.max(ax, bx) < W || Math.min(ax, bx) > E || Math.max(ay, by) < Sd || Math.min(ay, by) > N);
        if (hit){ if (!run) run = [ax, ay]; run.push(bx, by); }
        else if (run){ q.ways.push([t, round(run)]); run = null; any = true; }
      }
      if (run && run.length >= 4){ q.ways.push([t, round(run)]); any = true; }
      if (any) cnt(q);
    });
  });
  F.pois.forEach(function(p){ range(p.lon, p.lat, p.lon, p.lat).forEach(function(e){ e[2].pois.push([Math.round(p.lon*1e6)/1e6, Math.round(p.lat*1e6)/1e6, p.t]); }); });
  return S;
};

/* ---------------- ground heights ---------------- */
/* sources: uploaded GeoTIFFs (finest first), then the free Terrarium tiles when online */
L.Terrarium = function(){
  var cache = new Map(), order = [], fails = 0, ok = typeof fetch !== 'undefined' && typeof createImageBitmap !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
  var tx = function(lon, z){ return (lon + 180)/360*Math.pow(2, z); }, ty = function(lat, z){ var r = lat*Math.PI/180; return (1 - Math.log(Math.tan(r) + 1/Math.cos(r))/Math.PI)/2*Math.pow(2, z); };
  var T = {ok:ok, z:13};
  async function tile(z, X, Y){
    var k = z + '/' + X + '/' + Y; if (cache.has(k)) return cache.get(k);
    var h = null;
    try {
      var r = await fetch('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/' + k + '.png'); if (!r.ok) throw new Error(r.status);
      var im = await createImageBitmap(await r.blob()), cv = new OffscreenCanvas(256, 256), cx = cv.getContext('2d', {willReadFrequently:true}); cx.drawImage(im, 0, 0);
      var px = cx.getImageData(0, 0, 256, 256).data; h = new Float32Array(65536); for (var i = 0; i < 65536; i++) h[i] = px[i*4]*256 + px[i*4 + 1] + px[i*4 + 2]/256 - 32768;
    } catch (e){ fails++; if (fails > 12) T.ok = false; }
    cache.set(k, h); order.push(k); while (order.length > 260){ cache.delete(order.shift()); }
    return h;
  }
  T.prepare = async function(w, s, e, n, res){
    if (!T.ok) return false;
    var z = res <= 25 ? 13 : res <= 50 ? 12 : 11; T.z = z;
    for (var X = Math.floor(tx(w, z)); X <= Math.floor(tx(e, z)); X++) for (var Y = Math.floor(ty(n, z)); Y <= Math.floor(ty(s, z)); Y++) await tile(z, X, Y);
    return T.ok;
  };
  T.at = function(lon, lat){
    var z = T.z, gx = tx(lon, z)*256 - 0.5, gy = ty(lat, z)*256 - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    var get = function(x, y){ var X = Math.floor(x/256), Y = Math.floor(y/256), t = cache.get(z + '/' + X + '/' + Y); return t ? t[(y - Y*256)*256 + (x - X*256)] : NaN; };
    var a = get(x0, y0), b = get(x0 + 1, y0), c = get(x0, y0 + 1), d = get(x0 + 1, y0 + 1);
    if (a !== a || b !== b || c !== c || d !== d){ var v = [a, b, c, d].filter(function(q){ return q === q; }); return v.length ? v[0] : NaN; }
    return (a*(1 - fx) + b*fx)*(1 - fy) + (c*(1 - fx) + d*fx)*fy;
  };
  T.res = 15;
  return T;
};
/* one square's height grid, in the game's format: int16 decimetres, rows north to south, base64 */
L.elevGrid = async function(R, i, j, tiffs, terr, step){
  var b = R.box(i, j), s = b.s - R.my*1.3, n = b.n + R.my*1.3, w = b.w - R.mx*1.3, e = b.e + R.mx*1.3;
  var cols = Math.min(2000, Math.floor((e - w)*Math.cos(R.lat*Math.PI/180)*111320/step) + 1), rows = Math.min(2000, Math.floor((n - s)*110540/step) + 1);
  var use = [];
  for (var k = 0; k < tiffs.length; k++){ var T = tiffs[k]; if (T.bbox[0] > e || T.bbox[2] < w || T.bbox[1] > n || T.bbox[3] < s) continue; if (await T.prepare(w, s, e, n, step)) use.push(T); }
  var useT = terr && (await terr.prepare(w, s, e, n, step));
  var h = new Float32Array(cols*rows), cnt = {file:0, tiles:0, none:0}, best = 1e9;
  for (var r = 0; r < rows; r++){
    var lat = n - (n - s)*r/(rows - 1);
    for (var c = 0; c < cols; c++){
      var lon = w + (e - w)*c/(cols - 1), v = NaN;
      for (var q = 0; q < use.length && v !== v; q++){ v = use[q].at(lon, lat); if (v === v){ cnt.file++; if (use[q].res < best) best = use[q].res; } }
      if (v !== v && useT){ v = terr.at(lon, lat); if (v === v) cnt.tiles++; }
      if (v !== v) cnt.none++;
      h[r*cols + c] = v;
    }
  }
  /* holes: fill from the neighbours, a few sweeps; anything still empty takes the average */
  if (cnt.none && cnt.none < h.length){
    for (var sweep = 0; sweep < 40; sweep++){
      var left = 0;
      for (var p = 0; p < h.length; p++){ if (h[p] === h[p]) continue; var sum = 0, m = 0, x = p % cols, y = (p - x)/cols;
        if (x > 0 && h[p - 1] === h[p - 1]){ sum += h[p - 1]; m++; } if (x < cols - 1 && h[p + 1] === h[p + 1]){ sum += h[p + 1]; m++; }
        if (y > 0 && h[p - cols] === h[p - cols]){ sum += h[p - cols]; m++; } if (y < rows - 1 && h[p + cols] === h[p + cols]){ sum += h[p + cols]; m++; }
        if (m) h[p] = sum/m; else left++; }
      if (!left) break;
    }
  }
  var avg = 0, na = 0; for (var p2 = 0; p2 < h.length; p2++) if (h[p2] === h[p2]){ avg += h[p2]; na++; } avg = na ? avg/na : 0;
  var d = new Int16Array(cols*rows); for (var p3 = 0; p3 < h.length; p3++){ var v3 = h[p3] === h[p3] ? h[p3] : avg; d[p3] = Math.max(-32000, Math.min(32000, Math.round(v3*10))); }
  return {grid:{s:+s.toFixed(6), n:+n.toFixed(6), w:+w.toFixed(6), e:+e.toFixed(6), cols:cols, rows:rows, d:b64(new Uint8Array(d.buffer))},
    src:cnt.file >= cnt.tiles && cnt.file >= cnt.none ? 'file' : cnt.tiles >= cnt.none ? 'tiles' : 'none', fileRes:best < 1e9 ? best : 0, share:{file:cnt.file/h.length, tiles:cnt.tiles/h.length, none:cnt.none/h.length}};
};
function b64(u8){ var s = '', CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
L.b64 = b64;
};
