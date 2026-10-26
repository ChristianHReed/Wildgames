# Map versus art: what was missing, what was built (26 October 2026)

Method: counted the tags in the Springfield squares (`assets/springfield/*.js`, ways only; the pack has no landuse, leisure, barrier or power ways and `pois` is empty) and checked each group against every model name in the shaped packs.

## Result
Street furniture, houses, shops, farms, woods, vehicles, interiors and digging are covered. Real gaps were these groups, now built:

| Gap (map count) | New pack | Models |
|---|---|---|
| Railway ways (1,625), yard, depot, crossings | `rail` | 30: track (plain, worn, crossing, two switches, bumper), platform, dock, signals, crossing gates, depot, freight house, signal tower, section house, 2 locomotives, 8 car types, caboose, handcar |
| church 233, place_of_worship 321, school 252, university 185, hospital 95, civic 1,176, stadium 19 | `civic` | 29: two churches, steeples, bell tower, courthouse, town hall, clock and hose towers, school, university hall, hospital wing, ER canopy, helipad, field light, grandstand, porte-cochere, cemetery set (headstones, row, obelisk, mausoleum, gate) |
| Fences and walls (not in the map pack; the richer OSM extract is a map-chat request) and the survival game's own works | `barriers` | 28: privacy, brick, dry-stone, cinder, sound, cable, security fences and gates; hesco, razor wire, scrap and cart barricades, sandbags, checkpoint booth and arm, scrap watchtower, quarantine tent, tarp shelter, burn barrel, airdrop crate, notice boards, tripwire, spike strip, snare, deadfall |

| Cell towers, billboards, stacks, tanks, bins, turbines (only `billboard`, `water_tower`, `silo`, `radio_mast` and `substation` existed) | `towers` | 21: lattice, monopole and pine cell towers, equipment hut, rooftop antennas, guyed mast; five billboards (pole, V, roof, lit digital, small); brick and steel stacks, flare stack, cooling tower, oil tank, tank farm, grain bins, standpipe, ground reservoir, wind turbine |

Total 108 new models. Each pack has a `use` map and a `rule` text in its file; the album has nine new scenes (`rail_*`, `civic_*`, `barr_*`).

## Still missing (next candidates, in order of value)
1. Vehicles: police car, ambulance, fire engine, mail truck, city bus, semi and trailer, school bus, tow truck (the vehicle kit can refit some).
2. Airport: hangar, terminal, control tower, jet bridge, small aircraft, windsock (Springfield-Branson has them).
3. Industrial: conveyor, gantry or container crane, scrap yard, foundry and warehouse sheds (the cell towers, stacks, tanks and billboards are now done in `towers`).
4. Small props: cart corral, portable toilet, dumpster enclosure, graffiti and stencil decals, bus-stop ads, tents for camps beyond the quarantine one, ruined (collapsed) versions of buildings.
5. Map note: `building=barn` has 37,932 hits, which is far more than real barns; the map pack probably files generic outbuildings under it, so check the extract before placing barn models on all of them.

Pack docs: the model lists are in `docs/SHAPED.md`, and each pack's `about` text explains placement.
