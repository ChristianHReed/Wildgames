#!/usr/bin/env python3
"""Afterstreet survivor pack, version 4 (13 October 2026). Built from scratch on the user's latest references
(lean wanderers with tall packs, a capped girl in a bulky sweater and gloves, painterly survivors in Somerville's style).
Every character creator choice as faceted pieces, grouped by skeleton bone. Writes assets/shaped/survivor.js.
Run: python3 assets/shaped/src/survivor.py

Shape language: tall, lean adults (1.80 m) with a small angular head (about an eighth of the height); minimal faces
(short eye slits, strong brows, a small wedge nose); sweaters and jackets as big angular volumes; rolled sleeves;
long thin arms with paddle hands; slim trousers tapering to the ankle; chunky ankle boots; chunky swept or straight
hair; muted teal, navy, rust, mustard and plum. Flat-shaded planes, no textures.
Coordinates: metres, reference pose standing with arms down, facing +Z, the survivor's left is +X.
Each bone lists its pivot (joint) and tip (next joint) so the game can fit the pieces to its own skeleton."""
import json, os, math

R4 = lambda v: round(v, 4)
def centre(pts): return [sum(p[i] for p in pts)/len(pts) for i in range(3)]
def loft(rings, c, n=None, ang=None, ax='y', **k):
    """rings: absolute [x, y, z, a, b]"""
    p = centre([r[:3] for r in rings])
    o = {'s': 'loft', 'p': [R4(v) for v in p], 'r': [[R4(r[0]-p[0]), R4(r[1]-p[1]), R4(r[2]-p[2]), R4(r[3]), R4(r[4])] for r in rings], 'c': c}
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
def at(table, y):
    if y <= table[0][0]: return table[0][1:]
    for (y0, *v0), (y1, *v1) in zip(table, table[1:]):
        if y0 <= y <= y1:
            f = (y - y0)/(y1 - y0); return tuple(a + (b - a)*f for a, b in zip(v0, v1))
    return table[-1][1:]
def span(table, y0, y1, g=0.0):
    rows = [r for r in table if y0 < r[0] < y1]
    rows = [(y0, *at(table, y0))] + rows + [(y1, *at(table, y1))]
    return [[0, y, oz, a + g, b + g] for (y, a, b, oz) in rows]
def mix(r0, r1, f): return [r0[j] + (r1[j] - r0[j])*f for j in range(5)]
def under_hat(pieces):
    for q in pieces: q['hat'] = 'hide'
    return pieces
FRONT = (0, 0, 1); BACKN = (0, 0, -1)

# ================= skeleton (1.80 m) =================
BONES = {
  'pelvis':   {'pivot': [0, 0.98, 0], 'tip': [0, 1.06, 0]},
  'spine_01': {'pivot': [0, 1.06, 0], 'tip': [0, 1.18, 0], 'parent': 'pelvis'},
  'spine_02': {'pivot': [0, 1.18, 0], 'tip': [0, 1.32, 0], 'parent': 'spine_01'},
  'spine_03': {'pivot': [0, 1.32, 0], 'tip': [0, 1.49, 0], 'parent': 'spine_02'},
  'neck_01':  {'pivot': [0, 1.49, 0], 'tip': [0, 1.57, 0.01], 'parent': 'spine_03'},
  'Head':     {'pivot': [0, 1.57, 0.01], 'tip': [0, 1.80, 0], 'parent': 'neck_01'},
}
for sg, sd in ((1, 'l'), (-1, 'r')):
    BONES['upperarm_' + sd] = {'pivot': [sg*0.19, 1.465, -0.005], 'tip': [sg*0.215, 1.17, -0.02], 'parent': 'spine_03'}
    BONES['lowerarm_' + sd] = {'pivot': [sg*0.215, 1.17, -0.02], 'tip': [sg*0.225, 0.905, 0.01], 'parent': 'upperarm_' + sd}
    BONES['hand_' + sd]     = {'pivot': [sg*0.225, 0.905, 0.01], 'tip': [sg*0.228, 0.78, 0.02], 'parent': 'lowerarm_' + sd}
    BONES['thigh_' + sd]    = {'pivot': [sg*0.085, 0.96, 0], 'tip': [sg*0.09, 0.52, 0.005], 'parent': 'pelvis'}
    BONES['calf_' + sd]     = {'pivot': [sg*0.09, 0.52, 0.005], 'tip': [sg*0.092, 0.09, -0.02], 'parent': 'thigh_' + sd}
    BONES['foot_' + sd]     = {'pivot': [sg*0.092, 0.09, -0.02], 'tip': [sg*0.092, 0.035, 0.07], 'parent': 'calf_' + sd}
    BONES['ball_' + sd]     = {'pivot': [sg*0.092, 0.035, 0.07], 'tip': [sg*0.092, 0.03, 0.15], 'parent': 'foot_' + sd}

PALETTE = {
  'eye': '#1e1b1b', 'lip': '#8e5048', 'frame': '#b04a3a', 'shades': '#1c1d20', 'freckle': '#a8694e', 'scar': '#c48a7a',
  'helmet': '#55603e', 'helmetD': '#3f4830', 'metal': '#8f969e', 'belt': '#26201c',
  'trainer': '#5b5f66', 'trainerSole': '#e6e1d7', 'boot': '#3f2a22', 'bootD': '#2a1c17', 'rainboot': '#c99a3a', 'rainbootD': '#9c7429',
  'sole': '#1f1c1a', 'lace': '#d8d3c9', 'pack': '#7a5536', 'packD': '#5a3d27', 'strap': '#2b2d3a', 'roll': '#a8843c', 'mat': '#2c2f3a',
  'glove': '#3d2a24', 'gloveD': '#2a1d19', 'denimRoll': '#5f789a'
}
SLOTS = {
  'SKIN':  ['#f1d4c0', '#ddb08f', '#bf8a63', '#8e5d3e', '#5a3a28'],
  'HAIR':  ['#1c1a1a', '#4a3426', '#86412a', '#c9a46a', '#b9b6b1'],
  'SHIRT': 'player colour', 'PANTS': 'player colour', 'ACC': 'player second colour'
}

# ================= head: small and angular, minimal face =================
HEAD_ANG = [0, 38, 62, 118, 142, 180, 232, 308]
HEAD = [(1.565, 0.026, 0.028, 0.052), (1.6, 0.068, 0.07, 0.026), (1.655, 0.084, 0.088, 0.006), (1.71, 0.088, 0.092, -0.004),
        (1.765, 0.073, 0.083, -0.014), (1.795, 0.03, 0.04, -0.02)]
SIN62 = math.sin(math.radians(62))
def face_z(y):
    a, b, oz = at(HEAD, y); return oz + b*SIN62
def on_face(pts, lift=0.0015): return [(x, y, face_z(y) + lift) for x, y in pts]
EYE_Y, BROW_Y, MOUTH_Y = 1.686, 1.703, 1.62
def head(fem):
    skull = loft(span(HEAD, 1.565, 1.795), 'SKIN', ang=HEAD_ANG)
    nz = face_z(1.65)
    nose = solid([(0, 1.697, face_z(1.697) - 0.002), (-0.011, 1.648, nz), (0.011, 1.648, nz), (0, 1.652, nz + (0.018 if fem else 0.022))],
                 [[0, 1, 3], [0, 3, 2], [1, 2, 3], [0, 2, 1]], 'SKIN')
    ears = [loft([[sg*0.085, 1.672, -0.012, 0.016, 0.022], [sg*0.097, 1.67, -0.014, 0.012, 0.017]], 'SKIN', n=5, ax='x') for sg in (1, -1)]
    neck = loft([[0, 1.47, 0, 0.04, 0.038], [0, 1.575, 0.008, 0.035, 0.033]], 'SKIN', n=6)
    return {'Head': [skull, nose] + ears, 'neck_01': [neck]}
def eyes(h=0.005, y=EYE_Y, w=0.011):
    return [flat(on_face([(sg*0.029 - w, y - h*0.5), (sg*0.029 + w, y - h*0.3), (sg*0.029 + w*0.9, y + h*0.6), (sg*0.029 - w*1.05, y + h*0.4)]), 'eye') for sg in (1, -1)]
def brows(y=BROW_Y, tilt=0.0):
    return [flat(on_face([(sg*0.016, y - 0.003), (sg*0.044, y - 0.002 - tilt), (sg*0.044, y + 0.004 - tilt), (sg*0.016, y + 0.004)], 0.002), 'HAIR_D') for sg in (1, -1)]
def mouth(w=0.012, y=MOUTH_Y):
    return [flat(on_face([(-w, y - 0.0015), (w, y - 0.0015), (w*0.8, y + 0.002), (-w*0.8, y + 0.002)], 0.003), 'lip')]

# ================= body =================
HEM, SPLIT = 0.94, 1.18
def torso_table(fem):
    if fem: return [(HEM, 0.152, 0.104, 0), (1.12, 0.125, 0.09, 0), (1.32, 0.155, 0.108, 0.008), (1.43, 0.165, 0.094, -0.006), (1.48, 0.055, 0.05, -0.006)]
    return [(HEM, 0.152, 0.102, 0), (1.12, 0.142, 0.098, 0), (1.33, 0.175, 0.112, 0.004), (1.44, 0.185, 0.1, -0.008), (1.49, 0.06, 0.054, -0.006)]
def chest(fem, col, g=0.0, belly=None, hem=HEM, bulge=0.0):
    T = torso_table(fem)
    lo = span(T, HEM, SPLIT, g); lo[0][1] = hem
    hi = span(T, SPLIT, T[-1][0], g)
    if bulge:   # a bulky sweater: fuller in the middle
        for r in lo[1:] + hi[:-2]: r[3] += bulge; r[4] += bulge*0.7
    return {'spine_01': [loft(lo, belly or col, n=6, rot=0, caps=[True, False])],
            'spine_03': [loft(hi, col, n=6, rot=0, caps=[False, True])]}
def band(fem, y, h, g, col):
    return {('spine_01' if y < SPLIT else 'spine_03'): [loft(span(torso_table(fem), y, y + h, g), col, n=6, rot=0, caps=[False, False])]}
def front_z(fem, y, g=0.0):
    a, b, oz = at(torso_table(fem), y); return oz + (b + g)*0.866
def back_z(fem, y, g=0.0):
    a, b, oz = at(torso_table(fem), y); return oz - (b + g)*0.866
def on_chest(fem, pts, col, g, bone=None, n=FRONT, lift=0.004):
    z = (lambda y: front_z(fem, y, g) + lift) if n == FRONT else (lambda y: back_z(fem, y, g) - lift)
    ys = [y for _, y in pts]; bone = bone or ('spine_01' if sum(ys)/len(ys) < SPLIT else 'spine_03')
    return {bone: [flat([(x, y, z(y)) for x, y in pts], col, n)]}
UPPER = [(0.19, 1.47, -0.005, 0.042, 0.046), (0.215, 1.17, -0.02, 0.034, 0.037)]
LOWER = [(0.215, 1.17, -0.02, 0.034, 0.037), (0.225, 0.905, 0.01, 0.026, 0.028)]
def limb(rings, sg, g=0.0): return [[sg*x, y, z, a + g, b + g] for x, y, z, a, b in rings]
def sleeves(col, style='long', g=0.016, cuff=None):
    """style: 'long', 'short' (to above the elbow) or 'rolled' (rolled to mid-forearm)"""
    def f(sg, sd):
        up = limb(UPPER, sg, g); up[0][1] = 1.472
        lo = limb(LOWER, sg, g)
        if style == 'short':
            s = [up[0], mix(up[0], up[1], 0.55)]; s[1][3] += 0.01; s[1][4] += 0.01
            return {'upperarm_' + sd: [loft(limb(UPPER, sg), 'SKIN', n=5), loft(s, col, n=6, caps=[True, False])],
                    'lowerarm_' + sd: [loft(limb(LOWER, sg), 'SKIN', n=5)]}
        o = {'upperarm_' + sd: [loft(up, col, n=6)]}
        if style == 'rolled':
            cut = mix(lo[0], lo[1], 0.45)
            roll = [mix(lo[0], lo[1], 0.36), mix(lo[0], lo[1], 0.47)]
            for r in roll: r[3] += 0.012; r[4] += 0.012
            o['lowerarm_' + sd] = [loft([lo[0], cut], col, n=6, caps=[False, False]), loft(roll, cuff or col + '_D', n=6, caps=[False, False]),
                                   loft(limb(LOWER, sg), 'SKIN', n=5)]
        else:
            o['lowerarm_' + sd] = [loft(lo, col, n=6)]
            if cuff:
                c = limb(LOWER, sg, g + 0.006); c[0] = mix(c[0], c[1], 0.84)
                o['lowerarm_' + sd].append(loft(c, cuff, n=6, caps=[False, False]))
        return o
    return both_sides(f)
def hand_rings(sg, g=0.0):
    return [[sg*0.225, 0.905, 0.012, 0.026 + g, 0.032 + g], [sg*0.228, 0.83, 0.02, 0.024 + g, 0.044 + g], [sg*0.228, 0.78, 0.022, 0.012 + g, 0.026 + g]]
def hands():
    def f(sg, sd):
        th = solid([(sg*0.212, 0.875, 0.04), (sg*0.204, 0.873, 0.046), (sg*0.2, 0.832, 0.058), (sg*0.207, 0.835, 0.052)] +
                   [(sg*0.218, 0.875, 0.04), (sg*0.21, 0.873, 0.046), (sg*0.206, 0.832, 0.058), (sg*0.213, 0.835, 0.052)], HEX, 'SKIN')
        return {'hand_' + sd: [loft(hand_rings(sg), 'SKIN', n=4), th]}
    return both_sides(f)
THIGH = [(0.085, 0.98, 0, 0.068, 0.072), (0.09, 0.52, 0.005, 0.046, 0.05)]
CALF = [(0.09, 0.52, 0.005, 0.046, 0.05), (0.092, 0.09, -0.02, 0.032, 0.035)]
def cut(rings, y_hi, y_lo):
    r0, r1 = rings; f = lambda y: mix(r0, r1, (r0[1] - y)/(r0[1] - r1[1]))
    return [f(y_hi), f(y_lo)]

# ================= tops =================
def tops(fem):
    T = {}
    nz = front_z(fem, 1.47)
    neckline = {'spine_03': [flat([(-0.038, 1.478, nz - 0.03), (0.038, 1.478, nz - 0.03), (0.0, 1.445, front_z(fem, 1.445) + 0.006)], 'SKIN', (0, 0.4, 1))]}
    collar_band = band(fem, 1.465, 0.02, 0.008, 'SHIRT_D')
    tee = join(chest(fem, 'SHIRT', 0.006), sleeves('SHIRT', 'short', 0.008), neckline, collar_band)
    T['tshirt'] = tee
    T['striped_tee'] = join(tee, *[band(fem, y, 0.03, 0.01, 'ACC') for y in (1.0, 1.12, 1.24, 1.36)])
    def vline(x, col, g):
        return join(on_chest(fem, [(x - 0.01, HEM), (x + 0.01, HEM), (x + 0.01, SPLIT), (x - 0.01, SPLIT)], col, g, 'spine_01'),
                    on_chest(fem, [(x - 0.01, SPLIT), (x + 0.01, SPLIT), (x + 0.01, 1.42), (x - 0.01, 1.42)], col, g, 'spine_03'))
    collar = {'spine_03': [flat([(sg*0.01, 1.49, nz - 0.012), (sg*0.075, 1.475, nz - 0.03), (sg*0.04, 1.42, front_z(fem, 1.42, 0.014) + 0.008)], 'SHIRT_D', (0, 0.4, 1)) for sg in (1, -1)]}
    T['flannel_shirt'] = join(chest(fem, 'SHIRT', 0.014), sleeves('SHIRT', 'rolled', 0.018),
                              *[band(fem, y, 0.03, 0.016, 'ACC') for y in (1.05, 1.27)], vline(0.055, 'ACC', 0.014), vline(-0.055, 'ACC', 0.014), collar)
    dots = [(-0.06, 1.38), (0.05, 1.4), (0.02, 1.3), (-0.04, 1.22), (0.065, 1.15), (-0.055, 1.05), (0.035, 0.99)]
    T['spotted_top'] = join(tee, *[on_chest(fem, [(x - 0.01, y - 0.01), (x + 0.01, y - 0.01), (x + 0.01, y + 0.01), (x - 0.01, y + 0.01)], 'ACC', 0.006) for x, y in dots],
                            *[on_chest(fem, [(x - 0.01, y - 0.01), (x + 0.01, y - 0.01), (x + 0.01, y + 0.01), (x - 0.01, y + 0.01)], 'ACC', 0.006, n=BACKN) for x, y in ((0.05, 1.35), (-0.06, 1.2), (0.02, 1.02))])
    hood = {'spine_03': [loft([[0, 1.42, -0.04, 0.15, 0.115], [0, 1.49, -0.07, 0.14, 0.12], [0, 1.55, -0.1, 0.1, 0.09]], 'SHIRT_D',
                              ang=[192, 224, 256, 284, 316, 348], closed=False, both=True, cin='SHIRT')]}
    pocket = on_chest(fem, [(-0.08, 0.98), (0.08, 0.98), (0.065, 1.08), (-0.065, 1.08)], 'SHIRT_D', 0.024, lift=0.006)
    strings = join(*[on_chest(fem, [(x - 0.004, 1.45), (x + 0.004, 1.45), (x + 0.004, 1.36), (x - 0.004, 1.36)], 'ACC', 0.024, lift=0.006) for x in (-0.028, 0.028)])
    T['hoodie'] = join(chest(fem, 'SHIRT', 0.024), sleeves('SHIRT', 'long', 0.024, cuff='SHIRT_D'), band(fem, HEM, 0.04, 0.026, 'SHIRT_D'), hood, pocket, strings)
    # open jacket over a sweater in the second colour, collar up
    inner = join(on_chest(fem, [(-0.045, HEM + 0.01), (0.045, HEM + 0.01), (0.045, SPLIT), (-0.045, SPLIT)], 'ACC', 0.026, 'spine_01'),
                 on_chest(fem, [(-0.045, SPLIT), (0.045, SPLIT), (0.04, 1.47), (-0.04, 1.47)], 'ACC', 0.026, 'spine_03'))
    up_collar = {'spine_03': [loft([[0, 1.455, -0.008, 0.1, 0.085], [0, 1.535, -0.016, 0.085, 0.075]], 'SHIRT_D', ang=[112, 150, 190, 230, 270, 310, 350, 390, 428],
                                   closed=False, both=True, cin='SHIRT')]}
    lapels = join(*[on_chest(fem, [(sg*0.045, 1.44), (sg*0.1, 1.41), (sg*0.06, 1.22), (sg*0.046, 1.26)], 'SHIRT_D', 0.026, 'spine_03', lift=0.008) for sg in (1, -1)])
    T['open_jacket'] = join(chest(fem, 'SHIRT', 0.024, hem=HEM - 0.05), sleeves('SHIRT', 'long', 0.024, cuff='SHIRT_D'), inner, up_collar, lapels)
    # bulky sweater: full in the middle, tight hem and cuffs, a chest pocket band (the capped girl reference)
    T['jumper'] = join(chest(fem, 'SHIRT', 0.016, bulge=0.026), sleeves('SHIRT', 'long', 0.03, cuff='SHIRT_D'), band(fem, HEM, 0.05, 0.012, 'SHIRT_D'),
                       band(fem, 1.465, 0.022, 0.01, 'SHIRT_D'), on_chest(fem, [(-0.09, 1.2), (0.09, 1.2), (0.09, 1.26), (-0.09, 1.26)], 'SHIRT_D', 0.042, lift=0.006))
    bib = join(on_chest(fem, [(-0.07, 1.12), (0.07, 1.12), (0.065, 1.3), (-0.065, 1.3)], 'PANTS', 0.016, 'spine_03'),
               *[on_chest(fem, [(sg*0.045, 1.3), (sg*0.065, 1.3), (sg*0.1, 1.44), (sg*0.08, 1.45)], 'PANTS', 0.016, 'spine_03') for sg in (1, -1)],
               *[on_chest(fem, [(sg*0.045, 1.14), (sg*0.065, 1.14), (sg*0.1, 1.42), (sg*0.08, 1.43)], 'PANTS', 0.008, 'spine_03', n=BACKN) for sg in (1, -1)])
    T['dungarees'] = join(chest(fem, 'ACC', 0.006, belly='PANTS'), sleeves('ACC', 'short', 0.008), bib, neckline)
    return T

# ================= bottoms: slim, tapering to the ankle =================
def bottoms(fem):
    hip = [(0.9, 0.13 if not fem else 0.136, 0.094, 0), (1.0, 0.148 if not fem else 0.154, 0.104, 0)]
    def pelvis(col): return {'pelvis': [loft([[0, y, oz, a + 0.006, b + 0.006] for y, a, b, oz in hip], col, n=6, rot=0)]}
    pockets = {'pelvis': [flat([(x - 0.03, 0.905, -0.088), (x + 0.03, 0.905, -0.088), (x + 0.026, 0.95, -0.093), (x - 0.026, 0.95, -0.093)], 'PANTS_D', BACKN) for x in (-0.06, 0.06)]}
    def legs(col, g=0.008, knee=None, calf_to=None, cuff=None):
        def f(sg, sd):
            o = {}
            if knee:   # knee-length shorts over bare legs
                t = cut(limb(THIGH, sg, g + 0.01), 0.98, knee); t[1][3] += 0.01; t[1][4] += 0.01
                return {'thigh_' + sd: [loft(t, col, n=6, caps=[True, False]), loft(limb(THIGH, sg, -0.006), 'SKIN', n=5)],
                        'calf_' + sd: [loft(limb(CALF, sg, -0.006), 'SKIN', n=5)]}
            o['thigh_' + sd] = [loft(limb(THIGH, sg, g), col, n=6)]
            if calf_to:
                o['calf_' + sd] = [loft(cut(limb(CALF, sg, g), 0.52, calf_to), col, n=6, caps=[True, False]), loft(limb(CALF, sg, -0.006), 'SKIN', n=5)]
            else:
                o['calf_' + sd] = [loft(limb(CALF, sg, g), col, n=6)]
            if cuff:
                y0, y1, cc = cuff; o['calf_' + sd].append(loft(cut(limb(CALF, sg, g + 0.008), y0, y1), cc, n=6, caps=[False, False]))
            return o
        return both_sides(f)
    def stripe(rings, sg):
        r0, r1 = rings; x0 = r0[0] + sg*(r0[3]*0.866 + 0.002); x1 = r1[0] + sg*(r1[3]*0.866 + 0.002)
        return flat([(x0, r0[1], r0[2] - 0.009), (x0, r0[1], r0[2] + 0.009), (x1, r1[1], r1[2] + 0.009), (x1, r1[1], r1[2] - 0.009)], 'ACC', (sg, 0, 0))
    B = {}
    B['jeans'] = join(pelvis('PANTS'), legs('PANTS'), pockets)
    B['shorts'] = join(pelvis('PANTS'), legs('PANTS', knee=0.56), pockets)
    B['cargo_trousers'] = join(pelvis('PANTS'), legs('PANTS', g=0.014), both_sides(lambda sg, sd: {'thigh_' + sd: [block([sg*0.16, 0.66, 0.0], [0.026, 0.1, 0.07], 'PANTS_D')]}))
    B['capri_trousers'] = join(pelvis('PANTS'), legs('PANTS', calf_to=0.27), pockets)
    B['track_pants'] = join(pelvis('PANTS'), legs('PANTS', g=0.014, cuff=(0.15, 0.09, 'PANTS_D')),
                            both_sides(lambda sg, sd: {'thigh_' + sd: [stripe(limb(THIGH, sg, 0.014), sg)], 'calf_' + sd: [stripe(cut(limb(CALF, sg, 0.014), 0.52, 0.16), sg)]}))
    B['rolled_jeans'] = join(pelvis('PANTS'), legs('PANTS', cuff=(0.16, 0.11, 'denimRoll')), pockets)
    return B

# ================= shoes: chunky =================
def shoes():
    def base(col, sole, sg, sd, h=0.05):
        x = sg*0.092
        return {'foot_' + sd: [loft([[x, h, -0.07, 0.07, 0.068], [x, h, 0.05, 0.075, 0.07]], col, ax='z', n=4), block([x, 0.012, 0.045], [0.11, 0.024, 0.25], sole)],
                'ball_' + sd: [loft([[x, h, 0.05, 0.075, 0.07], [x, 0.036, 0.165, 0.065, 0.045]], col, ax='z', n=4, caps=[False, True])]}
    S = {}
    S['trainers'] = both_sides(lambda sg, sd: join(base('trainer', 'trainerSole', sg, sd, 0.046), {
        'foot_' + sd: [flat([(sg*(0.092 + 0.053 + 0.003), 0.03, -0.05), (sg*(0.092 + 0.053 + 0.003), 0.03, 0.04), (sg*(0.092 + 0.053 + 0.003), 0.06, 0.02), (sg*(0.092 + 0.053 + 0.003), 0.06, -0.03)], 'ACC', (sg, 0, 0))],
        'ball_' + sd: [flat([(sg*0.092 - 0.016, 0.097, 0.04), (sg*0.092 + 0.016, 0.097, 0.04), (sg*0.092 + 0.014, 0.078, 0.11), (sg*0.092 - 0.014, 0.078, 0.11)], 'lace', (0, 1, 0.3))]}))
    S['boots'] = both_sides(lambda sg, sd: join(base('boot', 'sole', sg, sd, 0.052), {
        'calf_' + sd: [loft([[sg*0.092, 0.08, -0.02, 0.054, 0.058], [sg*0.092, 0.19, -0.018, 0.05, 0.054]], 'boot', n=6),
                       loft([[sg*0.092, 0.18, -0.018, 0.054, 0.058], [sg*0.092, 0.2, -0.018, 0.054, 0.058]], 'bootD', n=6, caps=[False, True])]}))
    S['rain_boots'] = both_sides(lambda sg, sd: join(base('rainboot', 'sole', sg, sd, 0.052), {
        'calf_' + sd: [loft([[sg*0.092, 0.08, -0.02, 0.056, 0.06], [sg*0.092, 0.33, -0.016, 0.06, 0.064]], 'rainboot', n=6),
                       loft([[sg*0.092, 0.32, -0.016, 0.064, 0.068], [sg*0.092, 0.34, -0.016, 0.064, 0.068]], 'rainbootD', n=6, caps=[False, True])]}))
    return S

# ================= faces =================
def rect_rims(col, z, w=0.024, h=0.017, t=0.0045):
    out = []
    for sg in (1, -1):
        cx = sg*0.03
        for x0, y0, x1, y1 in ((cx - w, EYE_Y + h - t, cx + w, EYE_Y + h), (cx - w, EYE_Y - h, cx + w, EYE_Y - h + t),
                               (cx - w, EYE_Y - h, cx - w + t, EYE_Y + h), (cx + w - t, EYE_Y - h, cx + w, EYE_Y + h)):
            out.append(flat([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], col))
    out.append(flat([(-0.007, EYE_Y + 0.006, z), (0.007, EYE_Y + 0.006, z), (0.007, EYE_Y + 0.011, z), (-0.007, EYE_Y + 0.011, z)], col))
    out += [flat([(sg*0.054, EYE_Y + 0.008, z), (sg*0.09, EYE_Y + 0.01, z - 0.075), (sg*0.09, EYE_Y + 0.015, z - 0.075), (sg*0.054, EYE_Y + 0.014, z)], col, (sg, 0, 0)) for sg in (1, -1)]
    return out
def faces():
    F = {}
    z = face_z(EYE_Y) + 0.02
    F['calm'] = eyes() + brows() + mouth()
    F['glasses'] = eyes() + brows(BROW_Y + 0.006) + mouth() + rect_rims('frame', z)
    F['stubble'] = eyes() + brows() + [loft(span(HEAD, 1.565, 1.645, 0.002), 'HAIR_MIX', ang=[10, 38, 62, 90, 118, 142, 170], closed=False)] + mouth()
    F['freckles'] = eyes() + brows() + mouth() + [flat(on_face([(x - 0.003, y - 0.003), (x + 0.003, y - 0.003), (x + 0.003, y + 0.003), (x - 0.003, y + 0.003)], 0.002), 'freckle')
                                                  for x, y in ((-0.04, 1.665), (-0.03, 1.656), (-0.048, 1.654), (0.04, 1.665), (0.03, 1.656), (0.048, 1.654))]
    F['tired'] = eyes(0.003) + brows(BROW_Y - 0.003, tilt=0.004) + mouth(0.01) + \
                 [flat(on_face([(sg*0.019, EYE_Y - 0.011), (sg*0.04, EYE_Y - 0.011), (sg*0.036, EYE_Y - 0.016), (sg*0.022, EYE_Y - 0.016)], 0.002), 'SKIN_D') for sg in (1, -1)]
    my = 1.634; mz = face_z(my)
    F['moustache'] = eyes() + brows() + mouth() + [solid([(-0.026, my - 0.008, mz + 0.003), (0.026, my - 0.008, mz + 0.003), (0.016, my + 0.007, mz + 0.004), (-0.016, my + 0.007, mz + 0.004),
                                                          (-0.022, my - 0.006, mz + 0.013), (0.022, my - 0.006, mz + 0.013), (0.013, my + 0.005, mz + 0.012), (-0.013, my + 0.005, mz + 0.012)], HEX, 'HAIR_D')]
    lens = [flat([(sg*0.03 - 0.023, EYE_Y - 0.016, z - 0.001), (sg*0.03 + 0.023, EYE_Y - 0.016, z - 0.001), (sg*0.03 + 0.023, EYE_Y + 0.016, z - 0.001), (sg*0.03 - 0.023, EYE_Y + 0.016, z - 0.001)], 'shades') for sg in (1, -1)]
    F['dark_glasses'] = brows(BROW_Y + 0.006) + mouth() + lens + rect_rims('shades', z)
    F['scar'] = eyes() + brows() + mouth() + [flat(on_face([(0.022, 1.725), (0.027, 1.725), (0.045, 1.665), (0.04, 1.665)], 0.003), 'scar')]
    return F

# ================= hair: chunky, swept or straight =================
OPEN = [110, 142, 180, 232, 270, 308, 360, 398, 430]
BACK_ONLY = [152, 180, 232, 270, 308, 360, 388]
def cap_of(y0, g, extra_top=0.0):
    rows = span(HEAD, y0, 1.795, g)
    rows[-1][1] += extra_top
    return loft(rows, 'HAIR', ang=HEAD_ANG, caps=[False, True])
def hang(y0, y1, g, ang=OPEN):
    return loft(span(HEAD, y0, y1, g), 'HAIR', ang=ang, closed=False, both=True, cin='HAIR_D')
def hair():
    H = {'none': []}
    H['buzzed'] = under_hat([cap_of(1.738, 0.004)]) + [hang(1.65, 1.738, 0.004, BACK_ONLY)]
    # swept back with height on top (the grey-haired wanderer)
    sweep = loft([[0, 1.735, -0.006, 0.095, 0.1], [0, 1.795, -0.016, 0.086, 0.098], [0, 1.835, -0.036, 0.048, 0.066]], 'HAIR', ang=HEAD_ANG, caps=[False, True])
    H['short'] = under_hat([sweep, hang(1.7, 1.738, 0.01, BACK_ONLY)]) + [hang(1.64, 1.7, 0.01, BACK_ONLY)]
    # straight hair to below the chin with blunt bangs (the capped girl)
    a, b, oz = at(HEAD, 1.735)
    bangs = loft([[0, 1.708, oz + 0.012, a + 0.016, b + 0.026], [0, 1.76, oz - 0.006, a + 0.012, b + 0.012]], 'HAIR', ang=[56, 74, 90, 106, 124], closed=False, both=True, cin='HAIR_D')
    sides_lo = loft([[0, 1.54, -0.01, 0.104, 0.104], [0, 1.66, -0.008, 0.106, 0.108]], 'HAIR', ang=OPEN, closed=False, both=True, cin='HAIR_D')
    sides_hi = loft([[0, 1.66, -0.008, 0.106, 0.108], [0, 1.73, -0.01, 0.102, 0.108]], 'HAIR', ang=OPEN, closed=False, both=True, cin='HAIR_D')
    H['bob'] = [sides_lo] + under_hat([sides_hi, cap_of(1.73, 0.016), bangs])
    bun = loft([[0, 1.775, -0.06, 0.03, 0.03], [0, 1.81, -0.07, 0.045, 0.045], [0, 1.845, -0.08, 0.024, 0.024]], 'HAIR', n=6)
    H['buns'] = H['buzzed'] + under_hat([bun])
    beard = loft(span(HEAD, 1.555, 1.66, 0.012), 'HAIR', ang=[-10, 20, 46, 90, 134, 160, 190], closed=False, both=True, cin='HAIR_D')
    my = 1.634; mz = face_z(my)
    mo = solid([(-0.03, my - 0.008, mz + 0.008), (0.03, my - 0.008, mz + 0.008), (0.018, my + 0.009, mz + 0.008), (-0.018, my + 0.009, mz + 0.008),
                (-0.025, my - 0.006, mz + 0.019), (0.025, my - 0.006, mz + 0.019), (0.015, my + 0.007, mz + 0.017), (-0.015, my + 0.007, mz + 0.017)], HEX, 'HAIR')
    H['beard'] = H['short'] + [beard, mo]
    return H

# ================= hats =================
def hats():
    H = {'none': []}
    H['beanie'] = [loft([[0, 1.705, -0.006, 0.1, 0.104], [0, 1.77, -0.012, 0.094, 0.1], [0, 1.82, -0.02, 0.06, 0.07], [0, 1.835, -0.024, 0.022, 0.028]], 'ACC', ang=HEAD_ANG, caps=[False, True]),
                   loft([[0, 1.69, -0.006, 0.104, 0.108], [0, 1.73, -0.006, 0.104, 0.108]], 'ACC_D', ang=HEAD_ANG, caps=[False, False])]
    by, bz = 1.735, face_z(1.735)
    brim = solid([(-0.075, by, bz - 0.03), (0.075, by, bz - 0.03), (0.068, by - 0.022, bz + 0.075), (-0.068, by - 0.022, bz + 0.075),
                  (-0.075, by + 0.008, bz - 0.03), (0.075, by + 0.008, bz - 0.03), (0.068, by - 0.014, bz + 0.075), (-0.068, by - 0.014, bz + 0.075)], HEX, 'ACC_D')
    H['cap'] = [loft([[0, 1.725, -0.008, 0.097, 0.1], [0, 1.795, -0.014, 0.088, 0.094], [0, 1.83, -0.02, 0.05, 0.058]], 'ACC', ang=HEAD_ANG, caps=[False, True]), brim]
    H['helmet'] = [loft([[0, 1.7, -0.008, 0.112, 0.115], [0, 1.77, -0.012, 0.11, 0.112], [0, 1.83, -0.016, 0.075, 0.08], [0, 1.85, -0.02, 0.03, 0.035]], 'helmet', caps=[False, True]),
                   loft([[0, 1.692, -0.008, 0.124, 0.127], [0, 1.706, -0.008, 0.124, 0.127]], 'helmetD')]
    return H

# ================= gear =================
def gear():
    pack = {'spine_03': [loft([[0, 1.0, -0.2, 0.14, 0.085], [0, 1.38, -0.21, 0.15, 0.09], [0, 1.56, -0.19, 0.12, 0.075]], 'pack', n=6, rot=0),
                         loft([[0, 1.04, -0.29, 0.1, 0.024], [0, 1.2, -0.29, 0.1, 0.024]], 'packD', n=6, rot=0),
                         loft([[0.16, 1.62, -0.19, 0.055, 0.055], [-0.16, 1.62, -0.19, 0.055, 0.055]], 'roll', ax='x', n=6),
                         loft([[0.165, 1.02, -0.2, 0.026, 0.026], [0.165, 1.6, -0.2, 0.026, 0.026]], 'mat', n=6),
                         flat([(0.05, 1.45, 0.117), (0.08, 1.45, 0.113), (0.078, 1.12, 0.103), (0.05, 1.12, 0.105)], 'strap'),
                         flat([(-0.05, 1.45, 0.117), (-0.08, 1.45, 0.113), (-0.078, 1.12, 0.103), (-0.05, 1.12, 0.105)], 'strap')]}
    scarf = {'neck_01': [loft([[0, 1.46, 0.0, 0.07, 0.064], [0, 1.52, 0.004, 0.064, 0.06]], 'ACC', n=6),
                         flat([(-0.02, 1.48, 0.075), (0.02, 1.48, 0.075), (0.016, 1.4, 0.09), (-0.016, 1.4, 0.088)], 'ACC_D')]
                         + [flat([(x - 0.008, y - 0.008, 0.077), (x + 0.008, y - 0.008, 0.077), (x + 0.008, y + 0.008, 0.077), (x - 0.008, y + 0.008, 0.077)], 'ACC_D')
                            for x, y in ((-0.04, 1.475), (0.0, 1.5), (0.04, 1.475))]}
    gloves = both_sides(lambda sg, sd: {'hand_' + sd: [loft(hand_rings(sg, 0.006), 'glove', n=4),
                                                       loft([[sg*0.225, 0.93, 0.01, 0.036, 0.042], [sg*0.225, 0.89, 0.012, 0.034, 0.04]], 'gloveD', n=6, caps=[False, False])]})
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

def body(fem): return join(head(fem), hands())
pack = {
  'name': 'survivor', 'version': 4, 'style': 'lean faceted wanderers, built from scratch on the 13 October 2026 references',
  'about': 'Every character creator choice as faceted pieces, grouped by skeleton bone. See docs/SHAPED.md.',
  'units': 'metres', 'facing': '+Z', 'left': '+X', 'height': 1.80,
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
    'shoes': ['trainers', 'boots', 'rain_boots'],
    'gear': ['backpack', 'scarf', 'gloves']},
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
print('heaviest mix:', tri['body.masculine'] + mx('top.masculine') + mx('bottoms.masculine') + mx('shoes') + mx('face') + mx('hair') + mx('hat') + sum(tri['gear.' + g] for g in ('backpack', 'scarf', 'gloves')))
for k in sorted(tri): print(f'  {k}: {tri[k]}')
