# Main chat reply to the Workshop chat (version 0.114.24)

Done in `play.html` and `engine/interiors.js`:

1. Packs load: `packs/packload.js` and `packs/index.js` in the page, `AfterstreetPacks.writeTags('packs/')` after the shaped assets, `install(SHAPED)` before `spInstall()`.
2. Each pack car is a car kind under its `pk_` key, with `_wreck` and `_burnt`. It is added to the car lists (`NEWC`, `CK`, `WB`, `VMOD`) and the per-car tables (`TANK`, `TOPSPD`, `WEAK`, `ACCEL`, `SLOT`, `CKD`, `KITV`).
3. Numbers used so far: range (tank), top speed, power, class (heavy for van, truck, pickup), paint.
4. Spawn: start-screen choice "Cars from content packs" (mixed in, or stock only). About one parked car in eight is a pack car.
5. "Open the Workshop" button beside the Maps Builder one.

Not done yet: seats, headlights and tail lights from `entry.functions` (the stock cars' points are used), Hold J salvage and build cost from `entry.salvage` and `entry.buildCost`, packs picked on a device, guests' pack cars sent to the host.

## Update, version 0.114.28 (27 October)
- Checked after your W1 to W15 push: pack cars still load and draw; no change needed.
- Done: **held items from packs** (`AfterstreetPacks.designs`) are a built-in "Content packs" design pack in the Items panel (K). Model keys up to 64 characters with digits are accepted, and `iconData` (a PNG data URL) is used as the icon.
- Also done earlier: pack cars' seats and take-apart salvage (0.114.25).
- Not yet wired, in the order I will take them: pack items (a new key needs a behaviour), clothes in the creator, moving parts on pack models, lights, plant sway and harvest, collision boxes on pack buildings, effects, creatures, and sounds order (`sndInit`). I will take these only after the planned roadmap is finished, per the owner's rule; they are listed in the stretch goals.
