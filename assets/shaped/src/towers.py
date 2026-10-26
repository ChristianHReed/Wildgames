#!/usr/bin/env python3
"""Afterstreet towers and tall structures pack, version 1 (26 October 2026): cell towers, billboards, masts, stacks, tanks, bins, turbines. Writes assets/shaped/towers.js. Run: python3 assets/shaped/src/towers.py

models.towers.<name>, metres, Y up, front +Z, origin at the centre of the base on the ground.
Cell and radio: cell_tower_lattice (45 m), cell_tower_monopole (30 m), cell_tower_pine (a 25 m disguised tower), cell_shelter, rooftop_antennas, guyed_mast (60 m).
Billboards: billboard_pole (14 x 4 m on one steel pole, two faces), billboard_vee, billboard_roof, billboard_digital (lit), billboard_small (two-post, 6 x 3 m).
Industry: smokestack_brick (48 m), smokestack_steel (35 m), flare_stack, cooling_tower, tank_oil (vertical), tank_farm, grain_bins, water_standpipe, water_tank_ground, wind_turbine (60 m hub).
Colour names are in the palette. Text goes on billboard faces as decals at z 0.3 (see info)."""
import math
from bld import *
P = {'steel': '#8a9096', 'steelD': '#5a6066', 'steelL': '#b4bac0', 'galv': '#a6acb0', 'red': '#b32d24', 'white': '#ece8dc', 'concrete': '#a8a69e', 'concreteD': '#807e76', 'brick': '#8a4a38', 'brickD': '#6a3828', 'black': '#1c1d20',
     'panel': '#d4d8da', 'antenna': '#c8ccce', 'dish': '#e4e6e6', 'lampR': '#ff3a2a', 'lamp': '#fff2b0', 'green': '#3e6a34', 'greenD': '#2e5028', 'bark': '#6a4c34', 'tin': '#9aa0a4', 'tinD': '#7c8286', 'tank': '#c9c6bc', 'tankR': '#a85a3a', 'yellow': '#e0b420',
     'board': '#d8d4c4', 'boardD': '#2a2c34', 'screen': '#3a6ab0', 'screenW': '#e8f0ff', 'wood': '#7a6244', 'grass': '#6a8a48', 'shelter': '#c8c2ae', 'door': '#5a5a5e', 'rust': '#8a4a2a', 'flame': '#ffa030', 'blade': '#e8eaea'}
def lattice(h, w0, w1, secs, c='galv', t=0.12):
    o = []
    ys = [h*i/secs for i in range(secs + 1)]
    ws = [w0 + (w1 - w0)*y/h for y in ys]
    def pt(i, k): s = ws[i]/2; return [(-s, ys[i], -s), (s, ys[i], -s), (s, ys[i], s), (-s, ys[i], s)][k]
    for k in range(4):
        o.append(tube(list(pt(0, k)), list(pt(secs, k)), t*1.6, c))
    for i in range(1, secs + 1):
        for k in range(4): o.append(tube(list(pt(i, k)), list(pt(i, (k + 1) % 4)), t, c))
    for i in range(secs):
        for k in range(4):
            o.append(tube(list(pt(i, k)), list(pt(i + 1, (k + 1) % 4)), t*0.8, c))
    return o
def sector(x, y, z, face=0.0):
    return [bx(x, y, z, 0.35, 2.0, 0.12, 'antenna'), bx(x, y - 0.3, z - 0.1, 0.12, 0.12, 0.2, 'steelD')]
def cell_lattice():
    o = [bx(0, 0, 0, 7.0, 0.3, 7.0, 'concrete')] + lattice(45.0, 6.0, 1.2, 9)
    o += [bx(0, 45.0, 0, 1.4, 0.2, 1.4, 'steelD'), tube([0, 45.0, 0], [0, 49.0, 0], 0.15, 'steelL'), bx(0, 49.0, 0, 0.35, 0.35, 0.35, 'lampR', glow=True), bx(0, 22.0, 0, 0.5, 0.5, 0.5, 'lampR', glow=True)]
    for y in (39.0, 36.0):
        for ang in (0, 120, 240):
            a = math.radians(ang); x, z = 1.4*math.sin(a), 1.4*math.cos(a)
            o += [bx(x, y, z, 0.4, 2.2, 0.14, 'antenna'), tube([0, y + 1.0, 0], [x, y + 1.0, z], 0.08, 'steelD')]
    o += [loft([[2.0, 33.0, 1.6, 0.6, 0.6], [2.0, 33.0, 2.0, 0.6, 0.6]], 'dish', n=12, ax='z')]
    return o
reg('cell_tower_lattice', cell_lattice(), 7.0, 7.0, 49.4, 'a 45 m three-sector cell tower: tapered galvanised lattice, two rings of panel antennas near the top, a microwave dish, red beacons at the top and the middle; stands in a fenced compound with cell_shelter')
def monopole(tree=False):
    o = [bx(0, 0, 0, 2.4, 0.3, 2.4, 'concrete'), loft([[0, 0.3, 0, 0.55, 0.55], [0, 12.0, 0, 0.38, 0.38], [0, 30.0, 0, 0.22, 0.22]], 'bark' if tree else 'steelL', n=10)]
    for ang in (0, 120, 240):
        a = math.radians(ang); x, z = 0.9*math.sin(a), 0.9*math.cos(a)
        if tree: o += [bx(x*0.8, 23.0, z*0.8, 0.4, 2.1, 0.14, 'antenna')]
        else: o += [bx(x, 27.5, z, 0.4, 2.1, 0.14, 'antenna'), tube([0, 28.5, 0], [x, 28.5, z], 0.08, 'steelD')]
    if tree:
        for k in range(14):
            a = math.radians(k*137.5); r = 1.6 + 0.12*k; y = 16.0 + k*0.95
            o.append(tube([0, y, 0], [r*math.sin(a), y - 0.6, r*math.cos(a)], 0.3, 'green' if k % 2 else 'greenD'))
        o.append(tip([0, 30.0, 0], [0, 33.0, 0], 1.2, 1.2, 'green'))
    else:
        o += [bx(0, 30.0, 0, 0.3, 0.3, 0.3, 'lampR', glow=True)]
    return o
reg('cell_tower_monopole', monopole(), 2.4, 2.4, 30.4, 'a 30 m cell monopole with three antenna panels and a beacon: the common one in towns, on lots and behind shops')
reg('cell_tower_pine', monopole(True), 7.0, 7.0, 33.0, 'a cell tower disguised as a pine: bare lower trunk, a green crown from 16 m, antennas hidden inside; the tell is that it is the only tree with a fence round it')
reg('cell_shelter', [bx(0, 0, 0, 3.4, 0.2, 2.6, 'concrete'), bx(0, 0.2, 0, 3.0, 2.4, 2.2, 'shelter'), bx(0, 2.6, 0, 3.2, 0.12, 2.4, 'steelD'), bx(0.8, 0.2, 1.11, 0.9, 2.0, 0.05, 'door'), bx(-0.9, 1.4, 1.11, 0.6, 0.5, 0.05, 'steelD'), bx(1.8, 0.2, 0.0, 0.3, 1.4, 1.4, 'steel'), bx(0, 2.7, 0.0, 0.5, 0.5, 0.5, 'steelD')], 3.8, 2.6, 3.2, 'the equipment hut at the foot of a tower: a pale hut with a steel door, a vent, a generator cabinet and a roof box; backup batteries inside; a reason to visit when the grid fails')
def rooftop():
    o = [bx(0, 0, 0, 3.0, 0.2, 2.0, 'concreteD')]
    for x in (-1.2, 0, 1.2): o += [bx(x, 0.2, 0, 0.08, 2.4, 0.08, 'steelD'), bx(x, 1.4, 0.1, 0.3, 1.5, 0.1, 'antenna')]
    o += [loft([[1.4, 1.2, 0.5, 0.45, 0.45], [1.4, 1.2, 0.65, 0.45, 0.45]], 'dish', n=10, ax='z'), bx(-1.4, 0.2, -0.5, 0.9, 0.6, 0.5, 'steel')]
    return o
reg('rooftop_antennas', rooftop(), 3.0, 2.0, 2.7, 'a rooftop cell cluster 3 m: three panels on poles, a dish and an equipment cabinet, on a base slab to set on any flat roof')
def guyed():
    o = [bx(0, 0, 0, 1.0, 0.4, 1.0, 'concreteD')] + lattice(60.0, 1.0, 1.0, 20, 'steelD', 0.06)
    for ang in (0, 120, 240):
        a = math.radians(ang)
        for h in (20.0, 40.0, 58.0): o.append(tube([0, h, 0], [h*0.55*math.sin(a), 0.2, h*0.55*math.cos(a)], 0.04, 'steelL'))
        o.append(bx(40.0*0.55*math.sin(a), 0, 40.0*0.55*math.cos(a), 0.7, 0.3, 0.7, 'concrete'))
    for y in (20.0, 40.0, 60.0): o.append(bx(0, y, 0, 0.3, 0.3, 0.3, 'lampR', glow=True))
    return o + [tube([0, 60.0, 0], [0, 64.0, 0], 0.08, 'steelL')]
reg('guyed_mast', guyed(), 66.0, 66.0, 64.0, 'a 60 m radio mast: a slim lattice stayed by three cables at three heights to concrete anchors, beacons at 20, 40 and 60 m; for a broadcast station (the number of anchors makes its footprint 66 m)')
# ---- billboards
def face(w, h, y, z, c='board'): return [bx(0, y, z, w, h, 0.12, 'boardD'), bx(0, y + 0.1, z + 0.07, w - 0.2, h - 0.2, 0.03, c)]
def bb_pole():
    o = [bx(0, 0, 0, 2.0, 0.4, 2.0, 'concrete'), loft([[0, 0.4, 0, 0.45, 0.45], [0, 10.0, 0, 0.38, 0.38]], 'steel', n=8)]
    o += [bx(0, 9.0, 0, 0.3, 0.3, 0.9, 'steelD'), bx(0, 9.2, 0.0, 14.4, 0.2, 0.2, 'steelD')]
    o += face(14.0, 4.0, 9.8, 0.5)
    o += [bx(0, 9.8, -0.5, 14.0, 4.0, 0.12, 'boardD'), bx(0, 13.9, 0.3, 14.2, 0.1, 0.6, 'steelD')]
    o += [bx(x, 13.5, 0.7, 0.3, 0.3, 0.2, 'lamp', glow=True) for x in (-5, -2.5, 0, 2.5, 5)]
    return o
reg('billboard_pole', bb_pole(), 14.4, 1.4, 14.4, 'a highway billboard 14 by 4 m on a single steel pole, front face +z with five lamps on top; the blank face takes a text or image decal (at z 0.58)')
def panel(cx, cz, yaw, w, y0, h, t, c):
    ca, sa = math.cos(yaw), math.sin(yaw)
    def P_(lx, y, lz): return (cx + lx*ca + lz*sa, y, cz - lx*sa + lz*ca)
    pts = [P_(-w/2, y0, t/2), P_(w/2, y0, t/2), P_(w/2, y0 + h, t/2), P_(-w/2, y0 + h, t/2), P_(-w/2, y0, -t/2), P_(w/2, y0, -t/2), P_(w/2, y0 + h, -t/2), P_(-w/2, y0 + h, -t/2)]
    return solid(pts, [[0, 1, 2, 3], [5, 4, 7, 6], [3, 2, 6, 7], [4, 5, 1, 0], [1, 5, 6, 2], [4, 0, 3, 7]], c)
def bb_vee():
    o = [bx(0, 0, 0, 2.4, 0.4, 2.4, 'concrete'), loft([[0, 0.4, 0, 0.5, 0.5], [0, 9.0, 0, 0.42, 0.42]], 'steel', n=8)]
    for s in (-1, 1):
        o += [panel(s*4.2, 1.5, s*0.6, 7.2, 8.6, 3.6, 0.15, 'boardD'), panel(s*4.2, 1.5, s*0.6, 7.0, 8.7, 3.4, 0.2, 'board')]
        o += [tube([0, 8.5, 0], [s*4.5, 8.7, 1.5], 0.2, 'steelD')]
    return o
reg('billboard_vee', bb_vee(), 12.0, 4.0, 12.4, 'a V billboard: two 7 m faces angled toward the road on one pole; the road-side pair read from far off')
def bb_roof():
    o = [bx(0, 0, 0, 13.0, 0.3, 1.6, 'concreteD')]
    o += [bx(x, 0.3, -0.3, 0.2, 5.0, 0.2, 'steelD') for x in (-5.5, -2.7, 0, 2.7, 5.5)] + [bx(x, 0.3, 0.7, 0.2, 3.0, 0.2, 'steelD') for x in (-5.5, 5.5)]
    o += [tube([x, 0.3, 0.7], [x, 4.3, -0.3], 0.14, 'steelD') for x in (-5.5, 5.5)] + [bx(0, 1.5, 0.75, 12.0, 0.1, 0.8, 'steelL')]
    o += face(12.0, 3.6, 2.6, 0.1)
    o += [bx(x, 6.1, 0.4, 0.3, 0.3, 0.2, 'lamp', glow=True) for x in (-4, 0, 4)]
    return o
reg('billboard_roof', bb_roof(), 13.0, 1.6, 6.4, 'a rooftop billboard 12 by 3.6 m on a steel frame with a catwalk and three lamps: place it on a flat roof edge')
def bb_digital():
    o = [bx(0, 0, 0, 2.4, 0.4, 2.4, 'concrete'), loft([[0, 0.4, 0, 0.6, 0.6], [0, 12.0, 0, 0.5, 0.5]], 'steel', n=8)]
    return o + [bx(0, 12.0, 0.5, 14.8, 4.4, 0.4, 'boardD'), bx(0, 12.2, 0.72, 14.0, 4.0, 0.05, 'screen', glow=True), bx(0, 13.2, 0.76, 6.0, 1.2, 0.02, 'screenW', glow=True)]
reg('billboard_digital', bb_digital(), 14.8, 2.4, 16.4, 'a lit digital billboard 14 by 4 m on a taller pole; the screen glows blue-white all night, which draws attention and has power: dead after the grid fails (swap to a dark colour)')
reg('billboard_small', [bx(sx*2.4, 0, 0, 0.25, 4.0, 0.25, 'wood') for sx in (-1, 1)] + face(6.0, 3.0, 1.6, 0.2) + [bx(0, 4.6, 0.3, 6.2, 0.1, 0.5, 'steelD')] + [bx(x, 4.6, 0.6, 0.25, 0.25, 0.2, 'lamp', glow=True) for x in (-2, 2)], 6.4, 0.8, 4.8, 'a small roadside sign board 6 by 3 m on two wood posts with two lamps: farms, churches, shops')
# ---- industry
def stack_brick():
    o = [bx(0, 0, 0, 7.0, 1.2, 7.0, 'concreteD'), loft([[0, 1.2, 0, 2.6, 2.6], [0, 30.0, 0, 1.7, 1.7], [0, 46.0, 0, 1.3, 1.3]], 'brick', n=12), loft([[0, 46.0, 0, 1.5, 1.5], [0, 48.0, 0, 1.45, 1.45]], 'concreteD', n=12)]
    o += [bx(0, 1.2, 1.7, 0.1, 44.0, 0.08, 'steelD'), bx(0, 48.0, 0.0, 0.3, 0.3, 0.3, 'lampR', glow=True), bx(0, 1.2, 2.5, 1.6, 2.2, 0.4, 'brickD')]
    return o
reg('smokestack_brick', stack_brick(), 7.0, 7.0, 48.3, 'a brick factory stack 48 m: a tapered round shaft on a square plinth, concrete cap, a ladder strip and a top beacon, and a flue door at the base; for mills and the old power plant')
def stack_steel():
    o = [bx(0, 0, 0, 4.0, 0.5, 4.0, 'concrete'), loft([[0, 0.5, 0, 1.5, 1.5], [0, 35.0, 0, 1.0, 1.0]], 'steel', n=12)]
    for a, b in ((20.0, 24.0), (28.0, 32.0)): o.append(loft([[0, a, 0, 1.2 - a*0.0143 + 0.05, 1.2 - a*0.0143 + 0.05], [0, b, 0, 1.2 - b*0.0143 + 0.05, 1.2 - b*0.0143 + 0.05]], 'red', n=12))
    return o + [bx(0, 35.0, 0, 0.3, 0.3, 0.3, 'lampR', glow=True), bx(0, 0.5, 1.45, 0.1, 34.0, 0.08, 'steelD')]
reg('smokestack_steel', stack_steel(), 4.0, 4.0, 35.3, 'a 35 m steel flue with two red bands near the top and a beacon: for a plant, a hospital boiler or a foundry')
reg('flare_stack', [bx(0, 0, 0, 3.0, 0.4, 3.0, 'concrete'), loft([[0, 0.4, 0, 0.3, 0.3], [0, 22.0, 0, 0.22, 0.22]], 'steelD', n=8), tube([0, 8.0, 0], [3.0, 0.4, 0], 0.08, 'steel'), tube([0, 8.0, 0], [-3.0, 0.4, 0], 0.08, 'steel'), loft([[0, 22.0, 0, 0.3, 0.3], [0, 23.2, 0, 0.45, 0.45], [0, 24.2, 0, 0.1, 0.1]], 'flame', n=6, glow=True)], 6.0, 3.0, 24.4, 'a refinery flare stack 22 m with guy rods and a burning tip; lit at night: a landmark and a sign of working gas')
def cooling():
    o = [loft([[0, 0.0, 0, 14.0, 14.0], [0, 12.0, 0, 11.0, 11.0], [0, 30.0, 0, 8.6, 8.6], [0, 45.0, 0, 9.0, 9.0], [0, 55.0, 0, 9.8, 9.8]], 'concrete', n=20)]
    o += [loft([[0, 55.0, 0, 7.0, 7.0], [0, 60.0, 0, 6.0, 6.0], [0, 67.0, 0, 2.5, 2.5]], 'white', n=10)] + [bx(0, 0, 14.0, 5.0, 3.5, 0.3, 'concreteD')]
    return o
reg('cooling_tower', cooling(), 28.0, 28.0, 67.0, 'a hyperbolic cooling tower 55 m high and 28 m wide at the base, with a steam plume from the top; a power plant sight, visible for miles; plume should be a smoke particle effect when running')
def tank():
    o = [bx(0, 0, 0, 17.0, 0.4, 17.0, 'concrete'), loft([[0, 0.4, 0, 8.0, 8.0], [0, 12.0, 0, 8.0, 8.0]], 'tank', n=18), tip([0, 12.0, 0], [0, 14.0, 0], 8.1, 8.1, 'tankR', n=18)]
    o += [loft([[0, 6.0, 0, 8.1, 8.1], [0, 6.25, 0, 8.1, 8.1]], 'steelD', n=18), bx(0, 0.4, 8.2, 0.9, 12.0, 0.1, 'steelD'), bx(0.0, 14.0, 0.0, 0.1, 1.0, 0.1, 'steelD')]
    return o
reg('tank_oil', tank(), 17.0, 17.0, 15.0, 'a vertical storage tank 16 m wide, 12 m tall with a cone roof, a ring girder and a ladder: oil, fuel or molasses')
def farm():
    o = [bx(0, 0, 0, 40.0, 0.5, 20.0, 'concrete'), bx(0, 0.5, -10.0, 40.0, 1.2, 0.5, 'concreteD'), bx(0, 0.5, 10.0, 40.0, 1.2, 0.5, 'concreteD'), bx(-20.0, 0.5, 0, 0.5, 1.2, 20.0, 'concreteD'), bx(20.0, 0.5, 0, 0.5, 1.2, 20.0, 'concreteD')]
    for x in (-12.0, 0.0, 12.0): o += [loft([[x, 0.5, 0, 5.0, 5.0], [x, 9.5, 0, 5.0, 5.0]], 'tank', n=14), tip([x, 9.5, 0], [x, 10.7, 0], 5.1, 5.1, 'tankR', n=14)]
    o += [tube([-12.0, 1.0, 0.0], [12.0, 1.0, 0.0], 0.3, 'steelD'), bx(16.0, 0.5, 0, 2.0, 1.4, 1.6, 'steel')]
    return o
reg('tank_farm', farm(), 40.5, 20.5, 11.2, 'a tank farm 40 by 20 m: three 10 m tanks inside a low concrete dike with a pump manifold and a pump house; fuel or chemicals; use at a depot or along the rail line')
def bins():
    o = [bx(0, 0, 0, 22.0, 0.3, 11.0, 'concrete')]
    for x in (-6.5, 0.0, 6.5):
        o += [loft([[x, 0.3, 0, 3.0, 3.0], [x, 8.0, 0, 3.0, 3.0]], 'tin', n=12), tip([x, 8.0, 0], [x, 10.0, 0], 3.1, 3.1, 'tinD', n=12)]
        o += [loft([[x, 0.3 + i*1.0, 0, 3.06, 3.06], [x, 0.38 + i*1.0, 0, 3.06, 3.06]], 'tinD', n=12) for i in range(1, 8)]
    o += [bx(10.0, 0.3, 0, 2.0, 12.0, 2.0, 'tinD'), bx(10.0, 12.3, 0, 2.4, 0.4, 2.4, 'steelD'), tube([10.0, 12.0, 0], [0, 10.0, 0], 0.2, 'steelD'), bx(-6.5, 0.3, 3.1, 0.1, 8.0, 0.1, 'steelD')]
    return o
reg('grain_bins', bins(), 22.0, 11.0, 12.7, 'a farm grain site 22 m wide: three corrugated steel bins 6 m wide and 8 m tall, a legs tower and a conveyor; full bins are a food store')
reg('water_standpipe', [bx(0, 0, 0, 10.0, 0.4, 10.0, 'concrete'), loft([[0, 0.4, 0, 4.0, 4.0], [0, 25.0, 0, 4.0, 4.0]], 'tank', n=16), tip([0, 25.0, 0], [0, 28.0, 0], 4.1, 4.1, 'steelD', n=16), loft([[0, 17.0, 0, 4.1, 4.1], [0, 19.0, 0, 4.1, 4.1]], 'red', n=16), bx(0, 0.4, 4.1, 0.9, 25.0, 0.1, 'steelD'), bx(0, 28.0, 0, 0.3, 0.3, 0.3, 'lampR', glow=True)], 10.0, 10.0, 28.3, 'a ground-standing water tower: a 25 m round standpipe with a red band, a dome and a ladder; the old kind that gravity-feeds a town')
reg('water_tank_ground', [bx(0, 0, 0, 18.0, 0.3, 18.0, 'concrete'), loft([[0, 0.3, 0, 8.0, 8.0], [0, 8.0, 0, 8.0, 8.0]], 'concrete', n=18), tip([0, 8.0, 0], [0, 10.0, 0], 8.1, 8.1, 'concreteD', n=18), bx(0, 0.3, 8.1, 1.4, 2.4, 0.2, 'steelD'), bx(0, 10.0, 0, 0.8, 0.8, 0.8, 'steelD')], 18.0, 18.0, 10.8, 'a ground reservoir 16 m wide with a dome roof, a hatch and a service door; a clean-water store')
def turbine():
    o = [loft([[0, 0.0, 0, 2.2, 2.2], [0, 60.0, 0, 1.4, 1.4]], 'white', n=14), bx(0, 60.0, -0.5, 3.0, 3.0, 8.0, 'blade'), loft([[0, 61.5, 4.0, 1.4, 1.4], [0, 61.5, 5.2, 1.4, 1.4]], 'steelL', n=10, ax='z')]
    for ang in (90, 210, 330):
        a = math.radians(ang); o.append(seg([0, 61.5, 5.0], [32.0*math.cos(a), 61.5 + 32.0*math.sin(a), 5.0], 0.8, 0.25, 0.15, 0.08, 'blade'))
    return o
reg('wind_turbine', turbine(), 66.0, 10.0, 94.0, 'a 60 m wind turbine with three 32 m blades facing +z; the blades are fixed (rotate the rotor group about z for a spinning one)')
pack_use = {'man_made=tower or communication tower': ['cell_tower_lattice', 'cell_tower_monopole'], 'man_made=mast': ['guyed_mast', 'cell_tower_pine'], 'man_made=chimney': ['smokestack_brick', 'smokestack_steel'], 'man_made=storage_tank': ['tank_oil', 'tank_farm'], 'man_made=silo': ['grain_bins'], 'man_made=water_tower': ['water_standpipe'], 'power=generator wind': ['wind_turbine'], 'advertising=billboard': ['billboard_pole', 'billboard_vee', 'billboard_roof', 'billboard_digital', 'billboard_small'], 'amenity=shelter near towers': ['cell_shelter']}
finish('towers', P, __doc__, __file__, 'boxes, lofts and lattice tubes; flat colours', pack_use,
       'Towers: a cell tower stands in a fenced compound (fence_security_4 from the barriers pack) with cell_shelter beside it; put one monopole every 600 to 900 m in towns and a lattice tower on each hill. Billboards: along motorways and arterials every 400 m or so, facing traffic; roof ones on flat roofs in the centre. Stacks, cooling towers and tank farms belong to the power plant and the industrial strip by the rail yard. Beacons (lampR) are lit pieces: switch them off after the grid fails.')
