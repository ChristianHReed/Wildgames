/* Game controllers (0.120.0). Any controller the browser reports with the standard layout (Xbox, PlayStation, Switch Pro, Steam Deck, most handhelds).
   In the game the buttons send the same keys as the keyboard, so every action works the way it does on a computer.
   In menus (the start page, Settings, the items, build, chest and other panels, the Menu list) the d-pad or left stick moves between buttons,
   A presses, B goes back, LB and RB switch the start page tabs. A line at the bottom says which button does what, in words. */
(function(){
  if (!navigator.getGamepads) return;
  var DZ = 0.2, prev = [], nav = {t:0, dir:null}, hint = null, lastUsed = 0, held = {};
  /* standard layout: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 View/Select, 9 Menu/Start, 10 L3, 11 R3, 12 up, 13 down, 14 left, 15 right */
  var GAME = {0:'Space', 1:'KeyZ', 2:'KeyE', 3:'KeyK', 4:'KeyQ', 5:'KeyV', 11:'KeyL', 12:'Digit1', 13:'Digit2', 14:'Digit4', 15:'KeyP', 8:'KeyM'};
  var NAMES = {0:'A', 1:'B', 2:'X', 3:'Y', 4:'LB', 5:'RB', 6:'LT', 7:'RT', 8:'View', 9:'Menu', 10:'L3', 11:'R3'};
  function key(code, down){ try { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {code:code, bubbles:true})); } catch (e){} if (!down && window.keys) keys[code] = false; }
  function ax(v){ return Math.abs(v) < DZ ? 0 : (v - Math.sign(v)*DZ)/(1 - DZ); }
  function vis(e){ if (!e || e.disabled) return false; var r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; var s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth || true; }
  function layer(){
    var open = [].slice.call(document.querySelectorAll('.modal:not(.hidden), #hudBtns:not(.hidden), #bigMap:not(.hidden), #bedit:not(.hidden), #travel:not(.hidden)')).filter(function(e){ return e.getBoundingClientRect().width > 0; });
    var bn = document.querySelector('div[style*="z-index:96"]'); if (bn) return bn;
    if (open.length) return open[open.length - 1];
    if (!window.running) return document.getElementById('title') || document.body;
    return null; }
  function focusables(root){ return [].slice.call(root.querySelectorAll('button, input, select, textarea, a[href], label.btn, summary, .jtab, [data-a], [tabindex]:not([tabindex="-1"])')).filter(function(e){ if (!vis(e)) return false; if (e.tagName === 'INPUT' && e.type === 'file') return false; var c = e.closest('.jpage'); if (c && !c.classList.contains('on')) return false; var d = e.closest('details:not([open])'); if (d && e.tagName !== 'SUMMARY') return false; return true; }); }
  function centre(e){ var r = e.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }
  function move(root, dir){
    var L = focusables(root); if (!L.length) return; var cur = document.activeElement; if (L.indexOf(cur) < 0){ L[0].focus(); scroll(L[0]); return; }
    var c = centre(cur), best = null, bs = 1e9, dx = dir === 'l' ? -1 : dir === 'r' ? 1 : 0, dy = dir === 'u' ? -1 : dir === 'd' ? 1 : 0;
    L.forEach(function(e){ if (e === cur) return; var p = centre(e), vx = p[0] - c[0], vy = p[1] - c[1], along = vx*dx + vy*dy; if (along <= 4) return; var side = Math.abs(vx*dy - vy*dx), sc = along + side*2.2; if (sc < bs){ bs = sc; best = e; } });
    if (best){ best.focus(); scroll(best); } }
  function scroll(e){ try { e.scrollIntoView({block:'nearest', inline:'nearest'}); } catch (er){} }
  function press(root){ var e = document.activeElement; if (!e || !root.contains(e)){ move(root, 'd'); return; }
    if (e.tagName === 'SELECT'){ e.selectedIndex = (e.selectedIndex + 1) % e.options.length; e.dispatchEvent(new Event('change', {bubbles:true})); return; }
    if (e.tagName === 'INPUT' && (e.type === 'checkbox' || e.type === 'radio')){ e.click(); return; }
    if (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA'){ e.focus(); return; }
    if (e.tagName === 'LABEL'){ var inp = e.querySelector('input'); if (inp && inp.type === 'file'){ inp.click(); return; } }
    e.click(); }
  function back(root){
    var b = [].slice.call(root.querySelectorAll('button')).filter(function(x){ return vis(x) && /^(close|done|back|cancel|back to the game|×|x)$/i.test(x.textContent.trim()); })[0];
    if (b){ b.click(); return; }
    if (root.id === 'hudBtns'){ root.classList.add('hidden'); return; }
    if (root.id === 'items'){ key('KeyK', true); key('KeyK', false); return; }
    if (root.id === 'build'){ key('KeyN', true); key('KeyN', false); return; }
    if (root.id === 'bigMap'){ key('KeyM', true); key('KeyM', false); return; }
    if (root.classList && root.classList.contains('modal')) root.classList.add('hidden'); }
  function tabs(step){ var T = [].slice.call(document.querySelectorAll('.jtab')); if (!T.length) return; var i = T.findIndex(function(t){ return t.classList.contains('on'); }); var n = T[(i + step + T.length) % T.length]; n.click(); n.focus(); }
  function showHint(t){ if (!hint){ hint = document.createElement('div'); hint.id = 'padHint'; hint.style.cssText = 'position:fixed;left:50%;bottom:6px;transform:translateX(-50%);z-index:97;background:rgba(0,0,0,.7);color:#fff;font:600 12px system-ui,sans-serif;padding:4px 10px;border-radius:999px;pointer-events:none;white-space:nowrap'; document.body.appendChild(hint); } hint.textContent = t; hint.style.display = t ? '' : 'none'; }
  var css = document.createElement('style'); css.textContent = 'body.padmode :focus{outline:3px solid #f2c94c !important;outline-offset:2px}'; document.head.appendChild(css);
  window.addEventListener('gamepadconnected', function(e){ try { toast((e.gamepad.id.split('(')[0].trim() || 'A controller') + ' connected. Press Menu for the menu; in menus, A chooses and B goes back.', 5); } catch (er){} });
  window.addEventListener('mousemove', function(){ if (Date.now() - lastUsed > 1500){ document.body.classList.remove('padmode'); showHint(''); } });
  var lastT = 0;
  function poll(ts){
    requestAnimationFrame(poll); var fdt = lastT ? Math.min(0.1, (ts - lastT)/1000) : 1/60; lastT = ts;
    var pads = navigator.getGamepads ? navigator.getGamepads() : [], g = null; for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected && pads[i].buttons.length >= 12){ g = pads[i]; break; }
    if (!g) return;
    var b = g.buttons.map(function(x){ return x.pressed || x.value > 0.5; }), was = prev, lx = ax(g.axes[0] || 0), ly = ax(g.axes[1] || 0), rx = ax(g.axes[2] || 0), ry = ax(g.axes[3] || 0);
    var down = function(k){ return b[k] && !was[k]; }, up = function(k){ return !b[k] && was[k]; }; prev = b;
    var any = b.some(Boolean) || lx || ly || rx || ry; if (any){ lastUsed = Date.now(); document.body.classList.add('padmode'); }
    var root = layer(), now = performance.now();
    if (root){
      /* menus */
      for (var k in held){ key(held[k], false); delete held[k]; } if (window.stick && stick.id === null && g.__mv){ stick.x = stick.y = 0; g.__mv = 0; }
      if (any) showHint(window.running ? 'A choose · B back · Menu close' : 'A choose · B back · LB / RB tabs');
      var dir = b[12] || ly < -0.5 ? 'u' : b[13] || ly > 0.5 ? 'd' : b[14] || lx < -0.5 ? 'l' : b[15] || lx > 0.5 ? 'r' : null;
      if (dir && (dir !== nav.dir || now - nav.t > (nav.rep ? 120 : 380))){ nav.rep = dir === nav.dir; nav.dir = dir; nav.t = now; move(root, dir); } else if (!dir){ nav.dir = null; nav.rep = false; }
      if (ry && root.scrollHeight > root.clientHeight) root.scrollTop += ry*14;
      if (down(0)) press(root); if (down(1)) back(root);
      if (!window.running){ if (down(4)) tabs(-1); if (down(5)) tabs(1); }
      if (down(9) && window.running){ var hb = document.getElementById('hudBtns'); if (root === hb) hb.classList.add('hidden'); else back(root); }
      return; }
    if (!window.running) return;
    /* in the game */
    showHint(''); var P = window.P; if (!P) return;
    if (window.stick && stick.id === null){ if (P.veh && P.veh.t){ stick.x = lx; stick.y = -((g.buttons[7] ? g.buttons[7].value : 0) - (g.buttons[6] ? g.buttons[6].value : 0)); } else { stick.x = lx; stick.y = ly; } g.__mv = 1; }
    var dt = fdt; P.yaw += rx*2.6*dt; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - ry*2.0*dt));
    for (var bi in GAME){ if (P.veh && P.veh.t && (bi === '0' || bi === '1')) continue; if (down(+bi)){ key(GAME[bi], true); held[bi] = GAME[bi]; } else if (up(+bi) && held[bi]){ key(GAME[bi], false); delete held[bi]; } }
    if (!(P.veh && P.veh.t)){ if (down(7)) window.wantSwing = true; if (down(6)) window.wantShoot = true; }
    else { if (down(0)) key('KeyG', true), key('KeyG', false); if (b[1]){ if (window.keys) keys.Space = true; } else if (was[1] && window.keys) keys.Space = false; }   /* in a car: A changes seat, B is the handbrake */
    if (down(10)){ if (window.keys){ keys.ShiftLeft = !keys.ShiftLeft; } }   /* L3: run on or off */
    if (down(9)){ var hm = document.getElementById('hudMenu'); if (hm) hm.click(); }
  }
  requestAnimationFrame(poll);
  window.PADMAP = {game:GAME, names:NAMES};
})();
