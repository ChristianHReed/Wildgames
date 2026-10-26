#!/usr/bin/env python3
"""Afterstreet machines pack, version 1 (20 October 2026): construction and service vehicles with their moving parts.
Writes assets/shaped/machines.js. Run: python3 assets/shaped/src/machines.py

Same rules as every pack: shaped pieces, flat colours, metres, Y up, the front faces +Z, the origin at the centre of the ground
under the vehicle. Each machine is
  parts[name]         pieces in machine space at rest (like survivor and alien bones: subtract the part's pivot to turn it)
  rig[name]           how each part moves: parent (another part, or none for the body), pivot [x, y, z],
                      'turn': an axis ([1,0,0] and so on) and a range [min, max] in degrees, positive as the note says, or
                      'slide': a direction and a range in metres; 'fixed' is a turn in degrees ([x, y, z], three.js Euler XYZ)
                      the part always has before it moves; 'rest' is its value when parked.
  wheels              positions for the one 'wheel' part (spin it about X; steer the ones listed in 'steer' about Y)
  clips[name]         movements as key frames: each frame {part: value, ..., 't': seconds from the start}; blend between frames
  beacons             the part that holds the flashing lights (glow pieces): flash it, and add a coloured light
Kinds: excavator, bulldozer, dump_truck, cement_mixer, garbage_truck, fire_truck, ambulance, tow_truck, mobile_crane,
bucket_truck, forklift, road_roller, street_sweeper, school_bus. BODY is a colour slot (each has a usual colour in 'paint')."""
import math
from kit import *

PALETTE = {
  'tyre': '#2a2a2c', 'hub': '#8a8e92', 'hubD': '#5a5e62', 'steel': '#6e747a', 'steelD': '#4a4f54', 'steelL': '#9aa0a6', 'black': '#1f2024', 'rubber': '#2e2e30',
  'glass': '#3a4a52', 'glassL': '#6a8a96', 'head': '#f0e8c8', 'tail': '#b8322a', 'chrome': '#b8bcc0', 'grille': '#2a2c30',
  'beaconA': '#ffb030', 'beaconR': '#ff3a2a', 'beaconB': '#3a7aff', 'white': '#e8e4dc', 'whiteD': '#c8c4bc', 'stripeR': '#c8322a', 'stripeY': '#e0b830', 'stripeG': '#4a9a4a',
  'drum': '#b8b4aa', 'drumD': '#8a867c', 'concrete': '#9a958c', 'dirt': '#6a5440', 'rust': '#8c4a2e', 'hydraulic': '#c8ccd0', 'cable': '#2a2a2c', 'hook': '#e0b030',
  'ladder': '#c8ccd0', 'bin': '#3a6a3a', 'binD': '#2e5430', 'seat': '#2e3034', 'brush': '#3a3020', 'brushL': '#5a4a30', 'bucketTeeth': '#b8bcc0', 'warn': '#e0b830', 'warnD': '#1f2024',
  'signR': '#c8322a', 'signW': '#f0ead8', 'pallet': '#a8845a',
}
PAINT = {'excavator': '#e0aa28', 'bulldozer': '#e0aa28', 'dump_truck': '#d8742a', 'cement_mixer': '#e8e4dc', 'garbage_truck': '#4a7a4a', 'fire_truck': '#b8282a', 'ambulance': '#ece8e0',
         'tow_truck': '#3a5a8a', 'mobile_crane': '#e0aa28', 'bucket_truck': '#e8e4dc', 'forklift': '#e0aa28', 'road_roller': '#e0aa28', 'street_sweeper': '#d8742a', 'school_bus': '#e8b020'}
G = dict(glow=True)
M, RIG, WHEELS, CLIPS, NOTE, BEACON, STEER, WR, SPEC = {}, {}, {}, {}, {}, {}, {}, {}, {}
_BUF = {}

def b(x0, y0, z0, x1, y1, z1, c, **k): return box([(x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2], [abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)], c, **k)
def wheel(r, w):
    return [loft([[-w/2, 0, 0, r, r], [w/2, 0, 0, r, r]], 'tyre', ax='x', n=10), loft([[-w/2 - 0.005, 0, 0, r*0.55, r*0.55], [w/2 + 0.005, 0, 0, r*0.55, r*0.55]], 'hub', ax='x', n=8),
            loft([[-w/2 - 0.01, 0, 0, r*0.18, r*0.18], [w/2 + 0.01, 0, 0, r*0.18, r*0.18]], 'hubD', ax='x', n=6)]
def cab(zf, zb, W, y0, yr, col='BODY', slope=0.35, grille=True):
    """a truck cab from its back zb to its front zf, floor y0, roof yr; windscreen sloping back by slope"""
    o = [b(-W, y0, zb, W, yr - 0.9, zf, col),
         hull([(-W, yr - 0.9, zb), (W, yr - 0.9, zb), (W, yr - 0.9, zf), (-W, yr - 0.9, zf), (-W + 0.05, yr, zb), (W - 0.05, yr, zb), (W - 0.05, yr, zf - slope), (-W + 0.05, yr, zf - slope)], col),
         flat([(-W + 0.12, yr - 0.82, zf + 0.002), (W - 0.12, yr - 0.82, zf + 0.002), (W - 0.15, yr - 0.08, zf - slope + 0.04), (-W + 0.15, yr - 0.08, zf - slope + 0.04)], 'glass', (0, slope, 0.9)),
         *[flat([(sx*(W + 0.002), yr - 0.82, zb + 0.15), (sx*(W + 0.002), yr - 0.82, zf - 0.12), (sx*(W + 0.002), yr - 0.1, zf - slope - 0.05), (sx*(W + 0.002), yr - 0.1, zb + 0.15)], 'glass', (sx, 0, 0)) for sx in (1, -1)]]
    if grille:
        o += [flat([(-W*0.6, y0 + 0.25, zf + 0.003), (W*0.6, y0 + 0.25, zf + 0.003), (W*0.6, y0 + 0.75, zf + 0.003), (-W*0.6, y0 + 0.75, zf + 0.003)], 'grille'),
              *[flat([(sx*W*0.8 - 0.12, y0 + 0.35, zf + 0.004), (sx*W*0.8 + 0.12, y0 + 0.35, zf + 0.004), (sx*W*0.8 + 0.12, y0 + 0.5, zf + 0.004), (sx*W*0.8 - 0.12, y0 + 0.5, zf + 0.004)], 'head', **G) for sx in (1, -1)],
              b(-W - 0.02, y0 - 0.15, zf, W + 0.02, y0 + 0.05, zf + 0.15, 'black')]
    o += [b(sx*(W + 0.02), yr - 0.9, zf - 0.4, sx*(W + 0.16), yr - 0.55, zf - 0.37, 'black') for sx in (1, -1)]   # mirrors
    return o
def chassis(z0, z1, y, W=0.5):
    return [b(-W, y - 0.25, z0, -W + 0.12, y, z1, 'steelD'), b(W - 0.12, y - 0.25, z0, W, y, z1, 'steelD')]
def beacons(xs, y, z, c='beaconA', w=0.18):
    return [b(x - w/2, y, z - 0.08, x + w/2, y + 0.12, z + 0.08, c, **G) for x in xs]
def tails(W, y, z):
    return [flat([(sx*W - 0.15*sx, y, z - 0.003), (sx*W - 0.02*sx, y, z - 0.003), (sx*W - 0.02*sx, y + 0.16, z - 0.003), (sx*W - 0.15*sx, y + 0.16, z - 0.003)], 'tail', (0, 0, -1), **G) for sx in (1, -1)]
def stripe(W, y0, y1, z0, z1, c):
    return [flat([(sx*(W + 0.003), y0, z0 if sx > 0 else z1), (sx*(W + 0.003), y0, z1 if sx > 0 else z0), (sx*(W + 0.003), y1, z1 if sx > 0 else z0), (sx*(W + 0.003), y1, z0 if sx > 0 else z1)], c, (sx, 0, 0)) for sx in (1, -1)]
def undercarriage(zs, wx, r, w, top, z0, z1, rail_w=0.5):
    """chassis rails (top at y = top), and for each axle z in zs: the axle beam out to the hubs, a differential and a leaf spring each side up to the rails"""
    o = chassis(z0, z1, top, rail_w)
    for z in zs:
        xe = wx - w/2 + 0.12
        o += [b(-xe, r - 0.07, z - 0.07, xe, r + 0.07, z + 0.07, 'steelD'), b(-0.2, r - 0.15, z - 0.2, 0.2, r + 0.15, z + 0.2, 'steelD')]
        if top - 0.24 > r + 0.06:
            o += [b(sx*(rail_w - 0.06) - 0.07, r + 0.05, z - 0.4, sx*(rail_w - 0.06) + 0.07, top - 0.24, z + 0.4, 'steelD') for sx in (1, -1)]
    return o
def arch_body(x0, x1, y_bot, y_top, z0, z1, wheels, col='BODY', clear=0.1, liner='black'):
    """a body box with wheel openings: wheels is a list of (z, radius). The box above the tyres is solid, between them it comes down to y_bot,
    and each opening has a dark liner on its roof. Returns pieces."""
    ws = sorted(wheels); y_arch = max(2*r for _, r in ws) + clear*1.4
    o = [b(x0, y_arch, z0, x1, y_top, z1, col)]
    cur = z0
    for z, r in ws:
        ha = r + clear
        if z - ha - cur > 0.04: o.append(b(x0, y_bot, cur, x1, y_arch + 0.02, z - ha, col))
        o.append(b(x0, y_arch - 0.03, z - ha, x1, y_arch, z + ha, liner))
        cur = z + ha
    if z1 - cur > 0.04: o.append(b(x0, y_bot, cur, x1, y_arch + 0.02, z1, col))
    return o
def ram(p0, p1, r=0.07):
    """a hydraulic ram: a fat barrel and a shiny rod"""
    m = mixp(p0, p1, 0.55)
    return [seg(p0, m, r, r, r, r, 'steelD'), seg(m, p1, r*0.5, r*0.5, r*0.5, r*0.5, 'hydraulic')]
def track(sx, z0, z1, h, w=0.55, y0=0.0):
    """a crawler track along Z on the side sx: a rounded loop, rollers, plates as stripes"""
    x0, x1 = (0.0, w) if sx > 0 else (-w, 0.0); xc = (x0 + x1)/2
    o = [hull([(x0, y0, z0 + 0.3), (x1, y0, z0 + 0.3), (x1, y0, z1 - 0.3), (x0, y0, z1 - 0.3), (x0, y0 + h, z0), (x1, y0 + h, z0), (x1, y0 + h, z1), (x0, y0 + h, z1)], 'rubber')]
    o += [loft([[x0 - 0.01*sx, y0 + h*0.45, z, 0.16, 0.16], [x1 + 0.01*sx, y0 + h*0.45, z, 0.16, 0.16]], 'steel', ax='x', n=8) for z in [z0 + 0.35 + i*(z1 - z0 - 0.7)/4 for i in range(5)]]
    o += [loft([[x0 - 0.012*sx, y0 + h*0.55, zz, 0.3, 0.3], [x1 + 0.012*sx, y0 + h*0.55, zz, 0.3, 0.3]], 'steelD', ax='x', n=8) for zz in (z0 + 0.32, z1 - 0.32)]
    return o
def machine(name, parts, rig, wheels=None, r=0.5, w=0.3, steer=None, clips=None, note='', beacon=None):
    if wheels: parts['wheel'] = wheel(r, w); WHEELS[name] = wheels; WR[name] = [r, w]
    SPEC[name] = dict(_BUF); _BUF.clear()
    M[name] = parts; RIG[name] = rig; CLIPS[name] = clips or {}; NOTE[name] = note; STEER[name] = steer or []
    if beacon: BEACON[name] = beacon

# ================= excavator (tracked, 20 t) =================
def excavator():
    P = {}
    P['tracks'] = track(1, -2.2, 2.2, 0.85, 0.6, 0.0) + [dict(q, p=[q['p'][0] + 0.75, q['p'][1], q['p'][2]]) for q in []]
    P['tracks'] = [dict(q, p=[R4(q['p'][0] + 0.75), q['p'][1], q['p'][2]]) for q in track(1, -2.2, 2.2, 0.85, 0.6)] + [dict(q, p=[R4(q['p'][0] - 0.75), q['p'][1], q['p'][2]]) for q in track(-1, -2.2, 2.2, 0.85, 0.6)]
    P['tracks'] += [b(-0.8, 0.35, -1.6, 0.8, 0.75, 1.6, 'steelD'), loft([[0, 0.75, 0, 0.7, 0.7], [0, 0.95, 0, 0.7, 0.7]], 'steelD', n=10)]
    P['house'] = [b(-1.25, 0.95, -1.9, 1.25, 1.9, 1.3, 'BODY'), hull([(-1.25, 1.9, -1.9), (1.25, 1.9, -1.9), (1.25, 1.9, -0.9), (-1.25, 1.9, -0.9), (-1.2, 2.25, -1.85), (1.2, 2.25, -1.85), (1.2, 2.2, -1.0), (-1.2, 2.2, -1.0)], 'BODY'),
                  b(-1.3, 0.95, -2.35, 1.3, 1.75, -1.85, 'steelD'),   # counterweight
                  b(0.15, 1.9, 0.0, 1.2, 3.1, 1.3, 'BODY'), flat([(0.17, 2.0, 1.302), (1.18, 2.0, 1.302), (1.18, 3.0, 1.302), (0.17, 3.0, 1.302)], 'glass'),
                  flat([(1.202, 2.0, 0.1), (1.202, 2.0, 1.2), (1.202, 3.0, 1.2), (1.202, 3.0, 0.1)], 'glass', (1, 0, 0)), flat([(0.148, 2.0, 1.2), (0.148, 2.0, 0.1), (0.148, 3.0, 0.1), (0.148, 3.0, 1.2)], 'glass', (-1, 0, 0)),
                  b(0.1, 3.1, -0.05, 1.25, 3.16, 1.35, 'steelD'), b(-1.1, 1.9, -1.6, -0.6, 2.4, -1.4, 'black'), *[b(x, 1.4, -2.36, x + 0.25, 1.55, -2.34, 'stripeY') for x in (-1.0, -0.4, 0.2, 0.8)],
                  b(-0.35, 1.0, 0.9, 0.05, 1.6, 1.6, 'steelD'), *beacons([0.7], 3.16, 0.4)]
    # boom from its foot at (−0.15, 1.5, 1.3) up and out to (−0.15, 4.0, 4.2); stick down to (−0.15, 1.6, 5.6); bucket
    bf, bt = [-0.15, 1.5, 1.4], [-0.15, 4.2, 4.0]
    P['boom'] = [seg(bf, [-0.15, 3.6, 2.8], 0.18, 0.28, 0.16, 0.26, 'BODY'), seg([-0.15, 3.6, 2.8], bt, 0.16, 0.26, 0.14, 0.22, 'BODY')] + ram([-0.15, 1.2, 1.7], [-0.15, 3.0, 2.6], 0.09)
    st = [-0.15, 1.7, 5.4]
    P['stick'] = [seg(bt, st, 0.12, 0.2, 0.1, 0.16, 'BODY'), seg([-0.15, 4.5, 3.8], bt, 0.1, 0.15, 0.12, 0.2, 'BODY')] + ram([-0.15, 4.6, 3.3], [-0.15, 4.2, 4.6], 0.06)
    P['bucket'] = [hull([(-0.55, 1.75, 5.3), (0.25, 1.75, 5.3), (0.25, 1.75, 5.55), (-0.55, 1.75, 5.55), (-0.55, 0.95, 5.15), (0.25, 0.95, 5.15), (0.25, 1.2, 5.95), (-0.55, 1.2, 5.95)], 'steelD')] + \
                  [tip([x, 1.0, 5.9], [x, 0.85, 6.15], 0.04, 0.03, 'bucketTeeth') for x in (-0.45, -0.25, -0.05, 0.15)]
    rig = {'tracks': {'pivot': [0, 0, 0], 'note': 'scroll the tread when driving; turn on the spot by running the tracks opposite ways'},
           'house': {'parent': 'tracks', 'pivot': [0, 0.95, 0], 'turn': [0, 1, 0], 'range': [-180, 180], 'rest': 0, 'note': 'slews right round; positive turns left'},
           'boom': {'parent': 'house', 'pivot': bf, 'turn': [-1, 0, 0], 'range': [-40, 35], 'rest': 0, 'note': 'positive raises'},
           'stick': {'parent': 'boom', 'pivot': bt, 'turn': [1, 0, 0], 'range': [-60, 60], 'rest': 0, 'note': 'positive curls the stick in towards the cab'},
           'bucket': {'parent': 'stick', 'pivot': st, 'turn': [1, 0, 0], 'range': [-90, 60], 'rest': 0, 'note': 'positive curls the bucket closed (scoops)'}}
    clips = {'dig': [{'t': 0, 'boom': 10, 'stick': -40, 'bucket': -60, 'house': 0}, {'t': 1.2, 'boom': -30, 'stick': -10, 'bucket': -60}, {'t': 2.2, 'boom': -30, 'stick': 45, 'bucket': 50},
                     {'t': 3.2, 'boom': 30, 'stick': 30, 'bucket': 55}, {'t': 4.6, 'boom': 30, 'stick': 30, 'bucket': 55, 'house': 90}, {'t': 5.4, 'boom': 30, 'stick': -20, 'bucket': -80, 'house': 90},
                     {'t': 6.8, 'boom': 10, 'stick': -40, 'bucket': -60, 'house': 0}],
             'smash': [{'t': 0, 'boom': 30, 'stick': -10, 'bucket': 40}, {'t': 0.5, 'boom': -25, 'stick': 20, 'bucket': 40}, {'t': 1.4, 'boom': 30, 'stick': -10, 'bucket': 40}],
             'park': [{'t': 0, 'boom': -35, 'stick': 50, 'bucket': 55, 'house': 0}]}
    machine('excavator', P, rig, clips=clips, beacon='house', note='A 20 t tracked digger. dig loops (scoop, lift, swing 90 degrees, dump, swing back), smash knocks into a wall (its bucket breaks cells), park folds it down.')
excavator()

# ================= bulldozer =================
def bulldozer():
    P = {}
    P['body'] = [dict(q, p=[R4(q['p'][0] + 0.85), q['p'][1], q['p'][2]]) for q in track(1, -1.9, 1.9, 0.9, 0.55)] + [dict(q, p=[R4(q['p'][0] - 0.85), q['p'][1], q['p'][2]]) for q in track(-1, -1.9, 1.9, 0.9, 0.55)]
    P['body'] += [b(-0.85, 0.4, -1.8, 0.85, 1.8, 1.4, 'BODY'), hull([(-0.85, 1.8, 0.2), (0.85, 1.8, 0.2), (0.85, 1.8, 1.4), (-0.85, 1.8, 1.4), (-0.8, 1.95, 0.25), (0.8, 1.95, 0.25), (0.8, 1.85, 1.35), (-0.8, 1.85, 1.35)], 'BODY'),
                  flat([(-0.6, 1.0, 1.402), (0.6, 1.0, 1.402), (0.6, 1.6, 1.402), (-0.6, 1.6, 1.402)], 'grille'), b(0.6, 1.8, 0.8, 0.75, 2.6, 0.95, 'black'),
                  b(-0.8, 1.8, -1.6, 0.8, 3.2, 0.1, 'BODY'), *[flat([(sx*0.802, 2.0, -1.5), (sx*0.802, 2.0, 0.0), (sx*0.802, 3.05, 0.0), (sx*0.802, 3.05, -1.5)], 'glass', (sx, 0, 0)) for sx in (1, -1)],
                  flat([(-0.7, 2.0, 0.102), (0.7, 2.0, 0.102), (0.7, 3.05, 0.102), (-0.7, 3.05, 0.102)], 'glass'), b(-0.9, 3.2, -1.7, 0.9, 3.28, 0.2, 'steelD'), *beacons([0.0], 3.28, -0.8)]
    piv = [0, 0.75, -0.4]
    P['blade'] = [b(-1.35, 0.02, 2.05, 1.35, 1.35, 2.25, 'BODY'), hull([(-1.35, 0.02, 2.25), (1.35, 0.02, 2.25), (1.35, 0.02, 2.5), (-1.35, 0.02, 2.5), (-1.35, 0.25, 2.25), (1.35, 0.25, 2.25), (1.35, 0.15, 2.3), (-1.35, 0.15, 2.3)], 'steelL'),
                  *[seg([sx*1.15, 0.75, -0.4], [sx*1.15, 0.6, 2.05], 0.08, 0.1, 0.08, 0.1, 'steelD') for sx in (1, -1)]] + [p for sx in (1, -1) for p in ram([sx*0.7, 1.6, 1.0], [sx*0.7, 1.0, 2.05], 0.07)]
    P['ripper'] = [b(-0.5, 0.6, -2.3, 0.5, 0.8, -1.75, 'steelD'), seg([0, 0.7, -2.2], [0, -0.1, -2.5], 0.06, 0.1, 0.04, 0.08, 'steelD')]
    rig = {'body': {'pivot': [0, 0, 0], 'note': 'tracks scroll when driving'},
           'blade': {'parent': 'body', 'pivot': piv, 'turn': [-1, 0, 0], 'range': [-6, 18], 'rest': 0, 'note': 'positive lifts the blade, negative digs it in'},
           'ripper': {'parent': 'body', 'pivot': [0, 0.7, -1.9], 'turn': [1, 0, 0], 'range': [-20, 25], 'rest': 0, 'note': 'positive drops the ripper tooth into the ground'}}
    clips = {'push': [{'t': 0, 'blade': 0}, {'t': 0.6, 'blade': -4}, {'t': 3.0, 'blade': -4}, {'t': 3.6, 'blade': 12}], 'carry': [{'t': 0, 'blade': 12}]}
    machine('bulldozer', P, rig, clips=clips, beacon='body', note='A crawler dozer with a 2.7 m blade. push lowers the blade to shove rubble, cars and walls (blade lifts at the end).')
bulldozer()

# ================= trucks (cab over a chassis) =================
def truck_base(zf=3.6, zb=2.0, W=1.2, axles=(2.7, -1.6, -2.9), r=0.52, roof=3.05, rear=-3.6, col='BODY', w=0.42):
    """a truck: rails whose top is at y = 2r + 0.16, the cab floor on them, axles, springs, fenders over every wheel (tied to the rails or the cab sill),
    a front fascia and bumper, a rear cross-bar with the tail lights, and mud flaps behind the last axle. Wheel points are returned."""
    top = round(2*r + 0.16, 3); wx = round(W - 0.22, 3); fo = round(wx + w/2 + 0.1, 3)
    o = cab(zf, zb, W, top, roof, col) + undercarriage(axles, wx, r, w, top, rear, zf - 0.3)
    fz = max(0.12, min(0.3, zf - (max(axles) + r) - 0.03))
    o += [b(-W + 0.05, top - 0.14, zb, W - 0.05, top, zf - fz, 'steelD'),                                  # the sill under the cab
          b(-W, top - 0.35, zf - fz, W, top, zf, col), b(-W - 0.05, top - 0.58, zf - fz*0.5, W + 0.05, top - 0.28, zf + 0.18, 'black'),   # fascia and bumper
          b(-W - 0.02, top - 0.3, rear, W + 0.02, top - 0.05, rear + 0.1, 'steelD')]                      # rear cross-bar
    for z in axles:
        o += [b(sx*0.45, top - 0.14, z - r - 0.1, sx*fo, top - 0.05, z + r + 0.1, 'black') for sx in (1, -1)]   # fenders
    zl = min(axles)
    o += [b(sx*(wx - 0.2), 0.45, zl - r - 0.12, sx*(wx + 0.2), top - 0.05, zl - r - 0.08, 'black') for sx in (1, -1)]   # mud flaps
    o += [b(sx*(W - 0.1), top - 0.3, zb + 0.35, sx*(W + 0.22), top - 0.2, zb + 0.95, 'steelD') for sx in (1, -1)]       # cab steps
    o += [b(sx*(W - 0.1), top - 0.3, zb + 0.35, sx*(W + 0.0), top, zb + 0.95, 'steelD') for sx in (1, -1)]
    o += tails(W - 0.05, top - 0.3, rear)
    zs = sorted(axles)
    _BUF.clear(); _BUF.update({'width': round(2*W + 0.1, 2), 'wheelR': r, 'wheelW': w, 'axles': sorted(axles, reverse=True), 'track': wx, 'archClear': 0.02, 'ground': 0.0,
        'roof': {'y': roof, 'z': round((zb + zf - 0.35)/2, 3), 'w': round(2*W - 0.1, 2), 'd': round(zf - 0.35 - zb, 2)}, 'nose': round(zf + 0.18, 2), 'tail': rear, 'bumperY': round(top - 0.43, 3), 'rearY': round(top - 0.18, 3),
        'frameTop': top, 'cabBack': zb, 'cabFront': zf, 'length': round(zf + 0.18 - rear, 2)})
    if len(zs) > 1: _BUF['side'] = {'y': round(top - 0.1, 3), 'z': round((zs[-1] + zs[-2])/2 + 0.0, 3), 'd': round(zs[-1] - zs[-2] - 2*r - 0.3, 2), 'x': 0.5}
    return o, [[sx*wx, r, z] for z in axles for sx in (1, -1)]
def dump_truck():
    P = {}; base, wh = truck_base(); P['body'] = base + [b(-0.9, 1.2, -3.5, 0.9, 1.3, 1.6, 'steelD')]
    hz = -3.5; hy = 1.25
    P['bed'] = [b(-1.25, 1.3, -3.6, 1.25, 1.4, 1.7, 'BODY'), *[b(sx*1.25 - 0.05*sx, 1.4, -3.6, sx*1.25 + 0.05*sx, 2.6, 1.7, 'BODY') for sx in (1, -1)],
                hull([(-1.25, 1.4, 1.6), (1.25, 1.4, 1.6), (1.25, 1.4, 1.75), (-1.25, 1.4, 1.75), (-1.25, 2.8, 1.75), (1.25, 2.8, 1.75), (1.25, 2.8, 2.5), (-1.25, 2.8, 2.5)], 'BODY'),
                b(-1.25, 1.4, -3.7, 1.25, 2.5, -3.6, 'BODY'), *[b(sx*1.32, 1.5, z - 0.05, sx*1.37, 2.5, z + 0.05, 'steelD') for sx in (1, -1) for z in (-2.5, -1.0, 0.5)],
                b(-1.0, 1.4, -2.8, 1.0, 1.9, 1.2, 'dirt')] + ram([0, 1.0, 1.4], [0, 1.4, 1.2], 0.1)
    rig = {'body': {'pivot': [0, 0, 0]}, 'bed': {'parent': 'body', 'pivot': [0, hy, hz], 'turn': [-1, 0, 0], 'range': [0, 52], 'rest': 0, 'note': 'positive tips the bed up at the front (hinged at the back); hide the dirt piece once tipped past 30'}}
    machine('dump_truck', P, rig, wh, 0.52, 0.42, steer=[0, 1], clips={'tip': [{'t': 0, 'bed': 0}, {'t': 3.0, 'bed': 52}, {'t': 5.0, 'bed': 52}, {'t': 7.0, 'bed': 0}]},
            note='A tipper. tip raises the bed and lowers it again; the load slides off between 30 and 52 degrees.')
dump_truck()
def cement_mixer():
    P = {}; base, wh = truck_base(); P['body'] = base + [b(-0.4, 1.1, -3.55, 0.4, 2.0, -3.0, 'steelD'), b(-0.3, 1.1, 1.0, 0.3, 2.4, 1.7, 'steelD'), b(-0.9, 1.1, 0.6, 0.9, 1.4, 1.9, 'steelD')]
    ax = [0, 2.35, -1.0]
    P['drum'] = [loft([[0, 2.35, 1.6, 0.4, 0.4], [0, 2.35, 0.6, 1.05, 1.05], [0, 2.35, -1.4, 1.15, 1.15], [0, 2.35, -2.9, 0.75, 0.75], [0, 2.35, -3.4, 0.45, 0.45]], 'drum', ax='z', n=10)] + \
                [flat([(math.cos(a)*1.16, 2.35 + math.sin(a)*1.16, -1.4 - 0.3 + i*0.0), (math.cos(a + 0.4)*1.16, 2.35 + math.sin(a + 0.4)*1.16, -1.4 + 0.3), (math.cos(a + 0.6)*1.0, 2.35 + math.sin(a + 0.6)*1.0, 0.6), (math.cos(a + 0.2)*1.0, 2.35 + math.sin(a + 0.2)*1.0, 0.4)], 'stripeR', (math.cos(a), math.sin(a), 0)) for i, a in enumerate((0.3, 2.4, 4.5))]
    P['chute'] = [hull([(-0.18, 1.5, -3.5), (0.18, 1.5, -3.5), (0.18, 1.5, -3.55), (-0.18, 1.5, -3.55), (-0.18, 1.2, -4.9), (0.18, 1.2, -4.9), (0.18, 1.3, -4.9), (-0.18, 1.3, -4.9)], 'steel')]
    rig = {'body': {'pivot': [0, 0, 0]},
           'drum': {'parent': 'body', 'pivot': ax, 'fixed': [-12, 0, 0], 'turn': [0, 0, 1], 'range': [-360, 360], 'rest': 0, 'note': 'spins about its own long axis (tilted 12 degrees, mouth up at the back): about 15 turns a minute while mixing, fast backwards to pour'},
           'chute': {'parent': 'body', 'pivot': [0, 1.5, -3.5], 'turn': [0, 1, 0], 'range': [-90, 90], 'rest': 0, 'note': 'swings left and right to aim the pour'}}
    machine('cement_mixer', P, rig, wh, 0.52, 0.42, steer=[0, 1], clips={'mix': [{'t': 0, 'drum': 0}, {'t': 4, 'drum': 360}], 'pour': [{'t': 0, 'drum': 0, 'chute': 0}, {'t': 1, 'chute': 45}, {'t': 3, 'drum': -720, 'chute': 45}]},
            note='A concrete mixer. mix loops the drum slowly; pour swings the chute and spins the drum the other way.')
cement_mixer()
def garbage_truck():
    P = {}; base, wh = truck_base(); P['body'] = base + [b(-1.2, 1.1, -2.6, 1.2, 3.3, 1.9, 'BODY'), *stripe(1.2, 1.4, 1.6, -2.5, 1.8, 'white'), b(-1.22, 3.3, -2.6, 1.22, 3.4, 1.9, 'steelD'), *beacons([0.9, -0.9], 3.05, 3.0)]
    P['tailgate'] = [hull([(-1.2, 1.0, -2.6), (1.2, 1.0, -2.6), (1.2, 1.0, -4.0), (-1.2, 1.0, -4.0), (-1.2, 3.3, -2.6), (1.2, 3.3, -2.6), (1.2, 2.6, -3.6), (-1.2, 2.6, -3.6)], 'BODY'),
                     flat([(-0.9, 1.02, -3.8), (0.9, 1.02, -3.8), (0.9, 1.6, -3.95), (-0.9, 1.6, -3.95)], 'black', (0, 0.3, -1)), *[b(sx*1.0, 1.2, -3.95, sx*1.15, 1.3, -3.85, 'tail', **G) for sx in (1, -1)],
                     *[flat([(x, 1.7, -3.8), (x + 0.2, 1.7, -3.8), (x + 0.45, 2.3, -3.6), (x + 0.25, 2.3, -3.6)], 'stripeY', (0, 0.3, -1)) for x in (-1.1, -0.5, 0.1, 0.7)]]
    P['arm'] = [seg([-1.2, 1.3, 0.6], [-2.1, 1.0, 0.6], 0.08, 0.08, 0.06, 0.06, 'steelD'), b(-2.4, 0.4, 0.3, -2.0, 1.2, 0.9, 'bin'), b(-2.42, 1.2, 0.28, -1.98, 1.26, 0.92, 'binD')]
    rig = {'body': {'pivot': [0, 0, 0]},
           'tailgate': {'parent': 'body', 'pivot': [0, 3.3, -2.6], 'turn': [-1, 0, 0], 'range': [0, 70], 'rest': 0, 'note': 'positive swings the rear hopper up to dump the load'},
           'arm': {'parent': 'body', 'pivot': [-1.2, 1.3, 0.6], 'turn': [0, 0, -1], 'range': [0, 150], 'rest': 0, 'note': 'the side arm on the right: positive lifts a wheelie bin up and over into the body'}}
    machine('garbage_truck', P, rig, wh, 0.52, 0.42, steer=[0, 1], beacon='body',
            clips={'pick_bin': [{'t': 0, 'arm': 0}, {'t': 1.5, 'arm': 150}, {'t': 2.3, 'arm': 150}, {'t': 3.8, 'arm': 0}], 'unload': [{'t': 0, 'tailgate': 0}, {'t': 3, 'tailgate': 70}, {'t': 6, 'tailgate': 70}, {'t': 9, 'tailgate': 0}]},
            note='A refuse truck with a side-loader arm on the right (holding a bin) and a rear hopper. Bins searched or taken by it are props.street.trash_bin.')
garbage_truck()
def fire_truck():
    P = {}; base, wh = truck_base(zf=3.8, zb=1.6, roof=3.0); P['body'] = base + [b(-1.25, 1.1, -3.6, 1.25, 2.7, 1.5, 'BODY'), *stripe(1.25, 1.3, 1.45, -3.5, 3.7, 'white'),
        *[flat([(sx*1.252, 1.6, z0 if sx > 0 else z1), (sx*1.252, 1.6, z1 if sx > 0 else z0), (sx*1.252, 2.5, z1 if sx > 0 else z0), (sx*1.252, 2.5, z0 if sx > 0 else z1)], 'chrome', (sx, 0, 0)) for sx in (1, -1) for z0, z1 in ((-3.4, -2.2), (-2.0, -0.8), (-0.6, 0.6))],
        b(-1.25, 2.7, -3.6, 1.25, 2.8, 1.5, 'steelD'), *beacons([1.0, 0.35, -0.35, -1.0], 3.0, 3.1, 'beaconR'), *[b(sx*1.0, 0.9, -3.65, sx*1.2, 1.1, -3.6, 'beaconR', **G) for sx in (1, -1)],
        *[b(sx*1.15, 0.3, -2.8, sx*1.6, 1.1, -2.6, 'steelD') for sx in (1, -1)]]
    P['outrigger_l'] = [b(1.25, 0.5, -3.0, 2.2, 0.7, -2.6, 'steelD'), b(2.05, 0.0, -3.05, 2.35, 0.55, -2.55, 'steelD')]
    P['outrigger_r'] = [b(-2.2, 0.5, -3.0, -1.25, 0.7, -2.6, 'steelD'), b(-2.35, 0.0, -3.05, -2.05, 0.55, -2.55, 'steelD')]
    P['turntable'] = [loft([[0, 2.8, -2.6, 0.6, 0.6], [0, 3.1, -2.6, 0.6, 0.6]], 'steel', n=10), b(-0.4, 3.0, -2.9, 0.4, 3.5, -2.3, 'BODY')]
    def ladder(z0, z1, y, w, c='ladder'):
        o = [b(sx*w - 0.04, y, z0, sx*w + 0.04, y + 0.18, z1, c) for sx in (1, -1)]
        o += [b(-w, y + 0.02, z, w, y + 0.06, z + 0.04, c) for z in [z0 + 0.15 + i*0.35 for i in range(int((z1 - z0)/0.35))]]
        return o
    P['ladder'] = ladder(-3.0, 4.0, 3.2, 0.42) + ram([0, 3.0, -2.2], [0, 3.15, -1.0], 0.08)
    P['ladder_fly'] = ladder(-2.8, 4.2, 3.25, 0.34, 'chrome') + [b(-0.35, 3.25, 4.1, 0.35, 3.75, 4.3, 'steelD')]
    rig = {'body': {'pivot': [0, 0, 0]},
           'outrigger_l': {'parent': 'body', 'slide': [1, 0, 0], 'pivot': [0, 0, 0], 'range': [-0.9, 0], 'rest': -0.9, 'note': 'slides out (0) before the ladder lifts; -0.9 is stowed'},
           'outrigger_r': {'parent': 'body', 'slide': [-1, 0, 0], 'pivot': [0, 0, 0], 'range': [-0.9, 0], 'rest': -0.9},
           'turntable': {'parent': 'body', 'pivot': [0, 2.8, -2.6], 'turn': [0, 1, 0], 'range': [-180, 180], 'rest': 0, 'note': 'positive turns the ladder left'},
           'ladder': {'parent': 'turntable', 'pivot': [0, 3.2, -3.0], 'turn': [-1, 0, 0], 'range': [0, 75], 'rest': 0, 'note': 'positive raises the ladder'},
           'ladder_fly': {'parent': 'ladder', 'slide': [0, 0, 1], 'pivot': [0, 3.25, -2.8], 'range': [0, 6.5], 'rest': 0, 'note': 'extends along the ladder, up to 6.5 m: about 18 m of reach with the ladder at 75 degrees'}}
    machine('fire_truck', P, rig, wh, 0.52, 0.42, steer=[0, 1], beacon='body',
            clips={'raise': [{'t': 0, 'outrigger_l': -0.9, 'outrigger_r': -0.9, 'ladder': 0, 'ladder_fly': 0}, {'t': 2, 'outrigger_l': 0, 'outrigger_r': 0}, {'t': 5, 'ladder': 65, 'turntable': 30}, {'t': 8, 'ladder_fly': 6.5}]},
            note='A ladder truck. raise puts the outriggers down, lifts and turns the ladder and runs it out: a way up to a roof or a high window.')
fire_truck()
def ambulance():
    P = {}; W = 1.1
    P['body'] = cab(3.2, 1.9, 1.0, 0.98, 2.5, 'BODY', 0.5) + undercarriage((2.4, -2.0), 0.84, 0.42, 0.3, 0.98, -3.0, 2.9, 0.45) + [b(-0.95, 0.74, 2.9, 0.95, 0.98, 3.2, 'black'), b(-1.05, 0.55, 3.0, 1.05, 0.8, 3.3, 'black'), *arch_body(-W, W, 0.55, 2.95, -3.0, 1.9, [(-2.0, 0.42)]), *stripe(W, 1.05, 1.25, -2.9, 1.8, 'stripeR'), *stripe(W, 1.25, 1.33, -2.9, 1.8, 'stripeY'),
        *[p for sx in (1, -1) for p in [flat([(sx*(W + 0.004), 1.7, -0.6 + (0.25 if sx > 0 else -0.25)), (sx*(W + 0.004), 1.7, -0.6 - (0.25 if sx > 0 else -0.25)), (sx*(W + 0.004), 2.5, -0.6 - (0.25 if sx > 0 else -0.25)), (sx*(W + 0.004), 2.5, -0.6 + (0.25 if sx > 0 else -0.25))], 'stripeR', (sx, 0, 0)),
                                      flat([(sx*(W + 0.005), 2.0, -0.2 if sx > 0 else -1.0), (sx*(W + 0.005), 2.0, -1.0 if sx > 0 else -0.2), (sx*(W + 0.005), 2.2, -1.0 if sx > 0 else -0.2), (sx*(W + 0.005), 2.2, -0.2 if sx > 0 else -1.0)], 'stripeR', (sx, 0, 0))]],
        b(-W, 2.95, -3.0, W, 3.0, 1.9, 'whiteD'), *beacons([0.85, -0.85], 2.95, 1.75, 'beaconR'), *beacons([0.3, -0.3], 2.95, 1.75, 'beaconB'), *tails(W, 0.8, -3.0), b(-W - 0.02, 0.4, -3.05, W + 0.02, 0.6, -3.0, 'black')]
    P['door_rl'] = [b(0.0, 0.6, -3.04, W - 0.02, 2.85, -3.0, 'BODY'), flat([(0.15, 1.9, -3.042), (W - 0.15, 1.9, -3.042), (W - 0.15, 2.6, -3.042), (0.15, 2.6, -3.042)], 'glass', (0, 0, -1))]
    P['door_rr'] = [b(-W + 0.02, 0.6, -3.04, 0.0, 2.85, -3.0, 'BODY'), flat([(-W + 0.15, 1.9, -3.042), (-0.15, 1.9, -3.042), (-0.15, 2.6, -3.042), (-W + 0.15, 2.6, -3.042)], 'glass', (0, 0, -1))]
    rig = {'body': {'pivot': [0, 0, 0]},
           'door_rl': {'parent': 'body', 'pivot': [W, 0, -3.02], 'turn': [0, -1, 0], 'range': [0, 170], 'rest': 0, 'note': 'rear doors swing out on their outer hinges'},
           'door_rr': {'parent': 'body', 'pivot': [-W, 0, -3.02], 'turn': [0, 1, 0], 'range': [0, 170], 'rest': 0}}
    machine('ambulance', P, rig, [[sx*0.84, 0.42, z] for z in (2.4, -2.0) for sx in (1, -1)], 0.42, 0.3, steer=[0, 1], beacon='body',
            clips={'open': [{'t': 0, 'door_rl': 0, 'door_rr': 0}, {'t': 1, 'door_rl': 160, 'door_rr': 160}]}, note='A box ambulance. Its back is a good search: medical supplies.')
ambulance()
def tow_truck():
    P = {}; base, wh = truck_base(zf=3.0, zb=1.5, axles=(2.2, -1.5), roof=2.75, rear=-2.8)
    P['body'] = base + [b(-1.15, 1.0, -2.8, 1.15, 1.1, 1.4, 'BODY'), *[b(sx*1.1, 1.1, -2.8, sx*1.15, 1.6, 1.4, 'BODY') for sx in (1, -1)], b(-0.3, 1.1, -0.8, 0.3, 2.0, -0.4, 'steelD'), *beacons([0.6, 0.0, -0.6], 2.75, 2.3)]
    P['boom'] = [seg([0, 1.9, -0.6], [0, 2.4, -3.0], 0.12, 0.12, 0.1, 0.1, 'BODY'), loft([[0.0, 2.4, -3.0, 0.12, 0.12], [0.0, 2.4, -3.0, 0.12, 0.12]], 'steel', ax='x', n=8)] + ram([0, 1.3, -0.9], [0, 2.0, -2.0], 0.06)
    P['hook'] = [seg([0, 2.3, -3.0], [0, 1.0, -3.0], 0.01, 0.01, 0.01, 0.01, 'cable'), b(-0.06, 0.82, -3.06, 0.06, 1.0, -2.94, 'hook')]
    P['lift'] = [b(-0.1, 0.6, -3.0, 0.1, 1.0, -2.8, 'steelD'), b(-0.12, 0.45, -2.8, 0.12, 0.6, -4.0, 'steelD'), b(-0.9, 0.35, -4.1, 0.9, 0.5, -3.9, 'steelD'), *[b(sx*0.75, 0.35, -4.4, sx*0.9, 0.5, -3.9, 'warn') for sx in (1, -1)]]
    rig = {'body': {'pivot': [0, 0, 0]},
           'boom': {'parent': 'body', 'pivot': [0, 1.9, -0.6], 'turn': [-1, 0, 0], 'range': [-10, 35], 'rest': 0, 'note': 'positive raises the crane boom'},
           'hook': {'parent': 'boom', 'slide': [0, -1, 0], 'pivot': [0, 2.3, -3.0], 'range': [-1.2, 1.5], 'rest': 0, 'note': 'winches the hook down (keep the cable vertical when the boom moves)'},
           'lift': {'parent': 'body', 'slide': [0, 1, 0], 'pivot': [0, 0, 0], 'range': [0, 0.6], 'rest': 0, 'note': 'the wheel-lift under the back raises a towed car by its front wheels'}}
    machine('tow_truck', P, rig, wh, 0.48, 0.36, steer=[0, 1], beacon='body',
            clips={'hook_up': [{'t': 0, 'lift': 0, 'boom': 0}, {'t': 2, 'lift': 0.6, 'boom': 10}]},
            note='A wrecker. hook_up raises the wheel-lift: put a wrecked car behind with its front wheels on the lift to tow it (the game moves the car with the truck).')
tow_truck()
def mobile_crane():
    P = {}; W = 1.3; axles = (3.2, 1.9, -1.6, -2.9)
    P['body'] = [dict(q, p=[R4(q['p'][0] + 0.65), q['p'][1], q['p'][2]]) for q in cab(5.1, 3.9, 0.6, 1.26, 2.9, 'BODY', 0.3)] + \
        [*arch_body(-W, W, 0.7, 1.5, -4.0, 3.9, [(z, 0.55) for z in axles]), *undercarriage(axles, 1.05, 0.55, 0.45, 1.26, -3.9, 3.8, 0.55), b(-W, 1.5, -3.8, W, 1.6, 3.4, 'steelD'),
         *stripe(W, 0.8, 1.0, -3.9, 3.5, 'warn'), *tails(W, 0.8, -4.0), *beacons([0.25], 2.9, 4.2)]
    P['outriggers'] = [b(sx*W, 0.9, z - 0.2, sx*(W + 1.6), 1.15, z + 0.2, 'steelD') for sx in (1, -1) for z in (-3.4, 2.8)] + [b(sx*(W + 1.4), 0.0, z - 0.3, sx*(W + 1.8), 0.95, z + 0.3, 'warn') for sx in (1, -1) for z in (-3.4, 2.8)]
    P['turntable'] = [loft([[0, 1.6, -1.8, 1.1, 1.1], [0, 1.85, -1.8, 1.1, 1.1]], 'steelD', n=12), b(-1.2, 1.85, -3.4, 1.2, 2.9, -0.4, 'BODY'), b(-1.25, 1.85, -3.8, 1.25, 2.6, -3.3, 'steelD'),
                      b(0.55, 1.85, -0.9, 1.25, 3.4, 0.4, 'BODY'), flat([(0.57, 2.3, 0.402), (1.23, 2.3, 0.402), (1.23, 3.3, 0.402), (0.57, 3.3, 0.402)], 'glass')]
    bp = [0, 2.6, -1.0]
    P['boom'] = [seg([0, 2.6, -1.4], [0, 2.75, 7.5], 0.35, 0.4, 0.3, 0.32, 'BODY')] + ram([0, 1.9, -0.6], [0, 2.4, 1.6], 0.14)
    P['boom_ext'] = [seg([0, 2.64, 0.5], [0, 2.8, 13.0], 0.24, 0.26, 0.22, 0.24, 'BODY'), loft([[-0.3, 2.8, 12.9, 0.22, 0.22], [0.3, 2.8, 12.9, 0.22, 0.22]], 'steelD', ax='x', n=8)]
    P['hook'] = [seg([0, 2.6, 12.9], [0, 0.9, 12.9], 0.012, 0.012, 0.012, 0.012, 'cable'), hull([(-0.2, 0.5, 12.8), (0.2, 0.5, 12.8), (0.2, 0.5, 13.0), (-0.2, 0.5, 13.0), (-0.15, 0.9, 12.82), (0.15, 0.9, 12.82), (0.15, 0.9, 12.98), (-0.15, 0.9, 12.98)], 'hook'),
                 seg([0, 0.5, 12.9], [0, 0.25, 13.05], 0.03, 0.03, 0.025, 0.025, 'steelD')]
    rig = {'body': {'pivot': [0, 0, 0]},
           'outriggers': {'parent': 'body', 'slide': [0, 1, 0], 'pivot': [0, 0, 0], 'range': [0, 0.3], 'rest': 0.3, 'note': 'down on the ground at 0, stowed at 0.3 (also slide them in sideways by 1.4 m when driving)'},
           'turntable': {'parent': 'body', 'pivot': [0, 1.6, -1.8], 'turn': [0, 1, 0], 'range': [-180, 180], 'rest': 180, 'note': 'parked facing back over the cab at 180'},
           'boom': {'parent': 'turntable', 'pivot': bp, 'turn': [-1, 0, 0], 'range': [0, 78], 'rest': 0, 'note': 'positive raises'},
           'boom_ext': {'parent': 'boom', 'slide': [0, 0.0137, 0.9999], 'pivot': [0, 2.72, 7.2], 'range': [0, 6.5], 'rest': 0, 'note': 'telescopes out along the boom (it sits inside the boom at rest)'},
           'hook': {'parent': 'boom_ext', 'slide': [0, -1, 0], 'pivot': [0, 2.8, 12.9], 'range': [-1.5, 20], 'rest': 0, 'note': 'the hook hangs straight down from the boom tip: undo the boom angle so the cable stays vertical'}}
    machine('mobile_crane', P, rig, [[sx*1.05, 0.55, z] for z in axles for sx in (1, -1)], 0.55, 0.45, steer=[0, 1, 2, 3], beacon='body',
            clips={'lift': [{'t': 0, 'outriggers': 0.3, 'turntable': 180, 'boom': 0, 'boom_ext': 0}, {'t': 2, 'outriggers': 0}, {'t': 5, 'turntable': 90, 'boom': 45}, {'t': 8, 'boom_ext': 6.5, 'hook': 6}]},
            note='A four-axle all-terrain crane, 13 m of boom extending to about 20 m. lift sets the outriggers, swings, raises and runs out the boom.')
mobile_crane()
def bucket_truck():
    P = {}; base, wh = truck_base(zf=3.0, zb=1.6, axles=(2.2, -1.8), roof=2.8, rear=-3.0)
    P['body'] = base + [b(-1.15, 1.1, -3.0, 1.15, 1.9, 1.5, 'BODY'), *[b(sx*0.95, 1.9, -2.9, sx*1.15, 2.1, 1.4, 'steelD') for sx in (1, -1)], *beacons([0.6, -0.6], 2.8, 2.3), *stripe(1.15, 1.2, 1.35, -2.9, 1.4, 'warn')]
    P['turret'] = [loft([[0, 1.9, -1.8, 0.45, 0.45], [0, 2.3, -1.8, 0.4, 0.4]], 'steelD', n=8)]
    P['boom_lower'] = [seg([0, 2.3, -1.8], [0, 2.4, 2.4], 0.16, 0.2, 0.14, 0.18, 'white')] + ram([0, 2.0, -1.4], [0, 2.4, -0.2], 0.06)
    P['boom_upper'] = [seg([0, 2.45, 2.4], [0, 2.5, -2.6], 0.12, 0.15, 0.1, 0.12, 'white')]
    P['bucket'] = [b(-0.4, 2.0, -3.3, 0.4, 3.1, -2.5, 'warn'), b(-0.42, 3.0, -3.32, 0.42, 3.1, -2.48, 'warnD')]
    rig = {'body': {'pivot': [0, 0, 0]},
           'turret': {'parent': 'body', 'pivot': [0, 1.9, -1.8], 'turn': [0, 1, 0], 'range': [-180, 180], 'rest': 0},
           'boom_lower': {'parent': 'turret', 'pivot': [0, 2.3, -1.8], 'turn': [-1, 0, 0], 'range': [0, 80], 'rest': 0, 'note': 'positive raises the lower boom (it lies forward over the cab at rest)'},
           'boom_upper': {'parent': 'boom_lower', 'pivot': [0, 2.45, 2.4], 'turn': [1, 0, 0], 'range': [0, 160], 'rest': 0, 'note': 'unfolds the upper boom (it lies back along the lower one at rest)'},
           'bucket': {'parent': 'boom_upper', 'pivot': [0, 2.5, -2.6], 'turn': [-1, 0, 0], 'range': [-180, 180], 'rest': 0, 'note': 'keep the bucket level: set it to minus the sum of the two boom angles'}}
    machine('bucket_truck', P, rig, wh, 0.48, 0.36, steer=[0, 1], beacon='body',
            clips={'reach': [{'t': 0, 'boom_lower': 0, 'boom_upper': 0, 'bucket': 0}, {'t': 3, 'boom_lower': 60, 'boom_upper': 100, 'bucket': -160, 'turret': 40}]},
            note='A utility cherry picker for reaching power lines and roofs (power repair jobs). Keep the bucket level as the booms move.')
bucket_truck()
def forklift():
    P = {}
    P['body'] = [*arch_body(-0.55, 0.55, 0.25, 1.05, -1.2, 0.6, [(0.35, 0.3), (-1.0, 0.26)]), b(-0.45, 0.25, 0.55, 0.45, 0.8, 0.78, 'steelD'), *undercarriage([0.35, -1.0], 0.5, 0.3, 0.22, 0.74, -1.3, 0.6, 0.25), b(-0.6, 0.25, -1.5, 0.6, 1.0, -1.1, 'steelD'), b(-0.3, 1.05, -0.6, 0.3, 1.3, 0.0, 'seat'),
                 *[seg([sx*0.5, 1.05, z], [sx*0.5, 2.15, z], 0.03, 0.03, 0.03, 0.03, 'steelD') for sx in (1, -1) for z in (-1.0, 0.45)], b(-0.55, 2.15, -1.05, 0.55, 2.2, 0.5, 'steelD'),
                 *beacons([0.0], 2.2, -0.5), seg([0.0, 1.0, 0.3], [0.0, 1.5, 0.2], 0.02, 0.02, 0.02, 0.02, 'black'), loft([[0.0, 1.5, 0.2, 0.15, 0.15], [0.0, 1.53, 0.2, 0.15, 0.15]], 'black', n=8)]
    P['mast'] = [b(sx*0.38 - 0.05, 0.2, 0.7, sx*0.38 + 0.05, 2.3, 0.8, 'steelD') for sx in (1, -1)] + [b(-0.38, 2.2, 0.7, 0.38, 2.3, 0.8, 'steelD')] + ram([0, 0.4, 0.62], [0, 1.8, 0.62], 0.05)
    P['carriage'] = [b(-0.45, 0.15, 0.82, 0.45, 0.65, 0.9, 'steel')] + [b(sx*0.25 - 0.05, 0.05, 0.9, sx*0.25 + 0.05, 0.1, 2.0, 'steelD') for sx in (1, -1)] + [b(sx*0.25 - 0.05, 0.05, 0.85, sx*0.25 + 0.05, 0.6, 0.92, 'steelD') for sx in (1, -1)]
    P['pallet'] = [b(-0.6, 0.12, 0.95, 0.6, 0.15, 2.15, 'pallet'), *[b(-0.6, 0.0, z - 0.05, 0.6, 0.12, z + 0.05, 'pallet') for z in (1.0, 1.55, 2.1)], b(-0.55, 0.15, 1.0, 0.55, 0.8, 2.1, 'drum')]
    rig = {'body': {'pivot': [0, 0, 0], 'note': 'steers with its back wheels'},
           'mast': {'parent': 'body', 'pivot': [0, 0.2, 0.75], 'turn': [1, 0, 0], 'range': [-6, 10], 'rest': 0, 'note': 'positive tilts the mast back to cradle a load'},
           'carriage': {'parent': 'mast', 'slide': [0, 1, 0], 'pivot': [0, 0, 0], 'range': [0, 1.6], 'rest': 0, 'note': 'lifts the forks'},
           'pallet': {'parent': 'carriage', 'pivot': [0, 0, 0], 'note': 'optional: a loaded pallet on the forks'}}
    machine('forklift', P, rig, [[sx*0.5, 0.3, 0.35] for sx in (1, -1)] + [[sx*0.48, 0.26, -1.0] for sx in (1, -1)], 0.3, 0.22, steer=[2, 3],
            clips={'lift': [{'t': 0, 'carriage': 0, 'mast': 0}, {'t': 1, 'mast': 6}, {'t': 3, 'carriage': 1.6}]}, note='A warehouse forklift: moves pallets, crates and barricades.')
forklift()
def road_roller():
    P = {}
    P['body'] = [*arch_body(-0.8, 0.8, 0.5, 1.5, -1.9, 0.3, [(-1.2, 0.55)]), *undercarriage([-1.2], 0.75, 0.55, 0.45, 1.0, -1.9, 0.3, 0.4), b(-0.5, 0.6, 0.25, 0.5, 1.2, 0.5, 'steelD'), b(-0.4, 1.5, -1.2, 0.4, 1.8, -0.4, 'seat'), *[seg([sx*0.7, 1.5, z], [sx*0.7, 2.6, z], 0.03, 0.03, 0.03, 0.03, 'black') for sx in (1, -1) for z in (-1.7, -0.2)],
                 b(-0.8, 2.6, -1.85, 0.8, 2.66, 0.0, 'BODY'), *beacons([0.0], 2.66, -0.9), *tails(0.8, 0.8, -1.9)]
    P['front'] = [b(-1.0, 0.95, 0.4, 1.0, 1.3, 1.9, 'BODY'), *[b(sx*1.0 - 0.06*sx, 0.4, 0.5, sx*1.0, 1.0, 1.8, 'BODY') for sx in (1, -1)]]
    P['drum'] = [loft([[-0.9, 0.0, 0.0, 0.62, 0.62], [0.9, 0.0, 0.0, 0.62, 0.62]], 'steelL', ax='x', n=12), loft([[-0.91, 0, 0, 0.3, 0.3], [0.91, 0, 0, 0.3, 0.3]], 'steelD', ax='x', n=8)]
    P['drum'] = [dict(q, p=[q['p'][0], R4(q['p'][1] + 0.62), R4(q['p'][2] + 1.15)]) for q in P['drum']]
    rig = {'body': {'pivot': [0, 0, 0]},
           'front': {'parent': 'body', 'pivot': [0, 0.6, 0.35], 'turn': [0, 1, 0], 'range': [-35, 35], 'rest': 0, 'note': 'articulated steering: the front frame with the drum turns about the middle'},
           'drum': {'parent': 'front', 'pivot': [0, 0.62, 1.15], 'turn': [1, 0, 0], 'range': [-36000, 36000], 'rest': 0, 'note': 'rolls: 360 degrees per 3.9 m driven'}}
    machine('road_roller', P, rig, [[sx*0.75, 0.55, -1.2] for sx in (1, -1)], 0.55, 0.45, note='A tandem road roller: a steel drum at the front on an articulated frame, rubber wheels behind.')
road_roller()
def street_sweeper():
    P = {}; base, wh = truck_base(zf=2.4, zb=1.2, W=1.0, axles=(1.8, -1.6), roof=2.6, rear=-2.6, r=0.42)
    P['body'] = base + [b(-1.0, 0.8, -2.6, 1.0, 2.3, 1.1, 'BODY'), *stripe(1.0, 1.0, 1.15, -2.5, 1.0, 'white'), *beacons([0.6, -0.6], 2.6, 1.9),
                         *[b(sx*0.45, 0.5, -0.26, sx*0.85, 0.8, -0.14, 'steelD') for sx in (1, -1)]]
    P['hopper'] = [b(-0.95, 1.0, -2.65, 0.95, 2.25, -1.4, 'BODY')]
    for sx, nm in ((1, 'brush_l'), (-1, 'brush_r')):
        c = [sx*0.95, 0.06, 2.5]
        P[nm] = [loft([[c[0], 0.0, c[2], 0.45, 0.45], [c[0], 0.08, c[2], 0.4, 0.4]], 'brushL', n=10)] + [tip([c[0] + 0.3*math.cos(a), 0.04, c[2] + 0.3*math.sin(a)], [c[0] + 0.5*math.cos(a), 0.0, c[2] + 0.5*math.sin(a)], 0.03, 0.02, 'brush') for a in [k*0.785 for k in range(8)]] + \
                 [seg([c[0], 0.08, c[2]], [sx*0.7, 0.6, 1.9], 0.03, 0.03, 0.03, 0.03, 'steelD')]
    P['broom'] = [loft([[-0.8, 0.28, -0.2, 0.28, 0.28], [0.8, 0.28, -0.2, 0.28, 0.28]], 'brush', ax='x', n=10)]
    rig = {'body': {'pivot': [0, 0, 0]},
           'brush_l': {'parent': 'body', 'pivot': [0.95, 0.06, 2.5], 'turn': [0, 1, 0], 'range': [-36000, 36000], 'rest': 0, 'note': 'gutter brushes spin inwards (left one negative)'},
           'brush_r': {'parent': 'body', 'pivot': [-0.95, 0.06, 2.5], 'turn': [0, 1, 0], 'range': [-36000, 36000], 'rest': 0, 'note': 'positive'},
           'broom': {'parent': 'body', 'pivot': [0, 0.28, -0.2], 'turn': [1, 0, 0], 'range': [-36000, 36000], 'rest': 0, 'note': 'the main broom rolls under the middle'},
           'hopper': {'parent': 'body', 'pivot': [0, 2.25, -1.4], 'turn': [-1, 0, 0], 'range': [0, 55], 'rest': 0, 'note': 'tips back to empty'}}
    machine('street_sweeper', P, rig, wh, 0.42, 0.3, steer=[0, 1], beacon='body', clips={'sweep': [{'t': 0, 'brush_l': 0, 'brush_r': 0, 'broom': 0}, {'t': 1, 'brush_l': -360, 'brush_r': 360, 'broom': 720}]},
            note='A road sweeper with two gutter brushes and a main broom (sweep loops).')
street_sweeper()
def school_bus():
    P = {}; W = 1.25; L = 5.6
    P['body'] = [*arch_body(-W, W, 0.55, 2.95, -L, L - 1.4, [(3.5, 0.5), (-3.6, 0.5)]), *undercarriage((3.5, -3.6), 1.05, 0.5, 0.36, 1.0, -L + 0.2, L - 0.3, 0.55), hull([(-W, 0.55, L - 1.4), (W, 0.55, L - 1.4), (W, 0.55, L), (-W, 0.55, L), (-W, 1.45, L - 1.4), (W, 1.45, L - 1.4), (W, 1.35, L), (-W, 1.35, L)], 'BODY'),
                 flat([(-W + 0.1, 1.5, L - 1.398), (W - 0.1, 1.5, L - 1.398), (W - 0.1, 2.7, L - 1.398), (-W + 0.1, 2.7, L - 1.398)], 'glass'), b(-W, 2.95, -L, W, 3.05, L - 1.4, 'whiteD'),
                 *[flat([(sx*(W + 0.003), 1.75, z0 if sx > 0 else z1), (sx*(W + 0.003), 1.75, z1 if sx > 0 else z0), (sx*(W + 0.003), 2.5, z1 if sx > 0 else z0), (sx*(W + 0.003), 2.5, z0 if sx > 0 else z1)], 'glass', (sx, 0, 0))
                   for sx in (1, -1) for z0, z1 in [(-L + 0.4 + i*1.15, -L + 1.35 + i*1.15) for i in range(8)]],
                 *stripe(W, 1.0, 1.08, -L + 0.1, L - 1.5, 'black'), *stripe(W, 1.55, 1.6, -L + 0.1, L - 1.5, 'black'),
                 *[b(sx*0.7 - 0.12, 2.75, L - 1.42, sx*0.7 + 0.12, 2.9, L - 1.38, 'beaconR' if sx > 0 else 'beaconA', **G) for sx in (1, -1)], *[b(sx*0.7 - 0.12, 2.75, -L - 0.02, sx*0.7 + 0.12, 2.9, -L, 'beaconR', **G) for sx in (1, -1)],
                 b(-W - 0.02, 0.4, L - 0.02, W + 0.02, 0.6, L + 0.15, 'black'), b(-W - 0.02, 0.4, -L - 0.15, W + 0.02, 0.6, -L + 0.02, 'black'), *tails(W, 0.9, -L),
                 *[flat([(sx*W*0.75 - 0.12, 0.85, L + 0.003), (sx*W*0.75 + 0.12, 0.85, L + 0.003), (sx*W*0.75 + 0.12, 1.0, L + 0.003), (sx*W*0.75 - 0.12, 1.0, L + 0.003)], 'head', **G) for sx in (1, -1)]]
    P['door'] = [b(-W - 0.01, 0.6, L - 2.3, -W + 0.01, 2.6, L - 1.5, 'glassL'), b(-W - 0.012, 1.55, L - 2.3, -W + 0.012, 1.62, L - 1.5, 'black')]
    P['stop_arm'] = [b(-W - 0.05, 1.9, L - 2.9, -W - 0.02, 2.1, L - 2.8, 'black'), loft([[-W - 0.04, 2.0, L - 2.85, 0.28, 0.28], [-W - 0.04, 2.0, L - 2.85, 0.28, 0.28]], 'signR', ax='x', n=8),
                     loft([[-W - 0.055, 2.0, L - 2.85, 0.28, 0.28], [-W - 0.035, 2.0, L - 2.85, 0.28, 0.28]], 'signR', ax='x', n=8)]
    rig = {'body': {'pivot': [0, 0, 0]},
           'door': {'parent': 'body', 'slide': [0, 0, -1], 'pivot': [0, 0, 0], 'range': [0, 0.75], 'rest': 0, 'note': 'the folding door on the right: slide it back to open'},
           'stop_arm': {'parent': 'body', 'pivot': [-W, 2.0, L - 2.8], 'turn': [0, -1, 0], 'range': [0, 90], 'rest': 0, 'note': 'the STOP sign swings out from the left side when the door opens'}}
    machine('school_bus', P, rig, [[sx*1.05, 0.5, z] for z in (3.5, -3.6) for sx in (1, -1)], 0.5, 0.36, steer=[0, 1],
            clips={'stop': [{'t': 0, 'door': 0, 'stop_arm': 0}, {'t': 1, 'door': 0.75, 'stop_arm': 90}]}, note='A school bus (11 m). A shelter for a group or a barricade across a road.')
school_bus()


# ---- measurements the vehicle kit (vehiclekit.py) fits parts and wheels to; the truck_base trucks recorded theirs as they were built ----
def spec(name, **k): SPEC.setdefault(name, {}).update(k)
spec('ambulance', width=2.2, length=6.4, wheelR=0.42, wheelW=0.3, axles=[2.4, -2.0], track=0.84, archClear=0.14, ground=0.0, roof={'y': 3.0, 'z': -0.55, 'w': 2.0, 'd': 4.6}, nose=3.3, tail=-3.05, bumperY=0.675, rearY=0.5)
spec('school_bus', width=2.5, length=11.5, wheelR=0.5, wheelW=0.36, axles=[3.5, -3.6], track=1.05, archClear=0.14, ground=0.0, roof={'y': 3.05, 'z': -0.7, 'w': 2.3, 'd': 9.4}, nose=5.75, tail=-5.75, bumperY=0.5, rearY=0.5)
spec('mobile_crane', width=2.6, length=9.4, wheelR=0.55, wheelW=0.45, axles=[3.2, 1.9, -1.6, -2.9], track=1.05, archClear=0.14, ground=0.0, roof={'y': 2.9, 'z': 4.35, 'w': 1.0, 'd': 0.8}, nose=5.2, tail=-4.05, bumperY=0.9, rearY=0.9)
spec('forklift', width=1.2, length=2.9, wheelR=0.3, wheelW=0.22, axles=[0.35, -1.0], track=0.5, archClear=0.14, ground=0.0, roof={'y': 2.2, 'z': -0.28, 'w': 1.0, 'd': 1.5}, nose=0.6, tail=-1.5, bumperY=0.6, rearY=0.6)
spec('road_roller', width=2.0, length=3.8, wheelR=0.55, wheelW=0.45, axles=[-1.2], track=0.75, archClear=0.14, ground=0.0, roof={'y': 2.66, 'z': -0.9, 'w': 1.5, 'd': 1.8}, nose=1.9, tail=-1.9, bumperY=0.8, rearY=0.8)
spec('excavator', width=3.0, length=5.0, ground=0.0, roof={'y': 2.25, 'z': -1.45, 'w': 2.3, 'd': 0.9})
spec('bulldozer', width=2.8, length=4.5, ground=0.0, roof={'y': 3.28, 'z': -0.75, 'w': 1.7, 'd': 1.8})

pack = {'name': 'machines', 'version': 1, 'units': 'metres', 'facing': '+Z', 'palette': PALETTE, 'paint': PAINT, 'darker': 0.78, 'about': __doc__.split('\n', 2)[2],
        'models': M, 'rig': RIG, 'wheels': WHEELS, 'wheelSize': WR, 'steer': STEER, 'clips': CLIPS, 'beacons': BEACON, 'notes': NOTE, 'spec': SPEC,
        'rule': ('To draw a machine: build each part with BODY = paint[name]; for every part from the body outwards, subtract its pivot, apply fixed then its value (turn about the axis by the '
                 'value in degrees, or slide along the direction by the value in metres), and carry its children. Draw parts.wheel at every wheels[name] position (spin about X by '
                 'distance driven / wheelSize[name][0]; steer the indices in steer[name] about Y up to 35 degrees). Flash the glow pieces of the beacons part (about 2 Hz) and add a light.')}
if __name__ == '__main__':
    import os
    out, st = write_pack('machines', pack, __file__)
    print(os.path.getsize(out)//1024, 'KB')
    for k, v in st.items(): print(k, v)
