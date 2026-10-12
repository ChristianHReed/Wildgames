# Springfield, MO: 50-mile game map reference sheet

**Centre:** Park Central Square (37.2089, −93.2923). **Radius:** 50 mi / 80.5 km. **BBox:** lon −94.200…−92.385, lat 36.485…37.933.
**World axes:** x = east (m), y = up, z = −north (m). x = (lon + 93.2923) × 88 660, z = −(lat − 37.2089) × 110 540.
**Data:** © OpenStreetMap contributors (ODbL), pulled from the Overpass API and OpenFreeMap vector tiles in October 2026. Elevation comes from AWS Terrain Tiles (SRTM/3DEP). Every type, plant and spec value is defined in `map_spec.json`.

## Files
| File | Contents |
|---|---|
| buildings_{downtown,city,suburban,rural}.geojson | 44,943 footprints. Props: type, floors (+source), height_m (+source), roof_shape, roof_material, wall_texture, footprint_m2, zone, terrain, name/address |
| water_bodies.geojson | 1575 pond, 135 reservoir, 93 river (polygons with name, area_ha, depth range, shore type) |
| waterways.geojson | 12,260 river / stream / canal / ditch lines (name, width_m, intermittent) |
| bridges.geojson | 1616 bridges: 561 river bridge, 238 rail bridge, 171 highway overpass, 585 county bridge, 61 footbridge (length, deck width/height) |
| roads_major / roads_minor_north / roads_minor_south.geojson | 118,445 road, track, path and rail segments (class, width, surface, bridge/tunnel/ford, layer) |
| city_features_pois.geojson | City zone (±12 km): every POI including park equipment (21 toilets, 417 pitch, 17 track, 137 swimming pool, 9 fountain, 48 shelter, 24 picnic table, 159 playground, 15 golf, 6 drinking water, 48 waste basket, 1 dog park, 10 bbq, 25 monument) |
| city_paths_trails.geojson | Greenway trails, footpaths and footbridges in the city |
| protected_areas_parks.geojson | 42 named parks, conservation areas and Mark Twain National Forest units |
| places.geojson / peaks.geojson | 603 named places (city/town/village/hamlet), 175 peaks/knobs |
| terrain/terrain_class.png + .json | 2048² terrain-type grid, 78.6 m/px (legend below) |
| terrain/region_terrarium.png, core15km_terrarium.png | Elevation: 157.1 m/px (region), 14.6 m/px (15 km core). Decode: R×256 + G + B/256 − 32768 |
| map_spec.json | Catalogue: building types, terrain + plant life, water, bridges, roads, park equipment |

Elevation across the region runs from 208 m (lake valleys) to 499 m. The core sits at 341.1–427.1 m.

## Zones
- **downtown** (≤ 1.2 km): Park Central Square, Commercial St to Walnut St. 1–12 storey brick masonry, 0 m setbacks, storefront ground floors, flat roofs with parapets. *Build:* full: every OSM footprint, facade per building, interiors enterable.
- **city** (≤ 12.0 km): Springfield city: grid streets, bungalows and ranch houses, strip commercial on Glenstone / Battlefield / Sunshine / Kearney, MSU and Drury campuses, rail yards, Jordan Valley. *Build:* full footprints; interiors on POI buildings.
- **suburban** (≤ 25.0 km): Nixa, Ozark, Republic, Battlefield, Strafford, Willard: cul-de-sac subdivisions, big-box retail, churches with large lots. *Build:* footprints where mapped; fill gaps procedurally from landuse=residential.
- **rural** (≤ 80.5 km): Ozark Plateau farmland, fescue pasture, oak-hickory woods, karst valleys, lake country to the south (Table Rock, Taneycomo, Bull Shoals) and north (Pomme de Terre, Stockton). *Build:* mapped footprints + procedural farmsteads (house, barn, shed, pond) every 400–800 m along county roads.

## Buildings
How each building's type is decided: 1. OSM building=* value when not "yes" (see building_types[].osm) → 2. POI inside footprint (amenity/shop/office/tourism/healthcare) → mapped type → 3. landuse polygon containing the footprint centroid (residential/commercial/retail/industrial/farmyard/farmland) → 4. footprint area: <40 m² shed; 40–90 m² garage/outbuilding; 90–320 m² house; 320–1500 m² commercial or apartments; >1500 m² warehouse/big box (industrial landuse) or retail → 5. zone default (downtown → commercial; rural → house/barn by area).
Floors: floors = building:levels if present; else round(height / floor_height); else type default (typ) adjusted by zone (downtown commercial ×1.6, max 12). Height: height = height tag; else floors × floor_height_m + roof_height_m.
Only 239 buildings carry an OSM floor count. Every other floor count is **estimated** from type, zone and footprint, and is flagged `floors_source: "estimated"`.

| Type | Count | Typical floors | Floor h (m) | Roof | Walls (texture) | Avg footprint m² |
|---|---|---|---|---|---|---|
| Single-family house | 26,953 | 1×26940, 2×11, 3×1 | 3 | gabled|hipped, asphalt shingle | siding_cream / siding_river / brick | 198 |
| Barn / farm building | 4,925 | 2×4916, 1×8, 4×1 | 4 | gambrel|gabled, metal (red #9a5226 or galvanized) | wood_planks / metal_painted | 688 |
| Commercial / storefront | 3,771 | 2×3545, 3×132, 1×45 | 4 | flat, gravel / membrane | brick / brick_dark / stucco | 1252 |
| Garage / carport | 3,271 | 1×3269, 4×1, 1.5×1 | 3 | gabled|flat, shingle / metal | siding_cream | 56 |
| Shed / outbuilding | 1,574 | 1×1574 | 2.6 | gabled|skillion, metal | wood_planks | 90 |
| Apartment building | 1,573 | 3×1527, 4×27, 2×13 | 3 | flat|hipped, membrane / shingle | brick / siding_cream / stucco | 709 |
| Civic / government | 952 | 2×951, 1×1 | 4 | flat, membrane | stone / brick | 629 |
| Warehouse / industrial | 879 | 1×869, 2×9, 3×1 | 8 | flat|sawtooth, metal | metal_painted | 3329 |
| School | 192 | 2×176, 1×10, 3×5 | 4 | flat, membrane | brick | 4047 |
| Church | 181 | 1×180, 2×1 | 6 | gabled, shingle / slate | brick / stone | 1451 |
| Mobile home | 165 | 1×165 | 2.8 | flat, metal | siding_cream / siding_river | 79 |
| University / college hall | 164 | 3×128, 4×33, 1×2 | 4 | flat|hipped, slate / membrane | brick / stone | 1972 |
| Hotel / motel | 83 | 3×82, 2×1 | 3.2 | flat, membrane | stucco / brick | 1824 |
| Hospital / clinic | 70 | 3×61, 8×9 | 4.2 | flat, membrane | stucco / brick | 3761 |
| Cabin / lake house | 54 | 1×54 | 3 | gabled, metal | wood_planks | 91 |
| Boathouse / dock | 49 | 1×49 | 3.5 | gabled, metal | wood_planks / metal_painted | 863 |
| Big-box store / strip mall | 37 | 1×36, 4×1 | 7 | flat, membrane | stucco | 4121 |
| Stadium / arena | 18 | 2×18 | 6 | flat|open,  | metal_painted / brick | 1222 |
| Parking garage | 18 | 4×17, 3×1 | 3.2 | flat, concrete deck | stone | 4376 |
| Ruin / abandoned | 14 | 1×14 | 3 | collapsed,  | brick_dark | 246 |

## Terrain types & plant life
Coverage: 13% comes straight from OSM. The other 87% is derived (gaps derived from slope (AWS terrain): >6.5° forest, 4.5–6.5° scrub/old field, within 60 m of river / 25 m of stream riparian, protected areas forest, else fescue pasture. Shortleaf pine–oak used south of 36.95°N and east of 93.35°W (Mark Twain NF side).).

| Terrain | Map color | Share | Trees | Understory / shrubs | Ground | Trees / ha |
|---|---|---|---|---|---|---|
| Urban paved | #6e6762 | 0.2% | Callery (Bradford) pear, pin oak, red maple, honey locust, crabapple | boxwood, juniper, burning bush | turf in medians | 4 |
| Industrial / rail yard | #8a7f75 | 0.1% | eastern cottonwood, tree of heaven, hackberry | bush honeysuckle, sumac | gravel, crabgrass, Johnson grass | 2 |
| Residential yards | #a9b78c | 0.5% | pin oak, sweetgum, silver maple, red maple, sugar maple, Callery pear, eastern redbud, flowering dogwood, river birch, eastern red cedar | forsythia, lilac, azalea, hydrangea, privet hedge | tall fescue / bluegrass lawn, daylilies, hostas | 35 |
| Oak–hickory forest | #3f5a2c | 12.0% | white oak, post oak, black oak, northern red oak, shagbark hickory, black hickory, mockernut hickory, sugar maple, black walnut, eastern red cedar | flowering dogwood, eastern redbud, sassafras, pawpaw, Ozark witch hazel, spicebush | leaf litter, Christmas fern, mayapple, poison ivy, Virginia creeper, chert gravel | 450 |
| Shortleaf pine–oak forest | #2f4a2f | 4.4% | shortleaf pine, post oak, blackjack oak, black oak, eastern red cedar | blueberry, huckleberry, farkleberry | pine needles, little bluestem, bracken fern | 380 |
| Fescue pasture / hayfield | #c9c27a | 73.6% | Osage orange (hedgerows), eastern red cedar (fence lines), lone white oak or post oak shade trees | blackberry, multiflora rose, buckbrush (coralberry) | tall fescue, orchardgrass, red clover, white clover, Queen Anne’s lace, thistle | 1.5 |
| Park lawn | #7a9a4e | 0.3% | bur oak, pin oak, sycamore, sugar maple, bald cypress (Phelps Grove, Nathanael Greene), eastern redbud |  | mown fescue, flower beds | 40 |
| Golf course | #8fbf5a | 0.1% | pin oak, sweetgum, pine |  | bermuda / zoysia fairways, bentgrass greens, sand bunkers | 25 |
| Cemetery | #9aaa7a | 0.1% | eastern red cedar, white oak, magnolia |  | mown lawn | 20 |
| Quarry | #d9d0c0 | 0.0% |  |  | bare limestone benches 6 m high | 0 |
| Wetland / marsh | #5f8a7a | 0.3% | black willow, buttonbush |  | cattail, bulrush, sedges, arrowhead, duckweed | 20 |
| Scrub / old field | #8a8a4a | 6.0% | eastern red cedar, persimmon, winged sumac | smooth sumac, blackberry, multiflora rose, bush honeysuckle | broomsedge, goldenrod, ragweed | 60 |
| Prairie / dolomite glade | #d9b86a | 0.0% | eastern red cedar, chinkapin oak, smoke tree |  | little bluestem, big bluestem, Indian grass, switchgrass, purple coneflower, pale purple coneflower, Missouri evening primrose, prickly pear cactus, butterfly milkweed | 8 |
| water | #5f8a9a | 1.4% | | | | |
| Riparian corridor (river & creek banks) | #56743f | 0.9% | American sycamore, eastern cottonwood, black willow, silver maple, river birch, green ash, box elder, American elm | buttonbush, spicebush, cane (river cane), elderberry | water willow (in shallows), sedges, jewelweed, gravel bar | 300 |

## Water
- **Largest named lakes:** Stockton Lake — reservoir, ~5578 ha in area; Table Rock Lake — reservoir, ~5263 ha in area; Bull Shoals Lake — reservoir, ~1536 ha in area; Pomme De Terre Lake — reservoir, ~919 ha in area; Fellows Lake — reservoir, ~306 ha in area. Other named reservoirs come from OSM names where present (Lake Springfield, McDaniel Lake, Lake Taneycomo).
- **Rivers & creeks (named):** White Oak Creek, Spring River, Shoal Creek, Osage River, Sac River, Turnback Creek, Roaring River, White River, Coon Creek, Bear Creek, Jump Off Creek, Spring Creek, Flat Creek, Kings River, James River, Hogles Creek, Pomme de Terre River, Skeggs Branch, Terrell Creek, Pomme De Terre River, Little Sac River, Wilson's Creek, Wilsons Creek, Finley Creek, Yocum Creek, Lindley Creek, South Dry Sac River, Long Creek, Lake Taneycomo, Table Rock Lake, Little Pomme de Terre River, Little Niangua, Niangua River, Run Creek, Max Creek, Beaver Creek, Finley River, Steward Creek, Guffy Creek, South Guffy Creek, Little Beaver Creek, Brushy Creek, Bennett Spring Branch, Little Finley Creek, Brown Branch, Little Brown Branch, Caney Creek, Osage Fork, Honey Creek, Cowskin Creek, Prairie Creek, Jack Branch, Bear Branch, Longneck Branch, North Spring Creek, South Spring Creek, Gasconade River, Casto Creek, Robertson Branch, Hart Branch.
- **Water specs** (depth, banks, bridge rules):
  - **River**: depth 1–2–5 m, banks: gravel bars + mud, bluffs on outside bends. Bridges: every road crossing; low-water crossings on gravel county roads
  - **Creek / stream**: depth 0.1–0.4–1 m, banks: cut banks 0.5–2 m, chert gravel bed. Bridges: culvert under minor roads (width < 4 m), short bridge otherwise
  - **Reservoir lake**: depth 3–15–60 m, shore: lakeshore terrain. dams (man_made=dam / waterway=dam) at outlets
  - **Pond / stock pond**: depth 0.5–2–4 m, shore: mown grass or cattails, earthen dam on one side. thousands of farm stock ponds: one per farmstead pasture
  - **Spring**: depth n/a. karst spring outlet, small pool + run; springhouse ruins
  - **Fountain**: depth n/a. Park Central Square fountain; decorative jets 1–3 m; basin r 2–8 m
  - **Sinkhole**: depth n/a. karst depression 5–50 m wide; may hold a pond
  - **Wetland water**: depth 0–0.3–1 m

## Bridges
any OSM way with bridge=* is elevated; deck height = layer × 6 m (default 6 m) above the lower feature; ramps blend over 30 m at each end.
- **highway overpass** (171): motorway/trunk crossings. Deck: concrete girder, piers concrete every 25 m, rail: concrete jersey barrier 0.8 m.
- **river bridge** (561): primary–tertiary over river. Deck: concrete girder or steel truss, piers every 30–40 m in river, rail: steel guardrail.
- **county bridge** (585): residential/unclassified/track over stream. Deck: concrete slab or old steel pony truss (one lane), rail: steel.
- **low water crossing** (0): ford=yes or track over stream. Deck: concrete slab at water level, rail: none; floods.
- **rail bridge** (238): railway=rail with bridge. Deck: steel girder / trestle, rail: none.
- **footbridge** (61): footway/cycleway/path with bridge. Deck: wood or prefab steel truss 2–3 m wide, rail: steel or wood 1.1 m.

## Roads
- **motorway**: 22 m wide, 4 lanes, concrete. e.g. I-44, US-65, US-60 east
- **trunk**: 16 m wide, 4 lanes, asphalt. e.g. US-60 (James River Fwy), US-160
- **primary**: 14 m wide, 4 lanes, asphalt, sidewalk both sides in city. e.g. Glenstone Ave, Kearney St, Sunshine St, Battlefield Rd
- **secondary**: 10 m wide, 2 lanes, asphalt, sidewalk one or both. e.g. Grand St, Division St
- **tertiary**: 8 m wide, 2 lanes, asphalt, sidewalk one side
- **residential**: 7 m wide, 2 lanes, asphalt, sidewalk often one side; curb + gutter
- **unclassified**: 6 m wide, 2 lanes, chip-seal asphalt, sidewalk none; gravel shoulder
- **track**: 3.5 m wide, 1 lanes, gravel / dirt, sidewalk none
- **service**: 4 m wide, 1 lanes, asphalt / gravel
- **footway**: 2 m wide, concrete
- **path**: 1.5 m wide, gravel / dirt (Ozark Greenways trails e.g. Frisco Highline, Galloway Creek, Wilson’s Creek greenway)
- **railway**: 4 m wide, ballast + ties. e.g. BNSF through Springfield yards

## Parks & park equipment
- **Named parks / conservation areas** (sample): Capps Creek Conservation Area (nature_reserve), Flag Spring Conservation Area (nature_reserve), Pea Ridge National Military Park (historic_site), Wah'Kon-Tah Prairie Conservation Area (nature_reserve), Stony Point Prairie Conservation Area (nature_reserve), Robert E Talbot Conservation Area (nature_reserve), Roaring River State Park (conservation), Mark Twain National Forest (forest_reserve), John Baumgardt Memorial Conservation Area (nature_reserve), Roaring River Conservation Area (nature_reserve), Piney Creek Wilderness (wilderness_preserve), Bois d'Arc Conservation Area (conservation), Pilot Knob Conservation Area (nature_reserve), Sentinel Conservation Area (sustainable), Little Sac Woods Conservation Area (nature_reserve), Wilson's Creek National Battlefield (historic_site), Holland State Forest (nature_reserve), Busiek State Forest and Wildlife Area (sustainable), Ruth and Paul Henning Conservation Area (nature_reserve), Lakeside Forest Wilderness Area (nature_reserve), Table Rock State Park (national_park), Drury-Mincy Conservation Area (protected_area), Drury Conservation Area (nature_reserve), Mincy Conservation Area (nature_reserve), Compton Hollow Conservation Area (conservation), Hercules Glades Wilderness (wilderness_preserve), Barclay Conservation Area (nature_reserve), Coffin Cave Conservation Area (nature_reserve), Coleman Memorial Conservation Area (Coleman Memorial Conservation Area), John Alva Fuson, MO Conservation Area (nature_reserve).
- **Equipment in the city zone:** toilets 21, pitch 417, track 17, swimming pool 137, fountain 9, shelter 48, picnic table 24, playground 159, golf 15, drinking water 6, waste basket 48, dog park 1, bbq 10, monument 25.
- **playground** (`leisure=playground`). Pieces: slide, swing, structure, climbingframe, sandpit, seesaw, springy, roundabout. Surface: wood mulch or rubber safety surfacing, timber border
- **bench** (`amenity=bench`): 1.8 × 0.6 × 0.9 m. props/bench
- **picnic table** (`leisure=picnic_table`): 1.8 × 1.5 × 0.75 m. props/table (+ attached benches)
- **shelter** (`amenity=shelter`): 10 × 8 × 4 m. open pavilion, gabled metal roof, picnic tables inside
- **bbq** (`amenity=bbq`): 0.6 × 0.6 × 1 m. pedestal charcoal grill
- **drinking water** (`amenity=drinking_water`): 0.5 × 0.5 × 1 m. pedestal fountain; loot source: water
- **toilets** (`amenity=toilets`): 5 × 4 × 3 m. block restroom building
- **waste basket** (`amenity=waste_basket`): 0.6 × 0.6 × 0.9 m
- **pitch** (`leisure=pitch`). baseball: diamond 27 m bases, backstop, dugouts, lights; soccer: 105×68 m, goals; tennis: 23.8×11 m, fence 3 m; basketball: 28×15 m, 2 hoops; pickleball: 13.4×6.1 m; volleyball: sand court
- **track** (`leisure=track`). 400 m oval, red rubber
- **dog park** (`leisure=dog_park`). chain-link fenced lawn, double gate
- **skate park** (`sport=skateboard`). concrete bowls + rails
- **splash pad** (`leisure=water_park | playground=splash_pad`). concrete pad with jets
- **swimming pool** (`leisure=swimming_pool`). 25/50 m pool, deck, fence
- **fountain** (`amenity=fountain`). basin + jets
- **gazebo** (`amenity=shelter + shelter_type=gazebo`). octagonal 5 m pavilion
- **monument** (`historic=memorial|monument`). stone plinth / statue
- **fitness station** (`leisure=fitness_station`). outdoor bars & stations
- **trail** (`highway=path|footway in park`). gravel or paved 2–3 m
- **boat ramp** (`leisure=slipway`). concrete ramp into water
- **dock** (`man_made=pier | leisure=marina`). wood or floating docks
- **flagpole** (`man_made=flagpole`). 9–12 m pole
- **street lamp** (`highway=street_lamp`). props/streetlamp

## Known gaps
- **Buildings not yet downloaded** (the map server was overloaded) in 20 small boxes [s, w, n, e], mainly Ozark / east Nixa and a few rural edges: 36.485, -93.595, 36.515, -93.557 · 36.485, -93.557, 36.515, -93.519 · 36.515, -93.595, 36.545, -93.557 · 36.515, -93.557, 36.545, -93.519 · 36.968, -93.293, 37.028, -93.217 · 36.968, -93.217, 37.028, -93.141 · 37.028, -93.293, 37.088, -93.217 · 37.028, -93.217, 37.088, -93.141 · 36.968, -93.141, 37.028, -93.066 · 36.968, -93.066, 37.028, -92.990 · 37.028, -93.141, 37.088, -93.066 · 37.028, -93.066, 37.088, -92.990 · 37.692, -92.990, 37.812, -92.839 · 37.812, -92.839, 37.933, -92.688 · 36.485, -92.688, 36.606, -92.536 · 36.485, -92.536, 36.606, -92.385 · 36.606, -92.536, 36.726, -92.385 · 37.209, -93.897, 37.330, -93.746 · 37.330, -93.897, 37.450, -93.746 · 37.330, -93.746, 37.450, -93.595. Rerun the Overpass building query for these boxes, or fill them procedurally from `landuse=residential`.
- Rural OSM building coverage is partial. Add procedural farmsteads per the rural zone rule.
- Benches, individual trees and fountains are only partly mapped in OSM. Scatter them using the per-terrain tree densities and the park equipment specs.
- The plant lists are regional Ozark Plateau reference vegetation, not per-tree survey data.
