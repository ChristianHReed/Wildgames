# Afterstreet: testing roadmap

Everything in `play.html` (version 0.29) has been run only in an automated test browser on one machine with no graphics card. Nothing has been tried on a real drive, a real phone or a real network. The built-in Springfield map is real OpenStreetMap data; the map maker's own downloads are still untried. This roadmap is the order to try those things in.

Work top to bottom. Stages 1, 2, 9 and 11 are the make-or-break tests: if one of them fails, the design may need to change, so report it before going further.

## How to report a problem

For anything that fails, send:

- The stage and step number.
- The device and browser (for example "Windows laptop, Chrome").
- What you did, and the exact words shown on screen.
- A screenshot if it is a visual problem.
- For map problems, the map file itself.

## Stage 0: set up the drive

- [ ] 0.1 On GitHub, press **Code**, then **Download ZIP**. Unzip it onto the SSD.
- [ ] 0.2 Confirm the folder holds `play.html` and the folders `assets`, `maps`, `world`, `characters`, `packs`. The game needs `assets` beside `play.html`; if it is missing the start page says so.
- [ ] 0.3 Note how long the start page takes to appear from the USB stick the first time (the full art set is about 5 MB).

## Stage 1: solo play on a computer (make-or-break)

Use Chrome or Edge.

- [ ] 1.1 Double-click `play.html`. The start page appears with a Survivor panel and a small preview figure.
- [ ] 1.2 Press **Play Springfield, MO** (the real downtown map is built in), or **Play demo town**. You are standing on a street in first person.
- [ ] 1.3 Click the view. The mouse turns the view; WASD moves. Esc frees the mouse.
- [ ] 1.4 Motion is smooth. If it stutters, set View distance to Low on the start page and try again. Report which setting was needed.
- [ ] 1.5 Walk through a doorway into a building. You cannot walk through walls or furniture.
- [ ] 1.6 Stand at a container with a floating gold cube and hold E (on a touch screen, tap the view once). A window lists what it holds; **Take** or **Take everything** adds it to your backpack.
- [ ] 1.6b Press I, or tap the backpack slot at the end of the hotbar. Items are stacked under Food and drink, Medical, Ammo, Materials and Gear.
- [ ] 1.6c Click or tap the round map. A full map opens; drag it, zoom with + and −, close it.
- [ ] 1.7 Press **Save & exit**, then **Play demo town** again. You are where you left off, with the same items.
- [ ] 1.8 Close the browser completely, reopen `play.html`, play the demo town. Progress is still there.

Fail signs: a blank or black view, a message that the browser cannot run 3D graphics, or progress lost after step 1.8.

## Stage 1b: the new look

- [ ] 1b.1 Walls show brick, siding or stone; roads show lane lines; shops have painted shopfronts.
- [ ] 1b.2 Look at a distant wall while walking. Report any shimmering, flickering or seams between texture tiles.
- [ ] 1b.3 At night, windows glow.
- [ ] 1b.4 The six hotbar slots at the bottom show picture icons. The round map in the corner follows you with north up.
- [ ] 1b.5 Titles use a plain serif font and labels a typewriter-style font. The design pack's own fonts are not built in yet.

## Stage 1c: hills and valleys

- [ ] 1c.1 Play demo town. The streets rise and fall (the demo's hills are made up). Walking uphill and downhill feels smooth.
- [ ] 1c.2 Buildings on slopes sit level on a grey foundation, with a step at the door. Stepping in and out does not jolt badly.
- [ ] 1c.3 With internet on, press Play Springfield, MO. The first time it says it is downloading the hills. Report if it instead says it is playing without hills.
- [ ] 1c.4 Springfield's ground matches what you know: which way a street you know slopes.
- [ ] 1c.5 Look for roads or sidewalks that float above the ground or sink into it, and for gaps in the ground.
- [ ] 1c.6 Turn the internet off and play Springfield again. The hills are still there.
- [ ] 1c.7 Make a map with the map maker. It says "Adding hills and valleys" and the new map has them.

## Stage 1d: clock, safe house and the cleaner screen

- [ ] 1d.1 A game day lasts 12 real hours: one real hour moves the clock two hours. For quick tests, set **Length of a day** on the start page to 4 minutes.
- [ ] 1d.2 A new world starts you at the door of a green-tinted house with a green marker above it. Its chest holds starting supplies.
- [ ] 1d.3 Aliens do not come into the safe house or its yard, and do not chase you while you are in it. Dying returns you there unless you have a bed.
- [ ] 1d.4 The screen shows a thin health bar and three small bars top-left, a compass and clock top-centre, the round map top-right, and a small hotbar. The menu button beside the map opens Items, Build, Chat, Invite, Controls and Save and exit.
- [ ] 1d.5 On a phone, nothing on screen overlaps the touch buttons, and all text is readable against bright sky and at night.

## Stage 1e: long views without fog

- [ ] 1e.1 In clear weather there is no fog. Down a long street you see buildings, trees and hills out to the draw distance (about 400 m on Low, 800 m on Medium, 1,400 m on High), where they fade into the sky.
- [ ] 1e.2 Distant buildings are plain boxes with painted walls. Walking toward one, it gains its roof shape, trim and (for shops and offices) its modelled front. Report if the change is jarring.
- [ ] 1e.3 Look at far-off roads and sidewalks for flickering or shimmering stripes.
- [ ] 1e.4 Note the frame rate looking down the longest street you can find, on each View distance setting. This is the heaviest view in the game.
- [ ] 1e.5 Rain, storms and ice storms still shorten how far you can see. That is intended.

## Stage 1f: trees and plants

- [ ] 1f.1 Walk into a park. The nearest trees are full models with leafy branches (pines and broadleaf); farther ones are flat pictures of the same trees, which should be hard to tell apart at a distance. Grass tufts, flowers, ferns, bushes and rocks are scattered on mapped parks, woods and lawns.
- [ ] 1f.2 Leaf edges look clean, not boxy. Report white or dark fringes around leaves, or leaves that vanish at a distance.
- [ ] 1f.3 Walk through a wooded area and watch the frame rate; note the View distance setting.
- [ ] 1f.4 Chop a tree (swing at it three times). It becomes a stump and you get wood.
- [ ] 1f.5 Watch trees switch between the simple and full versions as you move. Report if it is distracting.

## Stage 2: saving onto the drive (make-or-break)

- [ ] 2.1 On the start page press **Connect game folder** and pick the folder that contains `play.html`. Allow the permission prompt.
- [ ] 2.2 The Saves panel now says it is saving into that folder.
- [ ] 2.3 Play the demo town for a minute, then **Save & exit**.
- [ ] 2.4 In the file explorer, look in `world` and `characters`. Each should hold a `.json` file.
- [ ] 2.5 Unplug the SSD, plug it into a different computer, open `play.html`, press **Connect game folder** again. Your survivor appears under "Your survivors".
- [ ] 2.6 Play the demo town. You resume where you left off on the first computer.

If there is no **Connect game folder** button, that browser cannot write to the drive. Test **Export saves** and **Import saves** instead, and report which browser it was.

## Stage 3: real maps

Needs internet for 3.1 to 3.4 only.

- [ ] 3.1 In **Make a map**, type your neighborhood or `Springfield, Missouri`, choose **Neighborhood**, press **Make map**.
- [ ] 3.2 A map file is saved (to `maps` if the folder is connected, otherwise to Downloads) and the game starts.
- [ ] 3.3 Do the streets and building shapes match the real place? Find a building you know.
- [ ] 3.4 Repeat with **District**, then **Large**, then **Whole city**. Note how long each takes and whether play stays smooth.
- [ ] 3.5 Turn off Wi-Fi. Reopen the game, connect the folder, and press the map's Play button. It loads with no internet.
- [ ] 3.6 Walk into at least ten different buildings. Report any with no doorway, a doorway into another wall, or rooms you cannot reach.
- [ ] 3.7 Find a real shop, pharmacy or police station. Its real name should show when you stand inside.

Fail signs: "Could not make the map" (send the exact message), buildings in the wrong place, or a whole-city map that never finishes loading.

## Stage 3b: big regions

Needs internet. This is the 50-mile map: it downloads one square (about 3.4 miles across) at a time.

- [ ] 3b.1 Under **Big region**, type `Springfield, Missouri`, choose a reach, press **Start region**. The first square downloads and the game starts in the middle of town.
- [ ] 3b.2 Travel to the edge of the square (the full map shows where you are; a car helps). A "Travelling" screen appears, then you carry on in the next square with your items, the time of day and your car.
- [ ] 3b.3 Note how long that first crossing takes, then cross back. The second time should be quick because the square is kept.
- [ ] 3b.4 Turn the internet off and walk into a square you have never visited. You are stopped with a message, not dropped out of the game.
- [ ] 3b.5 Save and exit. The region is listed with how many squares are on the device. Press **Play**; you resume where you left.
- [ ] 3b.6 Press **Download more** and leave the page open for ten minutes. Report how many squares it saved and any message it stopped with.
- [ ] 3b.7 Check the seam: do buildings and roads line up as you cross from one square to the next?

## Stage 3c: buildings match their real use

- [ ] 3c.1 In Springfield, open the full map and zoom in. Buildings other than homes are labelled: restaurant, church, office building, school, clinic and so on. Check a few you know.
- [ ] 3c.2 Homes have pitched roofs and some have chimneys; larger buildings have a low wall round a flat roof with machinery on top; shops and restaurants have an awning and sign over the door; churches have a steeple.
- [ ] 3c.3 Stand inside a building. The line under the compass says what it is, for example "Inside St. Michael's, a restaurant".
- [ ] 3c.4 Loot fits the place: a restaurant gives food and water, a clinic medkits, a hardware store wood, scrap and batteries, a clothing store coats, an office batteries and water, a church water, food and lanterns.
- [ ] 3c.5 Report any building whose use is wrong, with its name or location, and any roof that looks broken.

## Stage 3d: modelled building fronts

- [ ] 3d.1 Walk up to shops, offices and apartment blocks downtown. Within about 40 to 90 m (by View distance) their fronts change from flat paint to real brickwork with recessed windows, shop windows, a door frame and a cornice along the top.
- [ ] 3d.2 Watch the change-over as you approach. Report if the pop-in is distracting or if the game stutters while walking through a dense block.
- [ ] 3d.3 On a phone on Low, note the frame rate downtown compared with a residential street.
- [ ] 3d.4 Look for fronts that are wrong: windows crossing a doorway, pieces floating off the wall, gaps at corners, stretched windows on very short or very long walls.
- [ ] 3d.5 Homes and garages keep the painted look; that is intended.

## Stage 3e: doors, windows, rooms and plants

- [ ] 3e.1 Walk up to a closed front door. It stops you. Press E (or tap it) to open it, walk in, and close it behind you.
- [ ] 3e.2 Stand at a window. E opens it and you can climb through. With 2 wood, B (Build) boards it up and nothing gets through.
- [ ] 3e.3 The window you opened looks open from outside, and it lines up with a window drawn on the wall. Note any building where it does not.
- [ ] 3e.4 Shut yourself in a house at night with aliens outside. They batter the door or a window and break in after a while. Boards last longer than glass.
- [ ] 3e.5 Leave the game and resume. Doors and windows are as you left them.
- [ ] 3e.6 Walk through five homes. Each has a living room, a kitchen with fridge and stove, bedrooms with a bed against a wall, and a bathroom. Report furniture blocking a doorway or a room you cannot get into.
- [ ] 3e.7 Visit a grocery store (aisles and tills), a restaurant (tables with chairs, kitchen at the back), a church (pews facing the altar), a school (desks facing the board) and a clinic. Does each look like what it is?
- [ ] 3e.8 Search a fridge, a medicine cabinet, a wardrobe and a gun locker. The contents should mostly suit the container. Some containers are empty.
- [ ] 3e.9 In a park, hold E on a bush, flowers, a fern and a rock. You get berries, herbs, fiber and stones. The plant disappears and grows back after about 25 minutes.
- [ ] 3e.10 Open the backpack. Eat berries; turn 3 herbs and 2 fiber into a medkit; turn 2 stones into ammo.
- [ ] 3e.11 Chop a pine and a leafy tree. The pine gives more wood; the leafy tree sometimes gives food.
- [ ] 3e.12 Look at a pond or river. The surface moves and glints. Check the frame rate does not drop on the phone.

## Stage 3f: sprinting, crouching and moving over ground

- [ ] 3f.1 Hold Shift (or tap Run) and move. You go clearly faster and the thin bar under your health drains in about 7 seconds. At empty you see "Out of breath" and cannot sprint until it refills a quarter.
- [ ] 3f.2 Press Z (or tap Crouch). The view drops, you move at about half speed, and the status line says Crouching.
- [ ] 3f.3 Find a swarmer that has not noticed you. Crouching, you can get about twice as close before it turns on you as you can walking. Sprinting, it notices from further away.
- [ ] 3f.4 Climb through an open window. You slow right down for about a second. Through a broken window standing up you take a small cut; crouched you do not.
- [ ] 3f.5 On a real map with hills, walk up a steep street and back down. Up is slower.
- [ ] 3f.6 Swim across a pond. Stamina drains; out of stamina you swim slowly and lose health. Afterwards you stay wet and colder for a while, and dry faster indoors or by a fire.
- [ ] 3f.7 On the phone, the Run and Crouch buttons sit beside the move stick. Are they easy to reach without hitting the stick?

## Stage 3g: safe zones

- [ ] 3g.1 Stand inside the safe house at night with aliens outside. None come through the door or walls, however long you wait.
- [ ] 3g.2 On the Springfield map, walk to Park Central Square (the dashed green circle on the map, ringed with green-topped posts). The status line says Town square.
- [ ] 3g.3 Lead aliens to the square and step inside. They stop at the ring of posts and wander off. They cannot hurt you from outside it.
- [ ] 3g.4 On a map you downloaded yourself, check where the town square was placed. Report it if it is somewhere odd.

## Stage 3h: sneaking past aliens

- [ ] 3h.1 Start a new game and stand still for a minute. Aliens wander; none come straight for you unless one walks into view.
- [ ] 3h.2 In daylight, stand in front of a swarmer about 15 m away. The pill under the clock says "Being watched" and fills; after about a second it says "Spotted" and the alien charges.
- [ ] 3h.3 Walk up behind a swarmer: it hears you at about 7 m, says "Heard something", turns and looks. Crouched, you can get within 2-3 m.
- [ ] 3h.4 At night without a light, you can stand about 12 m in front of one unseen. Turn your flashlight on and it spots you from much further.
- [ ] 3h.5 Get chased, then duck behind a building. After about a second the pill says "Searching for you"; the alien goes to where it last saw you and poke around, then gives up.
- [ ] 3h.6 Aliens behind a wall or a shut door cannot see you. An open door or window lets them.
- [ ] 3h.7 Fire a gun: everything within about 45 m comes to look. Hit a swarmer: it and its group come for you.

## Stage 3i: aliens find their way; distractions and takedowns

- [ ] 3i.1 Get spotted, then run round the far side of a big building. The alien follows round the corner instead of pressing against the wall.
- [ ] 3i.2 Go into a house with the front door open. An alien chasing you comes in through the door.
- [ ] 3i.3 Shut the door behind you. The alien loses sight, searches outside, and may try the door or a window if it heard you.
- [ ] 3i.4 Gather stones from rocks, then press V (or tap Throw) to throw one past an alien. It walks to where the stone landed and looks around.
- [ ] 3i.5 Crouch and creep up behind a stalker that has not noticed you, then swing. It drops in one blow ("Quiet takedown"). Standing, or from the front, it does not.
- [ ] 3i.6 Watch the frame rate with many aliens chasing you around buildings on the phone.

## Stage 3j: survivors as people

- [ ] 3j.1 On the start page, change Body, Hair, Hair colour, shirt and trousers. The small figure updates to match.
- [ ] 3j.2 Start a game and press P (or Menu, First or third person). You see your survivor from behind, in your colours. Walk, sprint, crouch, swing, throw a stone and search a shelf; each has its own movement.
- [ ] 3j.3 Indoors the camera comes in closer and stays inside the room. Report walls or furniture that block the view badly.
- [ ] 3j.4 Traders look like people now, each a little different.
- [ ] 3j.5 With a friend: each of you sees the other as their chosen character, walking, running, crouching and swinging as they do.
- [ ] 3j.6 On the phone, check the frame rate with a few players in view.

## Stage 3k: knowing why you died

- [ ] 3k.1 When you die, the message says what killed you (a swarmer, the cold, thirst, the tornado and so on).
- [ ] 3k.2 When something hits you, a red arc at the middle of the screen points toward it.
- [ ] 3k.3 Food lasts about an hour of play and water about forty minutes. You get a warning at 20 and again at empty; empty costs health slowly.
- [ ] 3k.4 A cool, rainy spring day makes you cold but does not freeze you. Freezing starts around 34\u00b0F.
- [ ] 3k.5 Tornadoes only come from day 2, are rarer, tell you which way they are, show on the map, and hurt much less.

## Stage 3l: doors, hiding, locks and sound

- [ ] 3l.1 Inside a house, shut a door between two rooms. An alien on the other side cannot see you; one chasing you shoves it open after a moment.
- [ ] 3l.2 Search a wardrobe or locker until it is empty, then press E (or tap it) to hide. The view goes dark with slats. An alien that did not see you go in walks past; one that did drags you out.
- [ ] 3l.3 Find a locked front door (about a third are). With keys (nightstands, offices, police) it opens at once. Without, holding E pries it in about 6 seconds, quietly; swinging at it smashes it in four blows, loudly.
- [ ] 3l.4 Kitchens, bathrooms, bedrooms and offices show real furniture: stove, sink, cupboards, toilet, bath, TV, wardrobe, bunk beds, computer desks.
- [ ] 3l.5 Turn the sound on (tap the screen once on iPhone). Footsteps change on grass, pavement, wooden and carpeted floors. Doors creak and bang, glass breaks, rain and wind follow the weather, aliens call from out of sight and screech when they spot you.
- [ ] 3l.6 The volume slider on the start page works, and 0 is silent.
- [ ] 3l.7 Your survivor now walks, runs, crouch-walks, swims, shoots and dies with proper movements (third-person view, P).

## Stage 3m: furniture that works

- [ ] 3m.1 At night, press E at a bed with no aliens near. The screen goes dark and the clock runs fast to morning. Health refills; food and water drop only a little. You now wake at that bed if you die.
- [ ] 3m.2 Try to sleep with an alien close by: it refuses. Sleep, then let an alien find you: it wakes you.
- [ ] 3m.3 With 1 food and 1 wood, cook at a stove. Eat the hot meal from the backpack: it fills you more than food and warms you.
- [ ] 3m.4 Fill bottles at a kitchen sink (2), a bath (2), a basin or a toilet cistern (1 each) until each runs dry. It stays dry after you save and come back.
- [ ] 3m.5 Empty a wardrobe, dresser, fridge or locker, then press B (or Wall) next to it. It slides against the nearest door. Aliens have to batter through it; you can pull it away with E.
- [ ] 3m.6 Leave and resume. Shoved furniture, shut and locked doors and dry taps are as you left them.

## Stage 3n: upstairs, roofs and falling

- [ ] 3n.1 Find a two-storey home and walk up the stairs. The view rises smoothly, the upstairs has rooms and things to search, and you cannot walk off the open side of the stairwell.
- [ ] 3n.2 Stand upstairs with an alien downstairs. It does not see you. Make noise: it comes up the stairs after you.
- [ ] 3n.3 Find a ladder on the side of a flat-roofed building (shops, offices, garages). Press E (or tap) at its foot: you climb to the roof. Press E near the top to climb down again.
- [ ] 3n.4 On a big roof, walk into the low wall: it stops you. Sprint at it: you jump off and lose health (about 40 from three storeys). On a small roof with no wall you can just walk off.
- [ ] 3n.5 On a roof with an alien chasing you: it does not reach you, waits under the ladder, and after about half a minute goes off searching.
- [ ] 3n.6 In multiplayer, a friend on a roof or upstairs is drawn at the right height.

## Stage 3o: injuries, spoiling food, dirty water, tiredness and wear

- [ ] 3o.1 Let an alien hit you until a red BLEEDING tag shows under the bars. Health drains and you leave drops of blood. Press 4 (or tap the bandage slot): it stops.
- [ ] 3o.2 Let a wound stop bleeding on its own without a bandage. After a few minutes it either heals or turns INFECTED (warmth reads hotter, health slowly drops). Antibiotics from a clinic, hospital or bathroom cabinet cure it.
- [ ] 3o.3 Jump off a three-storey roof: sometimes your leg breaks. You limp, Run does nothing and ladders refuse you. Use a splint (or make one: 2 wood, 1 fibre); the tag counts down the minutes to healed.
- [ ] 3o.4 Take fresh food from a fridge. The backpack says when it goes off; wait and it turns into rotten food. Eating rotten food sometimes gives food poisoning.
- [ ] 3o.5 Fill a bottle at a river (stand in the water with full thirst) or a toilet: it is unboiled water. Boil it at a stove (1 wood) or beside a campfire from the backpack.
- [ ] 3o.6 Stay up: the Rest bar empties in about an hour. Tired, then exhausted (the screen edges darken), then you lose health. A night in a bed fills it.
- [ ] 3o.7 Use a made weapon until it breaks (the backpack shows its condition). Search a tool bench in a warehouse or garage, then press E at it to repair your weapon for 1 scrap. Duct tape patches it anywhere.
- [ ] 3o.8 Quit and resume while bleeding with a splinted leg: both are still there.

## Stage 4: aliens and weather

- [ ] 4.1 Daytime: small green swarmers appear in groups and chase you. The bat kills one in a hit or two.
- [ ] 4.1b A dead alien that carries anything leaves a body with a gold cube. Search it. Swarmers carry little, stalkers carry ammo and medkits, giants carry the most.
- [ ] 4.1c Aliens are now creature models, not boxes: small green swarmers, tall dark stalkers with a mace, and a large blue giant. They walk with moving legs and arms, flash when hit, and lie on the ground when dead. Report anything that looks wrong: floating, sliding, facing backwards, or slow frame rate with many on screen.
- [ ] 4.2 Purple buildings with a floating purple cube are nests. Go in, find the glowing core, hold E for four seconds. The nest count drops.
- [ ] 4.3 Set Length of a day to 4 minutes, then survive until night (about two and a half minutes after starting). A tall black stalker should eventually hunt you.
- [ ] 4.4 Press L to turn the flashlight on at night, then off. Stalkers should find you less easily.
- [ ] 4.5 Light a campfire (C, needs wood from trees). A stalker should circle rather than attack while you stay by the fire.
- [ ] 4.6 From day 2, a giant can appear. It cannot follow you indoors.
- [ ] 4.7 Watch the weather line in the top-left. Rain and storms should show; a storm can bring a tornado warning.
- [ ] 4.8 The Warmth bar: stand outside in rain or at night and it falls; go indoors or stand by a fire and it recovers.

Report anything that feels unfair or pointless: too many aliens, too few, a stalker that cannot be escaped, weather that kills too fast.

## Stage 4b: batteries, flashlight, radio and lanterns

- [ ] 4b.1 A new survivor starts with a radio, a flashlight and 2 batteries (see the backpack, under Power and light).
- [ ] 4b.2 The flashlight starts off. At dusk a reminder appears. L (or the Light button) turns it on.
- [ ] 4b.3 Leave it on: its charge in the top-left card falls, one set of batteries lasts about one game day, and a spare is loaded by itself. With no spares it dies and says so.
- [ ] 4b.4 Press R (or Scan in the backpack). The radio reports a trader, nest or supplies with a distance and direction, and marks it on the map. Each scan uses charge.
- [ ] 4b.5 Craft a lantern (K, 3 scrap), then press T (or Place in the backpack). It needs batteries, lights the area at night, and can be picked up again.
- [ ] 4b.6 Batteries turn up when searching houses, shops, police stations and dead stalkers and giants. Report if they are too rare or too common.
- [ ] 4b.7 With two players: chat reaches any distance only while both radios have charge.

## Stage 5: characters

- [ ] 5.1 Make a new survivor: name, build, skin, hat, colors, background. The preview updates.
- [ ] 5.2 Play, then exit. The survivor is listed under "Your survivors" with skill levels, and the background is locked.
- [ ] 5.3 Make a second survivor. Each keeps separate items and skills.
- [ ] 5.4 Check one background effect, for example Scout moving visibly faster.

## Stage 6: items and packs

- [ ] 6.1 In **Workshop**, make a melee weapon, a use item and a throwable. Each shows a cost.
- [ ] 6.2 In the game press K. Craft them once you have the wood and scrap.
- [ ] 6.3 Equip the weapon (it changes what you hold), use the item, throw the throwable with G.
- [ ] 6.4 Tick **One of a kind** on a new item, craft it, and confirm it cannot be crafted twice.
- [ ] 6.5 Press **Export** on "My workshop". Give the file to a friend, or import it under a different survivor with **Import pack**.

## Stage 7: building and bases

- [ ] 7.1 Press N. Build a wall section; you cannot walk through it.
- [ ] 7.2 Indoors, place a bed. Die on purpose; you wake at the bed and your pack is where you fell.
- [ ] 7.3 Place a chest, store items, exit, come back. They are still there.
- [ ] 7.4 Repaint a building and demolish another. Both survive **Save & exit**.

## Stage 8: vehicles, traders and goals

- [ ] 8.1 Find a bicycle near a house. E to ride, E to get off. It stays where you left it.
- [ ] 8.1b Streets have lights and hydrants, parks have benches, shops have dumpsters, houses have bushes. Report any standing in a road or inside a wall.
- [ ] 8.2 Find a car (they now look like cars; police stations have police cars). Drive it; fuel runs down; aliens are drawn to it.
- [ ] 8.3 Find a trader (green dot on the minimap, green cube overhead). Buy and sell with scrap.
- [ ] 8.4 Start a new world with the goal **Reclaim** and another with **Escape**. The Goal line in the top-left tracks progress.

## Stage 9: two computers (make-or-break)

Both computers need the same `play.html` and the same Wi-Fi.

- [ ] 9.1 Host: start a world, press **Invite player**, copy the invite code, send it to the other computer (email, chat, a shared note).
- [ ] 9.2 Friend: paste it under **Play together**, press **Create reply code**, send the reply back.
- [ ] 9.3 Host: paste the reply, press **Connect**. Within about ten seconds the friend is in the host's world.
- [ ] 9.4 You can see each other move. Aliens chase both of you.
- [ ] 9.5 One player loots a container; its gold cube disappears for the other.
- [ ] 9.6 Repeat with a phone hotspot that has no internet. This proves it works offline.
- [ ] 9.7 Repeat with the two computers joined by an ethernet cable and Wi-Fi off.
- [ ] 9.8 Optional: pair the computers as a Bluetooth network and repeat.

If it stays on "Connecting...": report both browsers, the kind of network, and whether either computer is on a VPN or a school or work network.

## Stage 10: visiting rules

- [ ] 10.1 The friend picks up items, then leaves. On their own device those items are still with their survivor.
- [ ] 10.2 The host drops a custom item (Items panel, **Drop**). The friend picks it up, leaves, and finds it listed under "Collected from other worlds".
- [ ] 10.3 Host sets **Visitors' gear** to **Cap**. A friend arriving with more than five of something is cut to five, and gets the rest back at home.
- [ ] 10.4 Friend presses N, then **Ask** under Sharing. The host sees a question; on yes, the friend's own copy of the map gets the host's repaints, walls and demolitions.
- [ ] 10.5 A third device joins with **Join as co-pilot** ticked. It shows a top-down map; tapping it places a marker the others see.
- [ ] 10.6 Chat with Enter. Without radios it only reaches about 60 meters; with a radio each (K, craft, 3 scrap) it reaches anywhere.
- [ ] 10.7 The host closes the game. The friend returns to the start page with their survivor saved.

## Stage 11: phones and tablets (make-or-break)

- [ ] 11.1 Android: plug the SSD into the phone (USB-C), open `play.html` from the Files app with Chrome.
- [ ] 11.2 If that fails, copy `play.html` into the phone's own storage and open it from there.
- [ ] 11.3 iPhone or iPad: try the same through the Files app. Report exactly what happens; this is the step most likely to fail.
- [ ] 11.4 On-screen controls appear: move stick, drag to look, Swing, Shoot, Search and the rest.
- [ ] 11.5 Play the demo town. Is it smooth on Low view distance?
- [ ] 11.6 Join a computer's world from the phone (stage 9 steps, as the friend).
- [ ] 11.7 Try a real map on the phone: Neighborhood first, then larger, until it struggles.

## Stage 12: other browsers

- [ ] 12.1 Firefox on a computer: stages 1 and 9.
- [ ] 12.2 Safari on a Mac: stages 1 and 9.
- [ ] 12.3 A Chromebook: stage 1, then joining as a friend.

## Stage 13: stretch tests

- [ ] 13.1 Three or more players in one world for 20 minutes.
- [ ] 13.2 A whole-city map with two players at opposite ends.
- [ ] 13.3 A one-hour solo session. Watch for slowdown over time.
- [ ] 13.4 Pull the host's network mid-session. The friend should land on the start page with their survivor saved.
