#!/usr/bin/env python3
"""Turns chosen CC0 models (KayKit Furniture Bits and City Builder Bits, by Kay Lousberg) into one compact file the game embeds.
Usage: python3 tools/build_models.py /path/to/kaykit-furniture-bits-1.0 /path/to/kaykit-city-builder-bits-1.0 [/path/to/kenney_furniture-kit]
The Kenney Furniture Kit (CC0, kenney.nl) is optional: it adds kitchen, bathroom, bedroom and office pieces, coloured from its materials.
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
# ---- Kenney Furniture Kit: each piece is one or more parts (name, x, y, z offset in the kit's units), scaled to life size,
# centred, and turned so its back is at -z like the KayKit pieces. BACK says which way the back faces in the kit's own files.
KS = 2.1
FORCE = {'k_cab': True}   # pieces the guess gets wrong
KEN = {'k_stove':[('kitchenStove', 0, 0, 0)], 'k_sink':[('kitchenSink', 0, 0, 0)], 'k_cab':[('kitchenCabinet', 0, 0, 0), ('kitchenCabinetUpper', 0, 0.62, 0.24)],
       'k_fridge':[('kitchenFridge', 0, 0, 0)], 'k_toilet':[('toilet', 0, 0, 0)], 'k_tub':[('bathtub', 0, 0, 0)], 'k_basin':[('bathroomSink', 0, 0.4, 0), ('bathroomMirror', 0, 0.62, -0.02)],
       'k_tv':[('cabinetTelevision', 0, 0, 0), ('televisionModern', 0, 0.3, 0)], 'k_night':[('cabinetBed', 0, 0, 0), ('lampSquareTable', 0, 0.23, 0)], 'k_closet':[('bookcaseClosedDoors', 0, 0, 0)],
       'k_books':[('bookcaseOpen', 0, 0, 0)], 'k_bunk':[('bedBunk', 0, 0, 0)], 'k_desk':[('desk', 0, 0, 0), ('computerScreen', 0, 0.38, -0.08), ('computerKeyboard', 0, 0.38, 0.08)],
       'k_lamp':[('lampSquareFloor', 0, 0, 0)], 'k_plant':[('pottedPlant', 0, 0, 0)], 'k_rug':[('rugRectangle', 0, 0, 0)], 'k_box':[('cardboardBoxClosed', 0, 0, 0)], 'k_washer':[('washer', 0, 0, 0)],
       'k_coat':[('coatRackStanding', 0, 0, 0)], 'k_trash':[('trashcan', 0, 0, 0)], 'k_bar':[('kitchenBar', 0, 0, 0)], 'k_stool':[('stoolBar', 0, 0, 0)], 'k_doorway':[('doorway', 0, 0, 0)]}
def readmtl(path):
    m, cur = {}, None
    for l in open(path):
        a = l.split()
        if not a: continue
        if a[0] == 'newmtl': cur = a[1]
        elif a[0] == 'Kd' and cur: m[cur] = tuple(int(float(x)*255) for x in a[1:4])
    return m
def readk(path):
    v, tris, mat = [], [], None
    for l in open(path):
        a = l.split()
        if not a: continue
        if a[0] == 'v': v.append(tuple(map(float, a[1:4])))
        elif a[0] == 'usemtl': mat = a[1]
        elif a[0] == 'f':
            f = [int(p.split('/')[0]) for p in a[1:]]
            for i in range(1, len(f) - 1): tris.append(((f[0], f[i], f[i + 1]), mat))
    return v, tris
def addk(name, kdir, parts):
    global blob
    pts, cols, mats = [], [], []
    for part, ox, oy, oz in parts:
        v, tris = readk(os.path.join(kdir, part + '.obj')); mt = readmtl(os.path.join(kdir, part + '.mtl'))
        if part == parts[0][0]: x0 = (min(p[0] for p in v) + max(p[0] for p in v))/2; z0 = min(p[2] for p in v); y0 = min(p[1] for p in v)
        bx = (min(p[0] for p in v) + max(p[0] for p in v))/2
        for t, mn in tris:
            cols.append(tone(mt.get(mn, (200, 200, 200)))); mats.append(mn)
            for k in t:
                x, y, z = v[k - 1]; pts.append(((x - bx + ox), (y - (y0 if part == parts[0][0] else min(p[1] for p in v)) + oy), (z - z0 + oz)))
    # which side is the back? taller parts (headboards, tank, mirror, sofa back) sit at the back; handles and glass are at the front
    zs = [p[2] for p in pts]; zmid = (min(zs) + max(zs))/2; hi = max(p[1] for p in pts)
    top = [p[2] for p in pts if p[1] > hi*0.75]; front = [pts[i*3][2] for i, mn in enumerate(mats) if mn in ('metal', 'metalLight', 'glass') ]
    score = (sum(top)/len(top) - zmid if top else 0)*1.0 - ((sum(front)/len(front) - zmid) if front else 0)*0.6
    flip = FORCE.get(name, score > 0)   # back at +z: turn it round
    out = []
    zc = zmid
    for x, y, z in pts:
        if flip: x, z = -x, -(z - zc)
        else: z = z - zc
        out.append((x*KS, y*KS, z*KS))
    pos = b''.join(struct.pack('<3h', int(round(p[0]*1000)), int(round(p[1]*1000)), int(round(p[2]*1000))) for p in out)
    index[name] = {'o': len(blob), 'n': len(cols), 'hx': round(max(abs(p[0]) for p in out), 2), 'hz': round(max(abs(p[2]) for p in out), 2), 'h': round(max(p[1] for p in out), 2)}
    blob += pos + b''.join(bytes(c) for c in cols)
    print(name, 'flip' if flip else 'kept', index[name])
if len(sys.argv) > 3:
    K = os.path.join(sys.argv[3], 'Models', 'OBJ format')
    for n, parts in KEN.items(): addk(n, K, parts)
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'models.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print(len(index), 'models,', sum(i['n'] for i in index.values()), 'triangles,', round(len(blob)/1024), 'KB')
print({k: (v['n'], v['hx'], v['hz'], v['h']) for k, v in index.items() if k in CITY})
