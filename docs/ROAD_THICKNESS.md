# Roads 12 inches below the pavement (1 November 2026)

Roads were a flat sheet drawn 9 cm over the ground, level with the pavement. Paved streets 6 m wide or more (the ones that already had pavements and kerbs) now **lie 12 in (0.3048 m, `ROAD_T`) below their pavements**, with a vertical kerb face on each side.

## What changed
- **`engine/world.js`**: `ROAD_T = 0.3048`. `buildSunk(w)` lists the sunk road segments (not the stretches on bridges or in tunnels). `roadOff(x, y)` says whether a point is on one. `hAt()` and `groundAt()` add it, so the player, vehicles, aliens, props and road markings all stand on the lower road without any change of their own. Flat worlds (no height grid) use `groundAt` too.
- **`engine/buildings.js`**: the sidewalk is now two 2 m strips beside the road (it used to be one wide sheet under it); the road surface is drawn `ROAD_T` lower; `sunkWalls()` builds the 12 in kerb face down each side in 2 m pieces that follow the ground; paths, rail and small roads meeting a sunk street stop at its kerb instead of crossing it; the `kerb_strip` model stands on the road surface.
- **`engine/dig.js`**: the terrain is cut away over sunk roads with the same mask the digging uses (columns 0.5 m square, inside the road edge by 10 cm), so the road shows in a trench. This is why `dgPrep` also runs when there is a sunk road.
- **`assets/shaped/src/ground.py` and `ground.js`**: `kerb_strip` is 30.5 cm tall (was 15 cm).
- **`play.html`**: the player's height target in flat worlds uses `groundAt`.

## What stays the same
Streets under 6 m, gravel roads, paths, rail, bridges and tunnels are not sunk. Markings, manholes, cracks and the like are placed with `hAt`, so they sit on the lower road by themselves.

## Checked and not checked
Looked at in the game on the test street (kerb faces both sides, pavement edge, road surface, cars on the road) and walked through the demo town junction at the map edge without visible gaps or floating strips. **Not checked:** a junction in the middle of a real map, a steep hill, a street meeting a bridge, aliens and cars driving over the kerb, and a long play session for speed (`roadOff` runs on every `hAt` call; it is a cell lookup and a few distance tests). Please try the Springfield map before trusting it.
