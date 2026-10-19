#!/usr/bin/env python3
"""Afterstreet power pack, version 1 (19 October 2026): the power grid for 0.59 (art requests section 10.4).
Writes assets/shaped/power.js. Run: python3 assets/shaped/src/power.py

Every model has its origin at the centre of its base and faces +Z. Things that hang on a wall (breaker panel, outlet,
wall light) have their back at z = 0 and face +Z into the room; their mounting height is in the model. Lit parts are
glow pieces: windows, lamps, screens, status lights. Most things come as a pair: <name>_dead or _off, and _running or _on.
  Big pieces: power_plant (dead / running: turbine hall, boiler house, two stacks, transformer yard), substation (fenced),
  pole_transformer (a wooden pole with its can), pylon (a lattice tower with three arms a side).
  Inside: control_panel (dead / running), breaker_panel (closed / open / tripped), outlet and wall_light and ceiling_light (off / on).
  Portable: cable_box (off / on / overload), cable pieces, plug, battery_rack, battery_box, solar_portable, solar_roof."""
import math, random
from kit import *

R = random.Random(59)
PALETTE = {
  'concrete': '#aaa69e', 'concreteD': '#8a867e', 'clad': '#7e8c94', 'cladD': '#62707a', 'clad2': '#9a9484', 'clad2D': '#7c766a', 'roof': '#4e5256',
  'steel': '#5e6a74', 'steelD': '#434c54', 'galv': '#a9b1b5', 'galvD': '#7f878c', 'alu': '#b8bcc0', 'rust': '#8c4a2e', 'stackW': '#d8d4cc', 'stackR': '#b8322a',
  'glassDark': '#2e3a40', 'glassBroken': '#1e2428', 'glassLit': '#ffd28a', 'glassCold': '#bfe6ff', 'redLight': '#ff3a2a', 'steam': '#e4e2de', 'steamD': '#c8c6c2',
  'porcelain': '#d8d4c8', 'porcelainB': '#8a5a3a', 'trans': '#7a8a7a', 'transD': '#5e6c5e', 'wire': '#2a2a2c', 'pole': '#6a5038', 'poleD': '#4e3a28',
  'fence': '#9aa2a6', 'fenceMesh': '#7a8286', 'gravel': '#8e8a82', 'signY': '#e0b83a', 'black': '#1f2024', 'ink': '#2a2a2c',
  'panel': '#a8aca8', 'panelD': '#868a86', 'desk': '#6a7076', 'screenOff': '#22282c', 'screenOn': '#7ae0b8', 'lampOff': '#4a4e50', 'lampG': '#6aff8a', 'lampR': '#ff4a3a', 'lampA': '#ffc04a',
  'breaker': '#2a2b2e', 'breakerW': '#e8e4da', 'orange': '#d8742a', 'orangeD': '#a8541c', 'yellow': '#e0b83a', 'socket': '#e8e4da', 'socketD': '#b8b4aa',
  'cable': '#d8742a', 'cableD': '#a8541c', 'battery': '#2a2b2e', 'batteryTop': '#b8322a', 'cell': '#2a3a5a', 'cellLine': '#5a6a8a', 'bulbOff': '#d8d4c8', 'bulbOn': '#fff0c0', 'shade': '#5a6066',
  'spark': '#ffe0a0', 'sparkHot': '#fff2c0',
}
G = dict(glow=True)
M = {}
def model(name, pieces): M[name] = pieces
def b(x, y, z, w, h, d, c, **k): return box([x, y + h/2, z], [w, h, d], c, **k)
def bar(p0, p1, r, c, n=4): return seg(p0, p1, r, r, r, r, c, caps=(False, False)) if n == 4 else loft([[*p0, r, r], [*p1, r, r]], c, n=n)

# ================= power plant =================
def windows_row(x0, x1, y, h, z, step, w, lit, face=1, c_dead='glassDark', every=1):
    o = []; i = 0; x = x0
    while x + w <= x1 + 1e-6:
        if lit:
            on = (i % 5) not in (2,)
            o.append(flat([(x, y, z), (x + w, y, z), (x + w, y + h, z), (x, y + h, z)] if face > 0 else [(x + w, y, z), (x, y, z), (x, y + h, z), (x + w, y + h, z)], 'glassLit' if on else 'glassDark', (0, 0, face), **(G if on else {})))
        else:
            o.append(flat([(x, y, z), (x + w, y, z), (x + w, y + h, z), (x, y + h, z)] if face > 0 else [(x + w, y, z), (x, y, z), (x, y + h, z), (x + w, y + h, z)], 'glassBroken' if i % 4 == 1 else c_dead, (0, 0, face)))
        x += step; i += 1
    return o
def clad_block(x, z, w, h, d, c, cd, ribs=3.0):
    o = [b(x, 0, z, w, h, d, c), b(x, h, z, w + 0.4, 0.4, d + 0.4, 'roof')]
    o += [b(xx, 0.3, z + d/2 + 0.04, 0.18, h - 0.6, 0.08, cd) for xx in [x - w/2 + ribs*(i + 0.5) for i in range(int(w/ribs))]]
    o += [b(xx, 0.3, z - d/2 - 0.04, 0.18, h - 0.6, 0.08, cd) for xx in [x - w/2 + ribs*(i + 0.5) for i in range(int(w/ribs))]]
    return o
def stack(x, z, h, r0, r1, running):
    o = [loft([[x, 0, z, r0, r0], [x, h*0.85, z, r1*1.04, r1*1.04]], 'concrete', n=8, caps=[False, False]),
         loft([[x, h*0.85, z, r1*1.04, r1*1.04], [x, h*0.9, z, r1*1.02, r1*1.02]], 'stackR', n=8, caps=[False, False]),
         loft([[x, h*0.9, z, r1*1.02, r1*1.02], [x, h*0.95, z, r1*1.01, r1*1.01]], 'stackW', n=8, caps=[False, False]),
         loft([[x, h*0.95, z, r1*1.01, r1*1.01], [x, h, z, r1, r1]], 'stackR', n=8, caps=[False, True]),
         loft([[x, h - 0.01, z, r1*0.75, r1*0.75], [x, h + 0.005, z, r1*0.75, r1*0.75]], 'black', n=8, caps=[False, True])]
    o += [b(x + r1*math.cos(a), h*0.92, z + r1*math.sin(a), 0.5, 0.5, 0.5, 'redLight' if running else 'lampOff', **(G if running else {})) for a in (0.4, 2.5, 4.6)]
    if running:
        for i, (dy, s, dx) in enumerate(((3, 3.2, 0.5), (8, 5.0, 2.0), (14, 7.0, 4.5), (21, 8.5, 8.0))):
            o.append(loft([[x + dx, h + dy - s*0.6, z, 0, 0], [x + dx, h + dy, z, s, s*0.85], [x + dx*1.05, h + dy + s*0.6, z, 0, 0]], 'steam' if i % 2 else 'steamD', n=7))
    return o
def transformer(x, z, s=1.0, ry=0):
    o = [b(x, 0, z, 2.6*s, 0.4, 2.0*s, 'concrete'), b(x, 0.4, z, 2.0*s, 2.2*s, 1.4*s, 'trans'), b(x, 0.4 + 2.2*s, z, 2.1*s, 0.12, 1.5*s, 'transD')]
    o += [b(x + sx*(1.0*s + 0.12), 0.6, z + (i - 1.5)*0.32*s, 0.24, 1.6*s, 0.06, 'transD') for sx in (1, -1) for i in range(4)]
    o += [loft([[x + (i - 1)*0.6*s, 0.52 + 2.2*s, z, 0.1, 0.1], [x + (i - 1)*0.6*s, 0.52 + 2.2*s + 0.25, z, 0.12, 0.12], [x + (i - 1)*0.6*s, 0.52 + 2.2*s + 0.5, z, 0.08, 0.08], [x + (i - 1)*0.6*s, 0.52 + 2.2*s + 0.75, z, 0.11, 0.11], [x + (i - 1)*0.6*s, 0.52 + 2.2*s + 1.0, z, 0.05, 0.05]], 'porcelainB', n=6) for i in range(3)]
    o.append(b(x, 1.2, z + 0.71*s, 0.5, 0.4, 0.02, 'signY'))
    return o
def gantry(x0, x1, z, h):
    o = [b(x, 0, z, 0.35, h, 0.35, 'galv') for x in (x0, x1)] + [b((x0 + x1)/2, h - 0.5, z, x1 - x0 + 0.35, 0.4, 0.3, 'galv')]
    o += [loft([[x, h - 0.5, z, 0.08, 0.08], [x, h - 1.2, z, 0.08, 0.08]], 'porcelain', n=5) for x in [x0 + (x1 - x0)*f for f in (0.25, 0.5, 0.75)]]
    return o
def fence_run(x0, z0, x1, z1, h=2.2, gate=None):
    L = math.hypot(x1 - x0, z1 - z0); n = max(1, int(L/2.5)); o = []
    for i in range(n + 1):
        x, z = x0 + (x1 - x0)*i/n, z0 + (z1 - z0)*i/n
        o.append(b(x, 0, z, 0.08, h, 0.08, 'fence'))
    nx, nz = (z1 - z0)/L, -(x1 - x0)/L
    o.append(flat([(x0, 0.05, z0), (x1, 0.05, z1), (x1, h - 0.1, z1), (x0, h - 0.1, z0)], 'fenceMesh', (nx, 0, nz), both=True))
    o.append(seg([x0, h, z0], [x1, h, z1], 0.03, 0.03, 0.03, 0.03, 'fence', caps=(False, False)))
    return o
def plant(running):
    o = [b(0, 0, 0, 72, 0.3, 50, 'gravel')]
    o += clad_block(-6, -6, 36, 14, 16, 'clad', 'cladD')                       # turbine hall
    o += windows_row(-23.5, 11.5, 10.5, 2.2, 2.09, 3.0, 2.2, running)
    o += windows_row(-23.5, 11.5, 10.5, 2.2, -14.09, 3.0, 2.2, running, -1)
    o += clad_block(19, -8, 14, 22, 14, 'clad2', 'clad2D', 2.8)                 # boiler house
    o += windows_row(12.6, 25.4, 16.5, 2.0, -0.91, 2.8, 1.8, running)
    o += [b(-6, 0, 2.2, 6, 5, 0.3, 'cladD'), flat([(-8.5, 0.3, 2.36), (-3.5, 0.3, 2.36), (-3.5, 4.8, 2.36), (-8.5, 4.8, 2.36)], 'steelD')]     # big door
    o += stack(24, -20, 55, 2.4, 1.8, running) + stack(31, -20, 55, 2.4, 1.8, running)
    o += [b(27.5, 0, -16, 10, 1.2, 1.2, 'steelD'), b(20, 12, -15, 1.0, 1.0, 9, 'steelD')]
    # control building
    o += [b(-30, 0, 14, 8, 4, 6, 'concrete'), b(-30, 4, 14, 8.4, 0.3, 6.4, 'roof'), flat([(-30.5, 0.3, 17.01), (-29.3, 0.3, 17.01), (-29.3, 2.4, 17.01), (-30.5, 2.4, 17.01)], 'steelD')]
    o += windows_row(-33.5, -27.5, 1.5, 1.2, 17.01, 1.6, 1.2, running)
    # transformer yard
    for i in range(3): o += transformer(-14 + i*6, 12, 1.0)
    o += gantry(-17, 1, 16, 9) + gantry(-17, 1, 9, 9)
    o += fence_run(-20, 6, 4, 6) + fence_run(4, 6, 4, 20) + fence_run(4, 20, -20, 20) + fence_run(-20, 20, -20, 6)
    o += [b(-8, 1.0, 20.06, 0.8, 0.6, 0.02, 'signY')]
    if not running:
        o += [flat([(8, 2, 2.1), (11, 3, 2.1), (10, 6, 2.1), (7.5, 5, 2.1)], 'rust'), flat([(14, 3, -0.89), (17, 4, -0.89), (16, 8, -0.89)], 'rust')]
    else:
        o += [b(x, 7.0, 2.3, 0.4, 0.25, 0.3, 'lampA', **G) for x in (-20, -8, 4)] + [b(-30, 3.2, 17.2, 0.3, 0.2, 0.3, 'lampA', **G)]
    return o
model('power_plant_dead', plant(False)); model('power_plant_running', plant(True))

def control_panel(running):
    o = [b(0, 0, 0, 3.0, 0.8, 0.8, 'desk'), hull([(-1.5, 0.8, -0.4), (1.5, 0.8, -0.4), (1.5, 0.8, 0.4), (-1.5, 0.8, 0.4), (-1.5, 1.2, -0.4), (1.5, 1.2, -0.4), (1.5, 0.9, 0.35), (-1.5, 0.9, 0.35)], 'panel'),
         b(0, 0.8, -0.35, 3.0, 1.2, 0.1, 'panelD')]
    for i, x in enumerate((-1.0, 0.0, 1.0)):
        o += [b(x, 1.35, -0.29, 0.6, 0.4, 0.02, 'screenOn' if running else 'screenOff', **(G if running and i != 1 else {}))]
    for i in range(9):
        x = -1.3 + i*0.32; c = ['lampG', 'lampA', 'lampG', 'lampR', 'lampG', 'lampG', 'lampA', 'lampG', 'lampG'][i] if running else 'lampOff'
        o.append(b(x, 1.82, -0.29, 0.08, 0.08, 0.02, c, **(G if running else {})))
    for i in range(6):
        x = -1.2 + i*0.48
        o.append(box([x, 1.04, 0.0], [0.16, 0.03, 0.12], 'black')); o.append(box([x + 0.12, 1.06, 0.12], [0.03, 0.06, 0.03], 'stackR' if i % 2 else 'galv'))
    o += [b(sx*1.4, 0, 0.42, 0.1, 0.05, 0.1, 'black') for sx in (1, -1)]
    return o
model('control_panel_dead', control_panel(False)); model('control_panel_running', control_panel(True))

# ================= substation, pole, pylon =================
def substation():
    o = [b(0, 0, 0, 14, 0.15, 10, 'gravel')]
    o += transformer(-3.5, -1, 0.9) + transformer(3.5, -1, 0.9)
    o += gantry(-6, 6, -3.8, 7) + [bar([-6, 6.4, -3.8], [-3.5, 3.6, -1], 0.03, 'wire'), bar([6, 6.4, -3.8], [3.5, 3.6, -1], 0.03, 'wire')]
    o += fence_run(-7, -5, 7, -5) + fence_run(7, -5, 7, 5) + fence_run(7, 5, 1.5, 5) + fence_run(-1.5, 5, -7, 5) + fence_run(-7, 5, -7, -5)
    o += [b(-0.75, 0, 5.0, 1.5, 2.1, 0.06, 'fence'), flat([(-1.45, 0.1, 5.04), (-0.05, 0.1, 5.04), (-0.05, 2.0, 5.04), (-1.45, 2.0, 5.04)], 'fenceMesh'),
          b(0.75, 0, 5.0, 1.5, 2.1, 0.06, 'fence'), b(2.5, 1.2, 5.06, 0.6, 0.5, 0.02, 'signY'), flat([(2.42, 1.3, 5.071), (2.58, 1.3, 5.071), (2.52, 1.62, 5.071)], 'ink')]
    o += [b(-5.5, 0, 3, 1.4, 2.0, 1.0, 'panel'), b(-5.5, 2.0, 3, 1.5, 0.08, 1.1, 'panelD')]
    return o
model('substation', substation())
def pole_transformer():
    o = [loft([[0, 0, 0, 0.16, 0.16], [0, 10, 0, 0.12, 0.12]], 'pole', n=6), b(0, 9.0, 0, 2.4, 0.14, 0.12, 'poleD')]
    o += [loft([[x, 9.14, 0, 0.05, 0.05], [x, 9.3, 0, 0.07, 0.07], [x, 9.42, 0, 0.04, 0.04]], 'porcelain', n=5) for x in (-1.0, 0.0, 1.0)]
    o += [loft([[0, 6.0, 0.4, 0.32, 0.32], [0, 7.3, 0.4, 0.32, 0.32]], 'galv', n=8), loft([[0, 7.3, 0.4, 0.33, 0.33], [0, 7.4, 0.4, 0.2, 0.2]], 'galvD', n=8), b(0, 6.4, 0.2, 0.15, 0.6, 0.2, 'galvD')]
    o += [loft([[sx*0.15, 7.38, 0.4, 0.04, 0.04], [sx*0.15, 7.6, 0.4, 0.04, 0.04]], 'porcelain', n=5) for sx in (1, -1)]
    o += [bar([sx*0.15, 7.6, 0.4], [sx*1.0, 9.38, 0.0], 0.012, 'wire') for sx in (1, -1)]
    o += [bar([x, 9.42, 0], [x, 9.35 - 0.25, 3.0], 0.012, 'wire') for x in (-1.0, 0.0, 1.0)] + [bar([x, 9.42, 0], [x, 9.35 - 0.25, -3.0], 0.012, 'wire') for x in (-1.0, 0.0, 1.0)]
    o += [bar([0.2, 6.2, 0.4], [0.2, 2.5, 0.16], 0.02, 'wire'), b(0, 0, 0.18, 0.2, 2.5, 0.06, 'galvD'), b(0, 2.0, 0.22, 0.25, 0.25, 0.02, 'signY')]
    return o
model('pole_transformer', pole_transformer())
def pylon():
    o = []; base = 4.0; mid = 1.0; H1 = 22.0; H2 = 34.0
    leg = lambda sx, sz, h0, h1, w0, w1: bar([sx*w0, h0, sz*w0], [sx*w1, h1, sz*w1], 0.09, 'galv')
    lv = [(0, base), (8, 2.6), (16, 1.6), (H1, 1.1), (H2, 0.6)]
    for (h0, w0), (h1, w1) in zip(lv, lv[1:]):
        for sx in (1, -1):
            for sz in (1, -1): o.append(leg(sx, sz, h0, h1, w0, w1))
        for f in range(4):   # one X of braces on each face
            a = [((1, 1), (1, -1)), ((1, -1), (-1, -1)), ((-1, -1), (-1, 1)), ((-1, 1), (1, 1))][f]
            (ax, az), (bx, bz) = a
            o.append(bar([ax*w0, h0, az*w0], [bx*w1, h1, bz*w1], 0.04, 'galvD')); o.append(bar([bx*w0, h0, bz*w0], [ax*w1, h1, az*w1], 0.04, 'galvD'))
    o.append(tip([0, H2, 0], [0, H2 + 3, 0], 0.6, 0.6, 'galv'))
    for i, (h, L) in enumerate(((H1, 6.0), (H1 + 5.5, 5.0), (H1 + 10.5, 4.2))):
        for sx in (1, -1):
            o.append(hull([(sx*0.9, h, -0.5), (sx*0.9, h, 0.5), (sx*L, h + 0.6, 0.1), (sx*L, h + 0.6, -0.1), (sx*0.9, h + 1.4, -0.5), (sx*0.9, h + 1.4, 0.5), (sx*L, h + 0.9, 0.1), (sx*L, h + 0.9, -0.1)], 'galv'))
            o.append(loft([[sx*(L - 0.3), h + 0.6, 0, 0.12, 0.12], [sx*(L - 0.3), h - 0.4, 0, 0.18, 0.18], [sx*(L - 0.3), h - 1.6, 0, 0.12, 0.12], [sx*(L - 0.3), h - 2.2, 0, 0.06, 0.06]], 'porcelain', n=6))
            o += [bar([sx*(L - 0.3), h - 2.2, 0], [sx*(L - 0.3), h - 3.2, z], 0.03, 'wire') for z in (8.0, -8.0)]
    o += [b(sx*base, 0, sz*base, 1.4, 0.5, 1.4, 'concrete') for sx in (1, -1) for sz in (1, -1)]
    o.append(b(base*0.7, 2.5, base*0.7 + 0.1, 0.5, 0.5, 0.02, 'signY'))
    return o
model('pylon', pylon())

# ================= inside: breaker panel, outlets, lights =================
def breaker_panel(state):
    y0 = 1.2; W, H, D = 0.42, 0.62, 0.1
    o = [b(0, y0, D/2, W, H, D, 'panel'), b(0, y0 + 0.02, D + 0.001, W - 0.04, H - 0.04, 0.002, 'panelD')]
    if state == 'closed':
        o = [b(0, y0, D/2, W, H, D, 'panel'), b(0, y0 + 0.01, D + 0.006, W - 0.02, H - 0.02, 0.012, 'panel'), b(W/2 - 0.04, y0 + H/2 - 0.03, D + 0.016, 0.02, 0.06, 0.012, 'black'),
             b(0, y0 + H - 0.12, D + 0.0125, 0.12, 0.05, 0.001, 'signY'), flat([(-0.03, y0 + H - 0.115, D + 0.0131), (0.03, y0 + H - 0.115, D + 0.0131), (0.0, y0 + H - 0.075, D + 0.0131)], 'ink')]
        return o
    o.append(b(0, y0 + H - 0.14, D + 0.005, 0.12, 0.09, 0.03, 'breaker'))            # main switch
    o.append(b(0, y0 + H - 0.12 + (0.0 if state != 'tripped' else 0.0), D + 0.026, 0.04, 0.03, 0.02, 'breakerW'))
    for col, x in enumerate((-0.09, 0.09)):
        for i in range(8):
            y = y0 + 0.05 + i*0.052; tripped = state == 'tripped' and col == 1 and i == 5
            o.append(b(x, y, D + 0.008, 0.12, 0.042, 0.016, 'breaker'))
            o.append(b(x + (0.0 if tripped else 0.018), y + 0.012, D + 0.02, 0.02, 0.018, 0.012, 'lampR' if tripped else 'breakerW'))
            if tripped: o.append(b(x - 0.045, y + 0.014, D + 0.0165, 0.02, 0.014, 0.001, 'lampR', **G))
            o.append(b(x - 0.07*(1 if col == 0 else -1), y + 0.018, D + 0.0165, 0.012, 0.006, 0.001, 'breakerW'))
    o += [box([-W/2 - 0.006, y0 + H/2, D + W/2 - 0.01], [0.012, H - 0.02, W - 0.02], 'panel'), box([-W/2 - 0.0125, y0 + H/2, D + W/2 - 0.01], [0.002, H - 0.06, W - 0.06], 'panelD')]
    return o
for st in ('closed', 'open', 'tripped'): model('breaker_panel_' + st, breaker_panel(st))
def outlet(on):
    y = 0.3
    o = [b(0, y, 0.004, 0.08, 0.13, 0.008, 'socket')]
    for dy in (0.02, 0.07):
        o += [b(0, y + dy, 0.0085, 0.05, 0.04, 0.001, 'socketD'), b(-0.01, y + dy + 0.015, 0.009, 0.006, 0.012, 0.001, 'black'), b(0.01, y + dy + 0.015, 0.009, 0.006, 0.012, 0.001, 'black')]
    o.append(b(0.028, y + 0.11, 0.0085, 0.008, 0.008, 0.002, 'lampA' if on else 'lampOff', **(G if on else {})))
    return o
model('outlet_off', outlet(False)); model('outlet_on', outlet(True))
def wall_light(on):
    y = 1.9
    return [b(0, y, 0.015, 0.1, 0.14, 0.03, 'shade'), b(0, y + 0.06, 0.08, 0.03, 0.03, 0.12, 'shade'),
            loft([[0, y - 0.02, 0.14, 0.12, 0.12], [0, y + 0.12, 0.14, 0.07, 0.07]], 'shade', n=6, caps=[False, True], closed=True),
            loft([[0, y + 0.0, 0.14, 0.05, 0.05], [0, y + 0.06, 0.14, 0.035, 0.035], [0, y + 0.1, 0.14, 0, 0]], 'bulbOn' if on else 'bulbOff', n=6, **(G if on else {}))]
model('wall_light_off', wall_light(False)); model('wall_light_on', wall_light(True))
def ceiling_light(on):
    """hangs from a ceiling at y = 0 down to about -0.6 (place it at the ceiling height)"""
    return [b(0, -0.03, 0, 0.12, 0.03, 0.12, 'shade'), bar([0, -0.03, 0], [0, -0.45, 0], 0.006, 'black'),
            loft([[0, -0.45, 0, 0.05, 0.05], [0, -0.6, 0, 0.22, 0.22]], 'shade', n=8, caps=[True, False]),
            loft([[0, -0.5, 0, 0.05, 0.05], [0, -0.56, 0, 0.04, 0.04], [0, -0.6, 0, 0, 0]], 'bulbOn' if on else 'bulbOff', n=6, **(G if on else {}))]
model('ceiling_light_off', ceiling_light(False)); model('ceiling_light_on', ceiling_light(True))

# ================= portable power =================
def cable_box(state):
    o = [b(0, 0, 0, 0.36, 0.22, 0.26, 'orange'), b(0, 0.22, 0, 0.38, 0.02, 0.28, 'orangeD'), b(0, 0.0, 0, 0.38, 0.03, 0.28, 'black')]
    o += [b(sx*0.14, 0.24, 0, 0.03, 0.12, 0.03, 'black') for sx in (1, -1)] + [b(0, 0.34, 0, 0.31, 0.03, 0.04, 'black')]
    for i in range(4):
        x = -0.12 + i*0.08
        o += [b(x, 0.08, 0.131, 0.06, 0.07, 0.004, 'socket'), b(x - 0.012, 0.11, 0.1335, 0.008, 0.016, 0.001, 'black'), b(x + 0.012, 0.11, 0.1335, 0.008, 0.016, 0.001, 'black')]
    lamp = {'off': 'lampOff', 'on': 'lampG', 'overload': 'lampR'}[state]
    o += [loft([[0.12, 0.24, 0.07, 0.025, 0.025], [0.12, 0.28, 0.07, 0.02, 0.02]], lamp, n=6, **(G if state != 'off' else {}))]
    o += [b(-0.18, 0.06, 0.0, 0.02, 0.06, 0.06, 'black'), bar([-0.19, 0.09, 0.0], [-0.45, 0.012, 0.05], 0.012, 'cable')]
    if state == 'overload':
        o += [tip([-0.04, 0.12, 0.135], [-0.04 + 0.08*math.cos(a), 0.12 + 0.08*math.sin(a), 0.2], 0.004, 0.004, 'sparkHot' if i % 2 else 'spark', **G) for i, a in enumerate((0.3, 1.2, 2.2, 2.9))]
        o.append(flat([(-0.1, 0.06, 0.1325), (0.02, 0.05, 0.1325), (0.0, 0.16, 0.1325), (-0.08, 0.15, 0.1325)], 'black'))
    return o
for st in ('off', 'on', 'overload'): model('cable_box_' + st, cable_box(st))
CR = 0.012
model('cable_straight', [loft([[-0.5, CR, 0, CR, CR], [0.5, CR, 0, CR, CR]], 'cable', ax='x', n=4, rot=45, caps=[False, False])])
def arc(r, a0, a1, n, y=CR):
    pts = [(r*math.cos(a0 + (a1 - a0)*i/n), y, r*math.sin(a0 + (a1 - a0)*i/n)) for i in range(n + 1)]
    return [seg(list(p), list(q), CR, CR, CR, CR, 'cable', caps=(False, False)) for p, q in zip(pts, pts[1:])]
model('cable_corner', arc(0.25, math.pi, math.pi*1.5, 4))
def cable_up():
    """along the ground towards a wall at z = 0, then up its face to 1.0 m"""
    o = [loft([[0, CR, 0.5, CR, CR], [0, CR, 0.12, CR, CR]], 'cable', ax='z', n=4, rot=45, caps=[False, False])]
    pts = [(0, CR + 0.1 - 0.1*math.cos(a), 0.12 - 0.1*math.sin(a)) for a in [i*math.pi/2/3 for i in range(4)]]
    o += [seg(list(p), list(q), CR, CR, CR, CR, 'cable', caps=(False, False)) for p, q in zip(pts, pts[1:])]
    o += [loft([[0, 0.112, CR + 0.008, CR, CR], [0, 1.0, CR + 0.008, CR, CR]], 'cable', n=4, rot=45, caps=[False, False])]
    o += [b(0, y, 0.006, 0.03, 0.02, 0.012, 'black') for y in (0.35, 0.7)]
    return o
model('cable_up', cable_up())
model('plug', [b(0, 0, 0, 0.05, 0.03, 0.07, 'black'), b(0, 0.01, 0.045, 0.04, 0.025, 0.02, 'black'), b(-0.01, 0.015, 0.065, 0.006, 0.006, 0.02, 'galv'), b(0.01, 0.015, 0.065, 0.006, 0.006, 0.02, 'galv'),
               loft([[0, 0.015, -0.035, CR, CR], [0, 0.015, -0.3, CR, CR]], 'cable', ax='z', n=4, rot=45, caps=[False, False])])
def battery(x, y, z):
    return [b(x, y, z, 0.26, 0.18, 0.17, 'battery'), b(x - 0.08, y + 0.18, z, 0.03, 0.025, 0.03, 'batteryTop'), b(x + 0.08, y + 0.18, z, 0.03, 0.025, 0.03, 'black')]
def battery_rack():
    o = [b(sx*0.6, 0, sz*0.18, 0.04, 1.0, 0.04, 'steelD') for sx in (1, -1) for sz in (1, -1)]
    o += [b(0, y, 0, 1.24, 0.03, 0.4, 'steel') for y in (0.1, 0.55)]
    for y in (0.13, 0.58):
        o += [p for x in (-0.42, -0.14, 0.14, 0.42) for p in battery(x, y, 0)]
        o += [bar([-0.5, y + 0.205, 0], [0.5, y + 0.205, 0], 0.006, 'stackR')]
    o += [b(0.55, 1.0, 0, 0.18, 0.12, 0.1, 'panel'), b(0.55, 1.05, 0.051, 0.06, 0.04, 0.002, 'lampG', **G)]
    return o
model('battery_rack', battery_rack())
model('battery_box', [b(0, 0, 0, 0.8, 0.55, 0.5, 'steel'), b(0, 0.55, 0, 0.82, 0.04, 0.52, 'steelD'), b(0, 0.25, 0.252, 0.3, 0.2, 0.004, 'panelD'),
                      b(-0.06, 0.3, 0.255, 0.12, 0.06, 0.002, 'screenOn', **G), b(0.09, 0.3, 0.255, 0.03, 0.03, 0.002, 'lampG', **G),
                      ] + [b(sx*0.42, 0.35, 0, 0.04, 0.04, 0.3, 'black') for sx in (1, -1)]
      + [b(sx*0.3, 0.59, 0.12, 0.06, 0.04, 0.06, c) for sx, c in ((1, 'batteryTop'), (-1, 'black'))])
def solar_panel(x, y, z, w, d, tilt, frame='alu'):
    """a panel w by d, its lower edge at (x, y, z) running along X, tilted back (towards -Z) by tilt degrees"""
    t = math.radians(tilt); dy, dz = d*math.sin(t), -d*math.cos(t)
    P = lambda u, v, off=0.0: (x + u, y + v*dy + off*math.cos(t), z + v*dz + off*math.sin(t))
    o = [hull([P(-w/2, 0), P(w/2, 0), P(w/2, 1), P(-w/2, 1), P(-w/2, 0, 0.04), P(w/2, 0, 0.04), P(w/2, 1, 0.04), P(-w/2, 1, 0.04)], frame)]
    o.append(flat([P(-w/2 + 0.03, 0.03, 0.041), P(w/2 - 0.03, 0.03, 0.041), P(w/2 - 0.03, 0.97, 0.041), P(-w/2 + 0.03, 0.97, 0.041)], 'cell', (0, math.cos(t), math.sin(t))))
    for u in [-w/2 + w*i/4 for i in range(1, 4)]:
        o.append(flat([P(u - 0.005, 0.03, 0.042), P(u + 0.005, 0.03, 0.042), P(u + 0.005, 0.97, 0.042), P(u - 0.005, 0.97, 0.042)], 'cellLine', (0, math.cos(t), math.sin(t))))
    for v in (0.33, 0.66):
        o.append(flat([P(-w/2 + 0.03, v - 0.006, 0.042), P(w/2 - 0.03, v - 0.006, 0.042), P(w/2 - 0.03, v + 0.006, 0.042), P(-w/2 + 0.03, v + 0.006, 0.042)], 'cellLine', (0, math.cos(t), math.sin(t))))
    return o
model('solar_portable', solar_panel(-0.33, 0.05, 0.25, 0.6, 0.5, 60) + solar_panel(0.33, 0.05, 0.25, 0.6, 0.5, 60)
      + [bar([sx*0.5, 0.0, -0.3], [sx*0.5, 0.45, 0.05], 0.012, 'alu') for sx in (1, -1)] + [b(0, 0, 0.32, 0.2, 0.12, 0.08, 'orange'), b(0.06, 0.12, 0.32, 0.02, 0.02, 0.02, 'lampG', **G)]
      + [bar([0.0, 0.06, 0.28], [0.15, 0.012, 0.6], 0.008, 'cable')])
model('solar_roof', solar_panel(0, 0.12, 0.5, 1.7, 1.0, 25) + [b(sx*0.7, 0, 0.0, 0.05, 0.12, 1.1, 'galvD') for sx in (1, -1)] + [bar([sx*0.7, 0.1, -0.35], [sx*0.7, 0.53, -0.35], 0.02, 'galvD') for sx in (1, -1)])

pack = {'name': 'power', 'version': 1, 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the base', 'palette': PALETTE, 'darker': 0.78,
        'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': M,
        'notes': {'power_plant': 'about 72 by 50 m with 55 m stacks; the running one has lit windows, red aviation lights and steam (move the steam pieces up and fade them, or replace them with fx.smoke_column in white). Put the control_panel inside the control building (the small block at the front left).',
                  'substation': '14 by 10 m fenced yard with two transformers and a gantry; one per district. Hum when live.',
                  'pole_transformer': 'a 10 m wooden pole: wires leave its crossarm along +Z and -Z at 9.4 m; string them pole to pole.',
                  'pylon': '37 m lattice tower; wires leave each insulator along +Z and -Z at the arm tips (x = +-5.7, +-4.7, +-3.9).',
                  'breaker_panel': 'hung on a house wall at 1.2 to 1.82 m. open shows two rows of breakers; tripped has one breaker flipped with a red flag and a red glow.',
                  'cable_box': 'portable junction box: plug its lead (towards -X) into the breaker panel or a generator; four sockets on the front, status lamp on top: off, on (green), overload (red, sparks).',
                  'cable': 'cable_straight is 1 m along X lying on the ground; cable_corner a quarter turn of radius 0.25 m from -X to -Z; cable_up runs along the ground from +Z to a wall at z = 0 and up its face to 1 m. Chain them; plug is the end.',
                  'solar': 'solar_portable is a folding pair facing +Z with its own charge box; solar_roof is one 1.7 by 1.0 m panel on rails, tilted 25 degrees, for flat roofs.',
                  'lights': 'outlet (at 0.3 m), wall_light (at 1.9 m) and ceiling_light (hangs 0.6 m from a ceiling at y = 0) come off and on; on has a glow piece, add a warm point light.'}}
out, st = write_pack('power', pack, __file__)
import os
print(os.path.getsize(out)//1024, 'KB')
for k, v in st.items(): print(k, v)
