# What the map chat should build

Written at version 0.49.5, 19 October 2026, for the chat that makes the map data. The game reads the pack in `design/afterstreet_handoff/map_data/springfield_50mi/` (see its `REFERENCE.md` and `map_spec.json`) through `tools/build_region.py`, which cuts it into squares. This list says what the game needs beyond what the pack already has, most useful first. Everything should stay OpenStreetMap-derived (ODbL credit) and in the same GeoJSON layout so the map maker needs only small changes.

## 1. Needed first

- **Road names and refs.** Every `roads_*` feature needs `name`, `ref` (route numbers like "US 60", "I-44", "MO 13"), and `alt_name` if present. The pack has none today, so streets cannot be signed. (As a stop-gap `tools/fetch_road_names.py` pulls them from Overpass; the pack should carry them instead.)
- **Building heights and levels.** `building:levels`, `height`, and `min_height` where mapped, plus a flag saying whether the number is mapped or guessed. Tall buildings now get up to 14 storeys from this, so downtown needs real heights. Also `roof:shape` and `roof:levels` where known.
- **Building use.** `building` type, `amenity`, `shop`, `office`, `tourism`, `healthcare`, `man_made`, and `name`, so shops, hospitals, schools and industrial buildings get the right layouts and loot.
- **Addresses.** `addr:housenumber`, `addr:street`, `addr:unit`, `addr:city`, `addr:postcode` on buildings, and address points for buildings that lack them.

## 2. Roads that drive and look right

- Lanes (`lanes`), `oneway`, `maxspeed`, `surface`, `bridge`, `tunnel`, `layer`, `junction` (roundabouts), `sidewalk`, `parking:lane`, `lit`.
- **Junction nodes:** traffic signals, stop and give-way signs, crossings, bollards, barriers, gates.
- **Street furniture points:** street lamps, hydrants, benches, bins, bus stops, parking meters, signs.

## 3. Power (for the power plant step, 0.59)

- Power plants and generators (`power=plant|generator`, with `plant:source`), substations (`power=substation`), transmission and distribution lines (`power=line|minor_line`), poles and towers, transformers, solar farms. Without these the game places a plant by rule.
- Water towers, treatment works, pumping stations, fuel stations, fuel depots.

## 4. Land and ground

- Land use and cover: residential, commercial, industrial, retail, farmland, forest, grass, scrub, wetland, cemetery, quarry, landfill, with parks and `leisure` pitches.
- Water: lakes, rivers with width or `waterway` class, dams, weirs, and shorelines. Bridges as geometry with deck height.
- Railways with `service`, crossings, stations, and the old Frisco rail trails.
- Elevation in the same tile layout (the pack's terrain), plus any cliffs, quarries or embankments (`natural=cliff`, `man_made=embankment`).

## 5. More places

The same layout for other cities, so playable regions can be swapped: a small pack builder with a bounding box and a size, producing the same file names. Suggested first: a smaller town (about 5 miles), a bigger city, and a rural county. Keep each region under 100 MB.

## 6. How to hand it over

One zip with the pack folder, a `REFERENCE.md` of every property it contains, a count of features per file, and the OSM extract date. The roadmap step that reads it is 0.49.6 (street names, address search) and then 0.56 to 0.60 (building materials, power, vehicles through walls).

## Added 20 October 2026 (version 0.69.0)
- **Gun shops and army surplus.** Flag `shop=gun`, `shop=hunting`, `shop=outdoor`, `military=*` and `amenity=police` buildings with a `kind` the game can read (gunshop, surplus, armory), so guns and ammunition can be placed there instead of at random.
- **Industrial building sizes.** Warehouses and factories with `building=industrial|warehouse|factory` and their footprint area, so the power plant can pick the right one (the game takes the largest between 250 m and 1800 m from the start).
- **Substation and power-line features.** `power=substation`, `power=pole`, `power=tower`, `power=line` where mapped; the game places four substations by quadrant today and would use the real ones.

## Overview file (0.85.0)
The game reads `assets/springfield/overview.js` for the whole-region big map. After every `tools/build_region.py` run, run `python3 tools/build_overview.py` as well. Wanted later: parks, woods and farmland polygons in the overview, and place names (towns) with their centre points.

- **Bridges and overpasses (0.89).** The game now infers bridges from water crossings and motorway crossings. Real tags would be better: send `bridge`, `tunnel`, `layer` and the bridge's start and end points per road, and keep the road pieces whole across junction-free crossings so overpasses have room for their ramps.
