/**
 * Every model in the game, built from boxes, roofs, tubes and lumpy balls. Buildings stand with their
 * middle at the origin and their front to +z (south); units stand on the origin facing +z.
 */
import { BUILDINGS, STYLE, type BuildingKind, type UnitKind } from "../../game/content";
import { Mesh, glow, hash, hex, mixc, shade, team, teamLight, type Col } from "./mesh";

// ── materials ──────────────────────────────────────────────────────────────────────
const WOOD = hex("#b07a44");
const WOOD_D = hex("#8a5a30");
const WOOD_DD = hex("#5e3a1e");
const PLANK = hex("#c89a62");
const STONE = hex("#bdbab0");
const STONE_L = hex("#d4d1c6");
const STONE_D = hex("#9a978e");
const SLATE = hex("#6c7480");
const THATCH = hex("#d8b468");
const FELT = hex("#f0e4c8");
const FELT_D = hex("#d8c8a4");
const PLASTER = hex("#f6eedc");
const SANDSTONE = hex("#e8cf98");
const SAND_D = hex("#c9a874");
const TILE_BLUE = hex("#3f7fa8");
const GOLD = hex("#ffd84a");
const GOLD_D = hex("#c8961e");
const IRON = hex("#6a6e72");
const DARK = hex("#2a2620");
const WINDOW = glow("#ffcf7a");
const DOOR = hex("#6e4524");
const LEAF = hex("#6fae45");
const HAY = hex("#e8c65a");

type Style = number;

/** walls, roofs and trims of each people */
function look(style: Style) {
  if (style === STYLE.stone) return { wall: STONE, wallD: STONE_D, trim: STONE_L, roof: SLATE, base: STONE_D };
  if (style === STYLE.horse) return { wall: FELT, wallD: FELT_D, trim: WOOD_D, roof: team(1), base: WOOD_D };
  if (style === STYLE.sun) return { wall: PLASTER, wallD: SANDSTONE, trim: SANDSTONE, roof: team(1), base: SAND_D };
  return { wall: WOOD, wallD: WOOD_D, trim: WOOD_DD, roof: team(1), base: STONE_D };
}

// ── small parts ────────────────────────────────────────────────────────────────────
/** a door on a wall facing +z at depth z */
function door(m: Mesh, x: number, z: number, w: number, h: number, arch = false) {
  m.box(x - w / 2 - 0.03, 0, z - 0.01, x + w / 2 + 0.03, h + 0.04, z + 0.015, WOOD_DD);
  m.box(x - w / 2, 0, z, x + w / 2, h, z + 0.03, DOOR);
  if (arch) m.cyl(x, z + 0.015, h - 0.01, h + 0.02, w / 2, w / 2, 6, DOOR, DOOR);
  m.box(x + w * 0.22, h * 0.45, z + 0.03, x + w * 0.32, h * 0.52, z + 0.045, GOLD_D);
}
/** a lit window on the front (+z) face */
function win(m: Mesh, x: number, y: number, z: number, w = 0.13, h = 0.16, frame: Col = WOOD_DD) {
  m.box(x - w / 2 - 0.025, y - 0.025, z - 0.005, x + w / 2 + 0.025, y + h + 0.025, z + 0.02, frame);
  m.box(x - w / 2, y, z, x + w / 2, y + h, z + 0.03, WINDOW);
}
/** a window on a side face (x = constant, facing out along +x or -x) */
function winSide(m: Mesh, x: number, y: number, z: number, out: number, w = 0.13, h = 0.16) {
  m.box(x - 0.005 * out, y - 0.025, z - w / 2 - 0.025, x + 0.02 * out, y + h + 0.025, z + w / 2 + 0.025, WOOD_DD);
  m.box(x, y, z - w / 2, x + 0.03 * out, y + h, z + w / 2, WINDOW);
}
function chimney(m: Mesh, x: number, z: number, y0: number, h: number, c: Col = STONE_D) {
  m.block(x, z, 0.16, h, 0.16, c, shade(c, 1.1), y0);
  m.block(x, z, 0.2, 0.05, 0.2, shade(c, 0.85), DARK, y0 + h);
}
function barrel(m: Mesh, x: number, z: number, s = 1) {
  m.cyl(x, z, 0, 0.2 * s, 0.075 * s, 0.085 * s, 7, WOOD, PLANK);
  m.cyl(x, z, 0.04 * s, 0.055 * s, 0.083 * s, 0.083 * s, 7, IRON, null);
  m.cyl(x, z, 0.15 * s, 0.165 * s, 0.083 * s, 0.083 * s, 7, IRON, null);
}
function crate(m: Mesh, x: number, z: number, s = 0.18, y0 = 0) {
  m.box(x - s / 2, y0, z - s / 2, x + s / 2, y0 + s, z + s / 2, PLANK, hex("#d8aa72"));
  m.box(x - s / 2 - 0.005, y0 + s * 0.42, z - s / 2 - 0.005, x + s / 2 + 0.005, y0 + s * 0.58, z + s / 2 + 0.005, WOOD_D);
}
function sack(m: Mesh, x: number, z: number, c: Col = hex("#d8c090")) {
  m.ball(x, 0.07, z, 0.09, c, 0.15, Math.round(x * 100 + z * 10), 2, 6, 0.8);
}
function logs(m: Mesh, x: number, z: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const y = 0.05 + Math.floor(i / 2) * 0.08;
    const dz = (i % 2) * 0.1 - 0.05 + Math.floor(i / 2) * 0.05;
    m.push().move(x, y, z + dz).tipZ(Math.PI / 2);
    m.cyl(0, 0, -0.22, 0.22, 0.05, 0.05, 6, WOOD, PLANK);
    m.pop();
  }
}
function fence(m: Mesh, x0: number, z0: number, x1: number, z1: number) {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.28));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const z = z0 + ((z1 - z0) * i) / n;
    m.block(x, z, 0.04, 0.2, 0.04, WOOD_D);
  }
  const rail = (y: number) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const l = Math.hypot(dx, dz);
    m.push().move((x0 + x1) / 2, y, (z0 + z1) / 2).turn(Math.atan2(dx, dz));
    m.box(-0.012, 0, -l / 2, 0.012, 0.03, l / 2, WOOD);
    m.pop();
  };
  rail(0.08);
  rail(0.16);
}
function banner(m: Mesh, x: number, z: number, y: number, w: number, h: number) {
  m.part = 4.5;
  m.quad([x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y - h, z], [x - w / 2, y - h, z], team(1));
  m.tri([x - w / 2, y - h, z], [x + w / 2, y - h, z], [x, y - h - w * 0.4, z], team(1));
  m.quad([x - w * 0.18, y - h * 0.3, z + 0.005], [x + w * 0.18, y - h * 0.3, z + 0.005], [x + w * 0.18, y - h * 0.62, z + 0.005], [x - w * 0.18, y - h * 0.62, z + 0.005], teamLight(1));
  m.part = 0;
  m.box(x - w / 2 - 0.03, y - 0.02, z - 0.02, x + w / 2 + 0.03, y + 0.02, z + 0.02, WOOD_DD);
}
function pennant(m: Mesh, x: number, z: number, y0: number, h = 0.45, s = 0.26) {
  m.part = 0;
  m.block(x, z, 0.035, h, 0.035, WOOD_DD, WOOD_DD, y0);
  m.part = 4.5;
  const t = y0 + h;
  m.tri([x, t, z], [x + s, t - s * 0.25, z], [x, t - s * 0.5, z], team(1.05));
  m.part = 0;
}
/** a crenellated top round a box */
function merlons(m: Mesh, x0: number, z0: number, x1: number, z1: number, y: number, c: Col, step = 0.22, size = 0.12) {
  const along = (ax: number, az: number, bx: number, bz: number) => {
    const l = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(l / step));
    for (let i = 0; i <= n; i += 1) {
      if (i % 2) continue;
      const x = ax + ((bx - ax) * i) / n;
      const z = az + ((bz - az) * i) / n;
      m.block(x, z, size, size, size, c, shade(c, 1.08), y);
    }
  };
  along(x0, z0, x1, z0);
  along(x0, z1, x1, z1);
  along(x0, z0, x0, z1);
  along(x1, z0, x1, z1);
}
/** a round tower with a top of the owner's people */
function roundTower(m: Mesh, x: number, z: number, r: number, h: number, style: Style, flag = true) {
  if (style === STYLE.horse) {
    m.cyl(x, z, 0, h, r, r * 0.92, 6, WOOD, WOOD_D);
    for (let y = 0.15; y < h; y += 0.22) m.cyl(x, z, y, y + 0.03, r * 1.01, r * 1.01, 6, WOOD_DD, null);
    m.cyl(x, z, h, h + r * 2.2, r * 1.25, 0, 6, team(1));
    if (flag) pennant(m, x, z, h + r * 2.2 - 0.05, 0.3, 0.2);
    return;
  }
  const body = style === STYLE.sun ? PLASTER : STONE;
  m.cyl(x, z, 0, h, r * 1.08, r, 8, body, body);
  m.cyl(x, z, 0, 0.12, r * 1.14, r * 1.12, 8, style === STYLE.sun ? SANDSTONE : STONE_D, null);
  win(m, x, h * 0.55, z + r - 0.005, 0.08, 0.14, style === STYLE.sun ? SANDSTONE : STONE_D);
  if (style === STYLE.stone) {
    m.cyl(x, z, h, h + 0.08, r * 1.15, r * 1.15, 8, STONE_L, STONE_D);
    for (let i = 0; i < 8; i += 2) {
      const a = (i / 8) * Math.PI * 2;
      m.block(x + Math.cos(a) * r, z + Math.sin(a) * r, 0.11, 0.12, 0.11, STONE_L, STONE_L, h + 0.08);
    }
    if (flag) m.flag(x, z, h + 0.08, 0.5, 0.26);
  } else if (style === STYLE.sun) {
    m.cyl(x, z, h, h + 0.06, r * 1.12, r * 1.12, 8, TILE_BLUE, SANDSTONE);
    m.ball(x, h + 0.06, z, r * 1.02, team(1), 0, 3, 3, 8, 1.1);
    m.block(x, z, 0.03, 0.22, 0.03, GOLD_D, GOLD, h + 0.06 + r * 1.05);
    m.ball(x, h + 0.3 + r * 1.05, z, 0.04, GOLD, 0, 1, 2, 5);
  } else {
    m.cyl(x, z, h, h + r * 2.4, r * 1.3, 0, 8, team(1));
    if (flag) m.flag(x, z, h + r * 2.4 - 0.05, 0.3, 0.22);
  }
}

// ── houses of each people ───────────────────────────────────────────────────────────
/** a house of the owner's people, on a w by d plot, front to +z */
function house(m: Mesh, style: Style, w: number, d: number, h: number, big = false) {
  const L = look(style);
  if (style === STYLE.horse) {
    // a yurt: felt walls with a coloured band, a low cone roof, a smoke ring
    const r = Math.min(w, d) / 2;
    m.cyl(0, 0, 0, h * 0.62, r, r, 10, FELT, FELT);
    m.cyl(0, 0, h * 0.3, h * 0.42, r * 1.005, r * 1.005, 10, team(1), null);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      m.block(Math.cos(a) * r * 1.01, Math.sin(a) * r * 1.01, 0.025, h * 0.62, 0.025, WOOD_D);
    }
    m.cyl(0, 0, h * 0.62, h * 1.02, r * 1.08, r * 0.2, 10, teamLight(0.9), null);
    m.cyl(0, 0, h * 1.02, h * 1.08, r * 0.22, r * 0.18, 10, WOOD_DD, DARK);
    m.box(-0.12, 0, r - 0.06, 0.12, h * 0.46, r + 0.04, WOOD_D);
    m.box(-0.09, 0, r + 0.04, 0.09, h * 0.42, r + 0.06, hex("#b03a2a"));
    if (big) {
      m.push().move(r * 0.95, 0, -r * 0.35).size(0.62);
      m.cyl(0, 0, 0, h * 0.62, r * 0.7, r * 0.7, 10, FELT_D, FELT_D);
      m.cyl(0, 0, h * 0.62, h * 0.95, r * 0.75, r * 0.12, 10, team(0.9), null);
      m.pop();
    }
    return;
  }
  if (style === STYLE.sun) {
    // plastered walls, a band of blue tiles, a dome
    m.block(0, 0, w, 0.1, d, SANDSTONE, SANDSTONE);
    m.block(0, 0, w * 0.92, h * 0.62, d * 0.92, PLASTER, PLASTER, 0.1);
    m.block(0, 0, w * 0.96, 0.06, d * 0.96, TILE_BLUE, SANDSTONE, 0.1 + h * 0.62);
    door(m, 0, d * 0.46, 0.2, h * 0.36, true);
    win(m, -w * 0.28, h * 0.36, d * 0.46, 0.1, 0.14, SANDSTONE);
    win(m, w * 0.28, h * 0.36, d * 0.46, 0.1, 0.14, SANDSTONE);
    m.push().turn(Math.PI);
    win(m, 0, h * 0.36, d * 0.46, 0.1, 0.14, SANDSTONE);
    m.pop();
    const top = 0.16 + h * 0.62;
    const dr = Math.min(w, d) * 0.32;
    m.cyl(0, 0, top, top + 0.08, dr * 1.05, dr * 1.05, 10, SANDSTONE, SANDSTONE);
    m.ball(0, top + 0.08, 0, dr, team(1), 0, 2, 4, 10, 1.05);
    m.block(0, 0, 0.025, 0.2, 0.025, GOLD_D, GOLD, top + 0.08 + dr);
    if (big) {
      m.ball(w * 0.3, top, -d * 0.25, dr * 0.6, team(0.9), 0, 5, 4, 10, 1.05);
      m.block(-w * 0.32, -d * 0.3, 0.16, 0.5, 0.16, PLASTER, TILE_BLUE, top);
    }
    m.block(-w * 0.4, d * 0.5, 0.14, 0.16, 0.14, hex("#c9713a"), hex("#5a8a3a"));
    return;
  }
  // forest and stone: walls and a pitched roof
  const wallH = h * 0.5;
  m.block(0, 0, w, 0.1, d, L.base, shade(L.base, 1.1));
  if (style === STYLE.forest) {
    // log walls: stacked rounds
    m.block(0, 0, w * 0.9, wallH, d * 0.84, WOOD, WOOD, 0.1);
    for (let y = 0.16; y < wallH + 0.06; y += 0.11) {
      m.box(-w * 0.46, y, d * 0.42, w * 0.46, y + 0.03, d * 0.43, WOOD_D);
      m.box(-w * 0.46, y, -d * 0.43, w * 0.46, y + 0.03, -d * 0.42, WOOD_D);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.block((sx * w * 0.9) / 2, (sz * d * 0.84) / 2, 0.08, wallH, 0.08, WOOD_D, PLANK, 0.1);
  } else {
    m.block(0, 0, w * 0.9, wallH, d * 0.84, STONE, STONE, 0.1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.block((sx * w * 0.9) / 2, (sz * d * 0.84) / 2, 0.1, wallH + 0.02, 0.1, STONE_L, STONE_L, 0.1);
  }
  const eave = 0.1 + wallH;
  const roofC = style === STYLE.stone ? SLATE : team(1);
  m.roof(0, 0, w * 0.9, d * 0.84, eave, eave + h * 0.5, roofC, style === STYLE.stone ? STONE : WOOD, 0.1);
  m.box(-w * 0.47, eave + h * 0.5 - 0.02, -0.03, w * 0.47, eave + h * 0.5 + 0.03, 0.03, shade(style === STYLE.stone ? SLATE : team(1), 0.7));
  door(m, w * 0.12, d * 0.42, 0.2, wallH * 0.82);
  win(m, -w * 0.24, wallH * 0.42, d * 0.42);
  m.push().turn(Math.PI);
  win(m, -w * 0.2, wallH * 0.42, d * 0.42);
  win(m, w * 0.2, wallH * 0.42, d * 0.42);
  m.pop();
  if (big) {
    win(m, w * 0.34, wallH * 0.42, d * 0.42);
    winSide(m, w * 0.45, wallH * 0.42, 0, 1);
    winSide(m, -w * 0.45, wallH * 0.42, 0, -1);
  }
  chimney(m, -w * 0.28, -d * 0.12, eave + 0.05, h * 0.55);
  if (style === STYLE.stone) {
    m.box(w * 0.12 - 0.18, wallH * 0.82 + 0.1, d * 0.42, w * 0.12 + 0.18, wallH * 0.82 + 0.15, d * 0.48, SLATE);
  }
}

/** what a people adds to its buildings as it moves up the ages */
function ageTrim(m: Mesh, style: Style, w: number, d: number, top: number, age: number) {
  if (age < 2) return;
  if (style === STYLE.forest) {
    pennant(m, w * 0.38, -d * 0.05, top - 0.1, 0.4);
    if (age >= 3) {
      pennant(m, -w * 0.38, -d * 0.05, top - 0.1, 0.4);
      for (const sx of [-1, 1]) m.ball(sx * w * 0.46, top + 0.06, 0, 0.06, GOLD, 0, 4, 2, 6);
    }
  } else if (style === STYLE.stone) {
    for (const sx of [-1, 1]) {
      m.block(sx * w * 0.32, d * 0.47, 0.04, 0.12, 0.04, WOOD_DD, WOOD_DD, 0.32);
      m.block(sx * w * 0.32, d * 0.47, 0.06, 0.06, 0.06, glow("#ffb347"), glow("#fff0a0"), 0.44);
    }
    if (age >= 3) banner(m, 0, d * 0.43 + 0.03, top * 0.8, 0.2, 0.3);
  } else if (style === STYLE.horse) {
    pennant(m, 0, 0, top - 0.04, 0.4);
    if (age >= 3) for (const sx of [-1, 1]) {
      m.block(sx * w * 0.42, d * 0.42, 0.04, 0.55, 0.04, WOOD_DD);
      m.ball(sx * w * 0.42, 0.6, d * 0.42, 0.05, GOLD, 0, 2, 2, 5);
    }
  } else {
    for (const sx of [-1, 1]) {
      m.block(sx * w * 0.4, d * 0.48, 0.05, 0.08, 0.05, hex("#c88a3a"), glow("#ffe0a0"), top * 0.55);
    }
    if (age >= 3) m.ball(0, top + 0.05, 0, 0.06, GOLD, 0, 4, 2, 6);
  }
}

// ── each kind of building ───────────────────────────────────────────────────────────
function hall(m: Mesh, style: Style, age: number) {
  const W = 3;
  const D = 3;
  m.block(0, 0, W * 0.98, 0.08, D * 0.98, hex("#cdb48a"), hex("#d9c49a"));
  if (age >= 2) {
    // flanking towers in the Town age
    for (const sx of [-1, 1]) roundTower(m, sx * 1.12, -0.95, 0.26, 1.7 + (age >= 3 ? 0.35 : 0), style, age >= 3 || sx > 0);
  }
  if (style === STYLE.horse) {
    m.push().move(0, 0.08, 0.1);
    house(m, style, 2.2, 2.2, 1.9);
    m.pop();
    for (const [x, z] of [[-1.05, -0.9], [1.05, -0.9]] as const) {
      if (age >= 2) continue;
      m.push().move(x, 0.08, z).size(0.55);
      house(m, style, 1.5, 1.5, 1.6);
      m.pop();
    }
    m.cyl(-1.15, 1.05, 0, 0.06, 0.25, 0.28, 8, STONE_D, hex("#5a3a1e"));
    m.flag(1.2, 1.1, 0, 1.2, 0.36);
    ageTrim(m, style, 2.2, 2.2, 1.95, age);
    return;
  }
  if (style === STYLE.sun) {
    m.block(0, 0.1, 2.6, 0.12, 2.4, SANDSTONE, SANDSTONE, 0.08);
    m.block(0, 0.05, 2.4, 1.05, 2.1, PLASTER, PLASTER, 0.2);
    m.block(0, 0.05, 2.5, 0.08, 2.2, TILE_BLUE, SANDSTONE, 1.25);
    for (const x of [-0.75, -0.25, 0.25, 0.75]) {
      m.block(x, 1.12, 0.1, 0.7, 0.1, SANDSTONE, SANDSTONE, 0.2);
    }
    m.box(-1.0, 0.2, 1.1, 1.0, 0.95, 1.15, PLASTER);
    door(m, 0, 1.16, 0.34, 0.6, true);
    for (const x of [-0.6, 0.6]) win(m, x, 0.5, 1.16, 0.14, 0.22, SANDSTONE);
    m.cyl(0, 0.05, 1.33, 1.45, 0.62, 0.62, 12, SANDSTONE, SANDSTONE);
    m.ball(0, 1.45, 0.05, 0.6, team(1), 0, 2, 4, 12, 1.1);
    m.block(0, 0.05, 0.04, 0.35, 0.04, GOLD_D, GOLD, 2.1);
    m.ball(0, 2.47, 0.05, 0.06, GOLD, 0, 1, 2, 6);
    for (const [x, z] of [[-1.05, -0.85], [1.05, -0.85]] as const) {
      m.block(x, z, 0.3, 1.6, 0.3, PLASTER, TILE_BLUE, 0.08);
      m.ball(x, 1.68, z, 0.18, team(0.9), 0, 7, 3, 8, 1.2);
    }
    m.flag(1.25, 1.2, 0, 1.0, 0.32);
    ageTrim(m, style, 2.4, 2.1, 1.3, age);
    return;
  }
  const L = look(style);
  if (style === STYLE.stone) {
    m.block(0, -0.1, 2.5, 1.35, 2.1, STONE, STONE, 0.08);
    for (const [x, z] of [[-1.15, -1.0], [1.15, -1.0], [-1.15, 0.8], [1.15, 0.8]] as const) m.block(x, z, 0.42, 1.65, 0.42, STONE_L, STONE_L, 0.08);
    merlons(m, -1.22, -1.12, 1.22, 0.92, 1.43, STONE_L, 0.24, 0.13);
    for (const [x, z] of [[-1.15, -1.0], [1.15, -1.0], [-1.15, 0.8], [1.15, 0.8]] as const) merlons(m, x - 0.21, z - 0.21, x + 0.21, z + 0.21, 1.73, STONE_L, 0.21, 0.1);
    m.block(0, -0.3, 1.2, 0.55, 1.0, STONE_D, STONE_D, 1.43);
    m.hip(0, -0.3, 1.2, 1.0, 1.98, 2.45, SLATE, 0.06);
    m.flag(0, -0.3, 2.4, 0.5, 0.36);
    door(m, 0, 0.96, 0.4, 0.62, true);
    banner(m, -0.62, 0.97, 1.25, 0.28, 0.48);
    banner(m, 0.62, 0.97, 1.25, 0.28, 0.48);
    for (const x of [-0.62, 0.62]) win(m, x, 0.32, 0.96, 0.12, 0.2, STONE_D);
    m.block(0, 1.05, 0.7, 0.06, 0.25, STONE_D, STONE_D, 0.08);
    ageTrim(m, style, 2.5, 2.1, 1.4, age);
    return;
  }
  // the Forest Folk: a long timber hall with a great roof and a porch
  void L;
  m.block(0, -0.15, 2.5, 0.14, 2.0, STONE_D, STONE, 0.08);
  m.block(0, -0.15, 2.3, 0.75, 1.8, WOOD, WOOD, 0.22);
  for (let y = 0.3; y < 0.95; y += 0.12) {
    m.box(-1.15, y, 0.74, 1.15, y + 0.035, 0.76, WOOD_D);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.block(sx * 1.15, -0.15 + sz * 0.9, 0.12, 0.8, 0.12, WOOD_DD, PLANK, 0.22);
  m.roof(0, -0.15, 2.3, 1.8, 0.97, 1.95, team(1), WOOD, 0.14);
  m.box(-1.25, 1.93, -0.19, 1.25, 2.0, -0.11, shade(team(1), 0.65));
  // crossed gable horns
  for (const sx of [-1, 1]) {
    m.push().move(sx * 1.18, 1.95, -0.15);
    m.box(-0.03, 0, -0.18, 0.03, 0.3, -0.12, WOOD_DD);
    m.box(-0.03, 0, 0.12, 0.03, 0.3, 0.18, WOOD_DD);
    m.pop();
  }
  // the porch
  m.block(0, 0.92, 1.3, 0.06, 0.5, PLANK, PLANK, 0.1);
  for (const x of [-0.6, 0.6]) m.block(x, 1.12, 0.07, 0.62, 0.07, WOOD_DD, WOOD_DD, 0.16);
  m.roof(0, 0.92, 1.4, 0.55, 0.78, 1.02, team(0.9), WOOD, 0.06);
  door(m, 0, 0.76, 0.36, 0.55);
  for (const x of [-0.8, 0.8]) win(m, x, 0.45, 0.76, 0.15, 0.2);
  chimney(m, 0.7, -0.6, 1.3, 0.85);
  m.flag(-1.3, 1.25, 0, 1.15, 0.34);
  barrel(m, 1.25, 1.15);
  crate(m, 1.05, 1.25, 0.16);
  ageTrim(m, style, 2.3, 1.8, 1.95, age);
}

function barracks(m: Mesh, style: Style, age: number) {
  m.push().move(-0.35, 0, -0.1);
  house(m, style, 2.1, 1.5, style === STYLE.horse ? 1.25 : 1.35, true);
  m.pop();
  // the training yard: a rack of spears and a straw dummy
  for (let i = 0; i < 4; i++) m.push().move(1.05 + i * 0.09, 0, 0.6).tipZ(0.08).block(0, 0, 0.025, 0.65, 0.025, WOOD_D).block(0, 0, 0.05, 0.08, 0.05, IRON, IRON, 0.65).pop();
  m.block(1.15, 0.6, 0.42, 0.04, 0.04, WOOD_DD, WOOD_DD, 0.42);
  m.block(1.2, -0.2, 0.05, 0.55, 0.05, WOOD_DD);
  m.ball(1.2, 0.48, -0.2, 0.14, HAY, 0.2, 9, 2, 6, 1.3);
  m.ball(1.2, 0.7, -0.2, 0.08, HAY, 0.2, 10, 2, 5);
  m.block(1.2, -0.2, 0.36, 0.04, 0.04, WOOD_DD, WOOD_DD, 0.5);
  m.flag(-1.35, 0.75, 0, 1.1, 0.34);
  ageTrim(m, style, 2.1, 1.5, 1.35, age);
}

function range(m: Mesh, style: Style, age: number) {
  // an open shed and a row of targets
  const L = look(style);
  m.block(-0.55, -0.35, 1.7, 0.08, 1.1, PLANK, PLANK);
  for (const x of [-1.3, 0.2]) for (const z of [-0.8, 0.1]) m.block(x, z, 0.08, 0.8, 0.08, WOOD_D, WOOD_D, 0.08);
  m.box(-1.4, 0.08, -0.85, 0.3, 0.88, -0.78, L.wall);
  const rc = style === STYLE.stone ? SLATE : team(1);
  m.roof(-0.55, -0.35, 1.7, 1.1, 0.88, 1.25, rc, L.wall, 0.08);
  for (let i = 0; i < 3; i++) {
    const x = -0.9 + i * 0.6;
    m.cyl(x, 0.55, 0, 0.04, 0.15, 0.15, 8, WOOD_D, WOOD_D);
    m.push().move(x, 0.35, 0.65).tipX(-0.25);
    m.cyl(0, 0, -0.03, 0.03, 0.2, 0.2, 10, hex("#f2e6c8"), null);
    m.pop();
    m.push().move(x, 0.35, 0.65).tipX(Math.PI / 2 - 0.25);
    m.cyl(0, 0, -0.04, 0.04, 0.2, 0.2, 10, hex("#e8dcc0"), hex("#e8dcc0"));
    m.cyl(0, 0, 0.04, 0.045, 0.14, 0.14, 10, team(1), team(1));
    m.cyl(0, 0, 0.045, 0.05, 0.07, 0.07, 10, hex("#f2e6c8"), hex("#f2e6c8"));
    m.cyl(0, 0, 0.05, 0.055, 0.03, 0.03, 8, team(0.8), team(0.8));
    m.pop();
    m.block(x, 0.6, 0.04, 0.3, 0.04, WOOD_DD);
  }
  barrel(m, 1.2, -0.6);
  for (let i = 0; i < 3; i++) m.push().move(1.12 + i * 0.05, 0.2, -0.6).block(0, 0, 0.015, 0.22, 0.015, PLANK).pop();
  pennant(m, 1.35, 0.3, 0, 0.7);
  ageTrim(m, style, 1.7, 1.1, 1.25, age);
}

function stable(m: Mesh, style: Style, age: number) {
  const L = look(style);
  m.block(-0.45, -0.3, 1.9, 0.08, 1.2, L.base, L.base);
  m.block(-0.45, -0.3, 1.8, 0.62, 1.1, style === STYLE.horse ? WOOD : L.wall, style === STYLE.horse ? WOOD : L.wall, 0.08);
  const rc = style === STYLE.stone ? SLATE : style === STYLE.forest ? THATCH : team(1);
  m.roof(-0.45, -0.3, 1.8, 1.1, 0.7, 1.15, rc, WOOD_D, 0.1);
  for (const x of [-1.05, -0.45, 0.15]) {
    m.box(x - 0.2, 0.08, 0.26, x + 0.2, 0.5, 0.27, WOOD_DD);
    m.box(x - 0.18, 0.1, 0.27, x + 0.18, 0.28, 0.29, WOOD_D);
  }
  // a horse looking out, and hay
  m.push().move(-0.45, 0.45, 0.32);
  m.block(0, 0, 0.1, 0.12, 0.18, hex("#8a5a30"));
  m.block(0, 0.12, 0.012, 0.05, 0.012, DARK, DARK, -0.0);
  m.pop();
  fence(m, 0.6, -0.8, 1.42, -0.8);
  fence(m, 1.42, -0.8, 1.42, 0.85);
  fence(m, 0.6, 0.85, 1.42, 0.85);
  m.ball(1.0, 0.1, -0.2, 0.17, HAY, 0.15, 21, 2, 7, 0.75);
  m.ball(0.9, 0.1, 0.4, 0.15, HAY, 0.15, 22, 2, 7, 0.75);
  m.block(1.1, 0.15, 0.3, 0.12, 0.14, WOOD, hex("#5aa0c8"));
  ageTrim(m, style, 1.8, 1.1, 1.15, age);
}

function workshop(m: Mesh, style: Style, age: number) {
  const L = look(style);
  m.block(-0.4, -0.25, 2.0, 0.08, 1.3, PLANK, PLANK);
  for (const x of [-1.3, -0.4, 0.5]) for (const z of [-0.8, 0.3]) m.block(x, z, 0.09, 0.9, 0.09, WOOD_D, WOOD_D, 0.08);
  m.box(-1.35, 0.08, -0.85, 0.55, 0.98, -0.78, L.wall);
  const rc = style === STYLE.stone ? SLATE : team(1);
  m.roof(-0.4, -0.25, 1.9, 1.2, 0.98, 1.35, rc, L.wall, 0.1);
  // a big wheel, a log on trestles and a crane
  m.push().move(-0.8, 0.28, 0.1).tipZ(Math.PI / 2);
  m.cyl(0, 0, -0.04, 0.04, 0.26, 0.26, 10, WOOD, WOOD_D);
  m.cyl(0, 0, -0.06, 0.06, 0.05, 0.05, 6, IRON, IRON);
  m.pop();
  for (const x of [-0.2, 0.25]) m.block(x, 0.05, 0.05, 0.25, 0.25, WOOD_DD);
  m.push().move(0.02, 0.3, 0.05).tipZ(Math.PI / 2);
  m.cyl(0, 0, -0.4, 0.4, 0.08, 0.08, 7, WOOD, PLANK);
  m.pop();
  m.block(1.2, -0.5, 0.08, 1.4, 0.08, WOOD_D);
  m.push().move(1.2, 1.35, -0.5).tipX(0.9);
  m.block(0, 0, 0.06, 0.06, 0.8, WOOD_D);
  m.pop();
  m.block(1.2, 0.05, 0.01, 0.6, 0.01, hex("#d8c090"), hex("#d8c090"), 0.75);
  crate(m, 1.2, 0.05, 0.2);
  logs(m, 1.1, 0.75, 3);
  ageTrim(m, style, 1.9, 1.2, 1.35, age);
}

function smithy(m: Mesh, style: Style, age: number) {
  m.push().move(-0.15, 0, -0.2);
  house(m, style, 1.5, 1.4, 1.3);
  m.pop();
  // the forge under a lean-to, glowing
  m.block(0.6, 0.35, 0.6, 0.08, 0.9, STONE_D, STONE_D);
  m.block(0.7, 0.2, 0.42, 0.42, 0.42, STONE, STONE, 0.08);
  m.block(0.7, 0.42, 0.26, 0.2, 0.06, DARK, DARK, 0.22);
  m.block(0.7, 0.44, 0.2, 0.12, 0.04, glow("#ff8a2a"), glow("#ffd060"), 0.24);
  m.block(0.7, 0.2, 0.32, 0.06, 0.32, glow("#ff7a2a"), glow("#ffb040"), 0.5);
  chimney(m, 0.7, 0.05, 0.5, 0.85, STONE);
  for (const z of [0.0, 0.75]) m.block(0.95, z, 0.06, 0.7, 0.06, WOOD_D, WOOD_D, 0.08);
  m.push().move(0.6, 0.78, 0.35).tipZ(-0.25);
  m.box(-0.38, 0, -0.45, 0.38, 0.04, 0.45, team(0.9));
  m.pop();
  // the anvil
  m.block(0.3, 0.6, 0.12, 0.16, 0.12, WOOD_DD);
  m.block(0.3, 0.6, 0.22, 0.08, 0.1, IRON, hex("#8a8e92"), 0.16);
  barrel(m, -0.75, 0.6, 0.9);
  ageTrim(m, style, 1.5, 1.4, 1.3, age);
}

function store(m: Mesh, style: Style, age: number) {
  const L = look(style);
  m.block(0, -0.15, 1.8, 0.1, 1.4, L.base, L.base);
  m.block(0, -0.25, 1.7, 0.7, 1.0, L.wall, L.wall, 0.1);
  // an open front under a deep roof
  for (const x of [-0.8, 0, 0.8]) m.block(x, 0.38, 0.08, 0.72, 0.08, WOOD_D, WOOD_D, 0.1);
  const rc = style === STYLE.stone ? SLATE : style === STYLE.forest ? team(1) : style === STYLE.sun ? SANDSTONE : team(1);
  m.roof(0, -0.05, 1.8, 1.25, 0.82, 1.3, rc, L.wall, 0.08);
  m.box(-0.75, 0.1, 0.25, 0.75, 0.75, 0.27, DARK);
  crate(m, -0.5, 0.4, 0.2, 0.1);
  crate(m, -0.25, 0.42, 0.18, 0.1);
  crate(m, -0.4, 0.4, 0.15, 0.3);
  sack(m, 0.25, 0.45);
  sack(m, 0.42, 0.4);
  barrel(m, 0.62, 0.48);
  barrel(m, 0.75, 0.7, 0.9);
  logs(m, -0.55, 0.75, 3);
  m.ball(0.35, 0.1, 0.72, 0.1, hex("#8a8a84"), 0.25, 31, 2, 5, 0.8);
  m.ball(0.5, 0.08, 0.8, 0.07, GOLD, 0.25, 32, 2, 5, 0.8);
  ageTrim(m, style, 1.7, 1.0, 1.3, age);
}

function tower(m: Mesh, style: Style) {
  m.block(0, 0, 1.4, 0.08, 1.4, STONE_D, STONE_D);
  if (style === STYLE.forest || style === STYLE.horse) {
    // a timber watchtower
    const top = 1.9;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      m.push().move(sx * 0.42, 0, sz * 0.42);
      m.block(0, 0, 0.1, top, 0.1, WOOD_D, WOOD);
      m.pop();
    }
    for (const y of [0.6, 1.25]) {
      m.box(-0.45, y, 0.4, 0.45, y + 0.05, 0.46, WOOD_DD);
      m.box(-0.45, y, -0.46, 0.45, y + 0.05, -0.4, WOOD_DD);
      m.box(0.4, y, -0.45, 0.46, y + 0.05, 0.45, WOOD_DD);
      m.box(-0.46, y, -0.45, -0.4, y + 0.05, 0.45, WOOD_DD);
    }
    m.block(0, 0, 1.1, 0.08, 1.1, PLANK, PLANK, top);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      for (const [x, z] of [[-0.52 + t * 1.04, 0.52], [-0.52 + t * 1.04, -0.52], [0.52, -0.52 + t * 1.04], [-0.52, -0.52 + t * 1.04]] as const)
        m.block(x, z, 0.07, 0.32, 0.07, WOOD, PLANK, top + 0.08);
    }
    const rc = style === STYLE.horse ? team(1) : team(1);
    m.cyl(0, 0, top + 0.5, top + 1.05, 0.85, 0, 4, rc, null, Math.PI / 4);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.block(sx * 0.48, sz * 0.48, 0.06, 0.5, 0.06, WOOD_D, WOOD_D, top + 0.08);
    m.flag(0, 0, top + 1.0, 0.4, 0.26);
    return;
  }
  roundTower(m, 0, 0, 0.5, 2.0, style);
}

function farm(m: Mesh) {
  m.box(-0.96, 0, -0.96, 0.96, 0.05, 0.96, hex("#9a6a3c"), hex("#8a5c32"));
  for (let i = 0; i < 6; i++) {
    const z = -0.78 + i * 0.31;
    m.box(-0.84, 0.05, z - 0.07, 0.84, 0.09, z + 0.07, hex("#7a5228"), hex("#a87a44"));
    for (let k = 0; k < 9; k++) {
      const x = -0.78 + k * 0.195 + (i % 2) * 0.08;
      const hgt = 0.17 + hash(i, k, 9) * 0.07;
      m.block(x, z, 0.09, hgt, 0.09, hex("#d8b048"), hex("#f2d56a"), 0.08);
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.block(sx * 0.93, sz * 0.93, 0.07, 0.2, 0.07, WOOD_D, team(1));
  // a scarecrow
  m.block(0.7, 0.85, 0.035, 0.5, 0.035, WOOD_DD, WOOD_DD, 0.05);
  m.block(0.7, 0.85, 0.32, 0.03, 0.03, WOOD_DD, WOOD_DD, 0.4);
  m.block(0.7, 0.85, 0.12, 0.16, 0.08, team(1), team(1), 0.3);
  m.ball(0.7, 0.53, 0.85, 0.05, HAY, 0.1, 5, 2, 5);
  m.cyl(0.7, 0.85, 0.56, 0.6, 0.1, 0.06, 6, hex("#c8a050"), hex("#c8a050"));
}

function dock(m: Mesh, style: Style) {
  // planks over the water on posts, a shed, a crane and crates
  const y = 0.06;
  for (let i = 0; i < 9; i++) {
    const x = -0.92 + i * 0.23;
    m.box(x - 0.1, y - 0.05, -0.95, x + 0.1, y, 0.95, i % 2 ? PLANK : hex("#d4a872"));
  }
  for (const x of [-0.9, 0, 0.9]) for (const z of [-0.9, 0, 0.9]) m.cyl(x, z, -0.7, y + 0.05, 0.06, 0.06, 6, WOOD_D, WOOD);
  m.push().move(-0.45, y, -0.45);
  const L = look(style);
  m.block(0, 0, 0.8, 0.55, 0.7, style === STYLE.forest ? WOOD : L.wall, L.wall);
  m.roof(0, 0, 0.8, 0.7, 0.55, 0.85, style === STYLE.stone ? SLATE : team(1), style === STYLE.forest ? WOOD : L.wall, 0.06);
  door(m, 0.15, 0.35, 0.16, 0.35);
  m.pop();
  m.block(0.65, -0.6, 0.08, 1.2, 0.08, WOOD_D, WOOD_D, y);
  m.push().move(0.65, y + 1.15, -0.6).tipX(-1.0);
  m.block(0, 0, 0.05, 0.05, 0.75, WOOD_D);
  m.pop();
  m.block(0.65, 0.0, 0.01, 0.55, 0.01, hex("#d8c090"), hex("#d8c090"), y + 0.62);
  crate(m, 0.65, 0.0, 0.16, y + 0.45);
  crate(m, 0.3, 0.55, 0.2, y);
  barrel(m, 0.6, 0.6);
  m.push().move(-0.3, y, 0.55);
  m.cyl(0, 0, 0, 0.06, 0.18, 0.18, 8, hex("#c8a060"), hex("#d8b070"));
  m.pop();
  m.flag(0.9, 0.9, y, 0.9, 0.3);
}

function market(m: Mesh, style: Style) {
  m.block(0, 0, 2.9, 0.06, 2.9, style === STYLE.stone || style === STYLE.sun ? hex("#d8d0bc") : hex("#c8aa7a"), style === STYLE.stone || style === STYLE.sun ? hex("#e2dac6") : hex("#d2b688"));
  m.push().move(0, 0.06, -0.85);
  house(m, style, 1.5, 1.1, 1.3, true);
  m.pop();
  const wares = [
    (x: number, z: number) => {
      for (let k = 0; k < 6; k++) m.ball(x - 0.2 + (k % 3) * 0.2, 0.47, z - 0.05 + Math.floor(k / 3) * 0.1, 0.05, k % 2 ? hex("#d23a2c") : hex("#7cba3c"), 0.1, k, 2, 5);
    },
    (x: number, z: number) => logs(m, x, z, 3),
    (x: number, z: number) => {
      m.ball(x - 0.12, 0.47, z, 0.09, STONE_D, 0.3, 4, 2, 5);
      for (let k = 0; k < 3; k++) m.ball(x + 0.08 + k * 0.08, 0.45, z, 0.04, GOLD, 0.1, k + 8, 2, 5);
    },
  ];
  for (let i = 0; i < 3; i++) {
    const x = -0.95 + i * 0.95;
    const z = 0.65;
    for (const [px, pz] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]] as const) m.block(x + px, z + pz, 0.05, 0.75, 0.05, WOOD_D, WOOD_D, 0.06);
    m.block(x, z + 0.1, 0.75, 0.32, 0.35, WOOD, PLANK, 0.06);
    if (i === 1) {
      m.push().move(x, 0.42, z + 0.1).size(1, 1, 1);
      logs(m, 0, 0, 3);
      m.pop();
    } else wares[i]!(x, z + 0.1);
    // a striped awning
    for (let k = 0; k < 5; k++) {
      const ax = x - 0.4 + k * 0.16;
      m.quad([ax, 0.86, z - 0.3], [ax + 0.16, 0.86, z - 0.3], [ax + 0.16, 0.74, z + 0.35], [ax, 0.74, z + 0.35], k % 2 ? hex("#f6ecd6") : team(1));
      m.quad([ax, 0.74, z + 0.35], [ax + 0.16, 0.74, z + 0.35], [ax + 0.16, 0.66, z + 0.38], [ax, 0.66, z + 0.38], k % 2 ? hex("#f6ecd6") : team(1));
    }
  }
  // a sign with scales, barrels and sacks
  m.block(1.25, -0.2, 0.06, 1.0, 0.06, WOOD_D);
  m.block(1.25, -0.05, 0.04, 0.04, 0.3, WOOD_D, WOOD_D, 0.95);
  m.block(1.25, 0.1, 0.03, 0.22, 0.22, hex("#e8d8b0"), hex("#e8d8b0"), 0.7);
  m.block(1.27, 0.1, 0.02, 0.1, 0.02, GOLD_D, GOLD_D, 0.75);
  barrel(m, -1.25, -0.2);
  sack(m, -1.25, 0.1);
  crate(m, 1.2, 0.5, 0.18);
}

function castle(m: Mesh, style: Style) {
  const sunny = style === STYLE.sun;
  const horse = style === STYLE.horse;
  const wall = sunny ? SANDSTONE : horse ? WOOD : STONE;
  const wallTop = sunny ? PLASTER : horse ? PLANK : STONE_L;
  m.block(0, 0, 3.95, 0.08, 3.95, hex("#b8a888"), hex("#c8b898"));
  // curtain walls
  const h = 1.05;
  const seg = (x0: number, z0: number, x1: number, z1: number) => {
    m.box(Math.min(x0, x1) - 0.16, 0.08, Math.min(z0, z1) - 0.16, Math.max(x0, x1) + 0.16, h, Math.max(z0, z1) + 0.16, wall, wallTop);
    if (horse) {
      const l = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.round(l / 0.16);
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        const z = z0 + ((z1 - z0) * i) / n;
        m.cyl(x, z, h, h + 0.16, 0.06, 0, 4, WOOD_D, null);
      }
    } else merlons(m, Math.min(x0, x1) - 0.12, Math.min(z0, z1) - 0.12, Math.max(x0, x1) + 0.12, Math.max(z0, z1) + 0.12, h, wallTop, 0.22, 0.11);
  };
  seg(-1.55, -1.55, 1.55, -1.55);
  seg(-1.55, -1.55, -1.55, 1.55);
  seg(1.55, -1.55, 1.55, 1.55);
  seg(-1.55, 1.55, -0.45, 1.55);
  seg(0.45, 1.55, 1.55, 1.55);
  // the gatehouse
  m.block(0, 1.55, 0.9, 1.35, 0.5, wall, wallTop, 0.08);
  m.box(-0.28, 0.08, 1.79, 0.28, 0.8, 1.82, DARK);
  m.cyl(0, 1.805, 0.8, 0.82, 0.28, 0.28, 8, DARK, DARK);
  for (let x = -0.22; x <= 0.23; x += 0.11) m.box(x - 0.015, 0.08, 1.81, x + 0.015, 0.95, 1.83, IRON);
  for (let y = 0.25; y < 0.9; y += 0.18) m.box(-0.27, y, 1.81, 0.27, y + 0.03, 1.83, IRON);
  if (!horse) merlons(m, -0.45, 1.3, 0.45, 1.8, 1.43, wallTop, 0.2, 0.11);
  else m.roof(0, 1.55, 0.9, 0.5, 1.43, 1.75, team(1), WOOD, 0.06);
  banner(m, -0.3, 1.81, 1.3, 0.18, 0.34);
  banner(m, 0.3, 1.81, 1.3, 0.18, 0.34);
  // corner towers
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) roundTower(m, sx * 1.55, sz * 1.55, 0.36, 1.65, style, sz < 0 || sx > 0);
  // the keep
  if (sunny) {
    m.block(0, -0.3, 1.6, 1.8, 1.5, PLASTER, PLASTER, 0.08);
    m.block(0, -0.3, 1.7, 0.08, 1.6, TILE_BLUE, SANDSTONE, 1.88);
    m.cyl(0, -0.3, 1.96, 2.06, 0.6, 0.6, 12, SANDSTONE, SANDSTONE);
    m.ball(0, 2.06, -0.3, 0.58, team(1), 0, 11, 4, 12, 1.15);
    m.block(0, -0.3, 0.04, 0.4, 0.04, GOLD_D, GOLD, 2.7);
    m.ball(0, 3.12, -0.3, 0.07, GOLD, 0, 1, 2, 6);
    for (const x of [-0.45, 0, 0.45]) win(m, x, 1.2, 0.455, 0.12, 0.22, SANDSTONE);
  } else if (horse) {
    m.cyl(0, -0.3, 0.08, 1.4, 0.85, 0.85, 12, FELT, FELT);
    m.cyl(0, -0.3, 0.7, 0.85, 0.855, 0.855, 12, team(1), null);
    m.cyl(0, -0.3, 1.4, 2.6, 0.95, 0.12, 12, teamLight(0.9), null);
    m.flag(0, -0.3, 2.55, 0.7, 0.4);
  } else {
    m.block(0, -0.3, 1.5, 2.1, 1.4, STONE, STONE, 0.08);
    for (const x of [-0.4, 0.4]) win(m, x, 1.3, 0.405, 0.12, 0.22, STONE_D);
    win(m, 0, 0.7, 0.405, 0.12, 0.22, STONE_D);
    if (style === STYLE.stone) {
      merlons(m, -0.8, -1.05, 0.8, 0.45, 2.18, STONE_L, 0.24, 0.14);
      m.block(0, -0.3, 1.6, 0.1, 1.5, STONE_L, STONE_L, 2.08);
      m.flag(0, -0.3, 2.18, 0.8, 0.45);
    } else {
      m.roof(0, -0.3, 1.5, 1.4, 2.18, 3.0, team(1), STONE, 0.1);
      m.flag(0.7, -0.3, 2.9, 0.45, 0.3);
    }
    banner(m, 0, 0.42, 1.95, 0.4, 0.62);
  }
}

/** one piece of wall: a post with arms out to the linked neighbours (north, east, south, west) */
function wallPiece(m: Mesh, kind: BuildingKind, links: number) {
  const stone = kind === "wall";
  const arms: [number, number][] = [];
  if (links & 1) arms.push([0, -1]);
  if (links & 2) arms.push([1, 0]);
  if (links & 4) arms.push([0, 1]);
  if (links & 8) arms.push([-1, 0]);
  if (stone) {
    const h = 0.95;
    m.block(0, 0, 0.42, h + 0.05, 0.42, STONE, STONE_L);
    m.block(0, 0, 0.46, 0.12, 0.46, STONE_D, STONE_D);
    merlons(m, -0.2, -0.2, 0.2, 0.2, h + 0.05, STONE_L, 0.2, 0.1);
    for (const [dx, dz] of arms) {
      const x0 = dx < 0 ? -0.5 : dx > 0 ? 0 : -0.17;
      const x1 = dx > 0 ? 0.5 : dx < 0 ? 0 : 0.17;
      const z0 = dz < 0 ? -0.5 : dz > 0 ? 0 : -0.17;
      const z1 = dz > 0 ? 0.5 : dz < 0 ? 0 : 0.17;
      m.box(x0, 0, z0, x1, h, z1, STONE, STONE_L);
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      for (const s of [-1, 1]) {
        if (dx) m.block(cx, cz + s * 0.12, 0.12, 0.12, 0.08, STONE_L, STONE_L, h);
        else m.block(cx + s * 0.12, cz, 0.08, 0.12, 0.12, STONE_L, STONE_L, h);
      }
    }
    return;
  }
  // palisade: sharpened stakes
  const stake = (x: number, z: number, s: number) => {
    const hh = 0.68 + hash(Math.round(x * 50), Math.round(z * 50), 3) * 0.1;
    m.cyl(x, z, 0, hh, 0.06 * s, 0.06 * s, 5, WOOD, null);
    m.cyl(x, z, hh, hh + 0.12, 0.06 * s, 0, 5, PLANK, null);
  };
  stake(0, 0, 1.15);
  for (const [dx, dz] of arms) for (const t of [0.17, 0.33, 0.48]) stake(dx * t, dz * t, 1);
  if (arms.length) {
    for (const [dx, dz] of arms) {
      const x0 = Math.min(0, dx * 0.5), x1 = Math.max(0, dx * 0.5), z0 = Math.min(0, dz * 0.5), z1 = Math.max(0, dz * 0.5);
      m.box(x0 - (dx ? 0 : 0.07), 0.38, z0 - (dz ? 0 : 0.07), x1 + (dx ? 0 : 0.07), 0.44, z1 + (dz ? 0 : 0.07), WOOD_DD);
    }
  }
}

function gate(m: Mesh, links: number, style: Style) {
  // a gate across a wall: runs east-west unless the wall runs north-south
  const ns = (links & 5) !== 0 && (links & 10) === 0;
  m.push();
  if (ns) m.turn(Math.PI / 2);
  for (const sx of [-1, 1]) {
    m.block(sx * 0.42, 0, 0.2, 1.15, 0.36, style === STYLE.forest || style === STYLE.horse ? WOOD_D : STONE, style === STYLE.forest || style === STYLE.horse ? PLANK : STONE_L);
  }
  m.box(-0.5, 1.0, -0.18, 0.5, 1.15, 0.18, style === STYLE.forest || style === STYLE.horse ? WOOD_D : STONE);
  for (let i = 0; i < 6; i++) {
    const x = -0.3 + i * 0.12;
    m.box(x - 0.05, 0, -0.04, x + 0.05, 0.9, 0.04, i % 2 ? WOOD : WOOD_D);
  }
  for (const y of [0.25, 0.65]) m.box(-0.32, y, -0.06, 0.32, y + 0.05, 0.06, IRON);
  m.flag(-0.42, 0, 1.15, 0.4, 0.26);
  m.pop();
}

// ── construction ──────────────────────────────────────────────────────────────────────
/** poles and planks round a building going up */
export function scaffold(w: number, d: number, h: number) {
  const m = new Mesh();
  const x = w / 2 - 0.08;
  const z = d / 2 - 0.08;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.block(sx * x, sz * z, 0.05, h, 0.05, PLANK, PLANK);
  for (let y = 0.35; y < h; y += 0.45) {
    m.box(-x, y, z - 0.03, x, y + 0.04, z + 0.03, WOOD);
    m.box(-x, y, -z - 0.03, x, y + 0.04, -z + 0.03, WOOD);
    m.box(x - 0.03, y, -z, x + 0.03, y + 0.04, z, WOOD);
    m.box(-x - 0.03, y, -z, -x + 0.03, y + 0.04, z, WOOD);
  }
  m.box(-w / 2 + 0.05, 0, -d / 2 + 0.05, w / 2 - 0.05, 0.03, d / 2 - 0.05, hex("#b89a6a"));
  logs(m, w / 2 - 0.3, d / 2 - 0.15, 2);
  return m;
}

/** A building of any kind, for a people, in an age; walls also by which neighbours they join. */
export function buildingModel(kind: BuildingKind, style: Style, age: number, links = 0): Mesh {
  const m = new Mesh();
  switch (kind) {
    case "town": hall(m, style, age); break;
    case "house": house(m, style, 1.75, 1.6, 1.3); ageTrim(m, style, 1.75, 1.6, 1.3, age); break;
    case "manor": house(m, style, 1.9, 1.8, 1.75, true); ageTrim(m, style, 1.9, 1.8, 1.75, age); break;
    case "barracks": barracks(m, style, age); break;
    case "range": range(m, style, age); break;
    case "stable": stable(m, style, age); break;
    case "workshop": workshop(m, style, age); break;
    case "smithy": smithy(m, style, age); break;
    case "store": store(m, style, age); break;
    case "tower": tower(m, style); break;
    case "farm": farm(m); break;
    case "dock": dock(m, style); break;
    case "market": market(m, style); break;
    case "castle": castle(m, style); break;
    case "gate": gate(m, links, style); break;
    default: wallPiece(m, kind, links);
  }
  void BUILDINGS;
  return m;
}

// ── trees and resources ───────────────────────────────────────────────────────────────
export function treeModel(kind: number): Mesh {
  const m = new Mesh();
  const trunk = hex("#7a5232");
  if (kind === 0) {
    // a pine
    m.cyl(0, 0, 0, 0.45, 0.07, 0.05, 5, trunk, null);
    const g = hex("#3f7a3a");
    m.cyl(0, 0, 0.28, 0.95, 0.46, 0, 7, shade(g, 0.9), null, 0.2);
    m.cyl(0, 0, 0.62, 1.3, 0.38, 0, 7, g, null, 0.6);
    m.cyl(0, 0, 0.95, 1.65, 0.28, 0, 7, shade(g, 1.12), null, 1.0);
    // the lower skirts close underneath
    m.cyl(0, 0, 0.28, 0.28, 0.46, 0.46, 7, shade(g, 0.7), shade(g, 0.7), 0.2);
  } else if (kind === 1) {
    // a round broadleaf
    m.cyl(0, 0, 0, 0.55, 0.07, 0.05, 5, trunk, null);
    m.push().move(0.02, 0.5, 0).tipZ(0.6).cyl(0, 0, 0, 0.22, 0.03, 0.02, 4, trunk, null).pop();
    const g = hex("#6fae45");
    m.ball(0, 0.85, 0, 0.42, g, 0.14, 3, 3, 7);
    m.ball(0.2, 1.08, 0.08, 0.26, shade(g, 1.1), 0.14, 4, 3, 6);
    m.ball(-0.18, 0.72, 0.12, 0.25, shade(g, 0.92), 0.14, 5, 2, 6);
  } else if (kind === 2) {
    // a tall cypress
    m.cyl(0, 0, 0, 0.3, 0.06, 0.05, 5, trunk, null);
    const g = hex("#4f8a3c");
    m.ball(0, 0.95, 0, 0.26, g, 0.1, 6, 4, 7, 2.6);
  } else {
    // a birch: pale trunk, light crown
    m.cyl(0, 0, 0, 0.7, 0.05, 0.04, 5, hex("#e8e4d8"), null);
    m.box(-0.051, 0.25, -0.02, 0.051, 0.29, 0.02, DARK);
    const g = hex("#9cc457");
    m.ball(0, 0.95, 0, 0.32, g, 0.16, 8, 3, 7, 1.25);
    m.ball(0.12, 1.2, -0.05, 0.2, shade(g, 1.1), 0.16, 9, 2, 6);
  }
  return m;
}

export function stumpModel(): Mesh {
  const m = new Mesh();
  m.cyl(0, 0, 0, 0.1, 0.09, 0.08, 6, hex("#7a5232"), hex("#d8b07a"));
  m.cyl(0, 0, 0.1, 0.101, 0.05, 0.05, 6, hex("#c8a070"), hex("#b08050"));
  return m;
}

export function nodeModel(kind: "food" | "gold" | "stone", v: number): Mesh {
  const m = new Mesh();
  if (kind === "food") {
    // a berry bush
    const g = hex("#4e8c3a");
    m.ball(0, 0.22, 0, 0.3, g, 0.18, 11 + v, 3, 7, 0.75);
    m.ball(0.18, 0.18, 0.12, 0.2, shade(g, 1.1), 0.18, 12 + v, 2, 6, 0.8);
    // berries on the outside of the leaves, mostly on top and at the front
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4 + v;
      const up = 0.25 + hash(i, v, 2) * 0.9;
      const r = 0.3 * Math.cos(up) + 0.02;
      m.ball(Math.cos(a) * r, 0.22 + Math.sin(up) * 0.24, Math.sin(a) * r, 0.05, hex(i % 3 ? "#e0304e" : "#ff6a8a"), 0, i, 1, 5);
    }
  } else if (kind === "gold") {
    m.ball(0, 0.12, 0, 0.3, hex("#8a7a64"), 0.3, 21 + v, 2, 6, 0.7);
    m.ball(0.2, 0.08, 0.15, 0.18, hex("#9a8a72"), 0.3, 22 + v, 2, 5, 0.8);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.9 + v;
      m.ball(Math.cos(a) * 0.2, 0.18 + hash(i, v, 3) * 0.12, Math.sin(a) * 0.2, 0.07, i % 2 ? GOLD : GOLD_D, 0.2, i + 3, 1, 4);
    }
    m.ball(0, 0.3, 0, 0.08, GOLD, 0.2, 40 + v, 1, 4);
  } else {
    m.ball(0, 0.16, 0, 0.32, hex("#a8a49c"), 0.32, 31 + v, 2, 6, 0.85);
    m.ball(0.24, 0.1, 0.1, 0.2, hex("#bab6ae"), 0.3, 32 + v, 2, 5, 0.8);
    m.ball(-0.18, 0.08, 0.2, 0.15, hex("#94908a"), 0.3, 33 + v, 2, 5, 0.8);
  }
  return m;
}

export function fishModel(): Mesh {
  const m = new Mesh();
  m.tri([0, 0, 0.09], [0.035, 0, -0.03], [-0.035, 0, -0.03], hex("#2a5a7a"));
  m.tri([0, 0, -0.03], [0.04, 0, -0.1], [-0.04, 0, -0.1], hex("#2a5a7a"));
  return m;
}

export function decorModel(kind: number): Mesh {
  const m = new Mesh();
  const tint = team(1);
  if (kind === 0) {
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7;
      const x = Math.cos(a) * 0.04;
      const z = Math.sin(a) * 0.04;
      m.tri([x - 0.025, 0, z], [x + 0.025, 0, z], [x * 2.2, 0.13 + (i % 2) * 0.04, z * 2.2], tint);
    }
  } else if (kind === 1) {
    m.block(0, 0, 0.012, 0.09, 0.012, hex("#5a8a3a"));
    m.ball(0, 0.1, 0, 0.028, tint, 0, 1, 1, 5);
  } else if (kind === 2) {
    m.ball(0, 0.015, 0, 0.05, tint, 0.3, 3, 2, 5, 0.6);
  } else if (kind === 3) {
    for (let i = 0; i < 5; i++) {
      const x = (hash(i, 1, 2) - 0.5) * 0.16;
      const z = (hash(i, 3, 4) - 0.5) * 0.16;
      const h = 0.3 + hash(i, 5, 6) * 0.2;
      m.block(x, z, 0.018, h, 0.018, tint);
      if (i % 2) m.block(x, z, 0.03, 0.07, 0.03, hex("#7a5232"), hex("#7a5232"), h * 0.8);
    }
  } else if (kind === 4) {
    m.ball(0, 0.08, 0, 0.12, tint, 0.2, 7, 2, 6, 0.75);
    m.ball(0.08, 0.06, 0.05, 0.08, mixc(tint, hex("#ffffff", 0.25), 0.08), 0.2, 8, 2, 5);
  } else {
    m.cyl(0, 0, 0, 0.008, 0.07, 0.07, 7, tint, tint, 0);
    if (hash(kind, 3, 1) > 0.3) m.ball(0.02, 0.02, 0.01, 0.022, hex("#ffe8f0"), 0, 2, 1, 5);
  }
  return m;
}

// ── people, beasts, engines and ships ─────────────────────────────────────────────────
const SKIN = [hex("#f1c9a5"), hex("#d9a27a"), hex("#a8724c")];
/** hip and shoulder heights of a person, and the horse's hip, for the walking swing */
export const PERSON_PIVOT = [0.2, 0.42, 0, 0] as const;
export const HORSE_PIVOT = [0.3, 0.62, 0, 0] as const;

type Tool = "none" | "axe" | "pick" | "hoe" | "hammer" | "basket";

function hat(m: Mesh, style: Style, armed: boolean, y: number) {
  if (armed && style !== STYLE.horse) {
    m.cyl(0, 0, y - 0.03, y + 0.06, 0.1, 0.09, 7, IRON, hex("#8a8e92"));
    if (style === STYLE.sun) m.cyl(0, 0, y + 0.06, y + 0.14, 0.05, 0, 6, hex("#8a8e92"), null);
    else m.block(0, 0, 0.02, 0.06, 0.02, team(1), team(1), y + 0.06);
    return;
  }
  if (style === STYLE.forest) {
    m.cyl(0, -0.01, y - 0.02, y + 0.16, 0.1, 0.0, 6, hex("#5a7a3a"), null);
    m.block(0.05, 0, 0.012, 0.1, 0.012, hex("#e8463a"), hex("#e8463a"), y + 0.04);
  } else if (style === STYLE.stone) {
    m.cyl(0, 0, y - 0.01, y + 0.04, 0.1, 0.1, 7, hex("#6a5a4a"), hex("#7a6a5a"));
  } else if (style === STYLE.horse) {
    m.cyl(0, 0, y - 0.03, y + 0.08, 0.11, 0.08, 7, hex("#7a5232"), hex("#e8dcc0"));
    m.cyl(0, 0, y + 0.08, y + 0.12, 0.08, 0.02, 7, team(1), null);
  } else {
    m.cyl(0, 0, y - 0.03, y + 0.07, 0.1, 0.09, 7, hex("#f6f0e2"), hex("#f6f0e2"));
    m.cyl(0, 0, y + 0.02, y + 0.04, 0.102, 0.102, 7, team(1), null);
  }
}

/** a person: boots, legs that swing, a tunic in the owner's colour, an arm that works, a head and a hat */
export function personModel(kind: UnitKind, style: Style, skin: number, tool: Tool, carry: string): Mesh {
  const m = new Mesh();
  const armed = kind !== "villager";
  const cloth = team(1);
  const legs = hex(style === STYLE.sun ? "#e8dcc0" : "#5a4232");
  for (const [side, part] of [[-1, 1], [1, 2]] as const) {
    m.part = part;
    m.block(side * 0.045, 0, 0.065, 0.2, 0.075, legs, legs);
    m.block(side * 0.045, 0.012, 0.07, 0.05, 0.1, hex("#3a2418"), hex("#3a2418"));
  }
  m.part = 0;
  // body
  m.block(0, 0, 0.2, 0.2, 0.15, cloth, cloth, 0.19);
  m.block(0, 0, 0.215, 0.035, 0.16, hex("#5a3a1e"), hex("#5a3a1e"), 0.24);
  if (armed && style === STYLE.stone) m.block(0, 0, 0.205, 0.08, 0.155, IRON, hex("#8a8e92"), 0.31);
  // the far arm
  m.block(-0.12, 0, 0.05, 0.17, 0.06, shade(cloth, 0.9), shade(cloth, 0.9), 0.23);
  m.block(-0.12, 0, 0.05, 0.04, 0.05, SKIN[skin]!, SKIN[skin]!, 0.2);
  // head
  m.block(0, 0, 0.15, 0.15, 0.14, SKIN[skin]!, SKIN[skin]!, 0.41);
  m.box(-0.04, 0.48, 0.07, -0.015, 0.5, 0.072, DARK);
  m.box(0.015, 0.48, 0.07, 0.04, 0.5, 0.072, DARK);
  m.box(-0.078, 0.41, -0.072, 0.078, 0.56, -0.02, hex(skin === 2 ? "#2a1a10" : "#6a4426"));
  hat(m, style, armed, 0.56);
  // things on the back
  if (kind === "archer") {
    m.push().move(0.03, 0.3, -0.1).tipX(0.3);
    m.block(0, 0, 0.06, 0.22, 0.05, hex("#7a4a26"));
    for (let i = -1; i <= 1; i++) m.block(i * 0.015, 0, 0.008, 0.05, 0.008, hex("#f6ecd6"), hex("#f6ecd6"), 0.22);
    m.pop();
  }
  if (carry === "wood") for (let i = 0; i < 2; i++) m.push().move(0, 0.3 + i * 0.06, -0.12).tipZ(Math.PI / 2).cyl(0, 0, -0.14, 0.14, 0.03, 0.03, 5, WOOD, PLANK).pop();
  else if (carry === "food") {
    m.block(0, -0.12, 0.14, 0.12, 0.08, hex("#c8a050"), hex("#c8a050"), 0.24);
    for (let i = 0; i < 3; i++) m.ball(-0.04 + i * 0.04, 0.37, -0.12, 0.025, hex("#d23a5c"), 0, i, 1, 4);
  } else if (carry === "gold" || carry === "stone") m.ball(0, 0.32, -0.13, 0.08, carry === "gold" ? GOLD : hex("#a8a49c"), 0.3, 5, 2, 5);
  // the working arm, with its tool or weapon
  m.part = 3;
  m.block(0.12, 0, 0.05, 0.17, 0.06, cloth, cloth, 0.23);
  m.block(0.12, 0, 0.05, 0.04, 0.05, SKIN[skin]!, SKIN[skin]!, 0.2);
  const hand = (f: () => void) => {
    m.push().move(0.13, 0.22, 0.03);
    f();
    m.pop();
  };
  if (kind === "militia") {
    hand(() => {
      m.block(0, 0.02, 0.02, 0.04, 0.08, WOOD_DD);
      m.box(-0.012, -0.01, 0.06, 0.012, 0.01, 0.32, hex("#d8dcde"));
    });
    m.part = 0;
    m.push().move(-0.14, 0.3, 0.03);
    m.cyl(0, 0, -0.02, 0.02, 0.11, 0.11, 8, team(1), team(1));
    m.pop();
    m.push().move(-0.165, 0.3, 0.03).tipZ(Math.PI / 2);
    m.cyl(0, 0, -0.004, 0.004, 0.11, 0.11, 8, team(1), team(1));
    m.cyl(0, 0, -0.012, 0.012, 0.03, 0.03, 6, GOLD_D, GOLD_D);
    m.pop();
  } else if (kind === "archer") {
    hand(() => {
      m.box(-0.01, -0.12, 0.04, 0.01, 0.2, 0.06, WOOD_D);
      m.box(-0.003, -0.12, 0.0, 0.003, 0.2, 0.004, hex("#f6ecd6"));
    });
  } else if (tool === "axe") {
    hand(() => {
      m.box(-0.012, -0.012, -0.02, 0.012, 0.012, 0.24, WOOD);
      m.box(-0.01, -0.06, 0.18, 0.01, 0.04, 0.26, IRON);
    });
  } else if (tool === "pick") {
    hand(() => {
      m.box(-0.012, -0.012, -0.02, 0.012, 0.012, 0.24, WOOD);
      m.box(-0.012, -0.1, 0.2, 0.012, 0.1, 0.235, IRON);
    });
  } else if (tool === "hoe") {
    hand(() => {
      m.box(-0.012, -0.012, -0.05, 0.012, 0.012, 0.3, WOOD);
      m.box(-0.04, -0.07, 0.27, 0.04, 0.0, 0.29, IRON);
    });
  } else if (tool === "hammer") {
    hand(() => {
      m.box(-0.012, -0.012, -0.02, 0.012, 0.012, 0.2, WOOD);
      m.box(-0.03, -0.04, 0.16, 0.03, 0.04, 0.24, IRON);
    });
  } else if (tool === "basket") {
    hand(() => m.cyl(0, 0.04, -0.06, 0.02, 0.06, 0.08, 6, hex("#c8a050"), hex("#7a5a2a")));
  }
  m.part = 0;
  return m;
}

export function riderModel(style: Style, skin: number): Mesh {
  const m = new Mesh();
  const coat = style === STYLE.horse ? hex("#6a4426") : style === STYLE.sun ? hex("#e8dcc0") : style === STYLE.stone ? hex("#5a5e62") : hex("#8a5a30");
  // the horse: body, neck, head, tail, and legs that trot
  for (const [x, z, part] of [[-0.07, 0.2, 1], [0.07, 0.2, 2], [-0.07, -0.2, 2], [0.07, -0.2, 1]] as const) {
    m.part = part;
    m.block(x, z, 0.06, 0.32, 0.07, coat, coat);
    m.block(x, z, 0.07, 0.05, 0.08, DARK, DARK);
  }
  m.part = 0;
  m.block(0, 0, 0.2, 0.2, 0.52, coat, coat, 0.28);
  m.push().move(0, 0.42, 0.24).tipX(-0.6);
  m.block(0, 0, 0.12, 0.26, 0.13, coat, coat);
  m.pop();
  m.block(0, 0.42, 0.11, 0.1, 0.22, coat, coat, 0.58);
  m.block(0, 0.3, 0.06, 0.18, 0.12, DARK, DARK, 0.5);
  m.box(-0.03, 0.3, -0.33, 0.03, 0.46, -0.26, DARK);
  m.block(0, 0, 0.22, 0.04, 0.2, team(1), team(1), 0.47);
  // the rider
  m.push().move(0, 0.42, -0.02).size(0.95);
  m.block(0, 0, 0.2, 0.2, 0.15, team(1), team(1), 0.05);
  for (const s of [-1, 1]) m.block(s * 0.1, 0.04, 0.06, 0.06, 0.16, hex("#5a4232"), hex("#5a4232"), 0.02);
  m.block(0, 0, 0.15, 0.15, 0.14, SKIN[skin]!, SKIN[skin]!, 0.25);
  m.box(-0.04, 0.32, 0.07, -0.015, 0.34, 0.072, DARK);
  m.box(0.015, 0.32, 0.07, 0.04, 0.34, 0.072, DARK);
  hat(m, style, true, 0.4);
  m.pop();
  // a lance
  m.box(0.14, 0.55, -0.25, 0.16, 0.57, 0.5, WOOD);
  m.box(0.135, 0.545, 0.5, 0.165, 0.575, 0.6, hex("#d8dcde"));
  m.part = 4.5;
  m.tri([0.15, 0.58, 0.42], [0.15, 0.68, 0.42], [0.15, 0.62, 0.3], team(1));
  m.part = 0;
  return m;
}

export function ramModel(): Mesh {
  const m = new Mesh();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    m.push().move(sx * 0.24, 0.1, sz * 0.24).tipZ(Math.PI / 2);
    m.cyl(0, 0, -0.03, 0.03, 0.1, 0.1, 8, WOOD_D, WOOD);
    m.pop();
  }
  m.box(-0.22, 0.1, -0.4, 0.22, 0.16, 0.4, WOOD_D);
  for (const sx of [-1, 1]) m.block(sx * 0.2, 0, 0.05, 0.45, 0.6, WOOD, WOOD, 0.16);
  m.roof(0, 0, 0.5, 0.75, 0.55, 0.78, hex("#8a6a44"), WOOD, 0.04);
  m.push().move(0, 0.34, 0.15).tipX(Math.PI / 2);
  m.cyl(0, 0, -0.45, 0.42, 0.07, 0.07, 7, WOOD, PLANK);
  m.cyl(0, 0, 0.42, 0.5, 0.08, 0.06, 7, IRON, IRON);
  m.pop();
  m.part = 4.5;
  m.quad([-0.26, 0.6, 0.38], [-0.26, 0.6, -0.38], [-0.27, 0.3, -0.38], [-0.27, 0.3, 0.38], team(0.9));
  m.part = 0;
  return m;
}

/** a hull of length l, width w */
function hull(m: Mesh, l: number, w: number, h: number, c: Col = WOOD) {
  const y0 = -0.05;
  const pts: [number, number][] = [[0, l / 2 + 0.1], [w * 0.4, l * 0.32], [w / 2, 0], [w * 0.44, -l * 0.38], [0.0, -l / 2]];
  const ring = (y: number, k: number) => pts.map(([x, z]) => [x * k, y, z * (0.92 + k * 0.08)] as [number, number, number]);
  const top = ring(y0 + h, 1);
  const bot = ring(y0, 0.65);
  const side = (s: number) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = top[i]!, b = top[i + 1]!, c2 = bot[i + 1]!, d = bot[i]!;
      m.quad([a[0] * s, a[1], a[2]], [b[0] * s, b[1], b[2]], [c2[0] * s, c2[1], c2[2]], [d[0] * s, d[1], d[2]], i % 2 ? c : shade(c, 0.92));
    }
  };
  side(1);
  side(-1);
  // the deck
  const deck = top.map(([x, , z]) => [x * 0.92, y0 + h - 0.02, z * 0.95] as [number, number, number]);
  const deckFull: [number, number, number][] = [...deck, ...deck.slice(1, -1).reverse().map(([x, y, z]) => [-x, y, z] as [number, number, number])];
  m.poly(deckFull, PLANK);
  // a coloured stripe along the top
  for (let i = 0; i < pts.length - 1; i++)
    for (const s of [1, -1]) {
      const a = top[i]!, b = top[i + 1]!;
      m.quad([a[0] * s * 1.01, a[1], a[2]], [b[0] * s * 1.01, b[1], b[2]], [b[0] * s * 1.01, b[1] - 0.04, b[2]], [a[0] * s * 1.01, a[1] - 0.04, a[2]], team(1));
    }
}
function sail(m: Mesh, z: number, y0: number, h: number, w: number) {
  m.cyl(0, z, y0, y0 + h + 0.15, 0.025, 0.02, 5, WOOD_D, null);
  m.box(-w / 2 - 0.05, y0 + h - 0.02, z - 0.02, w / 2 + 0.05, y0 + h + 0.02, z + 0.02, WOOD_D);
  m.part = 5;
  m.quad([-w / 2, y0 + h, z + 0.01], [w / 2, y0 + h, z + 0.01], [w / 2 * 0.95, y0 + 0.12, z + 0.06], [-w / 2 * 0.95, y0 + 0.12, z + 0.06], hex("#f6ecd6"));
  m.quad([-w / 2 * 0.5, y0 + h * 0.75, z + 0.02], [w / 2 * 0.5, y0 + h * 0.75, z + 0.02], [w / 2 * 0.5, y0 + h * 0.45, z + 0.04], [-w / 2 * 0.5, y0 + h * 0.45, z + 0.04], team(1));
  m.part = 0;
  m.flag(0, z, y0 + h + 0.1, 0.12, 0.16);
}

export function shipModel(kind: UnitKind): Mesh {
  const m = new Mesh();
  if (kind === "fisher") {
    hull(m, 0.75, 0.32, 0.14);
    m.cyl(0, -0.05, 0.08, 0.6, 0.02, 0.015, 5, WOOD_D, null);
    m.part = 5;
    m.tri([0, 0.58, -0.04], [0, 0.14, -0.04], [0.0, 0.14, 0.25], hex("#f6ecd6"));
    m.part = 0;
    m.cyl(0.05, -0.25, 0.08, 0.13, 0.07, 0.07, 6, hex("#c8a060"), hex("#8a7050"));
    return m;
  }
  if (kind === "transport") {
    hull(m, 1.3, 0.55, 0.2);
    m.block(0, -0.35, 0.36, 0.2, 0.3, WOOD, WOOD_D, 0.13);
    crate(m, 0.12, 0.25, 0.14, 0.14);
    barrel(m, -0.12, 0.3, 0.7);
    sail(m, 0.05, 0.14, 0.6, 0.6);
    return m;
  }
  if (kind === "galley") {
    hull(m, 1.4, 0.46, 0.2, WOOD_D);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
      const z = -0.38 + i * 0.18;
      m.push().move(s * 0.24, 0.1, z).tipZ(s * 1.2);
      m.box(-0.01, 0, -0.01, 0.01, 0.32, 0.01, PLANK);
      m.pop();
    }
    m.box(-0.03, 0.0, 0.75, 0.03, 0.08, 0.92, IRON);
    sail(m, 0.0, 0.14, 0.62, 0.62);
    for (const s of [-1, 1]) m.cyl(s * 0.2, -0.45, 0.14, 0.16, 0.07, 0.07, 8, team(1), team(1));
    return m;
  }
  hull(m, 1.5, 0.6, 0.24, WOOD_D);
  m.block(0, -0.45, 0.42, 0.22, 0.35, WOOD, WOOD_D, 0.16);
  for (const s of [-1, 1]) {
    m.push().move(s * 0.2, 0.22, 0.25).tipZ(s * Math.PI / 2);
    m.cyl(0, 0, -0.05, 0.22, 0.05, 0.04, 7, DARK, DARK);
    m.pop();
  }
  sail(m, 0.05, 0.16, 0.65, 0.66);
  return m;
}

export function arrowModel(ball: boolean): Mesh {
  const m = new Mesh();
  if (ball) {
    m.ball(0, 0, 0, 0.07, DARK, 0.1, 1, 2, 6);
    return m;
  }
  m.box(-0.008, -0.008, -0.16, 0.008, 0.008, 0.14, WOOD_D);
  m.tri([0, 0, 0.2], [0.025, 0, 0.13], [-0.025, 0, 0.13], hex("#d8dcde"));
  m.tri([0, 0, -0.12], [0.03, 0, -0.18], [-0.03, 0, -0.18], hex("#f6ecd6"));
  return m;
}

export function rallyModel(): Mesh {
  const m = new Mesh();
  m.flag(0, 0, 0, 0.55, 0.3);
  m.cyl(0, 0, 0, 0.03, 0.06, 0.06, 6, STONE_D, STONE_D);
  return m;
}

/** a tall banner on a pole, marking where a player starts */
export function bigFlagModel(): Mesh {
  const m = new Mesh();
  m.block(0, 0, 0.05, 1.2, 0.05, WOOD_DD, GOLD);
  m.ball(0, 1.22, 0, 0.05, GOLD, 0, 1, 2, 5);
  m.part = 4.5;
  m.quad([0.03, 1.15, 0], [0.62, 1.1, 0], [0.62, 0.72, 0], [0.03, 0.75, 0], team(1.05));
  m.tri([0.62, 1.1, 0], [0.78, 0.93, 0], [0.62, 0.72, 0], team(1.05));
  m.quad([0.03, 1.15, 0.004], [0.3, 1.13, 0.004], [0.3, 0.98, 0.004], [0.03, 1.0, 0.004], teamLight(1));
  m.part = 0;
  return m;
}

/** a cart of dirt and planks: what stands where a building has been begun */
export function siteModel(w: number, d: number) {
  const m = new Mesh();
  m.box(-w / 2 + 0.06, 0, -d / 2 + 0.06, w / 2 - 0.06, 0.04, d / 2 - 0.06, hex("#b89a6a"), hex("#c8aa7a"));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.block(sx * (w / 2 - 0.1), sz * (d / 2 - 0.1), 0.05, 0.22, 0.05, WOOD_D);
  return m;
}

export { mixc, LEAF };
