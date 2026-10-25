# engine/

Shared code, loaded by `play.html` (and by the Maps Builder, `builder.html`, when it exists). Plain classic scripts, not modules, so they open from a USB drive with `file://`. Each is requested as `engine/NAME.js?v=BUILD`, and listed in `sw.js` so the offline copy has them.

Load order matters (top-level code runs as the files load):

| File | Holds |
| --- | --- |
| `core.js` | canvas and GL handles, resize, `hash` |
| `mapparse.js` | OSM XML, Overpass, GeoJSON and compact map file parsing (`parseText`, `fromCompact`, `toCompact`) |
| `world.js` | `buildWorld`: roads, water, buildings, trees, terrain heights, bridges |
| `meshes.js` | mesh helpers |
| `buildings.js` | building shells (walls, roofs, windows) |
| `interiors.js` | building interiors |
| `collision.js` | collision against the built world |

Still inside `play.html`: the renderer, the player, aliens, loot, vehicles, traders, scenarios, saves, multiplayer, regions and UI. Moving the renderer out is a later step; the engine files may only rely on functions from `play.html` at run time, not at load time.

To add an engine file: create it here, add its name to the list in `play.html` (after the art scripts) and to `SCRIPTS` in `sw.js`.
