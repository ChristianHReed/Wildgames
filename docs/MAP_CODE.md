# Open-source code for the map builder

The map chat searched GitHub on 25 October 2026 for open-source code the Maps Builder can use.

**How licences were checked:** each repository's own licence file was read from GitHub, together with its last update and main language, on that date.

**What counts as usable:** the builder must stay plain classic scripts that open from a USB drive. So code is used in one of two ways:
- **Copied in** as a single classic-script file under `builder/lib/`, with its licence kept beside it. Code written as ES modules gets a small wrapper.
- **Used as a guide:** its rules are rewritten in our own code, with credit.

## The game itself has no licence yet

The repository has no `LICENSE` file. Until it has one, nobody else may legally reuse, change or share the game, which works against the plan for an open-source game that players add to. Everything recommended below is under permissive licences (MIT, ISC, BSD, Apache-2.0), which work with any licence the user picks.

**MIT** is the simplest choice and matches most of what is used. Copied or ported code then needs only:
- its licence text kept;
- a line in `CREDITS.md`;
- for Apache-2.0 code, its NOTICE file as well.

Map data keeps its own licence (ODbL for OpenStreetMap and Overture) whatever the code licence is.

## 1. Copy in

| Project | Licence | Updated | What it would do for the builder |
| --- | --- | --- | --- |
| [mapbox/earcut](https://github.com/mapbox/earcut) | ISC | 2026-10 | Turns any outline, holes included, into triangles: roofs, courtyards, water, ground cut-outs. Tiny, fast, the standard |
| [mourner/flatbush](https://github.com/mourner/flatbush) | ISC | 2026-10 | Fast spatial index ("what is near here?"). Would replace the builder's hand-made grids for the Overture merge, gap filling and tree placement, and speed up 50-mile builds |
| [StrandedKitty/straight-skeleton, v1 branch](https://github.com/StrandedKitty/straight-skeleton/tree/v1) | MIT | 2023-09 | Hipped roofs for any outline, holes included. Pure TypeScript, no outside code; a port of a C# straight-skeleton library (check that one's licence before copying). Use **v1**, not v3 (see section 3) |
| [mapbox/martini](https://github.com/mapbox/martini) / [mapbox/delatin](https://github.com/mapbox/delatin) | ISC | 2025-07 | Turn a height grid into a light terrain mesh with fewer triangles where the ground is flat: far terrain in the 3D view and in the game |
| [mapbox/polylabel](https://github.com/mapbox/polylabel) | ISC | 2026-06 | The best point inside a shape: where to put a building's name, a nest or a loot spot by position |
| [kchapelier/poisson-disk-sampling](https://github.com/kchapelier/poisson-disk-sampling) | MIT | 2022-06 | Evenly spread random points; `docs/TERRAIN.md` already plans tree placement this way |
| [hyparam/hyparquet](https://github.com/hyparam/hyparquet) | MIT | 2026-10 | Reads Parquet files in the browser with no outside code, only the columns and rows needed. Lets the builder read **Overture's own GeoParquet files** instead of asking for GeoJSON. Overture often uses ZSTD, which needs the add-on `hyparquet-compressors` (licence still to check) |
| [hobuinc/laz-perf](https://github.com/hobuinc/laz-perf) | Apache-2.0 | 2026-10 | The **lidar** decoder (`.laz`), compiled to WebAssembly, with a browser build. The base for real building heights, roof shapes and trees |
| [connormanning/copc.js](https://github.com/connormanning/copc.js) | MIT | 2026-08 | Reads cloud-optimised lidar (COPC) on top of laz-perf: only the part of a huge lidar file that is needed |
| [101arrowz/fflate](https://github.com/101arrowz/fflate) | MIT | 2026-05 | Fast zip and deflate in plain JavaScript. Would let `.asmap` files be compressed (likely several times smaller) and opened quickly on any device |
| [protomaps/PMTiles](https://github.com/protomaps/PMTiles) | BSD-3 | 2026-09 | One-file map tiles read straight from the drive: an **offline street map or aerial photo** under the builder's map, and offline Mapterhorn elevation |
| [geotiffjs/geotiff.js](https://github.com/geotiffjs/geotiff.js) | MIT | 2026-09 | Full GeoTIFF reader. The builder's own reader already handles USGS files, so this is a fallback for unusual files only |

## 2. Use as a guide (port the rules)

These are whole map-to-world projects. Their value is in years of decisions about OpenStreetMap tags.

| Project | Licence | Updated | Language | Worth taking |
| --- | --- | --- | --- | --- |
| [louis-e/arnis](https://github.com/louis-e/arnis) | Apache-2.0 | 2026-10 (very active) | Rust | **The closest match: OpenStreetMap to a block world.** `src/element_processing/` has one file per kind of feature: buildings, roofs, facades, highways, road markings, bridges, power, street furniture, barriers, fuel stations, parking garages, and even `buildings_loot`. Port its rules for which tags become which blocks. Credit it and keep its NOTICE |
| [tordanik/OSM2World](https://github.com/tordanik/OSM2World) | **MIT** (no longer LGPL) | 2026-09 | Java | The most complete OpenStreetMap-to-3D rule set: every `roof:shape`, building parts, roads, and the 2026 work on fitting terrain to the map. Now MIT, so its rules can be ported freely |
| [StrandedKitty/streets-gl](https://github.com/StrandedKitty/streets-gl) | MIT | 2025-08 | TypeScript, WebGL2 | A browser 3D renderer of OpenStreetMap: roof builders for each roof shape, building parts and road areas. The nearest to our own browser stack |
| [a-b-street/osm2streets](https://github.com/a-b-street/osm2streets) | Apache-2.0 | 2025-10 | Rust, plus a WebAssembly JS build | Road widths, lanes left to right, junction shapes, merging dual carriageways and short roads. Either run its JS build in the builder, or port its rules. Its API is not stable yet |
| [a-b-street/osm2lanes](https://github.com/a-b-street/osm2lanes) | Apache-2.0 | 2023-03 | Rust | Turning road tags into a lane list; smaller than osm2streets |
| [BuildTheEarth/terraplusplus](https://github.com/BuildTheEarth/terraplusplus) | MIT | 2026-01 | Java | Earth at 1:1 in Minecraft: streamed terrain and roads, trees from tree-cover data |
| [kunifujiwara/VoxCity](https://github.com/kunifujiwara/VoxCity) | MIT | 2026-10 | Python | Voxel cities from map data (buildings, trees, land cover, terrain). Could also run in our Python `tools/` for pre-building regions |
| [Beakerboy/OSMBuilding](https://github.com/Beakerboy/OSMBuilding) | MIT | 2026-01 | JavaScript | Draws one OpenStreetMap building with all its parts and roofs. Small and easy to read: a good test of our roof code against tagged buildings |
| [nkimber/OpenStreetMapTo3D](https://github.com/nkimber/OpenStreetMapTo3D) | MIT | 2026-10 | TypeScript | A browser app: neighbourhood to a driveable 3D world, a similar goal |
| [vibe-stack/three-roads](https://github.com/vibe-stack/three-roads) | MIT | 2026-08 | TypeScript | Road network meshes with junctions; ideas for road and kerb geometry |
| [Alezx311/earth2road](https://github.com/Alezx311/earth2road) | MIT | 2026-10 | Python | Real map to a driving map with road rules (exports to BeamNG) |
| [conveyal/osmix](https://github.com/conveyal/osmix) | MIT | 2026-10 | TypeScript | Reads, writes and merges OpenStreetMap files in TypeScript; ideas for merging new data under player edits (builder version 2) |
| [LeandroDornela/floor-plan-generator](https://github.com/LeandroDornela/floor-plan-generator) | MIT | 2026-02 | C# (Unity) | Floor plans from a building outline (builder version 5, floor plans and rooms) |
| [AlexKorotkin-creator/BuildingGenerator](https://github.com/AlexKorotkin-creator/BuildingGenerator) | MIT | 2026-10 | Python (Houdini/UE5) | Outline to a walkable building: floors, stairs, lift shaft, roof |
| [YusufEminoglu/osm_3d_model](https://github.com/YusufEminoglu/osm_3d_model), [osm2threejs](https://github.com/YusufEminoglu/osm2threejs) | MIT | 2026-10 | JavaScript, Python | New small projects: OpenStreetMap to a browser 3D city, glTF export |

## 3. Do not use

| Project | Why not |
| --- | --- |
| [prochitecture/bpypolyskel](https://github.com/prochitecture/bpypolyskel) | GPL: copying it would put the builder under the GPL |
| [StrandedKitty/straight-skeleton](https://github.com/StrandedKitty/straight-skeleton) v3 and [matthewjacobson/str8](https://github.com/matthewjacobson/str8) | MIT wrappers around CGAL's straight-skeleton code compiled to WebAssembly. CGAL's straight skeleton is GPL (or a paid licence), so shipping them brings in the GPL. Use the pure TypeScript v1 above |
| [marook/osm-read](https://github.com/marook/osm-read) | LGPL, and last updated in 2019. The builder's own PBF reader already does this |
| [hec-ovi/interiorforge](https://github.com/hec-ovi/interiorforge), [kvasdopil/building-editor](https://github.com/kvasdopil/building-editor), [lovehandle/voxel-osm](https://github.com/lovehandle/voxel-osm) | No licence file, so no right to reuse, however useful they look |
| [mrdoob/three.js](https://github.com/mrdoob/three.js), [maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) | Fine licences (MIT, BSD-3), but large and a second renderer. The game has its own WebGL engine, and the builder must draw exactly as the game does |

## Suggested order

| When | What |
| --- | --- |
| Now | Copy in earcut, flatbush and polylabel (small, used everywhere); add fflate for compressed `.asmap` files |
| Builder 1.x | hyparquet, so Overture's own downloads work. PMTiles for an offline street map under the builder's map |
| Terrain work (builder 2) | martini or delatin for terrain meshes; OSM2World's terrain rules |
| Roads (builder 3) | osm2streets: try its WebAssembly build first, port its rules if that does not fit |
| Buildings (builder 4) | straight-skeleton v1 for roofs; roof shapes from Streets GL and OSM2World; Arnis's rules for which features become which blocks |
| Lidar | laz-perf and copc.js |

Copying in needs the library source: either from npm, which this workspace could not reach on 25 October, or from GitHub, which works.
