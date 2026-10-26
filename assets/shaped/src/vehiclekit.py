#!/usr/bin/env python3
"""Afterstreet vehicle kit, version 1 (26 October 2026): the parts, wheels and measurements that make every vehicle, bike and boat customisable.
Writes assets/shaped/vehiclekit.js. Run: python3 assets/shaped/src/vehiclekit.py   (run props.py, machines.py, bikes.py and boats.py first: the kit reads their measurements)

What is in it
  models.tyres / models.rims / models.bike_wheels   wheel sets, each modelled with radius 1 and width 1 (see 'rule')
  models.parts                                      bolt-on parts: roof racks, bumpers, bed caps, motors, canopies, baskets ...
  tyreInfo, rimInfo, bikeWheelInfo, partInfo        what each is: size factors, grip on each ground, the mount slot it fits, its size, tags, stats
  vehicles                                          every vehicle, bike and boat: its wheels, paint colours and mounts (named places a part bolts to)
  presets                                           ready-made loadouts for spawning variety (and for the album)
  rule                                              how to draw a customised vehicle (assets/shaped/vehiclefit.js does it for you)"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitreg import *
import kit_wheels
HERE = os.path.dirname(os.path.abspath(__file__))
try:
    import kit_parts
except ImportError: kit_parts = None
try:
    import kit_water
except ImportError: kit_water = None
try:
    import kit_index
except ImportError: kit_index = None

def measure(pack_name):
    return json.loads(subprocess.run(['node', os.path.join(HERE, 'bounds.js'), pack_name], capture_output=True, text=True, check=True).stdout)

pack = {'name': 'vehiclekit', 'version': 1, 'units': 'metres', 'facing': '+Z', 'flatModels': True, 'palette': PAL, 'about': __doc__.split('\n', 2)[2]}
pack['models'] = M
info = {'tyreInfo': META['tyres'], 'rimInfo': META['rims'], 'bikeWheelInfo': META['bike_wheels'], 'partInfo': META['parts']}
pack.update(info)
if kit_index: kit_index.add(pack)
out, st = write_pack('vehiclekit', pack, __file__)
b = measure('vehiclekit')
for key, v in b.items():
    g, n = key.split('.', 1)
    tab = {'parts': META['parts'], 'tyres': META['tyres'], 'rims': META['rims'], 'bike_wheels': META['bike_wheels']}[g]
    tab[n].update({'w': v[0], 'd': v[1], 'h': v[2], 'z0': v[6], 'z1': v[7]}) if g == 'parts' else None
out, st = write_pack('vehiclekit', pack, __file__)
t = [v[0] for v in st.values()]
print('vehiclekit', len(t), 'models', min(t), '-', max(t), 'triangles;', os.path.getsize(out)//1024, 'KB')
print({k: v[0] for k, v in st.items() if v[0] > 250})
