# builder/

The AfterStreet Maps Builder (`builder.html` beside `play.html`). Owned by the map chat; the scope is `docs/MAPS_BUILDER.md`.

Version 1.8.0 (25 October 2026) is the **data side of builder version 1** (1.0.0), plus open-source libraries (1.1.0):
- choose the area;
- give it map data (upload or download);
- build the map squares;
- read the accuracy report;
- export, or send the map to the game on the same device.

The 3D view, walk mode and editing tools wait for the shared renderer (`engine/render.js`, see `docs/MAP_HANDOFF.md`).

## Files

All are plain classic scripts, so the builder opens from a USB drive (`file://`) as well as from the website. Each library is a function that installs itself into a shared object `L`. That way the same code runs on the page and in the background worker: the worker is started from the functions' own source text (a Blob URL), which browsers allow even on `file://`.

| File | Holds |
| --- | --- |
| `inflate.js` | Decompression: the browser's DecompressionStream with a plain-JS deflate fallback, TIFF LZW, PackBits, CRC-32 |
| `geo.js` | Projections (UTM for NAD83/WGS84/ETRS89 zones, web mercator, geographic), local metres, point-in-polygon, ring stitching, the repeatable random numbers from `tools/build_region.py` |
| `pbf.js` | OpenStreetMap `.osm.pbf` reader. It reads the file through an 8 MB window, so a whole state file never sits in memory |
| `tiff.js` | GeoTIFF elevation reader: classic and BigTIFF, tiles or strips, deflate/LZW/PackBits, predictors 2 and 3, overviews, NoData |
| `gen.js` | The generator: tag filtering, OSM readers (PBF, `.osm` XML, Overpass JSON, GeoJSON), the Overture merge, gap filling, cutting into squares, ground grids (files first, then Terrarium tiles) |
| `structures.js` | 1.6.0: finds bridges, overpasses, tunnels, culverts, dams and the like in each square and writes the `structures` list (`docs/MAP_STRUCTURES.md`) |
| `build.js` | One whole build (run in the worker), the builder's storage (IndexedDB `afterstreet-builder`), the 2D preview data, map-file zip writer and reader |
| `worker.js` | Starts the worker (or runs on the page if workers are not allowed) |
| `app.js` | The page: area, source cards, build, report, export, the flat preview map |
| `view3d.js` | The 3D view (1.2.0): fly over the built map or walk it, drawn by the game's own engine (`engine/render.js`); loads the art and engine files the first time it opens |
| `view3d.js` terrain edits | 1.3.0: the Sculpt tools; the dabs and their replay (`terrainApply`, `squareText`, `editAdd`) live in `build.js`, stored in IndexedDB store `edits` |
| `host.js` | What the engine expects from its page (`engine/README.md`, "Host contract"): a fly camera as the viewer, the game's quality settings, empty stand-ins for game rules, sound and multiplayer (the art helpers `spB`, `bkMod` and `segsX` come from the engine since game 0.94.1) |
| `lib/*.js` | Open-source libraries, each packed into one classic script by `tools/bundle_lib.mjs`; licences in `lib/LICENSES.md` |

### Libraries (1.1.0)

| Library | Licence | Used for |
| --- | --- | --- |
| flatbush (with flatqueue) | ISC | Spatial index for the Overture merge and for gap filling's road and land lookups. At 50 miles, gap filling dropped from 32 s to 23 s and from about 1.23 GB to 0.96 GB, with identical results |
| polylabel (with tinyqueue) | ISC | A point surely inside each building, so L- and U-shaped buildings are matched correctly in the Overture merge |
| fflate | MIT | Compressed map files (5 times smaller in the test); a much faster fallback when a browser has no built-in decompression |
| hyparquet and fzstd | MIT | Reading Overture's own GeoParquet files, ZSTD-compressed as Overture publishes them |
| earcut | ISC | In `lib/` but not loaded yet: for the 3D view and roofs |

To update a library: clone it from GitHub, run `node tools/bundle_lib.mjs <name> <entry file> [dependency=path ...] --version v --repo owner/name --licence L`, and update `lib/LICENSES.md`. The packed file keeps the library's code unchanged.

## What a build does

1. **Area.** A centre and a radius become the game's squares: 0.05° of latitude (about 5.6 km), the longitude size rounded to 4 decimals, every square whose centre is within the radius plus 3 km. These are the same squares as `tools/build_region.py` and the game's own region downloads.
2. **OpenStreetMap.** A `.pbf` is read in two passes.
   - Pass 1 keeps the nodes inside the area plus a margin (sorted typed arrays), the tagged nodes, and the multipolygon relations.
   - Pass 2 keeps the ways.
   - Tags are filtered to the list in `gen.js` (`KEEP`), which covers everything in `docs/MAP_REQUESTS.md`.
3. **Overture.** Buildings from GeoParquet (Overture's own format) or GeoJSON are added only where no OpenStreetMap building stands, and where no Overture building was already added. The test uses a point surely inside each building, both ways. They are tagged `src=overture`.
4. **Gaps.** Made-up buildings, all tagged `generated=yes`:
   - **Town lots.** Homes go on empty lots along town streets: street length of at least 450 m per 250 m cell, or inside `landuse=residential`. Shops go on bigger streets and in commercial areas. A lot is used only when no building stands within a lot's width, so mapped streets get nothing.
   - **Farmsteads.** Along country roads, every 400–800 m where nothing stands within 180 m: a house, barn and shed, a drive, and sometimes a stock pond.
   - **Never inside:** woods, water, parks, schools, cemeteries, industry and similar areas.
5. **Squares.** Polygons go whole into every square they touch; lines are cut into the runs inside each square plus its margin (as `build_region.py` does). Each square is saved to storage as soon as it is done.
6. **Ground.** Each square gets a height grid:
   - 10 m by default within 15 km of the centre (choose 5, 10, 20 or 40 m), at least 60 m beyond;
   - from the finest uploaded GeoTIFF that has data, then Terrarium tiles, then filled in from the neighbours.
7. **Small areas** (2 miles or less) also get a single map file that today's game opens with *Load map file*.

## The map square format (format 2)

Format 2 is the game's compact map format: `lastblockMap:1, name, attribution, zone, ways, pois, elev`. Older games read it unchanged. These keys are new:

| Key | What |
| --- | --- |
| `format` | `2`. The game can use it to say a map needs a newer game |
| `structures` | 1.6.0: `[{k, w, lon, lat, ...}]`, the bridges, overpasses, tunnels, culverts, dams and so on found in the square (format in `docs/MAP_STRUCTURES.md`) |
| `holes` | `[[wayIndex, [lon, lat, ...]], ...]`: inner rings (courtyards, light wells) of the polygon at `ways[wayIndex]` |
| `builder` | `{v, counts, elev, step}`: the builder version, counts for the report, where the ground came from (`file`, `tiles`, `none`), the grid step in metres |

Inside `ways` and `pois`, tags carry many more OpenStreetMap keys than before: heights, roofs, materials, addresses, lanes, widths, sidewalks, bridges, tunnels, layers, power, barriers and more (the `KEEP` list in `gen.js`). Two tags mark where a feature came from: `generated=yes` for made-up features and `src=overture` for Overture buildings. A building tag present means it was mapped; a missing one means the game uses its own defaults.

## The map file (`.asmap`)

A zip holding the entries below. From 1.1.0 each entry is deflate-compressed (zip method 8); 1.0.0 files are stored uncompressed (method 0), and readers should accept both:
- `manifest.json`: region, squares index, places, credits, sources, the report, `format`, `required` (empty for now) and `layers`;
- `squares/I_J.json`: one square each;
- `CREDITS.txt` and `README.txt`.

The builder reads it back with **Open map file**.

## Sending to the game

**Send to the game on this device** writes the squares into the game's own IndexedDB (`afterstreet`, store `zones`, keys `regionId:i:j`). It also adds the region to `localStorage['lastblock:regions']`, so the game lists it under Regions and plays it. This works only when both pages share an origin (the same site, or the same browser on the same drive).

## Testing

Tested 25 October 2026 in Chromium (served, and from `file://`) and in Node. The test data was a PBF and three GeoTIFFs made from the built-in Springfield squares:
- tiled deflate in geographic coordinates;
- LZW strips;
- tiled deflate in UTM 15N (EPSG:6344).

Results:
- **Readers.** Every node, way and relation was read back, and heights matched the source to 1 cm.
- **In the game.** The game listed and played the sent region, and loaded the single map file.
- **Stress test.** A 50-mile region at city density everywhere (25 copies of downtown, 880,000 ways) built in about 40 s using about 1.3 GB. Whole 50-mile regions are for computers, so the builder suggests smaller areas on phones (8 miles) and tablets (25 miles).
