#!/usr/bin/env python3
"""Afterstreet shaped survivor pack, version 3 (13 October 2026): cute, chunky faceted people from the user's
reference lineup. Every character creator choice as faceted pieces, grouped by skeleton bone.
Writes assets/shaped/survivor.js. Run: python3 assets/shaped/src/survivor.py

Style: a big round head (about a fifth of the height) with small oval eyes, a tiny nose, a small mouth and a
hint of blush; clothes as simple boxy volumes (A-line tops, wide cap sleeves, boxy shorts); thin arms and legs
with small hands and feet; hair as big rounded masses; muted but warm colours; flat-shaded planes.
Coordinates are metres in a reference pose (standing, arms down, facing +Z, the survivor's left is +X).
Each bone lists its pivot (joint) and tip (next joint) so the game can fit the pieces to its own skeleton."""
import json, os, math

R4 = lambda v: round(v, 4)
def mean(pts): return [sum(p[i] for p in pts)/len(pts) for i in range(3)]
def loft(rings, c, n=None, ang=None, ax='y', **k):
    """rings: absolute [x, y, z, a, b]"""
    p = mean([r[:3] for r in rings])
    o = {'s': 'loft', 'p': [R4(v) for v in p], 'r': [[R4(r[0]-p[0]), R4(r[1]-p[1]), R4(r[2]-p[2]), R4(r[3]), R4(r[4])] for r in rings], 'c': c}
    if ang: o['ang'] = ang
    elif n and n != 8: o['n'] = n
    if ax != 'y': o['ax'] = ax
    o.update(k); return o
def decal(pts, c, n=(0, 0, 1), **k):
    p = mean(pts); o = {'s': 'decal', 'p': [R4(v) for v in p], 'v': [[R4(q[i]-p[i]) for i in range(3)] for q in pts], 'n': list(n), 'c': c}
    o.update(k); return o
def poly(pts, faces, c, **k):
    p = mean(pts); o = {'s': 'poly', 'p': [R4(v) for v in p], 'v': [[R4(q[i]-p[i]) for i in range(3)] for q in pts], 'f': faces, 'c': c}
    o.update(k); return o
def box(p, d, c, **k):
    o = {'s': 'box', 'p': [R4(v) for v in p], 'd': [R4(v) for v in d], 'c': c}; o.update(k); return o
BOXF = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
def merge(*dicts):
    out = {}
    for d in dicts:
        for b, ps in d.items(): out.setdefault(b, []).extend(ps)
    return out
def sided(fn):
    out = {}
    for sg, sd in ((1, 'l'), (-1, 'r')):
        for b, ps in fn(sg, sd).items(): out.setdefault(b, []).extend(ps)
    return out
def interp(table, y):
    if y <= table[0][0]: return table[0][1:]
    for (y0, *v0), (y1, *v1) in zip(table, table[1:]):
        if y0 <= y <= y1:
            f = (y - y0)/(y1 - y0); return tuple(a + (b - a)*f for a, b in zip(v0, v1))
    return table[-1][1:]
def rings_of(table, y0, y1, g=0.0, scale=1.0):
    rows = [r for r in table if y0 <= r[0] <= y1]
    if not rows or rows[0][0] > y0 + 1e-6: rows = [(y0, *interp(table, y0))] + rows
    if rows[-1][0] < y1 - 1e-6: rows = rows + [(y1, *interp(table, y1))]
    return [[0, y, oz, a*scale + g, b*scale + g] for (y, a, b, oz) in rows]
def hide(pieces):
    for q in pieces: q['hat'] = 'hide'
    return pieces
def lerp(r0, r1, f): return [r0[j] + (r1[j] - r0[j])*f for j in range(5)]
FN = (0, 0, 1); BN = (0, 0, -1)

# ---------------- skeleton: 1.65 m, big head ----------------
BONES = {
  'pelvis':   {'pivot': [0, 0.80, 0], 'tip': [0, 0.88, 0]},
  'spine_01': {'pivot': [0, 0.88, 0], 'tip': [0, 0.98, 0], 'parent': 'pelvis'},
  'spine_02': {'pivot': [0, 0.98, 0], 'tip': [0, 1.08, 0], 'parent': 'spine_01'},
  'spine_03': {'pivot': [0, 1.08, 0], 'tip': [0, 1.26, 0], 'parent': 'spine_02'},
  'neck_01':  {'pivot': [0, 1.26, 0], 'tip': [0, 1.32, 0.005], 'parent': 'spine_03'},
  'Head':     {'pivot': [0, 1.32, 0.005], 'tip': [0, 1.62, 0], 'parent': 'neck_01'},
}
for sg, sd in ((1, 'l'), (-1, 'r')):
    BONES['upperarm_' + sd] = {'pivot': [sg*0.135, 1.24, 0], 'tip': [sg*0.15, 1.02, -0.005], 'parent': 'spine_03'}
    BONES['lowerarm_' + sd] = {'pivot': [sg*0.15, 1.02, -0.005], 'tip': [sg*0.16, 0.82, 0.015], 'parent': 'upperarm_' + sd}
    BONES['hand_' + sd]     = {'pivot': [sg*0.16, 0.82, 0.015], 'tip': [sg*0.163, 0.73, 0.02], 'parent': 'lowerarm_' + sd}
    BONES['thigh_' + sd]    = {'pivot': [sg*0.065, 0.79, 0], 'tip': [sg*0.07, 0.42, 0], 'parent': 'pelvis'}
    BONES['calf_' + sd]     = {'pivot': [sg*0.07, 0.42, 0], 'tip': [sg*0.07, 0.07, -0.01], 'parent': 'thigh_' + sd}
    BONES['foot_' + sd]     = {'pivot': [sg*0.07, 0.07, -0.01], 'tip': [sg*0.07, 0.03, 0.05], 'parent': 'calf_' + sd}
    BONES['ball_' + sd]     = {'pivot': [sg*0.07, 0.03, 0.05], 'tip': [sg*0.07, 0.02, 0.11], 'parent': 'foot_' + sd}

PALETTE = {
  'eye': '#1d1a1a', 'lip': '#9c5a52', 'blush': '#e6a596', 'freckle': '#a8694e', 'scar': '#c48a7a', 'frame': '#8c5a3c', 'shades': '#1d1f22',
  'collar': '#ece6da', 'helmet': '#55603e', 'helmetD': '#3f4830', 'metal': '#9097a0', 'belt': '#2e2622',
  'trainer': '#e3ddd2', 'gum': '#a98257', 'boot': '#5a3d2a', 'bootD': '#3b281c', 'rainboot': '#d9b13b', 'rainbootD': '#a8862b',
  'sole': '#262321', 'lace': '#ece6da', 'pack': '#b5543e', 'packD': '#8e3f2f', 'roll': '#a8b85a', 'denimRoll': '#6c84a6'
}
SLOTS = {
  'SKIN':  ['#f3d9c7', '#e6bc9e', '#c8916b', '#94623f', '#5c3b28'],
  'HAIR':  ['#1d1a19', '#4a3527', '#8a3f25', '#d0aa6a', '#b7b3ad'],
  'SHIRT': 'player colour', 'PANTS': 'player colour', 'ACC': 'player second colour'
}

# ---------------- head: big and round, wide flat face between 62 and 118 degrees ----------------
HEAD_ANG = [0, 32, 62, 118, 148, 180, 215, 250, 290, 325]
HEAD = [(1.315, 0.05, 0.045, 0.05), (1.35, 0.112, 0.1, 0.024), (1.42, 0.136, 0.128, 0.006), (1.5, 0.14, 0.135, 0.0),
        (1.57, 0.126, 0.126, -0.008), (1.61, 0.08, 0.086, -0.012), (1.625, 0.03, 0.035, -0.014)]
SIN62 = math.sin(math.radians(62))
def faceZ(y):
    a, b, oz = interp(HEAD, y); return oz + b*SIN62
def on_face(pts, lift=0.002): return [(x, y, faceZ(y) + lift) for x, y in pts]
def ellipse(cx, cy, rx, ry, k=8, rot=0):
    return [(cx + math.cos(math.radians(rot + 360*i/k))*rx, cy + math.sin(math.radians(rot + 360*i/k))*ry) for i in range(k)]
EYE_Y = 1.445; BROW_Y = 1.478; MOUTH_Y = 1.385
def head_base(fem):
    skull = loft(rings_of(HEAD, 1.315, 1.625), 'SKIN', ang=HEAD_ANG)
    nz = faceZ(1.415)
    nose = poly([(0, 1.43, faceZ(1.43) - 0.002), (-0.012, 1.405, nz), (0.012, 1.405, nz), (0, 1.41, nz + 0.016)], [[0, 1, 3], [0, 3, 2], [1, 2, 3], [0, 2, 1]], 'SKIN')
    ears = [loft([[sg*0.132, 1.44, -0.01, 0.022, 0.028], [sg*0.148, 1.44, -0.012, 0.017, 0.022]], 'SKIN', n=6, ax='x') for sg in (1, -1)]
    neck = loft([[0, 1.25, 0, 0.034, 0.032], [0, 1.33, 0.004, 0.032, 0.03]], 'SKIN', n=6)
    return {'Head': [skull, nose] + ears, 'neck_01': [neck]}
def eyes(ry=0.014, rx=0.011, y=EYE_Y):
    return [decal(on_face(ellipse(sg*0.048, y, rx, ry, 8), 0.002), 'eye', FN) for sg in (1, -1)]
def brows(y=BROW_Y, tilt=0.0):
    return [decal(on_face([(sg*0.032, y - 0.003), (sg*0.064, y - 0.003 - tilt), (sg*0.064, y + 0.003 - tilt), (sg*0.032, y + 0.004)], 0.0025), 'HAIR_D', FN) for sg in (1, -1)]
def mouth(w=0.014, y=MOUTH_Y):
    return [decal(on_face([(-w, y), (0, y + 0.004), (w, y), (0, y - 0.006)], 0.004), 'lip', FN)]
def blush():
    return [decal(on_face(ellipse(sg*0.078, 1.405, 0.016, 0.009, 8), 0.0015), 'blush', FN) for sg in (1, -1)]

# ---------------- torso: boxy A-line volumes ----------------
HEM, SPLIT, NECK_Y = 0.80, 1.0, 1.285
def torso_table(fem):
    if fem: return [(HEM, 0.172, 0.118, 0), (1.0, 0.126, 0.092, 0), (1.17, 0.13, 0.095, 0.006), (1.235, 0.114, 0.08, -0.004), (NECK_Y, 0.05, 0.046, -0.005)]
    return [(HEM, 0.17, 0.115, 0), (1.0, 0.142, 0.098, 0), (1.18, 0.142, 0.096, 0), (1.24, 0.118, 0.08, -0.005), (NECK_Y, 0.055, 0.05, -0.005)]
def torso(fem, col, g=0.0, belly=None, hem=HEM):
    T = torso_table(fem)
    lo = rings_of(T, HEM, SPLIT, g); lo[0][1] = hem
    return {'spine_01': [loft(lo, belly or col, n=6, rot=0, caps=[True, False])],
            'spine_03': [loft(rings_of(T, SPLIT, NECK_Y, g), col, n=6, rot=0, caps=[False, True])]}
def band(fem, y, h, g, col):
    bone = 'spine_01' if y < SPLIT else 'spine_03'
    return {bone: [loft(rings_of(torso_table(fem), y, y + h, g + 0.004), col, n=6, rot=0, caps=[False, False])]}
def front(fem, y, g=0.0):
    a, b, oz = interp(torso_table(fem), y); return oz + (b + g)*0.866
def back(fem, y, g=0.0):
    a, b, oz = interp(torso_table(fem), y); return oz - (b + g)*0.866
def fdecal(fem, pts, col, g, bone=None, n=FN, lift=0.004):
    """pts (x, y) on the front (n=FN) or back (n=BN) face of the torso"""
    zf = (lambda y: front(fem, y, g) + lift) if n == FN else (lambda y: back(fem, y, g) - lift)
    ys = [y for _, y in pts]; bone = bone or ('spine_01' if sum(ys)/len(ys) < SPLIT else 'spine_03')
    return {bone: [decal([(x, y, zf(y)) for x, y in pts], col, n)]}
ARM_UP = [(0.135, 1.245, 0, 0.032, 0.034), (0.15, 1.02, -0.005, 0.027, 0.029)]
ARM_LO = [(0.15, 1.02, -0.005, 0.027, 0.029), (0.16, 0.82, 0.015, 0.021, 0.023)]
def arm(rings, sg, g=0.0): return [[sg*x, y, z, a + g, b + g] for x, y, z, a, b in rings]
def arms(fem, upper, lower, short=False, cuff=None, g=0.012):
    def f(sg, sd):
        if short:   # wide cap sleeve, open at the bottom
            top = arm(ARM_UP, sg)[0]; top = [top[0], 1.262, top[2], 0.05, 0.052]
            bot = lerp(arm(ARM_UP, sg)[0], arm(ARM_UP, sg)[1], 0.5); bot[3] = 0.056; bot[4] = 0.058
            up = [loft(arm(ARM_UP, sg), 'SKIN', n=6), loft([top, bot], upper, n=6, caps=[True, False])]
        else:
            r = arm(ARM_UP, sg, g); r[0][1] = 1.258; r[0][3] += 0.008; r[0][4] += 0.008
            up = [loft(r, upper, n=6)]
        lo = [loft(arm(ARM_LO, sg, 0 if lower == 'SKIN' else g), lower, n=6)]
        if cuff:
            w = arm(ARM_LO, sg, g + 0.007); w[0] = lerp(w[0], w[1], 0.82)
            lo.append(loft(w, cuff, n=6, caps=[False, False]))
        return {'upperarm_' + sd: up, 'lowerarm_' + sd: lo}
    return sided(f)
def hands():
    return sided(lambda sg, sd: {'hand_' + sd: [loft([[sg*0.16, 0.825, 0.015, 0.024, 0.03], [sg*0.162, 0.775, 0.02, 0.024, 0.036], [sg*0.163, 0.73, 0.02, 0.012, 0.018]], 'SKIN', n=4)]})

# ---------------- legs: thin, small feet ----------------
THIGH = [(0.065, 0.80, 0, 0.046, 0.048), (0.07, 0.42, 0, 0.034, 0.036)]
CALF = [(0.07, 0.42, 0, 0.034, 0.036), (0.07, 0.07, -0.01, 0.022, 0.024)]
def leg(rings, sg, g=0.0): return [[sg*x, y, z, a + g, b + g] for x, y, z, a, b in rings]
def leg_cut(rings, y_hi, y_lo):
    r0, r1 = rings
    at = lambda y: lerp(r0, r1, (r0[1] - y)/(r0[1] - r1[1]))
    return [at(y_hi), at(y_lo)]

# ---------------- tops ----------------
def tops(fem):
    T = {}
    nz = front(fem, 1.27)
    scoop = {'spine_03': [decal([(-0.045, 1.278, nz - 0.022), (0.045, 1.278, nz - 0.022), (0.025, 1.245, front(fem, 1.245) + 0.004), (-0.025, 1.245, front(fem, 1.245) + 0.004)], 'SKIN', (0, 0.35, 1))]}
    tee = merge(torso(fem, 'SHIRT', 0.006), arms(fem, 'SHIRT', 'SKIN', short=True), scoop)
    T['tshirt'] = tee
    T['striped_tee'] = merge(tee, *[band(fem, y, 0.034, 0.006, 'ACC') for y in (0.86, 0.96, 1.07, 1.17)])
    def vstripe(x, col, g):
        return merge(fdecal(fem, [(x - 0.012, HEM), (x + 0.012, HEM), (x + 0.012, SPLIT), (x - 0.012, SPLIT)], col, g, 'spine_01'),
                     fdecal(fem, [(x - 0.012, SPLIT), (x + 0.012, SPLIT), (x + 0.012, 1.215), (x - 0.012, 1.215)], col, g, 'spine_03'))
    collar = {'spine_03': [decal([(sg*0.008, 1.282, nz - 0.01), (sg*0.06, 1.27, nz - 0.024), (sg*0.03, 1.225, front(fem, 1.225, 0.01) + 0.008)], 'SHIRT_D', (0, 0.35, 1)) for sg in (1, -1)]}
    T['flannel_shirt'] = merge(torso(fem, 'SHIRT', 0.01), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D'),
                               *[band(fem, y, 0.03, 0.01, 'ACC') for y in (0.88, 1.02, 1.15)], vstripe(0.05, 'ACC', 0.01), vstripe(-0.05, 'ACC', 0.01), collar)
    spots = merge(*[fdecal(fem, ellipse(x, y, 0.011, 0.011, 6), 'ACC', 0.006) for x, y in ((-0.05, 1.17), (0.04, 1.2), (0.02, 1.1), (-0.035, 1.03), (0.055, 0.98), (-0.045, 0.88), (0.03, 0.85))],
                  *[fdecal(fem, ellipse(x, y, 0.011, 0.011, 6), 'ACC', 0.006, n=BN) for x, y in ((0.04, 1.15), (-0.05, 1.05), (0.02, 0.9))])
    T['spotted_top'] = merge(tee, spots)
    hood = {'spine_03': [loft([[0, 1.24, -0.03, 0.12, 0.1], [0, 1.3, -0.06, 0.13, 0.11], [0, 1.36, -0.09, 0.1, 0.085]], 'SHIRT_D',
                              ang=[190, 222, 254, 286, 318, 350], closed=False, both=True, cin='SHIRT')]}
    pocket = fdecal(fem, [(-0.07, 0.84), (0.07, 0.84), (0.055, 0.93), (-0.055, 0.93)], 'SHIRT_D', 0.02, lift=0.006)
    strings = merge(*[fdecal(fem, [(x - 0.004, 1.25), (x + 0.004, 1.25), (x + 0.004, 1.17), (x - 0.004, 1.17)], 'ACC', 0.02, lift=0.006) for x in (-0.025, 0.025)])
    T['hoodie'] = merge(torso(fem, 'SHIRT', 0.02), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D', g=0.018), band(fem, HEM, 0.035, 0.024, 'SHIRT_D'), hood, pocket, strings)
    inner = merge(fdecal(fem, [(-0.03, HEM + 0.01), (0.03, HEM + 0.01), (0.03, SPLIT), (-0.03, SPLIT)], 'ACC', 0.018, 'spine_01'),
                  fdecal(fem, [(-0.03, SPLIT), (0.03, SPLIT), (0.042, 1.27), (-0.042, 1.27)], 'ACC', 0.018, 'spine_03'))
    lapels = merge(*[fdecal(fem, [(sg*0.04, 1.27), (sg*0.08, 1.235), (sg*0.045, 1.08), (sg*0.032, 1.12)], 'SHIRT_D', 0.018, 'spine_03', lift=0.009) for sg in (1, -1)])
    T['open_jacket'] = merge(torso(fem, 'SHIRT', 0.016, hem=HEM - 0.04), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D', g=0.016), inner, lapels)
    pp = {'spine_03': [decal([(sg*0.004, 1.284, nz - 0.006), (sg*0.06, 1.272, nz - 0.02), (sg*0.065, 1.245, front(fem, 1.245, 0.014) + 0.008), (sg*0.012, 1.238, front(fem, 1.238, 0.014) + 0.012)],
                              'collar', (0, 0.35, 1)) for sg in (1, -1)]}
    T['jumper'] = merge(torso(fem, 'SHIRT', 0.014), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D', g=0.014), band(fem, HEM, 0.04, 0.018, 'SHIRT_D'), pp)
    bib = merge(fdecal(fem, [(-0.065, 1.0), (0.065, 1.0), (0.06, 1.15), (-0.06, 1.15)], 'PANTS', 0.016, 'spine_03'),
                *[fdecal(fem, [(sg*0.04, 1.15), (sg*0.06, 1.15), (sg*0.085, 1.26), (sg*0.068, 1.27)], 'PANTS', 0.016, 'spine_03') for sg in (1, -1)],
                *[fdecal(fem, [(sg*0.04, 1.02), (sg*0.06, 1.02), (sg*0.085, 1.25), (sg*0.068, 1.26)], 'PANTS', 0.008, 'spine_03', n=BN) for sg in (1, -1)])
    T['dungarees'] = merge(torso(fem, 'ACC', 0.006, belly='PANTS'), arms(fem, 'ACC', 'SKIN', short=True), bib, scoop)
    return T

# ---------------- bottoms ----------------
def bottoms(fem):
    hipT = [(0.72, 0.112 if not fem else 0.118, 0.08, 0), (0.84, 0.13 if not fem else 0.136, 0.09, 0)]
    def pelvis(col):
        return {'pelvis': [loft([[0, y, oz, a + 0.004, b + 0.004] for y, a, b, oz in hipT], col, n=6, rot=0)]}
    pk = {'pelvis': [decal([(x - 0.028, 0.735, -0.074), (x + 0.028, 0.735, -0.074), (x + 0.024, 0.78, -0.079), (x - 0.024, 0.78, -0.079)], 'PANTS_D', BN) for x in (-0.055, 0.055)]}
    def legs(col, g=0.012, thigh_to=None, calf_to=None, cuff=None):
        def f(sg, sd):
            o = {}
            if thigh_to:   # boxy shorts over bare legs
                t = leg_cut(leg(THIGH, sg, g + 0.012), 0.8, thigh_to); t[1][3] += 0.016; t[1][4] += 0.016
                o['thigh_' + sd] = [loft(t, col, n=6, caps=[True, False]), loft(leg(THIGH, sg), 'SKIN', n=6)]
                o['calf_' + sd] = [loft(leg(CALF, sg), 'SKIN', n=6)]
                return o
            o['thigh_' + sd] = [loft(leg(THIGH, sg, g), col, n=6)]
            if calf_to:
                o['calf_' + sd] = [loft(leg_cut(leg(CALF, sg, g), 0.42, calf_to), col, n=6, caps=[True, False]), loft(leg(CALF, sg), 'SKIN', n=6)]
            else:
                o['calf_' + sd] = [loft(leg(CALF, sg, g), col, n=6)]
            if cuff:
                y0, y1, cc = cuff; o['calf_' + sd].append(loft(leg_cut(leg(CALF, sg, g + 0.008), y0, y1), cc, n=6, caps=[False, False]))
            return o
        return sided(f)
    def stripe(rings, sg):
        r0, r1 = rings; x0 = r0[0] + sg*(r0[3]*0.866 + 0.002); x1 = r1[0] + sg*(r1[3]*0.866 + 0.002)
        return decal([(x0, r0[1], r0[2] - 0.009), (x0, r0[1], r0[2] + 0.009), (x1, r1[1], r1[2] + 0.009), (x1, r1[1], r1[2] - 0.009)], 'ACC', (sg, 0, 0))
    B = {}
    B['jeans'] = merge(pelvis('PANTS'), legs('PANTS'), pk)
    B['shorts'] = merge(pelvis('PANTS'), legs('PANTS', thigh_to=0.6), pk)
    B['cargo_trousers'] = merge(pelvis('PANTS'), legs('PANTS', g=0.016), sided(lambda sg, sd: {'thigh_' + sd: [box([sg*0.125, 0.56, 0.0], [0.024, 0.08, 0.06], 'PANTS_D')]}))
    B['capri_trousers'] = merge(pelvis('PANTS'), legs('PANTS', calf_to=0.22), pk)
    B['track_pants'] = merge(pelvis('PANTS'), legs('PANTS', g=0.016, cuff=(0.14, 0.08, 'PANTS_D')),
                             sided(lambda sg, sd: {'thigh_' + sd: [stripe(leg(THIGH, sg, 0.016), sg)], 'calf_' + sd: [stripe(leg_cut(leg(CALF, sg, 0.016), 0.42, 0.15), sg)]}))
    B['rolled_jeans'] = merge(pelvis('PANTS'), legs('PANTS', cuff=(0.15, 0.1, 'denimRoll')), pk)
    return B

# ---------------- shoes: small and rounded ----------------
def shoes():
    def base(col, sole, sg, sd, big=1.0):
        x = sg*0.07
        return {'foot_' + sd: [loft([[x, 0.04, -0.04, 0.05*big, 0.056], [x, 0.042, 0.03, 0.054*big, 0.06]], col, ax='z', n=4),
                               box([x, 0.009, 0.025], [0.072*big, 0.018, 0.165], sole)],
                'ball_' + sd: [loft([[x, 0.042, 0.03, 0.054*big, 0.06], [x, 0.03, 0.115, 0.044*big, 0.036]], col, ax='z', n=4, caps=[False, True])]}
    S = {}
    S['trainers'] = sided(lambda sg, sd: merge(base('trainer', 'gum', sg, sd), {
        'foot_' + sd: [decal([(sg*(0.07 + 0.054*0.707 + 0.003), 0.02, -0.025), (sg*(0.07 + 0.054*0.707 + 0.003), 0.02, 0.03), (sg*(0.07 + 0.054*0.707 + 0.003), 0.05, 0.02), (sg*(0.07 + 0.054*0.707 + 0.003), 0.05, -0.02)], 'ACC', (sg, 0, 0))],
        'ball_' + sd: [decal([(sg*0.07 - 0.014, 0.084, 0.03), (sg*0.07 + 0.014, 0.084, 0.03), (sg*0.07 + 0.012, 0.064, 0.08), (sg*0.07 - 0.012, 0.064, 0.08)], 'lace', (0, 1, 0.3))]}))
    S['boots'] = sided(lambda sg, sd: merge(base('boot', 'sole', sg, sd), {
        'calf_' + sd: [loft([[sg*0.07, 0.06, -0.011, 0.036, 0.04], [sg*0.07, 0.17, -0.01, 0.034, 0.038]], 'boot', n=6),
                       loft([[sg*0.07, 0.16, -0.01, 0.038, 0.042], [sg*0.07, 0.18, -0.01, 0.038, 0.042]], 'bootD', n=6, caps=[False, True])]}))
    S['rain_boots'] = sided(lambda sg, sd: merge(base('rainboot', 'sole', sg, sd, 1.08), {
        'calf_' + sd: [loft([[sg*0.07, 0.06, -0.011, 0.042, 0.046], [sg*0.07, 0.28, -0.01, 0.05, 0.054]], 'rainboot', n=6),
                       loft([[sg*0.07, 0.27, -0.01, 0.054, 0.058], [sg*0.07, 0.29, -0.01, 0.054, 0.058]], 'rainbootD', n=6, caps=[False, True])]}))
    return S

# ---------------- faces ----------------
GZ = None
def glasses_z(): return faceZ(EYE_Y) + 0.024
def rim(cx, cy, ro, ri, col, z):
    segs = []
    for k in range(8):
        t0 = math.radians(22.5 + 45*k); t1 = math.radians(22.5 + 45*(k + 1))
        segs.append(decal([(cx + math.cos(t0)*ri, cy + math.sin(t0)*ri, z), (cx + math.cos(t0)*ro, cy + math.sin(t0)*ro, z),
                           (cx + math.cos(t1)*ro, cy + math.sin(t1)*ro, z), (cx + math.cos(t1)*ri, cy + math.sin(t1)*ri, z)], col, FN))
    return segs
def faces():
    F = {}
    base = eyes() + brows() + mouth() + blush()
    F['calm'] = base
    z = glasses_z()
    rims = rim(0.048, EYE_Y, 0.03, 0.023, 'frame', z) + rim(-0.048, EYE_Y, 0.03, 0.023, 'frame', z)
    bridge = [decal([(-0.018, EYE_Y + 0.004, z), (0.018, EYE_Y + 0.004, z), (0.018, EYE_Y + 0.01, z), (-0.018, EYE_Y + 0.01, z)], 'frame', FN)]
    side = [decal([(sg*0.078, EYE_Y + 0.004, z), (sg*0.136, EYE_Y + 0.008, z - 0.07), (sg*0.136, EYE_Y + 0.014, z - 0.07), (sg*0.078, EYE_Y + 0.011, z)], 'frame', (sg, 0, 0)) for sg in (1, -1)]
    F['glasses'] = eyes() + brows(BROW_Y + 0.008) + mouth() + blush() + rims + bridge + side
    stub = loft(rings_of(HEAD, 1.315, 1.41, 0.003), 'HAIR_MIX', ang=[8, 32, 62, 90, 118, 148, 172], closed=False)
    F['stubble'] = eyes() + brows() + [stub] + mouth()
    fr = [decal(on_face(ellipse(x, y, 0.004, 0.004, 5), 0.003), 'freckle', FN) for x, y in
          ((-0.07, 1.415), (-0.058, 1.403), (-0.082, 1.4), (0.07, 1.415), (0.058, 1.403), (0.082, 1.4), (-0.012, 1.428), (0.012, 1.428))]
    F['freckles'] = base + fr
    bags = [decal(on_face([(sg*0.034, EYE_Y - 0.02), (sg*0.062, EYE_Y - 0.02), (sg*0.058, EYE_Y - 0.026), (sg*0.038, EYE_Y - 0.026)], 0.003), 'SKIN_D', FN) for sg in (1, -1)]
    F['tired'] = eyes(0.008) + brows(BROW_Y - 0.004, tilt=0.005) + bags + mouth(0.011)
    my = 1.398; mz = faceZ(my)
    moust = poly([(-0.032, my - 0.01, mz + 0.004), (0.032, my - 0.01, mz + 0.004), (0.02, my + 0.008, mz + 0.006), (-0.02, my + 0.008, mz + 0.006),
                  (-0.028, my - 0.008, mz + 0.016), (0.028, my - 0.008, mz + 0.016), (0.016, my + 0.006, mz + 0.014), (-0.016, my + 0.006, mz + 0.014)], BOXF, 'HAIR_D')
    F['moustache'] = eyes() + brows() + mouth() + [moust]
    lenses = [decal([(x, y, z - 0.001) for x, y in ellipse(sg*0.048, EYE_Y, 0.027, 0.027, 8, 22.5)], 'shades', FN) for sg in (1, -1)]
    F['dark_glasses'] = brows(BROW_Y + 0.008) + mouth() + lenses + rim(0.048, EYE_Y, 0.03, 0.025, 'shades', z) + rim(-0.048, EYE_Y, 0.03, 0.025, 'shades', z) + bridge + side
    F['scar'] = eyes() + brows() + mouth() + [decal(on_face([(0.035, 1.5), (0.041, 1.5), (0.068, 1.42), (0.062, 1.42)], 0.004), 'scar', FN)]
    return F

# ---------------- hair: big rounded masses ----------------
OPEN = [118, 148, 180, 215, 250, 290, 325, 360, 392, 422]   # sides and back, the face left open
def shell(y0, y1, g, col='HAIR', ang=None, closed=True, caps=None, scale=1.0):
    r = rings_of(HEAD, y0, y1, g, scale)
    if closed: return loft(r, col, ang=ang or HEAD_ANG, caps=caps or [False, True])
    return loft(r, col, ang=ang or OPEN, closed=False, both=True, cin='HAIR_D')
def fringe(y_lo, y_hi, g, push=0.025, ang=(52, 72, 90, 108, 128)):
    a0, b0, oz0 = interp(HEAD, y_lo); a1, b1, oz1 = interp(HEAD, y_hi)
    return loft([[0, y_lo, oz0 + push*0.5, a0 + g, b0 + g + push], [0, y_hi, oz1, a1 + g, b1 + g]], 'HAIR', ang=list(ang), closed=False, both=True, cin='HAIR_D')
def hair():
    H = {'none': []}
    H['buzzed'] = hide([shell(1.53, 1.625, 0.006)]) + [shell(1.43, 1.53, 0.006, closed=False, ang=[150, 180, 215, 250, 290, 325, 360, 390])]
    top = loft([[0, 1.53, -0.004, 0.152, 0.148], [0, 1.6, -0.01, 0.136, 0.138], [0, 1.645, -0.014, 0.08, 0.088]], 'HAIR', ang=HEAD_ANG, caps=[False, True])
    H['short'] = hide([top, fringe(1.5, 1.565, 0.016, 0.02)]) + [shell(1.43, 1.53, 0.012, closed=False, ang=[150, 180, 215, 250, 290, 325, 360, 390])]
    bob_lo = loft([[0, 1.36, -0.014, 0.16, 0.152], [0, 1.45, -0.012, 0.168, 0.162], [0, 1.52, -0.012, 0.164, 0.16]], 'HAIR', ang=OPEN, closed=False, both=True, cin='HAIR_D')
    bob_hi = loft([[0, 1.52, -0.012, 0.164, 0.16], [0, 1.58, -0.014, 0.15, 0.15]], 'HAIR', ang=OPEN, closed=False, both=True, cin='HAIR_D')
    dome = loft([[0, 1.565, -0.012, 0.156, 0.154], [0, 1.62, -0.014, 0.118, 0.122], [0, 1.65, -0.016, 0.06, 0.066]], 'HAIR', ang=HEAD_ANG, caps=[False, True])
    H['bob'] = [bob_lo] + hide([bob_hi, dome, fringe(1.492, 1.58, 0.02, 0.03)])
    bun = [loft([[0, 1.62, -0.03, 0.04, 0.04], [0, 1.66, -0.035, 0.058, 0.058], [0, 1.7, -0.04, 0.03, 0.03]], 'HAIR')]
    H['buns'] = H['buzzed'] + hide(bun) + hide([loft([[0, 1.615, -0.03, 0.045, 0.045], [0, 1.628, -0.03, 0.045, 0.045]], 'ACC', caps=[False, False])])
    beard = loft(rings_of(HEAD, 1.31, 1.42, 0.012), 'HAIR', ang=[-14, 20, 50, 90, 130, 160, 194], closed=False, both=True, cin='HAIR_D')
    my = 1.398; mz = faceZ(my)
    mo = poly([(-0.036, my - 0.01, mz + 0.008), (0.036, my - 0.01, mz + 0.008), (0.022, my + 0.01, mz + 0.008), (-0.022, my + 0.01, mz + 0.008),
               (-0.03, my - 0.008, mz + 0.02), (0.03, my - 0.008, mz + 0.02), (0.018, my + 0.007, mz + 0.018), (-0.018, my + 0.007, mz + 0.018)], BOXF, 'HAIR')
    H['beard'] = H['buzzed'] + [beard, mo]
    return H

# ---------------- hats ----------------
def hats():
    H = {'none': []}
    H['beanie'] = [loft([[0, 1.52, -0.01, 0.152, 0.152], [0, 1.6, -0.012, 0.142, 0.144], [0, 1.66, -0.014, 0.09, 0.096], [0, 1.68, -0.016, 0.03, 0.035]], 'ACC', ang=HEAD_ANG, caps=[False, True]),
                   loft([[0, 1.5, -0.01, 0.158, 0.158], [0, 1.545, -0.01, 0.158, 0.158]], 'ACC_D', ang=HEAD_ANG, caps=[False, False])]
    by, bz = 1.545, faceZ(1.545)
    brim = poly([(-0.1, by, bz - 0.03), (0.1, by, bz - 0.03), (0.085, by - 0.016, bz + 0.09), (-0.085, by - 0.016, bz + 0.09),
                 (-0.1, by + 0.009, bz - 0.03), (0.1, by + 0.009, bz - 0.03), (0.085, by - 0.007, bz + 0.09), (-0.085, by - 0.007, bz + 0.09)], BOXF, 'ACC_D')
    H['cap'] = [loft([[0, 1.535, -0.01, 0.15, 0.15], [0, 1.6, -0.012, 0.136, 0.14], [0, 1.65, -0.015, 0.07, 0.078]], 'ACC', ang=HEAD_ANG, caps=[False, True]), brim]
    H['helmet'] = [loft([[0, 1.51, -0.01, 0.165, 0.168], [0, 1.58, -0.012, 0.162, 0.164], [0, 1.65, -0.014, 0.115, 0.12], [0, 1.68, -0.016, 0.05, 0.055]], 'helmet', caps=[False, True]),
                   loft([[0, 1.5, -0.01, 0.18, 0.183], [0, 1.515, -0.01, 0.18, 0.183]], 'helmetD')]
    return H

def gear():   # a big hiking pack, as in the reference lineup
    return {'backpack': {'spine_03': [loft([[0, 0.86, -0.17, 0.13, 0.08], [0, 1.15, -0.18, 0.14, 0.085], [0, 1.32, -0.17, 0.12, 0.07]], 'pack', n=6, rot=0),
                                      loft([[0, 0.92, -0.255, 0.085, 0.022], [0, 1.06, -0.255, 0.085, 0.022]], 'packD', n=6, rot=0),
                                      loft([[0.14, 1.37, -0.17, 0.05, 0.05], [-0.14, 1.37, -0.17, 0.05, 0.05]], 'roll', ax='x'),
                                      decal([(0.045, 1.25, 0.098), (0.07, 1.25, 0.094), (0.068, 1.02, 0.104), (0.045, 1.02, 0.106)], 'packD', FN),
                                      decal([(-0.045, 1.25, 0.098), (-0.07, 1.25, 0.094), (-0.068, 1.02, 0.104), (-0.045, 1.02, 0.106)], 'packD', FN)]}}

# ---------------- triangle counting (same rules as shapes.js) ----------------
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

def body(fem): return merge(head_base(fem), hands())
pack = {
  'name': 'survivor', 'version': 3, 'style': 'cute chunky faceted people (13 October 2026 reference lineup)',
  'about': 'Every character creator choice as faceted pieces, grouped by skeleton bone. See docs/SHAPED.md.',
  'units': 'metres', 'facing': '+Z', 'left': '+X', 'height': 1.65,
  'bones': BONES, 'palette': PALETTE, 'slots': SLOTS,
  'darker': 0.78, 'mix': 0.55,
  'colourRule': 'A slot ending in _D is that colour times darker. HAIR_MIX is SKIN blended towards HAIR by mix (stubble).',
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
    'shoes': ['trainers', 'boots', 'rain_boots']},
  'parts': {
    'body': {'masculine': body(False), 'feminine': body(True)},
    'top': {'masculine': tops(False), 'feminine': tops(True)},
    'bottoms': {'masculine': bottoms(False), 'feminine': bottoms(True)},
    'shoes': shoes(),
    'face': {k: {'Head': v} for k, v in faces().items()},
    'hair': {k: {'Head': v} for k, v in hair().items()},
    'hat': {k: {'Head': v} for k, v in hats().items()},
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
print('heaviest mix:', tri['body.masculine'] + mx('top.masculine') + mx('bottoms.masculine') + mx('shoes') + mx('face') + mx('hair') + mx('hat') + tri['gear.backpack'])
for k in sorted(tri): print(f'  {k}: {tri[k]}')
