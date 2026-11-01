# Building vehicles that work (for the content chat)

How to remake the game's vehicles, and make new ones, so they work as machines: wheels on axles, power through a driveshaft, doors that open, rooms you can walk into, trailers that couple, boats that float and aircraft that fly. The same logic runs in the Workshop's editor (`workshop.html`) and in a script library for building many vehicles at once (`workshop/build.js`).

Added 1 November 2026 by the Workshop chat.

## The rules

A vehicle is blocks with jobs, as in Space Engineers, Stormworks and Trailmakers. The jobs decide what it can do.

**Every vehicle**

1. **Nothing floats loose.** Every block touches another (the Check tab's "Select loose pieces" finds the rest). Gaps of more than about half an inch count as loose.
2. **Seats are where people sit.** The first seat is the driver, pilot or helm.
3. **Moving parts are their own parts.** Doors, rotors, propellers, rudders, elevators, outboards and sails get their job, and pieces with the same name move together. Each is exported with a rig (pivot, turn or slide, range) in the format the machines and boats packs already use.
4. **Rooms are walk-in space.** A Room is a hidden box filling the space inside (floor at its bottom). It needs a way in: a Door touching it, or an open side. The Workshop measures it:
   - headroom of **5 ft 9 in** or more means you stand up in it; 3 ft 1 in to 5 ft 9 in means you crouch;
   - the way in must be at least **5 ft 3 in** tall to walk in;
   - the floor must be held up by blocks under at least 60% of it;
   - nothing may stand in it except seats, beds, storage and blocks ticked **Furniture**;
   - a walk-in room with standing headroom and **43 sq ft** (4 m²) of floor is a **mobile base**: players can fill its floor with beds, storage and benches that travel with the vehicle.

**Land vehicles**

5. **Wheels are on axles.** Each Axle block carries a pair of wheels on its ends; the wheel model is made once (Wheel view) and copied onto every hub. No axle, no wheels.
6. **Power runs engine → gearbox → driveshaft → driven axles.** Tick Driven on the axles the engine turns and Steers on the ones that steer. The Workshop draws the driveshaft and differentials.
7. **Trailers** (class Trailer) have axles but no engine, and a coupling: a **Kingpin** under the front of a semi trailer, or a **Tongue** on a small trailer. **Semi tractors** have a **Fifth wheel** hitch. A hitch and a coupling go together when the types match (fifth wheel and kingpin, ball and tongue, pintle and ring) and the hitch's top is at the coupling's bottom height (within 6 in).

**Boats**

8. **The hull floats it.** Mark the watertight volume with a hidden **Hull** block filling the inside of the hull (a pontoon boat: one per pontoon). The Workshop works out the weight from the blocks (panel area times the material's weight), the waterline from the hull's volume, how far the side stands above the water, and how many it carries (no more than the US Coast Guard rule for small boats, length × beam in feet ÷ 15).
9. **Something moves it:** an Outboard with a Propeller under it (the outboard swings to steer), a Propeller with a Rudder, a Sail with a Rudder, or Oars.
10. Exports in the boats pack's own format, water line at y = 0, part names `motor`, `prop`, `sail`, `rudder`, so the game's boat code can drive it as it is.

**Aircraft**

11. **It must lift its weight plus a pilot (85 kg, 187 lb each aboard).**
    - Helicopter: main rotor disc × about 3.7 lb per sq ft (a Bell 206 carries about that); one main rotor needs a **Tail rotor**.
    - Plane: wing area from above × about 12 lb per sq ft (a Cessna 172 is about 14); needs a Propeller (with an Engine) or a Jet, an **Elevator** and a **Rudder**, and something to land on.
    - Gyrocopter: a free rotor and a pushing propeller.
    - Airship: gas envelope volume × about 1 oz per cu ft (helium).
12. Lands on **Skids or floats**, or on wheels on axles (the landing gear; tick Steers on the nose gear).

## Station sizes

What each station in the game can build (bigger designs still export in packs, but cannot be built at the station):

| Station | Makes | Biggest (wide × tall × long) |
| --- | --- | --- |
| Car shop | land vehicles | 10 ft 6 in × 14 ft 5 in × 55 ft 9 in |
| Air hangar | aircraft | 52 ft 6 in × 39 ft 4 in × 78 ft 9 in |
| Boat dock | boats | 19 ft 8 in × 26 ft 3 in × 52 ft 6 in |
| Workbench | weapons, tools and items | 3 ft 11 in × 3 ft 11 in × 8 ft 6 in |
| Wardrobe | clothes | no limit |

## The build library

A design is a short script in `workshop/designs/<name>.js`:

```js
module.exports = function(WSB){
  var b = WSB.create({id:'box_truck_walkin', name:'Box truck (walk-in)', domain:'land', cls:'truck'});
  b.wheels(0.42, 0.28);                                  // wheel radius and width (m)
  b.axle(2.05, {steer:true}); b.axle(-1.9, {driven:true, track:0.9});
  b.box([-0.95, 0.78, 2.2], [0.95, 1.45, 3.15], {c:'paint2', name:'hood'});
  b.shell([-1.12, 1.0, -3.85], [1.12, 3.0, 0.45], {open:['back'], room:'cargo'});   // floor, roof, walls and the Room inside
  b.door([-1.12, 1.0, -3.92], [1.12, 3.0, -3.87], {kind:'roll', name:'roll-up door'});
  b.engine([0, 1.1, 2.6]); b.seat([0.45, 1.05, 1.0], {mx:true});
  return b;
};
```

Metres; Y up; the vehicle faces +Z; its right side is +X; the ground (or a boat's keel) at y = 0. Colours are palette names (`paint1`, `glass`, `underside`, `chrome`, `seat` ...) or `'#rrggbb'`.

| Call | What it makes |
| --- | --- |
| `WSB.create({id, name, domain: land / air / water, cls, paint, tank, topSpeed})` | a new design; the classes are listed below |
| `b.block(shape, pos, [w, h, l], opt)` | any toolbar shape: box, bev, wedge, cyl, tube, cone, plate, corner, incorner, pyramid, prism, hex, ball, dome, arch, quarter. opt: `c` colour, `m` material, `mx` mirror left/right, `rot` [x, y, z] degrees, `name`, `fn` job, `hidden`, `fitting` |
| `b.box(min, max, opt)` | a box from two corners |
| `b.job(piece, fn, settings)` | give a piece a job |
| `b.wheels(r, w)` | the wheel model, copied onto every hub |
| `b.axle(z, {steer, driven, track, name})` | an axle with its pair of wheels |
| `b.gearbox(pos)` | where the driveshaft leaves (drawn behind the engine if there is none) |
| `b.engine(pos, size)`, `b.tank`, `b.battery`, `b.storage(min, max)` | hidden job markers |
| `b.seat(pos, {mx, size})`, `b.bed(pos, size)`, `b.light('headlight' or 'taillight', pos, size)` | seats, beds and lamps |
| `b.room(min, max, name)` | a walk-in room |
| `b.shell(min, max, {open:[back, front, left, right, roof], wall, floor, c, floorC, room})` | a box body around a room, leaving the named sides open, with the room inside |
| `b.door(min, max, {kind: swing / roll / slide / ramp, hinge: front / back / top / bottom / outer / inner, mx, name})` | a door; mirrored doors become a left and a right door |
| `b.hitch(pos, 'fifth' / 'ball' / 'pintle')`, `b.coupler(pos, 'kingpin' / 'tongue' / 'ring')` | couplings |
| `b.rotor(centre, radius, {blades})`, `b.tailRotor(centre, radius)`, `b.propeller(centre, radius)` | spinning parts |
| `b.wing(min, max)`, `b.elevator(min, max)`, `b.rudder(min, max)`, `b.skid(min, max, {mx})`, `b.envelope(centre, length, diameter)` | aircraft parts |
| `b.hull(min, max)`, `b.outboard(transomTop, {height})` | boat parts (an outboard comes with its propeller and engine) |
| `b.finish()` | builds it: `{doc, asset, checks, bad, report}` |

Classes: land `car, pickup, van, truck, bus, rv, semi, trailer`; air `heli, plane, gyro, airship`; water `rowboat, motorboat, sailboat, houseboat, raft, barge`.

## Testing

```
node workshop/tools/test_crafts.js              check every design
node workshop/tools/test_crafts.js box_truck     check one
node workshop/tools/test_crafts.js --pack       also write packs/workshop-crafts.js
node workshop/tools/test_crafts.js --verbose    print every check
```

Each design is built and checked against the Workshop's own checks and these rules: trucks, buses and trailers have a walk-in room; motorhomes and houseboats are mobile bases; boats float and aircraft fly; semis have a hitch and trailers a coupling; every wheel is on an axle; nothing is loose; every moving part moves; it fits its station; under 6,000 triangles. Every tractor is tried against every trailer (type and height). Finally the pack is installed into the game's tables (cars, boats, aircraft) to prove it loads. Exit code 1 on any failure.

The seven samples in `workshop/designs/` all pass: a walk-in box truck (roll-up door, mobile base), a semi tractor (fifth wheel, two driven axles), a 53 ft box trailer (kingpin, barn doors, mobile base), a jon boat, a pontoon houseboat (walk-in cabin, mobile base), a utility helicopter (sliding doors, crouch-in cabin) and a bush plane. The Workshop opens copies of them from Designs → "Open a remade vehicle".

## What to remake

Suggested order, keeping each stock model's look and size:

1. `props` vehicles: the box truck, van, flatbed and pickups (load beds as open-top rooms are not walk-in; vans get crouch-in rooms behind the seats).
2. `fleet`: the bus (walk-in aisle), the semi and its trailers, motorhomes as mobile bases.
3. `boats`: keep the boats pack's look; mark hulls, outboards and props so floating and capacity come from the hull.
4. Aircraft: the game has none yet; start from the helicopter and bush plane samples.
