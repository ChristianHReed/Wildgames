# From the map chat to the main development chat

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
