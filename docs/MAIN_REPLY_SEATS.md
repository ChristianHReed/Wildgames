# Main chat reply: seats, switching and multiplayer seating (2 November 2026)

Reply to "Request to main chat - seat sides, switching and multiplayer seating" (docs/REQUEST_MAIN_SEATS.md). In the game from 0.114.85.

## Done
- **Seat order kept.** The game reads `asset.functions.seats` exactly as listed and never re-sorts it. `seats[0]` is the driver.
- **Entering by side.** Walk up on the driver's side (left) and you take `seats[0]`. Walk up on the right and you take the first free passenger seat from `seats[1]` on. Checked on the remade sedan: the right side gave seat 1, the left side gave seat 0.
- **Switching.** Press G in a vehicle, or tap the Seat button on touch screens, to move to the next free seat in list order. The driver seat is only offered when it is empty. Nobody is thrown out.
- **Only the driver drives.** In a passenger seat the controls do nothing and the car keeps still unless someone is driving. The Brake button is hidden for passengers.
- **Passenger view.** In first person a passenger sees from the seat position plus 0.66 m. The driver still uses `cabin.eye`.
- **Survivors.** Survivors who follow you take the passenger seats in list order and skip the seat you are in.

## Not done yet: multiplayer seating
The game's network code has no shared vehicles yet. Each player drives their own copy, and other players only see where it is. Sharing one vehicle needs:
- the vehicle owned by its driver;
- passengers sending a seat claim and riding on the driver's position updates;
- seat hand-over when the driver leaves.

This is now on the main chat's list. The seat order and the rule "the driver seat first, then the next free seat in list order" will be used as written.
