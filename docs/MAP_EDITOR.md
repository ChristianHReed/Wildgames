# Map editor: the Maps Builder's 3D view as a full map editor

Plan from the map chat, 15 November 2026. The owner's request: the builder's 3D view should be a city-builder style editor, where you place buildings, trees, plants and anything else on the map, change the ground (hills, cuts into the ground), and place aliens and their nests, with **every asset made in the Workshop placeable**, so a map can be fully customised.

## Answers from the owner

| Question | Answer |
|---|---|
| What first? | A **new editor shell** (toolbar, palette, inspector, undo), with the current tools moved in |
| Aliens and nests | **The map sets the starting nests and aliens**; the game's pressure and "nests fight back" settings still grow them over time |
| Devices | **iPad touch** and **computer with mouse and keyboard** (phone is not a target for the editor) |
| Workshop assets | **Everything in the installed packs** appears in the palette, by pack and category |

## What exists today (builder 1.35.0, `builder/view3d.js`)

An **Edit** button opens a floating panel of 15 tool buttons and a settings row per tool: Raise, Lower, Smooth, Level, Lake, Flood, River, Paint, Building, Tree, Road, Change (floors, roof, frame), What is it?, Props (category and piece dropdowns, turn), Remove. One brush size and strength. Undo and redo. Every change is an operation (`{t:'raise'|'basin'|'flood'|'river'|'road'|'paint'|'place'|'tree'|'prop'|'remove'|'bset', ...}`) stored with the map and written to the `.asedit` file; the game applies the same operations with the builder's own code (`terrainApply`).

What is missing for a full editor: tools grouped the way a player expects, a palette you can search and browse (the two dropdowns hold hundreds of pieces), seeing what you are about to place (ghost, ring), selecting something you already placed to move, turn or delete it, snap and rotate handles, hill and cut brushes with real control (flatten to a height, ramps, slope, trench), plants as a brush (scatter), and creatures and nests.

## How other games lay this out

The pages for these were not readable in this session (the web search returned only titles, and fetching the pages was blocked), so this is from the common conventions of the genre, not from reading their documentation. Treat it as a design brief to check against play, not as a citation.

- **Cities: Skylines (map editor and landscaping)**: a toolbar along the bottom with one button per tool group; picking a group opens a strip of tools above it; terrain tools share a **brush with size and strength sliders** and a ring drawn on the ground; tools for shape (raise, lower, level, soften, slope) are separate from tools for what sits on the ground (trees, resources, water sources).
- **Planet Coaster and Planet Zoo**: a **palette of categories on one side** (scenery, buildings, paths, terrain), pieces shown as pictures with names and a search box; a **ghost** of the piece follows the pointer, turns with a key or a handle, and is committed with a click; placed pieces can be **selected** to get move, rotate and delete handles; terrain brushes with size and strength; undo and redo are always visible.
- **Touch builders (Bloxburg's mobile build mode and similar)**: big buttons, no hover and no right click. The safe pattern is: **one finger places or paints, two fingers move the camera**; a piece is **dragged into place and then confirmed or cancelled** with two large buttons, so a stray tap never commits; rotate is a button (quarter turn) and a slider (free turn), not a keyboard key.

## The layout

```
+--------------------------------------------------------------------------+
| < Builder    Fly | Walk     Time ----o----   Season   Layers  Help       |  top bar (as now)
+-----------+----------------------------------------------+---------------+
| PALETTE   |                                              | INSPECTOR     |
| search    |                                              | the active    |
| pack  v   |            3D view                           | tool's        |
| category  |        ring / ghost under the pointer       | settings, or  |
| pieces    |                                              | the selected  |
| (list)    |                                              | thing's       |
|           |                                              | properties    |
+-----------+----------------------------------------------+---------------+
| [Select] [Terrain v] [Water v] [Paint] [Build v] [Place] [Nature v] [Creatures v] [Erase]  | Undo Redo | 12 changes |
+--------------------------------------------------------------------------+
```

- **Bottom dock**: tool groups. A group with a down arrow opens a flyout of its tools. At least 48 px high buttons on touch.
- **Left palette**: shown for Place, Nature and Creatures. Search box, a pack filter (All, Stock, then each installed pack), category chips, the pieces as a list with a small preview. Tapping a piece arms it.
- **Right inspector**: brush size and strength for terrain tools; floors, roof and frame for a building; turn, size and height for a placed piece; kind and group size for creatures. It is the only place settings live, so the dock stays small.
- **On touch**: palette and inspector are drawers that slide in and out, so the view stays wide on an iPad in portrait.
- **Placing**: a ghost follows the finger or pointer; **Place** and **Cancel** buttons appear; turn with a button (90 degrees) or slider. On a computer a click places, R turns, Esc cancels, Ctrl+Z and Ctrl+Y undo and redo.
- **Camera**: right-drag (mouse) or two fingers (touch) orbit and pan whatever the tool; one finger or left button acts. The current fly and walk modes stay.

## Tool groups

| Group | Tools |
|---|---|
| Select | tap a placed thing or a building to select it; move, turn, resize, delete; What is it? |
| Terrain | Raise, Lower, Smooth, Level (to a height), **Flatten to the height under the pointer**, **Slope** (ramp between two taps), **Cut** (trench or road cut with a width and depth), **Hill** (round mound with a height and radius) |
| Water | Lake, River, Flood, Pond |
| Paint | the ground cover kinds (as now) |
| Build | Building (kinds, frame, size, turn), Road (kinds, bridge, tunnel), Change (floors, roof, frame, wall), Fence and wall line |
| Place | every prop and pack piece: street, garden, shop, vehicles, land, Workshop pieces |
| Nature | Tree (kinds), **Plants** (brush that scatters bushes, grass, crops, rocks by density), Woodland (fill a drawn area) |
| Creatures | **Aliens** (swarmer, stalker, giant, spitter, clinger, and any a pack adds), **Nest** (turn a building into a nest, or put a nest in the open), spawn groups |
| Erase | remove a thing, or brush-erase trees and props |

## The data

Operations stay the map's way of recording an edit (they travel in `.asedit` and in the map file). New operations, with the game reading them (needs the main chat, see the hand-off note):

| Operation | Fields | Game side |
|---|---|---|
| `hill` | `lat lon r h` | applied with the same terrain code as `raise` |
| `cut` | `c` (line), `w`, `d` | trench or cutting along the line, to depth `d` |
| `slope` | `a b` (two points), `w` | ramp between the two ground heights |
| `plant` | `lat lon k n r` | scatter `n` of kind `k` in radius `r` (seeded, so it is the same each time) |
| `creature` | `lat lon k n` | `k` alien kind, `n` how many at the start |
| `nest` | `lat lon` or a building | the building becomes a nest, or a free-standing nest is made |

Today the game makes nests itself: a nest is a **building** the game picks (`w.nests[buildingId]`, a handful per map, about one for every 45 buildings, in `play.html`), and aliens are spawned by the game's own pressure rules from the five kinds `swarmer, stalker, giant, spitter, clinger` (`AK` in `play.html`). So placed creatures and nests need the main chat to read `creature` and `nest` from the map before the game uses them; the builder can place and show them first. A per-map switch decides whether the game adds its own on top (the owner chose: the map sets the starting nests, the game's pressure settings still grow them).

Workshop pieces: the packs the game already loads (`AfterstreetPacks.install`, `P.models` with `pack` and `group`) give the palette its list. Anything that installs as a prop, vehicle or building piece is placeable as `prop` (`asmb:prop` = `<category>.<piece>`), the way stock props are. A map should list the packs it uses (`required` in the manifest), so the game can tell a player which pack to add.

## Build order

1. **Shell (this step).** Bottom dock with groups, left palette with search and packs, right inspector, ghost and ring, Place and Cancel for touch, Ctrl+Z, Ctrl+Y and R. Existing tools move in unchanged. Tested on a computer and an iPad-sized touch screen.
2. **Terrain. Done in 1.37.0** (Hill, Flatten, Cut, Slope; no preview of the shape before you commit yet). The new operations are in `terrainApply`, which the game already uses.
3. **Select and edit. First part done in 1.39.0**: Select tool (first in the dock) picks the nearest thing you placed (building, tree or piece, within 10 m), shows a yellow ring on it, and gives Turn (15 degree steps; pieces and buildings), Move (arm, then tap the new spot), Delete (button or Delete key), Done (or Esc); all with undo and redo. Still to do: selecting the real map's own buildings (Change and Remove still do that), resize, box select, copy, touch ghost with Place and Cancel.
4. **Plants and woodland. Done in 1.40.0**: the Plants tool (Nature group) scatters into the brush circle. Nine mixes: woodland (the builder's own trees), pines, oaks and birches, bushes and ferns, grass and flowers, rocks and logs, reeds, dead trees, forest floor. Brush size is the area, Strength becomes Density; plants keep a minimum spacing and skip building footprints. Each plant is an ordinary `tree` or `prop` operation (`plants.<piece>`), so the game needs nothing new and Select can move or delete single plants; one stroke is one undo. Fixed in 1.41.0: plants also skip roads, rails, paths, streams and mapped water; a Fill area tool (tap the corners, Finish; up to 3,000 plants over the area); a brush ring under the pointer (and at the last touch) for the terrain, water, paint and plant brushes.
5. **Creatures and nests. Builder side done in 1.42.0**: Creatures group in the dock with Aliens (kind, group size, turn) and Nest; the real alien models from `shaped/aliens` show in the 3D view (up to 8 of a group drawn); Select moves, turns and deletes them; one checkbox, "The game may add its own nests and aliens as the days go on", is the per-map switch. Operations `creature`, `nest` and `rule`. **The game does not read them yet** (hand-off note 31).
6. **Workshop pieces everywhere.** Buildings and other pack kinds in the palette, `required` packs in the manifest.

## Open questions for later

- Previews: small rendered pictures of each piece need a render pass per piece (about 1,000 pieces); a text list with category icons is the first version.
- Phone support is not planned for the editor.
- Whether the game should let a player edit a map in play (not asked).
