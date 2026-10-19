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

Vehicles are split as the game asked: `models.vehicles[name]` has `body`, `bonnet` and one `wheel`; `vehicleRig[name]` gives the wheel positions, the bonnet hinge and their axes. garden_plot is the empty bed; draw garden_sprouting, garden_growing or garden_ripe on top of it for the plot's stage. rain_barrel is the rain collector. containers holds every searchable container twice: <name> closed and <name>_searched (doors open, drawer out, lid up, fewer things inside). build holds things players make and place; barricade has three stages (barricade, barricade_damaged, barricade_nearly_gone); campfire and generator have lit/running and out/off versions. glow pieces are flames, embers and lamps. Every vehicle also comes as <name>_wreck (rusted, flat tyres, broken glass) and <name>_burnt (charred shell on bare rims); lower them by vehicleRig[...].sitDrop. Every piece here hinges at the origin: doors and shutters about the y axis (the leaf runs to +X), lids about the x axis (the lid runs to +Z). garage_door rolls up instead: slide its five slats up one after another and lay them flat under the ceiling. `moving` lists other parts that open (doors, lids) and their hinges.

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
| vehicles | `hatchback.body` | 128 / 256 / 112 |
| vehicles | `hatchback.bonnet` | 12 / 24 / 8 |
| vehicles | `hatchback.wheel` | 48 / 84 / 28 |
| vehicles | `hatchback.boot` | 12 / 24 / 8 |
| vehicles | `sedan.body` | 126 / 252 / 108 |
| vehicles | `sedan.bonnet` | 12 / 24 / 8 |
| vehicles | `sedan.wheel` | 48 / 84 / 28 |
| vehicles | `sedan.boot` | 12 / 24 / 8 |
| vehicles | `pickup.body` | 190 / 380 / 130 |
| vehicles | `pickup.bonnet` | 12 / 24 / 8 |
| vehicles | `pickup.wheel` | 48 / 84 / 28 |
| vehicles | `pickup.battery` | 36 / 72 / 20 |
| vehicles | `pickup.fuel_cap` | 20 / 36 / 12 |
| vehicles | `pickup.hub` | 20 / 36 / 12 |
| vehicles | `van.body` | 72 / 144 / 62 |
| vehicles | `van.bonnet` | 12 / 24 / 8 |
| vehicles | `van.wheel` | 48 / 84 / 28 |
| vehicles | `hatchback_wreck.body` | 126 / 252 / 108 |
| vehicles | `hatchback_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `hatchback_wreck.wheel` | 48 / 84 / 28 |
| vehicles | `hatchback_burnt.body` | 126 / 252 / 108 |
| vehicles | `hatchback_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `hatchback_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `sedan_wreck.body` | 124 / 248 / 104 |
| vehicles | `sedan_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `sedan_wreck.wheel` | 48 / 84 / 28 |
| vehicles | `sedan_burnt.body` | 124 / 248 / 104 |
| vehicles | `sedan_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `sedan_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `pickup_wreck.body` | 190 / 380 / 130 |
| vehicles | `pickup_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `pickup_wreck.wheel` | 48 / 84 / 28 |
| vehicles | `pickup_burnt.body` | 190 / 380 / 130 |
| vehicles | `pickup_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `pickup_burnt.wheel` | 20 / 36 / 12 |
| vehicles | `van_wreck.body` | 72 / 144 / 62 |
| vehicles | `van_wreck.bonnet` | 12 / 24 / 8 |
| vehicles | `van_wreck.wheel` | 48 / 84 / 28 |
| vehicles | `van_burnt.body` | 72 / 144 / 62 |
| vehicles | `van_burnt.bonnet` | 12 / 24 / 8 |
| vehicles | `van_burnt.wheel` | 20 / 36 / 12 |
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

**Grip:** Weapon origin goes here (survivor pack model space, rest pose); weapon axes = survivor axes at rest, so it points forward (+Z) out of the fist. Position [-0.212, 0.837, 0.026] on `hand_r`. Two-handed: `hockey_stick`, `garden_rake`, `broom_spear`, `hunting_rifle`, `pump_shotgun`, `double_barrel`, `carbine`, `crossbow` (Two-handed weapons (hockey stick, garden rake, broom spear): same grip; the left hand reaches to the weapon at offhandAt metres along +Z when the clip allows.) **States:** new above a quarter condition, worn under a quarter, broken when it snaps (the stub stays in the hand until dropped). **First person:** the weapon goes at `fpWeapon` ([-0.2, -0.26, 0.45], rotation [-38, 10, 0] degrees) with the arms in `models.fp.hold`.

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

**Survivor clips** (in `survivor.js`, `clips`): `jump` (3), `airborne` (1), `land` (2), `hurt` (2), `drink` (3), `bandage` (3), `pickup` (3), `attack_chop` (3), `attack_thrust` (3), `attack_swing` (3), `sit` (1), `lean_wall` (1), `wave` (3), `carry_crate` (4). Each clip is a list of frames; a frame maps bone to [x, y, z] degrees, turned about that bone's pivot on top of the rest pose, in the order X, then Y, then Z, with children carried along (forward kinematics). Axes are the pack's at rest: for a limb hanging down, negative X swings it forward and positive X back; for the spine, positive X bends forward; positive Z swings the left arm out, negative Z the right arm out (both are mirrored already). "root" is not a bone: it moves the pelvis by [x, y, z] metres. Bones not listed stay at rest. Suggested speed: jump 0.25 s for all three frames, land 0.3 s, hurt 0.25 s, drink 1.4 s, bandage 2 s looping the middle frames, pickup 0.7 s, attacks 0.45 s (wind-up, strike, follow-through).

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
Decals (puddle, ice, crack, pothole) sit 1 cm above whatever they are on. The kerb is a real 15 cm kerb, 2 m long. kerb_strip: the road side is +Z (the gutter strip lies on the road), the pavement side -Z; tops at 15 cm.

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
| `kerb.kerb_strip` | 16 / 32 / 16 |

## UI icons (`assets/ui/`)

Buttons (`jump`, `build`, `back`), `damage_arrow` (points up: turn it towards the hit), the status set (`bleeding`, `infected`, `broken_leg`, `wet`, `cold`, `hot`, `hungry`, `thirsty`, `tired`, `sick`) and `low_health_vignette.svg` (stretch over the screen, fade in under a quarter health). 128 by 128 SVG in the weapons icons' field-journal style; `assets/ui/preview.html` shows them all. Made by `assets/shaped/src/ui_icons.py`.
