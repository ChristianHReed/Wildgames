# Shaped content catalogue

Every shaped-piece pack made for Afterstreet, what is in it and how the game uses it. Packs are made in the art chat and handed to the main development chat. The art direction is in `docs/ART.md`.

## How a pack works

- **Builder:** `assets/shaped/shapes.js` turns a list of pieces into flat-shaded triangles as plain arrays (positions, normals, colours). It needs no 3D library, so the game's own WebGL code can use it directly. Every preview page in `art-tests/` uses the same file, so the game draws exactly what the preview shows.
- **Pieces:** every piece has a shape `s`, a position `p` in metres and a colour `c`. Y is up, models face +Z, a model's left is +X. The full rules are at the top of `shapes.js`.
  - Block shapes: `box`, `bev` (bevelled box), `wedge`, `cyl` (8-sided tube). Triangles: 12, 44, 8, 28.
  - Faceted shapes, used for characters: `loft` (a faceted tube or open shell through rings, for heads, limbs, torsos, hair and clothes; a ring can shape each corner, for a jutting brow or a hem that dips at the back), `decal` (one flat polygon for eyes, brows, lips, stripes and patches) and `poly` (a small solid such as a nose or a cap brim).
- **Colours:** a name from the pack's `palette`, or a slot the player chooses (`SKIN`, `HAIR`, `SHIRT`, `PANTS`, `ACC`). A slot ending in `_D` is that colour times the pack's `darker` value (0.78). `HAIR_MIX` is skin blended towards hair by `mix` (0.55), used for stubble.
- **Soft tone:** characters are built with `SHAPED.build(pieces, colourOf, out, {tone: pack.tone, oy: bone pivot height})`. This darkens the model slightly towards the feet and gives each facet a fixed small brightness change, the painted look from the craft rules in `docs/ART.md`. The game should build the same way.
- **Files:** each pack is a `.js` file that sets `window.SHAPED.<pack>`, so it loads from a drive over `file://` like the game's other assets. The generator for each pack is in `assets/shaped/src/`.

## Packs

### survivor (`assets/shaped/survivor.js`, version 6)

Every choice in the game's character creator, rebuilt on the low-poly character craft rules (see `docs/ART.md`): tall lean adults in a relaxed stance (head forward, soft knees, bent elbows, arms held away from the body); a carved head with a brow shelf, eyes set back, a nose grown from the brow and an angled jaw; chunky hair clumps with ragged edges; tops that flare at the hem and dip at the back; slim clothes that keep negative space around the limbs, with a contrasting cap on every elbow and knee (Jumpship's costume accents at the joints; the caps also hide the seams between rigid parts); tapered limbs with cuffs, rolled sleeves and trouser hems stacked over chunky boots; a tall pack with a bedroll and bottle; muted teal, navy, rust, mustard and plum. Pieces are grouped by skeleton bone. Preview: `art-tests/survivor-creator.html`.

**Fitting to the game's skeleton.** Bone names match the survivor skeleton (`pelvis`, `spine_01` to `spine_03`, `neck_01`, `Head`, `upperarm_l`, `lowerarm_l`, `hand_l`, `thigh_l`, `calf_l`, `foot_l`, `ball_l` and the `_r` side). Each bone in `bones` gives its pivot (joint) and tip (next joint) in the pack's reference pose: standing relaxed with arms a little away from the body and elbows and knees slightly bent, 1.80 m tall. To fit:

1. Turn each bone's pieces so pivot to tip lines up with the game skeleton's bone.
2. Stretch them along that line to the same length.
3. Move the pivot onto the game's joint.
4. Bind every piece rigidly to its bone, so the existing walk, run, crouch, swim and death animations move it.

**Putting a survivor together:**

1. Take `parts.body[body]`, `parts.top[body][top]`, `parts.bottoms[body][bottoms]`, `parts.shoes[shoes]`, `parts.face[face]`, `parts.hair[hair]` and `parts.hat[hat]`. Add `parts.gear.backpack` when the survivor carries a pack, and `parts.gear.scarf` for a scarf. For gloves, replace the hand pieces with `parts.gear.gloves`. Scarf and gloves are new extras the creator does not offer yet.
2. When a hat is worn, leave out pieces marked `hat: "hide"` (the hair the hat covers).
3. Apply the build: for every bone except `Head` and `neck_01`, stretch each piece with `SHAPED.scaleXZ(piece, x, z)` using the two numbers in `builds[build]`. Slim is 0.9 and 0.93, average 1 and 1, broad 1.14 and 1.08.
4. Smears: while a limb swings fast, stretch its bone along its length by up to `smear.max` (14%) for the bones in `smear.bones`, scaled by swing speed (`smearRule`).
5. Fill the colour slots. Skin and hair colours come from `slots.SKIN` and `slots.HAIR`, in the same order as the creator's lists. Shirt, pants and second colour are the player's picks.

**Triangles.** Body (head, neck, hands) 304. A typical survivor is about 1,300 to 1,600; the heaviest mix of every largest option with pack, scarf and gloves is about 2,190, inside the 2,200 phone budget.

| Top | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| T-shirt | `tshirt` | 429 / 429 |
| Striped tee | `striped_tee` | 509 / 509 |
| Flannel shirt | `flannel_shirt` | 494 / 494 |
| Spotted top | `spotted_top` | 449 / 449 |
| Hoodie | `hoodie` | 488 / 488 |
| Open jacket | `open_jacket` | 460 / 460 |
| Jumper | `jumper` | 448 / 448 |
| Dungarees | `dungarees` | 425 / 429 |

| Bottoms | Key | Triangles (masculine / feminine) |
| --- | --- | --- |
| Jeans | `jeans` | 292 / 292 |
| Shorts | `shorts` | 356 / 356 |
| Cargo trousers | `cargo_trousers` | 312 / 312 |
| Capri trousers | `capri_trousers` | 324 / 324 |
| Track pants | `track_pants` | 304 / 304 |
| Rolled jeans | `rolled_jeans` | 356 / 356 |

| Shoes | Key | Triangles |
| --- | --- | --- |
| Trainers | `trainers` | 104 |
| Boots | `boots` | 168 |
| Rain boots | `rain_boots` | 168 |

| Face | Key | Triangles |
| --- | --- | --- |
| Calm | `calm` | 10 |
| Glasses | `glasses` | 32 |
| Stubble | `stubble` | 58 |
| Freckles | `freckles` | 22 |
| Tired | `tired` | 14 |
| Moustache | `moustache` | 22 |
| Dark glasses | `dark_glasses` | 32 |
| Scar | `scar` | 12 |

| Hair | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Buzzed | `buzzed` | 146 |
| Short | `short` | 146 |
| Bob | `bob` | 194 |
| Buns | `buns` | 178 |
| Beard | `beard` | 254 |

| Hat | Key | Triangles |
| --- | --- | --- |
| None | `none` | 0 |
| Cap | `cap` | 118 |
| Beanie | `beanie` | 178 |
| Helmet | `helmet` | 142 |

| Gear | Key | Triangles |
| --- | --- | --- |
| Tall pack with bedroll and mat | `backpack` | 206 |
| Scarf | `scarf` | 64 |
| Gloves (replace the hands) | `gloves` | 88 |

**Notes for the game:**

- Faces are flat pieces on the front of a faceted head instead of painted textures. The survivor needs no texture at all.
- Tall boots and rain boots put pieces on the calf bone, so they move with the leg.
- Patterns (stripes, checks, spots) are thin bands and flat pieces just outside the clothing, coloured with the second colour.
- Version 1 was blocky shaped pieces. Version 2 (13 October 2026) moved to faceted low-poly with natural proportions. Version 3 (same day) was cuter and chunkier. Version 4 (same day) was rebuilt from scratch, with none of the earlier meshes, on the user's latest references: lean and tall. Bone names, keys and rules are unchanged; the reference pose changed (pivots and tips are in the pack).
