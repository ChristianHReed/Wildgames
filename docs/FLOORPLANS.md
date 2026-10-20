# Floor plans

`assets/shaped/floorplan.js` makes the inside layout of any building and proves that a person can walk to every room. Made by the design chat (20 October 2026). Plain JavaScript, no dependencies: a `<script>` tag gives `window.FLOORPLAN`, `require()` works in node.

```js
var plan = FLOORPLAN.gen('house', 12, 9, {seed: b.id, storeys: 2});   // kind, width, depth in metres
var ok   = FLOORPLAN.check(plan);                                     // {ok, errors[]}
```

## What it makes

- **Rooms** tile the footprint exactly, with room types that already exist in `ROOMS` in `play.html` (living, kitchen, bedroom, bath, market, stock, nave, vestry, classroom, bullpen, ward...) plus new ones: `cells`, `cafeteria`, `boardroom`, `openplan`, `control`, `pumphouse`, `substation`, `boilerhouse`, `plantroom`, `trophy_hall`, `chapel_hall`, `pharmacy`, `cafe`, `deli`, `jeweller`, `kidsroom`, `nursery`, `laundry`, `shower_room`. Their fixtures are in `interiors.roomFixtures` (same form as `ROOMS`).
- **Two layouts.** A *hub* plan (most shops, churches, halls, warehouses, small houses): one big front room with the entrance, and a band of rooms along the back whose doors open straight into it. A *spine* plan (offices, schools, clinics, hospitals, police, apartments, bigger houses): a corridor across the building with a band of rooms each side, and a vestibule from the front door to the corridor. Upper storeys are always spine.
- **Doors** are 1.0 m gaps (two bays) already cut out of the walls, centred on the 0.5 m grid. Corridors are 1.0 m (houses), 1.5 m, or 2.0 m (schools, hospitals) wide.
- **Staircases** sit in a 2.5 x 5.0 m stair hall at the back-left corner, entered from the hall or corridor: the run is 1.0 x 3.6 m, and upstairs the run is a hole (`stair.hole`) with a 1.0 m walkway beside it to the landing. A building too small for one stays one storey and says so in `plan.note`.
- **keepClear** rectangles: 1.0 x 2.2 m across every door, and in a hub room the aisle along the back wall and the lane from the entrance to it. Do not put furniture in them; this is what keeps the walkway unobstructed once the room is furnished. Rooms with `furnish: false` (halls, stair halls) stay empty.
- Everything sits on the 0.5 m bay grid, so walls line up with the voxel wall system (0.56). Walls are centre lines, 0.18 m thick.

## How the game can use it

1. Replace the room splitter in `genInterior` for storeys it handles badly: call `gen` with the footprint's oriented bounding box, rotate by `plan.turned` and the footprint angle, intersect with the real polygon (rooms outside it are dropped; their doors go with them).
2. Build `plan.walls` with the walls pack and `plan.doors` with `walls.openings`.
3. Furnish each room with `interiors.roomFixtures[room.type]` avoiding `plan.keepClear`.
4. Call `FLOORPLAN.check(plan)` in development: it returns the room that cannot be reached.

`opt.entrance` shifts the entrance along the front wall (metres from centre); `opt.seed` varies the room sizes.

## The check

A 0.6 m wide agent is walked over a 0.1 m grid from the entrance (and, upstairs, from the top of the stairs). Walls block, stair holes block. Every room on every storey must be reached, rooms must tile the footprint and be at least 1.5 m across (halls 1.0 m). `node assets/shaped/src/floorplan_test.js` runs 3,375 plans (every kind, five widths, six depths, one to three storeys) and exits non-zero if any fail. Sealing a door in a test plan is reported as the room it cuts off.

## Limits

Footprints are rectangles (use the bounding box for L-shapes and cut). Windows are not placed here: put them on exterior walls wherever the wall pieces allow. Rooms are not rotated to follow a slanted street; rotate the whole plan.
