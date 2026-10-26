#!/usr/bin/env python3
"""Afterstreet rail pack, version 1 (26 October 2026): the railway the map already has (1,625 rail ways through Springfield, the BNSF line and its yards) and the trains that run on it. Writes assets/shaped/rail.js. Run: python3 assets/shaped/src/rail.py

models.rail.<name>, metres. Track pieces are 4 m long along z, centred, gauge 1.435 m, rail head top at y 0.62. Rolling stock sits with its wheels on y 0.62 (put it straight on a track piece), long axis along z, +z the front of the engine.
Track: track_4, track_worn_4, track_crossing_4 (road planks), track_switch_l/r, track_bumper, track_curve_unit (a 10 degree kink for building curves), platform_4. Signals: signal_mast, crossing_gate_up, crossing_gate_down, switch_stand, mile_post.
Buildings: depot_small, freight_house, signal_tower, section_house, loading_dock_4. Rolling stock: locomotive_orange, locomotive_blue, boxcar_brown, boxcar_green, boxcar_open, tank_car, hopper_car, flatcar, flatcar_logs, flatcar_container, gondola_scrap, caboose_red, handcar.
Colour names are in the palette."""
import math
from bld import *
P = {'ballast': '#8a867c', 'ballastD': '#6a665e', 'tie': '#5a4636', 'tieD': '#44342a', 'rail': '#7a7a7e', 'railR': '#8a5a3a', 'weed': '#6a7a38', 'weedD': '#8a8a48', 'plank': '#7a6a52', 'plate': '#4a4a4c',
     'white': '#e8e4da', 'yellow': '#e0b420', 'black': '#1c1d20', 'steel': '#6a7078', 'steelD': '#4a4e54', 'steelL': '#9aa0a6', 'concrete': '#a8a69e', 'concreteD': '#807e76', 'wood': '#9a7a52', 'woodD': '#6e5238', 'woodL': '#b8a07a',
     'brick': '#8a4a38', 'brickD': '#6a3828', 'clap': '#c9c1a6', 'clapD': '#a89f84', 'slate': '#4a5a6a', 'shingle': '#5a5048', 'red': '#a8342a', 'redD': '#7a241c', 'green': '#2f5a3a', 'greenD': '#22432b', 'brown': '#6a3a2a', 'brownD': '#4e2a1e', 'orange': '#d8681c', 'orangeD': '#a84e14',
     'blue': '#2a4a7a', 'blueD': '#1e3658', 'glass': '#2a3a46', 'tank': '#3a3c40', 'tankW': '#d8d4c8', 'rust': '#8a4a2a', 'door': '#7a2a24', 'chrome': '#c8ccd0', 'log': '#6a4a30', 'logE': '#b08a58', 'cont1': '#2a5a8a', 'cont2': '#a8442a', 'cont3': '#c8a030', 'scrap': '#7a5a46', 'scrapD': '#5a4638', 'glow': '#fff2b0', 'lampR': '#e03a2a'}
RT = 0.62    # rail head top
GA = 0.7175  # half gauge
def ties(n, length=4.0, w=2.6, wear=False):
    return [bx(0, 0.28, -length/2 + (i + 0.5)*length/n, w, 0.17, 0.22, 'tieD' if wear and i % 3 == 0 else 'tie') for i in range(n)]
def rail_pair(length=4.0, col='rail'):
    o = []
    for sx in (-1, 1): o += [bx(sx*GA, 0.45, 0, 0.1, 0.1, length, col), bx(sx*GA, 0.55, 0, 0.07, 0.07, length, col)]
    return o
def bed(length=4.0, w=3.4):
    return [hull([(-w/2 - 0.3, 0, -length/2), (w/2 + 0.3, 0, -length/2), (w/2 + 0.3, 0, length/2), (-w/2 - 0.3, 0, length/2), (-w/2, 0.32, -length/2), (w/2, 0.32, -length/2), (w/2, 0.32, length/2), (-w/2, 0.32, length/2)], 'ballast')]
def track(wear=False):
    o = bed() + ties(8, wear=wear) + rail_pair(col='railR' if wear else 'rail')
    if wear:
        o += [bx(x, 0.32, z, 0.18, 0.2, 0.05, 'weed') for x, z in ((-1.1, -1.4), (0.3, 0.8), (1.2, -0.3), (-0.4, 1.7), (0.9, 1.5))]
        o += [bx(x, 0.32, z, 0.1, 0.35, 0.05, 'weedD') for x, z in ((-0.7, 0.2), (1.4, 1.0))]
    return o
reg('track_4', track(), 4.0, 4.0, 0.7, 'a 4 m piece of standard-gauge track on ballast: ties every 0.5 m, rails at x -0.7175 and +0.7175; the rail top is y 0.62; lay it end to end along z')
reg('track_worn_4', track(True), 4.0, 4.0, 0.9, 'abandoned track: rusty rails, dark rotten ties, weeds in the ballast; for sidings and the dead end of a line')
reg('track_crossing_4', bed() + ties(8) + rail_pair() + [bx(0, 0.3, 0, 2.2, 0.32, 3.9, 'concrete')] + [bx(sx*1.55, 0.3, 0, 1.0, 0.32, 3.9, 'concreteD') for sx in (-1, 1)], 4.0, 4.0, 0.7,
    'a level crossing 4 m long: concrete slabs level with the rail tops; the road runs along x across it; pair with props.street.railroad_crossing_on/off and the crossing gates')
def switch(sign):
    L = 8.0
    o = bed(L, 3.6) + ties(16, L) + rail_pair(L)
    path = [(0.0, -1.0), (0.25, 0.6), (1.5, 2.4), (3.7, 4.0)]    # the branch bends away from the main line
    for sx in (-1, 1):
        for (xa, za), (xb, zb) in zip(path, path[1:]): o.append(tube([sign*xa + sx*GA, 0.5, za], [sign*xb + sx*GA, 0.5, zb], 0.1, 'rail'))
    o += [bx(sign*(1.1 + i*0.9), 0.28, 0.6 + i*1.1, 2.6, 0.17, 0.22, 'tie') for i in range(4)]
    return o + [bx(sign*1.3, 0.0, -1.6, 0.3, 0.8, 0.3, 'steelD'), bx(sign*1.3, 0.8, -1.6, 0.5, 0.05, 0.05, 'red')]
reg('track_switch_l', switch(-1), 8.0, 8.0, 1.0, 'a turnout 8 m long: a straight main line and a branch that leaves to the left (-x) at z -1 and is 3.7 m away by z +4; the switch stand is at the toe on the branch side')
reg('track_switch_r', switch(1), 8.0, 8.0, 1.0, 'the same, the branch leaving to the right (+x)')
reg('track_bumper', bed() + ties(8) + rail_pair() + [bx(0, 0.6, 1.8, 2.4, 0.5, 0.35, 'woodD'), bx(-1.0, 0.0, 1.6, 0.3, 1.5, 0.3, 'woodD'), bx(1.0, 0.0, 1.6, 0.3, 1.5, 0.3, 'woodD'), bx(0, 0.9, 1.95, 1.8, 0.2, 0.08, 'red')], 4.0, 4.0, 1.5,
    'the end of a track: a timber buffer across the rails with a red board; the track ends at z +1.9')
reg('platform_4', [bx(0, 0, 0, 3.0, 1.0, 4.0, 'concrete'), bx(-1.45, 1.0, 0, 0.1, 0.02, 4.0, 'yellow'), bx(0, 1.0, 0, 2.8, 0.02, 4.0, 'concreteD')] + [bx(1.2, 1.0, z, 0.1, 0.5, 0.1, 'steelD') for z in (-1.5, 1.5)], 3.0, 4.0, 1.5,
    'a passenger platform 4 m long, 1 m high, with a yellow safety edge on its -x side (put the track centre 2.4 m to its -x)')
reg('loading_dock_4', [bx(0, 0, 0, 3.0, 1.2, 4.0, 'concrete'), bx(0, 1.2, 0, 3.0, 0.1, 4.0, 'woodD'), bx(-1.5, 0.3, 0, 0.2, 0.6, 3.6, 'tieD'), bx(0, 1.3, 1.9, 3.0, 0.1, 0.1, 'yellow')], 3.0, 4.0, 1.4,
    'a freight dock 4 m long, 1.2 m high with a plank deck and a rubber bumper on the track side (-x)')
# ---- signals and track furniture
reg('signal_mast', [bx(0, 0, 0, 0.8, 0.2, 0.8, 'concrete'), bx(0, 0.2, 0, 0.3, 4.6, 0.3, 'steelD'), bx(0, 4.8, 0, 0.5, 0.8, 0.3, 'black'), cylv(0, 5.5, 0.17, 0.12, 0.04, 'lampR', 10), cylv(0, 5.05, 0.17, 0.12, 0.04, 'yellow', 10), cylv(0, 4.6, 0.17, 0.12, 0.04, 'green', 10)], 0.8, 0.8, 5.8,
    'a railway signal mast 5.8 m with three lamps (red at y 5.5, yellow 5.05, green 4.6) on +z')
def gate(down):
    o = [bx(0, 0, 0, 0.9, 0.15, 0.9, 'concrete'), bx(0, 0.15, 0, 0.5, 1.25, 0.5, 'steelD'), bx(0, 1.4, 0, 0.6, 0.5, 0.4, 'black'), cylv(0, 1.55, 0.22, 0.1, 0.04, 'lampR', 8)]
    if down: o += [bx(0, 1.55, 3.4, 0.12, 0.12, 6.4, 'white')] + [bx(0, 1.55, 1.0 + i*1.2, 0.14, 0.14, 0.6, 'red') for i in range(5)] + [cylv(0, 1.4, 6.4, 0.08, 0.1, 'lampR', 8)]
    else: o += [bx(0, 1.55, 0.2, 0.12, 4.8, 0.12, 'white')] + [bx(0, 1.7 + i*1.0, 0.2, 0.14, 0.5, 0.14, 'red') for i in range(4)]
    return o
reg('crossing_gate_up', gate(False), 0.9, 0.9, 6.4, 'a crossing gate with its arm raised (stands 4.8 m up at z 0.2) and a lamp head: add beside props.street.railroad_crossing_on')
reg('crossing_gate_down', gate(True), 0.9, 6.9, 1.9, 'the same with the arm lowered across the road, 6.4 m long along +z with red stripes; swap models when a train comes')
reg('switch_stand', [bx(0, 0, 0, 0.7, 0.1, 0.7, 'concrete'), bx(0, 0.1, 0, 0.25, 0.8, 0.25, 'steelD'), bx(0, 0.9, 0, 0.5, 0.08, 0.08, 'steel'), bx(0, 1.0, 0, 0.05, 0.5, 0.35, 'red')], 0.7, 0.7, 1.5, 'a switch stand: a lever and a target on a short post, on the toe side of a switch')
reg('mile_post', [bx(0, 0, 0, 0.3, 1.2, 0.12, 'white'), bx(0, 0.5, 0.07, 0.2, 0.3, 0.03, 'black')], 0.3, 0.12, 1.2, 'a white mile post on the right of way')
# ---- railway buildings
def depot():
    w, d = 14.0, 5.0
    o = [bx(0, 0, 0, w + 0.2, 0.4, d + 0.2, 'concreteD'), bx(0, 0.4, 0, w, 3.0, d, 'clap'), *gable(w, d, 3.4, 1.5, 'shingle', 2.0, 1.4, along='x'), bx(0, 3.1, d/2 + 1.3, w + 3.0, 0.15, 0.18, 'woodD')]
    o += [bx(sx, 2.1, d/2 + 1.3, 0.18, 1.0, 0.18, 'woodD') for sx in (-6, -2, 2, 6)]
    o += door(-2.0, d/2, 'door', 1.2, 2.2, 0.4) + door(4.0, d/2, 'door', 1.2, 2.2, 0.4) + win(0.8, 1.6, 1.0, 1.2, d/2) + win(-4.5, 1.6, 1.2, 1.2, d/2)
    return o + [bx(0, 0.4, -d/2 - 0.5, 3.0, 2.4, 1.0, 'clap'), bx(0, 1.5, -d/2 - 1.02, 2.2, 1.2, 0.05, 'glass')] + gable(3.0, 1.0, 2.8, 1.0, 'shingle', 0.2, 0.2, along='z', cz=-d/2 - 0.5)
reg('depot_small', depot(), 18.0, 9.0, 5.6, 'a small town railway depot 14 by 5 m: board walls, wide bracketed eaves on the platform side (+z), a bay window for the agent on the track side (-z), two doors; the platform edge is along +z')
def freight_house():
    w, d = 24.0, 8.0
    o = [bx(0, 0, 0, w, 4.2, d, 'brick'), *gable(w, d, 4.2, 1.6, 'shingle', 0.5, 0.6, along='x'), bx(0, 0, d/2 + 1.2, w, 1.2, 2.4, 'concrete'), bx(0, 3.4, d/2 + 1.2, w + 0.4, 0.15, 3.0, 'woodD')]
    o += [bx(x, 1.2, d/2 + 0.04, 3.0, 2.8, 0.1, 'door') for x in (-7, -2.4, 2.4, 7)] + [bx(x, 1.2, d/2 + 2.4, 0.2, 2.2, 0.2, 'woodD') for x in (-11, -3.7, 3.7, 11)]
    return o
reg('freight_house', freight_house(), 25.0, 13.0, 6.6, 'a brick freight house 24 by 8 m with four sliding doors on a raised dock under a canopy (the +z side, along the track)')
def signal_tower():
    o = [bx(0, 0, 0, 4.0, 3.0, 4.0, 'brick'), bx(0, 3.0, 0, 4.6, 0.25, 4.6, 'woodD'), bx(0, 3.25, 0, 4.0, 2.2, 4.0, 'clap'), bx(0, 3.7, 2.02, 3.4, 1.2, 0.05, 'glass'), bx(0, 3.7, -2.02, 3.4, 1.2, 0.05, 'glass'), bx(2.02, 3.7, 0, 0.05, 1.2, 3.4, 'glass'), bx(-2.02, 3.7, 0, 0.05, 1.2, 3.4, 'glass')]
    return o + hip(4.0, 4.0, 5.45, 1.0, 'shingle', 0.5) + door(0, 2.02, 'door', 1.0, 2.0)
reg('signal_tower', signal_tower(), 5.2, 5.2, 6.5, 'a two-storey interlocking tower, 4 m square: a brick base with a door and an upper cabin of glass on all sides under a hip roof; the dispatcher\'s post at a junction')
reg('section_house', [bx(0, 0, 0, 6.0, 2.8, 5.0, 'clap'), *gable(6.0, 5.0, 2.8, 1.8, 'shingle', 0.4, 0.4, along='x')] + chimney(2.0, -1.0, 2.8, 1.8, 'brick', 0.6) + door(-1.0, 2.5, 'door', 0.9, 2.0) + win(1.4, 1.0, 1.2, 1.2, 2.5) + [bx(0, 0, 0, 6.4, 0.2, 5.4, 'concreteD')], 7.0, 6.0, 4.9,
    'a section house 6 by 5 m where the track gang lived: white boards, a hip-less gable roof and a brick chimney')
# ---- rolling stock: wheels rest on the rail top (y 0.62), the long axis is z
def wheel(x, z, r=0.42): return loft([[x - 0.06, RT + r, z, r, r], [x + 0.06, RT + r, z, r, r]], 'steelD', ax='x', n=8)
def bogie(z, span=1.0):
    o = []
    for dz in (-span, span):
        o += [wheel(-GA, z + dz), wheel(GA, z + dz), tube([-GA, RT + 0.42, z + dz], [GA, RT + 0.42, z + dz], 0.12, 'steel')]
    return o + [bx(sx*0.95, RT + 0.5, z, 0.2, 0.32, 2*span + 0.8, 'steelD') for sx in (-1, 1)] + [bx(0, RT + 0.82, z, 2.0, 0.2, 0.6, 'steelD')]
def ladder_v(x, z, y0, h): return [bx(x, y0, z, 0.05, h, 0.05, 'steel'), bx(x, y0, z + 0.3, 0.05, h, 0.05, 'steel')] + [bx(x, y0 + 0.3 + i*0.4, z + 0.15, 0.05, 0.05, 0.3, 'steel') for i in range(int(h/0.4))]
def couplers(L): return [bx(0, RT + 0.9, sz*(L/2 + 0.45), 0.25, 0.25, 0.7, 'steelD') for sz in (-1, 1)]
def boxcar(col, colD, open_door=False):
    L = 13.0
    o = bogie(-4.4) + bogie(4.4) + couplers(L) + [bx(0, RT + 0.85, 0, 0.5, 0.3, L, 'steelD'), bx(0, RT + 1.1, 0, 3.0, 0.1, L, 'steelD'), bx(0, RT + 1.2, 0, 3.0, 2.9, L, col)]
    o += [hull([(-1.6, RT + 4.1, -L/2 - 0.1), (1.6, RT + 4.1, -L/2 - 0.1), (1.6, RT + 4.1, L/2 + 0.1), (-1.6, RT + 4.1, L/2 + 0.1), (-1.0, RT + 4.4, -L/2), (1.0, RT + 4.4, -L/2), (1.0, RT + 4.4, L/2), (-1.0, RT + 4.4, L/2)], colD), bx(0, RT + 4.4, 0, 0.5, 0.05, L, 'steelD')]
    for sx in (-1, 1):
        o += [bx(sx*1.52, RT + 1.4, 0.3, 0.06, 2.7, 3.2, 'black' if open_door else colD), bx(sx*1.56, RT + 4.0, 0.0, 0.06, 0.06, 6.0, 'steel')]
        if open_door: o.append(bx(sx*1.57, RT + 1.4, -1.5, 0.08, 2.7, 3.0, colD))
        o += [bx(sx*1.52, RT + 1.2, z, 0.05, 2.9, 0.12, 'steelD') for z in (-L/2 + 0.5, L/2 - 0.5)]
    return o + ladder_v(1.55, L/2 - 0.2, RT + 1.2, 2.9) + ladder_v(-1.55, -L/2 - 0.1, RT + 1.2, 2.9)
reg('boxcar_brown', boxcar('brown', 'brownD'), 3.2, 14.0, 5.0, 'a 13 m freight boxcar, brown with a peaked roof, a sliding door on each side and a roof walk: wheels on y 0.62 so it sits on track_4; cars are 14.4 m long over the couplers')
reg('boxcar_green', boxcar('green', 'greenD'), 3.2, 14.0, 5.0, 'the same in green')
reg('boxcar_open', boxcar('red', 'redD', True), 3.2, 14.0, 5.0, 'a red boxcar with both side doors open on a dark interior (a place to search, a hobo shelter)')
def tank_car():
    yc = RT + 2.35
    o = bogie(-4.2) + bogie(4.2) + couplers(12.0) + [bx(0, RT + 0.85, 0, 0.5, 0.3, 12.0, 'steelD')]
    o += [loft([[0, yc, -5.9, 0.9, 0.9], [0, yc, -5.3, 1.45, 1.45], [0, yc, 5.3, 1.45, 1.45], [0, yc, 5.9, 0.9, 0.9]], 'tank', ax='z', n=14)]
    o += [loft([[0, yc, -0.45, 1.47, 1.47], [0, yc, 0.45, 1.47, 1.47]], 'tankW', ax='z', n=14)] + [loft([[0, yc, z - 0.08, 1.47, 1.47], [0, yc, z + 0.08, 1.47, 1.47]], 'steelD', ax='z', n=14) for z in (-3.5, 3.5)]
    o += [cylv(0, yc + 1.4, 0, 0.55, 0.35, 'steel', 10), cylv(0, yc + 1.75, 0, 0.62, 0.08, 'steelD', 10), bx(0, yc + 1.45, 0, 0.5, 0.05, 11.0, 'steelD')]
    return o + [bx(sx*1.0, RT + 1.0, z, 0.2, 0.9, 0.5, 'steelD') for sx in (-1, 1) for z in (-3.5, 3.5)] + ladder_v(1.5, 5.4, RT + 1.2, 2.3)
reg('tank_car', tank_car(), 3.0, 12.6, 5.1, 'a 12 m tank car: a black horizontal tank with a white band at the middle, a dome, a roof catwalk and an end ladder (a chemical or oil tank: a loot and hazard car)')
def hopper():
    L = 12.0
    o = bogie(-4.2) + bogie(4.2) + couplers(L) + [bx(0, RT + 0.85, 0, 0.5, 0.3, L, 'steelD')]
    for z0 in (-3.9, 0.0, 3.9):
        o.append(hull([(-0.5, RT + 1.1, z0 - 1.9), (0.5, RT + 1.1, z0 - 1.9), (0.5, RT + 1.1, z0 + 1.9), (-0.5, RT + 1.1, z0 + 1.9), (-1.5, RT + 3.2, z0 - 1.95), (1.5, RT + 3.2, z0 - 1.95), (1.5, RT + 3.2, z0 + 1.95), (-1.5, RT + 3.2, z0 + 1.95)], 'steelL'))
    o += [bx(0, RT + 3.2, 0, 3.0, 0.9, L - 0.3, 'steelL'), bx(0, RT + 4.1, 0, 2.6, 0.12, L - 0.5, 'steel')] + [bx(0, RT + 4.2, z, 0.9, 0.12, 0.9, 'steelD') for z in (-3.9, 0.0, 3.9)]
    return o + [bx(sx*1.52, RT + 3.2, 0, 0.05, 0.9, L - 0.6, 'blue') for sx in (-1, 1)] + ladder_v(1.55, L/2 - 0.2, RT + 1.5, 2.7)
reg('hopper_car', hopper(), 3.2, 12.8, 5.0, 'a covered hopper car 12 m long: a grey body over three sloped bottom hoppers with roof hatches and a blue band (grain, cement or sand)')
def flat(load):
    L = 14.0
    o = bogie(-5.0) + bogie(5.0) + couplers(L) + [bx(0, RT + 0.85, 0, 0.5, 0.3, L, 'steelD'), bx(0, RT + 1.1, 0, 3.0, 0.25, L, 'steelD')] + [bx(sx*1.45, RT + 1.35, z, 0.1, 0.25, 0.1, 'steel') for sx in (-1, 1) for z in (-6.5, -3.3, 0, 3.3, 6.5)]
    if load == 'logs':
        o += [bx(sx*1.5, RT + 1.35, z, 0.12, 1.5, 0.12, 'steelD') for sx in (-1, 1) for z in (-6.0, 0.0, 6.0)]
        for row, (n, y0) in enumerate(((4, 1.6), (3, 2.2), (2, 2.8))):
            for i in range(n):
                x = (i - (n - 1)/2)*0.62; o.append(loft([[x, RT + y0 + 0.2, -6.2 + (i % 2)*0.4, 0.3, 0.3], [x, RT + y0 + 0.2, 6.2 - ((i + row) % 2)*0.4, 0.3, 0.3]], 'log', ax='z', n=8))
    elif load == 'container':
        for z, c in ((-3.4, 'cont1'), (3.4, 'cont3')):
            o += [bx(0, RT + 1.35, z, 2.45, 2.6, 6.0, c)] + [bx(sx*1.24, RT + 1.35, z + dz*2.5, 0.05, 2.6, 0.1, 'steelD') for sx in (-1, 1) for dz in (-1, 0, 1)] + [bx(0, RT + 1.35, z + 3.0, 2.0, 2.4, 0.06, 'steelD')]
    return o
reg('flatcar', flat(None), 3.2, 14.8, 1.8, 'a 14 m flatcar: a bare deck with stake pockets; load it with anything from the loose items')
reg('flatcar_logs', flat('logs'), 3.2, 14.8, 4.9, 'a flatcar with three tiers of logs held by steel stakes (nine logs)')
reg('flatcar_container', flat('container'), 3.2, 14.8, 4.5, 'a flatcar carrying two 6 m shipping containers, blue and ochre: a loot car (searchable)')
def gondola():
    L = 13.0
    o = bogie(-4.4) + bogie(4.4) + couplers(L) + [bx(0, RT + 0.85, 0, 0.5, 0.3, L, 'steelD'), bx(0, RT + 1.1, 0, 3.0, 0.15, L, 'steelD'), bx(0, RT + 1.25, 0, 3.0, 1.5, L, 'rust')]
    o += [bx(0, RT + 1.3, 0, 2.7, 1.45, L - 0.3, 'black'), bx(0, RT + 1.25, -L/2 + 0.1, 3.0, 1.9, 0.1, 'rust'), bx(0, RT + 1.25, L/2 - 0.1, 3.0, 1.9, 0.1, 'rust')]
    o += [bx(sx*1.5, RT + 1.25, z, 0.06, 1.5, 0.12, 'steelD') for sx in (-1, 1) for z in (-5.5, -2.7, 0, 2.7, 5.5)]
    return o + [hull([(-1.3, RT + 2.7, -4.5), (1.3, RT + 2.7, -4.5), (1.3, RT + 2.7, 4.5), (-1.3, RT + 2.7, 4.5), (-0.8, RT + 3.5, -2.8), (0.8, RT + 3.4, -3.0), (0.7, RT + 3.5, 3.0), (-0.9, RT + 3.4, 2.8)], 'scrap'), bx(0.4, RT + 3.4, 0.5, 0.8, 0.4, 1.2, 'scrapD')]
reg('gondola_scrap', gondola(), 3.2, 14.0, 4.1, 'a gondola car 13 m long, open top with rusty walls and a heap of scrap iron: scrap and metal to search')
def caboose():
    L = 9.0
    o = bogie(-3.0, 0.9) + bogie(3.0, 0.9) + couplers(L + 1.2) + [bx(0, RT + 0.85, 0, 0.5, 0.3, L + 1.2, 'steelD'), bx(0, RT + 1.1, 0, 3.0, 0.15, L + 1.2, 'steelD'), bx(0, RT + 1.25, 0, 2.9, 2.4, L - 1.0, 'red')]
    o += [bx(0, RT + 3.65, 0, 3.1, 0.12, L - 0.8, 'redD'), bx(0, RT + 3.75, -0.5, 2.2, 1.5, 2.2, 'red'), bx(0, RT + 5.25, -0.5, 2.4, 0.12, 2.5, 'redD'), bx(0, RT + 4.2, 0.62, 2.2, 0.7, 0.05, 'glass'), bx(0, RT + 4.2, -1.62, 2.2, 0.7, 0.05, 'glass'), bx(1.12, RT + 4.2, -0.5, 0.05, 0.7, 1.8, 'glass'), bx(-1.12, RT + 4.2, -0.5, 0.05, 0.7, 1.8, 'glass')]
    o += [bx(sx*1.47, RT + 2.2, z, 0.05, 0.7, 0.8, 'glass') for sx in (-1, 1) for z in (-2.4, 0.0, 2.4)] + [bx(0, RT + 1.25, sz*(L/2 - 0.4), 0.9, 2.2, 0.05, 'door') for sz in (-1, 1)] + [cylv(0.7, RT + 3.75, 2.5, 0.12, 1.0, 'steelD', 8)]
    for sz in (-1, 1):
        o += [bx(0, RT + 1.2, sz*(L/2 + 0.8), 2.6, 0.1, 1.2, 'steelD')] + [bx(sx*1.25, RT + 1.3, sz*(L/2 + 0.8), 0.05, 1.0, 0.05, 'steel') for sx in (-1, 1)] + [bx(0, RT + 2.3, sz*(L/2 + 1.35), 2.5, 0.05, 0.05, 'steel')]
    return o
reg('caboose_red', caboose(), 3.2, 11.0, 5.8, 'a red caboose 9 m long with a cupola, end platforms and railings, side windows and a stovepipe: the last car, a home or a shelter on a dead siding')
def loco(col, colD):
    L = 17.0
    o = bogie(-4.9, 1.2) + bogie(4.9, 1.2) + couplers(L) + [bx(0, RT + 1.0, 0, 3.0, 0.45, L, 'steelD'), bx(0, RT + 0.62, 0, 2.0, 0.4, 6.0, 'black'), bx(0, RT + 1.45, 0, 3.3, 0.12, L + 0.6, 'steel')]
    o += [bx(0, RT + 1.57, 3.8, 2.8, 1.8, 8.4, col), bx(0, RT + 3.37, 3.8, 2.9, 0.12, 8.4, colD), bx(0, RT + 1.57, 8.0, 2.6, 1.5, 0.9, col)]
    o += [bx(0, RT + 1.57, -3.4, 3.1, 2.5, 3.4, col), bx(0, RT + 4.07, -3.4, 3.3, 0.14, 3.8, colD), bx(0, RT + 1.57, -6.9, 2.6, 1.6, 3.2, col), bx(0, RT + 3.17, -6.9, 2.7, 0.12, 3.2, colD)]
    o += [bx(0, RT + 2.7, -1.69, 2.6, 1.0, 0.05, 'glass'), bx(1.56, RT + 2.7, -3.4, 0.05, 1.0, 1.6, 'glass'), bx(-1.56, RT + 2.7, -3.4, 0.05, 1.0, 1.6, 'glass'), bx(0, RT + 2.7, -5.12, 2.6, 1.0, 0.05, 'glass')]
    o += [bx(sx*1.41, RT + 1.9, z, 0.05, 0.5, 8.2, 'yellow') for sx in (-1, 1) for z in (3.8,)] + [bx(0, RT + 2.0, 8.47, 2.6, 1.3, 0.05, 'yellow'), bx(0.0, RT + 2.4, 8.51, 2.0, 0.3, 0.04, 'glow', glow=True)]
    o += [cylv(0, RT + 3.45, z, 0.5, 0.08, 'steelD', 10) for z in (2.0, 4.6)] + [cylv(-0.7, RT + 3.45, 6.4, 0.2, 0.7, 'steelD', 8), cylv(0.7, RT + 4.07, -2.2, 0.15, 0.4, 'steel', 8)]
    for sx in (-1, 1):
        o += [tube([sx*1.5, RT + 2.0, z0], [sx*1.5, RT + 2.0, z1], 0.05, 'steel') for z0, z1 in ((-8.0, -5.2), (-1.7, 8.0))] + [bx(sx*1.55, RT + 0.7, z, 0.05, 0.75, 0.45, 'steel') for z in (-1.8, 1.9)]
    return o
reg('locomotive_orange', loco('orange', 'orangeD'), 3.4, 18.0, 4.9, 'a road-switcher diesel locomotive 17 m long: an orange hood (the BNSF colours) with yellow side stripes and a yellow nose, cab at the back (-z), long hood in front (+z), two bogies, a lit headlight; wheels on y 0.62')
reg('locomotive_blue', loco('blue', 'blueD'), 3.4, 18.0, 4.9, 'the same in blue')
reg('handcar', [bx(0, RT + 0.3, 0, 1.7, 0.12, 2.6, 'wood'), *[wheel(sx*GA, z, 0.22) for sx in (-1, 1) for z in (-0.9, 0.9)], *[tube([sx*GA, RT + 0.22, -0.9], [sx*GA, RT + 0.22, 0.9], 0.06, 'steel') for sx in (-1, 1)], bx(0, RT + 0.42, 0.0, 0.2, 0.7, 0.2, 'steelD'), tube([-0.1, RT + 1.1, -1.0], [0.1, RT + 1.15, 1.0], 0.1, 'woodD'), bx(0, RT + 0.42, 1.05, 0.6, 0.12, 0.5, 'woodD')], 1.9, 2.6, 2.0,
    'a pump handcar for two people on a track: a plank deck on four small wheels and a rocking beam: a way to travel along the line, quietly, with no fuel')
pack_use = {'railway=rail': ['track_4 (a 4 m piece along each way, turned to follow it)', 'track_crossing_4 where a road crosses it', 'crossing_gate_up', 'props.street.railroad_crossing_on'], 'railway=station': ['depot_small', 'platform_4'], 'railway=signal': ['signal_mast'], 'railway=buffer_stop': ['track_bumper'], 'building=train_station': ['depot_small'], 'building=warehouse beside the track': ['freight_house', 'loading_dock_4']}
finish('rail', P, __doc__, __file__, 'boxes, hulls and lofts; flat colours', pack_use,
       'Track: lay track_4 end to end along each rail way (it is 4 m, along z): at a bend, turn each piece a few degrees or keep it straight and let the rails run slightly off, as low-poly games do. Put crossings where a road meets the line. Sidings can be track_worn_4 ending in track_bumper. '
       'Trains: a locomotive then 3 to 10 cars (about 14.4 m each with couplers); wheels sit on y 0.62, so place each car at the track piece height. Move a train by sliding its models along z; wheels have no turn (they are part of the body). Abandoned trains (boxcar_open, caboose_red, tank_car, gondola_scrap) on dead sidings are search spots and shelters. '
       'The yard by Springfield (the BNSF Springfield yard and the Frisco history) is where many cars should stand: put 3 to 6 tracks side by side 4.5 m apart with a switch at each end.')
