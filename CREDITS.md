# Credits

- **Map data:** © OpenStreetMap contributors, Open Database License.
- **Furniture, cars and street props:** KayKit Furniture Bits 1.0 and KayKit City Builder Bits 1.0 by Kay Lousberg (www.kaylousberg.com), CC0. Converted and recoloured by `tools/build_models.py`.
- **Textures, icons and interface design:** the Afterstreet design pack in `design/afterstreet_handoff/`.
- **Elevation:** Terrain Tiles hosted on AWS Open Data (Terrarium format, assembled by Mapzen from sources including USGS 3DEP and SRTM), downloaded by the game when a map is made.
- **Alien models:** the Imp and Puglin from "Bestiary - Dungeon Monsters Kit" (free standard version) by Quaternius (quaternius.com), under the Quaternius Asset License: free to use in games with no credit required; the pack itself may not be redistributed, so it is not in this repo. `tools/build_creatures.py` simplifies the models and bakes the poses the game uses.
- **Building fronts and roofs:** original, made in code by `tools/paint_buildings.py` and `play.html`; see `docs/BUILDINGS.md` for the references.
- **Survivors:** the skeleton of "Universal Base Characters" (free standard version), moved by clips from "Universal Animation Library" and "Universal Animation Library 2" (free standard versions), both by Quaternius (quaternius.com), CC0. The low-poly bodies, hair and hats are original, built on that skeleton by `tools/build_people.py` (the pack's own bodies can still be used with its `pack` option), and baked into poses; the packs themselves are not copied here. Faces, clothes and hair textures are original, painted in code by `tools/paint_people.py`.
- **Furniture:** kitchen, bathroom, bedroom, office and storage pieces from Kenney's "Furniture Kit" (kenney.nl), CC0, added to `tools/build_models.py`.
- **Sound:** footsteps, impacts, glass, doors, cloth and metal from Kenney's "Impact Sounds" and "RPG Audio" (kenney.nl), CC0, packed by `tools/build_sounds.py`. Gunfire, alien calls, rain, wind and thunder are made by the game.
- **Trees and plants:** tree, bush, grass, flower, fern and rock models and eight textures from the "Stylized Nature MegaKit" (free standard version) by Quaternius (quaternius.com), CC0. Converted by `tools/build_nature.py`; the pack itself is not in this repo.
