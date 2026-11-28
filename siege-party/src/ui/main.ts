import { playSfx, resumeAudio, setMuted, unlockAudio } from "../game/audio";
import { AGES, BUILDINGS, BUILD_MENU, COLS, GOODS, LEVELS, MAX_SEATS, ROWS, SEATS, SIZE, TECHS, isNorth, UNITS, canAfford, type Cost, type TechKind, type UnitKind, type BuildingKind } from "../game/content";
import { bigMin } from "../game/mapgen";
import { act, type Cmd, type Group } from "../game/commands";
import {
  IDS, allied, begin, techBlock, unitCost, unitStats, createSim, focusHall, hasComplete, panCam, clampCam, quote,
  step, takeSnap, togglePause,
  type Mode, type PlayerId, type Setup, type SideSnap,
} from "../game/sim";
import { PIXEL, render, renderMini, snapZoom } from "./draw";
import { groundFrame } from "./ground";
import { soundscape } from "./sound";
import { chooseSize, loadPlayers, mapEditor, mapName, mapPicker, mapSize, newGame } from "./editor";
import { sizePicker } from "./sizes";
import { hostLobby, joinLobby, type HostPlan } from "./lobby";
import type { Link } from "./net";
import { applySnapshot, applyStart, guestTick, memory, snapshot, startMessage, type Memory } from "./sync";
import { chips, stylePicker } from "./widgets";

const sim = createSim();
(window as unknown as { __game: unknown }).__game = sim;
const $ = <T extends HTMLElement = HTMLElement>(q: string) => document.querySelector(q) as T;
const stage = $("#stage");
const overlay = $("#overlay");

/**
 * Three and four players need room for four sets of controls. Every iPad counts, the mini
 * included, even when the browser's bars take a slice of the screen.
 */
const bigScreen = () => {
  const room = (a: number, b: number, short: number, long: number) => Math.min(a, b) >= short && Math.max(a, b) >= long;
  return room(window.innerWidth, window.innerHeight, 600, 740) || (room(screen.width, screen.height, 740, 1000) && room(window.innerWidth, window.innerHeight, 540, 700));
};

/** the seat played on this device, when only one person is using it */
let me: PlayerId = 0;
/** the other devices in an online game: the host keeps a list, a guest has one link */
type Remote = { link: Link; seat: PlayerId; memory: Memory };
let remotes: Remote[] = [];
let hostLink: Link | null = null;

/** several people around one screen */
const shared = () => sim.mode === "duel";
/** whether this seat's panel is turned to face the far side of a shared screen */
const turnedSeat = (p: PlayerId) => shared() && isNorth(p);

/** Do something as player p: here, or by asking the host to. */
function send(p: PlayerId, c: Cmd) {
  if (hostLink) hostLink.send({ t: "cmd", c });
  else act(sim, p, c);
  sim.uiDirty = true;
}

// every seat gets a copy of the same panel
const template = $<HTMLTemplateElement>("#seat");
for (const p of IDS) {
  const panel = (template.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
  panel.id = `p${p}`;
  panel.setAttribute("aria-label", `${SEATS[p].name} player`);
  panel.style.setProperty("--team", SEATS[p].main);
  stage.insertBefore(panel, overlay);
}

const panels = IDS.map((p) => {
  const root = $(`#p${p}`);
  const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector(s) as T;
  const canvas = q<HTMLCanvasElement>("canvas");
  /** a sharp, see-through layer over the painting, for health bars and numbers */
  const fx = q<HTMLCanvasElement>("canvas.fx");
  return {
    p, root, canvas, g: canvas.getContext("2d")!, fx, fg: fx.getContext("2d")!,
    /** choosing allies */
    diplo: false,
    mini: q<HTMLCanvasElement>(".mini"), zoomBtn: q<HTMLButtonElement>(".zoom"), far: false, cat: -1,
    /** showing the upgrades of a building that also trains */
    ups: 0,
    /** the market's page: 0 its front, 1 selling, 2 buying (with the market's id) */
    mkt: 0, mktOf: 0,
    gone: q(".gone"),
    res: q(".res"), info: q(".info"), actions: q(".actions"), groups: q(".groups"), toast: q(".toast"),
    w: 0, h: 0, zoom: 1, actionKey: "", resKey: "", groupKey: "",
    /** a building whose Demolish button was pressed once, and when (it must be pressed again to tear it down) */
    sure: 0, sureAt: 0,
  };
});

const handlers = new WeakMap<Element, () => void>();
let turned = false; // whole stage rotated 90° so the players sit at the left and right ends

const seated = (p: PlayerId) => (shared() ? p < sim.count : p === me);

function layout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const quad = shared() && sim.count > 2;
  turned = shared() && !quad && vw > vh && matchMedia("(pointer: coarse)").matches;
  document.body.classList.toggle("solo", !!sim.mode && !shared());
  document.body.classList.toggle("quad", quad);
  document.body.classList.toggle("three", quad && sim.count === 3);
  for (const p of IDS) {
    $(`#p${p}`).hidden = !seated(p);
    $(`#p${p}`).classList.toggle("north", turnedSeat(p));
  }
  document.body.classList.toggle("turned", turned);
  stage.style.width = `${turned ? vh : vw}px`;
  stage.style.height = `${turned ? vw : vh}px`;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const q of panels) {
    const box = q.canvas.parentElement!;
    q.w = box.clientWidth;
    q.h = box.clientHeight;
    if (!q.w || !q.h) continue;
    // the painting is made at its own size and the browser enlarges it softly to the screen
    q.canvas.width = Math.max(1, Math.round(q.w / PIXEL));
    q.canvas.height = Math.max(1, Math.round(q.h / PIXEL));
    q.fx.width = Math.round(q.w * dpr);
    q.fx.height = Math.round(q.h * dpr);
    q.zoom = snapZoom(Math.max(0.6, Math.min(2, q.w / (12 * 32), q.h / (8 * 32))) * (q.far ? 0.55 : 1));
    sim.view[q.p] = { w: q.w / q.zoom, h: q.h / q.zoom };
    clampCam(sim, q.p);
    // the minimap takes the shape of the map
    if (q.mini.width !== COLS || q.mini.height !== ROWS) {
      q.mini.width = COLS;
      q.mini.height = ROWS;
    }
    const fit = Math.min(68 / COLS, 84 / ROWS);
    q.mini.style.width = `${Math.round(COLS * fit) + 4}px`;
    q.mini.style.height = `${Math.round(ROWS * fit) + 4}px`;
  }
}

/** Screen point -> the canvas's own coordinates (from its centre), undoing our rotations. */
function local(q: (typeof panels)[number], e: PointerEvent) {
  const r = q.canvas.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  const a = ((turned ? 90 : 0) + (turnedSeat(q.p) ? 180 : 0)) * (Math.PI / 180);
  return { x: dx * Math.cos(a) + dy * Math.sin(a), y: -dx * Math.sin(a) + dy * Math.cos(a) };
}

for (const q of panels) {
  const touches = new Map<number, { sx: number; sy: number; x: number; y: number; moved: boolean }>();
  q.canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try { q.canvas.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    const at = local(q, e);
    touches.set(e.pointerId, { sx: at.x, sy: at.y, x: at.x, y: at.y, moved: false });
  });
  q.canvas.addEventListener("pointermove", (e) => {
    const t = touches.get(e.pointerId);
    if (!t || sim.phase !== "play") return;
    const at = local(q, e);
    if (!t.moved && Math.hypot(at.x - t.sx, at.y - t.sy) > 10) t.moved = true;
    if (t.moved) {
      // a northern player sees the map turned around, with their own base nearest
      const k = (isNorth(q.p) ? -1 : 1) / (q.zoom * 32);
      panCam(sim, q.p, -(at.x - t.x) * k, -(at.y - t.y) * k);
      sim.uiDirty = true;
    }
    t.x = at.x;
    t.y = at.y;
  });
  q.canvas.addEventListener("pointerup", (e) => {
    const t = touches.get(e.pointerId);
    touches.delete(e.pointerId);
    if (!t || t.moved) return;
    const dir = isNorth(q.p) ? -1 : 1;
    const wx = sim.cam[q.p].x + (dir * t.x) / (q.zoom * 32);
    const wy = sim.cam[q.p].y + (dir * t.y) / (q.zoom * 32);
    send(q.p, { t: "tap", x: wx, y: wy });
  });
  q.canvas.addEventListener("pointercancel", (e) => touches.delete(e.pointerId));
}

// Minimap: touch or drag it to jump around. Zoom button: near / far.
for (const q of panels) {
  const jump = (e: PointerEvent) => {
    const r = q.mini.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const a = ((turned ? 90 : 0) + (turnedSeat(q.p) ? 180 : 0)) * (Math.PI / 180);
    const lx = (dx * Math.cos(a) + dy * Math.sin(a)) / q.mini.offsetWidth;
    const ly = (-dx * Math.sin(a) + dy * Math.cos(a)) / q.mini.offsetHeight;
    const dir = isNorth(q.p) ? -1 : 1;
    sim.cam[q.p] = { x: (0.5 + dir * lx) * COLS, y: (0.5 + dir * ly) * ROWS };
    clampCam(sim, q.p);
    sim.uiDirty = true;
  };
  let finger: number | null = null;
  q.mini.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    finger = e.pointerId;
    try { q.mini.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    if (sim.phase === "play") jump(e);
  });
  q.mini.addEventListener("pointermove", (e) => { if (e.pointerId === finger && sim.phase === "play") jump(e); });
  for (const end of ["pointerup", "pointercancel"] as const) q.mini.addEventListener(end, () => (finger = null));
  handlers.set(q.zoomBtn, () => {
    q.far = !q.far;
    q.zoomBtn.textContent = q.far ? "+" : "−";
    layout();
  });
}

/** where the last press began: a menu that opens under a finger must not take that press's tap */
let pressedOn: EventTarget | null = null;
document.addEventListener("pointerdown", (e) => { pressedOn = e.target; }, true);
// Buttons fire on pointerdown so both players can press at the same moment.
document.addEventListener("pointerdown", (e) => {
  unlockAudio();
  setMuted(!sim.sound);
  const b = (e.target as Element).closest("#stage button");
  if (b?.closest("#overlay")) return;
  const fn = b && handlers.get(b);
  if (!fn) return;
  e.preventDefault();
  fn();
  sim.uiDirty = true;
});
document.addEventListener("pointerup", () => resumeAudio());
// no long-press menus, except where codes are pasted
document.addEventListener("contextmenu", (e) => { if (!(e.target as Element).closest("input,textarea")) e.preventDefault(); });

function button(label: string, fn: () => void, sub = "", cls = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.innerHTML = `<b>${label}</b>${sub ? `<small>${sub}</small>` : ""}`;
  handlers.set(b, fn);
  // keyboard activation (pointer presses are handled above)
  b.addEventListener("click", (e) => {
    if (b.closest("#overlay")) {
      if (e.detail !== 0 && pressedOn && !b.contains(pressedOn as Node)) return;
      fn();
      sim.uiDirty = true;
    } else if (e.detail === 0) fn();
  });
  return b;
}

const cost = (c: Cost) => Object.entries(c).map(([k, v]) => `<i class="${k}">${v}${k[0]!.toUpperCase()}</i>`).join(" ");

function hud(p: PlayerId, s: SideSnap) {
  const q = panels[p]!;
  const idle = sim.units.filter((u) => u.owner === p && (u.kind === "villager" || u.kind === "fisher") && u.order.t === "idle").length;
  const resKey = [s.food, s.wood, s.gold, s.stone, s.pop, s.cap, s.army, s.armyCap, s.age].join();
  if (resKey !== q.resKey) {
    q.resKey = resKey;
    q.res.innerHTML =
      (["food", "wood", "gold", "stone"] as const).map((k) => `<span><i class="${k}">${k}</i> ${s[k]}</span>`).join("") +
      `<span title="Folk / room in homes"><i>folk</i> ${s.pop}/${s.cap}</span><span title="soldiers / room in barracks"><i>army</i> ${s.army}/${s.armyCap}</span><span class="age" title="${AGES[s.age]} age">${"I".repeat(s.age)}</span>`;
  }
  const b = sim.buildings.find((o) => o.id === sim.sel[p].building);
  const folkPicked = !s.place && (s.sel === "folk" || s.sel === "mix");
  if (!folkPicked && !s.place) q.cat = -1;
  // picking something on the map closes the list of allies
  if (s.place || s.selCount || b) q.diplo = false;
  if (q.ups !== (b?.id ?? 0)) q.ups = 0;
  if (q.mktOf !== (b?.id ?? 0)) {
    q.mkt = 0;
    q.mktOf = b?.id ?? 0;
  }
  // each building offers the first upgrade of every chain that is not finished yet
  const upgrades = b && b.owner === p
    ? (Object.keys(TECHS) as TechKind[]).filter((k) => {
        const t = TECHS[k];
        if (t.at !== b.kind) return false;
        if (t.after && !sim.tech[p].includes(t.after)) return false;
        return !(sim.tech[p].includes(k) && (Object.values(TECHS).some((n) => n.after === k) || k === "age3"));
      })
    : [];
  const upsView = !!b && b.progress >= 1 && upgrades.length > 0 && b.kind !== "town" && (!s.train.length || q.ups === b.id);
  let info = "Tap one of your people. Drag the map to look around.";
  if (s.place) info = s.placeReason;
  else if (b) {
    info = `${s.selName} · health ${s.hp}`;
    if (b.progress < 1) info += ` · ${Math.floor(b.progress * 100)}% built`;
    else if (b.research) info += ` · ${TECHS[b.research.tech].name} in ${Math.ceil(b.research.left)}s`;
    else if (b.queue.length) info += ` · training ${b.queue.length}, next ${Math.ceil(b.queue[0]!.left)}s`;
    else if (upsView) info = upgrades.filter((k) => !sim.tech[p].includes(k)).map((k) => `${TECHS[k].name}: ${TECHS[k].effect}`).join(" · ") || `${s.selName}: every upgrade done`;
    else if (b.kind === "town") {
      const next = upgrades.find((k) => !sim.tech[p].includes(k));
      if (next) {
        const missing = TECHS[next].needs && !TECHS[next].needs!.some((k) => hasComplete(sim, p, k));
        info = `${AGES[s.age]} age. ${TECHS[next].name} ${missing ? `needs a ${TECHS[next].needs!.map((k) => BUILDINGS[k].name.toLowerCase()).join(" or ")}` : TECHS[next].effect}`;
        info += b.rally ? ". Tap the Hall to clear the flag." : ". Tap the map: new Folk go there.";
      } else info = `Castle age · health ${s.hp}`;
    } else if (b.upgrade) info += ` · becoming a manor, ${Math.ceil(b.upgrade.left)}s`;
    else if (b.kind === "market") {
      const prices = GOODS.map((g) => {
        const each = quote(sim, p, g);
        return `${g} ${each.buy}/${each.sell}`;
      }).join(" · ");
      info = q.mkt === 1 ? "Sell 100 at a time for gold. The more you sell, the less it fetches." : q.mkt === 2 ? "Buy 100 at a time with gold. The more you buy, the dearer it gets." : `Gold for 100, buy/sell: ${prices}`;
    } else if (b.kind === "castle") info += ` · houses ${BUILDINGS.castle.pop} Folk and ${BUILDINGS.castle.room} soldiers`;
    else if (b.kind === "barracks" && !b.queue.length) info += ` · houses ${BUILDINGS.barracks.room} soldiers`;
    else if (b.kind === "house" || b.kind === "manor") info += ` · houses ${BUILDINGS[b.kind].pop}${b.kind === "house" ? ` · a manor houses ${BUILDINGS.manor.pop}` : ""}`;
    else if (b.kind === "gate") info += " · only your people pass";
    else if (BUILDINGS[b.kind].trains?.length) info += b.rally ? " · tap the map to move the flag, or this building to clear it" : " · tap the map to choose where new units go";
  } else if (s.selCount) {
    const todo = {
      folk: "tap a resource, a damaged building or the ground", boats: "tap fish or water", host: "tap an enemy or where to go", mix: "tap where to go", none: "", hall: "",
      carrier: s.load ? "tap a shore to land them" : "pick your people, then tap this boat to board",
    };
    info = s.hold ? `${s.selName} · ${s.load}/${s.hold} aboard · ${s.load ? "tap a shore to land them" : todo[s.sel]}` : `${s.selName} · ${todo[s.sel]}`;
  } else if (q.diplo) info = "Allies don't fight, share what they see and can win together.";
  // upgrade effects and age advice may need a second line
  const tall = !!b && !s.place && (upsView || b.kind === "town" || b.kind === "market") && !b.research && !b.queue.length && b.progress >= 1;
  q.info.classList.toggle("tall", tall);
  if (q.info.textContent !== info) q.info.textContent = info;
  q.toast.textContent = s.note;
  q.toast.hidden = !s.note;

  const can = (c: Cost) => (canAfford(sim.res[p], c) ? "" : "poor");
  const open = (k: BuildingKind) => { const n = BUILDINGS[k].need; return BUILDINGS[k].age <= s.age && (!n || hasComplete(sim, p, n)); };
  const lockedWhy = (k: BuildingKind) => (BUILDINGS[k].age > s.age ? `${AGES[BUILDINGS[k].age]} age` : `needs ${BUILDINGS[BUILDINGS[k].need!].name}`);
  const shown: Cost[] = [
    ...(q.cat >= 0 ? BUILD_MENU[q.cat]!.kinds.map((k) => BUILDINGS[k].cost) : []),
    ...s.train.map((k) => unitCost(sim, p, k)),
    ...upgrades.map((k) => TECHS[k].cost),
    ...(s.place ? [BUILDINGS[s.place].cost] : []),
  ];
  const others = IDS.slice(0, sim.count).filter((o) => o !== p && !sim.out[o]);
  /** where things stand with another player: the button's second line and its look */
  const relation = (o: PlayerId): [string, string] => {
    const ending = sim.breaks.find((k) => (k.a === p && k.b === o) || (k.a === o && k.b === p));
    if (ending) return [`ends in ${Math.ceil(ending.t)}s`, "danger"];
    if (allied(sim, p, o)) return ["allied · end?", "go"];
    if (sim.offers[o] & (1 << p)) return ["accept?", "alert"];
    if (sim.offers[p] & (1 << o)) return ["asked · undo", ""];
    return ["ask to ally", ""];
  };
  function sentries() {
    const army = sim.sel[p].units.map((id) => sim.units.find((u) => u.id === id)).filter((u) => u && u.kind !== "villager" && u.kind !== "ram" && u.kind !== "fisher" && u.kind !== "transport");
    const on = army.filter((u) => u!.sentry).length;
    return !army.length || !on ? "none" : on === army.length ? "all" : "some";
  }
  const key = [
    q.diplo, q.diplo ? others.map((o) => `${o}${relation(o)[0]}${sim.ai[o]}`).join() : "",
    s.load > 0, s.place, s.anchored, s.sel, s.building, sim.sel[p].building, s.train.join(), s.hunt, q.cat, q.ups, s.age,
    q.mkt, b?.kind === "market" ? GOODS.map((g) => Math.round(sim.prices[p][g])).join() + sim.res[p].gold : "",
    upgrades.map((k) => `${k}${techBlock(sim, p, k)}`).join(), shown.map(can).join(),
    q.cat >= 0 ? BUILD_MENU[q.cat]!.kinds.map(open).join() : "", b && b.progress >= 1, sim.tech[p].join(),
    b?.kind, !!b?.upgrade, sentries(),
    q.sure === sim.sel[p].building && performance.now() - q.sureAt < 3000,
  ].join("|");
  if (key !== q.actionKey) {
    q.actionKey = key;
    const list: HTMLElement[] = [];
    const redo = () => (q.actionKey = "");
    if (s.place) {
      const spec = BUILDINGS[s.place];
      list.push(button(`${spec.name}`, () => {}, `${cost(spec.cost)}${spec.wall && s.place !== "gate" ? " each" : ""}`, `label ${can(spec.cost)}`));
      if (s.anchored) list.push(button("New line", () => { send(p, { t: "newline" }); redo(); }, "start elsewhere"));
      list.push(button("Done", () => send(p, { t: "build", kind: null }), "", "go"));
    } else if (b && b.owner === p) {
      const upgradeButton = (k: TechKind) => {
        const t = TECHS[k];
        const no = techBlock(sim, p, k);
        const sub = no === "Done" ? "done ✓" : no === "Under way" ? "working…" : t.age > s.age ? `${AGES[t.age]} age` : cost(t.cost);
        const aging = k === "age2" || k === "age3";
        return button(aging ? `▲ ${t.name}` : t.name, () => send(p, { t: "research", tech: k }), sub, no ? "poor" : can(t.cost) || (aging ? "go" : ""));
      };
      if (b.progress >= 1 && b.kind === "market") {
        // the market: a page to sell, a page to buy
        if (q.mkt === 0) {
          list.push(button("Sell ▸", () => { q.mkt = 1; redo(); }, "goods for gold"));
          list.push(button("Buy ▸", () => { q.mkt = 2; redo(); }, "goods with gold"));
        } else {
          const buy = q.mkt === 2;
          list.push(button("◂", () => { q.mkt = 0; redo(); }, "", "x"));
          for (const g of GOODS) {
            const price = quote(sim, p, g);
            const able = buy ? sim.res[p].gold >= price.buy : sim.res[p][g] >= 100;
            list.push(button(`${buy ? "Buy" : "Sell"} ${g}`, () => send(p, { t: "trade", good: g, buy }), buy ? `100 for ${price.buy} gold` : `100 → ${price.sell} gold`, able ? "" : "poor"));
          }
        }
      } else if (b.progress >= 1) {
        if (upsView) {
          if (s.train.length) list.push(button("◂", () => { q.ups = 0; redo(); }, "", "x"));
          list.push(...upgrades.map(upgradeButton));
        } else {
          for (const k of s.train as UnitKind[]) {
            const spec = UNITS[k];
            const locked = spec.age > s.age;
            const name = b.kind === "dock" ? spec.name.replace(/ (boat|ship)$/i, "") : `Train ${spec.name}`;
            const price = unitCost(sim, p, k);
            list.push(button(name, () => send(p, { t: "train", kind: k }), locked ? `${AGES[spec.age]} age` : cost(price), locked ? "poor" : can(price)));
          }
          if (b.kind === "town") list.push(...upgrades.map(upgradeButton));
          else if (upgrades.length) list.push(button("Upgrades", () => { q.ups = b.id; redo(); }, "▸", upgrades.some((k) => !techBlock(sim, p, k) && canAfford(sim.res[p], TECHS[k].cost)) ? "alert" : ""));
        }
      }
      if (b.kind === "house" && b.progress >= 1) {
        const spec = BUILDINGS.manor;
        if (b.upgrade) list.push(button("Becoming a manor", () => {}, "under way", "label"));
        else {
          const locked = spec.age > s.age;
          list.push(button("Enlarge to Manor", () => send(p, { t: "enlarge" }), locked ? `${AGES[spec.age]} age` : `houses ${spec.pop} · ${cost(spec.cost)}`, locked ? "poor" : can(spec.cost)));
        }
      }
      if (b.kind !== "town" && !(upsView && s.train.length)) {
        // tearing down a finished building takes a second press, so it cannot happen by accident
        const sure = q.sure === b.id && performance.now() - q.sureAt < 3000;
        const id = b.id;
        list.push(button(b.progress < 1 ? "Cancel build" : sure ? "Tap again" : "Demolish", () => {
          if (b.progress < 1 || (q.sure === id && performance.now() - q.sureAt < 3000)) {
            q.sure = 0;
            send(p, { t: "demolish" });
          } else {
            q.sure = id;
            q.sureAt = performance.now();
            redo();
            setTimeout(redo, 3100);
          }
        }, b.progress < 1 ? "refund" : sure ? "to tear it down" : b.kind === "farm" ? "remove field" : "tear down", "danger"));
      }
    } else if (folkPicked) {
      if (q.cat < 0) {
        BUILD_MENU.forEach((m, i) => list.push(button(`${m.name} ▸`, () => { q.cat = i; redo(); }, m.hint)));
      } else {
        list.push(button("◂", () => { q.cat = -1; redo(); }, "", "x"));
        for (const k of BUILD_MENU[q.cat]!.kinds) {
          const spec = BUILDINGS[k];
          const ok = open(k);
          list.push(button(spec.name, () => {
            send(p, ok ? { t: "build", kind: k } : { t: "locked", kind: k });
          }, ok ? cost(spec.cost) : lockedWhy(k), ok ? can(spec.cost) : "poor"));
        }
      }
    } else if (s.sel === "host") {
      list.push(button(`Attack-move: ${s.hunt ? "ON" : "OFF"}`, () => send(p, { t: "hunt" }), "fight enemies met on the way", s.hunt ? "go" : ""));
      const on = sentries() === "all";
      list.push(button(`Sentry: ${on ? "ON" : sentries() === "some" ? "SOME" : "OFF"}`, () => send(p, { t: "sentry" }), "defend what is nearby", on ? "go" : ""));
    } else if (s.load) {
      list.push(button("Land everyone", () => send(p, { t: "unload" }), "at the nearest shore", "go"));
    } else if (q.diplo && !s.selCount) {
      list.push(button("◂", () => { q.diplo = false; redo(); }, "", "x"));
      for (const o of others) {
        const [text, cls] = relation(o);
        const them = button(SEATS[o].name, () => { send(p, { t: "ally", who: o }); redo(); }, text, cls);
        them.style.borderBottom = `4px solid ${SEATS[o].main}`;
        list.push(them);
      }
    }
    q.actions.classList.toggle("many", list.length > 4);
    q.actions.replaceChildren(...list);
  }
  const asking = others.some((o) => sim.offers[o] & (1 << p));
  const allying = sim.count > 2 && !sim.out[p];
  const groupKey = `${idle}|${s.ships > 0}|${allying}|${asking}`;
  if (groupKey !== q.groupKey) {
    q.groupKey = groupKey;
    const group = (which: Group) => () => { q.cat = -1; q.diplo = false; q.actionKey = ""; send(p, { t: "group", which }); };
    q.groups.classList.toggle("many", allying && s.ships > 0);
    q.groups.replaceChildren(
      button("All Folk", group("folk")),
      button(`Idle ${idle}`, group("idle"), "", idle ? "alert" : ""),
      button("Army", group("host")),
      ...(s.ships ? [button("Fleet", group("fleet"))] : []),
      button("Hall", () => {
        send(p, { t: "hall" });
        focusHall(sim, p);
      }),
      ...(allying ? [button("Allies", () => { send(p, { t: "clear" }); q.cat = -1; q.diplo = !q.diplo; q.actionKey = ""; }, "", asking ? "alert" : "")] : []),
      button("✕", () => { q.diplo = false; q.actionKey = ""; send(p, { t: "clear" }); }, "", "x"),
    );
  }
}

/** how the last game was set up, so Rematch can repeat it */
let lastGame: { mode: Mode; count: number; setup: Setup } = { mode: "duel", count: 2, setup: {} };

function resetPanels() {
  for (const q of panels) {
    q.actionKey = q.resKey = q.groupKey = "";
    q.cat = -1;
    q.ups = 0;
    q.diplo = false;
    q.far = false;
    q.zoomBtn.textContent = "−";
  }
  screenKey = "";
  page = "home";
  lobbyCard = null;
  layout();
  for (const p of IDS) if (seated(p)) focusHall(sim, p);
  sim.needFocus = false;
  sim.uiDirty = true;
}

function start(mode: Mode, count: number, setup: Setup = {}) {
  lastGame = { mode, count, setup };
  if (mode !== "online") me = 0;
  newGame(count);
  begin(sim, mode, count, setup);
  resetPanels();
  for (const r of remotes) {
    r.memory = memory(sim);
    r.link.send(startMessage(sim, r.seat));
  }
}

/** The computers take peoples nobody picked, then repeat. */
function stylesFor(count: number, mine: number[]) {
  const out = mine.slice();
  const spare = [0, 1, 2, 3].filter((s) => !mine.includes(s));
  for (let i = out.length; i < count; i++) out.push(spare[i - mine.length] ?? i % 4);
  return out;
}

function leaveOnline() {
  for (const r of remotes) {
    r.link.send({ t: "bye" });
    r.link.onClose = () => {};
    // give the goodbye a moment to leave
    setTimeout(() => r.link.close(), 300);
  }
  remotes = [];
  if (hostLink) {
    hostLink.onClose = () => {};
    hostLink.close();
    hostLink = null;
  }
}

function toMenu(message = "") {
  leaveOnline();
  sim.phase = "menu";
  sim.mode = null;
  me = 0;
  // a joined or five-player game may have changed the map: bring back our own
  loadPlayers(2);
  notice = message;
  page = "home";
  lobbyCard = null;
  screenKey = "";
  layout();
}

function hostStart(plan: HostPlan) {
  const people = 1 + plan.guests.length;
  const count = people + plan.computers;
  me = 0;
  remotes = plan.guests.map((g, i) => ({ link: g.link, seat: (i + 1) as PlayerId, memory: memory(sim) }));
  for (const r of remotes) {
    r.link.onMessage = (m) => {
      if (m.t !== "cmd" || !m.c) return;
      if (m.c.t === "pause") { togglePause(sim); flush(); }
      else act(sim, r.seat, m.c);
    };
    r.link.onClose = () => {
      remotes = remotes.filter((o) => o !== r);
      if (sim.phase === "menu" || r.seat >= sim.count) return;
      sim.ai[r.seat] = true;
      lastGame.setup.ai![r.seat] = true;
      for (const p of IDS) sim.note[p] = { text: `${SEATS[r.seat].name} left. The computer takes over.`, t: 5 };
    };
  }
  const ai = Array.from({ length: count }, (_, p) => p >= people);
  const styles = stylesFor(count, [plan.style, ...plan.guests.map((g) => g.style)]);
  start("online", count, { ai, styles, level: plan.level });
}

function guestStart(link: Link, first: any) {
  hostLink = link;
  const open = (m: any) => {
    me = (Number(m.you) | 0) as PlayerId;
    applyStart(sim, m);
    resetPanels();
    needFocus = true;
  };
  link.onMessage = (m) => {
    if (m.t === "s") {
      applySnapshot(sim, m, me);
      // the view can only be centred once our hall has arrived
      if (needFocus && sim.buildings.some((b) => b.owner === me)) {
        needFocus = false;
        focusHall(sim, me);
      }
    } else if (m.t === "start") open(m);
    else if (m.t === "bye") toMenu("The host ended the game.");
  };
  link.onClose = () => toMenu("The connection to the host was lost.");
  open(first);
}
let needFocus = false;

/** sounds made since the last update to the other devices */
let heard: string[] = [];
function flush() {
  for (const r of remotes) {
    // a slow connection skips an update; the next one carries everything that changed
    if (r.link.backlog() < 250_000) r.link.send(snapshot(sim, r.seat, r.memory, heard));
  }
  heard = [];
}

/** A castle flying every player's banner, for the home page. */
const EMBLEM = (() => {
  const flag = (x: number, y: number, c: string, tall = 16) =>
    `<rect x="${x - 1}" y="${y - tall}" width="2" height="${tall}" fill="#3b2514"/><path d="M${x + 1} ${y - tall}q8 -2 15 1t13 -1v9q-7 3 -13 0t-15 1z" fill="${c}"/>`;
  const teeth = (x0: number, x1: number, y: number) => {
    let out = "";
    for (let x = x0; x < x1 - 4; x += 9) out += `<rect x="${x}" y="${y}" width="6" height="7" fill="#b9bdb3"/>`;
    return out;
  };
  return `<svg class="emblem" viewBox="0 -12 240 140" role="img" aria-label="A castle flying the players' banners">
<ellipse cx="120" cy="118" rx="118" ry="16" fill="#3b6b2a"/><ellipse cx="120" cy="114" rx="96" ry="10" fill="#4f8a36"/>
<rect x="66" y="60" width="108" height="50" fill="#9aa098"/><rect x="140" y="60" width="34" height="50" fill="#7f857e"/>${teeth(66, 176, 53)}
<rect x="50" y="38" width="30" height="72" fill="#a9aea5"/><rect x="70" y="38" width="10" height="72" fill="#868c85"/>${teeth(48, 84, 31)}
<rect x="160" y="38" width="30" height="72" fill="#a9aea5"/><rect x="180" y="38" width="10" height="72" fill="#868c85"/>${teeth(158, 194, 31)}
<rect x="100" y="24" width="40" height="86" fill="#b0b5ab"/><rect x="126" y="24" width="14" height="86" fill="#8d938b"/>${teeth(98, 144, 17)}
<path d="M108 110v-20a12 12 0 0 1 24 0v20z" fill="#2a1d12"/><path d="M111 92h18M111 98h18M111 104h18M115 84v26M120 81v29M125 84v26" stroke="#6b5434" stroke-width="1.6"/>
<rect x="117" y="40" width="6" height="12" rx="3" fill="#2a1d12"/><rect x="62" y="56" width="5" height="10" rx="2.5" fill="#2a1d12"/><rect x="173" y="56" width="5" height="10" rx="2.5" fill="#2a1d12"/>
${flag(65, 31, SEATS[0].main)}${flag(175, 31, SEATS[1].main)}${flag(120, 17, SEATS[3].main, 22)}${flag(86, 53, SEATS[2].main, 13)}${flag(154, 53, SEATS[4].main, 13)}
<path d="M34 112l14 -46M42 114l14 -46M37 101h9M40 90h9M43 79h9" stroke="#8a5a2b" stroke-width="2.4" stroke-linecap="round"/>
</svg>`;
})();

const HELP = `
<ol>
<li><b>Move around.</b> Drag the map, or touch the minimap to jump. − / + changes zoom.</li>
<li><b>Gather.</b> Tap a Folk (or <b>All Folk</b>), then trees, berries, gold or stone. Double-tap a unit to pick all of its kind. A Storehouse shortens long walks.</li>
<li><b>Build.</b> With Folk picked, choose a building and <b>tap the map where you want it</b>. Any clear ground works.</li>
<li><b>Walls.</b> Pick Palisade or Stone wall, tap a start, then tap again: the wall runs to that spot. Keep tapping for corners. Put a <b>Gate</b> on open ground or on your wall: only your people can pass.</li>
<li><b>Ages.</b> Tap your Hall to move from the <b>Village</b> to the <b>Town</b> age (needs a Barracks or Dock), then the <b>Castle</b> age (needs a Smithy). Each unlocks new buildings, units and upgrades.</li>
<li><b>Army.</b> Barracks (Levy). Town age: Range (Archer), Stable (fast Rider). Castle age: Workshop (Ram, to break walls and buildings).</li>
<li><b>Ships.</b> Build a <b>Dock</b> on any shore. Fishing boats gather fish and bring it to your Dock. <b>Galleys</b> (Town age) fight ships and shore targets. <b>Bombard ships</b> (Castle age) smash coastal buildings from far off.</li>
<li><b>Transports.</b> Build one at a Dock. Pick your people or army, then tap the Transport to board (10 places; a Ram takes 3). Pick the Transport and tap a far shore to land them, or press <b>Land everyone</b>.</li>
<li><b>Upgrades.</b> Tap a Storehouse, Smithy, Barracks, Range, Stable or Dock.</li>
<li><b>Repair</b> by picking Folk and tapping a damaged building.</li>
<li><b>Gathering point.</b> Tap a building that makes units, then tap the map: a flag shows where new units will go. Tap a tree, berries, gold, stone or one of your fields and new Folk start work there. Tap the building again to clear it.</li>
<li><b>Demolish</b> a building or field you no longer want: tap it, then press <b>Demolish</b> twice.</li>
<li><b>Castle age.</b> Once your Hall reaches the Castle age, Folk can build a <b>Market</b>, to buy and sell food, wood and stone for gold (handy when the map runs out of something), and a <b>Castle</b>: a fortress that makes Folk and soldiers, takes in anything gathered and keeps you in the game even if your Hall falls.</li>
<li><b>Housing.</b> Folk live in homes: your Hall houses 5, each Cottage 5, and in the Town age a Cottage can be enlarged into a <b>Manor</b> for 12. Soldiers and warships live in <b>Barracks</b>, 10 to each. Build more homes and barracks for more people; there is no other limit.</li>
<li><b>Soldiers fight back</b> against whatever hurts them. Turn on <b>Sentry</b> and they also run to defend buildings and people near their post that come under attack, then return to it.</li>
<li><b>Allies.</b> With 3 or more players, press <b>Allies</b> to ask, accept or end an alliance (ending one takes 10 seconds). Allies don't fight, share what they see, can pass each other's gates and can win together. You each need someone left to fight when you join up.</li>
<li><b>Win</b> by being the last side with a Hall or Castle standing.</li>
</ol>`;

let screenKey = "";
let editing = false;
type Page = "home" | "computer" | "shared" | "online" | "host" | "join";
let page: Page = "home";
let notice = "";
/** a lobby keeps its own screen while friends come and go */
let lobbyCard: HTMLElement | null = null;
// (saved settings keep the game's first name, so a rename loses nothing)
const KEEP = "two-halls-choices";
const choices = { computers: 1, level: 1, style: 0, players: 2, seats: [0, 1, 2, 3] };
try { Object.assign(choices, JSON.parse(localStorage.getItem(KEEP) ?? "{}")); } catch { /* start fresh */ }
const remember = () => { try { localStorage.setItem(KEEP, JSON.stringify(choices)); } catch { /* not saved */ } };

function go(to: Page) {
  page = to;
  notice = "";
  lobbyCard = null;
  remember();
  screenKey = "";
  overlay.scrollTop = 0;
}
const redraw = () => { remember(); screenKey = ""; };

function menuCard(): HTMLElement {
  if (page === "host") return (lobbyCard ??= hostLobby(button, hostStart, () => go("online")));
  if (page === "join") return (lobbyCard ??= joinLobby(button, guestStart, () => go("online")));
  const card = document.createElement("div");
  card.className = "card";
  const heading = (text: string) => {
    const h = document.createElement("h2");
    h.textContent = text;
    card.append(h);
  };
  const para = (text: string) => {
    const el = document.createElement("p");
    el.textContent = text;
    card.append(el);
  };
  if (page === "computer") {
    heading("Play the computer");
    card.append(
      chips(button, "Computers", Array.from({ length: MAX_SEATS - 1 }, (_, i) => String(i + 1)), choices.computers - 1, (i) => { choices.computers = i + 1; redraw(); }),
      chips(button, "Difficulty", [...LEVELS], choices.level, (i) => { choices.level = i; redraw(); }),
    );
    para(["Slow to act and gathers less. Says yes to alliances.", "A fair fight.", "Quick, builds a big army and gathers 30% faster than you."][choices.level]!);
    card.append(stylePicker(button, choices.style, (i) => { choices.style = i; redraw(); }));
    if (choices.computers > 3) {
      const least = bigMin(choices.computers + 1);
      para(`${choices.computers + 1} halls need a map at least ${least.w}×${least.h}. A smaller map is stretched for this game.${choices.computers > 5 ? " Many computers are hard work for a phone; a tablet or computer copes best." : ""}`);
    }
    card.append(button("Start", () => {
      const count = choices.computers + 1;
      start("solo", count, { styles: stylesFor(count, [choices.style]), level: choices.level });
    }, "", "go"), button("Back", () => go("home")));
    return card;
  }
  if (page === "shared") {
    const big = bigScreen();
    if (!big) choices.players = 2;
    heading("Share one screen");
    card.append(chips(button, "Players", ["2", "3", "4"], choices.players - 2, (i) => {
      if (i === 0 || big) { choices.players = i + 2; redraw(); }
    }));
    para(big ? "Two sit at each end of the screen." : "3 and 4 players need an iPad or another screen that size.");
    for (let seat = 0; seat < choices.players; seat++) {
      const pickStyle = stylePicker(button, choices.seats[seat]!, (i) => { choices.seats[seat] = i; redraw(); }, `${SEATS[seat]!.name}'s people`);
      pickStyle.style.borderColor = SEATS[seat]!.main;
      card.append(pickStyle);
    }
    card.append(button("Start", () => start("duel", choices.players, { styles: choices.seats.slice(0, choices.players) }), "", "go"), button("Back", () => go("home")));
    return card;
  }
  if (page === "online") {
    heading("Play on your own devices");
    para(`One device hosts and runs the game. Everyone else joins from theirs, up to ${MAX_SEATS} players counting computers. Best with all devices on the same Wi-Fi or hotspot.`);
    card.append(button("Host a game", () => go("host"), "", "go"), button("Join a game", () => go("join")), button("Back", () => go("home")));
    return card;
  }
  card.innerHTML = `${EMBLEM}<h1 class="title">Siege Party</h1><p class="motto">Gather, build and march to war</p>`;
  if (notice) para(notice);
  card.append(
    button("Play the computer", () => go("computer"), `against 1 to ${MAX_SEATS - 1}`, "go"),
    button("Share one screen", () => go("shared"), "2 to 4 players", "go"),
    button("Play on your own devices", () => go("online"), `local online, up to ${MAX_SEATS}`, "go"),
    mapPicker(button, () => { screenKey = ""; }),
    button("Map maker", () => { editing = true; redraw(); }, `make your own · now playing on: ${mapName()}`),
    sizePicker({ button, limits: SIZE, current: mapSize, choose: chooseSize }), soundButton(),
  );
  const how = document.createElement("div");
  how.innerHTML = HELP;
  card.append(how);
  return card;
}

const soundButton = () => button(`Sound: ${sim.sound ? "on" : "off"}`, () => { sim.sound = !sim.sound; setMuted(!sim.sound); screenKey = ""; });

function drawOverlay() {
  const want = sim.phase === "play" ? "" : sim.phase;
  const key = `${want}|${sim.sound}|${sim.winner}|${editing}|${page}`;
  if (key === screenKey) return;
  screenKey = key;
  const scroll = overlay.scrollTop;
  overlay.hidden = !want;
  overlay.className = want;
  overlay.replaceChildren();
  if (!want) return;
  if (want === "menu" && editing) {
    overlay.append(mapEditor({ button, bigScreen: bigScreen(), close: () => { editing = false; screenKey = ""; } }));
    return;
  }
  if (want === "menu") {
    overlay.append(menuCard());
    overlay.scrollTop = scroll;
    return;
  }
  const card = document.createElement("div");
  card.className = "card";
  if (want === "pause") {
    card.innerHTML = `<h2>Paused</h2>`;
    card.append(button("Resume", () => pause(), "", "go"));
    if (!hostLink) card.append(button("Restart", () => start(lastGame.mode, lastGame.count, lastGame.setup)));
    card.append(button(sim.mode === "online" ? (hostLink ? "Leave the game" : "End the game for everyone") : "Main menu", () => toMenu()), soundButton());
  } else {
    const won = (p: PlayerId) => !!(sim.winners & (1 << p));
    const verdict = (p: PlayerId) => (won(p) ? "Victory!" : sim.winner === -1 && sim.mode !== "solo" && !sim.ai.some(Boolean) ? "Draw" : "Defeat");
    const names = IDS.filter(won).map((p) => SEATS[p].name);
    const line = names.length ? `${names.join(" & ")} ${names.length > 1 ? "win" : "wins"}!` : "Nobody wins";
    if (!shared()) card.innerHTML = `<h2>${verdict(me)}</h2>${names.length > 1 || !won(me) ? `<p>${line}</p>` : ""}`;
    else if (sim.count === 2) card.innerHTML = `<h2 class="flip">${verdict(1)}</h2><h2>${verdict(0)}</h2>`;
    else card.innerHTML = `<h2 class="flip">${line}</h2><h2>${line}</h2>`;
    if (hostLink) {
      const wait = document.createElement("p");
      wait.textContent = "The host can start a rematch.";
      card.append(wait);
    } else card.append(button("Rematch", () => start(lastGame.mode, lastGame.count, lastGame.setup), "", "go"));
    card.append(button("Main menu", () => toMenu()));
  }
  overlay.append(card);
}

function pause() {
  if (hostLink) hostLink.send({ t: "cmd", c: { t: "pause" } });
  else {
    togglePause(sim);
    flush();
  }
}

handlers.set($("#pause"), pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && sim.phase === "play" && !hostLink) pause();
});
let resizeQueued = false;
window.addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; layout(); });
});

if (typeof ResizeObserver !== "undefined") {
  const watch = new ResizeObserver(() => {
    if (panels.some((q) => seated(q.p) && (q.canvas.parentElement!.clientWidth !== q.w || q.canvas.parentElement!.clientHeight !== q.h))) layout();
  });
  for (const q of panels) watch.observe(q.canvas.parentElement!);
}

let last = performance.now();
let hudAt = 0;
let netAt = 0;
let miniAt = 0;
let was = sim.phase;
function frame(now: number) {
  groundFrame();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (hostLink) guestTick(sim, dt);
  else for (let left = dt; left > 0; left -= 1 / 30) step(sim, Math.min(left, 1 / 30));
  soundscape(sim, IDS.filter((p) => seated(p) && p < sim.count), dt, sim.sound && sim.phase === "play");
  for (const name of sim.fxQueue.splice(0)) {
    if (remotes.length && heard.length < 6) heard.push(name);
    if (sim.sound) playSfx(name);
  }
  if (remotes.length && sim.phase !== "menu" && now - netAt > 100) {
    netAt = now;
    flush();
  }
  if (sim.phase === "end" && was !== "end" && sim.sound) playSfx(!shared() && !(sim.winners & (1 << me)) ? "lose" : "win");
  was = sim.phase;
  drawOverlay();
  if (sim.phase !== "menu") {
    for (const q of panels) {
      if (!seated(q.p)) continue;
      q.gone.hidden = !sim.out[q.p];
      q.root.classList.toggle("out", sim.out[q.p]);
      render(q.g, q.fg, sim, q.p, q.w, q.h, q.zoom, (u) => unitStats(sim, u.owner, u.kind).hp);
    }
    if (now - miniAt > 250) {
      miniAt = now;
      for (const q of panels) if (seated(q.p)) renderMini(q.mini.getContext("2d")!, sim, q.p);
    }
    if (sim.uiDirty || now - hudAt > 150) {
      hudAt = now;
      sim.uiDirty = false;
      const snap = takeSnap(sim);
      for (const p of IDS) if (seated(p)) hud(p, snap.players[p]);
    }
  }
  const mm = Math.floor(sim.clock / 60);
  $("#clock").textContent = `${mm}:${String(Math.floor(sim.clock % 60)).padStart(2, "0")}`;
  requestAnimationFrame(frame);
}
layout();
requestAnimationFrame(frame);
