# packs

Content packs: things players make and share between copies of the game. Each pack is one `.js` file in this folder that loads from a drive with a script tag (`window.AFTERSTREET_PACKS`). The format and how the game and the Maps Builder load packs are in [docs/WORKSHOP.md](../docs/WORKSHOP.md).

- **Make a pack** in the AfterStreet Workshop (`workshop.html`): Export pack.
- **Use a pack**: put the file here and add its name (without `.js`) to `index.js`.
- `packload.js` is the loader the game and the Maps Builder share; `workshop-sample.js` is the sample (the Ozark Rambler wagon, built from Workshop shapes only; `node workshop/tools/make_sample.js` rebuilds it).

Packs so far hold vehicles and prefabs. Items, building redesigns, alien types and scenarios (docs/DESIGN.md) will use the same file.
