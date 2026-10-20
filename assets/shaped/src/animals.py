#!/usr/bin/env python3
"""Afterstreet animals pack, version 1 (20 October 2026): animals to hunt for food and materials, rigged like the aliens.
Writes assets/shaped/animals.js. Run: python3 assets/shaped/src/animals.py

The same shape language as the survivors: flat planes, tapering points, silhouette first, no eyes beyond a dark facet.
Each animal lists bones (pivot, tip, parent) and parts (pieces per bone, in model space at rest), and clips: per frame, rotations
in degrees [x, y, z] for the bones that move, and 'root': [x, y, z] metres to move the whole body. Positive X on a leg swings
its foot back; positive X on the neck or head lowers it. Animals face +Z, the origin is the ground under the middle of the body.
Kinds:
  four legs  deer (and deer_buck with antlers), boar, cow, sheep, goat, dog, wolf, fox, bear, raccoon, rabbit, squirrel
  birds      turkey, chicken, duck, goose, pigeon, crow
  fish       trout, bass, catfish
Clips: every animal has idle, walk, run, eat, alert, die (and dead, the last pose); four legs also have attack (predators and
boars) or rear (bear); birds have peck, fly and glide (duck and goose also float); fish have swim and flop.
Bird wings are modelled spread (span along X); every clip on the ground folds them against the flank with [-90, 0, 90] on wing_l and
[-90, 0, -90] on wing_r (three.js Euler XYZ), and fly flaps them about Z.
info[name] gives size, speed, how it behaves, and what it gives when butchered (yield, with the tool needed);
items are the materials on the ground: meat, fish, hide, pelt, feathers, bone, fat, antler, wool, and two carcasses."""
import math
from kit import *

PALETTE = {
  'deer': '#8a6a46', 'deerD': '#6a4e32', 'deerL': '#d8c8a8', 'antler': '#c8b48a', 'boar': '#4a3a30', 'boarD': '#33281f', 'boarL': '#6a5444', 'tusk': '#e8e0cc',
  'cowW': '#e8e4dc', 'cowB': '#2a2a2c', 'cowP': '#d8a0a0', 'horn': '#d8ccb0', 'wool': '#e4ded0', 'woolD': '#c8c0b0', 'face': '#2e2a28', 'goat': '#c8b8a0', 'goatD': '#8a7a62',
  'dog': '#a8845a', 'dogD': '#6a5236', 'wolf': '#7a7670', 'wolfD': '#56524e', 'wolfL': '#b8b4ac', 'fox': '#c8642a', 'foxD': '#3a2a20', 'foxL': '#ece4d8',
  'bear': '#4a3426', 'bearD': '#33241a', 'bearL': '#6a4e3a', 'raccoon': '#7a7670', 'raccoonD': '#2e2c2a', 'raccoonL': '#c8c4bc', 'rabbit': '#9a8670', 'rabbitL': '#e4dccc', 'squirrel': '#8a5a3a', 'squirrelL': '#d8c4a8',
  'hoof': '#2a2420', 'nose': '#2a2220', 'eye': '#141210', 'pink': '#c88a8a',
  'turkey': '#4a3a30', 'turkeyL': '#8a6a4a', 'wattle': '#c8322a', 'chicken': '#e8e0d0', 'comb': '#c8322a', 'beak': '#d8a030', 'legY': '#d8a030', 'duck': '#7a6a52', 'duckH': '#2a6a4a', 'duckL': '#d8d0c0',
  'goose': '#8a8478', 'gooseD': '#2a2a2c', 'gooseL': '#e4ded4', 'pigeon': '#8a8e96', 'pigeonD': '#5a5e66', 'pigeonN': '#5a7a6a', 'crow': '#2a2a2e', 'crowL': '#3e3e44', 'legD': '#3a3430',
  'trout': '#8a9a7a', 'troutL': '#e0d8c8', 'troutS': '#c87a7a', 'bass': '#6a7a4a', 'bassL': '#d8d0a8', 'catfish': '#5a5448', 'catfishL': '#b8b0a0', 'fin': '#6a6a5a',
  'meat': '#b84a4a', 'meatL': '#e0a0a0', 'fat': '#ece4cc', 'bone': '#e4dccb', 'hide': '#8a6a4a', 'hideIn': '#d8c0a8', 'feather': '#6a5a4a', 'featherL': '#e8e0d0', 'fillet': '#e8a890', 'blood': '#6a1a18',
}
G = dict(glow=True)
A = {}; INFO = {}

def mk(name, bones, parts, clips, info):
    A[name] = {'bones': bones, 'parts': parts, 'clips': clips}; INFO[name] = info

# ================= four legs =================
def quad(S):
    """S: a dict of measurements and colours (see the kinds below)"""
    L, legF, legH, r, rh = S['L'], S['legF'], S.get('legH', S['legF']), S['r'], S.get('rh', S['r']*1.15)
    c, cD, cL = S['c'], S.get('cD', S['c']), S.get('cL', S['c'])
    yb = max(legF, legH) + r*0.6; zs, zh = L/2, -L/2; w = S.get('w', r*0.55)
    B = {'body': {'pivot': [0, yb, 0], 'tip': [0, yb, zs]}}
    P = {}
    # body: hips to shoulders, belly lighter
    rings = [[0, yb + S.get('rump', 0.0), zh - r*0.5, r*0.55, r*0.55], [0, yb, zh, r*0.85, rh*0.9], [0, yb + S.get('hump', 0.0)*0.4, 0, r, rh], [0, yb + S.get('hump', 0.0), zs, r*0.95, rh*1.0], [0, yb + S.get('hump', 0.0)*0.6, zs + r*0.45, r*0.6, rh*0.7]]
    P['body'] = [frustum(rings, c, ax='z')] + [frustum([[0, yb - rh*0.55, zh + 0.05, r*0.6, rh*0.35], [0, yb - rh*0.62, zs - 0.05, r*0.65, rh*0.35]], cL, ax='z', caps=[False, False])]
    if S.get('wool'):
        P['body'] += [loft([[0, yb, zh - r*0.3, r*0.9, r*0.9], [0, yb + r*0.15, 0, r*1.25, r*1.2], [0, yb + 0.05, zs + r*0.1, r*1.0, r*1.0]], 'wool', ax='z', n=8)]
    if S.get('ridge'): P['body'] += [tip([0, yb + rh*0.95, z], [0, yb + rh*1.25, z - 0.06], 0.04, 0.02, cD) for z in [zh + i*(L/5) for i in range(6)]]
    if S.get('patches'): P['body'] += [flat([(sx*(r*0.99), yb + dy - 0.1, z - 0.15), (sx*(r*0.99), yb + dy - 0.12, z + 0.18), (sx*(r*0.99), yb + dy + 0.12, z + 0.12), (sx*(r*0.99), yb + dy + 0.1, z - 0.12)], S['patches'], (sx, 0, 0)) for sx in (1, -1) for z, dy in ((-0.3, 0.05), (0.35, -0.02))]
    if S.get('udder'): P['body'] += [loft([[0, yb - rh*0.8, zh + 0.25, 0.1, 0.12], [0, yb - rh - 0.12, zh + 0.25, 0.08, 0.1], [0, yb - rh - 0.18, zh + 0.25, 0, 0]], 'cowP', n=6)]
    # neck and head
    nk = [0, yb + S.get('hump', 0.0)*0.8 + rh*0.2, zs + r*0.3]; nl, na = S['neck'], math.radians(S.get('neckUp', 40))
    hb = [0, nk[1] + nl*math.sin(na), nk[2] + nl*math.cos(na)]
    B['neck'] = {'pivot': nk, 'tip': hb, 'parent': 'body'}
    P['neck'] = [seg(nk, hb, r*0.45, rh*0.55, S.get('nr', r*0.3), S.get('nr', r*0.3)*1.1, c, ax='z' if na < 0.8 else 'y')]
    if S.get('mane'): P['neck'] += [tip([0, (nk[1] + hb[1])/2 + rh*0.4, (nk[2] + hb[2])/2 - 0.05], [0, (nk[1] + hb[1])/2 + rh*0.7, (nk[2] + hb[2])/2 - 0.15], r*0.3, 0.03, S['mane'])]
    hl, hd = S['head'], S.get('headDown', 20)
    ha = math.radians(-hd); sn = [0, hb[1] + hl*math.sin(ha), hb[2] + hl*math.cos(ha)]
    B['head'] = {'pivot': hb, 'tip': sn, 'parent': 'neck'}
    hr = S.get('hr', r*0.38)
    P['head'] = [frustum([[*hb, hr, hr*1.05], [*mixp(hb, sn, 0.55), hr*0.75, hr*0.8], [*sn, hr*S.get('snout', 0.45), hr*S.get('snout', 0.45)*0.9]], c, ax='z'),
                 flat([(sn[0] - hr*0.3, sn[1] - hr*0.1, sn[2] + 0.002), (sn[0] + hr*0.3, sn[1] - hr*0.1, sn[2] + 0.002), (sn[0] + hr*0.3, sn[1] + hr*0.25, sn[2] + 0.002), (sn[0] - hr*0.3, sn[1] + hr*0.25, sn[2] + 0.002)], S.get('noseC', 'nose')),
                 *[flat([(sx*hr*0.98, hb[1] + hr*0.35, hb[2] + hl*0.3), (sx*hr*0.98, hb[1] + hr*0.35, hb[2] + hl*0.42), (sx*hr*0.95, hb[1] + hr*0.5, hb[2] + hl*0.4), (sx*hr*0.95, hb[1] + hr*0.5, hb[2] + hl*0.3)], 'eye', (sx, 0.3, 0.2)) for sx in (1, -1)]]
    if S.get('mask'): P['head'] += [flat([(sx*hr*1.0, hb[1] + hr*0.15, hb[2] + hl*0.15), (sx*hr*0.9, hb[1] + hr*0.15, hb[2] + hl*0.6), (sx*hr*0.85, hb[1] + hr*0.65, hb[2] + hl*0.55), (sx*hr*0.95, hb[1] + hr*0.65, hb[2] + hl*0.12)], S['mask'], (sx, 0.2, 0)) for sx in (1, -1)]
    if S.get('faceC'): P['head'][0]['c'] = S['faceC']
    ear, et = S.get('ear', hr*0.8), S.get('earType', 'point')
    for sx in (1, -1):
        e0 = [sx*hr*0.6, hb[1] + hr*0.8, hb[2] + hl*0.05]
        if et == 'long': e1 = [sx*hr*0.8, e0[1] + ear, e0[2] - ear*0.25]
        elif et == 'droop': e1 = [sx*(hr + ear*0.8), e0[1] - ear*0.4, e0[2]]
        elif et == 'round': e1 = [sx*hr*0.9, e0[1] + ear*0.6, e0[2] - 0.01]
        else: e1 = [sx*hr*0.75, e0[1] + ear, e0[2] - ear*0.15]
        P['head'].append(tip(e0, e1, ear*(0.35 if et != 'round' else 0.5), ear*0.12, c if et != 'long' else c))
    if S.get('antlers'):
        for sx in (1, -1):
            a0 = [sx*hr*0.4, hb[1] + hr*0.9, hb[2] + hl*0.15]; a1 = [sx*hr*1.6, a0[1] + 0.35, a0[2] - 0.12]; a2 = [sx*hr*2.0, a0[1] + 0.6, a0[2] - 0.05]
            P['head'] += [seg(a0, a1, 0.025, 0.025, 0.02, 0.02, 'antler'), tip(a1, a2, 0.02, 0.02, 'antler'), tip(mixp(a0, a1, 0.5), [mixp(a0, a1, 0.5)[0], mixp(a0, a1, 0.5)[1] + 0.25, mixp(a0, a1, 0.5)[2] + 0.12], 0.016, 0.016, 'antler'),
                          tip(a1, [a1[0] + sx*0.05, a1[1] + 0.22, a1[2] + 0.12], 0.016, 0.016, 'antler')]
    if S.get('horns'):
        for sx in (1, -1):
            h0 = [sx*hr*0.6, hb[1] + hr*0.85, hb[2] + hl*0.08]
            P['head'].append(tip(h0, [h0[0] + sx*S['horns']*0.7, h0[1] + S['horns']*0.6, h0[2] - S['horns']*0.4], 0.03, 0.03, 'horn'))
    if S.get('tusks'): P['head'] += [tip([sx*hr*0.4, sn[1] - hr*0.15, sn[2] - hl*0.12], [sx*hr*0.7, sn[1] + hr*0.35, sn[2] - hl*0.05], 0.015, 0.015, 'tusk') for sx in (1, -1)]
    if S.get('beard'): P['head'].append(tip([0, hb[1] - hr*0.6, hb[2] + hl*0.55], [0, hb[1] - hr*1.5, hb[2] + hl*0.5], 0.03, 0.02, S['beard']))
    # tail
    tb = [0, yb + rh*0.4 + S.get('rump', 0.0), zh - r*0.5]
    tt = S.get('tail', 'short'); tl = S.get('tailL', r*0.6)
    if tt == 'bushy': te = [0, tb[1] - tl*0.3, tb[2] - tl]
    elif tt == 'up': te = [0, tb[1] + tl*0.8, tb[2] - tl*0.5]
    elif tt == 'curl': te = [0, tb[1] + tl*0.9, tb[2] - tl*0.4]
    elif tt == 'puff': te = [0, tb[1] + tl*0.3, tb[2] - tl*0.4]
    else: te = [0, tb[1] - tl*0.7, tb[2] - tl*0.35]
    B['tail'] = {'pivot': tb, 'tip': te, 'parent': 'body'}
    tw = S.get('tailW', r*0.15)
    if tt == 'bushy':
        P['tail'] = [frustum([[*tb, tw*0.6, tw*0.6], [*mixp(tb, te, 0.5), tw*1.6, tw*1.6], [*te, tw*0.3, tw*0.3]], S.get('tailC', c), ax='z')]
        if S.get('tailTip'): P['tail'].append(tip(mixp(tb, te, 0.85), [te[0], te[1] - 0.01, te[2] - tw*1.5], tw*0.8, tw*0.8, S['tailTip'], ax='z'))
        if S.get('rings'): P['tail'] += [frustum([[*mixp(tb, te, f), tw*1.62, tw*1.62], [*mixp(tb, te, f + 0.08), tw*1.6, tw*1.6]], S['rings'], ax='z', caps=[False, False]) for f in (0.3, 0.55, 0.78)]
    elif tt == 'curl':
        mid = [0, tb[1] + tl*1.1, tb[2] - tl*0.2]; tip2 = [0, tb[1] + tl*1.25, tb[2] + tl*0.25]
        P['tail'] = [frustum([[*tb, tw, tw], [*mid, tw*2.2, tw*1.6]], S.get('tailC', c), ax='y'), tip(mid, tip2, tw*2.0, tw*1.4, S.get('tailC', c))]
    elif tt == 'puff':
        P['tail'] = [loft([[*tb, 0, 0], [*mixp(tb, te, 0.5), tw*1.4, tw*1.4], [*te, 0, 0]], S.get('tailC', 'rabbitL'), n=6)]
    else:
        P['tail'] = [tip(tb, te, tw, tw, S.get('tailC', c))]
    # legs: front (shoulder, knee, hoof) and hind (hip, hock, hoof)
    paw = S.get('paw', 'hoof')
    for sx, sd in ((1, 'l'), (-1, 'r')):
        for fr, nm in ((True, 'f'), (False, 'h')):
            leg = legF if fr else legH
            top = [sx*w, yb - rh*0.2, (zs - r*0.15) if fr else (zh + r*0.25)]
            kn = [sx*w, leg*0.48, top[2] + (0.02 if fr else -leg*0.18)]
            ft = [sx*w, 0.0, top[2] + (0.03 if fr else -0.02)]
            ub, lb = 'leg_%s%s' % (nm, sd), 'shin_%s%s' % (nm, sd)
            B[ub] = {'pivot': top, 'tip': kn, 'parent': 'body'}; B[lb] = {'pivot': kn, 'tip': ft, 'parent': ub}
            tw0 = S.get('thigh', r*0.32) * (1.0 if fr else 1.25)
            P[ub] = [seg(top, kn, tw0, tw0*1.3, S.get('lw', r*0.13), S.get('lw', r*0.13)*1.2, c if not S.get('legC') else S['legC'])]
            if not fr: P[ub].insert(0, frustum([[top[0], top[1] + rh*0.3, top[2] + 0.04, tw0*1.2, tw0*1.5], [top[0], top[1] - rh*0.3, top[2] - 0.02, tw0*1.1, tw0*1.4]], c, caps=[True, True]))
            lw = S.get('lw', r*0.13)
            P[lb] = [seg(kn, [ft[0], ft[1] + 0.04, ft[2]], lw, lw*1.1, lw*0.8, lw*0.9, S.get('legC', cD))]
            if paw == 'hoof': P[lb].append(frustum([[ft[0], 0.0, ft[2] + 0.01, lw*0.9, lw*1.1], [ft[0], 0.06, ft[2], lw*0.8, lw*0.95]], 'hoof'))
            else: P[lb].append(hull([(ft[0] - lw, 0, ft[2] - lw*0.6), (ft[0] + lw, 0, ft[2] - lw*0.6), (ft[0] + lw, 0, ft[2] + lw*2), (ft[0] - lw, 0, ft[2] + lw*2),
                                     (ft[0] - lw*0.8, lw*1.2, ft[2] - lw*0.5), (ft[0] + lw*0.8, lw*1.2, ft[2] - lw*0.5), (ft[0] + lw*0.8, lw*0.7, ft[2] + lw*1.6), (ft[0] - lw*0.8, lw*0.7, ft[2] + lw*1.6)], S.get('pawC', cD)))
    return B, P, yb
def quad_clips(S, yb, kind='walk'):
    sw, rs = S.get('swing', 22), S.get('runSwing', 40)
    walk = []
    for k in range(4):
        s = math.sin(k*math.pi/2); c = math.cos(k*math.pi/2)
        walk.append({'leg_fl': [sw*s, 0, 0], 'leg_hr': [sw*s, 0, 0], 'leg_fr': [-sw*s, 0, 0], 'leg_hl': [-sw*s, 0, 0],
                     'shin_fl': [-14*max(0, c), 0, 0], 'shin_hr': [16*max(0, c), 0, 0], 'shin_fr': [-14*max(0, -c), 0, 0], 'shin_hl': [16*max(0, -c), 0, 0],
                     'neck': [3*c, 0, 0], 'head': [-3*c, 0, 0], 'tail': [0, 8*s, 0]})
    run = []
    gait = S.get('gait', 'gallop')
    for k in range(4):
        if gait == 'bound':   # rabbits and squirrels: front pair and hind pair together
            f = [-1, 0, 1, 0][k]; h = [1, 0, -1, 0][k]
            run.append({'leg_fl': [rs*f, 0, 0], 'leg_fr': [rs*f, 0, 0], 'leg_hl': [rs*h*1.2, 0, 0], 'leg_hr': [rs*h*1.2, 0, 0], 'shin_hl': [30*max(0, -h), 0, 0], 'shin_hr': [30*max(0, -h), 0, 0],
                        'body': [-12*f, 0, 0], 'root': [0, [0.0, yb*0.25, 0.0, yb*0.1][k], 0], 'head': [8*f, 0, 0]})
        else:   # gallop: front legs reach out together, hind legs push back
            f = [-1, -0.3, 1, 0.3][k]; h = [1, 0.3, -1, -0.3][k]
            run.append({'leg_fl': [rs*f, 0, 0], 'leg_fr': [rs*f*0.8, 0, 0], 'leg_hl': [rs*h, 0, 0], 'leg_hr': [rs*h*0.8, 0, 0],
                        'shin_fl': [-30*max(0, f), 0, 0], 'shin_fr': [-30*max(0, f), 0, 0], 'shin_hl': [30*max(0, -h), 0, 0], 'shin_hr': [30*max(0, -h), 0, 0],
                        'body': [6*f, 0, 0], 'neck': [-10*f, 0, 0], 'tail': [-20, 0, 0], 'root': [0, [0.02, 0.0, 0.05*yb, 0.02][k], 0]})
    eat = [{'neck': [S.get('eatNeck', 55), 0, 0], 'head': [20, 0, 0], 'leg_fl': [-8, 0, 0], 'leg_fr': [-8, 0, 0]}, {'neck': [S.get('eatNeck', 55), 0, 0], 'head': [28, 6, 0], 'leg_fl': [-8, 0, 0], 'leg_fr': [-8, 0, 0]}]
    alert = [{'neck': [-18, 0, 0], 'head': [-10, 25, 0], 'tail': [-25, 0, 0]}, {'neck': [-18, 0, 0], 'head': [-10, -25, 0], 'tail': [-25, 0, 0]}]
    idle = [{'neck': [6, 0, 0], 'tail': [0, 10, 0]}, {'neck': [4, 6, 0], 'head': [4, 0, 0], 'tail': [0, -10, 0]}]
    die = [{'leg_fl': [-20, 0, 0], 'leg_fr': [-20, 0, 0], 'shin_fl': [-60, 0, 0], 'shin_fr': [-60, 0, 0], 'neck': [20, 0, 0], 'root': [0, -yb*0.25, 0]},
           {'body': [0, 0, 85], 'root': [0, -yb*0.45, 0], 'leg_fl': [-20, 0, 15], 'leg_fr': [-30, 0, -10], 'leg_hl': [20, 0, 15], 'leg_hr': [30, 0, -10], 'neck': [10, 0, 20], 'head': [10, 0, 10], 'tail': [0, 0, 0]}]
    C = {'idle': idle, 'walk': walk, 'run': run, 'eat': eat, 'alert': alert, 'die': die, 'dead': [die[-1]]}
    if S.get('attack'): C['attack'] = [{'neck': [-15, 0, 0], 'head': [-20, 0, 0], 'leg_fl': [-30, 0, 0], 'leg_fr': [-30, 0, 0], 'root': [0, 0.03, 0]},
                                       {'neck': [20, 0, 0], 'head': [10, 0, 0], 'leg_fl': [25, 0, 0], 'leg_fr': [25, 0, 0], 'body': [8, 0, 0], 'root': [0, 0, 0.15*yb]}]
    if S.get('rear'): C['rear'] = [{'body': [-62, 0, 0], 'root': [0, yb*0.55, -yb*0.4], 'leg_fl': [-40, 0, -20], 'leg_fr': [-40, 0, 20], 'shin_fl': [-50, 0, 0], 'shin_fr': [-50, 0, 0], 'leg_hl': [55, 0, 0], 'leg_hr': [55, 0, 0], 'neck': [45, 0, 0], 'head': [20, 0, 0]}]
    return C
KINDS = {
  'deer':     dict(L=0.85, legF=0.78, legH=0.8, r=0.2, rh=0.24, neck=0.42, neckUp=55, head=0.28, hr=0.085, snout=0.5, ear=0.14, c='deer', cD='deerD', cL='deerL', tail='up', tailL=0.12, tailC='deerL', lw=0.028, thigh=0.07, swing=24, runSwing=45),
  'boar':     dict(L=0.8, legF=0.36, r=0.25, rh=0.3, neck=0.12, neckUp=5, head=0.36, hr=0.13, snout=0.4, ear=0.09, c='boar', cD='boarD', cL='boarL', ridge=True, tusks=True, tail='short', tailL=0.15, lw=0.04, thigh=0.08, eatNeck=25, attack=True, rump=-0.03),
  'cow':      dict(L=1.3, legF=0.72, r=0.36, rh=0.42, neck=0.3, neckUp=20, head=0.42, hr=0.13, snout=0.6, ear=0.12, earType='droop', c='cowW', cD='cowB', cL='cowW', patches='cowB', horns=0.12, udder=True, tail='short', tailL=0.7, tailW=0.025, lw=0.05, thigh=0.12, noseC='cowP', eatNeck=45),
  'sheep':    dict(L=0.65, legF=0.42, r=0.24, rh=0.27, neck=0.2, neckUp=35, head=0.26, hr=0.08, snout=0.55, ear=0.1, earType='droop', c='woolD', cD='face', cL='woolD', wool=True, faceC='face', legC='face', tail='short', tailL=0.12, lw=0.025, thigh=0.05),
  'goat':     dict(L=0.6, legF=0.5, r=0.2, rh=0.24, neck=0.28, neckUp=50, head=0.24, hr=0.075, snout=0.5, ear=0.11, earType='droop', c='goat', cD='goatD', cL='goat', horns=0.2, beard='goatD', tail='up', tailL=0.1, lw=0.025, thigh=0.06),
  'dog':      dict(L=0.55, legF=0.45, r=0.15, rh=0.17, neck=0.18, neckUp=45, head=0.24, hr=0.08, snout=0.5, ear=0.1, c='dog', cD='dogD', cL='dog', tail='up', tailL=0.3, tailW=0.03, lw=0.025, thigh=0.05, paw='paw', attack=True),
  'wolf':     dict(L=0.75, legF=0.55, r=0.17, rh=0.22, neck=0.22, neckUp=30, head=0.3, hr=0.09, snout=0.48, ear=0.11, c='wolf', cD='wolfD', cL='wolfL', tail='bushy', tailL=0.42, tailW=0.035, mane='wolfD', lw=0.028, thigh=0.06, paw='paw', attack=True),
  'fox':      dict(L=0.42, legF=0.26, r=0.1, rh=0.12, neck=0.14, neckUp=40, head=0.18, hr=0.065, snout=0.42, ear=0.09, c='fox', cD='foxD', cL='foxL', legC='foxD', tail='bushy', tailL=0.38, tailW=0.035, tailTip='foxL', lw=0.018, thigh=0.04, paw='paw'),
  'bear':     dict(L=1.0, legF=0.55, legH=0.52, r=0.4, rh=0.45, neck=0.2, neckUp=15, head=0.36, hr=0.17, snout=0.45, ear=0.08, earType='round', c='bear', cD='bearD', cL='bearL', hump=0.12, tail='short', tailL=0.08, lw=0.08, thigh=0.13, paw='paw', pawC='bearD', attack=True, rear=True, swing=18),
  'raccoon':  dict(L=0.36, legF=0.18, r=0.13, rh=0.14, neck=0.08, neckUp=20, head=0.14, hr=0.07, snout=0.4, ear=0.06, earType='round', c='raccoon', cD='raccoonD', cL='raccoonL', mask='raccoonD', tail='bushy', tailL=0.3, tailW=0.035, rings='raccoonD', lw=0.02, thigh=0.04, paw='paw', rump=0.03),
  'rabbit':   dict(L=0.2, legF=0.1, legH=0.13, r=0.08, rh=0.09, neck=0.05, neckUp=50, head=0.1, hr=0.045, snout=0.6, ear=0.13, earType='long', c='rabbit', cD='rabbit', cL='rabbitL', tail='puff', tailL=0.05, tailW=0.025, lw=0.012, thigh=0.035, paw='paw', gait='bound', runSwing=50, rump=0.02),
  'squirrel': dict(L=0.14, legF=0.07, legH=0.08, r=0.045, rh=0.05, neck=0.03, neckUp=50, head=0.06, hr=0.028, snout=0.55, ear=0.03, c='squirrel', cD='squirrel', cL='squirrelL', tail='curl', tailL=0.16, tailW=0.025, lw=0.008, thigh=0.018, paw='paw', gait='bound', runSwing=50),
}
for name, S in KINDS.items():
    B, P, yb = quad(S); mk(name, B, P, quad_clips(S, yb), {})
S2 = dict(KINDS['deer'], antlers=True, L=0.9, r=0.21, rh=0.26)
B, P, yb = quad(S2); mk('deer_buck', B, P, quad_clips(S2, yb), {})

# ================= birds =================
def bird(S):
    L, r, h, c, cD, cL = S['L'], S['r'], S['legL'], S['c'], S.get('cD', S['c']), S.get('cL', S['c'])
    yb = h + r*0.8
    B = {'body': {'pivot': [0, yb, 0], 'tip': [0, yb, L/2]}}
    P = {'body': [loft([[0, yb + r*0.2, -L*0.55, 0, 0], [0, yb, -L*0.25, r*0.8, r*0.85], [0, yb + r*0.1, L*0.15, r, r], [0, yb + r*0.35, L*0.45, r*0.6, r*0.6]], c, ax='z', n=6),
                  frustum([[0, yb - r*0.55, -L*0.2, r*0.5, r*0.25], [0, yb - r*0.6, L*0.25, r*0.55, r*0.25]], cL, ax='z', caps=[False, False])]}
    if S.get('fan'):
        P['body'] += [tip([0, yb + r*0.3, -L*0.45], [math.sin(a)*S['fan'], yb + r*0.3 + math.cos(a)*S['fan'], -L*0.5], 0.05, 0.012, 'turkeyL' if i % 2 else c) for i, a in enumerate([k*0.35 - 1.4 for k in range(9)])]
    else:
        P['body'] += [hull([(-r*0.4, yb + r*0.15, -L*0.45), (r*0.4, yb + r*0.15, -L*0.45), (r*0.4, yb + r*0.25, -L*0.45), (-r*0.4, yb + r*0.25, -L*0.45),
                            (-r*0.55, yb + r*0.1 + S.get('tailUp', 0), -L*0.45 - S.get('tailL', L*0.3)), (r*0.55, yb + r*0.1 + S.get('tailUp', 0), -L*0.45 - S.get('tailL', L*0.3)), (r*0.55, yb + r*0.15 + S.get('tailUp', 0), -L*0.45 - S.get('tailL', L*0.3)), (-r*0.55, yb + r*0.15 + S.get('tailUp', 0), -L*0.45 - S.get('tailL', L*0.3))], cD)]
    nk = [0, yb + r*0.5, L*0.35]; hd = [0, nk[1] + S['neck'], nk[2] + S['neck']*S.get('neckFwd', 0.3)]
    B['neck'] = {'pivot': nk, 'tip': hd, 'parent': 'body'}
    P['neck'] = [seg(nk, hd, r*0.4, r*0.4, S.get('hr', r*0.35)*0.7, S.get('hr', r*0.35)*0.7, S.get('neckC', c))]
    hr = S.get('hr', r*0.35); bk = [0, hd[1] - hr*0.1, hd[2] + hr + S['beak']]
    B['head'] = {'pivot': hd, 'tip': bk, 'parent': 'neck'}
    P['head'] = [loft([[0, hd[1], hd[2] - hr*0.8, hr*0.6, hr*0.6], [0, hd[1] + hr*0.2, hd[2], hr, hr], [0, hd[1], hd[2] + hr*0.85, hr*0.6, hr*0.6]], S.get('headC', S.get('neckC', c)), ax='z', n=6),
                 tip([0, hd[1], hd[2] + hr*0.7], bk, hr*0.35 if not S.get('bill') else hr*0.5, hr*0.2, 'beak' if not S.get('beakC') else S['beakC'], ax='z'),
                 *[flat([(sx*hr*0.85, hd[1] + hr*0.2, hd[2] + hr*0.1), (sx*hr*0.85, hd[1] + hr*0.2, hd[2] + hr*0.35), (sx*hr*0.85, hd[1] + hr*0.42, hd[2] + hr*0.3), (sx*hr*0.85, hd[1] + hr*0.42, hd[2] + hr*0.1)], 'eye', (sx, 0, 0)) for sx in (1, -1)]]
    if S.get('wattle'): P['head'] += [tip([0, hd[1] - hr*0.3, hd[2] + hr*0.5], [0, hd[1] - hr*2.0, hd[2] + hr*0.4], hr*0.25, hr*0.15, 'wattle'), tip([0, hd[1] + hr*0.6, hd[2]], [0, hd[1] + hr*1.4, hd[2] + hr*0.3], hr*0.3, hr*0.1, S['wattle']) if S.get('comb') else tip([0, hd[1] + hr, hd[2] + hr*0.6], [0, hd[1] + hr*0.6, hd[2] + hr*1.4], hr*0.15, hr*0.15, 'wattle')]
    for sx, sd in ((1, 'l'), (-1, 'r')):
        # modelled spread out flat (span along X, trailing edge towards -Z); every clip that is not flying folds it against the flank (see FOLD)
        sh = [sx*r*0.8, yb + r*0.4, L*0.2]; sp = S['span']; ch0, ch1 = L*0.45, L*0.22
        B['wing_' + sd] = {'pivot': sh, 'tip': [sh[0] + sx*sp, sh[1], sh[2] - ch1], 'parent': 'body'}
        x0, x1 = sh[0], sh[0] + sx*sp
        P['wing_' + sd] = [hull([(x0, sh[1] - 0.006, sh[2]), (x1, sh[1] - 0.006, sh[2] - ch0*0.15), (x1, sh[1] - 0.006, sh[2] - ch0*0.15 - ch1), (x0, sh[1] - 0.006, sh[2] - ch0),
                                 (x0, sh[1] + 0.012, sh[2]), (x1, sh[1] + 0.004, sh[2] - ch0*0.15), (x1, sh[1] + 0.004, sh[2] - ch0*0.15 - ch1), (x0, sh[1] + 0.012, sh[2] - ch0)], cD)] + \
                           [tip([x0 + sx*sp*f, sh[1], sh[2] - ch0*0.15*f - (ch0 + (ch1 - ch0)*f)*0.95], [x0 + sx*sp*(f + 0.04), sh[1], sh[2] - ch0*0.15*f - (ch0 + (ch1 - ch0)*f) - L*0.12], 0.02 + r*0.05, 0.004, cL if S.get('tipL') else cD, ax='z') for f in (0.55, 0.75, 0.92)]
        hp = [sx*r*0.35, yb - r*0.5, 0.0]; ft = [sx*r*0.35, 0.0, 0.03]
        B['leg_' + sd] = {'pivot': hp, 'tip': ft, 'parent': 'body'}
        P['leg_' + sd] = [seg(hp, [ft[0], 0.02, ft[2]], 0.012 + r*0.06, 0.012 + r*0.06, 0.006 + r*0.03, 0.006 + r*0.03, S.get('legC', 'legY')),
                          *[tip([ft[0], 0.005, ft[2]], [ft[0] + sx*0.02*math.sin(a) + 0.0, 0.0, ft[2] + h*0.3*math.cos(a) + 0.01], 0.006 + r*0.02, 0.003, S.get('legC', 'legY'), ax='z') for a in (-0.5, 0.0, 0.5)]]
        if S.get('webbed'): P['leg_' + sd].append(flat([(ft[0] - 0.035, 0.004, ft[2]), (ft[0] + 0.035, 0.004, ft[2]), (ft[0] + 0.03, 0.004, ft[2] + h*0.35), (ft[0] - 0.03, 0.004, ft[2] + h*0.35)], S.get('legC', 'legY'), (0, 1, 0)))
    if S.get('stripe'): P['head'].append(flat([(-hr*0.9, hd[1] - hr*0.3, hd[2] - hr*0.5), (hr*0.9, hd[1] - hr*0.3, hd[2] - hr*0.5), (hr*0.9, hd[1] - hr*0.5, hd[2] - hr*0.3), (-hr*0.9, hd[1] - hr*0.5, hd[2] - hr*0.3)], S['stripe'], (0, -0.5, -1)))
    return B, P, yb
FOLD = {'wing_l': [-90, 0, 90], 'wing_r': [-90, 0, -90]}
def folded(frames):
    return [dict(FOLD, **f) for f in frames]
def bird_clips(S, yb):
    idle = [{'neck': [0, 12, 0], 'head': [0, 10, 0]}, {'neck': [0, -12, 0], 'head': [0, -10, 0]}]
    walk = [{'leg_l': [-25, 0, 0], 'leg_r': [25, 0, 0], 'neck': [-12, 0, 0], 'body': [0, 0, 4]}, {'leg_l': [0, 0, 0], 'leg_r': [0, 0, 0], 'neck': [12, 0, 0], 'root': [0, 0.02, 0]},
            {'leg_l': [25, 0, 0], 'leg_r': [-25, 0, 0], 'neck': [-12, 0, 0], 'body': [0, 0, -4]}, {'leg_l': [0, 0, 0], 'leg_r': [0, 0, 0], 'neck': [12, 0, 0], 'root': [0, 0.02, 0]}]
    run = [{'leg_l': [-40, 0, 0], 'leg_r': [40, 0, 0], 'body': [12, 0, 0], 'wing_l': [0, -30, 30], 'wing_r': [0, 30, -30]}, {'leg_l': [40, 0, 0], 'leg_r': [-40, 0, 0], 'body': [12, 0, 0], 'wing_l': [0, -30, 50], 'wing_r': [0, 30, -50], 'root': [0, 0.03, 0]}]
    peck = [{'neck': [60, 0, 0], 'head': [30, 0, 0], 'body': [15, 0, 0]}, {'neck': [20, 0, 0], 'head': [0, 0, 0], 'body': [8, 0, 0]}]
    alert = [{'neck': [-25, 0, 0], 'head': [-10, 30, 0]}, {'neck': [-25, 0, 0], 'head': [-10, -30, 0]}]
    fly = [{'wing_l': [0, 0, 45], 'wing_r': [0, 0, -45], 'leg_l': [70, 0, 0], 'leg_r': [70, 0, 0], 'body': [-8, 0, 0], 'root': [0, 1.5, 0]},
           {'wing_l': [0, 0, -35], 'wing_r': [0, 0, 35], 'leg_l': [70, 0, 0], 'leg_r': [70, 0, 0], 'body': [-8, 0, 0], 'root': [0, 1.5, 0]}]
    glide = [{'wing_l': [0, 0, 6], 'wing_r': [0, 0, -6], 'leg_l': [70, 0, 0], 'leg_r': [70, 0, 0], 'root': [0, 1.5, 0]}]
    die = [{'body': [0, 0, 80], 'root': [0, -yb*0.5, 0], 'wing_r': [-60, 0, -60], 'neck': [0, 0, 60], 'leg_l': [-30, 0, 0], 'leg_r': [-50, 0, 0], 'wing_l': [0, 0, 20]}]
    C = {'idle': folded(idle), 'walk': folded(walk), 'run': run, 'eat': folded(peck), 'peck': folded(peck), 'alert': folded(alert), 'fly': fly, 'glide': glide, 'die': die, 'dead': die}
    if S.get('swims'): C['float'] = folded([{'leg_l': [60, 0, 0], 'leg_r': [60, 0, 0], 'root': [0, -yb*0.75, 0]}, {'leg_l': [20, 0, 0], 'leg_r': [80, 0, 0], 'root': [0, -yb*0.75, 0], 'neck': [5, 6, 0]}])
    return C
BIRDS = {
  'turkey':  dict(L=0.55, r=0.2, legL=0.4, neck=0.24, neckFwd=0.2, hr=0.05, beak=0.03, c='turkey', cD='turkey', cL='turkeyL', neckC='pink', headC='pink', wattle=True, fan=0.42, span=0.55),
  'chicken': dict(L=0.3, r=0.12, legL=0.18, neck=0.12, neckFwd=0.3, hr=0.045, beak=0.025, c='chicken', cD='chicken', cL='chicken', wattle='comb', comb=True, span=0.25, tailUp=0.12, tailL=0.1),
  'duck':    dict(L=0.42, r=0.13, legL=0.08, neck=0.14, neckFwd=0.4, hr=0.05, beak=0.05, bill=True, c='duck', cD='duck', cL='duckL', neckC='duckH', headC='duckH', beakC='legY', stripe='duckL', span=0.35, webbed=True, legC='legY', swims=True),
  'goose':   dict(L=0.6, r=0.17, legL=0.16, neck=0.35, neckFwd=0.25, hr=0.05, beak=0.06, bill=True, c='goose', cD='goose', cL='gooseL', neckC='gooseD', headC='gooseD', beakC='gooseD', stripe='gooseL', span=0.6, webbed=True, legC='gooseD', swims=True),
  'pigeon':  dict(L=0.22, r=0.08, legL=0.06, neck=0.06, neckFwd=0.4, hr=0.035, beak=0.015, c='pigeon', cD='pigeonD', cL='pigeon', neckC='pigeonN', beakC='legD', legC='pink', span=0.25),
  'crow':    dict(L=0.32, r=0.09, legL=0.1, neck=0.06, neckFwd=0.5, hr=0.04, beak=0.04, c='crow', cD='crowL', cL='crow', beakC='crow', legC='crow', span=0.38),
}
for name, S in BIRDS.items():
    B, P, yb = bird(S); mk(name, B, P, bird_clips(S, yb), {})

# ================= fish =================
def fish(S):
    L, h, w, c, cL = S['L'], S['h'], S['w'], S['c'], S['cL']; y = h*0.8
    B = {'body': {'pivot': [0, y, 0], 'tip': [0, y, L*0.5]}, 'tail': {'pivot': [0, y, -L*0.25], 'tip': [0, y, -L*0.6], 'parent': 'body'}}
    P = {'body': [loft([[0, y, L*0.55, 0, 0], [0, y + h*0.05, L*0.4, w*0.6, h*0.6], [0, y + h*0.08, L*0.1, w, h], [0, y, -L*0.25, w*0.55, h*0.6]], c, ax='z', n=6),
                  frustum([[0, y - h*0.55, L*0.3, w*0.4, h*0.15], [0, y - h*0.55, -L*0.2, w*0.3, h*0.12]], cL, ax='z', caps=[False, False]),
                  flat([(0, y + h*0.9, L*0.05), (0, y + h*0.95, -L*0.12), (0, y + h*1.35, -L*0.05)], 'fin', (1, 0, 0), both=True),
                  *[flat([(sx*w*0.6, y - h*0.2, L*0.25), (sx*w*1.1, y - h*0.5, L*0.12), (sx*w*0.6, y - h*0.35, L*0.18)], 'fin', (sx, -1, 0)) for sx in (1, -1)],
                  *[flat([(sx*w*0.62, y + h*0.2, L*0.42), (sx*w*0.62, y + h*0.2, L*0.46), (sx*w*0.6, y + h*0.32, L*0.45), (sx*w*0.6, y + h*0.32, L*0.42)], 'eye', (sx, 0, 0)) for sx in (1, -1)]]}
    if S.get('stripe'): P['body'] += [flat([(sx*w*0.99, y - h*0.1, L*0.35 if sx > 0 else -L*0.2), (sx*w*0.99, y - h*0.1, -L*0.2 if sx > 0 else L*0.35), (sx*w*0.99, y + h*0.1, -L*0.2 if sx > 0 else L*0.35), (sx*w*0.99, y + h*0.1, L*0.35 if sx > 0 else -L*0.2)], S['stripe'], (sx, 0, 0)) for sx in (1, -1)]
    if S.get('whiskers'): P['body'] += [tip([sx*w*0.2, y - h*0.1, L*0.52], [sx*w*1.2, y - h*0.5, L*0.65], 0.006, 0.006, 'fin') for sx in (1, -1)]
    P['tail'] = [loft([[0, y, -L*0.25, w*0.5, h*0.55], [0, y, -L*0.4, w*0.25, h*0.25]], c, ax='z', n=6, caps=[False, False]),
                 hull([(0, y - h*0.2, -L*0.4), (0, y + h*0.2, -L*0.4), (0.002, y + h*0.2, -L*0.4), (0.002, y - h*0.2, -L*0.4), (0, y - h*0.8, -L*0.6), (0, y + h*0.8, -L*0.6), (0.002, y + h*0.8, -L*0.6), (0.002, y - h*0.8, -L*0.6)], 'fin')]
    C = {'idle': [{'tail': [0, 8, 0]}, {'tail': [0, -8, 0]}], 'swim': [{'tail': [0, 28, 0], 'body': [0, -6, 0]}, {'tail': [0, -28, 0], 'body': [0, 6, 0]}],
         'flop': [{'body': [0, 0, 90], 'tail': [0, 35, 0], 'root': [0, w - y, 0]}, {'body': [0, 0, 90], 'tail': [0, -35, 0], 'root': [0, w - y + 0.05, 0]}], 'die': [{'body': [0, 0, 90], 'root': [0, w - y, 0]}]}
    C['dead'] = C['die']; C['walk'] = C['swim']; C['run'] = C['swim']; C['eat'] = C['idle']; C['alert'] = C['idle']
    return {'bones': B, 'parts': P, 'clips': C}
FISH = {'trout': dict(L=0.4, h=0.07, w=0.04, c='trout', cL='troutL', stripe='troutS'), 'bass': dict(L=0.42, h=0.1, w=0.05, c='bass', cL='bassL'), 'catfish': dict(L=0.55, h=0.08, w=0.07, c='catfish', cL='catfishL', whiskers=True)}
for name, S in FISH.items():
    A[name] = fish(S); INFO[name] = {}

# ================= info: size, speed, behaviour and what each gives =================
def inf(height, length, walk, run, behaviour, flee=None, danger=0, health=40, gives=None, tool='knife', note=''):
    return {'height': height, 'length': length, 'walk': walk, 'run': run, 'behaviour': behaviour, 'fleeAt': flee, 'damage': danger, 'health': health, 'gives': gives or {}, 'tool': tool, 'note': note}
INFO.update({
  'deer': inf(1.1, 1.6, 1.4, 13, 'shy: grazes in groups at woods and park edges, at dawn and dusk; bolts from noise', 30, 0, 60, {'raw_meat': 6, 'hide': 1, 'bone': 3, 'fat': 1}),
  'deer_buck': inf(1.3, 1.7, 1.4, 13, 'as deer; charges if cornered', 25, 15, 80, {'raw_meat': 7, 'hide': 1, 'bone': 3, 'fat': 1, 'antler': 2}),
  'boar': inf(0.75, 1.3, 1.2, 9, 'grumpy: roots in woods and gardens; charges when shot or cornered', 12, 20, 90, {'raw_meat': 5, 'hide': 1, 'bone': 2, 'fat': 2}),
  'cow': inf(1.4, 2.2, 1.0, 6, 'calm: grazes in fields; walks off when hit; can be led with a rope to a base for milk', 6, 0, 150, {'raw_meat': 14, 'hide': 2, 'bone': 6, 'fat': 3}, note='a whole carcass is too heavy to carry: butcher it where it falls'),
  'sheep': inf(0.9, 1.1, 1.1, 7, 'flocks in fields; follows the flock', 15, 0, 45, {'raw_meat': 4, 'wool': 3, 'bone': 2, 'fat': 1}, note='can be shorn for wool without killing (shears)'),
  'goat': inf(0.85, 1.0, 1.2, 8, 'climbs onto rocks and walls; curious', 10, 5, 40, {'raw_meat': 3, 'hide': 1, 'bone': 2}),
  'dog': inf(0.6, 0.9, 1.4, 10, 'feral packs of 3 to 5 in town; circle and bite; one can be tamed with food', None, 10, 35, {'raw_meat': 2, 'hide': 1, 'bone': 1}),
  'wolf': inf(0.8, 1.3, 1.5, 15, 'hunts in packs at night beyond the town edge; follows blood', None, 18, 55, {'raw_meat': 3, 'pelt': 1, 'bone': 2}),
  'fox': inf(0.4, 0.8, 1.2, 12, 'alone, at night; steals food from bases; runs from people', 20, 0, 20, {'raw_meat': 1, 'pelt': 1}),
  'bear': inf(1.0, 1.9, 1.3, 14, 'rare, in the woods and at the dump; rears up as a warning, then charges', None, 45, 260, {'raw_meat': 12, 'pelt': 2, 'bone': 5, 'fat': 4}, tool='knife', note='rear is its warning'),
  'raccoon': inf(0.3, 0.7, 0.9, 6, 'raids bins and bases at night', 8, 2, 12, {'raw_meat': 1, 'pelt': 1}),
  'rabbit': inf(0.25, 0.35, 0.8, 11, 'grass and gardens; freezes, then bolts in zigzags; caught with snares', 12, 0, 6, {'raw_meat': 1, 'pelt': 1}, tool='hands'),
  'squirrel': inf(0.15, 0.4, 0.8, 7, 'parks and street trees; runs up trunks', 8, 0, 3, {'raw_meat': 1}, tool='hands'),
  'turkey': inf(0.8, 0.9, 1.0, 7, 'wild flocks at woods edges; runs more than it flies', 15, 0, 15, {'raw_meat': 3, 'feathers': 3, 'bone': 1}, tool='hands'),
  'chicken': inf(0.4, 0.4, 0.8, 4, 'loose from backyards; can be kept at a base for eggs', 4, 0, 5, {'raw_meat': 1, 'feathers': 2}, tool='hands'),
  'duck': inf(0.35, 0.5, 0.6, 3, 'ponds and rivers; flies off when approached', 10, 0, 6, {'raw_meat': 1, 'feathers': 2}, tool='hands'),
  'goose': inf(0.8, 0.8, 0.8, 4, 'parks and lakes; hisses and bites if you come close', None, 3, 12, {'raw_meat': 2, 'feathers': 3}, tool='hands'),
  'pigeon': inf(0.25, 0.3, 0.6, 3, 'everywhere in town; flocks take off together (a warning that something is coming)', 6, 0, 2, {'raw_meat': 1, 'feathers': 1}, tool='hands'),
  'crow': inf(0.35, 0.45, 0.7, 4, 'gathers round bodies and spoiled food; caws when people come', 10, 0, 3, {'feathers': 1}, tool='hands'),
  'trout': inf(0.1, 0.4, 0.6, 2, 'rivers and cold streams; caught with a rod', None, 0, 2, {'raw_fish': 2}, tool='knife'),
  'bass': inf(0.13, 0.42, 0.5, 2, 'lakes and ponds; caught with a rod', None, 0, 2, {'raw_fish': 2}, tool='knife'),
  'catfish': inf(0.1, 0.55, 0.4, 1.5, 'slow rivers and muddy ponds, on the bottom; caught at night', None, 0, 3, {'raw_fish': 3}, tool='knife'),
})

# ================= items: what animals give =================
IT = {}
IT['raw_meat'] = [hull([(-0.09, 0, -0.06), (0.1, 0, -0.07), (0.11, 0, 0.06), (-0.08, 0, 0.07), (-0.07, 0.035, -0.05), (0.08, 0.04, -0.05), (0.09, 0.035, 0.05), (-0.06, 0.03, 0.05)], 'meat'),
                  flat([(-0.08, 0.036, -0.04), (-0.02, 0.041, -0.05), (-0.03, 0.036, 0.05), (-0.07, 0.032, 0.04)], 'fat', (0, 1, 0)), flat([(0.03, 0.041, -0.02), (0.06, 0.041, -0.03), (0.07, 0.038, 0.02), (0.04, 0.038, 0.03)], 'meatL', (0, 1, 0))]
IT['cooked_meat'] = [dict(q, c={'meat': 'boarD', 'meatL': 'deerD', 'fat': 'deer'}[q['c']]) for q in IT['raw_meat']]
IT['raw_fish'] = [hull([(-0.03, 0, -0.12), (0.03, 0, -0.12), (0.035, 0, 0.12), (-0.035, 0, 0.12), (-0.025, 0.02, -0.11), (0.025, 0.02, -0.11), (0.03, 0.025, 0.11), (-0.03, 0.025, 0.11)], 'fillet')]
IT['hide'] = [hull([(-0.25, 0, -0.18), (0.25, 0, -0.2), (0.27, 0, 0.18), (-0.24, 0, 0.2), (-0.23, 0.05, -0.16), (0.23, 0.05, -0.18), (0.25, 0.06, 0.16), (-0.22, 0.05, 0.18)], 'hide'),
              flat([(-0.2, 0.051, -0.1), (0.2, 0.051, -0.12), (0.2, 0.061, 0.0), (-0.2, 0.051, 0.0)], 'hideIn', (0, 1, 0))]
IT['pelt'] = [flat([(-0.15, 0.01, -0.25), (0.15, 0.01, -0.25), (0.22, 0.01, -0.05), (0.15, 0.01, 0.2), (0.05, 0.01, 0.3), (-0.05, 0.01, 0.3), (-0.15, 0.01, 0.2), (-0.22, 0.01, -0.05)], 'fox', (0, 1, 0)),
              tip([0, 0.012, -0.24], [0.06, 0.012, -0.55], 0.05, 0.01, 'fox', ax='z'), tip([0.04, 0.013, -0.45], [0.07, 0.013, -0.56], 0.03, 0.008, 'foxL', ax='z')]
IT['feathers'] = [tip([x, 0.005, -0.08], [x + 0.02*i, 0.005, 0.12], 0.018, 0.003, 'feather' if i % 2 else 'featherL', ax='z') for i, x in enumerate((-0.04, -0.01, 0.02, 0.05))]
IT['bone'] = [seg([-0.12, 0.02, 0], [0.12, 0.02, 0], 0.015, 0.015, 0.015, 0.015, 'bone')] + [loft([[sx*0.115, 0.025, 0, 0.032, 0.032], [sx*0.155, 0.025, 0, 0.0, 0.0]], 'bone', ax='x', n=6) for sx in (1, -1)]
IT['fat'] = [loft([[0, 0, 0, 0.05, 0.05], [0, 0.09, 0, 0.05, 0.05]], 'fat', n=8), loft([[0, 0.09, 0, 0.055, 0.055], [0, 0.11, 0, 0.055, 0.055]], 'boarL', n=8)]
IT['antler'] = [seg([0, 0.02, -0.15], [0.05, 0.03, 0.12], 0.018, 0.018, 0.014, 0.014, 'antler'), tip([0.02, 0.03, -0.02], [0.12, 0.03, 0.05], 0.012, 0.012, 'antler'), tip([0.04, 0.03, 0.08], [0.1, 0.03, 0.2], 0.01, 0.01, 'antler')]
IT['wool'] = [loft([[0, 0.0, 0, 0.1, 0.08], [0, 0.07, 0, 0.12, 0.1], [0, 0.12, 0, 0.0, 0.0]], 'wool', n=7), loft([[0.08, 0.0, 0.05, 0.06, 0.05], [0.08, 0.06, 0.05, 0.0, 0.0]], 'woolD', n=6)]
IT['egg'] = [loft([[0, 0, 0, 0.0, 0.0], [0, 0.02, 0, 0.022, 0.022], [0, 0.045, 0, 0.0, 0.0]], 'fat', n=6)]
IT['meat_on_rack'] = [box([sx*0.7, 0.75, 0], [0.06, 1.5, 0.06], 'deerD') for sx in (1, -1)] + [box([0, 1.45, 0], [1.5, 0.05, 0.05], 'deerD')] + \
                     [hull([(x - 0.06, 1.0, -0.03), (x + 0.06, 1.0, -0.03), (x + 0.06, 1.0, 0.03), (x - 0.06, 1.0, 0.03), (x - 0.05, 1.42, -0.02), (x + 0.05, 1.42, -0.02), (x + 0.05, 1.42, 0.02), (x - 0.05, 1.42, 0.02)], 'meat' if i % 2 else 'boarD') for i, x in enumerate((-0.45, -0.15, 0.15, 0.45))]
ITEM_NOTE = ('items: raw_meat (cook it: cooked_meat), raw_fish (a fillet), hide (large animals: tan it into leather), pelt (fox, wolf, bear, raccoon, rabbit: warm clothing), feathers (arrows), '
             'bone (tools, arrowheads, glue), fat (tallow: candles, lamp fuel, soap), antler, wool (cloth), egg (chickens at a base). A carcass is the animal itself in its dead pose '
             '(clips.dead), with a ground decal of blood under it (aliens pack: blood decal); butcher it with the tool in info. meat_on_rack is meat drying on a rack (it keeps longer).')

pack = {'name': 'animals', 'version': 1, 'units': 'metres', 'facing': '+Z', 'palette': PALETTE, 'darker': 0.78, 'about': __doc__.split('\n', 2)[2],
        'creatures': {k: {'bones': v['bones'], 'clips': v['clips'], 'info': INFO.get(k, {})} for k, v in A.items()},
        'parts': {k: v['parts'] for k, v in A.items()}, 'items': IT, 'itemNote': ITEM_NOTE,
        'clipRule': ('Clips work like the aliens: per frame, turn each listed bone about its pivot by [x, y, z] degrees (X, then Y, then Z) on top of the rest pose, children carried along; '
                     "'root' moves the whole animal by [x, y, z] metres. Suggested speeds: walk 1 s for the four frames, run 0.4 s (deer) to 0.6 s (cow), idle and alert 2 s per frame, "
                     'eat 1.5 s per frame, die 0.6 s then hold dead, fly 0.25 s per beat, swim 0.5 s. Move the animal at info.walk or info.run metres a second.')}
if __name__ == '__main__':
    import os
    out, st = write_pack('animals', pack, __file__)
    print(os.path.getsize(out)//1024, 'KB')
    for k in A: print(k, st.get(k))
    for k in IT: print('item', k, st.get('items.' + k) if 'items.' + k in st else '')
