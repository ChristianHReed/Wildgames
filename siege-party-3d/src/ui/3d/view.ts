/**
 * One player's 3D view: a tilted camera over the board, sunlight with shadows, the ground, water,
 * everything standing on it, and marks on the ground. Each panel has its own canvas and GL context.
 */
import { BUILDINGS, COLS, ROWS, SEATS, UNITS, isNorth, type BuildingKind } from "../../game/content";
import { GRID } from "../../game/map";
import { ageOf, canSee, maxHp as fullHp, type Building, type PlayerId, type Sim, type Unit } from "../../game/sim";
import { invert, lookAt, mul, norm, ortho, perspective, program, project, type GL, type M4, type Prog, type Vec } from "./gl";
import { Mesh, STRIDE, hash } from "./mesh";
import {
  HORSE_PIVOT, PERSON_PIVOT, arrowModel, buildingModel, decorModel, fishModel, nodeModel, personModel, rallyModel, ramModel, riderModel,
  scaffold, shipModel, siteModel, stumpModel, treeModel,
} from "./models";
import * as S from "./shaders";
import { BOARD_Y, WATER_Y, buildDecor, buildGround, fieldOf, heightAt, type Chunk, type Decor, type Field } from "./terrain";

const FOV = (30 * Math.PI) / 180;
const PITCH = (47 * Math.PI) / 180;
const SUN = norm([-0.5, 0.82, 0.42]);
const SUN_COL: Vec = [0.7, 0.63, 0.52];
const SKY: Vec = [0.44, 0.49, 0.58];
const BOUNCE: Vec = [0.36, 0.34, 0.28];
const BG: Vec = [0.55, 0.72, 0.8];
const INST = 12;

// ── what is shared by every view: models built once, and the ground of the current map ──
type Model = { v: Float32Array; pivot: readonly number[]; height: number };
const models = new Map<string, Model>();
function model(key: string, make: () => Mesh, pivot: readonly number[] = [0, 0, 0, 0]): Model {
  let m = models.get(key);
  if (!m) {
    const mesh = make();
    const b = mesh.bounds();
    m = { v: new Float32Array(mesh.v), pivot, height: Number.isFinite(b.y1) ? b.y1 : 1 };
    models.set(key, m);
  }
  return m;
}

type World = { grid: unknown; cols: number; rows: number; field: Field; ground: Chunk[]; decor: Decor[] };
let world: World | null = null;
function worldNow(): World {
  if (!world || world.grid !== GRID || world.cols !== COLS || world.rows !== ROWS) {
    const field = fieldOf();
    world = { grid: GRID, cols: COLS, rows: ROWS, field, ground: buildGround(field), decor: buildDecor(field) };
  }
  return world;
}

/** does this browser give us what the 3D view needs? */
export function canRun3d() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    return !!gl && !!gl.getExtension && true;
  } catch {
    return false;
  }
}

type Batch = { m: Model; key: string; data: number[] };

export class View3d {
  readonly gl: GL;
  private prog: Record<"model" | "depth" | "ground" | "decor" | "water" | "sprite" | "decal", Prog>;
  private meshes = new Map<string, { vao: WebGLVertexArrayObject; buf: WebGLBuffer; count: number }>();
  private inst: WebGLBuffer;
  private instCap = 0;
  private instData = new Float32Array(INST * 1024);
  private groundVao: { vao: WebGLVertexArrayObject; n: number; c: Chunk }[] = [];
  private decorVao: { vao: WebGLVertexArrayObject; n: number; count: number; d: Decor }[] = [];
  private worldOf: World | null = null;
  private waterVao: WebGLVertexArrayObject;
  private waterBuf: WebGLBuffer;
  private quad: WebGLBuffer;
  private spriteVao: WebGLVertexArrayObject;
  private decalVao: WebGLVertexArrayObject;
  private fogTex: WebGLTexture;
  private shoreTex: WebGLTexture;
  private occTex: WebGLTexture;
  private fogBytes = new Uint8Array(0);
  private occBytes = new Uint8Array(0);
  private occKey = "";
  private shadowTex: WebGLTexture;
  private shadowFbo: WebGLFramebuffer;
  private shadowSize: number;
  private frame = 0;
  /** the camera of the last frame */
  vp: M4 = new Float32Array(16);
  inv: M4 = new Float32Array(16);
  eye: Vec = [0, 0, 0];
  w = 1;
  h = 1;
  /** css pixels per tile at the middle of the view */
  ppt = 32;
  lost = false;
  /** what the last frame drew: triangles and draw calls */
  stats = { tris: 0, calls: 0 };

  constructor(readonly canvas: HTMLCanvasElement, quality: number) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, depth: true, powerPreference: "high-performance", preserveDrawingBuffer: false });
    if (!gl) throw new Error("no webgl2");
    this.gl = gl;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
    });
    this.prog = {
      model: program(gl, S.MODEL_VS, S.MODEL_FS),
      depth: program(gl, S.DEPTH_VS, S.DEPTH_FS),
      ground: program(gl, S.GROUND_VS, S.GROUND_FS),
      decor: program(gl, S.DECOR_VS, S.DECOR_FS),
      water: program(gl, S.WATER_VS, S.WATER_FS),
      sprite: program(gl, S.SPRITE_VS, S.SPRITE_FS),
      decal: program(gl, S.DECAL_VS, S.DECAL_FS),
    };
    this.inst = gl.createBuffer()!;
    // the water: one wide sheet, far past the edges so the board sits in an open sea
    this.waterVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.waterVao);
    this.waterBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.waterBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    // corners for sprites and marks
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    this.spriteVao = this.cornerVao();
    this.decalVao = this.cornerVao();
    gl.bindVertexArray(null);
    const tex = (filter: number) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.fogTex = tex(gl.LINEAR);
    this.shoreTex = tex(gl.LINEAR);
    this.occTex = tex(gl.NEAREST);
    // the sun's view, for shadows
    this.shadowSize = quality >= 2 ? 2048 : 1536;
    this.shadowTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, this.shadowSize, this.shadowSize);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    this.shadowFbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowTex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private waterSheet() {
    const out: number[] = [];
    const M = 260;
    const y = WATER_Y;
    // a grid, so the far parts are cut into pieces the camera can clip
    const xs = [-M, -40, 0, COLS / 2, COLS, COLS + 40, COLS + M];
    const zs = [-M, -40, 0, ROWS / 4, ROWS / 2, (ROWS * 3) / 4, ROWS, ROWS + 40, ROWS + M];
    for (let j = 0; j + 1 < zs.length; j++)
      for (let i = 0; i + 1 < xs.length; i++) {
        const x0 = xs[i]!, x1 = xs[i + 1]!, z0 = zs[j]!, z1 = zs[j + 1]!;
        out.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z0, x1, y, z1, x0, y, z1);
      }
    return out;
  }

  private cornerVao() {
    const gl = this.gl;
    const v = gl.createVertexArray()!;
    gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    for (const l of [3, 4, 5]) {
      gl.enableVertexAttribArray(l);
      gl.vertexAttribDivisor(l, 1);
    }
    return v;
  }

  resize(w: number, h: number, scale: number) {
    this.w = w;
    this.h = h;
    const W = Math.max(1, Math.round(w * scale));
    const H = Math.max(1, Math.round(h * scale));
    if (this.canvas.width !== W || this.canvas.height !== H) {
      this.canvas.width = W;
      this.canvas.height = H;
    }
  }

  // ── the ground, set up again whenever the map changes ──
  private ensureWorld() {
    const wd = worldNow();
    if (this.worldOf === wd) return wd;
    const gl = this.gl;
    for (const g of this.groundVao) gl.deleteVertexArray(g.vao);
    for (const d of this.decorVao) gl.deleteVertexArray(d.vao);
    this.groundVao = wd.ground.map((c) => {
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      const b = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, c.v, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
      const ib = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, c.i, gl.STATIC_DRAW);
      return { vao, n: c.i.length, c };
    });
    this.decorVao = wd.decor.map((d) => {
      const m = model(`decor${d.kind}`, () => decorModel(d.kind));
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      const b = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, m.v, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE * 4, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, STRIDE * 4, 12);
      const ib = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, ib);
      gl.bufferData(gl.ARRAY_BUFFER, d.data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 32, 0);
      gl.vertexAttribDivisor(3, 1);
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 32, 16);
      gl.vertexAttribDivisor(4, 1);
      return { vao, n: m.v.length / STRIDE, count: d.data.length / 8, d };
    });
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.waterBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.waterSheet()), gl.STATIC_DRAW);
    // how far each spot of water is from land
    gl.bindTexture(gl.TEXTURE_2D, this.shoreTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, COLS, ROWS, 0, gl.RED, gl.UNSIGNED_BYTE, wd.field.shore);
    this.fogBytes = new Uint8Array(COLS * ROWS);
    this.occBytes = new Uint8Array(COLS * ROWS);
    gl.bindTexture(gl.TEXTURE_2D, this.fogTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, COLS, ROWS, 0, gl.RED, gl.UNSIGNED_BYTE, this.fogBytes);
    gl.bindTexture(gl.TEXTURE_2D, this.occTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, COLS, ROWS, 0, gl.RED, gl.UNSIGNED_BYTE, this.occBytes);
    this.occKey = "";
    this.worldOf = wd;
    return wd;
  }

  private meshOf(key: string, m: Model) {
    let r = this.meshes.get(key);
    if (r) return r;
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, m.v, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE * 4, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, STRIDE * 4, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, STRIDE * 4, 28);
    for (const l of [3, 4, 5]) {
      gl.enableVertexAttribArray(l);
      gl.vertexAttribDivisor(l, 1);
    }
    gl.bindVertexArray(null);
    r = { vao, buf, count: m.v.length / STRIDE };
    this.meshes.set(key, r);
    return r;
  }

  // ── the camera ──
  private camera(sim: Sim, p: PlayerId, zoom: number) {
    const north = isNorth(p);
    this.ppt = zoom * 32;
    const D = this.h / (2 * Math.tan(FOV / 2) * this.ppt);
    const s = sim.shake[p] * 0.08;
    const cx = sim.cam[p].x + (Math.random() - 0.5) * s;
    const cz = sim.cam[p].y + (Math.random() - 0.5) * s;
    const dz = (north ? -1 : 1) * D * Math.cos(PITCH);
    this.eye = [cx, D * Math.sin(PITCH), cz + dz];
    const view = lookAt(this.eye, [cx, 0, cz], [0, 1, 0]);
    const proj = perspective(FOV, this.w / this.h, Math.max(0.5, D * 0.25), D * 3.5 + 60);
    this.vp = mul(proj, view);
    this.inv = invert(this.vp);
  }

  /** where on the ground (y = h) a point of the view lands; x and y from the view's middle, in css pixels */
  ground(x: number, y: number, h = 0): [number, number] | null {
    const nx = (x / this.w) * 2;
    const ny = -(y / this.h) * 2;
    const a = project(this.inv, nx, ny, -1);
    const b = project(this.inv, nx, ny, 1);
    const dy = b[1] - a[1];
    if (Math.abs(dy) < 1e-6) return null;
    const t = (h - a[1]) / dy;
    if (t < 0) return null;
    return [a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /** a world point to css pixels from the view's top-left, or null behind the camera */
  screen(x: number, y: number, z: number): [number, number] | null {
    const c = project(this.vp, x, y, z);
    if (c[3] <= 0) return null;
    return [((c[0] + 1) / 2) * this.w, ((1 - c[1]) / 2) * this.h];
  }

  /** the tiles the view can see, with a margin for tall things */
  private reach() {
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => this.ground((sx! * this.w) / 2, (sy! * this.h) / 2) ?? [this.eye[0], this.eye[2]]);
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of pts) {
      x0 = Math.min(x0, x!); x1 = Math.max(x1, x!);
      z0 = Math.min(z0, z!); z1 = Math.max(z1, z!);
    }
    return { x0: Math.floor(x0 - 4), x1: Math.ceil(x1 + 4), z0: Math.floor(z0 - 4), z1: Math.ceil(z1 + 4), pts };
  }

  // ── a frame ──
  render(sim: Sim, p: PlayerId, zoom: number) {
    if (this.lost) return;
    const gl = this.gl;
    const wd = this.ensureWorld();
    this.frame++;
    this.camera(sim, p, zoom);
    const r = this.reach();
    const batches = this.collect(sim, p, r);
    this.updateFog(sim, p);
    this.updateOcc(sim);

    // fill the instance buffer once for both passes
    let total = 0;
    for (const b of batches.values()) total += b.data.length;
    if (this.instData.length < total) this.instData = new Float32Array(Math.ceil(total * 1.5));
    let off = 0;
    const offsets = new Map<string, number>();
    for (const [k, b] of batches) {
      offsets.set(k, off);
      this.instData.set(b.data, off);
      off += b.data.length;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.inst);
    if (total > this.instCap) {
      this.instCap = Math.ceil(total * 1.5);
      gl.bufferData(gl.ARRAY_BUFFER, this.instCap * 4, gl.DYNAMIC_DRAW);
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instData, 0, total);

    // the sun's view: fit round what the camera sees
    const cx = (r.x0 + r.x1) / 2;
    const cz = (r.z0 + r.z1) / 2;
    const lview = lookAt([cx + SUN[0] * 40, SUN[1] * 40, cz + SUN[2] * 40], [cx, 0, cz], [0, 1, 0]);
    let lx0 = Infinity, lx1 = -Infinity, ly0 = Infinity, ly1 = -Infinity;
    for (const [x, z] of r.pts) for (const y of [0, 3]) {
      const q = project(lview, x!, y, z!);
      lx0 = Math.min(lx0, q[0]); lx1 = Math.max(lx1, q[0]);
      ly0 = Math.min(ly0, q[1]); ly1 = Math.max(ly1, q[1]);
    }
    const pad = 2.5;
    const span = Math.max(lx1 - lx0, ly1 - ly0) + pad * 2;
    const texel = span / this.shadowSize;
    const mx = Math.round((lx0 + lx1) / 2 / texel) * texel;
    const my = Math.round((ly0 + ly1) / 2 / texel) * texel;
    const lvp = mul(ortho(mx - span / 2, mx + span / 2, my - span / 2, my + span / 2, 5, 90), lview);

    const team = new Float32Array(36);
    for (let i = 0; i < 6; i++) {
      const s = SEATS[i];
      const c = s ? [s.main, s.light] : ["#e8e4dc", "#ffffff"];
      for (let k = 0; k < 2; k++) {
        const n = parseInt(c[k]!.slice(1), 16);
        team[(i * 2 + k) * 3] = ((n >> 16) & 255) / 255;
        team[(i * 2 + k) * 3 + 1] = ((n >> 8) & 255) / 255;
        team[(i * 2 + k) * 3 + 2] = (n & 255) / 255;
      }
    }

    const drawBatches = (pr: Prog, vp: M4) => {
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u("uVP"), false, vp);
      gl.uniform3fv(pr.u("uTeam"), team);
      for (const [k, b] of batches) {
        const mesh = this.meshOf(b.key, b.m);
        gl.bindVertexArray(mesh.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.inst);
        const o = offsets.get(k)! * 4;
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, INST * 4, o);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, INST * 4, o + 16);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, INST * 4, o + 32);
        gl.uniform4fv(pr.u("uPivot"), b.m.pivot as number[]);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, mesh.count, b.data.length / INST);
        this.stats.tris += (mesh.count / 3) * (b.data.length / INST);
        this.stats.calls++;
      }
    };

    this.stats = { tris: 0, calls: 0 };
    // shadows
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFbo);
    gl.viewport(0, 0, this.shadowSize, this.shadowSize);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2.5, 4);
    drawBatches(this.prog.depth, lvp);
    gl.disable(gl.POLYGON_OFFSET_FILL);

    // the view
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(BG[0], BG[1], BG[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const common = (pr: Prog) => {
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u("uVP"), false, this.vp);
      gl.uniformMatrix4fv(pr.u("uLVP"), false, lvp);
      gl.uniform3fv(pr.u("uSun"), SUN);
      gl.uniform3fv(pr.u("uSunCol"), SUN_COL);
      gl.uniform3fv(pr.u("uSky"), SKY);
      gl.uniform3fv(pr.u("uBounce"), BOUNCE);
      gl.uniform3fv(pr.u("uEye"), this.eye);
      gl.uniform2f(pr.u("uMap"), COLS, ROWS);
      gl.uniform1f(pr.u("uTime"), sim.clock);
      gl.uniform1f(pr.u("uShadowOn"), 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
      gl.uniform1i(pr.u("uShadow"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.fogTex);
      gl.uniform1i(pr.u("uFog"), 1);
    };
    // the land
    common(this.prog.ground);
    for (const g of this.groundVao) {
      if (g.c.x1 < r.x0 || g.c.x0 > r.x1 || g.c.z1 < r.z0 || g.c.z0 > r.z1) continue;
      gl.bindVertexArray(g.vao);
      gl.drawElements(gl.TRIANGLES, g.n, gl.UNSIGNED_INT, 0);
      this.stats.tris += g.n / 3;
      this.stats.calls++;
    }
    // things standing on it
    common(this.prog.model);
    drawBatches(this.prog.model, this.vp);
    // grass, flowers, reeds
    common(this.prog.decor);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.occTex);
    gl.uniform1i(this.prog.decor.u("uOcc"), 2);
    gl.uniform2f(this.prog.decor.u("uMapD"), COLS, ROWS);
    gl.uniform1f(this.prog.decor.u("uTimeD"), sim.clock);
    const near = this.ppt > 18;
    for (const d of this.decorVao) {
      if (!near && d.d.kind !== 4 && d.d.kind !== 3) continue;
      if (d.d.x0 + 32 < r.x0 || d.d.x0 > r.x1 || d.d.z0 + 32 < r.z0 || d.d.z0 > r.z1) continue;
      gl.bindVertexArray(d.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, d.n, d.count);
      this.stats.tris += (d.n / 3) * d.count;
      this.stats.calls++;
    }
    // the water, last of the solid things so the land hides most of it first
    common(this.prog.water);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.shoreTex);
    gl.uniform1i(this.prog.water.u("uShore"), 2);
    gl.bindVertexArray(this.waterVao);
    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6 * 8);

    // marks on the ground, then soft sprites, blended
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    this.drawDecals(sim, p);
    this.drawSprites(sim, p, r);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
    void wd;
    void BOARD_Y;
  }

  private updateFog(sim: Sim, p: PlayerId) {
    if (this.frame % 2 && this.frame > 2) return;
    const seen = sim.visible[p];
    const known = sim.explored[p];
    const f = this.fogBytes;
    for (let i = 0; i < f.length; i++) f[i] = seen[i] ? 255 : known[i] ? 128 : 0;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.fogTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, COLS, ROWS, gl.RED, gl.UNSIGNED_BYTE, f);
  }

  /** where buildings stand, so grass does not grow through their floors */
  private updateOcc(sim: Sim) {
    let key = `${sim.buildings.length}`;
    for (const b of sim.buildings) key += `,${b.tx * 1000 + b.ty}`;
    if (key === this.occKey) return;
    this.occKey = key;
    const o = this.occBytes;
    o.fill(0);
    for (const b of sim.buildings) {
      const s = BUILDINGS[b.kind];
      for (let y = b.ty; y < b.ty + s.h; y++) for (let x = b.tx; x < b.tx + s.w; x++) if (x >= 0 && y >= 0 && x < COLS && y < ROWS) o[y * COLS + x] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.occTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, COLS, ROWS, gl.RED, gl.UNSIGNED_BYTE, o);
  }

  // ── gathering what to draw ──
  private collect(sim: Sim, p: PlayerId, r: { x0: number; x1: number; z0: number; z1: number }) {
    const batches = new Map<string, Batch>();
    const put = (key: string, make: () => Mesh, x: number, y: number, z: number, yaw: number, scale: number, team: number, flash = 0, clip = 99, a0 = 0, a1 = 0, a2 = 0, a3 = 0, pivot?: readonly number[]) => {
      let b = batches.get(key);
      if (!b) {
        b = { m: model(key, make, pivot), key, data: [] };
        batches.set(key, b);
      }
      b.data.push(x, y, z, yaw, scale, team, flash, clip, a0, a1, a2, a3);
      return b.m;
    };
    const inView = (x: number, z: number, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;
    const explored = sim.explored[p];
    // trees and other things to gather
    for (const n of sim.nodes) {
      if (n.farm || !inView(n.x + 0.5, n.y + 0.5)) continue;
      if (!explored[n.y * COLS + n.x]) continue;
      const h1 = hash(n.x, n.y, 1);
      const h2 = hash(n.x, n.y, 2);
      const x = n.x + 0.5 + (hash(n.x, n.y, 3) - 0.5) * 0.3;
      const z = n.y + 0.5 + (hash(n.x, n.y, 4) - 0.5) * 0.3;
      const y = heightAt(x, z);
      if (n.sea) {
        if (n.amount <= 0) continue;
        for (let k = 0; k < 3; k++) {
          const a = sim.clock * (0.8 + k * 0.15) + k * 2.1 + h1 * 6;
          const rr = 0.18 + k * 0.07;
          put("fish", fishModel, n.x + 0.5 + Math.cos(a) * rr, WATER_Y + 0.012, n.y + 0.5 + Math.sin(a) * rr, -a, 1, 5);
        }
        continue;
      }
      if (n.kind === "wood") {
        if (n.amount <= 0) {
          put("stump", stumpModel, x, y, z, h2 * 6.3, 1, 5);
          continue;
        }
        const t = h1 < 0.42 ? 0 : h1 < 0.72 ? 1 : h1 < 0.86 ? 2 : 3;
        put(`tree${t}`, () => treeModel(t), x, y, z, h2 * 6.3, 0.85 + hash(n.x, n.y, 5) * 0.35, 5);
        continue;
      }
      if (n.amount <= 0) continue;
      const full = n.kind === "food" ? 220 : n.kind === "gold" ? 400 : 340;
      const v = (h1 * 3) | 0;
      put(`node${n.kind}${v}`, () => nodeModel(n.kind as "food", v), n.x + 0.5, y, n.y + 0.5, h2 * 6.3, 0.75 + 0.45 * Math.min(1, n.amount / full), 5);
    }
    // buildings
    const walls = new Set<number>();
    for (const b of sim.buildings) if (BUILDINGS[b.kind].wall && b.seen & (1 << p)) walls.add((b.ty * COLS + b.tx) * 8 + b.owner);
    const linked = (b: Building) => {
      let m = 0;
      const at = (dx: number, dy: number) => walls.has(((b.ty + dy) * COLS + b.tx + dx) * 8 + b.owner);
      if (at(0, -1)) m |= 1;
      if (at(1, 0)) m |= 2;
      if (at(0, 1)) m |= 4;
      if (at(-1, 0)) m |= 8;
      return m;
    };
    const rallyB = sim.sel[p].building;
    for (const b of sim.buildings) {
      if (!(b.seen & (1 << p))) continue;
      const s = BUILDINGS[b.kind];
      const cx = b.tx + s.w / 2;
      const cz = b.ty + s.h / 2;
      if (!inView(cx, cz, 3)) continue;
      const style = sim.style[b.owner];
      const age = ageOf(sim, b.owner);
      const links = s.wall ? linked(b) : 0;
      const yaw = s.wall ? 0 : isNorth(b.owner) ? Math.PI : 0;
      const key = `b${b.kind}${style}${age}${links}`;
      const kind = b.kind as BuildingKind;
      const built = b.progress >= 1;
      const m = model(key, () => buildingModel(kind, style, age, links));
      const clip = built ? 99 : Math.max(0.02, b.progress) * m.height;
      put(key, () => buildingModel(kind, style, age, links), cx, 0, cz, yaw, 1, b.owner, 0, clip);
      if (!built || b.upgrade) {
        const sh = Math.min(2.4, m.height * 0.9);
        put(`sc${s.w}${s.h}${Math.round(sh * 10)}`, () => scaffold(s.w, s.h, sh), cx, 0, cz, yaw, 1, b.owner);
        if (!built) put(`site${s.w}${s.h}`, () => siteModel(s.w, s.h), cx, 0, cz, yaw, 1, b.owner);
      }
      // a gathering flag for the picked building
      if (b.id === rallyB && b.owner === p && b.rally) put("rally", rallyModel, b.rally.x, heightAt(b.rally.x, b.rally.y), b.rally.y, 0, 1, b.owner);
    }
    // units
    const nodeById = new Map<number, (typeof sim.nodes)[number]>();
    for (const n of sim.nodes) nodeById.set(n.id, n);
    for (const u of sim.units) {
      if (!inView(u.x, u.y, 1)) continue;
      if (u.owner !== p && !canSee(sim, p, u.x, u.y)) continue;
      this.unit(sim, u, put, nodeById);
    }
    // arrows and cannonballs
    for (const a of sim.arrows) {
      if (!inView(a.x, a.y) || !canSee(sim, p, a.x, a.y)) continue;
      const yaw = Math.atan2(a.tx - a.x, a.ty - a.y);
      const left = Math.hypot(a.tx - a.x, a.ty - a.y);
      const y = 0.3 + Math.min(0.6, left * 0.12);
      put(a.ball ? "ball" : "arrow", () => arrowModel(!!a.ball), a.x, y, a.y, yaw, 1, a.owner);
    }
    return batches;
  }

  private unit(sim: Sim, u: Unit, put: (key: string, make: () => Mesh, x: number, y: number, z: number, yaw: number, scale: number, team: number, flash?: number, clip?: number, a0?: number, a1?: number, a2?: number, a3?: number, pivot?: readonly number[]) => Model, nodes: Map<number, Sim["nodes"][number]>) {
    const style = sim.style[u.owner];
    const yaw = Math.atan2(u.fx, u.fy);
    const flash = u.flash > 0 ? 0.65 : 0;
    const walking = u.order.t === "move" || u.path.length > 0;
    const y = heightAt(u.x, u.y);
    if (UNITS[u.kind].naval) {
      const bob = Math.sin(sim.clock * 2.1 + u.id) * 0.018;
      put(`ship${u.kind}`, () => shipModel(u.kind), u.x, WATER_Y + 0.02 + bob, u.y, yaw, 1.45, u.owner, flash);
      return;
    }
    const skin = u.id % 3;
    if (u.kind === "rider") {
      put(`rider${style}${skin}`, () => riderModel(style, skin), u.x, y, u.y, yaw, 1.25, u.owner, flash, 99, u.anim * 2.4, walking ? 0.55 : 0, 0, 0, HORSE_PIVOT);
      return;
    }
    if (u.kind === "ram") {
      put("ram", ramModel, u.x, y, u.y, yaw, 1.2, u.owner, flash);
      return;
    }
    const working = (u.order.t === "gather" || u.order.t === "build" || u.order.t === "attack") && !u.path.length;
    let tool: "none" | "axe" | "pick" | "hoe" | "hammer" | "basket" = "none";
    if (u.kind === "villager") {
      if (u.order.t === "build") tool = "hammer";
      else if (u.order.t === "gather") {
        const n = nodes.get(u.order.node);
        tool = !n ? "none" : n.kind === "wood" ? "axe" : n.kind === "food" ? (n.farm ? "hoe" : "basket") : "pick";
      }
    }
    const carry = u.kind === "villager" && u.carry >= 1 ? (u.carryType ?? "") : "";
    const key = `p${u.kind}${style}${skin}${tool}${carry}`;
    put(key, () => personModel(u.kind, style, skin, tool, carry), u.x, y, u.y, yaw, 1.3, u.owner, flash, 99,
      u.anim * 1.6, walking ? 0.6 : 0, sim.clock * 9 + u.id, working ? 1.2 : 0, PERSON_PIVOT);
  }

  private drawDecals(sim: Sim, p: PlayerId) {
    const gl = this.gl;
    const d: number[] = [];
    const add = (cx: number, cz: number, hw: number, hh: number, c: [number, number, number, number], shape: number, width = 0.25, y = 0.04) => d.push(cx, cz, hw, hh, c[0], c[1], c[2], c[3], shape, width, 0, y);
    const pick: [number, number, number, number] = [1, 0.96, 0.62, 0.95];
    const chosen = new Set(sim.sel[p].units);
    for (const u of sim.units) {
      if (!chosen.has(u.id)) continue;
      const naval = !!UNITS[u.kind].naval;
      const r = naval ? 0.62 : u.kind === "rider" || u.kind === "ram" ? 0.4 : 0.3;
      add(u.x, u.y, r, r, pick, 0, 0.32, naval ? WATER_Y + 0.02 : heightAt(u.x, u.y) + 0.03);
    }
    const bsel = sim.sel[p].building;
    for (const b of sim.buildings) {
      const s = BUILDINGS[b.kind];
      // a soft dark patch under each building, so it sits on the ground
      if (b.seen & (1 << p) && b.kind !== "farm" && !s.wall) add(b.tx + s.w / 2, b.ty + s.h / 2, s.w * 0.58, s.h * 0.58, [0.05, 0.08, 0.02, 0.22], 2, 0, 0.035);
      if (b.id !== bsel) continue;
      add(b.tx + s.w / 2, b.ty + s.h / 2, s.w / 2 + 0.06, s.h / 2 + 0.06, [1, 0.96, 0.62, 0.55], 1, 0, 0.05);
      if (b.owner === p && b.rally) {
        // a dotted line to the gathering flag
        const x0 = b.tx + s.w / 2, z0 = b.ty + s.h / 2, x1 = b.rally.x, z1 = b.rally.y;
        const l = Math.hypot(x1 - x0, z1 - z0);
        for (let t = 0.35; t < l; t += 0.35) add(x0 + ((x1 - x0) * t) / l, z0 + ((z1 - z0) * t) / l, 0.06, 0.06, [1, 0.97, 0.82, 0.8], 2, 0, 0.06);
      }
    }
    const anchor = sim.place[p] && sim.anchor[p];
    if (anchor) add(anchor.x + 0.5, anchor.y + 0.5, 0.5, 0.5, [1, 0.94, 0.5, 0.55], 1, 0, 0.06);
    const bad = sim.bad[p];
    if (bad) add(bad.tx + bad.w / 2, bad.ty + bad.h / 2, bad.w / 2, bad.h / 2, [0.95, 0.25, 0.18, 0.6], 1, 0, 0.07);
    // ripples over fish
    for (const n of sim.nodes) if (n.sea && n.amount > 0 && sim.explored[p][n.y * COLS + n.x]) {
      const t = (sim.clock * 0.6 + hash(n.x, n.y, 1)) % 1;
      add(n.x + 0.5, n.y + 0.5, 0.2 + t * 0.35, 0.2 + t * 0.35, [1, 1, 1, 0.35 * (1 - t)], 0, 0.12, WATER_Y + 0.015);
    }
    if (!d.length) return;
    const pr = this.prog.decal;
    gl.useProgram(pr.p);
    gl.uniformMatrix4fv(pr.u("uVP"), false, this.vp);
    gl.uniform1f(pr.u("uTime"), sim.clock);
    gl.bindVertexArray(this.decalVao);
    const buf = this.scratch(new Float32Array(d));
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 48, 0);
    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 48, 16);
    gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 48, 32);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-2, -4);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, d.length / 12);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }

  private scratchBufs: WebGLBuffer[] = [];
  private scratchAt = 0;
  private scratch(data: Float32Array) {
    const gl = this.gl;
    if (this.scratchAt >= this.scratchBufs.length) this.scratchBufs.push(gl.createBuffer()!);
    const b = this.scratchBufs[this.scratchAt++ % 4]!;
    if (this.scratchAt >= 4) this.scratchAt = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
    return b;
  }

  private drawSprites(sim: Sim, p: PlayerId, r: { x0: number; x1: number; z0: number; z1: number }) {
    const gl = this.gl;
    const d: number[] = [];
    const add = (x: number, y: number, z: number, size: number, c: [number, number, number, number]) => d.push(x, y, z, size, c[0], c[1], c[2], c[3]);
    const t = sim.clock;
    for (const b of sim.buildings) {
      if (!(b.seen & (1 << p)) || b.progress < 1) continue;
      const s = BUILDINGS[b.kind];
      const cx = b.tx + s.w / 2;
      const cz = b.ty + s.h / 2;
      if (cx < r.x0 - 2 || cx > r.x1 + 2 || cz < r.z0 - 2 || cz > r.z1 + 2) continue;
      if (!canSee(sim, p, cx, cz)) continue;
      const m = models.get(`b${b.kind}${sim.style[b.owner]}${ageOf(sim, b.owner)}0`);
      const top = m ? m.height : 1;
      const f = b.hp / fullHp(sim, b.owner, b.kind);
      // smoke from a damaged building, and flames when it is badly hurt
      if (f < 0.66 && !s.wall) {
        for (let k = 0; k < 5; k++) {
          const ph = (t * 0.35 + k / 5 + hash(b.id, k, 1)) % 1;
          add(cx + (hash(b.id, k, 2) - 0.5) * s.w * 0.6 + ph * 0.3, top * 0.7 + ph * 1.6, cz + (hash(b.id, k, 3) - 0.5) * s.h * 0.5, 0.18 + ph * 0.32, [0.26, 0.24, 0.22, 0.55 * (1 - ph)]);
        }
        if (f < 0.36)
          for (let k = 0; k < 4; k++) {
            const ph = (t * 1.3 + k / 4 + hash(b.id, k, 4)) % 1;
            add(cx + (hash(b.id, k, 5) - 0.5) * s.w * 0.6, top * 0.55 + ph * 0.4, cz + (hash(b.id, k, 6) - 0.5) * s.h * 0.4, 0.16 * (1 - ph * 0.6), [1, 0.55 + ph * 0.3, 0.15, 0.9 * (1 - ph)]);
          }
      }
      // a curl of smoke from home chimneys
      const style = sim.style[b.owner];
      if ((b.kind === "house" || b.kind === "manor" || b.kind === "smithy" || b.kind === "town") && style !== 3 && (style !== 2 || b.kind !== "smithy")) {
        const flip = isNorth(b.owner) ? -1 : 1;
        const [ox, oz, oy] = b.kind === "town" ? (style === 2 ? [0, 0.1, 2.1] : style === 1 ? [0, -0.3, 2.5] : [0.7, -0.6, 2.2]) : b.kind === "smithy" ? [0.7, 0.05, 1.4] : style === 2 ? [0, 0, b.kind === "manor" ? 1.9 : 1.4] : [-(b.kind === "manor" ? 1.9 : 1.75) * 0.28, -(b.kind === "manor" ? 1.8 : 1.6) * 0.12, b.kind === "manor" ? 1.9 : 1.45];
        for (let k = 0; k < 4; k++) {
          const ph = (t * 0.22 + k / 4 + hash(b.id, k, 7)) % 1;
          add(cx + flip * ox + ph * 0.35 + Math.sin(t + k) * 0.05, oy + ph * 1.1, cz + flip * oz - ph * 0.1, 0.07 + ph * 0.2, [0.92, 0.92, 0.9, 0.42 * (1 - ph) * Math.min(1, ph * 6)]);
        }
      }
    }
    for (const q of sim.particles) {
      if (!canSee(sim, p, q.x, q.y)) continue;
      const k = q.life / q.max;
      const n = parseInt(q.color.slice(1, 7), 16);
      const c: [number, number, number, number] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
      add(q.x, 0.15 + Math.sin(k * Math.PI) * 0.25, q.y, (q.size / 32) * 0.9, c);
    }
    if (!d.length) return;
    const pr = this.prog.sprite;
    gl.useProgram(pr.p);
    gl.uniformMatrix4fv(pr.u("uVP"), false, this.vp);
    // the camera's right and up, for sprites that face it
    const v = this.vp;
    const right = norm([v[0]!, v[4]!, v[8]!]);
    const up = norm([v[1]!, v[5]!, v[9]!]);
    gl.uniform3fv(pr.u("uRight"), right);
    gl.uniform3fv(pr.u("uUp"), up);
    gl.uniform2f(pr.u("uMap"), COLS, ROWS);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fogTex);
    gl.uniform1i(pr.u("uFog"), 1);
    gl.bindVertexArray(this.spriteVao);
    const buf = this.scratch(new Float32Array(d));
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 32, 16);
    gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 32, 0);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, d.length / 8);
  }

  /** Health bars and floating numbers, sharp on the canvas above. */
  overlay(g: CanvasRenderingContext2D, sim: Sim, p: PlayerId, unitHp: (u: Unit) => number) {
    const c = g.canvas;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(c.width / this.w, 0, 0, c.height / this.h, 0, 0);
    const bar = (x: number, y: number, w: number, f: number) => {
      g.fillStyle = "rgba(20,16,10,.75)";
      g.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
      g.fillStyle = f > 0.6 ? "#7ed957" : f > 0.3 ? "#f2c94c" : "#eb5a46";
      g.fillRect(x - w / 2, y, w * Math.max(0, f), 3);
    };
    const chosen = new Set(sim.sel[p].units);
    const k = this.ppt / 32;
    for (const u of sim.units) {
      const full = unitHp(u);
      if (!chosen.has(u.id) && u.hp >= full - 0.5) continue;
      if (u.owner !== p && !canSee(sim, p, u.x, u.y)) continue;
      const naval = !!UNITS[u.kind].naval;
      const s = this.screen(u.x, naval ? 0.75 : 0.95, u.y);
      if (!s || s[0] < -20 || s[1] < -20 || s[0] > this.w + 20 || s[1] > this.h + 20) continue;
      bar(s[0], s[1], Math.max(12, 18 * k), u.hp / full);
    }
    for (const b of sim.buildings) {
      if (!(b.seen & (1 << p))) continue;
      const full = fullHp(sim, b.owner, b.kind);
      if (sim.sel[p].building !== b.id && b.hp >= full - 0.5) continue;
      const s0 = BUILDINGS[b.kind];
      const m = models.get(`b${b.kind}${sim.style[b.owner]}${ageOf(sim, b.owner)}0`);
      const s = this.screen(b.tx + s0.w / 2, (m?.height ?? 1) + 0.25, b.ty + s0.h / 2);
      if (!s || s[0] < -60 || s[1] < -20 || s[0] > this.w + 60 || s[1] > this.h + 20) continue;
      bar(s[0], s[1], Math.max(20, s0.w * 22 * k), b.hp / full);
    }
    g.font = "bold 12px system-ui,sans-serif";
    g.textAlign = "center";
    g.lineJoin = "round";
    for (const fl of sim.floaters) {
      if (!canSee(sim, p, fl.x, fl.y)) continue;
      const s = this.screen(fl.x, 0.9 + (0.9 - fl.life) * 0.6, fl.y);
      if (!s) continue;
      g.strokeStyle = "rgba(20,16,10,.85)";
      g.lineWidth = 3;
      g.strokeText(fl.text, s[0], s[1]);
      g.fillStyle = fl.color;
      g.fillText(fl.text, s[0], s[1]);
    }
  }

  /** What a tap at (x, y) from the view's middle touches: a unit, a building or a resource, else the ground. */
  tapAt(sim: Sim, p: PlayerId, x: number, y: number): { x: number; y: number } | null {
    const g = this.ground(x, y);
    if (!g) return null;
    if (sim.place[p]) return { x: g[0], y: g[1] };
    const sx = x + this.w / 2;
    const sy = y + this.h / 2;
    let best: { x: number; y: number; d: number } | null = null;
    const near = (wx: number, wy: number, h: number, r: number, gx: number, gy: number, prio = 0) => {
      const a = this.screen(wx, 0, wy);
      const b = this.screen(wx, h, wy);
      if (!a || !b) return;
      // inside a capsule from the foot to the top
      const vx = b[0] - a[0], vy = b[1] - a[1];
      const l2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((sx - a[0]) * vx + (sy - a[1]) * vy) / l2));
      const dx = sx - (a[0] + vx * t), dy = sy - (a[1] + vy * t);
      const dist = Math.hypot(dx, dy);
      const rad = r * this.ppt;
      if (dist > rad) return;
      const score = dist / rad + prio - a[1] * 0.0001;
      if (!best || score < best.d) best = { x: gx, y: gy, d: score };
    };
    const vx0 = g[0] - 6, vx1 = g[0] + 6, vz0 = g[1] - 6, vz1 = g[1] + 8;
    for (const u of sim.units) {
      if (u.x < vx0 || u.x > vx1 || u.y < vz0 || u.y > vz1) continue;
      if (u.owner !== p && !canSee(sim, p, u.x, u.y)) continue;
      const naval = !!UNITS[u.kind].naval;
      near(u.x, u.y, naval ? 0.6 : 0.7, naval ? 0.55 : 0.36, u.x, u.y, -0.3);
    }
    for (const b of sim.buildings) {
      if (!(b.seen & (1 << p))) continue;
      const s = BUILDINGS[b.kind];
      const cx = b.tx + s.w / 2, cz = b.ty + s.h / 2;
      if (cx < vx0 - 2 || cx > vx1 + 2 || cz < vz0 - 2 || cz > vz1 + 2) continue;
      if (b.kind === "farm") continue;
      const m = models.get(`b${b.kind}${sim.style[b.owner]}${ageOf(sim, b.owner)}0`);
      near(cx, cz, (m?.height ?? 1.2) * 0.8, Math.min(s.w, s.h) * 0.5, cx, cz, 0.2);
    }
    for (const n of sim.nodes) {
      if (n.farm || n.sea || n.amount <= 0) continue;
      if (n.x < vx0 || n.x > vx1 || n.y < vz0 || n.y > vz1) continue;
      if (!sim.explored[p][n.y * COLS + n.x]) continue;
      near(n.x + 0.5, n.y + 0.5, n.kind === "wood" ? 1.3 : 0.3, 0.42, n.x + 0.5, n.y + 0.5, 0.4);
    }
    const hit = best as { x: number; y: number } | null;
    return hit ? { x: hit.x, y: hit.y } : { x: g[0], y: g[1] };
  }
}
