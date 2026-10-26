# Business interiors and fit-out (26 October 2026)

For the main chat and the map chat. What the registered businesses of the Springfield region are, what each one keeps inside and needs to run, and the four packs (`foodservice`, `autotrade`, `services`, `shopfit`) and the kit file (`assets/shaped/businesses.js`) made for them. Piece lists and triangle counts are in `docs/SHAPED.md`; each pack's `rule` text repeats the placement recipe.

## 1. What the map holds

Counted from `assets/springfield/*.js` (ways and points, tags `shop`, `amenity`, `office`, `tourism`, `leisure`). The biggest groups, which set the order of work:

| Group | Mapped (about) | Pack |
| --- | --- | --- |
| Restaurants 576, fast food 545, cafes 75, bars 70, ice cream 23, nightclubs 24, bakeries, butchers, delis | 1,400 | `foodservice` |
| Banks 285, post offices 39, government 36, town halls 18, lawyers 37, insurance 51 | 470 | `services` |
| Car repair 270, car dealers 188, car parts 66, car washes 50, fuel 257, charging 18, boat storage 117 | 970 | `autotrade` |
| Convenience 253, supermarkets 127, variety 47, department 35, clothes 68, furniture 47, DIY 47, hardware 18 | 650 | `foodservice` + `autotrade` + interiors |
| Clinics 154, dentists 121, doctors 32, pharmacies 86, vets 32 | 425 | `services` |
| Hotels 135 and 105, dormitories 25, hairdressers 79, beauty 38, tattoo 27, laundries, funeral, florists | 450 | `services` |
| Every business | | `shopfit` (doors, ceilings, partitions, restrooms, floors) |

## 2. How a business runs (what the research said)

I asked of each business: what comes in, what is done to it, what goes out, who is there, and what it needs from the town (power, water, gas, cold, a road).

- **Restaurants and fast food** are a kitchen line (cook, heat, hold, serve) with a fixed order: delivery and cold store, prep, hot line under a hood (fryer, flat top, broiler, oven), a heat-pass window to the front, dish room (three-compartment sink and a dish machine), and a hand sink in the path of staff. Fast food adds an order counter, kiosks, menu board, drink fountain and shake machine, a drive-thru window and a menu on the road side. Everything in the kitchen needs power, water and gas, and the cold store needs power or the food turns.
- **Bakeries** need a rack oven, a mixer, proofer racks and flour; **butchers** a cutting room and cold, hooks, slicer, scale; **delis** a slicer, cheese and a salad bar; **bars** a back bar, taps, kegs in a cooler and a store; **ice cream** a freezer cabinet and cones; **convenience stores** a hot case, roller grill, coffee and slush machines, a tobacco wall, an outdoor ice chest, propane cage, air pump and vacuum post.
- **Car repair** is bays with two-post lifts, a tyre changer and balancer, an air line from a compressor, a roll-away tool cabinet and shadow board, fluids, a parts washer and a parts room, and a desk with a key board. Dealers are a showroom with a pedestal, a sales desk, a key cabinet, price signs, pennants and a flagpole. Car washes are a bay or tunnel, vacuum posts and a squeegee station. Fuel is canopy, tank lids, EV chargers, air and bollards. DIY and hardware are paint mixer, key machine, fastener bins, lumber, pipe, ladders and a yard of bagged goods and fence panels. Storage is rows of units, a keypad gate and a dolly.
- **Health**: dentists are operatories (chair, cart) round a sterile counter, an X-ray room and a desk; clinics are a waiting room, exam rooms and a treatment room; vets add a scale, kennels, cat cages and surgery; opticians a frame wall and an exam chair. Pharmacies need a counter, a pill wall and a take-a-number machine.
- **Personal care**: salons (chair, station, shampoo bowl, hood dryer), barbers (chair, pole), nails (manicure table, pedicure chair), tattoo (flash wall, chair, tray), massage (table). Water and power.
- **Hotels and motels** are lobby (front desk, key rack, luggage cart), rows of rooms (bed, dresser with TV), corridors with vending and an ice machine, housekeeping carts, a breakfast bar and a vacancy sign on a pylon. **Dormitories** are rows of units, a laundry and a lounge.
- **Bank, post, government, courts, offices**: rope lines, teller windows, deposit table, vault, drive-up teller; PO box wall, sorting racks, parcel scale; service windows, flags; a courtroom with bench, stand, jury box, gallery pews and a bar gate; desks, libraries and filing.
- **Others**: laundromats (washers, dryers, folding table, change machine), childcare (cubbies, kids tables, cots), funeral homes (casket, wreaths, urns, guest book), cinemas and theatres (ticket window, rope lines, seats), sports centres (lockers, rubber floor, trusses), churches (altar, pulpit, organ).

Fit-out: every business has a glass door, a window and an entrance mat in the front wall; ceilings are drop-ceiling panels with fluorescent troffers (offices, shops, clinics), pendants (restaurants), tracks (boutiques) or an exposed truss (warehouses, gyms); kitchens, butchers and restrooms are tiled; floors say what the business is (checker for diners, terrazzo for banks, epoxy with a hazard edge for garages, rubber for gyms, red carpet for cinemas).

## 3. The packs

| Pack | Pieces | Notes |
| --- | --- | --- |
| `foodservice` | 61 | Kitchen line, front of house, bakery, butcher, convenience, ice cream and bar, cleaning |
| `autotrade` | 62 | Workshop, dealer, car wash, fuel, DIY and garden, storage, boats and bikes |
| `services` | 70 | Health, vet, hair and nails, tattoo, hotel, bank, post, civic and court, childcare, dorm, laundry, funeral, office |
| `shopfit` | 51 | Doors, windows, awning, ceilings and lights, ducts, safety, partitions, restrooms, wainscot and tile, 15 floor patches |

All version 1, flat colours from each pack's palette, metres, origin at the centre of the base, front facing +Z (a piece you use from one side is noted in its `info[name].use`). Each piece's `info` also has `note`, `use`, `powered`, `water` and `holds` (what loot it can hold). Ceiling pieces hang from y = 3.0 and floor patches are 2 m decals at y = 0.02.

## 4. `businesses.js`: the kit for each business

`window.BUSINESSES.kits[<osm tag>]`, 60 kits, one per tag above (`shop=car_repair`, `amenity=dentist`...). Each has:
- `sign`: sign kind from `interiors.js` (`signKinds`), `staff`: who works there;
- `rooms`: room programme as shares of floor area (the names are the business's own: `bays`, `operatories`, `tellers`...; the main chat maps them onto `FLOORPLAN.gen` room types or its own layouts);
- `fixtures`: rows `[pack.piece, where, count, extras]` in the same form as `interiors.js` `roomFixtures` (`where` is one of wall, door, far, corner, end, mid, rows, plus `ceiling` and `room` (once per room); a negative count means one per that many square metres); every piece is checked to exist when the file is built;
- `exterior`: pieces that go outside (canopy, pylon, drive-thru, pennants, bollards...);
- `needs`: power, water, gas and staff count, so a closed or dead business can be shown as dark and dry;
- `loot`: item names a survivor can find (many are not in the item list yet; use the ones that are and ask for the rest);
- `floor`: the `shopfit` floor patch to tile the public rooms with.

Rebuild: `python3 assets/shaped/src/biz_kits.py` (needs node).

## 5. Why the world looks lived-in with these

A dead town is told by what people left half-done: the fryers with oil in them, the key on the board, the coffee machine, the cash drawer, the VACANCY sign, the lit-or-dark ceiling, the checker floor, the mop bucket and the wet-floor sign. Use `needs` to decide what is dead, and use `holds` and `loot` to decide what is worth walking into the back for.

## 6. Not made yet

Cinema seat rows, projector, stage, DJ booth and disco ball; mall fountain, directory and kiosks; spinner racks, pawn guitar wall, charity bins, florist buckets, a bird cage and aquarium; a car-hoist for buses; restaurant kitchen vents on the roof. Ask in `docs/ART_REQUESTS.md`.
