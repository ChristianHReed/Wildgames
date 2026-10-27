# AfterStreet Workshop

A companion program for making game assets, the way building games do it: free building from shapes. Version 0.1 (26 October 2026) makes **cars**; weapons, tools, plants, props and furniture come next on the same engine.

Open `workshop.html` beside `play.html` on the drive (works offline from USB or SSD over `file://`, and as a home-screen app on iPhone and iPad from the game's web address).

## What it does

- **Free building from shapes.** Block, soft block, slope, cylinder, tube, cone and plate. Pick one, tap where it goes: it lands **flush on the face you tap** (face snap), snapped to the grid (½ in to 6 in, or 1 to 25 cm). Tap a piece to select it, drag a selected piece to move it (along the ground by default; lock to X, Y or Z with "Move"). Size, position and turn are exact number fields with − and + buttons.
- **Symmetry planes**, as in Space Engineers: left/right is on by default, front/back optional. A piece placed off a plane is mirrored and stays linked; "Mirrored copy" makes an independent opposite part.
- **Prefabs**: save a group of pieces (a headlight cluster, a grille, a roof rack) and place it on any design. Prefabs travel inside packs.
- **Parts of the car**: each piece belongs to the body, the bonnet (opens on its hinge) or the boot lid. The Wheel view edits one wheel; the game puts it at all four corners.
- **Jobs and materials**: give pieces a job (seat, engine, fuel tank, storage, sleeping spot, headlight, tail light, battery) and a material (sheet metal, heavy steel, glass, chrome, rubber, plastic, lamp, cloth, wood). Seats, range, cargo, lights, salvage and build cost come from them. "Inside parts" are markers that are not drawn in the game (seats and engines hidden in the body).
- **Automatic damage**: the ten damage looks the game already uses (crumples, bent bumper, buckled bonnet, cracked and missing windscreen, smoke, fire), plus the parked wreck and the burnt-out shell, made from the car's own pieces. Strength slider and new variations; any look can be edited by hand and switched back to automatic.
- **Opens the design chat's cars**: any of the ten stock cars can be opened as a copy and changed (their seats, engine, tank and boot space are added as inside parts).
- **Checks**: no engine, no seats, wheels outside the body, scraping the ground, and a detail budget against the stock cars (a stock sedan is about 590 triangles; over 3,000 warns).
- **Units**: inches and feet by default; centimetres and metres on the Check tab.
- Designs autosave in the browser. **Export pack** writes a `.js` file; **Designs → Import a pack file** reads one (a friend's, or your own from another device).

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
  rig        {wheels, wheelAxis, bonnetHinge, bonnetAxis, bootHinge, bootAxis, smokeAt, wheelRule, bootRule}   as props.js vehicleRig
  spec       {length, width, wheelR, wheelW, axles, track, archClear, ground, roof{y,z,w,d}, hood, nose, tail, bumperY, glassFront, cabBack, bed?}   as vehicleSpec
  kit        the vehicle kit entry (wheel, paintSlots, mounts): tyres, rims and the 190 bolt-on parts fit it like the stock cars
  wreck, burnt  {body, bonnet, wheel}; rigWreck, rigBurnt (with sitDrop)
  functions  {seats[[x,y,z]...] (driver first), engine [x,y,z], tanks, storageL, sleep, headlights[], taillights[], battery, engineL}
  game       {seats, driveable, rangeMiles, cargoSlots, sleeps, topSpeedMph, power: none|weak|normal|strong}
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

**For the main chat**: a pack model with `asset.rig` names its moving parts; props models still draw closed, as today. Animating a door from a pack needs the game to draw that part's pieces separately (the pieces are in `asset.source.pieces` with their part name in `g`), which is the same step `moving`'s rule describes for the stock wardrobe. `AfterstreetPacks.models[i]` now also lists `states`, `lights`, `salvage`, `rig` and `clips` for each installed model. **Held items from packs**: `AfterstreetPacks.designs` holds each pack weapon's design (already in the game's `cleanDesign` shape, with `model` set to its installed key and `iconData` a PNG data URL); to use them, add them as a built-in pack of designs the way the street weapons are, accept `iconData` as the icon, and allow model keys longer than 24 characters (pack keys can be `pk_<pack>_<id>` when they would clash). Two-handed pack weapons are added to `held.twoHanded`. **Items from packs**: `AfterstreetPacks.items` lists each pack item's data and model; the game needs to know a new item key before it can do anything with it.

**Next**: W5 and W4 (skeletons, clips, characters and clothes), then W11, W12, W8, W13, W14, W15 and the extra shapes.
