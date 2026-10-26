#!/usr/bin/env python3
"""Afterstreet woods pack, version 1 (26 October 2026): the trees and forest-floor pieces that make a dense Ozark wood read as layered woods and not as one kind of tree on a flat sheet.
Writes assets/shaped/woods.js. Run: python3 assets/shaped/src/woods.py

models.woods.<name>  every piece stands on the ground at the origin, metres, true size (info[name].h), scale 1 is right.
Trees: spruce, oak_tall (a woodland oak: tall, clear trunk, small high crown), sapling, pine_dead, oak_bare and pine_bare (winter), oak_snow and pine_snow (snow-laden), redbud, dogwood, hickory, walnut, sumac, birch.
Understory and floor: fallen_tree_path (a trunk across a path, 4 m), root_ball, snag_a/b (dead standing trunks), stump_big, log_hollow, log_mossy, brush_pile, boulder_moss, boulder_cluster,
 thicket_a/b (dense low shrub 2 m), berry_bush, vines (a hanging curtain for tree trunks), fern_a, mayapple, wildflower_a/b/c, mushrooms, toadstool_ring, bracket_fungus.
Rule of use is in `rule`; the layers are canopy (oak_tall, hickory, walnut), understory (redbud, dogwood, sapling), shrub (thicket, sumac, berry_bush) and herb (ferns, flowers), plus dead wood."""
import math, random
from kit import *
P = {'bark': '#5a4636', 'barkD': '#3e3026', 'barkL': '#7a6048', 'barkG': '#6a6458', 'barkW': '#e8e4da', 'barkMark': '#2a2b2e', 'dead': '#7a7064', 'deadD': '#5a5248', 'hick': '#8a7e6a', 'walnut': '#3a2e26', 'snow': '#f0f3f6', 'snowS': '#d4dce4',
     'spruce1': '#21402f', 'spruce2': '#193325', 'spruce3': '#2c5039', 'oak1': '#4f7234', 'oak2': '#3f5c2a', 'oak3': '#668840', 'hick1': '#5c8038', 'hick2': '#4a6a2e', 'wal1': '#4a7030', 'wal2': '#3a5a26', 'red1': '#6a8a3a', 'redF': '#b04a78', 'redP': '#c85a8a',
     'dog1': '#5a8040', 'dogW': '#f4f2e8', 'dogC': '#e8d890', 'sap1': '#6a9a42', 'sap2': '#58862f', 'sum1': '#6a8a30', 'sumR': '#a82a22', 'sumR2': '#7a2018', 'birch1': '#7aa04a', 'birch2': '#62883a', 'pine1': '#2f4a36', 'pine2': '#243a2a',
     'moss': '#5a7a3a', 'mossD': '#44602c', 'rock': '#8a8678', 'rockD': '#6a665a', 'rockL': '#a8a392', 'root': '#5a4030', 'earth': '#4e4034', 'earthL': '#6e5a42', 'hollow': '#16120e', 'thick1': '#3f5c2e', 'thick2': '#35502a', 'thick3': '#52743a',
     'berry': '#a8322a', 'berryB': '#2a2a4a', 'vine': '#4a6a30', 'vineD': '#35502a', 'fern': '#5a8a3a', 'fern2': '#6aa044', 'leaf': '#8a6a30', 'twig': '#6a5238', 'may': '#7aaa4a', 'mayW': '#f4f0e0',
     'fl1': '#e0b830', 'fl2': '#b05a90', 'fl3': '#e8e4da', 'fl4': '#d05a28', 'fl5': '#7a6ac0', 'stem': '#5a8a3a', 'shroom': '#e8dcc0', 'shroomR': '#c8402a', 'shroomB': '#a8845a', 'cap': '#d8c8a0', 'bracket': '#c89a4a', 'bracketD': '#8a6428'}
M = {}; INFO = {}
def reg(n, ps, w, ln, h, note=''): M[n] = ps; INFO[n] = {'w': w, 'len': ln, 'h': h, **({'note': note} if note else {})}
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def blob(x, y, z, rr, c, rot=0, sq=1.0, n=5):
    return loft([[x, y - rr*0.7*sq, z, rr*0.55, rr*0.55], [x, y, z, rr, rr], [x, y + rr*0.75*sq, z, rr*0.55, rr*0.55], [x, y + rr*sq, z, 0, 0]], c, n=n, rot=rot, caps=[True, False])
def trunk(h, w, c, lean=(0, 0), top=0.55): return frustum([[0, 0, 0, w, w], [lean[0], h, lean[1], w*top, w*top]], c)
def limb(p0, p1, w, c): return tip(p0, p1, w, w, c)
def rock(cx, y0, cz, w, h, d, c, seed=1, j=0.2, top=0.7):
    R = random.Random(seed); lo = []; up = []
    for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        lo.append((cx + sx*w/2*(1 + R.uniform(-j, j)), y0, cz + sz*d/2*(1 + R.uniform(-j, j))))
        up.append((cx + sx*w/2*top*(1 + R.uniform(-j, j)), y0 + h*(1 + R.uniform(-j*0.5, j*0.5)), cz + sz*d/2*top*(1 + R.uniform(-j, j))))
    return hull(lo + up, c)
# ------------------------------------------------------------------ trees
def spruce(h, v, snow=False):
    R = random.Random(v + 5); o = [trunk(h*0.3, 0.16, 'bark')]; n = 7
    for i in range(n):
        t = i/n; y0 = h*(0.08 + 0.12*i); rr = h*0.2*(1 - t*0.78)*(0.95 + 0.1*R.random())
        o.append(loft([[0, y0, 0, rr, rr], [0, y0 + h*0.2, 0, rr*0.1, rr*0.1]], ('spruce%d' % (1 + i % 3)), n=8, rot=25*i, caps=[True, False]))
        if snow: o.append(loft([[0, y0 + h*0.1, 0, rr*0.55, rr*0.55], [0, y0 + h*0.2, 0, rr*0.1, rr*0.1]], 'snow', n=8, rot=25*i, caps=[True, False]))
    o.append(tip([0, h*0.92, 0], [0, h, 0], 0.06, 0.06, 'spruce3')); return o
def oak_tall(h=15.0, v=0, bare=False, snow=False):
    R = random.Random(v + 20); lean = (R.uniform(-0.3, 0.3), R.uniform(-0.3, 0.3)); th = h*0.55
    o = [trunk(th + 1, 0.3, 'barkG' if v else 'bark', lean, 0.5)]
    for k in range(4):
        a = k*1.6 + R.uniform(0, 1); r = 2.6 + R.random()
        o.append(limb([lean[0], th - 1 + k*0.3, lean[1]], [lean[0] + math.cos(a)*r, th + 1.8 + R.random(), lean[1] + math.sin(a)*r], 0.17, 'bark'))
        if bare: o.append(limb([lean[0] + math.cos(a)*r*0.6, th + 1.0, lean[1] + math.sin(a)*r*0.6], [lean[0] + math.cos(a + 0.6)*r*1.2, th + 3.0 + R.random(), lean[1] + math.sin(a + 0.6)*r*1.2], 0.08, 'barkD'))
        elif snow: o.append(blob(lean[0] + math.cos(a)*r*0.8, th + 2.6 + R.random(), lean[1] + math.sin(a)*r*0.8, 1.2, 'snow', 20*k, 0.4))
        else: o.append(blob(lean[0] + math.cos(a)*r*0.8, th + 2.2 + R.random(), lean[1] + math.sin(a)*r*0.8, 2.2 + 0.4*R.random(), ('oak%d' % (1 + k % 3)), 20*k, 0.75))
    if not bare and not snow: o.append(blob(lean[0], h*0.85, lean[1], 2.8, 'oak3', 10, 0.8))
    return o
def pine_t(h, v, dead=False, bare=False, snow=False):
    R = random.Random(v + 33); lean = (R.uniform(-0.3, 0.3), R.uniform(-0.3, 0.3)); o = [trunk(h*0.95, 0.2, 'dead' if dead else 'bark', lean, 0.3)]
    n = 6
    for i in range(n):
        t = i/n; y0 = h*(0.3 + 0.1*i); a = i*2.2
        if dead or bare:
            o.append(limb([lean[0]*t, y0, lean[1]*t], [lean[0]*t + math.cos(a)*(1.8 - t), y0 + 0.9 - 0.6*t, lean[1]*t + math.sin(a)*(1.8 - t)], 0.07, 'deadD' if dead else 'barkD'))
        else:
            rr = h*0.11*(1.05 - t*0.7); o.append(loft([[lean[0]*t, y0, lean[1]*t, rr, rr], [lean[0]*t, y0 + h*0.22, lean[1]*t, 0, 0]], 'pine%d' % (1 + i % 2), n=6, rot=30*i, caps=[True, False]))
            if snow: o.append(loft([[lean[0]*t, y0 + h*0.1, lean[1]*t, rr*0.6, rr*0.6], [lean[0]*t, y0 + h*0.22, lean[1]*t, 0, 0]], 'snow', n=6, rot=30*i, caps=[True, False]))
    return o
reg('spruce', spruce(13, 0), 4.5, 4.5, 13, 'a tall dark spruce, for the north slopes and the cold seasons')
reg('spruce_snow', spruce(13, 1, True), 4.5, 4.5, 13, 'the same spruce under snow')
for v, s in enumerate(('', '_b', '_c')):
    reg('oak_tall' + s, oak_tall(15 + v, v), 6.5, 6.5, 15 + v, 'a woodland oak grown in a stand: a long clear trunk and a small crown high up; use these (not the open-grown oak) inside dense woods')
reg('oak_bare', oak_tall(15, 0, bare=True), 6.5, 6.5, 15, 'winter oak: branches only'); reg('oak_snow', oak_tall(15, 0, snow=True), 6.5, 6.5, 15, 'winter oak with snow on the limbs')
reg('pine_dead', pine_t(14, 0, dead=True), 4, 4, 14, 'a dead pine: grey trunk, bare short limbs')
reg('pine_bare', pine_t(15, 1, bare=True), 4, 4, 15, 'a pine in winter with no needles left on the lower limbs'); reg('pine_snow', pine_t(15, 2, snow=True), 4, 4, 15, 'a pine under snow')
def smalltree(h, w, tc, cc, v, flower=None, lay=3):
    R = random.Random(v + 60); lean = (R.uniform(-0.3, 0.3), R.uniform(-0.3, 0.3)); o = [trunk(h*0.55, w, tc, lean, 0.5)]
    o += [limb([lean[0], h*0.4, lean[1]], [R.uniform(-1, 1)*h*0.3, h*0.75, R.uniform(-1, 1)*h*0.3], w*0.5, tc) for _ in range(3)]
    for i in range(lay):
        a = i*2.1 + v; d = h*0.18*(i > 0); o.append(blob(lean[0] + math.cos(a)*d, h*(0.7 + 0.05*i), lean[1] + math.sin(a)*d, h*0.3*(1 - 0.1*i), (flower if flower and i % 2 else cc), 30*i, 0.6))
    return o
reg('redbud', smalltree(5, 0.12, 'barkD', 'red1', 0, 'redP'), 4.4, 4.4, 5, 'redbud: a small understory tree with magenta spring flowers')
reg('dogwood', smalltree(4.5, 0.1, 'barkL', 'dog1', 1, 'dogW'), 4, 4, 4.5, 'flowering dogwood: white bracts, a small layered crown, the Missouri understory tree')
reg('sapling', smalltree(2.4, 0.05, 'barkL', 'sap1', 2, 'sap2', 2), 1.6, 1.6, 2.4, 'a young tree 2.4 m tall; scatter many where the woods are regrowing')
reg('birch', [trunk(8, 0.13, 'barkW', (0.2, 0.1), 0.55)] + [box([0.05, 1.0 + k*0.9, 0.12], [0.1, 0.05, 0.03], 'barkMark') for k in range(6)] + [blob(0.2 + math.cos(k*2.1)*0.6, 6.3 + 0.6*(k % 2), 0.1 + math.sin(k*2.1)*0.6, 1.5, 'birch%d' % (1 + k % 2), 25*k, 0.8) for k in range(3)], 3.5, 3.5, 8, 'a paper birch with white bark and black marks')
reg('hickory', [trunk(7, 0.28, 'hick', (0.1, 0), 0.45)] + [limb([0.1, 5.0, 0], [math.cos(k*2.1)*2.4, 9, math.sin(k*2.1)*2.4], 0.16, 'hick') for k in range(3)] + [blob(math.cos(k*2.1)*1.9, 9.8 + 0.4*(k % 2), math.sin(k*2.1)*1.9, 2.4, 'hick%d' % (1 + k % 2), 20*k, 0.9) for k in range(3)] + [blob(0.1, 12, 0, 2.1, 'hick1', 5, 0.9)], 6, 6, 14, 'shagbark hickory: a tall straight trunk with shaggy bark, open oval crown')
reg('walnut', [trunk(5, 0.34, 'walnut', (0, 0.2), 0.55)] + [limb([0, 4.0, 0.2], [math.cos(k*1.8)*3.0, 7.0, math.sin(k*1.8)*3.0], 0.2, 'walnut') for k in range(4)] + [blob(math.cos(k*1.8)*2.6, 8.0 + 0.5*(k % 2), math.sin(k*1.8)*2.6, 2.7, 'wal%d' % (1 + k % 2), 20*k, 0.75) for k in range(4)] + [blob(0, 9.5, 0, 2.6, 'wal1', 8, 0.8)], 7.5, 7.5, 12, 'black walnut: a broad round crown over a dark trunk, in fencerows and bottoms')
reg('sumac', [limb([0, 0, 0], [0.4, 2.2, 0.1], 0.05, 'barkD'), limb([0, 0, 0], [-0.4, 1.8, -0.2], 0.04, 'barkD')] + [tip([0.4*(k % 2) - 0.2, 2.0 + 0.1*k, 0.1*k - 0.2], [0.4*(k % 2) - 0.2 + math.cos(k*2.1)*0.9, 2.0 + 0.1*k + 0.25, 0.1*k - 0.2 + math.sin(k*2.1)*0.9], 0.14, 0.06, 'sum1') for k in range(6)] + [cyl([0.4, 2.45, 0.1], [0.14, 0.25, 0.14], 'sumR'), cyl([-0.3, 2.2, -0.2], [0.12, 0.22, 0.12], 'sumR2')], 2, 2, 2.6, 'staghorn sumac with its red cones: a fencerow and woods-edge shrub that turns red in autumn')
# ------------------------------------------------------------------ dead wood and floor
def log(x, y, z, L, w, c, ry=0, ax='z'):
    return seg([x, y, z - L/2], [x, y, z + L/2], w, w, w*0.85, w*0.85, c, ry=ry) if False else cyl([x, y + w, z], [w*2, L, w*2], c, ax='z', ry=ry) if ax == 'z' else cyl([x, y + w, z], [w*2, L, w*2], c, ax='x', ry=ry)
reg('fallen_tree_path', [cyl([0, 0.9, 0], [0.7, 4.4, 0.7], 'bark', ax='z', ry=0), cyl([0, 0.85, -2.3], [0.55, 0.5, 0.55], 'barkL', ax='z')] + [limb([0.2, 1.1, -1.0 + k*0.9], [0.6 + 0.3*k, 1.6 + 0.2*k, -1.2 + k*1.0], 0.07, 'barkD') for k in range(3)] + [bx(0, 0, 2.3, 0.7, 0.14, 0.8, 'earthL'), rock(0.6, 0, 0.1, 0.5, 0.25, 0.6, 'root', 3)], 1.6, 4.4, 1.8, 'a trunk across a path, 4 m long, lying along z at 0.9 m off the ground: ducks under at 0.9 m height, blocks vehicles; the rest of the tree is another piece')
reg('root_ball', [rock(0, 0.4, 0, 2.6, 2.0, 0.7, 'earth', 4, 0.15, 0.85)] + [limb([0, 1.0 + 0.2*k, 0], [math.cos(k*0.9 - 1.3)*1.8, 1.5 + 1.2*abs(math.sin(k)), 0.2*k - 0.4], 0.09, 'root') for k in range(7)] + [bx(0, 0, 0.6, 2.8, 0.3, 1.4, 'earthL')], 3.2, 2.0, 3, 'the upturned roots and earth of a windthrown tree, with a pit at its base; put at the end of a fallen trunk')
reg('snag_a', [trunk(8, 0.28, 'dead', (0.3, 0), 0.35), limb([0.1, 5.5, 0], [1.4, 7.0, 0.3], 0.07, 'deadD'), limb([0.2, 6.4, 0], [-1.2, 7.8, -0.2], 0.06, 'deadD'), box([0.14, 3.0, 0.27], [0.2, 0.5, 0.05], 'hollow')], 1.2, 1.2, 8, 'a dead standing tree 8 m tall with a woodpecker hole')
reg('snag_b', [trunk(5, 0.32, 'dead', (-0.2, 0.1), 0.5), bx(-0.2, 5, 0.1, 0.4, 0.5, 0.3, 'deadD'), limb([0.0, 3.8, 0], [0.9, 4.6, 0.3], 0.06, 'deadD')], 1.0, 1.0, 5.5, 'a broken-off snag 5 m tall')
reg('stump_big', [cyl([0, 0.4, 0], [1.1, 0.8, 1.1], 'bark'), cyl([0, 0.82, 0], [0.95, 0.04, 0.95], 'barkL')] + [limb([0.4*math.cos(k*1.57), 0.0, 0.4*math.sin(k*1.57)], [0.9*math.cos(k*1.57), 0.1, 0.9*math.sin(k*1.57)], 0.12, 'root') for k in range(4)], 1.8, 1.8, 0.85, 'a big stump with root flares and a pale top')
reg('log_hollow', [cyl([0, 0.5, 0], [1.0, 3.6, 1.0], 'bark', ax='z'), cyl([0, 0.5, 1.82], [0.6, 0.08, 0.6], 'hollow', ax='z'), box([0, 0.97, 0.3], [0.5, 0.06, 0.8], 'moss')], 1.2, 3.8, 1.0, 'a hollow log, a den for small animals and a place for loot; the open end faces +z')
reg('log_mossy', [cyl([0, 0.35, 0], [0.7, 3.2, 0.7], 'barkL', ax='z'), box([0, 0.7, 0.2], [0.5, 0.08, 1.8], 'moss'), box([0.1, 0.1, -1.0], [0.4, 0.2, 0.5], 'mossD')], 1.2, 3.4, 0.75, 'a rotting log wearing moss')
reg('brush_pile', [limb([math.cos(k*0.8)*0.2, 0, math.sin(k*0.8)*0.2], [math.cos(k*0.8)*1.4, 0.7 + 0.18*(k % 3), math.sin(k*0.8)*1.4], 0.06, 'twig' if k % 2 else 'barkD') for k in range(8)] + [box([0, 0.35, 0], [0.9, 0.5, 0.9], 'leaf'), cyl([0, 0.3, 0], [0.2, 1.8, 0.2], 'bark', ax='x', ry=1)], 2.6, 2.6, 0.9, 'a pile of dead branches and leaves: shelter for rabbits, a place to find sticks')
reg('boulder_moss', [rock(0, 0, 0, 2.0, 1.3, 1.6, 'rock', 8), rock(0.1, 1.0, 0, 1.6, 0.18, 1.2, 'moss', 8, 0.2, 1.0), rock(-0.3, 0.1, 0.9, 0.7, 0.5, 0.5, 'mossD', 9)], 2.4, 2.0, 1.3, 'a glacial-looking woodland boulder with moss on top and on its north foot')
reg('boulder_cluster', [rock(0, 0, 0, 1.8, 1.2, 1.4, 'rock', 11), rock(1.5, 0, 0.3, 1.1, 0.8, 1.0, 'rockD', 12), rock(-1.2, 0, 0.9, 0.9, 0.6, 0.8, 'rockL', 13), rock(0.3, 0, -1.2, 0.8, 0.5, 0.7, 'rock', 14), rock(0.2, 1.1, 0.0, 1.0, 0.1, 0.8, 'moss', 11, 0.1, 1.0)], 4.2, 3.6, 1.3, 'a group of boulders, mixed sizes')
# ------------------------------------------------------------------ shrub layer
def thicket(w, h, seed, n=7):
    R = random.Random(seed); o = []
    for i in range(n):
        o.append(blob(R.uniform(-w/2, w/2)*0.7, h*0.45*R.uniform(0.7, 1.2), R.uniform(-w/2, w/2)*0.7, w*R.uniform(0.28, 0.4), ('thick%d' % (1 + i % 3)), 20*i, 1.0))
    o += [limb([R.uniform(-w*0.3, w*0.3), 0, R.uniform(-w*0.3, w*0.3)], [R.uniform(-w*0.4, w*0.4), h*1.0, R.uniform(-w*0.4, w*0.4)], 0.03, 'twig') for _ in range(5)]
    return o
reg('thicket_a', thicket(2.6, 1.8, 1), 2.8, 2.8, 1.8, 'a dense blackberry-and-brier thicket: slows movement, hides animals'); reg('thicket_b', thicket(3.4, 2.2, 2, 9), 3.6, 3.6, 2.2, 'a larger thicket')
reg('berry_bush', thicket(1.4, 1.2, 3, 5) + [box([math.cos(k*1.4)*0.55, 0.5 + 0.12*(k % 3), math.sin(k*1.4)*0.55], [0.07, 0.07, 0.07], 'berryB' if k % 2 else 'berry') for k in range(9)], 1.6, 1.6, 1.2, 'a bush with berries you can pick')
reg('vines', [bx(0, 0, 0, 0.5, 4.5, 0.4, 'bark')] + [tip([0.12*math.cos(k*1.2), 4.4, 0.12*math.sin(k*1.2)], [0.35*math.cos(k*1.2) + 0.2, 1.4 + 0.5*(k % 3), 0.35*math.sin(k*1.2)], 0.07, 0.04, 'vine' if k % 2 else 'vineD') for k in range(7)] + [blob(0.1, 4.5, 0, 0.8, 'vine', 5, 0.5)], 1.4, 1.4, 4.6, 'a trunk with grapevine and poison ivy hanging from it; for a tree stand edge')
def fern(h, v):
    R = random.Random(v + 4); return [tip([0, 0, 0], [math.cos(k*0.9 + v)*h*0.7, h*(0.5 + 0.3*R.random()), math.sin(k*0.9 + v)*h*0.7], 0.12, 0.03, 'fern' if k % 2 else 'fern2') for k in range(9)]
reg('fern_a', fern(0.8, 0), 1.4, 1.4, 0.8, 'a fern clump'); reg('fern_b', fern(0.6, 1), 1.0, 1.0, 0.6, 'a small fern clump')
reg('mayapple', [limb([0.15*k - 0.3, 0, 0.1*(k % 2)], [0.15*k - 0.3, 0.3, 0.1*(k % 2)], 0.012, 'stem') for k in range(5)] + [cyl([0.15*k - 0.3, 0.32, 0.1*(k % 2)], [0.3, 0.025, 0.3], 'may') for k in range(5)] + [box([0, 0.2, 0.05], [0.07, 0.07, 0.07], 'mayW')], 1.0, 0.8, 0.35, 'mayapple: an umbrella-leaf woodland spring herb')
def flowers(cs, seed, n=7):
    R = random.Random(seed); o = []
    for i in range(n):
        x, z = R.uniform(-0.4, 0.4), R.uniform(-0.4, 0.4); h = R.uniform(0.35, 0.7)
        o += [limb([x, 0, z], [x, h, z], 0.015, 'stem'), cyl([x, h, z], [0.14, 0.05, 0.14], cs[i % len(cs)]), box([x, h + 0.03, z], [0.05, 0.03, 0.05], 'fl1')]
    return o
reg('wildflower_a', flowers(['fl1', 'fl4'], 1), 1.0, 1.0, 0.75, 'coneflower, black-eyed susan and indian paintbrush colours'); reg('wildflower_b', flowers(['fl2', 'fl5'], 2), 1.0, 1.0, 0.75, 'purple, pink woodland flowers')
reg('wildflower_c', flowers(['fl3', 'fl1'], 3, 9), 1.0, 1.0, 0.75, 'white daisies and yellow')
reg('mushrooms', [x for k in range(5) for x in (limb([0.2*k - 0.4, 0, 0.1*math.sin(k)], [0.2*k - 0.4, 0.1 + 0.03*k, 0.1*math.sin(k)], 0.025, 'shroom'), cyl([0.2*k - 0.4, 0.12 + 0.03*k, 0.1*math.sin(k)], [0.14, 0.05, 0.14], 'cap' if k % 2 else 'shroomB'))], 1.0, 0.5, 0.2, 'a cluster of brown and cream mushrooms, forageable')
reg('toadstool_ring', [x for k in range(8) for x in (limb([math.cos(k*0.785)*0.7, 0, math.sin(k*0.785)*0.7], [math.cos(k*0.785)*0.7, 0.12, math.sin(k*0.785)*0.7], 0.02, 'shroom'), cyl([math.cos(k*0.785)*0.7, 0.14, math.sin(k*0.785)*0.7], [0.14, 0.06, 0.14], 'shroomR'))] + [box([math.cos(k*0.785)*0.7, 0.18, math.sin(k*0.785)*0.7], [0.03, 0.02, 0.03], 'shroom') for k in range(8)], 1.8, 1.8, 0.2, 'a fairy ring of red toadstools: poisonous, do not eat')
reg('bracket_fungus', [bx(0, 0, 0, 0.5, 2.2, 0.4, 'bark')] + [wedge([0.3, 0.8 + 0.5*k, 0], [0.3, 0.1, 0.4], 'bracket' if k % 2 else 'bracketD') for k in range(3)], 1.0, 0.9, 2.2, 'a dead trunk with bracket fungus shelves (chicken of the woods)')
pack = {'name': 'woods', 'version': 1, 'style': 'blobs of rings for crowns, rectangular trunks, tips for limbs and blades; flat colours', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base',
        'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': {'woods': M}, 'info': INFO,
        'rule': ('A wood is five layers, not one: canopy (oak_tall, hickory, walnut, spruce on cool slopes, pine on dry ridges, about 1 per 60 sq m), understory (redbud, dogwood, sapling, 1 per 25 sq m, in the gaps), shrubs (thicket_a/b, berry_bush, sumac, at clearings and edges), herbs (fern, mayapple, wildflower, mushrooms in damp spots) '
                 'and dead wood (snag, fallen_tree_path, log_*, root_ball, brush_pile; 1 or 2 per 400 sq m, a log is nearly always near a snag or a root_ball). Cluster the herbs and shrubs; do not spread them evenly. Put vines on trunks at the woods edge. '
                 'Edges are soft: tall trees, then understory, then shrubs, then field, over 10 to 15 m, with sumac in the fencerow. Pick a variant by hashing the position; use the _bare and _snow versions by season; birch near water and on cool slopes; walnut in bottomland.')}
out, st = write_pack('woods', pack, __file__)
t = [v[0] for v in st.values()]; print(len(t), 'models', min(t), '-', max(t)); print({k.split('.')[1]: v[0] for k, v in st.items() if v[0] > 250})
