#!/usr/bin/env python3
"""Builds the art embedded in play.html from design/afterstreet_handoff:
   - one 2048x2048 texture atlas (window-glow mask stored in the alpha channel)
   - one strip of HUD item icons
   - the built-in downtown Springfield map in the game's compact map format
Writes tools/out/{atlas.png,icons.png,springfield.lbmap.json}. Run tools/embed_art.py afterwards."""
import json, os
from PIL import Image, ImageChops
SRC = os.path.join(os.path.dirname(__file__), '..', 'design', 'afterstreet_handoff')
OUT = os.path.join(os.path.dirname(__file__), 'out'); os.makedirs(OUT, exist_ok=True)
T = os.path.join(SRC, 'textures')
BIG = ['facades/facade_brick', 'facades/facade_brick_dark', 'facades/facade_siding_cream', 'facades/facade_siding_river', 'facades/facade_stucco', 'facades/facade_stone',
       'facades/shopfront_food', 'facades/shopfront_medicine', 'facades/shopfront_materials', 'facades/shopfront_gear', 'facades/shopfront_misc', 'ground/road_lanes']
SMALL = ['roofs/roof_gravel', 'roofs/roof_metal', 'roofs/roof_shingle_clay', 'ground/asphalt', 'ground/sidewalk', 'ground/grass', 'ground/dirt_lot', 'ground/water',
         'materials/floor_tile', 'materials/wallpaper_interior', 'materials/wood_planks', 'props/store_shelf_front', 'props/bookshelf_front', 'props/fridge_front', 'props/stove_front', 'materials/crate']
G = 4  # gutter in pixels, filled with wrapped texture so tiling does not bleed
def tile(name, size):
    im = Image.open(os.path.join(T, name + '.png')).convert('RGB')
    c = size - 2*G; im = im.resize((c, c), Image.LANCZOS)
    glow = None; ep = os.path.join(T, name + '_emissive.png')
    if os.path.exists(ep): glow = Image.open(ep).convert('L').resize((c, c), Image.LANCZOS)
    alpha = Image.new('L', (c, c), 255)
    if glow is not None: alpha = glow.point(lambda v: 255 - min(127, int(v*0.5)))   # 255 = no glow, 128 = full glow
    rgba = Image.merge('RGBA', (*im.split(), alpha))
    out = Image.new('RGBA', (size, size))
    for ox in (-c, 0, c):
        for oy in (-c, 0, c): out.paste(rgba, (G + ox, G + oy))
    return out
atlas = Image.new('RGBA', (2048, 2048), (0, 0, 0, 255))
for i, n in enumerate(BIG): atlas.paste(tile(n, 512), ((i % 4)*512, (i//4)*512))
for j, n in enumerate(SMALL): atlas.paste(tile(n, 256), ((j % 8)*256, 1536 + (j//8)*256))
atlas.save(os.path.join(OUT, 'atlas.png'), optimize=True)
# ---- HUD icons, 96 px each, in the order the game expects
fr = json.load(open(os.path.join(T, 'sprites', 'atlases.json')))['items']['frames']
sheet_src = Image.open(os.path.join(T, 'sprites', 'items_atlas.png')).convert('RGBA')
ORDER = ['canned_beans', 'water_bottle', 'first_aid_kit', 'batteries', 'planks', 'tin_can', 'rain_jacket', 'fuel_can', 'backpack']
icons = Image.new('RGBA', (96*len(ORDER), 96))
for i, n in enumerate(ORDER):
    f = fr[n]; icons.paste(sheet_src.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])).resize((96, 96), Image.LANCZOS), (i*96, 0))
icons.save(os.path.join(OUT, 'icons.png'), optimize=True)
# ---- built-in Springfield map
M = os.path.join(SRC, 'map_data')
def feats(n): return json.load(open(os.path.join(M, 'springfield_%s.geojson' % n)))['features']
def flat(cs): 
    o = []
    for c in cs: o += [round(c[0], 6), round(c[1], 6)]
    return o
ways, pois = [], []
for f in feats('buildings'):
    p = f['properties']; t = {'building': p.get('building') or 'yes'}
    if p.get('name'): t['name'] = p['name']
    lv = p.get('building:levels')
    try: lv = int(float(lv)) if lv else 0
    except ValueError: lv = 0
    if not lv and p.get('height_m'): lv = max(1, round(float(p['height_m'])/3.2))
    if lv: t['building:levels'] = str(lv)
    for k in ('shop', 'amenity', 'leisure'):
        if p.get(k): t[k] = p[k]
    g = f['geometry']; rings = [g['coordinates'][0]] if g['type'] == 'Polygon' else [c[0] for c in g['coordinates']]
    for r in rings: ways.append([t, flat(r)])
for f in feats('roads'):
    p = f['properties']; g = f['geometry']
    if g['type'] == 'LineString' and p.get('highway'): ways.append([{'highway': p['highway']}, flat(g['coordinates'])])
for f in feats('parks'):
    g = f['geometry']
    if g['type'] == 'Polygon': ways.append([{'leisure': 'park'}, flat(g['coordinates'][0])])
for f in feats('waters'):
    p = f['properties']; g = f['geometry']
    if g['type'] == 'Polygon': ways.append([{'natural': 'water'}, flat(g['coordinates'][0])])
    elif g['type'] == 'LineString': ways.append([{'waterway': p.get('waterway') or 'stream'}, flat(g['coordinates'])])
spawn = None
for f in feats('pois'):
    p = f['properties']; tag = p.get('osm_tag') or ''
    if '=' not in tag or f['geometry']['type'] != 'Point': continue
    k, v = tag.split('=', 1); t = {k: v}
    if p.get('name'): t['name'] = p['name']
    lon, lat = f['geometry']['coordinates'][:2]; pois.append([round(lon, 6), round(lat, 6), t])
    if p.get('id') == 'node/1294141807': spawn = [round(lon, 6), round(lat, 6)]
json.dump({'lastblockMap': 1, 'name': 'Springfield, MO (downtown)', 'attribution': '© OpenStreetMap contributors, ODbL', 'spawn': spawn, 'ways': ways, 'pois': pois},
          open(os.path.join(OUT, 'springfield.lbmap.json'), 'w'), separators=(',', ':'))
for n in ('atlas.png', 'icons.png', 'springfield.lbmap.json'): print(n, round(os.path.getsize(os.path.join(OUT, n))/1e6, 2), 'MB')
print('ways', len(ways), 'pois', len(pois), 'spawn', spawn)
