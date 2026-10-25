# AfterStreet Maps Builder: scope

The companion app that turns real map data into Afterstreet worlds and lets players edit them. Written by the map chat on 25 October 2026 (game version 0.90.0), from the user's answers to a round of scoping questions. **No code yet**: this page is what the builder must be, do and look like. Update it when a decision changes. The engine notes in `docs/MAP.md` still apply; this page is the product built on them.

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
| Saving | Autosave to the device every few minutes and on close |
| Starter map | Springfield (50 miles) comes pre-built as the sample |

## How it runs

- **One engine, two apps.** The world generator, terrain, building and rendering code is shared with the game (one copy on the drive), so a map looks the same in the builder and in the game. Moving the game's map maker into the builder is part of this.
- **Offline first.** Everything works from the drive with no internet; downloads are a convenience.
- **Background work.** Imports and generation run in background workers, in pieces (one map square at a time), so the screen never freezes and a phone never holds the whole region in memory. A big build can be paused and resumed, and survives the app closing.
- **Fast file readers.** Compiled readers (WebAssembly) for the big formats: OpenStreetMap `.osm.pbf`, lidar `.laz`, elevation GeoTIFF, Overture GeoParquet.
- **Device budget.** On start the builder measures the device (memory, storage, graphics) and sets the largest area it should build and the detail it shows while editing.
- **Storage limits to know.**
  - Computers in Chrome or Edge can read and write the drive directly.
  - Safari on iPad and iPhone cannot write to a USB or SSD from a home-screen app. Maps live in the app's own storage, and Export hands the file to the share sheet or the Files app, which can save it to the drive. Firefox and desktop Safari work the same way.
  - The same holds for the game; the main chat should confirm the two apps can share storage, since they come from the same site.

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
- a manifest: name, centre, radius, source list with dates, credits and licences, builder version, a thumbnail.

The game opens this file directly. Friends get everything in one file.

## Look and controls

- **Look:** the game's taped-paper panels, fonts and colours; tool groups on a toolbar, settings in panels, so it feels like part of the game.
- **Touch:** on-screen fly sticks plus pinch, drag and two-finger tilt; large tap targets; works on iPhone in landscape.
- **Apple Pencil:** precise drawing of roads, shorelines and brushes, with pressure for brush strength where it helps.
- **Keyboard and mouse:** WASD flying, mouse look, shortcuts for tools.
- **Game controller:** fly with the sticks, pick and place with the buttons, radial tool menu.

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

- The game's built-in map maker is retired; the game loads `.asmap` files (and the built-in Springfield).
- The generator, terrain and building code becomes shared between the two apps; the main chat and this chat need one agreed place for it.
- The game layer in the map file becomes the source of safe zones, nests, loot and scenarios for that map, with the game's rules as defaults.

## Open questions

1. **Undo.** Only autosave was chosen. Undo and redo are standard in editors and cheap once edits are recorded anyway; recommended to add back. Named snapshots and the edit log could stay out.
2. **File name and extension:** `.asmap` is a working name.
3. **Shared code location:** a shared `engine` folder both apps load, or the builder loading code from `play.html`.
4. **Lidar size on phones:** lidar may need to be limited to computers and iPads, or to a small core area.
5. **Countries beyond the US**, and when.
6. **Asset licensing in shared maps:** packs and imported models inside a map file should carry their licence and author.

## Sources
The engine research and data sources are listed in `docs/MAP.md`. Still to be checked before building:
- which data sites allow downloads straight from a browser;
- Safari's storage limits for home-screen apps;
- browser readers for `.osm.pbf`, `.laz`, GeoTIFF and GeoParquet.
