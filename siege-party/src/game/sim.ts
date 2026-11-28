import { aiAnswer, aiThink, LEVEL } from "./ai";
import {
  BUILDINGS,
  COLS,
  FARM_RATE,
  FISH_RATE,
  AGES,
  TECHS,
  type TechKind,
  GATHER,
  ROWS,
  START_RES,
  UNITS,
  canAfford,
  pay,
  refund,
  type BuildingKind,
  type Res,
  type UnitKind,
  SEATS,
  isNorth,
  HOLD,
  MAX_SEATS,
  STYLE,
  berth,
  central,
  soldier,
  GOODS,
  BASE_PRICE,
  type Good,
  type Cost,
} from "./content";
import { BASES, GRID, assertMap, nodeSpawns, tileChar } from "./map";
import { findPath } from "./path";

export type PlayerId = 0 | 1 | 2 | 3 | 4;
export const IDS: readonly PlayerId[] = [0, 1, 2, 3, 4];
/** one slot per seat */
export type Seats<T> = [T, T, T, T, T];
export const seats = <T>(make: (p: PlayerId) => T): Seats<T> => [make(0), make(1), make(2), make(3), make(4)];
/** duel: one shared screen. solo: you against computers. online: each person on their own device. */
export type Mode = "duel" | "solo" | "online";
export type Setup = { ai?: boolean[]; styles?: number[]; level?: number };
export type Phase = "menu" | "play" | "pause" | "end";

export type Order =
  | { t: "idle" }
  | { t: "move"; x: number; y: number; hunt: boolean }
  | { t: "gather"; node: number }
  | { t: "drop"; node: number }
  | { t: "build"; id: number }
  /** walk to a transport and get on; x, y is where to wait for it */
  | { t: "board"; id: number; x: number; y: number }
  /** a transport sailing to the water at x, y to set people down near lx, ly */
  | { t: "unload"; x: number; y: number; lx: number; ly: number }
  | {
      t: "attack";
      kind: "unit" | "building";
      id: number;
      resume: { x: number; y: number; hunt: boolean } | null;
      /** order to return to once a wall in the way is down */
      after?: Order;
    };

export type Unit = {
  id: number;
  owner: PlayerId;
  kind: UnitKind;
  x: number;
  y: number;
  hp: number;
  order: Order;
  path: { x: number; y: number }[];
  goalKey: string;
  repath: number;
  carry: number;
  carryType: Res | null;
  cd: number;
  flash: number;
  anim: number;
  fx: number;
  fy: number;
  stuck: number;
  /** who is riding on this transport */
  cargo?: Unit[];
  aboard?: boolean;
  /** who last hurt it, and when */
  hitBy?: Hit;
  /** the time of the last blow it has already answered */
  answered?: number;
  /** a sentry runs to defend buildings and people near its post that come under attack */
  sentry?: boolean;
  post?: { x: number; y: number };
};

/** A blow or a shot, and where it came from. */
export type Hit = { kind: "unit" | "building"; id: number; at: number };

export type Building = {
  id: number;
  owner: PlayerId;
  kind: BuildingKind;
  tx: number;
  ty: number;
  hp: number;
  progress: number;
  queue: { kind: UnitKind; left: number }[];
  cd: number;
  seen: number;
  work: number;
  research: { tech: TechKind; left: number } | null;
  /** where units it makes go: a spot, or a resource for new Folk to work */
  rally?: { x: number; y: number; node?: number } | null;
  /** who last hurt it, and when */
  hitBy?: Hit;
  /** a cottage being enlarged into a manor: seconds left */
  upgrade?: { left: number } | null;
};

export type Node = {
  id: number;
  kind: "wood" | "food" | "gold" | "stone";
  x: number;
  y: number;
  amount: number;
  farm: boolean;
  /** fish: only boats can gather it, and it does not block the water */
  sea: boolean;
};

export type Arrow = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  owner: PlayerId;
  dmg: number;
  kind: "unit" | "building";
  id: number;
  /** a bombard's cannonball */
  ball?: boolean;
  /** who shot it */
  src?: { kind: "unit" | "building"; id: number };
};

export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };
export type Floater = { x: number; y: number; text: string; life: number; color: string };

export type SideSnap = {
  food: number;
  wood: number;
  gold: number;
  stone: number;
  pop: number;
  cap: number;
  army: number;
  armyCap: number;
  place: BuildingKind | null;
  placeOk: boolean;
  placeReason: string;
  sel: "none" | "folk" | "boats" | "host" | "mix" | "hall" | "carrier";
  /** places taken on the selected transports */
  load: number;
  hold: number;
  age: number;
  ships: number;
  anchored: boolean;
  selCount: number;
  selName: string;
  building: BuildingKind | null;
  train: UnitKind[];
  queue: number;
  hp: string;
  hunt: boolean;
  note: string;
};

export type Snap = {
  phase: Phase;
  mode: Mode | null;
  winner: PlayerId | -1 | null;
  clock: number;
  sound: boolean;
  players: Seats<SideSnap>;
};

export type Bad = { tx: number; ty: number; w: number; h: number; t: number };

export type Sim = {
  phase: Phase;
  mode: Mode | null;
  winner: PlayerId | -1 | null;
  /** players in this game: 2 to 5 */
  count: number;
  ai: Seats<boolean>;
  style: Seats<number>;
  /** computer difficulty: 0 Easy, 1 Normal, 2 Hard */
  level: number;
  /** bit q is set in allies[p] while p and q are allies */
  allies: Seats<number>;
  /** bit q is set in offers[p] while p is asking q to be allies */
  offers: Seats<number>;
  offerAge: Seats<number>;
  /** alliances that have been called off and are counting down */
  breaks: { a: PlayerId; b: PlayerId; t: number }[];
  /** bit p is set for everyone who shares the victory */
  winners: number;
  out: Seats<boolean>;
  clock: number;
  sound: boolean;
  nextId: number;
  units: Unit[];
  buildings: Building[];
  nodes: Node[];
  arrows: Arrow[];
  particles: Particle[];
  floaters: Floater[];
  res: Seats<Record<Res, number>>;
  sel: Seats<{ units: number[]; building: number | null }>;
  place: Seats<BuildingKind | null>;
  hunt: Seats<boolean>;
  /** each player's market prices: gold for 100 of each good, before the market's cut */
  prices: Seats<Record<Good, number>>;
  note: Seats<{ text: string; t: number }>;
  cam: Seats<{ x: number; y: number }>;
  view: Seats<{ w: number; h: number }>;
  explored: Seats<Uint8Array>;
  visible: Seats<Uint8Array>;
  shake: Seats<number>;
  visionAcc: number;
  aiAcc: Seats<number>;
  aiAttack: Seats<boolean>;
  needFocus: boolean;
  sfxCd: number;
  fxQueue: string[];
  uiDirty: boolean;
  mapVer: number;
  tech: Seats<TechKind[]>;
  /** last wall tile placed, so the next tap draws a line from it */
  anchor: Seats<{ x: number; y: number } | null>;
  bad: Seats<Bad | null>;
  lastTap: Seats<{ id: number; at: number }>;
};

const REACH = 0.8;

const emptyStock = (): Record<Res, number> => ({ food: 0, wood: 0, gold: 0, stone: 0 });

export function createSim(): Sim {
  assertMap();
  const sim: Sim = {
    phase: "menu",
    mode: null,
    winner: null,
    count: 2,
    ai: seats(() => false),
    style: seats((p) => p % 4),
    level: 1,
    allies: seats(() => 0),
    offers: seats(() => 0),
    offerAge: seats(() => 0),
    breaks: [],
    winners: 0,
    out: seats(() => false),
    clock: 0,
    sound: true,
    nextId: 1,
    units: [],
    buildings: [],
    nodes: [],
    arrows: [],
    particles: [],
    floaters: [],
    res: seats(emptyStock),
    sel: seats(() => ({ units: [], building: null })),
    place: seats(() => null),
    hunt: seats(() => false),
    prices: seats(() => ({ food: BASE_PRICE, wood: BASE_PRICE, stone: BASE_PRICE })),
    note: seats(() => ({ text: "", t: 0 })),
    cam: seats(() => ({ x: COLS / 2, y: ROWS / 2 })),
    view: seats(() => ({ w: 264, h: 200 })),
    explored: seats(() => new Uint8Array(COLS * ROWS)),
    visible: seats(() => new Uint8Array(COLS * ROWS)),
    shake: seats(() => 0),
    visionAcc: 0,
    aiAcc: seats(() => 0),
    aiAttack: seats(() => false),
    needFocus: true,
    sfxCd: 0,
    fxQueue: [],
    uiDirty: true,
    mapVer: 0,
    tech: seats(() => []),
    anchor: seats(() => null),
    bad: seats(() => null),
    lastTap: seats(() => ({ id: 0, at: -9 })),
  };
  rebuild(sim);
  sim.phase = "menu";
  return sim;
}

export function allied(sim: Sim, a: number, b: number) {
  return a === b || !!(sim.allies[a as PlayerId] & (1 << b));
}

/** A building's full health with its owner's strengths applied. */
export function maxHp(sim: Sim, owner: PlayerId, kind: BuildingKind) {
  return Math.round(BUILDINGS[kind].hp * (sim.style[owner] === STYLE.stone ? 1.2 : 1));
}

/** What a unit costs this player. */
export function unitCost(sim: Sim, p: PlayerId, kind: UnitKind): Cost {
  const style = sim.style[p];
  const cheap = (style === STYLE.forest && UNITS[kind].naval) || (style === STYLE.horse && kind === "rider");
  if (!cheap) return UNITS[kind].cost;
  const out: Cost = {};
  for (const [k, v] of Object.entries(UNITS[kind].cost) as [Res, number][]) out[k] = Math.round(v * 0.8);
  return out;
}

/** How fast this player works a resource, counting their style and the computer's level. */
function workBonus(sim: Sim, p: PlayerId, n: Node) {
  const style = sim.style[p];
  let k = sim.ai[p] ? LEVEL[sim.level]!.gather : 1;
  if (style === STYLE.forest && n.kind === "wood") k *= 1.2;
  if (style === STYLE.stone && n.kind === "stone") k *= 1.25;
  if (style === STYLE.sun && n.kind === "gold") k *= 1.15;
  if (style === STYLE.sun && (n.farm || n.sea)) k *= 1.2;
  return k;
}

/** places taken on a transport */
export const loadOf = (u: Unit) => (u.cargo ?? []).reduce((n, c) => n + berth(c.kind), 0);

export function has(sim: Sim, p: PlayerId, tech: TechKind) {
  return sim.tech[p].includes(tech);
}

/** 1 Village, 2 Town, 3 Castle */
export function ageOf(sim: Sim, p: PlayerId) {
  return has(sim, p, "age3") ? 3 : has(sim, p, "age2") ? 2 : 1;
}

const SOLDIERS: UnitKind[] = ["militia", "archer", "rider", "ram"];
const WARSHIPS: UnitKind[] = ["galley", "bombard"];
/** units that cannot attack at all */
const unarmed = (k: UnitKind) => k === "fisher" || k === "transport";
/** units that pick their own fights */
const fights = (k: UnitKind) => k !== "villager" && k !== "ram" && !unarmed(k);
const naval = (k: UnitKind) => !!UNITS[k].naval;

/** A unit's numbers with its owner's upgrades applied. */
export function unitStats(sim: Sim, p: PlayerId, kind: UnitKind) {
  const base = UNITS[kind];
  let { hp, dmg, range, speed, carry } = base;
  if (kind === "villager" && has(sim, p, "cart")) {
    carry += 5;
    speed *= 1.15;
  }
  if (kind === "militia" && has(sim, p, "swords")) {
    hp += 30;
    dmg += 3;
  }
  if (kind === "archer" && has(sim, p, "longbow")) {
    range += 1;
    dmg += 2;
  }
  if (kind === "rider" && has(sim, p, "lances")) {
    hp += 40;
    dmg += 2;
  }
  if (kind === "fisher" && has(sim, p, "nets")) carry += 8;
  if (sim.style[p] === STYLE.horse && (kind === "villager" || kind === "rider")) speed *= 1.12;
  if (base.naval && has(sim, p, "hulls")) hp = Math.round(hp * 1.3);
  if (SOLDIERS.includes(kind)) dmg *= 1 + (has(sim, p, "blades") ? 0.2 : 0) + (has(sim, p, "blades2") ? 0.2 : 0);
  if (WARSHIPS.includes(kind) && has(sim, p, "fireshot")) dmg *= 1.3;
  return { hp, dmg, range, speed, carry };
}

function uid(sim: Sim) {
  return sim.nextId++;
}

export function rebuild(sim: Sim) {
  sim.units = [];
  sim.buildings = [];
  sim.nodes = [];
  sim.arrows = [];
  sim.particles = [];
  sim.floaters = [];
  sim.winner = null;
  sim.clock = 0;
  sim.mapVer++;
  sim.out = seats(() => false);
  sim.tech = seats(() => []);
  sim.anchor = seats(() => null);
  sim.bad = seats(() => null);
  sim.aiAttack = seats(() => false);
  // computers take turns thinking so they never all land on the same moment
  sim.aiAcc = seats((p) => p * 0.23);
  sim.allies = seats(() => 0);
  sim.offers = seats(() => 0);
  sim.offerAge = seats(() => 0);
  sim.breaks = [];
  sim.winners = 0;
  sim.place = seats(() => null);
  sim.hunt = seats(() => false);
  sim.prices = seats(() => ({ food: BASE_PRICE, wood: BASE_PRICE, stone: BASE_PRICE }));
  sim.note = seats(() => ({ text: "", t: 0 }));
  sim.shake = seats(() => 0);
  sim.lastTap = seats(() => ({ id: 0, at: -9 }));
  sim.sel = seats(() => ({ units: [], building: null }));
  sim.res = seats(() => ({ ...START_RES }));
  sim.explored = seats(() => new Uint8Array(COLS * ROWS));
  sim.visible = seats(() => new Uint8Array(COLS * ROWS));
  for (const s of nodeSpawns()) {
    sim.nodes.push({ id: uid(sim), kind: s.kind, x: s.x, y: s.y, amount: s.amount, farm: false, sea: !!s.sea });
  }
  for (const owner of IDS.slice(0, sim.count)) {
    const tc = BASES[owner]!;
    const north = isNorth(owner);
    spawnBuilding(sim, owner, "town", tc.x, tc.y, true);
    for (const dx of [-4, 5]) spawnBuilding(sim, owner, "house", tc.x + dx, north ? tc.y : tc.y + 1, true);
    for (const [dx, dy] of [[0.5, 3.65], [1.5, 3.8], [2.5, 3.65]] as const) {
      spawnUnit(sim, owner, "villager", tc.x + dx, north ? tc.y + dy : tc.y + 3 - dy);
    }
  }
  sim.needFocus = true;
  sim.uiDirty = true;
}

function spawnBuilding(sim: Sim, owner: PlayerId, kind: BuildingKind, tx: number, ty: number, done: boolean) {
  const spec = BUILDINGS[kind];
  const b: Building = {
    id: uid(sim),
    owner,
    kind,
    tx,
    ty,
    hp: maxHp(sim, owner, kind) * (done ? 1 : 0.08),
    progress: done ? 1 : 0.08,
    queue: [],
    cd: 0,
    seen: 1 << owner,
    work: 0,
    research: null,
  };
  sim.mapVer++;
  sim.buildings.push(b);
  if (kind === "farm" && done) addFarmNode(sim, b);
  return b;
}

function addFarmNode(sim: Sim, b: Building) {
  sim.nodes.push({
    id: uid(sim),
    kind: "food",
    x: b.tx,
    y: b.ty,
    amount: 1e9,
    farm: true,
    sea: false,
  });
}

function spawnUnit(sim: Sim, owner: PlayerId, kind: UnitKind, x: number, y: number) {
  const u: Unit = {
    id: uid(sim),
    owner,
    kind,
    x,
    y,
    hp: unitStats(sim, owner, kind).hp,
    order: { t: "idle" },
    path: [],
    goalKey: "",
    repath: 0,
    carry: 0,
    carryType: null,
    cd: 0,
    flash: 0,
    anim: Math.random() * 10,
    fx: 0,
    fy: isNorth(owner) ? 1 : -1,
    stuck: 0,
  };
  sim.units.push(u);
  return u;
}

/** The map for this many players must already be loaded. */
export function begin(sim: Sim, mode: Mode, count = 2, setup: Setup = {}) {
  sim.count = Math.max(2, Math.min(MAX_SEATS, count));
  // against the computer, you are seat 0 and everyone else is a computer
  sim.ai = seats((p) => p < sim.count && (setup.ai ? !!setup.ai[p] : mode === "solo" && p > 0));
  sim.style = seats((p) => (((setup.styles?.[p] ?? p) % 4) + 4) % 4);
  sim.level = Math.max(0, Math.min(2, setup.level ?? 1));
  rebuild(sim);
  sim.mode = mode;
  sim.phase = "play";
  updateVision(sim);
  sim.uiDirty = true;
}

export function togglePause(sim: Sim) {
  if (sim.phase === "play") sim.phase = "pause";
  else if (sim.phase === "pause") sim.phase = "play";
  sim.uiDirty = true;
}

/** A player's Hall, or failing that a finished Castle. */
export function hallOf(sim: Sim, p: PlayerId) {
  let best: Building | undefined;
  for (const b of sim.buildings)
    if (b.owner === p && central(b.kind) && b.hp > 0 && (b.kind === "town" || b.progress >= 1) && (!best || (b.kind === "town" && best.kind !== "town"))) best = b;
  return best;
}

export function livingTown(sim: Sim, p: PlayerId) {
  return sim.buildings.some((b) => b.owner === p && central(b.kind) && b.hp > 0 && b.progress >= 1);
}

/** Room for Folk: the homes a player has. There is no limit beyond building more. */
export function popCap(sim: Sim, p: PlayerId) {
  let n = 0;
  for (const b of sim.buildings) if (b.owner === p && b.hp > 0 && b.progress >= 1) n += BUILDINGS[b.kind].pop;
  return n;
}

/** Room for soldiers: the barracks (and castles) a player has. */
export function armyCap(sim: Sim, p: PlayerId) {
  let n = 0;
  for (const b of sim.buildings) if (b.owner === p && b.hp > 0 && b.progress >= 1) n += BUILDINGS[b.kind].room ?? 0;
  return n;
}

/** How many of a player's people of one kind (soldiers, or everyone else) there are, counting those in training and aboard ships. */
function headcount(sim: Sim, p: PlayerId, army: boolean) {
  let n = 0;
  for (const u of sim.units) {
    if (u.owner !== p || u.hp <= 0) continue;
    if (soldier(u.kind) === army) n++;
    for (const c of u.cargo ?? []) if (soldier(c.kind) === army) n++;
  }
  for (const b of sim.buildings) if (b.owner === p && b.hp > 0) for (const q of b.queue) if (soldier(q.kind) === army) n++;
  return n;
}
export const popUsed = (sim: Sim, p: PlayerId) => headcount(sim, p, false);
export const armyUsed = (sim: Sim, p: PlayerId) => headcount(sim, p, true);

function setNote(sim: Sim, p: PlayerId, text: string) {
  sim.note[p] = { text, t: 2.4 };
  sim.uiDirty = true;
}

const gridCache = new WeakMap<Sim, { ver: number; grid: Uint8Array; regions: (Int16Array | null)[]; sea: Int16Array | null }>();

/** which tiles are water, worked out once for each map */
let waterFor: string[] | null = null;
let water = new Uint8Array(0);
function waterMask() {
  if (waterFor !== GRID || water.length !== COLS * ROWS) {
    waterFor = GRID;
    water = new Uint8Array(COLS * ROWS);
    for (let i = 0; i < water.length; i++) {
      const c = tileChar(i % COLS, (i / COLS) | 0);
      water[i] = c === "~" || c === "F" ? 1 : 0;
    }
  }
  return water;
}

/** A field: people walk across it, but nothing can be built on it. */
const FIELD = 7;
/** 0 open, 1 solid, 2 to 6 a finished gate that its owner (0 to 4) and allies can walk through, 7 a field. */
function occupancy(sim: Sim) {
  let c = gridCache.get(sim);
  if (c && c.ver === sim.mapVer) return c;
  const grid = waterMask().slice();
  for (const n of sim.nodes) if (!n.farm && !n.sea && n.amount > 0) grid[n.y * COLS + n.x] = 1;
  for (const b of sim.buildings) {
    if (b.hp <= 0) continue;
    const spec = BUILDINGS[b.kind];
    const v = b.kind === "gate" && b.progress >= 1 ? 2 + b.owner : b.kind === "farm" ? FIELD : 1;
    for (let y = b.ty; y < b.ty + spec.h; y++) grid.fill(v, y * COLS + b.tx, y * COLS + b.tx + spec.w);
  }
  c = { ver: sim.mapVer, grid, regions: [null, null, null, null, null], sea: null };
  gridCache.set(sim, c);
  return c;
}

export function blockedCell(sim: Sim, x: number, y: number, owner?: PlayerId) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  const v = occupancy(sim).grid[y * COLS + x]!;
  return v !== 0 && v !== FIELD && (v === 1 || owner === undefined || !allied(sim, owner, v - 2));
}

/** Whether anything at all stands on this tile (fields included), so nothing new can be built there. */
export function takenCell(sim: Sim, x: number, y: number) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  return occupancy(sim).grid[y * COLS + x] !== 0;
}

function distToRect(x: number, y: number, tx: number, ty: number, w: number, h: number) {
  const cx = Math.max(tx, Math.min(x, tx + w));
  const cy = Math.max(ty, Math.min(y, ty + h));
  return Math.hypot(x - cx, y - cy);
}

/** Gives every open tile the number of the connected area it belongs to. */
function label(open: (i: number) => boolean) {
  const map = new Int16Array(COLS * ROWS);
  let count = 0;
  const visit = (n: number, q: number[]) => {
    if (map[n] || !open(n)) return;
    map[n] = count;
    q.push(n);
  };
  for (let i = 0; i < map.length; i++) {
    if (!open(i) || map[i]) continue;
    map[i] = ++count;
    const q = [i];
    while (q.length) {
      const at = q.pop()!;
      const x = at % COLS;
      if (x > 0) visit(at - 1, q);
      if (x < COLS - 1) visit(at + 1, q);
      if (at >= COLS) visit(at - COLS, q);
      if (at + COLS < map.length) visit(at + COLS, q);
    }
  }
  return map;
}

/** Where a player can walk. */
function regions(sim: Sim, owner: PlayerId) {
  const c = occupancy(sim);
  return (c.regions[owner] ??= label((i) => {
    const v = c.grid[i]!;
    return v === 0 || v === FIELD || (v > 1 && v < FIELD && allied(sim, owner, v - 2));
  }));
}

/** Where ships can sail. */
export function seaRegions(sim: Sim) {
  const c = occupancy(sim);
  return (c.sea ??= label((i) => wet(i % COLS, (i / COLS) | 0)));
}

function wet(x: number, y: number) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS && !!waterMask()[y * COLS + x];
}

type Mover = { owner: PlayerId; kind: UnitKind };

/** Whether this unit cannot be on this tile. */
function solid(sim: Sim, u: Mover, x: number, y: number) {
  return naval(u.kind) ? !wet(x, y) : blockedCell(sim, x, y, u.owner);
}

/** Whether a unit standing at (ux, uy) can travel to tile (x, y). */
function reaches(sim: Sim, u: Mover, ux: number, uy: number, x: number, y: number) {
  if (!naval(u.kind)) return connected(sim, ux, uy, x, y, u.owner);
  const map = seaRegions(sim);
  const from = map[Math.floor(uy) * COLS + Math.floor(ux)];
  return !!from && x >= 0 && y >= 0 && x < COLS && y < ROWS && map[y * COLS + x] === from;
}

/** The nearest reachable water to a point, for ships told to go somewhere. */
function seaSpot(sim: Sim, u: Unit, x: number, y: number) {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  if (reaches(sim, u, u.x, u.y, fx, fy)) return { x, y };
  let best: { x: number; y: number } | null = null;
  let bd = 1e9;
  for (let r = 1; r <= 24 && r <= bd + 1; r++) {
    for (let ty = fy - r; ty <= fy + r; ty++) {
      for (let tx = fx - r; tx <= fx + r; tx++) {
        if (Math.max(Math.abs(tx - fx), Math.abs(ty - fy)) !== r || !reaches(sim, u, u.x, u.y, tx, ty)) continue;
        const d = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
        if (d < bd) {
          bd = d;
          best = { x: tx + 0.5, y: ty + 0.5 };
        }
      }
    }
  }
  return best ?? { x: u.x, y: u.y };
}

/** Water right beside a rectangle (a dock) that this ship can sail to. */
function mooring(sim: Sim, u: Mover, ux: number, uy: number, tx: number, ty: number, w: number, h: number, anyPool = false) {
  let best: { x: number; y: number } | null = null;
  let bd = 1e9;
  for (let y = ty - 1; y <= ty + h; y++) {
    for (let x = tx - 1; x <= tx + w; x++) {
      if (x >= tx && x < tx + w && y >= ty && y < ty + h) continue;
      if (!wet(x, y) || (!anyPool && !reaches(sim, u, ux, uy, x, y))) continue;
      const d = (x + 0.5 - ux) ** 2 + (y + 0.5 - uy) ** 2;
      if (d < bd) {
        bd = d;
        best = { x: x + 0.5, y: y + 0.5 };
      }
    }
  }
  return best;
}

/** The nearest place this unit can get to from which a rectangle is within reach. */
function firingSpot(sim: Sim, u: Unit, tx: number, ty: number, w: number, h: number, range: number) {
  const pad = Math.ceil(range);
  let best: { x: number; y: number } | null = null;
  let bd = 1e9;
  for (let y = Math.floor(ty) - pad; y <= Math.ceil(ty + h) + pad; y++) {
    for (let x = Math.floor(tx) - pad; x <= Math.ceil(tx + w) + pad; x++) {
      if (distToRect(x + 0.5, y + 0.5, tx, ty, w, h) > range - 0.1) continue;
      const d = (x + 0.5 - u.x) ** 2 + (y + 0.5 - u.y) ** 2;
      if (d >= bd || solid(sim, u, x, y) || !reaches(sim, u, u.x, u.y, x, y)) continue;
      bd = d;
      best = { x: x + 0.5, y: y + 0.5 };
    }
  }
  return best;
}

function connected(sim: Sim, ux: number, uy: number, x: number, y: number, owner: PlayerId) {
  const map = regions(sim, owner);
  const from = map[Math.floor(uy) * COLS + Math.floor(ux)];
  return !from || map[y * COLS + x] === from;
}

export function freeSpot(sim: Sim, x: number, y: number, owner?: PlayerId) {
  if (!blockedCell(sim, Math.floor(x), Math.floor(y), owner)) return { x, y };
  let best = { x, y };
  let bd = 1e9;
  for (let r = 1; r <= 5 && bd === 1e9; r++) {
    for (let ty = Math.floor(y) - r; ty <= Math.floor(y) + r; ty++) {
      for (let tx = Math.floor(x) - r; tx <= Math.floor(x) + r; tx++) {
        if (blockedCell(sim, tx, ty, owner)) continue;
        const d = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
        if (d < bd) {
          bd = d;
          best = { x: tx + 0.5, y: ty + 0.5 };
        }
      }
    }
  }
  return best;
}

/** Push units out from under a new foundation so they are not trapped. */
function clearFoot(sim: Sim, b: Building) {
  const { w, h } = BUILDINGS[b.kind];
  for (const u of sim.units) {
    if (naval(u.kind)) continue;
    if (u.x < b.tx || u.y < b.ty || u.x >= b.tx + w || u.y >= b.ty + h) continue;
    const spot = freeSpot(sim, u.x, u.y, u.owner);
    u.x = spot.x;
    u.y = spot.y;
    u.path = [];
    u.goalKey = "";
  }
}

function farmOwner(sim: Sim, n: Node) {
  return sim.buildings.find((b) => b.kind === "farm" && b.tx === n.x && b.ty === n.y)?.owner;
}

/** Closest source of the same kind, so folk keep working when one runs out. */
function nextNode(sim: Sim, u: Unit, kind: Node["kind"]) {
  let best: Node | null = null;
  let bd = naval(u.kind) ? 24 : 9;
  for (const n of sim.nodes) {
    if (n.kind !== kind || (!n.farm && n.amount <= 0) || n.sea !== naval(u.kind)) continue;
    if (n.farm && farmOwner(sim, n) !== u.owner) continue;
    const d = Math.hypot(n.x + 0.5 - u.x, n.y + 0.5 - u.y);
    if (d < bd && canReachNode(sim, u, n)) {
      bd = d;
      best = n;
    }
  }
  return best;
}

function nearestStand(sim: Sim, owner: PlayerId, ux: number, uy: number, tx: number, ty: number, w: number, h: number) {
  let best: { x: number; y: number } | null = null;
  let bd = 1e9;
  for (let y = ty - 1; y <= ty + h; y++) {
    for (let x = tx - 1; x <= tx + w; x++) {
      const inside = x >= tx && x < tx + w && y >= ty && y < ty + h;
      if (inside) continue;
      if (blockedCell(sim, x, y, owner)) continue;
      if (!connected(sim, ux, uy, x, y, owner)) continue;
      const cx = x + 0.5;
      const cy = y + 0.5;
      const d = (cx - ux) ** 2 + (cy - uy) ** 2;
      if (d < bd) {
        bd = d;
        best = { x: cx, y: cy };
      }
    }
  }
  return best;
}

const nodeCache = new WeakMap<Node[], { size: number; map: Map<number, Node> }>();
export function anyNode(sim: Sim, id: number) {
  let c = nodeCache.get(sim.nodes);
  if (!c || c.size !== sim.nodes.length) {
    c = { size: sim.nodes.length, map: new Map(sim.nodes.map((n) => [n.id, n])) };
    nodeCache.set(sim.nodes, c);
  }
  return c.map.get(id);
}

function unitById(sim: Sim, id: number) {
  return sim.units.find((u) => u.id === id && u.hp > 0);
}
function buildingById(sim: Sim, id: number) {
  return sim.buildings.find((b) => b.id === id && b.hp > 0);
}
function nodeById(sim: Sim, id: number) {
  const n = anyNode(sim, id);
  return n && (n.amount > 0 || n.farm) ? n : undefined;
}

export function selectedUnits(sim: Sim, p: PlayerId) {
  return sim.sel[p].units.map((id) => unitById(sim, id)).filter((u): u is Unit => !!u);
}

function tryMove(sim: Sim, u: Unit, dx: number, dy: number) {
  const nx = u.x + dx;
  const ny = u.y + dy;
  if (!solid(sim, u, Math.floor(nx), Math.floor(ny))) {
    u.x = nx;
    u.y = ny;
    return true;
  }
  if (!solid(sim, u, Math.floor(nx), Math.floor(u.y))) {
    u.x = nx;
    return true;
  }
  if (!solid(sim, u, Math.floor(u.x), Math.floor(ny))) {
    u.y = ny;
    return true;
  }
  return false;
}

function moveToward(sim: Sim, u: Unit, x: number, y: number, dt: number) {
  const spec = unitStats(sim, u.owner, u.kind);
  const key = `${x.toFixed(1)},${y.toFixed(1)}`;
  u.repath = Math.max(0, u.repath - dt);
  const dist = Math.hypot(u.x - x, u.y - y);
  if (u.goalKey !== key && u.repath <= 0) {
    u.path = findPath((cx, cy) => solid(sim, u, cx, cy), u.x, u.y, x, y);
    u.goalKey = key;
    u.repath = 0.45;
  }
  let tx = x;
  let ty = y;
  if (u.path.length) {
    const wp = u.path[0]!;
    if (Math.hypot(u.x - wp.x, u.y - wp.y) < 0.18) u.path.shift();
    if (u.path.length) {
      tx = u.path[0]!.x;
      ty = u.path[0]!.y;
    }
  }
  const dx = tx - u.x;
  const dy = ty - u.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.08) {
    if (dist < 0.28) return true;
    return dist < 0.45;
  }
  const step = Math.min(d, spec.speed * dt);
  const ox = u.x;
  const oy = u.y;
  const moved = tryMove(sim, u, (dx / d) * step, (dy / d) * step);
  const travel = Math.hypot(u.x - ox, u.y - oy);
  if (travel > 0.004) {
    u.fx = (u.x - ox) / travel;
    u.fy = (u.y - oy) / travel;
    u.anim += dt * 8;
    u.stuck = 0;
  } else {
    u.stuck += dt;
    if (u.stuck > 0.45) {
      u.repath = 0;
      u.goalKey = "";
      u.path.shift();
      u.stuck = 0;
    }
  }
  if (!moved && dist < 0.6) return true;
  return dist < 0.22;
}

/**
 * People standing close together drift apart. Anyone on the move walks straight through
 * others (no jams in gaps or on paths); those standing still step aside for them.
 */
function separate(sim: Sim) {
  const list = sim.units.filter((u) => u.hp > 0 && !u.aboard);
  for (let i = 0; i < list.length; i++) {
    const a = list[i]!;
    if (a.order.t === "move" || (a.order.t !== "idle" && a.path.length > 0)) continue;
    let px = 0;
    let py = 0;
    for (let j = 0; j < list.length; j++) {
      if (i === j) continue;
      const b = list[j]!;
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      if (!dx && !dy) {
        // exactly on top of each other: part in a direction set by who they are
        const ang = (a.id - b.id) * 2.399963;
        dx = Math.cos(ang) * 0.01;
        dy = Math.sin(ang) * 0.01;
      }
      const d = Math.hypot(dx, dy);
      const room = naval(a.kind) && naval(b.kind) ? 0.85 : 0.46;
      if (d < room) {
        const push = (room - d) / room;
        px += (dx / d) * push;
        py += (dy / d) * push;
      }
    }
    if (px || py) tryMove(sim, a, px * 0.08, py * 0.08);
  }
}

function ping(sim: Sim, name: string) {
  if (sim.sfxCd > 0) return;
  sim.fxQueue.push(name);
  sim.sfxCd = 0.07;
}

function burst(sim: Sim, x: number, y: number, color: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 0.4 + Math.random() * 1.6;
    sim.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.35 + Math.random() * 0.35,
      max: 0.7,
      color,
      size: 2 + Math.random() * 2,
    });
  }
  if (sim.particles.length > 180) sim.particles.splice(0, sim.particles.length - 180);
}

function floatText(sim: Sim, x: number, y: number, text: string, color: string) {
  sim.floaters.push({ x, y, text, life: 0.9, color });
  if (sim.floaters.length > 48) sim.floaters.splice(0, sim.floaters.length - 48);
}

function destroyBuilding(sim: Sim, b: Building) {
  b.hp = 0;
  sim.mapVer++;
  for (const q of b.queue) refund(sim.res[b.owner], unitCost(sim, b.owner, q.kind));
  b.queue = [];
  if (b.kind === "farm") {
    sim.nodes = sim.nodes.filter((n) => !(n.farm && n.x === b.tx && n.y === b.ty));
  }
  burst(sim, b.tx + BUILDINGS[b.kind].w / 2, b.ty + BUILDINGS[b.kind].h / 2, "#c4a574", 16);
  for (const u of sim.units) {
    if (u.order.t === "build" && u.order.id === b.id) u.order = { t: "idle" };
    if (u.order.t === "attack" && u.order.kind === "building" && u.order.id === b.id) {
      u.order = u.order.after ?? (u.order.resume ? { t: "move", ...u.order.resume } : { t: "idle" });
      u.goalKey = "";
    }
  }
}

function hurtUnit(sim: Sim, u: Unit, dmg: number, src?: { kind: "unit" | "building"; id: number }) {
  if (src) u.hitBy = { ...src, at: sim.clock };
  if (u.kind !== "ram" && SOLDIERS.includes(u.kind)) {
    if (has(sim, u.owner, "armor")) dmg *= 0.8;
    if (has(sim, u.owner, "armor2")) dmg *= 0.8;
  }
  u.hp -= dmg;
  u.flash = 0.16;
  floatText(sim, u.x, u.y - 0.2, String(Math.round(dmg)), "#f0e2c4");
  ping(sim, "hit");
  if (u.hp <= 0) {
    u.hp = 0;
    burst(sim, u.x, u.y, SEATS[u.owner].main, 8);
    if (u.cargo?.length) setNote(sim, u.owner, `Your transport sank with ${u.cargo.length} aboard`);
    u.cargo = undefined;
    for (const o of sim.units) {
      if (o.order.t === "attack" && o.order.kind === "unit" && o.order.id === u.id) {
        o.order = o.order.after ?? (o.order.resume ? { t: "move", ...o.order.resume } : { t: "idle" });
        o.goalKey = "";
      }
    }
  }
}

function hurtBuilding(sim: Sim, b: Building, dmg: number, from: PlayerId, src?: { kind: "unit" | "building"; id: number }) {
  if (src) b.hitBy = { ...src, at: sim.clock };
  b.hp -= dmg;
  floatText(sim, b.tx + BUILDINGS[b.kind].w / 2, b.ty, String(Math.round(dmg)), "#e2b045");
  if (central(b.kind)) sim.shake[b.owner] = Math.min(1, sim.shake[b.owner] + 0.45);
  if (from !== b.owner) b.seen |= 1 << from;
  if (b.hp <= 0) destroyBuilding(sim, b);
}

function launchArrow(sim: Sim, owner: PlayerId, x: number, y: number, kind: "unit" | "building", id: number, dmg: number, ball = false, src?: { kind: "unit" | "building"; id: number }) {
  let tx = x;
  let ty = y;
  if (kind === "unit") {
    const u = unitById(sim, id);
    if (!u) return;
    tx = u.x;
    ty = u.y;
  } else {
    const b = buildingById(sim, id);
    if (!b) return;
    tx = b.tx + BUILDINGS[b.kind].w / 2;
    ty = b.ty + BUILDINGS[b.kind].h / 2;
  }
  sim.arrows.push({ x, y, tx, ty, owner, dmg, kind, id, ball, src });
}

function nearestEnemy(sim: Sim, u: Unit, radius: number) {
  let best: Unit | null = null;
  let bd = radius;
  for (const o of sim.units) {
    if (o.hp <= 0 || o.aboard || allied(sim, u.owner, o.owner)) continue;
    const d = Math.hypot(o.x - u.x, o.y - u.y);
    // across the shoreline, only what is already within reach counts
    const inReach = d <= unitStats(sim, u.owner, u.kind).range + 0.25;
    if (d < bd && (inReach || (naval(o.kind) === naval(u.kind) && reaches(sim, u, u.x, u.y, Math.floor(o.x), Math.floor(o.y))))) {
      bd = d;
      best = o;
    }
  }
  return best;
}

/** The enemy behind a blow, if this unit can get at them. */
function answerable(sim: Sim, u: Unit, hit: { kind: "unit" | "building"; id: number }): Unit | Building | null {
  const range = unitStats(sim, u.owner, u.kind).range;
  if (hit.kind === "unit") {
    const o = unitById(sim, hit.id);
    if (!o || o.hp <= 0 || o.aboard || allied(sim, u.owner, o.owner)) return null;
    const d = Math.hypot(o.x - u.x, o.y - u.y);
    if (d <= range + 0.5) return o;
    if (naval(o.kind) !== naval(u.kind) || d > 14) return null;
    return reaches(sim, u, u.x, u.y, Math.floor(o.x), Math.floor(o.y)) ? o : null;
  }
  const b = buildingById(sim, hit.id);
  if (!b || b.hp <= 0 || allied(sim, u.owner, b.owner)) return null;
  const s = BUILDINGS[b.kind];
  const d = distToRect(u.x, u.y, b.tx, b.ty, s.w, s.h);
  return d <= 14 && (!naval(u.kind) || d <= range + 1.5) ? b : null;
}

/** How far from its post a sentry will run to defend. */
const SENTRY_REACH = 12;

/** A sentry looks for its own side's buildings and people under attack near its post, and goes to help. */
function defend(sim: Sim, u: Unit) {
  const home = u.post ?? { x: u.x, y: u.y };
  let best: { kind: "unit" | "building"; id: number } | null = null;
  let bd = SENTRY_REACH;
  const consider = (hit: Hit | undefined, d: number) => {
    if (!hit || sim.clock - hit.at > 4 || d >= bd) return;
    const foe = answerable(sim, u, hit);
    if (foe) {
      best = { kind: hit.kind, id: hit.id };
      bd = d;
    }
  };
  for (const b of sim.buildings) {
    if (b.hp <= 0 || !allied(sim, u.owner, b.owner) || !b.hitBy) continue;
    const s = BUILDINGS[b.kind];
    consider(b.hitBy, distToRect(home.x, home.y, b.tx, b.ty, s.w, s.h));
  }
  for (const o of sim.units) {
    if (o === u || o.hp <= 0 || !o.hitBy || !allied(sim, u.owner, o.owner)) continue;
    consider(o.hitBy, Math.hypot(o.x - home.x, o.y - home.y));
  }
  const go = best as { kind: "unit" | "building"; id: number } | null;
  if (go) {
    u.order = { t: "attack", kind: go.kind, id: go.id, resume: { x: home.x, y: home.y, hunt: true } };
    u.path = [];
    u.goalKey = "";
  }
}

/** Turns sentry duty on or off for the chosen soldiers. Their post is where they stand (or are going). */
export function toggleSentry(sim: Sim, p: PlayerId) {
  const army = selectedUnits(sim, p).filter((u) => fights(u.kind));
  if (!army.length) return;
  const on = !army.every((u) => u.sentry);
  for (const u of army) {
    u.sentry = on;
    u.post = on ? (u.order.t === "move" ? { x: u.order.x, y: u.order.y } : { x: u.x, y: u.y }) : undefined;
  }
  setNote(sim, p, on ? "Sentries will defend what is near them" : "Sentry duty is off");
  sim.uiDirty = true;
}

/** When walls seal off a target, attack the wall or building that is in the way. */
function breach(sim: Sim, u: Unit, gx: number, gy: number) {
  let best: Building | null = null;
  let bd = 1e9;
  for (const b of sim.buildings) {
    if (b.hp <= 0 || allied(sim, u.owner, b.owner)) continue;
    const spec = BUILDINGS[b.kind];
    const d = Math.hypot(b.tx + spec.w / 2 - u.x, b.ty + spec.h / 2 - u.y) + Math.hypot(b.tx + spec.w / 2 - gx, b.ty + spec.h / 2 - gy);
    if (d < bd && nearestStand(sim, u.owner, u.x, u.y, b.tx, b.ty, spec.w, spec.h)) {
      bd = d;
      best = b;
    }
  }
  const before = u.order;
  u.order = best ? { t: "attack", kind: "building", id: best.id, resume: null, after: before.t === "attack" ? { ...before, after: undefined } : before } : { t: "idle" };
  u.path = [];
  u.goalKey = "";
}

/** The nearest unfinished building, so builders carry on down a row of walls. */
function nextSite(sim: Sim, u: Unit) {
  let best: Building | null = null;
  let bd = 16;
  for (const b of sim.buildings) {
    if (b.owner !== u.owner || b.hp <= 0 || b.progress >= 1) continue;
    const spec = BUILDINGS[b.kind];
    const d = Math.hypot(b.tx + spec.w / 2 - u.x, b.ty + spec.h / 2 - u.y);
    if (d < bd && nearestStand(sim, u.owner, u.x, u.y, b.tx, b.ty, spec.w, spec.h)) {
      bd = d;
      best = b;
    }
  }
  return best;
}

/** Where this unit would stand (or moor) beside a rectangle. */
function standBy(sim: Sim, u: Unit, tx: number, ty: number, w: number, h: number) {
  return naval(u.kind) ? mooring(sim, u, u.x, u.y, tx, ty, w, h) : nearestStand(sim, u.owner, u.x, u.y, tx, ty, w, h);
}

function dropSite(sim: Sim, u: Unit) {
  let best: Building | null = null;
  let bd = 1e9;
  for (const b of sim.buildings) {
    const takes = naval(u.kind) ? b.kind === "dock" : central(b.kind) || b.kind === "store";
    if (b.owner !== u.owner || !takes || b.hp <= 0 || b.progress < 1) continue;
    const spec = BUILDINGS[b.kind];
    const d = distToRect(u.x, u.y, b.tx, b.ty, spec.w, spec.h);
    if (d < bd && standBy(sim, u, b.tx, b.ty, spec.w, spec.h)) {
      bd = d;
      best = b;
    }
  }
  return best;
}

const shoots = (k: UnitKind) => k === "archer" || k === "galley" || k === "bombard";

const BOARD_REACH = 1.9;

/** Water this ship can sail to, beside dry ground, as close as possible to a point. */
export function landing(sim: Sim, boat: Unit, x: number, y: number, walker?: Unit) {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  let best: { x: number; y: number; lx: number; ly: number } | null = null;
  let bd = 1e9;
  const far = Math.max(COLS, ROWS);
  for (let r = 0; r <= far && r <= bd + 1.5; r++) {
    for (let ty = fy - r; ty <= fy + r; ty++) {
      for (let tx = fx - r; tx <= fx + r; tx += Math.abs(ty - fy) === r ? 1 : Math.max(1, 2 * r)) {
        // tx, ty is dry ground; look for sailable water next to it
        if (wet(tx, ty) || blockedCell(sim, tx, ty, boat.owner)) continue;
        const d = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
        if (d >= bd || (walker && !connected(sim, walker.x, walker.y, tx, ty, walker.owner))) continue;
        for (const [wx, wy] of [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]] as const) {
          if (!wet(wx, wy) || !reaches(sim, boat, boat.x, boat.y, wx, wy)) continue;
          bd = d;
          best = { x: wx + 0.5, y: wy + 0.5, lx: tx + 0.5, ly: ty + 0.5 };
          break;
        }
      }
    }
  }
  return best;
}

/** Sets everyone aboard down on dry ground beside the ship, nearest to (x, y). */
function disembark(sim: Sim, boat: Unit, x: number, y: number) {
  const riders = boat.cargo ?? [];
  if (!riders.length) return;
  const open: { x: number; y: number; d: number }[] = [];
  for (let ty = Math.floor(boat.y) - 3; ty <= Math.floor(boat.y) + 3; ty++) {
    for (let tx = Math.floor(boat.x) - 3; tx <= Math.floor(boat.x) + 3; tx++) {
      if (wet(tx, ty) || blockedCell(sim, tx, ty, boat.owner)) continue;
      if (Math.hypot(tx + 0.5 - boat.x, ty + 0.5 - boat.y) > 3) continue;
      open.push({ x: tx + 0.5, y: ty + 0.5, d: Math.hypot(tx + 0.5 - x, ty + 0.5 - y) });
    }
  }
  if (!open.length) {
    setNote(sim, boat.owner, "No room to land here");
    return;
  }
  open.sort((a, b) => a.d - b.d);
  // keep the party on one shore: only ground joined to the chosen spot
  const first = open[0]!;
  const spots = open.filter((s) => connected(sim, first.x, first.y, Math.floor(s.x), Math.floor(s.y), boat.owner));
  riders.forEach((u, i) => {
    const at = spots[i % spots.length]!;
    u.aboard = false;
    u.x = at.x + (i >= spots.length ? 0.2 : 0);
    u.y = at.y;
    u.order = { t: "idle" };
    u.path = [];
    u.goalKey = "";
    sim.units.push(u);
  });
  boat.cargo = [];
  sim.uiDirty = true;
}

/** Send people to a transport, bringing it in to shore if they cannot reach it where it is. */
export function orderBoard(sim: Sim, p: PlayerId, boat: Unit, riders: Unit[]) {
  let room = HOLD - loadOf(boat);
  const going = riders.filter((u) => !naval(u.kind) && (room -= berth(u.kind)) >= 0);
  const lead = going[0];
  if (!lead) {
    setNote(sim, p, "The transport is full");
    return;
  }
  const close = !!firingSpot(sim, lead, boat.x, boat.y, 0, 0, BOARD_REACH - 0.15);
  const mid = { x: (lead.x + boat.x) / 2, y: (lead.y + boat.y) / 2 };
  const meet = close ? null : landing(sim, boat, mid.x, mid.y, lead);
  if (!close && !meet) {
    setNote(sim, p, "The transport cannot reach your shore");
    return;
  }
  if (meet) {
    boat.order = { t: "move", x: meet.x, y: meet.y, hunt: false };
    boat.path = [];
    boat.goalKey = "";
  }
  for (const u of going) {
    u.order = { t: "board", id: boat.id, x: meet?.lx ?? u.x, y: meet?.ly ?? u.y };
    u.path = [];
    u.goalKey = "";
  }
  if (going.length < riders.length) setNote(sim, p, `Room for ${going.length} of ${riders.length}`);
}

/** Sail to the shore nearest (x, y) and put everyone off. */
export function orderUnload(sim: Sim, p: PlayerId, boat: Unit, x: number, y: number) {
  const at = landing(sim, boat, x, y);
  if (!at) {
    setNote(sim, p, "No shore the ship can reach");
    return false;
  }
  boat.order = { t: "unload", x: at.x, y: at.y, lx: at.lx, ly: at.ly };
  boat.path = [];
  boat.goalKey = "";
  return true;
}

export function unloadSelected(sim: Sim, p: PlayerId) {
  for (const boat of selectedUnits(sim, p)) if (boat.cargo?.length) orderUnload(sim, p, boat, boat.x, boat.y);
  sim.uiDirty = true;
}

function stepUnit(sim: Sim, u: Unit, dt: number) {
  if (u.hp <= 0) return;
  u.cd = Math.max(0, u.cd - dt);
  u.flash = Math.max(0, u.flash - dt);
  const spec = { ...unitStats(sim, u.owner, u.kind), cd: UNITS[u.kind].cd, siege: UNITS[u.kind].siege };
  const ship = naval(u.kind);

  // whoever just hurt a soldier gets an answer, unless it was told to go somewhere
  if (u.hitBy && u.hitBy.at !== u.answered) {
    const hit = u.hitBy;
    u.answered = hit.at;
    const o = u.order;
    if (sim.clock - hit.at < 3 && fights(u.kind) && (o.t === "idle" || (o.t === "move" && o.hunt) || (o.t === "attack" && o.kind === "building" && hit.kind === "unit"))) {
      const foe = answerable(sim, u, hit);
      if (foe) {
        const resume = o.t === "move" ? { x: o.x, y: o.y, hunt: true } : o.t === "idle" ? { x: u.x, y: u.y, hunt: true } : null;
        u.order = { t: "attack", kind: hit.kind, id: hit.id, resume, after: o.t === "attack" ? o : undefined };
        u.path = [];
        u.goalKey = "";
      }
    }
  }

  if (u.order.t === "idle" && fights(u.kind)) {
    const foe = nearestEnemy(sim, u, ship ? spec.range + 0.2 : Math.max(3.3, spec.range + 0.6));
    if (foe) u.order = { t: "attack", kind: "unit", id: foe.id, resume: u.sentry ? { x: u.x, y: u.y, hunt: true } : null };
  }

  if (u.sentry && u.order.t === "idle" && fights(u.kind)) defend(sim, u);

  if (u.order.t === "move" && u.order.hunt && fights(u.kind)) {
    const foe = nearestEnemy(sim, u, 4.4);
    if (foe) {
      u.order = { t: "attack", kind: "unit", id: foe.id, resume: { x: u.order.x, y: u.order.y, hunt: true } };
    }
  }

  if (u.order.t === "move" && u.order.hunt && u.kind !== "villager" && !unarmed(u.kind)) {
    const notice = ship ? spec.range : 3.5;
    const near = sim.buildings.find((b) => !allied(sim, u.owner, b.owner) && b.hp > 0 && !BUILDINGS[b.kind].wall && distToRect(u.x, u.y, b.tx, b.ty, BUILDINGS[b.kind].w, BUILDINGS[b.kind].h) < notice);
    if (near) u.order = { t: "attack", kind: "building", id: near.id, resume: { x: u.order.x, y: u.order.y, hunt: true } };
  }

  if (u.order.t === "gather") {
    const id = u.order.node;
    const n = nodeById(sim, id);
    if (!n) {
      const spent = anyNode(sim, id);
      const next = spent ? nextNode(sim, u, spent.kind) : null;
      u.order = next ? { t: "gather", node: next.id } : u.carry > 0 ? { t: "drop", node: id } : { t: "idle" };
      return;
    }
    const near = n.farm
      ? distToRect(u.x, u.y, n.x, n.y, 2, 2) < REACH
      : distToRect(u.x, u.y, n.x, n.y, 1, 1) < REACH;
    if (near) {
      u.path = [];
      if (u.carryType !== n.kind) u.carry = 0;
      const rate = (n.sea
        ? FISH_RATE * (has(sim, u.owner, "nets") ? 1.4 : 1)
        : (n.farm ? FARM_RATE : GATHER[n.kind]) * (has(sim, u.owner, "tools") ? 1.3 : 1)) * workBonus(sim, u.owner, n);
      const space = Math.max(0, spec.carry - u.carry);
      let got = Math.min(space, rate * dt);
      if (!n.farm) got = Math.min(got, n.amount);
      if (!n.farm) n.amount = Math.max(0, n.amount - got);
      u.carry += got;
      u.carryType = n.kind === "food" ? "food" : n.kind;
      if (n.kind === "wood") u.fx = n.x + 0.5 - u.x;
      if (u.carry >= spec.carry - 0.01) u.order = { t: "drop", node: n.id };
      if (!n.farm && n.amount <= 0) {
        sim.mapVer++;
        burst(sim, n.x + 0.5, n.y + 0.5, "#6b8f4e", 6);
        if (u.carry > 0) u.order = { t: "drop", node: n.id };
        else u.order = { t: "idle" };
      }
    } else {
      const stand = n.sea
        ? reaches(sim, u, u.x, u.y, n.x, n.y) ? { x: n.x + 0.5, y: n.y + 0.5 } : null
        : nearestStand(sim, u.owner, u.x, u.y, n.x, n.y, n.farm ? 2 : 1, n.farm ? 2 : 1);
      if (stand) moveToward(sim, u, stand.x, stand.y, dt);
      else {
        const other = nextNode(sim, u, n.kind);
        u.order = other && other.id !== n.id ? { t: "gather", node: other.id } : { t: "idle" };
      }
    }
    return;
  }

  if (u.order.t === "drop") {
    const hall = dropSite(sim, u);
    if (!hall) {
      u.order = { t: "idle" };
      return;
    }
    const size = BUILDINGS[hall.kind];
    if (distToRect(u.x, u.y, hall.tx, hall.ty, size.w, size.h) < (ship ? 1.2 : REACH)) {
      if (u.carryType && u.carry > 0) {
        const amt = Math.round(u.carry);
        sim.res[u.owner][u.carryType] += amt;
        floatText(sim, u.x, u.y, `+${amt}`, "#e2b045");
        ping(sim, "coin");
      }
      u.carry = 0;
      const backId = u.order.node;
      const spent = anyNode(sim, backId);
      const back = nodeById(sim, backId) ?? (spent ? nextNode(sim, u, spent.kind) : null);
      u.order = back ? { t: "gather", node: back.id } : { t: "idle" };
    } else {
      const stand = standBy(sim, u, hall.tx, hall.ty, size.w, size.h);
      if (stand) moveToward(sim, u, stand.x, stand.y, dt);
    }
    return;
  }

  if (u.order.t === "board") {
    const boat = unitById(sim, u.order.id);
    if (!boat || boat.owner !== u.owner || loadOf(boat) + berth(u.kind) > HOLD) {
      if (boat) setNote(sim, u.owner, "The transport is full");
      u.order = { t: "idle" };
      return;
    }
    if (Math.hypot(boat.x - u.x, boat.y - u.y) <= BOARD_REACH) {
      (boat.cargo ??= []).push(u);
      u.order = { t: "idle" };
      u.path = [];
      u.goalKey = "";
      u.aboard = true;
      sim.uiDirty = true;
      return;
    }
    const near = firingSpot(sim, u, boat.x, boat.y, 0, 0, BOARD_REACH - 0.15);
    moveToward(sim, u, near?.x ?? u.order.x, near?.y ?? u.order.y, dt);
    return;
  }

  if (u.order.t === "unload") {
    const there = Math.hypot(u.x - u.order.x, u.y - u.order.y) < 0.4;
    if (there || moveToward(sim, u, u.order.x, u.order.y, dt) || u.stuck > 0.4) {
      disembark(sim, u, u.order.lx, u.order.ly);
      u.order = { t: "idle" };
    }
    return;
  }

  if (u.order.t === "build") {
    const b = buildingById(sim, u.order.id);
    if (!b || (b.progress >= 1 && b.hp >= maxHp(sim, b.owner, b.kind))) {
      if (b && b.progress >= 1) burst(sim, u.x, u.y, "#e2b045", 4);
      const field = b?.kind === "farm" ? sim.nodes.find((n) => n.farm && n.x === b.tx && n.y === b.ty) : undefined;
      const site = nextSite(sim, u);
      u.order = site ? { t: "build", id: site.id } : field ? { t: "gather", node: field.id } : { t: "idle" };
      return;
    }
    const specB = BUILDINGS[b.kind];
    if (distToRect(u.x, u.y, b.tx, b.ty, specB.w, specB.h) < REACH) {
      u.path = [];
      b.work += 1;
    } else {
      const stand = nearestStand(sim, u.owner, u.x, u.y, b.tx, b.ty, specB.w, specB.h);
      if (stand) moveToward(sim, u, stand.x, stand.y, dt);
      else {
        const site = nextSite(sim, u);
        u.order = site && site.id !== b.id ? { t: "build", id: site.id } : { t: "idle" };
      }
    }
    return;
  }

  if (u.order.t === "attack") {
    const resume = u.order.resume;
    if (u.order.kind === "unit") {
      const target = unitById(sim, u.order.id);
      if (!target) {
        u.order = resume ? { t: "move", ...resume } : { t: "idle" };
        return;
      }
      const d = Math.hypot(target.x - u.x, target.y - u.y);
      u.fx = target.x - u.x;
      u.fy = target.y - u.y;
      if (d <= spec.range + 0.25) {
        u.path = [];
        if (u.cd <= 0 && spec.dmg > 0) {
          if (shoots(u.kind)) launchArrow(sim, u.owner, u.x, u.y, "unit", target.id, spec.dmg, u.kind === "bombard", { kind: "unit", id: u.id });
          else hurtUnit(sim, target, spec.dmg, { kind: "unit", id: u.id });
          u.cd = spec.cd;
        }
      } else if (naval(target.kind) === ship && reaches(sim, u, u.x, u.y, Math.floor(target.x), Math.floor(target.y))) {
        moveToward(sim, u, target.x, target.y, dt);
      } else {
        // the target is over water, on land (for a ship) or behind walls
        const spot = ship || naval(target.kind) ? firingSpot(sim, u, target.x, target.y, 0, 0, spec.range + 0.25) : null;
        if (spot) moveToward(sim, u, spot.x, spot.y, dt);
        else if (!ship && !naval(target.kind)) breach(sim, u, target.x, target.y);
        else u.order = resume ? { t: "move", ...resume } : { t: "idle" };
      }
    } else {
      const target = buildingById(sim, u.order.id);
      if (!target) {
        u.order = resume ? { t: "move", ...resume } : { t: "idle" };
        return;
      }
      const specB = BUILDINGS[target.kind];
      const d = distToRect(u.x, u.y, target.tx, target.ty, specB.w, specB.h);
      const reach = Math.max(spec.range, REACH);
      if (d <= reach) {
        u.path = [];
        if (u.cd <= 0 && spec.dmg > 0) {
          const dmg = spec.dmg * spec.siege;
          if (shoots(u.kind)) launchArrow(sim, u.owner, u.x, u.y, "building", target.id, dmg, u.kind === "bombard", { kind: "unit", id: u.id });
          else hurtBuilding(sim, target, dmg, u.owner, { kind: "unit", id: u.id });
          u.cd = spec.cd;
        }
      } else if (ship) {
        const spot = firingSpot(sim, u, target.tx, target.ty, specB.w, specB.h, reach);
        if (spot) moveToward(sim, u, spot.x, spot.y, dt);
        else u.order = resume ? { t: "move", ...resume } : { t: "idle" };
      } else {
        const stand = nearestStand(sim, u.owner, u.x, u.y, target.tx, target.ty, specB.w, specB.h);
        // a dock may only be open to attack from further off, for those who shoot
        const spot = stand ?? (shoots(u.kind) ? firingSpot(sim, u, target.tx, target.ty, specB.w, specB.h, reach) : null);
        if (spot) moveToward(sim, u, spot.x, spot.y, dt);
        else breach(sim, u, target.tx + specB.w / 2, target.ty + specB.h / 2);
      }
    }
    return;
  }

  if (u.order.t === "move") {
    const goal = ship ? seaSpot(sim, u, u.order.x, u.order.y) : freeSpot(sim, u.order.x, u.order.y, u.owner);
    u.order.x = goal.x;
    u.order.y = goal.y;
    const arrived = moveToward(sim, u, goal.x, goal.y, dt) || (u.stuck > 0.4 && Math.hypot(u.x - goal.x, u.y - goal.y) < 1.2);
    if (arrived) u.order = { t: "idle" };
  }
}

function finishTech(sim: Sim, p: PlayerId, tech: TechKind) {
  const mine = sim.units.filter((u) => u.owner === p).flatMap((u) => [u, ...(u.cargo ?? [])]);
  const before = mine.map((u) => unitStats(sim, p, u.kind).hp);
  sim.tech[p].push(tech);
  // a tougher kind of unit gains the extra health straight away
  mine.forEach((u, i) => (u.hp += unitStats(sim, p, u.kind).hp - before[i]!));
  setNote(sim, p, tech === "age2" || tech === "age3" ? `You have reached the ${TECHS[tech].name}` : `${TECHS[tech].name} ready`);
  if (tech === "age2" || tech === "age3") {
    for (const other of IDS.slice(0, sim.count)) if (other !== p) setNote(sim, other, `${SEATS[p].name} reached the ${TECHS[tech].name}`);
  }
}

function stepBuildings(sim: Sim, dt: number) {
  for (const b of sim.buildings) {
    if (b.hp <= 0) continue;
    const spec = BUILDINGS[b.kind];
    const full = maxHp(sim, b.owner, b.kind);
    if (b.progress >= 1 && b.work > 0) b.hp = Math.min(full, b.hp + (dt * Math.min(3, b.work) * full) / 60);
    if (b.progress < 1 && b.work > 0) {
      const n = Math.min(4, b.work);
      const before = b.progress;
      b.progress = Math.min(1, b.progress + (dt * n) / spec.build);
      b.hp = Math.min(full, b.hp + (b.progress - before) * full);
      if (b.progress >= 1) {
        b.hp = full;
        if (b.kind === "farm") addFarmNode(sim, b);
        if (b.kind === "gate") sim.mapVer++;
        burst(sim, b.tx + spec.w / 2, b.ty + spec.h / 2, "#e2b045", 10);
        ping(sim, "raise");
      }
    }
    b.work = 0;
    if (b.progress < 1) continue;
    if (b.upgrade) {
      b.upgrade.left -= dt;
      if (b.upgrade.left <= 0) {
        const gain = maxHp(sim, b.owner, "manor") - maxHp(sim, b.owner, b.kind);
        b.kind = "manor";
        b.hp += gain;
        b.upgrade = null;
        burst(sim, b.tx + 1, b.ty + 1, "#e2b045", 12);
        ping(sim, "raise");
        setNote(sim, b.owner, "A cottage has become a manor");
        sim.uiDirty = true;
      }
    }
    if (b.research) {
      b.research.left -= dt;
      if (b.research.left <= 0) {
        finishTech(sim, b.owner, b.research.tech);
        b.research = null;
        ping(sim, "raise");
      }
    }
    if (b.queue.length) {
      b.queue[0]!.left -= dt;
      if (b.queue[0]!.left <= 0) {
        const kind = b.queue[0]!.kind;
        b.queue.shift();
        const preferY = isNorth(b.owner) ? b.ty + spec.h + 0.2 : b.ty - 0.2;
        let made: Unit | null = null;
        if (naval(kind)) {
          const at = mooring(sim, { owner: b.owner, kind }, b.tx + spec.w / 2, preferY, b.tx, b.ty, spec.w, spec.h, true);
          if (at) made = spawnUnit(sim, b.owner, kind, at.x, at.y);
        } else {
          const spot = nearestStand(sim, b.owner, b.tx + spec.w / 2, preferY, b.tx, b.ty, spec.w, spec.h);
          const sx = spot?.x ?? b.tx + spec.w / 2;
          const sy = spot?.y ?? preferY;
          made = spawnUnit(sim, b.owner, kind, sx, sy);
          const toward = isNorth(b.owner) ? 1.4 : -1.4;
          made.order = { t: "move", x: sx, y: sy + toward, hunt: false };
        }
        if (made && b.rally) sendToRally(sim, made, b.rally);
        // the computer's soldiers stand guard where they are sent
        if (made && sim.ai[b.owner] && fights(made.kind)) {
          made.sentry = true;
          made.post = made.order.t === "move" ? { x: made.order.x, y: made.order.y } : { x: made.x, y: made.y };
        }
      }
    }
    if (spec.attack && b.cd > 0) b.cd -= dt;
    if (spec.attack && b.cd <= 0) {
      let best: { kind: "unit" | "building"; id: number; d: number } | null = null;
      for (const u of sim.units) {
        if (u.hp <= 0 || u.aboard || allied(sim, b.owner, u.owner)) continue;
        const d = Math.hypot(u.x - (b.tx + spec.w / 2), u.y - (b.ty + spec.h / 2));
        if (d <= spec.attack.range && (!best || d < best.d)) best = { kind: "unit", id: u.id, d };
      }
      if (!best && b.kind === "tower") {
        for (const o of sim.buildings) {
          if (o.hp <= 0 || allied(sim, b.owner, o.owner)) continue;
          const d = distToRect(b.tx + spec.w / 2, b.ty + spec.h / 2, o.tx, o.ty, BUILDINGS[o.kind].w, BUILDINGS[o.kind].h);
          if (d <= spec.attack.range && (!best || d < best.d)) best = { kind: "building", id: o.id, d };
        }
      }
      if (best) {
        launchArrow(sim, b.owner, b.tx + spec.w / 2, b.ty + spec.h / 2, best.kind, best.id, spec.attack.dmg, false, { kind: "building", id: b.id });
        b.cd = spec.attack.cd;
      }
    }
  }
}

function stepArrows(sim: Sim, dt: number) {
  for (const a of sim.arrows) {
    const speed = a.ball ? 6.5 : 9;
    if (a.kind === "unit") {
      const u = unitById(sim, a.id);
      if (u) {
        a.tx = u.x;
        a.ty = u.y;
      }
    }
    const dx = a.tx - a.x;
    const dy = a.ty - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.22) {
      if (a.kind === "unit") {
        const u = unitById(sim, a.id);
        if (u) hurtUnit(sim, u, a.dmg, a.src);
      } else {
        const b = buildingById(sim, a.id);
        if (b) hurtBuilding(sim, b, a.dmg, a.owner, a.src);
      }
      burst(sim, a.tx, a.ty, a.ball ? "#ff9a3c" : "#f0e2c4", a.ball ? 10 : 4);
      a.dmg = -1;
    } else {
      a.x += (dx / d) * speed * dt;
      a.y += (dy / d) * speed * dt;
    }
  }
  sim.arrows = sim.arrows.filter((a) => a.dmg >= 0);
}

/** Whether two players may join up: each must have someone left to fight. */
export function canAlly(sim: Sim, a: PlayerId, b: PlayerId) {
  if (a === b || sim.out[a] || sim.out[b] || a >= sim.count || b >= sim.count) return false;
  const left = IDS.slice(0, sim.count).filter((p) => !sim.out[p]);
  const joined = (x: PlayerId, y: PlayerId) => allied(sim, x, y) || (x === a && y === b) || (x === b && y === a);
  // each of the two must still have an opponent afterwards
  return [a, b].every((x) => left.some((y) => !joined(x, y)));
}

export function setAlliance(sim: Sim, a: PlayerId, b: PlayerId, on: boolean) {
  for (const [x, y] of [[a, b], [b, a]] as const) {
    sim.allies[x] = on ? sim.allies[x] | (1 << y) : sim.allies[x] & ~(1 << y);
    sim.offers[x] &= ~(1 << y);
  }
  sim.breaks = sim.breaks.filter((k) => !((k.a === a && k.b === b) || (k.a === b && k.b === a)));
  sim.mapVer++;
  if (on) {
    // lay down arms: drop any attack the new friends had on each other
    const owner = (kind: "unit" | "building", id: number) => (kind === "unit" ? unitById(sim, id)?.owner : buildingById(sim, id)?.owner);
    for (const u of sim.units) {
      if (u.order.t !== "attack" || (u.owner !== a && u.owner !== b)) continue;
      const them = owner(u.order.kind, u.order.id);
      if (them !== undefined && allied(sim, u.owner, them)) {
        u.order = { t: "idle" };
        u.path = [];
      }
    }
    sim.arrows = sim.arrows.filter((x) => {
      const them = owner(x.kind, x.id);
      return them === undefined || !allied(sim, x.owner, them);
    });
  }
  for (const p of IDS.slice(0, sim.count)) {
    const other = p === a ? b : p === b ? a : null;
    setNote(sim, p, other === null
      ? `${SEATS[a].name} and ${SEATS[b].name} ${on ? "are now allies" : "are no longer allies"}`
      : on ? `You are allied with ${SEATS[other].name}` : `Your alliance with ${SEATS[other].name} is over`);
  }
  updateVision(sim);
}

export const WARNING = 10;

/** The one diplomacy button: ask, take back the request, accept, or call an alliance off. */
export function diplomacy(sim: Sim, p: PlayerId, other: PlayerId) {
  if (sim.phase !== "play" || p === other || sim.out[p] || sim.out[other] || other >= sim.count) return;
  if (allied(sim, p, other)) {
    if (sim.breaks.some((k) => (k.a === p && k.b === other) || (k.a === other && k.b === p))) return;
    sim.breaks.push({ a: p, b: other, t: WARNING });
    setNote(sim, p, `Alliance with ${SEATS[other].name} ends in ${WARNING}s`);
    setNote(sim, other, `${SEATS[p].name} is ending your alliance in ${WARNING}s`);
  } else if (!canAlly(sim, p, other)) {
    setNote(sim, p, "Someone must be left to fight");
  } else if (sim.offers[other] & (1 << p)) {
    setAlliance(sim, p, other, true);
  } else if (sim.offers[p] & (1 << other)) {
    sim.offers[p] &= ~(1 << other);
    setNote(sim, p, "Request taken back");
  } else {
    sim.offers[p] |= 1 << other;
    sim.offerAge[p] = 0;
    setNote(sim, p, `You asked ${SEATS[other].name} to be allies`);
    setNote(sim, other, `${SEATS[p].name} wants to be allies`);
  }
  sim.uiDirty = true;
}

function stepDiplomacy(sim: Sim, dt: number) {
  for (const k of sim.breaks) k.t -= dt;
  for (const k of sim.breaks.filter((k) => k.t <= 0)) setAlliance(sim, k.a, k.b, false);
  for (const p of IDS.slice(0, sim.count)) {
    if (!sim.offers[p]) continue;
    sim.offerAge[p] += dt;
    if (sim.offerAge[p] < 3) continue;
    // computers answer after a moment's thought
    for (const q of IDS.slice(0, sim.count)) {
      if (!(sim.offers[p] & (1 << q)) || !sim.ai[q]) continue;
      if (canAlly(sim, p, q) && aiAnswer(sim, q, p)) setAlliance(sim, p, q, true);
      else {
        sim.offers[p] &= ~(1 << q);
        setNote(sim, p, `${SEATS[q].name} said no`);
      }
    }
  }
}

/** A player whose hall has fallen is out, and their people and buildings leave the field. */
function checkWin(sim: Sim) {
  const players = IDS.slice(0, sim.count);
  const fallen = players.filter((p) => !sim.out[p] && !livingTown(sim, p));
  if (!fallen.length && !sim.allies.some(Boolean)) return;
  for (const p of fallen) {
    sim.out[p] = true;
    sim.place[p] = null;
    sim.anchor[p] = null;
    sim.sel[p] = { units: [], building: null };
    for (const q of players) {
      sim.allies[q] &= ~(1 << p);
      sim.offers[q] &= ~(1 << p);
    }
    sim.allies[p] = sim.offers[p] = 0;
    sim.breaks = sim.breaks.filter((k) => k.a !== p && k.b !== p);
    for (const b of sim.buildings) if (b.owner === p && b.hp > 0) destroyBuilding(sim, b);
    for (const u of sim.units) if (u.owner === p) u.hp = 0;
    for (const other of players) if (other !== p) setNote(sim, other, `${SEATS[p].name} is out`);
  }
  if (fallen.length) {
    sim.units = sim.units.filter((u) => u.hp > 0);
    sim.buildings = sim.buildings.filter((b) => b.hp > 0);
    sim.mapVer++;
    sim.uiDirty = true;
  }
  const left = players.filter((p) => !sim.out[p]);
  // it is over when everyone still standing is on the same side, or no person is left playing
  const oneSide = left.every((a) => left.every((b) => allied(sim, a, b)));
  const peopleGone = players.some((p) => !sim.ai[p]) && !left.some((p) => !sim.ai[p]);
  if (!oneSide && !peopleGone) return;
  sim.phase = "end";
  sim.winner = left[0] ?? -1;
  sim.winners = oneSide ? left.reduce<number>((m, p) => m | (1 << p), 0) : 0;
  if (!oneSide) sim.winner = -1;
  sim.uiDirty = true;
}

export function step(sim: Sim, dt: number) {
  if (sim.phase !== "play") return;
  sim.clock += dt;
  for (const p of IDS) {
    sim.shake[p] = Math.max(0, sim.shake[p] - dt * 1.4);
    sim.note[p].t = Math.max(0, sim.note[p].t - dt);
  }
  sim.sfxCd = Math.max(0, sim.sfxCd - dt);
  // people stepping off a transport join the end of the list, so walk a copy
  for (const u of sim.units.slice()) if (!u.aboard) stepUnit(sim, u, dt);
  if (sim.units.some((u) => u.aboard)) sim.units = sim.units.filter((u) => !u.aboard);
  separate(sim);
  stepBuildings(sim, dt);
  settlePrices(sim, dt);
  stepArrows(sim, dt);
  sim.units = sim.units.filter((u) => u.hp > 0);
  const standing = sim.buildings.length;
  sim.buildings = sim.buildings.filter((b) => b.hp > 0);
  if (sim.buildings.length !== standing) sim.mapVer++;
  for (const p of IDS) {
    const bad = sim.bad[p];
    if (bad && (bad.t -= dt) <= 0) sim.bad[p] = null;
  }
  for (const p of sim.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  sim.particles = sim.particles.filter((p) => p.life > 0);
  for (const f of sim.floaters) {
    f.life -= dt;
    f.y -= dt * 0.35;
  }
  sim.floaters = sim.floaters.filter((f) => f.life > 0);
  sim.visionAcc += dt;
  if (sim.visionAcc > 0.25) {
    sim.visionAcc = 0;
    updateVision(sim);
  }
  for (const p of IDS.slice(0, sim.count)) {
    if (!sim.ai[p] || sim.out[p]) continue;
    sim.aiAcc[p] += dt;
    if (sim.aiAcc[p] > LEVEL[sim.level]!.think) {
      sim.aiAcc[p] = 0;
      aiThink(sim, p);
    }
  }
  stepDiplomacy(sim, dt);
  checkWin(sim);
  for (const p of IDS) {
    sim.sel[p].units = sim.sel[p].units.filter((id) => unitById(sim, id));
    if (sim.sel[p].building && !buildingById(sim, sim.sel[p].building!)) sim.sel[p].building = null;
  }
}

export function updateVision(sim: Sim) {
  for (const p of IDS) sim.visible[p].fill(0);
  const players = IDS.slice(0, sim.count);
  const mark = (owner: PlayerId, x: number, y: number, r: number) => {
    // allies see what each other see
    for (const p of players) if (allied(sim, p, owner)) markFor(p, x, y, r);
  };
  const markFor = (p: PlayerId, x: number, y: number, r: number) => {
    const r2 = r * r;
    const x0 = Math.max(0, Math.floor(x - r));
    const x1 = Math.min(COLS - 1, Math.ceil(x + r));
    const y0 = Math.max(0, Math.floor(y - r));
    const y1 = Math.min(ROWS - 1, Math.ceil(y + r));
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const dx = tx + 0.5 - x;
        const dy = ty + 0.5 - y;
        if (dx * dx + dy * dy <= r2) {
          const i = ty * COLS + tx;
          sim.visible[p][i] = 1;
          sim.explored[p][i] = 1;
        }
      }
    }
  };
  for (const u of sim.units) {
    if (u.hp <= 0) continue;
    mark(u.owner, u.x, u.y, UNITS[u.kind].vision);
  }
  for (const b of sim.buildings) {
    if (b.hp <= 0) continue;
    const spec = BUILDINGS[b.kind];
    mark(b.owner, b.tx + spec.w / 2, b.ty + spec.h / 2, b.progress < 1 ? 1.5 : spec.vision);
    for (const p of IDS.slice(0, sim.count)) {
      let see = false;
      for (let y = b.ty; y < b.ty + spec.h && !see; y++) {
        for (let x = b.tx; x < b.tx + spec.w; x++) {
          if (sim.visible[p][y * COLS + x]) see = true;
        }
      }
      if (see) b.seen |= 1 << p;
    }
  }
}

export function canReachNode(sim: Sim, u: Unit, n: Node) {
  if (n.sea !== naval(u.kind)) return false;
  if (n.sea) return reaches(sim, u, u.x, u.y, n.x, n.y);
  const size = n.farm ? 2 : 1;
  return !!nearestStand(sim, u.owner, u.x, u.y, n.x, n.y, size, size);
}

export function canSee(sim: Sim, p: PlayerId, x: number, y: number) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
  return sim.visible[p][ty * COLS + tx] === 1;
}

function formation(i: number, n: number, x: number, y: number, spread = 0.45) {
  if (n <= 1) return { x, y };
  const ang = i * 2.399963;
  const rad = spread * Math.ceil(Math.sqrt(i + 1));
  return { x: x + Math.cos(ang) * rad, y: y + Math.sin(ang) * rad };
}

function pick(sim: Sim, wx: number, wy: number) {
  let unit: Unit | null = null;
  let ud = 0.72;
  for (const u of sim.units) {
    if (u.hp <= 0) continue;
    const d = Math.hypot(u.x - wx, u.y - wy);
    if (d < ud) {
      ud = d;
      unit = u;
    }
  }
  let building: Building | null = null;
  let bd = 0.35;
  for (const b of sim.buildings) {
    if (b.hp <= 0) continue;
    const spec = BUILDINGS[b.kind];
    const d = distToRect(wx, wy, b.tx, b.ty, spec.w, spec.h);
    if (d < bd) {
      bd = d;
      building = b;
    }
  }
  let node: Node | null = null;
  let nd = 0.8;
  for (const n of sim.nodes) {
    if (n.amount <= 0 && !n.farm) continue;
    const d = n.farm
      ? distToRect(wx, wy, n.x, n.y, 2, 2)
      : Math.hypot(n.x + 0.5 - wx, n.y + 0.5 - wy);
    if (d < nd) {
      nd = d;
      node = n;
    }
  }
  return { unit, building, node };
}

export function commandTap(sim: Sim, p: PlayerId, wx: number, wy: number) {
  if (sim.phase !== "play") return;
  if (sim.place[p]) {
    placeAt(sim, p, wx, wy);
    return;
  }
  const hit = pick(sim, wx, wy);
  // allies are not targets: a tap on them is a tap on the ground
  if (hit.unit && hit.unit.owner !== p && allied(sim, p, hit.unit.owner)) hit.unit = null;
  if (hit.building && hit.building.owner !== p && allied(sim, p, hit.building.owner)) hit.building = null;
  if (hit.unit && hit.unit.owner !== p && !canSee(sim, p, hit.unit.x, hit.unit.y)) hit.unit = null;
  if (hit.building && hit.building.owner !== p && !(hit.building.seen & (1 << p))) hit.building = null;
  if (hit.node?.farm && farmOwner(sim, hit.node) !== p) hit.node = null;
  const sel = selectedUnits(sim, p);
  if (hit.unit && hit.unit.owner === p && hit.unit.kind === "transport" && sel.some((u) => !naval(u.kind))) {
    orderBoard(sim, p, hit.unit, sel.filter((u) => !naval(u.kind)));
    sim.uiDirty = true;
    return;
  }
  if (hit.unit && hit.unit.owner === p) {
    const now = sim.clock;
    if (sim.lastTap[p].id === hit.unit.id && now - sim.lastTap[p].at < 0.45) {
      sim.sel[p].units = sim.units.filter((u) => u.owner === p && u.hp > 0 && u.kind === hit.unit!.kind).map((u) => u.id);
      sim.sel[p].building = null;
    } else {
      sim.sel[p].units = [hit.unit.id];
      sim.sel[p].building = null;
    }
    sim.lastTap[p] = { id: hit.unit.id, at: now };
    sim.uiDirty = true;
    return;
  }
  const picked = sim.sel[p].building !== null ? buildingById(sim, sim.sel[p].building) : undefined;
  const trainer = !sel.length && picked && picked.owner === p && picked.progress >= 1 && BUILDINGS[picked.kind].trains?.length ? picked : undefined;
  if (trainer && hit.building === trainer) {
    // tapping the building again clears its gathering point
    if (trainer.rally) {
      trainer.rally = null;
      setNote(sim, p, "New units will wait by the building");
    }
    sim.uiDirty = true;
    return;
  }
  if (trainer && hit.building?.owner === p && hit.building.kind === "farm" && central(trainer.kind)) {
    const field = sim.nodes.find((n) => n.farm && n.x === hit.building!.tx && n.y === hit.building!.ty);
    if (field) return setRally(sim, p, trainer, wx, wy, field);
  }
  if (trainer && !(hit.building && hit.building.owner === p) && !(hit.unit && hit.unit.owner === p)) {
    const n = hit.node && !hit.node.farm ? hit.node : null;
    return setRally(sim, p, trainer, wx, wy, n);
  }
  if (hit.building && hit.building.owner === p) {
    const folks = sel.filter((u) => u.kind === "villager");
    if (folks.length && (hit.building.progress < 1 || hit.building.hp < maxHp(sim, p, hit.building.kind) - 0.5)) {
      for (const f of folks) {
        f.order = { t: "build", id: hit.building.id };
        f.path = [];
        f.goalKey = "";
      }
      sim.uiDirty = true;
      return;
    }
    if (folks.length && hit.building.kind === "farm") {
      const field = sim.nodes.find((n) => n.farm && n.x === hit.building!.tx && n.y === hit.building!.ty);
      if (field) {
        orderGather(sim, folks, field.id);
        sim.uiDirty = true;
        return;
      }
    }
    sim.sel[p] = { units: [], building: hit.building.id };
    sim.uiDirty = true;
    return;
  }
  if (!sel.length) {
    sim.sel[p] = { units: [], building: null };
    sim.uiDirty = true;
    return;
  }
  if (hit.unit && hit.unit.owner !== p) {
    sel.forEach((u) => {
      u.order = u.kind === "ram" || unarmed(u.kind) ? { t: "move", x: wx, y: wy, hunt: false } : { t: "attack", kind: "unit", id: hit.unit!.id, resume: null };
      u.path = [];
      u.goalKey = "";
    });
    sim.uiDirty = true;
    return;
  }
  if (hit.building && hit.building.owner !== p) {
    for (const u of sel) {
      u.order = unarmed(u.kind) ? { t: "move", x: wx, y: wy, hunt: false } : { t: "attack", kind: "building", id: hit.building!.id, resume: null };
      u.path = [];
      u.goalKey = "";
    }
    sim.uiDirty = true;
    return;
  }
  // trees and ore are for folk, fish are for boats
  const workers = hit.node ? sel.filter((u) => u.kind === (hit.node!.sea ? "fisher" : "villager")) : [];
  if (hit.node && workers.length) {
    for (const f of workers) {
      f.order = { t: "gather", node: hit.node.id };
      f.path = [];
      f.goalKey = "";
    }
    sim.uiDirty = true;
    return;
  }
  // loaded transports told to go ashore sail in and unload there
  const carriers = sel.filter((u) => u.cargo?.length);
  if (carriers.length && !wet(Math.floor(wx), Math.floor(wy))) {
    for (const boat of carriers) orderUnload(sim, p, boat, wx, wy);
    sim.uiDirty = true;
    return;
  }
  const armed = (u: Unit) => u.kind !== "villager" && !unarmed(u.kind);
  const hunt = sim.hunt[p] && sel.some(armed);
  const ships = sel.every((u) => naval(u.kind));
  sel.forEach((u, i) => {
    const spot = formation(i, sel.length, wx, wy, ships ? 0.8 : 0.45);
    u.order = { t: "move", x: spot.x, y: spot.y, hunt: hunt && armed(u) };
    // a sentry sent somewhere stands guard there instead
    if (u.sentry) u.post = { x: spot.x, y: spot.y };
    u.path = [];
    u.goalKey = "";
  });
  sim.uiDirty = true;
}

export function selectGroup(sim: Sim, p: PlayerId, which: "folk" | "host" | "idle" | "fleet") {
  const units = sim.units.filter((u) => u.owner === p && u.hp > 0);
  const warships = units.filter((u) => WARSHIPS.includes(u.kind));
  const picked =
    which === "folk"
      ? units.filter((u) => u.kind === "villager")
      : which === "host"
        ? units.filter((u) => SOLDIERS.includes(u.kind))
        : which === "fleet"
          // tap Fleet again to cycle: warships, then transports, then fishing boats
          ? nextFleet(sim, p, [warships, units.filter((u) => u.kind === "transport"), units.filter((u) => u.kind === "fisher")])
          : units.filter((u) => (u.kind === "villager" || u.kind === "fisher") && u.order.t === "idle");
  sim.sel[p] = { units: picked.map((u) => u.id), building: null };
  if (!picked.length) setNote(sim, p, which === "idle" ? "No idle workers" : "None in the field");
  sim.uiDirty = true;
}

function nextFleet(sim: Sim, p: PlayerId, groups: Unit[][]) {
  const full = groups.filter((g) => g.length);
  const now = sim.sel[p].units.join();
  const at = full.findIndex((g) => g.map((u) => u.id).join() === now);
  return full[(at + 1) % Math.max(1, full.length)] ?? [];
}

export function toggleHunt(sim: Sim, p: PlayerId) {
  sim.hunt[p] = !sim.hunt[p];
  sim.uiDirty = true;
}

export function setPlace(sim: Sim, p: PlayerId, kind: BuildingKind | null) {
  sim.place[p] = kind;
  sim.anchor[p] = null;
  sim.uiDirty = true;
}

export function placeReason(sim: Sim, p: PlayerId, kind: BuildingKind, tx: number, ty: number): string | null {
  if (sim.out[p]) return "Your Hall has fallen";
  const spec = BUILDINGS[kind];
  if (spec.age > ageOf(sim, p)) return `Needs the ${AGES[spec.age]} age`;
  if (spec.need) {
    const ok = sim.buildings.some((b) => b.owner === p && b.kind === spec.need && b.hp > 0 && b.progress >= 1);
    if (!ok) return `Raise a ${BUILDINGS[spec.need].name.toLowerCase()} first`;
  }
  if (!canAfford(sim.res[p], spec.cost)) return "Need resources";
  for (let y = ty; y < ty + spec.h; y++) {
    for (let x = tx; x < tx + spec.w; x++) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return "Off the field";
      const c = tileChar(x, y);
      if (c !== "." && c !== "D") return "Blocked ground";
      if (takenCell(sim, x, y) && !(kind === "gate" && ownWall(sim, p, x, y))) return "Blocked ground";
    }
  }
  if (spec.shore && !mooring(sim, { owner: p, kind: "fisher" }, tx, ty, tx, ty, spec.w, spec.h, true)) return "A dock must touch water";
  // a foundation cannot be dropped on top of the other player's people
  if (sim.units.some((u) => !allied(sim, p, u.owner) && u.hp > 0 && !naval(u.kind) && u.x >= tx && u.y >= ty && u.x < tx + spec.w && u.y < ty + spec.h)) {
    return "Someone is standing there";
  }
  for (let y = ty - 1; y <= ty + spec.h; y++) {
    for (let x = tx - 1; x <= tx + spec.w; x++) {
      const inside = x >= tx && x < tx + spec.w && y >= ty && y < ty + spec.h;
      if (!inside && !blockedCell(sim, x, y, p)) return null;
    }
  }
  return "No room to stand";
}

function ownWall(sim: Sim, p: PlayerId, x: number, y: number) {
  return sim.buildings.find((b) => b.owner === p && (b.kind === "wall" || b.kind === "palisade") && b.hp > 0 && b.tx === x && b.ty === y);
}

/** Lays a foundation (paying for it) without choosing builders. */
function found(sim: Sim, p: PlayerId, kind: BuildingKind, tx: number, ty: number) {
  const old = kind === "gate" ? ownWall(sim, p, tx, ty) : undefined;
  if (old) {
    destroyBuilding(sim, old);
    sim.buildings = sim.buildings.filter((b) => b !== old);
  }
  pay(sim.res[p], BUILDINGS[kind].cost);
  const b = spawnBuilding(sim, p, kind, tx, ty, false);
  clearFoot(sim, b);
  return b;
}

/** Selected folk go to work; otherwise the two nearest who are free. Busy builders reach it in turn. */
function assignBuilders(sim: Sim, p: PlayerId, b: Building) {
  let folks = selectedUnits(sim, p).filter((u) => u.kind === "villager");
  if (!folks.length) {
    const all = sim.units.filter((u) => u.owner === p && u.kind === "villager" && u.hp > 0);
    if (all.some((u) => u.order.t === "build")) return;
    folks = all.sort((a, c) => Math.hypot(a.x - b.tx, a.y - b.ty) - Math.hypot(c.x - b.tx, c.y - b.ty)).slice(0, 2);
  }
  for (const f of folks) {
    if (f.order.t === "build" && (buildingById(sim, f.order.id)?.progress ?? 1) < 1) continue;
    f.order = { t: "build", id: b.id };
    f.path = [];
    f.goalKey = "";
  }
}

/** Tiles from a to b with no diagonal gaps. */
export function wallLine(ax: number, ay: number, bx: number, by: number) {
  const out = [{ x: ax, y: ay }];
  const nx = Math.abs(bx - ax);
  const ny = Math.abs(by - ay);
  let x = ax;
  let y = ay;
  for (let ix = 0, iy = 0; ix < nx || iy < ny; ) {
    if (iy >= ny || (ix < nx && (0.5 + ix) / nx < (0.5 + iy) / ny)) {
      x += Math.sign(bx - ax);
      ix++;
    } else {
      y += Math.sign(by - ay);
      iy++;
    }
    out.push({ x, y });
  }
  return out;
}

/** Build the chosen thing where the player tapped. Walls: each further tap runs a line from the last one. */
export function placeAt(sim: Sim, p: PlayerId, wx: number, wy: number) {
  const kind = sim.place[p];
  if (!kind || sim.phase !== "play") return;
  const spec = BUILDINGS[kind];
  let tx = Math.round(wx - spec.w / 2);
  let ty = Math.round(wy - spec.h / 2);
  sim.uiDirty = true;
  if (kind === "wall" || kind === "palisade") {
    const from = sim.anchor[p] ?? { x: tx, y: ty };
    let first: Building | null = null;
    let why: string | null = null;
    for (const t of wallLine(from.x, from.y, tx, ty)) {
      const no = placeReason(sim, p, kind, t.x, t.y);
      if (no) {
        if (!ownWall(sim, p, t.x, t.y)) why = no;
        if (no === "Need resources") break;
        continue;
      }
      const b = found(sim, p, kind, t.x, t.y);
      first ??= b;
    }
    if (first) assignBuilders(sim, p, first);
    if (why) setNote(sim, p, why);
    if (first || ownWall(sim, p, tx, ty)) sim.anchor[p] = { x: tx, y: ty };
    else sim.bad[p] = { tx, ty, w: 1, h: 1, t: 0.8 };
    return;
  }
  let why = placeReason(sim, p, kind, tx, ty);
  // a dock tapped a little off the shoreline slides onto the nearest spot that works
  if (why && spec.shore) {
    const near = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) near.push({ x: tx + dx, y: ty + dy, d: Math.hypot(tx + dx + spec.w / 2 - wx, ty + dy + spec.h / 2 - wy) });
    const fit = near.sort((a, b) => a.d - b.d).find((s) => !placeReason(sim, p, kind, s.x, s.y));
    if (fit) {
      tx = fit.x;
      ty = fit.y;
      why = null;
    }
  }
  if (why) {
    setNote(sim, p, why);
    sim.bad[p] = { tx, ty, w: spec.w, h: spec.h, t: 0.8 };
    return;
  }
  assignBuilders(sim, p, found(sim, p, kind, tx, ty));
  // gates are often placed several at a time; other buildings are one per choice
  if (kind !== "gate") sim.place[p] = null;
}

/** Sends a newly made unit to its building's gathering point. */
function sendToRally(sim: Sim, u: Unit, r: { x: number; y: number; node?: number }) {
  const n = r.node !== undefined ? nodeById(sim, r.node) : undefined;
  if (n && (u.kind === "villager" || u.kind === "fisher") && n.sea === naval(u.kind)) {
    u.order = { t: "gather", node: n.id };
    u.path = [];
    u.goalKey = "";
    return;
  }
  // a little apart, so a crowd does not form on one spot
  const a = u.id * 2.399963;
  const spread = Math.min(0.9, 0.25 + (u.id % 5) * 0.15);
  const x = r.x + Math.cos(a) * spread;
  const y = r.y + Math.sin(a) * spread;
  const at = naval(u.kind) ? seaSpot(sim, u, x, y) : { x, y };
  if (!at) return;
  u.order = { t: "move", x: at.x, y: at.y, hunt: !unarmed(u.kind) && u.kind !== "villager" };
  u.path = [];
  u.goalKey = "";
}

/** Sets or clears where the selected building sends the units it makes. */
function setRally(sim: Sim, p: PlayerId, b: Building, wx: number, wy: number, n: Node | null) {
  if (n) b.rally = { x: n.x + (n.farm ? 1 : 0.5), y: n.y + (n.farm ? 1 : 0.5), node: n.id };
  else b.rally = { x: wx, y: wy };
  setNote(sim, p, n && b.kind !== "barracks" && b.kind !== "range" && b.kind !== "stable" && b.kind !== "workshop" ? "New Folk will work there" : "New units will go there");
  sim.uiDirty = true;
}

/** What 100 of a good costs to buy, and fetches when sold, at a player's market. */
export function quote(sim: Sim, p: PlayerId, good: Good) {
  const price = sim.prices[p][good];
  return { buy: Math.round(price * 1.25), sell: Math.round(price * 0.75) };
}

/** Buys or sells 100 of a good for gold at the player's market. Each trade moves the price. */
export function trade(sim: Sim, p: PlayerId, good: Good, buy: boolean) {
  if (!GOODS.includes(good)) return;
  if (!sim.buildings.some((b) => b.owner === p && b.kind === "market" && b.progress >= 1 && b.hp > 0)) return setNote(sim, p, "Build a market first");
  const q = quote(sim, p, good);
  const res = sim.res[p];
  if (buy) {
    if (res.gold < q.buy) return setNote(sim, p, `Need ${q.buy} gold`);
    res.gold -= q.buy;
    res[good] += 100;
    sim.prices[p][good] = Math.min(450, sim.prices[p][good] + 7);
  } else {
    if (res[good] < 100) return setNote(sim, p, `Need 100 ${good} to sell`);
    res[good] -= 100;
    res.gold += q.sell;
    sim.prices[p][good] = Math.max(20, sim.prices[p][good] - 7);
  }
  ping(sim, "click");
  sim.uiDirty = true;
}

/** Prices drift slowly back towards normal. */
function settlePrices(sim: Sim, dt: number) {
  for (const prices of sim.prices)
    for (const g of GOODS) {
      const d = BASE_PRICE - prices[g];
      if (d) prices[g] += Math.sign(d) * Math.min(Math.abs(d), dt * 0.5);
    }
}

/** Starts enlarging the selected cottage into a manor, which houses more people. */
export function enlarge(sim: Sim, p: PlayerId) {
  const b = sim.sel[p].building !== null ? buildingById(sim, sim.sel[p].building) : undefined;
  if (!b || b.owner !== p || b.kind !== "house" || b.progress < 1 || b.upgrade) return;
  const spec = BUILDINGS.manor;
  if (ageOf(sim, p) < spec.age) return setNote(sim, p, `${AGES[spec.age]} age is needed first`);
  if (!canAfford(sim.res[p], spec.cost)) return setNote(sim, p, "Not enough to build a manor");
  pay(sim.res[p], spec.cost);
  b.upgrade = { left: spec.build };
  setNote(sim, p, "The cottage is being enlarged");
  ping(sim, "click");
  sim.uiDirty = true;
}

/** Tear down the selected building. An unfinished one returns its cost. */
export function demolish(sim: Sim, p: PlayerId) {
  const id = sim.sel[p].building;
  const b = id ? buildingById(sim, id) : undefined;
  if (!b || b.owner !== p || b.kind === "town") return;
  if (b.progress < 1) refund(sim.res[p], BUILDINGS[b.kind].cost);
  for (const q of b.queue) refund(sim.res[p], unitCost(sim, p, q.kind));
  b.queue = [];
  if (b.research) refund(sim.res[p], TECHS[b.research.tech].cost);
  if (b.upgrade) refund(sim.res[p], BUILDINGS.manor.cost);
  destroyBuilding(sim, b);
  sim.buildings = sim.buildings.filter((o) => o !== b);
  sim.sel[p] = { units: [], building: null };
  sim.uiDirty = true;
}

/** Why an upgrade cannot be started yet, or null if it can (resources aside). */
export function techBlock(sim: Sim, p: PlayerId, tech: TechKind): string | null {
  const t = TECHS[tech];
  if (has(sim, p, tech)) return "Done";
  if (sim.buildings.some((o) => o.owner === p && o.research?.tech === tech)) return "Under way";
  if (t.after && !has(sim, p, t.after)) return `Research ${TECHS[t.after].name} first`;
  if (t.age > ageOf(sim, p)) return `Needs the ${AGES[t.age]} age`;
  if (t.needs && !t.needs.some((k) => hasComplete(sim, p, k))) return `Build a ${t.needs.map((k) => BUILDINGS[k].name.toLowerCase()).join(" or ")} first`;
  return null;
}

export function research(sim: Sim, p: PlayerId, tech: TechKind) {
  const id = sim.sel[p].building;
  const b = id ? buildingById(sim, id) : undefined;
  if (!b || b.owner !== p || b.kind !== TECHS[tech].at || b.progress < 1 || b.research) return;
  const no = techBlock(sim, p, tech);
  if (no) {
    setNote(sim, p, no);
    return;
  }
  if (!canAfford(sim.res[p], TECHS[tech].cost)) {
    setNote(sim, p, "Need resources");
    return;
  }
  pay(sim.res[p], TECHS[tech].cost);
  b.research = { tech, left: TECHS[tech].time };
  sim.uiDirty = true;
}

export function trainUnit(sim: Sim, p: PlayerId, kind: UnitKind) {
  const id = sim.sel[p].building;
  const b = id ? buildingById(sim, id) : undefined;
  if (!b || b.owner !== p || b.progress < 1) return;
  const trains = BUILDINGS[b.kind].trains ?? [];
  if (!trains.includes(kind)) return;
  if (UNITS[kind].age > ageOf(sim, p)) {
    setNote(sim, p, `Needs the ${AGES[UNITS[kind].age]} age`);
    return;
  }
  if (b.queue.length >= 6) {
    setNote(sim, p, "Queue is full");
    return;
  }
  if (soldier(kind) ? armyUsed(sim, p) + 1 > armyCap(sim, p) : popUsed(sim, p) + 1 > popCap(sim, p)) {
    setNote(sim, p, soldier(kind) ? "Need room in a barracks" : "Need a cottage");
    return;
  }
  const cost = unitCost(sim, p, kind);
  if (!canAfford(sim.res[p], cost)) {
    setNote(sim, p, "Need resources");
    return;
  }
  pay(sim.res[p], cost);
  b.queue.push({ kind, left: UNITS[kind].train });
  sim.uiDirty = true;
}

export function orderGather(sim: Sim, units: Unit[], nodeId: number) {
  const sea = !!anyNode(sim, nodeId)?.sea;
  for (const u of units) {
    if (u.kind !== (sea ? "fisher" : "villager")) continue;
    u.order = { t: "gather", node: nodeId };
    u.path = [];
    u.goalKey = "";
  }
}

export function orderMove(sim: Sim, units: Unit[], x: number, y: number, hunt: boolean) {
  const ships = units.every((u) => naval(u.kind));
  units.forEach((u, i) => {
    const spot = formation(i, units.length, x, y, ships ? 0.8 : 0.45);
    u.order = { t: "move", x: spot.x, y: spot.y, hunt: hunt && u.kind !== "villager" && !unarmed(u.kind) };
    if (u.sentry) u.post = { x: spot.x, y: spot.y };
    u.path = [];
    u.goalKey = "";
  });
}

export function aiTryBuild(sim: Sim, p: PlayerId, kind: BuildingKind, near?: { x: number; y: number }) {
  const spec = BUILDINGS[kind];
  const hall = hallOf(sim, p);
  if (!hall) return false;
  const at = near ?? { x: hall.tx, y: hall.ty };
  for (let r = 2; r <= 14; r++) {
    for (let y = at.y - r; y <= at.y + r; y++) {
      for (let x = at.x - r; x <= at.x + r; x++) {
        if (Math.max(Math.abs(x - at.x), Math.abs(y - at.y)) !== r) continue;
        let roomy = true;
        for (let yy = y - 1; yy <= y + spec.h && roomy && !spec.shore; yy++) {
          for (let xx = x - 1; xx <= x + spec.w; xx++) if (blockedCell(sim, xx, yy)) roomy = false;
        }
        if (!roomy || placeReason(sim, p, kind, x, y)) continue;
        const b = found(sim, p, kind, x, y);
        const folks = sim.units
          .filter((u) => u.owner === p && u.kind === "villager" && u.hp > 0 && (u.order.t === "idle" || u.order.t === "gather"))
          .sort((a, c) => Math.hypot(a.x - x, a.y - y) - Math.hypot(c.x - x, c.y - y))
          .slice(0, 2);
        for (const f of folks) {
          f.order = { t: "build", id: b.id };
          f.path = [];
          f.goalKey = "";
        }
        return true;
      }
    }
  }
  return false;
}

export function focusHall(sim: Sim, p: PlayerId) {
  const hall = hallOf(sim, p);
  if (!hall) return;
  const spec = BUILDINGS[hall.kind];
  const v = sim.view[p];
  const tilesH = Math.max(4, v.h / 32);
  // keep the hall and the folk in front of it in view
  const cx = hall.tx + spec.w / 2;
  const cy = hall.ty + spec.h / 2;
  sim.cam[p].x = cx;
  sim.cam[p].y = isNorth(p) ? cy + tilesH * 0.12 : cy - tilesH * 0.12;
  clampCam(sim, p);
}

export function clampCam(sim: Sim, p: PlayerId) {
  const v = sim.view[p];
  const hw = v.w / 32 / 2;
  const hh = v.h / 32 / 2;
  const minX = Math.min(COLS / 2, hw - 0.4);
  const maxX = Math.max(COLS / 2, COLS - hw + 0.4);
  const minY = Math.min(ROWS / 2, hh - 0.4);
  const maxY = Math.max(ROWS / 2, ROWS - hh + 0.4);
  sim.cam[p].x = Math.max(minX, Math.min(maxX, sim.cam[p].x));
  sim.cam[p].y = Math.max(minY, Math.min(maxY, sim.cam[p].y));
}

export function panCam(sim: Sim, p: PlayerId, dx: number, dy: number) {
  sim.cam[p].x += dx;
  sim.cam[p].y += dy;
  clampCam(sim, p);
}

function sideSnap(sim: Sim, p: PlayerId): SideSnap {
  const sel = selectedUnits(sim, p);
  const b = sim.sel[p].building ? buildingById(sim, sim.sel[p].building!) : undefined;
  let selKind: SideSnap["sel"] = "none";
  if (b) selKind = "hall";
  else if (sel.length && sel.every((u) => u.kind === "villager")) selKind = "folk";
  else if (sel.length && sel.every((u) => u.kind === "fisher")) selKind = "boats";
  else if (sel.length && sel.every((u) => u.kind === "transport")) selKind = "carrier";
  else if (sel.length && sel.every((u) => u.kind !== "villager" && !unarmed(u.kind))) selKind = "host";
  else if (sel.length) selKind = "mix";
  const names = sel.reduce<Record<string, number>>((acc, u) => {
    acc[UNITS[u.kind].name] = (acc[UNITS[u.kind].name] ?? 0) + 1;
    return acc;
  }, {});
  const selName = b
    ? BUILDINGS[b.kind].name
    : Object.entries(names)
        .map(([n, c]) => `${c} ${n.toLowerCase()}`)
        .join(", ");
  const placing = sim.place[p];
  const anchored = !!sim.anchor[p];
  const isWall = placing === "wall" || placing === "palisade";
  const placeReasonText = !placing
    ? ""
    : isWall
      ? anchored
        ? "Tap again to run the wall to that spot"
        : "Tap the map to start a wall"
      : placing === "dock"
        ? "Tap the shore to place the dock"
        : placing === "gate"
        ? "Tap open ground or your own wall"
        : `Tap the map to place the ${BUILDINGS[placing].name.toLowerCase()}`;
  const placeOk = !!placing;
  return {
    food: Math.floor(sim.res[p].food),
    wood: Math.floor(sim.res[p].wood),
    gold: Math.floor(sim.res[p].gold),
    stone: Math.floor(sim.res[p].stone),
    pop: popUsed(sim, p),
    cap: popCap(sim, p),
    army: armyUsed(sim, p),
    armyCap: armyCap(sim, p),
    place: placing,
    placeOk,
    placeReason: placeReasonText,
    sel: selKind,
    load: sel.reduce((n, u) => n + loadOf(u), 0),
    hold: sel.filter((u) => u.kind === "transport").length * HOLD,
    age: ageOf(sim, p),
    ships: sim.units.filter((u) => u.owner === p && u.hp > 0 && naval(u.kind)).length,
    anchored,
    selCount: sel.length,
    selName,
    building: b ? b.kind : null,
    train: b && b.progress >= 1 ? (BUILDINGS[b.kind].trains ?? []) : [],
    queue: b ? b.queue.length : 0,
    hp: b ? `${Math.max(0, Math.ceil(b.hp))}/${maxHp(sim, b.owner, b.kind)}` : "",
    hunt: sim.hunt[p],
    note: sim.note[p].t > 0 ? sim.note[p].text : "",
  };
}

export function takeSnap(sim: Sim): Snap {
  return {
    phase: sim.phase,
    mode: sim.mode,
    winner: sim.winner,
    clock: sim.clock,
    sound: sim.sound,
    players: seats((p) => sideSnap(sim, p)),
  };
}

export function hasComplete(sim: Sim, p: PlayerId, kind: BuildingKind) {
  return sim.buildings.some((b) => b.owner === p && b.kind === kind && b.hp > 0 && b.progress >= 1);
}
