# Afterstreet: testing roadmap

Everything in `play.html` (version 0.6) has been run only in an automated test browser on one machine with no graphics card. Nothing has been tried on a real drive, a real phone or a real network. The built-in Springfield map is real OpenStreetMap data; the map maker's own downloads are still untried. This roadmap is the order to try those things in.

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

## Stage 4: aliens and weather

- [ ] 4.1 Daytime: small purple swarmers appear in groups and chase you. The bat kills one in a hit or two.
- [ ] 4.1b A dead alien that carries anything leaves a body with a gold cube. Search it. Swarmers carry little, stalkers carry ammo and medkits, giants carry the most.
- [ ] 4.2 Purple buildings with a floating purple cube are nests. Go in, find the glowing core, hold E for four seconds. The nest count drops.
- [ ] 4.3 Survive until night (about two and a half minutes after starting). A tall black stalker should eventually hunt you.
- [ ] 4.4 Press L to turn the flashlight off. Stalkers should find you less easily.
- [ ] 4.5 Light a campfire (C, needs wood from trees). A stalker should circle rather than attack while you stay by the fire.
- [ ] 4.6 From day 2, a giant can appear. It cannot follow you indoors.
- [ ] 4.7 Watch the weather line in the top-left. Rain and storms should show; a storm can bring a tornado warning.
- [ ] 4.8 The Warmth bar: stand outside in rain or at night and it falls; go indoors or stand by a fire and it recovers.

Report anything that feels unfair or pointless: too many aliens, too few, a stalker that cannot be escaped, weather that kills too fast.

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
- [ ] 8.2 Find a car. Drive it; fuel runs down; aliens are drawn to it.
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
