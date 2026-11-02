/* Reference-matched vehicles (user reference pictures, 1 Nov 2026): 90s boxy low-poly look. Raked windscreen on slim pillars, sloping hood,
   slatted grille flanked by square headlights with amber indicators, chunky grey-blue bumper with two black bull-bar posts, dark arch frames,
   dark lower cladding, big black mirrors, tinted glass. Police SUV, green SUV, red and orange pickups, green van, ambulance, fire engine. */
var CK = require('../tools/cabin_kit.js');
var DK = '#23262b', BUMP = '#5d6d7b', HL = '#ecece4', AMB = '#e8941c', SLAT = '#3b4048', RED = '#d2342b', BLUE = '#3a7ae0';
function rx(deg){ return [deg, 0, 0]; }

/* the front end: grille with slats, headlights with indicators, bumper with bull-bar posts */
function face(b, o){
  var hw = o.hw, F = o.F, bb = o.bb, belt = o.belt, gw = o.gw || hw*0.52, gy0 = bb + 0.22, gy1 = belt - 0.1;
  b.box([-gw, gy0, F - 0.03], [gw, gy1, F + 0.03], {c:DK, m:'plastic', name:'grille'});
  for (var y = gy0 + 0.05; y < gy1 - 0.04; y += 0.07) b.box([-gw + 0.03, y, F + 0.03], [gw - 0.03, y + 0.025, F + 0.05], {c:SLAT, m:'plastic', name:'grille'});
  var hy = bb + 0.34;
  b.block('box', [(gw + hw)/2 + 0.02, hy + 0.1, F + 0.02], [hw - gw - 0.1, 0.18, 0.06], {c:'#f6f6f0', m:'plastic', fn:'headlight', mx:true, name:'headlight'});
  b.box([gw + 0.05, bb + 0.24, F - 0.03], [hw - 0.06, bb + 0.33, F + 0.04], {c:AMB, m:'plastic', mx:true, name:'indicator'});
  b.box([-hw - 0.04, bb - 0.12, F - 0.05], [hw + 0.04, bb + 0.2, F + 0.14], {c:BUMP, m:'steel', name:'front bumper'});
  b.box([0.34, bb + 0.2, F + 0.06], [0.44, bb + 0.64, F + 0.15], {c:DK, m:'steel', mx:true, name:'bull bar post'});
}
/* arch frame around a wheel: a lip over the tyre and a post each side */
function arch(b, hw, r, az, nm){
  var t = 2*r + 0.1, c = {c:DK, m:'plastic', mx:true, name:nm};
  b.box([hw - 0.02, 2*r + 0.02, az - r - 0.1], [hw + 0.06, t, az + r + 0.1], c);
  b.box([hw - 0.02, r + 0.15, az + r + 0.04], [hw + 0.06, t, az + r + 0.1], c);
  b.box([hw - 0.02, r + 0.15, az - r - 0.1], [hw + 0.06, t, az - r - 0.04], c);
}
function mirror(b, hw, belt, z){
  b.box([hw - 0.03, belt + 0.18, z - 0.03], [hw + 0.08, belt + 0.23, z + 0.03], {c:DK, m:'plastic', mx:true, name:'mirror arm'});
  b.box([hw + 0.06, belt + 0.1, z - 0.06], [hw + 0.19, belt + 0.36, z + 0.04], {c:DK, m:'plastic', mx:true, name:'wing mirror'});
}
function bar(b, kind, z, y){
  b.box([-0.6, y, z - 0.12], [0.6, y + 0.05, z + 0.12], {c:DK, m:'plastic', name:'light bar'});
  var segs = kind === 'police' ? [[-0.6, -0.02, RED], [-0.02, 0.02, '#e8e8e0'], [0.02, 0.6, BLUE]] : kind === 'ambulance' ? [[-0.6, -0.1, RED], [-0.1, 0.25, '#e8e8e0'], [0.25, 0.6, AMB]] : [[-0.6, 0.6, AMB]];
  segs.forEach(function(s){ b.box([s[0], y + 0.05, z - 0.1], [s[1], y + 0.16, z + 0.1], {c:s[2], m:'plastic', name:'light bar lamp'}); });
}


/* block lettering: 3x5 pixel letters as runs of thin boxes on the side of a vehicle; side +1 reads from the front (+z) to the back, side -1 the other way */
var FONT = {A:['.#.','#.#','###','#.#','#.#'], B:['##.','#.#','##.','#.#','##.'], C:['.##','#..','#..','#..','.##'], D:['##.','#.#','#.#','#.#','##.'], E:['###','#..','##.','#..','###'], F:['###','#..','##.','#..','#..'], I:['###','.#.','.#.','.#.','###'], L:['#..','#..','#..','#..','###'], M:['#.#','###','###','#.#','#.#'], N:['##.','#.#','#.#','#.#','#.#'], O:['###','#.#','#.#','#.#','###'], P:['##.','#.#','##.','#..','#..'], R:['##.','#.#','##.','#.#','#.#'], S:['.##','#..','.#.','..#','##.'], U:['#.#','#.#','#.#','#.#','###'], Y:['#.#','#.#','.#.','.#.','.#.'], '1':['.#.','##.','.#.','.#.','###'], '9':['###','#.#','###','..#','###'], ' ':['...','...','...','...','...']};
function textLen(str, px){ return (str.length*4 - 1)*px; }
function text(b, str, o){
  var px = o.px, cols = [], r, c, i;
  for (r = 0; r < 5; r++){ var row = ''; for (i = 0; i < str.length; i++){ row += FONT[str[i]][r] + (i < str.length - 1 ? '.' : ''); } cols.push(row); }
  var open = {}, rects = [];
  for (r = 0; r <= 5; r++){
    var row2 = r < 5 ? cols[r] : '', runs = {}, c0 = -1;
    for (c = 0; c <= row2.length; c++){
      var on = c < row2.length && row2[c] === '#';
      if (on && c0 < 0) c0 = c;
      if (!on && c0 >= 0){ runs[c0 + '-' + c] = [c0, c]; c0 = -1; }
    }
    Object.keys(open).forEach(function(k){ if (!runs[k]){ rects.push(open[k]); delete open[k]; } });
    Object.keys(runs).forEach(function(k){ if (open[k]) open[k].r1 = r + 1; else open[k] = {c0:runs[k][0], c1:runs[k][1], r0:r, r1:r + 1}; });
  }
  rects.forEach(function(q){
    var y0 = o.y + (5 - q.r1)*px, y1 = o.y + (5 - q.r0)*px, za, zb;
    if (o.side > 0){ za = o.z - q.c1*px; zb = o.z - q.c0*px; } else { za = o.z + q.c0*px; zb = o.z + q.c1*px; }
    var xa = o.side > 0 ? o.x : -o.x - 0.012;
    b.box([xa, y0, za], [xa + 0.012, y1, zb], {c:o.c, m:'plastic', name:o.name || 'lettering'});
  });
}

/* a flat slab with four corners given as [z, y] (a trapezoid: window glass that follows a raked pillar), from x0 to x1 */
function trap(b, x0, x1, p, opt){
  var cz = (p[0][0] + p[1][0] + p[2][0] + p[3][0])/4, cy = (p[0][1] + p[1][1] + p[2][1] + p[3][1])/4, cx = (x0 + x1)/2, v = [], f = [[0, 3, 2, 1], [4, 5, 6, 7]], i;
  [x0, x1].forEach(function(x){ p.forEach(function(q){ v.push([x - cx, q[1] - cy, q[0] - cz]); }); });
  for (i = 0; i < 4; i++) f.push([i, (i + 1) % 4, (i + 1) % 4 + 4, i + 4]);
  return b_block(b, [cx, cy, cz], v, f, opt);
}
function b_block(b, pos, v, f, opt){ opt.v = v; opt.f = f; return b.block('corner', pos, null, opt); }

function refcar(WSB, id, S){
  var b = WSB.create({id:id, name:S.name, domain:'land', cls:S.cls, paint:{paint1:S.paint[0], paint2:S.paint[1], paint3:S.paint[2]}, topSpeed:S.top});
  var hw = S.hw, F = S.F, B = S.B, belt = S.belt, roof = S.roof, fl = S.floor, bb = fl - 0.04, cabF = S.cabF, cb = S.cabB, r = S.r, g = 0.32, k = S.kind;
  var fc = S.frontCol || 'paint1', cc = S.cladCol || 'paint2', al = S.alpha || 28, A = al*Math.PI/180;
  b.wheels(r, 0.26); b.axle(S.fz, {steer:true, track:hw - 0.13, name:'front axle'}); b.axle(S.rz, {driven:true, track:hw - 0.13, name:'rear axle'});
  b.box([hw - 0.5, g, B + 0.1], [hw - 0.38, g + 0.14, F - 0.1], {c:'underside', m:'steel', mx:true, name:'chassis rail'});
  b.box([-hw + 0.1, fl - 0.14, B + 0.05], [hw - 0.1, fl - 0.05, cabF], {c:'underside', m:'steel', name:'floor pan'});
  /* front: bay, sloping hood, raked windscreen on slim pillars */
  b.box([-hw, bb, cabF], [hw, belt - 0.05, F], {c:fc, name:'engine bay'});
  var Lh = F - cabF + 0.02, drop = S.drop || 0.16, th = 0.16;
  b.block('box', [0, belt + 0.1 - drop/2 - th/2, (cabF + F + 0.02)/2], [2*hw - 0.1, th, Lh], {c:fc, rot:rx(Math.atan(drop/Lh)*180/Math.PI), name:'hood'});
  var wy0 = belt + 0.08, wy1 = roof - 0.08, wh = wy1 - wy0, dz = wh*Math.tan(A), wl = wh/Math.cos(A), wz = cabF + 0.04 - dz/2, wy = (wy0 + wy1)/2;
  b.block('box', [0, wy, wz], [2*hw - 0.16, wl, 0.04], {c:'glassL', m:'glass', rot:rx(-al), name:'windscreen'});
  b.block('box', [hw - 0.06, wy, wz - 0.01], [0.06, wl + 0.05, 0.07], {c:'paint1', mx:true, rot:rx(-al), name:'A pillar'});
  b.box([hw - 0.06, belt, cabF - 0.04], [hw, wy0 + 0.04, cabF + 0.08], {c:'paint1', mx:true, name:'cowl post'});
  var rf = cabF + 0.04 - dz + 0.06;
  b.box([-hw + 0.04, roof - 0.1, cb - 0.05], [hw - 0.04, roof, rf], {c:'paint1', name:'roof'});
  b.box([-hw + 0.04, belt + 0.03, cabF - 0.02], [hw - 0.04, belt + 0.12, cabF + 0.1], {c:'paint1', name:'scuttle'});
  /* sides and rear */
  var tail = B + 0.1, open = (k === 'suv');
  b.box([hw - 0.06, bb, B], [hw, belt, cabF], {c:'paint1', mx:true, name:'side skin'});
  if (k === 'van'){ b.box([hw - 0.06, belt, B], [hw, roof - 0.1, cb], {c:'paint1', mx:true, name:'van side'}); b.box([-hw + 0.04, roof - 0.1, B], [hw - 0.04, roof, cb], {c:'paint1', name:'van roof'}); }
  b.box([-hw, bb, B], [hw, belt, B + 0.1], {c:'paint1', name:'rear panel'});
  if (k === 'suv'){
    b.box([-hw + 0.08, belt + 0.04, tail - 0.03], [hw - 0.08, roof - 0.1, tail], {c:'glassL', m:'glass', name:'rear window'});
    b.box([hw - 0.09, belt, tail - 0.04], [hw - 0.01, roof - 0.1, tail + 0.12], {c:'paint1', mx:true, name:'C pillar'});
    b.box([hw - 0.05, belt + 0.03, tail + 0.12], [hw - 0.02, roof - 0.12, S.rz + 0.15 - 0.4], {c:'glassL', m:'glass', mx:true, name:'quarter window'});
  } else if (k === 'pickup'){
    b.box([-hw + 0.04, belt, cb - 0.05], [hw - 0.04, belt + 0.14, cb], {c:'paint1', name:'cab back lower'});
    b.box([-hw + 0.1, belt + 0.14, cb - 0.05], [hw - 0.1, roof - 0.12, cb - 0.02], {c:'glassL', m:'glass', name:'rear window'});
    b.box([hw - 0.09, belt, cb - 0.05], [hw - 0.01, roof - 0.1, cb + 0.08], {c:'paint1', mx:true, name:'C pillar'});
    b.box([-hw, bb, B], [hw, belt - 0.3, cb - 0.05], {c:'paint1', name:'bed floor'});
    b.box([hw - 0.1, belt - 0.3, B], [hw, belt + 0.1, cb - 0.05], {c:'paint1', mx:true, name:'bed side'});
    b.box([-hw + 0.1, belt - 0.3, B], [hw - 0.1, belt + 0.1, B + 0.1], {c:'paint1', name:'tailgate'});
    b.box([-hw + 0.1, belt - 0.3, cb - 0.15], [hw - 0.1, belt + 0.1, cb - 0.05], {c:'paint1', name:'bed front'});
    b.box([-hw + 0.12, belt - 0.3, B + 0.1], [hw - 0.12, belt - 0.26, cb - 0.15], {c:'#2b2622', m:'plastic', name:'bed liner'});
  } else {
    b.box([-hw + 0.04, belt, cb - 0.05], [hw - 0.04, roof - 0.12, cb], {c:'paint1', name:'bulkhead'});
    b.box([-hw + 0.04, belt, B], [hw - 0.04, roof - 0.1, B + 0.1], {c:'paint1', name:'van back'});
  }
  /* doors */
  var dz1 = cabF - 0.12, dz0 = Math.max(cb + 0.15, dz1 - 1.1);
  var tA = Math.tan(A), zp = function(y){ return cabF + 0.04 - (y - wy0)*tA; };
  var gy0 = belt, gy1 = roof - 0.12, gf0 = zp(gy0) - 0.07, gf1 = zp(gy1) - 0.07, gr = dz0 + 0.04;
  b.door([hw, bb + 0.04, dz0], [hw + 0.05, belt, dz1], {c:'paint1', mx:true, hinge:'front', name:'front door'});
  trap(b, hw + 0.01, hw + 0.04, [[gr, gy0], [gf0, gy0], [gf1, gy1], [gr, gy1]], {c:'glassL', m:'glass', mx:true, name:'front door'});
  b.box([hw, roof - 0.12, dz0], [hw + 0.05, roof - 0.1, gf1 + 0.04], {c:'paint1', mx:true, name:'front door'});
  b.box([hw, belt, dz0], [hw + 0.05, roof - 0.12, dz0 + 0.04], {c:'paint1', mx:true, name:'front door'});
  var fl_ = Math.sqrt((gf0 - gf1)*(gf0 - gf1) + (gy1 - gy0)*(gy1 - gy0)), fang = Math.atan2(gf0 - gf1, gy1 - gy0)*180/Math.PI;
  b.block('box', [hw + 0.025, (gy0 + gy1)/2, (gf0 + gf1)/2 + 0.035], [0.05, fl_ + 0.04, 0.05], {c:'paint1', mx:true, rot:[-fang, 0, 0], name:'front door'});
  b.box([hw, belt - 0.02, dz1 - 0.02], [hw + 0.05, belt + 0.02, gf0 + 0.06], {c:'paint1', mx:true, name:'front door'});
  b.box([hw + 0.05, belt - 0.12, dz0 + 0.06], [hw + 0.08, belt - 0.08, dz0 + 0.26], {c:'chrome', m:'chrome', mx:true, name:'door handle'});
  /* face, arches, cladding, mirrors, tail */
  face(b, {hw:hw, F:F, bb:bb, belt:belt});
  arch(b, hw, r, S.fz, 'front arch trim'); arch(b, hw, r, S.rz, 'rear arch trim');
  var segs = [[S.rz + r + 0.12, S.fz - r - 0.12], [S.fz + r + 0.12, F - 0.05], [B + 0.1, S.rz - r - 0.12]];
  segs.forEach(function(s){ if (s[1] - s[0] > 0.2) b.box([hw - 0.02, bb, s[0]], [hw + 0.04, bb + 0.28, s[1]], {c:cc, mx:true, name:'cladding'}); });
  mirror(b, hw, belt, cabF - 0.12);
  b.box([-hw - 0.04, bb - 0.1, B - 0.1], [hw + 0.04, bb + 0.2, B + 0.05], {c:BUMP, m:'steel', name:'rear bumper'});
  b.light('taillight', [hw - 0.2, belt - 0.12, B], [0.26, 0.16, 0.04]);
  if (S.bar) bar(b, S.bar, rf - 0.2, roof);
  if (S.rack){ [-0.55, 0.55].forEach(function(x){ b.box([x - 0.03, roof, B + 0.5], [x + 0.03, roof + 0.1, cb - 0.3], {c:DK, m:'steel', name:'roof rack rail'}); }); for (var zz = B + 0.55; zz < cb - 0.35; zz += 0.4) b.box([-0.58, roof + 0.08, zz], [0.58, roof + 0.12, zz + 0.05], {c:DK, m:'steel', name:'roof rack slat'}); }
  (S.stripes || []).forEach(function(s){ b.box([hw, s[0], s[1]], [hw + 0.015, s[2], s[3]], {c:s[4], mx:true, name:'stripe'}); });
  (S.words || []).forEach(function(w){
    var L = textLen(w.t, w.px), zr = w.zEnd == null ? (w.onDoor ? dz1 - 0.12 : cb - 0.1) : w.zEnd, x = w.onDoor ? hw + 0.05 : hw;
    text(b, w.t, {side:1, x:x, y:w.y, z:zr, px:w.px, c:w.c, name:'lettering'}); text(b, w.t, {side:-1, x:x, y:w.y, z:zr - L, px:w.px, c:w.c, name:'lettering'});
  });
  var rear = (k === 'suv') ? [cabF - 0.78 - 0.95, cabF - 0.78 - 0.95] : [];
  CK.carCabin(b, {hw:hw, belt:belt, roof:roof, cabF:cabF, cabB:cb, g:g, floor:fl, seatY:fl + 0.18, rear:rear, seatC:'#7a4e34', headF:rf - 0.04});
  b.engine([0, belt - 0.3, (cabF + F)/2 + 0.1], [hw*1.1, 0.5, Math.max(0.5, F - cabF - 0.2)]); b.tank([0, bb + 0.2, B + 0.6], [0.7, 0.25, 0.5]); b.battery([hw - 0.35, belt - 0.2, F - 0.4]);
  if (k === 'van'){
    b.shell([-hw + 0.06, fl, B + 0.12], [hw - 0.06, roof - 0.12, cb - 0.05], {open:['back'], c:'paint1', wall:0.04, floor:0.06, name:'cargo', room:'cargo'});
    b.door([-hw + 0.04, fl - 0.06, B - 0.06], [hw - 0.04, roof - 0.1, B + 0.1], {kind:'swing', hinge:'outer', c:'paint1', name:'rear doors'});
  }
  return b;
}

var P = {
  police: {name:'Police SUV', cls:'car', kind:'suv', F:2.3, B:-2.3, hw:0.93, belt:1.15, roof:1.86, cabF:0.95, cabB:-2.15, floor:0.55, fz:1.42, rz:-1.38, r:0.4, alpha:28, paint:['#ecece6', '#17181b', '#8a8a86'], frontCol:'paint2', cladCol:'paint2', bar:'police', words:[{t:'POLICE', onDoor:true, y:0.86, px:0.034, c:'#17181b'}], top:70},
  green_suv: {name:'Green SUV', cls:'car', kind:'suv', F:2.3, B:-2.3, hw:0.93, belt:1.15, roof:1.86, cabF:0.95, cabB:-2.15, floor:0.55, fz:1.42, rz:-1.38, r:0.4, alpha:28, paint:['#4c7a4a', '#2c4a2c', '#8a8a86'], top:60},
  red_pickup: {name:'Red pickup', cls:'pickup', kind:'pickup', F:2.55, B:-2.85, hw:0.93, belt:1.12, roof:1.74, cabF:1.0, cabB:-0.2, floor:0.54, fz:1.6, rz:-1.5, r:0.4, alpha:30, paint:['#c23a2c', '#7a2a20', '#8a8a86'], top:58},
  orange_pickup: {name:'Orange pickup', cls:'pickup', kind:'pickup', F:2.55, B:-2.85, hw:0.93, belt:1.12, roof:1.74, cabF:1.0, cabB:-0.2, floor:0.54, fz:1.6, rz:-1.5, r:0.4, alpha:30, paint:['#c9784a', '#8a4a2c', '#8a8a86'], cladCol:'paint2', top:58},
  green_van: {name:'Green van', cls:'van', kind:'van', F:2.45, B:-2.45, hw:1.0, belt:1.1, roof:2.2, cabF:1.15, cabB:0.0, floor:0.62, fz:1.5, rz:-1.5, r:0.43, alpha:36, drop:0.3, rack:true, paint:['#8ab84a', '#4c6a2a', '#8a8a86'], top:50},
  ambulance: {name:'Ambulance', cls:'van', kind:'van', F:2.45, B:-2.45, hw:1.0, belt:1.1, roof:2.35, cabF:1.15, cabB:0.0, floor:0.62, fz:1.5, rz:-1.5, r:0.43, alpha:36, drop:0.3, bar:'ambulance', cladCol:'paint3', paint:['#eeeeea', '#c9302a', '#7a7e84'], stripes:[[1.0, -2.45, 1.4, 0.0, '#c9302a'], [0.85, 1.15, 1.2, 2.45, '#c9302a']], words:[{t:'AMBULANCE', y:1.58, px:0.05, c:'#2f5fb0'}], top:60}
};
function fireEngine(WSB){
  var b = WSB.create({id:'fire_engine_city', name:'Fire engine (city)', domain:'land', cls:'truck', paint:{paint1:'#c4302a', paint2:'#6b7078', paint3:'#ecece6'}, topSpeed:65, tank:'large'});
  b.wheels(0.52, 0.3); b.axle(2.7, {steer:true, track:1.1, name:'front axle'}); b.axle(-2.4, {driven:true, track:1.1, name:'rear axle'});
  b.box([-0.45, 0.7, -4.8], [0.45, 0.9, 4.0], {c:'underside', m:'steel', name:'chassis'});
  b.box([-1.3, 0.9, 3.3], [1.3, 1.9, 4.1], {c:'paint1', name:'nose'});
  CK.truckCab(b, {hw:1.3, zB:1.4, zF:3.3, fl:1.0, belt:1.85, roof:2.9, seatY:1.3, driverX:-0.55});
  b.box([-1.31, 1.35, 3.25], [1.31, 1.6, 4.12], {c:'paint3', name:'front stripe'});
  b.box([-1.31, 1.0, 3.3], [1.31, 1.35, 4.1], {c:'paint1', name:'nose lower'});
  b.box([-1.31, 2.5, 3.2], [1.31, 2.9, 3.4], {c:'paint3', name:'cab header'});
  face(b, {hw:1.3, F:4.1, bb:0.78, belt:1.9, gw:0.4});
  b.box([-1.4, 0.55, 4.0], [1.4, 0.92, 4.5], {c:BUMP, m:'steel', name:'front bumper'});
  arch(b, 1.3, 0.52, 2.7, 'front arch trim'); arch(b, 1.3, 0.52, -2.4, 'rear arch trim');
  b.box([-0.04, 1.85, 3.33], [0.04, 2.8, 3.39], {c:'paint3', name:'windscreen post'});
  [[-1.25, -1.05], [1.05, 1.25], [-0.55, -0.35], [0.35, 0.55]].forEach(function(x){ b.box([x[0], 2.6, 3.4], [x[1], 2.72, 3.45], {c:AMB, m:'plastic', name:'cab lamp'}); });
  [-1.2, 1.2].forEach(function(x){ b.box([x - 0.1, 2.95, -4.8], [x + 0.1, 3.1, -4.6], {c:RED, m:'plastic', name:'beacon'}); });
  text(b, 'FIRE', {side:1, x:1.35, y:1.3, z:3.1, px:0.06, c:'#ecece6', name:'lettering'}); text(b, 'FIRE', {side:-1, x:1.35, y:1.3, z:3.1 - textLen('FIRE', 0.06), px:0.06, c:'#ecece6', name:'lettering'});
  b.shell([-1.2, 1.0, -4.7], [1.2, 2.7, 1.3], {open:['back'], c:'paint2', floorC:'underside', wall:0.05, floor:0.1, name:'locker', room:'locker'});
  b.door([-1.2, 1.0, -4.8], [1.2, 2.7, -4.72], {kind:'roll', c:'paint1', name:'locker door'});
  b.box([-1.3, 2.7, -4.8], [1.3, 2.95, 1.4], {c:'paint2', name:'upper body'});
  [[-4.5, -2.9], [-2.8, -1.2], [-1.1, 1.2]].forEach(function(s){ b.box([1.2, 1.1, s[0]], [1.27, 2.6, s[1]], {c:'paint1', mx:true, fitting:true, name:'locker panel'}); });
  b.block('cyl', [0, 3.07, -1.8], [0.22, 0.22, 4.4], {c:DK, m:'plastic', ax:'z', name:'hose tube'});
  b.box([-0.45, 2.95, -4.0], [0.45, 3.0, 0.4], {c:DK, m:'steel', name:'hose cradle'});
  bar(b, 'police', 3.0, 2.9);
  b.box([-1.35, 0.8, -4.95], [1.35, 1.0, -4.78], {c:BUMP, m:'steel', name:'rear bumper'});
  b.light('taillight', [1.1, 1.5, -4.82], [0.2, 0.3, 0.04]);
  b.engine([0, 1.4, 3.0], [1.2, 0.7, 1.0]); b.tank([0, 0.95, -1.5], [0.8, 0.25, 1.5]); b.battery([0.9, 1.3, 3.6]); b.storage([-1.1, 1.05, -4.6], [1.1, 2.4, -2.0], 'hose lockers');
  return b;
}
module.exports = function(WSB){ var out = Object.keys(P).map(function(k){ return refcar(WSB, k, P[k]); }); out.push(fireEngine(WSB)); return out; };
