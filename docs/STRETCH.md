# Afterstreet stretch goals

Ideas that are not in the build plan (docs/ROADMAP.md, "Next versions"). Nothing here gets built until the planned work is finished. New ideas that come up while building are added here, not to the roadmap.

- Whole roadside buildings as landmarks with collision (diner, motel, drive-in, water tower, grain elevator, mobile homes, cabins from the roadside pack). The map does not mark most of them, so they need a rule for where they go.
- Farm drive, mailbox at the road, cattle guards and pasture troughs.
- Workshop: build a design in the game at a garage by filling in a ghost of it with found parts, like Space Engineers' projector (designs copy freely, the parts must be found).
- Workshop: panels, bumpers and doors that break off piece by piece in crashes (Trailmakers), from the materials each Workshop piece already records.
- Workshop: wiring and logic for vehicles (Stormworks): switches, lights, winches.
- Workshop: a pose sweep that checks clothes never poke through the body at any build or clip frame; a second paint slot for trims.
- Workshop: NPC looks edited as named bundles (old_ranger, medic) in the Workshop; copying a garment between the masculine and feminine bodies with automatic refit.
- Workshop: wiring building modules together on a grid in the Workshop (whole buildings from modules), tile edge sockets that check neighbours.

## From the Workshop's W1 to W15 hand-off (27 October)
Game-side wiring still to do, after the planned roadmap: pack items (new keys need behaviour), moving parts and hinged doors on pack models, lights (colour, reach), plant sway and harvest, collision boxes for pack buildings and structures, particle effects (`AfterstreetPacks.effects`), creatures (bones, clips, drops), sounds installed before `sndInit`, packs picked on a device (IndexedDB), guests' pack cars sent to the host, pack-car headlights and build cost.

## Animals, next (from 0.114.34)
Boars, wolves and bears that attack; birds that fly and perch; fish and fishing; farm animals on farmland; a knife item (butchering is axe, crowbar, toolkit or bare hands for now); hide crafting (clothes, bags); bones and fat uses; animals synced to guests; wolves hunting the player at night.

- Waterways pack in the real map: choose the bank piece from the data (bend inside or outside, town or country) per the guide's table, fit banks to the terrain, flow scrolling. Only the test street has it now (waterwaysBuild in engine/world.js).


- Water: gradual depth, draining, running downhill over undug ground, current, boats and swimming in dug channels, the river as a deformable surface (see docs/WATER.md).
- Bank pieces: place by real river data (bends, pools, riffles) on real maps; today the layout is only on the test sheet.

- Water running downhill over undug ground (runoff, puddles in low spots); the river as a deformable surface.
- Upper-floor window glass is still opaque (ground floor is see-through).
- Bridge deck slab and earth ramps can still step on very steep approaches (trusses and hangers now lean with the deck).

## Stretch goals paired with each game mode (4 November 2026)
Use this to pick the next stretch goal when a mode's planned work (docs/GAME_LOOPS.md) is done. A goal can serve more than one mode.

**Endless (settlement)**
- Animals, next: farm animals on farmland, fish and fishing, hide crafting (clothes, bags), bones and fat uses, a knife item. These feed self-sufficiency (meat, hide, fish) and give the settlement more to do.
- Farm drive, mailbox, pasture troughs: farm sites the settlement can take over.
- Water: gradual depth, runoff, puddles, the river as a deformable surface; wells and rain collection for the settlement's water.
- Whole roadside buildings as landmarks (diner, motel, water tower, grain elevator, cabins): places to claim as outposts.
- Workshop: build a design at a garage by filling in a ghost with found parts: the settlement's workshop work.

**Reclaim (zones and nests)**
- Animals that attack (boars, wolves, bears; birds): wildlife makes uncleared zones feel more dangerous.
- Workshop: wiring and logic (switches, lights, winches): traps, alarms and lit outposts for sieges.
- Workshop: parts that break off in crashes: armoured vehicles that take a beating at nests.
- The Workshop game-side wiring (pack items with behaviour, moving parts, lights, collision for pack buildings): lets players bring their own siege tools and outposts.

**Escape (7 days to the airport)**
- Aircraft that can be drawn and flown (bush plane, gyrocopter, helicopters are built in the Workshop): the real fly-out instead of a scripted one.
- Waterways in real maps (bank pieces from the data, flow): harbour exits and river crossings on the way.
- Bridge deck and ramp fixes (steep approaches): a smoother road to the airport.
- Workshop: wiring and logic for vehicles; panels that break off: tougher cross-city drives.
- Whole roadside buildings as landmarks: stops along the route.

**Together (shared base, harder world)**
- Workshop: NPC looks as named bundles (old_ranger, medic): roles for friends and settlers.
- Workshop: a pose sweep so clothes never poke through at any build or clip frame; second paint slot: players' looks in a shared base.
- Animals synced to guests: shared wildlife.
- Multiplayer station building for guests (today host-only): everyone can build at the shared base.

**All modes**
- Upper-floor window glass see-through; the Workshop's wiring of modules into whole buildings; the waterways pack on real maps.

## Play on more devices (8 November 2026)
From docs/DEVICES.md. Gamepad support, detail presets, saves on the drive in every browser and the Pi kiosk start are planned work, not stretch. These are the extras:
- **Desktop-less Linux retro handhelds** (ROCKNIX, Knulli, muOS, ArkOS on Anbernic, Miyoo, Powkiddy and the like): a PortMaster port that starts the open-source WPE WebKit `cog` launcher on `play.html`, drawing straight to the screen. Only models with 2 GB or more; 640x480 layouts.
- **Android package** built openly from this repository (Capacitor or a plain WebView), offered on F-Droid, for handhelds and phones where the website is not wanted.
- **Xbox** through its Edge browser, once gamepad support is in: test, then a note in the guide.
- **A "Handheld" detail preset** below Low: half-resolution drawing scaled up, 30 fps cap for battery, shorter view distance, fewer aliens at once, small maps by default.
- **On-screen gamepad keyboard** for chat, survivor names and map search on devices with no keyboard or touch.
- **Host-your-own kit**: a one-page guide and a tiny optional home-server script so a household, school or club can serve its own copy on a home network.
- **Low-memory map squares**: squares cut smaller (or loaded in parts) for devices with 1 to 2 GB.
- **Battery and heat mode** on phones and tablets: frame cap and lower resolution when on battery or warm.

