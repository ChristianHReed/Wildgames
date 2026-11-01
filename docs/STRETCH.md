# Afterstreet stretch goals

Ideas that are not in the build plan (docs/ROADMAP.md, "Next versions"). Nothing here gets built until the planned work is finished. New ideas that come up while building are added here, not to the roadmap.

- Whole roadside buildings as landmarks with collision (diner, motel, drive-in, water tower, grain elevator, mobile homes, cabins from the roadside pack). The map does not mark most of them, so they need a rule for where they go.
- Farm drive, mailbox at the road, cattle guards and pasture troughs.
- Workshop: build a design in the game at a garage by filling in a ghost of it with found parts, like Space Engineers' projector (designs copy freely, the parts must be found).
- Workshop: panels, bumpers and doors that break off piece by piece in crashes (Trailmakers), from the materials each Workshop piece already records.
- Workshop: wiring and logic for vehicles (Stormworks): switches, lights, winches.
- Workshop: a pose sweep that checks clothes never poke through the body at any build or clip frame; a second paint slot for trims.
- Workshop: NPC looks edited as named bundles (old_ranger, medic) in the Workshop; copying a garment between the masculine and feminine bodies with automatic refit.
- Workshop: wiring building modules together on a grid in the Workshop (whole buildings from modules), tile edge sockets that check neighbours.

## From the Workshop's W1 to W15 hand-off (27 October)
Game-side wiring still to do, after the planned roadmap: pack items (new keys need behaviour), moving parts and hinged doors on pack models, lights (colour, reach), plant sway and harvest, collision boxes for pack buildings and structures, particle effects (`AfterstreetPacks.effects`), creatures (bones, clips, drops), sounds installed before `sndInit`, packs picked on a device (IndexedDB), guests' pack cars sent to the host, pack-car headlights and build cost.

## Animals, next (from 0.114.34)
Boars, wolves and bears that attack; birds that fly and perch; fish and fishing; farm animals on farmland; a knife item (butchering is axe, crowbar, toolkit or bare hands for now); hide crafting (clothes, bags); bones and fat uses; animals synced to guests; wolves hunting the player at night.

- Waterways pack in the real map: choose the bank piece from the data (bend inside or outside, town or country) per the guide's table, fit banks to the terrain, flow scrolling. Only the test street has it now (waterwaysBuild in engine/world.js).

- Voxel ground on real maps: needs 1 to 2 m height columns near the player and coarser ones far off (LOD), terrace-aware road and building seating, and a step-up rule for vehicles. Switch on with ?voxel to try it now.
- Roads and buildings on voxel hills: roads on the test sheet follow the ground smoothly while the ground is stepped; make the road surface stepped too if the mismatch shows.
