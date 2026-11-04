# Loot: what is inside things (0.115.0)

Code: `engine/loot.js` (data and rules), `rollStash` and `loot()` in `play.html`, the editor in Settings, "What is inside things (loot)".

## The idea
What you find comes from **what you search** and **where it is**, not from one table per building.

- A bin: scraps and rubbish (rotten food in a restaurant or grocery bin, a spare bandage in a clinic bin).
- A medicine cabinet: bandages, medkits, antibiotics; three searches and little "nothing" in a hospital or clinic.
- Shelves, crates, lockers, racks, tills, gun lockers, tool benches, fridges, cupboards: each has a table per kind of building (a crate in a warehouse is scrap, wood, fuel; in an outfitter it is arrows, shells and lanterns; in a fire station it is medicine, an axe and flares).
- Cars: a plain car has a boot of spares; an army vehicle carries rounds, shells, the carbine, a flare gun and field medicine; police cars carry rounds and a torch; ambulances carry medicine; fire engines carry axes, helmets and flares; work trucks carry tools.
- Open-air supply stashes use the kind of place they belong to.

Table format: `LOOTDEF[thing] = {n, cust, s:{scope:{item:weight}}}`. Scopes: `any`, `k:<building kind or vehicle kind>`, `h:<household type>`. `_n` inside a table sets the number of searches. Items are keys of `ITEMS` or the street weapons (`st-axe`, `st-crowbar`, `st-wrench`, `st-cricket-bat`, `st-frying-pan`, `st-hockey-stick`, `st-garden-rake`, `st-broom-spear`, `st-umbrella`). Anything the game has no table for still uses the old building tables.

## Which homes keep weapons
Each house, apartment and garage is given a household once (from its id): none, defence, hunter, woodsman, handyman or sporty. Weapons and their matching rounds then turn up in the right places in that home only: a revolver and pistol rounds in the nightstand; a hunting rifle, double-barrel and rounds in the wardrobe; axes, arrows and bolts in the crates; a crowbar and wrench on the bench; bats and sticks for a sporty home. Homes with no weapon still have a frying pan in the cupboard, an umbrella in the wardrobe, a rake in the store room.

- City homes (dense: many buildings within 90 m) are less likely to keep weapons, and those that do lean to pistols.
- Homes on the **north side of town** (the north 36% of the map) are exempt from that and more likely to keep weapons, with more hunters and woodsmen. Settings can turn this off.
- Settings: "Homes with weapons" None, Few, Normal, Many.
- Springfield check: about 60% of north-side houses keep a weapon, about 27% in the middle, about 24% in the dense centre.

## Settings editor
Pick a thing, a place, then change weights (a bigger weight turns up more; the percent beside it shows the share), remove or add items, set searches per opening, add another place for that thing, put one list or everything back. Kept in this browser (`lastblock:lootdef`, `lastblock:lootcfg`) and used for your own searches.

## Not done yet
- The Workshop's army weapons (assault rifle, battle rifle, sniper, SMG, light machine gun, combat shotgun, service pistol, combat knife, machete, grenade, rocket launcher) are models only; the game has no stats for them, so army vehicles carry the game's carbine, rifle rounds, shotgun and flare gun. When those guns exist, add them to `trunk` `k:military` and the police gun locker.
- Street dumpsters cannot be searched yet.
