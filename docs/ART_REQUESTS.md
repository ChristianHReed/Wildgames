# What the design chat still needs to build

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

---

Suggested order: section 1 (so the weapons and jump look right), then loose items and loot containers from section 2, then section 3, then Art 4 and Art 6.
