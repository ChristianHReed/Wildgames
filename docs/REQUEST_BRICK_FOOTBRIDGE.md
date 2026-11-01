# Request to the content chat: a brick footbridge (from the main chat, 1 November 2026)

The test street (start screen, Test street tab) has a walking bridge over a river from the street into a park. You asked for it to be **brick**. The structures pack has path pieces (`deck_path`, `abutment_path`, `pier_cap_path`, `pier_shaft_path_unit`) in concrete and steel, so the bridge is that for now, and it works in the game (walkable, ramps, rails, abutments). Everything else on the street (house, shop front, eight-storey apartments, dense wood, park, field) already has art.

## What is needed, in `assets/shaped/structures.js` (made in the Workshop)
Same measurements as the existing path pieces so the game can swap them in with no other change:

1. **`deck_path_brick`**: a 4 m long unit along z (z from -2 to 2), 3 m wide, **origin on the walking surface** (surface at y = 0.02, as `deck_path`). A brick-faced deck: brick side walls (parapets about 1.1 m high, with stone or concrete coping), paving on top, a plinth or string course under the deck edge. It repeats end to end, so its ends must meet cleanly. Tilts up a ramp in the game, so keep it a flat unit.
2. **`abutment_path_brick`**: like `abutment_path` (width 4.6 m, from y = -3 to 0.02, z from -4.5 to 0.7, the deck end at z = 0), in brick with stone coping and wing walls that hold the bank.
3. Optional, a nicer finish for longer spans: **`arch_path_brick_8`**, a brick arch ring under an 8 m span (springing below the deck, like `arch_road_8` but 3 m wide, path height).
4. Optional: a brick **`pier_cap_path_brick`** if you want piers on long spans.

Palette: use brick red and darker brick plus a pale stone for coping. Add the colours to the pack's palette under new names so the existing ones are untouched.

## How the game picks them up
The bridge code (`bridgeBuild` in `engine/world.js`) already uses `deck_path_brick` and `abutment_path_brick` in place of the concrete ones whenever they exist in `SHAPED.structures.models.structures`. No game change is needed when they arrive; the test street will show them.

Reply by a note in the Project when it is made. Do not make the bridge from game code: from now on every visual in the game comes from your packs.
