"""Shared helpers for every shaped-pack generator in this folder.
Pieces are plain dicts in the format described at the top of assets/shaped/shapes.js.
Low-vertex rules used everywhere (see docs/ART.md, "Fewest vertices"):
  - rectangular cross-sections (4 corners) wherever a form allows; sides of a rectangular frustum stay flat, so each is one face
  - a = b = 0 rings end a tube in a point instead of a cap
  - no caps where a piece ends inside another piece
  - detail as colour on an existing face rather than an extra solid"""
import json, os, subprocess, math

R4 = lambda v: round(v, 4)
def centre(pts): return [sum(p[i] for p in pts)/len(pts) for i in range(3)]
def ring_out(r, p):
    o = [R4(r[0]-p[0]), R4(r[1]-p[1]), R4(r[2]-p[2]), R4(r[3]), R4(r[4])]
    k = r[5] if len(r) > 5 else None; d = r[6] if len(r) > 6 else None
    if k is not None and any(abs(v - 1) > 1e-4 for v in k): o.append([R4(v) for v in k])
    elif d is not None: o.append(None)
    if d is not None and any(abs(v) > 1e-5 for v in d):
        if len(o) == 5: o.append(None)
        o.append([R4(v) for v in d])
    return o
def loft(rings, c, n=None, ang=None, ax='y', **k):
    """rings: absolute [x, y, z, a, b, (k per corner), (d per corner)]"""
    p = centre([r[:3] for r in rings])
    o = {'s': 'loft', 'p': [R4(v) for v in p], 'r': [ring_out(r, p) for r in rings], 'c': c}
    if ang: o['ang'] = list(ang)
    elif n and n != 8: o['n'] = n
    if ax != 'y': o['ax'] = ax
    o.update(k); return o
RECT = [45, 135, 225, 315]
def frustum(rings, c, ax='y', **k):
    """a tube with a rectangular cross-section: rings [x, y, z, half-width, half-depth]; every side is one flat face"""
    rr = [[x, y, z, a*math.sqrt(2), b*math.sqrt(2)] + list(rest) for x, y, z, a, b, *rest in rings]
    return loft(rr, c, ang=RECT, ax=ax, **k)
def flat(pts, c, n=(0, 0, 1), **k):
    p = centre(pts); o = {'s': 'decal', 'p': [R4(v) for v in p], 'v': [[R4(q[i]-p[i]) for i in range(3)] for q in pts], 'n': list(n), 'c': c}; o.update(k); return o
def solid(pts, faces, c, **k):
    p = centre(pts); o = {'s': 'poly', 'p': [R4(v) for v in p], 'v': [[R4(q[i]-p[i]) for i in range(3)] for q in pts], 'f': faces, 'c': c}; o.update(k); return o
HEX = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
def box(p, d, c, **k):
    o = {'s': 'box', 'p': [R4(v) for v in p], 'd': [R4(v) for v in d], 'c': c}; o.update(k); return o
def wedge(p, d, c, fy=False, ry=0, **k):
    o = {'s': 'wedge', 'p': [R4(v) for v in p], 'd': [R4(v) for v in d], 'c': c}
    if fy: o['fy'] = True
    if ry: o['ry'] = ry
    o.update(k); return o
def cyl(p, d, c, ax='y', **k):
    o = {'s': 'cyl', 'p': [R4(v) for v in p], 'd': [R4(v) for v in d], 'c': c}
    if ax != 'y': o['ax'] = ax
    o.update(k); return o
def prism(pts2, y0, y1, c, **k):
    """an upright prism from a 2D outline [(x, z), ...] between heights y0 and y1"""
    v = [(x, y0, z) for x, z in pts2] + [(x, y1, z) for x, z in pts2]; n = len(pts2)
    f = [list(range(n)), list(range(n, 2*n))] + [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    return solid(v, f, c, **k)
def hull(pts, c, **k):
    """a solid between two outlines of the same corner count: pts = lower + upper, each listed around the same way"""
    n = len(pts)//2
    f = [list(range(n)), list(range(n, 2*n))] + [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    return solid(pts, f, c, **k)
def tip(p0, p1, a0, b0, c, n=4, rot=45, **k):
    """a tapering spike from p0 (half sizes a0, b0) to a point at p1; its base lies across the main direction"""
    if 'ax' not in k:
        d = [abs(p1[i] - p0[i]) for i in range(3)]; k['ax'] = 'xyz'[d.index(max(d))]
    if k['ax'] == 'y': k.pop('ax')
    return loft([[*p0, a0, b0], [*p1, 0, 0]], c, n=n, rot=rot, caps=[True, False], **k)
def seg(p0, p1, a0, b0, a1, b1, c, caps=(True, True), **k):
    """a rectangular frustum between two points: half sizes at each end. Its rings lie across the main direction of travel
    (y for upright limbs, z for limbs reaching forward, x for sideways), so the tube never flattens."""
    d = [abs(p1[i] - p0[i]) for i in range(3)]
    ax = k.pop('ax', None) or ('xyz'[d.index(max(d))])
    return frustum([[*p0, a0, b0], [*p1, a1, b1]], c, caps=list(caps), ax=ax, **k)
def join(*parts):
    out = {}
    for d in parts:
        for b, ps in d.items(): out.setdefault(b, []).extend(ps)
    return out
def both_sides(fn):
    out = {}
    for sg, sd in ((1, 'l'), (-1, 'r')):
        for b, ps in fn(sg, sd).items(): out.setdefault(b, []).extend(ps)
    return out
def lerp(a, b, f): return a + (b - a)*f
def mixp(p, q, f): return [lerp(p[i], q[i], f) for i in range(3)]

def write_pack(name, pack, src_file):
    """write assets/shaped/<name>.js, then let shapes.js itself count triangles and vertices for every model in it"""
    here = os.path.dirname(os.path.abspath(src_file)); out = os.path.join(here, '..', name + '.js')
    def dump():
        with open(out, 'w') as f:
            f.write('/* Afterstreet shaped %s pack: made by assets/shaped/src/%s, do not edit by hand */\n' % (name, os.path.basename(src_file)))
            f.write('(window.SHAPED = window.SHAPED || {}).%s = ' % name + json.dumps(pack, separators=(',', ':')) + ';\n')
    dump()
    stats = subprocess.run(['node', os.path.join(here, 'stats.js'), name], capture_output=True, text=True, check=True).stdout
    pack['stats'] = json.loads(stats)
    dump()
    return out, pack['stats']
