# Afterstreet's look: faceted models, cozy days, scary nights

Chosen on 13 October 2026 after two rounds of test scenes; the model style was updated the same day to faceted low-poly from the user's reference images. This page tells the main build what the look is and how the test scenes make it, so it can be brought into the game step by step. The full art guide (palette rows, budgets, model conventions) lives in the claude.ai Project as "Voxel art guide".

Reference scene: `art-tests/voxel-test-street-2.html` (https://christianhreed.github.io/Wildgames/art-tests/voxel-test-street-2.html). It uses three.js from a CDN. The game draws with its own WebGL code and runs offline, so the methods below have to be ported, not copied.

## The look in one table

| Part | What it is | Breakable |
| --- | --- | --- |
| Survivors, aliens, items, furniture, vehicles, street props, trees | **Faceted low-poly**: flat planes, flat shading, few colours, natural proportions (see Model style below) | No |
| Buildings | **Framed**: a visible frame of posts and beams with infill panels set back (18 October 2026; replaces the 12.5 cm block plan) | Yes, bay by bay |
| Ground | **Smooth hills with sharp drops**: smooth slopes inside each area, hard edges where areas meet (kerbs, creek and river banks, ravines) | No |
| Light and mood | **Cozy days, scary nights** | — |

## Model style (from the user's references, 13 October 2026)

- **Forms:** faceted low-poly with clearly visible flat planes and flat shading. Few colours per object; no outlines; no busy textures.
- **People (version 7, 18 October 2026, from the user's Kentucky Route Zero-style lineup):** silhouette first. Square shoulders and a torso that is one wedge narrowing to the waist; arms that taper from the shoulder to a pointed hand; long straight legs like columns; small dark block feet; a small head with a sharp profile and no eyes; hair as one or two flat angular masses; every colour one big flat plane. Costume accents at the joints (collars, cuffs, belts, rolled hems).
- **Aliens:** the survivors' language turned wrong: flat planes and points, joints that bend the wrong way, knees above the body, heads too small, spikes and blades; drab bodies with glowing eyes and vents.
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

## Fewest vertices (18 October 2026)

How every model is kept cheap, from the research in the art guide:

- **Rectangular cross-sections.** A tube with four corners whose rings are lined up keeps every side flat, so each side is one face: 4 vertices, not 6.
- **Points, not caps.** Limbs, claws, spikes and plants end in a point.
- **No hidden faces.** No cap where a piece ends inside another; no ears, no eye shapes on survivors.
- **Detail as colour.** Stripes, seams, rust and window bars are flat colour on an existing face.
- **Share corners.** Draw with `SHAPED.buildIndexed` (each flat face shares its corners) or, with a shader that works out face normals, `SHAPED.weld` (corners shared by position and colour).
- **Result:** the heaviest survivor fell from 2,185 triangles and 6,555 vertices (version 6) to 817 triangles and 566 welded vertices. Aliens are 190 to 330 triangles, against 2,000 to 4,800 for the Bestiary stand-ins.

## Framed buildings (18 October 2026, replacing the 12.5 cm block plan)

The user asked for a framed design. Each building is a grid of bays, 2.4 m wide and 3 m tall (one storey):

- **Frame and infill.** Each bay is a frame (a post on its left edge and a beam on top) and an infill panel between them: plain, siding or brick wall, window, door, shopfront, garage, boarded window or nothing.
- **Depth.** The frame stands 6 cm proud of the infill, so walls show the structure as a grid of shadow lines, and windows and doors sit back in the wall.
- **Breaking.** Infill panels break first: the panel falls as rubble chunks and leaves the empty frame, showing the floors inside. Frames break last, and when a post goes, the bays above it fall. Damage is saved per bay.
- **Cost.** A two-storey house is about 1,900 triangles, a four-storey block of flats about 5,300.
- **Placing.** Footprints come from map data. Each edge is split into 2.4 m bays, stretched slightly when an edge does not divide evenly. Infill is chosen by the building's type rules (`docs/BUILDINGS.md`), then corner posts and a flat or gable roof go on.
- **Colours.** Each building has four colours: wall, trim, frame and roof.
- **Kit and rules:** `assets/shaped/buildings.js` and `docs/SHAPED.md`.

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
