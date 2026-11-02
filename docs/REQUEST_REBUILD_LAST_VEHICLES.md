# Request to the content chat: rebuild the last vehicles like the others (1 November 2026)

From the main (game) chat. After the pass 7 fleet rebuild, the game loads 33 pack vehicles. 27 have a `cabin.eye` and `steer.wheel` point and use the reference look recipe. These six do not:

| Pack and id | What it is now | What it needs |
| --- | --- | --- |
| `afterstreet-fleet` / `city_bus` | Old poly model from the first fleet pack; no cabin, no eye point. The rebuilt `city_bus_remade` exists beside it. | Rebuild under the same id with `heavy.js` (`cab` builder): driver cab on the left with dash, gauges, wheel ring, mirror, visors; aisle and seat rows; light glass; `cabin.eye` and `steer.wheel`. |
| `afterstreet-fleet` / `semi_tractor` | Old poly model; no cabin, no eye point. The Workshop `semi_tractor` exists beside it. | Rebuild under the same id with the truck cab builder, the same as the Workshop semi: hollow cab, two seats, dash, wheel, eye and wheel points, fifth-wheel `coupling.hitch`. |
| `workshop-sample` / `ozark_rambler` | The first Workshop sample car; no cabin, no eye point. | Rebuild with `refcar` (the reference look: raked glass, tumblehome, wheel openings cut, arch frames, rounder wheels, light glass with brown seats), keeping its size and name. |
| `workshop-crafts` / `apc_8x8` | Rebuilt in pass 7, but the driver compartment is a closed hull, so there is no eye point. | A driver's hatch or vision block at the front left, a small driver station inside (seat, dash, wheel or tillers), and a `cabin.eye` at the vision block so first person shows the view out through it. |
| `workshop-crafts` / `box_trailer` | Rebuilt; a trailer, so no driver. | Nothing for the eye. Check: four-view render, wheel openings, lights both ends, `coupling.coupler` kingpin. |
| `workshop-crafts` / `ammo_trailer` | Rebuilt; a trailer, so no driver. | Same check as the box trailer, with a tongue `coupling.coupler`. |

## Rules to follow
The "Vehicle design and look rules" guide in the Project, all seven passes. In particular:
- render four views before calling it done;
- cut wheel openings with `wall()`, finish them with `arch()` and use `wheelLook()`;
- glass is light and see-through (`glassL`), seats are brown;
- keep the size inside the car shop (3.2 m wide, mirrors included);
- `node workshop/tools/test_crafts.js` passes.

## Ids
Keep every id the same, so the game, saves and the Test World pick up the new models with no changes. For the two `afterstreet-fleet` vehicles, either rebuild them inside that pack or move them into `workshop-crafts` under the same keys. Tell the main chat which you chose, so the game stops loading the old copy.

## What the game will do
Nothing new is needed: any vehicle with `cabin.eye` already gets the in-cabin first-person view. The Test World parks every pack vehicle along its street, so all six will be there to check.
