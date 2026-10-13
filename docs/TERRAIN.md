# How Afterstreet's ground and trees are laid out

From version 0.33 the ground is made in code. The textures are painted by `tools/paint_ground.py`, and the cover is worked out by
`buildCover()` and `plantTrees()` in `play.html` each time a map is loaded. Nothing from the old design-pack ground textures is used.
This page records the rules and where they come from, so they stay consistent as more is added.

## The ground layers

The terrain is mown grass with three layers painted over it, each by its own weight at every point of a grid laid over the map (half
the spacing of the height grid, so 10 m on most maps):

| Layer | Looks like | Where it grows |
| --- | --- | --- |
| Mown grass | Short, even lawn with clover and the odd daisy | Within about 25 m of houses, roads and car parks; parks and greens |
| Long grass | Tufts of green and straw-coloured grass with wild flowers in drifts | Further than about 25-95 m from anything built (blended over that band), meadows, fields, nature reserves, the band along a wood's edge, and the wet ground near water |
| Earth | Brown soil with leaf litter, twigs and pebbles | Under woods, the muddy strip right at a river bank, slopes too steep to hold much grass, and worn patches in yards |
| Rock | Weathered limestone plates with cracks and lichen | Steep slopes, and above all the bluffs along rivers |

Each layer shows first where its own picture is "high" (grass tufts, leaves, the tops of stones), so the line between two layers is ragged
like real ground rather than a smooth fade. A soft noise in the game's shader breaks up the even spacing of the grid.

The ground is also coloured: shaded under trees, lusher green near water, and drier and yellower on high ridges. Patches of each kind
come in clusters (smooth noise at about 170 m and 45 m), not evenly spread.

Through the year the whole ground shifts: fresh green in spring, drier in summer, gold and russet in autumn, and in winter snow lies on
level ground while steep slopes and rock stay bare.

## Trees

| Kind | Rule |
| --- | --- |
| Street trees | Along about six in ten residential and minor streets, on the verge beyond the pavement, every 13 m, the two sides alternating, none within 9 m of the end of a stretch (so junctions stay clear) |
| Yard trees | One or two per house, 5-12 m out from the house and at least about 5 m clear of any wall |
| Woods | A tree every 5 m or so where the wood is thick, thinning toward the edge over about 60 m, in clumps |
| Riverbanks | A broken line on each bank of rivers, streams and ponds, 5-17 m back from the water |
| Parks | Groves with open lawn between them, and a few trees standing alone |
| Fields and meadows | The odd lone tree |

From 0.38 the trees are Kenney's Nature Kit models, by habitat: oaks and maples on streets, maples, oaks, cedars and poplars in yards, oaks, sycamores and maples in parks, sycamores and poplars on riverbanks, oaks and cedars in fields, and pines and cedars where the woods are pine-oak. Oaks, maples, sycamores and poplars turn in autumn.

Every tree keeps a minimum distance from the next (4 m in woods, 8 m along streets), which is the idea behind Poisson-disk placement.
No tree stands in a road, a building or water. On a very large map each kind is thinned evenly, so the total stays light enough for a
phone (about 18,000 trees at most).

## The built-in Springfield region

The 50-mile Springfield region (from 0.34) carries the map pack's terrain-type grid, one cell every 79 m, read with soft edges so the cells
never show as squares. Each type sets how much of the ground is woodland, mown lawn, long grass, built-up, wet or rock, how many trees
grow per hectare, and how many of them are pines:

| Terrain type | Ground | Trees per hectare | Pines |
| --- | --- | --- | --- |
| Oak-hickory forest | Leaf litter | about 160 (in clumps) | few |
| Shortleaf pine-oak forest | Leaf litter, bluer shade | about 150 | most |
| Riverbank woods | Mud and long grass | about 120 | none |
| Scrub and old field | Long grass | about 45 | some |
| Orchard | Long grass and lawn | about 70 | none |
| Fescue pasture and hayfield | Long grass | lone trees | some (cedars) |
| Prairie and dolomite glade | Long grass with bare rock | a few | about half |
| Park lawn, cemetery, golf, campus | Mown lawn | 10-14 | few |
| Wetland | Wet long grass | about 12 | none |
| Quarry | Bare rock | none | none |
| Paved, industrial, rail yard | Worn ground | very few | none |

Woods are grown only for the 256 m tiles near you and dropped when you leave, so a whole region of woodland costs nothing until you are
in it; a tree you fell stays felled. Street, yard, park and riverbank trees follow the rules above, and street trees grow only where
there are buildings along the road.

## Sources

- Street trees at no more than 40 ft (12 m) apart, alternating rather than opposite, and kept 30 ft (9 m) from junctions:
  [Chester County Planning Commission, street trees](https://www.chescoplanning.org/Guides/ConservationSubdivision/04-StreetTrees.cfm).
- Forest edge effects reaching about 100 m into a wood:
  [UConn CLEAR, measuring forest fragmentation, edge width](https://media.clear.uconn.edu/projects/landscape/v2/forestfrag/measuring/edge_width.htm).
- Trees planted well away from a house's walls:
  [Laidback Gardener, how far should you plant a tree from a house](https://laidbackgardener.blog/2018/10/09/how-far-should-you-plant-a-tree-from-a-house/).
- Wooded strips along streams and rivers:
  [USDA NRCS riparian forest buffer fact sheet](https://www.nrcs.usda.gov/sites/default/files/2025-07/391_ND_GD_Riparian_Forest_Buffer-Fact_Sheet_2018.pdf).
- Limestone cliffs and bluffs along Missouri's rivers:
  [Missouri Department of Conservation, cliffs](https://mdc.mo.gov/discover-nature/habitats/cliffs-and-talus/cliffs).
- Poisson-disk placement: Robert Bridson,
  [Fast Poisson Disk Sampling in Arbitrary Dimensions](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf) (SIGGRAPH 2007).
- Mown grass near buildings and long grass further out, wet ground by water, dry ridges: general knowledge of Ozark small-city edges.
