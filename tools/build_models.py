#!/usr/bin/env python3
"""Turns chosen CC0 furniture models (KayKit Furniture Bits, by Kay Lousberg) into one compact file the game embeds.
Usage: python3 tools/build_models.py /path/to/kaykit-furniture-bits-1.0
Each triangle becomes 3 points (millimetres, int16) and one flat colour sampled from the pack's colour atlas."""
import sys, os, json, struct, base64
from PIL import Image
SRC = os.path.join(sys.argv[1], 'addons/kaykit_furniture_bits/Assets'); OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
NAMES = ['bed_single_A','bed_double_A','bed_double_B','couch','couch_pillows','armchair','table_medium','table_medium_long','table_small','table_low',
         'chair_A','chair_B_wood','chair_C','chair_stool','cabinet_medium_decorated','cabinet_small_decorated','cabinet_medium','lamp_standing','cactus_medium_A']
tex = Image.open(os.path.join(SRC, 'texture/furniturebits_texture.png')).convert('RGB'); TW, TH = tex.size
# pull the pack's bright colours toward the game's warm paper palette
def tone(c): g = (c[0]*0.3 + c[1]*0.59 + c[2]*0.11); return tuple(int(min(255, (v*0.72 + g*0.28)*0.93 + (12, 7, 0)[i])) for i, v in enumerate(c))
index, blob = {}, b''
for n in NAMES:
    v, vt, tris = [], [], []
    for l in open(os.path.join(SRC, 'obj', n + '.obj')):
        a = l.split()
        if not a: continue
        if a[0] == 'v': v.append(tuple(map(float, a[1:4])))
        elif a[0] == 'vt': vt.append((float(a[1]), float(a[2])))
        elif a[0] == 'f':
            f = [tuple(int(x) if x else 0 for x in (p.split('/') + ['', ''])[:2]) for p in a[1:]]
            for i in range(1, len(f) - 1): tris.append((f[0], f[i], f[i + 1]))
    pos, col = b'', b''
    for t in tris:
        u = sum(vt[p[1] - 1][0] for p in t)/3; w = sum(vt[p[1] - 1][1] for p in t)/3
        c = tone(tex.getpixel((min(TW - 1, max(0, int(u*TW))), min(TH - 1, max(0, int((1 - w)*TH))))))
        for p in t: pos += struct.pack('<3h', *[int(round(x*1000)) for x in v[p[0] - 1]])
        col += bytes(c)
    xs = [p[0] for p in v]; zs = [p[2] for p in v]; ys = [p[1] for p in v]
    index[n] = {'o': len(blob), 'n': len(tris), 'hx': round(max(abs(min(xs)), max(xs)), 2), 'hz': round(max(abs(min(zs)), max(zs)), 2), 'h': round(max(ys), 2)}
    blob += pos + col
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'models.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print(len(NAMES), 'models,', sum(i['n'] for i in index.values()), 'triangles,', round(len(blob)/1024), 'KB')
