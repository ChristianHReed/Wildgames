#!/usr/bin/env python3
"""0.94: slim the old third-party models once the art chat's shaped models replaced them (one-off; safe to run twice).
  models.txt / vehicles.txt (tools/out) are a JSON index line and then base64 triangles (n*18 bytes of int16 corners, n*3 bytes of colour per entry).
  - kept whole: models the game still draws (furniture without a shaped replacement; the pickup truck's parts, the spare tire and the door)
  - size only (n = 0): entries a shaped model replaced; the game still reads their size (hx, hz, h) so rooms lay out as before
  - dropped: entries nothing uses
Then writes assets/models.js and assets/vehicles.js. See docs/ART_REQUESTS.md ("Still on third-party art") for what remains."""
import base64, json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); O = os.path.join(R, 'tools', 'out'); A = os.path.join(R, 'assets')
MODELS_KEEP = set('chair_stool cabinet_medium_decorated cabinet_small_decorated cabinet_medium cactus_medium_A k_basin k_night k_bunk k_plant k_rug k_washer k_coat k_stool'.split())
MODELS_DROP = set('car_sedan car_hatchback car_stationwagon car_taxi car_police box k_bar k_doorway'.split())
VEH_KEEP = set('truck truck_w0 truck_w1 truck_w2 truck_w3 truck_hood tire door'.split())
VEH_REPL = set('sedan suv van police taxi hatch'.split())   # replaced by the shaped cars: keep size only
def slim(name, keep, drop, size_only=None):
    t = open(os.path.join(O, name)).read(); nl = t.index('\n'); idx = json.loads(t[:nl]); raw = base64.b64decode(t[nl+1:]); out = {}; buf = bytearray()
    for k, e in idx.items():
        if k in drop: continue
        keepit = k in keep if size_only is None else (k in keep or e['n'] == 0)
        if keepit and e['n']:
            e2 = dict(e); e2['o'] = len(buf); buf += raw[e['o']:e['o'] + e['n']*21]; out[k] = e2
        else:
            e2 = dict(e); e2['o'] = 0; e2['n'] = 0; out[k] = e2
    txt = json.dumps(out, separators=(',', ':')) + '\n' + base64.b64encode(bytes(buf)).decode()
    open(os.path.join(O, name), 'w').write(txt); return txt, len(idx), len(out), sum(1 for e in out.values() if e['n'])
def put(rel, key, text):
    open(os.path.join(A, rel), 'w').write('/* Afterstreet art: made by tools/write_assets.py, do not edit by hand */\n(window.ART = window.ART || {}).' + key + ' = ' + json.dumps(text) + ';\n')
    print(rel, round(os.path.getsize(os.path.join(A, rel))/1024), 'KB')
t, a, b, c = slim('models.txt', MODELS_KEEP, MODELS_DROP); put('models.js', 'models', t); print('models: %d entries -> %d, %d with geometry' % (a, b, c))
# vehicles: keep the truck's parts, tire and door whole; the shaped-replaced cars keep their size only; the old wheels of replaced cars go
vd = {k + '_w%d' % i for k in VEH_REPL for i in range(4)}
t, a, b, c = slim('vehicles.txt', VEH_KEEP, vd, size_only=True); put('vehicles.js', 'vehicles', t); print('vehicles: %d entries -> %d, %d with geometry' % (a, b, c))
