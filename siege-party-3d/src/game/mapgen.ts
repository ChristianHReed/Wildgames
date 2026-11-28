import { COLS, ROWS, isLeft, isNorth } from "./content";

/** Tile letters: "." grass, "D" dirt, "~" water, "T" trees, "B" berries, "G" gold, "S" stone, "F" fish. */
/** grass, road, water, trees, berries, gold, stone, and water with fish placed by hand */
export type Tile = "." | "D" | "~" | "T" | "B" | "G" | "S" | "F";
export type Spot = { x: number; y: number };
/** Top-left tile of each town hall, by seat: two entries for a duel, four or five for bigger games. */
export type Bases = Spot[];

/** Size of the picture sample: SUB x SUB pixels for every map tile. */
export const SUB = 4;

export function classifyPixel(r: number, g: number, b: number): Tile {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const s = max ? (max - min) / max : 0;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  if (v < 0.16) return "."; // ink lines, labels, deep shadow
  if (s < 0.14) return v > 0.68 || v < 0.3 ? "." : "S"; // paper, snow / grey rock
  if (h >= 170 && h < 255) return s > 0.18 ? "~" : ".";
  if (h >= 68 && h < 170) return v < 0.52 || (s > 0.55 && v < 0.72) ? "T" : ".";
  if (h >= 43 && h < 68) {
    if (s > 0.55 && v > 0.72) return "G";
    return v < 0.45 ? "T" : s > 0.25 ? "D" : ".";
  }
  if (h >= 14 && h < 43) return s > 0.22 ? "D" : ".";
  if (h < 14 || h >= 320) return s > 0.45 && v > 0.4 ? "B" : s > 0.22 ? "D" : ".";
  return ".";
}

/**
 * Reads RGBA pixels (COLS*SUB wide, ROWS*SUB tall). Paper photographed in dim light is
 * brightened first so that it is not mistaken for rock. Thin rivers and small markers
 * need fewer pixels to win a tile than broad ground does.
 */
export function classify(px: Uint8ClampedArray | Uint8Array): Tile[] {
  const lum: number[] = [];
  let pale = 0;
  for (let i = 0; i < px.length; i += 4) {
    const max = Math.max(px[i]!, px[i + 1]!, px[i + 2]!);
    const min = Math.min(px[i]!, px[i + 1]!, px[i + 2]!);
    if (max - min < max * 0.16 && max > 90) pale++;
    lum.push(max);
  }
  lum.sort((a, b) => a - b);
  const white = lum[Math.floor(lum.length * 0.9)]!;
  const gain = pale > lum.length * 0.45 && white > 110 && white < 225 ? 235 / white : 1;

  const out: Tile[] = [];
  const w = COLS * SUB;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const n: Record<Tile, number> = { ".": 0, D: 0, "~": 0, T: 0, B: 0, G: 0, S: 0, F: 0 };
      for (let y = 0; y < SUB; y++) {
        for (let x = 0; x < SUB; x++) {
          const i = ((ty * SUB + y) * w + tx * SUB + x) * 4;
          n[classifyPixel(Math.min(255, px[i]! * gain), Math.min(255, px[i + 1]! * gain), Math.min(255, px[i + 2]! * gain))]++;
        }
      }
      const share = (t: Tile) => n[t] / (SUB * SUB);
      out.push(
        share("~") >= 0.3 ? "~"
        : share("G") >= 0.25 ? "G"
        : share("B") >= 0.25 ? "B"
        : share("T") >= 0.4 ? "T"
        : share("S") >= 0.5 ? "S"
        : share("D") >= 0.35 ? "D"
        : ".",
      );
    }
  }
  return out;
}

const CLEAR = 7;
const open = (t: Tile) => t === "." || t === "D";

/** Stretches a tile map from one size to another. */
export function resample(raw: Tile[], w: number, h: number, toW: number, toH: number): Tile[] {
  const out: Tile[] = [];
  for (let y = 0; y < toH; y++)
    for (let x = 0; x < toW; x++) out.push(raw[Math.floor(((y + 0.5) * h) / toH) * w + Math.floor(((x + 0.5) * w) / toW)]!);
  return out;
}

export function scaleBases(b: Bases, w: number, h: number, toW: number, toH: number): Bases {
  return b.map((s, seat) =>
    clampBase({ x: Math.round(((s.x + 1.5) * toW) / w - 1.5), y: Math.round(((s.y + 1.5) * toH) / h - 1.5) }, seat, b.length),
  );
}

/** How many bases a map is laid out with for this many players. */
export const layoutFor = (players: number) => (players <= 2 ? 2 : players <= 4 ? 4 : 5);

/** The smallest map five halls fit on. */
export const FIVE_MIN = { w: 80, h: 96 };

/** With five, three share the top of the map and two the bottom. */
function column(seat: number): [number, number] {
  const [i, n] = isNorth(seat) ? [[2, 4, 1].indexOf(seat), 3] : [[0, 3].indexOf(seat), 2];
  return [Math.floor((i * COLS) / n), Math.floor(((i + 1) * COLS) / n)];
}

export function clampBase(s: Spot, seat: number, count: number): Spot {
  const HALF = ROWS / 2;
  let x0 = 5;
  let x1 = COLS - 8;
  // with more than two players each seat keeps to its own part of the map
  if (count > 4) {
    const [a, b] = column(seat);
    x0 = a + 5;
    x1 = b - 8;
  } else if (count > 2) {
    if (isLeft(seat)) x1 = COLS / 2 - 9;
    else x0 = COLS / 2 + 6;
  }
  const y0 = isNorth(seat) ? 3 : HALF + 8;
  const y1 = isNorth(seat) ? HALF - 11 : ROWS - 6;
  return { x: Math.max(x0, Math.min(x1, Math.round(s.x))), y: Math.max(y0, Math.min(y1, Math.round(s.y))) };
}

/** The matching spot in another seat's part of a mirrored map. `from` and `to` are seats. */
export function mirrorSpot(s: Spot, from: number, to: number, count: number): Spot {
  const flipX = count > 2 && isLeft(from) !== isLeft(to);
  const flipY = isNorth(from) !== isNorth(to);
  return { x: flipX ? COLS - 3 - s.x : s.x, y: flipY ? ROWS - 3 - s.y : s.y };
}

/** The part of a fair map that gets copied everywhere else: the top half, or its left quarter. */
export const lead = (count: number) => (count > 2 ? 2 : 1);

export function evenBases(one: Spot, count: number): Bases {
  return Array.from({ length: count }, (_, seat) => mirrorSpot(one, lead(count), seat, count));
}

/** Default hall positions for a map of the current size. */
export function startSpots(count: number): Bases {
  if (count > 4)
    return Array.from({ length: count }, (_, seat) => {
      const [a, b] = column(seat);
      return clampBase({ x: Math.round((a + b) / 2) - 1, y: isNorth(seat) ? 9 : ROWS - 12 }, seat, count);
    });
  const x = count > 2 ? Math.round(COLS * 0.22) - 1 : COLS / 2 - 1;
  const first = clampBase({ x, y: 9 }, lead(count), count);
  return evenBases(first, count);
}

/** Picks dry ground near the back of each player's part of the picture. */
export function suggestBases(raw: Tile[], mirror: boolean, count = 2): Bases {
  const home = startSpots(count);
  const best = (seat: number) => {
    let pick = home[seat]!;
    let score = 1e9;
    for (let y = 4; y <= 24; y += 2) {
      for (let x = 5; x <= COLS - 8; x += 2) {
        const at = clampBase({ x, y: isNorth(seat) ? y : ROWS - 3 - y }, seat, count);
        let s = Math.abs(at.x - home[seat]!.x) * 0.5 + Math.abs(y - 9) * 0.8;
        for (let dy = -CLEAR; dy <= CLEAR; dy++) {
          for (let dx = -CLEAR; dx <= CLEAR; dx++) {
            const tx = at.x + 1 + dx;
            const ty = at.y + 1 + dy;
            const t = tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS ? "~" : raw[ty * COLS + tx]!;
            if (t === "~" || t === "F") s += 2;
            else if (!open(t)) s += 0.5;
          }
        }
        if (s < score) {
          score = s;
          pick = at;
        }
      }
    }
    return pick;
  };
  return mirror ? evenBases(best(lead(count)), count) : home.map((_, seat) => best(seat));
}

/** how many resources the game adds to a drawn map: 2 fills every side up to a fair amount,
 * 1 only puts small piles by a Hall that has none, 0 adds nothing */
export type Extra = 0 | 1 | 2;

/**
 * Turns a tile map into a playable one: dry starting areas, enough of every resource for
 * each player (as much as `extra` asks), and a land route between all the halls.
 */
export function finishMap(raw: Tile[], wanted: Bases, mirror: boolean, extra: Extra = 2): { grid: string[]; bases: Bases } {
  const HALF = ROWS / 2;
  const MIDX = COLS / 2;
  const count = wanted.length;
  const four = count > 2;
  const five = count > 4;
  const t = raw.slice();
  const clamped = wanted.map((s, seat) => clampBase(s, seat, count));
  const bases = mirror ? evenBases(clamped[lead(count)]!, count) : clamped;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
  const areas = bases.map((base, seat) => ({
    base,
    f: isNorth(seat) ? 1 : -1,
    x0: five ? column(seat)[0] : four && !isLeft(seat) ? MIDX : 0,
    x1: five ? column(seat)[1] : four && isLeft(seat) ? MIDX : COLS,
    y0: isNorth(seat) ? 0 : HALF,
    y1: isNorth(seat) ? HALF : ROWS,
  }));
  type Area = (typeof areas)[number];
  let seed = 7919;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  const dist = (x: number, y: number, b: Spot) => Math.hypot(x - (b.x + 1), y - (b.y + 1));
  for (const b of bases) {
    for (let y = b.y - CLEAR; y <= b.y + 2 + CLEAR; y++)
      for (let x = b.x - CLEAR; x <= b.x + 2 + CLEAR; x++)
        if (inside(x, y) && dist(x, y, b) <= CLEAR + 0.3 && !open(t[y * COLS + x]!)) t[y * COLS + x] = ".";
  }
  const clearOfBases = (x: number, y: number, by: number) => bases.every((b) => dist(x, y, b) > by);
  const blob = (cx: number, cy: number, r: number, c: Tile, a: Area) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (!inside(x, y) || x < a.x0 || x >= a.x1 || y < a.y0 || y >= a.y1 || Math.hypot(x - cx, y - cy) > r + 0.3) continue;
        if (clearOfBases(x, y, CLEAR + 0.5)) t[y * COLS + x] = c;
      }
  };
  const tally = (c: Tile, a: Area, near?: number) => {
    let n = 0;
    for (let y = a.y0; y < a.y1; y++)
      for (let x = a.x0; x < a.x1; x++) if (t[y * COLS + x] === c && (!near || dist(x, y, a.base) <= near)) n++;
    return n;
  };

  const starters: { c: Tile; need: number; at: [number, number, number][] }[] = [
    { c: "B", need: 5, at: [[-9, 3, 1.3]] },
    { c: "T", need: 24, at: [[-10, -3, 2.6], [10, 4, 2.4]] },
    { c: "G", need: 4, at: [[10, -3, 1.2]] },
    { c: "S", need: 3, at: [[-7, 9, 1.1]] },
  ];
  const totals: [Tile, number][] = four ? [["T", 60], ["B", 8], ["G", 10], ["S", 8]] : [["T", 100], ["B", 12], ["G", 18], ["S", 14]];
  const worked = mirror ? [areas[lead(count)]!] : areas;
  for (const a of extra ? worked : []) {
    for (const s of starters) {
      if (tally(s.c, a, 15) >= s.need) continue;
      for (const [dx, dy, r] of s.at) {
        const cx = a.base.x + 1 + dx;
        const flip = cx < a.x0 + 2 || cx > a.x1 - 3 ? -1 : 1;
        blob(a.base.x + 1 + dx * flip, a.base.y + 1 + dy * a.f, r, s.c, a);
      }
    }
    for (const [c, need] of extra > 1 ? totals : []) {
      for (let tries = 0; tries < 80 && tally(c, a) < need; tries++) {
        const x = a.x0 + 2 + Math.floor(rand() * (a.x1 - a.x0 - 4));
        const y = a.y0 + 3 + Math.floor(rand() * (a.y1 - a.y0 - 6));
        if (open(t[y * COLS + x]!) && dist(x, y, a.base) > 12) blob(x, y, c === "T" ? 2.8 : 1.3, c, a);
      }
    }
  }
  // Cramped or crowded maps: if a starting resource still did not fit, place it on the nearest free tiles.
  const resource = (c: Tile) => c === "B" || c === "G" || c === "S";
  for (const a of extra > 1 ? worked : []) {
    for (const [c, min] of [["B", 4], ["G", 4], ["S", 3], ["T", 12]] as const) {
      let short = min - tally(c, a);
      if (short <= 0) continue;
      const spots: { i: number; d: number }[] = [];
      for (let y = a.y0 + 1; y < a.y1 - 2; y++)
        for (let x = a.x0 + 1; x < a.x1 - 1; x++) {
          const i = y * COLS + x;
          if (t[i] !== c && !resource(t[i]!) && clearOfBases(x, y, CLEAR + 0.5)) spots.push({ i, d: dist(x, y, a.base) });
        }
      spots.sort((m, n) => m.d - n.d);
      for (const spot of spots) {
        if (short-- <= 0) break;
        t[spot.i] = c;
      }
    }
  }
  const copyOut = () => {
    if (!mirror) return;
    if (four) for (let y = 0; y < HALF; y++) for (let x = 0; x < MIDX; x++) t[y * COLS + COLS - 1 - x] = t[y * COLS + x]!;
    for (let y = 0; y < HALF; y++) for (let x = 0; x < COLS; x++) t[(ROWS - 1 - y) * COLS + x] = t[y * COLS + x]!;
  };
  copyOut();

  // Cheapest route to a goal, turning as few blocked tiles as possible into road.
  const carve = (from: Spot, goal: (i: number) => boolean, within?: (i: number) => boolean) => {
    const N = COLS * ROWS;
    const cost = new Int32Array(N).fill(1e9);
    const prev = new Int32Array(N).fill(-1);
    const start = from.y * COLS + from.x;
    cost[start] = 0;
    let now = [start];
    let later: number[] = [];
    for (let level = 0; now.length || later.length; level++) {
      while (now.length) {
        const c = now.pop()!;
        if (cost[c] !== level) continue;
        if (goal(c)) {
          for (let i = prev[c]!; i >= 0; i = prev[i]!) {
            if (open(t[i]!)) continue;
            t[i] = "D";
            const beside = i % COLS < COLS - 1 ? i + 1 : i - 1;
            if (!open(t[beside]!) && !resource(t[beside]!) && !goal(beside) && (!within || within(beside))) t[beside] = "D";
          }
          return;
        }
        const x = c % COLS;
        for (const n of [x > 0 ? c - 1 : -1, x < COLS - 1 ? c + 1 : -1, c - COLS, c + COLS]) {
          if (n < 0 || n >= N || (within && !within(n))) continue;
          const step = open(t[n]!) || goal(n) ? 0 : 1;
          if (level + step < cost[n]!) {
            cost[n] = level + step;
            prev[n] = c;
            (step ? later : now).push(n);
          }
        }
      }
      now = later;
      later = [];
    }
  };
  const front = (a: Area) => ({ x: a.base.x + 1, y: a.f > 0 ? a.base.y + 3 : a.base.y - 1 });
  const has = (a: Area, i: number) => {
    const x = i % COLS;
    const y = Math.floor(i / COLS);
    return x >= a.x0 && x < a.x1 && y >= a.y0 && y < a.y1;
  };
  for (const a of worked) {
    for (const c of ["T", "B", "G", "S"] as const) carve(front(a), (i) => t[i] === c && has(a, i), mirror ? (i) => has(a, i) : undefined);
  }
  copyOut();
  for (const a of areas.slice(1)) {
    const to = front(a);
    carve(front(areas[0]!), (i) => i === to.y * COLS + to.x);
  }
  if (mirror) {
    // keep every part identical after the roads between the halls were cut
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (t[y * COLS + x] !== "D") continue;
        for (const mx of four ? [x, COLS - 1 - x] : [x]) t[y * COLS + mx] = t[(ROWS - 1 - y) * COLS + mx] = "D";
      }
    }
  }

  const grid: string[] = [];
  for (let y = 0; y < ROWS; y++) grid.push(t.slice(y * COLS, (y + 1) * COLS).join(""));
  return { grid, bases };
}

/**
 * A new random map to start from: woods, water and a few resources laid out by chance in one
 * player's part, ready for `finishMap` to copy fairly to the others, clear the bases, top up the
 * resources and cut the roads. The same seed always gives the same map.
 */
export function randomRaw(count: number, seed: number): { raw: Tile[]; bases: Bases; mirror: boolean } {
  let s = seed >>> 0 || 1;
  const rand = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const t: Tile[] = new Array<Tile>(COLS * ROWS).fill(".");
  const HALF = ROWS / 2;
  // a smooth random field: a grid of random values, blended, at a few sizes
  const field = (cell: number) => {
    const gw = Math.ceil(COLS / cell) + 2;
    const gh = Math.ceil(ROWS / cell) + 2;
    const g = Array.from({ length: gw * gh }, rand);
    return (x: number, y: number) => {
      const fx = x / cell;
      const fy = y / cell;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const u = fx - ix;
      const v = fy - iy;
      const a = u * u * (3 - 2 * u);
      const b = v * v * (3 - 2 * v);
      const at = (i: number, j: number) => g[(j + 1) * gw + i + 1] ?? 0.5;
      return (at(ix, iy) * (1 - a) + at(ix + 1, iy) * a) * (1 - b) + (at(ix, iy + 1) * (1 - a) + at(ix + 1, iy + 1) * a) * b;
    };
  };
  const scale = Math.sqrt((COLS * ROWS) / (64 * 96));
  const big = field(14 * Math.max(0.7, scale * 0.8));
  const mid = field(6);
  const small = field(2.5);
  const woods = field(9);
  const wet = (x: number, y: number) => big(x, y) * 0.6 + mid(x, y) * 0.3 + small(x, y) * 0.1;
  const trees = (x: number, y: number) => woods(x, y) * 0.65 + mid(x + 31, y + 17) * 0.25 + small(x + 7, y + 3) * 0.1;
  // what kind of water this map has
  const sea = rand() < 0.55;
  const seaLeft = sea && rand() < 0.8;
  const seaRight = sea && (!seaLeft || rand() < 0.5);
  const river = rand() < 0.5;
  const lakes = 0.65 + rand() * 0.1;
  const forest = 0.6 + rand() * 0.08;
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      const w = wet(x, y);
      // a coast along one or both sides, wavy
      const coast = 2 + Math.round(small(x, y + 50) * 3 + mid(x + 90, y) * 4 * scale);
      if ((seaLeft && x < coast) || (seaRight && x >= COLS - coast)) t[i] = "~";
      else if (w > lakes) t[i] = "~";
      else if (trees(x, y) > forest) t[i] = "T";
      else if (small(x + 13, y + 41) > 0.93) t[i] = "D";
    }
  if (river) {
    // a river between the halves, with fords to cross
    const width = 2 + Math.round(rand() * Math.max(1, scale));
    const fords = new Set<number>();
    const n = 2 + Math.floor(rand() * 2) + Math.floor(scale);
    for (let k = 0; k < n; k++) {
      const x = Math.floor(((k + 0.5) / n) * COLS + (rand() - 0.5) * 6);
      for (let d = -2; d <= 2; d++) fords.add(x + d);
    }
    for (let x = 0; x < COLS; x++) {
      const bend = Math.round((mid(x, 300) - 0.5) * 6 * Math.max(1, scale * 0.7));
      for (let k = 0; k < width; k++) {
        const y = HALF - 1 - k + Math.min(0, bend);
        if (y < 0) continue;
        t[y * COLS + x] = fords.has(x) ? "D" : "~";
      }
    }
  }
  // a few piles of each resource here and there; the rest are topped up fairly
  const scatter = (c: Tile, piles: number, r: number) => {
    for (let k = 0; k < piles; k++) {
      const cx = 3 + rand() * (COLS - 6);
      const cy = 3 + rand() * (HALF - 6);
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++)
          if (x >= 0 && y >= 0 && x < COLS && y < ROWS && Math.hypot(x - cx, y - cy) <= r + 0.2 && t[y * COLS + x] === ".") t[y * COLS + x] = c;
    }
  };
  const area = scale * scale;
  scatter("G", Math.round(1 + rand() * 2 * area), 1.1);
  scatter("S", Math.round(1 + rand() * 2 * area), 1.1);
  scatter("B", Math.round(1 + rand() * 2 * area), 1.2);
  // with two to four players one part is copied to the others; five share no mirror
  const mirror = count <= 4;
  return { raw: t, bases: suggestBases(t, mirror, layoutFor(count)), mirror };
}

/** A whole random map, finished and fair, for this many players. */
export function randomMap(count: number, seed: number) {
  const r = randomRaw(count, seed);
  return finishMap(r.raw, r.bases, r.mirror, 2);
}
