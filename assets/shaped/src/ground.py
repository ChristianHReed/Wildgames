#!/usr/bin/env python3
"""Afterstreet ground pack, version 1 (19 October 2026), for roadmap step Art 4. Writes assets/shaped/ground.js.
Run: python3 assets/shaped/src/ground.py

Each material is a 2 m by 2 m tile: a flat base square in colour slot BASE and a few small shapes on top in DETAIL and DETAIL2
(tufts, pebbles, leaves, slab joints, road paint). Nothing crosses the tile's edge, so tiles repeat without seams.
How to use it: paint the smooth ground in BASE (the terrain already has a colour per area), then scatter the tile's small
shapes over each 2 m cell near the player, turned by a random quarter turn so the repeat does not show. seasons[material]
gives BASE, DETAIL and DETAIL2 for spring, summer, autumn and winter (snow lies on level ground in winter).
Decals (puddle, ice, crack, pothole, skid_marks) sit 1 cm above whatever they are on. The kerb is a real 15 cm kerb, 2 m long."""
import math, random
from kit import *

PALETTE = {'paint': '#e8e4d8', 'paintY': '#e0b83a', 'water': '#5a7080', 'waterL': '#8aa4b4', 'ice': '#c8dce6', 'iceL': '#e8f2f6', 'crack': '#2a2a2c', 'hole': '#1e1e20', 'holeRim': '#4a4846',
           'kerb': '#a8a296', 'kerbD': '#8a857a', 'gutter': '#5a5852'}
SEASONS = {
  'road':        {s: {'BASE': '#3a3a3c', 'DETAIL': '#454547', 'DETAIL2': '#2e2e30'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'road_centre': {s: {'BASE': '#3a3a3c', 'DETAIL': '#454547', 'DETAIL2': '#2e2e30'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'sidewalk':    {s: {'BASE': '#9a948a', 'DETAIL': '#86807a', 'DETAIL2': '#5e7a3e'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'grass':       {'spring': {'BASE': '#6d8a4a', 'DETAIL': '#7e9c52', 'DETAIL2': '#c8b84a'}, 'summer': {'BASE': '#6d7a4f', 'DETAIL': '#7a8a52', 'DETAIL2': '#a8a050'},
                  'autumn': {'BASE': '#7a7a4a', 'DETAIL': '#8a8250', 'DETAIL2': '#b8742a'}, 'winter': {'BASE': '#6a6e5a', 'DETAIL': '#7a7c66', 'DETAIL2': '#e8ecee'}},
  'dry_grass':   {'spring': {'BASE': '#8a8a5a', 'DETAIL': '#a89a62', 'DETAIL2': '#7a8a4a'}, 'summer': {'BASE': '#a8985e', 'DETAIL': '#c0ac6a', 'DETAIL2': '#8a7a4a'},
                  'autumn': {'BASE': '#9a8656', 'DETAIL': '#b09662', 'DETAIL2': '#8a5a2a'}, 'winter': {'BASE': '#8a8470', 'DETAIL': '#a09a84', 'DETAIL2': '#e8ecee'}},
  'dirt':        {s: {'BASE': '#7a6248', 'DETAIL': '#8a7258', 'DETAIL2': '#5a4a38'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'gravel':      {s: {'BASE': '#8a8478', 'DETAIL': '#a29c90', 'DETAIL2': '#6a665e'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'mud':         {s: {'BASE': '#4a3a2c', 'DETAIL': '#5a4836', 'DETAIL2': '#5a7080'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'sand':        {s: {'BASE': '#c8b48a', 'DETAIL': '#d8c49a', 'DETAIL2': '#a8946a'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'water_edge':  {s: {'BASE': '#6a6250', 'DETAIL': '#7a8a5a', 'DETAIL2': '#5a7080'} for s in ('spring', 'summer', 'autumn', 'winter')},
  'leaf_litter': {'autumn': {'BASE': '#6a5a3a', 'DETAIL': '#c8642a', 'DETAIL2': '#d89a2a'}, 'winter': {'BASE': '#5a4e3a', 'DETAIL': '#7a5a3a', 'DETAIL2': '#8a6a4a'},
                  'spring': {'BASE': '#5a5a3a', 'DETAIL': '#7a6a4a', 'DETAIL2': '#6d8a4a'}, 'summer': {'BASE': '#5e5a3c', 'DETAIL': '#7a6a4a', 'DETAIL2': '#6d7a4f'}},
  'snow':        {s: {'BASE': '#e8ecee', 'DETAIL': '#d4dce2', 'DETAIL2': '#f6f8fa'} for s in ('spring', 'summer', 'autumn', 'winter')},
}
H = 1.0   # half the tile
def base(): return [flat([(-H, 0, -H), (H, 0, -H), (H, 0, H), (-H, 0, H)], 'BASE', (0, 1, 0))]
def spots(seed, n, margin=0.15):
    R = random.Random(seed); return [(R.uniform(-H + margin, H - margin), R.uniform(-H + margin, H - margin), R.random()) for _ in range(n)]
def tuft(x, z, h, c, k=0):
    return [tip([x, 0, z], [x + 0.04*math.cos(k), h, z + 0.04*math.sin(k)], 0.03, 0.012, c), tip([x + 0.03, 0, z - 0.02], [x + 0.08, h*0.75, z - 0.03], 0.025, 0.01, c)]
def pebble(x, z, r, c):
    return hull([(x - r, 0, z - r*0.8), (x + r, 0, z - r*0.7), (x + r*0.9, 0, z + r*0.8), (x - r*0.8, 0, z + r*0.9), (x - r*0.5, r*0.6, z - r*0.4), (x + r*0.5, r*0.7, z - r*0.3), (x + r*0.4, r*0.5, z + r*0.4), (x - r*0.4, r*0.6, z + r*0.3)], c)
def blob(x, z, r, c, n=7, seed=0, y=0.004):
    R = random.Random(seed); return flat([(x + math.cos(a)*r*R.uniform(0.6, 1.2), y, z + math.sin(a)*r*R.uniform(0.6, 1.2)) for a in [i*2*math.pi/n for i in range(n)]], c, (0, 1, 0))
def leaf(x, z, r, c, a):
    return flat([(x + math.cos(a)*r, 0.006, z + math.sin(a)*r), (x + math.cos(a + 2.2)*r*0.5, 0.006, z + math.sin(a + 2.2)*r*0.5), (x - math.cos(a)*r*0.6, 0.006, z - math.sin(a)*r*0.6), (x + math.cos(a - 2.2)*r*0.5, 0.006, z + math.sin(a - 2.2)*r*0.5)], c, (0, 1, 0))
def strip(x0, z0, x1, z1, w, c, y=0.005):
    dx, dz = x1 - x0, z1 - z0; l = math.hypot(dx, dz); nx, nz = -dz/l*w/2, dx/l*w/2
    return flat([(x0 + nx, y, z0 + nz), (x1 + nx, y, z1 + nz), (x1 - nx, y, z1 - nz), (x0 - nx, y, z0 - nz)], c, (0, 1, 0))
T = {}
T['road'] = base() + [blob(x, z, 0.08 + 0.05*r, 'DETAIL', 6, i) for i, (x, z, r) in enumerate(spots(1, 5))] + [blob(x, z, 0.05, 'DETAIL2', 5, 10 + i) for i, (x, z, r) in enumerate(spots(2, 3))]
T['road_centre'] = T['road'] + [strip(0, -0.75, 0, 0.75, 0.12, 'paintY', 0.006)]
T['sidewalk'] = base() + [strip(-H + 0.01, 0, H - 0.01, 0, 0.02, 'DETAIL'), strip(0, -H + 0.01, 0, H - 0.01, 0.02, 'DETAIL')] + tuft(0.0, 0.0, 0.08, 'DETAIL2') + [blob(0.5, -0.4, 0.06, 'DETAIL', 5, 3)]
T['grass'] = base() + [p for i, (x, z, r) in enumerate(spots(3, 9)) for p in tuft(x, z, 0.12 + 0.1*r, 'DETAIL', i)] + [b for (x, z, r) in spots(4, 3) for b in [box([x, 0.03, z], [0.04, 0.06, 0.04], 'DETAIL2')]]
T['dry_grass'] = base() + [p for i, (x, z, r) in enumerate(spots(5, 7)) for p in tuft(x, z, 0.15 + 0.1*r, 'DETAIL' if i % 3 else 'DETAIL2', i)]
T['dirt'] = base() + [blob(x, z, 0.12 + 0.1*r, 'DETAIL', 7, i) for i, (x, z, r) in enumerate(spots(6, 4))] + [pebble(x, z, 0.03, 'DETAIL2') for (x, z, r) in spots(7, 4)]
T['gravel'] = base() + [pebble(x, z, 0.025 + 0.02*r, 'DETAIL' if i % 2 else 'DETAIL2') for i, (x, z, r) in enumerate(spots(8, 14))]
T['mud'] = base() + [blob(x, z, 0.2 + 0.1*r, 'DETAIL', 7, 20 + i) for i, (x, z, r) in enumerate(spots(9, 3))] + [blob(0.3, 0.2, 0.18, 'DETAIL2', 8, 30, 0.006)]
T['sand'] = base() + [strip(-H + 0.1, z, H - 0.1, z + 0.08, 0.04, 'DETAIL') for z in (-0.6, -0.1, 0.4)] + [pebble(x, z, 0.02, 'DETAIL2') for (x, z, r) in spots(10, 3)]
T['water_edge'] = base() + [blob(0.4, 0.3, 0.45, 'DETAIL2', 9, 40, 0.006)] + [p for i, (x, z, r) in enumerate(spots(11, 4)) if x < 0 for p in tuft(x, z, 0.3, 'DETAIL', i)] + [pebble(-0.1, 0.5, 0.05, 'BASE_D')]
T['leaf_litter'] = base() + [leaf(x, z, 0.06 + 0.03*r, 'DETAIL' if i % 2 else 'DETAIL2', r*6) for i, (x, z, r) in enumerate(spots(12, 16))]
T['snow'] = base() + [blob(x, z, 0.25 + 0.15*r, 'DETAIL', 8, 50 + i) for i, (x, z, r) in enumerate(spots(13, 4))] + [hull([(-0.3, 0, -0.2), (0.3, 0, -0.2), (0.3, 0, 0.2), (-0.3, 0, 0.2), (-0.2, 0.06, -0.1), (0.2, 0.07, -0.1), (0.2, 0.05, 0.1), (-0.2, 0.06, 0.1)], 'DETAIL2')]
D = {}
D['puddle'] = [blob(0, 0, 0.6, 'water', 9, 60, 0.01), blob(0.1, -0.05, 0.3, 'waterL', 7, 61, 0.011)]
D['ice'] = [blob(0, 0, 0.7, 'ice', 9, 62, 0.01), strip(-0.3, -0.2, 0.25, 0.3, 0.02, 'iceL', 0.011), strip(0.1, -0.4, 0.4, 0.0, 0.015, 'iceL', 0.011)]
D['crack'] = [strip(-0.8, 0.0, -0.3, 0.15, 0.025, 'crack', 0.01), strip(-0.3, 0.15, 0.1, -0.05, 0.02, 'crack', 0.01), strip(0.1, -0.05, 0.7, 0.2, 0.015, 'crack', 0.01), strip(-0.3, 0.15, -0.2, 0.5, 0.012, 'crack', 0.01)]
D['pothole'] = [blob(0, 0, 0.45, 'holeRim', 9, 63, 0.01), blob(0, 0, 0.36, 'hole', 9, 64, 0.011)] + [pebble(x, z, 0.03, 'holeRim') for x, z in ((0.5, 0.1), (-0.45, -0.25))]
def skid(x0, z0, x1, z1, w, c, y):
    return flat([(x0 - w, y, z0), (x0 + w, y, z0), (x1 + w, y, z1), (x1 - w, y, z1)], c, (0, 1, 0))
D['skid_marks'] = [skid(sx*0.75, -2.0, sx*0.75 + 0.12*(1 + sx*0.3), 2.0, 0.1, 'hole', 0.01) for sx in (1, -1)] + [skid(sx*0.75 + 0.12*(1 + sx*0.3), 2.0, sx*0.78 + 0.35, 3.0, 0.08, 'holeRim', 0.0105) for sx in (1, -1)]
KERB = [hull([(-H, 0, -0.08), (H, 0, -0.08), (H, 0, 0.08), (-H, 0, 0.08), (-H, 0.15, -0.08), (H, 0.15, -0.08), (H, 0.15, 0.05), (-H, 0.15, 0.05)], 'kerb'),
        flat([(-H, 0.0005, 0.08), (H, 0.0005, 0.08), (H, 0.0005, 0.35), (-H, 0.0005, 0.35)], 'gutter', (0, 1, 0)), flat([(-0.005, 0.0, 0.081), (0.005, 0.0, 0.081), (0.005, 0.15, 0.051), (-0.005, 0.15, 0.051)], 'kerbD')]
pack = {'name': 'ground', 'version': 1, 'style': 'flat colour with small shapes; seasons by palette', 'units': 'metres', 'tile': 2.0, 'palette': PALETTE, 'seasons': SEASONS, 'darker': 0.78,
        'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': {'tiles': T, 'decals': D, 'kerb': {'kerb_strip': KERB}},
        'kerbRule': 'kerb_strip: the road side is +Z (the gutter strip lies on the road), the pavement side -Z; tops at 15 cm.'}
out, st = write_pack('ground', pack, __file__)
for k, v in st.items(): print(k, v)
