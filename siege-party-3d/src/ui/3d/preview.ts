/**
 * The map maker's preview in 3D: the finished map as a little board, with each player's Hall and
 * cottages where they will start, drawn by the same view the game uses.
 */
import { COLS, ROWS, SEATS, isNorth } from "../../game/content";
import { BASES, GRID, nodeSpawns, setMap } from "../../game/map";
import { createSim, type PlayerId, type Sim } from "../../game/sim";
import type { Bases } from "../../game/mapgen";
import { View3d } from "./view";

export class MapPreview {
  private view: View3d;
  private sim: Sim | null = null;
  private pending: { grid: string[]; bases: Bases; players: number } | null = null;
  private last = 0;
  private timer = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.view = new View3d(canvas, 1, true);
  }

  /** Show this map; when asked often (while painting), the board is rebuilt a few times a second. */
  show(grid: string[], bases: Bases, players: number) {
    this.pending = { grid, bases, players };
    if (this.timer) return;
    const wait = Math.max(0, 140 - (performance.now() - this.last));
    this.timer = window.setTimeout(() => {
      this.timer = 0;
      this.draw();
    }, wait);
  }

  /** draw again at the canvas's current size, as it is */
  private draw() {
    const job = this.pending;
    if (!job || !this.canvas.isConnected || this.view.lost) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) {
      // not laid out yet: try again in a moment
      this.timer = window.setTimeout(() => {
        this.timer = 0;
        this.draw();
      }, 60);
      return;
    }
    this.last = performance.now();
    this.view.resize(w, h, Math.min(2, window.devicePixelRatio || 1));
    // the view reads the map in play, so lend it this one while drawing
    const was = { grid: GRID, bases: BASES };
    setMap({ grid: job.grid, bases: job.bases as Bases });
    try {
      const sim = (this.sim = this.board(job.players));
      this.view.render(sim, 0, 0);
    } finally {
      setMap(was);
    }
  }

  private board(players: number): Sim {
    this.view.marks = [];
    this.view.flags = [];
    const sim = createSim();
    sim.count = players;
    let id = 1;
    for (const s of nodeSpawns()) sim.nodes.push({ id: id++, kind: s.kind, x: s.x, y: s.y, amount: s.amount, farm: false, sea: !!s.sea });
    const put = (owner: PlayerId, kind: "town" | "house", tx: number, ty: number) =>
      sim.buildings.push({ id: id++, owner, kind, tx, ty, hp: 1e6, progress: 1, queue: [], cd: 0, seen: 31, work: 0, research: null });
    for (let p = 0; p < players; p++) {
      const at = BASES[p];
      if (!at) continue;
      const owner = p as PlayerId;
      put(owner, "town", at.x, at.y);
      // a bright square and a tall flag, so each base is easy to find and drag
      const n = parseInt(SEATS[p]!.main.slice(1), 16);
      this.view.marks.push({ x: at.x - 1, z: at.y - 1, w: 5, h: 5, c: [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 0.8] });
      this.view.flags.push({ x: at.x + 1.5, z: at.y + (isNorth(owner) ? 3.6 : -0.6), owner, scale: Math.max(3, COLS / 11) });
      for (const dx of [-4, 5]) put(owner, "house", at.x + dx, isNorth(owner) ? at.y : at.y + 1);
    }
    for (const e of sim.explored) e.fill(1);
    for (const v of sim.visible) v.fill(1);
    sim.clock = 3;
    return sim;
  }

  /** the tile under a point of the page, or null off the board */
  tileAt(clientX: number, clientY: number): { x: number; y: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const g = this.view.ground(clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2));
    if (!g) return null;
    const x = Math.floor(g[0]);
    const y = Math.floor(g[1]);
    return x < 0 || y < 0 || x >= COLS || y >= ROWS ? null : { x, y };
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = 0;
    this.pending = null;
    this.view.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
