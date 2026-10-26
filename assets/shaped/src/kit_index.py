"""Vehicle index for the kit: for every car, truck, machine, bike and boat, its wheels, paint slots and mounts (named places parts bolt to)."""
import json, os, subprocess
from kitreg import META
HERE = os.path.dirname(os.path.abspath(__file__))
def bounds(name): return json.loads(subprocess.run(['node', os.path.join(HERE, 'bounds.js'), name], capture_output=True, text=True, check=True).stdout)
def load(pack):
    js = open(os.path.join(HERE, '..', pack + '.js')).read()
    return json.loads(subprocess.run(['node', '-e', "global.window={};require(%s);process.stdout.write(JSON.stringify(window.SHAPED[%s]))" % (json.dumps(os.path.join(HERE, '..', pack + '.js')), json.dumps(pack))], capture_output=True, text=True, check=True).stdout)
def r3(v): return round(v, 3)
STOCK = {'hatchback': ('road', 'steel'), 'sedan': ('road', 'steel'), 'wagon': ('road', 'steel'), 'suv': ('all_terrain', 'alloy5'), 'offroader': ('mud_terrain', 'beadlock'),
         'pickup': ('all_terrain', 'steel'), 'crew_pickup': ('all_terrain', 'steel'), 'flatbed': ('heavy', 'steel'), 'van': ('road', 'steel'), 'box_truck': ('heavy', 'steel')}
def wheel_points(spec):
    t = spec['track']; return [[sx*t, spec['wheelR'], z] for z in spec['axles'] for sx in (1, -1)]
def car_mounts(s, machine=False):
    W, L, r = s['width'], s['length'], s['wheelR']; ro = s['roof']; nose, tail = s['nose'], s['tail']; by = s['bumperY']
    M = {}
    M['roof'] = {'pos': [0, ro['y'], ro['z']], 'w': ro['w'] + 0.1, 'd': ro['d'] + 0.3, 'group': 'body'}
    M['roof_decal'] = {'pos': [0, ro['y'], ro['z']], 'w': ro['w'], 'd': ro['d'] + 0.3, 'group': 'body'}
    M['front'] = {'pos': [0, by, nose], 'w': W + 0.35, 'd': 0, 'group': 'body'}
    M['rear'] = {'pos': [0, by, tail], 'w': W + 0.35, 'd': 0, 'group': 'body'}
    gf = s.get('glassFront')
    if not machine and gf is not None:
        hy = s.get('hood', 0.9) if isinstance(s.get('hood'), (int, float)) and s.get('hood') != 1 else s.get('hood', 1.0)
        hd = nose - gf - 0.5
        M['hood'] = {'pos': [0, hy, (nose + gf)/2 - 0.1], 'w': W*0.6, 'd': hd, 'group': 'bonnet'}
        M['pillar'] = {'pos': [W/2 - 0.1, hy, gf + 0.1], 'w': 0.2, 'd': 0.2, 'hMax': ro['y'] - hy + 0.3, 'group': 'body'}
    cabLen = (abs((gf if gf is not None else s.get('cabFront', 0)) - s.get('cabBack', -0.9))) if not machine else (s.get('cabFront', nose - 0.5) - s.get('cabBack', 0))
    sill = round(2*r*0.8, 3)
    zc = ((gf if gf is not None else 0) + s.get('cabBack', -0.9))/2 if not machine else (s.get('cabFront', nose - 0.5) + s.get('cabBack', 0))/2
    M['side'] = {'pos': [W/2, sill, zc], 'w': 0.4, 'd': min(cabLen + 1.0, L*0.5), 'mirror': True, 'group': 'body'}
    M['decal_side'] = {'pos': [W/2, ro['y']*0.55, zc], 'w': 0.1, 'd': 5, 'mirror': True, 'group': 'body'}
    wp = wheel_points(s)
    M['arch'] = {'points': [[sx*W/2, r, z] for z in s['axles'] for sx in (1, -1)], 'mirror': True, 'rCap': round(r*1.6, 3), 'group': 'body'}
    M['flap'] = {'points': [[sx*(W/2 - 0.02), 0.08, s['axles'][-1] - r - 0.12] for sx in (1, -1)], 'mirror': True, 'group': 'body'}
    if 'bed' in s:
        b = s['bed']; M['bed'] = {'pos': [0, b['y'], b['z']], 'w': b['w'], 'd': b['d'], 'group': 'bed'}
    if machine or 'bed' in s:
        cb = s.get('cabBack', -0.6)
        M['cab_back'] = {'pos': [0, s.get('frameTop', s.get('bed', {}).get('y', 0.7)), cb], 'w': W, 'd': 0.3, 'group': 'body'}
        fy = s.get('frameTop', 0.6)
        M['chassis_side'] = {'pos': [W/2 - 0.1, fy - 0.3, s['axles'][len(s['axles'])//2] if len(s['axles']) > 1 else 0], 'w': 0.6, 'd': 2.2, 'mirror': True, 'group': 'body'}
    if not machine and 'bed' not in s and gf is not None:
        M['rear_door'] = {'pos': [0, ro['y']*0.5, tail], 'w': 0.9, 'd': 0, 'group': 'body'}
    return M, wp
GUNWALE = {'kayak': 0.15, 'canoe': 0.4, 'paddleboard': 0.1, 'rowboat': 0.5, 'jon_boat': 0.5, 'bass_boat': 0.65, 'pontoon_boat': 1.0, 'runabout': 0.7, 'fishing_boat': 0.9,
           'jet_ski': 0.45, 'sailing_dinghy': 0.5, 'houseboat': 1.0, 'ferry_barge': 0.8, 'inflatable_raft': 0.3, 'log_raft': 0.2, 'barrel_raft': 0.45}
MOTORS = ('jon_boat', 'bass_boat', 'pontoon_boat', 'runabout', 'fishing_boat', 'houseboat', 'rowboat', 'sailing_dinghy', 'canoe', 'inflatable_raft')
def boat_mounts(name, b):
    w, d, top, low, x0, x1, z0, z1 = b
    g = GUNWALE.get(name, top*0.7)
    M = {}
    if name in MOTORS: M['transom'] = {'pos': [0, g, z0], 'w': 0.6, 'd': 0.5, 'group': 'body'}
    M['bow'] = {'pos': [0, g, z1 - 0.3], 'w': w*0.8, 'd': 0.6, 'group': 'body'}
    M['bow2'] = {'pos': [0, g, z1 - 0.9], 'w': w*0.8, 'd': 0.6, 'group': 'body'}
    M['bow3'] = {'pos': [0, g, z1 - 1.5], 'w': w*0.8, 'd': 0.6, 'group': 'body'}
    for key, zf in (('deck', 0.0), ('deck2', 0.2), ('deck3', -0.2)):
        M[key] = {'pos': [0, round(g*0.45, 3), round(d*zf, 3)], 'w': w*0.7, 'd': d*0.2, 'group': 'body'}
    if name in ('bass_boat', 'pontoon_boat', 'runabout', 'fishing_boat', 'jon_boat', 'sailing_dinghy', 'houseboat', 'rowboat'):
        M['canopy'] = {'pos': [0, g + (0.0 if name != 'pontoon_boat' else 0.0), -d*0.1], 'w': w*0.9, 'd': d*0.55, 'group': 'body'}
    M['rail'] = {'pos': [x1 - 0.05, g, 0], 'w': 0.2, 'd': d*0.6, 'mirror': True, 'group': 'body'}
    return M
def add(pack):
    P = load('props'); Mc = load('machines'); B = load('bikes'); Bt = load('boats')
    bb = bounds('boats'); bk = bounds('bikes')
    V = {}
    for n, s in P['vehicleSpec'].items():
        m, wp = car_mounts(s)
        st = STOCK[n]
        V[n] = {'pack': 'props', 'group': 'car', 'kind': 'car', 'wheel': {'r': s['wheelR'], 'w': s['wheelW'], 'points': wp, 'archClear': s['archClear'], 'maxR': round(s['wheelR']*1.4, 3), 'stock': {'tyre': st[0], 'rim': st[1]}},
                'paintSlots': ['paint1', 'paint2', 'paint3'], 'mounts': m}
    for n, s in Mc['spec'].items():
        if 'wheelR' not in s or 'roof' not in s: continue
        m, wp = car_mounts(s, machine=True)
        V[n] = {'pack': 'machines', 'group': 'machine', 'kind': 'machine', 'wheel': {'r': s['wheelR'], 'w': s['wheelW'], 'points': wp, 'archClear': s['archClear'], 'maxR': round(s['wheelR']*1.15, 3), 'stock': {'tyre': 'heavy', 'rim': 'steel'}},
                'paintSlots': ['BODY'], 'mounts': m}
    stockb = {'bicycle_city': 'road', 'bicycle_mountain': 'mtb', 'bicycle_kids': 'road', 'bmx': 'mtb', 'bicycle_road': 'road', 'cargo_bike': 'road', 'tricycle': 'road', 'tandem': 'road', 'kick_scooter': 'road',
              'motorbike_road': 'moto_road', 'motorbike_dirt': 'moto_knobby', 'moped': 'moto_road', 'quad_bike': 'moto_knobby'}
    for n, st in stockb.items():
        pts = B['wheels'][n]; r, w = B['wheelSize'][n]
        body = bk[n + '.body']; sad = B['saddle'].get(n) or [0, r*2.3, -0.2]
        if isinstance(sad[0], list): sad = sad[-1]
        rear = min(pts, key=lambda p: p[2]); front = max(pts, key=lambda p: p[2])
        bars = bk.get(n + '.bars')
        M = {'rear_rack': {'pos': [0, round(r*2 + 0.08, 3), rear[2]], 'w': 0.45 if n != 'quad_bike' else 1.0, 'd': 0.5 if n != 'quad_bike' else 0.8, 'group': 'body'},
             'front_rack': {'pos': [0, round(r*1.5, 3), front[2]], 'w': 0.4 if n != 'quad_bike' else 0.9, 'd': 0.35 if n != 'quad_bike' else 0.55, 'group': 'body'},
             'seatpost': {'pos': [0, sad[1], sad[2] - 0.12], 'w': 0.1, 'd': 0.1, 'group': 'body'},
             'frame': {'pos': [0, round(r*1.2, 3), sad[2] + 0.4], 'w': 0.1, 'd': 0.2, 'group': 'body'}}
        if bars: M['bars'] = {'pos': [0, bars[2] + 0.05 if False else round(bars[2] - bars[3]*0 - 0.0, 3), bars[7] if False else round(bars[6]/1 + (bars[7]-bars[6])/2, 3)], 'w': bars[0], 'd': bars[1] + 0.2, 'group': 'bars'}
        if n in ('motorbike_road', 'motorbike_dirt', 'moped', 'quad_bike'):
            M['rear_rack'].update(w=1.0 if n == 'quad_bike' else 0.8, d=0.8); M['frame'].update(w=0.6, d=0.6)
        M['bars_light'] = {'pos': list(M['bars']['pos']) if 'bars' in M else [0, r*2.6, front[2]], 'w': 0.2, 'd': 0.2, 'group': 'bars'}
        M['bars_bell'] = {'pos': list(M['bars_light']['pos']), 'w': 0.2, 'd': 0.2, 'group': 'bars'}
        M['stand'] = {'pos': [0, round(r*1.2, 3), rear[2] + 0.5], 'w': 0.2, 'd': 0.4, 'group': 'body'}
        M['fender'] = {'points': [[0, round(r*2 + 0.02, 3), p[2]] for p in pts if abs(p[0]) < 0.01], 'group': 'body'}
        V[n] = {'pack': 'bikes', 'group': 'bike', 'kind': 'bike', 'wheel': {'r': r, 'w': w, 'points': pts, 'bike': True, 'maxR': round(r*1.3, 3), 'stock': {'wheel': st}}, 'paintSlots': ['BODY'], 'mounts': M}
    for n in GUNWALE:
        b = bb.get(n + '.body')
        if not b: continue
        V[n] = {'pack': 'boats', 'group': 'boat', 'kind': 'boat', 'paintSlots': sorted(Bt.get('paint', {}).get(n, {}).keys()) if isinstance(Bt.get('paint', {}).get(n), dict) else ['BODY'],
                'mounts': boat_mounts(n, b), 'draught': Bt['draught'].get(n)}
    for v in V.values():
        for m in v['mounts'].values():
            if 'pos' in m: m['pos'] = [r3(x) for x in m['pos']]
            if 'points' in m: m['points'] = [[r3(x) for x in p] for p in m['points']]
            for k in ('w', 'd'):
                if k in m: m[k] = r3(m[k])
        if 'wheel' in v: v['wheel']['points'] = [[r3(x) for x in p] for p in v['wheel']['points']]
    pack['vehicles'] = V
    pack['rule'] = RULE
    import kit_presets
    pack['presets'] = kit_presets.PRESETS
RULE = ("Draw a vehicle in its own pack, then dress it. (1) Wheels: for each wheel point draw the chosen tyre scaled (w*wMul, r*rMul, r*rMul) and the rim scaled (w*wMul, r*rMul*rimFrac, ...) at the point "
        "(the left side turned half a turn about y so the rim face shows outward). If the new tyre radius is bigger than the stock radius, lift the whole body and every body-group part by "
        "lift = max(0, 2*(rNew - r) - archClear + 0.02), and put the wheel centres at y = rNew. (2) Parts: each part names a slot; the vehicle's mounts[slot] gives pos, w, d, anchor offsets (anchor front: z + d/2, rear: z - d/2). "
        "A part fits if part.w <= mount.w and part.d <= mount.d (pillar: part.hMax <= mount.hMax; arch: part.rCap >= tyre radius). One part per slot. Mirror parts are modelled for the right side: draw with scale.x = -1 for the left. "
        "Group 'bonnet' parts open with the bonnet; 'bed' parts tip with the bed. (3) Paint: override the vehicle's paintSlots colours; parts that use BODY take the body colour. assets/shaped/vehiclefit.js does all of this.")
