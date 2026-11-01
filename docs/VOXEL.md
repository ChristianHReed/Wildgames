# Afterstreet voxel engine: the base (draft, 1 November 2026)

## Decisions so far (from the owner)
- **One block size: 0.5 m** for everything made of cells (same as the digging blocks). Chunks are 16 x 16 x 16 cells (8 m).
- **What is cells:** ground, water, building shells (walls, floors, roofs, roads). Props, vehicles, boats, people and trees stay voxel models that snap to the grid.
- **Water:** still blocks with a surface level, and a visible flow direction that also pushes boats and swimmers.
- **Materials control:** dig and break, walking and driving, fire / wet / weather, strength and falling.
- **Language:** stay JavaScript for now; build the voxel core as a clean module (`engine/voxel.js`, no page code) so meshing and generation can move to Rust/WebAssembly later if the frame rate needs it.

## What exists
- `engine/voxel.js`: the material table (one place that says what a block is: dig seconds and tool, walking speed, loudness, burns, wets, dries, how far it can span without ground, falls), the world (chunked byte grid), walking collision with one-block step-up and swimming, a ray for looking and digging, a tick (rain makes mud, fire spreads and leaves ash, sand and gravel fall, built blocks with no ground within reach fall), and a mesher that draws only visible faces into a solid mesh and a transparent mesh (water, glass).
- `voxel.html` (the voxel lab, linked from the Test sheet panel): a small world (128 m square) with a river in a real channel, a gorge, a steep hill, a road, a brick house with glass, a wooden bridge and a wooden tower. Walk (stick or WASD), dig with the right tool, place blocks, light things, turn on rain, and edit the material table live.
- Checked in node: walking drops onto the ground and wades the river without falling through its sides; a wooden tower burns to ash; rain makes mud; the whole test world meshes in about 0.2 s (215,000 triangles).

## Open questions
- How the 0.5 m grid maps onto OpenStreetMap data (the height grid is 10 to 20 m on real maps): sample the DEM and fill columns near the player, coarser far away (LOD with seams).
- Roads and sunk kerbs as cells: asphalt blocks, kerb face one block high (12 in is 0.3 m, a block is 0.5 m: use 0.5 m kerbs or a half-block).
- Buildings: stamp each footprint's walls, floors and roof into cells at load, or keep the framed pieces and add a collision layer.
- Memory: 128 m square is 6 MB; a 5.5 km Springfield square cannot be dense. Chunks only near the player, stored sparse, generated from map data on demand.
- Snapping and moving together: boats, cars and carried props use a grid position plus a small offset; how they rest on cells (waterline, kerb).
- Network: the grid edits are a small list of cell changes, like the dig list the game already syncs.
