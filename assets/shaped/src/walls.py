#!/usr/bin/env python3
"""Afterstreet walls pack, version 1 (19 October 2026): walls built the way real ones are, for the 0.56 voxel building logic.
Writes assets/shaped/walls.js. Run: python3 assets/shaped/src/walls.py

The module (docs/ART_REQUESTS.md section 10.1): studs every 0.5 m (a BAY, the build grid), CELLS of 0.25 m (half a bay) for
breaking, wall panels of 3.0 m (six bays), storeys 3.0 m (houses), 3.5 m (shops, offices, flats) and 4.5 m (industrial).
Wall-local coordinates: the wall runs along X, +Y up from the storey floor, +Z is the OUTSIDE face; the wall's centre line is z = 0.

Layers through a wall, outside to inside: outer skin (siding, brick, sheet metal, cladding, glass), sheathing (board),
FRAME (studs, plates, header...), inner skin (plasterboard). Each kind of wall lists its layers in kinds[...].layers with
their z range, so the game knows where every cell sits. Concrete and block walls are one thick layer with no frame.

What is in the pack:
  cells[material][state]   one 0.25 x 0.25 cell of a skin, centred on x = 0, y from 0 to 0.25, z centred on 0 (move it to its
                           layer's z). States: whole, cracked, gone (the torn edges left when it falls out, so the layer beneath
                           shows) and rubble (the pile it leaves on the floor, at y = 0). An inner-layer cell is turned half a
                           turn about Y so its painted face looks into the room.
  sticks[family][name]     the frame, one stick each, 1 m long along its axis (sticksInfo gives the axis and size): stretch it
                           along that axis to any length. whole and snapped (wood splinters, steel bends).
  sections[kind][height][state]   a tileable one-bay section (0.5 m wide, x from -0.25 to 0.25), all layers, four states:
                           whole, cracked, gone (outer skins holed, studs showing) and rubble (holed through, frame snapped,
                           pile on the floor). Whole runs of wall are one slab per layer, not cells, so a whole house stays cheap.
  openings[kind][door|window][intact|cracked|breached]   a three-bay module (1.5 m, x from -0.75 to 0.75) with a clear
                           opening of 1.0 m (x -0.5 to 0.5): doors 2.25 m tall, windows from 1.0 to 2.25 m. Includes its own
                           king and jack studs, header, sill and cripples; it replaces three sections. It stops at y = 2.5, the
                           same for every storey; openingTops[kind][height] is the rest of the module from 2.5 to the storey top.
  joints[kind][height][straight|corner|T|cross|end]   the pieces where walls meet (see jointInfo for where each sits).
  edges[kind][floor_edge|roof_edge]   height-free pieces at the top of a wall: the floor above meeting it, or the eaves.
  floors[family][state]    a 0.5 x 0.5 floor tile (joists or deck or slab), 0.3 m thick, top at y = 0.3; whole, cracked, gone,
                           rubble. stairs[family] is the frame round a 1.0 x 3.0 stair opening (top of floor at y = 0).
Colour slots: WALL (outside finish: siding, sheet metal, cladding), INNER (inside paint), TRIM (casings, corner boards, doors)."""
import math, random, copy
from kit import *

CELL, BAY = 0.25, 0.5
R = random.Random(56)
PALETTE = {
  'lumber': '#c8a46a', 'lumberD': '#a8844e', 'splinter': '#e2c896', 'osb': '#b89a62', 'osbD': '#9c8050', 'gypsum': '#e8e4da', 'cement': '#b4b0a4',
  'brick': '#9a5040', 'brickD': '#7a3c30', 'mortar': '#c0b8aa', 'concrete': '#aaa69e', 'concreteD': '#8a867e', 'block': '#9c988f', 'blockD': '#7e7a72',
  'rebar': '#7a4a32', 'galv': '#a9b1b5', 'galvD': '#7f878c', 'steel': '#5e6a74', 'steelD': '#434c54', 'alu': '#b8bcc0', 'aluD': '#8e9296',
  'glass': '#7fa4b0', 'glassD': '#5f8490', 'crack': '#2e2a26', 'crackG': '#e8f2f4', 'dust': '#bdb4a4', 'floorboard': '#b08a5a', 'floorboardD': '#8e6a40',
  'topping': '#b8b4ac', 'deck': '#7c8288', 'door': '#7a5a3a', 'doorD': '#5e4228', 'doorSteel': '#5a6670', 'knob': '#c8b27a', 'shadow': '#3a3632',
  'roofboard': '#a88a5c', 'shingle': '#4a4446',
}
SLOTS = {'WALL': 'outside finish colour', 'INNER': 'inside paint', 'TRIM': 'casings, corner boards, doors'}
EXAMPLES = {'house': {'WALL': '#9fb3a6', 'INNER': '#d8d0bc', 'TRIM': '#e8e0d0'}, 'shop': {'WALL': '#7a8a96', 'INNER': '#dcd8cc', 'TRIM': '#33363a'},
            'warehouse': {'WALL': '#8a9a8c', 'INNER': '#c8c4b8', 'TRIM': '#3e4448'}, 'bunker': {'WALL': '#aaa69e', 'INNER': '#c8c2b0', 'TRIM': '#4a4e52'}}

# ---------- small builders ----------
def B(x0, y0, z0, x1, y1, z1, c, **k):
    return box([(x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2], [abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)], c, **k)
def HB(x0, y0, z0, x1, y1, z1, c):  # the same box as a solid, so it can be turned and stretched freely
    return hull([(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), (x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], c)
def fz(x0, y0, x1, y1, z, c, s=1): return flat([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], c, (0, 0, s))
def fx(z0, y0, z1, y1, x, c, s=1): return flat([(x, y0, z0), (x, y0, z1), (x, y1, z1), (x, y1, z0)], c, (s, 0, 0))
def fy(x0, z0, x1, z1, y, c, s=1): return flat([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], c, (0, s, 0))
def tet(pts, c): return solid(pts, [[0, 1, 2], [0, 1, 3], [1, 2, 3], [0, 2, 3]], c)
def frange(a, b, step, off=0.0):
    v = math.ceil((a - off)/step - 1e-6)*step + off
    while v < b - 1e-6:
        yield round(v, 4); v += step

def chunk(cx, cz, s, c, y=0.0, h=None):
    """an irregular lump of rubble standing on y"""
    h = h or s*R.uniform(0.5, 0.9); a = R.uniform(0, math.pi)
    lo = [(cx + s*R.uniform(0.8, 1.1)*math.cos(a + i*math.pi/2), y, cz + s*R.uniform(0.8, 1.1)*math.sin(a + i*math.pi/2)) for i in range(4)]
    hi = [(cx + 0.55*s*math.cos(a + 0.4 + i*math.pi/2) + R.uniform(-0.2, 0.2)*s, y + h*R.uniform(0.8, 1.1), cz + 0.55*s*math.sin(a + 0.4 + i*math.pi/2)) for i in range(4)]
    return hull(lo + hi, c)
def pile(x0, x1, z0, z1, cols, n=6, s=0.07, dust=True):
    o = [chunk(R.uniform(x0, x1), R.uniform(z0, z1), s*R.uniform(0.6, 1.3), cols[i % len(cols)]) for i in range(n)]
    if dust: o.append(flat([(x0 - 0.05, 0.004, z0), (x1 + 0.05, 0.004, z0 - 0.03), (x1 + 0.08, 0.004, z1), (x0, 0.004, z1 + 0.04)], 'dust', (0, 1, 0)))
    return o
def crack(x0, x1, y0, y1, z, s, c='crack', w=0.006):
    """a zigzag crack across a face (z, facing s)"""
    pts = []; n = 4
    for i in range(n + 1):
        f = i/n; pts.append((x0 + (x1 - x0)*R.uniform(0.15, 0.85) if 0 < i < n else (x0 + (x1 - x0)*R.uniform(0.2, 0.8)), y1 - (y1 - y0)*f))
    pts.sort(key=lambda p: -p[1])
    o = []
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        o.append(flat([(ax - w, ay, z), (ax + w, ay, z), (bx + w*0.6, by, z), (bx - w*0.6, by, z)], c, (0, 0, s)))
    return o
def shards_edge(x0, x1, y, z0, z1, c, up=True, n=3):
    """jagged teeth left along a torn edge"""
    o = []; w = (x1 - x0)/n
    for i in range(n):
        a = x0 + i*w; h = R.uniform(0.04, 0.11)*(1 if up else -1)
        o.append(tet([(a, y, z0), (a + w, y, z0), (a + w*R.uniform(0.3, 0.7), y + h, (z0 + z1)/2), (a + w*0.5, y, z1)], c))
    return o

# ---------- skins: materials ----------
# t: thickness; face: colour on the visible face (an inner skin's face looks into the room); body: colour of its broken edges
MAT = {
  'siding':  {'body': 'WALL', 'deco': 'boards', 'bits': ['WALL', 'lumber']},
  'brick':   {'body': 'brick', 'deco': 'courses', 'bits': ['brick', 'brickD', 'mortar']},
  'osb':     {'body': 'osb', 'deco': None, 'bits': ['osb', 'osbD']},
  'cement':  {'body': 'cement', 'deco': None, 'bits': ['cement', 'concreteD']},
  'plaster': {'body': 'gypsum', 'deco': 'paint', 'bits': ['gypsum', 'INNER']},
  'sheet':   {'body': 'WALL', 'deco': 'ribs', 'bits': ['WALL', 'WALL_D']},
  'cladding': {'body': 'WALL', 'deco': 'ribs', 'bits': ['WALL', 'WALL_D']},
  'glass':   {'body': 'glass', 'deco': None, 'bits': ['glass', 'glassD']},
  'concrete': {'body': 'concrete', 'deco': None, 'bits': ['concrete', 'concreteD', 'rebar']},
  'block':   {'body': 'block', 'deco': 'blocks', 'bits': ['block', 'blockD', 'mortar']},
}
def deco(mat, x0, x1, y0, y1, z, s):
    d = MAT[mat]['deco']; o = []
    if d == 'boards':
        o += [fz(x0, y, x1, y + 0.016, z + s*0.0005, 'WALL_D', s) for y in frange(y0, y1 - 0.01, 0.25, 0.0) if y > y0 + 0.005]
    elif d == 'courses':
        o += [fz(x0, y, x1, y + 0.012, z + s*0.0005, 'mortar', s) for y in frange(y0, y1 - 0.01, 0.125, 0.0) if y > y0 + 0.005]
    elif d == 'blocks':
        for y in frange(y0, y1, 0.25, 0.0):
            if y > y0 + 0.005: o.append(fz(x0, y, x1, y + 0.014, z + s*0.0005, 'mortar', s))
            off = 0.25 if round(y/0.25) % 2 else 0.0
            for x in frange(x0 + 0.01, x1 - 0.01, 0.5, off): o.append(fz(x - 0.007, max(y, y0), x + 0.007, min(y + 0.25, y1), z + s*0.0005, 'mortar', s))
    elif d == 'ribs':
        o += [B(x - 0.015, y0, z, x + 0.015, y1, z + s*0.014, 'WALL_D') for x in frange(x0 + 0.03, x1 - 0.03, 0.25, 0.125)]
    elif d == 'paint':
        o.append(fz(x0, y0, x1, y1, z + s*0.0005, 'INNER', s))
    return o
def slab(mat, x0, x1, y0, y1, z0, z1, s):
    """a run of whole skin; s = +1 if its visible face is z1 (outside), -1 if z0 (room side)"""
    if x1 - x0 < 1e-4 or y1 - y0 < 1e-4: return []
    return [B(x0, y0, z0, x1, y1, z1, MAT[mat]['body'])] + deco(mat, x0, x1, y0, y1, z1 if s > 0 else z0, s)

def cell(mat, state, t):
    """one cell of a skin, x -0.125..0.125, y 0..0.25, z -t/2..t/2, face +Z"""
    h = CELL; x0, x1, z0, z1 = -h/2, h/2, -t/2, t/2; body = MAT[mat]['body']
    if state == 'whole': return slab(mat, x0, x1, 0, h, z0, z1, 1)
    if state == 'cracked':
        o = slab(mat, x0, x1, 0, h, z0, z1, 1) + crack(x0, x1, 0, h, z1 + 0.001, 1, 'crackG' if mat == 'glass' else 'crack')
        if mat in ('brick', 'block', 'concrete'): o.append(fz(-0.06, 0.08, 0.02, 0.14, z1 + 0.0012, 'shadow'))
        return o
    if state == 'gone':
        if mat == 'glass':
            return shards_edge(x0, x1, 0, z0, z1, 'glass', True, 3) + shards_edge(x0, x1, h, z0, z1, 'glass', False, 2)
        o = shards_edge(x0, x1, 0, z0, z1, body, True, 3)
        if mat == 'concrete': o += [B(-0.006, 0, -0.006, 0.006, h, 0.006, 'rebar'), B(x0, 0.12, -0.006, x1, 0.132, 0.006, 'rebar')]
        return o
    if state == 'rubble':
        if mat == 'glass': return [tet([(R.uniform(-0.15, 0.15), 0, R.uniform(0, 0.25)), (R.uniform(-0.15, 0.15), 0, R.uniform(0, 0.25)), (R.uniform(-0.15, 0.15), 0.003, R.uniform(0, 0.25)), (R.uniform(-0.15, 0.15), 0.02, R.uniform(0, 0.25))], 'glass') for _ in range(5)]
        return pile(-0.14, 0.14, 0.02, 0.26, MAT[mat]['bits'], n=4, s=0.05 if mat not in ('concrete', 'block', 'brick') else 0.06)
CELL_T = {'siding': 0.015, 'brick': 0.09, 'osb': 0.015, 'cement': 0.015, 'plaster': 0.0125, 'sheet': 0.01, 'cladding': 0.015, 'glass': 0.01, 'concrete': 0.2, 'block': 0.2}
CELLS = {m: {st: cell(m, st, CELL_T[m]) for st in ('whole', 'cracked', 'gone', 'rubble')} for m in MAT}

# ---------- frame sticks ----------
def remap(pcs, perm):
    """turn pieces made along Y into pieces along another axis: perm gives, for each world axis, the local axis it takes"""
    out = []
    for pc in pcs:
        q = copy.deepcopy(pc); f = lambda v: [v[perm[0]], v[perm[1]], v[perm[2]]]
        q['p'] = f(pc['p'])
        if 'v' in q: q['v'] = [f(v) for v in pc['v']]
        if 'n' in q: q['n'] = f(pc['n'])
        if 'd' in q: q['d'] = f(pc['d'])
        out.append(q)
    return out
def stretch(pcs, axis, start, length):
    """a 1 m stick from sticks[] stretched to length and moved so it starts at start (a point)"""
    i = 'xyz'.index(axis); out = []
    for pc in pcs:
        q = copy.deepcopy(pc); q['p'][i] *= length
        if 'v' in q: q['v'] = [[c*length if j == i else c for j, c in enumerate(v)] for v in q['v']]
        if 'd' in q: q['d'][i] *= length
        q['p'] = [round(q['p'][j] + start[j], 4) for j in range(3)]
        if 'v' in q: q['v'] = [[round(c, 4) for c in v] for v in q['v']]
        out.append(q)
    return out
def stick_y(a, b, c, snapped=False, steel=False, inner=None):
    """a stick along Y from 0 to 1, cross-section a (x) by b (z), centred"""
    xa, za = a/2, b/2
    def face_mark(y0, y1):
        return [fx(-za*0.8, y0, za*0.8, y1, xa + 0.0006, inner, 1)] if inner else []
    if not snapped: return [B(-xa, 0, -za, xa, 1, za, c)] + face_mark(0.01, 0.99)
    if steel:   # bent: both halves lean out to a kink at mid height
        k = 0.06
        lo = hull([(-xa, 0, -za), (xa, 0, -za), (xa, 0, za), (-xa, 0, za), (-xa, 0.5, -za + k), (xa, 0.5, -za + k), (xa, 0.5, za + k), (-xa, 0.5, za + k)], c)
        hi = hull([(-xa, 0.5, -za + k), (xa, 0.5, -za + k), (xa, 0.5, za + k), (-xa, 0.5, za + k), (-xa, 1, -za), (xa, 1, -za), (xa, 1, za), (-xa, 1, za)], c)
        return [lo, hi, fz(-xa, 0.46, xa, 0.54, za + k + 0.0006, 'crack')]
    lo = HB(-xa, 0, -za, xa, 0.44, za, c)
    hi = hull([(-xa, 0.56, -za + 0.08), (xa, 0.56, -za + 0.08), (xa, 0.56, za + 0.08), (-xa, 0.56, za + 0.08), (-xa, 1, -za), (xa, 1, -za), (xa, 1, za), (-xa, 1, za)], c)
    sp = [tet([(-xa, 0.44, -za), (xa, 0.44, -za), (0, 0.44, za), (R.uniform(-xa, xa), 0.44 + R.uniform(0.05, 0.09), R.uniform(-za, za))], 'splinter'),
          tet([(-xa, 0.44, za), (xa, 0.44, za), (0, 0.44, 0), (R.uniform(-xa, xa), 0.44 + R.uniform(0.03, 0.06), za*0.5)], 'splinter'),
          tet([(-xa, 0.56, -za + 0.08), (xa, 0.56, -za + 0.08), (0, 0.56, za + 0.08), (0, 0.56 - R.uniform(0.04, 0.08), 0.08)], 'splinter')]
    return [lo, hi] + sp
ALONG = {'y': [0, 1, 2], 'x': [1, 0, 2], 'z': [0, 2, 1]}   # world axis takes local axis
def make_stick(axis, a, b, c, steel=False, inner=None):
    w = stick_y(a, b, c, False, steel, inner); s = stick_y(a, b, c, True, steel, inner)
    return {'whole': remap(w, ALONG[axis]), 'snapped': remap(s, ALONG[axis])}
# sizes: (axis, cross-section across, cross-section deep); for 'x' sticks the first number is the height, for 'z' sticks the width
STICK_DEF = {
  'stud': ('y', 0.045, 0.14), 'plate': ('x', 0.045, 0.14), 'blocking': ('x', 0.045, 0.14), 'sill': ('x', 0.045, 0.14),
  'header': ('x', 0.235, 0.14), 'rim_joist': ('x', 0.24, 0.045), 'joist': ('z', 0.045, 0.24), 'rafter': ('z', 0.045, 0.19),
}
STICKS = {'wood': {}, 'lightsteel': {}}
for nm, (ax, a, b) in STICK_DEF.items():
    STICKS['wood'][nm] = make_stick(ax, a, b, 'lumber')
    STICKS['lightsteel'][nm] = make_stick(ax, a*0.9, b, 'galv', steel=True, inner='galvD' if ax == 'y' else None)
def post(kind, c, steel=False):
    """three-stud corner post and T backer, along Y, 1 m"""
    if kind == 'corner_post': studs = [(-0.07, 0.025, 0.07, 0.07), (-0.07, -0.07, -0.025, 0.025), (0.025, -0.07, 0.07, -0.025)]
    else: studs = [(-0.07, -0.07, -0.025, 0.07), (0.025, -0.07, 0.07, 0.07), (-0.025, -0.07, 0.025, -0.025)]
    out = {'whole': [], 'snapped': []}
    for x0, z0, x1, z1 in studs:
        out['whole'].append(B(x0, 0, z0, x1, 1, z1, c))
        s = stick_y(x1 - x0, z1 - z0, c, True, steel)
        out['snapped'] += [dict(q, p=[q['p'][0] + (x0 + x1)/2, q['p'][1], q['p'][2] + (z0 + z1)/2]) for q in s]
    return out
for fam, c, st in (('wood', 'lumber', False), ('lightsteel', 'galv', True)):
    STICKS[fam]['corner_post'] = post('corner_post', c, st); STICKS[fam]['t_backer'] = post('t_backer', c, st)
# steel frame (big buildings): I-section column and beam, cross brace, girt, curtain mullion
def ibeam_y(d, w, c):
    t = 0.014
    return [B(-w/2, 0, d/2 - t, w/2, 1, d/2, c), B(-w/2, 0, -d/2, w/2, 1, -d/2 + t, c), B(-0.006, 0, -d/2 + t, 0.006, 1, d/2 - t, c)]
def ibeam_bent(d, w, c):
    t = 0.014; k = 0.12; o = []
    for (x0, z0, x1, z1) in ((-w/2, d/2 - t, w/2, d/2), (-w/2, -d/2, w/2, -d/2 + t), (-0.006, -d/2 + t, 0.006, d/2 - t)):
        o.append(hull([(x0, 0, z0), (x1, 0, z0), (x1, 0, z1), (x0, 0, z1), (x0, 0.5, z0 + k), (x1, 0.5, z0 + k), (x1, 0.5, z1 + k), (x0, 0.5, z1 + k)], c))
        o.append(hull([(x0, 0.5, z0 + k), (x1, 0.5, z0 + k), (x1, 0.5, z1 + k), (x0, 0.5, z1 + k), (x0 + 0.01, 1, z0), (x1, 1, z0), (x1, 1, z1), (x0 + 0.01, 1, z1)], c))
    return o
STICKS['steel'] = {
  'column': {'whole': ibeam_y(0.3, 0.3, 'steel'), 'snapped': ibeam_bent(0.3, 0.3, 'steel')},
  'beam': {'whole': remap(ibeam_y(0.4, 0.18, 'steel'), ALONG['x']), 'snapped': remap(ibeam_bent(0.4, 0.18, 'steel'), ALONG['x'])},
  'brace': make_stick('y', 0.08, 0.012, 'steelD', steel=True),
  'girt': make_stick('x', 0.15, 0.1, 'steelD', steel=True),
  'mullion': make_stick('y', 0.05, 0.14, 'alu', steel=True),
}
STICKS['concrete'] = {'column': {'whole': [HB(-0.2, 0, -0.2, 0.2, 1, 0.2, 'concrete')],
                                 'snapped': [HB(-0.2, 0, -0.2, 0.2, 0.4, 0.2, 'concrete'), HB(-0.2, 0.62, -0.2, 0.2, 1, 0.2, 'concrete')]
                                            + [B(x - 0.008, 0.38, z - 0.008, x + 0.008 + (0.03 if x > 0 else -0.02), 0.64, z + 0.008, 'rebar') for x in (-0.14, 0.14) for z in (-0.14, 0.14)]
                                            + shards_edge(-0.2, 0.2, 0.4, -0.2, 0.2, 'concrete', True, 3) + shards_edge(-0.2, 0.2, 0.62, -0.2, 0.2, 'concrete', False, 3)}}
STICKS_INFO = {nm: {'axis': ax, 'size': ([a, 1, b] if ax == 'y' else [1, a, b] if ax == 'x' else [a, b, 1])} for nm, (ax, a, b) in STICK_DEF.items()}
STICKS_INFO.update({'corner_post': {'axis': 'y', 'size': [0.14, 1, 0.14]}, 't_backer': {'axis': 'y', 'size': [0.14, 1, 0.14]},
                    'column': {'axis': 'y', 'size': [0.3, 1, 0.3], 'note': 'steel: I-section 0.3 x 0.3; concrete: 0.4 square, snapped shows rebar'},
                    'beam': {'axis': 'x', 'size': [1, 0.4, 0.18]}, 'brace': {'axis': 'y', 'size': [0.08, 1, 0.012], 'note': 'turn it to the diagonal'},
                    'girt': {'axis': 'x', 'size': [1, 0.15, 0.1]}, 'mullion': {'axis': 'y', 'size': [0.05, 1, 0.14]}})

# ---------- the kinds of wall ----------
# layers: (material, z0, z1, face) outside to inside; face +1 = its visible face is outside, -1 = room side
KINDS = {
  'wood_siding':      {'family': 'wood', 'use': 'houses, sheds, small shops', 'layers': [('siding', 0.085, 0.1, 1), ('osb', 0.07, 0.085, 1), ('plaster', -0.0825, -0.07, -1)], 'heights': [3.0, 3.5]},
  'wood_brick':       {'family': 'wood', 'use': 'brick-faced houses', 'layers': [('brick', 0.085, 0.175, 1), ('osb', 0.07, 0.085, 1), ('plaster', -0.0825, -0.07, -1)], 'heights': [3.0, 3.5]},
  'lightsteel_sheet': {'family': 'lightsteel', 'use': 'shops and flats', 'layers': [('sheet', 0.085, 0.095, 1), ('cement', 0.07, 0.085, 1), ('plaster', -0.0825, -0.07, -1)], 'heights': [3.5]},
  'steel_cladding':   {'family': 'steel', 'use': 'warehouses, big stores, industrial', 'layers': [('cladding', 0.05, 0.065, 1)], 'heights': [4.5]},
  'steel_curtain':    {'family': 'curtain', 'use': 'offices and shop fronts', 'layers': [('glass', -0.005, 0.005, 1)], 'heights': [3.5, 4.5]},
  'concrete_poured':  {'family': 'concrete', 'use': 'the biggest buildings, bunkers, car parks', 'layers': [('concrete', -0.1, 0.1, 1)], 'heights': [3.0, 3.5, 4.5]},
  'concrete_block':   {'family': 'concrete', 'use': 'garages, back walls, utility buildings', 'layers': [('block', -0.1, 0.1, 1)], 'heights': [3.0, 3.5, 4.5]},
  'concrete_brick':   {'family': 'concrete', 'use': 'brick-faced blocks of flats and civic buildings', 'layers': [('brick', 0.1, 0.19, 1), ('block', -0.1, 0.1, 1)], 'heights': [3.5]},
}
FRAMED = ('wood', 'lightsteel')
RIM = 0.3   # framed walls: the top 0.3 m of a storey is the floor zone (rim joist, joist ends, subfloor)
def frame_col(k): return 'lumber' if KINDS[k]['family'] == 'wood' else 'galv'
def S(k, nm, state='whole'): return STICKS[KINDS[k]['family']][nm][state]
def st_y(k, x0, y0, y1, state='whole', z=0.0):
    """a stud from y0 to y1 with its left side at x0"""
    return stretch(S(k, 'stud', state), 'y', [x0 + 0.0225, y0, z], y1 - y0)
def st_x(k, nm, x0, x1, y0, state='whole', z=0.0): return stretch(S(k, nm, state), 'x', [x0, y0, z], x1 - x0)

def layer_runs(mat, z0, z1, s, x0, x1, H, holes, pad=None):
    """one skin from x0 to x1 and 0 to H, with holes: list of (hx0, hx1, row0, row1) cut out (cells, row = 0.25 m)"""
    o = []
    if not holes: return slab(mat, x0, x1, 0, H, z0, z1, s)
    xs = sorted(set([x0, x1] + [h[0] for h in holes] + [h[1] for h in holes]))
    for a, b in zip(xs, xs[1:]):
        hs = [h for h in holes if h[0] <= a + 1e-6 and h[1] >= b - 1e-6]
        if not hs: o += slab(mat, a, b, 0, H, z0, z1, s); continue
        h = hs[0]; y0, y1 = h[2]*CELL, h[3]*CELL
        o += slab(mat, a, b, 0, y0, z0, z1, s) + slab(mat, a, b, y1, H, z0, z1, s)
        body = MAT[mat]['body']
        if mat == 'glass': o += shards_edge(a, b, y0, z0, z1, 'glass', True, 2) + shards_edge(a, b, y1, z0, z1, 'glass', False, 2)
        else: o += shards_edge(a, b, y0, z0, z1, body, True, 2) + shards_edge(a, b, y1, z0, z1, body, False, 1)
    return o

def cracks_on(k, x0, x1, H, n=2):
    o = []
    L = KINDS[k]['layers']; m, z0, z1, s = L[0]
    for i in range(n):
        a = x0 + (x1 - x0)*R.uniform(0.0, 0.4); yb = H*R.uniform(0.2, 0.55); o += crack(a, min(x1, a + 0.3), yb, yb + R.uniform(0.5, 0.9), z1 + (0.0155 if MAT[m]['deco'] == 'ribs' else 0.0012), 1, 'crackG' if m == 'glass' else 'crack')
    m, z0, z1, s = L[-1]
    zf = z0 - 0.0012 if s < 0 else z0 - 0.0012
    o += crack(x0 + 0.05, x1 - 0.05, H*0.3, H*0.7, zf, -1, 'crackG' if m == 'glass' else 'crack')
    return o

def section(k, H, state):
    K = KINDS[k]; fam = K['family']; L = K['layers']; x0, x1 = -BAY/2, BAY/2; rows = int(round(H/CELL)); o = []
    # holes per layer: (x0, x1, row0, row1)
    if state == 'gone':
        outer = [(x0, 0.0, 3, 9), (0.0, x1, 2, 8)]; mid = [(x0, 0.0, 4, 8), (0.0, x1, 3, 7)]
    elif state == 'rubble':
        outer = [(x0, x1, 1, rows - 2)]; mid = outer
    else: outer = mid = []
    if fam == 'curtain':
        return curtain(k, H, state)
    for i, (m, z0, z1, s) in enumerate(L):
        if fam == 'concrete' and m == 'block' and len(L) > 1: holes = mid
        else: holes = outer if i == 0 else mid
        o += layer_runs(m, z0, z1, s, x0, x1, H, holes)
    if fam == 'concrete':
        o += paint_inner(k, x0, x1, H, mid if len(L) > 1 else outer)
        if state in ('gone', 'rubble'):
            hy0, hy1 = (mid if len(L) > 1 else outer)[0][2]*CELL, (mid if len(L) > 1 else outer)[0][3]*CELL
            bend = 0.08 if state == 'rubble' else 0.0
            for x in (-0.125, 0.125):
                o.append(hull([(x - 0.006, hy0, -0.006), (x + 0.006, hy0, -0.006), (x + 0.006, hy0, 0.006), (x - 0.006, hy0, 0.006),
                               (x - 0.006 + bend, hy1, -0.006 + bend), (x + 0.006 + bend, hy1, -0.006 + bend), (x + 0.006 + bend, hy1, 0.006 + bend), (x - 0.006 + bend, hy1, 0.006 + bend)], 'rebar'))
            for y in frange(hy0 + 0.1, hy1 - 0.05, 0.25, 0.125): o.append(B(x0, y, -0.006, x1, y + 0.012, 0.006, 'rebar'))
    if fam in FRAMED:
        Hf = H - RIM; snapped = 'snapped' if state == 'rubble' else 'whole'
        o += st_x(k, 'plate', x0, x1, 0) + st_y(k, x0, 0.045, Hf - 0.09, snapped) + st_x(k, 'plate', x0, x1, Hf - 0.09) + st_x(k, 'plate', x0, x1, Hf - 0.045)
        if state != 'rubble': o += st_x(k, 'blocking', x0 + 0.045, x1, 1.2)
        o += rim_zone(k, x0, x1, H)
    if fam == 'steel':
        o.append(B(x0, 0, -0.1, x1, 0.25, 0.065, 'concrete'))     # concrete curb the cladding starts on
        for j, g in enumerate(frange(1.0, H - 0.2, 1.25)):
            o += st_x(k, 'girt', x0, x1, g, 'snapped' if (state == 'rubble' and j == 1) else 'whole') if False else stretch(STICKS['steel']['girt']['snapped' if (state == 'rubble' and j == 1) else 'whole'], 'x', [x0, g, 0.0], x1 - x0)
    if state == 'cracked': o += cracks_on(k, x0, x1, H)
    if state == 'rubble':
        cols = MAT[L[0][0]]['bits'] + (['lumber'] if fam in FRAMED else []) + (MAT[L[-1][0]]['bits'] if len(L) > 1 else [])
        o += pile(x0, x1, 0.2, 0.55, cols, 5) + pile(x0, x1, -0.55, -0.2, cols, 4)
    return o

def paint_inner(k, x0, x1, H, holes):
    """concrete and block walls: inside paint on the room face, round any hole"""
    m, z0, z1, s = KINDS[k]['layers'][-1]
    if not holes: return [fz(x0, 0, x1, H, z0 - 0.0006, 'INNER', -1)]
    o = []
    for (a, b, r0, r1) in holes:
        o += [fz(a, 0, b, r0*CELL, z0 - 0.0006, 'INNER', -1), fz(a, r1*CELL, b, H, z0 - 0.0006, 'INNER', -1)]
    return o

def rim_zone(k, x0, x1, H):
    """framed walls: the floor zone at the top of the storey (rim joist, joist end, subfloor)"""
    Hf = H - RIM
    return st_x(k, 'rim_joist', x0, x1, Hf, z=0.0475) + stretch(S(k, 'joist'), 'z', [x0 + 0.0225, Hf, -0.07], 0.095) + [B(x0, H - 0.02, -0.07, x1, H, 0.07, 'floorboard' if KINDS[k]['family'] == 'wood' else 'topping')]

def curtain(k, H, state):
    """glass curtain wall: mullion on the left edge, sill and head transoms, a low pane and a tall pane, a spandrel panel at the floor"""
    x0, x1 = -BAY/2, BAY/2; o = []
    ms = 'snapped' if state == 'rubble' else 'whole'
    o += stretch(STICKS['steel']['mullion'][ms], 'y', [x0 + 0.025, 0, 0], H)
    for y in (0.0, 1.0, H - 0.6, H - 0.06): o.append(B(x0 + 0.05, y, -0.05, x1, y + 0.06, 0.05, 'alu'))
    o.append(B(x0 + 0.05, H - 0.54, -0.01, x1, H - 0.06, 0.01, 'WALL'))
    panes = [(0.06, 1.0), (1.06, H - 0.6)]
    for i, (a, b) in enumerate(panes):
        gone = (state == 'gone' and i == 1) or state == 'rubble'
        if gone: o += shards_edge(x0 + 0.05, x1, a, -0.005, 0.005, 'glass', True, 2) + shards_edge(x0 + 0.05, x1, b, -0.005, 0.005, 'glass', False, 2)
        else:
            o.append(B(x0 + 0.05, a, -0.005, x1, b, 0.005, 'glass'))
            if state == 'cracked': o += crack(x0 + 0.06, x1 - 0.02, a + 0.05, b - 0.05, 0.0062, 1, 'crackG') + crack(x0 + 0.06, x1 - 0.02, a + 0.05, b - 0.05, -0.0062, -1, 'crackG')
    if state == 'rubble': o += [tet([(R.uniform(-0.25, 0.25), 0, R.uniform(0.1, 0.6)), (R.uniform(-0.25, 0.25), 0, R.uniform(0.1, 0.6)), (R.uniform(-0.25, 0.25), 0.004, R.uniform(0.1, 0.6)), (R.uniform(-0.25, 0.25), 0.02, R.uniform(0.1, 0.6))], 'glass') for _ in range(9)]
    return o

# ---------- openings: a three-bay module with a 1.0 m clear opening ----------
OW, DH, WS = 0.5, 2.25, 1.0   # half the clear width, door/window head, window sill
def opening(k, H, what, state):
    K = KINDS[k]; fam = K['family']; L = K['layers']; X0, X1 = -0.75, 0.75; o = []
    sill = 0.0 if what == 'door' else WS
    # skins: left strip, right strip, above, below (window)
    for i, (m, z0, z1, s) in enumerate(L):
        if fam == 'curtain': break
        o += slab(m, X0, -OW, 0, H, z0, z1, s) + slab(m, OW, X1, 0, H, z0, z1, s) + slab(m, -OW, OW, DH, H, z0, z1, s)
        if sill > 0: o += slab(m, -OW, OW, 0, sill, z0, z1, s)
    zo = max(l[2] for l in L); zi = min(l[1] for l in L)
    if fam == 'concrete':
        m, z0, z1, s = L[-1]
        o += [fz(X0, 0, -OW, H, z0 - 0.0006, 'INNER', -1), fz(OW, 0, X1, H, z0 - 0.0006, 'INNER', -1), fz(-OW, DH, OW, H, z0 - 0.0006, 'INNER', -1)]
        if sill > 0: o.append(fz(-OW, 0, OW, sill, z0 - 0.0006, 'INNER', -1))
        o.append(B(-0.62, DH, zi - 0.001, 0.62, DH + 0.2, zo + 0.001, 'concreteD'))         # lintel
        if sill > 0: o.append(B(-0.58, sill - 0.06, zi, 0.58, sill, zo + 0.05, 'concreteD'))
    if fam in FRAMED:
        Hf = H - RIM; jack = 'snapped' if state == 'breached' else 'whole'
        o += st_y(k, X0, 0.045, Hf - 0.09)                                       # the bay's own stud on the left edge
        for sg in (-1, 1):
            kx = -0.59 if sg < 0 else 0.545; jx = -0.545 if sg < 0 else 0.5
            o += st_y(k, kx, 0.045, Hf - 0.09) + st_y(k, jx, 0.045, DH, jack if sg > 0 else 'whole')
        o += st_x(k, 'plate', X0, -OW, 0) + st_x(k, 'plate', OW, X1, 0) + st_x(k, 'header', -0.59, 0.59, DH)
        o += st_x(k, 'plate', X0, X1, Hf - 0.09) + st_x(k, 'plate', X0, X1, Hf - 0.045)
        for cx in (-0.25, 0.25): o += st_y(k, cx, DH + 0.235, Hf - 0.09)
        if sill > 0:
            o += st_x(k, 'plate', -OW, OW, 0) + st_x(k, 'sill', -OW, OW, sill - 0.09) + st_x(k, 'sill', -OW, OW, sill - 0.045)
            for cx in (-0.25, 0.25): o += st_y(k, cx, 0.045, sill - 0.09)
        o += rim_zone(k, X0, X1, H)
    if fam == 'steel':
        o.append(B(X0, 0, -0.1, -OW, 0.25, 0.065, 'concrete')); o.append(B(OW, 0, -0.1, X1, 0.25, 0.065, 'concrete'))
        if sill > 0: o.append(B(-OW, 0, -0.1, OW, 0.25, 0.065, 'concrete'))
        for g in frange(1.0, H - 0.2, 1.25):
            if g > DH or g < sill: o += stretch(STICKS['steel']['girt']['whole'], 'x', [X0, g, 0.0], X1 - X0)
            else: o += stretch(STICKS['steel']['girt']['whole'], 'x', [X0, g, 0.0], X1 - OW - 0.05) + stretch(STICKS['steel']['girt']['whole'], 'x', [OW + 0.05, g, 0.0], X1 - OW - 0.05)
        for sg in (-1, 1): o.append(B(sg*OW, 0, -0.05, sg*(OW + 0.06), DH + 0.15, 0.05, 'steelD'))
        o.append(B(-OW - 0.06, DH, -0.05, OW + 0.06, DH + 0.15, 0.05, 'steelD'))
    if fam == 'curtain':
        o += curtain_door(k, H, what, state)
        return o
    # casings (TRIM) round the clear opening, both faces
    for zf, sg in ((zo, 1), (zi, -1)):
        o += [B(-OW - 0.07, sill if sill > 0 else 0, zf, -OW, DH + 0.07, zf + sg*0.015, 'TRIM'), B(OW, sill if sill > 0 else 0, zf, OW + 0.07, DH + 0.07, zf + sg*0.015, 'TRIM'),
              B(-OW - 0.07, DH, zf, OW + 0.07, DH + 0.08, zf + sg*0.018, 'TRIM')]
        if sill > 0: o.append(B(-OW - 0.09, sill - 0.04, zf - sg*0.03, OW + 0.09, sill, zf + sg*0.04, 'TRIM'))
    if state == 'breached':   # the outside casing leg on the right hangs off
        o = [q for q in o if not (q.get('c') == 'TRIM' and q['s'] == 'box' and abs(q['p'][0] - (OW + 0.035)) < 1e-3 and q['p'][2] > 0)]
        o.append(hull([(OW, 0.2, zo), (OW + 0.07, 0.2, zo), (OW + 0.07, 0.2, zo + 0.015), (OW, 0.2, zo + 0.015),
                       (OW + 0.25, 1.9, zo + 0.2), (OW + 0.32, 1.9, zo + 0.2), (OW + 0.32, 1.9, zo + 0.215), (OW + 0.25, 1.9, zo + 0.215)], 'TRIM'))
    # jamb liners inside the opening
    o += [B(-OW, sill, zi, -OW + 0.02, DH, zo, 'TRIM'), B(OW - 0.02, sill, zi, OW, DH, zo, 'TRIM'), B(-OW, DH - 0.02, zi, OW, DH, zo, 'TRIM')]
    if sill > 0: o.append(B(-OW, sill, zi, OW, sill + 0.02, zo, 'TRIM'))
    zc = (zo + zi)/2
    steel_door = fam in ('steel', 'concrete')
    if what == 'door':
        dc = 'doorSteel' if steel_door else 'door'
        if state != 'breached':
            o += [B(-OW + 0.02, 0.01, zc - 0.022, OW - 0.02, DH - 0.02, zc + 0.022, dc), B(OW - 0.12, 1.0, zc + 0.022, OW - 0.08, 1.04, zc + 0.06, 'knob'), B(OW - 0.12, 1.0, zc - 0.06, OW - 0.08, 1.04, zc - 0.022, 'knob')]
            if not steel_door:
                for sg in (1, -1): o += [fz(-0.38, y, 0.38, y + 0.75, zc + sg*0.0226, dc + 'D' if dc == 'door' else 'steelD', sg) for y in (0.2, 1.2)]
            if state == 'cracked':
                o += crack(-0.3, 0.1, 0.4, 1.9, zc + 0.0232, 1) + crack(-0.2, 0.3, 0.3, 1.6, zc - 0.0232, -1)
                o.append(fz(-0.3, 0.3, 0.05, 0.75, zc + 0.024, 'shadow'))
        else:
            if steel_door:   # torn off: lies on the floor outside
                o.append(B(-0.46, 0.0, zo + 0.25, 0.46, 0.045, zo + 0.25 + 2.2*0.42, dc)); o.append(B(-0.46, 0.045, zo + 0.3, 0.46, 0.06, zo + 0.34, 'steelD'))
            else:            # splintered stub on the hinges, boards on the floor
                o.append(B(-OW + 0.02, 0.01, zc - 0.022, -0.3, DH - 0.02, zc + 0.022, dc)); o += shards_edge(-0.3, -0.24, 0.3, zc - 0.022, zc + 0.022, 'splinter', True, 1)
                for i in range(5): o.append(tet([(-0.3, 0.3 + i*0.35, zc - 0.02), (-0.3, 0.3 + i*0.35, zc + 0.02), (-0.3, 0.6 + i*0.35, zc), (-0.3 + R.uniform(0.06, 0.16), 0.45 + i*0.35, zc)], 'splinter'))
                o += [B(-0.2 + i*0.18, 0.0, zo + 0.1 + i*0.12, 0.0 + i*0.18, 0.045, zo + 0.5 + i*0.1, dc) for i in range(3)]
    else:
        gc = 'glass'; mid = (WS + DH)/2
        if state == 'breached':
            o += shards_edge(-OW + 0.02, OW - 0.02, sill + 0.02, zc - 0.005, zc + 0.005, gc, True, 4) + shards_edge(-OW + 0.02, OW - 0.02, DH - 0.02, zc - 0.005, zc + 0.005, gc, False, 3)
            o.append(B(-OW + 0.02, mid - 0.02, zc - 0.03, -0.05, mid + 0.02, zc + 0.03, 'TRIM')); o.append(tet([(-0.05, mid - 0.02, zc - 0.03), (-0.05, mid + 0.02, zc + 0.03), (-0.05, mid - 0.02, zc + 0.03), (0.03, mid - 0.04, zc)], 'splinter'))
            o += [tet([(R.uniform(-0.5, 0.5), 0, zo + R.uniform(0.05, 0.6)), (R.uniform(-0.5, 0.5), 0, zo + R.uniform(0.05, 0.6)), (R.uniform(-0.5, 0.5), 0.003, zo + R.uniform(0.05, 0.6)), (R.uniform(-0.5, 0.5), 0.02, zo + R.uniform(0.05, 0.6))], gc) for _ in range(6)]
        else:
            o += [B(-OW + 0.02, sill + 0.02, zc - 0.005, OW - 0.02, DH - 0.02, zc + 0.005, gc), B(-OW + 0.02, mid - 0.02, zc - 0.03, OW - 0.02, mid + 0.02, zc + 0.03, 'TRIM'),
                  B(-0.015, sill + 0.02, zc - 0.02, 0.015, DH - 0.02, zc + 0.02, 'TRIM')]
            if state == 'cracked': o += crack(-0.45, 0.0, mid + 0.05, DH - 0.05, zc + 0.0062, 1, 'crackG') + crack(0.05, 0.45, sill + 0.05, mid - 0.05, zc + 0.0062, 1, 'crackG') + crack(-0.45, 0.0, mid + 0.05, DH - 0.05, zc - 0.0062, -1, 'crackG')
    if state == 'cracked': o += cracks_on(k, X0, -OW - 0.08, H, 1) + cracks_on(k, OW + 0.08, X1, H, 1)
    if state == 'breached':
        o += crack(OW + 0.09, X1, 0.4, 2.0, zo + 0.0015, 1)
        cols = MAT[L[0][0]]['bits'] + (['lumber'] if fam in FRAMED else [])
        o += pile(-0.6, 0.6, zo + 0.1, zo + 0.5, cols, 5) + pile(-0.5, 0.5, zi - 0.45, zi - 0.1, cols, 3)
    return o

def curtain_door(k, H, what, state):
    """glass curtain wall: an aluminium-framed glass door (or a fixed light) in a three-bay module"""
    X0, X1 = -0.75, 0.75; o = []
    for x in (X0, -OW - 0.05, OW): o += stretch(STICKS['steel']['mullion']['whole'], 'y', [x + 0.025, 0, 0], H)
    for y in (DH, H - 0.6, H - 0.06): o.append(B(X0 + 0.05, y, -0.05, X1, y + 0.06, 0.05, 'alu'))
    o.append(B(X0 + 0.05, 0, -0.05, -OW - 0.05, 0.06, 0.05, 'alu')); o.append(B(OW + 0.05, 0, -0.05, X1, 0.06, 0.05, 'alu'))
    o.append(B(X0 + 0.05, H - 0.54, -0.01, X1, H - 0.06, 0.01, 'WALL'))
    panes = [(X0 + 0.05, -OW - 0.05, 0.06, DH), (OW + 0.05, X1, 0.06, DH), (X0 + 0.05, X1, DH + 0.06, H - 0.6)]
    for (a, b, y0, y1) in panes:
        if state == 'breached' and y0 < 1: o += shards_edge(a, b, y0, -0.005, 0.005, 'glass', True, 2)
        else:
            o.append(B(a, y0, -0.005, b, y1, 0.005, 'glass'))
            if state == 'cracked': o += crack(a + 0.02, b - 0.02, y0 + 0.1, y1 - 0.1, 0.0062, 1, 'crackG')
    if what == 'door':
        if state != 'breached':
            o += [B(-OW + 0.02, 0.0, -0.025, OW - 0.02, DH - 0.01, 0.025, 'alu'), B(-OW + 0.08, 0.1, -0.006, OW - 0.08, DH - 0.1, 0.006, 'glass'), B(0.3, 0.9, 0.025, 0.33, 1.3, 0.06, 'aluD')]
            o = [q for q in o if not (q['s'] == 'box' and q['c'] == 'alu' and abs(q['p'][0]) < 0.01 and abs(q['p'][1] - 1.12) < 0.05)]
            if state == 'cracked': o += crack(-0.4, 0.4, 0.2, 2.0, 0.0068, 1, 'crackG')
        else:
            o += [B(-OW + 0.02, 0.0, -0.025, OW - 0.02, 0.1, 0.025, 'alu'), B(-OW + 0.02, 0.0, -0.025, -OW + 0.08, DH - 0.01, 0.025, 'alu')] + shards_edge(-OW + 0.08, OW - 0.08, 0.1, -0.006, 0.006, 'glass', True, 4)
    else:
        if state != 'breached': o.append(B(-OW, 0.06, -0.005, OW, DH, 0.005, 'glass'))
        else: o += shards_edge(-OW, OW, 0.06, -0.005, 0.005, 'glass', True, 3)
        if state == 'cracked': o += crack(-0.4, 0.4, 0.2, 2.0, 0.0062, 1, 'crackG')
        o.append(B(-OW, 0, -0.05, OW, 0.06, 0.05, 'alu'))
    if state == 'breached': o += [tet([(R.uniform(-0.7, 0.7), 0, R.uniform(0.1, 0.9)), (R.uniform(-0.7, 0.7), 0, R.uniform(0.1, 0.9)), (R.uniform(-0.7, 0.7), 0.004, R.uniform(0.1, 0.9)), (R.uniform(-0.7, 0.7), 0.025, R.uniform(0.1, 0.9))], 'glass') for _ in range(12)]
    return o

# ---------- joints ----------
def joint(k, H, what):
    """where walls meet. The through wall runs along X; a second wall (corner, T, cross) runs along Z.
    straight: a 0.2 m filler of plain wall, x -0.1..0.1. corner: the outside corner is at (-X, +Z): wall 1 leaves along +X from
    x = -zi, wall 2 leaves along -Z from z = zi (zi = the kind's inner face, negative). T: the through wall, x -0.15..0.15, with a
    branch wall leaving its inside face along -Z. cross: two inside walls crossing at the origin. end: a free end at x = -0.1."""
    K = KINDS[k]; fam = K['family']; L = K['layers']; o = []
    zo = max(l[2] for l in L); zi = min(l[1] for l in L); Hf = H - RIM
    def post_at(nm, x, z, rot=0):
        if fam in FRAMED:
            p = stretch(STICKS[fam][nm]['whole'], 'y', [x, 0, z], Hf - 0.09)
            if rot: p = [dict(q, p=[x - (q['p'][2] - z), q['p'][1], z + (q['p'][0] - x)], v=[[-v[2], v[1], v[0]] for v in q['v']]) for q in p]
            return p
        return []
    def plates(x0, x1, z0, z1):
        if fam not in FRAMED: return []
        c = frame_col(k); return [B(x0, 0, z0, x1, 0.045, z1, c), B(x0, Hf - 0.09, z0, x1, Hf, z1, c)]
    if fam == 'curtain':
        if what in ('straight', 'end'): return stretch(STICKS['steel']['mullion']['whole'], 'y', [0, 0, 0], H)
        return [B(-0.08, 0, -0.08, 0.08, H, 0.08, 'alu'), B(-0.06, 0, 0.08, 0.06, H, 0.1, 'aluD')]
    if what == 'straight':
        for (m, z0, z1, s) in L: o += slab(m, -0.1, 0.1, 0, H, z0, z1, s)
        if fam in FRAMED: o += st_y(k, -0.0225, 0.045, Hf - 0.09) + plates(-0.1, 0.1, -0.07, 0.07) + rim_zone(k, -0.1, 0.1, H)
        if fam == 'concrete': o.append(fz(-0.1, 0, 0.1, H, L[-1][1] - 0.0006, 'INNER', -1))
        return o
    if what == 'corner':
        for (m, z0, z1, s) in L:
            if z0 >= 0:   # outside layers wrap the corner
                o += slab(m, -z1, -zi, 0, H, z0, z1, s)                                   # wall 1's run inside the square
                o += [dict(q, p=[-q['p'][2], q['p'][1], q['p'][0]], d=[q['d'][2], q['d'][1], q['d'][0]]) if q['s'] == 'box' else
                      dict(q, p=[-q['p'][2], q['p'][1], q['p'][0]], v=[[-v[2], v[1], v[0]] for v in q['v']], n=[-q['n'][2], q['n'][1], q['n'][0]])
                      for q in slab(m, zi, z0, 0, H, z0, z1, s)]                           # wall 2's run, turned a quarter
            elif z1 > 0:  # one thick layer (concrete, block): the whole square
                o += slab(m, -z1, -zi, 0, H, z0, z1, s) if False else [B(-z1, 0, zi, -zi, H, z1, MAT[m]['body'])]
        if fam in FRAMED:
            o += post_at('corner_post', 0, 0) + plates(-0.07, 0.07, -0.07, 0.07)
            o += [B(-0.07, Hf, 0.025, -zi, H - 0.02, 0.07, frame_col(k)), B(-0.07, Hf, zi, -0.025, H - 0.02, 0.07, frame_col(k))]
        if L[0][0] in ('siding', 'sheet', 'cladding'):   # corner boards
            o += [B(-zo - 0.02, 0, zo, -zo + 0.1, H, zo + 0.02, 'TRIM'), B(-zo - 0.02, 0, zo - 0.1, -zo, H, zo, 'TRIM')]
        return o
    if what == 'T':
        for (m, z0, z1, s) in L:
            if z1 > 0: o += slab(m, -0.15, 0.15, 0, H, z0, z1, s)
            else: o += slab(m, -0.15, -0.07, 0, H, z0, z1, s) + slab(m, 0.07, 0.15, 0, H, z0, z1, s)
        if fam in FRAMED: o += post_at('t_backer', 0, 0) + plates(-0.15, 0.15, -0.07, 0.07) + rim_zone(k, -0.15, 0.15, H)
        if fam == 'concrete': o += [B(-0.1, 0, zi - 0.1, 0.1, H, zi, MAT[L[-1][0]]['body']), fz(-0.15, 0, -0.1, H, zi - 0.0006, 'INNER', -1), fz(0.1, 0, 0.15, H, zi - 0.0006, 'INNER', -1)]
        return o
    if what == 'cross':
        if fam in FRAMED:
            for (x, z) in ((-0.07, -0.07), (0.025, -0.07), (-0.07, 0.025), (0.025, 0.025)): o += st_y(k, x, 0.045, Hf - 0.09, z=z + 0.0225)
            o += plates(-0.07, 0.07, -0.07, 0.07) + [B(-0.07, Hf, -0.07, 0.07, H, 0.07, frame_col(k))]
        else: o.append(B(-0.1, 0, -0.1, 0.1, H, 0.1, MAT[L[-1][0]]['body']))
        return o
    if what == 'end':
        for (m, z0, z1, s) in L: o += slab(m, -0.1 + (0.015 if m != L[0][0] else 0), 0.1, 0, H, z0, z1, s)
        o.append(B(-0.1, 0, zi, -0.085, H, zo, 'TRIM' if fam in FRAMED else MAT[L[0][0]]['body']))
        if fam in FRAMED: o += st_y(k, -0.085, 0.045, Hf - 0.09) + st_y(k, -0.04, 0.045, Hf - 0.09) + plates(-0.085, 0.1, -0.07, 0.07) + rim_zone(k, -0.085, 0.1, H)
        if fam == 'concrete': o.append(fz(-0.1, 0, 0.1, H, zi - 0.0006, 'INNER', -1))
        return o

def edge(k, what):
    """height-free pieces at a wall's top; y = 0 is the top of the wall (the storey line)"""
    K = KINDS[k]; fam = K['family']; L = K['layers']; zo = max(l[2] for l in L); zi = min(l[1] for l in L); o = []; x0, x1 = -BAY/2, BAY/2
    if what == 'floor_edge':   # the floor above meeting this wall: the first metre of floor, joists or deck or slab
        if fam in FRAMED:
            fc = 'floorboard' if fam == 'wood' else 'topping'
            o += stretch(S(k, 'joist'), 'z', [x0 + 0.0225, -RIM, -1.0], 0.93) + [B(x0, -0.02, -1.0, x1, 0, -0.07, fc), B(x0, -RIM, -1.0, x1, -RIM + 0.0125, zi, 'gypsum'), fy(x0, -1.0, x1, zi, -RIM - 0.0006, 'INNER', -1)]
            if fam == 'wood': o += [fy(x0, z - 0.004, x1, z + 0.004, 0.0006, 'floorboardD') for z in (-0.88, -0.66, -0.44, -0.22)]
        elif fam == 'concrete':
            o += [B(x0, -0.25, -1.0, x1, 0, zi, 'concrete'), fy(x0, -1.0, x1, zi, -0.2506, 'INNER', -1)]
        else:   # steel and curtain: an edge beam and the deck
            o += stretch(STICKS['steel']['beam']['whole'], 'x', [x0, -0.2, -0.15], x1 - x0) + [B(x0, -0.1, -1.0, x1, 0, -0.06, 'topping'), B(x0, -0.16, -1.0, x1, -0.1, -0.06, 'deck')]
            o += [B(x, -0.2, -1.0, x + 0.06, -0.16, -0.06, 'deck') for x in (-0.22, 0.03)]
    if what == 'roof_edge':     # the eaves on top of the top storey: ceiling joist, rafter, fascia, roof boards
        if fam in FRAMED or fam == 'concrete':
            c = 'lumber'
            o += stretch(STICKS['wood']['joist']['whole'], 'z', [x0 + 0.0225, 0.0, -1.0], 1.0 + zo) + [B(x0, -0.0125, -1.0, x1, 0.0, zi, 'gypsum'), fy(x0, -1.0, x1, zi, -0.0131, 'INNER', -1)]
            a = math.radians(30); run = 1.0 + zo + 0.4; z_out = zo + 0.4
            pts = lambda dx, w: [(x0 + 0.0225 + dx, 0.05, z_out), (x0 + 0.0675 + dx, 0.05, z_out), (x0 + 0.0675 + dx, 0.05 + w, z_out), (x0 + 0.0225 + dx, 0.05 + w, z_out)]
            lo = pts(0, 0.19); hi = [(x, y + run*math.tan(a), z - run) for x, y, z in lo]
            o.append(hull(lo + hi, c))
            o.append(B(x0, 0.02, z_out, x1, 0.24, z_out + 0.025, 'TRIM'))
            t = 0.025; n = (0, math.cos(a), math.sin(a))
            top = lambda z: 0.24 + (z_out - z)*math.tan(a)
            o.append(hull([(x0, top(z_out), z_out), (x1, top(z_out), z_out), (x1, top(z_out - run), z_out - run), (x0, top(z_out - run), z_out - run),
                           (x0, top(z_out) + t, z_out), (x1, top(z_out) + t, z_out), (x1, top(z_out - run) + t, z_out - run), (x0, top(z_out - run) + t, z_out - run)], 'roofboard'))
            o.append(hull([(x0, top(z_out) + t, z_out + 0.03), (x1, top(z_out) + t, z_out + 0.03), (x1, top(z_out - run) + t, z_out - run), (x0, top(z_out - run) + t, z_out - run),
                           (x0, top(z_out) + t + 0.012, z_out + 0.03), (x1, top(z_out) + t + 0.012, z_out + 0.03), (x1, top(z_out - run) + t + 0.012, z_out - run), (x0, top(z_out - run) + t + 0.012, z_out - run)], 'shingle'))
            o.append(B(x0, -0.0125, zo, x1, 0.0, z_out, 'TRIM'))   # soffit
        else:   # flat roof on steel: parapet cap and deck
            o += [B(x0, 0, zi - 0.02, x1, 0.6, zo, 'WALL'), B(x0, 0.6, zi - 0.04, x1, 0.65, zo + 0.03, 'alu'), B(x0, -0.1, -1.0, x1, 0.0, zi - 0.02, 'topping'), B(x0, -0.16, -1.0, x1, -0.1, zi - 0.02, 'deck')]
    return o

# ---------- floors and stair openings ----------
def floor_tile(fam, state):
    """0.5 x 0.5, x and z from -0.25 to 0.25, top at y = 0.3"""
    x0, x1, z0, z1 = -0.25, 0.25, -0.25, 0.25; o = []
    if fam in FRAMED:
        top = 'floorboard' if fam == 'wood' else 'topping'; jc = 'lumber' if fam == 'wood' else 'galv'
        js = 'snapped' if state == 'rubble' else 'whole'
        o += stretch(STICKS[fam]['joist'][js], 'z', [x0 + 0.0225, 0.0125, z0], z1 - z0)
        o += [B(x0, 0, z0, x1, 0.0125, z1, 'gypsum'), fy(x0, z0, x1, z1, -0.0006, 'INNER', -1)] if state not in ('rubble',) else [B(x0, 0, z0, 0.0, 0.0125, z1, 'gypsum')]
        if state in ('whole', 'cracked'):
            o.append(B(x0, 0.28, z0, x1, 0.3, z1, top))
            if fam == 'wood': o += [fy(x0, z - 0.004, x1, z + 0.004, 0.3006, 'floorboardD') for z in (-0.125, 0.0, 0.125)]
            if state == 'cracked': o += [fy(-0.2, -0.13, 0.1, -0.12, 0.3008, 'crack'), fy(-0.05, 0.12, 0.2, 0.13, 0.3008, 'crack'), fy(0.0, -0.01, 0.12, 0.0, 0.3008, 'shadow')]
        elif state == 'gone':
            o.append(B(x0, 0.28, z0, x1, 0.3, -0.0625, top)); o += shards_edge(x0, x1, 0.29, -0.0625, -0.0625, 'splinter', True, 0) if False else []
            o += [tet([(x, 0.28, -0.0625), (x + 0.1, 0.28, -0.0625), (x + 0.05, 0.3, -0.0625), (x + 0.05, 0.29, -0.0625 + R.uniform(0.04, 0.09))], 'splinter') for x in (-0.24, -0.1, 0.05)]
            if fam == 'wood': o += [fy(x0, z - 0.004, x1, z + 0.004, 0.3006, 'floorboardD') for z in (-0.125,)]
        else:
            o += [hull([(x0, 0.28, z0), (0.0, 0.28, z0), (0.0, 0.3, z0), (x0, 0.3, z0), (x0, 0.05, z1 - 0.1), (0.0, 0.05, z1 - 0.1), (0.0, 0.07, z1 - 0.1), (x0, 0.07, z1 - 0.1)], top)]
            o += pile(-0.25, 0.25, -0.25, 0.25, [top, jc, 'gypsum'], 4, 0.06) if False else []
    elif fam == 'concrete':
        if state == 'whole': o += [B(x0, 0.05, z0, x1, 0.3, z1, 'concrete'), fy(x0, z0, x1, z1, 0.0494, 'INNER', -1)]
        elif state == 'cracked':
            o += [B(x0, 0.05, z0, x1, 0.3, z1, 'concrete'), fy(x0, z0, x1, z1, 0.0494, 'INNER', -1), fy(-0.22, -0.02, 0.2, 0.01, 0.3006, 'crack'), fy(-0.02, -0.2, 0.01, 0.0, 0.3006, 'crack')]
            o += [B(x - 0.006, 0.296, -0.06, x + 0.006, 0.308, 0.06, 'rebar') for x in (-0.12, 0.08)]
        else:
            o += [B(x0, 0.05, z0, x1, 0.3, -0.1, 'concrete'), B(x0, 0.05, 0.15, x1, 0.3, z1, 'concrete')] + shards_edge(x0, x1, 0.3, -0.1, -0.1, 'concrete', False, 0) if False else [B(x0, 0.05, z0, x1, 0.3, -0.1, 'concrete'), B(x0, 0.05, 0.15, x1, 0.3, z1, 'concrete')]
            sag = 0.12 if state == 'rubble' else 0.0
            for x in (-0.125, 0.0, 0.125):
                o.append(hull([(x - 0.006, 0.12, -0.1), (x + 0.006, 0.12, -0.1), (x + 0.006, 0.132, -0.1), (x - 0.006, 0.132, -0.1),
                               (x - 0.006, 0.12 - sag, 0.15), (x + 0.006, 0.12 - sag, 0.15), (x + 0.006, 0.132 - sag, 0.15), (x - 0.006, 0.132 - sag, 0.15)], 'rebar'))
            o.append(B(x0, 0.12, 0.02, x1, 0.132, 0.032, 'rebar'))
            if state == 'rubble': o += pile(x0, x1, -0.05, 0.12, ['concrete', 'concreteD'], 3, 0.05, False)
    else:   # steel deck with concrete topping
        ribs = [B(x, 0.12, z0, x + 0.07, 0.2, z1, 'deck') for x in (-0.22, 0.03)]
        if state in ('whole', 'cracked'):
            o += ribs + [B(x0, 0.2, z0, x1, 0.22, z1, 'deck'), B(x0, 0.22, z0, x1, 0.3, z1, 'topping')]
            if state == 'cracked': o += [fy(-0.2, -0.05, 0.22, -0.04, 0.3006, 'crack')]
        elif state == 'gone':
            o += ribs + [B(x0, 0.2, z0, x1, 0.22, z1, 'deck'), B(x0, 0.22, z0, x1, 0.3, -0.05, 'topping')] + [chunk(x, 0.1, 0.05, 'topping', y=0.22) for x in (-0.12, 0.1)]
        else:
            o += [hull([(x0, 0.2, z0), (x1, 0.2, z0), (x1, 0.22, z0), (x0, 0.22, z0), (x0, 0.02, z1), (x1, 0.06, z1), (x1, 0.08, z1), (x0, 0.04, z1)], 'deck')]
    if state == 'rubble' and fam != 'concrete':
        o += pile(-0.25, 0.25, -0.25, 0.25, ['floorboard' if fam == 'wood' else 'topping', 'gypsum', 'dust'], 4, 0.05, False)
    return o

def stairs(fam):
    """the frame round a stair opening, 1.0 m by 3.0 m (x -0.5..0.5, z -1.5..1.5), floor top at y = 0, a 0.5 m margin of floor round it"""
    o = []; X, Z = 0.5, 1.5; M = 0.5
    if fam in FRAMED:
        c = 'lumber' if fam == 'wood' else 'galv'; top = 'floorboard' if fam == 'wood' else 'topping'
        for sg in (-1, 1):
            o += stretch(STICKS[fam]['joist']['whole'], 'z', [sg*(X + 0.0225), -0.28, -Z - M], 2*(Z + M)) + stretch(STICKS[fam]['joist']['whole'], 'z', [sg*(X + 0.0675), -0.28, -Z - M], 2*(Z + M))
            o += stretch(STICKS[fam]['rim_joist']['whole'], 'x', [-X, -0.28, sg*(Z + 0.0225)], 2*X) + stretch(STICKS[fam]['rim_joist']['whole'], 'x', [-X, -0.28, sg*(Z + 0.0675)], 2*X)
            o += stretch(STICKS[fam]['joist']['whole'], 'z', [0.0, -0.28, sg*(Z + 0.09)], M - 0.09) if sg > 0 else stretch(STICKS[fam]['joist']['whole'], 'z', [0.0, -0.28, -Z - M], M - 0.09)
        o += [B(-X - M, -0.02, -Z - M, -X, 0, Z + M, top), B(X, -0.02, -Z - M, X + M, 0, Z + M, top), B(-X, -0.02, -Z - M, X, 0, -Z, top), B(-X, -0.02, Z, X, 0, Z + M, top)]
        o += [B(-X - M, -0.3, -Z - M, -X, -0.2875, Z + M, 'gypsum'), B(X, -0.3, -Z - M, X + M, -0.2875, Z + M, 'gypsum')]
        o += [B(-X, -0.3, -Z, -X + 0.015, 0.0, Z, 'TRIM'), B(X - 0.015, -0.3, -Z, X, 0.0, Z, 'TRIM')]
    elif fam == 'concrete':
        o += [B(-X - M, -0.25, -Z - M, -X, 0, Z + M, 'concrete'), B(X, -0.25, -Z - M, X + M, 0, Z + M, 'concrete'), B(-X, -0.25, -Z - M, X, 0, -Z, 'concrete'), B(-X, -0.25, Z, X, 0, Z + M, 'concrete')]
        o += [fy(-X - M, -Z - M, -X, Z + M, -0.2506, 'INNER', -1), fy(X, -Z - M, X + M, Z + M, -0.2506, 'INNER', -1)]
    else:
        o += [B(-X - M, -0.1, -Z - M, -X, 0, Z + M, 'topping'), B(X, -0.1, -Z - M, X + M, 0, Z + M, 'topping'), B(-X, -0.1, -Z - M, X, 0, -Z, 'topping'), B(-X, -0.1, Z, X, 0, Z + M, 'topping')]
        o += [B(-X - 0.08, -0.12, -Z - 0.08, -X, 0.0, Z + 0.08, 'steelD'), B(X, -0.12, -Z - 0.08, X + 0.08, 0.0, Z + 0.08, 'steelD'), B(-X, -0.12, -Z - 0.08, X, 0.0, -Z, 'steelD'), B(-X, -0.12, Z, X, 0.0, Z + 0.08, 'steelD')]
        o += stretch(STICKS['steel']['beam']['whole'], 'x', [-X - M, -0.5, -Z - 0.09], 2*(X + M)) + stretch(STICKS['steel']['beam']['whole'], 'x', [-X - M, -0.5, Z + 0.09], 2*(X + M))
    return o

# ---------- assemble ----------
CUT = 2.5   # openings are cut here: below is the same for every storey height, above is a plain filler per height
def split_y(pcs, Y):
    lo, hi = [], []
    for pc in pcs:
        if pc['s'] == 'box':
            y0, y1 = pc['p'][1] - pc['d'][1]/2, pc['p'][1] + pc['d'][1]/2
            if y0 < Y - 1e-4 and y1 > Y + 1e-4:
                for a, b, dst in ((y0, Y, lo), (Y, y1, hi)):
                    q = copy.deepcopy(pc); q['p'][1] = round((a + b)/2, 4); q['d'][1] = round(b - a, 4); dst.append(q)
                continue
            (lo if pc['p'][1] < Y else hi).append(pc); continue
        ys = sorted(set(round(v[1] + pc['p'][1], 4) for v in pc['v']))
        if len(ys) == 2 and ys[0] < Y - 1e-4 and ys[1] > Y + 1e-4:
            for f, dst in ((min, lo), (max, hi)):
                abs_v = [[v[0] + pc['p'][0], f(v[1] + pc['p'][1], Y), v[2] + pc['p'][2]] for v in pc['v']]
                c = centre(abs_v); q = copy.deepcopy(pc); q['p'] = [R4(x) for x in c]; q['v'] = [[R4(v[i] - c[i]) for i in range(3)] for v in abs_v]; dst.append(q)
            continue
        (lo if pc['p'][1] < Y else hi).append(pc)
    return lo, hi

SECTIONS, OPENINGS, OPENING_TOPS, JOINTS, EDGES = {}, {}, {}, {}, {}
for k, K in KINDS.items():
    SECTIONS[k], JOINTS[k], OPENING_TOPS[k] = {}, {}, {}
    H0 = K['heights'][0]
    OPENINGS[k] = {w: {st: split_y(opening(k, H0, w, st), CUT)[0] for st in ('intact', 'cracked', 'breached')} for w in ('door', 'window')}
    for H in K['heights']:
        h = '%.1f' % H
        SECTIONS[k][h] = {st: section(k, H, st) for st in ('whole', 'cracked', 'gone', 'rubble')}
        OPENING_TOPS[k][h] = split_y(opening(k, H, 'door', 'intact'), CUT)[1]
        JOINTS[k][h] = {j: joint(k, H, j) for j in ('straight', 'corner', 'T', 'cross', 'end')}
    EDGES[k] = {e: edge(k, e) for e in ('floor_edge', 'roof_edge')}
FLOORS = {f: {st: floor_tile(f, st) for st in ('whole', 'cracked', 'gone', 'rubble')} for f in ('wood', 'lightsteel', 'steel', 'concrete')}
STAIRS = {f: stairs(f) for f in ('wood', 'lightsteel', 'steel', 'concrete')}

kinds_out = {k: {'family': K['family'], 'use': K['use'], 'heights': K['heights'],
                 'layers': [{'cell': m, 'z': [z0, z1], 'face': 'outside' if s > 0 else 'room'} for (m, z0, z1, s) in K['layers']],
                 'frame': {'wood': 'wood stick frame: studs every 0.5 m, bottom plate, double top plate, blocking at 1.2 m, rim zone in the top 0.3 m',
                           'lightsteel': 'light steel studs (channel) in the same layout as the wood frame',
                           'steel': 'steel columns on a 6 m grid (sticks.steel.column), girts every 1.25 m from 1.0 m, a 0.25 m concrete curb',
                           'curtain': 'aluminium mullion every bay, transoms at the sill, 1.0 m, the spandrel and the head',
                           'concrete': 'none: the wall is one thick layer with rebar inside (shown when it breaks)'}[K['family']]} for k, K in KINDS.items()}
pack = {
  'name': 'walls', 'version': 1, 'units': 'metres', 'palette': PALETTE, 'slots': SLOTS, 'examples': EXAMPLES, 'darker': 0.78,
  'about': __doc__.split('\n', 2)[2], 'flatModels': True,
  'grid': {'cell': CELL, 'bay': BAY, 'panel': 3.0, 'storeys': {'house': 3.0, 'shop': 3.5, 'office': 3.5, 'community': 3.5, 'industrial': 4.5},
           'frameZone': 'framed walls: frame from 0 to height - 0.3, floor zone (rim joist, joist ends, subfloor) in the top 0.3 m; skins run the full height'},
  'kinds': kinds_out, 'sticksInfo': STICKS_INFO,
  'jointInfo': {'straight': 'a 0.2 m filler, x -0.1..0.1', 'corner': 'outside corner at (-X, +Z); wall 1 continues along +X, wall 2 along -Z',
                'T': 'through wall x -0.15..0.15; the branch wall leaves the inside face along -Z', 'cross': 'two inside walls crossing at the origin',
                'end': 'a free wall end at x = -0.1, the wall continues along +X'},
  'openingInfo': {'module': [-0.75, 0.75], 'clear': [-0.5, 0.5], 'doorHead': DH, 'windowSill': WS, 'cut': CUT,
                  'note': 'replaces three sections; framed walls: it brings its own left stud, both king and jack studs, header, cripples and sill; the next section to its right supplies the stud at x = 0.75. intact, cracked (split door, cracked glass and skin), breached (door torn or splintered, glass gone, casing hanging, rubble, frame still standing).'},
  'stateRule': 'Skins: whole -> cracked -> gone (the cell is removed; draw cells.<material>.gone at its edges so the hole is ragged and the next layer shows) -> rubble on the floor. The frame breaks last: snapped sticks. A breached wall is gone in every layer of a cell with the frame still up; when a stud snaps the cells it carried above become rubble.',
  'models': {'cells': CELLS, 'sticks': STICKS, 'sections': SECTIONS, 'openings': OPENINGS, 'openingTops': OPENING_TOPS, 'joints': JOINTS, 'edges': EDGES, 'floors': FLOORS, 'stairs': STAIRS},
}
out, st = write_pack('walls', pack, __file__)
import os
print(os.path.getsize(out)//1024, 'KB')
tot = {}
for key, v in st.items():
    g = key.split('.')[0]; tot.setdefault(g, [0, 0]); tot[g][0] += 1; tot[g][1] = max(tot[g][1], v[0])
print(tot)
for key in ('sections.wood_siding.3.0.whole', 'sections.wood_siding.3.0.rubble', 'openings.wood_siding.window.intact', 'sections.concrete_poured.3.0.gone'):
    print(key, st.get(key))
