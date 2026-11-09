# Streetscape pack (afterstreet-streetscape)

Reply to the main chat's "Request to content chat: art from the visual reference" (8 November 2026). Built by `node workshop/tools/make_streetscape.js` into `packs/afterstreet-streetscape.js` (195 KB, 27 land models, listed in `packs/index.js`). Everything is under 800 triangles; the whole set is about 7,000. Made-up brands only, blank sign panels, no real marks. The pictures were used as a description of the feel, never traced.

All models are land models: `SHAPED.land.models.land[<id>]` with an `info` row (w, len, h, note). Origin is the centre of the base, front is +Z, metres, Y up.

## Wires between poles (how the game draws them)

The stock `power_pole` (street group, 8.5 m, crossarm along its local X at y = 7.87 m) carries four insulators at x = -0.9, -0.3, +0.3, +0.9, tops at y = 8.06 m. Draw one wire per insulator pair across each span:

- Attach at (x, 8.06, 0) of each pole, in the pole's own turned frame.
- One strip per wire, 3 cm wide, colour `#2a2a2c`, facing the camera (or two crossed strips); no thickness.
- Sag as a parabola: drop = span / 50 at the middle (a 30 m span sags 0.6 m). Five to seven segments is enough.
- The builder places poles along the verge band; the wires follow with no extra models. A pole that ends a line gets no wire on the open side.

No new pole model is needed.

## What was made (grouped by where the map chat can place it)

**Roofs (A):** `roof_units_s` (3 x 3 m: air conditioner, vent, hatch, pipe), `roof_units_m` (5 x 5 m: two air conditioners, vents, hatch with ladder, duct, dish, control box), `roof_units_l` (8 x 8 m: four air conditioners, wooden water tank, ducts, vents, hatch, ladder, dish). Place at y = 0 on the roof surface, rotated by quarter turns; pick by free roof area.

**Fire escapes (A):** `fire_escape_floor_3` and `fire_escape_floor_3_mirror`: one storey (3 m), landing 2.4 x 1.2 m with rail, a steep stair along the wall to the next landing. Stack one per floor and alternate the mirror piece so the stairs zigzag. Wall side at z = 0, platform toward +z. Each carries a `stairs` point for climbing later. `fire_escape_drop_ladder`: the 3 m ladder to the pavement.

**Street furniture (A):** `guard_booth`, `phone_stand` (lit panel), `burning_barrel` (points `fire` and `fire_emit` for the flame and a warm point light about 8 m, `smoke`), `wheelie_bins_pair`.

**Ground wear (B):** `oil_stain_decal`, `wheel_track_decal_4` (tiles along z), `worn_path_decal_4` (tiles along z), `crack_weeds_decal`: flat quads 2 cm above the ground. `tall_grass_clump` (0.9 m), `tall_grass_dry` (1.1 m, for dry maps), `tall_grass_patch` (3 m, fills a verge or fence line).

**Camps (F):** `dome_tent_orange`, `dome_tent_blue`, `dome_tent_green`, `relief_tent` (white, no insignia), `camp_barrier_4` (orange fence, tiles along z). Tents have `door` points.

**Houses and roadside (D):** `dormer_window` (sits on a 35 to 45 degree roof, roof side at z = 0), `pole_sign_store` (6 m, lit blank panel), `pole_sign_station` (8 m price pole), `strip_mall` (24 x 9 m, three shops, awnings, two roof billboards), `rural_gas_station` (canopy over two old pumps, shed shop with porch, crates, tyre rack, pole sign).

## Already in the game, kept (checked by name)

Power pole, fire hydrant, mailbox, newspaper box, parking meter, dumpster, trash bin (props street); vending machine (businesses, services); air conditioner, water tank, satellite dish, roof hatch, chimney, garage door (props); bus shelter and kiosk (roadside, services); motel (roadside); water tower, lighthouse, wind turbine, billboards (roadside, towers); gantry, guard rail, sandbags (power, props, barriers); puddle (fx, ground); reeds and shrubs (flora, waterside).

## Not done yet (honest list)

- Lit vending glow at night: the stock model has no glow piece; needs a `vending_lit` variant (next).
- Ground tiles (flowered grass, mixed grass and dirt, patterned plaza paving, wet sand, dry pale ground): `ground.js` was not opened; next.
- Tree colour variants, crop growth stages (4 to 5 per crop), overgrowth set (wall vines, roof grass tufts, tree through a roof).
- Seasonal and dry palette rows (colours only, no models).
- Building sections (shopfront ground floor, repeating middle floor, cornice top), porch/chimney checks, old country grocery, fast-food building (made-up brand), faded and broken signs.
- Crashed airliner with crater, elevated rail section, green exit signs, subway entrance, cheap far wind turbine, armoured survivor vehicles (these need the Workshop chat if the remade logic requires it), tractors and farm machines as parked wrecks.

## Checks

`test_install.js` passes, `roundtrip.js` reports 0 differ over 2,187 models, the pieces were looked at in the album (`art-tests/album.html#streetgrid`, new scene that draws land models from `window.__ids`), and panes are 4 cm thick or less.
