#!/usr/bin/env python3
"""Afterstreet survivor pack, version 7 (18 October 2026): silhouette first, from the user's Kentucky Route Zero-style lineup.
Every character creator choice as faceted pieces, grouped by skeleton bone. Writes assets/shaped/survivor.js.
Run: python3 assets/shaped/src/survivor.py

Shape language (from the reference lineup): square shoulders and a torso that is one wedge narrowing to the waist; arms that
taper from the shoulder to a pointed hand; long straight legs like columns; small dark block feet; a small head with a sharp
profile and no eyes; hair as one or two flat angular masses; every colour one big flat plane. Costume accents sit at the
joints (collars, cuffs, belts, rolled hems), after Jumpship.
Fewest vertices: every body part is a rectangular frustum, so each side is one flat face (4 corners); limbs end in points;
no ears, no eye shapes. Coordinates: metres, facing +Z, the survivor's left is +X. Each bone lists its pivot (joint) and
tip (next joint) so the game can fit the pieces to its own skeleton."""
import math
from kit import *

# ================= skeleton (1.80 m, standing straight and relaxed) =================
BONES = {
  'pelvis':   {'pivot': [0, 0.96, 0], 'tip': [0, 1.06, 0]},
  'spine_01': {'pivot': [0, 1.06, 0], 'tip': [0, 1.18, 0.004], 'parent': 'pelvis'},
  'spine_02': {'pivot': [0, 1.18, 0.004], 'tip': [0, 1.32, 0.008], 'parent': 'spine_01'},
  'spine_03': {'pivot': [0, 1.32, 0.008], 'tip': [0, 1.46, 0.004], 'parent': 'spine_02'},
  'neck_01':  {'pivot': [0, 1.46, 0.004], 'tip': [0, 1.55, 0.022], 'parent': 'spine_03'},
  'Head':     {'pivot': [0, 1.55, 0.022], 'tip': [0, 1.765, 0.01], 'parent': 'neck_01'},
}
J = {}
for sg, sd in ((1, 'l'), (-1, 'r')):
    J['sh' + sd] = [sg*0.198, 1.43, 0.0]; J['el' + sd] = [sg*0.236, 1.15, -0.03]; J['wr' + sd] = [sg*0.258, 0.9, 0.02]; J['ft' + sd] = [sg*0.252, 0.76, 0.04]
    J['hp' + sd] = [sg*0.085, 0.94, 0.0]; J['kn' + sd] = [sg*0.09, 0.5, 0.01]; J['an' + sd] = [sg*0.092, 0.08, -0.01]
    BONES['upperarm_' + sd] = {'pivot': J['sh' + sd], 'tip': J['el' + sd], 'parent': 'spine_03'}
    BONES['lowerarm_' + sd] = {'pivot': J['el' + sd], 'tip': J['wr' + sd], 'parent': 'upperarm_' + sd}
    BONES['hand_' + sd]     = {'pivot': J['wr' + sd], 'tip': J['ft' + sd], 'parent': 'lowerarm_' + sd}
    BONES['thigh_' + sd]    = {'pivot': J['hp' + sd], 'tip': J['kn' + sd], 'parent': 'pelvis'}
    BONES['calf_' + sd]     = {'pivot': J['kn' + sd], 'tip': J['an' + sd], 'parent': 'thigh_' + sd}
    BONES['foot_' + sd]     = {'pivot': J['an' + sd], 'tip': [sg*0.092, 0.03, 0.08], 'parent': 'calf_' + sd}
    BONES['ball_' + sd]     = {'pivot': [sg*0.092, 0.03, 0.08], 'tip': [sg*0.092, 0.02, 0.15], 'parent': 'foot_' + sd}

PALETTE = {
  'frame': '#a84a36', 'shades': '#16171a', 'lens': '#8fa7ad', 'freckle': '#a8694e', 'scar': '#c48a7a', 'lip': '#7e4840',
  'helmet': '#55603e', 'helmetD': '#3f4830', 'belt': '#2a221d', 'buckle': '#a39a86', 'fur': '#d8ccb4', 'tie': '#8c3a3a',
  'trainer': '#5b5f66', 'trainerSole': '#e2ddd2', 'boot': '#3a2a22', 'bootD': '#261b16', 'rainboot': '#c99a3a', 'rainbootD': '#9c7429',
  'sole': '#1d1a18', 'pack': '#6e5a3c', 'packD': '#4f412b', 'strap': '#2b2d33', 'roll': '#8c6a3a', 'bottle': '#5b7f86',
  'glove': '#4a3328', 'gloveD': '#33231b', 'denimRoll': '#6b84a6',
  'sweater': '#7a8a5e', 'coat': '#8a6f5a', 'raincoat': '#c8a23a', 'leather': '#4a3a32', 'trousers': '#5d6670', 'thermals': '#c9b8a0',
  'toggle': '#d8ccb4', 'zip': '#2a2b2e', 'stripe': '#d8dcd6'
}
SLOTS = {
  'SKIN':  ['#f0d2bd', '#dcae8c', '#bd8860', '#8c5b3c', '#583926'],
  'HAIR':  ['#1d1a19', '#4a3426', '#86412a', '#c4a066', '#b4b1ab'],
  'SHIRT': 'player colour', 'PANTS': 'player colour', 'ACC': 'player second colour'
}
TONE = {'y0': 0.0, 'y1': 1.8, 'lo': 0.8, 'hi': 1.04, 'jitter': 0.0}

# ================= head: small, sharp profile, no eyes =================
HEAD_ANG = [30, 90, 150, 210, 270, 330]          # a corner straight ahead makes the profile's nose line
HROWS = [  # y, half-width, half-depth, z, k for the front corner
    (1.548, 0.03, 0.03, 0.06, 1.0), (1.59, 0.056, 0.066, 0.036, 1.0), (1.632, 0.064, 0.074, 0.028, 1.2),
    (1.68, 0.068, 0.078, 0.024, 1.06), (1.725, 0.067, 0.078, 0.02, 1.0), (1.765, 0.046, 0.058, 0.012, 1.0)]
def head_rings(g=0.0, y0=None, y1=None):
    rows = []
    for y, a, b, z, kf in HROWS:
        rows.append([0, y, z, a + g, b + g, [1, kf, 1, 1, 1, 1]])
    if y0 is not None or y1 is not None:
        y0 = HROWS[0][0] if y0 is None else y0; y1 = HROWS[-1][0] if y1 is None else y1
        def at(y):
            for r0, r1 in zip(rows, rows[1:]):
                if r0[1] <= y <= r1[1]:
                    f = (y - r0[1])/(r1[1] - r0[1]); return [lerp(r0[i], r1[i], f) for i in range(5)] + [[lerp(p, q, f) for p, q in zip(r0[5], r1[5])]]
            return list(rows[0] if y < rows[0][1] else rows[-1])
        rows = [at(y0)] + [r for r in rows if y0 < r[1] < y1] + [at(y1)]
    return rows
def ring_pts(r, ang):
    return [(r[0] + math.cos(math.radians(t))*r[3]*r[5][i], r[1], r[2] + math.sin(math.radians(t))*r[4]*r[5][i]) for i, t in enumerate(ang)]
def front_z(rings, ang, x, y):
    for r0, r1 in zip(rings, rings[1:]):
        if r0[1] <= y <= r1[1]:
            f = (y - r0[1])/(r1[1] - r0[1]); zs = []
            for r in (r0, r1):
                pts = ring_pts(r, ang); best = None
                for i in range(len(pts)):
                    p, q = pts[i], pts[(i + 1) % len(pts)]
                    if (p[0] - x)*(q[0] - x) <= 0 and abs(q[0] - p[0]) > 1e-9:
                        z = p[2] + (q[2] - p[2])*(x - p[0])/(q[0] - p[0]); best = z if best is None else max(best, z)
                zs.append(best)
            return lerp(zs[0], zs[1], f)
    return None
def face_z(x, y): return front_z(head_rings(), HEAD_ANG, x, y)
def on_face(pts, lift=0.002): return [(x, y, face_z(x, y) + lift) for x, y in pts]
EYE_Y = 1.672
def head(fem):
    rows = head_rings()
    if fem:
        for r in rows:
            if r[1] < 1.6: r[3] *= 0.92
            r[5][1] = 1 + (r[5][1] - 1)*0.6
    nw = 0.038 if fem else 0.044
    neck = seg([0, 1.43, 0.0], [0, 1.575, 0.03], nw, nw, nw - 0.004, nw - 0.006, 'SKIN', caps=(False, False))
    return {'Head': [loft(rows, 'SKIN', ang=HEAD_ANG)], 'neck_01': [neck]}

# ================= torso: square shoulders, one wedge to the waist =================
TORSO = {  # y, half-width, half-depth, z
  False: [(0.92, 0.142, 0.092, 0.0), (1.08, 0.126, 0.088, 0.0), (1.3, 0.18, 0.104, 0.006), (1.425, 0.212, 0.1, 0.002), (1.455, 0.206, 0.094, 0.0)],
  True:  [(0.92, 0.152, 0.098, 0.0), (1.08, 0.116, 0.084, 0.0), (1.3, 0.152, 0.104, 0.01), (1.415, 0.184, 0.094, 0.004), (1.445, 0.178, 0.088, 0.0)]}
HEM, SPLIT = 0.92, 1.18
def t_at(fem, y):
    T = TORSO[fem]
    if y <= T[0][0]: return T[0][1:]
    for r0, r1 in zip(T, T[1:]):
        if r0[0] <= y <= r1[0]:
            f = (y - r0[0])/(r1[0] - r0[0]); return tuple(lerp(a, b, f) for a, b in zip(r0[1:], r1[1:]))
    return T[-1][1:]
def t_rings(fem, y0, y1, g):
    ys = [y0] + [r[0] for r in TORSO[fem] if y0 < r[0] < y1] + [y1]
    return [[0, y, t_at(fem, y)[2], t_at(fem, y)[0] + g, t_at(fem, y)[1] + g] for y in ys]
def fz(fem, y, g, lift=0.003):
    a, b, z = t_at(fem, y); return z + b + g + lift
def bz(fem, y, g, lift=0.003):
    a, b, z = t_at(fem, y); return z - b - g - lift
def chest(fem, col, g=0.0, hem=HEM, flare=0.0, belly=None):
    top = TORSO[fem][-1][0]
    lo = t_rings(fem, HEM, SPLIT, g); hi = t_rings(fem, SPLIT, top, g)
    lo[0][1] = hem; lo[0][3] += flare; lo[0][4] += flare*0.6
    return {'spine_01': [frustum(lo, belly or col, caps=[True, False])], 'spine_03': [frustum(hi, col, caps=[False, True])]}
def band(fem, y, h, g, col):
    return {('spine_01' if y < SPLIT else 'spine_03'): [frustum(t_rings(fem, y, y + h, g), col, caps=[False, False])]}
def front(fem, x0, x1, y0, y1, g, col, lift=0.003, back=False):
    """a flat panel on the front (or back) plane of the torso"""
    z = (lambda y: bz(fem, y, g, lift)) if back else (lambda y: fz(fem, y, g, lift))
    bone = 'spine_01' if (y0 + y1)/2 < SPLIT else 'spine_03'
    return {bone: [flat([(x0, y0, z(y0)), (x1, y0, z(y0)), (x1, y1, z(y1)), (x0, y1, z(y1))], col, (0, 0, -1) if back else (0, 0, 1))]}
def vee(fem, g, col, w=0.07, y0=1.24, top=None):
    """the V of an open neckline: a triangle on the chest plane"""
    top = top or TORSO[fem][-1][0] - 0.005
    return {'spine_03': [flat([(-w, top, fz(fem, top, g, 0.004)), (w, top, fz(fem, top, g, 0.004)), (0, y0, fz(fem, y0, g, 0.004))], col)]}

# ================= limbs: tapering to points =================
def upper(sd, g=0.0, t1=1.0):
    S, E = J['sh' + sd], J['el' + sd]; e = mixp(S, E, t1)
    return [[S[0], S[1] + 0.03, S[2], 0.046 + g, 0.05 + g], [*e, lerp(0.046, 0.034, t1) + g, lerp(0.05, 0.038, t1) + g]]
def lower(sd, g=0.0, t0=0.0, t1=1.0):
    E, W = J['el' + sd], J['wr' + sd]
    a = mixp(E, W, t0); b = mixp(E, W, t1)
    if t0 == 0.0: a = [E[0], E[1] + 0.03, E[2]]
    return [[*a, lerp(0.035, 0.024, t0) + g, lerp(0.038, 0.026, t0) + g], [*b, lerp(0.035, 0.024, t1) + g, lerp(0.038, 0.026, t1) + g]]
def hand(sd, col='SKIN', g=0.0):
    W, F = J['wr' + sd], J['ft' + sd]
    return [frustum([[W[0], W[1] + 0.02, W[2], 0.022 + g, 0.028 + g], [*mixp(W, F, 0.4), 0.02 + g, 0.032 + g]], col, caps=[True, False]),
            tip(mixp(W, F, 0.4), F, 0.02*math.sqrt(2) + g, 0.032*math.sqrt(2) + g, col)]
def hands(): return both_sides(lambda sg, sd: {'hand_' + sd: hand(sd)})
def sleeves(col, style='long', g=0.014, cuff=None):
    """style: 'long' (to the wrist, with a cuff), 'short' (to mid upper arm) or 'rolled' (to mid forearm, rolled cuff)"""
    def f(sg, sd):
        if style == 'short':
            s = upper(sd, g, 0.5); s[-1][3] += 0.01; s[-1][4] += 0.01
            return {'upperarm_' + sd: [frustum(upper(sd), 'SKIN', caps=[False, True]), frustum(s, col)], 'lowerarm_' + sd: [frustum(lower(sd), 'SKIN')]}
        o = {'upperarm_' + sd: [frustum(upper(sd, g), col)]}
        if style == 'rolled':
            o['lowerarm_' + sd] = [frustum(lower(sd, g, 0.0, 0.36), col, caps=[True, False]), frustum(lower(sd, g + 0.012, 0.3, 0.44), cuff or col + '_D'), frustum(lower(sd, 0.0, 0.4, 1.0), 'SKIN', caps=[False, True])]
        else:
            o['lowerarm_' + sd] = [frustum(lower(sd, g, 0.0, 0.84), col, caps=[True, False]), frustum(lower(sd, g + 0.008, 0.82, 1.0), cuff or col)]
        return o
    return both_sides(f)
def thigh(sd, g=0.0, t1=1.0):
    H, K = J['hp' + sd], J['kn' + sd]; e = mixp(H, K, t1)
    return [[H[0], H[1] + 0.04, H[2], 0.075 + g, 0.08 + g], [*e, lerp(0.075, 0.056, t1) + g, lerp(0.08, 0.06, t1) + g]]
def calf(sd, g=0.0, t0=0.0, t1=1.0, straight=False):
    K, A = J['kn' + sd], J['an' + sd]
    a = mixp(K, A, t0) if t0 else [K[0], K[1] + 0.03, K[2]]; b = mixp(K, A, t1)
    if straight:   # trouser legs fall as straight columns
        return [[*a, 0.056 + g, 0.06 + g], [*b, 0.052 + g, 0.056 + g]]
    return [[*a, lerp(0.056, 0.038, t0) + g, lerp(0.06, 0.042, t0) + g], [*b, lerp(0.056, 0.038, t1) + g, lerp(0.06, 0.042, t1) + g]]

# ================= tops =================
def tops(fem):
    T = {}; ty = TORSO[fem][-1][0]
    tee = join(chest(fem, 'SHIRT', 0.006), sleeves('SHIRT', 'short', 0.006), vee(fem, 0.006, 'SKIN', 0.045, 1.38), band(fem, ty - 0.02, 0.02, 0.008, 'SHIRT_D'))
    T['tshirt'] = tee
    T['striped_tee'] = join(tee, *[band(fem, y, 0.035, 0.009, 'ACC') for y in (1.0, 1.14, 1.28)])
    collar = {'spine_03': [wedge([sg*0.05, ty + 0.012, fz(fem, ty, 0.012) - 0.03], [0.07, 0.03, 0.05], 'SHIRT_D') for sg in (1, -1)]}
    T['flannel_shirt'] = join(chest(fem, 'SHIRT', 0.012, flare=0.006), sleeves('SHIRT', 'rolled', 0.012), vee(fem, 0.012, 'SKIN', 0.04, 1.39),
                              front(fem, -0.012, 0.012, HEM, SPLIT, 0.012, 'SHIRT_D'), front(fem, -0.012, 0.012, SPLIT, 1.38, 0.012, 'SHIRT_D'),
                              *[band(fem, y, 0.03, 0.015, 'ACC') for y in (1.02, 1.26)], collar)
    dots = [(-0.07, 1.36), (0.06, 1.33), (0.0, 1.24), (-0.05, 1.12), (0.07, 1.06), (-0.03, 0.98)]
    T['spotted_top'] = join(tee, *[front(fem, x - 0.012, x + 0.012, y - 0.012, y + 0.012, 0.006, 'ACC', 0.004) for x, y in dots])
    hood = {'spine_03': [frustum([[0, ty - 0.04, bz(fem, ty, 0.02, 0) - 0.03, 0.12, 0.05], [0, ty + 0.06, bz(fem, ty, 0.02, 0) - 0.01, 0.1, 0.045]], 'SHIRT_D')]}
    T['hoodie'] = join(chest(fem, 'SHIRT', 0.02), sleeves('SHIRT', 'long', 0.02, cuff='SHIRT_D'), band(fem, HEM, 0.05, 0.026, 'SHIRT_D'), hood,
                       front(fem, -0.09, 0.09, 0.97, 1.08, 0.02, 'SHIRT_D', 0.005), front(fem, -0.03, -0.022, 1.3, ty - 0.01, 0.02, 'ACC', 0.006), front(fem, 0.022, 0.03, 1.3, ty - 0.01, 0.02, 'ACC', 0.006))
    # long coat open over a shirt and tie, with a sheepskin collar (the first figure of the reference)
    fur = {'spine_03': [frustum([[0, ty - 0.03, 0.0, t_at(fem, ty)[0] + 0.03, t_at(fem, ty)[1] + 0.035], [0, ty + 0.04, -0.005, 0.11, 0.085]], 'fur', caps=[False, True])]}
    tie = {'spine_03': [flat([(-0.012, ty - 0.035, fz(fem, ty - 0.035, 0.026, 0.008)), (0.012, ty - 0.035, fz(fem, ty - 0.035, 0.026, 0.008)),
                              (0.016, 1.2, fz(fem, 1.2, 0.026, 0.008)), (0, 1.17, fz(fem, 1.17, 0.026, 0.008)), (-0.016, 1.2, fz(fem, 1.2, 0.026, 0.008))], 'tie')]}
    T['open_jacket'] = join(chest(fem, 'SHIRT', 0.026, hem=0.74, flare=0.03), sleeves('SHIRT', 'long', 0.024, cuff='SHIRT_D'), fur,
                            vee(fem, 0.026, 'ACC', 0.06, 1.16, ty - 0.03), tie, front(fem, -0.006, 0.006, 0.74, SPLIT, 0.026, 'SHIRT_D', 0.004))
    # V-neck pullover over a collared shirt and tie (the last figure of the reference)
    T['jumper'] = join(chest(fem, 'SHIRT', 0.014), sleeves('SHIRT', 'long', 0.014, cuff='SHIRT_D'), band(fem, HEM, 0.045, 0.02, 'SHIRT_D'), vee(fem, 0.014, 'ACC', 0.065, 1.22),
                       {'spine_03': [flat([(-0.01, ty - 0.01, fz(fem, ty - 0.01, 0.014, 0.008)), (0.01, ty - 0.01, fz(fem, ty - 0.01, 0.014, 0.008)), (0, 1.25, fz(fem, 1.25, 0.014, 0.008))], 'tie')]},
                       collar)
    bib = join(front(fem, -0.08, 0.08, 1.1, 1.32, 0.016, 'PANTS', 0.004), front(fem, 0.05, 0.075, 1.32, ty, 0.016, 'PANTS', 0.004), front(fem, -0.075, -0.05, 1.32, ty, 0.016, 'PANTS', 0.004),
               front(fem, 0.05, 0.075, 1.12, ty, 0.016, 'PANTS', 0.004, back=True), front(fem, -0.075, -0.05, 1.12, ty, 0.016, 'PANTS', 0.004, back=True))
    T['dungarees'] = join(chest(fem, 'ACC', 0.006, belly='PANTS'), sleeves('ACC', 'short', 0.006), bib)
    return T

# ================= bottoms: straight columns =================
def bottoms(fem):
    hip = 0.152 if fem else 0.146
    def pelvis(col, g=0.008):
        return {'pelvis': [frustum([[0, 0.84, 0.0, 0.118 + g, 0.084 + g], [0, 0.94, 0.0, hip + g, 0.098 + g], [0, 1.0, 0.0, hip - 0.004 + g, 0.096 + g]], col)]}
    belt = {'pelvis': [frustum([[0, 0.955, 0.0, hip + 0.016, 0.106], [0, 0.985, 0.0, hip + 0.014, 0.104]], 'belt', caps=[False, False]), box([0, 0.97, 0.108], [0.034, 0.024, 0.006], 'buckle')]}
    def legs(col, g=0.008, knee=None, calf_to=None, cuff=None, hem=0.1):
        def f(sg, sd):
            K, A = J['kn' + sd], J['an' + sd]
            if knee:   # shorts to above the knee, bare calves
                return {'thigh_' + sd: [frustum(thigh(sd, g + 0.012, knee), col, caps=[True, True]), frustum(thigh(sd, 0, 1.0), 'SKIN', caps=[False, True])],
                        'calf_' + sd: [frustum(calf(sd), 'SKIN', caps=[True, False])]}
            o = {'thigh_' + sd: [frustum(thigh(sd, g), col, caps=[False, True])]}
            t1 = (K[1] - (calf_to or hem))/(K[1] - A[1])
            o['calf_' + sd] = [frustum(calf(sd, g, 0.0, t1, straight=True), col)]
            if calf_to: o['calf_' + sd].append(frustum(calf(sd, 0, t1 - 0.05, 1.0), 'SKIN', caps=[False, False]))
            if cuff:
                y0, y1, cc = cuff; o['calf_' + sd].append(frustum(calf(sd, g + 0.008, (K[1] - y0)/(K[1] - A[1]), (K[1] - y1)/(K[1] - A[1]), straight=True), cc))
            return o
        return both_sides(f)
    def stripes(sg, sd):
        H, K, A = J['hp' + sd], J['kn' + sd], J['an' + sd]; x = lambda P, w: P[0] + sg*(w + 0.0025)
        return {'thigh_' + sd: [flat([(x(H, 0.092), 0.97, H[2] - 0.01), (x(H, 0.092), 0.97, H[2] + 0.01), (x(K, 0.074), K[1], K[2] + 0.01), (x(K, 0.074), K[1], K[2] - 0.01)], 'ACC', (sg, 0, 0))],
                'calf_' + sd: [flat([(x(K, 0.074), K[1], K[2] - 0.01), (x(K, 0.074), K[1], K[2] + 0.01), (x(A, 0.07), 0.16, A[2] + 0.01), (x(A, 0.07), 0.16, A[2] - 0.01)], 'ACC', (sg, 0, 0))]}
    B = {}
    B['jeans'] = join(pelvis('PANTS'), legs('PANTS'), belt)
    B['shorts'] = join(pelvis('PANTS'), legs('PANTS', knee=0.8), belt)
    B['cargo_trousers'] = join(pelvis('PANTS'), legs('PANTS', g=0.014), belt, both_sides(lambda sg, sd: {'thigh_' + sd: [box([J['hp' + sd][0] + sg*0.098, 0.66, 0.01], [0.022, 0.1, 0.08], 'PANTS_D')]}))
    B['capri_trousers'] = join(pelvis('PANTS'), legs('PANTS', calf_to=0.27))
    B['track_pants'] = join(pelvis('PANTS'), legs('PANTS', g=0.012, cuff=(0.14, 0.09, 'PANTS_D')), both_sides(stripes))
    B['rolled_jeans'] = join(pelvis('PANTS'), legs('PANTS', hem=0.14, cuff=(0.18, 0.13, 'denimRoll')), belt)
    return B

# ================= shoes: small dark blocks =================
def shoe(sd, col, sole=None, h=0.085):
    x = J['an' + sd][0]
    pts = [(x - 0.046, 0.0, -0.07), (x + 0.046, 0.0, -0.07), (x + 0.046, 0.0, 0.15), (x - 0.046, 0.0, 0.15),
           (x - 0.04, h, -0.06), (x + 0.04, h, -0.06), (x + 0.04, h*0.55, 0.13), (x - 0.04, h*0.55, 0.13)]
    o = [hull(pts, col)]
    if sole: o.append(box([x, 0.008, 0.04], [0.096, 0.016, 0.226], sole))
    return o
def shoes():
    S = {}
    S['trainers'] = both_sides(lambda sg, sd: {'foot_' + sd: shoe(sd, 'trainer', 'trainerSole', 0.08)})
    S['boots'] = both_sides(lambda sg, sd: {'foot_' + sd: shoe(sd, 'boot', 'sole', 0.09),
                                            'calf_' + sd: [frustum([[J['an' + sd][0], 0.07, -0.01, 0.048, 0.054], [J['an' + sd][0], 0.17, -0.008, 0.046, 0.052]], 'boot')]})
    S['rain_boots'] = both_sides(lambda sg, sd: {'foot_' + sd: shoe(sd, 'rainboot', 'sole', 0.09),
                                                 'calf_' + sd: [frustum([[J['an' + sd][0], 0.07, -0.01, 0.052, 0.058], [J['an' + sd][0], 0.33, -0.006, 0.06, 0.066]], 'rainboot'),
                                                                frustum([[J['an' + sd][0], 0.31, -0.006, 0.064, 0.07], [J['an' + sd][0], 0.34, -0.006, 0.064, 0.07]], 'rainbootD', caps=[False, False])]})
    return S

# ================= faces: no eyes; glasses and hair carry the character =================
def bar(col, y=EYE_Y, w=0.064, h=0.016, lift=0.012, d=0.012):
    z = face_z(0, y) + lift
    return [box([0, y, z - d/2], [w*2, h, d], col),
            *[box([sg*0.068, y + 0.002, z - 0.045], [0.006, 0.006, 0.09], col) for sg in (1, -1)]]
def faces():
    F = {}
    F['calm'] = []
    zl = face_z(0, EYE_Y) + 0.0125
    F['glasses'] = bar('frame', h=0.018) + [flat([(sg*0.033 - 0.022, EYE_Y - 0.007, zl), (sg*0.033 + 0.022, EYE_Y - 0.007, zl), (sg*0.033 + 0.022, EYE_Y + 0.007, zl), (sg*0.033 - 0.022, EYE_Y + 0.007, zl)], 'lens') for sg in (1, -1)]
    F['dark_glasses'] = bar('shades', h=0.022)
    F['stubble'] = [loft(head_rings(0.003, 1.548, 1.62), 'HAIR_MIX', ang=HEAD_ANG, caps=[True, False])]
    F['freckles'] = [flat(on_face([(x - 0.004, y - 0.004), (x + 0.004, y - 0.004), (x + 0.004, y + 0.004), (x - 0.004, y + 0.004)]), 'freckle')
                     for x, y in ((-0.038, 1.65), (-0.028, 1.643), (0.038, 1.65), (0.028, 1.643))]
    F['tired'] = [flat(on_face([(sg*0.016, EYE_Y - 0.004), (sg*0.05, EYE_Y - 0.004), (sg*0.048, EYE_Y - 0.012), (sg*0.018, EYE_Y - 0.012)]), 'SKIN_D') for sg in (1, -1)]
    my = 1.612
    F['moustache'] = [box([0, my, face_z(0, my) - 0.002], [0.05, 0.014, 0.02], 'HAIR_D')]
    F['scar'] = [flat(on_face([(0.026, 1.72), (0.032, 1.72), (0.048, 1.645), (0.042, 1.645)]), 'scar')]
    return F

# ================= hair: flat angular masses =================
def hairline(front, side, back):
    return [{30: side, 90: front, 150: side, 210: (side + back)/2, 270: back, 330: (side + back)/2}[t] for t in HEAD_ANG]
def cap(g_lo, g_hi, d, y_lo=1.7, y_mid=1.745, top=(1.79, 0.048, 0.062, 0.012), kf=1.0):
    lo = head_rings(g_lo, y_lo, y_lo)[0]; lo = lo[:6] + [d]
    mid = head_rings(g_hi, y_mid, y_mid)[0]; mid[5] = [1, kf, 1, 1, 1, 1]
    ty, ta, tb, tz = top
    return loft([lo, mid, [0, ty, tz, ta, tb, [1, kf, 1, 1, 1, 1]]], 'HAIR', ang=HEAD_ANG, caps=[False, True])
def back_rows(g, y0, y1): return [r[:5] + [[r[5][i] for i in (2, 3, 4, 5, 0)]] for r in head_rings(g, y0, y1)]
def nape(g): return loft(back_rows(g, 1.62, 1.7), 'HAIR', ang=[150, 210, 270, 330, 390], closed=False, both=True, cin='HAIR_D')
def under_hat(ps):
    for q in ps: q['hat'] = 'hide'
    return ps
def hair():
    H = {'none': []}
    H['buzzed'] = under_hat([cap(0.004, 0.006, hairline(-0.004, -0.04, -0.07), top=(1.775, 0.044, 0.056, 0.012))])
    # a pompadour: one swept wedge, high at the front (the first figure of the reference)
    H['short'] = under_hat([cap(0.012, 0.02, hairline(-0.004, -0.045, -0.08), top=(1.825, 0.05, 0.07, 0.03), kf=1.08)]) + [nape(0.012)]
    # a blunt bob: one big block around the head, open at the face, square fringe (the third figure)
    sides = loft(back_rows(0.03, 1.57, 1.72), 'HAIR', ang=[150, 210, 270, 330, 390], closed=False, both=True, cin='HAIR_D')
    fringe = box([0, 1.715, face_z(0, 1.715) + 0.01], [0.13, 0.04, 0.05], 'HAIR')
    H['bob'] = [sides] + under_hat([cap(0.03, 0.032, hairline(0.0, -0.01, -0.01), top=(1.8, 0.06, 0.075, 0.01)), fringe])
    H['buns'] = H['buzzed'] + under_hat([box([0, 1.8, -0.03], [0.07, 0.06, 0.07], 'HAIR')])
    beard = [r[:5] + [[r[5][i] for i in (0, 1, 2)]] for r in head_rings(0.008, 1.548, 1.6)]
    H['beard'] = H['short'] + [loft(beard, 'HAIR', ang=[30, 90, 150], closed=False, both=True, cin='HAIR_D'),
                               box([0, 1.55, face_z(0, 1.56) - 0.01], [0.06, 0.026, 0.04], 'HAIR')]
    return H

# ================= hats =================
def hats():
    H = {'none': []}
    H['beanie'] = [frustum([[0, 1.69, 0.016, 0.08, 0.09], [0, 1.77, 0.014, 0.076, 0.088], [0, 1.82, 0.01, 0.05, 0.06]], 'ACC', caps=[False, True]),
                   frustum([[0, 1.68, 0.016, 0.084, 0.094], [0, 1.71, 0.016, 0.084, 0.094]], 'ACC_D', caps=[False, False])]
    fzb = face_z(0, 1.72)
    H['cap'] = [frustum([[0, 1.7, 0.016, 0.076, 0.088], [0, 1.77, 0.014, 0.074, 0.086], [0, 1.8, 0.01, 0.05, 0.06]], 'ACC', caps=[False, True]),
                wedge([0, 1.705, fzb + 0.04], [0.15, 0.014, 0.1], 'ACC_D', fy=True)]
    H['helmet'] = [loft([[0, 1.69, 0.014, 0.1, 0.11], [0, 1.78, 0.012, 0.096, 0.106], [0, 1.83, 0.01, 0.05, 0.06]], 'helmet', n=6, caps=[False, True]),
                   loft([[0, 1.68, 0.014, 0.115, 0.125], [0, 1.695, 0.014, 0.115, 0.125]], 'helmetD', n=6)]
    return H

# ================= gear =================
def gear():
    back = bz(False, 1.3, 0.026, 0)
    body = frustum([[0, 1.0, back - 0.1, 0.15, 0.09], [0, 1.52, back - 0.1, 0.15, 0.09]], 'pack')
    flap = frustum([[0, 1.48, back - 0.1, 0.155, 0.095], [0, 1.55, back - 0.1, 0.155, 0.095]], 'packD', caps=[False, True])
    pocket = frustum([[0, 1.04, back - 0.2, 0.1, 0.022], [0, 1.22, back - 0.2, 0.1, 0.022]], 'packD')
    roll = loft([[0.18, 1.6, back - 0.1, 0.05, 0.05], [-0.18, 1.6, back - 0.1, 0.05, 0.05]], 'roll', ax='x', n=6)
    straps = [flat([(sg*0.06, 1.455, fz(False, 1.43, 0.026, 0.005)), (sg*0.09, 1.455, fz(False, 1.43, 0.026, 0.005)), (sg*0.085, 1.12, fz(False, 1.12, 0.026, 0.005)), (sg*0.055, 1.12, fz(False, 1.12, 0.026, 0.005))], 'strap') for sg in (1, -1)]
    pack = {'spine_03': [body, flap, pocket, roll] + straps}
    ty = TORSO[False][-1][0]
    scarf = {'neck_01': [frustum([[0, ty - 0.02, 0.006, 0.09, 0.08], [0, ty + 0.06, 0.016, 0.07, 0.064]], 'ACC'), frustum([[0, ty + 0.0, 0.006, 0.094, 0.084], [0, ty + 0.02, 0.008, 0.092, 0.082]], 'ACC_D', caps=[False, False])],
             'spine_03': [frustum([[0.05, ty, fz(False, ty, 0.03, 0.012), 0.032, 0.008], [0.056, 1.25, fz(False, 1.25, 0.03, 0.012), 0.034, 0.008]], 'ACC'),
                          *[flat([(0.05 + dx - 0.012, y - 0.012, fz(False, y, 0.03, 0.021)), (0.05 + dx + 0.012, y - 0.012, fz(False, y, 0.03, 0.021)), (0.05 + dx + 0.012, y + 0.012, fz(False, y, 0.03, 0.021)), (0.05 + dx - 0.012, y + 0.012, fz(False, y, 0.03, 0.021))], 'ACC_D')
                            for dx, y in ((-0.012, 1.38), (0.012, 1.34), (-0.012, 1.3))]]}
    gloves = both_sides(lambda sg, sd: {'hand_' + sd: hand(sd, 'glove', 0.006) + [frustum([[J['wr' + sd][0], J['wr' + sd][1] + 0.04, J['wr' + sd][2], 0.034, 0.036], [J['wr' + sd][0], J['wr' + sd][1] - 0.01, J['wr' + sd][2] + 0.003, 0.032, 0.034]], 'gloveD')]})
    return {'backpack': pack, 'scarf': scarf, 'gloves': gloves}

# ================= worn clothes (the game's 0.40 slots): layers over the creator's top, or new legs =================
def worn(fem):
    W = {}; ty = TORSO[fem][-1][0]
    # sweater (top slot): a chunky knit layer over any creator top, roll collar, ribbed hem and cuffs
    W['sweater'] = join(chest(fem, 'sweater', 0.03), sleeves('sweater', 'long', 0.03, cuff='sweater_D'), band(fem, HEM - 0.01, 0.05, 0.036, 'sweater_D'),
                        {'spine_03': [frustum([[0, ty - 0.03, 0.0, t_at(fem, ty)[0] - 0.08, t_at(fem, ty)[1] - 0.012], [0, ty + 0.05, 0.004, 0.072, 0.07]], 'sweater_D', caps=[False, False])]},
                        band(fem, 1.22, 0.05, 0.034, 'sweater_D'))
    # winter coat (outer): to the knee, open over the top, deep fur collar, toggles, big cuffs
    toggles = join(*[front(fem, 0.03, 0.06, y, y + 0.02, 0.046, 'toggle', 0.006) for y in (0.98, 1.1, 1.22)])
    W['coat'] = join(chest(fem, 'coat', 0.042, hem=0.6, flare=0.05), sleeves('coat', 'long', 0.04, cuff='coat_D'),
                     {'spine_03': [frustum([[0, ty - 0.04, 0.0, t_at(fem, ty)[0] + 0.05, t_at(fem, ty)[1] + 0.052], [0, ty + 0.07, -0.01, 0.13, 0.1]], 'fur', caps=[False, True])]},
                     front(fem, -0.008, 0.008, 0.6, SPLIT, 0.042, 'coat_D', 0.004), toggles)
    # rain jacket (outer): hip length, hood down on the back, a front zip and reflective band at the joints
    hood = {'spine_03': [frustum([[0, ty - 0.05, bz(fem, ty, 0.04, 0) - 0.03, 0.13, 0.055], [0, ty + 0.07, bz(fem, ty, 0.04, 0) - 0.01, 0.11, 0.05]], 'raincoat_D')]}
    W['raincoat'] = join(chest(fem, 'raincoat', 0.04, hem=0.82, flare=0.02), sleeves('raincoat', 'long', 0.038, cuff='raincoat_D'), hood,
                         front(fem, -0.006, 0.006, 0.82, SPLIT, 0.04, 'zip', 0.004), front(fem, -0.006, 0.006, SPLIT, ty, 0.04, 'zip', 0.004), band(fem, 0.84, 0.03, 0.046, 'stripe'))
    # leather jacket (outer): waist length, wide collar wedges, belt at the hem, zip off-centre
    lcol = {'spine_03': [wedge([sg*0.07, ty + 0.005, fz(fem, ty, 0.04) - 0.03], [0.1, 0.035, 0.07], 'leather_D') for sg in (1, -1)]}
    W['leather'] = join(chest(fem, 'leather', 0.038, hem=0.95), sleeves('leather', 'long', 0.036, cuff='leather_D'), lcol, band(fem, 0.95, 0.045, 0.044, 'leather_D'),
                        front(fem, 0.03, 0.04, 0.95, SPLIT, 0.038, 'zip', 0.004), front(fem, 0.03, 0.04, SPLIT, ty - 0.02, 0.038, 'zip', 0.004), vee(fem, 0.038, 'leather_D', 0.06, 1.3))
    # work trousers (legs): canvas, knee patches at the joint, a hammer loop
    trousers = {k: v for k, v in bottoms(fem)['jeans'].items()}
    W['trousers'] = recolour(join(bottoms(fem)['cargo_trousers']), {'PANTS': 'trousers', 'PANTS_D': 'trousers_D'})
    W['trousers'] = join(W['trousers'], both_sides(lambda sg, sd: {'calf_' + sd: [frustum(calf(sd, 0.024, 0.0, 0.16, straight=True), 'trousers_D')]}))
    # thermals (legs): close-fitting long johns with ribbed ankles
    W['thermals'] = recolour(join(bottoms(fem)['track_pants']), {'PANTS': 'thermals', 'PANTS_D': 'thermals_D', 'ACC': 'thermals'})
    return W
def recolour(d, m):
    return {b: [dict(q, c=m.get(q['c'], q['c'])) for q in ps] for b, ps in d.items()}

# ================= extra clips the game asked for (0.45.5): rotations about each bone's pivot, on top of the rest pose =================
def both(d, b, v, mirror_z=True):
    """the same rotation on both sides; sideways (z) turns mirror so both arms go out together"""
    d[b + '_l'] = v; d[b + '_r'] = [v[0], -v[1], -v[2]] if mirror_z else v
    return d
def F(**k):
    d = {}
    for b, v in k.items():
        if b.endswith('_2'): both(d, b[:-2], v)
        else: d[b] = v
    return d
CLIPS = {
  'jump': [F(root=[0, -0.12, 0], spine_01=[12, 0, 0], thigh_2=[-38, 0, 0], calf_2=[62, 0, 0], foot_2=[-24, 0, 0], upperarm_2=[28, 0, 6], lowerarm_2=[-24, 0, 0]),
           F(root=[0, 0.03, 0], spine_01=[4, 0, 0], thigh_2=[-6, 0, 0], calf_2=[6, 0, 0], foot_2=[22, 0, 0], upperarm_2=[-55, 0, 8], lowerarm_2=[-30, 0, 0]),
           F(root=[0, 0.0, 0], thigh_2=[-16, 0, 0], calf_2=[24, 0, 0], foot_2=[10, 0, 0], upperarm_2=[-70, 0, 14], lowerarm_2=[-20, 0, 0])],
  'airborne': [F(thigh_l=[-30, 0, 0], thigh_r=[-14, 0, 0], calf_l=[48, 0, 0], calf_r=[30, 0, 0], upperarm_2=[-38, 0, 22], lowerarm_2=[-22, 0, 0], spine_01=[4, 0, 0])],
  'land': [F(root=[0, -0.16, 0], spine_01=[16, 0, 0], spine_03=[6, 0, 0], thigh_2=[-48, 0, 0], calf_2=[78, 0, 0], foot_2=[-30, 0, 0], upperarm_2=[-30, 0, 26], lowerarm_2=[-26, 0, 0]),
           F(root=[0, -0.04, 0], spine_01=[5, 0, 0], thigh_2=[-12, 0, 0], calf_2=[20, 0, 0], foot_2=[-8, 0, 0], upperarm_2=[-8, 0, 8], lowerarm_2=[-10, 0, 0])],
  'hurt': [F(spine_01=[-8, 0, 0], spine_03=[-12, 6, 0], Head=[-16, 10, 0], upperarm_2=[-34, 0, -6], lowerarm_2=[-70, 0, 0], thigh_l=[-8, 0, 0], calf_l=[14, 0, 0]),
           F(spine_01=[-3, 0, 0], spine_03=[-4, 2, 0], Head=[-5, 4, 0], upperarm_2=[-10, 0, 0], lowerarm_2=[-25, 0, 0])],
  'drink': [F(upperarm_r=[-42, 0, 6], lowerarm_r=[-112, 12, 0], Head=[4, 0, 0]),
            F(upperarm_r=[-56, 0, 8], lowerarm_r=[-118, 12, 0], Head=[-26, 0, 0], spine_03=[-6, 0, 0]),
            F(upperarm_r=[-22, 0, 4], lowerarm_r=[-52, 0, 0])],
  'bandage': [F(upperarm_l=[-36, 0, -10], lowerarm_l=[-52, -20, 0], upperarm_r=[-40, 0, 14], lowerarm_r=[-84, 30, 0], Head=[22, 6, 0], spine_03=[8, 0, 0]),
              F(upperarm_l=[-36, 0, -10], lowerarm_l=[-52, -20, 0], upperarm_r=[-46, 0, 20], lowerarm_r=[-96, 50, 0], Head=[24, 4, 0], spine_03=[8, 0, 0]),
              F(upperarm_l=[-36, 0, -10], lowerarm_l=[-52, -20, 0], upperarm_r=[-34, 0, 8], lowerarm_r=[-78, 10, 0], Head=[22, 8, 0], spine_03=[8, 0, 0])],
  'pickup': [F(root=[0, -0.2, 0], spine_01=[22, 0, 0], spine_02=[14, 0, 0], spine_03=[8, 0, 0], Head=[10, 0, 0], thigh_2=[-46, 0, 0], calf_2=[66, 0, 0], foot_2=[-20, 0, 0], upperarm_r=[-34, 0, 0], lowerarm_r=[-12, 0, 0]),
             F(root=[0, -0.34, 0], spine_01=[30, 0, 0], spine_02=[18, 0, 0], spine_03=[12, 0, 0], Head=[14, 0, 0], thigh_2=[-70, 0, 0], calf_2=[100, 0, 0], foot_2=[-30, 0, 0], upperarm_r=[-44, 0, 0], lowerarm_r=[-6, 0, 0]),
             F(root=[0, -0.08, 0], spine_01=[8, 0, 0], thigh_2=[-16, 0, 0], calf_2=[24, 0, 0], foot_2=[-8, 0, 0], upperarm_r=[-40, 0, 0], lowerarm_r=[-80, 0, 0])],
  'attack_chop': [F(upperarm_r=[-165, 0, -10], lowerarm_r=[-46, 0, 0], upperarm_l=[-60, 0, 0], lowerarm_l=[-50, 0, 0], spine_03=[-12, 0, 0], spine_01=[-4, 0, 0]),
                  F(upperarm_r=[-48, 0, 0], lowerarm_r=[-12, 0, 0], upperarm_l=[-30, 0, 0], lowerarm_l=[-30, 0, 0], spine_01=[18, 0, 0], spine_03=[16, 0, 0], thigh_l=[-20, 0, 0], calf_l=[26, 0, 0]),
                  F(upperarm_r=[-6, 0, 0], lowerarm_r=[-24, 0, 0], spine_01=[10, 0, 0], spine_03=[6, 0, 0])],
  'attack_thrust': [F(upperarm_r=[18, 0, -6], lowerarm_r=[-108, 0, 0], upperarm_l=[-34, 0, 0], lowerarm_l=[-64, 0, 0], spine_03=[-6, 22, 0], thigh_r=[8, 0, 0]),
                    F(upperarm_r=[-80, 0, 0], lowerarm_r=[-6, 0, 0], upperarm_l=[-72, 0, 0], lowerarm_l=[-22, 0, 0], spine_01=[14, 0, 0], spine_03=[6, -14, 0], thigh_l=[-26, 0, 0], calf_l=[32, 0, 0]),
                    F(upperarm_r=[-30, 0, 0], lowerarm_r=[-60, 0, 0], upperarm_l=[-30, 0, 0], lowerarm_l=[-50, 0, 0], spine_01=[5, 0, 0])],
  'attack_swing': [F(spine_03=[0, 58, 0], spine_01=[0, 12, 0], upperarm_r=[-70, 0, -48], lowerarm_r=[-46, 0, 0], upperarm_l=[-50, 0, 0], lowerarm_l=[-70, 0, 0], Head=[0, -40, 0]),
                   F(spine_03=[0, -30, 0], spine_01=[4, -8, 0], upperarm_r=[-84, 0, 6], lowerarm_r=[-10, 0, 0], upperarm_l=[-30, 0, 0], lowerarm_l=[-40, 0, 0], Head=[0, 18, 0], thigh_l=[-14, 0, 0], calf_l=[18, 0, 0]),
                   F(spine_03=[0, -62, 0], spine_01=[2, -14, 0], upperarm_r=[-60, 0, 40], lowerarm_r=[-30, 0, 0], Head=[0, 34, 0])],
}
CLIP_RULE = ('Each clip is a list of frames; a frame maps bone to [x, y, z] degrees, turned about that bone\'s pivot on top of the rest pose, in the '
             'order X, then Y, then Z, with children carried along (forward kinematics). Axes are the pack\'s at rest: for a limb hanging down, '
             'negative X swings it forward and positive X back; for the spine, positive X bends forward; positive Z swings the left arm out, '
             'negative Z the right arm out (both are mirrored already). "root" is not a bone: it moves the pelvis by [x, y, z] metres. '
             'Bones not listed stay at rest. Suggested speed: jump 0.25 s for all three frames, land 0.3 s, hurt 0.25 s, drink 1.4 s, '
             'bandage 2 s looping the middle frames, pickup 0.7 s, attacks 0.45 s (wind-up, strike, follow-through).')

def body(fem): return join(head(fem), hands())
pack = {
  'name': 'survivor', 'version': 7, 'style': 'silhouette first: square-shouldered wedge torsos, arms tapering to points, straight column legs, small featureless heads (18 October 2026)',
  'about': 'Every character creator choice as faceted pieces, grouped by skeleton bone. See docs/SHAPED.md.',
  'units': 'metres', 'facing': '+Z', 'left': '+X', 'height': 1.80,
  'bones': BONES, 'palette': PALETTE, 'slots': SLOTS,
  'darker': 0.78, 'mix': 0.55, 'tone': TONE,
  'colourRule': 'A slot ending in _D is that colour times darker. HAIR_MIX is SKIN blended towards HAIR by mix (stubble).',
  'toneRule': 'Build with SHAPED.buildIndexed(pieces, colourOf, out, {tone: pack.tone, oy: bone pivot height}). jitter is 0 so SHAPED.weld can share corners.',
  'smear': {'bones': ['upperarm', 'lowerarm', 'thigh', 'calf'], 'max': 0.14},
  'smearRule': 'Smear frames (Jumpship): while a limb swings fast, stretch that bone up to max (14%) along its length, scaled by its swing speed.',
  'clips': CLIPS, 'clipRule': CLIP_RULE,
  'hatRule': 'When a hat is worn, leave out pieces marked hat:"hide" (the hat covers them).',
  'builds': {'slim': [0.9, 0.93], 'average': [1, 1], 'broad': [1.14, 1.08]},
  'buildRule': 'For every bone except Head and neck_01, stretch each piece with SHAPED.scaleXZ(piece, first, second).',
  'choices': {
    'build': ['slim', 'average', 'broad'], 'skin': [1, 2, 3, 4, 5], 'body': ['masculine', 'feminine'],
    'hair': ['none', 'buzzed', 'short', 'bob', 'buns', 'beard'], 'hairColour': ['black', 'brown', 'auburn', 'blond', 'grey'],
    'hat': ['none', 'cap', 'beanie', 'helmet'],
    'face': ['calm', 'glasses', 'stubble', 'freckles', 'tired', 'moustache', 'dark_glasses', 'scar'],
    'top': ['tshirt', 'striped_tee', 'flannel_shirt', 'spotted_top', 'hoodie', 'open_jacket', 'jumper', 'dungarees'],
    'bottoms': ['jeans', 'shorts', 'cargo_trousers', 'capri_trousers', 'track_pants', 'rolled_jeans'],
    'shoes': ['trainers', 'boots', 'rain_boots'],
    'gear': ['backpack', 'scarf', 'gloves'],
    'worn': ['sweater', 'coat', 'raincoat', 'leather', 'trousers', 'thermals']},
  'wornRule': 'Clothes the survivor wears in the game (0.40 keys). sweater (top slot) is a layer drawn over the creator top; coat, raincoat and leather '
              '(outer slot) are layers drawn over the top and the sweater; trousers and thermals (legs slot) replace the creator bottoms. Their colours are fixed '
              '(palette entries with the same names, _D darker).',
  'parts': {
    'body': {'masculine': body(False), 'feminine': body(True)},
    'top': {'masculine': tops(False), 'feminine': tops(True)},
    'bottoms': {'masculine': bottoms(False), 'feminine': bottoms(True)},
    'shoes': shoes(),
    'face': {k: {'Head': v} for k, v in faces().items()},
    'hair': {k: {'Head': v} for k, v in hair().items()},
    'hat': {k: {'Head': v} for k, v in hats().items()},
    'gear': gear(),
    'worn': {'masculine': worn(False), 'feminine': worn(True)}}
}
out, st = write_pack('survivor', pack, __file__)
mx = lambda pre, i: max(v[i] for k, v in st.items() if k.startswith(pre))
for i, nm in ((0, 'triangles'), (1, 'vertices'), (2, 'welded vertices')):
    tot = st['body.masculine'][i] + mx('top.masculine', i) + mx('bottoms.masculine', i) + mx('shoes', i) + mx('face', i) + mx('hair', i) + mx('hat', i) + sum(st['gear.' + g][i] for g in ('backpack', 'scarf', 'gloves'))
    print('heaviest mix', nm, tot)
