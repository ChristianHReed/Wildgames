# Landscape design guide (26 October 2026)

For the map chat and the main chat. It says what makes Springfield's ground look like Ozark country and how the new packs (`land`, `woods`, `farm`, `waterside`) are meant to be placed. Piece lists and triangle counts are in `docs/SHAPED.md`; each pack's `rule` text repeats the placement recipe for the code that places it.

## 1. What was missing

The world pack already had roads, kerbs, water, banks, falls, rocks, cliffs and ore; the ground pack had tiles, decals and edges; flora had six tree kinds. What the map could not yet show was:

- roads that cut through hills (rock and soil cuts, ditches, embankments, guardrails);
- limestone country: ledges, bluffs, glades, sinkholes, caves, springs, dry hollows, natural bridges;
- creek craft: riffles, pools, gravel bars, undercut banks, logjams, beaver works;
- a dense wood with layers (only one tree stood in each spot) and dead wood on the floor;
- the working country around the city: crops, hay, fences, gates, barns and the rest of a farm;
- the water's edge and the trail: docks, boats, reeds, lily pads, herons, footbridges, picnic tables, trail markers.

## 2. What the research says, and what we did with it

**Road cuts.** Highway engineers cut soil at about 2 horizontal to 1 vertical and rock much steeper; a high rock cut is broken into benches (a flat step every 6 to 8 m of height) so falling stone lands on a bench and not on the road, and a catch ditch runs at the toe. Cuts are stratified: the limestone shows as bands of different colour. So `cut_rock_h4/h8/h12` have benches and strata, `cut_soil_h3/h6` are 2:1, `ditch_4` and `rockfall_fence_4` are the toe works. Cuts end by easing out (`cut_rock_end`), never by a wall.

**Streams.** A real creek is not a ribbon of one depth. It alternates pools (deep, slow, on the outside of a bend, with a cut bank) and riffles (shallow, fast, over gravel) about every five to seven channel widths. The inside of a bend builds a gravel point bar. Wood and boulders make steps and shelter. So the pack has `pool_4`, `riffle_4`, `gravel_bar_*`, `cut_bank_4` (the undercut bank with roots), `logjam`, `stream_boulder_*`, `beaver_dam`, `beaver_lodge`, `mudflat`. Rule: never lay the same piece twice in a row.

**Karst (the Springfield Plateau).** Limestone and dolomite dissolve, so the ground is pitted: sinkholes in fields and woods, caves in bluffs, springs that come out as a big blue pool and a stream, losing streams (a swallet) that vanish into the ground, dry hollows with chert cobbles, natural bridges. Glades are pale dolomite pavement with lichen, prickly pear, coneflowers and cedar edges, on south and west slopes. All of these are in `land`.

**Forests.** A wood is layered: canopy, understory, shrub, herb, plus dead wood. Woodland trees grown close together have long clear trunks and small crowns (`oak_tall`) unlike the wide open-grown oak. Missouri's understory is redbud and dogwood; the edges are sumac and brier. Dead trees (snags), fallen logs and root balls are what make a wood look old. Moss and fungus mean damp. The `woods` pack has each layer.

**Composition.** Level designers use a foreground, a centre of interest and a background; they break repetition (variants of every tree, random rotation, size jitter), cluster objects instead of spreading them evenly, keep a small set of ground materials, and make transitions soft (field, shrub, understory, canopy over 10 to 15 m). Nothing here is placed in a grid.

## 3. Placement recipes (short)

| Where the data says | Place |
| --- | --- |
| Ground beside a road is more than 1.5 m above it | `cut_rock_*` if rocky or steeper than 1:1, else `cut_soil_*`; `ditch_4` at the toe; `rockfall_fence_4` on benches above 8 m |
| Road more than 1.5 m above the ground beside it | `fill_bank_h3/h6`; `guardrail_4` on the edge above 3 m; `rip_rap_4` at a stream |
| Creek, straight reach | alternate `riffle_4` and `pool_4`; pool on the outside of a bend with `cut_bank_4`, gravel bar on the inside; `stream_boulder_*` where shoals are; `logjam` after a bend; `beaver_*` on slow lowland creeks |
| Head of a creek in a hollow | `spring_pool` with `spring_outflow_4`; a `swallet` where a small stream ends |
| Slope above about 25 degrees, ridgelines | `outcrop_*`, `ledge_*`; `glade_patch`, `ledge_l` and cedars on south and west slopes |
| Limestone fields and woods | `sinkhole_s/m/_pond` in groups of two or three; `cave_mouth_*` in bluffs; `dry_hollow_4` |
| River edge | `bluff_h10/h5` with `talus_slope_4` below; `overhang_shelter` once in a while |
| Wood | per 60 sq m one canopy tree (`oak_tall`, `hickory`, `walnut`, `spruce` cool slopes, `pine` dry ridges); per 25 sq m one understory (`redbud`, `dogwood`, `sapling`); `thicket_*`, `berry_bush`, `sumac` at clearings and edges; herbs in clusters; one or two dead wood pieces per 400 sq m |
| Farmland | house and yard first, `barn_*`, `silo` or `grain_bin` beside the drive; fields as blocks of `crop_*` tiles at least 4 by 8; a fence around each with `gate_field`; `gate_farm` and `mailbox` at the drive; `bale_round` scattered on stubble and harvested fields |
| Water's edge | `shore_foam` at the waterline, `reeds` and `cattails` on the slow side, `lily_pads` and `duckweed` on ponds only, a `heron` at the head of a pool |
| Marina, pier, boat ramp, lake house | `dock_*`, `boat_ramp`, boats on the bank beside them (`jon_boat` on a lake, `canoe` and `kayak` on rivers) |
| Path or footway in a park or woods | `trail_marker` every 150 to 300 m, `trail_marker_arrow` at forks, `trailhead_sign` and `picnic_table` at the start, `bench` at viewpoints, `fire_ring` at camps, `footbridge` over streams, `stepping_stones` at fords |

## 4. Rules for every piece

- Metres, origin at the centre of the base, front facing +Z, flat colours from the pack palette.
- Anything that follows a road, creek or bluff is 4 m along z and tiles end to end. Road-side pieces have the toe at x = 0 and rise toward +x; mirror with `scale.x = -1` for the other side. Bluff and creek pieces face -x.
- Water level is y = 0. Pools, riffles, ditches, sinkholes and springs sink below it, so the ground under them must be cut away (the album shows them lifted).
- Ground patches (`patch_*`) are thin decals at y = 0.02.
- Shaped-piece `ry` is a count of quarter turns; use whole numbers only (`rx` and `rz` are not supported).
- Every tree has a variant: choose by hashing the position.

## 5. Not made yet

River gravel flats wider than a bar, a cave interior (the cave mouth is the opening only), a full waterfall step set for Ozark tufa falls (the world pack's falls remain), rope and wire for the pivot irrigation, a pond bank piece for a stock pond. Ask in `docs/ART_REQUESTS.md`.
