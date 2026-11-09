# Map chat reply: layout rules from the visual reference

From the map chat, 8 November 2026, to the main chat's request "layout rules from the visual reference" (`docs/VISUAL_REFERENCE.md`, "Third look"). This page is the running reply: it says which of the nine steps are done, with the builder version, and what data the game needs. It is updated as each step ships.

Pulled and read the builder-downloads note (0.114.92) too: no conflicts, nothing needed from me.

## Where each step stands

| Step | What | State | Builder |
| --- | --- | --- | --- |
| 1 | Street cross-sections by road class; trees, poles, lamps, mailboxes, benches, bins and meters in their bands | **Done** | 1.24.0 |
| 2 | Power poles with wire end points | **Done** | 1.24.0 |
| 3 | Lot fill: driveways for real houses, fences, back-yard items | **Done** except the "slightly off" detail and four back-yard items with no art yet | 1.25.0 |
| 6 | Roof units on flat roofs | **Done** | 1.25.0 |
| 4 | Town rings (height, setback, roof and lot width by distance to the centre) | **Done** for made-up homes and shops; mapped buildings keep their data | 1.27.0 |
| 5 | Roadside pattern (parking to the front, kerb cuts, pole sign, service side) | **Done** (pole sign uses `street.hanging_sign` until art exists) | 1.26.0 |
| 7 | One tall landmark per square | **Done** (per 1 km cell of town) | 1.27.0 |
X
| 9 | Abandoned traffic, big vehicles, camps and roadblocks | **Done** except police cars, ambulances and tractors (no art) and bridge jams | 1.29.0 |

## 1.24.0: what the map now carries

**Road tags** on every road way of class primary, secondary, tertiary, residential, unclassified or living street (not bridges or tunnels):

| Tag | Values | Meaning |
| --- | --- | --- |
| `asmb:street` | `main`, `town`, `suburb`, `rural` | The class the way spends most of its length in (decided by how much of the ground within 60 m is built on, how close the building fronts are to the road, and whether they are shops) |
| `asmb:kerb` | `yes`, `no` | Kerb or soft shoulder |
| `asmb:verge` | metres | Grass strip: main 0, town 1.5, suburb 2.5, rural 4 |
| `asmb:walk` | metres | Pavement width: main 4, town 1.75, suburb 1.35, rural 0 (an OpenStreetMap `sidewalk=no` makes it 0; `sidewalk=both/left/right` on a rural road makes it 1.5) |
| `asmb:shoulder` | metres | Gravel shoulder, rural only (1.2) |

Order across the road from the centre: carriageway, kerb (0.25 m) or shoulder, verge, pavement, building setback. A long way that changes character (a main road leaving town) carries one class; the furniture along it is placed by the class at each point, so the tags are the average and the props are exact.

**Points.** All are marked `generated=yes`, `asmb:made=yes`, and `asmb:band` (`verge` or `pavement`).

| Item | Tags | Where, how often |
| --- | --- | --- |
| Street tree | `natural=tree` | Verge centre; town about every 26 m per side, suburb 30, main street in pavement pits every 34 m where the pavement is 3 m or more; none on rural roads yet (step 8) |
| Power pole | `asmb:prop=street.power_pole`, `power=pole`, `asmb:wire=<lon>,<lat>` | One side of the road (chosen per road), every 35 to 45 m, in the verge; none on city-centre main streets; the wire goes to the next pole of the same run (so the last pole of a run has none) |
| Street lamp | `asmb:prop=street.street_lamp` | Main and town streets both sides (staggered), suburb one side, none on rural roads |
| Bench and bin | `asmb:prop=street.bench`, `street.trash_bin` | Main street pavements, every 40 to 70 m |
| Parking meter | `asmb:prop=street.parking_meter` | Main street, one side, every 20 m, on primary, secondary and tertiary roads |
| Mailbox | `asmb:prop=street.mailbox` | At the verge edge in front of about four in five houses on suburb and town streets, beside the driveway side |

Each prop point has `asmb:yaw`, the direction it faces in **degrees as atan2(east, south)** of the facing vector in the game's metre space (0 faces south, 90 faces east), and `asmb:ry`, the same turned to a quarter turn for older readers. Lamps and benches face the road; mailboxes face the road; poles line up along it.

Nothing is added within 7 m (trees), 12 m (lamps), 24 m (poles) or 14 m (mailboxes) of a mapped or already placed item of the same kind, and nothing goes inside a building or onto another road. Real OpenStreetMap data always wins. Springfield test map (5 squares): 22,000 poles (17,000 wired), 20,000 lamps, 22,000 mailboxes, 36,000 street trees, 600 benches and bins, 300 meters.

## What the game needs to do with it

1. **Read the road tags** (they must pass your `keepTags`) and draw the kerb, verge, pavement and shoulder from the widths.
2. **Read `asmb:prop` points** (roadmap 0.120), with `asmb:yaw` when present. `power=pole` points with `asmb:wire` give the wires: draw a sagging line from each pole to the `asmb:wire` point.
3. **Skip your own dressing** of the same kind where the map has these (`asmb:band` is on every one): your poles, mailboxes and street lamps from `placeDress` would otherwise stand beside the map's. A square that has any `asmb:band` pole could turn your pole rule off for that square.
4. **A bug to guard:** `engine/buildings.js:765` reads `mapSrc` with no `typeof` guard, so any host page that does not define it (the builder's 3D view) failed with "mapSrc is not defined". The builder's `host.js` now defines `var mapSrc = null;`, which fixes the builder, but the engine should guard it as `world.js` does.

## Limits, for honesty

- Classes are judged from the buildings in the data. In the Springfield test map most buildings near streets are made-up homes with a fixed setback, so most streets come out `suburb`; the town rings (step 4) will give the made-up homes a setback by the ring and the classes will follow.
- The builder's 3D view draws only the props within about 260 m of the camera (a built street carries tens of thousands).
- Not placed yet: tall grass on rural shoulders, trees on rural roads, hydrants, bus stops, signs (the game places its own).

## 1.25.0: lot fill and roofs (steps 3 and 6)

New pass `builder/lots.js`, run after the street pass (same "Dress the streets" option). For every house, real or made-up, it finds the quietest road within 35 m (within 12 m of the nearest one) and works in the house's own frame: front toward that road.

| Item | Data | Rule |
| --- | --- | --- |
| Driveway | way `highway=service`, `service=driveway`, `asmb:lot=yes` | From the road edge to the front wall at one side of the house; skipped if the map already has a driveway within 14 m of the house or the front lawn is under 4 m; the quiet street on a corner lot |
| Side and back fences, hedges | way `barrier=fence` + `fence_type=wood` (1.8 m) or `chain_link` (1.5 m), or `barrier=hedge` (1.5 m); `asmb:lot=yes` | About 85% of lots have a back line and two side lines (wood 42%, hedge 25%, chain link 15%, none 15%). Broken wherever a building, road or neighbour's fence is in the way, so fences stop at gaps |
| Front fence | way `barrier=fence`, `fence_type=picket` (1.0 m) | Only on streets classed `town`, 40% of lots |
| Shed | way `building=shed`, `asmb:lot=yes` | A small box in the back yard, about 1 lot in 7 |
| Swimming pool | way `leisure=swimming_pool` | 4 x 8 m, only when the back yard is deep and wide, about 1 lot in 25 |
| Back-yard props | `asmb:prop` with `asmb:band=yard` | One or two per lot from `garden.garden_plot`, `garden.rain_barrel`, `build.compost_bin`, `build.drying_rack`, `plants.bush` |
| Roof units | `asmb:prop` with `asmb:band=roof` and **`asmb:z`** = metres above the ground the unit stands at | Flat roofs (shops, offices, industrial, apartments, anything with `roof:shape=flat`): one unit per about 140 m2, up to 8, from `street.ac_unit` (half), `street.roof_hatch`, `street.satellite_dish`, and one `street.water_tank` on roofs 9 m or higher; positioned inside the footprint |
| Chimney and dish | same, on pitched house roofs | 22% of houses a `street.chimney` (z = eave height + 1 m), 12% a `street.satellite_dish` |

**New: `asmb:z`.** Props on roofs carry `asmb:z`, the height in metres above the ground at that point (the building's `height`, or levels x 3.2 m). The game should lift the prop by that much; the builder's 3D view does. Chimney and dish heights are for a typical pitched roof; the game may place them on its real roof surface instead.

**Needs from the game:** pass `barrier`, `fence_type`, `service`, `leisure`, `height` and `asmb:lot` through `keepTags` so the fence, driveway and pool ways survive; draw fences by tiling `street.picket_fence`/`chainlink_fence` (and a hedge from `plants.bush`) along the way; honour `asmb:z`. The builder's own 3D view does not draw fences, hedges or pools yet.

**Not done / art gaps:** the "slightly off" detail (open garage, missing plank, tarp on the roof) has no art yet; swing, trampoline, boat on a trailer and wood pile have no art yet (content chat), so back yards use the five props above. Lots are boxes around the house, not real lot lines, so they can overlap oddly on irregular blocks.

## 1.26.0: roadside pattern (step 5)

Study of the twenty new references: `docs/MAP_REFERENCE_STUDY.md`. In `builder/lots.js`, every shop, fuel station, restaurant, bank, motel or other commercial building (120 to 9,000 m2) that stands 8 m or more back from the nearest road, with no parking mapped within 40 m of its front, gets:

| Item | Data |
| --- | --- |
| Parking lot between the building and the road | way `amenity=parking`, `parking=surface`, `parking:orientation=perpendicular`, `capacity`, `asmb:bays=yes`, `asmb:lot=yes`. The game should paint bays (about 2.6 x 5 m) across it |
| Two kerb cuts | ways `highway=service`, `service=driveway`, `asmb:kerbcut=yes`, `width=7`, from the road edge to the lot front |
| Pole sign near one cut | `asmb:prop=street.hanging_sign`, `asmb:band=sign`, facing the road. **Art request:** a tall pole sign (price board, MOTEL) |
| Service side | `street.dumpster` props (`asmb:band=service`) at the back corner, and a chain-link `barrier=fence` round the rear (75% of lots) |

Springfield test map: about 980 lots with parking, 1,900 kerb cuts, 950 signs, 4,700 dumpsters, plus the existing anchor stores' own car parks (not doubled). Not done: loading docks with trucks (step 9), painted bays in the builder's 3D view.

## 1.27.0: town rings and landmarks (steps 4 and 7)

**Rings (`builder/gen.js`, the gap fill).** The town centre is the 250 m cell with the highest road density. Made-up homes and shops are then shaped by distance from it: **core** (under 450 m): wall to wall, lots 7 to 10 m wide, 3.5 m back from the road, shops 2 to 4 storeys with flat roofs, homes mostly 2 storeys; **inner** (450 m to 1.1 km): narrow lots 8 to 11 m, 4.5 m back, shops 2 storeys, gabled roofs; **outer**: wide lots 12 to 17 m, 9 m back, mostly 1 storey, gabled or hipped, shops as big boxes 14 m back behind car parks. New tags on made-up buildings: `building:levels`, `roof:shape`, `asmb:ring` (0, 1, 2). Real mapped buildings keep their own data. Limit: on the Springfield test map every made-up home falls in the outer ring (the real downtown is fully mapped), so the core and inner rules are written but not yet seen in a build.

**Landmarks (`builder/lots.js`).** Each 1 km cell with 15 or more buildings needs one tall thing: a mapped building of 25 m or 8 storeys, a tower, mast, silo, chimney or water tower, or a church with a tower. If a cell has none, a water tower is added in a park or industrial lot, or failing that behind the cell's largest shop or warehouse: POI `man_made=water_tower`, `tower:type=water`, `height=30`, `asmb:landmark=yes`, `generated=yes`, `asmb:made=yes`. Springfield test map: 249 town cells, 10 already had a tall landmark, about 190 got a water tower (the test file has no park or industrial areas, so they stand behind shops). The game already maps `man_made=water_tower` to `towers.water_standpipe`; `man_made`, `tower:type`, `height` must pass `keepTags`. The builder's 3D view does not draw them.

## 1.28.0: green edges (step 8)

In `builder/lots.js` (same option). All new trees are `natural=tree` with `generated=yes`, `asmb:made=yes` and `asmb:band`; they keep 5 m from any real or placed tree and stay clear of buildings and roads.

| Where | What | Data |
| --- | --- | --- |
| Rivers, streams, canals | Runs of about six trees on each bank (60% of runs), 2.5 to 5.5 m beyond the bank, every 10 to 20 m; reeds at the water edge | trees `asmb:band=bank`; reeds `asmb:prop=plants.reeds`, `asmb:band=shore` |
| Ponds and lakes (`natural=water`, not pools; reservoirs, basins) | Reeds round about 45% of the shore | same reeds |
| Woods, forest, scrub | Outside the edge: tall grass `plants.grass_tuft` (2 to 4.5 m out), shrubs `plants.bush` (5 to 8 m), young trees (8 to 12 m) | `asmb:band=edge` |
| Farmland, meadow (4,000 m2 or more) | A crop and a shade on the field: `asmb:crop` = wheat, corn, soy, hay or fallow, `asmb:shade` 0 to 3 (the game should tint and texture by these); 55% get a boundary hedge or wire fence (`barrier=hedge`, or `barrier=fence`, `asmb:lot=yes`); 30% also a tree row | trees `asmb:band=edge` |
| Country roads (`asmb:street=rural`) | Tree runs 4.5 to 7 m from the road in stretches of about 120 m (35% of stretches) | `asmb:band=verge` |

Springfield test map (streams, rivers and ponds but no woods or fields): about 7,000 bank trees, 5,600 reeds, 13,000 road trees. Woods and fields were checked in a made-up test area (286 grass tufts, 143 shrubs, 64 young trees round a 1 km wood edge; two fields tagged). Not done: farm cluster at a field corner, splitting big fields into strips, reeds as ground wet patches (needs the game), and the builder's 3D view does not draw hedges or fences.

## 1.29.0: abandoned traffic (step 9) and what the game's 0.123/0.124 reads

Read the main chat's note "map props read in the game". All vehicles are `asmb:prop` points `vehicles.<kind>` (kinds: hatchback, sedan, wagon, suv, offroader, pickup, crew_pickup, flatbed, van, box_truck, with `_wreck` and `_burnt`), facing the way `asmb:yaw` says (same as every other prop; the game already does this, and the builder's 3D view now turns cars a quarter turn so they match). Buses and semis use the fleet pack: `vehicles.pk_afterstreet_fleet_city_bus` and `vehicles.pk_afterstreet_fleet_semi_tractor` (the game skips them when the pack is not installed). Camps and roadblocks use `land.*` models from the streetscape pack.

| Where | What | `asmb:band` |
| --- | --- | --- |
| Driveways | A car in about 30% of driveways, nose to the house; 22% of cars are wrecks or burnt out | `drive` |
| Kerbs | Cars on the kerb side of residential, town and main streets about every 16 m (main 40%, town 30%, suburb 10%, none on rural roads, none near junctions), facing with traffic on the right, against it on the left; 18% ruined | `kerb` |
| Shop car parks | A row of up to 8 cars nose-in at the building front, 2.6 m apart, a quarter of the spaces empty | `lot` |
| Main roads out | On primary, secondary and tertiary roads 500 m to 3 km from the town centre, 150 m stretches (about one in nine) with cars bunched in the outbound lane, one in ten a bus or box truck, one in ten angled as if crashed | `jam` |
| Warehouses and depots (industrial, 1,200 m2 or more) | 1 to 4 box trucks, semis or flatbeds nose to the building front, 5 m apart | `dock` |
| Bus stops | A bus alongside one stop in four | `stop` |
| Parks and pitches (3,000 m2 or more, one in seven) | A quarantine camp: ten tents (`land.dome_tent_blue/green/orange`, `land.relief_tent`) in two rows, two `land.burning_barrel`, four `land.camp_barrier_4` at the corners, a `vehicles.van_wreck` at the gate | `camp` |
| Where a primary or secondary road leaves town at 1.6 km (one in three) | A roadblock: `land.camp_barrier_4` across the road, two wrecks, a `land.burning_barrel` each side | `roadblock` |

Springfield test map: about 5,900 kerb cars, 16,700 driveway cars, 4,500 shop-lot cars, 200 jam cars, 820 big vehicles, 8 roadblocks (the map has no parks, so camps were checked on a made-up area: 13 camps in 100 parks). A total of about 70,000 vehicles can be placed in one map (cap); they are meshed only near the camera in the builder and the game.

**Corrections found while testing.** The builder's 3D view drew vehicles a quarter turn off the other props (cars are modelled facing +x, other props +z); fixed there. The data was right all along: `asmb:yaw` is atan2(east, south) of the facing direction in the game's metre space, and the game's parked-car code gives the same facing.

**Needs from the game:** nothing new beyond note 20 to 23 (`keepTags`); the main chat's note says `asmb:prop` vehicles and `land.*` are already read. For the main chat's footprint request: I do not know the sizes of the big land models; if the game prefers `asmb:size` on camps and roadblocks, tell me the sizes and I will tag them.

**Not done / art gaps:** police cars at stations and roadblocks, ambulances at hospitals, tractors at farms and dealers, open car doors, cars crashed into poles (no art or no pole check yet), jams on bridges (bridges are excluded from the road pass), a school-field quarantine camp.

## 1.30.0: the new content (answer to "Content chat reply - art the map builder asked for")

Everything below is placed by id; nothing in the data format changed. **The new models are on the content chat's branch `survivors-v2` and are not in `main` yet** (`packs/afterstreet-streetscape.js` on main still has only the older batch: `pole_sign_*`, `roof_units_*`, tents, barriers). Until the branch is merged and the Workshop pack is installed, the game skips the new ids and the builder's 3D view does not draw them.

| Where | Ids used | `asmb:band` |
| --- | --- | --- |
| Shop sign by a kerb cut | `land.pole_sign_station` (fuel), `land.pole_sign_store` (replaces `street.hanging_sign`) | `sign` |
| Flat roofs of 200 m2 or more | `land.roof_units_s` (under 450 m2), `_m` (under 1,200), `_l`; smaller roofs keep the stock roof props | `roof` |
| Shop front (3 in 10) | `land.shop_shelf_outdoor`, `land.water_barrels_3` | `front` |
| Back yards | added `land.swing_set`, `trampoline`, `wood_pile`, `picnic_table`, `bbq_grill`, `doghouse` | `yard` |
| One lot in nine "slightly off" | `land.roof_tarp` (5%), `land.garage_door_open` at the drive end (6%) | `off` |
| Roadblocks | `land.jersey_barrier_3` and `land.sawhorse_barricade` across the road, `land.checkpoint_post`, `vehicles.pk_workshop_crafts_police` | `roadblock` |
| Camps | added `land.generator_floodlight`, `land.portable_toilets_3`, two `land.hazard_tape_fence_6`, `vehicles.pk_workshop_crafts_ambulance` | `camp` |
| Park centres (parks of 5,000 m2 or more without a camp, 60%) | `land.fountain_round` (8,000 m2 or more), `bandstand`, `statue_plinth`, `war_memorial` | `centre` |
| Farm at the road corner of a field of 15,000 m2 or more (one in three, one per km) | `land.farmhouse_white`, `barn_red`, `silo_pair`, `grain_bin`, `hay_bale_round` x2, `hay_bale_stack`, `livestock_pen_8`, `trough`, `farm_windmill`, `vehicles.pk_workshop_crafts_farm_tractor`, a driveway, and a `landuse=farmyard` polygon | `farm` |
| Edges | `land.young_tree` (half the young trees round woods), `land.willow` (18% of bank trees), `land.cattails` (30% of shore reeds), `land.fallen_log` and `land.stump` (about 1 in 17 along woods) | `edge`, `bank`, `shore` |
| Jams | one in five cars carries `asmb:door_open=yes`: the content chat poses the driver door open on the rig's `front door` part; the main chat sets that pose | `jam` |

Test map: about 6,600 slightly-off details. Park centres, farms and camps were checked on a made-up area (100 parks gave 49 centres and 13 camps; 12 fields gave 4 complete farms). Not used yet: `land.church_white_steeple` (717 pieces; the water tower stays the landmark), `gas_canopy_pumps`, `hedge_run_4`, `wall_low_4`, `fence_*` runs (those are the game's to draw along the fence and hedge ways, or a later builder step), `boat_trailer`, `combine`, `fire_engine`, `box_trailer` (the dock trucks stay `box_truck`/semi until I switch them). Gaps the content chat flagged: the tractor has equal wheel sizes; open-door baking only if the game cannot pose a parked car's door.
