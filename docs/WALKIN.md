# Walk-in vehicles, mobile bases and trailers (0.121.0)

Built from the Workshop's `interior` and `coupling` data on pack vehicles (see the Workshop note "build stations and walk-in vehicles").

## Which vehicles
Every pack vehicle whose first interior room has a way in and a door: box trucks (every stock box truck is the walk-in model), 53 ft box trailers, army cargo trucks, city and school buses, the motorhome, vans and the green van, ambulances, fire-engine lockers, the ammo trailer.
- **Mobile bases** (`game.mobileBase`, `baseSlots` > 0): box truck (8 spaces), box trailer (32), army cargo truck (5), buses (7 to 8), motorhome (9).
- **Load space only** (no base spaces): vans, ambulances, fire-engine lockers, ammo trailer: inside, E opens the load space as a store that travels with the vehicle.

## How it plays
- Walk to the way in (the back for trucks, trailers and vans; the side door for buses and the motorhome) of a stopped vehicle: **E opens the door**, **E again climbs in**.
- Inside you stand on its floor, walk about within its walls (low rooms make you crouch), and ride along if someone drives it.
- **E near the door** shuts or opens it. With it **shut, aliens cannot see you** inside.
- Walk out through the open way in.
- **Build (N) inside a mobile base** shows *Fit out*: Bed (5 wood, sleep in it), Locker (4 scrap, storage), Workbench (6 wood, 2 scrap, repairs). Each goes on the floor nearest you, clear of the door and the other fittings; *Take out* gives half the cost back.
- Fittings, the locker's contents and the door are kept with the vehicle (`world.edits.vbase` by vehicle id), saved with the map, and carried when you drive it into the next map square.

## Trailers
- A trailer has no engine: trying to drive one says so.
- Reverse a semi tractor until its hitch is at the trailer's front (within about a metre, roughly in line): it hooks on. The trailer pivots on the hitch behind you (it cannot fold back past about 70 degrees).
- On foot at the back of the cab, **E unhooks** it.
- A hooked trailer, its fittings and store go with you into the next map square. Hook-ups are saved (`world.edits.vtow`).

## Also in 0.121.0
- Door parts of pack vehicles (cab doors, back doors, bus doors) are drawn; before, they were missing. Open doors roll up (roll-up doors) or swing out on their hinges.
- About half the machines and service trucks left on the roads (fire trucks, ambulances, school buses, garbage, tow, dump and bucket trucks, cement mixers, cranes, sweepers, rollers, loaders, bulldozers, forklifts, diggers) now still run and can be driven; the rest are wrecks, and the heaps of spoil and rubble are scenery.
- The Test World's walk-in truck, semi and trailer no longer sit inside the parked cars.

## Finished in 0.121.1
- **Doors move:** the way in eases open and shut (roll-up doors slide up into the roof, others swing out on their hinges); the driver's cab door swings open for a moment as you get in or out.
- **Shelter:** inside a walk-in room you stay dry and much warmer (more with the door shut); sitting in any car or truck keeps the rain off and some of the cold.
- **Multiplayer:** the locker's contents are shared with everyone on the map, as the door and fittings already were.
- **Every car and truck has a trunk to keep things in**, like the truck at the safe house: the first Y (or the Trunk button) searches it; after that Y opens it as storage (with *Siphon a can of fuel* inside), and it also opens with E at the back of the car. It rides with the car and goes with you into the next map square.
- **Sleep in any vehicle:** sitting in a stopped car, truck or boat, press Y, or Menu > *Sleep in this seat*. With aliens close you cannot; asleep in a vehicle, aliens do not see you.
- The low van and ambulance load spaces still make you crouch: that is their real height, not a gap.
- Checked: the ambulance that seemed to throw you out in a test had been driven over the edge of a map square, which swaps in the same vehicle on the next square; nothing was wrong with it.
