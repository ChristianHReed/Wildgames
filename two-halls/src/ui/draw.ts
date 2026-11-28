import { BUILDINGS, COLS, ROWS, SEATS, STYLE, UNITS, isNorth } from "../game/content";
import { GRID, terrainAt } from "../game/map";
import { canSee, maxHp as fullHp, type Building, type Node, type PlayerId, type Sim, type Unit } from "../game/sim";

type G = CanvasRenderingContext2D;
const TEAM = SEATS;

const rnd = (x: number, y: number, k: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

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
function shadow(g: G, x: number, y: number, rx: number, ry: number) {
  g.fillStyle = "rgba(0,0,0,.25)";
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function drawTile(g: G, tx: number, ty: number, x: number, y: number) {
  const t = terrainAt(tx, ty);
  const base = t === "water" ? "#2c6f9e" : t === "dirt" ? "#a8864f" : (tx + ty) % 2 ? "#628c3c" : "#668f3f";
  box(g, x, y, 33, 33, base);
  for (let i = 0; i < 5; i++) {
    const px = x + rnd(tx, ty, i) * 28;
    const py = y + rnd(ty, tx, i + 9) * 28;
    if (t === "water") box(g, px, py, 7, 1.5, "rgba(190,230,255,.35)");
    else if (t === "dirt") box(g, px, py, 3, 2, i % 2 ? "#8f6f3f" : "#bd9c64");
    else box(g, px, py, 2, 4, i % 2 ? "#537a31" : "#7aa54c");
  }
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

function drawShip(g: G, u: Unit, x: number, y: number, face: number, clock: number, style: number) {
  const c = TEAM[u.owner];
  const rock = Math.sin(clock * 2 + u.id) * 1.2;
  y += rock;
  const big = u.kind === "fisher" ? 0.78 : u.kind === "bombard" ? 1.12 : 1;
  const w = 21 * big;
  g.fillStyle = "rgba(220,245,255,.4)";
  g.beginPath();
  g.ellipse(x, y + 8, w + 3, 5, 0, 0, Math.PI * 2);
  g.fill();
  if (u.kind === "galley") {
    const stroke = u.path.length ? Math.sin(clock * 9 + u.id) * 4 : 0;
    for (const dx of [-11, -3, 5, 13]) box(g, x + dx + stroke, y + 4, 2, 11, "#caa56a");
  }
  poly(g, u.flash > 0 ? "#fff" : u.kind === "bombard" ? "#4a2f18" : "#7a4d22", x - w, y - 2, x + w, y - 2, x + w * 0.65, y + 9, x - w * 0.65, y + 9);
  box(g, x - w, y - 4, w * 2, 3, "#b98a52");
  box(g, x - w * 0.8, y + 1, w * 1.6, 3, c.main);
  if (u.kind === "transport") {
    // a broad flat barge; heads show above the rail for those aboard
    box(g, x - w - 2, y - 7, w * 2 + 4, 5, "#caa56a");
    box(g, x + face * (w + 1) - 3, y - 14, 6, 9, "#8a5a2b");
    const riders = Math.min(8, u.cargo?.length ?? 0);
    for (let i = 0; i < riders; i++) {
      const px = x - 14 + (i % 4) * 9;
      const py = y - 9 - Math.floor(i / 4) * 6;
      disc(g, px, py, 3.8, "#17130f");
      disc(g, px, py, 2.8, "#efc097");
      box(g, px - 3, py - 3.5, 6, 2.5, c.light);
    }
    box(g, x - face * 18 - 1, y - 30, 2.5, 24, "#3b2514");
    sail(g, style, x - face * 18, y - 30, face, 11, c);
    return;
  }
  box(g, x - 1, y - 28 * big, 2.5, 26 * big, "#3b2514");
  if (u.kind === "fisher") {
    poly(g, c.light, x + face * 2, y - 21, x + face * 14, y - 8, x + face * 2, y - 8);
    g.strokeStyle = "#e8e0c8";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - face * 6, y - 4);
    g.lineTo(x - face * 20, y - 13);
    g.lineTo(x - face * 22, y + 8);
    g.stroke();
    if (u.carry >= 1) disc(g, x - face * 7, y - 5, 3.5, "#f4c9a8");
  } else {
    sail(g, style, x, y - 28 * big, face, 15 * big, c);
    if (u.kind === "bombard") {
      box(g, x + face * 10 - 7, y - 9, 14, 6, "#22262a");
      disc(g, x + face * 18, y - 6, 3.5, "#22262a");
    } else poly(g, "#e8eef0", x + face * w, y - 2, x + face * (w + 8), y - 1, x + face * w, y + 2);
  }
}

/** A sail hung from a mast top at (x, y); each people cuts theirs differently. */
function sail(g: G, style: number, x: number, y: number, face: number, r: number, c: Team) {
  if (style === STYLE.stone) {
    box(g, x - r * 0.8, y + 3, r * 1.6, r * 1.25, c.main);
    box(g, x - 2, y + 3, 4, r * 1.25, c.light);
    box(g, x - r * 0.8, y + 3 + r * 0.5, r * 1.6, 4, c.light);
  } else if (style === STYLE.horse) {
    for (let i = 0; i < 4; i++) poly(g, i % 2 ? c.light : c.main, x, y + r * 1.35, x + (i - 2) * r * 0.5, y + 2 + Math.abs(i - 1.5) * 3, x + (i - 1) * r * 0.5, y + 2 + Math.abs(i - 0.5) * 3 - 3);
  } else if (style === STYLE.sun) {
    poly(g, c.main, x + face * r * 0.9, y - 5, x - face * r * 1.1, y + r * 1.3, x + face * r * 0.9, y + r * 1.1);
    poly(g, c.light, x + face * r * 0.9, y - 5, x + face * r * 0.9, y + r * 0.35, x + face * r * 0.2, y + r * 0.3);
  } else {
    poly(g, c.main, x - r * 0.8, y + 3, x + r * 0.8, y + 3, x + r, y + r * 1.28, x - r, y + r * 1.28);
    box(g, x - r * 0.8, y + 3 + r * 0.5, r * 1.6, 3, c.light);
  }
  poly(g, c.light, x, y, x - face * 12, y - 4, x, y - 6);
}

function drawNode(g: G, n: Node, x: number, y: number) {
  const cx = x + 16;
  if (n.kind === "wood") {
    shadow(g, cx, y + 27, 13, 5);
    box(g, cx - 3, y + 18, 6, 10, "#6b431f");
    poly(g, "#1f4a24", cx - 14, y + 22, cx, y - 2, cx + 14, y + 22);
    poly(g, "#2d6a31", cx - 11, y + 13, cx, y - 9, cx + 11, y + 13);
    poly(g, "#3f8540", cx - 5, y + 3, cx, y - 9, cx + 3, y + 3);
  } else if (n.kind === "food") {
    shadow(g, cx, y + 26, 13, 5);
    for (const [dx, dy] of [[-6, 4], [6, 4], [0, -3]] as const) disc(g, cx + dx, y + 16 + dy, 8, "#35702f");
    for (const [dx, dy] of [[-8, 2], [-2, 8], [3, -5], [8, 5], [1, 2], [-3, -4]] as const)
      disc(g, cx + dx, y + 16 + dy, 2.4, "#c92f52");
  } else {
    const gold = n.kind === "gold";
    shadow(g, cx, y + 27, 14, 5);
    poly(g, gold ? "#7d6a45" : "#71777a", x + 2, y + 27, x + 8, y + 10, x + 18, y + 6, x + 29, y + 18, x + 30, y + 27);
    poly(g, gold ? "#a38b58" : "#a3a9a8", x + 8, y + 10, x + 18, y + 6, x + 19, y + 18, x + 9, y + 22);
    if (gold)
      for (const [dx, dy] of [[11, 15], [20, 12], [23, 21], [14, 23]] as const) {
        poly(g, "#ffd23f", x + dx, y + dy - 4, x + dx + 4, y + dy, x + dx, y + dy + 3, x + dx - 3, y + dy);
      }
  }
}

type Team = (typeof SEATS)[number];

/** The body and roof of a building, in its people's style. */
function drawHouse(g: G, style: number, kind: Building["kind"], x: number, y: number, w: number, h: number, c: Team, doorW: number) {
  const roofH = h * 0.5;
  const shade = kind === "barracks" || kind === "smithy" || kind === "workshop";
  const mid = x + w / 2;
  const door = (arched: boolean) => {
    box(g, mid - doorW / 2, y + h - 24, doorW, 18, "#4a2c17");
    if (arched) disc(g, mid, y + h - 24, doorW / 2, "#4a2c17");
  };
  if (style === STYLE.stone) {
    box(g, x + 6, y + roofH - 8, w - 12, h - roofH + 2, shade ? "#80837f" : "#a8aba4");
    for (let row = 0; row < (h - roofH) / 9 - 1; row++)
      for (let bx = x + 6 + (row % 2) * 8; bx < x + w - 14; bx += 17) box(g, bx, y + roofH + 4 + row * 9, 15, 1.5, "rgba(0,0,0,.22)");
    // a flat roof behind battlements
    box(g, x + 4, y + 14, w - 8, roofH - 18, c.dark);
    box(g, x + 7, y + 17, w - 14, roofH - 25, c.main);
    for (let bx = x + 4; bx <= x + w - 12; bx += (w - 16) / Math.round((w - 16) / 15)) {
      box(g, bx, y + 8, 8, 9, "#c3c6bd");
      box(g, bx, y + roofH - 12, 8, 9, "#c3c6bd");
    }
    box(g, x + 4, y + roofH - 5, w - 8, 5, "#c3c6bd");
    door(true);
    return;
  }
  if (style === STYLE.horse) {
    // round felt tents with a coloured cone and a crown ring
    box(g, x + 7, y + roofH, w - 14, h - roofH - 7, shade ? "#c9b896" : "#e8dcc0");
    g.fillStyle = shade ? "#c9b896" : "#e8dcc0";
    g.beginPath();
    g.ellipse(mid, y + h - 8, (w - 14) / 2, 5, 0, 0, Math.PI * 2);
    g.fill();
    for (let bx = x + 12; bx < x + w - 10; bx += 12) box(g, bx, y + roofH + 3, 1.5, h - roofH - 12, "rgba(120,90,50,.45)");
    poly(g, c.main, x + 2, y + roofH + 3, x + w * 0.3, y + 13, mid, y + 6, x + w * 0.7, y + 13, x + w - 2, y + roofH + 3);
    for (const k of [0.22, 0.5, 0.78]) {
      g.strokeStyle = c.dark;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(mid, y + 7);
      g.lineTo(x + w * k, y + roofH + 2);
      g.stroke();
    }
    box(g, x + 3, y + roofH, w - 6, 4, c.light);
    disc(g, mid, y + 8, 5, "#6e4a26");
    disc(g, mid, y + 8, 2, "#17130f");
    door(false);
    return;
  }
  if (style === STYLE.sun) {
    box(g, x + 6, y + roofH - 4, w - 12, h - roofH - 2, shade ? "#c79a5e" : "#e6c184");
    box(g, x + 4, y + roofH - 8, w - 8, 6, "#f2d9a6");
    // one dome, or two on the wide buildings
    const domes = w > 70 ? [0.31, 0.69] : [0.5];
    const r = w > 70 ? Math.min(w * 0.2, roofH - 12) : Math.min(w * 0.34, roofH - 10);
    for (const k of domes) {
      const dx = x + w * k;
      g.fillStyle = c.main;
      g.beginPath();
      g.arc(dx, y + roofH - 7, r, Math.PI, Math.PI * 2);
      g.fill();
      g.strokeStyle = c.light;
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(dx, y + roofH - 7, r * 0.7, Math.PI * 1.12, Math.PI * 1.45);
      g.stroke();
      box(g, dx - 1, y + roofH - 14 - r, 2, 8, "#8a6a35");
      disc(g, dx, y + roofH - 15 - r, 2.5, "#ffd23f");
    }
    for (const dx of [12, w - 20]) {
      box(g, x + dx, y + roofH + 6, 8, 10, "#7d5a33");
      disc(g, x + dx + 4, y + roofH + 6, 4, "#7d5a33");
    }
    door(true);
    return;
  }
  // forest folk: log walls under a steep roof with crossed beams
  box(g, x + 7, y + roofH - 2, w - 14, h - roofH - 4, shade ? "#7d5a38" : "#a9794a");
  for (let ly = y + roofH + 5; ly < y + h - 8; ly += 6) box(g, x + 7, ly, w - 14, 1.5, "rgba(40,22,8,.45)");
  poly(g, c.main, x + 2, y + roofH + 2, mid - w * 0.14, y + 3, mid + w * 0.14, y + 3, x + w - 2, y + roofH + 2);
  poly(g, c.dark, x + 2, y + roofH + 2, x + w - 2, y + roofH + 2, x + w - 5, y + roofH + 8, x + 5, y + roofH + 8);
  box(g, mid - w * 0.14, y + 3, w * 0.28, 4, c.light);
  g.strokeStyle = "#4a2c17";
  g.lineWidth = 3;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(mid + side * (w * 0.14 + 3), y + 10);
    g.lineTo(mid + side * (w * 0.14 - 6), y - 5);
    g.stroke();
  }
  door(false);
}

/** links: which sides (screen up, right, down, left) join another wall */
function drawWall(g: G, b: Building, x: number, y: number, links: boolean[]) {
  const c = TEAM[b.owner];
  const stone = b.kind === "wall";
  const body = stone ? "#9aa09a" : b.kind === "gate" ? "#6e4522" : "#9a6a35";
  const top = stone ? "#c2c7bd" : "#c39254";
  const arms = [[8, 0, 16, 16], [16, 8, 16, 16], [8, 16, 16, 16], [0, 8, 16, 16]] as const;
  arms.forEach(([ax, ay, aw, ah], i) => {
    if (!links[i]) return;
    box(g, x + ax, y + ay, aw, ah, body);
    box(g, x + ax + (aw > ah || i % 2 ? 0 : 3), y + ay + (i % 2 ? 3 : 0), i % 2 ? aw : 10, i % 2 ? 8 : ah, top);
  });
  if (b.kind === "gate") {
    const sideways = (links[1] || links[3]) && !(links[0] || links[2]);
    box(g, x + 3, y + 3, 26, 26, "#3c2512");
    for (let i = 0; i < 4; i++) {
      if (sideways) box(g, x + 6 + i * 5.5, y + 6, 4, 20, body);
      else box(g, x + 6, y + 6 + i * 5.5, 20, 4, body);
    }
    box(g, x + 2, y + 2, 6, 6, c.main);
    box(g, x + 24, y + 2, 6, 6, c.main);
    box(g, x + 2, y + 24, 6, 6, c.main);
    box(g, x + 24, y + 24, 6, 6, c.main);
    return;
  }
  box(g, x + 5, y + 5, 22, 22, "#2a2018");
  box(g, x + 6, y + 6, 20, 20, body);
  box(g, x + 8, y + 7, 16, 11, top);
  box(g, x + 14, y + 20, 4, 3, c.main);
}

function drawBuilding(g: G, b: Building, x: number, y: number, links: boolean[] = [], style = 0) {
  const s = BUILDINGS[b.kind];
  const w = s.w * 32;
  const h = s.h * 32;
  const c = TEAM[b.owner];
  if (b.progress < 1) {
    box(g, x + 3, y + 3, w - 6, h - 6, "rgba(90,60,30,.55)");
    g.strokeStyle = "#e0c07a";
    g.lineWidth = 2;
    g.strokeRect(x + 4, y + 4, w - 8, h - 8);
    const rise = (h - 14) * b.progress;
    box(g, x + 9, y + h - 7 - rise, w - 18, rise, "#a57b4a");
    for (let px = x + 8; px < x + w - 8; px += 14) box(g, px, y + 8, 3, h - 15, "#6e4a26");
    return;
  }
  if (BUILDINGS[b.kind].wall) {
    drawWall(g, b, x, y, links);
    return;
  }
  if (b.kind === "farm") {
    box(g, x + 2, y + 2, w - 4, h - 4, "#8a6a35");
    for (let i = 0; i < 6; i++) box(g, x + 5, y + 6 + i * 9.5, w - 10, 4, "#e0bd4a");
    g.strokeStyle = c.main;
    g.lineWidth = 3;
    g.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    return;
  }
  if (b.kind === "dock") {
    box(g, x + 2, y + 6, w - 4, h - 8, "#5a3a1c");
    for (let i = 0; i < 7; i++) box(g, x + 3, y + 8 + i * 8, w - 6, 6, i % 2 ? "#a5773f" : "#b98a52");
    for (const dx of [2, w - 8]) for (const dy of [6, h - 10]) disc(g, x + dx + 3, y + dy + 3, 4.5, "#3c2512");
    box(g, x + 14, y + 16, 30, 24, ["#a9794a", "#a8aba4", "#e8dcc0", "#e6c184"][style]!);
    if (style === STYLE.stone) {
      box(g, x + 12, y + 10, 34, 9, c.main);
      for (let i = 0; i < 3; i++) box(g, x + 12 + i * 13.5, y + 4, 7, 7, "#c3c6bd");
    } else if (style === STYLE.sun) {
      g.fillStyle = c.main;
      g.beginPath();
      g.arc(x + 29, y + 18, 16, Math.PI, Math.PI * 2);
      g.fill();
    } else poly(g, c.main, x + 10, y + 19, x + 29, y + (style === STYLE.horse ? 6 : -3), x + 48, y + 19);
    box(g, x + 24, y + 27, 10, 13, "#4a2c17");
    box(g, x + w - 16, y - 4, 3, 30, "#4a2c17");
    poly(g, c.light, x + w - 13, y - 4, x + w + 3, y + 1, x + w - 13, y + 7);
    return;
  }
  shadow(g, x + w / 2, y + h - 5, w / 2, 7);
  if (b.kind === "tower") {
    box(g, x + 15, y + 12, w - 30, h - 18, "#8d928c");
    box(g, x + 17, y + 12, 9, h - 18, "#b4b8ac");
    box(g, x + 11, y + 8, w - 22, 12, "#9ea39b");
    for (let i = 0; i < 4; i++) box(g, x + 11 + i * 12, y + 2, 7, 8, "#9ea39b");
    if (style === STYLE.stone) {
      box(g, x + 31, y - 16, 2, 19, "#4a2c17");
      poly(g, c.main, x + 33, y - 16, x + 47, y - 11, x + 33, y - 6);
      box(g, x + 15, y + 15, w - 30, 5, c.main);
    } else if (style === STYLE.sun) {
      g.fillStyle = c.main;
      g.beginPath();
      g.arc(x + 32, y + 4, 15, Math.PI, Math.PI * 2);
      g.fill();
      disc(g, x + 32, y - 13, 2.5, "#ffd23f");
    } else if (style === STYLE.horse) {
      poly(g, c.main, x + 12, y + 5, x + 32, y - 10, x + 52, y + 5);
      box(g, x + 31, y - 22, 2, 13, "#4a2c17");
      poly(g, c.light, x + 33, y - 22, x + 45, y - 19, x + 33, y - 15);
    } else poly(g, c.main, x + 18, y + 3, x + 32, y - 18, x + 46, y + 3);
    box(g, x + 28, y + h - 22, 9, 16, "#3c2414");
    box(g, x + 29, y + 28, 6, 9, "#25343a");
    return;
  }
  const doorW = b.kind === "town" ? 20 : 12;
  drawHouse(g, style, b.kind, x, y, w, h, c, doorW);
  if (b.kind === "town") {
    for (const dx of [18, w - 30]) box(g, x + dx, y + h - 30, 12, 12, "#31505a");
    box(g, x + w / 2 - 1, y - 20, 3, 28, "#4a2c17");
    poly(g, c.light, x + w / 2 + 2, y - 20, x + w / 2 + 22, y - 14, x + w / 2 + 2, y - 8);
  } else if (b.kind === "house") {
    if (style === STYLE.forest) box(g, x + w - 20, y + 4, 8, 14, "#7a706a");
  } else if (b.kind === "barracks") {
    g.strokeStyle = "#e8eef0";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + 16, y + h - 10);
    g.lineTo(x + 30, y + h - 28);
    g.moveTo(x + 30, y + h - 10);
    g.lineTo(x + 16, y + h - 28);
    g.stroke();
  } else if (b.kind === "store") {
    for (const [dx, dy] of [[9, h - 20], [20, h - 17], [w - 24, h - 20]] as const) {
      box(g, x + dx, y + dy, 13, 13, "#8a5a2b");
      box(g, x + dx + 2, y + dy + 5, 9, 2, "#d9a566");
    }
  } else if (b.kind === "stable") {
    disc(g, x + 22, y + h - 18, 9, "#4a2c17");
    box(g, x + w - 34, y + h - 20, 24, 12, "#e0bd4a");
  } else if (b.kind === "workshop") {
    for (const dx of [20, w - 20]) {
      disc(g, x + dx, y + h - 16, 10, "#4a2c17");
      disc(g, x + dx, y + h - 16, 6, "#c39254");
      disc(g, x + dx, y + h - 16, 2, "#4a2c17");
    }
  } else if (b.kind === "smithy") {
    box(g, x + w - 20, y, 10, 18, "#4d4a47");
    disc(g, x + w - 15, y - 3, 4, "rgba(210,210,210,.6)");
    box(g, x + 11, y + h - 19, 14, 5, "#23262a");
    box(g, x + 15, y + h - 14, 6, 7, "#23262a");
    box(g, x + w - 22, y + h - 19, 9, 9, "#ff8a24");
  } else if (b.kind === "range") {
    disc(g, x + w - 22, y + h - 19, 11, "#efe6cf");
    disc(g, x + w - 22, y + h - 19, 7, "#b83a2c");
    disc(g, x + w - 22, y + h - 19, 3, "#efe6cf");
  }
}

/** What each people wears on their heads. */
function hat(g: G, style: number, x: number, y: number, c: Team, armed: boolean) {
  if (style === STYLE.stone) {
    box(g, x - 6, y - 19, 12, 8, armed ? "#aeb8bd" : "#8d928c");
    box(g, x - 6, y - 14, 12, 2.5, "#5d666b");
    if (armed) box(g, x - 1.5, y - 22, 3, 4, c.light);
  } else if (style === STYLE.horse) {
    disc(g, x, y - 15, 6.5, "#8a5a2b");
    box(g, x - 7.5, y - 15, 15, 4, "#e8dcc0");
    poly(g, armed ? c.light : "#6e4522", x - 3, y - 20, x, y - 26, x + 3, y - 20);
  } else if (style === STYLE.sun) {
    disc(g, x, y - 15, 6.2, "#f4ead2");
    box(g, x - 6.5, y - 15, 13, 3, armed ? c.light : "#d9b455");
    box(g, x - 8, y - 13, 3, 8, "#f4ead2");
  } else if (armed) {
    disc(g, x, y - 13, 6, "#aeb8bd");
    box(g, x - 6, y - 13, 12, 3, "#6d777d");
    for (const s of [-1, 1]) poly(g, "#f4ead2", x + s * 5, y - 15, x + s * 11, y - 21, x + s * 6, y - 11);
  } else {
    box(g, x - 8, y - 17, 16, 3, "#d9b455");
    box(g, x - 4, y - 20, 8, 4, "#d9b455");
  }
}

function drawUnit(g: G, u: Unit, x: number, y: number, face: number, clock: number, style: number) {
  if (u.kind === "fisher" || u.kind === "transport" || u.kind === "galley" || u.kind === "bombard") {
    drawShip(g, u, x, y, face, clock, style);
    return;
  }
  const c = TEAM[u.owner];
  const walking = u.order.t === "move" || u.path.length > 0;
  const bob = walking ? Math.sin(u.anim * 1.6) * 1.5 : 0;
  const working = (u.order.t === "gather" || u.order.t === "build") && !u.path.length;
  const swing = working ? Math.sin(clock * 11 + u.id) * 3 : 0;
  if (u.kind === "ram") {
    shadow(g, x, y + 10, 19, 6);
    box(g, x - 15, y - 8, 30, 15, "#6e4522");
    poly(g, u.flash > 0 ? "#fff" : c.main, x - 17, y - 7, x, y - 19, x + 17, y - 7);
    box(g, x + face * 8 - 11, y - 3, 22, 6, "#b98a52");
    box(g, x + face * 20 - 3, y - 4, 6, 8, "#7c848a");
    for (const dx of [-10, 10]) {
      disc(g, x + dx, y + 8, 5.5, "#2a1a0d");
      disc(g, x + dx, y + 8, 2, "#c39254");
    }
    return;
  }
  if (u.kind === "rider") {
    shadow(g, x, y + 11, 14, 5);
    for (const dx of [-9, -4, 4, 9]) box(g, x + dx - 1.5, y + 2, 3, 9 + (Math.abs(dx) > 5 ? bob : -bob), "#3b2514");
    g.fillStyle = "#7a4d28";
    g.beginPath();
    g.ellipse(x, y + 1, 13, 7, 0, 0, Math.PI * 2);
    g.fill();
    box(g, x + face * 10 - 3, y - 11, 6, 12, "#7a4d28");
    box(g, x + face * 13 - 4, y - 13, 9, 6, "#8d5b31");
    poly(g, u.flash > 0 ? "#fff" : c.main, x - 6, y, x - 4, y - 13, x + 4, y - 13, x + 6, y);
    disc(g, x, y - 17, 5, "#efc097");
    hat(g, style, x, y - 6, c, true);
    box(g, x - face * 7 - 1, y - 28, 2, 28, "#e8eef0");
    poly(g, c.light, x - face * 7, y - 28, x - face * 18, y - 25, x - face * 7, y - 21);
    return;
  }
  shadow(g, x, y + 9, 8, 3.5);
  box(g, x - 5, y + 3, 4, 7 + bob, "#3b2a1c");
  box(g, x + 1, y + 3, 4, 7 - bob, "#3b2a1c");
  poly(g, "#17130f", x - 9, y + 6, x - 7, y - 7, x + 7, y - 7, x + 9, y + 6);
  poly(g, u.flash > 0 ? "#fff" : c.main, x - 7.5, y + 5, x - 6, y - 6, x + 6, y - 6, x + 7.5, y + 5);
  disc(g, x, y - 11, 6.5, "#17130f");
  disc(g, x, y - 11, 5.2, "#efc097");
  if (u.kind === "villager") {
    hat(g, style, x, y, c, false);
    box(g, x + face * 9 - 1, y - 7 + swing, 2.5, 13, "#7a4d22");
    box(g, x + face * 9 - 4, y - 8 + swing, 8, 4, "#cfd6d8");
    if (u.carry >= 1) {
      const col = { food: "#c92f52", wood: "#8a5a2b", gold: "#ffd23f", stone: "#b4b8ac" }[u.carryType ?? "wood"];
      disc(g, x - face * 8, y - 3, 4.5, "#17130f");
      disc(g, x - face * 8, y - 3, 3.5, col);
    }
  } else if (u.kind === "militia") {
    hat(g, style, x, y, c, true);
    box(g, x + face * 10 - 1.5, y - 18, 3, 18, "#e8eef0");
    box(g, x + face * 10 - 4, y - 2, 8, 2.5, "#7a4d22");
    disc(g, x - face * 7, y - 1, 5.5, c.light);
    disc(g, x - face * 7, y - 1, 2, c.dark);
  } else {
    if (style === STYLE.forest) poly(g, "#2f5a2a", x - 7, y - 10, x, y - 22, x + 7, y - 10);
    else hat(g, style, x, y, c, false);
    g.strokeStyle = "#7a4d22";
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(x + face * 6, y - 3, 10, face > 0 ? -1.2 : Math.PI - 1.2, face > 0 ? 1.2 : Math.PI + 1.2);
    g.stroke();
  }
}

function hpBar(g: G, x: number, y: number, w: number, f: number) {
  box(g, x - 1, y - 1, w + 2, 5, "#17130f");
  box(g, x, y, w * Math.max(0, f), 3, f > 0.5 ? "#78d64b" : f > 0.25 ? "#f2c230" : "#ee4b3a");
}

/** Draws one player's view. North's view is turned around so their own base is nearest to them. */
export function render(g: G, sim: Sim, p: PlayerId, cssW: number, cssH: number, zoom: number, dpr: number, maxHp: (u: Unit) => number) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  box(g, 0, 0, cssW, cssH, "#10140d");
  const dir = isNorth(p) ? -1 : 1;
  const cam = sim.cam[p];
  const shake = sim.shake[p] * 3;
  g.translate(cssW / 2 + (Math.random() - 0.5) * shake, cssH / 2 + (Math.random() - 0.5) * shake);
  g.scale(zoom, zoom);
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

  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) drawTile(g, tx, ty, ...corner(tx, ty, 1, 1));

  const walls = new Set<number>();
  for (const b of sim.buildings) if (BUILDINGS[b.kind].wall && b.seen & (1 << p)) walls.add((b.ty * COLS + b.tx) * 4 + b.owner);
  const links = (b: Building) =>
    [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => walls.has(((b.ty + dy! * dir) * COLS + b.tx + dx! * dir) * 4 + b.owner));

  const items: { z: number; f: () => void }[] = [];
  for (const n of sim.nodes) {
    if (n.farm || n.amount <= 0 || !onScreen(n.x, n.y) || !sim.explored[p][n.y * COLS + n.x]) continue;
    const [x, y] = corner(n.x, n.y, 1, 1);
    if (n.sea) items.push({ z: y, f: () => drawFish(g, n, x, y, sim.clock) });
    else items.push({ z: y + 28, f: () => drawNode(g, n, x, y) });
  }
  const chosen = new Set(sim.sel[p].units);
  for (const b of sim.buildings) {
    if (!(b.seen & (1 << p))) continue;
    const s = BUILDINGS[b.kind];
    if (!onScreen(b.tx, b.ty, s.w, s.h)) continue;
    const [x, y] = corner(b.tx, b.ty, s.w, s.h);
    items.push({
      z: b.kind === "farm" ? y : y + s.h * 32 - 6,
      f: () => {
        drawBuilding(g, b, x, y, s.wall ? links(b) : [], sim.style[b.owner]);
        const picked = sim.sel[p].building === b.id;
        if (picked) {
          g.strokeStyle = "#fff6a8";
          g.lineWidth = 2;
          g.strokeRect(x, y, s.w * 32, s.h * 32);
        }
        const full = fullHp(sim, b.owner, b.kind);
        if (picked || b.hp < full - 0.5) hpBar(g, x + 8, y + s.h * 32 - 4, s.w * 32 - 16, b.hp / full);
      },
    });
  }
  for (const u of sim.units) {
    if (!onScreen(u.x, u.y, 0, 0)) continue;
    if (u.owner !== p && !canSee(sim, p, u.x, u.y)) continue;
    const x = sx(u.x);
    const y = sy(u.y);
    items.push({
      z: y + 9,
      f: () => {
        const afloat = !!UNITS[u.kind].naval;
        if (chosen.has(u.id)) {
          g.strokeStyle = "#fff6a8";
          g.lineWidth = 2;
          g.beginPath();
          g.ellipse(x, y + 9, afloat ? 27 : 12, afloat ? 9 : 6, 0, 0, Math.PI * 2);
          g.stroke();
        }
        drawUnit(g, u, x, y, u.fx * dir < 0 ? -1 : 1, sim.clock, sim.style[u.owner]);
        if (chosen.has(u.id) || u.hp < maxHp(u) - 0.5) hpBar(g, x - 9, y - (afloat ? 40 : 25), 18, u.hp / maxHp(u));
      },
    });
  }
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.f();

  for (const a of sim.arrows) {
    if (!canSee(sim, p, a.x, a.y)) continue;
    const ang = Math.atan2((a.ty - a.y) * dir, (a.tx - a.x) * dir);
    g.save();
    g.translate(sx(a.x), sy(a.y) - 6);
    g.rotate(ang);
    if (a.ball) {
      disc(g, 0, 0, 5, "#17130f");
      disc(g, -6, 0, 3, "rgba(255,150,50,.75)");
    } else {
      box(g, -8, -1, 13, 2, "#4a2c17");
      poly(g, "#e8eef0", 4, -3, 10, 0, 4, 3);
    }
    g.restore();
  }
  for (const q of sim.particles) if (canSee(sim, p, q.x, q.y)) box(g, sx(q.x), sy(q.y), q.size, q.size, q.color);

  // fog of war
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      const i = ty * COLS + tx;
      if (sim.visible[p][i]) continue;
      const [x, y] = corner(tx, ty, 1, 1);
      box(g, x, y, 32.5, 32.5, sim.explored[p][i] ? "rgba(8,12,10,.38)" : "rgba(8,12,10,.82)");
    }

  g.font = "bold 11px system-ui,sans-serif";
  g.textAlign = "center";
  for (const f of sim.floaters) {
    if (!canSee(sim, p, f.x, f.y)) continue;
    g.fillStyle = f.color;
    g.fillText(f.text, sx(f.x), sy(f.y) - 16);
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

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const MINI = { water: rgb("#2c6f9e"), dirt: rgb("#a8864f"), grass: rgb("#5c8338") } as const;
const MINI_NODE = { wood: rgb("#1d4a22"), food: rgb("#d0365a"), gold: rgb("#ffd23f"), stone: rgb("#d5d9d4") } as const;
const MINI_FISH = rgb("#f4c9a8");
const DARK = rgb("#161b13");

let ground = new Uint8ClampedArray(0);
let groundFor: unknown = null;

/** One pixel per tile, turned the same way as the player's own view. */
export function renderMini(g: G, sim: Sim, p: PlayerId, flipped = isNorth(p)) {
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
    if (!(b.seen & (1 << p))) continue;
    const s = BUILDINGS[b.kind];
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) put(b.tx + x, b.ty + y, s.wall ? team[b.owner]!.light : team[b.owner]!.main);
  }
  for (const u of sim.units) {
    if (u.owner !== p && !canSee(sim, p, u.x, u.y)) continue;
    const c = u.owner === p ? [255, 255, 255] : team[u.owner]!.main;
    for (let y = 0; y < dot; y++) for (let x = 0; x < dot; x++) put(Math.round(u.x - dot / 2) + x, Math.round(u.y - dot / 2) + y, c);
  }
  g.putImageData(img, 0, 0);
  const v = sim.view[p];
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (flipped) g.setTransform(-1, 0, 0, -1, COLS, ROWS);
  g.strokeStyle = "#fff27a";
  g.lineWidth = Math.max(1, COLS / 100);
  g.strokeRect(sim.cam[p].x - v.w / 64, sim.cam[p].y - v.h / 64, v.w / 32, v.h / 32);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
