# What the design chat still needs to build

**Update, version 0.94.0:** the old Quaternius creatures and people (and their texture) and the unused Kenney furniture, car and box models are gone from the game; all aliens and survivors are now our own shaped art. What is still on third-party art is listed in section 12.

**Update, version 0.45.9:** sections 4 to 8 have arrived; the effects and UI icons are wired in, the rest waits for its game step (see the roadmap).

**Update, version 0.45.8:** batch 1 (sections 1 to 3) has arrived and is wired in for weapons, arms, clips, barricades, fires, generators, dropped packs and outdoor crates. Still waiting on game code, not art: loose items on the ground, searched container variants inside buildings, hinged doors, plants, street props, car wrecks and burnt cars. Sections 4 onward are still to do.

Written at version 0.45.5, 19 October 2026. Everything here is art the game currently fakes with plain boxes, draws with a stand-in, or does not have at all. Same rules as every pack so far: shaped pieces (box, bev, wedge, cyl, loft, decal, poly), flat colours from the pack palette, metres, origin at the centre of the base, front facing +Z, glow pieces for lights. See `docs/SHAPED.md` for the format and `docs/ART.md` for the look.

Each item says what the game does today, so you can see what it replaces.

## 1. Needed first (the game already has a place waiting for these)

### Weapons in the hand
The game now has 9 street weapons (cricket bat, frying pan, crowbar, hockey stick, wrench, garden rake, broom spear, axe, umbrella). Only the **crowbar, baseball bat and axe** have shaped models (from `props.js`, drawn in the first-person view). The rest are a few boxes I put together.

- Shaped models, long side along +Z, business end at +Z, grip near the middle, about 0.5 to 0.9 m long: **cricket bat, frying pan, hockey stick, wrench, garden rake, broom spear, umbrella** (closed). Handoff icons are in `assets/weapons/*.svg` for the look.
- **Slingshot** (held, plus the stretched-band pose) and a **pistol** (the game's pistol is still two boxes) with a muzzle flash piece and a shell.
- A **worn** version of each melee weapon for when its condition falls under a quarter (bent, chipped, taped), and a **broken** stub for when it snaps.
- The same weapons **lying on the ground** (loose items) and **in the third-person hand**. For that, tell me the grip point on the survivor's hand bone for each (position and turn), so one model can sit in both views.

### First-person hands
Nothing is drawn for the player's own arms. A pair of forearms and hands in the survivor's skin tone, in three poses: relaxed holding a weapon, empty, and reaching to open or search. They should take the skin colour slot, and the sleeve slot from what the survivor wears.

### Survivor animation for jumping
The jump went in at 0.45.5 and the third-person survivor has no clip for it. Needed: **jump** (crouch, rise), **airborne** (a held pose, arms up a little), **land** (absorb and stand). Also still missing and worth adding at the same time: **hurt flinch**, **drink**, **bandage a wound**, **pick up from the ground**, and **weapon-specific attacks**: overhead chop (axe, hammers), thrust (spear, broom, rake), flat swing (bats, hockey stick, pan).

## 2. Art 3 leftovers (roadmap row "Art 3")

- **Loose items on the ground** are already modelled in `props.items` but the game does not place them yet. Missing from that set: stone (throwable), flare, lure, batteries, matches, nails, seeds, antibiotics, painkillers, vitamins, soda can, granola bar, rice bag, blanket, books, cloth scraps, sticks, tin can, berries, rain jacket, lantern, ammo box, pistol.
- **Loot containers.** Searchable containers are drawn as spinning gold cubes today. They need real models, each searchable: cupboard, wardrobe, kitchen drawers, filing cabinet, medicine cabinet, glove box, car boot, toolbox, till, bin, shelf stack, locker (the locker exists), duffel bag. One "already searched" variant of each (drawer open, lid up).
- **Trees and plants.** The pack has oak, pine, bush, dead tree, grass tuft and rock. Needed on top: autumn oak, birch, willow (for the creek), stump, fallen log, fern, flower patch (three colours), reeds, mushrooms, cut-down stump, bramble.
- **Street props the game could place but has no model for yet:** road signs (speed, one way, yield), street name post, parking meter, bike rack, phone box, bollard, crash barrier, manhole cover (flat), road markings and crossings (flat decals), shop awnings, hanging shop signs, satellite dishes, air-conditioning units, chimneys, water tanks and roof hatches for building roofs.
- **Opening doors and lids.** `moving` in `props.js` has the car doors already; still needed as separate hinged pieces: house door, shop door (glass), garage door (rolls up), window shutter, fridge door, cupboard doors, chest and crate lids, car bonnet and boot (for the truck repair jobs).
- **The truck.** The repair jobs (battery, tyre, engine parts, fuel) are fitted to the old model. A shaped pickup with a bonnet that lifts, four wheels that come off, a fuel cap, and a battery visible under the bonnet. Plus a **rusted wreck** version of each car for parking lots, and a **burnt-out** version.

## 3. Things players build and place (all boxes today)

- **Wall / barricade** (`cade`): planks nailed across a gap, three stages: new, damaged, nearly gone.
- **Window boards** and a **reinforced door**.
- **Camp fire** with logs, a **fire pit** ring, a **lamp/lantern** post.
- **Generator** (boxes today; the pack's `items.generator` is for carrying), running and off versions.
- **Rain collector** (done), **garden plot** (done), plus a **compost bin**, **water filter**, **drying rack**, **cooking spit**.
- **Tool bench** (repairs weapons) and **workshop table**.
- **Dropped pack** (a blue box today), **grave marker**, **map marker flag** (the Mark button).

## 4. Art 4: the ground

Smooth hills with sharp kerbs, creek and river banks, ravines. Needed as ground materials (tileable, flat colour with small shapes, four seasons where it matters): road, road with centre line, sidewalk, kerb strip, grass, dry grass, dirt, gravel, mud, sand, water edge, leaf litter (autumn), snow. Also puddle and ice decals, and cracks and potholes for roads.

## 5. Art 6: broken buildings

For every bay type in `buildings.js` (wall, window, door, shopfront, garage): a **damaged** state, a **hole** state, and the **rubble** piles that fall, in the same palette so a half-broken street still reads. Frames should have a **snapped** version. Interior side too: torn wallpaper, exposed studs, daylight. Also **boarded** versions of window and door bays.

## 6. For the next game steps

- **Horde nights (0.47):** at least two new alien kinds beyond swarmer, stalker and giant. One ranged (a spitter with a spit projectile) and one that climbs (a clinger for walls and roofs). Each with idle, walk, attack, dead. Plus a **hive nest** growth stage (small, grown, burst), and **alien blood / goo** decals and a **corpse-fade** pose.
- **Paper map (0.48):** a held folded map and an unfolded map the player looks at: paper, creases, pencil marks, a compass rose.
- **Recruitable survivors (0.49):** four to six ready-made NPC looks (not the creator), each with a distinct silhouette, plus **sitting**, **leaning on a wall**, **waving** and **carrying a crate** clips.
- **Sky:** moon phases, cloud shapes for the three weather types, rain and snow streak pieces, a lightning flash, a faint aurora for the final-night event.

## 7. Effects (small pieces the game animates)

Muzzle flash, bullet tracer, hit spark, dust puff on landing, footstep puffs (dust, snow, splash), water splash and ripple, flame (three sizes), smoke column, explosion (core, ring, debris), flare glow, alien goo splat, glass shards, wood chips. Each as one to four pieces with a note on how it should scale and fade.

## 8. UI art

Matching icons for the new buttons (Jump, Build mode, Back), a damage-direction arrow, the low-health vignette, and a small **status icon set** (bleeding, infected, broken leg, wet, cold, hot, hungry, thirsty, tired, sick), drawn to the field-journal style.

## 9. Sound (if the design chat covers it)

Jump grunt, landing thud per surface (grass, road, wood, metal), a swing and a hit for each weapon type (wood, metal, pan clang, umbrella flap), pistol shot and dry click, alien sounds for each kind (idle, notice, attack, die), door creak and slam, drawer and lid, generator hum, rain on roof versus rain outside, fire crackle, and a short musical sting for night falling and for dawn.

## 10. Voxel buildings, power and vehicle damage (new, version 0.49.4, 19 October 2026)

For roadmap steps 0.56 to 0.60. The game is moving to one wall logic: every wall, inside or outside, generated or player-built, is a run of **cells** (voxels). Nothing here replaces `buildings.js` yet; these pieces sit beside it and are wired in step by step. Same rules as before (shaped pieces, pack palette, metres, flat colours). Ask me before settling the cell size if it fights the look; my proposal is a **0.25 m cell** (four to a metre, so it fits the half-metre build grid), a wall panel 1.5 m wide, and storeys 3.0 m high.

### 10.1 Wall construction, by material
Build walls the way a real house is built: a **stick frame sandwiched between an outer skin and an inner skin**. The game builds the wall from these layers, so each needs its own piece. Module: studs every **0.5 m** (matches the build grid), cells are half a bay (**0.25 m**) for breaking, a wall panel is 3.0 m (six bays) by the storey height, and the wall is about 0.2 m thick. Storeys are 3.0 m for houses, 3.5 m for shops, offices and community buildings, 4.5 m and up for industrial buildings, halls and warehouses, so panels are needed in those heights (or tall pieces that can be stacked).

**Layers (outside to inside):** outer skin (wood siding, brick, sheet metal, curtain-wall glass), sheathing (plank or board), **frame**, inner skin (plasterboard, wood panelling, plaster). Each layer needs states: whole, cracked, **gone** (so you can see the layer beneath) and rubble.

**Wood stick frame** (houses, sheds, small shops): bottom plate, studs, double top plate, king stud and jack stud either side of an opening, header over it, sill and cripple studs under a window, three-stud corner post, a T-wall backer, blocking half way up; floor joists with rim joist and plank subfloor; rafters and trusses with roof boards. A **snapped** version of every stick (studs bent or splintered).

**Light steel stud frame** (shops, flats): the same layout in steel channel with track top and bottom, and sheet-metal skins.

**Steel frame** (offices, big stores, warehouses): column, beam, cross brace, metal deck floor with concrete topping, curtain-wall mullion and glass panel, sheet-metal cladding panel.

**Concrete** (the biggest buildings, bunkers, car parks): poured wall and column, flat slab with rebar showing where cracked, concrete block (a wall of blocks, one block missing), brick veneer.

Joints needed in each material: straight, corner, T, cross, wall end, wall on a floor edge, floor and ceiling plate, stair opening, and door and window **openings** (frame, header, sill). Doors and windows need intact, cracked and breached states.
Also a **tileable one-bay section** per material (all layers, four states) so a wall can be built from copies.

### 10.2 Harvest materials (items)
Icons and loose-on-the-ground models for what comes out of broken walls: planks, scrap wood, nails (a handful), steel beam, rebar bundle, sheet metal, concrete chunk, brick, glass sheet, wire (a coil). Plus **dust and chip bursts** per material (wood chips exist; need concrete dust, brick bits, metal sparks).

### 10.3 Bases
A **claim marker** that shows a building is a base (a small sign or flag nailed by the door), a **custom bed** made from harvested pieces (frame of planks, a mattress of cloth scraps) that looks different from the found beds, and **reinforcement pieces** laid over a wall of each material (planks across, sheet-metal plate, extra rebar mesh) in three stages like the existing barricade.

### 10.4 Power
- **Power plant**: a small plant that can stand on the edge of a city (turbine hall, stacks, transformer yard) in **dead** and **running** versions (glow pieces for windows and lights), plus control panel inside.
- **Substation** with fence, **pole** with a transformer, **pylon**.
- **Breaker panel** on a house wall: closed box, open box with a row of breakers, one breaker **tripped**.
- **Cable box**: a portable junction box with a handle, three or four sockets and a status lamp (off, on, overload). **Cable**: a straight piece and a corner piece that can be laid along the ground and up a wall, and a plug end.
- **Battery bank** (car-battery rack and a bigger box), **solar panel** (portable folding and a roof one), and an **outlet** and **light fitting** in on and off states for inside walls.

### 10.5 Vehicle damage
For every car: **front crumple** (light, heavy), **bonnet buckled**, **smoking bonnet**, cracked and missing **windscreen**, **bent bumper**. The pickup and van too. A **crash burst** (metal bits, glass, dust), **skid marks** (flat decal), and **hole in a wall** frames the car can come through, per material.

### 10.6 Sound
Wood crack, brick crumble, concrete crack, steel scream and bend, glass break, car hitting wall (light and heavy), plug in, breaker trip, power plant start, and the hum of a street coming back to power.

## 11. What the game still needs after version 0.69.0 (new, 20 October 2026)

Everything in the code that can be built without new art is built. These are the places where the game uses a plain box, a flat colour or a text label today and a shaped piece would replace it. Each line says where it goes in, so the piece can be dropped in without a code change if it follows the usual rules (shaped piece, pack palette, metres, flat colours, origin at the base).

### 11.1 Town buildings and walls
- **Broken wall states for the buildings pack (Art 6).** A torn-open stretch of an outer wall is a dark flat opening with five small rubble boxes today (`breachApply` in play.html). Needed: a ragged **hole frame** per wall material (siding, brick, metal, glass curtain) in 2.4 m and 4 m wide versions, with torn edges, exposed studs or bricks, and a **rubble pile** to lay at its foot. Also a **boarded** version (planks nailed across the hole) for when the player closes it.
- **Cracked wall states** (whole, cracked, bricks missing) so a wall can be seen weakening before it goes. Today the game only shows whole or open.
- **House number digits** (0 to 9) as a plaque or painted numerals for the front of each house, and a **street name sign** piece for corners.
- **Gun shop** front and interior (needs the map chat to flag a building kind first, see MAP_REQUESTS.md).

### 11.2 Claiming and fortifying
- **Claim sign or flag** to nail by the door of a claimed base, a **custom bed** (planks and cloth scraps), and **reinforcement overlays** per material (planks across, sheet plate, rebar), as already listed in 10.3. Still wanted: a **door brace** (bar across a door) and **window boards** that can be seen from outside.

### 11.3 Power
- **Power plant yard**: dead and running versions, the control panel outside the front, and the glow pieces. **Substation** with fence, and **pole and pylon** pieces for roads. (10.4 has the full list. The game now has working versions of all of these and draws a box for each.)
- **Breaker panel** and **outlet** pieces for interior walls, **wall lamp** on and off, and **cable box** and **solar panel** models (the game draws boxes for them today).

### 11.4 Guns and ammunition
- **Reload poses** for first person, per gun class: pistol (magazine out and in), rifle and shotgun (rack, shell by shell), revolver, bow (nock an arrow), crossbow (cock and load), flare gun (break open).
- **Magazine models** (pistol, rifle), **shell** and **cartridge** props for the ground and for the thrown-casing effect, **arrow** and **bolt** models lying on the ground and stuck in a target, and the **quiver** as a worn piece on the back.
- **Third-person long-gun carry** (rifle and shotgun slung or held at the shoulder) for the survivor rig.
- **Rust and wear**: a worn version of each gun (pitted, grey) for guns below a quarter condition.

### 11.5 Vehicles
- Damage states from 10.5. The game now has **vehicle health** (0 to 100, wrecked at 0, burning for a minute) so the car needs **light, heavy and wrecked** looks plus **smoke** and **flame** pieces on the bonnet (the generic large flame and smoke column are used today).
- **Boot lid open** state for searching a parked car, and a **fuel can** being siphoned.

### 11.6 Carrying and furniture
- A **carried furniture pose** (arms out front holding a chair, table or wardrobe) so the model can be seen in your arms; today the piece is hidden and you walk slowly.
- **Weights by piece** are not in the game yet: if the design chat gives a size class per furniture piece it can drive the speed.

### 11.7 Sky, weather and water
- **Rain ripples** (a small expanding ring decal for puddles and water), **splash** on roofs, **cloud shapes** for the three weather types, and a **lightning flash** sky piece. Moon phases (eight) and the aurora are in and working.

### 11.8 Map and journal
- **Held paper map** in first person (folded in the hand, and unfolded with the player looking at it) with creases and pencil marks, and **map pickup** model for the ground.
- **Road names** are data, not art: see MAP_REQUESTS.md.

### 11.9 Ground, props and loose items (Art 4 and the props the game does not place yet)
- **Ground tiles** (Art 4): grass, dirt, gravel, sand, mud, snow, pavement, with edges.
- **Loose items on the ground** for every inventory item the game can drop (cans, bottles, bandages, tools, ammo boxes, planks, nails, sheet metal, concrete chunk, scrap, car part, battery, tyre, fuel can, paper map).
- **Street props**: traffic lights, cones, barriers, bus stops, power poles, fences, sandbags.
- **Trees and plants** from the pack (oak, pine, bush, dead tree, grass, rock) in the game's scale.

### 11.10 Survivors
- The clips from section 6 (sit, lean, wave, carry crate) are still unused. The game has survivors that can be recruited and given a job; it needs **a panel portrait** per survivor look and **work poses** (chop, fish, keep watch).

### 11.11 Music and sound
- **Music**: a quiet day loop, a tense night loop, a chase sting, a horde-night loop, a calm base loop. Two or three minutes each, seamless.
- **Sound**: the list in 10.6, plus **gun reload clicks and rack**, **arrow thunk**, **flare gun pop**, **plant start-up klaxon**, **furniture drag**, **footsteps on gravel and snow**, **rain on a tin roof**.

### 11.12 Summary by priority
1. Broken and boarded wall pieces (11.1, 11.2): they are the most visible thing players do.
2. Reload poses and ammo props (11.4): every gun fight shows them.
3. Loose item props and ground tiles (11.9): the world still looks bare.
4. Vehicle damage looks (11.5).
5. Power yard pieces, breaker panel, outlets (11.3).
6. Music and sound (11.11), held map (11.8), the rest.

### 11.13 Delivered by the design chat (20 October 2026, pushed to main)

Everything in section 11 is now on main. About half of it had already been delivered in sections 1 to 10 and only needs wiring; the rest is new. Formats and rules for every piece are in `docs/SHAPED.md`.

| Request | Where it is | New? |
| --- | --- | --- |
| 11.1 Torn wall hole frames (siding, brick, metal, glass; 2.4 m and 4 m), rubble pile, boarded | `buildings.breach[finish]`: `hole_2.4`, `hole_4.0`, `rubble_*`, `boarded_*`; for any other length `edge_left`, `edge_right`, `top` (stretch) and `boarded_1m`. Matches `breachApply`: faces at z = ±0.05, up to 2.7 m | New |
| 11.1 Cracked, bricks missing | `buildings.breach[finish].cracked_<W>` and `missing_<W>`, drawn over a whole wall | New |
| 11.1 House numbers, street name sign | `buildings.house.plaque` and `digit_0`..`digit_9`; `street_blade` (two on `props.street.street_name_post`) | New |
| 11.1 Gun shop | `buildings.modules.gunshop_front` (a ground-storey bay); inside: `props.shop.gun_counter`, `gun_rack`, `ammo_shelf`, `target_poster` | New |
| 11.2 Claim sign or flag, custom bed, reinforcement | `props.build.claim_sign`, `claim_flag`, `custom_bed`, `reinforce_planks`, `reinforce_sheet` and `reinforce_mesh` (each with `_damaged` and `_nearly_gone`) | Already there |
| 11.2 Door brace, window boards from outside | `props.build.door_brace`, `window_boards_bay` (fits a buildings.js window bay) | New |
| 11.3 Power plant, control panel, substation, pole, pylon, breaker panel, outlet, wall lamp, cable box, solar | `power.js`: `power_plant_dead`/`_running`, `control_panel_*`, `substation`, `pole_transformer`, `pylon`, `breaker_panel_closed`/`open`/`tripped`, `outlet_*`, `wall_light_*`, `ceiling_light_*`, `cable_box_off`/`on`/`overload`, `solar_portable`, `solar_roof`, `battery_rack`, `battery_box`, cables and plug | Already there |
| 11.4 Reload poses | `held.models.fpReload` plus `held.fpReload` (weapon, state, position, item in hand): pistol and carbine magazine out and in, shotgun rack and shell loading, double barrel open, rifle bolt, revolver, flare gun open, bow nock and draw, crossbow cock. New states: `pistol.empty`, `flare_gun.open` | New |
| 11.4 Magazines, shells, cartridges, casings, arrows, bolts, quiver | `held.ammo`: `pistol_magazine`, `carbine_magazine`, rounds, boxes, `arrow`, `crossbow_bolt`, `quiver`; `held.cases` for thrown casings. New: `arrow_stuck`, `bolt_stuck`, `flare_shell`; `survivor.parts.npc.quiver` worn on the back | Partly new |
| 11.4 Third-person long-gun carry | `survivor.clips.carry_long`, `aim_long` with `heldTurn`; `survivor.sling` puts a gun across the back | New |
| 11.4 Worn guns | `held.weapons[gun].worn` for every gun | Already there |
| 11.5 Light, heavy, wrecked, smoke, flame | `props.vehicles[car].damage`: `body_bumper_bent`, `body_crumple_light`/`heavy`, `bonnet_buckled`, `windscreen_cracked`/`missing`, `smoke`, and new `fire`. `damageRule` maps vehicle health to the looks | Fire is new |
| 11.5 Boot lid open, fuel siphon | `vehicles.sedan.boot` and `hatchback.boot` with `vehicleRig[...].bootHinge`; new `props.items.fuel_siphon` | Siphon is new |
| 11.6 Carry pose, weights | `survivor.clips.carry_furniture` (with `carryAt`), `props.furnitureSize` (class and kg per piece, with a speed rule) | New |
| 11.7 Ripples, roof splash, clouds, lightning | `fx.effects.ripple`, new `fx.effects.roof_splash`, `fx.sky` clouds and `lightning` | Splash is new |
| 11.8 Held map, map pickup | `held.map.folded` and `open`; new `props.items.paper_map` | Pickup is new |
| 11.9 Ground tiles with edges | `ground.js` tiles; new `ground.edges` (grass, snow, gravel, dirt, sand) | Edges are new |
| 11.9 Loose items, street props, trees | `props.items` (every listed item; the car part is `engine_parts`, the tyre `spare_tyre`), `props.street` (traffic light, cones, barriers, bus stop, power pole, fences, sandbags), `props.plants` | Already there |
| 11.10 Portraits, work poses | `assets/ui/portraits/<look>.png`; `survivor.clips.work_chop`, `fish` (with `parts.npc.fishing_rod`), `keep_watch` | New |
| 11.11 Music and sound | `assets/audio/`: `sounds_design.js` (68 keys added to `window.ART.sounds`), `music_day`, `music_night`, `music_horde`, `music_base` (two-minute seamless loops) and `music_chase` (sting); `preview.html` | New |

---

Suggested order: section 1 (so the weapons and jump look right), then loose items and loot containers from section 2, then section 3, then Art 4 and Art 6.

## 12. Making the world look better: what is still missing (new, version 0.80.0, 20 October 2026)

**What the game now uses from your packs (0.80.0):** street (stop sign, traffic light, street name post, power pole, manhole, speed sign, bus stop, parking meter, bollard, phone box, bike rack, newspaper box, mailbox), plants (fallen log, stump, fern, mushrooms, bramble, three flower patches, reeds), ground decals (crack, pothole, skid marks). Still **not used because the game side has no place for them yet** (I will do these next, no new art needed): traffic cones and jersey barriers (road works), crash barrier, tyre pile, chain-link and picket fences on lots, road paint models (centre dash, stop line, crossing), shop awnings and hanging signs, roof pieces (AC unit, chimney, water tank, satellite dish, roof hatch), birch and willow as choppable trees, tile edges and kerb strips, puddle and ice decals, snow and leaf tiles.

**New art that would help most, in the same style and palette rules as before** (pieces, flat colour, metres, +Z front, pivot at base centre):

*Farms and fields* (the map has farmland and farm buildings that are plain boxes today)
- Crop rows as tileable 2 m strips: corn (tall, brown in autumn), wheat, soybean, bare ploughed earth, hay stubble; plus a harvested look.
- Round and square hay bales, a hay stack, a scarecrow, a wire and post fence run (1 m, 3 m, corner, gate), a field gate, a feed trough, a water trough, an irrigation pivot (one span with wheel), a mailbox on a post.
- Farm buildings: barn (red, open and shut loft door), silo, grain bin, machine shed, chicken coop, farmhouse look, windmill, farm pond dock, tractor and flatbed trailer as vehicle shells.

*Woods*
- More trees: spruce, a tall thin woodland oak, a young sapling, a dead pine, winter (bare) and snow-laden versions of oak and pine, with the trunk radius for collision in the notes.
- Undergrowth: tall grass clump (three heights), a fallen tree across a path, a root ball (tipped tree), moss rock, boulder cluster, hollow log, deer track decal, leaf pile, berry bush (food).

*Rivers, ponds and lakes*
- Bridge pieces (deck, rail, pier, abutment) for roads and paths, a culvert pipe, stepping stones, rock bank pieces, a boat ramp and a small dock, a rowboat and a canoe, lily pads and cattails (taller than the reeds), a duck and a heron (static is fine), shore foam strip, a dam or weir.

*Parks and sports*
- Playground (swing set, slide, seesaw, climbing frame, sandpit), picnic table, BBQ grill, drinking fountain, trash can with a lid, park sign, gazebo or pavilion, statue on a plinth, fountain (dry and running), baseball backstop and bases, basketball hoop and court lines, goal posts, tennis net, running track lines, trail marker post.

*Streets and town*
- Gas station pieces (pump, canopy, price sign), car wash, drive-through menu board, shopping cart (upright and knocked over), vending machine, ATM, billboard, utility wire span between poles (a sagging line piece), transformer on a pole, storm drain grate, kerb ramp, speed bump, road works barrier and arrow board, fire escape stairs for buildings, graffiti and litter decals, tyre marks, oil stain.
- Church steeple, school bell, hospital helipad and sign, a stadium stand section, parking garage ramp.

*Cars*
- More vehicle kinds: bus, school bus, ambulance, fire truck, police car, box truck, motorbike, bicycle, semi cab. Visible seats, wheel and dash through the windows (the interior seen from outside), licence plates, headlight and tail-light glow pieces, a roof rack, a mud-spattered variant.

*Building interiors*
- Floor materials with real patterns: carpet, wood boards, kitchen tile, bathroom tile, linoleum, concrete, warehouse floor (drawn as flat tiles, 2 m).
- Wall decor: framed picture (three sizes), wall clock, mirror, curtains (open and shut), blinds, poster, shelf brackets, coat hooks, light switch and socket plate.
- Ceiling pieces: ceiling light (off, on, flickering), ceiling fan, smoke alarm, air vent, exposed beams.
- Room clutter: books, papers, dishes, bottles, clothes pile, toys, tin cans, toolbox, boxes, cobwebs, mould, blood and debris decals, fallen ceiling tile, tipped chair.
- Room kinds still empty: classroom (desks, board), office (cubicle, filing), hospital (bed, drip stand, curtain), church (altar, font), warehouse (racking, pallet), garage (tool wall, workbench, jack stand), supermarket (aisle shelves, freezer, checkout).

## 13. Delivered: the design list of 20 October 2026

Roads, sidewalks, water and edges, rocks, service vehicles, animals, street signs and lights, shop signs and interiors, and floor plans. Formats and rules for every piece are in `docs/SHAPED.md` (each pack's own notes), floor plans in `docs/FLOORPLANS.md`. The album (`art-tests/album.html`) has a scene for each.

| Request | Where it is |
| --- | --- |
| Roads | `world.roads` (asphalt new, worn, patched, concrete, cobbles, gravel, dirt, highway, parking lot; 4 m tiles), `world.markings` (centre, lane, edge, stop line, crossings, arrows, bays, painted words), `world.kerbs` (corners, ramps, driveway dips, medians, roundabout centre, speed hump, drains, manholes) |
| Sidewalks | `world.sidewalks` (slabs, cracked, brick, stone, asphalt path, gravel path, tree pit, grass verge, tactile strip; 2 m tiles) |
| Water, rivers | `world.water` (lake, pond, river, rapids, shallow, deep, swamp, frozen, ripple ring, wake). Flow animation is done by the game by scrolling streaks along +Z |
| Edges of rivers, lakes, waterfalls | `world.banks` (grass, mud, sand, rock, concrete, steep, reeds, each straight, corner_out and corner_in) and `world.falls` (lip, sheets, pool, mist, spray, cascade step, weir) |
| Rocks | `world.rocks` (granite, sandstone, basalt, limestone, slate, river stones, scree, mossy, each small, medium, large; cliffs; iron, copper, coal, quartz and gold ore; flint; stepping stones) and `world.items` for what they give |
| Construction and service vehicles and their movements | `machines.js`: excavator, bulldozer, dump truck, cement mixer, garbage truck, fire truck, ambulance, tow truck, mobile crane, bucket truck, forklift, road roller, street sweeper, school bus. Each has a rig (what turns or slides, where, how far), wheels, steering, work clips and beacons |
| Animals and animations, hunted for food and resources | `animals.js`: deer, buck, boar, cow, sheep, goat, dog, wolf, fox, bear, raccoon, rabbit, squirrel; turkey, chicken, duck, goose, pigeon, crow; trout, bass, catfish. Clips: walk, run, eat, alert, idle, die, dead (a carcass is the animal in its dead clip), attack and rear where they apply, fly, glide, peck, float, swim, flop. `INFO[name]` gives size, speed, behaviour and yields; `items`: raw and cooked meat, fish, hide, pelt, feathers, bone, fat, antler, wool, egg, meat on a rack |
| Street signs and lights | `props.street`: 24 new signs (no parking, no entry, all-way stop, warnings, road work, detour, hospital, evacuation, speed limits, route shield, railroad crossing off and on, overhead gantry), five lamp types each `_off` and `_on`, traffic signals on a mast arm and a span wire in five states, walk signals, flasher |
| Shop signs, interiors per building type and use | `interiors.js`: a wall board and a blade sign for each of 49 business kinds, window stickers, fuel pylon; about 110 fixtures grouped retail, food, security, medical, school, faith, office, industrial, utility, home; `roomFixtures` maps each room type to its fixtures in the form `ROOMS` uses |
| Floor plans with an unobstructed walkway to every room: residential, commercial, religious, utility | `floorplan.js` (generator and checker; 45 building kinds and aliases, one to four storeys); see `docs/FLOORPLANS.md` |

## 12. Still on third-party art (new, version 0.94.0)

The ready-to-send request, with what already exists and what is missing, is `docs/CONTENT_REQUEST_REPLACE_PACKS.md`.

Everything below is still in the game and is not ours. Each line says what it is, where it is used and what the game needs back. Same rules as every pack (shaped pieces, metres, origin at the centre of the base, front facing +Z).

### 12.1 Trees and plants (Kenney Nature Kit, `assets/nature.js`, built by `tools/build_nature.py`)
The biggest one: it is every tree, bush, grass tuft, flower, fern, rock, mushroom and log in the world, plus the far-away tree pictures.
- Trees: oak, maple, sycamore, poplar, pine, cedar (each in a few sizes and a bare/autumn colour variant; the game recolours by season).
- Bushes, tall grass, flowers (the game lets you gather from them), ferns, mushrooms, rocks, logs and stumps.
- The shaped plants already in `assets/shaped/` (oak, pine, birch, willow, stump and so on) are not wired in yet; the game side can swap them in as soon as the set covers the list above.

### 12.2 The pickup truck (Kenney Car Kit, `assets/vehicles.js`)
The truck body, its four wheels, bonnet, a loose door and a tire. Town cars are already ours. Need: a shaped pickup truck with wheels that spin and steer, a hood that opens, a door that comes off and a loose tyre.

### 12.3 A few furniture pieces (Kenney Furniture Kit, `assets/models.js`)
Still old: a stool, two medium and one small decorated cabinets, a potted cactus, and the kitchen basin, night table, bunk bed, house plant, rug, washing machine, coat stand and kitchen stool. Need shaped versions of those thirteen (the other furniture is already ours).

### 12.4 Sounds (Kenney Impact Sounds and RPG Audio, `assets/sounds.js`, built by `tools/build_sounds.py`)
Footsteps, impacts, glass, doors, cloth and metal. Gunfire, alien calls, rain, wind and thunder are made by the game. Need recorded or synthesised replacements for footsteps by surface, impacts, glass breaking, door open/close/smash, cloth and metal.

### 12.5 Not third party (no work needed)
Survivors move on the skeleton and clips of Quaternius's Universal Base Characters and Animation Libraries (CC0, `assets/rig.js`). The bodies are ours; if the design chat wants its own skeleton and clips, that is a separate request.

## 12 delivered (25 October 2026, for game 0.94.1)

All four jobs in `docs/CONTENT_REQUEST_REPLACE_PACKS.md` are done. Every piece is shaped, flat-coloured, in metres, with the origin at the centre of the base and the front facing +Z. Previews are in the album (scenes "Trees and plants", "Pickup truck parts", "Furniture set 2").

| Third-party file | Replacement | Where | The game can now remove |
| --- | --- | --- | --- |
| Kenney Nature Kit trees, bushes, grass | `assets/shaped/flora.js`: oak, maple, sycamore, poplar, cedar, pine (summer and, for the first four, `_fall`), each with three shape variants (`_b`, `_c`) and a far version of 60 triangles or fewer; `bush`, `bush_small`, `shrub`, `grass_tuft`, `grass_tall` (also three variants). Heights are the game's real heights. | `info[name]` gives h, variants and far model | the tree, bush and grass models in `assets/nature.js` and their CREDITS.md line, once the old plants below are also wired (flowers, fern, mushrooms, rock, log and stump are in `props.plants` already) |
| Kenney Car Kit pickup | `props.vehicles.pickup` (already ours, 5.5 m by 1.9 m) now also has `door_l` (the driver's door), `door_gap` (what shows when it is gone), `pickup_wreck` and `pickup_burnt` versions of both, and `vehicleRig.pickup.doorHinge/steerRule/looseTyre`; `items.tyre_loose` and `items.tyre_loose_flat` are the loose tyre | `assets/shaped/props.js` | `assets/vehicles.js` and its CREDITS.md line |
| Kenney Furniture Kit (13 pieces) | `assets/shaped/furniture2.js`, `models.furniture.<name>` with the game's own names, each inside its footprint from `tools/out/models.txt` | `furniture2.js` | those 13 entries in `assets/models.js` and the credit |
| Kenney Impact Sounds, RPG Audio | `assets/audio/sounds_content.js`: `step_grass/road/wood/tile/carpet/water`, `hit_fist/bat/blade`, `glass_smash`, `door_open/close/smash`, `cloth_rustle`, `metal_clang`; 3 to 4 variations each, mono, 0.16 to 1.3 s | `window.ART.sounds` (load after `sounds_design.js`) | `assets/sounds.js` and `tools/build_sounds.py`, once the game's sound names are pointed at the new keys |

Notes for the game side:
- Trees: pick the variant by hashing the tree's position; use `plants.<name>` inside about 60 m and `far.<name>` beyond (same names, same size). For autumn swap to `<kind>_fall`.
- The pickup's front wheels steer about y (up to 30 degrees); all four spin about x.
- Sounds are new key names, so nothing existing is overwritten; `glass_break` stays, `glass_smash` is a second, bigger set.

### Wired into the game (version 0.95.0)

All four jobs are in the game now and nothing third party is left except the survivors' skeleton and clips (`assets/rig.js`, Quaternius CC0).
- **Trees and plants:** `assets/nature.js` is rebuilt from `flora.js` (and the older `props.plants`) by `tools/export_shaped_plants.js` and `tools/build_nature.py`. Every tree and the bushes and grass use all three shape variants, picked by where they stand. The far-away tree pictures are baked from the near models; the separate `far` models are not used yet (they would replace the pictures).
- **Pickup truck:** the safe-house truck is the pickup in red. Its door, the gap the door leaves and the loose tyre are `door_l`, `door_gap` and `items.tyre_loose`. Wreck and burnt versions of the door are not used yet (the truck has no wreck state). `assets/vehicles.js` is down to sizes only.
- **Furniture:** `furniture2.js` supplies the thirteen pieces; `assets/models.js` is down to sizes only.
- **Sounds:** `sounds_content.js` is loaded; the game's old names map onto the new ones (`step_concrete` is `step_road`, `hit` is `hit_fist`, `wood_hit` is `hit_bat`, `glass` is `glass_smash`, `search` is `cloth_rustle`, `chop` is `hit_blade`, `metal` and `pot` are `metal_clang`). Still made by the game's own `tools/synth_sounds.py` because the set has no match: snow steps, body hurt, planks, stone, tin, creaks, latch, pick-up, swing. Wanted from the content chat next: those nine, and `step_snow` in particular.

### Sounds, second round (26 October 2026, content chat)
The nine sounds the game still made itself are now in `assets/audio/sounds_content.js` (same file, load after `sounds_design.js`). New key names, so nothing clashes with the game's own: `step_snow` (4 variations, a soft crunch), `hurt_body` (3), `plank_knock` (3), `stone_clack` (3), `tin_ping` (2), `creak_wood` (3, about 1.1 s), `latch_click` (2), `pick_up_item` (3), `swing_air` (3). Mapping from the game's old names: `step_snow`→`step_snow`, `hurt`→`hurt_body`, `plank`→`plank_knock`, `stone`→`stone_clack`, `tin`→`tin_ping`, `creak`→`creak_wood`, `latch`→`latch_click`, `pick`→`pick_up_item`, `swing`→`swing_air`. With these, `tools/synth_sounds.py` and its output in `assets/sounds.js` can go. Not covered by the request, still open on the game side: the far tree models (`flora.js` `far.*`) are ready to replace the baked tree pictures, and the pickup has no wreck state wired (its `pickup_wreck`/`pickup_burnt` door pieces exist).

## 14. Structures (delivered 26 October 2026, for the map chat's `structures` records)

`assets/shaped/structures.js` (47 pieces, 12 to 456 triangles, version 1; details and the kind-by-kind recipe in `docs/SHAPED.md`, "structures"). Made from `docs/MAP_STRUCTURES.md`, so each `structures[].k` has a piece:
- **bridge, overpass, underpass:** `deck_path / deck_road / deck_wide / deck_rail` (4 m lengths, surface at y = 0, parapets or guards), `pier_cap_*` and `pier_shaft_*_unit` (stretched in y; 0.7 of the road width as the data says), `abutment_*`, `ramp_embankment_road_unit`; styles `truss_road`, `arch_road_8`, `suspension_tower_road` with `suspension_hanger_road`, `stay_pylon_road`, `trestle_bent_unit`.
- **tunnel, passage:** `portal_road / rail / path` (dark bore, wing walls, facing +Z), `tunnel_lining_*`, `passage_frame`.
- **culvert, ford:** `culvert_headwall_pipe`, `culvert_headwall_box`, `culvert_pipe_4m`, `ford_slab`.
- **dam, weir, lock, gate:** `dam_earth_h8`, `dam_earth_road_h8`, `dam_concrete_h8`, `dam_concrete_road_h8` (scale y to `h`), `dam_end_wall`, `spillway_h8`, `weir_step`, `lock_gate_open / closed`.
- **pier, breakwater, wall:** `pier_deck`, `pier_end`, `breakwater_mound_h3`, `retaining_wall_unit` (stretch to `h`).
Conventions: metres, run along +Z, centred, deck surface at y = 0, `_unit` pieces are 1 m tall. Previews: album scene "Structures". Not made: the cables of a suspension bridge between the towers and the stays of a cable-stayed one (the engine draws them as lines from the tower tops; the notes give the heights), water surfaces and the far-away versions.
