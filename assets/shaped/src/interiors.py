#!/usr/bin/env python3
"""Afterstreet interiors pack, version 1 (20 October 2026): shop signs, fixtures for every kind of building, per use.
Writes assets/shaped/interiors.js. Run: python3 assets/shaped/src/interiors.py

signs     one board per kind of business (wall board, back at z = 0, text on the front) in its own colours, in two states
          (<name> and <name>_faded for a street that has been dead for a year), and a blade sign (blade_<name>) that sticks out
          from the wall on a bracket (back at z = 0, 0.9 m square, 1.0 m of bracket) with a pictogram or an initial.
          Also window stickers (open / closed), a price pylon for fuel, and a plain "boarded shop" board.
retail, food, security, medical, school, faith, office, industrial, utility, home
          the fixtures that make a room read as what it is. All stand on the floor at the centre of their base, face +Z,
          units metres. sizes[...] gives the footprint [width, depth] and height so the game's room filler can place them
          (roomFixtures lists what goes in each room type, in the same form as ROOMS in play.html).
Colour names are in the palette; nothing uses slots, so a building's interior looks the same whoever built it."""
import math
from kit import *
from world import text_strokes

P = {  # materials
 'wood': '#8a6a46', 'woodD': '#6a5034', 'woodL': '#b08c62', 'oak': '#a07848', 'metal': '#8f969e', 'metalD': '#5b6168', 'steel': '#4a4d52', 'chrome': '#c8c8c2', 'black': '#1f2024',
 'white': '#e2ddd2', 'cream': '#d8cfb6', 'tile': '#cfd4d2', 'tileD': '#a9b0ae', 'glass': '#9bb3ba', 'glassD': '#3c4a52', 'plastic': '#c9c3b6', 'paper': '#e8e0c8', 'cardboard': '#a8865a',
 'red': '#9a3a30', 'redD': '#7a2a24', 'green': '#4c6a44', 'greenD': '#37502f', 'blue': '#3e5a7a', 'blueD': '#2e4660', 'yellow': '#c9a23a', 'orange': '#c46a2a', 'purple': '#6a4a7a', 'pink': '#c98a9a',
 'leather': '#6a3e2a', 'leatherD': '#4e2c1e', 'fabric': '#8a5a4a', 'fabricG': '#5a6a5a', 'fabricB': '#4a5a72', 'rubber': '#26262a', 'concrete': '#9a948a', 'rust': '#8c4a2e', 'brass': '#b8923a',
 'stone': '#aaa69e', 'stoneD': '#8a867e', 'gold': '#d9b24a', 'candle': '#f0e4b8', 'flame': '#ffc060', 'screen': '#1a1e22', 'screenOn': '#7acaa0', 'lampOn': '#ffe6b0', 'board': '#2c3a34', 'chalk': '#d8dcd0',
 'tag': '#e8d870', 'gym': '#3a3a40', 'ice': '#bfe0ea', 'water': '#4a7a9a', 'pine': '#6a8a52', 'hazard': '#d4a820', 'fire': '#b8321e', 'cell': '#4e545a', 'bunting': '#c4442e',
}
SIGNS = {}   # name: (text, bg, fg, trim)
for k, v in {
 'grocery': ('GROCERY', '#2f6a3a', '#f0ead8', '#e0c040'), 'supermarket': ('SUPERMARKET', '#b8322a', '#f4f0e0', '#f4f0e0'), 'deli': ('DELI', '#8a2e2a', '#f0e4c0', '#d8b860'),
 'bakery': ('BAKERY', '#e6d4a8', '#7a4426', '#7a4426'), 'butcher': ('BUTCHER', '#8a2a28', '#f0ead8', '#f0ead8'), 'pharmacy': ('PHARMACY', '#f0f0e8', '#2e8a4a', '#2e8a4a'),
 'hardware': ('HARDWARE', '#c4442a', '#f4f0e0', '#2a2a2a'), 'diner': ('DINER', '#2a5a8a', '#f4f0e0', '#c8322a'), 'pizza': ('PIZZA', '#c8322a', '#f4f0e0', '#2e6a3e'),
 'cafe': ('CAFE', '#3a2a22', '#f0dcb0', '#c8a060'), 'bar': ('BAR', '#1f2024', '#ffb030', '#ffb030'), 'liquor': ('LIQUOR', '#3a1f4a', '#f0d070', '#f0d070'),
 'clothes': ('CLOTHING', '#e8dcd0', '#6a2a3a', '#6a2a3a'), 'shoes': ('SHOES', '#2a3a5a', '#f0ead8', '#d8a030'), 'gas': ('GAS', '#c8322a', '#f4f0e0', '#f4f0e0'),
 'garage': ('GARAGE', '#3a3e44', '#f0c030', '#f0c030'), 'autoparts': ('AUTO PARTS', '#d8a820', '#1f2024', '#1f2024'), 'bank': ('BANK', '#2a4a3a', '#e0c878', '#e0c878'),
 'police': ('POLICE', '#1f3a6a', '#f0f0f0', '#d8c060'), 'fire': ('FIRE STATION', '#a8281e', '#f4f0e0', '#f4f0e0'), 'clinic': ('CLINIC', '#e8f0f0', '#2a7a9a', '#2a7a9a'),
 'hospital': ('HOSPITAL', '#2a6a9a', '#f4f4f4', '#f4f4f4'), 'school': ('SCHOOL', '#7a3a2a', '#f0e4c0', '#f0e4c0'), 'library': ('LIBRARY', '#3a4a3a', '#e8dcb8', '#c8a860'),
 'church': ('CHURCH', '#e8e4dc', '#3a3a50', '#8a7a4a'), 'hotel': ('HOTEL', '#4a2a3a', '#f0d890', '#f0d890'), 'motel': ('MOTEL', '#1a4a6a', '#ff8a60', '#ff8a60'),
 'gym': ('GYM', '#2a2a30', '#ff6a2a', '#ff6a2a'), 'electronics': ('ELECTRONICS', '#1a2a4a', '#8ac8ff', '#8ac8ff'), 'books': ('BOOKS', '#5a3a2a', '#f0e4c0', '#d8a850'),
 'toys': ('TOYS', '#e8c030', '#c8322a', '#2a5aa0'), 'furniture': ('FURNITURE', '#6a4a30', '#f0e4c8', '#f0e4c8'), 'pawn': ('PAWN', '#2a2a2a', '#f0c030', '#f0c030'),
 'laundry': ('LAUNDRY', '#d8ecf0', '#2a6a9a', '#2a6a9a'), 'barber': ('BARBER', '#f0f0f0', '#a8281e', '#2a4a8a'), 'post': ('POST OFFICE', '#2a4a8a', '#f0f0f0', '#c8322a'),
 'townhall': ('TOWN HALL', '#d8d0c0', '#3a3a3a', '#8a7a4a'), 'warehouse': ('WAREHOUSE', '#6a7a82', '#f0f0f0', '#f0c030'), 'factory': ('WORKS', '#5a5e62', '#f0c030', '#f0c030'),
 'storage': ('SELF STORAGE', '#f0a020', '#1f2024', '#1f2024'), 'waterworks': ('WATER WORKS', '#2a5a8a', '#e8f0f4', '#e8f0f4'), 'power': ('POWER', '#c8a820', '#1f2024', '#1f2024'),
 'office': ('OFFICES', '#4a5a6a', '#f0f0f0', '#d8d8d8'), 'vet': ('VET', '#2a7a5a', '#f4f0e0', '#f4f0e0'), 'florist': ('FLORIST', '#e8c8d0', '#4a6a3a', '#4a6a3a'),
 'bookie': ('BETTING', '#1a5a2a', '#f0e070', '#f0e070'), 'arcade': ('ARCADE', '#2a1a4a', '#ff5ac8', '#5af0ff'),
}.items(): SIGNS[k] = v
def tone(hexc, k):   # k < 1 darker, > 1 lighter, towards grey for faded
    h = hexc.lstrip('#'); r, g, b_ = [int(h[i:i+2], 16) for i in (0, 2, 4)]
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(v))) for v in (r*k, g*k, b_*k))
def fade(hexc):
    h = hexc.lstrip('#'); r, g, b_ = [int(h[i:i+2], 16) for i in (0, 2, 4)]; a = (r + g + b_)/3
    return '#%02x%02x%02x' % tuple(int(v*0.55 + a*0.3 + 14) for v in (r, g, b_))
for k, (t, bg, fg, tr) in SIGNS.items():
    for st, f in (('', lambda c: c), ('F', fade)): P['sg_%s_bg%s' % (k, st)] = f(bg); P['sg_%s_fg%s' % (k, st)] = f(fg); P['sg_%s_tr%s' % (k, st)] = f(tr)
P.update({'sgBack': '#3a3a3e', 'sgBoard': '#6a5a46', 'sgBoardD': '#4a3e30', 'sgNail': '#9a9a96', 'sgOpen': '#d8322a', 'sgOpenG': '#2e8a4a', 'sgWhite': '#f0ead8', 'sgBlack': '#1f2024', 'sgPrice': '#1f2024', 'sgPriceT': '#ff5a3a'})

M = {}; SIZES = {}; NOTES = {}
def model(cat, name, pieces, h=None):
    M.setdefault(cat, {})[name] = pieces
    xs, zs, ys = [], [], []
    for q in pieces:
        if q['s'] == 'box': xs += [q['p'][0] - q['d'][0]/2, q['p'][0] + q['d'][0]/2]; zs += [q['p'][2] - q['d'][2]/2, q['p'][2] + q['d'][2]/2]; ys.append(q['p'][1] + q['d'][1]/2)
    if cat != 'signs' and xs: SIZES[cat + '.' + name] = [round(max(xs) - min(xs), 2), round(max(zs) - min(zs), 2), round(max(ys), 2)]
def b(x, y, z, w, h, d, c, **k): return box([x, y + h/2, z], [w, h, d], c, **k)
def fz(x0, y0, x1, y1, z, c): return flat([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], c, (0, 0, 1))
def fy(x0, z0, x1, z1, y, c): return flat([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], c, (0, 1, 0))
def legs(w, d, h, t, c, y0=0.0): return [b(sx*(w/2 - t/2), y0, sz*(d/2 - t/2), t, h, t, c) for sx in (1, -1) for sz in (1, -1)]
def cylv(x, y, z, r, h, c, n=8): return loft([[x, y, z, r, r], [x, y + h, z, r, r]], c, n=n)
def words(s, h, y, c, z, x=0.0, aspect=0.5): return text_strokes(s, h, h*0.17, c, 'wall', x0=x, y0=y - h/2, z0=z, aspect=aspect, n=(0, 0, 1))

# ================= shop signs =================
def board(name, st=''):
    t, *_ = SIGNS[name]; bg, fg, tr = ['sg_%s_%s%s' % (name, q, st) for q in ('bg', 'fg', 'tr')]
    h = 0.34 if len(t) <= 14 else 0.28; cw = h*0.6*1.45; tw = len(t)*cw; W = round(max(1.6, tw + 0.55), 2); H = 0.78
    o = [b(0, 0, 0.03, W, H, 0.06, bg)] + [b(0, 0, 0.0, W + 0.08, 0.06, 0.07, tr), b(0, H - 0.06, 0.0, W + 0.08, 0.06, 0.07, tr)] if False else [b(0, 0, 0.04, W, H, 0.08, bg), b(0, -0.03, 0.045, W + 0.1, 0.045, 0.09, tr), b(0, H - 0.015, 0.045, W + 0.1, 0.045, 0.09, tr),
                                                                                                     b(-W/2 - 0.025, -0.03, 0.045, 0.05, H + 0.06, 0.09, tr), b(W/2 + 0.025, -0.03, 0.045, 0.05, H + 0.06, 0.09, tr)]
    o += text_strokes(t, h, h*0.17, fg, 'wall', x0=0, y0=H/2 - h/2, z0=0.0805, aspect=0.6, gap=0.45, n=(0, 0, 1))
    return o
for k in SIGNS:
    model('signs', k, board(k))
def blade(name, icon):
    bg, fg, tr = ['sg_%s_%s' % (name, q) for q in ('bg', 'fg', 'tr')]
    o = [b(0, 2.3, 0.0, 0.05, 0.05, 1.0, 'sgBack'), seg([0, 2.3, 0.1], [0, 2.0, 0.85], 0.02, 0.02, 0.02, 0.02, 'sgBack'), b(0, 1.15, 0.95, 0.05, 0.9, 0.9, bg), b(0, 1.15, 0.95, 0.07, 0.94, 0.04, tr)]
    for sd in (1, -1):
        for q in icon(sd): o.append(q)
    return o
def side_plate(ch, col, h=0.5):   # a letter lying on both faces of a blade, face normals +-X
    def f(sd):
        out = []
        for q in text_strokes(ch, h, h*0.2, col, 'wall', x0=0, y0=0, z0=0, aspect=0.55, n=(0, 0, 1)):
            vs = [[0.0, qv[1] + q['p'][1], -(qv[0] + q['p'][0])*sd] for qv in q['v']]
            cy = sum(v[1] for v in vs)/len(vs); cz = sum(v[2] for v in vs)/len(vs)
            out.append({'s': 'decal', 'p': [round(sd*0.038, 4), round(1.15 - h/2 + cy, 4), round(0.95 + cz, 4)], 'v': [[0.0, round(v[1] - cy, 4), round(v[2] - cz, 4)] for v in vs], 'n': [sd, 0, 0], 'c': col})
        return out
    return f
def cross_icon(col):
    def f(sd): return [box([sd*0.038, 1.15, 0.95], [0.004, 0.5, 0.14], col), box([sd*0.038, 1.15, 0.95], [0.004, 0.14, 0.5], col)]
    return f
def flame_icon(col):
    def f(sd): return [solid([(sd*0.038, 0.88, 0.95 - 0.22), (sd*0.038, 0.88, 0.95 + 0.22), (sd*0.038, 1.2, 0.95 + 0.16), (sd*0.038, 1.45, 0.95), (sd*0.038, 1.2, 0.95 - 0.16)], [[0, 1, 2, 3, 4]], col)]
    return f
def star_icon(col):
    def f(sd): return [solid([(sd*0.038, 1.15 - 0.3, 0.95), (sd*0.038, 1.15, 0.95 + 0.3), (sd*0.038, 1.15 + 0.3, 0.95), (sd*0.038, 1.15, 0.95 - 0.3)], [[0, 1, 2, 3]], col)]
    return f
def church_icon(col):
    def f(sd): return [box([sd*0.038, 1.15, 0.95], [0.004, 0.62, 0.1], col), box([sd*0.038, 1.25, 0.95], [0.004, 0.1, 0.4], col)]
    return f
ICON = {'pharmacy': cross_icon('sg_pharmacy_fg'), 'clinic': cross_icon('sg_clinic_fg'), 'hospital': cross_icon('sg_hospital_fg'), 'vet': cross_icon('sg_vet_fg'), 'fire': flame_icon('sg_fire_fg'),
        'police': star_icon('sg_police_tr'), 'church': church_icon('sg_church_tr')}
for k in SIGNS:
    ic = ICON.get(k) or side_plate(SIGNS[k][0][0], 'sg_%s_fg' % k, 0.55)
    model('signs', 'blade_' + k, blade(k, ic))
# window stickers and the odd extras
model('signs', 'sticker_open', [b(0, 0, 0.0, 0.5, 0.3, 0.012, 'sgOpenG'), *text_strokes('OPEN', 0.14, 0.025, 'sgWhite', 'wall', x0=0, y0=0.08, z0=0.0125, aspect=0.5, n=(0, 0, 1))])
model('signs', 'sticker_closed', [b(0, 0, 0.0, 0.5, 0.3, 0.012, 'sgOpen'), *text_strokes('CLOSED', 0.12, 0.022, 'sgWhite', 'wall', x0=0, y0=0.09, z0=0.0125, aspect=0.5, n=(0, 0, 1))])
model('signs', 'sticker_sale', [b(0, 0, 0.0, 0.6, 0.4, 0.012, 'sgOpen'), *text_strokes('SALE', 0.2, 0.034, 'sgWhite', 'wall', x0=0, y0=0.1, z0=0.0125, aspect=0.5, n=(0, 0, 1))])
model('signs', 'board_boarded', [b(0, 0, 0.03, 2.2, 0.6, 0.05, 'sgBoard'), *[b(x, 0.0, 0.065, 0.05, 0.6, 0.015, 'sgBoardD') for x in (-1.0, -0.3, 0.4, 1.0)], b(0, 0.15, 0.075, 2.3, 0.04, 0.02, 'sgBoardD'), b(0, 0.42, 0.075, 2.3, 0.04, 0.02, 'sgBoardD')])
def pylon():
    o = [b(0, 0, 0, 0.35, 6.0, 0.35, 'steel'), b(0, 5.2, 0, 2.4, 1.1, 0.4, 'sg_gas_bg'), b(0, 5.2, 0, 2.5, 0.08, 0.42, 'sg_gas_tr'), b(0, 6.2, 0, 2.5, 0.08, 0.42, 'sg_gas_tr')]
    o += text_strokes('GAS', 0.7, 0.12, 'sg_gas_fg', 'wall', x0=0, y0=5.25, z0=0.201, aspect=0.5, n=(0, 0, 1))
    o += [b(0, 3.7, 0, 1.6, 1.3, 0.3, 'sgPrice'), *[fz(-0.7, 3.85 + i*0.4, 0.7, 4.15 + i*0.4, 0.151, 'sgPriceT') for i in range(3)]]
    return o
model('signs', 'pylon_gas', pylon())
NOTES['signs'] = ('signs: <name> is a wall board (width 1.6 to 3.6 m by 0.78 m, bottom-left-centre at the origin: x centred, y from 0 up, back at z = 0, 0.09 m deep); mount it over the shopfront at 3.2 to 4.0 m. '
                  'For a dead street draw the same sign with every colour name given a trailing F (sg_pharmacy_bg becomes sg_pharmacy_bgF): the palette has a sun-bleached version of each. blade_<name> is a 0.9 m square projecting sign on a bracket (bracket on the wall at z = 0, '
                  'sign at z = 0.95, both faces; mount at 2.5 m). Business kinds: ' + ', '.join(SIGNS) + '. pylon_gas is a 6 m price sign for forecourts. Stickers (open, closed, sale) go on the glass inside, back at z = 0.')

# ================= fixtures =================
# ---- retail ----
def shelf_goods(w, y, z, cols, n=6):
    return [b(-w/2 + 0.06 + i*(w - 0.12)/n, y, z, (w - 0.12)/n - 0.02, 0.22 + 0.04*(i % 3), 0.18, cols[i % len(cols)]) for i in range(n)]
def gondola(w=1.8, d=0.6, cols=('red', 'blue', 'yellow', 'green', 'orange', 'white')):
    o = [b(0, 0, 0, w, 0.12, d, 'metalD'), b(-w/2 + 0.02, 0, 0, 0.04, 1.6, d, 'metal'), b(w/2 - 0.02, 0, 0, 0.04, 1.6, d, 'metal'), b(0, 0.5, 0, 0.03, 1.1, 0.04, 'metalD')]
    for y in (0.15, 0.55, 0.95, 1.35):
        o += [b(0, y, 0, w - 0.08, 0.03, d - 0.04, 'metal')]
        o += shelf_goods(w - 0.04, y + 0.03, 0.12, cols); o += shelf_goods(w - 0.04, y + 0.03, -0.12, cols[::-1])
    return o
model('retail', 'gondola', gondola())
model('retail', 'shelf_wall', [b(0, 0, -0.15, 1.8, 1.9, 0.3, 'metalD')] + [p for y in (0.2, 0.6, 1.0, 1.4, 1.75) for p in [b(0, y, -0.1, 1.76, 0.03, 0.28, 'metal')] + shelf_goods(1.76, y + 0.03, -0.1, ('red', 'blue', 'yellow', 'green', 'white', 'orange'))])
model('retail', 'checkout', [b(0, 0, 0, 1.1, 0.9, 0.6, 'metal'), b(0, 0.9, 0, 1.12, 0.04, 0.62, 'chrome'), b(-1.0, 0.0, 0, 1.0, 0.1, 0.55, 'rubber'), b(-1.0, 0.1, 0, 0.98, 0.04, 0.5, 'black'), b(0.2, 0.94, 0.05, 0.3, 0.2, 0.25, 'steel'), fz(0.1, 1.04, 0.3, 1.2, 0.18, 'screenOn'),
                            b(0.62, 0.94, 0.0, 0.2, 0.06, 0.4, 'metalD'), b(-0.4, 0.94, -0.1, 0.18, 0.4, 0.08, 'blue')])
model('retail', 'produce_bin', [b(0, 0, 0, 1.2, 0.5, 0.8, 'wood'), b(0, 0.5, 0.3, 1.2, 0.04, 0.2, 'woodD'), *[loft([[x, 0.56, z, 0.09, 0.09], [x, 0.66, z, 0.07, 0.07]], c, n=6) for x, z, c in
                                 ((-0.45, -0.15, 'red'), (-0.25, -0.1, 'red'), (-0.05, -0.2, 'green'), (0.15, -0.1, 'green'), (0.38, -0.15, 'orange'), (0.5, 0.0, 'orange'), (-0.35, 0.1, 'yellow'), (0.1, 0.05, 'red'))], b(0, 0.5, -0.1, 1.1, 0.04, 0.5, 'greenD')])
model('retail', 'freezer_chest', [b(0, 0, 0, 1.6, 0.85, 0.8, 'white'), b(0, 0.85, 0, 1.64, 0.03, 0.84, 'chrome'), fy(-0.76, -0.36, 0.76, 0.36, 0.875, 'ice'), b(0, 0.8, 0.42, 0.9, 0.08, 0.02, 'blue')])
model('retail', 'drinks_cooler', [b(0, 0, -0.15, 1.2, 2.0, 0.7, 'white'), fz(-0.55, 0.15, 0.55, 1.9, 0.201, 'glassD')] + [b(x, y, 0.0, 0.18, 0.28, 0.1, c) for x in (-0.35, -0.1, 0.15, 0.4) for y, c in ((0.3, 'red'), (0.75, 'blue'), (1.2, 'green'), (1.65, 'orange'))])
model('retail', 'shopping_cart', [seg([-0.25, 0.4, -0.35], [-0.25, 0.9, -0.5], 0.01, 0.01, 0.01, 0.01, 'metal'), seg([0.25, 0.4, -0.35], [0.25, 0.9, -0.5], 0.01, 0.01, 0.01, 0.01, 'metal'), b(0, 0.9, -0.5, 0.52, 0.03, 0.03, 'blue'),
                                 b(0, 0.35, 0, 0.5, 0.04, 0.8, 'metal'), b(0, 0.39, 0.4, 0.5, 0.4, 0.02, 'metal'), b(-0.25, 0.39, 0, 0.02, 0.4, 0.8, 'metal'), b(0.25, 0.39, 0, 0.02, 0.4, 0.8, 'metal'), *[b(sx*0.22, 0.0, sz*0.32, 0.04, 0.1, 0.04, 'rubber') for sx in (1, -1) for sz in (1, -1)]])
model('retail', 'basket_stack', [b(0, 0.1*i, 0, 0.4, 0.1, 0.3, c) for i, c in enumerate(('red', 'red', 'red', 'red'))])
model('retail', 'pharmacy_counter', [b(0, 0, 0, 2.4, 1.05, 0.7, 'white'), b(0, 1.05, 0, 2.44, 0.04, 0.74, 'chrome'), b(0, 1.09, 0.2, 2.4, 0.5, 0.03, 'glass'), b(0.7, 1.09, -0.1, 0.4, 0.3, 0.3, 'steel'), fz(0.55, 1.2, 0.85, 1.38, 0.06, 'screenOn'), b(-0.6, 1.09, -0.1, 0.3, 0.12, 0.2, 'green')])
model('retail', 'pill_wall', [b(0, 0, -0.2, 2.4, 2.2, 0.4, 'white')] + [b(-1.1 + i*0.22, y, -0.0, 0.18, 0.2, 0.14, c) for i in range(10) for y, c in ((0.4, 'plastic'), (0.8, 'orange'), (1.2, 'white'), (1.6, 'plastic'), (2.0, 'green')) if (i + int(y*5)) % 3 != 0])
model('retail', 'clothes_rack', [b(-0.55, 0, 0, 0.04, 1.6, 0.5, 'chrome'), b(0.55, 0, 0, 0.04, 1.6, 0.5, 'chrome'), b(0, 1.55, 0, 1.2, 0.03, 0.04, 'chrome'), b(0, 0, 0, 1.2, 0.03, 0.04, 'chrome'),
                                 *[b(-0.5 + i*0.1, 0.7, 0, 0.05, 0.85, 0.3, ('fabric', 'fabricB', 'fabricG', 'red', 'cream', 'blue')[i % 6]) for i in range(11)]])
model('retail', 'mannequin', [b(0, 0, 0, 0.5, 0.04, 0.4, 'black'), cylv(0, 0.04, 0, 0.02, 0.8, 'metalD', 6), loft([[0, 0.85, 0, 0.15, 0.1], [0, 1.2, 0, 0.19, 0.1], [0, 1.45, 0, 0.2, 0.1], [0, 1.52, 0, 0.07, 0.07]], 'cream', n=8), loft([[0, 1.5, 0, 0.07, 0.07], [0, 1.72, 0, 0.09, 0.09]], 'cream', n=6),
                              b(0, 0.9, 0, 0.36, 0.6, 0.22, 'fabricB')])
model('retail', 'fitting_room', [b(0, 0, -0.45, 1.0, 2.0, 0.05, 'woodL'), b(-0.475, 0, 0, 0.05, 2.0, 0.9, 'woodL'), b(0.475, 0, 0, 0.05, 2.0, 0.9, 'woodL'), b(-0.25, 0.15, 0.45, 0.5, 1.7, 0.03, 'fabric'), b(0, 0.45, -0.4, 0.6, 1.2, 0.02, 'glass'), b(0.3, 0.0, -0.2, 0.3, 0.45, 0.3, 'woodD')])
model('retail', 'shoe_wall', [b(0, 0, -0.15, 2.0, 2.0, 0.3, 'woodD')] + [b(-0.85 + i*0.34, y, -0.03, 0.26, 0.1, 0.24, ('leather', 'black', 'red', 'cream', 'blue')[(i + j) % 5]) for i in range(6) for j, y in enumerate((0.3, 0.7, 1.1, 1.5, 1.85))])
model('retail', 'display_table', [b(0, 0, 0, 1.4, 0.8, 0.9, 'wood'), b(0, 0.8, 0, 1.44, 0.04, 0.94, 'woodL'), *shelf_goods(1.2, 0.84, 0.15, ('blue', 'white', 'red', 'yellow')), *shelf_goods(1.2, 0.84, -0.2, ('green', 'orange', 'white'))])
model('retail', 'paint_rack', [b(0, 0, -0.15, 1.8, 1.9, 0.3, 'metalD')] + [b(-0.78 + i*0.2, y, -0.0, 0.17, 0.26, 0.17, ('white', 'red', 'blue', 'yellow', 'green', 'cream')[(i + j) % 6]) for i in range(8) for j, y in enumerate((0.15, 0.7, 1.25))] + [b(0, y, -0.1, 1.76, 0.03, 0.28, 'metal') for y in (0.12, 0.67, 1.22)])
model('retail', 'tool_wall', [b(0, 0, -0.04, 2.2, 2.0, 0.08, 'woodD')] + [seg([-0.9 + i*0.25, 1.9, 0.04], [-0.9 + i*0.25, 1.3, 0.04], 0.012, 0.01, 0.025, 0.01, ('red', 'steel', 'orange', 'blue')[i % 4]) for i in range(8)] + [b(-0.75 + i*0.4, 0.9, 0.04, 0.28, 0.16, 0.05, 'steel') for i in range(5)] + [b(0, 0.5, 0.06, 2.0, 0.04, 0.12, 'metal')])
model('retail', 'lumber_rack', [b(sx, 0, 0, 0.06, 1.8, 0.06, 'steel') for sx in (-1.1, -0.4, 0.4, 1.1)] + [b(0, y, 0, 2.4, 0.06, 0.5, 'steel') for y in (0.2, 0.7, 1.2)] + [b(0, y + 0.06, 0, 2.3, 0.1, 0.12 + 0.1*(i % 2), 'woodL' if i % 2 else 'wood') for i, y in enumerate((0.2, 0.7, 1.2))])
model('retail', 'book_shelf', [b(0, 0, -0.15, 1.6, 2.0, 0.3, 'woodD')] + [b(-0.6 + i*0.4, y + 0.03, -0.1, 0.34, 0.3, 0.2, ('red', 'green', 'blue', 'cream', 'brass', 'leather')[(i * 2 + j) % 6]) for i in range(4) for j, y in enumerate((0.2, 0.65, 1.1, 1.55))] + [b(0, y, -0.1, 1.5, 0.03, 0.26, 'woodL') for y in (0.2, 0.65, 1.1, 1.55)])
model('retail', 'toy_bin', [b(0, 0, 0, 0.9, 0.5, 0.6, 'yellow'), *[b(-0.3 + 0.25*i, 0.5, 0.0 + 0.1*(i % 2 - 0.5), 0.2, 0.2, 0.2, ('red', 'blue', 'green', 'orange')[i % 4]) for i in range(4)]])
model('retail', 'vitrine', [b(0, 0, 0, 1.6, 0.85, 0.55, 'woodD'), b(0, 0.85, 0, 1.6, 0.5, 0.55, 'glass'), b(0, 1.35, 0, 1.64, 0.03, 0.59, 'woodD'), b(0, 0.9, 0, 0.5, 0.05, 0.3, 'gold'), b(-0.5, 0.9, 0.0, 0.2, 0.15, 0.2, 'gold')])
model('retail', 'tv_wall', [b(x, 0.9 + y, -0.04, 0.6, 0.4, 0.08, 'black') for x, y in ((-0.7, 0.4), (0, 0.4), (0.7, 0.4), (-0.7, 0.0), (0, 0.0), (0.7, 0.0))] + [fz(x - 0.27, 0.95 + y, x + 0.27, 1.25 + y, 0.002, 'screen') for x, y in ((-0.7, 0.4), (0, 0.4), (0.7, 0.4), (-0.7, 0.0), (0, 0.0), (0.7, 0.0))])
model('retail', 'pump_island', [b(0, 0, 0, 1.0, 0.2, 4.2, 'concrete'), b(0, 0.2, 0, 0.6, 1.5, 0.3, 'fire'), b(0, 1.2, 0.16, 0.5, 0.25, 0.03, 'screen'), fz(-0.2, 1.25, 0.2, 1.4, 0.17, 'screenOn'), b(0.25, 0.6, 0.0, 0.08, 0.5, 0.24, 'black'),
                           b(0, 1.7, 0, 0.7, 0.14, 0.34, 'white')])
model('retail', 'fuel_pump', [b(0, 0, 0, 0.7, 1.55, 0.4, 'fire'), b(0, 1.55, 0, 0.72, 0.16, 0.42, 'white'), b(0, 1.0, 0.205, 0.5, 0.35, 0.02, 'screen'), fz(-0.2, 1.05, 0.2, 1.3, 0.216, 'screenOn'), b(0.38, 0.9, 0.0, 0.1, 0.5, 0.2, 'black'),
                          seg([0.43, 1.2, 0.0], [0.6, 0.7, 0.1], 0.015, 0.015, 0.015, 0.015, 'black'), b(0.0, 0.0, 0.0, 0.8, 0.12, 0.5, 'concrete')])
model('retail', 'pump_canopy', [b(sx, 0, sz, 0.35, 4.6, 0.35, 'white') for sx in (-4.0, 4.0) for sz in (-3.0, 3.0)] + [b(0, 4.6, 0, 10.0, 0.5, 7.5, 'fire'), b(0, 4.6, 0, 10.2, 0.1, 7.7, 'white'), *[b(x, 4.5, 0, 0.4, 0.05, 6.0, 'lampOn', glow=True) for x in (-2.5, 2.5)]])
model('retail', 'ice_box', [b(0, 0, 0, 0.9, 1.3, 0.55, 'white'), b(0, 0.3, 0.28, 0.8, 0.5, 0.02, 'ice'), *text_strokes('ICE', 0.2, 0.035, 'blue', 'wall', x0=0, y0=0.95, z0=0.285, aspect=0.5, n=(0, 0, 1))])
NOTES['retail'] = ('retail: shelving (gondola 1.8 m double sided for aisles, shelf_wall 1.8 m against a wall: back at z = -0.3), checkout, produce_bin, freezer_chest, drinks_cooler (against a wall), carts and baskets, '
                   'pharmacy_counter and pill_wall, clothes_rack, mannequin, fitting_room, shoe_wall, display_table, paint_rack, tool_wall (flat on a wall: back at z = -0.08), lumber_rack, book_shelf, toy_bin, vitrine, tv_wall, '
                   'and for forecourts fuel_pump, pump_island (two pumps would go on its ends), pump_canopy and ice_box.')

# ---- food ----
model('food', 'booth', [b(0, 0, 0, 1.6, 0.45, 0.9, 'redD'), b(0, 0.45, -0.4, 1.6, 0.6, 0.12, 'red'), b(0, 0.0, 0.55, 1.6, 0.45, 0.9, 'redD') if False else b(0, 0, 0.0, 0.1, 0.1, 0.1, 'red'),
                        b(0, 0.7, 0.0, 0.9, 0.04, 0.7, 'cream'), b(0, 0, 0.0, 0.1, 0.7, 0.1, 'chrome')])
M['food']['booth'] = [b(0, 0, -0.6, 1.5, 0.45, 0.6, 'redD'), b(0, 0.45, -0.88, 1.5, 0.7, 0.12, 'red'), b(0, 0, 0.6, 1.5, 0.45, 0.6, 'redD'), b(0, 0.45, 0.88, 1.5, 0.7, 0.12, 'red'), b(0, 0.0, 0.0, 0.12, 0.7, 0.12, 'chrome'), b(0, 0.7, 0.0, 1.1, 0.04, 0.7, 'cream'),
                      b(0, 0.74, 0.1, 0.06, 0.12, 0.06, 'chrome'), b(0.2, 0.74, -0.1, 0.06, 0.05, 0.06, 'red')]
SIZES['food.booth'] = [1.5, 2.0, 1.15]
model('food', 'diner_counter', [b(0, 0, 0, 3.0, 1.05, 0.7, 'cream'), b(0, 1.05, 0.0, 3.04, 0.05, 0.8, 'chrome'), b(0, 0, 0.36, 3.0, 0.2, 0.03, 'chrome'), b(0, 1.1, -0.15, 0.4, 0.3, 0.3, 'steel'), b(1.0, 1.1, -0.1, 0.5, 0.35, 0.2, 'glass'), b(-1.0, 1.1, -0.1, 0.12, 0.3, 0.12, 'chrome')])
model('food', 'counter_stool', legs(0.4, 0.4, 0.62, 0.04, 'chrome') + [cylv(0, 0.62, 0, 0.19, 0.08, 'red')])
model('food', 'jukebox', [b(0, 0, 0, 0.85, 1.4, 0.55, 'redD'), loft([[0, 1.4, 0, 0.42, 0.27], [0, 1.6, 0, 0.3, 0.2]], 'orange', n=8), b(0, 0.95, 0.265, 0.6, 0.35, 0.03, 'lampOn', glow=True), b(0, 0.35, 0.28, 0.55, 0.3, 0.02, 'chrome')])
model('food', 'menu_board', [b(0, 0, 0, 1.4, 0.04, 0.04, 'black') if False else b(0, 0, -0.04, 1.4, 1.0, 0.06, 'board'), *[fz(-0.6, 0.12 + i*0.17, -0.6 + 0.6 + (i % 3)*0.2, 0.2 + i*0.17, 0.0, 'chalk') for i in range(5)]])
model('food', 'pie_case', [b(0, 0, 0, 0.9, 0.85, 0.6, 'woodD'), b(0, 0.85, 0, 0.9, 0.5, 0.6, 'glass'), b(0, 0.9, 0, 0.8, 0.03, 0.5, 'cream'), loft([[-0.2, 0.93, 0, 0.17, 0.17], [-0.2, 1.02, 0, 0.15, 0.15]], 'orange', n=8), loft([[0.2, 0.93, 0, 0.17, 0.17], [0.2, 1.02, 0, 0.15, 0.15]], 'red', n=8)])
model('food', 'bar_counter', [b(0, 0, 0, 3.2, 1.1, 0.7, 'woodD'), b(0, 1.1, 0.0, 3.3, 0.06, 0.8, 'oak'), b(0, 0.15, 0.36, 3.2, 0.06, 0.04, 'brass'), b(0, 0, -0.9, 3.2, 1.1, 0.6, 'woodD'), *[b(-1.2 + i*0.6, 1.16, 0.0, 0.14, 0.3, 0.14, ('green', 'glass', 'orange', 'blue')[i % 4]) for i in range(5)],
                          *[b(-1.0 + i*1.0, 1.16, 0.2, 0.06, 0.28, 0.06, 'chrome') for i in range(3)]])
model('food', 'back_bar', [b(0, 0, -0.15, 3.2, 1.0, 0.3, 'woodD'), b(0, 1.0, -0.2, 3.2, 1.3, 0.1, 'glassD')] + [b(-1.4 + i*0.28, y, -0.15, 0.1, 0.3, 0.1, ('green', 'glassD', 'orange', 'blue', 'red')[(i + j) % 5]) for i in range(11) for j, y in enumerate((1.28, 1.7))] + [b(0, y, -0.15, 3.1, 0.03, 0.2, 'oak') for y in (1.25, 1.65)])
model('food', 'bar_stool', legs(0.34, 0.34, 0.7, 0.03, 'chrome') + [cylv(0, 0.7, 0, 0.17, 0.08, 'leather'), b(0, 0.3, 0, 0.3, 0.03, 0.3, 'chrome')])
model('food', 'pool_table', legs(2.2, 1.2, 0.8, 0.14, 'woodD') + [b(0, 0.75, 0, 2.5, 0.15, 1.3, 'woodD'), b(0, 0.9, 0, 2.2, 0.02, 1.0, 'greenD'), *[b(sx, 0.9, 0.0, 0.02, 0.04, 1.0, 'woodD') for sx in (-1.1, 1.1)], *[loft([[x, 0.92, z, 0.03, 0.03], [x, 0.98, z, 0.03, 0.03]], c, n=6) for x, z, c in ((0.3, 0.1, 'white'), (-0.5, 0.0, 'red'), (-0.56, 0.06, 'yellow'), (-0.56, -0.06, 'blue'))]])
model('food', 'dartboard', [loft([[0, 1.7, 0.02, 0.23, 0.23], [0, 1.7, 0.04, 0.23, 0.23]], 'black', ax='z', n=12), loft([[0, 1.7, 0.041, 0.16, 0.16], [0, 1.7, 0.042, 0.16, 0.16]], 'red', ax='z', n=12), loft([[0, 1.7, 0.043, 0.05, 0.05], [0, 1.7, 0.044, 0.05, 0.05]], 'green', ax='z', n=8), b(0, 1.4, 0.0, 0.5, 0.8, 0.02, 'woodD')])
model('food', 'espresso_bar', [b(0, 0, 0, 2.4, 1.0, 0.7, 'woodD'), b(0, 1.0, 0, 2.44, 0.05, 0.74, 'chrome'), b(-0.6, 1.05, -0.05, 0.6, 0.45, 0.4, 'steel'), b(-0.6, 1.5, -0.05, 0.62, 0.05, 0.42, 'chrome'), b(0.4, 1.05, 0, 0.3, 0.3, 0.3, 'black'), b(0.9, 1.05, -0.1, 0.25, 0.4, 0.25, 'white')])
model('food', 'pastry_case', [b(0, 0, 0, 1.8, 0.8, 0.7, 'white'), b(0, 0.8, 0, 1.8, 0.45, 0.7, 'glass'), *[b(-0.6 + i*0.3, 0.84, 0.0, 0.2, 0.1, 0.2, ('cream', 'orange', 'pink', 'leather')[i % 4]) for i in range(5)]])
model('food', 'cafe_table', [cylv(0, 0, 0, 0.04, 0.7, 'metalD', 6), b(0, 0, 0, 0.45, 0.03, 0.45, 'metalD'), loft([[0, 0.7, 0, 0.33, 0.33], [0, 0.73, 0, 0.33, 0.33]], 'cream', n=8)])
model('food', 'kitchen_range', [b(0, 0, 0, 1.6, 0.9, 0.8, 'steel'), b(0, 0.9, 0, 1.62, 0.04, 0.82, 'chrome'), *[b(x, 0.94, z, 0.3, 0.02, 0.3, 'black') for x in (-0.4, 0.4) for z in (-0.15, 0.15)], b(0, 1.0, -0.38, 1.6, 0.8, 0.06, 'steel'), b(0, 1.8, -0.1, 1.8, 0.4, 0.7, 'steel')])
model('food', 'prep_table', [b(0, 0, 0, 1.8, 0.9, 0.7, 'steel'), b(0, 0.9, 0, 1.84, 0.04, 0.74, 'chrome'), b(0, 0.25, 0.0, 1.7, 0.03, 0.62, 'metalD'), b(-0.5, 0.94, 0, 0.5, 0.05, 0.35, 'woodL')])
model('food', 'walk_in_cold', [b(0, 0, 0, 2.4, 2.4, 2.4, 'white'), b(0, 0, 1.21, 0.9, 2.0, 0.04, 'metal'), b(0.35, 1.0, 1.24, 0.06, 0.2, 0.06, 'chrome'), b(0, 2.4, 0, 2.5, 0.06, 2.5, 'metalD')])
model('food', 'dish_sink', [b(0, 0, 0, 1.8, 0.88, 0.7, 'steel'), b(-0.45, 0.88, 0, 0.7, 0.18, 0.55, 'metalD'), b(0.45, 0.88, 0, 0.7, 0.18, 0.55, 'metalD'), seg([0, 0.95, -0.28], [0, 1.4, -0.28], 0.02, 0.02, 0.02, 0.02, 'chrome'), b(0, 1.4, -0.1, 0.03, 0.03, 0.4, 'chrome')])
NOTES['food'] = ('food: diner (booth 1.5 x 2.0 seats four, diner_counter, counter_stool, jukebox, menu_board on a wall, pie_case), bar (bar_counter with back_bar behind it, bar_stool, pool_table, dartboard on a wall), '
                 'cafe (espresso_bar, pastry_case, cafe_table), kitchens (kitchen_range, prep_table, walk_in_cold, dish_sink).')

# ---- security and emergency ----
model('security', 'holding_cell', [b(sx, 0, 0, 0.05, 2.4, 2.0, 'cell') for sx in (-1.0, 1.0)] + [b(0, 0, -1.0, 2.0, 2.4, 0.05, 'cell')] + [b(x, 0, 1.0, 0.04, 2.4, 0.04, 'steel') for x in (-0.9, -0.6, -0.3, 0.3, 0.6, 0.9)] + [b(0, 2.35, 1.0, 2.0, 0.06, 0.06, 'steel'), b(0, 0.1, 1.0, 2.0, 0.06, 0.06, 'steel'),
                           b(-0.6, 0, -0.5, 0.7, 0.45, 1.8, 'metal'), b(-0.6, 0.45, -0.5, 0.65, 0.06, 1.7, 'cream'), b(0.7, 0, -0.8, 0.4, 0.4, 0.4, 'metal')])
model('security', 'cell_door', [b(x, 0, 0, 0.04, 2.2, 0.04, 'steel') for x in (-0.45, -0.3, -0.15, 0.0, 0.15, 0.3, 0.45)] + [b(0, 0.1, 0, 1.0, 0.06, 0.05, 'steel'), b(0, 2.15, 0, 1.0, 0.06, 0.05, 'steel'), b(0.4, 1.0, 0.05, 0.1, 0.1, 0.06, 'brass')])
model('security', 'evidence_locker', [b(0, 0, 0, 1.2, 2.0, 0.5, 'metalD')] + [b(-0.45 + i*0.3, 0.1 + j*0.5, 0.26, 0.26, 0.45, 0.02, 'metal') for i in range(4) for j in range(4)] + [b(-0.45 + i*0.3, 0.3 + j*0.5, 0.28, 0.05, 0.04, 0.02, 'brass') for i in range(4) for j in range(4)])
model('security', 'booking_desk', [b(0, 0, 0, 2.0, 1.1, 0.8, 'metalD'), b(0, 1.1, 0, 2.04, 0.05, 0.84, 'woodD'), b(0.6, 1.15, 0, 0.35, 0.3, 0.3, 'steel'), fz(0.45, 1.22, 0.75, 1.38, 0.16, 'screenOn'), b(-0.5, 1.15, 0.1, 0.4, 0.04, 0.3, 'paper')])
model('security', 'radio_desk', [b(0, 0, 0, 1.6, 0.76, 0.8, 'metal'), b(0, 0.76, 0, 1.64, 0.04, 0.84, 'steel'), *[b(x, 0.8, -0.1, 0.4, 0.3, 0.3, 'black') for x in (-0.5, 0.0, 0.5)], *[fz(x - 0.17, 0.9, x + 0.17, 1.05, 0.06, 'screenOn') for x in (-0.5, 0.0, 0.5)]])
model('security', 'gun_safe', [b(0, 0, 0, 0.9, 1.5, 0.6, 'metalD'), b(0.0, 0.3, 0.31, 0.7, 0.9, 0.02, 'steel'), cylv(0.0, 0.0, 0.0, 0.0, 0.0, 'steel', 4) if False else b(0.0, 0.75, 0.33, 0.14, 0.14, 0.03, 'brass'), b(0.3, 0.75, 0.33, 0.04, 0.2, 0.04, 'brass')])
model('security', 'fire_pole', [cylv(0, 0, 0, 0.04, 3.2, 'brass', 6), b(0, 3.1, 0, 0.8, 0.08, 0.8, 'woodD')])
model('security', 'hose_rack', [b(0, 0, -0.1, 1.2, 1.9, 0.2, 'metalD'), *[loft([[0, 1.0 + i*0.3 - 0.0, -0.0, 0.3, 0.3], [0, 1.0 + i*0.3, 0.1, 0.3, 0.3]], 'red', ax='z', n=8) for i in range(2)], b(0, 0.2, 0.0, 1.1, 0.04, 0.2, 'metal'), loft([[-0.3, 0.4, 0.0, 0.2, 0.2], [-0.3, 0.4, 0.1, 0.2, 0.2]], 'yellow', ax='z', n=8)])
model('security', 'turnout_rack', [b(0, 0, -0.15, 0.9, 2.0, 0.3, 'metalD')] + [p for i in range(3) for p in (b(-0.28 + i*0.28, 0.9, 0.0, 0.22, 0.9, 0.12, 'hazard' if i != 1 else 'orange'), b(-0.28 + i*0.28, 0.0, 0.0, 0.24, 0.5, 0.2, 'black'), b(-0.28 + i*0.28, 1.8, 0.0, 0.18, 0.18, 0.18, 'yellow'))] )
model('security', 'bunk_bed', [b(sx*0.45, 0, sz*0.95, 0.06, 1.7, 0.06, 'metalD') for sx in (1, -1) for sz in (1, -1)] + [b(0, 0.35, 0, 0.9, 0.12, 1.95, 'cream'), b(0, 1.15, 0, 0.9, 0.12, 1.95, 'cream'), b(0, 0.47, 0, 0.86, 0.1, 1.9, 'fabricG'), b(0, 1.27, 0, 0.86, 0.1, 1.9, 'fabricG'), b(0, 0.57, -0.7, 0.4, 0.08, 0.3, 'white'), b(0, 1.37, -0.7, 0.4, 0.08, 0.3, 'white'), b(0.5, 0.0, 0.9, 0.06, 1.2, 0.04, 'wood')])
model('security', 'metal_locker', [b(0, 0, 0, 0.9, 1.85, 0.5, 'blue')] + [b(-0.22 + i*0.44, 0.0, 0.26, 0.4, 1.8, 0.02, 'blueD') for i in range(2)] + [b(-0.22 + i*0.44, 1.5, 0.275, 0.3, 0.2, 0.01, 'black') for i in range(2)])
NOTES['security'] = 'security and emergency: holding_cell (2 m cube of bars, back at z = -1), cell_door, evidence_locker, booking_desk, radio_desk, gun_safe, fire_pole (3.2 m), hose_rack, turnout_rack, bunk_bed (single stack 0.9 x 1.95), metal_locker.'

# ---- medical ----
model('medical', 'exam_table', [b(0, 0, 0, 0.7, 0.75, 1.9, 'white'), b(0, 0.75, 0, 0.64, 0.12, 1.84, 'blue'), b(0, 0.87, -0.7, 0.64, 0.1, 0.4, 'blueD'), b(0, 0.0, 0, 0.5, 0.08, 1.4, 'metalD')])
model('medical', 'hospital_bed', [b(0, 0, 0, 0.95, 0.5, 2.1, 'metal'), b(0, 0.5, 0, 0.9, 0.18, 2.0, 'white'), b(0, 0.68, -0.4, 0.9, 0.1, 0.9, 'blue'), b(0, 0.6, -0.85, 0.5, 0.2, 0.3, 'white'), b(0, 0.5, -1.05, 0.95, 0.7, 0.05, 'metalD'), b(0, 0.5, 1.05, 0.95, 0.5, 0.05, 'metalD'),
                              *[b(sx*0.48, 0.65, 0.2, 0.03, 0.35, 1.0, 'chrome') for sx in (1, -1)], *[b(sx*0.4, 0, sz*0.9, 0.06, 0.12, 0.06, 'rubber') for sx in (1, -1) for sz in (1, -1)]])
model('medical', 'iv_stand', [b(0, 0, 0, 0.5, 0.04, 0.5, 'chrome'), cylv(0, 0.04, 0, 0.015, 1.7, 'chrome', 6), b(0, 1.7, 0, 0.5, 0.025, 0.025, 'chrome'), b(-0.2, 1.4, 0, 0.1, 0.25, 0.06, 'glass'), b(0.2, 1.45, 0, 0.1, 0.2, 0.06, 'glass')])
model('medical', 'xray_light', [b(0, 0, -0.04, 1.0, 0.7, 0.08, 'black'), fz(-0.45, 0.05, 0.45, 0.65, 0.002, 'lampOn'), flat([(-0.3, 0.1, 0.003), (0, 0.55, 0.003), (0.1, 0.1, 0.003)], 'steel', (0, 0, 1)) if False else b(0, 0.35, 0.01, 0.4, 0.4, 0.004, 'steel')])
M['medical']['xray_light'][1]['glow'] = True
model('medical', 'med_cabinet', [b(0, 0, 0, 0.9, 1.8, 0.4, 'white'), b(0, 0.9, 0.205, 0.8, 0.8, 0.01, 'glass'), *[b(-0.3 + i*0.2, 1.0 + j*0.25, 0.19, 0.12, 0.16, 0.1, ('orange', 'white', 'green')[(i + j) % 3]) for i in range(4) for j in range(3)], b(0, 0.05, 0.205, 0.8, 0.6, 0.01, 'tileD')])
model('medical', 'curtain_rail', [b(0, 1.95, 0, 2.4, 0.03, 0.03, 'chrome'), b(0, 0.4, 0, 2.4, 1.55, 0.02, 'tile')] + [b(-1.15 + i*0.19, 0.4, 0.015, 0.04, 1.55, 0.015, 'fabricB') for i in range(13)])
model('medical', 'wheelchair', [b(0, 0.45, 0, 0.5, 0.05, 0.45, 'blueD'), b(0, 0.5, -0.22, 0.5, 0.5, 0.05, 'blueD'), *[loft([[sx*0.28, 0.3, -0.05, 0.3, 0.3], [sx*0.28, 0.3, -0.03, 0.3, 0.3]], 'rubber', ax='x', n=8) if False else loft([[sx*0.27, 0.3, -0.1, 0.3, 0.3], [sx*0.3, 0.3, -0.1, 0.3, 0.3]], 'rubber', ax='x', n=8) for sx in (1, -1)], *[b(sx*0.2, 0.0, 0.28, 0.1, 0.1, 0.1, 'rubber') for sx in (1, -1)]])
model('medical', 'reception_desk', [b(0, 0, 0, 2.6, 1.05, 0.7, 'white'), b(0, 1.05, 0.05, 2.64, 0.05, 0.84, 'tile'), b(0, 1.1, -0.1, 0.4, 0.3, 0.3, 'steel'), fz(-0.15, 1.15, 0.15, 1.3, 0.06, 'screenOn'), b(0.9, 1.1, 0, 0.3, 0.05, 0.3, 'paper')])
model('medical', 'waiting_bench', [b(0, 0, 0, 1.8, 0.45, 0.5, 'blueD'), b(0, 0.45, -0.22, 1.8, 0.4, 0.06, 'blue'), *[b(sx*0.88, 0.0, 0, 0.04, 0.45, 0.5, 'chrome') for sx in (1, -1)]])
NOTES['medical'] = 'medical: exam_table, hospital_bed (0.95 x 2.1, head at -Z), iv_stand, xray_light (on a wall, back at z = -0.08, glowing), med_cabinet, curtain_rail (a ceiling-hung screen 2.4 m), wheelchair, reception_desk, waiting_bench.'

# ---- school and library ----
model('school', 'school_desk', [b(0, 0.0, 0, 0.6, 0.72, 0.45, 'woodL') if False else b(0, 0.7, 0, 0.62, 0.04, 0.46, 'woodL'), *[b(sx*0.27, 0.0, sz*0.19, 0.03, 0.7, 0.03, 'metalD') for sx in (1, -1) for sz in (1, -1)], b(0, 0.0, 0.0, 0.5, 0.03, 0.03, 'metalD'),
                           b(0, 0.42, 0.45, 0.4, 0.04, 0.38, 'woodD'), b(0, 0.0, 0.62, 0.03, 0.42, 0.03, 'metalD'), b(0, 0.46, 0.64, 0.4, 0.4, 0.04, 'woodD')])
model('school', 'teacher_desk', [b(0, 0, 0, 1.5, 0.76, 0.75, 'oak'), b(0, 0.76, 0, 1.56, 0.04, 0.8, 'woodD'), b(0.4, 0.8, 0, 0.3, 0.3, 0.3, 'steel') if False else b(-0.4, 0.8, 0.0, 0.35, 0.2, 0.25, 'paper'), b(0.45, 0.8, 0.0, 0.2, 0.18, 0.2, 'red'), b(0.55, 0.0, 0.0, 0.4, 0.7, 0.7, 'woodD')])
model('school', 'blackboard', [b(0, 0.9, -0.03, 3.2, 1.3, 0.05, 'woodD'), fz(-1.5, 1.0, 1.5, 2.1, 0.0, 'board'), b(0, 0.85, 0.02, 3.0, 0.04, 0.06, 'woodD'), b(-0.6, 0.89, 0.04, 0.12, 0.02, 0.03, 'chalk'), *text_strokes('A B C', 0.3, 0.04, 'chalk', 'wall', x0=-0.8, y0=1.5, z0=0.003, aspect=0.5, n=(0, 0, 1))])
model('school', 'trophy_case', [b(0, 0, 0, 1.4, 1.0, 0.4, 'woodD'), b(0, 1.0, 0, 1.4, 0.9, 0.4, 'glass'), *[loft([[x, 1.02, 0, 0.1, 0.1], [x, 1.2, 0, 0.04, 0.04], [x, 1.35, 0, 0.1, 0.1]], 'gold', n=6) for x in (-0.4, 0.0, 0.4)], b(0, 1.9, 0, 1.44, 0.04, 0.44, 'woodD')])
model('school', 'library_stack', [b(0, 0, 0, 1.6, 2.2, 0.8, 'woodD'), b(0, 0, 0.0, 0.03, 2.2, 0.82, 'woodL')] + [b(0, y, 0, 1.5, 0.03, 0.74, 'woodL') for y in (0.1, 0.6, 1.1, 1.6)] +
                           [b(-0.6 + i*0.4, y + 0.03, sz*0.2, 0.34, 0.3, 0.2, ('red', 'green', 'blue', 'brass', 'leather', 'cream')[(i * 2 + j + (sz > 0)) % 6]) for i in range(4) for j, y in enumerate((0.1, 0.6, 1.1, 1.6)) for sz in (1, -1)])
model('school', 'card_catalogue', [b(0, 0, 0, 1.2, 1.1, 0.5, 'oak')] + [b(-0.5 + i*0.25, 0.1 + j*0.24, 0.26, 0.22, 0.2, 0.02, 'woodD') for i in range(5) for j in range(4)] + [b(-0.5 + i*0.25, 0.18 + j*0.24, 0.285, 0.05, 0.03, 0.02, 'brass') for i in range(5) for j in range(4)])
model('school', 'reading_table', legs(2.2, 1.0, 0.72, 0.08, 'woodD') + [b(0, 0.72, 0, 2.3, 0.05, 1.1, 'oak'), b(0, 0.86, 0, 0.3, 0.14, 0.4, 'lampOn', glow=True) if False else b(0, 0.77, -0.3, 0.5, 0.35, 0.02, 'greenD'), b(0, 0.77, 0.0, 0.3, 0.03, 0.2, 'cream')])
model('school', 'lunch_table', [b(0, 0.7, 0, 2.4, 0.05, 0.75, 'plastic'), *[b(sx*1.1, 0.0, 0, 0.05, 0.7, 0.7, 'metalD') for sx in (1, -1)], b(0, 0.4, -0.55, 2.4, 0.04, 0.25, 'plastic'), b(0, 0.4, 0.55, 2.4, 0.04, 0.25, 'plastic'), *[b(sx*1.1, 0, sz*0.55, 0.04, 0.4, 0.04, 'metalD') for sx in (1, -1) for sz in (1, -1)]])
model('school', 'globe', [b(0, 0, 0, 0.3, 0.04, 0.3, 'woodD'), cylv(0, 0.04, 0, 0.012, 0.3, 'brass', 6), loft([[0, 0.34, 0, 0.0, 0.0], [0, 0.45, 0, 0.17, 0.17], [0, 0.6, 0, 0.17, 0.17], [0, 0.7, 0, 0.0, 0.0]], 'blue', n=8)])
NOTES['school'] = 'school and library: school_desk (with chair, 0.62 x 0.62 +chair at +Z), teacher_desk, blackboard (on a wall, back at z = -0.06), trophy_case, library_stack (double sided, 1.6 x 0.8 x 2.2), card_catalogue, reading_table, lunch_table (with benches), globe.'

# ---- faith ----
model('faith', 'altar', [b(0, 0, 0, 2.0, 1.0, 0.8, 'stone'), b(0, 1.0, 0, 2.1, 0.08, 0.9, 'stoneD'), b(0, 1.0, 0.43, 2.0, 0.55, 0.01, 'sg_church_tr') if False else b(0, 1.0, 0.42, 1.9, 0.6, 0.02, 'cream'), b(0, 1.08, 0, 0.12, 0.7, 0.04, 'gold'), b(0, 1.45, 0, 0.4, 0.09, 0.04, 'gold'),
                         *[b(sx, 1.08, 0, 0.08, 0.28, 0.08, 'candle') for sx in (-0.7, 0.7)], *[tip([sx, 1.36, 0], [sx, 1.43, 0], 0.025, 0.025, 'flame', glow=True) for sx in (-0.7, 0.7)]])
model('faith', 'pulpit', [b(0, 0, 0, 0.9, 0.9, 0.7, 'woodD'), b(0, 0.9, 0, 1.0, 0.45, 0.8, 'wood'), b(0, 1.35, 0, 1.04, 0.05, 0.84, 'woodL'), b(0, 1.4, 0.0, 0.5, 0.05, 0.4, 'paper'), b(0, 0.0, 0.4, 0.6, 0.9, 0.04, 'brass')])
model('faith', 'font', [cylv(0, 0, 0, 0.18, 0.8, 'stone', 8), loft([[0, 0.8, 0, 0.35, 0.35], [0, 0.95, 0, 0.45, 0.45]], 'stoneD', n=8), loft([[0, 0.94, 0, 0.38, 0.38], [0, 0.95, 0, 0.38, 0.38]], 'water', n=8)])
model('faith', 'candle_rack', [b(0, 0, 0, 0.9, 0.9, 0.4, 'metalD'), b(0, 0.9, 0, 0.9, 0.05, 0.4, 'steel'), *[b(-0.35 + i*0.14, 0.95, 0.0, 0.05, 0.14, 0.05, 'candle') for i in range(6)], *[tip([-0.35 + i*0.14, 1.09, 0.0], [-0.35 + i*0.14, 1.14, 0.0], 0.02, 0.02, 'flame', glow=True) for i in range(6) if i % 2 == 0]])
model('faith', 'organ', [b(0, 0, 0, 2.4, 1.1, 0.9, 'woodD'), b(0, 1.1, -0.2, 2.4, 0.9, 0.5, 'wood'), *[b(-1.05 + i*0.15, 1.0, -0.25, 0.1, 0.9 + 0.35*math.sin(i*0.5)**2 + 0.5, 0.1, 'brass' if i % 2 else 'chrome') for i in range(15)], b(0, 0.95, 0.45, 1.8, 0.04, 0.3, 'white'), b(0, 0, 0.7, 0.7, 0.45, 0.4, 'woodD')])
model('faith', 'confessional', [b(0, 0, 0, 2.2, 2.4, 1.1, 'woodD'), b(0, 2.4, 0, 2.3, 0.1, 1.2, 'wood'), b(-0.75, 0.0, 0.56, 0.7, 2.1, 0.03, 'fabric'), b(0.75, 0.0, 0.56, 0.7, 2.1, 0.03, 'fabric'), b(0, 0.2, 0.56, 0.7, 1.9, 0.04, 'wood')])
model('faith', 'hymn_board', [b(0, 0, -0.04, 0.9, 1.3, 0.06, 'woodD'), *[fz(-0.35 + i*0.25, 0.9, -0.15 + i*0.25, 1.2, 0.0, 'candle') for i in range(3)], b(0, 0.8, 0.0, 0.8, 0.03, 0.03, 'brass')])
model('faith', 'cross_wall', [b(0, 1.5, -0.03, 0.12, 1.1, 0.05, 'woodD'), b(0, 1.95, -0.03, 0.6, 0.12, 0.05, 'woodD')])
model('faith', 'lectern', [b(0, 0, 0, 0.5, 1.0, 0.4, 'woodD'), seg([0, 1.0, 0.0], [0, 1.15, 0.2], 0.25, 0.01, 0.25, 0.01, 'wood'), b(0, 1.1, 0.0, 0.4, 0.03, 0.3, 'paper') if False else b(0, 1.0, 0.0, 0.5, 0.03, 0.4, 'wood')])
NOTES['faith'] = 'faith: altar (2 m), pulpit, font, candle_rack (glow flames), organ (2.4 m with pipes), confessional (2.2 m), hymn_board and cross_wall (flat on a wall, back at z = -0.06), lectern. The pew is in props.furniture.'

# ---- office ----
model('office', 'cubicle', [b(0, 0, -0.9, 2.0, 1.5, 0.06, 'fabricG'), b(-1.0, 0, 0, 0.06, 1.5, 1.8, 'fabricG'), b(1.0, 0, 0, 0.06, 1.5, 1.8, 'fabricG'), b(0, 0.74, -0.55, 1.8, 0.04, 0.6, 'woodL'), b(0.7, 0.74, -0.2, 0.04, 0.0, 0.0, 'woodL') if False else b(0.7, 0.0, -0.55, 0.5, 0.74, 0.55, 'metalD'),
                           b(-0.3, 0.78, -0.65, 0.5, 0.3, 0.05, 'black'), fz(-0.5, 0.82, -0.1, 1.04, -0.62, 'screenOn'), b(-0.3, 0.78, -0.55, 0.2, 0.02, 0.15, 'black'), b(0.4, 0.78, -0.5, 0.3, 0.2, 0.3, 'paper')])
model('office', 'office_desk', [b(0, 0, 0, 1.6, 0.74, 0.8, 'woodD') if False else b(0, 0.72, 0, 1.6, 0.04, 0.8, 'woodL'), *[b(sx*0.75, 0.0, 0, 0.05, 0.72, 0.7, 'metalD') for sx in (1, -1)], b(0, 0.4, -0.38, 1.5, 0.3, 0.02, 'metalD'), b(-0.35, 0.76, -0.1, 0.5, 0.28, 0.05, 'black'), fz(-0.57, 0.8, -0.13, 1.0, -0.07, 'screenOn'),
                           b(-0.35, 0.76, 0.1, 0.4, 0.02, 0.15, 'black'), b(0.5, 0.76, 0.0, 0.3, 0.12, 0.25, 'paper')])
model('office', 'office_chair', [cylv(0, 0.25, 0, 0.03, 0.2, 'metalD', 6), b(0, 0.0, 0, 0.55, 0.05, 0.55, 'black'), b(0, 0.45, 0, 0.46, 0.08, 0.46, 'blueD'), b(0, 0.55, -0.2, 0.44, 0.5, 0.06, 'blueD')])
model('office', 'copier', [b(0, 0, 0, 0.9, 1.0, 0.7, 'plastic'), b(0, 1.0, 0, 0.9, 0.1, 0.7, 'metalD'), fz(0.1, 0.95, 0.35, 1.05, 0.355, 'screenOn') if False else b(0.25, 0.85, 0.351, 0.25, 0.1, 0.01, 'screenOn'), b(0, 1.1, -0.1, 0.8, 0.02, 0.5, 'white')])
model('office', 'water_cooler', [b(0, 0, 0, 0.35, 0.95, 0.35, 'plastic'), b(0, 0.95, 0, 0.3, 0.4, 0.3, 'ice'), b(0, 0.55, 0.18, 0.1, 0.05, 0.03, 'blue'), b(0.1, 0.55, 0.18, 0.06, 0.05, 0.03, 'red')])
model('office', 'conference_table', legs(3.6, 1.3, 0.72, 0.18, 'woodD') + [b(0, 0.72, 0, 3.8, 0.06, 1.4, 'oak'), *[b(x, 0.79, 0.0, 0.3, 0.02, 0.25, 'paper') for x in (-1.2, 0.0, 1.2)], b(0, 0.78, 0.0, 0.3, 0.1, 0.3, 'black')])
model('office', 'filing_cabinet', [b(0, 0, 0, 0.5, 1.3, 0.6, 'metal')] + [b(0, 0.05 + i*0.4, 0.31, 0.44, 0.35, 0.01, 'metalD') for i in range(3)] + [b(0, 0.3 + i*0.4, 0.32, 0.18, 0.03, 0.02, 'chrome') for i in range(3)])
model('office', 'safe_big', [b(0, 0, 0, 1.4, 2.0, 0.8, 'steel'), cylv(0, 0.9, 0.41, 0.3, 0.1, 'metalD', 8) if False else loft([[0, 1.0, 0.4, 0.32, 0.32], [0, 1.0, 0.46, 0.32, 0.32]], 'metalD', ax='z', n=8), b(0, 1.0, 0.47, 0.5, 0.06, 0.04, 'chrome'), b(0, 1.0, 0.47, 0.06, 0.5, 0.04, 'chrome'), b(0.55, 0.9, 0.42, 0.1, 0.4, 0.05, 'brass')])
model('office', 'safe_deposit', [b(0, 0, -0.2, 2.4, 2.2, 0.4, 'steel')] + [fz(-1.0 + i*0.25 - 0.1, 0.15 + j*0.3, -1.0 + i*0.25 + 0.1, 0.15 + j*0.3 + 0.24, 0.002, 'metalD') for i in range(9) for j in range(6)] +
                           [fz(-1.0 + i*0.25 - 0.02, 0.24 + j*0.3, -1.0 + i*0.25 + 0.02, 0.27 + j*0.3, 0.003, 'brass') for i in range(9) for j in range(6)])
model('office', 'teller_window', [b(0, 0, 0, 2.4, 1.1, 0.7, 'stone'), b(0, 1.1, 0, 2.44, 0.05, 0.74, 'oak'), b(0, 1.15, 0.2, 2.4, 1.0, 0.04, 'glass'), b(0, 1.15, 0.2, 2.5, 0.05, 0.06, 'brass'), b(0, 2.15, 0.2, 2.5, 0.05, 0.06, 'brass'), *[b(x, 1.15, 0.2, 0.05, 1.0, 0.06, 'brass') for x in (-1.2, 0, 1.2)], b(0.2, 1.15, 0.2, 0.5, 0.12, 0.2, 'brass')])
model('office', 'atm', [b(0, 0, 0, 0.7, 1.6, 0.6, 'steel'), b(0, 1.0, 0.31, 0.5, 0.4, 0.02, 'black'), fz(-0.2, 1.1, 0.2, 1.35, 0.32, 'screenOn'), b(0, 0.8, 0.33, 0.3, 0.1, 0.03, 'metalD'), b(0, 0.55, 0.33, 0.25, 0.04, 0.02, 'black')])
model('office', 'vault_door', [b(-1.1, 0, 0, 0.2, 2.6, 0.5, 'steel'), b(1.1, 0, 0, 0.2, 2.6, 0.5, 'steel'), b(0, 2.5, 0, 2.4, 0.2, 0.5, 'steel'), loft([[0, 1.2, 0.25, 0.95, 0.95], [0, 1.2, 0.4, 0.95, 0.95]], 'metalD', ax='z', n=12), loft([[0, 1.2, 0.41, 0.3, 0.3], [0, 1.2, 0.5, 0.3, 0.3]], 'steel', ax='z', n=8), *[b(0, 1.2, 0.51, 1.0, 0.06, 0.06, 'chrome') if False else tip([0, 1.2, 0.5], [0.0, 1.2 + 0.7*k, 0.5], 0.05, 0.05, 'chrome') for k in (1, -1)]])
NOTES['office'] = 'office and bank: cubicle (2 x 1.8, open at +Z), office_desk (1.6 x 0.8, chair at +Z), office_chair, copier, water_cooler, conference_table (3.8 x 1.4), filing_cabinet, safe_big, safe_deposit (a wall of boxes), teller_window (glass screen on a counter), atm, vault_door (a frame 2.4 m wide with a round door set into it; the door is the wheel at z 0.25 to 0.5).'

# ---- industrial ----
model('industrial', 'pallet', [b(0, 0.0, 0, 1.2, 0.04, 1.0, 'woodL')] + [b(x, 0.04, 0, 0.1, 0.1, 1.0, 'wood') for x in (-0.55, 0.0, 0.55)] + [b(0, 0.14, z, 1.2, 0.03, 0.12, 'woodL') for z in (-0.44, -0.15, 0.15, 0.44)])
model('industrial', 'pallet_loaded', M['industrial']['pallet'] + [b(0, 0.17, 0, 1.1, 1.0, 0.9, 'cardboard'), b(0, 1.17, 0, 1.08, 0.04, 0.88, 'plastic'), b(0, 0.17, 0.452, 0.4, 0.3, 0.005, 'label') if False else fz(-0.2, 0.5, 0.2, 0.8, 0.451, 'paper')])
model('industrial', 'pallet_rack', [b(sx, 0, sz, 0.08, 4.2, 0.08, 'blue') for sx in (-1.3, 1.3) for sz in (-0.5, 0.5)] + [b(0, y, sz, 2.7, 0.12, 0.06, 'orange') for y in (0.3, 1.7, 3.1) for sz in (-0.5, 0.5)] + [b(0, y + 0.12, 0, 2.5, 0.03, 1.0, 'woodD') for y in (0.3, 1.7, 3.1)] +
                           [b(x, y + 0.15, 0, 0.7, 0.9, 0.8, 'cardboard') for y in (0.3, 1.7, 3.1) for x in (-0.8, 0.0, 0.8) if (x < 0) == (y > 1)])
model('industrial', 'steel_drum_stack', [loft([[x, 0, z, 0.29, 0.29], [x, 0.88, z, 0.29, 0.29]], ('blueD', 'red', 'green', 'metalD')[i % 4], n=8) for i, (x, z) in enumerate(((-0.3, -0.3), (0.3, -0.3), (-0.3, 0.3), (0.3, 0.3)))])
model('industrial', 'conveyor', [b(0, 0.6, 0, 0.8, 0.12, 4.0, 'metalD'), b(0, 0.72, 0, 0.7, 0.03, 4.0, 'rubber')] + [b(sx*0.38, 0.0, z, 0.06, 0.6, 0.06, 'steel') for sx in (1, -1) for z in (-1.8, 0, 1.8)] + [loft([[sx*0.35, 0.75, -2.0, 0.07, 0.07], [sx*0.35, 0.75, -2.0, 0.07, 0.07]], 'steel', n=6) if False else b(sx*0.4, 0.72, 0, 0.04, 0.12, 4.0, 'orange') for sx in (1, -1)])
model('industrial', 'lathe', [b(0, 0, 0, 2.0, 0.8, 0.7, 'green'), b(0, 0.8, 0, 2.0, 0.2, 0.6, 'metalD'), b(-0.8, 1.0, 0, 0.4, 0.5, 0.5, 'green'), b(0.8, 1.0, 0, 0.3, 0.3, 0.3, 'metal'), loft([[-0.6, 1.2, 0, 0.1, 0.1], [0.6, 1.2, 0, 0.04, 0.04]], 'chrome', ax='x', n=6), b(0, 1.0, 0.35, 1.9, 0.5, 0.02, 'glass')])
model('industrial', 'drill_press', [b(0, 0, 0, 0.6, 0.06, 0.45, 'green'), b(0, 0.06, -0.15, 0.1, 1.5, 0.1, 'green'), b(0, 1.2, 0, 0.3, 0.35, 0.4, 'green'), cylv(0, 0.85, 0.12, 0.015, 0.35, 'chrome', 6), b(0, 0.7, 0.0, 0.35, 0.04, 0.3, 'metalD')])
model('industrial', 'workbench', [b(0, 0.9, 0, 2.0, 0.06, 0.75, 'woodL'), *[b(sx*0.95, 0.0, sz*0.32, 0.08, 0.9, 0.08, 'steel') for sx in (1, -1) for sz in (1, -1)], b(0, 0.3, 0.0, 1.9, 0.04, 0.65, 'woodD'), b(0.6, 0.96, 0.1, 0.18, 0.12, 0.12, 'metalD'), b(-0.4, 0.96, 0.0, 0.5, 0.05, 0.12, 'steel'), b(0, 1.4, -0.36, 1.9, 0.9, 0.04, 'woodD')])
model('industrial', 'control_console', [b(0, 0, 0, 1.8, 0.9, 0.9, 'metalD'), seg([0, 0.9, 0.35], [0, 1.15, 0.1], 0.9, 0.02, 0.9, 0.02, 'steel'), *[b(-0.6 + i*0.2, 1.0, 0.2, 0.08, 0.04, 0.08, ('red', 'green', 'yellow', 'blue')[i % 4], glow=True) for i in range(7)], b(0, 1.5, -0.2, 1.6, 0.5, 0.1, 'black'), fz(-0.7, 1.55, 0.7, 1.95, -0.14, 'screenOn')])
M['industrial']['control_console'][-1]['glow'] = True
model('industrial', 'hydraulic_press', [b(sx*0.7, 0, 0, 0.3, 2.6, 0.8, 'blue') for sx in (-1, 1)] + [b(0, 2.2, 0, 1.7, 0.5, 0.8, 'blue'), b(0, 0.0, 0, 1.7, 0.3, 0.9, 'steel'), cylv(0, 1.4, 0, 0.16, 0.8, 'chrome', 8), b(0, 1.2, 0, 0.8, 0.2, 0.5, 'metalD')])
model('industrial', 'tool_chest', [b(0, 0, 0, 0.9, 1.1, 0.5, 'red')] + [b(0, 0.05 + i*0.2, 0.26, 0.82, 0.17, 0.01, 'redD') for i in range(5)] + [b(0, 0.12 + i*0.2, 0.27, 0.3, 0.02, 0.02, 'chrome') for i in range(5)] + [b(0, 1.1, 0, 0.95, 0.04, 0.55, 'steel')])
model('industrial', 'loading_dock_door', [b(0, 0, -0.1, 3.0, 3.2, 0.2, 'metal'), b(0, 0.1, -0.0, 2.6, 2.8, 0.02, 'metalD')] + [b(0, 0.3 + i*0.4, 0.02, 2.6, 0.03, 0.02, 'metal') for i in range(7)] + [b(sx*1.4, 0.0, 0.3, 0.2, 1.2, 0.2, 'hazard') for sx in (-1, 1)])
model('industrial', 'forklift_cage', [b(sx, 0, sz, 0.05, 2.0, 0.05, 'orange') for sx in (-0.6, 0.6) for sz in (-0.6, 0.6)] + [b(0, 2.0, 0, 1.3, 0.05, 1.3, 'orange'), b(0, 1.0, 0.6, 1.2, 0.04, 0.04, 'orange'), b(0, 0.4, 0.6, 1.2, 0.04, 0.04, 'orange')])
NOTES['industrial'] = 'industrial: pallet, pallet_loaded, pallet_rack (4.2 m, 2.7 m wide, three levels, partly loaded), steel_drum_stack, conveyor (4 m along Z), lathe, drill_press, workbench (back wall board at z = -0.38), control_console, hydraulic_press, tool_chest, loading_dock_door (a 3 m door frame on the outside wall, back at z = -0.2), forklift_cage.'

# ---- utility (pumping, power, water, gas) ----
model('utility', 'transformer_cabinet', [b(0, 0, 0, 1.2, 1.6, 1.0, 'green'), b(0, 1.6, 0, 1.3, 0.05, 1.1, 'greenD'), b(0, 0.0, 0.51, 1.0, 1.4, 0.03, 'greenD'), b(0.0, 0.7, 0.54, 0.06, 0.2, 0.04, 'chrome'), *text_strokes('DANGER', 0.1, 0.018, 'yellow', 'wall', x0=0, y0=1.45, z0=0.52, aspect=0.5, n=(0, 0, 1))])
model('utility', 'switchgear', [b(0, 0, 0, 3.0, 2.2, 0.9, 'metal')] + [b(-1.2 + i*0.6, 0.15, 0.46, 0.5, 1.9, 0.02, 'metalD') for i in range(5)] + [b(-1.2 + i*0.6, 1.5, 0.48, 0.1, 0.2, 0.03, 'red') for i in range(5)] + [b(-1.2 + i*0.6, 1.0, 0.48, 0.2, 0.05, 0.03, 'black') for i in range(5)])
model('utility', 'power_pole_xfmr', [cylv(0, 0, 0, 0.16, 9.0, 'woodD', 6), b(0, 8.4, 0, 1.6, 0.1, 0.1, 'wood'), cylv(0.0, 7.2, 0.3, 0.3, 0.8, 'metalD', 8), *[b(x, 8.5, 0, 0.05, 0.2, 0.05, 'concrete') for x in (-0.7, 0, 0.7)]])
model('utility', 'pump_set', [b(0, 0, 0, 1.4, 0.15, 0.8, 'concrete'), loft([[-0.3, 0.45, 0, 0.3, 0.3], [0.2, 0.45, 0, 0.3, 0.3]], 'blue', ax='x', n=8), loft([[0.2, 0.45, 0, 0.22, 0.22], [0.55, 0.45, 0, 0.22, 0.22]], 'metalD', ax='x', n=8), loft([[0.0, 0.45, 0.0, 0.1, 0.1], [0.0, 1.2, 0.0, 0.1, 0.1]], 'steel', n=6), b(0.3, 0.9, 0.0, 0.8, 0.14, 0.14, 'steel') if False else loft([[0.0, 1.1, 0, 0.1, 0.1], [0.9, 1.1, 0, 0.1, 0.1]], 'blueD', ax='x', n=6)])
model('utility', 'boiler', [loft([[0, 0, 0, 0.7, 0.7], [0, 2.0, 0, 0.7, 0.7], [0, 2.2, 0, 0.5, 0.5]], 'metal', n=8), b(0, 0.3, 0.7, 0.4, 0.4, 0.15, 'steel'), seg([0, 2.2, 0], [0, 3.2, 0], 0.15, 0.15, 0.15, 0.15, 'steel'), b(0.5, 1.0, 0.0, 0.1, 0.1, 0.1, 'red', glow=True) if False else b(0.62, 1.0, 0.2, 0.08, 0.08, 0.08, 'red'), b(0.0, 1.3, 0.69, 0.3, 0.3, 0.03, 'chrome')])
model('utility', 'water_tank_indoor', [cylv(0, 0, 0, 0.9, 2.2, 'metalD', 8), loft([[0, 2.2, 0, 0.9, 0.9], [0, 2.5, 0, 0.0, 0.0]], 'metal', n=8), b(0, 0.0, 0, 1.9, 0.15, 1.9, 'concrete'), b(0.0, 0.2, 0.95, 0.1, 1.6, 0.1, 'water'), b(0, 1.5, 0.92, 0.14, 0.14, 0.1, 'chrome')])
model('utility', 'valve_wheel', [cylv(0, 0, 0, 0.1, 1.0, 'blue', 6), cylv(0, 1.0, 0, 0.09, 0.15, 'steel', 6), b(0, 1.0, 0.0, 0.5, 0.03, 0.05, 'red'), b(0, 1.0, 0.0, 0.05, 0.03, 0.5, 'red'), b(0, 0.4, 0, 0.4, 0.3, 0.2, 'blue')])
model('utility', 'gas_meter_bank', [b(0, 0, 0, 2.0, 1.8, 0.4, 'metalD')] + [b(-0.7 + i*0.5, 0.8, 0.22, 0.3, 0.3, 0.04, 'white') for i in range(4)] + [loft([[-0.7 + i*0.5, 0.95, 0.25, 0.1, 0.1], [-0.7 + i*0.5, 0.95, 0.26, 0.1, 0.1]], 'black', ax='z', n=8) for i in range(4)] + [b(-0.7 + i*0.5, 1.4, 0.2, 0.06, 0.4, 0.06, 'yellow') for i in range(4)])
model('utility', 'plant_panel', [b(0, 0, -0.1, 2.4, 2.2, 0.2, 'greenD')] + [b(-1.0 + i*0.5, 1.5, 0.02, 0.4, 0.4, 0.04, 'black') for i in range(5)] + [loft([[-1.0 + i*0.5, 1.7, 0.05, 0.12, 0.12], [-1.0 + i*0.5, 1.7, 0.06, 0.12, 0.12]], ('green', 'screenOn', 'yellow', 'red', 'green')[i], ax='z', n=8, glow=True) for i in range(5)] + [b(-1.0 + i*0.5, 0.9, 0.03, 0.08, 0.08, 0.04, ('red', 'green')[i % 2]) for i in range(5)])
model('utility', 'cooling_unit', [b(0, 0, 0, 2.0, 1.8, 1.0, 'metal'), loft([[0.0, 1.8, 0.0, 0.8, 0.45], [0.0, 1.85, 0.0, 0.8, 0.45]], 'black', n=8) if False else loft([[0, 1.8, 0, 0.7, 0.7], [0, 1.9, 0, 0.7, 0.7]], 'black', n=8), *[b(0, 0.1 + i*0.25, 0.51, 1.8, 0.04, 0.02, 'metalD') for i in range(6)]])
NOTES['utility'] = 'utility (pumping station, substation, boiler house, plant room): transformer_cabinet, switchgear (3 m wall of panels), power_pole_xfmr (9 m pole with a transformer), pump_set, boiler (3.2 m flue), water_tank_indoor, valve_wheel, gas_meter_bank, plant_panel (flat on a wall, lamps glow), cooling_unit.'

# ---- home extras (the basic furniture is in props.furniture) ----
model('home', 'dining_table', legs(1.5, 0.9, 0.74, 0.07, 'woodD') + [b(0, 0.74, 0, 1.6, 0.05, 1.0, 'wood'), b(0, 0.79, 0, 0.5, 0.01, 0.5, 'cream')])
model('home', 'kitchen_chair', legs(0.4, 0.4, 0.45, 0.04, 'woodD') + [b(0, 0.45, 0, 0.42, 0.04, 0.42, 'woodL'), b(0, 0.49, -0.19, 0.42, 0.45, 0.04, 'wood')])
model('home', 'armchair', [b(0, 0, 0, 0.85, 0.3, 0.85, 'fabricG'), b(0, 0.3, -0.33, 0.85, 0.55, 0.2, 'fabricG'), *[b(sx*0.4, 0.3, 0.05, 0.14, 0.25, 0.7, 'fabricG') for sx in (1, -1)], b(0, 0.3, 0.05, 0.6, 0.12, 0.6, 'cream')])
model('home', 'coffee_table', legs(1.0, 0.5, 0.4, 0.05, 'woodD') + [b(0, 0.4, 0, 1.05, 0.04, 0.55, 'woodL')])
model('home', 'nightstand', [b(0, 0, 0, 0.45, 0.55, 0.4, 'woodL'), b(0, 0.1, 0.205, 0.38, 0.18, 0.01, 'woodD'), b(0, 0.34, 0.205, 0.38, 0.16, 0.01, 'woodD'), b(0, 0.55, 0, 0.1, 0.18, 0.1, 'lampOn', glow=True) if False else b(0.0, 0.55, 0.0, 0.14, 0.2, 0.14, 'cream')])
model('home', 'dresser', [b(0, 0, 0, 1.1, 0.95, 0.5, 'woodL')] + [b(0, 0.05 + i*0.22, 0.255, 1.04, 0.2, 0.01, 'woodD') for i in range(4)] + [b(sx, 0.13 + i*0.22, 0.27, 0.12, 0.025, 0.02, 'brass') for i in range(4) for sx in (-0.3, 0.3)])
model('home', 'bunk_beds_kids', [b(sx*0.45, 0, sz*0.95, 0.06, 1.5, 0.06, 'woodD') for sx in (1, -1) for sz in (1, -1)] + [b(0, 0.3, 0, 0.9, 0.1, 1.9, 'woodL'), b(0, 1.0, 0, 0.9, 0.1, 1.9, 'woodL'), b(0, 0.4, 0, 0.86, 0.1, 1.86, 'blue'), b(0, 1.1, 0, 0.86, 0.1, 1.86, 'red'), b(0.48, 0.3, 0.9, 0.04, 1.0, 0.05, 'woodD')])
model('home', 'crib', [b(sx*0.3, 0, sz*0.55, 0.05, 1.0, 0.05, 'woodL') for sx in (1, -1) for sz in (1, -1)] + [b(0, 0.35, 0, 0.6, 0.06, 1.1, 'cream')] + [b(sx*0.3, 0.5, 0, 0.02, 0.4, 1.0, 'woodL') for sx in (1, -1)] + [b(0, 0.5, sz*0.55, 0.6, 0.4, 0.02, 'woodL') for sz in (1, -1)] + [b(0, 0.41, 0, 0.55, 0.06, 1.0, 'pink')])
model('home', 'washer', [b(0, 0, 0, 0.6, 0.9, 0.62, 'white'), loft([[0, 0.45, 0.31, 0.22, 0.22], [0, 0.45, 0.33, 0.22, 0.22]], 'glassD', ax='z', n=8), b(0, 0.82, 0.31, 0.5, 0.06, 0.01, 'metalD')])
model('home', 'dryer', [b(0, 0, 0, 0.6, 0.9, 0.62, 'white'), loft([[0, 0.45, 0.31, 0.22, 0.22], [0, 0.45, 0.33, 0.22, 0.22]], 'glass', ax='z', n=8), b(0, 0.82, 0.31, 0.5, 0.06, 0.01, 'metalD')])
model('home', 'water_heater', [loft([[0, 0, 0, 0.28, 0.28], [0, 1.4, 0, 0.28, 0.28], [0, 1.45, 0, 0.2, 0.2]], 'white', n=8), seg([0.1, 1.45, 0], [0.1, 1.75, 0], 0.03, 0.03, 0.03, 0.03, 'copper') if False else seg([0.1, 1.45, 0], [0.1, 1.75, 0], 0.03, 0.03, 0.03, 0.03, 'brass'), b(0, 0.2, 0.27, 0.15, 0.15, 0.03, 'red')])
model('home', 'fireplace', [b(0, 0, -0.2, 1.6, 1.3, 0.5, 'stone'), b(0, 0.05, 0.05, 0.9, 0.7, 0.05, 'black'), b(0, 1.3, -0.2, 1.8, 0.08, 0.6, 'stoneD'), b(0, 1.3, -0.35, 0.8, 1.7, 0.3, 'stone'), b(0, 0.05, -0.1, 0.8, 0.12, 0.3, 'woodD')])
model('home', 'bath_sink', [b(0, 0, 0, 0.6, 0.8, 0.45, 'woodL') if False else b(0, 0, -0.05, 0.5, 0.78, 0.35, 'white'), b(0, 0.78, 0, 0.55, 0.06, 0.45, 'tile'), seg([0, 0.84, -0.18], [0, 1.0, -0.18], 0.02, 0.02, 0.02, 0.02, 'chrome'), b(0, 1.15, -0.28, 0.5, 0.7, 0.02, 'glass')])
model('home', 'shower', [b(0, 0, -0.45, 0.9, 2.0, 0.05, 'tile'), b(-0.425, 0, 0, 0.05, 2.0, 0.9, 'tile'), b(0, 0, 0, 0.9, 0.1, 0.9, 'tileD'), b(0.425, 0, 0.0, 0.03, 1.9, 0.9, 'glass'), seg([0, 1.85, -0.43], [0, 1.95, -0.2], 0.03, 0.03, 0.06, 0.06, 'chrome')])
model('home', 'bookcase_low', [b(0, 0, 0, 1.0, 1.0, 0.3, 'woodD')] + [b(-0.4 + i*0.1, y + 0.03, 0.02, 0.08, 0.25, 0.2, ('red', 'green', 'blue', 'cream', 'brass')[(i + j) % 5]) for i in range(8) for j, y in enumerate((0.05, 0.5))])
model('home', 'piano', [b(0, 0, 0, 1.5, 1.2, 0.65, 'black'), b(0, 0.7, 0.4, 1.4, 0.04, 0.2, 'white'), b(0, 0.6, 0.48, 1.4, 0.06, 0.06, 'black'), b(0, 0.0, 0.5, 0.6, 0.45, 0.35, 'woodD'), b(0, 1.2, -0.05, 1.5, 0.04, 0.55, 'black')])
model('home', 'wood_stove', [b(0, 0, 0, 0.6, 0.7, 0.5, 'black'), b(0, 0.7, 0, 0.62, 0.04, 0.52, 'steel'), b(0, 0.2, 0.26, 0.3, 0.25, 0.02, 'flame', glow=True), seg([0, 0.74, -0.1], [0, 2.4, -0.1], 0.08, 0.08, 0.08, 0.08, 'black'), b(0, 0, 0, 0.7, 0.04, 0.6, 'stoneD')])
P['copper'] = '#b46a3a'
NOTES['home'] = 'home (adds to props.furniture): dining_table (1.6 x 1.0), kitchen_chair, armchair, coffee_table, nightstand, dresser, bunk_beds_kids, crib, washer, dryer, water_heater, fireplace (back at z = -0.45), bath_sink, shower (0.9 square, glass at +X), bookcase_low, piano, wood_stove.'

# ================= which fixtures go in which room (same form as ROOMS in play.html) =================
# [thing, where, how many, extras]; thing is "<group>.<name>" in this pack or a plain name from props.furniture / play.html FURN.
ROOM_FIX = {
  'market': [['retail.checkout', 'door', 2], ['retail.freezer_chest', 'far', -40], ['retail.gondola', 'rows', -9, {'gw': .06, 'gd': 1.7, 'brk': 4}], ['retail.produce_bin', 'wall', 2], ['retail.drinks_cooler', 'far', 2], ['retail.shopping_cart', 'door', 3], ['retail.basket_stack', 'door', 1]],
  'deli': [['retail.vitrine', 'door', 2], ['retail.checkout', 'door', 1], ['retail.shelf_wall', 'wall', 2], ['food.prep_table', 'far', 1]],
  'pharmacy': [['retail.checkout', 'door', 1], ['retail.gondola', 'rows', -12, {'gw': .06, 'gd': 1.7, 'brk': 3}], ['retail.pharmacy_counter', 'far', 1], ['retail.pill_wall', 'far', 1], ['medical.waiting_bench', 'wall', 1]],
  'hardware': [['retail.checkout', 'door', 1], ['retail.gondola', 'rows', -12, {'gw': .06, 'gd': 1.7, 'brk': 4}], ['retail.paint_rack', 'wall', 1], ['retail.tool_wall', 'wall', 2], ['retail.lumber_rack', 'far', 1], ['industrial.pallet_loaded', 'corner', 2]],
  'boutique': [['retail.checkout', 'door', 1], ['retail.clothes_rack', 'rows', -9, {'gw': 1.1, 'gd': 1.5}], ['retail.mannequin', 'door', 2], ['retail.fitting_room', 'far', 2], ['retail.shoe_wall', 'wall', 1]],
  'estore': [['retail.checkout', 'door', 1], ['retail.display_table', 'rows', -12, {'gw': 1.2, 'gd': 1.6}], ['retail.tv_wall', 'far', 1], ['retail.shelf_wall', 'wall', 2]],
  'bookshop': [['retail.checkout', 'door', 1], ['retail.book_shelf', 'rows', -10, {'gw': .1, 'gd': 1.5, 'brk': 4}], ['home.armchair', 'corner', 1]],
  'toyshop': [['retail.checkout', 'door', 1], ['retail.toy_bin', 'rows', -12, {'gw': 1.1, 'gd': 1.2}], ['retail.shelf_wall', 'wall', 2]],
  'cstore': [['retail.checkout', 'door', 1], ['retail.drinks_cooler', 'far', 3], ['retail.gondola', 'rows', -12, {'gw': .06, 'gd': 1.7, 'brk': 3}], ['retail.ice_box', 'door', 1]],
  'jeweller': [['retail.vitrine', 'wall', 4], ['retail.checkout', 'door', 1], ['office.safe_big', 'far', 1]],
  'dining': [['food.diner_counter', 'door', 1, {'front': 'food.counter_stool'}], ['food.booth', 'wall', -10], ['home.dining_table', 'rows', -12, {'ring': 4, 'gw': 1.7, 'gd': 1.7}], ['food.jukebox', 'corner', 1], ['food.menu_board', 'far', 1], ['food.pie_case', 'door', 1]],
  'kitchenC': [['food.kitchen_range', 'wall', 1], ['food.prep_table', 'mid', 1], ['food.walk_in_cold', 'corner', 1], ['food.dish_sink', 'wall', 1]],
  'barroom': [['food.bar_counter', 'far', 1, {'front': 'food.bar_stool'}], ['food.back_bar', 'far', 1], ['food.pool_table', 'mid', 1], ['food.dartboard', 'wall', 1], ['food.cafe_table', 'rows', -12, {'ring': 3, 'gw': 1.6, 'gd': 1.6}], ['food.jukebox', 'corner', 1]],
  'cafe': [['food.espresso_bar', 'far', 1], ['food.pastry_case', 'door', 1], ['food.cafe_table', 'rows', -9, {'ring': 2, 'gw': 1.4, 'gd': 1.4}], ['home.armchair', 'corner', 1]],
  'bullpen': [['security.radio_desk', 'door', 1, {'seat': 1}], ['office.office_desk', 'rows', -16, {'face': 'far', 'seat': 1, 'gw': 1.2, 'gd': 1.6}], ['security.metal_locker', 'wall', 3], ['office.filing_cabinet', 'wall', 2], ['security.booking_desk', 'far', 1]],
  'cells': [['security.holding_cell', 'wall', -12], ['security.evidence_locker', 'wall', 1]],
  'armory': [['security.gun_safe', 'wall', 3], ['security.metal_locker', 'wall', 2], ['security.evidence_locker', 'wall', 1], ['industrial.workbench', 'wall', 1]],
  'firebay': [['security.turnout_rack', 'wall', 3], ['security.hose_rack', 'wall', 2], ['security.fire_pole', 'corner', 1], ['security.metal_locker', 'wall', 3], ['industrial.workbench', 'wall', 1]],
  'bunkroom': [['security.bunk_bed', 'wall', -8], ['security.metal_locker', 'wall', 2], ['home.nightstand', 'wall', 2]],
  'waiting': [['medical.reception_desk', 'door', 1, {'seat': 1}], ['medical.waiting_bench', 'wall', -8], ['home.armchair', 'corner', 1]],
  'exam': [['medical.exam_table', 'wall', 1], ['medical.med_cabinet', 'wall', 2], ['office.office_desk', 'wall', 1, {'seat': 1}], ['medical.xray_light', 'wall', 1]],
  'ward': [['medical.hospital_bed', 'wall', -9, {'side': 'medical.iv_stand'}], ['medical.curtain_rail', 'mid', 1], ['medical.med_cabinet', 'wall', 2], ['medical.wheelchair', 'corner', 1]],
  'classroom': [['school.blackboard', 'end', 1], ['school.teacher_desk', 'end', 1, {'off': 1.3}], ['school.school_desk', 'rows', -7, {'face': 'far', 'seat': 1, 'gw': .9, 'gd': 1.1, 'mf': 4.2}], ['school.globe', 'corner', 1]],
  'cafeteria': [['school.lunch_table', 'rows', -9, {'gw': 1.0, 'gd': 2.4}], ['food.diner_counter', 'far', 1], ['food.kitchen_range', 'wall', 1]],
  'libhall': [['office.office_desk', 'door', 1, {'seat': 1}], ['school.library_stack', 'rows', -7, {'gw': .05, 'gd': 1.5, 'brk': 4}], ['school.reading_table', 'mid', 1], ['school.card_catalogue', 'wall', 1], ['home.armchair', 'corner', 2]],
  'trophy_hall': [['school.trophy_case', 'wall', 3], ['home.bookcase_low', 'wall', 1]],
  'nave': [['faith.altar', 'end', 1], ['faith.pulpit', 'end', 1, {'off': 1.6}], ['pew', 'rows', -9, {'face': 'far', 'gw': 1.3, 'gd': .75, 'mf': 4}], ['faith.font', 'door', 1], ['faith.organ', 'wall', 1], ['faith.candle_rack', 'wall', 2], ['faith.hymn_board', 'wall', 1]],
  'vestry': [['wardrobe', 'wall', 1], ['faith.confessional', 'wall', 1], ['home.dining_table', 'mid', 1, {'ring': 2}], ['faith.lectern', 'corner', 1]],
  'chapel_hall': [['faith.lectern', 'end', 1], ['pew', 'rows', -6, {'face': 'far', 'gw': 1.3, 'gd': .75, 'mf': 3}], ['faith.candle_rack', 'wall', 1]],
  'lobby': [['office.teller_window', 'door', 1], ['home.armchair', 'wall', 2], ['office.water_cooler', 'corner', 1], ['medical.waiting_bench', 'wall', 1]],
  'bankhall': [['office.teller_window', 'far', 3, {'seat': 1}], ['medical.waiting_bench', 'wall', 1], ['office.atm', 'door', 2], ['office.office_desk', 'wall', 1, {'seat': 1}]],
  'vault': [['office.safe_deposit', 'wall', 2], ['office.safe_big', 'wall', 2], ['office.vault_door', 'door', 1]],
  'office': [['office.office_desk', 'wall', -11, {'seat': 1}], ['office.filing_cabinet', 'wall', -18], ['office.copier', 'corner', 1], ['home.bookcase_low', 'wall', 1]],
  'openplan': [['office.cubicle', 'rows', -9, {'gw': .0, 'gd': .0}], ['office.copier', 'corner', 1], ['office.water_cooler', 'corner', 1], ['office.filing_cabinet', 'wall', 3]],
  'boardroom': [['office.conference_table', 'mid', 1, {'ring': 8}], ['school.blackboard', 'end', 1], ['office.water_cooler', 'corner', 1]],
  'warehouse': [['industrial.pallet_rack', 'rows', -22, {'gw': .1, 'gd': 2.4, 'brk': 3}], ['industrial.pallet_loaded', 'wall', -30], ['industrial.steel_drum_stack', 'corner', 2], ['industrial.loading_dock_door', 'door', 1]],
  'factory': [['industrial.conveyor', 'rows', -40, {'gw': 2.0, 'gd': 4.0}], ['industrial.lathe', 'wall', 2], ['industrial.drill_press', 'wall', 2], ['industrial.hydraulic_press', 'mid', 1], ['industrial.workbench', 'wall', 2], ['industrial.control_console', 'far', 1], ['industrial.tool_chest', 'wall', 1]],
  'workshop': [['industrial.workbench', 'wall', 2], ['industrial.tool_chest', 'wall', 1], ['industrial.drill_press', 'corner', 1], ['industrial.steel_drum_stack', 'corner', 1]],
  'pumphouse': [['utility.pump_set', 'rows', -12, {'gw': 1.2, 'gd': 1.4}], ['utility.valve_wheel', 'wall', 3], ['utility.plant_panel', 'far', 1], ['utility.water_tank_indoor', 'corner', 1]],
  'substation': [['utility.switchgear', 'far', 1], ['utility.transformer_cabinet', 'wall', -14], ['utility.plant_panel', 'wall', 1]],
  'boilerhouse': [['utility.boiler', 'wall', 2], ['utility.valve_wheel', 'wall', 2], ['utility.plant_panel', 'far', 1], ['utility.gas_meter_bank', 'wall', 1]],
  'control': [['industrial.control_console', 'mid', 1, {'seat': 1}], ['utility.plant_panel', 'far', 1], ['office.office_desk', 'wall', 1, {'seat': 1}]],
  'plantroom': [['utility.cooling_unit', 'wall', 2], ['utility.water_tank_indoor', 'corner', 1], ['utility.valve_wheel', 'wall', 2]],
  'living': [['rug', 'mid', 1], ['sofa', 'wall', 1], ['home.armchair', 'corner', 1], ['tv', 'wall', 1], ['home.coffee_table', 'mid', 1], ['home.bookcase_low', 'wall', 1], ['home.fireplace', 'far', 1], ['floor_lamp', 'corner', 1]],
  'living_k': [['fridge', 'wall', 1], ['stove', 'wall', 1], ['kitchen_counter', 'wall', 2], ['sofa', 'wall', 1], ['tv', 'wall', 1], ['home.dining_table', 'mid', 1, {'ring': 4}]],
  'kitchen': [['fridge', 'wall', 1], ['stove', 'wall', 1], ['kitchen_counter', 'wall', 2], ['home.dining_table', 'mid', 1, {'ring': 4}]],
  'bedroom': [['bed', 'wall', 1, {'side': 'home.nightstand'}], ['wardrobe', 'wall', 1], ['home.dresser', 'wall', 1], ['floor_lamp', 'corner', 1]],
  'kidsroom': [['home.bunk_beds_kids', 'wall', 1], ['home.dresser', 'wall', 1], ['retail.toy_bin', 'corner', 1], ['school.school_desk', 'wall', 1]],
  'nursery': [['home.crib', 'wall', 1], ['home.dresser', 'wall', 1], ['home.armchair', 'corner', 1]],
  'bath': [['toilet', 'wall', 1], ['home.bath_sink', 'wall', 1], ['bathtub', 'wall', 1]],
  'shower_room': [['home.shower', 'corner', 2], ['home.bath_sink', 'wall', 2], ['toilet', 'wall', 2], ['security.metal_locker', 'wall', 2]],
  'laundry': [['home.washer', 'wall', 1], ['home.dryer', 'wall', 1], ['home.water_heater', 'corner', 1]],
  'hroom': [['bed', 'wall', 1, {'side': 'home.nightstand'}], ['tv', 'wall', 1], ['home.dresser', 'wall', 1], ['home.armchair', 'corner', 1]],
  'gymfloor': [['retail.tv_wall', 'far', 1], ['school.lunch_table', 'rows', -30, {'gw': 1.0, 'gd': 2.4}]],
}
ROOM_NOTE = ('roomFixtures[roomType] is a list of [thing, where, how many, extras] exactly like ROOMS in play.html (where: wall, door, far, corner, end, mid, rows; a negative number means one per that many square metres; '
             'extras ring, seat, side, front, face, gw, gd, brk, mf, off). thing is "<group>.<name>" from this pack (sizes[...] gives its footprint), or a plain name for something in props.furniture / FURN. '
             'Keep the room\'s keepClear rectangles (floorplan pack) free of anything: the walkway to every door must stay open.')
pack = {'name': 'interiors', 'version': 1, 'style': 'boxes and few frustums, flat colour; what a room is for shows in what stands in it', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base (wall boards: bottom centre, back at z = 0)',
        'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': M, 'sizes': SIZES, 'signKinds': {k: v[0] for k, v in SIGNS.items()}, 'roomFixtures': ROOM_FIX, 'roomFixturesRule': ROOM_NOTE, 'notes': NOTES}
out, st = write_pack('interiors', pack, __file__)
tot = {}
for k, v in st.items(): c = k.split('.')[0]; tot.setdefault(c, []).append(v[0])
for c, v in tot.items(): print(c, len(v), 'models, triangles', min(v), '-', max(v))
print('sizeKB', os.path.getsize(out)//1024) if False else None
