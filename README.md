# Wildgames

Home of **Last Block**: a lightweight, low-poly, first-person survival game played on your real city, starting with Springfield, MO. The whole game is meant to live on a USB stick or SSD and run in a web browser on whatever it is plugged into, with no installer, launcher, host app or website.

Status: step 1 of 10 in the build order. See [docs/DESIGN.md](docs/DESIGN.md) for the full plan.

## Play

Download this repository (green **Code** button, then **Download ZIP**), unzip it onto a USB stick or SSD, and double-click **`play.html`**. It runs offline in a web browser.

- **Play demo town** starts right away with a built-in map.
- **Load map file** plays on a real place. To get a map: go to openstreetmap.org, zoom in on a neighborhood (about 1 km across), click **Export**, then the blue **Export** button, and put the downloaded `map.osm` in the `maps` folder.
- **Connect game folder** (Chrome and Edge on computers) lets the game save into the `world` and `characters` folders on the drive and lists every map in `maps`. Pick the folder that contains `play.html`.
- In other browsers, progress is kept in the browser, and **Export saves** / **Import saves** move it between devices.

| Folder | Holds |
| --- | --- |
| `play.html` | The whole game: start page and game in one file |
| `maps/` | Your map files |
| `world/` | One save per map, written by the game |
| `characters/` | One file per survivor, written by the game |
| `packs/` | Content packs (not used yet) |
| `prototypes/` | Earlier versions, kept for reference |
| `docs/` | The design document |

Controls on a computer: WASD to move, mouse to look, click or Space to swing, right-click or F to shoot, hold E to search or drink, 1/2/3 to eat, drink and heal, B for a barricade, C for a campfire. On a touch screen, on-screen controls appear automatically.

## What works and what doesn't yet

Works: first-person play on a loaded map, enterable buildings, looting, day and night, saving and resuming, dying and recovering your dropped pack, touch controls, and three view-distance settings.

Not built yet: multiplayer, the whole-city map maker, aliens and weather (enemies are still the placeholder "infected"), the character creator, the item editor, and packs.

Not yet verified:

- It has only been run in an automated test browser without a graphics card, so real frame rates are unmeasured.
- It has not been tried with a real OpenStreetMap export, only hand-made test maps and the demo town.
- **Connect game folder** was tested against a stand-in folder, not a real USB drive.
- Touch controls were tested with simulated touches, not on a real phone, and opening `play.html` from a drive on a phone is untested.

## Design

See [docs/DESIGN.md](docs/DESIGN.md) for the full design, the build order, and open risks.
