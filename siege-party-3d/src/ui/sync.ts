/**
 * Keeps another device in step. The host runs the game and sends what has changed about
 * ten times a second; the other device draws it and sends back what its player does.
 */
import { BUILD_KINDS, UNIT_KINDS, setSize, COLS, ROWS } from "../game/content";
import { BASES, GRID, setMap } from "../game/map";
import { begin, updateVision, type Building, type Node, type PlayerId, type Sim, type Unit } from "../game/sim";

/** Both devices must run the same version of the game. */
export const VERSION = 5;

const NODE_KINDS = ["wood", "food", "gold", "stone"] as const;
const ORDERS = ["idle", "move", "gather", "drop", "build", "attack", "board", "unload"] as const;
const CARRY = [null, "food", "wood", "gold", "stone"] as const;
const round = (v: number) => Math.round(v * 100) / 100;

const packNode = (n: Node) => [n.id, NODE_KINDS.indexOf(n.kind), n.x, n.y, Math.ceil(n.amount), +n.farm, +n.sea];
const unpackNode = (a: number[]): Node => ({ id: a[0]!, kind: NODE_KINDS[a[1]!]!, x: a[2]!, y: a[3]!, amount: a[4]!, farm: !!a[5], sea: !!a[6] });

export function startMessage(sim: Sim, you: PlayerId) {
  return {
    t: "start", v: VERSION, you, count: sim.count, w: COLS, h: ROWS, grid: GRID, bases: BASES,
    ai: sim.ai, styles: sim.style, level: sim.level, nodes: sim.nodes.map(packNode),
  };
}

/** Remembers what one device has been told, so only changes are sent again. */
export function memory(sim: Sim) {
  return { buildings: new Map<number, string>(), nodes: new Map<number, number>(sim.nodes.map((n) => [n.id, Math.ceil(n.amount)])) };
}
export type Memory = ReturnType<typeof memory>;

export function snapshot(sim: Sim, you: PlayerId, seen: Memory, sounds: string[]) {
  const units = sim.units.map((u) => [
    u.id, u.owner, UNIT_KINDS.indexOf(u.kind), round(u.x), round(u.y), Math.ceil(u.hp), ORDERS.indexOf(u.order.t),
    u.fx < 0 ? -1 : 1, Math.floor(u.carry), CARRY.indexOf(u.carryType), +(u.path.length > 0), +(u.flash > 0),
    u.cargo?.length ? u.cargo.map((c) => UNIT_KINDS.indexOf(c.kind)) : 0,
    +!!u.sentry,
  ]);
  const changed: unknown[] = [];
  const here = new Set<number>();
  for (const b of sim.buildings) {
    here.add(b.id);
    const row = [
      b.id, b.owner, BUILD_KINDS.indexOf(b.kind), b.tx, b.ty, Math.ceil(b.hp), Math.floor(b.progress * 100) / 100, b.seen,
      b.queue.map((q) => [UNIT_KINDS.indexOf(q.kind), Math.ceil(q.left)]),
      b.research ? [b.research.tech, Math.ceil(b.research.left)] : 0,
      b.rally ? [round(b.rally.x), round(b.rally.y)] : 0,
      b.upgrade ? Math.ceil(b.upgrade.left) : 0,
    ];
    const text = JSON.stringify(row);
    if (seen.buildings.get(b.id) !== text) {
      seen.buildings.set(b.id, text);
      changed.push(row);
    }
  }
  const razed: number[] = [];
  for (const id of seen.buildings.keys()) if (!here.has(id)) razed.push(id);
  for (const id of razed) seen.buildings.delete(id);

  const nodes: number[][] = [];
  const fields: number[][] = [];
  const present = new Set<number>();
  for (const n of sim.nodes) {
    present.add(n.id);
    const amount = Math.ceil(n.amount);
    const old = seen.nodes.get(n.id);
    if (old === undefined) fields.push(packNode(n));
    else if (old !== amount) nodes.push([n.id, amount]);
    else continue;
    seen.nodes.set(n.id, amount);
  }
  const gone: number[] = [];
  for (const id of seen.nodes.keys()) if (!present.has(id)) gone.push(id);
  for (const id of gone) seen.nodes.delete(id);

  return {
    t: "s", clock: round(sim.clock), phase: sim.phase, winner: sim.winner, winners: sim.winners,
    out: sim.out, ai: sim.ai, allies: sim.allies, offers: sim.offers, breaks: sim.breaks, tech: sim.tech,
    res: sim.res[you], units, changed, razed, nodes, fields, gone,
    arrows: sim.arrows.map((a) => [round(a.x), round(a.y), round(a.tx), round(a.ty), a.owner, +!!a.ball]),
    me: {
      sel: sim.sel[you], place: sim.place[you], hunt: sim.hunt[you], anchor: sim.anchor[you],
      bad: sim.bad[you], note: sim.note[you], shake: sim.shake[you], prices: sim.prices[you],
    },
    sounds,
  };
}

/** Sets up this device's copy of the game from the host's opening message. */
export function applyStart(sim: Sim, m: any) {
  setSize(m.w, m.h);
  if (!Array.isArray(m.grid) || m.grid.length !== ROWS || m.grid.some((r: unknown) => typeof r !== "string" || r.length !== COLS)) throw new Error("bad map");
  setMap({ grid: m.grid, bases: m.bases });
  begin(sim, "online", m.count, { ai: m.ai, styles: m.styles, level: m.level });
  sim.nodes = m.nodes.map(unpackNode);
  sim.units = [];
  sim.buildings = [];
}

/** where each unit is heading, so it can glide there between updates */
const targets = new WeakMap<Unit, { x: number; y: number }>();

export function applySnapshot(sim: Sim, m: any, you: PlayerId) {
  const old = new Map(sim.units.map((u) => [u.id, u]));
  sim.units = m.units.map((a: any[]): Unit => {
    const [id, owner, kind, x, y, hp, order, face, carry, carryType, moving, flash, cargo, sentry] = a;
    const u: Unit = old.get(id) ?? {
      id, owner, kind: UNIT_KINDS[kind]!, x, y, hp, order: { t: "idle" }, path: [], goalKey: "", repath: 0,
      carry: 0, carryType: null, cd: 0, flash: 0, anim: id % 10, fx: 0, fy: 0, stuck: 0,
    };
    targets.set(u, { x, y });
    if (Math.hypot(u.x - x, u.y - y) > 3) {
      u.x = x;
      u.y = y;
    }
    u.hp = hp;
    u.sentry = !!sentry;
    u.order = { t: ORDERS[order]! } as Unit["order"];
    u.fx = face;
    u.carry = carry;
    u.carryType = CARRY[carryType] ?? null;
    u.path = moving ? [{ x, y }] : [];
    u.flash = flash ? 0.1 : 0;
    u.cargo = cargo ? cargo.map((k: number) => ({ kind: UNIT_KINDS[k]! }) as Unit) : undefined;
    return u;
  });

  if (m.changed.length || m.razed.length) {
    const byId = new Map(sim.buildings.map((b) => [b.id, b]));
    for (const id of m.razed) byId.delete(id);
    for (const [id, owner, kind, tx, ty, hp, progress, seenBy, queue, research, rally, upgrade] of m.changed) {
      byId.set(id, {
        id, owner, kind: BUILD_KINDS[kind]!, tx, ty, hp, progress,
        // what this device has already scouted stays on its map
        seen: seenBy | (byId.get(id)?.seen ?? 0),
        queue: queue.map((q: number[]) => ({ kind: UNIT_KINDS[q[0]!]!, left: q[1]! })),
        research: research ? { tech: research[0], left: research[1] } : null,
        rally: rally ? { x: rally[0], y: rally[1] } : null,
        upgrade: upgrade ? { left: upgrade } : null,
        cd: 0, work: 0,
      } satisfies Building);
    }
    sim.buildings = [...byId.values()];
    sim.mapVer++;
  }
  if (m.fields.length || m.gone.length) {
    const gone = new Set(m.gone);
    sim.nodes = sim.nodes.filter((n) => !gone.has(n.id)).concat(m.fields.map(unpackNode));
    sim.mapVer++;
  }
  if (m.nodes.length) {
    const byId = new Map(sim.nodes.map((n) => [n.id, n]));
    for (const [id, amount] of m.nodes) {
      const n = byId.get(id);
      if (n) n.amount = amount;
    }
  }
  sim.arrows = m.arrows.map(([x, y, tx, ty, owner, ball]: number[]) => ({ x, y, tx, ty, owner, ball: !!ball, dmg: 0, kind: "unit", id: 0 }));
  Object.assign(sim, {
    clock: m.clock, phase: m.phase, winner: m.winner, winners: m.winners, out: m.out, ai: m.ai,
    allies: m.allies, offers: m.offers, breaks: m.breaks, tech: m.tech,
  });
  sim.res[you] = m.res;
  sim.sel[you] = m.me.sel;
  sim.place[you] = m.me.place;
  sim.hunt[you] = m.me.hunt;
  sim.anchor[you] = m.me.anchor;
  sim.bad[you] = m.me.bad;
  sim.note[you] = m.me.note;
  sim.shake[you] = m.me.shake;
  if (m.me.prices) sim.prices[you] = m.me.prices;
  if (Array.isArray(m.sounds)) sim.fxQueue.push(...m.sounds);
  sim.uiDirty = true;
}

let sightAt = 0;
/** Between updates: glide units along, fly arrows and keep the fog current. */
export function guestTick(sim: Sim, dt: number) {
  if (sim.phase !== "play") return;
  const k = Math.min(1, dt * 12);
  for (const u of sim.units) {
    const to = targets.get(u);
    if (!to) continue;
    if (u.path.length) u.anim += dt * 8;
    u.x += (to.x - u.x) * k;
    u.y += (to.y - u.y) * k;
  }
  for (const a of sim.arrows) {
    const dx = a.tx - a.x;
    const dy = a.ty - a.y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, (a.ball ? 6.5 : 9) * dt);
    if (d > 0.05) {
      a.x += (dx / d) * step;
      a.y += (dy / d) * step;
    }
  }
  sightAt += dt;
  if (sightAt > 0.25) {
    sightAt = 0;
    updateVision(sim);
  }
}
