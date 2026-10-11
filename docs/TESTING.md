# Afterstreet: testing roadmap

Everything in `play.html` (version 0.12) has been run only in an automated test browser on one machine with no graphics card. Nothing has been tried on a real drive, a real phone or a real network. The built-in Springfield map is real OpenStreetMap data; the map maker's own downloads are still untried. This roadmap is the order to try those things in.

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
- [ ] 0.2 Confirm the folder holds `play.html` and the folders `maps`, `world`, `characters`, `packs`.

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
