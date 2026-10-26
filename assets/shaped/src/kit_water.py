"""Boat parts (outboards, canopies, seats, gear) and bike parts (racks, baskets, panniers ...). Same conventions as kit_parts.py.
Boat slots: transom (origin at the middle of the stern, hanging behind it, y=0 at the gunwale line), deck (origin on the deck, centre), bow (origin at the bow tip),
canopy (overhead, origin on the roof line), rail (single right side, mirrored). Bike slots: front_rack, rear_rack, bars, frame, rear, seatpost, fork (mirrored)."""
from kitreg import *

# ---------------------------------------------------------------- outboards
def outboard(s, twin=False):
    def one(x):
        o = [bx(x, 0.05, -0.12, 0.18*s, 0.1, 0.18, 'steelD'), bx(x, -0.5*s, -0.2*s, 0.2*s, 0.9*s, 0.28*s, 'engine'), bx(x, 0.35*s - 0.5*s + 0.0, -0.2*s, 0.22*s, 0.12*s, 0.3*s, 'engineL'),
             bx(x, -0.9*s, -0.22*s, 0.12*s, 0.5*s, 0.14*s, 'engine'), bx(x, -0.95*s, -0.2*s, 0.08*s, 0.14*s, 0.5*s*0.5, 'engineL')]
        o += [bx(x, 0.0, -0.06, 0.2*s, 0.03, 0.04, 'steel')]
        return o
    xs = [-0.32*s, 0.32*s] if twin else [0.0]
    p = [q for x in xs for q in one(x)]
    if twin: p.append(bx(0, -0.02, -0.14, 0.75*s, 0.04, 0.08, 'steelD'))
    return p
def prop(s, x=0.0): return [bx(x, -1.0*s - 0.12*s, -0.2*s - 0.0, 0.04, 0.24*s, 0.02, 'steelL'), bx(x, -1.0*s, -0.2*s, 0.22*s, 0.02, 0.04, 'steelL'), cyl([x, -1.0*s, -0.2*s - 0.05], [0.05, 0.05, 0.08], 'engineL', ax='z')]
for nm, s, tw, hp in (('S', 0.6, False, 6), ('M', 0.8, False, 25), ('L', 1.0, False, 90), ('twin', 1.0, True, 180)):
    part('outboard_' + nm, 'transom', outboard(s, tw), tags=['motor'], stats={'power': hp, 'mass': 14 + hp*0.6, 'speed': hp**0.5},
         rig={'pivot': [0, 0.05, -0.12], 'turn': [0, 1, 0], 'range': [-35, 35], 'rest': 0, 'note': 'swing about Y to steer; positive turns the stern right'},
         note={'S': 'a 6 hp kicker: slow but light and quiet', 'M': 'a 25 hp outboard: a fair pace for small boats', 'L': 'a 90 hp outboard: fast on bigger hulls', 'twin': 'twin 90s: the fastest pairing (and thirsty)'}[nm], hpMax=hp)
    part('outboard_%s_prop' % nm, 'transom_prop', prop(s) if not tw else prop(s, -0.32*s) + prop(s, 0.32*s), tags=['motor'], rig={'pivot': [0, -1.0*s, -0.2*s], 'turn': [0, 0, 1], 'spin': True, 'note': 'spin about Z while under power'}, note='the propeller for outboard_' + nm)
part('trolling_motor', 'bow', [bx(0, -0.7, 0.2, 0.06, 0.9, 0.06, 'steelL'), bx(0, -0.78, 0.2, 0.2, 0.16, 0.1, 'engine'), bx(0, 0.15, 0.2, 0.2, 0.06, 0.2, 'steelD')], tags=['motor', 'quiet'], stats={'power': 1, 'noise': -1}, note='a quiet electric motor on the bow: creep along without attracting anything')
# ---------------------------------------------------------------- canopies and shelter
def bimini(W, D):
    o = [bx(sx*(W/2 - 0.05), 0, sz*(D/2 - 0.05), 0.04, 1.4, 0.04, 'steelL') for sx in (1, -1) for sz in (1, -1)]
    o += [hull([(-W/2, 1.4, -D/2), (W/2, 1.4, -D/2), (W/2, 1.4, D/2), (-W/2, 1.4, D/2), (-W/2 + 0.04, 1.5, -D/2 + 0.04), (W/2 - 0.04, 1.5, -D/2 + 0.04), (W/2 - 0.04, 1.5, D/2 - 0.04), (-W/2 + 0.04, 1.5, D/2 - 0.04)], 'canvas')]
    return o
for k, (W, D) in {'S': (1.1, 1.4), 'M': (1.6, 2.2), 'L': (2.4, 3.2)}.items():
    part('bimini_' + k, 'canopy', bimini(W, D), tags=['shade'], stats={'mass': 10, 'heat': -1}, note='a canvas sun top on tubes: shade for the crew')
part('t_top', 'canopy', [bx(sx*0.85, 0, sz*0.8, 0.06, 1.6, 0.06, 'chrome') for sx in (1, -1) for sz in (1, -1)] + [bx(0, 1.6, 0, 1.8, 0.05, 1.8, 'boatW'), bx(0, 1.65, 0, 1.7, 0.03, 1.7, 'steelL')] + [bx(x, 1.52, -0.8, 0.14, 0.08, 0.1, 'black') for x in (-0.6, -0.2, 0.2, 0.6)], tags=['shade', 'rod'], stats={'mass': 30, 'rods': 4}, note='a fibreglass T-top with rod holders')
part('windscreen', 'bow', [bx(0, 0, 0, 1.3, 0.05, 0.08, 'steelL'), flat([(-0.6, 0.05, 0.0), (0.6, 0.05, 0.0), (0.55, 0.55, -0.15), (-0.55, 0.55, -0.15)], 'glassL', (0, 0.4, 1))], anchor='center', tags=['windshield'], note='a low folding windscreen: keeps the spray off')
part('cuddy_hatch', 'deck', [hull([(-0.6, 0.0, -0.6), (0.6, 0.0, -0.6), (0.6, 0.0, 0.6), (-0.6, 0.0, 0.6), (-0.5, 0.28, -0.5), (0.5, 0.28, -0.5), (0.5, 0.2, 0.5), (-0.5, 0.2, 0.5)], 'boatW'), bx(0, 0.28, 0, 0.5, 0.03, 0.3, 'glass')], tags=['storage'], stats={'storage': 4, 'mass': 20}, note='a hatch with a dry locker')
# ---------------------------------------------------------------- deck gear
def seat(w=0.5):
    return [bx(0, 0.0, 0, 0.1, 0.3, 0.1, 'steelD'), bx(0, 0.3, 0, w, 0.1, w, 'seat'), bx(0, 0.4, -w/2 + 0.04, w, 0.42, 0.08, 'seat')]
part('seat_helm', 'deck', seat(0.55), tags=['seat'], stats={'seats': 1}, note='a swivel seat')
part('seat_bench', 'deck', [bx(0, 0.0, 0, 1.3, 0.34, 0.45, 'steelL'), bx(0, 0.34, 0, 1.34, 0.1, 0.5, 'seat'), bx(0, 0.44, -0.22, 1.34, 0.38, 0.08, 'seat')], tags=['seat', 'storage'], stats={'seats': 3, 'storage': 2}, note='a bench seat with a locker underneath')
part('cooler', 'deck', [bx(0, 0.0, 0, 0.7, 0.4, 0.4, 'cooler'), bx(0, 0.4, 0, 0.72, 0.06, 0.42, 'coolerW'), bx(0.0, 0.42, 0.21, 0.2, 0.03, 0.02, 'steelL')], tags=['storage', 'food'], stats={'storage': 2, 'loot': 'food'}, note='a cooler: food and drink kept cold on the water')
part('fuel_tank_boat', 'deck', [loft([[0, 0.17, -0.3, 0.17, 0.17], [0, 0.17, 0.3, 0.17, 0.17]], 'fuelRed', ax='z', n=8), bx(0, 0.34, 0, 0.06, 0.05, 0.06, 'steelD')], tags=['fuel'], stats={'fuelBonus': 30}, note='a portable fuel tank')
part('storage_crate', 'deck', [bx(0, 0.0, 0, 0.6, 0.35, 0.45, 'plank'), bx(0, 0.35, 0, 0.62, 0.03, 0.47, 'woodD')], tags=['storage'], stats={'storage': 3}, note='a wooden crate lashed down')
part('tackle_box', 'deck', [bx(0, 0.0, 0, 0.45, 0.2, 0.25, 'olive'), bx(0, 0.2, 0, 0.47, 0.03, 0.27, 'oliveD'), bx(0, 0.23, 0, 0.18, 0.04, 0.03, 'steelL')], tags=['fish'], stats={'fish': 1, 'loot': 'tackle'}, note='a tackle box: fishing gear and lures')
part('anchor_bow', 'bow', [bx(0, 0.0, 0.0, 0.4, 0.04, 0.3, 'steelD'), seg([0, 0.04, 0.0], [0, 0.3, 0.12], 0.015, 0.015, 0.015, 0.015, 'steelL'), seg([-0.15, 0.0, 0.18], [0.15, 0.0, 0.18], 0.012, 0.012, 0.012, 0.012, 'steelL'), tip([-0.15, 0.0, 0.18], [-0.2, 0.1, 0.3], 0.03, 0.01, 'steelL'), tip([0.15, 0.0, 0.18], [0.2, 0.1, 0.3], 0.03, 0.01, 'steelL')], anchor='front', tags=['anchor'], stats={'anchor': 1}, note='an anchor on the bow: hold position in a current')
part('nav_lights', 'bow', [bx(-0.28, 0.0, 0.0, 0.1, 0.1, 0.1, 'steelD'), box([-0.28, 0.06, 0.04], [0.07, 0.07, 0.03], 'lampR', glow=True), bx(0.28, 0.0, 0.0, 0.1, 0.1, 0.1, 'steelD'), box([0.28, 0.06, 0.04], [0.07, 0.07, 0.03], 'lampG', glow=True)], tags=['light'], stats={'light': 8}, note='red and green running lights')
part('spotlight_boat', 'bow', [bx(0, 0.0, 0.0, 0.18, 0.06, 0.18, 'black'), bx(0, 0.06, 0.04, 0.2, 0.2, 0.22, 'black'), box([0, 0.16, 0.16], [0.17, 0.17, 0.02], 'lamp', glow=True)], tags=['light'], stats={'light': 40}, note='a swivel spotlight: search the shore at night')
part('swim_ladder', 'transom', [bx(sx*0.14, -0.7, -0.08, 0.03, 0.8, 0.03, 'chrome') for sx in (1, -1)] + [bx(0, -0.1 - 0.18*i, -0.08, 0.28, 0.03, 0.04, 'chrome') for i in range(4)] + [bx(sx*0.14, 0.05, -0.04, 0.04, 0.04, 0.1, 'steelL') for sx in (1, -1)], tags=['climb'], note='a fold-down boarding ladder: climb back aboard')
part('flag_pole', 'transom', [bx(0, 0.0, -0.1, 0.06, 0.06, 0.06, 'steelD'), seg([0, 0.06, -0.1], [0, 1.1, -0.1], 0.012, 0.012, 0.008, 0.008, 'steelL'), flat([(0, 1.1, -0.1), (0, 1.1, -0.55), (0, 0.82, -0.55), (0, 0.82, -0.1)], 'red', (1, 0, 0))], tags=['look'], note='a flag on a staff')
part('fender_buoys', 'rail', [p for z in (-0.6, 0.0, 0.6) for p in (loft([[0.05, -0.2, z, 0.07, 0.07], [0.05, 0.06, z, 0.07, 0.07]], 'boatW', n=8), bx(0.05, 0.06, z, 0.02, 0.1, 0.02, 'strap'))], mirror=True, tags=['protect'], note='three fenders hung over the side: bump docks without a scratch')
part('rod_holders', 'rail', [p for z in (-0.5, 0.0, 0.5) for p in (cyl([0.03, 0.0, z], [0.08, 0.28, 0.08], 'steelD'), bx(0.03, 0.2, z, 0.1, 0.03, 0.1, 'steelL'))], mirror=True, tags=['fish'], stats={'rods': 3}, note='rod holders along the gunwale')
part('life_ring', 'rail', [loft([[0.05, 0.0, 0, 0.3, 0.3], [0.05, 0.1, 0, 0.3, 0.3]], 'red', ax='x', n=10), bx(0.05, 0.0, 0, 0.1, 0.1, 0.4, 'white')][:1], mirror=True, tags=['safety'], note='a life ring')
part('crab_pots', 'deck', [p for i, (x, z) in enumerate(((-0.3, -0.3), (0.3, -0.3), (-0.3, 0.3), (0.3, 0.3), (0.0, 0.0))) for p in (bx(x, 0.0 if i < 4 else 0.45, z, 0.52, 0.42, 0.52, 'steelL'), bx(x, 0.0 if i < 4 else 0.45, z, 0.55, 0.03, 0.55, 'steelD'))], tags=['fish', 'load'], stats={'fish': 2, 'loot': 'crab'}, note='stacked pots for crabs and crayfish')
part('net_drum', 'deck', [loft([[0, 0.0, -0.3, 0.4, 0.4], [0, 0.0, 0.3, 0.4, 0.4]], 'steelD', ax='z', n=8), loft([[0, 0.0, -0.2, 0.34, 0.34], [0, 0.0, 0.2, 0.38, 0.38]], 'canvasD', ax='z', n=8)], tags=['fish'], stats={'fish': 3}, note='a net drum: catch more fish with a net')
part('sail_flag', 'canopy', [bx(0, 0, 0, 0.05, 0.05, 0.05, 'steelD'), seg([0, 0.05, 0], [0, 0.7, 0], 0.012, 0.012, 0.008, 0.008, 'steelL'), flat([(0, 0.7, 0), (0, 0.7, -0.3), (0, 0.55, -0.15)], 'warn', (1, 0, 0))], tags=['look', 'wind'], note='a masthead wind flag')
# ================================================================== BIKES (and motorbikes, quads)
def basket(w, d, h, c='steelL'):
    o = [bx(0, 0.0, 0, w, 0.03, d, 'steelD')] + [bx(sx*w/2, 0.0, sz*d/2, 0.025, h, 0.025, c) for sx in (1, -1) for sz in (1, -1)]
    o += [bx(0, h*0.5, sz*d/2, w, 0.02, 0.02, c) for sz in (1, -1)] + [bx(sx*w/2, h*0.5, 0, 0.02, 0.02, d, c) for sx in (1, -1)]
    o += [bx(0, h, sz*d/2, w, 0.025, 0.025, c) for sz in (1, -1)] + [bx(sx*w/2, h, 0, 0.025, 0.025, d, c) for sx in (1, -1)]
    return o
part('bike_basket_front', 'bars', basket(0.34, 0.26, 0.24), anchor='front', tags=['storage'], stats={'storage': 2}, note='a wire basket on the handlebars')
part('bike_basket_rear', 'rear_rack', basket(0.34, 0.3, 0.26), tags=['storage'], stats={'storage': 2}, note='a basket over the back wheel')
part('bike_rack_rear', 'rear_rack', [bx(sx*0.09, 0.0, 0, 0.02, 0.02, 0.4, 'steelD') for sx in (1, -1)] + [bx(0, 0.0, z, 0.2, 0.02, 0.03, 'steelD') for z in (-0.18, 0.0, 0.18)] + [bx(sx*0.1, -0.2, -0.18, 0.015, 0.2, 0.015, 'steelD') for sx in (1, -1)], tags=['rack'], stats={'storage': 1}, note='a rear pannier rack')
part('bike_rack_front', 'front_rack', [bx(sx*0.09, 0.0, 0, 0.02, 0.02, 0.3, 'steelD') for sx in (1, -1)] + [bx(0, 0.0, z, 0.2, 0.02, 0.03, 'steelD') for z in (-0.13, 0.13)] + [bx(sx*0.1, -0.2, 0.0, 0.015, 0.2, 0.015, 'steelD') for sx in (1, -1)], tags=['rack'], stats={'storage': 1}, note='a front low-rider rack')
part('panniers', 'rear_rack', [bx(sx*0.2, -0.25, 0, 0.12, 0.3, 0.32, 'canvas') for sx in (1, -1)] + [bx(sx*0.2, -0.0, 0, 0.13, 0.04, 0.34, 'canvasD') for sx in (1, -1)] + [bx(0, 0.0, 0, 0.2, 0.02, 0.3, 'steelD')], tags=['storage'], stats={'storage': 4}, note='two canvas panniers: more room for a long ride')
part('bike_trunk', 'rear_rack', [bx(0, 0.0, 0, 0.28, 0.24, 0.34, 'steelD'), bx(0, 0.24, 0, 0.3, 0.03, 0.36, 'steel'), bx(0, 0.1, -0.175, 0.2, 0.04, 0.01, 'lampR', glow=True)], tags=['storage', 'closed'], stats={'storage': 3}, note='a lockable top box')
part('child_seat', 'rear_rack', [bx(0, 0.0, 0, 0.3, 0.06, 0.3, 'blue'), bx(0, 0.06, -0.14, 0.3, 0.4, 0.05, 'blue'), bx(sx := 0.14, 0.06, 0, 0.03, 0.22, 0.28, 'blue'), bx(-0.14, 0.06, 0, 0.03, 0.22, 0.28, 'blue')][:4], tags=['seat'], stats={'seats': 1}, note='a child seat')
part('bike_fender', 'fender', [bx(0, 0.0, 0, 0.08, 0.015, 0.5, 'steelD')], tags=['look'], note='a mudguard')
part('bike_light_front', 'bars_light', [bx(0, 0.0, 0, 0.07, 0.07, 0.08, 'black'), box([0, 0.035, 0.045], [0.05, 0.05, 0.02], 'lamp', glow=True)], anchor='front', tags=['light'], stats={'light': 12}, note='a front lamp')
part('bike_light_rear', 'seatpost', [bx(0, 0.0, 0, 0.05, 0.05, 0.03, 'black'), box([0, 0.025, -0.02], [0.04, 0.04, 0.01], 'lampR', glow=True)], tags=['light'], note='a rear lamp')
part('kickstand', 'stand', [seg([0, 0.0, 0.0], [0, -0.25, -0.1], 0.01, 0.01, 0.012, 0.012, 'steelD')], tags=['stand'], note='a kickstand: the bike stays upright when parked')
part('bike_bottle', 'frame', [loft([[0, 0.0, 0, 0.03, 0.03], [0, 0.18, 0, 0.03, 0.03]], 'blue', n=6), bx(0, 0.18, 0, 0.03, 0.03, 0.03, 'white')], tags=['water'], stats={'water': 1}, note='a water bottle on the frame')
part('bike_bell', 'bars_bell', [loft([[0, 0.0, 0, 0.03, 0.03], [0, 0.03, 0, 0.025, 0.025]], 'chrome', n=6)], tags=['look', 'noise'], note='a bell: it will draw them to you')
part('moto_screen', 'bars', [flat([(-0.2, 0.0, 0.05), (0.2, 0.0, 0.05), (0.17, 0.4, -0.05), (-0.17, 0.4, -0.05)], 'glassL', (0, 0.3, 1)), bx(0, -0.01, 0.0, 0.34, 0.02, 0.06, 'black')], anchor='front', tags=['windshield'], note='a windscreen: less wind at speed')
part('saddlebags', 'rear_rack', [bx(sx*0.28, -0.2, 0.0, 0.16, 0.28, 0.4, 'leather') for sx in (1, -1)] + [bx(sx*0.28, 0.06, 0.0, 0.17, 0.03, 0.42, 'leather') for sx in (1, -1)] + [bx(0, 0.0, 0, 0.36, 0.02, 0.3, 'steelD')], tags=['storage'], stats={'storage': 5}, note='leather saddlebags for a motorbike')
part('crash_bars', 'frame', [seg([sx*0.22, 0.0, 0.2], [sx*0.22, -0.4, 0.0], 0.015, 0.015, 0.015, 0.015, 'chrome') for sx in (1, -1)] + [seg([sx*0.22, -0.4, 0.0], [sx*0.22, -0.4, -0.3], 0.015, 0.015, 0.015, 0.015, 'chrome') for sx in (1, -1)], tags=['armor'], stats={'armor': 2}, note='engine guards: a fall hurts the bike less')
part('quad_rack_front', 'front_rack', [bx(0, 0.0, 0, 0.8, 0.03, 0.5, 'steelD')] + [bx(sx*0.4, 0.0, sz*0.25, 0.03, 0.12, 0.03, 'steelD') for sx in (1, -1) for sz in (1, -1)] + [bx(0, 0.03, z, 0.8, 0.02, 0.03, 'steel') for z in (-0.2, 0, 0.2)], tags=['rack', 'storage'], stats={'storage': 3}, note='a front cargo rack for a quad')
part('quad_rack_rear', 'rear_rack', [bx(0, 0.0, 0, 0.9, 0.03, 0.7, 'steelD')] + [bx(sx*0.45, 0.0, sz*0.35, 0.03, 0.18, 0.03, 'steelD') for sx in (1, -1) for sz in (1, -1)] + [bx(0, 0.03, z, 0.9, 0.02, 0.03, 'steel') for z in (-0.3, -0.1, 0.1, 0.3)], tags=['rack', 'storage'], stats={'storage': 5}, note='a rear cargo rack for a quad')
part('quad_winch', 'bars', [bx(0, 0.0, 0, 0.3, 0.18, 0.2, 'steelD'), cyl([0, 0.1, 0.0], [0.24, 0.12, 0.12], 'steelL', ax='x')], anchor='front', tags=['tool', 'offroad'], stats={'winch': 1}, note='a small winch')
