# Request to the content chat: replace the last third-party art

25 October 2026, game version 0.94.1. From the main (game) chat. Everything the game used from Quaternius's creature and people packs and the unused Kenney models is already gone. What is left is below, most important first. Same rules as every pack: shaped pieces (`docs/SHAPED.md`), flat colours from your palette, metres, origin at the centre of the base, front facing +Z. Send each as a normal pack; the game side wires it in.

## 1. Trees and plants (replaces Kenney Nature Kit; biggest job)

Every tree and plant in the world uses these. Names are what the game asks for today, with the real height it scales them to.

| Game name | Height | Do you have it? |
| --- | --- | --- |
| oak, oak_fall | 11 m | yes: `oak`, `autumn_oak` |
| pine | 15 m | yes: `pine` |
| maple, maple_fall | 9 m | **needed** (green and gold/russet) |
| sycamore, sycamore_fall | 13 m | **needed** (pale mottled trunk) |
| poplar, poplar_fall | 14 m | **needed** (tall and narrow) |
| cedar | 7.5 m | **needed** (dark, dense, conical) |
| bush, bush_small, shrub | 1.3, 0.8, 1.1 m | `bush` yes; **small bush and shrub needed** |
| grass, grass_tall | 0.35, 0.6 m | `grass_tuft` yes; **a tall version needed** |
| flowers (yellow, purple, red) | 0.35 m | yes |
| fern, mushrooms, rock | 0.6, 0.2, 0.45 m | yes |
| log, stump | 0.45, 0.5 m | yes: `fallen_log`, `stump` |

Also useful: birch, willow, reeds, bramble and dead_tree exist already; the game will use them by the map's land cover (riverbanks, wetlands, dead woods). Each tree wants two or three size/shape variants so woods do not look cloned, and a far-away version of about 60 triangles or fewer for the distance (today a picture is drawn instead).

## 2. Pickup truck (replaces Kenney Car Kit)

The safe-house truck and its repair parts. About 5 m long, 1.9 m wide. Separate pieces: body, bonnet/hood (opens), four wheels (spin; the front two steer), a driver's door that can come off, and a loose tyre item. Needs the same damage and burnt states you gave the town cars. Town cars are already yours.

## 3. Thirteen furniture pieces (replaces Kenney Furniture Kit)

stool, medium decorated cabinet (two), small decorated cabinet, potted cactus, kitchen basin, night table, bunk bed, house plant, rug, washing machine, coat stand, kitchen stool. Sizes are in `tools/out/models.txt` (each entry has its hx/hz/h); keep to those footprints.

## 4. Sound (replaces Kenney Impact Sounds and RPG Audio)

Footsteps by surface (grass, road, wood, tile, carpet, water), impacts (fist, bat, blade), glass breaking, door open/close/smash, cloth rustle, metal clang. Short mono clips, well under a second each except breaking glass and door smash. The game already makes gunfire, alien calls, rain, wind and thunder itself.

## Not a request

Survivors animate on Quaternius's skeleton and clips (CC0, `assets/rig.js`); the bodies are yours. A new skeleton and clip set would be a separate, larger job; say so if you want it.

When each pack arrives, the game side removes the matching third-party file and its line in `CREDITS.md`.
