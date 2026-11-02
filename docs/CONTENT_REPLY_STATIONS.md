# Content chat reply: Workshop station models (2 November 2026)

Reply to "Request to content chat - Workshop station models". New pack `packs/afterstreet-stations.js` (already added to `packs/index.js`), built by `node workshop/tools/make_stations.js`. All models are in the `structures` group, metres, origin at the centre of the base, front facing +Z, flat colours. Look at them in the album scenes `stations_carshop`, `stations_boat`, `stations_hangar` and `stations_wardrobe`.

## Keys
| Station | Stage 1: frame | Stage 2: half built | Done |
| --- | --- | --- | --- |
| Car shop (6 x 20 m) | `station_carshop_s1` | `station_carshop_s2` | `station_carshop` |
| Boathouse and slip (5 x 18 m) | `station_boathouse_s1` | `station_boathouse_s2` | `station_boathouse` |
| Boat dock, plain, no roof | `station_boathouse_s1` | none | `station_dock` |
| Air hangar (20 x 28 m) | `station_hangar_s1` | `station_hangar_s2` | `station_hangar` |
| Wardrobe, open | none | none | `station_wardrobe_open` |

## What each one has
- **Car shop:** a survivor-built bay with a timber frame, plank walls, a ribbed tin shed roof (4.6 m at the door, 4.1 m at the back), a roll-up door coiled over the opening, a two-post lift in the middle, a tool wall on the left, and a bench on the right near the door with a green-screen terminal and a clipboard. Stage 1 is posts, plates and braces, stage 2 adds rafters, half-height walls, the lift, tool wall and bench.
- **Boathouse and slip:** y = 0 is the water line. The land end (z -9 to -3) stands 0.45 m above it and has a plank shed with the terminal on a post at the right. The slip (z -3 to +9) runs out between two walkways on piles, with an open channel 3 m wide in the middle, mooring cleats, a coiled rope tied off to a cleat, tyre fenders and a tin gable roof. The dock is the same without the shed and roof.
- **Air hangar:** a steel-framed gable hangar open at the front with two folded sliding doors parked at the sides, an apron marking on the slab (a yellow guide line, white edge lines and a yellow bar across the door line), a windsock on a pole at the front right, and a terminal kiosk on the left inside the door. Stage 1 is columns and beams, stage 2 adds trusses, walls to 3 m, the kiosk and the windsock.
- **Wardrobe:** timber, 1.8 m wide, both doors swung open (the left carries a mirror), a hanging rail with six garments on hangers, a shelf with folded clothes, a drawer and shoes on the floor.

## Points
- `station.use`: where the player stands to open the Workshop, with the direction to face the terminal. In the car shop, the dock and the hangar it is beside the terminal, and in the wardrobe it is in front of the open doors.
- `station.spawn`: where the finished design appears, facing out: 3.5 m past the car shop door, 9.5 m down the slip over the water, 6 m past the hangar front.
- Stage 1 models of the car shop and hangar have no points (nothing can be used yet).

## Notes for the game
- The footprints are the ones in `workshop/stations.js`. The hangar's apron marking is inside the slab, so it fits the 20 x 28 m footprint.
- The boat slip's channel is 3 m wide, so a boat up to the 6 m limit overlaps the walkways a little. A narrower hull sits in the channel.
- No lighting is baked in. The lamps (`lamp` colour) glow if the game lights that colour at night.
