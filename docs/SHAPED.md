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
- **Preview:** `art-tests/album.html` shows every pack (survivors, clothes, aliens, the building kit, a street by day and night, damage, items, furniture, garden, street props and vehicles); `art-tests/survivor-creator.html` is the creator preview.

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
| bottoms | `cargo_trousers` | 108 / 216 / 76 | 108 / 216 / 76 |
| bottoms | `capri_trousers` | 80 / 160 / 60 | 80 / 160 / 60 |
| bottoms | `track_pants` | 96 / 192 / 72 | 96 / 192 / 72 |
| bottoms | `rolled_jeans` | 108 / 216 / 76 | 108 / 216 / 76 |
| worn | `sweater` | 144 / 288 / 100 | 144 / 288 / 100 |
| worn | `coat` | 130 / 260 / 96 | 130 / 260 / 96 |
| worn | `raincoat` | 136 / 272 / 94 | 136 / 272 / 94 |
| worn | `leather` | 141 / 287 / 101 | 141 / 287 / 101 |
| worn | `trousers` | 132 / 264 / 92 | 132 / 264 / 92 |
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

The survivors' shape language turned wrong: flat planes and points, wrong-way joints, drab bodies, glowing eyes and vents. Our own designs **and our own rigs**, replacing the Bestiary models and skeletons. Our own alien designs and rigs, replacing the Bestiary stand-ins and their skeletons. Each has bones (pivot, tip, parent), parts per bone, and clips (idle, walk, attack, dead, as the game uses today): per frame, rotations in degrees [x, y, z] about each bone pivot (order X, then Y, then Z, child bones carried along). The game can bake each frame into a pose, as it does for the Bestiary models today, and play walk at about 4 frames a second, faster for the swarmer. Eyes, vents and seams are separate pieces marked glow:true: draw them unlit (emissive).

| Alien | Height | Bones | Tris, verts, welded | What it is |
| --- | --- | --- | --- | --- |
| `swarmer` | 0.9 m | 12 | 192 / 452 / 149 | Small, numerous, weak alone. About 0.9 m tall and 1.65 m long, four spider legs with knees above the back, a tail spike. |
| `stalker` | 2.2 m | 15 | 252 / 592 / 167 | Rare hunter, about 2.2 m hunched (2.7 m upright). Legs bend the wrong way, arms end in bone blades below the knee, a ragged cloak of skin. |
| `giant` | 4.0 m | 13 | 334 / 724 / 226 | Huge and rare, about 4 m tall on its knuckles and 2.9 m wide at the shoulders. A tiny head with three eyes, glowing vents down its back. |
| `nest` | 2.4 m | 1 | 252 / 580 / 188 | Takes over buildings and spreads. Placed at a doorway or against a wall (-Z); seams glow and pulse at night. |

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

| Template (whole building) | Tris, verts, welded |
| --- | --- |
| `timber_house` | 1,926 / 3,856 / 1,436 |
| `brick_shop` | 1,720 / 3,440 / 1,040 |
| `concrete_flats` | 5,308 / 10,616 / 3,116 |
| `corner_store` | 1,978 / 4,136 / 1,172 |

## props (`assets/shaped/props.js`, version 1)

Same language as the survivors and buildings: rectangular frustums and boxes, flat colour planes, few corners, points
instead of caps. Every model sits on the ground at its origin (pivot = centre of its base), faces +Z, metres.
Moving parts (doors, lids, wheels) are separate entries in 'moving' with their hinge or axle so the game can turn them.
Vehicles are boxy 1970s to 1990s shapes, worn: rust patches, a cracked windscreen, mismatched panels.
Pieces marked glow:true are lamps and lit screens.

Vehicles are split as the game asked: `models.vehicles[name]` has `body`, `bonnet` and one `wheel`; `vehicleRig[name]` gives the wheel positions, the bonnet hinge and their axes. garden_plot is the empty bed; draw garden_sprouting, garden_growing or garden_ripe on top of it for the plot's stage. rain_barrel is the rain collector. `moving` lists other parts that open (doors, lids) and their hinges.

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
| plants | `oak` | 164 / 348 / 96 |
| plants | `pine` | 52 / 120 / 36 |
| plants | `bush` | 54 / 120 / 33 |
| plants | `dead_tree` | 36 / 88 / 28 |
| plants | `grass_tuft` | 30 / 80 / 25 |
| plants | `rock` | 24 / 68 / 16 |
| vehicles | `hatchback.body` | 126 / 252 / 108 |
| vehicles | `hatchback.bonnet` | 12 / 24 / 8 |
| vehicles | `hatchback.wheel` | 48 / 84 / 28 |
| vehicles | `sedan.body` | 124 / 248 / 104 |
| vehicles | `sedan.bonnet` | 12 / 24 / 8 |
| vehicles | `sedan.wheel` | 48 / 84 / 28 |
| vehicles | `pickup.body` | 190 / 380 / 130 |
| vehicles | `pickup.bonnet` | 12 / 24 / 8 |
| vehicles | `pickup.wheel` | 48 / 84 / 28 |
| vehicles | `van.body` | 72 / 144 / 62 |
| vehicles | `van.bonnet` | 12 / 24 / 8 |
| vehicles | `van.wheel` | 48 / 84 / 28 |
| garden | `rain_barrel` | 120 / 228 / 84 |
| garden | `garden_plot` | 60 / 120 / 40 |
| garden | `garden_sprouting` | 108 / 288 / 54 |
| garden | `garden_growing` | 162 / 360 / 99 |
| garden | `garden_ripe` | 378 / 792 / 243 |
