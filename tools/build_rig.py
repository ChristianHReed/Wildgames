#!/usr/bin/env python3
"""Art 2: the survivor skeleton and its moves, for the shaped survivors (assets/shaped/survivor.js).
For the masculine and feminine skeletons of Quaternius "Universal Base Characters" (CC0) it writes, for every animation frame the
game uses (the same clips, frames and order as tools/build_people.py), the skinning matrix of each bone the shaped pieces hang on,
plus each bone's rest pivot and tip. The game fits each bone's pieces from the pack's standing pose onto the rest skeleton once,
then moves them rigidly with these matrices: any mix of creator choices, no baking per look.
Usage: python3 tools/build_rig.py <Universal Base Characters folder> <Universal Animation Library 2 folder> [<Universal Animation Library folder>]
Output: tools/out/rig.txt (written into assets/rig.js by write_assets.py)."""
import sys, os, json, base64
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'build_people.py')).read()
# reuse the people builder's loader, clips and moves (everything before it starts building the bodies)
sys.argv = [sys.argv[0]] + sys.argv[1:4]
exec(src[:src.index("BD = os.path.join(UBC, 'Base Characters'")])
BONES = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head', 'upperarm_l', 'lowerarm_l', 'hand_l', 'thigh_l', 'calf_l', 'foot_l', 'ball_l',
         'upperarm_r', 'lowerarm_r', 'hand_r', 'thigh_r', 'calf_r', 'foot_r', 'ball_r']
TIP = {'pelvis': 'spine_01', 'spine_01': 'spine_02', 'spine_02': 'spine_03', 'spine_03': 'neck_01', 'neck_01': 'Head', 'upperarm_l': 'lowerarm_l', 'lowerarm_l': 'hand_l',
       'hand_l': 'middle_01_l', 'thigh_l': 'calf_l', 'calf_l': 'foot_l', 'foot_l': 'ball_l', 'upperarm_r': 'lowerarm_r', 'lowerarm_r': 'hand_r', 'hand_r': 'middle_01_r',
       'thigh_r': 'calf_r', 'calf_r': 'foot_r', 'foot_r': 'ball_r'}
S = clipset()
BD = os.path.join(UBC, 'Base Characters', 'Godot - UE')
out = {'bones': BONES}; blob = b''
for key, gltf in [('masculine', 'Superhero_Male_FullBody.gltf'), ('feminine', 'Superhero_Female_FullBody.gltf')]:
    j, acc = load(os.path.join(BD, gltf)); N = j['nodes']; skin = j['skins'][0]; joints = skin['joints']; IBM = acc(skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    par = {}
    for i, nd in enumerate(N):
        for c in nd.get('children', []): par[c] = i
    rest = [(np.array(nd.get('translation', [0, 0, 0]), float), np.array(nd.get('rotation', [0, 0, 0, 1]), float), np.array(nd.get('scale', [1, 1, 1]), float)) for nd in N]
    name = [nd.get('name') for nd in N]; jn = [name[i] for i in joints]; jk = {n: k for k, n in enumerate(jn)}
    restP = {n: np.linalg.inv(IBM[k])[:3, 3] for k, n in enumerate(jn)}
    def mats(sample):
        L = []
        for i in range(len(N)):
            t, r, s = rest[i]; a = sample.get(name[i], {})
            if 'rotation' in a: r = a['rotation']
            if 'translation' in a and name[i] == 'pelvis': t = a['translation']
            L.append(trs(t, r, s))
        W = [None]*len(N)
        def wm(i):
            if W[i] is None: W[i] = (wm(par[i]) @ L[i]) if i in par else L[i]
            return W[i]
        return [wm(joints[jk[b]]) @ IBM[jk[b]] for b in BONES]
    frames_, clips = [], {}
    for nm, fr in S.items():
        clips[nm] = [len(frames_), len(fr)]
        for smp in fr: frames_.append(mats(smp))
    # the same lift as the baked people: feet on the ground in the median frame
    lows = []
    for M in frames_:
        lows.append(min((M[BONES.index(b)] @ np.r_[restP[b], 1])[1] for b in ('ball_l', 'ball_r', 'foot_l', 'foot_r')) - 0.035)
    lift = -float(np.median(lows))
    rig = {'clips': clips, 'n': len(frames_), 'lift': round(lift, 4), 'o': len(blob),
           'rest': {b: [round(float(v), 4) for v in restP[b]] for b in BONES},
           'tip': {b: [round(float(v), 4) for v in restP[TIP[b]]] for b in BONES if TIP.get(b) in restP}}
    q = []
    for M in frames_:
        for m in M: q.append(np.r_[m[:3, :3].reshape(-1)*16000, m[:3, 3]*1000])
    blob += np.clip(np.round(np.array(q)), -32767, 32767).astype('<i2').tobytes()
    out[key] = rig
    print(key, 'frames', len(frames_), 'lift', rig['lift'], 'head', rig['rest']['Head'], 'tips', len(rig['tip']))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
open(os.path.join(HERE, 'out', 'rig.txt'), 'w').write(json.dumps(out, separators=(',', ':')) + '\n' + base64.b64encode(blob).decode())
print(round(len(blob)/1024), 'KB')
