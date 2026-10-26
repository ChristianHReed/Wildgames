#!/usr/bin/env python3
"""Afterstreet solar and small power pack, version 1 (26 October 2026): panels, racks, batteries and the generator house. Writes assets/shaped/solar.js. Run: python3 assets/shaped/src/solar.py

models.solar.<name>, metres, Y up, front (the sun side) +Z, origin at the centre of the base.
Panels: panel_roof_array (3 by 2 panels flat on a roof, 5.2 by 3.4 m), panel_ground_array (a 4-panel tilted rack, 4 m wide), panel_small_rack (one panel on a post, 1 by 1.7 m), panel_street_lamp (a lamp pole with a panel and battery box).
Equipment: charge_controller (wall box with lit LEDs), battery_bank (six lead-acid batteries on a shelf, in a rack), inverter (a wall box with a cooling fin), power_cabinet (a lockable cabinet with the three in one box).
Generator: generator_house (a 3 by 3 m shed with louvres and an exhaust pipe), fuel_tank_stand (a 1.5 m steel tank on a stand with a hose).
Colour names are in the palette."""
import math
from bld import *
P = {'cell': '#1e2a44', 'cellL': '#2c3f66', 'frame': '#b4b8bc', 'frameD': '#7a7e84', 'steel': '#6a7078', 'steelD': '#4a4e54', 'galv': '#a6acb0', 'black': '#1c1d20', 'concrete': '#a8a69e', 'concreteD': '#807e76', 'white': '#e8e4da', 'green': '#4a8a3a', 'ledG': '#5aff6a', 'ledR': '#ff4a3a',
     'amber': '#ffb020', 'battery': '#2a3a2e', 'batteryT': '#c8b030', 'cable': '#2a2a2e', 'cabinet': '#8a9a8a', 'cabinetD': '#6a7a6a', 'tank': '#c0402c', 'tankD': '#8a2c1c', 'hose': '#3a3a3e', 'shed': '#7a8a92', 'shedD': '#5a6a72', 'lamp': '#fff2b0', 'wood': '#9a7a52', 'pipe': '#4a4a4e'}
def pv(cx, cz, yaw, w, d, y0, y1_front, y1_back, t=0.05):
    """a tilted panel: a slab whose front edge is at y1_front and back edge at y1_back, centred on (cx, cz), width w along x, depth d along z"""
    pts = [(cx - w/2, y1_front, cz + d/2), (cx + w/2, y1_front, cz + d/2), (cx + w/2, y1_back, cz - d/2), (cx - w/2, y1_back, cz - d/2),
           (cx - w/2, y1_front - t, cz + d/2), (cx + w/2, y1_front - t, cz + d/2), (cx + w/2, y1_back - t, cz - d/2), (cx - w/2, y1_back - t, cz - d/2)]
    return solid(pts, [[0, 1, 2, 3], [5, 4, 7, 6], [4, 5, 1, 0], [6, 7, 3, 2], [5, 6, 2, 1], [7, 4, 0, 3]], 'cell')
def cells(cx, cz, w, d, yf, yb):
    o = []
    for i in range(1, 3):
        x = cx - w/2 + i*w/3
        o.append(solid([(x - 0.01, yf + 0.003, cz + d/2), (x + 0.01, yf + 0.003, cz + d/2), (x + 0.01, yb + 0.003, cz - d/2), (x - 0.01, yb + 0.003, cz - d/2), (x - 0.01, yf, cz + d/2), (x + 0.01, yf, cz + d/2), (x + 0.01, yb, cz - d/2), (x - 0.01, yb, cz - d/2)], [[0, 1, 2, 3], [5, 4, 7, 6], [4, 5, 1, 0], [6, 7, 3, 2], [5, 6, 2, 1], [7, 4, 0, 3]], 'frame'))
    return o
def roof_array():
    o = [bx(0, 0, 0, 5.2, 0.1, 3.4, 'frameD')]
    for i in range(3):
        for j in range(2):
            cx, cz = -1.7 + i*1.7, -0.85 + j*1.7
            o += [pv(cx, cz, 0, 1.6, 1.6, 0.0, 0.5, 0.4, 0.05)] + cells(cx, cz, 1.6, 1.6, 0.5, 0.4)
    return o + [bx(x, 0.1, z, 0.06, 0.35, 0.06, 'steel') for x in (-2.5, 0, 2.5) for z in (-1.6, 1.6)]
reg('panel_roof_array', roof_array(), 5.2, 3.4, 0.55, 'a 3 by 2 array of 1.6 m panels flat on a roof, tilted a little to the front, on short posts and a frame (6 panels, about 1.5 kW)')
def ground_array():
    o = [bx(sx*1.9, 0, z, 0.1, 0.9, 0.1, 'galv') for sx in (-1, 1) for z in (-0.9, 0.9)]
    o += [bx(sx*1.9, 0.0, 0.0, 0.1, 0.06, 2.0, 'galv') for sx in (-1, 1)]
    for i in range(4):
        cx = -1.5 + i*1.0
        o += [pv(cx, 0.0, 0, 0.95, 1.9, 0.4, 0.6, 1.5, 0.05)] + cells(cx, 0.0, 0.95, 1.9, 0.6, 1.5)
    return o + [tube([-1.9, 1.5, -0.9], [1.9, 1.5, -0.9], 0.05, 'steel')]
reg('panel_ground_array', ground_array(), 4.0, 2.2, 1.6, 'a four-panel ground array on a galvanised rack, tilted 25 degrees toward +z (south): turn the model so +z faces south')
reg('panel_small_rack', [bx(0, 0, -0.2, 0.1, 1.5, 0.1, 'galv'), bx(0, 0, 0.5, 0.1, 0.8, 0.1, 'galv'), pv(0, 0.15, 0, 1.0, 1.7, 0.8, 0.9, 1.9, 0.04), *cells(0, 0.15, 1.0, 1.7, 0.9, 1.9), bx(0, 0.0, 0.0, 0.1, 0.06, 0.8, 'galv')], 1.0, 1.7, 2.0, 'one 1 m by 1.7 m panel on a post, tilted: a camp or a cabin (about 250 W)')
reg('panel_street_lamp', [bx(0, 0, 0, 0.3, 0.3, 0.3, 'concrete'), bx(0, 0.3, 0, 0.12, 5.2, 0.12, 'steel'), pv(0, 0.05, 0, 0.9, 1.0, 5.5, 5.6, 6.0, 0.04), bx(0, 5.0, 0.15, 0.7, 0.14, 0.3, 'steelD'), bx(0, 4.9, 0.4, 0.5, 0.1, 0.12, 'lamp', glow=True), bx(0.3, 1.8, 0.1, 0.4, 0.5, 0.25, 'cabinet')], 1.0, 1.0, 6.1, 'a solar street lamp: a pole with a panel on top, a lamp head and a battery box on the pole; works with no grid')
def controller():
    return [bx(0, 0, 0, 0.3, 0.4, 0.12, 'cabinet'), bx(0, 0.05, 0.065, 0.2, 0.12, 0.01, 'black'), bx(-0.06, 0.28, 0.065, 0.03, 0.03, 0.01, 'ledG', glow=True), bx(0.0, 0.28, 0.065, 0.03, 0.03, 0.01, 'amber', glow=True), bx(0.06, 0.28, 0.065, 0.03, 0.03, 0.01, 'ledR', glow=True), bx(-0.08, -0.12, 0.0, 0.03, 0.12, 0.03, 'cable'), bx(0.08, -0.12, 0.0, 0.03, 0.12, 0.03, 'cable')]
reg('charge_controller', controller(), 0.3, 0.12, 0.4, 'a wall box with three LEDs (green charging, amber full, red low) and two cables going down; on a wall (back at z 0); LEDs are lit pieces')
def bank():
    o = [bx(0, 0, 0, 1.6, 0.1, 0.6, 'steelD')] + [bx(sx*0.78, 0.1, 0, 0.06, 1.0, 0.6, 'steelD') for sx in (-1, 1)] + [bx(0, 0.5, 0, 1.6, 0.06, 0.6, 'steelD')]
    for lvl in (0, 1):
        for i in range(3):
            x = -0.5 + i*0.5; y = 0.1 + lvl*0.46
            o += [bx(x, y, 0, 0.44, 0.32, 0.5, 'battery'), bx(x - 0.1, y + 0.32, 0.12, 0.06, 0.04, 0.06, 'batteryT'), bx(x + 0.1, y + 0.32, 0.12, 0.06, 0.04, 0.06, 'batteryT')]
    o += [tube([-0.6, 0.9, 0.2], [0.6, 0.9, 0.2], 0.04, 'cable'), tube([-0.6, 0.9, 0.2], [-0.6, 0.45, 0.25], 0.04, 'cable')]
    return o
reg('battery_bank', bank(), 1.6, 0.6, 1.1, 'six deep-cycle lead-acid batteries on a two-shelf steel rack with a cable run: the store of a solar base; each is a loot item')
reg('inverter', [bx(0, 0, 0, 0.5, 0.35, 0.2, 'cabinetD'), bx(0, 0.0, 0.1, 0.4, 0.3, 0.02, 'steel')] + [bx(0, 0.05 + i*0.06, 0.12, 0.38, 0.015, 0.02, 'steelD') for i in range(4)] + [bx(0.18, 0.28, 0.11, 0.04, 0.04, 0.01, 'ledG', glow=True), bx(-0.1, -0.15, 0.0, 0.04, 0.15, 0.04, 'cable'), bx(0.1, -0.15, 0.0, 0.04, 0.15, 0.04, 'cable')], 0.5, 0.2, 0.35, 'an inverter box with cooling fins and a green light: turns the battery into house power')
reg('power_cabinet', [bx(0, 0, 0, 0.8, 1.6, 0.5, 'cabinet'), bx(0, 0.05, 0.255, 0.7, 1.5, 0.02, 'cabinetD'), bx(0.3, 0.8, 0.28, 0.06, 0.2, 0.03, 'steel'), bx(-0.2, 1.3, 0.28, 0.03, 0.03, 0.01, 'ledG', glow=True), bx(-0.1, 1.3, 0.28, 0.03, 0.03, 0.01, 'amber', glow=True), bx(0, 1.6, 0, 0.9, 0.06, 0.6, 'cabinetD')], 0.9, 0.6, 1.7, 'a lockable pad-mounted cabinet holding controller, inverter and a breaker: tidy base power; the door is the front')
def genhouse():
    o = [bx(0, 0, 0, 3.4, 0.2, 3.4, 'concrete'), bx(0, 0.2, 0, 3.0, 2.2, 3.0, 'shed'), bx(0, 2.4, 0, 3.2, 0.12, 3.2, 'shedD'), bx(0, 2.52, 0.0, 3.0, 0.1, 3.0, 'steelD')]
    o += [bx(-0.9 + i*0.0, 0.7 + i*0.12, 1.51, 1.2, 0.04, 0.03, 'black') for i in range(6)] + [bx(0.9, 0.2, 1.51, 0.9, 1.9, 0.04, 'shedD'), bx(1.2, 1.1, 1.55, 0.06, 0.1, 0.04, 'steel')]
    o += [bx(1.55, 1.2, -0.5, 0.05, 0.9, 0.8, 'black'), bx(1.35, 2.5, -0.9, 0.16, 1.6, 0.16, 'pipe'), bx(1.35, 4.0, -0.9, 0.24, 0.1, 0.24, 'steelD')]
    return o
reg('generator_house', genhouse(), 3.4, 3.4, 4.2, 'a 3 by 3 m generator shed: louvre vents and a steel door on the front, a side intake and an exhaust stack through the roof; the sound should be heard from far; place fuel_tank_stand beside it')
def tank():
    o = [bx(sx*0.6, 0, sz*0.3, 0.1, 0.8, 0.1, 'steelD') for sx in (-1, 1) for sz in (-1, 1)] + [bx(0, 0.8, 0, 1.5, 0.06, 0.8, 'steelD')]
    o += [loft([[-0.75, 1.15, 0, 0.36, 0.36], [0.75, 1.15, 0, 0.36, 0.36]], 'tank', n=10, ax='x'), bx(-0.4, 1.5, 0, 0.12, 0.06, 0.12, 'steelD'), tube([0.75, 0.95, 0], [1.1, 0.6, 0.3], 0.05, 'hose'), bx(1.1, 0.0, 0.3, 0.1, 0.6, 0.1, 'steelD')]
    return o
reg('fuel_tank_stand', tank(), 1.5, 0.8, 1.6, 'a 1.5 m horizontal steel fuel tank (about 1,000 L) on a stand with a filler cap and a hose and valve at one end: diesel for a generator; siphon from it')
pack_use = {'power=generator': ['generator_house', 'fuel_tank_stand'], 'power=generator solar': ['panel_ground_array', 'panel_roof_array', 'panel_small_rack'], 'base power': ['charge_controller', 'inverter', 'battery_bank', 'power_cabinet'], 'street lamp off grid': ['panel_street_lamp']}
finish('solar', P, __doc__, __file__, 'boxes, tilted slabs and lofts; flat colours', pack_use,
       'Solar: put arrays where the sun is (roof or open ground) with +z south; one controller and one inverter on the wall near the bank; each panel adds about 250 W by day, nothing at night. Batteries feed the base at night until empty. Generators burn fuel from fuel_tank_stand (siphoned or filled by hand) and are loud: they draw zombies and aliens. LEDs and the lamp are lit pieces.')
