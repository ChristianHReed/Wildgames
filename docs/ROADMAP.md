# Afterstreet development roadmap

Last updated: 18 October 2026, at version 0.43. This one document holds both the game features still to build and the free art and sound packs each step needs.

How to use it: work down the "Next versions" list. When a version needs a pack, the "Assets" section says where to get it and which download to pick. Download the zip and attach it to the chat; Claude converts it into the game's `assets` folder.

Features were compared with Project Zomboid, DayZ, 7 Days to Die, The Long Dark, State of Decay 2, Valheim and Unturned, and for stealth with Alien: Isolation, The Last of Us and Thief. Those comparisons come from general knowledge of the games.

## Done so far

| Version | What it added |
| --- | --- |
| 0.4 – 0.18 | Real Springfield streets and terrain, region downloads, building kinds and loot, safe house, lights, radios and batteries, day and night, kit building fronts, trees and plants, aliens from the Bestiary pack, multiplayer, phone and tablet play |
| 0.19 | Doors and windows that open, break and can be boarded; rooms furnished by building kind; plant gathering; moving water |
| 0.20 | Sprint and stamina, crouch, slow climbing through windows, hills slow you, swimming and wet clothes |
| 0.21 | Safe zones with a hard edge; Park Central Square is a safe zone |
| 0.22 | Aliens see in a cone blocked by walls, hear by how you move, investigate, chase and search; the awareness pill on screen |
| 0.23 | Aliens find their way around walls and through doorways; thrown stones draw them; quiet takedowns from behind |
| 0.24 | Survivors are animated 3D people (your own character, other players, traders) coloured by each look; body, hair and hair colour choices; third-person view (P) |
| 0.24.1 | Fixed unexplained deaths: tornado, cold, hunger and thirst rebalanced; death message names the cause; hit direction arc |
| 0.25 | Inside doors that open, shut and block sight; hiding in wardrobes and lockers; locked doors (keys, pry, smash); Kenney Furniture Kit models |
| 0.26 | Sound from Kenney Impact Sounds and RPG Audio plus made-in-game gunfire, alien calls and weather; proper walk, run, crouch-walk, swim and death from the first Animation Library |
| 0.27 | Furniture that works: sleep in beds, cook hot meals on stoves, water from sinks, baths and cisterns, shove heavy furniture against doors |
| 0.28 | Stairs and a furnished upper floor in most two-storey homes; ladders up to flat roofs; fall damage. What you face is picked before what is merely nearer (a wardrobe beside a bed) |
| 0.29 | Survival depth: bleeding, infection and broken legs with bandages, antibiotics and splints; fresh food that goes off and food poisoning; unboiled water to boil; a Rest bar and exhaustion; weapons that wear out, repaired at tool benches or with duct tape |
| 0.30 | Noise heat brings scouts (swarmers by day, a stalker by night), shown on the map; the stalker hunts at night, checks remembered hiding places and climbs ladders |
| 0.30.1 | The stalker no longer knows where you are until it notices you; then it hunts you for about four game hours, lurks out of sight, and rushes only from close by in a short, very fast burst |
| 0.30.2 | Survivors redrawn in a flat painted style: bigger heads, softer proportions, painted faces and clothes (8 faces, 8 tops, 6 bottoms, 3 shoes, a second colour) instead of extra geometry |
| 0.30.3 | New low-poly survivor bodies built on the animation skeleton: big octagonal head, small nose, tube limbs, mitten hands, chunky shoes; blocky hair and hats that turn with the head |
| 0.31 | Upper floors in shops, offices, flats, schools, clinics and more (each with its own kind of rooms); a roof hatch at the top of the stairs in flat-roofed buildings |
| 0.31.1 | The safe house moves to the edge of town: a small one-storey home on a one-acre lot inside a white picket fence (the only safe zone now; the town square is an ordinary place again) |
| 0.32 | Fresh build, part 1: every building redone in code by type (docs/BUILDINGS.md); the Downtown City MegaKit fronts and the old facade textures are removed |
| 0.33 | Fresh build, part 3: a new terrain and map generator (docs/TERRAIN.md). Ground textures painted in code (mown grass, long grass, earth, rock, roads, pavements, water, floors, wallpaper); ground cover by land use, distance from buildings, slope, wetness and height, with soft wood edges and seasons; trees planted by kind (street, yard, park, wood, riverbank). The old design-pack ground textures are removed. The Demo Town gains a creek, a wooded bluff and meadows |
| 0.34 | Springfield, MO becomes the whole 50-mile region from the Afterstreet map pack, built in and loading square by square as you travel (no internet needed on a drive; Save for offline on iPhone): about 45,000 typed buildings, all roads and water, real hills, and the pack's terrain types (pasture, oak-hickory and pine-oak woods, scrub, glades, wetlands, lawns) driving the ground and the trees, with woods grown as you approach |
| 0.34.1 | Back to safe house button on the start page for when you are stuck; walking off a roof never drops you inside a building next door (you step onto its roof if it is about as high, otherwise you stop at the edge) |
| 0.34.2 | The map pack's gaps filled in by its own rules: about 10,000 homes and shops along the streets of the 20 boxes the map server missed (mostly Ozark and east Nixa), and about 29,000 farmsteads (house, barn, shed, drive, and about 18,000 stock ponds) along county roads. All of it is marked as generated, so real map data can replace it later |
| 0.35 | Stealth extras: aliens see through shut window glass; curtains and blinds (B at a window) stop their eyes and hide your light at night, and a lit window draws aliens from about 45 m; footsteps carry by ground (quiet on grass and carpet, loud on gravel, loudest on broken glass); the giant feels car engines from about 140 m and sprinting from about 65 m |
| 0.35.1 | Ground-floor windows are real openings (see out, see in); inside walls stop short of windows so every window can be climbed through; windows of flats line up with their painted pairs |
| 0.37 | Power and water fail: street lights, lit windows and electric stoves until the power fails going into day 3; the water mains fail going into day 5 (cisterns still hold some); generators (rare loot) power one building with fuel: light, a working stove, but noise and lit windows that draw aliens |
| 0.38 | Trees from Kenney's Nature Kit chosen by habitat, with autumn colours; buildings reworked with what game artists do for modular kits: windows set into the wall with sills, a plinth, corner trim, roof overhangs with fascia, gable roofs on many homes, false fronts on small shops, canopies over glass doors (docs/BUILDINGS.md) |
| 0.39 | Cars from Kenney's Car Kit, with wheels that roll and steer and an engine sound. A broken pickup truck in the safe house drive: fix it with a toolkit, a spare tire, a car battery, engine parts and 2 scrap (garages, auto shops, gas stations, traders), each fitted by holding E while the part goes into place; then drive it, keep gear in its bed and sleep in its cab. It can drive between parts of the Springfield region |
| 0.40 | Clothes in six slots (head, top, outer, hands, legs, feet), eleven kinds found as loot or bought: warmth that brings you up to comfortable when cold and overheats you when hot, rain that soaks you unless your jacket keeps it off (wet clothes are less warm), protection that takes part of an alien's hit and tears with use (duct tape patches it), gloves against broken glass, a cap for shade. Worn clothes stay on when you die |
| 0.41 | **Art 1, the mood:** cozy days and scary nights. A sky with a gradient, sun, moon and stars; colours, fog and light by time of day from docs/ART.md; at night a dark fog to about 30 m that lamps, flashlights and lit windows cut through, and darker screen edges; a third of windows lit while the power lasts (warm, a few cold and flickering), a few cold ones after; flickering street lamps; aliens' eyes glow green and light the ground |
| 0.41.1 | Building corners shaded: walls darken toward every corner and the ground, inside and out, and light falls at an uneven angle so each side of a house has its own tone |
| 0.42 | **Art 2, the shaped survivors:** every creator choice from the survivor pack (version 6) fitted onto the animation skeleton and moved with the same clips (tools/build_rig.py exports the bone movement); the creator preview, other players and traders use them; worn helmets, beanies, caps, boots and gloves show; packs on survivors |
| 0.43 | Rain collectors (clean water when it rains, up to 10 bottles) and garden plots (seed packets found as loot or bought; grow over about a day and a half while watered by rain or a bottle; slower in autumn, none in winter; harvest fresh food and sometimes seeds back) |

## Next versions

Each is small enough to try on the iPhone before the next one starts. Assets needed are listed in brackets.

| Version | Features | Assets needed |
| --- | --- | --- |
| **0.44** | More for the truck: siphon fuel from town cars, search their trunks, headlights at night, the truck wears and needs upkeep | None |
| **0.45** | Horde nights: every few nights a wave of aliens comes for your base; walls, barricades, boarded windows and light matter | None |
| **0.46** | A paper map and notes: you only see where you have been, and can mark places | None |
| **0.47** | Other survivors to find and recruit at your base, each with needs and a job (guard, gardener, scavenger) | Shaped survivors (in the game) |

## The new look (art track)

Chosen 13 October 2026: shaped-voxel characters and props, breakable 12.5 cm block buildings, smooth ground with sharp edges, cozy days and scary nights. How it works is in `docs/ART.md`; the reference scene is `art-tests/voxel-test-street-2.html`. These steps replace the Quaternius, Kenney and KayKit art over time. They can go before or between the feature versions above; each is small enough to try on the iPhone first.

| Step | What changes | Assets needed |
| --- | --- | --- |
| ~~Art 1~~ | **Done in 0.41.** Mood: day and night retuned to the cozy-day, scary-night keys (sky, fog distance, sun and moon colour, lamp pools, only some windows lit, a flickering lamp, alien eyes that glow, darker screen edges at night) | None |
| ~~Art 2~~ | **Survivors done in 0.42; shaped aliens still to do.** Shaped survivors and aliens on the existing skeletons and animations; character creator parts as pieces | None (made in code) |
| **Art 3** | Shaped items, furniture, street props, trees and cars | None (made in code) |
| **Art 4** | Ground: smooth hills with sharp kerbs, creek and river banks and ravines, in every region square | None |
| **Art 5** | Buildings as 12.5 cm blocks near you, 25 cm and 50 cm further out, from the same type rules as today | None |
| **Art 6** | Breaking: walls and windows break into blocks, loose parts fall, rubble stays; what can break them, the noise it makes, aliens seeing through holes, and saving the damage per square | None |

## Feature backlog by area

Ticked items are in the game.

### Moving over the ground
- [x] Sprint with stamina
- [x] Crouch (slower, quieter, harder to see)
- [x] Slow climb through windows; broken glass cuts unless crouched
- [x] Hills slow you going up
- [x] Swimming drains stamina; wet clothes lower warmth
- [ ] Vault low fences and props (needs props to be solid first)
- [x] Surface noise: louder on gravel and glass, quieter on grass
- [ ] Carry weight slows you
- [x] Fall damage

### Buildings
- [x] Outside doors and ground-floor windows open, shut, break, board up
- [x] Rooms laid out by building kind; loot by container
- [x] Safe house on a fenced one-acre lot at the edge of town
- [x] Interior doors that shut and break line of sight
- [x] Hiding spots: wardrobes and lockers (under beds still to do)
- [x] Locked doors with key, pry or smash
- [x] Curtains or covered windows so aliens do not see your light
- [x] Furniture uses: sleep, cook, fill water, barricade a door
- [x] Stairs and upper floors in homes; ladders to flat roofs
- [x] Upper floors in shops, offices and flats; roof hatches
- [x] Power and water fail on a set day; generators

### Aliens
- [x] Sight cone blocked by walls; shorter at night unless you carry a light
- [x] Hearing by how you move; gunfire and engines carry far
- [x] Awareness that builds while you are in view, and an on-screen indicator
- [x] Investigate, chase, search where they lost you, give up
- [x] Swarmers alert their group
- [x] Pathfinding around walls and through doors
- [x] Thrown distractions (stones)
- [x] Stealth takedowns
- [x] Noise draws aliens across a block; area "heat"
- [x] Stalker that hunts and learns your hiding spots
- [x] Giant that feels sprinting and vehicles from far away

### Survival
- [x] Injuries with different treatments (bleeding, infection, broken leg)
- [x] Food spoilage, cooking, boiling water
- [x] Sleep and tiredness
- [x] Weapon wear, repair at a tool bench or with duct tape
- [x] Clothing layers: warmth, wetness, protection
- [x] Farming and rain collectors

### World and long game
- [x] Sound (music still to do)
- [ ] Other survivors to recruit, with needs and jobs
- [ ] Horde nights against your base
- [ ] Loot that does not come back
- [x] Vehicle repair (the safe-house truck), a truck bed to store gear, sleeping in the cab
- [ ] Siphoning fuel, car trunks, headlights
- [ ] Skill books and more skills
- [ ] Map item with notes, instead of always knowing where you are

## Assets

All of these are free. Quaternius and Kenney packs are CC0 (no credit required, though `CREDITS.md` lists them anyway). The "Standard" version of a Quaternius pack is the free one.

### Already in the game

| Pack | Used for | Source |
| --- | --- | --- |
| Bestiary – Dungeon Monsters Kit (Standard) | Alien models | [quaternius.com](https://quaternius.com) |
| Kenney Nature Kit | Trees, bushes, flowers, grass, rocks, logs | [kenney.nl](https://kenney.nl/assets/nature-kit) |
| KayKit Furniture Bits | Beds, sofas, chairs, tables, cabinets, lamps | [GitHub](https://github.com/KayKit-Game-Assets/kaykit-furniture-bits-1.0) |
| Universal Base Characters (Standard) | Survivor bodies and hairstyles | [quaternius.com](https://quaternius.com) |
| Universal Animation Library and Library 2 (Standard) | Survivor moves | [itch.io](https://quaternius.itch.io/universal-animation-library-2) |
| Kenney Furniture Kit | Kitchen, bathroom, bedroom, office pieces | [kenney.nl](https://kenney.nl/assets/furniture-kit) |
| Kenney Impact Sounds and RPG Audio | Footsteps, doors, glass, hits | [kenney.nl](https://kenney.nl/assets/impact-sounds) · [kenney.nl](https://kenney.nl/assets/rpg-audio) |
| Kenney Car Kit | Town cars and the safe-house pickup truck (separate wheels and bonnet so they move), the loose door and tire beside it | [kenney.nl](https://kenney.nl/assets/car-kit) |
| KayKit City Builder Bits | Street lights, benches, hydrants, dumpsters | [GitHub](https://github.com/KayKit-Game-Assets/kaykit-city-builder-bits-1.0) |
| OpenStreetMap and Terrarium elevation tiles | Streets, buildings, hills | Downloaded by the game |

### To download, in the order they are needed

Nothing at the moment.

### Still missing, no source chosen yet

These pieces are still plain coloured boxes. The Furniture Kit now covers the kitchen, bathroom, bedroom, TV and office pieces.

- Shops: checkout till, clothes rack, display case, vending machine, storage rack
- Office and bank: filing cabinet, safe
- Church, school, hall: pew, altar, chalkboard, stage
- Medical, police, fire, gym: hospital bed, gun locker, weights, treadmill
- Doors and windows: door model, window sash, broken glass
- Music, and recorded alien voices (today's calls are made by the game)

## Risks to keep in mind

- Pathfinding and sight checks cost processing time; on the iPhone the number of aliens thinking each moment may need a cap.
- A two-storey home takes about twice as long to lay out as before. A few very large buildings already took one to three seconds in the test browser, which may show as a pause on the iPhone when you walk up to one.
- In multiplayer the host decides what aliens know. Guests do not yet see the awareness pill.
- Breakable buildings (Art 5 and 6) are the heaviest change: every block grid takes memory, broken walls change pathfinding and sight, and in multiplayer the host has to share the damage with guests. Keep block detail to the buildings near you.
- The new look's night uses a few real lights; on phones keep it to about six lamps near you plus alien eyes.
- Animation files are large. The 64 GB drive has room, but phones load the "lite" set, so animations may need a trimmed phone version.
