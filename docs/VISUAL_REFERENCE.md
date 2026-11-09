# Visual reference board

Collected 8 November 2026 from five sets of pictures the owner shared (about 85 images). This page says what each picture shows and what Afterstreet should take from it. It works alongside `docs/ART.md` (the chosen look: faceted low-poly, cozy days, scary nights), which still decides: these pictures sharpen that look, they do not replace it.

**The pictures themselves are not in this repository.** They are other artists' and studios' work (Synty POLYGON packs, KitBash3D, Assetsville, HOMART, Illustrat3D, Descend and others, some AI-made). The repo is public and open source, so copying them in would be redistributing work we have no rights to. The owner keeps the originals; this page describes them in words so the content chat and Workshop can work from it. Nothing here is to be traced or copied: the aim is the feel, made with our own models.

## What the board says, in one paragraph

Clean faceted models with flat colour and soft daylight; rounded "puff" trees in clusters; grass that reads as many blades, not a flat green; toon water with white foam rings where it touches rocks, shores and people; warm lit windows at night against dark pines; and American small towns full of the clutter that makes them real: power poles and sagging wires, water towers, gas station canopies, tall price signs, dumpsters, newspaper boxes, hydrants, parking lot lines, roadside lots full of machines. Seen from above, a town is a tidy miniature; seen from the street, it is lived in.

## Second look: why these worlds work

A closer study of the whole board (written the same day). The pictures differ a lot in style, from flat paintings to model railways to clean low-poly kits, but they share the same few habits. Those habits matter more than detail: a 3,000-face tree in a painting looks better than a 30,000-face one in a dull scene. Every habit below is listed with the cheapest way the game could get it, since the game has to run on an iPhone 11.

### 1. Light: one warm source, cool everywhere else

- **The shade is coloured, never grey.** In the freeway, coast road, parking lot and desert paintings, sunlit sides are warm (cream, gold, peach) and shadows are blue or violet. That one contrast makes a scene look lit rather than painted on. Grey or black shade looks dead.
- **The sun sits low.** Almost none of the best pictures are at noon. Morning and evening give long shadows that run across roads and lawns, and long shadows show the shape of the ground better than any texture.
- **The sky colour bleeds into everything.** Far hills turn the colour of the sky (the lakeside town, the coast village, the desert mountain). Near things are saturated, far things are pale and blue. This is aerial perspective: it gives depth for free and hides the edge of the world.
- **At night, light is a place.** In the night shop in the pines, the whole picture is near-black blue with one orange pool of light, lit windows and glowing vending machines. The dark is not black: it is deep blue, so shapes still read. Light comes from things that make sense (a street lamp, a window, a fire barrel).
- **Bounce light.** Clean renders (toy town, motel, Zlín) are lit by a soft sky from above: tops are bright, undersides darker, and corners where walls meet the ground are slightly shaded (ambient occlusion). That last detail is what makes a building sit on the ground instead of floating.

**What the game already has:** a mood table per hour (sky, horizon and fog colour, sun colour, shade colour, edge darkness), lamp pools and lit windows at night, seasons. **What to push:** make the shade colour bluer and the sun warmer at morning and evening; spend more of the day near those hours; fade far terrain toward the horizon colour more strongly by day; darken the foot of every wall and the ground right next to it (baked into the vertex colour, so it costs nothing per frame); keep night blue-black, not grey-black.

### 2. What makes a place feel lived in

- **Clutter at the edges, not in the middle.** Bins at the kerb, a newspaper box on the corner, a bike against a fence, crates by a back door, an air conditioner under a window, a dumpster behind the shop. The road and pavement stay clear; the stuff gathers where walls meet ground and at property lines. That is exactly how real places collect things.
- **Wires.** Power poles and sagging lines appear in nearly every American and Japanese street picture. They join the buildings together and draw lines across the sky. One line per span, slightly sagged, is enough.
- **Every roof is busy.** From above, flat roofs carry units, vents, water tanks, ducts, ladders, satellite dishes, sometimes plants. A plain flat roof reads as unfinished.
- **Things are slightly wrong.** A car parked crooked, one garage door open, a shutter half down, a fence plank missing, a tarp on a roof, a faded sign. Repetition with small breaks reads as real; perfect rows read as a kit.
- **Signs and words.** Shop signs, price signs, street signs, exit signs, painted road arrows and parking lines. Words on things make a place feel like it had a purpose. Our signs should use made-up names, and some should be faded or broken.
- **Ground wear.** Paths worn into grass where people cut corners, oil stains in parking bays, darker tarmac in the wheel tracks, puddles in low spots, cracks with weeds. Wear shows where people used to go.
- **Gardens and yards differ.** In the suburbs, each lot has a different mix: flowers, a pool, a swing, a vegetable patch, a boat on a trailer, a dog house. Variety per lot matters more than detail per house.
- **After the fall, it is the same clutter, left.** The post-apocalyptic pictures work because the everyday clutter is still there, just abandoned: cars where they stopped, doors open, tents, a burned sign, plants on roofs. Ruin reads strongest against normal life, not instead of it.

**Cheap ways:** decal-like quads for stains, puddles and worn paths baked into ground tiles; a small "edge clutter" list the builder scatters along building walls and kerbs (seeded per building so it never changes); one line per pole span for wires; a roof-unit set placed on flat roofs by size; a random "one thing off" per lot (open garage, missing fence plank, tarp).

### 3. What makes nature look alive

- **Colour varies tree to tree.** No forest in the board is one green. Each tree is a slightly different hue and brightness, a few are yellow or orange even in summer, and pines are much darker than broadleaf trees. In autumn the mix gets bold (red, orange, gold among dark pines).
- **Light passes through.** Painted trees have gaps in the crown where sky shows, and their sunlit edges glow yellow-green while the inside is deep blue-green. A crown that is one solid colour looks like a ball.
- **Clumps and edges.** Trees grow in groups with bushes at their feet and long grass round the bushes. Forests have an edge: small trees and shrubs where the forest meets a field or road. Single trees stand in the open with space round them.
- **The ground is never flat green.** Grass has patches of lighter and darker, yellow dry patches, flowers in drifts (not scattered evenly), dirt where it is worn, moss near water and in shade.
- **Everything moves a little.** Grass bends in waves, leaves shimmer, tall grass on the highway shoulder leans in the wind. Movement is the strongest sign of life, even when it is slight.
- **Nature takes over the built world.** Weeds in cracks, vines on walls, trees through roofs, grass on old cars. In a post-apocalyptic game this is also the clock: how long since the fall.

**Cheap ways:** per-tree random hue and brightness in the vertex colour (no extra draw cost); a few autumn-coloured trees all year; brighter colour on the top and sun-facing side of each crown, darker underneath; a ground tint map with slow noise for light and dark patches and drift-shaped flower patches; wind sway in the vertex shader for grass and leaves, scaled by a wind value that rises with weather; tall-grass and shrub bands along forest edges, road shoulders and fences; overgrowth level that rises with days survived.

### 4. What makes the water beautiful

- **Depth is colour.** Shallow water is pale turquoise or shows the bottom; deep water is dark blue. The change runs in bands away from the shore. This is the single strongest effect in the toon water, the lighthouse, the shallow sea and the suspension bridge pictures.
- **Foam marks every edge.** A white line where water meets sand, rings round rocks, posts and wading legs, a white band at the foot of falls and rapids. Foam tells the eye where the water ends and that it is moving.
- **The sky is in it.** Calm water shows a soft reflection of the sky colour, brighter toward the horizon. Even a fake reflection (the sky colour mixed in at shallow angles) does most of the work.
- **Light sparkles.** Small bright glints on the surface toward the sun. In paintings it is a few dabs of white.
- **Water is calm, rivers move.** Lakes and ponds are smooth; rivers have streaks running downstream and white where they hit rocks.
- **Banks are soft.** Wet dark ground at the edge, then reeds or long grass, then normal ground. Hard edges between water and grass look like a hole in the ground.

**Cheap ways (WebGL 1, phone-safe):** water depth from the terrain height already known at each point, used to blend shallow and deep colour; a foam band where depth is near zero, with a slowly moving noise so it breathes; foam rings round props in water and the player; a Fresnel-style mix toward the sky colour at low view angles; sparkle as a high-power specular toward the sun from a scrolling noise normal; flow streaks along the river direction already stored for waterways; wet-dark ground and reed band along every bank (see "Waterways guide" in the Project).

### 5. Colour and the far view

- **A limited palette per scene.** The best pictures use few colours: the desert painting is sand, sage, faded blue; the night shop is blue-black and orange. The game's seasons and times of day should each have a small, firm palette.
- **One accent colour.** Yellow taxis and buses in grey streets, a red car on a grey bridge, a yellow kiosk on white. Abandoned vehicles and signs are our accents.
- **The far view is simple.** Distant towns are blocks of colour, far forests are a single toned mass, mountains are flat shapes paler than the land in front. Detail belongs near the player; far away, shape and colour carry the scene. This is also how the game stays fast.

### Order to try them in (main chat)

Most of these cost little or nothing per frame. In order of effect for the effort:

1. Warmer sun and bluer shade, more time near golden hour; stronger haze toward the horizon colour by day.
2. Darkened wall feet and ground next to walls (baked).
3. Per-tree colour variety and lit-top/dark-underside crowns.
4. Water: depth colour bands, foam edge, sky mix at low angles.
5. Ground tint patches, flower drifts, worn paths.
6. Wind sway on grass and leaves.
7. Edge clutter and roof units from the builder; wires between poles.
8. Overgrowth that grows with days survived.

Each is checked on the iPhone 11 with the benchmark before it is kept.

## Third look: how the worlds are laid out

A study of the layout logic in the board: where things go and why. This matters more for Afterstreet than for the games in the pictures, because our map comes from OpenStreetMap. OpenStreetMap gives the roads, the building outlines, land use and some points (trees, hydrants, lamps, bus stops). It almost never gives the things that make the pictures read: lot lines, yards, fences, driveways, kerbs, verges, clutter, parked cars, the edge of a wood. The builder fills those in (it already adds homes and driveways on empty lots along town streets). The rules below are what it should follow, so the filled-in parts look as if they belong.

### 1. Everything is in bands across the street

Every street picture, from the Japanese suburb to the American town, is the same cross-section, from the middle out:

| Band | Town street | Suburb | Main street | Rural road |
| --- | --- | --- | --- | --- |
| Road with markings | 2 lanes, centre line | 2 lanes, often no line | 2 to 4 lanes, parking both sides | 2 lanes, yellow centre, white edge |
| Kerb | Yes | Yes | Yes | No: a soft shoulder of gravel |
| Verge (grass strip) | 1 to 2 m, street trees, poles | 2 to 3 m, trees, mailboxes, bins on collection day | None: paved to the wall | Wide grass and ditch, tall grass, poles |
| Pavement (sidewalk) | 1.5 to 2 m | 1.2 to 1.5 m | 3 to 5 m, benches, bins, meters, lamps | None |
| Front yard | Small, fence or hedge | 6 to 10 m lawn, path to the door | None: shop fronts on the pavement line | Big, often unfenced |
| Building | Close to the front | Set back, garage to one side | Built wall to wall | Set far back, barns behind |

The builder knows the road class from OpenStreetMap. The road class picks the column, and the column decides the kerb, the verge, the pavement and how far back a generated building sits. Things belong to a band: trees and poles in the verge, never on the pavement; mailboxes at the verge edge; benches and meters on a main street pavement only.

### 2. Lots: the unit of a neighbourhood

Every house in the suburb pictures sits on a lot with the same parts: front yard to the street, the house, a driveway along one side to a garage, a back yard behind, and a fence or hedge on the side and back lines. Lots on one street are about the same width, and houses line up at about the same setback. That regular rhythm, broken by small differences (one house turned, one lot doubled, one empty), is what makes a street read as a street.

Rules for the builder:
- Lots face the street. A house faces the road it is closest to, with its door toward it.
- Driveways are on one side, and on a corner lot they come off the quieter street.
- The back yard is where things go: a shed, a pool, a vegetable bed, a swing, a trampoline, a boat on a trailer, a wood pile. One or two per yard, chosen from the lot's seed.
- Fences run along back and side lines, rarely across the front in suburbs, often across the front in older town streets.
- Back yards meet back yards. Blocks are two rows of lots back to back, so the inside of a block is a patchwork of yards and fences, not open grass. That inside is where a player sneaks through.

### 3. A town has a gradient, centre to edge

Zlín, the Japanese town, the main street and the city diorama all show the same order from the middle outward:

1. **Centre:** tall, wall-to-wall, flat roofs, shops on the ground floor, little green, a square or park as a break. Civic buildings (town hall, church, police, post office) face the square or main street.
2. **Main street and inner streets:** two to four storeys, shops below, flats above, parking along the kerb, alleys behind with bins and back doors.
3. **Inner suburbs:** older houses on narrower lots, porches, street trees, a corner shop now and then.
4. **Outer suburbs:** wider lots, garages, curving streets and cul-de-sacs, a school and a park.
5. **The edge:** big flat-roofed boxes on big parking lots (supermarket, warehouse, strip mall, car dealer) along the main roads out, then fields, then forest.
6. **Country:** farms set far back on long driveways, a gas station and country store at a crossroads, scattered houses along the road.

OpenStreetMap gives most of this through land use and building size, but where it is thin the builder should take height, setback, roof type and lot width from the distance to the town centre and from the road class, so a gap is filled with something that fits its ring.

### 4. Roadside buildings follow the car

The gas station, the strip mall, the motel, the fast-food place, the country store, the tractor dealer: all of them sit in the same pattern.
- The building is set back, with the parking lot between it and the road.
- Two driveways cut the kerb, often near the ends of the lot.
- A tall sign stands at the road edge, near a driveway, so it can be read from a car.
- The back of the lot holds the service side: dumpsters, a loading door, a fence, a storage tank or a trailer.
- Painted bays face the building; cars park nose in.

For the game this gives a reliable loot and danger layout: the open lot is exposed, the front is glass, the back is the quiet way in.

### 5. Landmarks, sightlines and the way the eye travels

- **One tall thing per area.** A water tower, a church spire, a radio mast, a lighthouse, a grain silo, an office tower. Every town picture has one, placed so it can be seen down a street. Players steer by them. The builder should make sure each map square has at least one tall landmark, using the tallest real building, a water tower or a mast where OpenStreetMap has one.
- **Streets end on something.** A long straight street that ends on a church, a hill or a big building feels designed. Where a street ends on nothing, a row of trees or a fence line is better than open space.
- **Corners are special.** Corner buildings are taller, rounded or have a shop, a sign or a clock on them (corner shop tower, rounded block, the convenience store). Corners are where the eye stops.
- **Open spaces break up density.** A square, a park, a car park, a sports field, a rail yard. Without them a dense town reads as one mass.

### 6. Nature has a layout too

- **Forests have edges.** From open ground inward: tall grass, then shrubs and young trees, then the forest wall. The edge is thicker on the sunny side. Roads through forest have a cleared strip on each side with grass and poles.
- **Trees follow water and lines.** Rows along streams and rivers, rows along field edges and fences, rows along roads. Lone trees stand in fields or yards with clear ground round them.
- **Slope decides.** Steep ground is forest, rock or scrub; flat ground is fields or town. Valleys hold water and the greenest growth; ridges are drier, paler and rockier.
- **Fields are patchwork.** Fields come in blocks of slightly different colours and crops, separated by hedges, fences, tracks or tree lines, with a farm cluster (house, barn, silo, sheds) at one corner by the road.
- **Water sits low.** Rivers in valley bottoms, ponds in hollows, a band of reeds and wet ground round every one, paths along the bank, a bridge where the road crosses, often a small park by the water in town.

### 7. Vehicles and people show where life was

- Cars park along kerbs, in driveways, nose in at shops; very few stand in the middle of the road in normal life.
- In the post-apocalyptic pictures the tell is the opposite: cars stopped in lanes, bunched at junctions and bridges, doors open, some crashed into poles. Jams build up where people tried to leave: the main roads out, bridges, on-ramps.
- Big vehicles sit where work happened: trucks at the warehouse dock, buses at the depot and along bus routes, tractors in the farm yard and at the dealer, police cars at the station and at roadblocks, ambulances at the hospital.
- Camps and barricades are on purpose: a quarantine camp in a park or school field, a roadblock on a bridge or at the edge of town, sandbags round a police station.

### 8. What the builder should do with this (map chat)

In order of effect:

1. **Street cross-sections by road class:** kerb, verge, pavement and setback from the table in section 1; trees, poles, lamps and mailboxes placed in their band.
2. **Lot fill:** for generated and real houses alike, a driveway, a fence on side and back lines and one or two back-yard items, from the lot's seed.
3. **Town rings:** height, setback, roof and lot width taken from distance to the centre where OpenStreetMap is thin.
4. **Roadside pattern:** shops and stations on big lots get a parking lot to the front, a pole sign at the road, a service side at the back.
5. **Landmark check:** at least one tall thing per map square.
6. **Forest edges and tree rows:** edge bands round woods, rows along water, fields and roads.
7. **Abandoned traffic:** cars parked by the rules above, plus jams on main roads out of town, at bridges and on-ramps.

The main chat then makes these places worth visiting: loot that matches the lot and the building, and danger in the open lots and jammed roads.

## Set 1: nature, water and mood

| Picture | What it shows | What to take |
| --- | --- | --- |
| Wheat growth stages | One crop drawn in five stages from shoots to ripe heads. | Garden plots grow through 4 to 5 visible stages, not seed then done. Same idea for every crop. |
| Isometric ruined town | Post-apocalyptic block from above: motel, diner, faded billboards, cracked lots. | Roadside America after the fall: billboards and motel and diner signs are landmarks. |
| Stylized islands with rivers and paths | Small islands, winding rivers, dirt paths, clustered trees. | Paths worn into grass; rivers that wind; trees in groups, never even spacing. |
| Toon water with foam | Flat blue water, white foam rings round rocks and stepping stones. | Foam rings where water meets anything (shore, rock, pier post, player wading). Depth shown by a colour step from pale shallows to deep blue. |
| River through pine forest | Winding river between dark pines. | Pines dark and tall along water; banks a soft band of lighter ground. |
| "Descend" meadows and trees | Soft stylized meadow and round trees. | Meadow grass with scattered flowers; tree crowns built from a few soft blobs. |
| Waterfalls under a stone arch bridge | Falls, mist, arched stone bridge. | A white foam band at the foot of falls and weirs; stone bridges get arches. |
| Shallow sea with foam circles | Clear shallows, foam round rocks. | As toon water above; sea is clearer and paler near beaches. |
| Low-poly tree and rock clusters | Sets of trees and rocks grouped into clumps. | Place scenery as clumps (big rock, two small, a bush) rather than single props. |
| Rocky waterfall pond, autumn trees | Pond under a fall, orange and red trees. | Autumn colour on broadleaf trees; pines stay dark. |
| Farming village with crop plots, ground tiles | Plots of crops; tile set of grass, flowered grass, dirt, mixed, cobble, rock. | A ground tile family: grass, flowered grass, dirt, mixed grass and dirt, cobble, rock. Blend between them. |
| Flat-shaded forest with standing stone | Faceted forest, one stone in a clearing. | Clearings with a single landmark draw the eye. |
| Beach cove | Sand cove, water, cliffs. | Sand band, wet sand darker at the water line, foam line. |
| Pine forest clearing | Open grass ringed by pines. | Same: clearings inside forest. |
| Seasonal palette strip | The same scene's colours for spring, summer, autumn, winter. | One palette per season for grass, leaves, ground, sky. The game's seasons should swap palettes, not models. |
| Grass-blade field shader, before and after | Flat green field, then the same field with blades. | Near the player, grass as blades that sway; far away, the flat tint is fine. |
| Cliff village, orange roofs | Village on a cliff above low-poly forest. | Terracotta roofs read well from a distance. |
| Tilt-shift suburb street | Suburb photographed like a miniature. | Fits the overhead map view and a possible photo mode. |
| Overgrown city rooftops, yellow buses and taxis | City roofs taken by plants, abandoned yellow vehicles. | Overgrowth on roofs and ledges; bright yellow vehicles as colour accents in grey streets. |

## Set 2: towns, buildings and streets

| Picture | What it shows | What to take |
| --- | --- | --- |
| City building kit (POLYGON City) | Shopfronts, brownstones, a columned bank or courthouse, glass towers in stacked sections, awnings, fire escapes, road and sidewalk tiles, crosswalks, arrows, curb corners. | Buildings as stacked sections (ground floor shop, repeating middle floors, cornice top) so heights vary from one kit. Road pieces with curb corners and painted arrows. |
| Low Poly Trees (10 models) | Round faceted crowns on thin trunks, a person for scale, face counts 1,500 to 8,000. | Our trees should be lighter than this (we draw thousands), but the shape is right: crowns of a few faceted blobs, trunk visible. Scale against a person. |
| Toy town buildings | Hotel, bank, police, barber, supermarket, coffee house, burger stand, basketball court, small vehicles, bins, bus shelters, hydrant. | Every shop type gets a readable shape and a sign; roof units (air conditioners) on every flat roof. |
| Zlín City | Red and white housing blocks, a curved tower, winding roads, round trees, lit windows at dusk. | Lit windows at dusk; apartment blocks as simple repeated bands of windows and balconies. |
| Mill tower and cottage, painterly | Old stone tower with a water wheel, dry-stone walls, a stream, a broken cart, a garden with pots and flowers. | Dry-stone walls along fields; broken carts and pots as country loot spots. |
| Battle royale island (POLYGON) | Military yard with tents, shipping containers in colours, a crashed plane, warehouses, a town on a bridge. | Coloured container stacks and tent rows for military sites (see Military content guide). Wrecks as landmarks. |
| Small town main street from above | Brick shops, J&J Warehouse, water tower, flat roofs, trees between lots. | Small-town centre: brick, flat roofs with units, a water tower on the skyline. |
| Small-town street corner (Assetsville) | White block building, brick auto service, power poles with drooping wires, water tower, church spire, windmill, dumpsters, newspaper boxes, police cars. | Power poles and wires along every street; dumpsters behind shops; newspaper and mail boxes on corners. |
| Town hall street (Assetsville) | Columned town hall, parking meters, street lights, parked 1980s cars, church spire, hills. | Civic buildings get columns and steps; parking meters along kerbs. |
| Seaside town (isometric) | Terracotta roofs, plaza with patterned paving and a statue, palms, beach umbrellas, sea wall. | Plazas get patterned paving and a centre feature. |
| Coast and village painting | Hills, fields in patches, a white beach curve, deep blue sea. | Fields as a patchwork of slightly different greens and golds. |
| Night shop in the pines | Lit shop, vending machines, one street light, dark pines, orange autumn trees. | The night look: a single warm light pool in deep blue dark. Vending machines glow. This is the "scary nights" side of ART.md. |
| County sheriff and police | Brick sheriff office, police cars with light bars, motorcycles, crowds. | Police stations as a set: sign over the door, cars with light bars in the lot. (Crowds become aliens or nothing.) |
| Gas station with price sign (AI) | Large canopy station, tall price sign, tanker trucks, fuel tanks. | Gas stations: canopy, pumps, a tall price sign, a storage tank. Fuel loot and tanker trucks. |
| Country store and tractor dealer (AI) | Store with fuel canopy, a tin-roofed dealer, a lot of tractors and machines, dirt track. | Rural roadside: equipment lots full of tractors are both landmark and loot. |
| City from above and street view | Towers, mosque dome, rooftop water tanks, helipad, yellow taxis, buses; brick street with faceted trees. | Rooftop water tanks on city blocks; street trees in a row along the kerb. |
| Americana convenience store (KitBash3D) | Flat-roof store, red tile accent roof, tall sign, parking lines, cart shelter, planters. | Convenience stores: tall pole sign, painted parking bays, cart shelter. |
| Suburban street | Clapboard houses with porches, power poles, mailboxes, bins at the kerb, one parked car. | Suburbs: porches, kerbside bins and mailboxes, poles and wires. Grass verge between sidewalk and road. |
| 1950s suburb from above | Houses, gas station corner, classic cars, gardens, a pool. | Gardens, pools and garages give each lot its own loot and look. |

## Set 3: neighbourhoods, wrecks and bridges

| Picture | What it shows | What to take |
| --- | --- | --- |
| Tilt-shift city crossing | Old city crossing, yellow buses and taxis, crowds, shop signs, blurred top and bottom. | Strong depth blur fits a photo mode or the overhead map. Yellow buses and taxis as colour. |
| Simple Town houses | About 20 small houses: porches, gables, dormers, garages, bright siding with grey roofs. | A house family from a few parts: porch, gable, dormer, garage. Siding colour varies, roofs stay muted. Cheap enough for phones. |
| Anime suburb from above | Dense houses with tiled roofs in many colours, a small park with blossom trees, narrow lanes, poles. | Roof colour variety street by street; a small park as a landmark in housing. |
| Mediterranean square | Terracotta blocks, palms, a formal garden with a statue and hedges, buses. | Formal parks: hedges, paths in rings, a centre statue. |
| Simple Apocalypse vehicles and crash | Armoured buses and trucks with plates and spikes, tanks, RVs, a crashed airliner in a scorched crater, wrecked cars around it. | Two kinds of wreck: plain abandoned cars, and survivor-armoured ones (plates, cages, spikes) as rare finds. A crash site as a big landmark. |
| Japanese town with fields | Houses between rice fields, pylons, autumn trees in red and yellow, a long road with poles. | Fields cut into town edges; pylons and power lines across country. |
| Brownstone block | Rowhouses with stoops, rooftop gardens and planters, crosswalks, small parks. | Stoops on rowhouses; roof gardens (later: survivor gardens on roofs). |
| Brick corner apartment | Five-storey brick block with balconies, glass stair tower, a garage door at street level. | Apartments: stair tower, balconies, garage at ground level. |
| Rural gas station and mini market | Small canopy station, a tin shed shop with crates out front, wildflowers all round. | Small rural stations: one canopy, two pumps, a shed shop. Wildflowers taking over lots. |
| Small town main road | Clapboard houses, wide road with yellow lines, poles and wires on both sides, pylons, pines. | Wide rural roads with many poles; houses set back on big lots. |
| Suburban street with garbage truck | Green garbage truck, houses with porches, gardens with flowers, sidewalks and verges. | Sidewalk, grass verge, road: three bands every suburban street. Garbage trucks as a common vehicle. |
| Bright suburb | Colourful houses with red roofs, garages, crosswalks. | Garage doors on suburban houses (loot: tools, car parts). |
| Japanese city block (NONE CG) | Pale concrete blocks, rooftop units and pipes, a rooftop sign. | Flat roofs crowded with units, ducts and pipes. |
| Lighthouse point | Lighthouse with keeper's houses on rocks, piers, a boat, a coastal village. | Lighthouses and piers as coast landmarks; foam on rocks. |
| European blocks with tram | Long apartment blocks, terracotta roofs with dormers, tram lines, a tall radio mast. | Tram lines in the road; radio masts on tall roofs. |
| Stone bridge over a gorge | Road on an arched stone bridge above a waterfall gorge. | Bridges over gorges and falls; road railings of stone posts. |
| Warehouse lot | Loading docks, box trailers, semi cabs, a fire truck, chain-link fence. | Warehouse docks with trailers backed in: a natural place for walk-in trailers and loot. |
| Post-apocalyptic quarantine camp | Coloured dome tents, military trucks, a burned motel sign, pylons, wrecked cars, low-poly trees. | Very close to Afterstreet: a quarantine or relief camp of tents and trucks inside a town. |
| City block diorama | A square block: towers, houses, a church, trees. | A city square should mix tall and low buildings, not only one height. |
| Suspension bridge over clear water | Steel towers, cables, cars, very clear blue water with fish. | Big bridges with steel towers and cables over water. |

## Set 4: buildings up close and painted streets

| Picture | What it shows | What to take |
| --- | --- | --- |
| Sketched office and shop buildings | Four mid-rise buildings: glass curtain walls, banded floors, ground-floor shops, rooftop trees. | Mid-rise buildings with a clear base (shops), middle (banded windows) and top. |
| Subway entrances and bus shelter | Glass subway entrances with stairs and escalators, a station marker post, a bus shelter with bench and ad panels. | Subway entrances as doors to underground spaces (a stretch goal); bus shelters on routes. |
| Painted lakeside city | Town on a lake below mountains, painted in loose strokes. | Distant towns as simple blocks of colour; the far view need not be detailed. |
| Isometric corner shop tower | Rounded corner building, shop at street level, rooftop water tank and railings. | Corner buildings rounded on the corner. |
| Model railway police station | Green and brick police station, flag, round window, lamp. | A small-town police station is small, not a fortress. |
| City blocks from straight above | Roofs with fans, units, gardens; one block a park of trees. | From the overhead map, roofs carry most of the look. |
| Low-poly motel | Two-storey motel with outside walkway and stairs, office, tall neon sign, parking lot. | The motel model: outside walkway, stairs, office, neon sign. Each room a small loot room. |
| Painted road to a mountain village | Small yellow car on a pale road, cliffs, a lake, yellow grass. | Warm late-day light and long shadows. |
| New apartment blocks | Ten-storey blocks in orange and grey, playgrounds, a riverside walk. | Modern blocks with playgrounds and car parks between. |
| Sign-covered shop buildings (sketch strip) | Asian city buildings covered in signs, shutters, awnings, poles. | Signs layered on buildings make city streets feel real; roll-down shutters on shops. |
| Building portraits with wires | Narrow buildings each framed by power lines. | Wires everywhere in older towns. |
| Anime city view | Wide view of mid-rise city, green parks, a broad road. | Green between buildings even in the city. |
| Strip mall (sketch) | Supermarket, laundry and hardware store in one strip, billboards on the roof, pole sign, palms. | A strip mall model: three shops under one roof, shared pole sign, roof billboards. |
| Two-storey apartment (model) | Long block, outside walkway, red doors, stairs at the end. | Same layout as the motel; reuse the walkway parts. |
| Country grocery with pumps | Weatherboard store, green tin roof, porch, three old pumps under a canopy, water tank. | The old country store: a key rural loot building. |
| Faceted apartment (Apex Legends art) | Clean faceted block with coloured bands, ducts, a shop awning. | Clean bevelled edges and colour bands are close to our model style. |
| Fast-food building | Flat-roof restaurant, tall sign column, roof units. Real brand. | The shape is useful; use a made-up brand, never the real one. |
| Painted parking lot with mountains | Pickup, poles, wires, a cat, mountains; flat painted shading. | The cozy daytime mood: clean flat light, sharp shadows. |
| Painted trees, freeway, bluff | Loose painted trees, a freeway with a sign gantry, a sandy bluff. | Freeway sign gantries; trees with gaps in the crown so sky shows through. |
| Freeway exit painting | Overpass, exit sign, guard rails, long morning shadows. | Freeways: overpasses, green exit signs, guard rails. |

## Set 5: light, roads and kiosks

| Picture | What it shows | What to take |
| --- | --- | --- |
| Desert town painting | Palms, a bare mountain, poles and wires, a wind farm far off, pale dry ground, scrub. | A dry palette: pale sand ground, sage scrub, faded sky. Wind turbines on far ridges. |
| Coast road at evening | Two-lane road over hills, poles along one side, low gold sun, dark trees. | Golden hour: one side of everything lit warm, the other in cool shadow. |
| Modernist kiosk sheet | Twelve small kiosks: news stands, ticket booths, a phone stand, a guard booth, in white and yellow. | Small street booths (news, tickets, guard, phone) as quick loot spots and cover. Simple shapes, one accent colour. |
| City block at night, low-poly | Pale grey blocks, lit windows and doorways, palms, roof units. | Night city: buildings cool grey, light only where windows and doors are lit. |
| Winter brownstone street | Red brick tenement with fire escapes, an elevated train with graffiti, shops at street level, snow, a yellow taxi, bins, a burning barrel. | Fire escapes on tenements (climbable routes later); elevated rail lines; snow on ledges, roofs and parked cars in winter; burning barrels as survivor camp lights. |
| Desert highway at sunset | Long straight highway, a semi truck, dry grass, distant mountains, big sky. | Long open highways and the semi trucks on them; tall dry grass along the shoulder. |

## Action items

For the content chat (art and packs):

1. **Street clutter pack:** power poles with wires (wires drawn as sagging lines between poles), water tower, newspaper box, mailbox, kerbside bins, dumpster, parking meter, fire hydrant (check what exists first), vending machine (lit at night), cart shelter.
2. **Roadside signs:** tall pole signs for gas stations and stores with blank or made-up brands, billboards (faded), motel and diner signs. No real brands.
3. **Building sections:** ground-floor shopfront, repeating middle floor, cornice top, so the map builder can stack heights.
4. **Roof units:** air conditioner boxes and rooftop water tanks for flat roofs.
5. **Ground tiles:** flowered grass, mixed grass and dirt, cobble, patterned plaza paving, wet sand, if not already in the art.
6. **Crop stages:** 4 to 5 stages for each garden crop.
7. **Equipment lot:** tractors and farm machines as parked wrecks for rural lots.
8. **Seasonal palettes:** a palette row per season for grass, leaves, ground and sky.
9. **Roadside buildings:** motel with outside walkway (also reused for two-storey apartments), strip mall of three shops, old country grocery with pumps, small rural gas station, fast-food building with a made-up brand.
10. **Survivor-armoured vehicles:** a few existing vehicles with plates, cages and spikes as rare finds; a crashed airliner as a landmark.
11. **Camp set:** dome tents in colours, relief tents, barriers, for quarantine camps.
12. **Road furniture:** freeway sign gantry, green exit signs, guard rails, bus shelter, subway entrance (closed, as a stretch goal).
13. **House parts:** porch, gable, dormer, garage door, so the builder can vary houses cheaply.
14. **Street booths:** news kiosk, ticket booth, guard booth, phone stand.
15. **City parts:** fire escapes for brick tenements, elevated rail sections, burning barrel, wind turbines for far ridges.
16. **Dry palette:** a desert and dry-summer palette row.

For the main chat (the game):

1. **Toon water foam:** foam rings where water meets rock, shore, posts and a wading player; a colour step for depth.
2. **Grass blades near the player,** flat tint far away; sway with the wind.
3. **Night light pools:** street lights and lit windows as warm pools in the dark.
4. **Placement in clumps:** scenery placed in groups (rocks with bushes, trees in clusters).
5. **Season palette swap** using the content chat's palettes, and snow on roofs and parked cars in winter.
6. **Golden hour:** a warmer, lower sun in the evening so one side of things glows and the other goes cool.

For the map chat (builder): poles and wires along roads, rooftop units on flat roofs, parking lines in lots, equipment lots on rural roadside land.

Each item is checked against what already exists before it is requested; items that are extras go to `docs/STRETCH.md`.
