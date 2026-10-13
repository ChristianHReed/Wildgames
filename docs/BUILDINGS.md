# How Afterstreet's buildings are designed

From version 0.32, every building on the map is made in code (`play.html`, `bstyle()` and `shell()`), with a texture painted in code
by `tools/paint_buildings.py`. Nothing from the old facade kit or facade textures is left. This page records what each type is based on,
so the look can be kept consistent as more is added.

## The rules every building follows

- **Bays.** A wall is laid out in 4 m bays centred on the windows you can open. Each bay of each storey is one painted tile, so the window
  you see is exactly where the window you can climb through is. Short stretches at the ends of a wall get a plain tile of the same material.
- **Storeys.** The ground storey uses the height that suits the use (3.2 m for homes, 4 m or more for shops and halls); upper storeys are 3.2 m.
- **Colour.** Wall materials are painted almost white and coloured per building from a small palette for that material (siding, red brick,
  buff brick, stucco, concrete, corrugated metal, stone, pale panels). Glass, frames, doors and signs keep their own colours. Roofs are
  coloured the same way (shingle, flat membrane, standing-seam metal). Map data that gives a building's colour still wins.
- **Night.** About half of the windows light up after dark, picked per window.
- **Trims.** Town fronts get a cornice along the top and, over shops, a belt course between the shop and the floor above. Homes get a
  front porch (roof, two posts and a step). Shops keep their awnings.

## What game artists do, and how Afterstreet now does it (0.38)

Studied before rebuilding: Joel Burgess's GDC talks on Skyrim's and Fallout 4's modular kits, the Level Design Book's pages on modular kits
and massing, and articles on facade design and stylised environment art (sources below). The lessons, and what changed:

| Lesson | Afterstreet |
| --- | --- |
| **Lock the kit's measurements first.** One grid, one door size, one storey height, so every piece fits every other (Burgess). | Kept: 4 m bays, 3.2 m storeys, a 1.3 m door. The window you can open is always the painted one (flats now open the left of the pair). |
| **Walls have thickness.** Paper-thin walls read as cardboard and cause clipping (Level Design Book, massing). | Every ground-floor window is a real opening with a reveal: the wall returns 16 cm into the building round the glass, and has a sill under it. |
| **Base, middle, top.** A facade reads well when it has a distinct bottom, body and crown (Whitsitt). | Base: a plinth of foundation along every wall, broken at the door. Middle: the painted storeys. Top: eaves, fascia and soffit on pitched roofs, a coping on every parapet, a fascia band on small flat roofs, cornices on town fronts. |
| **Break up flat planes and turn the corners.** Large unbroken masses lose human scale (Level Design Book, scale). | Corners get trim: white boards on sided houses, pilasters in the wall colour on brick and stone, flashing on sheds. |
| **Keep the big moves simple, put the effort where people stand.** Entrances, canopies and ground-floor windows are seen close up (Whitsitt). | Door casings on every non-house entrance, canopies on posts over glass lobbies, the porch on homes and awnings on shops kept. |
| **Vary the silhouette and avoid copy-paste.** Repeated architecture tires the eye less than repeated detail, but rooflines are what you see from afar (Burgess; 80.lv). | About half the plain rectangular houses get a gable roof (ridge, barge boards, gable ends in the house's siding) instead of a hip; hip roofs reach 45 cm past the walls; small one-storey shops get a false front with a raised centre step, the classic small-town Main Street shape. |
| **Spend triangles where they show.** | Trims are drawn as only their visible faces; outer buildings use the simple far shapes. A building near you averages about 1,150 triangles (about 690 before). |

## Types

| Game type | Based on | Ground floor (front) | Other walls and upper floors | Roof |
| --- | --- | --- | --- | --- |
| Home | Lap-sided or brick single-family houses: trimmed sash windows, shutters on many, a front porch | Siding or brick with windows | Same | Pitched, shingles |
| Apartment block | Walk-up brick or sided blocks with paired windows and a cornice | Paired windows | Paired windows | Flat |
| Shop, restaurant, bar, clothes, electronics | One- and two-part commercial blocks (Longstreth): a glazed shopfront with kickplate and transom under a sign band and belt course, a brick upper storey with tall windows, a cornice | Shopfront | Brick with windows; upper storey with paired tall windows | Flat |
| Grocery, hardware, outdoors, gas station | One-part commercial block: a single tall storey with a wide shopfront and a parapet | Shopfront | Stucco with windows | Flat |
| Office | Older offices: two-part commercial blocks in brick. Newer: a glass lobby under ribbon windows in concrete | Shopfront or glass lobby (8 m either side of the door) | Brick windows or ribbon windows | Flat |
| Bank, library, event hall | Temple-front and enframed blocks: a rusticated stone base and tall arched windows | Stone base (10 m either side of the door) | Stone with arched windows | Flat |
| Church | Clapboard or stone churches with tall arched windows and a steeple | Arched windows | Same | Pitched where the plan allows, steeple |
| School | Long, low brick schools with wide banks of classroom windows | Window bands | Same | Flat |
| Clinic, hospital | Pale panelled medical buildings with horizontal windows and a glazed entrance | Glass lobby (8 m) | Panels with long windows | Flat |
| Police station | Buff brick with a stone entrance | Stone base | Brick windows | Flat |
| Fire station | Brick station with red-framed sectional bay doors | Bay doors (9 m either side of the door) | Brick windows | Flat |
| Warehouse, garage | Corrugated metal sheds with roll-up doors and high strip windows | Roll-up doors (6 m either side of the door) | Metal with windows; high strip windows above | Metal |
| Gym | Metal-clad hall with a glass entrance | Glass lobby | High strip windows | Metal |
| Parking garage | Open concrete decks | Deck openings | Same | Flat |

## Sources

- Joel Burgess, "Skyrim's Modular Approach to Level Design" (GDC 2013): [Game Developer write-up](https://gamedeveloper.com/design/skyrim-s-modular-approach-to-level-design) and [slides](https://www.slideshare.net/slideshow/gdc2013-kit-buildingfinal/17728576).
- [80.lv, Building huge open worlds: modularity, kits and art fatigue](https://80.lv/articles/building-huge-open-worlds-modularity-kits-art-fatigue).
- The Level Design Book: [modular kits](https://book.leveldesignbook.com/process/blockout/metrics/modular) and [massing](https://book.leveldesignbook.com/process/blockout/massing).
- Brendan Whitsitt, [Three rules for great facade design](https://brendanwhitsitt.substack.com/p/17-three-rules-for-great-facade-design).
- [80.lv, Stylized production tips and tricks](https://80.lv/articles/stylized-production-tips-and-tricks).

- Commercial building types (one-part and two-part commercial blocks, enframed window wall, temple front, vertical blocks):
  Richard Longstreth, *The Buildings of Main Street*, as summarised by the Texas Historical Commission,
  [Commercial Architecture survey guide](https://www.thc.texas.gov/public/upload/preserve/survey/survey/Commercial%20Architecture.pdf), and
  [City of Brunswick, commercial buildings preservation guide](https://www.brunswickga.org/sites/default/files/fileattachments/planning_development_and_codes/page/12409/commercial_buildings_-_preservation_and_maintenance.pdf).
- The parts of a historic shopfront (kickplate, display window, transom, sign band, cornice): the same Brunswick guide.
- Homes, schools, civic and industrial buildings: general knowledge of American small-city building types.
