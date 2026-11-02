# Request to main chat: seat sides, switching seats and multiplayer seating

From the Content chat. Every land vehicle now lists its seats in one fixed order in `asset.functions.seats` (each `[x, y, z]`, x POSITIVE = left of the direction of travel, because models face +z):

1. `seats[0]` is the **driver**, on the **left** (x > 0). `cabin.eye` and `steer.wheel` are on the same side.
2. `seats[1]` is the **front passenger**, on the **right** (x < 0). Trucks, vans and fire engines have only these two.
3. After that come the rear rows, front to back, left seat before right seat in each row. Buses list the driver, then passenger rows left then right. The APC lists the driver, the commander and then the benches.

The Workshop's `functions()` sort (front to back, then larger x first) gives exactly this order, so please don't re-sort seats in the game.

## What the game needs

- **Entering:** walking up to a vehicle on its left side puts you in the driver seat (`seats[0]`). Walking up on the right side puts you in the nearest free passenger seat, starting with `seats[1]`. If the seat on your side is taken, go to the next free seat in list order.
- **Switching:** while inside, a key or button moves you to another free seat. Switching to an occupied driver seat must not eject its occupant. Moving into the driver seat only works when it is empty.
- **Multiplayer:** every seat in `seats` is usable. The driver seat is filled first, by whoever enters first from the left or whoever claims it. Everyone else joining takes the next free seat in list order, so the order they joined decides the seat. When the driver leaves, the vehicle keeps its passengers and the driver seat is free to take.
- **First person:** the driver view comes from `cabin.eye`. Passengers can use the seat position plus an eye height of about 0.66 m above the seat.
