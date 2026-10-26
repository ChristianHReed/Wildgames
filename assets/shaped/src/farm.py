#!/usr/bin/env python3
"""Afterstreet farm pack, version 1 (26 October 2026): the working countryside around Springfield: crop fields, hay, fences, gates, troughs and the farm buildings.
Writes assets/shaped/farm.js. Run: python3 assets/shaped/src/farm.py

models.farm.<name>, metres, origin at the centre of the base, front facing +Z.
Fields: crop_* are 4 x 4 m tiles of rows (corn, wheat, soy, ploughed, stubble, harvested, pumpkin, sunflower; <name>_fall is the autumn colour where it differs). Tile them; rows run along z.
Hay and yard: bale_round, bale_square, bale_stack, haystack, scarecrow, feed_trough, water_trough, mailbox, pivot_span (an irrigation span), grain_cart.
Fences: fence_wire_4, fence_wire_post, fence_wire_corner, fence_rail_4, fence_rail_gap, gate_field, gate_farm, cattle_guard. 4 m long along x, centre.
Buildings: barn_red (open loft door, 12 x 16), barn_old (weathered, leaning), silo, grain_bin, machine_shed, coop, windmill, farmhouse_sign, well_house, pond_dock, tractor, hay_wagon, flatbed.
Colour names are in the palette."""
import math, random
from kit import *
P = {'corn1': '#8aa040', 'corn2': '#6e8a30', 'cornD': '#a89a48', 'cornF': '#c8a840', 'cornFD': '#8a6a30', 'ear': '#d8c050', 'wheat': '#d8b858', 'wheatG': '#a8b048', 'wheatS': '#b89a40', 'soy': '#6a9a3a', 'soyF': '#c89a2a', 'soyD': '#58862f', 'earth': '#5a4634', 'earthL': '#7a6048', 'earthD': '#42342a', 'stub': '#b89a58', 'stubD': '#8a7440',
     'pump': '#d86a1a', 'pumpV': '#4a6a28', 'sun': '#e8b820', 'sunC': '#4a3220', 'sunS': '#4a7a30', 'hay': '#d4b45a', 'hayD': '#a8883c', 'hayL': '#e8cc78', 'twine': '#7a5a2a', 'wood': '#9a7a52', 'woodD': '#6e5238', 'woodW': '#b8a888', 'post': '#7a6048', 'wire': '#8a8c90', 'steel': '#6a7078', 'steelD': '#4a4e54', 'galv': '#a8acb2', 'rust': '#8a4a2a',
     'red': '#a8342a', 'redD': '#7a2820', 'white': '#e8e4da', 'barnG': '#7a6e5c', 'barnGD': '#5a5042', 'roof': '#6a6e72', 'roofD': '#4a4e52', 'roofR': '#8a4a32', 'dark': '#16171a', 'concrete': '#a8a69e', 'water': '#4a7a90', 'waterD': '#35606f', 'glass': '#8aa8b8',
     'green': '#3a6a3a', 'greenD': '#2a4a2a', 'yellow': '#d8b020', 'tire': '#24262a', 'scare': '#6a5a3a', 'scareH': '#c8a860', 'shirt': '#4a6a8a', 'hat': '#4a3a2a', 'coop': '#a8483a', 'box': '#3a4a5a', 'flag': '#c82a22', 'feed': '#6a6a60'}
M = {}; INFO = {}
def reg(n, ps, w, ln, h, note=''): M[n] = ps; INFO[n] = {'w': w, 'len': ln, 'h': h, **({'note': note} if note else {})}
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def gable(w, d, y0, wall_h, rise, wc, rc, overhang=0.4, ridge_x=True):
    """a gabled body: walls to wall_h and a roof above; ridge along z"""
    o = [bx(0, y0, 0, w, wall_h, d, wc)]
    hw = w/2 + overhang
    o.append(hull([(-hw, y0 + wall_h, -d/2 - overhang), (hw, y0 + wall_h, -d/2 - overhang), (hw, y0 + wall_h, d/2 + overhang), (-hw, y0 + wall_h, d/2 + overhang),
                   (-0.12, y0 + wall_h + rise, -d/2 - overhang), (0.12, y0 + wall_h + rise, -d/2 - overhang), (0.12, y0 + wall_h + rise, d/2 + overhang), (-0.12, y0 + wall_h + rise, d/2 + overhang)], rc)) if False else None
    o = [x for x in o if x]
    o.append(solid([(-hw, y0 + wall_h, -d/2 - overhang), (hw, y0 + wall_h, -d/2 - overhang), (0, y0 + wall_h + rise, -d/2 - overhang), (-hw, y0 + wall_h, d/2 + overhang), (hw, y0 + wall_h, d/2 + overhang), (0, y0 + wall_h + rise, d/2 + overhang)],
                   [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], rc))
    return o
# ------------------------------------------------------------------ fields (4 x 4 m tiles, rows along z)
def rows(base, n, plant, h, w, seed, extra=None, spread=0.1):
    R = random.Random(seed); o = [box([0, 0.03, 0], [4, 0.06, 4], base)]
    for i in range(n):
        x = -2 + (i + 0.5)*4/n
        o.append(box([x, 0.07, 0], [w*0.5, 0.08, 3.9], 'earthL' if base != 'stub' else 'stubD'))
        for z in (-1.0, 1.0):
            jz = z + R.uniform(-spread, spread)
            o.append(box([x, h/2 + 0.08, jz], [w, h, 1.7], plant[(i + int(z)) % len(plant)]))
    if extra: o += extra(R)
    return o
def corn(fall):
    c = ['cornF', 'cornFD', 'cornF'] if fall else ['corn1', 'corn2', 'corn1']
    def ex(R): return [box([-2 + (i + 0.5)*4/5 + 0.1, 1.1, z], [0.12, 0.22, 0.12], 'ear') for i in range(5) for z in (-1.0, 1.0)]
    return rows('earth', 5, c, 2.0, 0.5, 1, ex)
reg('crop_corn', corn(False), 4, 4, 2.0, 'corn: five rows, 2 m tall, ears showing'); reg('crop_corn_fall', corn(True), 4, 4, 2.0, 'dry brown corn before harvest')
reg('crop_wheat', rows('earth', 8, ['wheatG', 'wheat', 'wheatG'], 0.9, 0.3, 2), 4, 4, 0.9, 'wheat: eight rows, green-gold, 0.9 m'); reg('crop_wheat_fall', rows('earth', 8, ['wheat', 'wheatS', 'wheat'], 0.9, 0.3, 3), 4, 4, 0.9, 'ripe golden wheat')
reg('crop_soy', rows('earth', 8, ['soy', 'soyD', 'soy'], 0.7, 0.35, 4), 4, 4, 0.7, 'soybeans: bushy rows, 0.7 m'); reg('crop_soy_fall', rows('earth', 8, ['soyF', 'wheatS', 'soyF'], 0.7, 0.35, 5), 4, 4, 0.7, 'yellowed soybeans ready to cut')
reg('crop_ploughed', [box([0, 0.03, 0], [4, 0.06, 4], 'earthD')] + [box([-1.75 + i*0.5, 0.12, 0], [0.28, 0.14, 3.95], 'earth') for i in range(8)] + [box([-1.75 + i*0.5 + 0.25, 0.07, 0], [0.2, 0.05, 3.95], 'earthD') for i in range(7)], 4, 4, 0.2, 'freshly ploughed furrows')
reg('crop_stubble', rows('stub', 6, ['stub', 'stubD'], 0.2, 0.2, 6, spread=0.2), 4, 4, 0.25, 'cut-stalk stubble after harvest')
reg('crop_harvested', [box([0, 0.03, 0], [4, 0.06, 4], 'earthL')] + [box([-1.8 + i*0.4, 0.07, 0], [0.12, 0.06, 3.9], 'stub') for i in range(10)], 4, 4, 0.1, 'a field after harvest: pale ground with drill lines')
def pumpkin():
    R = random.Random(8); o = [box([0, 0.03, 0], [4, 0.06, 4], 'earth')]
    for i in range(7):
        x, z = R.uniform(-1.6, 1.6), R.uniform(-1.6, 1.6); o += [cyl([x, 0.25, z], [0.55, 0.4, 0.55], 'pump'), box([x, 0.5, z], [0.08, 0.1, 0.08], 'pumpV'), box([x + 0.5, 0.1, z], [0.7, 0.04, 0.06], 'pumpV', ry=R.choice([0, 1]))]
    return o
reg('crop_pumpkin', pumpkin(), 4, 4, 0.5, 'a pumpkin patch with vines: a seasonal food crop')
reg('crop_sunflower', rows('earth', 4, ['sunS'], 1.9, 0.12, 9, lambda R: [x for i in range(4) for z in (-1.0, 1.0) for x in (cyl([-2 + (i + 0.5), 2.0, z + 0.1], [0.5, 0.12, 0.5], 'sun', ax='z'), cyl([-2 + (i + 0.5), 2.0, z + 0.14], [0.26, 0.1, 0.26], 'sunC', ax='z'))]), 4, 4, 2.1, 'sunflowers: four rows, 2 m, heads turned to the sun')
# ------------------------------------------------------------------ hay and yard
def bale_round(c): return [cyl([0, 0.7, 0], [1.4, 1.2, 1.4], c, ax='x'), cyl([0.62, 0.7, 0], [1.0, 0.1, 1.0], 'hayL', ax='x'), cyl([0, 0.7, 0], [1.42, 0.06, 1.42], 'twine', ax='x'), cyl([0, 0.7, 0.3], [1.42, 0.06, 1.42], 'twine', ax='x')]
reg('bale_round', bale_round('hay'), 1.4, 1.4, 1.4, 'a round hay bale 1.4 m across; you can climb it'); reg('bale_round_wrapped', [cyl([0, 0.7, 0], [1.4, 1.2, 1.4], 'white', ax='x'), cyl([0.62, 0.7, 0], [1.0, 0.08, 1.0], 'galv', ax='x')], 1.4, 1.4, 1.4, 'a plastic-wrapped silage bale')
reg('bale_square', [bx(0, 0, 0, 0.9, 0.5, 1.2, 'hay')] + [bx(0, 0.0, z, 0.92, 0.52, 0.03, 'twine') for z in (-0.3, 0.3)] + [bx(0.2, 0.5, 0, 0.3, 0.03, 1.0, 'hayL')], 0.9, 1.2, 0.5, 'a small square bale, 0.9 x 0.5 x 1.2 m')
reg('bale_stack', [bx(x, 0, z, 0.9, 0.5, 1.2, 'hay') for x in (-0.46, 0.46) for z in (-0.6, 0.6)] + [bx(x, 0.5, 0, 0.9, 0.5, 1.2, 'hayD') for x in (-0.46, 0.46)] + [bx(0, 1.0, 0, 0.9, 0.5, 1.2, 'hay')], 1.9, 2.5, 1.5, 'a stack of eighteen square bales; you can climb it')
reg('haystack', [loft([[0, 0, 0, 1.7, 1.7], [0, 1.1, 0, 1.4, 1.4], [0, 2.1, 0, 0.7, 0.7], [0, 2.7, 0, 0, 0]], 'hay', n=7, caps=[True, False]), loft([[0, 0.5, 0, 1.75, 1.75], [0, 0.56, 0, 1.75, 1.75]], 'hayD', n=7, caps=[False, False])], 3.4, 3.4, 2.7, 'a loose haystack, 2.7 m, for a field in the old way')
reg('scarecrow', [bx(0, 0, 0, 0.1, 1.8, 0.1, 'woodD'), bx(0, 1.25, 0, 1.4, 0.1, 0.1, 'woodD'), bx(0, 0.95, 0, 0.5, 0.65, 0.22, 'shirt'), bx(-0.55, 1.05, 0, 0.35, 0.3, 0.14, 'shirt'), bx(0.55, 1.05, 0, 0.35, 0.3, 0.14, 'shirt'), box([0, 1.82, 0], [0.3, 0.3, 0.3], 'scareH'), cyl([0, 1.98, 0], [0.55, 0.05, 0.55], 'hat'), cyl([0, 2.08, 0], [0.3, 0.2, 0.3], 'hat')] + [tip([0.0 + 0.1*k, 0.55, 0.12], [0.12*k - 0.1, 0.2, 0.2], 0.04, 0.02, 'scare') for k in range(3)], 1.5, 0.5, 2.2, 'a scarecrow on a post in a shirt and a hat: a landmark in a field; ravens still land on it')
reg('feed_trough', [bx(0, 0.5, 0, 2.2, 0.15, 0.6, 'woodD'), bx(0, 0.5, -0.3, 2.2, 0.35, 0.08, 'wood'), bx(0, 0.5, 0.3, 2.2, 0.35, 0.08, 'wood'), bx(-1.05, 0, 0, 0.08, 0.5, 0.6, 'woodD'), bx(1.05, 0, 0, 0.08, 0.5, 0.6, 'woodD'), bx(0, 0.62, 0, 2.0, 0.1, 0.4, 'hayD')], 2.4, 0.8, 0.9, 'a wooden feed trough with hay in it: where cattle and deer come')
reg('water_trough', [bx(0, 0, 0, 2.4, 0.7, 0.8, 'galv'), bx(0, 0.5, 0, 2.2, 0.22, 0.6, 'water'), bx(0, 0.1, 0, 2.5, 0.08, 0.9, 'steelD')], 2.5, 0.9, 0.7, 'a galvanised water trough, full: you can drink')
reg('mailbox', [bx(0, 0, 0, 0.12, 1.1, 0.12, 'post'), bx(0, 1.1, 0, 0.3, 0.3, 0.55, 'box'), bx(0.18, 1.3, -0.1, 0.03, 0.2, 0.08, 'flag')], 0.6, 0.6, 1.4, 'a rural mailbox on a post, by the road at each farm gate')
def pivot():
    o = [bx(0, 0, 0, 0.9, 3.2, 0.9, 'galv'), bx(0, 3.0, 0, 1.1, 0.3, 1.1, 'steel')]
    for k in range(5): o += [seg([k*4.0, 3.0, 0], [(k+1)*4.0, 3.0, 0], 0.1, 0.1, 0.1, 0.1, 'galv'), bx((k+1)*4.0, 0, 0, 0.3, 3.0, 0.1, 'galv'), bx((k+1)*4.0, 0, 0, 0.5, 0.2, 0.5, 'steelD')]
    return o
reg('pivot_span', [bx(x, 0, 0, 0.6, 0.15, 1.6, 'steelD') for x in (4.0, 8.0, 12.0, 16.0)] + [seg([0, 3.1, 0], [20, 3.1, 0], 0.12, 0.12, 0.12, 0.12, 'galv'), bx(0, 0, 0, 0.8, 3.0, 0.8, 'galv')] + [bx(x, 0, 0, 0.12, 3.0, 0.12, 'galv') for x in (4.0, 8.0, 12.0, 16.0, 19.9)] + [bx(x, 0, 0, 0.5, 0.5, 0.5, 'steelD') for x in (19.9,)] + [tip([x, 3.0, 0], [x, 2.2, 0], 0.03, 0.03, 'steel') for x in range(2, 20, 2)], 20, 1.6, 3.4, 'a centre-pivot irrigation span, 20 m: the circles seen from the air. Stands at its pivot (x = 0); place several in a ring or rotate it')
reg('grain_cart', [bx(0, 0.6, 0, 2.2, 1.4, 3.6, 'green'), bx(0, 0.5, 0, 2.3, 0.2, 3.7, 'greenD')] + [cyl([sx*1.25, 0.5, z], [1.0, 0.4, 1.0], 'tire', ax='x') for sx in (-1, 1) for z in (-1.0, 1.0)] + [tip([0, 2.0, -1.8], [0, 2.6, -0.4], 0.0, 0.0, 'yellow') if False else bx(0, 1.4, 0.5, 1.9, 0.6, 1.4, 'wheatS')], 2.8, 3.8, 2.0, 'a grain cart full of wheat')
# ------------------------------------------------------------------ fences (4 m along x, centred on the origin, y up)
def post(x, h=1.3, c='post'): return bx(x, 0, 0, 0.14, h, 0.14, c)
def wire(h, n=4): return [seg([-2, 0.4 + 0.3*i, 0], [2, 0.4 + 0.3*i, 0], 0.012, 0.012, 0.012, 0.012, 'wire') for i in range(n)]
reg('fence_wire_4', [post(-2), post(2), post(0, 1.2)] + wire(1.3), 4, 0.2, 1.3, 'a barbed wire fence, 4 m between posts, four strands: stops vehicles, a person can climb it (or cut it)')
reg('fence_wire_post', [post(0)] + [seg([0.0, 0.4 + 0.3*i, 0], [0.5, 0.4 + 0.3*i, 0], 0.012, 0.012, 0.012, 0.012, 'wire') for i in range(4)], 0.5, 0.2, 1.3, 'a lone fence post with the wire stubs, for breaks')
reg('fence_wire_corner', [bx(0, 0, 0, 0.3, 1.5, 0.3, 'post'), seg([0.2, 0.2, 0], [2, 1.0, 0.0], 0.04, 0.04, 0.04, 0.04, 'woodD')] + [seg([0, 0.4 + 0.3*i, 0], [2, 0.4 + 0.3*i, 0], 0.012, 0.012, 0.012, 0.012, 'wire') for i in range(4)] + [seg([0, 0.4 + 0.3*i, 0], [0, 0.4 + 0.3*i, 2], 0.012, 0.012, 0.012, 0.012, 'wire') for i in range(4)] + [bx(0, 0, 2, 0.14, 1.3, 0.14, 'post'), bx(2, 0, 0, 0.14, 1.3, 0.14, 'post')], 2.2, 2.2, 1.5, 'a braced wire-fence corner post, corner at the origin, runs +x and +z')
reg('fence_rail_4', [post(-2, 1.2, 'woodD'), post(2, 1.2, 'woodD')] + [bx(0, y, 0, 4.0, 0.12, 0.1, 'wood') for y in (0.35, 0.7, 1.05)], 4, 0.2, 1.3, 'a split-rail fence in four metres, three rails')
reg('fence_rail_gap', [post(-2, 1.2, 'woodD'), bx(1.0, 0.35, 0, 1.8, 0.12, 0.1, 'wood'), bx(1.4, 0.0, 0.2, 2.0, 0.12, 0.1, 'wood'), post(-2 + 3.6, 1.1, 'woodD')], 4, 0.6, 1.3, 'a broken rail fence: rails down, where deer and survivors cross')
reg('gate_field', [post(-1.6, 1.4), post(1.6, 1.4)] + [bx(0, y, 0, 3.0, 0.08, 0.06, 'galv') for y in (0.4, 0.75, 1.1)] + [seg([-1.5, 0.4, 0], [1.5, 1.1, 0], 0.03, 0.03, 0.03, 0.03, 'galv'), bx(-1.4, 0.4, 0, 0.06, 0.8, 0.06, 'galv'), bx(1.4, 0.4, 0, 0.06, 0.8, 0.06, 'galv')], 3.6, 0.3, 1.4, 'a tube-steel field gate, 3 m wide, closed: opens as a door')
reg('gate_farm', [bx(-2.1, 0, 0, 0.35, 2.6, 0.35, 'woodD'), bx(2.1, 0, 0, 0.35, 2.6, 0.35, 'woodD'), bx(0, 2.4, 0, 4.6, 0.3, 0.3, 'woodD'), bx(0, 2.7, 0, 3.0, 0.3, 0.2, 'red')] + [bx(-0.9, 0.2, 0, 0.1, 1.4, 0.06, 'woodW'), bx(0.9, 0.2, 0, 0.1, 1.4, 0.06, 'woodW')] + [bx(0, 0.35 + 0.35*i, 0, 1.8, 0.1, 0.06, 'woodW') for i in range(4)], 4.6, 0.4, 3.0, 'a farm entrance with a header beam and a sign board: the way into a farm yard')
reg('cattle_guard', [bx(0, 0, 0, 3.4, 0.1, 2.4, 'steelD')] + [bx(0, 0.1, -1.0 + 0.4*i, 3.2, 0.08, 0.1, 'steel') for i in range(6)], 3.4, 2.4, 0.2, 'a cattle guard across a farm drive: rails over a pit')
# ------------------------------------------------------------------ buildings
barn_roof = [solid([(-6.8, 5.5, -9.0), (6.8, 5.5, -9.0), (0, 9.6, -9.0), (-6.8, 5.5, 9.0), (6.8, 5.5, 9.0), (0, 9.6, 9.0)], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], 'roof')]
def barn(old=False):
    wc = 'barnG' if old else 'red'; o = [bx(0, 0, 0, 12, 5.5, 16, wc)] + barn_roof
    o += [bx(0, 0, 8.02, 12, 0.6, 0.04, 'white'), bx(0, 5.2, 8.02, 12, 0.3, 0.06, 'white')]
    o += [solid([(-6.0, 5.5, 8.0), (6.0, 5.5, 8.0), (0, 9.2, 8.0)], [[0, 1, 2]], wc), bx(0, 6.3, 8.05, 2.4, 2.0, 0.08, 'dark'), bx(0, 6.3, 8.1, 2.6, 0.1, 0.06, 'white')]
    o += [bx(-2.2, 0, 8.05, 4.2, 4.0, 0.1, 'redD' if not old else 'barnGD'), bx(2.2, 0, 8.05, 4.2, 4.0, 0.1, 'redD' if not old else 'barnGD')] + [seg([-4.2, 0.2, 8.12], [-0.2, 3.8, 8.12], 0.08, 0.04, 0.08, 0.04, 'white'), seg([4.2, 0.2, 8.12], [0.2, 3.8, 8.12], 0.08, 0.04, 0.08, 0.04, 'white')]
    o += [box([6.02, 3.0, z], [0.04, 1.0, 1.2], 'dark') for z in (-5, 0, 5)]
    if old: o += [bx(0, 0, -8.02, 12, 5.0, 0.05, 'barnGD', ry=0), bx(2.0, 6.0, 8.1, 1.2, 1.6, 0.04, 'barnGD')]
    return o
reg('barn_red', barn(), 14, 18, 9.6, 'a big red barn, 12 x 16 m: double doors in front (+z), a hay-loft door above, a gable roof; the interior is a separate piece')
reg('barn_old', barn(True), 14, 18, 9.6, 'a weathered grey barn: the same body, paint gone, one panel missing in the loft')
reg('silo', [cyl([0, 4.5, 0], [4.0, 9.0, 4.0], 'concrete'), loft([[0, 9, 0, 2.0, 2.0], [0, 9.8, 0, 1.6, 1.6], [0, 10.4, 0, 0.7, 0.7], [0, 10.7, 0, 0, 0]], 'roof', n=10, caps=[False, False])] + [cyl([0, 1.0 + 1.6*k, 0], [4.08, 0.1, 4.08], 'steelD') for k in range(5)] + [bx(0, 0.2, 2.0, 0.6, 1.6, 0.1, 'steel')], 4.4, 4.4, 10.7, 'a concrete grain silo, 4 m wide and 10.7 m tall, banded with steel hoops')
reg('grain_bin', [cyl([0, 2.0, 0], [7.0, 4.0, 7.0], 'galv'), loft([[0, 4, 0, 3.7, 3.7], [0, 5.5, 0, 0, 0]], 'galv', n=12, caps=[True, False])] + [cyl([0, 0.9 + 1.0*k, 0], [7.06, 0.06, 7.06], 'steel') for k in range(4)] + [bx(0, 0, 3.5, 1.0, 1.5, 0.06, 'steelD'), tip([2.0, 4.0, 3.2], [2.0, 0.4, 3.3], 0.18, 0.04, 'steel')], 7.4, 7.4, 5.5, 'a corrugated steel grain bin 7 m wide, with a ladder and a door')
reg('machine_shed', gable(10, 14, 0, 4.2, 1.8, 'galv', 'roof', 0.4) + [bx(-2.5, 0, 7.02, 4.0, 3.4, 0.06, 'steelD'), bx(2.5, 0, 7.02, 4.0, 3.4, 0.06, 'steelD'), box([-5.02, 2.5, 0], [0.04, 0.8, 5], 'glass')] + [bx(x, 0, z, 0.2, 4.2, 0.2, 'steel') for x in (-5, 5) for z in (-7, 7)], 11, 15, 6, 'a steel machine shed 10 x 14 m: two big doors in front')
reg('coop', gable(2.6, 3.2, 0.6, 1.4, 0.7, 'coop', 'roofR', 0.2) + [bx(x, 0, z, 0.1, 0.6, 0.1, 'woodD') for x in (-1.2, 1.2) for z in (-1.4, 1.4)] + [box([0, 1.0, 1.62], [0.5, 0.6, 0.04], 'dark'), wedge([0, 0.3, 2.2], [0.5, 0.6, 1.0], 'woodD', ry=0), box([0, 1.6, 1.62], [1.6, 0.1, 0.06], 'white')], 3.2, 4.4, 2.7, 'a henhouse on legs with a ramp: chickens and eggs')
def windmill():
    o = [cyl([0, 0.5, 0], [0.35, 1.0, 0.35], 'steelD')]
    for sx in (-1, 1):
        for sz in (-1, 1): o.append(seg([sx*1.3, 0, sz*1.3], [sx*0.35, 9.0, sz*0.35], 0.08, 0.08, 0.06, 0.06, 'galv'))
    for y in (2.5, 5.0, 7.5): o.append(bx(0, y, 0, 1.6 - y*0.12, 0.08, 1.6 - y*0.12, 'steel'))
    o += [bx(0, 9.0, 0.3, 0.5, 0.5, 1.0, 'galv'), seg([0, 9.2, 0.8], [0, 9.2, 3.0], 0.03, 0.2, 0.03, 0.2, 'steel', ax='z')]
    for k in range(8): a = k*math.pi/4; o.append(tip([math.cos(a)*0.4, 9.2 + math.sin(a)*0.4, 0.8], [math.cos(a)*2.4, 9.2 + math.sin(a)*2.4, 0.8], 0.12, 0.02, 'galv', ax='x') if False else box([math.cos(a)*1.4, 9.2 + math.sin(a)*1.4, 0.85], [0.45, 0.45, 0.03], 'galv'))
    o += [bx(0, 0, 0, 1.4, 0.3, 1.4, 'concrete'), bx(0, 0.0, 0, 0.9, 2.0, 0.06, 'galv')]
    return o
reg('windmill', windmill(), 3.0, 3.0, 11.0, 'a farm windmill tower, 11 m: a landmark that pumps water; the wheel faces +z')
reg('well_house', gable(2.0, 2.0, 0.4, 1.6, 0.8, 'woodW', 'roofR', 0.2) + [bx(0, 0, 0, 2.2, 0.4, 2.2, 'concrete'), box([0, 1.0, 1.02], [0.8, 1.0, 0.04], 'dark')], 2.6, 2.6, 2.8, 'a small wellhouse over a hand-dug well: water for a farm; the door faces +z')
reg('pond_dock', [bx(0, 0.6, z, 2.0, 0.1, 0.8, 'wood') for z in (-3.2, -2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4)] + [bx(sx*0.9, 0, z, 0.14, 0.7, 0.14, 'woodD') for sx in (-1, 1) for z in (-3.2, -0.8, 1.6, 2.8)], 2.4, 6.4, 0.75, 'a short wooden pier for a farm pond or lake: 6.4 m long on posts; the shore end is +z')
def tractor():
    o = [bx(0, 0.7, 0.6, 1.2, 1.0, 2.0, 'green'), bx(0, 1.5, -0.4, 1.4, 1.5, 1.4, 'greenD'), box([0, 2.3, -0.4], [1.5, 0.1, 1.5], 'greenD'), box([0, 1.85, -0.4], [1.2, 0.9, 1.25], 'glass'), box([0.5, 1.6, 1.0], [0.1, 0.1, 0.1], 'yellow'), cyl([0.3, 2.0, 1.4], [0.1, 1.2, 0.1], 'steelD')]
    o += [cyl([sx*0.85, 0.8, -0.8], [1.6, 0.4, 1.6], 'tire', ax='x') for sx in (-1, 1)] + [cyl([sx*0.8, 0.45, 1.6], [0.9, 0.3, 0.9], 'tire', ax='x') for sx in (-1, 1)] + [cyl([sx*0.85, 0.8, -0.8], [0.8, 0.43, 0.8], 'yellow', ax='x') for sx in (-1, 1)]
    return o
reg('tractor', tractor(), 2.6, 4.2, 3.0, 'a green tractor with a cab: has a seat and a key slot; the front faces +z')
reg('hay_wagon', [bx(0, 0.6, 0, 2.4, 0.15, 4.8, 'woodD')] + [bx(sx*1.2, 0.75, 0, 0.08, 0.6, 4.8, 'wood') for sx in (-1, 1)] + [cyl([sx*1.2, 0.4, z], [0.8, 0.2, 0.8], 'tire', ax='x') for sx in (-1, 1) for z in (-1.7, 1.7)] + [tip([0, 0.6, 2.4], [0, 0.3, 4.2], 0.08, 0.04, 'steelD', ax='z')] + [bx(x, 0.75, z, 0.9, 0.5, 1.2, 'hay') for x in (-0.5, 0.5) for z in (-1.3, 0, 1.3)], 2.6, 6.2, 1.5, 'a flat wooden hay wagon with square bales on it, with a tow bar')
reg('flatbed', [bx(0, 0.9, 0, 2.4, 0.15, 4.4, 'woodD'), bx(0, 0.5, 0, 2.0, 0.4, 4.4, 'steelD')] + [cyl([sx*1.1, 0.45, z], [0.9, 0.3, 0.9], 'tire', ax='x') for sx in (-1, 1) for z in (-1.4, 1.4)] + [bx(0, 1.05, 2.0, 2.3, 0.7, 0.1, 'rust')], 2.6, 5.0, 1.8, 'a rusted flatbed farm trailer with a headboard')
pack = {'name': 'farm', 'version': 1, 'style': 'rows of boxes for crops, boxes and simple lofts for buildings; flat colours', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base',
        'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': {'farm': M}, 'info': INFO,
        'rule': ('A farm has a plan: the house and yard first, the barn and sheds beside the drive, the silo or grain bin by the barn, then fields in big blocks behind them with a fence around each and a gate where the drive or a track meets it. '
                 'Fields: lay crop_* tiles in blocks of at least 4 x 8 tiles with the rows running the same way; mix crops by field, not by tile; use _fall in autumn and crop_stubble or crop_harvested after harvest and crop_ploughed in winter and spring. '
                 'Scatter bale_round on harvested and stubble fields (2 to 6 per hectare), bale_stack beside the barn, a scarecrow in a garden or crop field. Fences run along field edges with a gate_field at each field corner and gate_farm at the drive; use fence_rail_gap for the broken ones. '
                 'Water: a windmill or well_house in the yard, a water_trough in each pasture, a pond_dock on a pond. Put a mailbox at the end of the drive, a pivot_span on flat dry fields.')}
out, st = write_pack('farm', pack, __file__)
t = [v[0] for v in st.values()]; print(len(t), 'models', min(t), '-', max(t)); print({k.split('.')[1]: v[0] for k, v in st.items() if v[0] > 300})
