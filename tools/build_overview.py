#!/usr/bin/env python3
"""Builds assets/springfield/overview.js: a light picture of the WHOLE region for the big map (major roads, rail, rivers, lakes and a
density grid of buildings), so 'whole map visible' can show all squares without loading them. Run after tools/build_region.py:
    python3 tools/build_overview.py
Output: ART.overview = {lat0, lon0, q (units per degree), roads:[[kind, x0, y0, dx1, dy1, ...]], water:[...], lakes:[...], cell:[dLat, dLon], cells:[[row, col, n, col, n...]]}"""
import json, re, glob, math, os, sys
Q = 10000                    # coordinates are whole units of 1/10000 degree (about 10 m)
LAT0, LON0 = 37.2089, -93.2923
CELL = (0.002, 0.0025)
ROADK = {'motorway': 0, 'trunk': 0, 'primary': 0, 'motorway_link': 0, 'trunk_link': 0, 'primary_link': 0, 'secondary': 1, 'secondary_link': 1, 'tertiary': 2, 'tertiary_link': 2, 'rail': 4}
def rdp(p, eps):
    if len(p) < 3: return p
    a, b = p[0], p[-1]; dx, dy = b[0]-a[0], b[1]-a[1]; L = math.hypot(dx, dy) or 1e-9; best, bi = -1, 0
    for i in range(1, len(p)-1):
        d = abs(dy*(p[i][0]-a[0]) - dx*(p[i][1]-a[1]))/L
        if d > best: best, bi = d, i
    if best <= eps: return [a, b]
    return rdp(p[:bi+1], eps)[:-1] + rdp(p[bi:], eps)
def enc(pts):
    out = [pts[0][0], pts[0][1]]
    for i in range(1, len(pts)): out += [pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]]
    return out
roads, water, lakes, cells, seen = [], [], [], {}, set()
files = glob.glob('assets/springfield/*_*.js')
for n, f in enumerate(files):
    t = open(f).read(); m = re.search(r'= (".*");?\s*$', t, re.S)
    if not m: continue
    d = json.loads(json.loads(m.group(1)))
    for tg, c in d['ways']:
        pts = [(round((c[i]-LON0)*Q), round((c[i+1]-LAT0)*Q)) for i in range(0, len(c)-1, 2)]
        if len(pts) < 2: continue
        key = (pts[0], pts[-1], len(pts))
        if 'building' in tg:
            if key in seen: continue
            seen.add(key)
            cx = sum(p[0] for p in pts)/len(pts)/Q + LON0; cy = sum(p[1] for p in pts)/len(pts)/Q + LAT0
            r, cc = int(math.floor((cy-LAT0)/CELL[0])), int(math.floor((cx-LON0)/CELL[1])); cells[(r, cc)] = min(255, cells.get((r, cc), 0)+1); continue
        h = tg.get('highway') or tg.get('railway')
        if h in ROADK:
            if key in seen: continue
            seen.add(key); roads.append([ROADK[h]] + enc(rdp(pts, 2.5))); continue
        w = tg.get('waterway')
        if w in ('river', 'stream') and (w == 'river' or tg.get('name')):
            if key in seen: continue
            seen.add(key); water.append(enc(rdp(pts, 2.5))); continue
        if tg.get('natural') == 'water' and pts[0] == pts[-1]:
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            if (max(xs)-min(xs))*(max(ys)-min(ys)) < 40*40: continue      # ponds smaller than about 400 m square are left to the close-up map
            if key in seen: continue
            seen.add(key); lakes.append(enc(rdp(pts, 2.5)))
    if n % 100 == 0: print(n, len(files), len(roads), len(water), len(lakes), len(cells), file=sys.stderr)
rows = {}
for (r, c), v in cells.items(): rows.setdefault(r, []).append((c, v))
cl = [[r] + [x for c, v in sorted(rows[r]) for x in (c, v)] for r in sorted(rows)]
o = {'lat0': LAT0, 'lon0': LON0, 'q': Q, 'roads': roads, 'water': water, 'lakes': lakes, 'cell': list(CELL), 'cells': cl}
js = '/* Afterstreet: a light picture of the whole region for the big map, made by tools/build_overview.py */\n(window.ART = window.ART || {}).overview = ' + json.dumps(json.dumps(o, separators=(',', ':'))) + ';\n'
open('assets/springfield/overview.js', 'w').write(js); print('wrote', len(js)//1024, 'KB', len(roads), 'roads', len(water), 'water', len(lakes), 'lakes', len(cells), 'cells')
