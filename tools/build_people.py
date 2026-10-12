#!/usr/bin/env python3
"""Turns Quaternius "Universal Base Characters" (CC0) into animated survivors, using clips from the
"Universal Animation Library" packs (CC0), which share the same skeleton.
Usage: python3 tools/build_people.py <Universal Base Characters folder> <Universal Animation Library 2 folder> [<Universal Animation Library folder>] [full] [preview]
Every clip is sampled into a handful of frames and the skinned body is baked for each frame, so the game only swaps meshes.
Each triangle stores which part of the body it is (skin, shirt, trousers, shoes, hair, eyes) so the game can colour it from the
survivor's chosen look. Output: tools/out/<lite|full>/people.txt. The packs themselves are not copied into the repo."""
import sys, os, json, struct, base64, math, glob
import numpy as np
from PIL import Image
args = [a for a in sys.argv[1:] if a not in ('full', 'preview')]
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
def build(gltf, tex, target, hair_files):
    j, acc = load(gltf); N = j['nodes']; skin = j['skins'][0]; joints = skin['joints']; IBM = acc(skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    par = {}
    for i, nd in enumerate(N):
        for c in nd.get('children', []): par[c] = i
    rest = [(np.array(nd.get('translation', [0, 0, 0]), float), np.array(nd.get('rotation', [0, 0, 0, 1]), float), np.array(nd.get('scale', [1, 1, 1]), float)) for nd in N]
    name = [nd.get('name') for nd in N]; jname = [name[i] for i in joints]
    P, UV, JI, JW, TR, MAT = [], [], [], [], [], []; base = 0
    for i, nd in enumerate(N):
        if 'mesh' not in nd: continue
        for pr in j['meshes'][nd['mesh']]['primitives']:
            a = pr['attributes']; p = acc(a['POSITION']); P.append(p); UV.append(acc(a['TEXCOORD_0'])); JI.append(acc(a['JOINTS_0']).astype(int)); JW.append(acc(a['WEIGHTS_0']))
            t = acc(pr['indices']).reshape(-1, 3).astype(int) + base; TR.append(t); MAT += [j['materials'][pr['material']]['name']]*len(t); base += len(p)
    P = np.vstack(P); UV = np.vstack(UV); JI = np.vstack(JI); JW = np.vstack(JW); JW = JW/np.maximum(JW.sum(1, keepdims=True), 1e-9); TR = np.vstack(TR); MAT = np.array(MAT)
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
    hairs = []
    for hf in hair_files:
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
    hj_ = joints.index(name.index('Head')) if 'Head' in name else 0
    def world_mats(sample):
        L = []
        for i in range(len(N)):
            t, r, s = rest[i]; a = sample.get(name[i], {}) if sample else {}
            if 'rotation' in a: r = a['rotation']
            if 'translation' in a and name[i] in ('pelvis',): t = a['translation']
            L.append(trs(t, r, s))
        W = [None]*len(N)
        def wm(i):
            if W[i] is None: W[i] = (wm(par[i]) @ L[i]) if i in par else L[i]
            return W[i]
        return [wm(i) for i in range(len(N))]
    def pose(sample, extra=None):
        W = world_mats(sample); Ms = np.stack([W[joints[k]] @ IBM[k] for k in range(len(joints))])
        Vh = np.c_[V, np.ones(len(V))]; o = np.zeros((len(V), 3))
        for k in range(4): o += VW[:, k:k+1]*np.einsum('nij,nj->ni', Ms[VI[:, k]], Vh)[:, :3]
        hm = Ms[hj_]; hs = []
        for _, hp, _ in hairs: hs.append((np.c_[hp, np.ones(len(hp))] @ (hm).T)[:, :3])
        return o, hs, W[joints[hj_]][:3, 3]
    return dict(V=V, tri=tri, reg=treg, shade=tsh, pose=pose, hairs=hairs)

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
HAIRS = ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Long', 'Hair_Buns', 'Hair_Beard']
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
    data = B['tri'].astype('<u2').tobytes() + B['reg'].astype(np.uint8).tobytes() + np.round(B['shade']*200).astype(np.uint8).tobytes() + b''.join(q(p).tobytes() for p in poses)
    info = {'nv': len(B['V']), 'nt': len(B['tri']), 'clips': clips, 'h': round(float(poses[0][:, 1].max() + lift), 2), 'o': len(blob), 'hd': [[round(float(v), 3) for v in FWD(np.array([h]) + np.array([0, lift, 0]))[0]] for h in heads]}
    blob += data; index[key] = info
    for k, (hn, hp, ht) in enumerate(B['hairs']):
        hd2 = ht.astype('<u2').tobytes() + b''.join(q(p).tobytes() for p in hairp[k]); index[key + ':' + hn] = {'nv': len(hp), 'nt': len(ht), 'o': len(blob), 'hair': 1}; blob += hd2
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
