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

### survivor (`assets/shaped/survivor.js`, version 3)

Every choice in the game's character creator in the cute, chunky faceted style of the user's reference lineup: a big round head (about a fifth of the height) with small oval eyes, a tiny nose, a small mouth and a hint of blush; clothes as simple boxy volumes (A-line tops, wide cap sleeves, boxy shorts); thin arms and legs with small hands and feet; hair as big rounded masses; muted warm colours. Pieces are grouped by skeleton bone. Preview: `art-tests/survivor-creator.html`.

**Fitting to the game's skeleton.** Bone names match the survivor skeleton (`pelvis`, `spine_01` to `spine_03`, `neck_01`, `Head`, `upperarm_l`, `lowerarm_l`, `hand_l`, `thigh_l`, `calf_l`, `foot_l`, `ball_l` and the `_r` side). Each bone in `bones` gives its pivot (joint) and tip (next joint) in the pack's reference pose: standing, arms down, 1.65 m tall. To fit:

1. Turn each bone's pieces so pivot to tip lines up with the game skeleton's bone.
2. Stretch them along that line to the same length.
3. Move the pivot onto the game's joint.
4. Bind every piece rigidly to its bone, so the existing walk, run, crouch, swim and death animations move it.

**Putting a survivor together:**

1. Take `parts.body[body]`, `parts.top[body][top]`, `parts.bottoms[body][bottoms]`, `parts.shoes[shoes]`, `parts.face[face]`, `parts.hair[hair]` and `parts.hat[hat]`; add `parts.gear.backpack` when the survivor carries a pack.
2. When a hat is worn, leave out pieces marked `hat: "hide"` (the hair the hat covers).
3. Apply the build: for every bone except `Head` and `neck_01`, stretch each piece with `SHAPED.scaleXZ(piece, x, z)` using the two numbers in `builds[build]`. Slim is 0.9 and 0.93, average 1 and 1, broad 1.14 and 1.08.
4. Fill the colour slots. Skin and hair colours come from `slots.SKIN` and `slots.HAIR`, in the same order as the creator's lists. Shirt, pants and second colour are the player's picks.

**Triangles.** Body (head, neck, hands) 240. A typical survivor is about 900 to 1,000; the heaviest mix of every largest option is about 1,200.

| Top | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| T-shirt | `tshirt` | 170 / 170 |
| Striped tee | `striped_tee` | 230 / 218 |
| Flannel shirt | `flannel_shirt` | 206 / 218 |
| Spotted top | `spotted_top` | 210 / 210 |
| Hoodie | `hoodie` | 218 / 218 |
| Open jacket | `open_jacket` | 168 / 168 |
| Jumper | `jumper` | 176 / 176 |
| Dungarees | `dungarees` | 180 / 180 |

| Bottoms | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| Jeans | `jeans` | 104 / 104 |
| Shorts | `shorts` | 136 / 136 |
| Cargo trousers | `cargo_trousers` | 124 / 124 |
| Capri trousers | `capri_trousers` | 136 / 136 |
| Track pants | `track_pants` | 132 / 132 |
| Rolled jeans | `rolled_jeans` | 128 / 128 |

| Shoes | Key | Triangles |
| --- | --- | --- |
| Trainers | `trainers` | 76 |
| Boots | `boots` | 140 |
| Rain boots | `rain_boots` | 140 |

| Face | Key | Triangles |
| --- | --- | --- |
| Calm | `calm` | 30 |
| Glasses | `glasses` | 68 |
| Stubble | `stubble` | 42 |
| Freckles | `freckles` | 54 |
| Tired | `tired` | 22 |
| Moustache | `moustache` | 30 |
| Dark glasses | `dark_glasses` | 56 |
| Scar | `scar` | 20 |

| Hair | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Buzzed | `buzzed` | 124 |
| Short | `short` | 120 |
| Bob | `bob` | 172 |
| Buns | `buns` | 184 |
| Beard | `beard` | 208 |

| Hat | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Cap | `cap` | 60 |
| Beanie | `beanie` | 88 |
| Helmet | `helmet` | 82 |

| Gear | Key | Triangles |
| --- | --- | --- |
| Backpack with bedroll | `backpack` | 84 |

**Notes for the game:**

- Faces are flat pieces on the front of a faceted head instead of painted textures. The survivor needs no texture at all.
- Tall boots and rain boots put pieces on the calf bone, so they move with the leg.
- Patterns (stripes, checks, spots) are thin bands and flat pieces just outside the clothing, coloured with the second colour.
- Version 1 was blocky shaped pieces. Version 2 (13 October 2026) moved to faceted low-poly with natural proportions. Version 3 (same day) follows the user's second set of references: cuter and chunkier, with the big round head. Bone names, keys and rules did not change, but the reference pose did (pivots and tips are in the pack).
