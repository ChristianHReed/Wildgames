import { COLS, ROWS, SEATS, SIZE, fitSize, setSize } from "../game/content";
import { setMap } from "../game/map";
import {
  bigMin, SUB, classify, clampBase, evenBases, finishMap, layoutFor, lead, mirrorSpot, randomMap, randomRaw, resample, scaleBases, suggestBases,
  type Bases, type Extra, type Spot, type Tile,
} from "../game/mapgen";

/** `bases` are for two players; `quad` for three or four; `extra` is how many resources the game adds */
type Saved = { raw: string; bases: Bases; quad?: Bases; mirror: boolean; w?: number; h?: number; extra?: Extra };
let players = 2;
/** where the first version kept its one map */
const OLD_KEY = "two-halls-map";
const SLOTS_KEY = "siege-maps";
const USE_KEY = "siege-map-use";

const SIZE_KEY = "two-halls-size";
/** two places for maps of your own */
const savedSlots: (Saved | null)[] = [null, null];
/** which map new games use: 0 a random one, 1 or 2 a saved one */
let use = 0;
/** what the random map of the next game grows from */
let seed = (Math.random() * 2 ** 31) | 0;
const inUse = () => (use ? savedSlots[use - 1] ?? null : null);
/** the size picked on the home page (five players may need to stretch it for a game) */
let chosen = { w: SIZE.w, h: SIZE.h };

const stored = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as unknown;
  } catch {
    return null;
  }
};
const store = (key: string, value: unknown) => {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    /* the setting still works until the page is closed */
  }
};

/** The saved picture map, stretched to the current size, with bases for this many players. */
function fitted(s: Saved) {
  const w = s.w ?? SIZE.w;
  const h = s.h ?? SIZE.h;
  const original = [...s.raw] as Tile[];
  const same = w === COLS && h === ROWS;
  const raw = same ? original : resample(original, w, h, COLS, ROWS);
  const layout = layoutFor(players);
  // five or more halls are placed automatically; their picture cannot be mirrored
  const saved = layout > 4 ? undefined : layout === 4 ? s.quad : s.bases;
  const mirror = s.mirror && layout <= 4;
  const bases = !saved ? suggestBases(raw, mirror, layout) : same ? saved : scaleBases(saved, w, h, COLS, ROWS);
  return { raw, bases, mirror, extra: s.extra ?? 2 };
}

function apply() {
  const s = inUse();
  if (!s) return setMap(randomMap(players, seed));
  const f = fitted(s);
  setMap(finishMap(f.raw, f.bases, f.mirror, f.extra));
}

/** Ready the map for a new game: a saved one, or a new random one. */
export function newGame(n: number) {
  if (!inUse()) seed = (Math.random() * 2 ** 31) | 0;
  loadPlayers(n);
}

/** Load the current map laid out for this many players. */
export function loadPlayers(n: number) {
  players = n;
  const grow = n > 4;
  const least = bigMin(n);
  setSize(grow ? Math.max(chosen.w, least.w) : chosen.w, grow ? Math.max(chosen.h, least.h) : chosen.h);
  apply();
}

export const mapSize = () => chosen;

export function chooseSize(w: number, h: number) {
  const s = fitSize(w, h);
  chosen = s;
  setSize(s.w, s.h);
  apply();
  store(SIZE_KEY, s);
}

const valid = (s: unknown): Saved | null => {
  const m = s as Saved | null;
  if (!m || typeof m.raw !== "string" || m.raw.length !== (m.w ?? SIZE.w) * (m.h ?? SIZE.h)) return null;
  // maps saved by the first picture-map version named their two bases
  const old = m.bases as unknown as { north?: Spot; south?: Spot };
  if (old.north && old.south) m.bases = [old.south, old.north];
  return m;
};

{
  const size = stored(SIZE_KEY) as { w: number; h: number } | null;
  if (size) setSize(size.w, size.h);
  const saved = stored(SLOTS_KEY) as unknown[] | null;
  if (Array.isArray(saved)) saved.slice(0, 2).forEach((m, i) => (savedSlots[i] = valid(m)));
  else {
    // the one map of earlier versions becomes Map 1, and stays in use
    const one = valid(stored(OLD_KEY));
    if (one) {
      savedSlots[0] = one;
      use = 1;
      store(SLOTS_KEY, savedSlots);
      store(USE_KEY, 1);
    }
  }
  const u = stored(USE_KEY);
  if (u === 1 || u === 2) use = savedSlots[u - 1] ? u : 0;
  chosen = { w: COLS, h: ROWS };
  apply();
}

/** the map new games use, if it is one of your own */
export const savedMap = () => inUse();
/** a few words on the map in use, for the home page */
export const mapName = () => (use ? `Map ${use}` : "a new random map each game");

/** Keep a map in one of the two places (0 or 1), and play on it. */
function keep(slot: number, s: Saved) {
  savedSlots[slot] = s;
  use = slot + 1;
  store(SLOTS_KEY, savedSlots);
  store(USE_KEY, use);
  apply();
}

function choose(u: number) {
  use = u && savedSlots[u - 1] ? u : 0;
  store(USE_KEY, use);
  apply();
}

/** Which map to play on: a random one, or one of the two of your own. */
export function mapPicker(button: (label: string, fn: () => void, sub?: string, cls?: string) => HTMLButtonElement, changed: () => void) {
  const box = document.createElement("div");
  box.className = "chips maps";
  const title = document.createElement("h3");
  title.textContent = "Map";
  const row = document.createElement("div");
  const opts: [number, string, string][] = [
    [0, "Random", "new each game"],
    [1, "Map 1", savedSlots[0] ? `your map · ${savedSlots[0].w ?? SIZE.w}×${savedSlots[0].h ?? SIZE.h}` : "empty"],
    [2, "Map 2", savedSlots[1] ? `your map · ${savedSlots[1].w ?? SIZE.w}×${savedSlots[1].h ?? SIZE.h}` : "empty"],
  ];
  for (const [u, name, sub] of opts) {
    const b = button(name, () => {
      choose(u);
      changed();
    }, sub, use === u ? "on" : "");
    if (u && !savedSlots[u - 1]) b.disabled = true;
    row.append(b);
  }
  box.append(title, row);
  return box;
}

const COLORS: Record<Tile, string> = { ".": "#679140", D: "#b08d54", "~": "#2c6f9e", T: "#1d4a22", B: "#d0365a", G: "#ffd23f", S: "#c3c8c3", F: "#5cc0e0" };
/** a number is the base of that seat; "move" drags the view */
type Tool = Tile | number | "move";
const PAINTS: [Tile, string][] = [[".", "Grass"], ["~", "Water"], ["T", "Trees"], ["D", "Road"], ["G", "Gold"], ["S", "Stone"], ["B", "Berries"], ["F", "Fish"]];
const EXTRA: Record<Extra, [string, string]> = {
  2: ["Plenty", "tops up every side to a fair amount"],
  1: ["A few", "small piles by a Hall that has none"],
  0: ["None", "only what you paint"],
};
const BRUSHES: [number, string][] = [[0, "Small"], [1, "Medium"], [2, "Large"]];
const MAX_ZOOM = 8;

/** a 3D preview of the finished map, when the game can draw one */
export type Preview3d = {
  /** a new map to show; while painting this is asked often, and the board is rebuilt a few times a second */
  show: (grid: string[], bases: Bases, players: number) => void;
  /** where the camera looks: zoom (1 shows it all) and the middle, in tiles */
  look: (k: number, x: number, y: number) => void;
  /** the spot of the ground under a point of the page, in tiles (with fractions) */
  pointAt: (clientX: number, clientY: number) => { x: number; y: number } | null;
  dispose: () => void;
};

type Ui = {
  button: (label: string, fn: () => void, sub?: string, cls?: string) => HTMLButtonElement;
  close: () => void;
  bigScreen: boolean;
  /** makes a 3D preview on a canvas, or gives null to keep the flat one */
  preview3d?: (canvas: HTMLCanvasElement) => Preview3d | null;
};

type Snap = { raw: string; bases: Bases };

export function mapEditor({ button, close: closeEditor, bigScreen, preview3d }: Ui) {
  const root = document.createElement("div");
  root.className = "editor";
  let image: HTMLImageElement | null = null;
  let turns = 0;
  let mirror = inUse()?.mirror ?? false;
  if (!bigScreen || players > 4) loadPlayers(2);
  /** the saved place the map being made came from, if any: saving goes back there by default */
  let from = use ? use - 1 : -1;
  const begun = inUse() ? fitted(inUse()!) : null;
  let raw: Tile[] | null = begun?.raw ?? null;
  let bases: Bases | null = begun?.bases ?? null;
  let extra: Extra = begun?.extra ?? 2;
  // untouched maps are not re-saved, so changing size does not wear away their detail
  let dirty = false;
  let tool: Tool = 1;
  let brush = 1;
  /** layouts already chosen for each kind of game: two bases, or four */
  const layouts: { 2?: Bases; 4?: Bases } = {};
  const slots = () => (players > 2 ? 4 : 2);
  let preview: HTMLCanvasElement | null = null;
  /** the 3D preview keeps one canvas for as long as the map maker is open */
  let solid: Preview3d | null = null;
  let solidCanvas: HTMLCanvasElement | null = null;
  let message = "";
  /** the finished map last worked out, and what is on each side of it */
  let done: { grid: string[]; bases: Bases } | null = null;
  let tally: HTMLElement | null = null;
  /** the zoom buttons, dimmed when they can go no further */
  let zoomOut: HTMLButtonElement | null = null;
  let zoomIn: HTMLButtonElement | null = null;
  /** zoom (1 is the whole map) and the middle of the view, in tiles */
  const look = { k: 1, x: COLS / 2, y: ROWS / 2 };
  const history: Snap[] = [];
  const future: Snap[] = [];
  const close = () => {
    solid?.dispose();
    solid = null;
    closeEditor();
  };

  const snap = (): Snap => ({ raw: raw!.join(""), bases: bases!.map((b) => ({ ...b })) });
  /** remember the map as it is, before a change */
  const remember = () => {
    if (!raw || !bases) return;
    history.push(snap());
    if (history.length > 60) history.shift();
    future.length = 0;
  };
  const restore = (s: Snap) => {
    raw = [...s.raw] as Tile[];
    bases = s.bases;
    dirty = true;
  };

  /** Samples the picture, stretched to the shape of the game map. */
  function read() {
    if (!image) return;
    const c = document.createElement("canvas");
    c.width = COLS * SUB;
    c.height = ROWS * SUB;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.translate(c.width / 2, c.height / 2);
    g.rotate((turns * Math.PI) / 2);
    const sideways = turns % 2 === 1;
    const w = sideways ? c.height : c.width;
    const h = sideways ? c.width : c.height;
    g.drawImage(image, -w / 2, -h / 2, w, h);
    remember();
    raw = classify(g.getImageData(0, 0, c.width, c.height).data);
    bases = suggestBases(raw, mirror, slots());
    delete layouts[2];
    delete layouts[4];
    dirty = true;
  }

  /** Begin from an empty field, a random map, or one of your saved maps, instead of a picture. */
  function startFrom(kind: "blank" | "random" | number) {
    remember();
    image = null;
    if (kind === "blank") {
      raw = new Array<Tile>(COLS * ROWS).fill(".");
      bases = suggestBases(raw, mirror, slots());
    } else if (kind === "random") {
      const r = randomRaw(slots(), (Math.random() * 2 ** 31) | 0);
      raw = r.raw;
      bases = r.bases;
      mirror = r.mirror;
      extra = 2;
    } else {
      const f = fitted(savedSlots[kind]!);
      raw = f.raw;
      bases = f.bases;
      mirror = f.mirror;
      extra = f.extra;
      from = kind;
    }
    delete layouts[2];
    delete layouts[4];
    dirty = true;
    look.k = 1;
    show();
  }

  function load(file: File) {
    const reader = new FileReader();
    const fail = () => {
      message = "That file could not be opened as a picture. Try a JPG, PNG or screenshot.";
      show();
    };
    reader.onerror = fail;
    reader.onload = () => {
      const img = new Image();
      img.onerror = fail;
      img.onload = () => {
        image = img;
        turns = img.width > img.height ? 1 : 0;
        message = "";
        read();
        look.k = 1;
        show();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  /** the tiles in view on the flat preview */
  const windowOf = () => {
    const w = COLS / look.k;
    const h = ROWS / look.k;
    return { x0: look.x - w / 2, y0: look.y - h / 2, w, h };
  };
  /** keep the view on the map */
  const settle = () => {
    look.k = Math.max(1, Math.min(MAX_ZOOM, look.k));
    const hw = COLS / look.k / 2;
    const hh = ROWS / look.k / 2;
    look.x = Math.max(hw, Math.min(COLS - hw, look.x));
    look.y = Math.max(hh, Math.min(ROWS - hh, look.y));
  };
  /** the map spot under a point of the page */
  const pointAt = (clientX: number, clientY: number) => {
    if (solid) return solid.pointAt(clientX, clientY);
    if (!preview) return null;
    const r = preview.getBoundingClientRect();
    const v = windowOf();
    return {
      x: v.x0 + ((clientX - r.left - preview.clientLeft) / preview.clientWidth) * v.w,
      y: v.y0 + ((clientY - r.top - preview.clientTop) / preview.clientHeight) * v.h,
    };
  };

  /** How many of each resource every side has, to help keep a map fair. */
  function count() {
    if (!tally || !done) return;
    const n = done.bases.slice(0, players).length;
    const four = n > 2;
    const rows = done.bases.slice(0, players).map((_, seat) => {
      const north = seat === 1 || seat === 2 || seat === 4;
      const left = seat === 0 || seat === 2;
      const has = { T: 0, G: 0, S: 0, B: 0, F: 0 };
      for (let y = north ? 0 : ROWS / 2; y < (north ? ROWS / 2 : ROWS); y++)
        for (let x = four ? (left ? 0 : COLS / 2) : 0; x < (four ? (left ? COLS / 2 : COLS) : COLS); x++) {
          const c = done!.grid[y]![x] as keyof typeof has;
          if (c in has) has[c]++;
        }
      return `${SEATS[seat]!.name}: trees ${has.T} · gold ${has.G} · stone ${has.S} · berries ${has.B}${has.F ? ` · fish ${has.F}` : ""}`;
    });
    tally.textContent = n > 4 ? "" : rows.join("\n");
  }

  /** Draw the preview; with `remap` the finished map is worked out again first. */
  function paintPreview(remap = true) {
    if (!preview || !raw || !bases) return;
    settle();
    zoomOut?.classList.toggle("end", look.k <= 1.01);
    zoomIn?.classList.toggle("end", look.k >= MAX_ZOOM - 0.01);
    if (remap || !done) {
      done = finishMap(raw, bases, mirror, extra);
      count();
      solid?.show(done.grid, done.bases, players);
    }
    if (solid) return solid.look(look.k, look.x, look.y);
    const c = preview;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(COLS, Math.round((c.clientWidth || COLS * 4) * dpr));
    const H = Math.max(ROWS, Math.round((c.clientHeight || ROWS * 4) * dpr));
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    const g = c.getContext("2d")!;
    const v = windowOf();
    const s = W / v.w;
    const sy = H / v.h;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = COLORS["~"];
    g.fillRect(0, 0, W, H);
    const y0 = Math.max(0, Math.floor(v.y0));
    const x0 = Math.max(0, Math.floor(v.x0));
    for (let y = y0; y < Math.min(ROWS, Math.ceil(v.y0 + v.h)); y++) {
      const row = done.grid[y]!;
      for (let x = x0; x < Math.min(COLS, Math.ceil(v.x0 + v.w)); x++) {
        g.fillStyle = COLORS[row[x] as Tile];
        const px = Math.floor((x - v.x0) * s);
        const py = Math.floor((y - v.y0) * sy);
        g.fillRect(px, py, Math.floor((x + 1 - v.x0) * s) - px, Math.floor((y + 1 - v.y0) * sy) - py);
      }
    }
    // fine lines between tiles once they are big enough to aim at
    if (s >= 14) {
      g.strokeStyle = "rgba(0,0,0,.12)";
      g.lineWidth = 1;
      g.beginPath();
      for (let x = x0; x <= Math.min(COLS, Math.ceil(v.x0 + v.w)); x++) {
        g.moveTo(Math.round((x - v.x0) * s) + 0.5, 0);
        g.lineTo(Math.round((x - v.x0) * s) + 0.5, H);
      }
      for (let y = y0; y <= Math.min(ROWS, Math.ceil(v.y0 + v.h)); y++) {
        g.moveTo(0, Math.round((y - v.y0) * sy) + 0.5);
        g.lineTo(W, Math.round((y - v.y0) * sy) + 0.5);
      }
      g.stroke();
    }
    done.bases.slice(0, players).forEach((spot, seat) => {
      const bx = (spot.x - 1 - v.x0) * s;
      const by = (spot.y - 1 - v.y0) * sy;
      g.fillStyle = SEATS[seat]!.main;
      g.fillRect(bx, by, 5 * s, 5 * sy);
      g.strokeStyle = "#fff";
      g.lineWidth = 2 * dpr;
      g.strokeRect(bx, by, 5 * s, 5 * sy);
    });
  }

  /** zoom in or out by a factor, about the middle of the view */
  function zoomBy(f: number) {
    look.k *= f;
    paintPreview(false);
  }

  function touch(e: PointerEvent, first: boolean) {
    if (!preview || !raw || !bases || tool === "move") return;
    const at0 = pointAt(e.clientX, e.clientY);
    if (!at0) return;
    const x = Math.floor(at0.x);
    const y = Math.floor(at0.y);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    dirty = true;
    if (typeof tool === "number") {
      const n = slots();
      const at: Spot = { x: x - 1, y: y - 1 };
      if (mirror) {
        // in fair mode the bases move together: work out which part was tapped
        const top = y < ROWS / 2;
        const left = x < COLS / 2;
        const tapped = n === 2 ? (top ? 1 : 0) : top ? (left ? 2 : 1) : left ? 0 : 3;
        bases = evenBases(clampBase(mirrorSpot(at, tapped, lead(n), n), lead(n), n), n);
      } else {
        const seat = tool;
        bases = bases.map((b, i) => (i === seat ? clampBase(at, seat, n) : b));
      }
    } else {
      for (let dy = -brush; dy <= brush; dy++) {
        for (let dx = -brush; dx <= brush; dx++) {
          const tx = x + dx;
          let ty = y + dy;
          if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) continue;
          // a large brush is round
          if (brush === 2 && Math.abs(dx) === 2 && Math.abs(dy) === 2) continue;
          let px = tx;
          // fair mode copies one part everywhere, so paint lands in that part
          if (mirror && ty >= ROWS / 2) ty = ROWS - 1 - ty;
          if (mirror && slots() === 4 && px >= COLS / 2) px = COLS - 1 - px;
          raw[ty * COLS + px] = tool;
        }
      }
    }
    if (first || typeof tool !== "number") paintPreview();
  }

  /** One finger paints (or drags, with the Move tool); two fingers zoom and look around. */
  function wire(c: HTMLCanvasElement) {
    const fingers = new Map<number, { x: number; y: number }>();
    let mode: "paint" | "pan" | "pinch" | null = null;
    let began = 0;
    let pinch = { d: 1, k: 1 };
    const mid = () => {
      const ps = [...fingers.values()];
      return { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length };
    };
    const spread = () => {
      const [a, b] = [...fingers.values()];
      return a && b ? Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)) : 1;
    };
    /** move the view so the ground under `from` comes under `to` */
    const drag = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const a = pointAt(from.x, from.y);
      const b = pointAt(to.x, to.y);
      if (!a || !b) return;
      look.x += a.x - b.x;
      look.y += a.y - b.y;
    };
    c.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (fingers.size === 1) {
        began = performance.now();
        mode = tool === "move" ? "pan" : "paint";
        if (mode === "paint") {
          remember();
          touch(e, true);
        }
      } else if (fingers.size === 2) {
        // a second finger soon after the first means a pinch: take back the first finger's dab
        if (mode === "paint" && performance.now() - began < 350 && history.length) {
          restore(history.pop()!);
          paintPreview();
        }
        mode = "pinch";
        pinch = { d: spread(), k: look.k };
      }
    });
    c.addEventListener("pointermove", (e) => {
      const f = fingers.get(e.pointerId);
      if (!f) return;
      const before = mid();
      const was = { x: f.x, y: f.y };
      f.x = e.clientX;
      f.y = e.clientY;
      if (mode === "paint") touch(e, false);
      else if (mode === "pan") {
        drag(was, f);
        paintPreview(false);
      } else if (mode === "pinch" && fingers.size >= 2) {
        drag(before, mid());
        look.k = pinch.k * (spread() / pinch.d);
        paintPreview(false);
      }
    });
    const end = (e: PointerEvent) => {
      if (!fingers.delete(e.pointerId)) return;
      if (mode === "paint") paintPreview();
      if (fingers.size === 0) mode = null;
      else if (fingers.size === 1 && mode === "pinch") mode = null;
    };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });
  }

  function show() {
    root.replaceChildren();
    const add = <T extends HTMLElement>(el: T) => (root.append(el), el);
    const text = (tag: string, s: string) => {
      const el = document.createElement(tag);
      el.textContent = s;
      return add(el);
    };
    text("h2", "Map maker");
    if (bigScreen) {
      const row = add(document.createElement("div"));
      row.className = "row";
      for (const n of [2, 3, 4]) {
        row.append(button(`${n} players`, () => {
          if (bases) layouts[slots()] = bases;
          players = n;
          if (raw) bases = layouts[slots()] ?? (inUse() && !dirty ? fitted(inUse()!).bases : suggestBases(raw, mirror, slots()));
          if (typeof tool === "number" && tool >= n) tool = 1;
          show();
        }, "", players === n ? "on" : ""));
      }
    }
    if (!raw) text("p", "Start from a picture, an empty field, a random map or one of your saved maps, then save it as Map 1 or Map 2. In a picture, colors are read like this: blue is water, dark green is trees, light green or white is grass, brown is road, grey is stone, bright yellow is gold, red is berries.");
    if (message) text("p", message);
    const label = add(document.createElement("label"));
    label.className = "file";
    label.textContent = raw ? "Choose another picture" : "Choose or take a picture";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => input.files?.[0] && load(input.files[0]));
    label.append(input);
    const starts = add(document.createElement("div"));
    starts.className = "row";
    starts.append(button("Empty field", () => startFrom("blank")), button(raw ? "New random map" : "Random map", () => startFrom("random")));
    if (savedSlots.some(Boolean)) {
      const mine = add(document.createElement("div"));
      mine.className = "row";
      savedSlots.forEach((m, i) => {
        const b = button(`Open Map ${i + 1}`, () => startFrom(i), m ? "" : "empty");
        b.disabled = !m;
        mine.append(b);
      });
    }

    if (raw) {
      // a 3D board when the game draws in 3D; it is made once and kept while the map maker is open
      if (!solidCanvas && preview3d) {
        solidCanvas = document.createElement("canvas");
        solidCanvas.className = "board";
        solid = preview3d(solidCanvas);
        if (!solid) solidCanvas = null;
      }
      const stage = add(document.createElement("div"));
      stage.className = "stage";
      preview = solidCanvas ?? document.createElement("canvas");
      stage.append(preview);
      // the stage takes the preview's size, so the zoom buttons sit on its corner
      preview.style.aspectRatio = solid ? `${COLS} / ${ROWS * 0.82}` : `${COLS} / ${ROWS}`;
      preview.style.width = "100%";
      stage.style.width = `min(100%, max(48vh, 300px) * ${COLS / ROWS}, ${(480 * COLS) / ROWS}px)`;
      // a kept canvas already listens; a new one starts to
      if (!preview.dataset.wired) {
        preview.dataset.wired = "1";
        wire(preview);
      }
      // zoom, and taking changes back, just under the preview
      const edit = add(document.createElement("div"));
      edit.className = "row";
      zoomOut = button("−", () => zoomBy(1 / 1.5));
      zoomIn = button("+", () => zoomBy(1.5));
      zoomOut.setAttribute("aria-label", "Zoom out");
      zoomIn.setAttribute("aria-label", "Zoom in");
      edit.append(zoomOut, zoomIn, button("All", () => { look.k = 1; paintPreview(false); }));
      const undo = button("Undo", () => {
        if (!history.length || !raw || !bases) return;
        future.push(snap());
        restore(history.pop()!);
        show();
      });
      const redo = button("Redo", () => {
        if (!future.length || !raw || !bases) return;
        history.push(snap());
        restore(future.pop()!);
        show();
      });
      undo.disabled = !history.length;
      redo.disabled = !future.length;
      edit.append(undo, redo);
      tally = text("p", "");
      tally.className = "tally";
      text("p", "Pick a tool, then tap or drag on the map. Pinch or use − and + to zoom in; drag with two fingers, or with Move, to look around.");
      const tools = add(document.createElement("div"));
      tools.className = "tools";
      const choices: [Tool, string][] = [
        ...SEATS.slice(0, players).map((s, seat): [Tool, string] => [seat, `${s.name} base`]),
        ...PAINTS,
        ["move", "Move"],
      ];
      for (const [id, name] of choices) {
        const b = button(name, () => {
          tool = id;
          for (const o of tools.children) o.classList.toggle("on", o === b);
        }, "", id === tool ? "on" : "");
        const swatch = document.createElement("i");
        if (id === "move") swatch.className = "hand";
        else swatch.style.background = typeof id === "number" ? SEATS[id]!.main : COLORS[id];
        b.prepend(swatch);
        tools.append(b);
      }
      const sizes = add(document.createElement("div"));
      sizes.className = "row";
      for (const [r, name] of BRUSHES) {
        const b = button(`${name} brush`, () => {
          brush = r;
          for (const o of sizes.children) o.classList.toggle("on", o === b);
        }, `${r * 2 + 1}×${r * 2 + 1}`, brush === r ? "on" : "");
        sizes.append(b);
      }
      const row = add(document.createElement("div"));
      row.className = "row";
      if (image) row.append(button("Turn picture", () => { turns = (turns + 1) % 4; read(); show(); }));
      row.append(button(`Fair sides: ${mirror ? "ON" : "OFF"}`, () => { remember(); mirror = !mirror; dirty = true; show(); }, mirror ? (slots() === 4 ? "top-left quarter is copied" : "top half is copied") : "whole map used"));
      row.append(button(`Add resources: ${EXTRA[extra][0]}`, () => {
        remember();
        extra = extra === 2 ? 1 : extra === 1 ? 0 : 2;
        dirty = true;
        show();
      }, EXTRA[extra][1]));
      // save into one of the two places, and play on it
      const saves = add(document.createElement("div"));
      saves.className = "row";
      // the place it came from, else the first empty one
      const aim = from >= 0 ? from : savedSlots[0] && !savedSlots[1] ? 1 : 0;
      for (const slot of [0, 1]) {
        saves.append(button(`Save as Map ${slot + 1}`, () => {
          layouts[slots()] = bases!;
          const was = savedSlots[slot];
          if (dirty || slot !== from || !was) {
            // keep the other layout too, when the same map goes back where it came from
            const old = slot === from && !image && was && was.w === COLS && was.h === ROWS ? was : null;
            keep(slot, { raw: raw!.join(""), mirror, extra, w: COLS, h: ROWS, bases: layouts[2] ?? old?.bases ?? suggestBases(raw!, mirror, 2), quad: layouts[4] ?? old?.quad });
          } else choose(slot + 1);
          close();
        }, savedSlots[slot] ? (slot === from ? "save changes" : "replaces it") : "empty place", slot === aim ? "go" : ""));
      }
      // draw once the preview has its size on the page
      done = null;
      paintPreview();
      requestAnimationFrame(() => paintPreview(false));
    }
    if (use) add(button("Play on random maps", () => { choose(0); close(); }, "a new one each game"));
    add(button("Back", close));
  }

  show();
  return root;
}
