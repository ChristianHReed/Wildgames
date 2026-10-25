#!/usr/bin/env python3
"""Afterstreet furniture, set 2 (25 October 2026): the thirteen pieces that replace the Kenney Furniture Kit. Writes assets/shaped/furniture2.js.
Footprints match tools/out/models.txt (half extents hx, hz and height h). Origin at the centre of the base, front facing +Z, metres."""
import math
from kit import *
P = {'wood': '#8a6a46', 'woodD': '#6a4e32', 'woodL': '#b08a5c', 'paintW': '#e6e2d6', 'paintB': '#5a7a9a', 'knob': '#c8b070', 'metal': '#a8aaa8', 'metalD': '#6a6c6e', 'glass': '#9cc4d0', 'black': '#26272a',
     'ceramic': '#eceae2', 'pot': '#b8603a', 'potD': '#8a4428', 'cactus': '#4a7a48', 'cactusL': '#6a9a58', 'spine': '#e8e4c0', 'leaf': '#4a7a3e', 'leafD': '#355a2c', 'soil': '#3a2c20',
     'rug': '#9a3a32', 'rugB': '#e0d0a8', 'rugC': '#3a4a6a', 'mattress': '#d8d4c8', 'blanket': '#4a6a8a', 'blanket2': '#a8523a', 'pillow': '#f0ece0', 'tile': '#d8d6cc', 'drum': '#222428', 'dial': '#4a8ac0'}
M = {}
def bx(x, y, z, w, h, d, c): return box([x, y + h/2, z], [w, h, d], c)
def cab_decor(hx, hz, h, c='wood'):  # panel lines and knobs
    return []
def stool(hx, hz, h, c='wood', legc='woodD'):
    o = [bx(0, h - 0.06, 0, hx*2, 0.06, hz*2, c)]
    o += [bx(sx*(hx - 0.04), 0, sz*(hz - 0.04), 0.045, h - 0.06, 0.045, legc) for sx in (1, -1) for sz in (1, -1)]
    o += [bx(0, h*0.35, sz*(hz - 0.04), hx*2 - 0.08, 0.03, 0.03, legc) for sz in (1, -1)]
    return o
M['chair_stool'] = stool(0.28, 0.28, 0.38)
M['k_stool'] = stool(0.28, 0.24, 0.91, 'paintB', 'metalD') + [bx(0, 0.5, -0.22, 0.5, 0.2, 0.03, 'paintB')]
def cabinet(hx, hz, h, doors=2, decorated=False, drawers=0):
    o = [bx(0, 0, 0, hx*2, h - 0.04, hz*2 - 0.03, 'wood'), bx(0, 0, 0, hx*2, 0.08, hz*2, 'woodD'), bx(0, h - 0.04, 0, hx*2, 0.04, hz*2, 'woodL')]
    dw = (hx*2 - 0.1)/doors; dz = hz - 0.012
    top = h - 0.1 - (0.22*drawers)
    for i in range(doors):
        cx = -hx + 0.05 + dw*(i + 0.5)
        o.append(bx(cx, 0.12, dz, dw - 0.03, top - 0.12, 0.02, 'woodL'))
        if decorated: o += [bx(cx, 0.12 + (top - 0.12)*0.5, dz + 0.008, dw - 0.14, (top - 0.12)*0.55, 0.012, 'woodD'), bx(cx, 0.12 + (top - 0.12)*0.5, dz + 0.012, dw - 0.24, (top - 0.12)*0.4, 0.01, 'woodL')]
        o.append(bx(cx + (dw*0.35 if i % 2 == 0 else -dw*0.35), 0.12 + (top - 0.12)*0.5, dz + 0.012, 0.03, 0.09, 0.015, 'knob'))
    for j in range(drawers):
        y = top + 0.02 + 0.22*j; o += [bx(0, y, dz, hx*2 - 0.1, 0.19, 0.02, 'woodL'), bx(0, y + 0.07, dz + 0.012, 0.14, 0.03, 0.015, 'knob')]
    return o
M['cabinet_medium'] = cabinet(0.75, 0.38, 0.75, doors=3, drawers=1)
M['cabinet_medium_decorated'] = cabinet(0.78, 0.38, 1.37, doors=2, decorated=True, drawers=2)
M['cabinet_small_decorated'] = cabinet(0.41, 0.45, 1.21, doors=1, decorated=True, drawers=2)
def pot(r, h, c='pot'): return [loft([[0, 0, 0, r*0.7, r*0.7], [0, h*0.85, 0, r, r], [0, h, 0, r*1.05, r*1.05]], c, n=8, caps=[True, False]), loft([[0, h - 0.01, 0, r*0.98, r*0.98], [0, h, 0, r*0.98, r*0.98]], 'soil', n=8, caps=[True, True])]
def cactus():
    o = pot(0.2, 0.2) + [loft([[0, 0.2, 0, 0.14, 0.14], [0, 0.34, 0, 0.16, 0.16], [0, 0.52, 0, 0.13, 0.13], [0, 0.62, 0, 0.0, 0.0]], 'cactus', n=8, caps=[False, False])]
    o += [loft([[0.1, 0.34, 0, 0.06, 0.06], [0.28, 0.4, 0, 0.06, 0.06], [0.31, 0.42, 0, 0.06, 0.06], [0.33, 0.5, 0, 0.0, 0.0]], 'cactusL', n=6, caps=[False, False]),
          loft([[-0.1, 0.4, 0.02, 0.05, 0.05], [-0.24, 0.46, 0.02, 0.05, 0.05], [-0.28, 0.58, 0.02, 0.0, 0.0]], 'cactusL', n=6, caps=[False, False])]
    o += [box([0.14*math.cos(k*1.3), 0.3 + 0.07*(k % 4), 0.15*math.sin(k*1.3)], [0.02, 0.02, 0.02], 'spine') for k in range(6)]
    return o
M['cactus_medium_A'] = cactus()
def basin():  # a kitchen sink unit: cabinet below, counter, basin and tap, tall splashback to 2.21 m with a shelf
    hx, hz = 0.36, 0.43
    o = [bx(0, 0, 0.02, 0.7, 0.84, 0.8, 'paintW'), bx(0, 0.84, 0.02, 0.72, 0.04, 0.84, 'woodL'), bx(0, 0.82, 0.08, 0.5, 0.05, 0.5, 'metal'), bx(0, 0.86, 0.08, 0.46, 0.02, 0.46, 'metalD'),
         bx(-0.17, 0.1, hz - 0.38, 0.32, 0.64, 0.02, 'paintB'), bx(0.17, 0.1, hz - 0.38, 0.32, 0.64, 0.02, 'paintB'),
         bx(0, 0.0, 0, 0.7, 0.08, 0.82, 'woodD'), bx(0, 0.88, -0.36, 0.72, 1.33, 0.06, 'tile'),
         bx(0, 0.88, -0.28, 0.04, 0.3, 0.04, 'metal'), bx(0, 1.18, -0.2, 0.04, 0.04, 0.2, 'metal'),
         bx(0, 1.6, -0.3, 0.7, 0.04, 0.2, 'woodL'), bx(0, 1.6, -0.395, 0.72, 0.6, 0.04, 'paintW'), bx(-0.2, 2.2, -0.39, 0.3, 0.01, 0.1, 'paintW')]
    o += [bx(sx*0.2, 1.64, -0.3, 0.1, 0.18, 0.1, 'ceramic') for sx in (1, -1)]
    o.append(bx(0, 2.15, -0.39, 0.72, 0.06, 0.1, 'woodD'))
    return o
M['k_basin'] = basin()
def night():
    o = [bx(0, 0, 0, 0.56, 0.7, 0.46, 'wood'), bx(0, 0.7, 0, 0.6, 0.04, 0.5, 'woodL'), bx(0, 0.1, 0.235, 0.5, 0.25, 0.02, 'woodL'), bx(0, 0.38, 0.235, 0.5, 0.24, 0.02, 'woodL'),
         bx(0, 0.18, 0.26, 0.1, 0.025, 0.02, 'knob'), bx(0, 0.46, 0.26, 0.1, 0.025, 0.02, 'knob')]
    o += [loft([[0, 0.74, 0, 0.1, 0.1], [0, 0.78, 0, 0.1, 0.1]], 'metalD', n=8), loft([[0, 0.78, 0, 0.03, 0.03], [0, 0.98, 0, 0.03, 0.03]], 'metal', n=6),
          loft([[0, 0.96, 0, 0.1, 0.1], [0, 1.09, 0, 0.17, 0.17]], 'rugB', n=8, caps=[True, False])]
    return o
M['k_night'] = night()
def bunk():
    hx, hz, h = 0.6, 1.15, 1.78; o = []
    o += [bx(sx*(hx - 0.04), 0, sz*(hz - 0.04), 0.08, h, 0.08, 'woodD') for sx in (1, -1) for sz in (1, -1)]
    for y, c in ((0.3, 'blanket'), (1.1, 'blanket2')):
        o += [bx(0, y, 0, hx*2 - 0.08, 0.1, hz*2 - 0.08, 'wood'), bx(0, y + 0.1, 0, hx*2 - 0.12, 0.14, hz*2 - 0.14, 'mattress'), bx(0, y + 0.2, -0.3, hx*2 - 0.14, 0.05, 1.3, c), bx(0, y + 0.22, hz - 0.28, 0.8, 0.1, 0.3, 'pillow')]
    o += [bx(sx*(hx - 0.04), 1.38, 0, 0.04, 0.25, hz*2 - 0.1, 'woodD') for sx in (1, -1)]
    o += [bx(sx*(hx - 0.04), 1.6, 0, 0.04, 0.04, hz*2 - 0.1, 'wood') for sx in (1, -1)]
    o += [bx(hx - 0.01, 0.1 + 0.28*i, -hz + 0.08*0 + 0.0, 0.02, 0.04, 0.4, 'woodL') for i in range(0)]
    o += [bx(hx - 0.07, 0.2 + 0.25*i, hz - 0.18, 0.05, 0.04, 0.34, 'woodL') for i in range(4)]
    return o
M['k_bunk'] = bunk()
def plant():
    o = pot(0.22, 0.4)
    for i in range(7):
        a = i*0.9; R = 0.05 + 0.015*(i % 3); hh = 0.9 + 0.08*(i % 4)
        o.append(tip([0, 0.4, 0], [math.cos(a)*R, 0.4 + hh*0.5, math.sin(a)*R], 0.02, 0.02, 'leafD'))
        o.append(loft([[math.cos(a)*R, 0.4 + hh*0.45, math.sin(a)*R, 0.1, 0.04], [math.cos(a)*R*1.8, 0.4 + hh*0.7, math.sin(a)*R*1.8, 0.11, 0.05], [math.cos(a)*R*2.2, 0.4 + hh*0.85, math.sin(a)*R*2.2, 0, 0]], 'leaf' if i % 2 else 'leafD', n=4))
    return o
M['k_plant'] = plant()
M['k_rug'] = [bx(0, 0, 0, 3.3, 0.02, 1.94, 'rug'), bx(0, 0.0, 0, 3.0, 0.021, 1.64, 'rugB'), bx(0, 0.0, 0, 2.7, 0.022, 1.34, 'rugC'), bx(0, 0.0, 0, 1.8, 0.023, 0.7, 'rug'),
              *[bx(sx*1.65, 0, z*0.2, 0.02, 0.02, 0.1, 'rugB') for sx in (1, -1) for z in range(-4, 5)]]
def washer():
    o = [bx(0, 0, 0, 0.82, 0.99, 0.82, 'paintW'), bx(0, 0.99, 0, 0.84, 0.03, 0.84, 'metal'), bx(0, 0.0, 0, 0.78, 0.05, 0.78, 'metalD'),
         bx(0, 0.78, 0.41, 0.8, 0.2, 0.02, 'metal'), bx(-0.24, 0.84, 0.43, 0.14, 0.06, 0.02, 'dial'), bx(0.0, 0.84, 0.43, 0.14, 0.06, 0.02, 'black'), bx(0.24, 0.86, 0.44, 0.1, 0.1, 0.03, 'metalD')]
    o += [loft([[0, 0.4, 0.41, 0.26, 0.26], [0, 0.4, 0.43, 0.26, 0.26]], 'metalD', ax='z', n=10), loft([[0, 0.4, 0.43, 0.2, 0.2], [0, 0.4, 0.45, 0.2, 0.2]], 'glass', ax='z', n=10)]
    return o
M['k_washer'] = washer()
def coat():
    o = [loft([[0, 0, 0, 0.29, 0.29], [0, 0.04, 0, 0.29, 0.29], [0, 0.08, 0, 0.05, 0.05]], 'woodD', n=8, caps=[True, False]), bx(0, 0.0, 0, 0.58, 0.04, 0.06, 'woodD'), bx(0, 0.0, 0, 0.06, 0.04, 0.58, 'woodD'),
         loft([[0, 0.04, 0, 0.03, 0.03], [0, 1.58, 0, 0.03, 0.03]], 'wood', n=6), loft([[0, 1.56, 0, 0.04, 0.04], [0, 1.62, 0, 0.035, 0.035], [0, 1.62, 0, 0.0, 0.0]], 'knob', n=6, caps=[False, False])]
    for i in range(4):
        a = i*math.pi/2 + 0.4
        o.append(tip([0, 1.5, 0], [math.cos(a)*0.2, 1.62, math.sin(a)*0.2], 0.022, 0.016, 'woodD'))
    return o
M['k_coat'] = coat()
pack = {'name': 'furniture2', 'version': 1, 'style': 'boxes and plain lofts, flat colours', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base', 'palette': P, 'flatModels': True,
        'about': 'The thirteen furniture pieces that replace the Furniture Kit, with the same names as the game uses (chair_stool, cabinet_medium_decorated, cabinet_medium, cabinet_small_decorated, cactus_medium_A, k_basin, k_night, k_bunk, k_plant, k_rug, k_washer, k_coat, k_stool). Each fits inside its footprint in tools/out/models.txt.',
        'models': {'furniture': M}}
out, st = write_pack('furniture2', pack, __file__)
print({k: v[0] for k, v in st.items()})
