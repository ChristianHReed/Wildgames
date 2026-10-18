# Afterstreet: testing roadmap

Everything in `play.html` (version 0.41) has been run only in an automated test browser on one machine with no graphics card. Nothing has been tried on a real drive, a real phone or a real network. The built-in Springfield region is real OpenStreetMap data from the Afterstreet map pack; the map maker's own downloads are still untried. This roadmap is the order to try those things in.

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
- [ ] 1.2 Press **Play Springfield, MO** (the 50-mile Springfield region is built in), or **Play demo town**. You are standing on a street in first person.
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
- [ ] 1c.3 Press Play Springfield, MO. The hills are there straight away (they are built in now; nothing is downloaded).
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
- [ ] 3g.2 A new game starts at the safe house on the edge of town: a small one-storey home on a one-acre lot (about 72 by 56 m) inside a white picket fence, with gates in the middle of the front and back. The map shows the lot as a dotted square.
- [ ] 3g.3 Lead aliens to the fence and step through a gate. They stop at the fence line and wander off. You cannot walk through the fence itself, only the gates.
- [ ] 3g.4 On a map you downloaded yourself, check where the safe house was placed. Report it if it is somewhere odd (on a road, in water, or with a building cut in half by the fence).
- [ ] 3g.5 Resume an older save: the supply chest has moved into the new safe house.

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

## Stage 3p: the stalker hunts, and noise heat

- [ ] 3p.1 By day, fire a few shots or smash a door in one spot, then walk 50 m away and watch: a small pack of swarmers turns up to look around where you made the noise. Open the map (M): the spot glows red, fading over a few minutes.
- [ ] 3p.2 Do the same at night: a single stalker comes instead.
- [ ] 3p.3 At night, crouch and keep still with a stalker wandering nearby that has not noticed you: it does not come straight for you.
- [ ] 3p.3b Let a stalker see you. Keep looking at it: it hangs back about 12 m and slips behind cover. Turn away: it creeps in, then rushes you from about 6 m. Sprint away after its rush misses: it falls behind.
- [ ] 3p.3c Get away from a stalker that has noticed you and hide somewhere else: "Something is hunting you" shows while it searches the area, for hours of game time, day or night.
- [ ] 3p.4 Let an alien see you get into a wardrobe (it drags you out). Hide in the same wardrobe again later at night: a hunting stalker comes to check it.
- [ ] 3p.5 Climb onto a roof with a stalker after you: it climbs the ladder and attacks. Climb down or jump: it drops off the roof after you. Swarmers and giants still wait below.
- [ ] 3p.6 Save and resume: the stalker still remembers the hiding places.

## Stage 3q: the painted survivors

- [ ] 3q.1 On the start page, change Face, Top, Bottoms, Shoes and Second colour: the small figure updates with the painted details.
- [ ] 3q.2 In the game press P for third person: your survivor shows the same face, clothes and colours, at a smooth frame rate on the iPhone.
- [ ] 3q.3 Traders each look different. A friend joining shows their own look.
- [ ] 3q.4 A cap, beanie or helmet sits above the eyes and stays on the head as it turns and nods.
- [ ] 3q.5 Walk, run, crouch, swim, swing and die in third person: the new bodies bend at elbows and knees without tearing.

## Stage 3r: upstairs everywhere, and roof hatches

- [ ] 3r.1 Go into a two-storey shop, office, block of flats or school in Springfield: stairs lead to a furnished upper floor (a flat over a shop, offices over an office) with things to search.
- [ ] 3r.2 In a flat-roofed building, at the top of the stairs there is a ladder up to a hatch in the ceiling. Press E (or tap): you come out on the roof. Stand by the hatch on the roof and press E: you climb back down to the upper floor.
- [ ] 3r.3 Walking up to a big building should not freeze the game for more than a moment on the iPhone.

## Stage 3s: the new buildings

- [ ] 3s.1 Walk through downtown Springfield: shops have glass shopfronts with awnings and a brick floor above with a cornice; offices have glass entrances and ribbon windows; banks and libraries are stone with arched windows; schools have long window bands.
- [ ] 3s.2 Homes have siding or brick, trimmed windows (many with shutters) and a front porch. Warehouses and garages are metal with roll-up doors near the entrance; the fire station has red bay doors.
- [ ] 3s.3 Every window you can open lines up with a painted window. At night about half the windows glow.
- [ ] 3s.4 The frame rate in town on the iPhone is no worse than before (the old modelled fronts are gone, so it may be better).

## Stage 3t: the new ground and trees

- [ ] 3t.1 Near homes and roads the grass is short and green; walk out of town and it turns into long grass with flowers. Woods have leaf litter underfoot and thin out gradually at their edges.
- [ ] 3t.2 By rivers and ponds there is a muddy strip at the water and a line of trees along the bank; steep slopes and river bluffs show bare earth and rock.
- [ ] 3t.3 Residential streets are lined with trees on both sides (alternating), houses have a tree or two in the yard, and parks have groves with open lawn between.
- [ ] 3t.4 In autumn the grass turns gold; in winter snow lies on level ground. The Demo Town now has a creek, a wooded bluff and meadows around it.
- [ ] 3t.5 The frame rate in the country and in town on the iPhone is still smooth, and a big map still loads in reasonable time.

## Stage 3u: the 50-mile Springfield region

- [ ] 3u.1 Press Play Springfield, MO. You start at the safe house on the edge of town; the full map shows real streets you know.
- [ ] 3u.2 Walk or drive out of the first square. The next square loads in a second or two and a message says which town you are near (Nixa, Ozark, Republic and so on).
- [ ] 3u.3 Out in the country: pasture with lone trees and hedgerows, oak-hickory woods on the slopes, pines to the south-east, tree-lined creeks, lakes to the south (Table Rock) and north (Stockton).
- [ ] 3u.4 On the iPhone: on the start page under Big region, press **Save for offline** next to Springfield (built in). It counts up to 711 squares (about 80 MB). Then turn on airplane mode and travel: every square still loads.
- [ ] 3u.5 Save and exit in a far square, then Play Springfield again: you resume in that square. Report any square that takes very long to load.
- [ ] 3u.6 The map pack's gaps are filled in: Ozark and east Nixa have streets of homes with a few shops on the bigger roads, and the country has farmsteads (house, barn, shed, a drive and often a stock pond) every few hundred metres along county roads. Report anywhere a filled-in house sits on a road or in a creek.

## Stage 3v: getting unstuck

- [ ] 3v.1 Downtown, climb a ladder to a roof and walk off the edge where the next building touches it. If the next roof is about as high you walk onto it; if not you stop at the edge. You never land inside a building.
- [ ] 3v.2 Go somewhere far, press the menu button, then **Back to safe house** on the start page. The map you were on starts again with you at the safe house, carrying what you had.

## Stage 3w: stealth extras

- [ ] 3w.1 Stand inside a house by a shut window by day: an alien walking past outside can spot you through the glass. Press B at the window: the curtains close (a blind in shops and offices) and it can no longer see in. Press B again to board it up (2 wood); press E to open the curtains.
- [ ] 3w.2 At night, turn your flashlight on indoors: aliens outside come towards the lit windows. Draw every curtain and they stop coming.
- [ ] 3w.3 Walk on grass, a gravel track or a railway, and over the glass from a broken window: the steps sound different, and aliens notice you much further away on gravel and glass than on grass.
- [ ] 3w.4 Drive a car near a giant (or sprint): it turns and comes to look from much further than other aliens.

## Stage 3x: seeing out and climbing through windows

- [ ] 3x.1 Inside a house, look at a ground-floor window: you see the street outside through it. From the street you can see into the rooms.
- [ ] 3x.2 Tap a window to open it, then walk at it: you climb through, in or out. Try several windows in a house, a shop and a block of flats.

## Stage 3y: the power and water fail

- [ ] 3y.1 On day 1 or 2 at night, street lights and many windows are lit, and a stove cooks a meal without wood.
- [ ] 3y.2 At midnight going into day 3 a message says the power is out: the lights go dark, the clock line says "power out", and stoves need wood again.
- [ ] 3y.3 Going into day 5 the water mains fail: sinks and baths give nothing; toilet cisterns still give a little.
- [ ] 3y.4 Find a generator (hardware store, workshop or garage) and some fuel. In a building, use it from Items, press B to pour in fuel and E to switch it on. The room lights up, the stove works without wood, and aliens come to the noise. Curtains stop them seeing the light. B on it when it is off picks it up.

## Stage 3z: new trees and the building rework

- [ ] 3z.1 Trees are the new flat low-poly kind: oaks and maples along streets and in yards, tall poplars and spreading sycamores by creeks, pines and cedars in the woods. In autumn the broadleaves turn orange and gold.
- [ ] 3z.2 Bushes, flowers, grass, ferns, rocks, mushrooms and fallen logs can be gathered (logs give wood).
- [ ] 3z.3 Homes: windows sit in the wall with a sill, a grey plinth runs along the bottom, corners have white boards, roofs overhang with a white fascia; some homes have gable roofs.
- [ ] 3z.4 Small shops have a false front rising above the roof; clinics and offices have a canopy over the door. The frame rate in town is still smooth on the iPhone.

## Stage 3m: day and night (Art 1)

- [ ] 3m.1 By day the sky is blue with a light haze; the town is visible far off. At about 06:30 the horizon is warm orange, at 18:30 golden.
- [ ] 3m.2 At night the sky is near-black with stars and a moon, a dark fog closes in to about 30 m, and the screen edges darken (less so indoors). Lamp pools and the flashlight beam show through the dark.
- [ ] 3m.3 While the power is on (days 1 and 2), about a third of upper windows glow at night, a few of them cold and flickering; some street lamps flicker. After the power fails, only a few cold windows flicker.
- [ ] 3m.4 An alien in the dark shows two green glowing eyes on its head, and lights the ground green near it. Check the swarmer, stalker and giant.
- [ ] 3m.5 The frame rate at night on the iPhone is no worse than by day.

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
- [ ] 5.5 Open the backpack: a Wearing list shows six slots. A save from before 0.40 is wearing its winter coat. Search wardrobes, dressers and a clothes shop; tap Wear on what you find. Wearing something new in a filled slot puts the old one in your pack.
- [ ] 5.6 On a cold night outside, the Warmth meter climbs as you put layers on. On a hot afternoon, the same layers make you overheat until you take them off.
- [ ] 5.7 Stand in the rain without a rain jacket: Damp, then Soaked, appear and you get colder. With the rain jacket on you stay dry. Indoors or by a fire you dry off.
- [ ] 5.8 Take a few alien hits in a leather jacket and helmet: you lose less health and their condition drops; patch them with duct tape. Climb through a broken window in work gloves without crouching: no cut. Die: you wake still wearing your clothes.

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
- [ ] 8.2 Find a car (Kenney Car Kit models; police stations have police cars). Drive it; the wheels roll and the front ones turn as you steer; you hear a low engine note; fuel runs down; aliens are drawn to it.
- [ ] 8.2a At the start of a new world, an old red pickup is parked in the safe-house drive with its front left wheel off (on concrete blocks), its bonnet up and its driver's door leaning on the bed. At its front left corner the prompt lists what it still needs.
- [ ] 8.2b Search garages, auto shops and gas stations (or a trader) for a toolkit, a spare tire, a car battery and engine parts. At the truck, holding E fits one part at a time and you see it go in: the wheel rolls onto the hub, the battery drops into the engine bay, the door swings onto its hinges. When the battery and engine parts are in, the bonnet closes.
- [ ] 8.2c With fuel cans in your pack, E at the driver's door drives the truck. Leave some gear in the truck bed (E at the back), drive off and come back: it is still there. The big map shows "Truck" where you left it.
- [ ] 8.2d At night, E at the passenger door sleeps in the cab until morning. On the Springfield region, drive the truck over the edge of a square: it arrives with you, bed and all; drive it back home and it parks as the safe-house truck again.
- [ ] 8.2e Frame rate near the truck and on a street of parked cars is still smooth on the iPhone.
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
