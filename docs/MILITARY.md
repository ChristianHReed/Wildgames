# Military content guide

Made by the Content chat. Generic olive/tan, no insignia, no real units or brands.

**Vehicles** (`workshop/designs/military.js`, in `packs/workshop-crafts.js`): army_jeep, humvee (ball hitch, ring gun), army_cargo_truck (6x6, walk-in canvas tilt, pintle hitch), apc_8x8 (4 axles, walk-in troop bay, rear ramp, turret), armoured_car, ammo_trailer (tongue coupling, walk-in box), patrol_boat (twin outboards, bow gun), transport_heli (walk-in cabin, sliding door, 4-blade rotor). All pass `test_crafts.js`; the trailer couples to the humvee and truck.

**Weapons** (`packs/afterstreet-military.js`, group `weapons`, each with new/worn/broken): assault_rifle, battle_rifle, sniper_rifle, smg, light_machine_gun, combat_shotgun, service_pistol, combat_knife, machete, hand_grenade, rocket_launcher. Guns carry `info` rows (length, offhandAt, muzzle, ammo, holds, twoHanded) like the carbine. **Game side still needed** (Main chat): stats/ammo types, the `rocket` ammo, first-person tables (fpLong/fpAim/fpReload) and reload states; magazines and ammo boxes are not yet made.

**Bases** (same pack, land group, 4 m tiles end in `_4`): guard_tower, watchtower_wood, gatehouse, chainlink_fence_4, razor_wire_coil, hesco_barrier_4 (earth-filled gabion wall), sandbag_wall_4, sandbag_nest, pillbox_bunker, earth_bunker, barracks_hut, command_building, hangar_small, motor_pool_shed, command_tent, helipad, fuel_depot, radio_mast, tank_trap, hardened_checkpoint, flagpole. Map chat can place them for OSM `military=*` tags (see `docs/MAP_BUILDING_USES.md`).

Rebuild: `node workshop/tools/make_military.js`; album scenes `military_bases`, `military_weapons`.

**Also made:** held magazines and ammo: rifle_magazine, smg_magazine, rocket_round, ammo_crate_mil, belt_box (in `afterstreet-military`).
