#!/usr/bin/env python3
"""Builds the art embedded in play.html from design/afterstreet_handoff:
   - one 2048x2048 texture atlas (window-glow mask stored in the alpha channel)
   - one strip of HUD item icons
   - the built-in downtown Springfield map in the game's compact map format
Writes tools/out/{atlas.png,icons.png,springfield.lbmap.json}. Run tools/write_assets.py afterwards."""
import json, os, sys
S = 2 if 'full' in sys.argv[1:] else 1   # 'full' builds a 4096 px atlas for computers; the default 2048 px one is for phones
from PIL import Image, ImageChops
SRC = os.path.join(os.path.dirname(__file__), '..', 'design', 'afterstreet_handoff')
OUT = os.path.join(os.path.dirname(__file__), 'out', 'full' if S == 2 else 'lite'); os.makedirs(OUT, exist_ok=True)
T = os.path.join(SRC, 'textures')
BIG = ['facades/facade_brick', 'facades/facade_brick_dark', 'facades/facade_siding_cream', 'facades/facade_siding_river', 'facades/facade_stucco', 'facades/facade_stone',
       'facades/shopfront_food', 'facades/shopfront_medicine', 'facades/shopfront_materials', 'facades/shopfront_gear', 'facades/shopfront_misc', 'ground/road_lanes']
SMALL = ['roofs/roof_gravel', 'roofs/roof_metal', 'roofs/roof_shingle_clay', 'ground/asphalt', 'ground/sidewalk', 'ground/grass', 'ground/dirt_lot', 'ground/water',
         'materials/floor_tile', 'materials/wallpaper_interior', 'materials/wood_planks', 'props/store_shelf_front', 'props/bookshelf_front', 'props/fridge_front', 'props/stove_front', 'materials/crate']
G = 4*S  # gutter in pixels, filled with wrapped texture so tiling does not bleed
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
atlas = Image.new('RGBA', (2048*S, 2048*S), (0, 0, 0, 255))
for i, n in enumerate(BIG): atlas.paste(tile(n, 512*S), ((i % 4)*512*S, (i//4)*512*S))
for j, n in enumerate(SMALL): atlas.paste(tile(n, 256*S), ((j % 8)*256*S, 1536*S + (j//8)*256*S))
atlas.save(os.path.join(OUT, 'atlas.png'), optimize=True)
# ---- HUD icons, 96 px each, in the order the game expects
fr = json.load(open(os.path.join(T, 'sprites', 'atlases.json')))['items']['frames']
sheet_src = Image.open(os.path.join(T, 'sprites', 'items_atlas.png')).convert('RGBA')
ORDER = ['canned_beans', 'water_bottle', 'first_aid_kit', 'batteries', 'planks', 'tin_can', 'rain_jacket', 'fuel_can', 'backpack']
icons = Image.new('RGBA', (96*(len(ORDER) + 4), 96))
for i, n in enumerate(ORDER):
    f = fr[n]; icons.paste(sheet_src.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])).resize((96, 96), Image.LANCZOS), (i*96, 0))
# four more: nails stand for ammo, the pack's flashlight, and a hand-drawn lantern and radio in the same flat outlined style
from PIL import ImageDraw
f = fr['nails']; icons.paste(sheet_src.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])).resize((96, 96), Image.LANCZOS), (9*96, 0))
wf = json.load(open(os.path.join(T, 'sprites', 'atlases.json')))['weapons']['frames']['flashlight']; wsrc = Image.open(os.path.join(T, 'sprites', 'weapons_atlas.png')).convert('RGBA')
icons.paste(wsrc.crop((wf['x'], wf['y'], wf['x'] + wf['w'], wf['y'] + wf['h'])).resize((96, 96), Image.LANCZOS), (10*96, 0))
big = Image.new('RGBA', (384*2, 384)); d = ImageDraw.Draw(big); INKC = (61, 48, 41, 255); LW = 14
# lantern
d.ellipse([112, 330, 272, 362], fill=(61, 48, 41, 60))
d.arc([128, 30, 256, 150], 180, 360, fill=INKC, width=LW)
d.rounded_rectangle([120, 84, 264, 128], 14, fill=(198, 113, 57, 255), outline=INKC, width=LW)
d.rounded_rectangle([132, 122, 252, 290], 18, fill=(246, 222, 150, 255), outline=INKC, width=LW)
d.ellipse([168, 170, 216, 250], fill=(217, 168, 69, 255))
d.rounded_rectangle([112, 282, 272, 338], 14, fill=(198, 113, 57, 255), outline=INKC, width=LW)
# radio
ox = 384
d.ellipse([ox + 70, 330, ox + 320, 362], fill=(61, 48, 41, 60))
d.line([ox + 250, 120, ox + 300, 26], fill=INKC, width=LW)
d.rounded_rectangle([ox + 64, 112, ox + 320, 338], 26, fill=(122, 138, 94, 255), outline=INKC, width=LW)
d.ellipse([ox + 92, 170, ox + 212, 290], fill=(235, 221, 197, 255), outline=INKC, width=LW)
for k in range(3): d.line([ox + 116, 206 + k*24, ox + 188, 206 + k*24], fill=INKC, width=8)
d.rounded_rectangle([ox + 236, 150, ox + 296, 196], 8, fill=(217, 168, 69, 255), outline=INKC, width=10)
d.ellipse([ox + 244, 230, ox + 288, 274], fill=(198, 113, 57, 255), outline=INKC, width=10)
icons.paste(big.resize((192, 96), Image.LANCZOS), (11*96, 0))
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
