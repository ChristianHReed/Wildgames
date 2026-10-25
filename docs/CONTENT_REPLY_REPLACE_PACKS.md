# Content chat reply: third-party art replaced (for game 0.94.1)

Answers `docs/CONTENT_REQUEST_REPLACE_PACKS.md`. Pushed to main (commit a50ec5b). Full table with what the game can delete: `docs/ART_REQUESTS.md`, "12 delivered". Previews: the album, scenes "Trees and plants", "Pickup truck parts", "Furniture set 2".

## 1. Trees and plants: `assets/shaped/flora.js`
- `models.plants.<name>` near (42 to 246 triangles) and `models.far.<name>` far (24 to 50 triangles, same name, same size).
- Trees: oak 11 m, maple 9, sycamore 13, poplar 14, cedar 7.5, pine 15. Oak, maple, sycamore and poplar also as `<kind>_fall`. Every tree has three shapes: `<kind>`, `<kind>_b`, `<kind>_c`. Pick one by hashing the position.
- Bushes and grass: `bush` 1.3, `bush_small` 0.8, `shrub` 1.1 (the `_b` shrub has berries), `grass_tuft` 0.35, `grass_tall` 0.6, three shapes each.
- `info[name]` = height, variants, far model. Colours are named in the palette, no slots.
- Already in `props.plants` and unchanged: flowers (3), fern, mushrooms, rock, `fallen_log`, `stump`, birch, willow, reeds, bramble, dead_tree.

## 2. Pickup truck: `props.vehicles.pickup` (5.5 m by 1.9 m, already ours)
New: `door_l` (driver's door, hinge `vehicleRig.pickup.doorHinge`, about y), `door_gap` (draw over the body when the door is off), `items.tyre_loose` and `items.tyre_loose_flat`. `pickup_wreck` and `pickup_burnt` have the door and gap in their states too. Damage states for the body and bonnet already existed. Front wheels steer about y (up to 30 degrees), all four spin about x (`vehicleRig.pickup.steerRule`).

## 3. Furniture: `assets/shaped/furniture2.js`, `models.furniture.<name>`
chair_stool, k_stool, cabinet_medium, cabinet_medium_decorated, cabinet_small_decorated, cactus_medium_A, k_basin, k_night, k_bunk, k_plant, k_rug, k_washer, k_coat. Footprints follow `tools/out/models.txt` (small overhangs on the basin and washer front).

## 4. Sound: `assets/audio/sounds_content.js` (load after `sounds_design.js`)
`step_grass`, `step_road`, `step_wood`, `step_tile`, `step_carpet`, `step_water` (4 variations, 0.16 to 0.35 s); `hit_fist`, `hit_bat`, `hit_blade` (3 each); `glass_smash`, `door_open`, `door_close`, `door_smash`, `cloth_rustle`, `metal_clang` (3 to 4 each, up to 1.3 s). Mono, made in code (`assets/audio/src/make_sounds_content.py`). New key names, nothing existing overwritten.

## Can come out once wired
Kenney Nature Kit trees, bushes and grass, Car Kit, the thirteen Furniture Kit entries, Impact Sounds and RPG Audio, plus their CREDITS.md lines. Not touched: the Quaternius skeleton and clips.
