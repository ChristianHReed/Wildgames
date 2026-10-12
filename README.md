# Wildgames

Home of **Afterstreet**: a lightweight, low-poly, first-person survival game played on your real city. Aliens and Missouri weather are the threats. The game is `play.html` plus the `assets` folder beside it, meant to live on a USB stick or SSD and run in a web browser on whatever it is plugged into, with no installer, launcher, host app or website.

Version 0.22. Every step of the build order in [docs/DESIGN.md](docs/DESIGN.md) has a working first version, but none of it has been tried on real hardware yet. See [docs/ROADMAP.md](docs/ROADMAP.md) for what comes next and which packs to download, and [docs/TESTING.md](docs/TESTING.md) for the testing roadmap.

## Play

Download this repository (green **Code** button, then **Download ZIP**), unzip it onto a drive, and double-click **`play.html`**.

- **Play demo town** starts right away with a built-in map.
- **Make a map** builds a map of a real place from its name. It needs internet once; after that the map works offline.
- **Load map file** plays a map file you already have (an OpenStreetMap export, or one made by Make a map).
- **Connect game folder** (Chrome and Edge on computers) lets the game save into the `world`, `characters`, `maps` and `packs` folders on the drive. Pick the folder that contains `play.html`.
- In other browsers, progress is kept in the browser, and **Export saves** / **Import saves** move it between devices.

| Folder | Holds |
| --- | --- |
| `play.html` | The whole game: start page and game in one file |
| `maps/` | Map files |
| `world/` | One save per map, written by the game |
| `characters/` | One file per survivor, written by the game |
| `packs/` | Item and scenario packs |
| `prototypes/` | Earlier versions, kept for reference |
| `docs/` | The design document and the testing roadmap |

## Controls

| Action | Computer | Touch screen |
| --- | --- | --- |
| Move, look | WASD, mouse (arrow keys also turn) | Left stick, drag the view |
| Sprint, crouch | Hold Shift, Z | Run, Crouch (tap on, tap off) |
| Swing, shoot | Click or Space, right-click or F | Swing, Shoot |
| Search, gather, open or shut a door or window, ride, trade | E | Tap it, or Search |
| Eat, drink, medkit | 1, 2, 3 | Tap the item |
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
- **Plants:** bushes, flowers, ferns, grass and rocks can be gathered for berries, herbs, fiber and stones, and grow back. Maps load in pieces, so a whole city can be one world on a computer.
- **Aliens:** swarmers in groups, a stalker that hunts at night by light and noise, a rare giant, and nests that spread between buildings.
- **Weather:** four seasons, rain, thunderstorms, heat waves, ice storms and tornadoes, with a body-warmth meter.
- **Survivors:** a roster of characters with a look, a background and skills that grow with use.
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
- Buildings are ground floor only.
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

- `assets/full/` is loaded on computers: 4096 px textures and more detailed creatures.
- `assets/lite/` is loaded on phones and when View distance is set to Low.
- `assets/icons.js`, `models.js`, `kit.js`, `nature.js` and `map.js` are shared.

The files are made by the scripts in `tools/` from the Afterstreet design pack in `design/afterstreet_handoff/` and from the packs listed in `CREDITS.md`. To rebuild: run `build_art.py`, `build_kit.py`, `build_creatures.py` and `build_nature.py` twice each (once plain, once with `full`), then `build_models.py`, then `write_assets.py`.

Map data © OpenStreetMap contributors, available under the Open Database License.

## iPhone and iPad

The Files app on iPhone and iPad will not run the game from a drive. On those devices open https://christianhreed.github.io/Wildgames/ once in Safari, then Share → **Add to Home Screen**. `sw.js` keeps a copy on the device so it plays with no internet after that. Saves stay in the browser there; use Export saves and Import saves to move them.
