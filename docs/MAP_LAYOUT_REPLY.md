# Map chat reply: layout rules from the visual reference

From the map chat, 8 November 2026, to the main chat's request "layout rules from the visual reference" (`docs/VISUAL_REFERENCE.md`, "Third look"). This page is the running reply: it says which of the nine steps are done, with the builder version, and what data the game needs. It is updated as each step ships.

Pulled and read the builder-downloads note (0.114.92) too: no conflicts, nothing needed from me.

## Where each step stands

| Step | What | State | Builder |
| --- | --- | --- | --- |
| 1 | Street cross-sections by road class; trees, poles, lamps, mailboxes, benches, bins and meters in their bands | **Done** | 1.24.0 |
| 2 | Power poles with wire end points | **Done** | 1.24.0 |
| 3 | Lot fill: driveways for real houses, fences, back-yard items | Next | planned 1.25 |
| 6 | Roof units on flat roofs | Next, with step 3 | planned 1.25 |
| 4 | Town rings (height, setback, roof and lot width by distance to the centre) | After | planned 1.26 |
| 5 | Roadside pattern (parking to the front, kerb cuts, pole sign, service side) | After | planned 1.26 |
| 7 | One tall landmark per square | After | planned 1.26 |
| 8 | Forest edges and tree rows | After | planned 1.27 |
| 9 | Abandoned traffic, big vehicles, camps and roadblocks | After | planned 1.28 |

## 1.24.0: what the map now carries

**Road tags** on every road way of class primary, secondary, tertiary, residential, unclassified or living street (not bridges or tunnels):

| Tag | Values | Meaning |
| --- | --- | --- |
| `asmb:street` | `main`, `town`, `suburb`, `rural` | The class the way spends most of its length in (decided by how much of the ground within 60 m is built on, how close the building fronts are to the road, and whether they are shops) |
| `asmb:kerb` | `yes`, `no` | Kerb or soft shoulder |
| `asmb:verge` | metres | Grass strip: main 0, town 1.5, suburb 2.5, rural 4 |
| `asmb:walk` | metres | Pavement width: main 4, town 1.75, suburb 1.35, rural 0 (an OpenStreetMap `sidewalk=no` makes it 0; `sidewalk=both/left/right` on a rural road makes it 1.5) |
| `asmb:shoulder` | metres | Gravel shoulder, rural only (1.2) |

Order across the road from the centre: carriageway, kerb (0.25 m) or shoulder, verge, pavement, building setback. A long way that changes character (a main road leaving town) carries one class; the furniture along it is placed by the class at each point, so the tags are the average and the props are exact.

**Points.** All are marked `generated=yes`, `asmb:made=yes`, and `asmb:band` (`verge` or `pavement`).

| Item | Tags | Where, how often |
| --- | --- | --- |
| Street tree | `natural=tree` | Verge centre; town about every 26 m per side, suburb 30, main street in pavement pits every 34 m where the pavement is 3 m or more; none on rural roads yet (step 8) |
| Power pole | `asmb:prop=street.power_pole`, `power=pole`, `asmb:wire=<lon>,<lat>` | One side of the road (chosen per road), every 35 to 45 m, in the verge; none on city-centre main streets; the wire goes to the next pole of the same run (so the last pole of a run has none) |
| Street lamp | `asmb:prop=street.street_lamp` | Main and town streets both sides (staggered), suburb one side, none on rural roads |
| Bench and bin | `asmb:prop=street.bench`, `street.trash_bin` | Main street pavements, every 40 to 70 m |
| Parking meter | `asmb:prop=street.parking_meter` | Main street, one side, every 20 m, on primary, secondary and tertiary roads |
| Mailbox | `asmb:prop=street.mailbox` | At the verge edge in front of about four in five houses on suburb and town streets, beside the driveway side |

Each prop point has `asmb:yaw`, the direction it faces in **degrees as atan2(east, south)** of the facing vector in the game's metre space (0 faces south, 90 faces east), and `asmb:ry`, the same turned to a quarter turn for older readers. Lamps and benches face the road; mailboxes face the road; poles line up along it.

Nothing is added within 7 m (trees), 12 m (lamps), 24 m (poles) or 14 m (mailboxes) of a mapped or already placed item of the same kind, and nothing goes inside a building or onto another road. Real OpenStreetMap data always wins. Springfield test map (5 squares): 22,000 poles (17,000 wired), 20,000 lamps, 22,000 mailboxes, 36,000 street trees, 600 benches and bins, 300 meters.

## What the game needs to do with it

1. **Read the road tags** (they must pass your `keepTags`) and draw the kerb, verge, pavement and shoulder from the widths.
2. **Read `asmb:prop` points** (roadmap 0.120), with `asmb:yaw` when present. `power=pole` points with `asmb:wire` give the wires: draw a sagging line from each pole to the `asmb:wire` point.
3. **Skip your own dressing** of the same kind where the map has these (`asmb:band` is on every one): your poles, mailboxes and street lamps from `placeDress` would otherwise stand beside the map's. A square that has any `asmb:band` pole could turn your pole rule off for that square.
4. **A bug to guard:** `engine/buildings.js:765` reads `mapSrc` with no `typeof` guard, so any host page that does not define it (the builder's 3D view) failed with "mapSrc is not defined". The builder's `host.js` now defines `var mapSrc = null;`, which fixes the builder, but the engine should guard it as `world.js` does.

## Limits, for honesty

- Classes are judged from the buildings in the data. In the Springfield test map most buildings near streets are made-up homes with a fixed setback, so most streets come out `suburb`; the town rings (step 4) will give the made-up homes a setback by the ring and the classes will follow.
- The builder's 3D view draws only the props within about 260 m of the camera (a built street carries tens of thousands).
- Not placed yet: tall grass on rural shoulders, trees on rural roads, hydrants, bus stops, signs (the game places its own).
