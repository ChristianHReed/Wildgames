# Afterstreet handoff pack

## Quick start for Claude Code
The game runs in the browser: **HTML + three.js (r160) + ES modules, with no build step needed**.
1. Serve this folder: `npx serve afterstreet_handoff`, then open `/world_demo.html`. You get a walkable, cel-shaded Springfield built from real OSM data, with a day/night slider and search prompts at real places (WASD, Shift, drag to look, M for map view).
2. `engine/world.js` is the world builder to keep and extend. `buildWorld(scene, { base, renderer })` returns `{ root, pois, props, setTime(hour), spawn, home, follow(pos), nearestPoi(pos, r), markSearched(poi) }`.
3. Build the HUD, map, inventory, base, lobby and results screens as an HTML/CSS overlay above the canvas, following `design_reference/Afterstreet UI.dc.html` and `design_tokens.json`.
4. Game rules and balance live in `data/*.json`. Art lives in `textures/` (3D maps) and `assets/` (SVG sources for UI icons and sprites).

Suggested next tasks: player collision against the building footprints (2D point-in-polygon on `springfield_buildings.geojson`), enemy AI along road lines, loot rolls from each POI's `loot_table`, interiors furnished with `makePropKit()` using `data/furnishing_rules.json`, and co-op sync (section 6).

## Overview (original brief)

## Overview
Afterstreet is a first-person co-op survival game set in a real city. The world comes from OpenStreetMap (OSM): building footprints are extruded into 3D, roads become streets, and tagged places (shop=supermarket, amenity=pharmacy, …) become places you can search for loot. The starting city is **Springfield, MO** (downtown and Park Central Square). The tone is cozy rather than gory. Up to 4 players on desktop and mobile play together over **local Bluetooth or a wired link (USB-C/LAN)**, with no internet needed after the map has loaded.

This pack contains:
- `map_data/`: real Springfield OSM data as GeoJSON, ready to extrude and populate
- `assets/`: 110 SVG sprites (props, items, weapons, enemies, map pins, characters)
- `data/`: starter balance tables (items, weapons, enemies, recipes, furnishing rules)
- `design_tokens.json`: colors, fonts, radii, shadows
- `design_reference/`: the HTML design files (UI screens, asset sheet, character sheet)

## About the design files
The files in `design_reference/` are **design references built in HTML**. They show the intended look and layout. They are not production code to copy. Rebuild the UI in the game's own stack (for example Three.js or Babylon.js with a React/HTML overlay, Unity UI Toolkit, or Godot Control nodes) using that stack's patterns. To view a reference, serve the `afterstreet_handoff/` folder over HTTP (`npx serve afterstreet_handoff`) and open `design_reference/*.dc.html`. Opening them from `file://` will not work.

## Fidelity
**High-fidelity for UI** (colors, type, spacing, radii and copy are final). **Mid-fidelity for art**: the SVGs are finished 2D sprites and icons and should be used as they are for inventory, map and HUD. For the 3D world they are reference for silhouette and color. Rebuild them as low-poly models with toon shading.

---


## Art & UI style (v2: cel-shaded + field journal)
**Assets: cel-shaded.** Every filled shape has a 2.5 px `#3d3029` outline, a hard shadow band on its lower-right and a thin warm rim light on its upper-left. In the SVGs this comes from one reusable filter, `#cel`:
erode the alpha by 1.6, offset it (−7, −8) and subtract it from the original to get the shadow band, filled `#5b2f3a` at 26%. Then offset it (2.5, 3) and subtract to get the rim, filled `#fff6e0` at 75%. The generator is `tools/svg_lib.js`.
**For 3D, match this look:**
- 2-step toon ramp: lit = base color, shadow = base × `#5b2f3a` at 26%, with a hard edge at N·L ≈ 0.35.
- Fresnel rim, `#fff6e0`, only on the side facing the key light.
- Inverted-hull outline, 2.5 px at 1080p, `#3d3029`.
- Key light from the upper-left.

**UI: field journal.** Panels look like paper cards (`#fbf3e4`, 1 px `#d9c7a8` border, radius 6, hard 2/3 px offset shadow) with a strip of masking tape across the top center (64×18, `rgba(217,168,69,.5)`, rotated −3°). Section labels look rubber-stamped: Special Elite 13 px uppercase, 1.5 px border in the text color, rotated −1.5°. Buttons are square-ish (radius 4) with a 3 px hard bottom shadow (`#9a5226` under clay). Page backgrounds use an 18 px dot grid. OSM tags and codes use Special Elite (typewriter) instead of a code font. Caprasimo and Figtree are unchanged.

## 1. Map data (`map_data/`)
Source: OSM via the Overpass API, pulled October 2026. Bounding box: **lon −93.305 to −93.275, lat 37.200 to 37.222** (about 2.6 × 2.4 km around Park Central Square). Coordinates are `[lon, lat]` in WGS84 (GeoJSON standard).

| File | Contents | Geometry |
|---|---|---|
| `springfield_buildings.geojson` | 843 buildings. Props: `building`, `name`, `building:levels`, `height`, `height_m` (derived: `height` > levels×3.2 m > 6 m for houses > 8 m default), address | Polygon |
| `springfield_roads.geojson` | 3,214 ways. Prop `highway` = primary/secondary/tertiary/residential/service/footway/… | LineString |
| `springfield_parks.geojson` | 13 parks | Polygon |
| `springfield_waters.geojson` | 14 water and waterway features | Polygon / LineString |
| `springfield_pois.geojson` | 159 places to search. Props: `name`, `category`, `osm_tag`, `loot_table` (asset names), `pin` (asset path), `opening_hours` | Point |

POI categories: food 76, shelter 26 (library, school, church, fire and police), misc 21, park 13, medicine 10, materials 7, gear 5, water 1. The **Springfield-Greene County Library, Park Central Branch** (`node/1294141807`, −93.292683, 37.208545) is the default starting base.

### Building the world
1. **Projection:** convert lon/lat to local meters with an equirectangular projection centered on the bbox center (37.211, −93.290): `x = (lon − lon0) × 111320 × cos(lat0)`, `z = −(lat − lat0) × 110540`. This is accurate enough at city scale.
2. **Buildings:** extrude each footprint polygon to `height_m`. Use a flat roof with a 0.4 m parapet, walls in sand/clay tones picked by a hash of the id from the palette (cream `#f5ead8`, sand `#ebddc5`, clay `#c67139` at 60% saturation, sage `#a9b78c`), and a dark-brown outline (inverted hull, `#3d3029`).
3. **Interiors:** make a building enterable if a POI point falls inside its footprint (point-in-polygon), or if its `building` is house/residential/apartments. Furnish it with `data/furnishing_rules.json`, keyed by POI `osm_tag` or building type.
4. **Roads:** buffer LineStrings by type (primary 10 m, secondary 8 m, tertiary 7 m, residential 6 m, service 4 m, footway 2 m). Scatter `street` props from the furnishing rules every 25–40 m along sidewalks.
5. **Other cities:** use the same Overpass queries with a new bbox:
   - POIs: `nwr["shop"](bbox); nwr["amenity"~"^(pharmacy|drinking_water|library|hospital|clinic|fuel|restaurant|cafe|fast_food|school|police|fire_station|place_of_worship|bar)$"](bbox); nwr["leisure"="park"](bbox); out center tags;`
   - Geometry: `way["building"](bbox); way["highway"](bbox); out geom tags;` Split the request in two, because the public server times out (HTTP 504) on large combined queries. Retry with backoff.
   - Cache each city as GeoJSON. In co-op, the host streams it to joiners over the local link.
6. **Map tiles:** the 2D world map uses raster tiles from `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with CSS `filter: sepia(.4) saturate(.75)`. Respect the OSM tile usage policy: set a real User-Agent, cache tiles, and do not bulk-download. For heavy use, switch to a commercial tile host or render vector tiles yourself.
7. **Attribution (required by the ODbL license):** show "© OpenStreetMap contributors" on every map view and in the credits.

---

## 2. Assets (`assets/`, list in `assets/manifest.json`)
- Style: cel-shaded (see "Art & UI style"), **2.5 px outline `#3d3029`**, round joins. A soft ground shadow (ellipse, `#3d3029` at 14%) is built into props, items, weapons and characters.
- Sizes: props, items and weapons 128×128; enemies 128×160; characters 160×240 (full body) and 120×120 (faces); pins 64×80 (teardrop) or 64×64 (base, player, crew); `fp_hands_bat` 320×180.
- `buildings/` (6, 160×160): shop, pharmacy, house, library, restaurant, gas_station. These are facade and trim references for the OSM extrusions: match their wall colors, awnings, signs and window styles by tag.
- `props/` (32, 3/4 view): bed, bunk_bed, sofa, table, chair, bookshelf, fridge, stove, store_shelf, checkout_counter, crate, rain_barrel, planter_box, campfire, tent, car_wreck, streetlamp, tree, bush, fence, mailbox, traffic_cone, bench, dumpster, window_boarded, workbench, radio, sleeping_bag, fire_hydrant, shopping_cart, sandbags, generator. Each is drawn from the 3/4 view with three faces: top = base tinted 30% toward `#fff6e0`, front = base, side = base mixed 28% toward `#5b2f3a`. Use the `box`, `cyl` and `ball` helpers in tools/svg_lib.js to add more.
- `items/` (27): food, water, medicine, materials and gear. Names match `data/items.json` and the POI `loot_table` field.
- `weapons/` (10): cricket_bat, frying_pan, crowbar, hockey_stick, wrench, garden_rake, slingshot, flashlight, broom_spear, umbrella
- `enemies/` (5): shambler, sprinter, bloat, crawler, horde_marker (map only)
- `pins/` (11): one per POI category, plus base, player and crew
- `characters/` (29): ava, mo, june and tak, each with a front view and 6 faces (neutral, happy, tired, hurt, scared, determined), plus the first-person hands sprite

In 3D, use the sprites as billboards for distant loot, or model them as low-poly meshes (soft cylinders, 2–3 band toon ramp, inverted-hull outline).


## 3D texture maps (`textures/`)
These are cel-style PNG maps, painted with the same palette, the same 2.5 px #3d3029 lines and the same upper-left light as the 2D art. Full list: `textures/manifest.json`. UVs are in **metres**: ExtrudeGeometry wall UVs are (distance along wall, height), so set `texture.repeat = 1 / tileSize`.

| Folder | Maps | Tile size | Used by world.js for |
|---|---|---|---|
| `facades/` | facade_{brick, brick_dark, siding_cream, siding_river, stucco, stone} + `_emissive` | 8 × 6.4 m (2 bays × 2 floors) | Building walls. Picked by a hash of the OSM id. `stone` is used for shelter POIs (library, school, church). |
| `facades/` | shopfront_{food, medicine, materials, gear, misc} + `_emissive` | 8 × 4 m | The 4 m ground floor of any building that contains a POI of that category |
| `roofs/` | roof_gravel, roof_shingle_clay (`building=house`), roof_metal | 8 m | Extrude caps |
| `ground/` | asphalt, road_lanes, crosswalk, sidewalk, grass, dirt_lot, water | 4 m (road_lanes: full width × 8 m) | Road ribbons (major roads get lanes), the 4 m wider sidewalk ribbon under each street, parks, base ground, water |
| `materials/` | wood_planks, crate, barrel_wrap, metal_painted, fabric_{clay, sage, river, plum}, floor_tile, wallpaper_interior, bark, foliage | 1–2 m | `makePropKit()` props and interiors |
| `props/` | store_shelf_front, bookshelf_front, fridge_front, stove_front, boarded_window, car_side | one face | Front (+Z) face of box props, car sides (alpha-tested) |
| root | toon_ramp.png (3×1), palette_atlas.png + .json | n/a | `MeshToonMaterial.gradientMap` (Nearest filter). Palette swatches for hand-made low-poly models (Blender: UV each face into a swatch). |
| `sprites/` | {items, weapons, enemies, pins, characters}_atlas.png + atlases.json | 2× res | Billboards (enemies, distant loot) and UI icons. Frames are in pixels. |

**Emissive maps** are black except for the window glass. `setTime(hour)` raises `emissiveIntensity` toward 0.9 at night, so windows glow warm. Lamp heads glow the same way.

**Rendering recipe (matches the 2D art):**
- `MeshToonMaterial` with `toon_ramp.png`
- HemisphereLight `#fff1d6` / `#8a7480` for warm-plum shadows
- DirectionalLight from the upper-left with PCF soft shadows; `follow(pos)` keeps the shadow box on the player
- Outlines: `EdgesGeometry` at a 28° threshold on buildings, and an inverted hull (`outlineMaterial()`) on props
- Fog matches the sky color at every hour

**Performance:** about 116 draw calls and about 1.3M triangles for the whole bbox. Buildings are merged per material and street props are instanced. For larger cities, chunk the world into 250 m tiles and build them as the player approaches.

**Adding models:** to use real Blender models instead of the procedural props, export glTF with UVs into `palette_atlas.png` or these material maps. Load with GLTFLoader, swap each material for `MeshToonMaterial({ map, gradientMap: ramp })`, and add `outlineMaterial()` hulls.

## Regenerating art
- `tools/tex_lib.js` contains the helpers used to paint the PNG maps (palette, `celRect`, `speckle`, tileable patterns).
- `tools/svg_lib.js` contains the SVG helpers (`box`, `cyl`, `ball`, the `#cel` filter).
- Both are plain scripts that use canvas and string helpers. Port them to a Node script with `@napi-rs/canvas` if you need to regenerate the art in CI.

## 3. Characters
See `design_reference/Afterstreet Characters.dc.html`.

| Player | Role | Accent | Perk |
|---|---|---|---|
| Ava | Scavenger (host) | `#c67139` | Searches places 25% faster |
| Mo | Builder | `#7a8a5e` | Barricades cost 2 fewer planks |
| June | Medic | `#5f8a9a` | Bandages heal double |
| Tak | Cook & gardener | `#8a6a8a` | Meals restore +15 energy |

- The accent color is used on the player's hoodie or jacket, map dot, HUD health bar and chat name.
- Face swaps by state: happy after eating or at base; tired when energy < 30; hurt when health < 40; scared when an enemy is within 20 m; determined during a fight.
- No blood. Damage shows as bandages. A downed player sits and waves until a teammate revives them (hold E for 3 s).

## 4. Enemies
Enemies are sleepy, mossy undead (`#a8b894` skin) with half-closed eyes. When knocked down they "fall asleep" and fade out after 4 s instead of showing gore. Stats are in `data/enemies.json`. Hordes walk along primary and secondary roads (taken from `springfield_roads.geojson`) and appear on the map as dashed clay circles.

---

## 5. Screens (`design_reference/Afterstreet UI.dc.html`)
The desktop reference size is 1280×800 and the phone is 390×844. HUD panels sit 24 px from the screen edges.

- **1a Main menu / city picker:** live OSM tiles fill the background, with a cream gradient from the left (opaque until 560 px, 15% at 900 px). The left column is 440 px wide and holds the label, the title (Caprasimo 76/0.92), a city input (pill, 2 px clay border, paper `#fff8ee` fill), quick-pick chips, three stat cards and the CTAs: Continue (clay), New run (sand), Co-op (sage tint).
- **1b In-game HUD:**
  - Top-left: time card (Day N in Caprasimo 30, time in clay-deep) and objective card (280 px).
  - Top-right: a 200 px circular minimap (6 px cream border, fog radial), a crew card (240 px) with each player's accent bar, and a danger pill (clay).
  - Center: a crosshair dot and a search prompt pill below center with the OSM tag in mono and the "Search · E" button.
  - Bottom-left: vitals (Health clay, Food ochre `#b8913a`, Water river, Energy sage), each on a 10 px pill bar.
  - Bottom-center: 6 hotbar slots, 88×88 with radius 22. The selected slot gets a 3 px clay border.
  - Bottom-right: chat toasts on `rgba(32,30,29,.78)` with radius 16.
- **1c World map / fog of war:** OSM tiles under a fog layer `rgba(52,44,60,.72)` with radial cut-outs where the player has been (reveal radius 150–250 px at z16, persisted per player and shared in co-op). The left panel (280 px) has the explored % and category filters with pins. The right panel shows the selected POI card with its raw OSM tags, distance, danger and size, and the buttons "Set waypoint" and "Ping crew". The route is drawn as a dashed clay line.
- **1d Inventory & crafting:** 3 columns (240 / flexible / 340). Left: weight bar and equipped slots. Middle: category tabs and a 5-column slot grid (radius 20, empty slots dashed), with a selected-item bar at the bottom. Right: the workbench recipe list (`data/recipes.json`) and a "Craft ×1" button.
- **1e Base building:** top-down plan of the base's OSM footprint on a 40 px grid. A ghost item (dashed clay) is placed with Click and rotated with R. Unboarded windows show as clay bars. The bottom tray holds category chips and buildable cards. Stats: Comfort, Defense, Food/day.
- **1f Co-op lobby:** a Bluetooth / Wired segmented toggle, player rows (avatar, device, link type, ping, ready state), a room code in mono 36 and a nearby-device list with Invite buttons. Maximum 4 players.
- **1g Results:** dimmed tiles with the player's route drawn on top. The card shows the cause, a headline, 4 stats, "Moments" and the CTAs "Respawn at library" and "New city".
- **1h Phone HUD:** compact vitals, a 104 px minimap, a left virtual stick (130 px), a right 2×2 grid of action buttons (64 px, Swing in clay) and a 6-slot hotbar of 54 px slots. All touch targets are at least 44 px.
- **1i Phone join:** a Bluetooth / Wired toggle, cards for nearby games and room code entry.

## 6. Interactions & state
- **Day/night:** 1 in-game day = 24 real minutes. Dusk starts at 18:00 and full dark lasts 20:30–05:30. At night, darken the scene with a radial vignette (`rgba(20,16,34,.82)` at the edge), spawn sprinters and shrink sight to 12 m unless the flashlight is on.
- **Vitals:** start at 100. Food −1 per 6 in-game minutes, water −1 per 4 min, energy −1 per 8 min (×2 when running). If food or water hits 0, health drops 1 per 2 min. If health hits 0, the player is downed (in co-op) or the results screen opens (solo).
- **Searching:** within 4 m of a POI, show the prompt and hold E for 2.5 s. Roll 1–3 items from `loot_table`. A searched POI's pin drops to 45% opacity; places restock after 3 days.
- **Panels:** fade and rise 8 px over 180 ms (ease-out). Buttons darken on hover (clay `#c67139` to `#ad5d29`; sand `#ebddc5` to `#e0c6a4`).
- **Co-op networking:**
  - Host-authoritative. The host owns world state, POI search state and enemy AI. Clients send inputs and receive snapshots at 10–20 Hz.
  - Bluetooth: BLE on mobile, using a GATT service with characteristics for input, snapshot and chat. Keep packets under about 180 bytes and delta-compress positions.
  - Wired: TCP over USB tethering or LAN. Use mDNS to discover games, and a room code as the fallback.
  - The map GeoJSON (gzip, about 250 KB for this bbox) is sent once when a player joins.
- **State to persist:** city bbox, day and clock, player vitals and inventory, fog-of-war reveal mask, POI search timestamps, base placements.

## 7. Design tokens
All tokens are in `design_tokens.json`. The key values:
- Surfaces: cream `#f5ead8`, sand `#ebddc5`, sand-deep `#e0cfb2`, paper `#fff8ee`
- Text: ink `#201e1d`, ink-soft `#3d3833`, muted `#6b5e50`
- Accents: clay `#c67139` / hover `#ad5d29` / deep `#9a5226`; sage `#7a8a5e`; river `#5f8a9a`; plum `#8a6a8a`; ochre `#d9a845` (HUD food bar `#b8913a`)
- Fonts: **Caprasimo** for display and **Figtree** (400/600/700/800) for UI, both from Google Fonts, plus **Special Elite** for stamps, OSM tags and codes
- Radii: button 4, stamp 3, panel 6, card 5, screen 10 (pills only on progress bars and avatars)
- Shadows: panel `2px 3px 0 rgba(61,48,41,.16), 0 10px 22px rgba(70,40,15,.14)`; button `0 3px 0 #9a5226`
- Panels are paper `#fbf3e4` with tape; see design_tokens.json → tape, stamp

## 8. Files
```
afterstreet_handoff/
  README.md                  ← start here
  world_demo.html            ← runnable three.js demo
  engine/world.js            ← OSM → 3D world builder + prop kit
  design_tokens.json
  map_data/springfield_{buildings,roads,parks,waters,pois}.geojson
  textures/{facades,roofs,ground,materials,props,sprites}/*.png
  textures/toon_ramp.png, palette_atlas.png/.json, manifest.json
  assets/{buildings,props,items,weapons,enemies,pins,characters}/*.svg
  assets/manifest.json
  data/{items,weapons,enemies,recipes,furnishing_rules}.json
  design_reference/*.dc.html + support.js   (open over HTTP)
  tools/svg_lib.js, tools/tex_lib.js
```

## Licenses
Map data © OpenStreetMap contributors, available under the Open Database License (ODbL 1.0). The game must credit OSM. Derived databases you distribute must stay under ODbL; the game's own art and code do not. The SVG assets and design files were made for this project.
