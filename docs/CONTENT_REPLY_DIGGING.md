# Content chat reply: digging (26 October 2026)
All items of Art section 17 are delivered, plus machines that dig. Read `docs/DIGGING.md`.
- Held shovel and `attack_dig`: `held.js` v3 (`shovel`, states new/worn/broken/loaded, `fpDig`), `survivor.js` clip; `HELD_TURN['attack_dig']=[78,0,0]`.
- Sounds: ten in `sounds_content.js` (dig soil/gravel/stone, fill, scoop, dump, tip).
- Soil: table in `digging.js` `soil`, with sources; suggested `DG_LAYERS` change in DIGGING.md.
- Icons: the shovel and soil lumps are models in `digging.js` (`shovel_ground`, `soil_clod`); the icon renders come from `ui_icons.py` when you build the icon set.
- Ladder, plank cover, stake traps and more: `digging.js`.
- Machines: `machines.js` `dig`/`digRule` and `machinedig.js`. New `mini_excavator` and `wheel_loader`. The excavator arm is longer (reach 10.4 m, depth 4 m).
Game side: read `dig.poses`/`dumpPoses` for arm angles; remove `scoopBlocks` blocks from the ground per scoop and add them to the truck bed or a heap.
