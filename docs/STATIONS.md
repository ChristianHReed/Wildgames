# Build stations and walk-in vehicles (for the main chat)

What the Workshop chat built on 1 November 2026, and what the game needs to do with it.

## Stations

Five places in the game open the Workshop for one kind of thing. The table they share is `workshop/stations.js` (`window.AFTERSTREET_STATIONS`), loaded by both the Workshop and the game, so both agree on what each makes, how big it can be, what it costs to build and how a finished design comes back.

| Key | Station | Makes | Build it with | Spawns |
| --- | --- | --- | --- | --- |
| `workbench` | the existing tool bench | held weapons, tools, items | (already built: 6 wood, 3 scrap) | into the backpack, or on the bench if full |
| `carshop` | Car shop | land vehicles, trailers | 20 wood, 40 scrap, 20 nails, 2 car parts; flat ground by a road, or in a garage, warehouse or car dealer | out of the bay, facing the door, empty tank |
| `hangar` | Air hangar | helicopters, planes, gyrocopters, airships | 40 wood, 80 scrap, 30 nails, 4 car parts; open flat ground, 200 ft clear for planes | on the apron, empty tank |
| `dock` | Boat dock | boats | 30 wood, 10 scrap, 30 nails; on a shore with the slip over water 3 ft deep | in the slip, tied up |
| `wardrobe` | any wardrobe or closet | clothes | nothing: found or carried | hung in the wardrobe |

Sizes, footprints and the exact costs are in `stations.js` (`maxSize`, `footprint`, `cost`).

### The flow

1. Building a station: a new choice in the Build menu beside the tool bench (`doEdit({a:'station', q:{kind, id, x, y, yaw}})`, kept in `world.edits.stations` like `benches`). Taking it apart gives back most of its cost, as for the bench.
2. Using it (E at the station): open the Workshop for that station. Two ways, both supported:
   - **In a frame** (keeps the game running): an iframe overlay on `workshop.html?station=<key>&sid=<station id>`. When the player presses **Build in the game**, the Workshop posts `{type:'afterstreet-station-build', ...}` to the parent window.
   - **As a page**: save the game, go to `workshop.html?station=<key>&sid=<id>&return=play.html`. On Build, the Workshop leaves the message in `localStorage['afterstreet.station.out']` and goes back to `return`. On load the game reads it, then removes the key.
3. The message:

   ```text
   {type:'afterstreet-station-build', v:1, station, stationId, made, name, id,
    kind:'vehicle' | 'held' | 'item' | 'clothing', domain:'land' | 'air' | 'water' | null,
    size:[w, h, l] metres, cost:{item:count}, pack:<an afterstreet-pack with the one asset>}
   ```

4. The game checks it: the station exists, the kind matches the station (`AFTERSTREET_STATIONS.allows`), it fits (`AFTERSTREET_STATIONS.fits(key, size)`), and the player has the cost in their backpack plus containers within about 30 ft of the station. The Workshop already refuses designs with a 'bad' problem or too big for the station.
5. Build: take the cost, install the pack (`AfterstreetPacks.add(pack); AfterstreetPacks.install(SHAPED)`), keep the pack in the save (so the design survives a reload and travels with the world, like other packs), and spawn it at the station (above).
6. Stretch (Space Engineers' projector): instead of building at once, place a ghost of the design that players fill in with parts over time.

The Workshop's station mode shows only that station's designs and starters, hides the Maps Builder link, labels the back link "Back to the game", and shows the build cost before sending.

## Walk-in vehicles and mobile bases

Pack vehicles can now carry `interior` (list entry `AfterstreetPacks.vehicles[i].interior`, also on boats and aircraft):

```text
interior: {rooms:[{name, min:[x,y,z], max:[x,y,z], floorY, headroom, area, stand, crouch, floor, doors:[part names], open:[sides],
                   sides:{left, right, back, front, roof: 'wall' | 'door' | 'open'}, entry:[x,y,z], entryHeight,
                   cells:[[x,z], ...], walkIn, mobileBase, baseSlots}],
           walls:[[min, max], ...], mobileBase, baseSlots, rule}
```

All in the vehicle's own coordinates (Y up, +Z forward), as its model.

What the game needs:

1. **Getting in**: when the vehicle is stopped and a room's door is open (or the room has an open side), a player within reach of `entry` can walk in (E, or just walk). Inside, the player stands on `floorY` (in the vehicle's frame), stays within `min`/`max`, and collides with `walls` and closed doors. Crouch when `stand` is false.
2. **Doors**: `model.parts[name]` drawn beside the body, moved by `rig.parts[name]` (`turn` degrees about the axis through `pivot`, right-hand rule, or `slide` metres along the direction; `range[1]` or `open` is fully open). E at a door opens or shuts it. A `roll` door slides up into the roof: hide the part of it above the roof.
3. **Riding along**: if the vehicle moves with someone inside, they move with it (they sit on the floor; a sudden stop knocks them over at speed).
4. **Mobile base**: in a room with `mobileBase`, base items (bed, storage box, workbench, stove, generator, cable box) can be placed on `cells` (one item per cell, a bed takes two). They are stored in vehicle-local coordinates on the vehicle's save entry and drawn and used wherever it goes. Light and sleeping work as in a building; the vehicle counts as shelter from rain and cold.
5. **Hiding**: a closed room is a hiding place, like a wardrobe.

## Trailers and semis

`coupling: {hitch:{pos, type}}` on tractors (`fifth`, `ball`, `pintle`), `coupling: {coupler:{pos, type}}` on trailers (`kingpin`, `tongue`, `ring`). Types that go together: `M.COUPLES` in `workshop/craft.js` (fifth with kingpin, ball with tongue, pintle with ring or tongue).

- Reverse a tractor until its hitch is within about 1 ft 8 in of a trailer's coupler (heights within 6 in) and press E to couple; E again to uncouple.
- A coupled trailer turns about the hitch point and follows the tractor (each trailer axle drags; a simple pivot is fine). Trailers have `game.driveable:false`: never drive one on its own.
- Pack trailers should not spawn as parked cars: spawn them in truck stops, warehouses and depots, uncoupled, on their landing legs.

## Axles and drive (reminder)

`rig.wheels` lists every hub (any number of axles), `rig.drive.axles[]` says which steer and which are driven (see `docs/WORKSHOP.md`).

## Boats from the Workshop

Installed into `SHAPED.boats` under `pk_<pack>_<id>` with the boats pack's own tables (`models`, `rig`, `seats`, `helm`, `buoy`, `draught`); part names `motor`, `prop`, `sail`, `rudder`. The game's boat code should drive them as stock boats. They are listed in `AfterstreetPacks.boats` (with `interior` and `water`: weight, waterline, freeboard, capacity). Spawn: at the dock that built them; not mixed into marinas unless the host allows pack boats.

## Aircraft (new)

Installed into a new `SHAPED.aircraft` table: `models[key]` (body and parts: `rotor`, `tail_rotor`, `prop`, `rudder`, `elevator`, doors), `rig[key]`, `seats[key]`, `pilot[key]`, `wheels[key]` (gear hub points; draw the wheel model as for cars), `flight[key] {kind: heli | plane | gyro | airship, liftKg, massKg, cruiseMph}`. Bottom of the gear or skids at y = 0, nose +Z. Listed in `AfterstreetPacks.aircraft`.

Flying, simply:

- **Helicopter**: collective up/down, cyclic tilts and moves, pedals yaw; rotor spins up before lift-off; it lifts when `liftKg >= massKg + 85 per person aboard` (plus cargo).
- **Plane**: throttle; takes off above about 45 mph on a straight run (roads, fields, car parks: the hangar needs 200 ft clear); elevator pitches, rudder and ailerons turn; stalls below take-off speed.
- **Gyrocopter**: like a plane with a short take-off run and no hover.
- **Airship**: rises and sinks with ballast and vent, drifts with the wind, propellers push it slowly.
- Fuel as for cars (aviation fuel is ordinary fuel in the game). A crash at speed wrecks it and hurts those aboard.
- Stretch: this is a large feature; a first step is spawning aircraft at the hangar, sitting in them, and a basic helicopter hover.

## Files

| File | What it is |
| --- | --- |
| `workshop/stations.js` | the station table, the size check and the hand-off message (load it in play.html) |
| `workshop/craft.js` | domains, jobs, rooms, doors, couplings, mass, buoyancy, lift, exports |
| `workshop/build.js` | the build library (for the content chat) |
| `workshop/designs/*.js` | the seven sample vehicles |
| `workshop/tools/test_crafts.js` | builds and checks the designs; `--pack` writes `packs/workshop-crafts.js` |
| `packs/workshop-crafts.js` | the samples as a pack (not yet in `packs/index.js`: add it when walk-in rooms, trailers, boats or aircraft work in the game) |
| `packs/packload.js` | now also installs boats and aircraft, and keeps parts, interior and coupling for land vehicles |
