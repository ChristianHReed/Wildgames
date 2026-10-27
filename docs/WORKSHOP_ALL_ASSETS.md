# Workshop for every asset: what has to be built (content chat, 27 October 2026)

Read: docs/WORKSHOP.md, workshop/model.js, workshop/app.js, workshop/tools/make_sample.js, the survivor and held packs. Workshop 0.1 builds cars only. The engine is shared (shapes, symmetry, prefabs, materials, function tags, packs, view); everything below is what each other asset type needs on top of it.

## How the content chat will work from now
- New assets are authored as Workshop designs and shipped as packs (`packs/*.js`), not as new Python shaped packs.
- Until the Workshop has the missing builds, I author headlessly in Node with the same `workshop/model.js` API that `make_sample.js` uses (`blankDoc`, `addPiece`, symmetry, `export`), so my designs open in the Workshop for anyone to edit. That works for cars today. For other types it needs W1 and W2 below.
- The 42 existing Python packs (about 3,100 models) stay as they are until W3 (the importer) lets the Workshop open and re-export them.
- Correction to the gap list: `machines` already had `school_bus`, `fire_truck`, `ambulance` and `tow_truck`. My `fleet` pack's school bus and fire engine duplicate them; its city bus is new. I will turn `fleet` into a Workshop pack of only what is new (city bus, semi, police and taxi overlays) once W1 is in.

## What each asset type needs (and has now)
| Asset type | In the game today | Workshop 0.1 | Missing |
|---|---|---|---|
| Cars, pickups, vans | props vehicles (10), fleet | yes | nothing core; more classes below |
| Other vehicles (bikes, boats, machines, buses, trains) | bikes 51, boats 43, machines 88, rail | no | joint tree (W2), seat and grip points (W6), vehicle classes |
| Held items, weapons, tools, ammo | held 62 | no | grip and hand poses, first-person poses, reload steps (W9) |
| Items and loot | props items 63, vehiclekit 214 | no | item data, icon, recipe (W10) |
| Furniture, props, containers, doors | props, interiors 233, furniture2, shopfit, services, foodservice | no | states, hinged parts, size class (W7) |
| Buildings and walls | buildings 67, walls 70, civic, roadside, structures | no | modules, bays, openings, interiors (W8) |
| Plants and trees | flora 75, woods, farm | no | growth stages, seasons, sway (W11) |
| Creatures | animals, aliens | no | skeleton, gait clips, drops (W5, W12) |
| Ground and world tiles | ground, world 107, land 58 | no | tileable tiles with edge sockets, decals (W13) |
| Characters and clothes | survivor (20 bones, 75 parts, 3 builds, 2 bodies) | no | W4 (the whole character pipeline) |
| Effects and lights | fx 40 | no | presets (W14) |
| Sounds | audio packs | no | recipe synth (W15) |

## The builds, in order

**W1. Asset types and generic packs (engine, first).** Docs get `type` beyond `vehicle`; a type registry says each type's groups, setup panel, function tags, checks and the exporter that writes it into the game's table (`props.models.furniture[name]`, `held.models.weapons[name]` and so on). Pack format version 2: an asset names its `target` and whether it adds or replaces a stock model; `AfterstreetPacks.install` becomes a generic install by target. Size: large, but all later builds are small once it is done.

**W2. Joints and general parts.** Replace the fixed groups (body, bonnet, boot, wheel) with named parts in a tree: each has a pivot, an axis, limits and a drive (steer, spin, swing, slide, open). Covers doors, lids, drawers, wheels, propellers, turbine blades, excavator boom, arm and bucket, handlebars, pedals, windmills. Preview moves them with sliders. Damage and wreck generation stays for vehicles.

**W3. Importer for the existing packs.** Turn shaped pieces back into editor pieces (box, bev, wedge, cyl, loft, decal, poly), with groups and colours, for all 42 packs. Round-trip test each pack like the stock cars (open, export, identical pieces). After this, every asset in the game can be opened as a copy, edited and exported.

**W4. Characters and clothes** (the big one). See the next section.

**W5. Skeleton and clip editor.** Define bones (name, parent, pivot, tip), assign each piece to a bone, then pose frames on a timeline with preview, looping and speed. Used by survivors, animals, aliens, held-item first-person poses and any animated prop. Exports `clips` in the survivor format (frame = bone map in degrees, X then Y then Z, about the bone's pivot). Needs a mannequin preview and onion skinning.

**W6. Points and markers.** Named anchor points with orientation: grip, off-hand, seat, saddle, pedal, thwart, tiller, hinge, socket, muzzle, smoke, light, sound, loot slot, spawn, door swing. Visible in the editor, exported in the type's own fields (cars already use seats, headlights, taillights). This is what bikes, boats, held items and furniture need to attach to survivors.

**W7. Furniture, props, containers, doors.** Size class and weight, containers with a searched state (lid up, drawer out), door and lid hinges (from W2), light sources (colour, radius, glow pieces), sound tags, salvage by material, stackable and carry rules (`carry_furniture`). States: closed and searched, lit and off, whole and broken.

**W8. Buildings.** Modules on a grid (bay width, floor height), openings for doors and windows, sockets that snap modules together, roof kits, interior rooms with floor, ceiling, and stair pieces, damage and breach variants, and the footprint polygon and collision boxes the map builder needs. Roadside and civic whole buildings fit as one-module designs.

**W9. Held items.** Grip point and second grip, hand pose preview on the survivor mannequin, swing or shot point, first-person pose and view model, reload steps, ammo, state variants (loaded, empty, broken); numbers (damage, reach, speed) into the `held.js` fields.

**W10. Items, recipes, icons.** Item data (weight, stack, uses, ground model), crafting recipes and salvage, build cost, an icon rendered automatically from the model at a fixed isometric view, and a hand-drawn override.

**W11. Plants.** Growth stages (sprout, growing, ripe, harvested) and seasons as colour sets, wind sway weights, harvest yield, and a branching tool that grows a tree from a few settings (trunk, branch angle, leaf blobs).

**W12. Creatures.** A skeleton from W5 with gait clips (walk, run, attack, hurt, die), hit zones, drops (meat, hide) and a carcass state; hive and nest pieces as buildings with growth stages.

**W13. Tiles and decals.** A tileable 4 m ground piece with edge sockets that say what may sit next to it (so the map builder can lay them), decal planes with flat colour and an alpha shape, road and rail pieces with sockets for the next piece.

**W14. Effects and lights.** Presets: smoke, fire, dust, spark, rain, with count, size, colour and speed curves; light presets; used by pieces as glow and by states.

**W15. Sounds.** A recipe editor on the synth the audio packs use (noise grains, filters, envelopes, pitch curves, loops), preview and export into a pack's `sounds` as recordings, with names matching the game's keys (`step_gravel_run`, engine loops with a rev range). Same pack format, so sounds travel with the assets they belong to.

**More shapes (small, do any time):** lathe (spin a profile), extrude (outline to a solid), array (repeat n along a line: pickets, windows, ties), radial symmetry (3, 4, 6, 8 around an axis: wheels, turbines, towers), path tool (pipes, cables, rails along clicked points), stairs, arc and torus, text and flat-colour decals.

## W4 in detail: characters and clothes
What the survivor pack has now: 20 bones (pelvis, three spine, neck, head, arms, hands, legs, feet, toes), each with a pivot and a parent; two bodies (masculine, feminine) and three builds (slim, average, broad) made by stretching each piece with `scaleXZ`; five colour slots (SKIN, HAIR, SHIRT, PANTS, ACC) with five skin tones and five hair colours, and `_D` darker shades; creator parts (body, top 8 styles, bottoms, shoes, face, hair, hat, gear, worn, npc) per body; worn layers (sweater, coat, raincoat, leather, trousers, thermals) drawn over or in place of the creator parts; a hat rule (pieces marked hat hide hair); NPC looks; 21 clips.

What the Workshop needs for it:
1. **Mannequin:** the two bodies and three builds loaded as a reference (not exported), posable with the clips, so clothes are built on a body. A slider shows the same garment on slim, average and broad.
2. **Bone-bound pieces:** each piece names its bone (like `spine_03`); the editor moves it with the bone when posing; the exporter writes the `parts.<slot>.<body>.<id>` lists the game reads.
3. **Colour slots:** a piece takes a slot (SKIN, HAIR, SHIRT, PANTS, ACC) instead of a fixed colour, or a fixed colour for worn layers; `_D` shades; an optional second slot for trims.
4. **Garment layers and slots:** the layer order (skin, underwear, creator top, sweater, outer, hat), what each layer hides (a hat hides hair; trousers replace bottoms), and conflicts (two outers).
5. **Fit from the body:** an "inflate" tool that takes the body's own rings for a region (torso, upper arm, thigh, calf) and creates a shell a set distance out. That makes shirts, trousers and sleeves fit all three builds automatically, which is how today's lofts are written by hand.
6. **Per-body and per-build rules:** one design exported for masculine and feminine bodies with their own fit, and checks that nothing pokes through the body at any build or in any clip frame (a pose sweep).
7. **Hair, hats, faces, gear:** hair styles as parts bound to Head with a hat-hide flag; faces as decal sets (the existing eyes, mouth, freckle, scar, stubble); gear (backpack, bag on `carryAt` and `sling`); worn items (the held-turn and carry attach points from W6).
8. **NPC looks:** a look is a named bundle of choices and colours (old_ranger, medic and so on), editable as a preset list.
9. **Triangle budget** per part and per full outfit (survivor stats exist: `stats` for every part).
10. **Export** into the existing `survivor` tables through the W1 target mapping, so the survivor creator, NPCs and multiplayer need no change.

## Order I would build, and what I can start now
1. W1, W3, W6 (the engine and the importer) so that anything can be opened and edited.
2. W2 and W7 (joints, furniture and props), then W9 and W10 (held items and items): most new content I make is of these kinds.
3. W5 and W4 (skeleton and characters) together; W12 and W11 after.
4. W8 and W13 (buildings and tiles) for the map builder.
5. W14, W15, and the shape additions any time.
Starting now, in Node with `model.js`: more cars, pickups, vans and trucks as Workshop packs (the semi tractor and trailer, police and taxi repaints, the city bus), and the wheel-state and weather parts, which are vehicle kit entries (no format change).

## Decisions I need from the owner
- Is the Workshop chat building W1 to W15, or should I? The files are theirs (`workshop/`), so I will not edit them unless told.
- Should existing Python packs be frozen once W3 lands, so the Workshop designs become the source of truth?
