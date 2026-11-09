# Season palettes and tree tint rules

For the main chat's "art from the visual reference" request (section B, C). Colours only; no models. The look follows the visual reference: one warm sun, blue-violet shade, pale blue distance, limited palette per scene, one accent colour. The existing tile seasons in `assets/shaped/ground.js` stay as they are; these rows are for the season and time-of-day tables in the game.

## Rows

Each row: `grass` (base / lit detail / shade), `leaf` (broadleaf crown: lit top / mid / under), `ground` (worn dirt / pale path), `sky` (top / horizon), `sun` (midday / golden hour), `shade` (cool shadow tint), `far` (colour distant hills fade toward).

| Season | grass base | grass lit | grass shade | leaf lit | leaf mid | leaf under | dirt | path | sky top | sky horizon | sun midday | sun golden | shade | far |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| spring | #6f9448 | #86ac52 | #4a6a50 | #8cb458 | #6a9444 | #3e6040 | #7a6248 | #9a8466 | #5f93c8 | #cfe0e6 | #fff1d2 | #ffc480 | #5a6a9a | #b6cadb |
| summer | #5f8a3e | #7aa04a | #3e5e44 | #7aa44a | #58803a | #36563a | #7a6248 | #a08a68 | #4e86c4 | #c6dce4 | #fff4d8 | #ffbc70 | #566690 | #aec6d8 |
| autumn | #8a8248 | #a89a52 | #5a5a4a | #d8902e | #c0602a | #7a3a26 | #7a5a40 | #98805e | #6a8ab8 | #e2d2bc | #ffe8c0 | #ffa860 | #62608a | #c4b8ae |
| winter | #7a8268 | #98a082 | #566078 | #9a9c88 | #7a7e6c | #4a5262 | #6a5a4a | #a09a90 | #8aa4c0 | #dce6ec | #f4f0e4 | #ffd0a0 | #6a78a4 | #c6d4e0 |
| dry summer | #a89c5a | #c4b468 | #6e6a50 | #8c9a4e | #6e8040 | #46583c | #8a6c48 | #b09a74 | #5a90c8 | #e2dcc2 | #fff0cc | #ffb868 | #6a6a90 | #cbc2a6 |
| desert | #b4a66a | #d0c07a | #7a7458 | #8c9468 | #6e7a52 | #4a5640 | #9a7a54 | #c4aa80 | #6a9ac8 | #f0e2c4 | #fff0d0 | #ffb060 | #766a90 | #d8c8a8 |

Accent colours (rare, to keep the eye moving): taxi/bus yellow `#d8b02c`, red car `#a8362c`, burning-barrel orange `#f08a28`, tarp blue `#4a6a8a`.

## Night

Not black: deep blue. Sky top `#10182c`, horizon `#26304a`, shade `#1a2240`, far `#2a3450`; warm pools from windows, lamps and fires `#f0c878` to `#f08a28`.

## Tree colour variety (no new models)

The broadleaf trees in `flora.js` colour the crown with three names per species: `<kind>1` (mid), `<kind>2` (dark, under) and `<kind>3` (light, lit top), and the fall set `<kind>F1..F3` (oak, maple, sycamore, poplar; `_fall` variants already exist). Trunks and branches use the `bark*` names. Pines (`pine1..3`) are darker than broadleaf trees and stay green.

Rules for the game:

1. **Tint by tree, in the vertex colour.** Hash the tree's position to a number; shift hue by up to ±6 degrees and brightness by up to ±8% on every piece whose colour is not a `bark*` name. Never touch the trunk.
2. **Lighter on top.** Keep the crown colours as authored (3 is lit top, 2 is shadowed under); the tint is applied on top of that so each tree keeps its lit-top, dark-under shape.
3. **A few out-of-season trees.** About one broadleaf in twelve takes the fall variant in summer and spring (yellow and orange among the green), and one in twelve of the fall trees stays green. Pines are never swapped.
4. **Clumps, not rows.** Place trees in groups with shrubs at their feet; a clump shares most of one hash so neighbours are close in colour, with one odd tree.

This needs no change in `flora.js`; if the main chat finds a species whose lit-top lobe is not colour 3, tell me and I will recolour it.

## Not included

Sky gradients per hour already live in `MOODK` in `play.html` (main chat). The rows above are meant to be blended into it: sun colour and shade colour are the two to adjust for golden hour (warmer sun, bluer shade).
