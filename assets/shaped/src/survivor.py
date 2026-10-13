#!/usr/bin/env python3
"""Afterstreet shaped survivor pack: every character creator choice as shaped pieces, per skeleton bone.
Writes assets/shaped/survivor.js. Run: python3 assets/shaped/src/survivor.py
Coordinates are metres in a reference pose (standing, arms down, facing +Z, the survivor's left is +X).
Each bone lists its pivot (joint) and tip (next joint) so the game can fit the pieces to its own skeleton:
turn each bone's group so pivot->tip matches the game skeleton's bone, stretch it along that line to the same length,
and move it onto the game's joint."""
import json, os

def P(s, p, d, c, **k):
    if s == 'bev' and min(d) < 0.05: s = 'box'   # a bevel this thin cannot be seen; a plain box is 32 triangles cheaper
    o = {'s': s, 'p': [round(v, 4) for v in p], 'd': [round(v, 4) for v in d], 'c': c}
    o.update(k); return o
def mirror(pieces):
    out = []
    for q in pieces:
        m = dict(q); m['p'] = [-q['p'][0], q['p'][1], q['p'][2]]; out.append(m)
    return out
def sided(fn):
    """fn(sign, side) -> {bone: [pieces]} for the left (+X) side; returns both sides"""
    out = {}
    for sg, sd in ((1, 'l'), (-1, 'r')):
        for b, ps in fn(sg, sd).items(): out.setdefault(b, []).extend(ps)
    return out
def merge(*dicts):
    out = {}
    for d in dicts:
        for b, ps in d.items(): out.setdefault(b, []).extend(ps)
    return out

# ---------------- skeleton (reference pose) ----------------
AX = 0.29; LX = 0.11
BONES = {
  'pelvis':   {'pivot': [0, 0.80, 0], 'tip': [0, 0.88, 0]},
  'spine_01': {'pivot': [0, 0.88, 0], 'tip': [0, 1.00, 0], 'parent': 'pelvis'},
  'spine_02': {'pivot': [0, 1.00, 0], 'tip': [0, 1.12, 0], 'parent': 'spine_01'},
  'spine_03': {'pivot': [0, 1.12, 0], 'tip': [0, 1.29, 0], 'parent': 'spine_02'},
  'neck_01':  {'pivot': [0, 1.29, 0], 'tip': [0, 1.34, 0], 'parent': 'spine_03'},
  'Head':     {'pivot': [0, 1.34, 0], 'tip': [0, 1.72, 0], 'parent': 'neck_01'},
}
for sg, sd in ((1, 'l'), (-1, 'r')):
    BONES['upperarm_' + sd] = {'pivot': [sg*AX, 1.24, 0], 'tip': [sg*AX, 1.00, 0], 'parent': 'spine_03'}
    BONES['lowerarm_' + sd] = {'pivot': [sg*AX, 1.00, 0], 'tip': [sg*AX, 0.78, 0], 'parent': 'upperarm_' + sd}
    BONES['hand_' + sd]     = {'pivot': [sg*AX, 0.78, 0], 'tip': [sg*AX, 0.66, 0], 'parent': 'lowerarm_' + sd}
    BONES['thigh_' + sd]    = {'pivot': [sg*LX, 0.76, 0], 'tip': [sg*LX, 0.44, 0], 'parent': 'pelvis'}
    BONES['calf_' + sd]     = {'pivot': [sg*LX, 0.44, 0], 'tip': [sg*LX, 0.11, 0], 'parent': 'thigh_' + sd}
    BONES['foot_' + sd]     = {'pivot': [sg*LX, 0.11, 0], 'tip': [sg*LX, 0.04, 0.10], 'parent': 'calf_' + sd}
    BONES['ball_' + sd]     = {'pivot': [sg*LX, 0.04, 0.10], 'tip': [sg*LX, 0.04, 0.19], 'parent': 'foot_' + sd}

# ---------------- colours ----------------
PALETTE = {
  'eye': '#1b1b1f', 'white': '#ece6da', 'lip': '#a8574a', 'freckle': '#b06a45', 'scar': '#c98472',
  'frame': '#2a2724', 'shades': '#121316', 'metal': '#9aa0a7', 'metalD': '#55595f',
  'belt': '#3a2a20', 'buckle': '#c8a24a', 'helmet': '#5d6b3a', 'helmetD': '#46512b', 'strap': '#2f2a22',
  'trainer': '#e9e2d4', 'gum': '#b9874f', 'boot': '#5b3b26', 'bootD': '#3e271a', 'rainboot': '#d8a83a', 'rainbootD': '#a87f22',
  'sole': '#2a2522', 'lace': '#f2ede2', 'pack': '#8a5a32', 'packD': '#6b4426', 'roll': '#6e7f8f', 'denimRoll': '#7c93b4'
}
SLOTS = {
  'SKIN':  ['#f1c9a5', '#e0a982', '#c68a5e', '#9a6440', '#6b4430'],
  'HAIR':  ['#23201e', '#5a3a24', '#8e3f22', '#d8b56a', '#a8a6a2'],
  'SHIRT': 'player colour (default #3566c4)', 'PANTS': 'player colour (default #2b2f38)', 'ACC': 'player second colour (default #e9dab0)'
}

# ---------------- body: head, neck, hands (always there) ----------------
def body(fem):
    head = [P('bev', [0, 1.525, 0], [0.38, 0.38, 0.36], 'SKIN'),
            P('box', [0.195, 1.505, -0.01], [0.03, 0.08, 0.06], 'SKIN_D'), P('box', [-0.195, 1.505, -0.01], [0.03, 0.08, 0.06], 'SKIN_D'),
            P('box', [0, 1.47, 0.19], [0.05, 0.06, 0.045], 'SKIN_D')]
    neck = [P('cyl', [0, 1.315, 0], [0.15 if not fem else 0.13, 0.08, 0.14], 'SKIN_D')]
    def hands(sg, sd):
        return {'hand_' + sd: [P('bev', [sg*AX, 0.72, 0], [0.1, 0.12, 0.12], 'SKIN'), P('box', [sg*(AX-0.055), 0.745, 0.04], [0.03, 0.05, 0.04], 'SKIN')]}
    return merge({'Head': head, 'neck_01': neck}, sided(hands))

# ---------------- torso and limb shapes per body type ----------------
def dims(fem):
    return dict(chestW=0.39 if fem else 0.44, chestD=0.25 if fem else 0.26, bellyW=0.35 if fem else 0.40, bellyD=0.23 if fem else 0.24,
                hipW=0.40 if fem else 0.38, hipD=0.23 if fem else 0.22, armW=0.125 if fem else 0.14, foreW=0.11 if fem else 0.12,
                thighW=0.165 if fem else 0.16, calfW=0.14 if fem else 0.15, shX=AX if not fem else AX-0.01)

def torso(fem, col, colB=None, grow=0.0):
    D = dims(fem); g = grow
    return {'spine_03': [P('bev', [0, 1.175, 0], [D['chestW']+g, 0.25+g/2, D['chestD']+g], col)],
            'spine_01': [P('bev', [0, 0.96, 0], [D['bellyW']+g, 0.21, D['bellyD']+g], colB or col)]}
def shoulders(fem, col, grow=0.0):
    D = dims(fem)
    return sided(lambda sg, sd: {'upperarm_' + sd: [P('bev', [sg*D['shX'], 1.245, 0], [0.16+grow, 0.08, 0.18+grow], col)]})
def arms(fem, upper, lower, short=False, cuff=None):
    D = dims(fem)
    def f(sg, sd):
        x = sg*D['shX']
        if short:
            up = [P('cyl', [x, 1.165, 0], [D['armW']+0.015, 0.17, D['armW']+0.025], upper), P('cyl', [x, 1.05, 0], [D['armW']-0.015, 0.11, D['armW']-0.005], 'SKIN')]
        else:
            up = [P('cyl', [x, 1.12, 0], [D['armW'], 0.26, D['armW']+0.01], upper)]
        lo = [P('cyl', [x, 0.89, 0], [D['foreW'], 0.23, D['foreW']+0.01], lower)]
        if cuff: lo.append(P('cyl', [x, 0.795, 0], [D['foreW']+0.015, 0.035, D['foreW']+0.025], cuff))
        return {'upperarm_' + sd: up, 'lowerarm_' + sd: lo}
    return sided(f)
def hem(fem, col, y=0.87):
    D = dims(fem); return {'spine_01': [P('box', [0, y, 0], [D['bellyW']+0.012, 0.03, D['bellyD']+0.012], col)]}

# ---------------- tops ----------------
def tops(fem):
    D = dims(fem); fz = D['chestD']/2; bz = D['bellyD']/2
    T = {}
    T['tshirt'] = merge(torso(fem, 'SHIRT'), shoulders(fem, 'SHIRT'), arms(fem, 'SHIRT', 'SKIN', short=True), hem(fem, 'SHIRT_D'),
                        {'spine_03': [P('box', [0, 1.285, 0.02], [0.17, 0.025, 0.13], 'SKIN_D')]})
    stripes = {'spine_03': [P('box', [0, y, 0], [D['chestW']+0.006, 0.032, D['chestD']+0.006], 'ACC') for y in (1.25, 1.17, 1.09)],
               'spine_01': [P('box', [0, y, 0], [D['bellyW']+0.006, 0.032, D['bellyD']+0.006], 'ACC') for y in (1.0, 0.92)]}
    T['striped_tee'] = merge(T['tshirt'], stripes, sided(lambda sg, sd: {'upperarm_' + sd: [P('cyl', [sg*D['shX'], 1.13, 0], [D['armW']+0.02, 0.03, D['armW']+0.03], 'ACC')]}))
    check = {'spine_03': [P('box', [0, y, 0], [D['chestW']+0.006, 0.035, D['chestD']+0.006], 'ACC') for y in (1.23, 1.11)] +
                         [P('box', [x, 1.175, 0], [0.035, 0.252, D['chestD']+0.008], 'SHIRT_D') for x in (-0.12, 0.12)],
             'spine_01': [P('box', [0, 0.99, 0], [D['bellyW']+0.006, 0.035, D['bellyD']+0.006], 'ACC')] +
                         [P('box', [x, 0.96, 0], [0.035, 0.212, D['bellyD']+0.008], 'SHIRT_D') for x in (-0.11, 0.11)]}
    T['flannel_shirt'] = merge(torso(fem, 'SHIRT'), shoulders(fem, 'SHIRT'), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D'), check,
                               {'spine_03': [P('box', [0, 1.17, fz+0.006], [0.03, 0.24, 0.012], 'SHIRT_D'),
                                             P('wedge', [0.06, 1.285, fz-0.02], [0.1, 0.045, 0.07], 'SHIRT_D', fy=True), P('wedge', [-0.06, 1.285, fz-0.02], [0.1, 0.045, 0.07], 'SHIRT_D', fy=True)],
                                'spine_01': [P('box', [0, 0.97, bz+0.006], [0.03, 0.2, 0.012], 'SHIRT_D')]})
    spots = {'spine_03': [P('box', [x, y, fz+0.004], [0.045, 0.045, 0.01], 'ACC') for x, y in ((-0.12, 1.22), (0.08, 1.24), (0.13, 1.12), (-0.05, 1.1), (0.0, 1.2))] +
                         [P('box', [x, y, -fz-0.004], [0.045, 0.045, 0.01], 'ACC') for x, y in ((0.1, 1.2), (-0.1, 1.14))],
             'spine_01': [P('box', [x, y, bz+0.004], [0.045, 0.045, 0.01], 'ACC') for x, y in ((-0.09, 0.98), (0.1, 0.94))]}
    T['spotted_top'] = merge(T['tshirt'], spots)
    T['hoodie'] = merge(torso(fem, 'SHIRT', grow=0.015), shoulders(fem, 'SHIRT', grow=0.01), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D'), hem(fem, 'SHIRT_D', 0.865),
                        {'spine_03': [P('bev', [0, 1.29, -0.12], [0.3, 0.12, 0.13], 'SHIRT_D'),
                                      P('box', [0.045, 1.2, fz+0.012], [0.012, 0.1, 0.01], 'ACC'), P('box', [-0.045, 1.2, fz+0.012], [0.012, 0.1, 0.01], 'ACC')],
                         'spine_01': [P('bev', [0, 0.95, bz+0.012], [0.24, 0.1, 0.025], 'SHIRT_D')]})
    T['open_jacket'] = merge(torso(fem, 'SHIRT'), shoulders(fem, 'SHIRT_D'), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D'),
                             {'spine_03': [P('box', [0, 1.165, fz+0.004], [0.12, 0.25, 0.012], 'ACC'),
                                           P('wedge', [0.085, 1.27, fz], [0.08, 0.05, 0.04], 'SHIRT_D', fy=True), P('wedge', [-0.085, 1.27, fz], [0.08, 0.05, 0.04], 'SHIRT_D', fy=True)],
                              'spine_01': [P('box', [0, 0.97, bz+0.004], [0.11, 0.2, 0.012], 'ACC'),
                                           P('box', [0.12, 0.93, bz+0.006], [0.08, 0.06, 0.012], 'SHIRT_D'), P('box', [-0.12, 0.93, bz+0.006], [0.08, 0.06, 0.012], 'SHIRT_D')]})
    T['jumper'] = merge(torso(fem, 'SHIRT', grow=0.01), shoulders(fem, 'SHIRT'), arms(fem, 'SHIRT', 'SHIRT', cuff='SHIRT_D'), hem(fem, 'SHIRT_D', 0.865),
                        {'spine_03': [P('box', [0, 1.155, 0], [D['chestW']+0.018, 0.06, D['chestD']+0.018], 'ACC'),
                                      P('cyl', [0, 1.295, 0], [0.18, 0.03, 0.15], 'SHIRT_D')] +
                                     [P('box', [x, 1.155, fz+0.014], [0.03, 0.03, 0.01], 'SHIRT') for x in (-0.13, -0.065, 0.0, 0.065, 0.13)]})
    T['dungarees'] = merge(torso(fem, 'ACC'), shoulders(fem, 'ACC'), arms(fem, 'ACC', 'SKIN', short=True), hem(fem, 'PANTS', 0.875),
                           {'spine_03': [P('box', [0, 1.12, fz+0.008], [0.26, 0.17, 0.02], 'PANTS'), P('box', [0, 1.13, fz+0.02], [0.1, 0.07, 0.008], 'PANTS_D')] +
                                        [P('box', [x, 1.22, fz+0.006], [0.04, 0.12, 0.012], 'PANTS') for x in (-0.09, 0.09)] +
                                        [P('box', [x, 1.21, -fz-0.006], [0.04, 0.16, 0.012], 'PANTS') for x in (-0.09, 0.09)] +
                                        [P('box', [x, 1.195, fz+0.018], [0.025, 0.025, 0.01], 'metal') for x in (-0.09, 0.09)],
                            'spine_01': [P('bev', [0, 0.96, 0], [D['bellyW']+0.01, 0.21, D['bellyD']+0.01], 'PANTS')]})
    return T

# ---------------- bottoms ----------------
def bottoms(fem):
    D = dims(fem)
    hips = lambda col: {'pelvis': [P('bev', [0, 0.80, 0], [D['hipW'], 0.14, D['hipD']], col), P('box', [0, 0.855, 0], [D['hipW']+0.01, 0.035, D['hipD']+0.01], 'belt'),
                                   P('box', [0, 0.855, D['hipD']/2+0.006], [0.05, 0.03, 0.01], 'buckle')]}
    def legs(thigh, calf, calf_lo=None, cuff=None):
        def f(sg, sd):
            x = sg*LX; o = {'thigh_' + sd: [P('bev', [x, 0.60, 0], [D['thighW'], 0.33, D['thighW']+0.02], thigh)]}
            if calf_lo: o['calf_' + sd] = [P('bev', [x, 0.355, 0], [D['calfW']+0.005, 0.17, D['calfW']+0.025], calf), P('bev', [x, 0.19, 0], [D['calfW']-0.02, 0.17, D['calfW']], calf_lo)]
            else: o['calf_' + sd] = [P('bev', [x, 0.275, 0], [D['calfW'], 0.33, D['calfW']+0.02], calf)]
            if cuff: o['calf_' + sd].append(P('bev', [x, cuff[0], 0], [D['calfW']+0.02, cuff[1], D['calfW']+0.04], cuff[2]))
            return o
        return sided(f)
    pockets = {'pelvis': [P('box', [x, 0.8, -D['hipD']/2-0.006], [0.09, 0.08, 0.012], 'PANTS_D') for x in (-0.08, 0.08)]}
    B = {}
    B['jeans'] = merge(hips('PANTS'), legs('PANTS', 'PANTS'), pockets)
    B['shorts'] = merge(hips('PANTS'), pockets, sided(lambda sg, sd: {
        'thigh_' + sd: [P('bev', [sg*LX, 0.665, 0], [D['thighW']+0.015, 0.2, D['thighW']+0.035], 'PANTS'), P('bev', [sg*LX, 0.5, 0], [D['thighW']-0.02, 0.14, D['thighW']], 'SKIN')],
        'calf_' + sd: [P('bev', [sg*LX, 0.275, 0], [D['calfW']-0.02, 0.33, D['calfW']], 'SKIN')]}))
    B['cargo_trousers'] = merge(B['jeans'], sided(lambda sg, sd: {'thigh_' + sd: [P('bev', [sg*(LX+D['thighW']/2+0.015), 0.57, 0], [0.04, 0.13, 0.12], 'PANTS_D')]}))
    B['capri_trousers'] = merge(hips('PANTS'), pockets, legs('PANTS', 'PANTS', calf_lo='SKIN', cuff=(0.275, 0.03, 'PANTS_D')))
    B['track_pants'] = merge(hips('PANTS'), legs('PANTS', 'PANTS', cuff=(0.13, 0.04, 'PANTS_D')), sided(lambda sg, sd: {
        'thigh_' + sd: [P('box', [sg*(LX+D['thighW']/2+0.004), 0.6, 0], [0.012, 0.32, 0.04], 'ACC')],
        'calf_' + sd: [P('box', [sg*(LX+D['calfW']/2+0.004), 0.29, 0], [0.012, 0.3, 0.04], 'ACC')]}))
    B['rolled_jeans'] = merge(hips('PANTS'), pockets, legs('PANTS', 'PANTS', cuff=(0.165, 0.06, 'denimRoll')))
    return B

# ---------------- shoes (foot and toe bones; tall boots reach up the calf) ----------------
def shoes():
    def base(col, sole, sg, sd):
        x = sg*LX
        return {'foot_' + sd: [P('bev', [x, 0.075, 0.0], [0.15, 0.13, 0.17], col), P('box', [x, 0.015, 0.045], [0.16, 0.03, 0.3], sole)],
                'ball_' + sd: [P('bev', [x, 0.055, 0.135], [0.15, 0.09, 0.12], col)]}
    S = {}
    S['trainers'] = sided(lambda sg, sd: merge(base('trainer', 'gum', sg, sd), {
        'foot_' + sd: [P('box', [sg*(LX+0.076), 0.07, 0.02], [0.008, 0.04, 0.12], 'ACC'), P('box', [sg*(LX-0.076), 0.07, 0.02], [0.008, 0.04, 0.12], 'ACC')],
        'ball_' + sd: [P('box', [sg*LX, 0.102, 0.11], [0.07, 0.008, 0.06], 'lace')]}))
    S['boots'] = sided(lambda sg, sd: merge(base('boot', 'sole', sg, sd), {
        'calf_' + sd: [P('bev', [sg*LX, 0.17, -0.005], [0.165, 0.13, 0.185], 'boot'), P('box', [sg*LX, 0.235, -0.005], [0.17, 0.02, 0.19], 'bootD')],
        'ball_' + sd: [P('box', [sg*LX, 0.102, 0.1], [0.06, 0.008, 0.07], 'bootD')]}))
    S['rain_boots'] = sided(lambda sg, sd: merge(base('rainboot', 'sole', sg, sd), {
        'calf_' + sd: [P('bev', [sg*LX, 0.26, 0], [0.175, 0.3, 0.195], 'rainboot'), P('box', [sg*LX, 0.405, 0], [0.18, 0.02, 0.2], 'rainbootD')]}))
    return S

# ---------------- faces, hair, hats (all on the Head bone) ----------------
FZ = 0.181
def eyes(h=0.07, y=1.535):
    return [P('box', [x, y, FZ], [0.05, h, 0.02], 'eye') for x in (-0.08, 0.08)]
def brows(y=1.585, col='HAIR_D'):
    return [P('box', [x, y, FZ], [0.075, 0.018, 0.02], col) for x in (-0.08, 0.08)]
def faces():
    F = {}
    mouth = [P('box', [0, 1.415, FZ-0.004], [0.08, 0.014, 0.012], 'lip')]
    F['calm'] = eyes() + brows() + mouth
    rims = []
    for x in (-0.08, 0.08):
        rims += [P('box', [x, 1.578, FZ+0.012], [0.11, 0.012, 0.012], 'frame'), P('box', [x, 1.492, FZ+0.012], [0.11, 0.012, 0.012], 'frame'),
                 P('box', [x-0.049, 1.535, FZ+0.012], [0.012, 0.098, 0.012], 'frame'), P('box', [x+0.049, 1.535, FZ+0.012], [0.012, 0.098, 0.012], 'frame')]
    arms_ = [P('box', [x, 1.565, 0.09], [0.012, 0.014, 0.18], 'frame') for x in (-0.192, 0.192)]
    F['glasses'] = eyes(0.06) + brows(1.6) + mouth + rims + [P('box', [0, 1.55, FZ+0.012], [0.04, 0.012, 0.012], 'frame')] + arms_
    F['stubble'] = eyes() + brows() + [P('box', [0, 1.405, FZ-0.003], [0.3, 0.11, 0.012], 'HAIR_D'), P('box', [0, 1.405, FZ+0.004], [0.07, 0.012, 0.01], 'lip')]
    F['freckles'] = eyes() + brows() + mouth + [P('box', [x, y, FZ-0.002], [0.016, 0.016, 0.01], 'freckle') for x, y in
                                                ((-0.12, 1.49), (-0.095, 1.475), (-0.135, 1.465), (0.12, 1.49), (0.095, 1.475), (0.135, 1.465), (-0.03, 1.5), (0.03, 1.5))]
    F['tired'] = eyes(0.04, 1.53) + [P('wedge', [x, 1.58, FZ], [0.075, 0.025, 0.02], 'HAIR_D', fy=(x > 0)) for x in (-0.08, 0.08)] + \
                 [P('box', [x, 1.497, FZ-0.002], [0.06, 0.018, 0.012], 'SKIN_D') for x in (-0.08, 0.08)] + [P('box', [0, 1.415, FZ-0.004], [0.06, 0.012, 0.012], 'lip')]
    F['moustache'] = eyes() + brows() + [P('bev', [0, 1.437, FZ+0.008], [0.14, 0.04, 0.035], 'HAIR_D'),
                                         P('box', [-0.075, 1.418, FZ+0.006], [0.03, 0.035, 0.03], 'HAIR_D'), P('box', [0.075, 1.418, FZ+0.006], [0.03, 0.035, 0.03], 'HAIR_D')]
    F['dark_glasses'] = brows(1.6) + mouth + [P('bev', [x, 1.535, FZ+0.01], [0.105, 0.072, 0.02], 'shades') for x in (-0.08, 0.08)] + \
                        [P('box', [0, 1.55, FZ+0.012], [0.04, 0.014, 0.012], 'shades')] + arms_
    F['scar'] = eyes() + brows() + mouth + [P('box', [0.1, 1.545, FZ+0.002], [0.014, 0.13, 0.01], 'scar')] + \
                [P('box', [0.1, y, FZ+0.004], [0.04, 0.01, 0.008], 'scar') for y in (1.51, 1.55, 1.59)]
    return F
def hair():
    H = {'none': []}
    buzz = [P('bev', [0, 1.69, -0.005], [0.395, 0.07, 0.375], 'HAIR'), P('box', [0, 1.6, -0.172], [0.385, 0.18, 0.04], 'HAIR'),
            P('box', [0.19, 1.6, -0.05], [0.025, 0.15, 0.2], 'HAIR'), P('box', [-0.19, 1.6, -0.05], [0.025, 0.15, 0.2], 'HAIR')]
    H['buzzed'] = buzz
    H['short'] = [P('bev', [0, 1.72, -0.02], [0.41, 0.1, 0.4], 'HAIR'), P('box', [0, 1.56, -0.17], [0.4, 0.3, 0.06], 'HAIR'),
                  P('wedge', [0.05, 1.655, 0.17], [0.3, 0.07, 0.06], 'HAIR', fy=True),
                  P('box', [0.195, 1.57, 0.02], [0.03, 0.14, 0.1], 'HAIR'), P('box', [-0.195, 1.57, 0.02], [0.03, 0.14, 0.1], 'HAIR')]
    H['bob'] = [P('bev', [0, 1.725, -0.01], [0.43, 0.11, 0.42], 'HAIR'), P('bev', [0.205, 1.53, -0.02], [0.05, 0.31, 0.36], 'HAIR'),
                P('bev', [-0.205, 1.53, -0.02], [0.05, 0.31, 0.36], 'HAIR'), P('bev', [0, 1.53, -0.19], [0.42, 0.31, 0.06], 'HAIR'),
                P('box', [0, 1.655, 0.185], [0.36, 0.07, 0.04], 'HAIR')]
    H['buns'] = buzz + [P('bev', [0.12, 1.775, -0.06], [0.13, 0.13, 0.13], 'HAIR'), P('bev', [-0.12, 1.775, -0.06], [0.13, 0.13, 0.13], 'HAIR'),
                        P('box', [0.12, 1.715, -0.06], [0.08, 0.02, 0.08], 'ACC'), P('box', [-0.12, 1.715, -0.06], [0.08, 0.02, 0.08], 'ACC')]
    H['beard'] = buzz + [P('bev', [0, 1.4, 0.135], [0.34, 0.15, 0.13], 'HAIR'), P('box', [0.18, 1.48, 0.07], [0.04, 0.14, 0.14], 'HAIR'),
                         P('box', [-0.18, 1.48, 0.07], [0.04, 0.14, 0.14], 'HAIR'), P('box', [0, 1.425, FZ+0.022], [0.07, 0.014, 0.01], 'lip')]
    return H
def hats():
    return {'none': [],
            'cap': [P('bev', [0, 1.745, -0.01], [0.43, 0.13, 0.42], 'ACC'), P('box', [0, 1.69, 0.27], [0.34, 0.025, 0.16], 'ACC_D'),
                    P('box', [0, 1.815, -0.01], [0.04, 0.02, 0.04], 'ACC_D')],
            'beanie': [P('bev', [0, 1.745, -0.01], [0.43, 0.17, 0.42], 'ACC'), P('bev', [0, 1.67, -0.01], [0.45, 0.06, 0.44], 'ACC_D'),
                       P('bev', [0, 1.85, -0.01], [0.09, 0.08, 0.09], 'ACC')],
            'helmet': [P('bev', [0, 1.74, -0.01], [0.45, 0.17, 0.44], 'helmet'), P('box', [0, 1.665, -0.01], [0.49, 0.03, 0.48], 'helmetD'),
                       P('box', [0.215, 1.55, 0.03], [0.02, 0.17, 0.03], 'strap'), P('box', [-0.215, 1.55, 0.03], [0.02, 0.17, 0.03], 'strap')]}
def gear():
    return {'backpack': {'spine_03': [P('bev', [0, 1.09, -0.22], [0.34, 0.42, 0.18], 'pack'), P('bev', [0, 0.97, -0.33], [0.24, 0.16, 0.06], 'packD'),
                                      P('cyl', [0, 1.36, -0.22], [0.42, 0.12, 0.12], 'roll', ax='x'),
                                      P('box', [-0.12, 1.14, 0.137], [0.05, 0.3, 0.02], 'packD'), P('box', [0.12, 1.14, 0.137], [0.05, 0.3, 0.02], 'packD')]}}

def count(pieces):
    return sum({'box': 12, 'bev': 44, 'wedge': 8, 'cyl': 28}[q['s']] for q in pieces)
def count_bones(d):
    return sum(count(v) for v in d.values())

pack = {
  'name': 'survivor', 'version': 1,
  'about': 'Every character creator choice as shaped pieces, grouped by skeleton bone. See docs/SHAPED.md.',
  'units': 'metres', 'facing': '+Z', 'left': '+X', 'height': 1.85,
  'bones': BONES,
  'palette': PALETTE,
  'slots': SLOTS,
  'darker': 0.78,
  'hatLine': 1.63,
  'hatRule': 'When a hat is worn, leave out hair pieces whose centre p[1] is above hatLine (the hat covers them); keep the rest.',
  'builds': {'slim': [0.9, 0.93], 'average': [1, 1], 'broad': [1.12, 1.06]},
  'buildRule': 'For every bone except Head and neck_01, multiply each piece p[0] and d[0] by the first number and p[2] and d[2] by the second.',
  'choices': {
    'build': ['slim', 'average', 'broad'], 'skin': [1, 2, 3, 4, 5], 'body': ['masculine', 'feminine'],
    'hair': ['none', 'buzzed', 'short', 'bob', 'buns', 'beard'], 'hairColour': ['black', 'brown', 'auburn', 'blond', 'grey'],
    'hat': ['none', 'cap', 'beanie', 'helmet'],
    'face': ['calm', 'glasses', 'stubble', 'freckles', 'tired', 'moustache', 'dark_glasses', 'scar'],
    'top': ['tshirt', 'striped_tee', 'flannel_shirt', 'spotted_top', 'hoodie', 'open_jacket', 'jumper', 'dungarees'],
    'bottoms': ['jeans', 'shorts', 'cargo_trousers', 'capri_trousers', 'track_pants', 'rolled_jeans'],
    'shoes': ['trainers', 'boots', 'rain_boots']
  },
  'parts': {
    'body': {'masculine': body(False), 'feminine': body(True)},
    'top': {'masculine': tops(False), 'feminine': tops(True)},
    'bottoms': {'masculine': bottoms(False), 'feminine': bottoms(True)},
    'shoes': shoes(),
    'face': {k: {'Head': v} for k, v in faces().items()},
    'hair': {k: {'Head': v} for k, v in hair().items()},
    'hat': {k: {'Head': v} for k, v in hats().items()},
    'gear': gear()
  }
}
# triangle counts for the catalogue
tri = {}
for grp, val in pack['parts'].items():
    for k, v in val.items():
        if grp in ('body', 'top', 'bottoms'):
            for k2, v2 in v.items():
                if grp == 'body': tri[f'{grp}.{k}'] = count_bones(v)
                else: tri[f'{grp}.{k}.{k2}'] = count_bones(v2)
            if grp == 'body': continue
        else:
            tri[f'{grp}.{k}'] = count_bones(v)
pack['triangles'] = tri

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, '..', 'survivor.js')
with open(out, 'w') as f:
    f.write('/* Afterstreet shaped survivor pack: made by assets/shaped/src/survivor.py, do not edit by hand */\n')
    f.write('(window.SHAPED = window.SHAPED || {}).survivor = ' + json.dumps(pack, separators=(',', ':')) + ';\n')
print('wrote', os.path.relpath(out), os.path.getsize(out), 'bytes')
worst = max(tri['body.masculine'] + max(v for k, v in tri.items() if k.startswith('top.masculine')) + max(v for k, v in tri.items() if k.startswith('bottoms.masculine'))
            + max(v for k, v in tri.items() if k.startswith('shoes')) + max(v for k, v in tri.items() if k.startswith('face')) + max(v for k, v in tri.items() if k.startswith('hair'))
            + max(v for k, v in tri.items() if k.startswith('hat')) + tri['gear.backpack'] for _ in [0])
print('heaviest full survivor:', worst, 'triangles')
for k in sorted(tri): print(f'  {k}: {tri[k]}')
