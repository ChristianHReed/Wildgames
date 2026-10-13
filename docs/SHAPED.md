# Shaped content catalogue

Every shaped-piece pack made for Afterstreet, what is in it and how the game uses it. Packs are made in the art chat and handed to the main development chat. The art direction is in `docs/ART.md`.

## How a pack works

- **Builder:** `assets/shaped/shapes.js` turns a list of pieces into flat-shaded triangles as plain arrays (positions, normals, colours). It needs no 3D library, so the game's own WebGL code can use it directly. Every preview page in `art-tests/` uses the same file, so the game draws exactly what the preview shows.
- **Pieces:** every piece has a shape `s`, a position `p` in metres and a colour `c`. Y is up, models face +Z, a model's left is +X. The full rules are at the top of `shapes.js`.
  - Block shapes: `box`, `bev` (bevelled box), `wedge`, `cyl` (8-sided tube). Triangles: 12, 44, 8, 28.
  - Faceted shapes, used for characters: `loft` (a faceted tube or open shell through rings, for heads, limbs, torsos, hair and clothes), `decal` (one flat polygon for eyes, brows, lips, stripes and patches) and `poly` (a small solid such as a nose or a cap brim).
- **Colours:** a name from the pack's `palette`, or a slot the player chooses (`SKIN`, `HAIR`, `SHIRT`, `PANTS`, `ACC`). A slot ending in `_D` is that colour times the pack's `darker` value (0.78). `HAIR_MIX` is skin blended towards hair by `mix` (0.55), used for stubble.
- **Files:** each pack is a `.js` file that sets `window.SHAPED.<pack>`, so it loads from a drive over `file://` like the game's other assets. The generator for each pack is in `assets/shaped/src/`.

## Packs

### survivor (`assets/shaped/survivor.js`, version 2)

Every choice in the game's character creator in the faceted low-poly style: natural slender proportions with a slightly large head, flat planes, simple faces (dark eyes with no whites, a wedge nose, brows, small lips), chunky hair with blunt cuts, and muted colours. Pieces are grouped by skeleton bone. Preview: `art-tests/survivor-creator.html`.

**Fitting to the game's skeleton.** Bone names match the survivor skeleton (`pelvis`, `spine_01` to `spine_03`, `neck_01`, `Head`, `upperarm_l`, `lowerarm_l`, `hand_l`, `thigh_l`, `calf_l`, `foot_l`, `ball_l` and the `_r` side). Each bone in `bones` gives its pivot (joint) and tip (next joint) in the pack's reference pose: standing, arms down, 1.78 m tall. To fit:

1. Turn each bone's pieces so pivot to tip lines up with the game skeleton's bone.
2. Stretch them along that line to the same length.
3. Move the pivot onto the game's joint.
4. Bind every piece rigidly to its bone, so the existing walk, run, crouch, swim and death animations move it.

**Putting a survivor together:**

1. Take `parts.body[body]`, `parts.top[body][top]`, `parts.bottoms[body][bottoms]`, `parts.shoes[shoes]`, `parts.face[face]`, `parts.hair[hair]` and `parts.hat[hat]`; add `parts.gear.backpack` when the survivor carries a pack.
2. When a hat is worn, leave out pieces marked `hat: "hide"` (the hair the hat covers).
3. Apply the build: for every bone except `Head` and `neck_01`, stretch each piece with `SHAPED.scaleXZ(piece, x, z)` using the two numbers in `builds[build]`. Slim is 0.9 and 0.93, average 1 and 1, broad 1.12 and 1.06.
4. Fill the colour slots. Skin and hair colours come from `slots.SKIN` and `slots.HAIR`, in the same order as the creator's lists. Shirt, pants and second colour are the player's picks.

**Triangles.** Body (head, neck, hands) 292. A typical survivor is about 1,300 to 1,600; the heaviest mix of every largest option is about 1,800.

| Top | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| T-shirt | `tshirt` | 317 / 333 |
| Striped tee | `striped_tee` | 413 / 413 |
| Flannel shirt | `flannel_shirt` | 338 / 370 |
| Spotted top | `spotted_top` | 337 / 353 |
| Hoodie | `hoodie` | 354 / 370 |
| Open jacket | `open_jacket` | 300 / 316 |
| Jumper | `jumper` | 356 / 372 |
| Dungarees | `dungarees` | 295 / 311 |

| Bottoms | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| Jeans | `jeans` | 274 / 274 |
| Shorts | `shorts` | 350 / 350 |
| Cargo trousers | `cargo_trousers` | 294 / 294 |
| Capri trousers | `capri_trousers` | 350 / 350 |
| Track pants | `track_pants` | 318 / 318 |
| Rolled jeans | `rolled_jeans` | 306 / 306 |

| Shoes | Key | Triangles |
| --- | --- | --- |
| Trainers | `trainers` | 196 |
| Boots | `boots` | 288 |
| Rain boots | `rain_boots` | 288 |

| Face | Key | Triangles |
| --- | --- | --- |
| Calm | `calm` | 16 |
| Glasses | `glasses` | 54 |
| Stubble | `stubble` | 52 |
| Freckles | `freckles` | 34 |
| Tired | `tired` | 20 |
| Moustache | `moustache` | 28 |
| Dark glasses | `dark_glasses` | 58 |
| Scar | `scar` | 18 |

| Hair | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Buzzed | `buzzed` | 150 |
| Short | `short` | 182 |
| Bob | `bob` | 162 |
| Buns | `buns` | 238 |
| Beard | `beard` | 258 |

| Hat | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Cap | `cap` | 50 |
| Beanie | `beanie` | 70 |
| Helmet | `helmet` | 82 |

| Gear | Key | Triangles |
| --- | --- | --- |
| Backpack with bedroll | `backpack` | 84 |

**Notes for the game:**

- Faces are flat pieces on the front of a faceted head instead of painted textures. The survivor needs no texture at all.
- Tall boots and rain boots put pieces on the calf bone, so they move with the leg.
- Patterns (stripes, checks, spots) are thin bands and flat pieces just outside the clothing, coloured with the second colour.
- Version 2 replaced the blocky version 1 on 13 October 2026, after the user chose the faceted reference style.
