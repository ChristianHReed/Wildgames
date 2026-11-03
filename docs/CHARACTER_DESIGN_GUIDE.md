# Character design guide and the v8 survivor rework (content chat, 2 November 2026)

Written from three references the user supplied (a painterly game screenshot with a woman in a sash skirt and an old man in a fur mantle, a flat vector lineup of three men, and a faceted low-poly woman), plus a short read of general character-design guidance ([80.lv: shape language and readability](https://80.lv/articles/character-design-shape-language-and-readability/)).

## What the references teach
- **Painterly pair:** layered, asymmetric clothing (a mantle over one shoulder, a sash tied at one hip, wrapped forearms), heavy boots with visible cuffs, a face reduced to hair, a head wrap and a beard. The outfit tells you who they are before the face does. Hands and feet are bigger than real life.
- **Vector lineup:** three bodies from one plan, differing in silhouette. A big numeral and colour-blocked sleeves identify the first, a space suit the third. Every shape is simple, hands are large, there are two or three colours per figure and a dark belt with a bright buckle ties the waist.
- **Low-poly woman:** a few big hair planes in two hues, a face made of facets with a clear brow, nose and mouth, a jacket that is darker than the top under it, and one accent (a yellow belt buckle) that pulls the eye to the middle.

## Rules for the survivors
1. **Silhouette first.** The outline must say who it is at 20 m: hat or hair mass, shoulder line, hem length, bulky or slim.
2. **Big, medium, small shapes.** Head and torso are big, limbs and layers medium, buckles, cuffs and pockets small. Put detail only where the eye should land (face, hands, belt).
3. **Proportions are stylised.** A bigger head, bigger hands and boots, thicker limbs. Real proportions read as generic at game distance.
4. **Faces carry a hint.** Brow, nose, eyes and mouth are tiny but give every head a direction to look and an age.
5. **Colour:** about 60% one body colour, 30% a second, 10% a bright accent (brass buckle, orange sleeve, coloured hair). The torso is lighter or more saturated than the legs. Keep skin and hair in the creator slots so players can change them.
6. **Layer and asymmetry.** Wearing something on one side only (sash, mantle, bag) reads as hand-made and personal.
7. **Costume tells the story.** Wraps, knee pads, mantles, jerseys say what this person did before.
8. **Low triangle count.** Flat faces, rectangular frustums, colour instead of extra solids. The heaviest mix is still under 900 triangles.

## What changed (assets/shaped/src/survivor.py, now version 8)
- The skeleton and every clip are unchanged, so all animations, held items and rigs still work.
- **Head:** scaled 1.42 wide and 1.2 tall about the base of the skull, with a nose wedge, eye slits, a brow band and a mouth on the stock head. Hair, hats, faces and the NPC head parts follow.
- **Neck** is 30% thicker, **limbs** 40% thicker (limb factor 0.8 to 1.12), **hands** are blunt mitts with a thumb, **shoulders** are a little broader.
- **Boots and shoes** are chunkier and longer, boots have a cuff band, rain boots are fuller.
- **Value contrast:** the tone ramp goes from 0.74 at the feet to 1.08 at the head (it was 0.8 to 1.04). The belt buckle is brass and bigger.
- The Workshop survivors pack (`make_survivors.js`) scales every head piece it builds itself the same way.

## New parts (pack `afterstreet-survivors`, now 60 parts and 11 looks)
| Slot | Name | From |
| --- | --- | --- |
| top | `jersey` | the vector lineup: torso colour, forearms in the accent colour, a numeral 8 on the chest, side panels |
| worn | `mantle` | the painterly pair: a shoulder cape with a fur collar and a ragged hem |
| worn | `crop_jacket` | the low-poly woman: waist-length green jacket with collar wedges and a brass zip |
| bottoms | `wrap_skirt` | the painterly pair: short skirt with a wide sash knotted at the left hip |
| gear | `bracers` | the painterly pair: leather forearm wraps with straps and a buckle |

New looks (player characters): `runner` (jersey, beard, work pants), `outcast` (mantle, bracers, wrap skirt, bandana, braids) and `streetwise` (orange tank top, crop jacket, long hair).

## For the main chat
- No game change is needed: the creator reads `survivor.choices`, and the new parts and looks arrive through the pack as before.
- Heads are bigger, so any code that placed things relative to the old head (name tags, helmets, headlamp, first-person camera at the eyes) should be checked. The eye line is still near y = 1.67.
- The creator preview and the album scenes `survivors`, `survivors_new` and `survivors_refs` show the result.

## Not done
- A taller leg-to-head change (shorter legs) needs the skeleton changed; the figures are still tall (about 7 heads) compared with the vector reference (about 5.5).
- Hair is still built from the old flat masses. The low-poly reference suggests bigger two-tone hair planes.
- The mantle's ragged hem is boxy. It could use shaped wedges.

## Round 2 and 3 (2 November 2026)
- Head is now scaled 1.6 wide and 1.34 tall, limbs 1.3 thick, hands 1.7 wide, hips and shoulders broader, boots 1.3 taller.
- Mantle rebuilt: it hangs close to the body with five small ragged tabs (no boxy shelf). Short hair and bob gained darker side planes (HAIR_D) for the two-tone look of the low-poly reference.
- Leg length is the game rig's (main chat): to reach the references' 4.5 to 5.5 heads, add a stocky body type or shorten the rig legs; the meshes cannot do it alone.
- Heavier head and torso: please recheck name tags, hats and the first-person camera.

## Round 4 (3 November 2026): blank faces, body plan first
- Direction from the user: faces stay blank so players project themselves onto the character; the body plan and aesthetics carry the look. Stock heads now have no eyes, brow, nose or mouth (glasses, scars and beards still sit on the smooth head).
- Body plan: head scaled 1.22 wide and 1.1 tall (a smaller, cleaner head), male torso with a V-taper (shoulder 0.215, waist 0.112, hip 0.132), female torso with a defined waist (waist 0.098 against hip 0.15, narrower shoulders), limbs 1.1 thick and tapering, hands 1.25, boots 1.12.
- Appeal rules used: strong shoulder-to-waist taper, a clear waist, limbs that taper to the joint, long legs, plain legs and simple lower body so the eye goes to chest, hands and accessories. Web sources found were thin on numbers (see 80.lv and the 60/30/10 colour rule), so the ratios come from standard figure-design practice.
- Still to do: clothes built with fixed radii hang straight over the new waist; tune tops and the mantle to follow the taper.

## Round 5 (3 November 2026): a real body plan
- Round 4 only scaled things. Round 5 changes the shapes themselves. Torso table now has eight rows (hips, waist, ribs, chest, shoulder girth) with a z shift for bust and glutes: women waist 0.088 against hips 0.166, men shoulder 0.228 against waist 0.104. Tops, jackets and belts follow it automatically.
- Limbs have profiles (`prof_rows`): shoulder cap and biceps, forearm swell to a slim wrist, fuller thigh narrowing to the knee, calf muscle and slim ankle. Trouser legs narrow to the hem.
- Cost: the heaviest outfit mix is about 1,100 triangles (was 960). The pack is 10.5k triangles for 60 parts.
- Faces stay blank. Still to do: shaped hands, glute/back shaping in the clothes, hair with more volume.

## Round 6 (3 November 2026): learned from free CC0 models on GitHub
- Found and studied: the Quaternius Modular Men and Modular Women packs (21 characters, CC0; mirrored in `trebeljahr/quaternius-showcase`, whose licence table lists every pack as CC0) and the KayKit Adventurers pack (CC0, `KayKit-Game-Assets`). All are free for commercial use, so they are safe references for an open-source game. Not imported: they use their own skeletons.
- Measured the Quaternius figures (height scaled to 1.8 m): head half-width about 0.105 and half-depth 0.12 to 0.14, waist half-width 0.10 to 0.125, hips 0.15 to 0.17, a clearly separate head shape per character (hair or hat) and bulky layered clothing (vests, knee pads, pockets) for the silhouette.
- What this changed in our generator: the stock head is rounder and bigger (scaled 1.3 by 1.14); hair and hats are rebuilt from 10-sided domes (`blob`) instead of hexagonal cones. New stock hair styles: afro, long, ponytail, mohawk, top knot, slick (plus rebuilt short, bob, buzzed, buns, beard) and a new wide-brim hat; beanie, cap and helmet are round. Creator choices list them all.
- New album scene `survivors_hair`: twelve heads on the same body.
- Next: bulkier layered clothing (vests, knee pads, pockets) on the stock tops and bottoms so bodies differ as much as heads do.

## Round 7 (3 November 2026): bulkier, layered clothing
- New stock outer layers: `puffer` (quilted bands, tall collar, big cuffs) and `vest` (sleeveless, chest and waist pockets, shoulder straps). New bottoms: `combat_trousers` (thigh pockets, knee pads, blousing at the boot). All are in the creator choices.
- New album scene `survivors_bulk` shows eight different builds, hair and layers side by side. Afro is fuller.
- Still open: shaped hands, more varied faces/skin patterns, and per-preset build variety in the stock presets.

## Round 8 (3 November 2026): the Quaternius characters, imported and re-posed
- Source: Quaternius Ultimate Modular Men and Women (CC0, 11 + 10 characters), fetched from the `trebeljahr/quaternius-showcase` mirror on GitHub; credit given in the pack notes although CC0 needs none.
- Tool: `workshop/tools/import_modular.py <folder of modular_men / modular_women>` skins each model at its bind pose, re-poses it bone by bone from the T-pose onto our survivor skeleton (each Quaternius bone is rotated and stretched to our bone's direction and length), drops the painted eyes and brows (faces stay blank), simplifies with a small quadric edge collapse that protects colour borders, and cuts the result into per-bone, per-colour pieces. `workshop/tools/make_modular.js` wraps them as `packs/afterstreet-modular.js` (added to `packs/index.js`).
- Result: for each character a top, trousers, shoes and head with hair (plus a backpack for the adventurer) as creator parts, and 21 ready-made looks (`qm_*` men, `qw_*` women). Skin takes the player's skin tone, hair takes the hair colour, the main shirt and trousers colours take the player's shirt and trousers colours; everything else keeps the original colours.
- Cost: about 1,900 triangles per character, 41k triangles and 3.3 MB for the whole pack. The default pack list loads it; the main chat can drop it from `packs/index.js` if load time matters.
- Known flaws: small gaps at the armpits and the odd seam speckle (rigid per-bone pieces after a big T-pose to hanging-arms pose change), the head sits a little larger than the stock head, and the poly pieces are not yet checked against the game's body-type shapes. Album scene: `survivors_modular`.

## Round 10: a clean start, built from loops (4 November 2026)

The decimated-scan approach (Round 9) was dropped. The reference set (low-poly base meshes, face studies, the knee and elbow loop study, the Ashen characters) all share one thing: **clean quad loops that follow the form, large flat planes, and a few deliberate extra loops at joints**. A scan crunched to a triangle budget gives noisy triangle soup, so the Quaternius Superhero (CC0) is now only a ruler.

What the pipeline does (`python3 workshop/tools/fit_rings.py <folder with the Superhero gltf files>`; it uses `import_superhero.py` to retarget the mesh to our skeleton first):
- slices the retargeted mesh at chosen heights and keeps one ring of 8 corners per station (12 for the head), smoothed, mirrored for the left-right pairs; one shared ring wherever two segments meet, so there is no step at a joint (`data/body_rings.json`);
- the clothing tables are **read off those rings**: the torso table (`data/superhero_torso.json`), the limb profiles and the per-body limb offsets from our skeleton line (`data/limb_fit.json`). Nothing is hand-set any more, so clothes fit the loops they sit on;
- the shoulder tops belong to the arms and the torso slopes in to the neck (the trapezius slope in the references), the torso top is capped and the neck sits into it;
- the foot is designed, not measured (heel block, instep, ball, toe box); shoes are that foot grown by a few millimetres, boots add a shaft from the calf rings.

`survivor.py` builds the rings into `poly` pieces flagged `winding: true` (see `shapes.js`: faces keep their stored direction instead of being turned away from the piece's middle). The last passes (head scale, neck thickening, limb offsets) skip those pieces.

Still to do from the references: knee and elbow loops tuned 3 outside / 2 inside, a planar faceted face (brow shelf, nose wedge, jaw plane, disc ears), clothes as ring offsets (Ashen-style big layers: tunic, mantle, belt, wraps, ragged hems), and hair and hats refitted to the new head.
