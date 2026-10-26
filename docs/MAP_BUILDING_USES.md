# What buildings are, and how they are laid out

Map chat, 26 October 2026. The builder (`builder/uses.js`, builder 1.14.0) works out what each building is *for* and writes it on the building. This page says what it writes, how the use is found, and how each kind of building is laid out in real life, so the floor-plan makers (design chat's `assets/shaped/floorplan.js`, the game's `engine/interiors.js`) can lay the inside out the way the real thing is.

## 1. What the builder writes

On every building way, three tags the game can read (all start `asmb:`):

| Tag | Meaning | Example |
|---|---|---|
| `asmb:use` | the kind of building, a key from section 3 | `bigbox`, `home_improvement`, `police`, `gym` |
| `asmb:label` | a plain name | `Walmart Supercenter`, `Fire station` |
| `asmb:brand` | the chain, when a known one | `Walmart`, `Lowe's` |

Where a chain or a name shows the OpenStreetMap tags are missing or wrong, the builder also writes the tags the game already reads (`shop`, `amenity`, `leisure`, `tourism`), so the game's building kinds (`kindOf` in `engine/world.js`) come out right today with no engine change: a Walmart is `shop=supermarket` (grocery, not "clothes", which is what `shop=department_store` gives), Lowe's and Home Depot are `shop=doityourself` (hardware), a Planet Fitness is `leisure=fitness_centre` (gym).

**How the use is found, in order:**
1. A brand or name that is a known chain (Walmart, Target, Costco, Sam's Club, Home Depot, Lowe's, Menards, Kroger and other grocers, Walgreens/CVS, dollar stores, fast-food and coffee chains, fitness chains, fuel and bank and hotel chains, big specialty stores). A chain name beats a shop tag that is known to be wrong for it, but never overrules `amenity=police`, `amenity=fuel` and the like.
2. The map's own tags: `amenity`, `shop`, `leisure`, `tourism`, `office`, `craft`, `healthcare`, `military`.
3. The shop and amenity points inside the building (four or more shops inside a retail building make it a `mall`).
4. The building's name, only when the tags say nothing about use ("Springfield Police Department", "Mt Olive Baptist Church", "Joe's Corner Market"). A name never turns a house, apartment block or garage into a shop, and names ending in street words ("Chase Apartments", "Target Range Road") are ignored.
5. The plain `building=*` value (`house`, `apartments`, `retail`, `warehouse`, `barn`, ...).

Tested on the Springfield, Missouri sample (five squares): 6 Walmart Supercenters, 2 wholesale clubs, 11 home-improvement stores, 3 police and 7 fire stations, 12 gyms, 90 schools, 129 churches, 22 supermarkets, 194 fast-food places.

## 1a. Size, floors and whether it is open (builder 1.17.0)

Asked for by the content chat (`docs/BUSINESSES.md`) so each business can be sized and shown alive or dead. On every real building that is not a plain home, shed, garage, barn or greenhouse:

- `asmb:area` is the footprint in square metres, rounded to 5; `asmb:floors` the number of storeys (from `building:levels`, else height divided by 3.4 m; left out when unknown). Multiply the two for floor area.
- `asmb:state` is written only when a business is **not** open: `disused` (closed, from `disused=yes` or a `disused:shop=*`, `disused:amenity=*`, `was:shop=*` tag) or `abandoned` (`abandoned=yes`, `ruins=yes`, `building=ruins`, `abandoned:shop=*`, `abandoned:amenity=*`, `abandoned:building=*`, `demolished:*`, `razed:*`). A building with a current `shop` or `amenity` tag is open even if it also has an old `disused:*` tag. For a closed business the use (`asmb:use`, `asmb:label`) is what it **was**, so the game can show the old sign on a dark building.
- The map's own tags are all there is: a shop that closed and was not updated in OpenStreetMap still reads as open.

## 1b. Framed structure (builder 1.16.0)

Every building also gets its **structure**, from the content chat's walls pack (`assets/shaped/walls.js`, `docs/SHAPED.md` section "walls"): `asmb:wall` is the wall kind and `asmb:frame` the frame family. A real building is a frame with skins on it, so the kind follows from use, floors, size and facing:

| `asmb:wall` | `asmb:frame` | Storey | Used for |
|---|---|---|---|
| `wood_siding`, `wood_brick` | wood (studs every 0.5 m, plates, headers) | 3.0 m | houses, sheds, barns, small churches, apartments up to 3 floors (brick facing gives `wood_brick`) |
| `lightsteel_sheet` | lightsteel (steel studs, same layout) | 3.5 m | small shops, small offices and hotels, apartments of 4 to 5 floors, small supermarkets and gyms |
| `steel_cladding` | steel (columns on a 6 m grid, girts, beams) | 4.5 m | big-box and club stores, home centres, warehouses, factories, malls, stations, large supermarkets (over 2,500 m2) |
| `steel_curtain` | steel (mullions, glass) | 3.5 m | glazed or mid-rise offices and banks |
| `concrete_poured` | concrete | 3.5 m | hospitals, car parks, towers of 6 floors or more |
| `concrete_block` | concrete | 3.0 m | garages and utility buildings |
| `concrete_brick` | concrete (brick on block) | 3.5 m | schools, civic buildings, police and fire stations, large churches, brick apartments of 4 to 5 floors |

The game's build mode and cell walls (0.56) read `asmb:wall` to choose the wall `kind` for the sections, openings and joints, and `asmb:frame` for the sticks and the floor type (`floors[family]`). A building the player places or changes in the builder carries the choice they made (Frame list in the Building and Change tools), otherwise the rule above.

## 2. How real buildings are designed (the rules that matter for a floor plan)

These hold for almost every public or commercial building and are why a store does not look like an office:

- **Public front, private back.** The customer enters at the front; stock, staff rooms, offices, mechanical and loading are at the rear or one side, behind doors the public does not use. Deliveries arrive at a loading door on the rear or side wall, away from the customer entrance.
- **Circulation first.** Retail and halls are one big room with the circulation inside it (aisles, a main loop). Offices, schools, hospitals, hotels, police and apartment blocks are corridors with rooms on one or both sides (single- or double-loaded). The corridor is 1.5 to 2.4 m (hospitals 2.4 m or more).
- **Structural grid.** Big single-storey buildings sit on a column grid: 9 m by 9 m to 12 m by 12 m for retail, 12 m by 18 m for warehouse and big-box. Rooms and aisles follow the grid; a plan that ignores it looks wrong from the inside. Houses use 4 to 6 m spans.
- **Wet rooms stack.** Bathrooms, kitchens and plumbing walls sit together and stack above each other, back to back.
- **Exits.** Two exits from any public room over 50 people or any storey above the first; the stair cores are at opposite ends of a long corridor, not together.
- **Heights.** Houses 2.4 to 2.7 m floor to ceiling, offices and schools 2.7 to 3.3 m, shops 3.5 to 4.5 m, big-box 7 to 9 m under the roof (parapet to 10 m), warehouses 9 to 12 m, gyms 4 to 6 m (courts 8 m), churches 6 to 14 m in the nave, fire-engine bays 4.5 to 5.5 m.
- **Sizes by use** are the footprint ranges in section 3, from published store and building standards (typical prototypes, not exact for each store).

## 3. Each use: footprint, storeys, layout

`FP kind` is the existing `FLOORPLAN.gen` kind to use today; `new` means a plan that does not exist yet (section 4). Metres. "Front" is the side with the customer entrance.

### Retail

| `asmb:use` | Footprint and height | Layout |
|---|---|---|
| `bigbox` (Walmart Supercenter, Target, Meijer) | 8,000 to 17,000 m2 (a Walmart Supercenter is about 15,000 m2, roughly 150 x 100 m), one storey, 8 to 9 m | Entrance vestibules (two sets of doors) at the middle of the front, with the cart lobby and a row of 20 to 30 checkout lanes across the whole front inside. Services at the front corners: pharmacy, vision, bank, a fast-food counter. **Grocery on one side** (right as you enter): produce first at the front, then the perimeter walls of meat, dairy and bakery/deli, with freezer and cooler boxes behind them at the rear on that side. **General merchandise on the other side**: apparel at the front, then home, toys, electronics, sporting goods, auto, back to the garden centre. Shelf aisles run **front to back** in a grid in the middle, 3 to 4 m apart, with a wide race-track loop around them. **Stockroom, receiving and offices form a band across the whole rear** (15 to 25% of the depth), with 2 to 6 dock doors on the rear or a short side, trash and cardboard baler at the dock. Garden centre: a fenced yard attached to one front corner. Restrooms by the front. FP kind `new` (bigbox); until then `grocery` scaled, which is only one room. |
| `club` (Costco, Sam's Club, BJ's) | 9,000 to 14,000 m2, one storey, 9 to 11 m, an undivided warehouse with racking to 6 m | Entrance and exit separate, at one front corner, with the membership desk and a returns counter; food court in the other front corner; **tyre centre** a separate bay at one side. Merchandise on pallets in long aisles front to back (aisles 5 m); fresh (meat, dairy, bakery, produce) along one side with coolers behind; checkouts across the front. Receiving docks at the rear, offices on a mezzanine over the stockroom or in the rear corner. Gas station is a separate building out front. FP kind `new` (club). |
| `home_improvement` (Home Depot, Lowe's, Menards) | 8,000 to 11,000 m2 (Home Depot about 10,000 m2, Lowe's about 11,000 m2), one storey, 9 m with racking to 6 m; plus a garden centre of 2,000 to 3,000 m2 | Entrance in the middle of the front with the registers and service desk across the front. **Pro desk and tool rental** in the front corner. Departments in a loop: paint, flooring and tile, lighting, plumbing and electrical, hardware and fasteners, tools, doors and windows, appliances, kitchens; shelves in long aisles, 3.5 m apart. **Lumber and building materials along the rear or one side**, in racking open to the stockroom and reached by a drive-in loading dock; the **garden centre** is attached at a front corner and fenced, with its own checkout and a covered plant house. Stockroom and offices at the rear. FP kind `new` (homeimp); `hardware` is only a small shop. |
| `supermarket` (Kroger, Aldi, Price Cutter) | 1,500 to 5,000 m2 (Aldi about 1,400 m2), one storey, 4.5 to 6 m | Entrance at a front corner with carts; produce in front of you as you enter; **perimeter** departments (deli, bakery, meat, dairy, frozen) along the sides and rear wall with the coolers behind them; **middle** is long shelf aisles front to back; checkouts across the front. Pharmacy and bank in the front corners; stockroom, receiving dock, offices and break room across the rear. FP kind `grocery` (needs aisles and a rear service band: `new` supermarket). |
| `grocery_small`, `convenience`, `market` | 100 to 350 m2, one storey, 3.5 to 4 m | One room. Counter and register just inside the door on the side where the clerk can see the room; **coolers (drinks, beer, milk) along the back wall**, snacks and shelves in 2 to 4 short aisles; hot food and coffee at the counter; stockroom, office and one restroom behind a door at the rear. FP kind `grocery` or `fuel` (the `cstore` hub). |
| `dollar_store` | 700 to 1,000 m2, one storey | One room with shelf aisles front to back, registers at the front, stockroom at the rear, one restroom. FP kind `shop`. |
| `department_store` | 5,000 to 25,000 m2, two to four storeys | Cosmetics and accessories by the main entrance, then departments around a central escalator and stairs; stockroom floors above and behind; loading at the rear. FP kind `boutique` scaled; `new` for multi-storey. |
| `pharmacy_store` (Walgreens, CVS) | 900 to 1,400 m2, one storey | Entrance on a corner of the building; front-store shelf aisles; **pharmacy counter at the back** with a waiting area and a drive-up window at the rear; stockroom beside it. FP kind `pharmacy`. |
| `hardware` | 300 to 1,500 m2 | One room with tall shelves; counter near the front; stock behind. FP kind `hardware`. |
| `auto_parts`, `garage_shop` | 500 to 900 m2 (parts), 300 to 600 m2 (repair) | Parts: counter with parts behind it across the room; repair: customer area at the front, 2 to 6 bays (4 m wide, 8 m deep, 4.5 m high) with roll-up doors on the side or rear. FP kind `garage`. |
| `mall` | 20,000 to 100,000 m2, one or two storeys | An indoor street (6 to 10 m wide) with shops on both sides; an anchor store at each end and entrance; food court in the middle; service corridor behind the shops. FP kind `new` (mall). |
| `retail`, `electronics`, `clothes`, `furniture`, `car_dealer` | 100 to 1,500 m2 | One room, front entrance, stock room at the rear, a restroom. Car dealer: showroom with glass front, service bays at the rear. FP kinds `shop`, `estore`, `boutique`. |

### Food, drink, fuel, lodging

| `asmb:use` | Layout |
|---|---|
| `fast_food` | 200 to 400 m2. Entrance, **order counter across the room**, kitchen directly behind the counter with the cooking line and a pass-through, dining room along the glass front, restrooms at one side, **drive-through lane** around the building with the window on the kitchen side. FP kind `cafe`/`dining`. |
| `restaurant`, `cafe`, `bar` | Dining room at the front and windows; kitchen at the back, adjacent to a service entrance and the storeroom; restrooms by the kitchen so plumbing is shared; bar along a side wall. FP kind `restaurant`, `cafe`, `bar`. |
| `fuel` | A canopy over the pumps (not a room) and a **convenience store** of 150 to 300 m2: counter at the front by the pumps, coolers along the back wall, restroom and office behind. FP kind `fuel`. |
| `hotel` | Ground floor: lobby, front desk, breakfast room, a meeting room, laundry and staff behind the desk; guest floors: a double-loaded corridor of 3.6 m by 8 m rooms (each with bath at the corridor end of the room), a stair core at each end and an elevator in the middle, ice and vending in an alcove. FP kind `hotel`. |

### Civic and safety

| `asmb:use` | Footprint and height | Layout |
|---|---|---|
| `police` | A town police station is 600 to 3,000 m2, one to two storeys | **Public front, secure rear.** Public lobby with a front desk behind glass, a records window and a small waiting room, then a **secure door** into the staff side. Staff side: squad room (bullpen), detectives' offices and interview rooms, report writing, dispatch (24-hour, windows to the lobby), chief's and commander's offices, break room, locker rooms, **evidence room and armory** deep inside with one door, **holding cells** at the rear next to a **sally port** (a drive-in garage with two doors) that is entered from the back, and a vehicle yard fenced behind. FP kind `police` (cells and armory at the back: matches); a sally port and the secure door are not there yet. |
| `fire` | 600 to 1,500 m2, one to two storeys | **Apparatus bays** (4.5 m wide each by 14 to 18 m deep, 5 m high, roll-up doors 4.2 x 4.2 m) across the front or side, drive-through where the lot allows (doors on both ends); **between bays and the quarters** a turnout-gear room and a decontamination/hose room; quarters: kitchen, dayroom, dining, bunk rooms, office, a watch room by the bays, fitness room, laundry; a hose tower or training tower at one back corner; a pole is rare. FP kind `fire` (bay at the front, quarters at the back and upstairs: matches). |
| `hospital` | 4 to 8 storeys, 6,000 to 60,000 m2 | **Separate entrances** for the public (main lobby, registration, gift shop, cafeteria on the ground floor) and for **emergency** (ambulance bay and walk-in, with triage and a short corridor to the ER treatment bays), plus a service dock at the rear. Imaging, labs and surgery on the ground and second floors behind the lobby; nursing wards on the upper floors as a loop or a cross around a nurse station, 3.0 m corridors; mechanical floor on the roof. FP kind `hospital`. |
| `clinic`, `pharmacy_store` | 200 to 2,000 m2 | Waiting room and a reception counter at the front, a corridor with exam rooms (3 x 4 m) on both sides, a lab/nurse station, staff office and restroom at the rear. FP kind `clinic`. |
| `school` | 3,000 to 12,000 m2, one to three storeys | **Office suite right inside the front door** (so visitors sign in); single or double-loaded corridors of classrooms (8 x 9 m, one side, windows to the outside), the gym and cafeteria (with kitchen) at one end with their own outside doors for events, library (media centre) in the middle, restrooms at corridor ends, stair cores at both ends. Bus loop on one side and a separate parent drop-off. FP kind `school`. |
| `church` | 300 to 1,500 m2, nave 6 to 14 m high | Entrance in the **narthex** (lobby) at the west end, a **nave** along the long axis with pews facing the **chancel** and altar at the east end; sacristy/vestry beside the chancel; fellowship hall, kitchen and classrooms in an annex at one side or behind; bell tower or steeple above the entrance. FP kind `church`. |
| `library` | 500 to 3,000 m2 | Entrance and circulation desk, a large reading room with shelves in rows, a children's room, meeting rooms, staff areas and a workroom at the rear. FP kind `library`. |
| `post_office` | 400 to 1,500 m2 | Lobby with PO boxes along a wall and a counter; behind the counter a **sorting room** open to a loading dock at the rear (trucks), a supervisor's office. FP kind `new` (post). |
| `townhall`, `courthouse`, `office` | 1,000 to 6,000 m2, two to four storeys | Lobby and a security point at the front, a double-loaded corridor of offices, a council chamber or courtroom (tall, double height) at one end; courtrooms have a separate **prisoner entrance**. FP kind `office`. |
| `bank` | 300 to 1,000 m2 | Lobby with a teller line, offices along the sides, a **vault** at the back (reinforced room with one door), a drive-up window and teller lanes on a side. FP kind `bank`. |
| `gym` | 800 to 4,000 m2, one storey, 5 to 8 m | Front desk and a small lounge at the entrance; **locker rooms** (separate men's and women's, with showers) on one side behind the desk; open floor beyond with cardio (treadmills along the front windows), then weights, then free weights and racks at the back; group-class studios (mirrored room with a sprung floor) at one side; child-care room near the front desk; offices and laundry at the rear. Larger centres add a pool hall (5 to 8 m high) and a court hall (28 x 15 m, 8 m high). FP kind `gym`. |
| `venue`, `stadium` | any | Lobby, a big hall, a back-of-house corridor behind a stage or field; separate artist/player entrance. FP kind `venue`. |

### Industrial, farm, residential

| `asmb:use` | Layout |
|---|---|
| `warehouse`, `factory` | A big open hall with racking in long aisles; **office and breakroom in one front corner**, often two storeys; **dock doors** along one long side (about one per 1,000 m2, 3 m wide, raised 1.2 m), a drive-in door at one end. FP kinds `warehouse`, `factory`. |
| `barn`, `shed`, `garage`, `greenhouse` | One room (or two for a barn: stalls along one side, a hay floor above); a big door on the short end. FP kind `garage`. |
| `apartments`, `house` | Apartments: a double-loaded corridor of units (a one-bedroom is 45 to 60 m2, a two-bedroom 70 to 90 m2), stairs at both ends, a laundry and mailboxes by the entrance; unit plans with the bath and kitchen on the corridor side. Houses: a front door into a living room, a kitchen at the back, bedrooms and bath along the other side (one storey) or upstairs (two storeys), a garage on a side. FP kinds `apartments`, `house`. |

## 4. What this asks of the floor-plan and engine chats

For the **design chat** (`floorplan.js`): new kinds for the large single-room formats that the hub plan cannot do, each a *hub* (one big room with the entrance) plus a **rear service band** and the aisle structure above: `bigbox`, `club`, `home_improvement`, `supermarket`, `mall`, `post`, and for the existing `police` a **sally port**, **secure door** and **evidence** room, for `hospital` a separate **emergency entrance**, for `fire` a drive-through option. Rooms needed: `registers`, `produce`, `meat_cold`, `garden_centre`, `lumber`, `pro_desk`, `pharmacy_counter`, `dock`, `receiving`, `sorting`, `sally_port`, `evidence`, `triage`, `lockers`, `studio`.

For the **main chat** (`engine/interiors.js`): read `asmb:use` from the way's tags (the compact map keeps the tags on `ways`) and pick the floor-plan kind by it, falling back to `kindOf` when there is none. `asmb:label` and `asmb:brand` are what to show on the sign and in the map. The builder already makes the engine's existing kinds right for chains (Walmart = grocery, Lowe's = hardware).

## 5. Limits

- Names and brands are US-first (the builder is US-first too). Other countries' chains are not listed; their OpenStreetMap tags still work.
- A brand with no tag gives only its use, not its exact size: a "Walmart" can be a 15,000 m2 supercenter or a 1,500 m2 Neighborhood Market; the builder reads "Neighborhood Market" in the name, and otherwise uses the footprint (under 4,000 m2 is treated as a supermarket by the floor-plan chat).
- The use is what the map says, not what is inside today: a closed store is still its old use (OpenStreetMap's `disused:*` and `abandoned:*` tags are not read).
