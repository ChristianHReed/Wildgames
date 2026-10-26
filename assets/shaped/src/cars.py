# Vehicles of the props pack, version 2 (26 October 2026). Run inside props.py (exec): b, box, hull, loft, flat, model, M, VRIG are already defined.
# What changed from version 1: every body has wheel arches (the upper body floats above the tyres, the lower body is cut away round each wheel and the tyres sit in the
# openings, tucked to the body line), tyres are chamfered with a rim and a cap, bumpers, mirrors, door seams, handles, a grille and a plate. New bodies: wagon, suv,
# offroader, crew_pickup, box_truck and flatbed. Every body publishes its measurements in SPEC (roof panel, load area, bumper and hitch points, wheel size and the largest
# tyre that clears the arch) so the vehicle kit (vehiclekit.py) can fit parts and wheels to it.
PALETTE.update({'hubD': '#5b6168', 'plateW': '#e6e2d0', 'underside': '#17181a', 'rubber': '#2c2c2e'})
SPEC = {}
CARS = ('hatchback', 'sedan', 'wagon', 'suv', 'offroader', 'pickup', 'crew_pickup', 'flatbed', 'van', 'box_truck')

def tyre(x, z, r, w, c='tyre'):
    """one wheel: a chamfered tyre and a rim, centred on (x, r, z), turning about x. Both share one centre (the rig takes the first axle's pieces)"""
    hw = w/2
    return [loft([[x - hw, r, z, r*0.88, r*0.88], [x - hw + 0.03, r, z, r, r], [x + hw - 0.03, r, z, r, r], [x + hw, r, z, r*0.88, r*0.88]], c, ax='x', n=8),
            loft([[x - hw - 0.006, r, z, r*0.6, r*0.6], [x + hw + 0.006, r, z, r*0.6, r*0.6]], 'hub', ax='x', n=6)]
def wheels(xs, zs, r=0.32, w=0.2, c='tyre'):
    o = []
    for x in xs:
        for z in zs: o += tyre(x, z, r, w, c)
    return o
def arch_box(x0, x1, y0, y1, z0, z1, ws, c, clear=0.1, ya=None):
    """a box standing from y0 to y1 with an opening for every wheel (z, r) in ws: solid above ya (just over the tyres), cut away below it round each wheel"""
    ya = ya or (max(r for _, r in ws)*2 + clear*1.4); o = [box([(x0 + x1)/2, (ya + y1)/2, (z0 + z1)/2], [x1 - x0, y1 - ya, z1 - z0], c)]; cur = z0
    for z, r in sorted(ws):
        if z - r - clear - cur > 0.04: o.append(box([(x0 + x1)/2, (y0 + ya + 0.02)/2, (cur + z - r - clear)/2], [x1 - x0, ya + 0.02 - y0, z - r - clear - cur], c))
        cur = z + r + clear
    if z1 - cur > 0.04: o.append(box([(x0 + x1)/2, (y0 + ya + 0.02)/2, (cur + z1)/2], [x1 - x0, ya + 0.02 - y0, z1 - cur], c))
    return o
def underbody(x, y0, y1, z0, z1, axles, r, hw, track):
    """a dark floor, two chassis rails and an axle with its hubs for each axle z: what you see through the arches"""
    o = [box([0, (y0 + y1)/2, (z0 + z1)/2], [2*x, y1 - y0, z1 - z0], 'underside')]
    for z in axles:
        o.append(box([0, r, z], [2*(track - hw) + 0.1, 0.1, 0.1], 'steel'))
    return o
def plate(z, y, face, w=0.38, h=0.12):
    return flat([(-w/2, y, z), (w/2, y, z), (w/2, y + h, z), (-w/2, y + h, z)], 'plateW', (0, 0, face))
def door_seams(W, y0, y1, zs):
    o = []
    for sx in (1, -1):
        for z in zs:
            o.append(flat([(sx*(W + 0.002), y0, z - 0.008), (sx*(W + 0.002), y0, z + 0.008), (sx*(W + 0.002), y1, z + 0.008), (sx*(W + 0.002), y1, z - 0.008)], 'black', (sx, 0, 0)))
    return o
def handles(W, y, zs):
    return [flat([(sx*(W + 0.003), y, z - 0.07), (sx*(W + 0.003), y, z + 0.07), (sx*(W + 0.003), y + 0.025, z + 0.07), (sx*(W + 0.003), y + 0.025, z - 0.07)], 'chrome', (sx, 0, 0)) for sx in (1, -1) for z in zs]
def mirrors(W, y, z, big=False):
    s = 1.5 if big else 1.0
    return [p for sx in (1, -1) for p in (box([sx*(W + 0.07), y + 0.04, z], [0.12, 0.1*s, 0.1*s], 'black'), box([sx*(W - 0.02), y - 0.06, z], [0.14, 0.2, 0.05], 'black'))]

def car(body='paint1', length=4.2, width=1.7, cab_back=-1.1, cab_front=0.7, hood=0.95, roof=1.42, rusty=True, panel=None, r=0.32, tw=0.2, ww=0.75, gc=0.3, slope=0.35, name=None, nose=0.0):
    L, W = length/2, width/2; wz = L - ww; ya = round(2*r + 0.12, 3); oc = 0.1
    xw = W - tw/2                      # wheel centre x: the outer face of the tyre is level with the body
    ft, rt = wz, -wz                   # front and rear axle z
    o = [hull([(-W, ya, -L + 0.03), (W, ya, -L + 0.03), (W, ya, L - 0.03), (-W, ya, L - 0.03), (-W, hood - 0.05, -L + 0.05), (W, hood - 0.05, -L + 0.05), (W, hood - 0.1, L), (-W, hood - 0.1, L)], body)]
    # the lower body: nose, sill between the wheels and tail, each cut back round the tyres
    zf0, zr0 = ft + r + oc, rt - r - oc
    o += [hull([(-W + 0.06, gc, zf0), (W - 0.06, gc, zf0), (W - 0.06, gc, L - 0.04), (-W + 0.06, gc, L - 0.04), (-W, ya + 0.02, zf0), (W, ya + 0.02, zf0), (W, ya + 0.02, L), (-W, ya + 0.02, L)], body),
          hull([(-W + 0.06, gc, -L + 0.04), (W - 0.06, gc, -L + 0.04), (W - 0.06, gc, zr0), (-W + 0.06, gc, zr0), (-W, ya + 0.02, -L), (W, ya + 0.02, -L), (W, ya + 0.02, zr0), (-W, ya + 0.02, zr0)], body),
          box([0, (gc + ya + 0.02)/2, 0], [2*W - 0.04, ya + 0.02 - gc, (ft - r - oc) - (rt + r + oc)], body),
          box([0, gc + 0.02, 0], [2*W - 0.5, 0.12, length - 0.3], 'underside')]
    o += [hull([(-W + 0.06, hood - 0.06, cab_back), (W - 0.06, hood - 0.06, cab_back), (W - 0.06, hood - 0.06, cab_front), (-W + 0.06, hood - 0.06, cab_front),
                (-W + 0.14, roof, cab_back + 0.15), (W - 0.14, roof, cab_back + 0.15), (W - 0.14, roof, cab_front - slope), (-W + 0.14, roof, cab_front - slope)], 'glass'),
          box([0, roof + 0.03, (cab_back + cab_front - slope + 0.15)/2], [width - 0.26, 0.06, cab_front - slope - cab_back - 0.15], body),
          *[box([sx*(W - 0.1), (hood + roof)/2, z], [0.08, roof - hood + 0.06, 0.08], body) for sx in (1, -1) for z in (cab_back + 0.16, cab_front - slope - 0.02)],
          box([0, 0.42 + gc - 0.3, L + 0.03], [width + 0.04, 0.12, 0.08], 'chrome'), box([0, 0.42 + gc - 0.3, -L - 0.03], [width + 0.04, 0.12, 0.08], 'chrome'),
          *[flat([(sx*0.7 - 0.15, hood - 0.35, L + 0.002), (sx*0.7 + 0.15, hood - 0.35, L + 0.002), (sx*0.7 + 0.15, hood - 0.25, L + 0.002), (sx*0.7 - 0.15, hood - 0.25, L + 0.002)], 'head') for sx in (1, -1)],
          flat([(-0.4, hood - 0.36, L + 0.002), (0.4, hood - 0.36, L + 0.002), (0.4, hood - 0.22, L + 0.002), (-0.4, hood - 0.22, L + 0.002)], 'black'),
          *[flat([(sx*0.7 - 0.12, hood - 0.33, -L - 0.002), (sx*0.7 + 0.12, hood - 0.33, -L - 0.002), (sx*0.7 + 0.12, hood - 0.23, -L - 0.002), (sx*0.7 - 0.12, hood - 0.23, -L - 0.002)], 'tail', (0, 0, -1)) for sx in (1, -1)],
          plate(-L - 0.004, gc + 0.16, -1), *mirrors(W, hood + 0.02, cab_front - slope - 0.1),
          *door_seams(W, ya + 0.04, hood - 0.1, (cab_back + 0.12, (cab_back + cab_front)/2 - 0.1, cab_front - slope - 0.1)), *handles(W, hood - 0.17, ((cab_back + cab_front)/2 - 0.3, cab_front - slope - 0.3))]
    if rusty: o += [flat([(W + 0.002, ya + 0.02, L - 0.9), (W + 0.002, ya + 0.02, L - 0.4), (W + 0.002, ya + 0.2, L - 0.5), (W + 0.002, ya + 0.24, L - 0.85)], 'rust', (1, 0, 0)),
                    flat([(-0.3, roof + 0.062, -0.2), (0.1, roof + 0.062, -0.35), (0.25, roof + 0.062, 0.0), (-0.2, roof + 0.062, 0.05)], 'rust', (0, 1, 0))]
    if panel: o.append(flat([(W + 0.003, ya + 0.02, cab_back + 0.1), (W + 0.003, ya + 0.02, cab_front - 0.3), (W + 0.003, hood - 0.08, cab_front - 0.3), (W + 0.003, hood - 0.08, cab_back + 0.1)], panel, (1, 0, 0)))
    o += wheels((-xw, xw), (-wz, wz), r=r, w=tw)
    if name:
        SPEC[name] = {'length': length, 'width': width, 'wheelR': r, 'wheelW': tw, 'axles': [round(wz, 3), round(-wz, 3)], 'track': round(xw, 3), 'archClear': round(ya - 2*r, 3), 'ground': gc,
                      'roof': {'y': round(roof + 0.06, 3), 'z': round((cab_back + cab_front - slope + 0.15)/2, 3), 'w': round(width - 0.26, 3), 'd': round(cab_front - slope - cab_back - 0.15, 3)},
                      'hood': round(hood - 0.05, 3), 'nose': round(L, 3), 'tail': round(-L, 3), 'bumperY': round(0.42 + gc - 0.3 + 0.06, 3), 'glassFront': round(cab_front - slope, 3), 'cabBack': cab_back}
    return o

def rear_hatch_vehicle(nm, col, length, width, cab_back, cab_front, hood, roof, r, tw, ww, gc, slope=0.35, panel=None):
    model('vehicles', nm, car(col, length, width, cab_back, cab_front, hood, roof, panel=panel, r=r, tw=tw, ww=ww, gc=gc, slope=slope, name=nm),
          moving=[{'piece': 'door_l', 'hinge': [width/2, 0, cab_front - 0.3], 'axis': 'y'}, {'piece': 'bonnet', 'hinge': [0, hood, cab_front], 'axis': 'x'}])
model('vehicles', 'hatchback', car('paint1', 3.9, 1.66, -1.5, 0.75, 0.92, 1.4, panel='paint2', name='hatchback'),
      moving=[{'piece': 'door_l', 'hinge': [0.83, 0, 0.55], 'axis': 'y'}, {'piece': 'bonnet', 'hinge': [0, 0.9, 0.5], 'axis': 'x'}, {'piece': 'hatch', 'hinge': [0, 1.4, -1.35], 'axis': 'x'}])
model('vehicles', 'sedan', car('paint3', 4.6, 1.76, -0.9, 0.8, 0.95, 1.4, name='sedan'),
      moving=[{'piece': 'door_l', 'hinge': [0.88, 0, 0.6], 'axis': 'y'}, {'piece': 'bonnet', 'hinge': [0, 0.95, 0.6], 'axis': 'x'}, {'piece': 'boot', 'hinge': [0, 0.95, -1.0], 'axis': 'x'}])
rear_hatch_vehicle('wagon', 'paint2', 4.7, 1.74, -2.05, 0.72, 0.93, 1.44, 0.33, 0.21, 0.8, 0.3)
rear_hatch_vehicle('suv', 'paint1', 4.5, 1.86, -2.0, 0.8, 1.08, 1.8, 0.38, 0.26, 0.85, 0.42, slope=0.45)
rear_hatch_vehicle('offroader', 'paint3', 3.8, 1.8, -1.6, 0.62, 1.0, 1.8, 0.42, 0.29, 0.7, 0.46, slope=0.14)

def pickup(crew=False, flat_bed=False):
    L, W = 2.6, 0.95; ext = 0.9 if crew else 0.0; r, tw = 0.36, 0.24; xw = W - tw/2; ya = round(2*r + 0.12, 3); fz = 1.55
    rz = -1.8 - (0.55 if crew else 0.0) - (0.6 if flat_bed else 0.0)    # rear axle
    bed0, bed1 = -0.6 - ext, -2.8 - (1.0 if flat_bed else 0.0)
    cbk = -0.6 - ext
    o = [hull([(-W, ya, 0.2), (W, ya, 0.2), (W, ya, L), (-W, ya, L), (-W, 1.05, 0.25), (W, 1.05, 0.25), (W, 1.0, L), (-W, 1.0, L)], 'paint2'),
         hull([(-W + 0.06, 0.35, fz + r + 0.1), (W - 0.06, 0.35, fz + r + 0.1), (W - 0.06, 0.35, L - 0.04), (-W + 0.06, 0.35, L - 0.04), (-W, ya + 0.02, fz + r + 0.1), (W, ya + 0.02, fz + r + 0.1), (W, ya + 0.02, L), (-W, ya + 0.02, L)], 'paint2'),
         box([0, (0.35 + ya + 0.02)/2, (0.2 + fz - r - 0.1)/2], [2*W, ya + 0.02 - 0.35, fz - r - 0.1 - 0.2], 'paint2'),
         box([0, 0.45, (0.2 + L)/2 - 0.2], [2*W - 0.5, 0.2, L - 0.5], 'underside'),
         hull([(-W + 0.05, 1.04, cbk), (W - 0.05, 1.04, cbk), (W - 0.05, 1.04, 0.3), (-W + 0.05, 1.04, 0.3), (-W + 0.1, 1.75, cbk + 0.05), (W - 0.1, 1.75, cbk + 0.05), (W - 0.1, 1.75, -0.05), (-W + 0.1, 1.75, -0.05)], 'glass'),
         box([0, 1.78, (cbk - 0.05)/2 - 0.05], [2*W - 0.2, 0.06, -0.05 - cbk - 0.05 + 0.0], 'paint2'), box([0, 0.7, (cbk + 0.2)/2], [2*W, 0.7, 0.2 - cbk], 'paint2'),
         *[box([sx*(W - 0.07), 1.4, z], [0.07, 0.72, 0.07], 'paint2') for sx in (1, -1) for z in (cbk + 0.05, 0.22)],
         box([0, 0.45, L + 0.04], [2*W + 0.06, 0.14, 0.1], 'chrome'), box([0, 0.45, bed1 - 0.04], [2*W + 0.06, 0.14, 0.08], 'chrome'),
         box([0, 0.38, L + 0.0], [2*W - 0.2, 0.12, 0.1], 'black'),
         *[flat([(sx*0.72 - 0.14, 0.78, L + 0.002), (sx*0.72 + 0.14, 0.78, L + 0.002), (sx*0.72 + 0.14, 0.9, L + 0.002), (sx*0.72 - 0.14, 0.9, L + 0.002)], 'head') for sx in (1, -1)],
         flat([(-0.45, 0.78, L + 0.002), (0.45, 0.78, L + 0.002), (0.45, 0.92, L + 0.002), (-0.45, 0.92, L + 0.002)], 'black'),
         *[flat([(sx*0.75 - 0.1, 0.8, bed1 - 0.002), (sx*0.75 + 0.1, 0.8, bed1 - 0.002), (sx*0.75 + 0.1, 0.92, bed1 - 0.002), (sx*0.75 - 0.1, 0.92, bed1 - 0.002)], 'tail', (0, 0, -1)) for sx in (1, -1)],
         plate(bed1 - 0.044, 0.62, -1, 0.4, 0.14), *mirrors(W, 1.25, 0.18, True),
         *door_seams(W, 0.4, 1.1, [cbk + 0.02, 0.22] + ([-0.35 - ext/2 + 0.2] if crew else [])), *handles(W, 1.0, [0.0] + ([-0.9] if crew else [])),
         flat([(-W - 0.002, 0.42, 0.9), (-W - 0.002, 0.42, 1.9), (-W - 0.002, 0.7, 1.7), (-W - 0.002, 0.75, 1.0)], 'rust', (-1, 0, 0)),
         flat([(W + 0.002, 0.5, cbk + 0.1), (W + 0.002, 0.5, 0.1), (W + 0.002, 0.95, 0.1), (W + 0.002, 0.95, cbk + 0.1)], 'paint1', (1, 0, 0))]
    # the load area: a thin floor, side panels with wheel arches, the headboard and the tailgate; wheel wells inside
    bl = bed0 - bed1; bc = (bed0 + bed1)/2
    o += [box([0, 0.62, bc], [2*W - 0.1, 0.06, bl], 'woodD'), box([0, 0.5, bc], [2*W - 0.4, 0.24, bl], 'underside')]
    if flat_bed:
        o += [box([0, 0.7, bc], [2*W, 0.1, bl], 'woodD'), *[box([sx*(W - 0.03), 0.88, bc], [0.06, 0.22, bl], 'paint2') for sx in (1, -1)], box([0, 0.88, bed0 - 0.03], [2*W, 0.5, 0.06], 'paint2'),
               *[box([sx*(W - 0.03), 1.1, z], [0.06, 0.4, 0.06], 'steel') for sx in (1, -1) for z in (bed0 - 0.1, bc, bed1 + 0.1)]]
        o += arch_box(-W, -W + 0.1, 0.3, 0.7, bed1, bed0, [(rz, r), (rz - 1.1, r)], 'paint2')[1:] + arch_box(W - 0.1, W, 0.3, 0.7, bed1, bed0, [(rz, r), (rz - 1.1, r)], 'paint2')[1:]
    else:
        for sx in (1, -1):
            o += [box([sx*(W - 0.04), (ya + 1.05)/2, bc], [0.08, 1.05 - ya, bl], 'paint2'),
                  *[box([sx*(W - 0.04), (0.35 + ya + 0.02)/2, zc], [0.08, ya + 0.02 - 0.35, zl], 'paint2') for zc, zl in ((((bed0 + rz + r + 0.1)/2), bed0 - rz - r - 0.1), (((bed1 + rz - r - 0.1)/2), rz - r - 0.1 - bed1)) if zl > 0.04],
                  box([sx*(W - 0.3), 0.74, rz], [0.3, 0.2, 2*r + 0.3], 'paint2')]
        o += [box([0, 0.85, bed0 - 0.03], [2*W - 0.1, 0.4, 0.06], 'paint2'), box([0, 0.85, bed1 + 0.03], [2*W - 0.1, 0.4, 0.06], 'paint2')]
    o += wheels((-xw, xw), (rz, fz), r=r, w=tw)
    SPEC['pickup' if not (crew or flat_bed) else ('crew_pickup' if crew else 'flatbed')] = {
        'length': round(L - bed1, 2), 'width': 2*W, 'wheelR': r, 'wheelW': tw, 'axles': [fz, rz], 'track': round(xw, 3), 'archClear': round(ya - 2*r, 3), 'ground': 0.35,
        'roof': {'y': 1.81, 'z': round((cbk - 0.05)/2 - 0.05, 3), 'w': 2*W - 0.2, 'd': round(0.0 - cbk, 3)}, 'hood': 1.0, 'nose': L, 'tail': bed1, 'bumperY': 0.52, 'glassFront': -0.05, 'cabBack': cbk,
        'bed': {'y': 0.68 if not flat_bed else 0.8, 'z': round(bc, 3), 'w': 2*W - 0.2, 'd': round(bl - 0.1, 3), 'rim': 1.05 if not flat_bed else 0.8}}
    return o
model('vehicles', 'pickup', pickup(), moving=[{'piece': 'door_l', 'hinge': [0.95, 0, 0.25], 'axis': 'y'}, {'piece': 'bonnet', 'hinge': [0, 1.05, 0.3], 'axis': 'x'}, {'piece': 'tailgate', 'hinge': [0, 0.65, -2.8], 'axis': 'x'}])
model('vehicles', 'crew_pickup', pickup(crew=True), moving=[{'piece': 'bonnet', 'hinge': [0, 1.05, 0.3], 'axis': 'x'}, {'piece': 'tailgate', 'hinge': [0, 0.65, -2.8], 'axis': 'x'}])
model('vehicles', 'flatbed', pickup(flat_bed=True), moving=[{'piece': 'bonnet', 'hinge': [0, 1.05, 0.3], 'axis': 'x'}])

def van():
    L, W = 2.5, 1.0; r, tw = 0.34, 0.22; xw = W - tw/2; fz, rz = 1.45, -1.6; ya = round(2*r + 0.12, 3)
    o = arch_box(-W, W, 0.3, 2.2, -2.4, 1.8, [(rz, r), (fz, r)], 'white') + [box([0, 0.4, -0.3], [2*W - 0.5, 0.2, 4.1], 'underside')]
    o += [hull([(-W, ya, 1.8), (W, ya, 1.8), (W, ya, L - 0.03), (-W, ya, L - 0.03), (-W, 1.0, 1.8), (W, 1.0, 1.8), (W, 0.95, L), (-W, 0.95, L)], 'white'),
          hull([(-W + 0.06, 0.3, fz + r + 0.1), (W - 0.06, 0.3, fz + r + 0.1), (W - 0.06, 0.3, L - 0.04), (-W + 0.06, 0.3, L - 0.04), (-W, ya + 0.02, fz + r + 0.1), (W, ya + 0.02, fz + r + 0.1), (W, ya + 0.02, L), (-W, ya + 0.02, L)], 'white'),
          hull([(-W + 0.02, 1.0, 1.6), (W - 0.02, 1.0, 1.6), (W - 0.02, 1.0, 1.85), (-W + 0.02, 1.0, 1.85), (-W + 0.02, 2.1, 1.6), (W - 0.02, 2.1, 1.6), (W - 0.02, 2.1, 1.62), (-W + 0.02, 2.1, 1.62)], 'glass'),
          flat([(W + 0.002, 0.9, -1.8), (W + 0.002, 0.9, 1.0), (W + 0.002, 1.3, 1.0), (W + 0.002, 1.3, -1.8)], 'blue', (1, 0, 0)), flat([(-W - 0.002, 0.9, 1.0), (-W - 0.002, 0.9, -1.8), (-W - 0.002, 1.3, -1.8), (-W - 0.002, 1.3, 1.0)], 'blue', (-1, 0, 0)),
          flat([(W + 0.003, 1.45, 1.1), (W + 0.003, 1.45, 1.6), (W + 0.003, 1.95, 1.6), (W + 0.003, 1.95, 1.1)], 'glass', (1, 0, 0)), flat([(-W - 0.003, 1.45, 1.6), (-W - 0.003, 1.45, 1.1), (-W - 0.003, 1.95, 1.1), (-W - 0.003, 1.95, 1.6)], 'glass', (-1, 0, 0)),
          box([0, 0.45, L + 0.04], [2*W + 0.04, 0.14, 0.08], 'black'), box([0, 0.45, -2.42], [2*W + 0.04, 0.14, 0.08], 'black'),
          flat([(W + 0.004, 0.4, -0.9), (W + 0.004, 0.4, -0.2), (W + 0.004, 0.6, -0.3), (W + 0.004, 0.65, -0.8)], 'rust', (1, 0, 0)),
          box([0, 0.38, L], [2*W - 0.2, 0.12, 0.1], 'black'), plate(-2.404, 0.55, -1),
          *[flat([(sx*0.72 - 0.16, 0.62, L + 0.002), (sx*0.72 + 0.16, 0.62, L + 0.002), (sx*0.72 + 0.16, 0.74, L + 0.002), (sx*0.72 - 0.16, 0.74, L + 0.002)], 'head') for sx in (1, -1)],
          *[flat([(sx*0.8 - 0.07, 0.6, -2.402), (sx*0.8 + 0.07, 0.6, -2.402), (sx*0.8 + 0.07, 0.95, -2.402), (sx*0.8 - 0.07, 0.95, -2.402)], 'tail', (0, 0, -1)) for sx in (1, -1)],
          *mirrors(W, 1.55, 1.7, True), *door_seams(W, 0.45, 2.0, [1.1, 1.62]), *handles(W, 1.2, [1.35])]
    o += wheels((-xw, xw), (rz, fz), r=r, w=tw)
    return o
model('vehicles', 'van', van(), moving=[{'piece': 'door_l', 'hinge': [1.0, 0, 1.85], 'axis': 'y'}, {'piece': 'back_doors', 'hinge': [1.0, 0, -2.4], 'axis': 'y'}])
SPEC['van'] = {'length': 4.9, 'width': 2.0, 'wheelR': 0.34, 'wheelW': 0.22, 'axles': [1.45, -1.6], 'track': 0.89, 'archClear': 0.12, 'ground': 0.3,
               'roof': {'y': 2.2, 'z': -0.3, 'w': 1.8, 'd': 3.9}, 'hood': 0.98, 'nose': 2.5, 'tail': -2.4, 'bumperY': 0.52, 'glassFront': 1.85, 'cabBack': 1.1}

# ================= the box truck: a hooded cab and a separate box on a chassis =================
def box_truck():
    W, BW = 1.0, 1.12; r, tw = 0.42, 0.28; xw = W - tw/2; fz, rz = 2.05, -1.9; ya = round(2*r + 0.12, 3); top = 3.0; zb0, zb1 = -3.9, 0.5; zc = 0.56
    o = [box([0, 0.55, -0.3], [2*W - 0.5, 0.22, 7.0], 'underside')]
    o += arch_box(-BW, BW, 0.62, top, zb0, zb1, [(rz, r)], 'white')                                                    # the box, with an arch over the rear wheels
    o += [box([0, top + 0.03, (zb0 + zb1)/2], [2*BW - 0.1, 0.06, zb1 - zb0], 'paint1'),
          flat([(BW + 0.003, 0.9, zb0 + 0.2), (BW + 0.003, 0.9, zb1 - 0.2), (BW + 0.003, 1.15, zb1 - 0.2), (BW + 0.003, 1.15, zb0 + 0.2)], 'paint1', (1, 0, 0)),
          flat([(-BW - 0.003, 0.9, zb1 - 0.2), (-BW - 0.003, 0.9, zb0 + 0.2), (-BW - 0.003, 1.15, zb0 + 0.2), (-BW - 0.003, 1.15, zb1 - 0.2)], 'paint1', (-1, 0, 0)),
          box([0, 0.55, zb0 - 0.05], [2*BW - 0.1, 0.16, 0.12], 'black'), plate(zb0 - 0.112, 0.68, -1),
          *[flat([(sx*0.85 - 0.08, 0.75, zb0 - 0.002), (sx*0.85 + 0.08, 0.75, zb0 - 0.002), (sx*0.85 + 0.08, 1.25, zb0 - 0.002), (sx*0.85 - 0.08, 1.25, zb0 - 0.002)], 'tail', (0, 0, -1)) for sx in (1, -1)]]
    # the cab: a lower body over the tyres, glass above, a roof, the hood and nose
    o += [box([0, (ya + 1.2)/2, (zc + 2.0)/2], [2*W, 1.2 - ya, 2.0 - zc], 'paint1'),
          box([0, (0.45 + ya + 0.02)/2, (zc + fz - r - 0.1)/2], [2*W - 0.04, ya + 0.02 - 0.45, fz - r - 0.1 - zc], 'paint1'),                     # sill between the cab back and the front wheels
          hull([(-W + 0.02, 1.2, zc + 0.05), (W - 0.02, 1.2, zc + 0.05), (W - 0.02, 1.2, 1.8), (-W + 0.02, 1.2, 1.8), (-W + 0.1, 2.3, zc + 0.1), (W - 0.1, 2.3, zc + 0.1), (W - 0.1, 2.3, 1.35), (-W + 0.1, 2.3, 1.35)], 'glass'),
          box([0, 2.33, (zc + 1.35)/2 + 0.05], [2*W - 0.2, 0.06, 1.35 - zc - 0.1], 'paint1'),
          *[box([sx*(W - 0.07), 1.75, z], [0.07, 1.1, 0.07], 'paint1') for sx in (1, -1) for z in (zc + 0.1, 1.35)],
          hull([(-W, ya, 1.95), (W, ya, 1.95), (W, ya, 3.2), (-W, ya, 3.2), (-W, 1.22, 1.99), (W, 1.22, 1.99), (W, 1.18, 3.2), (-W, 1.18, 3.2)], 'paint1'),
          hull([(-W + 0.06, 0.42, fz + r + 0.1), (W - 0.06, 0.42, fz + r + 0.1), (W - 0.06, 0.42, 3.15), (-W + 0.06, 0.42, 3.15), (-W, ya + 0.02, fz + r + 0.1), (W, ya + 0.02, fz + r + 0.1), (W, ya + 0.02, 3.2), (-W, ya + 0.02, 3.2)], 'paint1'),
          box([0, 0.5, 3.25], [2*W + 0.06, 0.2, 0.12], 'chrome'), box([0, 0.44, 3.2], [2*W - 0.2, 0.14, 0.1], 'black'),
          flat([(-0.45, 0.8, 3.202), (0.45, 0.8, 3.202), (0.45, 1.1, 3.202), (-0.45, 1.1, 3.202)], 'black'),
          *[flat([(sx*0.75 - 0.15, 0.85, 3.202), (sx*0.75 + 0.15, 0.85, 3.202), (sx*0.75 + 0.15, 1.0, 3.202), (sx*0.75 - 0.15, 1.0, 3.202)], 'head') for sx in (1, -1)]]
    o += mirrors(W, 1.9, 1.5, True) + door_seams(W, 0.5, 2.2, [zc + 0.12, 1.5]) + handles(W, 1.5, [1.0])
    o += wheels((-xw, xw), (rz, fz), r=r, w=tw)
    SPEC['box_truck'] = {'length': 7.3, 'width': 2.24, 'wheelR': r, 'wheelW': tw, 'axles': [fz, rz], 'track': round(xw, 3), 'archClear': round(ya - 2*r, 3), 'ground': 0.42,
                         'roof': {'y': top + 0.06, 'z': round((zb0 + zb1)/2, 3), 'w': 2*BW - 0.2, 'd': zb1 - zb0 - 0.2}, 'hood': 1.2, 'nose': 3.2, 'tail': zb0, 'bumperY': 0.6, 'glassFront': 1.8, 'cabBack': zc}
    return o
model('vehicles', 'box_truck', box_truck(), moving=[{'piece': 'bonnet', 'hinge': [0, 1.22, 2.0], 'axis': 'x'}, {'piece': 'back_doors', 'hinge': [1.12, 0, -3.9], 'axis': 'y'}])

# ---- split each vehicle into body, bonnet and one wheel: the same rule as version 1 (the bonnet is a panel on the body, one wheel model, axle positions) ----
VRIG = {}
def rig(name, z0, z1, y0, y1, half, col):
    """the bonnet: a panel lying on the body from z0 (windscreen, height y0) to z1 (nose, height y1); one wheel model; axle positions"""
    ps = M['vehicles'][name]
    wheels_ = [q for q in ps if q['c'] in ('tyre', 'hub') and q.get('ax') == 'x']
    body = [q for q in ps if q not in wheels_]
    axles = sorted({tuple(q['p']) for q in wheels_ if q['c'] == 'tyre'})
    first = [q for q in wheels_ if tuple(q['p']) == axles[0]]
    wheel = [dict(q, p=[0, 0, 0]) for q in first]
    lid = hull([(-half, y0 + 0.004, z0), (half, y0 + 0.004, z0), (half, y1 + 0.004, z1), (-half, y1 + 0.004, z1),
                (-half, y0 + 0.034, z0), (half, y0 + 0.034, z0), (half, y1 + 0.034, z1), (-half, y1 + 0.034, z1)], col)
    bay = flat([(-half + 0.08, y0 + 0.003, z0 + 0.06), (half - 0.08, y0 + 0.003, z0 + 0.06), (half - 0.08, y1 + 0.003, z1 - 0.06), (-half + 0.08, y1 + 0.003, z1 - 0.06)], 'black', (0, 1, 0))
    M['vehicles'][name] = {'body': body + [bay], 'bonnet': [lid], 'wheel': wheel}
    VRIG[name] = {'wheels': [list(a) for a in axles], 'wheelAxis': 'x', 'bonnetHinge': [0, round(y0 + 0.034, 3), z0], 'bonnetAxis': 'x',
                  'wheelRule': 'Place the wheel model at each position (turned half a turn on the left side), spin it about x; the bonnet opens about its hinge.'}
def hood_line(L, hood, z):   # the car body's top: hood-0.05 at the back, hood-0.1 at the nose
    return (hood - 0.05) + (-0.05)*(z - (-L + 0.05))/(L - (-L + 0.05))
for nm, Lh, hood, cf, Wd, col in (('hatchback', 1.95, 0.92, 0.75, 0.83, 'paint1'), ('sedan', 2.3, 0.95, 0.8, 0.88, 'paint3'), ('wagon', 2.35, 0.93, 0.72, 0.87, 'paint2'),
                                  ('suv', 2.25, 1.08, 0.8, 0.93, 'paint1'), ('offroader', 1.9, 1.0, 0.62, 0.9, 'paint3')):
    rig(nm, cf + 0.02, Lh - 0.02, hood_line(Lh, hood, cf + 0.02), hood_line(Lh, hood, Lh - 0.02), Wd - 0.04, col)
rig('pickup', 0.32, 2.58, 1.05 - 0.05*(0.32 - 0.25)/2.35, 1.0, 0.91, 'paint2')
rig('crew_pickup', 0.32, 2.58, 1.05 - 0.05*(0.32 - 0.25)/2.35, 1.0, 0.91, 'paint2')
rig('flatbed', 0.32, 2.58, 1.05 - 0.05*(0.32 - 0.25)/2.35, 1.0, 0.91, 'paint2')
rig('van', 1.86, 2.48, 0.998, 0.952, 0.96, 'white')
rig('box_truck', 2.02, 3.18, 1.218, 1.18, 0.96, 'paint1')
