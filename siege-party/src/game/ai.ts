import { BUILDINGS, GOODS, TECHS, UNITS, canAfford, central, type BuildingKind, type TechKind, type UnitKind } from "./content";
import { IDS, ageOf, aiTryBuild, allied, armyCap, armyUsed, canReachNode, enlarge, hallOf, quote, techBlock, trade, hasComplete, orderGather, popCap, popUsed, research, trainUnit, type Node, type PlayerId, type Sim } from "./sim";

type Kind = Node["kind"];

/**
 * How each difficulty plays. `think` is the seconds between decisions and `gather` its work
 * speed (Hard gathers faster than a person can). Times are seconds into the game.
 */
export const LEVEL = [
  { think: 2.4, gather: 0.8, folk: 9, army: 10, farms: 1, town: 240, castle: 540, tower: 450, navy: 540, upgrades: 480, early: [480, 6], late: [720, 4] },
  { think: 1.15, gather: 1, folk: 12, army: 20, farms: 2, town: 150, castle: 330, tower: 260, navy: 300, upgrades: 220, early: [330, 8], late: [540, 4] },
  { think: 0.8, gather: 1.3, folk: 18, army: 30, farms: 3, town: 100, castle: 250, tower: 200, navy: 240, upgrades: 150, early: [270, 9], late: [420, 5] },
] as const;

function strength(sim: Sim, p: PlayerId) {
  const army = sim.units.filter((u) => u.owner === p && u.hp > 0 && u.kind !== "villager" && u.kind !== "fisher" && u.kind !== "transport").length;
  return army + sim.buildings.filter((b) => b.owner === p && !BUILDINGS[b.kind].wall).length * 0.5 + ageOf(sim, p) * 3;
}

/**
 * Whether computer `p` takes up an alliance. It keeps to one ally. On Easy it says yes; on
 * Normal it joins anyone not far ahead of it; on Hard only to face a third player who leads.
 */
export function aiAnswer(sim: Sim, p: PlayerId, from: PlayerId) {
  if (sim.allies[p]) return false;
  if (sim.level === 0) return true;
  const rivals = IDS.slice(0, sim.count).filter((q) => q !== p && q !== from && !sim.out[q]);
  const top = Math.max(0, ...rivals.map((q) => strength(sim, q)));
  const mine = strength(sim, p);
  const theirs = strength(sim, from);
  if (sim.level === 2) return top > Math.max(mine, theirs);
  return theirs <= mine * 1.4 + 6 || top > mine;
}

export function aiThink(sim: Sim, p: PlayerId) {
  if (sim.phase !== "play") return;
  const level = LEVEL[sim.level]!;
  const foes = IDS.slice(0, sim.count).filter((q) => !sim.out[q] && !allied(sim, p, q));
  const mine = sim.buildings.filter((b) => b.owner === p && b.hp > 0);
  const folks = sim.units.filter((u) => u.owner === p && u.hp > 0 && u.kind === "villager");
  const military = sim.units.filter((u) => u.owner === p && u.hp > 0 && u.kind !== "villager" && !UNITS[u.kind].naval);
  const fishers = sim.units.filter((u) => u.owner === p && u.hp > 0 && u.kind === "fisher");
  const warships = sim.units.filter((u) => u.owner === p && u.hp > 0 && (u.kind === "galley" || u.kind === "bombard"));
  const age = ageOf(sim, p);
  const hall = hallOf(sim, p);
  if (!hall) return;
  const home = { x: hall.tx + 1.5, y: hall.ty + 1.5 };

  const nearestNode = (kind: Kind, x: number, y: number) => {
    let best: Node | null = null;
    let bd = 1e9;
    for (const n of sim.nodes) {
      if (n.kind !== kind || n.sea || (!n.farm && n.amount <= 0)) continue;
      const d = Math.hypot(n.x + 0.5 - x, n.y + 0.5 - y);
      // stay near home, and skip anything walled in by forest or water
      if (d < bd && d < 38 && (!folks[0] || canReachNode(sim, folks[0], n))) {
        bd = d;
        best = n;
      }
    }
    return best;
  };

  const tally: Record<Kind, number> = { food: 0, wood: 0, gold: 0, stone: 0 };
  const job = (u: (typeof folks)[number]) => {
    if (u.order.t !== "gather" && u.order.t !== "drop") return null;
    const id = u.order.node;
    return sim.nodes.find((n) => n.id === id)?.kind ?? null;
  };
  for (const u of folks) {
    const k = job(u);
    if (k) tally[k] += 1;
  }
  const want: Record<Kind, number> = { food: 4, wood: 4, gold: 3, stone: 1 };
  const crew = level.folk;
  const order: Kind[] = ["wood", "food", "gold", "stone"];
  const shortest = () => order.reduce((a, b) => (tally[a] / want[a] <= tally[b] / want[b] ? a : b));
  const lacking = order.find((k) => tally[k] === 0);
  if (lacking && folks.length >= 4 && !folks.some((u) => u.order.t === "idle")) {
    const spare = folks.find((u) => u.carry < 1 && u.order.t === "gather" && tally[job(u) ?? lacking] > 1);
    if (spare) spare.order = { t: "idle" };
  }
  for (const u of folks) {
    if (u.order.t !== "idle") continue;
    const need = shortest();
    const node = nearestNode(need, home.x, home.y) ?? nearestNode("wood", home.x, home.y);
    if (!node) continue;
    orderGather(sim, [u], node.id);
    tally[need] += 1;
  }

  const count = (k: BuildingKind) => mine.filter((b) => b.kind === k).length;

  // The next age comes first: once it is due, stop spending food until it is paid for.
  const nextAge: TechKind | null = age === 1 && sim.clock > level.town && folks.length >= 8 ? "age2" : age === 2 && sim.clock > level.castle && folks.length >= Math.min(10, crew) ? "age3" : null;
  const wanted = nextAge && !techBlock(sim, p, nextAge) ? nextAge : null;
  const saving = !!wanted && !canAfford(sim.res[p], TECHS[wanted].cost);

  // the closest fishing water to home decides where a dock goes
  const shoal = sim.nodes
    .filter((n) => n.sea && n.amount > 0)
    .map((n) => ({ n, d: Math.hypot(n.x - home.x, n.y - home.y) }))
    .filter((o) => o.d < 30)
    .sort((a, b) => a.d - b.d)[0]?.n;
  if (!mine.some((b) => b.progress < 1)) {
    const wood = sim.res[p].wood;
    // a storehouse beside any resource that has become a long walk
    let far: Node | null = null;
    if (wood >= 80 && count("store") < 3) {
      for (const k of ["wood", "gold"] as const) {
        const n = nearestNode(k, home.x, home.y);
        if (!n) continue;
        const walk = Math.min(...mine.filter((b) => central(b.kind) || b.kind === "store").map((b) => Math.hypot(b.tx - n.x, b.ty - n.y)));
        if (walk > 12) far = n;
      }
    }
    const navyRoom = 5;
    if (popUsed(sim, p) >= popCap(sim, p) - 2 && popCap(sim, p) < crew + 8) aiTryBuild(sim, p, "house");
    // more barracks when the soldiers have run out of room
    else if (count("barracks") && !mine.some((b) => b.kind === "barracks" && b.progress < 1) && armyUsed(sim, p) >= armyCap(sim, p) - 1 && armyCap(sim, p) < level.army + navyRoom && wood >= 190) aiTryBuild(sim, p, "barracks");
    else if (far) aiTryBuild(sim, p, "store", far);
    else if (count("farm") < level.farms && folks.length >= 5) aiTryBuild(sim, p, "farm");
    else if (!count("barracks") && folks.length >= 6) aiTryBuild(sim, p, "barracks");
    else if (!count("dock") && shoal && sim.clock > 120 && wood >= 120 && aiTryBuild(sim, p, "dock", shoal)) {
      // placed
    } else if (age >= 2 && hasComplete(sim, p, "barracks") && !count("range")) aiTryBuild(sim, p, "range");
    else if (age >= 2 && hasComplete(sim, p, "range") && !count("smithy")) aiTryBuild(sim, p, "smithy");
    else if (age >= 2 && sim.clock > level.tower && !count("tower")) aiTryBuild(sim, p, "tower");
    else if (age >= 2 && sim.clock > level.tower + 20 && !count("stable") && wood >= 200) aiTryBuild(sim, p, "stable");
    else if (sim.level === 2 && count("barracks") < 2 && wood >= 260) aiTryBuild(sim, p, "barracks");
    else if (age >= 3 && !count("workshop") && wood >= 220) aiTryBuild(sim, p, "workshop");
    else if (age >= 3 && !count("market") && wood >= 260) aiTryBuild(sim, p, "market");
    else if (age >= 3 && !count("castle") && sim.level > 0 && sim.res[p].stone >= 520 && wood >= 260) aiTryBuild(sim, p, "castle");
  }

  for (const u of fishers) {
    if (u.order.t !== "idle") continue;
    let best: Node | null = null;
    let bd = 1e9;
    for (const n of sim.nodes) {
      if (!n.sea || n.amount <= 0) continue;
      const d = Math.hypot(n.x - u.x, n.y - u.y);
      if (d < bd && canReachNode(sim, u, n)) {
        bd = d;
        best = n;
      }
    }
    if (best) orderGather(sim, [u], best.id);
  }

  const keep = sim.sel[p];
  const train = (kind: BuildingKind, unit: UnitKind) => {
    const b = mine.find((o) => o.kind === kind && o.progress >= 1 && o.queue.length < 2);
    if (!b) return;
    sim.sel[p] = { units: [], building: b.id };
    trainUnit(sim, p, unit);
  };
  const research1 = (at: BuildingKind, tech: TechKind) => {
    const b = mine.find((o) => o.kind === at && o.progress >= 1 && !o.research);
    if (!b || techBlock(sim, p, tech) || !canAfford(sim.res[p], TECHS[tech].cost)) return;
    sim.sel[p] = { units: [], building: b.id };
    research(sim, p, tech);
  };
  if (wanted) research1("town", wanted);
  // at the market: sell what there is far too much of for what is running short
  if (mine.some((o) => o.kind === "market" && o.progress >= 1)) {
    const res = sim.res[p];
    const rich = GOODS.filter((g) => res[g] > 900).sort((x, y) => res[y] - res[x])[0];
    const poor = GOODS.filter((g) => res[g] < 150).sort((x, y) => res[x] - res[y])[0];
    if (rich) trade(sim, p, rich, false);
    if (poor && res.gold > quote(sim, p, poor).buy + 150) trade(sim, p, poor, true);
  }
  // short of room in the Town age: enlarge a cottage rather than build another
  const cottage = mine.find((o) => o.kind === "house" && o.progress >= 1 && !o.upgrade);
  if (cottage && age >= 2 && !mine.some((o) => o.upgrade) && popUsed(sim, p) >= popCap(sim, p) - 3 && canAfford(sim.res[p], { wood: 160, stone: 110 })) {
    sim.sel[p] = { units: [], building: cottage.id };
    enlarge(sim, p);
  }
  if (folks.length + hall.queue.length < crew && !(saving && folks.length >= 9)) train(hall.kind, "villager");
  const have = (k: UnitKind) => military.filter((u) => u.kind === k).length;
  if (fishers.length < (sim.level === 0 ? 1 : 3)) train("dock", "fisher");
  if (!saving || military.length < 4) {
    if (military.length < level.army) {
      if (have("ram") < 2) train("workshop", "ram");
      if (have("rider") < level.army / 5) train("stable", "rider");
      if (have("archer") < level.army * 0.3) train("range", "archer");
      if (have("militia") < level.army * 0.4) train("barracks", "militia");
    }
    if (sim.clock > level.navy) {
      if (warships.filter((u) => u.kind === "bombard").length < 2) train("dock", "bombard");
      if (warships.filter((u) => u.kind === "galley").length < 3) train("dock", "galley");
    }
    if (sim.clock > level.upgrades) {
      for (const t of Object.keys(TECHS) as TechKind[]) if (t !== "age2" && t !== "age3") research1(TECHS[t].at, t);
    }
  }
  sim.sel[p] = keep;

  // Warships hunt enemy docks and boats, wherever the water lets them go.
  if (warships.length >= 2) {
    const prey = sim.buildings.find((b) => foes.includes(b.owner) && b.kind === "dock" && b.hp > 0 && b.seen & (1 << p)) ?? null;
    const boat = sim.units.find((u) => foes.includes(u.owner) && u.hp > 0 && UNITS[u.kind].naval);
    const goal = prey ? { x: prey.tx + 1, y: prey.ty + 1 } : boat ? { x: boat.x, y: boat.y } : null;
    if (goal) {
      for (const u of warships) {
        if (u.order.t !== "idle") continue;
        u.order = { t: "move", ...goal, hunt: true };
        u.goalKey = "";
      }
    }
  }

  // Attack in waves: gather a group, then commit it until it is spent.
  const due = ([after, size]: readonly [number, number]) => sim.clock > after && military.length >= size;
  if (!sim.aiAttack[p] && (due(level.early) || due(level.late))) sim.aiAttack[p] = true;
  if (sim.aiAttack[p] && military.length <= 2) sim.aiAttack[p] = false;
  if (sim.aiAttack[p]) {
    // march on the nearest enemy hall
    const enemy = sim.buildings
      .filter((b) => foes.includes(b.owner) && central(b.kind) && b.hp > 0)
      .sort((a, b) => Math.hypot(a.tx - home.x, a.ty - home.y) - Math.hypot(b.tx - home.x, b.ty - home.y))[0];
    if (!enemy) return;
    const side = home.y < enemy.ty ? -0.5 : BUILDINGS.town.h + 0.5;
    for (const u of military) {
      if (u.order.t !== "idle") continue;
      u.order = { t: "move", x: enemy.tx + BUILDINGS.town.w / 2, y: enemy.ty + side, hunt: true };
      if (Math.hypot(enemy.tx - u.x, enemy.ty - u.y) < 6 || u.kind === "ram") u.order = { t: "attack", kind: "building", id: enemy.id, resume: null };
      u.goalKey = "";
    }
  }
}
