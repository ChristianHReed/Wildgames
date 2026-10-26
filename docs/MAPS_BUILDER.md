# AfterStreet Maps Builder: scope

The companion app that turns real map data into Afterstreet worlds and lets players edit them. Written by the map chat on 25 October 2026 (game version 0.90.0), updated the same day with the main chat's answers (0.90.1), from the user's answers to a round of scoping questions. **No code yet**: this page is what the builder must be, do and look like. Update it when a decision changes. The engine notes in `docs/MAP.md` still apply; this page is the product built on them.

## What it is

A map builder that runs on any device, from the same drive as the game. A player picks their city, gives the builder the real data (it downloads what it can and has an upload point with a link for every source), and it builds as accurate a version of the place as the data allows, using the design chat's assets. The player then flies around it in 3D, reshapes terrain and water, edits roads and buildings, places assets and game rules, walks it to test, and exports one map file that any copy of the game can open.

## Decisions so far

| Question | Decision |
| --- | --- |
| Delivery | Same as the game: `builder.html` beside `play.html` on the drive, sharing the `assets` folder; add to home screen on iPad and iPhone, any browser on computers |
| Heavy work (import, generate) | Every device can build, scaled by size: phones a town or neighbourhood, computers and iPads up to the 50-mile region; the builder says what the device can handle |
| Into the game | One exported map file, copied, sent or shared to friends |
| Main view | Full 3D fly camera with a minimap |
| Getting data | Both: a Download button wherever the website allows it, and an upload point with a link for every source |
| Sources | OpenStreetMap (always), elevation (USGS 1 m and 10 m), lidar point clouds, Overture buildings, aerial photos (NAIP) |
| Gaps in data | Filled by rule (homes, farms, trees) and marked as made-up, so real data or the player can replace them |
| Choosing the area | Centre and radius: search or tap a place, pick a radius from a neighbourhood up to 50 miles |
| Terrain tools | Sculpt brushes, level and grade, cliffs and ravines, ground paint |
| Water tools | Rivers and creeks, lakes and ponds, dams, weirs and culverts, flood levels |
| Asset sources | Design chat library, content packs, a simple shape editor, import from other tools |
| Building editing | Place whole buildings, edit real buildings, floor plans and rooms, block-by-block |
| Roads and infrastructure | Draw and move roads, bridges, tunnels and rail, power and utilities, fences, walls and street props |
| Game layer | Safe zones and start, alien nests and danger, loot and traders, jobs and scenarios |
| Building together | Solo first; live co-building over the game's Bluetooth or wired link in a later version |
| Look | The game's own look (taped-paper panels, fonts, colours) |
| New data over old edits | Edits are their own layer, re-applied on top of new data; clashes are listed to review |
| Play-test | Walk mode inside the builder: first person on foot or in a vehicle, then back to editing |
| Controls | Touch, Apple Pencil, keyboard and mouse, game controller |
| The game's own map maker | Replaced: all map making moves to the builder, and the game only loads maps |
| Version 1 | Import, generate, walk, export; editing tools follow in later versions |
| Map file | Self-contained: the map plus every custom or pack model it uses |
| Saving | Autosave to the device every few minutes and on close, plus undo and redo for edits (added 25 October); no named snapshots or edit log |
| Starter map | Springfield (50 miles) comes pre-built as the sample |

## How it runs

- **One engine, two apps.** The world generator, terrain, building and rendering code is shared with the game (one copy on the drive), so a map looks the same in the builder and in the game. Agreed with the main chat (`docs/MAP_REPLY.md`):
  - The main chat first splits `play.html` into an `engine/` folder, as a game version of its own: `engine/geo.js` (projection, OSM parsing, the compact format), `engine/world.js` (world building: heights, roads, bridges, buildings, trees) and `engine/render.js` (WebGL, chunks, models).
  - The builder loads exactly those files and adds builder-only files beside them.
  - All files are **classic scripts** (`<script src>`, no ES modules), so both apps still open from a USB drive with `file://`. This also applies to the builder's background workers and WebAssembly readers.
- **Offline first.** Everything works from the drive with no internet; downloads are a convenience.
- **Background work.** Imports and generation run in background workers, in pieces (one map square at a time), so the screen never freezes and a phone never holds the whole region in memory. A big build can be paused and resumed, and survives the app closing.
- **Fast file readers.** Compiled readers (WebAssembly) for the big formats: OpenStreetMap `.osm.pbf`, lidar `.laz`, elevation GeoTIFF, Overture GeoParquet.
- **Device budget.** On start the builder measures the device (memory, storage, graphics) and sets the largest area it should build and the detail it shows while editing.
- **Storage limits to know.**
  - Computers in Chrome or Edge can read and write the drive directly.
  - Safari on iPad and iPhone cannot write to a USB or SSD from a home-screen app. Maps live in the app's own storage, and Export hands the file to the share sheet or the Files app, which can save it to the drive. Firefox and desktop Safari work the same way.
  - **Sharing with the game (confirmed by the main chat).** The game keeps maps in IndexedDB (database `afterstreet`). The two apps share it only when both are served from one address (the GitHub Pages site or one local server) and opened in the same browser or home-screen app. Separate home-screen icons on iOS keep separate storage, and from `file://` Safari gives every file its own storage.
  - So the **sure route is Export to Files, then Open map file in the game**, which the game adds with builder version 1. Shared IndexedDB is an extra for when both apps share an address and app: a "Send to game" button that works only when it can.

## Data sources and upload points

Each source gets a card with: what it gives, a link to the exact download page, what file to pick, the area the player needs to cover, a Download button where possible, the upload point, and a check that the file covers the chosen area.

| Source | Gives | Website (link on the card) | File | Auto-download | Size for 50 miles |
| --- | --- | --- | --- | --- | --- |
| OpenStreetMap, state extract | Roads, buildings, names, addresses, shops, water, power, rail, fences, trees, everything in `MAP_REQUESTS.md` | download.geofabrik.de (state page) | `.osm.pbf` | Yes for small areas (Overpass); the state file is uploaded | ~200 MB (Missouri) |
| OpenStreetMap, small area | Same, for a town or neighbourhood | openstreetmap.org Export, or Overpass | `.osm` or Overpass `.json` | Yes | A few MB |
| Elevation, 1 m | Real ground: hills, creek banks, ditches | apps.nationalmap.gov/downloader (USGS 3DEP) | GeoTIFF, 10 km tiles | To check (USGS's web service may allow it) | Several GB |
| Elevation, 10 m | Ground where 1 m is missing, and the outer region | Same site | GeoTIFF | To check | ~100s of MB |
| Lidar | Real building heights and roofs, every tree | apps.nationalmap.gov/lidar-explorer | `.laz` tiles | No (too large); uploaded | Tens of GB for the city; ask for the core only |
| Overture buildings | Buildings OpenStreetMap lacks | overturemaps.org, explore.overturemaps.org | GeoParquet or GeoJSON for the area | To check | 100s of MB |
| Aerial photos | Tracing and checking by eye, roof and ground colours | USDA NAIP via apps.nationalmap.gov or earthexplorer.usgs.gov | GeoTIFF | To check | Several GB |
| Builder's own files | Saved maps, content packs, models from other tools | (the player's own) | `.asmap` map, pack files, `.vox`, glTF | n/a | |

"To check" means testing whether the site allows a browser to download directly, before relying on it. Every source's licence and credit are kept in the map file and shown in the game (OpenStreetMap is ODbL; USGS and USDA data are public domain).

Outside the US, elevation would come from Mapterhorn, Copernicus, or a country's own source. The cards are written so more countries can be added later; the US comes first.

## How the world is made

The stages from `docs/MAP.md`, run inside the builder:

1. **Choose the area.** Centre and radius; the builder lists which files are needed for it and how big they are.
2. **Bring in the data.** Download or upload each source; each card turns green when its file covers the area.
3. **Merge.** OpenStreetMap wins. Overture and lidar add only what it lacks. Every feature remembers where it came from (OSM, Overture, lidar, made-up, player).
4. **Fill defaults.** Missing lanes, widths, storeys and roofs come from rules by type, marked as guessed.
5. **Terrain.** Ground from the best elevation available, then reshaped by the map: level water, graded roads with cuttings and embankments, sharp kerbs, bridges over the ground, flat pads under buildings, with no seams between squares.
6. **Streets.** Real widths, lanes, junction shapes, sidewalks, crossings, driveways.
7. **Buildings.** Real heights and roofs from tags or lidar, courtyards, squared-up corners, real entrances, then the game's stick-frame walls and floor plans.
8. **Nature.** Woods edges, real trees from lidar where available, the game's planting rules elsewhere.
9. **Street furniture.** Lamps, hydrants, signs, fences and the rest from OpenStreetMap points, then rules for the rest, marked.
10. **Fill gaps.** Made-up homes, farms and ponds where the data is empty, marked.
11. **Accuracy report.** Per square: how much is real and how much is guessed or made-up, plus a list of landmarks to check against the aerial photos.

Each stage keeps its result, so changing one source or setting reruns only what depends on it.

## The editor

### Camera and views
- Full 3D fly camera at any height, from rooftop to whole-city, with the game's own look and level of detail.
- Minimap with search (places, street addresses) and tap-to-jump.
- View filters: show or hide terrain, water, roads, buildings, nature, props, the game layer, and the aerial photo draped on the ground.
- Highlight what is real, guessed, made-up, or player-made.

### Tool groups (later versions)
| Group | Tools |
| --- | --- |
| Terrain | Raise, lower, smooth and noise brushes; flatten a pad; ramp between points; draw cliffs, bluffs, ravines, ditches and kerbs; paint ground (grass, long grass, earth, rock, gravel, mud, snow) and woods density |
| Water | Draw and reshape rivers and creeks (width, depth, flow); lakes and ponds by shoreline or by filling a low spot; dams, weirs and culverts; storm flood levels |
| Roads and infrastructure | Draw and move roads with lanes, widths and sidewalks (junctions rebuild and the ground re-grades); bridges, tunnels, rail and crossings; power plants, substations, lines and poles, water towers, fuel depots; fences, hedges, walls, gates, lamps, signs, parked cars |
| Buildings | Place a whole building; edit a real one (type, storeys, roof, materials, name, address); lay out floor plans, rooms, doors, stairs and furniture; edit wall cells and frames block by block |
| Assets | Searchable list of the design chat's library and installed content packs; a simple shape editor with the shared 256-colour palette; import from MagicaVoxel `.vox` and glTF |
| Game layer | Safe house, safe zones, start point and starting truck; alien nests, roaming range and danger by area; loot tables per building or room, traders, rare items; power plant jobs, scripted events, scenario presets |

### Play-test
Walk mode drops the player in at ground level, on foot or in a vehicle, with the game's movement, then returns to the same spot in the editor.

### Edits over real data
Every player change is stored as an edit (what, where, which version of the data it applied to). A new data import rebuilds the base and re-applies the edits; any that no longer fit (a moved road, a demolished building) go to a review list.

## The map file

One self-contained file (working name `.asmap`, a zip inside) holding:
- the base world as generated, cut into the game's squares;
- the edit layer;
- the game layer (safe zones, nests, loot, jobs, scenarios);
- every custom or pack model the map uses;
- a manifest: name, centre, radius, source list with dates, credits and licences, builder version, a **`format` number**, a thumbnail.

The game opens this file directly. Friends get everything in one file.

Rules agreed with the main chat:
- **Squares stay compatible.** Each square keeps the game's current keys unchanged (`ways`, `pois`, `name`, `spawn`, `elev`, `zone`, `tclass`), and new layers (street widths, building heights and roofs, props, the game layer) go in new keys beside them. Older games ignore keys they don't know.
- **Format number.** Each file says which format it uses and marks any layer the game can't do without as required, so an old game can say "this map needs a newer game" instead of loading it wrong.
- **Buildings by position.** The game numbers buildings per square, and the numbers change, so the edit layer and the game layer refer to a building by the lon/lat of its door. The game looks up the nearest building.
- **Game layer names** match the game's own: `start`, `safe` (door position), `zones`, `nests` (door positions), `loot` (building kind to item weights, using the game's item keys such as `scrap`, `water`, `fuel`, `battery`, `medkit`), `traders` (door positions) and `scenarios` (the game's scenario shape: id, name, type `endless`, `reclaim` or `escape`, and parts). Danger by area and power jobs have no table in the game today. The builder adds them as new keys, and the game keeps its current rules wherever a map has none.
- Vehicle ids already come from real-world cells (from game 0.90.1), so they stay stable whatever the builder does to roads.

## Look and controls

- **Look:** the game's taped-paper panels, fonts and colours; tool groups on a toolbar, settings in panels, so it feels like part of the game.
- **Touch:** on-screen fly sticks plus pinch, drag and two-finger tilt; large tap targets; works on iPhone in landscape.
- **Apple Pencil:** precise drawing of roads, shorelines and brushes, with pressure for brush strength where it helps.
- **Keyboard and mouse:** WASD flying, mouse look, shortcuts for tools.
- **Game controller:** fly with the sticks, pick and place with the buttons, radial tool menu.

## Progress

**Builder 1.0.0, 25 October 2026: the data side of version 1.** The map chat started it after the main chat's engine split (game 0.91.0). It needs no renderer. How it works and the file format are in `builder/README.md`.

| Part of version 1 | State |
| --- | --- |
| Area: search, presets, my location, tap the map, radius, device advice | Done |
| Source cards with links and uploads | Done: OpenStreetMap (`.pbf`, `.osm`, Overpass JSON, GeoJSON, or download for areas up to 3 miles), elevation GeoTIFFs plus free terrain tiles, Overture GeoJSON. Lidar and aerial photos show their links, with "later version" |
| Merge, fill gaps, cut into the game's squares, ground grids | Done, in a background worker; squares are saved as they are made |
| Accuracy report | Done: real against made-up buildings, mapped heights, storeys, roofs, addresses, named roads, lanes and widths, where the ground came from |
| Export | Done: `.asmap` map file, the single `.json` map for areas up to 2 miles (today's game opens it), and Send to the game on this device (the game lists and plays it) |
| Autosave | Done: the last map and its preview come back when the builder opens. Uploaded files must be added again to rebuild, since browsers do not keep access to them |
| Flat preview map | Done, a stand-in until the 3D view |
| 3D fly view, walk mode | Waiting for `engine/render.js` |
| The game opening `.asmap` | Main chat, with builder version 1 |
| Springfield rebuilt as the sample | Waiting for the user's Missouri OpenStreetMap file (and ideally Overture and USGS 1 m files) |

**Builder 1.1.0, 25 October 2026: open-source libraries** (from `docs/MAP_CODE.md`):
- **Overture GeoParquet:** Overture's own downloads now read directly, alongside GeoJSON.
- **Compressed map files:** five times smaller in the test.
- **Faster, lighter gap filling:** 32 s down to 23 s at 50 miles, using less memory.
- **Better Overture matching** for L- and U-shaped buildings.

**Builder 1.2.0, 25 October 2026: the 3D view and walk mode** (on game 0.93's `engine/render.js`).
- **Opening it:** the 3D view button on the map, or "Fly through it in 3D" in step 4. It opens where the flat map is centred.
- **Fly:** any height from 2 m to 1,500 m; the speed grows with height.
- **Walk:** at eye height on the ground, kept out of walls by the engine's collision. Driving waits until vehicles move into the engine.
- **Squares:** crossing a square's edge loads the next one.
- **Light:** time of day and season controls; street lights after dark.
- **Controls:**
  - keyboard: WASD or arrows, E and Q for up and down, Shift to go faster, F to switch Fly and Walk;
  - mouse, finger or Apple Pencil: drag to look; the mouse wheel changes height;
  - touch: an on-screen stick and up/down buttons;
  - game controller: sticks, triggers for up and down, A to switch modes.
- **Devices:** phones and tablets get the game's lighter art set and draw distance.
- **Speed in testing:** in Chromium, the first opening took about 9 s, mostly loading art.

What testing showed:
- **The map pack's Springfield is short of houses.** Outside downtown, the streets of central Springfield have few buildings. The builder's lot-by-lot gap filling puts marked made-up homes on the empty lots (about 5 made-up for every real building in the test). Overture buildings should replace most of them with real footprints.
- **Whole 50-mile regions need a computer.** At city density everywhere the stress test used about 1.3 GB. The builder suggests up to 8 miles on phones and 25 miles on tablets.

**Builder 1.3.0, 25 October 2026: terrain sculpting (the first part of version 2).**
- **Where:** the Sculpt button in the 3D view. Tools: Raise, Lower, Smooth, Level; brush size 15 to 250 m; strength.
- **How:** tap or click the ground (hold still to keep going). The ground is rebuilt with the change on top. Undo and Redo work for each tap or hold.
- **Edits stay on top:** dabs are saved apart from the map data (IndexedDB store `edits`, one list per square). Building the map again from new data keeps them. Open map file (`.asmap`) and the exports bake them into each square's height grid, so the game sees the changed ground with no new format.
- **Limits:** the ground grid is 20 m cells within 15 km, so small features need the finer elevation detail setting. Water, cliffs and ground painting are next. The single `.json` file made at build time does not include edits; use the `.asmap` export.
- **Tested** (Chromium, 25 October): three full-strength raises gave +3.0 m at the middle over 84 cells; undo and redo restored and replayed them; the baked squares carry the edit count in `builder.edits`.

**Builder 1.3.1, 25 October 2026: bug fixes and finer ground.**
- **Fixed:** taps made while the ground was rebuilding were dropped; they now queue and apply in order. Holding still now applies the sculpting every moment instead of only on release.
- **Finer ground by default:** 10 m (was 20 m); a 5 m choice for the best look; brush size from 10 m. The game's engine still resamples to 20 m cells at least, so the full benefit needs the engine change asked for in the seventh note of `MAP_HANDOFF.md`.

**Builder 1.4.0, 25 October 2026: lakes and rivers (more of version 2).**
- **Lake:** one tap in Sculpt. The brush size is the lake's size. It digs a flat bowl (about 2 m below the shore, set by Strength) with banks that blend in, and adds a marked `natural=water` area the game draws as water.
- **River:** tap points downstream, then Finish river. The channel is cut along the line, always running downhill, with banks, and a marked `waterway` line is added. Brush size picks a stream (3 m wide), canal (8 m) or river (11 m), the game's own widths.
- **Same rules as sculpting:** undo and redo, kept apart from the map data, baked into the squares on export. Added water carries `asmb:made=yes` and `src=edit`.
- **Tested** (Chromium): a lake and a river were saved, replayed on reload and listed as marked ways in the square; the earlier raise, undo and redo tests still pass.
- **Not yet:** flood levels, dams, weirs and culverts, editing or removing mapped water, cliffs, painting the ground.

**Builder 1.4.1, 25 October 2026: file pickers accept any file.** The upload buttons had a file-type filter (`accept=".pbf,..."`). Some browsers, notably Safari on iPhone and iPad and some Android pickers, grey out a file whose type they do not know, and `.pbf` is one of them, so the user's Missouri file could not be chosen. The filter is gone; the builder reads the file by its name and contents. Tested with the real `missouri-261024_osm.pbf` (199.8 MB): a 2-mile Springfield build finished in 43 s with 10,401 real buildings.

**Builder 1.4.2, 25 October 2026: drop files on the page.** On an iPad in Brave the file picker still greyed out the user's `.pbf` after 1.4.1 removed the type filter (the picker or a saved copy of the page may be to blame). Files can now be dragged onto the page from the Files app (iPad: Split View) and are sent to the right card by their name (`.pbf/.osm/.xml` to OpenStreetMap, `.tif` to elevation, `.parquet` and `.json` to Overture, `.asmap/.zip` to Open map file). The version number at the top of the page shows which copy is running. Tested in Chromium with all three kinds dropped together.

**Builder 1.5.0, 25 October 2026: ground painting.** The Paint tool in Sculpt lays a round patch of woods, park lawn, grass, field, scrub, sand or a parking lot (brush size sets the patch). Each patch is a marked area (`asmb:made=yes`, `src=edit`) with the map tags the game already draws, so the game needs nothing new. Undo, redo and export work as for the other tools. Tested in Chromium: a sand patch was saved, rebuilt and drawn.

**Builder 1.6.0, 25 October 2026: structures (bridges, overpasses, tunnels, culverts, dams and more).** Learned from OSM2World and Arnis and from a scan of the whole Missouri file; the rules, the data and the engine requests are in `docs/MAP_STRUCTURES.md`.
- **Finds them:** `builder/structures.js` reads the tags (`bridge`, `tunnel`, `layer`, `waterway=dam`, `weir`, `man_made=pier`, `retaining_wall`, ...) and works out the rest from the shapes: a road through a river or lake with no bridge mapped, a motorway crossing a street with no junction, a stream crossing a road with no culvert.
- **Writes them:** a `structures` list in every square (old games ignore it), counts in `builder.structures`, and rows in the accuracy report. Places that look like mapping slips are listed as `check`.
- **Shows them:** the Structures switch in the 3D view puts a coloured pole on each one (tall for mapped, short for worked out).
- **Also fixed:** the builder had been dropping the `embankment`, `cutting`, `ford`, `maxheight`, `lock` and `bridge:support` tags and dam, weir and waterfall points; they are kept now.
- **Tested** on the real Missouri file: Springfield (206 bridges, 487 culverts, 304 overpasses), downtown St. Louis (986 bridges, 1,956 overpasses), Table Rock Dam (10 dam ways); and on a made-up square with one case for each rule.
- **The game's engine** does not read these yet, so decks, tunnels and dams are not drawn from them; see the requests in the ninth hand-off note.

**Builder 1.7.0, 25 October 2026: placing and removing buildings and trees (the start of version 4).** The Sculpt button is now **Edit**.
- **Building:** pick one of 21 kinds (home, apartment block, shops, grocery, restaurant, gas station, clinic, hospital, police, fire station, school, church, office, hotel, warehouse, barn, shed, ...), set the size and the turn, and tap the ground. By default it lines up with the nearest street. It is a marked building (`asmb:made=yes`, `src=edit`) with the map tags the game turns into that kind, so the game draws, furnishes and loots it like any other.
- **Tree:** one tap. **Remove:** takes away the building under the tap (mapped, Overture or made-up) or else the tree there.
- **Same rules as the other edits:** undo and redo, kept apart from the map data (so building the map again keeps them), baked into the squares on export. Removing a building also fixes the indexes of its courtyards and structures.
- **Tested** (Chromium): a hospital was placed (16,864 to 16,865 buildings, one more `hospital`), removed (back to 16,864) and brought back by undo.
- **Not yet:** an asset list from the design chat's models (props and furniture), editing a building's floors or walls (versions 4 and 5), importing models.

**Builder 1.7.1:** the 3D view loads the game's new `shaped/furniture2` art (added in game 0.95.0), so interiors show their furniture.

**Builder 1.8.0:** road drawing and road removal. New **Road** tool in the Edit panel: pick a type (motorway to footpath, bike path, railway), choose on the ground, bridge or tunnel, tap points along the line, then Finish. The road is stored as an edit (`t:"road"`, marked `asmb:made=yes`, `src=edit`) and baked into the square like other edits. **Remove** now also takes away the road or railway nearest the tap (within 7 m) when no tree or POI is there. After road edits the structures list for the square is worked out again, so a bridge drawn over a river appears in `structures` and the Structures overlay. Tested in Node (bridge detected over a river; removal) and in Chromium on the Springfield sample.

## Versions

| Version | Contents |
| --- | --- |
| 1 | Choose area, source cards (download and upload), merge, generate, accuracy report, 3D fly view, walk mode, autosave, export the map file; Springfield sample; the game reads the map file and drops its own map maker |
| 2 | Terrain and water tools; edits over new data |
| 3 | Roads and infrastructure tools |
| 4 | Asset list, placing buildings and props, editing real buildings, content packs, model import |
| 5 | Floor plans, rooms and block-by-block editing; the shape editor |
| 6 | Game layer |
| 7 | Building together over the game's link |

## What this means for the game (hand-off to the main chat)

Sent as `docs/MAP_HANDOFF.md`; the main chat answered in `docs/MAP_REPLY.md` and added a "Maps Builder lead-in" row to the roadmap. Its plan:

| When | Main chat's change |
| --- | --- |
| Next agreed step (the map chat says when) | Split `play.html` into the `engine/` folder, as a game version of its own |
| With builder version 1 | Open, list and delete `.asmap` on the home screen; show source credits; read the format number; keep new square keys in its cache; retire the in-game map maker; Springfield rebuilt as the sample |
| With builder version 4 | Load models carried in a map like content packs |
| Before builder version 6 | Read `start`, `safe`, `zones`, `nests`, `loot`, `traders` and `scenarios` from the map, with the current rules as defaults |

## Open questions

1. **File name and extension:** `.asmap` is a working name.
2. **Lidar size on phones:** lidar may need to be limited to computers and iPads, or to a small core area.
3. **Countries beyond the US**, and when.
4. **Asset licensing in shared maps:** packs and imported models inside a map file should carry their licence and author.

## Sources
The engine research and data sources are listed in `docs/MAP.md`. Still to be checked before building:
- which data sites allow downloads straight from a browser;
- Safari's storage size limits for home-screen apps (sharing between apps is answered above);
- browser readers for `.osm.pbf`, `.laz`, GeoTIFF and GeoParquet.
