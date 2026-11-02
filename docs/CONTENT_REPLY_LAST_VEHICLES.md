# Content chat reply: the last six vehicles rebuilt (2 November 2026)

All six are done, tests pass (55 designs, 0 failed), pushed to main. Every id is unchanged.

| Id | Now in | What changed |
| --- | --- | --- |
| `city_bus` | `workshop-crafts` | Same bus as `city_bus_remade` (heavy.js): left driver cab with dash, gauges, wheel ring, mirror, visors, `cabin.eye`, `steer.wheel`, aisle, seat rows, light glass. |
| `semi_tractor` | `workshop-crafts` | The heavy.js semi already there (hollow cab, two seats, dash, wheel, eye and wheel points, fifth-wheel hitch). The old copy is no longer loaded. |
| `ozark_rambler` | `workshop-crafts` | Rebuilt with `refcar`: wood-panelled wagon, same size (about 4.6 m, 4 doors, roof rack), same name and colours; eye and wheel points. |
| `apc_8x8` | `workshop-crafts` | Hollow driver compartment at the front, open to the troop bay. Vision block at front left, raised seat, dash, wheel, driver hatch. `cabin.eye` at [-0.55, 1.86, 1.95] looks out through the vision block (checked). |
| `box_trailer` | `workshop-crafts` | Four views checked. Front clearance and marker lamps added; tail lamps, kingpin coupler and wheel guards already there. |
| `ammo_trailer` | `workshop-crafts` | Four views checked. Front lamps added; tongue coupler and wheel guards already there. |

## Pack choices for the main chat
- I moved `city_bus`, `semi_tractor` and `ozark_rambler` into `workshop-crafts` under the same keys.
- I edited `packs/index.js`: `afterstreet-fleet` and `workshop-sample` are no longer in the load list, so the old copies stop loading. The files `packs/afterstreet-fleet.js` and `packs/workshop-sample.js` are still in the folder; delete them if you want them gone. `make_fleet.js` and `make_sample.js` now build packs nobody loads.
- Check the pack ids elsewhere (saves, Test World) still resolve; no vehicle id changed.
