# Digging: soil, tools, pit pieces and machines (content chat, 26 October 2026)

Answers section 17 of `ART_REQUESTS.md` (game 0.99.0) and adds machines that really dig.

## What is delivered
| File | What |
|---|---|
| `held.js` (v3) | `shovel` held (new, worn, broken, `loaded` with soil), `fpDig` first-person frames, bone clip rule for `attack_dig` |
| `survivor.js` | `attack_dig` clip (raise, lean in with the foot on the blade, lever up) |
| `digging.js` (new, 32 models) | ladders 2.4/3.6/5 m, rope ladder, plank covers 1/1.5/2 m (+ broken), stake pits, single stake, edge marker, sandbags (one, wall, pile), shoring panel, grave cross and mound, wheelbarrow (+ loaded), soil bucket, shovel/pickaxe/trowel on the ground, soil clod, turf, clay, chert, limestone, throwing rock, and the `soil` table |
| `machines.js` (v2) | `dig` table and `digRule`; excavator reach lengthened; new `mini_excavator` and `wheel_loader`; soil loads and spoil heaps |
| `machinedig.js` (new) | helper: `tip`, `pose`, `dumpPose`, `cycle`, `scoop`, `canReach` |
| `sounds_content.js` | ten dig and fill sounds (soil, gravel, stone, scoop, dump, tip) |

## Soil under Springfield (`digging.js` -> `soil`)
Based on the USDA Pomme series (Polk County, Springfield Plain): brown silt loam 0-18 cm, clay loam to 48 cm, red very gravelly clay (about 55 percent chert) to 145 cm, then yellowish-red extremely gravelly clay with dolomite. Bedrock is limestone and dolomite with chert bands; the region is karst, so depth to rock swings from under 1 m near creeks and bluffs to over 4 m on the plain.

| Layer | Depth m | Colour | Tool | Sound |
|---|---|---|---|---|
| topsoil | 0-0.5 | #5a4030 | hands, shovel | dig_soil |
| subsoil | 0.5-1.5 | #7a5a3e | shovel | dig_soil |
| cherty clay | 1.5-3 | #9a5a3a | shovel (slow), pick | dig_gravel |
| gravelly clay | 3-4.5 | #b87a46 | pick, machine | dig_gravel |
| limestone | 4.5+ | #aaa698 | pick, ripper, excavator | dig_stone |

Suggested change to `DG_LAYERS` in `engine/dig.js`: clay at 1.5 m should be the redder #9a5a3a with pale chert flecks (the current orange-brown is close), and add the yellower layer #b87a46 between clay and limestone. Let the map shift limestone upward near bluffs, caves and quarries.

## Machines and digging (`machines.js` `dig`, `machinedig.js`)
- The game's soil is 0.5 m blocks, 0.125 m3 each. A machine's `scoopBlocks` says how many blocks one bucket takes: excavator 4 (0.5 m3), mini 1, wheel loader 26 (3.2 m3, top block and loose heaps only).
- Excavator: reach 10.4 m, depth 4 m, 7.8 s per cycle. Mini: reach 5.2 m, depth 2 m, has a dozer blade. Both have `dig.poses` (boom, stick, bucket angles for each distance and depth) and `dumpPoses`; `MACHINEDIG.pose(m, dist, depth)` returns the three angles and `MACHINEDIG.scoop(...)` the full cycle clip. Tip error is under 0.12 m.
- Bucket load: show rig part `bucket_load` while carrying. Dump truck: `load_half`, `load_full` on the bed. Bulldozer: `push_pile`, `push_pile_small` on the blade; lower the blade to cut a block deep and push it, raise it to leave a pile. Dump truck holds 112 blocks (14 m3). Tipped soil becomes `spoil_heap_s/m/l` or `rubble_heap`.
- Cement mixer pours; concrete can only be broken by the excavator or a ripper. Road roller firms filled ground. Forklift carries pallets only.

## Rules for the pit pieces
See `rule` in `digging.js`: ladder size by depth, plank cover hides a hole (swap to `_broken` when something heavy crosses), stake pit on the floor is a trap, shoring stops a deep trench caving, edge markers warn, and filled graves are 0.8 by 2 m.

## Sources
USDA Pomme series: https://soilseries.sc.egov.usda.gov/OSD_Docs/P/POMME.html; NMSU ecological site pages for Ozark soils.
