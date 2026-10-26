#!/usr/bin/env python3
"""Afterstreet fleet pack, version 1 (26 October 2026): service and heavy vehicles. Writes assets/shaped/fleet.js. Run: python3 assets/shaped/src/fleet.py

Two parts, both in the same vehicle format as the props pack (metres, long axis z, front +z, wheels turn about x, wheels sit on y 0):
models.vehicles.<name> = {body, wheel, bonnet?}: school_bus, city_bus, fire_engine, ambulance, semi_tractor, semi_trailer, tow_truck. vehicleRig[name].wheels lists every wheel centre [x, y, z] (turn the model half a turn on the left side); vehicleSpec[name] gives size, axles and roof points. Buses and the fire engine and ambulance have no bonnet; the semi_tractor and school_bus have one.
models.livery.<name> = a list of pieces to draw over a props-pack body (sedan, suv, van, pickup): police_sedan, police_suv, taxi_sedan, ambulance_van, mail_van, tow_pickup, fire_chief_suv. liveryInfo[name] gives the base vehicle, the paint to use and which lights glow.
Colour names are in the palette."""
import math, os
from kit import *
from bld import bx
P = {'tyre': '#232325', 'hub': '#9a9a96', 'steel': '#6a7078', 'steelD': '#4a4e54', 'chrome': '#c8c8c2', 'black': '#1c1d20', 'underside': '#17181a', 'glass': '#3c4a52', 'glassL': '#9bb3ba', 'white': '#e8e4d8', 'whiteD': '#c4c0b2',
     'yellow': '#e0b420', 'yellowD': '#b88a14', 'red': '#b32d24', 'redD': '#8a2018', 'blue': '#2e4a8a', 'blueL': '#3a6ab0', 'amber': '#ffb020', 'lampR': '#ff3a2a', 'lampB': '#3a6aff', 'head': '#f2ead2', 'tail': '#a8322a',
     'cityBlue': '#2a5a96', 'cityGrey': '#b8bcc0', 'orangeD': '#c8601c', 'wood': '#9a7a52', 'cream': '#d8d0b8', 'sign': '#fff2b0', 'green': '#3e6a34', 'plate': '#e6e2d0', 'rubber': '#2c2c2e', 'paintTrk': '#c8c8c8'}
M, VRIG, SPEC, LIV, LINFO = {}, {}, {}, {}, {}
def tyre(x, z, r, w):
    hw = w/2
    return [loft([[x - hw, r, z, r*0.88, r*0.88], [x - hw + 0.03, r, z, r, r], [x + hw - 0.03, r, z, r, r], [x + hw, r, z, r*0.88, r*0.88]], 'tyre', ax='x', n=8),
            loft([[x - hw - 0.006, r, z, r*0.6, r*0.6], [x + hw + 0.006, r, z, r*0.6, r*0.6]], 'hub', ax='x', n=6)]
def arch_box(x0, x1, y0, y1, z0, z1, ws, c, clear=0.1):
    ya = max(r for _, r in ws)*2 + clear*1.4; o = [box([(x0 + x1)/2, (ya + y1)/2, (z0 + z1)/2], [x1 - x0, y1 - ya, z1 - z0], c)]; cur = z0
    for z, r in sorted(ws):
        if z - r - clear - cur > 0.04: o.append(box([(x0 + x1)/2, (y0 + ya + 0.02)/2, (cur + z - r - clear)/2], [x1 - x0, ya + 0.02 - y0, z - r - clear - cur], c))
        cur = z + r + clear
    if z1 - cur > 0.04: o.append(box([(x0 + x1)/2, (y0 + ya + 0.02)/2, (cur + z1)/2], [x1 - x0, ya + 0.02 - y0, z1 - cur], c))
    return o
def sidex(sx, W, z0, z1, y0, y1, c, d=0.004):
    za, zb = (z0, z1) if sx > 0 else (z1, z0)
    return flat([(sx*(W + d), y0, za), (sx*(W + d), y0, zb), (sx*(W + d), y1, zb), (sx*(W + d), y1, za)], c, (sx, 0, 0))
def endz(sz, Wd, x0, x1, y0, y1, z, c):
    a, b = (x0, x1) if sz > 0 else (x1, x0)
    return flat([(a, y0, z), (b, y0, z), (b, y1, z), (a, y1, z)], c, (0, 0, sz))
def windows(W, z0, z1, y0, y1, n, c='glass', gap=0.12):
    o = []; step = (z1 - z0)/n
    for i in range(n):
        for sx in (1, -1): o.append(sidex(sx, W, z0 + i*step + gap/2, z0 + (i + 1)*step - gap/2, y0, y1, c, 0.006))
    return o
def vehicle(name, body, ws, r, tw, spec, bonnet=None):
    """register: ws = list of (x, z) wheel centres; the wheel model is one tyre at the origin"""
    first = tyre(0, 0, r, tw)
    M[name] = {'body': body + [q for x, z in ws for q in tyre(x, z, r, tw)], 'wheel': first}
    if bonnet: M[name]['bonnet'] = bonnet
    VRIG[name] = {'wheels': [[round(x, 3), r, round(z, 3)] for x, z in ws], 'wheelAxis': 'x', 'wheelRule': 'Place the wheel model at each position (turned half a turn on the left side), spin it about x. The body already shows tyres standing in the arches so a stopped vehicle needs no wheels.'}
    SPEC[name] = dict(spec, wheelR=r, wheelW=tw)
def lights(z, sx_list, y0, y1, face, c):
    return [endz(face, 0, sx - 0.14, sx + 0.14, y0, y1, z, c) for sx in sx_list]
# ================= school bus =================
def school_bus():
    W, r = 1.25, 0.5; fz, rz = 3.3, -3.0; ya = 2*r + 0.14
    o = [box([0, 0.45, -0.3], [2*W - 0.4, 0.3, 9.6], 'underside')]
    o += arch_box(-W, W, 0.55, 2.95, -5.3, 2.5, [(rz, r)], 'yellow')
    o += [hull([(-W, 2.9, -5.3), (W, 2.9, -5.3), (W, 2.9, 2.5), (-W, 2.9, 2.5), (-W + 0.1, 3.08, -5.3), (W - 0.1, 3.08, -5.3), (W - 0.1, 3.08, 2.4), (-W + 0.1, 3.08, 2.4)], 'yellow')]
    o += windows(W, -5.0, 2.2, 1.8, 2.6, 9) + [sidex(sx, W, -5.3, 2.5, 1.45, 1.6, 'black') for sx in (1, -1)] + [sidex(sx, W, -5.3, 2.5, 0.95, 1.05, 'black') for sx in (1, -1)]
    o += [box([0, 1.7, 2.52], [2*W - 0.2, 1.6, 0.06], 'glass'), endz(-1, W, -0.5, 0.5, 1.3, 2.3, -5.31, 'black'), box([0, 2.05, -5.33], [1.4, 0.08, 0.05], 'black')]
    o += [box([sx*(W - 0.1), 2.95, 2.4], [0.2, 0.15, 0.2], c, glow=True) for sx, c in ((1, 'lampR'), (-1, 'lampR'))] + [box([sx*(W - 0.35), 2.95, 2.4], [0.2, 0.15, 0.2], 'amber', glow=True) for sx in (1, -1)]
    o += [box([sx*(W - 0.1), 2.95, -5.28], [0.2, 0.15, 0.1], 'lampR', glow=True) for sx in (1, -1)] + [box([-W - 0.25, 1.85, 1.9], [0.04, 0.6, 0.6], 'red')]
    o += [box([0, 0.55, -5.4], [2*W, 0.2, 0.14], 'black'), box([0, 0.55, 2.55], [2*W, 0.2, 0.14], 'black')]
    o += [box([W + 0.02, 1.5, 1.75], [0.05, 2.0, 0.9], 'glassL'), box([-W - 0.2, 1.7, 2.15], [0.4, 0.26, 0.04], 'chrome')]
    hood = [hull([(-0.95, ya, 2.55), (0.95, ya, 2.55), (0.95, ya, 4.7), (-0.95, ya, 4.7), (-0.95, 1.55, 2.58), (0.95, 1.55, 2.58), (0.9, 1.55, 4.7), (-0.9, 1.55, 4.7)], 'yellow')]
    o += [hull([(-0.97, 0.55, fz + r + 0.1), (0.97, 0.55, fz + r + 0.1), (0.97, 0.55, 4.72), (-0.97, 0.55, 4.72), (-0.95, ya, fz + r + 0.1), (0.95, ya, fz + r + 0.1), (0.95, ya, 4.7), (-0.95, ya, 4.7)], 'yellow')]
    o += [box([0, 0.65, 4.78], [2.1, 0.22, 0.14], 'black'), box([0, 1.0, 4.72], [1.0, 0.5, 0.05], 'black')] + [endz(1, 0, sx - 0.18, sx + 0.18, 1.05, 1.3, 4.72, 'head') for sx in (-0.7, 0.7)]
    ws = [(sx*(W - 0.18), z) for sx in (1, -1) for z in (fz, rz)]
    vehicle('school_bus', o, ws, r, 0.3, {'length': 10.1, 'width': 2.5, 'height': 3.1, 'axles': [fz, rz], 'roof': {'y': 3.08, 'z': -1.4, 'w': 2.2, 'd': 7.5}, 'nose': 4.8, 'tail': -5.4, 'doorSide': 'right front', 'seats': 40}, hood)
school_bus()
# ================= city bus =================
def city_bus():
    W, r = 1.3, 0.5; fz, rz = 3.6, -3.4; ya = 2*r + 0.14
    o = [box([0, 0.45, 0], [2*W - 0.4, 0.3, 11.2], 'underside')]
    o += arch_box(-W, W, 0.5, 3.1, -6.0, 6.0, [(rz, r), (fz, r)], 'cityGrey')
    o += [hull([(-W, 3.05, -6.0), (W, 3.05, -6.0), (W, 3.05, 6.0), (-W, 3.05, 6.0), (-W + 0.12, 3.2, -6.0), (W - 0.12, 3.2, -6.0), (W - 0.12, 3.2, 5.95), (-W + 0.12, 3.2, 5.95)], 'white')]
    o += windows(W, -5.6, 5.3, 1.45, 2.65, 8, 'glass', 0.18) + [sidex(sx, W, -6.0, 6.0, 0.9, 1.35, 'cityBlue') for sx in (1, -1)] + [sidex(sx, W, -6.0, 6.0, 2.7, 2.95, 'cityBlue') for sx in (1, -1)]
    o += [sidex(1, W, -1.6, -0.2, 0.6, 2.7, 'glassL', 0.008), sidex(1, W, 3.9, 5.3, 0.6, 2.7, 'glassL', 0.008)]
    o += [box([0, 1.9, 6.02], [2*W - 0.2, 1.4, 0.06], 'glass'), box([0, 2.85, 6.03], [1.9, 0.35, 0.05], 'black'), box([0, 2.85, 6.06], [1.7, 0.26, 0.03], 'amber', glow=True)]
    o += [box([0, 3.25, -2.0], [2.0, 0.4, 3.0], 'steel'), box([0, 0.55, 6.08], [2*W, 0.3, 0.14], 'black'), box([0, 0.6, -6.08], [2*W, 0.3, 0.14], 'black'), box([0, 2.5, -6.03], [1.4, 0.7, 0.05], 'glass')]
    o += [endz(1, 0, sx - 0.2, sx + 0.2, 0.8, 1.1, 6.03, 'head') for sx in (-0.9, 0.9)] + [endz(-1, 0, sx - 0.15, sx + 0.15, 1.0, 1.4, -6.03, 'tail') for sx in (-0.95, 0.95)]
    o += [box([W + 0.02, 2.4, 5.8], [0.04, 0.5, 0.3], 'chrome'), box([-W - 0.15, 2.0, 5.7], [0.3, 0.4, 0.04], 'chrome')]
    ws = [(sx*(W - 0.18), z) for sx in (1, -1) for z in (fz, rz)]
    vehicle('city_bus', o, ws, r, 0.32, {'length': 12.2, 'width': 2.6, 'height': 3.5, 'axles': [fz, rz], 'roof': {'y': 3.2, 'z': -0.5, 'w': 2.0, 'd': 11.0}, 'nose': 6.1, 'tail': -6.1, 'doorSide': 'right front and mid', 'seats': 38})
city_bus()
# ================= fire engine =================
def fire_engine():
    W, r = 1.28, 0.55; fz, rz = 2.9, -2.4; ya = 2*r + 0.14
    o = [box([0, 0.5, -0.4], [2*W - 0.4, 0.3, 9.2], 'underside')]
    o += arch_box(-W, W, 0.55, 2.4, -4.9, 1.0, [(rz, r)], 'red') + arch_box(-W, W, 0.55, 3.0, 1.0, 4.1, [(fz, r)], 'red')
    o += [hull([(-W, 2.4, 1.0), (W, 2.4, 1.0), (W, 2.4, 4.1), (-W, 2.4, 4.1), (-W + 0.05, 3.05, 1.2), (W - 0.05, 3.05, 1.2), (W - 0.05, 3.05, 4.0), (-W + 0.05, 3.05, 4.0)], 'red')]
    o += [box([0, 2.55, 4.05], [2*W - 0.4, 0.75, 0.06], 'glass')] + windows(W, 1.5, 3.9, 2.45, 2.95, 2, 'glass', 0.15)
    o += [box([0, 3.12, 2.6], [2.2, 0.16, 0.5], 'black')]
    o += [box([-0.55, 3.2, 2.6], [0.9, 0.18, 0.4], 'lampR', glow=True), box([0.55, 3.2, 2.6], [0.9, 0.18, 0.4], 'lampB', glow=True)]
    o += [sidex(sx, W, -4.9, 0.95, 1.5, 1.7, 'yellow') for sx in (1, -1)] + [sidex(sx, W, -4.9, 4.1, 0.9, 1.0, 'white') for sx in (1, -1)] + [sidex(sx, W, -4.7, 0.7, 0.7, 1.4, 'redD') for sx in (1, -1)]
    o += [box([sx*(W + 0.03), 1.1, z], [0.06, 1.2, 0.8], 'steel') for sx in (1, -1) for z in (-3.8, -2.4, -0.7)]
    o += [box([0, 2.55, -2.0], [1.3, 0.1, 5.8], 'steelD'), box([0, 2.65, -2.0], [0.9, 0.1, 5.8], 'steel')]
    o += [box([sx*0.28, 2.8, -1.9], [0.06, 0.12, 6.4], 'chrome') for sx in (1, -1)] + [box([0, 2.78, -1.9 + i*0.5], [0.6, 0.04, 0.05], 'chrome') for i in range(0, 12)]
    o += [box([0, 0.65, 4.2], [2*W + 0.1, 0.34, 0.2], 'chrome'), box([0, 0.5, -5.0], [2*W, 0.3, 0.14], 'red')] + [endz(1, 0, sx - 0.18, sx + 0.18, 1.0, 1.25, 4.11, 'head') for sx in (-0.85, 0.85)] + [endz(-1, 0, sx - 0.2, sx + 0.2, 1.2, 1.5, -4.91, 'lampR') for sx in (-0.9, 0.9)]
    o += [box([0, 1.4, 4.13], [1.3, 0.55, 0.04], 'black'), box([-W - 0.2, 2.4, 3.8], [0.4, 0.3, 0.04], 'chrome')]
    ws = [(sx*(W - 0.2), z) for sx in (1, -1) for z in (fz, rz)]
    vehicle('fire_engine', o, ws, r, 0.34, {'length': 9.9, 'width': 2.6, 'height': 3.3, 'axles': [fz, rz], 'roof': {'y': 3.05, 'z': 2.6, 'w': 2.2, 'd': 2.8}, 'nose': 4.2, 'tail': -5.0, 'crew': 5})
fire_engine()
pack = {'name': 'fleet', 'version': 1, 'style': 'boxes and hulls, flat colours; boxy working vehicles', 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the vehicle on the ground', 'palette': P, 'about': __doc__.split('\n', 2)[2], 'flatModels': True,
        'models': {'vehicles': M}, 'vehicleRig': VRIG, 'vehicleSpec': SPEC,
        'use': {'school': ['school_bus'], 'public transport': ['city_bus'], 'fire station': ['fire_engine']},
        'rule': 'Same as the props vehicles: body (with tyres standing in the arches), one wheel model, positions in vehicleRig. Buses and the fire engine have no bonnet piece; school_bus has one. The roof point in vehicleSpec is where a roof rack or light bar goes. Lit pieces (flashers and light bars) are glow pieces: flash them with the siren.'}
out, st = write_pack('fleet', pack, __file__)
print({k.split('.', 1)[1]: v[0] for k, v in st.items()})
