# Request to the Workshop chat: load vehicle damage looks only when needed (main chat, 3 November 2026)

## Why

Phones run out of memory before a map is even loaded. At the game's start screen the content packs take about 150 MB of JavaScript memory, and one file is most of it:

| `packs/workshop-crafts.js` (15.2 MB, 55 vehicles) | Size |
| --- | --- |
| `model.damage` (the ten damage looks of each vehicle) | 8.8 MB |
| `model.body` | 0.7 MB |
| `wreck` | 2.2 MB |
| `burnt` | 1.9 MB |
| `source` (the editable design, for the Workshop's "Open a remade vehicle") | 1.3 MB |
| everything else (rig, kit, interior, palette, functions, game, spec...) | under 0.3 MB |

The game only needs a vehicle's damage looks once that vehicle is first hit (`carDmgModel` in play.html builds them then), and it never uses `source` (since 0.114.93 it drops `source` after installing). Every phone still has to download, parse and keep all of it.

## What is asked

1. **Split the damage looks into their own file**, written by `test_crafts.js --pack` next to the pack: `packs/workshop-crafts.damage.js`, pushing `{format:'afterstreet-pack-damage', pack:'workshop-crafts', damage:{<asset id>:<model.damage>, ...}}` onto `window.AFTERSTREET_PACK_DAMAGE`. The main pack keeps `model.body`, `bonnet`, `boot`, `wheel`, `parts` and an empty or missing `model.damage`.
2. **Move `source` out of the game's pack** into a file the Workshop loads itself: `packs/workshop-crafts.source.js`. The Workshop's remade-vehicle library would read that.
3. **In `packs/packload.js`**, add `AfterstreetPacks.loadDamage(key, cb)`. It loads the damage file of the pack the vehicle came from (once, with a script tag, so it works over `file://`), puts each asset's looks into `SHAPED.props.models.vehicles[key].damage`, then calls `cb(true)`. It calls `cb(false)` if the file is missing.
4. **Keep `wreck` and `burnt` in the main pack.** The game builds those at map load for parked wrecks, so they are needed straight away.
5. The same rule for any other pack with damage looks (afterstreet-fleet, afterstreet-military), when you next rebuild them.

## What the main chat will do on its side

- `carDmgModel`: when a pack vehicle has no `damage` yet, ask `AfterstreetPacks.loadDamage` once, and show the undamaged look until it arrives (a fraction of a second; no change to how damage plays).
- Add the new files to the offline copy list in `sw.js`.

## How to tell it worked

- `packs/workshop-crafts.js` drops from about 15 MB to about 4.5 MB.
- The game's start screen in Chrome uses noticeably less JavaScript memory (the main chat will measure: about 150 MB today).
- A damaged Workshop car still shows its bent bumper, cracked windscreen, crumples, smoke and fire.
- Workshop: "Open a remade vehicle" still opens every design.
