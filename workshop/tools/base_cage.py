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
   pelvis=[(0, .868, .088), (.088, .898, .092), (.152, .935, -.006), (.098, .888, -.112), (0, .862, -.106)],
   crotch=[(0, .836, .046), (0, .822, -.008), (0, .836, -.062)],
   torso=[  # y, half width, front z, back z, front-corner x and z factors, back-corner x and z factors
     (0.985, .152, .096, -.130, .70, .88, .74, .92),     # hips
     (1.085, .128, .090, -.070, .72, .86, .74, .84),     # waist
     (1.195, .154, .110, -.094, .76, .86, .78, .86),     # ribs
     (1.300, .152, .132, -.110, .78, .88, .80, .88)],    # chest at the armpit
   a1=[(0, 1.378, .122), (.118, 1.378, .106), None, (.118, 1.380, -.100), (0, 1.384, -.112)],
   a2=[(0, 1.434, .078), (.104, 1.444, .054), (.150, 1.447, -.004), (.104, 1.450, -.066), (0, 1.452, -.092)],
   n0=[(0, 1.462, .056), (.048, 1.478, .044), (.072, 1.500, .000), (.050, 1.498, -.050), (0, 1.488, -.068)],
   n1=[(0, 1.532, .064), (.042, 1.535, .050), (.059, 1.538, .010), (.042, 1.540, -.038), (0, 1.540, -.054)],
   head=[[(0, 1.548, .110), (.060, 1.556, .094), (.086, 1.594, .014), (.058, 1.576, -.056), (0, 1.570, -.072)],
         [(0, 1.632, .124), (.074, 1.634, .106), (.099, 1.640, .016), (.072, 1.636, -.084), (0, 1.634, -.106)],
         [(0, 1.708, .122), (.076, 1.708, .102), (.101, 1.708, .012), (.076, 1.708, -.092), (0, 1.706, -.116)],
         [(0, 1.772, .100), (.068, 1.776, .082), (.092, 1.774, .008), (.068, 1.776, -.074), (0, 1.772, -.096)]],
   crown=(0, 1.806, .004), head_scale=(1.08, 1.05, 1.08),
   arm=[  # centre x, y, centre z, radius x, radius z, tilt (outer side raised)
     (.184, 1.372, -.002, .054, .066, .050, 'upperarm'),  # deltoid
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
   thumb=[((-.002, -.006, .026), 1.35), ((-.006, -.030, .050), 1.25), ((-.010, -.060, .062), .85)],
   leg=[  # centre x, y, centre z, radius x, radius z, blend toward the hip angles
     (.088, .800, -.010, .078, .094, 1.0, 'thigh'),
     (.086, .700, -.004, .070, .086, 0.5, 'thigh'),
     (.081, .580, .002, .057, .066, 0.0, 'thigh'),
     (.076, .500, .010, .050, .056, 0.0, 'calf'),         # knee
     (.076, .440, .000, .046, .052, 0.0, 'calf'),
     (.078, .340, -.016, .051, .061, 0.0, 'calf'),        # calf muscle
     (.078, .200, -.014, .036, .042, 0.0, 'calf'),
     (.077, .095, -.012, .030, .036, 0.0, 'foot')],       # ankle
   sole=(.077, 0.0, -.026, .042, .054),
   foot=[(.080, .080, .050, .088), (.084, .160, .057, .052), (.085, .236, .047, .032)]),   # centre x, z, half width, top y
}
def _bulk(B, arm, leg):
    B['arm'] = [(cx + (rx*(arm - 1) if i < 6 else 0), y, cz, rx*(arm if i < 6 else 1), rz*(arm if i < 6 else 1), t, g) for i, (cx, y, cz, rx, rz, t, g) in enumerate(B['arm'])]
    B['leg'] = [(cx + rx*(leg - 1)*(1 if i < 3 else .3), y, cz, rx*leg, rz*leg, bl, g) for i, (cx, y, cz, rx, rz, bl, g) in enumerate(B['leg'])]
def _fem():
    import copy
    B = copy.deepcopy(BODY['masculine'])
    B['pelvis'] = [(0, .868, .086), (.094, .900, .090), (.166, .938, -.006), (.106, .888, -.118), (0, .862, -.110)]
    B['torso'] = [(0.985, .166, .094, -.128, .70, .88, .72, .88), (1.095, .106, .084, -.066, .72, .86, .74, .84), (1.195, .128, .106, -.084, .74, .88, .76, .84), (1.300, .134, .136, -.096, .76, .94, .78, .84)]
    B['a1'] = [(0, 1.378, .114), (.102, 1.378, .102), None, (.100, 1.380, -.082), (0, 1.384, -.100)]
    B['a2'] = [(0, 1.434, .072), (.094, 1.444, .050), (.138, 1.446, -.004), (.094, 1.450, -.060), (0, 1.452, -.082)]
    B['n0'] = [(0, 1.462, .050), (.038, 1.478, .038), (.056, 1.494, .000), (.040, 1.494, -.042), (0, 1.488, -.058)]
    B['n1'] = [(0, 1.532, .058), (.032, 1.535, .044), (.045, 1.538, .010), (.032, 1.540, -.030), (0, 1.540, -.042)]
    B['head'][0] = [(0, 1.552, .106), (.050, 1.560, .090), (.078, 1.596, .014), (.054, 1.576, -.056), (0, 1.570, -.072)]
    B['arm'] = [(cx - (.010 if i < 2 else .004), y, cz, rx*(.94 if i < 6 else .94), rz*(.94 if i < 6 else .94), t, g) for i, (cx, y, cz, rx, rz, t, g) in enumerate(B['arm'])]
    B['leg'] = [(.093, .800, -.010, .083, .100, 1.0, 'thigh'), (.090, .700, -.004, .075, .090, 0.5, 'thigh'), (.083, .580, .002, .059, .068, 0.0, 'thigh'), (.077, .500, .010, .050, .056, 0.0, 'calf'),
                (.077, .440, .000, .046, .052, 0.0, 'calf'), (.079, .340, -.016, .050, .060, 0.0, 'calf'), (.078, .200, -.014, .035, .041, 0.0, 'calf'), (.077, .095, -.012, .029, .035, 0.0, 'foot')]
    B['sole'] = (.077, 0.0, -.022, .037, .046); B['foot'] = [(.080, .078, .046, .082), (.083, .152, .052, .048), (.084, .222, .043, .030)]
    return B
BODY['feminine'] = _fem()
_bulk(BODY['masculine'], 1.20, 1.13)
BODY['masculine']['head'][0] = [(0, 1.546, .112), (.068, 1.554, .096), (.092, 1.592, .014), (.060, 1.576, -.056), (0, 1.570, -.072)]

def build(sex='masculine'):
    B = BODY[sex]; m = Mesh()
    ring5 = lambda pts: [None if p is None else m.V(*p) for p in pts]
    def trow(y, w, zf, zb, fx, fz, bx, bz): return [(0, y - .004, zf), (w*fx, y, zf*fz), (w, y + .004, (zf + zb)/2 + .004), (w*bx, y, zb*bz), (0, y - .002, zb)]
    # torso column, bottom to top (half rings: front centre, front corner, side, back corner, back centre)
    P0 = ring5(B['pelvis']); C = ring5(B['crotch'])
    rows = [P0] + [ring5(trow(*r)) for r in B['torso']]
    tags = ['pelvis', 'spine_01', 'spine_02', 'spine_03']
    for i in range(len(rows) - 1): m.bridge(rows[i], rows[i + 1], tags[i], closed=False)
    A0 = rows[-1]; A1 = ring5(B['a1']); A2 = ring5(B['a2'])
    m.F(A0[0], A0[1], A1[1], A1[0], 'spine_03'); m.F(A0[3], A0[4], A1[4], A1[3], 'spine_03')
    m.F(A1[0], A1[1], A2[1], A2[0], 'spine_03'); m.F(A1[3], A1[4], A2[4], A2[3], 'spine_03')
    N0 = ring5(B['n0']); N1 = ring5(B['n1'])
    m.bridge(A2, N0, 'spine_03', closed=False); m.bridge(N0, N1, 'neck_01', closed=False)
    prev = N1; hs = B.get('head_scale', (1, 1, 1)); hsc = lambda p: (p[0]*hs[0], 1.55 + (p[1] - 1.55)*hs[1], .012 + (p[2] - .012)*hs[2])
    for hr in B['head']:
        r = ring5([hsc(p) for p in hr]); m.bridge(prev, r, 'Head', closed=False); prev = r
    top = m.V(*hsc(B['crown'])); m.F(prev[0], prev[1], prev[2], top, 'Head'); m.F(top, prev[2], prev[3], prev[4], 'Head')
    # arm: grows out of the 2 x 2 side quads between the armpit and the shoulder top
    hole = [A0[1], A0[2], A0[3], A1[3], A2[3], A2[2], A2[1], A1[1]]   # front-inner, inner, back-inner, back, back-outer, outer, front-outer, front
    ANG = [135, 180, 225, 270, 315, 0, 45, 90]
    prev = hole; rings = []
    for cx, y, cz, rx, rz, tilt, tag in B['arm']:
        r = [m.V(cx + rx*math.cos(math.radians(a)), y + tilt*math.cos(math.radians(a)), cz + rz*math.sin(math.radians(a))) for a in ANG]
        rings.append((r, tag)); prev = r
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
        xs = [fx - hw, fx - hw*.36, fx + hw*.36, fx + hw]; ys = [ty*.82, ty, ty, ty*.78]
        r = [m.V(xs[i], ys[i], fz) for i in range(4)] + [m.V(xs[3 - i], 0.0, fz + (0.006 if k == 2 else 0)) for i in range(4)]
        m.bridge(q, r, 'foot_l' if k == 0 else 'ball_l'); q = r
    m.F(q[0], q[1], q[6], q[7], 'ball_l'); m.F(q[1], q[2], q[5], q[6], 'ball_l'); m.F(q[2], q[3], q[4], q[5], 'ball_l')
    # the crotch strip closes itself on the mirror plane (L0's inner chain lies on x = 0), nothing more to add
    return m

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
        render([cage, sub], os.path.join(out, 'survivor_base_%s.png' % sex), views=((0, 'front'), (35, '3/4'), (90, 'side'), (180, 'back')))
