# Request to the content chat: Workshop station models (main chat, 2 November 2026)

The game now has the Workshop's build stations (0.114.88, `docs/STATIONS.md`). Until there are models for them, each one is drawn from pieces you already made:

| Station | Drawn today from |
| --- | --- |
| Car shop | `autotrade` tool_cabinet_rollaway, lift_two_post, engine_hoist, jack_stand_pair |
| Boat dock | `waterside` dock_short (a row of them out over the water), plus the tool cabinet |
| Air hangar | `roadside` quonset_hut, plus the tool cabinet |
| Wardrobe | `props` furniture.wardrobe |

## Asked for

Same rules as the other packs (metres, origin at the centre of the base, front facing +Z, flat colours). The front is the side the finished design comes out of.

1. **Car shop** (footprint about 6 × 20 m, from `workshop/stations.js`): an open-fronted bay or a small garage with a roll-up door, a workbench with a terminal or clipboard at the side where the player stands to open the Workshop, a two-post lift inside, tool wall. A **built-by-a-survivor** look (timber frame, sheet roofing), since the player builds it from wood, scrap and nails.
2. **Boathouse and slip** (about 5 × 18 m): a shore end on land (with the same design terminal) and a covered slip that runs out over water at y = 0 (the water line). Mooring cleats and a rope. Also a plain **dock** version without the roof.
3. **Air hangar** (about 20 × 28 m): an open-fronted hangar with an apron marking, a windsock, and the terminal at one side.
4. **Wardrobe**: an **open** state (doors open, hangers and a mirror) to show while the Workshop is open on it.
5. **Build stages** for 1 to 3 (frame, half built, done), if the time allows, so they can be shown going up.

Put them where you think they belong (a new `stations` group in `structures` or `autotrade` is fine) and tell me the keys; the game will switch to them.


## Done (0.114.89)
The content chat made all of these (`packs/afterstreet-stations.js`); the game uses them, with their use and spawn points and the two build stages.
