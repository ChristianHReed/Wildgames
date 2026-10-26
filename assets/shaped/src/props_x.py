# Section 10 of the art requests (19 October 2026), exec'd by props.py after props_more.py:
#   10.2 harvest materials (loose on the ground), 10.3 bases (claim marker, custom bed, wall reinforcement), 10.5 vehicle damage.
import copy, random
RX = random.Random(105)
PALETTE.update({'lumberX': '#c8a46a', 'lumberXD': '#a8844e', 'galvX': '#a9b1b5', 'galvXD': '#7f878c', 'rebarX': '#7a4a32', 'concreteX': '#aaa69e', 'concreteXD': '#8a867e',
                'brickX': '#9a5040', 'brickXD': '#7a3c30', 'mortarX': '#c0b8aa', 'glassX': '#9cc4d0', 'wireX': '#b8743a', 'wireXD': '#8a5428', 'gypsumX': '#e8e4da',
                'claim': '#c8402a', 'claimD': '#9a2e1e', 'claimPaint': '#f0e6d0', 'rag1': '#8a7a6a', 'rag2': '#6a7a8a', 'rag3': '#9a6a5a', 'rag4': '#7a8a5a',
                'crackGX': '#e8f2f4', 'scorch': '#2e2a28', 'smokeX': '#8a8680', 'smokeXL': '#b4b0aa', 'steamX': '#d8d6d2'})
G1 = dict(glow=True)

# ================= 10.2 harvest materials (on the ground: origin at the centre of the base, front +Z) =================
def ibeam(x0, x1, d, w, c, y=0.0):
    t = 0.012
    return [box([(x0 + x1)/2, y + t/2, 0], [x1 - x0, t, w], c), box([(x0 + x1)/2, y + d - t/2, 0], [x1 - x0, t, w], c), box([(x0 + x1)/2, y + d/2, 0], [x1 - x0, d - 2*t, 0.01], c)]
def lump(cx, cz, s, c, y=0.0):
    a = RX.uniform(0, 3.14)
    lo = [(cx + s*RX.uniform(0.8, 1.1)*math.cos(a + i*1.5708), y, cz + s*RX.uniform(0.8, 1.1)*math.sin(a + i*1.5708)) for i in range(4)]
    hi = [(cx + 0.55*s*math.cos(a + 0.4 + i*1.5708), y + s*RX.uniform(0.7, 1.0), cz + 0.55*s*math.sin(a + 0.4 + i*1.5708)) for i in range(4)]
    return hull(lo + hi, c)
model('items', 'scrap_wood', [hull([(-0.3, 0, -0.04), (0.25, 0, -0.06), (0.25, 0, 0.0), (-0.3, 0, 0.02), (-0.3, 0.022, -0.04), (0.25, 0.022, -0.06), (0.25, 0.022, 0.0), (-0.3, 0.022, 0.02)], 'lumberX'),
                              hull([(-0.1, 0.022, 0.0), (0.2, 0.022, 0.08), (0.17, 0.022, 0.13), (-0.12, 0.022, 0.05), (-0.1, 0.045, 0.0), (0.2, 0.045, 0.08), (0.17, 0.045, 0.13), (-0.12, 0.045, 0.05)], 'lumberXD'),
                              tip([0.25, 0.011, -0.03], [0.32, 0.011, -0.025], 0.01, 0.025, 'woodL', ax='x'), b(-0.15, 0, 0.12, 0.12, 0.03, 0.06, 'woodL'),
                              b(0.05, 0.045, 0.06, 0.004, 0.025, 0.004, 'nailHead')])
model('items', 'lumber', [box([-0.024, 0.0225, 0], [0.045, 0.045, 1.2], 'lumberX'), box([0.024, 0.0225, 0], [0.045, 0.045, 1.2], 'lumberXD'), box([0.0, 0.0675, 0.01], [0.045, 0.045, 1.2], 'lumberX'),
                          flat([(-0.05, 0.0905, 0.3), (0.05, 0.0905, 0.3), (0.05, 0.0905, 0.34), (-0.05, 0.0905, 0.34)], 'cloth', (0, 1, 0))])
model('items', 'nails_handful', [b(0, 0, 0, 0.09, 0.012, 0.07, 'paper')] + [box([RX.uniform(-0.04, 0.04), 0.016, RX.uniform(-0.03, 0.03)], [0.06, 0.004, 0.004], 'nailHead', ry=i % 2) for i in range(6)])
model('items', 'steel_beam', ibeam(-0.6, 0.6, 0.15, 0.1, 'galvX') + [flat([(0.2, 0.1505 + 0.0, -0.04), (0.45, 0.1505, -0.05), (0.42, 0.1505, 0.03), (0.22, 0.1505, 0.045)], 'rust', (0, 1, 0))])
model('items', 'rebar_bundle', [loft([[-0.7, 0.012 + 0.016*(i // 3), (i % 3 - 1)*0.018 + 0.008*(i // 3), 0.006, 0.006], [0.7, 0.012 + 0.016*(i // 3), (i % 3 - 1)*0.018 + 0.008*(i // 3), 0.006, 0.006]], 'rebarX', ax='x', n=4) for i in range(5)]
      + [loft([[x - 0.01, 0.02, 0, 0.034, 0.03], [x + 0.01, 0.02, 0, 0.034, 0.03]], 'wireXD', ax='x', n=6, caps=[False, False]) for x in (-0.4, 0.4)])
def corrugated(w, d, c, cd, y=0.0):
    o = [box([0, y + 0.003, 0], [w, 0.006, d], c)]
    o += [box([x, y + 0.012, 0], [0.03, 0.012, d], cd) for x in [(-w/2 + 0.06 + i*0.1) for i in range(int(w/0.1))]]
    return o
model('items', 'sheet_metal', corrugated(0.9, 0.6, 'galvX', 'galvXD') + [flat([(0.2, 0.0065, 0.1), (0.4, 0.0065, 0.14), (0.38, 0.0065, 0.28), (0.2, 0.0065, 0.25)], 'rust', (0, 1, 0))])
model('items', 'concrete_chunk', [lump(0, 0, 0.13, 'concreteX'), lump(0.1, 0.06, 0.06, 'concreteXD'), loft([[-0.05, 0.08, 0.02, 0.006, 0.006], [-0.14, 0.2, 0.08, 0.006, 0.006]], 'rebarX', n=4),
                                  loft([[0.03, 0.06, -0.05, 0.006, 0.006], [0.1, 0.16, -0.16, 0.006, 0.006]], 'rebarX', n=4)])
model('items', 'brick', [b(0, 0, 0, 0.215, 0.065, 0.1025, 'brickX'), flat([(-0.1075, 0.0655, -0.03), (0.1075, 0.0655, -0.03), (0.1075, 0.0655, 0.0), (-0.1075, 0.0655, 0.0)], 'mortarX', (0, 1, 0)),
                         flat([(0.06, 0.0655, 0.02), (0.1075, 0.0655, 0.01), (0.1075, 0.0655, 0.05), (0.07, 0.0655, 0.05)], 'brickXD', (0, 1, 0))])
model('items', 'brick_stack', [b(x, y*0.067, z, 0.215, 0.065, 0.1025, 'brickX' if (x + y + z) % 0.3 else 'brickXD', ry=(y % 2)) for y in range(3) for x, z in (((-0.06, -0.055), (0.06, 0.055)) if y % 2 == 0 else ((0.0, 0.0),))])
model('items', 'glass_sheet', [box([0, 0.004, 0], [0.8, 0.008, 0.6], 'glassX'), box([0.0, 0.009, 0.0], [0.82, 0.002, 0.02], 'glassX')][:1]
      + [flat([(-0.4, 0.0085, 0.3), (-0.1, 0.0085, 0.3), (-0.4, 0.0085, 0.1)], 'white', (0, 1, 0)), flat([(0.2, 0.0085, -0.3), (0.4, 0.0085, -0.3), (0.4, 0.0085, -0.05)], 'white', (0, 1, 0))])
model('items', 'wire_coil', [loft([[0, 0, 0, 0.17, 0.17], [0, 0.02, 0, 0.19, 0.19], [0, 0.06, 0, 0.19, 0.19], [0, 0.08, 0, 0.17, 0.17]], 'wireX', n=10, closed=True, caps=[False, False], both=True, cin='wireXD'),
                             loft([[0, 0.0, 0, 0.11, 0.11], [0, 0.08, 0, 0.11, 0.11]], 'wireXD', n=10, caps=[False, False], both=True, cin='wireXD'),
                             flat([(0.17, 0.004, 0.02), (0.36, 0.004, 0.14), (0.36, 0.004, 0.16), (0.17, 0.004, 0.04)], 'wireX', (0, 1, 0))])
model('items', 'plasterboard_scrap', [hull([(-0.25, 0, -0.18), (0.22, 0, -0.2), (0.28, 0, 0.12), (-0.2, 0, 0.2), (-0.25, 0.0125, -0.18), (0.22, 0.0125, -0.2), (0.28, 0.0125, 0.12), (-0.2, 0.0125, 0.2)], 'gypsumX'),
                                      flat([(-0.2, 0.0131, -0.13), (0.18, 0.0131, -0.15), (0.22, 0.0131, 0.1), (-0.16, 0.0131, 0.15)], 'paint', (0, 1, 0))])
HARVEST = {'planks': 'boards from siding, sheathing and floors', 'scrap_wood': 'broken boards, splinters (fuel, small repairs)', 'lumber': 'studs, plates and joists cut out of a frame (worth more than skins)',
           'nails_handful': 'pulled from every wood layer', 'steel_beam': 'steel frame columns, beams, girts', 'rebar_bundle': 'from broken concrete', 'sheet_metal': 'sheet and cladding skins, metal deck',
           'concrete_chunk': 'poured walls, slabs, columns', 'brick': 'brick skins (brick_stack is five)', 'glass_sheet': 'whole panes taken out before they break', 'wire_coil': 'stripped from walls and the power grid',
           'plasterboard_scrap': 'inner skins (little use: patching, kindling)'}

# ================= 10.3 bases =================
model('build', 'claim_sign', [b(0, 0, 0, 0.06, 1.3, 0.06, 'woodD'), b(0, 0.85, 0.045, 0.5, 0.32, 0.025, 'plank'), box([0, 1.01, 0.058], [0.52, 0.04, 0.006], 'plankD'),
                              flat([(-0.16, 0.92, 0.0585), (-0.04, 0.92, 0.0585), (0.0, 1.1, 0.0585), (-0.12, 1.1, 0.0585)], 'claim'),
                              flat([(0.02, 0.92, 0.0585), (0.14, 0.92, 0.0585), (0.18, 1.1, 0.0585), (0.06, 1.1, 0.0585)], 'claim'),
                              flat([(-0.17, 0.99, 0.0586), (0.18, 0.99, 0.0586), (0.18, 1.03, 0.0586), (-0.17, 1.03, 0.0586)], 'claimPaint'),
                              *[box([sx*0.22, 1.0 + sy*0.13, 0.059], [0.012, 0.012, 0.006], 'nailHead') for sx in (1, -1) for sy in (1, -1)]])
model('build', 'claim_flag', [b(0, 0, 0, 0.035, 1.9, 0.035, 'woodD'), b(0, 0, 0, 0.16, 0.08, 0.16, 'stone'),
                              hull([(0.02, 1.45, -0.002), (0.55, 1.5, -0.002), (0.55, 1.5, 0.002), (0.02, 1.45, 0.002), (0.02, 1.85, -0.002), (0.5, 1.78, -0.002), (0.5, 1.78, 0.002), (0.02, 1.85, 0.002)], 'claim'),
                              flat([(0.12, 1.55, 0.0025), (0.4, 1.58, 0.0025), (0.38, 1.72, 0.0025), (0.12, 1.74, 0.0025)], 'claimPaint'), flat([(0.12, 1.55, -0.0025), (0.4, 1.58, -0.0025), (0.38, 1.72, -0.0025), (0.12, 1.74, -0.0025)], 'claimPaint', (0, 0, -1)),
                              box([0.0, 1.47, 0.0], [0.05, 0.03, 0.05], 'cloth')])
def custom_bed():
    o = [b(sx*0.42, 0, sz*0.95, 0.09, 0.42 if sz < 0 else 0.3, 0.09, 'lumberX') for sx in (1, -1) for sz in (1, -1)]
    o += [b(sx*0.42, 0.2, 0, 0.045, 0.1, 1.9, 'lumberXD') for sx in (1, -1)] + [b(0, 0.2, sz*0.95, 0.84, 0.1, 0.045, 'lumberXD') for sz in (1, -1)]
    o += [b(0, 0.27, -0.75 + i*0.3, 0.84, 0.025, 0.14, 'plank' if i % 2 else 'plankD') for i in range(6)]
    rags = ['rag1', 'rag2', 'rag3', 'rag4']
    o += [b(-0.2 + 0.4*(i % 2), 0.295, -0.7 + 0.45*(i // 2), 0.4, 0.09, 0.45, rags[(i + i // 2) % 4]) for i in range(8)]
    o += [flat([(-0.4 + 0.4*(i % 2), 0.386, -0.7 + 0.45*(i // 2) - 0.002), (-0.38 + 0.4*(i % 2), 0.386, -0.7 + 0.45*(i // 2) + 0.002), (0.0 + 0.4*(i % 2) - 0.02, 0.386, -0.7 + 0.45*(i // 2) + 0.002), (0.0 + 0.4*(i % 2), 0.386, -0.7 + 0.45*(i // 2) - 0.002)], 'black', (0, 1, 0)) for i in range(2, 8, 2)]
    o += [hull([(-0.25, 0.385, -0.9), (0.25, 0.385, -0.9), (0.25, 0.385, -0.62), (-0.25, 0.385, -0.62), (-0.2, 0.46, -0.86), (0.2, 0.46, -0.86), (0.2, 0.44, -0.66), (-0.2, 0.44, -0.66)], 'clothScrap')]
    o += [hull([(-0.44, 0.39, -0.3), (0.44, 0.39, -0.3), (0.44, 0.39, 0.9), (-0.44, 0.39, 0.9), (-0.42, 0.42, -0.25), (0.42, 0.42, -0.28), (0.42, 0.41, 0.88), (-0.42, 0.41, 0.88)], 'blanketD'),
          flat([(-0.2, 0.4215, -0.1), (0.1, 0.4215, -0.12), (0.12, 0.42, 0.3), (-0.18, 0.42, 0.32)], 'rag3', (0, 1, 0)), flat([(0.1, 0.42, 0.4), (0.38, 0.42, 0.38), (0.36, 0.415, 0.75), (0.12, 0.415, 0.78)], 'rag4', (0, 1, 0))]
    o += [b(0, 0.0, -1.05, 0.98, 0.7, 0.05, 'plankD'), flat([(-0.3, 0.45, -1.024), (0.3, 0.45, -1.024), (0.3, 0.55, -1.024), (-0.3, 0.55, -1.024)], 'claim', (0, 0, 1))]
    return o
model('build', 'custom_bed', custom_bed())
# reinforcement laid on the room side of a wall: a three-bay panel 1.5 m wide and 2.4 m tall, its back at z = 0, facing +Z (into the room)
def reinforce(kind, stage):
    o = []; W, H = 1.5, 2.4
    if kind == 'planks':
        keep = {0: range(7), 1: [0, 2, 3, 5, 6], 2: [0, 6, 3]}[stage]
        o += [box([sx*0.6, H/2, 0.025], [0.09, H, 0.05], 'lumberXD') for sx in (1, -1)]
        for i in keep:
            y = 0.2 + i*(H - 0.4)/6; t = 0.05*((i % 2)*2 - 1)
            o.append(hull([(-W/2, y - 0.08 - t, 0.05), (W/2, y - 0.08 + t, 0.05), (W/2, y - 0.08 + t, 0.075), (-W/2, y - 0.08 - t, 0.075),
                           (-W/2, y + 0.08 - t, 0.05), (W/2, y + 0.08 + t, 0.05), (W/2, y + 0.08 + t, 0.075), (-W/2, y + 0.08 - t, 0.075)], 'plank' if i % 2 else 'plankD'))
            o += [box([sx*0.6, y + t*sx*0.8, 0.078], [0.016, 0.016, 0.008], 'nailHead') for sx in (1, -1)]
        if stage == 1: o += [hull([(0.1, 0.8, 0.05), (0.75, 0.86, 0.05), (0.75, 0.86, 0.075), (0.1, 0.8, 0.075), (0.12, 0.92, 0.05), (0.75, 0.98, 0.05), (0.75, 0.98, 0.075), (0.12, 0.92, 0.075)], 'plankBroken')]
        if stage == 2: o += [hull([(-W/2, 1.0, 0.05), (-0.3, 1.04, 0.05), (-0.3, 1.04, 0.075), (-W/2, 1.0, 0.075), (-W/2, 1.14, 0.05), (-0.34, 1.16, 0.05), (-0.34, 1.16, 0.075), (-W/2, 1.14, 0.075)], 'plankBroken')]
    elif kind == 'sheet':
        panels = {0: [(-W/2, 0, W/2, H)], 1: [(-W/2, 0, 0.0, H), (0.0, 0, W/2, 1.6)], 2: [(-W/2, 0, -0.1, 1.4)]}[stage]
        for (x0, y0, x1, y1) in panels:
            o.append(box([(x0 + x1)/2, (y0 + y1)/2, 0.006], [x1 - x0, y1 - y0, 0.012], 'steelPlate'))
            o += [box([x, (y0 + y1)/2, 0.016], [0.03, y1 - y0, 0.008], 'galvXD') for x in [x0 + 0.08 + i*0.2 for i in range(int((x1 - x0)/0.2))]]
            o += [box([x, y, 0.022], [0.02, 0.02, 0.01], 'nailHead') for x in (x0 + 0.05, x1 - 0.05) for y in (y0 + 0.06, y1 - 0.06, (y0 + y1)/2)]
        if stage == 1: o += [hull([(0.0, 1.6, 0.0), (W/2, 1.6, 0.0), (W/2, 1.6, 0.012), (0.0, 1.6, 0.012), (0.05, 2.2, 0.25), (W/2, 2.1, 0.3), (W/2, 2.1, 0.312), (0.05, 2.2, 0.262)], 'steelPlate')]
        if stage == 2: o += [flat([(-0.1, 0.3, 0.013), (0.2, 0.5, 0.013), (0.0, 0.9, 0.013)], 'rust'), hull([(-0.1, 1.4, 0.0), (0.3, 1.4, 0.0), (0.3, 1.4, 0.012), (-0.1, 1.4, 0.012), (0.0, 1.9, 0.35), (0.45, 1.95, 0.3), (0.45, 1.95, 0.312), (0.0, 1.9, 0.362)], 'steelPlate')]
    else:   # rebar mesh welded over the wall
        xs = [-W/2 + 0.05 + i*0.2 for i in range(8)]; ys = [0.1 + i*0.2 for i in range(12)]
        if stage == 1: xs = [x for i, x in enumerate(xs) if i not in (4,)]; ys = [y for i, y in enumerate(ys) if i not in (5, 6)]
        if stage == 2: xs = xs[:3]; ys = ys[:6]
        for x in xs: o.append(box([x, (ys[0] + ys[-1])/2, 0.01], [0.014, ys[-1] - ys[0] + 0.1, 0.014], 'rebarX'))
        for y in ys: o.append(box([(xs[0] + xs[-1])/2, y, 0.024], [xs[-1] - xs[0] + 0.1, 0.014, 0.014], 'rebarX'))
        o += [box([sx*0.72, sy, 0.012], [0.06, 0.06, 0.024], 'steelPlate') for sx in (1, -1) for sy in (0.15, 2.25)] if stage == 0 else [box([-0.72, 0.15, 0.012], [0.06, 0.06, 0.024], 'steelPlate')]
        if stage >= 1: o.append(loft([[xs[-1] + 0.2, ys[len(ys)//2], 0.02, 0.007, 0.007], [xs[-1] + 0.35, ys[len(ys)//2] + 0.3, 0.25, 0.007, 0.007]], 'rebarX', n=4))
    return o
for kind in ('planks', 'sheet', 'mesh'):
    for st, sfx in ((0, ''), (1, '_damaged'), (2, '_nearly_gone')): model('build', 'reinforce_' + kind + sfx, reinforce(kind, st))

# ================= 10.5 vehicle damage =================
def as_hull(q):
    """a box piece as an 8-corner solid, so it can be bent"""
    if q['s'] != 'box': return q
    (x, y, z), (w, h, d) = q['p'], q['d']
    return hull([(x - w/2, y - h/2, z - d/2), (x + w/2, y - h/2, z - d/2), (x + w/2, y - h/2, z + d/2), (x - w/2, y - h/2, z + d/2),
                 (x - w/2, y + h/2, z - d/2), (x + w/2, y + h/2, z - d/2), (x + w/2, y + h/2, z + d/2), (x - w/2, y + h/2, z + d/2)], q['c'], **{k: v for k, v in q.items() if k in ('glow',)})
def abs_pts(q): return [[v[i] + q['p'][i] for i in range(3)] for v in q['v']]
def set_pts(q, pts):
    c = centre(pts); q = dict(q); q['p'] = [R4(v) for v in c]; q['v'] = [[R4(p[i] - c[i]) for i in range(3)] for p in pts]; return q
def crumple(pcs, zmax, half, depth, push, wob, recolour=None):
    """push the front (z near zmax) back and down, more on the driver's side, with a wrinkle"""
    out = []
    for q in pcs:
        if q['s'] == 'loft' or 'v' not in q and q['s'] != 'box': out.append(q); continue
        q = as_hull(q)
        if 'v' not in q: out.append(q); continue
        pts = []
        for x, y, z in abs_pts(q):
            t = max(0.0, (z - (zmax - depth))/depth)
            if t > 0:
                side = 1 + 0.45*(x/half)
                z -= push*t*side; y -= 0.05*push*t*t + wob*math.sin(11*x + 3*y)*t; x *= 1 - 0.04*t
            pts.append([x, y, z])
        q = set_pts(q, pts)
        if recolour and q['c'] in recolour and max(p[2] for p in pts) > zmax - depth - push: q['c'] = recolour[q['c']]
        out.append(q)
    return out
def glass_face(V):
    """the windscreen: the side of the cabin's glass solid that faces most forward"""
    best = None
    for q in V['body']:
        if q['c'] != 'glass' or q['s'] != 'poly': continue
        P = abs_pts(q); c = centre(P)
        for f in q['f']:
            if len(f) != 4: continue
            pts = [P[i] for i in f]; m = centre(pts)
            u = [pts[1][i] - pts[0][i] for i in range(3)]; v = [pts[2][i] - pts[0][i] for i in range(3)]
            n = [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]]; L = math.sqrt(sum(a*a for a in n)) or 1; n = [a/L for a in n]
            if sum(n[i]*(m[i] - c[i]) for i in range(3)) < 0: n = [-a for a in n]
            area = L
            if n[2] > 0.3 and area > 0.3 and (best is None or n[2]*area > best[0]): best = (n[2]*area, pts, n)
    return best[1], best[2]
def on_face(pts, n, u0, v0, u1, v1, off=0.004):
    """a point on the quad pts at (u, v) in 0..1, pushed off along n"""
    a, b2, c, d = pts
    def at(u, v): return [a[i] + (b2[i] - a[i])*u + (d[i] - a[i])*v + (c[i] - b2[i] - d[i] + a[i])*u*v + n[i]*off for i in range(3)]
    return at
def windscreen(V, state):
    pts, n = glass_face(V)
    # order the face corners: bottom-left, bottom-right, top-right, top-left
    pts = sorted(pts, key=lambda p: p[1]); lo = sorted(pts[:2], key=lambda p: p[0]); hi = sorted(pts[2:], key=lambda p: p[0]); quad = [lo[0], lo[1], hi[1], hi[0]]
    at = on_face(quad, n, 0, 0, 1, 1)
    o = []
    if state == 'cracked':
        cx, cy = 0.32, 0.45
        for k in range(7):
            a = k*0.9 + 0.3; r = 0.28 + 0.12*(k % 3)
            p0 = at(cx, cy); p1 = at(min(0.97, max(0.03, cx + r*math.cos(a))), min(0.95, max(0.05, cy + r*math.sin(a)*1.6)))
            w = [0.006*x for x in (1, 1, 1)]
            o.append(flat([p0, [p0[0] + 0.008, p0[1], p0[2]], [p1[0] + 0.004, p1[1], p1[2]], p1], 'crackGX', tuple(n)))
        o.append(flat([at(cx - 0.03, cy - 0.04), at(cx + 0.03, cy - 0.04), at(cx + 0.03, cy + 0.06), at(cx - 0.03, cy + 0.06)], 'crackGX', tuple(n)))
    else:
        o.append(flat([at(0.04, 0.06), at(0.96, 0.06), at(0.96, 0.94), at(0.04, 0.94)], 'black', tuple(n)))
        for u in (0.1, 0.35, 0.6, 0.85):
            o.append(flat([at(u - 0.06, 0.06), at(u + 0.07, 0.06), at(u + 0.01, 0.06 + RX.uniform(0.1, 0.22))], 'glassBroken', tuple([x for x in n])))
        o.append(flat([at(0.9, 0.94), at(0.97, 0.94), at(0.95, 0.7)], 'glassBroken', tuple(n)))
    return o
def bonnet_buckled(V):
    """the bonnet folded up in a ridge across its middle"""
    q = V['bonnet'][0]; P = abs_pts(q)
    lo, hi = P[:4], P[4:]       # lower ring then upper ring (hull order): back-left, back-right, front-right, front-left
    def mid(a, b2, f, lift): return [a[0] + (b2[0] - a[0])*f, a[1] + (b2[1] - a[1])*f + lift, a[2] + (b2[2] - a[2])*f - 0.06]
    out = []
    for (f0, f1, l0, l1) in ((0.0, 0.5, 0.0, 0.16), (0.5, 1.0, 0.16, 0.02)):
        ring = lambda R, f, l: [mid(R[0], R[3], f, l), mid(R[1], R[2], f, l*0.6), None, None]
        a0 = [mid(lo[0], lo[3], f0, l0), mid(lo[1], lo[2], f0, l0*0.6)]; a1 = [mid(lo[0], lo[3], f1, l1), mid(lo[1], lo[2], f1, l1*0.6)]
        b0 = [mid(hi[0], hi[3], f0, l0), mid(hi[1], hi[2], f0, l0*0.6)]; b1 = [mid(hi[0], hi[3], f1, l1), mid(hi[1], hi[2], f1, l1*0.6)]
        out.append(hull([a0[0], a0[1], a1[1], a1[0], b0[0], b0[1], b1[1], b1[0]], q['c']))
    out.append(flat([mid(hi[0], hi[3], 0.48, 0.165), mid(hi[1], hi[2], 0.48, 0.1), mid(hi[1], hi[2], 0.52, 0.1), mid(hi[0], hi[3], 0.52, 0.165)], 'rustD', (0, 1, 0)))
    return out
def smoke_over(V):
    q = V['bonnet'][0]; P = abs_pts(q); c = centre(P)
    o = [flat([[c[0] - 0.3, c[1] + 0.045, c[2] - 0.2], [c[0] + 0.25, c[1] + 0.045, c[2] - 0.25], [c[0] + 0.3, c[1] + 0.045, c[2] + 0.2], [c[0] - 0.2, c[1] + 0.045, c[2] + 0.25]], 'scorch', (0, 1, 0))]
    for i, (dx, dy, s) in enumerate(((0.0, 0.25, 0.16), (0.08, 0.55, 0.22), (-0.05, 0.9, 0.28), (0.1, 1.3, 0.34))):
        o.append(loft([[c[0] + dx, c[1] + dy - s*0.7, c[2] - 0.05*i, 0, 0], [c[0] + dx, c[1] + dy, c[2] - 0.05*i, s, s*0.9], [c[0] + dx, c[1] + dy + s*0.7, c[2] - 0.05*i, 0, 0]], 'smokeX' if i % 2 else 'smokeXL', n=6))
    return o, [R4(c[0]), R4(c[1] + 0.1), R4(c[2])]
def bent_bumper(pcs, zmax, half):
    out = []
    for q in pcs:
        if q['s'] == 'box' and q['c'] in ('chrome', 'black') and q['p'][2] > zmax - 0.2 and q['d'][0] > 1.5:
            (x, y, z), (w, h, d) = q['p'], q['d']
            pts = [[-w/2, -h/2, -d/2], [w/2, -h/2, -d/2], [w/2, -h/2, d/2], [-w/2, -h/2, d/2], [-w/2, h/2, -d/2], [w/2, h/2, -d/2], [w/2, h/2, d/2], [-w/2, h/2, d/2]]
            def bend(p):
                f = (p[0] + w/2)/w   # 0 on the right (-X), 1 on the left
                return [x + p[0], y + p[1] - 0.09*f*f, z + p[2] - 0.22*f*f + (0.03 if 0.3 < f < 0.6 else 0)]
            mids = [[-w/2 + w*0.45, s, t] for s, t in ((-h/2, -d/2), (-h/2, d/2), (h/2, -d/2), (h/2, d/2))]
            A = [bend(p) for p in pts]
            m = [bend(p) for p in mids]
            out.append(hull([A[0], m[0], m[1], A[3], A[4], m[2], m[3], A[7]], q['c'])); out.append(hull([m[0], A[1], A[2], m[1], m[2], A[5], A[6], m[3]], q['c']))
            continue
        out.append(q)
    return out
DMG_INFO = {}
for nm in CARS:
    V = M['vehicles'][nm]
    allp = [p for q in V['body'] if 'v' in q for p in abs_pts(q)] + [[q['p'][0], q['p'][1], q['p'][2] + q['d'][2]/2] for q in V['body'] if q['s'] == 'box']
    zmax = max(p[2] for p in allp); half = max(abs(p[0]) for p in allp)
    rec = {'head': 'glassBroken', 'chrome': 'rustD'}
    D = {'body_crumple_light': crumple(V['body'], zmax, half, 0.45, 0.16, 0.012), 'body_crumple_heavy': crumple(V['body'], zmax, half, 0.9, 0.5, 0.03, rec),
         'bonnet_crumple_light': crumple(V['bonnet'], zmax, half, 0.45, 0.16, 0.012), 'bonnet_crumple_heavy': crumple(V['bonnet'], zmax, half, 0.9, 0.5, 0.03),
         'bonnet_buckled': crumple(bonnet_buckled(V), zmax, half, 0.9, 0.5, 0.03), 'body_bumper_bent': bent_bumper(V['body'], zmax, half),
         'windscreen_cracked': windscreen(V, 'cracked'), 'windscreen_missing': windscreen(V, 'missing')}
    sm, at_ = smoke_over(V); D['smoke'] = sm
    V['damage'] = D
    VRIG[nm]['smokeAt'] = at_
DMG_RULE = ('vehicles[name].damage (sedan, hatchback, pickup, van): body_crumple_light / body_crumple_heavy and body_bumper_bent replace body; '
            'bonnet_crumple_light / bonnet_crumple_heavy (use with the matching body) and bonnet_buckled (folded up, goes with body_crumple_heavy) replace bonnet; windscreen_cracked and windscreen_missing are '
            'drawn on top of the body; smoke is a scorch mark and a few puffs over the bonnet for a smoking engine (or start fx.smoke_column at vehicleRig[name].smokeAt). '
            'Order a crash goes through: bumper_bent and windscreen_cracked (light knock), crumple_light, crumple_heavy with bonnet_buckled, smoke, windscreen_missing.')

# ---- pickup truck, game 0.94.1: a driver's door that comes off, steering and a loose tyre (replaces the Kenney Car Kit pickup) ----
def _pickup_parts():
    W, y0, y1, z0, z1 = 0.95, 0.38, 1.72, -0.56, 0.22; x = -W - 0.02; hh = z1 - z0
    door = [box([x, (y0 + 1.04)/2, (z0 + z1)/2], [0.07, 1.04 - y0, hh], 'paint2'),                       # lower panel, hinged at the front edge
            hull([(x - 0.01, 1.04, z0 + 0.03), (x - 0.01, 1.04, z1 - 0.03), (x - 0.01, y1 - 0.04, z1 - 0.08), (x - 0.01, y1 - 0.04, z0 + 0.1),
                  (x + 0.035, 1.04, z0 + 0.03), (x + 0.035, 1.04, z1 - 0.03), (x + 0.035, y1 - 0.04, z1 - 0.08), (x + 0.035, y1 - 0.04, z0 + 0.1)], 'glass'),
            box([x - 0.045, 0.98, z0 + 0.1], [0.04, 0.05, 0.16], 'chrome'),                              # handle
            box([x - 0.05, 0.62, (z0 + z1)/2], [0.03, 0.03, hh - 0.06], 'paintD' if 'paintD' in PALETTE else 'paint2')]
    opening = [box([-W + 0.01, 0.75, (z0 + z1)/2], [0.04, 0.6, hh - 0.1], 'black'),                      # what shows where the door was: a dark cab with a seat edge
               box([-0.55, 0.62, (z0 + z1)/2 - 0.05], [0.5, 0.18, 0.5], 'woodD')]
    return door, opening
_door, _open = _pickup_parts()
M['vehicles']['pickup']['door_l'] = _door; M['vehicles']['pickup']['door_gap'] = _open
VRIG['pickup'].update({'doorHinge': [-0.97, 0, 0.22], 'doorAxis': 'y', 'doorOpenDeg': 70,
    'doorRule': 'door_l is the driver\'s door (left, -x), drawn just proud of the body; hinge it at doorHinge about y, swing the back edge out (about 70 degrees). To remove it, delete door_l and draw door_gap on top of body, then spawn the door as a loose item.',
    'steerRule': 'The wheel model is one tyre and hub. The front two are at z = wheels[1][2]; turn them about y up to 30 degrees to steer, spin all four about x. The rear two never steer.',
    'looseTyre': 'items.tyre_loose: one tyre with its hub, 0.72 m across, standing; also lying flat as items.tyre_loose_flat.'})
model('items', 'tyre_loose', [loft([[0, 0.36, -0.12, 0.36, 0.36], [0, 0.36, 0.12, 0.36, 0.36]], 'tyre', ax='z', n=10), loft([[0, 0.36, -0.125, 0.2, 0.2], [0, 0.36, 0.125, 0.2, 0.2]], 'hub', ax='z', n=8),
                              loft([[0, 0.36, -0.13, 0.08, 0.08], [0, 0.36, 0.13, 0.08, 0.08]], 'tyre', ax='z', n=6)])
model('items', 'tyre_loose_flat', [loft([[0, 0.0, 0, 0.36, 0.36], [0, 0.24, 0, 0.36, 0.36]], 'tyre', n=10), loft([[0, 0.0, 0, 0.2, 0.2], [0, 0.25, 0, 0.2, 0.2]], 'hub', n=8)])
for _k in ('wreck', 'burnt'):   # the door in the same states as the body
    _V = M['vehicles']['pickup_' + _k]; _map = {'paint2': 'rustBody' if _k == 'wreck' else 'burnt', 'glass': 'glassBroken' if _k == 'wreck' else 'burntD', 'chrome': 'rustD' if _k == 'wreck' else 'burntD'}
    VRIG['pickup_' + _k].update({k: v for k, v in VRIG['pickup'].items() if k.startswith(('door', 'steer', 'looseTyre'))})
    _V['door_l'] = [dict(q, c=_map.get(q['c'], q['c'])) for q in _door]; _V['door_gap'] = _open

# ================= section 11 (20 October 2026) =================
PALETTE.update({'gunMetal': '#2e3034', 'gunWood': '#8a6a46', 'targetW': '#e8e0cc', 'targetR': '#b8322a', 'glassCase': '#9cc4d0', 'hose': '#3a5a3a', 'fuelRed': '#b8322a', 'flameX': '#ffb04a', 'flameXC': '#fff0b8', 'flameXR': '#e0602a', 'cardG': '#3f6a3a', 'cardR': '#a8322a', 'cardB': '#2e5a7a'})
def long_gun(x, y, z, L=1.0, wood=True, ry=0):
    """a rifle or shotgun silhouette standing upright (muzzle up), for racks and counters"""
    c = 'gunWood' if wood else 'gunMetal'
    return [hull([(x - 0.02, y, z - 0.06), (x + 0.02, y, z - 0.06), (x + 0.02, y, z + 0.02), (x - 0.02, y, z + 0.02), (x - 0.02, y + 0.35*L, z - 0.025), (x + 0.02, y + 0.35*L, z - 0.025), (x + 0.02, y + 0.35*L, z + 0.0), (x - 0.02, y + 0.35*L, z + 0.0)], c),
            box([x, y + 0.42*L, z - 0.01], [0.04, 0.16*L, 0.05], 'gunMetal'), box([x, y + 0.75*L, z - 0.01], [0.022, 0.5*L, 0.022], 'gunMetal'), box([x, y + 0.6*L, z + 0.015], [0.03, 0.22*L, 0.03], c)]
model('shop', 'gun_counter', [b(0, 0, 0, 2.0, 0.85, 0.6, 'cupboardD'), b(0, 0.85, 0, 2.0, 0.04, 0.6, 'metalD'), b(0, 0.89, 0, 1.96, 0.18, 0.56, 'glassCase'),
                              b(0, 1.07, 0, 2.0, 0.02, 0.6, 'metalD'), b(0, 0.3, 0.301, 1.9, 0.4, 0.002, 'cupboard')]
      + [p for i, x in enumerate((-0.7, -0.2, 0.3, 0.75)) for p in [box([x, 0.92, 0.0], [0.18, 0.03, 0.05], 'gunMetal', ry=0), box([x - 0.06, 0.9, 0.04], [0.04, 0.025, 0.08], 'gunWood')]]
      + [b(0.6, 1.09, -0.1, 0.35, 0.12, 0.25, 'screen'), b(-0.6, 1.09, 0.0, 0.25, 0.04, 0.2, 'label')])
model('shop', 'gun_rack', [b(0, 0, -0.06, 2.0, 2.2, 0.06, 'cupboardD'), b(0, 0.25, 0.0, 2.0, 0.08, 0.14, 'cupboard'), b(0, 1.55, 0.0, 2.0, 0.06, 0.14, 'cupboard')]
      + [p for i in range(7) for p in long_gun(-0.84 + i*0.28, 0.33, 0.03, 1.15 + 0.05*(i % 3), wood=i % 2 == 0)]
      + [b(-0.5 + i*0.33, 1.9, 0.0, 0.25, 0.14, 0.12, ['cardG', 'cardR', 'cardB'][i % 3]) for i in range(4)])
model('shop', 'ammo_shelf', [b(0, 0, 0, 1.2, 1.9, 0.4, 'metalD'), *[b(0, y, 0.0, 1.16, 0.03, 0.38, 'metal') for y in (0.1, 0.55, 1.0, 1.45)]]
      + [b(-0.48 + i*0.135, y + 0.03, 0.05, 0.11, 0.07 if j % 2 else 0.05, 0.08, ['cardG', 'cardR', 'cardB', 'ammo'][(i + j) % 4]) for j, y in enumerate((0.1, 0.55, 1.0, 1.45)) for i in range(8) if (i*3 + j) % 7 != 2])
model('shop', 'target_poster', [b(0, 1.0, 0.003, 0.6, 0.9, 0.006, 'targetW'), *[loft([[0, 1.5, 0.007 + 0.001*i, r, r], [0, 1.5, 0.008 + 0.001*i, r, r]], 'targetR' if i % 2 == 0 else 'targetW', ax='z', n=12) for i, r in enumerate((0.25, 0.19, 0.13, 0.06))],
                                b(0, 1.06, 0.007, 0.5, 0.04, 0.001, 'black'), flat([(-0.1, 1.48, 0.013), (-0.08, 1.48, 0.013), (-0.08, 1.5, 0.013), (-0.1, 1.5, 0.013)], 'black'), flat([(0.05, 1.56, 0.013), (0.07, 1.56, 0.013), (0.07, 1.58, 0.013), (0.05, 1.58, 0.013)], 'black')])
SHOP_RULE = 'shop: the inside of a gun shop (with buildings.modules.gunshop_front): gun_counter (2 m glass counter with pistols inside), gun_rack (a wall of long guns, against a wall: back at z = -0.09), ammo_shelf, target_poster (on a wall, back at z = 0; also a shooting target: arrows and bolts from held.ammo stick in it).'
# door brace and window boards seen from outside
model('build', 'door_brace', [b(sx*0.55, 0.95, 0.03, 0.12, 0.2, 0.06, 'steelPlate') for sx in (1, -1)] + [b(sx*0.55, 1.08, 0.08, 0.12, 0.04, 0.06, 'steelPlate') for sx in (1, -1)]
      + [b(0, 1.0, 0.11, 1.4, 0.12, 0.08, 'plankD'), hull([(-0.05, 0.0, 0.7), (0.05, 0.0, 0.7), (0.05, 0.0, 0.8), (-0.05, 0.0, 0.8), (-0.05, 0.95, 0.12), (0.05, 0.95, 0.12), (0.05, 1.05, 0.15), (-0.05, 1.05, 0.15)], 'plank'),
         *[box([sx*0.55, 1.0, 0.152], [0.02, 0.02, 0.004], 'nailHead') for sx in (1, -1)]])
def bay_boards():
    """boards nailed over a buildings.js window bay from outside: the window is 1.2 by 1.3 m from 0.9 m up"""
    o = []
    for i in range(5):
        y = 1.0 + i*0.28; t = 0.04*((i % 2)*2 - 1)
        o.append(hull([(-0.72, y - 0.08 - t, 0.11), (0.72, y - 0.08 + t, 0.11), (0.72, y - 0.08 + t, 0.135), (-0.72, y - 0.08 - t, 0.135), (-0.72, y + 0.08 - t, 0.11), (0.72, y + 0.08 + t, 0.11), (0.72, y + 0.08 + t, 0.135), (-0.72, y + 0.08 - t, 0.135)], 'plank' if i % 2 else 'plankD'))
        o += [box([sx*0.65, y + t*sx*0.9, 0.138], [0.016, 0.016, 0.006], 'nailHead') for sx in (1, -1)]
    return o
model('build', 'window_boards_bay', bay_boards())
BOARD_RULE = 'build.window_boards_bay fits a buildings.js window bay from outside (bay-local coordinates, planks just proud of the frame); build.door_brace is a bar across the inside of a door 1.2 m wide (brackets at x = +-0.55, the door face at z = 0, a prop leaning to the floor at z = 0.75).'
# fuel siphon, paper map on the ground
model('items', 'fuel_siphon', [b(0, 0, 0, 0.28, 0.36, 0.16, 'fuelRed'), b(0.06, 0.36, 0, 0.06, 0.06, 0.06, 'black'), b(-0.06, 0.36, 0, 0.1, 0.03, 0.04, 'fuelRed'),
                               *[seg(p, q, 0.01, 0.01, 0.01, 0.01, 'hose', caps=(False, False)) for p, q in (([0.06, 0.42, 0], [0.1, 0.55, 0.15]), ([0.1, 0.55, 0.15], [0.2, 0.6, 0.45]), ([0.2, 0.6, 0.45], [0.35, 0.9, 0.7]))]])
SIPHON_RULE = 'items.fuel_siphon: a jerry can with its hose rising towards +Z; set it beside a car with the hose end at vehicleRig[name].fuelCap (the pickup) or the car\'s rear flank (about 0.8 m up).'
model('items', 'paper_map', [b(0, 0, 0, 0.2, 0.012, 0.14, 'paper'), flat([(-0.1, 0.0125, 0.0), (0.1, 0.0125, 0.0), (0.1, 0.0125, 0.004), (-0.1, 0.0125, 0.004)], 'label', (0, 1, 0)),
                             flat([(-0.06, 0.0126, -0.04), (0.05, 0.0126, 0.03), (0.055, 0.0126, 0.04), (-0.055, 0.0126, -0.03)], 'blue', (0, 1, 0)), flat([(0.03, 0.0126, -0.05), (0.07, 0.0126, -0.05), (0.07, 0.0126, -0.01)], 'red', (0, 1, 0))])
# fire on the bonnet for a burning car
def bonnet_fire(V):
    q = V['bonnet'][0]; P = abs_pts(q); c = centre(P); y = max(p[1] for p in P) + 0.02
    o = []
    for i, (dx, dz, h, w) in enumerate(((0, 0, 0.9, 0.3), (0.35, 0.15, 0.6, 0.2), (-0.3, -0.1, 0.7, 0.22), (0.1, 0.35, 0.45, 0.16))):
        o.append(loft([[c[0] + dx, y, c[2] + dz, w, w*0.8], [c[0] + dx*1.1, y + h*0.45, c[2] + dz, w*0.7, w*0.6], [c[0] + dx*1.2, y + h, c[2] + dz, 0, 0]], 'flameX' if i % 2 == 0 else 'flameXR', n=5, glow=True))
        o.append(loft([[c[0] + dx, y, c[2] + dz, w*0.45, w*0.4], [c[0] + dx, y + h*0.5, c[2] + dz, 0, 0]], 'flameXC', n=5, glow=True))
    return o
for nm in CARS:
    M['vehicles'][nm]['damage']['fire'] = bonnet_fire(M['vehicles'][nm])
DMG_RULE += (' The game\'s vehicle health maps to the looks: above 70 whole, 70 to 40 body_bumper_bent with windscreen_cracked, 40 to 15 crumple_light, under 15 crumple_heavy with bonnet_buckled and smoke, '
             'wrecked (0) crumple_heavy, bonnet_buckled and windscreen_missing, burning: add fire (flames standing on the bonnet, glow; flicker them and add a warm light) for a minute, then the <name>_burnt shell.')
# furniture size classes (11.6): how a piece is carried and how much it slows you
FURNITURE_SIZE = {
  'chair': ['small', 6], 'table': ['medium', 20], 'sofa': ['large', 45], 'bed': ['large', 50], 'wardrobe': ['large', 60], 'fridge': ['large', 70], 'stove': ['large', 55],
  'kitchen_counter': ['large', 40], 'bookshelf': ['medium', 30], 'desk': ['medium', 28], 'tv': ['small', 12], 'floor_lamp': ['small', 4], 'toilet': ['medium', 25], 'bathtub': ['large', 70],
  'crate': ['small', 10], 'locker': ['medium', 35], 'pew': ['large', 40], 'shop_shelf': ['medium', 30]}
SIZE_RULE = ('furnitureSize[name] = [class, kg]. small: carried in front by one person at walking speed less 10%; medium: in front, speed less 30%, no running; '
             'large: speed less 50%, no running or jumping, and two survivors carry it at less 25% each (the survivor clip carry_furniture holds all three).')
