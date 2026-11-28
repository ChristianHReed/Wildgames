/**
 * The map maker's preview in 3D: the finished map as a little board, with each player's Hall and
 * cottages where they will start, drawn by the same view the game uses. It can be zoomed and moved.
 */
import { COLS, SEATS, isNorth } from "../../game/content";
import { BASES, GRID, nodeSpawns, setMap } from "../../game/map";
import { createSim, type PlayerId, type Sim } from "../../game/sim";
import type { Bases } from "../../game/mapgen";
import { View3d } from "./view";

export class MapPreview {
  private view: View3d;
  private map: { grid: string[]; bases: Bases; players: number } | null = null;
  /** the board built for the map last shown, and that map */
  private board: Sim | null = null;
  private boardFor: string[] | null = null;
  private last = 0;
  private timer = 0;
  private frame = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.view = new View3d(canvas, 1, true);
  }

  /** Show this map; when asked often (while painting), the board is rebuilt a few times a second. */
  show(grid: string[], bases: Bases, players: number) {
    this.map = { grid, bases, players };
    if (this.timer) return;
    const wait = Math.max(0, 140 - (performance.now() - this.last));
    this.timer = window.setTimeout(() => {
      this.timer = 0;
      this.draw();
    }, wait);
  }

  /** Where the camera looks; drawn at the next frame. */
  look(k: number, x: number, y: number) {
    this.view.over = { k, x, z: y };
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.draw();
    });
  }

  private draw() {
    const job = this.map;
    if (!job || !this.canvas.isConnected || this.view.lost) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) {
      // not laid out yet: try again in a moment
      if (!this.timer)
        this.timer = window.setTimeout(() => {
          this.timer = 0;
          this.draw();
        }, 60);
      return;
    }
    this.view.resize(w, h, Math.min(2, window.devicePixelRatio || 1));
    // the view reads the map in play, so lend it this one while drawing
    const was = { grid: GRID, bases: BASES };
    setMap({ grid: job.grid, bases: job.bases as Bases });
    try {
      if (this.boardFor !== job.grid || !this.board) {
        this.last = performance.now();
        this.board = this.build(job.players);
        this.boardFor = job.grid;
      }
      this.view.render(this.board, 0, 0);
    } finally {
      setMap(was);
    }
  }

  private build(players: number): Sim {
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

  /** the spot of the ground under a point of the page, in tiles */
  pointAt(clientX: number, clientY: number): { x: number; y: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const g = this.view.ground(clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2));
    return g ? { x: g[0], y: g[1] } : null;
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    if (this.frame) cancelAnimationFrame(this.frame);
    this.timer = 0;
    this.frame = 0;
    this.map = null;
    this.view.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
