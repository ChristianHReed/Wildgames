#!/usr/bin/env python3
"""Afterstreet props pack, version 1 (18 October 2026): items and loot, furniture, street props, plants and vehicles.
Writes assets/shaped/props.js. Run: python3 assets/shaped/src/props.py

Same language as the survivors and buildings: rectangular frustums and boxes, flat colour planes, few corners, points
instead of caps. Every model sits on the ground at its origin (pivot = centre of its base), faces +Z, metres.
Moving parts (doors, lids, wheels) are separate entries in 'moving' with their hinge or axle so the game can turn them.
Vehicles are boxy 1970s to 1990s shapes, worn: rust patches, a cracked windscreen, mismatched panels.
Pieces marked glow:true are lamps and lit screens."""
import math
from kit import *

PALETTE = {
  # materials
  'wood': '#8a6a46', 'woodD': '#6a5034', 'woodL': '#b08c62', 'metal': '#8f969e', 'metalD': '#5b6168', 'steel': '#4a4d52', 'rust': '#8c4a2e',
  'plastic': '#c9c3b6', 'red': '#9a3a30', 'redD': '#7a2a24', 'green': '#4c6a44', 'blue': '#3e5a7a', 'yellow': '#c9a23a', 'orange': '#c46a2a',
  'white': '#e2ddd2', 'black': '#1f2024', 'cloth': '#5a6a7a', 'clothD': '#46525e', 'fabric': '#8a5a4a', 'fabricD': '#6a4438',
  'mattress': '#d6cfc0', 'sheet': '#7a8aa0', 'glass': '#3c4a52', 'glassL': '#9bb3ba', 'screen': '#1a1e22', 'tile': '#cfd4d2',
  'concrete': '#9a948a', 'asphalt': '#3a3a3c', 'paper': '#e8e0c8', 'label': '#c94a3a', 'cardboard': '#a8865a',
  'bark': '#5a4636', 'leaf': '#5a7a3e', 'leafD': '#47632f', 'leafL': '#6e8c48', 'pine': '#2f4a36', 'pineD': '#243a2a', 'dry': '#8a7a5a', 'rock': '#7d7a72', 'rockD': '#66635c',
  'soil': '#4a3a2c', 'soilD': '#3a2d22', 'tomato': '#c4442e', 'blueD': '#2e4660',
  'lamp': '#ffd28a', 'lit': '#ffe6b0', 'tyre': '#232325', 'hub': '#9a9a96', 'chrome': '#c8c8c2', 'paint1': '#6a7f8c', 'paint2': '#a8843c', 'paint3': '#7a3a32',
  'tail': '#a8322a', 'head': '#f2ead2', 'seat': '#3a3430', 'cone': '#d0602a', 'stripe': '#e8e0d0', 'sign': '#b8322a', 'signW': '#e8e0d0', 'post': '#6a6e72'
}
G = dict(glow=True)
M = {}; MOVING = {}
def model(cat, name, pieces, moving=None):
    M.setdefault(cat, {})[name] = pieces
    if moving: MOVING.setdefault(cat, {})[name] = moving
def b(x, y, z, w, h, d, c, **k): return box([x, y + h/2, z], [w, h, d], c, **k)   # a box standing on y

# ================= items and loot (in-hand size) =================
model('items', 'can', [loft([[0, 0, 0, 0.033, 0.033], [0, 0.11, 0, 0.033, 0.033]], 'metal', n=6), loft([[0, 0.025, 0, 0.034, 0.034], [0, 0.085, 0, 0.034, 0.034]], 'label', n=6, caps=[False, False])])
model('items', 'bottle', [loft([[0, 0, 0, 0.035, 0.035], [0, 0.18, 0, 0.035, 0.035], [0, 0.23, 0, 0.012, 0.012], [0, 0.27, 0, 0.012, 0.012]], 'glassL', n=6), b(0, 0.27, 0, 0.026, 0.02, 0.026, 'blue')])
model('items', 'water_jug', [b(0, 0, 0, 0.2, 0.26, 0.14, 'glassL'), b(0, 0.26, 0, 0.05, 0.04, 0.05, 'blue'), b(0.06, 0.2, 0, 0.03, 0.08, 0.12, 'glassL')])
model('items', 'medkit', [b(0, 0, 0, 0.3, 0.12, 0.2, 'white'), b(0, 0.12, 0, 0.1, 0.02, 0.03, 'black'),
                          flat([(-0.02, 0.03, 0.101), (0.02, 0.03, 0.101), (0.02, 0.09, 0.101), (-0.02, 0.09, 0.101)], 'red'), flat([(-0.05, 0.04, 0.101), (0.05, 0.04, 0.101), (0.05, 0.08, 0.101), (-0.05, 0.08, 0.101)], 'red')])
model('items', 'bandage', [loft([[0, 0.04, -0.04, 0.04, 0.04], [0, 0.04, 0.04, 0.04, 0.04]], 'white', ax='z', n=6)])
model('items', 'pills', [loft([[0, 0, 0, 0.025, 0.025], [0, 0.08, 0, 0.025, 0.025]], 'orange', n=6), b(0, 0.08, 0, 0.056, 0.025, 0.056, 'white')])
model('items', 'canned_food', [loft([[0, 0, 0, 0.045, 0.045], [0, 0.1, 0, 0.045, 0.045]], 'metal', n=6), loft([[0, 0.02, 0, 0.046, 0.046], [0, 0.08, 0, 0.046, 0.046]], 'green', n=6, caps=[False, False])])
model('items', 'fuel_can', [b(0, 0, 0, 0.18, 0.3, 0.1, 'red'), b(0, 0.3, -0.02, 0.1, 0.03, 0.03, 'redD'), tip([0.05, 0.3, 0.02], [0.09, 0.38, 0.03], 0.016, 0.016, 'black')])
model('items', 'car_battery', [b(0, 0, 0, 0.26, 0.18, 0.17, 'black'), b(0, 0.18, 0, 0.26, 0.02, 0.17, 'red'), b(0.08, 0.2, 0, 0.03, 0.02, 0.03, 'metal'), b(-0.08, 0.2, 0, 0.03, 0.02, 0.03, 'metal')])
model('items', 'toolkit', [b(0, 0, 0, 0.42, 0.16, 0.18, 'red'), b(0, 0.16, 0, 0.42, 0.03, 0.18, 'redD'), b(0, 0.19, 0, 0.18, 0.04, 0.03, 'black')])
model('items', 'flashlight', [loft([[0, 0.03, -0.1, 0.022, 0.022], [0, 0.03, 0.06, 0.022, 0.022], [0, 0.03, 0.1, 0.032, 0.032]], 'black', ax='z', n=6), flat([(-0.02, 0.012, 0.101), (0.02, 0.012, 0.101), (0.02, 0.048, 0.101), (-0.02, 0.048, 0.101)], 'lamp', **G)])
model('items', 'radio', [b(0, 0, 0, 0.24, 0.15, 0.08, 'black'), flat([(-0.1, 0.03, 0.041), (0.0, 0.03, 0.041), (0.0, 0.12, 0.041), (-0.1, 0.12, 0.041)], 'metalD'), b(0.08, 0.15, 0, 0.01, 0.2, 0.01, 'metal')])
model('items', 'crowbar', [b(0, 0.01, 0, 0.02, 0.02, 0.7, 'steel'), b(0, 0.01, 0.37, 0.02, 0.06, 0.04, 'steel')])
model('items', 'baseball_bat', [loft([[0, 0.03, -0.42, 0.014, 0.014], [0, 0.03, 0.0, 0.022, 0.022], [0, 0.03, 0.42, 0.034, 0.034]], 'woodL', ax='z', n=6)])
model('items', 'axe', [b(0, 0.015, 0, 0.03, 0.03, 0.7, 'wood'), hull([(-0.012, 0.0, 0.3), (0.012, 0.0, 0.3), (0.012, 0.0, 0.38), (-0.012, 0.0, 0.38), (-0.006, 0.16, 0.26), (0.006, 0.16, 0.26), (0.006, 0.16, 0.42), (-0.006, 0.16, 0.42)], 'metal')])
model('items', 'duct_tape', [loft([[0, 0.0, 0, 0.05, 0.05], [0, 0.05, 0, 0.05, 0.05]], 'metalD', n=6)])
model('items', 'rope', [loft([[0, 0.0, 0, 0.1, 0.1], [0, 0.06, 0, 0.1, 0.1]], 'dry', n=6)])
model('items', 'scrap', [hull([(-0.12, 0, -0.1), (0.15, 0, -0.06), (0.12, 0, 0.1), (-0.1, 0, 0.08), (-0.08, 0.04, -0.06), (0.1, 0.06, -0.03), (0.08, 0.05, 0.06), (-0.06, 0.03, 0.05)], 'rust')])
model('items', 'planks', [b(0, 0.02*i, 0, 0.16, 0.02, 0.9, 'woodL' if i % 2 else 'wood') for i in range(3)])
model('items', 'spare_tyre', [loft([[0, 0.3, -0.1, 0.3, 0.3], [0, 0.3, 0.1, 0.3, 0.3]], 'tyre', ax='z', n=8), loft([[0, 0.3, -0.105, 0.16, 0.16], [0, 0.3, 0.105, 0.16, 0.16]], 'hub', ax='z', n=8)])
model('items', 'engine_parts', [b(0, 0, 0, 0.3, 0.18, 0.22, 'metalD'), b(0, 0.18, 0, 0.12, 0.08, 0.1, 'steel'), loft([[0.15, 0.1, 0, 0.04, 0.04], [0.28, 0.1, 0, 0.04, 0.04]], 'rust', ax='x', n=6)])
model('items', 'generator', [b(0, 0, 0, 0.6, 0.06, 0.45, 'black'), b(0, 0.06, 0, 0.5, 0.36, 0.4, 'yellow'), b(0, 0.42, 0, 0.36, 0.06, 0.3, 'metalD'), b(-0.33, 0.06, 0, 0.04, 0.4, 0.04, 'black'), b(0.33, 0.06, 0, 0.04, 0.4, 0.04, 'black')])
model('items', 'backpack', [b(0, 0, 0, 0.32, 0.46, 0.18, 'cloth'), b(0, 0.32, 0.01, 0.33, 0.16, 0.19, 'clothD'), b(0, 0.06, 0.1, 0.22, 0.18, 0.04, 'clothD')])
model('items', 'cardboard_box', [b(0, 0, 0, 0.4, 0.3, 0.3, 'cardboard'), flat([(-0.2, 0.301, -0.01), (0.2, 0.301, -0.01), (0.2, 0.301, 0.01), (-0.2, 0.301, 0.01)], 'plastic', (0, 1, 0))])

# ================= furniture =================
def legs4(w, d, h, t, c, inset=0.04): return [b(sx*(w/2 - inset), 0, sz*(d/2 - inset), t, h, t, c) for sx in (1, -1) for sz in (1, -1)]
model('furniture', 'chair', legs4(0.42, 0.42, 0.45, 0.04, 'wood') + [b(0, 0.45, 0, 0.44, 0.05, 0.44, 'woodL'), b(0, 0.5, -0.2, 0.44, 0.45, 0.04, 'wood')])
model('furniture', 'table', legs4(1.2, 0.8, 0.72, 0.06, 'woodD') + [b(0, 0.72, 0, 1.24, 0.05, 0.84, 'wood')])
model('furniture', 'sofa', [b(0, 0.08, 0, 1.9, 0.34, 0.85, 'fabric'), b(0, 0.42, -0.3, 1.9, 0.48, 0.25, 'fabricD'), b(0.85, 0.42, 0.05, 0.2, 0.22, 0.75, 'fabricD'), b(-0.85, 0.42, 0.05, 0.2, 0.22, 0.75, 'fabricD'),
                            b(-0.43, 0.42, 0.08, 0.84, 0.1, 0.62, 'fabric'), b(0.43, 0.42, 0.08, 0.84, 0.1, 0.62, 'fabric')] + legs4(1.8, 0.75, 0.08, 0.06, 'woodD'))
model('furniture', 'bed', [b(0, 0, 0, 1.5, 0.3, 2.05, 'wood'), b(0, 0.3, 0.02, 1.4, 0.2, 1.95, 'mattress'), b(0, 0.5, 0.25, 1.42, 0.06, 1.5, 'sheet'), b(0, 0.5, -0.72, 1.0, 0.1, 0.4, 'white'), b(0, 0, -1.02, 1.5, 1.0, 0.08, 'woodD')])
model('furniture', 'wardrobe', [b(0, 0, 0, 1.0, 2.0, 0.6, 'wood'), flat([(-0.005, 0.1, 0.301), (0.005, 0.1, 0.301), (0.005, 1.9, 0.301), (-0.005, 1.9, 0.301)], 'woodD'), b(0.06, 1.0, 0.31, 0.03, 0.12, 0.03, 'metal'), b(-0.06, 1.0, 0.31, 0.03, 0.12, 0.03, 'metal')],
      moving=[{'piece': 'door_l', 'hinge': [-0.5, 0, 0.3], 'axis': 'y'}, {'piece': 'door_r', 'hinge': [0.5, 0, 0.3], 'axis': 'y'}])
model('furniture', 'fridge', [b(0, 0, 0, 0.7, 1.75, 0.68, 'white'), flat([(-0.35, 1.2, 0.341), (0.35, 1.2, 0.341), (0.35, 1.215, 0.341), (-0.35, 1.215, 0.341)], 'metalD'), b(0.28, 1.3, 0.35, 0.03, 0.3, 0.03, 'metal'), b(0.28, 0.6, 0.35, 0.03, 0.4, 0.03, 'metal')],
      moving=[{'piece': 'door', 'hinge': [-0.35, 0, 0.34], 'axis': 'y'}])
model('furniture', 'stove', [b(0, 0, 0, 0.6, 0.9, 0.6, 'white'), b(0, 0.9, 0, 0.6, 0.02, 0.6, 'black'), *[b(x, 0.92, z, 0.18, 0.01, 0.18, 'metalD') for x in (-0.14, 0.14) for z in (-0.14, 0.14)],
                             flat([(-0.24, 0.15, 0.301), (0.24, 0.15, 0.301), (0.24, 0.6, 0.301), (-0.24, 0.6, 0.301)], 'screen'), b(0, 0.9, -0.28, 0.6, 0.12, 0.04, 'white')])
model('furniture', 'kitchen_counter', [b(0, 0, 0, 1.2, 0.86, 0.6, 'woodL'), b(0, 0.86, 0, 1.22, 0.04, 0.62, 'concrete'), flat([(-0.002, 0.08, 0.301), (0.002, 0.08, 0.301), (0.002, 0.8, 0.301), (-0.002, 0.8, 0.301)], 'woodD'),
                                        b(0.3, 0.9, -0.05, 0.4, 0.02, 0.35, 'metal')])
model('furniture', 'bookshelf', [b(0, 0, 0, 0.9, 1.9, 0.32, 'woodD')] + [b(0, y, 0.02, 0.84, 0.3, 0.26, ['red', 'blue', 'green', 'yellow', 'paper'][i]) for i, y in enumerate((0.12, 0.48, 0.84, 1.2, 1.56))])
model('furniture', 'desk', legs4(1.3, 0.65, 0.72, 0.05, 'metalD') + [b(0, 0.72, 0, 1.34, 0.04, 0.68, 'woodL'), b(0.4, 0.4, 0, 0.42, 0.32, 0.6, 'woodL')])
model('furniture', 'tv', [b(0, 0, 0, 0.9, 0.5, 0.42, 'woodD'), b(0, 0.5, 0, 0.7, 0.48, 0.12, 'black'), flat([(-0.32, 0.53, 0.061), (0.32, 0.53, 0.061), (0.32, 0.95, 0.061), (-0.32, 0.95, 0.061)], 'screen')])
model('furniture', 'floor_lamp', [b(0, 0, 0, 0.3, 0.03, 0.3, 'black'), b(0, 0.03, 0, 0.03, 1.4, 0.03, 'black'), frustum([[0, 1.35, 0, 0.2, 0.2], [0, 1.6, 0, 0.12, 0.12]], 'paper', caps=[False, True]),
                                  frustum([[0, 1.351, 0, 0.19, 0.19], [0, 1.36, 0, 0.19, 0.19]], 'lit', caps=[True, False], **G)])
model('furniture', 'toilet', [b(0, 0, 0.05, 0.38, 0.4, 0.5, 'white'), b(0, 0.4, 0.05, 0.4, 0.04, 0.52, 'white'), b(0, 0.4, -0.25, 0.42, 0.42, 0.18, 'white')])
model('furniture', 'bathtub', [b(0, 0, 0, 0.75, 0.55, 1.7, 'white'), b(0, 0.5, 0, 0.6, 0.06, 1.55, 'tile')])
model('furniture', 'crate', [b(0, 0, 0, 0.6, 0.5, 0.6, 'wood'), *[flat([(-0.3, y, 0.301), (0.3, y, 0.301), (0.3, y + 0.04, 0.301), (-0.3, y + 0.04, 0.301)], 'woodD') for y in (0.08, 0.38)]])
model('furniture', 'locker', [b(0, 0, 0, 0.5, 1.9, 0.5, 'blue'), *[flat([(-0.15, y, 0.251), (0.15, y, 0.251), (0.15, y + 0.015, 0.251), (-0.15, y + 0.015, 0.251)], 'black') for y in (1.6, 1.64, 1.68)], b(0.18, 1.0, 0.255, 0.03, 0.1, 0.02, 'metal')],
      moving=[{'piece': 'door', 'hinge': [-0.25, 0, 0.25], 'axis': 'y'}])
model('furniture', 'pew', [b(0, 0, 0, 2.4, 0.45, 0.5, 'wood'), b(0, 0.45, -0.22, 2.4, 0.5, 0.06, 'woodD'), b(1.18, 0, 0, 0.06, 0.9, 0.55, 'woodD'), b(-1.18, 0, 0, 0.06, 0.9, 0.55, 'woodD')])
model('furniture', 'shop_shelf', [b(0, 0, 0, 1.2, 0.12, 0.5, 'metalD'), b(0, 0, -0.22, 1.2, 1.6, 0.04, 'metal')] + [b(0, y, 0, 1.2, 0.03, 0.5, 'metal') for y in (0.55, 1.0, 1.45)]
      + [b(x, y + 0.03, 0.05, 0.12, 0.18, 0.2, c) for y in (0.12, 0.55, 1.0) for x, c in ((-0.4, 'label'), (-0.2, 'yellow'), (0.05, 'green'), (0.3, 'blue'))])

# ================= street props =================
model('street', 'street_lamp', [b(0, 0, 0, 0.3, 0.3, 0.3, 'concrete'), b(0, 0.3, 0, 0.12, 4.6, 0.12, 'post'), b(0, 4.84, 0.45, 0.08, 0.08, 1.0, 'post'),
                                frustum([[0, 4.72, 0.9, 0.12, 0.18], [0, 4.82, 0.9, 0.1, 0.14]], 'post'), b(0, 4.69, 0.9, 0.2, 0.03, 0.3, 'lamp', **G)])
model('street', 'traffic_light', [b(0, 0, 0, 0.14, 3.0, 0.14, 'post'), b(0, 2.2, 0.1, 0.32, 0.9, 0.22, 'black'), *[flat([(-0.08, y - 0.08, 0.212), (0.08, y - 0.08, 0.212), (0.08, y + 0.08, 0.212), (-0.08, y + 0.08, 0.212)], c, **G) for y, c in ((2.95, 'red'), (2.65, 'yellow'), (2.35, 'green'))]])
model('street', 'hydrant', [frustum([[0, 0, 0, 0.12, 0.12], [0, 0.06, 0, 0.12, 0.12]], 'redD'), frustum([[0, 0.06, 0, 0.09, 0.09], [0, 0.55, 0, 0.08, 0.08]], 'red'), tip([0, 0.55, 0], [0, 0.7, 0], 0.11, 0.11, 'red'),
                            loft([[0.08, 0.4, 0, 0.04, 0.04], [0.15, 0.4, 0, 0.04, 0.04]], 'redD', ax='x', n=6), loft([[-0.08, 0.4, 0, 0.04, 0.04], [-0.15, 0.4, 0, 0.04, 0.04]], 'redD', ax='x', n=6)])
model('street', 'trash_bin', [frustum([[0, 0, 0, 0.2, 0.2], [0, 0.85, 0, 0.24, 0.24]], 'green'), frustum([[0, 0.85, 0, 0.25, 0.25], [0, 0.95, 0, 0.2, 0.2]], 'leafD')])
model('street', 'dumpster', [frustum([[0, 0.12, 0, 0.9, 0.55], [0, 1.2, 0, 0.95, 0.65]], 'green'), *[b(sx*0.75, 0, sz*0.45, 0.12, 0.12, 0.12, 'black') for sx in (1, -1) for sz in (1, -1)],
                              hull([(-0.97, 1.2, -0.67), (0.97, 1.2, -0.67), (0.97, 1.2, 0.67), (-0.97, 1.2, 0.67), (-0.97, 1.32, -0.67), (0.97, 1.32, -0.67), (0.97, 1.22, 0.67), (-0.97, 1.22, 0.67)], 'leafD'),
                              flat([(-0.6, 0.5, 0.6), (0.2, 0.55, 0.61), (0.15, 0.85, 0.63), (-0.55, 0.8, 0.62)], 'rust')],
      moving=[{'piece': 'lid', 'hinge': [0, 1.32, -0.67], 'axis': 'x'}])
model('street', 'bench', [b(0, 0.42, 0, 1.8, 0.05, 0.42, 'wood'), b(0, 0.55, -0.2, 1.8, 0.35, 0.05, 'wood'), *[b(sx*0.78, 0, 0, 0.06, 0.45, 0.42, 'steel') for sx in (1, -1)], *[b(sx*0.78, 0.45, -0.2, 0.06, 0.45, 0.05, 'steel') for sx in (1, -1)]])
model('street', 'bus_stop', [b(0, 0, 0, 2.6, 0.08, 1.2, 'concrete'), *[b(sx*1.2, 0.08, -0.5, 0.08, 2.3, 0.08, 'post') for sx in (1, -1)], b(0, 0.08, -0.5, 2.3, 1.9, 0.03, 'glassL'),
                             hull([(-1.4, 2.38, -0.6), (1.4, 2.38, -0.6), (1.4, 2.3, 0.6), (-1.4, 2.3, 0.6), (-1.4, 2.46, -0.6), (1.4, 2.46, -0.6), (1.4, 2.38, 0.6), (-1.4, 2.38, 0.6)], 'post'),
                             b(0, 0.45, -0.3, 2.0, 0.05, 0.35, 'wood'), b(-1.25, 0.08, 0.5, 0.08, 2.6, 0.08, 'post'), b(-1.25, 2.3, 0.5, 0.5, 0.5, 0.04, 'blue')])
model('street', 'mailbox', [b(0, 0, 0, 0.06, 1.0, 0.06, 'post'), b(0, 1.0, 0, 0.22, 0.24, 0.5, 'blue'), tip([0, 1.24, 0], [0, 1.3, 0], 0.15, 0.36, 'blue')])
model('street', 'jersey_barrier', [hull([(-1.5, 0, -0.3), (1.5, 0, -0.3), (1.5, 0, 0.3), (-1.5, 0, 0.3), (-1.5, 0.8, -0.1), (1.5, 0.8, -0.1), (1.5, 0.8, 0.1), (-1.5, 0.8, 0.1)], 'concrete'),
                                   flat([(-1.5, 0.5, 0.18), (1.5, 0.5, 0.18), (1.5, 0.62, 0.15), (-1.5, 0.62, 0.15)], 'stripe')])
model('street', 'traffic_cone', [b(0, 0, 0, 0.36, 0.04, 0.36, 'black'), tip([0, 0.04, 0], [0, 0.7, 0], 0.14, 0.14, 'cone'), frustum([[0, 0.3, 0, 0.085, 0.085], [0, 0.4, 0, 0.07, 0.07]], 'stripe', caps=[False, False])])
model('street', 'tyre_pile', [loft([[0, 0.12 + 0.24*i, 0, 0.36, 0.36], [0, 0.12 + 0.24*i + 0.2, 0, 0.36, 0.36]], 'tyre', n=8) for i in range(3)] + [loft([[0.5, 0.36, 0.2, 0.36, 0.36], [0.5, 0.36, 0.4, 0.36, 0.36]], 'tyre', ax='z', n=8)])
model('street', 'stop_sign', [b(0, 0, 0, 0.06, 2.1, 0.06, 'post'), loft([[0, 2.35, 0.04, 0.32, 0.32], [0, 2.35, 0.06, 0.32, 0.32]], 'sign', ax='z', n=8), flat([(-0.18, 2.31, 0.061), (0.18, 2.31, 0.061), (0.18, 2.39, 0.061), (-0.18, 2.39, 0.061)], 'signW')])
model('street', 'picket_fence', [b(0, 0.25, 0, 2.4, 0.08, 0.03, 'white'), b(0, 0.75, 0, 2.4, 0.08, 0.03, 'white')] + [tip([x, 0.0, 0.03], [x, 1.05, 0.03], 0.05, 0.015, 'white') for x in [i*0.2 - 1.1 for i in range(12)]])
model('street', 'chainlink_fence', [b(x, 0, 0, 0.06, 1.9, 0.06, 'metal') for x in (-1.2, 1.2)] + [b(0, 1.86, 0, 2.4, 0.04, 0.04, 'metal'), b(0, 0.0, 0, 2.4, 1.86, 0.01, 'metalD')])
model('street', 'sandbags', [hull([(x - 0.28, y, -0.18), (x + 0.28, y, -0.18), (x + 0.28, y, 0.18), (x - 0.28, y, 0.18), (x - 0.24, y + 0.15, -0.14), (x + 0.24, y + 0.15, -0.14), (x + 0.24, y + 0.15, 0.14), (x - 0.24, y + 0.15, 0.14)], 'dry')
                              for x, y in ((-0.6, 0), (0, 0), (0.6, 0), (-0.3, 0.15), (0.3, 0.15), (0, 0.3))])
model('street', 'power_pole', [b(0, 0, 0, 0.26, 8.5, 0.26, 'woodD'), b(0, 7.8, 0, 2.2, 0.14, 0.14, 'woodD'), *[b(x, 7.94, 0, 0.06, 0.12, 0.06, 'white') for x in (-0.9, -0.3, 0.3, 0.9)],
                               loft([[0.3, 6.8, 0.2, 0.18, 0.18], [0.3, 7.4, 0.2, 0.18, 0.18]], 'metalD', n=6)])
model('street', 'newspaper_box', [b(0, 0, 0, 0.45, 1.0, 0.4, 'blue'), flat([(-0.18, 0.55, 0.201), (0.18, 0.55, 0.201), (0.18, 0.9, 0.201), (-0.18, 0.9, 0.201)], 'glassL')])

# ================= plants and rocks =================
def oak(h=6.0, r=2.2):
    trunk = [frustum([[0, 0, 0, 0.18, 0.18], [0, h*0.5, 0, 0.12, 0.12]], 'bark'), frustum([[0, h*0.45, 0, 0.1, 0.1], [0.7, h*0.65, 0.2, 0.05, 0.05]], 'bark')]
    crown = []
    for i, (x, y, z, s, c) in enumerate(((0, h*0.72, 0, 1.0, 'leaf'), (0.9, h*0.62, 0.3, 0.7, 'leafD'), (-0.8, h*0.66, -0.2, 0.75, 'leafL'), (0.2, h*0.88, -0.5, 0.6, 'leaf'), (-0.3, h*0.6, 0.8, 0.6, 'leafD'))):
        rr = r*0.5*s
        crown.append(loft([[x, y - rr*0.8, z, rr*0.55, rr*0.55], [x, y, z, rr, rr], [x, y + rr*0.7, z, rr*0.6, rr*0.6], [x, y + rr, z, 0, 0]], c, n=5, rot=18*i, caps=[True, False]))
    return trunk + crown
def pine(h=8.0):
    o = [frustum([[0, 0, 0, 0.14, 0.14], [0, h*0.3, 0, 0.1, 0.1]], 'bark')]
    for i, (y0, r) in enumerate(((0.18, 1.6), (0.4, 1.25), (0.6, 0.9), (0.78, 0.55))):
        o.append(loft([[0, h*y0, 0, r, r], [0, h*y0 + h*0.3, 0, 0, 0]], 'pine' if i % 2 == 0 else 'pineD', n=6, rot=30*i, caps=[True, False]))
    return o
model('plants', 'oak', oak())
model('plants', 'pine', pine())
model('plants', 'bush', [loft([[x, 0, z, s, s], [x, s*0.9, z, s*1.1, s*1.1], [x, s*1.6, z, 0, 0]], c, n=5, rot=20*i, caps=[True, False]) for i, (x, z, s, c) in enumerate(((0, 0, 0.55, 'leaf'), (0.45, 0.2, 0.4, 'leafD'), (-0.4, -0.1, 0.42, 'leafL')))])
model('plants', 'dead_tree', [frustum([[0, 0, 0, 0.15, 0.15], [0, 3.5, 0, 0.06, 0.06]], 'bark')] + [tip([0, y, 0], [dx, y + 1.0, dz], 0.05, 0.05, 'bark') for y, dx, dz in ((1.6, 0.9, 0.2), (2.2, -0.8, 0.4), (2.8, 0.3, -0.8), (3.2, -0.4, -0.3))])
model('plants', 'grass_tuft', [tip([x, 0, z], [x + dx, 0.35, z + dz], 0.03, 0.01, c) for x, z, dx, dz, c in ((0, 0, 0.05, 0.02, 'leafL'), (0.08, 0.05, 0.12, 0.08, 'leaf'), (-0.07, 0.04, -0.12, 0.05, 'leafL'), (0.02, -0.07, 0.03, -0.12, 'leafD'), (-0.04, -0.03, -0.06, -0.1, 'dry'))])
model('plants', 'rock', [hull([(-0.6, 0, -0.4), (0.5, 0, -0.5), (0.7, 0, 0.3), (-0.4, 0, 0.5), (-0.4, 0.45, -0.2), (0.3, 0.55, -0.3), (0.45, 0.35, 0.2), (-0.2, 0.5, 0.3)], 'rock'),
                         hull([(0.5, 0, 0.3), (0.95, 0, 0.35), (0.9, 0, 0.75), (0.45, 0, 0.7), (0.55, 0.22, 0.4), (0.85, 0.2, 0.45), (0.8, 0.25, 0.65), (0.55, 0.2, 0.62)], 'rockD')])

# ================= vehicles: boxy, worn =================
def wheels(xs, zs, r=0.32, w=0.2, c='tyre'):
    o = []
    for x in xs:
        for z in zs:
            o += [loft([[x - w/2, r, z, r, r], [x + w/2, r, z, r, r]], c, ax='x', n=8), loft([[x - w/2 - 0.005, r, z, r*0.5, r*0.5], [x + w/2 + 0.005, r, z, r*0.5, r*0.5]], 'hub', ax='x', n=6)]
    return o
def car(body='paint1', length=4.2, width=1.7, cab_back=-1.1, cab_front=0.7, hood=0.95, roof=1.42, rusty=True, panel=None):
    L, W = length/2, width/2
    o = [hull([(-W, 0.3, -L), (W, 0.3, -L), (W, 0.3, L), (-W, 0.3, L), (-W, hood - 0.05, -L + 0.05), (W, hood - 0.05, -L + 0.05), (W, hood - 0.1, L), (-W, hood - 0.1, L)], body),
         hull([(-W + 0.06, hood - 0.06, cab_back), (W - 0.06, hood - 0.06, cab_back), (W - 0.06, hood - 0.06, cab_front), (-W + 0.06, hood - 0.06, cab_front),
               (-W + 0.14, roof, cab_back + 0.15), (W - 0.14, roof, cab_back + 0.15), (W - 0.14, roof, cab_front - 0.35), (-W + 0.14, roof, cab_front - 0.35)], 'glass'),
         box([0, roof + 0.03, (cab_back + cab_front - 0.2)/2], [width - 0.26, 0.06, cab_front - cab_back - 0.52], body),
         *[box([sx*(W - 0.1), (hood + roof)/2, z], [0.08, roof - hood + 0.06, 0.08], body) for sx in (1, -1) for z in (cab_back + 0.16, cab_front - 0.36)],
         box([0, 0.42, L + 0.03], [width + 0.04, 0.12, 0.08], 'chrome'), box([0, 0.42, -L - 0.03], [width + 0.04, 0.12, 0.08], 'chrome'),
         *[flat([(sx*0.7 - 0.15, 0.6, L + 0.002), (sx*0.7 + 0.15, 0.6, L + 0.002), (sx*0.7 + 0.15, 0.7, L + 0.002), (sx*0.7 - 0.15, 0.7, L + 0.002)], 'head') for sx in (1, -1)],
         *[flat([(sx*0.7 - 0.12, 0.62, -L - 0.002), (sx*0.7 + 0.12, 0.62, -L - 0.002), (sx*0.7 + 0.12, 0.72, -L - 0.002), (sx*0.7 - 0.12, 0.72, -L - 0.002)], 'tail', (0, 0, -1)) for sx in (1, -1)],
         flat([(-W - 0.002, 0.45, cab_back + 0.2), (-W - 0.002, 0.45, cab_front - 0.2), (-W - 0.002, hood - 0.12, cab_front - 0.2), (-W - 0.002, hood - 0.12, cab_back + 0.2)], 'black', (-1, 0, 0))]
    if rusty: o += [flat([(W + 0.002, 0.38, L - 0.9), (W + 0.002, 0.38, L - 0.4), (W + 0.002, 0.55, L - 0.5), (W + 0.002, 0.6, L - 0.85)], 'rust', (1, 0, 0)),
                    flat([(-0.3, roof + 0.062, -0.2), (0.1, roof + 0.062, -0.35), (0.25, roof + 0.062, 0.0), (-0.2, roof + 0.062, 0.05)], 'rust', (0, 1, 0))]
    if panel: o.append(flat([(W + 0.003, 0.36, cab_back + 0.1), (W + 0.003, 0.36, cab_front - 0.3), (W + 0.003, hood - 0.08, cab_front - 0.3), (W + 0.003, hood - 0.08, cab_back + 0.1)], panel, (1, 0, 0)))
    o += wheels((-W + 0.08, W - 0.08), (-L + 0.75, L - 0.75))
    return o
model('vehicles', 'hatchback', car('paint1', 3.9, 1.66, -1.5, 0.75, 0.92, 1.4, panel='paint2'),
      moving=[{'piece': 'door_l', 'hinge': [0.83, 0, 0.55], 'axis': 'y'}, {'piece': 'bonnet', 'hinge': [0, 0.9, 0.5], 'axis': 'x'}, {'piece': 'hatch', 'hinge': [0, 1.4, -1.35], 'axis': 'x'}])
model('vehicles', 'sedan', car('paint3', 4.6, 1.76, -0.9, 0.8, 0.95, 1.4),
      moving=[{'piece': 'door_l', 'hinge': [0.88, 0, 0.6], 'axis': 'y'}, {'piece': 'bonnet', 'hinge': [0, 0.95, 0.6], 'axis': 'x'}, {'piece': 'boot', 'hinge': [0, 0.95, -1.0], 'axis': 'x'}])
def pickup():
    L, W = 2.6, 0.95
    o = [hull([(-W, 0.35, 0.2), (W, 0.35, 0.2), (W, 0.35, L), (-W, 0.35, L), (-W, 1.05, 0.25), (W, 1.05, 0.25), (W, 1.0, L), (-W, 1.0, L)], 'paint2'),
         hull([(-W + 0.05, 1.04, -0.6), (W - 0.05, 1.04, -0.6), (W - 0.05, 1.04, 0.3), (-W + 0.05, 1.04, 0.3), (-W + 0.1, 1.75, -0.55), (W - 0.1, 1.75, -0.55), (W - 0.1, 1.75, -0.05), (-W + 0.1, 1.75, -0.05)], 'glass'),
         box([0, 1.78, -0.3], [2*W - 0.2, 0.06, 0.55], 'paint2'), box([0, 0.7, -0.2], [2*W, 0.7, 0.8], 'paint2'),
         *[box([sx*(W - 0.07), 1.4, z], [0.07, 0.72, 0.07], 'paint2') for sx in (1, -1) for z in (-0.55, 0.22)],
         box([0, 0.5, -1.7], [2*W, 0.3, 2.2], 'paint2'), *[box([sx*(W - 0.04), 0.85, -1.7], [0.08, 0.4, 2.2], 'paint2') for sx in (1, -1)], box([0, 0.85, -2.78], [2*W, 0.4, 0.06], 'paint2'),
         box([0, 0.66, -1.7], [2*W - 0.16, 0.02, 2.1], 'woodD'),
         box([0, 0.45, L + 0.04], [2*W + 0.06, 0.14, 0.1], 'chrome'), box([0, 0.45, -2.84], [2*W + 0.06, 0.14, 0.08], 'chrome'),
         *[flat([(sx*0.72 - 0.14, 0.72, L + 0.002), (sx*0.72 + 0.14, 0.72, L + 0.002), (sx*0.72 + 0.14, 0.84, L + 0.002), (sx*0.72 - 0.14, 0.84, L + 0.002)], 'head') for sx in (1, -1)],
         flat([(-W - 0.002, 0.42, 0.9), (-W - 0.002, 0.42, 1.9), (-W - 0.002, 0.7, 1.7), (-W - 0.002, 0.75, 1.0)], 'rust', (-1, 0, 0)),
         flat([(W + 0.002, 0.5, -0.5), (W + 0.002, 0.5, 0.1), (W + 0.002, 0.95, 0.1), (W + 0.002, 0.95, -0.5)], 'paint1', (1, 0, 0))]
    return o + wheels((-W + 0.1, W - 0.1), (-1.8, 1.55), r=0.36, w=0.24)
model('vehicles', 'pickup', pickup(), moving=[{'piece': 'door_l', 'hinge': [0.95, 0, 0.25], 'axis': 'y'}, {'piece': 'bonnet', 'hinge': [0, 1.05, 0.3], 'axis': 'x'}, {'piece': 'tailgate', 'hinge': [0, 0.65, -2.8], 'axis': 'x'}])
def van():
    L, W = 2.5, 1.0
    o = [box([0, 1.25, -0.3], [2*W, 1.9, 4.2], 'white'), hull([(-W, 0.3, 1.8), (W, 0.3, 1.8), (W, 0.3, L), (-W, 0.3, L), (-W, 1.0, 1.8), (W, 1.0, 1.8), (W, 0.95, L), (-W, 0.95, L)], 'white'),
         hull([(-W + 0.02, 1.0, 1.6), (W - 0.02, 1.0, 1.6), (W - 0.02, 1.0, 1.85), (-W + 0.02, 1.0, 1.85), (-W + 0.02, 2.1, 1.6), (W - 0.02, 2.1, 1.6), (W - 0.02, 2.1, 1.62), (-W + 0.02, 2.1, 1.62)], 'glass'),
         flat([(W + 0.002, 0.9, -1.8), (W + 0.002, 0.9, 1.0), (W + 0.002, 1.3, 1.0), (W + 0.002, 1.3, -1.8)], 'blue', (1, 0, 0)), flat([(-W - 0.002, 0.9, 1.0), (-W - 0.002, 0.9, -1.8), (-W - 0.002, 1.3, -1.8), (-W - 0.002, 1.3, 1.0)], 'blue', (-1, 0, 0)),
         flat([(W + 0.003, 1.45, 1.1), (W + 0.003, 1.45, 1.6), (W + 0.003, 1.95, 1.6), (W + 0.003, 1.95, 1.1)], 'glass', (1, 0, 0)), flat([(-W - 0.003, 1.45, 1.6), (-W - 0.003, 1.45, 1.1), (-W - 0.003, 1.95, 1.1), (-W - 0.003, 1.95, 1.6)], 'glass', (-1, 0, 0)),
         box([0, 0.45, L + 0.04], [2*W + 0.04, 0.14, 0.08], 'black'), box([0, 0.45, -2.42], [2*W + 0.04, 0.14, 0.08], 'black'),
         flat([(W + 0.004, 0.4, -0.9), (W + 0.004, 0.4, -0.2), (W + 0.004, 0.6, -0.3), (W + 0.004, 0.65, -0.8)], 'rust', (1, 0, 0))]
    return o + wheels((-W + 0.1, W - 0.1), (-1.6, 1.6), r=0.34, w=0.22)
model('vehicles', 'van', van(), moving=[{'piece': 'door_l', 'hinge': [1.0, 0, 1.85], 'axis': 'y'}, {'piece': 'back_doors', 'hinge': [1.0, 0, -2.4], 'axis': 'y'}])

# ---- split each vehicle into body, bonnet and one wheel, as the game asked (separate wheels and bonnet) ----
VRIG = {}
def rig(name, z0, z1, y0, y1, half, col):
    """the bonnet: a panel lying on the body from z0 (windscreen, height y0) to z1 (nose, height y1); one wheel model; axle positions"""
    ps = M['vehicles'][name]
    wheels_ = [q for q in ps if q['c'] in ('tyre', 'hub') and q.get('ax') == 'x']
    body = [q for q in ps if q not in wheels_]
    axles = sorted({tuple(q['p']) for q in wheels_ if q['c'] == 'tyre'})
    first = [q for q in wheels_ if tuple(q['p']) == axles[0]]
    wheel = [dict(q, p=[0, 0, 0]) for q in first]
    lid = hull([(-half, y0 + 0.004, z0), (half, y0 + 0.004, z0), (half, y1 + 0.004, z1), (-half, y1 + 0.004, z1),
                (-half, y0 + 0.034, z0), (half, y0 + 0.034, z0), (half, y1 + 0.034, z1), (-half, y1 + 0.034, z1)], col)
    bay = flat([(-half + 0.08, y0 + 0.003, z0 + 0.06), (half - 0.08, y0 + 0.003, z0 + 0.06), (half - 0.08, y1 + 0.003, z1 - 0.06), (-half + 0.08, y1 + 0.003, z1 - 0.06)], 'black', (0, 1, 0))
    M['vehicles'][name] = {'body': body + [bay], 'bonnet': [lid], 'wheel': wheel}
    VRIG[name] = {'wheels': [list(a) for a in axles], 'wheelAxis': 'x', 'bonnetHinge': [0, round(y0 + 0.034, 3), z0], 'bonnetAxis': 'x',
                  'wheelRule': 'Place the wheel model at each position (turned half a turn on the left side), spin it about x; the bonnet opens about its hinge.'}
def hood_line(L, hood, z):   # the car body's top: hood-0.05 at the back, hood-0.1 at the nose
    return (hood - 0.05) + (-0.05)*(z - (-L + 0.05))/(L - (-L + 0.05))
for nm, Lh, hood, cf, Wd, col in (('hatchback', 1.95, 0.92, 0.75, 0.83, 'paint1'), ('sedan', 2.3, 0.95, 0.8, 0.88, 'paint3')):
    rig(nm, cf + 0.02, Lh - 0.02, hood_line(Lh, hood, cf + 0.02), hood_line(Lh, hood, Lh - 0.02), Wd - 0.04, col)
rig('pickup', 0.32, 2.58, 1.05 - 0.05*(0.32 - 0.25)/2.35, 1.0, 0.91, 'paint2')
rig('van', 1.86, 2.48, 0.998, 0.952, 0.96, 'white')

# ================= garden and water (0.43) =================
model('garden', 'rain_barrel', [loft([[0, 0, 0, 0.32, 0.32], [0, 0.45, 0, 0.34, 0.34], [0, 0.9, 0, 0.32, 0.32]], 'blue', n=8), loft([[0, 0.9, 0, 0.3, 0.3], [0, 0.96, 0, 0.18, 0.18]], 'black', n=8, caps=[False, False]),
                                loft([[0, 0.93, 0, 0.18, 0.18], [0, 0.94, 0, 0.18, 0.18]], 'metalD', n=8, caps=[False, True]), b(0, 0.15, 0.32, 0.05, 0.05, 0.08, 'metal'), b(0, 0.0, 0, 0.7, 0.06, 0.7, 'wood'),
                                b(0, 0.96, -0.12, 0.1, 0.35, 0.08, 'metalD'), flat([(-0.2, 0.62, 0.335), (0.2, 0.62, 0.335), (0.2, 0.66, 0.335), (-0.2, 0.66, 0.335)], 'blueD')])
def plot_base():
    return [b(0, 0, 0, 1.3, 0.28, 2.5, 'wood'), b(0, 0.28, 0, 1.2, 0.02, 2.4, 'soil'), *[b(0, 0.3, z, 0.9, 0.02, 0.08, 'soilD') for z in (-0.8, 0.0, 0.8)]]
def crop(stage):
    o = []
    for z in (-0.8, 0.0, 0.8):
        for x in (-0.3, 0.0, 0.3):
            if stage == 'sprouting':
                o += [tip([x, 0.3, z], [x + 0.04, 0.42, z + 0.02], 0.02, 0.01, 'leafL'), tip([x, 0.3, z], [x - 0.04, 0.4, z - 0.02], 0.02, 0.01, 'leafL')]
            else:
                h = 0.55 if stage == 'growing' else 0.75
                o.append(loft([[x, 0.3, z, 0.05, 0.05], [x, 0.3 + h*0.5, z, 0.14, 0.14], [x, 0.3 + h, z, 0, 0]], 'leaf' if (x + z) % 0.6 else 'leafD', n=5, caps=[True, False]))
                if stage == 'ripe': o += [b(x + 0.08, 0.3 + h*0.35, z + 0.06, 0.07, 0.07, 0.07, 'tomato'), b(x - 0.07, 0.3 + h*0.55, z - 0.05, 0.07, 0.07, 0.07, 'tomato')]
    return o
model('garden', 'garden_plot', plot_base())
for st in ('sprouting', 'growing', 'ripe'): model('garden', 'garden_' + st, crop(st))

# the art requests of 19 October 2026: more items, loot containers, plants, street props, hinged pieces, truck parts, wrecks and things players build
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'props_more.py')).read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'props_x.py')).read())

pack = {
  'name': 'props', 'version': 1, 'style': 'rectangular frustums and boxes, flat colour planes, few corners; boxy worn 1970s-1990s vehicles',
  'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base', 'palette': PALETTE, 'about': __doc__.split('\n', 2)[2],
  'flatModels': True, 'models': M, 'moving': MOVING, 'vehicleRig': VRIG,
  'containerRule': 'containers holds every searchable container twice: <name> closed and <name>_searched (doors open, drawer out, lid up, fewer things inside).',
  'buildRule': 'build holds things players make and place; barricade has three stages (barricade, barricade_damaged, barricade_nearly_gone); campfire and generator have lit/running and out/off versions. glow pieces are flames, embers and lamps.',
  'wreckRule': 'Every vehicle also comes as <name>_wreck (rusted, flat tyres, broken glass) and <name>_burnt (charred shell on bare rims); lower them by vehicleRig[...].sitDrop.',
  'gardenRule': 'garden_plot is the empty bed; draw garden_sprouting, garden_growing or garden_ripe on top of it for the plot\'s stage. rain_barrel is the rain collector.',
  'harvest': HARVEST, 'damageRule': DMG_RULE,
  'baseRule': 'build.claim_sign or build.claim_flag marks a claimed base (nail the sign by the door). build.custom_bed is the bed made from harvested planks and cloth scraps. build.reinforce_<planks|sheet|mesh> (and _damaged, _nearly_gone) is a 1.5 m by 2.4 m panel laid on the room side of a wall: its back at z = 0, facing +Z into the room. Planks suit wood walls, sheet metal steel walls, rebar mesh concrete, but any goes on any.',
  'movingRule': 'moving lists which parts open or turn and where their hinge or axle is. The models are drawn closed; split the named part out when it needs to move.'
}
out, st = write_pack('props', pack, __file__)
tot = {}
for k, v in st.items():
    c = k.split('.')[0]; tot.setdefault(c, []).append(v[0])
for c, v in tot.items(): print(c, len(v), 'models, triangles', min(v), '-', max(v))
