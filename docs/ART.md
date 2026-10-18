# Afterstreet's look: faceted models, cozy days, scary nights

Chosen on 13 October 2026 after two rounds of test scenes; the model style was updated the same day to faceted low-poly from the user's reference images. This page tells the main build what the look is and how the test scenes make it, so it can be brought into the game step by step. The full art guide (palette rows, budgets, model conventions) lives in the claude.ai Project as "Voxel art guide".

Reference scene: `art-tests/voxel-test-street-2.html` (https://christianhreed.github.io/Wildgames/art-tests/voxel-test-street-2.html). It uses three.js from a CDN. The game draws with its own WebGL code and runs offline, so the methods below have to be ported, not copied.

## The look in one table

| Part | What it is | Breakable |
| --- | --- | --- |
| Survivors, aliens, items, furniture, vehicles, street props, trees | **Faceted low-poly**: flat planes, flat shading, few colours, natural proportions (see Model style below) | No |
| Buildings | **12.5 cm blocks** near the player; 25 cm further out; 50 cm past twice that | Yes |
| Ground | **Smooth hills with sharp drops**: smooth slopes inside each area, hard edges where areas meet (kerbs, creek and river banks, ravines) | No |
| Light and mood | **Cozy days, scary nights** | — |

## Model style (from the user's references, 13 October 2026)

- **Forms:** faceted low-poly with clearly visible flat planes and flat shading. Few colours per object; no outlines; no busy textures.
- **People:** tall and lean (1.80 m) in a relaxed stance (head forward, soft knees, bent elbows, arms away from the body); a carved head slightly larger than life, with a brow shelf, eyes set back, a nose grown from the brow and an angled jaw; sweaters and jackets as big angular volumes, rolled sleeves; long thin arms with paddle hands or gloves; slim trousers tapering to the ankle; chunky ankle boots; chunky swept or straight hair; tall packs with a bedroll, caps, rectangular glasses, scarves. References: lean wanderer art, a capped girl in a bulky sweater, Somerville (Jumpship).
- **Colour:** muted and slightly desaturated: charcoal, teal, rust, olive, sand, faded denim. One accent colour at most.
- **Vehicles:** boxy 1970s to 1990s cars, vans, buses, RVs and trucks, worn and rusty, with cracked glass and doors, bonnet and boot that open. Simple interiors.
- **Places:** cluttered streets (tyres, crates, barriers, fences, dumpsters), hazy fog, warm light from lamps, windows and car interiors at night.
- **Destruction:** rubble as irregular slabs, bricks, planks and broken concrete, not cubes.

## Low-poly character craft

Learned 13 October 2026 after the user asked for characters that match the references. The full rules and sources are in the Voxel art guide; the short version:

1. **Silhouette and gesture first.** Judge the black shape front and side before any detail. Carve negative space (arm to body, between the legs). Never bolt upright: a gentle S-curve, head forward, soft knees, bent elbows, sloping shoulders.
2. **Big, medium, small.** One big mass (coat, sweater, pack), a few medium (head and hair, boots, hands), small accents. Exaggerate: chunky hair, big boots, wide cuffs, trouser hems stacked over boots. Taper every limb.
3. **Planes, not tubes.** Shaped cross-sections (flat chest front, shoulder blades, jaw corners), few large facets of even size, ragged hems and hair edges.
4. **Carved faces.** Brow shelf, eyes set back as small dark shapes, nose grown from the brow, jaw angled to a narrow chin. Hair in two or three big clumps that break the skull's outline.
5. **Costume at the joints.** Contrast at cuffs, collars, belts and boot tops. One dark, one mid, one light, one accent.
6. **Colour and light.** Strict muted palette, flat shading only, a soft painted tone (darker towards the feet, small facet variation; `SHAPED.build` `tone` option), and diorama lighting: warm key, coloured fill, cool rim from behind.

### Characters in motion (Jumpship)

From "Developing Character @ Jumpship" (Somerville): characters must read at any camera distance through negative space and costume accents at the joints. For our rigid-part survivors this means:

- Keep clothes close to the body so limbs never merge with it.
- Put a contrasting cap on every elbow and knee. It shows the bend, and it hides the seam between rigid parts.
- Stretch fast-swinging limbs a little (smears, pack `smear` values).
- Let head and chest look around on their own layer.

Check every character in run and walk frames, not only standing.

## Shaped pieces

- A model is a short list of pieces (see the top of `assets/shaped/shapes.js`). Characters use faceted shapes: `loft` tubes and shells, flat `decal` details and small `poly` solids. A survivor is about 1,300 to 1,600 triangles (2,190 at most).
- Pieces are merged into one mesh per model with flat normals and vertex colours. Glowing pieces (lamps, lit screens, alien eyes) go in a second mesh that ignores lighting.
- Characters keep rigid parts on the existing animation skeleton: each bone gets its own small group of pieces.

## Breakable buildings

- Each building is a grid of 12.5 cm blocks (8 per metre) filled from its type rules, the same way `docs/BUILDINGS.md` lays out walls, floors, windows and trim. A two-storey brick house is about 56 × 56 × 48 blocks.
- Meshing: one mesh per 4 m chunk. Faces between two solid blocks are skipped. Each corner gets ambient occlusion from its three neighbours, stored in the vertex colour. Only changed chunks are rebuilt.
- Glass is its own mesh so windows can glow at night.
- Detail by distance: within the switch distance (14 m in the test, 18 m on phones) the building shows 12.5 cm blocks. Beyond that, a 25 cm version is used, and past twice the distance a 50 cm one. Each coarse block takes the most common colour of the small blocks inside it, and is solid when at least 30% of them are.
- Breaking removes blocks in a 45 cm sphere. A flood fill from the bottom layer finds blocks that are no longer held up, and those fall.
- Rubble: broken blocks fly out, land on the ground or on floors and sills, and stay. The test keeps up to 6,000 rubble pieces as one instanced mesh.
- Test numbers on the user's iPhone: 60 FPS with about 362,000 blocks, 145,000 triangles and 42 draw calls, shadows on.

- Stress test: `art-tests/voxel-stress-test.html` (https://christianhreed.github.io/Wildgames/art-tests/voxel-stress-test.html) builds these blocks for a real Springfield square (2,849 buildings) in the game's own kind of WebGL, at the game's view distances, and drives the same street three times: today's buildings, blocks near you (this plan) and all blocks. It reports frame rate, the worst moments, pauses, triangles, draw calls, block and graphics memory, and how long building took. Run it on the weakest device the game should support before Art 5. In the test browser (software graphics, so only the comparison counts) blocks near you drew about 4–9 times the triangles of today's buildings and held about 160 MB of graphics memory on the safe-house street.

## Ground

- Every area (road, sidewalk, lawn, verge, creek bed, hill) has its own height rule. Inside an area the ground is smooth triangles every 50 cm. Where two areas meet at different heights, a vertical face fills the gap.
- Kerbs: 15 cm, concrete. Creek and ravine banks: earth on top, stone lower down, about 1 m deep in the test.
- Water is a flat surface at its own level, with rocks and reeds as shaped pieces.

## Cozy days, scary nights

**In the game from 0.41 (Art 1).** `MOODK` in `play.html` holds the keys below; `drawSky` draws the sky gradient, sun, moon and stars. Two changes from the test street, for a whole town: by day the fog is a light haze (it reaches about 28% at the far distance in the table) so the town still shows to the draw distance, and at night lamp light, the flashlight beam and lit windows thin the dark fog so they read from afar. Alien eyes are found automatically in every animation frame of each creature model (the front of the top fifth, near the middle). Still to do: ground-floor windows are real openings, so a lit one shows only a glowing frame until the block buildings (Art 5) give them a lit room or glass.

Time-of-day keys used in the test (colours in hex):

| Time | Sky top / horizon and fog | Fog distance | Sun or moon | Lamps, windows | Screen edges |
| --- | --- | --- | --- | --- | --- |
| 00:00 night | 03050a / 0d1420 | 5–30 m | moon 7f9ccc, 0.24 | on, on | dark (0.6) |
| 05:00 pre-dawn | 0b1222 / 2b2c40 | 10–45 m | moon 8ea2c8, 0.3 | on, mostly on | 0.45 |
| 06:30 dawn | 5f7aa0 / f2bb8e | 30–85 m | sun ffb27a, 1.3 | fading | 0.1 |
| 09:00 day | 5f97d0 / d3e4ec | 45–115 m | sun fff2da, 2.3 | off | none |
| 16:00 afternoon | 6a9bd0 / e2e2d8 | 45–110 m | sun ffe8c4, 2.2 | off | none |
| 18:30 golden hour | 6f80aa / ffbe80 | 35–90 m | sun ffa45a, 1.9 | half | 0.12 |
| 20:00 dusk | 18213a / 4e4566 | 16–58 m | moon 9db0de, 0.45 | on | 0.4 |

Night rules:

- Street lamps are real warm lights (ffc477), at most a handful near the player on phones. One lamp in a street may flicker.
- Only some windows light up: warm in lived-in homes, cold and flickering in abandoned shops. A lit window still draws aliens (0.35).
- Alien eyes glow green and carry a small green light.
- Stars come out and the edges of the screen darken.

## References

Townscaper (windows lighting up, warm sunsets), Minecraft Vibrant Visuals (golden sunsets, long shadows), Shadows of Doubt (a tense voxel city with small palettes), Teardown (mood from lighting; glowing blocks need placed lights), Vintage Story temporal storms (fog and colour that make a familiar place feel wrong), and 7 Days to Die, Valheim, The Long Dark and Darkwood for nights that are shorter-sighted and more dangerous. Sources are listed in the Voxel art guide.
