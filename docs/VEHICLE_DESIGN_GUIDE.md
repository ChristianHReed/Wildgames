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
Vehicles built: police SUV, green SUV, red and orange pickups, green van, ambulance, fire engine (city).

## Sources
- [Car design essentials part 1: bones (Car Design News)](https://www.cardesignnews.com/cars/car-design-essentials-part-1-bones/482965)
- [Greenhouse (car), Wikipedia](https://en.wikipedia.org/wiki/Greenhouse_(car))
- [Low poly game art guide (Pixune)](https://pixune.com/blog/low-poly-game-art-guide/)
- [Low poly 3D: a style guide for small teams (Bugnet)](https://bugnet.io/blog/low-poly-3d-a-style-guide-for-small-teams)
- [Building Tips, Space Engineers wiki](https://spaceengineers.wiki.gg/wiki/Building_Tips)
- [Center of Mass, Stormworks wiki](https://stormworks.fandom.com/wiki/Gameplay/Mechanics/Center_of_Mass)
- [Spaceship Assembly Guide, Starbase wiki](https://wiki.starbasegame.com/index.php/Spaceship_Assembly_Guide)
