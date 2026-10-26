#!/usr/bin/env python3
"""Afterstreet waterside and trail pack, version 1 (26 October 2026): what stands at the edge of water and along a trail: docks, ramps, boats, water plants, wading birds, foam, a rope swing,
a footbridge, and the park and trail furniture (picnic table, bench, fire ring, trail markers, trailhead sign, grill, bins). Writes assets/shaped/waterside.js. Run: python3 assets/shaped/src/waterside.py

models.waterside.<name>, metres, origin at the centre of the base, front facing +Z. Water level is y = 0: boats and plants float at it. Shore pieces say which way the water is.
Colour names are in the palette."""
import math, random
from kit import *
P = {'wood': '#9a7a52', 'woodD': '#6e5238', 'woodW': '#b8a888', 'post': '#7a6048', 'steel': '#6a7078', 'steelD': '#4a4e54', 'galv': '#a8acb2', 'concrete': '#a8a69e', 'concreteD': '#88867e', 'rust': '#8a4a2a',
     'green': '#3a6a3a', 'greenD': '#2a4a2a', 'greenB': '#4a7a5a', 'red': '#a8342a', 'white': '#e8e4da', 'blue': '#3a5a8a', 'yellow': '#d8b020', 'orange': '#d86a1a', 'aluminium': '#b8bcc0', 'hull': '#7a8a8a', 'hullD': '#566666',
     'pad': '#4a7a38', 'padD': '#3a6a2c', 'flower': '#f0e8f0', 'flowerY': '#e8c840', 'cat': '#5a7a38', 'catD': '#46602c', 'catB': '#5a3a22', 'reed': '#8a9a50', 'reedD': '#6e8238', 'water': '#4a7a90', 'foam': '#e8f0f2',
     'heron': '#8a96a4', 'heronD': '#4a5460', 'heronW': '#e8ecf0', 'beak': '#d8b84a', 'leg': '#5a5a3a', 'rope': '#a89060', 'tire': '#24262a', 'bark': '#5a4636', 'earth': '#6e5a42', 'gravel': '#a09888', 'grass': '#6d7a4f',
     'sign': '#5a4030', 'signG': '#2e5a3a', 'signT': '#e8e4da', 'ash': '#3a3836', 'stone': '#8a8678', 'stoneD': '#6a665a', 'ember': '#c8602a', 'bin': '#3a4a3a'}
M = {}; INFO = {}
def reg(n, ps, w, ln, h, note=''): M[n] = ps; INFO[n] = {'w': w, 'len': ln, 'h': h, **({'note': note} if note else {})}
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
# ------------------------------------------------------------------ docks and ramps (the shore end is +z, the water is -z)
def dock(n, L, w=2.0):
    o = []
    for i in range(int(L/0.8)): o.append(bx(0, 0.5, L/2 - 0.4 - i*0.8, w, 0.1, 0.72, 'wood' if i % 2 else 'woodW'))
    for sx in (-1, 1):
        o.append(bx(sx*(w/2 - 0.08), 0.35, 0, 0.12, 0.15, L, 'woodD'))
        for z in range(int(L/2.4) + 1): o.append(bx(sx*(w/2 - 0.08), -0.5, L/2 - 0.2 - z*2.4, 0.14, 1.3, 0.14, 'post'))
    return o
reg('dock_short', dock('s', 4.8), 2.2, 4.8, 1.0, 'a 4.8 m wooden dock on posts; the shore end is +z. Deck 0.5 m above the water.')
reg('dock_long', dock('l', 9.6), 2.2, 9.6, 1.0, 'a 9.6 m wooden dock for a lake or the James River; the shore end is +z')
reg('dock_t', dock('t', 7.2) + [bx(0, 0.5, -3.9 + 0.8*i, 5.6, 0.1, 0.72, 'wood' if i % 2 else 'woodW') for i in range(3)] + [bx(sx*2.7, -0.5, -3.2, 0.14, 1.3, 0.14, 'post') for sx in (-1, 1)], 5.8, 8.4, 1.0, 'a T-shaped dock: a long arm and a cross arm at the water end, for several boats')
reg('boat_ramp', [bx(0, 0, 0, 4.2, 0.08, 8.0, 'concreteD'), hull([(-2.1, 0, 4.0), (2.1, 0, 4.0), (2.1, 0, -4.0), (-2.1, 0, -4.0), (-2.1, 0.02, 4.0), (2.1, 0.02, 4.0), (2.1, -1.2, -4.0), (-2.1, -1.2, -4.0)], 'concrete')] + [box([0, 0.05, z], [4.0, 0.02, 0.05], 'concreteD') for z in (-3, -1.8, -0.6, 0.6, 1.8, 3.0)] + [bx(sx*2.3, 0, 3.8, 0.2, 0.9, 0.2, 'post') for sx in (-1, 1)], 4.6, 8.4, 1.0, 'a concrete boat ramp running into the water (-z) with guide posts; vehicles and boats can use it')
# ------------------------------------------------------------------ boats (float at y = 0, bow to +z)
def boat(L, w, d, c, c2, thwarts=2, oars=False, cabin=False):
    # a hull: flat stern, rounded bottom, a pointed bow at +z; the inside is a darker floor with seats
    o = [hull([(-w*0.32, -0.15, -L/2), (w*0.32, -0.15, -L/2), (w*0.12, -0.15, L/2), (-w*0.12, -0.15, L/2), (-w/2, d, -L/2), (w/2, d, -L/2), (w*0.06, d + 0.12, L/2), (-w*0.06, d + 0.12, L/2)], c)]
    o.append(hull([(-w*0.4, d*0.5, -L/2 + 0.05), (w*0.4, d*0.5, -L/2 + 0.05), (w*0.08, d*0.5, L/2 - 0.35), (-w*0.08, d*0.5, L/2 - 0.35), (-w*0.4, d + 0.02, -L/2 + 0.05), (w*0.4, d + 0.02, -L/2 + 0.05), (w*0.08, d + 0.04, L/2 - 0.35), (-w*0.08, d + 0.04, L/2 - 0.35)], 'hullD'))
    o += [bx(0, d - 0.02, z, w*0.85, 0.07, 0.28, c2) for z in [(-L*0.22 + i*(L*0.3)) for i in range(thwarts)]]
    if oars: o += [seg([sx*w*0.5, d + 0.2, 0.0], [sx*(w*0.5 + 1.4), d + 0.0, 0.3], 0.02, 0.02, 0.02, 0.02, 'woodD') for sx in (-1, 1)]
    return o
reg('rowboat', boat(3.6, 1.4, 0.55, 'hull', 'woodD', 3, True), 1.6, 3.8, 0.9, 'a wooden rowboat with oars out, 3.6 m; floats; can be rowed')
reg('canoe', boat(4.6, 0.9, 0.4, 'aluminium', 'woodD', 2) + [seg([0.0, 0.5, -1.0], [0.4, 0.2, 0.8], 0.02, 0.02, 0.02, 0.02, 'woodD'), box([0.38, 0.1, 0.9], [0.2, 0.04, 0.4], 'woodD')], 1.0, 4.8, 0.7, 'an aluminium canoe with a paddle: the Ozark float-trip boat')
reg('jon_boat', boat(4.2, 1.5, 0.5, 'galv', 'steelD', 3) + [bx(0, 0.45, -1.9, 0.4, 0.5, 0.3, 'steelD')], 1.7, 4.4, 0.9, 'a flat-bottom jon boat with a small outboard on the back: the lake fishing boat')
reg('kayak', [hull([(-0.18, -0.1, -1.6), (0.18, -0.1, -1.6), (0.14, -0.1, 1.2), (-0.14, -0.1, 1.2), (-0.3, 0.2, -1.6), (0.3, 0.2, -1.6), (0.2, 0.25, 1.2), (-0.2, 0.25, 1.2)], 'orange'), tip([0, 0.1, 1.2], [0, 0.25, 1.9], 0.14, 0.1, 'orange', ax='z'), tip([0, 0.1, -1.6], [0, 0.25, -2.0], 0.15, 0.1, 'orange', ax='z'), bx(0, 0.25, -0.2, 0.5, 0.06, 0.7, 'steelD'), seg([-0.9, 0.5, 0], [0.9, 0.3, 0.0], 0.02, 0.02, 0.02, 0.02, 'woodD', ax='x')], 0.7, 4.0, 0.6, 'a one-person kayak with a double paddle')
reg('boat_wreck', [hull([(-0.7, -0.4, -1.8), (0.7, -0.4, -1.8), (0.5, -0.4, 1.0), (-0.5, -0.4, 1.0), (-0.9, 0.3, -1.8), (0.9, 0.3, -1.8), (0.6, 0.2, 1.0), (-0.6, 0.2, 1.0)], 'hullD'), box([0, 0.2, 0], [0.1, 0.6, 3.0], 'woodD'), bx(0.2, 0.1, 0.5, 0.8, 0.1, 0.1, 'rust')], 2.0, 3.8, 0.7, 'a swamped, half-sunk boat: a shoreline wreck with a little loot')
# ------------------------------------------------------------------ water plants (sit on y = 0)
def pads(n, seed, flowers):
    R = random.Random(seed); o = []
    for i in range(n):
        x, z = R.uniform(-1.0, 1.0), R.uniform(-1.0, 1.0); o.append(cyl([x, 0.03, z], [R.uniform(0.4, 0.6), 0.02, R.uniform(0.4, 0.6)], 'pad' if i % 2 else 'padD'))
        if flowers and i % 3 == 0: o.append(cyl([x, 0.08, z], [0.2, 0.08, 0.2], 'flower'))
    return o
reg('lily_pads', pads(9, 1, False), 2.4, 2.4, 0.06, 'a drift of lily pads lying on the water, 2.4 m'); reg('lily_pads_bloom', pads(11, 2, True), 2.6, 2.6, 0.15, 'lily pads with white flowers: summer')
def cattails(n, seed, h):
    R = random.Random(seed); o = []
    for i in range(n):
        x, z = R.uniform(-0.8, 0.8), R.uniform(-0.8, 0.8); hh = h*R.uniform(0.75, 1.1)
        o += [tip([x, 0, z], [x + R.uniform(-0.15, 0.15), hh, z + R.uniform(-0.15, 0.15)], 0.04, 0.012, 'cat' if i % 2 else 'catD'), cyl([x, hh*0.8, z], [0.07, 0.3, 0.07], 'catB')]
    return o
reg('cattails', cattails(7, 3, 1.8), 1.8, 1.8, 1.9, 'a clump of cattails 1.8 m with brown heads, in shallows and ditches'); reg('cattails_small', cattails(4, 4, 1.2), 1.2, 1.2, 1.3, 'a few cattails')
reg('reeds', [tip([x, 0, z], [x + 0.2*math.sin(i), 1.5*(0.8 + 0.2*math.cos(i)), z + 0.2*math.cos(i)], 0.03, 0.01, 'reed' if i % 2 else 'reedD') for i, (x, z) in enumerate([(0.4*math.cos(k), 0.4*math.sin(k*1.3)) for k in range(14)])], 1.2, 1.2, 1.5, 'tall shore reeds and grass, 1.5 m, a thick clump')
reg('duckweed', [box([0, 0.02, 0], [3.0, 0.02, 3.0], 'pad')] + [box([math.cos(k*1.7)*1.0, 0.03, math.sin(k*1.9)*1.0], [0.6, 0.01, 0.6], 'padD') for k in range(6)], 3.0, 3.0, 0.04, 'a green mat of duckweed over a pond: still water')
reg('shore_foam', [box([0, 0.03, 0], [4.0, 0.02, 0.5], 'foam')] + [box([-1.6 + 0.6*k, 0.04, 0.1*(k % 2)], [0.5, 0.02, 0.3], 'foam') for k in range(6)], 4.0, 0.7, 0.05, 'a white line of foam on the water at a shore, 4 m: lays at the tideline; tiles end to end')
reg('ripples', [cyl([0, 0.02, 0], [d, 0.02, d], 'foam') for d in (0.5, 1.2)] if False else [cyl([0, 0.03, 0], [1.4, 0.02, 1.4], 'foam'), cyl([0, 0.04, 0], [1.1, 0.02, 1.1], 'water')], 1.4, 1.4, 0.05, 'a ripple ring where a fish rises: place on pools; fishing spots')
def heron():
    o = [bx(-0.1, 0.7, 0, 0.2, 0.6, 0.25, 'heron'), tip([-0.1, 1.05, 0.02], [-0.15, 1.1, -0.7], 0.14, 0.08, 'heron', ax='z'), seg([-0.05, 1.0, 0.1], [0.2, 1.5, 0.15], 0.04, 0.04, 0.04, 0.04, 'heron'), box([0.2, 1.58, 0.15], [0.1, 0.1, 0.16], 'heronW'), tip([0.2, 1.58, 0.2], [0.2, 1.52, 0.55], 0.03, 0.03, 'beak', ax='z'), box([0.2, 1.62, 0.05], [0.04, 0.02, 0.2], 'heronD')]
    o += [seg([-0.1 + 0.08*s, 0, 0], [-0.1 + 0.08*s, 0.7, 0], 0.02, 0.02, 0.02, 0.02, 'leg') for s in (-1, 1)]
    o += [wedge([-0.1 + 0.2*s, 0.85, -0.05], [0.04, 0.4, 0.5], 'heronD') for s in (-1, 1)]
    return o
reg('heron', heron(), 0.6, 1.0, 1.7, 'a great blue heron standing in the shallows, 1.7 m tall: the sign of fish; it flies off when you come near')
reg('stepping_stones', [rock for rock in [cyl([(-1.2 + 0.8*k), 0.12, 0.2*math.sin(k*2)], [0.6, 0.24, 0.55], 'stone' if k % 2 else 'stoneD') for k in range(7)]], 5.0, 1.0, 0.3, 'a line of flat stepping stones, 0.3 m proud of the water; cross a creek on them')
reg('rope_swing', [cyl([0, 0.1, 0], [0.4, 0.2, 0.4], 'bark', ax='x') if False else bx(0, 0, 0, 0.5, 6.5, 0.5, 'bark'), bx(0.0, 6.0, 1.6, 0.18, 0.18, 3.4, 'bark'), seg([0, 6.0, 2.8], [0, 1.0, 2.8], 0.025, 0.025, 0.025, 0.025, 'rope'), bx(0, 0.8, 2.8, 0.5, 0.1, 0.2, 'wood'), box([0, 6.0, 0], [0.9, 0.5, 0.9], 'bark')], 1.2, 4.0, 6.5, 'a tree stub with a limb out over the water and a rope with a seat: swing and let go into a swimming hole')
# ------------------------------------------------------------------ bridges and trail furniture
reg('footbridge', [bx(0, 0.5, 0, 1.6, 0.12, 8.0, 'wood')] + [bx(0, 0.4, 0, 0.15, 0.3, 8.2, 'woodD', ) if False else bx(sx*0.7, 0.2, 0, 0.18, 0.3, 8.2, 'woodD') for sx in (-1, 1)] + [bx(sx*0.78, 0.6, z, 0.1, 1.0, 0.1, 'post') for sx in (-1, 1) for z in (-3.8, -1.9, 0, 1.9, 3.8)] + [bx(sx*0.78, 1.5, 0, 0.1, 0.1, 7.8, 'woodW') for sx in (-1, 1)] + [bx(sx*0.78, 1.0, 0, 0.06, 0.06, 7.8, 'woodW') for sx in (-1, 1)] + [bx(sx*0.8, -0.4, sz*3.5, 0.5, 0.9, 0.5, 'concreteD') for sx in (-1, 1) for sz in (-1, 1)], 2.0, 8.2, 2.0, 'a plank footbridge 8 m long and 1.6 m wide with handrails over a creek or a gully; the deck is 0.5 m above the water')
reg('picnic_table', [bx(0, 0.72, 0, 1.8, 0.08, 0.75, 'wood')] + [bx(0, 0.42, z, 1.8, 0.08, 0.28, 'wood') for z in (-0.6, 0.6)] + [seg([x, 0.0, -0.6], [x*0.7, 0.72, 0.0], 0.04, 0.04, 0.04, 0.04, 'woodD') for x in (-0.7, 0.7)] + [seg([x, 0.0, 0.6], [x*0.7, 0.72, 0.0], 0.04, 0.04, 0.04, 0.04, 'woodD') for x in (-0.7, 0.7)], 1.9, 1.9, 0.85, 'a picnic table with two benches: parks and trailheads')
reg('bench', [bx(0, 0.45, 0, 1.6, 0.08, 0.45, 'wood'), bx(0, 0.7, -0.22, 1.6, 0.4, 0.06, 'wood')] + [bx(x, 0, 0, 0.08, 0.45, 0.4, 'steelD') for x in (-0.7, 0.7)], 1.7, 0.5, 1.0, 'a park bench facing +z, a place to sit and look at the water')
reg('fire_ring', [rock for rock in [cyl([math.cos(k*0.785)*0.55, 0.12, math.sin(k*0.785)*0.55], [0.3, 0.24, 0.3], 'stone' if k % 2 else 'stoneD') for k in range(8)]] + [cyl([0, 0.05, 0], [0.9, 0.1, 0.9], 'ash'), cyl([0, 0.12, 0], [0.4, 0.06, 0.4], 'ember')] + [seg([-0.3, 0.1, 0.1], [0.3, 0.25, -0.1], 0.04, 0.04, 0.04, 0.04, 'bark')], 1.6, 1.6, 0.3, 'a ring of stones around ash and a few coals: a campsite and cooking spot; you can light it')
reg('grill_post', [bx(0, 0, 0, 0.12, 0.8, 0.12, 'steelD'), bx(0, 0.8, 0, 0.8, 0.12, 0.6, 'steel'), box([0, 0.95, 0], [0.7, 0.02, 0.5], 'ash')], 0.9, 0.7, 0.95, 'a park charcoal grill on a post')
reg('trail_marker', [bx(0, 0, 0, 0.12, 1.2, 0.12, 'post'), bx(0, 1.0, 0.07, 0.3, 0.2, 0.03, 'signG'), box([0, 1.1, 0.09], [0.12, 0.02, 0.01], 'signT')], 0.4, 0.3, 1.3, 'a green trail marker post: a name every few hundred metres; with trail_marker_arrow shows turns')
reg('trail_marker_arrow', [bx(0, 0, 0, 0.12, 1.4, 0.12, 'post'), wedge([0.0, 1.1, 0.08], [0.5, 0.25, 0.03], 'signG')], 0.7, 0.3, 1.4, 'a trail post with an arrow board; mirror (scale.x = -1) to point the other way')
reg('trailhead_sign', [bx(sx*0.9, 0, 0, 0.15, 2.0, 0.15, 'post') for sx in (-1, 1)] + [bx(0, 1.0, 0, 1.9, 1.0, 0.08, 'sign'), bx(0, 1.15, 0.05, 1.6, 0.7, 0.03, 'signT'), bx(0, 1.8, 0.0, 2.2, 0.12, 0.3, 'woodD'), box([-0.4, 1.3, 0.07], [0.5, 0.3, 0.01], 'signG')] + [box([0.3, 1.0 + 0.15*k, 0.07], [0.5, 0.05, 0.01], 'signG') for k in range(3)], 2.2, 0.5, 2.1, 'a trailhead board with a map under a little roof: a start of a trail; add a parking pad beside it')
reg('trash_bin', [cyl([0, 0.45, 0], [0.7, 0.9, 0.7], 'bin'), cyl([0, 0.93, 0], [0.76, 0.06, 0.76], 'steelD'), box([0, 0.78, 0.32], [0.4, 0.2, 0.04], 'ash')], 0.8, 0.8, 1.0, 'a park trash can: scraps and cans')
reg('info_kiosk', [bx(sx*1.1, 0, 0, 0.18, 2.2, 0.18, 'post') for sx in (-1, 1)] + [bx(0, 1.0, 0, 2.4, 1.2, 0.1, 'woodD'), bx(0, 1.1, 0.06, 2.0, 0.9, 0.03, 'signT'), solid([(-1.6, 2.2, -0.5), (1.6, 2.2, -0.5), (0, 2.8, -0.5), (-1.6, 2.2, 0.5), (1.6, 2.2, 0.5), (0, 2.8, 0.5)], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], 'woodD')], 3.4, 1.2, 2.8, 'a larger park information kiosk with a roof: a map of the park and its rules; text goes on the board')
pack = {'name': 'waterside', 'version': 1, 'style': 'boxes, hulls and tips; flat colours; water plants lie on the water as flat discs', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base',
        'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': {'waterside': M}, 'info': INFO,
        'rule': ('Shores: at every shore line lay shore_foam where the water meets the bank, reeds and cattails in the shallows on the slow (inside) side of a bend, lily_pads and duckweed on ponds and slow water only, and a heron or two at the head of a pool. '
                 'A dock, ramp or boat appears only where the data says so (leisure=marina, man_made=pier, a boat_ramp, a lake edge with a house or a park); rowboats, canoes and kayaks lie on the bank beside a dock or ramp, jon_boat on a lake. '
                 'Trails (highway=path or footway in a park or woods): trail_marker every 150 to 300 m, trail_marker_arrow at forks, trailhead_sign and picnic_table at the start and at parks, bench at viewpoints and beside water, fire_ring at camps. footbridge where a path crosses a stream or gully; stepping_stones where a trail fords a creek. '
                 'rope_swing on one big tree on a deep pool.')}
out, st = write_pack('waterside', pack, __file__)
t = [v[0] for v in st.values()]; print(len(t), 'models', min(t), '-', max(t)); print({k.split('.')[1]: v[0] for k, v in st.items() if v[0] > 250})
