# What the design chat still needs to build

**Update, version 0.45.8:** batch 1 (sections 1 to 3) has arrived and is wired in for weapons, arms, clips, barricades, fires, generators, dropped packs and outdoor crates. Still waiting on game code, not art: loose items on the ground, searched container variants inside buildings, hinged doors, plants, street props, car wrecks and burnt cars. Sections 4 onward are still to do.

Written at version 0.45.5, 19 October 2026. Everything here is art the game currently fakes with plain boxes, draws with a stand-in, or does not have at all. Same rules as every pack so far: shaped pieces (box, bev, wedge, cyl, loft, decal, poly), flat colours from the pack palette, metres, origin at the centre of the base, front facing +Z, glow pieces for lights. See `docs/SHAPED.md` for the format and `docs/ART.md` for the look.

Each item says what the game does today, so you can see what it replaces.

## 1. Needed first (the game already has a place waiting for these)

### Weapons in the hand
The game now has 9 street weapons (cricket bat, frying pan, crowbar, hockey stick, wrench, garden rake, broom spear, axe, umbrella). Only the **crowbar, baseball bat and axe** have shaped models (from `props.js`, drawn in the first-person view). The rest are a few boxes I put together.

- Shaped models, long side along +Z, business end at +Z, grip near the middle, about 0.5 to 0.9 m long: **cricket bat, frying pan, hockey stick, wrench, garden rake, broom spear, umbrella** (closed). Handoff icons are in `assets/weapons/*.svg` for the look.
- **Slingshot** (held, plus the stretched-band pose) and a **pistol** (the game's pistol is still two boxes) with a muzzle flash piece and a shell.
- A **worn** version of each melee weapon for when its condition falls under a quarter (bent, chipped, taped), and a **broken** stub for when it snaps.
- The same weapons **lying on the ground** (loose items) and **in the third-person hand**. For that, tell me the grip point on the survivor's hand bone for each (position and turn), so one model can sit in both views.

### First-person hands
Nothing is drawn for the player's own arms. A pair of forearms and hands in the survivor's skin tone, in three poses: relaxed holding a weapon, empty, and reaching to open or search. They should take the skin colour slot, and the sleeve slot from what the survivor wears.

### Survivor animation for jumping
The jump went in at 0.45.5 and the third-person survivor has no clip for it. Needed: **jump** (crouch, rise), **airborne** (a held pose, arms up a little), **land** (absorb and stand). Also still missing and worth adding at the same time: **hurt flinch**, **drink**, **bandage a wound**, **pick up from the ground**, and **weapon-specific attacks**: overhead chop (axe, hammers), thrust (spear, broom, rake), flat swing (bats, hockey stick, pan).

## 2. Art 3 leftovers (roadmap row "Art 3")

- **Loose items on the ground** are already modelled in `props.items` but the game does not place them yet. Missing from that set: stone (throwable), flare, lure, batteries, matches, nails, seeds, antibiotics, painkillers, vitamins, soda can, granola bar, rice bag, blanket, books, cloth scraps, sticks, tin can, berries, rain jacket, lantern, ammo box, pistol.
- **Loot containers.** Searchable containers are drawn as spinning gold cubes today. They need real models, each searchable: cupboard, wardrobe, kitchen drawers, filing cabinet, medicine cabinet, glove box, car boot, toolbox, till, bin, shelf stack, locker (the locker exists), duffel bag. One "already searched" variant of each (drawer open, lid up).
- **Trees and plants.** The pack has oak, pine, bush, dead tree, grass tuft and rock. Needed on top: autumn oak, birch, willow (for the creek), stump, fallen log, fern, flower patch (three colours), reeds, mushrooms, cut-down stump, bramble.
- **Street props the game could place but has no model for yet:** road signs (speed, one way, yield), street name post, parking meter, bike rack, phone box, bollard, crash barrier, manhole cover (flat), road markings and crossings (flat decals), shop awnings, hanging shop signs, satellite dishes, air-conditioning units, chimneys, water tanks and roof hatches for building roofs.
- **Opening doors and lids.** `moving` in `props.js` has the car doors already; still needed as separate hinged pieces: house door, shop door (glass), garage door (rolls up), window shutter, fridge door, cupboard doors, chest and crate lids, car bonnet and boot (for the truck repair jobs).
- **The truck.** The repair jobs (battery, tyre, engine parts, fuel) are fitted to the old model. A shaped pickup with a bonnet that lifts, four wheels that come off, a fuel cap, and a battery visible under the bonnet. Plus a **rusted wreck** version of each car for parking lots, and a **burnt-out** version.

## 3. Things players build and place (all boxes today)

- **Wall / barricade** (`cade`): planks nailed across a gap, three stages: new, damaged, nearly gone.
- **Window boards** and a **reinforced door**.
- **Camp fire** with logs, a **fire pit** ring, a **lamp/lantern** post.
- **Generator** (boxes today; the pack's `items.generator` is for carrying), running and off versions.
- **Rain collector** (done), **garden plot** (done), plus a **compost bin**, **water filter**, **drying rack**, **cooking spit**.
- **Tool bench** (repairs weapons) and **workshop table**.
- **Dropped pack** (a blue box today), **grave marker**, **map marker flag** (the Mark button).

## 4. Art 4: the ground

Smooth hills with sharp kerbs, creek and river banks, ravines. Needed as ground materials (tileable, flat colour with small shapes, four seasons where it matters): road, road with centre line, sidewalk, kerb strip, grass, dry grass, dirt, gravel, mud, sand, water edge, leaf litter (autumn), snow. Also puddle and ice decals, and cracks and potholes for roads.

## 5. Art 6: broken buildings

For every bay type in `buildings.js` (wall, window, door, shopfront, garage): a **damaged** state, a **hole** state, and the **rubble** piles that fall, in the same palette so a half-broken street still reads. Frames should have a **snapped** version. Interior side too: torn wallpaper, exposed studs, daylight. Also **boarded** versions of window and door bays.

## 6. For the next game steps

- **Horde nights (0.47):** at least two new alien kinds beyond swarmer, stalker and giant. One ranged (a spitter with a spit projectile) and one that climbs (a clinger for walls and roofs). Each with idle, walk, attack, dead. Plus a **hive nest** growth stage (small, grown, burst), and **alien blood / goo** decals and a **corpse-fade** pose.
- **Paper map (0.48):** a held folded map and an unfolded map the player looks at: paper, creases, pencil marks, a compass rose.
- **Recruitable survivors (0.49):** four to six ready-made NPC looks (not the creator), each with a distinct silhouette, plus **sitting**, **leaning on a wall**, **waving** and **carrying a crate** clips.
- **Sky:** moon phases, cloud shapes for the three weather types, rain and snow streak pieces, a lightning flash, a faint aurora for the final-night event.

## 7. Effects (small pieces the game animates)

Muzzle flash, bullet tracer, hit spark, dust puff on landing, footstep puffs (dust, snow, splash), water splash and ripple, flame (three sizes), smoke column, explosion (core, ring, debris), flare glow, alien goo splat, glass shards, wood chips. Each as one to four pieces with a note on how it should scale and fade.

## 8. UI art

Matching icons for the new buttons (Jump, Build mode, Back), a damage-direction arrow, the low-health vignette, and a small **status icon set** (bleeding, infected, broken leg, wet, cold, hot, hungry, thirsty, tired, sick), drawn to the field-journal style.

## 9. Sound (if the design chat covers it)

Jump grunt, landing thud per surface (grass, road, wood, metal), a swing and a hit for each weapon type (wood, metal, pan clang, umbrella flap), pistol shot and dry click, alien sounds for each kind (idle, notice, attack, die), door creak and slam, drawer and lid, generator hum, rain on roof versus rain outside, fire crackle, and a short musical sting for night falling and for dawn.

---

Suggested order: section 1 (so the weapons and jump look right), then loose items and loot containers from section 2, then section 3, then Art 4 and Art 6.
