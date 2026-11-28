import { BUILDINGS, COLS, ROWS, SEATS, UNITS, isNorth } from "../game/content";
import { GRID, terrainAt } from "../game/map";
import { drawBuilding, drawUnit } from "./art";
import { drawGlints, drawGround, groundVersion } from "./ground";
import { ageOf, canSee, maxHp as fullHp, type Building, type Node, type PlayerId, type Sim, type Unit } from "../game/sim";

type G = CanvasRenderingContext2D;
const TEAM = SEATS;

function box(g: G, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
function disc(g: G, x: number, y: number, r: number, c: string) {
  g.fillStyle = c;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
function poly(g: G, c: string, ...p: number[]) {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(p[0]!, p[1]!);
  for (let i = 2; i < p.length; i += 2) g.lineTo(p[i]!, p[i + 1]!);
  g.closePath();
  g.fill();
}
function drawFish(g: G, n: Node, x: number, y: number, clock: number) {
  const bob = Math.sin(clock * 2.2 + n.id) * 1.5;
  g.strokeStyle = "rgba(210,240,255,.55)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(x + 16, y + 17, 13 + bob, 8 + bob / 2, 0, 0, Math.PI * 2);
  g.stroke();
  for (const [dx, dy, f] of [[9, 12, 1], [22, 18, -1], [13, 24, 1]] as const) {
    const fy = y + dy + bob * f;
    g.fillStyle = "#f4c9a8";
    g.beginPath();
    g.ellipse(x + dx, fy, 5.5, 2.8, 0, 0, Math.PI * 2);
    g.fill();
    poly(g, "#e89a78", x + dx - f * 4, fy, x + dx - f * 9, fy - 3.5, x + dx - f * 9, fy + 3.5);
    box(g, x + dx + f * 2, fy - 1, 1.5, 1.5, "#23323a");
  }
}

const hash = (x: number, y: number, k: number) => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
/** a soft shadow, cast down and to the right */
function softShadow(g: G, x: number, y: number, rx: number, ry: number) {
  g.fillStyle = "rgba(16,28,8,.16)";
  g.beginPath();
  g.ellipse(x + 3, y + 1, rx + 3, ry + 2, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(16,28,8,.2)";
  g.beginPath();
  g.ellipse(x + 1, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}
const PINES = [["#174a2c", "#22653a", "#3a8a47"], ["#1b5230", "#2a7040", "#4a9a4c"], ["#1d4f2a", "#2d6e34", "#4f9540"]] as const;
const LEAVES = [["#2c6a2a", "#47973a", "#7cc64e"], ["#326f28", "#55a03c", "#8fd05a"], ["#3f7024", "#6aa23a", "#a6d25a"]] as const;
const CYPRESS = ["#1a4a2c", "#2a6a3a", "#4a8f48"] as const;
const OUTLINE = "rgba(22,58,32,.55)";

function drawTree(g: G, n: Node, x: number, y: number) {
  const pineland = hash(Math.floor(n.x / 5), Math.floor(n.y / 5), 1) < 0.5;
  const r = hash(n.x, n.y, 2);
  const kind = r < 0.18 ? "cypress" : r < (pineland ? 0.85 : 0.35) ? "pine" : "round";
  const s = 0.88 + hash(n.x, n.y, 3) * 0.3;
  const cx = x + 16 + (hash(n.x, n.y, 4) - 0.5) * 6;
  const by = y + 28 + (hash(n.x, n.y, 5) - 0.5) * 4;
  const tint = Math.floor(hash(n.x, n.y, 6) * 3);
  if (kind === "cypress") {
    // tall and narrow, like a flame
    const [dark, mid, light] = CYPRESS;
    const h = 40 * s;
    const w = 7.5 * s;
    softShadow(g, cx + 5, by, 8 * s, 4 * s);
    box(g, cx - 1.5 * s, by - 5 * s, 3 * s, 5 * s, "#5b3a1e");
    const flame = (c: string, grow: number, dx = 0) => {
      g.fillStyle = c;
      g.beginPath();
      g.moveTo(cx + dx, by - h - grow);
      g.bezierCurveTo(cx + dx + (w + grow) * 1.3, by - h * 0.55, cx + dx + (w + grow) * 1.1, by - 2, cx + dx, by - 3 + grow);
      g.bezierCurveTo(cx + dx - (w + grow) * 1.1, by - 2, cx + dx - (w + grow) * 1.3, by - h * 0.55, cx + dx, by - h - grow);
      g.fill();
    };
    flame(OUTLINE, 1.4);
    flame(dark, 0);
    flame(mid, -2.2, -1.2);
    g.fillStyle = light;
    g.beginPath();
    g.ellipse(cx - 2.2 * s, by - h * 0.62, 1.8 * s, h * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    return;
  }
  if (kind === "pine") {
    const [dark, mid, light] = PINES[tint]!;
    softShadow(g, cx + 4, by, 12 * s, 5 * s);
    box(g, cx - 2.5 * s, by - 9 * s, 5 * s, 9 * s, "#5b3a1e");
    for (let i = 0; i < 3; i++) {
      const wi = (15 - i * 3.6) * s;
      const yb = by - 6 * s - i * 8 * s;
      const yt = yb - 15 * s;
      poly(g, OUTLINE, cx, yt - 1.5, cx + wi + 1.5, yb + 1, cx, yb + 3.5 * s, cx - wi - 1.5, yb + 1);
      poly(g, i === 2 ? mid : dark, cx, yt, cx + wi, yb, cx, yb + 2.5 * s);
      poly(g, i === 2 ? light : mid, cx - wi, yb, cx, yt, cx, yb + 2.5 * s);
    }
    return;
  }
  // a broad, round crown
  const [dark, mid, light] = LEAVES[tint]!;
  softShadow(g, cx + 4, by, 13 * s, 5 * s);
  box(g, cx - 3 * s, by - 12 * s, 6 * s, 12 * s, "#6a4424");
  box(g, cx - 3 * s, by - 12 * s, 2 * s, 12 * s, "#8a5c32");
  const crown: [number, number, number][] = [[1, -17, 13], [-6, -19, 8.5], [5, -15, 8], [1, -25, 8]];
  for (const [dx, dy, r0] of crown) disc(g, cx + dx * s, by + dy * s, r0 * s + 1.6, OUTLINE);
  disc(g, cx + 1 * s, by - 17 * s, 13 * s, dark);
  disc(g, cx - 6 * s, by - 19 * s, 8.5 * s, mid);
  disc(g, cx + 5 * s, by - 15 * s, 8 * s, mid);
  disc(g, cx + 1 * s, by - 25 * s, 8 * s, mid);
  disc(g, cx - 6 * s, by - 23 * s, 4.5 * s, light);
  disc(g, cx + 1 * s, by - 28 * s, 3.5 * s, light);
}

function boulder(g: G, x: number, y: number, r: number, dark: string, mid: string, light: string) {
  poly(g, dark, x - r, y, x - r * 0.75, y - r * 0.7, x - r * 0.1, y - r * 1.05, x + r * 0.7, y - r * 0.8, x + r, y - r * 0.1, x + r * 0.8, y + r * 0.35, x - r * 0.7, y + r * 0.4);
  poly(g, mid, x - r * 0.82, y - r * 0.1, x - r * 0.65, y - r * 0.68, x - r * 0.1, y - r * 0.98, x + r * 0.62, y - r * 0.74, x + r * 0.5, y - r * 0.05, x - r * 0.1, y + r * 0.12);
  poly(g, light, x - r * 0.6, y - r * 0.62, x - r * 0.1, y - r * 0.9, x + r * 0.2, y - r * 0.55, x - r * 0.3, y - r * 0.35);
}

function drawNode(g: G, n: Node, x: number, y: number, clock: number) {
  const cx = x + 16;
  if (n.kind === "wood") return drawTree(g, n, x, y);
  if (n.kind === "food") {
    softShadow(g, cx + 2, y + 26, 13, 5);
    for (const [dx, dy, r] of [[-6, 4, 8], [6, 4, 8], [0, -3, 8.5]] as const) disc(g, cx + dx, y + 16 + dy, r, "#2d6528");
    for (const [dx, dy, r] of [[-7, 2, 5.5], [5, 2, 5.5], [-1, -5, 5.5]] as const) disc(g, cx + dx, y + 16 + dy, r, "#3f8236");
    for (const [dx, dy] of [[-8, -1], [3, -7], [-2, 1]] as const) disc(g, cx + dx, y + 16 + dy, 2.2, "#62a448");
    const left = Math.max(1, Math.min(8, Math.ceil((n.amount / 220) * 8)));
    const spots = [[-8, 3], [-2, 9], [4, -5], [9, 6], [1, 2], [-4, -4], [7, 0], [-9, 8]] as const;
    for (let i = 0; i < left; i++) {
      const [dx, dy] = spots[i]!;
      disc(g, cx + dx, y + 16 + dy, 2.6, "#8a1631");
      disc(g, cx + dx - 0.4, y + 15.6 + dy, 2.1, "#d23a5c");
      disc(g, cx + dx - 0.9, y + 15 + dy, 0.8, "#ffd6de");
    }
    return;
  }
  const gold = n.kind === "gold";
  softShadow(g, cx + 2, y + 26, 14, 5);
  if (gold) {
    boulder(g, cx - 1, y + 22, 13, "#5e5040", "#7f6e57", "#a08c70");
    const nuggets = [[-5, 14], [3, 11], [7, 18], [-2, 20], [-8, 19]] as const;
    for (const [dx, dy] of nuggets) {
      poly(g, "#b8860b", cx + dx, y + dy - 3.5, cx + dx + 3.5, y + dy, cx + dx, y + dy + 3, cx + dx - 3, y + dy);
      poly(g, "#ffd23f", cx + dx, y + dy - 3.5, cx + dx + 2, y + dy - 0.5, cx + dx - 1.5, y + dy);
    }
    // a twinkle now and then
    const tw = Math.sin(clock * 2.3 + n.x * 1.7 + n.y * 2.9);
    if (tw > 0.75) {
      const k = (tw - 0.75) * 4;
      const [dx, dy] = nuggets[(n.x + n.y) % nuggets.length]!;
      g.strokeStyle = `rgba(255,250,220,${k.toFixed(2)})`;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(cx + dx - 5 * k, y + dy - 2);
      g.lineTo(cx + dx + 5 * k, y + dy - 2);
      g.moveTo(cx + dx, y + dy - 2 - 5 * k);
      g.lineTo(cx + dx, y + dy - 2 + 5 * k);
      g.stroke();
    }
    return;
  }
  boulder(g, cx - 4, y + 23, 10, "#6a6862", "#96938a", "#c4c0b4");
  boulder(g, cx + 6, y + 25, 7, "#64625c", "#8d8a82", "#bab6aa");
  boulder(g, cx - 9, y + 26, 4.5, "#64625c", "#8d8a82", "#bab6aa");
}

function hpBar(g: G, x: number, y: number, w: number, f: number) {
  box(g, x - 1, y - 1, w + 2, 5, "#17130f");
  box(g, x, y, w * Math.max(0, f), 3, f > 0.5 ? "#78d64b" : f > 0.25 ? "#f2c230" : "#ee4b3a");
}

/** css pixels per pixel of art: the world is painted at this size, then softly enlarged to the screen */
export const PIXEL = 1;
/** the nearest zoom at which a tile is a whole number of art pixels */
export const snapZoom = (zoom: number) => (Math.max(6, Math.round((32 * zoom) / PIXEL)) * PIXEL) / 32;

/** Draws one player's view. North's view is turned around so their own base is nearest to them. */
export function render(lg: G, g: G, sim: Sim, p: PlayerId, cssW: number, cssH: number, zoom: number, maxHp: (u: Unit) => number) {
  const dir = sim.flip[p] ? -1 : 1;
  const cam = sim.cam[p];
  /** art pixels per tile, and per unit of the drawing code's own space (32 per tile) */
  const tile = Math.max(6, Math.round((32 * zoom) / PIXEL));
  const k = tile / 32;
  const lw = lg.canvas.width;
  const lh = lg.canvas.height;
  const layer = layerFor(p, lw, lh);
  const shake = (sim.shake[p] * 3) / PIXEL;
  const jx = Math.round((Math.random() - 0.5) * shake);
  const jy = Math.round((Math.random() - 0.5) * shake);
  // where the world's corner sits, in whole art pixels, so every tile lines up with the pixels
  const ox = Math.round(lw / 2 - cam.x * tile * dir);
  const oy = Math.round(lh / 2 - cam.y * tile * dir);
  const ax = ox + cam.x * tile * dir;
  const ay = oy + cam.y * tile * dir;
  const art = (c: G, dx = 0, dy = 0) => c.setTransform(k, 0, 0, k, ax + dx, ay + dy);
  const sx = (wx: number) => (wx - cam.x) * 32 * dir;
  const sy = (wy: number) => (wy - cam.y) * 32 * dir;
  /** top-left on screen of a world rectangle */
  const corner = (tx: number, ty: number, w: number, h: number) =>
    [dir > 0 ? sx(tx) : sx(tx + w), dir > 0 ? sy(ty) : sy(ty + h)] as const;

  const halfW = cssW / zoom / 64 + 2;
  const halfH = cssH / zoom / 64 + 2;
  const x0 = Math.max(0, Math.floor(cam.x - halfW));
  const x1 = Math.min(COLS - 1, Math.ceil(cam.x + halfW));
  const y0 = Math.max(0, Math.floor(cam.y - halfH));
  const y1 = Math.min(ROWS - 1, Math.ceil(cam.y + halfH));
  const onScreen = (x: number, y: number, w = 1, h = 1) => x + w >= x0 && x <= x1 + 1 && y + h >= y0 && y <= y1 + 1;
  const at = (wx: number, wy: number) => [sx(wx), sy(wy)] as const;

  // The ground only changes when the view moves. While it moves it is drawn straight on;
  // once it is still, a copy is kept and reused.
  const view = `${ox},${oy},${tile},${lw},${lh},${dir}`;
  const groundKey = `${view},${groundVersion()}`;
  if (layer.groundKey !== groundKey && layer.lastView === view) {
    const gg = layer.ground.getContext("2d")!;
    gg.setTransform(1, 0, 0, 1, 0, 0);
    gg.fillStyle = "#10140d";
    gg.fillRect(0, 0, lw, lh);
    art(gg);
    layer.groundKey = drawGround(gg, x0, y0, x1, y1, at, dir, tile) ? groundKey : "";
  }
  layer.lastView = view;
  lg.setTransform(1, 0, 0, 1, 0, 0);
  lg.fillStyle = "#10140d";
  lg.fillRect(0, 0, lw, lh);
  if (layer.groundKey === groundKey) {
    lg.imageSmoothingEnabled = false;
    lg.drawImage(layer.ground, jx, jy);
  } else {
    art(lg, jx, jy);
    drawGround(lg, x0, y0, x1, y1, at, dir, tile);
  }
  lg.setTransform(1, 0, 0, 1, jx, jy);
  drawGlints(lg, x0, y0, x1, y1, (wx, wy) => [ox + wx * tile * dir, oy + wy * tile * dir], tile, sim.clock);
  art(lg, jx, jy);

  const walls = new Set<number>();
  for (const b of sim.buildings) if (BUILDINGS[b.kind].wall && b.seen & (1 << sim.lead[p])) walls.add((b.ty * COLS + b.tx) * 16 + b.owner);
  const links = (b: Building) =>
    [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => walls.has(((b.ty + dy! * dir) * COLS + b.tx + dx! * dir) * 16 + b.owner));

  /** drawn sharp on top, at full size: health bars */
  const over: (() => void)[] = [];
  const items: { z: number; f: () => void }[] = [];
  for (const n of sim.nodes) {
    if (n.farm || n.amount <= 0 || !onScreen(n.x, n.y) || !sim.explored[p][n.y * COLS + n.x]) continue;
    const [x, y] = corner(n.x, n.y, 1, 1);
    if (n.sea) items.push({ z: y, f: () => drawFish(lg, n, x, y, sim.clock) });
    else items.push({ z: y + 28, f: () => drawNode(lg, n, x, y, sim.clock) });
  }
  const chosen = new Set(sim.sel[p].units);
  for (const b of sim.buildings) {
    if (!(b.seen & (1 << sim.lead[p]))) continue;
    const s = BUILDINGS[b.kind];
    if (!onScreen(b.tx, b.ty, s.w, s.h)) continue;
    const [x, y] = corner(b.tx, b.ty, s.w, s.h);
    items.push({
      z: b.kind === "farm" ? y : y + s.h * 32 - 6,
      f: () => {
        drawBuilding(lg, b, x, y, s.wall ? links(b) : [], sim.style[b.owner], k, sim.clock, fullHp(sim, b.owner, b.kind), ageOf(sim, b.owner));
        const picked = sim.sel[p].building === b.id;
        if (picked) {
          lg.strokeStyle = "#fff6a8";
          lg.lineWidth = 2 / k;
          lg.strokeRect(x, y, s.w * 32, s.h * 32);
        }
        const full = fullHp(sim, b.owner, b.kind);
        if (picked || b.hp < full - 0.5) over.push(() => hpBar(g, x + 8, y + s.h * 32 - 4, s.w * 32 - 16, b.hp / full));
      },
    });
  }
  for (const u of sim.units) {
    if (!onScreen(u.x, u.y, 0, 0)) continue;
    if (u.owner !== sim.lead[p] && !canSee(sim, p, u.x, u.y)) continue;
    const x = sx(u.x);
    const y = sy(u.y);
    items.push({
      z: y + 9,
      f: () => {
        const afloat = !!UNITS[u.kind].naval;
        if (chosen.has(u.id)) {
          lg.strokeStyle = "#fff6a8";
          lg.lineWidth = 1.2 / k;
          lg.beginPath();
          lg.ellipse(x, y + 9, afloat ? 27 : 12, afloat ? 9 : 6, 0, 0, Math.PI * 2);
          lg.stroke();
        }
        drawUnit(lg, u, x, y, u.fx * dir < 0 ? -1 : 1, sim.clock, sim.style[u.owner]);
        if (chosen.has(u.id) || u.hp < maxHp(u) - 0.5) over.push(() => hpBar(g, x - 9, y - (afloat ? 40 : 25), 18, u.hp / maxHp(u)));
      },
    });
  }
  // the gathering point of the selected building: a dotted line and a flag
  const rallyOf = sim.sel[p].building !== null ? sim.buildings.find((b) => b.id === sim.sel[p].building && b.owner === sim.lead[p]) : undefined;
  if (rallyOf?.rally) {
    const s = BUILDINGS[rallyOf.kind];
    const fx = sx(rallyOf.rally.x);
    const fy = sy(rallyOf.rally.y);
    lg.save();
    lg.strokeStyle = "rgba(255,248,210,.8)";
    lg.lineWidth = 2;
    lg.setLineDash([4, 5]);
    lg.beginPath();
    lg.moveTo(sx(rallyOf.tx + s.w / 2), sy(rallyOf.ty + s.h / 2));
    lg.lineTo(fx, fy);
    lg.stroke();
    lg.restore();
    const c = TEAM[p];
    items.push({
      z: fy + 2,
      f: () => {
        softShadow(lg, fx + 2, fy + 1, 5, 2);
        box(lg, fx - 1, fy - 24, 2.5, 25, "#4a2c17");
        poly(lg, c.main, fx + 1.5, fy - 24, fx + 16, fy - 19, fx + 1.5, fy - 13);
        poly(lg, c.light, fx + 1.5, fy - 24, fx + 9, fy - 21.5, fx + 1.5, fy - 19);
      },
    });
  }
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.f();

  for (const a of sim.arrows) {
    if (!canSee(sim, p, a.x, a.y)) continue;
    const ang = Math.atan2((a.ty - a.y) * dir, (a.tx - a.x) * dir);
    lg.save();
    lg.translate(sx(a.x), sy(a.y) - 6);
    lg.rotate(ang);
    if (a.ball) {
      disc(lg, 0, 0, 5, "#17130f");
      disc(lg, -6, 0, 3, "rgba(255,150,50,.75)");
    } else {
      box(lg, -8, -1.5, 13, 3, "#4a2c17");
      poly(lg, "#e8eef0", 4, -3.5, 11, 0, 4, 3.5);
    }
    lg.restore();
  }
  for (const q of sim.particles) if (canSee(sim, p, q.x, q.y)) box(lg, sx(q.x), sy(q.y), Math.max(q.size, 2 / k), Math.max(q.size, 2 / k), q.color);

  drawFog(lg, sim, p, x0, y0, x1, y1, sx(x0 - 1), sy(y0 - 1), dir, layer);

  // health bars, numbers and building marks are drawn sharp, on the layer above
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (layer.marked) g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  layer.marked = false;
  const f = (g.canvas.width / lw) * k;
  g.setTransform(f, 0, 0, f, (ax + jx) * (g.canvas.width / lw), (ay + jy) * (g.canvas.height / lh));
  for (const draw of over) draw();
  if (over.length || sim.floaters.length || sim.place[p] || sim.bad[p]) layer.marked = true;
  g.font = "bold 11px system-ui,sans-serif";
  g.textAlign = "center";
  for (const fl of sim.floaters) {
    if (!canSee(sim, p, fl.x, fl.y)) continue;
    g.strokeStyle = "rgba(20,16,10,.85)";
    g.lineWidth = 3;
    g.lineJoin = "round";
    g.strokeText(fl.text, sx(fl.x), sy(fl.y) - 16);
    g.fillStyle = fl.color;
    g.fillText(fl.text, sx(fl.x), sy(fl.y) - 16);
  }

  const mark = (tx: number, ty: number, w: number, h: number, fill: string, edge: string) => {
    const [x, y] = corner(tx, ty, w, h);
    box(g, x, y, w * 32, h * 32, fill);
    g.strokeStyle = edge;
    g.lineWidth = 2;
    g.strokeRect(x, y, w * 32, h * 32);
  };
  const anchor = sim.place[p] && sim.anchor[p];
  if (anchor) mark(anchor.x, anchor.y, 1, 1, "rgba(255,240,130,.28)", "#fff27a");
  const bad = sim.bad[p];
  if (bad) mark(bad.tx, bad.ty, bad.w, bad.h, "rgba(240,60,40,.4)", "#ff6a55");
}

/** What is kept between frames for one player's view: a copy of its ground, and the fog. */
type Layer = { ground: HTMLCanvasElement; groundKey: string; lastView: string; tiny: HTMLCanvasElement; img: ImageData | null; marked: boolean };
const layers = new Map<number, Layer>();
function layerFor(p: number, w: number, h: number): Layer {
  let l = layers.get(p);
  if (!l) {
    const c = () => document.createElement("canvas");
    l = { ground: c(), groundKey: "", lastView: "", tiny: c(), img: null, marked: true };
    layers.set(p, l);
  }
  if (l.ground.width !== w || l.ground.height !== h) {
    l.ground.width = w;
    l.ground.height = h;
    l.groundKey = "";
    l.marked = true;
  }
  return l;
}

/** Fog of war with soft edges: one pixel per tile, smoothly stretched over just the fogged part of the view. */
function drawFog(g: G, sim: Sim, p: PlayerId, x0: number, y0: number, x1: number, y1: number, left: number, top: number, dir: number, l: Layer) {
  const w = x1 - x0 + 3;
  const h = y1 - y0 + 3;
  if (l.tiny.width !== w || l.tiny.height !== h) {
    l.tiny.width = w;
    l.tiny.height = h;
    l.img = null;
  }
  const fg = l.tiny.getContext("2d")!;
  const img = (l.img ??= fg.createImageData(w, h));
  const px = img.data;
  const seen = sim.visible[p];
  const known = sim.explored[p];
  const fogAt = (tx: number, ty: number) => {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return 0.95;
    const k = ty * COLS + tx;
    return seen[k] ? 0 : known[k] ? 0.42 : 0.95;
  };
  let bx0 = w;
  let by0 = h;
  let bx1 = -1;
  let by1 = -1;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const tx = x0 - 1 + i;
      const ty = y0 - 1 + j;
      // half its own, half its neighbours': rounder, softer edges
      let around = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) around += fogAt(tx + dx, ty + dy);
      const a = (fogAt(tx, ty) * 0.5 + (around / 9) * 0.5) * 255;
      if (a) {
        if (i < bx0) bx0 = i;
        if (i > bx1) bx1 = i;
        if (j < by0) by0 = j;
        if (j > by1) by1 = j;
      }
      const o = (j * w + i) * 4;
      px[o] = 12;
      px[o + 1] = 18;
      px[o + 2] = 34;
      px[o + 3] = a;
    }
  if (bx1 < 0) return;
  // one clear pixel round the fogged part, so the soft edge fades out properly
  bx0 = Math.max(0, bx0 - 1);
  by0 = Math.max(0, by0 - 1);
  bx1 = Math.min(w - 1, bx1 + 1);
  by1 = Math.min(h - 1, by1 + 1);
  fg.putImageData(img, 0, 0);
  g.save();
  g.translate(left, top);
  g.scale(32 * dir, 32 * dir);
  g.imageSmoothingEnabled = true;
  g.drawImage(l.tiny, bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1, bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1);
  g.restore();
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const MINI = { water: rgb("#2c6f9e"), dirt: rgb("#a8864f"), grass: rgb("#5c8338") } as const;
const MINI_NODE = { wood: rgb("#1d4a22"), food: rgb("#d0365a"), gold: rgb("#ffd23f"), stone: rgb("#d5d9d4") } as const;
const MINI_FISH = rgb("#f4c9a8");
const DARK = rgb("#161b13");

let ground = new Uint8ClampedArray(0);
let groundFor: unknown = null;

/** One pixel per tile, turned the same way as the player's own view. */
export function renderMini(g: G, sim: Sim, p: PlayerId, flipped = sim.flip[p], area?: [number, number][]) {
  const img = g.createImageData(COLS, ROWS);
  const px = img.data;
  if (groundFor !== GRID || ground.length !== px.length) {
    groundFor = GRID;
    ground = new Uint8ClampedArray(px.length);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) ground.set([...MINI[terrainAt(x, y)], 255], (y * COLS + x) * 4);
  }
  const put = (x: number, y: number, c: readonly number[]) => {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    const i = ((flipped ? (ROWS - 1 - y) * COLS + COLS - 1 - x : y * COLS + x)) * 4;
    px[i] = c[0]!;
    px[i + 1] = c[1]!;
    px[i + 2] = c[2]!;
    px[i + 3] = 255;
  };
  const seen = sim.explored[p];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      if (seen[i]) put(x, y, [ground[i * 4]!, ground[i * 4 + 1]!, ground[i * 4 + 2]!]);
      else put(x, y, DARK);
    }
  for (const n of sim.nodes) if (!n.farm && n.amount > 0 && seen[n.y * COLS + n.x]) put(n.x, n.y, n.sea ? MINI_FISH : MINI_NODE[n.kind]);
  const team = TEAM.map((t) => ({ main: rgb(t.main), light: rgb(t.light) }));
  // on very big maps, dots are drawn larger so they can still be seen
  const dot = Math.max(2, Math.round(COLS / 48));
  for (const b of sim.buildings) {
    if (!(b.seen & (1 << sim.lead[p]))) continue;
    const s = BUILDINGS[b.kind];
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) put(b.tx + x, b.ty + y, s.wall ? team[b.owner]!.light : team[b.owner]!.main);
  }
  for (const u of sim.units) {
    if (u.owner !== sim.lead[p] && !canSee(sim, p, u.x, u.y)) continue;
    const c = u.owner === sim.lead[p] ? [255, 255, 255] : team[u.owner]!.main;
    for (let y = 0; y < dot; y++) for (let x = 0; x < dot; x++) put(Math.round(u.x - dot / 2) + x, Math.round(u.y - dot / 2) + y, c);
  }
  g.putImageData(img, 0, 0);
  const v = sim.view[p];
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (flipped) g.setTransform(-1, 0, 0, -1, COLS, ROWS);
  g.strokeStyle = "#fff27a";
  g.lineWidth = Math.max(1, COLS / 100);
  if (area) {
    // what a tilted 3D view sees: wider at the far edge
    g.beginPath();
    area.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.stroke();
  } else g.strokeRect(sim.cam[p].x - v.w / 64, sim.cam[p].y - v.h / 64, v.w / 32, v.h / 32);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
