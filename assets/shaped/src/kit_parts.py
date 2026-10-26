"""Bolt-on parts for cars, trucks and work vehicles (vehicle kit). Each part is modelled at its mount: origin at the centre of the footprint on the surface it bolts to
(anchor 'front' / 'rear': at the front / rear edge of that area instead), y up from the surface, +Z the vehicle's front. 'mirror' slots are modelled for the RIGHT side (+x) only:
draw them again with x flipped for the left. BODY is the vehicle's body colour slot."""
from kitreg import *

def rail_set(W, D, zs, y=0.06):
    """two rails along z and the crossbars at zs, on black feet"""
    o = [bx(sx*(W/2 - 0.04), y, 0, 0.05, 0.05, D, 'steelD') for sx in (1, -1)]
    o += [bx(0, y + 0.04, z, W, 0.04, 0.06, 'steel') for z in zs]
    o += [bx(sx*(W/2 - 0.04), 0, z, 0.07, 0.07, 0.1, 'black') for sx in (1, -1) for z in (zs[0], zs[-1])]
    return o
def bars_z(D, n): return [(-D/2 + 0.12 + i*(D - 0.24)/(n - 1)) for i in range(n)] if n > 1 else [0.0]

# ================================================================== ROOF ==================================================================
RACKS = {'S': (1.3, 1.0, 2), 'M': (1.4, 1.6, 3), 'L': (1.5, 2.1, 3), 'XL': (1.8, 3.0, 4), 'XXL': (2.0, 4.0, 5)}
for k, (W, D, n) in RACKS.items():
    part('roof_bars_' + k, 'roof', rail_set(W, D, bars_z(D, n)), tags=['rack', 'cargo'], stats={'storage': {'S': 2, 'M': 3, 'L': 4, 'XL': 6, 'XXL': 8}[k], 'mass': 8*(1 + 'S M L XL XXL'.split().index(k)*0.5), 'speed': -1}, note='two rails and crossbars: the basic roof rack')
for k, (W, D) in {'M': (1.4, 1.7), 'L': (1.5, 2.1), 'XL': (1.8, 3.0)}.items():
    zs = bars_z(D, 3)
    o = [bx(sx*(W/2 - 0.03), 0.04, 0, 0.05, 0.05, D, 'steelD') for sx in (1, -1)] + [bx(0, 0.04, sz*(D/2 - 0.03), W, 0.05, 0.05, 'steelD') for sz in (1, -1)]
    o += [bx(0, 0.05, z, W - 0.1, 0.03, 0.05, 'steel') for z in zs]
    o += [bx(sx*(W/2 - 0.03), 0.04, z, 0.045, 0.2, 0.045, 'steel') for sx in (1, -1) for z in (-D/2 + 0.03, 0, D/2 - 0.03)]
    o += [bx(sx*(W/2 - 0.03), 0.22, 0, 0.05, 0.04, D, 'steelD') for sx in (1, -1)] + [bx(0, 0.22, sz*(D/2 - 0.03), W, 0.04, 0.05, 'steelD') for sz in (1, -1)]
    o += [bx(sx*(W/2 - 0.04), -0.0, z, 0.07, 0.04, 0.1, 'black') for sx in (1, -1) for z in (-D/2 + 0.2, D/2 - 0.2)]
    part('roof_basket_' + k, 'roof', o, tags=['rack', 'cargo', 'offroad'], stats={'storage': {'M': 6, 'L': 8, 'XL': 12}[k], 'mass': {'M': 20, 'L': 26, 'XL': 40}[k], 'speed': -2}, note='expedition basket: a caged roof platform for gear')
def roof_box(W, D, H, c='steelD'):
    return [hull([(-W/2, 0.04, -D/2), (W/2, 0.04, -D/2), (W/2, 0.04, D/2), (-W/2, 0.04, D/2), (-W/2 + 0.07, H, -D/2 + 0.04), (W/2 - 0.07, H, -D/2 + 0.04), (W/2 - 0.07, H*0.72, D/2 - 0.02), (-W/2 + 0.07, H*0.72, D/2 - 0.02)], c),
            bx(0, 0, -D/4, W - 0.3, 0.05, 0.1, 'black'), bx(0, 0, D/4, W - 0.3, 0.05, 0.1, 'black')]
for k, (W, D, H) in {'S': (0.9, 1.5, 0.32), 'M': (1.1, 1.9, 0.36), 'L': (1.3, 2.3, 0.4), 'XL': (1.6, 3.2, 0.45)}.items():
    part('roof_box_' + k, 'roof', roof_box(W, D, H), tags=['cargo', 'closed'], stats={'storage': {'S': 3, 'M': 4, 'L': 6, 'XL': 9}[k], 'mass': {'S': 12, 'M': 16, 'L': 22, 'XL': 36}[k], 'speed': -2}, note='a lockable cargo box: protects what is inside from rain and eyes')
def ladder_on_rack(W, D, n):
    o = rail_set(W, D, bars_z(D, n))
    o += [bx(sx*0.26, 0.14, 0, 0.05, 0.05, D - 0.1, 'steelL') for sx in (1, -1)]
    o += [bx(0, 0.16, -D/2 + 0.2 + i*(D - 0.4)/9, 0.5, 0.03, 0.03, 'steelL') for i in range(10)]
    return o
for k in ('L', 'XL', 'XXL'):
    W, D, n = RACKS[k]
    part('roof_ladder_' + k, 'roof', ladder_on_rack(W, D, n), tags=['rack', 'cargo', 'utility'], stats={'storage': 2, 'mass': 14 + 4*len(k), 'speed': -1, 'climb': 1}, note='a rack with a long ladder strapped on: a way up onto roofs')
def luggage(W, D, n, tall=1.0):
    o = rail_set(W, D, bars_z(D, 3))
    cols = ['suit1', 'suit2', 'suit3', 'cardboard', 'suit2', 'suit1']
    cells = []
    nx = 2 if W < 1.7 else 3; nz = max(1, int(D // 0.75))
    for i in range(nx):
        for j in range(nz):
            cells.append(((-W/2 + (i + 0.5)*W/nx), (-D/2 + (j + 0.5)*D/nz)))
    for idx, (x, z) in enumerate(cells[:n]):
        h = (0.28 + 0.09*(idx % 3))*tall
        o.append(bx(x, 0.1, z, W/nx - 0.12, h, D/nz - 0.14, cols[idx % len(cols)]))
        if idx % 2 == 0: o.append(bx(x + 0.05, 0.1 + h, z, W/nx - 0.4, 0.12, D/nz - 0.4, cols[(idx + 2) % len(cols)]))
    o.append(flat([(-W/2 + 0.1, 0.62, -D/2 + 0.1), (W/2 - 0.1, 0.62, -D/2 + 0.1), (W/2 - 0.1, 0.62, D/2 - 0.1), (-W/2 + 0.1, 0.62, D/2 - 0.1)], 'strap', (0, 1, 0))[:0] if False else bx(0, 0.1, 0, 0.04, 0.5, D - 0.2, 'strap'))
    return o
for k, n in {'M': 3, 'L': 5, 'XL': 8, 'XXL': 10}.items():
    W, D, nb = RACKS[k]
    part('roof_luggage_' + k, 'roof', luggage(W, D, n), tags=['cargo', 'load'], stats={'storage': 0, 'mass': 30, 'speed': -2, 'loot': 'luggage'}, note='bags and cases roped to the roof (a loot spot: searching them yields clothes and food)')
def tarp_load(W, D, h=0.5):
    o = rail_set(W, D, bars_z(D, 3))
    o += [hull([(-W/2 + 0.08, 0.1, -D/2 + 0.08), (W/2 - 0.08, 0.1, -D/2 + 0.08), (W/2 - 0.08, 0.1, D/2 - 0.08), (-W/2 + 0.08, 0.1, D/2 - 0.08),
                (-W/2 + 0.25, 0.1 + h, -D/2 + 0.2), (W/2 - 0.3, 0.1 + h*0.9, -D/2 + 0.25), (W/2 - 0.25, 0.1 + h*0.85, D/2 - 0.25), (-W/2 + 0.3, 0.1 + h, D/2 - 0.2)], 'canvas')]
    o += [bx(0, 0.1, z, W - 0.1, h*0.6 + 0.02, 0.03, 'strap') for z in (-D/4, D/4)]
    return o
for k in ('M', 'L', 'XL', 'XXL'):
    W, D, n = RACKS[k]
    part('roof_tarp_' + k, 'roof', tarp_load(W, D), tags=['cargo', 'load'], stats={'mass': 20, 'speed': -2}, note='a lashed tarp over a load')
def tyre_stack(r=0.36):
    o = []
    for i in range(2):
        o += [loft([[0, 0.1 + 0.2*i, 0, r, r], [0, 0.1 + 0.2*i + 0.19, 0, r, r]], 'tyre', n=8), loft([[0, 0.1 + 0.2*i + 0.19, 0, r*0.55, r*0.55], [0, 0.1 + 0.2*i + 0.2, 0, r*0.55, r*0.55]], 'rimSteel', n=6)]
    return rail_set(1.1, 0.8, bars_z(0.8, 2)) + o
part('roof_spare_tyres', 'roof', tyre_stack(), tags=['cargo', 'tyre'], stats={'mass': 30, 'speed': -1, 'loot': 'tyre'}, note='two spare tyres on the roof: take one for a flat')
def jerry_can(x, y, z, ry=0):
    return [bx(x, y, z, 0.34, 0.46, 0.16, 'jerry'), bx(x + 0.09, y + 0.46, z, 0.1, 0.07, 0.05, 'oliveD'), bx(x - 0.1, y + 0.46, z, 0.08, 0.04, 0.12, 'oliveD'), flat([(x - 0.12, y + 0.2, z + 0.081), (x + 0.12, y + 0.2, z + 0.081), (x + 0.12, y + 0.32, z + 0.081), (x - 0.12, y + 0.32, z + 0.081)], 'oliveD')]
part('roof_jerry_cans', 'roof', rail_set(1.3, 1.0, bars_z(1.0, 2)) + [p for i in range(4) for p in jerry_can(-0.5 + (i % 2)*0.6 + 0.2, 0.1, -0.3 + (i // 2)*0.5)], tags=['cargo', 'fuel'], stats={'mass': 60, 'speed': -2, 'loot': 'fuel', 'fuelBonus': 40}, note='four jerry cans: a fuel reserve (and a good thing to siphon)')
def kayak_hull(L, W, H, c):
    return [loft([[0, H*0.7, -L/2, 0.0, 0.0], [0, H*0.5, -L*0.35, W*0.4, H*0.25], [0, H*0.4, 0, W/2, H*0.3], [0, H*0.5, L*0.35, W*0.4, H*0.25], [0, H*0.7, L/2, 0.0, 0.0]], c, n=6, ax='z', caps=[False, False])]
def kayak_rack(c):
    o = rail_set(0.95, 3.0, bars_z(3.0, 3), 0.0)
    o += [bx(sx*0.22, 0.04, z, 0.06, 0.2, 0.08, 'strap') for sx in (1, -1) for z in (-0.9, 0.9)]
    o += kayak_hull(3.4, 0.62, 0.34, c)
    o = [dict(q, p=[q['p'][0], q['p'][1] + 0.18, q['p'][2]]) if q['s'] == 'loft' else q for q in o]
    return o
part('roof_kayak', 'roof', kayak_rack('kayakY'), tags=['cargo', 'boat'], stats={'mass': 20, 'speed': -2, 'carries': 'kayak'}, note='a kayak on a cradle: carry a small boat to the water')
part('roof_canoe', 'roof', kayak_rack('kayakR'), tags=['cargo', 'boat'], stats={'mass': 30, 'speed': -2, 'carries': 'canoe'}, note='a canoe on a cradle')
def roof_tent(W, D):
    o = rail_set(W, D, bars_z(D, 3))
    o += [hull([(-W/2 + 0.04, 0.1, -D/2 + 0.04), (W/2 - 0.04, 0.1, -D/2 + 0.04), (W/2 - 0.04, 0.1, D/2 - 0.04), (-W/2 + 0.04, 0.1, D/2 - 0.04), (-W/2 + 0.1, 0.42, -D/2 + 0.1), (W/2 - 0.1, 0.42, -D/2 + 0.1), (W/2 - 0.1, 0.38, D/2 - 0.1), (-W/2 + 0.1, 0.38, D/2 - 0.1)], 'tent'),
           bx(0, 0.1, 0, W - 0.04, 0.03, 0.04, 'strap'), bx(sx := W/2 + 0.02, 0.0, D/4, 0.04, 0.5, 0.04, 'steelL')][:-1]
    return o
for k, (W, D) in {'L': (1.4, 2.0), 'XL': (1.7, 2.4)}.items():
    part('roof_tent_' + k, 'roof', roof_tent(W, D), tags=['camp', 'cargo'], stats={'mass': 45, 'speed': -3, 'sleep': 2 if k == 'L' else 3}, note='a folded roof tent: unfold to sleep two (the game can let you sleep on the roof)')
def light_bar(W, kind):
    cols = {'white': ['lamp']*6, 'amber': ['lampA']*6, 'emergency': ['lampR', 'lampR', 'lamp', 'lamp', 'lampB', 'lampB']}[kind]
    n = len(cols); step = (W - 0.2)/n
    o = [bx(0, 0.0, -0.12, W, 0.09, 0.22, 'black'), *[bx(sx*(W/2 - 0.12), -0.02, -0.12, 0.06, 0.04, 0.1, 'steelD') for sx in (1, -1)]]
    o += [box([-W/2 + 0.1 + step*(i + 0.5), 0.045, -0.015], [step - 0.02, 0.07, 0.03], c, glow=True) for i, c in enumerate(cols)]
    return o
for k, W in {'S': 0.9, 'M': 1.2, 'L': 1.5}.items():
    for kind in ('white', 'amber', 'emergency'):
        if kind == 'emergency' and k == 'S': continue
        part('light_bar_%s_%s' % (kind, k), 'roof', light_bar(W, kind), anchor='front', tags=['light'] + (['emergency'] if kind == 'emergency' else []),
             stats={'light': 25 if kind == 'white' else 0, 'speed': 0, 'mass': 6, 'flash': kind == 'emergency'}, note={'white': 'a bar of white work lights: lights the road ahead (and attracts attention)', 'amber': 'amber warning lights', 'emergency': 'red and blue lights (flash them)'}[kind])
def beacon(c):
    return [bx(0, 0, 0, 0.2, 0.05, 0.2, 'black'), loft([[0, 0.05, 0, 0.09, 0.09], [0, 0.14, 0, 0.08, 0.08], [0, 0.2, 0, 0.0, 0.0]], c, n=6, glow=True, caps=[True, False])]
for c, nm in (('lampA', 'amber'), ('lampR', 'red'), ('lampB', 'blue')):
    part('beacon_' + nm, 'roof', beacon(c), tags=['light'], stats={'flash': True}, note='a rotating beacon: flash it')
part('taxi_sign', 'roof', [bx(0, 0, 0, 0.5, 0.16, 0.2, 'white'), box([0, 0.08, 0.101], [0.4, 0.1, 0.01], 'lampA', glow=True), bx(0, -0.04, 0, 0.3, 0.04, 0.1, 'black')], tags=['sign'], stats={}, note='a lit TAXI sign')
part('roof_spotlights', 'roof', [bx(0, 0, -0.1, 1.0, 0.04, 0.06, 'steelD')] + [p for x in (-0.3, -0.1, 0.1, 0.3) for p in (bx(x, 0.04, -0.1, 0.12, 0.12, 0.14, 'black'), box([x, 0.1, -0.02], [0.1, 0.1, 0.02], 'lamp', glow=True))], anchor='front', tags=['light'], stats={'light': 35, 'mass': 4}, note='four spotlights on a bar')
part('antenna_cb', 'roof', [bx(0, 0, 0, 0.1, 0.05, 0.1, 'black'), seg([0, 0.05, 0], [0.02, 1.5, -0.06], 0.012, 0.012, 0.006, 0.006, 'steelD')], anchor='rear', tags=['radio'], stats={'radio': 1.0}, note='a long whip aerial: longer radio range while you drive')
part('radio_mast', 'roof', [bx(0, 0, 0, 0.3, 0.08, 0.3, 'black'), seg([0, 0.08, 0], [0, 2.4, 0], 0.025, 0.025, 0.012, 0.012, 'steelL'), seg([0, 1.6, 0], [0.3, 2.0, 0], 0.01, 0.01, 0.006, 0.006, 'steelL'), seg([0, 1.6, 0], [-0.3, 2.0, 0], 0.01, 0.01, 0.006, 0.006, 'steelL')], anchor='rear', tags=['radio'], stats={'radio': 2.0}, note='a tall radio mast: a big radio range boost on a work truck')
for nm, c in (('white', 'white'), ('black', 'black')):
    part('stripes_roof_' + nm, 'roof_decal', [flat([(sx*0.2 - 0.06, 0.005, -9), (sx*0.2 + 0.06, 0.005, -9), (sx*0.2 + 0.06, 0.005, 9), (sx*0.2 - 0.06, 0.005, 9)], c, (0, 1, 0)) for sx in (-1, 1)][:0] or
         [flat([(x - 0.07, 0.006, -0.6), (x + 0.07, 0.006, -0.6), (x + 0.07, 0.006, 0.6), (x - 0.07, 0.006, 0.6)], c, (0, 1, 0)) for x in (-0.15, 0.15)], tags=['paint'], note='two stripes down the roof')

# ================================================================== HOOD ==================================================================
def scoop(W, D, H):
    return [hull([(-W/2, -0.03, -D/2), (W/2, -0.03, -D/2), (W/2, -0.03, D/2), (-W/2, -0.03, D/2), (-W/2 + 0.04, H, -D/2 + 0.05), (W/2 - 0.04, H, -D/2 + 0.05), (W/2 - 0.04, 0.0, D/2), (-W/2 + 0.04, 0.0, D/2)], 'BODY'),
            flat([(-W/2 + 0.08, H*0.5, D/2 - 0.02), (W/2 - 0.08, H*0.5, D/2 - 0.02), (W/2 - 0.08, 0.02, D/2 + 0.0), (-W/2 + 0.08, 0.02, D/2 + 0.0)], 'black', (0, 0.3, 1))]
part('hood_scoop_S', 'hood', scoop(0.45, 0.5, 0.12), group='bonnet', tags=['look'], stats={'speed': 1}, note='a small bonnet scoop')
part('hood_scoop_M', 'hood', scoop(0.7, 0.7, 0.18), group='bonnet', tags=['look'], stats={'speed': 2}, note='a big bonnet scoop')
part('hood_spare', 'hood', [loft([[0, 0.0, 0, 0.38, 0.38], [0, 0.22, 0, 0.38, 0.38]], 'tyre', n=8), loft([[0, 0.22, 0, 0.2, 0.2], [0, 0.23, 0, 0.2, 0.2]], 'rimSteel', n=6), bx(0, 0.0, 0, 0.5, 0.04, 0.1, 'strap')][:3], group='bonnet', tags=['tyre', 'offroad'], stats={'loot': 'tyre'}, note='a spare tyre strapped on the bonnet')

# ================================================================== FRONT ==================================================================
FW = {'S': 1.7, 'M': 1.95, 'L': 2.4}
def bull_bar(W, lights=False):
    xp = W/2 - 0.3
    o = [bx(sx*xp, -0.14, 0.18, 0.06, 0.74, 0.06, 'steelD') for sx in (1, -1)]
    o += [bx(0, 0.5, 0.2, 2*xp, 0.06, 0.06, 'steelD'), bx(0, -0.1, 0.26, 2*xp, 0.07, 0.07, 'steelD'), bx(0, 0.2, 0.2, 2*xp, 0.05, 0.05, 'steelD')]
    o += [bx(sx*xp, -0.1, 0.0, 0.05, 0.05, 0.22, 'steel') for sx in (1, -1)] + [bx(sx*xp, 0.4, 0.0, 0.05, 0.05, 0.22, 'steel') for sx in (1, -1)]
    o += [bx(sx*(W/2 - 0.1), -0.12, 0.0, 0.05, 0.4, 0.24, 'steelD') for sx in (1, -1)]
    if lights: o += [p for sx in (1, -1) for p in (bx(sx*xp*0.55, 0.56, 0.18, 0.16, 0.12, 0.08, 'black'), box([sx*xp*0.55, 0.62, 0.23], [0.13, 0.09, 0.02], 'lamp', glow=True))]
    return o
for k, W in FW.items():
    part('bull_bar_' + k, 'front', bull_bar(W), tags=['armor', 'offroad'], stats={'armor': 10 if k != 'L' else 14, 'speed': 0, 'mass': 25, 'ramDamage': 1.3}, note='a tubular bull bar: shrugs off bumps and clears the road of small things')
    part('bull_bar_lights_' + k, 'front', bull_bar(W, True), tags=['armor', 'offroad', 'light'], stats={'armor': 10, 'light': 30, 'mass': 28, 'ramDamage': 1.3}, note='a bull bar with spotlights')
def push_bar(W):
    xp = W/2 - 0.45
    return [bx(sx*xp, -0.22, 0.02, 0.1, 0.55, 0.08, 'steelD') for sx in (1, -1)] + [bx(0, 0.12, 0.1, 2*xp + 0.1, 0.16, 0.08, 'steelD'), bx(0, -0.1, 0.06, 2*xp + 0.1, 0.1, 0.06, 'steel'), bx(0, 0.0, 0.0, 0.1, 0.5, 0.06, 'steel')]
for k, W in FW.items():
    part('push_bar_' + k, 'front', push_bar(W), tags=['armor', 'utility'], stats={'armor': 8, 'mass': 18, 'ramDamage': 1.5}, note='a flat steel push bar: shoves wrecks out of the way')
def winch_bumper(W):
    return [bx(0, -0.3, 0.0, W - 0.1, 0.42, 0.2, 'steelD'), bx(0, 0.12, 0.0, W - 0.3, 0.05, 0.2, 'steel'), bx(0, 0.17, 0.04, 0.6, 0.2, 0.2, 'steel'), cyl([0, 0.3, 0.14], [0.5, 0.18, 0.18], 'steelL', ax='x'),
            bx(0, -0.14, 0.2, 0.24, 0.07, 0.05, 'steelL'), *[bx(sx*0.4, -0.12, 0.2, 0.06, 0.1, 0.06, 'warn') for sx in (1, -1)], bx(0, -0.35, 0.18, 0.1, 0.1, 0.06, 'warn')]
for k, W in FW.items():
    part('winch_bumper_' + k, 'front', winch_bumper(W), tags=['armor', 'offroad', 'tool'], stats={'armor': 12, 'mass': 60, 'winch': 1, 'ramDamage': 1.3}, note='a steel bumper with a winch: pull yourself (or another vehicle) out of mud and ditches')
def grille_guard(W):
    xp = W/2 - 0.25
    o = [bx(sx*xp, -0.3, 0.08, 0.07, 1.0, 0.07, 'steelD') for sx in (1, -1)] + [bx(0, 0.62, 0.1, 2*xp, 0.07, 0.07, 'steelD'), bx(0, 0.2, 0.12, 2*xp, 0.06, 0.06, 'steelD'), bx(0, -0.2, 0.14, 2*xp, 0.07, 0.07, 'steelD')]
    o += [bx(x, -0.2, 0.12, 0.05, 0.84, 0.05, 'steel') for x in (-xp*0.5, 0, xp*0.5)] + [bx(sx*xp, 0.0, 0.0, 0.05, 0.05, 0.1, 'steel') for sx in (1, -1)]
    o += [p for sx in (1, -1) for p in (bx(sx*xp*0.75, 0.7, 0.1, 0.18, 0.13, 0.08, 'black'), box([sx*xp*0.75, 0.77, 0.15], [0.14, 0.1, 0.02], 'lamp', glow=True))]
    return o
for k in ('M', 'L'):
    part('grille_guard_' + k, 'front', grille_guard(FW[k]), tags=['armor', 'light'], stats={'armor': 16, 'light': 25, 'mass': 45, 'ramDamage': 1.4}, note='a tall grille guard over the whole front, with lamps')
def plough(W):
    w = W + 0.25
    o = [hull([(-w/2, -0.32, 0.5), (w/2, -0.32, 0.5), (w/2, -0.32, 0.56), (-w/2, -0.32, 0.56), (-w/2, 0.5, 0.35), (w/2, 0.5, 0.35), (w/2, 0.52, 0.5), (-w/2, 0.52, 0.5)], 'plough'),
         bx(0, -0.34, 0.5, w, 0.06, 0.1, 'steelL'), bx(0, 0.5, 0.42, w, 0.04, 0.12, 'ploughD')]
    o += [tube([sx*0.5, 0.0, 0.0], [sx*0.7, 0.05, 0.5], 0.1, 'steelD') for sx in (1, -1)] + [tube([0, -0.15, 0.0], [0, 0.0, 0.5], 0.1, 'steelD'), bx(0, -0.1, 0.02, 0.9, 0.2, 0.08, 'steel')]
    o += [bx(sx*(w/2 - 0.04), 0.1, 0.4, 0.06, 0.7, 0.12, 'ploughD') for sx in (1, -1)]
    return o
for k in ('M', 'L'):
    part('snow_plough_' + k, 'front', plough(FW[k]), tags=['plough', 'utility'], stats={'armor': 15, 'mass': 220, 'speed': -4, 'ramDamage': 1.6, 'plough': 1}, rig={'pivot': [0, 0.0, 0.0], 'turn': [-1, 0, 0], 'range': [0, 25], 'rest': 0, 'note': 'positive lifts the blade: down while ploughing, up when driving'},
         note='a snow plough: clears snow and rubble from the road, pushes cars aside')
def ram_bumper(W):
    o = [hull([(-W/2 + 0.05, -0.34, 0.0), (W/2 - 0.05, -0.34, 0.0), (W/2 - 0.05, -0.34, 0.4), (-W/2 + 0.05, -0.34, 0.4), (-W/2 + 0.05, 0.22, 0.0), (W/2 - 0.05, 0.22, 0.0), (W/2 - 0.3, 0.22, 0.3), (-W/2 + 0.3, 0.22, 0.3)], 'steelD'),
         bx(0, 0.22, 0.0, W - 0.1, 0.05, 0.3, 'rust')]
    o += [tip([x, -0.1, 0.42], [x, -0.1, 0.78], 0.06, 0.06, 'steelL') for x in (-W*0.35, -W*0.17, 0.0, W*0.17, W*0.35)]
    o += [tip([x, 0.12, 0.3], [x, 0.14, 0.62], 0.05, 0.05, 'steelL') for x in (-W*0.26, 0.0, W*0.26)]
    return o
for k in ('M', 'L'):
    part('ram_bumper_' + k, 'front', ram_bumper(FW[k]), tags=['armor', 'weapon'], stats={'armor': 25, 'mass': 140, 'speed': -2, 'ramDamage': 2.2}, note='a welded wedge with spikes: built for driving through crowds and barricades')
def brush_guard(W):
    xp = W/2 - 0.5
    return [bx(sx*xp, -0.2, 0.05, 0.05, 0.6, 0.05, 'steelD') for sx in (1, -1)] + [bx(0, 0.3, 0.08, 2*xp, 0.05, 0.05, 'steelD'), bx(0, 0.0, 0.1, 2*xp, 0.05, 0.05, 'steelD'), bx(0, -0.2, 0.08, 2*xp, 0.05, 0.05, 'steelD'), bx(0, -0.2, 0.08, 0.04, 0.5, 0.04, 'steel')]
part('brush_guard_S', 'front', brush_guard(1.7), tags=['armor'], stats={'armor': 5, 'mass': 8}, note='a light brush guard')

# ================================================================== REAR ==================================================================
part('tow_hitch', 'rear', [bx(0, -0.14, -0.14, 0.1, 0.1, 0.3, 'steelD'), bx(0, -0.04, -0.3, 0.05, 0.05, 0.05, 'steelL'), bx(0, -0.2, -0.3, 0.06, 0.16, 0.06, 'steel'), bx(0, -0.1, -0.04, 0.4, 0.16, 0.04, 'steelD'), bx(0.12, -0.16, -0.08, 0.04, 0.06, 0.04, 'warn')], tags=['tow'], stats={'tow': 1}, note='a tow hitch: pull a trailer or a wreck')
for k, W in FW.items():
    part('rear_bumper_' + k, 'rear', [bx(0, -0.16, -0.08, W - 0.1, 0.3, 0.16, 'steelD'), bx(0, 0.14, -0.14, W - 0.3, 0.04, 0.26, 'steel'), *[bx(sx*(W/2 - 0.2), -0.34, -0.1, 0.1, 0.2, 0.12, 'steelD') for sx in (1, -1)]],
         tags=['armor'], stats={'armor': 8, 'mass': 30}, note='a steel rear bumper with a step')
part('spare_door', 'rear_door', [loft([[0, 0.0, -0.18, 0.38, 0.38], [0, 0.0, -0.4, 0.38, 0.38]], 'tyre', ax='z', n=8), loft([[0, 0.0, -0.4, 0.22, 0.22], [0, 0.0, -0.42, 0.22, 0.22]], 'rimSteel', ax='z', n=6), bx(0, -0.1, -0.06, 0.1, 0.2, 0.12, 'steelD'), bx(0, 0.0, -0.1, 0.3, 0.05, 0.05, 'steelD')][:4], tags=['tyre', 'offroad'], stats={'loot': 'tyre'}, note='a spare tyre on the back door')
part('rear_jerry_rack', 'rear', [bx(0, -0.12, -0.04, 0.9, 0.06, 0.08, 'steelD'), *[bx(sx*0.45, -0.1, -0.02, 0.05, 0.6, 0.12, 'steelD') for sx in (1, -1)], *jerry_can(-0.22, -0.1, -0.15), *jerry_can(0.22, -0.1, -0.15)], tags=['cargo', 'fuel'], stats={'mass': 25, 'fuelBonus': 20, 'loot': 'fuel'}, note='a rack holding two jerry cans')
part('salt_spreader', 'rear', [bx(0, 0.2, -0.6, 2.2, 0.15, 1.1, 'steelD'), hull([(-1.1, 0.35, -1.15), (1.1, 0.35, -1.15), (1.1, 0.35, -0.05), (-1.1, 0.35, -0.05), (-0.9, 1.1, -1.05), (0.9, 1.1, -1.05), (0.9, 1.1, -0.25), (-0.9, 1.1, -0.25)], 'warn'), cyl([0, 0.22, -1.25], [0.6, 0.05, 0.6], 'steelL'), bx(0, 0.0, -1.1, 0.3, 0.25, 0.3, 'steel')], tags=['utility', 'plough'], stats={'mass': 160, 'speed': -2}, note='a salt spreader hopper for gritting roads')

# ================================================================== SIDE (right side only, drawn mirrored) ==================================================================
for k, L in {'S': 1.2, 'M': 1.8, 'L': 2.5}.items():
    part('running_board_' + k, 'side', [bx(0.13, -0.08, 0, 0.26, 0.05, L, 'steelD'), bx(0.13, -0.03, 0, 0.2, 0.02, L - 0.1, 'black'), *[bx(0.04, -0.32, z, 0.06, 0.26, 0.06, 'steel') for z in (-L/2 + 0.2, L/2 - 0.2)]], tags=['step'], stats={'mass': 12}, mirror=True, note='a side step along the sill: climbing in and out is quicker')
    part('rock_slider_' + k, 'side', [bx(0.1, -0.22, 0, 0.18, 0.14, L, 'steelD'), bx(0.06, -0.22, 0, 0.08, 0.05, L - 0.1, 'steelL'), *[bx(0.02, -0.12, z, 0.06, 0.14, 0.08, 'steel') for z in (-L/2 + 0.15, 0, L/2 - 0.15)]], tags=['armor', 'offroad'], stats={'armor': 4, 'mass': 30}, mirror=True, note='heavy steel sliders: protect the sills on rocks')
def flare(r, c='black'):
    ra = r + 0.12
    return [bx(0.04, ra, 0, 0.1, 0.06, 2*ra + 0.12, c), bx(0.04, 0.0, ra + 0.04, 0.1, ra, 0.06, c), bx(0.04, 0.0, -ra - 0.04, 0.1, ra, 0.06, c)]
for k, r in {'S': 0.32, 'M': 0.38, 'L': 0.45, 'XL': 0.55}.items():
    part('fender_flare_' + k, 'arch', flare(r), tags=['look', 'offroad'], stats={'wideTyre': 0.12}, mirror=True, rCap=r, note='fender flares: let you fit wider tyres without the tyre sticking out past the body')
part('mud_flap', 'flap', [bx(0.0, -0.05, 0.0, 0.03, 0.4, 0.3, 'black'), bx(0.0, 0.3, 0.0, 0.04, 0.05, 0.34, 'steelD')], mirror=True, tags=['look'], note='a mud flap behind the wheel')
def snorkel(h):
    return [bx(0, -0.02, 0, 0.1, 0.12, 0.1, 'black'), seg([0, 0.1, 0], [0, h, 0], 0.045, 0.045, 0.045, 0.045, 'black'), bx(0, h, 0.04, 0.1, 0.12, 0.14, 'black'), flat([(-0.04, h + 0.02, 0.112), (0.04, h + 0.02, 0.112), (0.04, h + 0.1, 0.112), (-0.04, h + 0.1, 0.112)], 'tyreD')]
for k, h in {'S': 0.75, 'M': 1.1, 'L': 1.7}.items():
    part('snorkel_' + k, 'pillar', snorkel(h), tags=['offroad'], stats={'wade': {'S': 0.5, 'M': 0.8, 'L': 1.1}[k]}, hMax=h, note='a snorkel: the engine can drive through deeper water without stalling')
for nm, c in (('white', 'white'), ('black', 'black'), ('red', 'red')):
    part('stripe_side_' + nm, 'decal_side', [flat([(0.004, -0.04, -2.0), (0.004, -0.04, 2.0), (0.004, 0.06, 2.0), (0.004, 0.06, -2.0)], c, (1, 0, 0))], mirror=True, tags=['paint'], note='a stripe along the side at the beltline')

# ================================================================== BED (pickups, flatbeds, tow trucks) ==================================================================
BEDS = {'S': 1.1, 'M': 1.9, 'L': 2.9, 'XL': 3.9}
def bed_cap(D, W=1.6):
    return [hull([(-W/2, 0.0, -D/2), (W/2, 0.0, -D/2), (W/2, 0.0, D/2), (-W/2, 0.0, D/2), (-W/2 + 0.06, 0.78, -D/2 + 0.1), (W/2 - 0.06, 0.78, -D/2 + 0.1), (W/2 - 0.06, 0.78, D/2 - 0.2), (-W/2 + 0.06, 0.78, D/2 - 0.2)], 'BODY'),
            *[flat([(sx*(W/2 + 0.003 - 0.03*0), 0.25, -D/2 + 0.25), (sx*(W/2 + 0.003), 0.25, D/2 - 0.3), (sx*(W/2 - 0.03), 0.65, D/2 - 0.3), (sx*(W/2 - 0.03), 0.65, -D/2 + 0.25)], 'glass', (sx, 0, 0)) for sx in (1, -1)][:0],
            flat([(-W/2 + 0.2, 0.22, -D/2 - 0.0), (W/2 - 0.2, 0.22, -D/2 - 0.0), (W/2 - 0.22, 0.68, -D/2 + 0.1), (-W/2 + 0.22, 0.68, -D/2 + 0.1)], 'glass', (0, 0, -1)) if False else flat([(-W/2 + 0.2, 0.22, -D/2 - 0.004), (W/2 - 0.2, 0.22, -D/2 - 0.004), (W/2 - 0.22, 0.68, -D/2 + 0.1 - 0.004), (-W/2 + 0.22, 0.68, -D/2 + 0.1 - 0.004)], 'glass', (0, 0.1, -1)),
            *[flat([(sx*(W/2 + 0.002) - sx*0.0, 0.3, -D/2 + 0.3), (sx*(W/2 + 0.002), 0.3, D/2 - 0.35), (sx*(W/2 - 0.04), 0.64, D/2 - 0.35), (sx*(W/2 - 0.04), 0.64, -D/2 + 0.3)][::sx], 'glass', (sx, 0, 0)) for sx in (1, -1)]]
for k, D in BEDS.items():
    if k == 'XL': continue
    W = 1.6
    part('bed_cap_' + k, 'bed', bed_cap(D - 0.1, W), tags=['cover', 'storage'], stats={'storage': {'S': 2, 'M': 4, 'L': 6}[k], 'mass': 70, 'speed': -1}, note='a bed cap (canopy): a dry, lockable store in the pickup bed')
def tonneau(D, W=1.6):
    o = [hull([(-W/2, 0.02, -D/2), (W/2, 0.02, -D/2), (W/2, 0.02, D/2), (-W/2, 0.02, D/2), (-W/2 + 0.04, 0.09, -D/2 + 0.04), (W/2 - 0.04, 0.09, -D/2 + 0.04), (W/2 - 0.04, 0.09, D/2 - 0.04), (-W/2 + 0.04, 0.09, D/2 - 0.04)], 'steelD')]
    o += [bx(0, 0.09, -D/2 + 0.2 + i*(D - 0.4)/(max(2, int(D/0.5))), W - 0.1, 0.012, 0.03, 'black') for i in range(max(3, int(D/0.5)) + 1)]
    return o
for k, D in BEDS.items():
    if k == 'XL': continue
    part('bed_cover_' + k, 'bed', tonneau(D - 0.1), tags=['cover'], stats={'storage': 1, 'mass': 20}, note='a hard tonneau cover: keeps the bed dry and hides what is in it')
def bed_rack_tall(D, W=1.6):
    o = [bx(sx*(W/2 - 0.05), 0.0, sz*(D/2 - 0.05), 0.06, 0.7, 0.06, 'steelD') for sx in (1, -1) for sz in (1, -1)]
    o += [bx(sx*(W/2 - 0.05), 0.7, 0, 0.06, 0.05, D, 'steel') for sx in (1, -1)] + [bx(0, 0.72, sz*(D/2 - 0.05), W, 0.05, 0.06, 'steel') for sz in (1, -1)]
    o += [bx(0, 0.72, z, W, 0.04, 0.05, 'steelD') for z in ([0.0] if D < 2.2 else [-D/6, D/6])]
    return o
for k, D in BEDS.items():
    part('bed_rack_' + k, 'bed', bed_rack_tall(D - 0.1), tags=['rack', 'cargo'], stats={'storage': 4, 'mass': 22, 'speed': -1}, note='a tall rack over the bed: carry ladders, pipe and long loads')
part('bed_roll_bar', 'bed', [bx(sx*0.7, 0.0, 0.0, 0.07, 0.95, 0.07, 'steelD') for sx in (1, -1)] + [bx(0, 0.92, 0.0, 1.5, 0.07, 0.07, 'steelD'), bx(0, 0.5, 0.0, 1.4, 0.05, 0.05, 'steel'), *[bx(sx*0.7, -0.0, -0.08, 0.08, 0.05, 0.2, 'black') for sx in (1, -1)]], anchor='front', tags=['armor', 'look'], stats={'armor': 3, 'mass': 24}, note='a sport bar behind the cab')
part('bed_roll_bar_lights', 'bed', [bx(sx*0.7, 0.0, 0.0, 0.07, 0.95, 0.07, 'steelD') for sx in (1, -1)] + [bx(0, 0.92, 0.0, 1.5, 0.07, 0.07, 'steelD'), bx(0, 0.5, 0.0, 1.4, 0.05, 0.05, 'steel')] + [p for x in (-0.45, -0.15, 0.15, 0.45) for p in (bx(x, 0.99, 0.0, 0.18, 0.14, 0.1, 'black'), box([x, 1.06, 0.06], [0.14, 0.1, 0.02], 'lamp', glow=True))], anchor='front', tags=['armor', 'light'], stats={'armor': 3, 'light': 30, 'mass': 30}, note='a sport bar with four work lights facing forward')
part('bed_toolbox', 'bed', [bx(0, 0.0, -0.2, 1.5, 0.34, 0.4, 'steelL'), bx(0, 0.34, -0.2, 1.54, 0.04, 0.44, 'steel'), bx(0, 0.18, 0.005, 0.2, 0.06, 0.02, 'steelD'), bx(sx := 0.6, 0.0, 0.0, 0.02, 0.02, 0.02, 'steelD')][:-1], anchor='front', tags=['storage'], stats={'storage': 3, 'mass': 25}, note='a cross-bed toolbox: lockable storage')
part('bed_tank', 'bed', [loft([[0, 0.3, -0.6, 0.3, 0.3], [0, 0.3, 0.6, 0.3, 0.3]], 'steelL', ax='z', n=8), loft([[0, 0.3, -0.62, 0.22, 0.22], [0, 0.3, -0.58, 0.22, 0.22]], 'steelD', ax='z', n=8), bx(0, 0.0, -0.4, 1.0, 0.04, 0.1, 'steelD'), bx(0, 0.0, 0.4, 1.0, 0.04, 0.1, 'steelD'), bx(0, 0.58, 0.0, 0.1, 0.06, 0.1, 'steel')], tags=['storage', 'fuel'], stats={'fuelBonus': 80, 'mass': 90}, note='a long-range fuel tank in the bed')
def barrel(x, z, c): return [loft([[x, 0.0, z, 0.26, 0.26], [x, 0.4, z, 0.28, 0.28], [x, 0.8, z, 0.26, 0.26]], c, n=6), loft([[x, 0.8, z, 0.24, 0.24], [x, 0.83, z, 0.2, 0.2]], 'steelD', n=6)]
def load_barrels(D, W=1.5):
    nx = 2; nz = max(1, int(D // 0.62)); o = []
    for i in range(nx):
        for j in range(nz): o += barrel((i - 0.5)*0.6, -D/2 + 0.35 + j*0.62, ['barrelB', 'barrelR', 'olive'][(i + j) % 3])
    return o
def load_crates(D, W=1.5):
    o = []; nz = max(1, int(D // 0.62))
    for j in range(nz):
        for i, x in enumerate((-0.38, 0.38)):
            z = -D/2 + 0.35 + j*0.62; o.append(bx(x, 0.0, z, 0.6, 0.5, 0.56, 'cardboard' if (i + j) % 2 else 'wood'))
            if (i + j) % 3 == 0: o.append(bx(x, 0.5, z, 0.5, 0.4, 0.46, 'cardD'))
            o.append(bx(x, 0.24, z, 0.62, 0.03, 0.58, 'woodD'))
    return o
def load_hay(D, W=1.5):
    o = []; nz = max(1, int(D // 0.9))
    for j in range(nz):
        z = -D/2 + 0.5 + j*0.9
        for i, x in enumerate((-0.38, 0.38)):
            o += [bx(x, 0.0, z, 0.7, 0.4, 0.8, 'hay'), bx(x, 0.0, z - 0.15, 0.72, 0.41, 0.03, 'strap'), bx(x, 0.0, z + 0.15, 0.72, 0.41, 0.03, 'strap')]
            if j % 2 == i % 2: o += [bx(x, 0.4, z, 0.7, 0.4, 0.8, 'hayD')]
    return o
def load_firewood(D, W=1.5):
    o = [bx(0, 0.0, 0, W - 0.2, 0.55, D - 0.2, 'woodD')]
    o += [bx(0, 0.55, 0, W - 0.25, 0.1, D - 0.25, 'wood')] + [flat([(x - 0.06, 0.66, -D/2 + 0.15), (x + 0.06, 0.66, -D/2 + 0.15), (x + 0.06, 0.66, D/2 - 0.15), (x - 0.06, 0.66, D/2 - 0.15)], 'woodL', (0, 1, 0)) for x in (-0.4, -0.1, 0.25, 0.5)]
    return o
def load_scrap(D, W=1.5):
    o = [hull([(-W/2 + 0.1, 0.0, -D/2 + 0.1), (W/2 - 0.1, 0.0, -D/2 + 0.1), (W/2 - 0.1, 0.0, D/2 - 0.1), (-W/2 + 0.1, 0.0, D/2 - 0.1), (-W/2 + 0.3, 0.55, -D/2 + 0.3), (W/2 - 0.35, 0.7, -D/2 + 0.2), (W/2 - 0.3, 0.45, D/2 - 0.3), (-W/2 + 0.25, 0.6, D/2 - 0.25)], 'scrap'),
         bx(-0.3, 0.45, -D/6, 0.5, 0.35, 0.4, 'rust'), bx(0.25, 0.5, D/6, 0.4, 0.4, 0.5, 'steel'), bx(0.0, 0.7, 0.0, 0.7, 0.04, 0.5, 'rustD')]
    return o
def load_tarp(D, W=1.5): return [hull([(-W/2 + 0.1, 0.0, -D/2 + 0.05), (W/2 - 0.1, 0.0, -D/2 + 0.05), (W/2 - 0.1, 0.0, D/2 - 0.05), (-W/2 + 0.1, 0.0, D/2 - 0.05), (-W/2 + 0.3, 0.55, -D/2 + 0.25), (W/2 - 0.35, 0.5, -D/2 + 0.2), (W/2 - 0.3, 0.6, D/2 - 0.3), (-W/2 + 0.35, 0.5, D/2 - 0.25)], 'canvas')] + [bx(0, 0.0, z, W - 0.15, 0.4, 0.03, 'strap') for z in (-D/4, D/4)]
for nm, fn, note, st in (('barrels', load_barrels, 'barrels of fuel and water', {'loot': 'barrels'}), ('crates', load_crates, 'crates of goods', {'loot': 'crates'}), ('hay', load_hay, 'hay bales', {'loot': 'hay'}),
                         ('firewood', load_firewood, 'a stack of firewood', {'loot': 'wood'}), ('scrap', load_scrap, 'a pile of scrap metal', {'loot': 'scrap'}), ('tarp', load_tarp, 'something under a tarp', {'loot': 'mixed'})):
    for k, D in BEDS.items():
        part('load_%s_%s' % (nm, k), 'bed', fn(D - 0.2), tags=['load', 'cargo'], stats=dict(st, mass=120), note='a load of ' + note + ' (a loot spot)')
def camper(D, W=1.6):
    return [hull([(-W/2, 0.0, -D/2), (W/2, 0.0, -D/2), (W/2, 0.0, D/2), (-W/2, 0.0, D/2), (-W/2 + 0.04, 1.3, -D/2 + 0.04), (W/2 - 0.04, 1.3, -D/2 + 0.04), (W/2 - 0.04, 1.3, D/2 - 0.5), (-W/2 + 0.04, 1.3, D/2 - 0.5)], 'BODY'),
            bx(0, 1.3, -D/2 + 0.04, W - 0.08, 0.05, D - 0.5, 'BODY'),
            *[flat([(sx*(W/2 + 0.003), 0.55, -D/2 + 0.5), (sx*(W/2 + 0.003), 0.55, 0.1), (sx*(W/2 + 0.003), 1.05, 0.1), (sx*(W/2 + 0.003), 1.05, -D/2 + 0.5)][::sx], 'glass', (sx, 0, 0)) for sx in (1, -1)],
            flat([(-0.4, 0.3, -D/2 - 0.004), (0.4, 0.3, -D/2 - 0.004), (0.4, 1.1, -D/2 - 0.004), (-0.4, 1.1, -D/2 - 0.004)], 'steelD', (0, 0, -1)), bx(0.3, 0.6, -D/2 - 0.02, 0.06, 0.06, 0.04, 'steelL')]
part('camper_shell', 'bed', camper(2.6), tags=['camp', 'storage'], stats={'sleep': 2, 'storage': 6, 'mass': 220, 'speed': -3}, note='a camper shell on the bed: sleeps two, stores gear')

# ================================================================== TRUCKS AND WORK VEHICLES ==================================================================
part('exhaust_stacks', 'cab_back', [bx(sx*0.95, 0.0, -0.1, 0.18, 0.4, 0.18, 'steelD') for sx in (1, -1)] + [seg([sx*0.95, 0.4, -0.1], [sx*0.95, 2.6, -0.1], 0.07, 0.07, 0.07, 0.07, 'chrome') for sx in (1, -1)] + [bx(sx*0.95, 2.6, -0.1, 0.18, 0.06, 0.18, 'steelD') for sx in (1, -1)], tags=['look'], stats={'noise': 1}, note='two tall chrome exhaust stacks behind the cab')
part('headache_rack', 'cab_back', [bx(sx*1.0, 0.0, -0.15, 0.1, 1.7, 0.1, 'steelD') for sx in (1, -1)] + [bx(0, 1.65, -0.15, 2.1, 0.1, 0.1, 'steelD'), bx(0, 0.9, -0.15, 2.0, 0.06, 0.06, 'steel'), bx(0, 0.0, -0.15, 2.1, 0.1, 0.14, 'steelD')] + [bx(x, 0.0, -0.15, 0.06, 1.65, 0.06, 'steel') for x in (-0.6, -0.2, 0.2, 0.6)], tags=['armor'], stats={'armor': 5, 'mass': 60}, note='a cab-back guard frame: protects the cab from loads')
part('beacon_bar_L', 'roof', [bx(0, 0.0, 0.0, 1.8, 0.09, 0.28, 'black')] + [box([-0.8 + 0.2*i, 0.1, 0.0], [0.17, 0.09, 0.2], 'lampA', glow=True) for i in range(9)] + [bx(sx*0.75, -0.05, 0.0, 0.1, 0.06, 0.2, 'steelD') for sx in (1, -1)], tags=['light'], stats={'flash': True}, note='a long amber beacon bar for road crews')
part('floodlight_mast', 'roof', [bx(0, 0.0, 0.0, 0.3, 0.08, 0.3, 'steelD'), seg([0, 0.08, 0], [0, 1.6, 0], 0.05, 0.05, 0.04, 0.04, 'steelL'), bx(0, 1.6, 0.0, 0.8, 0.06, 0.3, 'steelD')] + [p for x in (-0.3, 0.0, 0.3) for p in (bx(x, 1.66, 0.1, 0.22, 0.2, 0.14, 'black'), box([x, 1.76, 0.18], [0.18, 0.16, 0.02], 'lamp', glow=True))], anchor='rear', tags=['light'], stats={'light': 60, 'mass': 40}, note='a floodlight mast: lights up a work site at night (or draws a crowd)')
for nm, L in (('S', 1.2), ('M', 2.0)):
    part('toolbox_side_' + nm, 'chassis_side', [bx(0.3, -0.2, 0, 0.5, 0.45, L, 'steelL'), bx(0.3, 0.25, 0, 0.54, 0.04, L + 0.04, 'steel'), bx(0.56, -0.05, 0, 0.02, 0.06, 0.2, 'steelD')], mirror=True, tags=['storage'], stats={'storage': 3 if nm == 'S' else 5, 'mass': 30}, note='a chassis toolbox under the body')
part('fuel_tank_side', 'chassis_side', [loft([[0.35, -0.0, -0.8, 0.28, 0.28], [0.35, -0.0, 0.8, 0.28, 0.28]], 'steelL', ax='z', n=8), bx(0.1, -0.0, -0.5, 0.3, 0.08, 0.1, 'steelD'), bx(0.1, -0.0, 0.5, 0.3, 0.08, 0.1, 'steelD')], mirror=True, tags=['fuel'], stats={'fuelBonus': 120, 'mass': 100}, note='a big side fuel tank')

# cab-sized roof pieces for pickups and trucks (roofs only 0.5-0.6 m deep)
part('roof_bars_C', 'roof', rail_set(1.5, 0.5, [-0.15, 0.15]), tags=['rack', 'cargo'], stats={'storage': 1, 'mass': 6, 'speed': 0}, note='a short pair of cross bars for a truck cab roof')
part('roof_lights_C', 'roof', [bx(0, 0.0, 0, 1.5, 0.09, 0.2, 'black')] + [box([-0.6 + 0.24*i, 0.1, 0.08], [0.18, 0.1, 0.03], 'lamp', glow=True) for i in range(6)], anchor='front', tags=['light'], stats={'light': 30, 'mass': 6}, note='a row of cab-roof driving lamps')
