#!/usr/bin/env python3
"""Afterstreet building kit, version 1 (18 October 2026): framed buildings. Writes assets/shaped/buildings.js.
Run: python3 assets/shaped/src/buildings.py

How a framed building works (from the research in the art guide: frame-and-infill building, depth, trim):
  - Every wall is a grid of bays, 2.4 m wide and 3 m tall (one storey). A bay is a FRAME (a post on its left edge and a beam
    at its top) and an INFILL panel between them: plain wall, window, door, shopfront, garage door, boarded window or
    nothing (broken).
  - The frame stands proud of the infill by 6 cm, so every wall shows a grid of shadow lines: the building's structure is
    visible, and windows and doors sit back in the wall instead of being painted on.
  - Breaking: infill panels break (fall out as rubble chunks, leaving the frame), frames break last; when a post goes, the
    bays it carried above fall. This replaces the 12.5 cm block walls: far fewer vertices, and walls still break bay by bay.
  - Colour slots per building: WALL (infill), TRIM (sills, lintels, door), FRAME, ROOF. Glass is its own colour and lights up
    at night with the 'lit' variants (glow:true).
Bay-local coordinates: x across the bay (-1.2 to 1.2), y up from the storey floor (0 to 3), z out of the wall (+Z is outside).
The game places bays along each footprint edge: one bay per 2.4 m (stretch the bay's x when an edge does not divide evenly)."""
from kit import *

BW, SH = 2.4, 3.0          # bay width, storey height
FD, FT = 0.2, 0.2          # frame depth and thickness
IT, IZ = 0.12, -0.02       # infill thickness and centre: its outside face is 6 cm behind the frame's
X0, X1 = -BW/2 + FT/2, BW/2 - FT/2
PALETTE = {'glass': '#3c4a52', 'glassLit': '#ffd28a', 'glassCold': '#bfe6ff', 'board': '#8a6a46', 'boardD': '#6a5034', 'rubble': '#7a7064',
           'step': '#8f877b', 'knob': '#c8b27a', 'sign': '#2e2a26', 'awning': '#8c3a2e', 'awningD': '#6a2a22', 'rail': '#2a2b2e', 'ac': '#b8b4aa', 'pipe': '#4a4d52'}
SLOTS = {'WALL': 'building colour', 'TRIM': 'trim colour', 'FRAME': 'frame colour', 'ROOF': 'roof colour'}
EXAMPLES = {
  'timber_house': {'WALL': '#9fb3a6', 'TRIM': '#e8e0d0', 'FRAME': '#e8e0d0', 'ROOF': '#4a4446'},
  'brick_shop':   {'WALL': '#9a5a44', 'TRIM': '#d8cfbd', 'FRAME': '#33363a', 'ROOF': '#55524e'},
  'concrete_flats': {'WALL': '#d9cdb4', 'TRIM': '#8f8a80', 'FRAME': '#b3ab9c', 'ROOF': '#6b6760'},
  'corner_store': {'WALL': '#c7b28a', 'TRIM': '#3e5a5e', 'FRAME': '#5a5650', 'ROOF': '#55524e'}}

def panel(x0, x1, y0, y1, col='WALL', z=IZ, t=IT): return box([(x0 + x1)/2, (y0 + y1)/2, z], [x1 - x0, y1 - y0, t], col)
def lines(x0, x1, ys, col='WALL_D', z=IZ + IT/2 + 0.002, h=0.025):
    return [flat([(x0, y - h/2, z), (x1, y - h/2, z), (x1, y + h/2, z), (x0, y + h/2, z)], col) for y in ys]

# ---------- frame ----------
def frame(kind='timber', top=True):
    t = {'timber': 0.2, 'steel': 0.16, 'concrete': 0.26}[kind]
    o = [box([-BW/2, SH/2, 0], [t, SH, FD], 'FRAME')]
    if top: o.append(box([0, SH - 0.125, 0], [BW - t, 0.25, FD], 'FRAME'))
    return o
def corner_post(kind='timber', h=SH):
    t = {'timber': 0.22, 'steel': 0.18, 'concrete': 0.3}[kind]; return [box([0, h/2, 0], [t, h, t], 'FRAME')]
def plinth(): return [box([0, 0.2, 0.03], [BW, 0.4, FD + 0.06], 'step')]

# ---------- infills (finish: plain, siding, brick) ----------
def finish(x0, x1, y0, y1, kind):
    o = [panel(x0, x1, y0, y1)]
    if kind == 'siding': o += lines(x0, x1, [y for y in (0.5, 1.0, 1.5, 2.0, 2.5) if y0 + 0.05 < y < y1 - 0.05])
    if kind == 'brick': o += lines(x0, x1, [y for y in (0.9, 2.2) if y0 + 0.05 < y < y1 - 0.05], h=0.06)
    return o
def wall(kind='plain'): return finish(X0, X1, 0, SH - 0.25, kind)
def window(kind='plain', lit=None, w=1.2, sill=0.9, head=2.2):
    a, b = -w/2, w/2
    o = finish(X0, X1, 0, sill, kind) + finish(X0, X1, head, SH - 0.25, kind) + finish(X0, a, sill, head, kind) + finish(b, X1, sill, head, kind)
    glass = 'glassLit' if lit == 'warm' else 'glassCold' if lit == 'cold' else 'glass'
    o += [box([0, (sill + head)/2, IZ - 0.03], [w, head - sill, 0.03], glass, **({'glow': True} if lit else {})),
          box([0, sill - 0.04, IZ + 0.08], [w + 0.16, 0.08, 0.14], 'TRIM'), box([0, head + 0.06, IZ + 0.04], [w + 0.16, 0.12, 0.08], 'TRIM'),
          flat([(-0.02, sill, IZ - 0.012), (0.02, sill, IZ - 0.012), (0.02, head, IZ - 0.012), (-0.02, head, IZ - 0.012)], 'TRIM'),
          flat([(a, (sill + head)/2 - 0.02, IZ - 0.012), (b, (sill + head)/2 - 0.02, IZ - 0.012), (b, (sill + head)/2 + 0.02, IZ - 0.012), (a, (sill + head)/2 + 0.02, IZ - 0.012)], 'TRIM')]
    return o
def door(kind='plain', w=1.0, head=2.2):
    a, b = -w/2, w/2
    return finish(X0, a, 0, head, kind) + finish(b, X1, 0, head, kind) + finish(X0, X1, head, SH - 0.25, kind) + \
        [box([0, head/2, IZ - 0.03], [w, head, 0.05], 'TRIM'), box([0.36, 1.05, IZ], [0.05, 0.05, 0.06], 'knob'),
         box([0, head + 0.06, IZ + 0.05], [w + 0.2, 0.12, 0.1], 'TRIM_D'), box([0, 0.06, 0.35], [w + 0.4, 0.12, 0.5], 'step')]
def shopfront(lit=None):
    glass = 'glassLit' if lit == 'warm' else 'glassCold' if lit == 'cold' else 'glass'
    return [panel(X0, X1, 0, 0.4, 'TRIM'), box([0, 1.4, IZ - 0.03], [X1 - X0, 2.0, 0.03], glass, **({'glow': True} if lit else {})),
            panel(X0, X1, 2.4, SH - 0.25, 'sign'), box([0, 1.4, IZ], [0.06, 2.0, 0.06], 'FRAME'), box([0, 0.44, IZ + 0.07], [X1 - X0, 0.08, 0.12], 'TRIM')]
def garage():
    return [panel(X0, X1, 2.5, SH - 0.25), box([0, 1.25, IZ - 0.03], [X1 - X0, 2.5, 0.05], 'TRIM')] + lines(X0, X1, (0.5, 1.0, 1.5, 2.0), 'TRIM_D', IZ - 0.003)
def boarded(kind='plain'):
    o = window(kind)
    o = [q for q in o if q['c'] not in ('glass',)] + [box([0, 1.55, IZ - 0.03], [1.2, 1.3, 0.03], 'glass')]
    planks = []
    for (x0, y0, x1, y1) in ((-0.75, 1.05, 0.75, 1.3), (-0.75, 1.6, 0.75, 1.45), (-0.7, 2.0, 0.75, 1.82)):
        planks.append(flat([(x0, y0 - 0.07, IZ + 0.07), (x1, y1 - 0.07, IZ + 0.07), (x1, y1 + 0.07, IZ + 0.07), (x0, y0 + 0.07, IZ + 0.07)], 'board'))
    return o + planks
def rubble(n=5, seed=1):
    import random; R = random.Random(seed); o = []
    for i in range(n):
        x, z = R.uniform(-1.0, 1.0), R.uniform(0.2, 1.1); w, h, d = R.uniform(0.2, 0.45), R.uniform(0.08, 0.2), R.uniform(0.15, 0.35)
        o.append(hull([(x - w/2, 0, z - d/2), (x + w/2, 0, z - d/2), (x + w/2, 0, z + d/2), (x - w/2, 0, z + d/2),
                       (x - w*0.3, h, z - d*0.2), (x + w*0.4, h*0.8, z - d*0.3), (x + w*0.2, h, z + d*0.3), (x - w*0.35, h*0.7, z + d*0.2)], 'WALL' if i % 2 else 'rubble'))
    return o
def broken(): return rubble(6)        # the infill has fallen out: the frame stands empty, chunks lie at its foot
def balcony():
    return [box([0, 0.08, 0.6], [2.0, 0.16, 1.0], 'FRAME'), box([0, 1.0, 1.08], [2.0, 0.06, 0.06], 'rail'),
            *[box([x, 0.58, 1.08], [0.04, 0.84, 0.04], 'rail') for x in (-0.95, -0.48, 0.0, 0.48, 0.95)],
            *[box([sg*0.98, 0.58, 0.6], [0.04, 0.84, 0.96], 'rail') for sg in (1, -1)]]
def awning():
    return [hull([(-1.15, 2.55, 0.1), (1.15, 2.55, 0.1), (1.15, 2.2, 1.3), (-1.15, 2.2, 1.3), (-1.15, 2.63, 0.1), (1.15, 2.63, 0.1), (1.15, 2.26, 1.3), (-1.15, 2.26, 1.3)], 'awning'),
            box([0, 2.1, 1.3], [2.3, 0.22, 0.04], 'awningD')]
def sign(): return [box([0, 2.62, 0.16], [2.0, 0.34, 0.08], 'sign')]

MODULES = {
  'frame_timber': frame('timber'), 'frame_steel': frame('steel'), 'frame_concrete': frame('concrete'),
  'corner_timber': corner_post('timber'), 'corner_steel': corner_post('steel'), 'corner_concrete': corner_post('concrete'), 'plinth': plinth(),
  'wall_plain': wall('plain'), 'wall_siding': wall('siding'), 'wall_brick': wall('brick'),
  'window_plain': window('plain'), 'window_siding': window('siding'), 'window_brick': window('brick'),
  'window_lit_warm': window('plain', 'warm'), 'window_lit_cold': window('plain', 'cold'),
  'door_plain': door('plain'), 'door_siding': door('siding'), 'door_brick': door('brick'),
  'shopfront': shopfront(), 'shopfront_lit': shopfront('cold'), 'garage': garage(), 'boarded': boarded('plain'), 'broken': broken(),
  'balcony': balcony(), 'awning': awning(), 'sign': sign(),
}

# ---------- Art 6: damage states (19 October 2026) ----------
import math, random
FZ = IZ + IT/2 + 0.003         # just in front of an infill's outside face
BZ = IZ - IT/2 - 0.003         # just behind its inside face
def cracks(seed, n=3, x0=X0 + 0.1, x1=X1 - 0.1, y0=0.3, y1=2.5):
    R = random.Random(seed); o = []
    for i in range(n):
        x, y = R.uniform(x0, x1), R.uniform(y0, y1)
        for j in range(3):
            nx, ny = x + R.uniform(-0.35, 0.35), y + R.uniform(-0.4, 0.1)
            dx, dy = nx - x, ny - y; l = math.hypot(dx, dy) or 1; w = 0.012
            o.append(flat([(x - dy/l*w, y + dx/l*w, FZ), (nx - dy/l*w, ny + dx/l*w, FZ), (nx + dy/l*w, ny - dx/l*w, FZ), (x + dy/l*w, y - dx/l*w, FZ)], 'crack'))
            x, y = nx, ny
    return o
def chips(seed, n=3):
    R = random.Random(seed); o = []
    for i in range(n):
        x, y, r = R.uniform(X0 + 0.15, X1 - 0.15), R.uniform(0.3, 2.4), R.uniform(0.06, 0.14)
        o.append(flat([(x + math.cos(a)*r*R.uniform(0.6, 1.2), y + math.sin(a)*r*R.uniform(0.6, 1.2), FZ + 0.001) for a in [k*2*math.pi/6 for k in range(6)]], 'WALL_D'))
    return o
def pile(n, spread, seed, big=False):
    R = random.Random(seed); o = []
    for i in range(n):
        x, z = R.uniform(-spread, spread), R.uniform(0.15, 0.25 + spread*0.6); w = R.uniform(0.15, 0.45 if big else 0.3); h = R.uniform(0.06, 0.25 if big else 0.14); d = w*R.uniform(0.6, 1.0)
        y = 0 if i < n*0.6 else R.uniform(0.05, 0.2 if big else 0.08)
        o.append(hull([(x - w/2, y, z - d/2), (x + w/2, y, z - d/2), (x + w/2, y, z + d/2), (x - w/2, y, z + d/2),
                       (x - w*0.3, y + h, z - d*0.2), (x + w*0.4, y + h*0.8, z - d*0.3), (x + w*0.2, y + h, z + d*0.3), (x - w*0.35, y + h*0.7, z + d*0.2)], ['WALL', 'rubble', 'WALL_D', 'TRIM'][i % 4]))
    return o
def damaged(mod): return MODULES[mod] + cracks(len(mod), 3) + chips(len(mod) + 7, 3) + pile(3, 0.6, len(mod))
def holed(kind='plain', seed=1):
    """the infill with a ragged hole knocked through it; the hole's edge shows the wall's thickness"""
    hx0, hx1, hy0, hy1 = -0.55, 0.45, 0.5, 2.1
    o = finish(X0, X1, 0, hy0, kind) + finish(X0, X1, hy1, SH - 0.25, kind) + finish(X0, hx0, hy0, hy1, kind) + finish(hx1, X1, hy0, hy1, kind)
    R = random.Random(seed); edge = []
    for i in range(10):     # ragged teeth around the opening, in the wall colour, sticking into the hole
        a = i*2*math.pi/10; cx, cy = (hx0 + hx1)/2, (hy0 + hy1)/2; rx, ry = (hx1 - hx0)/2, (hy1 - hy0)/2
        px, py = cx + math.cos(a)*rx, cy + math.sin(a)*ry; qx, qy = cx + math.cos(a)*rx*0.8, cy + math.sin(a)*ry*0.8
        if px < hx0: px = hx0
        if px > hx1: px = hx1
        edge.append(hull([(px - 0.12, py - 0.1, IZ - IT/2), (px + 0.12, py - 0.1, IZ - IT/2), (px + 0.12, py + 0.1, IZ - IT/2), (px - 0.12, py + 0.1, IZ - IT/2),
                          (qx - 0.04, qy - 0.03, IZ + IT/2), (qx + 0.04, qy - 0.03, IZ + IT/2), (qx + 0.04, qy + 0.03, IZ + IT/2), (qx - 0.04, qy + 0.03, IZ + IT/2)], 'WALL' if i % 2 else 'WALL_D'))
    return o + edge + pile(6, 0.8, seed, True)
def snapped(kind):
    t = {'timber': 0.2, 'steel': 0.16, 'concrete': 0.26}[kind]
    stub = [box([-BW/2, 0.6, 0], [t, 1.2, FD], 'FRAME'), tip([-BW/2, 1.2, 0], [-BW/2 + 0.05, 1.45, 0.02], t*0.7, FD*0.7, 'FRAME_D')]
    hang = [hull([(-BW/2 - t/2, 2.75, -FD/2), (-BW/2 + t/2, 2.75, -FD/2), (-BW/2 + t/2, 2.75, FD/2), (-BW/2 - t/2, 2.75, FD/2),
                   (-BW/2 + 0.15 - t/2, 1.75, -FD/2), (-BW/2 + 0.15 + t/2, 1.8, -FD/2), (-BW/2 + 0.15 + t/2, 1.8, FD/2), (-BW/2 + 0.15 - t/2, 1.75, FD/2)], 'FRAME'),
            tip([-BW/2 + 0.15, 1.78, 0], [-BW/2 + 0.12, 1.6, 0.03], t*0.6, FD*0.6, 'FRAME_D')]
    beam = [hull([(-BW/2, 2.6, -FD/2), (BW/2 - t/2, 2.75, -FD/2), (BW/2 - t/2, 2.75, FD/2), (-BW/2, 2.6, FD/2),
                  (-BW/2, 2.85, -FD/2), (BW/2 - t/2, 3.0, -FD/2), (BW/2 - t/2, 3.0, FD/2), (-BW/2, 2.85, FD/2)], 'FRAME')]
    return stub + hang + beam + pile(4, 0.5, 9)
def torn_inside(seed=3):
    """the inside face of an infill: wallpaper with torn patches showing plaster and a stud behind"""
    R = random.Random(seed)
    o = [flat([(X0, 0.05, BZ), (X1, 0.05, BZ), (X1, SH - 0.3, BZ), (X0, SH - 0.3, BZ)], 'paper', (0, 0, -1))]
    for i in range(4):
        x, y, r = R.uniform(X0 + 0.3, X1 - 0.3), R.uniform(0.5, 2.3), R.uniform(0.15, 0.3)
        o.append(flat([(x + math.cos(a)*r*R.uniform(0.5, 1.2), y + math.sin(a)*r*R.uniform(0.5, 1.2), BZ - 0.001) for a in [k*2*math.pi/7 for k in range(7)]], 'plaster', (0, 0, -1)))
    o.append(flat([(-0.04, 0.9, BZ - 0.002), (0.04, 0.9, BZ - 0.002), (0.04, 1.6, BZ - 0.002), (-0.04, 1.6, BZ - 0.002)], 'stud', (0, 0, -1)))
    return o
def studs():
    """an infill stripped to its studs: daylight shows between them"""
    return [box([x, (SH - 0.25)/2, IZ], [0.05, SH - 0.25, 0.1], 'stud') for x in (X0 + 0.04, -0.35, 0.05, 0.45, X1 - 0.04)] + \
           [box([0, 0.04, IZ], [X1 - X0, 0.08, 0.1], 'stud'), box([0, SH - 0.29, IZ], [X1 - X0, 0.08, 0.1], 'stud'), box([0, 1.2, IZ], [X1 - X0, 0.05, 0.1], 'stud')]
def door_boarded(kind='plain'):
    o = door(kind)
    return o + [flat([(-0.6, y - 0.07, IZ + 0.08), (0.6, y + 0.05, IZ + 0.08), (0.6, y + 0.19, IZ + 0.08), (-0.6, y + 0.07, IZ + 0.08)], 'board') for y in (0.5, 1.1, 1.7)] + \
           [box([sx*0.52, y, IZ + 0.09], [0.02, 0.02, 0.01], 'boardD') for sx in (1, -1) for y in (0.5, 1.1, 1.7)]
for m in ('wall_plain', 'wall_siding', 'wall_brick', 'window_plain', 'window_siding', 'window_brick', 'door_plain', 'shopfront', 'garage'):
    MODULES[m + '_damaged'] = damaged(m)
for kind in ('plain', 'siding', 'brick'): MODULES['hole_' + kind] = holed(kind, {'plain': 1, 'siding': 2, 'brick': 3}[kind])
for kind in ('timber', 'steel', 'concrete'): MODULES['frame_' + kind + '_snapped'] = snapped(kind)
MODULES.update({'rubble_small': pile(5, 0.6, 21), 'rubble_large': pile(12, 1.0, 22, True), 'inside_torn': torn_inside(), 'studs': studs(), 'door_boarded': door_boarded()})
PALETTE.update({'crack': '#2a2826', 'paper': '#c8b89a', 'plaster': '#e2dccf', 'stud': '#a8885a'})

# ---------- placing modules: the same quarter turns shapes.js uses ----------
def turn(x, z, k):
    for _ in range(k % 4): x, z = z, -x
    return x, z
def place(pieces, off, k=0):
    out = []
    for q in pieces:
        q = dict(q); x, z = turn(q['p'][0], q['p'][2], k)
        q['p'] = [R4(x + off[0]), R4(q['p'][1] + off[1]), R4(z + off[2])]
        if k % 4: q['ry'] = (q.get('ry', 0) + k) % 4
        out.append(q)
    return out
SIDE_TURN = {'front': 0, 'right': 1, 'back': 2, 'left': 3}
def building(nx, nz, storeys, frame_kind, pick, roof='flat', overhang=0.35, parapet=True):
    """nx by nz bays; pick(side, bay, storey) -> list of module names for that bay (infill plus extras)"""
    W, D = nx*BW, nz*BW; out = []
    for side, n in (('front', nx), ('right', nz), ('back', nx), ('left', nz)):
        k = SIDE_TURN[side]
        for i in range(n):
            along = -((n*BW)/2) + BW/2 + i*BW
            if side == 'front': off = (along, 0, D/2)
            elif side == 'back': off = (-along, 0, -D/2)
            elif side == 'right': off = (W/2, 0, -along)
            else: off = (-W/2, 0, along)
            for s in range(storeys):
                y = s*SH
                mods = ['frame_' + frame_kind] + pick(side, i, s, n)
                if s == 0: mods.append('plinth')
                for m in mods: out += place(MODULES[m], (off[0], y, off[2]), k)
    for cx, cz in ((W/2, D/2), (-W/2, D/2), (W/2, -D/2), (-W/2, -D/2)):
        out += place(corner_post(frame_kind, storeys*SH), (cx, 0, cz))
    top = storeys*SH
    out.append(box([0, top - 0.1, 0], [W, 0.2, D], 'FRAME_D'))      # the top floor's ceiling, seen through broken bays
    if roof == 'flat':
        out.append(box([0, top + 0.05, 0], [W - 0.1, 0.1, D - 0.1], 'ROOF'))
        if parapet:
            for sx, sz, w, d in ((0, D/2, W + 0.2, 0.2), (0, -D/2, W + 0.2, 0.2), (W/2, 0, 0.2, D), (-W/2, 0, 0.2, D)):
                out.append(box([sx, top + 0.3, sz], [w, 0.6, d], 'FRAME'))
        out += [box([W*0.2, top + 0.45, -D*0.15], [1.0, 0.7, 0.8], 'ac'), box([-W*0.25, top + 0.35, D*0.1], [0.7, 0.5, 0.7], 'pipe')]
    else:   # gable roof, ridge along x, with an overhang and gable ends filled in
        rh = D*0.42; o = overhang
        for sg in (1, -1):
            out.append(hull([(-W/2 - o, top - 0.1, sg*(D/2 + o)), (W/2 + o, top - 0.1, sg*(D/2 + o)), (W/2 + o, top + rh, 0), (-W/2 - o, top + rh, 0),
                             (-W/2 - o, top + 0.05, sg*(D/2 + o)), (W/2 + o, top + 0.05, sg*(D/2 + o)), (W/2 + o, top + rh + 0.16, 0), (-W/2 - o, top + rh + 0.16, 0)], 'ROOF'))
        for sx in (W/2, -W/2):
            out.append(solid([(sx, top, -D/2), (sx, top, D/2), (sx, top + rh, 0), (sx - 0.1*(1 if sx > 0 else -1), top, -D/2), (sx - 0.1*(1 if sx > 0 else -1), top, D/2), (sx - 0.1*(1 if sx > 0 else -1), top + rh, 0)],
                             [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]], 'WALL'))
        out.append(box([W*0.25, top + rh*0.6, -D*0.15], [0.5, rh*0.9, 0.5], 'TRIM_D'))   # chimney
    return out

# ---------- templates ----------
def house_pick(side, i, s, n):
    if side == 'front' and s == 0: return ['door_siding'] if i == 0 else ['window_siding']
    if side in ('front', 'back'): return ['window_siding']
    return ['window_siding'] if (i + s) % 2 == 0 else ['wall_siding']
def shop_pick(side, i, s, n):
    if s == 0 and side == 'front': return ['shopfront', 'awning'] if i < n - 1 else ['door_brick']
    if s == 0 and side == 'back': return ['garage'] if i == 0 else ['wall_brick']
    return ['window_brick'] if s > 0 and side in ('front', 'back') else ['wall_brick']
def flats_pick(side, i, s, n):
    if side == 'front':
        if s == 0: return ['door_plain'] if i == n//2 else ['window_plain']
        return ['window_plain', 'balcony'] if (i + s) % 3 == 0 or i % 2 == 0 else ['window_plain']
    return ['window_plain'] if (i + s) % 2 else ['wall_plain']
def ruin_pick(side, i, s, n):
    if side == 'front':
        if s == 0: return ['broken'] if i == 1 else ['boarded'] if i == 0 else ['shopfront']
        return ['broken'] if i == 2 else ['window_plain']
    if side == 'right' and s == 1 and i == 0: return ['broken']
    return ['wall_plain'] if (i + s) % 2 else ['window_plain']
TEMPLATES = {
  'timber_house': building(2, 2, 2, 'timber', house_pick, roof='gable'),
  'brick_shop': building(3, 2, 2, 'steel', shop_pick),
  'concrete_flats': building(4, 2, 4, 'concrete', flats_pick),
  'corner_store': building(3, 2, 2, 'concrete', ruin_pick),
}
pack = {
  'name': 'buildings', 'version': 1, 'style': 'framed buildings: a visible frame of posts and beams with infill panels set 6 cm back',
  'units': 'metres', 'bay': [BW, SH], 'palette': PALETTE, 'slots': SLOTS, 'examples': EXAMPLES, 'darker': 0.78,
  'colourRule': 'WALL, TRIM, FRAME and ROOF are chosen per building (see examples); a slot ending in _D is that colour times darker.',
  'about': __doc__.split('\n', 2)[2],
  'placeRule': 'Each module is in bay-local coordinates. For a footprint edge, walk it in 2.4 m bays; for each bay and storey place frame_<kind>, '
               'one infill module and any extras (awning, balcony, sign) turned to face out of the wall (quarter turns as SHAPED pieces use: ry). '
               'Add plinth to the ground storey, a corner_<kind> post at every corner, then the roof.',
  'damageRule': 'Art 6 states: <infill>_damaged (cracks, chips, a little rubble), hole_<finish> (a ragged hole knocked through plain, siding or brick infill), broken (the infill gone), '
                'frame_<kind>_snapped (the post broken at mid height, the beam sagging), rubble_small and rubble_large piles (WALL, TRIM and rubble colours), inside_torn (the inside face: torn wallpaper, plaster, a stud), '
                'studs (an infill stripped to its studs, daylight between them), door_boarded and boarded (window). Daylight through holes is the lighting: let sun and sky light pass where the infill is gone.',
  'breakRule': 'Infill modules break first (replace with broken: the panel falls as rubble chunks). A frame module breaks last; the bays above a broken post fall.',
  'flatModels': True, 'models': {'modules': MODULES, 'templates': TEMPLATES}
}
out, st = write_pack('buildings', pack, __file__)
for k, v in st.items(): print(k, v)
