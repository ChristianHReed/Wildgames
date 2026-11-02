# Vehicle design and "better looking" rules (Content chat)

Researched from car-design writing, low-poly style guides and three vehicle-builder games (Stormworks, Space Engineers, Starbase). Every rule below is tied to something the builders can do. Check this before making or remaking any vehicle, boat, aircraft or machine.

## 1. Silhouette first
- The outline must say what the thing is with the colours turned off. Decide the "species" (hatch, sedan, wagon, SUV, pickup, van) by the side profile: how steep the rear glass is, how upright the nose is, where the A pillar sits.
- Exaggerate a little. Timid geometry reads as unfinished: chunkier wheels, bolder wheel arches, a clearer step between hood and cabin.
- Thumbnail test: render the album scene small. If two vehicles look alike at 64 px, change the profile, not the paint.

## 2. Proportions (car design basics)
- "Wheel at each corner": keep overhangs short. Equal front and rear overhang looks static; a slightly longer tail (rear drive) or nose gives movement.
- Close the wheel-to-arch gap. A big gap looks like a truck on stilts. Arch top should sit about 6-10 cm above the tyre top; add a dark arch trim so the wheel reads as sitting in the body.
- Bigger wheels read sportier; small wheels read cheap. Wheel radius 0.31 (cars), 0.38-0.42 (SUV/pickup/off-road).
- Cabin position: cab-forward = family/van; cab-rearward = sporty/pickup. Pickups and trucks are bonnet-long with the cab set back.
- Beltline: low beltline + thin pillars + more glass = airy and light; high beltline + thick pillars + low roof = tough, closed, military. Armoured and military vehicles get a high belt and small windows; family cars a lower belt and bigger glass.
- Tumblehome (greenhouse narrower than the body): more lean is sportier, less is stable and formal. Our box cabins are straight-sided, so narrow the roof (inset ~0.05-0.1 m each side) on cars, not on vans, buses or trucks.
- Tuck-under: the lower body can be slightly narrower than the shoulder so the tyres show; use the sill and arch trim for the same read.

## 3. Detail priority (spend pieces where players look)
1. Front face: headlight pair, grille, bumper, bonnet line.
2. Wheels and arches.
3. Side: mirror, door handles, sill, door gaps (doors are separately named pieces so the cut line shows).
4. Rear: tail lights, bumper, plate.
5. Roof: only on trucks, military, emergency (lights, racks, hatches).
Skip underside detail beyond the chassis rail and axles. Cabin interiors stay simple (the kit already has them).

## 4. Colour and value
- One shared palette; paint1 body, paint2 trim/black, paint3 light trim. Value contrast beats hue contrast: dark tyres/arches/glass against a mid body, light chrome/lights on top.
- Two-tone helps (roof or lower sill in paint2). Warm body against cool glass.
- Lights: headlights pale, tail lights red, always as `light` pieces so they glow at night.
- Glass is a thin tinted pane (see CONTENT_NOTE_INTERIORS_GLASS), never a block.
- Flat shading, no smooth fakery; the facets are the style.

## 5. Stance and function (what the vehicle games teach)
- Centre of mass low (Stormworks): heavy parts (engine, tank, battery) sit low; high COM tips cars and boats.
- Boats: centre of mass below centre of buoyancy; the Hull block sets the float. Aircraft: planes COM just ahead of lift, helicopters COM under the rotor.
- Build the hull for looks and fit the working blocks inside (Space Engineers), or build the working blocks first for tiny craft and wrap them. For our cars: chassis, axles, engine first, body over.
- Decide symmetry early; the driver is on the left (x<0) and everything else mirrors with `mx`.
- Keep a clear job and size class (Starbase modules, hangar-door limit): our fit stations are Car shop 3.2x4.4x17 m, Hangar 16x12x24 m, Dock 6x8x16 m.
- Mass costs speed. Do not add equipment the vehicle does not use.
- No gaps in plating (Starbase): hulls and cabins must be closed or deliberately open with a door; pieces must touch.
- Interiors: walkable floors, 5 ft 9 in headroom for walk-in, doors, seats, lights, lockers (Space Engineers).

## 6. Budget and consistency
- Triangle budget per class: cars ~800-1500, trucks/buses ~1000-2500, boats ~200-1200, aircraft ~400-2000 (cap 6000). Matching density across a pack matters more than the total.
- Reserve extra pieces for vehicles because the player sees and drives them.
- Same rules everywhere: same wheel set, same light style, same mirror/handle shapes, same paint slots, so a pack looks like a family.

## 7. Checklist before shipping a vehicle
1. Profile reads at thumbnail size. 2. Overhangs short, arches close. 3. Dark arch trims, sill, mirrors, handles, lights both ends. 4. Value contrast (tyres/glass dark, trim light). 5. Low COM, eye point and steering wheel points present. 6. Tests pass (`node workshop/tools/test_crafts.js`). 7. Album render checked.

## Applied so far
- cars.js: arch frames (lip + two posts), sills, wing mirrors and door handles added to all 9 stock cars/trucks and the 3 military cars that reuse it.
- Still to apply: roof inset (tumblehome) on cars, front/rear light pairs on buses and trucks, arch trims on buses/trucks/APC, two-tone sills.

## Lessons from rendering (red truck, 1 Nov 2026)
- A single dark bar over a wheel reads as a stripe, not an arch. Build the arch as a frame: a lip over the tyre plus a post at each side, outside the wheel's face so it never hides the wheel.
- Always render and look before calling a vehicle done; the tests cannot see proportion. First look showed small, low wheels, so the red truck got radius 0.5 and a higher floor (0.66).
- Big wheels need the body raised with them (floor and arches), or the tyre cuts through the hood line.

## The reference look (user pictures, 1 Nov 2026) - recipe in workshop/designs/refs.js
Chunky 90s low-poly: raked windscreen on slim pillars; sloping hood; slatted dark grille flanked by square white headlights with an amber indicator under each; wide grey-blue bumper with two black bull-bar posts; dark arch frames; dark lower cladding between the wheels; big black mirrors on arms; tinted glass with seats visible; two-tone paint and simple livery (stripes, light bars). Raked glass is a vertical pane rotated about X by -alpha (size [w, length, 0.04]); a hood that slopes down to the nose is a box rotated +deg about X. Rotated pieces still need to touch their neighbours.
Second pass, what the comparison taught: (1) glass must be light enough to show the interior (stock `glassL`, not the dark `glass`); (2) seats brown, not dark grey, so they read through the glass; (3) lettering sells a vehicle - `text()` in refs.js builds 3x5 block letters as merged boxes (right side reads front to back, left side the reverse), keep it to about 40 boxes per word; (4) headlights pure white, indicators amber; (5) the headliner must stop where the raked roof starts (`headF` option in cabin_kit) or it sticks out over the windscreen.
Third pass: door glass must follow the raked A pillar. A vertical-edged window next to a raked windscreen looks wrong; `trap()` in refs.js makes a four-corner slab (a 'corner' piece with its own vertices) and a rotated slim post forms the slanted front frame. Van wheels were too small (31% of body height): reference vehicles run wheel diameter near 40% of height.
Fourth pass (the user said "a lot of gaps and issues"): I had only looked at one 3/4 view. Always render FOUR views (right side, front 3/4, rear 3/4, left side) before saying done. What that exposed: wheels sat under a solid slab with only a bar drawn over them (wheel openings must be cut into the body with `wall()`, with a dark well behind and a flare lip around); an open gap beside the SUV rear seats (side glass must run door to tail with a B pillar and thick C pillar); a slot behind the van door (add a B pillar); a void under the fire engine body (side skirts and an under plate down to wheel-centre height); wheels too small (SUV/pickup radius 0.45, fire engine 0.6). Gaps you can see daylight through are bugs even when the tests pass.
Fifth pass: the greenhouse leans in (tumblehome) - `quad()` makes any four-corner pane (windscreen, door glass, quarter and rear glass are narrower at the top by lean L = 0.11 m; vans 0), `post()` leans a pillar in by L, the roof is inset by L. Wheels are rounder (12-sided tyre, 10-sided grey hub, darker cap) via `wheelLook()`. A raked pillar is a SHORT box (0.07 x length x 0.07) rotated about X (rake) and Z (lean); never size it by its z-projection or it flares out as a flap. Cost: wheels add about 300 triangles per vehicle, so keep lettering short.
Vehicles built: police SUV, green SUV, red and orange pickups, green van, ambulance, fire engine (city).

## Sources
- [Car design essentials part 1: bones (Car Design News)](https://www.cardesignnews.com/cars/car-design-essentials-part-1-bones/482965)
- [Greenhouse (car), Wikipedia](https://en.wikipedia.org/wiki/Greenhouse_(car))
- [Low poly game art guide (Pixune)](https://pixune.com/blog/low-poly-game-art-guide/)
- [Low poly 3D: a style guide for small teams (Bugnet)](https://bugnet.io/blog/low-poly-3d-a-style-guide-for-small-teams)
- [Building Tips, Space Engineers wiki](https://spaceengineers.wiki.gg/wiki/Building_Tips)
- [Center of Mass, Stormworks wiki](https://stormworks.fandom.com/wiki/Gameplay/Mechanics/Center_of_Mass)
- [Spaceship Assembly Guide, Starbase wiki](https://wiki.starbasegame.com/index.php/Spaceship_Assembly_Guide)

## Interiors and the driver's view (pass 6)
- Always judge a cab from the real `cabin.eye` point (seat height + 0.66 m), looking slightly down. A guessed camera height gives a false picture.
- Driver view needs, in order: windscreen with pillars, bonnet line, dash top, small binnacle with gauges, wheel ring in front of the gauges, mirror and visors above. Keep gauges small or they fill the screen.
- Wheel ring must touch its column (a floating ring fails the loose-piece test).
- Cargo interiors (ambulance stretcher, bench, cabinet, oxygen; van shelves and crates) cost about 400 triangles; check the budget after adding them.
- Glass is see-through and slightly tinted: names start `glass`, tint #9bb3ba, drawn at alpha about 0.26. The album shows this; the game only does it for building glass today, so vehicle glass needs the main chat.
- Known gaps: fire engine cab not checked from the eye, seats are blocky, the wheel does not turn (needs a Workshop rig job).

## Fleet rebuild (pass 7, 2 Nov 2026)
Every vehicle and craft was rebuilt with the recipe above. Where things live now:
- `workshop/designs/refs.js`: car builder (`refcar`) for cars, pickups, vans, SUVs, ambulance, police; table `P` (reference vehicles) and `Q` (the stock `*_remade` cars). Supports `doors4`, `kind:'sedan'`, `flat` (flatbed), `rack`, `extra(b, ctx)` hook for military fittings. Exports helpers as `.H`.
- `workshop/designs/heavy.js`: truck cab builder (`cab`), chassis, buses, motorhome, box truck, semi, army trucks and cars, APC, trailers.
- `boats.js`, `aircraft.js`, `bush_plane.js`, `helicopter.js`, `military.js`: shaped boat hulls, tinted glass, details.
- Old files kept as `old_*.js.txt` for reference; their ids now come from the new files, so no id changed.
Lessons:
- Width budget: the car shop is 3.2 m wide, mirrors included. Keep mirror arms short (about 0.2 m) on wide buses.
- A walk-in way in needs a door at least 1.6 m tall (a 1.45 m door made the motorhome fail the RV rule).
- Pieces laid on a shell wall need to sit 0.04 to 0.1 m proud of it: flush ones z-fight (dithered), too far ones count as loose (lettering above 0.06 m off failed).
- Wheel openings: cut with `wall()` and finish with `arch()`; add `wheelLook()`. Floors must clear wheel tops or the wheel pokes into the cabin.
- Lettering font now has A B C D E F G H I K L M N O P R S T U V W Y and space.
- Aircraft are still the weakest: blocky fuselages, no rotor or propeller in the preview (they are separate parts). Next pass should loft the fuselage and cowl.

## Seat order (driver on the left)
`functions.seats[0]` is the driver on the left (x < 0), `seats[1]` the front passenger on the right, then rear rows front to back, left before right. The engine sorts seats right before left, so `cabin_kit.js` nudges every left seat 1 cm forward. Use `seat()` from `cabin_kit.js` or add the same nudge when placing seats by hand.

## Eye height in low-roof cars
The driver's `cabin.eye` is clamped to at most 0.30 m below the roof, and cars with a roof under 1.65 m get a seat 8 cm lower. Before this the headliner sat about 4 cm above the eye in the Ozark, wagon, sedan and hatchback, and filled the top of the view.
