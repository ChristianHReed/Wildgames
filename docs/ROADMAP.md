# Afterstreet development roadmap

Last updated: 12 October 2026, at version 0.30. This one document holds both the game features still to build and the free art and sound packs each step needs.

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

## Next versions

Each is small enough to try on the iPhone before the next one starts. Assets needed are listed in brackets.

| Version | Features | Assets needed |
| --- | --- | --- |
| **0.31** | Upper floors for shops, offices and flats (today only homes have them), and stairs up to roofs from inside. | None |
| **0.32** | Stealth extras: curtains and covered windows so aliens do not see your light; louder footsteps on gravel and glass, quieter on grass; the giant feels sprinting and engines from far away. | None |
| **0.33** | Power and water fail on a set day; generators and fuel to run them. | None |

## Feature backlog by area

Ticked items are in the game.

### Moving over the ground
- [x] Sprint with stamina
- [x] Crouch (slower, quieter, harder to see)
- [x] Slow climb through windows; broken glass cuts unless crouched
- [x] Hills slow you going up
- [x] Swimming drains stamina; wet clothes lower warmth
- [ ] Vault low fences and props (needs props to be solid first)
- [ ] Surface noise: louder on gravel and glass, quieter on grass
- [ ] Carry weight slows you
- [x] Fall damage

### Buildings
- [x] Outside doors and ground-floor windows open, shut, break, board up
- [x] Rooms laid out by building kind; loot by container
- [x] Safe house and town square safe zones
- [x] Interior doors that shut and break line of sight
- [x] Hiding spots: wardrobes and lockers (under beds still to do)
- [x] Locked doors with key, pry or smash
- [ ] Curtains or covered windows so aliens do not see your light
- [x] Furniture uses: sleep, cook, fill water, barricade a door
- [x] Stairs and upper floors in homes; ladders to flat roofs
- [ ] Upper floors in shops, offices and flats
- [ ] Power and water fail on a set day; generators

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
- [ ] Giant that feels sprinting and vehicles from far away

### Survival
- [x] Injuries with different treatments (bleeding, infection, broken leg)
- [x] Food spoilage, cooking, boiling water
- [x] Sleep and tiredness
- [x] Weapon wear, repair at a tool bench or with duct tape
- [ ] Clothing layers: warmth, wetness, protection
- [ ] Farming and rain collectors

### World and long game
- [x] Sound (music still to do)
- [ ] Other survivors to recruit, with needs and jobs
- [ ] Horde nights against your base
- [ ] Loot that does not come back
- [ ] Vehicle repair, siphoning fuel, trunks
- [ ] Skill books and more skills
- [ ] Map item with notes, instead of always knowing where you are

## Assets

All of these are free. Quaternius and Kenney packs are CC0 (no credit required, though `CREDITS.md` lists them anyway). The "Standard" version of a Quaternius pack is the free one.

### Already in the game

| Pack | Used for | Source |
| --- | --- | --- |
| Bestiary – Dungeon Monsters Kit (Standard) | Alien models | [quaternius.com](https://quaternius.com) |
| Downtown City MegaKit (Standard) | Building fronts | [quaternius.com](https://quaternius.com) |
| Stylized Nature MegaKit (Standard) | Trees, bushes, flowers, rocks | [quaternius.com](https://quaternius.com) |
| KayKit Furniture Bits | Beds, sofas, chairs, tables, cabinets, lamps | [GitHub](https://github.com/KayKit-Game-Assets/kaykit-furniture-bits-1.0) |
| Universal Base Characters (Standard) | Survivor bodies and hairstyles | [quaternius.com](https://quaternius.com) |
| Universal Animation Library and Library 2 (Standard) | Survivor moves | [itch.io](https://quaternius.itch.io/universal-animation-library-2) |
| Kenney Furniture Kit | Kitchen, bathroom, bedroom, office pieces | [kenney.nl](https://kenney.nl/assets/furniture-kit) |
| Kenney Impact Sounds and RPG Audio | Footsteps, doors, glass, hits | [kenney.nl](https://kenney.nl/assets/impact-sounds) · [kenney.nl](https://kenney.nl/assets/rpg-audio) |
| KayKit City Builder Bits | Cars, street lights, benches, hydrants, dumpsters | [GitHub](https://github.com/KayKit-Game-Assets/kaykit-city-builder-bits-1.0) |
| OpenStreetMap and Terrarium elevation tiles | Streets, buildings, hills | Downloaded by the game |

### To download, in the order they are needed

Nothing needed right now: every pack on the list has been added.

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
- Animation files are large. The 64 GB drive has room, but phones load the "lite" set, so animations may need a trimmed phone version.
