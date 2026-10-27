# New survivors: clothes and player characters (content chat, 27 October 2026)

Pack `packs/afterstreet-survivors.js`, built with the Workshop engine by `node workshop/tools/make_survivors.js` (51 parts, 8 looks, about 7,300 triangles). Every part sits on the survivor's own skeleton and uses the stock torso, arm and leg sizes, so it fits both bodies and all three builds. Parts use the creator colour slots (SKIN, HAIR, SHIRT, PANTS, ACC and their _D shades) plus a few fixed colours.

| Slot | New names |
| --- | --- |
| top (both bodies) | tank_top, polo_shirt, henley, fleece_vest, cardigan, scrubs |
| bottoms (both bodies) | skirt, leggings, cargo_shorts, work_pants |
| worn (both bodies) | duster, parka, apron, hi_vis_vest |
| shoes | sandals, work_boots, high_tops |
| hair | long_hair, ponytail, mohawk, curly, braids, top_knot |
| hat | bucket_hat, bandana, hard_hat, flat_cap, headband |
| face | eyepatch, bandaged, goggles, respirator, war_paint |
| gear | tool_belt, bandolier, shoulder_bag, hip_pack |

## Ready-made characters (player looks and recruitable survivors)
`survivor.npcLooks` gains: fixer, courier, hiker, scavenger, nurse, wanderer, foreman, librarian. Same fields as the stock looks (body, build, skin, hairColour, hair, hat, face, top, bottoms, shoes, shirt, pants, acc, worn, npc, note), plus `gear` (list of gear names). Skin uses 1 to 4 and hairColour 0 to 4 as the stock looks do.

## What the loader does (`packs/packload.js`)
- A survivor part installs at `survivor.parts[slot][body][name]` and its name is **added to `survivor.choices[slot]`**, so the creator offers it with no game change.
- A pack asset of type `look` installs into `survivor.npcLooks`; `AfterstreetPacks.looks` lists them.
- Path-installed parts also take `extra` entries by full path.

## For the main chat
- Draw `gear` for looks the way the creator draws gear.
- Hair parts marked `hat: 'hide'` hide under hats as before.
- The creator's menus read `survivor.choices`; check it handles longer lists (tops 14, hair 12, hats 9, faces 13, gear 7).
