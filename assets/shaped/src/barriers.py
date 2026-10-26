#!/usr/bin/env python3
"""Afterstreet barriers and shelters pack, version 1 (26 October 2026): fences and walls the map does not draw, and the things survivors build when the city fails. Writes assets/shaped/barriers.js. Run: python3 assets/shaped/src/barriers.py

models.barriers.<name>, metres, Y up, front +Z. Fence pieces are 4 m long along x, centred, so they tile end to end; turn them to follow a way.
Fences and walls: fence_privacy_4, fence_gate_4, fence_brick_wall_4, fence_stone_wall_4, fence_cinder_wall_4, fence_sound_wall_4, fence_cable_barrier_4, fence_security_4 (razor top), gate_security_4, gate_chain_4.
Survival works: hesco_4, razor_wire_4, scrap_barricade_4, cart_barricade_4, sandbag_wall_4, checkpoint_booth, checkpoint_arm, watchtower_scrap, quarantine_tent, tarp_shelter, burn_barrel.
Signs and traps: airdrop_crate, evac_board, missing_board, tripwire_cans, spike_strip, snare, deadfall.
Colour names are in the palette."""
import math
from bld import *
P = {'tin': '#8a9096', 'lamp': '#fff2b0', 'wood': '#a58a62', 'woodD': '#7a6244', 'woodW': '#8e8a80', 'brick': '#8a4a38', 'brickD': '#6a3828', 'stone': '#a09a8a', 'stoneD': '#7e786c', 'stoneL': '#bdb8a8', 'cinder': '#9a9a96', 'concrete': '#a8a69e', 'concreteD': '#807e76',
     'steel': '#6a7078', 'steelD': '#4a4e54', 'steelL': '#9aa0a6', 'chain': '#8c9298', 'rust': '#8a4a2a', 'rustD': '#6a3820', 'black': '#1c1d20', 'white': '#e8e4da', 'red': '#a8342a', 'orange': '#d86a24', 'yellow': '#e0b420',
     'olive': '#5a6038', 'oliveD': '#434a2a', 'sand': '#b09a6c', 'canvas': '#8a8666', 'blue': '#2e5a8a', 'tarp': '#3a6aa0', 'tarpO': '#c06a28', 'glass': '#2a3a46', 'fire': '#f08a2c', 'fireY': '#ffd060', 'paper': '#e4dcc0', 'ink': '#2a2a2e', 'green': '#4a6a3a', 'rope': '#b8a070'}
S = 4.0
def post(x, h=1.9, c='woodD', w=0.14): return bx(x, 0, 0, w, h, w, c)
def privacy():
    o = [post(x) for x in (-2, 0, 2)] + [bx(0, 0.3, -0.07, S, 0.1, 0.08, 'woodD'), bx(0, 1.3, -0.07, S, 0.1, 0.08, 'woodD')]
    return o + [bx(-1.9 + i*0.2, 0.05, 0.04, 0.17, 1.8, 0.04, 'wood' if i % 3 else 'woodD') for i in range(20)]
reg('fence_privacy_4', privacy(), 4.0, 0.2, 1.9, 'a 1.9 m wooden privacy fence, 4 m, upright boards on rails')
def gate():
    o = [post(-2, 2.0), post(2, 2.0)]
    o += [bx(0, 0.3, 0.02, 3.6, 0.12, 0.06, 'woodD'), bx(0, 1.4, 0.02, 3.6, 0.12, 0.06, 'woodD')]
    o += [tube([-1.8, 0.3, 0.06], [1.8, 1.45, 0.06], 0.1, 'woodD')] + [bx(-1.7 + i*0.2, 0.1, 0.0, 0.16, 1.7, 0.04, 'wood') for i in range(18)]
    return o + [bx(1.6, 0.9, 0.08, 0.1, 0.1, 0.05, 'steelD')]
reg('fence_gate_4', gate(), 4.0, 0.3, 2.0, 'a wooden yard gate 3.6 m wide with a diagonal brace and a latch; closed')
def brickwall():
    return [bx(0, 0, 0, S, 1.6, 0.3, 'brick'), bx(0, 1.6, 0, S, 0.12, 0.38, 'stone')] + [bx(x, 0, 0, 0.4, 1.7, 0.4, 'brickD') for x in (-2, 2)] + [bx(0, 0.5, 0.16, S, 0.05, 0.02, 'brickD'), bx(0, 1.0, 0.16, S, 0.05, 0.02, 'brickD')]
reg('fence_brick_wall_4', brickwall(), 4.0, 0.4, 1.7, 'a 1.6 m brick wall with stone cap and piers: the old-town wall around yards and cemeteries')
def drystone():
    o = []
    for r in range(5):
        for i in range(7):
            w = 0.5 + 0.12*((i*7 + r*3) % 4)
            x = -1.9 + i*0.58 + (0.28 if r % 2 else 0)
            if abs(x) < 2.0: o.append(bx(x, r*0.26, 0.0, w, 0.25 + 0.03*(i % 3), 0.5, 'stone' if (i + r) % 3 else 'stoneD'))
    return o
reg('fence_stone_wall_4', drystone(), 4.0, 0.5, 1.4, 'a dry-stone field wall 1.3 m: the Ozark farm boundary, built of uneven blocks')
reg('fence_cinder_wall_4', [bx(0, 0, 0, S, 1.8, 0.25, 'cinder')] + [bx(0, 0.6*i, 0.13, S, 0.03, 0.02, 'concreteD') for i in range(1, 3)] + [bx(x, 0, 0, 0.3, 1.9, 0.3, 'concreteD') for x in (-2, 2)] + [bx(0, 1.8, 0, S, 0.1, 0.3, 'concrete')], 4.0, 0.3, 1.9, 'a painted cinder-block wall 1.8 m')
def soundwall():
    return [bx(x, 0, 0, 0.4, 4.2, 0.5, 'concreteD') for x in (-2, 2)] + [bx(0, 0.2, 0, 3.6, 3.9, 0.25, 'concrete')] + [bx(0, 0.6 + i*0.6, 0.14, 3.6, 0.04, 0.02, 'concreteD') for i in range(6)]
reg('fence_sound_wall_4', soundwall(), 4.0, 0.5, 4.2, 'a 4.2 m highway sound wall of concrete panels: blocks sight and sound; use beside the interstate')
def cable():
    o = [bx(x, 0, 0, 0.1, 0.9, 0.1, 'steelD') for x in (-2, 0, 2)]
    return o + [tube([-2, y, 0.06], [2, y, 0.06], 0.04, 'steelL') for y in (0.45, 0.65, 0.85)]
reg('fence_cable_barrier_4', cable(), 4.0, 0.2, 0.9, 'a highway cable guard rail: three wires on posts')
def security(top=True):
    o = [bx(x, 0, 0, 0.12, 2.6, 0.12, 'steelD') for x in (-2, 2)] + [bx(0, 0.1, 0, S, 0.06, 0.06, 'steel'), bx(0, 2.1, 0, S, 0.06, 0.06, 'steel')]
    o += [bx(-1.9 + i*0.2, 0.1, 0, 0.03, 2.0, 0.03, 'chain') for i in range(20)]
    if top: o += [tube([-2, 2.55, 0], [2, 2.55, 0], 0.1, 'steelL'), tube([-2, 2.7, 0.0], [2, 2.7, 0.06], 0.16, 'rustD')]
    return o
reg('fence_security_4', security(), 4.0, 0.2, 2.8, 'a 2.5 m chain-link fence topped with a coil of razor wire: factories, depots and the airport')
reg('gate_security_4', security(True) + [bx(1.6, 0.9, 0.1, 0.1, 0.4, 0.1, 'red')], 4.0, 0.2, 2.8, 'a razor-topped gate panel (the same, with a red lock plate)')
reg('gate_chain_4', security(False), 4.0, 0.2, 2.1, 'a plain chain-link panel or gate 2.1 m, no wire on top')
# ---- survival works
def hesco():
    o = [bx(0, 0, 0, S, 1.4, 1.1, 'sand')]
    o += [bx(x, 0, 0, 0.04, 1.42, 1.12, 'olive') for x in (-2, -1, 0, 1, 2)] + [bx(0, 1.4, 0, S, 0.04, 1.1, 'oliveD')]
    return o
reg('hesco_4', hesco(), 4.0, 1.1, 1.4, 'a Hesco wall: two linked soil-filled wire-and-cloth cubes, 1.4 m: a good emplacement for a defended road')
def razor():
    o = []
    for i in range(10): o.append(tube([-2 + i*0.4, 0.25, 0], [-1.6 + i*0.4, 0.95, 0.0], 0.07, 'steelL'))
    for i in range(10): o.append(tube([-1.6 + i*0.4, 0.25, 0.1], [-2 + i*0.4 + 0.8, 0.95, 0.1], 0.07, 'steelL'))
    return o + [bx(x, 0, 0, 0.08, 1.1, 0.08, 'steelD') for x in (-2, 2)]
reg('razor_wire_4', razor(), 4.0, 0.2, 1.1, 'a field coil of razor wire 4 m: slows people and zombies alike; cuts anything that steps on it')
def scrap():
    o = [bx(0, 0, 0, S, 0.2, 0.5, 'steelD')]
    cols = ('rust', 'woodD', 'steel', 'rustD', 'wood', 'canvas')
    for i in range(8): o.append(bx(-1.75 + i*0.5, 0.2, 0, 0.45, 1.0 + 0.5*((i*5) % 3)*0.5, 0.18 + 0.06*(i % 3), cols[i % 6]))
    return o + [tube([-2, 0.4, 0.2], [2, 1.5, 0.2], 0.08, 'steelL'), tube([-1.5, 1.8, 0.1], [1.5, 0.5, 0.15], 0.06, 'rustD')]
reg('scrap_barricade_4', scrap(), 4.0, 0.6, 1.9, 'a barricade built from door, board and sheet metal scrap, ~2 m high with wire across it: a block for alleys and doorways')
def carts():
    o = []
    for i in range(3):
        x = -1.3 + i*1.3
        o += [bx(x, 0.2, 0, 0.8, 0.04, 1.0, 'chain')]
        o += [bx(x - 0.4, 0.1, 0.0, 0.03, 0.9, 1.0, 'chain'), bx(x + 0.4, 0.1, 0.0, 0.03, 0.9, 1.0, 'chain'), bx(x, 0.1, 0.5, 0.8, 0.9, 0.03, 'chain'), bx(x, 0.1, -0.5, 0.8, 0.9, 0.03, 'chain')]
        o += [bx(x - 0.3, 0, -0.4, 0.08, 0.15, 0.08, 'black'), bx(x + 0.3, 0, -0.4, 0.08, 0.15, 0.08, 'black'), bx(x - 0.3, 0, 0.4, 0.08, 0.15, 0.08, 'black'), bx(x + 0.3, 0, 0.4, 0.08, 0.15, 0.08, 'black')]
        o += [bx(x, 1.0, -0.5, 0.8, 0.05, 0.05, 'red')]
    return o
reg('cart_barricade_4', carts(), 4.0, 1.0, 1.1, 'three shopping carts chained side by side: a quick, cheap, noisy barricade')
def sandbags():
    o = []
    for r in range(4):
        for i in range(8 - (r % 2)):
            x = -1.75 + i*0.5 + (0.0 if r % 2 == 0 else 0.25)
            o.append(bx(x, r*0.22, 0, 0.5, 0.22, 0.4, 'sand' if (i + r) % 2 else 'canvas'))
    return o
reg('sandbag_wall_4', sandbags(), 4.0, 0.4, 0.9, 'a brick-bond sandbag wall 0.9 m, chest-high from behind')
def booth():
    o = [bx(0, 0, 0, 2.6, 0.2, 2.6, 'concreteD'), bx(0, 0.2, 0, 2.4, 2.3, 2.4, 'steelL'), bx(0, 2.5, 0, 2.9, 0.15, 2.9, 'steelD')]
    o += [bx(0, 1.2, 1.22, 2.0, 1.0, 0.04, 'glass'), bx(1.22, 1.2, 0, 0.04, 1.0, 1.6, 'glass'), bx(-1.22, 1.2, 0, 0.04, 1.0, 1.6, 'glass'), bx(0, 0.7, 1.24, 2.1, 0.5, 0.1, 'steelD')]
    return o + [bx(-0.5, 1.9, 1.24, 0.9, 0.3, 0.05, 'yellow'), bx(0.7, 2.65, 0.0, 0.5, 0.2, 0.5, 'red', glow=True)]
reg('checkpoint_booth', booth(), 2.9, 2.9, 3.0, 'a guard booth 2.4 m square with glass on three sides and a yellow sign band; at every gate and ferry')
def arm():
    o = [bx(0, 0, 0, 0.5, 1.0, 0.5, 'steelD'), bx(0, 0.85, 0, 0.5, 0.25, 0.5, 'yellow')]
    o += [bx(2.4, 0.95, 0, 4.2, 0.1, 0.12, 'white')]
    return o + [bx(0.6 + i*0.8, 0.95, 0, 0.4, 0.1, 0.125, 'red') for i in range(5)]
reg('checkpoint_arm', arm(), 4.6, 0.6, 1.1, 'a red and white road barrier arm, 4.2 m, lowered (turn to open)')
def tower():
    o = [bx(sx*1.2, 0, sz*1.2, 0.2, 6.0, 0.2, 'woodD') for sx in (-1, 1) for sz in (-1, 1)]
    for y in (1.5, 3.2): o += [bx(0, y, sz*1.2, 2.6, 0.1, 0.08, 'wood') for sz in (-1, 1)] + [bx(sx*1.2, y, 0, 0.08, 0.1, 2.6, 'wood') for sx in (-1, 1)]
    o += [tube([-1.2, 1.5, 1.25], [1.2, 3.2, 1.25], 0.08, 'wood'), tube([1.2, 1.5, -1.25], [-1.2, 3.2, -1.25], 0.08, 'wood')]
    o += [bx(0, 6.0, 0, 3.0, 0.15, 3.0, 'woodD'), bx(0, 6.15, 1.45, 3.0, 0.9, 0.1, 'rust'), bx(0, 6.15, -1.45, 3.0, 0.9, 0.1, 'rust'), bx(-1.45, 6.15, 0, 0.1, 0.9, 3.0, 'rust'), bx(1.45, 6.15, 0, 0.1, 0.9, 3.0, 'rust')]
    o += [bx(sx*1.35, 6.15, sz*1.35, 0.14, 2.0, 0.14, 'woodD') for sx in (-1, 1) for sz in (-1, 1)] + [bx(0, 8.15, 0, 3.4, 0.12, 3.4, 'tin')]
    return o + [bx(0.0, 0.0, 1.45, 0.6, 6.0, 0.06, 'wood')] + [bx(0, 7.0, 1.46, 0.5, 0.2, 0.05, 'fireY', glow=True)]
reg('watchtower_scrap', tower(), 3.6, 3.6, 8.3, 'a 6 m scrap-and-timber lookout with a tin roof and a lit lamp: for a camp, a bridge or a fence line')
def tent():
    o = [bx(0, 0, 0, 4.0, 0.08, 6.0, 'canvas'), bx(0, 0.08, 0, 4.0, 1.6, 6.0, 'canvas')]
    o += gable(4.4, 6.4, 1.68, 1.1, 'canvas', 0.2, 0.2, 'z')
    o += [bx(0, 0.08, 3.02, 1.3, 1.5, 0.05, 'ink'), bx(0, 1.7, 3.04, 1.4, 0.4, 0.04, 'red'), bx(0, 1.78, 3.07, 0.25, 0.25, 0.03, 'white')]
    return o
reg('quarantine_tent', tent(), 4.4, 6.4, 3.1, 'a large canvas medical tent 4 by 6 m with a red cross band at the door (+z): a FEMA-style station: loot and heal here, or take shelter')
def tarp():
    o = [bx(sx*1.6, 0, sz*1.2, 0.08, 2.0, 0.08, 'woodD') for sx in (-1, 1) for sz in (-1, 1)]
    o += [tube([-1.7, 2.0, 1.2], [1.7, 2.0, 1.2], 0.04, 'rope'), tube([-1.7, 2.0, -1.2], [1.7, 2.0, -1.2], 0.04, 'rope')]
    o += [bx(0, 1.9, 0, 3.6, 0.04, 2.8, 'tarp'), bx(0, 0.0, 0, 3.0, 0.05, 2.2, 'canvas'), bx(0.7, 0.05, -0.3, 0.8, 0.12, 1.4, 'olive'), bx(-0.7, 0.05, 0.2, 0.7, 0.3, 0.4, 'woodD')]
    return o
reg('tarp_shelter', tarp(), 3.6, 2.8, 2.0, 'a lean-to: a blue tarp on four poles over a bedroll and a crate; a roof for a camp in the woods')
def barrel():
    o = [cylv(0, 0, 0, 0.3, 0.9, 'rust', 10)]
    o += [cylv(0, 0.7, 0, 0.26, 0.2, 'fire', 8), bx(0, 0.9, 0, 0.14, 0.5, 0.14, 'fireY', glow=True), bx(0.0, 0.85, 0.05, 0.25, 0.3, 0.25, 'fire', glow=True)]
    return o
reg('burn_barrel', barrel(), 0.6, 0.6, 1.4, 'an oil drum with a fire in it, lit: warmth and a light at night; draws attention')
def crate():
    o = [bx(0, 0, 0, 1.4, 1.1, 1.4, 'olive'), bx(0, 1.1, 0, 1.5, 0.1, 1.5, 'oliveD')]
    o += [bx(0, 0.5, 0.71, 1.4, 0.12, 0.03, 'yellow'), bx(0, 0.0, 0.71, 0.12, 1.1, 0.03, 'yellow'), bx(0.5, 0.75, 0.72, 0.4, 0.2, 0.02, 'white'), bx(0, 1.2, 0, 0.1, 0.4, 0.1, 'oliveD'), bx(0, 1.6, 0, 0.8, 0.04, 0.04, 'orange'), bx(0.0, 1.62, 0.0, 0.12, 0.12, 0.12, 'orange', glow=True)]
    return o
reg('airdrop_crate', crate(), 1.6, 1.6, 1.8, 'a military supply drop crate with a yellow stripe and a flashing marker light: rare loot, and it brings people')
def board(kind):
    o = [bx(sx*1.0, 0, 0, 0.12, 2.0, 0.12, 'woodD') for sx in (-1, 1)] + [bx(0, 0.9, 0, 2.3, 1.1, 0.08, 'woodW')]
    if kind == 'evac':
        o += [bx(0, 1.7, 0.05, 2.0, 0.25, 0.04, 'red'), bx(-0.6, 1.1, 0.05, 0.9, 0.55, 0.03, 'paper'), bx(0.55, 1.2, 0.05, 0.7, 0.4, 0.03, 'paper'), bx(0.5, 0.75, 0.05, 0.9, 0.3, 0.03, 'paper'), bx(-0.7, 0.75, 0.05, 0.5, 0.25, 0.03, 'yellow')]
    else:
        o += [bx(x, y, 0.05, 0.45, 0.6, 0.02, 'paper') for x in (-0.8, -0.2, 0.4, 0.95) for y in (1.4,)] + [bx(x, 0.8, 0.05, 0.4, 0.5, 0.02, 'paper') for x in (-0.6, 0.0, 0.7)]
        o += [bx(x, 1.62, 0.07, 0.16, 0.15, 0.01, 'ink') for x in (-0.8, -0.2, 0.4, 0.95)]
    return o
reg('evac_board', board('evac'), 2.4, 0.3, 2.0, 'a notice board with a red header and curling evacuation orders: lore text goes on the papers (decals)')
reg('missing_board', board('mis'), 2.4, 0.3, 2.0, 'a board of missing-person flyers, each with a photo square: the faces of the dead; lore')
def tripwire():
    o = [bx(-1.5, 0, 0, 0.06, 0.6, 0.06, 'woodD'), bx(1.5, 0, 0, 0.06, 0.6, 0.06, 'woodD'), tube([-1.5, 0.35, 0], [1.5, 0.35, 0], 0.015, 'steelL')]
    return o + [cylv(x, 0.35, 0.0, 0.05, 0.12, 'rustD', 8) for x in (-1.0, -0.3, 0.4, 1.0)] + [bx(x, 0.2, 0.0, 0.01, 0.15, 0.01, 'rope') for x in (-1.0, -0.3, 0.4, 1.0)]
reg('tripwire_cans', tripwire(), 3.1, 0.3, 0.6, 'a wire across the path at ankle height with cans hanging from it: a noise alarm; sets off when anything crosses')
def spike():
    o = [bx(0, 0, 0, 4.0, 0.04, 0.5, 'steelD')]
    for i in range(20): o.append(tip([-1.9 + i*0.2, 0.04, 0.0], [-1.9 + i*0.2, 0.24, 0.0], 0.05, 0.05, 'steelL'))
    return o
reg('spike_strip', spike(), 4.0, 0.5, 0.25, 'a tyre-puncture strip 4 m with 20 spikes: lay on a road to burst tyres')
def snare():
    return [tube([-0.4, 0.0, 0], [-0.2, 1.6, 0], 0.06, 'woodD'), tube([-0.2, 1.6, 0], [0.4, 1.7, 0], 0.03, 'rope'), bx(0.4, 1.0, 0.0, 0.03, 0.7, 0.03, 'rope'), tube([0.3, 0.3, 0.0], [0.5, 0.3, 0.1], 0.02, 'steelL'), bx(0, 0, 0, 0.9, 0.04, 0.5, 'woodD')]
reg('snare', snare(), 1.0, 0.5, 1.7, 'a bent-sapling snare for small animals: set it where they run; you check it each morning')
def deadfall():
    o = [bx(0, 0, 0, 1.3, 0.1, 0.9, 'woodD'), bx(0.0, 0.1, 0.0, 0.1, 0.5, 0.1, 'wood'), tube([0.0, 0.55, 0.0], [0.5, 0.2, 0.25], 0.06, 'wood')]
    return o + [bx(-0.4, 0.55, -0.1, 1.2, 0.35, 0.8, 'stoneD')] + [tube([0.1, 0.1, 0.1], [0.5, 0.1, 0.25], 0.02, 'rope')]
reg('deadfall', deadfall(), 1.3, 0.9, 0.9, 'a stone propped on a stick over a bait: it falls on what takes the bait')
pack_use = {'barrier=fence': ['fence_privacy_4', 'fence_security_4'], 'barrier=wall': ['fence_brick_wall_4', 'fence_cinder_wall_4', 'fence_stone_wall_4'], 'barrier=gate': ['fence_gate_4', 'gate_chain_4', 'gate_security_4'], 'barrier=guard_rail or cable_barrier': ['fence_cable_barrier_4'], 'highway=motorway beside housing': ['fence_sound_wall_4'], 'barrier=toll_booth or border_control': ['checkpoint_booth', 'checkpoint_arm']}
finish('barriers', P, __doc__, __file__, 'boxes and tubes; flat colours', pack_use,
       'Fences: lay a fence piece every 4 m along the barrier way (turn each to follow it); use fence_security_4 around industry and the airport, brick and stone walls round yards and old cemeteries, sound wall beside the interstate. Survival works are for the game: a hesco_4 or sandbag_wall_4 line with a checkpoint_booth makes a defended crossing; scrap_barricade_4 and cart_barricade_4 block alleys; tripwire_cans, spike_strip, snare and deadfall are the player-set traps. quarantine_tent and watchtower_scrap make an NPC camp. Boards (evac_board, missing_board) take text decals for the lore.')
