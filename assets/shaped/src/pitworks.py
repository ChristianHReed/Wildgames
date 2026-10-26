#!/usr/bin/env python3
"""Afterstreet pit works pack, version 1 (26 October 2026): the extra pieces digging needs. Writes assets/shaped/pitworks.js. Run: python3 assets/shaped/src/pitworks.py

models.pitworks.<name>, metres, Y up, front +Z, origin at the centre of the base (for tiles, the water surface).
Water: pit_water_shallow, pit_water_knee, pit_water_deep, pit_water_mud (0.5 m tiles; depth in info), seep_wall (a wet streak decal for a pit wall, on its front face).
Collapse: cave_in_pile_s, cave_in_pile_m, cave_in_pile_l, slump_scar (the bare scar on the wall the soil fell from), pit_rim_crumble (a 2 m edge strip with cracks and loose clods), warning_flag (a stake with a red and white flag).
Wall openings: hole_in_wall_brick, hole_in_wall_concrete, hole_in_wall_timber (1 m by 2 m ragged frames, 0.3 m deep: the opening is clear).
Colour names are in the palette."""
import math
from bld import *
P = {'soil': '#6a4a30', 'soilD': '#4e3722', 'soilL': '#8a6844', 'clay': '#a8643c', 'chert': '#b0a890', 'water': '#3a5a6a', 'waterD': '#2a4452', 'waterL': '#6a8a98', 'mud': '#5a4a2e', 'mudD': '#443822', 'brick': '#8a4a38', 'brickD': '#6a3828', 'mortar': '#b4aea0',
     'concrete': '#a8a69e', 'concreteD': '#807e76', 'steel': '#6a7078', 'wood': '#9a7a52', 'woodD': '#6e5238', 'red': '#b32d24', 'white': '#ece8dc', 'black': '#1c1d20', 'wet': '#3a2a1c', 'rebar': '#7a4a2a'}
def lump(x, z, r, h, c, n=7):
    return loft([[x, 0, z, r, r*0.9], [x, h*0.45, z, r*0.8, r*0.72], [x, h, z, r*0.28, r*0.25]], c, n=n)
def water(depth, c, cd):
    o = [bx(0, -0.04, 0, 0.5, 0.04, 0.5, c)]
    o += [bx(-0.15, 0, 0.1, 0.12, 0.004, 0.06, 'waterL'), bx(0.12, 0, -0.14, 0.1, 0.004, 0.05, 'waterL')]
    if depth > 0.4: o += [bx(0, -0.04, 0, 0.44, 0.02, 0.44, cd)]
    return o
for nm, dp, c, cd in (('shallow', 0.15, 'water', 'waterD'), ('knee', 0.5, 'water', 'waterD'), ('deep', 1.4, 'waterD', 'waterD'), ('mud', 0.3, 'mud', 'mudD')):
    reg('pit_water_' + nm, water(dp, c, cd), 0.5, 0.5, 0.05, 'a 0.5 m square water surface, depth %.2f m (%s): set it flush in a pit, the top at the water line' % (dp, 'muddy brown' if nm == 'mud' else 'clear'))
reg('seep_wall', [flat([(-0.5, 0.0, 0.002), (0.5, 0.0, 0.002), (0.5, 1.0, 0.002), (-0.5, 1.0, 0.002)], 'wet')] + [bx(x, 0.0, 0.006, 0.07, 0.6 + 0.3*((i*3) % 3)*0.5, 0.01, 'wet') for i, x in enumerate((-0.35, -0.1, 0.12, 0.35))] + [bx(0, 0, 0.01, 0.9, 0.05, 0.02, 'waterD')], 1.0, 0.05, 1.0, 'a damp patch and drip streaks on a pit wall (decal, back on the wall at z 0); the wall above a water table')
reg('cave_in_pile_s', [lump(0, 0, 0.7, 0.5, 'soil'), lump(0.4, 0.2, 0.35, 0.3, 'soilL'), lump(-0.3, 0.3, 0.25, 0.2, 'clay')], 1.5, 1.3, 0.5, 'a small slide of soil on a pit floor, a half-metre high; blocks a ladder foot')
reg('cave_in_pile_m', [lump(0, 0, 1.2, 0.9, 'soil'), lump(0.8, 0.3, 0.6, 0.6, 'soilL'), lump(-0.7, 0.4, 0.5, 0.5, 'soilD'), lump(0.1, 0.9, 0.4, 0.4, 'clay'), lump(-0.2, -0.6, 0.35, 0.3, 'chert')], 2.8, 2.4, 0.9, 'a medium fall: a heap 2.5 m across and 0.9 m high that half-fills a small pit')
reg('cave_in_pile_l', [lump(0, 0, 2.0, 1.7, 'soil', 9), lump(1.4, 0.5, 1.0, 1.1, 'soilL'), lump(-1.3, 0.6, 0.9, 1.0, 'soilD'), lump(0.3, 1.5, 0.7, 0.8, 'clay'), lump(-0.5, -1.2, 0.6, 0.6, 'chert'), lump(1.0, -1.0, 0.5, 0.5, 'soilL')], 4.8, 4.2, 1.7, 'a big fall 4.5 m across and 1.7 m high: buries a person and fills a pit; dig it out')
reg('slump_scar', [bx(0, 0, 0, 2.4, 1.6, 0.06, 'soilD')] + [bx(-0.9 + i*0.45, 0.25 + 0.5*((i*7) % 3)*0.5, 0.05, 0.4, 0.5, 0.06, 'soil' if i % 2 else 'soilL') for i in range(5)] + [bx(0, 1.55, 0.08, 2.6, 0.1, 0.18, 'soilL')], 2.6, 0.3, 1.7, 'the bare scar on the wall a slide fell from: a rough face and a broken lip on top (the back sits on the wall at z 0)')
reg('pit_rim_crumble', [bx(0, 0, 0, 2.0, 0.03, 0.8, 'soilD')] + [bx(-0.9 + i*0.45, 0.0, 0.1 - 0.15*(i % 2), 0.12 + 0.05*(i % 3), 0.07, 0.08, 'soilL') for i in range(5)] + [bx(0, 0.03, 0.05, 1.8, 0.01, 0.015, 'black'), bx(-0.4, 0.03, -0.12, 0.7, 0.01, 0.015, 'black'), bx(0.55, 0.03, 0.2, 0.5, 0.01, 0.015, 'black')], 2.0, 0.8, 0.1, 'a 2 m strip of cracked, loose edge on the lip of a pit: where the soil will give way when stepped on')
reg('warning_flag', [bx(0, 0, 0, 0.04, 1.3, 0.04, 'wood'), bx(0.2, 0.9, 0, 0.4, 0.3, 0.015, 'red'), bx(0.2, 1.05, 0.0, 0.4, 0.1, 0.016, 'white')], 0.5, 0.05, 1.3, 'a stake with a red and white flag: stands at an unsafe rim')
def hole(kind):
    W, H, T = 1.0, 2.0, 0.3
    c1, c2 = {'brick': ('brick', 'brickD'), 'concrete': ('concrete', 'concreteD'), 'timber': ('wood', 'woodD')}[kind]
    o = [bx(-W/2 - 0.3, 0, 0, 0.6, H + 0.4, T, c1), bx(W/2 + 0.3, 0, 0, 0.6, H + 0.3, T, c2), bx(0, H, 0, W + 0.4, 0.4, T, c1)]
    o += [bx(-W/2 - 0.1, 0.4, 0.04, 0.3, 0.3, T, c2), bx(W/2 + 0.1, 1.2, -0.04, 0.3, 0.3, T, c1), bx(-0.3, H - 0.15, 0.0, 0.4, 0.2, T, c2)]
    if kind == 'concrete': o += [bx(-0.3, 0.3, 0, 0.03, 0.7, 0.03, 'rebar'), bx(0.35, 1.3, 0.0, 0.03, 0.6, 0.03, 'rebar'), bx(0.0, 1.9, 0.0, 0.6, 0.03, 0.03, 'rebar')]
    if kind == 'brick': o += [bx(-W/2 - 0.55 + (i % 2)*0.1, 0.1 + i*0.3, 0.17, 0.2, 0.07, 0.02, 'mortar') for i in range(7)]
    if kind == 'timber': o += [bx(-W/2 - 0.3, 0, 0.16, 0.6, 0.04, 0.02, 'black'), bx(W/2 + 0.3, 0.8, 0.16, 0.6, 0.04, 0.02, 'black')]
    o += [bx(0, 0, 0.0, W, 0.06, T, c2), bx(-0.2, 0, 0.5, 0.35, 0.18, 0.3, c2), bx(0.25, 0, 0.6, 0.25, 0.12, 0.2, c1)]
    return o
for k in ('brick', 'concrete', 'timber'):
    reg('hole_in_wall_' + k, hole(k), 2.2, 1.0, 2.4, 'a ragged %s frame round a 1 by 2 m hole dug through a wall (the opening is clear), with a few loose pieces on the floor' % k)
pack_use = {'pit with water table': ['pit_water_shallow', 'pit_water_knee', 'pit_water_deep', 'seep_wall'], 'unstable pit': ['pit_rim_crumble', 'warning_flag', 'slump_scar'], 'after a collapse': ['cave_in_pile_s', 'cave_in_pile_m', 'cave_in_pile_l'], 'wall dug through': ['hole_in_wall_brick', 'hole_in_wall_concrete', 'hole_in_wall_timber']}
finish('pitworks', P, __doc__, __file__, 'boxes and lofts; flat colours', pack_use,
       'Water: fill the bottom of a pit up to the water line with 0.5 m tiles (the depth in info: 0.15, 0.5, 1.4 m); a pit under the water table fills over time (a seep_wall on its walls shows it). Cave-ins: the game picks the pile by how much soil fell (s under 1, m under 3, l over 3 cubic metres), sets the pile on the pit floor against the wall and the slump_scar on the wall above it. A pit rim marked unstable gets pit_rim_crumble along the edge and a warning_flag at each corner. Wall holes: place the hole_in_wall frame in the wall where the player dug.')
