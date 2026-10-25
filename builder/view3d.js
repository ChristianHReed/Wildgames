/* AfterStreet Maps Builder: the 3D view. Fly over the built map, or walk it at street level, drawn by the game's own engine (engine/render.js),
   so it looks exactly as it will in the game. The art and engine files load the first time the view opens.
   Controls: keyboard and mouse, touch (stick, drag to look, up/down buttons), Apple Pencil (drag to look), game controller.
   Classic script. Uses builder/host.js for the names the engine expects from its page. */
(function(){
'use strict';
var V3 = window.View3D = {env:{hour:10, season:1}, open:open, close:close, isOpen:function(){ return on; }};
var L3 = {}; window.BLIB.build(L3);   /* only for reading squares from the builder's storage */
var on = false, ready = null, cur = null, mode = 'fly', flyH = 60, last = 0, intT = 0, dynB = null, busy = false, noteT = 0, onClose = null;
var riv = [], sculpt = false, tool = 'raise', brushR = 60, brushK = 0.5, undoSt = [], redoSt = [], pend = [], working = false, holdT = null, lastCam = null;
var keysDown = {}, look = null, stick = {x:0, y:0}, upDown = 0;
var $ = function(id){ return document.getElementById(id); };
V3.note = function(msg, secs){ var n = $('v3note'); if (!n) return; n.textContent = msg; n.style.opacity = msg ? 1 : 0; clearTimeout(noteT); if (msg) noteT = setTimeout(function(){ n.style.opacity = 0; }, (secs || 3)*1000); };

/* ---------------- the overlay ---------------- */
function makeOverlay(){
  if ($('v3')) return;
  var d = document.createElement('div'); d.id = 'v3'; d.className = 'hidden';
  d.innerHTML = '<canvas id="game"></canvas>' +
    '<div id="v3top"><button id="v3back" class="sm">&larr; Builder</button><span class="v3sp"></span>' +
    '<button id="v3fly" class="sm on">Fly</button><button id="v3walk" class="sm alt">Walk</button>' +
    '<label class="v3lab">Time <input id="v3hour" type="range" min="0" max="24" step="0.25" value="10"><b id="v3hourV"></b></label>' +
    '<select id="v3sea"><option value="0">Spring</option><option value="1" selected>Summer</option><option value="2">Autumn</option><option value="3">Winter</option></select>' +
    '<button id="v3sculpt" class="sm alt">Sculpt</button><button id="v3help" class="sm alt">?</button></div>' +
    '<div id="v3tools" class="hidden"><b>Sculpt the ground</b><div class="v3row" id="v3tt">' +
    '<button data-t="raise" class="sm on">Raise</button><button data-t="lower" class="sm alt">Lower</button><button data-t="smooth" class="sm alt">Smooth</button><button data-t="level" class="sm alt">Level</button><button data-t="basin" class="sm alt">Lake</button><button data-t="river" class="sm alt">River</button></div>' +
    '<div class="v3row hidden" id="v3riv"><button id="v3rdone" class="sm">Finish river</button><button id="v3rcancel" class="sm alt">Cancel</button><span id="v3rn"></span></div>' +
    '<label>Brush size <input id="v3r" type="range" min="10" max="250" step="5" value="60"><b id="v3rV">60 m</b></label>' +
    '<label>Strength <input id="v3k" type="range" min="0.1" max="1" step="0.05" value="0.5"><b id="v3kV">0.5</b></label>' +
    '<div class="v3row"><button id="v3undo" class="sm alt">Undo</button><button id="v3redo" class="sm alt">Redo</button><span id="v3cnt"></span></div>' +
    '<small>Tap or click the ground to sculpt; hold still to keep going. Lake: one tap, brush size is the size of the lake. River: tap points downstream, then Finish; brush size picks stream, canal or river. Drag to look around. Your changes are kept apart from the map data, so building the map again keeps them.</small></div>' +
    '<div id="v3where"></div><div id="v3note"></div>' +
    '<div id="v3helpBox" class="hidden"><b>Moving around</b><br>' +
    '<b>Keyboard:</b> W A S D or arrows to move, E up and Q down (flying), Shift to go faster, F to switch Fly and Walk, drag the mouse to look, wheel to change height.<br>' +
    '<b>Touch:</b> the stick bottom left moves, drag anywhere else to look, the arrows on the right go up and down.<br>' +
    '<b>Game controller:</b> left stick moves, right stick looks, triggers go up and down, A switches Fly and Walk.<br>' +
    'Fly past the edge of a map square and the next one loads. Walking keeps you on the ground and out of walls.</div>' +
    '<div id="v3stick"><i></i></div><div id="v3ud"><button id="v3up" class="alt">&#9650;</button><button id="v3dn" class="alt">&#9660;</button></div>';
  document.body.appendChild(d);
  var st = document.createElement('style'); st.textContent =
    '#v3{position:fixed;inset:0;z-index:50;background:#9db7c9;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '#v3 #game{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}' +
    '#v3top{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top));background:linear-gradient(rgba(32,30,29,.55),rgba(32,30,29,0))}' +
    '#v3top .v3sp{flex:1}.v3lab{color:#fff;font-size:13px;display:flex;gap:6px;align-items:center;text-shadow:0 1px 2px #000}.v3lab input{width:120px}' +
    '#v3top select{font-size:13px;padding:5px}' +
    '#v3where{position:absolute;left:12px;bottom:12px;color:#fff;font:12px var(--mono);text-shadow:0 1px 2px #000;pointer-events:none}' +
    '#v3note{position:absolute;left:50%;top:64px;transform:translateX(-50%);background:rgba(32,30,29,.78);color:#f5ead8;padding:7px 14px;border-radius:999px;font-size:14px;opacity:0;transition:opacity .3s;pointer-events:none;max-width:90vw;text-align:center}' +
    '#v3helpBox{position:absolute;right:12px;top:64px;max-width:360px;background:rgba(251,243,228,.96);border:1px solid var(--edge);border-radius:6px;padding:10px 12px;font-size:13px;line-height:1.5;box-shadow:var(--shadow)}' +
    '#v3stick{position:absolute;left:24px;bottom:44px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.5);display:none;touch-action:none}' +
    '#v3stick i{position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.75)}' +
    '#v3ud{position:absolute;right:20px;bottom:44px;display:none;flex-direction:column;gap:12px}#v3ud button{width:56px;height:56px;font-size:20px;padding:0}' +
    '#v3tools{position:absolute;left:12px;top:64px;width:250px;background:rgba(251,243,228,.96);border:1px solid var(--edge);border-radius:6px;padding:10px 12px;font-size:13px;display:flex;flex-direction:column;gap:8px;box-shadow:var(--shadow)}' +
    '#v3tools.hidden{display:none}#v3tools label{display:flex;gap:6px;align-items:center}#v3tools label input{flex:1;min-width:0}.v3row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}#v3tools small{color:#6b5f52;line-height:1.35}' +
    '.touch #v3stick{display:block}.touch #v3ud{display:flex}.touch.walk #v3ud{display:none}';
  document.head.appendChild(st);
  if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) d.classList.add('touch');
  $('v3back').onclick = close;
  $('v3fly').onclick = function(){ setMode('fly'); }; $('v3walk').onclick = function(){ setMode('walk'); };
  $('v3hour').oninput = function(){ V3.env.hour = +this.value; hourTxt(); }; hourTxt();
  $('v3sea').onchange = function(){ V3.env.season = +this.value; };
  $('v3help').onclick = function(){ $('v3helpBox').classList.toggle('hidden'); };
  $('v3sculpt').onclick = function(){ sculpt = !sculpt; $('v3tools').classList.toggle('hidden', !sculpt); this.className = 'sm ' + (sculpt ? 'on' : 'alt'); if (sculpt){ if (mode !== 'fly') setMode('fly'); V3.note('Sculpt: tap the ground.', 3); refreshCount(); } };
  Array.prototype.forEach.call($('v3tt').children, function(b){ b.onclick = function(){ tool = b.getAttribute('data-t'); riv = []; toolUI(); Array.prototype.forEach.call($('v3tt').children, function(o){ o.className = 'sm ' + (o === b ? 'on' : 'alt'); }); }; });
  $('v3r').oninput = function(){ brushR = +this.value; $('v3rV').textContent = brushR + ' m'; }; $('v3k').oninput = function(){ brushK = +this.value; $('v3kV').textContent = brushK; };
  $('v3rdone').onclick = finishRiver; $('v3rcancel').onclick = function(){ riv = []; toolUI(); }; $('v3undo').onclick = undo; $('v3redo').onclick = redo;
  /* look: drag with mouse, finger or pencil on the view */
  var cvs = $('game');
  cvs.addEventListener('pointerdown', function(e){ cvs.setPointerCapture(e.pointerId); look = {id:e.pointerId, x:e.clientX, y:e.clientY, x0:e.clientX, y0:e.clientY, moved:false, t:performance.now()}; cvs.style.cursor = 'grabbing';
    if (sculpt){ var lk = look; holdT = setTimeout(function(){ if (look !== lk || lk.moved) return; lk.held = true; dabAt(lk.x, lk.y, true); holdT = setInterval(function(){ if (look === lk && !lk.moved){ dabAt(lk.x, lk.y, true); endStroke(); } }, 400); }, 450); } });
  cvs.addEventListener('pointermove', function(e){ if (!look || look.id !== e.pointerId) return; if (Math.hypot(e.clientX - look.x0, e.clientY - look.y0) > 7) look.moved = true; var k = e.pointerType === 'mouse' ? 0.004 : 0.006; P.yaw += (e.clientX - look.x)*k; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - (e.clientY - look.y)*k)); look.x = e.clientX; look.y = e.clientY; });
  var lookEnd = function(e){ if (look && look.id === e.pointerId){
      var tap = sculpt && !look.moved && !look.held && e.type === 'pointerup'; clearTimeout(holdT); clearInterval(holdT); holdT = null;
      if (tap) dabAt(look.x, look.y, false); if (sculpt && (tap || look.held)) endStroke();
      look = null; cvs.style.cursor = 'grab'; } };
  cvs.addEventListener('pointerup', lookEnd); cvs.addEventListener('pointercancel', lookEnd);
  cvs.addEventListener('wheel', function(e){ e.preventDefault(); if (mode === 'fly') flyH = Math.max(2, Math.min(1500, flyH*Math.pow(1.0012, e.deltaY))); }, {passive:false});
  /* touch stick */
  var sk = $('v3stick'), knob = sk.firstChild, sid = null;
  var skMove = function(e){ var r = sk.getBoundingClientRect(), x = (e.clientX - r.left - 60)/50, y = (e.clientY - r.top - 60)/50, l = Math.hypot(x, y); if (l > 1){ x /= l; y /= l; } stick.x = x; stick.y = y; knob.style.left = (40 + x*40) + 'px'; knob.style.top = (40 + y*40) + 'px'; };
  sk.addEventListener('pointerdown', function(e){ sid = e.pointerId; sk.setPointerCapture(sid); skMove(e); e.stopPropagation(); });
  sk.addEventListener('pointermove', function(e){ if (e.pointerId === sid) skMove(e); });
  var skEnd = function(e){ if (e.pointerId !== sid) return; sid = null; stick.x = stick.y = 0; knob.style.left = knob.style.top = '40px'; }; sk.addEventListener('pointerup', skEnd); sk.addEventListener('pointercancel', skEnd);
  [['v3up', 1], ['v3dn', -1]].forEach(function(b){ var el = $(b[0]); el.addEventListener('pointerdown', function(e){ e.stopPropagation(); upDown = b[1]; }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(ev){ el.addEventListener(ev, function(){ upDown = 0; }); }); });
  window.addEventListener('keydown', function(e){ if (!on || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; keysDown[e.code] = true; if (e.code === 'KeyF') setMode(mode === 'fly' ? 'walk' : 'fly'); if (e.code === 'Escape') close(); if (/^(Arrow|Space)/.test(e.code)) e.preventDefault(); });
  window.addEventListener('keyup', function(e){ keysDown[e.code] = false; });
  window.addEventListener('blur', function(){ keysDown = {}; });
}
function hourTxt(){ var h = V3.env.hour, hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h))*60); $('v3hourV').textContent = (hh % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? ' am' : ' pm'); }
function setMode(m){
  mode = m; $('v3fly').className = 'sm ' + (m === 'fly' ? 'on' : 'alt'); $('v3walk').className = 'sm ' + (m === 'walk' ? 'on' : 'alt'); $('v3').classList.toggle('walk', m === 'walk');
  if (m === 'walk'){ P.pitch = Math.max(-0.4, Math.min(0.4, P.pitch)); if (typeof collide === 'function' && world) collide(P, 0.35); V3.note('Walking. F or the Fly button to fly again.'); }
  else { if (flyH < 30) flyH = 30; V3.note('Flying. E and Q (or the arrows) go up and down.'); }
}

/* ---------------- loading the art and the engine, once ---------------- */
function load(src){ return new Promise(function(res, rej){ var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function(){ rej(new Error('missing ' + src)); }; document.head.appendChild(s); }); }
async function boot(){
  makeOverlay();
  await load('builder/host.js');
  /* the art the engine draws with (as play.html loads it, minus people, creatures and sound). Only the textures and building art are required:
     if another file is missing (the art changes over time), the view still opens without it */
  var set = ARTSET, A = ['dataver', 'btex', 'models', 'nature', 'vehicles', 'shaped/shapes', 'shaped/props', 'shaped/buildings', 'shaped/ground', 'shaped/machines', 'shaped/walls', 'shaped/power', set + '/atlas', set + '/atlas3'];
  var NEED = {btex:1, 'shaped/shapes':1, 'shaped/buildings':1}; NEED[set + '/atlas'] = 1; NEED[set + '/atlas3'] = 1;
  for (var i = 0; i < A.length; i++){ V3.note('Loading the art: ' + Math.round(i/A.length*100) + '%', 30); try { await load('assets/' + A[i] + '.js'); } catch (e){ if (NEED[A[i]]) throw e; if (window.console) console.warn('3D view: skipped missing assets/' + A[i] + '.js'); } }
  var E = ['core', 'mapparse', 'world', 'meshes', 'buildings', 'interiors', 'collision', 'render'];
  for (var j = 0; j < E.length; j++) await load('engine/' + E[j] + '.js');
  glOK = initGL();
  if (!glOK) throw new Error('this device could not start 3D drawing (WebGL)');
}

/* ---------------- opening a square of the built map ---------------- */
async function open(o){   /* o: {proj, region:{id,name,lat,lon,dLat,dLon}, lat, lon, yaw}; onClose: called when going back */
  cur = {proj:o.proj, region:o.region}; undoSt = []; redoSt = []; pend = []; onClose = o.onClose || null;
  makeOverlay(); $('v3').classList.remove('hidden'); on = true; document.body.style.overflow = 'hidden';
  try {
    if (!ready) ready = boot(); await ready;
    if (typeof resize === 'function') resize();
    await enterAt(o.lat, o.lon, o.yaw || 0, true);
    V3.note('Drag to look around. ? shows the controls.', 4);
    last = performance.now(); requestAnimationFrame(frame);
  } catch (e){ ready = ready && e.message && /missing|WebGL/.test(e.message) ? null : ready; V3.note('Could not open the 3D view: ' + e.message + '.', 8); }
}
function close(){ on = false; $('v3').classList.add('hidden'); document.body.style.overflow = ''; keysDown = {}; if (onClose) onClose(world && world.geo ? llOf(P.x, P.y) : null); }
function llOf(x, y){ var g = world.geo; return [g.lon0 + x/g.kx, g.lat0 - y/g.ky]; }
async function enterAt(lat, lon, yaw, first){
  var R = cur.region, i = Math.floor((lon - R.lon)/R.dLon + 0.5), j = Math.floor((lat - R.lat)/R.dLat + 0.5);
  var text = await L3.squareText(cur.proj, i, j);
  if (!text){ V3.note('That part of the map has not been built (outside your area).', 4); return false; }
  if (first) V3.note('Building the 3D world for this square...', 30);
  await new Promise(function(r){ setTimeout(r, 30); });   /* let the note show before the heavy work */
  var raw = parseText(text); raw.name = ''; raw.spawn = [lon, lat]; if (!raw.zone){ raw.zone = {w:R.lon + (i - 0.5)*R.dLon, e:R.lon + (i + 0.5)*R.dLon, s:R.lat + (j - 0.5)*R.dLat, n:R.lat + (j + 0.5)*R.dLat}; }
  inRun = false;
  buildWorld(raw, R.name + ' (' + (i >= 0 ? 'E' + i : 'W' + (-i)) + ' ' + (j >= 0 ? 'N' + j : 'S' + (-j)) + ')'); prep3D();
  /* the parts of the game's start-up that the drawing needs (play.html startRun), with nothing of the game's own rules */
  var w = world;
  w.edits = {breach:{}, col:{}, gone:{}, walls:[], beds:{}, bases:{}, plant:{s:0}, chests:[], ports:{}, picked:{}, taps:{}, moved:{}, junkv:{}, blocks:{}, gens:[], truck:{p:{}, away:0}, colls:[], plots:[], benches:[], boots:{}}; w.wallSegs = [];
  w.nests = {}; w.burst = {}; w.nestNew = {}; w.lastDay = 0;
  hiTrees = []; clutter = []; clutKey = ''; w.trees.forEach(function(t){ t.hi = false; }); buildTrees();
  var g = w.geo; P.x = (lon - g.lon0)*g.kx; P.y = -(lat - g.lat0)*g.ky; P.yaw = yaw; P.inside = null; P.lvl = 0; P.gy = 0;
  if (mode === 'walk' && typeof collide === 'function') collide(P, 0.35);
  inRun = true; manageInteriors(40);
  cur.ij = [i, j]; cur.name = w.name;
  if (first) V3.note('', 0);
  return true;
}


/* ---------------- sculpting (builder version 2) ---------------- */
/* where a screen point meets the bare ground: step along the ray, then narrow down */
function groundHit(px, py){
  var c = lastCam; if (!c) return null; var cv = $('game').getBoundingClientRect(), nx = ((px - cv.left)/cv.width)*2 - 1, ny = 1 - ((py - cv.top)/cv.height)*2;
  var d = [c.f[0] + c.s[0]*nx*c.tv*c.asp + c.u[0]*ny*c.tv, c.f[1] + c.s[1]*nx*c.tv*c.asp + c.u[1]*ny*c.tv, c.f[2] + c.s[2]*nx*c.tv*c.asp + c.u[2]*ny*c.tv], l = Math.hypot(d[0], d[1], d[2]); d = [d[0]/l, d[1]/l, d[2]/l];
  if (d[1] >= -0.0005) return null;
  var t = 0, step = Math.max(2, flyH*0.04), prev = 0, e = c.e;
  for (var n = 0; n < 4000 && t < 6000; n++){
    var x = e[0] + d[0]*t, y = e[1] + d[1]*t, z = e[2] + d[2]*t;
    if (y <= hAt(x, z)){ var a = prev, b = t; for (var k = 0; k < 24; k++){ var m = (a + b)/2; if (e[1] + d[1]*m <= hAt(e[0] + d[0]*m, e[2] + d[2]*m)) b = m; else a = m; } return [e[0] + d[0]*b, e[2] + d[2]*b]; }
    prev = t; t += step; step *= 1.012;
  }
  return null;
}
function dabAt(px, py, again){
  var h = groundHit(px, py); if (!h){ V3.note('Aim at the ground.', 2); return; }
  var ll = llOf(h[0], h[1]);
  if (tool === 'river'){ riv.push(+ll[0].toFixed(6), +ll[1].toFixed(6)); toolUI(); return; }
  if (tool === 'basin'){ pend.push({id:uid(), t:'basin', lat:+ll[1].toFixed(6), lon:+ll[0].toFixed(6), r:brushR, k:+(brushK*4).toFixed(1)}); V3.note('Lake', 1.5); return; }
  pend.push({id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t:tool, lat:+ll[1].toFixed(6), lon:+ll[0].toFixed(6), r:brushR, k:brushK});
  V3.note(pend.length + (pend.length > 1 ? ' dabs' : ' dab') + '', 1.5);
}
async function endStroke(){
  if (!pend.length || working || busy) return; var dabs = pend; pend = []; working = true;
  try { await L3.editAdd(cur.proj, cur.region, dabs); undoSt.push(dabs); redoSt = []; await redraw('Ground changed.'); }
  catch (er){ V3.note('Could not save the change: ' + er.message, 6); }
  working = false; refreshCount(); if (pend.length) endStroke();   /* taps made while the ground was rebuilding */
}
async function undo(){ if (working || !undoSt.length) return; working = true; var d = undoSt.pop(); try { await L3.editRemove(cur.proj, d); redoSt.push(d); await redraw('Undone.'); } catch (er){ V3.note('Could not undo: ' + er.message, 5); } working = false; refreshCount(); }
async function redo(){ if (working || !redoSt.length) return; working = true; var d = redoSt.pop(); try { await L3.editAdd(cur.proj, cur.region, d); undoSt.push(d); await redraw('Redone.'); } catch (er){ V3.note('Could not redo: ' + er.message, 5); } working = false; refreshCount(); }
/* build the current square again with the edits on top, staying where we are */
async function redraw(msg){
  busy = true; V3.note('Rebuilding the ground...', 30); var ll = llOf(P.x, P.y), pitch = P.pitch, yaw = P.yaw;
  try { await enterAt(ll[1], ll[0], yaw); } finally { P.pitch = pitch; busy = false; }
  V3.note(msg || '', 2);
}
async function refreshCount(){ try { var n = await L3.editCount(cur.proj); $('v3cnt').textContent = n + (n === 1 ? ' dab' : ' dabs') + ' saved'; $('v3undo').disabled = !undoSt.length; $('v3redo').disabled = !redoSt.length; } catch (er){} }


function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function riverWidth(){ return brushR < 30 ? 3 : brushR < 60 ? 8 : 11; }   /* the game's stream, canal and river widths */
function toolUI(){
  var isR = tool === 'river'; $('v3riv').classList.toggle('hidden', !isR);
  if (isR) $('v3rn').textContent = riv.length >= 4 ? (riv.length/2) + ' points' : riv.length ? '1 point, tap more' : 'tap along the river, downstream';
}
async function finishRiver(){
  if (riv.length < 4){ V3.note('A river needs at least two points.', 3); return; }
  var c = riv; riv = []; toolUI();
  pend.push({id:uid(), t:'river', c:c, w:riverWidth(), k:+(1 + brushK*1.5).toFixed(1), lat:c[1], lon:c[0]}); endStroke();
}

/* ---------------- each frame ---------------- */
function frame(ts){
  if (!on) return;
  var dt = Math.min(0.1, Math.max(0, (ts - last)/1000)); last = ts;   /* at most a tenth of a second per frame, so a slow frame does not jump far */
  if (!busy && world && world.geo){
    move(dt);
    intT -= dt; if (intT <= 0){ intT = 0.1; manageInteriors(3); }
    draw();
    var c = world.core;
    if (c && (P.x < c.x0 || P.x > c.x1 || P.y < c.y0 || P.y > c.y1)){   /* past the edge of the square: load the next one */
      busy = true; var ll = llOf(P.x, P.y), pitch = P.pitch;
      V3.note('Loading the next part of the map...', 10);
      enterAt(ll[1], ll[0], P.yaw).then(function(ok){
        if (!ok){ P.x = Math.max(c.x0 + 2, Math.min(c.x1 - 2, P.x)); P.y = Math.max(c.y0 + 2, Math.min(c.y1 - 2, P.y)); } else V3.note('', 0);
        P.pitch = pitch; busy = false;
      }, function(e){ busy = false; V3.note('Could not load the next square: ' + e.message, 5); });
    }
    where();
  }
  requestAnimationFrame(frame);
}
function pad(){ var gp = navigator.getGamepads ? navigator.getGamepads() : [], g = null; for (var i = 0; i < gp.length; i++) if (gp[i] && gp[i].connected){ g = gp[i]; break; } return g; }
var padA = false;
function move(dt){
  var fx = 0, fy = 0, ud = upDown, fast = keysDown.ShiftLeft || keysDown.ShiftRight, k = keysDown;
  if (k.KeyW || k.ArrowUp) fy += 1; if (k.KeyS || k.ArrowDown) fy -= 1; if (k.KeyA || k.ArrowLeft) fx -= 1; if (k.KeyD || k.ArrowRight) fx += 1;
  if (k.KeyE || k.PageUp || k.Space) ud = 1; if (k.KeyQ || k.PageDown) ud = -1;
  fx += stick.x; fy -= stick.y;
  var g = pad();
  if (g){
    var dz = function(v){ return Math.abs(v) < 0.15 ? 0 : v; };
    fx += dz(g.axes[0] || 0); fy -= dz(g.axes[1] || 0);
    P.yaw += dz(g.axes[2] || 0)*2.2*dt; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - dz(g.axes[3] || 0)*1.8*dt));
    var lt = g.buttons[6] ? g.buttons[6].value : 0, rt = g.buttons[7] ? g.buttons[7].value : 0; if (rt > 0.1 || lt > 0.1) ud = rt - lt;
    if (g.buttons[10] && g.buttons[10].pressed) fast = true;
    var a = g.buttons[0] && g.buttons[0].pressed; if (a && !padA) setMode(mode === 'fly' ? 'walk' : 'fly'); padA = a;
  }
  var l = Math.hypot(fx, fy); if (l > 1){ fx /= l; fy /= l; }
  var cy = Math.cos(P.yaw), sy = Math.sin(P.yaw);
  if (mode === 'fly'){
    var sp = (12 + flyH*0.9)*(fast ? 3 : 1);
    P.x += (cy*fy - sy*fx)*sp*dt; P.y += (sy*fy + cy*fx)*sp*dt;
    if (ud) flyH = Math.max(2, Math.min(1500, flyH*Math.pow(ud > 0 ? 1.9 : 0.53, dt)));
  } else {
    var sw = (fast ? 9 : 4.5);
    P.x += (cy*fy - sy*fx)*sw*dt; P.y += (sy*fy + cy*fx)*sw*dt;
    if (typeof collide === 'function') collide(P, 0.35);
    P.inside = typeof buildingAt === 'function' ? (buildingAt(P.x, P.y) || null) : null;
  }
}
function draw(){
  var hour0 = V3.env.hour, dk = (hour0 >= 20 || hour0 < 5) ? 1 : hour0 >= 18 ? (hour0 - 18)/2 : hour0 < 7 ? 1 - (hour0 - 5)/2 : 0; dark = dk;
  var cp = Math.cos(P.pitch), f = [Math.cos(P.yaw)*cp, Math.sin(P.pitch), Math.sin(P.yaw)*cp];
  var sl = Math.hypot(f[0], f[2]), s = [-f[2]/sl, 0, f[0]/sl], u = [s[1]*f[2] - s[2]*f[1], s[2]*f[0] - s[0]*f[2], s[0]*f[1] - s[1]*f[0]];
  var gnd = mode === 'walk' ? groundAt(P.x, P.y) : hAt(P.x, P.y), eyeY = mode === 'walk' ? gnd + 1.65 : gnd + flyH;
  var e = [P.x, eyeY, P.y];
  var V = [s[0],u[0],-f[0],0, s[1],u[1],-f[1],0, s[2],u[2],-f[2],0, -(s[0]*e[0]+s[1]*e[1]+s[2]*e[2]), -(u[0]*e[0]+u[1]*e[1]+u[2]*e[2]), f[0]*e[0]+f[1]*e[1]+f[2]*e[2], 1];
  var asp = W/H, tv = Math.max(Math.tan(22.5*Math.PI/180), Math.min(Math.tan(50*Math.PI/180), Math.tan(90*Math.PI/360)/asp)), t = 1/tv;
  var nr = mode === 'walk' ? 0.12 : Math.max(0.12, flyH*0.02), fr = QS.far*1.25 + 300 + (mode === 'fly' ? flyH*2 : 0);
  var Pm = [t/asp,0,0,0, 0,t,0,0, 0,0,(fr+nr)/(nr-fr),-1, 0,0,2*fr*nr/(nr-fr),0];
  /* street lights near you after dark, as the game shows them while the power is on */
  var near = dk > 0.3 && world.slights ? world.slights.filter(function(l){ return Math.abs(l.x - P.x) < 70 && Math.abs(l.y - P.y) < 70; }).sort(function(a, b2){ return Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b2.x - P.x, b2.y - P.y); }) : [];
  lastCam = {e:e, f:f, s:s, u:u, tv:tv, asp:asp};
  drawScene({e:e, f:f, s:s, u:u, V:V, Pm:Pm, cx:P.x, cy:P.y, tz:tv}, {hour:hour0, wd:1, fl:0, wtype:0, dark:dk, grid:true, season:V3.env.season, lightOn:false, lights:near, now:performance.now()/1000});
  /* the far ground under the horizon, as the game draws it */
  var m = new Mesh(), far = world.tg ? world.tg.min - 3 : 0, bq = QS.far*1.4 + 400 + (mode === 'fly' ? flyH*3 : 0);
  m.pl = [TERR, 0]; m.quad(P.x - bq, far, P.y - bq, P.x + bq, far, P.y - bq, P.x + bq, far, P.y + bq, P.x - bq, far, P.y + bq, [228,236,214], 255); m.pl = null;
  dynB = upload(m, dynB); drawMesh(dynB); drawNature();
}
function where(){
  var ll = llOf(P.x, P.y), w = $('v3where'); if (!w) return;
  var txt = (cur.name || '') + ' · ' + ll[1].toFixed(5) + ', ' + ll[0].toFixed(5) + ' · ' + (mode === 'fly' ? Math.round(flyH*3.28084) + ' ft up' : P.inside ? 'inside a building' : 'on foot');
  if (w.textContent !== txt) w.textContent = txt;
}
})();
