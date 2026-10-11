#!/usr/bin/env python3
"""Turns chosen CC0 models (KayKit Furniture Bits and City Builder Bits, by Kay Lousberg) into one compact file the game embeds.
Usage: python3 tools/build_models.py /path/to/kaykit-furniture-bits-1.0 /path/to/kaykit-city-builder-bits-1.0
Each triangle becomes 3 points (millimetres, int16, already at game scale) and one flat colour sampled from the pack's colour atlas.
In the output a model's long side runs along x, which the game treats as "forward"."""
import sys, os, json, struct, base64
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
FURN = ['bed_single_A','bed_double_A','bed_double_B','couch','couch_pillows','armchair','table_medium','table_medium_long','table_small','table_low',
        'chair_A','chair_B_wood','chair_C','chair_stool','cabinet_medium_decorated','cabinet_small_decorated','cabinet_medium','lamp_standing','cactus_medium_A']
W4 = lambda n: [n] + [n + '_wheel_' + w for w in ('front_left', 'front_right', 'rear_left', 'rear_right')]
# name: (parts, scale, turn a quarter so the length runs along x)
CITY = {'car_sedan':(W4('car_sedan'), 4.8, True), 'car_hatchback':(W4('car_hatchback'), 4.8, True), 'car_stationwagon':(W4('car_stationwagon'), 4.8, True),
        'car_taxi':(W4('car_taxi'), 4.8, True), 'car_police':(W4('car_police'), 4.8, True),
        'streetlight':(['streetlight'], 6.0, False), 'firehydrant':(['firehydrant'], 4.0, False), 'bench':(['bench'], 4.5, False), 'dumpster':(['dumpster'], 4.0, False),
        'bush':(['bush'], 3.2, False), 'box':(['box_A'], 3.5, False)}
# pull the packs' bright colours toward the game's warm paper palette
def tone(c): g = (c[0]*0.3 + c[1]*0.59 + c[2]*0.11); return tuple(int(min(255, (v*0.72 + g*0.28)*0.93 + (12, 7, 0)[i])) for i, v in enumerate(c))
def read(path):
    v, vt, tris = [], [], []
    for l in open(path):
        a = l.split()
        if not a: continue
        if a[0] == 'v': v.append(tuple(map(float, a[1:4])))
        elif a[0] == 'vt': vt.append((float(a[1]), float(a[2])))
        elif a[0] == 'f':
            f = [tuple(int(x) if x else 0 for x in (p.split('/') + ['', ''])[:2]) for p in a[1:]]
            for i in range(1, len(f) - 1): tris.append((f[0], f[i], f[i + 1]))
    return v, vt, tris
index, blob = {}, b''
def add(name, objdir, parts, tex, scale, turn):
    global blob
    TW, TH = tex.size; pts, cols = [], []
    for part in parts:
        v, vt, tris = read(os.path.join(objdir, part + '.obj'))
        for t in tris:
            u = sum(vt[p[1] - 1][0] for p in t)/3; w = sum(vt[p[1] - 1][1] for p in t)/3
            cols.append(tone(tex.getpixel((min(TW - 1, max(0, int(u*TW))), min(TH - 1, max(0, int((1 - w)*TH)))))))
            for p in t:
                x, y, z = v[p[0] - 1]
                if turn: x, z = z, -x
                pts.append((x*scale, y*scale, z*scale))
    lo = min(p[1] for p in pts) if turn else 0
    pos = b''.join(struct.pack('<3h', int(round(p[0]*1000)), int(round((p[1] - lo)*1000)), int(round(p[2]*1000))) for p in pts)
    index[name] = {'o': len(blob), 'n': len(cols), 'hx': round(max(abs(p[0]) for p in pts), 2), 'hz': round(max(abs(p[2]) for p in pts), 2), 'h': round(max(p[1] for p in pts) - lo, 2)}
    blob += pos + b''.join(bytes(c) for c in cols)
F = os.path.join(sys.argv[1], 'addons/kaykit_furniture_bits/Assets'); ft = Image.open(os.path.join(F, 'texture/furniturebits_texture.png')).convert('RGB')
for n in FURN: add(n, os.path.join(F, 'obj'), [n], ft, 0.75, False)
C = os.path.join(sys.argv[2], 'addons/kaykit_city_builder_bits/Assets'); ct = Image.open(os.path.join(C, 'texture/citybits_texture.png')).convert('RGB')
for n, (parts, sc, turn) in CITY.items(): add(n, os.path.join(C, 'obj'), parts, ct, sc, turn)
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'models.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print(len(index), 'models,', sum(i['n'] for i in index.values()), 'triangles,', round(len(blob)/1024), 'KB')
print({k: (v['n'], v['hx'], v['hz'], v['h']) for k, v in index.items() if k in CITY})
