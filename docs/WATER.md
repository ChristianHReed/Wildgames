# Water and dug ground

How other games do it (researched 1 Nov 2026): Minecraft, Terraria and DwarfCorp keep a **water level per cell** and run a few local rules each tick on only the cells that hold water: (1) fall if the cell below has room, (2) spread sideways to lower neighbours, (3) evaporate below a threshold. DwarfCorp's write-up (gamedeveloper.com, "How water works in DwarfCorp") adds that the water surface is a separate mesh built by averaging neighbouring cell heights, with shader waves, shore bands and splashes on top, and no pressure model. Heightfield games use "virtual pipes" (shallow water equations): each cell stores a depth and pushes water to neighbours in proportion to the surface difference.

What Afterstreet does (0.114.54, `engine/dig.js`): dug ground is already 0.5 m columns. A dug column beside open water and lower than its surface fills to that surface (`DGL`), and the water spreads on through any dug column lower than it, a ring at a time. Filling a column with soil removes its water. Pits away from water still hold groundwater at the old water-table depth.

Added 0.114.57: water rises 0.25 m per tick, drains when cut off from the river, and the river carries swimmers and boats downstream.

Not done yet (docs/STRETCH.md): water running downhill over undug ground, boats and swimming in dug channels, the river itself as a deformable surface.
