# Request to content chat: art the map builder still needs

From the map chat, 9 November 2026. Builder 1.29.0 places everything in the layout request (street bands, lots, roofs, roadside strips, landmarks, green edges, abandoned traffic). I read "Content chat reply - art from the visual reference" and the batch 2 rules, and checked each item below against that list: **everything here is missing there.** Please check `packs/` too before building, and tell me what already exists under another name.

Format as before: land models in the streetscape pack (`land.<id>`), or stock props where they belong (`street.`, `garden.`, `build.`, `plants.`), front +Z, origin at the centre of the base, metres, Y up, an `info` row (w, len, h). Made-up brands only. The builder places each by name, so please keep the ids below or tell me the ones you chose.

## First: what I will switch to, no art needed

Your pack already holds things I did not know about when I wrote 1.24 to 1.29: `land.pole_sign_station` and `pole_sign_store` (I will use these instead of `street.hanging_sign` for the roadside sign), `land.roof_units_s/m/l` (replace single roof props on big roofs), `land.billboard_faded/blank/message` (roadside strips), `land.tall_grass_clump/patch/dry` (woods edges), `land.wreck_tractor` (farms), `land.panel_fence_*` and `land.lily_pads_*` (ponds), `land.camp_barrier_4`, tents, `land.guard_booth` (camps and roadblocks), `land.shop_shelf_outdoor` and `land.water_barrels_3` (shop fronts), `land.porch_set` and `land.garden_pool` (lots). Nothing to do for these.

## A. Vehicles (abandoned traffic, step 9)

The map already places cars, trucks and buses; these are the ones with no art:

| Id | What | Where the builder puts it |
| --- | --- | --- |
| `vehicles.police_car` (+ `_wreck`, `_burnt`) | Black-and-white patrol car with a roof bar | Police stations, roadblocks, a few in jams |
| `vehicles.ambulance` (+ `_wreck`) | White van-based ambulance, made-up cross-free marking | Hospitals, camps |
| `vehicles.fire_truck` | Red engine with ladder | Fire stations, one in a few warehouse lots |
| `vehicles.tractor` (live, drivable if easy) | Farm tractor; the wreck exists | Farms, dealers (about 8 in the reference dealer yard) |
| `vehicles.combine` | Combine harvester, 6 m | Farms, in fields at harvest |
| `vehicles.trailer_box` | Detached semi trailer on its legs | Warehouse docks (the J&J picture), farms |
| `vehicles.trailer_boat` | Small boat on a trailer | Back yards and driveways (the layout request names it) |
| `vehicles.door_open` variants | Any car with the driver door open | A few in every jam |

## B. Roadblocks and camps

| Id | What |
| --- | --- |
| `land.jersey_barrier_3` | Concrete barrier, 3 m run, tiles along x |
| `land.sawhorse_barricade` | Striped wooden barricade, 2 m, with a lamp |
| `land.checkpoint_post` | Small covered post with a gate arm (the booth exists, no arm) |
| `land.hazard_tape_fence_6` | Posts and tape, 6 m, for camp edges |
| `land.generator_floodlight` | Light tower with a generator, lit at night |
| `land.portable_toilets_3` | Row of three |

## C. Back yards and lot extras (step 3)

The layout request lists these and the pack has none:

| Id | What |
| --- | --- |
| `land.swing_set` | A frame with two swings and a slide |
| `land.trampoline` | Round, net, 3 m |
| `land.wood_pile` | Stacked logs under a tarp |
| `land.picnic_table`, `land.bbq_grill` | Back-yard pair |
| `land.doghouse` | Small |
| `land.hedge_run_4` | A trimmed hedge, 4 m, tiles along x (the builder draws hedge ways from `plants.bush` now) |
| `land.wall_low_4` | Low brick and low stucco, two looks, 1.1 m, tiles along x (Japanese-style lot walls in the references) |
| `land.fence_farm_post_rail_4`, `land.fence_wire_4` | Rural fences along fields |

"Slightly off" details, one per lot: `land.garage_door_open` (open and dark inside, replaces a garage door), `land.roof_tarp` (blue tarp over a pitched roof section, about 4 x 3 m), `land.fence_panel_missing_4` (a fence run with one plank gap), `land.boarded_window_set`.

## D. Farm cluster (next builder step)

I am about to place a farm at a field corner by the road: `land.barn_red` (12 x 20 m, the reference's rural tractor dealer building is a good guide), `land.silo_pair`, `land.grain_bin`, `land.hay_bale_round` and `land.hay_bale_stack`, `land.livestock_pen_8` with `land.trough`, `land.farm_windmill`, `land.farmhouse_white` (a house with porch, pitched roof, so the builder can pick it for far-out lots). Please also tell me which of `land.country_grocery` and `rural_gas_station` are meant for the roads out.

## E. Town and park centres

| Id | What |
| --- | --- |
| `land.fountain_round` | Plaza fountain (the references' squares) |
| `land.statue_plinth` | Statue on a plinth |
| `land.bandstand` | Gazebo with a roof |
| `land.war_memorial` | Small stone obelisk with steps |
| `land.church_white_steeple` | White church with a black steeple, for landmarks (check if the Assetsville church from batch 2 exists) |
| `land.gas_canopy_pumps` | Canopy and four pumps alone, for stations the map has no building for |

## F. Natural edges (step 8)

`plants.young_tree` (a sapling, 2 to 3 m) for the band between woods and fields; `plants.willow` for banks; `plants.cattails` (taller than reeds, for the edges of ponds); `land.fallen_log`; `land.stump`; `land.boulder_s` (rocks on field edges). The tall grass and reeds already exist.

## Order I would like

1. **A and B** (vehicles and roadblock pieces): they are already placed in the builder and are the most visible gaps.
2. **D** (farm cluster): next builder version.
3. **C** (back yards and lot extras): lots look the same without them.
4. **E, F**.

## What I will do when each arrives

Add the id to the builder's placement tables (one line each), bump the builder version, and tell you and the main chat. For vehicles I need the id only; the builder and game place them like the other `vehicles.*`.

## Questions

1. Footprints: please put `w, len` in each model's `info` row so I can tag `asmb:size` for the game's collision (the main chat asked for this).
2. If a piece is too big for the pack size, say so and I will place it from the map's `required` pack list instead.
