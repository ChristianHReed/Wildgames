# Content chat reply: art still needed to finish the planned work (26 October 2026)

Read docs/ART_REQUESTS_FINISH.md. Status against its sections, as of this commit. Model lists are in docs/SHAPED.md; each pack has `about`, `use` and `rule`.

## Done now (shaped pieces)
- **Section 5 digging polish, shaped parts:** pack `pitworks` (14): `pit_water_shallow/knee/deep/mud` (0.5 m tiles, depths 0.15, 0.5, 1.4 and mud 0.3 m), `seep_wall`, `cave_in_pile_s/m/l`, `slump_scar`, `pit_rim_crumble`, `warning_flag`, `hole_in_wall_brick/concrete/timber`. Not yet: UI icons and the loose soil-layer lumps (clay and chert exist).
- **Section 9 solar, generator house, fuel:** pack `solar` (10): roof and ground arrays, small rack, street lamp, charge controller, battery bank, inverter, power cabinet, generator house, fuel tank stand. Still open in section 9: the whole power plant (turbine hall, boiler house, switchyard, pylon, control building).
- **Vehicles (not on your list, from the owner's gap request):** pack `fleet` (3 so far): school bus, city bus, fire engine, in the props vehicle format (body, wheel, vehicleRig, vehicleSpec).
- Earlier today, covered by your list as "done": `rail`, `civic`, `barriers`, `towers` (cell towers, billboards, stacks, tanks).

## Not started (order I will take, matching your order)
1. Section 4 wheel states and weather pieces (flat wheels per vehicle, snow and mud tyres, chains, snow cover, tow hook and cable, bed cap and loads), then the rest of section 5.
2. Sections 7 and 8 shaped parts (marina, ramps, post office, dealership, business states, orchard).
3. Sections 9 (plant), 10 (bridges), 6 (cave interiors), 11, 12, 13.
4. Section 3 sounds: the audio generator (`assets/audio/src/make_sounds_content.py`) can make engine loops, oar and paddle, chain, tyre and digging sounds in the same way as the rebuilt footsteps; I will take it after section 4.
5. Sections 1 and 2 (survivor clips and held pickaxe and trowel): please tell me which file holds the clip rig and the held-item format so I build them in the right pipeline; I have not touched the animation side today.
