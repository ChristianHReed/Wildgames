# Art requests section 11.1 (20 October 2026), exec'd by buildings.py: pieces for the game's torn-open town walls
# (breachApply in play.html), cracked and weakened walls, house numbers, a street name blade and a gun shop front.
#
# Breach coordinates match the game's torn wall: the opening runs along X from -W/2 to W/2, y from 0 to 2.7 (the game's
# h = min(storey, 2.7)), the wall's faces are at z = +0.05 (outside) and z = -0.05 (inside), +Z is outside.
import random, copy
RB = random.Random(111)
PALETTE.update({'mortar': '#b8b0a2', 'glassB': '#7fa4b0', 'alu': '#b8bcc0', 'aluD': '#8e9296', 'plank': '#a8845a', 'plankD': '#86663e', 'nail': '#5a5e62',
                'shadowB': '#2a2624', 'gunMetal': '#2e3034', 'gunWood': '#8a6a46', 'cardG': '#3f6a3a', 'cardR': '#a8322a', 'cardB': '#2e5a7a', 'target': '#e8e0cc', 'targetR': '#b8322a',
                'digit': '#f0ead8', 'plaque': '#2e3a44', 'blade': '#2e6a3e', 'bladeW': '#f0ead8', 'bars': '#2a2b2e', 'steelDoor': '#4a5258'})
HT, ZO, ZI = 2.7, 0.05, -0.05
def tet(pts, c): return solid(pts, [[0, 1, 2], [0, 1, 3], [1, 2, 3], [0, 2, 3]], c)
def bx(x0, y0, z0, x1, y1, z1, c, **k): return box([(x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2], [abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)], c, **k)
def fzq(x0, y0, x1, y1, z, c, s=1): return flat([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], c, (0, 0, s))
def teeth_v(x, y0, y1, inward, c, z0=ZI, z1=ZO, n=5):
    """torn skin along a vertical edge at x: jagged teeth pointing inward (+1 to +X)"""
    o = []; h = (y1 - y0)/n
    for i in range(n):
        a = y0 + i*h; L = RB.uniform(0.05, 0.16)*inward
        o.append(tet([(x, a, z0), (x, a + h, z0), (x, a + h*RB.uniform(0.3, 0.7), z1), (x + L, a + h*RB.uniform(0.2, 0.8), (z0 + z1)/2)], c))
    return o
def teeth_h(x0, x1, y, down, c, z0=ZI, z1=ZO, n=4):
    o = []; w = (x1 - x0)/n
    for i in range(n):
        a = x0 + i*w; L = RB.uniform(0.06, 0.2)*down
        o.append(tet([(a, y, z0), (a + w, y, z0), (a + w*RB.uniform(0.3, 0.7), y, z1), (a + w*RB.uniform(0.2, 0.8), y + L, (z0 + z1)/2)], c))
    return o
def lump(cx, cz, s, c, y=0.0):
    a = RB.uniform(0, 3.14)
    lo = [(cx + s*RB.uniform(0.8, 1.1)*math.cos(a + i*1.5708), y, cz + s*RB.uniform(0.8, 1.1)*math.sin(a + i*1.5708)) for i in range(4)]
    hi = [(cx + 0.55*s*math.cos(a + 0.4 + i*1.5708), y + s*RB.uniform(0.6, 0.9), cz + 0.55*s*math.sin(a + 0.4 + i*1.5708)) for i in range(4)]
    return hull(lo + hi, c)

# ---------- the edges of a torn opening, per wall finish ----------
# Each edge piece sits at the opening's end: 'left' has its origin at x = -W/2 and reaches into the opening (+X), 'right' is the mirror,
# 'top' is 1 m long, centred, for the band across the top: stretch it along X to the gap between the edges.
def edge_left(mat):
    o = []
    if mat == 'siding':
        o += [bx(0, 0, ZI, 0.045, HT, ZO - 0.015, 'stud')]                                   # the end stud, bare
        for y in [0.1 + 0.25*i for i in range(10)]:                                           # board ends sticking out
            L = RB.choice((0.08, 0.16, 0.26, 0.12)); o.append(bx(0.0, y, ZO - 0.015, L, y + 0.2, ZO + 0.004, 'WALL'))
            o.append(tet([(L, y, ZO - 0.015), (L, y + 0.2, ZO - 0.015), (L, y + 0.1, ZO + 0.004), (L + 0.05, y + RB.uniform(0.05, 0.15), ZO - 0.005)], 'stud'))
        o += teeth_v(0.0, 0.0, HT, 1, 'plaster', ZI, ZI + 0.012, 6)
    elif mat == 'brick':
        for i, y in enumerate([0.15*k for k in range(18)]):                                    # toothed brick courses
            L = 0.11 if i % 2 else 0.22
            o.append(bx(0, y, ZI + 0.01, L, y + 0.14, ZO, 'WALL'))
            o.append(fzq(0, y + 0.14, L, y + 0.15, ZO + 0.001, 'mortar'))
        o += [fzq(0, 0, 0.22, HT, ZI + 0.009, 'plaster', -1)] + teeth_v(0.0, 0.0, HT, 1, 'plaster', ZI, ZI + 0.01, 6)
    elif mat == 'metal':
        o += [bx(0, 0, ZI, 0.08, HT, ZI + 0.08, 'steelD' if 'steelD' in PALETTE else 'pipe')]
        o.append(hull([(0.0, 0.3, ZO - 0.01), (0.0, 2.3, ZO - 0.01), (0.0, 2.3, ZO), (0.0, 0.3, ZO), (0.3, 0.6, ZO + 0.25), (0.28, 2.0, ZO + 0.3), (0.28, 2.0, ZO + 0.31), (0.3, 0.6, ZO + 0.26)], 'WALL'))
        o += [bx(0.04, 0, ZO - 0.01, 0.07, HT, ZO + 0.01, 'WALL_D')] + teeth_v(0.0, 0.0, 0.3, 1, 'WALL', ZO - 0.01, ZO, 2)
    else:   # glass curtain: an aluminium mullion with shards still in it
        o += [bx(0, 0, ZI, 0.06, HT, ZO, 'alu'), bx(0.06, 0, -0.01, 0.075, HT, 0.01, 'aluD')]
        o += teeth_v(0.075, 0.1, HT - 0.1, 1, 'glassB', -0.004, 0.004, 7)
    return o
def mirror_x(pcs):
    out = []
    for q in pcs:
        q = dict(q); q['p'] = [-q['p'][0], q['p'][1], q['p'][2]]
        if 'v' in q: q['v'] = [[-v[0], v[1], v[2]] for v in q['v']]
        if 'n' in q: q['n'] = [-q['n'][0], q['n'][1], q['n'][2]]
        out.append(q)
    return out
def top_band(mat, L=1.0):
    """1 m (or L) of torn wall across the top of the opening, from y = 2.25 to 2.7"""
    x0, x1 = -L/2, L/2; o = []
    if mat == 'siding':
        o += [bx(x0, 2.45, ZI, x1, 2.55, ZO - 0.015, 'stud'), bx(x0, 2.55, ZO - 0.015, x1, HT, ZO, 'WALL'), fzq(x0, 2.55, x1, 2.57, ZO + 0.001, 'WALL_D')]
        o += teeth_h(x0, x1, 2.55, -1, 'WALL', ZO - 0.015, ZO, 4) + [bx(x0, 2.55, ZI, x1, HT, ZI + 0.012, 'plaster')] + teeth_h(x0, x1, 2.55, -1, 'plaster', ZI, ZI + 0.012, 3)
    elif mat == 'brick':
        o += [bx(x0, 2.4, ZI, x1, 2.5, ZO, 'pipe'), bx(x0, 2.5, ZI + 0.01, x1, HT, ZO, 'WALL'), fzq(x0, 2.6, x1, 2.61, ZO + 0.001, 'mortar')]
        o += [bx(x, 2.31, ZI + 0.01, x + 0.2, 2.4, ZO, 'WALL') for x in (x0 + 0.05, x0 + 0.55)]
        o += [fzq(x0, 2.5, x1, HT, ZI + 0.009, 'plaster', -1)]
    elif mat == 'metal':
        o += [bx(x0, 2.5, -0.02, x1, 2.62, 0.03, 'pipe'), bx(x0, 2.55, ZO - 0.01, x1, HT, ZO, 'WALL')] + teeth_h(x0, x1, 2.55, -1, 'WALL', ZO - 0.01, ZO, 4)
        o += [bx(x, 2.55, ZO, x + 0.03, HT, ZO + 0.012, 'WALL_D') for x in (x0 + 0.2, x0 + 0.7)]
    else:
        o += [bx(x0, 2.6, ZI, x1, HT, ZO, 'alu')] + teeth_h(x0, x1, 2.6, -1, 'glassB', -0.004, 0.004, 4)
    return o
def stretch_x(pcs, L):
    out = []
    for q in pcs:
        q = copy.deepcopy(q); q['p'][0] *= L
        if 'd' in q: q['d'][0] *= L
        if 'v' in q: q['v'] = [[v[0]*L, v[1], v[2]] for v in q['v']]
        out.append(q)
    return out
def shift(pcs, dx): return [dict(q, p=[R4(q['p'][0] + dx), q['p'][1], q['p'][2]]) for q in pcs]
def hole(mat, W):
    e = 0.25 if mat != 'glass' else 0.08
    return shift(edge_left(mat), -W/2) + shift(mirror_x(edge_left(mat)), W/2) + stretch_x(top_band(mat), W)
def rubble(mat, W):
    cols = {'siding': ['WALL', 'stud', 'plaster', 'rubble'], 'brick': ['WALL', 'WALL_D', 'mortar', 'rubble'], 'metal': ['WALL', 'WALL_D', 'pipe'], 'glass': ['alu', 'rubble']}[mat]
    o = []
    n = int(5*W)
    for i in range(n):
        x = RB.uniform(-W/2 + 0.1, W/2 - 0.1); z = RB.choice((1, -1))*RB.uniform(0.12, 0.7)
        if mat == 'metal' and i % 3 == 0:
            o.append(hull([(x - 0.3, 0.0, z - 0.2), (x + 0.3, 0.0, z - 0.25), (x + 0.3, 0.0, z + 0.2), (x - 0.3, 0.0, z + 0.25), (x - 0.3, 0.015, z - 0.2), (x + 0.3, 0.08, z - 0.25), (x + 0.3, 0.09, z + 0.2), (x - 0.3, 0.015, z + 0.25)], 'WALL'))
        elif mat == 'siding' and i % 2 == 0:
            o.append(box([x, 0.02 + 0.03*(i % 3), z], [RB.uniform(0.5, 1.0), 0.02, 0.2], 'WALL', ry=i % 2))
        elif mat == 'brick' and i % 2 == 0:
            o.append(box([x, 0.04, z], [0.22, 0.075, 0.1], cols[i % 2]))
        else: o.append(lump(x, z, RB.uniform(0.05, 0.12), cols[i % len(cols)]))
    if mat == 'glass':
        o += [flat([(x, 0.006, z), (x + 0.07, 0.006, z + 0.01), (x + 0.02, 0.006, z + 0.08)], 'glassB', (0, 1, 0)) for x, z in [(RB.uniform(-W/2, W/2), RB.uniform(-0.6, 0.8)) for _ in range(int(8*W))]]
    o.append(flat([(-W/2, 0.004, -0.8), (W/2, 0.004, -0.8), (W/2 + 0.1, 0.004, 0.85), (-W/2 - 0.1, 0.004, 0.85)], 'rubble', (0, 1, 0)))
    return o
def boarded(W):
    """planks nailed across the opening on the outside face, with two battens behind"""
    o = [bx(sx*(W/2 - 0.2) - 0.045, 0.0, ZO, sx*(W/2 - 0.2) + 0.045, 2.5, ZO + 0.045, 'plankD') for sx in (1, -1)]
    for i in range(6):
        y = 0.25 + i*0.4; t = RB.uniform(-0.05, 0.05)
        o.append(hull([(-W/2, y - 0.09 - t, ZO + 0.045), (W/2, y - 0.09 + t, ZO + 0.045), (W/2, y - 0.09 + t, ZO + 0.07), (-W/2, y - 0.09 - t, ZO + 0.07),
                       (-W/2, y + 0.09 - t, ZO + 0.045), (W/2, y + 0.09 + t, ZO + 0.045), (W/2, y + 0.09 + t, ZO + 0.07), (-W/2, y + 0.09 - t, ZO + 0.07)], 'plank' if i % 2 else 'plankD'))
        o += [bx(sx*(W/2 - 0.2) - 0.01, y - 0.01 + t*sx, ZO + 0.07, sx*(W/2 - 0.2) + 0.01, y + 0.01 + t*sx, ZO + 0.078, 'nail') for sx in (1, -1)]
    return o
def cracked(mat, W, missing):
    """drawn over a whole wall W long: cracks on both faces; missing adds holes in the skin (bricks out, boards off, a torn flap, a broken pane)"""
    o = []
    for zf, s in ((ZO + 0.004, 1), (ZI - 0.004, -1)):
        for k in range(max(1, int(W/1.2))):
            x = -W/2 + (k + 0.5)*W/max(1, int(W/1.2)) + RB.uniform(-0.2, 0.2); y = RB.uniform(0.6, 1.4)
            pts = [(x, y + 1.0)] + [(x + RB.uniform(-0.15, 0.15), y + 1.0 - j*0.3) for j in range(1, 4)]
            for (ax, ay), (bxx, by) in zip(pts, pts[1:]):
                o.append(flat([(ax - 0.007, ay, zf), (ax + 0.007, ay, zf), (bxx + 0.005, by, zf), (bxx - 0.005, by, zf)], 'crack' if mat != 'glass' else 'glassCold', (0, 0, s)))
    if missing:
        for k in range(max(1, int(W/1.0))):
            x = -W/2 + 0.3 + k*(W - 0.6)/max(1, int(W/1.0)); y = RB.uniform(0.5, 1.8)
            if mat == 'brick':
                o += [fzq(x + dx, y + dy, x + dx + 0.21, y + dy + 0.065, ZO + 0.005, 'shadowB') for dx, dy in ((0, 0), (0.11, 0.075), (0.22, 0.0), (-0.11, -0.075))]
                o += [box([x + RB.uniform(0, 0.3), 0.035, ZO + RB.uniform(0.15, 0.5)], [0.21, 0.065, 0.1], 'WALL', ry=k % 2)]
            elif mat == 'siding':
                o += [fzq(x, y, x + 0.6, y + 0.22, ZO + 0.005, 'shadowB'), bx(x + 0.27, y, ZO - 0.01, x + 0.32, y + 0.22, ZO + 0.006, 'stud')]
                o += [box([x + 0.3, 0.012, ZO + 0.3], [0.6, 0.02, 0.2], 'WALL', ry=k % 2)]
            elif mat == 'metal':
                o += [hull([(x, y, ZO + 0.004), (x + 0.5, y, ZO + 0.004), (x + 0.5, y + 0.002, ZO + 0.004), (x, y + 0.002, ZO + 0.004),
                            (x, y + 0.5, ZO + 0.15), (x + 0.5, y + 0.45, ZO + 0.2), (x + 0.5, y + 0.452, ZO + 0.2), (x, y + 0.502, ZO + 0.15)], 'WALL'),
                      fzq(x, y, x + 0.5, y + 0.45, ZO + 0.003, 'shadowB'), flat([(x - 0.2, y - 0.3, ZO + 0.004), (x + 0.1, y - 0.2, ZO + 0.004), (x - 0.05, y + 0.1, ZO + 0.004)], 'rust' if 'rust' in PALETTE else 'TRIM_D')]
            else:
                o += [flat([(x, y, ZO + 0.005), (x + 0.3, y + 0.05, ZO + 0.005), (x + 0.25, y + 0.35, ZO + 0.005), (x + 0.02, y + 0.3, ZO + 0.005)], 'shadowB')]
    return o
BREACH = {}
for mat in ('siding', 'brick', 'metal', 'glass'):
    D = BREACH[mat] = {'edge_left': edge_left(mat), 'edge_right': mirror_x(edge_left(mat)), 'top': top_band(mat), 'boarded_1m': boarded(1.0)}
    for W in (2.4, 4.0):
        w = '%.1f' % W
        D['hole_' + w] = hole(mat, W); D['rubble_' + w] = rubble(mat, W); D['boarded_' + w] = boarded(W)
        D['cracked_' + w] = cracked(mat, W, False); D['missing_' + w] = cracked(mat, W, True)
BREACH_RULE = ('breach[finish] for a torn-open stretch of town wall, matching breachApply: the opening runs along X from -W/2 to W/2 and up to 2.7 m, '
               'faces at z = +0.05 (outside) and -0.05 (inside). For W = 2.4 or 4.0 use hole_<W>, rubble_<W> and (when the player closes it) boarded_<W>. '
               'For any other length put edge_left at x = -W/2, edge_right at x = +W/2 and top stretched along X to W (it is 1 m long, centred), rubble_2.4 or rubble_4.0 '
               'stretched along X, and boarded_1m stretched to W. Lower walls: scale Y by h/2.7. Before it breaks, draw cracked_<W> (cracks on both faces) and then '
               'missing_<W> (bricks out, boards off, a torn sheet, a broken pane) over the whole wall. Finishes: siding, brick, metal, glass.')

# ---------- house numbers and street name blade ----------
SEG = {0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg'}
def digit(n, w=0.07, h=0.13, t=0.014, z=0.001, c='digit'):
    o = []; x0, x1, y0, ym, y1 = -w/2, w/2, -h/2, 0.0, h/2
    bars = {'a': (x0, y1 - t, x1, y1), 'd': (x0, y0, x1, y0 + t), 'g': (x0, ym - t/2, x1, ym + t/2),
            'f': (x0, ym, x0 + t, y1), 'b': (x1 - t, ym, x1, y1), 'e': (x0, y0, x0 + t, ym), 'c': (x1 - t, y0, x1, ym)}
    for s in SEG[n]:
        a, b, cc, d = bars[s]; o.append(fzq(a, b, cc, d, z, c))
    return o
HOUSE = {'plaque': [box([0, 0, 0.01], [0.4, 0.2, 0.02], 'plaque'), box([0, 0, 0.0205], [0.38, 0.18, 0.001], 'plaque')]}
for n in range(10): HOUSE['digit_%d' % n] = [dict(q, p=[q['p'][0], q['p'][1], 0.0215]) for q in digit(n)]
HOUSE['street_blade'] = [box([0, 0, 0], [0.9, 0.18, 0.02], 'blade'), *[box([0, sy*0.075, 0.0], [0.86, 0.008, 0.022], 'bladeW') for sy in (1, -1)], *[box([sx*0.43, 0, 0.0], [0.008, 0.15, 0.022], 'bladeW') for sx in (1, -1)]]
HOUSE_RULE = ('house.plaque is 0.4 by 0.2 m, its back at z = 0, hung beside the door at about 1.8 m; put up to three digit_<n> on it at x = -0.1, 0, +0.1 '
              '(each digit is 0.07 by 0.13, centred on its origin, z already in front of the plaque). The digits also work painted straight on a wall or a kerb. '
              'house.street_blade is 0.9 by 0.18, both faces green with a white border; put two at right angles on top of props.street.street_name_post and draw the road name '
              'on each face in white (the text area is 0.8 by 0.12).')

# ---------- gun shop front (a bay module) ----------
def gunshop_front():
    o = finish(X0, X1, 0, 0.5, 'brick') + finish(X0, X1, 2.35, SH - 0.25, 'brick') + finish(X0, -0.95, 0.5, 2.35, 'brick') + finish(0.15, 0.3, 0.5, 2.35, 'brick')
    o += [box([-0.4, 1.4, IZ - 0.03], [1.1, 1.8, 0.03], 'glass'), box([-0.4, 0.46, IZ + 0.06], [1.2, 0.08, 0.14], 'TRIM')]
    o += [box([-0.4 + i*0.12 - 0.48, 1.4, IZ + 0.05], [0.025, 1.8, 0.025], 'bars') for i in range(9)] + [box([-0.4, y, IZ + 0.05], [1.1, 0.025, 0.025], 'bars') for y in (0.7, 1.4, 2.1)]
    o += [box([0.75, 1.1, IZ], [0.9, 2.2, 0.06], 'steelDoor'), box([0.45, 1.05, IZ + 0.04], [0.04, 0.12, 0.04], 'knob'), box([0.75, 2.3, IZ + 0.05], [1.0, 0.1, 0.08], 'TRIM')]
    # the sign board over the front: a dark board with a target and a rifle silhouette
    o += [box([0, 2.62, IZ + 0.14], [2.1, 0.42, 0.06], 'sign'), loft([[-0.7, 2.62, IZ + 0.172, 0.15, 0.15], [-0.7, 2.62, IZ + 0.174, 0.15, 0.15]], 'target', ax='z', n=10),
          loft([[-0.7, 2.62, IZ + 0.175, 0.1, 0.1], [-0.7, 2.62, IZ + 0.177, 0.1, 0.1]], 'targetR', ax='z', n=10), loft([[-0.7, 2.62, IZ + 0.178, 0.045, 0.045], [-0.7, 2.62, IZ + 0.18, 0.045, 0.045]], 'target', ax='z', n=8),
          flat([(-0.35, 2.58, IZ + 0.172), (0.0, 2.6, IZ + 0.172), (0.0, 2.66, IZ + 0.172), (-0.35, 2.68, IZ + 0.172)], 'target'), flat([(0.0, 2.615, IZ + 0.172), (0.75, 2.615, IZ + 0.172), (0.75, 2.64, IZ + 0.172), (0.0, 2.64, IZ + 0.172)], 'target'),
          flat([(0.1, 2.56, IZ + 0.172), (0.16, 2.56, IZ + 0.172), (0.14, 2.6, IZ + 0.172), (0.1, 2.6, IZ + 0.172)], 'target')]
    return o
MODULES['gunshop_front'] = gunshop_front()
