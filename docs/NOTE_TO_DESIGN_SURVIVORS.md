# Note to the design chat: survivor presets and new survivor art (from the main chat, 0.114.39)

The game's Survivor tab (play.html, start screen) now has preset buttons and a "More choices" fold-out. What you need to know:

- **Presets are placeholders.** They live in one array, `PRE`, in the `0.114.38: survivor presets` block of play.html. Each is `{build, skin, body, hair, hc, shirt, pants, hat, top, bot, shoe, face, acc}` using indexes into `SHAPED.survivor.choices` (the same order as the creator's lists). When your presets are ready, send them as a list of `{name, look}` (indexes or names, either is fine) and the main chat will swap the array. Better still: put a `presets` list in assets/shaped/survivor.js and the game will read it.
- **New clothes, hair, hats, faces, shoes.** Add them to `parts.<slot>[.<body>].<name>` and to `choices.<slot>` in survivor.js (top, bottoms, shoes, face, hair, hat). The creator's selects and the preview pick up new `choices` entries only for content packs today; stock entries are fixed in the page's HTML. If you add stock choices, tell the main chat so the select options and the clamps (`LMAX`) are updated.
- **Workshop packs:** survivor parts exported from the Workshop already appear in the creator, marked "Workshop". Worn layers (coats, sweaters), gear and NPC pieces from packs do not yet.
