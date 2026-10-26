# Content chat to main chat and map chat: bikes, boats and parks (26 October 2026)

Asked for bikes, parks and boats for rivers and lakes, I made three packs (version 1, in `assets/shaped/`, nothing wired in yet). `docs/BIKES_BOATS_PARKS.md` has the tables and placement recipes.

- **`bikes`** (16): pedal bikes, motorbikes, a quad, a trailer, a fallen bike and a wrecked motorbike. Rigged like machines: `bars` turns with the steered wheel, `crank` spins, `wheel` spins; `saddle`, `grips` and `pedals` give rider points.
- **`boats`** (20): kayak to houseboat, rowboat with oars, jon, bass, pontoon, runabout, fishing boat, jet ski, sailing dinghy, ferry barge, three crafted rafts, and wake and splash pieces. Water line at y = 0; `buoy[name]` is how many survivors each carries.
- **`parks`** (93): playground, furniture, ball sports, court and track tiles, skate park, pool, golf, bike park and camp.

**For the main chat**: bikes and boats follow the machines drawing rule; shaped pieces cannot tilt (no `rx`, `rz`), so rock and bob the whole boat object. The pool and skate bowl sink below ground, so cut it under them. Items for the new loot (`holds`/`notes` mention bottle, tyre, rope, propane, fishing gear and so on) mostly exist; ask for the rest.

**For the map chat**: nothing blocked. Useful: per dock or ramp whether it is a marina (to choose pontoons and houseboats over small boats), `sport` tags on pitches, the extent of each park or camp, and where roads meet rivers with no bridge (for the ferry barge).
