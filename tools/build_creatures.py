#!/usr/bin/env python3
"""Turns rigged creature models (Quaternius "Bestiary" GLB files) into a compact set of baked poses the game embeds.
Usage: python3 tools/build_creatures.py "/path/to/Bestiary - Dungeon Monsters Kit[Standard]"
The pack's files carry a skeleton but no animation clips, so the walk, attack and fallen poses are made here by turning bones.
Each creature is simplified, coloured one flat colour per triangle from its texture, and saved as: triangles, colours, then every pose's points
(millimetres, int16). In the output the creature faces +x, which the game treats as "forward". The pack itself is not copied into the repo."""
import sys, os, json, struct, base64, math
import numpy as np
from PIL import Image
SRC = sys.argv[1]; FULL = 'full' in sys.argv[2:]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'full' if FULL else 'lite')
CT = {5120:('b',1),5121:('B',1),5122:('h',2),5123:('H',2),5125:('I',4),5126:('f',4)}; NC = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(path):
    d = open(path, 'rb').read(); n = struct.unpack('<I', d[12:16])[0]; j = json.loads(d[20:20+n]); b = d[20+n+8:]
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]; t, sz = CT[a['componentType']]; nc = NC[a['type']]
        off = v.get('byteOffset', 0) + a.get('byteOffset', 0); st = v.get('byteStride', 0) or sz*nc
        raw = np.frombuffer(b, dtype=np.uint8, count=st*(a['count']-1) + sz*nc, offset=off)
        if st == sz*nc: arr = raw.view('<' + t).reshape(a['count'], nc)
        else: arr = np.stack([raw[k*st:k*st+sz*nc].view('<' + t) for k in range(a['count'])])
        return arr.astype(np.float64) if t == 'f' else arr
    return j, acc
def quat(q): x, y, z, w = q; return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
def rot(axis, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a); x, y, z = axis
    return np.array([[c+x*x*(1-c), x*y*(1-c)-z*s, x*z*(1-c)+y*s], [y*x*(1-c)+z*s, c+y*y*(1-c), y*z*(1-c)-x*s], [z*x*(1-c)-y*s, z*y*(1-c)+x*s, c+z*z*(1-c)]])
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
def build(name, glb, tex, target, scale, tintmul=(1, 1, 1)):
    j, acc = load(glb); N = j['nodes']; skin = j['skins'][0]; joints = skin['joints']
    # bind-pose world position of every bone, and each bone's parent
    par = {}; 
    for i, nd in enumerate(N):
        for c in nd.get('children', []): par[c] = i
    def world(i):
        nd = N[i]; M = np.eye(4); M[:3, :3] = quat(nd.get('rotation', [0, 0, 0, 1])) * np.array(nd.get('scale', [1, 1, 1])); M[:3, 3] = nd.get('translation', [0, 0, 0])
        return world(par[i]) @ M if i in par else M
    jname = [N[i]['name'] for i in joints]; jpos = np.array([world(i)[:3, 3] for i in joints]); jpar = [joints.index(par[i]) if par.get(i) in joints else -1 for i in joints]
    P, UV, JI, JW, TR = [], [], [], [], []; base = 0
    for m in j['meshes']:
        for pr in m['primitives']:
            a = pr['attributes']; p = acc(a['POSITION']); P.append(p); UV.append(acc(a['TEXCOORD_0'])); JI.append(acc(a['JOINTS_0']).astype(int)); w = acc(a['WEIGHTS_0']).astype(np.float64)
            if w.max() > 1.5: w = w/(255.0 if w.max() < 256 else 65535.0)
            JW.append(w); TR.append(acc(pr['indices']).reshape(-1, 3).astype(int) + base); base += len(p)
    P = np.vstack(P); UV = np.vstack(UV); JI = np.vstack(JI); JW = np.vstack(JW); JW = JW/np.maximum(JW.sum(1, keepdims=True), 1e-9); TR = np.vstack(TR)
    # one flat colour per triangle, read from the texture at the middle of the triangle
    im = np.asarray(Image.open(tex).convert('RGB').resize((1024, 1024), Image.LANCZOS)).astype(np.float64); c = UV[TR].mean(1)
    px = np.clip((c[:, 0] % 1)*1024, 0, 1023).astype(int); py = np.clip((c[:, 1] % 1)*1024, 0, 1023).astype(int); col = im[py, px]*np.array(tintmul)
    g = col @ np.array([0.3, 0.59, 0.11]); col = np.clip((col*0.8 + g[:, None]*0.2), 0, 255)
    # simplify: points that share a small cube of space (and the same main bone) become one point
    dom = JI[np.arange(len(P)), JW.argmax(1)]; lo, hi = 0.004, 0.2
    for _ in range(18):
        cell = (lo + hi)/2; key = np.floor(P/cell).astype(np.int64); k = key[:, 0]*73856093 ^ key[:, 1]*19349663 ^ key[:, 2]*83492791 ^ dom*2654435761
        u, inv = np.unique(k, return_inverse=True); t = inv[TR]; ok = (t[:, 0] != t[:, 1]) & (t[:, 1] != t[:, 2]) & (t[:, 0] != t[:, 2]); ts = np.sort(t[ok], 1); _, first = np.unique(ts, axis=0, return_index=True)
        if len(first) > target: lo = cell
        else: hi = cell
    keep = np.where(ok)[0][np.sort(first)]; tri = inv[TR][keep]; tcol = col[keep]; nv = len(u)
    cnt = np.bincount(inv, minlength=nv).astype(np.float64); mean = np.stack([np.bincount(inv, P[:, a], nv)/cnt for a in range(3)], 1)
    rep = np.zeros(nv, int); best = np.full(nv, 1e9); dd = ((P - mean[inv])**2).sum(1)
    for i in np.argsort(-dd): rep[inv[i]] = i
    V = mean; VI = JI[rep]; VW = JW[rep]
    used = np.unique(tri); remap = -np.ones(nv, int); remap[used] = np.arange(len(used)); tri = remap[tri]; V = V[used]; VI = VI[used]; VW = VW[used]
    def pose(turns, lift=(0, 0, 0)):
        """turns = {bone name: 3x3 rotation in model space, about that bone's own joint}; children follow their parents"""
        D = [None]*len(joints)
        def get(i):
            if D[i] is None:
                M = np.eye(4); R = turns.get(jname[i])
                if R is not None: M[:3, :3] = R; M[:3, 3] = jpos[i] - R @ jpos[i]
                D[i] = (get(jpar[i]) @ M) if jpar[i] >= 0 else M
            return D[i]
        Ms = np.stack([get(i) for i in range(len(joints))]); Vh = np.c_[V, np.ones(len(V))]; o = np.zeros((len(V), 3))
        for k in range(4): o += VW[:, k:k+1]*np.einsum('nij,nj->ni', Ms[VI[:, k]], Vh)[:, :3]
        return o + np.array(lift)
    arms = lambda sw=0: {'upperarm_l': rot(X, sw) @ rot(Z, -72), 'upperarm_r': rot(X, -sw) @ rot(Z, 72), 'lowerarm_l': rot(X, -18), 'lowerarm_r': rot(X, -18)}
    poses, clips = [], {}
    def clip(nm, frames): clips[nm] = [len(poses), len(frames)]; poses.extend(frames)
    clip('idle', [pose(arms())])
    walk = []
    for f in range(10):
        a = f/10*2*math.pi; s = math.sin(a); c = math.cos(a); t = arms(26*s)
        t.update({'thigh_l': rot(X, -30*s), 'thigh_r': rot(X, 30*s), 'calf_l': rot(X, 34*max(0, c)), 'calf_r': rot(X, 34*max(0, -c)), 'spine_01': rot(X, 7), 'Head': rot(Y, 5*s)})
        walk.append(pose(t, (0, 0.02*abs(c), 0)))
    clip('walk', walk)
    atk = []
    for f in range(6):
        u = [0.35, 0.8, 1, 0.55, 0.15, 0][f]; t = arms(0); t.update({'upperarm_r': rot(X, -150*u) @ rot(Z, 72), 'lowerarm_r': rot(X, -40*u), 'spine_02': rot(X, 16*(1-u) if f > 2 else -10*u), 'thigh_l': rot(X, -14)})
        atk.append(pose(t))
    clip('attack', atk)
    flat = arms(0); flat.update({'root': rot(X, -90), 'upperarm_l': rot(Z, -35), 'upperarm_r': rot(Z, 50), 'thigh_l': rot(Z, 9), 'thigh_r': rot(Z, -14)}); fp = pose(flat); fp[:, 1] -= fp[:, 1].min() - 0.02
    clip('dead', [fp])
    # the model faces +z; the game wants forward along +x
    out = []
    for p in poses: q = np.stack([p[:, 2], p[:, 1], -p[:, 0]], 1)*scale*1000; out.append(np.clip(np.round(q), -32000, 32000).astype('<i2'))
    return {'nv': len(V), 'nt': len(tri), 'clips': clips, 'h': round(float(poses[0][:, 1].max()*scale), 2)}, tri.astype('<u2').tobytes() + np.round(tcol).astype(np.uint8).tobytes() + b''.join(o.tobytes() for o in out)
G = os.path.join(SRC, 'Exports', 'GLB (Godot-Unreal)'); T = os.path.join(SRC, 'Textures')
JOBS = [('swarmer', 'Puglin.glb', 'T_Puglin_BaseColor_1.png', 620, 1.0, (1, 1, 1)), ('stalker', 'Imp.glb', 'T_Imp_BaseColor_2.png', 1300, 1.3, (0.42, 0.4, 0.5)), ('giant', 'Puglin.glb', 'T_Puglin_BaseColor_3.png', 1500, 4.3, (0.9, 0.86, 1.0))]
index, blob = {}, b''
for nm, g, t, target, sc, tm in JOBS:
    info, data = build(nm, os.path.join(G, g), os.path.join(T, t), int(target*(3.2 if FULL else 1)), sc, tm); info['o'] = len(blob); index[nm] = info; blob += data; print(nm, info)
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'creatures.txt'), 'w').write(json.dumps(index, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print(round(len(blob)/1024), 'KB')
