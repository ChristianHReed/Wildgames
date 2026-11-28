/**
 * Buildings, people, horses and ships, softly painted in the light of the painted ground:
 * sunlight from the upper left, shaded sides, warm windows, textured wood and stone.
 * Buildings are painted once per look and zoom and kept as small pictures (sprites);
 * people and ships move, so they are drawn fresh each frame from a few simple shapes.
 * Everything here is drawn in the game's own units: 32 to a tile.
 */
import { BUILDINGS, SEATS, STYLE, UNITS } from "../game/content";
import type { Building, Unit } from "../game/sim";

type G = CanvasRenderingContext2D;
type Team = (typeof SEATS)[number];
type Kind = Building["kind"];

// ── colour ──────────────────────────────────────────────────────────────────────────
const mixed = new Map<string, string>();
/** a blend of two #rrggbb colours (t = 0 gives a, 1 gives b), remembered */
export function mix(a: string, b: string, t: number) {
  const key = `${a}${b}${t}`;
  let out = mixed.get(key);
  if (!out) {
    const p = (c: string, i: number) => parseInt(c.slice(i, i + 2), 16);
    const v = (i: number) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t);
    out = `rgb(${v(1)},${v(3)},${v(5)})`;
    mixed.set(key, out);
  }
  return out;
}
const lit = (c: string, t = 0.25) => mix(c, "#fff6dc", t);
const dim = (c: string, t = 0.25) => mix(c, "#22180f", t);

// ── shapes ──────────────────────────────────────────────────────────────────────────
function rect(g: G, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
function round(g: G, x: number, y: number, w: number, h: number, r: number, c: string) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
  g.fill();
}
function dot(g: G, x: number, y: number, r: number, c: string) {
  g.fillStyle = c;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
function oval(g: G, x: number, y: number, rx: number, ry: number, c: string) {
  g.fillStyle = c;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}
function shape(g: G, c: string, ...p: number[]) {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(p[0]!, p[1]!);
  for (let i = 2; i < p.length; i += 2) g.lineTo(p[i]!, p[i + 1]!);
  g.closePath();
  g.fill();
}
function line(g: G, c: string, w: number, ...p: number[]) {
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(p[0]!, p[1]!);
  for (let i = 2; i < p.length; i += 2) g.lineTo(p[i]!, p[i + 1]!);
  g.stroke();
}
const hash = (x: number, y: number, k: number) => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
/** a soft shadow cast down and to the right */
export function shadow(g: G, x: number, y: number, rx: number, ry: number) {
  oval(g, x + 3, y + 1, rx + 3, ry + 2, "rgba(26,40,12,.14)");
  oval(g, x + 1, y, rx, ry, "rgba(26,40,12,.2)");
}

// ── kept pictures ───────────────────────────────────────────────────────────────────
type Sprite = { c: HTMLCanvasElement; x: number; y: number; w: number; h: number };
const sprites = new Map<string, Sprite>();
/** The picture for `key` at `k` pixels per unit, painted by `paint` once. (x, y, w, h) is the area it may cover. */
function sprite(key: string, k: number, x: number, y: number, w: number, h: number, paint: (g: G) => void): Sprite {
  const full = `${key}@${k}`;
  let s = sprites.get(full);
  if (s) return s;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * k));
  c.height = Math.max(1, Math.ceil(h * k));
  const g = c.getContext("2d")!;
  g.scale(k, k);
  g.translate(-x, -y);
  paint(g);
  s = { c, x, y, w: c.width / k, h: c.height / k };
  if (sprites.size > 500) for (const old of [...sprites.keys()].slice(0, 150)) sprites.delete(old);
  sprites.set(full, s);
  return s;
}
const blit = (g: G, s: Sprite, x: number, y: number) => g.drawImage(s.c, x + s.x, y + s.y, s.w, s.h);

// ── building parts ──────────────────────────────────────────────────────────────────
function door(g: G, cx: number, bottom: number, w: number, h: number, arched: boolean, wood = "#7a4a26") {
  const x = cx - w / 2;
  const top = bottom - h;
  g.fillStyle = "#3a2312";
  g.beginPath();
  if (arched) {
    g.moveTo(x - 1.5, bottom);
    g.lineTo(x - 1.5, top + w / 2);
    g.arc(cx, top + w / 2, w / 2 + 1.5, Math.PI, 0);
    g.lineTo(x + w + 1.5, bottom);
  } else g.rect(x - 1.5, top - 1.5, w + 3, h + 1.5);
  g.fill();
  g.fillStyle = wood;
  g.beginPath();
  if (arched) {
    g.moveTo(x, bottom);
    g.lineTo(x, top + w / 2);
    g.arc(cx, top + w / 2, w / 2, Math.PI, 0);
    g.lineTo(x + w, bottom);
  } else g.rect(x, top, w, h);
  g.fill();
  for (let i = 1; i < 3; i++) line(g, "rgba(40,20,8,.45)", 0.8, x + (w * i) / 3, top + (arched ? w * 0.3 : 1), x + (w * i) / 3, bottom - 0.5);
  rect(g, x + w / 2, top + (arched ? w * 0.2 : 0), w / 2, h - (arched ? w * 0.2 : 0), "rgba(20,10,0,.18)");
  dot(g, cx + w * 0.28, bottom - h * 0.45, 0.9, "#e8c35a");
  rect(g, x - 2, bottom - 1, w + 4, 2, "rgba(60,40,20,.5)");
}
function windowLit(g: G, x: number, y: number, w: number, h: number, frame: string, shutters?: string) {
  if (shutters) {
    round(g, x - 4, y - 0.5, 3.5, h + 1, 0.8, shutters);
    round(g, x + w + 0.5, y - 0.5, 3.5, h + 1, 0.8, shutters);
  }
  round(g, x - 1, y - 1, w + 2, h + 2, 1, frame);
  const glow = g.createLinearGradient(x, y, x, y + h);
  glow.addColorStop(0, "#ffe9a8");
  glow.addColorStop(1, "#e8a24a");
  g.fillStyle = glow;
  g.fillRect(x, y, w, h);
  line(g, frame, 1, x + w / 2, y, x + w / 2, y + h);
  line(g, frame, 1, x, y + h / 2, x + w, y + h / 2);
  rect(g, x, y, w / 2, h / 2, "rgba(255,255,255,.25)");
}
function flag(g: G, x: number, y: number, tall: number, c: Team) {
  line(g, "#4a2c17", 2.2, x, y, x, y - tall);
  dot(g, x, y - tall - 1, 1.6, "#e8c35a");
  g.fillStyle = c.main;
  g.beginPath();
  g.moveTo(x + 1, y - tall);
  g.quadraticCurveTo(x + 9, y - tall - 3, x + 17, y - tall + 1);
  g.lineTo(x + 13, y - tall + 4.5);
  g.lineTo(x + 17, y - tall + 8);
  g.quadraticCurveTo(x + 9, y - tall + 5, x + 1, y - tall + 8);
  g.fill();
  shape(g, lit(c.main, 0.35), x + 1, y - tall, x + 9, y - tall - 1.4, x + 9, y - tall + 2.4, x + 1, y - tall + 3);
}
function crate(g: G, x: number, y: number, s: number) {
  rect(g, x, y, s, s, "#a87a44");
  rect(g, x + s * 0.55, y, s * 0.45, s, "rgba(40,20,5,.2)");
  g.strokeStyle = "#6e4824";
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  line(g, "#6e4824", 1, x + 1, y + 1, x + s - 1, y + s - 1);
  line(g, "#6e4824", 1, x + s - 1, y + 1, x + 1, y + s - 1);
}
function barrel(g: G, x: number, y: number) {
  round(g, x - 4.5, y - 11, 9, 11, 3, "#9a6a38");
  rect(g, x + 0.5, y - 11, 4, 11, "rgba(40,20,5,.2)");
  rect(g, x - 4.5, y - 9, 9, 1.4, "#5c5c58");
  rect(g, x - 4.5, y - 3.5, 9, 1.4, "#5c5c58");
  oval(g, x, y - 11, 4.5, 1.6, "#b8854c");
}
/** the ground right round a building: a soft shadow and worn earth */
function base(g: G, W: number, H: number) {
  oval(g, W / 2 + 7, H - 5, W / 2 + 4, 10, "rgba(30,44,14,.14)");
  oval(g, W / 2 + 3, H - 6, W / 2 - 2, 7, "rgba(30,44,14,.2)");
}

// ── the four peoples' buildings ─────────────────────────────────────────────────────
const doors = (kind: Kind) => (kind === "town" ? [18, 22] : kind === "house" || kind === "manor" ? [11, 15] : [13, 17]);

/** Forest Folk: log walls under a steep shingled roof. */
function forest(g: G, kind: Kind, W: number, H: number, c: Team) {
  const eave = H * (kind === "town" ? 0.47 : kind === "manor" ? 0.4 : 0.5);
  const x0 = 7;
  const x1 = W - 7;
  const y0 = eave - 3;
  const y1 = H - 5;
  for (let y = y0, i = 0; y < y1; y += 5.4, i++) {
    rect(g, x0, y, x1 - x0, 5.4, i % 2 ? "#a7713f" : "#b9844f");
    rect(g, x0, y, x1 - x0, 1, "rgba(255,226,170,.28)");
    rect(g, x0, y + 4.4, x1 - x0, 1, "rgba(60,30,10,.32)");
    for (const ex of [x0 - 1, x1 + 1]) {
      dot(g, ex, y + 2.7, 2.8, "#7a4e28");
      dot(g, ex, y + 2.7, 2, "#cf9d62");
      dot(g, ex, y + 2.7, 0.7, "#8a5a30");
    }
  }
  rect(g, x0 + (x1 - x0) * 0.68, y0, (x1 - x0) * 0.32, y1 - y0, "rgba(40,18,4,.17)");
  rect(g, x0, y0, x1 - x0, 5, "rgba(30,14,4,.32)");
  const [dw, dh] = doors(kind);
  door(g, W / 2, y1, dw!, dh!, false);
  const wins = kind === "town" ? [W * 0.2, W * 0.8 - 11] : W > 70 || kind === "manor" ? [W * 0.13, W * 0.87 - 10] : [W * 0.17];
  for (const wx of wins) windowLit(g, wx, y0 + 9, 10, 9, "#5a3a1e", c.light);
  // the roof: a broad front face, lit and shaded hips, shingles and a ridge
  const tl = W * 0.24;
  const tr = W * 0.76;
  const roof = g.createLinearGradient(0, 2, 0, eave);
  roof.addColorStop(0, lit(c.main, 0.18));
  roof.addColorStop(1, dim(c.main, 0.12));
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(-1, eave + 2);
  g.lineTo(tl, 2);
  g.lineTo(tr, 2);
  g.lineTo(W + 1, eave + 2);
  g.closePath();
  g.fill();
  for (let y = 8, row = 0; y < eave; y += 6, row++) {
    const f = (y - 2) / (eave - 2);
    const a = tl - (tl + 1) * f;
    const b = tr + (W + 1 - tr) * f;
    line(g, dim(c.main, 0.38), 1, a + 1, y, b - 1, y);
    for (let x = a + 4 + (row % 2) * 4; x < b - 3; x += 8) line(g, dim(c.main, 0.3), 0.8, x, y - 5.5, x, y);
  }
  shape(g, "rgba(10,5,0,.16)", tr, 2, W + 1, eave + 2, W * 0.64, eave + 2);
  shape(g, "rgba(255,250,225,.12)", tl, 2, -1, eave + 2, W * 0.36, eave + 2);
  line(g, lit(c.main, 0.45), 3, tl, 2.5, tr, 2.5);
  rect(g, -1, eave + 1, W + 2, 3, dim(c.main, 0.35));
  if (kind === "manor") {
    // a dormer window in the roof
    const dx = W / 2;
    const dy = eave * 0.42;
    shape(g, dim(c.main, 0.1), dx - 9, dy + 9, dx, dy - 4, dx + 9, dy + 9);
    rect(g, dx - 6, dy + 4, 12, 9, "#b9844f");
    windowLit(g, dx - 4, dy + 5, 8, 7, "#5a3a1e");
    line(g, lit(c.main, 0.4), 2, dx - 9, dy + 9, dx, dy - 4, dx + 9, dy + 9);
    // window boxes with flowers
    for (const wx of wins) {
      rect(g, wx - 1, y0 + 18.5, 12, 2.5, "#7a4a26");
      for (let i = 0; i < 4; i++) dot(g, wx + 0.8 + i * 2.8, y0 + 18, 1.3, i % 2 ? "#f29ab8" : "#ffe27a");
    }
  }
  if (kind === "house" || kind === "smithy" || kind === "manor") {
    const cx = W * 0.7;
    rect(g, cx, -6, 9, 16, "#8a8580");
    for (let y = -5; y < 10; y += 4) rect(g, cx + ((y / 4) % 2 ? 0 : 4), y, 5, 1, "rgba(40,35,30,.35)");
    rect(g, cx + 6, -6, 3, 16, "rgba(30,25,20,.25)");
    rect(g, cx - 1, -8, 11, 3, "#6a6560");
  }
}

/** Stone Holds: dressed stone, battlements and a hanging banner. */
function stone(g: G, kind: Kind, W: number, H: number, c: Team) {
  const top = H * (kind === "town" ? 0.3 : kind === "manor" ? 0.26 : 0.34);
  const x0 = 5;
  const x1 = W - 5;
  // the roof behind the battlements
  rect(g, 8, top - 20, W - 16, 16, "#6f7572");
  rect(g, 8, top - 20, W - 16, 4, "#858b88");
  const colors = ["#bdbab0", "#b1afa6", "#c6c3b8", "#aaa89f"];
  for (let y = top, row = 0; y < H - 5; y += 7, row++)
    for (let x = x0 - (row % 2) * 7, i = 0; x < x1; x += 14, i++) {
      const bx = Math.max(x0, x);
      const bw = Math.min(x1, x + 14) - bx;
      rect(g, bx, y, bw, 7, colors[Math.floor(hash(i, row, W) * 4)]!);
      line(g, "rgba(70,64,58,.4)", 0.8, bx, y + 6.6, bx + bw, y + 6.6);
      line(g, "rgba(70,64,58,.4)", 0.8, bx + bw, y, bx + bw, y + 7);
      rect(g, bx, y, bw, 1, "rgba(255,255,240,.25)");
    }
  rect(g, x0 + (x1 - x0) * 0.68, top, (x1 - x0) * 0.32, H - 5 - top, "rgba(30,28,24,.2)");
  // battlements
  rect(g, x0 - 2, top - 6, x1 - x0 + 4, 6, "#cbc8bd");
  rect(g, x0 - 2, top - 1.5, x1 - x0 + 4, 1.5, "rgba(50,46,40,.35)");
  const n = Math.max(3, Math.round((x1 - x0) / 13));
  for (let i = 0; i < n; i++) {
    const mx = x0 - 2 + (i * (x1 - x0 - 3)) / (n - 1);
    rect(g, mx, top - 13, 7, 7, "#d2cfc4");
    rect(g, mx + 4.5, top - 13, 2.5, 7, "rgba(40,36,30,.22)");
  }
  // banner, door and arrow slits
  const bx = W / 2;
  const by = top;
  const bw = kind === "town" ? 22 : 15;
  const bh = kind === "town" ? 30 : Math.min(20, H * 0.32);
  rect(g, bx - bw / 2 - 2, by, bw + 4, 2.5, "#5a3a1e");
  g.fillStyle = c.main;
  g.beginPath();
  g.moveTo(bx - bw / 2, by + 2);
  g.lineTo(bx + bw / 2, by + 2);
  g.lineTo(bx + bw / 2, by + bh);
  g.lineTo(bx, by + bh - 5);
  g.lineTo(bx - bw / 2, by + bh);
  g.closePath();
  g.fill();
  rect(g, bx, by + 2, bw / 2, bh - 3, "rgba(20,10,0,.15)");
  dot(g, bx, by + bh * 0.45, bw * 0.22, c.light);
  dot(g, bx, by + bh * 0.45, bw * 0.1, c.dark);
  const [dw, dh] = doors(kind);
  const doorTop = H - 5 - dh!;
  if (doorTop < by + bh + 2) {
    // short buildings: the door sits beside the banner
    door(g, W * 0.75, H - 5, dw!, Math.min(dh!, H - 5 - top - 4), true, "#5e3a1e");
  } else door(g, W / 2, H - 5, dw!, dh!, true, "#5e3a1e");
  for (const sx of kind === "town" || kind === "manor" || W > 70 ? [W * 0.15, W * 0.85 - 3] : [W * 0.2]) {
    round(g, sx, top + 8, 3, 9, 1.5, "#2a2620");
  }
}

/** Horse Clans: round felt tents with patterned cones. */
function yurt(g: G, kind: Kind, W: number, H: number, c: Team) {
  if (kind === "manor") {
    // a smaller tent joined on behind, for the larger household
    const ax = W - 9;
    const ay = H * 0.52;
    oval(g, ax + 2, H - 9, 12, 4, "rgba(30,44,14,.18)");
    rect(g, ax - 11, ay, 22, H - 10 - ay, "#e2d2ae");
    rect(g, ax + 2, ay, 9, H - 10 - ay, "rgba(80,60,30,.18)");
    shape(g, dim(c.main, 0.12), ax - 13, ay + 1, ax, ay - 14, ax + 13, ay + 1);
    shape(g, "rgba(20,10,0,.18)", ax, ay - 14, ax + 13, ay + 1, ax + 3, ay + 1);
  }
  const cx = kind === "manor" ? W / 2 - 4 : W / 2;
  const rx = W / 2 - (kind === "manor" ? 9 : 6);
  const y0 = H * 0.46;
  const y1 = H - 7;
  const felt = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
  felt.addColorStop(0, "#f6ead0");
  felt.addColorStop(0.55, "#e8d8b6");
  felt.addColorStop(1, "#c9b48c");
  g.fillStyle = felt;
  g.beginPath();
  g.moveTo(cx - rx, y0);
  g.lineTo(cx - rx, y1);
  g.ellipse(cx, y1, rx, 4, 0, Math.PI, 0, true);
  g.lineTo(cx + rx, y0);
  g.closePath();
  g.fill();
  g.save();
  g.clip();
  for (let x = cx - rx - 20; x < cx + rx; x += 6) {
    line(g, "rgba(140,105,60,.18)", 0.8, x, y0, x + 14, y1 + 4);
    line(g, "rgba(140,105,60,.18)", 0.8, x + 14, y0, x, y1 + 4);
  }
  g.restore();
  for (const yy of [y0 + 5, y1 - 5]) {
    g.strokeStyle = "#7a5230";
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(cx, yy, rx, 2.5, 0, 0.05, Math.PI - 0.05);
    g.stroke();
  }
  // a painted door
  round(g, cx - 7, y1 - 17, 14, 17, 1.5, "#3a2312");
  round(g, cx - 5.5, y1 - 15.5, 11, 15.5, 1, c.dark);
  shape(g, c.light, cx, y1 - 13, cx + 3.5, y1 - 8, cx, y1 - 3, cx - 3.5, y1 - 8);
  // the cone
  const cone = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
  cone.addColorStop(0, lit(c.main, 0.22));
  cone.addColorStop(0.5, c.main);
  cone.addColorStop(1, dim(c.main, 0.25));
  g.fillStyle = cone;
  g.beginPath();
  g.moveTo(cx - 4, 5);
  g.lineTo(cx + 4, 5);
  g.lineTo(cx + rx + 3, y0 + 1);
  g.ellipse(cx, y0 + 1, rx + 3, 3.5, 0, 0, Math.PI);
  g.closePath();
  g.fill();
  for (let i = -3; i <= 3; i++) line(g, dim(c.main, 0.3), 0.9, cx + i * 1.2, 6, cx + (i * (rx + 3)) / 3.2, y0 + 2);
  // a zigzag band round the bottom of the cone
  g.strokeStyle = lit(c.light, 0.2);
  g.lineWidth = 1.4;
  g.beginPath();
  for (let x = cx - rx; x <= cx + rx; x += 4) g.lineTo(x, y0 - 3 + ((x - cx + rx) % 8 < 4 ? 0 : 2.5));
  g.stroke();
  oval(g, cx, 5, 5, 2.2, "#5a3a1e");
  oval(g, cx, 4.6, 3, 1.2, "#2a1a0d");
}

/** Sun Harbor: sandstone, arches and coloured domes. */
function sun(g: G, kind: Kind, W: number, H: number, c: Team) {
  const top = H * 0.44;
  const x0 = 6;
  const x1 = W - 6;
  const wall = g.createLinearGradient(x0, 0, x1, 0);
  wall.addColorStop(0, "#f6e2b6");
  wall.addColorStop(0.6, "#ecd3a2");
  wall.addColorStop(1, "#d6b884");
  g.fillStyle = wall;
  g.fillRect(x0, top, x1 - x0, H - 5 - top);
  for (let i = 0; i < 10; i++) dot(g, x0 + hash(i, W, 1) * (x1 - x0), top + 4 + hash(i, H, 2) * (H - 12 - top), 1.6 + hash(i, 3, 3) * 2, "rgba(190,150,90,.18)");
  rect(g, x0 - 2, top - 5, x1 - x0 + 4, 5, "#fbecc8");
  for (let x = x0; x < x1 - 2; x += 5) rect(g, x, top, 3, 2, "rgba(150,110,60,.35)");
  // domes on drums
  const domes = W > 70 || kind === "manor" ? [0.3, 0.7] : [0.5];
  const r = W > 70 ? Math.min(W * 0.19, top - 6) : kind === "manor" ? Math.min(W * 0.21, top - 6) : Math.min(W * 0.3, top - 6);
  for (const k of domes) {
    const dx = W * k;
    rect(g, dx - r * 0.85, top - 9, r * 1.7, 5, "#efd8aa");
    const dome = g.createRadialGradient(dx - r * 0.4, top - 9 - r * 0.6, r * 0.1, dx, top - 9, r * 1.1);
    dome.addColorStop(0, lit(c.main, 0.4));
    dome.addColorStop(0.6, c.main);
    dome.addColorStop(1, dim(c.main, 0.3));
    g.fillStyle = dome;
    g.beginPath();
    g.arc(dx, top - 9, r, Math.PI, Math.PI * 2);
    g.fill();
    for (const f of [-0.5, 0, 0.5]) {
      g.strokeStyle = dim(c.main, 0.25);
      g.lineWidth = 0.8;
      g.beginPath();
      g.ellipse(dx, top - 9, Math.abs(f) * r || 0.5, r, 0, Math.PI, Math.PI * (f < 0 ? 1.5 : 2), false);
      g.stroke();
    }
    line(g, "#a07a30", 1.4, dx, top - 9 - r, dx, top - 16 - r);
    dot(g, dx, top - 16 - r, 2.3, "#ffd84a");
    dot(g, dx - 0.7, top - 16.7 - r, 0.8, "#fff4b8");
  }
  const [dw, dh] = doors(kind);
  door(g, W / 2, H - 5, dw!, dh!, true, "#7a4626");
  // blue tile round the door and shaded arched windows
  g.strokeStyle = "#3f7fa8";
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(W / 2, H - 5 - dh! + dw! / 2, dw! / 2 + 3, Math.PI, 0);
  g.stroke();
  for (const wx of W > 70 || kind === "manor" ? [W * 0.16, W * 0.84 - 8] : [W * 0.17]) {
    g.fillStyle = "#3a4a5a";
    g.beginPath();
    g.moveTo(wx, top + 18);
    g.lineTo(wx, top + 9);
    g.arc(wx + 4, top + 9, 4, Math.PI, 0);
    g.lineTo(wx + 8, top + 18);
    g.fill();
    rect(g, wx - 1, top + 18, 10, 1.5, "#fbecc8");
  }
  rect(g, x0 + (x1 - x0) * 0.7, top, (x1 - x0) * 0.3, H - 5 - top, "rgba(90,50,10,.12)");
  // a potted plant by the door
  const px = W / 2 + dw! / 2 + 7;
  shape(g, "#c06a3c", px - 3.5, H - 11, px + 3.5, H - 11, px + 2.5, H - 5, px - 2.5, H - 5);
  dot(g, px, H - 14, 4, "#4f8f34");
  dot(g, px - 1.5, H - 15.5, 2.2, "#7cba4c");
}

/** What each kind of building has out front, whoever built it. */
function extras(g: G, kind: Kind, W: number, H: number, c: Team, style: number) {
  if (kind === "barracks") {
    // spears in a rack, and a shield on the wall
    for (let i = 0; i < 3; i++) {
      line(g, "#7a4a26", 1.4, 9 + i * 4, H - 4, 13 + i * 4, H - 28);
      shape(g, "#d8dde0", 12 + i * 4, H - 32, 14.5 + i * 4, H - 27, 11.5 + i * 4, H - 27.5);
    }
    rect(g, 6, H - 14, 18, 2, "#5a3a1e");
    const sx = W - 18;
    const sy = H - 22;
    dot(g, sx, sy, 7, "#6a5a4a");
    dot(g, sx, sy, 6, c.main);
    shape(g, c.light, sx, sy - 5, sx + 1.5, sy, sx, sy + 5, sx - 1.5, sy);
    dot(g, sx, sy, 1.8, "#d8c070");
  } else if (kind === "range") {
    const tx = W - 15;
    const ty = H - 18;
    line(g, "#6e4524", 1.6, tx - 5, H - 3, tx, ty, tx + 5, H - 3);
    dot(g, tx, ty, 8.5, "#d8b86a");
    dot(g, tx, ty, 7, "#f4ecd8");
    dot(g, tx, ty, 5, "#c03a2c");
    dot(g, tx, ty, 3, "#f4ecd8");
    dot(g, tx, ty, 1.4, "#e8c33a");
    line(g, "#5a3a1e", 1, tx + 2, ty - 1, tx + 9, ty - 6);
  } else if (kind === "stable") {
    // a horse looking over its half-door, and hay
    const hx = W * 0.24;
    const hy = H - 18;
    rect(g, hx - 8, hy - 2, 16, 15, "#3a2312");
    rect(g, hx - 8, hy + 5, 16, 8, "#8a5a30");
    oval(g, hx, hy - 3, 4.5, 6.5, "#7a4a28");
    oval(g, hx, hy + 1.5, 3.4, 3, "#9a6a40");
    shape(g, "#5a3418", hx - 4, hy - 7, hx - 2.5, hy - 12, hx - 1, hy - 7.5);
    shape(g, "#5a3418", hx + 4, hy - 7, hx + 2.5, hy - 12, hx + 1, hy - 7.5);
    rect(g, hx - 0.8, hy - 7, 1.6, 6, "#f4ecd8");
    dot(g, hx - 2.2, hy - 4, 0.9, "#1a100a");
    dot(g, hx + 2.2, hy - 4, 0.9, "#1a100a");
    round(g, W - 30, H - 13, 22, 9, 3, "#e0bd4a");
    for (let i = 0; i < 4; i++) line(g, "#b8922e", 0.8, W - 27 + i * 5, H - 12, W - 27 + i * 5, H - 5);
    rect(g, W - 30, H - 9, 22, 1, "#8a6a20");
  } else if (kind === "workshop") {
    const wx = W - 18;
    const wy = H - 14;
    dot(g, wx, wy, 10, "#5a3a1e");
    dot(g, wx, wy, 8.2, "#c39254");
    for (let i = 0; i < 6; i++) line(g, "#5a3a1e", 1.4, wx, wy, wx + Math.cos((i * Math.PI) / 3) * 8, wy + Math.sin((i * Math.PI) / 3) * 8);
    dot(g, wx, wy, 2.4, "#3a2312");
    rect(g, 8, H - 9, 28, 4, "#9a6a38");
    rect(g, 12, H - 13, 24, 4, "#b07a44");
    rect(g, 8, H - 9, 28, 1, "rgba(255,230,180,.3)");
  } else if (kind === "smithy") {
    // an anvil and the glow of the forge
    rect(g, 9, H - 13, 13, 4, "#2e3236");
    rect(g, 12, H - 9, 7, 5, "#2e3236");
    rect(g, 9, H - 13, 13, 1.2, "#7a8288");
    round(g, W - 23, H - 21, 12, 10, 2, "#2a1a10");
    const fire = g.createRadialGradient(W - 17, H - 14, 0.5, W - 17, H - 15, 7);
    fire.addColorStop(0, "#fff0a0");
    fire.addColorStop(0.5, "#ff9a30");
    fire.addColorStop(1, "rgba(200,60,10,0)");
    g.fillStyle = fire;
    g.fillRect(W - 26, H - 24, 18, 16);
  } else if (kind === "store") {
    crate(g, 6, H - 15, 10);
    crate(g, 14, H - 12, 8);
    barrel(g, W - 12, H - 3);
    oval(g, W - 22, H - 6, 5, 4, "#d8c08a");
    oval(g, W - 22, H - 8, 3.5, 2, "#c4a86e");
  } else if (kind === "house" && style === STYLE.horse) {
    line(g, "#7a5230", 1, W - 6, H - 22, W + 2, H - 4);
  }
}

/** Watch towers, one for each people. */
function tower(g: G, W: number, H: number, c: Team, style: number) {
  const cx = W / 2;
  if (style === STYLE.forest) {
    // a timber watchtower on stilts
    for (const lx of [cx - 13, cx + 13]) line(g, "#6e4524", 4, lx, H - 4, lx + (lx < cx ? 4 : -4), 6);
    line(g, "#8a5a30", 1.6, cx - 11, H - 8, cx + 11, 22, cx - 11, 22, cx + 11, H - 8);
    for (let y = 30; y < H - 6; y += 7) line(g, "#a07040", 1.6, cx + 3, y, cx + 9, y);
    rect(g, cx - 17, 4, 34, 9, "#a87a44");
    for (let x = cx - 17; x < cx + 17; x += 5) line(g, "#6e4824", 0.8, x, 4, x, 13);
    rect(g, cx + 6, 4, 11, 9, "rgba(40,18,4,.2)");
    shape(g, c.main, cx - 20, 5, cx, -22, cx + 20, 5);
    shape(g, dim(c.main, 0.25), cx, -22, cx + 20, 5, cx + 4, 5);
    shape(g, lit(c.main, 0.25), cx, -22, cx - 20, 5, cx - 10, 5);
    dot(g, cx, -22, 1.8, "#4a2c17");
    return;
  }
  if (style === STYLE.horse) {
    for (const lx of [cx - 12, cx, cx + 12]) line(g, "#7a4a26", 3, lx, H - 4, cx + (lx - cx) * 0.6, 8);
    rect(g, cx - 15, 6, 30, 7, "#9a6a38");
    const cone = g.createLinearGradient(cx - 18, 0, cx + 18, 0);
    cone.addColorStop(0, lit(c.main, 0.2));
    cone.addColorStop(1, dim(c.main, 0.25));
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(cx, -24);
    g.lineTo(cx + 19, 7);
    g.ellipse(cx, 7, 19, 3, 0, 0, Math.PI);
    g.closePath();
    g.fill();
    line(g, lit(c.light, 0.2), 1.3, cx - 15, 1, cx + 15, 1);
    flag(g, cx, -24, 10, c);
    return;
  }
  // a tower of stone: square for the Stone Holds, round and domed for Sun Harbor
  const round_ = style === STYLE.sun;
  const body = g.createLinearGradient(cx - 14, 0, cx + 14, 0);
  body.addColorStop(0, round_ ? "#f8e6bc" : "#c9c6bb");
  body.addColorStop(0.6, round_ ? "#e8cf9c" : "#b3b0a6");
  body.addColorStop(1, round_ ? "#cdae78" : "#8e8b83");
  g.fillStyle = body;
  if (round_) {
    g.beginPath();
    g.moveTo(cx - 12, 2);
    g.lineTo(cx - 13, H - 6);
    g.ellipse(cx, H - 6, 13, 3, 0, Math.PI, 0, true);
    g.lineTo(cx + 12, 2);
    g.fill();
  } else g.fillRect(cx - 14, 2, 28, H - 7);
  if (!round_)
    for (let y = 6, row = 0; y < H - 6; y += 7, row++) {
      line(g, "rgba(70,64,58,.35)", 0.8, cx - 14, y, cx + 14, y);
      for (let x = cx - 14 + (row % 2) * 7; x < cx + 14; x += 14) line(g, "rgba(70,64,58,.35)", 0.8, x, y - 7, x, y);
    }
  for (const y of [14, 30]) round(g, cx - 1.5, y, 3, 9, 1.5, "#2a2620");
  round(g, cx - 5, H - 19, 10, 14, 4, "#3a2312");
  if (round_) {
    rect(g, cx - 15, 0, 30, 4, "#fbecc8");
    const dome = g.createRadialGradient(cx - 4, -8, 1, cx, -2, 15);
    dome.addColorStop(0, lit(c.main, 0.4));
    dome.addColorStop(1, dim(c.main, 0.25));
    g.fillStyle = dome;
    g.beginPath();
    g.arc(cx, 0, 13, Math.PI, Math.PI * 2);
    g.fill();
    line(g, "#a07a30", 1.4, cx, -13, cx, -19);
    dot(g, cx, -19, 2.3, "#ffd84a");
  } else {
    rect(g, cx - 17, -4, 34, 7, "#d2cfc4");
    for (let i = 0; i < 4; i++) {
      rect(g, cx - 17 + i * 9.5, -11, 6, 7, "#d8d5ca");
      rect(g, cx - 13.5 + i * 9.5, -11, 2.5, 7, "rgba(40,36,30,.2)");
    }
    flag(g, cx + 2, -11, 16, c);
    rect(g, cx - 14, 8, 28, 4, c.main);
    rect(g, cx, 8, 14, 4, "rgba(0,0,0,.15)");
  }
}

/** A wooden pier with a boathouse in the owner's style. */
function dock(g: G, W: number, H: number, c: Team, style: number) {
  for (const [px, py] of [[3, 7], [W - 7, 7], [3, H - 6], [W - 7, H - 6], [W / 2 - 2, H - 6]] as const) {
    oval(g, px + 2, py + 3, 3.5, 2, "rgba(20,40,60,.3)");
    rect(g, px, py - 4, 4, 8, "#5a3a1e");
  }
  for (let i = 0; i < 7; i++) {
    const y = 7 + i * 7.6;
    rect(g, 2, y, W - 4, 6.6, i % 2 ? "#a87a44" : "#b98a52");
    rect(g, 2, y, W - 4, 1, "rgba(255,230,180,.3)");
    rect(g, 2, y + 5.6, W - 4, 1, "rgba(60,30,10,.3)");
  }
  // the boathouse
  const bx = 13;
  const by = 18;
  rect(g, bx, by, 32, 22, ["#b07a46", "#b3b2aa", "#e6d6b4", "#ecd3a2"][style]!);
  rect(g, bx + 22, by, 10, 22, "rgba(40,20,5,.18)");
  round(g, bx + 11, by + 8, 10, 14, 2, "#3a2312");
  if (style === STYLE.sun) {
    g.fillStyle = c.main;
    g.beginPath();
    g.arc(bx + 16, by + 1, 15, Math.PI, Math.PI * 2);
    g.fill();
  } else if (style === STYLE.stone) {
    rect(g, bx - 2, by - 7, 36, 8, c.main);
    for (let i = 0; i < 4; i++) rect(g, bx - 2 + i * 10, by - 12, 6, 5, "#d2cfc4");
  } else {
    shape(g, c.main, bx - 4, by + 2, bx + 16, by - (style === STYLE.horse ? 12 : 18), bx + 36, by + 2);
    shape(g, dim(c.main, 0.25), bx + 16, by - (style === STYLE.horse ? 12 : 18), bx + 36, by + 2, bx + 20, by + 2);
  }
  // a coil of rope and a little crane
  g.strokeStyle = "#c8a870";
  g.lineWidth = 1.3;
  for (const r of [3.5, 2.2]) {
    g.beginPath();
    g.arc(W - 12, H - 14, r, 0, Math.PI * 2);
    g.stroke();
  }
  line(g, "#5a3a1e", 2.2, W - 8, H - 18, W - 8, -6, W + 4, -2);
  line(g, "#c8a870", 0.8, W + 4, -2, W + 4, 10);
  flag(g, W - 8, -6, 0.1, c);
}

/** A tilled field with rows of wheat and the owner's colours on the fence posts. */
function farm(g: G, W: number, H: number, c: Team) {
  round(g, 2, 2, W - 4, H - 4, 3, "#8a6238");
  for (let i = 0; i < 6; i++) {
    const y = 6 + i * 9.4;
    rect(g, 5, y + 4.5, W - 10, 2.8, "#6a4626");
    const wheat = g.createLinearGradient(0, y - 2, 0, y + 5);
    wheat.addColorStop(0, "#f2d56a");
    wheat.addColorStop(1, "#b8922e");
    g.fillStyle = wheat;
    g.fillRect(5, y, W - 10, 4.5);
    for (let x = 6 + (i % 2) * 3; x < W - 7; x += 4.5) {
      line(g, "#e8c84e", 1.1, x, y + 3, x - 0.6, y - 2.2);
      dot(g, x - 0.6, y - 2.4, 0.9, "#fbe68a");
    }
  }
  for (const [px, py] of [[0, 0], [W - 5, 0], [0, H - 5], [W - 5, H - 5]] as const) {
    rect(g, px, py, 5, 5, c.dark);
    rect(g, px + 1, py + 1, 3, 3, c.main);
  }
  g.strokeStyle = "rgba(90,60,30,.7)";
  g.lineWidth = 0.9;
  g.strokeRect(2.5, 2.5, W - 5, H - 5);
}

// ── grander buildings, and how a town grows with the ages ───────────────────────────
/** a slim tower of the owner's people, for flanking a Hall and guarding a castle */
function turret(g: G, x: number, top: number, bottom: number, w: number, c: Team, style: number, crown: boolean) {
  const cx = x + w / 2;
  const sun_ = style === STYLE.sun;
  const body = g.createLinearGradient(x, 0, x + w, 0);
  body.addColorStop(0, sun_ ? "#f8e6bc" : style === STYLE.horse ? "#b98a52" : "#c9c6bb");
  body.addColorStop(0.65, sun_ ? "#e6cc98" : style === STYLE.horse ? "#9a6a38" : "#aeaba1");
  body.addColorStop(1, sun_ ? "#c9a874" : style === STYLE.horse ? "#7a5230" : "#8b887f");
  g.fillStyle = body;
  g.fillRect(x, top, w, bottom - top);
  if (style === STYLE.horse) for (let yy = top + 4; yy < bottom; yy += 6) line(g, "rgba(60,30,10,.35)", 0.8, x, yy, x + w, yy);
  else if (!sun_)
    for (let yy = top + 5, row = 0; yy < bottom; yy += 6, row++) {
      line(g, "rgba(70,64,58,.3)", 0.7, x, yy, x + w, yy);
      line(g, "rgba(70,64,58,.3)", 0.7, x + (row % 2 ? w / 2 : w / 4), yy - 6, x + (row % 2 ? w / 2 : w / 4), yy);
    }
  round(g, cx - 1.2, top + 8, 2.4, 6, 1.2, "#2a2620");
  if (style === STYLE.stone) {
    rect(g, x - 2, top - 4, w + 4, 5, "#d2cfc4");
    for (let i = 0; i < 3; i++) rect(g, x - 2 + i * ((w + 4 - 4) / 2), top - 9, 4.5, 5, "#d8d5ca");
    if (crown) flag(g, cx, top - 9, 13, c);
  } else if (sun_) {
    rect(g, x - 1.5, top - 3, w + 3, 3.5, "#fbecc8");
    const dome = g.createRadialGradient(cx - w * 0.2, top - w * 0.4, 0.5, cx, top - 3, w * 0.7);
    dome.addColorStop(0, lit(c.main, 0.4));
    dome.addColorStop(1, dim(c.main, 0.25));
    g.fillStyle = dome;
    g.beginPath();
    g.arc(cx, top - 3, w / 2, Math.PI, Math.PI * 2);
    g.fill();
    line(g, "#a07a30", 1.2, cx, top - 3 - w / 2, cx, top - 9 - w / 2);
    dot(g, cx, top - 9 - w / 2, 1.8, "#ffd84a");
  } else {
    // a steep cone: shingles for the Forest Folk, felt for the Horse Clans
    shape(g, c.main, x - 3, top + 1, cx, top - w * 1.05, x + w + 3, top + 1);
    shape(g, dim(c.main, 0.25), cx, top - w * 1.05, x + w + 3, top + 1, cx + 2, top + 1);
    shape(g, lit(c.main, 0.22), cx, top - w * 1.05, x - 3, top + 1, cx - 3, top + 1);
    if (crown) flag(g, cx, top - w * 1.05, 9, c);
  }
}

/** What a building gains as its people move up the ages: more care, colour and gold. */
function ageMarks(g: G, kind: Kind, W: number, H: number, c: Team, style: number, age: number) {
  if (age < 2 || kind === "farm" || kind === "dock" || kind === "tower" || kind === "castle" || kind === "market") return;
  const gold = "#e8c24a";
  if (style === STYLE.forest) {
    // a dressed-stone footing, a pennant on the ridge
    for (let x = 7, i = 0; x < W - 8; x += 7, i++) round(g, x, H - 9, 6.5, 4.5, 1, i % 2 ? "#a9a69d" : "#bdbab0");
    flag(g, W * 0.76, 3, 10, c);
    if (age >= 3) {
      for (let x = W * 0.26; x <= W * 0.74; x += W * 0.08) dot(g, x, 2.5, 1.5, gold);
      flag(g, W * 0.24, 3, 10, c);
    }
  } else if (style === STYLE.stone) {
    // torches by the door, gold on the banner
    const top = H * (kind === "town" ? 0.3 : kind === "manor" ? 0.26 : 0.34);
    for (const tx of [W / 2 - 13, W / 2 + 11]) {
      rect(g, tx, H - 20, 2, 6, "#4a3a2a");
      dot(g, tx + 1, H - 21.5, 2.2, "#ffb347");
      dot(g, tx + 1, H - 22, 1.1, "#fff0a0");
    }
    line(g, gold, 1, W / 2 - (kind === "town" ? 11 : 7.5), top + 2.5, W / 2 + (kind === "town" ? 11 : 7.5), top + 2.5);
    if (age >= 3) {
      const n = Math.max(3, Math.round((W - 10) / 13));
      for (let i = 0; i < n; i++) rect(g, 3 + (i * (W - 13)) / (n - 1), top - 14, 7, 1.6, gold);
      dot(g, W / 2, top - 18, 3.2, gold);
      dot(g, W / 2, top - 18, 1.6, c.main);
    }
  } else if (style === STYLE.horse) {
    // a second patterned band and a pennant on the smoke ring
    const cx = kind === "manor" ? W / 2 - 4 : W / 2;
    const rx = W / 2 - (kind === "manor" ? 9 : 6);
    const y0 = H * 0.46;
    g.strokeStyle = c.light;
    g.lineWidth = 1.6;
    g.beginPath();
    for (let x = cx - rx; x <= cx + rx; x += 3) g.lineTo(x, y0 + 9 + ((x - cx + rx) % 6 < 3 ? 0 : 2));
    g.stroke();
    flag(g, cx, 4, 9, c);
    if (age >= 3) {
      oval(g, cx, 5, 5.5, 2.4, gold);
      for (const tx of [cx - rx + 3, cx + rx - 3]) {
        line(g, "#5a3a1e", 1.4, tx, H - 6, tx, H - 26);
        shape(g, "#3a2a1a", tx - 2.5, H - 26, tx + 2.5, H - 26, tx + 1.5, H - 18, tx - 1.5, H - 18);
        dot(g, tx, H - 27, 1.4, gold);
      }
    }
  } else {
    // a band of blue tiles, lanterns, then gold on the domes
    const top = H * 0.44;
    for (let x = 6; x < W - 7; x += 4) rect(g, x, top + 2.5, 3, 3, (x / 4) % 2 ? "#3f7fa8" : "#e8f0f4");
    for (const lx of [W / 2 - 15, W / 2 + 13]) {
      line(g, "#5a4a3a", 0.8, lx + 1, top + 6, lx + 1, top + 10);
      round(g, lx - 1, top + 10, 4, 5, 1.5, "#c88a3a");
      dot(g, lx + 1, top + 12.5, 1.2, "#fff0a0");
    }
    if (age >= 3) {
      const domes = W > 70 || kind === "manor" ? [0.3, 0.7] : [0.5];
      const r = W > 70 ? Math.min(W * 0.19, top - 6) : kind === "manor" ? Math.min(W * 0.21, top - 6) : Math.min(W * 0.3, top - 6);
      for (const k of domes) {
        g.strokeStyle = gold;
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(W * k, top - 9, r - 0.8, Math.PI * 1.08, Math.PI * 1.92);
        g.stroke();
      }
    }
  }
}

/** A Hall grows: flanking towers in the Town age, flags and gold in the Castle age. Drawn behind the Hall. */
function hallWings(g: G, W: number, H: number, c: Team, style: number, age: number) {
  if (age < 2) return;
  for (const x of [-6, W - 14]) {
    oval(g, x + 12, H - 5, 14, 5, "rgba(30,44,14,.18)");
    turret(g, x, H * 0.12, H - 6, 20, c, style, age >= 3);
  }
}

/** The market: stalls under striped awnings, a little house of the owner's people behind. */
function market(g: G, W: number, H: number, c: Team, style: number) {
  const paved = style === STYLE.stone || style === STYLE.sun;
  round(g, 2, 26, W - 4, H - 28, 6, paved ? "#cfc6b0" : "#bfa47a");
  for (let i = 0; i < 40; i++) {
    const x = 6 + hash(i, 1, W) * (W - 12);
    const y = 30 + hash(i, 2, W) * (H - 36);
    if (paved) round(g, x, y, 6, 4, 1, i % 2 ? "rgba(150,140,120,.35)" : "rgba(240,232,210,.4)");
    else dot(g, x, y, 1, "rgba(120,90,50,.35)");
  }
  // the house behind
  g.save();
  g.translate(W / 2 - 24, -10);
  g.scale(0.75, 0.75);
  if (style === STYLE.stone) stone(g, "house", 64, 64, c);
  else if (style === STYLE.horse) yurt(g, "house", 64, 64, c);
  else if (style === STYLE.sun) sun(g, "house", 64, 64, c);
  else forest(g, "house", 64, 64, c);
  g.restore();
  // three stalls
  const goods = ["food", "wood", "stone"] as const;
  for (let i = 0; i < 3; i++) {
    const x = 5 + i * 30;
    const y = 54;
    oval(g, x + 15, y + 28, 15, 4, "rgba(30,24,10,.2)");
    for (const px of [x + 2, x + 24]) rect(g, px, y - 2, 2.2, 28, "#6e4524");
    rect(g, x, y + 12, 27, 9, "#a87a44");
    rect(g, x, y + 12, 27, 2, "#c99a62");
    rect(g, x + 16, y + 12, 11, 9, "rgba(40,20,5,.2)");
    const ware = goods[i]!;
    if (ware === "food") {
      for (let k = 0; k < 7; k++) dot(g, x + 4 + k * 3.2, y + 10 - (k % 2) * 1.6, 2.1, k % 3 ? "#d23a2c" : "#7cba3c");
      oval(g, x + 21, y + 9, 4.5, 2.6, "#d8a04a");
    } else if (ware === "wood") {
      for (let k = 0; k < 3; k++) {
        round(g, x + 3, y + 9.5 - k * 3.2, 20, 3.4, 1.7, k % 2 ? "#9a6a38" : "#b07a44");
        dot(g, x + 22.5, y + 11.2 - k * 3.2, 1.6, "#d8b07a");
      }
    } else {
      shape(g, "#8e8b83", x + 3, y + 12, x + 5, y + 6, x + 11, y + 5, x + 13, y + 12);
      shape(g, "#bdbab0", x + 5, y + 7, x + 11, y + 6, x + 10, y + 10);
      for (let k = 0; k < 4; k++) oval(g, x + 19 + (k % 2) * 3, y + 10 - Math.floor(k / 2) * 2, 2.6, 1.3, k % 2 ? "#c8961e" : "#ffd84a");
    }
    // the awning, striped in the owner's colours
    for (let k = 0; k < 5; k++) shape(g, k % 2 ? "#f6ecd6" : c.main, x - 2 + k * 6.2, y - 4, x + 4.2 + k * 6.2, y - 4, x + 5.2 + k * 6.2, y + 3, x - 1 + k * 6.2, y + 3);
    rect(g, x - 2, y - 5, 31.5, 1.6, dim(c.main, 0.3));
    for (let k = 0; k < 5; k++) dot(g, x + 1.1 + k * 6.2, y + 3, 1.6, k % 2 ? "#f6ecd6" : c.main);
  }
  // a hanging sign with scales
  line(g, "#5a3a1e", 2, W - 8, H - 4, W - 8, 34);
  line(g, "#5a3a1e", 1.6, W - 8, 36, W - 22, 36);
  round(g, W - 24, 38, 14, 11, 2, "#e8d8b0");
  line(g, "#8a6a30", 1, W - 17, 40, W - 17, 47, W - 22, 47, W - 12, 47);
  line(g, "#8a6a30", 1, W - 21, 42, W - 13, 42);
  oval(g, W - 21, 44, 2.2, 1, "#c8961e");
  oval(g, W - 13, 44, 2.2, 1, "#c8961e");
  barrel(g, 9, H - 3);
  crate(g, 15, H - 10, 8);
}

/** A castle: curtain walls, four towers, a keep and a gatehouse, built the owner's way. */
function castle(g: G, W: number, H: number, c: Team, style: number) {
  const wallTop = style === STYLE.sun ? "#fbecc8" : style === STYLE.horse ? "#b98a52" : "#d2cfc4";
  const wallFace = style === STYLE.sun ? "#ecd3a2" : style === STYLE.horse ? "#a07040" : "#b6b3a9";
  const wallDark = style === STYLE.sun ? "#cdae78" : style === STYLE.horse ? "#7a5230" : "#8e8b83";
  const battlement = (x: number, y: number, w: number) => {
    rect(g, x, y, w, 5, wallTop);
    if (style === STYLE.horse) for (let k = x; k < x + w - 2; k += 4) shape(g, "#9a6a35", k, y, k + 2, y - 4, k + 4, y);
    else for (let k = x; k < x + w - 4; k += 9) rect(g, k, y - 5, 5.5, 5, wallTop);
  };
  // the back wall and its towers
  rect(g, 18, 18, W - 36, 12, wallFace);
  battlement(18, 14, W - 36);
  for (const x of [4, W - 28]) turret(g, x, 4, 40, 24, c, style, true);
  // the keep
  const kx = 34;
  const kw = W - 68;
  const keep = g.createLinearGradient(kx, 0, kx + kw, 0);
  keep.addColorStop(0, wallTop);
  keep.addColorStop(0.6, wallFace);
  keep.addColorStop(1, wallDark);
  g.fillStyle = keep;
  g.fillRect(kx, -14, kw, 88);
  if (style !== STYLE.sun && style !== STYLE.horse)
    for (let y = -8, row = 0; y < 74; y += 7, row++) {
      line(g, "rgba(70,64,58,.3)", 0.7, kx, y, kx + kw, y);
      for (let x = kx + (row % 2) * 7; x < kx + kw; x += 14) line(g, "rgba(70,64,58,.3)", 0.7, x, y - 7, x, y);
    }
  if (style === STYLE.sun) {
    const dome = g.createRadialGradient(W / 2 - 8, -30, 2, W / 2, -16, 28);
    dome.addColorStop(0, lit(c.main, 0.4));
    dome.addColorStop(1, dim(c.main, 0.25));
    g.fillStyle = dome;
    g.beginPath();
    g.arc(W / 2, -14, kw / 2 - 4, Math.PI, Math.PI * 2);
    g.fill();
    line(g, "#a07a30", 1.6, W / 2, -14 - kw / 2 + 4, W / 2, -24 - kw / 2 + 4);
    dot(g, W / 2, -24 - kw / 2 + 4, 3, "#ffd84a");
  } else if (style === STYLE.forest || style === STYLE.horse) {
    shape(g, c.main, kx - 4, -12, W / 2, -48, kx + kw + 4, -12);
    shape(g, dim(c.main, 0.25), W / 2, -48, kx + kw + 4, -12, W / 2 + 4, -12);
    shape(g, lit(c.main, 0.2), W / 2, -48, kx - 4, -12, W / 2 - 6, -12);
    flag(g, W / 2, -48, 14, c);
  } else {
    battlement(kx - 2, -18, kw + 4);
    flag(g, W / 2, -23, 22, c);
  }
  for (const wx of [kx + 10, kx + kw - 16]) for (const wy of [6, 30]) round(g, wx, wy, 6, 10, 3, "#2a2620");
  // a great banner
  g.fillStyle = c.main;
  g.beginPath();
  g.moveTo(W / 2 - 10, 2);
  g.lineTo(W / 2 + 10, 2);
  g.lineTo(W / 2 + 10, 38);
  g.lineTo(W / 2, 32);
  g.lineTo(W / 2 - 10, 38);
  g.closePath();
  g.fill();
  rect(g, W / 2, 2, 10, 34, "rgba(20,10,0,.15)");
  dot(g, W / 2, 16, 5, c.light);
  dot(g, W / 2, 16, 2.4, "#e8c24a");
  // side walls, seen from above
  for (const x of [8, W - 22]) {
    rect(g, x, 36, 14, 52, wallTop);
    rect(g, x + 10, 36, 4, 52, "rgba(40,30,20,.18)");
  }
  // the front wall and gatehouse
  rect(g, 20, 86, W - 40, 34, wallFace);
  for (let y = 92; y < 120; y += 7) line(g, "rgba(70,64,58,.25)", 0.7, 20, y, W - 20, y);
  rect(g, W - 46, 86, 26, 34, "rgba(30,20,10,.16)");
  battlement(20, 82, W - 40);
  const gx = W / 2;
  rect(g, gx - 16, 76, 32, 44, wallFace);
  battlement(gx - 18, 72, 36);
  g.fillStyle = "#2a1a10";
  g.beginPath();
  g.moveTo(gx - 10, 120);
  g.lineTo(gx - 10, 98);
  g.arc(gx, 98, 10, Math.PI, 0);
  g.lineTo(gx + 10, 120);
  g.fill();
  for (let k = -7; k <= 7; k += 3.5) line(g, "#5c5c58", 1.2, gx + k, 92, gx + k, 120);
  for (let k = 98; k < 120; k += 5) line(g, "#5c5c58", 1.2, gx - 9, k, gx + 9, k);
  for (const fx of [gx - 14, gx + 14]) flag(g, fx, 66, 12, c);
  // the front towers
  for (const x of [0, W - 26]) {
    oval(g, x + 14, H - 6, 16, 5, "rgba(30,44,14,.2)");
    turret(g, x, 64, H - 6, 26, c, style, true);
  }
}

/** A whole finished building, painted once for each age. */
function paint(g: G, kind: Kind, style: number, c: Team, age: number) {
  const s = BUILDINGS[kind];
  const W = s.w * 32;
  const H = s.h * 32;
  if (kind === "farm") return farm(g, W, H, c);
  if (kind === "dock") return dock(g, W, H, c, style);
  base(g, W, H);
  if (kind === "tower") return tower(g, W, H, c, style);
  if (kind === "market") return market(g, W, H, c, style);
  if (kind === "castle") return castle(g, W, H, c, style);
  if (kind === "town") hallWings(g, W, H, c, style, age);
  if (style === STYLE.stone) stone(g, kind, W, H, c);
  else if (style === STYLE.horse) yurt(g, kind, W, H, c);
  else if (style === STYLE.sun) sun(g, kind, W, H, c);
  else forest(g, kind, W, H, c);
  extras(g, kind, W, H, c, style);
  ageMarks(g, kind, W, H, c, style, age);
  if (kind === "town") flag(g, W / 2, style === STYLE.forest ? 3 : style === STYLE.horse ? 5 : style === STYLE.sun ? H * 0.44 - 9 - Math.min(W * 0.19, H * 0.44 - 6) - 16 : H * 0.3 - 13, 22, c);
}

/** Walls, palisades and gates; `links` says which sides (up, right, down, left on screen) join on. */
function wallPiece(g: G, kind: Kind, links: boolean[], c: Team) {
  const [up, right, downLink, left] = links;
  if (kind === "gate") {
    const sideways = (right || left) && !(up || downLink);
    shadowRect(g);
    if (sideways) {
      // doors across a wall running left to right
      rect(g, 0, 8, 32, 18, "#3a2312");
      for (let i = 0; i < 6; i++) rect(g, 3 + i * 4.4, 10, 3.6, 15, i % 2 ? "#8a5a30" : "#9a6a38");
      for (const y of [13, 21]) rect(g, 3, y, 26, 1.8, "#4e5458");
    } else {
      rect(g, 7, 0, 18, 32, "#3a2312");
      for (let i = 0; i < 6; i++) rect(g, 9, 2 + i * 4.8, 14, 4, i % 2 ? "#8a5a30" : "#9a6a38");
      for (const x of [12, 19]) rect(g, x, 2, 1.8, 28, "#4e5458");
    }
    for (const [px, py] of sideways ? [[0, 6], [26, 6]] : [[5, -2], [21, 26]]) {
      rect(g, px!, py!, 6, 22, "#6e4524");
      rect(g, px! + 4, py!, 2, 22, "rgba(0,0,0,.2)");
    }
    flag(g, sideways ? 3 : 8, sideways ? 6 : -2, 10, c);
    return;
  }
  const stone_ = kind === "wall";
  const arm = (dx: number, dy: number) => {
    // one stretch of wall from the middle out to an edge
    const horiz = dx !== 0;
    const x = horiz ? (dx > 0 ? 16 : 0) : 9;
    const y = horiz ? 8 : dy > 0 ? 16 : 0;
    const w = horiz ? 16 : 14;
    const h = horiz ? 16 : 16;
    if (stone_) {
      rect(g, x, y, w, h, "#a9a69d");
      rect(g, x, y, w, horiz ? 6 : h, "#c9c6bb");
      if (horiz) for (let i = 0; i < 2; i++) rect(g, x + 1 + i * 8, y - 4, 5, 5, "#d2cfc4");
      else for (let i = 0; i < 2; i++) for (const sx of [x, x + w - 3]) rect(g, sx, y + 1 + i * 8, 3, 5, "#d8d5ca");
      if (horiz) for (let i = 0; i < 2; i++) line(g, "rgba(70,64,58,.35)", 0.8, x, y + 10 + i * 4, x + w, y + 10 + i * 4);
      rect(g, horiz ? x : x + w - 4, horiz ? y + h - 3 : y, horiz ? w : 4, horiz ? 3 : h, "rgba(30,28,24,.2)");
    } else {
      if (horiz)
        for (let i = 0; i < 4; i++) {
          const sx = x + i * 4;
          rect(g, sx, y + 1, 3.6, h - 2, i % 2 ? "#9a6a35" : "#a97a42");
          shape(g, i % 2 ? "#9a6a35" : "#a97a42", sx, y + 1, sx + 1.8, y - 3, sx + 3.6, y + 1);
          rect(g, sx + 2.4, y + 1, 1.2, h - 2, "rgba(40,20,5,.25)");
        }
      else
        for (let i = 0; i < 4; i++) {
          const sy = y + i * 4 + 2;
          dot(g, 16, sy, 3.4, "#7a5230");
          dot(g, 16, sy, 2.6, "#c39254");
          dot(g, 16, sy, 0.9, "#8a5a30");
        }
    }
  };
  shadowRect(g);
  if (up) arm(0, -1);
  if (left) arm(-1, 0);
  if (right) arm(1, 0);
  if (downLink) arm(0, 1);
  // the post in the middle
  if (stone_) {
    rect(g, 7, 4, 18, 20, "#b6b3a9");
    rect(g, 7, 4, 18, 6, "#d2cfc4");
    rect(g, 19, 4, 6, 20, "rgba(30,28,24,.2)");
    rect(g, 13, 16, 6, 4, c.main);
  } else {
    rect(g, 12, 3, 8, 21, "#9a6a35");
    shape(g, "#9a6a35", 12, 3, 16, -3, 20, 3);
    rect(g, 17, 3, 3, 21, "rgba(40,20,5,.25)");
    rect(g, 12, 12, 8, 3, c.main);
  }
  function shadowRect(gg: G) {
    oval(gg, 19, 25, 14, 5, "rgba(26,40,12,.18)");
  }
}

// ── buildings on the map ────────────────────────────────────────────────────────────
/**
 * Draws a building with its top-left at (x, y). `k` is pixels per unit (for the kept
 * picture's sharpness); `clock` moves smoke and flames.
 */
export function drawBuilding(g: G, b: Building, x: number, y: number, links: boolean[], style: number, k: number, clock: number, full: number, age = 1) {
  const s = BUILDINGS[b.kind];
  const W = s.w * 32;
  const H = s.h * 32;
  const c = SEATS[b.owner];
  const pic = s.wall
    ? sprite(`w${b.kind}${b.owner}${links.map(Number).join("")}`, k, -6, -16, 46, 50, (gg) => wallPiece(gg, b.kind, links, c))
    : b.kind === "castle"
      ? sprite(`b${b.kind}${style}${b.owner}`, k, -14, -76, W + 28, H + 84, (gg) => paint(gg, b.kind, style, c, 3))
      : sprite(`b${b.kind}${style}${b.owner}${age}`, k, -10, -46, W + 26, H + 54, (gg) => paint(gg, b.kind, style, c, age));
  if (b.progress < 1) {
    // a building site: worn earth, the building rising, and scaffolding
    round(g, x + 2, y + 2, W - 4, H - 4, 4, "rgba(130,96,56,.5)");
    const floor = y + H - 4;
    const top = y + pic.y;
    const rise = floor - (floor - top) * Math.max(0.08, b.progress);
    g.save();
    g.beginPath();
    g.rect(x + pic.x, rise, pic.w, floor - rise + 8);
    g.clip();
    g.globalAlpha = 0.92;
    blit(g, pic, x, y);
    g.restore();
    if (!s.wall) {
      for (const px of [x + 4, x + W - 7]) line(g, "#7a5230", 2.4, px, y + H - 2, px, Math.max(y - 6, rise - 4));
      for (let yy = y + H - 10; yy > rise - 2; yy -= 12) line(g, "#a07040", 2, x + 3, yy, x + W - 4, yy);
      line(g, "#c09060", 1.2, x + 4, y + H - 4, x + W - 7, Math.max(y - 6, rise - 4));
      // logs waiting to go up
      for (let i = 0; i < 3; i++) {
        round(g, x + W - 22 + i * 2, y + H - 4 - i * 3.4, 16, 3.4, 1.7, i % 2 ? "#9a6a38" : "#b07a44");
        dot(g, x + W - 22 + i * 2, y + H - 2.3 - i * 3.4, 1.7, "#d8b07a");
      }
    }
    return;
  }
  blit(g, pic, x, y);
  // damage: smoke, then flames
  const hurt = 1 - b.hp / full;
  if (hurt > 0.4 && !s.wall && b.kind !== "farm") {
    const sx = x + W * 0.6;
    const sy = y + H * 0.2;
    for (let i = 0; i < 3; i++) {
      const t = (clock * 0.5 + i / 3) % 1;
      dot(g, sx + Math.sin(t * 6 + i) * 3 + t * 6, sy - t * 22, 3 + t * 5, `rgba(70,64,60,${(0.42 * (1 - t)).toFixed(2)})`);
    }
    if (hurt > 0.7) {
      for (const [fx, fy] of [[W * 0.32, H * 0.28], [W * 0.7, H * 0.45]] as const) {
        const f = 0.75 + Math.sin(clock * 13 + fx) * 0.25;
        shape(g, "#ff8a24", x + fx - 4, y + fy + 4, x + fx, y + fy - 9 * f, x + fx + 4, y + fy + 4);
        shape(g, "#ffd84a", x + fx - 2, y + fy + 4, x + fx, y + fy - 4 * f, x + fx + 2, y + fy + 4);
      }
    }
  }
  if (b.upgrade) {
    // being enlarged: scaffolding and stone waiting by the door
    for (const px of [x + 3, x + W - 6]) line(g, "#7a5230", 2.2, px, y + H - 2, px, y - 8);
    for (const yy of [y + H - 12, y + H - 26, y + 2]) line(g, "#a07040", 1.8, x + 2, yy, x + W - 3, yy);
    for (let i = 0; i < 3; i++) round(g, x + W - 16 + (i % 2) * 6, y + H - 6 - Math.floor(i / 2) * 5, 6, 5, 1, i % 2 ? "#a9a69d" : "#c4c1b6");
  }
  if (b.kind === "smithy" || ((b.kind === "house" || b.kind === "manor") && style === STYLE.forest)) {
    // a wisp from the chimney
    const t = (clock * 0.35 + b.id * 0.17) % 1;
    dot(g, x + W * 0.7 + 4.5 + t * 5, y - 9 - t * 16, 2 + t * 3.5, `rgba(235,235,230,${(0.5 * (1 - t)).toFixed(2)})`);
  }
  if (b.kind === "smithy") {
    const glow = 0.25 + Math.sin(clock * 7 + b.id) * 0.12;
    dot(g, x + W - 17, y + H - 15, 6, `rgba(255,170,60,${glow.toFixed(2)})`);
  }
}

// ── people ──────────────────────────────────────────────────────────────────────────
const SKIN = ["#f3cba6", "#e3b088", "#c98e64", "#a8724c"] as const;
const HAIR = ["#5a3a22", "#2e2018", "#c89a50", "#9a4a24", "#7a6650"] as const;

/** What each people wears on their head. */
function hat(g: G, style: number, x: number, y: number, c: Team, armed: boolean, kind: string) {
  if (style === STYLE.stone) {
    // a steel cap, with a crest for soldiers
    g.fillStyle = armed ? "#b8c2c6" : "#8e9490";
    g.beginPath();
    g.arc(x, y - 12, 6, Math.PI, Math.PI * 2);
    g.fill();
    rect(g, x - 6.5, y - 12.5, 13, 2.2, "#666e72");
    rect(g, x + 1, y - 17.5, 4, 5, "rgba(0,0,0,.12)");
    if (armed) round(g, x - 1.2, y - 21, 2.4, 4, 1, c.light);
    return;
  }
  if (style === STYLE.horse) {
    // a fur-trimmed cap with a point
    shape(g, armed ? c.main : "#8a5a2b", x - 5.5, y - 13, x, y - 23, x + 5.5, y - 13);
    shape(g, "rgba(0,0,0,.15)", x, y - 23, x + 5.5, y - 13, x + 1.5, y - 13);
    round(g, x - 7, y - 14.5, 14, 4, 2, "#ece0c4");
    rect(g, x - 7, y - 12, 14, 1, "rgba(120,90,50,.4)");
    return;
  }
  if (style === STYLE.sun) {
    // a wrapped headcloth
    g.fillStyle = "#f6ecd6";
    g.beginPath();
    g.arc(x, y - 13, 6.5, Math.PI * 0.95, Math.PI * 2.05);
    g.fill();
    line(g, armed ? c.main : "#d9b455", 2, x - 6, y - 14, x + 6, y - 15.5);
    line(g, "rgba(150,120,80,.4)", 0.8, x - 5, y - 17, x + 5, y - 18.5);
    if (armed) dot(g, x, y - 18.5, 1.3, c.light);
    return;
  }
  if (armed) {
    // a horned helm
    g.fillStyle = "#b0bcc2";
    g.beginPath();
    g.arc(x, y - 12, 6.2, Math.PI, Math.PI * 2);
    g.fill();
    rect(g, x - 6.5, y - 12.5, 13, 2.4, "#6d777d");
    rect(g, x + 1.5, y - 17.5, 4, 5, "rgba(0,0,0,.12)");
    for (const s of [-1, 1]) shape(g, "#f6ecd6", x + s * 5.5, y - 14, x + s * 11, y - 20, x + s * 7.5, y - 12.5);
    return;
  }
  if (kind === "archer") {
    // a green hood
    g.fillStyle = "#3f6e30";
    g.beginPath();
    g.arc(x, y - 11.5, 6.6, Math.PI * 0.9, Math.PI * 2.1);
    g.lineTo(x + 1, y - 21);
    g.closePath();
    g.fill();
    shape(g, "rgba(0,0,0,.15)", x + 1, y - 21, x + 6.4, y - 13, x + 2, y - 13);
    return;
  }
  // a straw hat
  oval(g, x, y - 15, 8.5, 2.6, "#c8a24c");
  oval(g, x, y - 15.5, 8, 2, "#e2c062");
  round(g, x - 4, y - 21, 8, 6, 2.5, "#e2c062");
  rect(g, x - 4, y - 17, 8, 1.6, lit(c.main, 0.1));
  rect(g, x + 1.5, y - 21, 2.5, 5, "rgba(120,80,20,.2)");
}

function person(g: G, u: Unit, x: number, y: number, face: number, clock: number, style: number, c: Team) {
  const walking = u.order.t === "move" || u.path.length > 0;
  const bob = walking ? Math.sin(u.anim * 1.6) * 1.6 : 0;
  const working = (u.order.t === "gather" || u.order.t === "build") && !u.path.length;
  const swing = working ? Math.sin(clock * 11 + u.id) * 3.2 : 0;
  const armed = u.kind === "militia";
  const skin = SKIN[u.id % 4]!;
  const hair = HAIR[(u.id >> 2) % 5]!;
  const cloth = u.flash > 0 ? "#ffffff" : c.main;
  shadow(g, x + 1.5, y + 9.5, 7.5, 3);
  // things carried on the back
  if (u.kind === "archer") {
    round(g, x - face * 8 - 2, y - 10, 4, 12, 1.5, "#7a4a26");
    for (let i = 0; i < 3; i++) line(g, "#f6ecd6", 1.2, x - face * 8 - 1 + i, y - 10, x - face * 8 - 1.5 + i, y - 14);
  }
  if (u.kind === "villager" && u.carry >= 1) {
    const t = u.carryType ?? "wood";
    const bx = x - face * 7;
    if (t === "wood")
      for (let i = 0; i < 2; i++) {
        round(g, bx - 6, y - 9 + i * 3.4, 12, 3.6, 1.8, i ? "#9a6a38" : "#b07a44");
        dot(g, bx + face * 6, y - 7.2 + i * 3.4, 1.8, "#d8b07a");
      }
    else if (t === "food") {
      round(g, bx - 5, y - 8, 10, 7, 2, "#c8a050");
      for (const [dx, dy] of [[-2, -8], [1, -9], [3, -7.5]] as const) dot(g, bx + dx, y + dy, 1.8, "#d23a5c");
    } else {
      shape(g, t === "gold" ? "#b8860b" : "#8a8a84", bx - 5, y - 2, bx - 4, y - 9, bx + 1, y - 11, bx + 5, y - 7, bx + 4, y - 2);
      shape(g, t === "gold" ? "#ffd84a" : "#c4c2ba", bx - 3.5, y - 8, bx + 1, y - 10, bx + 2, y - 6);
    }
  }
  // legs and boots
  round(g, x - 4.6, y + 2, 3.8, 7.5 + bob, 1.6, "#5a4232");
  round(g, x + 0.8, y + 2, 3.8, 7.5 - bob, 1.6, "#5a4232");
  rect(g, x - 4.6, y + 7.5 + bob, 3.8, 2, "#2e2018");
  rect(g, x + 0.8, y + 7.5 - bob, 3.8, 2, "#2e2018");
  // tunic: lit on the left, shaded on the right, with a belt
  g.fillStyle = dim(c.main, 0.45);
  g.beginPath();
  g.moveTo(x - 6.8, y - 7.5);
  g.lineTo(x + 6.8, y - 7.5);
  g.lineTo(x + 8.6, y + 5.5);
  g.lineTo(x - 8.6, y + 5.5);
  g.closePath();
  g.fill();
  g.fillStyle = cloth;
  g.beginPath();
  g.moveTo(x - 6, y - 6.8);
  g.lineTo(x + 6, y - 6.8);
  g.lineTo(x + 7.6, y + 4.6);
  g.lineTo(x - 7.6, y + 4.6);
  g.closePath();
  g.fill();
  if (u.flash <= 0) {
    shape(g, "rgba(20,10,0,.2)", x + 1.5, y - 6.8, x + 6, y - 6.8, x + 7.6, y + 4.6, x + 2.5, y + 4.6);
    shape(g, "rgba(255,250,225,.22)", x - 6, y - 6.8, x - 3, y - 6.8, x - 4, y + 4.6, x - 7.6, y + 4.6);
  }
  rect(g, x - 7.2, y, 14.4, 2, "#5a3a1e");
  rect(g, x - 1, y - 0.2, 2.4, 2.4, "#e0bd4a");
  // the arm on the tool side, and the hand
  line(g, cloth, 3.2, x + face * 4.5, y - 5, x + face * 8, y - 1 + swing * 0.4);
  dot(g, x + face * 8.4, y - 0.5 + swing * 0.4, 1.9, skin);
  // head: hair behind, face, eyes looking the way they walk
  dot(g, x - face * 0.8, y - 12, 6.2, hair);
  dot(g, x, y - 11.5, 5.5, dim(skin, 0.18));
  dot(g, x - 0.4, y - 11.9, 5, skin);
  dot(g, x + face * 1.2 - 1.8, y - 11.5, 0.75, "#2a1a10");
  dot(g, x + face * 1.2 + 1.8, y - 11.5, 0.75, "#2a1a10");
  dot(g, x + face * 1.2 + face * 3, y - 9.5, 1.1, "rgba(230,120,110,.35)");
  hat(g, style, x, y, c, armed, u.kind);
  // tools and weapons
  const hx = x + face * 8.4;
  const hy = y - 0.5 + swing * 0.4;
  if (u.kind === "villager") {
    line(g, "#7a4a26", 1.8, hx, hy + 2, hx + face * 1.5, hy - 12 + swing);
    shape(g, "#cfd6d8", hx + face * 1.5, hy - 13 + swing, hx + face * 6, hy - 14.5 + swing, hx + face * 5.5, hy - 9 + swing, hx + face * 1.5, hy - 10 + swing);
    line(g, "#ffffff", 0.7, hx + face * 5.6, hy - 14 + swing, hx + face * 5.2, hy - 9.6 + swing);
  } else if (armed) {
    line(g, "#dfe6ea", 2.2, hx, hy - 1, hx + face * 1, hy - 17);
    line(g, "#ffffff", 0.7, hx - face * 0.4, hy - 3, hx + face * 0.5, hy - 16);
    line(g, "#c8a040", 2, hx - 3, hy - 1, hx + 3, hy - 1);
    // the shield on the other arm
    const sx = x - face * 7;
    dot(g, sx, y - 1, 6, "#5a4a3a");
    dot(g, sx, y - 1, 5, c.light);
    shape(g, c.main, sx, y - 5.5, sx + 2, y - 1, sx, y + 3.5, sx - 2, y - 1);
    dot(g, sx, y - 1, 1.6, "#d8c070");
    dot(g, sx - 1.6, y - 3, 1.2, "rgba(255,255,255,.4)");
  } else if (u.kind === "archer") {
    g.strokeStyle = "#8a5228";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x + face * 5, y - 3, 10, face > 0 ? -1.15 : Math.PI - 1.15, face > 0 ? 1.15 : Math.PI + 1.15);
    g.stroke();
    const ex = x + face * 5 + Math.cos(1.15) * 10 * face;
    line(g, "rgba(240,235,220,.8)", 0.6, ex, y - 3 - Math.sin(1.15) * 10, ex, y - 3 + Math.sin(1.15) * 10);
  }
}

function horseman(g: G, u: Unit, x: number, y: number, face: number, style: number, c: Team) {
  const walking = u.order.t === "move" || u.path.length > 0;
  const gait = walking ? Math.sin(u.anim * 1.6) * 2 : 0;
  const coat = ["#7a4a28", "#5a3a22", "#9a6a40", "#c8b8a0"][u.id % 4]!;
  shadow(g, x + 2, y + 11, 14, 4.5);
  // legs
  for (const [dx, s] of [[-9, 1], [-5, -1], [5, 1], [9, -1]] as const) {
    round(g, x + dx * face - 1.6, y + 2, 3.2, 9 + gait * s, 1.4, dim(coat, 0.2));
    rect(g, x + dx * face - 1.6, y + 9.5 + gait * s, 3.2, 1.6, "#2a1a10");
  }
  // tail, body, neck and head
  line(g, dim(coat, 0.5), 3, x - face * 12, y - 2, x - face * 16, y + 6);
  oval(g, x, y + 1, 13, 7, coat);
  oval(g, x - 3, y - 2, 8, 3, lit(coat, 0.18));
  oval(g, x + 3, y + 4, 9, 3, "rgba(20,10,0,.18)");
  shape(g, coat, x + face * 7, y - 3, x + face * 13, y - 13, x + face * 16, y - 11, x + face * 11, y + 1);
  oval(g, x + face * 15.5, y - 12.5, 3.4, 4.8, coat);
  oval(g, x + face * 17.5, y - 10, 2.4, 2, dim(coat, 0.2));
  shape(g, dim(coat, 0.45), x + face * 12, y - 15, x + face * 13.5, y - 19, x + face * 14.5, y - 15);
  line(g, dim(coat, 0.55), 2.2, x + face * 8, y - 5, x + face * 13.5, y - 15);
  dot(g, x + face * 16.5, y - 13.5, 0.8, "#1a100a");
  // a saddle cloth in the rider's colours
  round(g, x - 7, y - 4, 14, 8, 2, u.flash > 0 ? "#ffffff" : c.main);
  rect(g, x - 7, y + 2, 14, 2, c.light);
  // the rider
  const skin = SKIN[u.id % 4]!;
  shape(g, dim(c.main, 0.4), x - 6.5, y - 1, x - 5, y - 14, x + 5, y - 14, x + 6.5, y - 1);
  shape(g, u.flash > 0 ? "#ffffff" : c.main, x - 5.8, y - 1.5, x - 4.4, y - 13.4, x + 4.4, y - 13.4, x + 5.8, y - 1.5);
  shape(g, "rgba(20,10,0,.2)", x + 1, y - 13.4, x + 4.4, y - 13.4, x + 5.8, y - 1.5, x + 1.6, y - 1.5);
  dot(g, x, y - 18, 4.8, dim(skin, 0.18));
  dot(g, x - 0.3, y - 18.3, 4.4, skin);
  dot(g, x + face * 1.2 - 1.6, y - 18, 0.7, "#2a1a10");
  dot(g, x + face * 1.2 + 1.6, y - 18, 0.7, "#2a1a10");
  hat(g, style, x, y - 6.5, c, true, u.kind);
  // a lance with a pennant
  line(g, "#8a5a30", 2, x - face * 6, y + 2, x - face * 7.5, y - 30);
  shape(g, "#dfe6ea", x - face * 7.5, y - 34, x - face * 6.3, y - 29, x - face * 8.7, y - 29);
  g.fillStyle = c.light;
  g.beginPath();
  g.moveTo(x - face * 7.4, y - 28);
  g.quadraticCurveTo(x - face * 13, y - 28, x - face * 18, y - 25);
  g.lineTo(x - face * 7.2, y - 22);
  g.fill();
}

function ram(g: G, u: Unit, x: number, y: number, face: number, c: Team) {
  shadow(g, x + 2, y + 10, 18, 5.5);
  // the log and its iron head
  round(g, x - 14, y - 3, 30, 6, 3, "#8a5a30");
  round(g, x + face * 15 - 4, y - 5, 8, 10, 2.5, "#5c6468");
  rect(g, x + face * 15 - 4, y - 5, 8, 2, "#9aa4a8");
  // the shed: posts and a hide roof
  for (const dx of [-12, 10]) rect(g, x + dx, y - 8, 3, 13, "#6e4524");
  shape(g, u.flash > 0 ? "#ffffff" : dim(c.main, 0.15), x - 18, y - 6, x, y - 20, x + 18, y - 6);
  shape(g, "rgba(20,10,0,.2)", x, y - 20, x + 18, y - 6, x + 4, y - 6);
  shape(g, "rgba(255,250,225,.2)", x, y - 20, x - 18, y - 6, x - 9, y - 6);
  for (let i = -2; i <= 2; i++) line(g, "rgba(40,20,5,.35)", 0.8, x + i * 5, y - 7, x + i * 1.5, y - 18);
  rect(g, x - 18, y - 7, 36, 2.4, "#5a3a1e");
  // wheels
  for (const dx of [-10, 10]) {
    dot(g, x + dx, y + 7.5, 5.6, "#3a2312");
    dot(g, x + dx, y + 7.5, 4.2, "#a87a44");
    for (let i = 0; i < 4; i++) line(g, "#3a2312", 1, x + dx, y + 7.5, x + dx + Math.cos(i * 1.57 + 0.4) * 4, y + 7.5 + Math.sin(i * 1.57 + 0.4) * 4);
    dot(g, x + dx, y + 7.5, 1.2, "#3a2312");
  }
}

// ── ships ───────────────────────────────────────────────────────────────────────────
function sail(g: G, style: number, x: number, y: number, face: number, r: number, c: Team) {
  const shade = dim(c.main, 0.22);
  if (style === STYLE.stone) {
    round(g, x - r * 0.85, y + 3, r * 1.7, r * 1.25, 1.5, c.main);
    rect(g, x, y + 3, r * 0.85, r * 1.25, shade);
    rect(g, x - 2, y + 3, 4, r * 1.25, c.light);
    rect(g, x - r * 0.85, y + 3 + r * 0.55, r * 1.7, 3.5, c.light);
  } else if (style === STYLE.horse) {
    for (let i = 0; i < 4; i++) shape(g, i % 2 ? c.light : i > 1 ? shade : c.main, x, y + r * 1.35, x + (i - 2) * r * 0.5, y + 2 + Math.abs(i - 1.5) * 3, x + (i - 1) * r * 0.5, y + 2 + Math.abs(i - 0.5) * 3 - 3);
  } else if (style === STYLE.sun) {
    // a lateen sail, bellied by the wind
    g.fillStyle = c.main;
    g.beginPath();
    g.moveTo(x + face * r * 0.9, y - 5);
    g.quadraticCurveTo(x - face * r * 0.2, y + r * 0.2, x - face * r * 1.1, y + r * 1.3);
    g.lineTo(x + face * r * 0.9, y + r * 1.1);
    g.closePath();
    g.fill();
    shape(g, shade, x + face * r * 0.9, y + r * 0.4, x - face * r * 0.6, y + r * 1.2, x + face * r * 0.9, y + r * 1.1);
    line(g, c.light, 1.4, x + face * r * 0.9, y - 5, x - face * r * 1.1, y + r * 1.3);
  } else {
    // a square sail, bellied forward
    g.fillStyle = c.main;
    g.beginPath();
    g.moveTo(x - r * 0.8, y + 3);
    g.lineTo(x + r * 0.8, y + 3);
    g.quadraticCurveTo(x + r * 1.15 + face * 2, y + r * 0.7, x + r, y + r * 1.3);
    g.lineTo(x - r, y + r * 1.3);
    g.quadraticCurveTo(x - r * 1.15 + face * 2, y + r * 0.7, x - r * 0.8, y + 3);
    g.fill();
    shape(g, shade, x + face * r * 0.1, y + 3, x + face * r * 0.8, y + 3, x + face * r, y + r * 1.3, x + face * r * 0.2, y + r * 1.3);
    rect(g, x - r * 0.9, y + 3 + r * 0.5, r * 1.8, 3, c.light);
  }
  line(g, "#5a3a1e", 1.4, x - r * 0.9, y + 3, x + r * 0.9, y + 3);
  g.fillStyle = c.light;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x - face * 6, y - 4, x - face * 12, y - 3);
  g.lineTo(x, y - 6);
  g.fill();
}

function ship(g: G, u: Unit, x: number, y: number, face: number, clock: number, style: number, c: Team) {
  const rock = Math.sin(clock * 2 + u.id) * 1.2;
  y += rock;
  const big = u.kind === "fisher" ? 0.78 : u.kind === "bombard" ? 1.12 : u.kind === "transport" ? 1.08 : 1;
  const w = 21 * big;
  // the wake, when under way
  if (u.path.length) {
    for (let i = 0; i < 3; i++) {
      const t = (clock * 1.5 + i / 3) % 1;
      g.strokeStyle = `rgba(240,252,255,${(0.6 * (1 - t)).toFixed(2)})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.ellipse(x - face * (w + 4 + t * 12), y + 7, 3 + t * 6, 2 + t * 3, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  oval(g, x + 2, y + 9, w + 4, 5, "rgba(20,50,80,.22)");
  oval(g, x, y + 8, w + 2, 4, "rgba(240,252,255,.45)");
  if (u.kind === "galley") {
    const stroke = u.path.length ? Math.sin(clock * 9 + u.id) * 4 : 0;
    for (const dx of [-11, -3, 5, 13]) line(g, "#caa56a", 1.8, x + dx, y + 3, x + dx + stroke, y + 14);
  }
  // the hull: planks curving up to a raised bow
  const hull = u.flash > 0 ? "#ffffff" : u.kind === "bombard" ? "#5a3a1e" : "#8a5a30";
  g.fillStyle = dim(hull, 0.3);
  g.beginPath();
  g.moveTo(x - face * w, y - 4);
  g.lineTo(x + face * (w + 3), y - 7);
  g.quadraticCurveTo(x + face * w * 0.8, y + 10, x, y + 10);
  g.quadraticCurveTo(x - face * w * 0.9, y + 10, x - face * w, y - 4);
  g.fill();
  g.fillStyle = hull;
  g.beginPath();
  g.moveTo(x - face * (w - 1), y - 3.5);
  g.lineTo(x + face * (w + 1.5), y - 6);
  g.quadraticCurveTo(x + face * w * 0.75, y + 8.5, x, y + 8.5);
  g.quadraticCurveTo(x - face * w * 0.85, y + 8.5, x - face * (w - 1), y - 3.5);
  g.fill();
  for (const yy of [0.5, 4.5]) line(g, "rgba(40,20,5,.35)", 0.8, x - face * (w - 3), y + yy - 1, x + face * (w - 2), y + yy - 2.5);
  line(g, c.main, 2.6, x - face * (w - 1), y - 2, x + face * (w + 1), y - 4.5);
  line(g, lit(hull, 0.35), 1.2, x - face * (w - 1), y - 4, x + face * (w + 1.5), y - 6.5);
  if (u.kind === "transport") {
    rect(g, x - w + 2, y - 9, w * 2 - 4, 5, "#caa56a");
    const riders = Math.min(8, u.cargo?.length ?? 0);
    for (let i = 0; i < riders; i++) {
      const px = x - 14 + (i % 4) * 9;
      const py = y - 11 - Math.floor(i / 4) * 6;
      dot(g, px, py, 3.6, dim(SKIN[i % 4]!, 0.2));
      dot(g, px, py, 3, SKIN[i % 4]!);
      rect(g, px - 3, py - 3.5, 6, 2.2, c.light);
    }
    line(g, "#4a2c17", 2.4, x - face * 16, y - 6, x - face * 16, y - 32);
    sail(g, style, x - face * 16, y - 32, face, 11, c);
    return;
  }
  line(g, "#4a2c17", 2.4, x, y - 3, x, y - 4 - 26 * big);
  if (u.kind === "fisher") {
    shape(g, c.light, x + face * 2, y - 23, x + face * 14, y - 8, x + face * 2, y - 8);
    shape(g, "rgba(0,0,0,.15)", x + face * 2, y - 15, x + face * 14, y - 8, x + face * 2, y - 8);
    g.strokeStyle = "#e8e0c8";
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(x - face * 6, y - 4);
    g.lineTo(x - face * 20, y - 13);
    g.lineTo(x - face * 22, y + 8);
    g.stroke();
    if (u.carry >= 1) {
      oval(g, x - face * 7, y - 5, 4, 2.4, "#f4c9a8");
      oval(g, x - face * 5, y - 6.5, 3.4, 2, "#e8b090");
    }
    return;
  }
  sail(g, style, x, y - 4 - 26 * big, face, 15 * big, c);
  if (u.kind === "bombard") {
    round(g, x + face * 10 - 7, y - 10, 14, 6, 2.5, "#2a2e32");
    rect(g, x + face * 10 - 7, y - 10, 14, 1.6, "#5a6266");
    dot(g, x + face * 18, y - 7, 3.2, "#1a1d20");
  } else shape(g, "#dfe6ea", x + face * (w + 1), y - 6, x + face * (w + 9), y - 5, x + face * (w + 1), y - 2.5);
}

/** Draws any unit at (x, y), facing right (1) or left (-1). */
export function drawUnit(g: G, u: Unit, x: number, y: number, face: number, clock: number, style: number) {
  const c = SEATS[u.owner];
  if (UNITS[u.kind].naval) return ship(g, u, x, y, face, clock, style, c);
  if (u.kind === "rider") return horseman(g, u, x, y, face, style, c);
  if (u.kind === "ram") return ram(g, u, x, y, face, c);
  person(g, u, x, y, face, clock, style, c);
}
