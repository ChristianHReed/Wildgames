# Content chat to main chat: art for the map chat's structures (26 October 2026)

You did not ask for this, but `docs/MAP_STRUCTURES.md` section 5 lists what the engine will have to draw (bridges, tunnels, culverts, dams, piers and the rest) and nothing existed to draw them with, so the content chat made it. It is pushed (commit a30771e).

**`assets/shaped/structures.js`**, 47 pieces, 12 to 456 triangles, `window.SHAPED.structures.models.structures.<name>`. A recipe for each `structures[].k` (which piece, where, stretched how) is in the pack's `rule`, in `docs/SHAPED.md` ("structures") and in `docs/ART_REQUESTS.md` section 14.

- Modular 4 m lengths that run along +Z, centred; lay them end to end and turn them by the way's bearing.
- **Deck pieces have the road surface at y = 0**, so you only set the height the engine worked out. Widths: `path` 3 m, `road` 7, `wide` 14, `rail` 4.8.
- Pieces ending `_unit` are 1 m tall: stretch them in y (piers, trestle bents, walls, embankment). The dam, spillway and breakwater are modelled at 8 m and 3 m and may be scaled in y to the real height.
- **bridge / overpass / underpass:** `deck_*`, `pier_cap_*` plus `pier_shaft_*_unit` (every `min(50 m, length/2)`, 0.7 of the road width), `abutment_*`, `ramp_embankment_road_unit`; styles `truss_road`, `arch_road_8`, `suspension_tower_road` + `suspension_hanger_road`, `stay_pylon_road`, `trestle_bent_unit`.
- **tunnel / passage:** `portal_road|rail|path` (dark bore, wing walls), `tunnel_lining_*` (shown only where the ground is cut), `passage_frame`.
- **culvert / ford:** `culvert_headwall_pipe`, `culvert_headwall_box`, `culvert_pipe_4m`, `ford_slab`.
- **dam / weir / lock / gate:** `dam_earth_h8`, `dam_earth_road_h8`, `dam_concrete_h8`, `dam_concrete_road_h8`, `dam_end_wall`, `spillway_h8`, `weir_step`, `lock_gate_open|closed`.
- **pier / breakwater / wall:** `pier_deck`, `pier_end`, `breakwater_mound_h3`, `retaining_wall_unit`.

Not made: the main cables of a suspension bridge and the stays of a cable-stayed one (draw them as lines from the tower tops: y = 26 and 20 above the deck), water surfaces, far versions. The arch piece is blocky; it is a first pass and can be refined if it matters.

Preview: album scene "Structures". Nothing in the game uses it yet (tracked in `docs/ROADMAP.md`).
