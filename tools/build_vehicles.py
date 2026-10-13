#!/usr/bin/env python3
"""Turns cars from Kenney's "Car Kit" (CC0, www.kenney.nl) into what the game loads (tools/out/vehicles.txt -> assets/vehicles.js).
Each car is split into parts so the game can move them: the body, each wheel (spins as the car rolls; the front ones steer), and for
the pickup truck its bonnet (it lifts open while the engine is being worked on).
Loose parts from the kit (a tyre, a door) lie by the broken truck. Colours come from the kit's colour map, toned to the game's palette.
Also adds four item icons (toolkit, tyre, car battery, engine parts) to tools/out/<set>/icons.png, drawn in code in the game's flat style.
Usage: python3 tools/build_vehicles.py "/path/to/car-kit/Models/GLB format" """
import sys, os, json, struct, base64
import numpy as np
from PIL import Image, ImageDraw
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
TEX = Image.open(os.path.join(SRC, 'Textures', 'colormap.png')).convert('RGB'); TW, TH = TEX.size
# the kit's cars are short and wide; lengthen and heighten them (a uniform scale for length and height keeps the wheels round)
SL, SW = 1.62, 1.32
CARS = {'truck': 'truck', 'sedan': 'sedan', 'suv': 'suv', 'van': 'van', 'police': 'police', 'taxi': 'taxi', 'hatch': 'hatchback-sports'}
LOOSE = {'tire': ('debris-tire', 1.0), 'door': ('debris-door', 1.0)}
# the truck's paint: the kit's bright green becomes a faded farm-truck red
PAINT = {'truck': (150, 62, 48)}

CT = {5121: ('B', 1), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}; NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2*(y*y + z*z), 2*(x*y - z*w), 2*(x*z + y*w)], [2*(x*y + z*w), 1 - 2*(x*x + z*z), 2*(y*z - x*w)], [2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x + y*y)]])
def load(name):
    """{node name: (triangles as 3 points in the node's own frame after rotation/scale, colours, node position)}"""
    b = open(os.path.join(SRC, name + '.glb'), 'rb').read(); L = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + L]); bin0 = 20 + L + 8
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; t, sz = CT[a['componentType']]; nc = NC[a['type']]; st = v.get('byteStride', 0) or sz*nc
        off = bin0 + v.get('byteOffset', 0) + a.get('byteOffset', 0)
        if st == sz*nc: return np.frombuffer(b, '<' + t, nc*a['count'], off).reshape(-1, nc).astype(np.float64)
        return np.stack([np.frombuffer(b, '<' + t, nc, off + k*st) for k in range(a['count'])]).astype(np.float64)
    parts = {}
    def walk(ni, M, Tr):
        nd = j['nodes'][ni]; R = qmat(nd.get('rotation', [0, 0, 0, 1]))*np.array(nd.get('scale', [1, 1, 1])); M2 = M @ R; T2 = Tr + M @ np.array(nd.get('translation', [0, 0, 0]))
        if 'mesh' in nd:
            tris, cols = [], []
            for pr in j['meshes'][nd['mesh']]['primitives']:
                P = acc(pr['attributes']['POSITION']) @ M2.T; UV = acc(pr['attributes']['TEXCOORD_0']); I = acc(pr['indices']).astype(int).reshape(-1, 3)
                for t in I:
                    u, v = UV[t].mean(0); tris.append(P[t]); cols.append(TEX.getpixel((min(TW - 1, max(0, int(u*TW))), min(TH - 1, max(0, int(v*TH))))))
            parts[nd['name']] = (np.array(tris), cols, T2)
        for c in nd.get('children', []): walk(c, M2, T2)
    for r in j['scenes'][j.get('scene', 0)]['nodes']: walk(r, np.eye(3), np.zeros(3))
    return parts
def tone(c, paint=None):
    """pull the kit's bright colours toward the game's warm, slightly faded palette; repaint the main body colour if asked"""
    r, g, b = c
    if paint and g > r + 30 and g > b + 20: s = (r + g + b)/3/150; c = tuple(min(255, int(v*s)) for v in paint)   # the kit's green paint
    gr = c[0]*0.3 + c[1]*0.59 + c[2]*0.11
    return tuple(int(min(255, (v*0.74 + gr*0.26)*0.94 + (10, 6, 0)[i])) for i, v in enumerate(c))
def toGame(p):
    """kit (x left, y up, z forward) -> game model (x forward, y up, z = -left), scaled"""
    return np.stack([p[..., 2]*SL, p[..., 1]*SL, -p[..., 0]*SW], -1)
index, blob = {}, b''
def simple_wheel(g, cl, side, n=12):
    """a 12-sided wheel the size of the kit's: dark tyre, grey hub on the outer face"""
    pts = g.reshape(-1, 3); r = float(np.abs(pts[:, 0]).max()); z0, z1 = float(pts[:, 2].min()), float(pts[:, 2].max())
    out, inn = (z1, z0) if side > 0 else (z0, z1)
    cols = sorted(set(tone(x) for x in cl), key=sum); tyre, hub = cols[0], cols[-1]
    ring = [(np.cos(2*np.pi*i/n)*r, np.sin(2*np.pi*i/n)*r) for i in range(n)]
    tris, cs = [], []
    def T(a, b, c, col): tris.append([a, b, c]); cs.append(col)
    for i in range(n):
        (ax, ay), (bx, by) = ring[i], ring[(i + 1) % n]
        T((ax, ay, out), (bx, by, out), (bx, by, inn), tyre); T((ax, ay, out), (bx, by, inn), (ax, ay, inn), tyre)
        T((0, 0, inn), (bx, by, inn), (ax, ay, inn), tyre)
        T((ax*0.62, ay*0.62, out), (bx*0.62, by*0.62, out), (bx, by, out), tyre); T((ax*0.62, ay*0.62, out), (bx, by, out), (ax, ay, out), tyre)
        T((0, 0, out + (0.02 if side > 0 else -0.02)), (bx*0.62, by*0.62, out), (ax*0.62, ay*0.62, out), hub)
    return np.array(tris, float), cs
def add(key, tris, cols, extra=None):
    global blob
    pos = b''.join(struct.pack('<3h', *[int(round(v*1000)) for v in pt]) for t in tris for pt in t)
    pts = tris.reshape(-1, 3)
    index[key] = dict({'o': len(blob), 'n': len(cols), 'hx': round(float(np.abs(pts[:, 0]).max()), 2), 'hz': round(float(np.abs(pts[:, 2]).max()), 2), 'h': round(float(pts[:, 1].max()), 2)}, **(extra or {}))
    blob += pos + b''.join(bytes(c) for c in cols)
for key, kit in CARS.items():
    parts = load(kit); body = parts['body']; paint = PAINT.get(key)
    bt = toGame(body[0] + body[2]); bc = [tone(c, paint) for c in body[1]]
    wheels = []
    for nm, (tr, cl, T) in sorted(parts.items()):
        if not nm.startswith('wheel') or nm == 'wheel-back': continue   # the SUV's spare on its back door stays part of the body
        c = toGame(T); k = key + '_w' + str(len(wheels)); wheels.append([round(float(c[0]), 3), round(float(c[1]), 3), round(float(c[2]), 3), 1 if 'front' in nm else 0, k])
        g = toGame(tr)
        if key == 'truck': add(k, g, [tone(x) for x in cl])    # the truck you fix keeps the kit's detailed wheels
        else: add(k, *simple_wheel(g, cl, float(c[2])))          # town cars get light ones (about a fifth of the triangles)
    if 'wheel-back' in parts:
        tr, cl, T = parts['wheel-back']; bt = np.concatenate([bt, toGame(tr + T)]); bc += [tone(x) for x in cl]
    extra = {'w': wheels}
    if key == 'truck':
        # the bonnet: the flat top in front of the windscreen (it hinges at its back edge). It is copied, not cut out, so the body has
        # no hole; the game covers the closed one with the open engine bay while the bonnet is up
        cen = bt.mean(1); nrm = np.cross(bt[:, 1] - bt[:, 0], bt[:, 2] - bt[:, 0]); nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
        hood = (cen[:, 0] > 1.2) & (cen[:, 1] > 1.05) & (nrm[:, 1] > 0.9)
        hp = bt[hood].reshape(-1, 3); hx = float(hp[:, 0].min()); hy = float(hp[:, 1].max())
        add('truck_hood', bt[hood] - np.array([hx, hy, 0]), [bc[i] for i in np.nonzero(hood)[0]], {'px': round(hx, 3), 'py': round(hy, 3), 'x1': round(float(hp[:, 0].max()), 3), 'y1': round(float(hp[:, 1].min()), 3), 'hw': round(float(np.abs(hp[:, 2]).max()), 3)})
    add(key, bt, bc, extra)
for key, (kit, s) in LOOSE.items():
    parts = load(kit); tr, cl, T = list(parts.values())[0]; t = toGame(tr + T)*s; t[..., 1] -= t[..., 1].min()
    add(key, t, [tone(c, PAINT['truck'] if key == 'door' else None) for c in cl])

open(os.path.join(OUT, 'vehicles.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print({k: v['n'] for k, v in index.items()}); print('vehicles', round(len(blob)/1024), 'KB')

# ---- four item icons, slots 27-30 of the icon strip, in the same flat outlined style as the lantern, radio and generator
INKC = (61, 48, 41, 255); LW = 14
def canvas():
    im = Image.new('RGBA', (384, 384)); d = ImageDraw.Draw(im); d.ellipse([40, 330, 344, 364], fill=(61, 48, 41, 60)); return im, d
def toolkit():
    im, d = canvas()
    d.arc([132, 70, 252, 170], 180, 360, fill=INKC, width=LW + 6)                                                   # handle
    d.rounded_rectangle([50, 130, 334, 320], 18, fill=(198, 72, 52, 255), outline=INKC, width=LW)                  # box
    d.rectangle([50, 176, 334, 196], fill=(150, 50, 40, 255)); d.line([50, 186, 334, 186], fill=INKC, width=8)
    d.rounded_rectangle([170, 196, 214, 228], 6, fill=(217, 168, 69, 255), outline=INKC, width=8)                  # latch
    d.line([220, 290, 330, 60], fill=(185, 192, 198, 255), width=26); d.line([220, 290, 330, 60], fill=INKC, width=6)   # a wrench poking out
    d.ellipse([300, 30, 360, 90], fill=(185, 192, 198, 255), outline=INKC, width=10); d.rectangle([318, 24, 342, 56], fill=(0, 0, 0, 0))
    return im
def tire():
    im, d = canvas()
    d.ellipse([52, 40, 332, 320], fill=(46, 44, 46, 255), outline=INKC, width=LW)
    for k in range(12):
        a = k*np.pi/6; x, y = 192 + np.cos(a)*126, 180 + np.sin(a)*126; d.line([x, y, 192 + np.cos(a)*140, 180 + np.sin(a)*140], fill=(90, 88, 92, 255), width=10)
    d.ellipse([122, 110, 262, 250], fill=(185, 192, 198, 255), outline=INKC, width=LW)
    d.ellipse([170, 158, 214, 202], fill=(120, 126, 132, 255), outline=INKC, width=8)
    return im
def carbat():
    im, d = canvas()
    d.rounded_rectangle([96, 50, 156, 100], 8, fill=(198, 72, 52, 255), outline=INKC, width=10)                   # + terminal
    d.rounded_rectangle([228, 50, 288, 100], 8, fill=(140, 146, 150, 255), outline=INKC, width=10)                # - terminal
    d.rounded_rectangle([50, 90, 334, 320], 16, fill=(52, 56, 62, 255), outline=INKC, width=LW)
    d.rectangle([70, 150, 314, 230], fill=(217, 168, 69, 255)); d.line([70, 150, 314, 150], fill=INKC, width=6); d.line([70, 230, 314, 230], fill=INKC, width=6)
    d.line([110, 190, 150, 190], fill=INKC, width=12); d.line([130, 170, 130, 210], fill=INKC, width=12); d.line([236, 190, 276, 190], fill=INKC, width=12)
    return im
def parts():
    im, d = canvas()
    d.ellipse([40, 60, 250, 230], outline=INKC, width=LW + 22); d.ellipse([40, 60, 250, 230], outline=(70, 70, 74, 255), width=22)   # fan belt
    d.line([150, 300, 220, 230, 300, 230, 340, 150], fill=INKC, width=50, joint='curve'); d.line([150, 300, 220, 230, 300, 230, 340, 150], fill=(70, 74, 78, 255), width=30, joint='curve')  # hose
    for (x, y) in [(150, 300), (340, 150)]: d.ellipse([x - 26, y - 26, x + 26, y + 26], fill=(185, 192, 198, 255), outline=INKC, width=10)   # clamps
    d.ellipse([220, 260, 300, 340], fill=(217, 168, 69, 255), outline=INKC, width=10); d.ellipse([248, 288, 272, 312], fill=(0, 0, 0, 0), outline=INKC, width=8)   # a nut
    return im
for s in ('lite', 'full'):
    p = os.path.join(OUT, s, 'icons.png')
    if not os.path.exists(p): continue
    old = Image.open(p).convert('RGBA'); new = Image.new('RGBA', (96*31, 96)); new.paste(old.crop((0, 0, min(old.width, 96*27), 96)), (0, 0))
    for k, f in enumerate([toolkit, tire, carbat, parts]): new.paste(f().resize((96, 96), Image.LANCZOS), ((27 + k)*96, 0))
    new.save(p, optimize=True)
print('icons: toolkit, tire, car battery, engine parts in slots 27-30')
