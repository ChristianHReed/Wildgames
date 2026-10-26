#!/usr/bin/env python3
"""Afterstreet civic and institutional pack, version 1 (26 October 2026): the buildings the map labels church (233), place_of_worship (321), school (252), university (185), hospital (95), civic (1,176) and stadium (19), and the places that go with them. Writes assets/shaped/civic.js. Run: python3 assets/shaped/src/civic.py

models.civic.<name>, metres, origin at the centre of the footprint on the ground, front facing +Z.
Churches: church_country (white, 7 x 12 m, steeple), church_large (brick, 14 x 28 m, tower and spire), steeple_white and steeple_brick (add a tower to a building you already have), bell_tower_open, church_sign.
Civic: courthouse (columns and dome), town_hall_small, clock_tower, hose_tower, flagpole_civic, memorial_wall.
Schools and university: school_front, school_sign, university_hall. Health: hospital_wing, er_canopy, helipad. Sport: stadium_light, grandstand_small. Hotels: porte_cochere.
Cemetery: headstone_arch, headstone_flat, headstone_cross, headstone_obelisk, headstone_row (six), mausoleum, cemetery_gate, flag_marker.
Colour names are in the palette."""
import math
from bld import *
P = {'tin': '#8a9096', 'bench': '#8a6a44', 'grassD': '#587a3c', 'doorD': '#5a4a2c', 'iron': '#25262a', 'white': '#ece8dc', 'clap': '#d8d2bc', 'clapD': '#b8b29c', 'brick': '#8a4a38', 'brickD': '#6a3828', 'brickL': '#a85e48', 'stone': '#aaa698', 'stoneD': '#8a867a', 'stoneL': '#c8c4b4', 'granite': '#4a4c50', 'graniteL': '#6a6c70', 'marble': '#e0ddd4',
     'slate': '#4a5a6a', 'slateD': '#38465a', 'shingle': '#5a5048', 'copper': '#5a9a86', 'copperD': '#427a68', 'gold': '#c8a040', 'glass': '#2a3a46', 'glassL': '#5a7a8a', 'door': '#6a2a24', 'doorW': '#e8e4da', 'red': '#b02e24', 'redD': '#80201a', 'blue': '#2a4a7a', 'blueD': '#1e3658',
     'wood': '#9a7a52', 'woodD': '#6e5238', 'steel': '#6a7078', 'steelD': '#4a4e54', 'steelL': '#9aa0a6', 'concrete': '#a8a69e', 'concreteD': '#807e76', 'black': '#1c1d20', 'yellow': '#e0b420', 'green': '#3a6a3a', 'greenD': '#2a4a2a', 'panel': '#d4d6d0', 'panelD': '#aeb0aa',
     'lamp': '#fff2b0', 'chrome': '#c8ccd0', 'grass': '#6a8a48', 'flagR': '#b02e24', 'flagW': '#f0eee8', 'flagB': '#243a78', 'asphalt': '#3a3c40', 'tape': '#e0b830', 'cross': '#e8e4da', 'bell': '#b88a38'}
def steeple(w, h_base, col, roofc, spire):
    """a church tower: base to h_base, a belfry with louvred openings, a four-sided spire and a cross; origin at the base centre"""
    o = [bx(0, 0, 0, w, h_base, w, col), bx(0, h_base, 0, w + 0.3, 0.25, w + 0.3, 'stoneL'), bx(0, h_base + 0.25, 0, w - 0.3, 2.6, w - 0.3, col)]
    for sx, sz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        px, pz = sx*(w/2 - 0.12), sz*(w/2 - 0.12)
        o.append(bx(px, h_base + 0.8, pz, 0.06 if sx else 1.0, 1.7, 0.06 if sz else 1.0, 'black'))
        o += [bx(px + sx*0.04, h_base + 0.95 + i*0.3, pz + sz*0.04, 0.06 if sx else 1.1, 0.07, 0.06 if sz else 1.1, col) for i in range(5)]
    o += [bx(0, h_base + 2.85, 0, w + 0.5, 0.2, w + 0.5, 'stoneL')] + pyramid(w + 0.3, w + 0.3, h_base + 3.05, spire, roofc)
    o += [bx(0, h_base + 3.05 + spire, 0, 0.1, 0.9, 0.1, 'gold'), bx(0, h_base + 3.05 + spire + 0.5, 0, 0.5, 0.1, 0.1, 'gold')]
    return o + arch_win(0, 2.2, 0.9, 1.6, w/2 + 0.02, 'glass', 'stoneL') + [bx(0, 0, w/2 + 0.02, 1.4, 2.0, 0.08, 'door')]
reg('steeple_white', steeple(4.0, 6.0, 'clap', 'shingle', 9.0), 4.7, 4.7, 19.0, 'a clapboard church tower 4 m square: arched window, louvred belfry and a 9 m spire with a gold cross, 19 m in all; set it at the front of a church')
reg('steeple_brick', steeple(5.0, 8.0, 'brick', 'slate', 12.0), 5.7, 5.7, 25.0, 'a brick church tower 5 m square with a slate spire, 25 m in all')
def church_country():
    w, d = 7.0, 12.0
    o = [bx(0, 0, 0, w + 0.2, 0.5, d + 0.2, 'concrete'), bx(0, 0.5, 0, w, 3.4, d, 'clap'), *gable(w, d, 3.9, 2.6, 'shingle', 0.4, 0.5, along='z')]
    for z in (-3.2, 0.0, 3.2):
        for sx in (-1, 1): o += [bx(sx*(w/2 + 0.03), 1.4, z, 0.06, 1.6, 0.9, 'glassL'), bx(sx*(w/2 + 0.04), 3.0, z, 0.05, 0.5, 0.6, 'glassL')]
    o += [bx(0, 0.5, d/2 + 0.05, 1.8, 2.4, 0.1, 'door'), bx(0, 0.2, d/2 + 0.6, 2.6, 0.3, 1.2, 'concrete'), bx(0, 0.0, d/2 + 1.3, 2.8, 0.2, 0.7, 'concreteD')]
    return o + shift(steeple(3.0, 4.0, 'clap', 'shingle', 6.0), 0, 0, d/2 - 0.4)
reg('church_country', church_country(), 7.8, 14.5, 17.5, 'a white country church 7 by 12 m, gable roof, three tall windows a side and a double door, a small steeple on the front: the small church of the Ozarks (the front is +z)')
def church_large():
    w, d = 14.0, 28.0
    o = [bx(0, 0, 0, w + 0.4, 0.6, d + 0.4, 'stoneD'), bx(0, 0.6, 0, w, 6.2, d, 'brick'), *gable(w, d, 6.8, 5.0, 'slate', 0.5, 0.6, along='z')]
    for z in (-9.0, -4.5, 0.0, 4.5, 9.0):
        for sx in (-1, 1): o += [bx(sx*(w/2 + 0.03), 2.2, z, 0.08, 2.8, 1.3, 'glassL'), hull([(sx*(w/2 + 0.03), 5.0, z - 0.65), (sx*(w/2 + 0.03), 5.0, z + 0.65), (sx*(w/2 + 0.03), 5.9, z + 0.1), (sx*(w/2 + 0.03), 5.9, z - 0.1), (sx*(w/2 + 0.08), 5.0, z - 0.65), (sx*(w/2 + 0.08), 5.0, z + 0.65), (sx*(w/2 + 0.08), 5.9, z + 0.1), (sx*(w/2 + 0.08), 5.9, z - 0.1)], 'glassL')]
    o += [bx(-2.5, 0.6, d/2 + 0.05, 1.8, 3.0, 0.12, 'door'), bx(2.5, 0.6, d/2 + 0.05, 1.8, 3.0, 0.12, 'door'), bx(0, 6.8, d/2 + 0.05, 2.6, 2.6, 0.06, 'glassL')]
    o += [bx(0, 0, d/2 + 1.2, 9.0, 0.3, 2.0, 'concrete'), bx(0, 0, d/2 + 2.4, 9.4, 0.15, 0.8, 'concreteD')]
    return o + shift(steeple(5.0, 9.0, 'brick', 'slate', 11.0), 0, 0, d/2 - 2.5)
reg('church_large', church_large(), 14.8, 33.0, 29.5, 'a brick church 14 by 28 m with a slate roof, five tall arched windows a side, two doors and a rose window, and a 26 m tower and spire at the front (+z)')
reg('bell_tower_open', [bx(0, 0, 0, 3.0, 0.4, 3.0, 'concrete')] + [bx(sx*1.2, 0.4, sz*1.2, 0.3, 4.4, 0.3, 'woodD') for sx in (-1, 1) for sz in (-1, 1)] + [bx(0, 4.8, 0, 3.2, 0.2, 3.2, 'woodD')] + pyramid(3.4, 3.4, 5.0, 1.6, 'shingle') + [bx(0, 3.3, 0, 0.1, 1.3, 0.1, 'steelD'), cylv(0, 2.4, 0, 0.5, 0.9, 'bell', 10), bx(0, 4.7, 0, 3.0, 0.1, 0.1, 'woodD')], 3.4, 3.4, 6.6,
    'a free-standing open bell tower 3 m square with a hanging bell and a shingled roof (a school, a camp or a country church yard); ring it as an alarm')
reg('church_sign', [bx(sx*0.9, 0, 0, 0.15, 1.8, 0.15, 'woodD') for sx in (-1, 1)] + [bx(0, 0.9, 0, 2.2, 1.0, 0.12, 'brick'), bx(0, 1.0, 0.07, 1.9, 0.5, 0.03, 'white'), bx(0, 1.55, 0, 2.3, 0.15, 0.2, 'woodD'), bx(0, 1.8, 0, 0.1, 0.5, 0.1, 'white'), bx(0, 2.1, 0, 0.4, 0.1, 0.1, 'white')], 2.4, 0.3, 2.4,
    'a church notice board on two posts: a white message panel (put a text decal on it at z 0.07) under a small cross')
# ---- civic
def courthouse():
    w, d = 30.0, 20.0
    o = [bx(0, 0, 0, w + 0.6, 1.0, d + 0.6, 'stoneD'), bx(0, 1.0, 0, w, 9.0, d, 'stoneL'), bx(0, 10.0, 0, w + 0.8, 0.8, d + 0.8, 'stone'), bx(0, 5.5, d/2 + 0.04, w, 0.25, 0.06, 'stone')]
    for x in range(-12, 13, 4):
        for y in (2.0, 6.2): o += [bx(x, y, d/2 + 0.04, 1.4, 2.6, 0.06, 'glassL'), bx(x, y - 0.1, d/2 + 0.06, 1.8, 0.15, 0.1, 'stone')]
    o += [bx(0, 1.0, d/2 + 3.0, 14.0, 0.4, 6.0, 'stone'), bx(0, 1.4, d/2 + 6.2, 14.0, 0.4, 0.8, 'stone')]
    o += columns([-5.5, -3.3, -1.1, 1.1, 3.3, 5.5], d/2 + 5.0, 8.6, 0.55, 1.0, 'marble') + [bx(0, 9.6, d/2 + 3.0, 15.0, 1.0, 6.4, 'stone')]
    o += [solid([(-7.8, 10.6, d/2 - 0.2), (7.8, 10.6, d/2 - 0.2), (0, 13.0, d/2 - 0.2), (-7.8, 10.6, d/2 + 6.2), (7.8, 10.6, d/2 + 6.2), (0, 13.0, d/2 + 6.2)], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], 'stoneL')]
    o += [bx(0, 1.0, d/2 + 0.04, 2.2, 3.6, 0.1, 'door'), bx(0, 10.8, 0, 9.0, 1.4, 9.0, 'stoneL')]
    o += [loft([[0, 12.2, 0, 4.2, 4.2], [0, 14.0, 0, 4.0, 4.0]], 'stoneL', n=16), loft([[0, 14.0, 0, 4.2, 4.2], [0, 14.4, 0, 4.4, 4.4]], 'stone', n=16)]
    o += [loft([[0, 14.4, 0, 4.2, 4.2], [0, 16.0, 0, 3.6, 3.6], [0, 18.0, 0, 2.2, 2.2], [0, 19.2, 0, 0.9, 0.9]], 'copper', n=16), loft([[0, 19.2, 0, 1.0, 1.0], [0, 20.8, 0, 0.8, 0.8]], 'stoneL', n=10), loft([[0, 20.8, 0, 0.9, 0.9], [0, 21.8, 0, 0.0, 0.0]], 'copper', n=10)]
    o += [bx(0, 21.7, 0, 0.08, 1.4, 0.08, 'steelL'), bx(0.55, 22.5, 0, 1.0, 0.6, 0.04, 'flagR')]
    return o
reg('courthouse', courthouse(), 31.0, 31.0, 23.0, 'a county courthouse 30 by 20 m: a stone block, a portico of six marble columns under a pediment (+z), a drum and a green copper dome with a lantern and a flag: the building on a town square')
def town_hall():
    w, d = 14.0, 10.0
    o = [bx(0, 0, 0, w + 0.4, 0.6, d + 0.4, 'stoneD'), bx(0, 0.6, 0, w, 6.4, d, 'brick'), bx(0, 7.0, 0, w + 0.6, 0.4, d + 0.6, 'white'), *hip(w, d, 7.4, 2.2, 'slate', 0.5)]
    for x in (-4.5, -1.5, 1.5, 4.5):
        for y in (1.6, 4.4):
            if not (abs(x) < 2 and y < 3): o += win(x, y, 1.0, 1.6, d/2 + 0.02)
    o += [bx(0, 0.6, d/2 + 0.04, 1.2, 2.4, 0.1, 'door')] + columns([-1.8, -0.6, 0.6, 1.8], d/2 + 1.6, 3.8, 0.18, 0.6, 'white') + [bx(0, 4.4, d/2 + 1.2, 4.8, 0.3, 2.6, 'white'), bx(0, 0.0, d/2 + 1.2, 5.0, 0.6, 2.6, 'concrete')]
    o += [solid([(-2.6, 4.7, d/2 - 0.1), (2.6, 4.7, d/2 - 0.1), (0, 5.9, d/2 - 0.1), (-2.6, 4.7, d/2 + 2.5), (2.6, 4.7, d/2 + 2.5), (0, 5.9, d/2 + 2.5)], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], 'white')]
    return o + [bx(0, 9.6, 0, 2.2, 1.4, 2.2, 'white'), *hip(2.2, 2.2, 11.0, 1.2, 'copper', 0.2), bx(0, 12.2, 0, 0.06, 1.0, 0.06, 'steelL')]
reg('town_hall_small', town_hall(), 15.0, 14.0, 13.5, 'a town hall 14 by 10 m: two storeys of brick, a four-column portico with a pediment (+z), a slate hip roof and a cupola with a copper cap')
def clock_tower():
    w = 4.0
    o = [bx(0, 0, 0, w + 0.6, 0.8, w + 0.6, 'stoneD'), bx(0, 0.8, 0, w, 10.0, w, 'brick'), bx(0, 10.8, 0, w + 0.5, 0.4, w + 0.5, 'stoneL'), bx(0, 11.2, 0, w, 3.0, w, 'brick'), bx(0, 14.2, 0, w + 0.5, 0.3, w + 0.5, 'stoneL')]
    o += pyramid(w + 0.5, w + 0.5, 14.5, 4.0, 'slate') + [bx(0, 0.8, w/2 + 0.04, 1.0, 2.2, 0.1, 'door'), bx(0, 18.5, 0, 0.08, 1.2, 0.08, 'steelL')]
    for sx, sz in ((1, 0), (-1, 0), (0, 1), (0, -1)):   # a white clock face on each side with two black hands
        px, pz = sx*(w/2 + 0.04), sz*(w/2 + 0.04)
        o.append(bx(px, 11.8, pz, 0.06 if sx else 2.2, 2.2, 0.06 if sz else 2.2, 'white'))
        o.append(bx(px + sx*0.04, 12.9, pz + sz*0.04, 0.04 if sx else 0.1, 0.9, 0.04 if sz else 0.1, 'black'))
        o.append(bx(px + sx*0.04, 12.85, pz + sz*0.04, 0.04 if sx else 0.7, 0.1, 0.04 if sz else 0.7, 'black'))
    return o
reg('clock_tower', clock_tower(), 4.6, 4.6, 19.7, 'a free-standing brick clock tower 4 m square, 19 m with a slate spire, a white clock face on each side (black hands at 12:50); a town landmark; stop the clock for a stopped-world feel')
reg('hose_tower', [bx(0, 0, 0, 4.0, 12.0, 4.0, 'brick'), bx(0, 12.0, 0, 4.4, 0.4, 4.4, 'stoneL'), *[bx(sx*1.5, 12.4, sz*1.5, 0.4, 0.6, 0.4, 'brickD') for sx in (-1, 1) for sz in (-1, 1)], *[bx(0, 3 + 3*i, 2.02, 0.8, 1.2, 0.05, 'glass') for i in range(3)]], 4.4, 4.4, 13.0, 'a fire station hose tower 4 m square, 12 m high, with crenellations and three slit windows; stands beside the fire station')
def flagpole():
    o = [bx(0, 0, 0, 0.8, 0.3, 0.8, 'concrete'), cylv(0, 0.3, 0, 0.09, 11.0, 'steelL', 8), loft([[0, 11.3, 0, 0.14, 0.14], [0, 11.5, 0, 0.0, 0.0]], 'gold', n=8)]
    o += [bx(0.9, 10.9 - i*0.17, 0, 1.7, 0.17, 0.03, 'flagR' if i % 2 == 0 else 'flagW') for i in range(7)]
    return o + [bx(0.45, 10.9 - 3*0.17, 0, 0.8, 0.51, 0.04, 'flagB')]
reg('flagpole_civic', flagpole(), 2.0, 0.8, 11.5, 'a civic flagpole 11 m with a striped flag and a blue canton; one outside every school, courthouse, police and fire station; a flag at half mast is a sign of a world gone wrong')
reg('memorial_wall', [bx(0, 0, 0, 8.0, 0.3, 1.2, 'concrete'), bx(0, 0.3, 0, 7.4, 1.8, 0.4, 'granite'), bx(0, 0.3, 0.22, 7.0, 1.4, 0.04, 'graniteL'), bx(0, 2.1, 0, 7.6, 0.2, 0.5, 'stone'), bx(-3.9, 0.3, 0.0, 0.4, 2.2, 0.6, 'stone'), bx(3.9, 0.3, 0.0, 0.4, 2.2, 0.6, 'stone')], 8.4, 1.2, 2.5,
    'a black granite memorial wall 7.4 m long with a panel for names (a decal goes on the face at z 0.22) between two stone piers: for war memorials and for the dead of the outbreak')
# ---- schools, university, hospital, sport, hotel
def school():
    w, d = 36.0, 12.0
    o = [bx(0, 0, 0, w, 0.5, d, 'concreteD'), bx(0, 0.5, 0, w, 3.6, d, 'brick'), bx(0, 4.1, 0, w + 0.6, 0.4, d + 0.6, 'stoneL'), bx(0, 0.5, d/2 + 0.04, w - 10, 1.0, 0.04, 'brickD')]
    for x0, x1 in ((-17.0, -5.5), (5.5, 17.0)):
        xc = (x0 + x1)/2; o.append(bx(xc, 1.5, d/2 + 0.04, x1 - x0, 1.8, 0.05, 'glassL'))
        o += [bx(x, 1.5, d/2 + 0.07, 0.08, 1.8, 0.04, 'white') for x in [x0 + i*(x1 - x0)/4 for i in range(5)]]
    o += [bx(0, 0.5, d/2 + 0.75, 8.0, 5.0, 1.5, 'brick'), bx(0, 5.5, d/2 + 0.75, 8.6, 0.4, 2.1, 'stoneL'), bx(-1.1, 0.5, d/2 + 1.52, 1.8, 2.3, 0.06, 'glassL'), bx(1.1, 0.5, d/2 + 1.52, 1.8, 2.3, 0.06, 'glassL')]
    o += [bx(0, 2.9, d/2 + 1.9, 6.0, 0.15, 0.8, 'stoneL'), bx(0, 3.6, d/2 + 1.54, 5.0, 0.9, 0.05, 'white'), bx(0, 0, d/2 + 1.9, 6.0, 0.2, 1.2, 'concrete')]
    o += [bx(sx*2.8, 0.2, d/2 + 2.3, 0.2, 2.7, 0.2, 'white') for sx in (-1, 1)] + [bx(0, 6.0, d/2 + 0.75, 2.4, 1.6, 1.6, 'brick')] + pyramid(2.8, 1.9, 7.6, 1.6, 'slate', cz=d/2 + 0.75) + [cylv(0, 6.4, d/2 + 1.7, 0.18, 0.3, 'bell', 8)]
    return o
reg('school_front', school(), 36.6, 15.0, 9.3, 'a school 36 by 12 m: long low brick with two continuous window bands, and a central entry bay with glass doors, a white sign band and a bell cupola on top; the classrooms are behind; add flagpole_civic and school_sign')
reg('school_sign', [bx(sx*1.3, 0, 0, 0.25, 1.4, 0.25, 'brick') for sx in (-1, 1)] + [bx(0, 0.9, 0, 3.0, 1.1, 0.25, 'brickD'), bx(0, 1.0, 0.14, 2.6, 0.8, 0.04, 'white'), bx(0, 2.0, 0, 3.0, 0.2, 0.3, 'stoneL')], 3.3, 0.3, 2.2, 'a school entrance sign on two brick piers: a white panel (a text decal goes on it at z 0.14)')
def university():
    w, d = 24.0, 14.0
    o = [bx(0, 0, 0, w + 0.6, 1.0, d + 0.6, 'stoneD'), bx(0, 1.0, 0, w, 8.4, d, 'brickL'), bx(0, 9.4, 0, w + 0.8, 0.5, d + 0.8, 'white'), *hip(w, d, 9.9, 2.6, 'slate', 0.6)]
    for x in (-9, -6, 6, 9):
        for y in (2.0, 5.6): o += arch_win(x, y, 1.1, 2.0, d/2 + 0.02, 'glass', 'white')
    o += [bx(0, 1.0, d/2 + 0.04, 2.2, 3.4, 0.1, 'door'), bx(0, 0.4, d/2 + 2.2, 10.0, 0.6, 3.6, 'stone'), bx(0, 0.0, d/2 + 3.8, 11.0, 0.4, 1.0, 'stoneD')]
    o += columns([-4.0, -1.3, 1.3, 4.0], d/2 + 3.4, 7.8, 0.4, 1.0, 'white') + [bx(0, 8.8, d/2 + 2.2, 11.0, 0.9, 4.2, 'white')]
    o += [solid([(-5.8, 9.7, d/2 + 0.4), (5.8, 9.7, d/2 + 0.4), (0, 11.6, d/2 + 0.4), (-5.8, 9.7, d/2 + 4.4), (5.8, 9.7, d/2 + 4.4), (0, 11.6, d/2 + 4.4)], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], 'white')]
    return o + [bx(0, 12.4, 0, 3.0, 1.8, 3.0, 'white'), *hip(3.0, 3.0, 14.2, 1.4, 'copper', 0.3), bx(0, 15.6, 0, 0.06, 1.0, 0.06, 'steelL')]
reg('university_hall', university(), 25.0, 19.0, 17.0, 'a university hall 24 by 14 m: red brick with white trim and a four-column portico and pediment on the front (+z), tall arched windows, a slate roof and a cupola: the hall on a campus quad')
def hospital():
    w, d = 30.0, 14.0
    o = [bx(0, 0, 0, w, 0.4, d, 'concreteD'), bx(0, 0.4, 0, w, 9.0, d, 'panel'), bx(0, 9.4, 0, w + 0.4, 0.5, d + 0.4, 'panelD')]
    for y in (1.6, 5.0): o.append(bx(-0.0, y, d/2 + 0.04, w - 6, 1.2, 0.05, 'glassL'))
    for x in (-12, -8, -4, 4, 8, 12): o.append(bx(x, 0.4, d/2 + 0.05, 0.1, 9.0, 0.04, 'panelD'))
    o += [bx(0, 0.4, d/2 + 0.05, 5.0, 3.4, 0.06, 'glass'), bx(0, 9.9, d/2 - 1.0, 6.0, 1.6, 0.3, 'red'), bx(0, 10.2, d/2 - 0.82, 1.0, 1.0, 0.05, 'white'), bx(0, 10.5, d/2 - 0.82, 0.3, 0.6, 0.05, 'red'), bx(0, 10.35, d/2 - 0.82, 0.6, 0.3, 0.05, 'red')]
    return o
reg('hospital_wing', hospital(), 30.4, 14.4, 11.6, 'a hospital block 30 by 14 m: pale panels, two bands of glass, a glazed entrance and a red-cross sign on the roof parapet; add er_canopy at the ambulance door and helipad on a roof or a lot')
reg('er_canopy', [bx(sx, 0, sz, 0.4, 3.8, 0.4, 'panelD') for sx in (-4.4, 4.4) for sz in (-2.4, 2.4)] + [bx(0, 3.8, 0, 10.0, 0.5, 6.0, 'white'), bx(0, 3.9, 3.02, 10.0, 0.3, 0.05, 'red'), bx(0, 0, 0, 10.0, 0.05, 6.0, 'asphalt'), bx(0, 4.3, 3.02, 3.0, 0.8, 0.05, 'red'), bx(0, 4.4, 3.06, 2.4, 0.5, 0.03, 'white', glow=True)], 10.0, 6.0, 5.1, 'an emergency-entrance canopy 10 by 6 m, 3.8 m clear for ambulances, with a red band and a lit EMERGENCY sign')
def helipad():
    o = [bx(0, 0, 0, 14.0, 0.25, 14.0, 'concrete'), bx(0, 0.25, 0, 11.0, 0.02, 0.5, 'yellow')]
    o += [bx(sx*2.0, 0.25, 0, 0.5, 0.02, 4.5, 'white') for sx in (-1, 1)] + [bx(0, 0.25, 0, 3.5, 0.02, 0.5, 'white')]
    o += [bx(x, 0.25, z, 0.25, 0.25, 0.25, 'lamp', glow=True) for x, z in ((-6.8, -6.8), (6.8, -6.8), (6.8, 6.8), (-6.8, 6.8), (0, -6.9), (0, 6.9), (-6.9, 0), (6.9, 0))]
    o += [bx(8.0, 0, 8.0, 0.1, 5.0, 0.1, 'steel'), bx(8.0, 4.0, 8.0, 0.12, 0.5, 1.4, 'red'), bx(8.0, 4.5, 8.0, 0.12, 0.5, 1.4, 'white')]
    return o
reg('helipad', helipad(), 14.6, 14.6, 5.0, 'a helipad 14 m square: a concrete pad with a white H, a yellow bar, eight lights and a red and white windsock pole at the corner')
def stadium_light():
    o = [bx(0, 0, 0, 0.8, 0.4, 0.8, 'concrete'), cylv(0, 0.4, 0, 0.22, 19.6, 'steel', 8)]
    o += [bx(0, 20.0, 0, 5.0, 0.2, 0.5, 'steelD')]
    for r in range(3):
        for c in range(5): o.append(bx(-2.0 + c*1.0, 20.2 + r*0.55, 0.3, 0.8, 0.45, 0.2, 'lamp', glow=True))
    return o
reg('stadium_light', stadium_light(), 5.0, 1.0, 22.0, 'a 20 m sports-field floodlight pole with a 15-lamp bank facing +z; place four around a field')
def grandstand():
    o = []
    for i in range(6):
        o += [bx(0, 0, -i*0.9, 14.0, 0.4 + i*0.45, 0.9, 'concrete' if i % 2 else 'concreteD')]
    o += [bx(sx*7.0, 0, -2.2, 0.3, 4.8, 0.3, 'steel') for sx in (-1, 1)] + [bx(0, 4.8, -2.2, 14.6, 0.2, 6.6, 'tin'), bx(0, 0.5, -5.6, 14.0, 3.0, 0.2, 'steelD')]
    o += [bx(x, 0.4 + i*0.45, -i*0.9, 1.8, 0.1, 0.4, 'bench') for i in range(1, 6) for x in (-4.5, 0, 4.5)]
    return o
reg('grandstand_small', grandstand(), 14.6, 6.8, 5.0, 'a small six-row bleacher 14 m wide with a tin roof on two posts, rows rising away from +z; for a school field or ball park')
def porte():
    o = [bx(sx*3.6, 0, sz*2.4, 0.4, 3.6, 0.4, 'stoneL') for sx in (-1, 1) for sz in (-1, 1)]
    o += [bx(0, 3.6, 0, 8.6, 0.5, 6.0, 'stoneL'), bx(0, 4.1, 0, 7.4, 0.3, 5.0, 'slate'), bx(0, 0, 0, 8.0, 0.05, 5.6, 'asphalt')]
    return o
reg('porte_cochere', porte(), 8.6, 6.0, 4.4, 'a covered carriage entrance 8 by 6 m, 3.6 m clear, on four stone piers; fits on the front of courthouse, university_hall or a hotel')

# ---- cemetery
def stone(w, h, t, c='granite'):
    return [bx(0, 0, 0, w + 0.2, 0.15, t + 0.2, 'concrete'), bx(0, 0.15, 0, w, h, t, c)]
def hs_arch():
    return stone(0.7, 0.8, 0.15) + [bx(0, 0.95, 0, 0.56, 0.12, 0.15, 'granite'), bx(0, 1.07, 0, 0.36, 0.1, 0.15, 'granite'), bx(0, 1.17, 0, 0.16, 0.06, 0.15, 'granite')]
reg('headstone_arch', hs_arch(), 0.9, 0.35, 1.25, 'a round-top granite headstone on a concrete footing')
reg('headstone_flat', [bx(0, 0, 0, 0.7, 0.05, 0.4, 'concrete'), bx(0, 0.05, 0, 0.6, 0.06, 0.3, 'granite')], 0.7, 0.4, 0.11, 'a flat marker set flush in the grass, for military and old graves')
reg('headstone_cross', stone(0.5, 0.2, 0.3, 'stone') + [bx(0, 0.35, 0, 0.18, 1.0, 0.12, 'stone'), bx(0, 1.0, 0, 0.5, 0.16, 0.12, 'stone')], 0.7, 0.4, 1.4, 'a stone cross on a plinth')
reg('headstone_obelisk', [bx(0, 0, 0, 1.2, 0.25, 1.2, 'concrete'), bx(0, 0.25, 0, 0.9, 0.35, 0.9, 'granite'), bx(0, 0.6, 0, 0.6, 0.35, 0.6, 'granite'), bx(0, 0.95, 0, 0.4, 2.0, 0.4, 'stoneL')] + pyramid(0.4, 0.4, 2.95, 0.45, 'stoneL'), 1.3, 1.3, 3.4, 'a family obelisk 3.4 m tall on a stepped granite base')
def hs_row():
    o = [bx(0, 0, 0, 12.0, 0.04, 2.4, 'grassD')]
    for i in range(6):
        x = -5.0 + i*2.0
        o += shift(stone(0.6, 0.7, 0.12), x, 0.04, -0.6 if i % 2 else 0.4)
    return o
reg('headstone_row', hs_row(), 12.0, 2.4, 0.9, 'a row of six headstones on a grass strip 12 by 2.4 m: fast cemetery fill (use 3 or 4 rows)')
def mausoleum():
    o = [bx(0, 0, 0, 5.0, 0.4, 4.4, 'concrete'), bx(0, 0.4, 0, 4.4, 3.2, 3.8, 'stoneL'), bx(0, 3.6, 0, 4.8, 0.3, 4.2, 'stone')]
    o += [solid([(-2.4, 3.9, 2.1), (2.4, 3.9, 2.1), (0, 5.0, 2.1), (-2.4, 3.9, -2.1), (2.4, 3.9, -2.1), (0, 5.0, -2.1)], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], 'stone')]
    o += [bx(sx*1.7, 0.4, 2.05, 0.35, 3.2, 0.3, 'stone') for sx in (-1, 1)] + [bx(0, 0.4, 1.93, 1.6, 2.4, 0.08, 'doorD')]
    return o
reg('mausoleum', mausoleum(), 5.0, 4.4, 5.0, 'a stone mausoleum 5 by 4 m with two pilasters, a pediment and a bronze door on the front (+z); a good shelter to loot in')
def cgate():
    o = [bx(sx*3.0, 0, 0, 0.7, 3.6, 0.7, 'stoneL') for sx in (-1, 1)] + [bx(sx*3.0, 3.6, 0, 0.9, 0.3, 0.9, 'stone') for sx in (-1, 1)]
    o += [bx(0, 3.0, 0, 6.0, 0.25, 0.25, 'iron'), bx(0, 3.25, 0, 3.0, 0.3, 0.25, 'iron')]
    for sx in (-1, 1):
        o += [bx(sx*1.5, 0.3, 0, 2.3, 0.1, 0.1, 'iron'), bx(sx*1.5, 2.6, 0, 2.3, 0.1, 0.1, 'iron')]
        o += [bx(sx*(0.2 + 0.28*i), 0.3, 0, 0.05, 2.4, 0.05, 'iron') for i in range(8)]
    return o
reg('cemetery_gate', cgate(), 6.9, 0.9, 3.9, 'a cemetery entrance 6 m wide: two stone piers and an iron arch rail with two bar gates, open on the road side')
reg('flag_marker', [bx(0, 0, 0, 0.1, 0.9, 0.1, 'steelL'), bx(0.25, 0.55, 0, 0.5, 0.3, 0.02, 'red'), bx(0.25, 0.7, 0, 0.5, 0.1, 0.021, 'white')], 0.6, 0.1, 0.9, 'a small flag on a stick (a grave marker or an survey flag)')

pack_use = {'amenity=place_of_worship': ['church_country', 'church_large', 'steeple_white'], 'amenity=courthouse': ['courthouse'], 'amenity=townhall': ['town_hall_small'], 'amenity=school': ['school_front', 'school_sign'], 'amenity=university': ['university_hall'], 'amenity=hospital': ['hospital_wing', 'er_canopy', 'helipad'], 'landuse=cemetery': ['headstone_row', 'headstone_arch', 'mausoleum', 'cemetery_gate'], 'leisure=stadium': ['stadium_light', 'grandstand_small']}
finish('civic', P, __doc__, __file__, 'boxes, hulls and lofts; flat colours', pack_use,
       'Place a church, courthouse, school, university or hospital on the map building of that tag: pick by footprint, and add the small pieces beside it (flagpole_civic, school_sign, er_canopy). A cemetery is a grass area filled with headstone_row (3 to 5 rows 3 m apart) plus a few headstone_obelisk and one mausoleum near the gate. Mausoleums and church cellars are shelters and loot spots.')
