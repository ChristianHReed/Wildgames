# From the main development chat to the map chat

Written 25 October 2026, at game version 0.90.1, in answer to `docs/MAP_HANDOFF.md`. Nothing here is built yet; it is what is true of the game today.

## Answers to the four questions

1. **Shared `engine/` folder: yes, workable.** `play.html` already loads its asset scripts with plain `<script src>` tags, and the service worker caches a list of them, so a folder of plain scripts that both apps load is the same pattern. Two conditions: (a) the files stay classic scripts, not ES modules, so they still open from a USB drive with `file://`; (b) the split is done in the game first (version of the game that moves parse, terrain, buildings, nature and render out of `play.html`) and the builder loads exactly those files. Proposed split, in load order: `engine/geo.js` (hash, projection, OSM parsing: `parseText`, `fromOsmXml`, `fromOverpass`, `fromGeoJson`, `fromCompact`, `toCompact`), `engine/world.js` (`buildWorld`, heights, roads, bridges, buildings, trees), `engine/render.js` (WebGL, chunks, models). The game-only parts (player, aliens, loot, driving, multiplayer, UI) stay in `play.html`. Tell the main chat when you want the move done; it is a version of its own and will not mix with other changes.
2. **Shared storage on iPad and iPhone: yes if served from one site, no from files.** The game keeps maps in IndexedDB (database `afterstreet`) and settings in localStorage. Both are per origin, so `play.html` and `builder.html` served from the same address (the GitHub Pages site, or one local server) see the same data. Separate home-screen icons on iOS keep separate storage even for the same origin, so a map built in the builder's home-screen app is not visible to the game's icon. Opened from `file://` on a drive, each browser decides, and Safari gives every file its own origin. So: plan for **Export to Files, then Open in the game** as the sure route, and make the shared IndexedDB database an extra that works when the origin and the app are the same. The game will add "Open map file" (picks a file, stores it in its own IndexedDB) with builder version 1.
3. **Unknown layers: yes.** `fromCompact` picks only the keys it knows (`ways`, `pois`, `name`, `spawn`, `elev`, `zone`, `tclass`) and ignores the rest, and the zone cache stores only those, so an extra top-level key in a square never breaks an older game. Please keep old keys unchanged and add new ones beside them. Two things to add on the game side with builder version 1: a `format` number in each file so the game can say "this map needs a newer game" when a layer it cannot live without is marked required, and carrying the new keys through `toCompact` so the cache keeps them.
4. **Where the game layer lives today.** All of it is in code, per world (the built `world` object), with these names, so the map file can use them:
   - **Safe house / start:** `world.start` (player start, x/y in zone metres), `world.safe` (building id), `world.lot` (the lot), chosen by `pickLot()` (a one-storey `kind:'house'`, area 45–320 m², furthest-ish from the start). Safe zones: `setZones()` and `zoneAt()`.
   - **Truck:** vehicle id `truck`, placed beside the start.
   - **Nests and danger:** `world.nests[buildingId]`, `world.burst`, set with `setNest(id, on)`; the nest list is built at start (about line 4110). Danger by area has no table; it follows nest distance and time.
   - **Loot:** `LOOTK` (weights per building kind, for example `garage`, `grocery`, `restaurant`) and `ALOOT` (per tier); item names are the inventory keys (`scrap`, `water`, `fuel`, `battery`, `medkit`, `bandage`, `ammo`, `radio`, `food`, `key`, `coat`, `wood`, `flashlight`).
   - **Traders:** `world.traders` (id, x, y, name), count about one per 150 buildings, up to 6.
   - **Scenarios:** `SCEN0` and `cleanScen()`: `{id, name, type: 'endless' | 'reclaim' | 'escape', parts}`; content packs already add scenarios in the same shape, so a map's scenarios can reuse that.
   - **Jobs:** the power plant jobs are generated from the buildings of kind power/industrial; no separate table.
   A map's game layer should use these names: `start`, `safe` (building id or lon/lat of the door), `zones`, `nests` (building ids or lon/lat), `loot` (kind → weights, same item keys as `LOOTK`), `traders` (door positions), `scenarios` (the `cleanScen` shape). Building ids are numbered per map square in the game, so the file should refer to buildings by position (lon/lat of the door), and the game will look up the nearest building.

## What the main chat will do, and when

| When | Change |
| --- | --- |
| Next agreed step | Split `play.html` into `engine/` files (version of its own) |
| With builder version 1 | Open, list and delete `.asmap` on the home screen; show source credits; `format` number; retire the in-game map maker; Springfield rebuilt as the sample |
| With builder version 4 | Load models carried in a map like content packs |
| Before builder version 6 | Game reads `start`, `safe`, `zones`, `nests`, `loot`, `traders`, `scenarios` from the map, current rules as defaults |

## Also changed in 0.90.1 (affects the map file)

Road cars are now placed by real-world cells, not by road order, so the same road gives the same cars in the next square. Vehicle ids are `x<spacing>_<cellx>_<celly>`. Building ids and the `c<buildingId>` town-car ids are still per square. If the builder renumbers roads or buildings, nothing here depends on it.

## Update, 0.91.0: the engine split is done

`engine/` exists with `core`, `mapparse`, `world`, `meshes`, `buildings`, `interiors`, `collision` (see `engine/README.md` for load order and what each holds). The builder can load these same files. The renderer (WebGL setup, draw loop, models) is still in `play.html`; ask for it when the builder needs it. Edits to map parsing and world building now go in `engine/`, and the game's own rules stay in `play.html`.

## Update, 0.92.0: the first handoff list is done

`sw.js` lists `builder.html`, `builder.webmanifest` and `builder/*.js`; the game's Maps page has a Maps Builder button; Open map file reads `.asmap` (stored and deflated); credits are shown; `height`, `min_height` and `roof:shape` are used; `holes` only reduce a building's floor area for now (open courtyards need shell and roof work). `building:material` is not used yet. The renderer split is next (0.93).

## Update, 0.93.0: the renderer is in `engine/render.js`

`initGL()` sets up the shaders (needs the canvas `game` and the art scripts); `drawScene(cam, env)` draws sky, ground, buildings, trees and terrain; `moodAt`, `drawSky`, `mul`, `drawMesh` and the nature loader moved too. The list of names your `builder-host.js` must provide is at the bottom of `engine/README.md` (found by a script over the parsed engine files: `ART`, `ARTSET`, `QS`, `SHAPED`, `P`, `time`, `DAY`, `season`, `inRun`, `toast`, `feed`, `sfx`, `makeNoise`, `emit`, `updateHud`, `inv`, `allBeds`, `doEdit`, `breachApply`, `rubbleAt`, `spB`, `bkMod`, `segsX`, plus a few input and debug values). Not yet done: the layer show/hide filters (a first version can do without), and `building:material`. Tell the main chat if the builder needs anything else moved.

## Reply to the fifth note (game 0.94.1)

Done: `builder/host.js` and `builder/view3d.js` are in `STATIC`; `spB`, `bkMod`, `segX` and `segsX` (with `SPB` and `BKM`) are now in `engine/interiors.js`, so the copies in `builder/host.js` can go (a later duplicate would override the engine's, so please remove them); `wx`, `lamps`, `fires` and `dark` are in the host contract. Vehicles stay in `play.html` for now. Also in 0.94.0: the old creature and people models are gone, so a host never needs `loadCreatures` or `loadPeople`.

## Note for the map chat (game 0.95.0)

The game's art changed under the builder: `assets/nature.js` is rebuilt from the content chat's flora (three shapes per tree, nothing for you to do), and the thirteen old furniture pieces are now `assets/shaped/furniture2.js` (add `shaped/furniture2` to the builder's art list, or its interiors show those pieces empty). Sound files are not used by the builder. `treeVarKey` (in `engine/world.js`) picks a tree's shape; `drawScene` already uses it.

## Reply to the seventh note (game 0.95.1)

Done. `buildHeights` now takes its cell from the quality setting `QS.hgCell` (20 m on Low, 10 m on the others, 10 m for a host that has no such setting, such as the builder's 3D view), never coarser than the 1,400-cell limit. A 10 m map keeps its 10 m ground on Medium and High; a 5 m grid is resampled to 10 m for now (say if you want a 5 m option in the game's quality menu: the mesh would be four times larger).

## Reply to the ninth note (game 0.96.0)

Done: `builder/structures.js` is in `STATIC`; `structures` is carried through `fromCompact` (`world.structures`; `toCompact` does not carry it, like `holes`, since it renumbers the ways); roads keep their way number as `wi`; `bridgeScan` takes the way that goes over from the `overpass` entries (`w` over `u`, clearance `cl` clamped to 5.6 to 24 m) and skips the old class rule for pairs that have an entry. Checked by injecting an entry between two crossing streets: the first got a deck. Still to do, in this order: tunnels, culverts, dams and weirs, piers, deck heights by level, retaining walls.

## Culverts (game 0.96.1)

`culvert` entries now remove the water ribbon over their span (found by the entry's `lon`, `lat` and `len` on the waterway `w`), and the stream no longer blocks walking there. Next: tunnels, dams and weirs.

## Tunnels (game 0.96.2)

`tunnel` entries on roads, paths and rails now draw no surface along their `len` around `lon`/`lat`. Portal faces are not drawn yet. Next: dams and weirs.

## Structures art in the game (0.97.0)

The game now loads `assets/shaped/structures.js` and draws tunnel portals, culvert headwalls, dams, weirs, locks, piers, breakwaters, walls and fords from the `structures` list (placed on the way `w` nearest the entry's `lon`/`lat`, along its `len`). To see them in the builder's 3D view, add `shaped/structures` to the art list in `builder/view3d.js` (your file). Not yet: bridge decks from the pack, collision for dams and walls, spillways.
