#!/usr/bin/env python3
"""Afterstreet held pack, version 2 (19 October 2026): weapons in the hand, guns, bows and ammo, and first-person arms.
Writes assets/shaped/held.js. Run: python3 assets/shaped/src/held.py

Weapons: the grip is at the origin, the long side runs along +Z with the business end at +Z, +Y is the weapon's "up"
(the edge or face that leads a swing). Each weapon comes in three states: new, worn (condition under a quarter: bent,
chipped, taped) and broken (the stub left in the hand when it snaps).
  - In the third-person hand: put the weapon's origin on GRIP (a point in the survivor pack's model space, carried by
    hand_r) with the weapon's axes as the survivor's axes at rest; the hand bone then carries it through every clip.
  - On the ground: turn the weapon by ground.roll degrees about Z, then ground.yaw about Y, and lift it by ground.lift.
  - First person: put the weapon's origin on fp.hold.weapon (position and rotation) in view space.
First-person arms (view space): the eye at the origin looking along +Z, +Y up, the viewer's right is -X (the same
handedness as every model). Colour slots SKIN and SLEEVE (whatever the survivor wears on top: outer, else top)."""
import math, os
from kit import *

PALETTE = {
  'wood': '#b08c62', 'woodD': '#8a6a46', 'willow': '#d9b073', 'willowD': '#c49a5a', 'grip': '#3a2a20', 'tape': '#8f959c', 'tapeD': '#6f757c',
  'steel': '#8f969e', 'steelD': '#5b6168', 'iron': '#3c4046', 'ironD': '#1c1e22', 'blade': '#c8cdd2', 'red': '#9a3a30', 'blue': '#2e5a7a',
  'canopy': '#2f5d8c', 'canopyD': '#24496e', 'handle': '#6b4526', 'band': '#a8423a', 'leather': '#5a3a26', 'black': '#1f2024', 'polymer': '#2a2c30',
  'paper': '#e8dfc6', 'crease': '#c8bea4', 'road': '#b8a27a', 'water': '#8aa6b8', 'pencil': '#4a4a52', 'ink': '#3a3a46',
  'brass': '#c8a24a', 'flash': '#ffd68a', 'flashCore': '#fff6d8', 'chip': '#e8dcc0', 'rust': '#8c4a2e', 'splinter': '#d9c09a', 'scuff': '#6a5a48'
}
G = dict(glow=True)
W = {}            # weapons[name][state]
INFO = {}         # length, grip notes, ground pose

def zfr(rings, c, **k): return frustum(rings, c, ax='z', **k)
def handle(z0, z1, r, c, n=6):
    return loft([[0, 0, z0, r, r], [0, 0, z1, r, r]], c, ax='z', n=n)
def tape_bands(zs, r, c='tape'):
    return [loft([[0, 0, z - 0.012, r + 0.004, r + 0.004], [0, 0, z + 0.012, r + 0.004, r + 0.004]], c, ax='z', n=6, caps=[False, False]) for z in zs]
def splinters(z, w, t, c):
    """the jagged end of a snapped handle or blade"""
    return [tip([x, y, z], [x*0.6, y*0.6, z + 0.03 + 0.02*i], w*0.5, t*0.5, c, ax='z') for i, (x, y) in enumerate(((-w*0.5, 0), (w*0.4, t*0.3), (0, -t*0.4)))]
def three(name, new, worn, broken, length, roll=90, lift=0.02, note=''):
    W[name] = {'new': new, 'worn': worn, 'broken': broken}
    INFO[name] = {'length': length, 'ground': {'roll': roll, 'yaw': 0, 'lift': lift}, 'note': note}

# ---------- cricket bat: flat willow blade, round handle with a rubber grip ----------
def cricket(state):
    o = [handle(-0.3, 0.02, 0.016, 'grip')] if state != 'broken' else [handle(-0.3, -0.02, 0.016, 'grip')]
    if state == 'broken': return o + splinters(-0.02, 0.03, 0.02, 'willowD')
    blade = hull([(-0.05, -0.012, 0.02), (0.05, -0.012, 0.02), (0.05, -0.012, 0.55), (-0.05, -0.012, 0.55),
                  (-0.04, 0.03, 0.06), (0.04, 0.03, 0.06), (0.04, 0.03, 0.5), (-0.04, 0.03, 0.5)], 'willow')
    o += [blade, flat([(-0.05, -0.0125, 0.06), (0.05, -0.0125, 0.06), (0.05, -0.0125, 0.52), (-0.05, -0.0125, 0.52)], 'willowD', (0, -1, 0))]
    if state == 'worn':
        o += tape_bands((0.12, 0.3), 0.04) + [flat([(0.051, 0.0, 0.44), (0.051, 0.02, 0.5), (0.051, -0.01, 0.53)], 'chip', (1, 0, 0)), flat([(-0.04, -0.013, 0.3), (0.0, -0.013, 0.28), (0.02, -0.013, 0.36), (-0.03, -0.013, 0.38)], 'scuff', (0, -1, 0))]
    return o
three('cricket_bat', cricket('new'), cricket('worn'), cricket('broken'), 0.85, roll=0, lift=0.012, note='flat swing')
# ---------- frying pan ----------
def pan(state):
    o = [zfr([[0, 0, -0.24, 0.011, 0.008], [0, 0, 0.06, 0.013, 0.009]], 'iron')]
    if state == 'broken': return [zfr([[0, 0, -0.24, 0.011, 0.008], [0, 0, -0.02, 0.012, 0.009]], 'iron'), tip([0, 0, -0.02], [0.006, 0.004, 0.02], 0.016, 0.012, 'ironD', ax='z')]
    bend = 0.03 if state == 'worn' else 0.0
    dish = loft([[0, -0.02, 0.2, 0.1, 0.1], [0, 0.02 + bend, 0.2, 0.125, 0.125]], 'iron', n=8, caps=[True, False])
    o += [dish, loft([[0, -0.006, 0.2, 0.1, 0.1], [0, -0.005, 0.2, 0.1, 0.1]], 'ironD', n=8, caps=[False, True])]
    if state == 'worn': o += [flat([(0.04, -0.0045, 0.18), (0.08, -0.0045, 0.2), (0.06, -0.0045, 0.26)], 'rust', (0, 1, 0)), flat([(-0.124, 0.0, 0.2), (-0.12, 0.02, 0.24), (-0.118, 0.0, 0.25)], 'chip', (-1, 0, 0))]
    return o
three('frying_pan', pan('new'), pan('worn'), pan('broken'), 0.55, roll=0, lift=0.02, note='flat swing; lies face up')
# ---------- hockey stick ----------
def hockey(state):
    if state == 'broken': return [zfr([[0, 0, -0.38, 0.014, 0.012], [0, 0, 0.1, 0.014, 0.012]], 'wood')] + splinters(0.1, 0.028, 0.024, 'splinter')
    shaft = zfr([[0, 0, -0.38, 0.014, 0.012], [0, 0, 0.42, 0.014, 0.012]], 'wood')
    bladeb = hull([(-0.008, -0.02, 0.4), (0.008, -0.02, 0.4), (0.008, -0.11, 0.64), (-0.008, -0.11, 0.64),
                   (-0.008, 0.02, 0.42), (0.008, 0.02, 0.42), (0.008, -0.06, 0.66), (-0.008, -0.06, 0.66)], 'blue')
    o = [shaft, bladeb, zfr([[0, 0, -0.38, 0.016, 0.014], [0, 0, -0.26, 0.016, 0.014]], 'grip')]
    if state == 'worn': o += tape_bands((0.38, 0.46, 0.0), 0.02, 'black') + [flat([(0.009, -0.07, 0.56), (0.009, -0.09, 0.6), (0.009, -0.05, 0.62)], 'chip', (1, 0, 0))]
    return o
three('hockey_stick', hockey('new'), hockey('worn'), hockey('broken'), 1.04, roll=90, lift=0.016, note='flat swing; two hands')
# ---------- wrench ----------
def wrench(state):
    if state == 'broken': return [zfr([[0, 0, -0.16, 0.017, 0.007], [0, 0, 0.08, 0.016, 0.007]], 'steel'), tip([0, 0, 0.08], [0, 0.004, 0.11], 0.024, 0.01, 'steelD', ax='z')]
    o = [zfr([[0, 0, -0.16, 0.017, 0.007], [0, 0, 0.16, 0.016, 0.007]], 'steel'),
         box([0, 0, 0.2], [0.07, 0.03, 0.06], 'steel'), box([0.022, 0, 0.245], [0.022, 0.03, 0.05], 'steel'), box([-0.022, 0, 0.245], [0.022, 0.03, 0.05], 'steel'),
         box([0, 0.016, 0.19], [0.03, 0.004, 0.02], 'steelD')]
    if state == 'worn': o += [flat([(-0.017, 0.0072, -0.1), (0.017, 0.0072, -0.08), (0.017, 0.0072, 0.02), (-0.017, 0.0072, 0.0)], 'rust', (0, 1, 0)), flat([(0.036, -0.01, 0.2), (0.036, 0.01, 0.22), (0.036, -0.005, 0.23)], 'rust', (1, 0, 0))]
    return o
three('wrench', wrench('new'), wrench('worn'), wrench('broken'), 0.48, roll=0, lift=0.015, note='overhead chop')
# ---------- garden rake ----------
def rake(state):
    if state == 'broken': return [zfr([[0, 0, -0.42, 0.012, 0.012], [0, 0, 0.08, 0.012, 0.012]], 'wood')] + splinters(0.08, 0.024, 0.024, 'splinter')
    o = [zfr([[0, 0, -0.42, 0.012, 0.012], [0, 0, 0.5, 0.012, 0.012]], 'wood'), box([0, 0, 0.51], [0.3, 0.02, 0.025], 'steel')]
    for i in range(8):
        x = -0.13 + i*0.0371; bent = state == 'worn' and i in (2, 6)
        o.append(tip([x, -0.01, 0.51], [x + (0.02 if bent else 0), -0.07, 0.53 if bent else 0.515], 0.005, 0.005, 'steelD'))
    if state == 'worn': o += tape_bands((0.3,), 0.013)
    return o
three('garden_rake', rake('new'), rake('worn'), rake('broken'), 0.95, roll=0, lift=0.02, note='thrust; two hands; tines face down (-Y)')
# ---------- broom spear: a broom handle with a kitchen knife taped to the end ----------
def spear(state):
    if state == 'broken': return [zfr([[0, 0, -0.46, 0.012, 0.012], [0, 0, 0.12, 0.012, 0.012]], 'wood')] + splinters(0.12, 0.024, 0.024, 'splinter')
    o = [zfr([[0, 0, -0.46, 0.012, 0.012], [0, 0, 0.44, 0.012, 0.012]], 'wood'),
         hull([(-0.002, -0.012, 0.36), (0.002, -0.012, 0.36), (0.002, -0.004, 0.62), (-0.002, -0.004, 0.62), (-0.002, 0.022, 0.4), (0.002, 0.022, 0.4), (0.002, 0.004, 0.62), (-0.002, 0.004, 0.62)], 'blade')]
    o += tape_bands((0.38, 0.42), 0.013, 'band')
    if state == 'worn': o[1] = hull([(-0.002, -0.012, 0.36), (0.002, -0.012, 0.36), (0.002, -0.006, 0.56), (-0.002, -0.006, 0.56), (-0.002, 0.022, 0.4), (0.002, 0.022, 0.4), (0.002, 0.004, 0.55), (-0.002, 0.004, 0.55)], 'blade'); o += tape_bands((0.34,), 0.013, 'tape')
    return o
three('broom_spear', spear('new'), spear('worn'), spear('broken'), 1.08, roll=0, lift=0.013, note='thrust; two hands')
# ---------- umbrella (closed) ----------
def umbrella(state):
    hook = [zfr([[0, 0, -0.32, 0.012, 0.012], [0, 0, -0.26, 0.012, 0.012]], 'handle'),
            zfr([[0, -0.03, -0.35, 0.012, 0.012], [0, 0.0, -0.32, 0.012, 0.012]], 'handle'), zfr([[0, -0.07, -0.34, 0.012, 0.012], [0, -0.03, -0.35, 0.012, 0.012]], 'handle')]
    if state == 'broken': return hook + [zfr([[0, 0, -0.26, 0.007, 0.007], [0, 0, 0.0, 0.007, 0.007]], 'black'), tip([0, 0, 0.0], [0.01, 0.01, 0.04], 0.008, 0.008, 'steelD', ax='z')]
    o = hook + [zfr([[0, 0, -0.26, 0.007, 0.007], [0, 0, 0.0, 0.007, 0.007]], 'black'),
                loft([[0, 0, 0.0, 0.025, 0.025], [0, 0, 0.12, 0.045, 0.045], [0, 0, 0.4, 0.02, 0.02], [0, 0, 0.48, 0, 0]], 'canopy', ax='z', n=8, caps=[True, False]),
                box([0.04, 0, 0.12], [0.012, 0.03, 0.02], 'canopyD')]
    if state == 'worn': o[4] = loft([[0, 0, 0.0, 0.03, 0.025], [0, 0, 0.12, 0.06, 0.04], [0.02, 0.01, 0.4, 0.03, 0.02], [0.04, 0.02, 0.48, 0, 0]], 'canopy', ax='z', n=8, caps=[True, False]); o += [tip([0.04, 0.02, 0.2], [0.09, 0.05, 0.22], 0.004, 0.004, 'steelD')]
    return o
three('umbrella', umbrella('new'), umbrella('worn'), umbrella('broken'), 0.83, roll=0, lift=0.045, note='flat swing; closed')
# ---------- the three weapons the game already draws from props.items, remade with the grip at the origin ----------
def crowbar(state):
    if state == 'broken': return [zfr([[0, 0, -0.32, 0.012, 0.012], [0, 0, 0.05, 0.012, 0.012]], 'steelD'), tip([0, 0, 0.05], [0.004, 0.004, 0.09], 0.017, 0.017, 'steelD', ax='z')]
    k = 0.04 if state == 'worn' else 0.0
    return [zfr([[0, 0, -0.32, 0.012, 0.012], [0, k*0.5, 0.3, 0.012, 0.012]], 'steelD'), zfr([[0, k*0.5, 0.3, 0.012, 0.012], [0, 0.05 + k, 0.36, 0.01, 0.01]], 'steelD'),
            zfr([[0, 0, -0.32, 0.012, 0.012], [0, -0.04, -0.37, 0.009, 0.009]], 'steelD')] + ([flat([(0.0121, -0.006, -0.1), (0.0121, 0.006, -0.08), (0.0121, 0.006, 0.06), (0.0121, -0.006, 0.04)], 'rust', (1, 0, 0))] if state == 'worn' else [])
three('crowbar', crowbar('new'), crowbar('worn'), crowbar('broken'), 0.73, roll=0, lift=0.012, note='overhead chop')
def bat(state):
    if state == 'broken': return [loft([[0, 0, -0.3, 0.014, 0.014], [0, 0, 0.0, 0.02, 0.02]], 'wood', ax='z', n=6)] + splinters(0.0, 0.04, 0.04, 'splinter')
    o = [loft([[0, 0, -0.32, 0.016, 0.016], [0, 0, -0.3, 0.014, 0.014], [0, 0, 0.06, 0.022, 0.022], [0, 0, 0.5, 0.034, 0.034], [0, 0, 0.52, 0.03, 0.03]], 'wood', ax='z', n=6), handle(-0.3, -0.12, 0.016, 'grip')]
    if state == 'worn': o += tape_bands((0.2,), 0.03) + [loft([[0, 0, 0.38, 0.036, 0.036], [0, 0, 0.4, 0.036, 0.036]], 'scuff', ax='z', n=6, caps=[False, False])]
    return o
three('baseball_bat', bat('new'), bat('worn'), bat('broken'), 0.84, roll=0, lift=0.034, note='flat swing')
def axe(state):
    if state == 'broken': return [zfr([[0, 0, -0.3, 0.014, 0.011], [0, 0, 0.1, 0.014, 0.011]], 'wood')] + splinters(0.1, 0.028, 0.022, 'splinter')
    head = hull([(-0.011, -0.02, 0.32), (0.011, -0.02, 0.32), (0.011, -0.02, 0.4), (-0.011, -0.02, 0.4), (-0.003, 0.15, 0.27), (0.003, 0.15, 0.27), (0.003, 0.15, 0.45), (-0.003, 0.15, 0.45)], 'steel')
    o = [zfr([[0, 0, -0.3, 0.014, 0.011], [0, 0, 0.42, 0.016, 0.012]], 'wood'), head, box([0, -0.035, 0.36], [0.026, 0.03, 0.07], 'steelD')]
    if state == 'worn': o += [flat([(0.004, 0.15, 0.33), (0.004, 0.13, 0.36), (0.004, 0.15, 0.39)], 'chip', (1, 0, 0)), flat([(0.0115, -0.015, 0.33), (0.0115, 0.04, 0.33), (0.0115, 0.03, 0.39), (0.0115, -0.01, 0.39)], 'rust', (1, 0, 0))] + tape_bands((-0.1, 0.05), 0.014)
    return o
three('axe', axe('new'), axe('worn'), axe('broken'), 0.75, roll=0, lift=0.015, note='overhead chop; blade up (+Y)')

# ---------- slingshot and pistol ----------
def slingshot(drawn=False):
    o = [frustum([[0, -0.08, 0, 0.012, 0.014], [0, 0.0, 0, 0.012, 0.014]], 'wood'), frustum([[0, -0.08, 0, 0.016, 0.018], [0, -0.04, 0, 0.016, 0.018]], 'leather', caps=[True, False]),
         *[frustum([[0, 0.0, 0, 0.012, 0.012], [sg*0.045, 0.08, 0, 0.009, 0.009]], 'wood') for sg in (1, -1)]]
    if drawn:   # the pouch pulled back towards the eye (-Z), bands stretched
        o += [frustum([[sg*0.045, 0.08, 0, 0.004, 0.003], [sg*0.012, 0.07, -0.32, 0.004, 0.003]], 'band') for sg in (1, -1)] + [box([0, 0.07, -0.33], [0.03, 0.022, 0.02], 'leather')]
    else:
        o += [frustum([[sg*0.045, 0.08, 0, 0.004, 0.003], [sg*0.012, 0.075, -0.03, 0.004, 0.003]], 'band') for sg in (1, -1)] + [box([0, 0.075, -0.035], [0.03, 0.02, 0.012], 'leather')]
    return o
W['slingshot'] = {'new': slingshot(False), 'drawn': slingshot(True)}
INFO['slingshot'] = {'length': 0.2, 'ground': {'roll': 90, 'yaw': 0, 'lift': 0.012}, 'note': 'held upright, forks up (+Y), shot goes along +Z; drawn is the pulled pose'}
pistol = [box([0, 0.03, 0.06], [0.03, 0.035, 0.19], 'polymer'), box([0, 0.054, 0.06], [0.028, 0.014, 0.19], 'black'),
          hull([(-0.014, 0.012, -0.03), (0.014, 0.012, -0.03), (0.014, 0.012, 0.02), (-0.014, 0.012, 0.02), (-0.014, -0.09, -0.06), (0.014, -0.09, -0.06), (0.014, -0.09, -0.015), (-0.014, -0.09, -0.015)], 'polymer'),
          box([0, -0.005, 0.035], [0.01, 0.006, 0.05], 'black'), box([0, -0.02, 0.06], [0.01, 0.03, 0.006], 'black'), box([0, 0.064, 0.145], [0.004, 0.006, 0.006], 'black')]
W['pistol'] = {'new': pistol,
               'flash': [flat([(0, 0.03 + 0.05*math.sin(a), 0.16 + 0.05*math.cos(a)) for a in (0, 1.2, 2.5, 3.8, 5.0)], 'flash', (0, 0, 1), **G),
                         tip([0, 0.03, 0.155], [0, 0.03, 0.27], 0.03, 0.03, 'flash', **G), tip([0, 0.03, 0.155], [0, 0.03, 0.2], 0.015, 0.015, 'flashCore', **G)],
               'shell': [loft([[0, 0, -0.01, 0.0045, 0.0045], [0, 0, 0.01, 0.0045, 0.0045]], 'brass', ax='z', n=6)]}
INFO['pistol'] = {'length': 0.2, 'ground': {'roll': 90, 'yaw': 0, 'lift': 0.015}, 'note': 'barrel along +Z; flash sits at the muzzle (0, 0.03, 0.155), show it one or two frames, scale 0.8 to 1.3 at random; shell is ejected to +X'}

# ---------- grip on the survivor's hand ----------
# hand_r in survivor pack v7 (slim, 19 October 2026): wrist (-0.214, 0.9, 0.018), fingertip (-0.21, 0.76, 0.036); the fist closes around a point 45% down the hand
GRIP = {'bone': 'hand_r', 'pos': [-0.212, 0.837, 0.026], 'note': 'Weapon origin goes here (survivor pack model space, rest pose); weapon axes = survivor axes at rest, so it points forward (+Z) out of the fist.'}
GRIP_TWO = {'bone': 'hand_r', 'pos': [-0.212, 0.837, 0.026], 'offhand': 'hand_l', 'offhandAt': 0.35,
            'note': 'Two-handed weapons (hockey stick, garden rake, broom spear): same grip; the left hand reaches to the weapon at offhandAt metres along +Z when the clip allows.'}

# ---------- first-person arms (view space: eye at origin, looking +Z, viewer's right is -X) ----------
def arm(sh, el, wr, sleeve_to=0.75):
    """a forearm from elbow to wrist: sleeve to sleeve_to of the way, then skin"""
    cut = mixp(el, wr, sleeve_to)
    return [seg(el, cut, 0.042, 0.036, 0.038, 0.032, 'SLEEVE'), seg(cut, wr, 0.03, 0.026, 0.026, 0.022, 'SKIN', caps=(False, True)), seg(sh, el, 0.05, 0.045, 0.045, 0.04, 'SLEEVE')]
def fist(c, d=(0, 0, 1)):
    x, y, z = c
    return [box([x, y, z], [0.07, 0.06, 0.08], 'SKIN'), box([x + 0.034, y + 0.012, z + 0.01], [0.02, 0.025, 0.05], 'SKIN')]
def open_hand(wr, tipp, wide=0.04):
    m = mixp(wr, tipp, 0.45)
    return [frustum([[*wr, 0.03, 0.014], [*m, wide, 0.012]], 'SKIN', ax='z', caps=[True, False]), loft([[*m, wide*math.sqrt(2), 0.012*math.sqrt(2)], [*tipp, 0, 0]], 'SKIN', ax='z', n=4, rot=45, caps=[False, False]),
            tip([wr[0] + 0.035, wr[1], wr[2] + 0.02], [wr[0] + 0.06, wr[1] + 0.01, wr[2] + 0.08], 0.012, 0.012, 'SKIN')]
FP = {
  'hold':  {'right': arm([-0.3, -0.42, -0.08], [-0.26, -0.36, 0.18], [-0.21, -0.27, 0.4]) + fist([-0.2, -0.26, 0.45]),
            'left':  arm([0.3, -0.46, -0.08], [0.28, -0.48, 0.12], [0.26, -0.46, 0.3]) + fist([0.26, -0.46, 0.34]),
            'weapon': {'pos': [-0.2, -0.26, 0.45], 'rot': [-38, 10, 0], 'note': 'degrees X, Y, Z: the weapon rises forward and leans a little towards the middle'}},
  'empty': {'right': arm([-0.28, -0.44, -0.06], [-0.24, -0.4, 0.18], [-0.2, -0.33, 0.38]) + open_hand([-0.2, -0.33, 0.38], [-0.19, -0.3, 0.54]),
            'left':  arm([0.28, -0.44, -0.06], [0.24, -0.4, 0.18], [0.2, -0.33, 0.38]) + open_hand([0.2, -0.33, 0.38], [0.19, -0.3, 0.54])},
  'reach': {'right': arm([-0.24, -0.34, -0.04], [-0.17, -0.22, 0.25], [-0.09, -0.12, 0.55]) + open_hand([-0.09, -0.12, 0.55], [-0.07, -0.08, 0.72], 0.05),
            'left':  arm([0.28, -0.46, -0.08], [0.26, -0.48, 0.1], [0.24, -0.48, 0.26]) + fist([0.24, -0.48, 0.3])},
}

# ---------- the paper map (0.48): folded in the hand, and open in front of the eye ----------
def map_open():
    o = [box([0, 0, 0], [0.56, 0.4, 0.004], 'paper')]
    o += [flat([(x - 0.002, -0.2, 0.0025), (x + 0.002, -0.2, 0.0025), (x + 0.002, 0.2, 0.0025), (x - 0.002, 0.2, 0.0025)], 'crease') for x in (-0.14, 0.0, 0.14)]
    o += [flat([(-0.28, -0.002, 0.0025), (0.28, -0.002, 0.0025), (0.28, 0.002, 0.0025), (-0.28, 0.002, 0.0025)], 'crease')]
    o += [flat([(-0.26, y - 0.004, 0.003), (0.26, y + 0.03, 0.003), (0.26, y + 0.038, 0.003), (-0.26, y + 0.004, 0.003)], 'road') for y in (-0.1, 0.06)]
    o += [flat([(x - 0.003, -0.19, 0.003), (x + 0.003, -0.19, 0.003), (x + 0.02, 0.19, 0.003), (x + 0.014, 0.19, 0.003)], 'road') for x in (-0.08, 0.1)]
    o += [flat([(-0.22, 0.1, 0.003), (-0.14, 0.12, 0.003), (-0.12, 0.17, 0.003), (-0.2, 0.18, 0.003), (-0.24, 0.14, 0.003)], 'water')]
    o += [flat([(0.05, -0.05, 0.0035), (0.09, -0.01, 0.0035), (0.085, -0.005, 0.0035), (0.045, -0.045, 0.0035)], 'pencil'), flat([(0.05, -0.01, 0.0035), (0.09, -0.05, 0.0035), (0.095, -0.045, 0.0035), (0.055, -0.005, 0.0035)], 'pencil')]
    o += [flat([(-0.15 + 0.012*i, -0.12 + 0.01*(i % 2), 0.0035), (-0.145 + 0.012*i, -0.12 + 0.01*(i % 2), 0.0035), (-0.145 + 0.012*i, -0.114 + 0.01*(i % 2), 0.0035), (-0.15 + 0.012*i, -0.114 + 0.01*(i % 2), 0.0035)], 'pencil') for i in range(10)]
    cx, cy = 0.21, -0.14   # compass rose
    o += [flat([(cx, cy + 0.05, 0.0035), (cx + 0.01, cy, 0.0035), (cx, cy - 0.05, 0.0035), (cx - 0.01, cy, 0.0035)], 'ink'), flat([(cx - 0.05, cy, 0.0035), (cx, cy + 0.01, 0.0035), (cx + 0.05, cy, 0.0035), (cx, cy - 0.01, 0.0035)], 'ink'),
          flat([(cx - 0.006, cy + 0.06, 0.0035), (cx + 0.006, cy + 0.06, 0.0035), (cx + 0.006, cy + 0.075, 0.0035), (cx - 0.006, cy + 0.075, 0.0035)], 'red')]
    return o
MAP = {'folded': [box([0, 0, 0.05], [0.14, 0.02, 0.2], 'paper'), flat([(-0.07, 0.0101, 0.0), (0.07, 0.0101, 0.0), (0.07, 0.0101, 0.003), (-0.07, 0.0101, 0.003)], 'crease', (0, 1, 0)),
                  flat([(-0.05, 0.0102, 0.06), (0.04, 0.0102, 0.1), (0.045, 0.0102, 0.105), (-0.045, 0.0102, 0.065)], 'road', (0, 1, 0))],
       'open': map_open()}
INFO['map'] = {'length': 0.56, 'ground': {'roll': 0, 'yaw': 0, 'lift': 0.01},
               'note': 'folded: held like a weapon at the grip. open: a sheet 0.56 by 0.4 m printed on its +Z face; in first person turn it half a turn about Y so the print faces the eye, place its centre at (0, -0.08, 0.42), tip it back 25 degrees, and hold it with both empty hands at its lower corners.'}
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'held_guns.py')).read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'held_reload.py')).read())
# long guns in first person: 'shoulder' is carried ready at the hip, 'aim' brings the sights to the eye (the barrel line passes just under the eye)
FP['shoulder'] = {'right': arm([-0.3, -0.42, -0.08], [-0.24, -0.36, 0.14], [-0.16, -0.24, 0.28]) + fist([-0.14, -0.21, 0.32]),
                  'left':  arm([0.28, -0.46, -0.08], [0.12, -0.44, 0.28], [-0.1, -0.29, 0.56]) + fist([-0.13, -0.26, 0.61]),
                  'weapon': {'pos': [-0.14, -0.21, 0.32], 'rot': [-4, 2, 0], 'note': 'long guns ready: the left fist sits at about offhandAt along the barrel'}}
FP['aim'] = {'right': arm([-0.24, -0.36, -0.06], [-0.17, -0.3, 0.08], [-0.05, -0.17, 0.18]) + fist([0.0, -0.13, 0.22]),
             'left':  arm([0.26, -0.42, -0.06], [0.15, -0.36, 0.25], [0.03, -0.17, 0.52]) + fist([0.0, -0.14, 0.58]),
             'weapon': {'pos': [0.0, -0.112, 0.22], 'rot': [0, 0, 0], 'note': 'aiming down the sights: the carbine front post and rear notch line up just under the eye; the rifle scope line (y 0.086) sits 3 cm low, so raise the hunting rifle by 0.026; pistols and revolvers use the same pose with only the right arm'}}
models = {'weapons': W, 'ammo': AMMO, 'cases': CASES, 'map': MAP, 'fp': {k: {'right': v['right'], 'left': v['left']} for k, v in FP.items()},
          'fpReload': {k: {'right': v['right'], 'left': v['left']} for k, v in RELOAD.items()}}
pack = {
  'name': 'held', 'version': 2, 'style': 'same flat planes and few corners as every pack; worn weapons are taped, chipped, rusty or bent; broken ones end in splinters',
  'units': 'metres', 'palette': PALETTE, 'slots': {'SKIN': 'survivor skin', 'SLEEVE': 'what the survivor wears on top'}, 'darker': 0.78,
  'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': models, 'info': INFO, 'grip': GRIP, 'gripTwoHanded': GRIP_TWO,
  'twoHanded': ['hockey_stick', 'garden_rake', 'broom_spear', 'hunting_rifle', 'pump_shotgun', 'double_barrel', 'carbine', 'crossbow'],
  'fpWeapon': FP['hold']['weapon'], 'fpLong': FP['shoulder']['weapon'], 'fpAim': FP['aim']['weapon'],
  'guns': ['pistol', 'revolver', 'hunting_rifle', 'pump_shotgun', 'double_barrel', 'carbine', 'flare_gun', 'recurve_bow', 'crossbow'],
  'longGuns': ['hunting_rifle', 'pump_shotgun', 'double_barrel', 'carbine', 'crossbow'],
  'ammoInfo': AMMO_INFO, 'fpReload': {k: {kk: vv for kk, vv in v.items() if kk not in ('right', 'left')} for k, v in RELOAD.items()}, 'fpReloadRule': FP_RELOAD_RULE,
  'gunRule': 'Guns have new and worn (under a quarter condition: rust and tape) plus one reload state each (revolver open, hunting_rifle bolt_open, pump_shotgun pumped, double_barrel open, carbine empty, crossbow loaded, recurve_bow drawn) and a flash at INFO.muzzle. Long guns: right fist on the grip, left fist at offhandAt; first person uses fpLong when carried and fpAim when aiming. Casings from models.cases go to +X.',
  'stateRule': 'new above a quarter condition, worn under a quarter, broken when it snaps (the stub stays in the hand until dropped).'
}
out, st = write_pack('held', pack, __file__)
for k, v in st.items(): print(k, v)
