#!/usr/bin/env python3
"""Turns pieces of the Quaternius "Downtown City MegaKit" (CC0) into what the game embeds: a second texture sheet and a set of wall modules.
Usage: python3 tools/build_kit.py /path/to/Downtown_City_MegaKit
Writes tools/out/atlas2.jpg (2048x1024, eight 512 px tiles with wrapped gutters) and tools/out/kit.txt (module index + binary).
A module is 2 m wide (x from -1 to 1), 3 m tall, with its outside face toward +z. The faces that would sit against the building are dropped."""
import sys, os, json, struct, base64
import numpy as np
from PIL import Image
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); G = 4
TILES = ['T_RedBrick_BaseColor', 'T_Trim_BaseColor', 'T_MetalConcrete_BaseColor', 'T_Concrete_BaseColor', 'T_RoofSlate_BaseColor', 'T_Ornaments_BaseColor', 'T_Dirt_BaseColor']
sheet = Image.new('RGB', (2048, 1024), (128, 120, 110))
for i, n in enumerate(TILES):
    im = Image.open(os.path.join(SRC, 'Textures', n + '.png')).convert('RGB').resize((512 - 2*G, 512 - 2*G), Image.LANCZOS)
    a = np.asarray(im).astype(np.float64); g = a @ np.array([0.3, 0.59, 0.11]); a = np.clip((a*0.82 + g[:, :, None]*0.18)*0.97 + np.array([9, 5, 0]), 0, 255).astype(np.uint8)   # toward the game's warm, softer palette
    big = np.pad(a, ((G, G), (G, G), (0, 0)), mode='wrap'); sheet.paste(Image.fromarray(big), ((i % 4)*512, (i//4)*512))
os.makedirs(OUT, exist_ok=True); sheet.save(os.path.join(OUT, 'atlas2.jpg'), quality=84)
# material -> (tile index or 255 for flat colour, tint)
MAT = {'MI_RedBrick':(0, (255, 255, 255)), 'MI_RedBrick_Pale':(0, (255, 244, 226)), 'MI_Trim':(1, (255, 255, 255)), 'MI_Trim_Dark':(1, (120, 112, 104)), 'MI_Trim_Green':(1, (150, 178, 140)),
       'MI_Trim_MetalConcrete':(2, (255, 255, 255)), 'MI_Concrete':(3, (255, 255, 255)), 'MI_Roof_Slate':(4, (255, 255, 255)), 'MI_Ornaments':(5, (255, 255, 255)), 'MI_Dirt':(6, (255, 255, 255)),
       'MI_Glass':(255, (66, 86, 106)), 'MI_FakeInterior':None, 'MI_InteriorWall':None, 'MI_InteriorFloor':None, 'MI_InteriorRoof':None, 'MI_Asphalt':(3, (120, 118, 116))}
MODS = ['Brick_Plain_3', 'Brick_Window_Square_Single', 'Brick_TopTrim', 'Brick_BottomTrim', 'Metal_Plain_3', 'Metal_FirstFloor_Window', 'Metal_FirstFloor_Wall', 'Metal_FullWindow',
        'Trim_Plain_3', 'Trim_FirstFloor_Window_001', 'Trim_FirstFloor_Wall', 'DoorFrame_Metal_Single', 'Cornice_Brick_Center', 'Cornice_Metal_Center', 'Cornice_Trim_Center',
        'Metal_Column_Center', 'Brick_HalfColumn_Center', 'Prop_ACUnit', 'Prop_Planter_Single', 'Prop_Bollard']
CT = {5121:('B', 1), 5123:('H', 2), 5125:('I', 4), 5126:('f', 4)}; NC = {'SCALAR':1, 'VEC2':2, 'VEC3':3, 'VEC4':4}
D = os.path.join(SRC, 'Exports', 'glTF (Godot)'); index, blob = {}, b''
for name in MODS:
    j = json.load(open(os.path.join(D, name + '.gltf'))); b = open(os.path.join(D, j['buffers'][0]['uri']), 'rb').read()
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; t, sz = CT[a['componentType']]; nc = NC[a['type']]; st = v.get('byteStride', 0) or sz*nc; off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        return np.stack([np.frombuffer(b, '<' + t, nc, off + k*st) for k in range(a['count'])]).astype(np.float64)
    vd, td, nt = b'', b'', 0; lo = [9, 9, 9]; hi = [-9, -9, -9]
    for m in j['meshes']:
        for pr in m['primitives']:
            mt = MAT.get(j['materials'][pr['material']]['name']); 
            if mt is None: continue
            P = acc(pr['attributes']['POSITION']); UV = acc(pr['attributes']['TEXCOORD_0']); I = acc(pr['indices']).astype(int).reshape(-1, 3)
            for t in I:
                if np.linalg.norm(np.cross(P[t[1]] - P[t[0]], P[t[2]] - P[t[0]])) < 1e-9: continue
                uvc = UV[t] - np.floor(UV[t].min(0))      # keep the numbers small; whole-number shifts do not change a tiled texture
                for k in range(3):
                    p = P[t[k]]; vd += struct.pack('<5h', int(round(p[0]*1000)), int(round(p[1]*1000)), int(round(p[2]*1000)), int(round(max(-15, min(15, uvc[k][0]))*2048)), int(round(max(-15, min(15, uvc[k][1]))*2048)))
                    lo = [min(lo[q], p[q]) for q in range(3)]; hi = [max(hi[q], p[q]) for q in range(3)]
                td += bytes([mt[0], mt[1][0], mt[1][1], mt[1][2]]); nt += 1
    index[name] = {'o': len(blob), 'n': nt, 'lo': [round(x, 2) for x in lo], 'hi': [round(x, 2) for x in hi]}; blob += vd + td
open(os.path.join(OUT, 'kit.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print({k: v['n'] for k, v in index.items()}); print('kit', round(len(blob)/1024), 'KB, atlas2', round(os.path.getsize(os.path.join(OUT, 'atlas2.jpg'))/1024), 'KB')
