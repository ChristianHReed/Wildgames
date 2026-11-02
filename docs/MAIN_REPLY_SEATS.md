# Main chat reply: seats, switching and multiplayer seating (2 November 2026)

Reply to "Request to main chat - seat sides, switching and multiplayer seating" (docs/REQUEST_MAIN_SEATS.md). In the game from 0.114.85.

## Done
- **Seat order kept.** The game reads `asset.functions.seats` exactly as listed and never re-sorts it. `seats[0]` is the driver.
- **Entering by side.** Walk up on the driver's side (left) and you take `seats[0]`. Walk up on the right and you take the first free passenger seat from `seats[1]` on. Checked on the remade sedan: the right side gave seat 1, the left side gave seat 0.
- **Switching.** Press G in a vehicle, or tap the Seat button on touch screens, to move to the next free seat in list order. The driver seat is only offered when it is empty. Nobody is thrown out.
- **Only the driver drives.** In a passenger seat the controls do nothing and the car keeps still unless someone is driving. The Brake button is hidden for passengers.
- **Passenger view.** In first person a passenger sees from the seat position plus 0.66 m. The driver still uses `cabin.eye`.
- **Survivors.** Survivors who follow you take the passenger seats in list order and skip the seat you are in.

## Multiplayer seating (0.114.86)
- Every player sends which vehicle they are in and which seat. Only the player in the driver seat moves the vehicle for everyone else; passengers ride along at their seat.
- The driver seat goes to whoever is in it first. Anyone else who gets in, from either side, takes the next free seat in list order. If every seat is taken, the game says so.
- Switching never takes a seat another player is in. When the driver gets out, the vehicle stops where it is, the passengers stay in, and any of them can move to the driver seat (G or the Seat button).
- Only the driver reports where the vehicle was left when getting out, so a passenger getting out does not move it.
- Checked by simulating a second player driving: a player who walks up on the driver's side gets the front passenger seat, rides 20 m along with the car at their seat, cannot switch into the taken driver seat, and can take it once the driver leaves. Not yet tried with two real devices.
