# Streetscape pack (afterstreet-streetscape)

Reply to the main chat's "Request to content chat: art from the visual reference" (8 November 2026). Built by `node workshop/tools/make_streetscape.js` into `packs/afterstreet-streetscape.js` (about 390 KB, 50 land models, listed in `packs/index.js`). Everything is under 800 triangles; the whole set is about 7,000. Made-up brands only, blank sign panels, no real marks. The pictures were used as a description of the feel, never traced.

All models are land models: `SHAPED.land.models.land[<id>]` with an `info` row (w, len, h, note). Origin is the centre of the base, front is +Z, metres, Y up.

## Wires between poles (how the game draws them)

The stock `power_pole` (street group, 8.5 m, crossarm along its local X at y = 7.87 m) carries four insulators at x = -0.9, -0.3, +0.3, +0.9, tops at y = 8.06 m. Draw one wire per insulator pair across each span:

- Attach at (x, 8.06, 0) of each pole, in the pole's own turned frame.
- One strip per wire, 3 cm wide, colour `#2a2a2c`, facing the camera (or two crossed strips); no thickness.
- Sag as a parabola: drop = span / 50 at the middle (a 30 m span sags 0.6 m). Five to seven segments is enough.
- The builder places poles along the verge band; the wires follow with no extra models. A pole that ends a line gets no wire on the open side.

No new pole model is needed.

## What was made (grouped by where the map chat can place it)

**Roofs (A):** `roof_units_s` (3 x 3 m: air conditioner, vent, hatch, pipe), `roof_units_m` (5 x 5 m: two air conditioners, vents, hatch with ladder, duct, dish, control box), `roof_units_l` (8 x 8 m: four air conditioners, wooden water tank, ducts, vents, hatch, ladder, dish). Place at y = 0 on the roof surface, rotated by quarter turns; pick by free roof area.

**Fire escapes (A):** `fire_escape_floor_3` and `fire_escape_floor_3_mirror`: one storey (3 m), landing 2.4 x 1.2 m with rail, a steep stair along the wall to the next landing. Stack one per floor and alternate the mirror piece so the stairs zigzag. Wall side at z = 0, platform toward +z. Each carries a `stairs` point for climbing later. `fire_escape_drop_ladder`: the 3 m ladder to the pavement.

**Street furniture (A):** `guard_booth`, `phone_stand` (lit panel), `burning_barrel` (points `fire` and `fire_emit` for the flame and a warm point light about 8 m, `smoke`), `wheelie_bins_pair`.

**Ground wear (B):** `oil_stain_decal`, `wheel_track_decal_4` (tiles along z), `worn_path_decal_4` (tiles along z), `crack_weeds_decal`: flat quads 2 cm above the ground. `tall_grass_clump` (0.9 m), `tall_grass_dry` (1.1 m, for dry maps), `tall_grass_patch` (3 m, fills a verge or fence line).

**Camps (F):** `dome_tent_orange`, `dome_tent_blue`, `dome_tent_green`, `relief_tent` (white, no insignia), `camp_barrier_4` (orange fence, tiles along z). Tents have `door` points.

**Houses and roadside (D):** `dormer_window` (sits on a 35 to 45 degree roof, roof side at z = 0), `pole_sign_store` (6 m, lit blank panel), `pole_sign_station` (8 m price pole), `strip_mall` (24 x 9 m, three shops, awnings, two roof billboards), `rural_gas_station` (canopy over two old pumps, shed shop with porch, crates, tyre rack, pole sign).

**Batch 2:** `vending_lit` (glowing front, `light` point), `exit_sign_green` (blank, 4.4 m), `billboard_faded` (peeling, no words). Building sections for the builder to stack, all 8 m bays facing +z: `section_shopfront_8` (4 m, glass front, recessed door, shutter box, roof level y = 4), `section_middle_8` (3.2 m, three windows, repeat as needed), `section_cornice_8` (1.4 m, stepped cornice, parapet, roof slab). Stack order: shopfront, middle x N, cornice. `fast_food_building` (16 x 18 m with a made-up brand, drive-through window, pole sign, roof units) and `country_grocery` (porch, green tin roof, water tank, canopy over three old pumps).

**Batch 3:** Ground tiles, all 2 m: `tile_grass_flowers` (place in drifts), `tile_grass_dirt`, `tile_cobble`, `tile_plaza_paving`, `tile_sand_wet` (foam line on the +z edge, toward the water), `tile_dry_pale`. Garden bed growth, five 2 m beds that share a footprint so the game swaps them by days since planting: `crop_stage_1_seeded`, `_2_sprout`, `_3_leafy`, `_4_flowering`, `_5_ripe`. Overgrowth: `wall_vines_4` (wall side z = 0), `roof_grass_tufts` (3 m patch for roofs and old car roofs), `tree_through_roof` (4 m, 8.5 m tall).

**Batch 4:** `crashed_airliner` (60 x 38 m, tail 9 m): a twin-engine airliner broken in three in a scorched crater, middle fuselage open with a row of windows and blue seat blocks, tail with fin, one wing sheared and one torn, an engine thrown clear, debris and a ring of earth. A `door` point named `loot` sits in the middle section. Sits at ground level; the crater is a dish of earth pieces and needs no terrain cut.

## Already in the game, kept (checked by name)

Power pole, fire hydrant, mailbox, newspaper box, parking meter, dumpster, trash bin (props street); vending machine (businesses, services); air conditioner, water tank, satellite dish, roof hatch, chimney, garage door (props); bus shelter and kiosk (roadside, services); motel (roadside); water tower, lighthouse, wind turbine, billboards (roadside, towers); gantry, guard rail, sandbags (power, props, barriers); puddle (fx, ground); reeds and shrubs (flora, waterside).

## Not done yet (honest list)

- Done in `docs/PALETTES.md` (project doc "Season palettes and tree tint rules"): season, dry-summer and desert palette rows and the per-tree tint rules. The garden crop stages are one shared bed, not one per crop type.
- Porch and chimney checks on the stock houses; broken (not only faded) sign variants.
- Elevated rail section, subway entrance, cheap far wind turbine, armoured survivor vehicles (these need the Workshop chat if the remade logic requires it), parked tractor wrecks (the farm pack already has a tractor, hay wagon and flatbed; wreck versions are the open part).

## Checks

`test_install.js` passes, `roundtrip.js` reports 0 differ over 2,187 models, the pieces were looked at in the album (`art-tests/album.html#streetgrid`, new scene that draws land models from `window.__ids`), and panes are 4 cm thick or less.

## Batch 5 and 6 (visual reference 2)
- Wheat in five growth stages on one 2 m soil square each: `wheat_stage_1_seeds`, `_2_sprouts`, `_3_leafy`, `_4_green_ears`, `_5_golden`. Swap by days since planting; the golden one is the harvest stage.
- Water details, placed at water level (y = 0): `rock_in_water`, `rock_cluster_water`, `stepping_stones_5` (flat tops, 0.8 m apart, each with a white foam ring), and lily pads in three season colours: `lily_pads_green`, `lily_pads_autumn`, `lily_pads_red`.
- Batch 7: `moss_roof_cap_s` and `_m` (with a tree), `ivy_drips_4`, `panel_fence_blue/pink/brick/mixed`, `scrub_dry_tuft`, `scrub_dry_cluster`, `billboard_blank`, `billboard_message` (made-up message, no brands).
- Batch 8: `shop_shelf_outdoor`, `water_barrels_3`, `propane_cage` (loot), `lamp_light_pool` (glow decal), `shopfront_glow_4` (lit window, awning and sign), `porch_set` (steps open in the middle), `garden_pool`.
- Batch 9: corn, potato and pumpkin in five stages each (`corn_stage_1_seeds` .. `_5_ripe`, `potato_stage_*`, `pumpkin_stage_*`), same 2 m soil square as the wheat so the game swaps by days since planting.
- Batch 10: `wreck_tractor`, `sign_stop_bent`, `sign_hanging_broken`, `sign_fallen_pole` (broken signs; no real street names).
- Batch 11: `wind_turbine_far` (about 120 triangles), `elevated_rail_8m`, `elevated_rail_station_8m` (platform, bench, roof), `subway_entrance` (closed, gate across the top step).
- Not done yet: stairs from the elevated station down to the street, an open subway entrance that leads somewhere (needs the Map and Main chats), rail curves and ramps.

## Batch 12 to 16 (map chat request "art the map builder still needs")
Answer with every id, notes and the weak spots: Project doc "Content chat reply - art the map builder asked for". Pack is 144 models, about 1.6 MB.
- Batch 12 (roadblock and camp): `jersey_barrier_3`, `sawhorse_barricade`, `checkpoint_post`, `hazard_tape_fence_6`, `generator_floodlight`, `portable_toilets_3`.
- Farm machines (Workshop pack, `workshop/designs/farm.js`): `farm_tractor`, `combine`, `boat_trailer`. Armoured stock vehicles: `pickup_armoured`, `offroader_armoured`, `van_armoured`.
- Batch 13 (farm): `barn_red`, `silo_pair`, `grain_bin`, `hay_bale_round`, `hay_bale_stack`, `livestock_pen_8`, `trough`, `farm_windmill`, `farmhouse_white`.
- Batch 14 (yards and fences): `swing_set`, `trampoline`, `wood_pile`, `picnic_table`, `bbq_grill`, `doghouse`, `hedge_run_4`, `wall_low_4`, `wall_low_4_mossy`, `fence_farm_post_rail_4`, `fence_wire_4`, `garage_door_open`, `roof_tarp`, `fence_panel_missing_4`, `boarded_window_set`.
- Batch 15 (civic): `fountain_round`, `statue_plinth`, `bandstand`, `war_memorial`, `gas_canopy_pumps`, and `church_white_steeple`, built from `FLOORPLAN.gen('church')` with wood-framed walls (studs every 0.5 m, plates, headers, siding, sheathing, plaster), pews, altar, vestry and a bell tower (717 pieces, the heaviest model).
- Batch 16 (plants and ground): `young_tree`, `willow`, `cattails`, `fallen_log`, `stump`, `boulder_s`.
- Open doors on cars: no separate models; the driver door is a hinged rig part the game poses open.
- Church also has flat ceilings over the back rooms and porch and ajar interior door leaves; the nave is open to the rafters. The bell tower is hollow with three open stair flights up to the belfry floor (a `stairs` point at the foot). Not done: a per-axle wheel radius for the tractor (Workshop chat); none of batches 5 to 16 checked in the game yet.
