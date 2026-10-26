# Art still needed to finish the planned work

Written 26 October 2026, at game 0.114.8, for the content and design chat. This lists only art that a planned roadmap step needs and that is not in the game's packs. Stretch goals (docs/STRETCH.md) are not covered. Same rules as every pack: shaped pieces, flat colours from the pack palette, metres, origin at the centre of the base, front facing +Z, one `about` and `rule` text per pack; sounds as recordings in the sound packs.

I checked every model name in `assets/shaped/*.js` (42 packs, including the new `rail`, `civic`, `barriers` and `towers`, which the game does not load yet) against what the planned steps need. Anything not listed below is covered.

## Already covered (no request)
Digger machines and dig kit (pick, trowel on the ground, clay, chert, rope ladder, sandbags, edge markers), vehicle kit (roof boxes, winch bumpers, snow ploughs, light bars, jerry cans, saddlebags, fender buoys), boats (all 16 hulls, motor and prop, rafts, ferry barge with ramp), bikes (bicycle trailer, tandem, tricycle), docks (short, long, T, boat ramp, footbridge), pond dock, farm pack, parks pack (pools, golf, skate, courts), landscape pack (cuts, sinkholes, swallets, caves mouths, springs, riffles, bars, logjams), structure pack (abutments, truss, stay pylon), business kits (dentist chair, car wash, showroom), floor plans, hive models, animals, rail, civic, barriers, towers, hunting animals.

## 1. Survivor clips (0.108 bikes, 0.107 boats, 0.109 digging)
Existing clips: jump, airborne, land, hurt, drink, bandage, pickup, attack_chop, attack_thrust, attack_swing, attack_dig, sit, lean_wall, wave, carry_crate, carry_long, aim_long, carry_furniture, work_chop, fish, keep_watch.
Needed:
- `ride_bicycle` (hands on grips, feet on pedals, looping pedal turn; speed-independent, the game scales the playback rate) and `ride_bicycle_coast` (feet still).
- `ride_moto` (leaning forward, both hands on grips, feet on pegs) and `ride_quad`.
- `pillion` (seated behind a rider, arms round the waist) for bike passengers; `tandem_rear` (pedalling behind).
- `row` (seated facing back, two oars, one stroke loop), `paddle_kayak` (double blade, alternating sides), `paddle_canoe` (single blade, one side), `pole_raft` (standing, push and recover), `steer_outboard` (seated at the tiller), `helm_stand` (standing at a console, one hand on the wheel).
- `seated_boat` (passenger sitting on a thwart) and `seated_pontoon`.
- `siphon` (crouched at a fuel cap with a hose and can), `pull_winch` (hand over hand), `change_wheel` (kneeling at a wheel with a wrench).
- `dig_pick` (swing a pick overhead, two-handed) and `dig_trowel` (kneeling, short scraping strokes), `shore_pit` (kneeling at the pit edge placing a panel).
- `climb_rope_ladder` (a looser ladder climb than the rigid one).
Each with the pose at the saddle, grips, pedals, oar and tiller points named, so the game can attach to the bike and boat `saddle`, `grips`, `pedals`, `thwart` and `tiller` points.

## 2. Held items (0.109 digging)
- Held `pickaxe` (two-handed, head at +Z) and `trowel` (one-handed), first and third person, same rule as the existing `held.weapons`, with the grip point for the survivor's hand bone. `digging.pickaxe_ground` and `hand_trowel` are the ground versions.
- Held `jerry_can` (for the siphon and fuel) and `wrench_big` for wheel changes if different from `wrench`.

## 3. Sounds as recordings (music and sound step, 0.106 to 0.109)
The game makes engine, paddle splash and chain tick in code today (engine note, water-step splash, latch click). Recordings, looped where noted, normalised like the rest:
- Engine loops with a rev range (the game sets the pitch from speed): car (idle, mid, high), motorbike and moped, quad, small outboard (jon boat, kayak motor), large outboard and jet ski, pontoon, digger and loader diesel, dump truck, tractor, generator already in.
- Oar: rowlock creak, blade dip, drip; paddle dip left and right; pole push into mud and lift; sail flap (dinghy); hull bump on a dock; waves lapping on a hull (loop); ferry ramp clank.
- Bicycle: chain tick and freewheel (loop), bell, brake squeak. Motorbike: kick start, rev-up. Engine start, stall and fail-to-start for cars.
- Vehicle parts: tyre hiss and slow flat, winch motor (loop) and line tension, plough scrape on road, roof box latch, bull-bar impact, light bar click, horn if different from the klaxon.
- Digging: pick strike on stone and on clay, trowel scrape, shoring panel set, sandbag drop, cave-in rumble and slump (short and long), water seep and splash into a pit, bucket drop in water, rope ladder creak, rock fall, digger back-up beeper, hydraulic whine exists.
- Power and businesses: breaker trip exists; add fridge compressor cutting out, fluorescent tube flicker and buzz, gas pilot hiss, tap sputter when the water is out, cash register, door buzzer, drive-thru speaker.
- Aliens: clinger drip and skitter; hive pulse (loop), hive burst.
- Farm and parks: windmill squeak (loop), cattle low, chickens, cricket night loop, playground swing creak.
Also: which nine synthesised sounds the game still makes in code (`sndSyn` list) you would like replaced; I can list them if useful.

## 4. Vehicles: wheels and weather (0.106)
- A `flat` variant of the wheel for every vehicle size in `vehiclekit` (squashed tyre, rim touching), left and right, so a puncture shows. `props/items.tyre_loose_flat` exists only as a loose item.
- `snow_tyre` and `mud_tyre` treads (distinct from road tyres at a glance), plus `tyre_chains`.
- A `snow_cover` roof and bonnet piece for parked cars in the snow, and a `mud_splash` skirt.
- Roof box and cargo cap pieces exist; add `bed_cap_open` (lifted) for stock access and a `load_wood` and `load_scrap` cargo piece for the bed.
- `towing_hook` and `tow_cable` pieces for the winch tow.

## 5. Digging polish (0.109)
- `pit_water_tile`: a 0.5 m square water surface, cut flush with a pit wall, three depths (shallow, knee, deep) and a muddy variant; plus `seep_wall` decal for a wet pit wall.
- `cave_in_pile`: the heap of soil that falls into a pit (small, medium, large) and a `slump_scar` piece for the side wall it came from.
- `pit_rim_crumble` decal where the edge is unstable and a `warning_flag` stake.
- Cut-away `hole_in_wall` frames for dug walls and rock (1 m by 2 m, brick, concrete, timber).
- Item art for soil layers (loam, clay, chert, limestone, gravel) as 3D loose lumps (`clay_lump` and `chert_gravel` exist) and UI icons for all of them, the pickaxe, trowel, shoring panel, sandbag, edge marker, rope ladder, jerry can.

## 6. Cave interiors (0.115 karst; blocked on map data but the art is needed first)
`land` has cave mouths and sinkholes. For a walkable cave: wall, floor and roof tiles (rock, 2 m grid, three variants), stalactite and stalagmite sets, flowstone and rimstone, a cave pool and a stream piece, a narrow squeeze, a rope-down drop (1 m deep, 3 m deep), a bat colony cluster, a bone and old-lantern pile. Also `mine_timber` supports (frame and plank) if mines are wanted.

## 7. Boats second part (0.107) and docks (0.118)
- Marina: finger pier, fuel dock with pump, covered slip (boat house), boat lift, dock ladder, mooring cleat and post, pilings (short and tall), life ring post, dock cart.
- Concrete boat ramp and landing in two widths, a floating pontoon pier with a gangway, a rowing-club boathouse.
- Boat seats: thwart, bench and pedestal seat positions marked as points on all 16 hull models (`seat_0` to `seat_5`), so survivors can sit in order. Currently only some hulls name them.
- A `wake_foam` ring piece for the wake behind motor boats and a `bow_spray` piece.

## 8. Roadside pack second part, and street items needed by planned steps
- Post office kit for the business kits: counter with grille, wall of PO boxes, parcel shelves, sorting table, mail bins, scale, blue collection box, flag pole. Not in `services`.
- Car dealership extras: balloon arch, pennant string, price windshield sign, desk and cubicle set, key cabinet. `showroom_pedestal` only.
- Business states (0.111): dust and cobweb decals for floors, shelves and corners, mouldy ceiling stain, water damage, rust streaks, boarded-up window (`board_up_window`), faded signs, empty-shelf variants for the most used shelving (`fx` has dust_puff only).
- Fruit trees for orchard areas (0.116): apple, peach, pear, cherry, walnut, young and bearing, in rows, plus a vine row (vineyard) and a berry row. `flora` has oak and vines, not orchard stands.

## 9. Power (existing planned: plant, cable box, solar)
`props` and `interiors/utility` have a transformer cabinet, boiler and plant panel; the game uses boxes for these places:
- City power plant: turbine hall, boiler house, coal or gas yard, stack (use `towers.smokestack_*`), switchyard with transformers and gantry, transmission pylon (lattice, two heights) and span of line, control building. Needed whole (town-sized) and as an individual-pieces kit.
- Solar: roof panel array, ground array, small rack, charge controller box, battery bank, inverter. None exist.
- Generator house and fuel tank for bases; substation fence set (`barriers` has security fences).

## 10. Bridges and structures (0.119)
`structures` has abutments, truss road, stay pylon, portals. Needed: arch span, girder span, suspension tower and hanger set (cables drawn as lines by the game, so give towers, saddle points and hanger attach points), cable-stayed deck unit, trestle bent and trestle span (timber and steel), spillway chute and stilling basin, bridge railing in three styles, tunnel lining ring (road, rail, path), fish ladder.

## 11. Aliens, hives and base defence (aliens step)
`aliens` has the five creatures, nest, three hive sizes and decals. Needed for the step: a hive as a world feature (a tall structure that breaks a street: a `hive_tower` with a base that eats into the road, a root mat decal, spore cloud effect), hive door and gate, a `trail` decal set (slime, blood) for the clinger and others, base-defence art: trip alarm, noise trap, fence spike wall, boarded door in three damage stages, catwalk and sniper nest, turret stand (for guns already in held).
Hunting (animals pack has creatures, items): skinning and butcher clips on the survivor (`skin_kneel`, `butcher_hang`), carcass pieces for each animal size and a hanging rack.

## 12. Survival backlog
- Skill books: seven books with a different cover colour and title mark (survival, medicine, mechanics, cooking, firearms, farming, building) as 3D items and UI icons.
- Siphon: hose in a can, a hose-in-tank animation clip (`siphon` above).
- Vault: `vault_low` clip (one-hand hop over a low fence or counter).
- Carry weight: no art. Furniture carry exists (`carry_furniture`).
- Fortify: board and nail frame pieces for a window in four stages, steel shutter, barbed wire coil, shoring.

## 13. Courtyards (map holes)
No art needed, but in-world courtyard dressing: courtyard paving, planter, fountain, cloister arcade, light well, rooftop garden set.

## Order I would build them in
1. Survivor clips (section 1) and held pickaxe and trowel (section 2): they unlock bikes, boats, digging at once.
2. Wheel states (4) and pit water and cave-in pieces (5): they finish vehicles and digging.
3. Sounds (3): lets the game drop its code-made engines.
4. Boat and dock pieces (7), post office and dealership (8), orchard (8).
5. Power plant and solar (9), bridges (10).
6. Cave interiors (6), aliens (11), survival (12), courtyard (13).
