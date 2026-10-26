# Vehicles: refit, and the customisation kit (26 October 2026)

Content chat's answer to "refine all the vehicles, and make any vehicle or boat customisable: roof racks, paint, swapping parts between vehicles, off-road tyres moved from one to another".

Two things were done: the cars and work vehicles were rebuilt so every part meets its neighbour, and a **vehicle kit** was added: tyres, rims and about 190 bolt-on parts that fit any vehicle with the right mount.

## 1. What was fixed in the models

- **Audit tool**: `node assets/shaped/src/audit.js <pack> [tolerance] [filter]` joins the touching pieces of every vehicle model and reports loose groups. The machines pack now reports only parts that move at rest (arms, doors, beds).
- **Trucks (`machines`)**: rebuilt around a real chassis (`undercarriage`: rails, axle beam, differential, springs). The cab floor sits on the rails, fenders cover every wheel and are tied to the rails or sill, mud flaps, cab steps, front fascia and bumper, tail lights on a rear cross-bar. The dump truck got a subframe. Ambulance, school bus and mobile crane use the same `arch_body` (wheel openings with dark liners) plus undercarriage. Forklift and road roller joined to their front plates, bulldozer ripper and garbage arm reach their bodies, fire-truck and bucket-truck bodies were lifted off the wheels, the tow truck has a lift post, the sweeper broom has hanger arms.
- **Cars (`props`, `vehicles`)**: the four old cars were remade (hatchback, sedan, pickup, van) and six more added: **wagon, SUV, offroader, crew-cab pickup, flatbed and box truck**. Each has wheel arches that follow the tyre, an underbody, sills, bumpers, lamps, door seams, handles and mirrors; pickups have a bed with wheel wells. Wheels are a chamfered 8-sided tyre with a hub (80 triangles). Wrecks, burnt shells, damage sets and boot lids exist for all ten (`CARS` in `props_x.py` and `props_more.py`).
- **Measurements**: every body now records a spec: width, length, wheel radius and width, axle positions, track, arch clearance, roof, hood, nose, tail, bumper height and (pickups) bed. `props.js` exports it as `vehicleSpec`, `machines.js` as `spec`. The kit's mounts are computed from it, so a new vehicle only needs a spec.

## 2. The kit: three layers

**Wheels.** A wheel is a tyre model and a rim model, both radius 1 and width 1. Draw the tyre scaled `(w*wMul, r*rMul, r*rMul)` and the rim scaled `(w*wMul, r*rMul*rimFrac, ...)` at each wheel point; turn left-side wheels half a turn about y. A bigger tyre needs the body raised: `lift = max(0, 2*(rNew - r) - archClear + 0.02)`: raise the body and every part on it by that, and put the wheel centre at `rNew`. Each tyre has grip on road, dirt, mud, snow, sand and wet for the game to use.

**Parts.** A part is modelled at its mount: origin on the surface it bolts to, y up, +Z the vehicle's front. Parts name a **slot** (`roof`, `hood`, `front`, `rear`, `side`, `arch`, `flap`, `pillar`, `bed`, `cab_back`, `chassis_side`, `rear_door`, `roof_decal`, `decal_side`; boats: `transom`, `bow`, `deck` (three spots), `canopy`, `rail`; bikes: `front_rack`, `rear_rack`, `bars`, `bars_light`, `bars_bell`, `frame`, `seatpost`, `stand`, `fender`). Each vehicle's `mounts` table gives the position and the size of the space. A part fits when it is no wider or longer than the mount (snorkels: no taller; flares: only for tyres up to their `rCap`). One part per slot (boats get three deck and three bow spots). Side parts are drawn for the right side and mirrored with `scale.x = -1`. Parts in group `bonnet` move with the bonnet and `bed` with a tipper bed.

**Paint.** Parts that use the `BODY` colour slot (caps, scoops, campers) take the vehicle's body colour. Cars use the palette slots `paint1`, `paint2`, `paint3`; machines, bikes and boats the `BODY` slot (boats also list their own).

`assets/shaped/vehiclefit.js` does the arithmetic (no three.js):

```js
const plan = VEHICLEFIT.plan(kit, 'pickup', { tyre: 'mud_terrain', rim: 'beadlock', parts: ['bull_bar_M', 'roof_bars_C'], paint: { paint1: '#7a2a24' } });
// plan.lift, plan.wheels[], plan.parts[] (name, pos, mirror, group), plan.rejected[] (part, why), plan.stats
VEHICLEFIT.fits(kit, 'sedan', 'roof_basket_L')   // { ok:false, why:'too long (2.1 > 1.2)' }
VEHICLEFIT.compatible(kit, 'suv')                // every part that fits an SUV
```

The album function `dress()` in `art-tests/album.html` shows how to draw a plan with three.js.

## 3. Swapping between vehicles

Everything the player can fit is a *part name*. To take the off-road tyres off one car: remove `tyre` from that car's loadout (it returns to `vehicles[name].wheel.stock`), give the item to the player, and put the same `tyre` on another loadout; `plan()` resizes it to the new vehicle and lifts the body. The same holds for any part: a bull bar, roof basket or camper shell moves to any vehicle whose mount is big enough, and `rejected[].why` says why when it is not. Suggested items: one inventory item per tyre, rim and part name; the album shows every one.

## 4. The wheel catalogue

| Tyre | Radius x | Width x | Road | Dirt | Mud | Snow | Sand | Wet | Note |
|---|---|---|---|---|---|---|---|---|---|
| `road` | 1 | 1 | 1 | 0.6 | 0.35 | 0.3 | 0.4 | 0.85 | smooth touring tyre: quiet, best on tarmac |
| `all_terrain` | 1.12 | 1.15 | 0.9 | 0.9 | 0.65 | 0.55 | 0.6 | 0.8 | blocky tread: copes with most things, a little louder |
| `mud_terrain` | 1.3 | 1.35 | 0.7 | 1 | 1 | 0.6 | 0.7 | 0.6 | huge lugs: climbs mud and rocks, whines on tarmac, needs a lift on most bodies |
| `snow` | 1 | 1.05 | 0.75 | 0.6 | 0.4 | 1 | 0.3 | 0.8 | soft siped winter tyre |
| `snow_chains` | 1.02 | 1 | 0.6 | 0.7 | 0.7 | 1 | 0.3 | 0.6 | a road tyre with chains: best grip on snow and ice, rough and slow on tarmac |
| `slick` | 1 | 1.25 | 1.2 | 0.3 | 0.1 | 0.1 | 0.2 | 0.4 | wide and smooth: fastest on dry tarmac, hopeless off it |
| `heavy` | 1.08 | 1.2 | 0.9 | 0.8 | 0.6 | 0.5 | 0.5 | 0.75 | truck tyre: carries more and wears slower |
| `sand` | 1.15 | 1.6 | 0.6 | 0.9 | 0.6 | 0.6 | 1 | 0.5 | wide soft balloon tyre that floats on sand and soft ground |
| `military` | 1.3 | 1.25 | 0.7 | 1 | 0.9 | 0.7 | 0.8 | 0.65 | big lugs and a reinforced sidewall: shrugs off punctures (half the chance) |
| `solid` | 0.97 | 0.9 | 0.8 | 0.6 | 0.3 | 0.3 | 0.3 | 0.6 | puncture-proof solid rubber: never goes flat, rides hard |

Rims: `steel` (plain pressed-steel wheel); `steel_rust` (the same, rusted: what a wreck rolls on); `alloy5` (five-spoke light alloy); `alloy_dark` (six-spoke blacked-out alloy); `chrome_dish` (deep-dish chrome: shows off); `beadlock` (bolted bead-lock ring: for the hardest tyres); `wire` (old-fashioned wire wheel).

Bike wheels: `road` (thin road tyre); `gravel` (a bit wider with a light tread); `mtb` (knobbly mountain-bike tyre); `fat` (fat bike tyre: floats on snow and sand); `moto_road` (motorbike road tyre on a cast wheel); `moto_knobby` (trail tyre on a spoked wheel).

## 5. Parts by slot

Size is width by depth in metres, as measured from the model.

**roof**: `roof_bars_S` 1.3x1; `roof_bars_M` 1.4x1.6; `roof_bars_L` 1.5x2.1; `roof_bars_XL` 1.8x3; `roof_bars_XXL` 2x4; `roof_basket_M` 1.4x1.7; `roof_basket_L` 1.5x2.1; `roof_basket_XL` 1.8x3; `roof_box_S` 0.9x1.5; `roof_box_M` 1.1x1.9; `roof_box_L` 1.3x2.3; `roof_box_XL` 1.6x3.2; `roof_ladder_L` 1.5x2.1; `roof_ladder_XL` 1.8x3; `roof_ladder_XXL` 2x4; `roof_luggage_M` 1.4x1.6; `roof_luggage_L` 1.5x2.1; `roof_luggage_XL` 1.8x3; `roof_luggage_XXL` 2x4; `roof_tarp_M` 1.4x1.6; `roof_tarp_L` 1.5x2.1; `roof_tarp_XL` 1.8x3; `roof_tarp_XXL` 2x4; `roof_spare_tyres` 1.1x0.8; `roof_jerry_cans` 1.3x1; `roof_kayak` 0.95x3.4; `roof_canoe` 0.95x3.4; `roof_tent_L` 1.4x2; `roof_tent_XL` 1.7x2.4; `light_bar_white_S` 0.9x0.23; `light_bar_amber_S` 0.9x0.23; `light_bar_white_M` 1.2x0.23; `light_bar_amber_M` 1.2x0.23; `light_bar_emergency_M` 1.2x0.23; `light_bar_white_L` 1.5x0.23; `light_bar_amber_L` 1.5x0.23; `light_bar_emergency_L` 1.5x0.23; `beacon_amber` 0.2x0.2; `beacon_red` 0.2x0.2; `beacon_blue` 0.2x0.2; `taxi_sign` 0.5x0.21; `roof_spotlights` 1x0.16; `antenna_cb` 0.1x0.12; `radio_mast` 0.61x0.3; `beacon_bar_L` 1.8x0.28; `floodlight_mast` 0.82x0.34; `roof_bars_C` 1.5x0.5; `roof_lights_C` 1.5x0.2.

**roof_decal**: `stripes_roof_white` 0.44x1.2; `stripes_roof_black` 0.44x1.2.

**hood**: `hood_scoop_S` 0.45x0.5; `hood_scoop_M` 0.7x0.7; `hood_spare` 0.7x0.7.

**front**: `bull_bar_S` 1.55x0.42; `bull_bar_lights_S` 1.55x0.42; `bull_bar_M` 1.8x0.42; `bull_bar_lights_M` 1.8x0.42; `bull_bar_L` 2.25x0.42; `bull_bar_lights_L` 2.25x0.42; `push_bar_S` 0.9x0.17; `push_bar_M` 1.15x0.17; `push_bar_L` 1.6x0.17; `winch_bumper_S` 1.6x0.33; `winch_bumper_M` 1.85x0.33; `winch_bumper_L` 2.3x0.33; `grille_guard_M` 1.52x0.23; `grille_guard_L` 1.97x0.23; `snow_plough_M` 2.2x0.58; `snow_plough_L` 2.65x0.58; `ram_bumper_M` 1.85x0.93; `ram_bumper_L` 2.3x0.93; `brush_guard_S` 0.75x0.1.

**rear**: `tow_hitch` 0.4x0.34; `rear_bumper_S` 1.6x0.27; `rear_bumper_M` 1.85x0.27; `rear_bumper_L` 2.3x0.27; `rear_jerry_rack` 0.95x0.27; `salt_spreader` 2.2x1.48.

**rear_door**: `spare_door` 0.7x0.42.

**side**: `running_board_S` 0.26x1.2; `rock_slider_S` 0.2x1.2; `running_board_M` 0.26x1.8; `rock_slider_M` 0.2x1.8; `running_board_L` 0.26x2.5; `rock_slider_L` 0.2x2.5.

**arch**: `fender_flare_S` 0.1x1.02; `fender_flare_M` 0.1x1.14; `fender_flare_L` 0.1x1.28; `fender_flare_XL` 0.1x1.48.

**flap**: `mud_flap` 0.04x0.34.

**pillar**: `snorkel_S` 0.1x0.16; `snorkel_M` 0.1x0.16; `snorkel_L` 0.1x0.16.

**decal_side**: `stripe_side_white` 0x4; `stripe_side_black` 0x4; `stripe_side_red` 0x4.

**bed**: `bed_cap_S` 1.6x1; `bed_cap_M` 1.6x1.8; `bed_cap_L` 1.6x2.8; `bed_cover_S` 1.6x1.11; `bed_cover_M` 1.6x1.8; `bed_cover_L` 1.6x2.8; `bed_rack_S` 1.6x1; `bed_rack_M` 1.6x1.8; `bed_rack_L` 1.6x2.8; `bed_rack_XL` 1.6x3.8; `bed_roll_bar` 1.5x0.21; `bed_roll_bar_lights` 1.5x0.12; `bed_toolbox` 1.54x0.44; `bed_tank` 1x1.22; `load_barrels_S` 1.08x0.56; `load_barrels_M` 1.08x1.18; `load_barrels_L` 1.08x2.42; `load_barrels_XL` 1.08x3.04; `load_crates_S` 1.38x0.58; `load_crates_M` 1.38x1.2; `load_crates_L` 1.38x2.44; `load_crates_XL` 1.38x3.06; `load_hay_S` 1.48x0.8; `load_hay_M` 1.48x0.8; `load_hay_L` 1.48x1.7; `load_hay_XL` 1.48x3.5; `load_firewood_S` 1.3x0.7; `load_firewood_M` 1.3x1.5; `load_firewood_L` 1.3x2.5; `load_firewood_XL` 1.3x3.5; `load_scrap_S` 1.3x0.75; `load_scrap_M` 1.3x1.5; `load_scrap_L` 1.3x2.5; `load_scrap_XL` 1.3x3.5; `load_tarp_S` 1.35x0.8; `load_tarp_M` 1.35x1.6; `load_tarp_L` 1.35x2.6; `load_tarp_XL` 1.35x3.6; `camper_shell` 1.61x3.61.

**cab_back**: `exhaust_stacks` 2.08x0.18; `headache_rack` 2.1x0.14.

**chassis_side**: `toolbox_side_S` 0.54x1.24; `toolbox_side_M` 0.54x2.04; `fuel_tank_side` 0.66x1.6.

**transom**: `outboard_S` 0.13x0.18; `outboard_M` 0.18x0.25; `outboard_L` 0.22x0.32; `outboard_twin` 0.86x0.32; `swim_ladder` 0.32x0.11; `flag_pole` 0.06x0.48.

**transom_prop**: `outboard_S_prop` 0.13x0.11; `outboard_M_prop` 0.18x0.11; `outboard_L_prop` 0.22x0.11; `outboard_twin_prop` 0.86x0.11.

**bow**: `trolling_motor` 0.2x0.2; `windscreen` 1.3x0.19; `anchor_bow` 0.4x0.45; `nav_lights` 0.66x0.11; `spotlight_boat` 0.2x0.26.

**canopy**: `bimini_S` 1.1x1.4; `bimini_M` 1.6x2.2; `bimini_L` 2.4x3.2; `t_top` 1.8x1.8; `sail_flag` 0.05x0.33.

**deck**: `cuddy_hatch` 1.2x1.2; `seat_helm` 0.55x0.55; `seat_bench` 1.34x0.51; `cooler` 0.72x0.43; `fuel_tank_boat` 0.31x0.6; `storage_crate` 0.62x0.47; `tackle_box` 0.47x0.27; `crab_pots` 1.15x1.15; `net_drum` 0.74x0.6.

**rail**: `fender_buoys` 0.13x1.33; `rod_holders` 0.1x1.1; `life_ring` 0x0.57.

**bars**: `bike_basket_front` 0.37x0.29; `moto_screen` 0.4x0.1; `quad_winch` 0.3x0.2.

**rear_rack**: `bike_basket_rear` 0.37x0.33; `bike_rack_rear` 0.22x0.4; `panniers` 0.53x0.34; `bike_trunk` 0.3x0.36; `child_seat` 0.31x0.32; `saddlebags` 0.73x0.42; `quad_rack_rear` 0.93x0.73.

**front_rack**: `bike_rack_front` 0.22x0.3; `quad_rack_front` 0.83x0.53.

**fender**: `bike_fender` 0.08x0.5.

**bars_light**: `bike_light_front` 0.07x0.1.

**seatpost**: `bike_light_rear` 0.05x0.04.

**stand**: `kickstand` 0.02x0.12.

**frame**: `bike_bottle` 0.05x0.06; `crash_bars` 0.47x0.51.

**bars_bell**: `bike_bell` 0.05x0.06.

## 6. Fit summary

Parts that fit each vehicle (of 191):

hatchback 57, sedan 57, wagon 70, suv 71, offroader 62, pickup 78, crew_pickup 79, flatbed 88, van 83, box_truck 91, dump_truck 64, cement_mixer 64, garbage_truck 64, fire_truck 69, ambulance 90, tow_truck 64, mobile_crane 50, bucket_truck 62, forklift 31, road_roller 63, street_sweeper 58, school_bus 90, bicycle_city 14, bicycle_mountain 14, bicycle_kids 14, bmx 14, bicycle_road 14, cargo_bike 14, tricycle 14, tandem 14, kick_scooter 14, motorbike_road 17, motorbike_dirt 17, moped 17, quad_bike 19, kayak 8, canoe 17, paddleboard 10, rowboat 20, jon_boat 20, bass_boat 23, pontoon_boat 27, runabout 23, fishing_boat 27, jet_ski 13, sailing_dinghy 20, houseboat 27, ferry_barge 17, inflatable_raft 20, log_raft 15, barrel_raft 14.

## 7. Presets

- **Overlander** (`offroader`): mud_terrain, beadlock, roof_basket_M, bull_bar_lights_M, snorkel_M, fender_flare_XL, rock_slider_S, spare_door. a loaded expedition 4x4
- **Farm truck** (`pickup`): all_terrain, steel_rust, bull_bar_M, load_hay_M, mud_flap. bales on the back
- **Plough truck** (`pickup`): snow_chains, steel, snow_plough_M, roof_lights_C, salt_spreader. keeps the roads open in winter
- **Camper** (`crew_pickup`): all_terrain, alloy5, roof_bars_C, bed_cap_S. sleeps three
- **Police** (`sedan`): road, steel, light_bar_emergency_M, push_bar_M. a patrol car
- **Taxi** (`sedan`): road, steel, taxi_sign. a cab
- **Roof load** (`wagon`): road, alloy5, roof_luggage_L. a family with the car packed
- **Courier** (`hatchback`): road, alloy5, roof_box_S, stripe_side_white. a delivery run
- **Survivor SUV** (`suv`): all_terrain, alloy_dark, roof_basket_M, bull_bar_M, fender_flare_L, running_board_M
- **Camper van** (`van`): all_terrain, steel, roof_tent_L, rear_bumper_M
- **Scrap runner** (`flatbed`): heavy, steel_rust, load_scrap_L
- **Convoy truck** (`box_truck`): military, steel, ram_bumper_L
- **Road crew** (`dump_truck`): heavy, steel, beacon_bar_L, exhaust_stacks. orange warning lights
- **River fisher** (`jon_boat`): outboard_S, seat_helm, tackle_box, cooler, rod_holders. a quiet fishing boat
- **Speed boat** (`bass_boat`): outboard_L, nav_lights, cooler, windscreen
- **Party barge** (`pontoon_boat`): outboard_M, bimini_L, cooler, fender_buoys
- **Salvage boat** (`runabout`): outboard_L, spotlight_boat, storage_crate, anchor_bow
- **Trail bike** (`bicycle_mountain`): bike_bottle, bike_light_front, kickstand
- **Commuter** (`bicycle_city`): bike_basket_front, bike_rack_rear, bike_fender, bike_bell
- **Courier moto** (`motorbike_dirt`): saddlebags, moto_screen, crash_bars
- **Farm quad** (`quad_bike`): quad_rack_front, quad_rack_rear, quad_winch

## 8. Not done, and ideas for the main chat

- Parts do not yet change a vehicle's physics: `stats` on each part and `grip` on each tyre are numbers for the game to use (armor, storage, light, mass, speed, plough, winch, tow, fuelBonus, wade, sleep, loot).
- The plough part has a rig (`rig`: pivot, turn about x, 0 to 25 degrees) to raise the blade; the outboards have a steer rig and a separate spinning prop (`outboard_<n>_prop`).
- The excavator and bulldozer only have roof mounts (the excavator's belongs to the swinging `house` group, so draw parts with it); they have no wheels, so tyres do not apply. Other machines have the full set.
- Colour: parts use fixed flat colours except `BODY`. A second paint slot for parts would be a small addition if wanted.
- Idea: loot parts (`loot` stat on loads and spares) can be searched with the normal container rules; `carries: 'kayak'` marks roof carriers a boat can be loaded onto.

## 9. Open-source references

Read for ideas only, nothing copied: `swift502/sketchbook` (MIT): vehicles carry tagged empties for seats, wheels, doors and cameras, which is the shape of our mount table. `pmndrs/cannon-es` (MIT): `RaycastVehicle` keeps radius, suspension rest length, friction slip and roll influence *per wheel*, which is why each tyre here has its own grip table and size.

