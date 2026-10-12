#!/usr/bin/env python3
"""Turns Quaternius "Universal Base Characters" (CC0) into animated survivors, using clips from the
"Universal Animation Library" packs (CC0), which share the same skeleton.
Usage: python3 tools/build_people.py <Universal Base Characters folder> <Universal Animation Library 2 folder> [<Universal Animation Library folder>] [full] [preview]
Every clip is sampled into a handful of frames and the skinned body is baked for each frame, so the game only swaps meshes.
Each triangle stores which part of the body it is (skin, shirt, trousers, shoes, hair) for plain colours, and which painted tile it
uses (head, torso, arm, legs, feet, hair) with texture coordinates made by wrapping each part in a cylinder in the rest pose, so the
detail (faces, collars, stripes, pockets, laces) comes from tools/paint_people.py rather than from extra geometry. The packs' own
eye and eyebrow meshes are left out: eyes and brows are painted. Output: tools/out/<lite|full>/people.txt. The packs are not copied into the repo."""
import sys, os, json, struct, base64, math, glob
import numpy as np
from PIL import Image
args = [a for a in sys.argv[1:] if a not in ('full', 'preview', 'pack')]
UBC, UAL2 = args[0], args[1]; UAL1 = args[2] if len(args) > 2 else None
FULL = 'full' in sys.argv; PREVIEW = 'preview' in sys.argv
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'full' if FULL else 'lite')
CT = {5120:('b',1),5121:('B',1),5122:('h',2),5123:('H',2),5125:('I',4),5126:('f',4)}; NC = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}

def load(path):
    if path.endswith('.glb'):
        d = open(path, 'rb').read(); n = struct.unpack('<I', d[12:16])[0]; j = json.loads(d[20:20+n]); bins = [d[20+n+8:]]
    else:
        j = json.load(open(path)); bins = [open(os.path.join(os.path.dirname(path), b['uri']), 'rb').read() for b in j['buffers']]
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; b = bins[v.get('buffer', 0)]; t, sz = CT[a['componentType']]; nc = NC[a['type']]
        off = v.get('byteOffset', 0) + a.get('byteOffset', 0); st = v.get('byteStride', 0) or sz*nc
        raw = np.frombuffer(b, dtype=np.uint8, count=st*(a['count']-1) + sz*nc, offset=off)
        if st == sz*nc: arr = raw.view('<' + t).reshape(a['count'], nc)
        else: arr = np.stack([raw[k*st:k*st+sz*nc].view('<' + t) for k in range(a['count'])])
        arr = arr.astype(np.float64)
        if a.get('normalized') and t != 'f': arr = arr/{'B':255.0,'H':65535.0,'b':127.0,'h':32767.0}[t]
        return arr
    return j, acc

def qmat(q):
    x, y, z, w = q; return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
def trs(t, r, s):
    M = np.eye(4); M[:3, :3] = qmat(r)*np.array(s); M[:3, 3] = t; return M
def slerp(a, b, f):
    a = np.array(a); b = np.array(b); d = float(np.dot(a, b))
    if d < 0: b = -b; d = -d
    if d > 0.9995: q = a + (b - a)*f; return q/np.linalg.norm(q)
    th = math.acos(d); return (math.sin((1-f)*th)*a + math.sin(f*th)*b)/math.sin(th)

class Clips:
    """animation clips by name, from one or more library files; sample(name, t) gives {bone name: (path, value)}"""
    def __init__(self, paths):
        self.c = {}
        for p in paths:
            j, acc = load(p); names = [n.get('name') for n in j['nodes']]
            for a in j.get('animations', []):
                chans = []
                for ch in a['channels']:
                    s = a['samplers'][ch['sampler']]; tin = acc(s['input'])[:, 0]; out = acc(s['output'])
                    if s.get('interpolation') == 'CUBICSPLINE': out = out.reshape(len(tin), 3, -1)[:, 1]
                    chans.append((names[ch['target']['node']], ch['target']['path'], tin, out, s.get('interpolation', 'LINEAR')))
                if a['name'] not in self.c: self.c[a['name']] = (chans, max(c[2][-1] for c in chans))
    def has(self, n): return n in self.c
    def length(self, n): return self.c[n][1]
    def sample(self, n, t):
        chans, L = self.c[n]; o = {}
        for bone, path, tin, out, interp in chans:
            if t <= tin[0]: v = out[0]
            elif t >= tin[-1]: v = out[-1]
            else:
                k = int(np.searchsorted(tin, t)) - 1; f = (t - tin[k])/(tin[k+1] - tin[k])
                v = out[k] if interp == 'STEP' else (slerp(out[k], out[k+1], f) if path == 'rotation' else out[k]*(1-f) + out[k+1]*f)
            o.setdefault(bone, {})[path] = np.array(v)
        return o

lib = [p for p in glob.glob(os.path.join(glob.escape(UAL2), '**', '*.glb'), recursive=True) if not p.endswith('_RM.glb') and 'Mannequin' not in p]
if UAL1: lib = [p for p in glob.glob(os.path.join(glob.escape(UAL1), '**', '*.glb'), recursive=True) if not p.endswith('_RM.glb') and 'Mannequin' not in p] + lib
CL = Clips(lib); print('clips', len(CL.c))

STYL = 'pack' not in sys.argv   # 'pack' keeps the pack's own body instead of the stylised one
HEADS = 1.0 if STYL else 1.24
# softer, less heroic proportions: thinner limbs and a narrower chest (each bone's own y axis runs along it)
SHAPE = {} if STYL else {'upperarm_l':(0.84, 1, 0.84), 'upperarm_r':(0.84, 1, 0.84), 'thigh_l':(0.88, 1, 0.88), 'thigh_r':(0.88, 1, 0.88), 'spine_03':(0.92, 1, 0.9), 'spine_02':(0.95, 1, 0.93)}
LEG = ('pelvis', 'thigh', 'calf', 'foot', 'ball', 'root')
REG = {'skin':0, 'shirt':1, 'pants':2, 'shoes':3, 'hair':4, 'eyes':5}

def simplify(P, TR, dom, target):
    """merge points that share a small cube of space until about target triangles are left; returns new points and triangles"""
    lo, hi = 0.002, 0.1
    for _ in range(18):
        cell = (lo + hi)/2; key = np.floor(P/cell).astype(np.int64); k = key[:, 0]*73856093 ^ key[:, 1]*19349663 ^ key[:, 2]*83492791 ^ dom*2654435761
        u, inv = np.unique(k, return_inverse=True); t = inv[TR]; ok = (t[:, 0] != t[:, 1]) & (t[:, 1] != t[:, 2]) & (t[:, 0] != t[:, 2]); ts = np.sort(t[ok], 1); _, first = np.unique(ts, axis=0, return_index=True)
        if len(first) > target: lo = cell
        else: hi = cell
    keep = np.where(ok)[0][np.sort(first)]; tri = inv[TR][keep]; nv = len(u)
    cnt = np.bincount(inv, minlength=nv).astype(np.float64); V = np.stack([np.bincount(inv, P[:, a], nv)/cnt for a in range(3)], 1)
    used = np.unique(tri); remap = -np.ones(nv, int); remap[used] = np.arange(len(used)); return V[used], remap[tri]

# ---------------- the stylised body: built here from the skeleton, in the spirit of flat low-poly illustration ----------------
# Faceted tubes for the torso, limbs and neck, a big octagonal head with a small wedge nose, mitten hands and simple shoes.
# Each ring of a tube is tied to one or two bones, so the same animations move it. Hair is made the same way, as blocky shells.
HS = 1.18   # head size
def make_body(J, fem):
    Pv, Wv, Tr = [], [], []
    def vert(p, w): Pv.append(np.array(p, float)); Wv.append(w); return len(Pv) - 1
    def tube(rings, n, rot, e1, e2, cap0=True, cap1=True):
        """rings: list of (centre, r1, r2, weights); r1 along e1, r2 along e2"""
        idx = []
        for c, a, b, w in rings:
            row = []
            for k in range(n):
                t = rot + 2*np.pi*k/n; row.append(vert(np.array(c) + e1*a*np.cos(t) + e2*b*np.sin(t), w))
            idx.append(row)
        for i in range(len(idx) - 1):
            for k in range(n):
                a0, a1, b0, b1 = idx[i][k], idx[i][(k + 1) % n], idx[i+1][k], idx[i+1][(k + 1) % n]; Tr.append([a0, a1, b1]); Tr.append([a0, b1, b0])
        for cap, row, ring in ((cap0, idx[0], rings[0]), (cap1, idx[-1], rings[-1])):
            if cap: c0 = vert(np.mean([Pv[q] for q in row], 0), ring[3]); [Tr.append([c0, row[k], row[(k + 1) % n]]) for k in range(n)]
        return idx
    X, Y, Z = np.array([1., 0, 0]), np.array([0, 1., 0]), np.array([0, 0, 1.])
    g = lambda n: J[n]
    pel, s1, s2, s3, nk, hd = g('pelvis'), g('spine_01'), g('spine_02'), g('spine_03'), g('neck_01'), g('Head')
    # torso: hips to shoulders, an octagon with a flat front
    T = [(pel[1] - 0.09, 0.168, 0.118, -0.03, {'pelvis': 1}), (pel[1] + 0.035, 0.162, 0.114, -0.03, {'pelvis': 1}), (s1[1] + 0.035, 0.15, 0.106, -0.012, {'spine_01': 1}),
         (s2[1] + 0.06, 0.162, 0.114, -0.004, {'spine_02': 1}), (s3[1] + 0.1, 0.18, 0.112, -0.014, {'spine_03': 1}), (nk[1] - 0.005, 0.165, 0.098, -0.032, {'spine_03': 1}), (nk[1] + 0.03, 0.07, 0.064, -0.035, {'neck_01': 1})]
    if fem: T = [(y, a*m1, b*m2, z, w) for (y, a, b, z, w), m1, m2 in zip(T, [1.08, 1.04, 0.9, 0.9, 0.86, 0.86, 0.95], [1.04, 1.02, 0.95, 0.98, 0.98, 0.98, 0.95])]
    tube([((0, y, z), a, b, w) for y, a, b, z, w in T], 8, np.pi/8, X, Z, True, False)
    # neck
    tube([((0, nk[1] + 0.01, nk[2] + 0.005), 0.05, 0.048, {'neck_01': 1}), ((0, hd[1] + 0.03, hd[2] + 0.005), 0.05, 0.048, {'Head': 1})], 6, 0, X, Z, False, False)
    # head: an octagon, flat in front, with the jaw a little forward
    H = [(-0.02, 0.07, 0.064, 0.025), (0.035, 0.104, 0.104, 0.014), (0.11, 0.122, 0.12, 0.004), (0.2, 0.12, 0.118, 0.0), (0.262, 0.088, 0.092, -0.006)]
    hz = hd[2] + 0.015
    hr = tube([((0, hd[1] + dy*HS, hz + dz*HS), a*HS, b*HS, {'Head': 1}) for dy, a, b, dz in H], 8, np.pi/8, X, Z, True, False)
    top = vert((0, hd[1] + 0.285*HS, hz - 0.006*HS), {'Head': 1}); [Tr.append([top, hr[-1][k], hr[-1][(k + 1) % 8]]) for k in range(8)]
    # a small wedge nose on the flat of the face
    fz = hz + 0.12*HS*np.cos(np.pi/8) + 0.002; ny = hd[1] + 0.1*HS
    n0, n1, n2, n3 = vert((0, ny + 0.03*HS, fz - 0.004), {'Head': 1}), vert((-0.017*HS, ny - 0.012*HS, fz), {'Head': 1}), vert((0.017*HS, ny - 0.012*HS, fz), {'Head': 1}), vert((0, ny - 0.008*HS, fz + 0.028*HS), {'Head': 1})
    Tr += [[n0, n1, n3], [n0, n3, n2], [n1, n2, n3]]
    rf = 0.88 if fem else 1.0; lf = 0.92 if fem else 1.0
    for sd in ('l', 'r'):
        sg = 1 if sd == 'l' else -1; ua, la, ha, th, ca, ft, bl = g('upperarm_' + sd), g('lowerarm_' + sd), g('hand_' + sd), g('thigh_' + sd), g('calf_' + sd), g('foot_' + sd), g('ball_' + sd)
        ex = X*sg
        # arm: shoulder, elbow, wrist
        A = [(ua[0] - sg*0.045, 0.06, 0.058, {'upperarm_' + sd: 1}), ((ua[0] + la[0])/2, 0.056, 0.054, {'upperarm_' + sd: 1}), (la[0], 0.05, 0.05, {'upperarm_' + sd: 0.5, 'lowerarm_' + sd: 0.5}), (ha[0] - sg*0.012, 0.04, 0.042, {'lowerarm_' + sd: 1})]
        tube([((x, ua[1] + (0.0 if i else 0.01), ua[2] + (la[2] - ua[2])*min(1, i/2)), a*rf, b*rf, w) for i, (x, a, b, w) in enumerate(A)], 6, np.pi/6, Y, Z, True, False)
        # mitten hand and thumb
        tube([((ha[0] - sg*0.01, ha[1], ha[2] + 0.005), 0.026*rf/0.707, 0.042*rf/0.707, {'hand_' + sd: 1}), ((ha[0] + sg*0.09, ha[1] - 0.004, ha[2] + 0.01), 0.022*rf/0.707, 0.048*rf/0.707, {'hand_' + sd: 1}),
              ((ha[0] + sg*0.155, ha[1] - 0.01, ha[2] + 0.01), 0.016*rf/0.707, 0.038*rf/0.707, {'hand_' + sd: 1})], 4, np.pi/4, Y, Z)
        tube([((ha[0] + sg*0.035, ha[1] - 0.004, ha[2] + 0.045), 0.014, 0.014, {'hand_' + sd: 1}), ((ha[0] + sg*0.08, ha[1] - 0.012, ha[2] + 0.075), 0.011, 0.011, {'hand_' + sd: 1})], 4, np.pi/4, Y, X)
        # leg: hip, thigh, knee, calf, ankle
        L = [(th[1] + 0.05, 0.09, 0.094, {'pelvis': 0.5, 'thigh_' + sd: 0.5}), ((th[1] + ca[1])/2, 0.082, 0.086, {'thigh_' + sd: 1}), (ca[1], 0.064, 0.068, {'thigh_' + sd: 0.5, 'calf_' + sd: 0.5}),
             ((ca[1] + ft[1])/2 + 0.04, 0.062, 0.064, {'calf_' + sd: 1}), (ft[1] + 0.03, 0.046, 0.048, {'calf_' + sd: 0.5, 'foot_' + sd: 0.5})]
        tube([((th[0] - sg*0.005, y, th[2] + (0.0 if i < 2 else (ft[2] - th[2])*0.25*(i - 1))), a*lf, b*lf, w) for i, (y, a, b, w) in enumerate(L)], 8, np.pi/8, Z, X, False, True)
        # shoe: heel to toe
        F = [(ft[2] - 0.055, 0.052, 0.05, 0.05, {'foot_' + sd: 1}), (ft[2] + 0.01, 0.058, 0.056, 0.056, {'foot_' + sd: 1}), (bl[2], 0.036, 0.036, 0.055, {'foot_' + sd: 0.4, 'ball_' + sd: 0.6}), (bl[2] + 0.085, 0.026, 0.024, 0.046, {'ball_' + sd: 1})]
        tube([((ft[0], y, z), h/0.707, wd/0.707, w) for z, y, h, wd, w in F], 4, np.pi/4, Y, X)
    eyes = np.array([0.05, hd[1] + 0.135*HS, fz])
    # hair: blocky shells over the head, rigid on the head bone
    prof = [(dy*HS, a*HS, b*HS, dz*HS) for dy, a, b, dz in H]
    def head_r(y):
        ys = [hd[1] + p[0] for p in prof]; return np.interp(y, ys, [p[1] for p in prof]), np.interp(y, ys, [p[2] for p in prof])
    def shell(bottom, sc, flare=1.0, lift=0.0, segs=None):
        hp, ht = [], []; n = 8; rows = []
        tz = hd[1] + 0.285*HS + 0.02 + lift
        for i, t in enumerate([0, 0.3, 0.6, 0.82, 0.95]):
            row = []
            for k in range(n):
                a = np.pi/8 + 2*np.pi*k/n; yb = hd[1] + bottom(a)*HS; y = yb + (tz - 0.02 - yb)*t; rx, rz = head_r(min(y, hd[1] + 0.262*HS)); m = sc*(flare if i == 0 else 1)*(0.82 if t > 0.9 else 1)
                row.append(len(hp)); hp.append(np.array([np.sin(a)*rx*m, y, hz + np.cos(a)*rz*m]))
            rows.append(row)
        for i in range(len(rows) - 1):
            for k in range(n):
                if segs is not None and k not in segs: continue
                a0, a1, b0, b1 = rows[i][k], rows[i][(k + 1) % n], rows[i+1][k], rows[i+1][(k + 1) % n]; ht += [[a0, a1, b1], [a0, b1, b0]]
        if segs is None:
            c = len(hp); hp.append(np.array([0, tz, hz])); ht += [[c, rows[-1][k], rows[-1][(k + 1) % n]] for k in range(n)]
        return np.array(hp), np.array(ht)
    def merge(*parts):
        P_, T_ = [], []; o = 0
        for p, t in parts: P_.append(p); T_.append(t + o); o += len(p)
        return np.vstack(P_), np.vstack(T_)
    def front(a): return np.cos(a)   # 1 in front, -1 behind
    def blob(c, r):
        p = [np.array(c) + np.array(d)*r for d in [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]]
        t = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]; return np.array(p), np.array(t)
    buzz = lambda a: 0.13 + 0.07*max(0, front(a)) - 0.05*max(0, -front(a))
    hairs = [('Hair_Buzzed', *shell(buzz, 1.035)),
             ('Hair_SimpleParted', *shell(lambda a: 0.12 + 0.07*max(0, front(a)) - 0.08*max(0, -front(a)), 1.1, 1.0, 0.03)),
             ('Hair_Long', *shell(lambda a: 0.17 if front(a) > 0.8 else -0.01 if front(a) > 0.2 else -0.03, 1.1, 1.17, 0.02)),
             ('Hair_Buns', *merge(shell(buzz, 1.05), blob((0.085*HS, hd[1] + 0.27*HS, hz - 0.04*HS), 0.06*HS), blob((-0.085*HS, hd[1] + 0.27*HS, hz - 0.04*HS), 0.06*HS))),
             ('Hair_Beard', *merge(shell(buzz, 1.04), shell(lambda a: -0.03, 1.07, 1.0, -(0.285*HS + 0.02) + 0.07*HS, segs=[7, 0, 1, 2, 5, 6])))]
    # hats sit over the hair and turn with the head
    fzz = hz + 0.125*HS*np.cos(np.pi/8)*1.16; by = hd[1] + 0.2*HS
    brim = (np.array([[-0.1*HS, by, fzz - 0.03], [0.1*HS, by, fzz - 0.03], [0.09*HS, by - 0.012, fzz + 0.085*HS], [-0.09*HS, by - 0.012, fzz + 0.085*HS],
                      [-0.1*HS, by + 0.012, fzz - 0.03], [0.1*HS, by + 0.012, fzz - 0.03], [0.09*HS, by, fzz + 0.085*HS], [-0.09*HS, by, fzz + 0.085*HS]]),
            np.array([[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [3, 2, 6], [3, 6, 7], [0, 3, 7], [0, 7, 4], [1, 5, 6], [1, 6, 2]]))
    hairs += [('Hat_Beanie', *merge(shell(lambda a: 0.19 + 0.025*front(a), 1.15, 1.0, 0.045), shell(lambda a: 0.185 + 0.025*front(a), 1.19, 1.0, -(0.285*HS + 0.02) + 0.245*HS))),
              ('Hat_Cap', *merge(shell(lambda a: 0.2 + 0.01*front(a), 1.14, 1.0, 0.01), brim)),
              ('Hat_Helmet', *shell(lambda a: 0.165 + 0.02*front(a), 1.2, 1.06, 0.05))]
    JI_, JW_ = [], []
    for w in Wv:
        items = sorted(w.items(), key=lambda kv: -kv[1])[:4]; ji = [J['_idx'][k] for k, _ in items] + [0]*(4 - len(items)); jw = [v for _, v in items] + [0]*(4 - len(items)); JI_.append(ji); JW_.append(jw)
    return np.array(Pv), np.array(JI_, int), np.array(JW_, float), np.array(Tr, int), eyes, hairs

def build(gltf, tex, target, hair_files):
    j, acc = load(gltf); N = j['nodes']; skin = j['skins'][0]; joints = skin['joints']; IBM = acc(skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    par = {}
    for i, nd in enumerate(N):
        for c in nd.get('children', []): par[c] = i
    rest = [(np.array(nd.get('translation', [0, 0, 0]), float), np.array(nd.get('rotation', [0, 0, 0, 1]), float), np.array(nd.get('scale', [1, 1, 1]), float)) for nd in N]
    name = [nd.get('name') for nd in N]; jname = [name[i] for i in joints]
    P, UV, JI, JW, TR, MAT = [], [], [], [], [], []; base = 0; eyes = None
    Jp = {jname[k]: np.linalg.inv(IBM[k])[:3, 3] for k in range(len(jname))}; Jp['_idx'] = {n2: k for k, n2 in enumerate(jname)}
    if STYL:
        P, JI, JW, TR, eyes, genhairs = make_body(Jp, 'Female' in gltf); UV = np.zeros((len(P), 2)); MAT = np.array(['Body']*len(TR)); target = len(TR) + 50
    for i, nd in enumerate(N):
        if 'mesh' not in nd or STYL: continue
        if nd.get('name') in ('Eyes', 'Eyebrows'):
            if nd.get('name') == 'Eyes': ep = acc(j['meshes'][nd['mesh']]['primitives'][0]['attributes']['POSITION']); eyes = ep[ep[:, 0] > 0].mean(0)
            continue
        for pr in j['meshes'][nd['mesh']]['primitives']:
            a = pr['attributes']; p = acc(a['POSITION']); P.append(p); UV.append(acc(a['TEXCOORD_0'])); JI.append(acc(a['JOINTS_0']).astype(int)); JW.append(acc(a['WEIGHTS_0']))
            t = acc(pr['indices']).reshape(-1, 3).astype(int) + base; TR.append(t); MAT += [j['materials'][pr['material']]['name']]*len(t); base += len(p)
    if not STYL: P = np.vstack(P); UV = np.vstack(UV); JI = np.vstack(JI); JW = np.vstack(JW); TR = np.vstack(TR); MAT = np.array(MAT)
    JW = JW/np.maximum(JW.sum(1, keepdims=True), 1e-9)
    # body part of each triangle, from the bone that moves it most
    dom = JI[np.arange(len(P)), JW.argmax(1)]; tdom = np.array([jname[k] for k in dom[TR[:, 0]]])
    reg = np.zeros(len(TR), int)
    for k, nm in enumerate(tdom):
        if 'Hair' in MAT[k]: reg[k] = REG['hair']
        elif 'Eye' in MAT[k]: reg[k] = REG['eyes']
        elif nm.startswith(('foot', 'ball')): reg[k] = REG['shoes']
        elif nm.startswith(('pelvis', 'thigh', 'calf', 'root')): reg[k] = REG['pants']
        elif nm.startswith(('spine', 'clavicle', 'upperarm', 'lowerarm')): reg[k] = REG['shirt']
        else: reg[k] = REG['skin']
    im = np.asarray(Image.open(tex).convert('RGB').resize((1024, 1024), Image.LANCZOS)).astype(np.float64); c = UV[TR].mean(1)
    px = np.clip((c[:, 0] % 1)*1024, 0, 1023).astype(int); py = np.clip((c[:, 1] % 1)*1024, 0, 1023).astype(int); lum = im[py, px] @ np.array([0.3, 0.59, 0.11])
    shade = np.ones(len(TR))
    for r in range(6):
        m = reg == r
        if m.any(): shade[m] = np.clip(lum[m]/max(1, np.median(lum[m])), 0.72, 1.18) if r == 0 else np.clip(0.92 + 0.12*(lum[m]/max(1, np.median(lum[m])) - 1), 0.85, 1.05)
    # extra hair meshes, rigid on the head bone
    hairs = list(genhairs) if STYL else []
    for hf in ([] if STYL else hair_files):
        hj, hacc = load(hf); hp, ht = [], []; hb = 0
        hpar = {}
        for i, nd in enumerate(hj['nodes']):
            for c2 in nd.get('children', []): hpar[c2] = i
        for i, nd in enumerate(hj['nodes']):
            if 'mesh' not in nd: continue
            for pr in hj['meshes'][nd['mesh']]['primitives']:
                p = hacc(pr['attributes']['POSITION'])
                if 'skin' in nd and 'JOINTS_0' in pr['attributes']:
                    sk = hj['skins'][nd['skin']]; ibm = hacc(sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
                    def hw(k):
                        nd2 = hj['nodes'][k]; M = trs(nd2.get('translation', [0, 0, 0]), nd2.get('rotation', [0, 0, 0, 1]), nd2.get('scale', [1, 1, 1]))
                        return hw(hpar[k]) @ M if k in hpar else M
                    ji = hacc(pr['attributes']['JOINTS_0']).astype(int); wts = hacc(pr['attributes']['WEIGHTS_0']); jt = sk['joints']
                    Ms = np.stack([hw(jt[k]) @ ibm[k] for k in range(len(jt))]); ph = np.c_[p, np.ones(len(p))]; o = np.zeros((len(p), 3))
                    for k in range(4): o += wts[:, k:k+1]*np.einsum('nij,nj->ni', Ms[ji[:, k]], ph)[:, :3]
                    p = o
                hp.append(p); ht.append(hacc(pr['indices']).reshape(-1, 3).astype(int) + hb); hb += len(p)
        hp = np.vstack(hp); ht = np.vstack(ht); hv, htr = simplify(hp, ht, np.zeros(len(hp), int), 700 if FULL else 260)
        hairs.append((os.path.splitext(os.path.basename(hf))[0], hv, htr))
    # simplify the body: points sharing a small cube of space (and the same main bone) become one point
    lo, hi = 0.003, 0.1
    for _ in range(18):
        cell = (lo + hi)/2; key = np.floor(P/cell).astype(np.int64); k = key[:, 0]*73856093 ^ key[:, 1]*19349663 ^ key[:, 2]*83492791 ^ dom*2654435761
        u, inv = np.unique(k, return_inverse=True); t = inv[TR]; ok = (t[:, 0] != t[:, 1]) & (t[:, 1] != t[:, 2]) & (t[:, 0] != t[:, 2]); ts = np.sort(t[ok], 1); _, first = np.unique(ts, axis=0, return_index=True)
        if len(first) > target: lo = cell
        else: hi = cell
    keep = np.where(ok)[0][np.sort(first)]; tri = inv[TR][keep]; nv = len(u)
    cnt = np.bincount(inv, minlength=nv).astype(np.float64); V = np.stack([np.bincount(inv, P[:, a], nv)/cnt for a in range(3)], 1)
    rep = np.zeros(nv, int); dd = ((P - V[inv])**2).sum(1)
    for i in np.argsort(-dd): rep[inv[i]] = i
    VI = JI[rep]; VW = JW[rep]; treg = reg[keep]; tsh = shade[keep]
    used = np.unique(tri); remap = -np.ones(nv, int); remap[used] = np.arange(len(used)); tri = remap[tri]; V = V[used]; VI = VI[used]; VW = VW[used]
    # which painted tile each triangle uses, and where it falls on it
    vb = np.array([jname[k] for k in JI[np.arange(len(P)), JW.argmax(1)][rep]]); vb = vb[used] if len(vb) != len(V) else vb
    tb = vb[tri]   # bone of each corner
    def kind_of(names):
        n = names[0]
        if n.startswith(('Head', 'neck')): return 0
        if n.startswith(('spine', 'clavicle')): return 1
        if n.startswith(('upperarm', 'lowerarm', 'hand', 'index', 'middle', 'pinky', 'ring', 'thumb')): return 2
        if n.startswith(('foot', 'ball')): return 4
        return 3
    tkind = np.array([kind_of(tb[k]) for k in range(len(tri))])
    vk = lambda kk: V[np.unique(tri[tkind == kk])]
    vbn = lambda pre: V[np.array([b.startswith(pre) for b in vb])]
    H, T, A, L, F = vk(0), vk(1), vk(2), vk(3), vk(4)
    neck = vbn('neck'); hand = vbn(('hand', 'index', 'middle', 'pinky', 'ring', 'thumb')); thigh = vbn('thigh'); calf = vbn('calf'); pelv = vbn('pelvis'); upa = vbn('upperarm')
    ey = eyes if eyes is not None else np.array([0.03, H[:, 1].min() + 0.6*(H[:, 1].max() - H[:, 1].min()), 0.07])
    K = dict(h0=neck[:, 1].min(), he=ey[1], h1=H[:, 1].max(), hz=H[:, 2].mean() - 0.01, t0=pelv[:, 1].max() - 0.06, t1=neck[:, 1].min() + 0.02, tz=T[:, 2].mean(),
             a0=np.abs(upa[:, 0]).min(), aw=np.abs(hand[:, 0]).min(), a1=np.abs(A[:, 0]).max(), ay=A[:, 1].mean(), az=A[:, 2].mean(),
             knee=(thigh[:, 1].min() + calf[:, 1].max())/2, waist=pelv[:, 1].max(), lx=np.abs(thigh[:, 0]).mean(), lz=thigh[:, 2].mean(), fz0=F[:, 2].min(), fz1=F[:, 2].max(), fy1=F[:, 1].max())
    pw = lambda x, xs, vs: np.interp(x, xs, vs)
    def uv_of(p, kk, cen=None):
        x, y, z = p[:, 0], p[:, 1], p[:, 2]
        if kk == 0: return 0.5 + np.arctan2(x, z - K['hz'])/(2*np.pi), pw(y, [K['h0'], K['he'], K['h1']], [0.02, 0.6, 0.98])
        if kk == 1: return 0.5 + np.arctan2(x, z - K['tz'])/(2*np.pi), pw(y, [K['t0'], K['t1']], [0.02, 0.98])
        if kk == 2: return 0.5 + np.arctan2(y - K['ay'], z - K['az'])/(2*np.pi), pw(np.abs(x), [K['a0'], K['aw'], K['a1']], [0.02, 0.7, 0.98])
        if kk == 3:
            if cen: u = 0.5 + np.arctan2(x, z - K['tz'])/(2*np.pi)
            else: u = 0.5 + np.arctan2(np.abs(x) - K['lx'], z - K['lz'])/(2*np.pi)
            return u, pw(y, [0, K['knee'], K['waist']], [0.02, 0.5, 0.98])
        return pw(z, [K['fz0'], K['fz1']], [0.04, 0.96]), pw(y, [-0.01, K['fy1']], [0.04, 0.96])
    tuv = np.zeros((len(tri), 3, 2))
    for k in range(len(tri)):
        kk = tkind[k]; cen = kk == 3 and all(b.startswith(('pelvis', 'root')) for b in tb[k])
        u, v = uv_of(V[tri[k]], kk, cen)
        if kk != 4 and u.max() - u.min() > 0.5: u = np.where(u < 0.5, u + 1, u)   # across the seam at the back
        tuv[k, :, 0] = u; tuv[k, :, 1] = np.clip(v, 0.01, 0.99)
    hj_ = joints.index(name.index('Head')) if 'Head' in name else 0
    def world_mats(sample):
        L = []
        for i in range(len(N)):
            t, r, s = rest[i]; a = sample.get(name[i], {}) if sample else {}
            if 'rotation' in a: r = a['rotation']
            if 'translation' in a and name[i] in ('pelvis',): t = a['translation']
            if name[i] in SHAPE: s = s*np.array(SHAPE[name[i]])
            L.append(trs(t, r, s))
        W = [None]*len(N)
        def wm(i):
            if W[i] is None: W[i] = (wm(par[i]) @ L[i]) if i in par else L[i]
            return W[i]
        return [wm(i) for i in range(len(N))]
    def pose(sample, extra=None):
        W = world_mats(sample); W[name.index('Head')] = W[name.index('Head')] @ np.diag([HEADS, HEADS, HEADS, 1.0])   # a bigger head, for a friendlier, more readable figure
        Ms = np.stack([W[joints[k]] @ IBM[k] for k in range(len(joints))])
        Vh = np.c_[V, np.ones(len(V))]; o = np.zeros((len(V), 3))
        for k in range(4): o += VW[:, k:k+1]*np.einsum('nij,nj->ni', Ms[VI[:, k]], Vh)[:, :3]
        hm = Ms[hj_]; hs = []
        for _, hp, _ in hairs: hs.append((np.c_[hp, np.ones(len(hp))] @ (hm).T)[:, :3])
        return o, hs, W[joints[hj_]][:3, 3]
    huv = []
    for _, hp, ht in hairs:
        c = H[:, [0, 2]].mean(0); x, y, z = hp[:, 0], hp[:, 1], hp[:, 2]; u = 0.5 + np.arctan2(x - c[0], z - c[1])/(2*np.pi); v = np.clip((y - K['h0'])/(K['h1'] + 0.06 - K['h0']), 0.01, 0.99)
        uu = u[ht]; vv = v[ht]; sw = (uu.max(1) - uu.min(1)) > 0.5; uu[sw] = np.where(uu[sw] < 0.5, uu[sw] + 1, uu[sw]); huv.append(np.stack([uu, vv], 2))
    hjy = [ (np.linalg.inv(IBM[k]))[1, 3] for k in [hj_] ][0]
    return dict(V=V, tri=tri, reg=treg, kind=tkind, uv=tuv, huv=huv, pose=pose, hairs=hairs, ht=float((K['h1'] - hjy)*HEADS), hf=float((H[:, 2].max() - H[:, 2].mean())*HEADS))

def frames(clip, n, t0=0, t1=None):
    L = CL.length(clip); t1 = L if t1 is None else t1
    return [CL.sample(clip, t0 + (t1 - t0)*f/n) for f in range(n)]
def blend(a, b, bones):
    """take the listed bones from b, the rest from a"""
    o = dict(a)
    for k, v in b.items():
        if k.startswith(bones): o[k] = v
    return o

def clipset():
    """the survivor's moves. Uses the first library's walk, run, crouch and death when it is there; otherwise builds them from the second"""
    S = {}
    pick = lambda *ns: next((n for n in ns if CL.has(n)), None)
    idle = pick('Idle_Loop', 'Idle_FoldArms_Loop'); S['idle'] = frames(idle, 10)
    relaxed = CL.sample(pick('Idle_Loop', 'Idle_No_Loop', 'Idle_FoldArms_Loop'), 0.0)
    w = pick('Walk_Loop', 'Jog_Fwd_Loop')
    if w: S['walk'] = frames(w, 12)
    else: S['walk'] = [blend(relaxed, f, LEG + ('spine_01',)) for f in frames('Walk_Carry_Loop', 12)]
    r = pick('Sprint_Loop', 'Jog_Fwd_Loop'); S['run'] = frames(r, 10) if r else S['walk']
    cw = pick('Crouch_Fwd_Loop', 'Crouch_Walk_Loop'); ci = pick('Crouch_Idle_Loop')
    if cw: S['crouchwalk'] = frames(cw, 12); S['crouch'] = frames(ci, 8) if ci else frames(cw, 1)
    else:
        sd = pick('Farm_PlantSeed'); L = CL.length(sd); best = min(frames(sd, 24), key=lambda s: s.get('pelvis', {}).get('translation', np.array([0, 9, 0]))[1]); S['crouch'] = [blend(relaxed, best, LEG + ('spine',))]
    S['attack'] = frames(pick('Sword_Regular_A', 'Melee_Hook', 'Punch_Jab'), 8)
    S['throw'] = frames(pick('OverhandThrow'), 8)
    S['search'] = frames(pick('Chest_Open', 'Interact'), 8)
    S['chop'] = frames(pick('TreeChopping_Loop'), 10)
    hk = pick('Hit_Chest', 'Hit_Knockback'); S['hit'] = frames(hk, 6, 0, CL.length(hk)*(1 if hk == 'Hit_Chest' else 0.3))
    S['eat'] = frames(pick('Consume'), 8)
    d = pick('Death01', 'Death_A'); S['dead'] = [CL.sample(d, CL.length(d))] if d else [CL.sample('LayToIdle', 0.0)]
    S['talk'] = frames(pick('Idle_Talking_Loop', 'Idle_TalkingPhone_Loop', 'Idle_FoldArms_Loop'), 10)
    if CL.has('Swim_Fwd_Loop'): S['swim'] = frames('Swim_Fwd_Loop', 10); S['swimidle'] = frames(pick('Swim_Idle_Loop', 'Swim_Fwd_Loop'), 8)
    if CL.has('Pistol_Shoot'): S['shoot'] = frames('Pistol_Shoot', 6)
    if CL.has('Idle_Torch_Loop'): S['light'] = frames('Idle_Torch_Loop', 8)
    return S

BD = os.path.join(UBC, 'Base Characters', 'Godot - UE'); HD = os.path.join(UBC, 'Hairstyles', 'Rigged to Head Bone', 'glTF (Godot -Unreal)')
HAIRS = ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Long', 'Hair_Buns', 'Hair_Beard'] + (['Hat_Beanie', 'Hat_Cap', 'Hat_Helmet'] if STYL else [])
S = clipset(); print({k: len(v) for k, v in S.items()})
index, blob = {}, b''
FWD = lambda p: np.stack([p[:, 2], p[:, 1], -p[:, 0]], 1)   # the model faces +z; the game wants forward along +x
for key, gl, tex in [('male', 'Superhero_Male_FullBody.gltf', 'T_Superhero_Male_Dark.png'), ('female', 'Superhero_Female_FullBody.gltf', 'T_Superhero_Female_Dark_BaseColor.png')]:
    B = build(os.path.join(BD, gl), os.path.join(BD, tex), 3600 if FULL else 1500, [os.path.join(HD, h + '.gltf') for h in HAIRS])
    clips, poses, hairp, heads = {}, [], [[] for _ in HAIRS], []
    for nm, fr in S.items():
        clips[nm] = [len(poses), len(fr)]
        for smp in fr:
            o, hs, hd = B['pose'](smp); poses.append(o); heads.append(hd)
            for k, h in enumerate(hs): hairp[k].append(h)
    lift = -min(p[:, 1].min() for i, p in enumerate(poses) if i < clips['dead'][0] or i >= clips['dead'][0] + 1)
    lift = -np.median([p[:, 1].min() for p in poses])
    q = lambda p: np.clip(np.round(FWD(p + np.array([0, lift, 0]))*1000), -32000, 32000).astype('<i2')
    quv = lambda a: np.clip(np.round(a*16000), 0, 65535).astype('<u2').tobytes()
    data = B['tri'].astype('<u2').tobytes() + B['reg'].astype(np.uint8).tobytes() + B['kind'].astype(np.uint8).tobytes() + quv(B['uv']) + b''.join(q(p).tobytes() for p in poses)
    info = {'tex': 1, 'ht': round(B['ht'], 3), 'hf': round(B['hf'], 3), 'nv': len(B['V']), 'nt': len(B['tri']), 'clips': clips, 'h': round(float(poses[0][:, 1].max() + lift), 2), 'o': len(blob), 'hd': [[round(float(v), 3) for v in FWD(np.array([h]) + np.array([0, lift, 0]))[0]] for h in heads]}
    blob += data; index[key] = info
    for k, (hn, hp, ht) in enumerate(B['hairs']):
        hd2 = ht.astype('<u2').tobytes() + quv(B['huv'][k]) + b''.join(q(p).tobytes() for p in hairp[k]); index[key + ':' + hn] = {'nv': len(hp), 'nt': len(ht), 'o': len(blob), 'hair': 1}; blob += hd2
    print(key, info['nv'], info['nt'], 'frames', len(poses), 'h', info['h'], 'hair', [(h[0], len(h[1])) for h in B['hairs']])
    if PREVIEW:
        import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
        names = list(clips); fig, ax = plt.subplots(2, len(names), figsize=(2.2*len(names), 6))
        for c, nm in enumerate(names):
            s0 = clips[nm][0] + clips[nm][1]//2; p = FWD(poses[s0] + np.array([0, lift, 0]))
            for r, (a, b) in enumerate([(0, 1), (2, 1)]):
                tt = B['tri']; reg = B['reg']; cols = np.array([[.9, .7, .55], [.2, .4, .8], [.2, .2, .25], [.1, .1, .1], [.35, .2, .1], [0, 0, 0]])
                for k in range(0, len(tt), 2): ax[r][c].fill(p[tt[k], a], p[tt[k], b], color=cols[reg[k]], linewidth=0)
                ax[r][c].set_aspect('equal'); ax[r][c].set_title(nm if r == 0 else ''); ax[r][c].axis('off')
        plt.tight_layout(); plt.savefig(os.path.join(os.environ.get('PREVIEW_DIR', '/tmp'), 'people_' + key + '.png'), dpi=70)
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'people.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print(round(len(blob)/1024), 'KB')
