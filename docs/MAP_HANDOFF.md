# From the map chat to the main development chat

## Tenth note, 25 October 2026: Maps Builder 1.7.1

Thank you for 0.96.0 and 0.96.1. Checked: the builder's 3D view works on the new engine, and `shaped/furniture2` is now in its art list (it was missing since 0.95.0, sorry). Nothing is needed from the game for 1.7.x. New in the builder, all kept in the squares as ordinary marked map features (`asmb:made=yes`, `src=edit`): **placed buildings** (21 kinds, with the tags your `kindOf` reads) and **trees**, **removal** of buildings and trees, ground painting, lakes and rivers. The map chat also fast-forwards `gh-pages` to `main` after each builder version; that publishes whatever is on `main` at that moment, including your latest release commits. The map chat will take your next structure steps (tunnels, dams, weirs, piers, deck heights) into the builder's checks as they arrive.

## Ninth note, 25 October 2026: Maps Builder 1.6.0, structures (bridges, overpasses, dams)

The user asked the map chat to learn about bridges, overpasses, dams and other structures. The research (OSM2World, Arnis, osm2streets, and a scan of the whole Missouri file) and the rules are in **`docs/MAP_STRUCTURES.md`**. The builder now finds them and writes a `structures` list in each square. Requests for the engine, most useful first (details and numbers in section 5 of that doc):

| What | Why |
| --- | --- |
| Add `builder/structures.js` to `STATIC` in `sw.js` | New builder file, for offline use |
| Carry `structures` through `fromCompact` and `toCompact`, so `world.structures` exists | Nothing else can use it without this |
| In `bridgeScan`, take the way that goes over from the `overpass` entries (`w` over `u`), not "the non-motorway goes over" | **Today an interstate mapped as the bridge, over a local street, gets the street raised over it, the wrong way round.** The tags say which is right; keep the old rule when there is no entry |
| Deck height: `cl` metres over what is underneath (road 6, rail 8, path 5, river 4, stream 2), 6 m more per extra level, valleys sit on their banks; piers every `min(50 m, length / 2)` | The numbers Arnis and OSM2World use; mapped bridges in Missouri carry `layer` 97% of the time |
| `tunnel` entries: no road surface where the ground is above it, portals at the ends; `culvert`: no waterway ribbon over the span | The game draws neither today (13,000 culverts and 1,500 road tunnels in Missouri) |
| `dam` (wall along the way, crest 6 m, height from `h` or 8 m), `weir` (0.6 m step), `man_made=pier`, breakwaters, retaining walls | Not drawn by any open builder studied; 1,600 dams are mapped in Missouri |

The builder's 3D view uses the same engine, so whatever you add shows there. The **Structures** switch in the builder's 3D view draws a pole on every detected structure, which helps to check the data against what the engine draws.

## Eighth note, 25 October 2026: Maps Builder 1.5.0, and publishing

- **Publishing.** GitHub Pages publishes the `gh-pages` branch, not `main`. The user was still on builder 1.3.1 because 1.4.x was only on `main`, so the map chat fast-forwarded `gh-pages` to `main` (only `builder.html`, `builder/` and `docs/MAPS_BUILDER.md` differed from your last release, `f12226f`). Until you say otherwise the map chat will do the same after each builder version; if you would rather do it yourself, tell the user. Both of us then only ever fast-forward `gh-pages` to `main`.
- **What is new in the builder (nothing for the game to do):** 1.3 sculpting, 1.4 lakes and rivers, 1.4.1 and 1.4.2 file picker fixes for iPad (the picker greyed out `.pbf`; files can now be dropped on the page), 1.5.0 ground painting. All edits are baked into the squares as ordinary `elev` and marked `ways`.
- Thank you for 0.95.1 (ground cell from a quality setting).

## Seventh note, 25 October 2026: Maps Builder 1.3.1, and a request for finer ground

The builder now builds the ground at 10 m by default (5 m is an option; 688 x 683 cells per square at 10 m). **One request:** `buildHeights` in `engine/world.js` resamples the map's height grid to cells of at least 20 m (`cell = Math.max(20, Math.ceil(Math.max(wd, ht)/1400))`), so the finer ground the builder writes is thrown away when the game or the builder's 3D view loads it. Please lower the floor (5 m would still stay within its 1,400-cell limit per side for a 6 km square, so memory stays about 8 MB) and check the terrain mesh cost on a phone: a quality setting could pick 5 m, 10 m or 20 m. Old maps with 20 m or 79 m grids look the same as today. The `elev` format is unchanged (rows and columns are in the grid; the game already reads any size up to 2,000).

Also new, nothing for the game to do: terrain edits (Sculpt) are baked into each square's `elev`, with a count in `builder.edits`.

## Sixth note, 25 October 2026: Maps Builder 1.2.1, on game 0.94.1

Thank you for 0.94.1. The copies of `spB`, `bkMod`, `segsX`, `segX`, `SPB` and `BKM` are deleted from `builder/host.js`, so the engine's own now draw the builder's buildings. Tested in Chromium: the 3D view opens, flies and walks, with no page errors and no missing files. `assets/people_tex.js` is gone since 0.94.0, so the builder's art list no longer requires it (optional art files are skipped if missing). Nothing in `play.html`, `sw.js` or `engine/` was changed. Still open: vehicles in the engine, when it suits.

## Fifth note, 25 October 2026: Maps Builder 1.2.0, the 3D view

The builder now flies and walks the built map with `engine/render.js`. Thank you for 0.93. It works against game 0.93.1 with no changes to the engine. Requests, when convenient:

| What | Why |
| --- | --- |
| Add `builder/host.js` and `builder/view3d.js` to `STATIC` in `sw.js` | Offline use from the website |
| Move `spB`, `bkMod` and `segsX` (with `segX` and their caches `SPB` and `BKM`) from `play.html` into the engine | `builder/host.js` has copies from 0.93.1, so buildings look the same in both. Once they are in the engine, the copies go and the two cannot drift apart |
| Add `wx`, `lamps`, `fires` and `dark` to the host contract in `engine/README.md` | The engine reads them while running (`buildings.js`, `collision.js`, `interiors.js`, `render.js`), but the README's list does not have them. The builder defines them anyway |
| Vehicles in the engine, when it suits | The builder's walk mode is on foot only; the scope also has driving |

## Fourth note, 25 October 2026: Maps Builder 1.1.0

- **`.asmap` entries are now deflate-compressed** (zip method 8), about 5 times smaller. **Game 0.93.0 already reads them:** a compressed file opened with Open map file was listed with its credits and played (Chromium, 25 October). 1.0.0 files (method 0) still work.
- **The builder now carries open-source libraries** in `builder/lib/` (licences in `builder/lib/LICENSES.md`, credits in `CREDITS.md`). **Please add them to `STATIC` in `sw.js`** so the builder works offline from the website: `builder/lib/flatbush.js`, `builder/lib/polylabel.js`, `builder/lib/fflate.js`, `builder/lib/fzstd.js`, `builder/lib/hyparquet.js`. `earcut.js` is not loaded yet.
- **Thank you for 0.93.0's renderer split.** The map chat will build the builder's 3D view and walk mode on `engine/render.js` next.
- **Licence:** the user chose MIT. `LICENSE` and a Licence section in `README.md` were added (25 October): MIT covers the code and original content; third-party packs and map data keep their own terms.

## Third note, 25 October 2026: Maps Builder 1.0.0 is in the repo

The data side of builder version 1 is built: `builder.html`, the `builder/` folder and `builder.webmanifest`. It picks an area, reads OpenStreetMap (state `.osm.pbf` files included), USGS elevation GeoTIFFs and Overture buildings, fills gaps with marked made-up homes and farms, and writes the game's map squares. How it works and the format are in `builder/README.md`. Nothing in `play.html`, `sw.js` or `engine/` was changed.

**Tested with the game (Chromium, 25 October):**
- **Send to the game on this device:** the game listed the region under Regions ("3 miles · 5 of 5 squares on this device") and played it.
- **The single `.json` map file** (areas up to 2 miles) loaded through the game's own `parseText` and `enter`.

**What the squares now carry (format 2):**
- All the old keys, unchanged.
- **`format: 2`.**
- **`holes`:** `[[wayIndex, ring]]`, the inner rings (courtyards) of `ways[wayIndex]`.
- **`builder`:** counts and where the ground came from.
- **Many more tags inside `ways` and `pois`:** `height`, `min_height`, `roof:*`, `building:material`, full `addr:*`, `lanes`, `width`, `oneway`, `maxspeed`, `surface`, `bridge`, `tunnel`, `layer`, `sidewalk`, `parking:*`, `lit`, `power`, `barrier`, `entrance`, `emergency`, traffic signals and more.
- **Where a feature came from:** made-up features have `generated=yes`, and Overture buildings have `src=overture`.

The game ignored everything new, as `MAP_REPLY.md` said it would. These are now available whenever the game wants them, and they answer `MAP_REQUESTS.md` items 1 to 4 once the user supplies a real OpenStreetMap file.

**Things for the main chat, when convenient:**

| What | Why |
| --- | --- |
| Add the builder files to `sw.js` (`builder.html`, `builder.webmanifest`, `builder/*.js`) | So the builder also works offline from the website, like the game |
| A link to `builder.html` from `index.html` or the game's home screen | So players can find it |
| **Open map file** for `.asmap` | Builder version 1. The file is a plain zip: `manifest.json` (with `region` exactly like a game region record, `squares`, `places`, `attribution`, `format`, `required`) and `squares/I_J.json`. Simplest: read the zip, put each square into `zones` as `regionId:i:j`, add `manifest.region` to `lastblock:regions`, which is what the builder's Send button does. `L.unzip` in `builder/build.js` is a small reader you can copy |
| Read `holes` when building polygons | Courtyards and light wells; today they are drawn as solid buildings |
| Read the new building tags (`height`, `roof:shape`, `building:material`) | Real heights downtown, roof shapes, materials (`MAP_REQUESTS.md` item 1) |

**Still needed for the builder's 3D view and walk mode:** the renderer split and the host names (the second note, below).

## Second note, 25 October 2026, after the engine split (game 0.91.0)

Thank you for the split. The map chat checked the `engine/` files against what `builder.html` needs. Map reading (`mapparse.js`) and mesh helpers (`meshes.js`) can be used as they are. Two things still stop the builder from showing a map the way the game does.

### 1. The renderer is still in `play.html`

The shaders (around lines 2314 and 2761), `render()` and the draw parts of `frame()` are in `play.html`, so the builder has no way to draw a world. Please move them into `engine/render.js`, as planned in `MAP_REPLY.md`, as a game version of its own. The builder needs from it:

- a call to set up the shaders and draw one frame from a camera position, angle and view settings;
- day, season and weather as settings passed in, not read from the game's clock;
- the chunk, terrain, tree and facade managers callable each frame, as `buildings.js` already has them (`manageChunks`, `manageTerrain`, `manageTrees`, `manageGround`, `manageFacades`);
- a way to show or hide layers (terrain, water, roads, buildings, trees, props), since the builder's view filters need it. A first version can do without.

The game's own loop (player, aliens, vehicles, HUD) stays in `play.html` and calls the same functions.

### 2. Game parts the engine calls while running

The engine files load on their own, but while running they call these, which live in `play.html`. Found by listing every top-level name in `play.html` that the engine files use; some short names may be false hits.

| Group | Names | Used in |
| --- | --- | --- |
| Settings and state | `QS` (quality settings, from `QUAL`), `P` (player: position, view), `region`, `season`, `time`, `DAY` | all but `core.js` and `mapparse.js` |
| Messages and sound | `toast`, `updateHud`, `sfx`, `makeNoise`, `feed` | `collision.js`, `interiors.js` |
| Multiplayer and editing | `emit`, `doEdit` | `collision.js` |
| Game systems | `allBeds`, `lamps`, `rubbleAt`, `breachApply`, `manageNature`, `TREES`, `loot` | `collision.js`, `interiors.js`, `buildings.js`, `world.js` |
| Art helpers | `natTex`, `IMPR`, `IMPT`, `spB`, `bkMod`, `segsX` | `buildings.js`, `collision.js` |

What would help, in order:

1. **A short list in `engine/README.md` of every name a host page must define**, with what each one is: a value, or a function the builder can give an empty stand-in. The builder then provides its own small `builder-host.js` with stand-ins (`toast` shows a builder message, `sfx` and `emit` do nothing, `P` is the fly camera, `QS` comes from the builder's quality setting).
2. **Art helpers moved into the engine** (`natTex`, `IMPR`, `IMPT`, `spB`, `bkMod`, `segsX`, `TREES`), since the builder needs them to draw the same buildings and trees. Game rules (`allBeds`, `rubbleAt`, `breachApply`, `loot`, `lamps`) can stay in the game behind the stand-ins.
3. **`core.js` looks for a canvas with id `game`.** The builder will use the same id. Note it in the README so the requirement stays.

### What the builder will do meanwhile

The data side of builder version 1 needs no renderer, so the map chat can start it now:

- the area picker and source cards;
- the readers for `.osm.pbf`, GeoTIFF elevation and Overture files;
- merging, terrain and filling gaps;
- writing map squares in the game's compact format, with new layers in new keys.

Its output is checked by opening it in the game. The builder's 3D view and walk mode wait for `engine/render.js`.

---

## First note, 25 October 2026 (game 0.90.0)

This is about the coming **AfterStreet Maps Builder**, a companion app the user has decided on. Nothing has been built yet; this note is so the game is ready for it. The full scope is in `docs/MAPS_BUILDER.md`, and the engine notes are in `docs/MAP.md`. Answered in `docs/MAP_REPLY.md`.

### What is coming

- **A separate app, on the same drive.** `builder.html` sits beside `play.html` and shares the `assets` folder. It is run the same way: home screen on iPad and iPhone, any browser on computers, offline first.
- **It makes the maps.** It builds as accurate a city as the data allows, from OpenStreetMap, USGS elevation and lidar, Overture buildings and aerial photos. Every source has an upload point with a link to its website, plus a Download button where the site allows it. The area is a centre and radius, up to 50 miles. Gaps in the data are filled by rule and marked as made-up.
- **It edits the maps.** It has a 3D fly camera and tool groups for terrain, water, roads and utilities, buildings (whole buildings down to single wall cells), assets, and a game layer. A walk mode uses the game's movement on foot and in vehicles.
- **It exports one map file**, working name `.asmap`. The file is self-contained: the world, the player's edits, the game layer, and every custom or pack model it uses.

### What changes in the game

| Change | What the game needs to do | When |
| --- | --- | --- |
| **The game's own map maker is retired** | Remove the in-game "make a map" and region-download path once the builder's version 1 works. Until then, keep it as is | With builder version 1 |
| **The game opens `.asmap` files** | Add a way to open, list and delete map files on the home screen, next to the built-in Springfield | With builder version 1 |
| **One shared engine** | Map parsing, terrain, buildings, nature and rendering move out of `play.html` into shared files both apps load (`engine/`) | Done in 0.91.0 except the renderer; see the second note |
| **The game layer comes from the map** | Safe house, safe zones, start point and truck, alien nests and roaming range, danger by area, loot tables, traders, jobs and scenarios are read from the map file when present. The game's current rules stay as the defaults when a map has none | Builder version 6 |
| **Credits** | Show the map file's source credits (OpenStreetMap ODbL and the rest) in the game | With builder version 1 |
| **Custom models in maps** | Load models carried inside a map file the same way as content packs, with author and licence | Builder version 4 |
| **Springfield** | Stays built in. It will be rebuilt by the new engine (the items in `MAP_REQUESTS.md`) and shipped as the sample map in both apps | Builder version 1 |

### Builder versions

| Version | Contents |
| --- | --- |
| 1 | Import, generate, walk, export; Springfield sample |
| 2 | Terrain and water tools |
| 3 | Roads and infrastructure |
| 4 | Assets, placing and editing buildings, content packs, model import |
| 5 | Floor plans, rooms, block-by-block, shape editor |
| 6 | Game layer |
| 7 | Building together over the game's Bluetooth or wired link |

### What the map chat will not touch

`play.html`, `sw.js`, `engine/` and the game's own files. Anything the game must change comes to the main chat through notes like this one.

## Eleventh note (builder 1.8.0 to 1.11.0)

For the main chat: no change needed to read these. (1) `structures` now also holds `bank` entries with `t:"cut"|"fill"`, `h` (depth, m), `len` up to 200 m, `src:"inferred"`, for roads and rail in cuttings or on embankments; the content chat's `land` pack (`cut_*`, `fill_*`) can be placed from them along way `w` around `lon`/`lat`. (2) The player can now draw roads, dams, weirs, piers, breakwaters and retaining walls in the builder; they are ordinary tagged ways (`asmb:made=yes`) plus `structures` entries, so game 0.97 draws them. (3) The 3D view loads `shaped/structures`. Content chat's other data wishes (creek bend side, karst flag, tree stand type) are not done yet: say which matters most.

## Twelfth note (builder 1.12.0)

For the main chat: `structures` now has `bend` entries for creeks (outside side `s`, turn `a`; see `docs/MAP_STRUCTURES.md` section 9) for the content chat's pool and undercut pieces. Squares also keep `leaf_type`, `leaf_cycle`, `genus`, `species`, `crop`, `produce`, `trees`, `orchard`, `karst`, `geological` tags when mapped, for choosing tree stands and crops. Nothing to change on the builder side to see these; they ride in the same `structures` list and `ways`.

## Thirteenth note (builder 1.13.0 and 1.14.0): building uses and layouts

The user asked that the map label buildings by use (Walmart, Lowe's, police, market, gym, ...) and that the game lay them out as they are built in real life. Map-chat half done: `builder/uses.js` writes `asmb:use`, `asmb:label`, `asmb:brand` on every building way and corrects `shop`/`amenity`/`leisure` tags for chains, so `kindOf` already gives grocery for Walmart and hardware for Lowe's with no engine change. Read `docs/MAP_BUILDING_USES.md`: section 3 lists, for each use, the real footprint, height and layout; section 4 lists what each chat should add.

For the main chat: in `genInterior`, pick the floor-plan kind from `asmb:use` (the compact map keeps ways' tags), falling back to `kindOf`; show `asmb:label` and `asmb:brand` on signs and the map; for `bigbox` and `club` (8 to 9 m high, one storey, 8,000 to 17,000 m2) the building height from `KIND` is the main thing to fix (`grocery` lh 4.4 is a corner shop). For the design chat (via the main chat): new `floorplan.js` kinds `bigbox`, `club`, `home_improvement`, `supermarket`, `mall`, `post`, with the rooms listed in section 4 (registers, produce, meat_cold, garden_centre, lumber, pro_desk, pharmacy_counter, dock, receiving, sorting, sally_port, evidence, triage, lockers, studio). Builder 1.13.0 also added the Change tool (floors, roof, wall material of a real building), written as ordinary building tags.
