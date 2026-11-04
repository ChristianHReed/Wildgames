//! AfterStreet core: the heavy number crunching of map loading, in Rust.
//!
//! Compiled to WebAssembly and embedded in `engine/core_wasm.js` (see `tools/build_core.sh`).
//! The game uses it when the browser can run it and falls back to the same code in
//! JavaScript (`drape` in `engine/world.js`) when it cannot, so both must give the same result.
//!
//! No standard library and no allocator: the game hands in pointers into the module's own
//! memory and reads the answer from there. Every export takes and returns only `u32`, `f32`
//! and pointers, so it is called from JavaScript with plain numbers.
#![cfg_attr(not(test), no_std)]

#[cfg(not(test))]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

#[inline(always)]
fn floor(x: f64) -> f64 {
    let t = x as i64 as f64;
    if t > x { t - 1.0 } else { t }
}
#[inline(always)]
fn absf(x: f64) -> f64 {
    if x < 0.0 { -x } else { x }
}

/// The terrain height grid (`world.hg` in the game).
pub struct Grid<'a> {
    pub d: &'a [f32],
    pub cols: usize,
    pub rows: usize,
    pub x0: f64,
    pub y0: f64,
    pub cell: f64,
}

impl<'a> Grid<'a> {
    /// The same as `hAt0` in engine/world.js: the height at (x, y), on the two triangles of each grid cell.
    pub fn at(&self, x: f64, y: f64) -> f64 {
        let mut u = (x - self.x0) / self.cell;
        let mut v = (y - self.y0) / self.cell;
        let cu = self.cols as f64 - 1.001;
        let rv = self.rows as f64 - 1.001;
        u = if u < 0.0 { 0.0 } else if u > cu { cu } else { u };
        v = if v < 0.0 { 0.0 } else if v > rv { rv } else { v };
        let i = floor(u) as usize;
        let j = floor(v) as usize;
        let fu = u - i as f64;
        let fv = v - j as f64;
        let k = j * self.cols + i;
        let a = self.d[k] as f64;
        let b = self.d[k + 1] as f64;
        let c = self.d[k + self.cols] as f64;
        let e = self.d[k + self.cols + 1] as f64;
        if fu + fv <= 1.0 {
            a + (b - a) * fu + (c - a) * fv
        } else {
            e + (c - e) * (1.0 - fu) + (b - e) * (1.0 - fv)
        }
    }
}

/// A small polygon on the stack (a triangle clipped by four lines and a diagonal never has more than 8 corners).
#[derive(Clone, Copy)]
struct Poly {
    p: [f64; 32],
    n: usize, // number of values (2 per corner)
}

impl Poly {
    fn new() -> Self {
        Poly { p: [0.0; 32], n: 0 }
    }
    #[inline(always)]
    fn push(&mut self, x: f64, z: f64) {
        if self.n + 2 <= 32 {
            self.p[self.n] = x;
            self.p[self.n + 1] = z;
            self.n += 2;
        }
    }
}

/// Keeps the side where a*x + b*z <= c (the same as `clip` inside `drape` in engine/world.js).
fn clip(poly: &Poly, a: f64, b: f64, c: f64) -> Poly {
    let mut out = Poly::new();
    let k = poly.n;
    if k == 0 {
        return out;
    }
    let mut q = 0;
    while q < k {
        let x0 = poly.p[q];
        let z0 = poly.p[q + 1];
        let x1 = poly.p[(q + 2) % k];
        let z1 = poly.p[(q + 3) % k];
        let d0 = a * x0 + b * z0 - c;
        let d1 = a * x1 + b * z1 - c;
        if d0 <= 0.0 {
            out.push(x0, z0);
        }
        if (d0 < 0.0 && d1 > 0.0) || (d0 > 0.0 && d1 < 0.0) {
            let f = d0 / (d0 - d1);
            out.push(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f);
        }
        q += 2;
    }
    out
}

/// Where draped vertices go. `cap` is how many vertices fit; past it, they are only counted.
pub struct Out<'a> {
    pub p: &'a mut [f32],
    pub c: &'a mut [u8],
    pub t: &'a mut [f32],
    pub cap: usize,
    pub n: usize,
}

/// Lays flat ground pieces (triangles at their own height above the ground) over the terrain: each
/// triangle is cut along the height grid's cells and their diagonals, and every corner lifted by the
/// terrain under it. The same as `drape` in engine/world.js. Returns the number of vertices made.
pub fn drape(tri: &[f32], col: &[u8], uv: &[f32], g: &Grid, lift: f64, out: &mut Out) -> usize {
    let n = tri.len() / 9;
    let cs = g.cell;
    for i in 0..n {
        let o = i * 9;
        let ax = tri[o] as f64;
        let az = tri[o + 2] as f64;
        let bx = tri[o + 3] as f64;
        let bz = tri[o + 5] as f64;
        let cx = tri[o + 6] as f64;
        let cz = tri[o + 8] as f64;
        let den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
        if absf(den) < 1e-6 {
            continue;
        }
        let y0 = tri[o + 1] as f64;
        let y1 = tri[o + 4] as f64;
        let y2 = tri[o + 7] as f64;
        let co = i * 12;
        let to = i * 9;
        let mut t = Poly::new();
        t.push(ax, az);
        t.push(bx, bz);
        t.push(cx, cz);
        let mn = |a: f64, b: f64, c: f64| if a < b { if a < c { a } else { c } } else if b < c { b } else { c };
        let mx = |a: f64, b: f64, c: f64| if a > b { if a > c { a } else { c } } else if b > c { b } else { c };
        let i0 = floor((mn(ax, bx, cx) - g.x0) / cs) as i64;
        let i1 = floor((mx(ax, bx, cx) - g.x0) / cs) as i64;
        let j0 = floor((mn(az, bz, cz) - g.y0) / cs) as i64;
        let j1 = floor((mx(az, bz, cz) - g.y0) / cs) as i64;
        let mut gj = j0;
        while gj <= j1 {
            let mut gi = i0;
            while gi <= i1 {
                let x = g.x0 + gi as f64 * cs;
                let z = g.y0 + gj as f64 * cs;
                let cell = clip(&clip(&clip(&clip(&t, -1.0, 0.0, -x), 1.0, 0.0, x + cs), 0.0, -1.0, -z), 0.0, 1.0, z + cs);
                if cell.n >= 6 {
                    for half in 0..2 {
                        let s = if half == 1 { -1.0 } else { 1.0 };
                        let poly = clip(&cell, s, s, s * (x + z + cs));
                        if poly.n < 6 {
                            continue;
                        }
                        let mut q = 2;
                        while q + 3 < poly.n {
                            let vs = [poly.p[0], poly.p[1], poly.p[q], poly.p[q + 1], poly.p[q + 2], poly.p[q + 3]];
                            q += 2;
                            if absf((vs[2] - vs[0]) * (vs[5] - vs[1]) - (vs[4] - vs[0]) * (vs[3] - vs[1])) < 1e-4 {
                                continue;
                            }
                            let mut k = 0;
                            while k < 6 {
                                let px = vs[k];
                                let pz = vs[k + 1];
                                k += 2;
                                let w0 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / den;
                                let w1 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / den;
                                let w2 = 1.0 - w0 - w1;
                                let v = out.n;
                                out.n += 1;
                                if v >= out.cap {
                                    continue;
                                }
                                out.p[v * 3] = px as f32;
                                out.p[v * 3 + 1] = (y0 * w0 + y1 * w1 + y2 * w2 + g.at(px, pz) + lift) as f32;
                                out.p[v * 3 + 2] = pz as f32;
                                out.c[v * 4..v * 4 + 4].copy_from_slice(&col[co..co + 4]);
                                out.t[v * 3] = (uv[to] as f64 * w0 + uv[to + 3] as f64 * w1 + uv[to + 6] as f64 * w2) as f32;
                                out.t[v * 3 + 1] = (uv[to + 1] as f64 * w0 + uv[to + 4] as f64 * w1 + uv[to + 7] as f64 * w2) as f32;
                                out.t[v * 3 + 2] = uv[to + 2];
                            }
                        }
                    }
                }
                gi += 1;
            }
            gj += 1;
        }
    }
    out.n
}

/// The WebAssembly entry point. All pointers are into this module's memory, laid out by the game.
/// `ntri` triangles in `tri` (9 floats each), `col` (12 bytes each), `uv` (9 floats each); the height
/// grid `hg` of `cols` x `rows`; room for `cap` vertices at `op`, `oc`, `ot`. Returns how many
/// vertices the result has: when that is more than `cap`, call again with more room.
///
/// # Safety
/// The pointers must point at that many values inside the module's memory.
#[no_mangle]
pub unsafe extern "C" fn as_drape(
    tri: *const f32, col: *const u8, uv: *const f32, ntri: u32,
    hg: *const f32, cols: u32, rows: u32, x0: f32, y0: f32, cell: f32, lift: f32,
    op: *mut f32, oc: *mut u8, ot: *mut f32, cap: u32,
) -> u32 {
    let n = ntri as usize;
    let g = Grid {
        d: core::slice::from_raw_parts(hg, (cols * rows) as usize),
        cols: cols as usize, rows: rows as usize, x0: x0 as f64, y0: y0 as f64, cell: cell as f64,
    };
    let cap = cap as usize;
    let mut out = Out {
        p: core::slice::from_raw_parts_mut(op, cap * 3),
        c: core::slice::from_raw_parts_mut(oc, cap * 4),
        t: core::slice::from_raw_parts_mut(ot, cap * 3),
        cap, n: 0,
    };
    drape(
        core::slice::from_raw_parts(tri, n * 9),
        core::slice::from_raw_parts(col, n * 12),
        core::slice::from_raw_parts(uv, n * 9),
        &g, lift as f64, &mut out,
    ) as u32
}

/// The module's version, so the game can tell which build it has.
#[no_mangle]
pub extern "C" fn as_version() -> u32 {
    1
}

#[cfg(test)]
mod tests {
    extern crate std;
    use super::*;
    use std::vec;

    #[test]
    fn flat_triangle_on_a_slope() {
        // a 3 x 3 grid, 10 m cells, rising 1 m per metre east
        let d: [f32; 9] = [0.0, 10.0, 20.0, 0.0, 10.0, 20.0, 0.0, 10.0, 20.0];
        let g = Grid { d: &d, cols: 3, rows: 3, x0: 0.0, y0: 0.0, cell: 10.0 };
        let tri: [f32; 9] = [1.0, 0.0, 1.0, 15.0, 0.0, 1.0, 1.0, 0.0, 15.0];
        let col = [7u8; 12];
        let uv = [0.0f32; 9];
        let (mut p, mut c, mut t) = (vec![0f32; 300], vec![0u8; 400], vec![0f32; 300]);
        let mut out = Out { p: &mut p, c: &mut c, t: &mut t, cap: 100, n: 0 };
        let n = drape(&tri, &col, &uv, &g, 0.0, &mut out);
        assert!(n >= 6 && n % 3 == 0);
        for v in 0..n {
            let (x, y) = (p[v * 3] as f64, p[v * 3 + 1] as f64);
            assert!((y - x).abs() < 1e-3, "vertex {} at x {} has height {}", v, x, y);
        }
    }

    #[test]
    fn counts_past_cap() {
        let d = [0f32; 16];
        let g = Grid { d: &d, cols: 4, rows: 4, x0: 0.0, y0: 0.0, cell: 10.0 };
        let tri: [f32; 9] = [0.5, 0.0, 0.5, 29.0, 0.0, 0.5, 0.5, 0.0, 29.0];
        let (mut p, mut c, mut t) = (vec![0f32; 3], vec![0u8; 4], vec![0f32; 3]);
        let mut out = Out { p: &mut p, c: &mut c, t: &mut t, cap: 1, n: 0 };
        let n = drape(&tri, &[0u8; 12], &[0f32; 9], &g, 0.0, &mut out);
        assert!(n > 1);
    }
}
