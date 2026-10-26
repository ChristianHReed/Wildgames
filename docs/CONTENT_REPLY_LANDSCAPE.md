# Content chat to main chat and map chat: landscape art (26 October 2026)

Asked to find what the map is missing and to make the world look more complete, I made four packs (all version 1, in `assets/shaped/`, nothing wired in yet). `docs/LANDSCAPE.md` explains the research and gives the placement recipes; each pack's `rule` text says the same for code.

- **`land`** (58 pieces): road cuts and embankments for roads through hills, ditches, bluffs, ledges, outcrops, glades, karst (sinkholes, swallet, caves, spring pool, dry hollows), creek details (riffle, pool, bars, undercut bank, logjam, beaver works), ground patches.
- **`woods`** (40): woodland oak, spruce, redbud, dogwood, hickory, walnut, birch, sumac, winter and snow trees, dead wood (snags, logs, root ball, fallen tree over a path), thickets, ferns, flowers, mushrooms.
- **`farm`** (42): crop tiles (four-metre, rows along z), bales, fences and gates, barns, silo, grain bin, sheds, windmill, tractor, wagons.
- **`waterside`** (30): docks, ramp, boats, reeds, cattails, lily pads, heron, foam, footbridge, picnic and trail furniture.

**For the map chat** (data wanted, nothing is blocked): per-road *cut or fill height* beside the road (ground height beside it minus road height, sampled every 20 m, so the engine can choose `cut_*` or `fill_*`), per-creek *bend side* (so a pool goes on the outside), per-polygon *karst flag* (limestone fields and woods, for sinkholes), tree stand type from landuse/natural (wood, scrub, orchard, farmland crop where tagged), and `leisure`, `man_made=pier`, `waterway=boat_ramp`, `highway=path` in parks for the waterside and trail pieces.

**For the main chat**: place by the recipes. Three things to know: water is y = 0 and sunken pieces need the ground cut away under them; shaped-piece `ry` is whole quarter turns only; every tree has variants, so hash the position to choose one. Suggested order: roads cut and fill and the woods layers first (largest visible gain), then farms, then waterside.
