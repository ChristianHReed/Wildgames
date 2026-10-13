#!/usr/bin/env python3
"""Afterstreet shaped survivor pack, version 2: the faceted low-poly look (13 October 2026 references).
Every character creator choice as faceted pieces, grouped by skeleton bone. Writes assets/shaped/survivor.js.
Run: python3 assets/shaped/src/survivor.py

Style: natural slender proportions with a slightly large head; faceted planes, flat shading; simple faces
(dark eyes with no whites, a wedge nose, brows, small lips); hair as chunky masses with blunt cuts; muted colours.
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
    """table: list of (y, a, b, oz) sorted by y; returns (a, b, oz) at y"""
    if y <= table[0][0]: return table[0][1:]
    for (y0, *v0), (y1, *v1) in zip(table, table[1:]):
        if y0 <= y <= y1:
            f = (y - y0)/(y1 - y0); return tuple(a + (b - a)*f for a, b in zip(v0, v1))
    return table[-1][1:]
def hide(pieces):
    for q in pieces: q['hat'] = 'hide'
    return pieces

# ---------------- skeleton ----------------
BONES = {
  'pelvis':   {'pivot': [0, 0.96, 0], 'tip': [0, 1.03, 0]},
  'spine_01': {'pivot': [0, 1.03, 0], 'tip': [0, 1.14, 0], 'parent': 'pelvis'},
  'spine_02': {'pivot': [0, 1.14, 0], 'tip': [0, 1.26, 0], 'parent': 'spine_01'},
  'spine_03': {'pivot': [0, 1.26, 0], 'tip': [0, 1.44, 0], 'parent': 'spine_02'},
  'neck_01':  {'pivot': [0, 1.44, 0], 'tip': [0, 1.53, 0.005], 'parent': 'spine_03'},
  'Head':     {'pivot': [0, 1.53, 0.005], 'tip': [0, 1.78, 0], 'parent': 'neck_01'},
}
for sg, sd in ((1, 'l'), (-1, 'r')):
    BONES['upperarm_' + sd] = {'pivot': [sg*0.185, 1.42, 0], 'tip': [sg*0.208, 1.135, -0.01], 'parent': 'spine_03'}
    BONES['lowerarm_' + sd] = {'pivot': [sg*0.208, 1.135, -0.01], 'tip': [sg*0.218, 0.875, 0.02], 'parent': 'upperarm_' + sd}
    BONES['hand_' + sd]     = {'pivot': [sg*0.218, 0.875, 0.02], 'tip': [sg*0.222, 0.705, 0.03], 'parent': 'lowerarm_' + sd}
    BONES['thigh_' + sd]    = {'pivot': [sg*0.092, 0.94, 0], 'tip': [sg*0.1, 0.52, 0], 'parent': 'pelvis'}
    BONES['calf_' + sd]     = {'pivot': [sg*0.1, 0.52, 0], 'tip': [sg*0.1, 0.09, -0.015], 'parent': 'thigh_' + sd}
    BONES['foot_' + sd]     = {'pivot': [sg*0.1, 0.09, -0.015], 'tip': [sg*0.1, 0.04, 0.06], 'parent': 'calf_' + sd}
    BONES['ball_' + sd]     = {'pivot': [sg*0.1, 0.04, 0.06], 'tip': [sg*0.1, 0.03, 0.155], 'parent': 'foot_' + sd}

# ---------------- colours: muted, as in the references ----------------
PALETTE = {
  'eye': '#1a1716', 'lip': '#b06a5e', 'freckle': '#a8694e', 'scar': '#c48a7a', 'frame': '#7d8288', 'shades': '#1d1f22',
  'belt': '#2e2622', 'buckle': '#a8925a', 'helmet': '#55603e', 'helmetD': '#3f4830', 'metal': '#9097a0',
  'trainer': '#e3ddd2', 'gum': '#a98257', 'boot': '#4e3526', 'bootD': '#35241a', 'rainboot': '#c99a3a', 'rainbootD': '#9c7429',
  'sole': '#262321', 'lace': '#ece6da', 'pack': '#6f5a43', 'packD': '#54442f', 'roll': '#5f6e78', 'denimRoll': '#6c84a6'
}
SLOTS = {
  'SKIN':  ['#f0d6c4', '#e2b89c', '#c4906c', '#946446', '#5f3f2c'],
  'HAIR':  ['#1d1a19', '#4a3527', '#7b3b25', '#c8a467', '#9a9792'],
  'SHIRT': 'player colour', 'PANTS': 'player colour', 'ACC': 'player second colour'
}

# ---------------- head ----------------
HEAD_ANG = [0, 35, 58, 122, 145, 180, 235, 305]   # a wide flat face between 58 and 122 degrees
HEAD = [(1.505, 0.042, 0.038, 0.058), (1.56, 0.092, 0.09, 0.02), (1.645, 0.104, 0.106, 0.0), (1.735, 0.09, 0.1, -0.01), (1.778, 0.04, 0.05, -0.016)]
SIN58 = math.sin(math.radians(58))
def faceZ(y):
    a, b, oz = interp(HEAD, y); return oz + b*SIN58
def head_rings(y0, y1, grow=0.0, scale=1.0, extra=()):
    rows = [r for r in HEAD if y0 <= r[0] <= y1]
    if not rows or rows[0][0] > y0 + 1e-6: rows = [(y0, *interp(HEAD, y0))] + rows
    if rows[-1][0] < y1 - 1e-6: rows = rows + [(y1, *interp(HEAD, y1))]
    return [[0, y, oz, a*scale + grow, b*scale + grow] for (y, a, b, oz) in rows] + list(extra)
FN = (0, 0, 1)
def on_face(pts, lift=0.002):
    return [(x, y, faceZ(y) + lift) for x, y in pts]

def head_base(fem):
    ears = [loft([[sg*0.1, 1.625, -0.005, 0.022, 0.03], [sg*0.117, 1.622, -0.008, 0.018, 0.026]], 'SKIN', n=6, ax='x') for sg in (1, -1)]
    nz = faceZ(1.6)
    nose = poly([(0, 1.656, faceZ(1.656) - 0.003), (-0.017, 1.598, nz), (0.017, 1.598, nz), (0, 1.604, nz + (0.026 if fem else 0.032))],
                [[0, 1, 3], [0, 3, 2], [1, 2, 3], [0, 2, 1]], 'SKIN')
    skull = loft(head_rings(1.505, 1.778), 'SKIN', ang=HEAD_ANG)
    neck = loft([[0, 1.43, 0, 0.046 if fem else 0.05, 0.045], [0, 1.53, 0.005, 0.042 if fem else 0.046, 0.042]], 'SKIN', n=6)
    return {'Head': [skull, nose] + ears, 'neck_01': [neck]}
def eyes(h=0.016, y=1.638):
    out = []
    for sg in (1, -1):
        x = sg*0.036
        pts = [(x - 0.016, y), (x - 0.008, y + h*0.55), (x + 0.008, y + h*0.5), (x + 0.016, y + h*0.05), (x + 0.008, y - h*0.45), (x - 0.008, y - h*0.45)]
        out.append(decal(on_face(pts, 0.002), 'eye', FN))
    return out
def brows(y=1.668, tilt=0.0, col='HAIR_D'):
    out = []
    for sg in (1, -1):
        x0, x1 = sg*0.02, sg*0.056
        out.append(decal(on_face([(x0, y - 0.004), (x1, y - 0.004 - tilt), (x1, y + 0.003 - tilt), (x0, y + 0.005)], 0.0025), col, FN))
    return out
def lips(y=1.566, w=0.022):
    return [decal(on_face([(-w, y), (-w*0.45, y + 0.006), (w*0.45, y + 0.006), (w, y), (w*0.45, y - 0.006), (-w*0.45, y - 0.006)], 0.006), 'lip', FN)]

# ---------------- body proportions ----------------
def torso_tables(fem):
    if fem:
        return [(0.95, 0.16, 0.112, 0), (1.14, 0.13, 0.098, 0), (1.36, 0.165, 0.112, 0.006), (1.44, 0.07, 0.064, -0.005)]
    return [(0.95, 0.16, 0.11, 0), (1.14, 0.152, 0.106, 0), (1.38, 0.19, 0.114, 0), (1.45, 0.078, 0.068, -0.005)]
def torso_rings(fem, y0, y1, g):
    T = torso_tables(fem); rows = [r for r in T if y0 <= r[0] <= y1]
    if not rows or rows[0][0] > y0 + 1e-6: rows = [(y0, *interp(T, y0))] + rows
    if rows[-1][0] < y1 - 1e-6: rows = rows + [(y1, *interp(T, y1))]
    return [[0, y, oz, a + g, b + g] for (y, a, b, oz) in rows]
def torso(fem, col, g=0.0, belly=None, top=1.45):
    return {'spine_01': [loft(torso_rings(fem, 0.95, 1.14, g), belly or col, n=6, rot=0, caps=[True, False])],
            'spine_03': [loft(torso_rings(fem, 1.14, top, g), col, n=6, rot=0, caps=[False, True])]}
def band(fem, y, h, g, col, bone=None):
    bone = bone or ('spine_01' if y < 1.14 else 'spine_03')
    return {bone: [loft(torso_rings(fem, y, y + h, g + 0.004), col, n=6, rot=0, caps=[False, False])]}
def front(fem, y):
    a, b, oz = interp(torso_tables(fem), y); return oz + b*0.866, a*0.5
def back(fem, y):
    a, b, oz = interp(torso_tables(fem), y); return oz - b*0.866
ARM_UP = [(0.182, 1.402, 0, 0.05, 0.054), (0.208, 1.135, -0.01, 0.04, 0.042)]
ARM_LO = [(0.208, 1.135, -0.01, 0.04, 0.042), (0.218, 0.875, 0.02, 0.028, 0.03)]
def arm_rings(rings, sg, fem, g):
    k = 0.88 if fem else 1.0
    return [[sg*x, y, z, a*k + g, b*k + g] for x, y, z, a, b in rings]
def arms(fem, upper, lower, short=False, cuff=None, g=0.01):
    def f(sg, sd):
        if short:
            sl = arm_rings(ARM_UP[:2], sg, fem, g + 0.012); sl[1][1] = 1.275
            up = [loft(arm_rings(ARM_UP, sg, fem, 0), 'SKIN', n=6), loft(sl, upper, n=6, caps=[True, False])]
        else:
            up = [loft(arm_rings(ARM_UP, sg, fem, g), upper, n=6)]
        lo = [loft(arm_rings(ARM_LO, sg, fem, 0 if lower == 'SKIN' else g), lower, n=6)]
        if cuff:
            w = arm_rings(ARM_LO, sg, fem, g + 0.008); f = 0.885
            w[0] = [w[0][j] + (w[1][j] - w[0][j])*f for j in range(5)]
            lo.append(loft(w, cuff, n=6, caps=[False, False]))
        return {'upperarm_' + sd: up, 'lowerarm_' + sd: lo}
    return sided(f)
def hands():
    def f(sg, sd):
        palm = loft([[sg*0.219, 0.875, 0.022, 0.032, 0.04], [sg*0.222, 0.79, 0.03, 0.03, 0.056], [sg*0.222, 0.71, 0.03, 0.016, 0.03]], 'SKIN', n=4)
        return {'hand_' + sd: [palm]}
    return sided(f)

THIGH = [(0.092, 0.96, 0, 0.082, 0.086), (0.1, 0.52, 0, 0.055, 0.06)]
CALF = [(0.1, 0.52, 0, 0.055, 0.06), (0.1, 0.09, -0.015, 0.032, 0.036)]
def leg_rings(rings, sg, fem, g, y0=None, y1=None):
    k = (1.04, 0.95) if fem else (1.0, 1.0)
    out = []
    for i, (x, y, z, a, b) in enumerate(rings):
        kk = k[0] if rings is THIGH and i == 0 else k[1]
        out.append([sg*x, y, z, a*kk + g, b*kk + g])
    if y0 is not None or y1 is not None:
        ys = [r[1] for r in out]
        def at(y):
            for r0, r1 in zip(out, out[1:]):
                if r1[1] <= y <= r0[1]:
                    f = (r0[1] - y)/(r0[1] - r1[1]); return [r0[j] + (r1[j] - r0[j])*f for j in range(5)]
            return out[-1] if y < ys[-1] else out[0]
        hi = y0 if y0 is not None else ys[0]; lo = y1 if y1 is not None else ys[-1]
        out = [at(hi)] + [r for r in out if lo < r[1] < hi] + [at(lo)]
    return out

# ---------------- tops ----------------
def tops(fem):
    T = {}
    nz, nw = front(fem, 1.43)
    neckline = {'spine_03': [decal([(-0.04, 1.452, nz - 0.03), (0.04, 1.452, nz - 0.03), (0.0, 1.415, nz + 0.004)], 'SKIN', (0, 0.3, 1))]}
    tee = merge(torso(fem, 'SHIRT', 0.006), arms(fem, 'SHIRT', 'SKIN', short=True), band(fem, 0.95, 0.025, 0.012, 'SHIRT_D'), neckline)
    T['tshirt'] = tee
    T['striped_tee'] = merge(tee, *[band(fem, y, 0.034, 0.006, 'ACC') for y in (1.04, 1.2, 1.32)])
    def vstripe(x, col):
        out = {}
        for bone, y0, y1 in (('spine_01', 0.96, 1.14), ('spine_03', 1.14, 1.38)):
            z0, _ = front(fem, y0); z1, _ = front(fem, y1)
            out[bone] = [decal([(x - 0.012, y0, z0 + 0.012), (x + 0.012, y0, z0 + 0.012), (x + 0.012, y1, z1 + 0.012), (x - 0.012, y1, z1 + 0.012)], col, FN)]
        return out
    collar = {'spine_03': [decal([(sg*0.012, 1.45, nz - 0.01), (sg*0.07, 1.44, nz - 0.03), (sg*0.03, 1.395, nz + 0.012)], 'SHIRT_D', (0, 0.3, 1)) for sg in (1, -1)]}
    placket = vstripe(0.0, 'SHIRT_D')
    T['flannel_shirt'] = merge(torso(fem, 'SHIRT', 0.008), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D'),
                               *[band(fem, y, 0.034, 0.008, 'ACC') for y in (1.06, 1.28)], vstripe(0.05, 'ACC'), vstripe(-0.05, 'ACC'), collar)
    dots = []
    for x, y in ((-0.05, 1.33), (0.04, 1.36), (0.02, 1.27), (-0.03, 1.2), (0.05, 1.18), (-0.04, 1.06), (0.03, 1.02)):
        z, _ = front(fem, y); dots.append((('spine_01' if y < 1.14 else 'spine_03'), decal([(x - 0.012, y - 0.012, z + 0.012), (x + 0.012, y - 0.012, z + 0.012), (x + 0.012, y + 0.012, z + 0.012), (x - 0.012, y + 0.012, z + 0.012)], 'ACC', FN)))
    for x, y in ((0.04, 1.3), (-0.05, 1.22), (0.02, 1.05)):
        z = back(fem, y); dots.append((('spine_01' if y < 1.14 else 'spine_03'), decal([(x - 0.012, y - 0.012, z - 0.012), (x + 0.012, y - 0.012, z - 0.012), (x + 0.012, y + 0.012, z - 0.012), (x - 0.012, y + 0.012, z - 0.012)], 'ACC', (0, 0, -1))))
    sp = {}
    for b, d in dots: sp.setdefault(b, []).append(d)
    T['spotted_top'] = merge(tee, sp)
    hood = {'spine_03': [loft([[0, 1.38, -0.03, 0.135, 0.11], [0, 1.45, -0.05, 0.125, 0.115], [0, 1.5, -0.07, 0.09, 0.09]], 'SHIRT_D',
                              ang=[195, 225, 255, 285, 315, 345], closed=False, both=True, cin='SHIRT')]}
    pz, _ = front(fem, 1.04)
    pocket = {'spine_01': [decal([(-0.085, 1.0, pz + 0.022), (0.085, 1.0, pz + 0.022), (0.065, 1.09, pz + 0.02), (-0.065, 1.09, pz + 0.02)], 'SHIRT_D', FN)]}
    cz, _ = front(fem, 1.36)
    strings = {'spine_03': [decal([(x - 0.004, 1.42, cz + 0.016), (x + 0.004, 1.42, cz + 0.016), (x + 0.004, 1.33, cz + 0.022), (x - 0.004, 1.33, cz + 0.022)], 'ACC', FN) for x in (-0.03, 0.03)]}
    T['hoodie'] = merge(torso(fem, 'SHIRT', 0.018), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D', g=0.016), band(fem, 0.95, 0.035, 0.022, 'SHIRT_D'), hood, pocket, strings)
    inner = {}
    for bone, y0, y1 in (('spine_01', 0.96, 1.14), ('spine_03', 1.14, 1.44)):
        z0, _ = front(fem, y0); z1, _ = front(fem, y1)
        w0, w1 = 0.035, (0.05 if bone == 'spine_03' else 0.035)
        inner[bone] = [decal([(-w0, y0, z0 + 0.019), (w0, y0, z0 + 0.019), (w1, y1, z1 + 0.019), (-w1, y1, z1 + 0.019)], 'ACC', FN)]
    lz, _ = front(fem, 1.32)
    lapels = {'spine_03': [decal([(sg*0.05, 1.44, lz + 0.006), (sg*0.1, 1.4, lz + 0.016), (sg*0.06, 1.25, lz + 0.022), (sg*0.04, 1.3, lz + 0.022)], 'SHIRT_D', FN) for sg in (1, -1)]}
    hem = {'spine_01': [loft([[0, 0.93, 0.004, 0.18, 0.13], [0, 0.99, 0.002, 0.176, 0.126]], 'SHIRT', n=6, rot=0, caps=[False, False])]}
    T['open_jacket'] = merge(torso(fem, 'SHIRT', 0.016), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D', g=0.016), inner, lapels, hem)
    T['jumper'] = merge(torso(fem, 'SHIRT', 0.014), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D', g=0.014), band(fem, 0.95, 0.04, 0.02, 'SHIRT_D'),
                        band(fem, 1.43, 0.025, 0.004, 'SHIRT_D', 'spine_03'), band(fem, 1.27, 0.05, 0.016, 'ACC'))
    bz, _ = front(fem, 1.3)
    bib = {'spine_03': [decal([(-0.075, 1.16, front(fem, 1.16)[0] + 0.018), (0.075, 1.16, front(fem, 1.16)[0] + 0.018), (0.07, 1.33, bz + 0.018), (-0.07, 1.33, bz + 0.018)], 'PANTS', FN)]
                       + [decal([(sg*0.045, 1.33, bz + 0.019), (sg*0.07, 1.33, bz + 0.019), (sg*0.1, 1.44, front(fem, 1.44)[0] + 0.03), (sg*0.08, 1.45, front(fem, 1.44)[0] + 0.03)], 'PANTS', FN) for sg in (1, -1)]
                       + [decal([(sg*0.05, 1.18, back(fem, 1.18) - 0.012), (sg*0.075, 1.18, back(fem, 1.18) - 0.012), (sg*0.1, 1.42, back(fem, 1.42) - 0.012), (sg*0.08, 1.43, back(fem, 1.42) - 0.012)], 'PANTS', (0, 0, -1)) for sg in (1, -1)]}
    T['dungarees'] = merge(torso(fem, 'ACC', 0.006, belly='PANTS'), arms(fem, 'ACC', 'SKIN', short=True), bib, neckline)
    return T

# ---------------- bottoms ----------------
def bottoms(fem):
    hipT = [(0.86, 0.13, 0.095, 0), (0.98, 0.162, 0.112, 0)]
    if fem: hipT = [(0.86, 0.138, 0.098, 0), (0.98, 0.166, 0.114, 0)]
    def pelvis(col):
        rings = [[0, y, oz, a + 0.006, b + 0.006] for y, a, b, oz in hipT]
        bz = hipT[-1][2] + 0.006
        return {'pelvis': [loft(rings, col, n=6, rot=0), loft([[0, 0.955, 0, hipT[-1][1] + 0.012, hipT[-1][2] + 0.012], [0, 0.985, 0, hipT[-1][1] + 0.012, hipT[-1][2] + 0.012]], 'belt', n=6, rot=0, caps=[False, False]),
                           decal([(-0.02, 0.957, bz*0.866 + 0.013), (0.02, 0.957, bz*0.866 + 0.013), (0.02, 0.983, bz*0.866 + 0.013), (-0.02, 0.983, bz*0.866 + 0.013)], 'buckle', FN)]}
    def legs(col, g=0.012, calf_to=None, thigh_to=None, cuff=None, flare=0.0):
        def f(sg, sd):
            o = {}
            if thigh_to:
                t = leg_rings(THIGH, sg, fem, g + 0.008, y1=thigh_to); t[-1][3] += 0.012; t[-1][4] += 0.012
                o['thigh_' + sd] = [loft(t, col, n=6, caps=[True, False]), loft(leg_rings(THIGH, sg, fem, 0), 'SKIN', n=6)]
                o['calf_' + sd] = [loft(leg_rings(CALF, sg, fem, 0), 'SKIN', n=6)]
                return o
            o['thigh_' + sd] = [loft(leg_rings(THIGH, sg, fem, g), col, n=6)]
            if calf_to:
                c = leg_rings(CALF, sg, fem, g, y1=calf_to)
                o['calf_' + sd] = [loft(c, col, n=6, caps=[True, False]), loft(leg_rings(CALF, sg, fem, 0), 'SKIN', n=6)]
            else:
                c = leg_rings(CALF, sg, fem, g); c[-1][3] += flare; c[-1][4] += flare
                o['calf_' + sd] = [loft(c, col, n=6)]
            if cuff:
                y0, y1, cc = cuff; r = leg_rings(CALF, sg, fem, g + 0.01, y0=y0, y1=y1)
                o['calf_' + sd].append(loft(r, cc, n=6, caps=[False, False]))
            return o
        return sided(f)
    bk = lambda y: -(hipT[0][2] + (hipT[1][2] - hipT[0][2])*(y - 0.86)/0.12 + 0.006)*0.866 - 0.004
    pk = {'pelvis': [decal([(x - 0.035, 0.89, bk(0.89)), (x + 0.035, 0.89, bk(0.89)), (x + 0.03, 0.95, bk(0.95)), (x - 0.03, 0.95, bk(0.95))], 'PANTS_D', (0, 0, -1)) for x in (-0.07, 0.07)]}
    def side_stripe(rings, sg, col, w=0.012):
        out = []
        for r0, r1 in zip(rings, rings[1:]):
            x0 = r0[0] + sg*r0[3]*0.866 + sg*0.002; x1 = r1[0] + sg*r1[3]*0.866 + sg*0.002
            out.append(decal([(x0, r0[1], r0[2] - w), (x0, r0[1], r0[2] + w), (x1, r1[1], r1[2] + w), (x1, r1[1], r1[2] - w)], col, (sg, 0, 0)))
        return out
    B = {}
    B['jeans'] = merge(pelvis('PANTS'), legs('PANTS', flare=0.006), pk)
    B['shorts'] = merge(pelvis('PANTS'), legs('PANTS', thigh_to=0.7), pk)
    B['cargo_trousers'] = merge(pelvis('PANTS'), legs('PANTS', g=0.016), sided(lambda sg, sd: {'thigh_' + sd: [box([sg*0.18, 0.66, 0.0], [0.03, 0.1, 0.08], 'PANTS_D')]}))
    B['capri_trousers'] = merge(pelvis('PANTS'), legs('PANTS', calf_to=0.3), pk)
    B['track_pants'] = merge(pelvis('PANTS'), legs('PANTS', g=0.016, cuff=(0.16, 0.1, 'PANTS_D')),
                             sided(lambda sg, sd: {'thigh_' + sd: side_stripe(leg_rings(THIGH, sg, fem, 0.016), sg, 'ACC'),
                                                   'calf_' + sd: side_stripe(leg_rings(CALF, sg, fem, 0.016, y0=0.52, y1=0.17), sg, 'ACC')}))
    B['rolled_jeans'] = merge(pelvis('PANTS'), legs('PANTS', cuff=(0.16, 0.11, 'denimRoll')), pk)
    return B

# ---------------- shoes ----------------
def shoes():
    def base(col, sole, sg, sd):
        x = sg*0.1
        return {'foot_' + sd: [loft([[x, 0.058, -0.065, 0.06, 0.068], [x, 0.054, 0.04, 0.068, 0.07]], col, ax='z', n=4),
                               box([x, 0.012, 0.045], [0.1, 0.024, 0.235], sole)],
                'ball_' + sd: [loft([[x, 0.054, 0.04, 0.068, 0.07], [x, 0.036, 0.16, 0.058, 0.04]], col, ax='z', n=4, caps=[False, True])]}
    S = {}
    def trainer(sg, sd):
        xo = sg*0.1 + sg*(0.068*0.707 + 0.003)
        return merge(base('trainer', 'gum', sg, sd), {
            'foot_' + sd: [decal([(xo, 0.03, -0.04), (xo, 0.03, 0.04), (xo, 0.065, 0.025), (xo, 0.065, -0.03)], 'ACC', (sg, 0, 0))],
            'ball_' + sd: [decal([(sg*0.1 - 0.018, 0.106, 0.04), (sg*0.1 + 0.018, 0.106, 0.04), (sg*0.1 + 0.015, 0.09, 0.1), (sg*0.1 - 0.015, 0.09, 0.1)], 'lace', (0, 1, 0.3))]})
    S['trainers'] = sided(trainer)
    S['boots'] = sided(lambda sg, sd: merge(base('boot', 'sole', sg, sd), {
        'calf_' + sd: [loft([[sg*0.1, 0.07, -0.014, 0.05, 0.054], [sg*0.1, 0.2, -0.013, 0.046, 0.05]], 'boot', n=6),
                       loft([[sg*0.1, 0.19, -0.013, 0.052, 0.056], [sg*0.1, 0.215, -0.013, 0.052, 0.056]], 'bootD', n=6, caps=[False, True])]}))
    S['rain_boots'] = sided(lambda sg, sd: merge(base('rainboot', 'sole', sg, sd), {
        'calf_' + sd: [loft([[sg*0.1, 0.07, -0.014, 0.054, 0.058], [sg*0.1, 0.34, -0.012, 0.06, 0.064]], 'rainboot', n=6),
                       loft([[sg*0.1, 0.33, -0.012, 0.064, 0.068], [sg*0.1, 0.355, -0.012, 0.064, 0.068]], 'rainbootD', n=6, caps=[False, True])]}))
    return S

# ---------------- faces ----------------
def octa_ring(cx, cy, r_out, r_in, col, z_of):
    segs = []
    for k in range(8):
        t0 = math.radians(22.5 + 45*k); t1 = math.radians(22.5 + 45*(k + 1))
        pts = [(cx + math.cos(t0)*r_in, cy + math.sin(t0)*r_in), (cx + math.cos(t0)*r_out, cy + math.sin(t0)*r_out),
               (cx + math.cos(t1)*r_out, cy + math.sin(t1)*r_out), (cx + math.cos(t1)*r_in, cy + math.sin(t1)*r_in)]
        segs.append(decal([(x, y, z_of) for x, y in pts], col, FN))
    return segs
def octa(cx, cy, r, col, z):
    return decal([(cx + math.cos(math.radians(22.5 + 45*k))*r, cy + math.sin(math.radians(22.5 + 45*k))*r, z) for k in range(8)], col, FN)
def faces():
    F = {}
    base = eyes() + brows() + lips()
    F['calm'] = base
    gz = faceZ(1.64) + 0.03
    arms_ = [box([sg*0.104, 1.648, -0.005 + (gz - 0.03)/2], [0.006, 0.006, 0.11], 'frame') for sg in (1, -1)]
    rims = octa_ring(0.036, 1.638, 0.03, 0.023, 'frame', gz) + octa_ring(-0.036, 1.638, 0.03, 0.023, 'frame', gz)
    bridge = [decal([(-0.01, 1.642, gz), (0.01, 1.642, gz), (0.01, 1.648, gz), (-0.01, 1.648, gz)], 'frame', FN)]
    side = [decal([(sg*0.064, 1.645, gz), (sg*0.1, 1.648, gz - 0.06), (sg*0.1, 1.654, gz - 0.06), (sg*0.064, 1.652, gz)], 'frame', (sg, 0, 0)) for sg in (1, -1)]
    F['glasses'] = eyes() + brows(1.674) + lips() + rims + bridge + side
    stub = loft(head_rings(1.505, 1.6, grow=0.003), 'HAIR_MIX', ang=[10, 35, 58, 90, 122, 145, 170], closed=False)
    F['stubble'] = eyes() + brows() + [stub] + lips()
    fr = []
    for x, y in ((-0.06, 1.61), (-0.05, 1.6), (-0.065, 1.598), (-0.045, 1.612), (0.06, 1.61), (0.05, 1.6), (0.065, 1.598), (0.045, 1.612), (0.0, 1.625)):
        z = faceZ(y) + 0.003; fr.append(decal([(x - 0.004, y - 0.004, z), (x + 0.004, y - 0.004, z), (x + 0.004, y + 0.004, z), (x - 0.004, y + 0.004, z)], 'freckle', FN))
    F['freckles'] = base + fr
    bags = [decal(on_face([(sg*0.022, 1.624), (sg*0.05, 1.624), (sg*0.045, 1.618), (sg*0.027, 1.618)], 0.003), 'SKIN_D', FN) for sg in (1, -1)]
    F['tired'] = eyes(0.01, 1.636) + brows(1.664, tilt=0.005) + bags + lips(1.565, 0.018)
    my = 1.584; mz = faceZ(my)
    moust = poly([(-0.035, my - 0.012, mz + 0.004), (0.035, my - 0.012, mz + 0.004), (0.022, my + 0.008, mz + 0.008), (-0.022, my + 0.008, mz + 0.008),
                  (-0.03, my - 0.008, mz + 0.016), (0.03, my - 0.008, mz + 0.016), (0.018, my + 0.006, mz + 0.016), (-0.018, my + 0.006, mz + 0.016)],
                 [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], 'HAIR_D')
    F['moustache'] = eyes() + brows() + lips() + [moust]
    F['dark_glasses'] = brows(1.674) + lips() + [octa(0.036, 1.638, 0.026, 'shades', gz - 0.001), octa(-0.036, 1.638, 0.026, 'shades', gz - 0.001)] + rims + bridge + side
    F['scar'] = base + [decal(on_face([(0.03, 1.69), (0.036, 1.69), (0.06, 1.615), (0.054, 1.615)], 0.004), 'scar', FN)]
    return F

# ---------------- hair (chunky masses, blunt cuts) ----------------
BACK = [122, 145, 180, 235, 305, 360, 395, 418]           # sides and back, the face left open
def cap_shell(grow, y0=1.7, col='HAIR'):
    return loft(head_rings(y0, 1.778, grow=grow), col, ang=HEAD_ANG, caps=[False, True])
def back_shell(grow, y0, y1, col='HAIR'):
    return loft(head_rings(y0, y1, grow=grow), col, ang=BACK, closed=False, both=True, cin='HAIR_D')
def hair():
    H = {'none': []}
    H['buzzed'] = hide([cap_shell(0.006, 1.698)]) + [back_shell(0.006, 1.6, 1.645)] + hide([back_shell(0.006, 1.645, 1.7)])
    fr = loft([[0, 1.692, 0.008, 0.11, 0.136], [0, 1.722, -0.002, 0.11, 0.126], [0, 1.75, -0.012, 0.094, 0.112]], 'HAIR',
              ang=[48, 66, 90, 114, 132], closed=False, both=True, cin='HAIR_D')
    nape = loft(head_rings(1.575, 1.625, grow=0.014), 'HAIR', ang=[150, 180, 235, 305, 360, 390], closed=False, both=True, cin='HAIR_D')
    sides = lambda y0, y1: loft(head_rings(y0, y1, grow=0.016), 'HAIR', ang=[172, 205, 235, 270, 305, 335, 368], closed=False, both=True, cin='HAIR_D')
    H['short'] = hide([cap_shell(0.02, 1.69), fr, sides(1.655, 1.69)]) + [sides(1.625, 1.655), nape]
    bob_lo = loft([[0, 1.525, -0.012, 0.13, 0.124], [0, 1.6, -0.012, 0.134, 0.13], [0, 1.648, -0.012, 0.132, 0.131]], 'HAIR', ang=[116] + BACK[1:-1] + [424], closed=False, both=True, cin='HAIR_D')
    bob_hi = loft([[0, 1.648, -0.012, 0.132, 0.131], [0, 1.7, -0.012, 0.128, 0.13]], 'HAIR', ang=[116] + BACK[1:-1] + [424], closed=False, both=True, cin='HAIR_D')
    dome = loft([[0, 1.695, -0.01, 0.128, 0.13], [0, 1.75, -0.013, 0.11, 0.118], [0, 1.79, -0.016, 0.06, 0.07]], 'HAIR', ang=HEAD_ANG, caps=[False, True])
    bang = loft([[0, 1.678, 0.012, 0.122, 0.148], [0, 1.712, 0.002, 0.124, 0.138], [0, 1.75, -0.01, 0.108, 0.122]], 'HAIR',
                ang=[46, 64, 80, 100, 116, 134], closed=False, both=True, cin='HAIR_D')
    H['bob'] = [bob_lo] + hide([bob_hi, dome, bang])
    buns = [loft([[sg*0.07, 1.765, -0.05, 0.03, 0.03], [sg*0.07, 1.8, -0.055, 0.045, 0.045], [sg*0.07, 1.84, -0.06, 0.025, 0.025]], 'HAIR') for sg in (1, -1)]
    H['buns'] = H['buzzed'] + hide(buns)
    beard = loft(head_rings(1.5, 1.6, grow=0.012) + [], 'HAIR', ang=[-12, 20, 50, 90, 130, 160, 192], closed=False, both=True, cin='HAIR_D')
    my = 1.584; mz = faceZ(my)
    mo = poly([(-0.04, my - 0.01, mz + 0.006), (0.04, my - 0.01, mz + 0.006), (0.025, my + 0.01, mz + 0.008), (-0.025, my + 0.01, mz + 0.008),
               (-0.034, my - 0.008, mz + 0.02), (0.034, my - 0.008, mz + 0.02), (0.02, my + 0.007, mz + 0.018), (-0.02, my + 0.007, mz + 0.018)],
              [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], 'HAIR')
    H['beard'] = H['buzzed'] + [beard, mo]
    return H

# ---------------- hats ----------------
def hats():
    H = {'none': []}
    H['beanie'] = [loft([[0, 1.655, -0.01, 0.118, 0.122], [0, 1.72, -0.01, 0.12, 0.125], [0, 1.79, -0.012, 0.097, 0.107], [0, 1.828, -0.014, 0.046, 0.056]], 'ACC', ang=HEAD_ANG, caps=[False, True]),
                   loft([[0, 1.643, -0.01, 0.126, 0.13], [0, 1.69, -0.01, 0.127, 0.132]], 'ACC_D', ang=HEAD_ANG, caps=[False, False])]
    by, bz = 1.69, faceZ(1.69)
    brim = poly([(-0.09, by, bz - 0.02), (0.09, by, bz - 0.02), (0.08, by - 0.014, bz + 0.09), (-0.08, by - 0.014, bz + 0.09),
                 (-0.09, by + 0.008, bz - 0.02), (0.09, by + 0.008, bz - 0.02), (0.08, by - 0.006, bz + 0.09), (-0.08, by - 0.006, bz + 0.09)],
                [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], 'ACC_D')
    H['cap'] = [loft([[0, 1.68, -0.01, 0.116, 0.12], [0, 1.75, -0.012, 0.106, 0.114], [0, 1.795, -0.015, 0.06, 0.07]], 'ACC', ang=HEAD_ANG, caps=[False, True]), brim]
    H['helmet'] = [loft([[0, 1.66, -0.01, 0.13, 0.135], [0, 1.73, -0.012, 0.13, 0.135], [0, 1.8, -0.014, 0.1, 0.108], [0, 1.835, -0.016, 0.05, 0.058]], 'helmet', caps=[False, True]),
                   loft([[0, 1.652, -0.01, 0.142, 0.147], [0, 1.668, -0.01, 0.142, 0.147]], 'helmetD')]
    return H

def gear():
    return {'backpack': {'spine_03': [loft([[0, 1.0, -0.2, 0.13, 0.07], [0, 1.25, -0.205, 0.135, 0.075], [0, 1.38, -0.19, 0.12, 0.065]], 'pack', n=6),
                                      loft([[0, 1.03, -0.27, 0.09, 0.025], [0, 1.15, -0.27, 0.09, 0.025]], 'packD', n=6),
                                      loft([[0.15, 1.42, -0.19, 0.055, 0.055], [-0.15, 1.42, -0.19, 0.055, 0.055]], 'roll', ax='x'),
                                      decal([(0.06, 1.42, 0.115), (0.09, 1.42, 0.108), (0.085, 1.15, 0.115), (0.06, 1.15, 0.118)], 'packD', FN),
                                      decal([(-0.06, 1.42, 0.115), (-0.09, 1.42, 0.108), (-0.085, 1.15, 0.115), (-0.06, 1.15, 0.118)], 'packD', FN)]}}

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
  'name': 'survivor', 'version': 2, 'style': 'faceted low-poly (13 October 2026 references)',
  'about': 'Every character creator choice as faceted pieces, grouped by skeleton bone. See docs/SHAPED.md.',
  'units': 'metres', 'facing': '+Z', 'left': '+X', 'height': 1.78,
  'bones': BONES, 'palette': PALETTE, 'slots': SLOTS,
  'darker': 0.78, 'mix': 0.55,
  'colourRule': 'A slot ending in _D is that colour times darker. HAIR_MIX is SKIN blended towards HAIR by mix (stubble).',
  'hatRule': 'When a hat is worn, leave out pieces marked hat:"hide" (the hat covers them).',
  'builds': {'slim': [0.9, 0.93], 'average': [1, 1], 'broad': [1.12, 1.06]},
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
