#!/usr/bin/env python3
"""Afterstreet alien pack, version 1 (18 October 2026). Our own designs, replacing the Bestiary stand-ins.
Writes assets/shaped/aliens.js. Run: python3 assets/shaped/src/aliens.py

Shape language: the survivors' language turned wrong. The same flat planes and tapering points, but limbs bend the wrong
way, knees rise above the body, heads are too small, and every alien ends in spikes and blades. Bodies are drab
(charcoal, bruise violet, slate) so they vanish into the night; only their eyes and vents glow (Somerville: muted world,
neon threats). Each one reads from its silhouette alone:
  swarmer  low and wide, four spider legs with knees above the back, a long tail spike
  stalker  impossibly tall and thin, hunched, arms that end in blades below the knee, a ragged cloak of skin
  giant    a huge wedge of shoulders on short legs, walking on its knuckles, a tiny head with three eyes, glowing vents
  nest     a cluster of pods with glowing seams and creeping tendrils, grown over a doorway or wall
Each alien lists bones (pivot, tip, parent) and clips: per frame, rotations in degrees [x, y, z] for the bones that move.
Pieces marked glow:true are drawn without lighting and should carry a small coloured light at night."""
from kit import *

PALETTE = {
  'hide': '#2c2a30', 'hideD': '#1d1b20', 'bruise': '#4a3a52', 'bone': '#b8ab94', 'slate': '#56606b', 'slateD': '#3d454e',
  'plate': '#262b31', 'eye': '#9cff6a', 'vent': '#5df2c0', 'pod': '#3b3242', 'podD': '#28212e', 'seam': '#b4ff73'
}
G = dict(glow=True)

def mk(bones, parts, clips, height, note):
    return {'bones': bones, 'parts': parts, 'clips': clips, 'height': height, 'about': note}

# ================= swarmer: low, wide, spider-legged =================
def swarmer():
    B = {'body': {'pivot': [0, 0.5, 0], 'tip': [0, 0.55, 0.35]},
         'head': {'pivot': [0, 0.56, 0.3], 'tip': [0, 0.52, 0.62], 'parent': 'body'},
         'jaw': {'pivot': [0, 0.5, 0.36], 'tip': [0, 0.42, 0.58], 'parent': 'head'},
         'tail': {'pivot': [0, 0.5, -0.33], 'tip': [0, 0.3, -0.95], 'parent': 'body'}}
    P = {'body': [frustum([[0, 0.5, -0.36, 0.12, 0.09], [0, 0.53, 0.0, 0.17, 0.12], [0, 0.55, 0.3, 0.15, 0.13]], 'hide', ax='z'),
                  *[tip([0, 0.6 + 0.02*i, z], [0, 0.72 + 0.03*i, z - 0.06], 0.035, 0.03, 'bone') for i, z in enumerate((-0.25, -0.1, 0.05, 0.2))]],
         'head': [frustum([[0, 0.56, 0.3, 0.1, 0.075], [0, 0.55, 0.46, 0.08, 0.06]], 'hideD', ax='z', caps=[True, False]),
                  tip([0, 0.55, 0.46], [0, 0.53, 0.64], 0.11, 0.085, 'hideD', ax='z'),
                  *[flat([(sg*0.072, 0.585, 0.36), (sg*0.072, 0.6, 0.45), (sg*0.066, 0.592, 0.47), (sg*0.068, 0.58, 0.38)], 'eye', (sg, 0, 0), **G) for sg in (1, -1)]],
         'jaw': [tip([0, 0.49, 0.36], [0, 0.42, 0.6], 0.08, 0.03, 'bruise', ax='z'),
                 *[tip([sg*0.04, 0.47, 0.5], [sg*0.03, 0.53, 0.52], 0.008, 0.008, 'bone') for sg in (1, -1)]],
         'tail': [loft([[0, 0.5, -0.33, 0.05, 0.04], [0, 0.42, -0.6, 0.035, 0.03], [0, 0.3, -0.95, 0, 0]], 'hide', n=4, ax='z', caps=[True, False])]}
    for leg, z0, zk, zf in (('f', 0.22, 0.42, 0.62), ('b', -0.22, -0.4, -0.6)):
        for sg, sd in ((1, 'l'), (-1, 'r')):
            hip, knee, foot = [sg*0.13, 0.52, z0], [sg*0.36, 0.78, zk], [sg*0.42, 0.0, zf]
            B['%sleg_%s' % (leg, sd)] = {'pivot': hip, 'tip': knee, 'parent': 'body'}
            B['%sshin_%s' % (leg, sd)] = {'pivot': knee, 'tip': foot, 'parent': '%sleg_%s' % (leg, sd)}
            P['%sleg_%s' % (leg, sd)] = [seg(hip, knee, 0.035, 0.03, 0.025, 0.022, 'hide')]
            P['%sshin_%s' % (leg, sd)] = [tip(knee, foot, 0.035, 0.03, 'hideD'), tip(knee, [knee[0] + sg*0.02, knee[1] + 0.1, knee[2]], 0.02, 0.02, 'bone')]
    walk = []
    for k in range(4):
        a = [18, 0, -18, 0][k]; b = [0, 18, 0, -18][k]
        walk.append({'fleg_l': [a, 0, 0], 'bleg_r': [a, 0, 0], 'fleg_r': [-a, 0, 0], 'bleg_l': [-a, 0, 0],
                     'fshin_l': [b, 0, 0], 'bshin_r': [b, 0, 0], 'fshin_r': [-b, 0, 0], 'bshin_l': [-b, 0, 0], 'tail': [0, [10, 0, -10, 0][k], 0], 'body': [0, 0, [2, 0, -2, 0][k]]})
    clips = {'idle': [{'jaw': [6, 0, 0], 'tail': [-6, 0, 0]}], 'walk': walk,
             'attack': [{'body': [-14, 0, 0], 'head': [-12, 0, 0], 'jaw': [10, 0, 0]}, {'body': [10, 0, 0], 'head': [16, 0, 0], 'jaw': [32, 0, 0], 'fleg_l': [-30, 0, 0], 'fleg_r': [-30, 0, 0]}, {'body': [4, 0, 0], 'jaw': [4, 0, 0]}],
             'dead': [{'body': [0, 0, 160], 'fleg_l': [40, 0, 0], 'fleg_r': [40, 0, 0], 'bleg_l': [-40, 0, 0], 'bleg_r': [-40, 0, 0], 'jaw': [30, 0, 0]}]}
    return mk(B, P, clips, 0.82, 'Small, numerous, weak alone. About 0.8 m tall and 1.5 m long, four spider legs with knees above the back, a tail spike.')

# ================= stalker: tall, thin, hunched, blade arms =================
def stalker():
    B = {'pelvis': {'pivot': [0, 1.18, 0], 'tip': [0, 1.4, 0.04]},
         'chest': {'pivot': [0, 1.4, 0.04], 'tip': [0, 1.85, 0.22], 'parent': 'pelvis'},
         'head': {'pivot': [0, 1.9, 0.26], 'tip': [0, 2.02, 0.46], 'parent': 'chest'}}
    P = {'pelvis': [frustum([[0, 1.1, 0.0, 0.12, 0.08], [0, 1.4, 0.04, 0.09, 0.07]], 'hide')],
         'chest': [frustum([[0, 1.38, 0.04, 0.09, 0.075], [0, 1.7, 0.14, 0.2, 0.1], [0, 1.9, 0.22, 0.24, 0.09]], 'hide'),
                   loft([[0, 1.86, 0.12, 0.32, 0.16], [0, 1.5, 0.0, 0.3, 0.17, None, [0, 0.04, -0.06, 0.05, -0.08, 0.03, -0.1]], [0, 1.2, -0.06, 0.24, 0.15, None, [0, -0.07, 0.05, -0.12, 0.04, -0.09, 0]]],
                        'bruise', ang=[150, 180, 210, 270, 330, 360, 390], closed=False, both=True, cin='hideD'),
                   *[tip([0, 1.6 + 0.12*i, 0.02 + 0.06*i], [0, 1.66 + 0.12*i, -0.12 + 0.06*i], 0.03, 0.03, 'bone') for i in range(3)]],
         'head': [frustum([[0, 1.9, 0.26, 0.05, 0.05], [0, 1.98, 0.36, 0.055, 0.06]], 'hideD', caps=[True, False]), tip([0, 1.98, 0.36], [0, 2.0, 0.55], 0.07, 0.08, 'hideD', ax='z'),
                  flat([(-0.008, 1.96, 0.445), (0.008, 1.96, 0.445), (0.006, 2.02, 0.43), (-0.006, 2.02, 0.43)], 'eye', (0, 0.2, 1), **G),
                  *[flat([(sg*0.035, 1.975, 0.41), (sg*0.05, 1.975, 0.4), (sg*0.048, 1.99, 0.395), (sg*0.034, 1.99, 0.405)], 'eye', (sg*0.4, 0.2, 1), **G) for sg in (1, -1)]]}
    for sg, sd in ((1, 'l'), (-1, 'r')):
        sh, el, wr, bl = [sg*0.22, 1.86, 0.18], [sg*0.34, 1.36, 0.24], [sg*0.3, 0.86, 0.32], [sg*0.27, 0.32, 0.44]
        hp, kn, hk, ft = [sg*0.11, 1.12, 0.0], [sg*0.15, 0.68, 0.24], [sg*0.15, 0.3, -0.14], [sg*0.15, 0.0, 0.16]
        for nm, a, b, par in (('arm', sh, el, 'chest'), ('fore', el, wr, 'arm'), ('blade', wr, bl, 'fore'), ('thigh', hp, kn, 'pelvis'), ('shin', kn, hk, 'thigh'), ('foot', hk, ft, 'shin')):
            B['%s_%s' % (nm, sd)] = {'pivot': a, 'tip': b, 'parent': par if par in ('chest', 'pelvis') else '%s_%s' % (par, sd)}
        P['arm_' + sd] = [seg(sh, el, 0.04, 0.04, 0.028, 0.03, 'hide')]
        P['fore_' + sd] = [seg(el, wr, 0.03, 0.03, 0.022, 0.024, 'hide')]
        P['blade_' + sd] = [tip(wr, bl, 0.012, 0.05, 'bone')]
        P['thigh_' + sd] = [seg(hp, kn, 0.055, 0.06, 0.035, 0.04, 'hide')]
        P['shin_' + sd] = [seg(kn, hk, 0.035, 0.04, 0.025, 0.03, 'hideD'), tip(kn, [kn[0], kn[1] + 0.06, kn[2] + 0.1], 0.02, 0.02, 'bone')]
        P['foot_' + sd] = [tip(hk, ft, 0.03, 0.025, 'hideD')]
    walk = []
    for k in range(4):
        s = [1, 0, -1, 0][k]; c = [0, 1, 0, -1][k]
        walk.append({'thigh_l': [-22*s, 0, 0], 'thigh_r': [22*s, 0, 0], 'shin_l': [12*max(0, c), 0, 0], 'shin_r': [12*max(0, -c), 0, 0],
                     'arm_l': [14*s, 0, 0], 'arm_r': [-14*s, 0, 0], 'chest': [0, 6*s, 0], 'head': [0, -8*s, 4*c]})
    clips = {'idle': [{'head': [6, 18, 0], 'arm_l': [-6, 0, 0]}], 'walk': walk,
             'attack': [{'arm_r': [-70, 0, -10], 'fore_r': [-40, 0, 0], 'chest': [-8, -10, 0]}, {'arm_r': [40, 0, 10], 'fore_r': [10, 0, 0], 'blade_r': [20, 0, 0], 'chest': [16, 12, 0]}, {'arm_r': [10, 0, 0]}],
             'dead': [{'pelvis': [-80, 0, 0], 'thigh_l': [70, 0, 0], 'thigh_r': [60, 0, 0], 'arm_l': [-60, 0, 30], 'arm_r': [-40, 0, -40], 'head': [20, 0, 0]}]}
    return mk(B, P, clips, 2.05, 'Rare hunter, about 2.1 m hunched (2.5 m upright). Legs bend the wrong way, arms end in bone blades below the knee, a ragged cloak of skin.')

# ================= giant: a wedge of shoulders on knuckles =================
def giant():
    B = {'pelvis': {'pivot': [0, 1.7, -0.5], 'tip': [0, 2.2, -0.3]},
         'chest': {'pivot': [0, 2.0, -0.4], 'tip': [0, 3.4, 0.4], 'parent': 'pelvis'},
         'head': {'pivot': [0, 3.05, 0.72], 'tip': [0, 3.2, 1.1], 'parent': 'chest'}}
    vents = []
    for i, (y, z) in enumerate(((2.55, -0.62), (2.85, -0.44), (3.15, -0.24))):
        vents.append(box([0, y, z], [0.9 - 0.12*i, 0.06, 0.04], 'vent', **G))
    P = {'pelvis': [frustum([[0, 1.45, -0.55, 0.42, 0.34], [0, 2.1, -0.45, 0.48, 0.38]], 'slateD')],
         'chest': [frustum([[0, 1.95, -0.45, 0.46, 0.4], [0, 2.85, 0.0, 1.0, 0.62], [0, 3.2, 0.25, 0.92, 0.5], [0, 3.55, 0.25, 0.45, 0.32]], 'slate'),
                   *[tip([sg*0.4, 3.0 + 0.1*k, -0.3 + 0.25*k], [sg*0.55, 3.5 + 0.1*k, -0.55 + 0.25*k], 0.1, 0.1, 'plate') for sg in (1, -1) for k in range(3)],
                   frustum([[0, 2.4, -0.82, 0.62, 0.06], [0, 3.2, -0.4, 0.7, 0.06]], 'plate'), *vents],
         'head': [frustum([[0, 2.98, 0.66, 0.2, 0.18], [0, 3.18, 0.98, 0.16, 0.14]], 'slateD'),
                  *[flat([(x - 0.03, y - 0.022, 1.124), (x + 0.03, y - 0.022, 1.124), (x + 0.03, y + 0.022, 1.124), (x - 0.03, y + 0.022, 1.124)], 'eye', **G) for x, y in ((-0.07, 3.08), (0.07, 3.08), (0.0, 3.14))]]}
    for sg, sd in ((1, 'l'), (-1, 'r')):
        sh, el, wr, fs = [sg*0.98, 3.0, 0.2], [sg*1.28, 1.95, 0.5], [sg*1.22, 0.75, 0.85], [sg*1.18, 0.0, 1.0]
        hp, kn, ft = [sg*0.38, 1.6, -0.55], [sg*0.5, 0.85, -0.25], [sg*0.5, 0.0, -0.5]
        for nm, a, b, par in (('arm', sh, el, 'chest'), ('fore', el, wr, 'arm'), ('fist', wr, fs, 'fore'), ('thigh', hp, kn, 'pelvis'), ('shin', kn, ft, 'thigh')):
            B['%s_%s' % (nm, sd)] = {'pivot': a, 'tip': b, 'parent': par if par in ('chest', 'pelvis') else '%s_%s' % (par, sd)}
        P['arm_' + sd] = [seg(sh, el, 0.3, 0.32, 0.22, 0.24, 'slate'), tip([sh[0], sh[1] + 0.1, sh[2]], [sh[0] + sg*0.25, sh[1] + 0.55, sh[2] - 0.2], 0.12, 0.12, 'plate')]
        P['fore_' + sd] = [seg(el, wr, 0.26, 0.28, 0.3, 0.3, 'slate')]
        P['fist_' + sd] = [seg(wr, [fs[0], 0.18, fs[2]], 0.3, 0.3, 0.26, 0.28, 'slateD'), *[tip([fs[0] + sg*0.12*j, 0.2, fs[2] + 0.18], [fs[0] + sg*0.14*j, 0.02, fs[2] + 0.42], 0.06, 0.06, 'bone') for j in (-1, 0, 1)]]
        P['thigh_' + sd] = [seg(hp, kn, 0.26, 0.28, 0.2, 0.22, 'slateD')]
        P['shin_' + sd] = [seg(kn, [ft[0], 0.12, ft[2]], 0.2, 0.22, 0.24, 0.26, 'slateD'), box([ft[0], 0.06, ft[2] + 0.1], [0.5, 0.12, 0.62], 'plate')]
    walk = []
    for k in range(4):
        s = [1, 0, -1, 0][k]
        walk.append({'arm_l': [-18*s, 0, 0], 'arm_r': [18*s, 0, 0], 'thigh_l': [14*s, 0, 0], 'thigh_r': [-14*s, 0, 0], 'chest': [0, 0, 5*s], 'head': [0, -6*s, 0]})
    clips = {'idle': [{'chest': [4, 0, 0], 'head': [0, 12, 0]}], 'walk': walk,
             'attack': [{'arm_r': [-110, 0, 10], 'fore_r': [-20, 0, 0], 'chest': [-12, -14, 0]}, {'arm_r': [20, 0, 0], 'fore_r': [0, 0, 0], 'chest': [18, 10, 0]}, {'arm_r': [6, 0, 0]}],
             'dead': [{'pelvis': [0, 0, -84], 'arm_l': [0, 0, 60], 'arm_r': [-30, 0, 0], 'head': [0, 0, 20]}]}
    return mk(B, P, clips, 3.6, 'Huge and rare, about 3.6 m tall on its knuckles and 2.6 m wide at the shoulders. A tiny head with three eyes, glowing vents down its back.')

# ================= nest: pods over a doorway or wall =================
def nest():
    pods = []
    for x, z, h, r in ((0.0, 0.0, 1.1, 0.3), (0.45, 0.2, 0.8, 0.24), (-0.5, 0.15, 0.9, 0.26), (0.25, -0.4, 0.6, 0.2), (-0.3, -0.45, 0.7, 0.22), (0.75, -0.25, 0.5, 0.16)):
        pods.append(loft([[x, 0.0, z, r*0.9, r*0.9], [x, h*0.45, z, r, r], [x, h*0.85, z, r*0.6, r*0.6], [x, h, z, 0, 0]], 'pod', n=6, caps=[False, False]))
        pods.append(flat([(x - 0.02, h*0.2, z + r*0.95), (x + 0.02, h*0.2, z + r*0.95), (x + 0.015, h*0.75, z + r*0.7), (x - 0.015, h*0.75, z + r*0.7)], 'seam', (0, 0, 1), **G))
    tendrils = [tip([x*0.5, 0.05, z*0.5], [x, 0.02, z], 0.07, 0.03, 'podD') for x, z in ((1.6, 0.4), (-1.5, 0.7), (0.4, 1.4), (-0.6, -1.3), (1.2, -1.1), (-1.4, -0.5))]
    wall = [tip([x, 0.4, -0.5], [x*1.3, y, -0.62], 0.06, 0.04, 'podD') for x, y in ((0.3, 2.4), (-0.4, 2.2), (0.8, 1.6), (-0.9, 1.4))]
    return {'bones': {'root': {'pivot': [0, 0, 0], 'tip': [0, 1, 0]}}, 'parts': {'root': pods + tendrils + wall}, 'clips': {'idle': [{}]}, 'height': 2.4,
            'about': 'Takes over buildings and spreads. Placed at a doorway or against a wall (-Z); seams glow and pulse at night.'}

pack = {
  'name': 'aliens', 'version': 1, 'style': 'the survivors\' shape language turned wrong: flat planes and points, wrong-way joints, drab bodies, glowing eyes and vents',
  'units': 'metres', 'facing': '+Z', 'palette': PALETTE,
  'about': 'Our own alien designs and rigs, replacing the Bestiary stand-ins and their skeletons. Each has bones (pivot, tip, parent), parts per bone, and clips '
           '(idle, walk, attack, dead, as the game uses today): '
           'per frame, rotations in degrees [x, y, z] about each bone pivot (order X, then Y, then Z, child bones carried along). '
           'The game can bake each frame into a pose, as it does for the Bestiary models today, and play walk at about 4 frames a second, faster for the swarmer. '
           'Eyes, vents and seams are separate pieces marked glow:true: draw them unlit (emissive).',
  'parts': {'swarmer': None, 'stalker': None, 'giant': None, 'nest': None}
}
def scaled(C, k):
    """the whole creature (bones, pieces, height) made k times bigger; clips (angles) are unchanged"""
    sp = lambda v: [R4(x*k) for x in v]
    def one(q):
        q = dict(q); q['p'] = sp(q['p'])
        if 'd' in q: q['d'] = sp(q['d'])
        if 'v' in q: q['v'] = [sp(v) for v in q['v']]
        if 'r' in q: q['r'] = [sp(r[:5]) + r[5:6] + ([sp(r[6])] if len(r) > 6 else []) for r in q['r']]
        return q
    C = dict(C); C['bones'] = {b: dict(B, pivot=sp(B['pivot']), tip=sp(B['tip'])) for b, B in C['bones'].items()}
    C['parts'] = {b: [one(q) for q in ps] for b, ps in C['parts'].items()}; C['height'] = round(C['height']*k, 2)
    C['about'] = C['about'].replace('0.8 m tall and 1.5 m', '0.9 m tall and 1.65 m').replace('2.1 m hunched (2.5 m upright)', '2.2 m hunched (2.7 m upright)').replace('3.6 m tall on its knuckles and 2.6 m', '4 m tall on its knuckles and 2.9 m')
    return C
A = {'swarmer': scaled(swarmer(), 1.1), 'stalker': scaled(stalker(), 1.075), 'giant': scaled(giant(), 1.11), 'nest': nest()}
pack['parts'] = {k: v['parts'] for k, v in A.items()}
pack['creatures'] = {k: {kk: vv for kk, vv in v.items() if kk != 'parts'} for k, v in A.items()}
out, st = write_pack('aliens', pack, __file__)
for k, v in st.items(): print(k, v)
