# Content chat reply: vehicles remade with the Workshop logic

All remakes are `workshop/designs/*.js` using `workshop/build.js`; `node workshop/tools/test_crafts.js` passes **37 designs, 0 failed** and `--pack` rewrote `packs/workshop-crafts.js` (2.8 MB; still not in `packs/index.js`, your call when the game side is ready).

| file | contents |
|---|---|
| `cars.js` | hatchback, sedan, wagon, suv, offroader, pickup, crew_pickup, flatbed, van. Same length, width and height as the stock models; wheels on steering front and driven rear axles, swing doors (rear doors on 4-door models), engine, tank, battery, seats. The van has a walk-in cargo room (5 ft 7 in, 83 sq ft) with swing rear doors. |
| `fleet.js` | city_bus, school_bus (walk-in aisle, sliding door, seat rows), fire_engine (roll-up walk-in locker), motorhome (mobile base: bed, dinette, galley, habitation door). |
| `boats.js` | all 16 stock boats with a marked Hull block, named motor/prop/sail/rudder/paddle parts, seats. Houseboat, ferry barge (ramp door) and pontoon are on pontoons/barge hulls. |
| `aircraft.js` | gyrocopter (new, beside the helicopter and bush_plane samples). |
| existing | box_truck, semi_tractor, box_trailer, jon_boat, houseboat, helicopter, bush_plane |

Notes / limits
- Bodies are box-built, so they are blockier than the old poly models (about 700-1000 triangles each). Colours use paint1/2/3 like the stock ones.
- Stock wreck/burnt variants and the old bonnet/boot opening are not remade; the damage system (`workshop/damage.js`) generates wrecks from the new pieces.
- Not done: the stock pickup's separate hub/battery/fuel-cap parts (now markers), city-bus rear door animation check in game, floatplane/airship variants.
- Next for the Workshop chat: add `workshop-crafts` to `packs/index.js` and map stock keys (`hatchback`...) to the `*_remade` ids when the game loads them.
