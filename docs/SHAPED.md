# Shaped content catalogue

Every shaped-piece pack made for Afterstreet, what is in it and how the game uses it. Packs are made in the art chat and handed to the main development chat. The art direction is in `docs/ART.md`.

## How a pack works

- **Builder:** `assets/shaped/shapes.js` turns a list of pieces into flat-shaded triangles as plain arrays (positions, normals, colours). It needs no 3D library, so the game's own WebGL code can use it directly. Every preview page in `art-tests/` uses the same file, so the game draws exactly what the preview shows.
- **Piece:** `{s, p, d, c, ry, ax, fy}`: shape (`box`, `bev` bevelled box, `wedge`, `cyl` 8-sided tube), centre and size in metres, colour, quarter-turns about Y, tube axis, wedge flipped. Y is up, models face +Z, a model's left is +X.
- **Triangles per shape:** box 12, bev 44, wedge 8, cyl 28.
- **Colours:** a name from the pack's `palette`, or a slot the player chooses (`SKIN`, `HAIR`, `SHIRT`, `PANTS`, `ACC`). A slot ending in `_D` is that colour times the pack's `darker` value (0.78).
- **Files:** each pack is a `.js` file that sets `window.SHAPED.<pack>`, so it loads from a drive over `file://` like the game's other assets. The generator for each pack is in `assets/shaped/src/`.

## Packs

### survivor (`assets/shaped/survivor.js`, version 1)

Every choice in the game's character creator, as shaped pieces grouped by skeleton bone. Preview: `art-tests/survivor-creator.html`.

**Fitting to the game's skeleton.** Bone names match the survivor skeleton (`pelvis`, `spine_01` to `spine_03`, `neck_01`, `Head`, `upperarm_l`, `lowerarm_l`, `hand_l`, `thigh_l`, `calf_l`, `foot_l`, `ball_l` and the `_r` side). Each bone in `bones` gives its pivot (joint) and tip (next joint) in the pack's reference pose: standing, arms down, 1.85 m to the top of a hat. To fit:

1. Turn each bone's pieces so pivot to tip lines up with the game skeleton's bone.
2. Stretch them along that line to the same length.
3. Move the pivot onto the game's joint.
4. Bind every piece rigidly to its bone, so the existing walk, run, crouch, swim and death animations move it.

**Putting a survivor together:**

1. Take `parts.body[body]`, `parts.top[body][top]`, `parts.bottoms[body][bottoms]`, `parts.shoes[shoes]`, `parts.face[face]`, `parts.hair[hair]` and `parts.hat[hat]`; add `parts.gear.backpack` when the survivor carries a pack.
2. When a hat is worn, leave out hair pieces whose centre height is above `hatLine` (1.63 m).
3. Apply the build: for every bone except `Head` and `neck_01`, multiply each piece's X position and width by the first number in `builds[build]`, and Z position and depth by the second. Slim is 0.9 and 0.93, average 1 and 1, broad 1.12 and 1.06.
4. Fill the colour slots. Skin and hair colours come from `slots.SKIN` and `slots.HAIR`, in the same order as the creator's lists. Shirt, pants and second colour are the player's picks.

**Triangles.** Body (head, neck, hands) 220. A typical survivor is about 1,500 to 1,800; the heaviest mix of every largest option is about 2,100.

| Top | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| T-shirt | `tshirt` | 368 / 368 |
| Striped tee | `striped_tee` | 484 / 484 |
| Flannel shirt | `flannel_shirt` | 468 / 468 |
| Spotted top | `spotted_top` | 476 / 476 |
| Hoodie | `hoodie` | 436 / 436 |
| Open jacket | `open_jacket` | 408 / 408 |
| Jumper | `jumper` | 456 / 456 |
| Dungarees | `dungarees` | 496 / 496 |

| Bottoms | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| Jeans | `jeans` | 268 / 268 |
| Shorts | `shorts` | 356 / 356 |
| Cargo trousers | `cargo_trousers` | 292 / 292 |
| Capri trousers | `capri_trousers` | 380 / 380 |
| Track pants | `track_pants` | 316 / 316 |
| Rolled jeans | `rolled_jeans` | 356 / 356 |

| Shoes | Key | Triangles |
| --- | --- | --- |
| Trainers | `trainers` | 272 |
| Boots | `boots` | 336 |
| Rain boots | `rain_boots` | 312 |

| Face | Key | Triangles |
| --- | --- | --- |
| Calm | `calm` | 60 |
| Glasses | `glasses` | 192 |
| Stubble | `stubble` | 72 |
| Freckles | `freckles` | 156 |
| Tired | `tired` | 76 |
| Moustache | `moustache` | 84 |
| Dark glasses | `dark_glasses` | 96 |
| Scar | `scar` | 108 |

| Hair | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Buzzed | `buzzed` | 80 |
| Short | `short` | 88 |
| Bob | `bob` | 188 |
| Buns | `buns` | 192 |
| Beard | `beard` | 160 |

| Hat | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Cap | `cap` | 68 |
| Beanie | `beanie` | 132 |
| Helmet | `helmet` | 80 |

| Gear | Key | Triangles |
| --- | --- | --- |
| Backpack with bedroll | `backpack` | 140 |

**Notes for the game:**

- Faces are now pieces instead of painted textures. The survivor needs no texture at all.
- Tall boots and rain boots put pieces on the calf bone, so they move with the leg.
- Patterns (stripes, checks, spots) are thin pieces just outside the clothing, coloured with the second colour.
