# Roadside and odd buildings (content chat, 26 October 2026)

Request: learn about odd buildings like gas stations and other architecture, then make more building assets. Pack: `assets/shaped/roadside.js` (generator `assets/shaped/src/roadside.py`), 47 whole buildings and landmarks, 36 to 600 triangles each. Album scenes: `roadside_gas`, `roadside_road`, `roadside_odd`, `roadside_ozark`.

## What I learned
- **Gas stations** (NPS Preservation Brief 46) come in families by era: the 1910s shed; the 1920s house type (a domestic cottage with a pitched roof, in Colonial, Tudor or English Cottage, Mission and even pagoda dress); the 1930s box (flat roof, glossy white, rounded corners, stripes, big glass, a canopy joining it to the pumps); the Streamline Moderne glass box; the post-war stylised box (concrete block, angled glass, raking canopy like Phillips 66's V roof); the 1960s revival box (shallow shingled roof); and the programmatic ones shaped like teapots, tepees, windmills, castles or a lighthouse. Canopies run from the building or stand alone, and are the era's signature.
- **Springfield's own roadside** (Route 66 guides): the Rockwood Motor Court (1929 tourist camp with a Shell house and filling station), Rail Haven motel, a 1934 Sinclair station at Gary's Gay Parita, the 1920s Spencer service station, the Route 66 Steak n Shake with curb service, the Hangar Kafe, the Gillioz theatre.
- **Roadside types** (Georgia Encyclopedia and others): the English-cottage Pure Oil station with a steep blue roof, Stuckey's house-with-canopy, Spanish-mission motel courts, stone tourist courts, streamline diners, drive-ins (screen, ticket booth, snack bar, speaker posts), and novelty giants.
- **The Ozarks** add native fieldstone cottages, hewn log cabins, springhouses, root cellars, smokehouses, corn cribs, outhouses, and karst caves.

## What is in the pack (name: use)
- **Gas stations:** `gas_shed` (1920s tin office, two vintage pumps), `gas_house` (house type, clapboard, chimney), `gas_cottage` (English cottage with a steep blue roof), `gas_mission` (stucco and tile with an arcade), `gas_box` (white porcelain, red stripe), `gas_vee` (1950s-60s concrete block, folded steel roof), `gas_modern` (brick convenience store), `gas_lighthouse` (rare landmark). Pumps: `vintage_pump_glass`, `vintage_pump_clock`, `pump_island_modern`. Canopies: `canopy_cottage`, `canopy_flat`, `canopy_vee`.
- **Road trade:** `diner_streamline`, `curb_canopy` (five carhop posts), `motor_court_row`, `motor_cabin`, `motel_sign` (neon), `drive_in_screen`, `drive_in_booth`, `drive_in_snack`, `speaker_post`, `tepee_shop`, `muffler_man`, `billboard`, `fruit_stand`, `phone_booth`, `bus_shelter`.
- **Utility and odd:** `quonset_hut`, `water_tower` (28 m), `grain_elevator` (27 m), `mobile_home_single` and `_double`, `container_shop`, `a_frame_cabin`, `dome_house`, `fire_tower` (18 m, climbable).
- **Ozark:** `stone_cottage`, `log_cabin`, `springhouse`, `root_cellar`, `smokehouse`, `corn_crib`, `outhouse`, `cave_mouth` (a dark panel for a cave level), `stone_gate`.

## Using it
- Origin at the centre of the footprint, door and pumps face +z (rotate to face the road); `info[name]` has width, length, height and a note. Windows are dark glass; lit windows and neon (`glow` pieces) are for night.
- A station is a building plus a canopy plus a pump island plus a pole sign (`autotrade.sign_pylon`). Pairings are in the pack's `rule`.
- `use` in the pack maps OSM tags to models (`amenity=fuel` picks a style, `tourism=motel`, `man_made=water_tower`, `building=static_caravan`, `natural=cave_entrance` and more). Pick the gas station style by the street's era: 1920s-40s on old Route 66 (St Louis Street, Kearney, Glenstone), 1950s-60s on arterials, modern elsewhere.
- Rare landmarks (`gas_lighthouse`, `tepee_shop`, `muffler_man`, `water_tower`, `grain_elevator`, `drive_in_screen`): at most one or two on the map, on a known road.
- The interiors are not in this pack: the gas station shop, diner and motel rooms come from `businesses.js`, `foodservice.js` and `services.js`.

## Not made
Damaged or burnt variants (the game's damage system applies to buildings; ask if you want shaped ruins), a church steeple set, barns (see `farm.js`), and real Springfield landmarks by name (Gillioz, the Shrine Mosque), since those are real buildings and need their own references.

## Sources
- [NPS Preservation Brief 46: The Preservation and Reuse of Historic Gas Stations](https://www.nps.gov/orgs/1739/upload/preservation-brief-46-gas-stations.pdf)
- [Springfield MO, the Route 66 lover's guide](https://springfieldmo.org/blog/post/the-route-66-lovers-guide-to-springfield-missouri)
- [Georgia Encyclopedia, Roadside Architecture](https://www.georgiaencyclopedia.org/articles/arts-culture/roadside-architecture/)
