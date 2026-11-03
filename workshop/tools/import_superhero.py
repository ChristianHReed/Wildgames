#!/usr/bin/env python3
"""Converts the Quaternius Universal Base Characters "Superhero" male and female (CC0) into a full base body for our survivor skeleton.
Run: python3 workshop/tools/import_superhero.py <folder with Superhero_Male_FullBody.gltf/.bin and the female pair>  -> workshop/tools/data/superhero_body.json
The skeleton names already match ours (pelvis, spine_01..03, neck_01, Head, upperarm_l ...), so each bone is rotated and stretched onto our rest pose, the
painted eyes are dropped, and the body is simplified. Also writes measured cross-sections (workshop/tools/data/superhero_measure.json) to fit clothes to it."""
import sys, os, json, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'import_modular.py')).read().split("if __name__")[0].replace("HERE = os.path.dirname(os.path.abspath(__file__))", "HERE = %r" % HERE)
exec(src)

def our(name):
    n = name
    if n in ('root', 'pelvis'): return 'pelvis'
    if n.startswith('clavicle'): return 'spine_03'
    for b in ('spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head'):
        if n == b: return b
    for b in ('upperarm', 'lowerarm', 'thigh', 'calf', 'foot', 'ball'):
        if n.startswith(b + '_'): return n.replace('_leaf', '') if b == 'ball' else n
    if n.startswith('hand_') or any(n.startswith(f) for f in ('index', 'middle', 'pinky', 'ring', 'thumb')): return 'hand_' + n[-1]
    return 'pelvis'
PAIR = {'pelvis': ('pelvis', 'spine_01'), 'spine_01': ('spine_01', 'spine_02'), 'spine_02': ('spine_02', 'spine_03'), 'spine_03': ('spine_03', 'neck_01'), 'neck_01': ('neck_01', 'Head'), 'Head': ('Head', None)}
for s_ in 'lr':
    PAIR.update({'upperarm_' + s_: ('upperarm_' + s_, 'lowerarm_' + s_), 'lowerarm_' + s_: ('lowerarm_' + s_, 'hand_' + s_), 'hand_' + s_: ('hand_' + s_, 'middle_02_' + s_),
                 'thigh_' + s_: ('thigh_' + s_, 'calf_' + s_), 'calf_' + s_: ('calf_' + s_, 'foot_' + s_), 'foot_' + s_: ('foot_' + s_, 'ball_' + s_), 'ball_' + s_: ('ball_' + s_, 'ball_leaf_' + s_)})

LEGX = float(os.environ.get('LEGX', '1'))
def convert_body(path, budget_tris):
    j, binb = load_glb(path); W = world(j); nodes = j['nodes']; sk = j['skins'][0]; jn = [nodes[i]['name'] for i in sk['joints']]
    jw = {nodes[i]['name']: W[i] for i in sk['joints']}
    n = max([x for x in nodes if 'mesh' in x], key=lambda x: j['accessors'][j['meshes'][x['mesh']]['primitives'][0]['attributes']['POSITION']]['count'])
    ibm = acc(j, binb, sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    jm = np.stack([W[sk['joints'][k]] @ ibm[k] for k in range(len(sk['joints']))])
    p = j['meshes'][n['mesh']]['primitives'][0]
    P = acc(j, binb, p['attributes']['POSITION']); J0 = acc(j, binb, p['attributes']['JOINTS_0']).astype(int); W0 = np.nan_to_num(acc(j, binb, p['attributes']['WEIGHTS_0']))
    ph = np.hstack([P, np.ones((len(P), 1))]); pos = np.zeros((len(P), 3))
    for k in range(4): pos += W0[:, k:k + 1]*np.einsum('nij,nj->ni', jm[J0[:, k]], ph)[:, :3]
    F = acc(j, binb, p['indices']).astype(int).reshape(-1, 3)
    top = pos[:, 1].max(); sc = 1.78/top; pos = pos*sc; qj = {k: jw[k][:3, 3]*sc for k in jw}
    # measure cross-sections of the posed-in-T body before re-posing: torso (|x| < 0.3), per height
    obones = list(BONES.keys()); oi = {b: i for i, b in enumerate(obones)}
    A = {}
    for ob in obones:
        a, b = PAIR.get(ob, (ob, None)); piv = np.array(BONES[ob]['pivot'], float); tip = np.array(BONES[ob]['tip'], float); dO = tip - piv; qp = qj[a]
        dQ = (qj[b] - qp) if b else (np.array([0, 1.78 - qp[1], 0]) if ob == 'Head' else dO.copy())
        lq, lo = np.linalg.norm(dQ), np.linalg.norm(dO); d = dQ/lq; k = lo/lq if ob not in ('Head', 'ball_l', 'ball_r') else 1.0
        if ob.split('_')[0] in ('thigh', 'calf', 'foot', 'ball') and LEGX > 0:   # keep the model's own leg spacing: only the pivot's x moves, so fore-and-aft swings are unchanged
            piv = piv.copy(); piv[0] = np.sign(piv[0])*(abs(piv[0])*(1 - LEGX) + abs(qp[0])*LEGX)
        if ob in ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01'):   # a shear, not a turn: the source neck leans, ours is upright, and the head must stay level on it
            M = np.eye(3) + np.outer(dO - dQ, dQ)/(dQ @ dQ)
        else: M = rot_between(d, dO) @ (np.eye(3) + (k - 1)*np.outer(d, d))
        A[ob] = (M, qp, piv)
    # weld
    key = {}; remap = np.zeros(len(pos), int); keep = []
    for i, v in enumerate(pos):
        kk = tuple(np.round(v, 4))
        if kk not in key: key[kk] = len(keep); keep.append(i)
        remap[i] = key[kk]
    global SRC, LAB; SRC = pos[keep]
    V0 = pos[keep]; F0 = remap[F]; F0 = F0[(F0[:, 0] != F0[:, 1]) & (F0[:, 1] != F0[:, 2]) & (F0[:, 0] != F0[:, 2])]
    Wb = np.zeros((len(keep), len(obones)))
    for r, i in enumerate(keep):
        for k in range(4):
            if W0[i, k] > 0: Wb[r, oi[our(jn[J0[i, k]])]] += W0[i, k]
    posed = np.zeros_like(V0)
    for ob in obones:
        M, qp, piv = A[ob]; w = Wb[:, oi[ob]:oi[ob] + 1]
        if w.max() > 0: posed += w*((V0 - qp) @ M.T + piv)
    lab = Wb.argmax(1); LAB = lab
    print(path.split('/')[-1], 'tris', len(F0), '->', budget_tris)
    IMP = {'Head': float(os.environ.get('HEADW', '0.6')), 'neck_01': 2.0, 'hand_l': 5.0, 'hand_r': 5.0, 'foot_l': 3.0, 'foot_r': 3.0, 'ball_l': 3.0, 'ball_r': 3.0}
    wt = np.array([IMP.get(obones[k], 1.0) for k in lab])
    V1, F1, L1 = decimate(posed, F0, lab.copy(), budget_tris, boundary_w=500.0, wt=wt)
    # edge collapses keep each face's winding, and the source winding is outward, so no re-orienting is needed
    return V1, F1, L1, obones, posed, F0

def cut(V, F, L, obones):
    owner = np.array([np.bincount(L[f], minlength=len(obones)).argmax() for f in F]); out = {}
    for k in set(owner):
        fs = F[owner == k]; fs = np.vstack([fs, fs[:, ::-1]]) if os.environ.get('DOUBLE', '0') == '1' else fs; used = sorted(set(fs.ravel())); m = {u: i for i, u in enumerate(used)}; pts = V[used]; cen = (pts.min(0) + pts.max(0))/2
        out.setdefault(obones[k], []).append({'s': 'poly', 'p': [round(float(x), 4) for x in cen], 'v': [[round(float(x), 4) for x in (q - cen)] for q in pts], 'f': [[m[a] for a in f] for f in fs.tolist()], 'c': 'SKIN', 'winding': True})
    return out

if __name__ == '__main__':
    root = sys.argv[1]; tris = int(os.environ.get('TRIS', '900')); res = {}; meas = {}
    for body, fn in (('masculine', 'Superhero_Male_FullBody.gltf'), ('feminine', 'Superhero_Female_FullBody.gltf')):
        V, F, L, ob, posed, F0 = convert_body(os.path.join(root, fn), tris)
        res[body] = cut(V, F, L, ob); print(body, 'out tris', len(F))
        # cross-sections of the re-posed full-res mesh: half width / half depth / centre z per height (torso), and per limb
        rows = {}
        for y in np.arange(0.9, 1.5, 0.04):
            sl = posed[(abs(posed[:, 1] - y) < 0.02) & (abs(posed[:, 0]) < 0.3)]
            if len(sl) > 3: rows[round(float(y), 2)] = [round(float((sl[:, 0].max() - sl[:, 0].min())/2), 3), round(float((sl[:, 2].max() - sl[:, 2].min())/2), 3), round(float((sl[:, 2].max() + sl[:, 2].min())/2), 3)]
        meas[body] = rows
        # head box
        hd = posed[posed[:, 1] > 1.58]; meas[body]['head'] = [round(float(x), 3) for x in (hd[:, 0].min(), hd[:, 0].max(), hd[:, 1].min(), hd[:, 1].max(), hd[:, 2].min(), hd[:, 2].max())]
    json.dump(res, open(os.path.join(HERE, 'data/superhero_body.json'), 'w'), separators=(',', ':')); json.dump(meas, open(os.path.join(HERE, 'data/superhero_measure.json'), 'w'), indent=1)
