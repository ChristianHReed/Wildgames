# Afterstreet test checklist (version 0.75.0)

Tick each box as you go. Everything here was tested headlessly (no real phone, no real sound, no real controller). Anything marked **PHONE** or **EARS** needs you. The longer numbered list in TESTING.md has the exact steps per version; this one is the quick pass.

## 1. Install and versions
- [ ] Open the web address: the start page shows the version (0.70.0) and a map code.
- [ ] Open it a second time: still one version. In browser site data there is one `afterstreet-<version>` store plus `afterstreet-squares`.
- [ ] Turn off the network and reload: the game still starts (offline copy).
- [ ] USB or SSD copy: open `play.html` from the drive, Springfield loads, saves work.
- [ ] **PHONE** Add to home screen, start from the icon, play with the screen locked and unlocked.

## 2. Start, menu, saving
- [ ] New game: you start at the safe house with the chest and truck, and a paper map in the pack.
- [ ] Choose each background in the creator: each starts with its own kit.
- [ ] Save, close the tab, reopen: position, inventory, walls, beds, bases, torn walls, and power state are all back.
- [ ] Die: you wake at your newest bed (or the one you slept in last); a game with no bed wakes you at the safe house.

## 3. Moving and the map
- [ ] Walk, run, jump, crouch, swim, climb stairs in a tall building, use the roof hatch, vault a low fence.
- [ ] Open the big map: it needs the paper map. Drop the map: it will not open. Find box: type a house number and street, press Find, the map centres on it.
- [ ] Journal map marks: power plant, bases, your own marks.
- [ ] Street readout shows road names (only after the road-name data is added, see MAP_REQUESTS.md).

## 4. Day, night, weather, sky
- [ ] Watch a full day: dawn, noon, dusk, night; lights in windows at night.
- [ ] Moon changes shape over several nights; aurora on a winter night.
- [ ] Rain, snow, storm; cold hurts at night in winter without a fire or coat.

## 5. Scavenging
- [ ] Search a table, cupboard, fridge, locker, car boot: each gives a loot roll once.
- [ ] Leave a searched container for five days (sleep) and walk away over 90 m: it can be searched again.
- [ ] Press Y at a parked car: boot search once, then siphon fuel a can at a time.
- [ ] Hold J at furniture, a bench, a car: parts come out with the right tool, and it is loud.
- [ ] Pick plants and bushes: they grow back after a day or two.

## 6. Guns and weapons
- [ ] Press U to cycle guns (only owned guns); O to reload; fire until empty and it reloads by itself.
- [ ] Each gun's reload shows its own first-person poses.
- [ ] Pistol, revolver, shotgun, rifle, bow, crossbow, flare gun each fire and use the right ammo.
- [ ] Arrows and bolts land near the target and can be picked up.
- [ ] A gun below a quarter condition jams; the bench repairs it for 1 scrap.
- [ ] **PHONE** gun button, reload and cycle work with touch.
- [ ] **EARS** gun sounds, reload clicks, dry click, pump rack, bolt cycle (0.76.0: judge them; the design chat never heard them).
- [ ] **EARS** alien idle, notice, attack and die calls; wall crack and break sounds; car crashes; rain on street and on roof; generator hum; campfire crackle; plant hum.
- [ ] **EARS** music: day, night, base, chase, horde. They fade into each other and loop with no gap. The Music box in settings turns them off.
- [ ] Survivors panel shows a portrait for each survivor. Breaker panel stands beside a placed cable box (not seen in a screenshot yet).

## 7. Aliens
- [ ] Swarmers, stalkers, giants, spitters, clingers all appear (clingers on horde nights, day 9 or later).
- [ ] A stalker follows your footprints to a hiding place.
- [ ] After dawn lone aliens walk back to nests and disappear.
- [ ] A long chase: they keep looking longer after losing you.
- [ ] Nests: destroying one stops that group; the power plant nest must be cleared first.
- [ ] Clingers go over fences and walls, and climb a house wall to reach you on the roof.

## 8. Walls you build
- [ ] Build timber, steel, concrete walls; switch Wall material; costs match the Build menu.
- [ ] Aliens crack a bay, show the studs, then open it. Repair nearest wall restores it.
- [ ] Hold J at a bay to harvest it: wood and nails, scrap and sheet, or concrete chunks.
- [ ] Remove nearest wall returns 1 wood.
- [ ] Barricades, doors, furniture blockers: carry a table with Y, put it in a doorway, aliens gnaw it.

## 9. Town building walls (new in 0.69)
- [ ] Hold J at a house wall with an axe: a stretch comes out, with a dark opening and rubble; you can walk through.
- [ ] Brick needs a crowbar and is slow; metal needs a wrench, toolkit or crowbar.
- [ ] Hide inside; a swarmer tears a stretch open to get at you.
- [ ] Drive a car into a house wall at speed: it breaks, the car loses health.
- [ ] Build menu, Close torn-open walls of the nearest building: all gaps close while materials last.
- [ ] Inner walls: thick, trimmed doorways; an axe (hold J) or a swarmer opens one; closing torn walls puts it back.
- [ ] Tear open a wall: torn edges and rubble, the room is visible. Damaged walls show cracks.
- [ ] Save and reload: torn walls are still torn. Multiplayer: the other player sees the gap too.

## 10. Bases
- [ ] Place a bed: the building becomes your base; a second bed makes a second base (up to four).
- [ ] Sleep in a bed: you wake there if you die.
- [ ] Claimed buildings are shown as Base on the map.
- [ ] Survivors: recruit, give each job (guard, gardener, scavenger, builder, cook) with E at the safe house; the Build menu lists them.

## 11. Power
- [ ] Day 3: the power goes out at midnight; the water mains go on day 5.
- [ ] Start the plant (3 car parts, 8 fuel, 20 s loud start-up) and it needs the nest cleared.
- [ ] Repair a substation (2 car parts): buildings within about 380 m have power.
- [ ] Generator: place, fuel, run; cable box and solar panel; overload trips the box.

## 12. Vehicles
- [ ] Bicycle, car, truck: get on and off (**PHONE** tap prompt to get off).
- [ ] Cars show damage looks by health and a burnt shell after a fire; health is saved. Crash damage; Repair vehicle uses a car part; a wrecked car burns for a minute.
- [ ] Siphon fuel; the truck holds items.

## 13. Survival
- [ ] Food, water, rest, warmth meters fall and recover.
- [ ] Cook at a campfire or stove; boil water; rain collector fills; garden plot grows.
- [ ] Skills (scavenging, melee, endurance, building, marksmanship) gain XP with use; a skill book adds to a random one.

## 14. Multiplayer
- [ ] Host and join: you see each other, chat, markers work with a radio.
- [ ] Edits (walls, beds, torn walls, searched containers) show for both players.
- [ ] Known gaps: survivor NPCs are host only; the alien footprint trail is host only.

## 15. Phone and controller
- [ ] **PHONE** Every button in the touch bar does what its label says, none overlap in portrait or landscape.
- [ ] **PHONE** Frame rate stays playable downtown; no heat or crash after 20 minutes.
- [ ] Keyboard help (H) lists U, O, Y, J, E, and the build key.

## 16. Things that are known not finished (not bugs)
See ROADMAP.md "Still to do" lines and ART_REQUESTS.md section 11: boxes where pieces of art are still missing, road names, house number digits, held map, gun reload poses, rain ripples, music, survivor combat.
- [ ] Carry a chair, sofa and fridge: the heavier, the slower. Guard and builder survivors show their working poses.
- [ ] Door brace (Build menu, inside near the front door): the bar is visible, aliens struggle, E removes it, survives save and reload. (Not seen in a screenshot yet.)
- [ ] Board up all windows from the Build menu: boards on every window, wood used 2 each.
- [ ] **PHONE** World dressing (0.80.0): street signs, poles, manholes, mailboxes, bus stops, logs, ferns, reeds, flowers, road cracks. Frame rate still fine. Nothing invisible blocks you. Things face the right way (stop signs toward drivers).
- [ ] Map setting on the home screen: all three choices behave as described and are remembered.
- [ ] New game starts by Sequiota Park, not far out of town. The park is a short walk away.
- [ ] **PHONE** Open the big map on a phone held upright and sideways: all buttons visible, top-right close and zoom work, the bottom bar wraps.
- [ ] **PHONE** Start page tabs on the right: all seven tabs reachable, nothing cut off, every button inside each tab still works.
- [ ] Whole map visible: zoom the big map out to the whole region (all squares), pan around, zoom back in. Reasonable speed on a phone.
- [ ] **TWO DEVICES** Quick invite code: host types a word and Shares, friend types it and Joins over the internet. Copy-and-paste codes still work with no internet.
- [ ] Flags show on the compass with distance, point the right way as you turn, and friends' flags appear (blue, with name) on your compass and map.
- [ ] **PHONE** Busy highway: many cars and some service vehicles in view, still smooth. Machines can be searched and scrapped.
- [ ] **PHONE** Drive a car: stick up and down is gas and brake, left and right steers, the jump button is the handbrake; the dashboard sits above the item bar and nothing overlaps.
- [ ] Drive across a map square edge: the car does not change into another vehicle; fuel and damage carry over.
- [ ] Fuel: cars you find hold different amounts; a full tank lasts 300 to 400 miles of driving.
- [ ] Cars collide with trees, lamps, signs, benches, dumpsters and other vehicles.
- [ ] Bridges over streams and rivers: deck, parapets, no swimming while crossing; walking on them works too.
- [ ] Overpass at a motorway: ramp up and down, roads beneath still usable.
- [ ] Sleeping: any key, click or tap wakes you.
- [ ] Driving view: no head bob.
- [ ] Car types: small cars faster and quicker off the line but fragile; vans and the truck slow but tough.
- [ ] **PHONE** Car shop: button reachable, the shop panel fits the screen, swatches tappable, cost shown on every button.
- [ ] Named car shows on the big map with its name; blue S marks car shops on the big map when zoomed in.
- [ ] (0.90.1) Cars seen in the distance near a map-square edge are the same after crossing into the next square.
- [ ] (0.91.0) Fresh install and an update over an older install both start the game (no blank screen); airplane-mode start works from the home-screen copy; the USB drive copy opens with file://.
- [ ] (0.91.1) Place a bed, a chest and a tool bench inside a house; put a carried sofa down indoors. **PHONE** too (Place button).
- [ ] (0.92.0) Open map file with an .asmap from the builder (iPad: from Files). Credits show. Play it, delete it. **PHONE** too.
- [ ] (0.92.0) Offline from the website copy: builder.html opens and works without a connection after one visit.
- [ ] (0.93.0) Looks the same as 0.92: day, night, rain, snow, fog, street lights, trees, terrain. **PHONE** too (the renderer moved files).
- [ ] (0.93.1) After one visit to the website copy, the Maps Builder page opens and builds with the connection off.
- [ ] (0.94.0) Aliens (all five kinds), survivors and your own character look the same as before; town cars, the pickup truck, the 13 old furniture pieces and trees still show; the game loads with no red errors in the console.
- [ ] (0.94.1) Buildings with broken walls (shoot or break a wall) and street props still look the same; the builder's 3D view opens offline from the website.
- [ ] (0.95.0) Trees (all six species and autumn), the red truck with its hood, door and tyre, the thirteen furniture pieces and every sound effect look and sound right on a real phone; tell me which sounds are too harsh or quiet.
- [ ] (0.95.1) Play a map built with 10 m ground on a computer and on a phone set to Low: hills look finer on the computer, the phone runs as before, and you do not fall through the ground.
- [ ] (0.96.0) On a map made with builder 1.6 (with `structures`), drive across an overpass where the data says the interstate is the bridge: you drive over the interstate, not under it; streets over streets get a deck too.
- [ ] (0.96.1) Where a map made with builder 1.6 has a culvert, the stream disappears under the road for the culvert's length and you can walk across without swimming.
- [ ] (0.96.2) On a map made with builder 1.6 with a road tunnel, the road vanishes for the tunnel's length and the ground shows over it.
- [ ] (0.97.0) On a builder 1.6+ map: tunnels show a dark portal at each end; culverts a headwall each end; dams, weirs, piers, breakwaters, walls and fords appear along their ways. Look from both sides of a portal: the dark face should face outward.
- [ ] (0.97.1) You cannot walk through a dam (unless it carries a road), a retaining wall or a breakwater.
- [ ] (0.97.2) Look under a bridge over water: grey piers with a cap under the deck, no floating or sunken ones.
- [ ] (0.98.0) Walk into a wood: ferns, thickets, logs, stumps and the odd dead tree stand among the trees; searching a log or a thicket gives wood or berries. Check the frame rate has not dropped.
- [ ] (0.98.1) Round a pond or lake: cattails and reeds at the edge, lily pads on a small pond, now and then a heron. Nothing floats on the road or inside a building.
- [ ] (0.98.2) In dense woodland in spring or summer: tall slim oaks and pale birches close up; in autumn the trees still turn orange.
- [ ] (0.99.0) Take a shovel (the supply chest has one). Look down at open grass and hold E: a square of ground goes down half a metre, you get soil. Keep digging: layers of colour in the walls, a hole in the grass, nothing floating over it. Step in and out of a shallow hole; a deep hole (over a metre) cannot be climbed unless you jump (to about 2 m). Shift+E fills with soil. Not on roads, in buildings, in water or by trees. Quit and load the save: the holes are still there.
- [ ] (0.99.1) Walk into a 3 m hole: you fall and lose health; a 4 m fall may break your leg. Lure an alien into a pit: it takes damage and stays in it.
- [ ] (0.99.2) Dig a 2 m pit, stand in it facing a wall, Build, Ladder: the ladder stands against the wall and you can walk up out of the pit beside it. Without it you cannot.
- [ ] (0.99.3) On a phone with a shovel: look down, tap the prompt to dig; crouch and tap to fill.
- [ ] (0.100.0) Parked bicycles look like real bikes (different kinds). Ride one: wheels spin, handlebars turn with the front wheel, pedals turn.
- [ ] (0.101.0) In a car near a garage or petrol station press the shop button: pick mud tyres, alloy rims and a bull bar, roof bars, running boards. The car shows them, sits higher, and still drives. Reload: they stay. Mud tyres go a little slower on tarmac, faster in rain on grass.
- [ ] (0.101.1) In the car shop take the bull bar off one car (choose none): it shows (in stock) in the list. Fit it to another car for free. Reload: the stock is still there.
- [ ] (0.102.0) Swim to a boat on a lake or pond and press E. Move to steer: the boat follows your view, stays on the water, bobs, and a fast one leaves a wake. Press E to get out.
- [ ] (0.102.1) Find a motorbike, moped or quad by a house door and press E. It is much faster than a bicycle, uses fuel (the toast shows the percent) and a fuel can refills it. Empty, it only crawls.
- [ ] (0.103.0) Walk into a restaurant (open door): the kitchen at the back has a flat-top grill, fryer, fridges, a sink and wire racks along the walls, and you can search the fridges.
- [ ] (0.104.0) With a shovel look down and hold E: the shovel is in your hands and swings, with a dig sound; deeper pits sound more like gravel then stone, and the walls show brown, red clay, orange gravel and grey limestone. Filling has its own sound.
- [ ] (0.104.1) Dig a 1 m square hole. Build, Holes, Stake board then Plank cover facing it: the planks hide it. Walk onto them: they snap, you fall and the stakes hurt. Reload: covers and stakes are still there. Lure an alien across a cover: it falls in.
- [ ] (0.104.2) A ladder in a 1.5, 2.5 and 4 m pit is a short, medium and long wooden ladder leaning on the wall, and you still climb out beside it.
- [ ] (0.105.0) Find a yellow excavator or mini excavator by an industrial building (E to get in). W drives slowly, looking left or right swings the arm, looking down digs closer. Click: the arm reaches, plunges, curls, lifts, swings, dumps and returns, a hole appears and you get soil. At 4 m (2 m mini) it says it is as deep as it goes.
- [ ] (0.105.1) Press P for third-person view and get on a bicycle, a motorbike and a boat: your character sits on it and stays visible.
- [ ] (0.106.0) Town cars now include wagons, SUVs, offroaders, crew pickups, flatbeds and box trucks (and their wrecks). Fit a bull bar with lights: it hits aliens harder and lights the road ahead at night.
