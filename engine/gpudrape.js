/* Afterstreet WebGPU ground test (0.130.0). Nothing here is used to play. When Settings > "Test the graphics card on the ground" is on and the browser has WebGPU,
   the next map load does the ground's drape (cutting the ground's triangles along the height grid and lifting them onto the hills, the biggest single job in loading a square)
   a second time on the graphics card, from a copy of the same triangles, and writes what it found to window.GPUTEST: how long the card took (the whole job, and the part that blocks the page),
   how long the Rust/WebAssembly drape took on the processor, and whether both made the same ground (triangle count, mean height). The game keeps using the processor's result.
   The kernel is the same algorithm as drape() in engine/world.js: clip each triangle to the 20 m height-grid cells it covers, split each cell on its diagonal, fan the pieces,
   and give every new corner its own height from the grid. Two passes: one counts the corners each triangle makes, the other writes them at the offsets from a running total. */
(function(){
  var WGSL = [
    'struct U { n:u32, cols:u32, rows:u32, pad:u32, x0:f32, y0:f32, cell:f32, lift:f32 };',
    '@group(0) @binding(0) var<uniform> u: U;',
    '@group(0) @binding(1) var<storage, read> tri: array<f32>;',
    '@group(0) @binding(3) var<storage, read> uvs: array<f32>;',
    '@group(0) @binding(4) var<storage, read> hg: array<f32>;',
    '@group(0) @binding(5) var<storage, read_write> counts: array<u32>;',
    '@group(0) @binding(6) var<storage, read> offs: array<u32>;',
    '@group(0) @binding(7) var<storage, read_write> op: array<f32>;',
    '@group(0) @binding(8) var<storage, read_write> oc: array<u32>;',
    '@group(0) @binding(9) var<storage, read_write> ot: array<f32>;',
    'var<private> pa: array<vec2<f32>, 12>;',
    'var<private> pb: array<vec2<f32>, 12>;',
    'var<private> pc: array<vec2<f32>, 12>;',
    'var<private> outIdx: u32;',
    'fn h0(x: f32, y: f32) -> f32 {',
    '  var uu = (x - u.x0) / u.cell; var vv = (y - u.y0) / u.cell;',
    '  let mu = f32(u.cols) - 1.001; let mv = f32(u.rows) - 1.001;',
    '  uu = clamp(uu, 0.0, mu); vv = clamp(vv, 0.0, mv);',
    '  let i = u32(floor(uu)); let j = u32(floor(vv)); let fu = uu - floor(uu); let fv = vv - floor(vv);',
    '  let k = j * u.cols + i; let a = hg[k]; let b = hg[k + 1u]; let c = hg[k + u.cols]; let e = hg[k + u.cols + 1u];',
    '  if (fu + fv <= 1.0) { return a + (b - a) * fu + (c - a) * fv; }',
    '  return e + (c - e) * (1.0 - fu) + (b - e) * (1.0 - fv);',
    '}',
    '/* keep the side where a*x + b*z <= cc: pa in, pa out */',
    'fn clip(n: u32, a: f32, b: f32, cc: f32) -> u32 {',
    '  var m = 0u;',
    '  for (var q = 0u; q < n; q = q + 1u) {',
    '    let p0 = pa[q]; let p1 = pa[(q + 1u) % n];',
    '    let d0 = a * p0.x + b * p0.y - cc; let d1 = a * p1.x + b * p1.y - cc;',
    '    if (d0 <= 0.0 && m < 12u) { pb[m] = p0; m = m + 1u; }',
    '    if (((d0 < 0.0 && d1 > 0.0) || (d0 > 0.0 && d1 < 0.0)) && m < 12u) { let f = d0 / (d0 - d1); pb[m] = p0 + (p1 - p0) * f; m = m + 1u; }',
    '  }',
    '  for (var q = 0u; q < m; q = q + 1u) { pa[q] = pb[q]; }',
    '  return m;',
    '}',
    'fn run(i: u32, wr: bool) -> u32 {',
    '  outIdx = 0u;',
    '  let o = i * 10u;',
    '  let ax = tri[o]; let az = tri[o + 2u]; let bx = tri[o + 3u]; let bz = tri[o + 5u]; let cx = tri[o + 6u]; let cz = tri[o + 8u];',
    '  let den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);',
    '  if (abs(den) < 1e-6) { return 0u; }',
    '  let y0 = tri[o + 1u]; let y1 = tri[o + 4u]; let y2 = tri[o + 7u];',
    '  let cs = u.cell;',
    '  let i0 = i32(floor((min(ax, min(bx, cx)) - u.x0) / cs)); let i1 = i32(floor((max(ax, max(bx, cx)) - u.x0) / cs));',
    '  let j0 = i32(floor((min(az, min(bz, cz)) - u.y0) / cs)); let j1 = i32(floor((max(az, max(bz, cz)) - u.y0) / cs));',
    '  for (var gj = j0; gj <= j1; gj = gj + 1) { for (var gi = i0; gi <= i1; gi = gi + 1) {',
    '    let X = u.x0 + f32(gi) * cs; let Z = u.y0 + f32(gj) * cs;',
    '    pa[0] = vec2<f32>(ax, az); pa[1] = vec2<f32>(bx, bz); pa[2] = vec2<f32>(cx, cz);',
    '    var n = clip(3u, -1.0, 0.0, -X); if (n < 3u) { continue; }',
    '    n = clip(n, 1.0, 0.0, X + cs); if (n < 3u) { continue; }',
    '    n = clip(n, 0.0, -1.0, -Z); if (n < 3u) { continue; }',
    '    n = clip(n, 0.0, 1.0, Z + cs); if (n < 3u) { continue; }',
    '    for (var q = 0u; q < n; q = q + 1u) { pc[q] = pa[q]; }',
    '    let cn = n;',
    '    for (var hf = 0u; hf < 2u; hf = hf + 1u) {',
    '      for (var q = 0u; q < cn; q = q + 1u) { pa[q] = pc[q]; }',
    '      var sg = 1.0; if (hf == 1u) { sg = -1.0; }',
    '      let m = clip(cn, sg, sg, sg * (X + Z + cs)); if (m < 3u) { continue; }',
    '      for (var k = 1u; k + 1u < m; k = k + 1u) {',
    '        let v0 = pa[0]; let v1 = pa[k]; let v2 = pa[k + 1u];',
    '        if (abs((v1.x - v0.x) * (v2.y - v0.y) - (v2.x - v0.x) * (v1.y - v0.y)) < 1e-4) { continue; }',
    '        for (var t = 0u; t < 3u; t = t + 1u) {',
    '          var v = v0; if (t == 1u) { v = v1; } if (t == 2u) { v = v2; }',
    '          if (wr) {',
    '            let w0 = ((bz - cz) * (v.x - cx) + (cx - bx) * (v.y - cz)) / den; let w1 = ((cz - az) * (v.x - cx) + (ax - cx) * (v.y - cz)) / den; let w2 = 1.0 - w0 - w1;',
    '            let vi = offs[i] + outIdx;',
    '            op[vi * 3u] = v.x; op[vi * 3u + 1u] = y0 * w0 + y1 * w1 + y2 * w2 + h0(v.x, v.y) + u.lift; op[vi * 3u + 2u] = v.y;',
    '            oc[vi] = bitcast<u32>(tri[o + 9u]);',
    '            let uo = i * 9u;',
    '            ot[vi * 3u] = uvs[uo] * w0 + uvs[uo + 3u] * w1 + uvs[uo + 6u] * w2; ot[vi * 3u + 1u] = uvs[uo + 1u] * w0 + uvs[uo + 4u] * w1 + uvs[uo + 7u] * w2; ot[vi * 3u + 2u] = uvs[uo + 2u];',
    '          }',
    '          outIdx = outIdx + 1u;',
    '        }',
    '      }',
    '    }',
    '  } }',
    '  return outIdx;',
    '}',
    '@compute @workgroup_size(64) fn cnt_pass(@builtin(global_invocation_id) id: vec3<u32>) { if (id.x < u.n) { counts[id.x] = run(id.x, false); } }',
    '@compute @workgroup_size(64) fn wr_pass(@builtin(global_invocation_id) id: vec3<u32>) { if (id.x < u.n) { _ = run(id.x, true); } }'
  ].join('\n');

  var DEV = null, PIPE = null, ERR = '';
  function setup(){
    if (DEV) return Promise.resolve(DEV);
    if (!navigator.gpu) return Promise.reject(new Error('no WebGPU'));
    return navigator.gpu.requestAdapter().then(function(a){
      if (!a) throw new Error('no adapter');
      return a.requestDevice({requiredLimits:{maxStorageBufferBindingSize:Math.min(a.limits.maxStorageBufferBindingSize, 268435456), maxBufferSize:Math.min(a.limits.maxBufferSize, 268435456)}});
    }).then(function(d){
      DEV = d; d.addEventListener('uncapturederror', function(ev){ ERR = String(ev.error && ev.error.message || ev.error).slice(0, 220); }); var mod = d.createShaderModule({code:WGSL});
      return mod.getCompilationInfo().then(function(info){
        var bad = info.messages.filter(function(m){ return m.type === 'error'; });
        if (bad.length) throw new Error('shader: ' + bad.slice(0, 2).map(function(m){ return m.lineNum + ': ' + m.message; }).join(' | '));
        var C = GPUShaderStage.COMPUTE, st = function(b, ty){ return {binding:b, visibility:C, buffer:{type:ty}}; };
        var bgl = d.createBindGroupLayout({entries:[st(0, 'uniform'), st(1, 'read-only-storage'), st(3, 'read-only-storage'), st(4, 'read-only-storage'), st(5, 'storage'), st(6, 'read-only-storage'), st(7, 'storage'), st(8, 'storage'), st(9, 'storage')]}), lay = d.createPipelineLayout({bindGroupLayouts:[bgl]});
        PIPE = {bgl:bgl, count:d.createComputePipeline({layout:lay, compute:{module:mod, entryPoint:'cnt_pass'}}), write:d.createComputePipeline({layout:lay, compute:{module:mod, entryPoint:'wr_pass'}})};
        return d;
      });
    });
  }
  function mk(d, size, usage, data){ var b = d.createBuffer({size:Math.max(16, (size + 3) & ~3), usage:usage}); if (data) d.queue.writeBuffer(b, 0, data.buffer, data.byteOffset, data.byteLength); return b; }
  function readback(d, buf, bytes){
    var rb = d.createBuffer({size:Math.max(16, (bytes + 3) & ~3), usage:GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST});
    var enc = d.createCommandEncoder(); enc.copyBufferToBuffer(buf, 0, rb, 0, Math.max(16, (bytes + 3) & ~3)); d.queue.submit([enc.finish()]);
    return rb.mapAsync(GPUMapMode.READ).then(function(){ var r = rb.getMappedRange().slice(0); rb.destroy(); return r; });
  }
  /* in: {p: Float32Array (9 a triangle), c: Uint32Array (1 a triangle), t: Float32Array (9 a triangle), hg: {d, cols, rows, x0, y0, cell}, lift} -> Promise of {verts, meanY, ms, msKernel, msBlocked} */
  function drapeGPU(inp, BT){
    BT = BT || 32768;
    var T0 = performance.now(), blocked = 0, kern = 0, verts = 0, sumY = 0, N = inp.p.length/10;
    return setup().then(function(d){
      var S = GPUBufferUsage.STORAGE, CD = GPUBufferUsage.COPY_DST, CS = GPUBufferUsage.COPY_SRC, UN = GPUBufferUsage.UNIFORM;
      var g = inp.hg, hgB = mk(d, g.d.byteLength, S | CD, g.d), s0 = 0;
      var step = function(){
        if (s0 >= N){ hgB.destroy(); return {verts:verts, meanY:verts ? sumY/verts : 0, ms:performance.now() - T0, msKernel:kern, msBlocked:blocked}; }
        var n = Math.min(BT, N - s0), tb = performance.now();
        var triB = mk(d, n*40, S | CD, inp.p.subarray(s0*10, (s0 + n)*10)), uvB = mk(d, n*36, S | CD, inp.t.subarray(s0*9, (s0 + n)*9));
        var ua = new ArrayBuffer(32), uv = new DataView(ua); uv.setUint32(0, n, true); uv.setUint32(4, g.cols, true); uv.setUint32(8, g.rows, true); uv.setFloat32(16, g.x0, true); uv.setFloat32(20, g.y0, true); uv.setFloat32(24, g.cell, true); uv.setFloat32(28, inp.lift, true);
        var uB = mk(d, 32, UN | CD, new Uint8Array(ua)), cntB = mk(d, n*4, S | CS | CD), offB = mk(d, n*4, S | CD);
        var dm = mk(d, 16, S), dm2 = mk(d, 16, S), dm3 = mk(d, 16, S), bg1 = d.createBindGroup({layout:PIPE.bgl, entries:[{binding:0, resource:{buffer:uB}}, {binding:1, resource:{buffer:triB}}, {binding:3, resource:{buffer:uvB}}, {binding:4, resource:{buffer:hgB}}, {binding:5, resource:{buffer:cntB}}, {binding:6, resource:{buffer:offB}}, {binding:7, resource:{buffer:dm}}, {binding:8, resource:{buffer:dm2}}, {binding:9, resource:{buffer:dm3}}]});
        var enc = d.createCommandEncoder(), pass = enc.beginComputePass(); pass.setPipeline(PIPE.count); pass.setBindGroup(0, bg1); pass.dispatchWorkgroups(Math.ceil(n/64)); pass.end(); d.queue.submit([enc.finish()]);
        blocked += performance.now() - tb; var tk = performance.now();
        return readback(d, cntB, n*4).then(function(cb){
          var cnt = new Uint32Array(cb), offs = new Uint32Array(n), tot = 0, i; for (i = 0; i < n; i++){ offs[i] = tot; tot += cnt[i]; }
          kern += performance.now() - tk; tb = performance.now();
          if (!tot){ [triB, uvB, uB, cntB, offB, dm, dm2, dm3].forEach(function(b){ b.destroy(); }); s0 += n; blocked += performance.now() - tb; return step(); }
          d.queue.writeBuffer(offB, 0, offs);
          var opB = mk(d, tot*12, S | CS), ocB = mk(d, tot*4, S | CS), otB = mk(d, tot*12, S | CS);
          var bg2 = d.createBindGroup({layout:PIPE.bgl, entries:[{binding:0, resource:{buffer:uB}}, {binding:1, resource:{buffer:triB}}, {binding:3, resource:{buffer:uvB}}, {binding:4, resource:{buffer:hgB}}, {binding:5, resource:{buffer:cntB}}, {binding:6, resource:{buffer:offB}}, {binding:7, resource:{buffer:opB}}, {binding:8, resource:{buffer:ocB}}, {binding:9, resource:{buffer:otB}}]});
          var e2 = d.createCommandEncoder(), p2 = e2.beginComputePass(); p2.setPipeline(PIPE.write); p2.setBindGroup(0, bg2); p2.dispatchWorkgroups(Math.ceil(n/64)); p2.end(); d.queue.submit([e2.finish()]);
          blocked += performance.now() - tb; tk = performance.now();
          return Promise.all([readback(d, opB, tot*12), readback(d, ocB, tot*4), readback(d, otB, tot*12)]).then(function(r){
            kern += performance.now() - tk; tb = performance.now();
            var P = new Float32Array(r[0]); for (var q = 1; q < P.length; q += 3) sumY += P[q];
            verts += tot; [triB, uvB, uB, cntB, offB, opB, ocB, otB, dm, dm2, dm3].forEach(function(b){ b.destroy(); });
            blocked += performance.now() - tb; s0 += n; return step();
          });
        });
      };
      return step();
    });
  }
  window.AfterstreetGPUDrape = {drape:drapeGPU, setup:setup};

  /* called by coreDrape in engine/world.js, before the processor's drape, with the triangles that are about to be draped; the processor's result is handed in after */
  window.gpuTestCapture = function(m, lift){
    var g = world.hg, N = m.p.length/9, p = new Float32Array(N*10), pu = new Uint32Array(p.buffer), t = new Float32Array(m.t), i, k;
    for (i = 0; i < N; i++){ for (k = 0; k < 9; k++) p[i*10 + k] = m.p[i*9 + k]; var o = i*12; pu[i*10 + 9] = (m.c[o] | (m.c[o+1] << 8) | (m.c[o+2] << 16) | (m.c[o+3] << 24)) >>> 0; }
    return {p:p, t:t, hg:{d:new Float32Array(g.d), cols:g.cols, rows:g.rows, x0:g.x0, y0:g.y0, cell:g.cell}, lift:lift, N:N, t0:performance.now()};
  };
  window.gpuTestStats = function(parts){ var cv = 0, cy = 0; (parts || []).forEach(function(q){ if (!q.p) return; cv += q.p.length/3; for (var k = 1; k < q.p.length; k += 3) cy += q.p[k]; }); return {cv:cv, cy:cy}; };
  window.gpuTestRun = function(inp, cpuMs, st){
    var cv = st.cv, cy = st.cy;
    var R = window.GPUTEST = {state:'running', tris:inp.N, cpu:{ms:Math.round(cpuMs), verts:cv, meanY:cv ? +(cy/cv).toFixed(3) : 0}};
    drapeGPU(inp).then(function(r){
      if (!r.verts && cv){ R.state = 'failed'; R.error = ERR || 'it made no ground'; if (typeof gpuShow === 'function') gpuShow(); return; }
      R.state = 'done'; R.gpu = {ms:Math.round(r.ms), msWaiting:Math.round(r.msKernel), msBlocked:Math.round(r.msBlocked), verts:r.verts, meanY:+r.meanY.toFixed(3)};
      R.same = cv ? +(100*r.verts/cv).toFixed(2) + '% of the processor\'s corners, mean height difference ' + Math.abs(r.meanY - R.cpu.meanY).toFixed(3) + ' m' : '';
      R.speed = R.gpu.ms ? +(R.cpu.ms/R.gpu.ms).toFixed(2) : 0;
      if (typeof gpuShow === 'function') gpuShow();
    }, function(e){ R.state = 'failed'; R.error = String(e && e.message || e).slice(0, 200); if (typeof gpuShow === 'function') gpuShow(); });
  };
})();
