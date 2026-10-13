#!/usr/bin/env python3
"""Afterstreet survivor pack, version 5 (13 October 2026). Rebuilt on the low-poly character craft rules in the art guide
(silhouette and gesture first; big, medium, small; planes not tubes; carved faces; costume at the joints; soft tone).
Every character creator choice as faceted pieces, grouped by skeleton bone. Writes assets/shaped/survivor.js.
Run: python3 assets/shaped/src/survivor.py

Shape language: tall, lean adults (1.80 m) standing in a relaxed S-curve (head forward, soft knees, bent elbows, arms
away from the body); a small carved head (brow shelf, eyes set back, nose grown from the brow, angled jaw); chunky hair
clumps with ragged edges; tops as big shaped volumes that flare at the hem and dip at the back; tapered limbs with
cuffs, rolled sleeves and trouser hems stacked over chunky boots. Muted colours, flat-shaded planes, soft tone.
Coordinates: metres, reference pose as described, facing +Z, the survivor's left is +X.
Each bone lists its pivot (joint) and tip (next joint) so the game can fit the pieces to its own skeleton."""
import json, os, math

R4 = lambda v: round(v, 4)
def centre(pts): return [sum(p[i] for p in pts)/len(pts) for i in range(3)]
def ring_out(r, p):
    o = [R4(r[0]-p[0]), R4(r[1]-p[1]), R4(r[2]-p[2]), R4(r[3]), R4(r[4])]
    k = r[5] if len(r) > 5 else None; d = r[6] if len(r) > 6 else None
    if k is not None and any(abs(v - 1) > 1e-4 for v in k): o.append([R4(v) for v in k])
    elif d is not None: o.append(None)
    if d is not None and any(abs(v) > 1e-5 for v in d):
        if len(o) == 5: o.append(None)
        o.append([R4(v) for v in d])
    return o
def loft(rings, c, n=None, ang=None, ax='y', **k):
    """rings: absolute [x, y, z, a, b, (k per corner), (d per corner)]"""
    p = centre([r[:3] for r in rings])
    o = {'s': 'loft', 'p': [R4(v) for v in p], 'r': [ring_out(r, p) for r in rings], 'c': c}
    if ang: o['ang'] = list(ang)
    elif n and n != 8: o['n'] = n
    if ax != 'y': o['ax'] = ax
    o.update(k); return o
def flat(pts, c, n=(0, 0, 1)):
    p = centre(pts); return {'s': 'decal', 'p': [R4(v) for v in p], 'v': [[R4(q[i]-p[i]) for i in range(3)] for q in pts], 'n': list(n), 'c': c}
def solid(pts, faces, c):
    p = centre(pts); return {'s': 'poly', 'p': [R4(v) for v in p], 'v': [[R4(q[i]-p[i]) for i in range(3)] for q in pts], 'f': faces, 'c': c}
def block(p, d, c): return {'s': 'box', 'p': [R4(v) for v in p], 'd': [R4(v) for v in d], 'c': c}
HEX = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
def join(*parts):
    out = {}
    for d in parts:
        for b, ps in d.items(): out.setdefault(b, []).extend(ps)
    return out
def both_sides(fn):
    out = {}
    for sg, sd in ((1, 'l'), (-1, 'r')):
        for b, ps in fn(sg, sd).items(): out.setdefault(b, []).extend(ps)
    return out
def under_hat(pieces):
    for q in pieces: q['hat'] = 'hide'
    return pieces
def lerp(a, b, f): return a + (b - a)*f
def mixr(r0, r1, f):
    o = [lerp(r0[j], r1[j], f) for j in range(5)]
    if len(r0) > 5 and len(r1) > 5: o.append([lerp(x, y, f) for x, y in zip(r0[5], r1[5])])
    return o
FRONT = (0, 0, 1); BACKN = (0, 0, -1)

# ================= shaped cross-sections =================
def sym(kd):
    """corner values given for one side, mirrored about the front-back line (90 <-> 90, 30 <-> 150, 225 <-> 315)"""
    out = dict(kd)
    for t, v in kd.items(): out[(180 - t) % 360] = v
    return out
class Table:
    """rows of (y, a, b, z, {corner angle: k}) for a shaped tube; at(y) and span(y0, y1, g) interpolate it"""
    def __init__(self, ang, rows):
        self.ang = ang; self.rows = [(y, a, b, z, [kd.get(t % 360, 1.0) for t in ang]) for y, a, b, z, kd in rows]
    def at(self, y):
        R = self.rows
        if y <= R[0][0]: r = R[0]; return [0, y, r[3], r[1], r[2], list(r[4])]
        for r0, r1 in zip(R, R[1:]):
            if r0[0] <= y <= r1[0]:
                f = (y - r0[0])/(r1[0] - r0[0])
                return [0, y, lerp(r0[3], r1[3], f), lerp(r0[1], r1[1], f), lerp(r0[2], r1[2], f), [lerp(p, q, f) for p, q in zip(r0[4], r1[4])]]
        r = R[-1]; return [0, y, r[3], r[1], r[2], list(r[4])]
    def span(self, y0, y1, g=0.0):
        ys = [y0] + [r[0] for r in self.rows if y0 < r[0] < y1] + [y1]
        out = []
        for y in ys:
            r = self.at(y); r[3] += g; r[4] += g; out.append(r)
        return out
def corners(r, ang):
    k = r[5] if len(r) > 5 and r[5] is not None else [1.0]*len(ang)
    d = r[6] if len(r) > 6 else [0.0]*len(ang)
    return [(r[0] + math.cos(math.radians(t))*r[3]*k[i], r[1] + d[i], r[2] + math.sin(math.radians(t))*r[4]*k[i]) for i, t in enumerate(ang)]
def edge_z(pts, x, front):
    best = None
    for i in range(len(pts)):
        p, q = pts[i], pts[(i + 1) % len(pts)]
        if (p[0] - x)*(q[0] - x) <= 0 and abs(q[0] - p[0]) > 1e-9:
            f = (x - p[0])/(q[0] - p[0]); z = p[2] + (q[2] - p[2])*f
            if best is None or (z > best if front else z < best): best = z
    return best
def surface(rings, ang, x, y, front=True):
    """z of a shaped tube's front (or back) at (x, y)"""
    for r0, r1 in zip(rings, rings[1:]):
        if r0[1] <= y <= r1[1]:
            f = (y - r0[1])/(r1[1] - r0[1])
            z0 = edge_z(corners(r0, ang), x, front); z1 = edge_z(corners(r1, ang), x, front)
            if z0 is None: z0 = z1
            if z1 is None: z1 = z0
            return lerp(z0, z1, f)
    r = rings[0] if y < rings[0][1] else rings[-1]
    return edge_z(corners(r, ang), x, front)
def wrap(rings, ang, x0, x1, y0, y1, col, lift=0.003, front=True, bone=None):
    """a flat patch that follows a shaped tube's planes: split into columns at the tube's corners"""
    xs = {x0, x1}
    for r in rings:
        if y0 - 0.02 <= r[1] <= y1 + 0.02:
            for c in corners(r, ang):
                if x0 < c[0] < x1 and ((c[2] > r[2]) == front): xs.add(round(c[0], 4))
    xs = sorted(xs); out = []
    s = 1 if front else -1
    for a, b in zip(xs, xs[1:]):
        if b - a < 0.004: continue
        pts = [(a, y0), (b, y0), (b, y1), (a, y1)]
        out.append(flat([(x, y, surface(rings, ang, x, y, front) + s*lift) for x, y in pts], col, FRONT if front else BACKN))
    return out
def sub(rings, ang, idx):
    """an open arc over some corners of a shaped tube: returns (rings, angles) for loft(..., closed=False)"""
    A = []; prev = None
    for i in idx:
        t = ang[i]
        while prev is not None and t <= prev: t += 360
        A.append(t); prev = t
    out = []
    for r in rings:
        q = r[:5] + [[r[5][i] for i in idx]]
        if len(r) > 6: q.append([r[6][i] for i in idx])
        out.append(q)
    return out, A

# ================= skeleton (1.80 m, relaxed stance) =================
BONES = {
  'pelvis':   {'pivot': [0, 0.97, 0], 'tip': [0, 1.06, 0]},
  'spine_01': {'pivot': [0, 1.06, 0], 'tip': [0, 1.18, 0.006], 'parent': 'pelvis'},
  'spine_02': {'pivot': [0, 1.18, 0.006], 'tip': [0, 1.32, 0.014], 'parent': 'spine_01'},
  'spine_03': {'pivot': [0, 1.32, 0.014], 'tip': [0, 1.47, 0.004], 'parent': 'spine_02'},
  'neck_01':  {'pivot': [0, 1.47, 0.004], 'tip': [0, 1.555, 0.042], 'parent': 'spine_03'},
  'Head':     {'pivot': [0, 1.555, 0.042], 'tip': [0, 1.79, 0.032], 'parent': 'neck_01'},
}
J = {}
for sg, sd in ((1, 'l'), (-1, 'r')):
    J['sh' + sd] = [sg*0.172, 1.44, -0.004]; J['el' + sd] = [sg*0.246, 1.175, -0.064]; J['wr' + sd] = [sg*0.28, 0.94, 0.05]; J['ft' + sd] = [sg*0.266, 0.815, 0.09]
    J['hp' + sd] = [sg*0.09, 0.95, -0.01]; J['kn' + sd] = [sg*0.106, 0.52, 0.036]; J['an' + sd] = [sg*0.116, 0.095, -0.02]
    BONES['upperarm_' + sd] = {'pivot': J['sh' + sd], 'tip': J['el' + sd], 'parent': 'spine_03'}
    BONES['lowerarm_' + sd] = {'pivot': J['el' + sd], 'tip': J['wr' + sd], 'parent': 'upperarm_' + sd}
    BONES['hand_' + sd]     = {'pivot': J['wr' + sd], 'tip': J['ft' + sd], 'parent': 'lowerarm_' + sd}
    BONES['thigh_' + sd]    = {'pivot': J['hp' + sd], 'tip': J['kn' + sd], 'parent': 'pelvis'}
    BONES['calf_' + sd]     = {'pivot': J['kn' + sd], 'tip': J['an' + sd], 'parent': 'thigh_' + sd}
    BONES['foot_' + sd]     = {'pivot': J['an' + sd], 'tip': [sg*0.116, 0.04, 0.07], 'parent': 'calf_' + sd}
    BONES['ball_' + sd]     = {'pivot': [sg*0.116, 0.04, 0.07], 'tip': [sg*0.116, 0.035, 0.16], 'parent': 'foot_' + sd}

PALETTE = {
  'eye': '#1a1716', 'lip': '#7e4840', 'frame': '#a84a36', 'shades': '#1c1d20', 'freckle': '#a8694e', 'scar': '#c48a7a',
  'helmet': '#55603e', 'helmetD': '#3f4830', 'belt': '#2a221d', 'buckle': '#a39a86',
  'trainer': '#5b5f66', 'trainerSole': '#e2ddd2', 'boot': '#4a3226', 'bootD': '#2f2019', 'rainboot': '#c99a3a', 'rainbootD': '#9c7429',
  'sole': '#1f1c1a', 'lace': '#d8d3c9', 'pack': '#6e5a3c', 'packD': '#4f412b', 'strap': '#2b2d33', 'roll': '#8c6a3a', 'rollD': '#6b4f2a',
  'bottle': '#5b7f86', 'glove': '#4a3328', 'gloveD': '#33231b', 'denimRoll': '#6b84a6'
}
SLOTS = {
  'SKIN':  ['#f0d2bd', '#dcae8c', '#bd8860', '#8c5b3c', '#583926'],
  'HAIR':  ['#1d1a19', '#4a3426', '#86412a', '#c4a066', '#b4b1ab'],
  'SHIRT': 'player colour', 'PANTS': 'player colour', 'ACC': 'player second colour'
}
TONE = {'y0': 0.0, 'y1': 1.8, 'lo': 0.74, 'hi': 1.05, 'jitter': 0.035}

# ================= head: carved planes =================
HEAD_ANG = [0, 30, 58, 76, 90, 104, 122, 150, 180, 225, 270, 315]
HZ = 0.042
HEADT = Table(HEAD_ANG, [
    (1.552, 0.026, 0.022, HZ + 0.05, {}),                                   # under the chin
    (1.58, 0.058, 0.06, HZ + 0.024, sym({58: 0.9, 76: 0.88, 90: 0.92})),   # jaw angles in to the chin
    (1.615, 0.071, 0.074, HZ + 0.012, sym({58: 0.95, 76: 0.95})),          # mouth and cheeks
    (1.643, 0.078, 0.08, HZ + 0.006, sym({90: 1.24, 76: 0.99})),           # nose tip grows from the face
    (1.672, 0.081, 0.084, HZ + 0.002, sym({90: 1.1, 76: 0.89, 58: 0.95})),  # eyes set back, nose bridge
    (1.7, 0.083, 0.087, HZ - 0.002, sym({90: 1.05, 76: 1.06, 58: 1.03})),  # the brow shelf juts out
    (1.75, 0.078, 0.086, HZ - 0.01, {}),
    (1.79, 0.042, 0.052, HZ - 0.018, {})])
EYE_Y, BROW_Y, MOUTH_Y = 1.673, 1.698, 1.614
def face_z(x, y): return surface(HEADT.span(1.552, 1.79), HEAD_ANG, x, y)
def on_face(pts, lift=0.0015): return [(x, y, face_z(x, y) + lift) for x, y in pts]
def head(fem):
    rows = HEADT.span(1.552, 1.79)
    if fem:   # softer jaw, smaller nose
        for r in rows:
            if r[1] < 1.6: r[3] *= 0.94
            if abs(r[1] - 1.643) < 1e-6: r[5][4] = 1.17
    skull = loft(rows, 'SKIN', ang=HEAD_ANG)
    ears = [loft([[sg*0.078, 1.668, HZ - 0.01, 0.012, 0.02], [sg*0.093, 1.664, HZ - 0.014, 0.008, 0.016]], 'SKIN', n=4, ax='x') for sg in (1, -1)]
    nw = 0.04 if fem else 0.046
    neck = loft([[0, 1.46, 0.0, nw, nw - 0.002], [0, 1.53, 0.024, nw - 0.004, nw - 0.006], [0, 1.58, HZ, nw - 0.006, nw - 0.01]], 'SKIN', n=6, caps=[True, False])
    return {'Head': [skull] + ears, 'neck_01': [neck]}
def eyes(h=0.0085, y=EYE_Y, w=0.0105, x=0.03):
    return [flat(on_face([(sg*(x - w), y - h*0.4), (sg*(x + w*0.9), y - h*0.55), (sg*(x + w), y + h*0.35), (sg*(x - w*1.05), y + h*0.5)], 0.0045), 'eye') for sg in (1, -1)]
def brows(y=BROW_Y, tilt=0.0, col='HAIR_D'):
    return [flat(on_face([(sg*0.013, y - 0.004), (sg*0.05, y - 0.002 - tilt), (sg*0.048, y + 0.004 - tilt), (sg*0.014, y + 0.004)], 0.0025), col) for sg in (1, -1)]
def mouth(w=0.011, y=MOUTH_Y):
    return [flat(on_face([(-w, y - 0.0015), (w, y - 0.0015), (w*0.8, y + 0.0018), (-w*0.8, y + 0.0018)], 0.002), 'lip')]

# ================= torso: shaped, with a chest plane and shoulder blades =================
TORSO_ANG = [0, 35, 65, 90, 115, 145, 180, 215, 270, 325]
CHEST = sym({90: 0.97, 65: 1.05, 215: 1.05, 270: 0.96})
TORSO = {
  False: Table(TORSO_ANG, [(0.9, 0.15, 0.1, 0.004, {}), (1.04, 0.138, 0.094, 0.006, {}), (1.18, 0.15, 0.1, 0.014, {}),
                           (1.3, 0.17, 0.11, 0.022, CHEST), (1.38, 0.176, 0.104, 0.018, CHEST), (1.435, 0.148, 0.086, 0.006, sym({90: 0.96})),
                           (1.5, 0.064, 0.058, 0.004, {})]),
  True:  Table(TORSO_ANG, [(0.9, 0.152, 0.102, 0.004, {}), (1.04, 0.124, 0.088, 0.006, {}), (1.18, 0.13, 0.094, 0.014, {}),
                           (1.29, 0.15, 0.11, 0.022, sym({65: 1.1, 90: 1.03, 215: 1.03})), (1.37, 0.158, 0.098, 0.016, sym({65: 1.03})),
                           (1.425, 0.136, 0.084, 0.006, sym({90: 0.96})), (1.495, 0.058, 0.054, 0.004, {})])}
HEM, SPLIT = 0.9, 1.18
def top_y(fem): return TORSO[fem].rows[-1][0]
def trings(fem, g=0.0, bulge=0.0):
    rows = TORSO[fem].span(HEM, top_y(fem), g)
    if bulge:
        for r in rows[1:-1]:
            w = math.sin(math.pi*min(1, max(0, (r[1] - HEM)/(top_y(fem) - 0.04 - HEM))))**0.6
            r[3] += bulge*w; r[4] += bulge*0.75*w
    return rows
def dip_d(dip): return [{0: -0.5, 180: -0.5, 215: -0.85, 270: -1.0, 325: -0.85}.get(t, 0.0)*dip for t in TORSO_ANG]
def chest(fem, col, g=0.0, bulge=0.0, hem=HEM, flare=0.0, dip=0.0, belly=None):
    rows = trings(fem, g, bulge)
    lo = [r for r in rows if r[1] <= SPLIT]; hi = [r for r in rows if r[1] >= SPLIT]
    lo[0] = list(lo[0]); lo[0][1] = hem; lo[0][3] += flare; lo[0][4] += flare*0.7
    if dip: lo[0] = lo[0][:6] + [dip_d(dip)]
    return {'spine_01': [loft(lo, belly or col, ang=TORSO_ANG, caps=[True, False])],
            'spine_03': [loft(hi, col, ang=TORSO_ANG, caps=[False, True])]}
def band(fem, y, h, g, col, bulge=0.0, d=None):
    rows = [TORSO[fem].at(y), TORSO[fem].at(y + h)]
    for r in rows: r[3] += g; r[4] += g
    if d: rows[0] = rows[0][:6] + [d]
    return {('spine_01' if y < SPLIT else 'spine_03'): [loft(rows, col, ang=TORSO_ANG, caps=[False, False])]}
def patch(fem, g, x0, x1, y0, y1, col, front=True, lift=0.004, bulge=0.0):
    bone = 'spine_01' if (y0 + y1)/2 < SPLIT else 'spine_03'
    return {bone: wrap(trings(fem, g, bulge), TORSO_ANG, x0, x1, y0, y1, col, lift, front)}
def on_chest(fem, pts, col, g, front=True, lift=0.004, bone=None, bulge=0.0):
    rows = trings(fem, g, bulge); s = 1 if front else -1
    ys = [y for _, y in pts]; bone = bone or ('spine_01' if sum(ys)/len(ys) < SPLIT else 'spine_03')
    return {bone: [flat([(x, y, surface(rows, TORSO_ANG, x, y, front) + s*lift) for x, y in pts], col, FRONT if front else BACKN)]}

# ================= limbs: tapered, with flatter planes =================
LIMB_ANG = [0, 60, 120, 180, 240, 300]   # flat front and back planes, corners at the sides
def along(p0, p1, prof, g=0.0, extra=None):
    out = []
    for t, a, b in prof:
        r = [lerp(p0[i], p1[i], t) for i in range(3)] + [a + g, b + g]
        out.append(r)
    return out
UPPER = [(-0.06, 0.05, 0.052), (0.25, 0.044, 0.047), (0.7, 0.038, 0.041), (1.0, 0.035, 0.037)]
LOWER = [(0.0, 0.034, 0.036), (0.3, 0.036, 0.034), (1.0, 0.025, 0.021)]
THIGH = [(-0.04, 0.08, 0.086), (0.35, 0.07, 0.077), (1.0, 0.051, 0.056)]
CALF = [(0.0, 0.051, 0.056), (0.3, 0.052, 0.06), (0.85, 0.036, 0.038), (1.0, 0.032, 0.034)]
def limb(bone_a, bone_b, prof, g=0.0, t0=None, t1=None):
    rings = along(bone_a, bone_b, prof, g)
    if t0 is not None or t1 is not None:
        lo = t0 if t0 is not None else prof[0][0]; hi = t1 if t1 is not None else prof[-1][0]
        def at(t):
            for (ta, *_), (tb, *_), ra, rb in zip(prof, prof[1:], rings, rings[1:]):
                if ta <= t <= tb: return mixr(ra, rb, (t - ta)/(tb - ta))
            return list(rings[0] if t < prof[0][0] else rings[-1])
        rings = [at(lo)] + [r for (t, *_), r in zip(prof, rings) if lo < t < hi] + [at(hi)]
    return rings
def tube(rings, col, **k): return loft(rings, col, ang=LIMB_ANG, **k)
def sleeves(col, style='long', g=0.018, cuff=None):
    """style: 'long' (flared cuff over the wrist), 'short' (to above the elbow) or 'rolled' (rolled to mid-forearm)"""
    def f(sg, sd):
        S, E, W = J['sh' + sd], J['el' + sd], J['wr' + sd]
        up = limb(S, E, UPPER, g)
        if style == 'short':
            s = limb(S, E, UPPER, g, t1=0.5); s[-1][3] += 0.012; s[-1][4] += 0.012
            return {'upperarm_' + sd: [tube(limb(S, E, UPPER), 'SKIN'), tube(s, col, caps=[True, False])],
                    'lowerarm_' + sd: [tube(limb(E, W, LOWER), 'SKIN')]}
        o = {'upperarm_' + sd: [tube(up, col)]}
        if style == 'rolled':
            cutr = limb(E, W, LOWER, g, t1=0.42)
            roll = limb(E, W, LOWER, g + 0.016, t0=0.3, t1=0.46)
            o['lowerarm_' + sd] = [tube(cutr, col, caps=[False, False]), tube(roll, cuff or col + '_D'), tube(limb(E, W, LOWER), 'SKIN')]
        else:
            lo = limb(E, W, LOWER, g, t1=0.9)
            end = limb(E, W, LOWER, g + 0.012, t0=0.82, t1=1.0)
            o['lowerarm_' + sd] = [tube(lo, col, caps=[False, False]), tube(end, cuff or col)]
        return o
    return both_sides(f)
def hand_rings(sg, sd, g=0.0):
    W, F = J['wr' + sd], J['ft' + sd]
    m = [lerp(W[i], F[i], 0.45) for i in range(3)]
    return [[W[0], W[1] + 0.012, W[2], 0.021 + g, 0.027 + g], [m[0] + sg*0.002, m[1], m[2] + 0.004, 0.019 + g, 0.042 + g], [F[0] - sg*0.004, F[1], F[2], 0.013 + g, 0.028 + g]]
def thumb(sg, sd, col):
    W = J['wr' + sd]
    return solid([(W[0] - sg*0.008, W[1] - 0.03, W[2] + 0.028), (W[0] - sg*0.016, W[1] - 0.034, W[2] + 0.03),
                  (W[0] - sg*0.02, W[1] - 0.072, W[2] + 0.042), (W[0] - sg*0.011, W[1] - 0.07, W[2] + 0.044),
                  (W[0] - sg*0.004, W[1] - 0.034, W[2] + 0.012), (W[0] - sg*0.012, W[1] - 0.038, W[2] + 0.014),
                  (W[0] - sg*0.016, W[1] - 0.07, W[2] + 0.03), (W[0] - sg*0.008, W[1] - 0.068, W[2] + 0.032)], HEX, col)
def hands():
    return both_sides(lambda sg, sd: {'hand_' + sd: [loft(hand_rings(sg, sd), 'SKIN', n=4, rot=45), thumb(sg, sd, 'SKIN')]})

# ================= tops =================
def tops(fem):
    T = {}
    ty = top_y(fem)
    def neckline(g):
        z0 = surface(trings(fem, g), TORSO_ANG, 0, 1.44) + 0.004
        return {'spine_03': [flat([(-0.042, 1.482, z0 - 0.03), (0.042, 1.482, z0 - 0.03), (0.0, 1.44, z0)], 'SKIN', (0, 0.45, 1))]}
    collar_band = band(fem, ty - 0.03, 0.022, 0.008, 'SHIRT_D')
    tee = join(chest(fem, 'SHIRT', 0.008, flare=0.008), sleeves('SHIRT', 'short', 0.008), neckline(0.008), collar_band)
    T['tshirt'] = tee
    T['striped_tee'] = join(tee, *[band(fem, y, 0.028, 0.012, 'ACC') for y in (0.98, 1.1, 1.22, 1.34)])
    # flannel: untucked, rolled sleeves, open collar, a placket and two check bands
    collar = {'spine_03': [flat([(sg*0.012, 1.488, surface(trings(fem, 0.016), TORSO_ANG, 0, 1.47) - 0.01), (sg*0.08, 1.47, surface(trings(fem, 0.016), TORSO_ANG, sg*0.08, 1.43) - 0.006),
                                 (sg*0.045, 1.41, surface(trings(fem, 0.016), TORSO_ANG, sg*0.045, 1.41) + 0.01)], 'SHIRT_D', (0, 0.4, 1)) for sg in (1, -1)]}
    T['flannel_shirt'] = join(chest(fem, 'SHIRT', 0.016, flare=0.014, dip=0.02), sleeves('SHIRT', 'rolled', 0.018),
                              *[band(fem, y, 0.03, 0.019, 'ACC') for y in (1.02, 1.26)], patch(fem, 0.016, -0.012, 0.012, 0.92, SPLIT, 'SHIRT_D'),
                              patch(fem, 0.016, -0.012, 0.012, SPLIT, 1.41, 'SHIRT_D'), patch(fem, 0.016, 0.04, 0.1, 1.3, 1.36, 'SHIRT_D', lift=0.006), collar)
    dots = [(-0.06, 1.38), (0.05, 1.4), (0.02, 1.3), (-0.04, 1.22), (0.065, 1.15), (-0.055, 1.05), (0.035, 0.98)]
    T['spotted_top'] = join(tee, *[on_chest(fem, [(x - 0.01, y - 0.01), (x + 0.01, y - 0.01), (x + 0.01, y + 0.01), (x - 0.01, y + 0.01)], 'ACC', 0.008) for x, y in dots],
                            *[on_chest(fem, [(x - 0.01, y - 0.01), (x + 0.01, y - 0.01), (x + 0.01, y + 0.01), (x - 0.01, y + 0.01)], 'ACC', 0.008, front=False) for x, y in ((0.05, 1.35), (-0.06, 1.2), (0.02, 1.02))])
    # hoodie: chunky, hood bunched behind the neck, ribbed hem and cuffs, kangaroo pocket
    hood = {'spine_03': [loft([[0, 1.4, -0.03, 0.15, 0.12, None, [0, 0, 0.0, 0.02, 0.03, 0.02, 0, -0.01, -0.03, -0.01]],
                               [0, 1.49, -0.055, 0.135, 0.12], [0, 1.56, -0.095, 0.085, 0.075]], 'SHIRT_D',
                              ang=[150, 180, 215, 270, 325, 360, 390], closed=False, both=True, cin='SHIRT')]}
    pocket = patch(fem, 0.03, -0.085, 0.085, 0.96, 1.08, 'SHIRT_D', lift=0.006, bulge=0.012)
    strings = join(*[on_chest(fem, [(x - 0.004, 1.45), (x + 0.004, 1.45), (x + 0.004, 1.35), (x - 0.004, 1.35)], 'ACC', 0.03, lift=0.008, bulge=0.012) for x in (-0.03, 0.03)])
    T['hoodie'] = join(chest(fem, 'SHIRT', 0.03, bulge=0.012), sleeves('SHIRT', 'long', 0.028, cuff='SHIRT_D'), band(fem, HEM - 0.005, 0.045, 0.03, 'SHIRT_D'), hood, pocket, strings)
    # open jacket over a sweater in the second colour: flared hem dipping at the back, collar up, lapels
    inner = join(patch(fem, 0.022, -0.05, 0.05, HEM - 0.03, SPLIT, 'ACC', lift=0.002), patch(fem, 0.022, -0.05, 0.05, SPLIT, 1.45, 'ACC', lift=0.002))
    up_collar = {'spine_03': [loft([[0, 1.43, -0.006, 0.105, 0.09], [0, 1.53, -0.018, 0.088, 0.078]], 'SHIRT_D', ang=[110, 150, 190, 230, 270, 310, 350, 390, 430],
                                   closed=False, both=True, cin='SHIRT')]}
    lapels = join(*[on_chest(fem, [(sg*0.048, 1.44), (sg*0.105, 1.41), (sg*0.06, 1.2), (sg*0.05, 1.24)], 'SHIRT_D', 0.024, lift=0.008) for sg in (1, -1)])
    pockets = join(*[patch(fem, 0.026, sg*0.06 if sg > 0 else -0.13, 0.13 if sg > 0 else -0.06, 0.95, 1.02, 'SHIRT_D', lift=0.006) for sg in (1, -1)])
    T['open_jacket'] = join(chest(fem, 'SHIRT', 0.024, hem=HEM - 0.07, flare=0.03, dip=0.03), sleeves('SHIRT', 'long', 0.026, cuff='SHIRT_D'), inner, up_collar, lapels, pockets)
    # bulky sweater: full in the middle, chunky roll collar, tight ribbed hem and cuffs, a chest band
    roll = {'spine_03': [loft([[0, ty - 0.035, 0.0, 0.085, 0.075], [0, ty + 0.01, 0.004, 0.08, 0.072], [0, ty + 0.035, 0.01, 0.062, 0.058]], 'SHIRT_D', n=8, caps=[False, False])]}
    T['jumper'] = join(chest(fem, 'SHIRT', 0.016, bulge=0.028), sleeves('SHIRT', 'long', 0.03, cuff='SHIRT_D'), band(fem, HEM - 0.005, 0.05, 0.016, 'SHIRT_D'), roll,
                       band(fem, 1.21, 0.055, 0.046, 'SHIRT_D'))
    bib = join(patch(fem, 0.02, -0.07, 0.07, 1.12, 1.3, 'PANTS'),
               *[on_chest(fem, [(sg*0.045, 1.3), (sg*0.068, 1.3), (sg*0.105, 1.42), (sg*0.082, 1.43)], 'PANTS', 0.02, lift=0.006) for sg in (1, -1)],
               *[on_chest(fem, [(sg*0.045, 1.14), (sg*0.068, 1.14), (sg*0.105, 1.41), (sg*0.082, 1.42)], 'PANTS', 0.012, front=False, lift=0.006) for sg in (1, -1)],
               *[on_chest(fem, [(sg*0.05, 1.27), (sg*0.065, 1.27), (sg*0.065, 1.285), (sg*0.05, 1.285)], 'buckle', 0.02, lift=0.009) for sg in (1, -1)])
    T['dungarees'] = join(chest(fem, 'ACC', 0.008, belly='PANTS'), sleeves('ACC', 'short', 0.008), bib, neckline(0.008))
    return T

# ================= bottoms: tapered, hems stacked over the boots =================
def bottoms(fem):
    hipw = 0.152 if fem else 0.146
    def pelvis(col, g=0.006):
        rings = [[0, 0.84, 0.0, 0.11 + g, 0.084 + g], [0, 0.92, 0.0, hipw + g, 0.1 + g], [0, 1.0, 0.004, hipw - 0.002 + g, 0.1 + g]]
        return {'pelvis': [loft(rings, col, ang=TORSO_ANG, caps=[True, False])]}
    belt = {'pelvis': [loft([[0, 0.965, 0.002, hipw + 0.012, 0.106], [0, 0.995, 0.004, hipw + 0.01, 0.106]], 'belt', ang=TORSO_ANG, caps=[False, False]),
                       block([0, 0.98, 0.112], [0.036, 0.026, 0.008], 'buckle')]}
    pockets = {'pelvis': [flat([(x - 0.03, 0.88, -0.1), (x + 0.03, 0.88, -0.1), (x + 0.028, 0.93, -0.106), (x - 0.028, 0.93, -0.106)], 'PANTS_D', BACKN) for x in (-0.06, 0.06)]}
    def legs(col, g=0.01, knee=None, calf_to=None, cuff=None, hem=0.11, flare=0.016):
        def f(sg, sd):
            H, K, A = J['hp' + sd], J['kn' + sd], J['an' + sd]
            thigh = limb(H, K, THIGH, g)
            if knee:   # shorts to above the knee, a little wide at the hem
                t = limb(H, K, THIGH, g, t1=knee); t[-1][3] += 0.012; t[-1][4] += 0.012
                return {'thigh_' + sd: [tube(t, col, caps=[True, False]), tube(limb(H, K, THIGH, -0.006), 'SKIN')],
                        'calf_' + sd: [tube(limb(K, A, CALF, -0.004), 'SKIN')]}
            o = {'thigh_' + sd: [tube(thigh, col)]}
            tcut = (K[1] - (calf_to or hem))/(K[1] - A[1])
            c = limb(K, A, CALF, g, t1=tcut)
            c[-1][3] += flare; c[-1][4] += flare
            o['calf_' + sd] = [tube(c, col, caps=[True, False])]
            if calf_to: o['calf_' + sd].append(tube(limb(K, A, CALF, -0.004), 'SKIN'))
            if cuff:
                y0, y1, cc = cuff; t0 = (K[1] - y0)/(K[1] - A[1]); t1 = (K[1] - y1)/(K[1] - A[1])
                cr = limb(K, A, CALF, g + flare + 0.01, t0=t0, t1=t1); o['calf_' + sd].append(tube(cr, cc))
            return o
        return both_sides(f)
    def stripe(sg, sd):
        out = {}
        for bone, a, b, prof, t1 in (('thigh_', 'hp', 'kn', THIGH, 1.0), ('calf_', 'kn', 'an', CALF, 0.8)):
            P0, P1 = J[a + sd], J[b + sd]; r = along(P0, P1, prof, 0.016)
            r0, r1 = r[0], mixr(r[0], r[-1], t1) if t1 < 1 else r[-1]
            x0 = r0[0] + sg*(r0[3] + 0.002); x1 = r1[0] + sg*(r1[3] + 0.002)
            out[bone + sd] = [flat([(x0, r0[1], r0[2] - 0.009), (x0, r0[1], r0[2] + 0.009), (x1, r1[1], r1[2] + 0.009), (x1, r1[1], r1[2] - 0.009)], 'ACC', (sg, 0, 0))]
        return out
    B = {}
    B['jeans'] = join(pelvis('PANTS'), legs('PANTS'), pockets, belt)
    B['shorts'] = join(pelvis('PANTS'), legs('PANTS', knee=0.82), pockets, belt)
    B['cargo_trousers'] = join(pelvis('PANTS'), legs('PANTS', g=0.016, flare=0.02), belt,
                               both_sides(lambda sg, sd: {'thigh_' + sd: [loft([[sg*0.163, 0.7, 0.012, 0.016, 0.044], [sg*0.163, 0.6, 0.016, 0.018, 0.046]], 'PANTS_D', n=4, rot=45)]}))
    B['capri_trousers'] = join(pelvis('PANTS'), legs('PANTS', calf_to=0.28, flare=0.01), pockets)
    B['track_pants'] = join(pelvis('PANTS'), legs('PANTS', g=0.016, flare=-0.004, cuff=(0.15, 0.11, 'PANTS_D')), both_sides(stripe))
    B['rolled_jeans'] = join(pelvis('PANTS'), legs('PANTS', hem=0.15, flare=0.006, cuff=(0.18, 0.145, 'denimRoll')), pockets, belt)
    return B

# ================= shoes: chunky =================
def shoes():
    def base(col, sole, sg, sd, h=0.05, w=0.064):
        x = J['an' + sd][0]
        return {'foot_' + sd: [loft([[x, h, -0.075, w - 0.006, h - 0.004], [x, h - 0.002, 0.05, w, h - 0.006]], col, ax='z', n=6, rot=0), block([x, 0.013, 0.04], [w*2 + 0.014, 0.026, 0.27], sole)],
                'ball_' + sd: [loft([[x, h - 0.002, 0.05, w, h - 0.006], [x, 0.04, 0.17, w - 0.01, 0.026]], col, ax='z', n=6, rot=0, caps=[False, True])]}
    def shaft(sg, sd, top, col, colD, a=0.056):
        x = J['an' + sd][0]
        return {'calf_' + sd: [loft([[x, 0.06, -0.02, a, a + 0.004], [x, top, -0.018, a - 0.002, a + 0.002]], col, ang=LIMB_ANG),
                               loft([[x, top - 0.02, -0.018, a + 0.005, a + 0.009], [x, top + 0.004, -0.018, a + 0.005, a + 0.009]], colD, ang=LIMB_ANG, caps=[False, True])]}
    S = {}
    S['trainers'] = both_sides(lambda sg, sd: join(base('trainer', 'trainerSole', sg, sd, 0.044, 0.058), {
        'foot_' + sd: [flat([(J['an' + sd][0] + sg*0.0605, 0.028, -0.05), (J['an' + sd][0] + sg*0.0605, 0.028, 0.04), (J['an' + sd][0] + sg*0.0605, 0.058, 0.02), (J['an' + sd][0] + sg*0.0605, 0.058, -0.03)], 'ACC', (sg, 0, 0))],
        'ball_' + sd: [flat([(J['an' + sd][0] - 0.016, 0.083, 0.035), (J['an' + sd][0] + 0.016, 0.083, 0.035), (J['an' + sd][0] + 0.013, 0.066, 0.1), (J['an' + sd][0] - 0.013, 0.066, 0.1)], 'lace', (0, 1, 0.35))]}))
    S['boots'] = both_sides(lambda sg, sd: join(base('boot', 'sole', sg, sd, 0.054, 0.066), shaft(sg, sd, 0.2, 'boot', 'bootD')))
    S['rain_boots'] = both_sides(lambda sg, sd: join(base('rainboot', 'sole', sg, sd, 0.054, 0.066), shaft(sg, sd, 0.34, 'rainboot', 'rainbootD', 0.06)))
    return S

# ================= faces =================
def rect_rims(col, w=0.024, h=0.016, t=0.0045):
    z = face_z(0, EYE_Y) + 0.01
    out = []
    for sg in (1, -1):
        cx = sg*0.031
        for x0, y0, x1, y1 in ((cx - w, EYE_Y + h - t, cx + w, EYE_Y + h), (cx - w, EYE_Y - h, cx + w, EYE_Y - h + t),
                               (cx - w, EYE_Y - h, cx - w + t, EYE_Y + h), (cx + w - t, EYE_Y - h, cx + w, EYE_Y + h)):
            out.append(flat([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], col))
    out.append(flat([(-0.007, EYE_Y + 0.006, z), (0.007, EYE_Y + 0.006, z), (0.007, EYE_Y + 0.011, z), (-0.007, EYE_Y + 0.011, z)], col))
    out += [flat([(sg*0.055, EYE_Y + 0.008, z), (sg*0.088, EYE_Y + 0.01, z - 0.07), (sg*0.088, EYE_Y + 0.015, z - 0.07), (sg*0.055, EYE_Y + 0.014, z)], col, (sg, 0, 0)) for sg in (1, -1)]
    return out
def faces():
    F = {}
    F['calm'] = eyes() + brows() + mouth()
    F['glasses'] = eyes() + brows(BROW_Y + 0.004) + mouth() + rect_rims('frame')
    stub, sa = sub(HEADT.span(1.552, 1.632, 0.002), HEAD_ANG, [0, 1, 2, 3, 4, 5, 6, 7, 8])
    F['stubble'] = eyes() + brows() + [loft(stub, 'HAIR_MIX', ang=sa, closed=False)] + mouth()
    F['freckles'] = eyes() + brows() + mouth() + [flat(on_face([(x - 0.003, y - 0.003), (x + 0.003, y - 0.003), (x + 0.003, y + 0.003), (x - 0.003, y + 0.003)], 0.002), 'freckle')
                                                  for x, y in ((-0.042, 1.652), (-0.032, 1.645), (-0.05, 1.642), (0.042, 1.652), (0.032, 1.645), (0.05, 1.642))]
    F['tired'] = eyes(0.0035) + brows(BROW_Y - 0.003, tilt=0.004) + mouth(0.009) + \
                 [flat(on_face([(sg*0.02, EYE_Y - 0.01), (sg*0.042, EYE_Y - 0.01), (sg*0.038, EYE_Y - 0.015), (sg*0.024, EYE_Y - 0.015)], 0.002), 'SKIN_D') for sg in (1, -1)]
    my = 1.627
    def mo_pts(lift):
        return [(x, y, face_z(x, y) + lift) for x, y in ((-0.026, my - 0.008), (0.026, my - 0.008), (0.016, my + 0.007), (-0.016, my + 0.007))]
    def moustache(col):
        a = mo_pts(0.002); b = mo_pts(0.011)
        return solid(a + b, HEX, col)
    F['moustache'] = eyes() + brows() + mouth() + [moustache('HAIR_D')]
    z = face_z(0, EYE_Y) + 0.0095
    lens = [flat([(sg*0.031 - 0.023, EYE_Y - 0.015, z), (sg*0.031 + 0.023, EYE_Y - 0.015, z), (sg*0.031 + 0.023, EYE_Y + 0.015, z), (sg*0.031 - 0.023, EYE_Y + 0.015, z)], 'shades') for sg in (1, -1)]
    F['dark_glasses'] = brows(BROW_Y + 0.004) + mouth() + lens + rect_rims('shades')
    F['scar'] = eyes() + brows() + mouth() + [flat(on_face([(0.024, 1.72), (0.029, 1.72), (0.047, 1.655), (0.042, 1.655)], 0.003), 'scar')]
    F['_moustache'] = moustache   # used by the beard
    return F

# ================= hair: chunky clumps with ragged edges =================
CLUMP = [1.04, 1.0, 1.06, 1.0, 1.05, 1.0, 1.06, 1.0, 1.04, 1.07, 1.02, 1.07]
def hairline(front, temple, side, back, nape):
    v = {0: side, 30: temple, 58: (front + temple)/2, 76: front, 90: front*1.4, 104: front, 122: (front + temple)/2, 150: temple, 180: side, 225: back, 270: nape, 315: back}
    return [v[t] for t in HEAD_ANG]
def scalp(g_lo, g_hi, d, top=(1.818, 0.05, 0.068, HZ - 0.032), clump=CLUMP, y_lo=1.712, y_mid=1.758, top_k=None):
    lo = HEADT.at(y_lo); lo[3] += g_lo; lo[4] += g_lo; lo = lo[:6] + [d]
    mid = HEADT.at(y_mid); mid[3] += g_hi; mid[4] += g_hi; mid[5] = [k*c for k, c in zip(mid[5], clump)]
    ty, ta, tb, tz = top
    tp = [0, ty, tz, ta, tb, top_k or [1.0]*len(HEAD_ANG)]
    return loft([lo, mid, tp], 'HAIR', ang=HEAD_ANG, caps=[False, True])
def nape(g, y0=1.636, y1=1.712):
    rows, A = sub(HEADT.span(y0, y1, g), HEAD_ANG, [8, 9, 10, 11, 0])
    rows[0] = rows[0][:6] + [[0.0, -0.008, -0.012, -0.008, 0.0]]
    return loft(rows, 'HAIR', ang=A, closed=False, both=True, cin='HAIR_D')
def hair():
    H = {'none': []}
    H['buzzed'] = under_hat([scalp(0.004, 0.006, hairline(-0.004, -0.02, -0.04, -0.062, -0.07), top=(1.8, 0.04, 0.054, HZ - 0.02), clump=[1.0]*12)]) + [nape(0.004)]
    # swept back with height and clumps on top (the grey-haired wanderer)
    H['short'] = under_hat([scalp(0.014, 0.024, hairline(-0.003, -0.026, -0.045, -0.07, -0.08), top=(1.814, 0.06, 0.08, HZ - 0.04), y_mid=1.765, clump=[1.06, 1.0, 1.1, 1.0, 1.08, 1.02, 1.1, 1.0, 1.06, 1.1, 1.02, 1.1],
                                  top_k=[1.0, 1.08, 1.0, 1.1, 1.0, 1.1, 1.0, 1.08, 1.0, 1.06, 1.0, 1.06])]) + [nape(0.012)]
    # straight hair to below the chin with blunt, ragged bangs (the capped girl)
    side, A = sub(HEADT.span(1.71, 1.73, 0.0), HEAD_ANG, [6, 7, 8, 9, 10, 11, 0, 1, 2])
    def shell(y, g, d=None):
        r = HEADT.at(y); r[3] += g; r[4] += g
        r = r[:5] + [[r[5][i] for i in (6, 7, 8, 9, 10, 11, 0, 1, 2)]]
        if d: r.append(d)
        return r
    sides_lo = loft([shell(1.548, 0.034, [0.012, 0, -0.014, 0, -0.012, 0, -0.014, 0, 0.012]), shell(1.62, 0.03), shell(1.68, 0.026)], 'HAIR', ang=A, closed=False, both=True, cin='HAIR_D')
    sides_hi = loft([shell(1.68, 0.026), shell(1.73, 0.024)], 'HAIR', ang=A, closed=False, both=True, cin='HAIR_D')
    bng, BA = sub([HEADT.at(1.692), HEADT.at(1.752)], HEAD_ANG, [2, 3, 4, 5, 6])
    for r in bng: r[3] += 0.026; r[4] += 0.026; r[5] = [k*1.02 for k in r[5]]
    bng[0] = bng[0][:6] + [[0.004, -0.004, 0.002, -0.006, 0.004]]
    bangs = loft(bng, 'HAIR', ang=BA, closed=False, both=True, cin='HAIR_D')
    H['bob'] = [sides_lo] + under_hat([sides_hi, scalp(0.024, 0.026, hairline(0.02, 0.0, -0.01, -0.01, -0.01)), bangs])
    bun = loft([[0, 1.775, -0.05, 0.03, 0.03], [0, 1.81, -0.065, 0.048, 0.046], [0, 1.85, -0.075, 0.026, 0.024]], 'HAIR', n=6)
    H['buns'] = H['buzzed'] + under_hat([bun])
    bd, BDA = sub(HEADT.span(1.556, 1.638, 0.008), HEAD_ANG, [0, 1, 2, 3, 4, 5, 6, 7, 8])
    bd[0] = bd[0][:6] + [[0.03, 0.012, 0.0, -0.004, -0.01, -0.004, 0.0, 0.012, 0.03]]
    beard = loft(bd, 'HAIR', ang=BDA, closed=False, both=True, cin='HAIR_D')
    H['beard'] = H['short'] + [beard, faces()['_moustache']('HAIR')]
    return H

# ================= hats =================
def hats():
    H = {'none': []}
    bea = HEADT.span(1.69, 1.77, 0.032)
    H['beanie'] = [loft(bea + [[0, 1.82, HZ - 0.024, 0.07, 0.078], [0, 1.845, HZ - 0.03, 0.03, 0.036]], 'ACC', ang=HEAD_ANG, caps=[False, True]),
                   loft([r for r in HEADT.span(1.674, 1.72, 0.04)], 'ACC_D', ang=HEAD_ANG, caps=[False, False])]
    cr = HEADT.span(1.712, 1.77, 0.03)
    by = 1.716; bz = face_z(0, by) + 0.03
    brim = solid([(-0.078, by + 0.004, bz - 0.04), (0.078, by + 0.004, bz - 0.04), (0.07, by - 0.022, bz + 0.07), (-0.07, by - 0.022, bz + 0.07),
                  (-0.078, by + 0.013, bz - 0.04), (0.078, by + 0.013, bz - 0.04), (0.07, by - 0.013, bz + 0.07), (-0.07, by - 0.013, bz + 0.07)], HEX, 'ACC_D')
    H['cap'] = [loft(cr + [[0, 1.816, HZ - 0.022, 0.07, 0.074], [0, 1.832, HZ - 0.026, 0.03, 0.034]], 'ACC', ang=HEAD_ANG, caps=[False, True]), brim]
    hl = HEADT.span(1.7, 1.77, 0.048)
    H['helmet'] = [loft(hl + [[0, 1.83, HZ - 0.016, 0.085, 0.09], [0, 1.855, HZ - 0.02, 0.035, 0.04]], 'helmet', ang=HEAD_ANG, caps=[False, True]),
                   loft([[0, 1.69, HZ - 0.008, 0.13, 0.135], [0, 1.705, HZ - 0.008, 0.13, 0.135]], 'helmetD', n=10)]
    return H

# ================= gear =================
def gear():
    bz = lambda y: surface(trings(False, 0.034, 0.03), TORSO_ANG, 0, y, front=False)
    pk = -0.2
    body = [[0, 1.0, pk + 0.01, 0.13, 0.09], [0, 1.08, pk, 0.152, 0.11], [0, 1.44, pk, 0.155, 0.112], [0, 1.58, pk + 0.01, 0.13, 0.092]]
    K = [1.0, 1.04, 1.0, 1.04, 1.0, 1.04, 1.0, 1.04]   # squarish with soft corners
    body = [r + [K] for r in body]
    straps = []
    for sg in (1, -1):
        x0, x1 = sg*0.05, sg*0.08
        top_f = surface(trings(False, 0.034, 0.03), TORSO_ANG, sg*0.07, 1.43) + 0.008
        straps.append(flat([(sg*0.085, 1.465, 0.0), (sg*0.115, 1.455, 0.0), (sg*0.1, 1.43, top_f), (sg*0.07, 1.43, top_f)], 'strap', (0, 1, 0.3)))
        for ya, yb in ((1.43, 1.3), (1.3, 1.14)):
            za = surface(trings(False, 0.034, 0.03), TORSO_ANG, sg*0.07, ya) + 0.008; zb = surface(trings(False, 0.034, 0.03), TORSO_ANG, sg*0.065, yb) + 0.008
            straps.append(flat([(sg*0.055, ya, za), (sg*0.085, ya, za), (sg*0.08, yb, zb), (sg*0.05, yb, zb)], 'strap'))
    pack = {'spine_03': [loft(body, 'pack', n=8, rot=22.5),
                         loft([[0, 1.565, pk + 0.01, 0.142, 0.104], [0, 1.615, pk + 0.006, 0.12, 0.086]], 'packD', n=8, rot=22.5, caps=[False, True]),
                         loft([[0, 1.06, pk - 0.105, 0.11, 0.028], [0, 1.24, pk - 0.11, 0.11, 0.032]], 'packD', n=6, rot=0),
                         loft([[0.19, 1.672, pk + 0.006, 0.058, 0.058, [1, 1.06, 1, 1.06, 1, 1.06]], [-0.19, 1.672, pk + 0.006, 0.058, 0.058, [1, 1.06, 1, 1.06, 1, 1.06]]], 'roll', ax='x', n=6),
                         loft([[0.12, 1.672, pk + 0.006, 0.062, 0.062], [0.1, 1.672, pk + 0.006, 0.062, 0.062]], 'rollD', ax='x', n=6),
                         loft([[-0.1, 1.672, pk + 0.006, 0.062, 0.062], [-0.12, 1.672, pk + 0.006, 0.062, 0.062]], 'rollD', ax='x', n=6),
                         loft([[0.172, 1.04, pk + 0.01, 0.032, 0.032], [0.172, 1.22, pk + 0.01, 0.032, 0.032], [0.172, 1.26, pk + 0.01, 0.014, 0.014]], 'bottle', n=6)] + straps}
    # chunky knitted scarf with a checked tail
    sk = [1.0, 1.08, 0.96, 1.08, 1.0, 1.06, 0.96, 1.06]
    scarf_rows = [[0, 1.43, 0.004, 0.09, 0.084, sk], [0, 1.49, 0.012, 0.078, 0.072, sk], [0, 1.535, 0.022, 0.058, 0.054]]
    fz = surface(trings(False, 0.034, 0.03), TORSO_ANG, 0.05, 1.4) + 0.016
    cz = lambda x, y: surface(trings(False, 0.03, 0.02), TORSO_ANG, x, y) + 0.016
    tail = loft([[0.05, 1.44, cz(0.05, 1.44), 0.034, 0.012], [0.056, 1.3, cz(0.056, 1.3), 0.036, 0.012], [0.058, 1.24, cz(0.058, 1.24), 0.036, 0.012]], 'ACC', n=4, rot=45)
    checks = [flat([(0.05 + dx - 0.009, y - 0.009, cz(0.05 + dx, y) + 0.013), (0.05 + dx + 0.009, y - 0.009, cz(0.05 + dx, y) + 0.013),
                    (0.05 + dx + 0.009, y + 0.009, cz(0.05 + dx, y) + 0.013), (0.05 + dx - 0.009, y + 0.009, cz(0.05 + dx, y) + 0.013)], 'ACC_D')
              for dx, y in ((-0.012, 1.4), (0.012, 1.37), (-0.012, 1.34), (0.012, 1.31), (-0.012, 1.28))]
    scarf = {'neck_01': [loft(scarf_rows, 'ACC', n=8, caps=[False, False]), loft([r[:5] for r in scarf_rows[:2]], 'ACC_D', n=8, caps=[False, False], closed=False, ang=[250, 290])],
             'spine_03': [tail] + checks}
    gloves = both_sides(lambda sg, sd: {'hand_' + sd: [loft(hand_rings(sg, sd, 0.007), 'glove', n=4, rot=45), thumb(sg, sd, 'glove'),
                                                       loft([[J['wr' + sd][0], J['wr' + sd][1] + 0.03, J['wr' + sd][2], 0.034, 0.038], [J['wr' + sd][0], J['wr' + sd][1] - 0.008, J['wr' + sd][2] + 0.004, 0.032, 0.036]], 'gloveD', ang=LIMB_ANG, caps=[False, False])]})
    return {'backpack': pack, 'scarf': scarf, 'gloves': gloves}

# ================= counting (same rules as shapes.js) =================
def count(pieces):
    t = 0
    for q in pieces:
        s = q['s']
        if s == 'loft':
            A = len(q['ang']) if 'ang' in q else q.get('n', 8); R = len(q['r']); closed = q.get('closed', True)
            if closed:
                caps = q.get('caps', [True, True]); t += A*(R - 1)*2 + (int(caps[0]) + int(caps[1]))*(A - 2)
            else: t += (A - 1)*(R - 1)*2*(2 if q.get('both') else 1)
        elif s == 'decal': t += len(q['v']) - 2
        elif s == 'poly': t += sum(len(f) - 2 for f in q['f'])
        else: t += {'box': 12, 'bev': 44, 'wedge': 8, 'cyl': 28}[s]
    return t
def count_bones(d): return sum(count(v) for v in d.values())

HEAD_SCALE = 1.1   # a touch larger than life, so faces read at play distance
def grow(d, s=HEAD_SCALE):
    c = BONES['Head']['pivot']
    def one(q):
        q = dict(q); q['p'] = [R4(c[i] + (q['p'][i] - c[i])*s) for i in range(3)]
        if 'v' in q: q['v'] = [[R4(x*s) for x in v] for v in q['v']]
        if 'd' in q: q['d'] = [R4(x*s) for x in q['d']]
        if 'r' in q: q['r'] = [[R4(x*s) for x in r[:5]] + r[5:6] + ([[R4(x*s) for x in r[6]]] if len(r) > 6 else []) for r in q['r']]
        return q
    return {b: ([one(q) for q in ps] if b == 'Head' else ps) for b, ps in d.items()}
def body(fem): return join(grow(head(fem)), hands())
FACES = faces(); del FACES['_moustache']
pack = {
  'name': 'survivor', 'version': 5, 'style': 'lean faceted wanderers in a relaxed stance, built on the low-poly character craft rules (13 October 2026)',
  'about': 'Every character creator choice as faceted pieces, grouped by skeleton bone. See docs/SHAPED.md.',
  'units': 'metres', 'facing': '+Z', 'left': '+X', 'height': 1.80,
  'bones': BONES, 'palette': PALETTE, 'slots': SLOTS,
  'darker': 0.78, 'mix': 0.55, 'tone': TONE,
  'colourRule': 'A slot ending in _D is that colour times darker. HAIR_MIX is SKIN blended towards HAIR by mix (stubble).',
  'toneRule': 'Build with SHAPED.build(pieces, colourOf, out, {tone: pack.tone, oy: bone pivot height}) for the soft gradient and facet variation.',
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
    'gear': ['backpack', 'scarf', 'gloves']},
  'parts': {
    'body': {'masculine': body(False), 'feminine': body(True)},
    'top': {'masculine': tops(False), 'feminine': tops(True)},
    'bottoms': {'masculine': bottoms(False), 'feminine': bottoms(True)},
    'shoes': shoes(),
    'face': {k: grow({'Head': v}) for k, v in FACES.items()},
    'hair': {k: grow({'Head': v}) for k, v in hair().items()},
    'hat': {k: grow({'Head': v}) for k, v in hats().items()},
    'gear': gear()}
}
tri = {}
for grp, val in pack['parts'].items():
    for k, v in val.items():
        if grp == 'body': tri[f'body.{k}'] = count_bones(v)
        elif grp in ('top', 'bottoms'):
            for k2, v2 in v.items(): tri[f'{grp}.{k}.{k2}'] = count_bones(v2)
        else: tri[f'{grp}.{k}'] = count_bones(v)
pack['triangles'] = tri
here = os.path.dirname(os.path.abspath(__file__)); out = os.path.join(here, '..', 'survivor.js')
with open(out, 'w') as f:
    f.write('/* Afterstreet shaped survivor pack: made by assets/shaped/src/survivor.py, do not edit by hand */\n')
    f.write('(window.SHAPED = window.SHAPED || {}).survivor = ' + json.dumps(pack, separators=(',', ':')) + ';\n')
mx = lambda pre: max(v for k, v in tri.items() if k.startswith(pre))
print('wrote', os.path.relpath(out), os.path.getsize(out), 'bytes')
print('heaviest mix:', tri['body.masculine'] + mx('top.masculine') + mx('bottoms.masculine') + mx('shoes') + mx('face') + mx('hair') + mx('hat') + sum(tri['gear.' + g] for g in ('backpack', 'scarf', 'gloves')))
for k in sorted(tri): print(f'  {k}: {tri[k]}')
