# Shaped content catalogue

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

## survivor (`assets/shaped/survivor.js`, version 7)

Silhouette first: square-shouldered wedge torsos, arms tapering to points, straight column legs, small featureless heads (18 October 2026). Every creator choice, plus the clothes the game's survivors wear (0.40 slots), as pieces grouped by skeleton bone. Same bone names and keys as version 6.

**Fitting** (unchanged): bone names match the survivor skeleton; each bone's `pivot` and `tip` give its direction and length in the pack's standing pose (1.80 m). Turn each bone's pieces onto the game's bone, stretch to its length, move onto its joint, bind rigidly. **Version 7 moved the pivots** (a straighter, narrower stance), so refit from `bones` rather than reusing v6 numbers.

**Putting a survivor together:** `parts.body[body]`, `parts.top[body][top]`, `parts.bottoms[body][bottoms]`, `parts.shoes[shoes]`, `parts.face[face]`, `parts.hair[hair]`, `parts.hat[hat]`, gear (`backpack`, `scarf`; `gloves` replace the hand pieces). Leave out `hat: "hide"` pieces under a hat. Builds: `SHAPED.scaleXZ` with `builds[build]` on every bone but `Head` and `neck_01`. Smears: `smear`, `smearRule`.

**Worn clothes** (`parts.worn[body][key]`, keys as in the game): Clothes the survivor wears in the game (0.40 keys). sweater (top slot) is a layer drawn over the creator top; coat, raincoat and leather (outer slot) are layers drawn over the top and the sweater; trousers and thermals (legs slot) replace the creator bottoms. Their colours are fixed (palette entries with the same names, _D darker).

**Triangles:** body 108; the heaviest mix of every largest option with pack, scarf and gloves is 817 triangles, 1,763 indexed vertices, 566 welded (version 6: 2,185 triangles, 6,555 vertices).

| Part | Key | Masculine: tris, verts, welded | Feminine |
| --- | --- | --- | --- |
| top | `tshirt` | 121 / 243 / 83 | 121 / 243 / 83 |
| top | `striped_tee` | 153 / 307 / 111 | 153 / 307 / 111 |
| top | `flannel_shirt` | 169 / 343 / 125 | 169 / 343 / 125 |
| top | `spotted_top` | 133 / 267 / 107 | 133 / 267 / 107 |
| top | `hoodie` | 138 / 276 / 100 | 138 / 276 / 100 |
| top | `open_jacket` | 128 / 256 / 92 | 128 / 256 / 92 |
| top | `jumper` | 138 / 282 / 98 | 138 / 282 / 98 |
| top | `dungarees` | 122 / 244 / 92 | 122 / 244 / 92 |
| bottoms | `jeans` | 84 / 168 / 60 | 84 / 168 / 60 |
| bottoms | `shorts` | 104 / 208 / 76 | 104 / 208 / 76 |
| bottoms | `cargo_trousers` | 108 / 216 / 74 | 108 / 216 / 74 |
| bottoms | `capri_trousers` | 80 / 160 / 60 | 80 / 160 / 60 |
| bottoms | `track_pants` | 96 / 192 / 72 | 96 / 192 / 72 |
| bottoms | `rolled_jeans` | 108 / 216 / 76 | 108 / 216 / 76 |
| worn | `sweater` | 144 / 288 / 100 | 144 / 288 / 100 |
| worn | `coat` | 130 / 260 / 96 | 130 / 260 / 96 |
| worn | `raincoat` | 136 / 272 / 94 | 136 / 272 / 94 |
| worn | `leather` | 141 / 287 / 101 | 141 / 287 / 101 |
| worn | `trousers` | 132 / 264 / 90 | 132 / 264 / 90 |
| worn | `thermals` | 96 / 192 / 72 | 96 / 192 / 72 |

| Part | Key | Tris, verts, welded |
| --- | --- | --- |
| shoes | `trainers` | 48 / 104 / 32 |
| shoes | `boots` | 72 / 152 / 48 |
| shoes | `rain_boots` | 88 / 184 / 64 |
| face | `calm` | 0 / 0 / 0 |
| face | `glasses` | 40 / 80 / 32 |
| face | `stubble` | 28 / 70 / 18 |
| face | `freckles` | 8 / 16 / 16 |
| face | `tired` | 4 / 8 / 8 |
| face | `moustache` | 12 / 24 / 8 |
| face | `dark_glasses` | 36 / 72 / 24 |
| face | `scar` | 2 / 4 / 4 |
| hair | `none` | 0 / 0 / 0 |
| hair | `buzzed` | 28 / 74 / 18 |
| hair | `short` | 76 / 194 / 38 |
| hair | `bob` | 104 / 254 / 51 |
| hair | `buns` | 40 / 98 / 26 |
| hair | `beard` | 104 / 266 / 55 |
| hat | `none` | 0 / 0 / 0 |
| hat | `cap` | 26 / 54 / 18 |
| hat | `beanie` | 26 / 52 / 20 |
| hat | `helmet` | 48 / 106 / 30 |
| gear | `backpack` | 58 / 112 / 44 |
| gear | `scarf` | 38 / 76 / 36 |
| gear | `gloves` | 56 / 120 / 42 |

## aliens (`assets/shaped/aliens.js`, version 1)

The survivors' shape language turned wrong: flat planes and points, wrong-way joints, drab bodies, glowing eyes and vents. Our own designs **and our own rigs**, replacing the Bestiary models and skeletons. Our own alien designs and rigs, replacing the Bestiary stand-ins and their skeletons. Each has bones (pivot, tip, parent), parts per bone, and clips (idle, walk, attack, dead, as the game uses today): per frame, rotations in degrees [x, y, z] about each bone pivot (order X, then Y, then Z, child bones carried along). The game can bake each frame into a pose, as it does for the Bestiary models today, and play walk at about 4 frames a second, faster for the swarmer. Eyes, vents and seams are separate pieces marked glow:true: draw them unlit (emissive). fade is the corpse-fade pose: blend from dead to fade over about 2 s, then sink the body 0.3 m into the ground and darken it to the ground colour over 4 s before removing it.

| Alien | Height | Bones | Tris, verts, welded | What it is |
| --- | --- | --- | --- | --- |
| `swarmer` | 0.9 m | 12 | 192 / 452 / 149 | Small, numerous, weak alone. About 0.9 m tall and 1.65 m long, four spider legs with knees above the back, a tail spike. |
| `stalker` | 2.2 m | 15 | 252 / 592 / 167 | Rare hunter, about 2.2 m hunched (2.7 m upright). Legs bend the wrong way, arms end in bone blades below the knee, a ragged cloak of skin. |
| `giant` | 4.0 m | 13 | 334 / 724 / 226 | Huge and rare, about 4 m tall on its knuckles and 2.9 m wide at the shoulders. A tiny head with three eyes, glowing vents down its back. |
| `spitter` | 1.4 m | 12 | 185 / 423 / 144 | Ranged. About 1.4 m, a bloated body on four legs and a long neck; rears back and spits a glowing glob from its throat sac (the projectile is spit_glob, its splash goo_splat). |
| `clinger` | 0.55 m | 15 | 248 / 584 / 194 | Climber. About 1.9 m from nose to tail, low and flat on six legs with hooked feet; walks up walls and across roofs. On a wall, turn the whole model so its underside faces the wall and play cling or walk. |
| `nest` | 2.4 m | 1 | 252 / 580 / 188 | Takes over buildings and spreads. Placed at a doorway or against a wall (-Z); seams glow and pulse at night. |
| `hive_small` | 1.08 m | 1 | 252 / 580 / 188 | A new hive: a few pods the size of a dog. |
| `hive_grown` | 2.4 m | 1 | 252 / 580 / 188 | A grown hive (the nest): pods, tendrils, glowing seams. |
| `hive_burst` | 2.4 m | 1 | 307 / 735 / 213 | A burst hive: split husks, shell shards and a goo pool; nothing glows. |
| `decals` | 0 m | 1 | 80 / 144 / 98 | Not a creature: ground decals and the spit projectile. goo_splat where a spit lands or an alien dies; blood_1, blood_2 and blood_trail for survivors; spit_glob flies along +Z, glowing. |

Each creature: `parts[name][bone]` (pieces in the rest pose, model space), `creatures[name].bones` (pivot, tip, parent) and `creatures[name].clips` (`idle`, `walk` 4 frames, `attack` 3 frames, `dead`), each frame a map of bone to [x, y, z] degrees. To bake a frame: for each bone from the root down, rotate its pieces about its pivot by its angles (X, then Y, then Z), carrying the children. A bone with no entry keeps its rest pose.

## buildings (`assets/shaped/buildings.js`, version 1)

Framed buildings: a visible frame of posts and beams with infill panels set 6 cm back.

How a framed building works (from the research in the art guide: frame-and-infill building, depth, trim):
  - Every wall is a grid of bays, 2.4 m wide and 3 m tall (one storey). A bay is a FRAME (a post on its left edge and a beam
    at its top) and an INFILL panel between them: plain wall, window, door, shopfront, garage door, boarded window or
    nothing (broken).
  - The frame stands proud of the infill by 6 cm, so every wall shows a grid of shadow lines: the building's structure is
    visible, and windows and doors sit back in the wall instead of being painted on.
  - Breaking: infill panels break (fall out as rubble chunks, leaving the frame), frames break last; when a post goes, the
    bays it carried above fall. This replaces the 12.5 cm block walls: far fewer vertices, and walls still break bay by bay.
  - Colour slots per building: WALL (infill), TRIM (sills, lintels, door), FRAME, ROOF. Glass is its own colour and lights up
    at night with the 'lit' variants (glow:true).
Bay-local coordinates: x across the bay (-1.2 to 1.2), y up from the storey floor (0 to 3), z out of the wall (+Z is outside).
The game places bays along each footprint edge: one bay per 2.4 m (stretch the bay's x when an edge does not divide evenly).

**Placing:** Each module is in bay-local coordinates. For a footprint edge, walk it in 2.4 m bays; for each bay and storey place frame_<kind>, one infill module and any extras (awning, balcony, sign) turned to face out of the wall (quarter turns as SHAPED pieces use: ry). Add plinth to the ground storey, a corner_<kind> post at every corner, then the roof.

**Breaking:** Infill modules break first (replace with broken: the panel falls as rubble chunks). A frame module breaks last; the bays above a broken post fall.

**Colours:** WALL, TRIM, FRAME and ROOF are chosen per building (see examples); a slot ending in _D is that colour times darker. Example sets: `timber_house`, `brick_shop`, `concrete_flats`, `corner_store`.

**Torn walls (section 11.1):** breach[finish] for a torn-open stretch of town wall, matching breachApply: the opening runs along X from -W/2 to W/2 and up to 2.7 m, faces at z = +0.05 (outside) and -0.05 (inside). For W = 2.4 or 4.0 use hole_<W>, rubble_<W> and (when the player closes it) boarded_<W>. For any other length put edge_left at x = -W/2, edge_right at x = +W/2 and top stretched along X to W (it is 1 m long, centred), rubble_2.4 or rubble_4.0 stretched along X, and boarded_1m stretched to W. Lower walls: scale Y by h/2.7. Before it breaks, draw cracked_<W> (cracks on both faces) and then missing_<W> (bricks out, boards off, a torn sheet, a broken pane) over the whole wall. Finishes: siding, brick, metal, glass.

**House numbers and street names:** house.plaque is 0.4 by 0.2 m, its back at z = 0, hung beside the door at about 1.8 m; put up to three digit_<n> on it at x = -0.1, 0, +0.1 (each digit is 0.07 by 0.13, centred on its origin, z already in front of the plaque). The digits also work painted straight on a wall or a kerb. house.street_blade is 0.9 by 0.18, both faces green with a white border; put two at right angles on top of props.street.street_name_post and draw the road name on each face in white (the text area is 0.8 by 0.12).

**Gun shop:** modules.gunshop_front is a ground-storey bay (in place of shopfront): a barred window, a steel door and a sign board with a target and a rifle; the inside pieces are props.shop (gun_counter, gun_rack, ammo_shelf, target_poster).

| Module | Tris, verts, welded |
| --- | --- |
| `frame_timber` | 24 / 48 / 14 |
| `frame_steel` | 24 / 48 / 14 |
| `frame_concrete` | 24 / 48 / 14 |
| `corner_timber` | 12 / 24 / 8 |
| `corner_steel` | 12 / 24 / 8 |
| `corner_concrete` | 12 / 24 / 8 |
| `plinth` | 12 / 24 / 8 |
| `wall_plain` | 12 / 24 / 8 |
| `wall_siding` | 22 / 44 / 28 |
| `wall_brick` | 16 / 32 / 16 |
| `window_plain` | 88 / 176 / 56 |
| `window_siding` | 104 / 208 / 88 |
| `window_brick` | 88 / 176 / 56 |
| `window_lit_warm` | 88 / 176 / 56 |
| `window_lit_cold` | 88 / 176 / 56 |
| `door_plain` | 84 / 168 / 52 |
| `door_siding` | 102 / 204 / 88 |
| `door_brick` | 88 / 176 / 60 |
| `shopfront` | 60 / 120 / 40 |
| `shopfront_lit` | 60 / 120 / 40 |
| `garage` | 32 / 64 / 32 |
| `boarded` | 94 / 188 / 68 |
| `broken` | 72 / 204 / 48 |
| `balcony` | 108 / 216 / 72 |
| `awning` | 24 / 48 / 16 |
| `sign` | 12 / 24 / 8 |
| `wall_plain_damaged` | 78 / 180 / 86 |
| `wall_siding_damaged` | 88 / 200 / 106 |
| `wall_brick_damaged` | 82 / 188 / 94 |
| `window_plain_damaged` | 154 / 332 / 134 |
| `window_siding_damaged` | 170 / 364 / 166 |
| `window_brick_damaged` | 154 / 332 / 134 |
| `door_plain_damaged` | 150 / 324 / 130 |
| `shopfront_damaged` | 126 / 276 / 118 |
| `garage_damaged` | 98 / 220 / 110 |
| `hole_plain` | 240 / 540 / 152 |
| `hole_siding` | 254 / 568 / 180 |
| `hole_brick` | 246 / 552 / 164 |
| `frame_timber_snapped` | 96 / 240 / 66 |
| `frame_steel_snapped` | 96 / 240 / 66 |
| `frame_concrete_snapped` | 96 / 240 / 66 |
| `rubble_small` | 60 / 170 / 40 |
| `rubble_large` | 144 / 408 / 96 |
| `inside_torn` | 24 / 36 / 36 |
| `studs` | 96 / 192 / 64 |
| `door_boarded` | 162 / 324 / 112 |
| `gunshop_front` | 378 / 724 / 256 |

| Template (whole building) | Tris, verts, welded |
| --- | --- |
| `timber_house` | 1,926 / 3,856 / 1,436 |
| `brick_shop` | 1,720 / 3,440 / 1,040 |
| `concrete_flats` | 5,308 / 10,616 / 3,116 |
| `corner_store` | 1,978 / 4,136 / 1,172 |

| Torn wall piece | Tris, verts, welded |
| --- | --- |
| `breach.siding.edge_left` | 196 / 456 / 125 |
| `breach.siding.edge_right` | 196 / 456 / 125 |
| `breach.siding.top` | 66 / 160 / 43 |
| `breach.siding.boarded_1m` | 240 / 480 / 160 |
| `breach.siding.hole_2.4` | 458 / 1,072 / 287 |
| `breach.siding.rubble_2.4` | 146 / 352 / 100 |
| `breach.siding.boarded_2.4` | 240 / 480 / 160 |
| `breach.siding.cracked_2.4` | 24 / 48 / 48 |
| `breach.siding.missing_2.4` | 76 / 152 / 88 |
| `breach.siding.hole_4.0` | 458 / 1,072 / 288 |
| `breach.siding.rubble_4.0` | 242 / 584 / 164 |
| `breach.siding.boarded_4.0` | 240 / 480 / 160 |
| `breach.siding.cracked_4.0` | 36 / 72 / 72 |
| `breach.siding.missing_4.0` | 140 / 280 / 152 |
| `breach.brick.edge_left` | 278 / 580 / 239 |
| `breach.brick.edge_right` | 278 / 580 / 239 |
| `breach.brick.top` | 52 / 104 / 38 |
| `breach.brick.boarded_1m` | 240 / 480 / 160 |
| `breach.brick.hole_2.4` | 608 / 1,264 / 512 |
| `breach.brick.rubble_2.4` | 146 / 352 / 100 |
| `breach.brick.boarded_2.4` | 240 / 480 / 160 |
| `breach.brick.cracked_2.4` | 24 / 48 / 48 |
| `breach.brick.missing_2.4` | 64 / 128 / 96 |
| `breach.brick.hole_4.0` | 608 / 1,264 / 512 |
| `breach.brick.rubble_4.0` | 242 / 584 / 164 |
| `breach.brick.boarded_4.0` | 240 / 480 / 160 |
| `breach.brick.cracked_4.0` | 36 / 72 / 72 |
| `breach.brick.missing_4.0` | 116 / 232 / 168 |
| `breach.metal.edge_left` | 44 / 100 / 30 |
| `breach.metal.edge_right` | 44 / 100 / 30 |
| `breach.metal.top` | 64 / 144 / 43 |
| `breach.metal.boarded_1m` | 240 / 480 / 160 |
| `breach.metal.hole_2.4` | 152 / 344 / 103 |
| `breach.metal.rubble_2.4` | 146 / 380 / 100 |
| `breach.metal.boarded_2.4` | 240 / 480 / 160 |
| `breach.metal.cracked_2.4` | 24 / 48 / 48 |
| `breach.metal.missing_2.4` | 54 / 118 / 78 |
| `breach.metal.hole_4.0` | 152 / 344 / 103 |
| `breach.metal.rubble_4.0` | 242 / 628 / 164 |
| `breach.metal.boarded_4.0` | 240 / 480 / 160 |
| `breach.metal.cracked_4.0` | 36 / 72 / 72 |
| `breach.metal.missing_4.0` | 96 / 212 / 132 |
| `breach.glass.edge_left` | 52 / 132 / 39 |
| `breach.glass.edge_right` | 52 / 132 / 39 |
| `breach.glass.top` | 28 / 72 / 21 |
| `breach.glass.boarded_1m` | 240 / 480 / 160 |
| `breach.glass.hole_2.4` | 132 / 336 / 93 |
| `breach.glass.rubble_2.4` | 165 / 469 / 157 |
| `breach.glass.boarded_2.4` | 240 / 480 / 160 |
| `breach.glass.cracked_2.4` | 24 / 48 / 48 |
| `breach.glass.missing_2.4` | 28 / 56 / 56 |
| `breach.glass.hole_4.0` | 132 / 336 / 93 |
| `breach.glass.rubble_4.0` | 274 / 780 / 260 |
| `breach.glass.boarded_4.0` | 240 / 480 / 160 |
| `breach.glass.cracked_4.0` | 36 / 72 / 72 |
| `breach.glass.missing_4.0` | 44 / 88 / 88 |
| `house.plaque` | 24 / 48 / 16 |
| `house.digit_0` | 12 / 24 / 16 |
| `house.digit_1` | 4 / 8 / 6 |
| `house.digit_2` | 10 / 20 / 18 |
| `house.digit_3` | 10 / 20 / 16 |
| `house.digit_4` | 8 / 16 / 14 |
| `house.digit_5` | 10 / 20 / 18 |
| `house.digit_6` | 12 / 24 / 19 |
| `house.digit_7` | 6 / 12 / 9 |
| `house.digit_8` | 14 / 28 / 20 |
| `house.digit_9` | 12 / 24 / 19 |
| `house.street_blade` | 60 / 120 / 40 |

## props (`assets/shaped/props.js`, version 1)

Same language as the survivors and buildings: rectangular frustums and boxes, flat colour planes, few corners, points
instead of caps. Every model sits on the ground at its origin (pivot = centre of its base), faces +Z, metres.
Moving parts (doors, lids, wheels) are separate entries in 'moving' with their hinge or axle so the game can turn them.
Vehicles are boxy 1970s to 1990s shapes, worn: rust patches, a cracked windscreen, mismatched panels.
Pieces marked glow:true are lamps and lit screens.

Vehicles are split as the game asked: `models.vehicles[name]` has `body`, `bonnet` and one `wheel`; `vehicleRig[name]` gives the wheel positions, the bonnet hinge and their axes. garden_plot is the empty bed; draw garden_sprouting, garden_growing or garden_ripe on top of it for the plot's stage. rain_barrel is the rain collector. containers holds every searchable container twice: <name> closed and <name>_searched (doors open, drawer out, lid up, fewer things inside). build holds things players make and place; barricade has three stages (barricade, barricade_damaged, barricade_nearly_gone); campfire and generator have lit/running and out/off versions. glow pieces are flames, embers and lamps. Every vehicle also comes as <name>_wreck (rusted, flat tyres, broken glass) and <name>_burnt (charred shell on bare rims); lower them by vehicleRig[...].sitDrop. Every piece here hinges at the origin: doors and shutters about the y axis (the leaf runs to +X), lids about the x axis (the lid runs to +Z). garage_door rolls up instead: slide its five slats up one after another and lay them flat under the ceiling.

**Harvest materials** (`items`, section 10.2): `planks` (boards from siding, sheathing and floors), `scrap_wood` (broken boards, splinters (fuel, small repairs)), `lumber` (studs, plates and joists cut out of a frame (worth more than skins)), `nails_handful` (pulled from every wood layer), `steel_beam` (steel frame columns, beams, girts), `rebar_bundle` (from broken concrete), `sheet_metal` (sheet and cladding skins, metal deck), `concrete_chunk` (poured walls, slabs, columns), `brick` (brick skins (brick_stack is five)), `glass_sheet` (whole panes taken out before they break), `wire_coil` (stripped from walls and the power grid), `plasterboard_scrap` (inner skins (little use: patching, kindling)).

**Bases** (section 10.3): build.claim_sign or build.claim_flag marks a claimed base (nail the sign by the door). build.custom_bed is the bed made from harvested planks and cloth scraps. build.reinforce_<planks|sheet|mesh> (and _damaged, _nearly_gone) is a 1.5 m by 2.4 m panel laid on the room side of a wall: its back at z = 0, facing +Z into the room. Planks suit wood walls, sheet metal steel walls, rebar mesh concrete, but any goes on any.

**Vehicle damage** (section 10.5, 11.5): vehicles[name].damage (sedan, hatchback, pickup, van): body_crumple_light / body_crumple_heavy and body_bumper_bent replace body; bonnet_crumple_light / bonnet_crumple_heavy (use with the matching body) and bonnet_buckled (folded up, goes with body_crumple_heavy) replace bonnet; windscreen_cracked and windscreen_missing are drawn on top of the body; smoke is a scorch mark and a few puffs over the bonnet for a smoking engine (or start fx.smoke_column at vehicleRig[name].smokeAt). Order a crash goes through: bumper_bent and windscreen_cracked (light knock), crumple_light, crumple_heavy with bonnet_buckled, smoke, windscreen_missing. The game's vehicle health maps to the looks: above 70 whole, 70 to 40 body_bumper_bent with windscreen_cracked, 40 to 15 crumple_light, under 15 crumple_heavy with bonnet_buckled and smoke, wrecked (0) crumple_heavy, bonnet_buckled and windscreen_missing, burning: add fire (flames standing on the bonnet, glow; flicker them and add a warm light) for a minute, then the <name>_burnt shell.

**Gun shop inside (11.1):** shop: the inside of a gun shop (with buildings.modules.gunshop_front): gun_counter (2 m glass counter with pistols inside), gun_rack (a wall of long guns, against a wall: back at z = -0.09), ammo_shelf, target_poster (on a wall, back at z = 0; also a shooting target: arrows and bolts from held.ammo stick in it). **Boards and braces (11.2):** build.window_boards_bay fits a buildings.js window bay from outside (bay-local coordinates, planks just proud of the frame); build.door_brace is a bar across the inside of a door 1.2 m wide (brackets at x = +-0.55, the door face at z = 0, a prop leaning to the floor at z = 0.75). **Siphon (11.5):** items.fuel_siphon: a jerry can with its hose rising towards +Z; set it beside a car with the hose end at vehicleRig[name].fuelCap (the pickup) or the car's rear flank (about 0.8 m up). `items.paper_map` is the map pickup on the ground (11.8).

**Furniture size (11.6):** furnitureSize[name] = [class, kg]. small: carried in front by one person at walking speed less 10%; medium: in front, speed less 30%, no running; large: speed less 50%, no running or jumping, and two survivors carry it at less 25% each (the survivor clip carry_furniture holds all three). `chair` small 6 kg, `table` medium 20 kg, `sofa` large 45 kg, `bed` large 50 kg, `wardrobe` large 60 kg, `fridge` large 70 kg, `stove` large 55 kg, `kitchen_counter` large 40 kg, `bookshelf` medium 30 kg, `desk` medium 28 kg, `tv` small 12 kg, `floor_lamp` small 4 kg, `toilet` medium 25 kg, `bathtub` large 70 kg, `crate` small 10 kg, `locker` medium 35 kg, `pew` large 40 kg, `shop_shelf` medium 30 kg.

 `moving` lists other parts that open (doors, lids) and their hinges.

| Category | Model | Tris, verts, welded |
| --- | --- | --- |
| items | `can` | 32 / 60 / 24 |
| items | `bottle` | 56 / 108 / 32 |
| items | `water_jug` | 36 / 72 / 24 |
| items | `medkit` | 28 / 56 / 24 |
| items | `bandage` | 20 / 36 / 12 |
| items | `pills` | 32 / 60 / 20 |
| items | `canned_food` | 32 / 60 / 24 |
| items | `fuel_can` | 30 / 64 / 21 |
| items | `car_battery` | 48 / 96 / 28 |
| items | `toolkit` | 36 / 72 / 20 |
| items | `flashlight` | 34 / 64 / 22 |
| items | `radio` | 26 / 52 / 20 |
| items | `crowbar` | 24 / 48 / 14 |
| items | `baseball_bat` | 32 / 60 / 18 |
| items | `axe` | 24 / 48 / 16 |
| items | `duct_tape` | 20 / 36 / 12 |
| items | `rope` | 20 / 36 / 12 |
| items | `scrap` | 12 / 34 / 8 |
| items | `planks` | 36 / 72 / 16 |
| items | `spare_tyre` | 56 / 96 / 32 |
| items | `engine_parts` | 44 / 84 / 28 |
| items | `generator` | 60 / 120 / 40 |
| items | `backpack` | 36 / 72 / 24 |
| items | `cardboard_box` | 14 / 28 / 12 |
| items | `stone` | 12 / 34 / 8 |
| items | `flare` | 40 / 72 / 24 |
| items | `lure` | 44 / 84 / 28 |
| items | `batteries` | 108 / 198 / 72 |
| items | `matches` | 14 / 28 / 12 |
| items | `nails` | 30 / 72 / 23 |
| items | `seeds` | 14 / 28 / 12 |
| items | `antibiotics` | 14 / 28 / 12 |
| items | `painkillers` | 32 / 60 / 20 |
| items | `vitamins` | 32 / 60 / 20 |
| items | `soda_can` | 36 / 66 / 24 |
| items | `granola_bar` | 14 / 28 / 12 |
| items | `rice_bag` | 14 / 32 / 12 |
| items | `blanket` | 24 / 48 / 16 |
| items | `books` | 48 / 96 / 32 |
| items | `cloth_scraps` | 13 / 37 / 11 |
| items | `sticks` | 24 / 48 / 16 |
| items | `tin_can` | 32 / 68 / 18 |
| items | `berries` | 72 / 144 / 48 |
| items | `rain_jacket` | 26 / 52 / 20 |
| items | `lantern` | 90 / 184 / 61 |
| items | `ammo_box` | 38 / 76 / 28 |
| items | `pistol` | 24 / 48 / 16 |
| items | `scrap_wood` | 54 / 112 / 37 |
| items | `lumber` | 38 / 76 / 28 |
| items | `nails_handful` | 84 / 168 / 56 |
| items | `steel_beam` | 38 / 76 / 28 |
| items | `rebar_bundle` | 84 / 168 / 64 |
| items | `sheet_metal` | 122 / 244 / 84 |
| items | `concrete_chunk` | 48 / 116 / 32 |
| items | `brick` | 16 / 32 / 16 |
| items | `brick_stack` | 60 / 120 / 40 |
| items | `glass_sheet` | 14 / 30 / 14 |
| items | `wire_coil` | 82 / 164 / 64 |
| items | `plasterboard_scrap` | 14 / 28 / 12 |
| items | `tyre_loose` | 84 / 144 / 48 |
| items | `tyre_loose_flat` | 64 / 108 / 36 |
| items | `fuel_siphon` | 60 / 120 / 44 |
| items | `paper_map` | 17 / 35 / 19 |
| furniture | `chair` | 72 / 144 / 46 |
| furniture | `table` | 60 / 120 / 40 |
| furniture | `sofa` | 120 / 240 / 76 |
| furniture | `bed` | 60 / 120 / 40 |
| furniture | `wardrobe` | 38 / 76 / 28 |
| furniture | `fridge` | 38 / 76 / 28 |
| furniture | `stove` | 86 / 172 / 54 |
| furniture | `kitchen_counter` | 38 / 76 / 28 |
| furniture | `bookshelf` | 72 / 144 / 48 |
| furniture | `desk` | 72 / 144 / 48 |
| furniture | `tv` | 26 / 52 / 20 |
| furniture | `floor_lamp` | 44 / 88 / 32 |
| furniture | `toilet` | 36 / 72 / 24 |
| furniture | `bathtub` | 24 / 48 / 16 |
| furniture | `crate` | 16 / 32 / 16 |
| furniture | `locker` | 30 / 60 / 28 |
| furniture | `pew` | 48 / 96 / 30 |
| furniture | `shop_shelf` | 204 / 408 / 136 |
| street | `street_lamp` | 60 / 120 / 40 |
| street | `traffic_light` | 30 / 60 / 28 |
| street | `hydrant` | 70 / 136 / 45 |
| street | `trash_bin` | 24 / 48 / 16 |
| street | `dumpster` | 74 / 148 / 52 |
| street | `bench` | 72 / 144 / 48 |
| street | `bus_stop` | 96 / 192 / 64 |
| street | `mailbox` | 30 / 64 / 21 |
| street | `jersey_barrier` | 14 / 28 / 12 |
| street | `traffic_cone` | 26 / 56 / 21 |
| street | `tyre_pile` | 112 / 192 / 64 |
| street | `stop_sign` | 42 / 76 / 28 |
| street | `picket_fence` | 96 / 240 / 76 |
| street | `chainlink_fence` | 48 / 96 / 32 |
| street | `sandbags` | 72 / 144 / 48 |
| street | `power_pole` | 92 / 180 / 60 |
| street | `newspaper_box` | 14 / 28 / 12 |
| street | `sign_speed` | 28 / 56 / 24 |
| street | `sign_one_way` | 27 / 55 / 23 |
| street | `sign_yield` | 28 / 60 / 20 |
| street | `street_name_post` | 40 / 80 / 32 |
| street | `parking_meter` | 32 / 68 / 25 |
| street | `bike_rack` | 156 / 312 / 104 |
| street | `phone_box` | 48 / 100 / 41 |
| street | `bollard` | 26 / 56 / 21 |
| street | `crash_barrier` | 50 / 100 / 36 |
| street | `manhole` | 34 / 60 / 28 |
| street | `road_centre_dash` | 2 / 4 / 4 |
| street | `road_stop_line` | 2 / 4 / 4 |
| street | `road_crossing` | 14 / 28 / 28 |
| street | `shop_awning` | 34 / 68 / 36 |
| street | `hanging_sign` | 50 / 100 / 36 |
| street | `satellite_dish` | 52 / 112 / 37 |
| street | `ac_unit` | 52 / 96 / 32 |
| street | `chimney` | 36 / 72 / 24 |
| street | `water_tank` | 122 / 240 / 89 |
| street | `roof_hatch` | 36 / 72 / 24 |
| street | `sign_no_parking` | 102 / 188 / 81 |
| street | `sign_no_entry` | 68 / 120 / 40 |
| street | `sign_stop_all_way` | 124 / 240 / 150 |
| street | `sign_pedestrian` | 42 / 80 / 48 |
| street | `sign_school` | 106 / 204 / 141 |
| street | `sign_deer` | 44 / 88 / 56 |
| street | `sign_curve` | 31 / 63 / 31 |
| street | `sign_crossroads` | 30 / 60 / 28 |
| street | `sign_slippery` | 34 / 68 / 36 |
| street | `sign_road_work` | 121 / 239 / 170 |
| street | `sign_detour` | 87 / 175 / 114 |
| street | `sign_dead_end` | 90 / 180 / 136 |
| street | `sign_hospital` | 42 / 84 / 36 |
| street | `sign_parking` | 32 / 64 / 29 |
| street | `sign_evacuation` | 121 / 235 / 153 |
| street | `sign_speed_25` | 114 / 228 / 174 |
| street | `sign_speed_35` | 112 / 224 / 172 |
| street | `sign_speed_55` | 114 / 228 / 174 |
| street | `sign_route` | 49 / 95 / 55 |
| street | `railroad_crossing_off` | 188 / 340 / 116 |
| street | `railroad_crossing_on` | 188 / 340 / 116 |
| street | `sign_gantry` | 263 / 527 / 324 |
| street | `lamp_cobra_off` | 50 / 104 / 36 |
| street | `lamp_cobra_on` | 50 / 104 / 36 |
| street | `lamp_double_off` | 76 / 152 / 52 |
| street | `lamp_double_on` | 76 / 152 / 52 |
| street | `lamp_ornate_off` | 102 / 204 / 63 |
| street | `lamp_ornate_on` | 102 / 204 / 63 |
| street | `lamp_mast_off` | 108 / 208 / 80 |
| street | `lamp_mast_on` | 108 / 208 / 80 |
| street | `lamp_wall_off` | 42 / 88 / 29 |
| street | `lamp_wall_on` | 42 / 88 / 29 |
| street | `traffic_mast_red` | 350 / 676 / 286 |
| street | `traffic_mast_amber` | 350 / 676 / 286 |
| street | `traffic_mast_green` | 350 / 676 / 286 |
| street | `traffic_mast_flash` | 350 / 676 / 286 |
| street | `traffic_mast_dark` | 350 / 676 / 286 |
| street | `traffic_span_red` | 528 / 1,008 / 364 |
| street | `traffic_span_amber` | 528 / 1,008 / 364 |
| street | `traffic_span_green` | 528 / 1,008 / 364 |
| street | `traffic_span_flash` | 528 / 1,008 / 364 |
| street | `traffic_span_dark` | 528 / 1,008 / 364 |
| street | `walk_signal_walk` | 50 / 96 / 48 |
| street | `walk_signal_stop` | 46 / 92 / 44 |
| street | `walk_signal_dark` | 60 / 116 / 68 |
| street | `flasher_off` | 46 / 88 / 32 |
| street | `flasher_on` | 46 / 88 / 32 |
| plants | `oak` | 164 / 348 / 96 |
| plants | `pine` | 52 / 120 / 36 |
| plants | `bush` | 54 / 120 / 33 |
| plants | `dead_tree` | 36 / 88 / 28 |
| plants | `grass_tuft` | 30 / 80 / 25 |
| plants | `rock` | 24 / 68 / 16 |
| plants | `autumn_oak` | 152 / 324 / 88 |
| plants | `birch` | 94 / 204 / 72 |
| plants | `willow` | 98 / 240 / 73 |
| plants | `stump` | 31 / 65 / 23 |
| plants | `cut_stump` | 66 / 120 / 48 |
| plants | `fallen_log` | 56 / 104 / 37 |
| plants | `fern` | 54 / 144 / 21 |
| plants | `flowers_red` | 150 / 324 / 105 |
| plants | `flowers_yellow` | 150 / 324 / 105 |
| plants | `flowers_purple` | 150 / 324 / 105 |
| plants | `reeds` | 78 / 184 / 59 |
| plants | `mushrooms` | 104 / 216 / 68 |
| plants | `bramble` | 118 / 272 / 57 |
| vehicles | `hatchback.body` | 246 / 492 / 220 |
| vehicles | `hatchback.bonnet` | 12 / 24 / 8 |
| vehicles | `hatchback.wheel` | 80 / 148 / 44 |
| vehicles | `hatchback.boot` | 12 / 24 / 8 |
| vehicles | `hatchback.damage.body_crumple_light` | 246 / 520 / 220 |
| vehicles | `hatchback.damage.body_crumple_heavy` | 246 / 518 / 220 |
| vehicles | `hatchback.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `hatchback.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `hatchback.damage.bonnet_buckled` | 26 / 60 / 18 |
| vehicles | `hatchback.damage.body_bumper_bent` | 258 / 516 / 224 |
| vehicles | `hatchback.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `hatchback.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `hatchback.damage.smoke` | 50 / 148 / 36 |
| vehicles | `hatchback.damage.fire` | 104 / 272 / 68 |
| vehicles | `sedan.body` | 244 / 488 / 216 |
| vehicles | `sedan.bonnet` | 12 / 24 / 8 |
| vehicles | `sedan.wheel` | 80 / 148 / 44 |
| vehicles | `sedan.boot` | 12 / 24 / 8 |
| vehicles | `sedan.damage.body_crumple_light` | 244 / 516 / 216 |
| vehicles | `sedan.damage.body_crumple_heavy` | 244 / 516 / 216 |
| vehicles | `sedan.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `sedan.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `sedan.damage.bonnet_buckled` | 26 / 60 / 16 |
| vehicles | `sedan.damage.body_bumper_bent` | 256 / 512 / 220 |
| vehicles | `sedan.damage.windscreen_cracked` | 16 / 32 / 24 |
| vehicles | `sedan.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `sedan.damage.smoke` | 50 / 148 / 36 |
| vehicles | `sedan.damage.fire` | 104 / 272 / 68 |
| vehicles | `wagon.body` | 242 / 484 / 212 |
| vehicles | `wagon.bonnet` | 12 / 24 / 8 |
| vehicles | `wagon.wheel` | 80 / 148 / 44 |
| vehicles | `wagon.damage.body_crumple_light` | 242 / 512 / 212 |
| vehicles | `wagon.damage.body_crumple_heavy` | 242 / 512 / 212 |
| vehicles | `wagon.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `wagon.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `wagon.damage.bonnet_buckled` | 26 / 60 / 19 |
| vehicles | `wagon.damage.body_bumper_bent` | 254 / 508 / 216 |
| vehicles | `wagon.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `wagon.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `wagon.damage.smoke` | 50 / 148 / 36 |
| vehicles | `wagon.damage.fire` | 104 / 272 / 68 |
| vehicles | `suv.body` | 242 / 484 / 212 |
| vehicles | `suv.bonnet` | 12 / 24 / 8 |
| vehicles | `suv.wheel` | 80 / 148 / 44 |
| vehicles | `suv.damage.body_crumple_light` | 242 / 512 / 212 |
| vehicles | `suv.damage.body_crumple_heavy` | 242 / 512 / 212 |
| vehicles | `suv.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `suv.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `suv.damage.bonnet_buckled` | 26 / 60 / 16 |
| vehicles | `suv.damage.body_bumper_bent` | 254 / 508 / 216 |
| vehicles | `suv.damage.windscreen_cracked` | 16 / 32 / 22 |
| vehicles | `suv.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `suv.damage.smoke` | 50 / 148 / 36 |
| vehicles | `suv.damage.fire` | 104 / 272 / 68 |
| vehicles | `offroader.body` | 242 / 484 / 212 |
| vehicles | `offroader.bonnet` | 12 / 24 / 8 |
| vehicles | `offroader.wheel` | 80 / 148 / 44 |
| vehicles | `offroader.damage.body_crumple_light` | 242 / 512 / 212 |
| vehicles | `offroader.damage.body_crumple_heavy` | 242 / 510 / 212 |
| vehicles | `offroader.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `offroader.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `offroader.damage.bonnet_buckled` | 26 / 60 / 16 |
| vehicles | `offroader.damage.body_bumper_bent` | 254 / 508 / 216 |
| vehicles | `offroader.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `offroader.damage.windscreen_missing` | 7 / 19 / 19 |
| vehicles | `offroader.damage.smoke` | 50 / 148 / 36 |
| vehicles | `offroader.damage.fire` | 104 / 272 / 68 |
| vehicles | `pickup.body` | 390 / 780 / 290 |
| vehicles | `pickup.bonnet` | 12 / 24 / 8 |
| vehicles | `pickup.wheel` | 80 / 148 / 44 |
| vehicles | `pickup.battery` | 36 / 72 / 20 |
| vehicles | `pickup.fuel_cap` | 20 / 36 / 12 |
| vehicles | `pickup.hub` | 20 / 36 / 12 |
| vehicles | `pickup.damage.body_crumple_light` | 390 / 808 / 290 |
| vehicles | `pickup.damage.body_crumple_heavy` | 390 / 810 / 290 |
| vehicles | `pickup.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `pickup.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `pickup.damage.bonnet_buckled` | 26 / 60 / 16 |
| vehicles | `pickup.damage.body_bumper_bent` | 414 / 828 / 298 |
| vehicles | `pickup.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `pickup.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `pickup.damage.smoke` | 50 / 148 / 36 |
| vehicles | `pickup.damage.fire` | 104 / 272 / 68 |
| vehicles | `pickup.door_l` | 48 / 96 / 32 |
| vehicles | `pickup.door_gap` | 24 / 48 / 16 |
| vehicles | `crew_pickup.body` | 374 / 748 / 290 |
| vehicles | `crew_pickup.bonnet` | 12 / 24 / 8 |
| vehicles | `crew_pickup.wheel` | 80 / 148 / 44 |
| vehicles | `crew_pickup.damage.body_crumple_light` | 374 / 776 / 290 |
| vehicles | `crew_pickup.damage.body_crumple_heavy` | 374 / 778 / 290 |
| vehicles | `crew_pickup.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `crew_pickup.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `crew_pickup.damage.bonnet_buckled` | 26 / 60 / 16 |
| vehicles | `crew_pickup.damage.body_bumper_bent` | 398 / 796 / 298 |
| vehicles | `crew_pickup.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `crew_pickup.damage.windscreen_missing` | 7 / 19 / 19 |
| vehicles | `crew_pickup.damage.smoke` | 50 / 148 / 36 |
| vehicles | `crew_pickup.damage.fire` | 104 / 272 / 68 |
| vehicles | `flatbed.body` | 438 / 876 / 330 |
| vehicles | `flatbed.bonnet` | 12 / 24 / 8 |
| vehicles | `flatbed.wheel` | 80 / 148 / 44 |
| vehicles | `flatbed.damage.body_crumple_light` | 438 / 904 / 330 |
| vehicles | `flatbed.damage.body_crumple_heavy` | 438 / 906 / 330 |
| vehicles | `flatbed.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `flatbed.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `flatbed.damage.bonnet_buckled` | 26 / 60 / 16 |
| vehicles | `flatbed.damage.body_bumper_bent` | 462 / 924 / 338 |
| vehicles | `flatbed.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `flatbed.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `flatbed.damage.smoke` | 50 / 148 / 36 |
| vehicles | `flatbed.damage.fire` | 104 / 272 / 68 |
| vehicles | `van.body` | 202 / 404 / 180 |
| vehicles | `van.bonnet` | 12 / 24 / 8 |
| vehicles | `van.wheel` | 80 / 148 / 44 |
| vehicles | `van.damage.body_crumple_light` | 202 / 432 / 180 |
| vehicles | `van.damage.body_crumple_heavy` | 202 / 462 / 180 |
| vehicles | `van.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `van.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `van.damage.bonnet_buckled` | 26 / 60 / 17 |
| vehicles | `van.damage.body_bumper_bent` | 226 / 452 / 188 |
| vehicles | `van.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `van.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `van.damage.smoke` | 50 / 148 / 36 |
| vehicles | `van.damage.fire` | 104 / 272 / 68 |
| vehicles | `box_truck.body` | 294 / 588 / 232 |
| vehicles | `box_truck.bonnet` | 12 / 24 / 8 |
| vehicles | `box_truck.wheel` | 80 / 148 / 44 |
| vehicles | `box_truck.damage.body_crumple_light` | 294 / 614 / 232 |
| vehicles | `box_truck.damage.body_crumple_heavy` | 294 / 620 / 232 |
| vehicles | `box_truck.damage.bonnet_crumple_light` | 12 / 28 / 8 |
| vehicles | `box_truck.damage.bonnet_crumple_heavy` | 12 / 28 / 8 |
| vehicles | `box_truck.damage.bonnet_buckled` | 26 / 60 / 16 |
| vehicles | `box_truck.damage.body_bumper_bent` | 318 / 636 / 240 |
| vehicles | `box_truck.damage.windscreen_cracked` | 16 / 32 / 20 |
| vehicles | `box_truck.damage.windscreen_missing` | 7 / 19 / 18 |
| vehicles | `box_truck.damage.smoke` | 50 / 148 / 36 |
| vehicles | `box_truck.damage.fire` | 104 / 272 / 68 |
| vehicles | `hatchback_wreck.body` | 244 / 488 / 216 |
| vehicles | `hatchback_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `hatchback_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `hatchback_burnt.body` | 244 / 488 / 216 |
| vehicles | `hatchback_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `hatchback_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `sedan_wreck.body` | 242 / 484 / 212 |
| vehicles | `sedan_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `sedan_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `sedan_burnt.body` | 242 / 484 / 212 |
| vehicles | `sedan_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `sedan_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `wagon_wreck.body` | 242 / 484 / 212 |
| vehicles | `wagon_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `wagon_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `wagon_burnt.body` | 242 / 484 / 212 |
| vehicles | `wagon_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `wagon_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `suv_wreck.body` | 242 / 484 / 212 |
| vehicles | `suv_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `suv_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `suv_burnt.body` | 242 / 484 / 212 |
| vehicles | `suv_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `suv_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `offroader_wreck.body` | 242 / 484 / 212 |
| vehicles | `offroader_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `offroader_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `offroader_burnt.body` | 242 / 484 / 212 |
| vehicles | `offroader_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `offroader_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `pickup_wreck.body` | 390 / 780 / 290 |
| vehicles | `pickup_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `pickup_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `pickup_wreck.door_l` | 48 / 96 / 32 |
| vehicles | `pickup_wreck.door_gap` | 24 / 48 / 16 |
| vehicles | `pickup_burnt.body` | 390 / 780 / 290 |
| vehicles | `pickup_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `pickup_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `pickup_burnt.door_l` | 48 / 96 / 32 |
| vehicles | `pickup_burnt.door_gap` | 24 / 48 / 16 |
| vehicles | `crew_pickup_wreck.body` | 374 / 748 / 290 |
| vehicles | `crew_pickup_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `crew_pickup_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `crew_pickup_burnt.body` | 374 / 748 / 290 |
| vehicles | `crew_pickup_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `crew_pickup_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `flatbed_wreck.body` | 438 / 876 / 330 |
| vehicles | `flatbed_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `flatbed_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `flatbed_burnt.body` | 438 / 876 / 330 |
| vehicles | `flatbed_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `flatbed_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `van_wreck.body` | 202 / 404 / 180 |
| vehicles | `van_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `van_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `van_burnt.body` | 202 / 404 / 180 |
| vehicles | `van_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `van_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `box_truck_wreck.body` | 294 / 588 / 232 |
| vehicles | `box_truck_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `box_truck_wreck.wheel` | 80 / 148 / 44 |
| vehicles | `box_truck_burnt.body` | 294 / 588 / 232 |
| vehicles | `box_truck_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `box_truck_burnt.wheel` | 20 / 36 / 12 |
| garden | `rain_barrel` | 120 / 228 / 84 |
| garden | `garden_plot` | 60 / 120 / 40 |
| garden | `garden_sprouting` | 108 / 288 / 54 |
| garden | `garden_growing` | 162 / 360 / 99 |
| garden | `garden_ripe` | 378 / 792 / 243 |
| containers | `cupboard` | 84 / 168 / 52 |
| containers | `cupboard_searched` | 72 / 144 / 48 |
| containers | `wardrobe` | 72 / 144 / 44 |
| containers | `wardrobe_searched` | 84 / 168 / 56 |
| containers | `kitchen_drawers` | 96 / 192 / 64 |
| containers | `kitchen_drawers_searched` | 120 / 240 / 80 |
| containers | `filing_cabinet` | 108 / 216 / 72 |
| containers | `filing_cabinet_searched` | 156 / 312 / 104 |
| containers | `medicine_cabinet` | 96 / 192 / 64 |
| containers | `medicine_cabinet_searched` | 72 / 144 / 48 |
| containers | `glove_box` | 36 / 72 / 24 |
| containers | `glove_box_searched` | 35 / 71 / 24 |
| containers | `car_boot` | 48 / 96 / 32 |
| containers | `car_boot_searched` | 48 / 96 / 32 |
| containers | `toolbox` | 36 / 72 / 20 |
| containers | `toolbox_searched` | 36 / 72 / 22 |
| containers | `till` | 50 / 100 / 36 |
| containers | `till_searched` | 74 / 148 / 52 |
| containers | `bin` | 24 / 48 / 16 |
| containers | `bin_searched` | 48 / 96 / 32 |
| containers | `shelf_stack` | 204 / 408 / 136 |
| containers | `shelf_stack_searched` | 120 / 240 / 80 |
| containers | `locker` | 42 / 84 / 36 |
| containers | `locker_searched` | 48 / 96 / 32 |
| containers | `duffel_bag` | 32 / 60 / 20 |
| containers | `duffel_bag_searched` | 58 / 112 / 40 |
| doors | `house_door` | 32 / 64 / 32 |
| doors | `shop_door` | 36 / 72 / 24 |
| doors | `garage_door` | 68 / 136 / 56 |
| doors | `window_shutter` | 26 / 52 / 36 |
| doors | `fridge_door` | 48 / 96 / 32 |
| doors | `cupboard_door` | 24 / 48 / 16 |
| doors | `chest_lid` | 24 / 48 / 16 |
| doors | `crate_lid` | 16 / 32 / 16 |
| build | `barricade` | 220 / 440 / 184 |
| build | `barricade_damaged` | 165 / 331 / 139 |
| build | `barricade_nearly_gone` | 82 / 164 / 68 |
| build | `window_boards` | 112 / 224 / 96 |
| build | `reinforced_door` | 136 / 272 / 96 |
| build | `campfire` | 98 / 200 / 65 |
| build | `campfire_out` | 88 / 168 / 56 |
| build | `fire_pit` | 206 / 506 / 137 |
| build | `lantern_post` | 78 / 160 / 53 |
| build | `generator_off` | 128 / 252 / 84 |
| build | `generator_running` | 134 / 268 / 89 |
| build | `compost_bin` | 84 / 176 / 52 |
| build | `water_filter` | 126 / 228 / 84 |
| build | `drying_rack` | 144 / 288 / 96 |
| build | `cooking_spit` | 166 / 348 / 105 |
| build | `tool_bench` | 168 / 336 / 112 |
| build | `workshop_table` | 108 / 216 / 72 |
| build | `dropped_pack` | 38 / 84 / 28 |
| build | `grave_marker` | 48 / 100 / 32 |
| build | `map_flag` | 24 / 48 / 16 |
| build | `claim_sign` | 90 / 180 / 68 |
| build | `claim_flag` | 52 / 104 / 40 |
| build | `custom_bed` | 312 / 636 / 190 |
| build | `reinforce_planks` | 276 / 552 / 184 |
| build | `reinforce_planks_damaged` | 216 / 432 / 144 |
| build | `reinforce_planks_nearly_gone` | 144 / 288 / 96 |
| build | `reinforce_sheet` | 168 / 336 / 112 |
| build | `reinforce_sheet_damaged` | 252 / 508 / 162 |
| build | `reinforce_sheet_nearly_gone` | 133 / 271 / 89 |
| build | `reinforce_mesh` | 288 / 576 / 192 |
| build | `reinforce_mesh_damaged` | 228 / 456 / 152 |
| build | `reinforce_mesh_nearly_gone` | 132 / 264 / 88 |
| build | `door_brace` | 96 / 192 / 64 |
| build | `window_boards_bay` | 180 / 360 / 120 |
| shop | `gun_counter` | 180 / 360 / 116 |
| shop | `gun_rack` | 420 / 840 / 280 |
| shop | `ammo_shelf` | 384 / 768 / 256 |
| shop | `target_poster` | 204 / 344 / 120 |

## held (`assets/shaped/held.js`, version 2)

Weapons: the grip is at the origin, the long side runs along +Z with the business end at +Z, +Y is the weapon's "up"
(the edge or face that leads a swing). Each weapon comes in three states: new, worn (condition under a quarter: bent,
chipped, taped) and broken (the stub left in the hand when it snaps).
  - In the third-person hand: put the weapon's origin on GRIP (a point in the survivor pack's model space, carried by
    hand_r) with the weapon's axes as the survivor's axes at rest; the hand bone then carries it through every clip.
  - On the ground: turn the weapon by ground.roll degrees about Z, then ground.yaw about Y, and lift it by ground.lift.
  - First person: put the weapon's origin on fp.hold.weapon (position and rotation) in view space.
First-person arms (view space): the eye at the origin looking along +Z, +Y up, the viewer's right is -X (the same
handedness as every model). Colour slots SKIN and SLEEVE (whatever the survivor wears on top: outer, else top).

**Grip:** Weapon origin goes here (survivor pack model space, rest pose); weapon axes = survivor axes at rest, so it points forward (+Z) out of the fist. Position [-0.212, 0.837, 0.026] on `hand_r`. Two-handed: `hockey_stick`, `garden_rake`, `broom_spear`, `hunting_rifle`, `pump_shotgun`, `double_barrel`, `carbine`, `crossbow` (Two-handed weapons (hockey stick, garden rake, broom spear): same grip; the left hand reaches to the weapon at offhandAt metres along +Z when the clip allows.) **States:** new above a quarter condition, worn under a quarter, broken when it snaps (the stub stays in the hand until dropped). **First person:** the weapon goes at `fpWeapon` ([-0.2, -0.26, 0.45], rotation [-38, 10, 0] degrees) with the arms in `models.fp.hold`; long guns use `fpLong` with `models.fp.shoulder` when carried and `fpAim` with `models.fp.aim` when aiming.

**Guns and bows** (version 2): `pistol`, `revolver`, `hunting_rifle`, `pump_shotgun`, `double_barrel`, `carbine`, `flare_gun`, `recurve_bow`, `crossbow`. Guns have new and worn (under a quarter condition: rust and tape) plus one reload state each (revolver open, hunting_rifle bolt_open, pump_shotgun pumped, double_barrel open, carbine empty, crossbow loaded, recurve_bow drawn) and a flash at INFO.muzzle. Long guns: right fist on the grip, left fist at offhandAt; first person uses fpLong when carried and fpAim when aiming. Casings from models.cases go to +X. Each gun's `info` gives its `muzzle`, the `ammo` it takes and how many it `holds`; long guns give `offhandAt`.

**Ammo** (`models.ammo`, on the ground like props: origin at the centre of the base): `pistol_round` (fits pistol and revolver), `rifle_round` (fits hunting rifle and carbine), `shotgun_shell` (fits pump and double-barrel shotguns), `pistol_box` (20 pistol rounds), `rifle_box` (20 rifle rounds), `shotgun_box` (10 shells), `pistol_magazine` (full pistol magazine (pick up = 12 rounds)), `carbine_magazine` (full carbine magazine (20 rounds)), `ammo_can` (military can: a large mixed find (police station, gun shop, army truck)), `flare_shells` (four flare shells), `arrow` (one arrow, can be picked back up after a shot), `arrow_bundle` (five arrows), `quiver` (worn on the back or found: holds arrows), `crossbow_bolt` (one bolt, reusable), `loose_pile` (a few mixed rounds spilled on the ground (searched drawers, dead survivors)), `flare_shell` (one flare shell (loose, and the one in the hand while loading)), `arrow_stuck` (an arrow that hit: tip buried, shaft out along +Z from a surface at z = 0 (turn +Z to the hit surface normal); picked up as one arrow), `bolt_stuck` (the same for a crossbow bolt). `models.cases` are the casings thrown out on a shot (`pistol_case`, `rifle_case`, `shotgun_hull`).

**Reloads in first person (11.4):** fpReload[name]: right and left arms (view space, like fp), the weapon (name, state, pos, rot in degrees, three.js Euler XYZ) and sometimes an item (a model from held.ammo in the left hand, same pos/rot rules). Play the poses of a gun in order and blend between them: pistol_mag_out -> pistol_mag_in; carbine_mag_out -> carbine_mag_in; shotgun_load (repeat) -> shotgun_rack; double_open; rifle_bolt (repeat per round); revolver_load (repeat); flare_open; bow_nock -> bow_draw; crossbow_cock. The note on each says what happens. Poses: `pistol_mag_out` (tip the pistol in, the left hand comes up with a full magazine), `pistol_mag_in` (the left fist slaps the magazine up into the grip; then go back to aim (state new)), `carbine_mag_out` (cant the carbine, the empty magazine falls, the left hand brings a full one), `carbine_mag_in` (the magazine goes into the well; then state new and back to fpLong), `shotgun_rack` (pull the fore-end back (state pumped) and push it forward again (state new): 0.35 s), `shotgun_load` (the gun rolled on its side; the left thumb pushes a shell into the port, one per 0.5 s), `double_open` (broken open; the left hand drops two shells into the chambers), `rifle_bolt` (the right hand works the bolt (state bolt_open, then new): 0.6 s per round), `revolver_load` (cylinder swung out towards the middle; the left hand loads rounds one at a time), `flare_open` (broken open; the left hand slides a flare shell into the barrel), `bow_nock` (the bow held upright in the left fist; the right hand nocks an arrow on the string), `bow_draw` (drawn: left arm straight, right fist at the cheek; release to fire), `crossbow_cock` (nose down (a foot in the stirrup), both hands haul the string back; then state loaded and back to fpLong). New weapon states for them: `pistol.empty` (magazine out, slide back) and `flare_gun.open`.

| Model | Tris, verts, welded | Notes |
| --- | --- | --- |
| `weapons.cricket_bat.new` | 34 / 64 / 24 | flat swing; length 0.85 m; ground: roll 0, lift 0.012 |
| `weapons.cricket_bat.worn` | 61 / 119 / 55 |  |
| `weapons.cricket_bat.broken` | 38 / 84 / 27 |  |
| `weapons.frying_pan.new` | 56 / 104 / 40 | flat swing; lies face up; length 0.55 m; ground: roll 0, lift 0.02 |
| `weapons.frying_pan.worn` | 58 / 110 / 46 |  |
| `weapons.frying_pan.broken` | 18 / 40 / 13 |  |
| `weapons.hockey_stick.new` | 36 / 72 / 24 | flat swing; two hands; length 1.04 m; ground: roll 90, lift 0.016 |
| `weapons.hockey_stick.worn` | 73 / 147 / 63 |  |
| `weapons.hockey_stick.broken` | 30 / 72 / 23 |  |
| `weapons.wrench.new` | 60 / 120 / 40 | overhead chop; length 0.48 m; ground: roll 0, lift 0.015 |
| `weapons.wrench.worn` | 63 / 127 / 47 |  |
| `weapons.wrench.broken` | 18 / 40 / 13 |  |
| `weapons.garden_rake.new` | 72 / 176 / 56 | thrust; two hands; tines face down (-Y); length 0.95 m; ground: roll 0, lift 0.02 |
| `weapons.garden_rake.worn` | 84 / 200 / 68 |  |
| `weapons.garden_rake.broken` | 30 / 72 / 23 |  |
| `weapons.broom_spear.new` | 48 / 96 / 40 | thrust; two hands; length 1.08 m; ground: roll 0, lift 0.013 |
| `weapons.broom_spear.worn` | 60 / 120 / 52 |  |
| `weapons.broom_spear.broken` | 30 / 72 / 23 |  |
| `weapons.umbrella.new` | 106 / 216 / 57 | flat swing; closed; length 0.83 m; ground: roll 0, lift 0.045 |
| `weapons.umbrella.worn` | 112 / 240 / 62 |  |
| `weapons.umbrella.broken` | 54 / 112 / 29 |  |
| `weapons.crowbar.new` | 36 / 72 / 16 | overhead chop; length 0.73 m; ground: roll 0, lift 0.012 |
| `weapons.crowbar.worn` | 38 / 76 / 20 |  |
| `weapons.crowbar.broken` | 18 / 40 / 9 |  |
| `weapons.baseball_bat.new` | 76 / 144 / 42 | flat swing; length 0.84 m; ground: roll 0, lift 0.034 |
| `weapons.baseball_bat.worn` | 100 / 192 / 66 |  |
| `weapons.baseball_bat.broken` | 38 / 84 / 27 |  |
| `weapons.axe.new` | 36 / 72 / 24 | overhead chop; blade up (+Y); length 0.75 m; ground: roll 0, lift 0.015 |
| `weapons.axe.worn` | 63 / 127 / 55 |  |
| `weapons.axe.broken` | 30 / 72 / 23 |  |
| `weapons.slingshot.new` | 82 / 164 / 52 | held upright, forks up (+Y), shot goes along +Z; drawn is the pulled pose; length 0.2 m; ground: roll 90, lift 0.012 |
| `weapons.slingshot.drawn` | 82 / 164 / 52 |  |
| `weapons.pistol.new` | 72 / 144 / 48 | barrel along +Z; flash sits at the muzzle (0, 0.03, 0.155), show it one or two frames, scale 0.8 to 1.3 at random; shell is ejected to +X; length 0.2 m; ground: roll 90, lift 0.015 |
| `weapons.pistol.flash` | 15 / 37 / 15 |  |
| `weapons.pistol.shell` | 20 / 36 / 12 |  |
| `weapons.pistol.empty` | 74 / 148 / 52 |  |
| `weapons.revolver.new` | 124 / 240 / 80 | one hand; open = cylinder swung out to +X for reloading; no shell is thrown; length 0.3 m; ground: roll 90, lift 0.03 |
| `weapons.revolver.worn` | 134 / 260 / 92 |  |
| `weapons.revolver.open` | 136 / 264 / 88 |  |
| `weapons.revolver.flash` | 15 / 37 / 15 |  |
| `weapons.hunting_rifle.new` | 212 / 416 / 132 | two hands, butt to the shoulder; bolt_open between shots (throws a rifle_case to +X); scope line is y = 0.086; length 1.1 m; ground: roll 90, lift 0.03 |
| `weapons.hunting_rifle.worn` | 232 / 456 / 156 |  |
| `weapons.hunting_rifle.bolt_open` | 224 / 440 / 140 |  |
| `weapons.hunting_rifle.flash` | 15 / 37 / 15 |  |
| `weapons.pump_shotgun.new` | 144 / 280 / 92 | two hands; pumped = fore-end pulled back (throws a shotgun_hull to +X); length 1.04 m; ground: roll 90, lift 0.03 |
| `weapons.pump_shotgun.worn` | 156 / 304 / 108 |  |
| `weapons.pump_shotgun.pumped` | 144 / 280 / 92 |  |
| `weapons.pump_shotgun.flash` | 15 / 37 / 15 |  |
| `weapons.double_barrel.new` | 132 / 256 / 84 | two hands; open = barrels tipped 28 degrees down about (0, 0.02, 0.15) for loading, two shotgun_hull fall out; length 1.06 m; ground: roll 90, lift 0.03 |
| `weapons.double_barrel.worn` | 142 / 276 / 96 |  |
| `weapons.double_barrel.open` | 132 / 256 / 84 |  |
| `weapons.double_barrel.flash` | 15 / 37 / 15 |  |
| `weapons.carbine.new` | 152 / 300 / 100 | two hands; empty = magazine out (show a carbine_magazine in the left hand while reloading); throws a rifle_case to +X each shot; length 1.0 m; ground: roll 90, lift 0.03 |
| `weapons.carbine.worn` | 170 / 336 / 120 |  |
| `weapons.carbine.empty` | 140 / 276 / 92 |  |
| `weapons.carbine.flash` | 15 / 37 / 15 |  |
| `weapons.flare_gun.new` | 80 / 156 / 52 | one hand; fires the flare that fx.flare_glow already draws; length 0.2 m; ground: roll 90, lift 0.03 |
| `weapons.flare_gun.worn` | 82 / 160 / 56 |  |
| `weapons.flare_gun.flash` | 12 / 32 / 10 |  |
| `weapons.flare_gun.open` | 82 / 160 / 56 |  |
| `weapons.recurve_bow.new` | 76 / 152 / 44 | held upright in the left hand in real life; here the grip is at the origin so it uses the same hand point. drawn = string at the cheek with an arrow nocked (silent, the aliens do not hear it); length 1.24 m; ground: roll 0, lift 0.02 |
| `weapons.recurve_bow.worn` | 85 / 171 / 55 |  |
| `weapons.recurve_bow.drawn` | 102 / 208 / 63 |  |
| `weapons.crossbow.new` | 160 / 316 / 108 | two hands; new = string forward (unloaded), loaded = string cocked with a bolt on the rail; silent; length 0.8 m; ground: roll 90, lift 0.03 |
| `weapons.crossbow.worn` | 170 / 336 / 120 |  |
| `weapons.crossbow.loaded` | 182 / 364 / 125 |  |
| `ammo.pistol_round` | 22 / 48 / 19 |  |
| `ammo.rifle_round` | 22 / 48 / 19 |  |
| `ammo.shotgun_shell` | 36 / 66 / 24 |  |
| `ammo.pistol_box` | 18 / 36 / 20 |  |
| `ammo.rifle_box` | 18 / 36 / 20 |  |
| `ammo.shotgun_box` | 18 / 36 / 20 |  |
| `ammo.pistol_magazine` | 24 / 48 / 16 |  |
| `ammo.carbine_magazine` | 24 / 48 / 16 |  |
| `ammo.ammo_can` | 50 / 100 / 36 |  |
| `ammo.flare_shells` | 128 / 224 / 80 |  |
| `ammo.arrow` | 26 / 56 / 19 |  |
| `ammo.arrow_bundle` | 138 / 296 / 103 |  |
| `ammo.quiver` | 70 / 140 / 52 |  |
| `ammo.crossbow_bolt` | 22 / 48 / 17 |  |
| `ammo.loose_pile` | 136 / 276 / 104 |  |
| `ammo.flare_shell` | 38 / 70 / 28 |  |
| `ammo.arrow_stuck` | 22 / 44 / 18 |  |
| `ammo.bolt_stuck` | 18 / 36 / 16 |  |
| `cases.pistol_case` | 20 / 36 / 12 |  |
| `cases.rifle_case` | 44 / 84 / 24 |  |
| `cases.shotgun_hull` | 32 / 60 / 24 |  |
| `map.folded` | 16 / 32 / 16 |  |
| `map.open` | 61 / 121 / 105 |  |
| `fp.hold.right` | 58 / 116 / 40 |  |
| `fp.hold.left` | 58 / 116 / 40 |  |
| `fp.empty.right` | 54 / 116 / 38 |  |
| `fp.empty.left` | 54 / 116 / 38 |  |
| `fp.reach.right` | 54 / 116 / 38 |  |
| `fp.reach.left` | 58 / 116 / 40 |  |
| `fp.shoulder.right` | 58 / 116 / 40 |  |
| `fp.shoulder.left` | 58 / 116 / 40 |  |
| `fp.aim.right` | 58 / 116 / 40 |  |
| `fp.aim.left` | 58 / 116 / 40 |  |
| `fpReload.pistol_mag_out.right` | 58 / 116 / 40 |  |
| `fpReload.pistol_mag_out.left` | 58 / 116 / 40 |  |
| `fpReload.pistol_mag_in.right` | 58 / 116 / 40 |  |
| `fpReload.pistol_mag_in.left` | 58 / 116 / 40 |  |
| `fpReload.carbine_mag_out.right` | 58 / 116 / 40 |  |
| `fpReload.carbine_mag_out.left` | 58 / 116 / 40 |  |
| `fpReload.carbine_mag_in.right` | 58 / 116 / 40 |  |
| `fpReload.carbine_mag_in.left` | 58 / 116 / 40 |  |
| `fpReload.shotgun_rack.right` | 58 / 116 / 40 |  |
| `fpReload.shotgun_rack.left` | 58 / 116 / 40 |  |
| `fpReload.shotgun_load.right` | 58 / 116 / 40 |  |
| `fpReload.shotgun_load.left` | 58 / 116 / 40 |  |
| `fpReload.double_open.right` | 58 / 116 / 40 |  |
| `fpReload.double_open.left` | 58 / 116 / 40 |  |
| `fpReload.rifle_bolt.right` | 58 / 116 / 40 |  |
| `fpReload.rifle_bolt.left` | 58 / 116 / 40 |  |
| `fpReload.revolver_load.right` | 58 / 116 / 40 |  |
| `fpReload.revolver_load.left` | 58 / 116 / 40 |  |
| `fpReload.flare_open.right` | 58 / 116 / 40 |  |
| `fpReload.flare_open.left` | 58 / 116 / 40 |  |
| `fpReload.bow_nock.right` | 58 / 116 / 40 |  |
| `fpReload.bow_nock.left` | 58 / 116 / 40 |  |
| `fpReload.bow_draw.right` | 58 / 116 / 40 |  |
| `fpReload.bow_draw.left` | 58 / 116 / 40 |  |
| `fpReload.crossbow_cock.right` | 58 / 116 / 40 |  |
| `fpReload.crossbow_cock.left` | 58 / 116 / 40 |  |

**Survivor clips** (in `survivor.js`, `clips`): `jump` (3), `airborne` (1), `land` (2), `hurt` (2), `drink` (3), `bandage` (3), `pickup` (3), `attack_chop` (3), `attack_thrust` (3), `attack_swing` (3), `sit` (1), `lean_wall` (1), `wave` (3), `carry_crate` (4), `carry_long` (1), `aim_long` (1), `carry_furniture` (4), `work_chop` (2), `fish` (2), `keep_watch` (2). Each clip is a list of frames; a frame maps bone to [x, y, z] degrees, turned about that bone's pivot on top of the rest pose, in the order X, then Y, then Z, with children carried along (forward kinematics). Axes are the pack's at rest: for a limb hanging down, negative X swings it forward and positive X back; for the spine, positive X bends forward; positive Z swings the left arm out, negative Z the right arm out (both are mirrored already). "root" is not a bone: it moves the pelvis by [x, y, z] metres. Bones not listed stay at rest. Suggested speed: jump 0.25 s for all three frames, land 0.3 s, hurt 0.25 s, drink 1.4 s, bandage 2 s looping the middle frames, pickup 0.7 s, attacks 0.45 s (wind-up, strike, follow-through). New in section 11: carry_long (a long gun held across the chest) and aim_long (shouldered); carry_furniture (arms out in front, 4 walking frames: put the carried piece at carryAt on spine_03); work_chop (2 frames, axe from held.js in the right hand, 0.9 s, looping, beside a stump or a log), fish (hold, cast; with parts.npc.fishing_rod), keep_watch (2 frames looking left and right with a hand shading the eyes, 3 s each). For carry_long and aim_long the gun sits on the usual grip and is then turned by heldTurn[clip] degrees about the grip (Euler XYZ as three.js: matrix Rx Ry Rz). heldTurn: {'carry_long': [0, 0, -90], 'aim_long': [52, 0, 0], 'work_chop': [0, 0, 0], 'fish': [0, 0, 0]}. carryAt: [0, 1.12, 0.42] on `spine_03` (centre of a carried furniture piece in model space at rest; it rides on spine_03. Scale small pieces 1, medium pieces stay 1 but sit 0.1 m lower.) Sling: a long gun not in use, slung across the back muzzle up over the left shoulder: put its grip here; its +Z (muzzle) points along forward and its +Y (top) along up; rot is the same turn as Euler degrees in the order three.js uses (XYZ: matrix Rx Ry Rz). At [0.0, 1.2, -0.15] on `spine_03`, rot [-90, 32, 0]. New npc pieces: `quiver` (worn on the back) and `fishing_rod`. Portraits of the six ready-made survivors for the survivors panel: `assets/ui/portraits/<look>.png` (256 by 256).

**NPC looks** (in `survivor.js`, `npcLooks`, version 7): `old_ranger` (wide hat, vest and a cane: the tall slow silhouette), `medic` (long pale coat, bun and a bag across the body), `kid_hoodie` (hood up, hands low: small and hunched), `farmer` (broad, dungarees and tall yellow boots), `drifter` (a wide poncho makes a triangle), `mechanic` (leather jacket and a crate carried in front). Six ready-made recruitable survivors. Build each from its creator choices as usual, add parts.worn[body][k] for every k in worn, and parts.npc[k] for every k in npc (wide_brim and hood_up replace the hat and hide hat:"hide" hair; crate is carried with the carry_crate clip; cane is held by hand_r). Clips sit, lean_wall, wave and carry_crate are in clips.

## fx (`assets/shaped/fx.js`, version 1)

Small pieces the game animates: each model is one to four pieces at about 1 m (sky pieces at unit size) with its origin at
the centre of its base, and notes[name] says how to scale, turn and fade it over its life. Glow pieces are drawn unlit.
Fading is the game's job (alpha or blending towards the fog colour); the shapes stay the same flat planes as every pack.
Sky pieces are billboards: turn them to face the camera and place them on the sky dome.

| Model | Tris, verts, welded | How to use it |
| --- | --- | --- |
| `effects.muzzle_flash` | 24 / 50 / 22 | At the muzzle, +Z along the barrel. Show 1-2 frames, random roll about Z, scale 0.8-1.3. Adds a short warm point light. |
| `effects.tracer` | 12 / 24 / 8 | A 1.2 m streak along +Z; stretch along Z with speed, fade over 0.1 s. |
| `effects.hit_spark` | 24 / 64 / 12 | Where a metal hit lands, +Y along the surface normal. Scale 0.6-1.0, fade over 0.15 s. |
| `effects.dust_puff` | 102 / 216 / 57 | Landing and heavy steps. Grow from 0.5 to 1.4 and fade over 0.6 s; rises 0.1 m. |
| `effects.step_dust` | 68 / 144 / 38 | A footstep on dry ground. Grow 0.6 to 1.2, fade over 0.4 s. |
| `effects.step_snow` | 68 / 144 / 38 | A footstep in snow. Grow 0.6 to 1.2, fade over 0.5 s. |
| `effects.step_splash` | 36 / 96 / 10 | A footstep in a puddle or shallow water. Rise and fall over 0.3 s. |
| `effects.water_splash` | 82 / 200 / 59 | Something falling in water. Scale with its size; rise 0.2 s, fall 0.3 s. |
| `effects.ripple` | 20 / 24 / 24 | A ring on the water surface (the inner disc hides the middle). Grow from 0.2 to 2 and fade over 1.2 s; rain makes many small ones. |
| `effects.flame_small` | 22 / 56 / 17 | A candle-sized flame (lantern, match). Flicker: scale Y 0.85-1.15 at random each 0.1 s. |
| `effects.flame_medium` | 22 / 56 / 17 | A campfire flame. Flicker: scale Y 0.8-1.2, sway the tip 5 degrees. |
| `effects.flame_large` | 30 / 76 / 23 | A burning car or building. Flicker as medium; add smoke_column above. |
| `effects.smoke_column` | 136 / 288 / 76 | Rising smoke, 4 m. Scroll upward and loop; scale 1-6 for a building fire; fade the top two pieces. |
| `effects.explosion_core` | 68 / 144 / 38 | The fireball. Grow 0.3 to 2.5 over 0.25 s, then darken to smoke and fade over 1 s. Glow. |
| `effects.explosion_ring` | 16 / 20 / 20 | The shockwave on the ground. Grow 0.5 to 6 over 0.4 s, fade. |
| `effects.explosion_debris` | 48 / 136 / 32 | Chunks thrown out: give each piece its own velocity and spin, then leave them as rubble. |
| `effects.flare_glow` | 20 / 24 / 24 | Billboard at a lit flare. Pulse 0.9-1.1, with a red point light; burns 60 s. |
| `effects.goo_splat` | 12 / 16 / 16 | Alien goo where a spit lands or an alien is hit. Stays 60 s, then fades. |
| `effects.glass_shards` | 6 / 18 / 18 | Broken window glass on the floor (also thrown out as small spinning pieces). Stays; walking on it is loud. |
| `effects.wood_chips` | 60 / 120 / 40 | Splinters from a wood hit or a broken barricade: thrown and spinning, then left on the ground. |
| `effects.concrete_dust` | 104 / 246 / 62 | A concrete, block or plaster hit: the cloud grows 0.4 to 1.6 and fades over 1.2 s, drifting up; the chips are thrown and left on the ground. |
| `effects.brick_bits` | 94 / 242 / 59 | A brick hit: the pieces are thrown and spin, then lie as rubble; the mortar puff grows to 1.2 and fades over 0.8 s. |
| `effects.metal_sparks` | 36 / 96 / 14 | A steel hit (frame, cladding, sheet metal): six streaks thrown out along their own direction, gravity on, gone in 0.3 s. Glow; a short white point light. |
| `effects.crash_burst` | 98 / 254 / 71 | A car hitting something: metal and paint bits and glass are thrown forward from the impact point and stay as debris; the dust grows 0.5 to 2.5 and fades over 1.5 s. Scale everything 1.5x for a heavy hit. |
| `effects.roof_splash` | 23 / 55 / 14 | Rain hitting a roof, a car or a hard floor: spawn many at random on surfaces in the rain, each grows 0.6 to 1.2 and fades in 0.15 s. Puddles and water use ripple instead. |
| `sky.moon_0` | 28 / 46 / 38 | Moon phase 0 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.moon_1` | 28 / 46 / 36 | Moon phase 1 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.moon_2` | 28 / 46 / 38 | Moon phase 2 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.moon_3` | 28 / 46 / 36 | Moon phase 3 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.moon_4` | 14 / 16 / 16 | Moon phase 4 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.moon_5` | 28 / 46 / 36 | Moon phase 5 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.moon_6` | 28 / 46 / 38 | Moon phase 6 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.moon_7` | 28 / 46 / 36 | Moon phase 7 of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard. |
| `sky.cloud_fair` | 204 / 432 / 114 | A fair-weather cloud, about 3 m at unit scale: scale 20-40, drift slowly. |
| `sky.cloud_overcast` | 182 / 394 / 103 | An overcast sheet, 6 m at unit scale: scale 40-80; many side by side make a lid of cloud. |
| `sky.cloud_storm` | 164 / 344 / 92 | A thunderhead with an anvil top, 4.4 m tall: scale 60-120 on the horizon. |
| `sky.rain_streak` | 4 / 8 / 8 | One raindrop streak, 0.5 m, two crossed planes. Fall 12 m/s, tilt with the wind. |
| `sky.snow_flake` | 10 / 12 / 12 | A snowflake billboard. Fall 1 m/s with a slow side-to-side drift. |
| `sky.lightning` | 12 / 24 / 16 | A 10 m bolt at unit scale: scale 30-80, show 2-4 frames with the screen flash. |
| `sky.aurora` | 48 / 96 / 54 | Faint curtains for the final-night event, 8 m wide at unit scale: scale 50-100 low on the north sky, sway slowly, draw at 30-50% strength. |

## ground (`assets/shaped/ground.js`, version 1)

Each material is a 2 m by 2 m tile: a flat base square in colour slot BASE and a few small shapes on top in DETAIL and DETAIL2
(tufts, pebbles, leaves, slab joints, road paint). Nothing crosses the tile's edge, so tiles repeat without seams.
How to use it: paint the smooth ground in BASE (the terrain already has a colour per area), then scatter the tile's small
shapes over each 2 m cell near the player, turned by a random quarter turn so the repeat does not show. seasons[material]
gives BASE, DETAIL and DETAIL2 for spring, summer, autumn and winter (snow lies on level ground in winter).
Decals (puddle, ice, crack, pothole, skid_marks) sit 1 cm above whatever they are on. The kerb is a real 15 cm kerb, 2 m long. kerb_strip: the road side is +Z (the gutter strip lies on the road), the pavement side -Z; tops at 15 cm. edges[kind]: a 2 m strip (x -1..1, z 0..0.5) laid along the border where this ground meets another, +Z towards this ground: a ragged band of its BASE colour and its small shapes thinning out towards the line. Colour it with seasons[the ground on the +Z side].

| Model | Tris, verts, welded |
| --- | --- |
| `tiles.road` | 31 / 49 / 49 |
| `tiles.road_centre` | 33 / 53 / 53 |
| `tiles.sidewalk` | 21 / 49 / 27 |
| `tiles.grass` | 146 / 364 / 118 |
| `tiles.dry_grass` | 86 / 228 / 74 |
| `tiles.dirt` | 70 / 168 / 64 |
| `tiles.gravel` | 170 / 480 / 116 |
| `tiles.mud` | 23 / 33 / 33 |
| `tiles.sand` | 44 / 118 / 40 |
| `tiles.water_edge` | 57 / 143 / 51 |
| `tiles.leaf_litter` | 34 / 68 / 68 |
| `tiles.snow` | 38 / 68 / 44 |
| `decals.puddle` | 12 / 16 / 16 |
| `decals.ice` | 11 / 17 / 17 |
| `decals.crack` | 8 / 16 / 16 |
| `decals.pothole` | 38 / 86 / 34 |
| `decals.skid_marks` | 8 / 16 / 16 |
| `kerb.kerb_strip` | 16 / 32 / 16 |
| `edges.grass` | 153 / 395 / 131 |
| `edges.snow` | 57 / 83 / 83 |
| `edges.gravel` | 153 / 419 / 107 |
| `edges.dirt` | 57 / 83 / 83 |
| `edges.sand` | 57 / 83 / 83 |

## walls (`assets/shaped/walls.js`, version 1)

For the 0.56 wall construction (art requests section 10.1, with the car holes of 10.5). Loaded on its own, so the game can bring it in when it switches to cell walls.

The module (docs/ART_REQUESTS.md section 10.1): studs every 0.5 m (a BAY, the build grid), CELLS of 0.25 m (half a bay) for
breaking, wall panels of 3.0 m (six bays), storeys 3.0 m (houses), 3.5 m (shops, offices, flats) and 4.5 m (industrial).
Wall-local coordinates: the wall runs along X, +Y up from the storey floor, +Z is the OUTSIDE face; the wall's centre line is z = 0.

Layers through a wall, outside to inside: outer skin (siding, brick, sheet metal, cladding, glass), sheathing (board),
FRAME (studs, plates, header...), inner skin (plasterboard). Each kind of wall lists its layers in kinds[...].layers with
their z range, so the game knows where every cell sits. Concrete and block walls are one thick layer with no frame.

What is in the pack:
  cells[material][state]   one 0.25 x 0.25 cell of a skin, centred on x = 0, y from 0 to 0.25, z centred on 0 (move it to its
                           layer's z). States: whole, cracked, gone (the torn edges left when it falls out, so the layer beneath
                           shows) and rubble (the pile it leaves on the floor, at y = 0). An inner-layer cell is turned half a
                           turn about Y so its painted face looks into the room.
  sticks[family][name]     the frame, one stick each, 1 m long along its axis (sticksInfo gives the axis and size): stretch it
                           along that axis to any length. whole and snapped (wood splinters, steel bends).
  sections[kind][height][state]   a tileable one-bay section (0.5 m wide, x from -0.25 to 0.25), all layers, four states:
                           whole, cracked, gone (outer skins holed, studs showing) and rubble (holed through, frame snapped,
                           pile on the floor). Whole runs of wall are one slab per layer, not cells, so a whole house stays cheap.
  openings[kind][door|window][intact|cracked|breached]   a three-bay module (1.5 m, x from -0.75 to 0.75) with a clear
                           opening of 1.0 m (x -0.5 to 0.5): doors 2.25 m tall, windows from 1.0 to 2.25 m. Includes its own
                           king and jack studs, header, sill and cripples; it replaces three sections. It stops at y = 2.5, the
                           same for every storey; openingTops[kind][height] is the rest of the module from 2.5 to the storey top.
  joints[kind][height][straight|corner|T|cross|end]   the pieces where walls meet (see jointInfo for where each sits).
  carHoles[kind].below + carHoles[kind][height]   the hole a car leaves when it drives through (10.5): a four-bay module
                           (2.0 m, x from -1 to 1), skins torn open up to about 1.5 m, studs snapped and pushed in, rubble
                           thrown into the room. Like openings it is cut at 2.5 m: below is the same for every storey, [height] is the rest.
  edges[kind][floor_edge|roof_edge]   height-free pieces at the top of a wall: the floor above meeting it, or the eaves.
  floors[family][state]    a 0.5 x 0.5 floor tile (joists or deck or slab), 0.3 m thick, top at y = 0.3; whole, cracked, gone,
                           rubble. stairs[family] is the frame round a 1.0 x 3.0 stair opening (top of floor at y = 0).
Colour slots: WALL (outside finish: siding, sheet metal, cladding), INNER (inside paint), TRIM (casings, corner boards, doors).

**Grid:** cell 0.25 m, bay 0.5 m, panel 3.0 m; storeys house 3.0 m, shop 3.5 m, office 3.5 m, community 3.5 m, industrial 4.5 m. framed walls: frame from 0 to height - 0.3, floor zone (rim joist, joist ends, subfloor) in the top 0.3 m; skins run the full height.

**Breaking:** Skins: whole -> cracked -> gone (the cell is removed; draw cells.<material>.gone at its edges so the hole is ragged and the next layer shows) -> rubble on the floor. The frame breaks last: snapped sticks. A breached wall is gone in every layer of a cell with the frame still up; when a stud snaps the cells it carried above become rubble.

**Openings:** replaces three sections; framed walls: it brings its own left stud, both king and jack studs, header, cripples and sill; the next section to its right supplies the stud at x = 0.75. intact, cracked (split door, cracked glass and skin), breached (door torn or splintered, glass gone, casing hanging, rubble, frame still standing).

**Joints:** `straight`: a 0.2 m filler, x -0.1..0.1; `corner`: outside corner at (-X, +Z); wall 1 continues along +X, wall 2 along -Z; `T`: through wall x -0.15..0.15; the branch wall leaves the inside face along -Z; `cross`: two inside walls crossing at the origin; `end`: a free wall end at x = -0.1, the wall continues along +X.

| Kind | Used for | Layers (outside to inside) | Storeys | Section whole / rubble (tris) | Door / window intact (tris) |
| --- | --- | --- | --- | --- | --- |
| `wood_siding` | houses, sheds, small shops | siding [0.085, 0.1], osb [0.07, 0.085], plaster [-0.0825, -0.07] | 3.0, 3.5 m | 156 / 334 | 422 / 542 |
| `wood_brick` | brick-faced houses | brick [0.085, 0.175], osb [0.07, 0.085], plaster [-0.0825, -0.07] | 3.0, 3.5 m | 156 / 334 | 422 / 542 |
| `lightsteel_sheet` | shops and flats | sheet [0.085, 0.095], cement [0.07, 0.085], plaster [-0.0825, -0.07] | 3.5 m | 160 / 370 | 472 / 650 |
| `steel_cladding` | warehouses, big stores, industrial | cladding [0.05, 0.065] | 4.5 m | 84 / 258 | 348 / 456 |
| `steel_curtain` | offices and shop fronts | glass [-0.005, 0.005] | 3.5, 4.5 m | 96 / 154 | 132 / 132 |
| `concrete_poured` | the biggest buildings, bunkers, car parks | concrete [-0.1, 0.1] | 3.0, 3.5, 4.5 m | 14 / 284 | 198 / 260 |
| `concrete_block` | garages, back walls, utility buildings | block [-0.1, 0.1] | 3.0, 3.5, 4.5 m | 48 / 290 | 238 / 318 |
| `concrete_brick` | brick-faced blocks of flats and civic buildings | brick [0.1, 0.19], block [-0.1, 0.1] | 3.5 m | 92 / 352 | 310 / 396 |

| Frame stick | Axis | Size at 1 m | Families |
| --- | --- | --- | --- |
| `stud` | y | [0.045, 1, 0.14] | wood, lightsteel |
| `plate` | x | [1, 0.045, 0.14] | wood, lightsteel |
| `blocking` | x | [1, 0.045, 0.14] | wood, lightsteel |
| `sill` | x | [1, 0.045, 0.14] | wood, lightsteel |
| `header` | x | [1, 0.235, 0.14] | wood, lightsteel |
| `rim_joist` | x | [1, 0.24, 0.045] | wood, lightsteel |
| `joist` | z | [0.045, 0.24, 1] | wood, lightsteel |
| `rafter` | z | [0.045, 0.19, 1] | wood, lightsteel |
| `corner_post` | y | [0.14, 1, 0.14] | wood, lightsteel |
| `t_backer` | y | [0.14, 1, 0.14] | wood, lightsteel |
| `column` | y | [0.3, 1, 0.3] | steel, concrete |
| `beam` | x | [1, 0.4, 0.18] | steel |
| `brace` | y | [0.08, 1, 0.012] | steel |
| `girt` | x | [1, 0.15, 0.1] | steel |
| `mullion` | y | [0.05, 1, 0.14] | steel |

Frame per kind: `wood_siding`: wood stick frame: studs every 0.5 m, bottom plate, double top plate, blocking at 1.2 m, rim zone in the top 0.3 m; `wood_brick`: wood stick frame: studs every 0.5 m, bottom plate, double top plate, blocking at 1.2 m, rim zone in the top 0.3 m; `lightsteel_sheet`: light steel studs (channel) in the same layout as the wood frame; `steel_cladding`: steel columns on a 6 m grid (sticks.steel.column), girts every 1.25 m from 1.0 m, a 0.25 m concrete curb; `steel_curtain`: aluminium mullion every bay, transoms at the sill, 1.0 m, the spandrel and the head; `concrete_poured`: none: the wall is one thick layer with rebar inside (shown when it breaks); `concrete_block`: none: the wall is one thick layer with rebar inside (shown when it breaks); `concrete_brick`: none: the wall is one thick layer with rebar inside (shown when it breaks).

## power (`assets/shaped/power.js`, version 1)

Every model has its origin at the centre of its base and faces +Z. Things that hang on a wall (breaker panel, outlet,
wall light) have their back at z = 0 and face +Z into the room; their mounting height is in the model. Lit parts are
glow pieces: windows, lamps, screens, status lights. Most things come as a pair: <name>_dead or _off, and _running or _on.
  Big pieces: power_plant (dead / running: turbine hall, boiler house, two stacks, transformer yard), substation (fenced),
  pole_transformer (a wooden pole with its can), pylon (a lattice tower with three arms a side).
  Inside: control_panel (dead / running), breaker_panel (closed / open / tripped), outlet and wall_light and ceiling_light (off / on).
  Portable: cable_box (off / on / overload), cable pieces, plug, battery_rack, battery_box, solar_portable, solar_roof.

**power_plant:** about 72 by 50 m with 55 m stacks; the running one has lit windows, red aviation lights and steam (move the steam pieces up and fade them, or replace them with fx.smoke_column in white). Put the control_panel inside the control building (the small block at the front left). **substation:** 14 by 10 m fenced yard with two transformers and a gantry; one per district. Hum when live. **pole_transformer:** a 10 m wooden pole: wires leave its crossarm along +Z and -Z at 9.4 m; string them pole to pole. **pylon:** 37 m lattice tower; wires leave each insulator along +Z and -Z at the arm tips (x = +-5.7, +-4.7, +-3.9). **breaker_panel:** hung on a house wall at 1.2 to 1.82 m. open shows two rows of breakers; tripped has one breaker flipped with a red flag and a red glow. **cable_box:** portable junction box: plug its lead (towards -X) into the breaker panel or a generator; four sockets on the front, status lamp on top: off, on (green), overload (red, sparks). **cable:** cable_straight is 1 m along X lying on the ground; cable_corner a quarter turn of radius 0.25 m from -X to -Z; cable_up runs along the ground from +Z to a wall at z = 0 and up its face to 1 m. Chain them; plug is the end. **solar:** solar_portable is a folding pair facing +Z with its own charge box; solar_roof is one 1.7 by 1.0 m panel on rails, tilted 25 degrees, for flat roofs. **lights:** outlet (at 0.3 m), wall_light (at 1.9 m) and ceiling_light (hangs 0.6 m from a ceiling at y = 0) come off and on; on has a glow piece, add a warm point light.

| Model | Tris, verts, welded |
| --- | --- |
| `power_plant_dead` | 2,399 / 4,735 / 1,585 |
| `power_plant_running` | 2,556 / 5,160 / 1,682 |
| `control_panel_dead` | 348 / 696 / 226 |
| `control_panel_running` | 348 / 696 / 226 |
| `substation` | 1,123 / 2,217 / 689 |
| `pole_transformer` | 306 / 582 / 201 |
| `pylon` | 882 / 1,744 / 469 |
| `breaker_panel_closed` | 49 / 99 / 35 |
| `breaker_panel_open` | 648 / 1,296 / 432 |
| `breaker_panel_tripped` | 660 / 1,320 / 440 |
| `outlet_off` | 96 / 192 / 64 |
| `outlet_on` | 96 / 192 / 64 |
| `wall_light_off` | 62 / 126 / 41 |
| `wall_light_on` | 62 / 126 / 41 |
| `ceiling_light_off` | 64 / 128 / 45 |
| `ceiling_light_on` | 64 / 128 / 45 |
| `cable_box_off` | 256 / 508 / 172 |
| `cable_box_on` | 256 / 508 / 172 |
| `cable_box_overload` | 282 / 576 / 192 |
| `cable_straight` | 8 / 16 / 8 |
| `cable_corner` | 32 / 64 / 24 |
| `cable_up` | 64 / 128 / 52 |
| `plug` | 56 / 112 / 40 |
| `battery_rack` | 400 / 800 / 272 |
| `battery_box` | 108 / 216 / 72 |
| `solar_portable` | 96 / 192 / 104 |
| `solar_roof` | 64 / 128 / 64 |

## world (`assets/shaped/world.js`, version 1)

Same rules as every pack: shaped pieces, flat colours, metres, Y up. Ground pieces lie on y = 0 and decals sit 1 cm above.
  roads       4 m by 4 m surface tiles (x and z from -2 to 2), each a BASE square with small shapes in DETAIL and DETAIL2;
              surfaceColours[kind] gives the three colours. Nothing crosses the tile edge, so tiles repeat without seams.
  markings    road paint as decals, along +Z (the direction of travel), centred on x = 0 unless said otherwise.
  kerbs       the 3D pieces where roads meet sidewalks: corners, ramps, driveway dips, islands, a speed hump, drains.
  sidewalks   2 m by 2 m tiles, top at y = 0 (raise them to the kerb height, 0.15 m, in the game), plus a tree pit and a verge.
  water       4 m by 4 m water surface tiles in slots WATER, WATER_L and FOAM; waterColours[kind] gives them per kind.
              River tiles flow towards +Z: scroll their DETAIL shapes along +Z to show the current.
  banks       2 m of shore along X: land at -Z (top at y = 0), water at +Z (its surface at y = -0.5). Each kind comes straight,
              as an outer corner and as an inner corner (quarter turns of radius 2 m about x = 0, z = 0), so a lake or river
              outline can be walked with them. LAND and LAND_D take the ground colour of the area.
  falls       waterfall pieces 4 m wide: a lip at the top, a 1 m sheet (stack as many as the drop needs), a splash pool, mist
              and spray, a small cascade step, and a weir.
  rocks       eight kinds of stone in three sizes (small about 0.4 m, medium about 1.2 m, large about 3 m), a cliff panel 4 m wide
              by 4 m high that stacks, and ore rocks for harvesting.
Notes for each group are in notes[].

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `roads` | 9 | 14 to 270 |
| `markings` | 25 | 2 to 52 |
| `kerbs` | 11 | 16 to 288 |
| `sidewalks` | 9 | 6 to 484 |
| `water` | 10 | 2 to 206 |
| `banks` | 21 | 20 to 192 |
| `falls` | 8 | 30 to 143 |
| `rocks` | 35 | 16 to 288 |
| `items` | 9 | 8 to 20 |

## machines (`assets/shaped/machines.js`, version 1)

Same rules as every pack: shaped pieces, flat colours, metres, Y up, the front faces +Z, the origin at the centre of the ground
under the vehicle. Each machine is
  parts[name]         pieces in machine space at rest (like survivor and alien bones: subtract the part's pivot to turn it)
  rig[name]           how each part moves: parent (another part, or none for the body), pivot [x, y, z],
                      'turn': an axis ([1,0,0] and so on) and a range [min, max] in degrees, positive as the note says, or
                      'slide': a direction and a range in metres; 'fixed' is a turn in degrees ([x, y, z], three.js Euler XYZ)
                      the part always has before it moves; 'rest' is its value when parked.
  wheels              positions for the one 'wheel' part (spin it about X; steer the ones listed in 'steer' about Y)
  clips[name]         movements as key frames: each frame {part: value, ..., 't': seconds from the start}; blend between frames
  beacons             the part that holds the flashing lights (glow pieces): flash it, and add a coloured light
Kinds: excavator, bulldozer, dump_truck, cement_mixer, garbage_truck, fire_truck, ambulance, tow_truck, mobile_crane,
bucket_truck, forklift, road_roller, street_sweeper, school_bus. BODY is a colour slot (each has a usual colour in 'paint').

Machines: `excavator`, `bulldozer`, `dump_truck`, `cement_mixer`, `garbage_truck`, `fire_truck`, `ambulance`, `tow_truck`, `mobile_crane`, `bucket_truck`, `forklift`, `road_roller`, `street_sweeper`, `school_bus`.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `excavator` | 1 | 746 to 746 |
| `bulldozer` | 1 | 616 to 616 |
| `dump_truck` | 1 | 700 to 700 |
| `cement_mixer` | 1 | 670 to 670 |
| `garbage_truck` | 1 | 654 to 654 |
| `fire_truck` | 1 | 1316 to 1316 |
| `ambulance` | 1 | 468 to 468 |
| `tow_truck` | 1 | 664 to 664 |
| `mobile_crane` | 1 | 790 to 790 |
| `bucket_truck` | 1 | 612 to 612 |
| `forklift` | 1 | 580 to 580 |
| `road_roller` | 1 | 412 to 412 |
| `street_sweeper` | 1 | 752 to 752 |
| `school_bus` | 1 | 498 to 498 |

## animals (`assets/shaped/animals.js`, version 1)

The same shape language as the survivors: flat planes, tapering points, silhouette first, no eyes beyond a dark facet.
Each animal lists bones (pivot, tip, parent) and parts (pieces per bone, in model space at rest), and clips: per frame, rotations
in degrees [x, y, z] for the bones that move, and 'root': [x, y, z] metres to move the whole body. Positive X on a leg swings
its foot back; positive X on the neck or head lowers it. Animals face +Z, the origin is the ground under the middle of the body.
Kinds:
  four legs  deer (and deer_buck with antlers), boar, cow, sheep, goat, dog, wolf, fox, bear, raccoon, rabbit, squirrel
  birds      turkey, chicken, duck, goose, pigeon, crow
  fish       trout, bass, catfish
Clips: every animal has idle, walk, run, eat, alert, die (and dead, the last pose); four legs also have attack (predators and
boars) or rear (bear); birds have peck, fly and glide (duck and goose also float); fish have swim and flop.
Bird wings are modelled spread (span along X); every clip on the ground folds them against the flank with [-90, 0, 90] on wing_l and
[-90, 0, -90] on wing_r (three.js Euler XYZ), and fly flaps them about Z.
info[name] gives size, speed, how it behaves, and what it gives when butchered (yield, with the tool needed);
items are the materials on the ground: meat, fish, hide, pelt, feathers, bone, fat, antler, wool, and two carcasses.

Creatures: `deer`, `boar`, `cow`, `sheep`, `goat`, `dog`, `wolf`, `fox`, `bear`, `raccoon`, `rabbit`, `squirrel`, `deer_buck`, `turkey`, `chicken`, `duck`, `goose`, `pigeon`, `crow`, `trout`, `bass`, `catfish`.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `deer` | 1 | 268 to 268 |
| `boar` | 1 | 316 to 316 |
| `cow` | 1 | 310 to 310 |
| `sheep` | 1 | 312 to 312 |
| `goat` | 1 | 286 to 286 |
| `dog` | 1 | 268 to 268 |
| `wolf` | 1 | 288 to 288 |
| `fox` | 1 | 288 to 288 |
| `bear` | 1 | 268 to 268 |
| `raccoon` | 1 | 310 to 310 |
| `rabbit` | 1 | 274 to 274 |
| `squirrel` | 1 | 280 to 280 |
| `deer_buck` | 1 | 328 to 328 |
| `turkey` | 1 | 282 to 282 |
| `chicken` | 1 | 240 to 240 |
| `duck` | 1 | 234 to 234 |
| `goose` | 1 | 234 to 234 |
| `pigeon` | 1 | 228 to 228 |
| `crow` | 1 | 228 to 228 |
| `trout` | 1 | 78 to 78 |
| `bass` | 1 | 74 to 74 |
| `catfish` | 1 | 86 to 86 |

## interiors (`assets/shaped/interiors.js`, version 1)

signs     one board per kind of business (wall board, back at z = 0, text on the front) in its own colours, in two states
          (<name> and <name>_faded for a street that has been dead for a year), and a blade sign (blade_<name>) that sticks out
          from the wall on a bracket (back at z = 0, 0.9 m square, 1.0 m of bracket) with a pictogram or an initial.
          Also window stickers (open / closed), a price pylon for fuel, and a plain "boarded shop" board.
retail, food, security, medical, school, faith, office, industrial, utility, home
          the fixtures that make a room read as what it is. All stand on the floor at the centre of their base, face +Z,
          units metres. sizes[...] gives the footprint [width, depth] and height so the game's room filler can place them
          (roomFixtures lists what goes in each room type, in the same form as ROOMS in play.html).
Colour names are in the palette; nothing uses slots, so a building's interior looks the same whoever built it.

**signs:** signs: <name> is a wall board (width 1.6 to 3.6 m by 0.78 m, bottom-left-centre at the origin: x centred, y from 0 up, back at z = 0, 0.09 m deep); mount it over the shopfront at 3.2 to 4.0 m. For a dead street draw the same sign with every colour name given a trailing F (sg_pharmacy_bg becomes sg_pharmacy_bgF): the palette has a sun-bleached version of each. blade_<name> is a 0.9 m square projecting sign on a bracket (bracket on the wall at z = 0, sign at z = 0.95, both faces; mount at 2.5 m). Business kinds: grocery, supermarket, deli, bakery, butcher, pharmacy, hardware, diner, pizza, cafe, bar, liquor, clothes, shoes, gas, garage, autoparts, bank, police, fire, clinic, hospital, school, library, church, hotel, motel, gym, electronics, books, toys, furniture, pawn, laundry, barber, post, townhall, warehouse, factory, storage, waterworks, power, office, vet, florist, bookie, arcade. pylon_gas is a 6 m price sign for forecourts. Stickers (open, closed, sale) go on the glass inside, back at z = 0. **retail:** retail: shelving (gondola 1.8 m double sided for aisles, shelf_wall 1.8 m against a wall: back at z = -0.3), checkout, produce_bin, freezer_chest, drinks_cooler (against a wall), carts and baskets, pharmacy_counter and pill_wall, clothes_rack, mannequin, fitting_room, shoe_wall, display_table, paint_rack, tool_wall (flat on a wall: back at z = -0.08), lumber_rack, book_shelf, toy_bin, vitrine, tv_wall, and for forecourts fuel_pump, pump_island (two pumps would go on its ends), pump_canopy and ice_box. **food:** food: diner (booth 1.5 x 2.0 seats four, diner_counter, counter_stool, jukebox, menu_board on a wall, pie_case), bar (bar_counter with back_bar behind it, bar_stool, pool_table, dartboard on a wall), cafe (espresso_bar, pastry_case, cafe_table), kitchens (kitchen_range, prep_table, walk_in_cold, dish_sink). **security:** security and emergency: holding_cell (2 m cube of bars, back at z = -1), cell_door, evidence_locker, booking_desk, radio_desk, gun_safe, fire_pole (3.2 m), hose_rack, turnout_rack, bunk_bed (single stack 0.9 x 1.95), metal_locker. **medical:** medical: exam_table, hospital_bed (0.95 x 2.1, head at -Z), iv_stand, xray_light (on a wall, back at z = -0.08, glowing), med_cabinet, curtain_rail (a ceiling-hung screen 2.4 m), wheelchair, reception_desk, waiting_bench. **school:** school and library: school_desk (with chair, 0.62 x 0.62 +chair at +Z), teacher_desk, blackboard (on a wall, back at z = -0.06), trophy_case, library_stack (double sided, 1.6 x 0.8 x 2.2), card_catalogue, reading_table, lunch_table (with benches), globe. **faith:** faith: altar (2 m), pulpit, font, candle_rack (glow flames), organ (2.4 m with pipes), confessional (2.2 m), hymn_board and cross_wall (flat on a wall, back at z = -0.06), lectern. The pew is in props.furniture. **office:** office and bank: cubicle (2 x 1.8, open at +Z), office_desk (1.6 x 0.8, chair at +Z), office_chair, copier, water_cooler, conference_table (3.8 x 1.4), filing_cabinet, safe_big, safe_deposit (a wall of boxes), teller_window (glass screen on a counter), atm, vault_door (a frame 2.4 m wide with a round door set into it; the door is the wheel at z 0.25 to 0.5). **industrial:** industrial: pallet, pallet_loaded, pallet_rack (4.2 m, 2.7 m wide, three levels, partly loaded), steel_drum_stack, conveyor (4 m along Z), lathe, drill_press, workbench (back wall board at z = -0.38), control_console, hydraulic_press, tool_chest, loading_dock_door (a 3 m door frame on the outside wall, back at z = -0.2), forklift_cage. **utility:** utility (pumping station, substation, boiler house, plant room): transformer_cabinet, switchgear (3 m wall of panels), power_pole_xfmr (9 m pole with a transformer), pump_set, boiler (3.2 m flue), water_tank_indoor, valve_wheel, gas_meter_bank, plant_panel (flat on a wall, lamps glow), cooling_unit. **home:** home (adds to props.furniture): dining_table (1.6 x 1.0), kitchen_chair, armchair, coffee_table, nightstand, dresser, bunk_beds_kids, crib, washer, dryer, water_heater, fireplace (back at z = -0.45), bath_sink, shower (0.9 square, glass at +X), bookcase_low, piano, wood_stove.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `signs` | 99 | 42 to 146 |
| `retail` | 26 | 38 to 672 |
| `food` | 18 | 22 to 312 |
| `security` | 11 | 32 to 396 |
| `medical` | 9 | 26 to 180 |
| `school` | 9 | 60 to 492 |
| `faith` | 9 | 24 to 228 |
| `office` | 12 | 48 to 228 |
| `industrial` | 13 | 68 to 204 |
| `utility` | 10 | 76 to 272 |
| `home` | 17 | 48 to 204 |

## floor plans (`assets/shaped/floorplan.js`)

A generator and a checker, not a model pack: `FLOORPLAN.gen(kind, w, d, {seed, storeys})` returns walls, doors, rooms and keep-clear walkways for a building of that footprint; `FLOORPLAN.check(plan)` walks a 0.6 m agent through every door and fails if any room on any storey cannot be reached. Rules and how to plug it into `genInterior` are in `docs/FLOORPLANS.md`; `node assets/shaped/src/floorplan_test.js` runs it over thousands of footprints.


## flora (`assets/shaped/flora.js`, version 1)

Everything stands on the ground at the origin, metres, true to the height the game scales it to (info[name].h), so scale 1 is right.
models.plants.<name>    near version. Deciduous trees come in summer (<kind>) and autumn (<kind>_fall); every tree has three shape
                        variants: <kind>, <kind>_b, <kind>_c (different lean, branching and crown, same height class) so woods are not cloned.
models.far.<name>       a far version of 60 triangles or fewer for the distance (a trunk and two or three blobs). Same names as plants.
info[name]              {h, variants, far} the height it is drawn at, the variant names, and the far model.
Kinds: oak, maple, sycamore, poplar, cedar, pine (trees); bush, bush_small, shrub; grass_tuft, grass_tall.
Colour names are in the palette (nothing uses slots).

Use plants.<name> within about 60 m and far.<name> beyond; both have the same name and stand at the same size, so switching does not pop. Pick a variant by hashing the tree's position into info[name].variants. For the autumn season swap <kind> for <kind>_fall (oak, maple, sycamore, poplar); cedar, pine and the shrubs stay green. The existing props.plants names (oak, autumn_oak, pine, bush, grass_tuft...) still work; these replace them one for one.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `plants` | 45 | 42 to 246 |
| `far` | 30 | 24 to 50 |

## furniture, set 2 (`assets/shaped/furniture2.js`, version 1)

The thirteen furniture pieces that replace the Furniture Kit, with the same names as the game uses (chair_stool, cabinet_medium_decorated, cabinet_medium, cabinet_small_decorated, cactus_medium_A, k_basin, k_night, k_bunk, k_plant, k_rug, k_washer, k_coat, k_stool). Each fits inside its footprint in tools/out/models.txt.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `furniture` | 13 | 84 to 264 |

## structures (`assets/shaped/structures.js`, version 1)

Every piece is a modular length of 4 m (unless it says otherwise) that runs along +Z, centred on x = 0 and z = 0, so the game lays them end to end along the
way and turns each by the way's bearing. DECK PIECES HAVE THEIR WALKING/DRIVING SURFACE AT y = 0: set y to the deck height the engine worked out. Pieces
whose name ends _unit are one metre tall and are stretched in y only (shafts, walls); dam and mound profiles are modelled at the height in their name and
may be scaled in y to the real height (their slopes stretch with them, which is right). Widths: path 3 m, road 7 m (two lanes), wide 14 m (a dual carriageway
or four lanes), rail 4.8 m (one track). Colour names come from the palette (nothing uses slots), so concrete, steel, timber and earth are plain colours.

How the game uses it, per structures[].k from the map file: bridge and overpass: for each 4 m of the way lay deck_<kind> (path, road, wide, rail by the way) at the deck height, with pier_cap_<kind> and pier_shaft_<kind>_unit (stretched down to the ground) every min(50 m, length/2) from the deck rule, abutment_<kind> at both ends where the deck leaves the ground, ramp_embankment_road_unit for an approach ramp; st picks the style: truss -> truss_road, arch -> arch_road_8 chained, suspension -> suspension_tower_road at both ends and suspension_hanger_road between, cable-stayed -> stay_pylon_road with deck_<kind> between, trestle and viaduct -> trestle_bent_unit with deck_<kind>, anything else deck_<kind>. tunnel: portal_<kind> at each end and tunnel_lining_<kind> between while the ground is cut; culvert: culvert_headwall_pipe or _box at each end and culvert_pipe_4m between; passage: passage_frame; ford: ford_slab; dam: dam_earth_h8 or dam_concrete_h8 (the _road variants when road is true) along the way scaled in y to h, dam_end_wall at the valley sides, spillway_h8 where the data says; weir: weir_step across the river; lock and gate: lock_gate_open or _closed; pier: pier_deck with pier_end; breakwater: breakwater_mound_h3; wall: retaining_wall_unit stretched to h.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `structures` | 47 | 12 to 456 |

## land (`assets/shaped/land.js`, version 1)

logjams, beaver works) with the loose ground clutter of woods. Writes assets/shaped/land.js. Run: python3 assets/shaped/src/land.py

Reading the pack (docs/LANDSCAPE.md has the reasons and the placement recipes):
  * Pieces are modular. Anything that follows a road, creek or bluff is 4 m long along z and centred, and says which way it faces.
  * Road-side pieces (cut_*, fill_*, rip_rap, ditch): the toe (the foot of the slope, next to the road shoulder or ditch) is at x = 0 and the ground rises toward +x;
    z is along the road. Mirror with scale.x = -1 for the other side of the road. Heights are in the name (h4 = 4 m); scale y to the real height, x with it.
  * Bluff and creek pieces: the water or the open side is toward -x, the rock or the bank toward +x.
  * Stand-alone things (sinkholes, caves, springs, boulders, logjams) are centred on their middle and sit on y = 0; sinkholes and springs sink BELOW y = 0 (see h in info).
  * Flat ground patches (`patch_*`) are decals: thin, lie on y = 0.02 and are for placing under or between things.
Colour names are in the palette. Rock is limestone and dolomite grey to cream with darker bands, which is what Springfield's hills and bluffs are made of.

Pieces: `cut_rock_h4`, `cut_rock_h8`, `cut_rock_h12`, `cut_soil_h3`, `cut_soil_h6`, `cut_mixed_h8`, `cut_rock_end`, `ditch_4`, `ditch_pipe_4`, `rockfall_fence_4`, `fill_bank_h3`, `fill_bank_h6`, `guardrail_4`, `rip_rap_4`, `ledge_s`, `ledge_m`, `ledge_l`, `outcrop_a`, `outcrop_b`, `boulder_field_a`, `boulder_field_b`, `bluff_h10`, `bluff_h5`, `talus_slope_4`, `overhang_shelter`, `natural_bridge`, `glade_patch`, `cairn`, `sinkhole_s`, `sinkhole_m`, `sinkhole_pond`, `swallet`, `cave_mouth_s`, `cave_mouth_l`, `spring_pool`, `spring_outflow_4`, `dry_hollow_4`, `riffle_4`, `pool_4`, `gravel_bar_s`, `gravel_bar_l`, `sand_bar`, `cut_bank_4`, `logjam`, `stream_boulder_s`, `stream_boulder_m`, `stream_boulder_l`, `beaver_dam`, `beaver_lodge`, `mudflat`, `patch_leaf_pile`, `patch_leaf_litter`, `patch_moss`, `patch_pebbles`, `patch_clover`, `patch_twigs`, `patch_game_trail`, `patch_deer_track`

Roads through hills: where the ground beside a road is higher than the road by more than 1.5 m, lay cut_rock (limestone, where the ground is rocky or steeper than 1:1) or cut_soil along it, with ditch_4 at the toe, rockfall_fence_4 on benches taller than 8 m, and cut_rock_end where the cut dies out; scale y to the real height. Where the road is higher than the ground beside it by more than 1.5 m use fill_bank, with guardrail_4 on the road edge above 3 m. Creeks: on a straight reach alternate riffle_4 and pool_4, each about 6 channel widths long; put pool_4 and cut_bank_4 on the outside of a bend and gravel_bar on the inside; stream_boulder_s/m/l and logjam where the data has shoals; beaver_dam and beaver_lodge on slow lowland creeks. Hills: outcrop_a/b and ledge_* on slopes above about 25 degrees and on ridgelines; glade_patch with ledge_l and cedars on south and west facing hilltops; bluff on the outside of river bends. Karst: sinkhole_s/m (and _pond) in fields and woods on limestone, scattered in groups of a few; swallet where a small stream ends; cave_mouth in bluffs and hillsides; spring_pool with spring_outflow_4 at the head of a creek in a hollow; dry_hollow_4 for valleys with no stream. Ground: patch_* over the ground texture under woods, edges and trails.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `land` | 58 | 12 to 420 |

## woods (`assets/shaped/woods.js`, version 1)

models.woods.<name>  every piece stands on the ground at the origin, metres, true size (info[name].h), scale 1 is right.
Trees: spruce, oak_tall (a woodland oak: tall, clear trunk, small high crown), sapling, pine_dead, oak_bare and pine_bare (winter), oak_snow and pine_snow (snow-laden), redbud, dogwood, hickory, walnut, sumac, birch.
Understory and floor: fallen_tree_path (a trunk across a path, 4 m), root_ball, snag_a/b (dead standing trunks), stump_big, log_hollow, log_mossy, brush_pile, boulder_moss, boulder_cluster,
 thicket_a/b (dense low shrub 2 m), berry_bush, vines (a hanging curtain for tree trunks), fern_a, mayapple, wildflower_a/b/c, mushrooms, toadstool_ring, bracket_fungus.
Rule of use is in `rule`; the layers are canopy (oak_tall, hickory, walnut), understory (redbud, dogwood, sapling), shrub (thicket, sumac, berry_bush) and herb (ferns, flowers), plus dead wood.

Pieces: `spruce`, `spruce_snow`, `oak_tall`, `oak_tall_b`, `oak_tall_c`, `oak_bare`, `oak_snow`, `pine_dead`, `pine_bare`, `pine_snow`, `redbud`, `dogwood`, `sapling`, `birch`, `hickory`, `walnut`, `sumac`, `fallen_tree_path`, `root_ball`, `snag_a`, `snag_b`, `stump_big`, `log_hollow`, `log_mossy`, `brush_pile`, `boulder_moss`, `boulder_cluster`, `thicket_a`, `thicket_b`, `berry_bush`, `vines`, `fern_a`, `fern_b`, `mayapple`, `wildflower_a`, `wildflower_b`, `wildflower_c`, `mushrooms`, `toadstool_ring`, `bracket_fungus`

A wood is five layers, not one: canopy (oak_tall, hickory, walnut, spruce on cool slopes, pine on dry ridges, about 1 per 60 sq m), understory (redbud, dogwood, sapling, 1 per 25 sq m, in the gaps), shrubs (thicket_a/b, berry_bush, sumac, at clearings and edges), herbs (fern, mayapple, wildflower, mushrooms in damp spots) and dead wood (snag, fallen_tree_path, log_*, root_ball, brush_pile; 1 or 2 per 400 sq m, a log is nearly always near a snag or a root_ball). Cluster the herbs and shrubs; do not spread them evenly. Put vines on trunks at the woods edge. Edges are soft: tall trees, then understory, then shrubs, then field, over 10 to 15 m, with sumac in the fencerow. Pick a variant by hashing the position; use the _bare and _snow versions by season; birch near water and on cool slopes; walnut in bottomland.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `woods` | 40 | 30 to 414 |

## farm (`assets/shaped/farm.js`, version 1)

models.farm.<name>, metres, origin at the centre of the base, front facing +Z.
Fields: crop_* are 4 x 4 m tiles of rows (corn, wheat, soy, ploughed, stubble, harvested, pumpkin, sunflower; <name>_fall is the autumn colour where it differs). Tile them; rows run along z.
Hay and yard: bale_round, bale_square, bale_stack, haystack, scarecrow, feed_trough, water_trough, mailbox, pivot_span (an irrigation span), grain_cart.
Fences: fence_wire_4, fence_wire_post, fence_wire_corner, fence_rail_4, fence_rail_gap, gate_field, gate_farm, cattle_guard. 4 m long along x, centre.
Buildings: barn_red (open loft door, 12 x 16), barn_old (weathered, leaning), silo, grain_bin, machine_shed, coop, windmill, farmhouse_sign, well_house, pond_dock, tractor, hay_wagon, flatbed.
Colour names are in the palette.

Pieces: `crop_corn`, `crop_corn_fall`, `crop_wheat`, `crop_wheat_fall`, `crop_soy`, `crop_soy_fall`, `crop_ploughed`, `crop_stubble`, `crop_harvested`, `crop_pumpkin`, `crop_sunflower`, `bale_round`, `bale_round_wrapped`, `bale_square`, `bale_stack`, `haystack`, `scarecrow`, `feed_trough`, `water_trough`, `mailbox`, `pivot_span`, `grain_cart`, `fence_wire_4`, `fence_wire_post`, `fence_wire_corner`, `fence_rail_4`, `fence_rail_gap`, `gate_field`, `gate_farm`, `cattle_guard`, `barn_red`, `barn_old`, `silo`, `grain_bin`, `machine_shed`, `coop`, `windmill`, `well_house`, `pond_dock`, `tractor`, `hay_wagon`, `flatbed`

A farm has a plan: the house and yard first, the barn and sheds beside the drive, the silo or grain bin by the barn, then fields in big blocks behind them with a fence around each and a gate where the drive or a track meets it. Fields: lay crop_* tiles in blocks of at least 4 x 8 tiles with the rows running the same way; mix crops by field, not by tile; use _fall in autumn and crop_stubble or crop_harvested after harvest and crop_ploughed in winter and spring. Scatter bale_round on harvested and stubble fields (2 to 6 per hectare), bale_stack beside the barn, a scarecrow in a garden or crop field. Fences run along field edges with a gate_field at each field corner and gate_farm at the drive; use fence_rail_gap for the broken ones. Water: a windmill or well_house in the yard, a water_trough in each pasture, a pond_dock on a pond. Put a mailbox at the end of the drive, a pivot_span on flat dry fields.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `farm` | 42 | 36 to 604 |

## waterside (`assets/shaped/waterside.js`, version 1)

models.waterside.<name>, metres, origin at the centre of the base, front facing +Z. Water level is y = 0: boats and plants float at it. Shore pieces say which way the water is.
Colour names are in the palette.

Pieces: `dock_short`, `dock_long`, `dock_t`, `boat_ramp`, `rowboat`, `canoe`, `jon_boat`, `kayak`, `boat_wreck`, `lily_pads`, `lily_pads_bloom`, `cattails`, `cattails_small`, `reeds`, `duckweed`, `shore_foam`, `ripples`, `heron`, `stepping_stones`, `rope_swing`, `footbridge`, `picnic_table`, `bench`, `fire_ring`, `grill_post`, `trail_marker`, `trail_marker_arrow`, `trailhead_sign`, `trash_bin`, `info_kiosk`

Shores: at every shore line lay shore_foam where the water meets the bank, reeds and cattails in the shallows on the slow (inside) side of a bend, lily_pads and duckweed on ponds and slow water only, and a heron or two at the head of a pool. A dock, ramp or boat appears only where the data says so (leisure=marina, man_made=pier, a boat_ramp, a lake edge with a house or a park); rowboats, canoes and kayaks lie on the bank beside a dock or ramp, jon_boat on a lake. Trails (highway=path or footway in a park or woods): trail_marker every 150 to 300 m, trail_marker_arrow at forks, trailhead_sign and picnic_table at the start and at parks, bench at viewpoints and beside water, fire_ring at camps. footbridge where a path crosses a stream or gully; stepping_stones where a trail fords a creek. rope_swing on one big tree on a deep pool.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `waterside` | 30 | 20 to 420 |

## foodservice (`assets/shaped/foodservice.js`, version 1)

Run: python3 assets/shaped/src/foodservice.py

models.foodservice.<name>: stands on the floor at the centre of its base, front facing +Z (the side the staff or the customer uses is in info[name].use), metres.
sizes[name] = [width, depth, height] (as in interiors.sizes) and info[name] adds the footprint, `use` (who stands where), `powered` (draws power: dead when the grid is down), `water` (needs a water supply),
`holds` (what a search of it can give) and `note`. Hoods and shelves that hang from the ceiling or wall start at their own height, so place them at y = 0 as given.
Colour names are in the palette; nothing uses slots.

Pieces: `fryer_bank`, `fryer_single`, `flat_top_grill`, `char_broiler`, `range_hood`, `pizza_oven`, `convection_oven`, `steam_table`, `heat_pass`, `ice_machine`, `reach_in_fridge`, `under_counter_fridge`, `wire_rack`, `sink_three_comp`, `hand_sink`, `dish_machine`, `trash_station`, `tray_cart`, `fast_counter`, `order_kiosk`, `drive_thru_window`, `drive_thru_menu`, `menu_board_fast`, `condiment_station`, `soda_fountain`, `shake_machine`, `host_stand`, `high_chair`, `salad_bar`, `menu_stand_a`, `play_place`, `rack_oven`, `dough_mixer`, `proofer_rack`, `bread_wall`, `cake_display`, `meat_case`, `butcher_block`, `meat_hooks`, `meat_slicer`, `scale_counter`, `cheese_display`, `roller_grill`, `hot_case`, `slush_machine`, `coffee_station`, `tobacco_wall`, `snack_rack`, `propane_cage`, `ice_chest_outdoor`, `air_pump`, `vacuum_post`, `dipping_cabinet`, `cone_rack`, `tap_tower`, `keg_cooler`, `keg_stack`, `neon_open_sign`, `neon_beer_sign`, `wet_floor_sign`, `mop_bucket`

A food business has a flow: receiving, dry store and cold store, prep, the cooking line under a hood, the pass, the server aisle, the dining room; and a one-way dish pit. Restaurants (amenity=restaurant): host_stand, tables and booths from interiors, the line (range under range_hood, fryer_single or bank, flat_top_grill, char_broiler), heat_pass, reach_in_fridge, under_counter_fridge, sink_three_comp, hand_sink, dish_machine, wire_rack and a walk_in_cold from interiors. Fast food (amenity=fast_food): fast_counter with menu_board_fast over it, order_kiosk, soda_fountain, shake_machine, condiment_station, a kitchen with fryer_bank, flat_top_grill and range_hood, drive_thru_window in the side wall with drive_thru_menu in the lane, play_place in a corner on about a third of the chains. Bakery: bread_wall, cake_display, rack_oven, dough_mixer, proofer_rack. Butcher and deli: meat_case, butcher_block, meat_hooks in the cold room, meat_slicer, scale_counter, cheese_display. Convenience and gas: fast food-style counter with tobacco_wall behind it, roller_grill, hot_case, slush_machine, coffee_station, snack_rack, ice_chest_outdoor and propane_cage outside, air_pump and vacuum_post on the forecourt. Ice cream: dipping_cabinet, cone_rack, shake_machine. Bars: tap_tower on the bar, keg_cooler beneath, keg_stack in the back, neon signs in the window. Every kitchen needs trash_station, mop_bucket and a wet_floor_sign.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `foodservice` | 61 | 20 to 516 |

## autotrade (`assets/shaped/autotrade.js`, version 1)

Writes assets/shaped/autotrade.js. Run: python3 assets/shaped/src/autotrade.py

models.autotrade.<name>: stands on the floor at the centre of its base, front (the side the user stands) facing +Z, metres. Same sizes/info form as foodservice (`use`, `powered`, `water`, `holds`).
Pieces that carry a vehicle are empty: put a car from props.vehicles on the lift pads or the showroom pedestal.

Pieces: `lift_two_post`, `lift_two_post_up`, `tire_changer`, `wheel_balancer`, `tire_rack`, `tyre_stack_floor`, `tool_cabinet_rollaway`, `shadow_board`, `air_compressor`, `oil_drum_rack`, `parts_shelf`, `parts_counter`, `battery_charger`, `engine_hoist`, `jack_stand_pair`, `floor_jack`, `creeper`, `drain_pan`, `fluid_cabinet`, `parts_washer`, `hose_reel`, `key_board`, `service_desk`, `service_menu_board`, `car_wash_bay`, `car_wash_tunnel`, `showroom_pedestal`, `sales_desk`, `key_cabinet`, `price_sign_stand`, `pennant_string`, `flagpole_brand`, `tube_man`, `wheel_stop`, `lot_pole_light`, `sign_pylon`, `ev_charger`, `fuel_tank_lids`, `squeegee_station`, `emergency_stop`, `guard_bollard`, `key_machine`, `fastener_bins`, `paint_mixer`, `ladder_rack`, `pipe_rack`, `bagged_goods_pallet`, `fence_panel_stack`, `garden_bench`, `wheelbarrow`, `flat_cart`, `door_rack`, `storage_units_4`, `storage_units_open`, `gate_keypad`, `moving_dolly`, `boat_on_trailer`, `boat_rack_stack`, `bicycle`, `bike_repair_stand`, `bike_display_rack`, `motorcycle`

Auto repair (shop=car_repair, motorcycle_repair, tyres): two to four bays in a row, each 25 ft (7.5 m) wide and about 8 m deep, with a bay door 3 m wide and 3.7 m high on the front; put lift_two_post in the middle of the bay (up when a car is on it), a tool_cabinet_rollaway and shadow_board on the rear wall, an air_compressor and hose_reel by the door, a tire_changer and wheel_balancer in the tyre bay, oil_drum_rack and drain_pan at the pit end, a fluid_cabinet far from the battery_charger, and parts_shelf and parts_counter in a small parts room. A service_desk faces the entry with a key_board behind it, and a customer waiting area with chairs from interiors. Outside, tyre_stack_floor and jack_stand_pair. Tyres: tire_rack along a wall and many tyres. Car dealer (shop=car): a glass showroom with one or two showroom_pedestal and cars on them, sales_desk three or four, a key_cabinet in the back office, and a lot of cars outside in rows with wheel_stop and price_sign_stand, pennant_string and flagpole_brand at the front, lot_pole_light every 25 m and a sign_pylon at the road. Car parts (shop=car_parts): parts_counter, parts_shelf rows and a battery_charger. Car wash (amenity=car_wash): car_wash_bay in rows of three or four with a vacuum_post (foodservice pack) beside them, or car_wash_tunnel modules end to end behind a pay kiosk. Fuel (amenity=fuel): fuel_tank_lids in the forecourt pavement, air_pump, squeegee_station and emergency_stop at the island, ev_charger where mapped, guard_bollard at the pump islands and building corner. DIY and hardware: key_machine and paint_mixer at the counter, fastener_bins and pipe_rack and ladder_rack in the aisles, flat_cart and door_rack at the lumber end, bagged_goods_pallet and fence_panel_stack outside. Garden centre: garden_bench rows, wheelbarrow, bagged_goods_pallet. Storage rental: storage_units_4 in long rows facing a drive, some of them storage_units_open, a gate_keypad at the gate, moving_dolly at the office. Boat storage and rental: boat_on_trailer on the lot and boat_rack_stack in the barn. Bicycle shops: bike_display_rack, bicycle in front, bike_repair_stand at the bench.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `autotrade` | 62 | 24 to 540 |

## services (`assets/shaped/services.js`, version 1)

Writes assets/shaped/services.js. Run: python3 assets/shaped/src/services.py

models.services.<name>: stands on the floor at the centre of its base, front (where the user stands or the face of the piece) facing +Z, metres. Same sizes and info fields as foodservice (`use`, `powered`, `water`, `holds`).

Pieces: `dental_chair`, `dental_cart`, `panoramic_xray`, `sterilizer_counter`, `eye_exam_chair`, `eye_chart`, `frame_wall`, `vet_exam_table`, `kennel_bank`, `cat_cage`, `animal_scale`, `surgery_lamp`, `op_table`, `massage_table`, `tanning_bed`, `salon_chair`, `styling_station`, `shampoo_bowl`, `hood_dryer`, `manicure_table`, `pedicure_chair`, `barber_chair`, `barber_pole`, `tattoo_chair`, `flash_wall`, `tattoo_station`, `hotel_bed`, `hotel_dresser_tv`, `luggage_cart`, `front_desk`, `key_rack_wall`, `housekeeping_cart`, `vending_soda`, `vending_snack`, `ice_bucket_stand`, `breakfast_bar`, `vacancy_sign`, `queue_stanchion`, `deposit_table`, `drive_up_teller`, `po_box_wall`, `mail_sort_rack`, `parcel_scale`, `mail_cart`, `ticket_machine`, `service_window`, `flag_stand`, `judge_bench`, `witness_stand`, `jury_box`, `gallery_pew`, `bar_gate`, `cubby_wall`, `kids_table_set`, `toy_shelf_low`, `cot_row`, `dorm_unit`, `washer_row`, `dryer_stack`, `folding_table_long`, `change_machine`, `laundry_cart`, `casket`, `flower_spray`, `memorial_stand`, `urn_shelf`, `lawyer_desk`, `law_library_wall`, `brochure_rack`, `listing_board`, `cinema_seat_row`, `cinema_screen`, `film_projector`, `concession_stand`, `popcorn_machine`, `ticket_booth`, `stage_platform`, `dj_booth`, `disco_ball`, `light_truss`, `pa_speaker`, `mall_fountain`, `mall_directory`, `mall_kiosk`, `spinner_rack`, `guitar_wall`, `charity_bin`, `flower_buckets`, `aquarium_tank`, `bird_cage`, `leash_wall`

Dentist (amenity=dentist): four operatories (dental_chair, dental_cart, sink) opening off a corridor to a central sterilizer_counter, a panoramic_xray room, a front desk and waiting chairs from interiors. Clinic and doctor (amenity=clinic, doctors): exam rooms with the interiors exam_table and a sink, waiting room and reception_desk from interiors, a treatment room with op_table and surgery_lamp for the minor-surgery clinics. Vet (amenity=veterinary): reception and scale, two or three exam rooms with vet_exam_table, a back ward of kennel_bank and cat_cage, a surgery with op_table and surgery_lamp. Optician (shop=optician): frame_wall, an exam room with eye_exam_chair and eye_chart. Massage and physio: massage_table; tanning: tanning_bed. Hairdresser and beauty: a front desk, a row of salon_chair with styling_station along a wall, shampoo_bowl at the back, hood_dryer in a corner; nails: manicure_table and pedicure_chair rows; barber: barber_chair, barber_pole at the door; tattoo (shop=tattoo): flash_wall, tattoo_chair, tattoo_station. Hotel and motel (tourism=hotel, motel): lobby with front_desk and key_rack_wall, luggage_cart, brochure_rack; a hall with vending_soda, vending_snack and an ice machine; rooms of hotel_bed, nightstand (interiors), hotel_dresser_tv; housekeeping_cart in the corridors; a breakfast room with breakfast_bar; vacancy_sign at the road. Bank: queue_stanchion rope lines, interiors teller_window, deposit_table, a vault, drive_up_teller outside. Post office: po_box_wall, mail_sort_rack behind a counter with parcel_scale, mail_cart, ticket_machine. Government and court: service_window, flag_stand, a courtroom of judge_bench, witness_stand, jury_box, gallery_pew rows and a bar_gate. Childcare and school: cubby_wall, kids_table_set, toy_shelf_low, cot_row. Dormitory: dorm_unit repeated down a corridor. Laundry: washer_row, dryer_stack, folding_table_long, change_machine, laundry_cart. Funeral home: casket, flower_spray, memorial_stand, urn_shelf, interiors pews. Offices: lawyer_desk, law_library_wall, brochure_rack, listing_board in estate agents. Cinema: ticket_booth outside, concession_stand and popcorn_machine in the lobby, cinema_screen with rows of cinema_seat_row stepping up, film_projector in a room at the back. Nightclub and theatre: stage_platform, dj_booth, light_truss, disco_ball, pa_speaker. Mall: mall_fountain, mall_directory, mall_kiosk, spinner_rack. Pawn and music: guitar_wall. Pet: aquarium_tank, bird_cage, leash_wall. Charity: charity_bin. Florist: flower_buckets outside.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `services` | 91 | 48 to 864 |

## shopfit (`assets/shaped/shopfit.js`, version 1)

Writes assets/shaped/shopfit.js. Run: python3 assets/shaped/src/shopfit.py

models.shopfit.<name>: metres, origin at the centre of the base, front facing +Z. Wall pieces are 0.1 to 0.2 m deep and stand on the floor against a wall (back at -z); floor patches are 2 x 2 m decals at y = 0.02; ceiling pieces hang from y = 3.0 (their info.h is measured from 0).

Pieces: `glass_door`, `glass_door_double`, `shop_window`, `shop_window_wide`, `rollup_door`, `bay_door`, `loading_dock_door`, `ticket_window`, `shop_awning`, `ceiling_tile_light`, `ceiling_plain`, `ceiling_holed`, `pendant_light`, `track_light`, `neon_open_sign`, `truss_span`, `duct_run`, `pipe_run`, `sprinkler_head`, `smoke_detector`, `dome_camera`, `exit_sign`, `wall_clock`, `partition_wall_3`, `partition_glass`, `wainscot_panel`, `tiled_wall`, `brick_pier`, `column_cover`, `toilet_stall`, `urinal_wall`, `sink_counter`, `hand_dryer`, `mop_sink`, `fire_ext_cabinet`, `first_aid_box`, `coat_hooks`, `floor_checker`, `floor_checker_red`, `floor_linoleum`, `floor_carpet_grey`, `floor_carpet_blue`, `floor_carpet_red`, `floor_carpet_patterned`, `floor_hardwood`, `floor_concrete`, `floor_epoxy`, `floor_rubber`, `floor_terrazzo`, `floor_quarry`, `floor_mat_entry`

Every shop: a glass_door or glass_door_double in the front wall (the wall that faces the road), shop_window between them, shop_awning over the pavement for food and small shops, neon_open_sign in the window. Garages, car washes and storage: bay_door or rollup_door; warehouses: loading_dock_door. Ceilings: tile the room with ceiling_tile_light at 2.4 m intervals (a light every second panel) for offices, shops and clinics; ceiling_holed in abandoned places; pendant_light over tables in restaurants and bars; track_light in boutiques; truss_span in warehouses and gyms; duct_run in kitchens and laundromats; pipe_run and sprinkler_head in hotels and big shops; smoke_detector, dome_camera and exit_sign by every public door. Walls: partition_wall_3 for rooms, partition_glass for offices, wainscot_panel in restaurants and banks, tiled_wall in kitchens, butchers and restrooms. Restrooms: toilet_stall rows, urinal_wall, sink_counter, hand_dryer; janitor closet: mop_sink. fire_ext_cabinet and first_aid_box on a wall by the back door. Floors: a grid of 2 m floor_* patches over the room, one material per room: checker for diners and ice cream, linoleum for schools and clinics, carpet for offices and hotels, hardwood for bars and boutiques, concrete and epoxy for workshops, rubber for gyms, terrazzo for banks and courts, quarry for kitchens; floor_mat_entry just inside the door.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `shopfit` | 51 | 12 to 324 |

## parks (`assets/shaped/parks.js`, version 1)

models.parks.<name>: metres, origin at the centre of the base, front facing +Z; pieces along a path or edge are 4 m long on z and tile end to end. Court, track and line tiles are 4 m decals at y = 0.02 (`court_*`, `track_*`, `field_line_*`); the pool sinks below y = 0 (its info has `sunk`), so cut the ground under it. `info[name]` has `note`, `use`, `holds` (what a search can find), `powered` and `water` as in the business packs.

Pieces: `swing_set`, `slide`, `seesaw`, `climbing_frame`, `monkey_bars`, `sandpit`, `spring_rider`, `merry_go_round`, `tire_swing`, `balance_beam_set`, `playhouse`, `playground_chips`, `playground_rubber`, `gazebo`, `pavilion`, `bandstand`, `statue_plinth`, `monument_obelisk`, `fountain_dry`, `fountain_running`, `drinking_fountain`, `trash_can_lid`, `recycling_bin`, `park_sign`, `park_lamp`, `bollard_light`, `flower_bed`, `planter_box`, `hedge_4`, `fence_wrought_4`, `pergola`, `dog_waste_station`, `pet_water_bowl`, `bbq_pedestal`, `park_bench_iron`, `baseball_backstop`, `home_plate`, `base_bag`, `pitchers_mound`, `dugout`, `bleachers_3row`, `scoreboard`, `outfield_fence_4`, `batting_cage`, `basketball_hoop`, `basketball_hoop_wall`, `soccer_goal`, `football_goalpost`, `tennis_net`, `volleyball_net`, `horseshoe_pit`, `disc_golf_basket`, `court_green_plain`, `court_green_line`, `court_green_corner`, `court_blue_plain`, `court_blue_line`, `court_blue_corner`, `court_clay_plain`, `court_clay_line`, `court_clay_corner`, `court_blue_circle`, `court_blue_key`, `track_lane_4`, `field_line_4`, `field_line_corner`, `skate_quarterpipe`, `skate_box`, `skate_rail`, `skate_ramp_a`, `skate_bowl`, `pool_8x4`, `diving_board`, `pool_ladder`, `lifeguard_chair`, `pool_fence_4`, `pool_lounger`, `golf_flag`, `golf_tee_box`, `sand_bunker`, `golf_cart`, `bmx_jump_dirt`, `pump_track_roller_4`, `dirt_berm`, `bike_skills_ramp`, `bike_start_gate`, `tent_a_frame`, `tent_dome`, `tent_big`, `camp_stove`, `camp_table_fold`, `hammock`, `camp_sign`

Park (leisure=park, garden): paths with park_lamp every 20 m and park_bench_iron at views; a flower_bed and hedge_4 near entrances, park_sign at the gate, trash_can_lid and recycling_bin by benches, drinking_fountain and dog_waste_station at the trailheads; a statue_plinth, fountain_dry or fountain_running or monument_obelisk as the centrepiece; gazebo and bandstand on the lawn, pavilion with bbq_pedestal for picnics. Playground (leisure=playground): playground_chips or playground_rubber under swing_set, slide, climbing_frame, monkey_bars, merry_go_round, seesaw, spring_rider, balance_beam_set, sandpit, tire_swing and playhouse, with fence_wrought_4 round it and park_bench_iron outside. Baseball and softball: home_plate, base_bag on the three other corners, pitchers_mound, baseball_backstop behind plate, dugout on each side, bleachers_3row, outfield_fence_4 in an arc, scoreboard in centre field, batting_cage nearby. Basketball (court): court_blue_key, court_blue_line and court_blue_circle tiles with a basketball_hoop at each end. Tennis (leisure=pitch, sport=tennis): court_green_* tiles with tennis_net across the middle and fence_wrought_4 round. Soccer and football: field_line_4 and field_line_corner on grass, soccer_goal or football_goalpost at the ends. Volleyball: volleyball_net on a sand patch. Track: track_lane_4 in loops. Skate park: skate_quarterpipe, skate_box, skate_rail, skate_ramp_a and skate_bowl on concrete. Pool (leisure=swimming_pool): pool_8x4 with the ground cut away, diving_board at the deep end, pool_ladder on the edge, lifeguard_chair, pool_fence_4 round it and pool_lounger on the deck. Golf (leisure=golf_course): golf_tee_box, golf_flag, sand_bunker, golf_cart on the path. Bike park: bmx_jump_dirt, pump_track_roller_4 and dirt_berm in a loop, bike_skills_ramp and bike_start_gate. Camp (tourism=camp_site): camp_sign at each plot, tent_a_frame or tent_dome and camp_table_fold, camp_stove, hammock, fire_ring (waterside) and tent_big for a refugee or relief camp.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `parks` | 93 | 12 to 528 |

## bikes (`assets/shaped/bikes.js`, version 1)

Same form as the machines pack (read its header): parts[name] pieces at rest in bike space; rig[name] how each part moves; wheels[name] positions of the one `wheel` part; steer[name] which wheels steer; clips; BODY is the paint colour slot (paint[name]).
Metres, Y up, the front faces +Z, the origin on the ground under the middle of the wheelbase. A rider sits on `saddle[name]` (a point), with hands at `grips[name]` and feet at `pedals[name]` (about the crank for pedal bikes, on the footpegs for the motor ones).
Moving parts: `bars` turns about Y with the front wheel (the same angle as the steered wheel, up to 35 degrees); `crank` spins about X (positive drives forward); `wheel` spins about X by distance / wheelSize[0].

Models: `bicycle_city`, `bicycle_mountain`, `bicycle_kids`, `bmx`, `bicycle_road`, `cargo_bike`, `tricycle`, `tandem`, `kick_scooter`, `motorbike_road`, `motorbike_dirt`, `moped`, `quad_bike`, `bike_trailer`, `fallen_bicycle`, `wrecked_motorbike`

Draw as the machines pack: BODY = paint[name]; parts from the body outwards (subtract the part pivot, apply the value), `wheel` at every wheels[name] point (spin about X by distance / wheelSize[name][0]; steer the listed indices about Y up to 35 degrees, and turn `bars` by the same angle). Pedal bikes: spin `crank` by the distance driven (positive forward); a rider sits at saddle[name] with hands at grips[name] and feet at pedals[name] (for the motor bikes the pedals are footpegs, which do not move). Headlight and tail light pieces are glow pieces: show them at night or when the engine is on. Placement: bicycles lean on walls, rails and bike racks (props.street), lie as fallen_bicycle in verges and gutters, and sit in front of shops, schools and parks; motorbikes and quads sit in driveways, garages and car parks; wrecked_motorbike marks crash sites; bike_trailer hitches behind a bicycle or quad.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `bicycle_city` | 1 | 488 to 488 |
| `bicycle_mountain` | 1 | 408 to 408 |
| `bicycle_kids` | 1 | 464 to 464 |
| `bmx` | 1 | 432 to 432 |
| `bicycle_road` | 1 | 420 to 420 |
| `cargo_bike` | 1 | 456 to 456 |
| `tricycle` | 1 | 184 to 184 |
| `tandem` | 1 | 432 to 432 |
| `kick_scooter` | 1 | 136 to 136 |
| `motorbike_road` | 1 | 328 to 328 |
| `motorbike_dirt` | 1 | 376 to 376 |
| `moped` | 1 | 364 to 364 |
| `quad_bike` | 1 | 244 to 244 |
| `bike_trailer` | 1 | 148 to 148 |
| `fallen_bicycle` | 1 | 236 to 236 |
| `wrecked_motorbike` | 1 | 136 to 136 |

## boats (`assets/shaped/boats.js`, version 1)

Same form as the machines pack (read its header): parts[name] at rest, rig[name] (parent, pivot, turn or slide, range, rest), clips, notes, paint[name] for the BODY colour slot. Metres, Y up, the bow faces +Z, the origin is at the water line under the middle of the boat: the hull goes below y = 0 by its draught (info in `draught`), so set the boat's y to the water height.
`seats[name]` are sitting points [x, y, z] (the first is the helm or the paddler), `helm[name]` is where the wheel or tiller is, and `buoy[name]` is how many survivors it carries before it sinks to the gunwale. No wheels: boats are pushed by `motor` (its `prop` spins about Z), `oar_l` / `oar_r` (sweep about Y), `paddle` (roll about Z), or the wind (`sail`, `boom` turn about Y).

Models: `kayak`, `canoe`, `paddleboard`, `rowboat`, `jon_boat`, `bass_boat`, `pontoon_boat`, `runabout`, `fishing_boat`, `jet_ski`, `sailing_dinghy`, `houseboat`, `ferry_barge`, `inflatable_raft`, `log_raft`, `barrel_raft`, `wake_v`, `bow_wave`, `prop_wash`, `splash_ring`

Draw as the machines pack (BODY = paint[name]; parts outward from the body; subtract each pivot, apply the value), but there are no wheels. Put the water line at y = 0 and the boat's y at the water height under it. The bow is +Z. Drive: motor boats turn `motor` about Y to steer and spin `prop` about Z; row `oar_l` and `oar_r` together; paddle boats sweep or roll `paddle`; the sailing dinghy swings `sail` and `rudder`. Pitch and roll the whole boat a little with the waves (rx and rz are not supported by shaped pieces, so tilt the object, not the piece), and bob it by about 0.04 m. Capacity is buoy[name] survivors; over it the boat sits to the gunwale and ships water. Show wake_v behind a boat above walking pace, bow_wave at the bow above 4 m/s, prop_wash under a running outboard, splash_ring where something falls in. Placement: kayaks, canoes, jon boats and rowboats at docks, boat ramps and on lake and river banks; pontoons, runabouts, bass boats and jet skis at marinas and big-lake docks; the fishing boat and houseboat at the biggest marinas; rafts crafted by the player; the ferry barge on a rope at an unbridged river crossing.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `kayak` | 1 | 156 to 156 |
| `canoe` | 1 | 440 to 440 |
| `paddleboard` | 1 | 108 to 108 |
| `rowboat` | 1 | 460 to 460 |
| `jon_boat` | 1 | 420 to 420 |
| `bass_boat` | 1 | 340 to 340 |
| `pontoon_boat` | 1 | 556 to 556 |
| `runabout` | 1 | 276 to 276 |
| `fishing_boat` | 1 | 384 to 384 |
| `jet_ski` | 1 | 132 to 132 |
| `sailing_dinghy` | 1 | 378 to 378 |
| `houseboat` | 1 | 532 to 532 |
| `ferry_barge` | 1 | 184 to 184 |
| `inflatable_raft` | 1 | 160 to 160 |
| `log_raft` | 1 | 292 to 292 |
| `barrel_raft` | 1 | 308 to 308 |
| `wake_v` | 1 | 4 to 4 |
| `bow_wave` | 1 | 14 to 14 |
| `prop_wash` | 1 | 92 to 92 |
| `splash_ring` | 1 | 88 to 88 |

## vehiclekit (`assets/shaped/vehiclekit.js`, version 1, with `assets/shaped/vehiclefit.js`)

What is in it
  models.tyres / models.rims / models.bike_wheels   wheel sets, each modelled with radius 1 and width 1 (see 'rule')
  models.parts                                      bolt-on parts: roof racks, bumpers, bed caps, motors, canopies, baskets ...
  tyreInfo, rimInfo, bikeWheelInfo, partInfo        what each is: size factors, grip on each ground, the mount slot it fits, its size, tags, stats
  vehicles                                          every vehicle, bike and boat: its wheels, paint colours and mounts (named places a part bolts to)
  presets                                           ready-made loadouts for spawning variety (and for the album)
  rule                                              how to draw a customised vehicle (assets/shaped/vehiclefit.js does it for you)

Tyres: `road`, `all_terrain`, `mud_terrain`, `snow`, `snow_chains`, `slick`, `heavy`, `sand`, `military`, `solid`. Rims: `steel`, `steel_rust`, `alloy5`, `alloy_dark`, `chrome_dish`, `beadlock`, `wire`. Bike wheels: `road`, `gravel`, `mtb`, `fat`, `moto_road`, `moto_knobby`.

Parts (191): `roof_bars_S`, `roof_bars_M`, `roof_bars_L`, `roof_bars_XL`, `roof_bars_XXL`, `roof_basket_M`, `roof_basket_L`, `roof_basket_XL`, `roof_box_S`, `roof_box_M`, `roof_box_L`, `roof_box_XL`, `roof_ladder_L`, `roof_ladder_XL`, `roof_ladder_XXL`, `roof_luggage_M`, `roof_luggage_L`, `roof_luggage_XL`, `roof_luggage_XXL`, `roof_tarp_M`, `roof_tarp_L`, `roof_tarp_XL`, `roof_tarp_XXL`, `roof_spare_tyres`, `roof_jerry_cans`, `roof_kayak`, `roof_canoe`, `roof_tent_L`, `roof_tent_XL`, `light_bar_white_S`, `light_bar_amber_S`, `light_bar_white_M`, `light_bar_amber_M`, `light_bar_emergency_M`, `light_bar_white_L`, `light_bar_amber_L`, `light_bar_emergency_L`, `beacon_amber`, `beacon_red`, `beacon_blue`, `taxi_sign`, `roof_spotlights`, `antenna_cb`, `radio_mast`, `stripes_roof_white`, `stripes_roof_black`, `hood_scoop_S`, `hood_scoop_M`, `hood_spare`, `bull_bar_S`, `bull_bar_lights_S`, `bull_bar_M`, `bull_bar_lights_M`, `bull_bar_L`, `bull_bar_lights_L`, `push_bar_S`, `push_bar_M`, `push_bar_L`, `winch_bumper_S`, `winch_bumper_M`, `winch_bumper_L`, `grille_guard_M`, `grille_guard_L`, `snow_plough_M`, `snow_plough_L`, `ram_bumper_M`, `ram_bumper_L`, `brush_guard_S`, `tow_hitch`, `rear_bumper_S`, `rear_bumper_M`, `rear_bumper_L`, `spare_door`, `rear_jerry_rack`, `salt_spreader`, `running_board_S`, `rock_slider_S`, `running_board_M`, `rock_slider_M`, `running_board_L`, `rock_slider_L`, `fender_flare_S`, `fender_flare_M`, `fender_flare_L`, `fender_flare_XL`, `mud_flap`, `snorkel_S`, `snorkel_M`, `snorkel_L`, `stripe_side_white`, `stripe_side_black`, `stripe_side_red`, `bed_cap_S`, `bed_cap_M`, `bed_cap_L`, `bed_cover_S`, `bed_cover_M`, `bed_cover_L`, `bed_rack_S`, `bed_rack_M`, `bed_rack_L`, `bed_rack_XL`, `bed_roll_bar`, `bed_roll_bar_lights`, `bed_toolbox`, `bed_tank`, `load_barrels_S`, `load_barrels_M`, `load_barrels_L`, `load_barrels_XL`, `load_crates_S`, `load_crates_M`, `load_crates_L`, `load_crates_XL`, `load_hay_S`, `load_hay_M`, `load_hay_L`, `load_hay_XL`, `load_firewood_S`, `load_firewood_M`, `load_firewood_L`, `load_firewood_XL`, `load_scrap_S`, `load_scrap_M`, `load_scrap_L`, `load_scrap_XL`, `load_tarp_S`, `load_tarp_M`, `load_tarp_L`, `load_tarp_XL`, `camper_shell`, `exhaust_stacks`, `headache_rack`, `beacon_bar_L`, `floodlight_mast`, `toolbox_side_S`, `toolbox_side_M`, `fuel_tank_side`, `roof_bars_C`, `roof_lights_C`, `outboard_S`, `outboard_S_prop`, `outboard_M`, `outboard_M_prop`, `outboard_L`, `outboard_L_prop`, `outboard_twin`, `outboard_twin_prop`, `trolling_motor`, `bimini_S`, `bimini_M`, `bimini_L`, `t_top`, `windscreen`, `cuddy_hatch`, `seat_helm`, `seat_bench`, `cooler`, `fuel_tank_boat`, `storage_crate`, `tackle_box`, `anchor_bow`, `nav_lights`, `spotlight_boat`, `swim_ladder`, `flag_pole`, `fender_buoys`, `rod_holders`, `life_ring`, `crab_pots`, `net_drum`, `sail_flag`, `bike_basket_front`, `bike_basket_rear`, `bike_rack_rear`, `bike_rack_front`, `panniers`, `bike_trunk`, `child_seat`, `bike_fender`, `bike_light_front`, `bike_light_rear`, `kickstand`, `bike_bottle`, `bike_bell`, `moto_screen`, `saddlebags`, `crash_bars`, `quad_rack_front`, `quad_rack_rear`, `quad_winch`

Vehicles with mounts: 53. Presets: 21.

Draw a vehicle in its own pack, then dress it. (1) Wheels: for each wheel point draw the chosen tyre scaled (w*wMul, r*rMul, r*rMul) and the rim scaled (w*wMul, r*rMul*rimFrac, ...) at the point (the left side turned half a turn about y so the rim face shows outward). If the new tyre radius is bigger than the stock radius, lift the whole body and every body-group part by lift = max(0, 2*(rNew - r) - archClear + 0.02), and put the wheel centres at y = rNew. (2) Parts: each part names a slot; the vehicle's mounts[slot] gives pos, w, d, anchor offsets (anchor front: z + d/2, rear: z - d/2). A part fits if part.w <= mount.w and part.d <= mount.d (pillar: part.hMax <= mount.hMax; arch: part.rCap >= tyre radius). One part per slot. Mirror parts are modelled for the right side: draw with scale.x = -1 for the left. Group 'bonnet' parts open with the bonnet; 'bed' parts tip with the bed. (3) Paint: override the vehicle's paintSlots colours; parts that use BODY take the body colour. assets/shaped/vehiclefit.js does all of this.

| Group | Models | Triangles (smallest to largest) |
| --- | --- | --- |
| `parts` | 191 | 2 to 520 |
| `tyres` | 10 | 76 to 132 |
| `rims` | 7 | 86 to 108 |
| `bike_wheels` | 6 | 168 to 232 |

## audio (`assets/audio/`, made in code)

Sound effects and music for sections 9, 10.6 and 11.11, synthesised by `assets/audio/src/make_audio.py` (numpy, scipy and ffmpeg; no samples, nothing to license). Same form as `assets/sounds.js`: small mono MP3s stored as text so they load from a drive.

- `assets/audio/sounds_design.js` adds keys to `window.ART.sounds` (each a list of 1 to 4 variations), so `sfx(name, ...)` plays them once the file is loaded after `assets/sounds.js`. Loops (`generator_hum`, `rain_roof`, `rain_outside`, `fire_crackle`) are cut to repeat seamlessly: play them with `loop = true`.
- `assets/audio/music_<name>.js` sets `window.ART.music[name]` (one MP3) and `window.ART.musicLoop[name]` (its length in seconds). `day` (calm, 84 bpm), `night` (a low drone with sparse bells), `horde` (drums and a minor riff, 132 bpm) and `base` (warm and slow) are two-minute seamless loops: decode, set `loop = true`, `loopStart = 0`, `loopEnd = musicLoop[name]` (that skips the MP3 padding). `chase` is a five-second sting. Load each file only when it is needed.
- `assets/audio/sounds_content.js` (made by `assets/audio/src/make_sounds_content.py`) adds the content-request set: `step_grass`, `step_road`, `step_wood`, `step_tile`, `step_carpet`, `step_water`, `hit_fist`, `hit_bat`, `hit_blade`, `glass_smash`, `door_open`, `door_close`, `door_smash`, `cloth_rustle` and `metal_clang`, plus (26 October) `step_snow`, `hurt_body`, `plank_knock`, `stone_clack`, `tin_ping`, `creak_wood`, `latch_click`, `pick_up_item` and `swing_air`, each a list of 2 to 4 variations, 0.15 to 1.3 s, mono. Load it after `sounds_design.js`.
- `assets/audio/preview.html` plays everything.

Sound keys: `jump_grunt`, `land_grass`, `land_road`, `land_wood`, `land_metal`, `step_gravel`, `swing_wood`, `swing_metal`, `hit_wood`, `hit_metal`, `pan_clang`, `umbrella_flap`, `gun_pistol`, `gun_rifle`, `gun_shotgun`, `dry_click`, `reload_click`, `mag_in`, `gun_rack`, `bolt_cycle`, `shell_insert`, `arrow_release`, `arrow_thunk`, `crossbow_shot`, `flare_pop`, `alien_swarmer_idle`, `alien_swarmer_notice`, `alien_swarmer_attack`, `alien_swarmer_die`, `alien_stalker_idle`, `alien_stalker_notice`, `alien_stalker_attack`, `alien_stalker_die`, `alien_giant_idle`, `alien_giant_notice`, `alien_giant_attack`, `alien_giant_die`, `alien_spitter_idle`, `alien_spitter_notice`, `alien_spitter_attack`, `alien_spitter_die`, `alien_clinger_idle`, `alien_clinger_notice`, `alien_clinger_attack`, `alien_clinger_die`, `door_slam`, `door_creak`, `drawer`, `lid`, `furniture_drag`, `generator_hum`, `rain_roof`, `rain_outside`, `fire_crackle`, `wood_crack`, `brick_crumble`, `concrete_crack`, `steel_bend`, `glass_break`, `car_crash_light`, `car_crash_heavy`, `plug_in`, `breaker_trip`, `klaxon`, `plant_start`, `power_on_hum`, `sting_night`, `sting_dawn`.

## UI icons (`assets/ui/`)

Survivor portraits (`portraits/<look>.png`, rendered from the survivor pack). Buttons (`jump`, `build`, `back`), `damage_arrow` (points up: turn it towards the hit), the status set (`bleeding`, `infected`, `broken_leg`, `wet`, `cold`, `hot`, `hungry`, `thirsty`, `tired`, `sick`) and `low_health_vignette.svg` (stretch over the screen, fade in under a quarter health). Inventory icons: harvest materials (`planks`, `scrap_wood`, `lumber`, `nails_handful`, `steel_beam`, `rebar_bundle`, `sheet_metal`, `concrete_chunk`, `brick`, `glass_sheet`, `wire_coil`, `plasterboard_scrap`), guns (`pistol`, `revolver`, `hunting_rifle`, `pump_shotgun`, `double_barrel`, `carbine`, `flare_gun`, `recurve_bow`, `crossbow`) and ammo (`pistol_ammo`, `rifle_ammo`, `shotgun_shells`, `arrows`, `crossbow_bolts`, `ammo_can`, `magazine`, `flare_shells`). 128 by 128 SVG in the weapons icons' field-journal style; `assets/ui/preview.html` shows them all. Made by `assets/shaped/src/ui_icons.py`.
