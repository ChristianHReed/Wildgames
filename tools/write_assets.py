#!/usr/bin/env python3
"""Writes the assets folder that sits beside play.html. Each file is a small script that hands one piece of art to the game
(plain script files are the one kind of file a page opened straight from a drive is always allowed to load).
  assets/icons.js, btex.js, people_tex.js, models.js, nature.js, vehicles.js   shared by every device
  assets/full/atlas.js, atlas3.js, creatures.js   for computers: 4096 px textures, more detailed creatures
  assets/lite/...                                 for phones and "Low" view distance
Run after: build_art.py (twice: plain and "full"), build_models.py, paint_buildings.py, build_creatures.py (twice), build_nature.py (twice), build_people.py (twice), paint_people.py, build_vehicles.py then draw_clothes.py (both after build_art.py: they add icons)."""
import base64, json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); O = os.path.join(R, 'tools', 'out'); A = os.path.join(R, 'assets')
def b64(p): return base64.b64encode(open(p, 'rb').read()).decode()
def put(rel, key, text):
    p = os.path.join(A, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write('/* Afterstreet art: made by tools/write_assets.py, do not edit by hand */\n(window.ART = window.ART || {}).' + key + ' = ' + json.dumps(text) + ';\n'); print(rel, round(os.path.getsize(p)/1e6, 2), 'MB')
put('icons.js', 'icons', b64(os.path.join(O, 'lite', 'icons.png')))
put('people_tex.js', 'ptex', b64(os.path.join(O, 'people_tex.png')))   # tools/paint_people.py
put('btex.js', 'btex', b64(os.path.join(O, 'btex.png')))   # tools/paint_buildings.py
put('models.js', 'models', open(os.path.join(O, 'models.txt')).read())
put('nature.js', 'nature', open(os.path.join(O, 'nature.txt')).read())
put('vehicles.js', 'vehicles', open(os.path.join(O, 'vehicles.txt')).read())   # tools/build_vehicles.py
put('rig.js', 'rig', open(os.path.join(O, 'rig.txt')).read())   # tools/build_rig.py: the survivor skeleton's moves, for the shaped survivors
# assets/map.js (the built-in Springfield region index) and assets/springfield/ are written by tools/build_region.py
for s in ('full', 'lite'):
    put(s + '/atlas.js', 'atlas', b64(os.path.join(O, s, 'atlas.png')))
    put(s + '/atlas3.js', 'atlas3', b64(os.path.join(O, s, 'atlas3.png')))
    put(s + '/creatures.js', 'creatures', open(os.path.join(O, s, 'creatures.txt')).read())
    if os.path.exists(os.path.join(O, s, 'people.txt')): put(s + '/people.js', 'people', open(os.path.join(O, s, 'people.txt')).read())
