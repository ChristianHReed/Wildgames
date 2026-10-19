# Props added for the art requests of 19 October 2026 (game 0.45.5). Run through props.py (it reads this file),
# sharing its helpers: model(cat, name, pieces), b(x, y, z, w, h, d, c) for a box standing on y, PALETTE, M, MOVING, VRIG.
PALETTE.update({
  'stone': '#8a867c', 'flare': '#c8322a', 'flareCap': '#e8e0d0', 'brass': '#c8a24a', 'matchbox': '#c9a23a', 'nail': '#9a9a96', 'seedpack': '#7a9a4a',
  'pillW': '#e8e4da', 'pillB': '#4a6a9a', 'vit': '#d08a2a', 'soda': '#b8322a', 'granola': '#c99a5a', 'rice': '#e8dcc0', 'blanket': '#7a4a5a', 'blanketD': '#5a3442',
  'book1': '#3e5a7a', 'book2': '#8a3a32', 'book3': '#4c6a44', 'clothScrap': '#8a96a0', 'stick': '#7a5a3a', 'berry': '#6a2a4a', 'raincoat': '#c8a23a', 'raincoatD': '#9c7c2a',
  'lanternGlass': '#ffe6b0', 'ammo': '#4c5a3a', 'cupboard': '#c8b89a', 'cupboardD': '#a8987a', 'filing': '#7d838c', 'medicine': '#e2ddd2', 'till': '#3a3d42',
  'duffel': '#3e4a3a', 'duffelD': '#2e382c', 'tool': '#b8322a', 'bark2': '#e8e4da', 'barkMark': '#2a2b2e', 'birchLeaf': '#9ab85a', 'autumn1': '#c8642a', 'autumn2': '#d89a2a', 'autumn3': '#a8402a',
  'willow': '#7a9a4a', 'willowD': '#5e7a38', 'log': '#6a5040', 'logEnd': '#c8a87a', 'fern': '#4c7a3a', 'flowerR': '#c8402a', 'flowerY': '#e8c02a', 'flowerP': '#8a5aa8', 'stem': '#5a7a3a',
  'reed': '#8a9a5a', 'reedTop': '#6a4a2a', 'mushroom': '#c8b090', 'mushCap': '#a8422a', 'bramble': '#3a5a2e',
  'signY': '#e8c02a', 'signBlue': '#2e5a8a', 'signGreen': '#2e6a4a', 'meter': '#5a6a7a', 'phone': '#a8322a', 'barrier': '#b8bcc0', 'manhole': '#4a4a4c', 'paint': '#e8e4d8', 'paintY': '#e0b83a',
  'awningA': '#2e5a4a', 'awningB': '#e8e0d0', 'dish': '#d8d8d2', 'tank': '#8a7a6a', 'brick': '#9a5a44', 'hatch': '#6a6e72',
  'doorWood': '#7a5a3e', 'doorPaint': '#3e5a6a', 'glassDoor': '#5c7480', 'shutter': '#4c6a5a', 'lid': '#8a6a46',
  'rustBody': '#7a4a32', 'rustD': '#5a3424', 'glassBroken': '#2a3236', 'burnt': '#2a2826', 'burntD': '#1a1918', 'burntRim': '#4a4644', 'ash': '#6a6660', 'battery': '#2a2b2e', 'batteryTop': '#b8322a', 'fuelCap': '#3a3d42', 'hubBare': '#6a6e72',
  'plank': '#9a7a52', 'plankD': '#7a5a3a', 'plankBroken': '#c8a87a', 'nailHead': '#5b6168', 'steelPlate': '#6a6e72', 'flame': '#ffb04a', 'flameCore': '#fff0b8', 'ember': '#e05a2a',
  'ac': '#b8b4aa', 'knob': '#c8b27a', 'steelD': '#33363a',
  'compost': '#4a3a2c', 'filterTop': '#c8c4b8', 'sand': '#d8c8a0', 'meat': '#8a3a2a', 'cloth': '#5a6a7a', 'grave': '#7a7064', 'flag': '#c8402a', 'packBlue': '#3e5a7a', 'exhaust': '#8a8a86'
})

# ================= more loose items =================
model('items', 'stone', [hull([(-0.04, 0, -0.03), (0.04, 0, -0.035), (0.045, 0, 0.03), (-0.035, 0, 0.035), (-0.03, 0.045, -0.02), (0.03, 0.05, -0.02), (0.03, 0.04, 0.02), (-0.025, 0.045, 0.025)], 'stone')])
model('items', 'flare', [loft([[0, 0.02, -0.1, 0.02, 0.02], [0, 0.02, 0.08, 0.02, 0.02]], 'flare', ax='z', n=6), loft([[0, 0.02, 0.08, 0.021, 0.021], [0, 0.02, 0.11, 0.021, 0.021]], 'flareCap', ax='z', n=6)])
model('items', 'lure', [b(0, 0, 0, 0.09, 0.07, 0.06, 'metalD'), loft([[0, 0.07, 0, 0.012, 0.012], [0, 0.14, 0, 0.012, 0.012]], 'steel', n=6), box([0, 0.045, 0.031], [0.04, 0.02, 0.004], 'red', glow=True)])
model('items', 'batteries', [loft([[x, 0, 0, 0.014, 0.014], [x, 0.05, 0, 0.014, 0.014]], 'black', n=6) for x in (-0.02, 0.0, 0.02)] + [loft([[x, 0.035, 0, 0.0145, 0.0145], [x, 0.05, 0, 0.0145, 0.0145]], 'brass', n=6, caps=[False, True]) for x in (-0.02, 0.0, 0.02)])
model('items', 'matches', [b(0, 0, 0, 0.05, 0.016, 0.035, 'matchbox'), flat([(-0.025, 0.004, 0.0176), (0.025, 0.004, 0.0176), (0.025, 0.012, 0.0176), (-0.025, 0.012, 0.0176)], 'redD')])
model('items', 'nails', [b(0, 0, 0, 0.08, 0.04, 0.05, 'cardboard')] + [tip([x, 0.04, z], [x + 0.02, 0.05, z + 0.03], 0.003, 0.003, 'nail') for x, z in ((-0.02, -0.01), (0.0, 0.0), (0.02, -0.015))])
model('items', 'seeds', [b(0, 0, 0, 0.07, 0.006, 0.1, 'seedpack'), flat([(-0.025, 0.0065, -0.01), (0.025, 0.0065, -0.01), (0.025, 0.0065, 0.035), (-0.025, 0.0065, 0.035)], 'tomato', (0, 1, 0))])
model('items', 'antibiotics', [b(0, 0, 0, 0.08, 0.02, 0.05, 'pillW'), flat([(-0.04, 0.0205, -0.012), (0.04, 0.0205, -0.012), (0.04, 0.0205, 0.012), (-0.04, 0.0205, 0.012)], 'pillB', (0, 1, 0))])
model('items', 'painkillers', [loft([[0, 0, 0, 0.022, 0.022], [0, 0.07, 0, 0.022, 0.022]], 'pillW', n=6), b(0, 0.07, 0, 0.048, 0.018, 0.048, 'red')])
model('items', 'vitamins', [loft([[0, 0, 0, 0.026, 0.026], [0, 0.08, 0, 0.026, 0.026]], 'vit', n=6), b(0, 0.08, 0, 0.056, 0.02, 0.056, 'white')])
model('items', 'soda_can', [loft([[0, 0, 0, 0.032, 0.032], [0, 0.12, 0, 0.032, 0.032]], 'soda', n=6), loft([[0, 0.12, 0, 0.028, 0.028], [0, 0.125, 0, 0.028, 0.028]], 'metal', n=6, caps=[False, True])])
model('items', 'granola_bar', [b(0, 0, 0, 0.12, 0.018, 0.035, 'granola'), flat([(-0.03, 0.0185, -0.0175), (0.03, 0.0185, -0.0175), (0.03, 0.0185, 0.0175), (-0.03, 0.0185, 0.0175)], 'label', (0, 1, 0))])
model('items', 'rice_bag', [hull([(-0.1, 0, -0.06), (0.1, 0, -0.06), (0.1, 0, 0.06), (-0.1, 0, 0.06), (-0.08, 0.1, -0.04), (0.08, 0.1, -0.04), (0.08, 0.12, 0.03), (-0.08, 0.12, 0.03)], 'rice'), flat([(-0.05, 0.03, 0.061), (0.05, 0.03, 0.061), (0.05, 0.08, 0.05), (-0.05, 0.08, 0.05)], 'label')])
model('items', 'blanket', [b(0, 0, 0, 0.42, 0.12, 0.3, 'blanket'), b(0, 0.04, 0, 0.43, 0.025, 0.31, 'blanketD')])
model('items', 'books', [b(0, 0, 0, 0.16, 0.035, 0.22, 'book1'), b(0.01, 0.035, 0.01, 0.15, 0.03, 0.2, 'book2'), b(-0.01, 0.065, -0.01, 0.14, 0.04, 0.21, 'book3'), b(0, 0.0, 0.108, 0.15, 0.1, 0.006, 'paper')])
model('items', 'cloth_scraps', [hull([(-0.12, 0, -0.08), (0.1, 0, -0.1), (0.13, 0, 0.07), (-0.1, 0, 0.09), (-0.06, 0.04, -0.03), (0.05, 0.05, -0.04), (0.07, 0.03, 0.04), (-0.05, 0.04, 0.03)], 'clothScrap'),
                                flat([(-0.02, 0.051, -0.02), (0.06, 0.051, -0.03), (0.04, 0.051, 0.03)], 'red', (0, 1, 0))])
model('items', 'sticks', [hull([(x - 0.012, 0, -0.3), (x + 0.012, 0, -0.3), (x + 0.012, 0, 0.3), (x - 0.012, 0, 0.3), (x - 0.01, 0.024, -0.28), (x + 0.01, 0.024, -0.28), (x + 0.01, 0.024, 0.3), (x - 0.01, 0.024, 0.3)], 'stick') for x in (-0.04, 0.035)])
model('items', 'tin_can', [loft([[0, 0, 0, 0.04, 0.04], [0, 0.11, 0, 0.04, 0.04]], 'metal', n=6), loft([[0, 0.11, 0, 0.04, 0.04], [0.02, 0.15, -0.03, 0.035, 0.005]], 'metalD', n=6, caps=[False, False])])
model('items', 'berries', [b(0, 0, 0, 0.14, 0.05, 0.1, 'cardboard')] + [b(x, 0.05, z, 0.025, 0.025, 0.025, 'berry') for x, z in ((-0.04, -0.02), (0.0, 0.01), (0.04, -0.01), (-0.02, 0.025), (0.03, 0.03))])
model('items', 'rain_jacket', [b(0, 0, 0, 0.3, 0.07, 0.24, 'raincoat'), b(0, 0.07, -0.05, 0.22, 0.03, 0.12, 'raincoatD'), flat([(-0.003, 0.0705, -0.12), (0.003, 0.0705, -0.12), (0.003, 0.0705, 0.12), (-0.003, 0.0705, 0.12)], 'black', (0, 1, 0))])
model('items', 'lantern', [b(0, 0, 0, 0.14, 0.03, 0.14, 'black'), b(0, 0.03, 0, 0.12, 0.16, 0.12, 'lanternGlass', glow=True), *[b(sx*0.058, 0.03, sz*0.058, 0.012, 0.16, 0.012, 'black') for sx in (1, -1) for sz in (1, -1)],
                               tip([0, 0.19, 0], [0, 0.25, 0], 0.08, 0.08, 'black'), loft([[0, 0.27, -0.05, 0.004, 0.004], [0, 0.27, 0.05, 0.004, 0.004]], 'black', ax='z', n=4)])
model('items', 'ammo_box', [b(0, 0, 0, 0.26, 0.15, 0.12, 'ammo'), b(0, 0.15, 0, 0.27, 0.02, 0.13, 'leafD'), b(0, 0.17, 0, 0.08, 0.015, 0.02, 'black'), flat([(-0.08, 0.05, 0.061), (0.08, 0.05, 0.061), (0.08, 0.1, 0.061), (-0.08, 0.1, 0.061)], 'yellow')])
model('items', 'pistol', [box([0, 0.015, 0.06], [0.035, 0.03, 0.19], 'black'), hull([(-0.014, 0.0, -0.03), (0.014, 0.0, -0.03), (0.014, 0.0, 0.02), (-0.014, 0.0, 0.02), (-0.014, 0.03, -0.09), (0.014, 0.03, -0.09), (0.014, 0.03, -0.06), (-0.014, 0.03, -0.06)], 'black')])

# ================= loot containers: searchable, and the same once searched =================
def door_leaf(x0, x1, y0, y1, z, c, open_side=None, t=0.02):
    """a cupboard door; open swings it 90 degrees about its hinge edge (open_side 'l' hinge at x0, 'r' at x1)"""
    w = x1 - x0
    if not open_side: return box([(x0 + x1)/2, (y0 + y1)/2, z + t/2], [w, y1 - y0, t], c)
    hx = x0 if open_side == 'l' else x1
    return box([hx + (-t/2 if open_side == 'l' else t/2), (y0 + y1)/2, z + w/2], [t, y1 - y0, w], c)
def container(name, fn):
    model('containers', name, fn(False)); model('containers', name + '_searched', fn(True))
def cupboard(s):
    o = [b(0, 0, 0, 0.8, 0.9, 0.5, 'cupboard'), b(0, 0.9, 0, 0.82, 0.03, 0.52, 'cupboardD'), b(0, 0.02, 0.0, 0.7, 0.02, 0.44, 'cupboardD')]
    o += [door_leaf(-0.4, 0.0, 0.06, 0.86, 0.25, 'cupboard', 'l' if s else None), door_leaf(0.0, 0.4, 0.06, 0.86, 0.25, 'cupboard', 'r' if s else None)]
    if not s: o += [b(x, 0.6, 0.27, 0.02, 0.08, 0.02, 'metal') for x in (-0.04, 0.04)]
    else: o += [b(-0.1, 0.06, 0.05, 0.12, 0.08, 0.1, 'cardboard')]
    return o
container('cupboard', cupboard)
def wardrobe(s):
    o = [b(0, 0, 0, 1.0, 2.0, 0.6, 'wood'), b(0, 0.05, 0.0, 0.9, 0.02, 0.5, 'woodD')]
    o += [door_leaf(-0.5, 0.0, 0.06, 1.95, 0.3, 'wood', 'l' if s else None), door_leaf(0.0, 0.5, 0.06, 1.95, 0.3, 'wood', 'r' if s else None)]
    if s: o += [b(0, 1.75, 0.0, 0.9, 0.02, 0.02, 'metal'), b(0.2, 1.0, 0.0, 0.16, 0.74, 0.04, 'cloth'), b(-0.2, 0.06, 0.05, 0.3, 0.1, 0.2, 'cloth')]
    else: o += [b(x, 1.0, 0.31, 0.03, 0.12, 0.03, 'metal') for x in (-0.06, 0.06)]
    return o
container('wardrobe', wardrobe)
def drawers(s):
    o = [b(0, 0, 0, 0.6, 0.86, 0.6, 'cupboard'), b(0, 0.86, 0, 0.62, 0.04, 0.62, 'concrete')]
    for i, y in enumerate((0.06, 0.32, 0.58)):
        out = 0.3 if (s and i == 2) else (0.12 if (s and i == 1) else 0.0)
        o += [b(0, y, 0.27 + out, 0.56, 0.24, 0.04, 'cupboard'), b(0, y + 0.1, 0.295 + out, 0.16, 0.025, 0.02, 'metal')]
        if out: o += [b(0, y + 0.02, 0.05 + out, 0.52, 0.16, 0.44, 'cupboardD')]
    return o
container('kitchen_drawers', drawers)
def filing(s):
    o = [b(0, 0, 0, 0.46, 1.32, 0.62, 'filing')]
    for i, y in enumerate((0.04, 0.36, 0.68, 1.0)):
        out = 0.4 if (s and i == 2) else 0.0
        o += [b(0, y, 0.3 + out, 0.42, 0.28, 0.03, 'filing'), b(0, y + 0.18, 0.32 + out, 0.12, 0.02, 0.02, 'metalD')]
        if out: o += [b(0, y + 0.02, 0.06 + out, 0.38, 0.22, 0.48, 'metalD'), *[b(0, y + 0.03, z + out, 0.34, 0.22, 0.008, 'paper') for z in (-0.1, 0.0, 0.1)]]
    return o
container('filing_cabinet', filing)
def medicine(s):   # wall-mounted: its back is at z = 0, hung at 1.3 m
    o = [b(0, 1.3, 0.07, 0.5, 0.6, 0.14, 'medicine'), b(0, 1.32, 0.075, 0.44, 0.02, 0.12, 'tile'), b(0, 1.52, 0.075, 0.44, 0.02, 0.12, 'tile')]
    o.append(door_leaf(-0.25, 0.25, 1.31, 1.89, 0.14, 'glassL', 'l' if s else None, 0.015))
    if s: o += [b(-0.1, 1.34, 0.08, 0.05, 0.08, 0.05, 'orange'), b(0.12, 1.54, 0.08, 0.06, 0.06, 0.04, 'pillW')]
    else: o += [b(-0.1, 1.34, 0.08, 0.05, 0.08, 0.05, 'orange'), b(0.0, 1.34, 0.08, 0.05, 0.1, 0.05, 'pillW'), b(0.12, 1.54, 0.08, 0.06, 0.06, 0.04, 'pillB'), b(-0.08, 1.54, 0.08, 0.08, 0.1, 0.06, 'white')]
    return o
container('medicine_cabinet', medicine)
def glovebox(s):   # the box in a car's dash, front at +Z
    o = [b(0, 0, 0, 0.36, 0.16, 0.22, 'seat')]
    if s: o += [hull([(-0.17, 0.0, 0.11), (0.17, 0.0, 0.11), (0.17, 0.0, 0.13), (-0.17, 0.0, 0.13), (-0.17, -0.02, 0.27), (0.17, -0.02, 0.27), (0.17, 0.0, 0.27), (-0.17, 0.0, 0.27)], 'black'), b(0.05, 0.02, 0.02, 0.12, 0.03, 0.08, 'paper')]
    else: o += [b(0, 0.0, 0.115, 0.34, 0.15, 0.02, 'black'), b(0, 0.11, 0.128, 0.06, 0.02, 0.01, 'metal')]
    return o
container('glove_box', glovebox)
def boot(s):   # a car's boot as a container on its own (or use the sedan's boot lid in vehicleRig)
    o = [b(0, 0, 0, 1.3, 0.45, 0.8, 'paint3'), b(0, 0.42, 0, 1.2, 0.02, 0.7, 'black')]
    if s: o += [hull([(-0.66, 0.45, -0.4), (0.66, 0.45, -0.4), (0.66, 0.47, -0.4), (-0.66, 0.47, -0.4), (-0.66, 1.15, -0.55), (0.66, 1.15, -0.55), (0.66, 1.17, -0.55), (-0.66, 1.17, -0.55)], 'paint3'), b(-0.3, 0.44, 0.0, 0.3, 0.12, 0.25, 'cardboard')]
    else: o += [b(0, 0.45, 0, 1.32, 0.05, 0.82, 'paint3'), b(0, 0.3, 0.405, 0.12, 0.05, 0.02, 'chrome')]
    return o
container('car_boot', boot)
def toolbox(s):
    o = [b(0, 0, 0, 0.5, 0.2, 0.24, 'tool')]
    if s: o += [hull([(-0.25, 0.2, -0.12), (0.25, 0.2, -0.12), (0.25, 0.22, -0.12), (-0.25, 0.22, -0.12), (-0.25, 0.42, -0.2), (0.25, 0.42, -0.2), (0.25, 0.44, -0.2), (-0.25, 0.44, -0.2)], 'redD'), b(0, 0.17, 0, 0.44, 0.03, 0.2, 'metalD')]
    else: o += [b(0, 0.2, 0, 0.5, 0.05, 0.24, 'redD'), b(0, 0.25, 0, 0.2, 0.04, 0.03, 'black')]
    return o
container('toolbox', toolbox)
def till(s):
    o = [b(0, 0, 0, 0.42, 0.1, 0.42, 'till'), b(0, 0.1, -0.08, 0.36, 0.12, 0.24, 'till'), hull([(-0.12, 0.22, -0.1), (0.12, 0.22, -0.1), (0.12, 0.22, -0.04), (-0.12, 0.22, -0.04), (-0.12, 0.34, -0.12), (0.12, 0.34, -0.12), (0.12, 0.34, -0.08), (-0.12, 0.34, -0.08)], 'till'),
         flat([(-0.1, 0.24, -0.039), (0.1, 0.24, -0.039), (0.1, 0.32, -0.079), (-0.1, 0.32, -0.079)], 'glassL')]
    if s: o += [b(0, 0.02, 0.32, 0.38, 0.07, 0.3, 'metalD'), *[b(x, 0.09, 0.3, 0.06, 0.005, 0.1, 'green') for x in (-0.12, 0.0)]]
    else: o += [b(0, 0.02, 0.215, 0.38, 0.07, 0.02, 'metalD')]
    return o
container('till', till)
def binc(s):
    o = [frustum([[0, 0, 0, 0.2, 0.2], [0, 0.75, 0, 0.23, 0.23]], 'green')]
    if s: o += [frustum([[0.35, 0.0, 0.2, 0.25, 0.25], [0.35, 0.06, 0.2, 0.25, 0.25]], 'leafD'), b(0.0, 0.0, 0.38, 0.12, 0.06, 0.12, 'paper'), b(-0.2, 0.0, 0.3, 0.1, 0.04, 0.15, 'cardboard')]
    else: o += [frustum([[0, 0.75, 0, 0.24, 0.24], [0, 0.82, 0, 0.2, 0.2]], 'leafD')]
    return o
container('bin', binc)
def shelf_stack(s):
    o = [b(0, 0, 0, 1.2, 0.1, 0.5, 'metalD'), b(0, 0, -0.22, 1.2, 1.6, 0.04, 'metal')] + [b(0, y, 0, 1.2, 0.03, 0.5, 'metal') for y in (0.55, 1.0, 1.45)]
    stock = [(-0.4, 'label'), (-0.2, 'yellow'), (0.05, 'green'), (0.3, 'blue')]
    for y in (0.1, 0.58, 1.03):
        for i, (x, c) in enumerate(stock):
            if s and (i + int(y*10)) % 3: continue
            o.append(b(x, y, 0.05, 0.12, 0.18, 0.2, c))
    if s: o += [b(0.2, 0.0, 0.42, 0.12, 0.08, 0.18, 'label'), b(-0.3, 0.0, 0.5, 0.14, 0.06, 0.1, 'yellow')]
    return o
container('shelf_stack', shelf_stack)
def locker(s):
    o = [b(0, 0, 0, 0.5, 1.9, 0.5, 'blue'), door_leaf(-0.24, 0.24, 0.05, 1.86, 0.25, 'blue', 'l' if s else None)]
    if s: o += [b(0, 1.5, 0.0, 0.44, 0.02, 0.44, 'metalD'), b(0.08, 0.05, 0.0, 0.2, 0.3, 0.2, 'cloth')]
    else: o += [*[flat([(-0.15, y, 0.2701), (0.15, y, 0.2701), (0.15, y + 0.015, 0.2701), (-0.15, y + 0.015, 0.2701)], 'black') for y in (1.6, 1.64, 1.68)], b(0.18, 1.0, 0.27, 0.03, 0.1, 0.02, 'metal')]
    return o
container('locker', locker)
def duffel(s):
    o = [loft([[-0.32, 0.13, 0, 0.13, 0.13], [0.32, 0.13, 0, 0.13, 0.13]], 'duffel', ax='x', n=6), b(0, 0.24, 0, 0.3, 0.04, 0.04, 'duffelD')]
    if s: o += [flat([(-0.28, 0.255, -0.06), (0.28, 0.255, -0.06), (0.28, 0.255, 0.06), (-0.28, 0.255, 0.06)], 'black', (0, 1, 0)), hull([(-0.25, 0.25, 0.06), (0.25, 0.25, 0.06), (0.25, 0.26, 0.06), (-0.25, 0.26, 0.06), (-0.25, 0.1, 0.3), (0.25, 0.1, 0.3), (0.25, 0.11, 0.3), (-0.25, 0.11, 0.3)], 'duffelD'), b(0.4, 0, 0.2, 0.18, 0.04, 0.14, 'cloth')]
    return o
container('duffel_bag', duffel)

# ================= more trees and plants =================
def crown_tree(h, r, trunk_c, cols, trunk_w=0.18):
    o = [frustum([[0, 0, 0, trunk_w, trunk_w], [0, h*0.5, 0, trunk_w*0.65, trunk_w*0.65]], trunk_c)]
    for i, (x, y, z, s) in enumerate(((0, h*0.72, 0, 1.0), (0.9, h*0.62, 0.3, 0.7), (-0.8, h*0.66, -0.2, 0.75), (0.2, h*0.88, -0.5, 0.6), (-0.3, h*0.6, 0.8, 0.6))):
        rr = r*0.5*s; c = cols[i % len(cols)]
        o.append(loft([[x, y - rr*0.8, z, rr*0.55, rr*0.55], [x, y, z, rr, rr], [x, y + rr*0.7, z, rr*0.6, rr*0.6], [x, y + rr, z, 0, 0]], c, n=5, rot=18*i, caps=[True, False]))
    return o
model('plants', 'autumn_oak', crown_tree(6.0, 2.2, 'bark', ['autumn1', 'autumn2', 'autumn3']))
birch = [frustum([[0, 0, 0, 0.1, 0.1], [0, 5.0, 0, 0.05, 0.05]], 'bark2')] + [flat([(-0.03, y, 0.1 - 0.05*y/5 + 0.002), (0.04, y + 0.02, 0.1 - 0.05*y/5 + 0.002), (0.04, y + 0.06, 0.1 - 0.05*y/5 + 0.002), (-0.03, y + 0.05, 0.1 - 0.05*y/5 + 0.002)], 'barkMark') for y in (0.6, 1.4, 2.1, 2.9, 3.6)]
for i, (x, y, z, s) in enumerate(((0, 4.6, 0, 0.9), (0.6, 3.8, 0.2, 0.6), (-0.5, 4.0, -0.2, 0.6), (0.1, 5.4, -0.2, 0.5))):
    birch.append(loft([[x, y - s*0.7, z, s*0.45, s*0.45], [x, y, z, s*0.7, s*0.7], [x, y + s*0.9, z, 0, 0]], 'birchLeaf' if i % 2 == 0 else 'leafL', n=5, rot=20*i, caps=[True, False]))
model('plants', 'birch', birch)
willow = [frustum([[0, 0, 0, 0.22, 0.22], [0, 3.0, 0, 0.14, 0.14]], 'bark'), loft([[0, 3.0, 0, 1.6, 1.6], [0, 4.2, 0, 1.5, 1.5], [0, 5.0, 0, 0, 0]], 'willow', n=7, caps=[True, False])]
for k in range(10):
    a = k*2*math.pi/10; x, z = math.cos(a)*1.45, math.sin(a)*1.45
    willow.append(tip([x, 3.6, z], [x*1.15, 1.0 + 0.3*(k % 3), z*1.15], 0.28, 0.12, 'willowD' if k % 2 else 'willow', ax='y'))
model('plants', 'willow', willow)
model('plants', 'stump', [frustum([[0, 0, 0, 0.28, 0.28], [0, 0.45, 0, 0.24, 0.24]], 'bark'), loft([[0, 0.45, 0, 0.3, 0.3], [0, 0.6, 0.05, 0.1, 0.1]], 'bark', n=5, caps=[False, True]), tip([0.2, 0.05, 0.2], [0.5, 0.0, 0.45], 0.08, 0.05, 'bark')])
model('plants', 'cut_stump', [loft([[0, 0, 0, 0.3, 0.3], [0, 0.4, 0, 0.27, 0.27]], 'bark', n=8, caps=[True, False]), loft([[0, 0.4, 0, 0.26, 0.26], [0, 0.401, 0, 0.26, 0.26]], 'logEnd', n=8, caps=[False, True]),
                              loft([[0, 0.402, 0, 0.12, 0.12], [0, 0.403, 0, 0.12, 0.12]], 'woodL', n=8, caps=[False, True])])
model('plants', 'fallen_log', [loft([[-1.6, 0.22, 0, 0.22, 0.22], [1.6, 0.2, 0.1, 0.19, 0.19]], 'log', ax='x', n=7), loft([[1.6, 0.2, 0.1, 0.18, 0.18], [1.605, 0.2, 0.1, 0.18, 0.18]], 'logEnd', ax='x', n=7), tip([0.4, 0.35, 0.05], [0.7, 0.8, -0.2], 0.05, 0.05, 'log'), flat([(-0.8, 0.43, -0.1), (-0.2, 0.42, -0.08), (-0.3, 0.41, 0.1), (-0.9, 0.42, 0.08)], 'leaf', (0, 1, 0))])
model('plants', 'fern', [tip([0, 0.02, 0], [0.55*math.cos(a), 0.35 + 0.1*(k % 2), 0.55*math.sin(a)], 0.08, 0.015, 'fern' if k % 2 else 'leafD') for k, a in enumerate([i*2*math.pi/9 for i in range(9)])])
for nm, c in (('flowers_red', 'flowerR'), ('flowers_yellow', 'flowerY'), ('flowers_purple', 'flowerP')):
    o = []
    for x, z in ((0, 0), (0.18, 0.1), (-0.15, 0.12), (0.08, -0.17), (-0.12, -0.12), (0.22, -0.06)):
        o += [tip([x, 0, z], [x, 0.3, z], 0.012, 0.012, 'stem'), loft([[x, 0.28, z, 0.05, 0.05], [x, 0.32, z, 0.05, 0.05]], c, n=5)]
    o += [tip([x*1.2, 0, z*1.2], [x*1.6, 0.15, z*1.6], 0.03, 0.01, 'leafL') for x, z in ((0.2, 0.1), (-0.2, 0.1), (0.0, -0.2))]
    model('plants', nm, o)
model('plants', 'reeds', [tip([x, 0, z], [x + 0.05, 1.3 + 0.2*((i*7) % 3), z], 0.025, 0.01, 'reed') for i, (x, z) in enumerate(((0, 0), (0.1, 0.06), (-0.08, 0.05), (0.05, -0.1), (-0.12, -0.06), (0.15, -0.04), (-0.02, 0.14)))]
      + [loft([[x + 0.03, 1.0, z, 0.02, 0.02], [x + 0.035, 1.18, z, 0.022, 0.022]], 'reedTop', n=4) for x, z in ((0, 0), (0.1, 0.06), (-0.12, -0.06))])
model('plants', 'mushrooms', [o for x, z, s in ((0, 0, 1.0), (0.08, 0.05, 0.7), (-0.06, 0.07, 0.6), (0.03, -0.08, 0.5))
                               for o in (loft([[x, 0, z, 0.012*s, 0.012*s], [x, 0.07*s, z, 0.012*s, 0.012*s]], 'mushroom', n=5), loft([[x, 0.065*s, z, 0.045*s, 0.045*s], [x, 0.1*s, z, 0, 0]], 'mushCap', n=6, caps=[True, False]))])
model('plants', 'bramble', [tip([0, 0.05, 0], [math.cos(a)*0.7, 0.2 + 0.4*(k % 3)/2, math.sin(a)*0.7], 0.09, 0.05, 'bramble', ax='y' if k % 3 == 2 else None) for k, a in enumerate([i*2*math.pi/8 for i in range(8)])]
      + [loft([[0, 0, 0, 0.35, 0.35], [0, 0.45, 0, 0.4, 0.4], [0, 0.7, 0, 0, 0]], 'bramble', n=6, caps=[True, False])] + [b(x, y, z, 0.03, 0.03, 0.03, 'berry') for x, y, z in ((0.3, 0.35, 0.2), (-0.25, 0.42, 0.25), (0.1, 0.55, -0.3), (-0.3, 0.3, -0.2))])

# ================= more street props =================
def sign_post(face, h=2.1): return [b(0, 0, 0, 0.06, h, 0.06, 'post')] + face
model('street', 'sign_speed', sign_post([b(0, 2.05, 0.04, 0.45, 0.6, 0.03, 'signW'), flat([(-0.17, 2.15, 0.056), (0.17, 2.15, 0.056), (0.17, 2.45, 0.056), (-0.17, 2.45, 0.056)], 'black'), flat([(-0.18, 2.5, 0.056), (0.18, 2.5, 0.056), (0.18, 2.58, 0.056), (-0.18, 2.58, 0.056)], 'black')]))
model('street', 'sign_one_way', sign_post([b(0, 2.2, 0.04, 0.9, 0.3, 0.03, 'black'), flat([(-0.35, 2.31, 0.056), (0.2, 2.31, 0.056), (0.2, 2.39, 0.056), (-0.35, 2.39, 0.056)], 'signW'), flat([(0.2, 2.27, 0.056), (0.38, 2.35, 0.056), (0.2, 2.43, 0.056)], 'signW')]))
model('street', 'sign_yield', sign_post([solid([(-0.36, 2.55, 0.04), (0.36, 2.55, 0.04), (0, 1.95, 0.04), (-0.36, 2.55, 0.07), (0.36, 2.55, 0.07), (0, 1.95, 0.07)], [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]], 'sign'),
                                         solid([(-0.24, 2.47, 0.075), (0.24, 2.47, 0.075), (0, 2.08, 0.075), (-0.24, 2.47, 0.076), (0.24, 2.47, 0.076), (0, 2.08, 0.076)], [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]], 'signW')]))
model('street', 'street_name_post', [b(0, 0, 0, 0.06, 2.6, 0.06, 'post'), b(0.35, 2.5, 0, 0.8, 0.18, 0.025, 'signGreen'), b(0, 2.3, 0.35, 0.025, 0.18, 0.8, 'signGreen'),
                                     flat([(0.05, 2.56, 0.0135), (0.6, 2.56, 0.0135), (0.6, 2.62, 0.0135), (0.05, 2.62, 0.0135)], 'signW'), flat([(0.0135, 2.36, 0.1), (0.0135, 2.36, 0.62), (0.0135, 2.42, 0.62), (0.0135, 2.42, 0.1)], 'signW', (1, 0, 0))])
model('street', 'parking_meter', [b(0, 0, 0, 0.06, 1.1, 0.06, 'post'), b(0, 1.1, 0, 0.18, 0.28, 0.14, 'meter'), tip([0, 1.38, 0], [0, 1.45, 0], 0.13, 0.1, 'meter'), flat([(-0.06, 1.24, 0.071), (0.06, 1.24, 0.071), (0.06, 1.32, 0.071), (-0.06, 1.32, 0.071)], 'glassL')])
model('street', 'bike_rack', [b(0, 0, 0, 2.0, 0.04, 0.3, 'metalD')] + [o for x in (-0.75, -0.25, 0.25, 0.75) for o in (b(x - 0.15, 0.04, 0, 0.04, 0.7, 0.04, 'metal'), b(x + 0.15, 0.04, 0, 0.04, 0.7, 0.04, 'metal'), b(x, 0.72, 0, 0.34, 0.04, 0.04, 'metal'))])
model('street', 'phone_box', [b(0, 0, 0, 0.95, 0.12, 0.95, 'concrete'), b(0, 0.12, 0, 0.9, 2.1, 0.9, 'phone'), b(0, 2.22, 0, 0.95, 0.15, 0.95, 'phone'), tip([0, 2.37, 0], [0, 2.5, 0], 0.62, 0.62, 'phone'),
                              *[flat([(-0.32, y, 0.451), (0.32, y, 0.451), (0.32, y + 0.4, 0.451), (-0.32, y + 0.4, 0.451)], 'glassL') for y in (0.9, 1.4)], flat([(-0.3, 2.24, 0.476), (0.3, 2.24, 0.476), (0.3, 2.34, 0.476), (-0.3, 2.34, 0.476)], 'signW')])
model('street', 'bollard', [frustum([[0, 0, 0, 0.09, 0.09], [0, 0.9, 0, 0.08, 0.08]], 'steel'), frustum([[0, 0.7, 0, 0.085, 0.085], [0, 0.78, 0, 0.085, 0.085]], 'yellow', caps=[False, False]), tip([0, 0.9, 0], [0, 0.97, 0], 0.11, 0.11, 'steel')])
model('street', 'crash_barrier', [b(x, 0, 0, 0.1, 0.75, 0.1, 'metalD') for x in (-1.6, 0, 1.6)] + [hull([(-2.0, 0.45, 0.05), (2.0, 0.45, 0.05), (2.0, 0.45, 0.13), (-2.0, 0.45, 0.13), (-2.0, 0.75, 0.05), (2.0, 0.75, 0.05), (2.0, 0.75, 0.13), (-2.0, 0.75, 0.13)], 'barrier'),
                                  flat([(-2.0, 0.58, 0.131), (2.0, 0.58, 0.131), (2.0, 0.62, 0.131), (-2.0, 0.62, 0.131)], 'metalD')])
model('street', 'manhole', [loft([[0, 0.0, 0, 0.36, 0.36], [0, 0.012, 0, 0.36, 0.36]], 'manhole', n=8), *[flat([(-0.3, 0.013, z - 0.01), (0.3, 0.013, z - 0.01), (0.3, 0.013, z + 0.01), (-0.3, 0.013, z + 0.01)], 'black', (0, 1, 0)) for z in (-0.15, 0.0, 0.15)]])
model('street', 'road_centre_dash', [flat([(-0.06, 0.012, -1.5), (0.06, 0.012, -1.5), (0.06, 0.012, 1.5), (-0.06, 0.012, 1.5)], 'paintY', (0, 1, 0))])
model('street', 'road_stop_line', [flat([(-1.8, 0.012, -0.15), (1.8, 0.012, -0.15), (1.8, 0.012, 0.15), (-1.8, 0.012, 0.15)], 'paint', (0, 1, 0))])
model('street', 'road_crossing', [flat([(x - 0.25, 0.012, -1.5), (x + 0.25, 0.012, -1.5), (x + 0.25, 0.012, 1.5), (x - 0.25, 0.012, 1.5)], 'paint', (0, 1, 0)) for x in (-3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0)])
model('street', 'shop_awning', [hull([(-1.2, 2.6, 0.0), (1.2, 2.6, 0.0), (1.2, 2.2, 1.2), (-1.2, 2.2, 1.2), (-1.2, 2.66, 0.0), (1.2, 2.66, 0.0), (1.2, 2.26, 1.2), (-1.2, 2.26, 1.2)], 'awningA')]
      + [flat([(x, 2.665, 0.0), (x + 0.24, 2.665, 0.0), (x + 0.24, 2.265, 1.2), (x, 2.265, 1.2)], 'awningB', (0, 0.95, 0.32)) for x in (-1.2, -0.72, -0.24, 0.24, 0.72)] + [b(0, 2.0, 1.2, 2.4, 0.2, 0.03, 'awningA')])
model('street', 'hanging_sign', [b(0, 2.9, 0.4, 0.05, 0.05, 0.8, 'steel'), b(0, 2.9, 0.0, 0.2, 0.2, 0.05, 'steel'), b(0, 2.88, 0.7, 0.01, 0.12, 0.01, 'steel'), b(0, 2.2, 0.55, 0.05, 0.6, 0.5, 'sign'), flat([(0.026, 2.35, 0.38), (0.026, 2.35, 0.72), (0.026, 2.65, 0.72), (0.026, 2.65, 0.38)], 'signW', (1, 0, 0))])
model('street', 'satellite_dish', [b(0, 0, 0, 0.3, 0.04, 0.2, 'metalD'), b(0, 0.04, 0, 0.04, 0.4, 0.04, 'metalD'), loft([[0, 0.55, 0.0, 0.05, 0.05], [0, 0.6, 0.12, 0.3, 0.28]], 'dish', ax='z', n=8, caps=[True, False]), tip([0, 0.55, 0.12], [0, 0.55, 0.42], 0.01, 0.01, 'metalD')])
model('street', 'ac_unit', [b(0, 0, 0, 0.9, 0.6, 0.7, 'ac'), loft([[0, 0.3, 0.351, 0.24, 0.24], [0, 0.3, 0.355, 0.24, 0.24]], 'metalD', ax='z', n=8), b(0.0, 0.6, 0, 0.92, 0.04, 0.72, 'metal')])
model('street', 'chimney', [b(0, 0, 0, 0.6, 1.2, 0.6, 'brick'), b(0, 1.2, 0, 0.7, 0.1, 0.7, 'concrete'), b(0.1, 1.3, 0, 0.18, 0.25, 0.18, 'rust')])
model('street', 'water_tank', [b(x, 0, z, 0.12, 1.2, 0.12, 'woodD') for x in (-0.7, 0.7) for z in (-0.7, 0.7)] + [loft([[0, 1.2, 0, 0.95, 0.95], [0, 2.8, 0, 0.95, 0.95]], 'tank', n=8), tip([0, 2.8, 0], [0, 3.3, 0], 1.0, 1.0, 'woodD', n=8, rot=22.5)]
      + [loft([[0, y, 0, 0.97, 0.97], [0, y + 0.06, 0, 0.97, 0.97]], 'steel', n=8, caps=[False, False]) for y in (1.6, 2.4)])
model('street', 'roof_hatch', [b(0, 0, 0, 0.9, 0.3, 0.9, 'hatch'), b(0, 0.3, 0, 0.94, 0.05, 0.94, 'metalD'), b(0.3, 0.35, 0, 0.12, 0.04, 0.04, 'metal')])

# ================= hinged pieces: each with its hinge at the origin =================
# doors and shutters: hinge line is the y axis at x = 0, the leaf runs to +X, outside face at +Z. Lids: hinge line is the x axis at z = 0, lid runs to +Z.
model('doors', 'house_door', [b(0.45, 0, 0, 0.9, 2.1, 0.05, 'doorPaint'), *[flat([(x0, y0, 0.0255), (x0 + 0.3, y0, 0.0255), (x0 + 0.3, y0 + 0.75, 0.0255), (x0, y0 + 0.75, 0.0255)], 'doorWood') for x0, y0 in ((0.1, 0.2), (0.5, 0.2), (0.1, 1.15), (0.5, 1.15))], b(0.8, 1.0, 0.04, 0.05, 0.05, 0.05, 'knob')])
model('doors', 'shop_door', [b(0.45, 0, 0, 0.9, 2.1, 0.05, 'steel'), b(0.45, 0.25, 0.0, 0.76, 1.7, 0.055, 'glassDoor'), b(0.45, 1.0, 0.05, 0.6, 0.04, 0.04, 'chrome')])
GARAGE = [b(1.1, y, 0, 2.2, 0.48, 0.05, 'metal') for y in (0.0, 0.5, 1.0, 1.5, 2.0)] + [flat([(0.0, y + 0.47, 0.026), (2.2, y + 0.47, 0.026), (2.2, y + 0.49, 0.026), (0.0, y + 0.49, 0.026)], 'metalD') for y in (0.0, 0.5, 1.0, 1.5)]
model('doors', 'garage_door', GARAGE)
model('doors', 'window_shutter', [b(0.3, 0, 0, 0.6, 1.3, 0.04, 'shutter')] + [flat([(0.06, y, 0.021), (0.54, y, 0.021), (0.54, y + 0.03, 0.021), (0.06, y + 0.03, 0.021)], 'leafD') for y in (0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05)])
model('doors', 'fridge_door', [b(0.35, 0, 0, 0.7, 1.18, 0.06, 'white'), b(0.63, 0.5, 0.05, 0.03, 0.3, 0.03, 'metal'), b(0.35, 0.1, -0.04, 0.6, 0.03, 0.06, 'plastic'), b(0.35, 0.5, -0.04, 0.6, 0.03, 0.06, 'plastic')])
model('doors', 'cupboard_door', [b(0.2, 0, 0, 0.4, 0.8, 0.02, 'cupboard'), b(0.35, 0.5, 0.02, 0.02, 0.08, 0.02, 'metal')])
model('doors', 'chest_lid', [b(0, 0, 0.25, 0.8, 0.06, 0.5, 'lid'), b(0, 0.0, 0.5, 0.1, 0.06, 0.03, 'metal')])
model('doors', 'crate_lid', [b(0, 0, 0.3, 0.6, 0.03, 0.6, 'wood')] + [flat([(-0.3, 0.031, z), (0.3, 0.031, z), (0.3, 0.031, z + 0.04), (-0.3, 0.031, z + 0.04)], 'woodD', (0, 1, 0)) for z in (0.08, 0.48)])
MOVING['doors'] = {'rule': 'Every piece here hinges at the origin: doors and shutters about the y axis (the leaf runs to +X), lids about the x axis (the lid runs to +Z). '
                            'garage_door rolls up instead: slide its five slats up one after another and lay them flat under the ceiling.'}

# ================= the truck for the repair jobs, and wrecks =================
VPICK = M['vehicles']['pickup']
VPICK['battery'] = [b(0.45, 0.88, 1.2, 0.26, 0.18, 0.17, 'battery'), b(0.45, 1.06, 1.2, 0.26, 0.02, 0.17, 'batteryTop'), b(0.0, 0.86, 1.6, 0.6, 0.18, 0.5, 'metalD')]
VPICK['fuel_cap'] = [loft([[-0.951, 0.8, -1.2, 0.05, 0.05], [-0.97, 0.8, -1.2, 0.05, 0.05]], 'fuelCap', ax='x', n=6)]
VPICK['hub'] = [loft([[-0.12, 0, 0, 0.09, 0.09], [0.12, 0, 0, 0.09, 0.09]], 'hubBare', ax='x', n=6)]
VRIG['pickup'].update({'battery': 'sits under the bonnet at (0.45, 0.88, 1.2); fit it there when the bonnet is up', 'fuelCap': [-0.96, 0.8, -1.2],
                       'hubRule': 'with a wheel off, draw hub at that wheel position (the bare axle on its concrete block)'})
def wreck(name, kind):
    """a parking-lot wreck (rusted, flat tyres, broken glass) or a burnt-out shell (charred, no glass, bare rims)"""
    V = M['vehicles'][name]; out = {}
    rm = {'rust': {'paint1': 'rustBody', 'paint2': 'rustBody', 'paint3': 'rustD', 'white': 'rustBody', 'glass': 'glassBroken', 'chrome': 'rustD', 'head': 'glassBroken', 'tail': 'rustD'},
          'burnt': {'paint1': 'burnt', 'paint2': 'burnt', 'paint3': 'burnt', 'white': 'burnt', 'glass': 'burntD', 'chrome': 'burntD', 'head': 'burntD', 'tail': 'burntD', 'woodD': 'ash', 'black': 'burntD', 'blue': 'burnt', 'rust': 'ash', 'tyre': 'burntRim', 'hub': 'burntRim'}}[kind]
    for part in ('body', 'bonnet'):
        out[part] = [dict(q, c=rm.get(q['c'], q['c'])) for q in V[part]]
    if kind == 'rust':   # flat tyres: the wheel squashed at the bottom
        out['wheel'] = [dict(q, r=[r[:3] + [r[3], r[4]*0.86] + r[5:] for r in q['r']], c=rm.get(q['c'], q['c'])) for q in V['wheel']]
    else:
        out['wheel'] = [dict(q, c='burntRim', r=[r[:3] + [r[3]*0.55, r[4]*0.55] + r[5:] for r in q['r']]) for q in V['wheel'] if q['c'] == 'hub']
    M['vehicles'][name + '_' + ('wreck' if kind == 'rust' else 'burnt')] = out
    VRIG[name + '_' + ('wreck' if kind == 'rust' else 'burnt')] = dict(VRIG[name], sitDrop=0.05 if kind == 'rust' else 0.16)
for nm in ('hatchback', 'sedan', 'pickup', 'van'):
    wreck(nm, 'rust'); wreck(nm, 'burnt')

# ================= things players build and place =================
def planks_across(w, h, n, stage, z=0.0):
    """barricade planks nailed across a gap w wide and h tall; stage 0 new, 1 damaged, 2 nearly gone"""
    o = []
    keep = {0: range(n), 1: [i for i in range(n) if i % 3 != 1], 2: [0, n - 1]}[stage]
    for i in keep:
        y = 0.25 + i*(h - 0.5)/(n - 1); tilt = 0.06*((i % 2)*2 - 1)
        o.append(flat([(-w/2, y - 0.08 - tilt, z), (w/2, y - 0.08 + tilt, z), (w/2, y + 0.08 + tilt, z), (-w/2, y + 0.08 - tilt, z)], 'plank' if i % 2 else 'plankD'))
        o.append(flat([(-w/2, y - 0.08 - tilt, z - 0.002), (w/2, y - 0.08 + tilt, z - 0.002), (w/2, y + 0.08 + tilt, z - 0.002), (-w/2, y + 0.08 - tilt, z - 0.002)], 'plankD', (0, 0, -1)))
        o += [box([sx*(w/2 - 0.08), y + tilt*sx, z + 0.006], [0.02, 0.02, 0.01], 'nailHead') for sx in (1, -1)]
    if stage == 1: o += [flat([(0.1, 0.25 + (h - 0.5)/(n - 1) - 0.08, z), (0.5, 0.25 + (h - 0.5)/(n - 1) - 0.02, z), (0.45, 0.25 + (h - 0.5)/(n - 1) + 0.08, z)], 'plankBroken')]
    if stage == 2: o += [flat([(-w/2, 0.9, z), (-w/2 + 0.4, 0.95, z), (-w/2 + 0.38, 1.05, z), (-w/2, 1.02, z)], 'plankBroken')]
    return o
def posts(w, h): return [box([sx*(w/2 + 0.04), h/2, -0.04], [0.08, h, 0.08], 'plankD') for sx in (1, -1)]
for st, nm in ((0, 'barricade'), (1, 'barricade_damaged'), (2, 'barricade_nearly_gone')):
    model('build', nm, posts(2.0, 2.0) + planks_across(2.0, 2.0, 7, st))
model('build', 'window_boards', planks_across(1.3, 1.4, 4, 0))
model('build', 'reinforced_door', [b(0.45, 0, 0, 0.9, 2.1, 0.06, 'doorWood'), b(0.45, 0.2, 0.035, 0.84, 0.5, 0.01, 'steelPlate'), b(0.45, 1.4, 0.035, 0.84, 0.5, 0.01, 'steelPlate'),
                                   *[flat([(0.05, y - 0.07, 0.06), (0.85, y + 0.05, 0.06), (0.85, y + 0.17, 0.06), (0.05, y + 0.05, 0.06)], 'plank') for y in (0.85, 1.15)]] + [box([x, y, 0.045], [0.02, 0.02, 0.01], 'nailHead') for x in (0.1, 0.8) for y in (0.3, 0.6, 1.5, 1.8)])
def logs():
    return [loft([[-0.32*math.cos(a), 0.06 + 0.05*(k % 2), -0.32*math.sin(a), 0.06, 0.06], [0.05*math.cos(a), 0.2, 0.05*math.sin(a), 0.05, 0.05]], 'log', n=5) for k, a in enumerate((0.3, 1.9, 3.5, 5.0))]
def flame(h=0.55, w=0.22):
    return [tip([0, 0.05, 0], [0.02, h, 0], w, w, 'flame', n=5, **G), tip([0, 0.05, 0], [-0.01, h*0.65, 0.01], w*0.6, w*0.6, 'flameCore', n=5, **G), tip([0.1, 0.05, 0.05], [0.13, h*0.6, 0.06], w*0.4, w*0.4, 'flame', n=4, **G)]
stones = [hull([(math.cos(a)*0.48 - 0.08, 0, math.sin(a)*0.48 - 0.07), (math.cos(a)*0.48 + 0.08, 0, math.sin(a)*0.48 - 0.07), (math.cos(a)*0.48 + 0.08, 0, math.sin(a)*0.48 + 0.07), (math.cos(a)*0.48 - 0.08, 0, math.sin(a)*0.48 + 0.07),
               (math.cos(a)*0.48 - 0.05, 0.12, math.sin(a)*0.48 - 0.04), (math.cos(a)*0.48 + 0.05, 0.13, math.sin(a)*0.48 - 0.04), (math.cos(a)*0.48 + 0.05, 0.1, math.sin(a)*0.48 + 0.05), (math.cos(a)*0.48 - 0.05, 0.11, math.sin(a)*0.48 + 0.05)], 'stone' if k % 2 else 'rock')
          for k, a in enumerate([i*2*math.pi/9 for i in range(9)])]
model('build', 'campfire', logs() + flame() + [b(0, 0, 0, 0.5, 0.02, 0.5, 'ash')])
model('build', 'campfire_out', logs() + [b(0, 0, 0, 0.5, 0.03, 0.5, 'ash'), b(0.05, 0.03, 0.02, 0.12, 0.04, 0.1, 'ember', glow=True)])
model('build', 'fire_pit', stones + logs() + flame(0.45, 0.18) + [b(0, 0, 0, 0.7, 0.02, 0.7, 'ash')])
model('build', 'lantern_post', [b(0, 0, 0, 0.3, 0.06, 0.3, 'wood'), b(0, 0.06, 0, 0.08, 1.8, 0.08, 'wood'), b(0.2, 1.8, 0, 0.45, 0.06, 0.06, 'wood'), b(0.38, 1.6, 0, 0.012, 0.2, 0.012, 'black'),
                                b(0.38, 1.4, 0, 0.14, 0.03, 0.14, 'black'), b(0.38, 1.43, 0, 0.12, 0.16, 0.12, 'lanternGlass', glow=True), tip([0.38, 1.59, 0], [0.38, 1.65, 0], 0.08, 0.08, 'black')])
gen = [b(0, 0, 0, 0.8, 0.06, 0.55, 'black'), b(0, 0.06, 0, 0.66, 0.46, 0.48, 'yellow'), b(0, 0.52, 0, 0.5, 0.08, 0.38, 'metalD'), b(-0.42, 0.06, 0, 0.04, 0.54, 0.04, 'black'), b(0.42, 0.06, 0, 0.04, 0.54, 0.04, 'black'),
       b(-0.42, 0.6, 0, 0.04, 0.04, 0.55, 'black'), b(0.42, 0.6, 0, 0.04, 0.04, 0.55, 'black'), loft([[0.3, 0.3, -0.24, 0.04, 0.04], [0.3, 0.3, -0.34, 0.04, 0.04]], 'metalD', ax='z', n=6), b(-0.15, 0.3, 0.241, 0.12, 0.1, 0.01, 'black')]
model('build', 'generator_off', gen + [b(-0.15, 0.32, 0.246, 0.03, 0.03, 0.01, 'redD')])
model('build', 'generator_running', gen + [b(-0.15, 0.32, 0.246, 0.03, 0.03, 0.01, 'green', glow=True), tip([0.3, 0.3, -0.34], [0.36, 0.7, -0.6], 0.06, 0.06, 'exhaust')])
model('build', 'compost_bin', [b(sx*0.48, 0, 0, 0.04, 0.8, 1.0, 'plank') for sx in (1, -1)] + [b(0, 0, -0.48, 1.0, 0.8, 0.04, 'plank')]
      + [b(0, y, 0.48, 1.0, 0.12, 0.04, 'plankD') for y in (0.05, 0.3, 0.55)] + [hull([(-0.44, 0, -0.44), (0.44, 0, -0.44), (0.44, 0, 0.44), (-0.44, 0, 0.44), (-0.3, 0.6, -0.3), (0.3, 0.6, -0.3), (0.3, 0.55, 0.3), (-0.3, 0.5, 0.3)], 'compost')])
model('build', 'water_filter', [loft([[0, 0, 0, 0.3, 0.3], [0, 0.9, 0, 0.3, 0.3]], 'blue', n=8), loft([[0, 0.9, 0, 0.31, 0.31], [0, 0.95, 0, 0.31, 0.31]], 'filterTop', n=8),
                                loft([[0, 0.95, 0, 0.22, 0.22], [0, 1.25, 0, 0.26, 0.26]], 'filterTop', n=8, caps=[True, False]), loft([[0, 1.0, 0, 0.21, 0.21], [0, 1.1, 0, 0.21, 0.21]], 'sand', n=8, caps=[False, True]),
                                b(0, 0.15, 0.3, 0.05, 0.05, 0.08, 'metal'), b(0, 0, 0, 0.7, 0.06, 0.7, 'wood'), flat([(-0.1, 0.4, 0.3), (0.1, 0.4, 0.3), (0.1, 0.7, 0.3), (-0.1, 0.7, 0.3)], 'white')])
model('build', 'drying_rack', [b(sx*0.7, 0, sz*0.25, 0.05, 1.3, 0.05, 'wood') for sx in (1, -1) for sz in (1, -1)] + [b(0, 1.25, z, 1.5, 0.04, 0.04, 'wood') for z in (-0.25, 0.25)]
      + [b(x, 0.75, 0.25, 0.14, 0.5, 0.01, c) for x, c in ((-0.45, 'meat'), (-0.15, 'cloth'), (0.15, 'meat'), (0.45, 'fern'))] + [b(x, 0.75, -0.25, 0.14, 0.5, 0.01, 'meat') for x in (-0.3, 0.3)])
model('build', 'cooking_spit', [o for sx in (1, -1) for o in (b(sx*0.5, 0, 0, 0.05, 0.8, 0.05, 'wood'), tip([sx*0.5, 0.75, 0], [sx*0.58, 0.95, 0], 0.03, 0.03, 'wood'), tip([sx*0.5, 0.75, 0], [sx*0.42, 0.95, 0], 0.03, 0.03, 'wood'))]
      + [loft([[-0.65, 0.85, 0, 0.012, 0.012], [0.65, 0.85, 0, 0.012, 0.012]], 'steel', ax='x', n=4), loft([[-0.15, 0.85, 0, 0.07, 0.06], [0.15, 0.85, 0, 0.07, 0.06]], 'meat', ax='x', n=6)] + logs() + flame(0.4, 0.16))
model('build', 'tool_bench', [b(sx*0.7, 0, sz*0.3, 0.08, 0.9, 0.08, 'woodD') for sx in (1, -1) for sz in (1, -1)] + [b(0, 0.9, 0, 1.6, 0.06, 0.75, 'wood'), b(0, 0.3, 0, 1.5, 0.03, 0.65, 'woodD'),
                              b(0, 0.96, -0.36, 1.6, 0.8, 0.04, 'plank'), b(-0.6, 0.96, 0.1, 0.18, 0.12, 0.12, 'steel'), b(-0.6, 1.08, 0.1, 0.2, 0.04, 0.06, 'steelD')]
      + [b(x, 1.2, -0.33, 0.03, 0.3, 0.02, c) for x, c in ((-0.3, 'steel'), (-0.1, 'wood'), (0.1, 'steelD'), (0.35, 'red'))] + [b(0.4, 0.96, 0.05, 0.3, 0.1, 0.15, 'tool')])
model('build', 'workshop_table', [b(sx*0.9, 0, sz*0.45, 0.08, 0.85, 0.08, 'metalD') for sx in (1, -1) for sz in (1, -1)] + [b(0, 0.85, 0, 2.0, 0.05, 1.0, 'plank'), b(0, 0.25, 0, 1.9, 0.03, 0.9, 'metalD'),
                                  b(0.5, 0.9, 0.1, 0.4, 0.02, 0.3, 'paper'), b(-0.4, 0.9, -0.1, 0.25, 0.14, 0.2, 'cardboard'), b(-0.7, 0.28, 0.0, 0.4, 0.3, 0.3, 'cardboard')])
model('build', 'dropped_pack', [hull([(-0.18, 0, -0.12), (0.18, 0, -0.12), (0.18, 0, 0.12), (-0.18, 0, 0.12), (-0.15, 0.3, -0.09), (0.15, 0.3, -0.09), (0.15, 0.26, 0.1), (-0.15, 0.28, 0.1)], 'packBlue'),
                                b(0, 0.2, 0.0, 0.32, 0.12, 0.24, 'blueD'), b(0, 0.05, 0.12, 0.2, 0.14, 0.05, 'blueD'), flat([(-0.1, 0.0, 0.2), (0.0, 0.0, 0.32), (0.04, 0.0, 0.3), (-0.06, 0.0, 0.18)], 'black', (0, 1, 0))])
model('build', 'grave_marker', [hull([(-0.45, 0, -0.9), (0.45, 0, -0.9), (0.45, 0, 0.9), (-0.45, 0, 0.9), (-0.3, 0.2, -0.75), (0.3, 0.2, -0.75), (0.3, 0.18, 0.75), (-0.3, 0.18, 0.75)], 'compost'),
                                b(0, 0.0, -0.95, 0.07, 1.0, 0.07, 'wood'), b(0, 0.7, -0.95, 0.45, 0.07, 0.07, 'wood')] + [b(0.2, 0.18, 0.3, 0.12, 0.04, 0.12, 'flowerR')])
model('build', 'map_flag', [b(0, 0, 0, 0.03, 1.6, 0.03, 'wood'), hull([(0.015, 1.25, 0), (0.45, 1.33, 0), (0.45, 1.33, 0.004), (0.015, 1.25, 0.004), (0.015, 1.55, 0), (0.45, 1.47, 0), (0.45, 1.47, 0.004), (0.015, 1.55, 0.004)], 'flag')])
