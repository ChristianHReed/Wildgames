import { COLS, ROWS } from "./content";

const DIRS: readonly (readonly [number, number, number])[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, 1.414],
  [1, -1, 1.414],
  [-1, 1, 1.414],
  [-1, -1, 1.414],
];

let gScore = new Float32Array(0);
let prev = new Int32Array(0);
let closed = new Uint8Array(0);

/** A* with a binary heap. If the goal cannot be reached, leads to the closest tile that can. */
export function findPath(
  blocked: (x: number, y: number) => boolean,
  sx: number,
  sy: number,
  gx: number,
  gy: number,
): { x: number; y: number }[] {
  let x0 = Math.floor(sx);
  let y0 = Math.floor(sy);
  const x1 = Math.max(0, Math.min(COLS - 1, Math.floor(gx)));
  const y1 = Math.max(0, Math.min(ROWS - 1, Math.floor(gy)));
  if (blocked(x0, y0)) {
    let found = false;
    for (let r = 1; r <= 2 && !found; r++) {
      for (let y = y0 - r; y <= y0 + r && !found; y++) {
        for (let x = x0 - r; x <= x0 + r; x++) {
          if (!blocked(x, y)) {
            x0 = x;
            y0 = y;
            found = true;
            break;
          }
        }
      }
    }
    if (!found) return [];
  }
  if (x0 === x1 && y0 === y1) return [{ x: x1 + 0.5, y: y1 + 0.5 }];

  if (gScore.length !== COLS * ROWS) {
    gScore = new Float32Array(COLS * ROWS);
    prev = new Int32Array(COLS * ROWS);
    closed = new Uint8Array(COLS * ROWS);
  }
  gScore.fill(1e9);
  prev.fill(-1);
  closed.fill(0);
  const heur = (x: number, y: number) => {
    const dx = Math.abs(x - x1);
    const dy = Math.abs(y - y1);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  };
  const heap: { i: number; f: number }[] = [];
  const push = (i: number, f: number) => {
    let c = heap.length;
    heap.push({ i, f });
    while (c > 0) {
      const up = (c - 1) >> 1;
      if (heap[up]!.f <= f) break;
      heap[c] = heap[up]!;
      c = up;
    }
    heap[c] = { i, f };
  };
  const pop = () => {
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      let c = 0;
      for (;;) {
        let k = c * 2 + 1;
        if (k >= heap.length) break;
        if (k + 1 < heap.length && heap[k + 1]!.f < heap[k]!.f) k++;
        if (heap[k]!.f >= last.f) break;
        heap[c] = heap[k]!;
        c = k;
      }
      heap[c] = last;
    }
    return top.i;
  };
  const trace = (end: number) => {
    const path: { x: number; y: number }[] = [];
    for (let p = end; p >= 0; p = prev[p]!) path.push({ x: (p % COLS) + 0.5, y: ((p / COLS) | 0) + 0.5 });
    path.reverse();
    path.shift();
    return path;
  };

  const start = y0 * COLS + x0;
  gScore[start] = 0;
  push(start, heur(x0, y0));
  let near = start;
  let nearH = heur(x0, y0);
  while (heap.length) {
    const cur = pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % COLS;
    const cy = (cur / COLS) | 0;
    if (cx === x1 && cy === y1) return trace(cur);
    const h = heur(cx, cy);
    if (h < nearH) {
      nearH = h;
      near = cur;
    }
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = ny * COLS + nx;
      if (closed[ni] || blocked(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (blocked(cx + dx, cy) || blocked(cx, cy + dy))) continue;
      const ng = gScore[cur]! + cost;
      if (ng < gScore[ni]!) {
        gScore[ni] = ng;
        prev[ni] = cur;
        push(ni, ng + heur(nx, ny));
      }
    }
  }
  return trace(near);
}
