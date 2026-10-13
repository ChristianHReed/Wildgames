#!/usr/bin/env python3
"""Turns trees and plants from Kenney's "Nature Kit" (CC0, www.kenney.nl) into what the game loads:
  - tools/out/nature.txt: the models (shared by both art sets), coloured in the game's palette and scaled to real sizes
  - tools/out/<set>/atlas3.png: a plain tile the models are drawn with, and a picture of each tree (an "impostor") for trees too far
    away to draw in full. The pictures are rendered here, in code, from the same models.
The kit's flat colours (teal leaves, salmon bark) are swapped for Ozark ones: oak and maple greens, dark pine, gold and russet in autumn.
Usage: python3 tools/build_nature.py "/path/to/nature-kit/Models/GLTF format" [full]"""
import sys, os, json, struct, base64, math
import numpy as np
from PIL import Image
SRC = sys.argv[1]; S = 2 if 'full' in sys.argv[2:] else 1
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); SET = os.path.join(OUT, 'full' if S == 2 else 'lite'); G = 4*S; T = 512*S

# trees: game name -> (kit model, height in metres). The order is the species number the game stores with each tree
TREES = [('oak', 'tree_oak', 11.0), ('maple', 'tree_default', 9.0), ('sycamore', 'tree_detailed', 13.0), ('poplar', 'tree_tall', 14.0),
         ('pine', 'tree_pineTallA', 15.0), ('cedar', 'tree_cone', 7.5)]
FALL = {'oak', 'maple', 'sycamore', 'poplar'}   # autumn: the same tree with its leaves turned
# small plants and things on the ground: game name -> (kit model, height in metres)
PLANTS = {'bush': ('plant_bushLarge', 1.3), 'bush_small': ('plant_bush', 0.8), 'shrub': ('plant_bushDetailed', 1.1), 'flowers_y': ('flower_yellowA', 0.35),
          'flowers_p': ('flower_purpleB', 0.35), 'flowers_r': ('flower_redA', 0.35), 'grass': ('grass', 0.35), 'grass_tall': ('grass_large', 0.6),
          'fern': ('plant_flatTall', 0.6), 'rock': ('rock_smallC', 0.45), 'mushrooms': ('mushroom_redGroup', 0.2), 'log': ('log', 0.45), 'stump': ('stump_round', 0.5)}
# the game's colours for the kit's materials (sRGB); per tree, leaves can be given their own green
MATC = {'woodBark': (110, 82, 60), 'woodBarkDark': (92, 66, 50), 'woodBirch': (200, 192, 176), 'wood': (126, 92, 62), 'leafsGreen': (96, 128, 64),
        'leafsDark': (58, 88, 56), 'leafsFall': (204, 120, 52), 'leafsFallDark': (168, 86, 48), 'grass': (104, 140, 66), 'dirt': (120, 92, 64), 'stone': (150, 146, 138),
        'stoneDark': (118, 114, 108), 'rock': (150, 146, 138), 'flowerYellow': (236, 200, 72), 'flowerPurple': (160, 120, 190), 'flowerRed': (210, 80, 60),
        'mushroomRed': (196, 70, 56), 'mushroomTan': (220, 200, 160), 'plant': (98, 138, 66)}
LEAF = {'oak': (92, 122, 58), 'maple': (110, 140, 64), 'sycamore': (122, 146, 72), 'poplar': (128, 150, 70), 'pine': (52, 82, 52), 'cedar': (60, 90, 60)}
FALLC = {'oak': (170, 90, 44), 'maple': (214, 96, 46), 'sycamore': (206, 160, 70), 'poplar': (226, 184, 72)}

CT = {5121: ('B', 1), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}; NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2*(y*y + z*z), 2*(x*y - z*w), 2*(x*z + y*w)], [2*(x*y + z*w), 1 - 2*(x*x + z*z), 2*(y*z - x*w)], [2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x + y*y)]])
def load(name):
    """every triangle of a .glb as (3 points, material name)"""
    b = open(os.path.join(SRC, name + '.glb'), 'rb').read(); L = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + L]); bin0 = 20 + L + 8
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; t, sz = CT[a['componentType']]; nc = NC[a['type']]; st = v.get('byteStride', 0) or sz*nc
        off = bin0 + v.get('byteOffset', 0) + a.get('byteOffset', 0)
        if st == sz*nc: return np.frombuffer(b, '<' + t, nc*a['count'], off).reshape(-1, nc).astype(np.float64)
        return np.stack([np.frombuffer(b, '<' + t, nc, off + k*st) for k in range(a['count'])]).astype(np.float64)
    tris = []
    def walk(ni, M, Tr):
        nd = j['nodes'][ni]; R = qmat(nd.get('rotation', [0, 0, 0, 1]))*np.array(nd.get('scale', [1, 1, 1])); M2 = M @ R; T2 = Tr + M @ np.array(nd.get('translation', [0, 0, 0]))
        if 'mesh' in nd:
            for pr in j['meshes'][nd['mesh']]['primitives']:
                P = acc(pr['attributes']['POSITION']) @ M2.T + T2; I = acc(pr['indices']).astype(int).reshape(-1, 3); mn = j['materials'][pr['material']]['name']
                for t in I: tris.append((P[t], mn))
        for c in nd.get('children', []): walk(c, M2, T2)
    roots = j['scenes'][j.get('scene', 0)]['nodes']
    for r in roots: walk(r, np.eye(3), np.zeros(3))
    return tris
def colour(mn, sp=None, fall=False):
    if mn.startswith('leafs') and sp:
        return (FALLC[sp] if fall and sp in FALLC else LEAF[sp])
    for k, v in MATC.items():
        if mn == k: return v
    for k, v in MATC.items():
        if mn.lower().startswith(k.lower()[:5]): return v
    return (128, 128, 128)
def model(name, height, sp=None, fall=False):
    tris = load(name); ys = [p[:, 1].max() for p, _ in tris]; y0 = min(p[:, 1].min() for p, _ in tris); k = height/(max(ys) - y0)
    out = []
    for p, mn in tris:
        q = (p - np.array([0, y0, 0]))*k; c = colour(mn, sp, fall)
        out.append((q, c))
    return out
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
for nm, (kit, h) in PLANTS.items(): add(nm, model(kit, h))
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
