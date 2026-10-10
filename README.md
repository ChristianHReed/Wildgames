# Wildgames

Home of **Last Block**: a lightweight, low-poly, first-person survival game played on your real city, starting with Springfield, MO. The whole game is meant to live on a USB stick or SSD and run in a web browser on whatever it is plugged into, with no installer, launcher, host app or website.

Status: early prototypes and a design. The full game described in [docs/DESIGN.md](docs/DESIGN.md) is not built yet.

## Play the prototypes

Download a file from `prototypes/` and double-click it. Each one is a single self-contained HTML file that runs offline.

| File | What it is |
| --- | --- |
| `last-block-3d.html` | First-person 3D survival on a real map. Every building can be entered; interiors are generated from the building's outline. |
| `last-block-2d.html` | The earlier top-down version of the same idea. |
| `driftwood-isles.html` | The first experiment: a top-down island-hopping RPG with boat crafting. |

### Loading your own map

1. Go to openstreetmap.org and zoom in on a neighborhood (about 1 km across works best).
2. Click **Export**, then the blue **Export** button. It downloads `map.osm`.
3. In a Last Block prototype, click **Load map file** and pick it, or use **Play demo town**.

## Known limits of the prototypes

- Tested only with hand-made test maps and the demo town, not yet with a real OpenStreetMap export.
- Frame rate of the 3D version has not been measured on real hardware.
- Ground floor only; no stairs or upper floors.
- Enemies are the old "infected" placeholder, not the aliens in the design.
- No multiplayer, no touch controls, no saving to the drive yet.

## Design

See [docs/DESIGN.md](docs/DESIGN.md) for the full design, the build order, and open risks.
