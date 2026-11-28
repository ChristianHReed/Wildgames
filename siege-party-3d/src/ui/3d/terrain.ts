/**
 * The ground in 3D: land as a raised plate with cut, low-poly coastlines (marching squares over the
 * tile centres), cliff walls down to the water, the sides of the board, and little things growing.
 */
import { COLS, ROWS } from "../../game/content";
import { terrainAt, nodeSpawns } from "../../game/map";
import { hash } from "./mesh";

export const WATER_Y = -0.3;
export const CLIFF_Y = -0.85;
export const BOARD_Y = -2.1;
/** cells per side of a chunk of ground */
export const CHUNK = 32;

export type Chunk = { x0: number; z0: number; x1: number; z1: number; v: Float32Array; i: Uint32Array };
export type Decor = { kind: number; x0: number; z0: number; data: Float32Array };

/** gentle unevenness of the land, the same wherever it is asked for */
export const heightAt = (x: number, z: number) => {
  const a = Math.sin(x * 0.83 + z * 0.41) * Math.cos(z * 0.67 - x * 0.29);
  const b = Math.sin(x * 2.3 + 1.7) * Math.sin(z * 2.1 + 0.4);
  return 0.012 + a * 0.022 + b * 0.012;
};

const rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t, a[2]! + (b[2]! - a[2]!) * t];
const GRASS = [rgb("#86b84e"), rgb("#9cc457"), rgb("#74a845"), rgb("#a8c45e")];
const FOREST = rgb("#5e8c3a");
const DIRT = rgb("#d9bf86");
const SAND = rgb("#eedba6");
const LIP = rgb("#7a9a44");
const ROCK = rgb("#a08a6a");
const ROCK_DEEP = rgb("#6e6052");

/** large soft patches of lighter and darker grass */
const patch = (x: number, z: number) => {
  const a = Math.sin(x * 0.13 + Math.sin(z * 0.09) * 2) * Math.cos(z * 0.11 - x * 0.05);
  const b = Math.sin(x * 0.37 - z * 0.29 + 3) * 0.5;
  return a * 0.7 + b * 0.3;
};

export type Field = { land: Uint8Array; shore: Uint8Array; woods: Uint8Array };

/** where the land is, how far each water tile is from it, and where the woods are */
export function fieldOf(): Field {
  const land = new Uint8Array(COLS * ROWS);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) land[y * COLS + x] = terrainAt(x, y) === "water" ? 0 : 1;
  // distance from land, in tiles (two passes of a chamfer distance)
  const d = new Float32Array(COLS * ROWS).fill(99);
  for (let i = 0; i < d.length; i++) if (land[i]) d[i] = 0;
  const pass = (fw: boolean) => {
    for (let k = 0; k < COLS * ROWS; k++) {
      const i = fw ? k : COLS * ROWS - 1 - k;
      const x = i % COLS;
      const y = (i / COLS) | 0;
      const s = fw ? -1 : 1;
      let v = d[i]!;
      const look = (dx: number, dy: number, c: number) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;
        v = Math.min(v, d[ny * COLS + nx]! + c);
      };
      look(s, 0, 1);
      look(0, s, 1);
      look(s, s, 1.414);
      look(-s, s, 1.414);
      d[i] = v;
    }
  };
  pass(true);
  pass(false);
  const shore = new Uint8Array(COLS * ROWS);
  for (let i = 0; i < d.length; i++) shore[i] = Math.min(255, Math.round((Math.min(d[i]!, 8) / 8) * 255));
  const woods = new Uint8Array(COLS * ROWS);
  for (const n of nodeSpawns()) if (n.kind === "wood") woods[n.y * COLS + n.x] = 1;
  return { land, shore, woods };
}

/** The land, the cliffs and the sides of the board, in chunks. */
export function buildGround(f: Field): Chunk[] {
  const LX = COLS + 2;
  const LZ = ROWS + 2;
  // the lattice runs through the tile centres, plus the map's edges
  const px = (i: number) => (i === 0 ? 0 : i === LX - 1 ? COLS : i - 0.5);
  const pz = (j: number) => (j === 0 ? 0 : j === LZ - 1 ? ROWS : j - 0.5);
  const tileOf = (i: number, n: number) => Math.max(0, Math.min(n - 1, i - 1));
  const isLand = (i: number, j: number) => f.land[tileOf(j, ROWS) * COLS + tileOf(i, COLS)]! === 1;
  const near = (tx: number, ty: number) => {
    // land touching water gets a sandy edge
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = tx + dx;
        const y = ty + dy;
        if (x >= 0 && y >= 0 && x < COLS && y < ROWS && !f.land[y * COLS + x]) return true;
      }
    return false;
  };
  const colourAt = (tx: number, ty: number, x: number, z: number): [number, number, number] => {
    const t = terrainAt(tx, ty);
    const n = hash(tx, ty, 7);
    let c: [number, number, number];
    if (t === "dirt") c = lerp3(DIRT, SAND, n * 0.4);
    else {
      const p = patch(x, z);
      const g = p < -0.35 ? GRASS[2]! : p > 0.45 ? GRASS[3]! : p > 0.1 ? GRASS[1]! : GRASS[0]!;
      c = lerp3(g, GRASS[(n * 4) | 0]!, 0.25);
      if (f.woods[ty * COLS + tx]) c = lerp3(c, FOREST, 0.75);
    }
    if (near(tx, ty) && t !== "dirt") c = lerp3(c, SAND, 0.38);
    const k = 0.96 + n * 0.08;
    return [c[0] * k, c[1] * k, c[2] * k];
  };

  const chunks: Chunk[] = [];
  for (let cz = 0; cz < LZ - 1; cz += CHUNK)
    for (let cx = 0; cx < LX - 1; cx += CHUNK) {
      const v: number[] = [];
      const idx: number[] = [];
      const keyed = new Map<number, number>();
      const vert = (key: number, x: number, y: number, z: number, c: [number, number, number]) => {
        let k = keyed.get(key);
        if (k === undefined) {
          k = v.length / 6;
          v.push(x, y, z, c[0], c[1], c[2]);
          keyed.set(key, k);
        }
        return k;
      };
      const raw = (x: number, y: number, z: number, c: [number, number, number]) => {
        v.push(x, y, z, c[0], c[1], c[2]);
        return v.length / 6 - 1;
      };
      const corner = (i: number, j: number) => {
        const x = px(i);
        const z = pz(j);
        return vert(j * LX + i, x, heightAt(x, z), z, colourAt(tileOf(i, COLS), tileOf(j, ROWS), x, z));
      };
      /** where the coast crosses the edge between two lattice points: a little off the middle, the same from both sides */
      const edge = (i0: number, j0: number, i1: number, j1: number) => {
        const horiz = j0 === j1;
        const id = horiz ? Math.min(i0, i1) + j0 * LX : i0 + Math.min(j0, j1) * LX;
        const t0 = 0.32 + hash(id, horiz ? 1 : 2, 11) * 0.36;
        const a = isLand(i0, j0);
        // t measured from the lower-numbered end
        const lo = horiz ? Math.min(i0, i1) : Math.min(j0, j1);
        const t = (horiz ? i0 : j0) === lo ? t0 : 1 - t0;
        void a;
        const x = px(i0) + (px(i1) - px(i0)) * t;
        const z = pz(j0) + (pz(j1) - pz(j0)) * t;
        return { key: LX * LZ + id * 2 + (horiz ? 0 : 1), x, z };
      };
      const coastVert = (e: { key: number; x: number; z: number }) => vert(e.key, e.x, heightAt(e.x, e.z), e.z, SAND);
      const wall = (a: { x: number; z: number }, b: { x: number; z: number }) => {
        const ya = heightAt(a.x, a.z);
        const yb = heightAt(b.x, b.z);
        const t0 = raw(a.x, ya, a.z, LIP);
        const t1 = raw(b.x, yb, b.z, LIP);
        const m0 = raw(a.x, ya - 0.14, a.z, ROCK);
        const m1 = raw(b.x, yb - 0.14, b.z, ROCK);
        const b0 = raw(a.x, CLIFF_Y, a.z, ROCK_DEEP);
        const b1 = raw(b.x, CLIFF_Y, b.z, ROCK_DEEP);
        idx.push(t0, t1, m1, t0, m1, m0, m0, m1, b1, m0, b1, b0);
      };
      for (let j = cz; j < Math.min(cz + CHUNK, LZ - 1); j++)
        for (let i = cx; i < Math.min(cx + CHUNK, LX - 1); i++) {
          const cs = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]] as const;
          const ls = cs.map(([a, b]) => isLand(a, b));
          const n = ls.filter(Boolean).length;
          if (n === 0) continue;
          if (n === 4) {
            const k = cs.map(([a, b]) => corner(a, b));
            // split along the diagonal that keeps the facets pleasant
            if (hash(i, j, 5) < 0.5) idx.push(k[0]!, k[1]!, k[2]!, k[0]!, k[2]!, k[3]!);
            else idx.push(k[0]!, k[1]!, k[3]!, k[1]!, k[2]!, k[3]!);
            continue;
          }
          // walk the cell's outline, keeping its land corners and the coast crossings
          const ring: { k: number; coast: boolean; e?: { x: number; z: number } }[] = [];
          for (let s = 0; s < 4; s++) {
            const [a0, b0] = cs[s]!;
            const [a1, b1] = cs[(s + 1) % 4]!;
            if (ls[s]) ring.push({ k: corner(a0, b0), coast: false });
            if (ls[s] !== ls[(s + 1) % 4]) {
              const e = edge(a0, b0, a1, b1);
              ring.push({ k: coastVert(e), coast: true, e });
            }
          }
          for (let s = 1; s + 1 < ring.length; s++) idx.push(ring[0]!.k, ring[s]!.k, ring[s + 1]!.k);
          for (let s = 0; s < ring.length; s++) {
            const a = ring[s]!;
            const b = ring[(s + 1) % ring.length]!;
            if (a.coast && b.coast) wall(a.e!, b.e!);
          }
        }
      // the sides of the board, under the map's edge
      const side = (x0: number, z0: number, x1: number, z1: number, land0: boolean, land1: boolean) => {
        const y0 = land0 ? heightAt(x0, z0) : WATER_Y;
        const y1 = land1 ? heightAt(x1, z1) : WATER_Y;
        const top0 = land0 ? LIP : rgb("#3f8fb0");
        const top1 = land1 ? LIP : rgb("#3f8fb0");
        const a = raw(x0, y0, z0, top0);
        const b = raw(x1, y1, z1, top1);
        const m0 = raw(x0, y0 - 0.16, z0, land0 ? rgb("#8a6a44") : rgb("#2f6f96"));
        const m1 = raw(x1, y1 - 0.16, z1, land1 ? rgb("#8a6a44") : rgb("#2f6f96"));
        const c = raw(x0, BOARD_Y + 0.25, z0, land0 ? rgb("#6a4e34") : rgb("#1f4a6e"));
        const d = raw(x1, BOARD_Y + 0.25, z1, land1 ? rgb("#6a4e34") : rgb("#1f4a6e"));
        const e = raw(x0, BOARD_Y + 0.25, z0, rgb("#8a6440"));
        const g = raw(x1, BOARD_Y + 0.25, z1, rgb("#8a6440"));
        const h = raw(x0, BOARD_Y, z0, rgb("#6e4c30"));
        const k = raw(x1, BOARD_Y, z1, rgb("#6e4c30"));
        idx.push(a, b, m1, a, m1, m0, m0, m1, d, m0, d, c, e, g, k, e, k, h);
      };
      for (let i = cx; i < Math.min(cx + CHUNK, LX - 1); i++) {
        if (cz === 0) side(px(i), 0, px(i + 1), 0, isLand(i, 0), isLand(i + 1, 0));
        if (cz + CHUNK >= LZ - 1) side(px(i), ROWS, px(i + 1), ROWS, isLand(i, LZ - 1), isLand(i + 1, LZ - 1));
      }
      for (let j = cz; j < Math.min(cz + CHUNK, LZ - 1); j++) {
        if (cx === 0) side(0, pz(j), 0, pz(j + 1), isLand(0, j), isLand(0, j + 1));
        if (cx + CHUNK >= LX - 1) side(COLS, pz(j), COLS, pz(j + 1), isLand(LX - 1, j), isLand(LX - 1, j + 1));
      }
      if (!idx.length) continue;
      chunks.push({ x0: px(cx), z0: pz(cz), x1: px(Math.min(cx + CHUNK, LX - 1)), z1: pz(Math.min(cz + CHUNK, LZ - 1)), v: new Float32Array(v), i: new Uint32Array(idx) });
    }
  return chunks;
}

/** decoration kinds */
export const DECOR = { tuft: 0, flower: 1, pebble: 2, reed: 3, bush: 4, lily: 5 } as const;
const FLOWERS = [rgb("#fff6e0"), rgb("#ffd84a"), rgb("#ff9ab0"), rgb("#c8a0ff"), rgb("#ff7a5a")];

/** Little things on the ground: tufts, flowers, pebbles, reeds by the water, lily pads. Instances of x, y, z, turn, size, r, g, b. */
export function buildDecor(f: Field): Decor[] {
  const out: Decor[] = [];
  const S = CHUNK;
  for (let z0 = 0; z0 < ROWS; z0 += S)
    for (let x0 = 0; x0 < COLS; x0 += S) {
      const lists: number[][] = [[], [], [], [], [], []];
      const add = (k: number, x: number, z: number, y: number, r: number, s: number, c: [number, number, number]) => lists[k]!.push(x, y, z, r, s, c[0], c[1], c[2]);
      for (let ty = z0; ty < Math.min(ROWS, z0 + S); ty++)
        for (let tx = x0; tx < Math.min(COLS, x0 + S); tx++) {
          const i = ty * COLS + tx;
          const h = (k: number) => hash(tx, ty, 100 + k);
          if (!f.land[i]) {
            const d = f.shore[i]! / 255 * 8;
            if (d < 2.2 && h(1) < 0.18) add(DECOR.lily, tx + h(2), ty + h(3), WATER_Y + 0.005, h(4) * 6.3, 0.7 + h(5) * 0.6, [0.36, 0.62, 0.3]);
            if (d < 1.2 && h(6) < 0.35) add(DECOR.reed, tx + 0.2 + h(7) * 0.6, ty + 0.2 + h(8) * 0.6, WATER_Y - 0.05, h(9) * 6.3, 0.8 + h(10) * 0.5, [0.48, 0.62, 0.32]);
            continue;
          }
          const dirt = terrainAt(tx, ty) === "dirt";
          const wood = f.woods[i] === 1;
          const x = tx + 0.1 + h(11) * 0.8;
          const z = ty + 0.1 + h(12) * 0.8;
          const y = heightAt(x, z);
          if (dirt) {
            if (h(13) < 0.22) add(DECOR.pebble, x, z, y, h(14) * 6.3, 0.6 + h(15) * 0.6, [0.72, 0.68, 0.6]);
            continue;
          }
          if (h(16) < (wood ? 0.3 : 0.42)) add(DECOR.tuft, x, z, y, h(17) * 6.3, 0.75 + h(18) * 0.6, [0.42 + h(19) * 0.12, 0.66 + h(20) * 0.1, 0.28]);
          if (!wood && h(21) < 0.07) {
            const c = FLOWERS[(h(22) * FLOWERS.length) | 0]!;
            for (let k = 0; k < 3; k++) {
              const fx = tx + 0.15 + h(23 + k) * 0.7;
              const fz = ty + 0.15 + h(26 + k) * 0.7;
              add(DECOR.flower, fx, fz, heightAt(fx, fz), h(29 + k) * 6.3, 0.8 + h(32 + k) * 0.4, c);
            }
          }
          if (h(35) < (wood ? 0.06 : 0.025)) add(DECOR.pebble, tx + h(36), ty + h(37), y, h(38) * 6.3, 0.8 + h(39), [0.66, 0.64, 0.6]);
          if (h(40) < (wood ? 0.1 : 0.025)) add(DECOR.bush, tx + 0.2 + h(41) * 0.6, ty + 0.2 + h(42) * 0.6, y, h(43) * 6.3, 0.7 + h(44) * 0.5, [0.36 + h(45) * 0.1, 0.56 + h(46) * 0.1, 0.26]);
        }
      lists.forEach((l, kind) => {
        if (l.length) out.push({ kind, x0, z0, data: new Float32Array(l) });
      });
    }
  return out;
}
