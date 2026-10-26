#!/usr/bin/env python3
"""Afterstreet digging pack, version 1 (26 October 2026): what goes with digging: ladders, plank covers and stake traps for pits, a wheelbarrow, sandbags, edge markers, a grave cross, trench shoring,
shovel and pickaxe lying on the ground, soil and rock lumps as inventory items, and the soil table for the Springfield Plain. Writes assets/shaped/digging.js. Run: python3 assets/shaped/src/digging.py

models.digging.<name>, metres, origin at the centre of the base on the ground (ladders: the foot), front facing +Z. Things that go in a hole say so in info.note: place them on the hole floor or lean them on its edge.
`soil` is the table of layers under Springfield (colour, hardness, tool, sound, what comes out), matching the pack's digging rule. Colour names are in the palette."""
import math
from kit import *
P = {'wood': '#9a7a52', 'woodD': '#6e5238', 'woodL': '#b8a07a', 'plank': '#a88a5e', 'steel': '#6a7078', 'steelD': '#4a4e54', 'steelL': '#9aa0a6', 'rust': '#8a4a2a', 'rope': '#a89060', 'ropeD': '#7a6844',
     'canvas': '#b8b090', 'canvasD': '#8a846a', 'sand': '#b8a070', 'sandD': '#8a7a50', 'tape': '#e0b830', 'tapeD': '#1f2024', 'black': '#1f2024', 'tyre': '#2a2a2c', 'red': '#a8342a', 'redD': '#7a2a24',
     'stake': '#c8b080', 'stakeD': '#8a7048',
     'topsoil': '#5a4030', 'topsoilD': '#46301f', 'sod': '#5a7a38', 'subsoil': '#7a5a3e', 'clay': '#9a5a3a', 'clayD': '#7a4228', 'yclay': '#b87a46', 'chert': '#cfc6b0', 'chertD': '#a89e88', 'limestone': '#aaa698', 'limestoneD': '#8a867a', 'dolo': '#b0a690',
     'handle': '#6b4526', 'cross': '#c8c2b0'}
M = {}; INFO = {}
def reg(n, ps, w, ln, h, note=''): M[n] = ps; INFO[n] = {'w': w, 'len': ln, 'h': h, **({'note': note} if note else {})}
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def tube(p0, p1, t, c): return seg(p0, p1, t/2, t/2, t/2, t/2, c)
# ---------------------------------------------------------------- ladders (foot at the origin, leaning on the +z side, 75 degrees)
def ladder(L, w=0.5, rungs=None):
    lean = L*math.cos(math.radians(75)); top = L*math.sin(math.radians(75)); n = rungs or int(L/0.3)
    o = [tube([sx*w/2, 0, 0], [sx*w/2, top, lean], 0.07, 'wood') for sx in (-1, 1)]
    o += [tube([-w/2, top*(i + 0.5)/n, lean*(i + 0.5)/n], [w/2, top*(i + 0.5)/n, lean*(i + 0.5)/n], 0.05, 'woodL') for i in range(n)]
    o += [bx(sx*w/2, 0, 0, 0.09, 0.04, 0.12, 'woodD') for sx in (-1, 1)]
    return o
reg('ladder_s', ladder(2.4), 0.6, 0.65, 2.3, 'a 2.4 m wooden ladder, foot at the origin, leaning towards +z: lean it on the edge of a hole up to 2 m deep, or a wall')
reg('ladder_m', ladder(3.6), 0.6, 0.95, 3.5, 'a 3.6 m ladder for holes up to 3 m')
reg('ladder_l', ladder(5.0), 0.6, 1.3, 4.8, 'a 5 m ladder for holes up to 4.5 m (and a second storey)')
def rope_ladder(L=4.0):
    o = [tube([sx*0.22, 0, 0], [sx*0.22, L, 0], 0.03, 'rope') for sx in (-1, 1)] + [bx(0, L - 0.05, 0, 0.6, 0.08, 0.1, 'woodD')]
    o += [bx(0, 0.25 + i*0.3, 0, 0.5, 0.04, 0.07, 'woodL') for i in range(int((L - 0.3)/0.3))]
    return o
reg('rope_ladder', rope_ladder(), 0.6, 0.12, 4.0, 'a rope ladder 4 m long hung from its top (origin at the foot): fix the top bar to a stake or tree at the edge; climbing is slower than a ladder but it packs small')
# ---------------------------------------------------------------- covers and traps
def plank_cover(w, d, broken=False):
    o = []
    n = int(d/0.25)
    for i in range(n):
        z = -d/2 + 0.125 + i*0.25
        if broken and i in (n//2 - 1, n//2): continue
        o.append(bx(0, 0, z, w + 0.4, 0.05, 0.23, 'plank' if i % 2 else 'wood'))
    o += [bx(0, 0.05, -d/2 + 0.2, w + 0.3, 0.04, 0.08, 'woodD'), bx(0, 0.05, d/2 - 0.2, w + 0.3, 0.04, 0.08, 'woodD')]
    if broken: o += [bx(0.1, -0.1, 0.05, 0.9, 0.04, 0.25, 'woodD', ry=0), bx(-0.25, -0.35, -0.12, 0.5, 0.03, 0.2, 'wood')]
    return o
for k, (w, d) in {'s': (1.0, 1.0), 'm': (1.5, 1.5), 'l': (2.0, 2.0)}.items():
    reg('plank_cover_' + k, plank_cover(w, d), w + 0.4, d, 0.1, 'planks laid across a hole %.1f by %.1f m, 0.2 m overlap on each side (origin at the middle, top at 0.05 m above the ground): hides the hole; a zombie or survivor walking over falls in' % (w, d))
    reg('plank_cover_%s_broken' % k, plank_cover(w, d, True), w + 0.4, d, 0.1, 'the same after something heavy stepped on it: two planks snapped and fallen in')
def stake_pit(w, d):
    o = [bx(0, 0, 0, w, 0.06, d, 'woodD')]
    nx, nz = int(w/0.25), int(d/0.25)
    for i in range(nx):
        for j in range(nz):
            x = -w/2 + 0.125 + i*w/nx; z = -d/2 + 0.125 + j*d/nz
            o.append(tip([x, 0.06, z], [x + 0.02*((i + j) % 3 - 1), 0.9 + 0.1*((i*3 + j) % 3), z], 0.035, 0.035, 'stake' if (i + j) % 2 else 'stakeD', ax='y'))
    return o
reg('stake_pit_s', stake_pit(1.0, 1.0), 1.0, 1.0, 1.0, 'sharpened stakes nailed to a board, 1 by 1 m: lay it on the floor of a hole for a trap; anything that falls in takes heavy damage')
reg('stake_pit_m', stake_pit(1.5, 1.5), 1.5, 1.5, 1.0, 'the same, 1.5 by 1.5 m')
reg('stake_single', [tip([0, 0, 0], [0, 1.0, 0], 0.04, 0.04, 'stake', ax='y'), ], 0.1, 0.1, 1.0, 'one sharpened stake, point up: for traps, or to mark ground')
# ---------------------------------------------------------------- site: markers, sandbags, shoring, grave
reg('edge_marker', [bx(sx*0.5, 0, 0, 0.05, 0.9, 0.05, 'stakeD') for sx in (-1, 1)] + [bx(0, 0.75, 0, 1.0, 0.04, 0.02, 'tape'), bx(0, 0.62, 0, 1.0, 0.04, 0.02, 'tapeD')], 1.1, 0.1, 0.95, 'two stakes and warning tape: set one at each side of a hole (the game can use it so people see the edge)')
def sandbag(x, y, z, c='sand', ry=0): return box([x, y + 0.08, z], [0.5, 0.16, 0.3], c, ry=ry)
reg('sandbag', [sandbag(0, 0, 0)], 0.5, 0.3, 0.16, 'one sandbag, filled with the soil you dug (an item)')
reg('sandbag_wall', [sandbag(-0.5 + i*0.5 + (0.25 if r % 2 else 0), r*0.16, 0, 'sand' if (i + r) % 2 else 'sandD') for r in range(4) for i in range(3)], 1.8, 0.3, 0.64, 'a wall of sandbags, 1.8 m long and 0.64 m high: cover from the front, stops a flood, can be dug out again')
reg('sandbag_pile', [sandbag(-0.4 + (i % 3)*0.5, (i//3)*0.16, (i//3)*0.05 - 0.1 + (i % 2)*0.15, 'sand' if i % 2 else 'sandD', ry=(i*37) % 4 if False else 0) for i in range(8)], 1.5, 0.5, 0.35, 'a loose pile of filled sandbags')
reg('shoring_panel', [bx(sx*0.9, 0, 0, 0.08, 1.4, 1.2, 'woodD') for sx in (-1, 1)] + [tube([-0.9, 1.0, 0], [0.9, 1.0, 0], 0.08, 'steelL'), tube([-0.9, 0.5, 0], [0.9, 0.5, 0], 0.08, 'steelL')], 1.9, 1.2, 1.4, 'trench shoring: two boards braced by two struts, set in a trench 1.8 m wide; a trench with shoring will not cave in')
reg('grave_cross', [bx(0, 0, 0, 0.06, 1.0, 0.06, 'wood'), bx(0, 0.65, 0, 0.5, 0.06, 0.06, 'wood')], 0.5, 0.06, 1.0, 'a wooden grave cross to plant at the head of a filled grave (a filled grave is 0.8 by 2 m: place the cross at its +z end)')
reg('grave_mound', [hull([(-0.45, 0, -1.0), (0.45, 0, -1.0), (0.45, 0, 1.0), (-0.45, 0, 1.0), (-0.34, 0.22, -0.85), (0.34, 0.22, -0.85), (0.34, 0.2, 0.85), (-0.34, 0.2, 0.85)], 'topsoil'), bx(0, 0.2, 0.0, 0.5, 0.02, 1.2, 'topsoilD')], 0.9, 2.0, 0.24, 'a settled mound over a filled grave, 0.9 by 2 m')
def wheelbarrow(load=False):
    o = [hull([(-0.35, 0.4, -0.5), (0.35, 0.4, -0.5), (0.35, 0.4, 0.5), (-0.35, 0.4, 0.5), (-0.45, 0.7, -0.55), (0.45, 0.7, -0.55), (0.4, 0.7, 0.45), (-0.4, 0.7, 0.45)], 'steel'),
         *[tube([sx*0.3, 0.45, -0.2], [sx*0.35, 0.8, -1.2], 0.05, 'wood') for sx in (-1, 1)], *[tube([sx*0.3, 0.45, 0.4], [sx*0.12, 0.2, 0.9], 0.04, 'steelD') for sx in (-1, 1)],
         loft([[-0.04, 0.2, 0.9, 0.2, 0.2], [0.04, 0.2, 0.9, 0.2, 0.2]], 'tyre', ax='x', n=8), *[bx(sx*0.3, 0.0, -0.3, 0.06, 0.45, 0.06, 'steelD') for sx in (-1, 1)]]
    if load: o += [hull([(-0.33, 0.7, -0.45), (0.33, 0.7, -0.45), (0.33, 0.7, 0.4), (-0.33, 0.7, 0.4), (-0.25, 0.92, -0.3), (0.25, 0.95, -0.3), (0.2, 0.88, 0.3), (-0.22, 0.9, 0.3)], 'topsoil'), bx(0.1, 0.93, 0, 0.2, 0.06, 0.2, 'topsoilD')]
    return o
reg('wheelbarrow', wheelbarrow(), 0.9, 2.1, 0.8, 'a wheelbarrow, wheel at +z, handles at -z: carries soil, rubble or logs by hand (8 blocks of soil per trip); push at walking pace')
reg('wheelbarrow_loaded', wheelbarrow(True), 0.9, 2.1, 0.95, 'a wheelbarrow heaped with soil')
reg('bucket_soil', [loft([[0, 0, 0, 0.14, 0.14], [0, 0.3, 0, 0.18, 0.18]], 'steelL', n=8), loft([[0, 0.3, 0, 0.17, 0.17], [0, 0.32, 0, 0.15, 0.15]], 'topsoil', n=8), tube([-0.18, 0.3, 0], [0.18, 0.3, 0], 0.012, 'steelD')], 0.4, 0.4, 0.33, 'a bucket of soil (two blocks): hand it up from a pit')
# ---------------------------------------------------------------- tools on the ground (loose items)
def shovel_ground(broken=False):
    o = [bx(0, 0.0, 0, 0.03, 0.03, 1.0, 'handle'), bx(0, 0.0, -0.55, 0.14, 0.03, 0.03, 'handle'), hull([(-0.1, 0, 0.45), (0.1, 0, 0.45), (0.035, 0, 0.78), (-0.035, 0, 0.78), (-0.1, 0.012, 0.45), (0.1, 0.012, 0.45), (0.035, 0.012, 0.78), (-0.035, 0.012, 0.78)], 'steelL')]
    return o
reg('shovel_ground', shovel_ground(), 0.2, 1.5, 0.04, 'a shovel lying flat on the ground, blade at +z (the held shovel is in held.js); it is also the loose item')
reg('pickaxe_ground', [bx(0, 0.0, 0, 0.03, 0.03, 0.9, 'handle'), bx(0, 0.0, 0.4, 0.5, 0.04, 0.05, 'steelD'), tip([0.25, 0.02, 0.4], [0.45, 0.02, 0.4], 0.025, 0.02, 'steelD', ax='x'), tip([-0.25, 0.02, 0.4], [-0.45, 0.02, 0.4], 0.025, 0.02, 'steelD', ax='x')], 0.9, 0.9, 0.05, 'a pickaxe lying on the ground: breaks limestone and concrete that a shovel cannot, slowly (also the loose item); a held pickaxe would reuse the shovel pose with the head at the +z end')
reg('hand_trowel', [bx(0, 0, -0.07, 0.03, 0.03, 0.1, 'handle'), hull([(-0.04, 0, 0.0), (0.04, 0, 0.0), (0.01, 0, 0.16), (-0.01, 0, 0.16), (-0.04, 0.01, 0.0), (0.04, 0.01, 0.0), (0.01, 0.01, 0.16), (-0.01, 0.01, 0.16)], 'steelL')], 0.1, 0.3, 0.02, 'a hand trowel: digs one block at a time, slowly, with no noise; good for small things')
# ---------------------------------------------------------------- soil and rock lumps (inventory items, ~0.2 m)
def lump(c, c2, s=0.18): return [hull([(-s/2, 0, -s/2), (s/2, 0, -s/2), (s/2, 0, s/2), (-s/2, 0, s/2), (-s*0.35, s*0.7, -s*0.35), (s*0.4, s*0.8, -s*0.3), (s*0.3, s*0.65, s*0.4), (-s*0.4, s*0.7, s*0.3)], c), bx(s*0.1, s*0.78, 0, s*0.3, s*0.1, s*0.3, c2)]
reg('soil_clod', lump('topsoil', 'topsoilD'), 0.2, 0.2, 0.15, 'a clod of dark topsoil: what the first metre gives; fills sandbags, plant pots and compost')
reg('sod_square', [bx(0, 0, 0, 0.4, 0.1, 0.4, 'topsoil'), bx(0, 0.1, 0, 0.4, 0.03, 0.4, 'sod')], 0.4, 0.4, 0.13, 'a square of turf, 0.4 m: lift it before you dig and relay it after to hide a filled hole')
reg('clay_lump', lump('clay', 'clayD'), 0.2, 0.2, 0.15, 'a lump of red clay from the Plain: sticky; fire it in a kiln for bricks and pots (if the game has one)')
reg('chert_gravel', lump('chert', 'chertD', 0.14) + [bx(0.1, 0, 0.08, 0.06, 0.05, 0.06, 'chertD'), bx(-0.08, 0, -0.07, 0.07, 0.06, 0.05, 'chert')], 0.2, 0.2, 0.12, 'sharp chert fragments: strike one against steel for a spark; scatter it to make a noisy path')
reg('limestone_chunk', lump('limestone', 'limestoneD', 0.22), 0.25, 0.25, 0.2, 'a chunk of limestone from the bedrock: building stone, and lime for mortar')
reg('rock_throw', lump('limestone', 'limestoneD', 0.12), 0.15, 0.15, 0.1, 'a hand-sized rock for throwing (the throwable stone of the items list)')
# ---------------------------------------------------------------- the soil under Springfield (colours for the walls of a hole; depths from the ground)
SOIL = [
 {'name': 'topsoil', 'from': 0.0, 'to': 0.5, 'colour': '#5a4030', 'look': 'dark brown silt loam with roots and a few chert pebbles; the first block is turf', 'hardness': 1, 'tool': 'hands or any shovel', 'sound': 'dig_soil', 'yields': ['soil_clod', 'sod_square (top block)'], 'seconds': 1.0},
 {'name': 'subsoil', 'from': 0.5, 'to': 1.5, 'colour': '#7a5a3e', 'look': 'brown to tan clay loam, firmer and stickier, a little more chert', 'hardness': 2, 'tool': 'shovel', 'sound': 'dig_soil', 'yields': ['soil_clod', 'clay_lump (one in four)'], 'seconds': 1.6},
 {'name': 'cherty clay', 'from': 1.5, 'to': 3.0, 'colour': '#9a5a3a', 'look': 'deep red-orange clay packed with pale grey-white chert gravel (more than half stones); this is the red clay of the Plain', 'hardness': 3, 'tool': 'shovel (slow) or pick', 'sound': 'dig_gravel', 'yields': ['clay_lump', 'chert_gravel'], 'seconds': 2.6},
 {'name': 'gravelly clay', 'from': 3.0, 'to': 4.5, 'colour': '#b87a46', 'look': 'yellow-orange clay full of broken dolomite and chert, often wet', 'hardness': 4, 'tool': 'pick or machine', 'sound': 'dig_gravel', 'yields': ['clay_lump', 'chert_gravel', 'limestone_chunk'], 'seconds': 3.6},
 {'name': 'limestone', 'from': 4.5, 'to': 99, 'colour': '#aaa698', 'look': 'grey limestone and dolomite in beds with bands of pale chert; solid rock, cracks where water runs (the Plain is karst: caves and sinkholes)', 'hardness': 6, 'tool': 'pickaxe (very slow), jackhammer, ripper tooth or excavator', 'sound': 'dig_stone', 'yields': ['limestone_chunk', 'chert_gravel'], 'seconds': 8.0}]
SOIL_NOTE = ('Based on the USDA Pomme series, a typical soil of the Springfield Plain in Polk County: brown silt loam 0 to 18 cm, brown clay loam to 48 cm, red very gravelly silty clay loam (about 55 percent chert) to 145 cm, '
             'then yellowish-red extremely gravelly clay with dolomite to over 2 m. Depth to bedrock varies a great deal in karst country: near a creek or ridge it can be under a metre, on a deep plain more than 4 m. '
             'The game can use the depths above as a default and shift the limestone up wherever the map has a bluff, a cave or a quarry.')
pack = {'name': 'digging', 'version': 1, 'style': 'boxes, hulls and tips; flat colours', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base (ladders: the foot)', 'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True,
        'models': {'digging': M}, 'info': INFO, 'soil': SOIL, 'soilNote': SOIL_NOTE,
        'rule': ('Pits: a hole needs a way out: give any hole deeper than 1 m a ladder (ladder_s up to 2 m, ladder_m to 3 m, ladder_l above) or let the player pile soil as steps; without one, jumping out works only up to 1 m. '
                 'Cover a hole with plank_cover_* to hide it (a person walking over falls in and takes fall damage by depth; the cover breaks if something heavy crosses it: swap to the _broken model); put stake_pit_* on its floor to make a trap. '
                 'A hole deeper than 1.8 m with soil walls can collapse in rain or beside a heavy vehicle unless shoring_panel stands in it. edge_marker at each side warns. '
                 'Hand digging: the shovel takes seconds per block by layer (soil[].seconds), a trowel one block slowly and silently; the pickaxe breaks hard layers. '
                 'Spoil: every block dug is an item (soil_clod, clay_lump, chert_gravel, limestone_chunk by layer) or goes to a heap: machines.js spoil_heap_s/m/l by size. '
                 'Fill: shovelling soil back (fill_soil sound) raises the ground; a filled grave is 0.8 by 2 m, finish with grave_mound and grave_cross. Machines: see machines.js dig, machinedig.js.')}
out, st = write_pack('digging', pack, __file__)
t = [v[0] for v in st.values()]; print(len(t), 'models', min(t), '-', max(t)); print({k.split('.')[1]: v[0] for k, v in st.items() if v[0] > 250})
