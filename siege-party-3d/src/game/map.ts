import { COLS, ROWS, SIZE } from "./content";
import { finishMap, layoutFor, resample, startSpots, type Bases, type Tile } from "./mapgen";

export type Terrain = "grass" | "dirt" | "water";
export type NodeKind = "wood" | "food" | "gold" | "stone";

/**
 * The map is generated once from a fixed seed: one quarter is drawn, then mirrored
 * left-right and north-south so both players get exactly the same ground.
 */
function makeGrid(): string[] {
  const hw = SIZE.w / 2;
  const hh = SIZE.h / 2;
  const q: string[][] = Array.from({ length: hh }, () => Array<string>(hw).fill("."));
  let seed = 20261127;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const blob = (cx: number, cy: number, r: number, c: string, density = 1) => {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        if (x < 0 || y < 0 || x >= hw || y >= hh) continue;
        if (Math.hypot(x - cx, y - cy) <= r + rand() * 0.7 - 0.35 && rand() < density) q[y]![x] = c;
      }
    }
  };
  // A sea down each side, joined to the river, with an inlet reaching toward each hall.
  for (let y = 0; y < hh; y++) {
    const shore = 5 + Math.round(Math.sin(y / 5) * 1.2);
    for (let x = 0; x < shore; x++) q[y]![x] = "~";
  }
  for (let x = 3; x <= 19; x++) {
    const mid = 12 + Math.round(Math.sin(x / 4));
    for (let y = mid - 2; y <= mid + 1; y++) q[y]![x] = "~";
  }
  // Starting resources beside the hall (the hall sits against the centre line).
  blob(23, 14, 1.3, "B");
  blob(19, 6, 3, "T", 0.85);
  blob(23, 21, 2.2, "T", 0.85);
  blob(24, 5, 1.1, "G");
  blob(18, 13, 1.1, "S");
  // Farther out: forests, ponds and richer deposits worth a storehouse.
  blob(11, 3, 4, "T", 0.85);
  blob(12, 19, 4, "T", 0.8);
  blob(11, 33, 3.5, "T", 0.85);
  blob(19, 33, 3.5, "T", 0.8);
  blob(30, 28, 2, "T", 0.8);
  blob(13, 39, 3, "T", 0.8);
  blob(9, 28, 2.6, "~");
  blob(14, 23, 1.7, "G");
  blob(10, 40, 1.9, "G");
  blob(27, 38, 1.5, "G");
  blob(9, 8, 1.4, "S");
  blob(22, 41, 1.5, "S");
  blob(25, 28, 1.2, "B");
  blob(9, 25, 1.2, "B");
  // Roads from the hall to the two crossings on each side.
  const road = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n);
      const y = Math.round(y0 + ((y1 - y0) * i) / n);
      for (const dx of [0, 1]) if (x + dx < hw) q[y]![x + dx] = "D";
    }
  };
  road(30, 17, 30, hh - 1);
  road(30, 22, 9, hh - 8);
  road(9, hh - 8, 9, hh - 1);
  // River across the middle, with fords where the roads cross.
  for (let y = hh - 2; y < hh; y++) {
    for (let x = 0; x < hw; x++) q[y]![x] = (x >= 8 && x <= 11) || x >= hw - 2 ? "D" : "~";
  }
  const north = q.map((r) => r.join("") + [...r].reverse().join(""));
  return [...north, ...[...north].reverse()];
}

const DESIGN = {
  grid: makeGrid(),
  // blue at the bottom, red at the top
  bases: [{ x: 31, y: SIZE.h - 12 }, { x: 31, y: 9 }] as Bases,
};

/** The built-in map at the current size. Other sizes and player counts reshape the design, then make sure it plays. */
function builtIn(players: number) {
  if (players === 2 && COLS === SIZE.w && ROWS === SIZE.h) return DESIGN;
  const raw = resample([...DESIGN.grid.join("")] as Tile[], SIZE.w, SIZE.h, COLS, ROWS);
  const layout = layoutFor(players);
  // five or more cannot be mirrored, so each of their areas is stocked on its own
  return finishMap(raw, startSpots(layout), layout <= 4);
}

/** The map in play: the built-in one, or one made from a picture. */
export let GRID: string[] = DESIGN.grid;
export let BASES: Bases = DESIGN.bases;

/** the built-in map for this many players, at the current size */
export const builtInMap = (players = 2) => builtIn(players);

export function setMap(custom: { grid: string[]; bases: Bases } | null, players = 2) {
  const next = custom ?? builtIn(players);
  GRID = next.grid;
  BASES = next.bases;
}

export type NodeSpawn = { kind: NodeKind; x: number; y: number; amount: number; sea?: boolean };

const FISH = 420;

/**
 * Shoals of fish on any water. The choice depends on the distance from the map's edges,
 * so mirrored maps get mirrored fish. Every pool of six tiles or more has at least one.
 */
function fishSpawns(): NodeSpawn[] {
  const wet = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS && (GRID[y]![x] === "~" || GRID[y]![x] === "F");
  const roll = (x: number, y: number) => {
    const a = Math.min(x, COLS - 1 - x);
    const b = Math.min(y, ROWS - 1 - y);
    const v = Math.sin(a * 91.7 + b * 47.3 + 11.1) * 43758.5453;
    return v - Math.floor(v);
  };
  const out: NodeSpawn[] = [];
  const taken = new Set<number>();
  const add = (x: number, y: number) => {
    out.push({ kind: "food", x, y, amount: FISH, sea: true });
    taken.add(y * COLS + x);
  };
  const crowded = (x: number, y: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (x + dx >= 0 && x + dx < COLS && taken.has((y + dy) * COLS + x + dx)) return true;
    return false;
  };
  // fish placed by hand in the map maker are always there
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (GRID[y]![x] === "F") add(x, y);
  const spots: { x: number; y: number; r: number }[] = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wet(x, y) && !taken.has(y * COLS + x)) spots.push({ x, y, r: roll(x, y) });
  for (const s of spots) if (s.r < 0.16 && !crowded(s.x, s.y)) add(s.x, s.y);
  const seen = new Set<number>();
  for (const s of spots) {
    const start = s.y * COLS + s.x;
    if (seen.has(start)) continue;
    seen.add(start);
    const pool = [start];
    for (let i = 0; i < pool.length; i++) {
      const x = pool[i]! % COLS;
      const y = (pool[i]! / COLS) | 0;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
        const n = ny * COLS + nx;
        if (wet(nx, ny) && !seen.has(n)) {
          seen.add(n);
          pool.push(n);
        }
      }
    }
    if (pool.length >= 6 && !pool.some((i) => taken.has(i))) {
      const i = pool[pool.length >> 1]!;
      add(i % COLS, (i / COLS) | 0);
    }
  }
  return out;
}

const AMOUNT: Record<NodeKind, number> = {
  wood: 120,
  food: 220,
  gold: 400,
  stone: 340,
};

export function tileChar(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return "~";
  return GRID[y]![x]!;
}

export function terrainAt(x: number, y: number): Terrain {
  const c = tileChar(x, y);
  if (c === "~" || c === "F") return "water";
  if (c === "D") return "dirt";
  return "grass";
}

export function nodeSpawns(): NodeSpawn[] {
  const out: NodeSpawn[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = GRID[y]![x]!;
      if (c === "T") out.push({ kind: "wood", x, y, amount: AMOUNT.wood });
      else if (c === "B") out.push({ kind: "food", x, y, amount: AMOUNT.food });
      else if (c === "G") out.push({ kind: "gold", x, y, amount: AMOUNT.gold });
      else if (c === "S") out.push({ kind: "stone", x, y, amount: AMOUNT.stone });
    }
  }
  return out.concat(fishSpawns());
}

export function assertMap() {
  if (GRID.length !== ROWS || GRID.some((r) => r.length !== COLS)) throw new Error("map size");
}
