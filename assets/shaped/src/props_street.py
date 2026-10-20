# Street signs and lights (design list, 20 October 2026), exec'd by props.py after props_x.py.
# Signs face +Z (towards traffic coming from +Z), plates 2.1 m up on a post at the origin. Lights have _off and _on states
# (on: glow pieces; add a point light). Traffic and walk signals come in their states.
from world import text_strokes
PALETTE.update({'signR': '#c8322a', 'signY': '#e0b830', 'signG': '#2e6a3e', 'signB': '#2e5a8a', 'signBr': '#6a4a2e', 'signO': '#e0742a', 'signK': '#1f2024', 'signWh': '#f0ead8',
                'lampOff': '#c8c4b8', 'lampOn': '#fff0c0', 'lampSodium': '#ffb060', 'lampLED': '#e8f0ff', 'redOn': '#ff3a2a', 'amberOn': '#ffb030', 'greenOn': '#3aff8a', 'walkOn': '#f0f0e8', 'handOn': '#ff7a2a',
                'lensOff': '#2a2c30', 'poleG': '#5e6a74', 'poleK': '#2a2c30', 'poleGreen': '#2e4a3a', 'wire': '#1f2024', 'rail': '#e8e4dc'})
def plate(shape, w, h, c, y=2.1, z=0.04, border=None, t=0.02):
    """a sign plate centred at height y (its bottom at y - h/2), front face at z + t"""
    o = []
    if shape == 'rect': o.append(box([0, y, z + t/2], [w, h, t], c))
    elif shape == 'diamond': o.append(solid([(0, y - h/2, z), (w/2, y, z), (0, y + h/2, z), (-w/2, y, z), (0, y - h/2, z + t), (w/2, y, z + t), (0, y + h/2, z + t), (-w/2, y, z + t)],
                                            [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], c))
    elif shape == 'round': o.append(loft([[0, y, z, w/2, w/2], [0, y, z + t, w/2, w/2]], c, ax='z', n=12))
    elif shape == 'tri_down': o.append(solid([(-w/2, y + h/2, z), (w/2, y + h/2, z), (0, y - h/2, z), (-w/2, y + h/2, z + t), (w/2, y + h/2, z + t), (0, y - h/2, z + t)], [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]], c))
    elif shape == 'tri_up': o.append(solid([(-w/2, y - h/2, z), (w/2, y - h/2, z), (0, y + h/2, z), (-w/2, y - h/2, z + t), (w/2, y - h/2, z + t), (0, y + h/2, z + t)], [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]], c))
    elif shape == 'octagon': o.append(loft([[0, y, z, w/2, w/2], [0, y, z + t, w/2, w/2]], c, ax='z', n=8))
    if border:
        k = 0.88
        if shape == 'rect': o.append(flat([(-w*k/2, y - h*k/2, z + t + 0.001), (w*k/2, y - h*k/2, z + t + 0.001), (w*k/2, y + h*k/2, z + t + 0.001), (-w*k/2, y + h*k/2, z + t + 0.001)], border))
        elif shape == 'diamond': o.append(flat([(0, y - h*k/2, z + t + 0.001), (w*k/2, y, z + t + 0.001), (0, y + h*k/2, z + t + 0.001), (-w*k/2, y, z + t + 0.001)], border))
        elif shape == 'round': o.append(loft([[0, y, z + t + 0.0005, w*k/2, w*k/2], [0, y, z + t + 0.001, w*k/2, w*k/2]], border, ax='z', n=12, caps=[False, True]))
    return o
def words(s, h, y, c='signK', z=0.062, w=None, x=0.0, aspect=0.55, stroke=None):
    return text_strokes(s, h, stroke or h*0.16, c, 'wall', x0=x, y0=y - h/2, z0=z, aspect=aspect, n=(0, 0, 1))
def post(h=2.5, c='post'): return [b(0, 0, 0, 0.06, h, 0.06, c)]
def sign(name, face, h=2.5): model('street', name, post(h) + face)
FZ = 0.062
sign('sign_no_parking', plate('rect', 0.45, 0.6, 'signWh', 2.2) + [loft([[0, 2.2, FZ, 0.19, 0.19], [0, 2.2, FZ + 0.001, 0.19, 0.19]], 'signR', ax='z', n=12, caps=[False, True]),
                         loft([[0, 2.2, FZ + 0.0015, 0.155, 0.155], [0, 2.2, FZ + 0.002, 0.155, 0.155]], 'signWh', ax='z', n=12, caps=[False, True])] + words('P', 0.2, 2.2, 'signK', FZ + 0.003) +
                         [flat([(-0.15, 2.07, FZ + 0.004), (-0.11, 2.07, FZ + 0.004), (0.15, 2.33, FZ + 0.004), (0.11, 2.33, FZ + 0.004)], 'signR')])
sign('sign_no_entry', plate('round', 0.6, 0.6, 'signR', 2.25) + [box([0, 2.25, FZ + 0.0], [0.42, 0.1, 0.004], 'signWh')])
sign('sign_stop_all_way', [b(0, 0, 0, 0.06, 2.1, 0.06, 'post'), loft([[0, 2.35, 0.04, 0.32, 0.32], [0, 2.35, 0.06, 0.32, 0.32]], 'signR', ax='z', n=8)] + words('STOP', 0.13, 2.38, 'signWh', 0.0605, aspect=0.5)
     + plate('rect', 0.4, 0.13, 'signWh', 1.94, 0.04) + words('ALL WAY', 0.07, 1.94, 'signR', 0.0605, aspect=0.55), 0.0)
def warn(name, label=None, icon=None, extra=None):
    face = plate('diamond', 0.75, 0.75, 'signY', 2.25, border=None) + [flat([(0, 1.91, FZ + 0.0), (0.335, 2.25, FZ), (0, 2.59, FZ), (-0.335, 2.25, FZ)], 'signY')]
    face += [p for p in (icon or [])]
    if label: face += plate('rect', 0.55, 0.16, 'signY', 1.74) + words(label, 0.08, 1.74, 'signK', FZ, aspect=0.5)
    sign(name, face + (extra or []))
def stick(x0, y0, x1, y1, w=0.025, c='signK', z=FZ + 0.002):
    dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy) or 1; px, py = -dy/L*w/2, dx/L*w/2
    return flat([(x0 + px, y0 + py, z), (x1 + px, y1 + py, z), (x1 - px, y1 - py, z), (x0 - px, y0 - py, z)], c)
def blob2(x, y, r, c='signK', z=FZ + 0.002, n=8): return flat([(x + r*math.cos(a), y + r*math.sin(a), z) for a in [k*2*math.pi/n for k in range(n)]], c)
walker = [blob2(0.0, 2.43, 0.035), stick(0.0, 2.39, -0.01, 2.25, 0.05), stick(-0.01, 2.25, -0.07, 2.08), stick(-0.01, 2.25, 0.06, 2.1), stick(0.0, 2.36, -0.07, 2.28), stick(0.0, 2.36, 0.07, 2.3)]
warn('sign_pedestrian', None, walker)
warn('sign_school', 'SCHOOL', [blob2(-0.07, 2.42, 0.03), stick(-0.07, 2.39, -0.08, 2.24, 0.045), stick(-0.08, 2.24, -0.13, 2.1), stick(-0.08, 2.24, -0.03, 2.1), blob2(0.08, 2.38, 0.026), stick(0.08, 2.35, 0.07, 2.22, 0.04), stick(0.07, 2.22, 0.03, 2.1), stick(0.07, 2.22, 0.11, 2.1), stick(-0.05, 2.32, 0.06, 2.3, 0.02)])
warn('sign_deer', None, [flat([(-0.15, 2.2, FZ + 0.002), (0.12, 2.22, FZ + 0.002), (0.14, 2.3, FZ + 0.002), (-0.13, 2.3, FZ + 0.002)], 'signK'), stick(0.12, 2.28, 0.2, 2.42, 0.04), stick(0.2, 2.42, 0.25, 2.4, 0.04),
                         *[stick(x, 2.22, x + dx, 2.06, 0.022) for x, dx in ((-0.13, -0.03), (-0.09, 0.02), (0.08, -0.02), (0.12, 0.03))], stick(0.19, 2.45, 0.16, 2.53, 0.015), stick(0.21, 2.45, 0.24, 2.53, 0.015)])
warn('sign_curve', None, [stick(-0.02, 2.0, -0.02, 2.25, 0.06), stick(-0.02, 2.25, 0.08, 2.38, 0.06), flat([(0.03, 2.46, FZ + 0.002), (0.16, 2.43, FZ + 0.002), (0.11, 2.32, FZ + 0.002)], 'signK')])
warn('sign_crossroads', None, [stick(0, 2.0, 0, 2.5, 0.06), stick(-0.2, 2.25, 0.2, 2.25, 0.06)])
warn('sign_slippery', None, [flat([(-0.1, 2.3, FZ + 0.002), (0.1, 2.3, FZ + 0.002), (0.12, 2.42, FZ + 0.002), (-0.08, 2.42, FZ + 0.002)], 'signK'), stick(-0.12, 2.1, 0.0, 2.2, 0.025), stick(0.0, 2.2, -0.06, 2.12, 0.025), stick(0.05, 2.1, 0.15, 2.2, 0.025)])
def roadwork(name, label, icon):
    face = plate('diamond', 0.8, 0.8, 'signO', 2.25) + icon
    if label: face += plate('rect', 0.6, 0.16, 'signO', 1.72) + words(label, 0.08, 1.72, 'signK', FZ, aspect=0.5)
    sign(name, face)
roadwork('sign_road_work', 'ROAD WORK', [blob2(-0.02, 2.44, 0.03), stick(-0.02, 2.4, 0.02, 2.25, 0.05), stick(0.02, 2.25, -0.06, 2.1), stick(0.02, 2.25, 0.08, 2.12), stick(-0.01, 2.36, 0.14, 2.28),
                                         flat([(0.1, 2.08, FZ + 0.002), (0.22, 2.08, FZ + 0.002), (0.16, 2.2, FZ + 0.002)], 'signK')])
roadwork('sign_detour', 'DETOUR', [stick(-0.2, 2.25, 0.12, 2.25, 0.07), flat([(0.1, 2.15, FZ + 0.002), (0.25, 2.25, FZ + 0.002), (0.1, 2.35, FZ + 0.002)], 'signK')])
sign('sign_dead_end', plate('rect', 0.6, 0.6, 'signY', 2.2) + words('DEAD', 0.12, 2.3, 'signK', FZ, aspect=0.5) + words('END', 0.12, 2.1, 'signK', FZ, aspect=0.5))
sign('sign_hospital', plate('rect', 0.6, 0.6, 'signB', 2.2) + [box([0, 2.2, FZ - 0.0], [0.42, 0.42, 0.004], 'signWh')] + words('H', 0.3, 2.2, 'signB', FZ + 0.003, aspect=0.6, stroke=0.07))
sign('sign_parking', plate('rect', 0.5, 0.6, 'signB', 2.2) + words('P', 0.36, 2.22, 'signWh', FZ, aspect=0.6, stroke=0.07))
sign('sign_evacuation', plate('rect', 0.6, 0.6, 'signB', 2.2) + [loft([[0, 2.2, FZ, 0.24, 0.24], [0, 2.2, FZ + 0.001, 0.24, 0.24]], 'signWh', ax='z', n=12, caps=[False, True])] +
     words('EVACUATION', 0.045, 2.37, 'signWh', FZ + 0.002, aspect=0.5) + [stick(-0.1, 2.15, 0.08, 2.15, 0.05, 'signB', FZ + 0.003), flat([(0.06, 2.08, FZ + 0.003), (0.16, 2.15, FZ + 0.003), (0.06, 2.22, FZ + 0.003)], 'signB')])
for spd in (25, 35, 55):
    sign('sign_speed_%d' % spd, plate('rect', 0.5, 0.62, 'signWh', 2.2) + [flat([(-0.23, 1.9, FZ + 0.0005), (0.23, 1.9, FZ + 0.0005), (0.23, 2.5, FZ + 0.0005), (-0.23, 2.5, FZ + 0.0005)], 'signK'),
                                                                       flat([(-0.21, 1.92, FZ + 0.001), (0.21, 1.92, FZ + 0.001), (0.21, 2.48, FZ + 0.001), (-0.21, 2.48, FZ + 0.001)], 'signWh')] +
         words('SPEED', 0.06, 2.4, 'signK', FZ + 0.002, aspect=0.5) + words('LIMIT', 0.06, 2.31, 'signK', FZ + 0.002, aspect=0.5) + words(str(spd), 0.17, 2.1, 'signK', FZ + 0.002, aspect=0.5))
sign('sign_route', plate('rect', 0.5, 0.5, 'signWh', 2.2) + [flat([(-0.2, 2.0, FZ + 0.001), (0.2, 2.0, FZ + 0.001), (0.22, 2.35, FZ + 0.001), (0.12, 2.42, FZ + 0.001), (0, 2.38, FZ + 0.001), (-0.12, 2.42, FZ + 0.001), (-0.22, 2.35, FZ + 0.001)], 'signK')] +
     words('66', 0.15, 2.16, 'signWh', FZ + 0.003, aspect=0.5))
def railroad():
    o = [b(0, 0, 0, 0.12, 3.2, 0.12, 'rail')] + [b(0, 0.0, 0, 0.12, 0.25, 0.12, 'signK')]
    for a in (35, -35):
        r = math.radians(a); c, s = math.cos(r), math.sin(r)
        pts = [(-0.6*c - 0.06*s*(-1), 3.0 - 0.6*s - 0.06*c, 0.07), (0.6*c - 0.06*s*(-1), 3.0 + 0.6*s - 0.06*c, 0.07), (0.6*c + 0.06*s*(-1), 3.0 + 0.6*s + 0.06*c, 0.07), (-0.6*c + 0.06*s*(-1), 3.0 - 0.6*s + 0.06*c, 0.07)]
        o.append(solid(pts + [(x, y, 0.09) for x, y, _ in pts], [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], 'signWh'))
    o += [b(0, 2.25, 0.07, 0.9, 0.08, 0.06, 'signK')] + [loft([[sx*0.32, 2.3, 0.1, 0.13, 0.13], [sx*0.32, 2.3, 0.16, 0.13, 0.13]], 'signK', ax='z', n=10) for sx in (1, -1)]
    return o
RR = railroad()
model('street', 'railroad_crossing_off', RR + [loft([[sx*0.32, 2.3, 0.161, 0.08, 0.08], [sx*0.32, 2.3, 0.162, 0.08, 0.08]], 'lensOff', ax='z', n=10, caps=[False, True]) for sx in (1, -1)])
model('street', 'railroad_crossing_on', RR + [loft([[sx*0.32, 2.3, 0.161, 0.08, 0.08], [sx*0.32, 2.3, 0.162, 0.08, 0.08]], 'redOn' if sx > 0 else 'lensOff', ax='z', n=10, caps=[False, True], glow=sx > 0) for sx in (1, -1)])
def gantry():
    o = [b(sx*7.0, 0, 0, 0.4, 6.6, 0.4, 'poleG') for sx in (1, -1)] + [b(0, 6.0, 0, 14.4, 0.12, 0.12, 'poleG'), b(0, 6.6, 0, 14.4, 0.12, 0.12, 'poleG')]
    o += [b(x, 6.0, 0, 0.06, 0.66, 0.06, 'poleG') for x in (-5, -2.5, 0, 2.5, 5)]
    for x, lines in ((-3.4, ['NORTH', '95']), (3.4, ['EXIT 12', 'MAIN ST'])):
        o += [b(x, 5.0, 0.12, 3.8, 1.8, 0.08, 'signG'), flat([(x - 1.85, 5.04, 0.161), (x + 1.85, 5.04, 0.161), (x + 1.85, 6.76, 0.161), (x - 1.85, 6.76, 0.161)], 'signWh'), flat([(x - 1.8, 5.08, 0.162), (x + 1.8, 5.08, 0.162), (x + 1.8, 6.72, 0.162), (x - 1.8, 6.72, 0.162)], 'signG')]
        o += words(lines[0], 0.4, 6.25, 'signWh', 0.163, x=x, aspect=0.5) + words(lines[1], 0.36, 5.6, 'signWh', 0.163, x=x, aspect=0.5)
    o += [flat([(1.4, 5.2, 0.164), (1.8, 5.2, 0.164), (1.6, 5.45, 0.164)], 'signWh')]
    return o
model('street', 'sign_gantry', gantry())
STREET_SIGN_RULE = ('New signs (all face +Z, plates about 2.2 m up): sign_no_parking, sign_no_entry, sign_stop_all_way, warnings sign_pedestrian, sign_school, sign_deer, sign_curve, sign_crossroads, sign_slippery, '
                    'road works sign_road_work and sign_detour, sign_dead_end, sign_hospital, sign_parking, sign_evacuation, sign_speed_25/35/55, sign_route (a highway shield), '
                    'railroad_crossing_off and _on (flash the two lamps alternately), sign_gantry (a 14 m overhead sign bridge for highways and big roads, 5 m clear under the signs).')

# ---------------- lights ----------------
def cobra(on, h=8.0):
    o = [frustum([[0, 0, 0, 0.12, 0.12], [0, h, 0, 0.07, 0.07]], 'poleG'), seg([0, h - 0.2, 0], [0, h + 0.15, 1.6], 0.04, 0.04, 0.035, 0.035, 'poleG'),
         hull([(-0.18, h + 0.05, 1.5), (0.18, h + 0.05, 1.5), (0.18, h + 0.05, 2.2), (-0.18, h + 0.05, 2.2), (-0.12, h + 0.2, 1.5), (0.12, h + 0.2, 1.5), (0.12, h + 0.15, 2.15), (-0.12, h + 0.15, 2.15)], 'poleG'),
         flat([(-0.14, h + 0.045, 1.6), (0.14, h + 0.045, 1.6), (0.14, h + 0.045, 2.1), (-0.14, h + 0.045, 2.1)], 'lampSodium' if on else 'lampOff', (0, -1, 0), **(G if on else {})), b(0, 0, 0, 0.3, 0.5, 0.3, 'concrete')]
    return o
model('street', 'lamp_cobra_off', cobra(False)); model('street', 'lamp_cobra_on', cobra(True))
def double_arm(on, h=9.0):
    o = [frustum([[0, 0, 0, 0.14, 0.14], [0, h, 0, 0.08, 0.08]], 'poleG'), b(0, 0, 0, 0.34, 0.5, 0.34, 'concrete')]
    for sz in (1, -1):
        o += [seg([0, h - 0.3, 0], [0, h, sz*1.8], 0.04, 0.04, 0.035, 0.035, 'poleG'), b(0, h - 0.12, sz*2.0, 0.3, 0.14, 0.7, 'poleG'),
              flat([(-0.12, h - 0.125, sz*1.7), (0.12, h - 0.125, sz*1.7), (0.12, h - 0.125, sz*2.3), (-0.12, h - 0.125, sz*2.3)], 'lampLED' if on else 'lampOff', (0, -1, 0), **(G if on else {}))]
    return o
model('street', 'lamp_double_off', double_arm(False)); model('street', 'lamp_double_on', double_arm(True))
def ornate(on):
    o = [b(0, 0, 0, 0.36, 0.6, 0.36, 'poleK'), frustum([[0, 0.6, 0, 0.12, 0.12], [0, 0.9, 0, 0.07, 0.07]], 'poleK'), frustum([[0, 0.9, 0, 0.05, 0.05], [0, 3.4, 0, 0.04, 0.04]], 'poleK'),
         frustum([[0, 3.4, 0, 0.08, 0.08], [0, 3.5, 0, 0.08, 0.08]], 'poleK'),
         loft([[0, 3.5, 0, 0.12, 0.12], [0, 3.9, 0, 0.2, 0.2], [0, 3.95, 0, 0.2, 0.2]], 'lampOn' if on else 'lampOff', n=6, **(G if on else {})),
         loft([[0, 3.95, 0, 0.24, 0.24], [0, 4.05, 0, 0.15, 0.15], [0, 4.2, 0, 0.0, 0.0]], 'poleK', n=6)]
    return o
model('street', 'lamp_ornate_off', ornate(False)); model('street', 'lamp_ornate_on', ornate(True))
def mast(on, h=16.0):
    o = [frustum([[0, 0, 0, 0.3, 0.3], [0, h, 0, 0.14, 0.14]], 'poleG'), b(0, 0, 0, 0.8, 0.6, 0.8, 'concrete'), loft([[0, h, 0, 1.0, 1.0], [0, h + 0.15, 0, 1.0, 1.0]], 'poleG', n=8)]
    for a in range(4):
        x, z = math.cos(a*math.pi/2 + 0.785)*0.85, math.sin(a*math.pi/2 + 0.785)*0.85
        o += [b(x, h - 0.25, z, 0.4, 0.25, 0.4, 'poleG'), flat([(x - 0.17, h - 0.255, z - 0.17), (x + 0.17, h - 0.255, z - 0.17), (x + 0.17, h - 0.255, z + 0.17), (x - 0.17, h - 0.255, z + 0.17)], 'lampSodium' if on else 'lampOff', (0, -1, 0), **(G if on else {}))]
    return o
model('street', 'lamp_mast_off', mast(False)); model('street', 'lamp_mast_on', mast(True))
def wall_lantern(on):
    return [b(0, 2.4, 0.05, 0.12, 0.2, 0.1, 'poleK'), seg([0, 2.55, 0.06], [0, 2.6, 0.3], 0.015, 0.015, 0.015, 0.015, 'poleK'),
            loft([[0, 2.35, 0.32, 0.08, 0.08], [0, 2.55, 0.32, 0.1, 0.1]], 'lampOn' if on else 'lampOff', n=4, **(G if on else {})), tip([0, 2.55, 0.32], [0, 2.7, 0.32], 0.13, 0.13, 'poleK')]
model('street', 'lamp_wall_off', wall_lantern(False)); model('street', 'lamp_wall_on', wall_lantern(True))
# traffic signals: three lamps, states red, amber, green, flashing (amber glow alone), dark
def head(x, y, z, state, face=1):
    o = [b(x, y, z, 0.32, 0.95, 0.24, 'black'), b(x, y + 0.95, z, 0.36, 0.04, 0.28, 'black')]
    for i, (lc, on) in enumerate((('redOn', 'red'), ('amberOn', 'amber'), ('greenOn', 'green'))):
        yy = y + 0.78 - i*0.3; lit = state == on or (state == 'flash' and on == 'amber')
        o.append(loft([[x, yy, z + face*0.121, 0.11, 0.11], [x, yy, z + face*0.123, 0.11, 0.11]], lc if lit else 'lensOff', ax='z', n=8, caps=[False, True], **(G if lit else {})))
        o.append(hull([(x - 0.13, yy + 0.12, z + face*0.12), (x + 0.13, yy + 0.12, z + face*0.12), (x + 0.13, yy + 0.12, z + face*0.24), (x - 0.13, yy + 0.12, z + face*0.24),
                       (x - 0.13, yy + 0.14, z + face*0.12), (x + 0.13, yy + 0.14, z + face*0.12), (x + 0.13, yy + 0.14, z + face*0.2), (x - 0.13, yy + 0.14, z + face*0.2)], 'black'))
    return o
def mast_arm(state):
    o = [frustum([[0, 0, 0, 0.16, 0.16], [0, 6.0, 0, 0.11, 0.11]], 'poleG'), b(0, 0, 0, 0.5, 0.5, 0.5, 'concrete'), seg([0, 5.6, 0], [-6.0, 5.8, 0], 0.08, 0.08, 0.05, 0.05, 'poleG'),
         seg([0, 4.5, 0], [-1.8, 5.6, 0], 0.03, 0.03, 0.03, 0.03, 'poleG')]
    o += head(-2.5, 4.7, 0.12, state) + head(-5.2, 4.75, 0.12, state)
    o += [b(-3.8, 5.5, 0.1, 0.9, 0.22, 0.03, 'signG'), *words('MAIN ST', 0.1, 5.61, 'signWh', 0.117, x=-3.8, aspect=0.5)]
    return o
for st in ('red', 'amber', 'green', 'flash', 'dark'): model('street', 'traffic_mast_' + st, mast_arm(st))
def span(state):
    o = [frustum([[sx*7.5, 0, 0, 0.16, 0.16], [sx*7.5, 7.0, 0, 0.12, 0.12]], 'woodD') for sx in (1, -1)]
    o += [seg([-7.5, 6.6, 0], [0, 6.1, 0], 0.012, 0.012, 0.012, 0.012, 'wire'), seg([0, 6.1, 0], [7.5, 6.6, 0], 0.012, 0.012, 0.012, 0.012, 'wire')]
    for x in (-1.6, 1.6):
        hh = head(x, 5.05, 0.0, state); o += hh + head(x, 5.05, 0.0, state, -1)[2:] + [seg([x, 6.0, 0], [x, 6.13 - abs(x)*0.065, 0], 0.01, 0.01, 0.01, 0.01, 'wire')]
    return o
for st in ('red', 'amber', 'green', 'flash', 'dark'): model('street', 'traffic_span_' + st, span(st))
def walk_signal(state):
    o = [b(0, 0, 0, 0.1, 2.6, 0.1, 'poleG'), b(0, 2.2, 0.15, 0.36, 0.55, 0.22, 'black')]
    c = {'walk': 'walkOn', 'stop': 'handOn', 'dark': 'lensOff'}[state]; G2 = G if state != 'dark' else {}
    y = 2.47; z = 0.262
    if state == 'walk' or state == 'dark':
        o += [blob2(0, y + 0.13, 0.025, c, z), stick(0, y + 0.1, -0.01, y - 0.0, 0.04, c, z), stick(-0.01, y, -0.05, y - 0.12, 0.022, c, z), stick(-0.01, y, 0.04, y - 0.11, 0.022, c, z), stick(0, y + 0.08, 0.05, y + 0.02, 0.018, c, z)]
    if state == 'stop' or state == 'dark':
        o += [flat([(-0.07, y - 0.12, z), (0.05, y - 0.12, z), (0.05, y + 0.06, z), (-0.07, y + 0.06, z)], c, (0, 0, 1)), *[stick(x, y + 0.06, x, y + 0.14, 0.022, c, z) for x in (-0.055, -0.02, 0.015, 0.045)]]
    for q in o[2:]:
        q.update(G2)
    o.append(b(0, 1.15, 0.07, 0.1, 0.14, 0.06, 'signY'))
    return o
for st in ('walk', 'stop', 'dark'): model('street', 'walk_signal_' + st, walk_signal(st))
def beacon(on):
    return [b(0, 0, 0, 0.1, 2.4, 0.1, 'poleG'), b(0, 2.4, 0, 0.32, 0.4, 0.24, 'black'), loft([[0, 2.6, 0.121, 0.11, 0.11], [0, 2.6, 0.123, 0.11, 0.11]], 'amberOn' if on else 'lensOff', ax='z', n=8, caps=[False, True], **(G if on else {}))]
model('street', 'flasher_off', beacon(False)); model('street', 'flasher_on', beacon(True))
STREET_LIGHT_RULE = ('Lights: lamp_cobra (8 m highway-style arm), lamp_double (9 m two-armed for boulevards), lamp_ornate (old town), lamp_mast (16 m mast for car parks and junctions), lamp_wall '
                     '(a lantern by a door, back at z = 0); each _off and _on (sodium amber or white LED glow; add a point light about 12 m for poles, 4 m for the lantern). Signals: traffic_mast_<state> '
                     '(a mast arm reaching 6 m over the road towards -X with two heads and a street blade) and traffic_span_<state> (heads hung on a wire between two poles 15 m apart, both faces), '
                     'states red, amber, green, flash (amber alone, blinking: power out or night mode) and dark (no power); walk_signal_walk/stop/dark; flasher_off/_on (blink it). '
                     'Without power everything is _off or dark; once a district is powered (0.59) lights come on at dusk.')
