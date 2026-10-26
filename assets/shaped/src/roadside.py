#!/usr/bin/env python3
"""Afterstreet roadside and odd buildings, version 1 (26 October 2026): the buildings Route 66 and the Ozarks left behind. Writes assets/shaped/roadside.js. Run: python3 assets/shaped/src/roadside.py

models.roadside.<name>, metres, origin at the centre of the footprint on the ground, front (the door and the pumps) facing +Z. Each is a whole building or landmark; info[name] has w (x), len (z), h, and a note.
Gas stations (the types the National Park Service describes, 1910s to 1960s): gas_shed, gas_house, gas_cottage, gas_mission, gas_box, gas_vee, gas_lighthouse, gas_modern; pumps vintage_pump_glass, vintage_pump_clock, pump_island_modern; canopy_cottage, canopy_flat, canopy_vee.
Roadside: diner_streamline, curb_canopy, motor_cabin, motor_court_row, motel_sign, drive_in_screen, drive_in_booth, drive_in_snack, speaker_post, tepee_shop, muffler_man, billboard, fruit_stand, phone_booth, bus_shelter.
Utility and odd: quonset_hut, water_tower, grain_elevator, mobile_home_single, mobile_home_double, container_shop, a_frame_cabin, dome_house, fire_tower.
Ozark vernacular: stone_cottage, log_cabin, springhouse, root_cellar, smokehouse, corn_crib, outhouse, cave_mouth, stone_gate.
Colour names are in the palette. Windows are dark glass; lit windows would be a game overlay."""
import math
from kit import *
P = {'white': '#ece8dc', 'cream': '#d8cfae', 'clap': '#c9c1a6', 'clapD': '#a89f84', 'brick': '#8a4a38', 'brickD': '#6a3828', 'stone': '#9a9484', 'stoneD': '#7a7466', 'stoneL': '#b4ae9c', 'fstone': '#8e8470', 'fstoneD': '#6e6654',
     'stucco': '#e0d2b0', 'stuccoD': '#b8aa88', 'tile': '#b4562c', 'tileD': '#8a4020', 'slate': '#4a5a6a', 'slateD': '#38465a', 'shingle': '#5a5048', 'shingleD': '#443c36', 'blue': '#2f5f9a', 'blueD': '#234a78', 'teal': '#3a8a82', 'tealD': '#2a6862',
     'red': '#b02e24', 'redD': '#80201a', 'yellow': '#e0b420', 'orange': '#d8741c', 'green': '#3a6a3a', 'greenD': '#2a4a2a', 'black': '#1c1d20', 'steel': '#6a7078', 'steelD': '#4a4e54', 'steelL': '#9aa0a6', 'alum': '#b8bcc0',
     'glass': '#2a3a46', 'glassL': '#5a7a8a', 'wood': '#9a7a52', 'woodD': '#6e5238', 'woodL': '#b8a07a', 'log': '#7a5a38', 'logD': '#5a4028', 'logE': '#b08a58', 'concrete': '#a8a69e', 'concreteD': '#807e76', 'asphalt': '#3a3c40',
     'tin': '#a4a8a8', 'tinD': '#7a7e80', 'rust': '#8a4a2a', 'canvas': '#d8d0b8', 'canvasD': '#b0a888', 'neon': '#e84a6a', 'neonB': '#3ab0e0', 'sky': '#7ab4d8', 'screen': '#e8eaea', 'earth': '#6a5036', 'sod': '#5a7a38', 'pink': '#d86a8a',
     'cabinWhite': '#e8e4d4', 'door': '#7a2a24', 'doorB': '#2a4a6a', 'chrome': '#c8ccd0', 'skin': '#b88a68', 'denim': '#3a5a8a', 'cap': '#e8e0c8'}
M = {}; INFO = {}
def reg(n, ps, w, ln, h, note=''): M[n] = ps; INFO[n] = {'w': round(w, 1), 'len': round(ln, 1), 'h': round(h, 1), **({'note': note} if note else {})}
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def tube(p0, p1, t, c): return seg(p0, p1, t/2, t/2, t/2, t/2, c)
def gable(w, d, y0, rise, rc, oh=0.4, ohz=0.3, along='z', cx=0, cz=0):
    """gable roof on a w x d footprint centred (cx, cz); along 'z' the ridge runs along z (the front shows the gable end), along 'x' it runs along x"""
    if along == 'z': hw, hd = w/2 + oh, d/2 + ohz; pts = [(-hw, y0, -hd), (hw, y0, -hd), (0, y0 + rise, -hd), (-hw, y0, hd), (hw, y0, hd), (0, y0 + rise, hd)]
    else: hw, hd = w/2 + ohz, d/2 + oh; pts = [(-hw, y0, -hd), (-hw, y0, hd), (-hw, y0 + rise, 0), (hw, y0, -hd), (hw, y0, hd), (hw, y0 + rise, 0)]
    pts = [(x + cx, y, z + cz) for x, y, z in pts]
    return [solid(pts, [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], rc)]
def hip(w, d, y0, rise, c, oh=0.4):
    hw, hd = w/2 + oh, d/2 + oh; rw = max(0.1, hw - rise*1.1); rd = max(0.1, hd - rise*1.1)
    return [hull([(-hw, y0, -hd), (hw, y0, -hd), (hw, y0, hd), (-hw, y0, hd), (-rw, y0 + rise, -rd), (rw, y0 + rise, -rd), (rw, y0 + rise, rd), (-rw, y0 + rise, rd)], c)]
def flatroof(w, d, y0, c, t=0.25, oh=0.2): return [bx(0, y0, 0, w + 2*oh, t, d + 2*oh, c)]
def win(x, y, w, h, z, c='glass'):   # front window with frame
    return [bx(x, y - 0.06, z, w + 0.16, h + 0.12, 0.06, 'white'), bx(x, y, z + 0.02, w, h, 0.05, c), bx(x, y, z + 0.05, 0.05, h, 0.03, 'white'), bx(x, y + h/2 - 0.02, z + 0.05, w, 0.05, 0.03, 'white')]
def winx(sx, x, y, w, h, z, c='glass'):  # window on a side wall at x=sx facing +/-x (w along z)
    f = 1 if sx > 0 else -1
    return [bx(sx + f*0.0, y - 0.06, z, 0.06, h + 0.12, w + 0.16, 'white'), bx(sx + f*0.02, y, z, 0.05, h, w, c)]
def door(x, z, c='door', w=0.95, h=2.1, y0=0): return [bx(x, y0, z, w + 0.2, h + 0.1, 0.06, 'white'), bx(x, y0, z + 0.03, w, h, 0.05, c), bx(x + w*0.36, y0 + 1.0, z + 0.07, 0.06, 0.06, 0.04, 'chrome')]
def chimney(x, z, y0, h, c='brick', w=0.7): return [bx(x, y0, z, w, h, w, c), bx(x, y0 + h, z, w + 0.14, 0.12, w + 0.14, 'concreteD')]
def steps(x, z, w, n=2, c='concrete'): return [bx(x, i*0.17, z + (n - i)*0.3 - 0.15, w, 0.17, 0.3, c) for i in range(n)]
def pump_modern(x, z, col='red'):
    return [bx(x, 0, z, 0.5, 1.5, 0.32, 'steelL'), bx(x, 1.1, z + 0.17, 0.4, 0.3, 0.03, 'glass'), bx(x, 1.5, z, 0.56, 0.12, 0.38, col), bx(x - 0.28, 0.8, z + 0.05, 0.05, 0.5, 0.05, 'black'), bx(x, 0, z, 0.56, 0.12, 0.38, 'concreteD')]
def island(x, z, n=2, col='red', len_=4.0):
    o = [bx(x, 0, z, 1.0, 0.18, len_, 'concrete'), bx(x, 0.18, z, 0.9, 0.02, len_ - 0.1, 'concreteD')]
    for i in range(n): o += pump_modern(x, z - len_/2 + (i + 0.5)*len_/n, col)
    return o
def sign_pole(x, z, h, w, hh, col, txt='yellow'):   # a station price/brand sign on a pole
    return [bx(x, 0, z, 0.2, h, 0.2, 'steelD'), bx(x, h, z, w, hh, 0.3, col), bx(x, h + 0.1, z + 0.17, w - 0.3, hh - 0.2, 0.03, txt, glow=True)]
# ============================================================ GAS STATIONS
vp = [bx(0, 0, 0, 0.5, 0.15, 0.5, 'concrete'), bx(0, 0.15, 0, 0.3, 1.5, 0.3, 'red'), bx(0, 1.6, 0, 0.36, 0.08, 0.36, 'red'), loft([[0, 1.68, 0, 0.16, 0.16], [0, 2.2, 0, 0.16, 0.16]], 'glassL', n=10), loft([[0, 1.8, 0, 0.12, 0.12], [0, 2.1, 0, 0.12, 0.12]], 'yellow', n=10), bx(0, 2.2, 0, 0.4, 0.1, 0.4, 'red'), bx(0, 0.15, 0.17, 0.2, 0.02, 0.02, 'chrome')]
reg('vintage_pump_glass', vp, 0.5, 0.5, 2.3, 'a 1920s visible pump: a red column with a glass cylinder on top that showed the petrol; put two at the kerb of gas_shed or gas_house')
vc = [bx(0, 0, 0, 0.5, 0.15, 0.5, 'concrete'), bx(0, 0.15, 0, 0.34, 1.35, 0.3, 'blue'), bx(0, 1.5, 0, 0.42, 0.34, 0.34, 'white'), loft([[0, 1.5, 0.16, 0.17, 0.17], [0, 1.52, 0.2, 0.17, 0.17]], 'white', ax='z', n=14), bx(0, 1.84, 0, 0.44, 0.1, 0.36, 'blue'), bx(0, 0.15, 0.16, 0.2, 0.02, 0.02, 'chrome')]
reg('vintage_pump_clock', vc, 0.5, 0.5, 2.0, 'a 1930s clock-face pump (the dial showed gallons): blue with a white head')
reg('pump_island_modern', island(0, 0), 1.0, 4.0, 1.7, 'a concrete island 1 by 4 m with two modern pumps: put it under a canopy')
def canopy(w, d, h, kind='flat', band='red'):
    o = [bx(sx, 0, sz, 0.35, h, 0.35, 'clap' if kind == 'cottage' else 'white') for sx in (-w/2 + 0.6, w/2 - 0.6) for sz in (-d/2 + 0.6, d/2 - 0.6)]
    if kind == 'flat': o += [bx(0, h, 0, w, 0.5, d, 'white'), bx(0, h + 0.1, d/2 + 0.01, w, 0.3, 0.04, band), bx(0, h + 0.1, -d/2 - 0.01, w, 0.3, 0.04, band)]
    elif kind == 'vee':   # a V-shaped roof (Phillips 66 style): two slabs rising to the edges
        for s in (-1, 1): o.append(hull([(s*w/2, h + 0.5, -d/2), (0, h, -d/2), (0, h, d/2), (s*w/2, h + 0.5, d/2), (s*w/2, h + 0.62, -d/2), (0, h + 0.12, -d/2), (0, h + 0.12, d/2), (s*w/2, h + 0.62, d/2)], 'white'))
        o.append(bx(0, h + 0.02, 0, 0.5, 0.3, d, band))
    else: o += [bx(0, h, 0, w, 0.3, d, 'clap')] + gable(w - 0.4, d, h + 0.3, 0.9, 'shingle', 0.3, 0.3, along='x')
    return o
reg('canopy_flat', canopy(10, 6, 4.4), 10, 6, 5.0, 'a flat pump canopy 10 by 6 m, a white fascia with a red band: pumps under it (gas_box, gas_modern)')
reg('canopy_vee', canopy(10, 6, 4.2, 'vee', 'orange'), 10, 6, 4.9, 'a V-roof canopy 10 by 6 m, 1950s to 1960s, with a stripe down the valley (gas_vee)')
reg('canopy_cottage', canopy(8, 5, 3.4, 'cottage'), 8, 5, 4.7, 'a gabled canopy 8 by 5 m that matches gas_house and gas_cottage (shingles, clapboard posts)')
def gas_shed():
    return [bx(0, 0, 0, 4.0, 2.7, 3.6, 'tin'), bx(0, 0, 0, 4.1, 0.3, 3.7, 'tinD'), *hip(4.0, 3.6, 2.7, 1.0, 'rust', 0.4), *door(-0.8, 1.83, 'doorB'), *win(0.9, 1.0, 1.2, 1.0, 1.83), *winx(2.0, 0, 1.0, 1.0, 1.0, 0),
            bx(0, 2.3, 1.85, 3.4, 0.5, 0.05, 'red'), bx(0, 2.35, 1.89, 2.8, 0.34, 0.03, 'white'), *chimney(-1.2, -0.8, 2.7, 1.2, 'steelD', 0.4), bx(0, 0, 3.0, 3.2, 0.1, 1.9, 'concrete')]
reg('gas_shed', gas_shed(), 4.8, 6.0, 3.9, 'a 1920s shed station, 4 by 3.6 m: a tin-clad office with a hip roof and a red name board; the kerb in front takes two vintage_pump_glass (x -1 and 1, z 3.4)')
def gas_house():
    w, d = 7.0, 9.0
    return [bx(0, 0, 0, w, 3.0, d, 'clap'), bx(0, 0, 0, w + 0.1, 0.4, d + 0.1, 'clapD'), *gable(w, d, 3.0, 2.2, 'shingle', 0.5, 0.5), *chimney(2.2, -2.0, 3.0, 3.0), *door(-1.8, d/2, 'doorB'),
            *win(1.4, 1.0, 1.8, 1.4, d/2), *win(-3.0, 1.0, 0.8, 1.4, d/2), *winx(w/2, 0, 1.0, 1.0, 1.4, -1.5), *winx(w/2, 0, 1.0, 1.0, 1.4, 1.5), *winx(-w/2, 0, 1.0, 1.0, 1.4, 0), bx(0, 2.9, d/2 + 0.06, 6.2, 0.5, 0.05, 'red'),
            *[bx(sx, 0, d/2 + 0.9, 0.2, 3.0, 0.2, 'white') for sx in (-w/2 + 0.4, w/2 - 0.4)], bx(0, 3.0, d/2 + 0.9, w, 0.3, 1.0, 'white'), bx(0, 0, d/2 + 0.9, w - 0.6, 0.12, 1.4, 'concrete')]
reg('gas_house', gas_house(), 8.4, 11.0, 5.3, 'a 1920s house-type station, 7 by 9 m: a gabled cottage with an open porch entry, chimney and clapboard; an office and a service room; add canopy_cottage and a pump island in front')
def gas_cottage():
    w, d = 6.0, 8.0
    o = [bx(0, 0, 0, w, 2.8, d, 'white'), *gable(w, d, 2.8, 3.4, 'blue', 0.4, 0.4), bx(0, 0, d/2 + 0.8, 3.0, 2.8, 1.6, 'white'), *gable(3.0, 1.6, 2.8, 2.4, 'blueD', 0.25, 0.25, cz=d/2 + 0.8)]
    o += door(0, d/2 + 1.62, 'doorB', 1.1, 2.1) + win(-2.1, 1.0, 1.2, 1.4, d/2) + win(2.0, 1.0, 1.4, 1.4, d/2) + winx(w/2, 0, 1.0, 1.0, 1.4, 0) + winx(-w/2, 0, 1.0, 1.0, 1.4, 0) + chimney(-1.8, -1.5, 2.8, 3.6, 'stone')
    return o + [bx(0, 3.5, d/2 + 1.64, 1.8, 0.55, 0.05, 'white'), bx(0, 3.55, d/2 + 1.68, 1.5, 0.35, 0.03, 'blue', glow=True)]
reg('gas_cottage', gas_cottage(), 7.0, 10.5, 5.4, 'a 1920s English cottage station (Pure Oil type): a steep blue roof, a gabled entry, a stone chimney, white walls, a lit sign over the door; add canopy_cottage in front')
def gas_mission():
    w, d = 9.0, 7.0
    o = [bx(0, 0, 0, w, 3.2, d, 'stucco'), bx(0, 0, 0, w + 0.2, 0.3, d + 0.2, 'stuccoD'), *hip(w, d, 3.2, 1.1, 'tile', 0.5), bx(0, 3.2, d/2 + 0.04, w, 1.2, 0.12, 'stucco'), bx(0, 4.4, d/2 + 0.04, 3.0, 0.5, 0.12, 'stucco'), bx(0, 4.9, d/2 + 0.04, 1.4, 0.4, 0.12, 'stucco'),
         bx(0, 2.4, d/2 + 0.7, 8.4, 0.25, 1.4, 'tile'), *[bx(sx, 0, d/2 + 1.3, 0.25, 2.4, 0.25, 'stuccoD') for sx in (-4.0, -1.4, 1.4, 4.0)]]
    o += [bx(sx, 0.9, d/2 + 0.04, 1.8, 1.8, 0.05, 'glass') for sx in (-2.8, 2.8)] + door(0, d/2, 'doorB', 1.0, 2.1)
    return o
reg('gas_mission', gas_mission(), 9.4, 9.2, 5.4, 'a 1930s Spanish Mission station, 9 by 7 m: stucco with a tile roof, a stepped parapet over the middle and a tiled arcade across the front with two bays; Route 66 motor-court style')
def gas_box():
    w, d = 10.0, 6.0
    o = [bx(0, 0, 0, w, 3.4, d, 'white'), bx(0, 1.1, d/2 + 0.02, w + 0.02, 0.22, 0.04, 'red'), bx(0, 1.5, d/2 + 0.02, w + 0.02, 0.1, 0.04, 'red'), bx(0, 3.4, 0, w + 0.3, 0.3, d + 0.3, 'white'), bx(0, 3.7, 0, w + 0.3, 0.1, d + 0.3, 'red'),
         bx(-2.8, 0.0, d/2 + 0.04, 3.6, 2.6, 0.05, 'glass'), bx(3.4, 0, d/2 + 0.04, 3.0, 2.8, 0.06, 'glassL'), *[bx(x, 0, d/2 + 0.07, 0.05, 2.8, 0.04, 'white') for x in (1.9, 2.9, 3.9, 4.9)]]
    return o + door(0.2, d/2, 'red', 1.0, 2.2) + [bx(0, 4.0, d/2 + 0.04, 3.4, 0.8, 0.06, 'red'), bx(0, 4.05, d/2 + 0.08, 3.0, 0.6, 0.03, 'white', glow=True)]
reg('gas_box', gas_box(), 10.6, 6.6, 4.8, 'a 1930s to 1940s box station (white porcelain, a red stripe, a flat roof with a coping, wide office glass, two glazed bay doors at x 3.4): a Streamline Moderne look; add canopy_flat in front')
def gas_vee():
    w, d = 11.0, 6.0
    o = [bx(0, 0, 0, w, 3.2, d, 'stoneL'), *[bx(-w/2 + 0.55 + i*1.1, 0, d/2 + 0.02, 0.04, 3.2, 0.03, 'stone') for i in range(10)], bx(0, 3.2, 0, w + 0.4, 0.3, d + 0.4, 'steelD'), bx(0, 3.5, d/2 + 0.1, 3.0, 0.9, 0.2, 'orange'), bx(0, 3.55, d/2 + 0.22, 2.6, 0.6, 0.03, 'white', glow=True)]
    o += [bx(-3.4, 0.2, d/2 + 0.04, 4.0, 2.5, 0.06, 'glass'), bx(3.6, 0.2, d/2 + 0.04, 3.2, 2.5, 0.06, 'glassL')] + door(0, d/2, 'orange', 1.1, 2.2)
    return o + [hull([(-w/2, 3.5, -d/2), (w/2, 3.5, -d/2), (w/2, 3.5, d/2 + 0.6), (-w/2, 3.5, d/2 + 0.6), (-w/2 - 0.2, 3.9, -d/2), (w/2 + 0.2, 3.9, -d/2), (w/2 + 0.2, 4.1, d/2 + 0.6), (-w/2 - 0.2, 4.1, d/2 + 0.6)], 'steel')]
reg('gas_vee', gas_vee(), 11.4, 6.8, 4.5, 'a 1950s to 1960s stylized box station: pale concrete block with a folded steel roof that flares at the front, large glass and an orange sign; pair it with canopy_vee')
def gas_lighthouse():
    o = [bx(0, 0, 0, 7.0, 3.0, 8.0, 'white'), *gable(7.0, 8.0, 3.0, 2.0, 'red', 0.4, 0.4, along='x'), *door(-1.0, 4.0, 'door'), *win(-2.4, 1.0, 1.2, 1.4, 4.0), *win(1.6, 1.0, 1.8, 1.4, 4.0), *winx(3.5, 0, 1.0, 1.0, 1.4, 0)]
    return o + [loft([[-5.4, 0, 1.0, 1.6, 1.6], [-5.4, 4.0, 1.0, 1.45, 1.45], [-5.4, 8.0, 1.0, 1.2, 1.2], [-5.4, 10.0, 1.0, 1.1, 1.1]], 'white', n=12), loft([[-5.4, 2.0, 1.0, 1.55, 1.55], [-5.4, 2.6, 1.0, 1.5, 1.5]], 'red', n=12), loft([[-5.4, 5.8, 1.0, 1.3, 1.3], [-5.4, 6.4, 1.0, 1.28, 1.28]], 'red', n=12),
                loft([[-5.4, 10.0, 1.0, 1.25, 1.25], [-5.4, 10.2, 1.0, 1.25, 1.25]], 'black', n=12), loft([[-5.4, 10.2, 1.0, 0.8, 0.8], [-5.4, 11.4, 1.0, 0.8, 0.8]], 'glassL', n=12, glow=True), loft([[-5.4, 11.4, 1.0, 1.05, 1.05], [-5.4, 12.0, 1.0, 0.1, 0.1]], 'red', n=12)]
reg('gas_lighthouse', gas_lighthouse(), 12.2, 8.8, 12.0, 'a programmatic station (1930s): a house with a 12 m red-banded lighthouse beside it (x -5.4), its lamp lit at night: a landmark, not a common sight')
def gas_modern():
    w, d = 14.0, 9.0
    o = [bx(0, 0, 0, w, 3.6, d, 'brick'), bx(0, 3.6, 0, w + 0.4, 0.5, d + 0.4, 'white'), bx(0, 3.6, d/2 + 0.22, w + 0.4, 0.5, 0.05, 'red'), bx(0, 0, d/2 + 0.04, 9.0, 2.8, 0.06, 'glass'), bx(0, 2.8, d/2 + 0.07, 9.0, 0.06, 0.04, 'alum'),
         *[bx(-4.5 + i*1.5, 0, d/2 + 0.07, 0.06, 2.8, 0.04, 'alum') for i in range(7)], bx(5.5, 0, d/2 + 0.03, 1.8, 2.3, 0.06, 'glassL'), bx(5.5, 2.3, d/2 + 0.04, 2.0, 0.1, 0.05, 'alum')]
    return o + [bx(sx, 0, d/2 + 0.04, 0.4, 3.6, 0.06, 'brickD') for sx in (-w/2 + 0.2, w/2 - 0.2)]
reg('gas_modern', gas_modern(), 14.4, 9.4, 4.2, 'a 1990s to 2010s convenience store, 14 by 9 m: brick with a white fascia and a red band, full shopfront glass; pair it with canopy_flat, pump_island_modern and sign_pylon from autotrade')
# ============================================================ ROADSIDE
def diner():
    w, d = 14.0, 8.0
    return [bx(0, 0, 0, w, 3.2, d, 'white'), bx(0, 3.2, 0, w + 0.2, 0.3, d + 0.2, 'red'), bx(0, 3.5, 0, w - 1.0, 0.8, d - 1.0, 'white'), bx(0, 1.0, d/2 + 0.02, w + 0.02, 0.24, 0.04, 'red'), bx(0, 1.55, d/2 + 0.02, w + 0.02, 0.08, 0.04, 'chrome'),
            bx(-1.0, 0, d/2 + 0.04, 10.0, 0.9, 0.04, 'steelL'), bx(-1.0, 1.7, d/2 + 0.04, 11.0, 1.4, 0.05, 'glass'), *[bx(-6 + i*2.2, 1.7, d/2 + 0.07, 0.07, 1.4, 0.04, 'chrome') for i in range(6)], *door(6.0, d/2, 'steel', 1.1, 2.2),
            bx(0, 4.3, d/2 - 0.5, 8.0, 1.2, 0.2, 'red'), bx(0, 4.4, d/2 - 0.38, 7.0, 0.8, 0.06, 'white', glow=True), bx(-w/2 - 0.03, 1.7, 0, 0.05, 1.4, 5.0, 'glass')]
reg('diner_streamline', diner(), 14.2, 8.4, 5.6, 'a 1950s streamline diner, 14 by 8 m: white with a red band, a chrome stripe and a long window, a raised roof lantern and a lit sign; the Steak n Shake type (see curb_canopy)')
def curb_canopy():
    o = [bx(0, 3.2, 0, 14.0, 0.3, 3.2, 'white'), bx(0, 3.5, 0, 14.0, 0.1, 3.2, 'red'), *[bx(sx, 0, -1.4, 0.16, 3.2, 0.16, 'steelL') for sx in (-6.5, -2.2, 2.2, 6.5)]]
    for x in (-5.4, -2.7, 0, 2.7, 5.4): o += [bx(x, 0, 1.0, 0.1, 1.5, 0.1, 'steelD'), bx(x, 1.3, 1.0, 0.5, 0.35, 0.08, 'red'), bx(x, 1.37, 1.05, 0.35, 0.2, 0.03, 'white')]
    return o
reg('curb_canopy', curb_canopy(), 14.0, 3.2, 3.6, 'a carhop curb canopy 14 by 3.2 m with five order posts (menu panel and button): place along the front of diner_streamline or a drive-in; five stalls of 2.7 m')
def motor_cabin():
    return [bx(0, 0, 0, 4.0, 2.7, 4.5, 'cabinWhite'), *gable(4.0, 4.5, 2.7, 1.6, 'green', 0.4, 0.4, along='x'), *door(-0.9, 2.25, 'door', 0.9, 2.0), *win(0.9, 0.9, 1.1, 1.0, 2.25), bx(0, 0, 2.7, 3.0, 0.15, 0.9, 'concrete'), *chimney(1.2, -1.0, 2.7, 1.3, 'stone', 0.5), bx(0, 2.5, 2.27, 4.0, 0.22, 0.06, 'greenD')]
reg('motor_cabin', motor_cabin(), 4.8, 5.4, 4.3, 'a 1930s tourist cabin 4 by 4.5 m with a green gable roof, a small stoop and a stone chimney; line them up with a 1 m gap, as at Rockwood Motor Court')
def motor_court_row():
    o = [bx(0, 0, 0, 24.0, 3.0, 5.0, 'stucco'), *hip(24, 5, 3.0, 1.2, 'tile', 0.6), bx(0, 0, 2.9, 24.0, 0.15, 1.0, 'concrete')]
    for i in range(6):
        x = -10.0 + i*4.0; o += door(x - 0.5, 2.5, 'door' if i % 2 else 'doorB', 0.9, 2.0) + win(x + 1.0, 0.9, 1.0, 1.1, 2.5)
    return o + [bx(sx, 0, 3.2, 0.18, 2.6, 0.18, 'white') for sx in (-11.8, -4, 4, 11.8)] + [bx(0, 2.6, 3.2, 24.0, 0.25, 0.4, 'white')]
reg('motor_court_row', motor_court_row(), 25.2, 7.0, 5.0, 'a 1950s motel row, 24 by 5 m: six rooms with doors and windows under a tiled hip roof and a covered walk; the rooms are in the building kit, not here')
def motel_sign():
    return [bx(0, 0, 0, 0.3, 6.0, 0.3, 'steelD'), bx(0, 6.0, 0, 2.6, 1.6, 0.3, 'white'), bx(0, 6.1, 0.17, 2.2, 0.7, 0.04, 'neon', glow=True), bx(0, 6.9, 0.17, 2.2, 0.5, 0.04, 'neonB', glow=True), bx(0, 4.3, 0, 2.0, 1.4, 0.2, 'white'), bx(0, 4.9, 0.12, 1.8, 0.6, 0.04, 'yellow', glow=True)]
reg('motel_sign', motel_sign(), 2.6, 0.4, 7.6, 'a neon motel sign on a 6 m pole: a pink name panel, a blue band and a yellow VACANCY board; the glow parts light at night')
def drive_in_screen():
    return [bx(0, 0, 0, 26.0, 11.0, 0.5, 'screen'), bx(0, 0, -0.35, 27.0, 11.8, 0.2, 'white'), bx(0, 11.0, 0, 27.0, 0.8, 0.9, 'steel'), *[bx(sx, 0, -1.2, 0.4, 11.0, 0.5, 'steelD') for sx in (-12, -6, 0, 6, 12)], *[tube([sx, 0, -1.6], [sx*0.9, 10.4, -0.4], 0.12, 'steel') for sx in (-12.5, 12.5)], bx(0, 11.8, 0, 22.0, 1.2, 0.3, 'red'), bx(0, 11.85, 0.17, 20.0, 0.8, 0.05, 'white', glow=True)]
reg('drive_in_screen', drive_in_screen(), 27.0, 3.2, 13.0, 'a drive-in screen 26 by 11 m, a white face on a steel frame with a lit name board (fronts +z); cars park in arcs in front of it')
reg('drive_in_booth', [bx(0, 0, 0, 3.0, 2.6, 3.0, 'brick'), bx(0, 2.6, 0, 3.4, 0.2, 3.4, 'red'), bx(0, 0.9, 1.52, 1.4, 1.0, 0.05, 'glass'), *door(-0.8, 1.52, 'door', 0.8, 1.9), bx(0, 2.7, 2.1, 3.4, 0.14, 2.2, 'red'), *[bx(sx, 0, 3.0, 0.1, 2.7, 0.1, 'white') for sx in (-1.6, 1.6)], bx(0, 2.8, 3.1, 3.0, 0.5, 0.05, 'white', glow=True)], 3.4, 5.0, 3.4, 'a ticket booth 3 by 3 m with a red roof that extends to a drive-through canopy')
reg('drive_in_snack', [bx(0, 0, 0, 12.0, 3.4, 8.0, 'cream'), bx(0, 3.4, 0, 12.8, 0.3, 8.8, 'red'), *[bx(x, 1.0, 4.02, 2.6, 1.4, 0.06, 'glass') for x in (-3.5, 0, 3.5)], bx(0, 2.4, 4.4, 11.0, 0.12, 1.0, 'red'), bx(0, 1.0, 4.6, 11.0, 0.12, 0.7, 'woodD'), bx(0, 3.7, 3.9, 6.0, 1.2, 0.2, 'red'), bx(0, 3.75, 4.02, 5.4, 0.8, 0.04, 'white', glow=True)], 12.8, 9.0, 4.9, 'a drive-in snack bar 12 by 8 m: three serving windows under an awning with a counter, a lit sign on the roof')
reg('speaker_post', [bx(0, 0, 0, 0.1, 1.1, 0.1, 'steelD'), bx(0, 1.05, 0, 0.3, 0.3, 0.2, 'steel'), tube([0, 0.8, 0.1], [0.2, 0.75, 0.3], 0.03, 'black')], 0.3, 0.2, 1.4, 'a drive-in speaker post: a bell speaker on a 1.1 m post (the game can use it as a sound source)')
def tepee_shop():
    o = [loft([[0, 0, 0, 3.4, 3.4], [0, 2.0, 0, 2.2, 2.2], [0, 4.6, 0, 0.8, 0.8], [0, 6.0, 0, 0.12, 0.12]], 'canvas', n=12), loft([[0, 2.4, 0, 2.85, 2.85], [0, 2.6, 0, 2.8, 2.8]], 'red', n=12), loft([[0, 3.6, 0, 1.8, 1.8], [0, 3.8, 0, 1.75, 1.75]], 'blue', n=12)]
    o += [tube([0.2*math.cos(a), 5.9, 0.2*math.sin(a)], [0.9*math.cos(a), 7.6, 0.9*math.sin(a)], 0.08, 'wood') for a in [i*math.pi/3 for i in range(6)]]
    return o + [bx(0, 0, 3.2, 1.2, 2.0, 0.1, 'door'), bx(0, 2.6, 2.9, 2.0, 0.6, 0.1, 'red'), bx(0, 2.65, 2.97, 1.7, 0.4, 0.03, 'white', glow=True)]
reg('tepee_shop', tepee_shop(), 7.0, 7.0, 7.6, 'a programmatic tepee souvenir shop (the Route 66 type): a 7 m canvas cone with painted bands and crossed poles, a door and sign on +z')
reg('muffler_man', [bx(-0.25, 0, 0, 0.45, 3.6, 0.5, 'denim'), bx(0.25, 0, 0, 0.45, 3.6, 0.5, 'denim'), bx(0, 3.6, 0, 1.2, 2.8, 0.7, 'white'), bx(0, 3.6, 0.36, 1.2, 0.16, 0.04, 'red'), bx(0, 6.4, 0, 1.0, 0.5, 0.6, 'skin'), loft([[0, 6.9, 0, 0.5, 0.5], [0, 7.4, 0, 0.45, 0.45]], 'skin', n=8), bx(0, 7.3, 0, 1.0, 0.3, 1.0, 'cap'), bx(0, 7.6, 0, 0.9, 0.2, 0.9, 'cap'),
                    bx(-0.85, 3.9, 0, 0.35, 2.3, 0.4, 'white'), bx(0.85, 5.1, 0.3, 0.35, 0.35, 1.0, 'white'), bx(0.8, 5.0, 1.2, 0.4, 0.5, 0.4, 'skin'), tube([0.8, 5.1, 1.1], [0.8, 6.8, 1.1], 0.14, 'steel'), bx(0, 0, 0, 1.6, 0.2, 1.1, 'concrete')], 2.4, 1.6, 7.8,
    'a Muffler Man, the 7.5 m fibreglass giant that stood by Route 66 garages and diners: white shirt, cap, a pipe held in the raised hand; a landmark that should not be common')
reg('billboard', [*[bx(sx, 0, -0.4, 0.4, 8.0, 0.4, 'steelD') for sx in (-4, 4)], bx(0, 6.0, 0, 14.0, 4.0, 0.3, 'steel'), bx(0, 6.1, 0.17, 13.4, 3.6, 0.05, 'screen'), bx(0, 9.9, 0, 14.0, 0.2, 0.7, 'steelD'), bx(0, 5.3, 0.4, 14.0, 0.15, 0.7, 'steelD')], 14.2, 1.2, 10.1,
    'a roadside billboard 14 by 4 m on two steel posts with a catwalk, a pale blank face: stick a decal on it (the panel is x 13.4 by y 3.6 at z 0.17)')
reg('fruit_stand', [bx(0, 0, 0, 4.0, 0.9, 1.6, 'wood'), *[bx(sx, 0, -0.8, 0.12, 2.6, 0.12, 'woodD') for sx in (-1.9, 1.9)], *[bx(sx, 0, 0.8, 0.12, 2.2, 0.12, 'woodD') for sx in (-1.9, 1.9)], bx(0, 2.3, 0, 4.4, 0.1, 2.0, 'red'), bx(0, 2.4, 0.9, 4.4, 0.45, 0.06, 'white'),
                    *[bx(x, 0.9, 0.1, 0.5, 0.2, 0.5, 'orange') for x in (-1.2, -0.4)], *[bx(x, 0.9, 0.1, 0.5, 0.2, 0.5, 'red') for x in (0.4, 1.2)], bx(0, 0, -0.9, 4.0, 1.6, 0.06, 'woodD')], 4.4, 2.0, 2.8, 'a roadside produce stand 4 by 1.6 m: a counter, four posts, a red awning; crates of apples and oranges')
reg('phone_booth', [bx(0, 0, 0, 1.0, 0.1, 1.0, 'concrete'), *[bx(sx, 0.1, sz, 0.08, 2.1, 0.08, 'red') for sx in (-0.46, 0.46) for sz in (-0.46, 0.46)], bx(0, 2.15, 0, 1.0, 0.18, 1.0, 'red'), bx(0, 0.1, -0.46, 0.9, 2.0, 0.04, 'redD'), *[bx(sx, 0.7, 0, 0.04, 1.3, 0.8, 'glassL') for sx in (-0.46, 0.46)], bx(0, 1.2, -0.38, 0.3, 0.4, 0.1, 'steelD')], 1.0, 1.0, 2.3,
    'a red phone booth with a phone on the back wall (a dead payphone: a place to look for coins)')
reg('bus_shelter', [bx(0, 2.5, 0, 3.4, 0.12, 1.6, 'steel'), *[bx(sx, 0, -0.7, 0.1, 2.5, 0.1, 'steelD') for sx in (-1.6, 1.6)], bx(0, 0, -0.74, 3.2, 2.4, 0.05, 'glassL'), bx(-1.6, 0, 0, 0.05, 2.4, 1.4, 'glassL'), bx(0, 0.45, -0.5, 2.4, 0.08, 0.5, 'wood'), bx(-0.3, 0, -0.45, 0.06, 0.45, 0.06, 'steelD'), bx(0.9, 0, -0.45, 0.06, 0.45, 0.06, 'steelD')], 3.4, 1.7, 2.7,
    'a bus shelter 3.4 m wide with a bench, a roof and two glass sides')
# ============================================================ UTILITY AND ODD
def quonset():
    n = 11; arc = [(math.cos(math.pi*i/(n - 1))*5.0, math.sin(math.pi*i/(n - 1))*4.4) for i in range(n)]
    pts = [(x, y, z) for z in (-9.0, 9.0) for x, y in arc]
    faces = [[i, i + 1, n + i + 1, n + i] for i in range(n - 1)] + [list(range(n))[::-1], list(range(n, 2*n))]
    return [solid(pts, faces, 'tin'), bx(0, 0, 9.0, 3.6, 3.2, 0.12, 'tinD'), bx(0, 0, 9.07, 3.5, 3.1, 0.06, 'steelD'), bx(0, 0, 9.12, 0.05, 3.1, 0.03, 'black')]
reg('quonset_hut', quonset(), 10.0, 18.3, 4.4, 'a 1940s Quonset hut 10 m wide, 18 m long, arched corrugated steel with a big front door: a shop, storage or a church; the interior is a single room')
def water_tower():
    o = [loft([[0, 20.0, 0, 3.2, 3.2], [0, 22.0, 0, 5.0, 5.0], [0, 25.0, 0, 5.0, 5.0], [0, 26.8, 0, 3.5, 3.5], [0, 28.0, 0, 0.3, 0.3]], 'steelL', n=16), loft([[0, 23.2, 0, 5.04, 5.04], [0, 24.2, 0, 5.04, 5.04]], 'red', n=16), bx(0, 0, 0, 0.5, 20.0, 0.5, 'steelD')]
    for i in range(6):
        a = i*math.pi/3; o.append(tube([math.cos(a)*4.4, 0, math.sin(a)*4.4], [math.cos(a)*3.0, 20.2, math.sin(a)*3.0], 0.4, 'steelD'))
    for y in (7, 13):
        r = 4.4 - y*0.07
        for i in range(6): a, b = i*math.pi/3, (i + 1)*math.pi/3; o.append(tube([math.cos(a)*r, y, math.sin(a)*r], [math.cos(b)*r, y, math.sin(b)*r], 0.2, 'steelD'))
    return o
reg('water_tower', water_tower(), 10.0, 10.0, 28.0, 'a 28 m steel water tower: a 5 m radius tank on six legs with ring braces, a red band for the name, a central riser; a landmark, and a place to climb')
def grain_elevator():
    o = [bx(0, 0, 0, 9.0, 12.0, 6.0, 'concreteD'), bx(0, 12.0, 0.5, 9.0, 10.0, 2.4, 'concreteD'), bx(0, 22.0, -0.3, 9.5, 1.2, 3.2, 'tin'), bx(0, 23.2, -0.3, 8.0, 2.6, 2.6, 'tinD'), *gable(8.0, 2.6, 25.8, 1.4, 'steelD', 0.2, 0.2, along='x', cz=-0.3),
         bx(0, 0, 3.0, 5.0, 3.5, 0.2, 'wood'), bx(0, 0, 3.1, 0.05, 3.5, 0.05, 'black'), bx(0, 10.0, 3.02, 5.0, 1.4, 0.05, 'white'), bx(0, 10.3, 3.06, 4.0, 0.8, 0.03, 'red')]
    return o + [loft([[x, 0, -1.0, 1.1, 1.1], [x, 22.0, -1.0, 1.1, 1.1]], 'concrete', n=12) for x in (-3.4, -1.1, 1.1, 3.4)]
reg('grain_elevator', grain_elevator(), 9.5, 7.0, 27.2, 'a concrete grain elevator 27 m tall: four tubular bins, a work house and a rooftop cupola, a truck door at the foot (the prairie skyscraper; at the rail line)')
def mobile(double=False):
    w, d = (7.4 if double else 3.8), 18.0
    o = [bx(0, 0.5, 0, w, 2.3, d, 'cream'), bx(0, 0, 0, w - 0.2, 0.5, d - 0.2, 'concreteD'), bx(0, 2.8, 0, w + 0.2, 0.2, d + 0.2, 'tin'), bx(0, 0.5, d/2 + 0.02, w, 0.15, 0.04, 'clapD'), bx(0, 0.5, d/2 + 0.04, 0.95, 2.0, 0.05, 'doorB'), bx(0, 0, d/2 + 0.5, 1.8, 0.5, 1.0, 'wood')]
    o += [bx(w/2 + 0.02, 1.4, z, 0.05, 1.0, 1.4, 'glass') for z in (-4, -1, 3)] + [bx(-w/2 - 0.02, 1.4, z, 0.05, 1.0, 1.4, 'glass') for z in (-4, 2)]
    return o + ([bx(0, 3.0, 0, 0.3, 0.12, d, 'tinD')] if double else [])
reg('mobile_home_single', mobile(), 4.2, 18.0, 3.0, 'a single-wide mobile home 3.8 by 18 m, tin roof, skirting, a wooden step: door on the narrow end (+z), the long side runs along z; the commonest home in many Ozark counties')
reg('mobile_home_double', mobile(True), 7.8, 18.0, 3.1, 'a double-wide mobile home 7.4 by 18 m with a ridge seam down the roof')
reg('container_shop', [bx(0, 0, 0, 2.5, 2.6, 12.0, 'blue'), bx(0, 2.6, 0, 2.5, 0.1, 12.0, 'blueD'), bx(0, 0, 6.02, 2.4, 2.4, 0.05, 'steelD'), bx(0, 0, 6.05, 0.05, 2.4, 0.04, 'black'), *[bx(1.27, 0.8, z, 0.05, 1.2, 2.4, 'glass') for z in (-2, 2)], *[bx(0, 0, z, 2.6, 0.12, 0.12, 'steelD') for z in (-6.0, 6.0)], bx(1.6, 1.8, 0, 0.1, 0.6, 3.0, 'red'), bx(1.65, 1.85, 0, 0.04, 0.4, 2.6, 'white', glow=True)], 2.8, 12.2, 2.8,
    'a 12 m shipping container used as a shop or a home: hatch windows on the right (+x) side, a door at the end, a lit sign; stack two or three for a larger building')
def a_frame():
    w, d = 6.0, 7.0
    return [solid([(-w/2 - 0.2, 0.0, -d/2), (w/2 + 0.2, 0.0, -d/2), (0, 6.0, -d/2), (-w/2 - 0.2, 0.0, d/2), (w/2 + 0.2, 0.0, d/2), (0, 6.0, d/2)], [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], 'wood'), bx(0, 0, d/2 + 0.03, 1.3, 2.1, 0.05, 'door'), bx(0, 3.0, d/2 + 0.03, 1.0, 1.8, 0.05, 'glass'),
            bx(0, 0, d/2 + 0.9, 3.0, 0.3, 1.8, 'wood'), *[bx(sx, 0, d/2 + 1.6, 0.14, 2.6, 0.14, 'woodD') for sx in (-1.5, 1.5)], *chimney(1.8, -2.0, 1.0, 5.4, 'steelD', 0.35)]
reg('a_frame_cabin', a_frame(), 6.6, 8.6, 6.5, 'an A-frame cabin 6 by 7 m: steep roof planes to the ground, a glass gable end with a deck, a stove pipe: a holiday cabin by the lakes')
reg('dome_house', [loft([[0, 0, 0, 5.0, 5.0], [0, 1.2, 0, 4.8, 4.8], [0, 2.4, 0, 4.2, 4.2], [0, 3.4, 0, 3.3, 3.3], [0, 4.3, 0, 2.2, 2.2], [0, 4.9, 0, 1.0, 1.0], [0, 5.0, 0, 0.1, 0.1]], 'white', n=12), bx(0, 0, 4.4, 1.2, 2.0, 0.6, 'white'), bx(0, 0, 4.72, 0.9, 1.9, 0.05, 'door'), bx(2.6, 1.3, 2.6, 1.2, 1.0, 0.1, 'glass'), bx(-2.6, 1.3, 2.6, 1.2, 1.0, 0.1, 'glass'), bx(0, 2.2, 3.5, 1.2, 0.9, 0.1, 'glass')],
    10.0, 10.0, 5.0, 'a geodesic dome house, 10 m across and 5 m high: a white faceted shell with a small entry porch and three windows (a 1970s back-to-the-land build)')
def fire_tower():
    o = [tube([sx*3.0, 0, sz*3.0], [sx*1.1, 18.0, sz*1.1], 0.3, 'steelD') for sx in (-1, 1) for sz in (-1, 1)]
    for y in (4, 8, 12, 16):
        r = 3.0 - y*(1.9/18)
        o += [tube([-r, y, -r], [r, y, -r], 0.15, 'steel'), tube([-r, y, r], [r, y, r], 0.15, 'steel'), tube([-r, y, -r], [-r, y, r], 0.15, 'steel'), tube([r, y, -r], [r, y, r], 0.15, 'steel')]
    for y, r0, r1 in ((0, 3.0, 2.4), (4, 2.4, 1.9), (8, 1.9, 1.5), (12, 1.5, 1.2)): o += [tube([-r0, y, -r0], [r1, y + 4, -r1], 0.1, 'steel'), tube([r0, y, r0], [-r1, y + 4, r1], 0.1, 'steel')]
    return o + [bx(0, 18.0, 0, 2.8, 0.2, 2.8, 'wood'), bx(0, 18.2, 0, 2.2, 2.0, 2.2, 'clap'), bx(0, 18.9, 1.12, 1.8, 0.9, 0.05, 'glass'), bx(0, 18.9, -1.12, 1.8, 0.9, 0.05, 'glass'), bx(1.12, 18.9, 0, 0.05, 0.9, 1.8, 'glass'), bx(-1.12, 18.9, 0, 0.05, 0.9, 1.8, 'glass'), *hip(2.2, 2.2, 20.2, 0.9, 'shingle', 0.4)]
reg('fire_tower', fire_tower(), 6.4, 6.4, 21.3, 'a steel fire lookout tower 18 m high with a cab and a catwalk, braced and tapering: for ridges and state forest; the player can climb it for a view')
# ============================================================ OZARK VERNACULAR
def stone_cottage():
    w, d = 7.0, 8.0
    return [bx(0, 0, 0, w, 3.0, d, 'fstone'), *[bx(0, 0.3 + i*0.5, d/2 + 0.01, w, 0.04, 0.03, 'fstoneD') for i in range(5)], *gable(w, d, 3.0, 2.4, 'shingle', 0.5, 0.5, along='x'), *chimney(-w/2 - 0.2, 0.0, 0.0, 6.0, 'fstone', 1.0), *door(1.0, d/2, 'door', 1.0, 2.1),
            *win(-1.8, 1.1, 1.2, 1.2, d/2), *win(2.8, 1.1, 1.0, 1.2, d/2), *winx(w/2, 0, 1.1, 1.0, 1.2, 0), bx(0, 0, d/2 + 0.9, 3.0, 0.2, 1.8, 'stoneD'), bx(0, 2.7, d/2 + 0.9, 3.0, 0.15, 1.8, 'shingle'), *[bx(sx, 0, d/2 + 1.7, 0.14, 2.7, 0.14, 'woodD') for sx in (-1.4, 1.4)]]
reg('stone_cottage', stone_cottage(), 8.2, 10.0, 6.0, 'a native fieldstone cottage 7 by 8 m (the CCC and Depression-era Ozark house): rough stone walls, a big end chimney, a porch with timber posts')
def log_cabin():
    w, d = 5.0, 6.0
    o = [bx(0, i*0.3, 0, w, 0.3, d, 'log' if i % 2 else 'logD') for i in range(10)] + [bx(sx, i*0.3, d/2 + 0.04, 0.28, 0.3, 0.12, 'logE') for i in range(10) for sx in (-w/2, w/2)]
    return o + gable(w, d, 3.0, 1.9, 'shingleD', 0.5, 0.6, along='x') + chimney(w/2 + 0.2, 0.0, 0.0, 4.4, 'fstone', 0.9) + door(0.8, d/2 + 0.02, 'woodD', 0.9, 2.0) + win(-1.2, 1.0, 1.0, 1.0, d/2 + 0.02) + [bx(0, 0, d/2 + 0.8, 3.4, 0.2, 1.6, 'woodD'), bx(0, 2.7, d/2 + 0.8, 3.4, 0.15, 1.6, 'shingleD'), *[bx(sx, 0, d/2 + 1.5, 0.14, 2.7, 0.14, 'log') for sx in (-1.6, 1.6)]]
reg('log_cabin', log_cabin(), 6.0, 8.0, 5.3, 'a hewn log cabin 5 by 6 m: ten courses of logs with notched ends, a fieldstone chimney, a porch under the roof; the homestead type')
reg('springhouse', [bx(0, 0, 0, 3.0, 2.0, 3.0, 'stone'), *gable(3.0, 3.0, 2.0, 1.2, 'shingle', 0.3, 0.3, along='x'), *door(0, 1.52, 'woodD', 0.9, 1.5), bx(0, 0, 1.9, 2.4, 0.1, 1.0, 'stoneD'), bx(0, 0.0, 3.0, 1.6, 0.05, 1.6, 'sky')], 3.6, 5.0, 3.2, 'a stone springhouse 3 by 3 m over a spring, with a low door and a pool in front: where a farm kept milk and butter cold; put it where the map has a spring')
reg('root_cellar', [hull([(-2.4, 0, -2.4), (2.4, 0, -2.4), (2.4, 0, 2.2), (-2.4, 0, 2.2), (-1.5, 1.5, -1.6), (1.5, 1.5, -1.6), (1.5, 1.4, 1.2), (-1.5, 1.4, 1.2)], 'sod'), bx(0, 0, 2.2, 2.4, 1.7, 0.4, 'stoneD'), bx(0, 0, 2.42, 1.2, 1.5, 0.06, 'woodD'), bx(0, 1.5, 2.2, 2.6, 0.2, 0.5, 'stone')], 4.8, 4.6, 1.8,
    'a root cellar dug into a mound: a grassy hump 4.8 m wide and a stone front with a plank door (the cellar is a shelter and a food store)')
reg('smokehouse', [bx(0, 0, 0, 2.6, 2.6, 2.6, 'clap'), *gable(2.6, 2.6, 2.6, 1.0, 'shingle', 0.2, 0.2, along='x'), *door(0, 1.32, 'woodD', 0.8, 1.7), bx(0, 3.4, 0, 0.35, 0.8, 0.35, 'steelD'), bx(0, 0, 0, 2.7, 0.2, 2.7, 'concreteD')], 3.0, 3.0, 4.2, 'a smokehouse 2.6 m square with a vent on the ridge and a tight door (the ham and bacon house of a farm)')
def corn_crib():
    o = [bx(sx, 0.0, sz, 0.18, 1.0, 0.18, 'woodD') for sx in (-1.4, 1.4) for sz in (-2.0, 2.0)] + [bx(0, 1.0, 0, 3.0, 2.4, 4.2, 'woodL'), *[bx(0, 1.0 + i*0.3, 2.12, 3.0, 0.05, 0.04, 'woodD') for i in range(8)], *[bx(1.52, 1.0 + i*0.3, 0, 0.04, 0.05, 4.2, 'woodD') for i in range(8)]]
    return o + gable(3.0, 4.2, 3.4, 1.2, 'rust', 0.3, 0.3, along='z')
reg('corn_crib', corn_crib(), 3.6, 4.8, 4.6, 'a slatted corn crib 3 by 4.2 m on posts with a tin roof (airy slats, ear corn inside); beside a barn')
reg('outhouse', [bx(0, 0, 0, 1.2, 2.0, 1.2, 'wood'), hull([(-0.75, 2.0, -0.75), (0.75, 2.0, -0.75), (0.75, 2.0, 0.75), (-0.75, 2.0, 0.75), (-0.75, 2.6, -0.75), (0.75, 2.6, -0.75), (0.75, 2.35, 0.75), (-0.75, 2.35, 0.75)], 'rust'), bx(0, 0.0, 0.62, 0.8, 1.7, 0.05, 'woodD'), bx(0, 1.4, 0.66, 0.16, 0.16, 0.03, 'black')], 1.5, 1.5, 2.6, 'an outhouse 1.2 m square with a shed roof and a plank door with a moon cut-out')
reg('cave_mouth', [hull([(-5.5, 0, -3.0), (5.5, 0, -3.0), (4.5, 0, 3.0), (-4.5, 0, 3.0), (-3.5, 4.8, -2.4), (3.5, 5.0, -2.4), (2.8, 4.0, 2.0), (-2.8, 3.8, 2.0)], 'stone'), bx(0, 0, 3.05, 2.8, 2.6, 0.2, 'black'), bx(-1.6, 0, 3.0, 0.8, 3.2, 0.5, 'stoneD'), bx(1.6, 0, 3.0, 0.8, 3.0, 0.5, 'stoneD'), bx(0, 2.6, 3.0, 4.0, 0.6, 0.5, 'stoneD'),
                   *[bx(x, 0, 3.3, 0.06, 2.2, 0.06, 'steelD') for x in (-1.2, -0.6, 0, 0.6, 1.2)], bx(0, 1.8, 3.3, 2.6, 0.06, 0.06, 'steelD'), bx(0, 0.4, 3.3, 2.6, 0.06, 0.06, 'steelD')], 11.0, 6.4, 5.0,
    'a limestone cave mouth in a bluff 11 m wide, with a dark opening and a gate of iron bars: the Ozarks are karst country; the dark panel is a doorway to a cave level')
reg('stone_gate', [*[bx(sx, 0, 0, 1.2, 3.0, 1.2, 'fstone') for sx in (-3.0, 3.0)], *[bx(sx, 3.0, 0, 1.4, 0.3, 1.4, 'fstoneD') for sx in (-3.0, 3.0)], bx(0, 2.6, 0, 6.0, 0.5, 0.6, 'woodD'), bx(0, 2.7, 0.32, 4.4, 0.34, 0.04, 'woodL')], 7.2, 1.4, 3.3,
    'a rough stone gateway, two 3 m piers with a timber lintel and room for a name board (a CCC-era park or camp entrance): 4.8 m wide between the piers')
pack = {'name': 'roadside', 'version': 1, 'style': 'boxes, hulls and lofts; flat colours', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the footprint on the ground', 'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True,
        'models': {'roadside': M}, 'info': INFO,
        'use': {'amenity=fuel': ['gas_shed', 'gas_house', 'gas_cottage', 'gas_mission', 'gas_box', 'gas_vee', 'gas_modern', 'gas_lighthouse (rare)'], 'tourism=motel': ['motor_court_row', 'motor_cabin', 'motel_sign'], 'amenity=fast_food': ['diner_streamline', 'curb_canopy'],
                'amenity=cinema + drive_in': ['drive_in_screen', 'drive_in_booth', 'drive_in_snack', 'speaker_post'], 'man_made=water_tower': ['water_tower'], 'man_made=silo + grain': ['grain_elevator'], 'building=static_caravan': ['mobile_home_single', 'mobile_home_double'],
                'building=container': ['container_shop'], 'man_made=tower + tower:type=observation + fire': ['fire_tower'], 'natural=cave_entrance': ['cave_mouth'], 'building=cabin': ['log_cabin', 'a_frame_cabin', 'stone_cottage'], 'amenity=shelter + bus': ['bus_shelter'],
                'amenity=telephone': ['phone_booth'], 'shop=farm': ['fruit_stand'], 'building=farm_auxiliary': ['springhouse', 'root_cellar', 'smokehouse', 'corn_crib', 'outhouse']},
        'rule': ('Pairing: a station is a building plus a canopy plus a pump island plus a pole sign (autotrade.sign_pylon): gas_house or gas_cottage + canopy_cottage; gas_box or gas_modern + canopy_flat; gas_vee + canopy_vee; gas_shed + two vintage_pump_glass at the kerb. '
                 'Pick the style by the era of the neighbourhood: 1920s to 1940s on old Route 66 (St Louis Street, Kearney, Glenstone), 1950s to 60s on the main arterials, modern elsewhere. '
                 'Rare landmarks (gas_lighthouse, tepee_shop, muffler_man, water_tower, grain_elevator, drive_in_screen) at most one or two on the whole map; place them on a known road. Each model\'s door faces +z: rotate to face the road. Windows are dark: light a lit window as a game overlay at night.')}
out, st = write_pack('roadside', pack, __file__)
t = {k.split('.')[1]: v[0] for k, v in st.items()}; print(len(t), 'models', min(t.values()), '-', max(t.values())); print({k: v for k, v in t.items() if v > 400})
