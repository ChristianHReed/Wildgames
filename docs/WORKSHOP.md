# AfterStreet Workshop

A companion program for making game assets, the way building games do it: free building from shapes. Version 0.1 (26 October 2026) makes **cars**; weapons, tools, plants, props and furniture come next on the same engine.

Open `workshop.html` beside `play.html` on the drive (works offline from USB or SSD over `file://`, and as a home-screen app on iPhone and iPad from the game's web address).

## What it does

- **Free building from shapes.** Block, soft block, slope, cylinder, tube, cone and plate, plus **more blocks**: corner slope, inside corner, pyramid, prism, hex block, ball, dome, half round (arch) and quarter round. Pick one, tap where it goes: it lands **flush on the face you tap** (face snap), snapped to the grid (½ in to 6 in, or 1 to 25 cm). Tap a piece to select it, drag a selected piece to move it (along the ground by default; lock to X, Y or Z with "Move"). Size, position and turn are exact number fields with − and + buttons.
- **Symmetry planes**, as in Space Engineers: left/right is on by default, front/back optional. A piece placed off a plane is mirrored and stays linked; "Mirrored copy" makes an independent opposite part.
- **Prefabs**: save a group of pieces (a headlight cluster, a grille, a roof rack) and place it on any design. Prefabs travel inside packs.
- **Parts of the car**: each piece belongs to the body, the bonnet (opens on its hinge) or the boot lid. The Wheel view edits one wheel; the game puts it at all four corners.
- **Jobs and materials**: give pieces a job (seat, engine, fuel tank, storage, sleeping spot, headlight, tail light, battery) and a material (sheet metal, heavy steel, glass, chrome, rubber, plastic, lamp, cloth, wood). Seats, range, cargo, lights, salvage and build cost come from them. "Inside parts" are markers that are not drawn in the game (seats and engines hidden in the body).
- **Automatic damage**: the ten damage looks the game already uses (crumples, bent bumper, buckled bonnet, cracked and missing windscreen, smoke, fire), plus the parked wreck and the burnt-out shell, made from the car's own pieces. Strength slider and new variations; any look can be edited by hand and switched back to automatic.
- **Opens the design chat's cars**: any of the ten stock cars can be opened as a copy and changed (their seats, engine, tank and boot space are added as inside parts).
- **Checks**: no engine, no seats, wheels outside the body, scraping the ground, and a detail budget against the stock cars (a stock sedan is about 590 triangles; over 3,000 warns).
- **Units**: inches and feet by default; centimetres and metres on the Check tab.
- Designs autosave in the browser. **Export pack** writes a `.js` file; **Designs → Import a pack file** reads one (a friend's, or your own from another device).

## Reshaping by touch (27 October 2026)

From how Tinkercad and Shapr3D do it: visible handles you grab rather than gestures to discover (Shapr3D found showing push-pull handles raised success "by two orders of magnitude"), handles that keep the same size on screen and draw on top of the model, and touch targets around 44 points.

- **Shape** (the default when a piece is selected): a push/pull handle on each face, coloured by direction (X red, Y green, Z blue). Drag one to stretch that side while the opposite side stays put; **Both sides** stretches from the middle. Arrows past the piece move it along X, Y or Z (with several pieces selected, all move together). A label shows the size or move while dragging ("Width 22 in"), and sizes and moves snap to the grid.
- **Turn**: a ring per axis; drag along one to turn the piece (or the selection, about its middle). It snaps every 15 degrees, or 1 degree with the grid off.
- Handles follow a turned piece's own sides. Blocks, slopes and cylinders change their size, tubes and cones their length or width, plates their width or height, other shapes their stretch. One drag is one undo step.
- **Fine tuning**: every number in the panel is a slider with its value beside it. Drag the slider to try values (the view follows live, one undo step per drag); type the value for an exact one. Sliders step on the grid.

## Vehicles that work like machines, and more creatures (27 October 2026)

How the building games do it: Space Engineers adds the wheel automatically when you place a wheel suspension block, and decorative wheels do nothing; in Scrap Mechanic a wheel only turns on a bearing driven by an engine; Stormworks runs power engine → gearbox → driveshaft, with each part a block you connect. The Workshop now follows the same idea.

- **Axles are blocks.** Wheels are never loose: each axle (Vehicle parts → Axle) carries a pair of wheels at its ends, so moving an axle moves its wheels and making it longer sets how far apart they are. An axle stays on the car's middle line at wheel height; it slides forward and back only. Any number of axles (six- and eight-wheel trucks).
- **Steers and Driven.** Tick each on the axle (Piece tab) or see them all on the Car tab (Axles and drive). The **Steer** toggle below the view turns the steering wheels so you can see them.
- **The power chain.** Engine (a piece with the Engine job) → gearbox (Vehicle parts → Gearbox, or one is drawn behind the engine) → driveshaft → a differential on each driven axle. The Workshop draws the shaft and differentials (they go into the game too, unless you untick it) and checks the chain: no axles, one axle, nothing steers, a driven axle with no engine, an engine with nothing driven. The drive is worked out as front-wheel, rear-wheel, four-wheel or all-wheel drive.
- **Joined up.** As in Space Engineers, where a block must join the grid: the Check tab warns when a piece touches nothing else, and **Select loose pieces** picks them. Axles count as joined when the body is within suspension reach above them.
- Older designs and the design chat's cars get axle blocks automatically (front steers, rear driven); a stock car opened unchanged still exports exactly as it was.
- **Creatures**: ten starting bodies (four legs, heavy four legs, small hopper, two legs, bird with wings, fish, snake, spider with eight legs, insect with six legs and wings, low crawler), each with bones and idle, walk, attack and dead clips (birds and insects also fly, fish swim).
- **Food and temper** (Model tab): diet (plants only, plants and meat, meat only, scraps and carrion), what it eats (grass, crops, berries, seeds, insects, fish, small animals, large animals, people, carrion, rubbish), temper (timid, docile, curious, defensive, territorial, aggressive, predator, pack hunter), when it is out (day, night, dawn and dusk, any time), group size, flies, lives in water, can be tamed; plus health, bite, walking and running speed in mph and when it runs off. The game's plain-words `behaviour` line is written from these. Checks catch a plant eater that eats meat, a hunter with nothing to hunt, an attacker with no bite.

Pack additions (all optional, older readers ignore them): vehicle `rig.wheels` lists every hub (left side first, back to front), `rig.drive {layout: FWD|RWD|4WD|AWD|none, axles:[{z, track, steer, driven}]}`, `game.drive` and `game.axles`; creature `info` gains `diet, eats[], temper, active, group [min, max], flies, water, tameable`.

## Files

| File | What it is |
| --- | --- |
| `workshop.html` | the page and its styles |
| `workshop/model.js` | the design format, shapes to game pieces, measurements, rig, vehicle kit mounts, jobs, salvage, packs (runs in Node too) |
| `workshop/damage.js` | the damage, wreck and burnt-shell generator (runs in Node too) |
| `workshop/view.js` | the 3D view: plain WebGL 1, touch and mouse |
| `workshop/app.js` | the editor |
| `workshop/tools/make_sample.js` | builds `packs/workshop-sample.js` from shapes (`node workshop/tools/make_sample.js`) |
| `packs/packload.js` | the loader the game and the Maps Builder share |
| `packs/index.js` | the list of pack files to load |
| `packs/workshop-sample.js` | the sample pack: the Ozark Rambler, a 1970s wood-panelled wagon built only from Workshop shapes |

## How a design becomes game pieces

Every Workshop piece turns into the design chat's own piece format (`assets/shaped/shapes.js`), so the game draws a Workshop car with the code it already has:

- A piece with no turn, or only quarter turns about Y, stays a native piece (`box`, `bev`, `wedge`, `cyl`, `loft`, `decal`, `poly`) with its `ry`.
- Any other turn is baked exactly: a solid shape becomes one `poly`, a tube or plate one `decal` per face.
- Symmetry adds the mirrored pieces (left/right, front/back, or both).
- Opening a stock car and exporting it unchanged gives back identical pieces (tested on every stock car); mirroring is exact for every shape.

## The pack format (version 1)

A pack is a `.js` file that loads with a script tag from a drive:

```js
(window.AFTERSTREET_PACKS = window.AFTERSTREET_PACKS || []).push({ ...pack... });
```

Everything after the first `{` is plain JSON, so a pack can also be read as text (`AfterstreetPacks.parse(text)`).

```text
pack:   format 'afterstreet-pack', version 1, id, name, author, licence (MIT, CC0 or CC-BY-4.0), made (date), madeWith, notes,
        assets [ ... ], prefabs [ {id, name, pieces} ]
asset (type 'vehicle'):
  id, name, cls (car | pickup | van | truck), author, notes
  paint      {paint1, paint2, paint3}        the car's default paint (use as the colour override, like the taxi and police repaints)
  palette    {x7a2a24: '#7a2a24', ...}       the pack's own colours, named x + hex so they never clash
  model      {body, bonnet, boot, wheel, damage{the ten looks}}     exactly as props.js models.vehicles[name]
  rig        {wheels, wheelAxis, bonnetHinge, bonnetAxis, bootHinge, bootAxis, smokeAt, wheelRule, bootRule, drive}   as props.js vehicleRig; wheels lists every axle's hubs; drive {layout, axles[{z, track, steer, driven}]}
  spec       {length, width, wheelR, wheelW, axles, track, archClear, ground, roof{y,z,w,d}, hood, nose, tail, bumperY, glassFront, cabBack, bed?}   as vehicleSpec
  kit        the vehicle kit entry (wheel, paintSlots, mounts): tyres, rims and the 190 bolt-on parts fit it like the stock cars
  wreck, burnt  {body, bonnet, wheel}; rigWreck, rigBurnt (with sitDrop)
  functions  {seats[[x,y,z]...] (driver first), engine [x,y,z], tanks, storageL, sleep, headlights[], taillights[], battery, engineL}
  game       {seats, driveable, rangeMiles, cargoSlots, sleeps, topSpeedMph, power: none|weak|normal|strong, drive: FWD|RWD|4WD|AWD|none, axles}
  salvage    {scrap, glass, plastic, cloth, wood, tyre, car_parts, car_battery, fuel}   what taking it apart gives
  buildCost  the same items: what building it from the design costs
  stats      {body, wheel, total} triangles
  source     the Workshop design itself, so the pack opens again for editing
```

Coordinates are metres, Y up, the car faces +Z and its right side is +X, as in every shaped pack.

## Putting packs in the game (for the main development chat)

1. Load the loader and the list while the page loads, and write the pack tags after the shaped assets:

   ```html
   <script src="packs/packload.js"></script><script src="packs/index.js"></script>
   <script>AfterstreetPacks.writeTags('packs/')</script>
   ```

2. Before `spInstall()` builds the cars, call `AfterstreetPacks.install(SHAPED)`. Every pack car is then in `SHAPED.props.models.vehicles`, `vehicleRig`, `vehicleSpec` (and `SHAPED.vehiclekit.vehicles`) under `pk_<pack>_<id>`, with `_wreck` and `_burnt` versions, and listed in `AfterstreetPacks.vehicles`.
3. In `engine/interiors.js`, add each entry to the car kinds the way the six newer cars were added (`NEWC` and `CK`): `CK[key] = [key, entry.paint]`, with `VMOD[key]` sized from `vehicleSpec[key]`, and the same for `WB` (wrecks and burnt shells). Damage looks already work by name.
4. Spawn: let pack cars appear among parked cars (a host setting, since packs are content the host chooses), and use `entry.game` for seats, range (300 to 400 miles is the house rule; the Workshop offers 250, 350 and 450), cargo slots and sleeping; `entry.functions.headlights` for the car's lights; `entry.salvage` for Hold J take-apart.
5. Packs a player picks on a device (no drive folder): read the file as text, `AfterstreetPacks.parse(text)` then `AfterstreetPacks.add(pack)`, keep it in IndexedDB, install on start.
6. Multiplayer: a guest's car from a pack the host does not have can be sent as the pack asset itself (it is self-contained JSON), matching "designs copy freely".
7. Add a Workshop button beside the Maps Builder button (`bldGo` in play.html): `location.href = 'workshop.html'`.

## Putting packs in the Maps Builder (for the map chat)

Load `packs/packload.js`, `packs/index.js` and the pack tags in `builder.html` after `assets/shaped/props.js`, call `AfterstreetPacks.install(SHAPED)` before `view3d.js` runs `propInit()`. The builder's prop list reads `SHAPED.props.models.vehicles`, so pack cars appear in its asset list with nothing else to change; placed ones should save their key (`pk_...`) so the game finds the same car.

## Next (the plan for the other asset types)

The engine (shapes, symmetry, prefabs, materials, jobs, packs, the view) is shared; each new asset type adds its own setup panel, jobs and checks:

1. **Weapons and tools** (held items): grip point and hand pose, the swing or shot point, `held.js` format, damage, reach and speed numbers.
2. **Props and furniture**: the size class and weight (`furnitureSize`), containers with a searched version, doors and lids with hinges.
3. **Plants**: growth stages and seasons.
4. **Workshop inside the game** (a workbench screen), using the same files.

Stretch ideas from building games (docs/STRETCH.md): building a design in the game at a garage by filling in a ghost of it with found parts (Space Engineers' projector), panels and bumpers breaking off piece by piece in crashes (Trailmakers), wiring and logic (Stormworks).

## Every asset type: progress (Workshop chat, 27 October 2026)

The Workshop chat builds W1 to W15 from the content chat's plan (`Workshop for every asset - what has to be built`); the content chat makes content with it. Old Python packs are frozen one at a time once they open and re-export identically.

**Done**
- **W1 asset types and packs v2** (content chat's first pass, kept): any model is a design (`type: 'model'`, a kind, a target `SHAPED[pack].models[group][name]`, parts, points, the pack's own tables carried as `extra`). Packs version 2 mix vehicles and models; `packload.js` installs models by target.
- **W3 opening the game's models**: Designs → "Open any model in the game…". Whole vehicles open as one design (a bike, boat or machine is `models[group]` with its parts; `power` keeps a bare list per name). `node workshop/tools/roundtrip.js` opens and saves every model: **2,067 models (83 whole), 0 differ**, and every carried table comes back unchanged.
- **Colours per pack**: a model draws with its own pack's palette and shading (`darker`), and colour slots (BODY, WALL, TRIM, FRAME, ROOF, SKIN, SLEEVE, BASE...) preview with the pack's own paint, examples or summer season; the Paint tab has preview colours for slots. The exported model keeps the slot names.
- **W6 points**: saddle, grips, pedals, seats, helm, wheels, vehicle rig (wheels, hinges, smoke, fuel cap) and `moving` hinges are read as points (426 across the game) and written back exactly where they came from on export.
- **W2 moving parts** (Moves tab): each part can turn about a pivot and axis, or slide along an axis, within a range, hung from another part (the packs' own `rig` format: `{part: {parent, pivot, turn | slide, range, rest, note}}`). Sliders try each joint live; clips (`{name: [{t, part: value}]}`, the bikes' and boats' format) play and take keys from the current pose. A bike's or machine's wheel model is drawn at each wheel point. Rig and clips go back into the pack's `rig` and `clips` tables (bikes, boats, machines), or travel as `asset.rig` and `asset.clips` for new models.
- **Single-list models stay single lists**: adding a part to a props model (a wardrobe's door) keeps the exported model one piece list (the parts are joined), and a turning part's hinge is added to the pack's `moving` table (`{piece, hinge, axis}`) beside the ones already there.

- **W7 states, carrying, details, lights**: a model's states (sibling models `<name>_<state>`: searched, damaged, nearly_gone, out, off, running, fall, b, c ...) open with it and are edited in place (Model tab, States); a new state starts as a copy. All **107** existing states round-trip identically and install beside their model. Carrying sets the props `furnitureSize` class and weight (in pounds in the editor). The pack's own detail tables (`info`, `sizes`, `use`, ...) are editable where they hold plain values, and can be measured again from the pieces. Light points carry a colour and reach (`asset.lights`). A model asset also lists its salvage by material.

- **W9 held items**: a held design is `{new, worn, broken}` with its origin at the grip (the right fist, +Z out of it). "In hand" shows it in a survivor's fist at the pack's grip point. Worn (darker, rusty, small dents) and broken (snapped at about half its length, with splinters) can be made from new. The item side is the game's own design format (`cleanDesign` in play.html): used as a swung weapon, thrown or a tool; fights like a bat, blade, hammer or spear; power 1 to 100, reach 1.5 to 3.2 m, speed 0.7 to 1.4, icon colour, two hands. It travels as `asset.design`.
- **W10 items and icons**: an item design carries `asset.item` (`key`, `name`, `weightLb`, `stack`, `uses`, `recipe: {item: count}`). Any held item, item, furniture or container can render its own icon from the model (a three-quarter view, PNG) into `asset.icon`.

- **W5 skeletons and clips**: aliens, animals and every survivor part open with their skeleton (Designs → survivor, aliens or animals). In a skeletal design each part is a bone; the Animate tab picks a clip, steps or plays its frames (frames a second), shows the frame before (onion skin), and turns the selected bone in the current frame (X, Y, Z degrees, the packs' own rule: about the pivot, X then Y then Z, children carried). Bones can be added (at the selected piece), re-hung and moved. A creature's bones and clips save back to `creatures[name]` with its parts. Pieces keep any field the Workshop does not edit (a hair piece's `hat: 'hide'`).
- **W4 characters and clothes**: a survivor part (top, bottoms, worn layer, shoes, hair, hat, face, gear, NPC gear, body) opens on a survivor of its body, in a plain outfit that leaves out the slot being made, posable with the game's clips and switchable slim, average or broad (stretched as the game does, head and neck kept). "Fit to the body" makes a layer a set gap out from the survivor's own pieces on the ticked bones (sleeves, trouser legs, a coat), in a colour slot (SHIRT, PANTS, ACC, SKIN). The survivor's skeleton and clips are shared, so a part never changes them. The part saves back to `survivor.parts[slot][body][name]`; the creator, NPCs and multiplayer read it unchanged.
- **More shapes** (Make, on the Piece tab): stairs, spun shapes (a profile turned about Y: posts, vases, shades), raised outlines (any outline given a height; non-convex ones too: L-shaped counters, brackets), pipes and cables through points, copies in a row and copies round the middle. They make ordinary pieces, so everything else works on them.
- **W11 plants**: a blank plant has a body and leaves; Make → Tree grows one from height, branches and a seed. Each part has a wind sway weight (`asset.sway`); what it gives when picked or cut is `asset.harvest`. Growth stages and seasons are states (ripe, fall, b, c).
- **W12 creatures**: blank creatures from three templates (four legs, two legs, crawler), each with a skeleton and idle, walk, attack and dead clips, and an info table (height, walk and run speed, health, damage, what it gives). They save to `animals` (or `aliens`) `parts[name]` and `creatures[name]`.
- **W8 buildings and W13 tiles**: guides in the view (a 2.4 by 3 m bay, two storeys, for building modules; a 4 m square for ground tiles); sockets, doors, windows and stairs are points; damaged and broken are states; building and structure assets list a collision box per part (`asset.collide`). Season colour sets of ground tiles are in their Game details.
- **W14 effects**: an effect is a particle recipe (how many, life, size, speed, spread, rise or fall, colours, puffs, streaks or chunks, glowing) previewed live on a loop, with pieces for what one particle looks like; it travels as `asset.effect`.
- **W15 sounds**: a sound design (Designs → Blank sound) is a recipe of noise and tone layers (pitch slide, filter, attack, hold, release, level, start), recorded by the browser into several varied takes (WAV). A sound pack asset replaces or adds `ART.sounds[key]`; `packload.js` installs it, so pack sounds play with no game change when the key already exists (load packs before the first tap starts the audio).
- **Round trip, everything**: **2,172** models, creatures and survivor parts open and save identically (`node workshop/tools/roundtrip.js`).

**For the main chat**: a pack model with `asset.rig` names its moving parts; props models still draw closed, as today. Animating a door from a pack needs the game to draw that part's pieces separately (the pieces are in `asset.source.pieces` with their part name in `g`), which is the same step `moving`'s rule describes for the stock wardrobe. `AfterstreetPacks.models[i]` now also lists `states`, `lights`, `salvage`, `rig` and `clips` for each installed model. **Held items from packs**: `AfterstreetPacks.designs` holds each pack weapon's design (already in the game's `cleanDesign` shape, with `model` set to its installed key and `iconData` a PNG data URL); to use them, add them as a built-in pack of designs the way the street weapons are, accept `iconData` as the icon, and allow model keys longer than 24 characters (pack keys can be `pk_<pack>_<id>` when they would clash). Two-handed pack weapons are added to `held.twoHanded`. **Survivor parts and creatures from packs** install by path (`asset.target.path`, such as `['parts','top','masculine','denim_jacket']`); a new top or hair style needs adding to `survivor.choices` for the creator to offer it. **Items from packs**: `AfterstreetPacks.items` lists each pack item's data and model; the game needs to know a new item key before it can do anything with it.

**All of W1 to W15 are in.** Next: the content chat makes content with it; game-side wiring for what is new to the game (pack designs and icons, pack items, survivor choices for new clothes, effects and sounds with new keys, collision boxes, sway and harvest) is listed for the main chat above; ideas for later are in docs/STRETCH.md.

- **Body types (0.114.46)**: Designs, Open any model in the game, survivor, Make a body type. A body type is a name, a size (width, depth, height; Model tab) and its own head, neck and hands per body. It saves to `survivor.bodyTypes[name].parts[body]` and `.build = [w, d, h]`; the game adds it to the creator's Build list. Height is not part of the stock `builds`, which hold [width, depth] only; a third number is read when present.
