/**
 * The painted ground, in soft washes of colour: light yellow-green meadows, sandy paths and
 * shores, and clear water that deepens from turquoise to blue, with white foam along the
 * shore and curving edges instead of square tiles. It is painted once per patch of 8×8
 * tiles at the size it is shown, and kept. Nothing painted here has a top or bottom,
 * because north's view is turned round.
 */
import { COLS, ROWS } from "../game/content";
import { GRID, nodeSpawns, terrainAt } from "../game/map";

type G = CanvasRenderingContext2D;
/** `margin`: pixels painted beyond the patch on each side */
type Patch = { canvas: HTMLCanvasElement; res: number; used: number; margin: number };

const CHUNK = 8;
/** extra pixels painted round each patch so neighbours join without seams */
const M = 2;
/** a soft, tileable brush texture (128×128, values 0..1), fixed to the world */
const BRUSH = (() => {
  const n = 128;
  let a = new Float32Array(n * n);
  let seed = 9;
  for (let i = 0; i < a.length; i++) a[i] = (seed = (seed * 16807) % 2147483647) / 2147483647;
  // blur along one diagonal more than the other, for a brushed look
  for (const [dx, dy, r] of [[1, 1, 5], [1, -1, 2], [1, 0, 1]] as const) {
    const b = new Float32Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += a[(((y + k * dy) % n) + n) % n * n + ((((x + k * dx) % n) + n) % n)]!;
        b[y * n + x] = s / (2 * r + 1);
      }
    a = b;
  }
  let lo = 1;
  let hi = 0;
  for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  return a.map((v) => (v - lo) / (hi - lo));
})();

let fieldsFor: unknown = null;
let water = new Float32Array(0);
let dirt = new Float32Array(0);
let depth = new Float32Array(0);
let tone = new Float32Array(0);
let patchTone = new Float32Array(0);
let wobble = new Float32Array(0);
/** where the woods stand at the start: the ground there is a deeper green */
let forest = new Float32Array(0);
let FW = 0;
let FH = 0;
const patches = new Map<string, Patch>();
let pixelsKept = 0;
/** about 48 MB of patches at most */
const MAX_PIXELS = 12_000_000;
let frameNo = 0;
let version = 0;
/** how many patches were painted and how long it took (for testing) */
export const paintStats = { n: 0, ms: 0 };
/** changes whenever the map (and so every painted patch) changes */
export const groundVersion = () => (prepare(), version);

const hash = (x: number, y: number, k: number) => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** One value per tile corner, padded by 2 tiles all round. */
function prepare() {
  if (fieldsFor === GRID && FW === COLS + 4 && FH === ROWS + 4) return;
  fieldsFor = GRID;
  version++;
  for (const p of patches.values()) p.canvas.width = p.canvas.height = 0;
  patches.clear();
  anySize.clear();
  pixelsKept = 0;
  FW = COLS + 4;
  FH = ROWS + 4;
  const n = FW * FH;
  water = new Float32Array(n);
  dirt = new Float32Array(n);
  depth = new Float32Array(n);
  tone = new Float32Array(n);
  patchTone = new Float32Array(n);
  wobble = new Float32Array(n);
  forest = new Float32Array(n);
  const trees = new Uint8Array(n);
  for (const s of nodeSpawns()) if (s.kind === "wood") trees[(s.y + 2) * FW + s.x + 2] = 1;
  for (let y = 1; y < FH - 1; y++)
    for (let x = 1; x < FW - 1; x++) {
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) k += trees[(y + dy) * FW + x + dx]!;
      forest[y * FW + x] = Math.min(1, k / 5);
    }
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const t = terrainAt(x - 2, y - 2);
      const i = y * FW + x;
      water[i] = t === "water" ? 1 : 0;
      dirt[i] = t === "dirt" ? 1 : 0;
      tone[i] = hash(x, y, 1);
      wobble[i] = hash(x, y, 2) - 0.5;
    }
  // large soft patches of lighter and darker grass
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const gx = x / 5;
      const gy = y / 5;
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);
      const fx = gx - ix;
      const fy = gy - iy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const a = hash(ix, iy, 3);
      const b = hash(ix + 1, iy, 3);
      const c = hash(ix, iy + 1, 3);
      const d = hash(ix + 1, iy + 1, 3);
      patchTone[y * FW + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  // how far each water tile is from land, for deeper colour out at sea
  const far = new Int16Array(n).fill(99);
  const queue: number[] = [];
  for (let i = 0; i < n; i++) if (!water[i]) { far[i] = 0; queue.push(i); }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    const x = i % FW;
    const y = (i - x) / FW;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= FW || ny >= FH) continue;
      const j = ny * FW + nx;
      if (far[j]! > far[i]! + 1) { far[j] = far[i]! + 1; queue.push(j); }
    }
  }
  // tiles out from the shore, measured from the shoreline itself
  for (let i = 0; i < n; i++) depth[i] = water[i] ? Math.min(far[i]!, 6) - 0.5 : 0;
}

/**
 * Paints the patch whose top-left tile is (tx, ty) at `res` pixels per tile, the size it
 * will be shown at.
 */
function paint(tx: number, ty: number, res: number): HTMLCanvasElement {
  const size = CHUNK * res + 2 * M;
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const g = out.getContext("2d")!;
  const img = g.createImageData(size, size);
  const px = new Uint32Array(img.data.buffer);
  const W = water;
  const D = dirt;
  const DE = depth;
  const TO = tone;
  const PT = patchTone;
  const WO = wobble;
  const FO = forest;
  const ss = (a: number, b: number, x: number) => {
    const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a);
    return t * t * (3 - 2 * t);
  };
  // the brush texture is sized to the tile, so it looks the same at every zoom
  const bs = 64 / res;
  for (let py = 0; py < size; py++) {
    const fy = ty + (py - M + 0.5) / res + 1.5;
    let iy = Math.floor(fy);
    let vy = fy - iy;
    if (iy < 0) { iy = 0; vy = 0; }
    if (iy > FH - 2) { iy = FH - 2; vy = 1; }
    const row = py * size;
    const brow = ((Math.floor((py - M + ty * res) * bs) % 128) + 128) % 128 * 128;
    for (let qx = 0; qx < size; qx++) {
      const fx = tx + (qx - M + 0.5) / res + 1.5;
      let ix = Math.floor(fx);
      let vx = fx - ix;
      if (ix < 0) { ix = 0; vx = 0; }
      if (ix > FW - 2) { ix = FW - 2; vx = 1; }
      const i = iy * FW + ix;
      const j = i + FW;
      const a = (1 - vx) * (1 - vy);
      const b = vx * (1 - vy);
      const c = (1 - vx) * vy;
      const d = vx * vy;
      const brush = BRUSH[brow + ((Math.floor((qx - M + tx * res) * bs) % 128) + 128) % 128]!;
      const wob = WO[i]! * a + WO[i + 1]! * b + WO[j]! * c + WO[j + 1]! * d;
      const wet = W[i]! * a + W[i + 1]! * b + W[j]! * c + W[j + 1]! * d + wob * 0.2 + (brush - 0.5) * 0.05;
      const road = D[i]! * a + D[i + 1]! * b + D[j]! * c + D[j + 1]! * d - wob * 0.3 + (brush - 0.5) * 0.12;
      const pt = PT[i]! * a + PT[i + 1]! * b + PT[j]! * c + PT[j + 1]! * d;
      const tt = TO[i]! * a + TO[i + 1]! * b + TO[j]! * c + TO[j + 1]! * d;
      // meadow: washes of yellow-green, lighter where it is worn by paths and shores, deeper in the woods
      const wood = FO[i]! * a + FO[i + 1]! * b + FO[j]! * c + FO[j + 1]! * d;
      const v = pt * 0.9 + tt * 0.1 + brush * 0.55 - 0.3 + ss(0.28, 0.42, wet) * 0.25 + ss(0.3, 0.46, road) * 0.2 - wood * 0.5;
      let r: number, gr: number, bl: number;
      if (v < 0) {
        const k = ss(-0.6, 0, v);
        r = 84 + 44 * k; gr = 140 + 38 * k; bl = 58 + 6 * k;
      } else if (v < 0.5) {
        const k = ss(0, 0.5, v);
        r = 128 + 36 * k; gr = 178 + 28 * k; bl = 64 + 20 * k;
      } else {
        const k = ss(0.5, 1, v);
        r = 164 + 38 * k; gr = 206 + 22 * k; bl = 84 + 34 * k;
      }
      // paths of packed sandy earth
      const on = ss(0.44, 0.56, road);
      if (on > 0) {
        const edge = 1 - ss(0.56, 0.75, road);
        r += (226 - edge * 18 + brush * 12 - r) * on;
        gr += (204 - edge * 20 + brush * 10 - gr) * on;
        bl += (152 - edge * 18 + brush * 8 - bl) * on;
      }
      // sandy shores, damp at the water's edge
      const sand = ss(0.34, 0.44, wet);
      if (sand > 0) {
        const damp = ss(0.44, 0.5, wet);
        r += (238 - damp * 22 + brush * 8 - r) * sand;
        gr += (220 - damp * 22 + brush * 8 - gr) * sand;
        bl += (168 - damp * 16 + brush * 6 - bl) * sand;
      }
      // clear water, turquoise over the shallows and bluer further out, with foam
      const sea = ss(0.49, 0.515, wet);
      if (sea > 0) {
        const far = DE[i]! * a + DE[i + 1]! * b + DE[j]! * c + DE[j + 1]! * d;
        const dist = Math.max(far, (wet - 0.5) * 1.2) + wob * 0.4;
        const k1 = ss(0, 0.9, dist);
        const k2 = ss(0.9, 2.4, dist);
        const k3 = ss(2.4, 4.8, dist);
        let wr = 152 - 50 * k1 - 26 * k2 - 14 * k3 + (brush - 0.5) * 14;
        let wg = 222 - 34 * k1 - 34 * k2 - 26 * k3 + (brush - 0.5) * 12;
        let wb = 212 + 4 * k1 - 8 * k2 - 16 * k3 + (brush - 0.5) * 8;
        const shore = ss(0.5, 0.515, wet) * (1 - ss(0.53, 0.6, wet));
        const wave = Math.max(0, 1 - Math.abs(dist - 0.75 - wob * 0.6) / 0.09) * ss(0.35, 0.6, brush);
        const foam = Math.min(1, shore * 0.9 + wave * 0.55);
        wr += (246 - wr) * foam;
        wg += (250 - wg) * foam;
        wb += (246 - wb) * foam;
        r += (wr - r) * sea;
        gr += (wg - gr) * sea;
        bl += (wb - bl) * sea;
      }
      const R = r < 0 ? 0 : r > 255 ? 255 : r | 0;
      const Gc = gr < 0 ? 0 : gr > 255 ? 255 : gr | 0;
      const B = bl < 0 ? 0 : bl > 255 ? 255 : bl | 0;
      px[row + qx] = 0xff000000 | (B << 16) | (Gc << 8) | R;
    }
  }
  g.putImageData(img, 0, 0);
  g.translate(M, M);
  for (let y = ty - 1; y < ty + CHUNK + 1; y++)
    for (let x = tx - 1; x < tx + CHUNK + 1; x++) details(g, x, y, (x - tx) * res, (y - ty) * res, res);
  return out;
}

/** Tufts, flowers, bushes and warm rocks, scattered by tile and softly painted. */
function details(g: G, x: number, y: number, ox: number, oy: number, res: number) {
  const t = terrainAt(x, y);
  const h = hash(x, y, 11);
  const u = res / 32;
  const P = (fx: number, fy: number) => [ox + fx * res, oy + fy * res] as const;
  const blob = (fx: number, fy: number, r: number, c: string) => {
    const [px, py] = P(fx, fy);
    g.fillStyle = c;
    g.beginPath();
    g.arc(px, py, r * u, 0, Math.PI * 2);
    g.fill();
  };
  const wet = (dx: number, dy: number) => terrainAt(x + dx, y + dy) === "water";
  const coast = wet(1, 0) || wet(-1, 0) || wet(0, 1) || wet(0, -1);
  if (t === "grass") {
    // soft tufts of lighter and darker grass
    g.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      if (hash(x, y, 20 + i) > 0.7) continue;
      const [px, py] = P(0.1 + hash(x, y, 30 + i) * 0.8, 0.1 + hash(x, y, 40 + i) * 0.8);
      const a = hash(x, y, 45 + i) * Math.PI * 2;
      g.strokeStyle = i % 2 ? "rgba(96,150,48,.45)" : "rgba(214,236,140,.55)";
      g.lineWidth = 1.6 * u;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a) * 3.5 * u, py + Math.sin(a) * 3.5 * u);
      g.stroke();
    }
    if (h > 0.9 && !coast) {
      // a clump of shrubs (no berries: those are food)
      const fx = 0.3 + hash(x, y, 15) * 0.4;
      const fy = 0.3 + hash(x, y, 16) * 0.4;
      const parts = 2 + Math.floor(hash(x, y, 19) * 3);
      const spots: [number, number, number][] = [];
      for (let i = 0; i < parts; i++) spots.push([fx + (hash(x, y, 70 + i) - 0.5) * 0.4, fy + (hash(x, y, 80 + i) - 0.5) * 0.25, 4.5 + hash(x, y, 90 + i) * 3.5]);
      for (const [sx, sy, r] of spots) blob(sx + 0.07, sy + 0.08, r + 1, "rgba(50,84,26,.22)");
      for (const [sx, sy, r] of spots) blob(sx, sy, r, "#3f7d2e");
      for (const [sx, sy, r] of spots) blob(sx - 0.03, sy - 0.04, r * 0.72, "#5a9a3c");
      for (const [sx, sy, r] of spots) blob(sx - 0.05, sy - 0.07, r * 0.36, "#8cc35a");
    } else if (h < 0.08) {
      const colors = ["#fff8e6", "#ffe27a", "#f4b0c4", "#d2c4ff"];
      const c = colors[Math.floor(hash(x, y, 12) * colors.length)]!;
      for (let i = 0; i < 4; i++) blob(0.2 + hash(x, y, 50 + i) * 0.6, 0.2 + hash(x, y, 60 + i) * 0.6, 1.3, c);
    } else if (h > 0.8 && coast) {
      // warm sandstone by the water
      const fx = 0.3 + hash(x, y, 17) * 0.4;
      const fy = 0.3 + hash(x, y, 18) * 0.4;
      blob(fx + 0.05, fy + 0.06, 4.6, "rgba(90,60,30,.25)");
      blob(fx, fy, 4.2, "#b9714c");
      blob(fx - 0.03, fy - 0.04, 2.8, "#d88e62");
      blob(fx - 0.05, fy - 0.06, 1.2, "#efb68a");
    }
  } else if (t === "dirt") {
    for (let i = 0; i < 2; i++) if (hash(x, y, 90 + i) < 0.35) blob(0.15 + hash(x, y, 100 + i) * 0.7, 0.15 + hash(x, y, 110 + i) * 0.7, 1.4, "rgba(170,140,96,.6)");
  }
}

function keep(key: string, p: Patch) {
  patches.set(key, p);
  pixelsKept += p.canvas.width * p.canvas.height;
  if (pixelsKept <= MAX_PIXELS) return;
  const old = [...patches.entries()].sort((a, b) => a[1].used - b[1].used);
  for (const [k, q] of old) {
    if (pixelsKept <= MAX_PIXELS * 0.75 || q.used >= frameNo - 1) break;
    pixelsKept -= q.canvas.width * q.canvas.height;
    q.canvas.width = q.canvas.height = 0;
    patches.delete(k);
    const at = k.slice(0, k.lastIndexOf(","));
    if (anySize.get(at) === q) anySize.delete(at);
  }
}

let budgetUntil = 0;
/** called once per frame, before any view is drawn */
export function groundFrame() {
  frameNo++;
  budgetUntil = performance.now() + 7;
}

/** the newest patch painted at each place, at whatever size, to stand in while another is painted */
const anySize = new Map<string, Patch>();

/**
 * Draws the ground for tiles x0..x1, y0..y1, at `res` pixels per tile. `at(wx, wy)` gives a
 * world point's place in the current drawing space; `dir` is -1 for a turned view.
 */
export function drawGround(g: G, x0: number, y0: number, x1: number, y1: number, at: (wx: number, wy: number) => readonly [number, number], dir: number, res: number): boolean {
  prepare();
  let whole = true;
  const cx0 = Math.floor(x0 / CHUNK);
  const cy0 = Math.floor(y0 / CHUNK);
  const cx1 = Math.floor(x1 / CHUNK);
  const cy1 = Math.floor(y1 / CHUNK);
  // a fresh view (a new game, a new zoom, a jump across the map) is painted at once
  let absent = 0;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) if (!patches.has(`${cx},${cy},${res}`)) absent++;
  const rush = absent * 2 > (cx1 - cx0 + 1) * (cy1 - cy0 + 1);
  const missing: [number, number][] = [];
  g.imageSmoothingEnabled = false;
  for (let cy = cy0; cy <= cy1; cy++)
    for (let cx = cx0; cx <= cx1; cx++) {
      const key = `${cx},${cy},${res}`;
      let p = patches.get(key);
      if (!p && (rush || performance.now() < budgetUntil)) {
        const t0 = performance.now();
        p = { canvas: paint(cx * CHUNK, cy * CHUNK, res), res, used: frameNo, margin: M };
        paintStats.n++;
        paintStats.ms += performance.now() - t0;
        keep(key, p);
        anySize.set(`${cx},${cy}`, p);
      }
      if (!p) {
        whole = false;
        const q = anySize.get(`${cx},${cy}`);
        if (q && patches.get(`${cx},${cy},${q.res}`) === q) p = q;
      }
      if (!p) { missing.push([cx, cy]); continue; }
      p.used = frameNo;
      const [sx, sy] = at(cx * CHUNK, cy * CHUNK);
      g.save();
      g.translate(sx, sy);
      g.scale((dir * 32) / p.res, (dir * 32) / p.res);
      g.drawImage(p.canvas, p.margin, p.margin, CHUNK * p.res, CHUNK * p.res, 0, 0, CHUNK * p.res, CHUNK * p.res);
      g.restore();
    }
  // plain tiles where nothing is painted yet
  for (const [cx, cy] of missing)
    for (let y = cy * CHUNK; y < cy * CHUNK + CHUNK; y++)
      for (let x = cx * CHUNK; x < cx * CHUNK + CHUNK; x++) {
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        const t = terrainAt(x, y);
        g.fillStyle = t === "water" ? "#2c80c8" : t === "dirt" ? "#dcc48a" : "#8ac23e";
        const [a, b] = at(dir > 0 ? x : x + 1, dir > 0 ? y : y + 1);
        g.fillRect(a, b, 32, 32);
      }
  return whole && !missing.length;
}

/** Light glinting on open water: soft flecks that come and go. `px(wx, wy)` gives a world point's pixel. */
export function drawGlints(g: G, x0: number, y0: number, x1: number, y1: number, px: (wx: number, wy: number) => readonly [number, number], tile: number, clock: number) {
  const u = tile / 32;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (terrainAt(x, y) !== "water" || terrainAt(x + 1, y) !== "water" || terrainAt(x - 1, y) !== "water") continue;
      for (let i = 0; i < 2; i++) {
        const a = Math.sin(clock * 1.2 + hash(x, y, 140 + i) * Math.PI * 2);
        if (a < 0.25) continue;
        const [lx, ly] = px(x + 0.15 + hash(x, y, 150 + i) * 0.7, y + 0.15 + hash(x, y, 160 + i) * 0.7);
        g.fillStyle = `rgba(240,252,255,${((a - 0.25) * 0.45).toFixed(2)})`;
        g.beginPath();
        g.ellipse(lx, ly, (3 + a * 4) * u, 1.1 * u, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
}
