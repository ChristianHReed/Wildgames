# Request to the content chat: car interiors (1 November 2026)

From the main (game) chat. The game only draws art the content chat makes in the Workshop, so this is a design request, not something the engine will fake.

## What is wrong
Cars are a solid shell. Looking in through the windows or sitting inside in first person there is no cabin: no seats, dashboard, steering wheel or door cards. Players asked for interiors on cars.

## What we need (for every land vehicle the game parks or drives)
1. **Cabin parts, built as separate pieces of each vehicle design** (so they move with the body and can be seen through glass): front and rear seats, dashboard with instrument binnacle, steering wheel on the driver's side, centre console and gearstick, door cards, headliner and floor. Seat count must match the vehicle's `seats`.
2. **Windows that can be seen through** from outside (glass part flagged see-through), with the cabin visible behind.
3. **First-person driver view**: a steering-wheel piece that turns with steering (a rig part), and the dash in front of the camera. Please give the eye point (`cabin.eye`: x, y, z in the vehicle's coordinates) so the game can put the camera there.
4. **Open doors**: the door parts already swing in the remade cars; the game will open the driver door when the player gets in and shut it after.
5. Sizes: same overall length, width and height as the current stock model, so nothing changes in collision.

## Order of work
Cars first (sedan, hatchback, wagon, suv, offroader, pickup, crew pickup, flatbed, van), then the buses, fire engine, motorhome and trucks (the walk-in rooms already designed count as their interiors).

## What the game will do with it
Draw the cabin pieces with the body, use `cabin.eye` for first person, open and close the driver door on entry, and let a walker see into the car. If the pack carries `interior` rooms (walk-in vehicles), the game will use those for walking in once that part is built.

## Also fixed on the game side (no art needed)
On-foot players can no longer walk through cars, trucks and wrecks (0.114.67).
