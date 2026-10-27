# Wildgames

Home of **Afterstreet**: a lightweight, low-poly, first-person survival game played on your real city. Aliens and Missouri weather are the threats. The game is `play.html` plus the `assets` folder beside it, meant to live on a USB stick or SSD and run in a web browser on whatever it is plugged into, with no installer, launcher, host app or website.

Version 0.114.17. Every foundation step in [docs/DESIGN.md](docs/DESIGN.md) has a working first version, but none of it has been tried on real hardware yet. See [docs/ROADMAP.md](docs/ROADMAP.md) for what comes next and which packs to download, and [docs/TESTING.md](docs/TESTING.md) for the testing roadmap.

## Play

Download this repository (green **Code** button, then **Download ZIP**), unzip it onto a drive, and double-click **`play.html`**.

- **Play Springfield, MO** plays the built-in Springfield region: 50 miles in every direction from Park Central Square, from the Afterstreet map pack (about 45,000 buildings with their real use and storeys, every road, track, railway, river, creek and lake, the real hills, and the land cover: pasture, oak-hickory and pine-oak woods, scrub, glades, wetlands, lawns). It is cut into squares about 3.5 miles across that load as you travel. Where the map pack has gaps (parts of Ozark and east Nixa and a few rural edges whose buildings were never downloaded, and the many farms missing from the map), homes and shops are filled in along the streets and farmsteads (house, barn, shed, drive and stock pond) every 400 to 800 m along county roads, following the pack's own rules. On a drive it all works with no internet; on iPhone and iPad each square is saved the first time you go there, and **Save for offline** under Big region saves all of it (about 80 MB).
- **Play demo town** starts right away with a small made-up town.
- **Back to safe house** is for when you are stuck: it starts the map you last played again, with you at its safe house. Your things, the world and your progress are kept.
- **Make a map** builds a map of a real place from its name. It needs internet once; after that the map works offline.
- **Load map file** plays a map file you already have (an OpenStreetMap export, or one made by Make a map).
- **Connect game folder** (Chrome and Edge on computers) lets the game save into the `world`, `characters`, `maps` and `packs` folders on the drive. Pick the folder that contains `play.html`.
- In other browsers, progress is kept in the browser, and **Export saves** / **Import saves** move it between devices.

| Folder | Holds |
| --- | --- |
| `play.html` | The whole game: start page and game in one file |
| `assets/springfield/` | The built-in Springfield region, one file per square |
| `maps/` | Map files |
| `world/` | One save per map, written by the game |
| `characters/` | One file per survivor, written by the game |
| `packs/` | Item and scenario packs |
| `prototypes/` | Earlier versions, kept for reference |
| `assets/shaped/` | Shaped-piece content packs and their builder (see `docs/SHAPED.md`) |
| `art-tests/` | Art-style test scenes, not part of the game. Round 1: https://christianhreed.github.io/Wildgames/art-tests/voxel-test-street.html · Round 2: https://christianhreed.github.io/Wildgames/art-tests/voxel-test-street-2.html · Round 3, the stress test (today's buildings against blocks on a real Springfield square, with a benchmark): https://christianhreed.github.io/Wildgames/art-tests/voxel-stress-test.html. Add `?fps=1` to the game's link for a frame-rate counter to compare |
| `docs/` | The design document, the roadmap, the testing roadmap and the art direction (`docs/ART.md`) |

## Controls

| Action | Computer | Touch screen |
| --- | --- | --- |
| Move, look | WASD, mouse (arrow keys also turn) | Left stick, drag the view |
| Sprint, crouch | Hold Shift, Z | Run, Crouch (tap on, tap off) |
| Throw a stone | V | Throw |
| First or third person | P | Menu, First or third person |
| Hide in an emptied wardrobe or locker | E | Tap it; move or Search to come out |
| Pry a locked door, smash it | Hold E, swing at it | Hold Search, Swing |
| Shove emptied heavy furniture against the nearest door | B | Wall |
| Draw a window's curtains, then board it up (2 wood) | B at the window (once, then again) | Wall |
| Sleep, cook, fill a bottle | E at a bed, stove, sink, bath or toilet | Tap it |
| Swing, shoot | Click, right-click or F | Swing, Shoot |
| Jump | Space | Jump |
| Talk to a survivor | E | Ask a waiting survivor to come along; at the safe house E gives them a job (guard, gardener, scavenger); elsewhere E tells them to wait or follow |
| Take apart | Hold J | Take furniture, cars and bikes apart (axe, crowbar, wrench or toolkit) for wood, scrap, fibre and parts |
| Place | Build menu, then click | A ghost snaps to a half-metre grid, nearby walls and the ends of your walls; R turns it, Y snap on/off, right-click or Esc cancels |
| Search, gather, open or shut a door or window, ride, trade | E | Tap it, or Search |
| Eat, drink, medkit, bandage | 1, 2, 3, 4 | Tap the item |
| Flashlight | L | Light |
| Items and crafting | K | Items |
| Build | N (B and C for barricade and campfire) | Build, Wall, Fire |
| Switch weapon, use last item | Q, G | Items panel |
| Chat, mark a spot | Enter, X | Chat, Mark |

## Playing together

No server, website or internet is involved; the devices connect to each other directly. All devices must be on the same Wi-Fi, phone hotspot or cable, and all need the same `play.html`.

1. **Host:** start your world, then press **Invite player**. Copy the invite code and send it to your friend.
2. **Friend:** on the start page, paste it under **Play together** and press **Create reply code**. Send that reply code back.
3. **Host:** paste the reply code and press **Connect**. The host's map is sent across automatically.

The visitor plays in the host's world, and what they carry when they leave is saved to their own device. Up to 6 players; each needs their own invite. A slow device can tick **Join as co-pilot** to get a top-down map and guide a partner instead.

## What is in the game

- **World:** real streets and building outlines; every building can be entered. Rooms are laid out by what the building is (a home gets a living room, kitchen, bedrooms and bathroom; a church gets pews facing an altar), and what you find depends on the container. Doors and windows open, shut, break and can be boarded up; aliens batter their way in.
- **Power and water:** for the first two days the grid is up: street lights and windows light up at night and stoves cook without wood. At midnight going into day 3 the power fails across town (the screen says so), and going into day 5 the water mains fail: taps give nothing, though toilet cisterns still hold some. A **generator** (rare, in hardware stores, workshops and garages) brings one building back: set it up inside (from Items), pour in fuel (B; one can runs it about an hour), switch it on (E). It lights the building and runs its stove, but it is loud: aliens hear it from about 25 m and its noise builds heat, and at night the lit windows draw them unless the curtains are drawn. B on a switched-off generator picks it up again, with the fuel left in its tank.
- **Windows:** ground-floor windows are real openings: you can see out from inside and into rooms from the street. Press E at a window to open it, then walk through it to climb in or out (slowly; crouch over broken glass). Inside walls never end at a window, so every window can be climbed through.
- **Stealth:** aliens see through shut window glass (less well by day, not at all in the dark unless you carry a light). Draw the curtains (B at a window; in shops and offices it is a blind) to stop their eyes, and at night to hide your light: a flashlight indoors shows at every uncurtained window, and aliens outside within about 45 m come to look. Footsteps carry by what is underfoot: grass and carpet are quiet, leaf litter and snow a little louder, gravel tracks and railway ballast loud, and broken glass by a smashed window loudest. The giant feels the ground: it comes to look at a car engine from about 140 m and at someone sprinting from about 65 m.
- **Doors and hiding:** inside doors open and shut and block an alien's view; about a third of outside doors are locked (keys, pry quietly, or smash loudly); empty wardrobes and lockers are hiding places.
- **Hunted:** noise leaves "heat" where it was made (gunfire, engines, smashed doors, thrown stones, running). Enough heat in one spot brings a scout to look around: a pack of swarmers by day, a stalker by night. The full map shows hot areas in red. A stalker does not know where you are until it sees or hears you. From then on it hunts you for about four game hours, day or night, even if you travel far: it searches outward from where it last noticed you and checks hiding places where anyone was caught or seen going in. It lurks rather than charging: it creeps closer while you look elsewhere, slips out of sight when you turn towards it, and only rushes from about 6 m. The rush is very fast but lasts two or three seconds, and then it must get its breath back, so a sprint away can save you. Stalkers climb ladders to reach you on a roof, and drop off after you when you leave.
- **Survival depth:** alien hits can make you bleed (a bandage or medkit stops it; stalkers smell blood). A wound left open may turn infected: fever and slow health loss until you take antibiotics. Giants and long falls can break a leg: you limp and cannot run or climb until a splint lets it heal (about ten minutes). Fresh food goes off about half an hour after you pick it up, and rotten food can give you food poisoning. Rivers, toilets and, after the first day, taps give unboiled water: boil it at a stove (1 wood) or beside a campfire. A Rest bar runs down over about an hour; tired, you recover stamina slowly, and exhausted, your eyes start closing. Made weapons wear out with use: repair them at a tool bench (1 scrap) or patch them with duct tape. Fibre makes bandages, and wood with fibre makes a splint.
- **Buildings:** built the way game artists build modular kits (see `docs/BUILDINGS.md`): walls with real depth at the windows, sills, a plinth at the base, trimmed corners, eaves and fascia on pitched roofs (gables on about half the plain houses), copings on parapets, false fronts on small shops, canopies over glass entrances. Every building is made in code in a flat, painted style that follows how that kind of building really looks: lap-sided and brick homes with porches, shopfronts with kickplates, transoms, belt courses and cornices, ribbon-windowed offices, stone banks and libraries with arched windows, schools with window bands, fire stations with bay doors, metal sheds with roll-up doors, open parking decks. About half the windows light up at night. See `docs/BUILDINGS.md`.
- **Safe house:** you start at a small one-storey home on the edge of town, on a one-acre lot inside a white picket fence, with supplies in its chest. Aliens cannot come inside the fence; the gates are in the middle of the front and back.
- **The truck:** an old pickup sits broken in the safe-house drive: its front wheel is off and the hub rests on concrete blocks, the bonnet is up over a dead battery and a snapped fan belt, and the driver's door leans against the bed. Stand at its front left corner to see what it still needs: a **toolkit** (kept), a **spare tire**, a **car battery**, **engine parts** and 2 scrap for the door bolts. Garages, auto shops and gas stations have them, and traders sell them. Hold E there to fit each part; you watch it go into place (the mechanic background works faster). Once it runs, E at the driver's door drives it (it uses your fuel cans like any car), E at the back opens the **truck bed** to store gear, and E at the passenger door lets you **sleep in the cab**, where aliens that did not see you get in walk past. It drives with you into other parts of the Springfield region, bed and all. The big map marks where you left it.
- **Cars:** town cars are shaped models from the art chat's props pack (saloons, hatchbacks, pickups, vans, a few yellow taxis, police cars at police stations; 0.44). Their wheels roll as they move and the front ones steer, and engines make a low note that rises with speed.
- **Upstairs and roofs:** most two-storey buildings have stairs to a furnished upper floor with its own loot: bedrooms over homes, a flat over shops, restaurants and bars, offices over offices and banks, wards over clinics, bunks over fire stations, classrooms over schools. In flat-roofed buildings a ladder at the top of the stairs goes up through a hatch to the roof (aliens on the other floor cannot see you, but they can hear you and follow you up). Most low flat-roofed buildings have a ladder: press E at its foot to climb. Aliens cannot climb, but they can see you from the street and will wait under the ladder for a while. Walk off a roof edge (sprint at the low wall round bigger roofs) and you fall: drops over 3 m hurt, about 8 health per metre beyond that.
- **The new look, part two (0.44):** the art chat's second resource pack is in the game. Survivors are the silhouette-first version 7 and show the coat, raincoat, leather jacket, sweater, trousers or thermals they wear. Aliens are our own designs on their own skeletons: a four-legged swarmer, a hunched stalker with bone blades and a giant on its knuckles, with glowing eyes and vents; nests are pods with glowing seams. Furniture, street lamps, hydrants, benches, dumpsters, bushes, town cars, rain collectors and garden beds are shaped models too. The old Quaternius aliens and people were removed in 0.94.
- **Framed buildings (0.45):** near you, every building's outside walls are built from the art chat's building kit: a grid of posts and beams with wall, window, door, shopfront and garage-door panels set back between them, so the structure shows and windows and doors sit in the wall. Upstairs windows light up at night. Buildings further off keep their painted walls. Add `?oldbld` to the address for the painted walls everywhere.
- **Water and food that come back (0.43):** from the Build menu (N), under Food and water. A **rain collector** (2 wood, 2 scrap, outdoors) fills with clean water whenever it rains, faster in a storm, up to 10 bottles; E takes the water, B picks it up. A **garden plot** (3 wood, outdoors on open ground, off the road): E plants a **seed packet** (found in homes, hardware and outdoor stores, groceries and garages, or bought from traders). Plants grow over about a day and a half of game time while they are watered: the rain waters them, or E with a bottle (unboiled water is fine for plants). A plot left dry for half a day stops growing; autumn is slower, summer a little faster, and nothing grows in winter. Ripe plants show their vegetables; E harvests 3 fresh food (4 in summer) and half the time a seed packet back. B digs a plot up.
- **Furniture that works:** sleep in beds until morning (the bed becomes where you wake if you die), cook hot meals on stoves (1 food, 1 wood), fill bottles at sinks, baths and toilet cisterns until they run dry, and shove emptied wardrobes, dressers, fridges and lockers against doors.
- **Sound:** footsteps that change with the ground, doors, glass, hits, gunfire, alien calls you hear before you see them, rain, wind and thunder. Volume is on the start page.
- **Ground and trees:** the ground is laid out by code from how real land is covered: mown grass near homes and roads and long grass with wild flowers further out, leaf litter under woods whose edges thin out gradually, lush ground and muddy banks by water, bare earth and limestone on steep slopes and river bluffs, drier ridges. Trees are planted by kind: street trees along residential streets, yard trees behind houses, groves in parks, thick woods and lines of trees along rivers. The ground changes with the seasons, with snow in winter. See `docs/TERRAIN.md`.
- **Trees:** oak, maple, sycamore, poplar, pine and cedar (our own shaped models since 0.95.0), chosen by where they grow (oaks and maples on streets and in yards, sycamores and poplars on riverbanks, pines and cedars in the pine-oak woods). In autumn the broadleaves turn gold and russet.
- **Plants:** bushes, flowers, ferns, grass and rocks can be gathered for berries, herbs, fiber and stones, and grow back. Maps load in pieces, so a whole city can be one world on a computer.
- **Aliens:** swarmers in groups, a stalker that hunts at night by light and noise, a rare giant, and nests that spread between buildings.
- **Day and night (the new look's mood, Art 1):** days are cozy and nights are scary. The sky runs from a soft blue day with a light haze, through a warm dawn and a golden evening, to a near-black night with stars and a moon. At night a dark fog closes in to about 30 m and the edges of the screen darken; lamp pools, your flashlight and lit windows show through it. About a third of windows light up while the power is on, most warm and a few cold and flickering; once the power fails only a handful of cold, flickering ones are left. Some street lamps flicker. Aliens' eyes glow green, and the nearest ones throw a faint green light, so you see them coming in the dark.
- **Weather:** four seasons, rain, thunderstorms, heat waves, ice storms and tornadoes, with a body-warmth meter.
- **Clothes:** six places to wear something (head, top, outer, hands, legs, feet) and eleven kinds of clothes found in wardrobes, dressers, clothes shops, outdoor stores, fire and police stations and hardware stores, or bought from traders: winter coat, rain jacket, leather jacket, sweater, beanie, cap, helmet, work gloves, work trousers, thermals and boots. Wear and take them off from the backpack. Layers bring you up to comfortable on a cold night (a winter night needs more than a coat), but on a hot day they make you overheat. Rain soaks you unless your jacket keeps it off, and wet clothes keep you less warm; the Damp and Soaked marks show it, and you dry off indoors or by a fire. Leather jackets, helmets, work trousers and boots take part of an alien's hit and make bleeding less likely, but tear a little with every hit (duct tape patches them). Work gloves stop cuts from broken glass, and a cap shades you in the sun. What you wear stays on when you die.
- **Survivors (the new look's people, Art 2):** a roster of characters with a look, a background and skills that grow with use. Survivors are the shaped people from `assets/shaped/survivor.js`: tall and lean in a relaxed stance, carved faces, chunky hair, clothes as big angular shapes with contrasting caps at elbows and knees, chunky boots, and a tall pack with a bedroll. Every creator choice (build, body, skin, hair and hair colour, hat, face, top, bottoms, shoes, colours) is a set of pieces; the game fits them onto the animation skeleton and moves them with the same walk, run, crouch, swim, attack and other moves as before. What you wear shows: a helmet, beanie or cap from your clothes replaces your hat, boots replace your shoes, and work gloves cover your hands.
- **Items and packs:** design your own weapons, use items and throwables; share them as pack files. Items found in a friend's world come home with you.
- **Building:** barricades, permanent walls, a bed that makes a building your base, storage chests, repainting and demolishing buildings.
- **Getting around:** bicycles (quiet) and cars (fast, need fuel, draw aliens).
- **Traders, radios, goals:** trading posts, chat and map markers limited by radio range, and three goals: Endless, Reclaim, Escape.

## Not built yet, or simpler than the design

- QR codes for pairing; today the two codes are copied and pasted.
- A host cannot hand the game itself to someone who lacks `play.html`.
- The host's visitor rule offers accept, cap, or empty-handed, but not approving items one by one.
- A co-pilot has the map, markers and chat, but cannot manage a partner's inventory or crafting.
- Packs hold items and scenarios only. Furniture, alien types, character parts and loot tables cannot be modded yet.
- Items are made on the start page, not in an in-game editor.
- Map editing covers repainting, walls and demolition, not new buildings or changing room layouts.
- When taking a host's building changes, a clash asks one question for all buildings, not one per building.
- One-of-a-kind items rely on trust: a save file can be copied.
- Kitchen, bathroom, shop and church furniture is built from plain boxes until matching models are added.
- Doors and windows inside a building (between rooms) are open doorways; only outside doors and ground-floor windows work.
- Other players' gunshots and thrown items are not drawn.

## Not yet verified

Everything has been run only in an automated test browser on one machine with no graphics card.

- Real frame rates are unmeasured.
- **Make a map** was tested against a stand-in for the map servers, never the real ones.
- No real OpenStreetMap data has been loaded; only hand-made test maps, including a 40,000-building synthetic city.
- **Connect game folder** was tested against a stand-in folder, not a real drive.
- Multiplayer was tested between browser windows on one computer, not between separate devices, and not over Bluetooth.
- Touch controls were tested with simulated touches, not on a phone, and opening `play.html` from a drive on a phone is untried.

## Look and art

The art is in `assets/`, as small script files that `play.html` loads when it starts. Keep that folder beside `play.html`.

- `assets/full/` is loaded on computers: 4096 px textures.
- `assets/lite/` is loaded on phones and when View distance is set to Low.
- `assets/icons.js`, `btex.js`, `models.js`, `nature.js` and `map.js` are shared.

The files are made by the scripts in `tools/` from the packs listed in `CREDITS.md` (the HUD icons and the built-in map come from the Afterstreet design pack in `design/afterstreet_handoff/`). The built-in Springfield region is made by `build_region.py` from the map pack in `design/afterstreet_handoff/map_data/springfield_50mi/`. To rebuild the rest: run `paint_ground.py` and `paint_buildings.py`, then `build_art.py` and `node tools/export_shaped_plants.js > tools/out/shaped_plants.json` and `build_nature.py` twice each (once plain, once with `full`), then `build_models.py`, `build_vehicles.py` (only for the truck-part icons now; it needs the Car Kit) and `write_assets.py`, and `synth_sounds.py` for the few sounds the content chat's set does not cover (the rest are in `assets/audio/`).

Map data © OpenStreetMap contributors, available under the Open Database License.

## Licence

Afterstreet's code and its original content are under the **MIT License** (`LICENSE`): anyone may use, copy, change and share them, including in their own versions and mods, as long as the licence text stays with them. This covers the game, the Maps Builder, the tools, and the art, textures and sounds made for Afterstreet.

Some things keep their own terms:
- **Third-party libraries and art packs.** Each keeps its own licence, listed in `CREDITS.md` and, for the builder's libraries, `builder/lib/LICENSES.md`. Some packs are not in this repository and must be downloaded separately.
- **Map data.** It stays under the Open Database License (OpenStreetMap, Overture), whatever the code licence.

Content made by players with the game or the builder (maps, packs, designs) belongs to whoever made it.

## iPhone and iPad

The Files app on iPhone and iPad will not run the game from a drive. On those devices open https://christianhreed.github.io/Wildgames/ once in Safari, then Share → **Add to Home Screen**. `sw.js` keeps a copy on the device so it plays with no internet after that. Saves stay in the browser there; use Export saves and Import saves to move them.
