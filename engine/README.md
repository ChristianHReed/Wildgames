# engine/

Shared code, loaded by `play.html` (and by the Maps Builder, `builder.html`, when it exists). Plain classic scripts, not modules, so they open from a USB drive with `file://`. Each is requested as `engine/NAME.js?v=BUILD`, and listed in `sw.js` so the offline copy has them.

Load order matters (top-level code runs as the files load):

| File | Holds |
| --- | --- |
| `core.js` | canvas and GL handles, resize, `hash` |
| `mapparse.js` | OSM XML, Overpass, GeoJSON and compact map file parsing (`parseText`, `fromCompact`, `toCompact`) |
| `world.js` | `buildWorld`: roads, water, buildings, trees, terrain heights, bridges |
| `dig.js` | digging: soil in 0.5 m blocks under the smooth ground (`dgLoad`, `dgApply`, `digOff`, drawn by `dgPrep`/`drawDig`); a host that never calls these sees no change |
| `meshes.js` | mesh helpers |
| `buildings.js` | building shells (walls, roofs, windows) |
| `interiors.js` | building interiors |
| `collision.js` | collision against the built world |
| `render.js` | the renderer: `initGL` (shaders), sky and mood of the hour, nature models, `drawMesh`, and `drawScene(cam, env)` which draws the map itself |

`spB`, `bkMod`, `segX` and `segsX` (with caches `SPB`, `BKM`) now live in `interiors.js` (0.94.1); a host no longer provides them.

Still inside `play.html`: the player and camera, held items, people, aliens, vehicles, effects, loot, traders, scenarios, saves, multiplayer, regions and UI. The engine files may only rely on names from the host page at run time, never at load time.

To add an engine file: create it here, add its name to the list in `play.html` (after the art scripts) and to `SCRIPTS` in `sw.js`.

## Host contract: what a page must provide

Both pages (the game, the Maps Builder's `builder-host.js`) load the engine after the art scripts. `core.js` finds a canvas with id `game` and takes its WebGL context; the page must have one. Everything below is used by engine code while it runs; none of it is needed just to load the files. Found by listing every name the engine files use and do not define (`tools`-free: a small script over the parsed files).

| Group | Names | What |
| --- | --- | --- |
| Art and settings | `ART`, `ARTSET`, `QS`, `SHAPED` | `ART`: the objects the `assets/*.js` scripts fill in. `ARTSET`: `'full'` or `'lite'`. `QS`: quality settings (`far`, `chunk`, `clutR`, `clutN`, `treeR`, `treeN`, `intR`, `models`). `SHAPED`: the art chat's shaped-model pack (`assets/shaped/*.js`) |
| Viewer | `P` | Where you are. Needed by the drawing and loading code: `x`, `y`, `yaw`, `gy`, `inside` (a building or null), `lvl`, `roof`, `veh`, `climbL`. A fly camera can use `{x, y, yaw, pitch, gy:0, inside:null, lvl:0}`. The many other `P` fields (`hp`, `bleed`, `rest`, `thirst`, `worn`, ...) are used only by the survival code in `interiors.js` and `collision.js`, which a builder does not run |
| Clock | `time`, `DAY`, `season()` | Seconds of play, seconds in a day, season 0 to 3. `drawScene` takes the hour and season in `env`, so only some world code reads these |
| State flags | `inRun`, `running`, `keys`, `gait`, `LAYDBG`, `ROOMAUD`, `dist` | `inRun`: a world is running (a builder: `true` once a map is shown). The others are game input and debug values; empty stand-ins are fine |
| Messages and sound | `toast`, `feed`, `updateHud`, `sfx`, `makeNoise`, `emit` | `toast`, `feed`: show a message. `updateHud`, `sfx`, `makeNoise`, `emit` (multiplayer): do nothing in a builder |
| Game rules (stand-ins) | `inv`, `allBeds`, `doEdit`, `breachApply`, `rubbleAt` | The player's items, beds, the edit log, broken walls and rubble. A builder gives empty or no-op versions |
| Weather and light | `wx`, `lamps`, `fires`, `dark` | `wx`: `{w, until, tor, flash}` weather now (`w` 0 clear to 4). `lamps`: placed lanterns, `[]` if none. `fires`: campfires, `[]` if none. `dark`: 0 to 1, how dark the hour is (the game sets it each frame; a builder sets it from its hour). The engine reads them in `buildings.js`, `collision.js`, `interiors.js` and `render.js` |
| Optional | `loadCreatures`, `loadPeople` | Optional; `initGL` calls them only if they exist |

`drawScene(cam, env)` needs no game state: its camera and its light of the moment are passed in (see the comment above it in `render.js`). A host draws its own moving things after it with its own `Mesh`.
