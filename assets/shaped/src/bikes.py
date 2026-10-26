#!/usr/bin/env python3
"""Afterstreet bikes pack, version 1 (26 October 2026): things you ride with two wheels or three or four and no cab: bicycles (city, mountain, kids, BMX, cargo, tricycle, tandem), a kick scooter, a moped, road and dirt motorbikes, a quad bike, a bike trailer, and a fallen bicycle and a wrecked motorbike for the roadside.
Writes assets/shaped/bikes.js. Run: python3 assets/shaped/src/bikes.py

Same form as the machines pack (read its header): parts[name] pieces at rest in bike space; rig[name] how each part moves; wheels[name] positions of the one `wheel` part; steer[name] which wheels steer; clips; BODY is the paint colour slot (paint[name]).
Metres, Y up, the front faces +Z, the origin on the ground under the middle of the wheelbase. A rider sits on `saddle[name]` (a point), with hands at `grips[name]` and feet at `pedals[name]` (about the crank for pedal bikes, on the footpegs for the motor ones).
Moving parts: `bars` turns about Y with the front wheel (the same angle as the steered wheel, up to 35 degrees); `crank` spins about X (positive drives forward); `wheel` spins about X by distance / wheelSize[0]."""
import math
from kit import *

PALETTE = {'tyre': '#26262a', 'rim': '#b9bec2', 'hub': '#8a8e92', 'hubD': '#5a5e62', 'steel': '#6e747a', 'steelD': '#3e4348', 'chrome': '#c8c8c2', 'black': '#1f2024', 'rubber': '#2e2e30',
           'saddle': '#2e2a26', 'saddleB': '#6a3e2a', 'grip': '#1a1a1c', 'basket': '#9a7a4a', 'wood': '#8a6a46', 'box': '#b0663a', 'head': '#f0e8c8', 'tail': '#b8322a', 'indicator': '#e0a030',
           'engine': '#5a5e62', 'engineL': '#8a8e92', 'pipe': '#9a9ea2', 'pipeD': '#6a6a66', 'tank': '#a8342a', 'mud': '#5a4a38', 'white': '#e8e4dc', 'red': '#a8342a', 'blue': '#3e5a7a', 'yellow': '#c9a23a',
           'green': '#4c6a44', 'orange': '#c46a2a', 'plastic': '#c9c3b6', 'rust': '#8c4a2e', 'bell': '#d9b24a', 'glass': '#6a8a96', 'speedo': '#7acaa0', 'seat': '#2e3034', 'canvas': '#5a6a4a', 'flag': '#d8541a'}
PAINT = {'bicycle_city': '#4a7a8a', 'bicycle_mountain': '#3a7a4a', 'bicycle_kids': '#c8322a', 'bmx': '#c9a23a', 'cargo_bike': '#a8342a', 'tricycle': '#d8541a', 'tandem': '#3e5a7a', 'kick_scooter': '#3a3d42',
         'moped': '#e8e4dc', 'motorbike_road': '#3a3d42', 'motorbike_dirt': '#d8541a', 'quad_bike': '#4c6a44', 'bike_trailer': '#c9a23a', 'fallen_bicycle': '#4a7a8a', 'wrecked_motorbike': '#8c4a2e'}
G = dict(glow=True)
M, RIG, WHEELS, CLIPS, NOTE, STEER, WR, SADDLE, GRIPS, PEDALS = {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
def b(x0, y0, z0, x1, y1, z1, c, **k): return box([(x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2], [abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)], c, **k)
def tube(p, q, t, c='BODY'): return seg(p, q, t, t, t, t, c)
def pair(p, q, t, c='BODY', dx=0.04): return [tube([p[0] + s*dx, p[1], p[2]], [q[0] + s*dx, q[1], q[2]], t, c) for s in (-1, 1)]
def spoked(r, w, fat=1.0):
    """a bicycle wheel: a tyre, a lighter rim face and a hub, spun about X"""
    return [loft([[-w/2, 0, 0, r, r], [w/2, 0, 0, r, r]], 'tyre', ax='x', n=12), loft([[-w*0.62, 0, 0, r*0.8, r*0.8], [w*0.62, 0, 0, r*0.8, r*0.8]], 'rim', ax='x', n=12),
            loft([[-w*0.6, 0, 0, r*0.12, r*0.12], [w*0.6, 0, 0, r*0.12, r*0.12]], 'hub', ax='x', n=6)]
def solidw(r, w): return [loft([[-w/2, 0, 0, r, r], [w/2, 0, 0, r, r]], 'tyre', ax='x', n=10), loft([[-w/2 - 0.005, 0, 0, r*0.55, r*0.55], [w/2 + 0.005, 0, 0, r*0.55, r*0.55]], 'hub', ax='x', n=8)]
def bike_rig(extra=None, bars_pivot=None, crank=None):
    rig = {'body': {'pivot': [0, 0, 0]}}
    if bars_pivot: rig['bars'] = {'parent': 'body', 'pivot': bars_pivot, 'turn': [0, 1, 0], 'range': [-35, 35], 'rest': 0, 'note': 'turn with the steered wheel; positive turns left'}
    if crank: rig['crank'] = {'parent': 'body', 'pivot': crank, 'turn': [1, 0, 0], 'range': [-360, 360], 'rest': 0, 'note': 'spins the cranks and pedals; positive drives forward'}
    rig.update(extra or {}); return rig
def machine(name, parts, rig, wheels, r, w, steer, saddle, grips, pedals, clips=None, note=''):
    M[name] = parts; RIG[name] = rig; WHEELS[name] = wheels; WR[name] = [r, w]; STEER[name] = steer; SADDLE[name] = saddle; GRIPS[name] = grips; PEDALS[name] = pedals
    CLIPS[name] = clips or {}; NOTE[name] = note
def pedal_clips(): return {'pedal': [{'t': 0, 'crank': 0}, {'t': 1, 'crank': 360}], 'turn': [{'t': 0, 'bars': 0}, {'t': 0.8, 'bars': 30}, {'t': 1.6, 'bars': -30}, {'t': 2.4, 'bars': 0}]}

# ---------------------------------------------------------------- pedal bicycles
def bicycle(name, r=0.34, wb=1.05, sh=0.95, hh=0.88, bars='flat', basket=False, rack=False, fenders=False, fat=1.0, susp=False, kids=False, bell=False, note='', tw=0.022, saddle_c='saddle'):
    hz = wb/2 - 0.1; bb = [0, r - 0.04, 0.0]; H0 = [0, hh, hz]; H1 = [0, hh + 0.17, hz - 0.02]; S = [0, sh - 0.12, -0.17 - 0.03*(sh - 0.8)]; Rh = [0, r, -wb/2]; Fh = [0, r, wb/2]
    body = [tube(bb, S, tw), tube([0, S[1] - 0.05, S[2] + 0.02], [0, H1[1] - 0.05, H1[2]], tw), tube(bb, H0, tw*1.2)] + pair(bb, Rh, tw*0.7, dx=0.06) + pair([0, S[1] - 0.03, S[2]], Rh, tw*0.6, dx=0.05)
    body += [tube([0, S[1], S[2]], [0, sh, S[2] - 0.02], tw*0.8, 'chrome'), b(-0.05, sh, S[2] - 0.14, 0.05, sh + 0.05, S[2] + 0.1, saddle_c), tube(H0, H1, tw*1.3, 'steelD')]
    body += [loft([[0, bb[1], 0.0, 0.1, 0.1], [0.045, bb[1], 0.0, 0.1, 0.1]], 'steelD', ax='x', n=8)]   # chainring
    body += [loft([[-0.04, r, -wb/2, 0.05, 0.05], [0.04, r, -wb/2, 0.05, 0.05]], 'steelD', ax='x', n=6)]
    if rack: body += [b(-0.07, r + 0.28, -wb/2 - 0.2, 0.07, r + 0.3, -wb/2 + 0.1, 'steel'), tube([0.05, r + 0.28, -wb/2 - 0.1], [0.04, r, -wb/2], 0.012, 'steel'), tube([-0.05, r + 0.28, -wb/2 - 0.1], [-0.04, r, -wb/2], 0.012, 'steel')]
    if fenders: body += [b(-0.03, r*2 + 0.02, -wb/2 - 0.3, 0.03, r*2 + 0.05, -wb/2 + 0.25, 'BODY')]
    if kids: body += [b(-0.1, 0.05, -wb/2 - 0.02, -0.07, 0.15, -wb/2 + 0.02, 'steel'), b(0.07, 0.05, -wb/2 - 0.02, 0.1, 0.15, -wb/2 + 0.02, 'steel')]   # training wheels
    # the fork and bars turn about the head tube
    fork = pair([0, H0[1] - 0.04, hz], [0, r, wb/2], tw*0.7, 'steel', 0.045) + [tube([0, H1[1], hz - 0.02], [0, H1[1] + 0.11, hz - 0.045], tw*0.9, 'steel')]
    hy = H1[1] + 0.11; hzz = hz - 0.045
    if susp: fork += [b(-0.06, H0[1] - 0.2, hz, 0.06, H0[1] - 0.15, hz + 0.05, 'steelD')]
    if bars == 'drop': hb = [b(-0.2, hy - 0.005, hzz - 0.02, 0.2, hy + 0.015, hzz + 0.02, 'grip')] + [b(s*0.2 - 0.01, hy - 0.14, hzz, s*0.2 + 0.01, hy + 0.015, hzz + 0.14, 'grip') for s in (-1, 1)]; grips = [[-0.2, hy - 0.12, hzz + 0.14], [0.2, hy - 0.12, hzz + 0.14]]
    elif bars == 'bmx': hb = [b(-0.3, hy + 0.12, hzz - 0.01, 0.3, hy + 0.14, hzz + 0.01, 'grip'), b(-0.012, hy, hzz - 0.01, 0.012, hy + 0.14, hzz + 0.01, 'steel'), b(-0.24, hy + 0.05, hzz - 0.01, -0.22, hy + 0.14, hzz + 0.01, 'steel'), b(0.22, hy + 0.05, hzz - 0.01, 0.24, hy + 0.14, hzz + 0.01, 'steel')]; grips = [[-0.3, hy + 0.13, hzz], [0.3, hy + 0.13, hzz]]
    elif bars == 'cruiser': hb = [b(-0.3, hy + 0.02, hzz - 0.12, 0.3, hy + 0.045, hzz - 0.09, 'grip'), b(-0.3, hy + 0.02, hzz - 0.12, -0.27, hy + 0.05, hzz + 0.08, 'grip'), b(0.27, hy + 0.02, hzz - 0.12, 0.3, hy + 0.05, hzz + 0.08, 'grip')]; grips = [[-0.29, hy + 0.04, hzz - 0.1], [0.29, hy + 0.04, hzz - 0.1]]
    else: hb = [b(-0.3, hy, hzz - 0.01, 0.3, hy + 0.025, hzz + 0.02, 'grip')]; grips = [[-0.29, hy + 0.012, hzz], [0.29, hy + 0.012, hzz]]
    if bell: hb += [loft([[0.12, hy + 0.04, hzz, 0.025, 0.025], [0.12, hy + 0.07, hzz, 0.025, 0.025]], 'bell', n=6)]
    if basket: hb += [b(-0.17, hy - 0.08, hzz + 0.02, 0.17, hy + 0.14, hzz + 0.3, 'basket'), b(-0.15, hy - 0.06, hzz + 0.04, 0.15, hy + 0.14, hzz + 0.28, 'wood')][0:1] + [b(-0.15, hy - 0.06, hzz + 0.04, 0.15, hy + 0.15, hzz + 0.28, 'basket')]
    hb += [b(-0.04, hy + 0.04, hzz + 0.04, 0.04, hy + 0.1, hzz + 0.07, 'head', **G)]
    crank = [tube([-0.115, bb[1], 0.0], [-0.115, bb[1] - 0.17, 0.0], 0.012, 'steelD'), tube([0.115, bb[1], 0.0], [0.115, bb[1] + 0.17, 0.0], 0.012, 'steelD'), b(-0.17, bb[1] - 0.18, -0.045, -0.1, bb[1] - 0.165, 0.045, 'black'), b(0.1, bb[1] + 0.165, -0.045, 0.17, bb[1] + 0.18, 0.045, 'black')]
    P = {'body': body + [b(-0.02, r + 0.02, -wb/2 - 0.02, 0.02, r + 0.04, -wb/2 + 0.02, 'tail', **G)], 'bars': fork + hb, 'crank': crank, 'wheel': spoked(r, 0.045*fat)}
    rig = bike_rig(bars_pivot=[0, hh, hz], crank=[0, bb[1], 0])
    machine(name, P, rig, [[0, r, wb/2], [0, r, -wb/2]], r, 0.045*fat, [0], [0, sh + 0.02, S[2] - 0.02], grips, [[-0.14, bb[1] - 0.17, 0.0], [0.14, bb[1] + 0.17, 0.0]], pedal_clips(), note)
bicycle('bicycle_city', 0.34, 1.08, 0.98, 0.9, 'flat', basket=True, rack=True, fenders=True, bell=True, note='A town bike with a basket, rack and bell: quiet, common, no fuel. Carry capacity from the basket and rack; parked ones lean on walls and racks.')
bicycle('bicycle_mountain', 0.36, 1.1, 1.0, 0.92, 'flat', susp=True, fat=1.8, note='A mountain bike with fat tyres and a suspension fork: the best bike on trails, gravel and dirt.')
bicycle('bicycle_kids', 0.2, 0.7, 0.62, 0.58, 'cruiser', kids=True, bell=True, saddle_c='saddleB', note='A kid\'s bike with training wheels: for the child in a family group, and a toy for the nursery pile.')
bicycle('bmx', 0.25, 0.92, 0.75, 0.7, 'bmx', fat=1.5, note='A BMX with a high bar and pegs: jumps on dirt ramps; bike parks and skate lots.')
# a road bike (drops, thin tyres) is the same builder with a longer reach
bicycle('bicycle_road', 0.35, 1.0, 1.0, 0.86, 'drop', note='A road bike with drop bars and thin tyres: fastest on tarmac, fragile off it.')
PAINT['bicycle_road'] = '#a8342a'
def cargo_bike():
    r = 0.3; wb = 1.9; body = []
    bicycle('cargo_bike', 0.3, 1.75, 0.95, 0.9, 'flat', basket=False, rack=False, note='')
    P = M['cargo_bike']; hz = wb/2 - 0.25
    P['body'] = P['body'] + [b(-0.3, 0.4, 0.25, 0.3, 0.45, 0.85, 'wood'), b(-0.3, 0.45, 0.25, -0.26, 0.85, 0.85, 'box'), b(0.26, 0.45, 0.25, 0.3, 0.85, 0.85, 'box'), b(-0.3, 0.45, 0.82, 0.3, 0.85, 0.86, 'box'), b(-0.3, 0.45, 0.25, 0.3, 0.85, 0.28, 'box')]
    NOTE['cargo_bike'] = 'A long cargo bike with a wooden front box: carries two crates or a kid; slow and steady.'
cargo_bike()
def tricycle():
    r = 0.2; body = [b(-0.04, 0.3, -0.05, 0.04, 0.34, 0.4, 'BODY'), b(-0.04, 0.3, -0.05, 0.04, 0.55, -0.01, 'BODY'), b(-0.1, 0.55, -0.12, 0.1, 0.6, 0.06, 'saddle'), b(-0.25, 0.14, -0.4, 0.25, 0.18, -0.3, 'BODY'), tube([-0.24, 0.16, -0.35], [0, 0.32, 0.0], 0.015), tube([0.24, 0.16, -0.35], [0, 0.32, 0.0], 0.015)]
    bars = [b(-0.04, 0.34, 0.34, 0.04, 0.6, 0.42, 'steel'), b(-0.2, 0.58, 0.36, 0.2, 0.62, 0.42, 'grip'), b(-0.04, 0.62, 0.42, 0.04, 0.68, 0.45, 'head', **G)]
    crank = [b(-0.1, 0.12, 0.45, 0.1, 0.16, 0.5, 'black')]
    machine('tricycle', {'body': body, 'bars': bars, 'crank': crank, 'wheel': solidw(r, 0.05)}, bike_rig(bars_pivot=[0, 0.34, 0.4], crank=[0, 0.14, 0.4]), [[0, 0.2, 0.45], [0.25, 0.14, -0.4], [-0.25, 0.14, -0.4]], 0.2, 0.05, [0], [0, 0.6, -0.05], [[-0.2, 0.6, 0.39], [0.2, 0.6, 0.39]], [[-0.1, 0.14, 0.47], [0.1, 0.14, 0.47]], pedal_clips(), 'A child\'s tricycle: a pedal front wheel and two at the back.')
    M['tricycle']['wheel'] = solidw(0.2, 0.05)
tricycle()
def tandem():
    bicycle('tandem', 0.34, 1.9, 0.98, 0.9, 'flat', note='')
    P = M['tandem']; bb = 0.3; P['body'] = P['body'] + [tube([0, 0.9, -0.1], [0, 0.9, -0.82], 0.022), b(-0.05, 0.98, 0.05, 0.05, 1.03, 0.25, 'saddle'), tube([0, 0.9, 0.12], [0, 0.97, 0.12], 0.015, 'chrome')]
    SADDLE['tandem'] = [[0, 1.0, 0.15], [0, 1.0, -0.4]]
    NOTE['tandem'] = 'A tandem: two riders, two saddles; a joke and a good way to carry a partner.'
tandem()
def kick_scooter():
    r = 0.1; body = [b(-0.08, 0.11, -0.45, 0.08, 0.15, 0.38, 'BODY'), b(-0.06, 0.1, -0.5, 0.06, 0.2, -0.38, 'steelD'), b(-0.1, 0.12, -0.2, 0.1, 0.14, 0.15, 'rubber')]
    bars = [tube([0, 0.15, 0.36], [0, 0.95, 0.3], 0.015, 'steel'), b(-0.22, 0.93, 0.28, 0.22, 0.97, 0.32, 'grip'), b(-0.04, 0.8, 0.31, 0.04, 0.88, 0.34, 'head', **G)]
    machine('kick_scooter', {'body': body, 'bars': bars, 'wheel': solidw(r, 0.03)}, bike_rig(bars_pivot=[0, 0.15, 0.36]), [[0, 0.1, 0.4], [0, 0.1, -0.45]], r, 0.03, [0], [0, 0.15, -0.1], [[-0.22, 0.95, 0.3], [0.22, 0.95, 0.3]], [[0, 0.16, -0.1]], {'turn': pedal_clips()['turn']}, 'A kick scooter: fast on pavement, quiet; stands on its own with its kickstand.')
    M['kick_scooter']['wheel'] = solidw(0.1, 0.03)
kick_scooter()
# ---------------------------------------------------------------- motorbikes
def motorbike(name, kind, r, wb, seat_h, note):
    dirt = kind == 'dirt'; moped = kind == 'moped'; hz = wb/2 - 0.12
    body = [b(-0.1, r + 0.15, -0.35, 0.1, r + 0.4, 0.3, 'engine') if not moped else b(-0.12, 0.2, -0.5, 0.12, 0.45, -0.2, 'engine'),
            b(-0.09, r + 0.22, 0.0, 0.09, r + 0.55, 0.28, 'engineL') if not moped else b(-0.1, 0.1, 0.0, 0.1, 0.12, 0.35, 'plastic'),
            b(-0.11, seat_h - 0.08, -0.55, 0.11, seat_h, -0.05, 'seat'),
            b(-0.1, seat_h - 0.02, 0.0, 0.1, seat_h + (0.28 if not moped else 0.0), 0.35, 'tank' if not moped else 'plastic') if not moped else b(-0.19, 0.12, -0.62, 0.19, 0.5, -0.1, 'BODY'),
            tube([0, seat_h - 0.1, -0.2], [0, r, -wb/2], 0.025, 'steelD'), tube([0, r + 0.2, 0.0], [0, r, -wb/2], 0.03, 'steelD'),
            b(-0.07, r + 0.1, -wb/2 - 0.2, 0.07, r + 0.14, -wb/2 + 0.15, 'steelD'),
            tube([0.12, r + 0.12, -0.3], [0.1, r + 0.1, -wb/2 - 0.35], 0.03, 'pipe'), b(0.1, r + 0.08, -wb/2 - 0.5, 0.14, r + 0.16, -wb/2 - 0.2, 'pipeD'),
            b(-0.05, seat_h - 0.0, -0.7, 0.05, seat_h + 0.05, -0.62, 'tail', **G), b(-0.15, 0.2, -0.05, -0.1, 0.24, 0.1, 'steelD'), b(0.1, 0.2, -0.05, 0.15, 0.24, 0.1, 'steelD')]
    if dirt: body += [b(-0.04, r*2 + 0.1, -wb/2 - 0.3, 0.04, r*2 + 0.14, -wb/2 + 0.3, 'BODY'), b(-0.1, r + 0.4, -0.2, 0.1, r + 0.7, 0.0, 'BODY'), b(-0.04, r*2 + 0.05, wb/2 - 0.2, 0.04, r*2 + 0.1, wb/2 + 0.25, 'BODY')]
    if moped: body += [b(-0.15, 0.1, 0.15, 0.15, 0.55, 0.4, 'BODY'), b(-0.1, 0.55, 0.38, 0.1, 0.9, 0.45, 'BODY'), b(-0.28, 0.5, -0.1, 0.28, 0.6, 0.0, 'plastic')][0:2]
    bars = [tube([0, r + 0.1, hz], [0, r + 0.5, hz - 0.1], 0.025, 'steel'), tube([0.08, r + 0.1, hz], [0.08, r, wb/2], 0.025, 'chrome'), tube([-0.08, r + 0.1, hz], [-0.08, r, wb/2], 0.025, 'chrome'), b(-0.34, r + 0.52, hz - 0.12, 0.34, r + 0.55, hz - 0.1, 'grip'),
            b(-0.12, r + 0.46, hz - 0.02, 0.12, r + 0.62, hz + 0.1, 'black'), loft([[0, r + 0.5, hz + 0.1, 0.1, 0.1], [0, r + 0.5, hz + 0.14, 0.1, 0.1]], 'head', n=8, **G)]
    if dirt: bars += [b(-0.05, r + 0.55, hz + 0.05, 0.05, r + 0.7, hz + 0.1, 'BODY')]
    if moped: bars = bars + [b(-0.18, r + 0.5, hz - 0.1, 0.18, r + 0.78, hz + 0.05, 'BODY')]
    P = {'body': body, 'bars': bars, 'wheel': [loft([[-0.06, 0, 0, r, r], [0.06, 0, 0, r, r]], 'tyre', ax='x', n=12), loft([[-0.075, 0, 0, r*0.62, r*0.62], [0.075, 0, 0, r*0.62, r*0.62]], 'hub', ax='x', n=10), loft([[-0.08, 0, 0, r*0.15, r*0.15], [0.08, 0, 0, r*0.15, r*0.15]], 'hubD', ax='x', n=6)]}
    machine(name, P, bike_rig(bars_pivot=[0, r + 0.4, hz]), [[0, r, wb/2], [0, r, -wb/2]], r, 0.12, [0], [0, seat_h, -0.3], [[-0.34, r + 0.54, hz - 0.11], [0.34, r + 0.54, hz - 0.11]], [[-0.17, 0.22, 0.0], [0.17, 0.22, 0.0]], {'turn': pedal_clips()['turn']}, note)
motorbike('motorbike_road', 'road', 0.32, 1.45, 0.8, 'A road motorbike (about 400 cc): fast, loud (alerts aliens), thirsty; fuel in the tank, a battery to flatten.')
motorbike('motorbike_dirt', 'dirt', 0.36, 1.4, 0.92, 'A dirt bike with long forks and a high fender: good over fields and trails, hopeless with a passenger.')
motorbike('moped', 'moped', 0.22, 1.2, 0.76, 'A 50 cc moped with a step-through frame and a front shield: slow, frugal and quiet.')
def quad_bike():
    r = 0.3; P = {'body': [b(-0.4, 0.3, -0.7, 0.4, 0.65, 0.7, 'BODY'), b(-0.3, 0.65, -0.55, 0.3, 0.72, 0.1, 'seat'), b(-0.3, 0.65, 0.0, 0.3, 0.95, 0.5, 'BODY'), b(-0.55, 0.3, 0.85, 0.55, 0.42, 1.05, 'steelD'), b(-0.55, 0.3, -1.0, 0.55, 0.45, -0.8, 'steelD'), b(-0.3, 0.34, 0.55, 0.3, 0.55, 0.95, 'BODY'),
                       b(-0.1, 0.8, 0.5, 0.1, 0.95, 0.65, 'black'), b(-0.4, 0.45, -0.5, -0.3, 0.6, 0.4, 'steelD'), b(0.3, 0.45, -0.5, 0.4, 0.6, 0.4, 'steelD'), b(-0.12, 0.62, 0.8, -0.04, 0.68, 0.84, 'head', **G), b(0.04, 0.62, 0.8, 0.12, 0.68, 0.84, 'head', **G), b(-0.1, 0.5, -0.9, 0.1, 0.56, -0.86, 'tail', **G), b(-0.25, 0.45, -0.95, 0.25, 0.65, -0.8, 'steelD')],
                'bars': [b(-0.35, 1.0, 0.25, 0.35, 1.04, 0.3, 'grip'), tube([0, 0.7, 0.4], [0, 1.0, 0.27], 0.03, 'steel')],
                'wheel': [loft([[-0.12, 0, 0, r, r], [0.12, 0, 0, r, r]], 'tyre', ax='x', n=10), loft([[-0.13, 0, 0, r*0.55, r*0.55], [0.13, 0, 0, r*0.55, r*0.55]], 'hub', ax='x', n=8)]}
    machine('quad_bike', P, bike_rig(bars_pivot=[0, 0.7, 0.4]), [[0.5, r, 0.95], [-0.5, r, 0.95], [0.5, r, -0.9], [-0.5, r, -0.9]], r, 0.24, [0, 1], [0, 0.75, -0.2], [[-0.35, 1.02, 0.27], [0.35, 1.02, 0.27]], [[-0.4, 0.38, 0.0], [0.4, 0.38, 0.0]], {'turn': pedal_clips()['turn']}, 'A four-wheeled quad bike: slow and unfussy on rough ground; carries a small load on the rear rack.')
quad_bike()
def bike_trailer():
    r = 0.2; P = {'body': [b(-0.45, 0.15, -0.5, 0.45, 0.2, 0.5, 'steelD'), b(-0.45, 0.2, -0.5, 0.45, 0.65, -0.46, 'BODY'), b(-0.45, 0.2, 0.46, 0.45, 0.65, 0.5, 'BODY'), b(-0.46, 0.2, -0.5, -0.42, 0.65, 0.5, 'BODY'), b(0.42, 0.2, -0.5, 0.46, 0.65, 0.5, 'BODY'), tube([0, 0.2, 0.5], [0, 0.45, 1.3], 0.015, 'steel'), b(-0.03, 0.43, 1.25, 0.03, 0.48, 1.35, 'steel')],
                  'wheel': solidw(r, 0.06)}
    machine('bike_trailer', P, {'body': {'pivot': [0, 0, 0]}}, [[0.5, r, 0.0], [-0.5, r, 0.0]], r, 0.06, [], [0, 0.4, 0], [], [], {}, 'A small cargo trailer towed behind a bike or quad: two crates, firewood, or a child.')
bike_trailer()
def fallen_bicycle():
    r = 0.34; P = {'body': [loft([[-0.55, 0.03, 0.0, r, r], [-0.55, 0.075, 0.0, r, r]], 'tyre', n=12), loft([[0.55, 0.03, 0.0, r, r], [0.55, 0.075, 0.0, r, r]], 'tyre', n=12), loft([[-0.55, 0.075, 0.0, r*0.84, r*0.84], [-0.55, 0.09, 0.0, r*0.84, r*0.84]], 'rim', n=12), loft([[0.55, 0.075, 0.0, r*0.84, r*0.84], [0.55, 0.09, 0.0, r*0.84, r*0.84]], 'rim', n=12),
                       tube([-0.1, 0.2, 0.0], [0.35, 0.2, 0.03], 0.02), tube([-0.1, 0.2, 0.0], [-0.55, 0.12, 0.0], 0.02), tube([0.35, 0.2, 0.03], [0.55, 0.12, 0.0], 0.02), b(-0.2, 0.2, -0.2, -0.08, 0.26, -0.15, 'saddle'), b(0.4, 0.15, -0.3, 0.45, 0.2, 0.3, 'grip')]}
    machine('fallen_bicycle', P, {'body': {'pivot': [0, 0, 0]}}, [], 0.34, 0.05, [], [0, 0.3, 0], [], [], {}, 'A bicycle lying on its side at a roadside or in a verge: a loot find (a tyre, a chain, a bell) and the sign of a story.')
    # lay it along z so it is as long as the standing one
    for k in P['body']: pass
fallen_bicycle()
def wrecked_motorbike():
    P = {'body': [b(-0.3, 0.1, -0.4, 0.3, 0.2, 0.6, 'BODY'), b(-0.2, 0.2, -0.2, 0.2, 0.4, 0.3, 'engine'), b(-0.4, 0.05, -0.9, 0.0, 0.2, -0.5, 'rust'), loft([[0.0, 0.05, 0.7, 0.3, 0.3], [0.0, 0.14, 0.7, 0.3, 0.3]], 'tyre', n=10), loft([[0.0, 0.05, 0.7, 0.19, 0.19], [0.0, 0.16, 0.7, 0.19, 0.19]], 'hub', n=8), b(0.3, 0.1, 0.0, 0.7, 0.16, 0.12, 'steel'), b(-0.1, 0.3, -0.45, 0.1, 0.35, -0.1, 'seat'), b(-0.6, 0.0, 0.4, -0.2, 0.05, 0.9, 'mud')]}
    machine('wrecked_motorbike', P, {'body': {'pivot': [0, 0, 0]}}, [], 0.3, 0.1, [], [0, 0.3, 0], [], [], {}, 'A wrecked motorbike on its side, bent and rusting: loot (fuel, a mirror, a battery) at a crash site.')
wrecked_motorbike()
pack = {'name': 'bikes', 'version': 1, 'units': 'metres', 'facing': '+Z', 'palette': PALETTE, 'paint': PAINT, 'darker': 0.78, 'about': __doc__.split('\n', 2)[2], 'models': M, 'rig': RIG, 'wheels': WHEELS, 'wheelSize': WR, 'steer': STEER, 'clips': CLIPS,
        'saddle': SADDLE, 'grips': GRIPS, 'pedals': PEDALS, 'notes': NOTE,
        'rule': ('Draw as the machines pack: BODY = paint[name]; parts from the body outwards (subtract the part pivot, apply the value), `wheel` at every wheels[name] point (spin about X by distance / wheelSize[name][0]; steer the listed indices about Y up to 35 degrees, and turn `bars` by the same angle). '
                 'Pedal bikes: spin `crank` by the distance driven (positive forward); a rider sits at saddle[name] with hands at grips[name] and feet at pedals[name] (for the motor bikes the pedals are footpegs, which do not move). Headlight and tail light pieces are glow pieces: show them at night or when the engine is on. '
                 'Placement: bicycles lean on walls, rails and bike racks (props.street), lie as fallen_bicycle in verges and gutters, and sit in front of shops, schools and parks; motorbikes and quads sit in driveways, garages and car parks; wrecked_motorbike marks crash sites; bike_trailer hitches behind a bicycle or quad.')}
if __name__ == '__main__':
    import os
    out, st = write_pack('bikes', pack, __file__)
    print(os.path.getsize(out)//1024, 'KB', len(M), 'models')
    print({k: v[0] for k, v in st.items() if '.' not in k or k.endswith('.body')})
