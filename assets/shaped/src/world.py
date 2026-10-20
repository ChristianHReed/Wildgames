#!/usr/bin/env python3
"""Afterstreet world pack, version 1 (20 October 2026): roads, sidewalks, water, river and lake banks, waterfalls and rocks.
Writes assets/shaped/world.js. Run: python3 assets/shaped/src/world.py

Same rules as every pack: shaped pieces, flat colours, metres, Y up. Ground pieces lie on y = 0 and decals sit 1 cm above.
  roads       4 m by 4 m surface tiles (x and z from -2 to 2), each a BASE square with small shapes in DETAIL and DETAIL2;
              surfaceColours[kind] gives the three colours. Nothing crosses the tile edge, so tiles repeat without seams.
  markings    road paint as decals, along +Z (the direction of travel), centred on x = 0 unless said otherwise.
  kerbs       the 3D pieces where roads meet sidewalks: corners, ramps, driveway dips, islands, a speed hump, drains.
  sidewalks   2 m by 2 m tiles, top at y = 0 (raise them to the kerb height, 0.15 m, in the game), plus a tree pit and a verge.
  water       4 m by 4 m water surface tiles in slots WATER, WATER_L and FOAM; waterColours[kind] gives them per kind.
              River tiles flow towards +Z: scroll their DETAIL shapes along +Z to show the current.
  banks       2 m of shore along X: land at -Z (top at y = 0), water at +Z (its surface at y = -0.5). Each kind comes straight,
              as an outer corner and as an inner corner (quarter turns of radius 2 m about x = 0, z = 0), so a lake or river
              outline can be walked with them. LAND and LAND_D take the ground colour of the area.
  falls       waterfall pieces 4 m wide: a lip at the top, a 1 m sheet (stack as many as the drop needs), a splash pool, mist
              and spray, a small cascade step, and a weir.
  rocks       eight kinds of stone in three sizes (small about 0.4 m, medium about 1.2 m, large about 3 m), a cliff panel 4 m wide
              by 4 m high that stacks, and ore rocks for harvesting.
Notes for each group are in notes[]."""
import math, random
import numpy as np
from scipy.spatial import ConvexHull
from kit import *

R = random.Random(2026)
PALETTE = {
  # road paint and street hardware
  'paintW': '#e6e2d6', 'paintY': '#e0b83a', 'paintR': '#b8322a', 'paintB': '#3a6a9a', 'paintG': '#4a8a4a', 'tactile': '#d8b03a',
  'kerb': '#a8a296', 'kerbD': '#8a857a', 'kerbTop': '#b6b0a4', 'gutter': '#5a5852', 'grate': '#2e3034', 'grateD': '#1e1f22', 'iron': '#3a3c40',
  'grass': '#6d7a4f', 'grassD': '#5a6640', 'soil': '#5a4a38', 'mulch': '#4a3a2a', 'concrete': '#a29c92', 'concreteD': '#8a857c',
  # water and shores
  'foam': '#e8eef0', 'foamD': '#c8d6dc', 'mist': '#e4ecf0', 'spray': '#d0e4ee', 'reed': '#7a8a4a', 'reedD': '#5a6a3a', 'reedTop': '#6a4a2a',
  'lily': '#4a7a3a', 'lilyF': '#e8d8e0', 'mud': '#4a3c2e', 'mudD': '#3a2e22', 'wetMud': '#3e3328', 'sand': '#c8b48a', 'sandD': '#b09c74', 'sandWet': '#9a8a6a',
  'root': '#4a3a2a', 'algae': '#5a7a4a',
  # rocks
  'granite': '#8a8884', 'graniteD': '#6e6c68', 'graniteL': '#a4a29c', 'sandstone': '#b88a5e', 'sandstoneD': '#9a6e48', 'sandstoneL': '#d0a87a',
  'basalt': '#3e3e42', 'basaltD': '#2e2e32', 'basaltL': '#56565c', 'limestone': '#cfc8b6', 'limestoneD': '#b0a894', 'slate': '#4e5660', 'slateD': '#3c434c',
  'riverStone': '#8e8a80', 'riverStoneD': '#6e6a62', 'riverStoneL': '#aaa69c', 'moss': '#5e7a3a', 'mossD': '#4a6230', 'lichen': '#a8a868',
  'flint': '#3a3a40', 'ironOre': '#8a4a2e', 'copperOre': '#4a9a7a', 'quartz': '#ece8e0', 'coal': '#1e1e20', 'gold': '#d8b040',
}
SURFACE = {   # BASE, DETAIL, DETAIL2
  'asphalt_new': ['#38383a', '#424244', '#2e2e30'], 'asphalt_worn': ['#4a4a4a', '#575756', '#2c2c2e'], 'asphalt_patched': ['#464646', '#2e2e30', '#5a5a58'],
  'concrete_road': ['#9a958c', '#8a857c', '#6e6a62'], 'cobbles': ['#6e6a62', '#7e7a70', '#55524c'], 'gravel_road': ['#8a8478', '#a29c90', '#6a665e'],
  'dirt_road': ['#7a6248', '#6a5440', '#8a7258'], 'highway': ['#333335', '#3c3c3e', '#2a2a2c'], 'parking_lot': ['#454547', '#4f4f51', '#3a3a3c'],
}
SIDEWALK = {
  'concrete_slabs': ['#a8a296', '#8e887e', '#5e7a3e'], 'cracked_slabs': ['#a29c90', '#7e786e', '#5e7a3e'], 'brick_pavers': ['#9a5e48', '#7a4838', '#b07a62'],
  'stone_flags': ['#9a968c', '#7e7a72', '#b0aca2'], 'asphalt_path': ['#555554', '#626260', '#3e3e3e'], 'gravel_path': ['#a09888', '#8a8476', '#b8b0a0'],
}
WATER = {   # WATER, WATER_L, FOAM
  'lake': ['#3e6474', '#5a8292', '#d8e4e8'], 'pond': ['#4a6650', '#6a8466', '#d8e4d8'], 'river': ['#46707e', '#6a96a4', '#e0eaee'],
  'rapids': ['#4e7a88', '#7aa4b0', '#eef4f6'], 'shallow': ['#6a8c8a', '#8aaaa6', '#e4ecec'], 'deep': ['#2a4a5a', '#3e6070', '#c8d6dc'],
  'swamp': ['#4a5a3e', '#5e6e46', '#8a9a5a'], 'frozen': ['#c8dce6', '#e4eef2', '#ffffff'],
}
G = dict(glow=True)
H = 2.0   # half a 4 m tile
def B4(): return [flat([(-H, 0, -H), (H, 0, -H), (H, 0, H), (-H, 0, H)], 'BASE', (0, 1, 0))]
def spots(seed, n, half=H, margin=0.2):
    r = random.Random(seed); return [(r.uniform(-half + margin, half - margin), r.uniform(-half + margin, half - margin), r.random()) for _ in range(n)]
def blob(x, z, r, c, n=7, seed=0, y=0.004, sx=1.0, sz=1.0):
    q = random.Random(seed); return flat([(x + math.cos(a)*r*sx*q.uniform(0.65, 1.2), y, z + math.sin(a)*r*sz*q.uniform(0.65, 1.2)) for a in [i*2*math.pi/n for i in range(n)]], c, (0, 1, 0))
def strip(x0, z0, x1, z1, w, c, y=0.005):
    dx, dz = x1 - x0, z1 - z0; l = math.hypot(dx, dz) or 1; nx, nz = -dz/l*w/2, dx/l*w/2
    return flat([(x0 + nx, y, z0 + nz), (x1 + nx, y, z1 + nz), (x1 - nx, y, z1 - nz), (x0 - nx, y, z0 - nz)], c, (0, 1, 0))
def rect(x0, z0, x1, z1, c, y=0.01): return flat([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], c, (0, 1, 0))
def pebble(x, z, r, c, h=0.6, y=0.0):
    return hull([(x - r, y, z - r*0.8), (x + r, y, z - r*0.7), (x + r*0.9, y, z + r*0.8), (x - r*0.8, y, z + r*0.9), (x - r*0.5, y + r*h, z - r*0.4), (x + r*0.5, y + r*h*1.1, z - r*0.3), (x + r*0.4, y + r*h*0.8, z + r*0.4), (x - r*0.4, y + r*h, z + r*0.3)], c)
def crack(x, z, n, seed, c='DETAIL2', w=0.03, y=0.006):
    q = random.Random(seed); o = []; a = q.uniform(0, 6.28)
    for i in range(n):
        x1, z1 = x + math.cos(a)*q.uniform(0.25, 0.5), z + math.sin(a)*q.uniform(0.25, 0.5)
        if abs(x1) > H - 0.1 or abs(z1) > H - 0.1: break
        o.append(strip(x, z, x1, z1, w*(1 - i*0.12), c, y)); x, z = x1, z1; a += q.uniform(-0.8, 0.8)
    return o
NOTES = {}

# ================= roads =================
RD = {}
RD['asphalt_new'] = B4() + [blob(x, z, 0.06 + 0.05*r, 'DETAIL', 5, i) for i, (x, z, r) in enumerate(spots(1, 6))]
RD['asphalt_worn'] = B4() + [blob(x, z, 0.12 + 0.1*r, 'DETAIL', 6, 10 + i) for i, (x, z, r) in enumerate(spots(2, 6))] + crack(-1.2, -0.6, 5, 3) + crack(0.6, 1.0, 4, 4) + [blob(1.2, -1.3, 0.12, 'DETAIL2', 6, 5)]
RD['asphalt_patched'] = B4() + [rect(-1.4, -0.8, 0.2, 0.5, 'DETAIL', 0.005), rect(0.6, 0.9, 1.6, 1.7, 'DETAIL', 0.005), rect(-0.4, -1.8, 0.9, -1.2, 'DETAIL2', 0.005)] + crack(1.0, -0.4, 4, 6)
RD['concrete_road'] = B4() + [strip(-H + 0.02, 0, H - 0.02, 0, 0.025, 'DETAIL2'), strip(0, -H + 0.02, 0, H - 0.02, 0.025, 'DETAIL2')] + crack(-1.0, 1.0, 3, 7, 'DETAIL2', 0.02) + [blob(1.1, -1.1, 0.15, 'DETAIL', 6, 8)]
RD['cobbles'] = B4() + [rect(-H + 0.04 + (c + 0.5*(r % 2))*0.4, -H + 0.04 + r*0.4, -H + 0.36 + (c + 0.5*(r % 2))*0.4, -H + 0.36 + r*0.4, 'DETAIL' if (c*7 + r*3) % 5 else 'DETAIL2', 0.006)
                        for r in range(10) for c in range(10) if -H + 0.36 + (c + 0.5*(r % 2))*0.4 < H]
RD['gravel_road'] = B4() + [pebble(x, z, 0.03 + 0.03*r, 'DETAIL' if i % 2 else 'DETAIL2') for i, (x, z, r) in enumerate(spots(9, 22))] + [strip(sx*0.9, -H + 0.1, sx*0.9, H - 0.1, 0.35, 'DETAIL2', 0.004) for sx in (1, -1)]
RD['dirt_road'] = B4() + [strip(sx*0.85, -H + 0.05, sx*0.85, H - 0.05, 0.38, 'DETAIL', 0.004) for sx in (1, -1)] + [blob(x, z, 0.12 + 0.12*r, 'DETAIL2', 6, 20 + i) for i, (x, z, r) in enumerate(spots(10, 5))] + \
                  [p for (x, z) in ((0.0, -1.2), (0.05, 0.4), (-0.1, 1.5)) for p in [tip([x, 0, z], [x + 0.03, 0.12, z], 0.03, 0.012, 'grass'), tip([x + 0.05, 0, z - 0.03], [x + 0.08, 0.09, z - 0.04], 0.025, 0.01, 'grassD')]]
RD['highway'] = B4() + [blob(x, z, 0.05 + 0.04*r, 'DETAIL', 5, 30 + i) for i, (x, z, r) in enumerate(spots(11, 5))] + [strip(0, z, 0, z + 0.6, 0.02, 'DETAIL2', 0.004) for z in (-1.8, -0.6, 0.6)]
RD['parking_lot'] = B4() + [blob(x, z, 0.1 + 0.08*r, 'DETAIL', 6, 40 + i) for i, (x, z, r) in enumerate(spots(12, 5))] + [blob(0.5, 0.2, 0.25, 'DETAIL2', 7, 41, 0.005)]
NOTES['roads'] = 'roads[kind]: a 4 m tile (BASE, DETAIL, DETAIL2 from surfaceColours[kind]). Lay them along the road strip and turn each by a random half turn so the repeat does not show; dirt_road and gravel_road have wheel ruts along Z, so keep Z along the road.'

# ================= markings (paint decals) =================
MK = {}
Y = 0.012
def dashes(x, w, dash, gap, total, c):
    o = []; z = -total/2
    while z < total/2 - 0.01: o.append(rect(x - w/2, z, x + w/2, min(z + dash, total/2), c, Y)); z += dash + gap
    return o
MK['centre_dash_yellow'] = dashes(0, 0.12, 3.0, 9.0, 12.0, 'paintY')
MK['centre_double_yellow'] = [rect(-0.17, -2, -0.05, 2, 'paintY', Y), rect(0.05, -2, 0.17, 2, 'paintY', Y)]
MK['centre_solid_dash'] = [rect(-0.17, -6, -0.05, 6, 'paintY', Y)] + dashes(0.11, 0.12, 3.0, 9.0, 12.0, 'paintY')
MK['lane_dash_white'] = dashes(0, 0.12, 3.0, 9.0, 12.0, 'paintW')
MK['edge_line'] = [rect(-0.075, -2, 0.075, 2, 'paintW', Y)]
MK['stop_line'] = [rect(-1.75, -0.3, 1.75, 0.3, 'paintW', Y)]
MK['give_way_teeth'] = [flat([(x - 0.3, Y, -0.3), (x + 0.3, Y, -0.3), (x, Y, 0.3)], 'paintW', (0, 1, 0)) for x in (-1.5, -0.75, 0.0, 0.75, 1.5)]
MK['crosswalk_zebra'] = [rect(x - 0.25, -1.5, x + 0.25, 1.5, 'paintW', Y) for x in [-3.25 + i*1.0 for i in range(7)]]
MK['crosswalk_lines'] = [rect(-3.5, -1.5, 3.5, -1.35, 'paintW', Y), rect(-3.5, 1.35, 3.5, 1.5, 'paintW', Y)]
def arrow(c='paintW', turn=0, straight=True):
    o = []
    if straight: o += [rect(-0.1, -2.5, 0.1, 0.5, c, Y), flat([(-0.4, Y, 0.5), (0.4, Y, 0.5), (0, Y, 1.6)], c, (0, 1, 0))]
    if turn:
        s = turn; o += [rect(-0.1, -2.5, 0.1, -0.6 if straight else 0.0, c, Y)] if not straight else []
        o += [flat([(-0.1*s, Y, -0.9), (0.1*s, Y, -0.7), (0.9*s, Y, 0.1), (0.7*s, Y, 0.3)], c, (0, 1, 0)), flat([(0.55*s, Y, 0.5), (1.25*s, Y, -0.2), (1.1*s, Y, 0.65)], c, (0, 1, 0))]
    return o
MK['arrow_straight'] = arrow(); MK['arrow_left'] = arrow(turn=1, straight=False); MK['arrow_right'] = arrow(turn=-1, straight=False); MK['arrow_straight_left'] = arrow(turn=1); MK['arrow_straight_right'] = arrow(turn=-1)
MK['parking_bay'] = [rect(-1.3, -2.5, -1.2, 2.5, 'paintW', Y), rect(1.2, -2.5, 1.3, 2.5, 'paintW', Y), rect(-1.3, -2.5, 1.3, -2.4, 'paintW', Y)]
MK['disabled_bay'] = MK['parking_bay'] + [rect(-0.5, -0.5, 0.5, 0.5, 'paintB', Y), rect(-0.07, 0.05, 0.07, 0.35, 'paintW', Y + 0.001), blob(0, 0.42, 0.06, 'paintW', 6, 1, Y + 0.001), rect(-0.07, -0.05, 0.25, 0.05, 'paintW', Y + 0.001), rect(0.18, -0.3, 0.27, -0.05, 'paintW', Y + 0.001)]
MK['bike_lane'] = [rect(-0.75, -2, 0.75, 2, 'paintG', Y - 0.001)] + \
                   [loft([[x, Y, 0, 0.18, 0.18], [x, Y + 0.001, 0, 0.18, 0.18]], 'paintW', n=8, caps=[False, True]) for x in (-0.32, 0.32)] + [strip(-0.32, 0, 0.0, 0.25, 0.05, 'paintW', Y + 0.002), strip(0.0, 0.25, 0.32, 0, 0.05, 'paintW', Y + 0.002), strip(0.0, 0.25, 0.1, 0.4, 0.05, 'paintW', Y + 0.002)]
def letter_strokes(ch):
    S = {'S': [(1, 2, 0, 2), (0, 2, 0, 1), (0, 1, 1, 1), (1, 1, 1, 0), (1, 0, 0, 0)], 'T': [(0, 2, 1, 2), (0.5, 2, 0.5, 0)], 'O': [(0, 0, 1, 0), (1, 0, 1, 2), (1, 2, 0, 2), (0, 2, 0, 0)],
         'P': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 1), (1, 1, 0, 1)], 'L': [(0, 2, 0, 0), (0, 0, 1, 0)], 'W': [(0, 2, 0, 0), (0, 0, 1, 0), (1, 0, 1, 2), (0.5, 0, 0.5, 1)],
         'A': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 0), (0, 1, 1, 1)], 'K': [(0, 0, 0, 2), (0, 1, 1, 2), (0, 1, 1, 0)], 'B': [(0, 0, 0, 2), (0, 2, 0.8, 2), (0.8, 2, 0.8, 1), (0, 1, 1, 1), (1, 1, 1, 0), (1, 0, 0, 0)],
         'U': [(0, 2, 0, 0), (0, 0, 1, 0), (1, 0, 1, 2)], 'X': [(0, 0, 1, 2), (0, 2, 1, 0)], 'C': [(1, 2, 0, 2), (0, 2, 0, 0), (0, 0, 1, 0)], 'H': [(0, 0, 0, 2), (1, 0, 1, 2), (0, 1, 1, 1)],
         'E': [(1, 2, 0, 2), (0, 2, 0, 0), (0, 0, 1, 0), (0, 1, 0.8, 1)], 'R': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 1), (1, 1, 0, 1), (0.3, 1, 1, 0)], 'I': [(0.5, 0, 0.5, 2)],
         'N': [(0, 0, 0, 2), (0, 2, 1, 0), (1, 0, 1, 2)], 'Y': [(0, 2, 0.5, 1), (1, 2, 0.5, 1), (0.5, 1, 0.5, 0)], 'D': [(0, 0, 0, 2), (0, 2, 0.7, 2), (0.7, 2, 1, 1.5), (1, 1.5, 1, 0.5), (1, 0.5, 0.7, 0), (0.7, 0, 0, 0)],
         'F': [(1, 2, 0, 2), (0, 2, 0, 0), (0, 1, 0.8, 1)], 'G': [(1, 2, 0, 2), (0, 2, 0, 0), (0, 0, 1, 0), (1, 0, 1, 1), (1, 1, 0.5, 1)], 'M': [(0, 0, 0, 2), (0, 2, 0.5, 1), (0.5, 1, 1, 2), (1, 2, 1, 0)],
         'V': [(0, 2, 0.5, 0), (0.5, 0, 1, 2)], '0': [(0, 0, 1, 0), (1, 0, 1, 2), (1, 2, 0, 2), (0, 2, 0, 0)], '1': [(0.5, 0, 0.5, 2)], '2': [(0, 2, 1, 2), (1, 2, 1, 1), (1, 1, 0, 1), (0, 1, 0, 0), (0, 0, 1, 0)],
         '3': [(0, 2, 1, 2), (1, 2, 1, 0), (1, 0, 0, 0), (0.2, 1, 1, 1)], '5': [(1, 2, 0, 2), (0, 2, 0, 1), (0, 1, 1, 1), (1, 1, 1, 0), (1, 0, 0, 0)], '4': [(0, 2, 0, 1), (0, 1, 1, 1), (1, 2, 1, 0)],
         '6': [(1, 2, 0, 2), (0, 2, 0, 0), (0, 0, 1, 0), (1, 0, 1, 1), (1, 1, 0, 1)], '7': [(0, 2, 1, 2), (1, 2, 0.4, 0)], '8': [(0, 0, 1, 0), (1, 0, 1, 2), (1, 2, 0, 2), (0, 2, 0, 0), (0, 1, 1, 1)],
         '9': [(1, 1, 0, 1), (0, 1, 0, 2), (0, 2, 1, 2), (1, 2, 1, 0), (1, 0, 0, 0)], ' ': [], '-': [(0.1, 1, 0.9, 1)], '!': [(0.5, 2, 0.5, 0.6), (0.5, 0.25, 0.5, 0.0)], '+': [(0.5, 0.4, 0.5, 1.6), (0.1, 1, 0.9, 1)],
         'K': [(0, 0, 0, 2), (0, 1, 1, 2), (0, 1, 1, 0)], 'Z': [(0, 2, 1, 2), (1, 2, 0, 0), (0, 0, 1, 0)], '/': [(0, 0, 1, 2)], '.': [(0.5, 0, 0.5, 0.15)], '&': [(1, 0, 0, 2), (0, 2, 0.6, 2), (0.6, 2, 0, 0.8), (0, 0.8, 0.4, 0), (0.4, 0, 1, 0.8)],
         'J': [(1, 2, 1, 0), (1, 0, 0, 0), (0, 0, 0, 0.6)], 'Q': [(0, 0, 1, 0), (1, 0, 1, 2), (1, 2, 0, 2), (0, 2, 0, 0), (0.6, 0.4, 1.1, -0.2)]}
    return S.get(ch, [])
def text_strokes(s, h, w_stroke, c, orient='ground', x0=0.0, y0=0.0, z0=0.0, gap=0.35, along=1, y=Y, n=(0, 1, 0), aspect=0.5):
    """block letters from strokes: ground text reads along -Z (towards a driver coming from -Z), wall text along +X on a face at z0"""
    o = []; cw = h*aspect; total = len(s)*cw + (len(s) - 1)*cw*gap; start = -total/2
    for i, ch in enumerate(s):
        ox = start + i*cw*(1 + gap)
        for (a, b, cc, d) in letter_strokes(ch):
            ax, ay, bx2, by2 = ox + a*cw, b*h/2, ox + cc*cw, d*h/2
            if orient == 'ground':   # letters stand up along +Z on the road, read from z < 0
                o.append(strip(x0 + ax - total*0, z0 + ay, x0 + bx2, z0 + by2, w_stroke, c, y) if (ax, ay) != (bx2, by2) else strip(x0 + ax, z0 + ay - w_stroke/2, x0 + ax, z0 + ay + w_stroke/2, w_stroke, c, y))
            else:
                dx, dy = bx2 - ax, by2 - ay; l = math.hypot(dx, dy) or 1; px, py = -dy/l*w_stroke/2, dx/l*w_stroke/2
                ex, ey = dx/l*w_stroke/2, dy/l*w_stroke/2
                pts = [(x0 + ax - ex + px, y0 + ay - ey + py, z0), (x0 + bx2 + ex + px, y0 + by2 + ey + py, z0), (x0 + bx2 + ex - px, y0 + by2 + ey - py, z0), (x0 + ax - ex - px, y0 + ay - ey - py, z0)]
                o.append(flat(pts, c, n))
    return o
def road_text(s, h=3.2):
    o = text_strokes(s, h, 0.15, 'paintW', 'ground', x0=0, z0=-h/2, aspect=0.3)   # long letters, as painted on real roads, so they read from a low driver's eye
    for q in o: q['v'] = [[-v[0], v[1], v[2]] for v in q['v']]; q['p'] = [-q['p'][0], q['p'][1], q['p'][2]]   # read the right way from a driver at -Z looking +Z
    return o
MK['text_stop'] = road_text('STOP'); MK['text_slow'] = road_text('SLOW'); MK['text_bus'] = road_text('BUS'); MK['text_school'] = road_text('SCHOOL', 3.0); MK['text_x'] = road_text('XING')
MK['yellow_box'] = [rect(-3, -3, 3, -2.88, 'paintY', Y), rect(-3, 2.88, 3, 3, 'paintY', Y), rect(-3, -3, -2.88, 3, 'paintY', Y), rect(2.88, -3, 3, 3, 'paintY', Y)] + [strip(-2.9 + d, -2.9, 2.9, 2.9 - d, 0.12, 'paintY', Y) for d in (0, 1.6, 3.2, 4.8)] + [strip(-2.9, -2.9 + d, 2.9 - d, 2.9, 0.12, 'paintY', Y) for d in (1.6, 3.2, 4.8)]
MK['kerb_red'] = [rect(-1, -0.075, 1, 0.075, 'paintR', Y)]
MK['kerb_yellow'] = [rect(-1, -0.075, 1, 0.075, 'paintY', Y)]
NOTES['markings'] = ('markings: road paint (decals 1.2 cm up). Lines run along Z: centre_dash_yellow, lane_dash_white and centre_solid_dash repeat every 12 m, '
                     'centre_double_yellow and edge_line every 4 m. stop_line is 3.5 m wide (one lane), give_way_teeth the same; crosswalk_zebra spans a 7 m road (x -3.5..3.5) and is 3 m deep. '
                     'Arrows point +Z. text_* read from a driver at -Z. yellow_box is a 6 m keep-clear box. kerb_red and kerb_yellow are 2 m of painted kerb face lying flat: stand them on the kerb top.')

# ================= kerbs and road hardware =================
KB = {}
KH, KW = 0.15, 0.16
def kerb_arc(r, a0, a1, n, rise=KH, ramp=None):
    """a kerb along a quarter circle of radius r about the origin, its road face on the outside"""
    o = []
    for i in range(n):
        t0, t1 = a0 + (a1 - a0)*i/n, a0 + (a1 - a0)*(i + 1)/n; h0 = h1 = rise
        if ramp:
            m = (i + 0.5)/n
            if ramp[0] <= m <= ramp[1]: h0 = h1 = 0.02
        c0, s0, c1, s1 = math.cos(t0), math.sin(t0), math.cos(t1), math.sin(t1)
        ri, ro = r - KW, r
        o.append(hull([(ri*c0, 0, ri*s0), (ro*c0, 0, ro*s0), (ro*c1, 0, ro*s1), (ri*c1, 0, ri*s1), (ri*c0, h0, ri*s0), ((ro - 0.03)*c0, h0, (ro - 0.03)*s0), ((ro - 0.03)*c1, h1, (ro - 0.03)*s1), (ri*c1, h1, ri*s1)], 'kerb'))
    return o
def fan(r, a0, a1, n, y, c):
    pts = [(0, y, 0)] + [(r*math.cos(a0 + (a1 - a0)*i/n), y, r*math.sin(a0 + (a1 - a0)*i/n)) for i in range(n + 1)]
    return flat(pts, c, (0, 1, 0))
# corner: the sidewalk corner is the quarter disc x<0, z<0 around (0,0) of radius 3; the road is outside it
KB['kerb_corner'] = kerb_arc(3.0, math.pi, math.pi*1.5, 6) + [fan(3.0 - KW, math.pi, math.pi*1.5, 6, KH, 'concrete')]
KB['kerb_corner_ramp'] = kerb_arc(3.0, math.pi, math.pi*1.5, 6, ramp=(0.34, 0.66)) + [fan(3.0 - KW, math.pi, math.pi*1.5, 6, KH, 'concrete'),
    solid([(-2.37, 0.02, -1.75), (-1.75, 0.02, -2.37), (-0.95, KH + 0.002, -1.6), (-1.6, KH + 0.002, -0.95)], [[0, 1, 2, 3]], 'concrete'),
    flat([(-2.25, 0.035, -1.7), (-1.7, 0.035, -2.25), (-1.45, 0.085, -1.95), (-1.95, 0.085, -1.45)], 'tactile', (-0.25, 0.94, -0.25))]
def ramp_straight():
    """a kerb cut 1.5 m wide in a straight 4 m kerb (road at +Z, sidewalk at -Z), with yellow tactile paving"""
    o = [box([x, KH/2, 0], [w, KH, KW], 'kerb') for x, w in ((-1.375, 1.25), (1.375, 1.25))]
    o += [hull([(-0.75, 0, -KW/2), (0.75, 0, -KW/2), (0.75, 0, KW/2), (-0.75, 0, KW/2), (-0.75, 0.02, -KW/2), (0.75, 0.02, -KW/2), (0.75, 0.02, KW/2), (-0.75, 0.02, KW/2)], 'kerb')]
    o += [solid([(-0.75, 0.02, -KW/2), (0.75, 0.02, -KW/2), (0.95, KH, -1.1), (-0.95, KH, -1.1)], [[0, 1, 2, 3]], 'concrete')]
    o += [solid([(sx*0.75, 0.02, -KW/2), (sx*0.95, KH, -1.1), (sx*1.2, KH, -KW/2)], [[0, 1, 2]], 'concrete') for sx in (1, -1)]
    o += [flat([(-0.7, 0.04, -0.12), (0.7, 0.04, -0.12), (0.72, 0.09, -0.45), (-0.72, 0.09, -0.45)], 'tactile', (0, 0.97, -0.24))]
    return o
KB['kerb_ramp'] = ramp_straight()
def driveway():
    o = [box([x, KH/2, 0], [w, KH, KW], 'kerb') for x, w in ((-1.75, 0.5), (1.75, 0.5))]
    o += [hull([(-1.5, 0, -KW/2), (1.5, 0, -KW/2), (1.5, 0, KW/2), (-1.5, 0, KW/2), (-1.5, 0.03, -KW/2), (1.5, 0.03, -KW/2), (1.5, 0.03, KW/2), (-1.5, 0.03, KW/2)], 'kerb')]
    o += [solid([(-1.5, 0.03, -KW/2), (1.5, 0.03, -KW/2), (1.5, KH, -0.9), (-1.5, KH, -0.9)], [[0, 1, 2, 3]], 'concreteD')]
    o += [solid([(sx*1.5, 0.03, -KW/2), (sx*1.5, KH, -0.9), (sx*1.5, KH, -KW/2)], [[0, 1, 2]], 'concreteD') for sx in (1, -1)]
    return o
KB['driveway_dip'] = driveway()
def island(L, W):
    o = []; hw = W/2
    o += [box([0, KH/2, sz*(hw - KW/2)], [L - W, KH, KW], 'kerb') for sz in (1, -1)]
    o += kerb_arc_at(L/2 - hw, 0, hw, -math.pi/2, math.pi/2) + kerb_arc_at(-(L/2 - hw), 0, hw, math.pi/2, math.pi*1.5)
    o += [flat([(-(L/2 - hw), KH, -hw + KW), (L/2 - hw, KH, -hw + KW), (L/2 - hw, KH, hw - KW), (-(L/2 - hw), KH, hw - KW)], 'grass', (0, 1, 0))]
    o += [flat([(L/2 - hw + (hw - KW)*math.cos(a), KH, (hw - KW)*math.sin(a)) for a in [-math.pi/2 + k*math.pi/6 for k in range(7)]], 'grass', (0, 1, 0)), flat([(-(L/2 - hw) + (hw - KW)*math.cos(a), KH, (hw - KW)*math.sin(a)) for a in [math.pi/2 + k*math.pi/6 for k in range(7)]], 'grass', (0, 1, 0))]
    return o
def kerb_arc_at(cx, cz, r, a0, a1, n=6):
    out = []
    for q in kerb_arc(r, a0, a1, n): q = dict(q); q['p'] = [R4(q['p'][0] + cx), q['p'][1], R4(q['p'][2] + cz)]; out.append(q)
    return out
KB['median_island'] = island(10.0, 1.6)
def roundabout(r=4.0):
    o = kerb_arc(r, 0, math.pi*2, 16) + [fan(r - KW, 0, math.pi*2, 16, KH, 'grass')]
    o += [loft([[0, KH, 0, 0.9, 0.9], [0, KH + 0.4, 0, 0.9, 0.9]], 'kerbD', n=8), loft([[0, KH + 0.4, 0, 0.3, 0.3], [0, KH + 1.2, 0, 0.25, 0.25], [0, KH + 2.4, 0, 0.0, 0.0]], 'grassD', n=6)]
    o += [p for a in [k*1.2566 for k in range(5)] for p in [tip([2.2*math.cos(a), KH, 2.2*math.sin(a)], [2.2*math.cos(a) + 0.03, KH + 0.18, 2.2*math.sin(a)], 0.04, 0.015, 'grassD')]]
    return o
KB['roundabout_centre'] = roundabout()
KB['speed_hump'] = [hull([(-1.8, 0, -0.5), (1.8, 0, -0.5), (1.8, 0, 0.5), (-1.8, 0, 0.5), (-1.8, 0.07, -0.2), (1.8, 0.07, -0.2), (1.8, 0.07, 0.2), (-1.8, 0.07, 0.2)], 'BASE')] + \
                   [solid([(x - 0.15, 0.0701, -0.2), (x + 0.15, 0.0701, -0.2), (x + 0.15, 0.0701, 0.2), (x - 0.15, 0.0701, 0.2)], [[0, 1, 2, 3]], 'paintW') for x in (-1.2, -0.4, 0.4, 1.2)]
KB['storm_drain'] = [box([0, -0.01, 0.0], [0.9, 0.02, 0.45], 'iron'), *[box([x, 0.002, 0], [0.04, 0.004, 0.38], 'grateD') for x in [-0.36 + i*0.09 for i in range(9)]],
                     box([0, KH*0.55, -0.24], [0.95, 0.09, 0.04], 'grateD'), flat([(-0.44, KH*0.55 - 0.045, -0.219), (0.44, KH*0.55 - 0.045, -0.219), (0.44, KH*0.55 + 0.045, -0.219), (-0.44, KH*0.55 + 0.045, -0.219)], 'grateD')]
KB['manhole_sewer'] = [loft([[0, 0.005, 0, 0.34, 0.34], [0, 0.012, 0, 0.34, 0.34]], 'iron', n=12), *[rect(-0.26, z - 0.015, 0.26, z + 0.015, 'grateD', 0.0125) for z in (-0.18, -0.09, 0, 0.09, 0.18)]]
KB['utility_cover'] = [box([0, 0.006, 0], [0.6, 0.012, 0.9], 'iron'), rect(-0.25, -0.4, 0.25, 0.4, 'grateD', 0.0125), rect(-0.2, -0.35, 0.2, 0.35, 'iron', 0.013)]
KB['road_end_barrier'] = [box([x, 0.5, 0], [0.12, 1.0, 0.12], 'paintW') for x in (-1.9, 1.9)] + [box([0, 0.85, 0.07], [4.0, 0.25, 0.04], 'paintW')] + \
                         [flat([(x, 0.73, 0.091), (x + 0.25, 0.73, 0.091), (x + 0.45, 0.97, 0.091), (x + 0.2, 0.97, 0.091)], 'paintR') for x in [-1.9 + i*0.5 for i in range(8)]]
NOTES['kerbs'] = ('kerbs: kerb_corner is the rounded corner of a block: a 3 m radius kerb about the origin from (-3, 0) to (0, -3), its quarter disc filled with sidewalk at the 15 cm kerb height; '
                  'the block carries on towards +X and +Z, the straight kerbs leave (-3, 0) along +Z and (0, -3) along +X, and the roads lie beyond x = -3 and z = -3. kerb_corner_ramp adds a cut and tactile paving at the middle. '
                  'kerb_ramp is a 4 m straight kerb with a 1.5 m cut (road at +Z) and driveway_dip a 4 m kerb lowered for a 3 m driveway. median_island is 10 by 1.6 m, roundabout_centre 4 m in radius with a planter. '
                  'speed_hump is 3.6 m across a lane (BASE takes the road colour). storm_drain sits in the gutter with its kerb inlet facing -Z (the kerb side). '
                  'manhole_sewer and utility_cover lie flat; road_end_barrier closes a dead end.')

# ================= sidewalks =================
SW = {}
h1 = 1.0
def B2(): return [flat([(-h1, 0, -h1), (h1, 0, -h1), (h1, 0, h1), (-h1, 0, h1)], 'BASE', (0, 1, 0))]
SW['concrete_slabs'] = B2() + [rect(-h1 + 0.01, -0.015, h1 - 0.01, 0.015, 'DETAIL', 0.004), rect(-0.015, -h1 + 0.01, 0.015, h1 - 0.01, 'DETAIL', 0.004)]
SW['cracked_slabs'] = B2() + [rect(-h1 + 0.01, -0.015, h1 - 0.01, 0.015, 'DETAIL', 0.004), rect(-0.015, -h1 + 0.01, 0.015, h1 - 0.01, 'DETAIL', 0.004)] + \
    [strip(-0.7, -0.6, -0.3, -0.35, 0.025, 'DETAIL'), strip(-0.3, -0.35, -0.1, -0.5, 0.02, 'DETAIL'), strip(0.3, 0.5, 0.75, 0.2, 0.02, 'DETAIL')] + \
    [tip([0.02, 0, 0.6], [0.05, 0.1, 0.6], 0.03, 0.012, 'DETAIL2'), tip([-0.02, 0, 0.3], [-0.01, 0.07, 0.32], 0.025, 0.01, 'DETAIL2')] + \
    [hull([(0.05, 0, -0.95), (0.95, 0, -0.95), (0.95, 0, -0.05), (0.05, 0, -0.05), (0.06, 0.035, -0.94), (0.94, 0.06, -0.94), (0.94, 0.06, -0.06), (0.06, 0.035, -0.06)], 'BASE')]
SW['brick_pavers'] = B2() + [rect(-h1 + 0.01, z - 0.008, h1 - 0.01, z + 0.008, 'DETAIL', 0.004) for z in [-0.9 + i*0.2 for i in range(10)]] + \
    [rect(x - 0.008, z + 0.012, x + 0.008, z + 0.19, 'DETAIL', 0.004) for i, z in enumerate([-1.0 + k*0.2 for k in range(10)]) for x in [-0.8 + 0.4*j + (0.2 if i % 2 else 0) for j in range(5)] if abs(x) < 0.99] + \
    [rect(-0.38, 0.22, -0.02, 0.38, 'DETAIL2', 0.005), rect(0.42, -0.58, 0.78, -0.42, 'DETAIL2', 0.005)]
SW['stone_flags'] = B2() + [strip(-h1, -0.2, h1, -0.15, 0.02, 'DETAIL'), strip(-0.3, -h1, -0.35, -0.18, 0.02, 'DETAIL'), strip(0.45, -0.17, 0.4, h1, 0.02, 'DETAIL'), strip(0.42, 0.45, h1, 0.5, 0.02, 'DETAIL'), strip(-h1, 0.55, 0.42, 0.52, 0.02, 'DETAIL')] + [rect(-0.85, 0.65, -0.35, 0.9, 'DETAIL2', 0.005)]
SW['asphalt_path'] = B2() + [blob(x, z, 0.06 + 0.05*r, 'DETAIL', 5, 50 + i, sx=1, sz=1) for i, (x, z, r) in enumerate(spots(51, 4, h1, 0.1))] + [strip(-0.6, 0.2, -0.2, 0.5, 0.02, 'DETAIL2')]
SW['gravel_path'] = B2() + [pebble(x, z, 0.02 + 0.02*r, 'DETAIL' if i % 2 else 'DETAIL2') for i, (x, z, r) in enumerate(spots(52, 14, h1, 0.08))]
SW['tree_pit'] = B2() + [rect(-0.6, -0.6, 0.6, 0.6, 'mulch', 0.003)] + [rect(-0.62, -0.62, 0.62, -0.58, 'iron', 0.012), rect(-0.62, 0.58, 0.62, 0.62, 'iron', 0.012), rect(-0.62, -0.58, -0.58, 0.58, 'iron', 0.012), rect(0.58, -0.58, 0.62, 0.58, 'iron', 0.012)] + \
    [rect(-0.55 + i*0.11, -0.55, -0.53 + i*0.11, 0.55, 'iron', 0.012) for i in range(11) if not (4 <= i <= 6)] + [rect(-0.12, -0.12, 0.12, 0.12, 'soil', 0.005)]
SW['grass_verge'] = B2() + [rect(-h1, -0.3, h1, h1, 'grass', 0.004)] + [p for i, (x, z, r) in enumerate(spots(53, 6, h1, 0.1)) if z > -0.2 for p in [tip([x, 0.004, z], [x + 0.02, 0.1 + 0.06*r, z], 0.03, 0.012, 'grassD')]]
SW['tactile_strip'] = B2() + [rect(-0.6, -0.4, 0.6, 0.4, 'tactile', 0.004)] + [box([x, 0.009, z], [0.025, 0.01, 0.025], 'tactile') for x in [-0.5 + i*0.14 for i in range(8)] for z in [-0.3 + j*0.15 for j in range(5)]]
NOTES['sidewalks'] = ('sidewalks[kind]: 2 m tiles (BASE, DETAIL, DETAIL2 from sidewalkColours[kind]) with their top at y = 0: draw them at the kerb height (0.15 m). '
                      'cracked_slabs has one slab heaved up by a root. tree_pit is a 1.2 m grate around a street tree (put the tree at its centre), grass_verge a strip of grass on the road side (+Z), '
                      'tactile_strip the yellow bumps at a crossing.')

# ================= water surfaces =================
WT = {}
def W4(): return [flat([(-H, 0, -H), (H, 0, -H), (H, 0, H), (-H, 0, H)], 'WATER', (0, 1, 0))]
def ripple(x, z, r, c, y=0.006, n=10, w=0.035):
    o = []
    for i in range(n):
        a0, a1 = 2*math.pi*i/n, 2*math.pi*(i + 0.6)/n
        o.append(flat([(x + r*math.cos(a0), y, z + r*math.sin(a0)), (x + r*math.cos(a1), y, z + r*math.sin(a1)), (x + (r - w)*math.cos(a1), y, z + (r - w)*math.sin(a1)), (x + (r - w)*math.cos(a0), y, z + (r - w)*math.sin(a0))], c, (0, 1, 0)))
    return o
WT['lake'] = W4() + [strip(x - 0.4, z, x + 0.4, z, 0.04, 'WATER_L', 0.004) for x, z, r in spots(60, 7)] + ripple(-0.8, 0.9, 0.3, 'WATER_L', n=8)
WT['pond'] = W4() + [strip(x - 0.3, z, x + 0.3, z, 0.035, 'WATER_L', 0.004) for x, z, r in spots(61, 4)] + \
    [p for (x, z, r) in spots(62, 4) for p in [flat([(x + 0.3*math.cos(a), 0.006, z + 0.3*math.sin(a)) for a in [0.4 + k*0.8 for k in range(8)]], 'lily', (0, 1, 0))]] + \
    [loft([[0.9, 0.006, -0.7, 0.06, 0.06], [0.9, 0.05, -0.7, 0.09, 0.09], [0.9, 0.08, -0.7, 0, 0]], 'lilyF', n=5)]
def flow_streaks(seed, n, length, c, y=0.005, w=0.04):
    q = random.Random(seed); o = []
    for i in range(n):
        x = q.uniform(-H + 0.2, H - 0.2); z = q.uniform(-H + 0.2, H - 0.2 - length); L = length*q.uniform(0.5, 1.0)
        o.append(flat([(x - w/2, y, z), (x + w/2, y, z), (x + w*0.2, y, z + L), (x - w*0.2, y, z + L)], c, (0, 1, 0)))
    return o
WT['river'] = W4() + flow_streaks(63, 14, 1.2, 'WATER_L') + flow_streaks(64, 4, 0.6, 'FOAM', 0.006, 0.03)
WT['rapids'] = W4() + flow_streaks(65, 16, 1.4, 'WATER_L') + [blob(x, z, 0.15 + 0.2*r, 'FOAM', 7, 70 + i, 0.007, 1.0, 1.8) for i, (x, z, r) in enumerate(spots(66, 9))] + \
    [hull([(x - 0.25, -0.05, z - 0.2), (x + 0.25, -0.05, z - 0.25), (x + 0.3, -0.05, z + 0.2), (x - 0.2, -0.05, z + 0.25), (x - 0.12, 0.12, z - 0.08), (x + 0.15, 0.15, z - 0.1), (x + 0.14, 0.1, z + 0.1), (x - 0.1, 0.12, z + 0.08)], 'granite') for x, z in ((-1.0, -0.4), (0.8, 0.9))] + \
    [blob(x, z + 0.35, 0.32, 'FOAM', 7, 75 + i, 0.008, 1.2, 0.8) for i, (x, z) in enumerate(((-1.0, -0.4), (0.8, 0.9)))]
WT['shallow'] = W4() + [pebble(x, z, 0.04 + 0.05*r, 'riverStone' if i % 2 else 'riverStoneD', 0.5, -0.06) for i, (x, z, r) in enumerate(spots(67, 16))] + flow_streaks(68, 6, 0.8, 'WATER_L')
WT['deep'] = W4() + [strip(x - 0.5, z, x + 0.5, z, 0.05, 'WATER_L', 0.004) for x, z, r in spots(69, 4)]
WT['swamp'] = W4() + [blob(x, z, 0.3 + 0.3*r, 'WATER_L', 8, 80 + i, 0.005) for i, (x, z, r) in enumerate(spots(70, 6))] + \
    [p for i, (x, z, r) in enumerate(spots(71, 5)) for p in [tip([x, 0, z], [x + 0.02, 0.6 + 0.3*r, z], 0.025, 0.02, 'reed'), tip([x + 0.06, 0, z + 0.03], [x + 0.1, 0.5, z + 0.04], 0.02, 0.018, 'reedD')]] + \
    [blob(x, z, 0.08, 'FOAM', 6, 90 + i, 0.006) for i, (x, z, r) in enumerate(spots(72, 6))]
WT['frozen'] = W4() + [strip(-1.6, -1.0, 0.2, 0.3, 0.025, 'WATER_L'), strip(0.2, 0.3, 1.5, 0.0, 0.02, 'WATER_L'), strip(0.2, 0.3, 0.6, 1.7, 0.02, 'WATER_L'), strip(-1.2, 1.2, -0.3, 1.8, 0.02, 'WATER_L')] + [blob(x, z, 0.2 + 0.2*r, 'FOAM', 7, 95 + i, 0.005) for i, (x, z, r) in enumerate(spots(73, 4))]
WT['ripple_ring'] = ripple(0, 0, 0.5, 'WATER_L', 0.008, 12, 0.04)
WT['wake'] = [flat([(0, 0.008, 0), (-0.8, 0.008, -2.0), (-0.65, 0.008, -2.0)], 'FOAM', (0, 1, 0)), flat([(0, 0.008, 0), (0.65, 0.008, -2.0), (0.8, 0.008, -2.0)], 'FOAM', (0, 1, 0))]
NOTES['water'] = ('water[kind]: 4 m water tiles at the water level (WATER, WATER_L, FOAM from waterColours[kind]). river, rapids and shallow flow towards +Z: turn the tile with the river '
                  'and scroll the streaks and foam along +Z (about 0.6 m/s for river, 1.8 m/s for rapids), or move the whole tile texture. lake and deep bob their streaks a few centimetres. '
                  'shallow has pebbles under the surface (draw the water slightly see-through). frozen is a lake in winter (walkable). ripple_ring spreads where something falls in (grow 0.2 to 1.5, fade in 1 s); '
                  'wake trails behind a swimmer or a boat.')

# ================= banks (2 m of shore along X; land at -Z, top y = 0; water at +Z, surface y = -0.5) =================
WL = -0.5
PROFILES = {   # (distance into the water side z, height y) from land to water, then colours per band
  'grass':    [(-1.0, 0.0), (-0.3, 0.0), (0.25, -0.25), (0.7, -0.55), (1.0, -0.75)],
  'mud':      [(-1.0, 0.0), (-0.4, -0.05), (0.3, -0.42), (0.9, -0.6), (1.0, -0.75)],
  'sand':     [(-1.0, 0.0), (-0.2, -0.12), (0.5, -0.4), (1.0, -0.7)],
  'rock':     [(-1.0, 0.0), (-0.2, 0.0), (0.0, -0.15), (0.5, -0.5), (1.0, -0.8)],
  'concrete': [(-1.0, 0.0), (0.0, 0.0), (0.0005, -1.4), (1.0, -1.4)],
  'steep':    [(-1.0, 0.0), (-0.05, 0.0), (0.05, -0.6), (0.4, -0.7), (1.0, -0.85)],
  'reeds':    [(-1.0, 0.0), (-0.3, -0.05), (0.4, -0.45), (1.0, -0.7)],
}
BANDS = {   # colour of each face band between profile points
  'grass': ['LAND', 'LAND', 'mud', 'wetMud'], 'mud': ['LAND', 'mud', 'wetMud', 'mudD'], 'sand': ['sand', 'sand', 'sandWet'], 'rock': ['LAND', 'graniteD', 'granite', 'graniteD'],
  'concrete': ['concrete', 'concreteD', 'algae'], 'steep': ['LAND', 'soil', 'mud', 'wetMud'], 'reeds': ['LAND', 'mud', 'wetMud'],
}
def sweep(profile, cols, path):
    """path: list of (x, z, nx, nz) points along the shore with the outward (water) normal; profile is swept across it"""
    o = []
    for (x0, z0, nx0, nz0), (x1, z1, nx1, nz1) in zip(path, path[1:]):
        for k in range(len(profile) - 1):
            (d0, y0), (d1, y1) = profile[k], profile[k + 1]
            pts = [(x0 + nx0*d0, y0, z0 + nz0*d0), (x1 + nx1*d0, y0, z1 + nz1*d0), (x1 + nx1*d1, y1, z1 + nz1*d1), (x0 + nx0*d1, y1, z0 + nz0*d1)]
            u = [pts[1][i] - pts[0][i] for i in range(3)]; v = [pts[3][i] - pts[0][i] for i in range(3)]
            n = [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]]
            if n[1] < 0: n = [-a for a in n]
            o.append(flat(pts, cols[min(k, len(cols) - 1)], tuple(n)))
    return o
def path_straight(): return [(-1.0, 0.0, 0, 1), (1.0, 0.0, 0, 1)]
def path_arc(outer, n=4):
    """a quarter turn about (0, 0) of radius 2 at the shore line; outer: water outside the circle (a point of land), else inside (a bay)"""
    out = []
    for i in range(n + 1):
        a = math.pi*0.5*i/n; x, z = 2*math.cos(a) - 2, 2*math.sin(a) - 0.0
        nx, nz = math.cos(a), math.sin(a)
        if not outer: nx, nz = -nx, -nz
        out.append((x, z, nx, nz))
    return out
def prof_y(kind, d):
    P = PROFILES[kind]
    for (d0, y0), (d1, y1) in zip(P, P[1:]):
        if d0 <= d <= d1: return y0 + (y1 - y0)*(d - d0)/((d1 - d0) or 1)
    return P[-1][1]
def bank_details(kind, path, seed):
    q = random.Random(seed); o = []
    def at(t, d):
        i = min(int(t*(len(path) - 1)), len(path) - 2); f = t*(len(path) - 1) - i; (x0, z0, nx0, nz0), (x1, z1, nx1, nz1) = path[i], path[i + 1]
        x, z, nx, nz = lerp(x0, x1, f), lerp(z0, z1, f), lerp(nx0, nx1, f), lerp(nz0, nz1, f); return x + nx*d, z + nz*d
    if kind in ('grass', 'reeds', 'steep', 'mud'):
        for i in range(10 if kind == 'reeds' else 5):
            t = q.random(); d = q.uniform(0.2, 0.75) if kind == 'reeds' else q.uniform(-0.9, -0.35); x, z = at(t, d)
            y = max(WL - 0.05, prof_y(kind, d)) - 0.02
            hgt = q.uniform(0.7, 1.2) if kind == 'reeds' else q.uniform(0.1, 0.22)
            o.append(tip([x, y, z], [x + 0.03, y + hgt, z], 0.03, 0.012, 'reed' if kind == 'reeds' else 'LAND_D'))
            o.append(tip([x + 0.05, y, z - 0.02], [x + 0.08, y + hgt*0.8, z - 0.03], 0.025, 0.01, 'reedD' if kind == 'reeds' else 'LAND_D'))
            if kind == 'reeds' and i % 3 == 0: o.append(seg([x + 0.03, y + hgt - 0.12, z], [x + 0.03, y + hgt + 0.05, z], 0.018, 0.018, 0.015, 0.015, 'reedTop'))
    if kind == 'steep':
        for i in range(4):
            t = q.random(); x, z = at(t, 0.0)
            o.append(seg([x, -0.15, z], [x + 0.05, -0.45, z + 0.1], 0.012, 0.012, 0.006, 0.006, 'root'))
    if kind == 'rock':
        for i in range(5):
            t = (i + q.random()*0.6)/5; d = q.uniform(-0.05, 0.6); x, z = at(t, d); r = q.uniform(0.15, 0.35)
            o.append(rock_piece('granite', r, x, prof_y('rock', d) - r*0.3, z, q.randint(0, 9999), squash=0.7))
    if kind == 'sand':
        for i in range(4):
            t = q.random(); d = q.uniform(-0.6, 0.3); x, z = at(t, d); o.append(pebble(x, z, 0.03, 'sandD', 0.6, prof_y('sand', d) - 0.01))
        x, z = at(0.4, 0.55); o.append(strip(x - 0.6, z, x + 0.6, z + 0.05, 0.05, 'foam', WL + 0.006))
    if kind == 'concrete':
        if len(path) == 2:
            o.append(box([0, 0.04, -0.15], [2.0, 0.08, 0.3], 'concreteD'))
            o.append(flat([(-0.3, -0.9, 0.001), (0.3, -0.9, 0.001), (0.3, -0.6, 0.001), (-0.3, -0.6, 0.001)], 'grateD', (0, 0, 1)))
    return o
def rock_piece(kind, r, x, y, z, seed, squash=1.0, c=None):
    q = random.Random(seed); pts = []
    for i in range(12):
        u, v = q.uniform(-1, 1), q.uniform(0, 2*math.pi); s = math.sqrt(1 - u*u)
        pts.append((x + r*s*math.cos(v)*q.uniform(0.8, 1.15), y + max(0.0, r*u*squash*q.uniform(0.8, 1.1) + r*0.3), z + r*s*math.sin(v)*q.uniform(0.8, 1.15)))
    return hull_solid(pts, c or kind)
def hull_solid(pts, c, **k):
    A = np.array(pts); h = ConvexHull(A)
    faces = merge_coplanar(A, h)
    used = sorted(set(i for f in faces for i in f)); remap = {u: j for j, u in enumerate(used)}
    return solid([tuple(A[u]) for u in used], [[remap[i] for i in f] for f in faces], c, **k)
def merge_coplanar(A, h):
    """join hull triangles that share a plane into one polygon each (fewer faces, same look)"""
    groups = {}
    for simplex, eq in zip(h.simplices, h.equations):
        key = tuple(np.round(eq, 4)); groups.setdefault(key, []).append(list(simplex))
    faces = []
    for key, tris in groups.items():
        if len(tris) == 1: faces.append(tris[0]); continue
        idx = sorted(set(i for t in tris for i in t)); n = np.array(key[:3]); P = A[idx]; c = P.mean(axis=0)
        u = np.cross(n, [1, 0, 0] if abs(n[0]) < 0.9 else [0, 1, 0]); u /= np.linalg.norm(u); v = np.cross(n, u)
        ang = [math.atan2(np.dot(p - c, v), np.dot(p - c, u)) for p in P]
        faces.append([idx[j] for j in np.argsort(ang)])
    return faces
BK = {}
for kind in PROFILES:
    pr, cols = PROFILES[kind], BANDS[kind]
    BK[kind] = {'straight': sweep(pr, cols, path_straight()) + bank_details(kind, path_straight(), 100 + len(kind)),
                'corner_out': sweep(pr, cols, path_arc(True)) + bank_details(kind, path_arc(True), 200 + len(kind)),
                'corner_in': sweep([(d*0.999, y) for d, y in pr], cols, path_arc(False)) + bank_details(kind, path_arc(False), 300 + len(kind))}
NOTES['banks'] = ('banks[kind][straight|corner_out|corner_in]: 2 m of shore. Land at -Z with its top at y = 0, the water surface at y = -0.5 (draw a water tile there), '
                  'the bank sloping down from z = -1 to the bed at z = +1. corner_out turns a quarter around a point of land, corner_in around a bay (both radius 2 m about x = -2, z = 0, '
                  'so they join a straight piece at x = 0). Kinds: grass, mud, sand (a beach), rock (boulders), concrete (an urban channel wall 1.4 m deep with a drain), '
                  'steep (an eroded cut with roots), reeds. LAND and LAND_D take the area ground colour (ground.seasons).')

# ================= waterfalls =================
FL = {}
FW = 2.0   # half width
def sheet(h, seed):
    q = random.Random(seed); o = [flat([(-FW, 0, 0), (FW, 0, 0), (FW, -h, 0.05), (-FW, -h, 0.05)], 'WATER', (0, 0.05, 1))]
    for i in range(14):
        x = q.uniform(-FW + 0.1, FW - 0.1); y0 = -q.uniform(0, h*0.4); L = h*q.uniform(0.4, 0.8); w = q.uniform(0.04, 0.12)
        o.append(flat([(x - w, y0, 0.01), (x + w, y0, 0.01), (x + w*0.6, y0 - L, 0.06), (x - w*0.6, y0 - L, 0.06)], 'FOAM' if i % 3 == 0 else 'WATER_L', (0, 0.05, 1)))
    return o
FL['lip'] = [flat([(-FW, 0, -1.5), (FW, 0, -1.5), (FW, 0, 0), (-FW, 0, 0)], 'WATER', (0, 1, 0))] + \
    [flat([(x - 0.05, 0.006, -1.4), (x + 0.05, 0.006, -1.4), (x + 0.03, 0.006, -0.05), (x - 0.03, 0.006, -0.05)], 'WATER_L', (0, 1, 0)) for x in (-1.5, -0.7, 0.2, 1.1, 1.7)] + \
    [hull([(-FW - 0.3, -0.6, -1.6), (FW + 0.3, -0.6, -1.6), (FW + 0.3, -0.6, 0.05), (-FW - 0.3, -0.6, 0.05), (-FW - 0.3, -0.03, -1.6), (FW + 0.3, -0.03, -1.6), (FW + 0.2, -0.05, -0.02), (-FW - 0.2, -0.05, -0.02)], 'granite')] + \
    [rock_piece('granite', 0.35, sx*(FW + 0.25), -0.1, -0.5, 400 + i, 0.8) for i, sx in enumerate((1, -1))] + [flat([(-FW, 0.007, -0.15), (FW, 0.007, -0.15), (FW, 0.007, -0.02), (-FW, 0.007, -0.02)], 'FOAM', (0, 1, 0))] + sheet(0.4, 111)
FL['sheet_1m'] = sheet(1.0, 112)
FL['sheet_1m_b'] = sheet(1.0, 113)
FL['pool'] = [flat([(math.cos(a)*2.6, 0.006, math.sin(a)*2.0 + 0.6) for a in [k*0.5236 for k in range(12)]], 'WATER_L', (0, 1, 0))] + \
    [blob(x, z, 0.35 + 0.25*q, 'FOAM', 7, 120 + i, 0.009, 1.4, 0.8) for i, (x, z, q) in enumerate([(-1.4, 0.2, 0.3), (-0.3, 0.1, 0.9), (0.9, 0.25, 0.5), (1.6, 0.15, 0.2), (0.2, 0.9, 0.1)])] + \
    ripple(0, 1.2, 1.6, 'FOAM', 0.008, 14, 0.06) + [rock_piece('granite', r, x, -0.35, z, 130 + i, 0.8) for i, (x, z, r) in enumerate(((-2.4, -0.2, 0.5), (2.5, 0.2, 0.6), (-1.8, 1.9, 0.3), (2.0, 1.6, 0.35)))]
FL['mist'] = [loft([[x, y - s*0.8, z, 0, 0], [x, y - s*0.2, z, s*0.8, s*0.7], [x, y + s*0.3, z, s*0.7, s*0.6], [x, y + s*0.9, z, 0, 0]], 'mist', n=6) for x, y, z, s in ((-1.2, 0.5, 0.4, 0.6), (0.2, 0.7, 0.3, 0.8), (1.3, 0.45, 0.45, 0.55), (-0.4, 1.2, 0.6, 0.5), (0.9, 1.1, 0.6, 0.45))]
FL['spray'] = [tip([x, 0, 0.1], [x + 0.1*math.sin(i), 0.5 + 0.2*(i % 2), 0.4], 0.02, 0.02, 'spray') for i, x in enumerate((-1.5, -0.8, -0.1, 0.6, 1.3, 1.8))]
FL['cascade_step'] = [hull([(-FW, -0.6, -0.8), (FW, -0.6, -0.8), (FW, -0.6, 0.0), (-FW, -0.6, 0.0), (-FW, 0.0, -0.8), (FW, 0.0, -0.8), (FW + 0.0, 0.0, 0.0), (-FW, 0.0, 0.0)], 'granite')] + \
    [flat([(-FW, 0.01, -0.8), (FW, 0.01, -0.8), (FW, 0.01, 0.0), (-FW, 0.01, 0.0)], 'WATER', (0, 1, 0))] + [dict(q, p=[q['p'][0], q['p'][1] + 0.01, q['p'][2]]) for q in sheet(0.6, 114)] + \
    [blob(x, 0.6, 0.25, 'FOAM', 7, 140 + i, -0.58, 1.3, 0.8) for i, x in enumerate((-1.3, 0.0, 1.2))]
FL['weir'] = [hull([(-3, -1.2, -0.6), (3, -1.2, -0.6), (3, -1.2, 1.4), (-3, -1.2, 1.4), (-3, 0.0, -0.6), (3, 0.0, -0.6), (3, -0.9, 1.4), (-3, -0.9, 1.4)], 'concrete')] + \
    [flat([(-3, 0.012, -0.6), (3, 0.012, -0.6), (3, -0.888, 1.4), (-3, -0.888, 1.4)], 'WATER', (0, 0.9, 0.45))] + \
    [flat([(x - 0.05, 0.015, -0.4), (x + 0.05, 0.015, -0.4), (x + 0.04, -0.87, 1.3), (x - 0.04, -0.87, 1.3)], 'WATER_L', (0, 0.9, 0.45)) for x in (-2.4, -1.4, -0.4, 0.6, 1.6, 2.5)] + \
    [blob(x, 1.6, 0.35, 'FOAM', 7, 150 + i, -0.87, 1.6, 0.8) for i, x in enumerate((-2.2, -0.8, 0.6, 2.0))] + [box([sx*3.2, -0.3, 0.4], [0.4, 1.8, 2.2], 'concreteD') for sx in (1, -1)]
NOTES['falls'] = ('falls: a waterfall is lip (the river surface at y = 0 ends at z = 0 and goes over), then sheet_1m pieces stacked down (alternate sheet_1m and sheet_1m_b, each from y = 0 down to y = -1), '
                  'then pool at the bottom with mist and spray. All are 4 m wide (x -2..2); scale X for wider falls. Scroll the sheet streaks down (2 to 4 m/s), fade mist and spray in and out. '
                  'cascade_step is a 0.6 m step for a lively stream; weir is a 6 m concrete weir across a river (upstream at -Z, 1.2 m drop).')

# ================= rocks =================
RK = {}
SIZES = {'small': 0.22, 'medium': 0.65, 'large': 1.6}
def boulder(kind, s, seed, squash=0.8):
    q = random.Random(seed); pts = []
    for i in range(14):
        u, v = q.uniform(-0.6, 1), q.uniform(0, 2*math.pi); r = math.sqrt(max(0.0, 1 - u*u))
        pts.append((s*r*math.cos(v)*q.uniform(0.85, 1.15), max(0.0, s*(u + 0.55)*squash*q.uniform(0.85, 1.1)), s*r*math.sin(v)*q.uniform(0.8, 1.2)))
    return pts
def granite(s, seed):
    o = [hull_solid(boulder('granite', s, seed), 'granite')]
    if s > 0.5: o.append(hull_solid([(x*0.6 + s*0.5, y*0.6, z*0.6 - s*0.3) for x, y, z in boulder('granite', s, seed + 7, 0.7)], 'graniteD'))
    return o
def sandstone(s, seed):
    q = random.Random(seed); o = []; y = 0.0
    for i in range(3 if s < 0.4 else 4):
        hgt = s*q.uniform(0.25, 0.4); w = s*(1.1 - i*0.18)*q.uniform(0.9, 1.1); d = s*(0.9 - i*0.12)*q.uniform(0.9, 1.1); ox, oz = q.uniform(-0.12, 0.12)*s, q.uniform(-0.12, 0.12)*s
        sh = [(ox + w*math.cos(a)*q.uniform(0.8, 1.05), oz + d*math.sin(a)*q.uniform(0.8, 1.05)) for a in [k*1.0472 + q.uniform(-0.2, 0.2) for k in range(6)]]
        o.append(hull([(x, y, z) for x, z in sh] + [(ox + (x - ox)*0.93, y + hgt, oz + (z - oz)*0.93) for x, z in sh], ['sandstone', 'sandstoneD', 'sandstoneL'][i % 3])); y += hgt
    return o
def basalt(s, seed):
    q = random.Random(seed); o = []; n = 5 if s < 0.4 else 9
    cells = [(0, 0)] + [(math.cos(a)*s*0.55, math.sin(a)*s*0.55) for a in [k*1.0472 for k in range(6)]] + [(s*1.0, s*0.2), (-s*0.9, s*0.5)]
    for i, (cx, cz) in enumerate(cells[:n]):
        r = s*0.3; h = s*q.uniform(0.5, 1.6) if i else s*1.8
        sh = [(cx + r*math.cos(a), cz + r*math.sin(a)) for a in [k*1.0472 + 0.5236 for k in range(6)]]
        top = h*q.uniform(0.92, 1.0)
        o.append(hull([(x, 0, z) for x, z in sh] + [(x, h if j % 2 else top, z) for j, (x, z) in enumerate(sh)], ['basalt', 'basaltD', 'basaltL'][i % 3]))
    return o
def limestone(s, seed):
    q = random.Random(seed); pts = [(sx*s*q.uniform(0.7, 1.0), y, sz*s*0.75*q.uniform(0.7, 1.0)) for sx in (-1, 1) for sz in (-1, 1) for y in (0, s*0.9*q.uniform(0.85, 1.1))]
    pts += [(0, s*1.05, 0), (s*0.9, s*0.5, 0), (-s*0.4, s*0.6, s*0.8)]
    o = [hull_solid(pts, 'limestone')]
    return o
def slate(s, seed):
    q = random.Random(seed); o = []
    for i in range(4 if s < 0.4 else 6):
        x0, z0 = q.uniform(-0.6, 0.6)*s, q.uniform(-0.4, 0.4)*s; w, t, h = s*q.uniform(0.4, 0.8), s*0.07, s*q.uniform(0.6, 1.4); lean = q.uniform(-0.4, 0.4)*s
        o.append(hull([(x0 - w/2, 0, z0 - t), (x0 + w/2, 0, z0 - t), (x0 + w/2, 0, z0 + t), (x0 - w/2, 0, z0 + t),
                       (x0 - w*0.3 + lean, h, z0 - t + lean*0.5), (x0 + w*0.15 + lean, h*0.9, z0 - t + lean*0.5), (x0 + w*0.15 + lean, h*0.9, z0 + t + lean*0.5), (x0 - w*0.3 + lean, h, z0 + t + lean*0.5)], 'slate' if i % 2 else 'slateD'))
    return o
def river_stones(s, seed):
    q = random.Random(seed); o = []
    for i in range(6):
        r = s*q.uniform(0.18, 0.4); x, z = q.uniform(-1, 1)*s*0.8, q.uniform(-1, 1)*s*0.8
        o.append(pebble(x, z, r, ['riverStone', 'riverStoneD', 'riverStoneL'][i % 3], 0.45))
    return o
def scree(s, seed):
    q = random.Random(seed); o = [hull_solid([(math.cos(a)*s*1.1*q.uniform(0.8, 1.1), 0, math.sin(a)*s*0.9*q.uniform(0.8, 1.1)) for a in [k*0.785 for k in range(8)]] + [(0, s*0.45, -s*0.2), (s*0.3, s*0.3, s*0.2)], 'graniteD')]
    for i in range(10):
        a = q.uniform(0, 6.28); r = q.uniform(0.2, 1.0)*s; x, z = math.cos(a)*r, math.sin(a)*r*0.9; y = max(0.0, s*0.45*(1 - r/s) - 0.02)
        c = s*q.uniform(0.06, 0.14)
        o.append(hull_solid([(x + q.uniform(-c, c), y + q.uniform(0, c), z + q.uniform(-c, c)) for _ in range(7)], 'granite' if i % 2 else 'graniteL'))
    return o
def mossy(s, seed):
    o = [hull_solid(boulder('granite', s, seed, 0.7), 'graniteD')]
    pts = [p for p in boulder('granite', s*1.005, seed, 0.7)]
    top = [(x*1.01, y + 0.01, z*1.01) for x, y, z in pts if y > s*0.45]
    if len(top) >= 4:
        try: o.append(hull_solid(top + [(x*0.7, s*0.35, z*0.7) for x, y, z in top], 'moss'))
        except Exception: pass
    return o
KINDS = {'granite': granite, 'sandstone': sandstone, 'basalt': basalt, 'limestone': limestone, 'slate': slate, 'river_stones': river_stones, 'scree': scree, 'mossy': mossy}
for kname, fn in KINDS.items():
    RK[kname] = {sz: fn(s, 500 + i*17 + len(kname)) for i, (sz, s) in enumerate(SIZES.items())}
def cliff(seed, kind='granite'):
    q = random.Random(seed); o = []
    cols = {'granite': ['granite', 'graniteD', 'graniteL'], 'sandstone': ['sandstone', 'sandstoneD', 'sandstoneL'], 'basalt': ['basalt', 'basaltD', 'basaltL']}[kind]
    rows = 4 if kind != 'sandstone' else 6
    for r in range(rows):
        y0, y1 = 4.0*r/rows, 4.0*(r + 1)/rows
        n = 3 if kind != 'basalt' else 6
        for c in range(n):
            x0, x1 = -2 + 4.0*c/n, -2 + 4.0*(c + 1)/n; d0, d1 = q.uniform(-0.25, 0.1), q.uniform(-0.25, 0.1)
            if kind == 'sandstone': x0, x1 = -2, 2
            o.append(hull([(x0, y0, -0.6), (x1, y0, -0.6), (x1, y0, d0 + 0.0), (x0, y0, d0), (x0 + 0.02, y1, -0.6), (x1 - 0.02, y1, -0.6), (x1 - 0.02, y1, d1), (x0 + 0.02, y1, d1)], cols[(r + c) % 3]))
            if kind == 'sandstone': break
    if kind == 'granite': o += [flat([(x, y, 0.15), (x + 0.04, y, 0.15), (x + 0.1, y - 0.8, 0.15), (x + 0.06, y - 0.8, 0.15)], 'graniteD') for x, y in ((-0.8, 3.4), (0.9, 2.2))]
    return o
RK['cliff_granite'] = cliff(600); RK['cliff_sandstone'] = cliff(601, 'sandstone'); RK['cliff_basalt'] = cliff(602, 'basalt')
RK['cliff_top'] = [hull([(-2, 0, -0.6), (2, 0, -0.6), (2, 0, 0.1), (-2, 0, 0.1), (-2, 0.25, -0.7), (2, 0.2, -0.7), (1.9, 0.12, 0.05), (-1.9, 0.15, 0.05)], 'graniteD'),
                   flat([(-2, 0.26, -0.7), (2, 0.21, -0.7), (1.9, 0.13, -0.1), (-1.9, 0.16, -0.1)], 'LAND', (0, 1, 0))] + [tip([x, 0.2, -0.3], [x + 0.03, 0.42, -0.3], 0.04, 0.015, 'LAND_D') for x in (-1.5, -0.4, 0.8, 1.6)]
def ore(kind, col, seed, s=0.6):
    o = [hull_solid(boulder('granite', s, seed, 0.8), 'graniteD')]
    q = random.Random(seed + 3)
    for i in range(5):
        x, z = q.uniform(-0.6, 0.6)*s, q.uniform(-0.2, 0.6)*s; y = q.uniform(0.25, 0.7)*s; c = s*q.uniform(0.12, 0.2)
        if kind == 'quartz':
            o.append(tip([x, y, z + s*0.55], [x + q.uniform(-0.1, 0.1), y + c*2.5, z + s*0.75], c*0.5, c*0.5, col, n=6))
        else:
            o.append(hull_solid([(x + q.uniform(-c, c), y + q.uniform(-c, c), s*0.62 + q.uniform(0, c*0.8) + z*0.1) for _ in range(7)], col))
    return o
RK['ore_iron'] = ore('iron', 'ironOre', 700); RK['ore_copper'] = ore('copper', 'copperOre', 701); RK['ore_coal'] = ore('coal', 'coal', 702); RK['ore_quartz'] = ore('quartz', 'quartz', 703); RK['ore_gold'] = ore('gold', 'gold', 704, 0.45)
QF = random.Random(710)
RK['flint_nodules'] = [hull_solid([(x + QF.uniform(-0.06, 0.06), QF.uniform(0, 0.07), z + QF.uniform(-0.06, 0.06)) for _ in range(7)], 'flint') for x, z in ((0, 0), (0.15, 0.08), (-0.1, 0.12))]
RK['stepping_stones'] = [hull_solid([(x + 0.25*math.cos(a), -0.4 if k < 6 else 0.05, z + 0.22*math.sin(a)) for k, a in enumerate([j*1.0472 for j in range(6)] * 2)], 'riverStone') for x, z in ((0, -1.2), (0.3, -0.4), (-0.1, 0.4), (0.25, 1.2))]
HARVEST = {'stone': 'every rock (pick or sledge): granite, limestone, scree, river stones', 'flint': 'flint_nodules, sometimes from limestone (sharp, for fire and tools)',
           'iron_ore': 'ore_iron', 'copper_ore': 'ore_copper', 'coal': 'ore_coal (fuel)', 'quartz': 'ore_quartz', 'gold_nugget': 'ore_gold (rare, for trade)', 'slate_tile': 'slate (roofing, a flat stone)', 'sand': 'sand banks and beaches', 'clay': 'mud banks'}
NOTES['rocks'] = ('rocks[kind][small|medium|large] for granite, sandstone (layered), basalt (columns), limestone (pale blocks), slate (thin leaning shards), river_stones (a cluster), scree (a pile), mossy '
                  '(a boulder with moss on top). Origin at the centre of the base; turn each by a random angle. cliff_granite, cliff_sandstone and cliff_basalt are 4 m wide, 4 m high and 0.6 m deep '
                  '(face at +Z), stack them; cliff_top caps a cliff with turf (LAND). ore_iron, ore_copper, ore_coal, ore_quartz and ore_gold show their mineral on the +Z side, flint_nodules lie loose. '
                  'stepping_stones cross a 0.5 m deep stream along Z. harvest says what each gives.')
# harvest items from rocks, on the ground
IT = {}
def lumpy(c, s, seed):
    q = random.Random(seed); return hull_solid([(q.uniform(-s, s), q.uniform(0, s*1.2), q.uniform(-s, s)) for i in range(8)], c)
IT['iron_ore'] = [lumpy('ironOre', 0.07, 800)]; IT['copper_ore'] = [lumpy('copperOre', 0.07, 801)]; IT['coal'] = [lumpy('coal', 0.06, 802), lumpy('coal', 0.04, 803)]
IT['quartz'] = [tip([0, 0, 0], [0.01, 0.14, 0.0], 0.025, 0.025, 'quartz', n=6), tip([0.04, 0, 0.02], [0.07, 0.1, 0.03], 0.02, 0.02, 'quartz', n=6)]
IT['gold_nugget'] = [lumpy('gold', 0.025, 804)]; IT['flint'] = [lumpy('flint', 0.05, 805)]; IT['slate_tile'] = [box([0, 0.008, 0], [0.3, 0.016, 0.2], 'slate')]
IT['sand_bag'] = [hull([(-0.15, 0, -0.1), (0.15, 0, -0.1), (0.15, 0, 0.1), (-0.15, 0, 0.1), (-0.12, 0.12, -0.07), (0.12, 0.13, -0.07), (0.12, 0.12, 0.07), (-0.12, 0.11, 0.07)], 'sandD')]
IT['clay_lump'] = [lumpy('mud', 0.07, 806)]

pack = {'name': 'world', 'version': 1, 'units': 'metres', 'palette': PALETTE, 'darker': 0.78, 'about': __doc__.split('\n', 2)[2], 'flatModels': True,
        'surfaceColours': SURFACE, 'sidewalkColours': SIDEWALK, 'waterColours': WATER, 'harvest': HARVEST, 'notes': NOTES,
        'models': {'roads': RD, 'markings': MK, 'kerbs': KB, 'sidewalks': SW, 'water': WT, 'banks': BK, 'falls': FL, 'rocks': RK, 'items': IT}}
if __name__ == '__main__':
    import os
    out, st = write_pack('world', pack, __file__)
    print(os.path.getsize(out)//1024, 'KB')
    groups = {}
    for k, v in st.items(): g = k.split('.')[0]; groups.setdefault(g, []).append(v[0])
    for g, v in groups.items(): print(g, len(v), 'models, triangles', min(v), '-', max(v))
