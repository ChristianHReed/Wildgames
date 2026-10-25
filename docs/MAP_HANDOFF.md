# From the map chat to the main development chat

Written 25 October 2026, at game version 0.90.0. This is about the coming **AfterStreet Maps Builder**, a companion app the user has decided on. Nothing has been built yet; this note is so the game is ready for it. The full scope is in `docs/MAPS_BUILDER.md`, and the engine notes are in `docs/MAP.md`.

## What is coming

- **A separate app, on the same drive.** `builder.html` sits beside `play.html` and shares the `assets` folder. It is run the same way: home screen on iPad and iPhone, any browser on computers, offline first.
- **It makes the maps.** It builds as accurate a city as the data allows, from:
  - OpenStreetMap;
  - USGS elevation and lidar;
  - Overture buildings;
  - aerial photos.

  Every source has an upload point with a link to its website, plus a Download button where the site allows it. The area is a centre and radius, up to 50 miles. Gaps in the data are filled by rule and marked as made-up.
- **It edits the maps.** It has a 3D fly camera and tool groups for terrain, water, roads and utilities, buildings (whole buildings down to single wall cells), assets, and a game layer. A walk mode uses the game's movement on foot and in vehicles.
- **It exports one map file**, working name `.asmap`. The file is self-contained: the world, the player's edits, the game layer, and every custom or pack model it uses.

## What changes in the game

| Change | What the game needs to do | When |
| --- | --- | --- |
| **The game's own map maker is retired** | Remove the in-game "make a map" and region-download path once the builder's version 1 works. Until then, keep it as is | With builder version 1 |
| **The game opens `.asmap` files** | Add a way to open, list and delete map files on the home screen, next to the built-in Springfield | With builder version 1 |
| **One shared engine** | Map parsing, terrain, buildings, nature and rendering move out of `play.html` into shared files both apps load (proposed: an `engine/` folder). The builder must not keep a second copy, or maps will look different in the two apps | Agree the plan before builder work starts |
| **The game layer comes from the map** | Safe house, safe zones, start point and truck, alien nests and roaming range, danger by area, loot tables, traders, jobs and scenarios are read from the map file when present. The game's current rules stay as the defaults when a map has none | Builder version 6. The format will be agreed earlier, so it is ready |
| **Credits** | Show the map file's source credits (OpenStreetMap ODbL and the rest) in the game | With builder version 1 |
| **Custom models in maps** | Load models carried inside a map file the same way as content packs, with author and licence | Builder version 4 |
| **Springfield** | Stays built in. It will be rebuilt by the new engine (real street names, heights, addresses, road details, power: the items in `MAP_REQUESTS.md`) and shipped as the sample map in both apps | Builder version 1 |

## Builder versions, so the roadmap can line up

| Version | Contents |
| --- | --- |
| 1 | Import, generate, walk, export; Springfield sample |
| 2 | Terrain and water tools |
| 3 | Roads and infrastructure |
| 4 | Assets, placing and editing buildings, content packs, model import |
| 5 | Floor plans, rooms, block-by-block, shape editor |
| 6 | Game layer |
| 7 | Building together over the game's Bluetooth or wired link |

## Questions for the main chat

1. **Shared code:** is an `engine/` folder loaded by both `play.html` and `builder.html` workable? Or would you rather the builder load code from the game another way?
2. **Storage on iPad and iPhone:** Safari home-screen apps keep their own storage and cannot write to the USB or SSD. Do the game and the builder share storage when served from the same site? This decides whether a map built on an iPad shows up in the game straight away, or has to be exported through the Files app and opened.
3. **Map squares:** the builder will keep the game's 0.05° squares and the compact map format, plus new layers (streets with widths, building heights and roofs, props, game layer). Can the game skip layers it does not read yet, so new maps don't break older game versions?
4. **Game layer format:** where do the safe zone, nest, loot and scenario rules live in the game now? The map file should use the same names.

## What the map chat will not touch

`play.html`, `sw.js` and the game's own files. Anything the game must change comes to the main chat through notes like this one.
