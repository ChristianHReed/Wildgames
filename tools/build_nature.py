#!/usr/bin/env python3
"""Builds the game's trees and plants from our own shaped models (assets/shaped/props.js, plants category):
  - tools/out/nature.txt: the models (shared by both art sets), scaled to real sizes
  - tools/out/<set>/atlas3.png: a plain tile the models are drawn with, and a picture of each tree (an "impostor") for trees too far
    away to draw in full. The pictures are rendered here, in code, from the same models.
First run `node tools/export_shaped_plants.js > tools/out/shaped_plants.json`. (Before 0.95.0 this read Kenney's Nature Kit.)
Usage: python3 tools/build_nature.py [full]"""
import sys, os, json, struct, base64, math
import numpy as np
from PIL import Image
S = 2 if 'full' in sys.argv[1:] else 1
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); SET = os.path.join(OUT, 'full' if S == 2 else 'lite'); G = 4*S; T = 512*S
SH = json.load(open(os.path.join(OUT, 'shaped_plants.json')))

# trees: game name -> (shaped model, height in metres). The order is the species number the game stores with each tree
TREES = [('oak', 'oak', 11.0), ('maple', 'maple', 9.0), ('sycamore', 'sycamore', 13.0), ('poplar', 'poplar', 14.0),
         ('pine', 'pine', 15.0), ('cedar', 'cedar', 7.5)]
FALLM = {'oak': 'oak_fall', 'maple': 'maple_fall', 'sycamore': 'sycamore_fall', 'poplar': 'poplar_fall'}   # autumn: the same tree with its leaves turned
FALL = set(FALLM)
# small plants and things on the ground: game name -> (shaped model, height in metres)
PLANTS = {'bush': ('bush', 1.3), 'bush_small': ('bush_small', 0.8), 'shrub': ('shrub', 1.1), 'flowers_y': ('flowers_yellow', 0.35),
          'flowers_p': ('flowers_purple', 0.35), 'flowers_r': ('flowers_red', 0.35), 'grass': ('grass_tuft', 0.35), 'grass_tall': ('grass_tall', 0.6),
          'fern': ('fern', 0.6), 'rock': ('rock', 0.45), 'mushrooms': ('mushrooms', 0.2), 'log': ('fallen_log', 0.45), 'stump': ('stump', 0.5)}
# 0.98.0: the woods pack's forest floor, at the size the pack made them (height 0 = keep it)
for _n in ('fern_a', 'fern_b', 'mayapple', 'wildflower_a', 'wildflower_b', 'wildflower_c', 'mushrooms', 'toadstool_ring', 'bracket_fungus', 'thicket_a', 'thicket_b', 'berry_bush',
           'sumac', 'sapling', 'log_hollow', 'log_mossy', 'stump_big', 'root_ball', 'brush_pile', 'snag_a', 'snag_b', 'boulder_moss', 'boulder_cluster'):
    PLANTS['w_' + _n] = ('w_' + _n, 0)
def model(name, height, sp=None, fall=False, var=''):
    """the shaped model's triangles, scaled so its top is `height` metres, standing on y = 0"""
    rows = SH[(FALLM[sp] if fall else name) + var]; tris = [(np.array(r[:9], float).reshape(3, 3), tuple(r[9:12])) for r in rows]
    y0 = min(p[:, 1].min() for p, _ in tris); k = height/(max(p[:, 1].max() for p, _ in tris) - y0) if height else 1
    return [((p - np.array([0, y0, 0]))*k, c) for p, c in tris]
def pack(tris):
    vd, td = [], []
    for q, c in tris:
        for v in q: vd.append(struct.pack('<5h', int(round(v[0]*1000)), int(round(v[1]*1000)), int(round(v[2]*1000)), 1024, 1024))
        td.append(bytes([0, int(c[0]), int(c[1]), int(c[2])]))
    return b''.join(vd), b''.join(td), len(tris)
# ---- impostors: draw the tree from the side, flat shaded like the game, into a square picture with a clear background ----
def impostor(tris, size):
    pts = np.concatenate([q for q, _ in tris]); w = max(np.abs(pts[:, 0]).max(), np.abs(pts[:, 2]).max()); h = pts[:, 1].max(); r = max(w, h/2)*1.02
    img = np.zeros((size, size, 4)); zb = np.full((size, size), -1e9); L = np.array([-0.44, 0.8, 0.4]); L /= np.linalg.norm(L)
    yy, xx = np.mgrid[0:size, 0:size]; px = (xx + 0.5)/size*2*r - r; py = (1 - (yy + 0.5)/size)*2*r
    for q, c in tris:
        n = np.cross(q[1] - q[0], q[2] - q[0]); nl = np.linalg.norm(n)
        if nl < 1e-9: continue
        n /= nl; n = n if n[2] >= 0 else -n
        lit = 1.0 if n @ L > 0.18 else 0.74; col = np.array(c, float)*np.array([lit, lit*(0.66/0.74 if lit < 1 else 1), lit*(0.68/0.74 if lit < 1 else 1)])
        a, b2, c2 = q[:, [0, 1]]; x0, x1 = min(a[0], b2[0], c2[0]), max(a[0], b2[0], c2[0]); y0, y1 = min(a[1], b2[1], c2[1]), max(a[1], b2[1], c2[1])
        i0, i1 = max(0, int((x0 + r)/(2*r)*size) - 1), min(size, int((x1 + r)/(2*r)*size) + 2); j0, j1 = max(0, int((1 - y1/(2*r))*size) - 1), min(size, int((1 - y0/(2*r))*size) + 2)
        if i1 <= i0 or j1 <= j0: continue
        X = px[j0:j1, i0:i1]; Y = py[j0:j1, i0:i1]
        d = (b2[1] - c2[1])*(a[0] - c2[0]) + (c2[0] - b2[0])*(a[1] - c2[1])
        if abs(d) < 1e-12: continue
        w0 = ((b2[1] - c2[1])*(X - c2[0]) + (c2[0] - b2[0])*(Y - c2[1]))/d; w1 = ((c2[1] - a[1])*(X - c2[0]) + (a[0] - c2[0])*(Y - c2[1]))/d; w2 = 1 - w0 - w1
        m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6); Z = w0*q[0, 2] + w1*q[1, 2] + w2*q[2, 2]; zs = zb[j0:j1, i0:i1]; m &= Z > zs
        zs[m] = Z[m]; sub = img[j0:j1, i0:i1]; sub[m, :3] = col; sub[m, 3] = 255
    return img, r
names = [t[0] for t in TREES]; built = {}; index, blob = {}, b''
def add(key, tris):
    global blob
    vd, td, n = pack(tris); hi = max(q[:, 1].max() for q, _ in tris)
    index[key] = {'o': len(blob), 'n': n, 'h': round(float(hi), 2)}; blob += vd + td
for sp, kit, h in TREES:
    tr = model(kit, h, sp); built[sp] = tr; add(sp, tr)
    if sp in FALL: tf = model(kit, h, sp, True); built[sp + '_fall'] = tf; add(sp + '_fall', tf)
for sp, kit, h in TREES:   # the two other shapes of every tree (the game picks one by where the tree stands)
    for v in ('_b', '_c'):
        add(sp + v, model(kit, h, sp, var=v))
        if sp in FALL: add(sp + '_fall' + v, model(kit, h, sp, True, v))
for nm, (kit, h) in PLANTS.items():
    add(nm, model(kit, h))
    for v in ('_b', '_c'):
        if kit + v in SH: add(nm + v, model(kit, h, var=v))
# atlas3: tile 0 plain white (models carry their own colours), tiles 1-6 the trees, 7-10 the autumn trees
sheet = Image.new('RGBA', (4*T, 4*T), (0, 0, 0, 0)); sheet.paste(Image.new('RGBA', (T, T), (255, 255, 255, 255)), (0, 0)); imp = {}
order = names + [n + '_fall' for n in names if n in FALL]
for i, key in enumerate(order):
    img, r = impostor(built[key], T - 2*G); imp[key] = round(r, 3)
    rgb = img[:, :, :3]; al = img[:, :, 3]; m = al > 0; rgb[~m] = rgb[m].mean(0) if m.any() else 0     # colour under the cut-out, so edges do not darken when shrunk
    tile = np.zeros((T, T, 4), np.uint8); tile[:, :, :3] = rgb[m].mean(0).astype(np.uint8); tile[G:T - G, G:T - G] = np.dstack([rgb, al]).astype(np.uint8)
    k = i + 1; sheet.paste(Image.fromarray(tile, 'RGBA'), ((k % 4)*T, (k//4)*T))
os.makedirs(SET, exist_ok=True); sheet.save(os.path.join(SET, 'atlas3.png'), optimize=True)
index['_imp'] = imp; index['_trees'] = names; index['_imptile'] = {k: i + 1 for i, k in enumerate(order)}
if S == 1 or not os.path.exists(os.path.join(OUT, 'nature.txt')): open(os.path.join(OUT, 'nature.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print({k: v['n'] for k, v in index.items() if k[0] != '_'}); print('nature', round(len(blob)/1024), 'KB, atlas3', round(os.path.getsize(os.path.join(SET, 'atlas3.png'))/1024), 'KB')
