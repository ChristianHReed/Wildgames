import { COLS, ROWS, SEATS, SIZE, fitSize, setSize } from "../game/content";
import { setMap } from "../game/map";
import { FIVE_MIN, SUB, classify, clampBase, evenBases, finishMap, layoutFor, lead, mirrorSpot, resample, scaleBases, suggestBases, type Bases, type Spot, type Tile } from "../game/mapgen";

/** `bases` are for two players; `quad` for three or four. */
type Saved = { raw: string; bases: Bases; quad?: Bases; mirror: boolean; w?: number; h?: number };
let players = 2;
const KEY = "two-halls-map";

const SIZE_KEY = "two-halls-size";
let current: Saved | null = null;
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
  // five halls are placed automatically; their picture cannot be mirrored
  const saved = layout === 5 ? undefined : layout === 4 ? s.quad : s.bases;
  const mirror = s.mirror && layout !== 5;
  const bases = !saved ? suggestBases(raw, mirror, layout) : same ? saved : scaleBases(saved, w, h, COLS, ROWS);
  return { raw, bases, mirror };
}

function apply() {
  if (!current) return setMap(null, players);
  const f = fitted(current);
  setMap(finishMap(f.raw, f.bases, f.mirror));
}

/** Load the current map laid out for this many players. */
export function loadPlayers(n: number) {
  players = n;
  const grow = n > 4;
  setSize(grow ? Math.max(chosen.w, FIVE_MIN.w) : chosen.w, grow ? Math.max(chosen.h, FIVE_MIN.h) : chosen.h);
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

{
  const size = stored(SIZE_KEY) as { w: number; h: number } | null;
  if (size) setSize(size.w, size.h);
  const s = stored(KEY) as Saved | null;
  if (s && typeof s.raw === "string" && s.raw.length === (s.w ?? SIZE.w) * (s.h ?? SIZE.h)) {
    // maps saved by the first picture-map version named their two bases
    const old = s.bases as unknown as { north?: Spot; south?: Spot };
    if (old.north && old.south) s.bases = [old.south, old.north];
    current = s;
  }
  chosen = { w: COLS, h: ROWS };
  if (size || current) apply();
}

export const savedMap = () => current;

function keep(s: Saved | null) {
  current = s;
  apply();
  store(KEY, s);
}

const COLORS: Record<Tile, string> = { ".": "#679140", D: "#b08d54", "~": "#2c6f9e", T: "#1d4a22", B: "#d0365a", G: "#ffd23f", S: "#c3c8c3" };
/** a number is the base of that seat */
type Tool = Tile | number;
const PAINTS: [Tile, string][] = [[".", "Grass"], ["~", "Water"], ["T", "Trees"], ["D", "Road"], ["G", "Gold"], ["S", "Stone"], ["B", "Berries"]];

type Ui = {
  button: (label: string, fn: () => void, sub?: string, cls?: string) => HTMLButtonElement;
  close: () => void;
  bigScreen: boolean;
};

export function mapEditor({ button, close, bigScreen }: Ui) {
  const root = document.createElement("div");
  root.className = "editor";
  let image: HTMLImageElement | null = null;
  let turns = 0;
  let mirror = current?.mirror ?? false;
  if (!bigScreen || players > 4) loadPlayers(2);
  const begun = current ? fitted(current) : null;
  let raw: Tile[] | null = begun?.raw ?? null;
  let bases: Bases | null = begun?.bases ?? null;
  // untouched maps are not re-saved, so changing size does not wear away their detail
  let dirty = false;
  let tool: Tool = 1;
  /** layouts already chosen for each kind of game: two bases, or four */
  const layouts: { 2?: Bases; 4?: Bases } = {};
  const slots = () => (players > 2 ? 4 : 2);
  let preview: HTMLCanvasElement | null = null;
  let message = "";

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
    raw = classify(g.getImageData(0, 0, c.width, c.height).data);
    bases = suggestBases(raw, mirror, slots());
    delete layouts[2];
    delete layouts[4];
    dirty = true;
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
        show();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function paintPreview() {
    if (!preview || !raw || !bases) return;
    const g = preview.getContext("2d")!;
    const done = finishMap(raw, bases, mirror);
    const k = preview.width / COLS;
    done.grid.forEach((row, y) => {
      for (let x = 0; x < COLS; x++) {
        g.fillStyle = COLORS[row[x] as Tile];
        g.fillRect(x * k, y * k, k, k);
      }
    });
    done.bases.slice(0, players).forEach((spot, seat) => {
      g.fillStyle = SEATS[seat]!.main;
      g.fillRect((spot.x - 1) * k, (spot.y - 1) * k, 5 * k, 5 * k);
      g.strokeStyle = "#fff";
      g.lineWidth = 2;
      g.strokeRect((spot.x - 1) * k, (spot.y - 1) * k, 5 * k, 5 * k);
    });
  }

  function touch(e: PointerEvent, first: boolean) {
    if (!preview || !raw || !bases) return;
    dirty = true;
    const r = preview.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left - preview.clientLeft) / preview.clientWidth) * COLS);
    const y = Math.floor(((e.clientY - r.top - preview.clientTop) / preview.clientHeight) * ROWS);
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
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = x + dx;
          let ty = y + dy;
          if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) continue;
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

  function show() {
    root.replaceChildren();
    const add = <T extends HTMLElement>(el: T) => (root.append(el), el);
    const text = (tag: string, s: string) => {
      const el = document.createElement(tag);
      el.textContent = s;
      return add(el);
    };
    text("h2", "Map from a picture");
    if (bigScreen) {
      const row = add(document.createElement("div"));
      row.className = "row";
      for (const n of [2, 3, 4]) {
        row.append(button(`${n} players`, () => {
          if (bases) layouts[slots()] = bases;
          players = n;
          if (raw) bases = layouts[slots()] ?? (current && !dirty ? fitted(current).bases : suggestBases(raw, mirror, slots()));
          if (typeof tool === "number" && tool >= n) tool = 1;
          show();
        }, "", players === n ? "on" : ""));
      }
    }
    if (!raw) text("p", "Use a drawing, a screenshot or a photo of a map. Colors are read like this: blue is water, dark green is trees, light green or white is grass, brown is road, grey is stone, bright yellow is gold, red is berries.");
    if (message) text("p", message);
    const label = add(document.createElement("label"));
    label.className = "file";
    label.textContent = raw ? "Choose another picture" : "Choose or take a picture";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => input.files?.[0] && load(input.files[0]));
    label.append(input);

    if (raw) {
      preview = add(document.createElement("canvas"));
      preview.width = COLS * 6;
      preview.height = ROWS * 6;
      preview.style.aspectRatio = `${COLS} / ${ROWS}`;
      preview.style.width = `min(100%, ${(48 * COLS) / ROWS}vh, ${(480 * COLS) / ROWS}px)`;
      let finger: number | null = null;
      preview.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        finger = e.pointerId;
        try { preview!.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
        touch(e, true);
      });
      preview.addEventListener("pointermove", (e) => e.pointerId === finger && touch(e, false));
      for (const end of ["pointerup", "pointercancel"] as const)
        preview.addEventListener(end, () => { finger = null; paintPreview(); });
      text("p", "Pick a tool, then tap or drag on the map to move a base or fix a spot. The game clears room around each base, adds any missing resources and cuts a route between the bases.");
      const tools = add(document.createElement("div"));
      tools.className = "tools";
      const choices: [Tool, string][] = [
        ...SEATS.slice(0, players).map((s, seat): [Tool, string] => [seat, `${s.name} base`]),
        ...PAINTS,
      ];
      for (const [id, name] of choices) {
        const b = button(name, () => {
          tool = id;
          for (const o of tools.children) o.classList.toggle("on", o === b);
        }, "", id === tool ? "on" : "");
        const swatch = document.createElement("i");
        swatch.style.background = typeof id === "number" ? SEATS[id]!.main : COLORS[id];
        b.prepend(swatch);
        tools.append(b);
      }
      const row = add(document.createElement("div"));
      row.className = "row";
      if (image) row.append(button("Turn picture", () => { turns = (turns + 1) % 4; read(); show(); }));
      row.append(button(`Fair sides: ${mirror ? "ON" : "OFF"}`, () => { mirror = !mirror; dirty = true; show(); }, mirror ? (slots() === 4 ? "top-left quarter is copied" : "top half is copied") : "whole picture used"));
      add(button("Play on this map", () => {
        layouts[slots()] = bases!;
        if (dirty) {
          // keep the other layout too, unless the picture itself was replaced
          const old = !image && current && current.w === COLS && current.h === ROWS ? current : null;
          keep({ raw: raw!.join(""), mirror, w: COLS, h: ROWS, bases: layouts[2] ?? old?.bases ?? suggestBases(raw!, mirror, 2), quad: layouts[4] ?? old?.quad });
        }
        close();
      }, "", "go"));
      paintPreview();
    }
    if (current) add(button("Use the built-in map", () => { keep(null); close(); }));
    add(button("Back", close));
  }

  show();
  return root;
}
