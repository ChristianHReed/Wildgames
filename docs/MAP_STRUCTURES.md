# Bridges, overpasses, dams and other structures

Written by the map chat, 25 October 2026, for builder 1.6.0. What the open-source map builders do with structures, what the real Missouri data holds, the rules the builder now uses to find them, and what the game's engine would need to draw them.

## 1. What the real data holds

A scan of the whole `missouri-261024_osm.pbf` (27 million nodes, 2.5 million ways):

| Structure | Count in Missouri | Notes |
| --- | --- | --- |
| Bridges (`bridge=*` on a way) | about 20,000 (18,700 roads, 1,800 railways) | 97% also carry a `layer`; layers run from 1 to 5 (stacked interchanges); 11,000 are named; only 24 say how they are built (`bridge:structure`) |
| Bridge values | `yes` 20,485, `boardwalk` 83, `viaduct` 57, `covered` 21, `low_water_crossing` 21, `trestle` 6, `movable` 4, `aqueduct` 3, `cantilever` 2 | |
| Bridge areas (`man_made=bridge`) | 1,027 | The outline of a bridge, drawn as an area |
| Bridge supports (`bridge:support` on a node) | 15 | Almost never mapped; piers must be made up |
| Tunnels (`tunnel=*`) | 1,491 roads, 152 railways, 15,640 waterways | 13,231 of the waterway tunnels are **culverts** |
| Building passages (`tunnel=building_passage`) | 998 | A road or path through a building |
| Layers with no bridge or tunnel | 951 at `-1`, 362 at `1`, 43 at `2` | Underpasses, car parks and plazas; a layer alone does not mean a bridge (Arnis says the same) |
| Dams (`waterway=dam`) | 1,592 ways and 2,456 nodes | Mostly small farm and watershed dams; also Table Rock, Bull Shoals and Pomme de Terre |
| Weirs, lock gates, locks, waterfalls | 63, 17, 10, 73 | |
| Retaining walls (`barrier=retaining_wall`) | 7,713 | |
| Piers, breakwaters and groynes, dykes, embankments | 1,682; 3,817; 143; 191 | |
| Roads with `embankment` / `cutting` / `ford` | 208 / 146 / 326 | |

Downtown St. Louis (2 miles around the arch) alone holds 986 mapped bridges, 1,956 overpass crossings and 297 underpasses. Springfield (2 miles) holds 206 bridges, 487 culverts, 62 building passages, 304 overpass crossings and 53 underpasses. Almost every crossing is mapped; the rules for the rest are in section 3.

## 2. What the open-source builders do

Read from the source of [OSM2World](https://github.com/tordanik/OSM2World) (MIT) and [Arnis](https://github.com/louis-e/arnis) (Apache-2.0); [osm2streets](https://github.com/a-b-street/osm2streets) (Apache-2.0) for how layers keep roads apart at junctions. Only the rules were taken, not code.

**OSM2World** (`BridgeModule.java`, `BridgeOrTunnel.java`, `TunnelModule.java`):
- A bridge is any way with `bridge` set and not `no`. A tunnel is `tunnel` set, not `no`, and not `building_passage`.
- A bridge deck sits 0.1 m above the terrain at its ends; the underside is 0.2 m thick.
- **Piers:** if nodes or areas are tagged `bridge:support` (`pier`, `lift_pier`, `pivot_pier`, `pylon`) they are drawn there. Otherwise piers are spread evenly along the bridge, every `min(50 m, length / 2)`. A pier is 0.7 of the road's width wide and half that long. A pier is dropped when it would land on a road or rail at ground level underneath (water is allowed).
- **Clearance:** where a bridge crosses something on the ground, the deck must be at least 10 m above it; a tunnel at least 10 m below (its TODO says to base this on the real clearance).

**Arnis** (`element_processing/bridges.rs`, `bridge_styles.rs`, `highways.rs`, `man_made.rs`, `waterfront.rs`) is the most complete. Its rules, in metres:
- **Which ways are bridges:** `bridge` not `no`, and not `indoor=yes`. **A `layer` alone lifts nothing** ("it marks a plaza over an underpass as often as a bridge"). A way is a *ramp candidate* if it has `embankment`, `man_made=embankment` or `layer` of 1 or more but no bridge tag.
- **Layer without a number:** a bridge with no `layer` counts as layer 1.
- **Headroom the deck must keep over what is under it:** a road 6, a path or track 5, a railway 8 (clears the overhead wire), a river or canal 4, a stream 2, another deck 6.
- **Height by layer:** over flat ground (the ground varies by less than 4 m) and 30 m or longer, the deck rises 6 m for every layer above the first. In a valley the deck sits on its banks and does not rise.
- **Deck line:** the deck takes the least concave line that clears every obstacle under it (an upper hull), so it never sags into a gap; a climb off the deck's end is at most 1:1.
- **Grouping:** ways of one bridge are joined by name and shared ends (up to 200 m between same-named parts); two carriageways within 12 m and 20 degrees of parallel are one deck.
- **Pedestrian bridges** (`footway`, `path`, `cycleway`, `steps`) get a narrow deck of their own.
- **Style from `bridge:structure`:** beam (the default), arch (needs 8 m of room over flat ground to read), suspension and cable-stayed (towers from `man_made=tower` points, piers only beyond them), truss, trestle and viaduct (many piers).
- **Tunnels:** `tunnel=yes`, or `level` below 0; the road approaches its portals by a ramp the same length as a bridge ramp. `building_passage` is a road through a building and is not a tunnel.
- **Water structures:** `man_made=pier` is a deck on piles, `breakwater` and `groyne` are rubble mounds that stand no higher than a set limit above the water. `waterway=dam`, `weir` and `lock_gate` are not drawn; Arnis only filters them out as terrain features. This is a gap in every builder studied.

**osm2streets:** ways on different layers never join at a junction, even where their lines cross. This is the rule behind the "no shared node means no junction" test below.

## 3. The rules the builder uses (version 1.6.0)

`builder/structures.js` runs on each square after it is cut and writes the `structures` list (format in section 4). Everything is done in local metres on the square's own ways.

### Read from the tags (`src: osm`)
| Tags | Becomes |
| --- | --- |
| `bridge` set (not `no`, `abandoned`, `construction`, `retired_road_bridge`, `low_water_crossing`) on a road, path, rail or waterway | `bridge`, level `max(1, layer)`; `t` the `bridge` value, `st` the `bridge:structure` |
| `tunnel` set (not `no`, `building_passage`) | `tunnel`, level `min(-1, layer)`; on a waterway, `culvert` |
| `tunnel=building_passage` | `passage` |
| `ford=yes`, `bridge=low_water_crossing` | `ford` (a road through the water, not a bridge) |
| `waterway=dam` (way or node), `man_made=dam` | `dam`, with `h` from `height`; `road: true` when a road runs along the top; `o: water` when a waterway crosses it |
| `waterway=weir`, `lock_gate`, `lock`, `waterfall` | `weir`, `gate`, `lock`, `fall` |
| `man_made=pier`, `breakwater`, `groyne`, `dyke` | `pier`, `breakwater`, `dyke` |
| `barrier=retaining_wall` | `wall`, with `h` |
| `embankment`, `cutting`, `man_made=embankment` on a road | `bank` |
| `man_made=bridge` area | `bridge` with `o: area` (the outline of a bridge) |
| `bridge:support` node | `support`; the nearest mapped bridge within 60 m counts it in `piers` |

### Worked out from the shapes (`src: inferred`)
1. **Level of a way:** bridge means `max(1, layer)`; tunnel means `min(-1, layer)`; otherwise the `layer` number (default 0).
2. **Two ways cross with no shared point** (no vertex of both within 1.6 m of the crossing). If they share a point it is a junction and is skipped.
3. **Levels differ:** the higher one goes over, and an `overpass` is written (`w` over, `u` under, `d` levels apart, `cl` clearance: 6 over a road, 5 over a path, 8 over a rail, plus 6 for each extra level). If the way that goes over is at ground level (the other is a tunnel) it is an `underpass` instead.
4. **Same level, a road or rail against a motorway, a trunk road or a rail, with nothing mapped:** the other way goes over (this is the game's own rule), written as an inferred `overpass`.
5. **Same level, both carrying vehicles or trains, nothing explains it:** a `check` ("crossing with no junction and no bridge") so a person can look in OpenStreetMap. Footpaths and driveways are not flagged, since they often cross without a mapped point.
6. **A road or rail at ground level through a river, lake or pond area** for 7 to 160 m: an inferred `bridge` (over water, headroom 4). Over 160 m is a `check` ("long wet crossing").
7. **A road or rail crossing a river or canal line** with no bridge and no area already bridged: an inferred `bridge`. Crossing a stream, ditch or drain: an inferred `culvert`. A waterway tunnel (culvert) crossing a road is a mapped `culvert`.
8. One record per pair of ways within 40 m; only structures whose middle lies inside the square are kept, so squares do not repeat each other.

Tested on real data (Chromium and Node, 25 October): Springfield, Table Rock, downtown St. Louis (counts above), and a made-up square with a known case for each rule (every rule fired as expected).

## 4. Where it goes in the map file

A square gets a new top-level key `structures` (format 2 maps; old games ignore it), and `builder.structures` carries the counts by kind and source. The accuracy report shows them. An entry:

```json
{"k":"overpass","w":3337,"u":65,"lon":-93.287597,"lat":37.211588,"l":1,"d":1,"cl":8,"o":"rail","src":"osm"}
```
`k` kind, `w` the way in the square's `ways` list (for an overpass, the one that goes over), `u` the one under, `l` level, `d` levels apart, `len` metres, `cl` metres of clearance, `o` what it crosses (`water`, `road`, `path`, `rail`, `area`), `t` the tag value, `st` the structure, `n` name, `h` height, `piers` count, `road` and `o` on dams, `src` `osm` or `inferred`.

Kinds: `bridge`, `tunnel`, `culvert`, `passage`, `ford`, `overpass`, `underpass`, `dam`, `weir`, `lock`, `gate`, `fall`, `pier`, `breakwater`, `dyke`, `wall`, `bank`, `support`, `check`.

## 5. What the game's engine does today, and what would help

`engine/world.js` (`bridgeScan`) works only from shapes: a road that runs 7 to 160 m through water gets a deck with piers, and a **non-motorway road that crosses a motorway or trunk road with no junction goes over it**. It reads no `bridge`, `tunnel`, `layer`, `embankment` or `ford` tags and draws no dams, weirs, piers, tunnels or culverts.

Requests for the main chat, most useful first (also in `docs/MAP_HANDOFF.md`):

1. **Carry `structures` through** `fromCompact` and `toCompact` (like `holes`), so `world.structures` exists.
2. **Pick the way that goes over from the data:** for each `overpass` entry, the way `w` is raised over `u`, not "whichever is not the motorway". Today an interstate that is mapped as the bridge, over a local street, gets the **street** raised over it, which is the wrong way round. With no entry the old rule stays.
3. **Deck height by the rules above:** the end heights from the ground, `cl` metres over what is under it (roads 6, rails 8, paths 5, river 4, stream 2), 6 m more for each extra level, a valley span sitting on its banks, ramps as now. Bridge piers every `min(50 m, length / 2)`, 0.7 of the road's width wide.
4. **Tunnels:** a road or rail with a `tunnel` entry gets no surface where the ground is above it; draw portals (a dark face) at the ends and let the ground continue overhead. `passage` needs nothing but a gap in the building.
5. **Culverts:** do not draw the waterway ribbon over a `culvert` entry's span; the road keeps its surface.
6. **Dams:** a wall along the way: crest 6 m wide (wider when `road` is true), height `h`, or the drop between the two sides, or 8 m; concrete for `material=concrete`, earth otherwise; a slope on the downstream side. A weir is a 0.6 m step across the river. Locks and gates can wait.
7. **Piers (`man_made=pier`):** a deck 0.4 m over the water on piles; **breakwaters:** a rubble mound; **retaining walls:** a wall of height `h` (default 1.5 m) with the ground higher on one side.
8. `ford` roads stay on the ground through the water and are slow to cross; no deck.

The builder's 3D view uses the same engine, so everything the engine learns shows there too. The builder's own **Structures** switch in the 3D view shows the poles described there. It is a check on the detection, not the final look.

## 6. Not done yet, and why

- **Raising or lowering the ground for dams, bridges and culverts** (the elevation data often smooths them away): waits for the engine, since it also decides how it shows them.
- **Matching a bridge's name across ways** (Arnis joins parts within 200 m by name): not needed until decks are built per bridge.
- **Editing structures in the builder** (add a bridge, remove one, change a layer): version 3 (roads and infrastructure) with these records as the starting point.
- **Very large inferred structures** (levees, causeways over 160 m of water) are flagged for review, not built.

## 7. Art for these (content chat, 26 October 2026)

The pieces for every kind in section 4 are in `assets/shaped/structures.js`, with a recipe per `k` (which piece, where, stretched how) in `docs/SHAPED.md` under "structures" and in `docs/ART_REQUESTS.md` section 14. Deck pieces put the road surface at y = 0 so the engine only has to set the height it works out in section 5.
