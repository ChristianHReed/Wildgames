/* Shared engine: collision against the built world.
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
/* ================= collision ================= */
function pushSegs(e, r, s){
  for (var i = 0; i < s.length; i += 4){
    var ax = s[i], ay = s[i+1], dx = s[i+2] - ax, dy = s[i+3] - ay, l = dx*dx + dy*dy, t = l ? ((e.x-ax)*dx + (e.y-ay)*dy)/l : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t; var px = e.x - ax - dx*t, py = e.y - ay - dy*t, d = Math.hypot(px, py);
    if (d < r && d > 1e-6){ e.x += px/d*(r - d); e.y += py/d*(r - d); }
  }
}
/* ---- doors and windows. Door: 0 shut, 1 open, 2 broken. Window: 0 shut, 1 open, 2 broken, 3 boarded up. Only changes from the starting state are saved. ---- */
function doorState(b){ var s = world.edits.ports[b.id]; return s && s.d !== undefined ? s.d : (b.id === world.safe ? 0 : hash(b.id, 31, 7) < 0.22 ? 1 : 0); }
/* inside doors: k = 1000 + doorway number. Most stand open; a shut one blocks sight and has to be opened (aliens push them open) */
/* furniture shoved against a door: k is -1 for the front door or 1000 + n for an inside door */
function blockOf(b, k){ var B = world.edits.blocks[b.id]; return B && B[k] || null; }
function innerState(b, i){ if (blockOf(b, 1000 + i)) return 0; var s = world.edits.ports[b.id]; return s && s.i && s.i[i] !== undefined ? s.i[i] : (hash(b.id, i, 41) < 0.65 ? 1 : 0); }
function innerBar(b){
  if (!b.int || !b.int.idoors) return []; if (b.ibar) return b.ibar; var a = [];
  b.int.idoors.forEach(function(d, i){ if (innerState(b, i) === 0) a.push(d[0], d[1], d[2], d[3]); }); return b.ibar = a;
}
/* outside doors can be locked: keys open them at once, prying is slow and quiet, smashing is quick and loud */
function lockedOf(b){ var s = world.edits.ports[b.id]; if (s && s.l !== undefined) return !!s.l; if (s && s.d !== undefined) return false; return b.id !== world.safe && !allBeds().some(function(q){ return q.b === b.id; }) && hash(b.id, 51, 3) < (b.cat === 'house' ? 0.3 : 0.45) && doorState(b) === 0; }
function winState(b, k){ var s = world.edits.ports[b.id]; return (s && s.w && s.w[k]) || 0; }
/* 0.35: curtains (or a sheet, blind or cardboard over the glass in other buildings). They stop eyes and lamplight, not hands */
function curtOf(b, k){ var s = world.edits.ports[b.id]; return !!(s && s.c && s.c[k]); }
function setCurtain(b, k, on, quiet){
  var E = world.edits.ports, s = E[b.id] || (E[b.id] = {w:{}}); if (!s.c) s.c = {}; if (on) s.c[k] = 1; else delete s.c[k]; b.sbar = null; b.gbar = null;
  if (!quiet){ emit({k:'curt', b:b.id, i:k, on:on ? 1 : 0}); sfx('search', b.wins[k*6], b.wins[k*6+1], 0.35, 1.3); }
}
/* what an alien's eyes are stopped by: walls, a shut or blocked door, boarded and curtained windows. Shut glass is seen through */
function sbarOf(b){
  if (b.sbar) return b.sbar; var a = [], g = [], w = b.wsegs || [];
  if (b.dseg && (doorState(b) === 0 || blockOf(b, -1))) a.push(b.dseg[0], b.dseg[1], b.dseg[2], b.dseg[3]);
  for (var k = 0; k*4 < w.length; k++){ var st = winState(b, k), q = [w[k*4], w[k*4+1], w[k*4+2], w[k*4+3]]; if (st === 3 || curtOf(b, k)) a.push.apply(a, q); else if (st === 0) g.push.apply(g, q); }
  b.gbar = g; return b.sbar = a;
}
function gbarOf(b){ sbarOf(b); return b.gbar; }
/* can an alien at a see b? 0 no, 1 yes, 2 yes but through window glass */
function sight(ax, ay, bx, by, lv){
  if (world.wallSegs.length && segsX(world.wallSegs, ax, ay, bx, by)) return 0;
  var x0 = Math.floor(Math.min(ax, bx)/G), x1 = Math.floor(Math.max(ax, bx)/G), y0 = Math.floor(Math.min(ay, by)/G), y1 = Math.floor(Math.max(ay, by)/G), cx, cy, i, gl0 = false; stampN++;
  if ((x1 - x0 + 1)*(y1 - y0 + 1) > 40) return 1;
  for (cy = y0; cy <= y1; cy++) for (cx = x0; cx <= x1; cx++){
    var cell = world.grid.get(gk(cx, cy)); if (!cell) continue;
    for (i = 0; i < cell.length; i++){ var b = cell[i]; if (b.stamp === stampN || b.gone) continue; b.stamp = stampN;
      if (b.maxx < Math.min(ax, bx) || b.minx > Math.max(ax, bx) || b.maxy < Math.min(ay, by) || b.miny > Math.max(ay, by)) continue;
      if (segsX(b.segs, ax, ay, bx, by) || segsX(sbarOf(b), ax, ay, bx, by) || (b.int && (lv ? segsX(lvSegs(b, lv), ax, ay, bx, by) : (segsX(b.int.segs, ax, ay, bx, by) || segsX(innerBar(b), ax, ay, bx, by))))) return 0;
      if (!gl0 && segsX(gbarOf(b), ax, ay, bx, by)) gl0 = true; }
  }
  return gl0 ? 2 : 1;
}
/* a lit lamp or flashlight indoors at night shows at every window that is not curtained or boarded: the nearest such window to (x, y) */
function litWindow(b, x, y, r){
  var best = null, bd = r; if (!b || !b.wins) return null;
  for (var k = 0; k*6 < b.wins.length; k++){ if (winState(b, k) === 3 || curtOf(b, k)) continue; var d = Math.hypot(b.wins[k*6] - x, b.wins[k*6+1] - y); if (d < bd){ bd = d; best = k; } }
  return best === null ? null : {x:b.wins[best*6] - b.wins[best*6+4]*1.5, y:b.wins[best*6+1] - b.wins[best*6+5]*1.5, d:bd};
}
function setPort(b, k, st, quiet){
  var E = world.edits.ports, s = E[b.id] || (E[b.id] = {w:{}}); if (!s.w) s.w = {};
  if (k === -2) s.l = st; else if (k >= 1000){ if (!s.i) s.i = {}; s.i[k - 1000] = st; b.ibar = null; } else if (k < 0) s.d = st; else if (st) s.w[k] = st; else delete s.w[k];
  b.bar = null; b.sbar = null; b.gbar = null; if (b.php) delete b.php[k]; if (!quiet) emit({k:'port', b:b.id, i:k, s:st});
  if (running && time > 2){ var sx = k >= 1000 && b.int && b.int.idoors[k - 1000] ? (b.int.idoors[k - 1000][0] + b.int.idoors[k - 1000][2])/2 : k < 0 && b.door ? b.door.x : b.wins[k*6] || b.cx, sy = k >= 1000 && b.int && b.int.idoors[k - 1000] ? (b.int.idoors[k - 1000][1] + b.int.idoors[k - 1000][3])/2 : k < 0 && b.door ? b.door.y : b.wins[k*6 + 1] || b.cy;
    if (k === -2) sfx('latch', sx, sy, 0.7); else if (st === 2) sfx(k === -1 ? 'wood_hit' : 'glass', sx, sy, 1, 1, 60); else if (st === 3) sfx('plank', sx, sy, 0.8); else if (k >= 1000) sfx(st ? 'creak' : 'door_close', sx, sy, 0.6); else if (k === -1) sfx(st ? 'door_open' : 'door_close', sx, sy, 0.8); else sfx('creak', sx, sy, 0.5, 1.3); }   /* doors, windows, locks */
}
/* the pieces of wall that are solid right now: the shut door and every window that is not open */
function barOf(b){
  if (b.bar) return b.bar; var a = [], w = b.wsegs || [];
  if (b.dseg && (doorState(b) === 0 || blockOf(b, -1))) a.push(b.dseg[0], b.dseg[1], b.dseg[2], b.dseg[3]);
  for (var k = 0; k*4 < w.length; k++){ var st = winState(b, k); if (st === 0 || st === 3) a.push(w[k*4], w[k*4+1], w[k*4+2], w[k*4+3]); }
  return b.bar = a;
}
function portNear(){
  var best = null, bd = 1.9, fx = Math.cos(P.yaw), fy = Math.sin(P.yaw), c0x = Math.floor(P.x/G), c0y = Math.floor(P.y/G); stampN++;
  for (var cy = c0y - 1; cy <= c0y + 1; cy++) for (var cx = c0x - 1; cx <= c0x + 1; cx++){
    var cell = world.grid.get(gk(cx, cy)); if (!cell) continue;
    for (var i = 0; i < cell.length; i++){
      var b = cell[i]; if (b.stamp === stampN) continue; b.stamp = stampN; if (b.gone || P.x < b.minx - 2 || P.x > b.maxx + 2 || P.y < b.miny - 2 || P.y > b.maxy + 2) continue;
      var chk = function(k, x, y, lim){ var dx = x - P.x, dy = y - P.y, d = Math.hypot(dx, dy); if (d < lim && d < bd && (d < 0.7 || (dx*fx + dy*fy)/d > 0.5)){ bd = d; var pt = b.pt || (b.pt = {}); best = pt[k] || (pt[k] = {port:true, b:b, k:k, name:k < 0 ? 'door' : 'window', x:x, y:y}); } };
      if (b.door) chk(-1, b.door.x, b.door.y, 1.9);
      for (var k = 0; k*6 < b.wins.length; k++) chk(k, b.wins[k*6], b.wins[k*6+1], 1.35);
      if (b.int && b.int.idoors) for (k = 0; k < b.int.idoors.length; k++){ var dd0 = b.int.idoors[k]; chk(1000 + k, (dd0[0] + dd0[2])/2, (dd0[1] + dd0[3])/2, 1.6); }
    }
  }
  return best ? {o:best, d:bd} : null;
}
function portText(o){
  var tch = document.body.classList.contains('touchmode'), E = tch ? 'Tap to ' : 'Press E to ', B = tch ? 'Wall' : 'B';
  var bk0 = blockOf(o.b, o.k); if (bk0) return (bk0.br ? 'Braced with a bar' : 'Blocked with furniture') + ' \u00b7 ' + E + (bk0.br ? 'take the bar down' : 'pull it away');
  if (o.k >= 1000) return E + (innerState(o.b, o.k - 1000) ? 'close the door' : 'open the door');
  if (o.k < 0 && doorState(o.b) === 0 && lockedOf(o.b)) return 'Locked \u00b7 ' + (inv.key > 0 ? (tch ? 'Tap' : 'Press E') + ' to use your keys' : (tch ? 'Hold' : 'Hold E') + ' to pry it (quiet, slow) \u00b7 Swing to smash it (loud)');
  if (o.k < 0){ var d = doorState(o.b); return d === 0 ? E + 'open the door' : d === 1 ? E + 'close the door' : E + 'repair the door (2 wood)'; }
  var w = winState(o.b, o.k), cn = o.b.cat === 'house' || o.b.kind === 'apartments' ? 'curtains' : 'blind';
  if (w !== 3 && curtOf(o.b, o.k)) return E + 'open the ' + cn + ' \u00b7 ' + B + ' boards it up (2 wood)';
  return w === 0 ? E + 'open the window \u00b7 ' + B + ' draws the ' + cn : w === 1 ? E + 'close the window \u00b7 ' + B + ' draws the ' + cn : w === 2 ? 'Broken window \u00b7 ' + B + ' draws the ' + cn : E + 'pull the boards off';
}
function usePort(o){
  if (blockOf(o.b, o.k)){ doEdit({a:'unblock', b:o.b.id, k:o.k}); sfx('wood_hit', o.x, o.y, 0.6); feed('You dragged the furniture aside', '#c0c6cc'); return; }
  if (o.k >= 1000){ setPort(o.b, o.k, innerState(o.b, o.k - 1000) ? 0 : 1); return; }
  if (o.k < 0 && doorState(o.b) === 0 && lockedOf(o.b)){ if (inv.key > 0){ inv.key--; setPort(o.b, -2, 0); setPort(o.b, -1, 1); feed('Unlocked with your keys', ITEMS.key[1]); updateHud(); } return; }
  if (o.k < 0){ var d = doorState(o.b); if (d === 2){ if (inv.wood < 2){ toast('Repairing the door takes 2 wood.', 2.5); return; } inv.wood -= 2; setPort(o.b, -1, 0); feed('Door repaired', ITEMS.wood[1]); } else setPort(o.b, -1, d === 0 ? 1 : 0); }
  else { var w = winState(o.b, o.k); if (w !== 3 && curtOf(o.b, o.k)){ setCurtain(o.b, o.k, false); return; } if (w === 2) return; if (w === 3){ setPort(o.b, o.k, 0); inv.wood++; feed('+1 Wood', ITEMS.wood[1]); } else setPort(o.b, o.k, w === 0 ? 1 : 0); }
  updateHud();
}
function boardPort(o){
  if (o.k < 0 || winState(o.b, o.k) === 3) return;
  if (!curtOf(o.b, o.k)){ setCurtain(o.b, o.k, true); if (!P.curtSaid){ P.curtSaid = true; toast('Curtains drawn. Aliens outside cannot see in, and your light does not show from this window. Press it again to board the window up.', 6); } return; } if (inv.wood < 2){ toast('Boarding a window takes 2 wood.', 2.5); return; }
  inv.wood -= 2; setCurtain(o.b, o.k, false, true); setPort(o.b, o.k, 3); feed('Window boarded up', ITEMS.wood[1]); updateHud();
}
/* an alien at a shut door or window of the building its prey is in batters it until it gives way */
function alienAtPort(z, A, b, dt){
  if (!b || b.gone || z.x < b.minx - 1.5 || z.x > b.maxx + 1.5 || z.y < b.miny - 1.5 || z.y > b.maxy + 1.5) return;
  var hit = function(k, s, o){ if (segDist(z.x, z.y, s[o], s[o+1], s[o+2], s[o+3]) > A.r + 0.5) return false;
    var bk = k < 0 ? blockOf(b, -1) : null; if (bk){ bk.hp -= A.dmg*dt*(z.k === 2 ? 3 : 1.1); z.bangT = (z.bangT || 0) - dt; if (z.bangT <= 0){ z.bangT = 0.6; sfx('wood_hit', z.x, z.y, 0.7, 0.8, 50); } if (bk.hp <= 0){ doEdit({a:'unblock', b:b.id, k:-1}); if (Math.hypot(z.x - P.x, z.y - P.y) < 30) feed('The barricade gives way!', '#ff8f7a'); } return true; } var st = k < 0 ? doorState(b) : winState(b, k); if (k < 0 ? st !== 0 : (st === 1 || st === 2)) return false;
    var hp = b.php || (b.php = {}); if (hp[k] === undefined) hp[k] = k < 0 ? 26 : st === 3 ? 40 : 7; hp[k] -= A.dmg*dt*(z.k === 2 ? 3 : 1.1); z.bangT = (z.bangT || 0) - dt; if (z.bangT <= 0){ z.bangT = 0.55 + Math.random()*0.3; sfx(st === 3 || k < 0 ? 'wood_hit' : 'tin', z.x, z.y, 0.7, 0.9, 50); }
    if (hp[k] <= 0){ setPort(b, k, 2); if (Math.hypot(z.x - P.x, z.y - P.y) < 30) feed(k < 0 ? 'A door gives way nearby' : st === 3 ? 'Boards splinter nearby' : 'Glass breaks nearby', '#ff8f7a'); } return true; };
  if (b.dseg && hit(-1, b.dseg, 0)) return; var w = b.wsegs; for (var k = 0; k*4 < w.length; k++) if (hit(k, w, k*4)) return;
}
function drawPorts(m){
  var c0x = Math.floor(P.x/G), c0y = Math.floor(P.y/G), wood = [122,84,56], metal = [78,92,100], dark = [28,30,36], plank = [150,108,70]; stampN++;
  for (var cy = c0y - 3; cy <= c0y + 3; cy++) for (var cx = c0x - 3; cx <= c0x + 3; cx++){
    var cell = world.grid.get(gk(cx, cy)); if (!cell) continue;
    for (var i = 0; i < cell.length; i++){
      var b = cell[i]; if (b.stamp === stampN) continue; b.stamp = stampN; if (b.gone || !b.h) continue; m.yo = b.base || 0;
      var BL = world.edits.blocks[b.id]; if (BL) for (var bkk in BL){ var bo = BL[bkk], kk = bkk | 0, M2 = bo.br ? null : MODELS[bo.m]; if (!M2 && !(bo.br && kk === -1 && b.door)) continue; var cx0, cy0, nx0, ny0;
        if (kk === -1 && b.door){ cx0 = b.door.x; cy0 = b.door.y; nx0 = b.door.nx; ny0 = b.door.ny; } else if (kk >= 1000 && b.int && b.int.idoors && b.int.idoors[kk - 1000]){ var q3 = b.int.idoors[kk - 1000], l3 = Math.hypot(q3[2] - q3[0], q3[3] - q3[1]) || 1; cx0 = (q3[0] + q3[2])/2; cy0 = (q3[1] + q3[3])/2; nx0 = -(q3[3] - q3[1])/l3*(bo.s || 1); ny0 = (q3[2] - q3[0])/l3*(bo.s || 1); } else continue;
        if (bo.br){ var brm = spB('build.door_brace'); if (brm) m.modelS(brm, cx0 + nx0*0.1, cy0 + ny0*0.1, Math.atan2(ny0, nx0) - 1.5708, groundAt(cx0, cy0) + (b.base || 0), 1); else m.ybox(cx0 + nx0*0.12, cy0 + ny0*0.12, Math.atan2(ny0, nx0), 0, 0, 1.0, 0.06, 0.6, 0.08, [120,90,60]); continue; }
        var dep = Math.min(M2.hx, M2.hz) + 0.12, bx3 = cx0 + nx0*dep, by3 = cy0 + ny0*dep; m.model(M2, bx3, by3, Math.atan2(ny0, nx0) - 1.5708, 0.1); }   /* its back against the door */
      if (b.int && b.int.idoors) for (var iq = 0; iq < b.int.idoors.length; iq++){ var dq2 = b.int.idoors[iq], ln = Math.hypot(dq2[2] - dq2[0], dq2[3] - dq2[1]), uxd = (dq2[2] - dq2[0])/ln, uyd = (dq2[3] - dq2[1])/ln, op = innerState(b, iq), an = op ? 1.6 : 0, wx2 = uxd*Math.cos(an) - uyd*Math.sin(an), wy2 = uyd*Math.cos(an) + uxd*Math.sin(an);
        m.ybox(dq2[0] + wx2*ln/2, dq2[1] + wy2*ln/2, Math.atan2(wy2, wx2), 0, 0, 1.08, ln/2 - 0.03, 1.02, 0.025, [176,138,96]); m.ybox(dq2[0] + wx2*(ln - 0.12), dq2[1] + wy2*(ln - 0.12), Math.atan2(wy2, wx2), 0, 0, 1.05, 0.03, 0.03, 0.06, [214,190,120]); }
      if (b.dseg){ var s = b.dseg, st = doorState(b), L = Math.hypot(s[2] - s[0], s[3] - s[1]), ux = (s[2] - s[0])/L, uz = (s[3] - s[1])/L, col = b.cat === 'house' ? wood : metal;
        if (st === 2){ m.ybox(s[0] + b.door.nx*1.1 + ux*0.3, s[1] + b.door.ny*1.1 + uz*0.3, 0.9 + b.id, 0, 0, 0.15, L/2, 0.03, 0.42, col); }
        else { var a = st === 1 ? 1.75 : 0, wx = ux*Math.cos(a) + b.door.nx*Math.sin(a), wz = uz*Math.cos(a) + b.door.ny*Math.sin(a), yw = Math.atan2(wz, wx);
          m.ybox(s[0] + wx*L/2, s[1] + wz*L/2, yw, 0, 0, 1.15, L/2, 1.05, 0.035, col); m.ybox(s[0] + wx*(L - 0.14), s[1] + wz*(L - 0.14), yw, 0, 0, 1.1, 0.03, 0.03, 0.08, [214,190,120]); }
      }
      var od = 0.035;
      var CC = [[150,64,58],[86,104,130],[196,176,120],[96,120,84],[214,206,190]], cc = CC[b.id % CC.length];
      var hk = (b.lhg || 3.2)/3.2, frm = [236,232,224], gls = [200,218,228];
      for (var k = 0; k*6 < b.wins.length; k++){ var ws = winState(b, k), q = k*6, x = b.wins[q], z = b.wins[q+1], yw2 = Math.atan2(b.wins[q+3], b.wins[q+2]);
        if (ws !== 3 && curtOf(b, k)) for (var cs2 = -1; cs2 <= 1; cs2 += 2){ m.ybox(x, z, yw2, -0.2, cs2*0.05, 1.6*hk, 0.21, 0.6*hk, 0.012, cc); m.ybox(x, z, yw2, 0.2, cs2*0.05, 1.6*hk, 0.21, 0.6*hk, 0.012, cc); m.ybox(x, z, yw2, 0, cs2*0.055, 2.22*hk, 0.44, 0.02, 0.014, [110,92,74]); }   /* seen from both sides of the glass */
        if (!ws){ m.ybox(x, z, yw2, 0, 0, 1.6*hk, 0.42, 0.018, 0.018, frm); m.ybox(x, z, yw2, 0, 0, 1.6*hk, 0.016, 0.6*hk, 0.016, frm); continue; }   /* shut: the glass is clear, only the sash bars show */
        if (ws === 3){ for (var e = 0; e < 4; e++){ m.ybox(x, z, yw2 + ((e*7 + k) % 3 - 1)*0.05, 0, -od - 0.06, (1.12 + e*0.31)*hk, 0.62, 0.11, 0.025, e & 1 ? plank : [134,96,62]); m.ybox(x, z, yw2 + ((e*5 + k) % 3 - 1)*0.05, 0, 0.07, (1.12 + e*0.31)*hk, 0.62, 0.11, 0.02, plank); } }
        else if (ws === 1){ m.ybox(x, z, yw2, 0, -od - 0.02, 1.62*hk, 0.46, 0.035, 0.03, frm); m.ybox(x, z, yw2, 0, -od - 0.02, 2.2*hk, 0.46, 0.035, 0.03, frm); }   /* the lower sash pushed up: an open gap below */
        else { m.ybox(x, z, yw2 + 0.5, -0.2, -od - 0.02, 1.2*hk, 0.16, 0.05, 0.012, gls); m.ybox(x, z, yw2 - 0.7, 0.24, -od - 0.02, 2.0*hk, 0.14, 0.04, 0.012, gls); m.ybox(x, z, yw2, 0.3, -od - 0.02, 1.12*hk, 0.1, 0.1, 0.012, [170,190,200]); }
      }
    }
  }
  m.yo = 0;
}
function collide(e, r){
  var cx0 = Math.floor(e.x/G), cy0 = Math.floor(e.y/G);
  for (var pass = 0; pass < 2; pass++){
    stampN++; if (world.wallSegs.length && !e.cl) pushSegs(e, r, world.wallSegs);   /* a clinger goes over fences and walls */
    for (var cy = cy0 - 1; cy <= cy0 + 1; cy++) for (var cx = cx0 - 1; cx <= cx0 + 1; cx++){
      var cell = world.grid.get(gk(cx, cy)); if (!cell) continue;
      for (var i = 0; i < cell.length; i++){
        var b = cell[i]; if (b.stamp === stampN) continue; b.stamp = stampN;
        if (b.gone || e.x < b.minx - r || e.x > b.maxx + r || e.y < b.miny - r || e.y > b.maxy + r) continue;
        pushSegs(e, r, b.segs); var br0 = barOf(b); if (br0.length) pushSegs(e, r, br0);
        if (b.int){
          var upL = e.lvl && b.int.lv && b.int.lv[e.lvl]; pushSegs(e, r, upL ? lvSegs(b, e.lvl) : b.int.segs); if (!upL){ var ib0 = innerBar(b); if (ib0.length) pushSegs(e, r, ib0); } else { if (b.dseg) pushSegs(e, r, b.dseg); if (b.wsegs && b.wsegs.length) pushSegs(e, r, b.wsegs); } var c = upL ? lvCircs(b, e.lvl) : b.int.circs;
          for (var q = 0; q < c.length; q += 3){ var dx = e.x - c[q], dy = e.y - c[q+1], d = Math.hypot(dx, dy), rr = r + c[q+2]; if (d < rr && d > 1e-6){ e.x += dx/d*(rr - d); e.y += dy/d*(rr - d); } }
        }
      }
    }
  }
}
function hitWall(x, y){
  var ws2 = world.wallSegs; for (var w2 = 0; w2 < ws2.length; w2 += 4) if (segDist(x, y, ws2[w2], ws2[w2+1], ws2[w2+2], ws2[w2+3]) < 0.16) return true;
  var cell = world.grid.get(gk(Math.floor(x/G), Math.floor(y/G))); if (!cell) return false;
  for (var i = 0; i < cell.length; i++){
    var b = cell[i]; if (b.gone || x < b.minx - 0.2 || x > b.maxx + 0.2 || y < b.miny - 0.2 || y > b.maxy + 0.2) continue;
    var s = b.segs, q; for (q = 0; q < s.length; q += 4) if (segDist(x, y, s[q], s[q+1], s[q+2], s[q+3]) < 0.14) return true;
    s = barOf(b); for (q = 0; q < s.length; q += 4) if (segDist(x, y, s[q], s[q+1], s[q+2], s[q+3]) < 0.14) return true;
    if (b.int){ s = b.int.segs; for (q = 0; q < s.length; q += 4) if (segDist(x, y, s[q], s[q+1], s[q+2], s[q+3]) < 0.14) return true; }
  }
  return false;
}
function stepMove(e, dx, dy, r){
  var l = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(l/0.25));
  for (var i = 0; i < n; i++){
    var ox = e.x, oy = e.y; e.x += dx/n; e.y += dy/n; collide(e, r);
    /* 0.99.0: next to a dug or filled column, a step up of more than 0.9 m stops you (2.1 m with a jump); going down is free, so a pit holds what walks into it */
    if (DIGN && !e.cl && (digCol(ox, oy) || digCol(e.x, e.y)) && hAt(e.x, e.y) - hAt(ox, oy) > 0.9 + ((e.jy || 0) > 0.1 ? 1.2 : 0)){ e.x = ox; e.y = oy; break; }
  }
}

