"""Shared registry and primitives for the vehicle kit (kit_wheels.py, kit_parts.py, kit_water.py, vehiclekit.py).
Every kit model is a list of shaped pieces in the usual flat-colour language. Parts are modelled at their own mount point:
origin at the centre of the part's footprint on the surface it bolts to, y up from the surface, the front facing +Z (the vehicle's front)."""
from kit import *
import math

PAL = {
  'tyre': '#232325', 'tyreD': '#161618', 'hub': '#9a9a96', 'hubD': '#5b6168', 'rimSteel': '#7a7e82', 'rimSteelD': '#52565a', 'alloy': '#aeb2b6', 'alloyD': '#3a3c40',
  'chrome': '#c8c8c2', 'steel': '#4a4d52', 'steelD': '#2e3034', 'steelL': '#8f969e', 'black': '#1f2024', 'rubber': '#2c2c2e',
  'rust': '#8c4a2e', 'rustD': '#6a3a24', 'olive': '#5a6a3a', 'oliveD': '#46522c', 'warn': '#e0b830', 'orange': '#c46a2a', 'red': '#9a3a30', 'redD': '#7a2a24',
  'white': '#e2ddd2', 'glass': '#3c4a52', 'glassL': '#9bb3ba',
  'lamp': '#fff0c8', 'lampA': '#ffb030', 'lampR': '#ff3a2a', 'lampB': '#3a7aff', 'lampG': '#7aff9a',
  'canvas': '#8a8c6a', 'canvasD': '#6e7054', 'tent': '#6a7a4a', 'strap': '#2a2a2c', 'wood': '#8a6a46', 'woodD': '#6a5034', 'woodL': '#b08c62', 'plank': '#a07c52', 'hay': '#c8a85a', 'hayD': '#a8883e',
  'cardboard': '#a8865a', 'cardD': '#8a6c44', 'fuelRed': '#b8322a', 'jerry': '#5a6a3a', 'blue': '#3e5a7a', 'barrelB': '#3e5a7a', 'barrelR': '#9a3a30', 'plough': '#d8a020', 'ploughD': '#a87a14',
  'suit1': '#6a3a32', 'suit2': '#3a4a6a', 'suit3': '#4a5a3a', 'foam': '#d8d0b8', 'boatW': '#e8e4dc', 'boatB': '#2e4660', 'sail': '#e8e0cc', 'kayakY': '#d8a020', 'kayakR': '#b8322a', 'cooler': '#3e5a7a', 'coolerW': '#e8e4dc',
  'engine': '#2a2c30', 'engineL': '#5a5e64', 'leather': '#6a4a32', 'seat': '#2e3034', 'scrap': '#6a5a4a', 'sand': '#b8a070', 'ash': '#4a4640',
  'BODY': '#a8843c',
}
M = {'parts': {}, 'tyres': {}, 'rims': {}, 'bike_wheels': {}}
META = {'parts': {}, 'tyres': {}, 'rims': {}, 'bike_wheels': {}}
def reg(cat, name, pieces, **meta):
    assert name not in M[cat], name
    M[cat][name] = pieces; META[cat][name] = meta
def part(name, slot, pieces, anchor='center', group='body', tags=(), stats=None, rig=None, note='', **meta):
    """slot: which mount it bolts to; anchor: where the part's origin sits along the slot's area (center, front or rear); group: body (moves with the vehicle),
    bonnet (opens with the bonnet), bed (tips with the tipper bed)"""
    m = {'slot': slot, 'anchor': anchor, 'group': group, 'tags': list(tags), 'note': note}
    if stats: m['stats'] = stats
    if rig: m['rig'] = rig
    m.update(meta)
    reg('parts', name, pieces, **m)
def bx(x, y0, z, w, h, d, c, **k): return box([x, y0 + h/2, z], [w, h, d], c, **k)
def tube(p0, p1, t, c, caps=(True, True)): return seg(p0, p1, t/2, t/2, t/2, t/2, c, caps=caps)
def lampq(x, y, z, w, h, c='lamp', face=1): return box([x, y, z], [w, h, 0.03], c, glow=True)
def ring_k(n, lo, hi=1.0): return [hi if i % 2 == 0 else lo for i in range(n)]
