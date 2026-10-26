"""Shared helpers for the building-style packs (roadside, rail, civic, barriers): boxes by base, tubes, gable and hip roofs, windows, doors, a model registry and the pack writer.
Units are metres, Y up, the front faces +Z, the origin is the centre of the footprint on the ground."""
import math
from kit import *
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def tube(p0, p1, t, c): return seg(p0, p1, t/2, t/2, t/2, t/2, c)
def cylv(x, y0, z, r, h, c, n=12): return loft([[x, y0, z, r, r], [x, y0 + h, z, r, r]], c, n=n)
def gable(w, d, y0, rise, rc, oh=0.4, ohz=0.3, along='z', cx=0, cz=0):
    """gable roof on a w x d footprint centred (cx, cz); along 'z' the ridge runs along z (the front shows the gable end), along 'x' it runs along x"""
    if along == 'z': hw, hd = w/2 + oh, d/2 + ohz; pts = [(-hw, y0, -hd), (hw, y0, -hd), (0, y0 + rise, -hd), (-hw, y0, hd), (hw, y0, hd), (0, y0 + rise, hd)]
    else: hw, hd = w/2 + ohz, d/2 + oh; pts = [(-hw, y0, -hd), (-hw, y0, hd), (-hw, y0 + rise, 0), (hw, y0, -hd), (hw, y0, hd), (hw, y0 + rise, 0)]
    pts = [(x + cx, y, z + cz) for x, y, z in pts]
    return [solid(pts, [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]], rc)]
def hip(w, d, y0, rise, c, oh=0.4, cx=0, cz=0):
    hw, hd = w/2 + oh, d/2 + oh; rw = max(0.1, hw - rise*1.1); rd = max(0.1, hd - rise*1.1)
    return [hull([(cx - hw, y0, cz - hd), (cx + hw, y0, cz - hd), (cx + hw, y0, cz + hd), (cx - hw, y0, cz + hd), (cx - rw, y0 + rise, cz - rd), (cx + rw, y0 + rise, cz - rd), (cx + rw, y0 + rise, cz + rd), (cx - rw, y0 + rise, cz + rd)], c)]
def pyramid(w, d, y0, rise, c, cx=0, cz=0, n=4):
    """a pyramid or a spire with n sides (4 = square, 8 = octagonal) on a w x d base"""
    pts = [(cx + math.cos(2*math.pi*i/n + math.pi/n)*w/2*math.sqrt(2 if n == 4 else 1), y0, cz + math.sin(2*math.pi*i/n + math.pi/n)*d/2*math.sqrt(2 if n == 4 else 1)) for i in range(n)] + [(cx, y0 + rise, cz)]
    return [solid(pts, [list(range(n))[::-1]] + [[i, (i + 1) % n, n] for i in range(n)], c)]
def win(x, y, w, h, z, c='glass', f='white'):
    return [bx(x, y - 0.06, z, w + 0.16, h + 0.12, 0.06, f), bx(x, y, z + 0.02, w, h, 0.05, c), bx(x, y, z + 0.05, 0.05, h, 0.03, f), bx(x, y + h/2 - 0.02, z + 0.05, w, 0.05, 0.03, f)]
def winx(sx, y, w, h, z, c='glass', f='white'):
    return [bx(sx, y - 0.06, z, 0.06, h + 0.12, w + 0.16, f), bx(sx + (0.02 if sx > 0 else -0.02), y, z, 0.05, h, w, c)]
def arch_win(x, y, w, h, z, c='glass', f='white'):
    """a tall window with a pointed head: frame, glass, and a trapezoid head"""
    return [bx(x, y - 0.05, z, w + 0.2, h + 0.05, 0.06, f), bx(x, y, z + 0.02, w, h, 0.05, c),
            hull([(x - w/2, y + h, z + 0.02), (x + w/2, y + h, z + 0.02), (x + w/2, y + h, z + 0.07), (x - w/2, y + h, z + 0.07), (x - w*0.12, y + h + w*0.5, z + 0.02), (x + w*0.12, y + h + w*0.5, z + 0.02), (x + w*0.12, y + h + w*0.5, z + 0.07), (x - w*0.12, y + h + w*0.5, z + 0.07)], c)]
def door(x, z, c='door', w=0.95, h=2.1, y0=0, f='white'): return [bx(x, y0, z, w + 0.2, h + 0.1, 0.06, f), bx(x, y0, z + 0.03, w, h, 0.05, c), bx(x + w*0.36, y0 + 1.0, z + 0.07, 0.06, 0.06, 0.04, 'chrome')]
def chimney(x, z, y0, h, c='brick', w=0.7): return [bx(x, y0, z, w, h, w, c), bx(x, y0 + h, z, w + 0.14, 0.12, w + 0.14, 'concreteD')]
def flatroof(w, d, y0, c, t=0.25, oh=0.2): return [bx(0, y0, 0, w + 2*oh, t, d + 2*oh, c)]
def columns(xs, z, h, r, y0=0, c='white'): return [cylv(x, y0, z, r, h, c) for x in xs]
def shift(pieces, dx=0, dy=0, dz=0):
    """copies of pieces moved by (dx, dy, dz): every piece keeps its shape in a local frame around its centre p"""
    return [dict(p, p=[round(p['p'][0] + dx, 4), round(p['p'][1] + dy, 4), round(p['p'][2] + dz, 4)]) for p in pieces]
M = {}; INFO = {}
def reg(n, ps, w, ln, h, note=''): M[n] = ps; INFO[n] = {'w': round(w, 1), 'len': round(ln, 1), 'h': round(h, 1), **({'note': note} if note else {})}
def reset(): M.clear(); INFO.clear()
def finish(name, P, doc, src, style, use=None, rule=''):
    pack = {'name': name, 'version': 1, 'style': style, 'units': 'metres', 'facing': '+Z', 'pivot': 'centre of the footprint on the ground', 'palette': P, 'about': doc.split('\n', 2)[2] if '\n' in doc else doc, 'flatModels': True, 'models': {name: dict(M)}, 'info': dict(INFO)}
    if use: pack['use'] = use
    if rule: pack['rule'] = rule
    out, st = write_pack(name, pack, src)
    t = {k.split('.')[1]: v[0] for k, v in st.items()}
    print(name, len(t), 'models', min(t.values()), '-', max(t.values())); print({k: v for k, v in t.items() if v > 450})
