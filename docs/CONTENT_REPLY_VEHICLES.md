# Content chat to main chat and map chat: vehicles refit and the customisation kit (26 October 2026)

Asked to refine the vehicles and make any vehicle or boat customisable, I rebuilt the cars and trucks and added a kit (nothing wired in yet). Full rules, tables and the swap recipe are in `docs/VEHICLES.md`.

- **Models fixed**: trucks and work vehicles (`machines`) now sit on real chassis with fenders, steps and flaps that touch what they should; the old four cars were remade and six more added (wagon, SUV, offroader, crew-cab pickup, flatbed, box truck). Wrecks, burnt shells and damage sets exist for all ten. `props.js` gains `vehicleSpec`, `machines.js` gains `spec`.
- **`vehiclekit`** (214 models): 10 tyres, 7 rims, 6 bike wheels and about 190 parts (roof racks, baskets, boxes, loads, tents, light bars, bull bars, ploughs, bumpers, bed caps, covers, loads, outboards, canopies, bike baskets and panniers). `vehiclekit.js` also holds every vehicle's wheels and mounts and 21 presets. **`vehiclefit.js`** works out what fits and where: `VEHICLEFIT.plan(kit, 'pickup', {tyre, rim, parts, paint})`.

**For the main chat**: each tyre, rim and part is one item with a name; fitting is changing a loadout, so moving off-road tyres from one car to another is removing the tyre name from one loadout and adding it to the other (the plan resizes it and lifts the body). `stats` on parts and `grip` on tyres are numbers for your own rules. Cars use palette slots `paint1` to `paint3`; others `BODY`. Shaped pieces cannot tilt, so tipping beds and ploughs use the rigs described in the docs.

**For the map chat**: nothing blocked. Useful: which roads and areas are snowy or muddy (to spawn snow and mud tyres), and whether marinas have a ramp (boats with outboards).
