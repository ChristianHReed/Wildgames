"""Survivor base body, box-modelled the Blender way: a half-body quad cage, mirrored across x = 0,
then one level of Catmull-Clark subdivision (the same result as Blender's Mirror + Subdivision Surface modifiers).
Metres, Y up, facing +Z, the survivor's left is +X. Fitted to the game's skeleton joints (assets/shaped/src/survivor.py).

Run: python3 workshop/tools/base_cage.py [out_dir]     writes OBJ (quads), a preview PNG and a Blender script.
"""
import sys, os, math, json
import numpy as np

# ---------------------------------------------------------------- tiny mesh kit
class Mesh:
    def __init__(self): self.v = []; self.f = []; self.tag = []
    def V(self, x, y, z): self.v.append([float(x), float(y), float(z)]); return len(self.v) - 1
    def F(self, a, b, c, d, tag): self.f.append((a, b, c, d)); self.tag.append(tag)
    def bridge(self, A, B, tag, closed=True, skip=()):
        n = len(A)
        for i in range(n if closed else n - 1):
            if i in skip: continue
            j = (i + 1) % n; self.F(A[i], A[j], B[j], B[i], tag)
    def cap8(self, R, tag): self.F(R[0], R[1], R[2], R[3], tag); self.F(R[0], R[3], R[4], R[7], tag); self.F(R[4], R[5], R[6], R[7], tag)

def mirror(m):
    out = Mesh(); out.v = [list(p) for p in m.v]; mp = {}
    for i, p in enumerate(m.v):
        if abs(p[0]) < 1e-7: out.v[i][0] = 0.0; mp[i] = i
        else: out.v.append([-p[0], p[1], p[2]]); mp[i] = len(out.v) - 1
    for f, t in zip(m.f, m.tag):
        out.f.append(tuple(f)); out.tag.append(t)
        out.f.append(tuple(mp[i] for i in reversed(f))); out.tag.append(t[:-1] + 'r' if t.endswith('_l') else t)
    return out

def orient(m):
    """Make every face wind the same way (flood across shared edges), then outward (positive volume)."""
    F = [list(f) for f in m.f]; em = {}
    for fi, f in enumerate(F):
        for k in range(len(f)): em.setdefault(frozenset((f[k], f[(k + 1) % len(f)])), []).append(fi)
    bad = [e for e, fs in em.items() if len(fs) != 2]
    seen = [False]*len(F)
    for s in range(len(F)):
        if seen[s]: continue
        seen[s] = True; st = [s]
        while st:
            a = st.pop(); fa = F[a]
            for k in range(len(fa)):
                u, w = fa[k], fa[(k + 1) % len(fa)]
                for b in em[frozenset((u, w))]:
                    if seen[b]: continue
                    fb = F[b]; same = any(fb[q] == u and fb[(q + 1) % len(fb)] == w for q in range(len(fb)))
                    if same: fb.reverse()
                    seen[b] = True; st.append(b)
    P = np.array(m.v); vol = 0.0
    for f in F:
        for i in range(1, len(f) - 1): vol += np.dot(P[f[0]], np.cross(P[f[i]], P[f[i + 1]]))/6.0
    if vol < 0: F = [f[::-1] for f in F]
    m.f = [tuple(f) for f in F]
    return len(bad), abs(vol)

def subdivide(m):
    """One Catmull-Clark level on a closed quad mesh."""
    P = np.array(m.v); F = m.f; out = Mesh()
    fp = [P[list(f)].mean(0) for f in F]
    ef = {}; vf = {}; ve = {}
    for fi, f in enumerate(F):
        for k in range(len(f)):
            a, b = f[k], f[(k + 1) % len(f)]; e = (min(a, b), max(a, b)); ef.setdefault(e, []).append(fi)
            vf.setdefault(a, []).append(fi); ve.setdefault(a, set()).add(e); ve.setdefault(b, set()).add(e)
    newv = []
    for i in range(len(P)):
        n = len(vf[i]); Fm = np.mean([fp[k] for k in vf[i]], 0); Rm = np.mean([(P[e[0]] + P[e[1]])/2 for e in ve[i]], 0)
        newv.append((Fm + 2*Rm + (n - 3)*P[i])/n)
    out.v = [list(p) for p in newv]
    fidx = [out.V(*p) for p in fp]; eidx = {}
    for e, fs in ef.items():
        p = (P[e[0]] + P[e[1]] + sum(fp[k] for k in fs))/(2 + len(fs)); eidx[e] = out.V(*p)
    for fi, f in enumerate(F):
        n = len(f)
        for k in range(n):
            a = f[k]; b = f[(k + 1) % n]; z = f[(k - 1) % n]
            out.F(a, eidx[(min(a, b), max(a, b))], fidx[fi], eidx[(min(z, a), max(z, a))], m.tag[fi])
    return out

# ---------------------------------------------------------------- the cage
BODY = {
 'masculine': dict(
   pelvis=[(0, .868, .090), (.098, .892, .092), (.142, .915, -.004), (.104, .886, -.112), (0, .862, -.106)],
   crotch=[(0, .848, .068), (0, .826, -.008), (0, .846, -.084)],
   torso=[  # y, half width, front z, back z, front-corner x and z factors, back-corner x and z factors
     (0.985, .140, .094, -.118, .82, .92, .84, .94),     # hips: small and boxy
     (1.085, .126, .090, -.074, .78, .90, .80, .88),     # waist
     (1.165, .138, .096, -.086, .74, .88, .76, .86),     # lower ribs
     (1.235, .150, .104, -.100, .76, .90, .78, .88),     # under the chest
     (1.300, .153, .138, -.112, .78, .93, .80, .88)],    # chest plane, at the armpit
   a1=[(0, 1.378, .120), (.118, 1.378, .114), None, (.118, 1.380, -.102), (0, 1.384, -.112)],
   a2=[(0, 1.434, .078), (.100, 1.444, .054), (.144, 1.438, -.004), (.100, 1.450, -.066), (0, 1.452, -.092)],
   n0=[(0, 1.462, .056), (.048, 1.478, .044), (.072, 1.500, .000), (.050, 1.498, -.050), (0, 1.488, -.068)],
   n1=[(0, 1.532, .060), (.040, 1.535, .046), (.056, 1.538, .008), (.040, 1.540, -.038), (0, 1.540, -.052)],
   head=[  # planar head: chin, mouth, nose base, eye line, brow shelf, forehead, crown
     [(0, 1.545, .100), (.038, 1.550, .090), (.068, 1.585, .020), (.050, 1.580, -.050), (0, 1.575, -.066)],
     [(0, 1.590, .116), (.052, 1.592, .098), (.086, 1.622, .020), (.064, 1.618, -.074), (0, 1.615, -.092)],
     [(0, 1.632, .120), (.064, 1.634, .100), (.093, 1.642, .020), (.070, 1.644, -.084), (0, 1.648, -.104)],
     [(0, 1.682, .117), (.066, 1.682, .103), (.095, 1.700, .020), (.072, 1.700, -.090), (0, 1.694, -.112)],
     [(0, 1.712, .123), (.068, 1.712, .108), (.096, 1.722, .010), (.074, 1.724, -.090), (0, 1.720, -.114)],
     [(0, 1.765, .112), (.062, 1.768, .094), (.088, 1.770, .006), (.066, 1.770, -.080), (0, 1.768, -.102)],
     [(0, 1.802, .062), (.040, 1.806, .050), (.056, 1.808, .002), (.042, 1.806, -.050), (0, 1.802, -.066)]],
   crown=(0, 1.816, .000), head_scale=(1.04, 1.02, 1.04),
   nose=[(0, 1.638, .143), (.022, 1.638, .126), (.014, 1.680, .117), (0, 1.684, .120)],      # tip, wing, bridge side, bridge
   ear=((.020, .0, .012), (.5, .9, .40)),
   arm=[  # centre x, y, centre z, radius x, radius z, tilt (outer side raised)
     (.180, 1.362, -.002, .052, .066, .026, 'upperarm'),  # deltoid
     (.189, 1.270, -.004, .047, .054, .010, 'upperarm'),  # biceps
     (.196, 1.190, -.020, .039, .044, .000, 'upperarm'),
     (.198, 1.150, -.026, .037, .041, .000, 'lowerarm'),  # elbow
     (.204, 1.080, -.012, .042, .046, .000, 'lowerarm'),  # forearm swell
     (.210, 0.980, .008, .032, .036, .000, 'lowerarm'),
     (.214, 0.905, .018, .023, .033, .000, 'hand'),       # wrist
     (.218, 0.850, .026, .023, .056, .000, 'hand'),       # palm
     (.216, 0.790, .034, .022, .058, .000, 'hand'),       # knuckles
     (.211, 0.735, .042, .018, .052, .000, 'hand'),
     (.206, 0.698, .046, .012, .040, .000, 'hand')],
   thumb=[((-.002, -.006, .022), 1.30), ((-.004, -.026, .036), 1.10), ((-.006, -.046, .040), .75)],
   leg=[  # centre x, y, centre z, radius x, radius z, blend toward the hip angles
     (.077, .800, -.006, .066, .096, 1.0, 'thigh'),
     (.078, .700, .002, .064, .090, 0.5, 'thigh'),       # quads
     (.081, .580, .006, .060, .072, 0.0, 'thigh'),
     (.078, .505, .016, .053, .060, 0.0, 'calf'),         # knee block, forward
     (.078, .445, .004, .047, .052, 0.0, 'calf'),
     (.081, .345, -.018, .056, .066, 0.0, 'calf'),        # calf muscle, back
     (.078, .200, -.014, .038, .044, 0.0, 'calf'),
     (.077, .095, -.012, .031, .037, 0.0, 'foot')],       # ankle
   sole=(.077, 0.0, -.026, .042, .054),
   foot=[(.080, .080, .050, .088), (.084, .160, .057, .052), (.085, .236, .047, .032)]),   # centre x, z, half width, top y
}
def _bulk(B, arm, leg):
    B['arm'] = [(cx + (rx*(arm - 1) if i < 6 else 0), y, cz, rx*(arm if i < 6 else 1), rz*(arm if i < 6 else 1), t, g) for i, (cx, y, cz, rx, rz, t, g) in enumerate(B['arm'])]
    B['leg'] = [(cx + rx*(leg - 1)*(1 if i < 3 else .3), y, cz, rx*leg, rz*leg, bl, g) for i, (cx, y, cz, rx, rz, bl, g) in enumerate(B['leg'])]
def _fem():
    import copy
    B = copy.deepcopy(BODY['masculine'])
    B['pelvis'] = [(0, .868, .088), (.098, .890, .092), (.178, .912, -.004), (.110, .884, -.124), (0, .862, -.116)]
    B['torso'] = [(0.975, .160, .092, -.128, .70, .88, .74, .92), (1.040, .132, .088, -.098, .72, .88, .74, .88), (1.100, .104, .082, -.064, .72, .86, .74, .84), (1.165, .114, .090, -.074, .74, .88, .76, .84),
                  (1.235, .126, .098, -.086, .74, .90, .76, .84), (1.300, .132, .144, -.096, .70, .96, .78, .84)]
    B['a1'] = [(0, 1.378, .108), (.100, 1.378, .106), None, (.100, 1.380, -.082), (0, 1.384, -.100)]
    B['a2'] = [(0, 1.434, .072), (.092, 1.444, .050), (.134, 1.438, -.004), (.094, 1.450, -.060), (0, 1.452, -.082)]
    B['n0'] = [(0, 1.462, .050), (.038, 1.478, .038), (.056, 1.494, .000), (.040, 1.494, -.042), (0, 1.488, -.058)]
    B['n1'] = [(0, 1.532, .056), (.032, 1.535, .042), (.045, 1.538, .008), (.032, 1.540, -.030), (0, 1.540, -.042)]
    H = B['head']                                             # a softer, narrower face: slimmer jaw, lighter brow, smaller nose
    H[0] = [(0, 1.548, .098), (.030, 1.553, .088), (.058, 1.588, .020), (.046, 1.582, -.050), (0, 1.577, -.066)]
    H[1] = [(0, 1.590, .112), (.046, 1.592, .096), (.078, 1.622, .020), (.062, 1.618, -.074), (0, 1.615, -.092)]
    H[2] = [(0, 1.632, .118), (.060, 1.634, .098), (.089, 1.642, .020), (.068, 1.644, -.084), (0, 1.648, -.104)]
    H[3] = [(0, 1.682, .116), (.064, 1.682, .102), (.092, 1.700, .020), (.070, 1.700, -.090), (0, 1.694, -.112)]
    H[4] = [(0, 1.712, .120), (.066, 1.712, .106), (.093, 1.722, .010), (.072, 1.724, -.090), (0, 1.720, -.114)]
    B['nose'] = [(0, 1.638, .140), (.018, 1.640, .124), (.012, 1.680, .116), (0, 1.684, .122)]
    B['arm'] = [(cx - (.010 if i < 2 else .004), y, cz, rx*.94, rz*.94, t, g) for i, (cx, y, cz, rx, rz, t, g) in enumerate(B['arm'])]
    B['leg'] = [(.093, .800, -.010, .083, .102, 1.0, 'thigh'), (.089, .700, -.002, .075, .092, 0.5, 'thigh'), (.083, .580, .004, .058, .067, 0.0, 'thigh'), (.077, .505, .014, .049, .055, 0.0, 'calf'),
                (.077, .445, .002, .043, .048, 0.0, 'calf'), (.079, .345, -.018, .049, .060, 0.0, 'calf'), (.078, .200, -.014, .034, .040, 0.0, 'calf'), (.077, .095, -.012, .029, .035, 0.0, 'foot')]
    B['sole'] = (.077, 0.0, -.022, .037, .046); B['foot'] = [(.080, .078, .046, .082), (.083, .152, .052, .048), (.084, .222, .043, .030)]
    return B
BODY['feminine'] = _fem()
_bulk(BODY['masculine'], 1.20, 1.0)

def build(sex='masculine'):
    B = BODY[sex]; m = Mesh()
    ring5 = lambda pts: [None if p is None else m.V(*p) for p in pts]
    def trow(y, w, zf, zb, fx, fz, bx, bz): return [(0, y - .004, zf), (w*fx, y, zf*fz), (w, y + .004, (zf + zb)/2 + .004), (w*bx, y, zb*bz), (0, y - .002, zb)]
    def tbone(y): return 'pelvis' if y < 1.06 else 'spine_01' if y < 1.18 else 'spine_02' if y < 1.32 else 'spine_03'
    # torso column, bottom to top (half rings: front centre, front corner, side, back corner, back centre)
    P0 = ring5(B['pelvis']); C = ring5(B['crotch'])
    rows = [P0] + [ring5(trow(*r)) for r in B['torso']]; ys = [0.90] + [r[0] for r in B['torso']]
    for i in range(len(rows) - 1): m.bridge(rows[i], rows[i + 1], tbone((ys[i] + ys[i + 1])/2), closed=False)
    A0 = rows[-1]; A1 = ring5(B['a1']); A2 = ring5(B['a2'])
    m.F(A0[0], A0[1], A1[1], A1[0], 'spine_03'); m.F(A0[3], A0[4], A1[4], A1[3], 'spine_03')
    m.F(A1[0], A1[1], A2[1], A2[0], 'spine_03'); m.F(A1[3], A1[4], A2[4], A2[3], 'spine_03')
    N0 = ring5(B['n0']); N1 = ring5(B['n1'])
    m.bridge(A2, N0, 'spine_03', closed=False); m.bridge(N0, N1, 'neck_01', closed=False)
    prev = N1; hs = B.get('head_scale', (1, 1, 1)); hsc = lambda p: (p[0]*hs[0], 1.55 + (p[1] - 1.55)*hs[1], .008 + (p[2] - .008)*hs[2]); HR = []
    for k, hr in enumerate(B['head']):
        r = ring5([hsc(p) for p in hr]); HR.append(r)
        if k == 3:      # between the nose base and the eye line: the nose wedge replaces the front quad, the ear grows from the side quad
            lo = prev; tip, wing, bside, bridge = [m.V(*hsc(p)) for p in B['nose']]
            m.F(lo[0], lo[1], wing, tip, 'Head'); m.F(lo[1], r[1], bside, wing, 'Head'); m.F(r[1], r[0], bridge, bside, 'Head'); m.F(tip, wing, bside, bridge, 'Head')
            m.F(lo[1], lo[2], r[2], r[1], 'Head'); m.F(lo[3], lo[4], r[4], r[3], 'Head')
            q = [lo[2], lo[3], r[3], r[2]]; Pq = [np.array(m.v[i]) for i in q]; c = sum(Pq)/4; off, sc = B['ear']
            e = [m.V(*(c + (p - c)*np.array(sc) + np.array(off))) for p in Pq]; m.bridge(q, e, 'Head'); m.F(e[0], e[1], e[2], e[3], 'Head')
        else: m.bridge(prev, r, 'Head', closed=False)
        prev = r
    top = m.V(*hsc(B['crown'])); m.F(prev[0], prev[1], prev[2], top, 'Head'); m.F(top, prev[2], prev[3], prev[4], 'Head')
    # arm: grows out of the 2 x 2 side quads between the armpit and the shoulder top
    hole = [A0[1], A0[2], A0[3], A1[3], A2[3], A2[2], A2[1], A1[1]]   # front-inner, inner, back-inner, back, back-outer, outer, front-outer, front
    ANG = [135, 180, 225, 270, 315, 0, 45, 90]
    rings = []
    for cx, y, cz, rx, rz, tilt, tag in B['arm']:
        r = [m.V(cx + rx*math.cos(math.radians(a)), y + tilt*math.cos(math.radians(a)), cz + rz*math.sin(math.radians(a))) for a in ANG]
        rings.append((r, tag))
    prev = hole
    for k, (r, tag) in enumerate(rings):
        skip = (7,) if k == 8 else ()        # the thumb grows from the front-inner quad between the palm and the knuckles
        m.bridge(prev, r, tag + '_l', skip=skip); prev = r
    m.cap8(prev, 'hand_l')
    pa, kn = rings[7][0], rings[8][0]; q = [pa[7], pa[0], kn[0], kn[7]]; P = [np.array(m.v[i]) for i in q]; c = sum(P)/4
    for off, s in B['thumb']:
        r = [m.V(*(c + (p - c)*s + np.array(off))) for p in P]; m.bridge(q, r, 'hand_l'); q = r
    m.F(q[0], q[1], q[2], q[3], 'hand_l')
    # leg: the pelvis half ring plus the crotch line make the top loop
    L0 = [P0[0], P0[1], P0[2], P0[3], P0[4], C[2], C[1], C[0]]
    UNI = [-22.5, 22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5]; HIP = [-32, 22, 90, 152, 200, 238, 270, 302]
    prev = L0
    for cx, y, cz, rx, rz, bl, tag in B['leg']:
        r = []
        for u, h in zip(UNI, HIP):
            a = math.radians(u + (h - u)*bl); r.append(m.V(cx + rx*math.sin(a), y, cz + rz*math.cos(a)))
        m.bridge(prev, r, tag + '_l'); prev = r
    an = prev; cx, y, cz, rx, rz = B['sole']
    S = [m.V(cx + rx*math.sin(math.radians(u)), y, cz + rz*math.cos(math.radians(u))) for u in UNI]
    m.bridge(an, S, 'foot_l', skip=(7, 0, 1)); m.cap8([S[2], S[3], S[4], S[5], S[6], S[7], S[0], S[1]], 'foot_l')
    q = [an[7], an[0], an[1], an[2], S[2], S[1], S[0], S[7]]      # top-inner .. top-outer, bottom-outer .. bottom-inner
    for k, (fx, fz, hw, ty) in enumerate(B['foot']):
        xs = [fx - hw, fx - hw*.36, fx + hw*.36, fx + hw]; ys2 = [ty*.82, ty, ty, ty*.78]
        r = [m.V(xs[i], ys2[i], fz) for i in range(4)] + [m.V(xs[3 - i], 0.0, fz + (0.006 if k == 2 else 0)) for i in range(4)]
        m.bridge(q, r, 'foot_l' if k == 0 else 'ball_l'); q = r
    m.F(q[0], q[1], q[6], q[7], 'ball_l'); m.F(q[1], q[2], q[5], q[6], 'ball_l'); m.F(q[2], q[3], q[4], q[5], 'ball_l')
    return m

# ---------------------------------------------------------------- measurements for the clothes (read by assets/shaped/src/survivor.py)
def _slice(m, tags, y, xmin=None):
    pts = []
    for f, t in zip(m.f, m.tag):
        if t not in tags: continue
        for k in range(len(f)):
            a, b = m.v[f[k]], m.v[f[(k + 1) % len(f)]]
            if (a[1] - y)*(b[1] - y) < 0:
                u = (y - a[1])/(b[1] - a[1]); p = (a[0] + (b[0] - a[0])*u, a[2] + (b[2] - a[2])*u)
                if xmin is None or p[0] > xmin: pts.append(p)
    return pts
def fit(sex, joints):
    """Torso rows [y, half width, half depth, centre z] (an ellipse that holds every corner of the loop at that height),
    limb profiles [t, rx, rz] along each bone and where each limb's middle sits against the skeleton line."""
    m = mirror(build(sex)); torso = []
    for y in (0.92, 0.98, 1.04, 1.10, 1.16, 1.22, 1.28, 1.34, 1.40, 1.455):
        P = _slice(m, ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01'), y)
        zc = (max(p[1] for p in P) + min(p[1] for p in P))/2; a = max(abs(p[0]) for p in P); b = (max(p[1] for p in P) - min(p[1] for p in P))/2
        k = min(1.06, max((p[0]/a)**2 + ((p[1] - zc)/b)**2 for p in P)**0.5)      # a little over the loop; the corners may just touch the cloth
        torso.append([y, round(a*k, 4), round(b*k, 4), round(zc, 4)])
    prof = {}; off = {}
    chains = {'UP': ('upperarm', 'sh', 'el', ('upperarm_l', 'lowerarm_l')), 'LO': ('lowerarm', 'el', 'wr', ('upperarm_l', 'lowerarm_l', 'hand_l')),
              'TH': ('thigh', 'hp', 'kn', ('thigh_l', 'calf_l')), 'CA': ('calf', 'kn', 'an', ('thigh_l', 'calf_l', 'foot_l'))}
    for key, (bone, ja, jb, tags) in chains.items():
        A, Bq = joints[ja + 'l'], joints[jb + 'l']; rows = []
        for t in (0.0, 0.15, 0.3, 0.5, 0.7, 0.85, 1.0):
            y = A[1] + (Bq[1] - A[1])*t; P = []; tries = 0
            while len(P) < 4 and tries < 12: P = _slice(m, tags, y - 0.01*tries, xmin=0.0); tries += 1
            xs = [p[0] for p in P]; zs = [p[1] for p in P]; cx = (max(xs) + min(xs))/2; cz = (max(zs) + min(zs))/2
            rows.append((t, (max(xs) - min(xs))/2, (max(zs) - min(zs))/2, cx - (A[0] + (Bq[0] - A[0])*t), cz - (A[2] + (Bq[2] - A[2])*t)))
        dx = sum(r[3] for r in rows)/len(rows); dz = sum(r[4] for r in rows)/len(rows)
        med = sorted(r[2] for r in rows)[len(rows)//2]
        rows = [(t, rx, rz if rz > 0.5*med else med, ox, oz) for t, rx, rz, ox, oz in rows]       # a thin sliver at a bone end is not the limb's size
        prof[key] = [[t, round(rx + 0.4*abs(ox - dx), 4), round(rz + 0.4*abs(oz - dz), 4)] for t, rx, rz, ox, oz in rows]; off[bone] = [round(dx, 4), round(dz, 4)]
    return {'torso': torso, 'profiles': prof, 'fit': off}

# ---------------------------------------------------------------- preview: small z-buffer renderer with quad edges
def render(meshes, path, W=2300, H=820, views=((0, 'front'), (35, '3/4'), (90, 'side'), (180, 'back')), wire=True):
    img = np.full((H, W, 3), (236, 232, 224), np.float32); zb = np.full((H, W), -1e9, np.float32)
    cells = [(mi, vi) for mi in range(len(meshes)) for vi in range(len(views))]; cw = W/len(cells); sc = (H - 60)/1.9
    L = np.array([0.35, 0.55, 0.75]); L /= np.linalg.norm(L)
    for ci, (mi, vi) in enumerate(cells):
        m = meshes[mi]; a = math.radians(views[vi][0]); P = np.array(m.v)
        X = P[:, 0]*math.cos(a) + P[:, 2]*math.sin(a); Z = -P[:, 0]*math.sin(a) + P[:, 2]*math.cos(a); Y = P[:, 1]
        sx = cw*(ci + .5) + X*sc; sy = H - 30 - Y*sc; R = np.stack([X, Y, Z], 1)
        for f in m.f:
            n = np.cross(R[f[1]] - R[f[0]], R[f[2]] - R[f[0]])
            if len(f) == 4: n = np.cross(R[f[2]] - R[f[0]], R[f[3]] - R[f[1]])
            ln = np.linalg.norm(n)
            if ln < 1e-12: continue
            n /= ln
            if n[2] <= 0: continue
            sh = 0.42 + 0.58*max(0.0, float(n @ L)); col = np.array((196, 160, 132))*sh
            for t in range(1, len(f) - 1):
                tri = (f[0], f[t], f[t + 1]); xs = sx[list(tri)]; ys = sy[list(tri)]; zs = Z[list(tri)]
                x0, x1 = int(max(0, math.floor(xs.min()))), int(min(W - 1, math.ceil(xs.max()))); y0, y1 = int(max(0, math.floor(ys.min()))), int(min(H - 1, math.ceil(ys.max())))
                if x1 < x0 or y1 < y0: continue
                gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
                d = (ys[1] - ys[2])*(xs[0] - xs[2]) + (xs[2] - xs[1])*(ys[0] - ys[2])
                if abs(d) < 1e-9: continue
                w0 = ((ys[1] - ys[2])*(gx - xs[2]) + (xs[2] - xs[1])*(gy - ys[2]))/d; w1 = ((ys[2] - ys[0])*(gx - xs[2]) + (xs[0] - xs[2])*(gy - ys[2]))/d; w2 = 1 - w0 - w1
                z = w0*zs[0] + w1*zs[1] + w2*zs[2]; ok = (w0 >= -1e-4) & (w1 >= -1e-4) & (w2 >= -1e-4) & (z > zb[y0:y1 + 1, x0:x1 + 1])
                zb[y0:y1 + 1, x0:x1 + 1][ok] = z[ok]; img[y0:y1 + 1, x0:x1 + 1][ok] = col
        if wire:
            done = set()
            for f in m.f:
                for k in range(len(f)):
                    e = (min(f[k], f[(k + 1) % len(f)]), max(f[k], f[(k + 1) % len(f)]))
                    if e in done: continue
                    done.add(e); a0, b0 = e; n = int(max(abs(sx[a0] - sx[b0]), abs(sy[a0] - sy[b0]))) + 1
                    t = np.linspace(0, 1, n + 1); px = (sx[a0] + (sx[b0] - sx[a0])*t).astype(int); py = (sy[a0] + (sy[b0] - sy[a0])*t).astype(int); pz = Z[a0] + (Z[b0] - Z[a0])*t
                    ok = (px >= 0) & (px < W) & (py >= 0) & (py < H); px, py, pz = px[ok], py[ok], pz[ok]; vis = pz >= zb[py, px] - 0.004
                    img[py[vis], px[vis]] = img[py[vis], px[vis]]*0.45
    from PIL import Image
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(path)

def write_obj(m, path, note):
    names = sorted(set(m.tag))
    with open(path, 'w') as fh:
        fh.write('# %s\n# Metres, Y up, facing +Z, left side is +X. Quads. Groups are the skeleton bones.\n' % note)
        for p in m.v: fh.write('v %.5f %.5f %.5f\n' % tuple(p))
        for nm in names:
            fh.write('g %s\n' % nm)
            for f, t in zip(m.f, m.tag):
                if t == nm: fh.write('f ' + ' '.join(str(i + 1) for i in f) + '\n')

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    for sex in BODY:
        half = build(sex)
        open(os.path.join(out, 'survivor_base_%s_blender.py' % sex), 'w').write('# Open Blender, Scripting tab, run this. Builds the AfterStreet survivor base (%s) as a half cage with Mirror and Subdivision modifiers.\n# The cage is Y up; the object is turned so it stands Z up in Blender.\nimport bpy, math\nverts = %s\nfaces = %s\nmesh = bpy.data.meshes.new("SurvivorBase")\nmesh.from_pydata(verts, [], faces)\nmesh.update()\nobj = bpy.data.objects.new("SurvivorBase_%s", mesh)\nbpy.context.collection.objects.link(obj)\nobj.rotation_euler.x = math.radians(90)\nm = obj.modifiers.new("Mirror", "MIRROR"); m.use_axis = (True, False, False); m.use_clip = True; m.merge_threshold = 0.0005\ns = obj.modifiers.new("Subdivision", "SUBSURF"); s.levels = 1; s.render_levels = 1\n' % (sex, json.dumps([[round(c, 5) for c in p] for p in half.v]), json.dumps([list(f) for f in half.f]), sex))
        cage = mirror(half); bad, vol = orient(cage); sub = subdivide(cage); orient(sub)
        P = np.array(sub.v)
        print(sex, 'cage quads', len(cage.f), 'open or shared-by-3 edges', bad, '| subdivided quads', len(sub.f), 'tris', 2*len(sub.f), '| height %.3f width %.3f' % (P[:, 1].max(), P[:, 0].max()*2), 'volume %.4f' % vol)
        write_obj(cage, os.path.join(out, 'survivor_base_%s_cage.obj' % sex), 'AfterStreet survivor base, %s, cage' % sex)
        write_obj(sub, os.path.join(out, 'survivor_base_%s.obj' % sex), 'AfterStreet survivor base, %s, one subdivision level' % sex)
        render([cage], os.path.join(out, 'survivor_base_%s.png' % sex), W=1900, H=900, views=((0, 'front'), (35, '3/4'), (90, 'side'), (145, 'back 3/4'), (180, 'back')))
