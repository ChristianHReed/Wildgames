# Map chat: what the 20 reference images teach about layout

From the map chat, 8 November 2026. The user attached twenty reference pictures (the "Fourth look"). This page turns what they share into rules the builder can follow, says which are built, and which wait. It adds to `docs/VISUAL_REFERENCE.md` and the layout request (`docs/MAP_LAYOUT_REPLY.md`).

## What every picture does that a plain OpenStreetMap build does not

1. **Everything has a front and a back.** A building faces its road. The front holds the parking, the sign and the kerb cuts; the back holds the dumpsters, fences, trailers and sheds. (Gas station and mini market, tractor dealer, J&J Warehouse, the dusty roadside strip, the 50s town.)
2. **Lots are bounded.** Fences, hedges or walls stand on lot lines, so a block reads as rows of lots back to back, with the block centre as yards (Japanese streets, 50s suburb, Zlín).
3. **Space between road and building is graded:** carriageway, kerb, verge, pavement, then parking or lawn, then the building. Where there is parking it sits between the building and the road, with two entrances.
4. **Density falls with distance from the centre.** Tall flat-roofed blocks and towers in the middle; mid-rise brick strips with shops below; narrow-lot houses; big lots and big boxes along the roads out; farms set far back (downtown, Japanese city, Zlín, rural main road).
5. **Roofs are busy when flat and clean when pitched.** Roof boxes, tanks, hatches, dishes; chimneys on pitched roofs.
6. **One tall landmark is visible down the street:** a water tower behind the main street, a church spire, a mast, the tallest tower.
7. **Poles run along one side of the road, with wires,** on country roads and in suburbs, not in the dense centre.
8. **Trees come in clumps and rows,** along streams, fences, lot lines and roads, not evenly spaced; woods have a grass and shrub band at the edge.
9. **Fields are a patchwork** with hedges between, a farm cluster by the road.
10. **Vehicles are placed with a reason:** kerbs and driveways in towns, nose-in at shops, trucks at docks, tractors at dealers, emergency vehicles at stations, jams on the roads out.
11. **Squares and parks have a centre:** a fountain or statue, paths, a church or a hall on one side.

## Where each rule stands

| Rule | State | Builder |
| --- | --- | --- |
| 3 Graded street bands | Done | 1.24.0 |
| 7 Poles one side, with wires | Done | 1.24.0 |
| 2 Lot lines, yards, driveways | Done | 1.25.0 |
| 5 Roof units, chimneys | Done | 1.25.0 |
| 1 Front and back of commercial lots (parking between building and road, two kerb cuts, sign, service side) | Done | 1.26.0 |
| 4 Density rings by distance to the centre | Done for made-up buildings | 1.27.0 |
| 6 Landmark per square | Done | 1.27.0 |
| 8 Clumped trees, woods edges, patchwork fields | Done | 1.28.0 |
| 9 Farm cluster at a field corner | After | planned 1.29 |
| 10 Placed vehicles | Done (no police, ambulance or tractor art yet) | 1.29.0 |
| 11 Squares and parks with a centre | After | planned 1.30 |

## Art the pictures ask for that does not exist yet

A tall pole sign (gas price board, "MOTEL"), a billboard on two legs, a gas-pump canopy with pumps, a truck at a dock (box trailer), a fountain or statue for squares, a swing and trampoline, a lot-line wall (low brick or stucco) for Japanese-style streets. Until they exist the builder uses `street.hanging_sign` for signs and says so in the data.
