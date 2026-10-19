#!/usr/bin/env python3
"""Writes docs/SHAPED.md from the packs themselves (their stats, choices and rules). Run after any generator."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
def load(n):
    s = open(os.path.join(HERE, '..', n + '.js')).read(); k = ').%s = ' % n
    return json.loads(s[s.index(k) + len(k):].rstrip().rstrip(';'))
SV, AL, BU, PR, HE = load('survivor'), load('aliens'), load('buildings'), load('props'), load('held')
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
- **Preview:** `art-tests/album.html` shows every pack (survivors, clothes, aliens, the building kit, a street by day and night, damage, items, furniture, garden, street props and vehicles); `art-tests/survivor-creator.html` is the creator preview.
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

{AL['style'][0].upper() + AL['style'][1:]}. Our own designs **and our own rigs**, replacing the Bestiary models and skeletons. {AL['about']}

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

| Module | Tris, verts, welded |
| --- | --- |''')
for k in BU['models']['modules']: L.append(f'| `{k}` | {row(st, "modules." + k)} |')
L.append('\n| Template (whole building) | Tris, verts, welded |\n| --- | --- |')
for k in BU['models']['templates']: L.append(f'| `{k}` | {row(st, "templates." + k)} |')
st = PR['stats']
L.append(f'''
## props (`assets/shaped/props.js`, version {PR['version']})

{PR['about'].strip()}

Vehicles are split as the game asked: `models.vehicles[name]` has `body`, `bonnet` and one `wheel`; `vehicleRig[name]` gives the wheel positions, the bonnet hinge and their axes. {PR['gardenRule']} {PR['containerRule']} {PR['buildRule']} {PR['wreckRule']} {PR['moving']['doors']['rule']} `moving` lists other parts that open (doors, lids) and their hinges.

| Category | Model | Tris, verts, welded |
| --- | --- | --- |''')
for k in st: L.append(f"| {k.split('.')[0]} | `{'.'.join(k.split('.')[1:])}` | {row(st, k)} |")
L.append(f'''
## held (`assets/shaped/held.js`, version {HE['version']})

{HE['about'].strip()}

**Grip:** {HE['grip']['note']} Position {HE['grip']['pos']} on `{HE['grip']['bone']}`. Two-handed: {', '.join('`' + k + '`' for k in HE['twoHanded'])} ({HE['gripTwoHanded']['note']}) **States:** {HE['stateRule']} **First person:** the weapon goes at `fpWeapon` ({HE['fpWeapon']['pos']}, rotation {HE['fpWeapon']['rot']} degrees) with the arms in `models.fp.hold`.

| Model | Tris, verts, welded | Notes |
| --- | --- | --- |''')
for k in HE['stats']:
    nm = k.split('.')[1] if k.startswith('weapons.') else ''
    L.append(f"| `{k}` | {row(HE['stats'], k)} | {HE['info'][nm]['note'] + '; length ' + str(HE['info'][nm]['length']) + ' m; ground: roll ' + str(HE['info'][nm]['ground']['roll']) + ', lift ' + str(HE['info'][nm]['ground']['lift']) if nm and k.endswith('.new') else ''} |")
L.append('''
**Survivor clips** (in `survivor.js`, `clips`): ''' + ', '.join('`' + k + '` (' + str(len(v)) + ')' for k, v in SV['clips'].items()) + '. ' + SV['clipRule'])
open(os.path.join(ROOT, 'docs', 'SHAPED.md'), 'w').write('\n'.join(L) + '\n')
print('wrote docs/SHAPED.md')
