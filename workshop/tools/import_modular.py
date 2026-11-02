#!/usr/bin/env python3
"""Converts Quaternius "Ultimate Modular Men / Women" characters (CC0) into AfterStreet survivor parts.
Run: python3 workshop/tools/import_modular.py <glb folder with modular_men/ and modular_women/>   -> workshop/tools/data/modular_parts.json
Steps: skin each mesh at its bind pose, re-pose it from the T-pose onto the survivor skeleton (bone by bone, linear blend), drop the painted face,
simplify with a small quadric edge collapse, then cut it into per-bone, per-colour pieces. Colours that matter map to creator slots (SKIN, HAIR, SHIRT, PANTS).
The models are CC0 (https://quaternius.com/packs/ultimatemodularcharacters.html); no credit is needed, it is given anyway in the pack notes."""
import json, struct, sys, os, math, heapq
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
# ---- our skeleton (survivor.js rest pose) ----
# read the survivor skeleton from the generated pack
SJ = open(os.path.join(HERE, '../../assets/shaped/survivor.js')).read()
def our_bones():
    import re
    i = SJ.index(').survivor = ') + len(').survivor = '); j = json.loads(SJ[i: SJ.rindex('}') + 1]); return j['bones']
BONES = our_bones()

def load_glb(path):
    b = open(path, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + l]); o = 20 + l
    bl = struct.unpack('<I', b[o:o + 4])[0]; binb = b[o + 8:o + 8 + bl]; return j, binb
CT = {5126: ('f4', 4), 5123: ('u2', 2), 5125: ('u4', 4), 5121: ('u1', 1), 5120: ('i1', 1), 5122: ('i2', 2)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def acc(j, binb, i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; dt, sz = CT[a['componentType']]; n = NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride') or n*sz
    raw = np.frombuffer(binb, dtype=np.uint8)
    arr = np.stack([np.frombuffer(raw[off + k*stride: off + k*stride + n*sz].tobytes(), dtype=dt) for k in range(a['count'])]) if stride != n*sz else np.frombuffer(binb, dtype=dt, count=a['count']*n, offset=off).reshape(a['count'], n)
    arr = arr.astype(np.float64) if a['componentType'] == 5126 else arr
    if a.get('normalized'): arr = arr / float({5121: 255, 5123: 65535}[a['componentType']])
    return arr
def trs(n):
    if 'matrix' in n: return np.array(n['matrix']).reshape(4, 4).T
    t = np.array(n.get('translation', [0, 0, 0])); q = n.get('rotation', [0, 0, 0, 1]); s = np.array(n.get('scale', [1, 1, 1]))
    x, y, z, w = q; R = np.array([[1 - 2*(y*y + z*z), 2*(x*y - z*w), 2*(x*z + y*w)], [2*(x*y + z*w), 1 - 2*(x*x + z*z), 2*(y*z - x*w)], [2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x + y*y)]])
    M = np.eye(4); M[:3, :3] = R * s; M[:3, 3] = t; return M
def world(j):
    nodes = j['nodes']; W = [None]*len(nodes); par = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []): par[c] = i
    def get(i):
        if W[i] is None: W[i] = (get(par[i]) if i in par else np.eye(4)) @ trs(nodes[i])
        return W[i]
    for i in range(len(nodes)): get(i)
    return W
def srgb(c):
    f = lambda v: 12.92*v if v <= 0.0031308 else 1.055*(v ** (1/2.4)) - 0.055
    return '%02x%02x%02x' % tuple(int(round(max(0, min(1, f(v)))*255)) for v in c[:3])

# ---- bone map: Quaternius joint -> our bone, with the Quaternius joint pair that gives the bone's pivot and direction ----
def side(s): return {'L': 'l', 'R': 'r'}[s]
PRIMARY = {'pelvis': ('Hips', 'Abdomen'), 'spine_01': ('Abdomen', 'Torso'), 'spine_02': ('Torso', 'Chest'), 'spine_03': ('Chest', 'Neck'), 'neck_01': ('Neck', 'Head'), 'Head': ('Head', None)}
for s in 'LR':
    PRIMARY['upperarm_' + side(s)] = ('UpperArm.' + s, 'LowerArm.' + s); PRIMARY['lowerarm_' + side(s)] = ('LowerArm.' + s, 'Hand.' + s)
    PRIMARY['hand_' + side(s)] = ('Hand.' + s, 'Middle3.' + s); PRIMARY['thigh_' + side(s)] = ('UpperLeg.' + s, 'LowerLeg.' + s)
    PRIMARY['calf_' + side(s)] = ('LowerLeg.' + s, 'Foot.' + s); PRIMARY['foot_' + side(s)] = ('Foot.' + s, None)
def bone_of_joint(name):
    base = name.split('.')[0]; s = name.split('.')[-1] if '.' in name else ''
    if base in ('Root', 'Hips'): return 'pelvis'
    if base == 'Abdomen': return 'spine_01'
    if base == 'Torso': return 'spine_02'
    if base in ('Chest', 'Shoulder'): return 'spine_03'
    if base == 'Neck': return 'neck_01'
    if base == 'Head': return 'Head'
    if base == 'UpperArm': return 'upperarm_' + side(s)
    if base == 'LowerArm': return 'lowerarm_' + side(s)
    if base == 'UpperLeg': return 'thigh_' + side(s)
    if base == 'LowerLeg': return 'calf_' + side(s)
    if base == 'Foot': return 'foot_' + side(s)
    return 'hand_' + side(s)      # Hand and every finger

def rot_between(a, b):
    a = a/np.linalg.norm(a); b = b/np.linalg.norm(b); v = np.cross(a, b); c = float(a @ b)
    if c < -0.9999: return np.diag([1, -1, -1.0])
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]]); return np.eye(3) + K + K @ K/(1 + c)

def decimate(V, F, lab, target, boundary_w=2000.0):
    """quadric edge collapse. V (n,3), F (m,3), lab (n,) per-vertex labels kept from the surviving vertex. returns V, F, lab (compacted)"""
    V = V.copy(); F = [tuple(f) for f in F]; n = len(V)
    alive_f = [True]*len(F); vf = [set() for _ in range(n)]
    for fi, f in enumerate(F):
        for v in f: vf[v].add(fi)
    Q = [np.zeros((4, 4)) for _ in range(n)]
    def plane(a, b, c):
        nrm = np.cross(V[b] - V[a], V[c] - V[a]); ar = np.linalg.norm(nrm)
        if ar < 1e-14: return None, 0
        nrm = nrm/ar; return np.append(nrm, -nrm @ V[a]), ar/2
    ecount = {}
    for f in F:
        for i in range(3):
            e = tuple(sorted((f[i], f[(i + 1) % 3]))); ecount[e] = ecount.get(e, 0) + 1
    for f in F:
        p, ar = plane(*f)
        if p is None: continue
        K = np.outer(p, p)*ar
        for v in f: Q[v] += K
        for i in range(3):
            a, b = f[i], f[(i + 1) % 3]
            if ecount[tuple(sorted((a, b)))] == 1:   # boundary: a plane through the edge, square to the face
                ed = V[b] - V[a]; pn = np.cross(ed, p[:3]); l = np.linalg.norm(pn)
                if l > 1e-12:
                    pn = pn/l; pp = np.append(pn, -pn @ V[a]); K2 = np.outer(pp, pp)*boundary_w*np.linalg.norm(ed)
                    Q[a] += K2; Q[b] += K2
    ver = [0]*n; alive_v = [True]*n
    def cost(a, b):
        Qs = Q[a] + Q[b]; best = None
        for p in (V[a], V[b], (V[a] + V[b])/2):
            h = np.append(p, 1.0); c = h @ Qs @ h
            if best is None or c < best[0]: best = (c, p)
        return best
    heap = []
    def push(a, b):
        c, p = cost(a, b); heapq.heappush(heap, (c, a, b, ver[a], ver[b], p.copy()))
    edges = set()
    for f in F:
        for i in range(3): edges.add(tuple(sorted((f[i], f[(i + 1) % 3]))))
    for a, b in edges: push(a, b)
    nf = len(F)
    while nf > target and heap:
        c, a, b, va, vb, p = heapq.heappop(heap)
        if not (alive_v[a] and alive_v[b]) or ver[a] != va or ver[b] != vb: continue
        # collapse b into a at p; refuse a fold-over
        ok = True; shared = vf[a] & vf[b]
        for fi in (vf[a] | vf[b]) - shared:
            f = F[fi]; pts = [V[x] for x in f]; before = np.cross(pts[1] - pts[0], pts[2] - pts[0])
            pts2 = [p if x in (a, b) else V[x] for x in f]; after = np.cross(pts2[1] - pts2[0], pts2[2] - pts2[0])
            nb, na = np.linalg.norm(before), np.linalg.norm(after)
            if na < 1e-12 or nb < 1e-12 or (before @ after)/(nb*na) < 0.25: ok = False; break
        if not ok: continue
        keep_lab = lab[a] if np.linalg.norm(p - V[a]) <= np.linalg.norm(p - V[b]) else lab[b]
        V[a] = p; lab[a] = keep_lab; Q[a] = Q[a] + Q[b]; alive_v[b] = False
        for fi in list(shared): alive_f[fi] = False; nf -= 1; [vf[x].discard(fi) for x in F[fi]]
        for fi in list(vf[b]):
            if alive_f[fi]:
                F[fi] = tuple(a if x == b else x for x in F[fi]); vf[a].add(fi)
        vf[b] = set(); ver[a] += 1
        nbr = set()
        for fi in vf[a]:
            for x in F[fi]:
                if x != a: nbr.add(x)
        for x in nbr: push(a, x) if alive_v[x] else None
    keep = [i for i in range(n) if alive_v[i] and vf[i]]; idx = {v: k for k, v in enumerate(keep)}
    NF = [[idx[x] for x in F[fi]] for fi in range(len(F)) if alive_f[fi] and len(set(F[fi])) == 3]
    return V[keep], np.array(NF, dtype=int), np.array([lab[i] for i in keep])

def convert(path, body, budget):
    j, binb = load_glb(path); W = world(j); nodes = j['nodes']
    sk = j['skins'][0]; jn = [nodes[i]['name'] for i in sk['joints']]   # joint order is shared by the four skins of one character
    jw = {nodes[i]['name']: W[i] for i in sk['joints']}
    out = {'top': [], 'bottoms': [], 'shoes': [], 'head': []}
    # skinned positions at the bind pose, per primitive
    prims = []
    for ni, n in enumerate(nodes):
        if 'mesh' not in n or 'skin' not in n: continue
        s = j['skins'][n['skin']]; ibm = acc(j, binb, s['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
        jm = np.stack([W[s['joints'][k]] @ ibm[k] for k in range(len(s['joints']))])
        part = {'Pants': 'Legs'}.get(n['name'].split('_')[-1], n['name'].split('_')[-1])
        for p in j['meshes'][n['mesh']]['primitives']:
            P = acc(j, binb, p['attributes']['POSITION']); J0 = acc(j, binb, p['attributes']['JOINTS_0']).astype(int); W0 = np.nan_to_num(acc(j, binb, p['attributes']['WEIGHTS_0'])); z = W0.sum(1) < 1e-6; W0[z, 0] = 1.0   # a few source weights are NaN
            ph = np.hstack([P, np.ones((len(P), 1))]); pos = np.zeros((len(P), 3))
            for k in range(4): pos += W0[:, k:k + 1]*np.einsum('nij,nj->ni', jm[J0[:, k]], ph)[:, :3]
            mt = j['materials'][p['material']]; prims.append({'part': part, 'mat': mt['name'], 'col': mt['pbrMetallicRoughness']['baseColorFactor'], 'pos': pos, 'J': J0, 'W': W0, 'F': acc(j, binb, p['indices']).astype(int).reshape(-1, 3), 'jn': [nodes[i]['name'] for i in s['joints']]})
    # scale: skin head top to 1.78 m
    sk = [p['pos'][:, 1].max() for p in prims if p['part'] == 'Head' and p['mat'] == 'Skin']
    top = max(sk) if sk else max(p['pos'][:, 1].max() for p in prims if p['part'] == 'Head' and p['mat'] not in ('Visor',)) - 0.04; sc = 1.78/top; headtop = top*sc
    # bone transforms
    A = {}
    qjoint = {k: jw[k][:3, 3]*sc for k in jw}
    for ob, (qa, qb) in PRIMARY.items():
        piv = np.array(BONES[ob]['pivot'], float); tip = np.array(BONES[ob]['tip'], float); dO = tip - piv; qp = qjoint[qa]
        if qb: dQ = qjoint[qb] - qp
        elif ob == 'Head':
            dQ = np.array([0, headtop - qp[1], 0])
        else: dQ = dO.copy()       # a foot keeps its shape: only its ankle moves
        lq, lo = np.linalg.norm(dQ), np.linalg.norm(dO); d = dQ/lq; k = lo/lq if ob not in ('foot_l', 'foot_r', 'Head') else 1.0
        R = rot_between(d, dO); S = np.eye(3) + (k - 1)*np.outer(d, d); A[ob] = (R @ S, qp, piv)
    obones = list(PRIMARY.keys()); oi = {b: i for i, b in enumerate(obones)}
    for p in prims:
        if p['mat'] in ('Eye', 'Eyebrows'): continue
        # weld
        pos = p['pos']*sc; key = {}; remap = np.zeros(len(pos), int); keep = []
        for i, v in enumerate(pos):
            kk = tuple(np.round(v, 4))
            if kk not in key: key[kk] = len(keep); keep.append(i)
            remap[i] = key[kk]
        V0 = pos[keep]; F0 = remap[p['F']]; F0 = F0[(F0[:, 0] != F0[:, 1]) & (F0[:, 1] != F0[:, 2]) & (F0[:, 0] != F0[:, 2])]
        # per-vertex weights over our bones
        Wb = np.zeros((len(keep), len(obones)))
        for r, i in enumerate(keep):
            for k in range(4):
                if p['W'][i, k] > 0: Wb[r, oi[bone_of_joint(p['jn'][p['J'][i, k]])]] += p['W'][i, k]
        posed = np.zeros_like(V0)
        for ob in obones:
            M, qp, piv = A[ob]; w = Wb[:, oi[ob]:oi[ob] + 1]
            if w.max() > 0: posed += w*((V0 - qp) @ M.T + piv)
        lab = Wb.argmax(1)
        tgt = max(12, int(len(F0)*budget.get((p['part'], p['mat']), budget.get(p['part'], 0.4))))
        V1, F1, L1 = decimate(posed, F0, lab.copy(), tgt)
        p['out'] = (V1, F1, L1)
    return prims, obones

def pieces(prims, obones, slots):
    """-> {part: {bone: [piece]}} ; piece = poly {s:'poly', p, v, f, c}"""
    res = {}
    for p in prims:
        if 'out' not in p: continue
        V, F, L = p['out']; part = p['part']; c = slots.get((part, p['mat'])) or 'x' + srgb(p['col'])
        for ob in set(L[F[:, 0]]) | set(L[F[:, 1]]) | set(L[F[:, 2]]):
            sel = [f for f in F if np.bincount(L[f], minlength=len(obones)).argmax() == ob] if False else None
        # triangles go to the bone most of their corners belong to
        owner = np.array([np.bincount(L[f], minlength=len(obones)).argmax() for f in F])
        for k in set(owner):
            fs = F[owner == k]; used = sorted(set(fs.ravel())); m = {u: i for i, u in enumerate(used)}; pts = V[used]
            cen = (pts.min(0) + pts.max(0))/2
            piece = {'s': 'poly', 'p': [round(float(x), 3) for x in cen], 'v': [[round(float(x), 3) for x in (q - cen)] for q in pts], 'f': [[m[a] for a in f] for f in fs.tolist()], 'c': c}
            res.setdefault(part, {}).setdefault(obones[k], []).append(piece)
    return res

if __name__ == '__main__':
    root = sys.argv[1]; names = sys.argv[2:] or None
    BUDGET = {('Body', 'Skin'): 0.15, 'Body': 0.34, ('Legs', 'Skin'): 0.3, 'Legs': 0.36, 'Feet': 0.4, ('Head', 'Skin'): 0.35, ('Head', 'Hair'): 0.18, 'Head': 0.3, 'Backpack': 0.4}
    data = {}
    for body, folder in (('masculine', 'modular_men'), ('feminine', 'modular_women')):
        for fn in sorted(os.listdir(os.path.join(root, folder))):
            nm = fn[:-4]
            if names and (folder[8] + ':' + nm) not in names: continue
            prims, ob = convert(os.path.join(root, folder, fn), body, BUDGET)
            # creator slots: skin, hair, and the biggest clothes colour of the body and of the legs
            slots = {}; defaults = {}
            for part, slot in (('Body', 'SHIRT'), ('Legs', 'PANTS')):
                cl = [q for q in prims if q['part'] == part and q['mat'] not in ('Skin',) and 'out' in q]
                if cl: big = max(cl, key=lambda q: len(q['out'][1])); slots[(part, big['mat'])] = slot; defaults[slot.lower()] = '#' + srgb(big['col'])
            for q in prims:
                if q['mat'] == 'Skin': slots[(q['part'], 'Skin')] = 'SKIN'
                if q['mat'].startswith('Hair'): slots[(q['part'], 'Hair')] = 'HAIR'
            data[folder[8] + ':' + nm] = {'body': body, 'name': nm, 'defaults': defaults, 'parts': pieces(prims, ob, slots), 'mats': sorted(set((q['part'], q['mat']) for q in prims))}
            tri = sum(len(f['f']) for pt in data[folder[8] + ':' + nm]['parts'].values() for bl in pt.values() for f in bl)
            print(folder[8] + ':' + nm, tri, 'triangles')
    json.dump(data, open(os.path.join(HERE, 'data/modular_parts.json'), 'w'), separators=(',', ':'))
