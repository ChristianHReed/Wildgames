#!/usr/bin/env python3
"""Afterstreet boats pack, version 1 (26 October 2026): boats for the rivers and lakes of the Ozarks, with their moving parts: a kayak, a canoe, a rowboat with oars, a jon boat, a bass boat, a pontoon boat, a runabout, a fishing boat, a houseboat, a sailing dinghy, a paddleboard, a jet ski, an inflatable raft, a log raft, a barrel raft and a cable-ferry barge, plus wake and foam pieces for the water.
Writes assets/shaped/boats.js. Run: python3 assets/shaped/src/boats.py

Same form as the machines pack (read its header): parts[name] at rest, rig[name] (parent, pivot, turn or slide, range, rest), clips, notes, paint[name] for the BODY colour slot. Metres, Y up, the bow faces +Z, the origin is at the water line under the middle of the boat: the hull goes below y = 0 by its draught (info in `draught`), so set the boat's y to the water height.
`seats[name]` are sitting points [x, y, z] (the first is the helm or the paddler), `helm[name]` is where the wheel or tiller is, and `buoy[name]` is how many survivors it carries before it sinks to the gunwale. No wheels: boats are pushed by `motor` (its `prop` spins about Z), `oar_l` / `oar_r` (sweep about Y), `paddle` (roll about Z), or the wind (`sail`, `boom` turn about Y)."""
import math
from kit import *

PALETTE = {'hull': '#5a6a70', 'hullD': '#3e4a50', 'inside': '#b8b2a2', 'insideD': '#8a8678', 'deck': '#a8a496', 'wood': '#8a6a46', 'woodD': '#6a5034', 'woodL': '#b08c62', 'teak': '#9a6a3a', 'steel': '#6e747a', 'steelD': '#3e4348', 'chrome': '#c8c8c2',
           'black': '#1f2024', 'rubber': '#26262a', 'white': '#e8e4dc', 'whiteD': '#c8c4bc', 'red': '#a8342a', 'blue': '#3e5a7a', 'yellow': '#d9b230', 'orange': '#d8541a', 'green': '#3e6a4a', 'glass': '#6a8a96', 'seat': '#3a3630', 'seatB': '#2e4a6a',
           'engine': '#2e3034', 'engineL': '#7a7e82', 'prop': '#b8bcc0', 'rope': '#c9b48a', 'canvas': '#d8d0b8', 'sail': '#f0ece0', 'sailR': '#c8322a', 'foam': '#f0f4f4', 'log': '#6a5238', 'logD': '#4a3a28', 'barrel': '#3e5a7a', 'barrelR': '#a8342a',
           'tube': '#d8541a', 'tubeD': '#a8401a', 'pontoon': '#aab0b4', 'canopy': '#3e5a7a', 'light': '#f0e8c8', 'lightR': '#d8321a', 'lightG': '#3aa85a', 'rust': '#8c4a2e', 'tarp': '#4a6a8a', 'mud': '#5a4a38', 'rod': '#2a2a2c', 'net': '#8a9a6a'}
PAINT = {'kayak': '#d8541a', 'canoe': '#3e6a4a', 'rowboat': '#e8e4dc', 'jon_boat': '#6a7a5a', 'bass_boat': '#a8342a', 'pontoon_boat': '#e8e4dc', 'runabout': '#e8e4dc', 'fishing_boat': '#3e5a7a', 'houseboat': '#e8e4dc', 'sailing_dinghy': '#e8e4dc',
         'paddleboard': '#4a8a9a', 'jet_ski': '#c9a23a', 'inflatable_raft': '#d8541a', 'log_raft': '#6a5238', 'barrel_raft': '#8a6a46', 'ferry_barge': '#6a7a5a', 'wake_v': '#f0f4f4', 'bow_wave': '#f0f4f4', 'prop_wash': '#f0f4f4', 'splash_ring': '#f0f4f4'}
G = dict(glow=True)
M, RIG, CLIPS, NOTE, SEATS, HELM, BUOY, DRAFT = {}, {}, {}, {}, {}, {}, {}, {}
def b(x0, y0, z0, x1, y1, z1, c, **k): return box([(x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2], [abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)], c, **k)
def tube(p, q, t, c='steel'): return seg(p, q, t, t, t, t, c)
def cylz(x, y, z0, z1, r, c, n=8): return loft([[x, y, z0, r, r], [x, y, z1, r, r]], c, ax='z', n=n)
def cylx(x0, x1, y, z, r, c, n=8): return loft([[x0, y, z, r, r], [x1, y, z, r, r]], c, ax='x', n=n)
# ---- hull builders. A station is (z, top half beam, bottom half beam, bottom y, top y).
def solid_hull(st, c):
    o = []
    for A, B in zip(st, st[1:]):
        ring = lambda s: [(-s[1], s[4], s[0]), (s[1], s[4], s[0]), (s[2], s[3], s[0]), (-s[2], s[3], s[0])]
        o.append(hull(ring(A) + ring(B), c))
    return o
def open_hull(st, t, c_out, c_in, c_floor=None, thick_floor=0.05):
    o = []; n = len(st)
    for sx in (-1, 1):
        for A, B in zip(st, st[1:]):
            def q(s):
                z, bt, bb, yb, yt = s; k = 0.0 if bt < 0.06 else t
                p = [(sx*bt, yt, z), (sx*max(bt - k, 0.0), yt, z), (sx*max(bb - k, 0.0), yb + thick_floor, z), (sx*bb, yb, z)]
                return p if sx > 0 else p[::-1]
            o.append(hull(q(A) + q(B), c_out))
    # inside paint: a lining just inside each wall, and the floor
    for A, B in zip(st, st[1:]):
        ring = lambda s: [(-max(s[2] - t, 0), s[3] + thick_floor, s[0]), (max(s[2] - t, 0), s[3] + thick_floor, s[0]), (max(s[2] - t, 0), s[3] + thick_floor + 0.01, s[0]), (-max(s[2] - t, 0), s[3] + thick_floor + 0.01, s[0])]
        o.append(hull(ring(A) + ring(B), c_floor or c_in))
    return o
def wall_top(st, c, w=0.03):
    """a gunwale strip along the top of both sides"""
    o = []
    for sx in (-1, 1):
        for A, B in zip(st, st[1:]):
            o.append(tube([sx*(A[1] - w/2), A[4] + 0.01, A[0]], [sx*(B[1] - w/2), B[4] + 0.01, B[0]], w/2, c))
    return o
def outboard(z, y=0.38, hp=1.0, c='engine'):
    s = 0.5 + 0.5*hp
    cowl = [b(-0.14*s, y, z - 0.18*s, 0.14*s, y + 0.5*s, z + 0.12*s, c), b(-0.12*s, y + 0.5*s, z - 0.14*s, 0.12*s, y + 0.56*s, z + 0.08*s, 'engineL')]
    leg = [b(-0.05*s, y - 0.55*s, z - 0.12*s, 0.05*s, y, z + 0.06*s, 'engineL'), b(-0.1*s, y - 0.75*s, z - 0.16*s, 0.1*s, y - 0.55*s, z + 0.12*s, 'engine'), b(-0.02, y - 0.74*s, z - 0.02, 0.02, y - 0.6*s, z - 0.3*s, 'steel')]
    prop = [b(-0.015, y - 0.8*s, z - 0.22*s, 0.015, y - 0.66*s, z - 0.12*s, 'prop'), b(-0.1*s, y - 0.745*s, z - 0.22*s, 0.1*s, y - 0.725*s, z - 0.12*s, 'prop')]
    tiller = [tube([0, y + 0.2*s, z + 0.1*s], [0, y + 0.3*s, z + 0.7*s], 0.012, 'steelD')] if hp < 1 else []
    return cowl + leg + tiller, prop
def with_motor(P, RG, z, y=0.38, hp=1.0):
    mp, pr = outboard(z, y, hp); P['motor'] = mp; P['prop'] = pr
    s = 0.5 + 0.5*hp
    RG['motor'] = {'parent': 'body', 'pivot': [0, y, z], 'turn': [0, 1, 0], 'range': [-35, 35], 'rest': 0, 'note': 'steers the boat: swing the whole outboard about Y; positive turns the stern right'}
    RG['prop'] = {'parent': 'motor', 'pivot': [0, y - 0.73*s, z - 0.17*s], 'turn': [0, 0, 1], 'range': [-3600, 3600], 'rest': 0, 'note': 'spin about Z with speed when the engine is on'}
def boat(name, P, RG, seats, helm, buoy, draught, clips=None, note=''):
    M[name] = P; RIG[name] = RG; SEATS[name] = seats; HELM[name] = helm; BUOY[name] = buoy; DRAFT[name] = draught; CLIPS[name] = clips or {}; NOTE[name] = note
def rg(): return {'body': {'pivot': [0, 0, 0]}}
def thwart(z, w, y=0.28, t=0.04, c='wood'): return [b(-w, y, z - 0.12, w, y + t, z + 0.12, c)]
def spin_clip(): return {'run': [{'t': 0, 'prop': 0}, {'t': 0.25, 'prop': 360}]}

# ================= kayak and canoe and paddleboard (paddled) =================
def kayak():
    st = [(-1.6, 0.03, 0.02, 0.04, 0.2), (-1.2, 0.2, 0.12, -0.04, 0.12), (-0.5, 0.32, 0.2, -0.1, 0.1), (0.5, 0.32, 0.2, -0.1, 0.1), (1.2, 0.2, 0.12, -0.04, 0.12), (1.6, 0.03, 0.02, 0.04, 0.2)]
    P = {'body': solid_hull(st, 'BODY') + [b(-0.22, 0.09, -0.4, 0.22, 0.14, 0.45, 'black'), b(-0.17, 0.1, -0.35, 0.17, 0.15, 0.4, 'insideD'), b(-0.14, 0.1, -0.15, 0.14, 0.16, 0.05, 'seatB'), b(-0.04, 0.1, 0.6, 0.04, 0.12, 1.0, 'rope'), b(-0.04, 0.1, -1.0, 0.04, 0.12, -0.6, 'rope')]}
    P['paddle'] = [tube([-0.9, 0.35, 0.1], [0.9, 0.35, 0.1], 0.015, 'black')] + [b(sx*0.9 - 0.12*sx - 0.1, 0.28, 0.0, sx*0.9 + 0.12*sx + 0.1, 0.42, 0.2, 'BODY') for sx in (-1, 1)][0:0] + [b(sx*0.8, 0.31, 0.0, sx*1.1, 0.39, 0.2, 'BODY') for sx in (-1, 1)]
    R = rg(); R['paddle'] = {'parent': 'body', 'pivot': [0, 0.35, 0.1], 'turn': [0, 0, 1], 'range': [-35, 35], 'rest': 0, 'note': 'roll the paddle: dip the left blade, then the right; paddle the two blades alternately to drive and steer'}
    boat('kayak', P, R, [[0, 0.1, 0.0]], [0, 0.4, 0.1], 1, 0.1, {'paddle': [{'t': 0, 'paddle': -30}, {'t': 0.6, 'paddle': 30}, {'t': 1.2, 'paddle': -30}]}, 'A 3.2 m sit-in kayak: one paddler, fast and quiet on rivers and lakes; carries one pack on the deck. Tips if overloaded.')
kayak()
def canoe():
    st = [(-2.25, 0.03, 0.02, -0.02, 0.45), (-1.7, 0.3, 0.14, -0.14, 0.34), (-0.8, 0.45, 0.26, -0.2, 0.28), (0.0, 0.5, 0.3, -0.2, 0.26), (0.8, 0.45, 0.26, -0.2, 0.28), (1.7, 0.3, 0.14, -0.14, 0.34), (2.25, 0.03, 0.02, -0.02, 0.45)]
    P = {'body': open_hull(st, 0.035, 'BODY', 'inside', 'insideD') + wall_top(st, 'woodL', 0.05) + thwart(0.0, 0.46, 0.26) + thwart(1.25, 0.34, 0.26) + thwart(-1.25, 0.34, 0.26) + [b(-0.16, 0.12, 0.8, 0.16, 0.2, 1.1, 'seat'), b(-0.16, 0.12, -1.1, 0.16, 0.2, -0.8, 'seat'), b(-0.3, -0.18, -0.9, 0.3, -0.17, 0.9, 'insideD')]}
    P['paddle'] = [tube([0, 0.3, 0.1], [0.5, 0.35, 0.5], 0.015, 'woodD'), b(0.45, 0.26, 0.45, 0.65, 0.4, 0.95, 'woodL')]
    R = rg(); R['paddle'] = {'parent': 'body', 'pivot': [0.45, 0.5, 0.1], 'turn': [1, 0, 0], 'range': [-50, 50], 'rest': 0, 'note': 'sweep the paddle fore and aft on one side'}
    boat('canoe', P, R, [[0, 0.2, 0.9], [0, 0.2, -0.9], [0, 0.1, 0.0]], [0, 0.4, -0.9], 3, 0.2, {'paddle': [{'t': 0, 'paddle': -40}, {'t': 0.8, 'paddle': 40}, {'t': 1.6, 'paddle': -40}]}, 'A 4.5 m open canoe (aluminium or wood): two paddlers and a third in the middle, gear underfoot. Stable on lakes, fast on rivers.')
canoe()
def paddleboard():
    st = [(-1.7, 0.03, 0.02, -0.02, 0.08), (-1.0, 0.36, 0.26, -0.09, 0.09), (0.0, 0.42, 0.3, -0.1, 0.1), (1.0, 0.36, 0.26, -0.09, 0.09), (1.7, 0.03, 0.02, -0.02, 0.08)]
    P = {'body': solid_hull(st, 'BODY') + [b(-0.3, 0.095, -0.5, 0.3, 0.11, 0.5, 'rubber'), b(-0.02, 0.095, 0.7, 0.02, 0.11, 1.4, 'white'), b(-0.02, -0.25, -1.55, 0.02, -0.1, -1.35, 'steelD')]}
    P['paddle'] = [tube([0, 0.15, 0.0], [0, 1.6, 0.0], 0.015, 'black'), b(-0.1, 0.0, -0.05, 0.1, 0.45, 0.02, 'BODY')]
    R = rg(); R['paddle'] = {'parent': 'body', 'pivot': [0.35, 1.1, 0.2], 'turn': [1, 0, 0], 'range': [-45, 45], 'rest': 0, 'note': 'sweep fore and aft; stand and swing it down one side then the other'}
    boat('paddleboard', P, R, [[0, 0.1, 0.0]], [0, 0.15, 0.0], 1, 0.1, {'paddle': [{'t': 0, 'paddle': -40}, {'t': 0.9, 'paddle': 40}]}, 'A stand-up paddleboard: one person standing or kneeling; unstable, shallow draught, good for creeks.')
paddleboard()
# ================= rowboat =================
def rowboat():
    st = [(-1.8, 0.62, 0.5, -0.18, 0.4), (-1.0, 0.68, 0.5, -0.24, 0.38), (0.0, 0.66, 0.46, -0.26, 0.36), (1.0, 0.5, 0.3, -0.22, 0.38), (1.6, 0.15, 0.06, -0.1, 0.46), (1.9, 0.03, 0.02, 0.0, 0.5)]
    P = {'body': open_hull(st, 0.035, 'BODY', 'inside', 'insideD') + wall_top(st, 'wood', 0.05) + thwart(-1.0, 0.64, 0.3) + thwart(0.1, 0.62, 0.3) + thwart(1.0, 0.46, 0.3) + [b(-0.6, 0.0, -1.82, 0.6, 0.4, -1.76, 'BODY'), b(-0.06, 0.4, -1.8, 0.06, 0.55, -1.76, 'woodD'), b(-0.06, 0.4, 1.7, 0.06, 0.46, 1.82, 'steel'), b(-0.55, -0.16, -1.0, 0.55, -0.15, 1.0, 'insideD'), b(-0.4, 0.35, 0.8, 0.4, 0.4, 1.05, 'wood')]}
    for sx, nm in ((-1, 'oar_l'), (1, 'oar_r')):
        P[nm] = [tube([0, 0, 0], [sx*1.6, -0.15, -0.1], 0.02, 'woodL'), b(sx*1.45 - 0.0, -0.22, -0.35, sx*1.6 + 0.12*sx, -0.1, -0.05, 'woodD')][0:1] + [b(min(sx*1.55, sx*1.9), -0.2, -0.25, max(sx*1.55, sx*1.9), -0.14, -0.05, 'white'), b(sx*0.0 - 0.03, 0.0, -0.1, sx*0.0 + 0.03, 0.2, 0.0, 'steelD')]
    R = rg()
    for sx, nm in ((-1, 'oar_l'), (1, 'oar_r')): R[nm] = {'parent': 'body', 'pivot': [sx*0.68, 0.45, 0.1], 'turn': [0, 1, 0], 'range': [-35, 35], 'rest': 0, 'note': 'sweep: both oars together drive the boat; one alone turns it'}
    for k in ('oar_l', 'oar_r'): P[k] = [tube([0, 0, 0], [0.0, 0.0, 0.0], 0.0, 'woodL')] and P[k]
    boat('rowboat', P, R, [[0, 0.32, 0.1], [0, 0.32, -1.0], [0, 0.32, 1.0]], [0, 0.4, 0.1], 3, 0.26, {'row': [{'t': 0, 'oar_l': -30, 'oar_r': -30}, {'t': 0.9, 'oar_l': 30, 'oar_r': 30}, {'t': 1.8, 'oar_l': -30, 'oar_r': -30}]}, 'A 3.8 m wooden rowboat with a transom stern and two oars: slow, quiet, three people; the oars are loot.')
rowboat()
# ================= jon boat and bass boat =================
def jon_boat():
    st = [(-2.1, 0.7, 0.62, -0.18, 0.4), (-1.0, 0.72, 0.64, -0.2, 0.4), (1.0, 0.72, 0.64, -0.2, 0.4), (1.7, 0.5, 0.42, -0.15, 0.46), (2.1, 0.22, 0.16, -0.06, 0.52)]
    P = {'body': open_hull(st, 0.04, 'BODY', 'inside', 'insideD') + wall_top(st, 'steel', 0.05) + thwart(-0.9, 0.7, 0.32, 0.04, 'steel') + thwart(0.2, 0.7, 0.32, 0.04, 'steel') + thwart(1.1, 0.5, 0.32, 0.04, 'steel') + [b(-0.7, 0.0, -2.12, 0.7, 0.4, -2.06, 'BODY'), b(-0.55, 0.32, -2.05, 0.55, 0.38, -1.75, 'steel'), b(-0.04, 0.4, 1.9, 0.04, 0.55, 2.0, 'steel'), b(-0.55, -0.18, -1.0, 0.55, -0.17, 1.0, 'insideD')]}
    R = rg(); with_motor(P, R, -2.08, 0.4, 0.55)
    boat('jon_boat', P, R, [[0, 0.34, -1.3], [0, 0.34, 0.2], [0, 0.34, 1.1]], [0, 0.45, -1.7], 3, 0.2, spin_clip(), 'A 4.3 m flat-bottom jon boat with a small outboard on the transom: the working fishing boat of the lakes and rivers; very shallow draught, three people.')
jon_boat()
def bass_boat():
    st = [(-2.6, 0.9, 0.7, -0.22, 0.44), (-1.5, 0.95, 0.72, -0.28, 0.46), (0.0, 0.92, 0.66, -0.3, 0.48), (1.4, 0.7, 0.38, -0.26, 0.56), (2.3, 0.3, 0.12, -0.14, 0.66), (2.65, 0.03, 0.02, -0.04, 0.7)]
    P = {'body': solid_hull(st, 'BODY') + [b(-0.82, 0.44, -2.5, 0.82, 0.5, -1.4, 'deck'), b(-0.6, 0.46, 1.1, 0.6, 0.62, 2.2, 'deck'), b(-0.55, 0.5, -1.4, 0.55, 0.5, 1.1, 'insideD'), b(-0.1, 0.62, 2.1, 0.1, 0.75, 2.3, 'steel'), b(-0.04, 0.5, 0.9, 0.04, 1.0, 1.0, 'steelD'),
                                           b(-0.5, 0.5, -0.6, 0.5, 0.56, 0.0, 'seatB'), b(-0.62, 0.52, -0.75, 0.62, 0.58, -0.72, 'chrome')] + [t for sx in (-1, 1) for t in (b(sx*0.35 - 0.1, 0.5, 0.2, sx*0.35 + 0.1, 0.9, 0.3, 'seat'), b(sx*0.35 - 0.2, 0.9, 0.15, sx*0.35 + 0.2, 0.98, 0.35, 'seatB'))]
        + [b(-0.5, 0.52, -1.9, -0.3, 0.7, -1.7, 'whiteD'), b(0.3, 0.52, -1.9, 0.5, 0.7, -1.7, 'whiteD')] + [b(sx*0.2 - 0.02, 0.6, 1.6, sx*0.2 + 0.02, 0.9, 1.65, 'glass') for sx in (-1, 1)] + [b(0.0, 0.5, -2.62, 0.0, 0.5, -2.6, 'white')][0:0] + [b(-0.3, 0.44, 2.55, 0.3, 0.46, 2.6, 'lightR', **G)][0:0]}
    P['body'] += [b(-0.25, 0.62, 1.5, 0.25, 0.9, 1.56, 'glass'), b(-0.05, 0.28, 2.55, 0.05, 0.5, 2.65, 'yellow')]
    R = rg(); with_motor(P, R, -2.62, 0.45, 1.0)
    boat('bass_boat', P, R, [[-0.35, 0.95, 0.25], [0.35, 0.95, 0.25], [0, 0.95, -1.9]], [0.0, 0.8, 0.4], 3, 0.3, spin_clip(), 'A 5.4 m fibreglass bass boat with raised casting decks, two swivel seats and a big outboard: the fastest fishing boat on a lake; shallow draught.')
bass_boat()
# ================= pontoon, runabout, fishing boat, jet ski =================
def pontoon_boat():
    P = {'body': [cylz(sx*1.0, -0.05, -3.2, 3.0, 0.32, 'pontoon', n=10) for sx in (-1, 1)] + [tip([sx*1.0, -0.05, 3.0], [sx*1.0, -0.05, 3.5], 0.3, 0.3, 'pontoon', n=8, rot=0) for sx in (-1, 1)] + [b(-1.45, 0.3, -3.0, 1.45, 0.36, 3.1, 'deck'), b(-1.0, 0.36, -3.0, 1.0, 0.37, 0.8, 'teak'),
            b(-1.5, 0.36, -3.0, 1.5, 0.4, -2.96, 'chrome'), b(-1.5, 0.36, 3.1, 1.5, 0.4, 3.14, 'chrome')] + [tube([sx*1.45, 0.9, -3.0], [sx*1.45, 0.9, 3.1], 0.02, 'chrome') for sx in (-1, 1)] +
            [tube([sx*1.45, 0.36, z], [sx*1.45, 0.9, z], 0.02, 'chrome') for sx in (-1, 1) for z in (-3.0, -1.5, 0.0, 1.5, 3.1)] + [b(-1.3, 0.37, -1.2, 1.3, 0.65, -0.5, 'seatB'), b(-1.3, 0.65, -1.2, 1.3, 1.0, -1.1, 'seatB'), b(-1.3, 0.37, 1.6, -0.5, 0.65, 3.0, 'seatB'), b(0.5, 0.37, 1.6, 1.3, 0.65, 3.0, 'seatB'), b(0.9, 0.37, -0.1, 1.4, 1.2, 0.5, 'white'), b(1.0, 1.2, -0.05, 1.3, 1.35, 0.4, 'black'),
            tube([0.95, 0.4, 0.0], [0.95, 1.05, 0.0], 0.02, 'steel'), b(-1.4, 2.2, -3.0, 1.4, 2.26, 0.6, 'canopy'), b(-1.0, 1.0, -3.0, 1.0, 1.04, -2.96, 'chrome')] + [tube([sx*1.35, 0.4, z], [sx*1.35, 2.2, z], 0.02, 'steel') for sx in (-1, 1) for z in (-3.0, 0.6)] + [b(-0.15, 0.37, 3.0, 0.15, 0.5, 3.1, 'steel')]}
    R = rg(); with_motor(P, R, -3.4, 0.4, 1.0)
    P['body'] += [b(-1.0, 0.0, -3.2, 1.0, 0.3, -3.15, 'pontoon')][0:0] + [b(-0.5, 0.2, -3.2, 0.5, 0.36, -2.9, 'steelD')]
    boat('pontoon_boat', P, R, [[0.0, 0.9, 0.0], [-0.9, 0.7, 2.3], [0.9, 0.7, 2.3], [-0.9, 0.7, -0.8]], [1.15, 0.9, 0.2], 8, 0.32, spin_clip(), 'A 6.5 m pontoon party boat with a canopy, bench seating and a helm: eight people, very stable, slow; a floating base for a lake.')
pontoon_boat()
def runabout():
    st = [(-2.4, 0.9, 0.55, -0.22, 0.4), (-1.0, 0.95, 0.6, -0.3, 0.46), (0.5, 0.85, 0.45, -0.3, 0.5), (1.6, 0.5, 0.2, -0.2, 0.6), (2.5, 0.03, 0.02, -0.02, 0.72)]
    P = {'body': solid_hull(st, 'BODY') + [b(-0.8, 0.42, -2.3, 0.8, 0.48, -0.4, 'deck'), b(-0.7, 0.44, -1.0, 0.7, 0.5, 0.1, 'seat'), b(-0.7, 0.5, -1.0, 0.7, 0.9, -0.9, 'seat'), b(-0.55, 0.5, 0.2, -0.1, 0.9, 0.5, 'steelD'), b(-0.5, 0.5, 0.4, 0.5, 0.52, 1.5, 'seatB'), b(-0.7, 0.5, 0.4, 0.7, 0.54, 0.45, 'chrome'), b(-0.6, 0.56, 0.5, 0.6, 1.0, 0.55, 'glass'), b(-0.62, 0.52, 0.45, 0.62, 0.58, 0.56, 'chrome'), b(-0.4, 0.4, 0.5, 0.0, 0.6, 1.4, 'whiteD'),
            b(-0.95, 0.5, -0.1, 0.95, 0.52, 0.05, 'whiteD'), b(-0.8, 0.48, -2.3, 0.8, 0.56, -2.1, 'whiteD'), b(-0.03, 0.72, 2.45, 0.03, 0.85, 2.5, 'white')]}
    R = rg(); with_motor(P, R, -2.45, 0.45, 1.0)
    boat('runabout', P, R, [[-0.3, 0.55, 0.4], [0.2, 0.55, -0.6], [-0.2, 0.55, -0.6], [0, 0.55, 1.0]], [-0.3, 0.8, 0.45], 4, 0.3, spin_clip(), 'A 5 m bowrider speedboat with a windscreen and a big outboard: fast and thirsty on the big lakes; loud, so it draws aliens.')
runabout()
def fishing_boat():
    st = [(-3.0, 1.0, 0.7, -0.35, 0.55), (-1.5, 1.05, 0.7, -0.45, 0.6), (0.5, 0.95, 0.5, -0.45, 0.65), (2.0, 0.6, 0.25, -0.35, 0.8), (3.2, 0.03, 0.02, -0.05, 1.0)]
    P = {'body': solid_hull(st, 'BODY') + [b(-0.95, 0.56, -3.0, 0.95, 0.62, -0.2, 'deck'), b(-0.85, 0.65, -0.9, 0.85, 1.5, 1.0, 'white'), b(-0.9, 1.5, -0.95, 0.9, 1.56, 1.05, 'whiteD'), b(-0.6, 1.0, 1.0, 0.6, 1.4, 1.03, 'glass'), b(-0.6, 1.0, -0.92, 0.6, 1.4, -0.89, 'glass'), b(-0.86, 1.0, 0.0, -0.84, 1.4, 0.8, 'glass'), b(0.84, 1.0, 0.0, 0.86, 1.4, 0.8, 'glass'),
            b(-0.1, 1.56, 0.0, 0.1, 2.4, 0.1, 'steel'), b(-0.4, 2.0, -0.05, 0.4, 2.04, 0.1, 'steel'), b(-0.05, 2.4, 0.0, 0.05, 2.6, 0.05, 'light', **G), b(-0.7, 0.62, -2.8, 0.7, 0.9, -2.4, 'inside'), b(-0.2, 0.7, 0.9, 0.2, 1.0, 1.0, 'black'), b(-0.1, 0.62, 2.0, 0.1, 0.9, 2.1, 'steel')] +
            [tube([sx*0.95, 0.6, -2.8 + 0.5*i], [sx*1.05, 1.1, -2.8 + 0.5*i], 0.02, 'steelD') for sx in (-1, 1) for i in range(3)] + [b(-0.6, 0.9, 0.1, 0.6, 1.0, 0.7, 'inside')][0:0] + [tube([sx*0.4, 1.56, -0.5], [sx*2.2, 2.6, -0.5], 0.015, 'rod') for sx in (-1, 1)]}
    R = rg(); with_motor(P, R, -3.05, 0.5, 1.0)
    boat('fishing_boat', P, R, [[0.0, 0.7, 0.3], [0.5, 0.7, -2.0], [-0.5, 0.7, -2.0], [0, 0.7, -1.6]], [0.0, 1.1, 0.6], 5, 0.4, spin_clip(), 'A 6.5 m fishing boat with a wheelhouse, outriggers, a rear fishing deck and a fish hold; the best boat for a long trip on a big lake or a wide river.')
fishing_boat()
def jet_ski():
    st = [(-1.35, 0.5, 0.35, -0.1, 0.35), (-0.5, 0.55, 0.38, -0.12, 0.42), (0.5, 0.5, 0.3, -0.1, 0.5), (1.1, 0.25, 0.12, -0.04, 0.55), (1.45, 0.03, 0.02, 0.0, 0.6)]
    P = {'body': solid_hull(st, 'BODY') + [b(-0.2, 0.42, -1.2, 0.2, 0.65, -0.1, 'seat'), b(-0.3, 0.5, 0.2, 0.3, 0.72, 0.6, 'whiteD'), b(-0.04, 0.72, 0.4, 0.04, 0.95, 0.5, 'steel'), b(-0.3, 0.9, 0.35, 0.3, 0.95, 0.5, 'black'), b(-0.1, 0.6, 1.0, 0.1, 0.68, 1.2, 'light', **G), b(-0.2, 0.2, -1.4, 0.2, 0.36, -1.3, 'steelD'), b(-0.4, 0.38, -1.3, 0.4, 0.5, -0.4, 'whiteD')]}
    boat('jet_ski', P, rg(), [[0, 0.7, -0.5], [0, 0.7, -0.9]], [0, 0.9, 0.4], 2, 0.1, {}, 'A 3.2 m jet ski for the big lakes: two people astride; very fast, loud, no prop to hit snags (but a pump to clog with weed).')
jet_ski()
# ================= sail, houseboat, barge =================
def sailing_dinghy():
    st = [(-1.7, 0.6, 0.4, -0.14, 0.34), (-0.6, 0.72, 0.45, -0.2, 0.34), (0.5, 0.65, 0.35, -0.18, 0.34), (1.3, 0.3, 0.12, -0.1, 0.4), (1.7, 0.03, 0.02, -0.02, 0.45)]
    P = {'body': open_hull(st, 0.035, 'BODY', 'inside', 'insideD') + wall_top(st, 'whiteD', 0.04) + thwart(-0.7, 0.7, 0.26, 0.04, 'wood') + thwart(0.2, 0.62, 0.26, 0.04, 'wood') + [b(-0.5, 0.0, -1.72, 0.5, 0.34, -1.68, 'BODY'), b(-0.06, 0.26, 0.5, 0.06, 0.4, 0.7, 'steelD'), cylz(0, 0.32, 0.55, 0.65, 0.05, 'wood')][0:2] + [tube([0, 0.34, 0.55], [0, 3.6, 0.55], 0.03, 'chrome')] + [tube([0, 3.5, 0.55], [0, 0.35, 1.7], 0.008, 'steelD'), tube([0, 3.5, 0.55], [0, 0.35, -1.6], 0.008, 'steelD')] + [b(-0.02, -0.7, 0.5, 0.02, -0.14, 0.9, 'woodL')]}
    P['sail'] = [flat([(0.0, 0.5, -0.02), (0.0, 3.4, 0.0), (0.0, 0.5, -1.55)][::1], 'sail', (1, 0, 0)), flat([(0.0, 0.5, -1.55), (0.0, 3.4, 0.0), (0.0, 0.5, -0.02)], 'sail', (-1, 0, 0)), b(-0.02, 3.1, -0.02, 0.02, 3.3, 0.0, 'sailR'), b(-0.02, 0.45, -1.6, 0.02, 0.5, 0.0, 'wood')]
    P['rudder'] = [b(-0.015, -0.4, -0.2, 0.015, 0.2, 0.05, 'woodL'), tube([0, 0.2, 0.0], [0, 0.3, 0.6], 0.015, 'wood')]
    R = rg(); R['sail'] = {'parent': 'body', 'pivot': [0, 0.5, 0.55], 'turn': [0, 1, 0], 'range': [-80, 80], 'rest': 0, 'note': 'the sail and boom swing about the mast: let it out running downwind, haul in close to the wind; positive swings the boom to port'}
    R['rudder'] = {'parent': 'body', 'pivot': [0, 0.0, -1.65], 'turn': [0, 1, 0], 'range': [-35, 35], 'rest': 0, 'note': 'steers the boat'}
    P['rudder'] = [b(-0.015, -0.4, -1.75, 0.015, 0.34, -1.6, 'woodL'), tube([0, 0.34, -1.7], [0, 0.3, -0.7], 0.015, 'wood')]
    boat('sailing_dinghy', P, R, [[0, 0.3, 0.2], [0, 0.3, -0.7]], [0, 0.4, -0.7], 3, 0.45, {'tack': [{'t': 0, 'sail': -50, 'rudder': 10}, {'t': 2, 'sail': 50, 'rudder': -10}]}, 'A 3.5 m sailing dinghy: a mast, a sail and boom, a rudder and a drop-keel board. Free fuel on windy days, no use becalmed; two to three people.')
sailing_dinghy()
def houseboat():
    P = {'body': [b(-2.0, -0.3, -6.0, 2.0, 0.5, 6.0, 'hullD'), b(-2.1, 0.5, -6.1, 2.1, 0.6, 6.1, 'deck'), b(-1.7, 0.6, -5.0, 1.7, 3.1, 2.5, 'BODY'), b(-1.8, 3.1, -5.1, 1.8, 3.2, 2.6, 'whiteD'), b(-1.5, 3.2, -4.0, 1.5, 3.9, -0.5, 'BODY'), b(-1.6, 3.9, -4.1, 1.6, 4.0, -0.4, 'whiteD'), b(-1.7, 0.6, 2.5, 1.7, 1.2, 2.55, 'whiteD')] +
         [b(sx*1.7 - 0.01, 1.1, z - 0.5, sx*1.7 + 0.01, 2.4, z + 0.5, 'glass') for sx in (-1, 1) for z in (-4.0, -2.5, -1.0, 0.5, 1.8)] + [b(-0.5, 0.6, 2.51, 0.5, 2.3, 2.55, 'woodD'), b(-0.4, 1.2, 2.56, 0.4, 2.1, 2.58, 'glass')] + [tube([sx*1.9, 0.6, z], [sx*1.9, 1.5, z], 0.02, 'chrome') for sx in (-1, 1) for z in (-5.8, -3.0, 0.0, 3.0, 5.8)][0:0] +
         [tube([sx*2.0, 1.3, -6.0], [sx*2.0, 1.3, 6.0], 0.025, 'chrome') for sx in (-1, 1)] + [tube([sx*2.0, 0.6, z], [sx*2.0, 1.3, z], 0.02, 'chrome') for sx in (-1, 1) for z in (-6.0, -3.0, 0.0, 3.0, 6.0)] + [b(-1.0, 4.0, -3.0, 1.0, 4.4, -2.0, 'steelD'), b(-0.8, 0.6, 3.0, 0.8, 0.9, 5.0, 'wood'), b(-1.4, 3.2, 0.5, -0.4, 3.35, 2.0, 'blue'), b(0.9, 3.0, -4.6, 1.0, 4.2, -4.5, 'chrome')][0:5] + [cylz(1.2, 3.9, -3.5, -3.0, 0.15, 'steel')],
         'prop': []}
    P.pop('prop'); R = rg(); with_motor(P, R, -6.05, 0.1, 1.0)
    boat('houseboat', P, R, [[0, 0.7, 4.0], [0.0, 3.3, -2.0], [0, 0.7, 0.0]], [0.0, 1.6, 1.8], 10, 0.3, spin_clip(), 'A 12 m houseboat for the big lakes: two floors, a roof deck and a front deck; a floating base and storage for a group, moored at a marina. Barely moves; the engine drinks fuel.')
houseboat()
def ferry_barge():
    P = {'body': [b(-2.2, -0.2, -5.0, 2.2, 0.55, 5.0, 'hullD'), b(-2.3, 0.55, -5.1, 2.3, 0.62, 5.1, 'deck'), b(-2.3, 0.62, -5.1, -2.2, 0.95, 5.1, 'BODY'), b(2.2, 0.62, -5.1, 2.3, 0.95, 5.1, 'BODY'), b(-1.8, 0.62, -5.0, -1.4, 2.4, -4.6, 'steel'), b(1.4, 0.62, -5.0, 1.8, 2.4, -4.6, 'steel'), b(-1.8, 2.4, -5.0, 1.8, 2.7, -4.6, 'yellow'), b(-0.6, 0.62, -4.4, 0.6, 1.8, -3.4, 'BODY'), b(-0.5, 1.2, -3.41, 0.5, 1.7, -3.39, 'glass'),
                       b(-2.3, 0.62, 4.9, -2.1, 1.2, 5.1, 'rubber'), b(2.1, 0.62, 4.9, 2.3, 1.2, 5.1, 'rubber'), cylz(0, 1.0, -5.0, 5.0, 0.03, 'rope'), b(-0.1, 0.62, 5.0, 0.1, 0.7, 5.2, 'steelD')][0:12],
         'ramp': [b(-2.0, -0.05, 0.0, 2.0, 0.05, 1.8, 'steel'), b(-2.0, 0.05, 1.7, 2.0, 0.15, 1.8, 'yellow')]}
    R = rg(); R['ramp'] = {'parent': 'body', 'pivot': [0, 0.6, 5.1], 'turn': [1, 0, 0], 'range': [0, 80], 'rest': 80, 'note': 'the bow ramp: down (rest) to load a car or a cart from the bank; raised to cross'}
    P['ramp'] = [b(-2.0, 0.0, 0.0, 2.0, 0.08, 1.8, 'steel'), b(-2.0, 0.08, 1.7, 2.0, 0.14, 1.8, 'yellow')]
    R['ramp']['pivot'] = [0, 0.6, 5.0]; P['ramp'] = [b(-2.0, 0.55, 5.0, 2.0, 0.63, 6.8, 'steel'), b(-2.0, 0.63, 6.7, 2.0, 0.7, 6.8, 'yellow')]
    boat('ferry_barge', P, R, [[0, 1.0, -4.0]], [0, 1.2, -3.9], 12, 0.2, {'ramp': [{'t': 0, 'ramp': 80}, {'t': 2, 'ramp': 0}]}, 'A 10 m cable ferry barge that crosses a river on a rope: carries two cars or a loaded wagon; a bank-to-bank shortcut when the bridges are down.')
ferry_barge()
# ================= improvised rafts =================
def inflatable_raft():
    r = 0.22; P = {'body': [cylx(-0.85, 0.85, 0.0, z, r, 'BODY', 8) for z in (-1.35, 1.35)] + [cylz(sx*0.85, 0.0, -1.35, 1.35, r, 'BODY') for sx in (-1, 1)] + [b(-0.65, -0.18, -1.2, 0.65, -0.1, 1.2, 'tubeD'), b(-0.6, -0.1, -1.1, 0.6, 0.02, 1.1, 'tubeD')] + [tube([0.0, 0.2, -0.2], [0.0, 0.2, 0.2], 0.01, 'rope')][0:0]}
    P['paddle'] = [tube([0.3, 0.1, 0.0], [0.7, 0.1, 0.5], 0.015, 'black'), b(0.65, 0.05, 0.5, 0.85, 0.15, 0.9, 'white')]
    R = rg(); R['paddle'] = {'parent': 'body', 'pivot': [0.5, 0.35, 0.1], 'turn': [1, 0, 0], 'range': [-45, 45], 'rest': 0, 'note': 'sweep fore and aft on one side'}
    boat('inflatable_raft', P, R, [[0.4, 0.1, 0.5], [-0.4, 0.1, 0.5], [0, 0.1, -0.5], [0.4, 0.1, -0.5]], [0.4, 0.2, 0.5], 4, 0.1, {'paddle': [{'t': 0, 'paddle': -40}, {'t': 0.8, 'paddle': 40}]}, 'A 3 m inflatable rubber raft: from a shop or a rescue kit; four people; punctured by snags or claws and then useless.')
inflatable_raft()
def log_raft():
    P = {'body': [cylz(-1.2 + 0.4*i, -0.05, -1.6, 1.6, 0.2, ('log', 'logD')[i % 2], n=8) for i in range(7)] + [cylx(-1.3, 1.3, 0.2, z, 0.06, 'logD') for z in (-1.0, 0.0, 1.0)] + [b(-1.2, 0.25, -0.9, 1.2, 0.3, 0.9, 'wood')][0:0] + [b(sx, 0.14, z - 0.07, sx + 0.0, 0.2, z + 0.07, 'rope') for sx in (0.0,) for z in (-1.0, 0.0, 1.0)][0:0],
         'pole': [tube([0.0, 0.1, 0.0], [0.0, 2.6, 0.0], 0.03, 'woodD')][0:0]}
    P['pole'] = [tube([0.0, 0.0, 0.0], [0.5, 0.2, 2.2], 0.03, 'woodD')]
    R = rg(); R['pole'] = {'parent': 'body', 'pivot': [0.9, 0.3, 0.5], 'turn': [1, 0, 0], 'range': [-30, 50], 'rest': 0, 'note': 'a punting pole: push against the bottom in shallow water'}
    boat('log_raft', P, R, [[0, 0.3, 0.0], [0.6, 0.3, 0.7], [-0.6, 0.3, -0.7]], [0, 0.3, 0.0], 3, 0.1, {'pole': [{'t': 0, 'pole': -20}, {'t': 1, 'pole': 40}]}, 'A crude raft of seven logs lashed with crossbars: craft it from logs and rope; poled across a creek or a pond; slow, wet underfoot, three people.')
log_raft()
def barrel_raft():
    P = {'body': [cyl([sx*0.5, 0.2, -1.05 + 0.7*i], [0.52, 0.7, 0.52], ('barrel', 'barrelR')[(i + (sx > 0)) % 2]) for sx in (-1, 1) for i in range(4)] + [b(-0.9, 0.55, -1.5, 0.9, 0.62, 1.5, 'wood'), b(-0.9, 0.62, -1.5, 0.9, 0.64, 1.5, 'woodL')] + [b(-0.9, 0.5, z - 0.05, 0.9, 0.56, z + 0.05, 'woodD') for z in (-1.3, 0.0, 1.3)],
         'paddle': [tube([0.0, 0.0, 0.0], [0.5, 0.0, 0.6], 0.02, 'woodD'), b(0.45, -0.05, 0.55, 0.65, 0.05, 0.95, 'woodL')]}
    R = rg(); R['paddle'] = {'parent': 'body', 'pivot': [0.9, 0.9, 0.2], 'turn': [1, 0, 0], 'range': [-40, 40], 'rest': 0, 'note': 'sweep to paddle'}
    boat('barrel_raft', P, R, [[0.0, 0.7, 0.4], [0.5, 0.7, -0.5], [-0.5, 0.7, -0.5]], [0.0, 0.7, 0.4], 3, 0.1, {'paddle': [{'t': 0, 'paddle': -35}, {'t': 0.9, 'paddle': 35}]}, 'A raft of eight blue barrels and planks: craft it from barrels, planks and nails; floats loaded, slow to turn; paddled.')
barrel_raft()
# ================= water pieces (decals, at y = 0.02) =================
def wake():
    return [flat([(sx*0.2 + 0.0, 0.02, 0.0), (sx*0.3, 0.02, 0.0), (sx*3.0, 0.02, -8.0), (sx*2.7, 0.02, -8.0)][::sx], 'foam', (0, 1, 0)) for sx in (-1, 1)]
M['wake_v'] = {'body': wake()}; RIG['wake_v'] = rg(); CLIPS['wake_v'] = {}; NOTE['wake_v'] = 'A V-shaped wake behind a moving boat, 8 m long and 6 m wide at the tail; scale by speed and fade it out along its length.'
M['bow_wave'] = {'body': [flat([(-0.5, 0.02, 0.0), (0.5, 0.02, 0.0), (0.7, 0.02, -1.2), (-0.7, 0.02, -1.2)], 'foam', (0, 1, 0)), b(-0.25, 0.0, 0.0, 0.25, 0.1, 0.35, 'foam')]}; RIG['bow_wave'] = rg(); CLIPS['bow_wave'] = {}; NOTE['bow_wave'] = 'A white curl of water at the bow of a fast boat.'
M['prop_wash'] = {'body': [loft([[0, 0.02, 0, 0.5, 0.5], [0, 0.04, 0, 0.35, 0.35]], 'foam', n=10), loft([[0, 0.02, -0.8, 0.35, 0.5], [0, 0.04, -0.8, 0.25, 0.35]], 'foam', n=8), loft([[0, 0.02, -1.6, 0.3, 0.45], [0, 0.03, -1.6, 0.2, 0.3]], 'foam', n=8)]}; RIG['prop_wash'] = rg(); CLIPS['prop_wash'] = {}; NOTE['prop_wash'] = 'Churned white water under the stern of a motor boat.'
M['splash_ring'] = {'body': [loft([[0, 0.02, 0, 0.55, 0.55], [0, 0.04, 0, 0.5, 0.5]], 'foam', n=12), loft([[0, 0.02, 0, 1.0, 1.0], [0, 0.03, 0, 0.9, 0.9]], 'foam', n=12)]}; RIG['splash_ring'] = rg(); CLIPS['splash_ring'] = {}; NOTE['splash_ring'] = 'Two rings of foam where something falls in the water; fade and spread them out.'
for k in ('wake_v', 'bow_wave', 'prop_wash', 'splash_ring'): SEATS[k] = []; HELM[k] = []; BUOY[k] = 0; DRAFT[k] = 0
pack = {'name': 'boats', 'version': 1, 'units': 'metres', 'facing': '+Z', 'palette': PALETTE, 'paint': PAINT, 'darker': 0.78, 'about': __doc__.split('\n', 2)[2], 'models': M, 'rig': RIG, 'clips': CLIPS, 'notes': NOTE,
        'seats': SEATS, 'helm': HELM, 'buoy': BUOY, 'draught': DRAFT,
        'rule': ('Draw as the machines pack (BODY = paint[name]; parts outward from the body; subtract each pivot, apply the value), but there are no wheels. Put the water line at y = 0 and the boat\'s y at the water height under it. The bow is +Z. '
                 'Drive: motor boats turn `motor` about Y to steer and spin `prop` about Z; row `oar_l` and `oar_r` together; paddle boats sweep or roll `paddle`; the sailing dinghy swings `sail` and `rudder`. Pitch and roll the whole boat a little with the waves (rx and rz are not supported by shaped pieces, so tilt the object, not the piece), and bob it by about 0.04 m. '
                 'Capacity is buoy[name] survivors; over it the boat sits to the gunwale and ships water. Show wake_v behind a boat above walking pace, bow_wave at the bow above 4 m/s, prop_wash under a running outboard, splash_ring where something falls in. '
                 'Placement: kayaks, canoes, jon boats and rowboats at docks, boat ramps and on lake and river banks; pontoons, runabouts, bass boats and jet skis at marinas and big-lake docks; the fishing boat and houseboat at the biggest marinas; rafts crafted by the player; the ferry barge on a rope at an unbridged river crossing.')}
if __name__ == '__main__':
    import os
    out, st = write_pack('boats', pack, __file__)
    print(os.path.getsize(out)//1024, 'KB', len(M), 'models')
    print({k: v[0] for k, v in st.items() if '.' not in k})
