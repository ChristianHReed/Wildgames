#!/usr/bin/env python3
"""Afterstreet structures pack, version 1 (26 October 2026): bridges, overpasses, tunnels, culverts, dams and water works, for the map chat's `structures`
records (docs/MAP_STRUCTURES.md). Writes assets/shaped/structures.js. Run: python3 assets/shaped/src/structures.py

Every piece is a modular length of 4 m (unless it says otherwise) that runs along +Z, centred on x = 0 and z = 0, so the game lays them end to end along the
way and turns each by the way's bearing. DECK PIECES HAVE THEIR WALKING/DRIVING SURFACE AT y = 0: set y to the deck height the engine worked out. Pieces
whose name ends _unit are one metre tall and are stretched in y only (shafts, walls); dam and mound profiles are modelled at the height in their name and
may be scaled in y to the real height (their slopes stretch with them, which is right). Widths: path 3 m, road 7 m (two lanes), wide 14 m (a dual carriageway
or four lanes), rail 4.8 m (one track). Colour names come from the palette (nothing uses slots), so concrete, steel, timber and earth are plain colours."""
import math
from kit import *
P = {'concrete': '#a8a69e', 'concreteD': '#8a8880', 'concreteL': '#c0beb4', 'asphalt': '#3a3a3c', 'asphaltL': '#4a4a4c', 'line': '#e8e4d0', 'steel': '#6a7078', 'steelD': '#4a4e54', 'steelL': '#8a9098', 'paintB': '#5a7a8a', 'rust': '#7a4a32',
     'timber': '#7a5a3a', 'timberD': '#5a4028', 'gravel': '#7a766c', 'ballast': '#6a665e', 'sleeper': '#4a3a2e', 'rail': '#8a8a88', 'dirt': '#7a6648', 'grass': '#6d7a4f', 'rock': '#78746a', 'rockD': '#5e5a52', 'rockL': '#8e8a80',
     'dark': '#141416', 'water': '#4a7a90', 'foam': '#d8e4e8', 'cable': '#3a3c40', 'rubber': '#26272a', 'warn': '#e0a030', 'lamp': '#ffe6b0', 'pipe': '#8a8c88', 'pipeD': '#5a5c58'}
M = {}; INFO = {}
def reg(name, pieces, w, ln, h, note=''): M[name] = pieces; INFO[name] = {'w': w, 'len': ln, 'h': h, **({'note': note} if note else {})}
def bx(x, y0, z, w, h, d, c): return box([x, y0 + h/2, z], [w, h, d], c)
L = 4.0
WID = {'path': 3.0, 'road': 7.0, 'wide': 14.0, 'rail': 4.8}
# ---------------- deck segments ----------------
def deck(kind, ln=L, truss=False):
    W = WID[kind]; o = []
    if kind == 'rail':
        o += [bx(0, -0.7, 0, W, 0.7, ln, 'concrete'), bx(0, -0.05, 0, W - 0.5, 0.05, ln, 'ballast')]
        o += [bx(0, 0.0, z, 2.6, 0.12, 0.26, 'sleeper') for z in (-1.5, -0.5, 0.5, 1.5)]
        o += [bx(x, 0.08, 0, 0.1, 0.14, ln, 'rail') for x in (-0.72, 0.72)]
        o += [bx(sx*(W/2 - 0.1), 0, 0, 0.2, 0.9, ln, 'concreteD') for sx in (1, -1)]
        o += [bx(sx*(W/2 - 0.1), 0.9, 0, 0.14, 0.08, ln, 'steelL') for sx in (1, -1)]
        return o
    thick = {'path': 0.3, 'road': 0.7, 'wide': 0.9}[kind]
    o += [bx(0, -thick, 0, W, thick, ln, 'concrete'), bx(0, -0.001, 0, W - (0.3 if kind == 'path' else 0.9), 0.02, ln, 'asphalt' if kind != 'path' else 'concreteL')]
    if kind != 'path':
        o += [bx(sx*(W/2 - 0.45), 0.0, 0, 0.9, 0.2, ln, 'concreteL') for sx in (1, -1)]               # kerbs with a walking strip
        if kind == 'road': o += [bx(0, 0.02, z, 0.12, 0.01, 1.6, 'line') for z in (-1.4, 1.4)]
        else: o += [bx(x, 0.02, z, 0.12, 0.01, 1.6, 'line') for x in (-3.5, 3.5) for z in (-1.4, 1.4)] + [bx(0, 0.02, 0, 0.5, 0.18, ln, 'concreteD')]  # centre barrier
        o += [bx(sx*(W/2 - 0.1), 0.2, 0, 0.2, 0.9, ln, 'concreteD') for sx in (1, -1)]               # parapet
        o += [bx(sx*(W/2 - 0.1), 1.1, 0, 0.26, 0.1, ln, 'concreteL') for sx in (1, -1)]
        gd = thick + 0.5; o += [bx(x, -thick - 0.5, 0, 0.35, 0.5, ln, 'concreteD') for x in ([-W/3, 0, W/3] if kind == 'road' else [-W/3, -W/6, W/6, W/3])]   # girders
    else:
        o += [bx(sx*(W/2 - 0.05), 0, 0, 0.1, 0.08, ln, 'steelL') for sx in (1, -1)] + [bx(sx*(W/2 - 0.05), 0.0, z, 0.08, 1.1, 0.08, 'steel') for sx in (1, -1) for z in (-ln/2 + 0.1, 0.0)] + [bx(sx*(W/2 - 0.05), 1.05, 0, 0.1, 0.08, ln, 'steelL') for sx in (1, -1)] + [bx(sx*(W/2 - 0.05), 0.55, 0, 0.05, 0.05, ln, 'steel') for sx in (1, -1)]
    return o
for k in WID: reg('deck_' + k, deck(k), WID[k], L, 1.2, 'deck 4 m; surface at y = 0; a guard or parapet on each side' if k == 'road' else '')
def truss():
    W = WID['road']; o = deck('road')
    for sx in (1, -1):
        x = sx*(W/2 + 0.15); o += [bx(x, -0.4, 0, 0.3, 0.5, L, 'steel'), bx(x, 5.0, 0, 0.3, 0.4, L, 'steel')]
        o += [bx(x, 0.0, -L/2 + 0.12, 0.3, 5.4, 0.25, 'steel')]
        o += [seg([x, 0.0, -L/2 + 0.12], [x, 5.0, L/2 - 0.12], 0.1, 0.1, 0.1, 0.1, 'steelD', ax='y')]
    o += [bx(0, 5.0, -L/2 + 0.12, W, 0.25, 0.25, 'steel'), bx(0, 0.0, -L/2 + 0.12, W + 0.7, 0.3, 0.25, 'steelD')]
    return o
reg('truss_road', truss(), 7.0, L, 5.4, 'a through truss: sides rise 5 m; join end to end, the end frame is shared')
# piers
reg('pier_shaft_road_unit', [bx(0, 0, 0, 4.9, 1.0, 1.2, 'concrete')], 4.9, 1.2, 1.0, 'stretch in y; width is 0.7 of the road width')
reg('pier_shaft_wide_unit', [bx(0, 0, 0, 9.8, 1.0, 1.4, 'concrete')], 9.8, 1.4, 1.0, 'stretch in y')
reg('pier_shaft_path_unit', [bx(0, 0, 0, 0.5, 1.0, 0.5, 'concrete')], 0.5, 0.5, 1.0, 'stretch in y')
reg('pier_shaft_rail_unit', [bx(0, 0, 0, 3.4, 1.0, 1.2, 'concrete')], 3.4, 1.2, 1.0, 'stretch in y')
reg('pier_cap_road', [bx(0, -1.2, 0, 6.6, 0.5, 1.8, 'concreteD'), bx(0, -0.7, 0, 6.2, 0.1, 1.5, 'concrete')], 6.6, 1.8, 0.8, 'sits under the deck; the shaft stands below it')
reg('pier_cap_wide', [bx(0, -1.4, 0, 13.4, 0.6, 2.0, 'concreteD')], 13.4, 2.0, 0.6)
reg('pier_cap_rail', [bx(0, -1.2, 0, 4.6, 0.5, 1.8, 'concreteD')], 4.6, 1.8, 0.5)
reg('pier_cap_path', [bx(0, -0.6, 0, 1.0, 0.3, 0.8, 'concreteD')], 1.0, 0.8, 0.3)
def abutment(kind):
    W = WID[kind]; return [bx(0, -3.0, 0.0, W + 0.6, 3.0 + 0.0, 1.4, 'concreteD'), bx(0, -3.0, -1.6, W + 0.6, 3.0, 0.5, 'concrete')] + [bx(sx*(W/2 + 0.55), -3.0, -2.5, 0.5, 3.0, 4.0, 'concrete') for sx in (1, -1)] + [bx(0, -0.1, -1.0, W + 0.6, 0.12, 1.4, 'concreteL')]
for k in ('road', 'wide', 'rail', 'path'): reg('abutment_' + k, abutment(k), WID[k] + 1.6, 5.0, 3.0, 'bridge end: back wall and wing walls reach back along -Z; stretch in y to the real drop; the deck starts at z = +0.7')
reg('trestle_bent_unit', [bx(sx*1.8, 0, z, 0.35, 1.0, 0.35, 'timberD') for sx in (1, -1) for z in (-0.4, 0.4)] + [bx(0, 0.0, 0, 4.2, 0.3, 1.0, 'timber')] + [seg([-1.8, 0.0, 0.45], [1.8, 1.0, 0.45], 0.06, 0.06, 0.06, 0.06, 'timber', ax='x'), seg([1.8, 0.0, 0.45], [-1.8, 1.0, 0.45], 0.06, 0.06, 0.06, 0.06, 'timber', ax='x')], 4.2, 1.0, 1.0, 'a timber or steel trestle bent for viaducts and trestles; stretch in y')
# arch: a modular 8 m arch below the deck
def arch8():
    o = deck('road', 8.0)
    # spandrel walls either side with an arch opening (outline from the road down to the ground)
    for sx in (1, -1):
        o += [bx(sx*3.35, -7.0, -3.4, 0.4, 6.3, 1.1, 'concrete'), bx(sx*3.35, -7.0, 3.4, 0.4, 6.3, 1.1, 'concrete')]
        for i in range(0, 9):
            a = math.pi*i/8; z = -math.cos(a)*3.4; y = -7.0 + math.sin(a)*5.6
            o.append(box([sx*3.35, y - 0.35 + 0.0, z], [0.4, 0.7, 0.7], 'concreteD'))
        o.append(bx(sx*3.35, -1.4, 0, 0.4, 0.7, 7.0, 'concrete'))
    o.append(bx(0, -1.4, 0, 6.2, 0.7, 7.0, 'concreteD'))
    return o
reg('arch_road_8', arch8(), 7.0, 8.0, 7.7, 'an 8 m arch span: deck, spandrel walls, arch ring; the deck is 7 m above the springing; abut two for 16 m')
# suspension
reg('suspension_tower_road', [bx(sx*3.9, -1.0, 0, 0.9, 27.0, 1.3, 'steel') for sx in (1, -1)] + [bx(0, 20.0, 0, 8.7, 1.0, 1.1, 'steel'), bx(0, 5.0, 0, 8.7, 0.8, 1.1, 'steelD'), bx(0, 13.0, 0, 8.7, 0.8, 1.1, 'steelD'), bx(0, -1.5, 0, 8.7, 0.5, 1.6, 'concreteD')] + [bx(sx*3.9, 26.0, 0, 1.1, 0.5, 1.5, 'steelL') for sx in (1, -1)], 8.7, 1.6, 27.0, 'an H tower; the road passes between the legs; the cables sit on top at y = 26')
reg('suspension_hanger_road', [bx(sx*3.95, 0.1, 0, 0.06, 5.0, 0.06, 'cable') for sx in (1, -1)] + [bx(sx*3.95, 5.1, 0, 0.14, 0.14, L, 'cable') for sx in (1, -1)] + deck('road'), 7.0, L, 5.3, 'deck, a hanger each side and 4 m of main cable; the engine bends the cable height by its own sag (scale the hanger in y)')
reg('stay_pylon_road', [bx(sx*3.9, -1.0, 0, 0.8, 24.0, 1.0, 'concrete') for sx in (1, -1)] + [bx(0, 15.0, 0, 8.7, 0.9, 1.0, 'concrete')] + [seg([sx*3.9, 24.0, 0], [sx*3.9, 24.0, 0], 0.4, 0.5, 0.4, 0.5, 'concrete') for sx in (1, -1)], 8.7, 1.0, 24.0, 'a cable-stayed pylon; draw stays from y = 20 with seg lines to the deck')
reg('ramp_embankment_road_unit', [wedge([0, 0.5, 0], [11.0, 1.0, 4.0], 'dirt')] + [bx(sx*3.8, 0.0, 0, 0.12, 1.0, 4.0, 'concreteD') for sx in (1, -1)], 11.0, 4.0, 1.0, 'a fill bank under an approach ramp: top is 7 m wide at y = 1; stretch in y to the height; slopes fall away sideways')
# ---------------- tunnels, culverts, passages ----------------
def portal(kind):
    W = {'road': 9.0, 'rail': 6.4, 'path': 4.0}[kind]; H = {'road': 6.0, 'rail': 7.4, 'path': 3.4}[kind]; t = 0.8
    o = [bx(0, -0.3, 0, W + 4.0, 0.3, 3.0, 'concreteD')]
    o += [bx(sx*(W/2 + t/2), 0, 0, t, H + t, 1.4, 'concrete') for sx in (1, -1)] + [bx(0, H, 0, W, t, 1.4, 'concrete')]
    o += [bx(0, 0, -0.55, W, H, 0.2, 'dark')]
    o += [bx(sx*(W/2 + t + 0.7), -0.3, -0.5, 1.4, H*0.6 + 0.3, 3.4, 'concrete') for sx in (1, -1)]
    o += [bx(0, H + t, 0, W + 2*t + 0.2, 0.3, 1.6, 'concreteL')]
    if kind != 'path': o += [bx(0, 0.0, 0.2, W - 0.4, 0.04, 2.0, 'asphalt' if kind == 'road' else 'ballast')]
    o += [bx(sx*(W/2 - 0.2), H - 0.6, 0.6, 0.3, 0.3, 0.3, 'warn') for sx in (1, -1)]
    return o
for k in ('road', 'rail', 'path'): reg('portal_' + k, portal(k), {'road': 14.0, 'rail': 11.0, 'path': 9.0}[k], 3.4, {'road': 6.8, 'rail': 8.2, 'path': 4.2}[k], 'tunnel mouth facing +Z; the dark face is the bore and the ground rises behind and above it; wing walls splay out')
def lining(kind):
    W = {'road': 9.0, 'rail': 6.4, 'path': 4.0}[kind]; H = {'road': 6.0, 'rail': 7.4, 'path': 3.4}[kind]
    o = [bx(sx*(W/2 + 0.3), 0, 0, 0.6, H + 0.6, L, 'concreteD') for sx in (1, -1)] + [bx(0, H, 0, W + 1.2, 0.6, L, 'concreteD'), bx(0, -0.3, 0, W + 1.2, 0.3, L, 'concreteD')]
    o += [bx(0, H - 0.1, 0, 0.5, 0.1, 1.2, 'lamp')] + [bx(0, 0.0, 0, W - 0.2, 0.04, L, 'asphalt' if kind == 'road' else ('ballast' if kind == 'rail' else 'concreteL'))]
    o += [bx(sx*(W/2 - 0.05), 0.8, 0, 0.1, 0.1, L, 'warn') for sx in (1, -1)]
    return o
for k in ('road', 'rail', 'path'): reg('tunnel_lining_' + k, lining(k), {'road': 10.2, 'rail': 7.6, 'path': 5.2}[k], L, {'road': 6.6, 'rail': 8.0, 'path': 4.0}[k], 'four metres of tunnel inside: floor, walls, roof, a ceiling light, kerb reflectors; only seen when the ground is cut away')
reg('passage_frame', [bx(sx*2.6, 0, 0, 0.5, 4.8, 1.0, 'concrete') for sx in (1, -1)] + [bx(0, 4.0, 0, 5.7, 0.8, 1.0, 'concrete')], 5.7, 1.0, 4.8, 'a frame for a road or path through a building (building_passage)')
reg('culvert_headwall_pipe', [bx(0, -0.3, 0, 4.0, 0.3, 1.2, 'concreteD'), bx(0, 0, 0, 3.6, 1.6, 0.4, 'concrete'), bx(0, 1.6, 0, 3.8, 0.2, 0.5, 'concreteL')] + [bx(sx*2.2, 0, 0.2, 0.35, 1.6, 1.4, 'concrete') for sx in (1, -1)] + [cyl([0, 0.7, 0.05], [1.4, 0.5, 1.4], 'dark', ax='z')], 4.6, 1.4, 1.8, 'end wall with a 1.4 m round pipe opening (dark), facing +Z; put one at each end of a culvert')
reg('culvert_headwall_box', [bx(0, -0.3, 0, 5.0, 0.3, 1.4, 'concreteD'), bx(0, 0, 0, 4.6, 2.4, 0.4, 'concrete'), bx(0, 2.4, 0, 4.8, 0.2, 0.5, 'concreteL')] + [bx(sx*2.8, 0, 0.3, 0.4, 2.4, 1.8, 'concrete') for sx in (1, -1)] + [bx(0, 0.0, -0.2, 3.0, 1.8, 0.1, 'dark')], 5.6, 1.8, 2.6, 'end wall with a 3 m by 1.8 m box opening (dark), facing +Z')
reg('culvert_pipe_4m', [cyl([0, 0.9, 0], [1.8, L, 1.8], 'pipe', ax='z'), bx(0, 0.0, 0, 2.0, 0.1, L, 'concreteD')], 2.0, L, 1.9, 'four metres of 1.4 m pipe, seen where the ground is cut away')
# ---------------- dams and water works ----------------
def dam_earth(h=8.0, road=False):
    s = 2.5; cw = 8.0 if road else 6.0; W = cw + 2*h*s
    o = [hull([(-W/2, 0, -2), (W/2, 0, -2), (W/2, 0, 2), (-W/2, 0, 2), (-cw/2, h, -2), (cw/2, h, -2), (cw/2, h, 2), (-cw/2, h, 2)], 'dirt'),
         hull([(-W/2 + 0.0, 0.01, -2), (-cw/2 - h*s*0.55, 0.01, -2), (-cw/2 - h*s*0.55, 0.01, 2), (-W/2, 0.01, 2), (-cw/2 - h*s*0.0, h, -2), (-cw/2 - h*s*0.0, h, -2), (-cw/2 - 0.0, h, 2), (-cw/2, h, 2)], 'rock')]
    o += [bx(0, h, 0, cw - 0.6, 0.06, 4.0, 'asphalt' if road else 'gravel')] if road else [bx(0, h, 0, cw - 1.0, 0.06, 4.0, 'grass')]
    if road: o += [bx(sx*(cw/2 - 0.15), h, 0, 0.3, 0.8, 4.0, 'concreteD') for sx in (1, -1)]
    return o
reg('dam_earth_h8', dam_earth(8.0), 6.0 + 40.0, 4.0, 8.0, 'earth dam cross-section, 4 m along the crest (run it along z); crest 6 m wide, slopes 1:2.5, stone riprap on the water side (the -x side is upstream); scale y to the real height')
reg('dam_earth_road_h8', dam_earth(8.0, True), 8.0 + 40.0, 4.0, 8.0, 'the same with a 8 m crest carrying a road between parapets')
def dam_concrete(h=8.0, road=False):
    cw = 8.0 if road else 6.0; W = cw + h*0.9
    o = [hull([(-cw/2, 0, -2), (W - cw/2, 0, -2), (W - cw/2, 0, 2), (-cw/2, 0, 2), (-cw/2, h, -2), (cw/2, h, -2), (cw/2, h, 2), (-cw/2, h, 2)], 'concrete')]
    o += [bx(0, h, 0, cw, 0.5, 4.0, 'concreteL'), bx(-cw/2 + 0.15, h + 0.5, 0, 0.3, 0.9, 4.0, 'concreteD'), bx(cw/2 - 0.15, h + 0.5, 0, 0.3, 0.9, 4.0, 'concreteD')]
    o += [bx(0, 0.0, -2.0 + 0.0, W + 0.4, 0.4, 0.2, 'concreteD')]
    if road: o += [bx(0, h + 0.5, 0, cw - 1.0, 0.04, 4.0, 'asphalt')]
    return o
reg('dam_concrete_h8', dam_concrete(8.0), 14.0, 4.0, 9.4, 'concrete gravity dam: vertical upstream face (-x), sloped downstream face (+x), a parapet each side of the crest; scale y to the real height')
reg('dam_concrete_road_h8', dam_concrete(8.0, True), 16.0, 4.0, 9.4, 'the same with a road on the crest')
reg('dam_end_wall', [bx(0, 0, 0, 1.2, 10.0, 6.0, 'concreteD'), bx(0, 10.0, 0, 1.6, 0.3, 6.4, 'concreteL')], 1.6, 6.4, 10.3, 'the abutment wall where a dam meets the valley side; scale y')
reg('spillway_h8', [hull([(-3.0, 0, -4), (8.0, 0, -4), (8.0, 0, 4), (-3.0, 0, 4), (-3.0, 8.0, -4), (0.0, 8.0, -4), (0.0, 8.0, 4), (-3.0, 8.0, 4)], 'concreteL')] + [bx(0, 8.0, -4.2, 3.6, 3.0, 0.4, 'concreteD'), bx(0, 8.0, 4.2, 3.6, 3.0, 0.4, 'concreteD')], 11.0, 8.4, 11.0, 'an 8 m wide spillway chute over a dam; water slides down the slope towards +x; scale y')
reg('weir_step', [bx(0, -0.3, 0, 1.4, 0.9, 4.0, 'concrete'), bx(0.9, -0.3, 0, 0.8, 0.3, 4.0, 'concreteD'), bx(0, 0.58, 0, 1.4, 0.04, 4.0, 'concreteL')], 3.0, 4.0, 0.6, 'a 0.6 m step across a river, four metres of its width; the water drops over the +x edge; repeat across the river')
def lock_gate(state):
    W = 4.0; o = [bx(sx*(W/2 + 0.5), -1.0, 0, 1.0, 6.0, 1.4, 'concreteD') for sx in (1, -1)]
    if state == 'closed': o += [bx(sx*1.0, 0.0, 0, 2.0, 4.0, 0.3, 'steel') for sx in (1, -1)] + [bx(0, 3.8, 0, 4.0, 0.2, 0.3, 'steelD')]
    else: o += [bx(sx*(W/2 - 0.1), 0.0, 0.9, 0.3, 4.0, 1.6, 'steel') for sx in (1, -1)]
    o += [bx(sx*(W/2 + 0.5), 5.0, 0, 1.0, 0.4, 1.6, 'concreteL') for sx in (1, -1)]
    return o
for st in ('closed', 'open'): reg('lock_gate_' + st, lock_gate(st), 6.0, 1.8, 6.0, 'a 4 m wide lock chamber end with its mitre gates ' + st + '; the chamber runs along z')
reg('pier_deck', [bx(0, 0.0, 0, 3.0, 0.14, L, 'timber')] + [bx(0, -0.25, z, 3.0, 0.25, 0.3, 'timberD') for z in (-1.6, 1.6)] + [bx(sx*1.35, -2.5, z, 0.28, 2.5, 0.28, 'timberD') for sx in (1, -1) for z in (-1.8, 1.8)] + [bx(sx*1.45, 0.14, z, 0.1, 0.9, 0.1, 'timber') for sx in (1, -1) for z in (-1.9, 0.0, 1.9)] + [bx(sx*1.45, 0.9, 0, 0.1, 0.1, L, 'timber') for sx in (1, -1)], 3.0, L, 1.1, 'a jetty/pier deck 3 m wide on piles: surface at y = 0 (0.4 m over the water), piles reach 2.5 m down; the piles stretch in y if needed')
reg('pier_end', [bx(0, 0.0, 0, 5.0, 0.14, 5.0, 'timber')] + [bx(sx*2.3, -2.5, sz*2.3, 0.3, 2.5, 0.3, 'timberD') for sx in (1, -1) for sz in (1, -1)] + [bx(0, 0.14, 2.4, 5.0, 0.1, 0.1, 'timber'), bx(0.0, 0.14, -2.4, 5.0, 0.1, 0.1, 'timber')] + [bx(sx*2.4, 0.14, 0, 0.1, 0.8, 5.0, 'timber') for sx in (1, -1)], 5.0, 5.0, 1.0, 'a T head or end platform for a pier')
def mound(h=3.0, name='rock'):
    import random; R = random.Random(11); o = []
    o.append(hull([(-3.2, 0, -2), (3.2, 0, -2), (3.2, 0, 2), (-3.2, 0, 2), (-1.0, h, -1.7), (1.0, h, -1.7), (1.0, h, 1.7), (-1.0, h, 1.7)], 'rock'))
    for i in range(10):
        x = R.uniform(-2.8, 2.8); hz = h*(1 - abs(x)/3.4)*R.uniform(0.6, 1.0); z = R.uniform(-1.8, 1.8); s = R.uniform(0.5, 0.9)
        o.append(box([x, hz, z], [s, s*0.8, s], 'rockL' if i % 3 else 'rockD', ry=int(R.uniform(0, 4))))
    return o
reg('breakwater_mound_h3', mound(3.0), 6.4, 4.0, 3.2, 'a rubble breakwater, four metres long: sloping both sides to a rough crest; scale y and x together for a lower or higher mound')
reg('retaining_wall_unit', [bx(0, 0, 0, 0.5, 1.0, L, 'concrete'), bx(0, 1.0, 0, 0.7, 0.12, L, 'concreteL'), bx(0, -0.2, 0, 1.2, 0.2, L, 'concreteD')], 1.2, L, 1.1, 'a retaining wall unit, 4 m long, 1 m tall (y stretch to its height, 1.5 m by default); the earth stands on the -x side')
reg('ford_slab', [bx(0, -0.15, 0, 7.0, 0.2, L, 'concrete'), bx(0, 0.0, 0, 7.0, 0.04, L, 'concreteL')] + [bx(sx*3.7, 0.0, 0, 0.14, 1.1, 0.14, 'warn') for sx in (1, -1)] + [bx(sx*3.7, 0.7, 0, 0.18, 0.2, 0.14, 'rust') for sx in (1, -1)], 7.4, L, 1.1, 'a concrete slab across a shallow ford at road level, with a depth post each side; the water runs over it along x')
pack = {'name': 'structures', 'version': 1, 'style': 'boxes, wedges and hulls in flat colours; modular 4 m lengths', 'units': 'metres', 'facing': '+Z (the direction of travel)', 'pivot': 'centre of the piece at its own reference height (see each note)',
        'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': {'structures': M}, 'info': INFO,
        'rule': ('How the game uses it, per structures[].k from the map file: bridge and overpass: for each 4 m of the way lay deck_<kind> (path, road, wide, rail by the way) at the deck height, with pier_cap_<kind> and pier_shaft_<kind>_unit (stretched down to the ground) every '
                 'min(50 m, length/2) from the deck rule, abutment_<kind> at both ends where the deck leaves the ground, ramp_embankment_road_unit for an approach ramp; st picks the style: truss -> truss_road, arch -> arch_road_8 chained, suspension -> suspension_tower_road at both ends '
                 'and suspension_hanger_road between, cable-stayed -> stay_pylon_road with deck_<kind> between, trestle and viaduct -> trestle_bent_unit with deck_<kind>, anything else deck_<kind>. tunnel: portal_<kind> at each end and tunnel_lining_<kind> between while the '
                 'ground is cut; culvert: culvert_headwall_pipe or _box at each end and culvert_pipe_4m between; passage: passage_frame; ford: ford_slab; dam: dam_earth_h8 or dam_concrete_h8 (the _road variants when road is true) along the way scaled in y to h, dam_end_wall at the valley sides, '
                 'spillway_h8 where the data says; weir: weir_step across the river; lock and gate: lock_gate_open or _closed; pier: pier_deck with pier_end; breakwater: breakwater_mound_h3; wall: retaining_wall_unit stretched to h.')}
out, st = write_pack('structures', pack, __file__)
t = [v[0] for k, v in st.items()]; print(len(t), 'models', min(t), '-', max(t), 'triangles')
