#!/usr/bin/env python3
"""Builds the built-in Springfield region from the 50-mile map pack in design/afterstreet_handoff/map_data/springfield_50mi.

The region is cut into the same squares the game uses for regions it downloads itself (0.05 degrees of latitude, about 5.6 km,
centred on Park Central Square). Each square becomes one small script, assets/springfield/<i>_<j>.js, holding that square's map in
the game's compact map format plus a margin of about 500 m:
  - buildings with the pack's type, floor count and name turned into the map tags the game reads
  - roads, tracks, paths and railways (by the pack's road class), rivers, streams and ditches, lakes and ponds
  - shops, restaurants, churches, clinics and the like (city zone only) so the buildings they are in get their use
  - elevation sampled from the pack's terrain tiles (14.6 m detail in the 15 km core, 157 m elsewhere)
  - the pack's terrain type grid (pasture, oak-hickory woods, pine-oak woods, scrub, riparian, wetland, lawns...), 78.6 m a cell
assets/map.js becomes the region's index: the squares, their sizes and the named places.
Usage: python3 tools/build_region.py   (then nothing else: the files are written straight into assets/)"""
import base64, json, math, os, struct, sys
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'design', 'afterstreet_handoff', 'map_data', 'springfield_50mi')
OUT = os.path.join(ROOT, 'assets', 'springfield'); os.makedirs(OUT, exist_ok=True)
LAT0, LON0, MILES = 37.2089, -93.2923, 50
DLAT = 0.05; DLON = round(0.05/math.cos(math.radians(LAT0)), 4)
MY = 0.0045; MX = MY/math.cos(math.radians(LAT0))

def load(n): return json.load(open(os.path.join(SRC, n + '.geojson')))['features']
def zone_in(i, j): return math.hypot(i*DLON*math.cos(math.radians(LAT0))*111.32, j*DLAT*110.54) <= MILES*1.609 + 3
N = math.ceil(MILES*1.609/(DLAT*110.54)) + 1
SQ = [(i, j) for j in range(-N, N + 1) for i in range(-N, N + 1) if zone_in(i, j)]
def box(i, j): return (LON0 + (i - 0.5)*DLON, LAT0 + (j - 0.5)*DLAT, LON0 + (i + 0.5)*DLON, LAT0 + (j + 0.5)*DLAT)   # w s e n
def cell_range(w, s, e, n):
    """squares whose box plus margin meets this bounding box"""
    i0 = math.floor((w - MX - LON0)/DLON + 0.5); i1 = math.floor((e + MX - LON0)/DLON + 0.5)
    j0 = math.floor((s - MY - LAT0)/DLAT + 0.5); j1 = math.floor((n + MY - LAT0)/DLAT + 0.5)
    return [(i, j) for j in range(j0, j1 + 1) for i in range(i0, i1 + 1)]
WAYS = {sq: [] for sq in SQ}; POIS = {sq: [] for sq in SQ}
def flat(cs, d=6): out = []; [out.extend((round(c[0], d), round(c[1], d))) for c in cs]; return out
def add_poly(tags, ring):
    if len(ring) < 4: return
    xs = [c[0] for c in ring]; ys = [c[1] for c in ring]
    for sq in cell_range(min(xs), min(ys), max(xs), max(ys)):
        if sq in WAYS: WAYS[sq].append([tags, flat(ring)])
def add_line(tags, cs):
    """a line is cut into the runs that fall inside each square plus its margin, so a 30 km river is not copied whole into every square"""
    if len(cs) < 2: return
    xs = [c[0] for c in cs]; ys = [c[1] for c in cs]
    for sq in cell_range(min(xs), min(ys), max(xs), max(ys)):
        if sq not in WAYS: continue
        w, s, e, n = box(*sq); w -= MX*1.2; e += MX*1.2; s -= MY*1.2; n += MY*1.2
        run = []
        for k in range(len(cs) - 1):
            a, b = cs[k], cs[k + 1]
            hit = not (max(a[0], b[0]) < w or min(a[0], b[0]) > e or max(a[1], b[1]) < s or min(a[1], b[1]) > n)
            if hit:
                if not run: run.append(a)
                run.append(b)
            elif run:
                WAYS[sq].append([tags, flat(run, 5)]); run = []
        if len(run) >= 2: WAYS[sq].append([tags, flat(run, 5)])   # lines to about 1 m

# ---------------- buildings: the pack's type becomes the building tag the game understands ----------------
BTAG = {'house': 'house', 'barn': 'barn', 'commercial': 'retail', 'garage': 'garage', 'shed': 'shed', 'apartments': 'apartments',
        'civic': 'civic', 'warehouse': 'warehouse', 'school': 'school', 'church': 'church', 'mobile_home': 'house', 'university': 'university',
        'hotel': 'hotel', 'hospital': 'hospital', 'cabin': 'cabin', 'boathouse': 'shed', 'big_box': 'retail', 'parking': 'parking',
        'stadium': 'stadium', 'ruin': 'house'}
nb = 0
for part in ('downtown', 'city', 'suburban', 'rural'):
    for f in load('buildings_' + part):
        p = f['properties']; g = f['geometry']
        rings = [g['coordinates'][0]] if g['type'] == 'Polygon' else [pg[0] for pg in g['coordinates']]
        t = {'building': BTAG.get(p['type'], 'yes')}
        if p.get('floors'): t['building:levels'] = str(max(1, min(12, int(round(float(p['floors']))))))
        for k in ('name', 'amenity', 'shop'):
            if p.get(k): t[k] = str(p[k])[:60]
        if p['type'] == 'ruin': t['ruins'] = 'yes'
        for r in rings: add_poly(t, r); nb += 1
print('buildings', nb)
# ---------------- roads ----------------
HWY = {'motorway': 'motorway', 'trunk': 'trunk', 'primary': 'primary', 'secondary': 'secondary', 'tertiary': 'tertiary', 'service': 'service',
       'track': 'track', 'busway': 'service'}
PATH = {'footway': 'footway', 'cycleway': 'cycleway', 'path': 'path', 'steps': 'steps', 'pedestrian': 'pedestrian', 'bridleway': 'bridleway', 'platform': None}
nr = 0
for part in ('roads_major', 'roads_minor_north', 'roads_minor_south', 'city_paths_trails'):
    for f in load(part):
        p = f['properties']; c = p.get('class'); sc = p.get('subclass'); t = None
        if p.get('tunnel'): continue
        if c in HWY: t = {'highway': HWY[c]}
        elif c == 'minor': t = {'highway': 'unclassified' if p.get('surface') == 'unpaved' else 'residential'}
        elif c == 'path':
            h = PATH.get(sc, 'path')
            if h: t = {'highway': h}
        elif c == 'rail': t = {'railway': 'rail'}
        if not t: continue
        g = f['geometry']; lines = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates'] if g['type'] == 'MultiLineString' else []
        for l in lines: add_line(t, l); nr += 1
print('roads', nr)
# ---------------- water ----------------
for f in load('waterways'):
    p = f['properties']; ww = p['waterway'] if p['waterway'] in ('river', 'stream', 'canal', 'ditch', 'drain') else 'stream'
    t = {'waterway': ww}
    if p.get('name'): t['name'] = p['name']
    g = f['geometry']; lines = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
    for l in lines: add_line(t, l)
for f in load('water_bodies'):
    p = f['properties']; t = {'natural': 'water'}
    if p.get('name'): t['name'] = p['name']
    g = f['geometry']; rings = [g['coordinates'][0]] if g['type'] == 'Polygon' else [pg[0] for pg in g['coordinates']]
    for r in rings: add_poly(t, r)
# ---------------- points of interest (the city zone) ----------------
DROP = {'gate', 'bus', 'bollard', 'bicycle_parking', 'lift_gate', 'waste_basket', 'atm', 'post', 'information', 'park', 'pitch', 'playground', 'swimming_pool',
        'parking', 'garden', 'running', 'basin', 'recycling', 'cemetery', 'picnic_site', 'shelter', 'golf', 'attraction', 'monument', 'art_gallery',
        'athletics', 'brownfield', 'drinking_water', 'toilets'}
def poi_tags(c, s):
    if c in DROP or not c: return None
    if c in ('shop', 'grocery'): return {'shop': s or 'general'}
    if c == 'clothing_store': return {'shop': 'clothes'}
    if c == 'alcohol_shop': return {'shop': 'alcohol'}
    if c == 'car': return {'shop': s or 'car'}
    if c == 'lodging': return {'tourism': s or 'hotel'}
    if c == 'office': return {'office': s or 'company'}
    if c == 'hospital': return {'amenity': 'clinic' if s == 'clinic' else 'hospital'}
    if c == 'college': return {'amenity': 'university'}
    if c == 'beer': return {'amenity': 'pub'}
    if c == 'town_hall': return {'amenity': s or 'townhall'}
    if c == 'library': return {'amenity': 'library'} if s != 'books' else {'shop': 'books'}
    if c == 'sports_centre': return {'leisure': 'sports_centre'}
    if c == 'stadium': return {'leisure': 'stadium'}
    return {'amenity': s or c}
npoi = 0
for f in load('city_features_pois'):
    p = f['properties']; t = poi_tags(p.get('class'), p.get('subclass'))
    if not t or f['geometry']['type'] != 'Point': continue
    if p.get('name'): t['name'] = str(p['name'])[:60]
    lon, lat = f['geometry']['coordinates'][:2]
    for sq in cell_range(lon, lat, lon, lat):
        if sq in POIS: POIS[sq].append([round(lon, 6), round(lat, 6), t]); npoi += 1
print('pois', npoi)

# ---------------- elevation ----------------
HJ = json.load(open(os.path.join(SRC, 'terrain', 'heightmap.json')))
def terr(name, meta):
    im = Image.open(os.path.join(SRC, 'terrain', name)).convert('RGB'); w, h = im.size; px = im.load()
    lo, hi = meta['min_m'] - 5, meta['max_m'] + 5
    arr = [[min(hi, max(lo, px[x, y][0]*256 + px[x, y][1] + px[x, y][2]/256 - 32768)) for x in range(w)] for y in range(h)]
    return {'bb': meta['bbox'], 'w': w, 'h': h, 'a': arr}
CORE = terr('core15km_terrarium.png', HJ['core15km']); REG = terr('region_terrarium.png', HJ['region'])
def samp(T, lon, lat):
    w, s, e, n = T['bb']; u = (lon - w)/(e - w)*(T['w'] - 1); v = (n - lat)/(n - s)*(T['h'] - 1)
    u = max(0, min(T['w'] - 1.001, u)); v = max(0, min(T['h'] - 1.001, v)); i, j = int(u), int(v); fu, fv = u - i, v - j; a = T['a']
    return (a[j][i]*(1 - fu) + a[j][i + 1]*fu)*(1 - fv) + (a[j + 1][i]*(1 - fu) + a[j + 1][i + 1]*fu)*fv
def height(lon, lat):
    r = samp(REG, lon, lat); w, s, e, n = CORE['bb']
    edge = min(lon - w, e - lon, (lat - s)/math.cos(math.radians(LAT0)), (n - lat)/math.cos(math.radians(LAT0)))   # degrees of longitude-ish to the core's edge
    if edge <= 0: return r
    k = min(1.0, edge/0.012)                                                                                     # blend over about 1 km
    return r + (samp(CORE, lon, lat) - r)*k
def elev(i, j):
    w, s, e, n = box(i, j); s -= MY*1.3; n += MY*1.3; w -= MX*1.3; e += MX*1.3
    cw, cs, ce, cn = CORE['bb']; incore = not (e < cw or w > ce or n < cs or s > cn)
    step = 20.0 if incore else 125.0
    cols = int((e - w)*math.cos(math.radians(LAT0))*111320/step) + 1; rows = int((n - s)*110540/step) + 1
    d = bytearray()
    for r in range(rows):
        lat = n - (n - s)*r/(rows - 1)
        for c in range(cols):
            d += struct.pack('<h', int(round(height(w + (e - w)*c/(cols - 1), lat)*10)))
    return {'s': round(s, 6), 'n': round(n, 6), 'w': round(w, 6), 'e': round(e, 6), 'cols': cols, 'rows': rows, 'd': base64.b64encode(bytes(d)).decode()}
# ---------------- terrain types ----------------
TC = json.load(open(os.path.join(SRC, 'terrain', 'terrain_class.json')))
PAL = {tuple(int(c['color'][k:k + 2], 16) for k in (1, 3, 5)): c['id'] for c in TC['classes']}
CLS = Image.open(os.path.join(SRC, 'terrain', 'terrain_class.png')).convert('RGB'); CW, CH = CLS.size; CPX = CLS.load()
cache = {}
def cls_at(x, y):
    rgb = CPX[x, y]
    if rgb in PAL: return PAL[rgb]
    if rgb not in cache: cache[rgb] = min(PAL.items(), key=lambda kv: sum((a - b)**2 for a, b in zip(kv[0], rgb)))[1]
    return cache[rgb]
def tclass(i, j):
    w, s, e, n = box(i, j); s -= MY*1.3; n += MY*1.3; w -= MX*1.3; e += MX*1.3
    bw, bs, be, bn = TC['bbox']
    x0 = max(0, int((w - bw)/(be - bw)*CW)); x1 = min(CW - 1, int(math.ceil((e - bw)/(be - bw)*CW)))
    y0 = max(0, int((bn - n)/(bn - bs)*CH)); y1 = min(CH - 1, int(math.ceil((bn - s)/(bn - bs)*CH)))
    if x1 <= x0 or y1 <= y0: return None
    d = bytes(cls_at(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1))
    return {'w': round(bw + x0/CW*(be - bw), 6), 'e': round(bw + (x1 + 1)/CW*(be - bw), 6), 'n': round(bn - y0/CH*(bn - bs), 6), 's': round(bn - (y1 + 1)/CH*(bn - bs), 6),
            'cols': x1 - x0 + 1, 'rows': y1 - y0 + 1, 'd': base64.b64encode(d).decode()}

# ---------------- write ----------------
for old in os.listdir(OUT):
    if old.endswith('.js'): os.remove(os.path.join(OUT, old))
index = []; total = 0
for (i, j) in SQ:
    w, s, e, n = box(i, j)
    m = {'lastblockMap': 1, 'name': 'Springfield', 'attribution': '© OpenStreetMap contributors (ODbL); elevation: AWS Terrain Tiles',
         'zone': {'s': round(s, 6), 'n': round(n, 6), 'w': round(w, 6), 'e': round(e, 6)},
         'ways': WAYS[(i, j)], 'pois': POIS[(i, j)], 'elev': elev(i, j)}
    tc = tclass(i, j)
    if tc: m['tclass'] = tc
    text = json.dumps(m, separators=(',', ':'), ensure_ascii=False)
    js = '/* Afterstreet: Springfield region square %d,%d, made by tools/build_region.py */\n(window.ART = window.ART || {})["sq:%d:%d"] = %s;\n' % (i, j, i, j, json.dumps(text, ensure_ascii=False))
    open(os.path.join(OUT, '%d_%d.js' % (i, j)), 'w', encoding='utf-8').write(js); total += len(js.encode())
    nbld = sum(1 for wy in WAYS[(i, j)] if 'building' in wy[0])
    index.append([i, j, nbld])
places = []
for f in load('places'):
    p = f['properties']; lon, lat = f['geometry']['coordinates'][:2]; places.append([p['name'], round(lon, 5), round(lat, 5), p.get('place'), p.get('rank')])
man = {'region': {'id': 'springfield-mo', 'name': 'Springfield, MO', 'lat': LAT0, 'lon': LON0, 'miles': MILES, 'dLat': DLAT, 'dLon': DLON, 'builtin': True},
       'squares': index, 'places': places, 'attribution': '© OpenStreetMap contributors (ODbL); elevation: AWS Terrain Tiles (SRTM/3DEP)'}
p = os.path.join(ROOT, 'assets', 'map.js')
open(p, 'w', encoding='utf-8').write('/* Afterstreet: the built-in Springfield region index, made by tools/build_region.py */\n(window.ART = window.ART || {}).map = ' + json.dumps(json.dumps(man, separators=(',', ':'), ensure_ascii=False), ensure_ascii=False) + ';\n')
print('squares', len(SQ), 'total MB', round(total/1e6, 1), 'biggest', sorted(index, key=lambda r: -r[2])[:5])
