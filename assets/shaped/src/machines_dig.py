# ===================== digging and hauling (version 2, 26 October 2026) =====================
# exec'd from machines.py after the machines are built. Adds: a mini excavator and a wheel loader, soil loads for buckets and truck beds, spoil heaps,
# and the `dig` table the game uses to make machines work the ground (reach, depth, bucket sizes, solved poses, cycles).
def _sc(q, f):
    q = dict(q); q['p'] = [R4(v*f) for v in q['p']]
    if 'd' in q: q['d'] = [R4(v*f) for v in q['d']]
    if 'v' in q: q['v'] = [[R4(v*f) for v in w] for w in q['v']]
    if 'r' in q: q['r'] = [[R4(r[0]*f), R4(r[1]*f), R4(r[2]*f), R4(r[3]*f), R4(r[4]*f)] + [(([R4(v*f) for v in e] if (i == 1 and e is not None) else e)) for i, e in enumerate(r[5:])] for r in q['r']]
    return q
def _fx(name, f, pivot):
    return [round(v*f, 4) for v in pivot]

# ---------- the big digger's arm is lengthened (x1.4 about the boom foot) so it can really dig: reach about 9 m, depth about 4 m ----------
def _scx(q, f, o):
    q2 = _sc(q, f); q2['p'] = [R4(f*a + (1 - f)*c) for a, c in zip(q['p'], o)]; return q2
def _shift(q, d):
    q = dict(q); q['p'] = [R4(a + c) for a, c in zip(q['p'], d)]; return q
_bf = RIG['excavator']['boom']['pivot']; _k = 1.4
_ost = list(RIG['excavator']['bucket']['pivot'])
_nbt = [R4(f_) for f_ in [_bf[0] + _k*(RIG['excavator']['stick']['pivot'][0] - _bf[0]), _bf[1] + _k*(RIG['excavator']['stick']['pivot'][1] - _bf[1]), _bf[2] + _k*(RIG['excavator']['stick']['pivot'][2] - _bf[2])]]
_nst = [R4(_bf[0] + _k*(_ost[0] - _bf[0])), R4(_bf[1] + _k*(_ost[1] - _bf[1])), R4(_bf[2] + _k*(_ost[2] - _bf[2]))]
M['excavator']['boom'] = [_scx(q, _k, _bf) for q in M['excavator']['boom']]
M['excavator']['stick'] = [_scx(q, _k, _bf) for q in M['excavator']['stick']]
M['excavator']['bucket'] = [_shift(q, [a - c for a, c in zip(_nst, _ost)]) for q in M['excavator']['bucket']]
RIG['excavator']['stick']['pivot'] = _nbt; RIG['excavator']['bucket']['pivot'] = _nst
RIG['excavator']['boom']['range'] = [-55, 35]

# ---------- mini excavator: the 20 t digger at half size, with a dozer blade ----------
def mini_excavator():
    f = 0.5; P = {k: [_sc(q, f) for q in v] for k, v in M['excavator'].items()}
    P['tracks'] = [dict(q, p=[q['p'][0] + (0.0 if abs(q['p'][0]) < 1e-6 else 0), q['p'][1], q['p'][2]]) for q in P['tracks']]
    P['blade'] = [b(-0.7, 0.02, 1.12, 0.7, 0.42, 1.24, 'BODY'), b(-0.7, 0.0, 1.24, 0.7, 0.07, 1.34, 'steelL'), *[seg([sx*0.5, 0.35, 0.6], [sx*0.5, 0.25, 1.12], 0.04, 0.05, 0.04, 0.05, 'steelD') for sx in (1, -1)]]
    rig = {}
    for k, r in RIG['excavator'].items():
        r = dict(r); r['pivot'] = _fx('', f, r['pivot']); rig[k] = r
    rig['blade'] = {'parent': 'tracks', 'pivot': [0, 0.3, 0.6], 'turn': [-1, 0, 0], 'range': [-20, 25], 'rest': 0, 'note': 'positive raises the dozer blade; lower it to level and to steady the machine while digging'}
    clips = {'dig': [dict(c) for c in CLIPS['excavator']['dig']], 'park': [dict(c) for c in CLIPS['excavator']['park']]}
    machine('mini_excavator', P, rig, clips=clips, beacon='house', note='A 1.8 t compact digger (the big digger at half size) with a dozer blade: fits through a gate, digs 2.2 m deep, a good first machine for trenches and graves.')
mini_excavator()

# ---------- wheel loader: lift arm and bucket on a rigid frame ----------
def wheel_loader():
    P = {}; r = 0.8
    wz = [1.7, -1.3]; wx = 1.05
    body = [b(-0.9, 0.8, -2.9, 0.9, 1.5, 2.5, 'BODY'), b(-1.0, 1.5, -2.9, 1.0, 2.2, -0.9, 'BODY'), flat([(-0.7, 1.6, -2.903), (0.7, 1.6, -2.903), (0.7, 2.1, -2.903), (-0.7, 2.1, -2.903)], 'grille'),
            b(-1.0, 0.9, -3.15, 1.0, 2.05, -2.9, 'steelD'), *tails(0.9, 1.1, -3.15), b(-0.4, 2.2, -2.5, -0.25, 2.8, -2.35, 'black'),
            *cab(0.9, -0.9, 0.95, 1.5, 3.35, grille=False), b(-1.05, 3.35, -1.0, 1.05, 3.42, 1.0, 'steelD'), *beacons([0.0], 3.42, -0.5),
            b(-0.5, 1.5, 0.9, 0.5, 1.9, 1.9, 'BODY'), b(-0.6, 0.8, 2.5, 0.6, 1.2, 2.9, 'steelD'), *[b(sx*0.5 - 0.05, 1.3, 1.5, sx*0.5 + 0.05, 1.9, 2.1, 'steelD') for sx in (1, -1)]]
    for z in wz:   # fenders over the wheels, tied to the body by a stay
        body += [b(sx*(wx - 0.3) if sx > 0 else -(wx + 0.3), 1.72, z - 0.95, (wx + 0.3) if sx > 0 else -(wx - 0.3), 1.8, z + 0.95, 'BODY') for sx in (1, -1)]
        body += [b(sx*0.9 - 0.05, 1.3, z - 0.1, sx*0.9 + 0.05, 1.8, z + 0.1, 'steelD') if False else b(min(sx*0.85, sx*1.2), 1.5, z - 0.1, max(sx*0.85, sx*1.2), 1.8, z + 0.1, 'steelD') for sx in (1, -1)]
        body += [b(-wx - 0.05, r - 0.08, z - 0.08, wx + 0.05, r + 0.08, z + 0.08, 'steelD')]
    P['body'] = body
    pa = [0, 1.5, 1.9]; pb = [0, 0.6, 4.0]
    P['arm'] = [*[seg([sx*0.78, 1.5, 1.9], [sx*0.78, 0.6, 4.0], 0.1, 0.16, 0.1, 0.14, 'BODY') for sx in (1, -1)], b(-0.8, 0.5, 3.9, 0.8, 0.7, 4.05, 'steelD'), b(-0.8, 1.3, 2.1, 0.8, 1.5, 2.3, 'BODY')] + ram([0.5, 1.9, 1.5], [0.5, 1.6, 2.9], 0.08) + ram([-0.5, 1.9, 1.5], [-0.5, 1.6, 2.9], 0.08)
    P['bucket'] = [hull([(-1.35, 0.04, 3.95), (1.35, 0.04, 3.95), (1.35, 0.04, 5.35), (-1.35, 0.04, 5.35), (-1.35, 1.05, 3.9), (1.35, 1.05, 3.9), (1.35, 0.55, 5.1), (-1.35, 0.55, 5.1)], 'steelD'),
                   b(-1.37, 0.03, 4.0, -1.3, 1.0, 5.2, 'steelD'), b(1.3, 0.03, 4.0, 1.37, 1.0, 5.2, 'steelD'), b(-1.35, 0.0, 5.3, 1.35, 0.1, 5.5, 'bucketTeeth'),
                   *[tip([x, 0.02, 5.5], [x, 0.0, 5.7], 0.05, 0.04, 'bucketTeeth') for x in (-1.1, -0.55, 0.0, 0.55, 1.1)]] + ram([0, 1.4, 3.0], [0, 0.8, 4.0], 0.08)
    rig = {'body': {'pivot': [0, 0, 0], 'note': 'wheels turn; the front pair steers'},
           'arm': {'parent': 'body', 'pivot': pa, 'turn': [-1, 0, 0], 'range': [-8, 55], 'rest': 0, 'note': 'positive lifts the arm; at 0 the bucket sits on the ground'},
           'bucket': {'parent': 'arm', 'pivot': pb, 'turn': [1, 0, 0], 'range': [-50, 55], 'rest': 0, 'note': 'positive tips the bucket back (carry position, scoops); negative dumps'}}
    clips = {'scoop': [{'t': 0, 'arm': 0, 'bucket': -10}, {'t': 1.0, 'arm': 0, 'bucket': -10}, {'t': 1.8, 'arm': 0, 'bucket': 40}, {'t': 2.6, 'arm': 8, 'bucket': 45}],
             'carry': [{'t': 0, 'arm': 10, 'bucket': 45}], 'dump': [{'t': 0, 'arm': 10, 'bucket': 45}, {'t': 1.2, 'arm': 45, 'bucket': 45}, {'t': 2.2, 'arm': 45, 'bucket': -45}, {'t': 3.4, 'arm': 45, 'bucket': -45}, {'t': 4.4, 'arm': 10, 'bucket': 45}]}
    machine('wheel_loader', P, rig, [[sx*wx, r, z] for z in wz for sx in (1, -1)], r, 0.55, steer=[0, 1], clips=clips, beacon='body',
            note='A 3.2 m3 wheel loader. scoop drives the bucket into a pile and tips it back; carry holds the load low; dump lifts it over a truck and tips it out.')
    SPEC['wheel_loader'].update(width=2.8, length=8.5, wheelR=r, wheelW=0.55, axles=wz, track=wx - 0.15, archClear=0.14, ground=0.0, roof={'y': 3.42, 'z': 0.0, 'w': 1.8, 'd': 1.9}, nose=2.9, tail=-3.15, bumperY=1.0, rearY=1.0, frameTop=1.5, cabBack=-0.9, cabFront=0.9)
wheel_loader()
PAINT['mini_excavator'] = '#e0aa28'; PAINT['wheel_loader'] = '#e0aa28'
SPEC['mini_excavator'].update(width=1.5, length=2.5, ground=0.0, roof={'y': 1.13, 'z': -0.72, 'w': 1.15, 'd': 0.45}, tracked=True)

# ---------- soil loads ----------
PALETTE.update({'soil': '#5e4632', 'soilD': '#463424', 'clay': '#9a6a44', 'rubble': '#8a8680', 'rubbleD': '#6a6660'})
def heap(x0, x1, z0, z1, y0, ytop, col='soil', ins=0.25, rear=0.0):
    """a rounded mound: wide at the foot, narrower and humped on top"""
    cx, cz = (x0 + x1)/2, (z0 + z1)/2
    lo = [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)]
    hi = [(x0 + ins*(x1 - x0)*0.5, ytop*0.92, z0 + ins*(z1 - z0)*0.4), (x1 - ins*(x1 - x0)*0.6, ytop, z0 + ins*(z1 - z0)*0.5), (x1 - ins*(x1 - x0)*0.5, ytop*0.88, z1 - ins*(z1 - z0)*0.5), (x0 + ins*(x1 - x0)*0.6, ytop*0.96, z1 - ins*(z1 - z0)*0.4)]
    return [hull(lo + hi, col), box([cx + (x1 - x0)*0.12, ytop*0.97, cz], [(x1 - x0)*0.22, 0.05 + (ytop - y0)*0.12, (z1 - z0)*0.2], 'soilD')]
_sh = [a - c for a, c in zip(_nst, _ost)]
M['excavator']['bucket_load'] = [_shift(q, _sh) for q in heap(-0.5, 0.2, 5.3, 5.9, 1.55, 1.95, ins=0.3)]
RIG['excavator']['bucket_load'] = {'parent': 'bucket', 'pivot': RIG['excavator']['bucket']['pivot'], 'note': 'soil heaped in the bucket: show it from the scoop until the dump, hide it after'}
M['mini_excavator']['bucket_load'] = [_sc(q, 0.5) for q in M['excavator']['bucket_load']]
RIG['mini_excavator']['bucket_load'] = {'parent': 'bucket', 'pivot': RIG['mini_excavator']['bucket']['pivot'], 'note': 'soil in the bucket'}
M['wheel_loader']['bucket_load'] = heap(-1.25, 1.25, 4.05, 5.2, 0.6, 1.5, ins=0.35)
RIG['wheel_loader']['bucket_load'] = {'parent': 'bucket', 'pivot': RIG['wheel_loader']['bucket']['pivot'], 'note': 'a heaped bucket: show it from the scoop until the dump'}
M['dump_truck']['load_half'] = heap(-1.15, 1.15, -3.45, 1.55, 1.4, 2.05, ins=0.25)
M['dump_truck']['load_full'] = heap(-1.15, 1.15, -3.45, 1.55, 1.4, 2.75, ins=0.2)
for k, n in (('load_half', 'half full: show for 1 to 56 blocks of 112'), ('load_full', 'full: show above that')):
    RIG['dump_truck'][k] = {'parent': 'bed', 'pivot': RIG['dump_truck']['bed']['pivot'], 'note': 'a heap of soil in the bed, ' + n + '; it tips with the bed: hide it once the bed passes 30 degrees and the load has slid out'}
M['bulldozer']['push_pile'] = heap(-1.2, 1.2, 2.5, 3.5, 0.0, 1.05, ins=0.3)
M['bulldozer']['push_pile_small'] = heap(-1.0, 1.0, 2.5, 3.1, 0.0, 0.55, ins=0.3)
for k in ('push_pile', 'push_pile_small'):
    RIG['bulldozer'][k] = {'parent': 'blade', 'pivot': RIG['bulldozer']['blade']['pivot'], 'note': 'soil rolling ahead of the blade: show small, then large as the push gets longer'}
# standalone spoil heaps (pile beside a hole) and a rubble heap
for nm, (w, d, h) in {'spoil_heap_s': (1.6, 1.4, 0.55), 'spoil_heap_m': (2.6, 2.2, 0.9), 'spoil_heap_l': (4.2, 3.4, 1.4)}.items():
    P = {'body': heap(-w/2, w/2, -d/2, d/2, 0.0, h, ins=0.35) + [box([-w*0.25, h*0.35, d*0.3], [w*0.25, h*0.5, d*0.2], 'clay'), box([w*0.3, h*0.3, -d*0.3], [w*0.22, h*0.45, d*0.18], 'soilD')]}
    M[nm] = P; RIG[nm] = {'body': {'pivot': [0, 0, 0]}}; CLIPS[nm] = {}; NOTE[nm] = 'Loose soil from a hole, %.1f by %.1f m and %.1f m high. Pick the size by how many blocks were dug (S under 20, M under 80, L above). Place it a metre from the edge of the hole.' % (w, d, h); STEER[nm] = []; SPEC[nm] = {'width': w, 'length': d}
M['rubble_heap'] = {'body': [hull([(-1.4, 0, -1.2), (1.4, 0, -1.2), (1.4, 0, 1.2), (-1.4, 0, 1.2), (-0.8, 0.8, -0.7), (0.9, 0.9, -0.6), (0.7, 0.7, 0.8), (-0.9, 0.85, 0.7)], 'rubble'),
                    box([-0.4, 0.95, 0.0], [0.5, 0.3, 0.45], 'rubbleD'), box([0.6, 0.8, 0.3], [0.4, 0.4, 0.3], 'rubble'), box([0.0, 0.5, 1.0], [0.7, 0.3, 0.3], 'rubbleD'), box([-1.0, 0.25, 0.6], [0.5, 0.3, 0.4], 'rubble')]}
RIG['rubble_heap'] = {'body': {'pivot': [0, 0, 0]}}; CLIPS['rubble_heap'] = {}; NOTE['rubble_heap'] = 'A heap of broken concrete: what a machine leaves from breaking a wall or a slab. 2.8 by 2.4 m, 1 m high.'; STEER['rubble_heap'] = []; SPEC['rubble_heap'] = {'width': 2.8, 'length': 2.4}
for nm in ('spoil_heap_s', 'spoil_heap_m', 'spoil_heap_l', 'rubble_heap'): PAINT[nm] = '#5e4632'

# ---------- the dig table: kinematics, reach and solved poses ----------
def _rot(pt, piv, th):
    c, s = math.cos(th), math.sin(th); y, z = pt[0] - piv[0], pt[1] - piv[1]
    return (piv[0] + y*c - z*s, piv[1] + y*s + z*c)
def tip_of(name, chain, tipp, vals):
    """tip position (y, z) in machine space for part values vals, chain from the tool part inwards (e.g. ['bucket', 'stick', 'boom'])"""
    pt = (tipp[1], tipp[2])
    for part in chain:
        r = RIG[name][part]; th = math.radians(vals.get(part, 0))*r['turn'][0]
        pt = _rot(pt, (r['pivot'][1], r['pivot'][2]), th)
    return pt
def solve(name, chain, tipp, ty, tz, angle, rest_angle):
    """find part values putting the tool tip at (ty, tz) with the tool's tip direction at `angle` degrees below horizontal (negative: up); returns (values, error)"""
    a, bk, st = chain[0], chain[2], chain[1]; best = None
    ra, rb, rc = RIG[name][a]['range'], RIG[name][st]['range'], RIG[name][bk]['range']
    for bo in range(int(rc[0]), int(rc[1]) + 1, 1):
        for sk in range(int(rb[0]), int(rb[1]) + 1, 2):
            # world angle of the tool direction = rest_angle + boom - stick - bucket (see rule)
            bu = rest_angle + bo*(-RIG[name][bk]['turn'][0]) - sk*RIG[name][st]['turn'][0] + angle
            bu = max(ra[0], min(ra[1], bu))
            p = tip_of(name, chain, tipp, {a: bu, st: sk, bk: bo})
            e = math.hypot(p[0] - ty, p[1] - tz)
            if best is None or e < best[0]: best = (e, {bk: bo, st: sk, a: round(bu, 1)})
    return best[1], round(best[0], 3)
def dig_digger(name, tipp, bucket_w, vol, house_y):
    ch = ['bucket', 'stick', 'boom']
    rest = math.degrees(math.atan2(tipp[1] - RIG[name]['bucket']['pivot'][1], tipp[2] - RIG[name]['bucket']['pivot'][2]))
    # envelope
    ys, zs = [], []
    for bo in range(RIG[name]['boom']['range'][0], RIG[name]['boom']['range'][1] + 1, 5):
        for sk in range(RIG[name]['stick']['range'][0], RIG[name]['stick']['range'][1] + 1, 5):
            for bu in (RIG[name]['bucket']['range'][0], 0, 40, RIG[name]['bucket']['range'][1]):
                p = tip_of(name, ch, tipp, {'boom': bo, 'stick': sk, 'bucket': bu}); ys.append(p[0]); zs.append(p[1])
    maxdepth = -min(ys); maxreach_ground = 0.0
    for bo in range(RIG[name]['boom']['range'][0], RIG[name]['boom']['range'][1] + 1, 2):
        for sk in range(RIG[name]['stick']['range'][0], RIG[name]['stick']['range'][1] + 1, 2):
            p = tip_of(name, ch, tipp, {'boom': bo, 'stick': sk, 'bucket': 0})
    # reach at ground level: the farthest d with a solution at depth 0 (error under 0.15)
    poses = {}; dmin = round(min(RIG[name]['house']['pivot'][2] + 1.0, 1.0), 1)
    d = 1.5*(tipp[2] / 6.15)*1.0
    step = 0.5 if tipp[2] > 4 else 0.25
    ds = [round(d + i*step, 2) for i in range(0, int((max(zs) - d)/step) + 1)]
    reach_ground = 0
    for dd in ds:
        for dep in [round(i*step, 2) for i in range(0, int(maxdepth/step) + 1)]:
            v, e = solve(name, ch, tipp, -dep, dd, 48, rest)
            if e <= 0.12:
                poses['%g,%g' % (dd, dep)] = [v['boom'], v['stick'], v['bucket']]
                if dep == 0: reach_ground = max(reach_ground, dd)
    maxdepth_ok = max([float(k.split(',')[1]) for k in poses] or [0])
    dumps = {}
    for dd in ds:
        for hh in [round(1.5 + i*0.5, 1) for i in range(0, 6)]:
            v, e = solve(name, ch, tipp, hh, dd, -5, rest)
            if e <= 0.12: dumps['%g,%g' % (dd, hh)] = [v['boom'], v['stick'], v['bucket']]
    return {'role': 'dig', 'tool': 'bucket', 'tip': tipp, 'axis': 'house', 'slew': 180, 'bucketWidth': bucket_w, 'scoopM3': vol, 'scoopBlocks': max(1, round(vol/0.125)),
            'maxDepth': round(maxdepth_ok, 1), 'maxReach': round(reach_ground, 1), 'maxDumpHeight': max([float(k.split(',')[1]) for k in dumps] or [0]), 'poseStep': step,
            'poses': poses, 'dumpPoses': dumps, 'bucketLoad': 'bucket_load', 'cycle': [['plunge', 1.0], ['scoop', 1.2], ['lift', 1.0], ['swing', 1.2], ['dump', 0.8], ['return', 1.6]],
            'dumpsTo': ['spoil_heap_s', 'spoil_heap_m', 'spoil_heap_l', 'dump_truck', 'wheel_loader'], 'drive': 'tracked', 'fuelPerMinute': 0.4 if vol > 0.3 else 0.15}
DIG = {}
_tip = [-0.15, 0.85 + _sh[1], 6.15 + _sh[2]]
DIG['excavator'] = dig_digger('excavator', _tip, 0.8, 0.5, 0.95)
DIG['mini_excavator'] = dig_digger('mini_excavator', [round(v*0.5, 4) for v in _tip], 0.4, 0.1, 0.475)
def _near(tab, d, h, step):
    best = None
    for k, v in tab.items():
        kd, kh = [float(x) for x in k.split(',')]
        e = abs(kd - d) + abs(kh - h)
        if best is None or e < best[0]: best = (e, v)
    return best[1]
def _dig_clip(name):
    D = DIG[name]; st = D['poseStep']; rng = RIG[name]['bucket']['range']
    d = round(D['maxReach']*0.72/st)*st; deep = min(D['maxDepth'], 1.0 if name == 'excavator' else 0.5)
    rd = _near(D['dumpPoses'], d, 1.5, st); p0 = _near(D['poses'], d, 0.0, st); p1 = _near(D['poses'], d, deep, st); lf = _near(D['dumpPoses'], d - 1.0, 2.0, st); dp = _near(D['dumpPoses'], d - 1.0, 2.0, st)
    def fr(t, p, **k): o = {'t': t, 'boom': p[0], 'stick': p[1], 'bucket': p[2]}; o.update(k); return o
    clip = [fr(0, rd, house=0), fr(1.0, p0), fr(2.0, p1), fr(3.0, (p1[0], min(RIG[name]['stick']['range'][1], p1[1] + 25), rng[1])),
            fr(4.0, (lf[0], lf[1], rng[1]), house=0), fr(5.4, (lf[0], lf[1], rng[1]), house=90), fr(6.2, dp, house=90), fr(7.8, rd, house=0)]
    CLIPS[name]['dig'] = clip
    D['cycleSeconds'] = 7.8; D['digHoleAt'] = {'d': d, 'depth': deep, 'note': 'the dig clip works a hole d metres out and a metre deep; for another hole use poses[d,depth] and the same steps'}
_dig_clip('excavator'); _dig_clip('mini_excavator')
NOTE['excavator'] = 'A 20 t tracked digger with a long arm (reach 10 m, depth 4 m, bucket 0.5 m3). dig loops (plunge, scoop, lift, swing 90 degrees, dump, return) for a hole about 7 m out and a metre deep; for any other hole use dig.excavator.poses. smash knocks into a wall (its bucket breaks cells), park folds it down. bucket_load is the soil in the bucket.'
CLIPS['excavator']['smash'] = [{'t': 0, 'boom': 15, 'stick': 10, 'bucket': 40}, {'t': 0.6, 'boom': -25, 'stick': 40, 'bucket': 40}, {'t': 1.5, 'boom': 15, 'stick': 10, 'bucket': 40}]
CLIPS['excavator']['park'] = [{'t': 0, 'boom': -45, 'stick': 55, 'bucket': 55, 'house': 0}]
CLIPS['mini_excavator'] = {'dig': CLIPS['mini_excavator']['dig'], 'park': CLIPS['excavator']['park']}
DIG['wheel_loader'] = {'role': 'scoop', 'tool': 'bucket', 'bucketWidth': 2.7, 'scoopM3': 3.2, 'scoopBlocks': 26, 'edge': [0, 0.02, 5.5], 'digDepth': 0.5, 'note': 'a loader scrapes the top block of loose ground and lifts loose heaps; it cannot dig deep. Pile to bucket: drive the bucket edge into a heap (bucket -10), tip back (+40), lift (arm 8 to 45), drive to the truck, dump (bucket -45).',
                       'loadFrom': ['spoil_heap_s', 'spoil_heap_m', 'spoil_heap_l', 'rubble_heap'], 'dumpsTo': ['dump_truck'], 'dumpHeight': 3.4, 'bucketLoad': 'bucket_load', 'drive': 'wheeled', 'fuelPerMinute': 0.5}
DIG['bulldozer'] = {'role': 'push', 'tool': 'blade', 'bladeWidth': 2.7, 'edge': [0, 0.02, 2.5], 'cutDepth': 0.5, 'pushBlocksPerMetre': 3, 'maxPile': 'push_pile', 'note': 'lower the blade (-4) and drive: it cuts up to one block deep and drags the soil ahead (3 blocks per metre of blade travel, up to 24 blocks in front); raise the blade (12) to leave the pile. A bulldozer can fill a hole by pushing a heap into it and level a mound. The ripper (25) breaks rock and limestone, so hard layers can be dug afterwards.',
                       'ripper': {'breaks': ['limestone', 'chert', 'concrete slab'], 'depth': 0.8}, 'drive': 'tracked', 'fuelPerMinute': 0.5}
DIG['dump_truck'] = {'role': 'haul', 'capacityBlocks': 112, 'capacityM3': 14, 'loadModels': ['load_half', 'load_full'], 'loadAt': [0, 2.0, -0.9], 'loadedFrom': ['excavator', 'mini_excavator', 'wheel_loader'], 'tip': {'part': 'bed', 'angle': 52, 'unloadAbove': 30, 'seconds': 3.0},
                     'note': 'the excavator swings to the bed (dump pose at height 2.8 to 3.2 m) and drops each bucket in; the loader dumps from 3.4 m. Tipping sends the blocks to a spoil heap behind the truck (size by blocks). Each loaded 14 m3 slows the truck by a quarter.', 'fuelPerMinute': 0.6}
DIG['cement_mixer'] = {'role': 'pour', 'capacityM3': 6, 'chute': 'chute', 'note': 'pour fills the columns under the chute with concrete (slow, hardens in the game\'s time); concrete cannot be dug with a shovel, only broken with the excavator bucket (smash) or ripped.', 'fuelPerMinute': 0.4}
DIG['road_roller'] = {'role': 'compact', 'drum': 'drum', 'width': 1.8, 'note': 'rolling over filled ground firms it: filled columns stop settling and are safe to build on; run it twice for a road base.', 'fuelPerMinute': 0.3}
DIG['forklift'] = {'role': 'carry', 'note': 'carries pallets (bagged cement, sand, crates) to the site; cannot move soil.'}
DIG_RULE = ('Soil is in blocks 0.5 m square and 0.5 m deep (0.125 m3). A tracked digger works from its position: swing the house to the hole; for a hole at distance d (m from the house axis) and depth z (m below the ground), '
            'read dig[name].poses["d,z"] = [boom, stick, bucket] (d in steps of poseStep, nearest wins) and ease the rig into it; the bucket then drives the blades in (`plunge`), curls (`scoop`: bucket +40 to +50), lifts, swings (`house` +/-90) and dumps '
            '(dumpPoses["d,height"] over a truck, or a spoil heap at height 1.5). Each scoop removes scoopBlocks blocks, taken from the columns under the teeth, top block first. Show the part `bucket_load` between scoop and dump. '
            'Walls and slabs are broken by `smash`. The loader, bulldozer, truck, mixer and roller use the role fields above. world rule used for the solver: tool direction angle = rest + boom - stick - bucket, rest = the angle of the line from the bucket pivot to the teeth at rest.')
