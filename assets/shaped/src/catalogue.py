#!/usr/bin/env python3
"""Writes docs/SHAPED.md from the packs themselves (their stats, choices and rules). Run after any generator."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
def load(n):
    s = open(os.path.join(HERE, '..', n + '.js')).read(); k = ').%s = ' % n
    return json.loads(s[s.index(k) + len(k):].rstrip().rstrip(';'))
SV, AL, BU, PR, HE, FX, GR, WA, PW = load('survivor'), load('aliens'), load('buildings'), load('props'), load('held'), load('fx'), load('ground'), load('walls'), load('power')
WD, MC, AN, IN = load('world'), load('machines'), load('animals'), load('interiors')
f = lambda n: f'{n:,}'
def row(st, key): t, v, w = st[key]; return f'{f(t)} / {f(v)} / {f(w)}'
L = []
L.append('''# Shaped content catalogue

Every shaped-piece pack made for Afterstreet, what is in it and how the game uses it. Packs are made in the art chat and handed to the main development chat. The look and the rules behind it are in `docs/ART.md`. Every number below is counted by `shapes.js` itself (`assets/shaped/src/stats.js`).

## How a pack works

- **Files:** each pack is a `.js` file in `assets/shaped/` that sets `window.SHAPED.<pack>`, so it loads from a drive over `file://`. Its generator is `assets/shaped/src/<pack>.py` (shared helpers in `kit.py`); run it with Python 3 and Node installed, then `catalogue.py` to refresh this page.
- **Builder:** `assets/shaped/shapes.js` turns a list of pieces into flat-shaded meshes with no 3D library. Two ways, same picture:
  - `SHAPED.build(pieces, colourOf, out, opt)`: every triangle has its own three corners `{pos, nor, col}` (what the game uses today).
  - `SHAPED.buildIndexed(...)`: each flat face keeps one set of corners shared by its triangles, `{pos, nor, col, idx}`. About a third fewer vertices. `opt.splitGlow` puts glowing pieces in `out.glow`.
  - `SHAPED.weld(mesh)`: merges corners that share a position and colour and drops normals, for a shader that works out face normals itself (`normalize(cross(dFdx(p), dFdy(p)))`; core in WebGL2, `OES_standard_derivatives` in WebGL1). About a quarter of `build`'s vertices.
- **Pieces:** shape `s` (`box`, `bev`, `wedge`, `cyl`, `loft`, `decal`, `poly`), position `p` in metres, colour `c`, optional `ry` (quarter turns) and `glow: true` (unlit: lamps, lit windows, alien eyes). Y is up, models face +Z. A `loft` ring can scale each corner (`k`), move each corner along the axis (`d`) and end in a point (`a = b = 0`).
- **Colours:** a palette name, or a slot (`SKIN`, `HAIR`, `SHIRT`, `PANTS`, `ACC` for survivors; `WALL`, `TRIM`, `FRAME`, `ROOF` for buildings). `_D` is that colour times the pack's `darker` (0.78).
- **Counts** in the tables: triangles / vertices with `buildIndexed` / vertices after `weld`. `build` makes three vertices per triangle.
- **Preview:** `art-tests/album.html` shows every pack (survivors, clothes, aliens, the building kit, a street by day and night, damage, items, furniture, garden, street props and vehicles, guns and ammo, walls and their states, doors and windows, joints, frame, harvest and bases, vehicle damage, car holes, power); `art-tests/survivor-creator.html` is the creator preview.
''')
st = SV['stats']; C = SV['choices']
mx = lambda pre, i: max(v[i] for k, v in st.items() if k.startswith(pre))
heavy = [st['body.masculine'][i] + mx('top.masculine', i) + mx('bottoms.masculine', i) + mx('shoes', i) + mx('face', i) + mx('hair', i) + mx('hat', i) + sum(st['gear.' + g][i] for g in C['gear']) for i in range(3)]
L.append(f'''## survivor (`assets/shaped/survivor.js`, version {SV['version']})

{SV['style'][0].upper() + SV['style'][1:]}. Every creator choice, plus the clothes the game's survivors wear (0.40 slots), as pieces grouped by skeleton bone. Same bone names and keys as version 6.

**Fitting** (unchanged): bone names match the survivor skeleton; each bone's `pivot` and `tip` give its direction and length in the pack's standing pose (1.80 m). Turn each bone's pieces onto the game's bone, stretch to its length, move onto its joint, bind rigidly. **Version 7 moved the pivots** (a straighter, narrower stance), so refit from `bones` rather than reusing v6 numbers.

**Putting a survivor together:** `parts.body[body]`, `parts.top[body][top]`, `parts.bottoms[body][bottoms]`, `parts.shoes[shoes]`, `parts.face[face]`, `parts.hair[hair]`, `parts.hat[hat]`, gear (`backpack`, `scarf`; `gloves` replace the hand pieces). Leave out `hat: "hide"` pieces under a hat. Builds: `SHAPED.scaleXZ` with `builds[build]` on every bone but `Head` and `neck_01`. Smears: `smear`, `smearRule`.

**Worn clothes** (`parts.worn[body][key]`, keys as in the game): {SV['wornRule']}

**Triangles:** body {f(st['body.masculine'][0])}; the heaviest mix of every largest option with pack, scarf and gloves is {f(heavy[0])} triangles, {f(heavy[1])} indexed vertices, {f(heavy[2])} welded (version 6: 2,185 triangles, 6,555 vertices).

| Part | Key | Masculine: tris, verts, welded | Feminine |
| --- | --- | --- | --- |''')
for grp in ('top', 'bottoms', 'worn'):
    for k in (C[grp] if grp != 'worn' else C['worn']):
        L.append(f'| {grp} | `{k}` | {row(st, f"{grp}.masculine.{k}")} | {row(st, f"{grp}.feminine.{k}")} |')
L.append('\n| Part | Key | Tris, verts, welded |\n| --- | --- | --- |')
for grp in ('shoes', 'face', 'hair', 'hat', 'gear'):
    for k in C[grp]:
        if f'{grp}.{k}' in st: L.append(f'| {grp} | `{k}` | {row(st, f"{grp}.{k}")} |')
st = AL['stats']
L.append(f'''
## aliens (`assets/shaped/aliens.js`, version {AL['version']})

{AL['style'][0].upper() + AL['style'][1:]}. Our own designs **and our own rigs**, replacing the Bestiary models and skeletons. {AL['about']} {AL['fadeRule']}

| Alien | Height | Bones | Tris, verts, welded | What it is |
| --- | --- | --- | --- | --- |''')
for k, c in AL['creatures'].items():
    L.append(f"| `{k}` | {c['height']} m | {len(c['bones'])} | {row(st, k)} | {c['about']} |")
L.append('''
Each creature: `parts[name][bone]` (pieces in the rest pose, model space), `creatures[name].bones` (pivot, tip, parent) and `creatures[name].clips` (`idle`, `walk` 4 frames, `attack` 3 frames, `dead`), each frame a map of bone to [x, y, z] degrees. To bake a frame: for each bone from the root down, rotate its pieces about its pivot by its angles (X, then Y, then Z), carrying the children. A bone with no entry keeps its rest pose.''')
st = BU['stats']
L.append(f'''
## buildings (`assets/shaped/buildings.js`, version {BU['version']})

{BU['style'][0].upper() + BU['style'][1:]}.

{BU['about'].strip()}

**Placing:** {BU['placeRule']}

**Breaking:** {BU['breakRule']}

**Colours:** {BU['colourRule']} Example sets: {', '.join('`' + k + '`' for k in BU['examples'])}.

**Torn walls (section 11.1):** {BU['breachRule']}

**House numbers and street names:** {BU['houseRule']}

**Gun shop:** {BU['gunshopRule']}

| Module | Tris, verts, welded |
| --- | --- |''')
for k in BU['models']['modules']: L.append(f'| `{k}` | {row(st, "modules." + k)} |')
L.append('\n| Template (whole building) | Tris, verts, welded |\n| --- | --- |')
for k in BU['models']['templates']: L.append(f'| `{k}` | {row(st, "templates." + k)} |')
L.append('\n| Torn wall piece | Tris, verts, welded |\n| --- | --- |')
for k in st:
    if k.startswith('breach.') or k.startswith('house.'): L.append(f'| `{k}` | {row(st, k)} |')
st = PR['stats']
L.append(f'''
## props (`assets/shaped/props.js`, version {PR['version']})

{PR['about'].strip()}

Vehicles are split as the game asked: `models.vehicles[name]` has `body`, `bonnet` and one `wheel`; `vehicleRig[name]` gives the wheel positions, the bonnet hinge and their axes. {PR['gardenRule']} {PR['containerRule']} {PR['buildRule']} {PR['wreckRule']} {PR['moving']['doors']['rule']}

**Harvest materials** (`items`, section 10.2): {', '.join(f'`{k}` ({v})' for k, v in PR['harvest'].items())}.

**Bases** (section 10.3): {PR['baseRule']}

**Vehicle damage** (section 10.5, 11.5): {PR['damageRule']}

**Gun shop inside (11.1):** {PR['shopRule']} **Boards and braces (11.2):** {PR['boardRule']} **Siphon (11.5):** {PR['siphonRule']} `items.paper_map` is the map pickup on the ground (11.8).

**Furniture size (11.6):** {PR['sizeRule']} {', '.join(f'`{k}` {v[0]} {v[1]} kg' for k, v in PR['furnitureSize'].items())}.

 `moving` lists other parts that open (doors, lids) and their hinges.

| Category | Model | Tris, verts, welded |
| --- | --- | --- |''')
for k in st: L.append(f"| {k.split('.')[0]} | `{'.'.join(k.split('.')[1:])}` | {row(st, k)} |")
L.append(f'''
## held (`assets/shaped/held.js`, version {HE['version']})

{HE['about'].strip()}

**Grip:** {HE['grip']['note']} Position {HE['grip']['pos']} on `{HE['grip']['bone']}`. Two-handed: {', '.join('`' + k + '`' for k in HE['twoHanded'])} ({HE['gripTwoHanded']['note']}) **States:** {HE['stateRule']} **First person:** the weapon goes at `fpWeapon` ({HE['fpWeapon']['pos']}, rotation {HE['fpWeapon']['rot']} degrees) with the arms in `models.fp.hold`; long guns use `fpLong` with `models.fp.shoulder` when carried and `fpAim` with `models.fp.aim` when aiming.

**Guns and bows** (version 2): {', '.join('`' + k + '`' for k in HE['guns'])}. {HE['gunRule']} Each gun's `info` gives its `muzzle`, the `ammo` it takes and how many it `holds`; long guns give `offhandAt`.

**Ammo** (`models.ammo`, on the ground like props: origin at the centre of the base): {', '.join(f'`{k}` ({v})' for k, v in HE['ammoInfo'].items())}. `models.cases` are the casings thrown out on a shot (`pistol_case`, `rifle_case`, `shotgun_hull`).

**Reloads in first person (11.4):** {HE['fpReloadRule']} Poses: {', '.join(f"`{k}` ({v['note']})" for k, v in HE['fpReload'].items())}. New weapon states for them: `pistol.empty` (magazine out, slide back) and `flare_gun.open`.

| Model | Tris, verts, welded | Notes |
| --- | --- | --- |''')
for k in HE['stats']:
    nm = k.split('.')[1] if k.startswith('weapons.') else ''
    L.append(f"| `{k}` | {row(HE['stats'], k)} | {HE['info'][nm]['note'] + '; length ' + str(HE['info'][nm]['length']) + ' m; ground: roll ' + str(HE['info'][nm]['ground']['roll']) + ', lift ' + str(HE['info'][nm]['ground']['lift']) if nm and k.endswith('.new') else ''} |")
L.append('''
**Survivor clips** (in `survivor.js`, `clips`): ''' + ', '.join('`' + k + '` (' + str(len(v)) + ')' for k, v in SV['clips'].items()) + '. ' + SV['clipRule']
         + f" heldTurn: {SV['heldTurn']}. carryAt: {SV['carryAt']['pos']} on `{SV['carryAt']['bone']}` ({SV['carryAt']['note']}) Sling: {SV['sling']['note']} At {SV['sling']['pos']} on `{SV['sling']['bone']}`, rot {SV['sling']['rot']}."
         + " New npc pieces: `quiver` (worn on the back) and `fishing_rod`. Portraits of the six ready-made survivors for the survivors panel: `assets/ui/portraits/<look>.png` (256 by 256).")
L.append(f'''
**NPC looks** (in `survivor.js`, `npcLooks`, version 7): ''' + ', '.join(f"`{k}` ({v['note']})" for k, v in SV['npcLooks'].items()) + '. ' + SV['npcRule'])
L.append(f'''
## fx (`assets/shaped/fx.js`, version {FX['version']})

{FX['about'].strip()}

| Model | Tris, verts, welded | How to use it |
| --- | --- | --- |''')
for k in FX['stats']: L.append(f"| `{k}` | {row(FX['stats'], k)} | {FX['notes'][k.split('.')[1]]} |")
L.append(f'''
## ground (`assets/shaped/ground.js`, version {GR['version']})

{GR['about'].strip()} {GR['kerbRule']} {GR['edgeRule']}

| Model | Tris, verts, welded |
| --- | --- |''')
for k in GR['stats']: L.append(f"| `{k}` | {row(GR['stats'], k)} |")
st = WA['stats']
L.append(f'''
## walls (`assets/shaped/walls.js`, version {WA['version']})

For the 0.56 wall construction (art requests section 10.1, with the car holes of 10.5). Loaded on its own, so the game can bring it in when it switches to cell walls.

{WA['about'].strip()}

**Grid:** cell {WA['grid']['cell']} m, bay {WA['grid']['bay']} m, panel {WA['grid']['panel']} m; storeys ''' + ', '.join(f'{k} {v} m' for k, v in WA['grid']['storeys'].items()) + f'''. {WA['grid']['frameZone']}.

**Breaking:** {WA['stateRule']}

**Openings:** {WA['openingInfo']['note']}

**Joints:** ''' + '; '.join(f'`{k}`: {v}' for k, v in WA['jointInfo'].items()) + '''.

| Kind | Used for | Layers (outside to inside) | Storeys | Section whole / rubble (tris) | Door / window intact (tris) |
| --- | --- | --- | --- | --- | --- |''')
for k, K in WA['kinds'].items():
    h = '%.1f' % K['heights'][0]
    L.append(f"| `{k}` | {K['use']} | {', '.join(l['cell'] + ' ' + str(l['z']) for l in K['layers'])} | {', '.join(str(x) for x in K['heights'])} m | {f(st[f'sections.{k}.{h}.whole'][0])} / {f(st[f'sections.{k}.{h}.rubble'][0])} | {f(st[f'openings.{k}.door.intact'][0])} / {f(st[f'openings.{k}.window.intact'][0])} |")
L.append('\n| Frame stick | Axis | Size at 1 m | Families |\n| --- | --- | --- | --- |')
for n, v in WA['sticksInfo'].items():
    fams = [fm for fm in WA['models']['sticks'] if n in WA['models']['sticks'][fm]]
    L.append(f"| `{n}` | {v['axis']} | {v['size']} | {', '.join(fams)} |")
L.append('\nFrame per kind: ' + '; '.join(f"`{k}`: {K['frame']}" for k, K in WA['kinds'].items()) + '.')
st = PW['stats']
L.append(f'''
## power (`assets/shaped/power.js`, version {PW['version']})

{PW['about'].strip()}

''' + ' '.join(f'**{k}:** {v}' for k, v in PW['notes'].items()) + '''

| Model | Tris, verts, welded |
| --- | --- |''')
for k in st: L.append(f"| `{k}` | {row(st, k)} |")
import re as _re
def tri_table(P, groups=True):
    st = P['stats']; cats = {}
    for k, v in st.items(): cats.setdefault(k.split('.')[0], []).append(v[0])
    return '\n| Group | Models | Triangles (smallest to largest) |\n| --- | --- | --- |\n' + '\n'.join(f'| `{c}` | {len(v)} | {min(v)} to {max(v)} |' for c, v in cats.items())
L.append(f'''
## world (`assets/shaped/world.js`, version {WD['version']})

{WD['about'].strip()}
''' + tri_table(WD))
L.append(f'''
## machines (`assets/shaped/machines.js`, version {MC['version']})

{MC['about'].strip()}

Machines: ''' + ', '.join('`' + k + '`' for k in MC['models']) + '.\n' + tri_table(MC))
L.append(f'''
## animals (`assets/shaped/animals.js`, version {AN['version']})

{AN['about'].strip()}

Creatures: ''' + ', '.join('`' + k + '`' for k in AN['creatures']) + '.\n' + tri_table(AN))
L.append(f'''
## interiors (`assets/shaped/interiors.js`, version {IN['version']})

{IN['about'].strip()}

''' + ' '.join(f'**{k}:** {v}' for k, v in IN['notes'].items()) + '\n' + tri_table(IN) + '''

## floor plans (`assets/shaped/floorplan.js`)

A generator and a checker, not a model pack: `FLOORPLAN.gen(kind, w, d, {seed, storeys})` returns walls, doors, rooms and keep-clear walkways for a building of that footprint; `FLOORPLAN.check(plan)` walks a 0.6 m agent through every door and fails if any room on any storey cannot be reached. Rules and how to plug it into `genInterior` are in `docs/FLOORPLANS.md`; `node assets/shaped/src/floorplan_test.js` runs it over thousands of footprints.
''')
_snd = open(os.path.join(ROOT, 'assets', 'audio', 'sounds_design.js')).read(); _keys = _re.findall(r'"([a-z0-9_]+)":\[', _snd)
L.append("""
## audio (`assets/audio/`, made in code)

Sound effects and music for sections 9, 10.6 and 11.11, synthesised by `assets/audio/src/make_audio.py` (numpy, scipy and ffmpeg; no samples, nothing to license). Same form as `assets/sounds.js`: small mono MP3s stored as text so they load from a drive.

- `assets/audio/sounds_design.js` adds keys to `window.ART.sounds` (each a list of 1 to 4 variations), so `sfx(name, ...)` plays them once the file is loaded after `assets/sounds.js`. Loops (`generator_hum`, `rain_roof`, `rain_outside`, `fire_crackle`) are cut to repeat seamlessly: play them with `loop = true`.
- `assets/audio/music_<name>.js` sets `window.ART.music[name]` (one MP3) and `window.ART.musicLoop[name]` (its length in seconds). `day` (calm, 84 bpm), `night` (a low drone with sparse bells), `horde` (drums and a minor riff, 132 bpm) and `base` (warm and slow) are two-minute seamless loops: decode, set `loop = true`, `loopStart = 0`, `loopEnd = musicLoop[name]` (that skips the MP3 padding). `chase` is a five-second sting. Load each file only when it is needed.
- `assets/audio/preview.html` plays everything.

Sound keys: """ + ', '.join('`' + k + '`' for k in _keys) + '.')
L.append('''
## UI icons (`assets/ui/`)

Survivor portraits (`portraits/<look>.png`, rendered from the survivor pack). Buttons (`jump`, `build`, `back`), `damage_arrow` (points up: turn it towards the hit), the status set (`bleeding`, `infected`, `broken_leg`, `wet`, `cold`, `hot`, `hungry`, `thirsty`, `tired`, `sick`) and `low_health_vignette.svg` (stretch over the screen, fade in under a quarter health). Inventory icons: harvest materials (`planks`, `scrap_wood`, `lumber`, `nails_handful`, `steel_beam`, `rebar_bundle`, `sheet_metal`, `concrete_chunk`, `brick`, `glass_sheet`, `wire_coil`, `plasterboard_scrap`), guns (`pistol`, `revolver`, `hunting_rifle`, `pump_shotgun`, `double_barrel`, `carbine`, `flare_gun`, `recurve_bow`, `crossbow`) and ammo (`pistol_ammo`, `rifle_ammo`, `shotgun_shells`, `arrows`, `crossbow_bolts`, `ammo_can`, `magazine`, `flare_shells`). 128 by 128 SVG in the weapons icons' field-journal style; `assets/ui/preview.html` shows them all. Made by `assets/shaped/src/ui_icons.py`.''')
open(os.path.join(ROOT, 'docs', 'SHAPED.md'), 'w').write('\n'.join(L) + '\n')
print('wrote docs/SHAPED.md')
