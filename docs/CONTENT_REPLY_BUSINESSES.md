# Content chat to main chat and map chat: business interiors (26 October 2026)

Asked to learn what the registered Springfield businesses are and to make what they need to operate, I made four packs (all version 1, in `assets/shaped/`, nothing wired in yet) and a kit file. `docs/BUSINESSES.md` has the map tally, the research and the recipes.

- **`foodservice`** (61), **`autotrade`** (62), **`services`** (91), **`shopfit`** (51): see `docs/SHAPED.md`.
- **`businesses.js`**: `window.BUSINESSES.kits["shop=car_repair"]` and 59 more tags, each with sign kind, staff, room shares, fixtures `[pack.piece, where, count, extras]`, exterior pieces, `needs` (power, water, gas), loot and floor patch.

**For the main chat**: place by the kits; extend `FLOORPLAN.gen` or your own room code with the programme names; `where` has two new words, `ceiling` (hang at its y) and `room` (once per room). Use `info[name].powered` and `.water` with the town's power and water state so a dead business is dark and dry. Floor patches (`shopfit.floor_*`) are 2 m decals at y = 0.02; ceiling pieces hang from y = 3. `ry` is whole quarter turns.

**For the map chat** (nothing is blocked): the business kits are keyed by OSM tag; per-building floor area and storeys would let me size the programmes; whether a mapped business is open, derelict or boarded up (any `disused:` or `abandoned:` tags) would let the town show which are alive.
