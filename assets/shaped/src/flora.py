#!/usr/bin/env python3
"""Afterstreet flora pack, version 1 (25 October 2026): the trees and plants that replace the last Kenney Nature Kit models.
Writes assets/shaped/flora.js. Run: python3 assets/shaped/src/flora.py

Everything stands on the ground at the origin, metres, true to the height the game scales it to (info[name].h), so scale 1 is right.
models.plants.<name>    near version. Deciduous trees come in summer (<kind>) and autumn (<kind>_fall); every tree has three shape
                        variants: <kind>, <kind>_b, <kind>_c (different lean, branching and crown, same height class) so woods are not cloned.
models.far.<name>       a far version of 60 triangles or fewer for the distance (a trunk and two or three blobs). Same names as plants.
info[name]              {h, variants, far} the height it is drawn at, the variant names, and the far model.
Kinds: oak, maple, sycamore, poplar, cedar, pine (trees); bush, bush_small, shrub; grass_tuft, grass_tall.
Colour names are in the palette (nothing uses slots)."""
import math, random
from kit import *

P = {
 'bark': '#5a4636', 'barkD': '#46362a', 'barkL': '#7a6048', 'bark2': '#e8e4da', 'barkMark': '#2a2b2e', 'sycBark': '#b8b2a0', 'sycPatch': '#8a8a6a', 'sycPatch2': '#c8b890', 'cedarBark': '#6a4030', 'poplarBark': '#8a8470',
 'oak1': '#5a7a3e', 'oak2': '#47632f', 'oak3': '#6e8c48', 'oakF1': '#c8642a', 'oakF2': '#d89a2a', 'oakF3': '#a8402a',
 'maple1': '#5a8a3a', 'maple2': '#4a7430', 'maple3': '#74a048', 'mapleF1': '#d03a22', 'mapleF2': '#e8a22a', 'mapleF3': '#b8481e',
 'sycamore1': '#6a8c48', 'sycamore2': '#587a3a', 'sycamore3': '#82a058', 'sycamoreF1': '#c8a830', 'sycamoreF2': '#a88a2a', 'sycamoreF3': '#8a5a2a',
 'poplar1': '#6a9a42', 'poplar2': '#58862f', 'poplar3': '#82b058', 'poplarF1': '#e0c02a', 'poplarF2': '#c8a028', 'poplarF3': '#b88a28',
 'cedar1': '#2a4a38', 'cedar2': '#1f3a2c', 'cedar3': '#385a44', 'pine1': '#2f4a36', 'pine2': '#243a2a', 'pine3': '#3a5a40',
 'bush1': '#5a7a3e', 'bush2': '#47632f', 'bush3': '#6e8c48', 'shrub1': '#4c6a3a', 'shrub2': '#3a5a2e', 'shrub3': '#6a8a46', 'berry': '#a8322a',
 'grass1': '#6e8c48', 'grass2': '#5a7a3e', 'grass3': '#8a9a50', 'grassDry': '#9a9058', 'trunkFar': '#5a4636',
}
M = {'plants': {}, 'far': {}}; INFO = {}
def blob(x, y, z, rr, c, rot=0, squash=1.0, n=5):
    return loft([[x, y - rr*0.7*squash, z, rr*0.55, rr*0.55], [x, y, z, rr, rr], [x, y + rr*0.75*squash, z, rr*0.55, rr*0.55], [x, y + rr*squash, z, 0, 0]], c, n=n, rot=rot, caps=[True, False])
def fblob(x, y, z, rr, c, rot=0, squash=1.0):
    return loft([[x, y - rr*0.6*squash, z, rr*0.6, rr*0.6], [x, y + rr*0.1*squash, z, rr, rr], [x, y + rr*squash, z, 0, 0]], c, n=4, rot=rot, caps=[True, False])
def trunk(h, w, c, lean=(0, 0), top=0.55):
    return frustum([[0, 0, 0, w, w], [lean[0], h, lean[1], w*top, w*top]], c)
def branch(p0, p1, w, c): return tip(p0, p1, w, w, c)
def cols(kind, fall): return [kind + ('F' if fall else '') + str(i) for i in (1, 2, 3)]

def broad(kind, h, r, v, fall, trunk_c, w=0.2):
    """oak, maple and sycamore: a clear trunk, a few limbs, a crown of overlapping blobs"""
    R = random.Random(hash((kind, v)) & 0xffff); c = cols(kind, fall); th = h*(0.36 + 0.05*v)
    lean = (R.uniform(-0.3, 0.3), R.uniform(-0.3, 0.3)); o = [trunk(th + h*0.15, w, trunk_c, lean)]
    nb = 5 + (v % 2); ang = R.uniform(0, 6.28)
    o += [branch([lean[0]*0.7, th, lean[1]*0.7], [math.cos(ang + k*2.1)*r*0.45, th + h*0.18, math.sin(ang + k*2.1)*r*0.45], w*0.45, trunk_c) for k in range(3)]
    for i in range(nb):
        a = ang + i*2*math.pi/(nb - 1) if i < nb - 1 else 0; d = r*0.38*(1 if i < nb - 1 else 0)
        rr = r*0.62*(0.9 + 0.25*R.random()) * (1.0 if i < nb - 1 else 1.15)
        o.append(blob(lean[0] + math.cos(a)*d, th + h*(0.2 + 0.1*R.random()) + (h*0.12 if i == nb - 1 else 0), lean[1] + math.sin(a)*d, rr, c[i % 3], 18*i, 0.85))
    return o
def sycamore(h, r, v, fall):
    o = broad('sycamore', h, r, v, fall, 'sycBark', 0.26)
    R = random.Random(v + 40)
    for k in range(4):   # mottled trunk: flaky patches
        y = 0.4 + k*0.9; a = R.uniform(0, 6.28)
        o.append(box([math.cos(a)*0.24, y, math.sin(a)*0.24], [0.16, 0.34, 0.1], 'sycPatch' if k % 2 else 'sycPatch2', ry=k))
    return o
def poplar(h, v, fall):
    R = random.Random(v + 70); c = cols('poplar', fall); lean = (R.uniform(-0.15, 0.15), R.uniform(-0.15, 0.15))
    o = [trunk(h*0.5, 0.17, 'poplarBark', lean, 0.5)]
    r0 = 1.3 + 0.15*v; ys = [0.2, 0.34, 0.52, 0.72, 0.9, 1.0]; rs = [0.55, 0.95, 1.0, 0.8, 0.4, 0.0]
    o.append(loft([[lean[0]*y, h*y, lean[1]*y, r0*r*(0.92 + 0.12*R.random()), r0*r*(0.92 + 0.12*R.random())] for y, r in zip(ys, rs)], c[0], n=7, rot=10*v, caps=[True, False]))
    o.append(loft([[lean[0]*0.8, h*0.36, lean[1]*0.8, r0*0.6, r0*0.6], [lean[0]*0.9, h*0.58, lean[1]*0.9, r0*1.05, r0*1.05], [lean[0], h*0.8, lean[1], r0*0.5, r0*0.5], [lean[0], h*0.9, lean[1], 0, 0]], c[1], n=5, rot=25, caps=[True, False]))
    return o
def cedar(h, v):
    R = random.Random(v + 90); o = [trunk(h*0.25, 0.14, 'cedarBark')]; n = 5
    for i in range(n):
        t = i/n; y0 = h*(0.1 + 0.17*i); rr = h*0.22*(1 - t*0.7)*(0.95 + 0.1*R.random())
        o.append(loft([[0, y0, 0, rr, rr], [0, y0 + h*0.26, 0, rr*0.12, rr*0.12]], 'cedar%d' % (1 + (i % 3)), n=7, rot=30*i, caps=[True, False]))
        o.append(loft([[0, y0 - 0.0, 0, rr*1.0, rr*1.0], [0, y0 - 0.12, 0, rr*1.12, rr*1.12]], 'cedar2', n=7, rot=30*i, caps=[False, False]))
    o.append(tip([0, h*0.92, 0], [0, h*1.0, 0], 0.07, 0.07, 'cedar3'))
    return o
def pine(h, v):
    R = random.Random(v + 110); lean = (R.uniform(-0.25, 0.25), R.uniform(-0.25, 0.25)); o = [trunk(h*0.62, 0.17, 'bark', lean, 0.35)]
    n = 4 + (v % 2)
    for i in range(n):
        t = i/n; y0 = h*(0.2 + 0.15*i); rr = h*0.13*(1.05 - t*0.75)*(0.9 + 0.2*R.random())
        o.append(loft([[lean[0]*t, y0, lean[1]*t, rr, rr], [lean[0]*(t + 0.2), y0 + h*0.3, lean[1]*(t + 0.2), 0, 0]], 'pine%d' % (1 + i % 3), n=6, rot=30*i + 11*v, caps=[True, False]))
    return o
H = {'oak': 11.0, 'maple': 9.0, 'sycamore': 13.0, 'poplar': 14.0, 'cedar': 7.5, 'pine': 15.0}
RAD = {'oak': 5.0, 'maple': 4.2, 'sycamore': 6.0}
def make_tree(kind, v, fall):
    h = H[kind]
    if kind in ('oak', 'maple'): return broad(kind, h, RAD[kind], v, fall, 'bark', 0.2 + 0.04*(kind == 'oak'))
    if kind == 'sycamore': return sycamore(h, RAD[kind], v, fall)
    if kind == 'poplar': return poplar(h, v, fall)
    if kind == 'cedar': return cedar(h, v)
    return pine(h, v)
def far_tree(kind, v, fall):
    """about 40 triangles: a trunk and the crown as two or three blobs or cones"""
    h = H[kind]; c = cols(kind, fall) if kind not in ('cedar', 'pine') else [kind + str(i) for i in (1, 2, 3)]
    if kind in ('cedar', 'pine'):
        rr = h*0.2 if kind == 'cedar' else h*0.12
        return [frustum([[0, 0, 0, 0.2, 0.2], [0, h*0.3, 0, 0.14, 0.14]], 'trunkFar', caps=[False, False]), loft([[0, h*0.12, 0, rr, rr], [0, h, 0, 0, 0]], c[0], n=5, caps=[True, False]), loft([[0, h*0.4, 0, rr*0.7, rr*0.7], [0, h*1.0, 0, 0, 0]], c[1], n=5, rot=36, caps=[True, False])]
    if kind == 'poplar':
        return [frustum([[0, 0, 0, 0.2, 0.2], [0, h*0.5, 0, 0.12, 0.12]], 'trunkFar', caps=[False, False]), fblob(0, h*0.5, 0, 1.4, c[0], 0, 1.9), fblob(0.05, h*0.76, 0, 1.1, c[1], 36, 1.7)]
    r = RAD[kind]
    return [frustum([[0, 0, 0, 0.3, 0.3], [0, h*0.5, 0, 0.18, 0.18]], 'trunkFar', caps=[False, False]), fblob(0, h*0.62, 0, r*0.62, c[0], 0, 1.0), fblob(r*0.3, h*0.58, 0.3, r*0.4, c[1], 36, 0.9), fblob(-r*0.3, h*0.64, -0.2, r*0.4, c[2], 18, 0.9)]
for kind in ('oak', 'maple', 'sycamore', 'poplar', 'cedar', 'pine'):
    for fall in ((False, True) if kind in ('oak', 'maple', 'sycamore', 'poplar') else (False,)):
        vs = []
        for v, sfx in enumerate(('', '_b', '_c')):
            nm = kind + ('_fall' if fall else '') + sfx; vs.append(nm)
            M['plants'][nm] = make_tree(kind, v, fall); M['far'][nm] = far_tree(kind, v, fall)
            INFO[nm] = {'h': H[kind], 'far': nm}
        for nm in vs: INFO[nm]['variants'] = vs

# ---------- shrubs and grass ----------
def shrub(h, w, v, c, berries=False, n=5):
    R = random.Random(v + 200); o = []
    for i in range(n):
        a = i*2*math.pi/n + R.uniform(0, 1); d = w*0.45*(i > 0); s = w*(0.55 if i else 0.7)*(0.85 + 0.3*R.random())
        o.append(blob(math.cos(a)*d, h*0.4 + 0.05*R.random(), math.sin(a)*d, s, c[i % 3], 20*i, h/(w*1.1)))
    if berries: o += [box([math.cos(k*2.4)*w*0.6, h*(0.4 + 0.1*(k % 3)), math.sin(k*2.4)*w*0.6], [0.05, 0.05, 0.05], 'berry') for k in range(5)]
    return o
bc = ['bush1', 'bush2', 'bush3']; sc = ['shrub1', 'shrub2', 'shrub3']
for v, sfx in enumerate(('', '_b', '_c')):
    M['plants']['bush' + sfx] = shrub(1.3, 0.8, v, bc); M['plants']['bush_small' + sfx] = shrub(0.8, 0.55, v, bc, n=4); M['plants']['shrub' + sfx] = shrub(1.1, 0.65, v, sc, berries=(v == 1), n=4)
for nm, hh in (('bush', 1.3), ('bush_small', 0.8), ('shrub', 1.1)):
    for sfx in ('', '_b', '_c'): INFO[nm + sfx] = {'h': hh, 'variants': [nm, nm + '_b', nm + '_c']}
def grass(h, v, dry=False, blades=7):
    R = random.Random(v + 300); o = []
    for i in range(blades):
        a = R.uniform(0, 6.28); d = R.uniform(0.02, 0.12 + h*0.1); x, z = math.cos(a)*d, math.sin(a)*d
        o.append(tip([x, 0, z], [x + math.cos(a)*h*0.25, h*(0.75 + 0.25*R.random()), z + math.sin(a)*h*0.25], 0.035, 0.012, 'grassDry' if dry and i % 3 == 0 else 'grass%d' % (1 + i % 3)))
    return o
for v, sfx in enumerate(('', '_b', '_c')):
    M['plants']['grass_tuft' + sfx] = grass(0.35, v); M['plants']['grass_tall' + sfx] = grass(0.6, v, dry=(v == 2), blades=9)
    INFO['grass_tuft' + sfx] = {'h': 0.35, 'variants': ['grass_tuft', 'grass_tuft_b', 'grass_tuft_c']}; INFO['grass_tall' + sfx] = {'h': 0.6, 'variants': ['grass_tall', 'grass_tall_b', 'grass_tall_c']}

pack = {'name': 'flora', 'version': 1, 'style': 'blobs of rings for crowns, rectangular trunks, tips for blades; flat colours', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base',
        'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': M, 'info': INFO,
        'rule': ('Use plants.<name> within about 60 m and far.<name> beyond; both have the same name and stand at the same size, so switching does not pop. '
                 'Pick a variant by hashing the tree\'s position into info[name].variants. For the autumn season swap <kind> for <kind>_fall (oak, maple, sycamore, poplar); cedar, pine and the shrubs stay green. '
                 'The existing props.plants names (oak, autumn_oak, pine, bush, grass_tuft...) still work; these replace them one for one.')}
out, st = write_pack('flora', pack, __file__)
near = [v[0] for k, v in st.items() if k.startswith('plants.')]; far = [v[0] for k, v in st.items() if k.startswith('far.')]
print('near', len(near), min(near), '-', max(near), '| far', len(far), min(far), '-', max(far))
for k, v in sorted(st.items()):
    if k.startswith('far.') and v[0] > 60: print('over', k, v[0])
