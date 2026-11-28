/**
 * What can be heard from where the players are looking: wind always, leaves and birds near woods,
 * water near the shore, and the work and fighting of people in view.
 */
import { bird, setAmbience, work } from "../game/audio";
import { UNITS, isNorth } from "../game/content";
import { terrainAt } from "../game/map";
import type { PlayerId, Sim, Unit } from "../game/sim";

const EAR = 9;
let around = 0;
let busy = 0;
let gust = 0.4;
let gustTo = 0.4;
let gustLeft = 0;
let trees = 0;
let wet = 0;
let shots = 0;
const heardArrows = new WeakSet<object>();

/** where a sound is for the nearest player: left-right, and how near */
function place(sim: Sim, ears: PlayerId[], x: number, y: number) {
  let best: { pan: number; vol: number } | null = null;
  for (const p of ears) {
    const c = sim.cam[p];
    const d = Math.hypot(x - c.x, y - c.y);
    if (d > EAR + 1) continue;
    const vol = 1 - d / (EAR + 1);
    if (!best || vol > best.vol) best = { pan: ((x - c.x) / EAR) * (isNorth(p) ? -1 : 1) * 0.8, vol };
  }
  return best;
}

function toolOf(sim: Sim, u: Unit, nodes: Map<number, Sim["nodes"][number]>): string | null {
  const o = u.order;
  if (u.path.length) return null;
  if (o.t === "build") return "hammer";
  if (o.t === "gather") {
    const n = nodes.get(o.node);
    if (!n) return null;
    if (UNITS[u.kind].naval) return "splash";
    return n.kind === "wood" ? "chop" : n.kind === "food" ? (n.farm ? "hoe" : "pluck") : "pick";
  }
  if (o.t === "attack") {
    if (u.kind === "militia" || u.kind === "villager") return "clash";
    if (u.kind === "rider") return Math.random() < 0.5 ? "clash" : "hoof";
    if (u.kind === "ram") return "thud";
  }
  return null;
}

export function soundscape(sim: Sim, ears: PlayerId[], dt: number, on: boolean) {
  if (!ears.length) return;
  around += dt;
  busy += dt;
  gustLeft -= dt;
  if (gustLeft <= 0) {
    gustTo = Math.pow(Math.random(), 1.4);
    gustLeft = 3 + Math.random() * 7;
  }
  gust += (gustTo - gust) * Math.min(1, dt * 0.45);
  if (around > 0.5) {
    around = 0;
    shots = 0;
    // woods and water round any player's view
    let t = 0;
    let w = 0;
    for (const p of ears) {
      const c = sim.cam[p];
      let n = 0;
      let nw = 0;
      for (let y = c.y - EAR; y <= c.y + EAR; y += 1.5)
        for (let x = c.x - EAR; x <= c.x + EAR; x += 1.5) {
          n++;
          if (terrainAt(Math.floor(x), Math.floor(y)) === "water") nw++;
        }
      let nt = 0;
      for (const nd of sim.nodes) if (nd.kind === "wood" && nd.amount > 0 && Math.abs(nd.x - c.x) < EAR && Math.abs(nd.y - c.y) < EAR) nt++;
      t = Math.max(t, Math.min(1, nt / 45));
      w = Math.max(w, Math.min(1, (nw / n) * 2.5));
    }
    trees += (t - trees) * 0.5;
    wet += (w - wet) * 0.5;
    setAmbience(on, trees, wet, gust);
  }
  if (!on) return;
  // birds, more of them near the woods
  if (Math.random() < (0.1 + trees * 0.5) * dt) bird((Math.random() - 0.5) * 1.6, 0.35 + Math.random() * 0.65);
  // people at work and at war
  if (busy > 0.28) {
    busy = 0;
    const nodes = new Map<number, Sim["nodes"][number]>();
    for (const n of sim.nodes) nodes.set(n.id, n);
    const near: { tool: string; pan: number; vol: number }[] = [];
    for (const u of sim.units) {
      const at = place(sim, ears, u.x, u.y);
      if (!at) continue;
      const tool = toolOf(sim, u, nodes);
      if (tool) near.push({ tool, ...at });
    }
    for (let k = 0; k < Math.min(2, near.length); k++) {
      const s = near[Math.floor(Math.random() * near.length)]!;
      work(s.tool, s.pan, s.vol * (k ? 0.6 : 1));
    }
  }
  for (const a of sim.arrows) {
    if (heardArrows.has(a)) continue;
    heardArrows.add(a);
    if (shots >= 4) continue;
    const at = place(sim, ears, a.x, a.y);
    if (!at) continue;
    shots++;
    work(a.ball ? "boom" : "arrow", at.pan, at.vol);
  }
}
