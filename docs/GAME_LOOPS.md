# Game loops by mode (decided 4 November 2026, from the owner's answers)

Step 1 is built (0.116.0): the new-world difficulty settings (alien pressure, nest push-back, survivors can die for good) and the Endless settlement meter. Step 2 is built (0.119.0): see "Endless as built" below. Steps 3 to 5 are not built. Build order is at the end. "Base can be lost" is held back until the raids on the settlement exist (step 2), since it has nothing to act on yet. Stretch goals paired with each mode are in docs/STRETCH.md.

## Endless: build a settlement
Loop: scavenge by day, fortify and grow by night, survive the raids.
- **Goal:** population targets (5, 10, 20 survivors) and self-sufficiency. No win screen; milestones are announced and unlock things.
- **Population:** rescued survivors join the safe house. Each has needs (food, water, rest, safety), a skill and a job (guard, farmer, medic, scavenger, builder). More people need more of everything.
- **Self-sufficiency:** farm (garden plots), clean water, power (generators and fuel), medicine. A settlement that makes more than it uses stops needing runs; a short one slowly loses people.
- **Pressure:** raids on the base grow with the settlement (walls, lights, guards matter).
- **Needs from the game:** a settlement meter (people, food, water, power, safety) shown in the base; survivor jobs that already exist (`world.surv`, `job`) extended; milestone toasts.

## Endless as built (0.119.0)
- **Needs:** every survivor has hunger (a meal from the supply chest), thirst (the taps at the base while they run, else a bottle from the chest, or from your pack while following) and spirits. Spirits drop when hungry, thirsty, badly hurt, short of beds, unsafe or during a raid, and rise when the settlement feeds itself. Very low spirits for a while and they leave, saying why.
- **Beds:** the safe house sleeps two; each bed you build in the base sleeps two more (they sleep in shifts). Shown as Beds in the settlement panel.
- **Jobs:** guard, gardener, scavenger, builder, cook (now also boils dirty water in the chest, 1 wood for up to 3 bottles), and the new medic (patches up hurt people at the base, you included, with bandages and kits from the chest). Each person has a skill; working at it is half as fast again, and good spirits add a little more.
- **Newcomers:** each dawn from the second day, one person (two if the settlement feeds itself) comes to the gate if there is food and water for them. Let them in (E) and they start at the job they are good at. Unanswered, they move on the next dawn. Followers are capped at three; people at the base are not.
- **Milestones:** 5 survivors: scavengers bring back half as much again. 10: guards hit harder and watch 18 m out. 20: gardeners bring in twice the harvest.
- **Raids:** some nights from the second (more likely as it grows), a pack comes for the settlement from one side, bigger as it grows (swarmers, plus stalkers, clingers, a spitter from day 4 at 5 people, a giant from day 5 at 6). Raiders come over the fence; walls, guards and you hold them. Everyone but guards and the medic hides in the safe house. Raiders at the supply chest destroy food and water. They pull back at dawn.
- **Base can be lost** (new-world setting, off by default): if three or more raiders are inside with no guard standing and you are away for 45 seconds, the base is overrun: people scatter to houses in the town (find and bring them back) and half the chest is lost.

## Reclaim: take the city back, zone by zone
Loop: scout a zone, prepare, raid its nests, hold it, move on.
- **Zones:** the map is cut into named zones (neighbourhoods from the map data where it has them, else a grid). A zone is cleared when its nests are gone. A cleared zone has no spawns, its loot refills, and it can hold an outpost.
- **Win:** every zone cleared (the old rule, every nest destroyed, still ends it).
- **Siege:** nests have defences (guards round them, a burst of aliens when attacked, an alarm that draws nearby aliens). Breaking one takes prepared one-use tools (explosives, fire, barricades, ammo) crafted and carried in.
- **Nests fight back, set by difficulty (all three offered in the new-world settings):**
  - Gentle: a nest slowly sends a few more aliens each day.
  - Steady: nests grow stronger each day and raid your base after day 3.
  - Brutal: uncleared nests spread to new buildings and spawn new alien types.
- **Needs from the game:** zone list and progress on the map, nest defence and alarm behaviour, the one-use siege items, a difficulty option.

## Escape: fly out in 7 days (best played together)
Loop: gear up at home, meet up, cross the city, restore the airport, hold the runway, fly out.
- **Start:** each friend starts at their own house, chosen by typing an address (must be inside the loaded map). Solo, you start at your own house.
- **Clock:** 7 days from the start.
- **Stage 1, get there:** meet up and reach the airport.
- **Stage 2, get it working:** restore power and fuel at the airport, then call in the plane and defend the runway until it lands; board it to leave.
- **Day 7:** a last-chance push: a huge alien surge, but the plane can still land if you hold out.
- **No airport on the map:** use another exit (helipad, harbour or road evacuation point) with the same two stages.
- **Needs from the game:** spawning each player at their own address, an airport (or other exit) detected in the map data, the two-stage objective, the 7-day clock and surge, an evacuation scene (aircraft are not drawable or flyable yet, so the plane lands and boards as a scripted event first).

## Together (multiplayer)
- **Shared base:** whoever hosts the map picks the base.
- **Harder world:** more and tougher aliens scaled to the number of players.
- **Otherwise the same loop as solo.**

## Answered after the first pass
- **Escape plane:** carries everyone, no limit; the run ends when all living players are aboard.
- **Reclaim zones:** about 500 m squares in a grid; zones at the map edge are simply smaller.
- **Endless survivor death:** a difficulty setting on a new world (permanent death on or off).
- **Endless losing the base:** a difficulty setting on a new world (base can be overrun on or off).

## Difficulty settings on a new world (collected)
Nest push-back (Gentle, Steady, Brutal), permanent survivor death, base can be lost, homes with weapons (already in Settings).

## Suggested build order
1. Difficulty settings on a new world (alien pressure, nest push-back) and the settlement meter for Endless.
2. Survivor needs and jobs, population milestones, self-sufficiency (Endless).
3. Zones and nest defences, siege items (Reclaim).
4. Escape: address spawn for each player, airport or other exit, two-stage objective, 7-day clock and surge.
5. Together: base picked by host, scaling.
