/* Afterstreet benchmark (0.120.0). Open play.html?bench and it plays a fixed tour of Springfield on its own: a suburb by the safe house, a walk,
   crossing into the next square, the city centre round Park Central Square, a walk there and a drive. Nothing is saved to your game.
   It measures frame times, how long the update and drawing take, draw calls, triangles, loading times and memory, then shows the result,
   keeps it on the device and, if a GitHub token is set (Menu > Report a bug > Sending settings), sends it to benchmarks/ in the repo.
   Address options: &q=0|1|2 detail (Low, Normal, High; default: what this device would pick), &send=1 send without asking, &quick=1 shorter stages,
   &close=1 close the tab when done (for unattended runs), &label=text a name for the device (kept on the device after the first time). */
(function(){
  var Q = location.search, arg = function(k){ var m = new RegExp('[?&]' + k + '=([^&]*)').exec(Q); return m ? decodeURIComponent(m[1]) : null; };
  var STAGE_S = arg('quick') ? 8 : 15, WARM_S = 2;
  var B = window.BENCH = {stages:[], cur:null, on:false, dc:0, tri:0, tu:0, tr:0, log:[]};
  var label = arg('label'); try { if (label) localStorage.setItem('lastblock:benchlabel', label); else label = localStorage.getItem('lastblock:benchlabel') || ''; } catch (e){}
  /* nothing a benchmark does is kept in the player's game */
  window.saveNow = function(){}; window.saveRegions = function(){};
  try { window.writeSave = function(){}; } catch (e){}
  /* count what is drawn */
  var gp = WebGLRenderingContext.prototype, da = gp.drawArrays, de = gp.drawElements;
  gp.drawArrays = function(m, f, c){ if (B.on){ B.dc++; if (m === 4) B.tri += c/3; } return da.apply(this, arguments); };
  gp.drawElements = function(m, c){ if (B.on){ B.dc++; if (m === 4) B.tri += c/3; } return de.apply(this, arguments); };
  /* time the game's own work each frame */
  var U0 = window.update, R0 = window.render;
  window.update = function(dt){ var t = performance.now(); var r = U0.apply(this, arguments); B.tu += performance.now() - t; return r; };
  window.render = function(){ var t = performance.now(); var r = R0.apply(this, arguments); B.tr += performance.now() - t; return r; };
  var lastTs = 0;
  function tick(ts){
    requestAnimationFrame(tick);
    if (!B.cur || !running){ lastTs = ts; B.dc = B.tri = B.tu = B.tr = 0; return; }
    var S = B.cur, d = lastTs ? ts - lastTs : 0; lastTs = ts;
    if (P){ P.hp = 100; P.bleed = 0; P.hunger = Math.max(P.hunger || 0, 90); P.thirst = Math.max(P.thirst || 0, 90); P.rest = 100; }
    if (S.drive) S.drive(d/1000);
    if (S.t0 === undefined){ S.t0 = ts; }
    var age = (ts - S.t0)/1000;
    if (age > WARM_S && d > 0){ S.ft.push(d); S.dc += B.dc; S.tri += B.tri; S.tu += B.tu; S.tr += B.tr; S.n++; }
    B.dc = B.tri = B.tu = B.tr = 0;
    if (age > WARM_S + STAGE_S){ var r = S.done; B.cur = null; r(); }
  }
  requestAnimationFrame(tick);
  function stage(name, drive){ return new Promise(function(res){ B.on = true; var me = {name:name, ft:[], dc:0, tri:0, tu:0, tr:0, n:0, drive:drive}; me.done = function(){ B.stages.push(sum(me)); res(); }; B.cur = me; status('Measuring: ' + name); }); }
  function pct(a, p){ if (!a.length) return 0; var s = a.slice().sort(function(x, y){ return x - y; }); return s[Math.min(s.length - 1, Math.floor(p*s.length))]; }
  function heap(){ return performance.memory ? Math.round(performance.memory.usedJSHeapSize/1e6) : null; }
  function sum(S){ var n = S.ft.length || 1, tot = S.ft.reduce(function(a, b){ return a + b; }, 0);
    return {stage:S.name, frames:S.ft.length, fps:Math.round(1000*n/(tot || 1)*10)/10, p50:r1(pct(S.ft, 0.5)), p95:r1(pct(S.ft, 0.95)), p99:r1(pct(S.ft, 0.99)), worst:r1(Math.max.apply(null, S.ft.concat([0]))),
      long:S.ft.filter(function(x){ return x > 50; }).length, updMs:r1(S.tu/(S.n || 1)), drawMs:r1(S.tr/(S.n || 1)), calls:Math.round(S.dc/(S.n || 1)), tris:Math.round(S.tri/(S.n || 1)), heapMB:heap(),
      aliens:zombies ? zombies.length : 0, buildings:world && world.buildings ? world.buildings.length : 0}; }
  function r1(v){ return Math.round(v*10)/10; }
  function status(t){ var e = document.getElementById('benchSt'); if (!e){ e = document.createElement('div'); e.id = 'benchSt'; e.style.cssText = 'position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:95;background:rgba(0,0,0,.72);color:#fff;font:600 12px ui-monospace,Menlo,monospace;padding:4px 10px;border-radius:6px;pointer-events:none'; document.body.appendChild(e); } e.textContent = 'Benchmark · ' + t; }
  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  async function until(f, ms){ var t = Date.now(); while (!f() && Date.now() - t < (ms || 120000)) await wait(100); return f(); }
  function spin(rate){ return function(dt){ P.yaw += rate*dt; P.pitch = -0.05; }; }
  function walk(){ var t = 0; return function(dt){ t += dt; keys = keys || {}; keys.KeyW = true; keys.ShiftLeft = false; P.yaw += Math.sin(t*0.5)*0.4*dt; }; }
  function stopKeys(){ try { keys = {}; } catch (e){} }
  function gpu(){ try { var x = gl.getExtension('WEBGL_debug_renderer_info'); return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e){ return ''; } }
  function device(){ return {label:label, ua:navigator.userAgent, screen:screen.width + 'x' + screen.height, view:innerWidth + 'x' + innerHeight, dpr:devicePixelRatio, cores:navigator.hardwareConcurrency || null, memGB:navigator.deviceMemory || null, gpu:gpu(), touch:!!touchMode, wasm:!!(window.CORE), quality:el('qual').value, rscale:typeof RSCALE !== 'undefined' ? RSCALE : 1, fcap:typeof FCAP !== 'undefined' ? FCAP : 0, art:typeof ARTSET !== 'undefined' ? ARTSET : '', file:location.protocol === 'file:'}; }
  async function load(fn, name){ var t = performance.now(); await fn(); await until(function(){ return running && !zoneBusy; }, 180000); await wait(800); var s = Math.round((performance.now() - t)/100)/10; B.log.push({load:name, seconds:s, heapMB:heap(), buildings:world.buildings.length}); return s; }
  function nearRoad(){ var best = null, bd = 1e9; world.roads.forEach(function(r){ if (r.kind !== 'road' && r.kind !== 'residential' && !(r.w >= 5)) return; for (var i = 0; i + 3 < r.pts.length; i += 2){ var d = Math.hypot(r.pts[i] - P.x, r.pts[i+1] - P.y); if (d < bd){ bd = d; best = [r.pts[i], r.pts[i+1], Math.atan2(r.pts[i+3] - r.pts[i+1], r.pts[i+2] - r.pts[i])]; } } }); return best; }
  function onRoad(){ var q = nearRoad(); if (q){ P.x = q[0]; P.y = q[1]; P.yaw = q[2]; P.inside = null; P.lvl = 0; P.roof = null; } }
  async function run(){
    status('starting'); await until(function(){ return typeof SPRING !== 'undefined' && SPRING && typeof glOK !== 'undefined'; }, 30000);
    if (!glOK){ status('WebGL is not available on this device'); return; }
    if (arg('q') !== null && el('qual').querySelector('option[value="' + arg('q') + '"]')) el('qual').value = arg('q');
    var t0 = Date.now(), lat0 = SPRING.lat || 37.2089, lon0 = SPRING.lon || -93.2923;
    /* 1: a suburb on the edge of town (Springfield E1 S1, where the iPhone first crashed) */
    await load(function(){ return enterZone(SPRING, 37.1418, -93.2575, 0, null, false); }, 'suburb square');
    onRoad(); await stage('suburb, standing and looking round', spin(0.5));
    await stage('suburb, walking', walk()); stopKeys();
    /* 2: across the square edge into the city square (E0 S1) */
    var lt = await load(function(){ var c = world.core; P.x = c.x0 + 2; return zoneTravel(); }, 'crossing into the city square');
    onRoad(); await stage('city square after crossing, looking round', spin(0.5));
    /* 3: the city centre */
    await load(function(){ return enterZone(SPRING, lat0, lon0, 0, null, false); }, 'city centre');
    onRoad(); await stage('city centre, looking round', spin(0.5));
    await stage('city centre, walking', walk()); stopKeys();
    /* 4: driving, if there is a car near */
    var car = null, cd = 120; (world.vehicles || []).forEach(function(v){ if (!v.t || v.kind === 'truck' || v.dead || v.burnt) return; var d = Math.hypot(v.x - P.x, v.y - P.y); if (d < cd){ cd = d; car = v; } });
    if (car){ try { onRoad(); var q = nearRoad(); car.x = P.x; car.y = P.y; car.yaw = q ? q[2] : car.yaw; car.fuel = 9999; mount(car); } catch (e){} await stage('city centre, driving', function(dt){ keys.KeyW = true; P.yaw += 0.15*dt; }); stopKeys(); }
    var out = {kind:'afterstreet-benchmark', build:BUILD, when:new Date().toISOString(), seconds:Math.round((Date.now() - t0)/1000), device:device(), loads:B.log, stages:B.stages};
    finish(out);
  }
  function finish(out){
    running = false; B.on = false; status('done');
    try { var L = JSON.parse(localStorage.getItem('lastblock:bench') || '[]'); L.push(out); localStorage.setItem('lastblock:bench', JSON.stringify(L.slice(-10))); } catch (e){}
    var box = document.createElement('div'); box.style.cssText = 'position:fixed;inset:0;z-index:96;background:rgba(20,18,17,.94);color:#f5ead8;font:13px/1.4 ui-monospace,Menlo,monospace;overflow:auto;padding:16px';
    var rows = out.stages.map(function(s){ return '<tr><td>' + s.stage + '</td><td>' + s.fps + '</td><td>' + s.p95 + '</td><td>' + s.worst + '</td><td>' + s.long + '</td><td>' + s.updMs + '</td><td>' + s.drawMs + '</td><td>' + s.calls + '</td><td>' + Math.round(s.tris/1000) + 'k</td><td>' + (s.heapMB === null ? '-' : s.heapMB) + '</td></tr>'; }).join('');
    var lds = out.loads.map(function(l){ return l.load + ': ' + l.seconds + ' s'; }).join(' · ');
    box.innerHTML = '<h2 style="font:700 18px sans-serif;margin:0 0 6px">Benchmark done</h2><div>' + (out.device.label ? out.device.label + ' · ' : '') + out.device.gpu + ' · ' + out.device.view + ' at ' + out.device.dpr + 'x · detail ' + ['Low', 'Normal', 'High'][+out.device.quality] + (out.device.rscale < 1 ? ' · drawn at ' + Math.round(out.device.rscale*100) + '%' : '') + (out.device.fcap ? ' · capped at ' + out.device.fcap + ' fps' : '') + ' · build ' + out.build + '</div><div style="margin:6px 0">' + lds + '</div>' +
      '<table style="border-collapse:collapse;width:100%"><tr style="text-align:left"><th>Stage</th><th>fps</th><th>95% ms</th><th>worst ms</th><th>&gt;50 ms</th><th>update ms</th><th>draw ms</th><th>calls</th><th>triangles</th><th>memory MB</th></tr>' + rows + '</table>' +
      '<div style="margin-top:10px"><label>Device name <input id="bnLabel" value="' + (out.device.label || '').replace(/"/g, '') + '" placeholder="e.g. iPhone 11"></label> <button id="bnSend">Send to the repo</button> <button id="bnDl">Download</button> <button id="bnAgain">Run again</button> <button id="bnBack">Back to the game</button></div><div id="bnSt" style="margin-top:6px"></div>';
    document.body.appendChild(box);
    var st = function(t){ document.getElementById('bnSt').textContent = t; };
    var send = async function(){ out.device.label = document.getElementById('bnLabel').value.trim(); try { localStorage.setItem('lastblock:benchlabel', out.device.label); } catch (e){}
      var cfg = {}; try { cfg = JSON.parse(localStorage.getItem('lastblock:bugcfg')) || {}; } catch (e){}
      if (!cfg.repo || !cfg.tok){ st('Set the repository and token once under Menu > Report a bug > Sending settings, or use Download.'); return false; }
      var name = 'benchmarks/' + out.when.replace(/[-:T]/g, '').slice(0, 14) + '-' + (out.device.label || 'device').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '.json';
      st('Sending...'); try { await bugPut(cfg.repo, cfg.tok, name, bugB64(JSON.stringify(out, null, 1)), 'Benchmark ' + (out.device.label || '') + ' ' + out.build); st('Sent as ' + name + '.'); return true; } catch (e){ st((e.message || 'Could not send') + '. Use Download instead.'); return false; } };
    document.getElementById('bnSend').onclick = send;
    document.getElementById('bnDl').onclick = function(){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], {type:'application/json'})); a.download = 'afterstreet-bench-' + (out.device.label || 'device').replace(/[^A-Za-z0-9]+/g, '-') + '.json'; document.body.appendChild(a); a.click(); a.remove(); };
    document.getElementById('bnAgain').onclick = function(){ location.reload(); };
    document.getElementById('bnBack').onclick = function(){ location.href = location.pathname; };
    window.BENCH_RESULT = out;
    if (arg('send')) send().then(function(ok){ if (arg('close')) setTimeout(function(){ window.close(); }, 3000); });
    else if (arg('close')) setTimeout(function(){ window.close(); }, 3000);
  }
  run().catch(function(e){ status('stopped: ' + (e && e.message || e)); window.BENCH_RESULT = {error:String(e && e.message || e), stages:B.stages}; });
})();
