#!/usr/bin/env python3
"""Fits a clean ring-loft body to the retargeted Quaternius Superhero mesh (see import_superhero.py).

Why: the references we work from (low-poly base meshes, face studies) are all built from evenly spaced edge loops that follow the form, with large flat planes,
extra loops at the elbows and knees, and a faceted head. A scan decimated to a triangle budget gives noisy triangle soup instead. So the mesh is only a ruler
here: we slice it at chosen stations and keep one ring of 8 corners per station (12 for the head), smoothed and mirrored.

Run: python3 workshop/tools/fit_rings.py <folder with the Superhero gltf files>   ->  workshop/tools/data/body_rings.json
"""
import sys, os, json, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import import_superhero as I
from import_superhero import convert_body, np as _np

def ring_at(P, c, n, phase=0.0):
    """radius of the outline along n directions from c (phi = 0 is +z, 90 degrees is +x); P: (m,2) points as (x, z)"""
    d = P - c; ang = np.arctan2(d[:, 0], d[:, 1]); rad = np.hypot(d[:, 0], d[:, 1]); out = []
    for k in range(n):
        phi = phase + 2*math.pi*k/n; diff = np.abs((ang - phi + math.pi) % (2*math.pi) - math.pi)
        sel = diff < math.pi/n*1.05
        if sel.sum() == 0: sel = diff < math.pi/n*2.5
        r = float((rad[sel]*np.cos(diff[sel])).max()) if sel.sum() else 0.01
        out.append(r)
    return np.array(out)

def fit(posed, names, labels, ys, n, mirror=False, h=0.022, zslice=False, centre='bbox', fixc=None, xlim=None):
    """one ring per y in ys, from the vertices whose label is in labels; returns (len(ys), n, 3)"""
    rings = []; cs = []; rs = []
    for y in ys:
        m = np.isin(names, labels) & (np.abs(posed[:, 1] - y) < h)
        if m.sum() < 6: m = np.isin(names, labels) & (np.abs(posed[:, 1] - y) < h*2.2)
        if xlim: m &= np.abs(posed[:, 0]) < xlim(y)
        Q = posed[m][:, [0, 2]]
        if mirror: Q = np.vstack([Q, Q*np.array([-1, 1])])
        c = np.array([(Q[:, 0].max() + Q[:, 0].min())/2, (Q[:, 1].max() + Q[:, 1].min())/2]) if centre == 'bbox' else Q.mean(0)
        if mirror: c[0] = 0.0
        cs.append(c); rs.append(ring_at(Q, c, n))
    rs = np.array(rs); cs = np.array(cs)
    for _ in range(2):   # smooth radii along the form, then around the ring
        r2 = rs.copy(); r2[1:-1] = 0.25*rs[:-2] + 0.5*rs[1:-1] + 0.25*rs[2:]; rs = r2
        r3 = 0.25*np.roll(rs, 1, 1) + 0.5*rs + 0.25*np.roll(rs, -1, 1); rs = 0.5*rs + 0.5*r3
    if mirror:   # left-right symmetry (phi and -phi)
        idx = [(-k) % n for k in range(n)]; rs = 0.5*(rs + rs[:, idx])
    cs2 = cs.copy()
    for i in range(1, len(cs) - 1): cs2[i] = 0.25*cs[i - 1] + 0.5*cs[i] + 0.25*cs[i + 1]
    out = np.zeros((len(ys), n, 3))
    for i, y in enumerate(ys):
        for k in range(n):
            phi = 2*math.pi*k/n; out[i, k] = [cs2[i][0] + rs[i, k]*math.sin(phi), y, cs2[i][1] + rs[i, k]*math.cos(phi)]
    return out

def fit_z(posed, names, labels, zs, n=8, h=0.02):
    """rings across a foot, looking along +z: points are (x, y); phi = 0 is up (+y), 90 degrees is +x"""
    out = []
    for z in zs:
        m = np.isin(names, labels) & (np.abs(posed[:, 2] - z) < h)
        if m.sum() < 4: m = np.isin(names, labels) & (np.abs(posed[:, 2] - z) < h*2.5)
        Q = posed[m][:, [0, 1]]; c = np.array([(Q[:, 0].max() + Q[:, 0].min())/2, (Q[:, 1].max() + Q[:, 1].min())/2])
        d = Q - c; ang = np.arctan2(d[:, 0], d[:, 1]); rad = np.hypot(d[:, 0], d[:, 1]); r = []
        for k in range(n):
            phi = 2*math.pi*k/n; diff = np.abs((ang - phi + math.pi) % (2*math.pi) - math.pi); sel = diff < math.pi/n*1.2
            r.append(float((rad[sel]*np.cos(diff[sel])).max()) if sel.sum() else 0.012)
        out.append([[c[0] + r[k]*math.sin(2*math.pi*k/n), c[1] + r[k]*math.cos(2*math.pi*k/n), z] for k in range(n)])
    return np.array(out)

def mirror_x(r): return r*np.array([-1, 1, 1])

STATIONS = {   # y stations; joints get extra loops, the outside of a bend gets one more than the inside
  'pelvis':   [0.88, 0.93, 0.99, 1.04, 1.07],
  'spine_01': [1.07, 1.12, 1.17],
  'spine_02': [1.17, 1.22, 1.28, 1.33],
  'spine_03': [1.33, 1.385, 1.43, 1.465],
  'neck_01':  [1.465, 1.50, 1.545],
  'upperarm': [1.455, 1.43, 1.395, 1.35, 1.29, 1.22, 1.17, 1.145],
  'lowerarm': [1.145, 1.115, 1.05, 0.98, 0.92, 0.895],
  'hand':     [0.895, 0.86, 0.81, 0.77, 0.745],
  'thigh':    [0.99, 0.93, 0.85, 0.74, 0.63, 0.55, 0.51, 0.485],
  'calf':     [0.485, 0.45, 0.38, 0.29, 0.2, 0.12, 0.075],
  'head':     [1.535, 1.55, 1.57, 1.595, 1.62, 1.645, 1.67, 1.70, 1.73, 1.752],
}

def build(path):
    V, F, L, ob, posed, F0 = convert_body(path, 900); names = np.array(ob)[I.LAB]
    R = {}
    core = ['pelvis', 'spine_01', 'spine_02', 'spine_03']; hips = core + ['thigh_l', 'thigh_r']
    for bone in ('pelvis', 'spine_01', 'spine_02', 'spine_03'):
        ys = STATIONS[bone]; lab = hips if bone == 'pelvis' else core
        R[bone] = fit(posed, names, lab, ys, 8, mirror=True, xlim=lambda y: 0.27 if y < 1.435 else max(0.115, 0.27 - (y - 1.435)*(0.155/0.03)))   # the shoulder tops belong to the arms, so the torso slopes in to the neck
    R['neck_01'] = fit(posed, names, ['neck_01'], STATIONS['neck_01'], 8, mirror=True, h=0.018)
    R['Head'] = fit(posed, names, ['Head'], STATIONS['head'], 12, mirror=False, h=0.014)
    for part, labs in (('upperarm', ['upperarm_l']), ('lowerarm', ['lowerarm_l']), ('thigh', ['thigh_l']), ('calf', ['calf_l'])):
        r = fit(posed, names, labs, STATIONS[part], 8, h=0.02); R[part + '_l'] = r; R[part + '_r'] = mirror_x(r)
    r = fit(posed, names, ['hand_l'], STATIONS['hand'], 8, h=0.016); R['hand_l'] = r; R['hand_r'] = mirror_x(r)
    zs = [-0.045, -0.02, 0.01, 0.05, 0.09, 0.13, 0.17]
    f = fit_z(posed, names, ['foot_l', 'ball_l'], zs); R['foot_l'] = f; R['foot_r'] = mirror_x(f)
    # one shared ring where two segments meet, so there is no step at a joint
    for a, b in (('pelvis', 'spine_01'), ('spine_01', 'spine_02'), ('spine_02', 'spine_03'), ('upperarm_l', 'lowerarm_l'), ('upperarm_r', 'lowerarm_r'), ('lowerarm_l', 'hand_l'), ('lowerarm_r', 'hand_r'), ('thigh_l', 'calf_l'), ('thigh_r', 'calf_r')):
        A, B = np.array(R[a]), np.array(R[b]); m = 0.5*(A[-1] + B[0]); A[-1] = m; B[0] = m; R[a], R[b] = A, B
    return {k: np.round(v, 4).tolist() for k, v in R.items()}

def torso_table(R, ys=(0.92, 0.98, 1.04, 1.10, 1.16, 1.22, 1.28, 1.34, 1.40, 1.455)):
    """the clothing table (y, half-width, half-depth, centre z) read straight off the torso rings, so shells fit the loops they sit on"""
    st = []
    for b in ('pelvis', 'spine_01', 'spine_02', 'spine_03'):
        for r in np.array(R[b]):
            r = np.array(r); st.append((r[0, 1], np.abs(r[:, 0]).max(), r[:, 2].min(), r[:, 2].max()))
    st = sorted(st); Y = np.array([a[0] for a in st]); out = []
    for y in ys:
        hw = np.interp(y, Y, [a[1] for a in st]); zl = np.interp(y, Y, [a[2] for a in st]); zh = np.interp(y, Y, [a[3] for a in st])
        out.append([y, round(float(hw), 3), round(float((zh - zl)/2), 3), round(float((zh + zl)/2), 3)])
    return out

def limb_profiles(res):
    """(t, half-width, half-depth) along each limb for the clothing profiles (wider of the two bodies), and per-body centre offsets from the skeleton line"""
    from import_modular import BONES
    prof = {}; fit = {}
    for sex, R in res.items():
        fit[sex] = {}
        for part, key in (('upperarm', 'UP'), ('lowerarm', 'LO'), ('thigh', 'TH'), ('calf', 'CA')):
            b = BONES[part + '_l']; py, ty = b['pivot'][1], b['tip'][1]; rows = []; dxs = []; dzs = []
            for r in np.array(R[part + '_l']):
                t = (py - r[0, 1])/(py - ty); ax = b['pivot'][0] + (b['tip'][0] - b['pivot'][0])*t; az = b['pivot'][2] + (b['tip'][2] - b['pivot'][2])*t
                x0, x1, z0, z1 = r[:, 0].min(), r[:, 0].max(), r[:, 2].min(), r[:, 2].max()
                rows.append((round(float(min(max(t, 0), 1)), 3), round(float((x1 - x0)/2), 3), round(float((z1 - z0)/2), 3))); dxs.append((x0 + x1)/2 - ax); dzs.append((z0 + z1)/2 - az)
            prof.setdefault(key, {})[sex] = rows; fit[sex][part] = (round(float(np.mean(dxs)), 3), round(float(np.mean(dzs)), 3))
    # one shared profile: the wider of the two bodies at each station, resampled on the masculine stations
    shared = {}
    for key, d in prof.items():
        m = d['masculine']; f = d['feminine']; tf = [a[0] for a in f]
        shared[key] = [(t, max(rx, float(np.interp(t, tf, [a[1] for a in f]))), max(rz, float(np.interp(t, tf, [a[2] for a in f])))) for t, rx, rz in m]
        shared[key] = [(t, round(rx, 3), round(rz, 3)) for t, rx, rz in shared[key]]
    return {'profiles': shared, 'fit': fit}

if __name__ == '__main__':
    root = sys.argv[1]; res = {}
    for body, fn in (('masculine', 'Superhero_Male_FullBody.gltf'), ('feminine', 'Superhero_Female_FullBody.gltf')):
        res[body] = build(os.path.join(root, fn)); print(body, {k: len(v) for k, v in res[body].items()})
    json.dump(res, open(os.path.join(HERE, 'data/body_rings.json'), 'w'), separators=(',', ':'))
    json.dump(limb_profiles(res), open(os.path.join(HERE, 'data/limb_fit.json'), 'w'))
    json.dump({k: torso_table(v) for k, v in res.items()}, open(os.path.join(HERE, 'data/superhero_torso.json'), 'w'))
