# Waterways: banks, shores and flowing water (1 November 2026)

A pack of 40 pieces, `packs/afterstreet-waterways.js`, built in the Workshop by `workshop/tools/make_waterways.js` (run it again to rebuild). It adds to the `land` group, next to the creek pieces already there (`riffle_4`, `pool_4`, `gravel_bar_*`, `cut_bank_4`, `logjam`) and the `waterside` pack (`reeds`, `cattails`, `shore_foam`). Nothing existing was changed.

## 1. What the research says (and what we did with it)

- **A river is a set of repeating shapes, not a ribbon.** Pools (deep, slow, on the outside of a bend), riffles (shallow, fast, straight reaches), cut banks (steep, eroded, outside of a bend) and point bars (sand and gravel dropped on the inside of a bend). Bank stability depends on the plants, the size of the sediment in the bank and the stream's power ([Virtual River, bank and channel features](https://sciencecourseware.org/VirtualRiver/Files/page09.html)). So the pack gives every bank a **character**: gentle and gravelly on the inside, steep and rooty on the outside.
- **The edge is the whole illusion.** The two things that make water look flowing and a shore look natural in stylised games are (1) a soft, broken line where land meets water (foam, wet ground, plants over the edge) and (2) visible flow direction (streaks, wakes behind obstacles, standing waves in a chute). Stylised water shader guides all lean on the same two cues: foam where the surface meets something, and a surface moving in one direction ([stylised water shader examples](https://store.godotengine.org/asset/emace-art/stylized-water-shader/)). The game's tiles already give the surface; these pieces give the contact and the motion.
- **Voxel banks must not be straight.** A blocky bank looks like a staircase unless the steps vary. Each bank piece is built in 0.5 m cells whose heights jitter by 5 cm and whose steps shift by up to 12 cm; the first step is always wet mud or dark gravel, so there is a colour change at the waterline.
- **A bank has zones.** Wet mud or cobble at the waterline, a drift line of twigs and foam, a shelf of gravel or sand, a lip of grass, then trees. Pieces are made to stack in that order: `wet_margin_4` and `foam_scum_4` at the line, `sedge_edge_4` just above it, `drift_line_4` on the shelf, a tree on the lip.
- **Cities armour creeks.** Springfield's creeks run through rip-rap, gabions, stone walls and concrete channels, and collect carts, tyres, pallets and bikes. Those pieces are here too, because a creek with none of them does not look like it is in this city.

Sources: [Virtual River](https://sciencecourseware.org/VirtualRiver/Files/page09.html), [stylised water shader example](https://store.godotengine.org/asset/emace-art/stylized-water-shader/). The general search gave little more; the rest is from the existing `docs/LANDSCAPE.md` research and my own judgement.

## 2. The rules for every piece

- **Datum:** y = 0 is the water surface. The stream flows toward +z; water is toward -x, the bank toward +x; x = 0 is the waterline.
- **Bank pieces** are 4 m long, about 3 m deep (x 0 to 3), and go 0.9 m below the surface so a low water level shows no gap. Lay them end to end along the bank; mirror (scale x = -1) for the other bank. Scale x and y a little (0.8 to 1.3) per piece to break repeats.
- **Flow pieces** lie 1 cm above the surface. `flow_streaks_4` and `eddy_4` are decals the game can scroll along +z.
- **Plants** carry a `sway_0` point for the wind.
- Colours come from the `land` palette; a few new ones are stored with each model.

## 3. The pieces

| Group | Pieces |
| --- | --- |
| Natural banks | `bank_shelf_4` (the default), `bank_gravel_4`, `bank_sand_4`, `bank_mud_4`, `bank_cut_clay_4` (strata, roots), `bank_slump_4` (collapsed), `bank_roots_4` (tree roots), `seep_bank_4` (spring seep) |
| Built banks | `bank_riprap_4`, `bank_gabion_4`, `bank_stone_wall_4` (with ladder), `bank_concrete_channel_4`, `bank_timber_crib_4`, `bank_stairs_4`, `bank_landing_4` |
| Outfalls | `outfall_pipe_4`, `culvert_mouth_4` |
| Shore plants | `sedge_edge_4`, `cattail_edge_4`, `cane_brake_4`, `willow_whips`, `sycamore_lean` |
| Shore ground | `wet_margin_4`, `drift_line_4`, `mud_prints_4`, `mud_cracks_4`, `fallen_tree_bank` |
| Flow | `rock_wake_s`, `rock_wake_m`, `rock_pair_chute`, `flow_streaks_4`, `rapids_4`, `eddy_4`, `foam_scum_4`, `ledge_drop_4`, `stream_mouth_4` |
| City junk | `creek_junk_cart`, `creek_junk_tyres`, `creek_junk_pallet_a`, `creek_junk_bike` |

## 4. Placement recipes

| Where the data says | Place |
| --- | --- |
| Straight reach, slow creek or river | `bank_shelf_4` both sides; `wet_margin_4` at the foot; `sedge_edge_4` on the shelf; `foam_scum_4` on the water beside it |
| Inside of a bend | `bank_gravel_4` or `bank_sand_4`; `gravel_bar_*`; `eddy_4`; `cattail_edge_4` if slow |
| Outside of a bend | `bank_cut_clay_4` or `bank_roots_4` with `sycamore_lean` above; `pool_4`; `logjam` or `fallen_tree_bank` downstream |
| After a flood or a steep bank | `bank_slump_4` once in about 12 pieces; `drift_line_4` on low banks |
| Riffle or rapid | `riffle_4`, `rapids_4`, `rock_wake_s/m` in a loose line, `rock_pair_chute` at the head; `flow_streaks_4` on the other tiles |
| Step in a creek bed | `ledge_drop_4` (or `weir` for a made drop) |
| A small stream meets a river | `stream_mouth_4` |
| Bluff creek, springs | `seep_bank_4` under a bluff; `bank_stone_wall_4` at old mills |
| Town and city creeks | `bank_concrete_channel_4`, `bank_gabion_4`, `bank_riprap_4` along roads and parking lots; `outfall_pipe_4` every 60 to 100 m; `culvert_mouth_4` where a road crosses; one `creek_junk_*` every 40 to 80 m, more near bridges |
| Parks and trails | `bank_stairs_4`, `bank_landing_4` with a boat, `bank_timber_crib_4` |
| Dry spell, lake margins | `mud_cracks_4`; `mud_prints_4` at drinking spots |
| Slow, wooded river | `willow_whips` on the lip, `cane_brake_4` on terraces |

Mix at least three bank pieces in any 40 m; never lay the same bank piece more than twice in a row.

## 5. Checking

Rendered in the album (`waterways_banks`, `waterways_shore`, `waterways_flow`), installed by `test_install.js`, 15,700 triangles in all (the biggest piece is about 800). Not yet in the game's placement code: the map chat or main chat picks the bank type from the data using the table above.
