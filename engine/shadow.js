/* Afterstreet sun shadows (0.133.0). Classic script, loaded by play.html after render.js; the Maps Builder does not load it and has no shadows.
   How it works: each frame, before the world is drawn, the solid things near you are drawn once more, seen from the sun, into a depth picture (a depth texture on
   texture unit 6). The shared shader (render.js, "shad" and "shU") then looks each lit surface up in that picture: a surface the sun cannot reach drops to the shade
   tone of the toon bands. It is OFF unless asked for (Settings > Sun shadows, or ?shadows=1 on the address) and falls back to off when the graphics chip has no depth textures.
   0.133.1: the sun is the one in the sky. Each frame SHL is set from lightDir() in render.js, the same direction the toon bands and the sun disc use, so a lit side, its shadow and the sun
   you can see always agree. Shadows fade out as the sun gets low (a low sun throws shadows longer than the picture reaches) and with dusk, as before.
   Cost: a second, smaller drawing of what is near you, so it is a real cost on a phone. shadowMeasure() plays the same scene with shadows off and on and reports both frame rates.
   Casters: buildings (the plain far version beyond the map's own radius), trees (the tile meshes, and 0.133.2 the near full-size ones, which are drawn one at a time by drawNature), the
   bushes, rocks, logs and stumps lying about (SHN), street dressing, map props, last frame's dynamic mesh (vehicles, aliens, items, without the sky range), last frame's people and creatures
   (queued by drawPeople / drawCreature with shQ) and, 0.133.2, the shaped survivors' skinned buffer (svBuf, which includes you in third person and, in first person, your own body queued
   for the shadow only). The ground itself casts nothing. */
'use strict';
var SHD = {on:false, failed:'', size:0, R:0, tex:null, fb:null, rb:null, lvp:new Float32Array(16), qn:[], cur:[], ms:0, calls:0, live:false, result:null},
    SHL = [0, 1, 0],            /* towards the light: set every frame from lightDir() (render.js), the same direction the shader's bands use */
    SHZ = 230;                  /* the depth picture spans 2 x SHZ metres along the light, so tall towers still cast */
var SHN = /bush|shrub|rock|boulder|log|stump|thicket|sapling|sumac|berry/;   /* which small things cast a shadow */
/* map size and how far round you it reaches: by the detail level, so a phone on Low gets a small one */
function shadowCfg(){ var L = typeof QUAL !== 'undefined' && typeof QS !== 'undefined' ? QUAL.indexOf(QS) : 1; return L >= 2 ? {s:2048, R:80} : L === 1 ? {s:1024, R:60} : {s:1024, R:48}; }
function shBind(t){ gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, t || SHDUM); gl.activeTexture(gl.TEXTURE0); }
function shadowFree(){
  if (!gl) return; if (SHD.fb) gl.deleteFramebuffer(SHD.fb); if (SHD.tex) gl.deleteTexture(SHD.tex); if (SHD.rb) gl.deleteRenderbuffer(SHD.rb);
  SHD.fb = SHD.tex = SHD.rb = null; SHD.size = 0;
}
function shadowSet(on){ SHD.on = !!on; SHD.failed = ''; if (!on){ shadowFree(); SHD.cur = []; SHD.qn = []; } }
function shadowInit(){
  var cfg = shadowCfg(); if (SHD.fb && SHD.size === cfg.s) return true;
  shadowFree();
  var ex = gl.getExtension('WEBGL_depth_texture') || gl.getExtension('WEBKIT_WEBGL_depth_texture') || gl.getExtension('MOZ_WEBGL_depth_texture');
  if (!ex){ SHD.failed = 'this graphics chip has no depth textures'; return false; }
  var kinds = [gl.UNSIGNED_INT, gl.UNSIGNED_SHORT], k;
  for (k = 0; k < kinds.length; k++){
    var tex = gl.createTexture(), rb = gl.createRenderbuffer(), fb = gl.createFramebuffer();
    gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, cfg.s, cfg.s, 0, gl.DEPTH_COMPONENT, kinds[k], null);
    /* some chips want a colour attachment even for a depth-only picture; a small one costs 2 bytes a pixel */
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, cfg.s, cfg.s);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rb);
    var st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindRenderbuffer(gl.RENDERBUFFER, null); shBind(null);
    if (st === gl.FRAMEBUFFER_COMPLETE){ SHD.tex = tex; SHD.rb = rb; SHD.fb = fb; SHD.size = cfg.s; SHD.R = cfg.R; SHD.bits = k ? 16 : 24; return true; }
    gl.deleteFramebuffer(fb); gl.deleteTexture(tex); gl.deleteRenderbuffer(rb);
  }
  SHD.failed = 'the shadow picture could not be made on this graphics chip'; return false;
}
/* the sun's view: an orthographic box round the middle of the map, turned to the light, its sideways position snapped to whole texels so the shadows do not crawl as you walk */
function shadowMatrix(cx, cy, gy, R){
  var n = Math.hypot(SHL[0], SHL[1], SHL[2]), fw = [-SHL[0]/n, -SHL[1]/n, -SHL[2]/n], rl = Math.hypot(fw[2], fw[0]) || 1, r = [-fw[2]/rl, 0, fw[0]/rl],
      up = [r[1]*fw[2] - r[2]*fw[1], r[2]*fw[0] - r[0]*fw[2], r[0]*fw[1] - r[1]*fw[0]], tx = 2*R/SHD.size, c = [cx, gy, cy],
      px = r[0]*c[0] + r[1]*c[1] + r[2]*c[2], py = up[0]*c[0] + up[1]*c[1] + up[2]*c[2], pz = fw[0]*c[0] + fw[1]*c[1] + fw[2]*c[2],
      sx = Math.round(px/tx)*tx, sy = Math.round(py/tx)*tx, m = SHD.lvp;
  m[0] = r[0]/R; m[1] = up[0]/R; m[2] = fw[0]/SHZ; m[3] = 0; m[4] = r[1]/R; m[5] = up[1]/R; m[6] = fw[1]/SHZ; m[7] = 0; m[8] = r[2]/R; m[9] = up[2]/R; m[10] = fw[2]/SHZ; m[11] = 0;
  m[12] = -sx/R; m[13] = -sy/R; m[14] = -pz/SHZ; m[15] = 1;
}
function shFrom(o, first, end){
  if (!o) return; end = end === undefined ? o.n : Math.min(end, o.n); if (end <= first) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, o.vb); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.cb); gl.vertexAttribPointer(aC, 4, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.tb); gl.vertexAttribPointer(aT, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, first, end - first); SHD.calls++;
}
/* a person or creature drawn this frame is remembered for the next frame's shadow picture (one frame behind is not seen) */
function shQ(o, x, gy, y, yaw, sc){ if (SHD.on) SHD.qn.push([o, x, gy, y, yaw, sc || 1]); }
function shCasters(cx, cy, R){
  var lim = R*1.42, ex = lim + CH*0.75 + 60, NRr = QS.chunk + CH, i, g = world.gl;
  for (i = 0; i < g.chunks.length; i++){
    var ch = g.chunks[i], dx = Math.abs(ch.x - cx), dy = Math.abs(ch.y - cy); if (dx > ex || dy > ex) continue;
    var m = dx < lim && dy < lim ? (ch.g || ch.far) : (ch.far || (dx < NRr && dy < NRr ? ch.g : null)); if (m && m.n){ drawMesh(m); SHD.calls++; }
  }
  var tl = lim + TREE_T*0.75 + 30; if (g.trees) g.trees.forEach(function(o){ if (o.g && o.g.n && Math.abs(o.x - cx) < tl && Math.abs(o.y - cy) < tl){ drawMesh(o.g); SHD.calls++; } });
  var dl = lim + DRC*0.75 + 10; if (g.dr) for (i = 0; i < g.dr.length; i++){ var dq = g.dr[i]; if (dq.g && dq.g.n && Math.abs(dq.x - cx) < dl && Math.abs(dq.y - cy) < dl){ drawMesh(dq.g); SHD.calls++; } }
  var ml = lim + MPC*0.75 + 10; if (g.mp) for (i = 0; i < g.mp.length; i++){ var mq = g.mp[i]; if (mq.g && mq.g.n && Math.abs(mq.x - cx) < ml && Math.abs(mq.y - cy) < ml){ drawMesh(mq.g); SHD.calls++; } }
  /* 0.133.2: the near full-size trees (one draw each, not part of the tile meshes above) and the bigger small things around you: bushes, rocks, logs, stumps. Not the grass, ferns and flowers. No wind sway in the picture (a few cm) */
  if (typeof hiTrees !== 'undefined' && typeof NAT !== 'undefined' && NAT.pine && typeof natTex !== 'undefined' && natTex){
    for (i = 0; i < hiTrees.length; i++){ var tr = hiTrees[i]; if (!tr.alive || Math.abs(tr.x - cx) > lim || Math.abs(tr.y - cy) > lim) continue;
      var tm = NAT[treeVarKey(tr)] || NAT[treeKey(tr)]; if (!tm) continue; gl.uniform4f(U.inst, tr.x, hAt(tr.x, tr.y) - 0.1, tr.y, tr.yw); gl.uniform1f(U.iscl, tr.sc); drawMesh(tm); SHD.calls++; }
    if (typeof clutter !== 'undefined') for (i = 0; i < clutter.length; i++){ var cl = clutter[i]; if (!cl.m || !SHN.test(cl.nm) || Math.abs(cl.x - cx) > lim || Math.abs(cl.y - cy) > lim) continue;
      gl.uniform4f(U.inst, cl.x, cl.gy, cl.y, cl.yw); gl.uniform1f(U.iscl, cl.sc); drawMesh(cl.m); SHD.calls++; }
    gl.uniform4f(U.inst, 0, 0, 0, 0); gl.uniform1f(U.iscl, 1);
  }
  if (typeof dyn !== 'undefined' && dyn){   /* last frame's vehicles, aliens, survivors, items; the first part is the big ground fill, which casts nothing, and the sky range (clouds, moon, rain) is left out */
    var d0 = dyn.sk | 0, a0 = dyn.ska | 0, b0 = dyn.skb | 0;
    if (b0 > a0 && a0 >= d0){ shFrom(dyn, d0, a0); shFrom(dyn, b0); } else shFrom(dyn, d0);
  }
  /* the shaped survivors (you in third person, other players, people): last frame's skinned buffer, the part after the shadow-only ones included (your own body in first person) */
  if (typeof svBuf !== 'undefined' && svBuf && svBuf.sn > 0){ var SG = svBuf.g, sn0 = SG.n; SG.n = svBuf.sn; gl.uniform4f(U.inst, 0, 0, 0, 0); gl.uniform1f(U.iscl, 1); drawMesh(SG); SHD.calls++; SG.n = sn0; }
  for (i = 0; i < SHD.cur.length; i++){ var q = SHD.cur[i]; gl.uniform4f(U.inst, q[1], q[2], q[3], q[4]); gl.uniform1f(U.iscl, q[5]); drawMesh(q[0]); SHD.calls++; }
  gl.uniform4f(U.inst, 0, 0, 0, 0); gl.uniform1f(U.iscl, 1);
}
function shadowOff(){ if (!gl || !prog3) return; gl.useProgram(prog3); gl.uniform4f(U.shU, 0, 0, 0, 0); shBind(null); SHD.live = false; }
/* called first thing in drawScene */
function shadowPass(cam, env){
  if (!SHD.on){ if (SHD.live) shadowOff(); return; }
  SHD.cur = SHD.qn; SHD.qn = [];
  SHL = lightDir(env.hour, env.dark);
  /* strength: full by day, fading out as it darkens (a moonlit town has no sun to shadow it), a little less under cloud, and none while the sun is low */
  var str = Math.max(0, 1 - env.dark*1.15)*Math.min(1, env.wd + 0.1), el = Math.min(1, Math.max(0, (SHL[1] - 0.12)/0.26)); str *= el*el*(3 - 2*el);
  if (SHD.failed || env.noShadow || str < 0.02 || typeof world === 'undefined' || !world || !world.gl){ if (SHD.live) shadowOff(); return; }
  if (!SHD.fb || SHD.size !== shadowCfg().s){ if (!shadowInit()){ shadowOff(); return; } }
  var t0 = performance.now(), R = SHD.R = shadowCfg().R, f = cam.f, hl = Math.hypot(f[0], f[2]) || 1, sx = cam.cx + f[0]/hl*R*0.3, sy = cam.cy + f[2]/hl*R*0.3,
      gy = typeof groundAt === 'function' ? groundAt(sx, sy) : 0;
  shadowMatrix(sx, sy, gy, R); SHD.calls = 0;
  gl.useProgram(prog3); gl.bindFramebuffer(gl.FRAMEBUFFER, SHD.fb); gl.viewport(0, 0, SHD.size, SHD.size); gl.colorMask(false, false, false, false); gl.clear(gl.DEPTH_BUFFER_BIT);
  shBind(null);   /* the depth picture must not be bound as a texture while it is being drawn into */
  gl.uniform1f(U.shad, 1); gl.uniformMatrix4fv(U.vp, false, SHD.lvp); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2);
  shCasters(sx, sy, R);
  gl.disable(gl.POLYGON_OFFSET_FILL); gl.uniform1f(U.shad, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.colorMask(true, true, true, true); gl.viewport(0, 0, W, H);
  shBind(SHD.tex); gl.uniformMatrix4fv(U.lvp, false, SHD.lvp);
  gl.uniform4f(U.shU, str, 1/SHD.size, 0.00035, R);
  SHD.live = true; SHD.ms = performance.now() - t0;
}
/* plays the scene for 4 s with shadows off and 4 s with them on, standing still, and reports how long a frame took each way (the first fifth of each run is dropped as warm-up) */
function shadowMeasure(done){
  if (typeof running === 'undefined' || !running){ if (done) done('Start playing first; this measures the scene you are looking at.'); return; }
  var was = SHD.on, out = {};
  function stats(ts){ ts = ts.slice(Math.floor(ts.length*0.2)); if (!ts.length) return {fps:0, ms:0, p95:0}; var s = ts.slice().sort(function(a, b){ return a - b; }), m = ts.reduce(function(a, b){ return a + b; }, 0)/ts.length; return {fps:Math.round(1000/m), ms:+m.toFixed(1), p95:+s[Math.floor(s.length*0.95)].toFixed(1)}; }
  function run(on, cb){
    shadowSet(on); var ts = [], last = 0, t0 = 0;
    (function tick(t){ if (!last){ last = t; t0 = t; } else ts.push(t - last); last = t; if (t - t0 < 4000) requestAnimationFrame(tick); else cb(stats(ts)); })(performance.now());
  }
  run(false, function(a){ out.off = a; run(true, function(b){ out.on = b; shadowSet(was); SHD.result = out;
    var msg = 'Without shadows ' + a.fps + ' frames a second (' + a.ms + ' ms a frame, slowest 1 in 20: ' + a.p95 + ' ms). With shadows ' + b.fps + ' (' + b.ms + ' ms, slowest 1 in 20: ' + b.p95 + ' ms)' +
      (b.fps >= a.fps - 2 && b.ms - a.ms < 1.5 ? '. No cost you can measure here: the screen was the limit.' : '. Shadows cost ' + (b.ms - a.ms).toFixed(1) + ' ms a frame.') +
      ' Map ' + SHD.size + ', ' + (SHD.R*2) + ' m wide, ' + SHD.calls + ' draws, ' + (SHD.bits || '?') + '-bit depth.';
    out.text = msg; if (done) done(msg); }); });
}
