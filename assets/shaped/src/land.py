#!/usr/bin/env python3
"""Afterstreet landscape pack, version 1 (26 October 2026): what makes the map's ground feel like Ozark country and not a flat sheet: road cuts and embankments,
limestone ledges, bluffs and glades, karst (sinkholes, caves, springs, dry hollows), and the small features of a creek (riffles, pools, gravel bars, undercut banks,
logjams, beaver works) with the loose ground clutter of woods. Writes assets/shaped/land.js. Run: python3 assets/shaped/src/land.py

Reading the pack (docs/LANDSCAPE.md has the reasons and the placement recipes):
  * Pieces are modular. Anything that follows a road, creek or bluff is 4 m long along z and centred, and says which way it faces.
  * Road-side pieces (cut_*, fill_*, rip_rap, ditch): the toe (the foot of the slope, next to the road shoulder or ditch) is at x = 0 and the ground rises toward +x;
    z is along the road. Mirror with scale.x = -1 for the other side of the road. Heights are in the name (h4 = 4 m); scale y to the real height, x with it.
  * Bluff and creek pieces: the water or the open side is toward -x, the rock or the bank toward +x.
  * Stand-alone things (sinkholes, caves, springs, boulders, logjams) are centred on their middle and sit on y = 0; sinkholes and springs sink BELOW y = 0 (see h in info).
  * Flat ground patches (`patch_*`) are decals: thin, lie on y = 0.02 and are for placing under or between things.
Colour names are in the palette. Rock is limestone and dolomite grey to cream with darker bands, which is what Springfield's hills and bluffs are made of."""
import math, random
from kit import *
P = {'lime': '#bab4a2', 'limeD': '#9a9484', 'limeL': '#d0cab8', 'dolo': '#a9a190', 'dark': '#16171a', 'chert': '#8a6e54', 'chertL': '#b89a78', 'clay': '#8a4a32', 'earth': '#6e5a42', 'earthD': '#524332', 'earthL': '#8a7458',
     'grass': '#6d7a4f', 'grassD': '#58663f', 'grassL': '#8a9a58', 'dry': '#a39a62', 'moss': '#5a7a3a', 'mossD': '#44602c', 'lichen': '#aab592', 'lichenO': '#c8a860', 'root': '#5a4030', 'bark': '#5a4636', 'barkD': '#3e3026', 'log': '#6e5238', 'logEnd': '#b89868',
     'gravel': '#a09888', 'gravelD': '#807868', 'gravelW': '#bcb4a0', 'sand': '#cdb98a', 'sandD': '#b09c70', 'mud': '#4e4034', 'water': '#4a7a90', 'waterL': '#78aab8', 'waterD': '#35606f', 'spring': '#4a9aa8', 'springD': '#2f7a8c', 'foam': '#e4eef0',
     'steel': '#6a7078', 'steelD': '#4a4e54', 'concrete': '#a8a69e', 'cedar': '#2a4a38', 'cedarD': '#1f3a2c', 'cactus': '#5a8a4a', 'cactusL': '#7aa860', 'bloomP': '#b05a90', 'bloomY': '#e0b830', 'leaf': '#8a6a30', 'leafR': '#a8482a', 'leafY': '#c8a030', 'reed': '#9a9a58',
     'twig': '#6a5238', 'wood': '#9a7a52', 'woodD': '#6e5238', 'sapling': '#5a8a3a', 'ash': '#7a766c', 'pipe': '#8a8c88'}
M = {}; INFO = {}
def reg(n, ps, w, ln, h, note=''): M[n] = ps; INFO[n] = {'w': w, 'len': ln, 'h': h, **({'note': note} if note else {})}
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def rock(cx, y0, cz, w, h, d, c, seed=1, j=0.18, top=0.8):
    R = random.Random(seed); lo = []; up = []
    for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        lo.append((cx + sx*w/2*(1 + R.uniform(-j, j)), y0, cz + sz*d/2*(1 + R.uniform(-j, j))))
        up.append((cx + sx*w/2*top*(1 + R.uniform(-j, j)), y0 + h*(1 + R.uniform(-j*0.6, j*0.6)), cz + sz*d/2*top*(1 + R.uniform(-j, j))))
    return hull(lo + up, c)
def slope(run, rise, L, c, depth=3.0, x0=0.0):
    """a solid bank: toe at x0, top edge at x0 + run, height rise, then flat back for depth"""
    return hull([(x0, 0, -L/2), (x0 + run + depth, 0, -L/2), (x0 + run + depth, 0, L/2), (x0, 0, L/2), (x0 + run, rise, -L/2), (x0 + run + depth, rise, -L/2), (x0 + run + depth, rise, L/2), (x0 + run, rise, L/2)], c)
L = 4.0
# ------------------------------------------------------------------ road cuts and banks
def rock_cut(h, benches, seed=3):
    R = random.Random(seed); th = h/(benches + 1); xb = 0.0; o = []; bw = 1.8; batter = 0.25*th; xend = (benches + 1)*(batter + bw) + 1.0
    for t in range(benches + 1):
        y = t*th; c = 'lime' if t % 2 == 0 else 'dolo'
        o.append(hull([(xb, y, -L/2), (xend, y, -L/2), (xend, y, L/2), (xb, y, L/2), (xb + batter, y + th, -L/2), (xend, y + th, -L/2), (xend, y + th, L/2), (xb + batter, y + th, L/2)], c))
        n = 3 + int(th/1.2)                      # strata: darker bands standing out of the face, a little different in depth
        for i in range(n):
            f = (i + R.uniform(0.2, 0.8))/n; yy = y + th*f; xf = xb + batter*f - 0.02
            o.append(box([xf, yy, 0], [0.14 + R.uniform(0, 0.1), 0.12 + R.uniform(0, 0.12), L - R.uniform(0, 0.4)], 'limeD' if i % 2 else 'limeL', ry=0))
        for i in range(2):                       # vertical joints and a hanging slab
            zz = R.uniform(-1.6, 1.6); o.append(box([xb + batter*0.5 - 0.02, y + th*0.5, zz], [0.1, th*0.95, 0.08], 'dark'))
        xb += batter + bw
        if t < benches: o.append(bx(xb - bw/2, y + th, 0, bw - 0.1, 0.2, L, 'earth'))        # loose rubble bench
    o += [rock(0.6, 0, R.uniform(-1.5, 1.5), R.uniform(0.5, 0.9), 0.5, 0.6, 'limeD', seed + i) for i in range(3)]   # fallen rock at the toe
    o.append(bx(xend - 0.5, h, 0, 2.0, 0.3, L, 'grass'))
    return o
for h, b in ((4, 0), (8, 1), (12, 2)): reg('cut_rock_h%d' % h, rock_cut(float(h), b), 8.0, L, float(h) + 0.3, 'a rock road cut, 4 m of it: pale limestone in benches with darker strata bands, a rubble bench at each step, fallen rock at the foot and a grass cap')
def soil_cut(h):
    o = [slope(2.0*h, float(h), L, 'earth', 1.5)]
    o.append(hull([(2.0*h*0.55, h*0.55, -L/2), (2.0*h + 1.5, h*0.55, -L/2), (2.0*h + 1.5, h*0.55, L/2), (2.0*h*0.55, h*0.55, L/2), (2.0*h, h + 0.02, -L/2), (2.0*h + 1.5, h + 0.02, -L/2), (2.0*h + 1.5, h + 0.02, L/2), (2.0*h, h + 0.02, L/2)], 'grass'))
    R = random.Random(h)
    return o
for h in (3, 6): reg('cut_soil_h%d' % h, soil_cut(h), 2.0*h + 1.5, L, float(h), 'a soil cut at 2:1: bare earth on the lower slope and grass over the top; scale y to the real height')
M['cut_mixed_h8'] = [slope(0.5, 4.0, L, 'lime', 1.5), slope(8.0, 4.0, L, 'earth', 0.0, 2.0)] + [box([0.28 + 0.04*i, 0.5 + 0.7*i, 0], [0.12, 0.12, L - 0.3], 'limeD' if i % 2 else 'limeL') for i in range(5)] + [hull([(6.0, 4.0, -L/2), (10.0, 4.0, -L/2), (10.0, 4.0, L/2), (6.0, 4.0, L/2), (10.0, 4.02, -L/2), (11.5, 4.02, -L/2), (11.5, 4.02, L/2), (10.0, 4.02, L/2)], 'grass')]
INFO['cut_mixed_h8'] = {'w': 11.5, 'len': L, 'h': 8.0, 'note': 'rock in the lower half under a soil slope with a grass cap, the commonest cut on a hillside road; the contact is at 4 m'}
reg('cut_rock_end', [hull([(0, 0, -L/2), (6.0, 0, -L/2), (6.0, 0, L/2), (0, 0, L/2), (2.0, 4.0, -L/2), (6.0, 4.0, -L/2), (6.0, 4.0, L/2), (2.0, 4.0, L/2)], 'lime'), wedge([3.0, 2.0, 0], [6.0, 4.0, L], 'lime', ry=0)][:1], 6.0, L, 4.0, 'a rock cut dying away into the hill: use it at each end so the cut does not stop like a wall')
def ditch(c='grass', pipe=False):
    o = [hull([(0, 0, -L/2), (3.0, 0, -L/2), (3.0, 0, L/2), (0, 0, L/2), (1.2, -0.55, -L/2), (1.8, -0.55, -L/2), (1.8, -0.55, L/2), (1.2, -0.55, L/2)], 'earth')]
    o += [bx(1.5, -0.55, 0, 0.7, 0.04, L, 'gravel')]
    if pipe: o += [cyl([1.5, -0.2, L/2 - 0.02], [0.7, 0.5, 0.7], 'pipe', ax='z'), cyl([1.5, -0.2, L/2 + 0.02], [0.45, 0.2, 0.45], 'dark', ax='z')]
    return o
reg('ditch_4', ditch(), 3.0, L, 0.6, 'a roadside drainage ditch: V-shaped, a gravel bottom; it lies at y = 0 and sinks 0.55 m')
reg('ditch_pipe_4', ditch(pipe=True), 3.0, L, 0.6, 'the same with a drain pipe mouth at the +z end, for a driveway or side road')
reg('rockfall_fence_4', [bx(sx*0.0, 0.0, z, 0.12, 2.4, 0.12, 'steelD') for sx in (0,) for z in (-1.9, 0.0, 1.9)] + [bx(0.02, 0.3, 0, 0.04, 1.9, L, 'steel')] + [bx(0.0, 2.3, 0, 0.1, 0.1, L, 'steelD')], 0.2, L, 2.4, 'a rockfall catch fence along a bench or the foot of a cut: posts and wire mesh')
def fill(h):
    o = [hull([(0, 0, -L/2), (2.0*h + 1.0, 0, -L/2), (2.0*h + 1.0, 0, L/2), (0, 0, L/2), (2.0*h, h, -L/2), (2.0*h + 1.0, h, -L/2), (2.0*h + 1.0, h, L/2), (2.0*h, h, L/2)], 'grass')]
    o.append(hull([(0, 0, -L/2), (1.2*h*1.0, 0, -L/2), (1.2*h, 0, L/2), (0, 0, L/2), (0.7*h, 0.5*h, -L/2), (1.2*h, 0.5*h, -L/2), (1.2*h, 0.5*h, L/2), (0.7*h, 0.5*h, L/2)], 'earth'))
    return o
for h in (3, 6): reg('fill_bank_h%d' % h, fill(h), 2.0*h + 1.0, L, float(h), 'an embankment the road sits on, 2:1 grass with a bare earth foot; the road edge is at the top (x = 2h), so lay it the other way round to a cut: the toe is at the bottom, away from the road')
def guard(): return [bx(0, 0.0, z, 0.14, 0.9, 0.14, 'steelD') for z in (-1.9, 0.0, 1.9)] + [bx(0.1, 0.5, 0, 0.06, 0.32, L, 'steel'), bx(0.12, 0.5, 0, 0.03, 0.16, L, 'steelD')] + [bx(0.1, 0.62, z, 0.08, 0.12, 0.12, 'warn') for z in (1.8,)][0:0]
reg('guardrail_4', guard(), 0.3, L, 0.9, 'a W-beam guardrail on wooden or steel posts, 4 m; road side is +x')
reg('rip_rap_4', [slope(2.4, 1.2, L, 'gravelD', 1.0)] + [rock(0.3 + 0.55*(i % 4), 0.1 + 0.28*(i % 4), -1.6 + 0.8*i/2.0 - 0.0 + (0.4 if i % 2 else 0), 0.7, 0.45, 0.6, 'lime' if i % 3 else 'limeD', 20 + i) for i in range(8)], 3.4, L, 1.3, 'a stone-lined bank for a bridge end, culvert or creek crossing: loose rock over a slope; toe at x = 0')
# ------------------------------------------------------------------ ledges, bluffs, glades, rocks
def ledge(w, steps, seed):
    R = random.Random(seed); o = []; x = 0
    for i in range(steps):
        h = 0.35 + 0.12*R.random(); ww = w*(1 - 0.18*i)
        o.append(rock(0.0 - 0.0, i*0.42, 0.0 + 0.0, ww, 0.45, 0.8*w*(1 - 0.1*i), 'lime' if i % 2 == 0 else 'limeL', seed + i, 0.12, 0.96))
    return o
reg('ledge_s', ledge(1.4, 2, 1), 1.5, 1.2, 0.9, 'a small stair-stepped limestone shelf (the way dolomite breaks), 1.4 m')
reg('ledge_m', ledge(2.6, 3, 2), 2.7, 2.0, 1.3, 'a medium limestone ledge, three steps')
reg('ledge_l', ledge(4.4, 4, 3), 4.5, 3.4, 1.8, 'a large limestone ledge, four steps, for hilltops and glades')
def outcrop(seed):
    R = random.Random(seed); o = []
    for i in range(4):
        w, h, d = R.uniform(1.2, 2.4), R.uniform(0.5, 1.2), R.uniform(1.0, 1.8)
        o.append(rock(R.uniform(-1.5, 1.5), 0, R.uniform(-1.2, 1.2), w, h, d, ['lime', 'limeD', 'dolo', 'limeL'][i], seed*10 + i, 0.2, 0.7))
    o += [box([R.uniform(-1.8, 1.8), 0.1, R.uniform(-1.4, 1.4)], [0.5, 0.2, 0.4], 'moss') for _ in range(3)] + [box([R.uniform(-1.6, 1.6), 1.0 + R.uniform(0, 0.2), R.uniform(-1.0, 1.0)], [0.3, 0.06, 0.25], 'lichenO') for _ in range(3)]
    return o
reg('outcrop_a', outcrop(1), 4.0, 3.0, 1.4, 'a cluster of four tilted limestone slabs with moss and orange lichen; place on slopes above 25 degrees and on hilltops')
reg('outcrop_b', outcrop(5), 4.0, 3.0, 1.4)
def boulders(seed, n, c='lime'):
    R = random.Random(seed); return [rock(R.uniform(-1.4, 1.4), -0.1, R.uniform(-1.4, 1.4), R.uniform(0.6, 1.3), R.uniform(0.5, 1.0), R.uniform(0.6, 1.2), ['lime', 'limeD', 'dolo'][i % 3] if c == 'lime' else c, seed + i, 0.25, 0.6) for i in range(n)]
reg('boulder_field_a', boulders(1, 6), 3.4, 3.4, 1.0, 'six rounded limestone boulders scattered on the slope below a bluff')
reg('boulder_field_b', boulders(7, 4, 'gravelD'), 3.0, 3.0, 1.0)
def bluff(h=10.0, seed=4):
    R = random.Random(seed); o = []; tiers = 5
    for t in range(tiers):
        y = t*h/tiers; th = h/tiers; shelf = 0.5*(t % 2)*R.random() + 0.3*t
        o.append(hull([(0.4 + shelf*0.25, y, -L/2), (6.0, y, -L/2), (6.0, y, L/2), (0.4 + shelf*0.25, y, L/2), (0.2 + shelf*0.55, y + th, -L/2), (6.0, y + th, -L/2), (6.0, y + th, L/2), (0.2 + shelf*0.55, y + th, L/2)], 'lime' if t % 2 == 0 else 'limeL'))
        o.append(box([0.15 + shelf*0.3, y + th*0.5, 0.0], [0.2, 0.18, L - 0.3], 'limeD')); o.append(box([0.2 + shelf*0.3, y + th*0.85, 0.0], [0.16, 0.1, L - 0.6], 'dolo'))
    o += [box([0.2, R.uniform(1, h - 1), R.uniform(-1.7, 1.7)], [0.1, h*0.14, 0.09], 'dark') for _ in range(4)]
    o += [box([0.25, R.uniform(2, h - 1), R.uniform(-1.5, 1.5)], [0.2, 0.4, 0.5], 'moss') for _ in range(3)] + [box([0.2, R.uniform(2, h - 2), R.uniform(-1.5, 1.5)], [0.14, 0.3, 0.6], 'lichen') for _ in range(2)]
    o += [rock(1.3, 0, R.uniform(-1.5, 1.5), 1.1, 0.8, 1.0, 'limeD', 90 + i, 0.2, 0.6) for i in range(3)]
    o += [bx(2.3, h, 0.0, 3.6, 0.45, L, 'grass')] + [tip([0.5, h + 0.2, z], [0.5, h + 0.2 + 2.6, z], 0.5, 0.5, 'cedar', n=5) for z in (-1.2, 1.4)] + [bx(0.5, h, z, 0.12, 0.6, 0.12, 'bark') for z in (-1.2, 1.4)][0:0]
    return o
reg('bluff_h10', bluff(10.0), 7.0, L, 13.0, 'a limestone river bluff, 4 m of it: five bands with darker strata, joints, moss and lichen, boulders at the foot and a grass top with two cedars; faces -x (toward the water); scale y to the real height and drop the cedars if you scale it down a lot')
reg('bluff_h5', bluff(5.0, 6), 7.0, L, 8.0, 'a low bluff for creeks, five bands over 5 m')
reg('talus_slope_4', [slope(5.0, 2.5, L, 'gravelD', 1.0)] + [rock(0.6 + 0.9*(i % 5), 0.1 + 0.4*(i % 5), -1.7 + 0.5*i, 0.6, 0.5, 0.5, ['lime', 'limeD', 'dolo'][i % 3], 40 + i, 0.25, 0.6) for i in range(10)], 6.0, L, 2.8, 'a slope of fallen rock under a bluff, toe at x = 0')
reg('overhang_shelter', [rock(1.5, 0, 0, 4.0, 2.4, 6.0, 'lime', 8, 0.08, 1.0), rock(-0.4, 2.2, 0, 3.4, 1.0, 6.4, 'limeL', 9, 0.1, 1.0), bx(0.2, 0.0, 0.0, 2.6, 0.12, 4.0, 'earthD')] + [box([1.0, 0.6, z], [0.4, 0.2, 0.5], 'mossD') for z in (-1.4, 1.4)], 6.0, 6.4, 3.4, 'a rock shelter: a cliff with a recess under a lip (an overhang) you can stand in, open toward -x; the floor is dry dirt')
reg('natural_bridge', [rock(sz*3.0, 0, 0, 2.6, 5.0, 4.0, 'lime', 20 + (sz > 0), 0.1, 0.8) for sz in (-1, 1)] + [hull([(-4.2, 4.0, -2.0), (4.2, 4.0, -2.0), (4.2, 4.0, 2.0), (-4.2, 4.0, 2.0), (-3.6, 6.6, -1.8), (3.6, 6.6, -1.8), (3.6, 6.6, 1.8), (-3.6, 6.6, 1.8)], 'limeL'), bx(0.0, 6.6, 0, 6.0, 0.4, 3.0, 'grass')] + [box([x, 3.7, 0], [1.4, 0.8, 3.6], 'lime') for x in (-2.4, 2.4)], 8.6, 4.0, 7.0, 'a natural arch: two stacked piers and a lintel with a 4.4 m gap beneath (a cave roof that outlived the cave); walk-through at the gap')
reg('glade_patch', [bx(0, 0.0, 0, 4.0, 0.04, 4.0, 'dolo')] + [bx(x, 0.04, z, 0.8 + 0.2*((x + z) % 2), 0.05, 0.7, c) for x, z, c in ((-1.0, -1.0, 'lime'), (0.3, -0.8, 'limeL'), (1.2, -0.2, 'lime'), (-0.6, 0.3, 'limeL'), (0.7, 0.9, 'dolo'), (-1.3, 1.1, 'lime'))] + [box([x, 0.05, z], [0.5, 0.01, 0.06], 'dark') for x, z in ((0, -0.2), (-1.0, 0.6), (1.0, 0.5), (0.3, 1.4))] + [bx(x, 0.04, z, 0.4, 0.08, 0.4, 'grassL') for x, z in ((-1.6, -1.5), (1.5, -1.3), (1.6, 1.4), (-0.2, 1.8))] + [box([x, 0.2, z], [0.34, 0.3, 0.2], 'cactus') for x, z in ((0.9, -1.2), (-1.4, 0.2))] + [box([x, 0.17, z], [0.2, 0.2, 0.2], 'cactusL') for x, z in ((0.9, -1.2), (-1.4, 0.2))][0:0] + [bx(x, 0.05, z, 0.08, 0.3, 0.08, 'reed') for x, z in ((0.2, 0.4), (-0.7, -0.6), (1.4, 0.7))] + [box([x, 0.4, z], [0.12, 0.1, 0.12], c) for x, z, c in ((0.2, 0.4, 'bloomP'), (-0.7, -0.6, 'bloomY'), (1.4, 0.7, 'bloomP'))], 4.0, 4.0, 0.5, 'a 4 m patch of glade: bare pale dolomite pavement with cracks, tufts of little bluestem, a prickly pear or two and coneflowers; tile them on south and west facing hilltops, with a ledge and cedars on the edge')
reg('cairn', [rock(0, 0, 0, 0.9, 0.4, 0.8, 'limeD', 1, 0.15), rock(0.02, 0.4, 0, 0.7, 0.3, 0.6, 'lime', 2, 0.15), rock(0, 0.7, 0.02, 0.5, 0.25, 0.45, 'limeL', 3, 0.15), rock(0, 0.95, 0, 0.3, 0.2, 0.3, 'lime', 4, 0.15)], 0.9, 0.8, 1.15, 'a stack of trail stones, a marker')
# ------------------------------------------------------------------ karst
def bowl(r, d, c='earth', water=None, rim=True):
    n = 8; o = []
    o.append(loft([[0, 0, 0, r, r], [0, -d*0.5, 0, r*0.6, r*0.6], [0, -d, 0, r*0.25, r*0.25]], c, n=8, rot=22, caps=[False, True]))
    if rim: o.append(loft([[0, 0.12, 0, r*1.35, r*1.35], [0, 0.0, 0, r*1.0, r*1.0]], 'grassD', n=8, rot=22, caps=[True, False]))
    if water: o.append(loft([[0, -d*0.55, 0, r*0.52, r*0.52], [0, -d*0.55 + 0.02, 0, r*0.52, r*0.52]], water, n=8, rot=22, caps=[True, True]))
    return o
reg('sinkhole_s', bowl(2.0, 1.5) + [rock(1.6, -0.1, -0.4, 0.6, 0.4, 0.5, 'lime', 3, 0.2), rock(-1.4, -0.2, 0.9, 0.5, 0.35, 0.45, 'limeD', 4, 0.2)], 4.8, 4.8, 1.5, 'a small sinkhole, 4 m across and 1.5 m deep: a round dish in the ground with a lip of bare earth and a couple of stones (the ground inside sinks below y = 0)')
reg('sinkhole_m', bowl(4.5, 3.5) + [rock(4.0, -0.2, -1.0, 1.1, 0.7, 0.9, 'lime', 5, 0.2), rock(-3.6, -0.4, 1.9, 0.9, 0.6, 0.8, 'limeD', 6, 0.2), rock(1.0, -3.2, 2.8, 0.8, 0.5, 0.7, 'dolo', 7, 0.2)] + [tip([-2.5, -1.2, -2.6], [-2.5, 1.6, -2.6], 0.2, 0.2, 'bark')] + [tip([3.0, -2.0, 1.0], [2.0, 1.2, 1.5], 0.16, 0.16, 'bark')], 10.0, 10.0, 3.5, 'a medium sinkhole, 9 m across and 3.5 m deep with boulders on the slope and two leaning dead trees')
reg('sinkhole_pond', bowl(4.5, 3.0, water='water') + [bx(x, -1.7, z, 0.06, 0.5, 0.06, 'reed') for x, z in ((2.0, 1.0), (-1.8, -1.6), (0.4, 2.2), (-2.3, 0.8))] + [rock(4.0, -0.2, -1.0, 1.1, 0.7, 0.9, 'lime', 5, 0.2)], 10.0, 10.0, 3.0, 'a sinkhole holding a little water (a karst pond) with reed stems at its edge')
reg('swallet', bowl(1.4, 1.2, rim=False) + [hull([(-0.6, 0, 1.4), (0.6, 0, 1.4), (0.5, -0.1, 3.4), (-0.5, -0.1, 3.4), (-0.5, 0.02, 1.4), (0.5, 0.02, 1.4), (0.4, 0.0, 3.4), (-0.4, 0.0, 3.4)], 'water')][0:0] + [bx(0, -0.1, 2.4, 1.0, 0.04, 2.4, 'water'), bx(0, -0.1, 1.2, 1.4, 0.04, 0.6, 'waterL')] + [rock(1.4, -0.1, 0.6, 0.8, 0.5, 0.7, 'lime', 4, 0.2), rock(-1.4, -0.1, -0.3, 0.7, 0.5, 0.6, 'limeD', 5, 0.2)], 4.0, 6.0, 1.2, 'a swallet: a stream running into a hole in the ground (a losing stream); the stream arrives from +z; the water ribbon ends at the lip')
def cave(w, h, d, seed):
    R = random.Random(seed)
    o = [rock(0, 0, 0, w + 4.0, h + 2.4, d, 'lime', seed, 0.06, 0.9), box([0, h/2, d/2 + 0.02], [w, h, 0.1], 'dark')]
    o += [rock(sx*(w/2 + 0.3), 0, d/2 - 0.3, 1.0, h*0.9, 1.2, 'limeD', seed + 2 + i, 0.15, 0.7) for i, sx in enumerate((-1, 1))] + [hull([(-w/2, h, d/2 - 0.2), (w/2, h, d/2 - 0.2), (w/2, h, d/2 + 0.3), (-w/2, h, d/2 + 0.3), (-w/2 + 0.3, h + 0.5, d/2 - 0.2), (w/2 - 0.3, h + 0.5, d/2 - 0.2), (w/2 - 0.3, h + 0.5, d/2 + 0.3), (-w/2 + 0.3, h + 0.5, d/2 + 0.3)], 'limeD')]
    o += [tip([x, h + 0.1, d/2 + 0.1], [x + 0.05, h - 0.6 - R.random()*0.5, d/2 + 0.1], 0.07, 0.07, 'limeL') for x in (-w/3, 0.2, w/3)] + [box([R.uniform(-w/2, w/2), 0.1, d/2 + 0.8], [0.4, 0.2, 0.4], 'limeD') for _ in range(3)] + [bx(0, 0.0, d/2 + 0.3, w, 0.05, 1.0, 'clay')]
    o += [bx(x, h + 2.0, d/2 - 0.8, 0.5, 0.3, 0.5, 'moss') for x in (-w, w*0.2)] + [tip([sx*(w/2 + 1.6), h + 2.4, d/2 - 1.0], [sx*(w/2 + 1.6), h + 4.6, d/2 - 1.0], 0.5, 0.5, 'cedar', n=5) for sx in (-1, 1)][0:0]
    return o
reg('cave_mouth_s', cave(2.2, 1.9, 4.0, 11), 6.2, 4.0, 4.5, 'a small cave entrance in a limestone face: a 2.2 m wide dark opening with stalactites hanging in the mouth and red clay on the floor; faces +z; the dark face is a plane to put the cave interior behind, or to be a portal for a short corridor')
reg('cave_mouth_l', cave(4.4, 3.2, 6.0, 13), 8.4, 6.0, 6.4, 'a large cave mouth, 4.4 m wide and 3.2 m high')
reg('spring_pool', [loft([[0, -0.6, 0, 3.2, 3.2], [0, -0.2, 0, 3.6, 3.6], [0, 0.0, 0, 4.0, 4.0]], 'springD', n=8, rot=22, caps=[True, False]), loft([[0, -0.01, 0, 3.4, 3.4], [0, 0.0, 0, 3.4, 3.4]], 'spring', n=8, rot=22, caps=[True, True]), loft([[0, 0.0, 0, 1.4, 1.4], [0, 0.0, 0, 0.9, 0.9]], 'waterL', n=8, rot=22, caps=[True, True])] + [rock(3.4*math.cos(a), 0, 3.4*math.sin(a), 0.9, 0.5, 0.8, ['lime', 'limeD', 'dolo'][i % 3], 60 + i, 0.2, 0.6) for i, a in enumerate([0.3, 1.2, 2.2, 3.1, 3.9, 4.7, 5.6])] + [bx(2.8*math.cos(a), 0.0, 2.8*math.sin(a), 0.5, 0.35, 0.5, 'mossD') for a in (0.8, 2.6, 4.3)] + [loft([[0, 0.0, 0, 1.2, 1.2], [0, 0.0, 0, 1.0, 1.0]], 'foam', n=8, rot=0, caps=[True, True])][0:0], 9.0, 9.0, 0.6, 'a big Ozark spring: a deep round blue-green pool with a lighter boil in the middle, ringed by limestone and mossy rock; the water leaves along spring_outflow_4 toward +z')
reg('spring_outflow_4', [bx(0, -0.2, 0, 3.0, 0.05, L, 'springD'), bx(0, -0.15, 0, 2.4, 0.03, L, 'spring'), bx(-1.7, -0.3, 0, 0.5, 0.5, L, 'gravel'), bx(1.7, -0.3, 0, 0.5, 0.5, L, 'gravel')] + [bx(x, -0.2, z, 0.1, 0.4, 0.1, 'moss') for x, z in ((-1.0, -1.4), (0.3, 0.2), (0.9, 1.5))] + [rock(-0.7, -0.2, 0.9, 0.4, 0.3, 0.4, 'gravelW', 3, 0.2), rock(0.8, -0.2, -0.8, 0.4, 0.3, 0.4, 'gravelD', 4, 0.2)], 4.0, L, 0.4, 'four metres of the clear stream that runs out of a spring: shallow, cold blue, a gravel bed and bright green watercress; lay it end to end, running toward +z')
reg('dry_hollow_4', [hull([(-2.2, 0, -L/2), (2.2, 0, -L/2), (2.2, 0, L/2), (-2.2, 0, L/2), (-0.9, -0.6, -L/2), (0.9, -0.6, -L/2), (0.9, -0.6, L/2), (-0.9, -0.6, L/2)], 'earth'), bx(0, -0.6, 0, 1.6, 0.05, L, 'chertL')] + [rock(x, -0.58, z, 0.35, 0.2, 0.3, c, 70 + i, 0.2) for i, (x, z, c) in enumerate(((-0.4, -1.4, 'chert'), (0.3, -0.5, 'chertL'), (-0.2, 0.7, 'chert'), (0.5, 1.5, 'chertL'), (-0.5, 0.2, 'limeD')))] + [bx(sx*1.5, 0.0, 1.0, 0.7, 0.04, 0.9, 'leaf') for sx in (1, -1)][0:0], 4.4, L, 0.6, 'a dry hollow (gully): a V-shaped ravine with a chert-cobble bed that only runs after rain; 4 m, lay end to end')
# ------------------------------------------------------------------ creek details
def riffle():
    o = [bx(0, -0.1, 0, 4.0, 0.05, L, 'water'), bx(0, -0.06, 0, 3.2, 0.02, L, 'waterL')]
    R = random.Random(2); o += [rock(R.uniform(-1.7, 1.7), -0.12, R.uniform(-1.8, 1.8), R.uniform(0.3, 0.6), R.uniform(0.15, 0.35), R.uniform(0.3, 0.5), ['gravelW', 'gravel', 'gravelD', 'chertL'][i % 4], 30 + i, 0.2) for i in range(12)]
    o += [box([R.uniform(-1.6, 1.6), -0.05, R.uniform(-1.8, 1.8)], [R.uniform(0.3, 0.6), 0.01, 0.06], 'foam') for _ in range(6)]
    return o
reg('riffle_4', riffle(), 4.0, L, 0.4, 'a shallow riffle: water running fast over a gravel bed with stones breaking the surface and white foam streaks; the run is toward +z; 4 m, 4 m wide (scale x to the stream)')
def pool():
    return [bx(0, -0.55, 0, 4.0, 0.05, L, 'waterD'), bx(0, -0.1, 0, 4.0, 0.04, L, 'water'), bx(0, -0.3, 0, 3.4, 0.02, L, 'waterD'), bx(1.8, -0.5, 0, 0.5, 0.5, L, 'mud'), bx(-1.8, -0.5, 0, 0.5, 0.5, L, 'gravelD')] + [box([x, -0.09, z], [0.4, 0.01, 0.4], 'waterL') for x, z in ((0.5, -0.8), (-0.6, 1.0))]
reg('pool_4', pool(), 4.0, L, 0.6, 'a deep pool: darker, calm water with a lighter ring of ripple, mud on the cut-bank side (+x) and clean gravel on the other; pools sit on the outside of a bend and are about every 5 to 7 channel widths, each between two riffles')
def gravel_bar(w, seed):
    R = random.Random(seed); o = [hull([(-w/2, 0, -2.4), (w/2, 0, -2.4), (w/2*0.9, 0, 2.4), (-w/2*0.9, 0, 2.4), (-w/2*0.7, 0.35, -1.6), (w/2*0.7, 0.35, -1.6), (w/2*0.6, 0.3, 1.8), (-w/2*0.6, 0.3, 1.8)], 'gravelW')]
    o += [rock(R.uniform(-w*0.3, w*0.3), 0.25, R.uniform(-1.6, 1.6), R.uniform(0.2, 0.45), R.uniform(0.1, 0.25), R.uniform(0.2, 0.4), ['gravel', 'gravelD', 'chertL', 'limeL', 'lime'][i % 5], seed*10 + i, 0.2) for i in range(14)]
    o += [bx(R.uniform(-w*0.25, w*0.25), 0.3, R.uniform(-1.4, 1.4), 0.04, R.uniform(0.2, 0.45), 0.04, 'reed') for _ in range(5)] + [box([R.uniform(-w*0.3, w*0.3), 0.32, R.uniform(-1.5, 1.5)], [0.9, 0.05, 0.12], 'twig') for _ in range(2)]
    return o
reg('gravel_bar_s', gravel_bar(3.0, 1), 3.0, 4.8, 0.5, 'a gravel bar: a low tongue of pale rounded chert and limestone gravel with driftwood and a few reed stalks; sits on the inside of a bend (a point bar) in shallow water')
reg('gravel_bar_l', gravel_bar(6.0, 2), 6.0, 4.8, 0.5, 'a larger gravel bar, 6 m wide')
reg('sand_bar', [hull([(-2.6, 0, -2.2), (2.6, 0, -2.2), (2.2, 0, 2.2), (-2.2, 0, 2.2), (-1.8, 0.25, -1.5), (1.8, 0.25, -1.5), (1.4, 0.2, 1.6), (-1.4, 0.2, 1.6)], 'sand')] + [box([x, 0.22, z], [0.5, 0.02, 0.1], 'sandD') for x, z in ((0.3, -0.3), (-0.5, 0.7), (0.9, 1.0), (-0.9, -0.9))], 5.2, 4.4, 0.3, 'a sandbar with ripple marks; for slower, wider reaches')
def undercut(seed=3):
    R = random.Random(seed); o = [hull([(0, -0.5, -L/2), (3.0, -0.5, -L/2), (3.0, -0.5, L/2), (0, -0.5, L/2), (0.6, 1.6, -L/2), (3.0, 1.6, -L/2), (3.0, 1.6, L/2), (0.6, 1.6, L/2)], 'earthD')]
    o += [hull([(0.7, 0.5, -L/2), (2.0, 0.5, -L/2), (2.0, 0.5, L/2), (0.7, 0.5, L/2), (0.9, 1.65, -L/2), (2.0, 1.65, -L/2), (2.0, 1.65, L/2), (0.9, 1.65, L/2)], 'earth')][0:0]
    o += [bx(0.4, 0.5, 0, 0.4, 0.2, L, 'earthD'), bx(0.7, 1.6, 0, 3.0, 0.2, L, 'grass'), bx(0.55, 1.4, 0, 0.5, 0.25, L, 'grassD')]
    o += [seg([0.6, 1.4, z], [0.15 + 0.1*R.random(), 0.5 + 0.2*R.random(), z + R.uniform(-0.4, 0.4)], 0.05, 0.05, 0.03, 0.03, 'root', ax='y') for z in (-1.5, -0.6, 0.3, 1.2, 1.8)] + [box([0.45, 1.5, z], [0.4, 0.3, 0.7], 'grassL') for z in (-1.2, 0.8)]
    return o
reg('cut_bank_4', undercut(), 3.6, L, 2.1, 'an undercut creek bank on the outside of a bend: a steep earth bank, scoured under the grass lip so tree roots hang out; water is at the foot toward -x; for pools')
def logjam():
    R = random.Random(5); o = []
    for i in range(7):
        a = R.uniform(-0.5, 0.5); L2 = R.uniform(2.4, 4.2); y = 0.1 + 0.25*i*0.5
        o.append(seg([-L2/2*math.cos(a), y, -L2/2*math.sin(a) + R.uniform(-0.6, 0.6)], [L2/2*math.cos(a), y + R.uniform(0, 0.4), L2/2*math.sin(a) + R.uniform(-0.6, 0.6)], 0.14, 0.14, 0.12, 0.12, 'log' if i % 2 else 'barkD', ax='x'))
    o += [tip([R.uniform(-1.2, 1.2), 0.2, R.uniform(-0.6, 0.6)], [R.uniform(-1.8, 1.8), 1.5, R.uniform(-1.0, 1.0)], 0.05, 0.05, 'twig') for _ in range(6)] + [rock(x, 0, z, 0.4, 0.25, 0.3, 'gravelD', 80 + i, 0.2) for i, (x, z) in enumerate(((-1.5, 0.8), (1.4, -0.6), (0.2, 1.0)))] + [box([x, 0.12, z], [0.8, 0.02, 0.3], 'foam') for x, z in ((0.4, 1.0), (-0.6, -0.9))]
    return o
reg('logjam', logjam(), 4.4, 3.0, 1.6, 'a jam of drift logs, branches and stones lodged across a creek, foam on the upstream side (+z); across x; a hazard and a place fish gather')
def stream_boulder(r, seed):
    return [rock(0, -0.15, 0, r*1.6, r*1.3, r*1.4, 'limeD', seed, 0.2, 0.6), box([0.0, r*1.1, 0.0], [r*0.8, 0.04, r*0.6], 'moss'), box([0.0, 0.0, r*0.9], [r*1.6, 0.01, 0.3], 'foam')]
for n, r, sd in (('s', 0.4, 1), ('m', 0.7, 2), ('l', 1.2, 3)): reg('stream_boulder_' + n, stream_boulder(r, sd), r*1.8, r*1.8, r*1.3, 'a boulder standing in the water with foam on its upstream (+z) side and moss on its top')
def beaver_dam():
    R = random.Random(8); o = []
    for i in range(14):
        z = -1.9 + i*0.28; o.append(seg([-1.6 + R.uniform(-0.2, 0.2), 0.2 + 0.1*R.random(), z], [1.6 + R.uniform(-0.2, 0.2), 0.3 + 0.2*R.random(), z + R.uniform(-0.2, 0.2)], 0.08, 0.08, 0.08, 0.08, 'log' if i % 3 else 'twig', ax='x'))
    o += [bx(0, 0.0, 0.0, 3.6, 0.5, 1.0, 'mud'), bx(0, 0.5, 0.0, 3.4, 0.2, 0.9, 'twig')] + [box([x, 0.65, 0.0], [0.3, 0.1, 0.3], 'moss') for x in (-1.0, 0.8)]
    o += [bx(0, -0.1, 1.2, 3.6, 0.04, 2.0, 'water'), bx(0, -0.4, -1.4, 3.6, 0.04, 1.4, 'waterD')]
    return o
reg('beaver_dam', beaver_dam(), 3.8, 4.4, 0.9, 'a beaver dam: a woven wall of sticks and mud across a creek holding a still pond (the +z side) above a lower step; across x')
reg('beaver_lodge', [loft([[0, 0, 0, 2.2, 2.0], [0, 0.9, 0, 1.6, 1.4], [0, 1.5, 0, 0.5, 0.5], [0, 1.6, 0, 0, 0]], 'twig', n=7, rot=10, caps=[True, False]), loft([[0, 0.4, 0, 2.3, 2.1], [0, 0.45, 0, 2.3, 2.1]], 'mud', n=7, rot=10, caps=[False, False])] + [seg([math.cos(a)*1.9, 0.3, math.sin(a)*1.7], [math.cos(a)*1.2, 1.3, math.sin(a)*1.0], 0.07, 0.07, 0.05, 0.05, 'log', ax='y') for a in (0.5, 1.8, 3.3, 4.6)] + [bx(0, -0.05, 0, 5.4, 0.04, 5.0, 'water')], 5.4, 5.0, 1.6, 'a beaver lodge: a domed heap of sticks and mud standing in a pond; ring of still water around it')
reg('mudflat', [hull([(-2.4, 0, -2.0), (2.4, 0, -2.0), (2.0, 0, 2.0), (-2.0, 0, 2.0), (-1.8, 0.1, -1.5), (1.8, 0.1, -1.5), (1.5, 0.08, 1.5), (-1.5, 0.08, 1.5)], 'mud')] + [box([x, 0.11, z], [0.5, 0.02, 0.1], 'earthL') for x, z in ((0.3, -0.5), (-0.8, 0.6), (0.9, 0.9))] + [bx(x, 0.1, z, 0.06, 0.4, 0.06, 'reed') for x, z in ((-1.0, -0.8), (0.6, 0.1), (1.2, 1.1))] + [box([0.1, 0.12, 0.2], [0.2, 0.01, 0.12], 'earthD'), box([0.5, 0.12, 0.2], [0.2, 0.01, 0.12], 'earthD')], 4.8, 4.0, 0.4, 'wet mud at a pond edge with reed stems and animal tracks')
# ------------------------------------------------------------------ ground patches (decals, lie on y = 0.02)
def patch(n, w, d, base, bits, seed):
    R = random.Random(seed); o = [box([0, 0.02, 0], [w, 0.02, d], base)]
    o += [box([R.uniform(-w/2*0.8, w/2*0.8), 0.04, R.uniform(-d/2*0.8, d/2*0.8)], [R.uniform(*bits[1]), 0.02, R.uniform(*bits[1])], bits[0][i % len(bits[0])], ry=R.choice([0, 1, 2, 3])) for i in range(bits[2])]
    return o
reg('patch_leaf_pile', patch('leaf', 1.6, 1.6, 'earthD', (['leaf', 'leafR', 'leafY', 'earthL'], (0.2, 0.4), 16), 1) + [box([0, 0.14, 0], [0.9, 0.2, 0.9], 'leaf'), box([0.15, 0.24, 0.1], [0.5, 0.16, 0.5], 'leafY'), box([-0.2, 0.2, -0.15], [0.4, 0.16, 0.4], 'leafR')], 1.6, 1.6, 0.35, 'a pile of fallen leaves on leaf-litter ground')
reg('patch_leaf_litter', patch('lit', 4.0, 4.0, 'earthD', (['leaf', 'leafR', 'leafY', 'earth'], (0.3, 0.7), 34), 2), 4.0, 4.0, 0.06, 'a 4 m patch of leaf litter, the woods floor; tiles')
reg('patch_moss', patch('moss', 3.0, 3.0, 'mossD', (['moss', 'grassL', 'lichen'], (0.3, 0.7), 14), 3), 3.0, 3.0, 0.06, 'a moss patch for the damp, north side of rocks and logs')
reg('patch_pebbles', patch('peb', 2.4, 2.4, 'gravelD', (['gravel', 'gravelW', 'chertL', 'limeD'], (0.1, 0.25), 26), 4), 2.4, 2.4, 0.06, 'scattered pebbles and chert fragments')
reg('patch_clover', patch('cl', 3.0, 3.0, 'grass', (['grassL', 'grassD', 'bloomY'], (0.15, 0.3), 24), 5), 3.0, 3.0, 0.06, 'a clover and wildflower patch for meadows and lawns')
reg('patch_twigs', patch('tw', 2.4, 2.4, 'earthD', (['twig', 'bark', 'log', 'leaf'], (0.1, 0.18), 10), 6) + [box([0.0, 0.05, 0.0], [1.2, 0.04, 0.05], 'twig', ry=1), box([0.2, 0.05, 0.3], [0.9, 0.04, 0.05], 'bark', ry=2)], 2.4, 2.4, 0.08, 'fallen twigs and branches on the forest floor')
reg('patch_game_trail', [box([0, 0.02, 0], [0.9, 0.02, L], 'earthL'), box([0.0, 0.03, 0], [0.5, 0.02, L], 'earth')] + [box([x, 0.04, z], [0.12, 0.02, 0.2], 'earthD') for x, z in ((-0.1, -1.4), (0.12, -0.9), (-0.08, -0.2), (0.1, 0.5), (-0.1, 1.1), (0.08, 1.7))], 0.9, L, 0.06, 'a worn animal or foot path through grass or woods, 4 m: bare packed earth with hoof prints; wiggle it by turning each piece a little')
reg('patch_deer_track', [box([0, 0.02, 0], [0.6, 0.01, 1.6], 'earthD')] + [box([sx*0.14, 0.03, z], [0.07, 0.01, 0.12], 'earth') for sx in (1, -1) for z in (-0.6, -0.1, 0.4)][0:0] + [wedge([sx*0.12, 0.04, z], [0.07, 0.015, 0.12], 'earth') for sx in (1, -1) for z in (-0.6, -0.1, 0.4)], 0.6, 1.6, 0.06, 'deer tracks across mud or snow, 1.6 m of them, heading toward +z')
pack = {'name': 'land', 'version': 1, 'style': 'rocks as jittered hulls with flat colours and dark strata bands; slopes as simple wedges; water as thin flat slabs', 'units': 'metres', 'facing': 'see the notes', 'pivot': 'centre of the base, toe at x = 0 for road banks',
        'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': {'land': M}, 'info': INFO,
        'rule': ('Roads through hills: where the ground beside a road is higher than the road by more than 1.5 m, lay cut_rock (limestone, where the ground is rocky or steeper than 1:1) or cut_soil along it, with ditch_4 at the toe, rockfall_fence_4 on benches taller than 8 m, and cut_rock_end where the cut dies out; scale y to the real height. '
                 'Where the road is higher than the ground beside it by more than 1.5 m use fill_bank, with guardrail_4 on the road edge above 3 m. Creeks: on a straight reach alternate riffle_4 and pool_4, each about 6 channel widths long; put pool_4 and cut_bank_4 on the outside of a bend and gravel_bar on the inside; '
                 'stream_boulder_s/m/l and logjam where the data has shoals; beaver_dam and beaver_lodge on slow lowland creeks. Hills: outcrop_a/b and ledge_* on slopes above about 25 degrees and on ridgelines; glade_patch with ledge_l and cedars on south and west facing hilltops; bluff on the outside of river bends. '
                 'Karst: sinkhole_s/m (and _pond) in fields and woods on limestone, scattered in groups of a few; swallet where a small stream ends; cave_mouth in bluffs and hillsides; spring_pool with spring_outflow_4 at the head of a creek in a hollow; dry_hollow_4 for valleys with no stream. '
                 'Ground: patch_* over the ground texture under woods, edges and trails.')}
out, st = write_pack('land', pack, __file__)
t = [v[0] for v in st.values()]; print(len(t), 'models', min(t), '-', max(t), 'triangles'); print({k.split('.')[1]: v[0] for k, v in st.items() if v[0] > 300})
