# Bikes, boats and parks (26 October 2026)

For the main chat and the map chat. Three packs, all version 1 in `assets/shaped/` and nothing wired in yet: `bikes` (16 models), `boats` (20) and `parks` (93). Piece lists and triangle counts are in `docs/SHAPED.md`; each pack's `rule` text repeats the placement recipe. Previews are in the album: "Bikes", "Boats" and "Parks and sports" scenes.

## 1. `bikes`: things you ride that have no cab

Rigged like the machines pack (read its header): `parts`, `rig` (parent, pivot, turn or slide, range), `wheels` positions, `steer`, `clips`, BODY paint slot in `paint[name]`. Metres, bow or front toward +Z, origin on the ground under the middle of the wheelbase.

- **Pedal:** `bicycle_city` (basket, rack, bell), `bicycle_mountain` (fat tyres, suspension fork), `bicycle_road` (drop bars), `bicycle_kids` (training wheels), `bmx`, `cargo_bike` (wooden front box), `tandem` (two saddles), `tricycle`, `kick_scooter`.
- **Motor:** `moped`, `motorbike_road`, `motorbike_dirt`, `quad_bike` (four wheels, two steer), `bike_trailer`.
- **Roadside:** `fallen_bicycle` and `wrecked_motorbike` (static, lying on their side: crash sites and verges; they lie along x, so turn by whole quarter turns).
- **Moving parts:** `bars` turns about Y with the steered wheel (same angle, up to 35 degrees); `crank` spins about X by the distance driven; `wheel` spins by distance over `wheelSize[0]`. Extra data: `saddle[name]` (a sitting point), `grips[name]` (hands), `pedals[name]` (feet; footpegs on motor bikes). Headlights and tail lights are glow pieces.
- **Game notes** are in `notes[name]` (quiet and fuel-free for pedal bikes; loud for motorbikes so they draw aliens).

## 2. `boats`: rivers and lakes

Same machines form, with the water line at y = 0: hulls go below it by `draught[name]`, so put the boat at the water height. Bow toward +Z.

| Boat | Size | Carries | Drive |
| --- | --- | --- | --- |
| `kayak`, `paddleboard` | 3.2 m, 3.4 m | 1 | `paddle` rolls (kayak) or sweeps |
| `canoe` | 4.5 m | 3 | `paddle` sweeps |
| `rowboat` | 3.8 m | 3 | `oar_l`, `oar_r` sweep together |
| `jon_boat` | 4.3 m | 3 | `motor` (steers about Y), `prop` spins about Z |
| `bass_boat` | 5.4 m | 3 | outboard, raised casting decks |
| `runabout` | 5 m | 4 | outboard, fast, loud |
| `jet_ski` | 3.2 m | 2 | fast, loud |
| `pontoon_boat` | 6.5 m | 8 | outboard, canopy, very stable |
| `fishing_boat` | 6.5 m | 5 | outboard, wheelhouse, outriggers |
| `houseboat` | 12 m | 10 | outboard, two floors: a floating base |
| `sailing_dinghy` | 3.5 m | 3 | `sail` swings about the mast, `rudder` steers |
| `ferry_barge` | 10 m | 12 | on a cable; `ramp` lowers to load |
| `inflatable_raft`, `log_raft`, `barrel_raft` | 3 m | 3 to 4 | crafted by the player; paddle or pole |

Also `seats[name]` (the first is the helm or paddler), `helm[name]`, `buoy[name]` (how many it carries before it sits to the gunwale), and four water pieces: `wake_v` (V wake behind a moving boat), `bow_wave`, `prop_wash` (under a running outboard) and `splash_ring` (where something falls in), all at y = 0.02 so they lie on the water.

`rx` and `rz` are not supported by shaped pieces: tilt and bob the whole boat object with the waves rather than a piece. The older static boats in `waterside` (`rowboat`, `canoe`, `jon_boat`, `kayak`, `boat_wreck`) stay as parked props at docks and on banks; use these rigged ones when a boat moves. `autotrade.boat_on_trailer` and `boat_rack_stack` are for yards.

## 3. `parks`: what a park, a field, a pool, a camp and a bike park hold

All static, metres, origin at the centre of the base, front +Z. Pieces along a path or edge are 4 m on z; court, track and line tiles are 4 m decals at y = 0.02; `pool_8x4` and `skate_bowl` sink below y = 0 (their `info` has `sunk`) so the ground under them must be cut away.

- **Playground (13):** swing set, slide, seesaw, climbing frame, monkey bars, sandpit, spring rider, merry-go-round, tyre swing, balance beams, playhouse, chip and rubber surfacing.
- **Park furniture (22):** gazebo, pavilion, bandstand, statue and plinth, obelisk monument, dry and running fountains, drinking fountain, bins, sign, lamp, bollard light, flower bed, planter, hedge, wrought fence, pergola, dog-waste station, pet bowl, barbecue, iron bench.
- **Ball sports:** baseball backstop, home plate, base, mound, dugout, bleachers, scoreboard, outfield fence, batting cage; basketball hoops (pole and wall); soccer goal; football goalpost; tennis and volleyball nets; horseshoe pit; disc golf basket.
- **Courts and tracks (4 m tiles):** green, blue and clay court in plain, line and corner, blue centre circle and key, running-track straight, white field lines.
- **Skate park:** quarter-pipe, funbox, rail, kicker, bowl. **Pool:** 8 by 4 m pool, diving board, ladder, lifeguard chair, fence, lounger. **Golf:** flag and hole, tee box, bunker, cart.
- **Bike park:** dirt double jump, pump-track roller, berm, skills ramp, start gate. **Camp:** A-frame, dome and big tents, camp stove, folding table, hammock, camp sign.

## 4. Placement recipes

| Where the data says | Place |
| --- | --- |
| `leisure=park`, `garden` | paths with `park_lamp` every 20 m and `park_bench_iron` at views; centrepiece (`statue_plinth`, fountain or `monument_obelisk`); `gazebo`, `bandstand` on lawns; `pavilion` with `bbq_pedestal` for picnics; `flower_bed`, `hedge_4`, `park_sign` at the gate |
| `leisure=playground` | `playground_chips` or `_rubber` under the equipment; `fence_wrought_4` round it |
| `leisure=pitch` | by `sport`: baseball (plate, bases, mound, backstop, dugouts, bleachers, outfield fence), basketball (blue key tiles, a hoop at each end), tennis (green tiles, net, fence), soccer and football (field lines, goals), volleyball (net on sand) |
| `leisure=track` | `track_lane_4` in loops |
| `leisure=swimming_pool` | `pool_8x4`, ground cut away; board, ladder, chair, fence, loungers |
| `leisure=golf_course` | `golf_tee_box`, `golf_flag`, `sand_bunker`, `golf_cart` on paths |
| `tourism=camp_site` | `camp_sign` at each plot, tents, table, stove, hammock |
| `amenity=bicycle_parking`, `shop=bicycle` | `bicycle_city` leaning on racks; `fallen_bicycle` in verges |
| `waterway`, `natural=water` with a dock, ramp or marina | small boats at docks and ramps; pontoons, runabouts, bass boats and jet skis at marinas; houseboat and fishing boat at the biggest; `ferry_barge` where a road meets a river with no bridge |

## 5. Not made yet

Boats: a rescue boat, an airboat, a barge tow. Bikes: a rider-in-pose set. Parks: a dog park agility set, a stadium stand section, a ski or sled hill, a splash pad, a cemetery. Ask in `docs/ART_REQUESTS.md`.
