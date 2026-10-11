#!/usr/bin/env python3
"""Turns trees and plants from the Quaternius "Stylized Nature MegaKit" (CC0) into what the game loads:
a texture sheet with cut-out leaves (tools/out/<set>/atlas3.png) and a set of models (tools/out/nature.txt, shared by both sets).
Usage: python3 tools/build_nature.py /path/to/kit [full]"""
import sys, os, json, struct, base64
import numpy as np
from PIL import Image
SRC = sys.argv[1]; S = 2 if 'full' in sys.argv[2:] else 1; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); SET = os.path.join(OUT, 'full' if S == 2 else 'lite'); G = 4*S; T = 512*S
TILES = ['Bark_NormalTree', 'Leaves_NormalTree_C', 'Leaf_Pine_C', 'Leaves', 'Grass', 'Flowers', 'Rocks_Diffuse', 'Bark_DeadTree']
sheet = Image.new('RGBA', (4*T, 2*T), (90, 110, 70, 0))
for i, n in enumerate(TILES):
    im = Image.open(os.path.join(SRC, 'Textures', n + '.png')).convert('RGBA').resize((T - 2*G, T - 2*G), Image.LANCZOS); a = np.asarray(im).astype(np.float64)
    rgb = a[:, :, :3]; g = rgb @ np.array([0.3, 0.59, 0.11]); rgb = np.clip((rgb*0.84 + g[:, :, None]*0.16)*0.97 + np.array([8, 4, 0]), 0, 255)   # toward the game's softer palette
    # colour bleeds outward under the cut-out so leaf edges do not pick up a dark fringe when the texture is shrunk
    al = a[:, :, 3]; m = al > 40; mean = rgb[m].mean(0) if m.any() else np.array([90, 110, 70]); rgb[~m] = mean
    out = np.dstack([rgb, al]).astype(np.uint8); big = np.pad(out, ((G, G), (G, G), (0, 0)), mode='wrap'); sheet.paste(Image.fromarray(big, 'RGBA'), ((i % 4)*T, (i//4)*T))
os.makedirs(SET, exist_ok=True); sheet.save(os.path.join(SET, 'atlas3.png'), optimize=True)
MAT = {'Bark_NormalTree':0, 'Leaves_NormalTree':1, 'Leaves_TwistedTree':1, 'Leaves_Pine':2, 'Leaves':3, 'Grass':4, 'Flowers':5, 'Rocks':6, 'Bark_DeadTree':7}
MODS = ['CommonTree_3', 'CommonTree_5', 'Pine_4', 'Pine_5', 'DeadTree_1', 'Bush_Common', 'Grass_Common_Short', 'Grass_Common_Tall', 'Plant_1', 'Clover_1', 'Flower_3_Single', 'Fern_1', 'Rock_Medium_2']
CT = {5121:('B', 1), 5123:('H', 2), 5125:('I', 4), 5126:('f', 4)}; NC = {'SCALAR':1, 'VEC2':2, 'VEC3':3, 'VEC4':4}
D = os.path.join(SRC, 'glTF'); index, blob = {}, b''
for name in MODS:
    j = json.load(open(os.path.join(D, name + '.gltf'))); b = open(os.path.join(D, j['buffers'][0]['uri']), 'rb').read()
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; t, sz = CT[a['componentType']]; nc = NC[a['type']]; st = v.get('byteStride', 0) or sz*nc; off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        if st == sz*nc: return np.frombuffer(b, '<' + t, nc*a['count'], off).reshape(-1, nc).astype(np.float64)
        return np.stack([np.frombuffer(b, '<' + t, nc, off + k*st) for k in range(a['count'])]).astype(np.float64)
    vd, td, nt, hi = [], [], 0, 0
    for nd in j['nodes']:
        if 'mesh' not in nd: continue
        sc = np.array(nd.get('scale', [1, 1, 1])); tr = np.array(nd.get('translation', [0, 0, 0]))
        for pr in j['meshes'][nd['mesh']]['primitives']:
            ti = MAT.get(j['materials'][pr['material']]['name'])
            if ti is None: continue
            P = acc(pr['attributes']['POSITION'])*sc + tr; UV = acc(pr['attributes']['TEXCOORD_0']); I = acc(pr['indices']).astype(int).reshape(-1, 3)
            for t in I:
                uvc = UV[t] - np.floor(UV[t].min(0))
                for k in range(3):
                    p = P[t[k]]; vd.append(struct.pack('<5h', int(round(p[0]*1000)), int(round(p[1]*1000)), int(round(p[2]*1000)), int(round(max(-15, min(15, uvc[k][0]))*2048)), int(round(max(-15, min(15, uvc[k][1]))*2048)))); hi = max(hi, p[1])
                td.append(bytes([ti, 255, 255, 255])); nt += 1
    index[name] = {'o': len(blob), 'n': nt, 'h': round(float(hi), 2)}; blob += b''.join(vd) + b''.join(td)
if S == 1 or not os.path.exists(os.path.join(OUT, 'nature.txt')): open(os.path.join(OUT, 'nature.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print({k: v['n'] for k, v in index.items()}); print('nature', round(len(blob)/1024), 'KB, atlas3', round(os.path.getsize(os.path.join(SET, 'atlas3.png'))/1024), 'KB')
