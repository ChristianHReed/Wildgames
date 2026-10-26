"""Shared helpers for the business packs (foodservice, autotrade, services, shopfit): a registry, a few primitives and a writer that also measures every model."""
import math, random, json, os, subprocess
from kit import *

class Pack:
    def __init__(self, name, group): self.name = name; self.group = group; self.M = {}; self.INFO = {}
    def reg(self, n, ps, note='', **kw):
        assert n not in self.M, n; self.M[n] = ps; self.INFO[n] = {'note': note, **kw}
    def write(self, pack, src):
        pack.setdefault('flatModels', True); pack['models'] = {self.group: self.M}; pack['info'] = self.INFO
        out, st = write_pack(self.name, pack, src)
        here = os.path.dirname(os.path.abspath(src))
        b = json.loads(subprocess.run(['node', os.path.join(here, 'bounds.js'), self.name], capture_output=True, text=True, check=True).stdout)
        pack['sizes'] = {k.split('.', 1)[1] if '.' in k else k: [v[0], v[1], v[2]] for k, v in b.items()}
        for k, v in b.items():
            n = k.split('.', 1)[1]; self.INFO[n].update({'w': v[0], 'len': v[1], 'h': v[2]})
            if v[3] < -0.05: self.INFO[n]['sunk'] = v[3]
        out, st = write_pack(self.name, pack, src)
        t = [v[0] for v in st.values()]; print(self.name, len(t), 'models', min(t), '-', max(t), 'triangles')
        print({k.split('.')[-1]: v[0] for k, v in st.items() if v[0] > 300})
        return st

def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def cy(x, y0, z, w, h, d, c, **k): return cyl([x, y0 + h/2, z], [w, h, d], c, **k)
def legs(w, d, h, c, t=0.05, inset=0.06):
    return [bx(sx*(w/2 - inset), 0, sz*(d/2 - inset), t, h, t, c) for sx in (-1, 1) for sz in (-1, 1)]
def table(w, d, h, top, leg, t=0.06): return [bx(0, h - t, 0, w, t, d, top)] + legs(w, d, h - t, leg)
def screen(x, y, z, w, h, c='screen', glow='screenOn'): return [bx(x, y, z, w, h, 0.03, 'black'), bx(x, y + 0.02, z + 0.016, w - 0.04, h - 0.04, 0.005, c)]
def tubes(path, w, c):
    return [seg(path[i], path[i+1], w, w, w, w, c) for i in range(len(path) - 1)]
