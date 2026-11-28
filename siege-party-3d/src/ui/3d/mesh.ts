/**
 * Building low-poly models in code. A mesh is a flat list of triangles; each corner carries a
 * position, a colour and a "part" (which bit of a figure swings when it walks or works).
 *
 * Colours: alpha 1 is an ordinary lit colour, alpha 0.25 means "the owner's colour, shaded by rgb",
 * alpha 0.5 "the owner's light colour, shaded by rgb", and alpha 0.85 glows (windows, fire).
 */
export type V3 = [number, number, number];
export type Col = [number, number, number, number];

export const STRIDE = 8;

export const hex = (h: string, a = 1): Col => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a];
};
/** the owner's colour, made lighter (s > 1) or darker (s < 1) */
export const team = (s = 1): Col => [s, s, s, 0.25];
export const teamLight = (s = 1): Col => [s, s, s, 0.5];
export const glow = (h: string): Col => hex(h, 0.85);
export const shade = (c: Col, s: number): Col => [Math.min(1, c[0] * s), Math.min(1, c[1] * s), Math.min(1, c[2] * s), c[3]];
export const mixc = (a: Col, b: Col, t: number): Col => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3]];

/** A small, repeatable random number from whole numbers. */
export const hash = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export class Mesh {
  v: number[] = [];
  /** the current place: x' = m0 x + m1 y + m2 z + m3, ... (a 3x4 matrix) */
  private m = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
  private stack: number[][] = [];
  part = 0;

  push() {
    this.stack.push(this.m.slice());
    return this;
  }
  pop() {
    this.m = this.stack.pop()!;
    return this;
  }
  private mul(n: number[]) {
    const a = this.m;
    const r = new Array<number>(12);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) r[i * 4 + j] = a[i * 4]! * n[j]! + a[i * 4 + 1]! * n[4 + j]! + a[i * 4 + 2]! * n[8 + j]!;
      r[i * 4 + 3] = a[i * 4]! * n[3]! + a[i * 4 + 1]! * n[7]! + a[i * 4 + 2]! * n[11]! + a[i * 4 + 3]!;
    }
    this.m = r;
    return this;
  }
  move(x: number, y: number, z: number) {
    return this.mul([1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]);
  }
  /** turn about the up axis */
  turn(a: number) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return this.mul([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]);
  }
  /** tip about the x axis */
  tipX(a: number) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return this.mul([1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]);
  }
  /** tip about the z axis */
  tipZ(a: number) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return this.mul([c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]);
  }
  size(x: number, y = x, z = x) {
    return this.mul([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0]);
  }
  private put(p: V3, c: Col) {
    const m = this.m;
    this.v.push(
      m[0]! * p[0] + m[1]! * p[1] + m[2]! * p[2] + m[3]!,
      m[4]! * p[0] + m[5]! * p[1] + m[6]! * p[2] + m[7]!,
      m[8]! * p[0] + m[9]! * p[1] + m[10]! * p[2] + m[11]!,
      c[0], c[1], c[2], c[3], this.part,
    );
  }
  tri(a: V3, b: V3, c: V3, col: Col) {
    this.put(a, col);
    this.put(b, col);
    this.put(c, col);
    return this;
  }
  quad(a: V3, b: V3, c: V3, d: V3, col: Col) {
    return this.tri(a, b, c, col).tri(a, c, d, col);
  }
  /** a convex polygon, fanned from its first corner */
  poly(p: V3[], col: Col) {
    for (let i = 1; i + 1 < p.length; i++) this.tri(p[0]!, p[i]!, p[i + 1]!, col);
    return this;
  }
  /** a box from (x0,y0,z0) to (x1,y1,z1); top may be coloured apart from the sides */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, col: Col, top: Col = col, bottom = false) {
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], top);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col);
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col);
    return this;
  }
  /** a box by its centre on the floor: width (x), height, depth (z) */
  block(cx: number, cz: number, w: number, h: number, d: number, col: Col, top: Col = col, y0 = 0) {
    return this.box(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, col, top);
  }
  /** a pitched roof along x: eaves at y0, ridge at y1; the gable ends get their own colour */
  roof(cx: number, cz: number, w: number, d: number, y0: number, y1: number, col: Col, gable: Col, over = 0.08) {
    const x0 = cx - w / 2 - over;
    const x1 = cx + w / 2 + over;
    const z0 = cz - d / 2 - over;
    const z1 = cz + d / 2 + over;
    // each slope in bands, like rows of shingles
    const bands = Math.max(2, Math.round((y1 - y0) / 0.11));
    for (let i = 0; i < bands; i++) {
      const t0 = i / bands;
      const t1 = (i + 1) / bands;
      const ya = y0 + (y1 - y0) * t0;
      const yb = y0 + (y1 - y0) * t1;
      const fa = z1 + (cz - z1) * t0;
      const fb = z1 + (cz - z1) * t1;
      const ba = z0 + (cz - z0) * t0;
      const bb = z0 + (cz - z0) * t1;
      const k = i % 2 ? 0.93 : 1;
      this.quad([x0, ya, fa], [x1, ya, fa], [x1, yb, fb], [x0, yb, fb], shade(col, k));
      this.quad([x1, ya, ba], [x0, ya, ba], [x0, yb, bb], [x1, yb, bb], shade(col, 0.82 * k));
    }
    const gx0 = cx - w / 2;
    const gx1 = cx + w / 2;
    this.tri([gx0, y0, cz - d / 2], [gx0, y0, cz + d / 2], [gx0, y1 - 0.02, cz], gable);
    this.tri([gx1, y0, cz + d / 2], [gx1, y0, cz - d / 2], [gx1, y1 - 0.02, cz], gable);
    // the roof's thickness along its edges
    const t = 0.05;
    this.quad([x0, y0 - t, z1], [x1, y0 - t, z1], [x1, y0, z1], [x0, y0, z1], shade(col, 0.6));
    return this;
  }
  /** a roof hipped on all four sides, to a ridge (or a point) */
  hip(cx: number, cz: number, w: number, d: number, y0: number, y1: number, col: Col, over = 0.08) {
    const hw = w / 2 + over;
    const hd = d / 2 + over;
    const r = Math.max(0, hw - hd);
    this.quad([cx - hw, y0, cz + hd], [cx + hw, y0, cz + hd], [cx + r, y1, cz], [cx - r, y1, cz], col);
    this.quad([cx + hw, y0, cz - hd], [cx - hw, y0, cz - hd], [cx - r, y1, cz], [cx + r, y1, cz], shade(col, 0.8));
    this.tri([cx + hw, y0, cz + hd], [cx + hw, y0, cz - hd], [cx + r, y1, cz], shade(col, 0.9));
    this.tri([cx - hw, y0, cz - hd], [cx - hw, y0, cz + hd], [cx - r, y1, cz], shade(col, 0.95));
    return this;
  }
  /** an upright many-sided tube or cone, from radius r0 at y0 to r1 at y1 */
  cyl(cx: number, cz: number, y0: number, y1: number, r0: number, r1: number, sides: number, col: Col, top: Col | null = col, twist = 0) {
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2 + twist;
      const a1 = ((i + 1) / sides) * Math.PI * 2 + twist;
      const p00: V3 = [cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0];
      const p10: V3 = [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0];
      const p01: V3 = [cx + Math.cos(a0) * r1, y1, cz + Math.sin(a0) * r1];
      const p11: V3 = [cx + Math.cos(a1) * r1, y1, cz + Math.sin(a1) * r1];
      if (r1 > 0.0001) this.quad(p00, p10, p11, p01, col);
      else this.tri(p00, p10, [cx, y1, cz], col);
      if (top && r1 > 0.0001) this.tri([cx, y1, cz], p01, p11, top);
    }
    return this;
  }
  /** a lumpy ball, made of a few flat faces */
  ball(cx: number, cy: number, cz: number, r: number, col: Col, rough = 0.12, seed = 1, rings = 3, sides = 6, squash = 1) {
    const pts: V3[][] = [];
    for (let i = 0; i <= rings; i++) {
      const lat = (i / rings) * Math.PI - Math.PI / 2;
      const row: V3[] = [];
      for (let j = 0; j < sides; j++) {
        const lon = (j / sides) * Math.PI * 2 + (i % 2) * (Math.PI / sides);
        const k = 1 + (hash(seed, i, j) - 0.5) * 2 * rough;
        const pole = i === 0 || i === rings;
        row.push([
          cx + (pole ? 0 : Math.cos(lat) * Math.cos(lon) * r * k),
          cy + Math.sin(lat) * r * squash * (pole ? 1 : k),
          cz + (pole ? 0 : Math.cos(lat) * Math.sin(lon) * r * k),
        ]);
      }
      pts.push(row);
    }
    for (let i = 0; i < rings; i++)
      for (let j = 0; j < sides; j++) {
        const a = pts[i]![j]!;
        const b = pts[i]![(j + 1) % sides]!;
        const c = pts[i + 1]![(j + 1) % sides]!;
        const d = pts[i + 1]![j]!;
        const s = 0.92 + hash(seed, i * 7 + j, 3) * 0.16;
        if (i === 0) this.tri(a, c, d, shade(col, s));
        else if (i === rings - 1) this.tri(a, b, d, shade(col, s));
        else this.quad(a, b, c, d, shade(col, s));
      }
    return this;
  }
  /** a flag on a pole: the cloth in the owner's colour */
  flag(x: number, z: number, y0: number, h: number, size = 0.32, pole: Col = hex("#4a2c17")) {
    this.block(x, z, 0.04, h, 0.04, pole, pole, y0);
    const top = y0 + h;
    this.quad([x + 0.02, top - size * 0.6, z], [x + size, top - size * 0.42, z], [x + size, top - size * 0.02, z], [x + 0.02, top, z], team(1.05));
    this.tri([x + 0.02, top - size * 0.6, z], [x + size * 0.5, top - size * 0.48, z], [x + 0.02, top - size * 0.3, z], teamLight(1));
    return this;
  }
  /** all of another mesh, placed where this one is */
  add(o: Mesh) {
    const v = o.v;
    for (let i = 0; i < v.length; i += STRIDE) {
      const part = this.part;
      this.part = v[i + 7]!;
      this.put([v[i]!, v[i + 1]!, v[i + 2]!], [v[i + 3]!, v[i + 4]!, v[i + 5]!, v[i + 6]!]);
      this.part = part;
    }
    return this;
  }
  /** the box that holds it all */
  bounds() {
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < this.v.length; i += STRIDE) {
      x0 = Math.min(x0, this.v[i]!); x1 = Math.max(x1, this.v[i]!);
      y0 = Math.min(y0, this.v[i + 1]!); y1 = Math.max(y1, this.v[i + 1]!);
      z0 = Math.min(z0, this.v[i + 2]!); z1 = Math.max(z1, this.v[i + 2]!);
    }
    return { x0, y0, z0, x1, y1, z1 };
  }
}
