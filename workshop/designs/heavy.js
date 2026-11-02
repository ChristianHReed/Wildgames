/* Heavy vehicles rebuilt with the reference look recipe (docs/VEHICLE_DESIGN_GUIDE.md): box truck, semi tractor, army cargo truck, motorhome,
   city and school buses, APC, ammo trailer, box trailer. Shared cab builder: raked windscreen on slim pillars, door glass, wheel openings cut into
   the body with dark wells, face with slatted grille, big mirrors, tinted glass, full driver kit inside. */
var CK = require('../tools/cabin_kit.js'), R = require('./refs.js'), H = R.H;
var wall = H.wall, arch = H.arch, quad = H.quad, post = H.post, face = H.face, text = H.text, textLen = H.textLen, wheelLook = H.wheelLook, DK = H.DK, BUMP = H.BUMP, AMB = H.AMB, RED = H.RED;
function mkb(WSB, S){ return WSB.create(Object.assign({id:S.id, name:S.name, domain:'land', cls:S.cls, paint:{paint1:S.paint[0], paint2:S.paint[1], paint3:S.paint[2]}, topSpeed:S.top}, S.extra || {})); }
/* wheels, axles and frame; returns the wheel openings */
function chassis(b, S){ if (S.id && S.id !== undefined && arguments.length > 2){} 
  var r = S.r, w = S.w || 0.28, hw = S.hw, ops = [];
  b.wheels(r, w); wheelLook(b, r, w);
  S.axles.forEach(function(a, i){ b.axle(a.z, {steer:!!a.steer, driven:!!a.driven, track:hw - 0.13, name:a.name || ('axle ' + (i + 1))}); ops.push({a:a.z - r - 0.08, b:a.z + r + 0.08, top:2*r + 0.08, wx:hw - 0.3}); });
  var zs = S.axles.map(function(a){ return a.z; }), y = S.railY || 0.5;
  b.box([hw - 0.55, y, S.B + 0.1], [hw - 0.42, y + 0.2, S.F - 0.1], {c:'underside', m:'steel', mx:true, name:'chassis rail'});
  b.box([-hw + 0.2, y + 0.12, S.B + 0.1], [hw - 0.2, y + 0.26, S.F - 0.1], {c:'underside', m:'steel', name:'cross frame'});
  return ops;
}
/* the cab: o = {hw, fl, belt, roof, zB, zF, F, ops, alpha, drop, lean, rear} */
function cab(b, o){
  var hw = o.hw, fl = o.fl, bb = fl - 0.04, belt = o.belt, roof = o.roof, zB = o.zB, zF = o.zF, F = o.F, ops = o.ops, L = o.lean == null ? 0.06 : o.lean, al = o.alpha == null ? 16 : o.alpha, A = al*Math.PI/180;
  var fc = o.frontCol || 'paint1', hood = F - zF > 0.3;
  b.box([-hw + 0.1, fl - 0.14, zB], [hw - 0.1, fl - 0.05, zF], {c:'underside', m:'steel', name:'cab floor pan'});
  if (hood){
    b.box([-hw + 0.3, bb, zF], [hw - 0.3, belt - 0.05, F], {c:fc, name:'engine bay'});
    wall(b, hw - 0.3, hw, bb, belt - 0.05, zF, F, {c:fc, mx:true, name:'fender'}, ops);
    var Lh = F - zF + 0.02, drop = o.drop == null ? 0.14 : o.drop, th = 0.16;
    b.block('box', [0, belt + 0.1 - drop/2 - th/2, (zF + F + 0.02)/2], [2*hw - 0.1, th, Lh], {c:fc, rot:[Math.atan(drop/Lh)*180/Math.PI, 0, 0], name:'hood'});
  } else b.box([-hw, bb, zF], [hw, belt + 0.1, F], {c:fc, name:'cab front'});
  var wy0 = belt + 0.08, wy1 = roof - 0.08, wh = wy1 - wy0, dz = wh*Math.tan(A), wl = wh/Math.cos(A), wz = zF + 0.04 - dz/2, wy = (wy0 + wy1)/2, zb0 = zF + 0.04, zt0 = zb0 - dz, nx = [0, Math.sin(A), Math.cos(A)], wxw = hw - 0.08;
  quad(b, [[-wxw, wy0, zb0], [wxw, wy0, zb0], [wxw - L, wy1, zt0], [-wxw + L, wy1, zt0]], [0, -0.04*nx[1], -0.04*nx[2]], {c:'glassL', m:'glass', name:'windscreen'});
  b.block('box', [hw - 0.04 - L/2, wy, wz - 0.01], [0.08, wl + 0.05, 0.08], {c:'paint1', mx:true, rot:[-al, 0, Math.atan2(L, wh)*180/Math.PI], name:'A pillar'});
  b.box([hw - 0.06, belt, zF - 0.04], [hw, wy0 + 0.04, zF + 0.08], {c:'paint1', mx:true, name:'cowl post'});
  var rf = zt0 + 0.06;
  if (o.frontOnly) return {rf:rf, zt0:zt0, wy1:wy1};
  b.box([-hw + 0.04 + L, roof - 0.1, zB - 0.05], [hw - 0.04 - L, roof, rf], {c:'paint1', name:'cab roof'});
  b.box([-hw + 0.04, belt + 0.03, zF - 0.02], [hw - 0.04, belt + 0.12, zF + 0.1], {c:'paint1', name:'scuttle'});
  wall(b, hw - 0.06, hw, bb, belt, zB, zF, {c:'paint1', mx:true, name:'cab side'}, ops);
  b.box([-hw + 0.04, bb, zB - 0.05], [hw - 0.04, belt, zB], {c:'paint1', name:'cab back lower'});
  b.box([-hw + 0.04, belt, zB - 0.05], [hw - 0.04, roof - 0.1, zB], {c:o.backCol || 'paint1', name:'cab back'});
  if (o.rearGlass) quad(b, [[-hw + 0.3, belt + 0.25, zB - 0.02], [hw - 0.3, belt + 0.25, zB - 0.02], [hw - 0.3 - L, roof - 0.25, zB - 0.02], [-hw + 0.3 + L, roof - 0.25, zB - 0.02]], [0, 0, 0.03], {c:'glassL', m:'glass', name:'rear window'});
  /* door */
  var tA = Math.tan(A), zp = function(y){ return zF + 0.04 - (y - wy0)*tA; }, gy0 = belt, gy1 = roof - 0.12, g0 = zp(gy0) - 0.07, g1 = zp(gy1) - 0.07, z1 = zF - 0.1, z0 = Math.max(zB + 0.2, z1 - 1.15), gr = z0 + 0.04;
  b.door([hw, bb + 0.04, z0], [hw + 0.05, belt, z1], {c:'paint1', mx:true, hinge:'front', name:'cab door'});
  quad(b, [[hw + 0.04, gy0, gr], [hw + 0.04, gy0, g0], [hw + 0.04 - L, gy1, g1], [hw + 0.04 - L, gy1, gr]], [-0.03, 0, 0], {c:'glassL', m:'glass', mx:true, name:'cab door'});
  b.box([hw - L, roof - 0.12, z0], [hw + 0.05 - L, roof - 0.1, g1 + 0.04], {c:'paint1', mx:true, name:'cab door'});
  post(b, hw + 0.025, belt, roof - 0.1, z0, z0 + 0.05, 0.05, L, {c:'paint1', name:'cab door'});
  var fl2 = Math.sqrt((g0 - g1)*(g0 - g1) + (gy1 - gy0)*(gy1 - gy0)), fa = Math.atan2(g0 - g1, gy1 - gy0)*180/Math.PI;
  b.block('box', [hw + 0.025 - L/2, (gy0 + gy1)/2, (g0 + g1)/2 + 0.035], [0.05, fl2 + 0.04, 0.05], {c:'paint1', mx:true, rot:[-fa, 0, Math.atan2(L, gy1 - gy0)*180/Math.PI], name:'cab door'});
  b.box([hw, belt - 0.02, z1 - 0.02], [hw + 0.05, belt + 0.02, g0 + 0.06], {c:'paint1', mx:true, name:'cab door'});
  b.box([hw + 0.05, belt - 0.12, z0 + 0.06], [hw + 0.08, belt - 0.08, z0 + 0.26], {c:'chrome', m:'chrome', mx:true, name:'door handle'});
  b.box([hw - 0.02, bb - 0.12, z0 + 0.1], [hw + 0.2, bb - 0.04, z1 - 0.05], {c:DK, m:'steel', mx:true, name:'cab step'});
  /* big truck mirrors on arms */
  b.box([hw - 0.03, belt + 0.25, zF - 0.1], [hw + 0.25, belt + 0.3, zF - 0.05], {c:DK, m:'plastic', mx:true, name:'mirror arm'});
  b.box([hw + 0.2, belt + 0.05, zF - 0.16], [hw + 0.3, belt + 0.6, zF - 0.02], {c:DK, m:'plastic', mx:true, name:'wing mirror'});
  /* interior: dash, wheel, seats, mirror, visors */
  CK.carCabin(b, {hw:hw, belt:belt, roof:roof, cabF:zF, cabB:zB, g:fl - 0.28, floor:fl, seatY:fl + 0.18, rear:o.rear || [], seatC:'#6a4a34', headF:rf - 0.04});
  var fi = {fitting:true, m:'plastic'};
  b.box([-0.012, wy1 - 0.09, zt0 - 0.07], [0.012, roof - 0.1, zt0 - 0.04], Object.assign({c:DK, name:'mirror arm'}, fi));
  b.box([-0.16, wy1 - 0.17, zt0 - 0.09], [0.16, wy1 - 0.09, zt0 - 0.03], Object.assign({c:DK, name:'rear-view mirror'}, fi));
  [[-0.58, -0.06], [0.06, 0.58]].forEach(function(x){ b.box([x[0], roof - 0.17, zt0 - 0.46], [x[1], roof - 0.1, zt0 - 0.06], Object.assign({c:'#3d3d46', name:'sun visor'}, fi)); });
  return {rf:rf, zt0:zt0};
}
/* nose fittings: face with grille, headlights, bumper */
function nose(b, o){
  face(b, {hw:o.hw, F:o.F, bb:o.bb, belt:o.belt, gw:o.gw});
}
/* fenders over a pair of wheels for a body: a dark flare lip and a well */
function fenders(b, hw, ops, bb, nm){ ops.forEach(function(o){ arch(b, hw, o, bb, nm); }); }
/* marker lights along an edge */
function markers(b, hw, y, z0, z1, n, col){ for (var i = 0; i < n; i++){ var z = z0 + (z1 - z0)*i/(n - 1); b.box([hw - 0.01, y, z - 0.05], [hw + 0.03, y + 0.06, z + 0.05], {c:col || AMB, m:'plastic', mx:true, name:'marker light'}); } }

/* ---------- box truck ---------- */
function boxTruck(WSB){
  var S = {id:'box_truck_walkin', name:'Box truck (walk-in)', cls:'truck', paint:['#e8e4da', '#2f5f8a', '#3a3a3a'], top:70, extra:{tank:'large'}, hw:1.05, r:0.46, axles:[{z:2.05, steer:true}, {z:-1.9, driven:true}], F:3.3, B:-4.0, railY:0.55};
  var b = mkb(WSB, S), ops = chassis(b, S), hw = 1.05, fl = 0.98;
  var c = cab(b, {hw:hw, fl:fl, belt:1.6, roof:2.75, zB:0.6, zF:2.2, F:3.3, ops:ops, frontCol:'paint2', drop:0.12});
  nose(b, {hw:hw, F:3.3, bb:fl - 0.04, belt:1.6});
  arch(b, hw, ops[0], fl - 0.04, 'front arch trim');
  /* cargo box */
  var bx = 1.12;
  b.shell([-bx, 1.0, -3.85], [bx, 3.0, 0.45], {open:['back'], c:'paint1', floorC:'#8a6a48', wall:0.05, floor:0.08, name:'cargo box', room:'cargo'});
  b.door([-bx, 1.0, -3.92], [bx, 3.0, -3.87], {kind:'roll', c:'paint1', name:'roll-up door'});
  b.box([-bx - 0.03, 0.72, -4.1], [bx + 0.03, 0.95, -3.85], {c:BUMP, m:'steel', name:'rear bumper'});
  for (var z = -3.45; z < 0.3; z += 0.85) b.box([bx, 1.0, z], [bx + 0.03, 3.0, z + 0.07], {c:'paint3', mx:true, name:'body rib'});
  b.box([bx, 2.9, -3.85], [bx + 0.03, 3.0, 0.45], {c:'paint3', mx:true, name:'roof edge'}); b.box([bx, 1.0, -3.85], [bx + 0.03, 1.1, 0.45], {c:'paint3', mx:true, name:'side rail'});
  b.box([bx + 0.08, 1.6, -3.0], [bx + 0.095, 2.35, -0.6], {c:'paint2', mx:true, name:'side stripe'});
  text(b, 'MOVERS', {side:1, x:bx + 0.105, y:1.75, z:-0.8, px:0.07, c:'#e8e4da', name:'lettering'}); text(b, 'MOVERS', {side:-1, x:bx + 0.105, y:1.75, z:-0.8 - textLen('MOVERS', 0.07), px:0.07, c:'#e8e4da', name:'lettering'});
  [[-1, 1].map(function(s){ return s; })];
  b.box([-bx, 0.96, 0.4], [bx, 1.0, 0.5], {c:'underside', m:'steel', name:'box front frame'});
  /* rear fenders and mud flaps */
  b.box([bx - 0.02, 0.84, -2.4], [bx + 0.08, 0.92, -1.4], {c:DK, m:'plastic', mx:true, name:'wheel guard'});
  b.box([bx - 0.1, 0.4, -2.35], [bx - 0.04, 0.9, -2.2], {c:DK, m:'rubber', mx:true, name:'mud flap'});
  markers(b, bx, 2.88, -3.7, 0.3, 5); b.box([-bx + 0.1, 2.95, -3.9], [bx - 0.1, 3.0, -3.85], {c:RED, m:'plastic', name:'top marker'});
  b.light('taillight', [bx - 0.2, 1.3, -3.95], [0.16, 0.24, 0.04]); b.light('headlight', [0.8, 1.15, 3.32], [0.24, 0.18, 0.04]);
  b.engine([0, 1.1, 2.7], [0.8, 0.55, 0.9]); b.tank([0.8, 0.6, -0.5], [0.4, 0.4, 0.8]); b.battery([0.6, 1.2, 3.0]); b.storage([-1.0, 1.02, -0.5], [1.0, 2.2, 0.4], 'shelving');
  return b;
}
/* ---------- semi tractor ---------- */
function semi(WSB){
  var S = {id:'semi_tractor', name:'Semi tractor', cls:'semi', paint:['#8a1f1f', '#c9c3b6', '#2a2a2a'], top:70, extra:{tank:'large'}, hw:1.2, r:0.52, w:0.32, axles:[{z:3.2, steer:true}, {z:-0.2, driven:true}, {z:-1.5, driven:true}], F:5.2, B:-2.3, railY:0.6};
  var b = mkb(WSB, S), ops = chassis(b, S), hw = 1.2, fl = 1.05;
  var c = cab(b, {hw:hw, fl:fl, belt:1.95, roof:3.0, zB:1.5, zF:3.3, F:5.2, ops:ops, drop:0.2, alpha:12, backCol:'paint1'});
  nose(b, {hw:hw, F:5.2, bb:fl - 0.04, belt:1.95, gw:0.6});
  b.box([-0.62, 0.9, 5.2], [0.62, 1.9, 5.26], {c:'chrome', m:'chrome', name:'tall grille'});
  for (var gy = 1.0; gy < 1.85; gy += 0.14) b.box([-0.58, gy, 5.26], [0.58, gy + 0.05, 5.3], {c:'#2a2c30', m:'steel', name:'grille bar'});
  b.box([-1.3, 0.55, 5.2], [1.3, 0.95, 5.5], {c:'chrome', m:'chrome', name:'front bumper'});
  /* sleeper */
  b.box([-hw, fl - 0.04, 0.35], [hw, 2.75, 1.5], {c:'paint1', name:'sleeper'});
  b.box([hw - 0.02, 1.5, 0.55], [hw + 0.02, 2.2, 1.25], {c:'#16191d', m:'glass', mx:true, name:'sleeper window'});
  b.box([-hw, 2.75, 0.35], [hw, 3.0, 1.55], {c:'paint1', name:'roof fairing base'});
  b.block('wedge', [0, 3.15, 1.0], [2.3, 0.3, 1.1], {c:'paint1', rot:[0, 180, 0], name:'roof fairing'});
  b.box([-hw - 0.03, 1.0, 0.3], [hw + 0.03, 1.1, 1.5], {c:'paint2', name:'sleeper stripe'});
  [[-0.9, 0.2]].forEach(function(){});
  /* fuel tanks, exhaust stacks, fenders, mud flaps */
  b.block('cyl', [hw + 0.05, 0.95, 0.9], [0.5, 0.5, 1.1], {c:'chrome', m:'chrome', ax:'z', mx:true, name:'fuel tank'});
  b.block('cyl', [hw - 0.1, 2.35, 0.2], [0.14, 2.6, 0.14], {c:'chrome', m:'chrome', mx:true, name:'exhaust stack'});
  [0, 1, 2].forEach(function(i){ var o = ops[i]; arch(b, hw + 0.05, o, 0.6, 'fender'); });
  b.box([-hw, 0.95, -2.3], [hw, 1.0, 0.3], {c:'paint3', name:'deck plate'});
  b.box([-0.5, 1.0, -1.2], [0.5, 1.06, -0.4], {c:'underside', m:'steel', name:'fifth wheel plate'}); b.hitch([0, 1.08, -0.85], 'fifth');
  b.box([-hw, 0.75, -2.4], [hw, 0.95, -2.3], {c:BUMP, m:'steel', name:'rear bumper bar'});
  [-1, 1].forEach(function(sx){ b.box([sx*0.95 - 0.2, 0.2, -2.0], [sx*0.95 + 0.2, 0.7, -1.95], {c:DK, m:'rubber', name:'mud flap'}); });
  b.light('headlight', [0.9, 1.4, 5.3], [0.26, 0.2, 0.04]); b.light('taillight', [0.45, 0.8, -2.32], [0.16, 0.12, 0.04]);
  b.engine([0, 1.4, 4.2], [0.9, 0.7, 1.2]); b.tank([0.78, 0.9, 1.05], [0.5, 0.45, 1.0]); b.battery([0.7, 0.8, 0.2]);
  b.bed([0, 1.35, 0.95], [2.0, 0.25, 0.9], {name:'sleeper bunk'});
  return b;
}
/* ---------- army cargo truck ---------- */
function cargo(WSB){
  var S = {id:'army_cargo_truck', name:'Army 6x6 cargo truck', cls:'truck', paint:['#5a6040', '#2b2d26', '#8a8a78'], top:60, extra:{tank:'large'}, hw:1.1, r:0.52, w:0.32, axles:[{z:2.6, steer:true}, {z:-1.2, driven:true}, {z:-2.6, driven:true}], F:3.7, B:-4.2, railY:0.55};
  var b = mkb(WSB, S), ops = chassis(b, S), hw = 1.1, fl = 1.05;
  var c = cab(b, {hw:hw, fl:fl, belt:1.7, roof:2.75, zB:0.55, zF:2.3, F:3.7, ops:ops, frontCol:'paint1', cladCol:'paint2', drop:0.1, alpha:10});
  nose(b, {hw:hw, F:3.7, bb:fl - 0.04, belt:1.7});
  b.box([-0.5, 2.75, 0.4], [0.5, 2.9, 1.0], {c:'paint2', m:'steel', name:'ring mount base'}); b.block('cyl', [0, 2.97, 0.7], [0.9, 0.06, 0.9], {c:'paint2', m:'steel', name:'ring mount'});
  /* tilt: shell with canvas arches */
  b.shell([-hw, 1.05, -4.0], [hw, 3.0, 0.4], {open:['back'], c:'paint3', floorC:'#6a5a3e', wall:0.05, floor:0.1, name:'tilt', room:'cargo'});
  b.door([-hw, 1.05, -4.07], [hw, 3.0, -4.02], {kind:'roll', c:'paint1', name:'tailgate flap'});
  b.box([-hw - 0.02, 0.65, -4.2], [hw + 0.02, 1.05, -4.0], {c:'underside', m:'steel', name:'rear step'});
  b.box([hw, 1.0, -4.0], [hw + 0.04, 1.4, 0.4], {c:'paint1', mx:true, name:'cargo bed rail'});
  for (var z = -3.6; z < 0.3; z += 0.7) b.box([hw, 1.4, z], [hw + 0.03, 2.95, z + 0.06], {c:'#4a4d36', mx:true, name:'canvas rib'});
  b.box([hw, 1.4, -4.0], [hw + 0.05, 1.5, 0.4], {c:'#4a4d36', mx:true, name:'canvas hem'});
  [0, 1, 2].forEach(function(i){ if (i) arch(b, hw + 0.04, ops[i], 0.9, 'fender'); });
  [1, 2].forEach(function(i){ var o = ops[i]; b.box([hw - 0.02, 1.0, o.a], [hw + 0.08, 1.06, o.b], {c:DK, m:'plastic', mx:true, name:'wheel guard'}); });
  b.box([-0.5, 0.86, 3.7], [0.5, 0.96, 3.95], {c:DK, m:'steel', name:'winch bar'});
  b.hitch([0, 0.7, -4.25], 'pintle'); b.storage([-1.0, 1.1, -3.9], [1.0, 2.2, -2.0], 'load');
  b.light('headlight', [0.75, 1.3, 3.72], [0.24, 0.2, 0.04]); b.light('taillight', [1.0, 1.3, -4.05], [0.16, 0.24, 0.04]);
  b.engine([0, 1.3, 3.0], [0.8, 0.6, 1.0]); b.tank([0.8, 0.65, -0.6], [0.4, 0.4, 0.9]); b.battery([0.6, 1.3, 3.3]);
  text(b, 'ARMY', {side:1, x:hw + 0.055, y:1.8, z:-1.0, px:0.12, c:'#d8d4b8', name:'lettering'}); text(b, 'ARMY', {side:-1, x:hw + 0.055, y:1.8, z:-1.0 - textLen('ARMY', 0.12), px:0.12, c:'#d8d4b8', name:'lettering'});
  return b;
}

/* ---------- military cars (jeep, humvee, armoured car) on the reference car builder ---------- */
var OD = ['#5a6040', '#2b2d26', '#8a8a78'], SAND = ['#a89870', '#3a3428', '#8a8a78'];
function spare(b, x, B, y, r){ b.block('cyl', [x, y, B - 0.1], [2*r, 2*r, 0.24], {c:'#23262b', m:'rubber', ax:'z', name:'spare tyre'}); b.block('cyl', [x, y, B - 0.23], [r*0.9, r*0.9, 0.04], {c:'#8f9aa5', m:'steel', ax:'z', name:'spare hub'}); }
function milCar(WSB, S){ S.paint = S.paint; S.cls = 'car'; S.kind = 'suv'; S.frontCol = 'paint1'; S.cladCol = 'paint2'; return R.H.refcar(WSB, S.id, S); }
function jeep(WSB){ return milCar(WSB, {id:'army_jeep', name:'Army jeep', F:1.95, B:-1.75, hw:0.9, belt:1.08, roof:1.8, cabF:0.8, cabB:-1.5, floor:0.52, fz:1.15, rz:-1.0, r:0.4, alpha:32, drop:0.1, paint:OD, top:70,
  extra:function(b, c){ spare(b, 0, c.B, c.belt - 0.15, 0.32); b.block('box', [0.5, c.belt + 0.06, c.B - 0.1], [0.3, 0.38, 0.14], {c:'#4a4d36', m:'steel', name:'jerry can'}); b.box([0.57, c.belt + 0.08, c.B - 0.04], [0.63, c.belt + 0.12, c.B + 0.04], {c:DK, name:'jerry can strap'});
    b.box([c.hw - 0.34, c.roof - 0.02, c.cb + 0.1], [c.hw - 0.3, c.roof + 0.9, c.cb + 0.14], {c:DK, m:'steel', name:'antenna'}); }}); }
function humvee(WSB){ var b = milCar(WSB, {id:'humvee', name:'Humvee', F:2.3, B:-2.3, hw:1.1, belt:1.3, roof:2.0, cabF:0.95, cabB:-1.95, floor:0.62, fz:1.45, rz:-1.45, r:0.46, alpha:30, drop:0.12, doors4:true, paint:SAND, top:65,
  extra:function(b, c){ spare(b, 0, c.B, c.belt - 0.1, 0.34); b.block('cyl', [0, c.roof + 0.04, c.cb + 0.6], [0.95, 0.08, 0.95], {c:'paint2', m:'steel', name:'gun ring'});
    b.box([-0.5, c.roof, c.cb + 0.45], [0.5, c.roof + 0.08, c.cb + 0.7], {c:'paint2', m:'steel', name:'ring base'}); b.box([-0.04, c.roof + 0.08, c.cb + 0.5], [0.04, c.roof + 0.55, c.cb + 0.58], {c:'paint2', m:'steel', name:'gun post'}); b.box([-0.05, c.roof + 0.4, c.cb + 0.5], [0.05, c.roof + 0.5, c.cb + 1.5], {c:'black', m:'steel', name:'mounted gun'});
    b.box([c.hw - 0.36, c.roof - 0.02, c.cb + 0.1], [c.hw - 0.32, c.roof + 1.0, c.cb + 0.14], {c:DK, m:'steel', name:'antenna'}); }}); b.hitch([0, 0.6, -2.45], 'ball'); b.box([-0.05, 0.55, -2.4], [0.05, 0.66, -2.3], {c:DK, m:'steel', name:'hitch mount'}); return b; }
function armoured(WSB){ return milCar(WSB, {id:'armoured_car', name:'Armoured car', F:2.8, B:-2.8, hw:1.15, belt:1.4, roof:2.15, cabF:1.0, cabB:-2.3, floor:0.7, fz:1.7, rz:-1.7, r:0.5, alpha:34, drop:0.2, doors4:true, paint:SAND, top:80,
  extra:function(b, c){ b.box([-0.4, c.roof, c.cb + 0.5], [0.4, c.roof + 0.25, c.cb + 1.2], {c:'paint1', m:'steel', name:'turret base'}); b.box([-0.28, c.roof + 0.25, c.cb + 0.58], [0.28, c.roof + 0.5, c.cb + 1.1], {c:'paint1', m:'steel', name:'turret'}); b.box([-0.04, c.roof + 0.33, c.cb + 1.1], [0.04, c.roof + 0.41, c.cb + 2.3], {c:'black', m:'steel', name:'turret gun'});
    spare(b, 0, c.B, c.belt - 0.2, 0.34); }}); }

/* ---------- buses ---------- */
function bus(WSB, S){
  var hw = S.hw, zf = S.zf, zb = S.zb, fl = S.floor, rf = S.roof, bb = fl - 0.04, wb = fl + 0.95, dA = S.doorA, dB = S.doorB;
  var b = mkb(WSB, S), ops = chassis(b, {id:S.id, r:0.5, w:0.3, hw:hw, axles:S.axles, F:S.F || zf, B:zb - 0.2, railY:0.5}, b), L = 0.05;
  cab(b, {hw:hw, fl:fl, belt:S.school ? wb : fl + 0.5, roof:rf, zB:zb, zF:zf, F:S.F || zf + 0.12, ops:ops, frontOnly:true, alpha:S.school ? 14 : 8, drop:0.1, lean:0.04});
  b.shell([-hw + 0.06, fl, zb], [hw - 0.06, rf - 0.06, zf], {open:['left', 'right', 'front'], c:'paint1', floorC:'underside', wall:0.06, floor:0.1, name:'bus', room:'cabin'});
  /* lower body with wheel openings, window band with pillars, belt and roof rails */
  var sk = {c:'paint1', name:'skirt'};
  wall(b, -hw, -hw + 0.06, fl - 0.12, wb, zb, zf, {c:'paint1', name:'left skirt'}, ops);
  wall(b, hw - 0.06, hw, fl - 0.12, wb, zb, dA, {c:'paint1', name:'right skirt back'}, ops);
  b.box([hw - 0.06, fl - 0.12, dB], [hw, wb, zf], {c:'paint1', name:'right skirt front'});
  b.box([-hw + 0.02, wb, zb], [-hw + 0.06, rf - 0.3, zf], {c:'glassL', m:'glass', name:'left windows'});
  b.box([hw - 0.06, wb, zb], [hw - 0.02, rf - 0.3, dA], {c:'glassL', m:'glass', name:'right windows'});
  b.box([hw - 0.06, wb, dB], [hw - 0.02, rf - 0.3, zf], {c:'glassL', m:'glass', name:'right front windows'});
  for (var z = zb + 0.5; z < zf - 0.3; z += 1.15){ b.box([-hw, wb, z - 0.04], [-hw + 0.08, rf - 0.3, z + 0.04], {c:'paint1', name:'window pillar'}); if (z < dA - 0.1 || z > dB + 0.1) b.box([hw - 0.08, wb, z - 0.04], [hw, rf - 0.3, z + 0.04], {c:'paint1', name:'window pillar'}); }
  b.box([-hw, rf - 0.3, zb], [-hw + 0.06, rf, zf], {c:'paint1', name:'left rail'}); b.box([hw - 0.06, rf - 0.3, zb], [hw, rf, zf], {c:'paint1', name:'right rail'});
  b.box([-hw - 0.01, wb - 0.05, zb], [-hw + 0.06, wb + 0.07, zf], {c:S.stripeCol || 'paint2', name:'belt stripe'}); b.box([hw - 0.06, wb - 0.05, zb], [hw + 0.01, wb + 0.07, zf], {c:S.stripeCol || 'paint2', name:'belt stripe'});
  b.box([hw - 0.06, fl - 0.12, dA], [hw, fl - 0.02, dB], {c:'underside', m:'steel', name:'door sill'});
  b.box([hw - 0.06, wb + 1.0, dA], [hw, rf - 0.3, dB], {c:'paint1', name:'door header'});
  b.door([hw - 0.04, fl - 0.05, dA], [hw, wb + 1.0, dB], {kind:'slide', c:'paint2', name:'passenger door'});
  b.box([hw - 0.02, fl + 0.2, dA + 0.05], [hw + 0.015, wb + 0.95, dB - 0.05], {c:'glassL', m:'glass', name:'passenger door glass'});
  b.box([hw - 0.06, fl - 0.2, dA + 0.1], [hw + 0.25, fl - 0.1, dB - 0.05], {c:DK, m:'steel', name:'entry step'});
  /* nose: header, destination sign or hood stripe, face */
  b.box([-hw + 0.06, rf - 0.32, zf - 0.04], [hw - 0.06, rf, zf + 0.06], {c:'paint1', name:'front header'});
  if (!S.school){ b.box([-hw + 0.3, rf - 0.3, zf + 0.04], [hw - 0.3, rf - 0.08, zf + 0.09], {c:'#241a08', m:'plastic', name:'destination board'}); b.box([-hw + 0.5, rf - 0.26, zf + 0.09], [hw - 0.5, rf - 0.12, zf + 0.11], {c:AMB, m:'plastic', name:'destination text'}); }
  else { [-1, 1].forEach(function(sx){ b.box([sx*(hw - 0.35) - 0.12, rf - 0.3, zf + 0.04], [sx*(hw - 0.35) + 0.12, rf - 0.15, zf + 0.09], {c:sx < 0 ? RED : AMB, m:'plastic', name:'warning lamp'}); }); }
  face(b, {hw:hw, F:S.school ? S.F : zf + 0.12, bb:bb - 0.02, belt:S.school ? wb : fl + 0.5, gw:hw*0.5});
  ops.forEach(function(o, i){ arch(b, hw, o, fl - 0.12, 'arch trim'); });
  /* rear */
  b.box([-hw + 0.06, fl - 0.12, zb - 0.06], [hw - 0.06, wb, zb], {c:'paint1', name:'rear panel'});
  quad(b, [[-hw + 0.3, wb + 0.1, zb - 0.02], [hw - 0.3, wb + 0.1, zb - 0.02], [hw - 0.3, rf - 0.35, zb - 0.02], [-hw + 0.3, rf - 0.35, zb - 0.02]], [0, 0, -0.03], {c:'glassL', m:'glass', name:'rear window'});
  b.box([-hw + 0.06, wb, zb - 0.06], [-hw + 0.3, rf - 0.3, zb], {c:'paint1', name:'rear corner'}); b.box([hw - 0.3, wb, zb - 0.06], [hw - 0.06, rf - 0.3, zb], {c:'paint1', name:'rear corner'});
  b.box([-hw - 0.03, fl - 0.4, zb - 0.2], [hw + 0.03, fl - 0.12, zb - 0.02], {c:BUMP, m:'steel', name:'rear bumper'});
  if (S.rearDoor){ b.door([hw - 0.04, fl - 0.05, S.rearDoor[0]], [hw, wb + 1.0, S.rearDoor[1]], {kind:'slide', c:'paint1', name:'rear door'}); b.box([hw - 0.02, fl + 0.3, S.rearDoor[0] + 0.08], [hw + 0.015, wb + 0.95, S.rearDoor[1] - 0.08], {c:'glassL', m:'glass', name:'rear door glass'}); }
  [[-1, 1]].forEach(function(){}); [-1, 1].forEach(function(sx){ b.box([sx*(hw - 0.25) - 0.1, fl + 0.45, zb - 0.06], [sx*(hw - 0.25) + 0.1, fl + 0.8, zb - 0.02], {c:RED, m:'plastic', name:'tail lamp'}); });
  b.light('taillight', [hw - 0.25, fl + 0.6, zb - 0.04], [0.2, 0.3, 0.04]);
  /* roof fittings, mirrors, lettering */
  b.box([-0.4, rf, zb + 1.0], [0.4, rf + 0.12, zb + 2.2], {c:'paint3', m:'plastic', name:'roof vent'}); b.box([-0.35, rf, zf - 2.2], [0.35, rf + 0.1, zf - 1.2], {c:'paint3', m:'plastic', name:'roof hatch'});
  b.box([hw - 0.03, wb + 0.3, zf - 0.1], [hw + 0.17, wb + 0.36, zf - 0.04], {c:DK, m:'plastic', mx:true, name:'mirror arm'}); b.box([hw + 0.12, wb - 0.1, zf - 0.18], [hw + 0.22, wb + 0.5, zf - 0.02], {c:DK, m:'plastic', mx:true, name:'wing mirror'});
  (S.words || []).forEach(function(w){ var len = textLen(w.t, w.px), zr = w.z; text(b, w.t, {side:1, x:hw + 0.0, y:w.y, z:zr, px:w.px, c:w.c, name:'lettering'}); text(b, w.t, {side:-1, x:hw + 0.0, y:w.y, z:zr - len, px:w.px, c:w.c, name:'lettering'}); });
  (S.bands || []).forEach(function(q){ b.box([hw - 0.02, q[0], zb], [hw + 0.012, q[1], zf], {c:q[2], mx:true, name:'band'}); });
  if (S.school){ b.box([-hw - 0.2, wb - 0.1, zf - 2.2], [-hw, wb + 0.4, zf - 2.14], {c:RED, m:'plastic', name:'stop sign arm'}); }
  /* seats and driver */
  CK.driverKit(b, {hw:hw, belt:fl + 0.95, cabF:zf, driverX:-(hw - 0.55), seatY:fl + 0.36, dashDepth:0.5, dashTop:fl + 0.97});
  b.box([-(hw - 0.55) - 0.1, fl, zf - 1.0], [-(hw - 0.55) + 0.1, fl + 0.3, zf - 0.6], {fitting:true, c:'#4a4640', m:'plastic', name:'driver seat rail'}); b.seat([-(hw - 0.55), fl + 0.36, zf - 0.78], {size:[0.5, 0.12, 0.5], c:'#4a4a44', name:'driver seat'}); b.box([-(hw - 0.55) - 0.25, fl + 0.4, zf - 1.14], [-(hw - 0.55) + 0.25, fl + 0.95, zf - 1.04], {fitting:true, c:'#4a4a44', m:'cloth', name:'driver seat back'});
  for (var zz = dA - 0.9; zz > zb + 0.8; zz -= 1.0){ b.seat([hw - 0.6, fl + 0.06, zz], {size:[0.8, 0.1, 0.45], name:'seat'}); b.seat([-hw + 0.6, fl + 0.06, zz], {size:[0.8, 0.1, 0.45], name:'seat'}); }
  b.box([-hw, fl - 0.25, zb - 0.15], [hw, fl - 0.12, zf + 0.15], {c:'underside', m:'steel', name:'frame'});
  b.light('headlight', [hw - 0.35, fl + 0.3, zf + 0.1], [0.3, 0.2, 0.04]);
  b.engine([0, fl - 0.1, zb + 1.0], [1.2, 0.5, 1.2]); b.tank([-hw + 0.5, fl - 0.4, (zf + zb)/2], [0.5, 0.35, 1.2]); b.battery([0, fl - 0.3, zf - 1.0]);
  return b;
}
function cityBus(WSB){ return bus(WSB, {id:'city_bus_remade', name:'City bus (remade)', cls:'bus', paint:['#d8a02a', '#2b2b2b', '#c9c9c9'], top:50, extra:{tank:'large'}, hw:1.3, zf:5.95, zb:-5.95, floor:1.1, roof:3.45, doorA:3.9, doorB:5.0, axles:[{z:4.2, steer:true}, {z:-3.6, driven:true}], rearDoor:[-1.6, -0.5],
  words:[{t:'CITY BUS', y:1.35, px:0.09, z:-1.6, c:'#2b2b2b'}], bands:[[1.0, 1.25, '#2b2b2b']]}); }
function schoolBus(WSB){ return bus(WSB, {id:'school_bus_remade', name:'School bus (remade)', cls:'bus', paint:['#e0a81c', '#1c1c1e', '#c9c9c9'], top:50, extra:{tank:'large'}, school:true, hw:1.3, zf:3.8, zb:-5.3, F:4.75, floor:1.1, roof:3.4, doorA:2.2, doorB:3.3, axles:[{z:3.5, steer:true}, {z:-3.3, driven:true}], stripeCol:'paint2',
  words:[{t:'SCHOOL BUS', y:1.5, px:0.075, z:-0.4, c:'#1c1c1e'}], bands:[[1.3, 1.4, '#1c1c1e'], [1.95, 2.03, '#1c1c1e']]}); }

/* ---------- motorhome ---------- */
function winFrame(b, x, y0, y1, z0, z1, mx){
  var o = {c:'#2b2d30', m:'plastic', name:'window frame'}; if (mx) o.mx = true;
  b.box([x, y0, z0], [x + 0.04, y1, z1], {c:'glassL', m:'glass', mx:mx, name:'window'});
  b.box([x, y0 - 0.05, z0 - 0.05], [x + 0.06, y0, z1 + 0.05], o); b.box([x, y1, z0 - 0.05], [x + 0.06, y1 + 0.05, z1 + 0.05], o); b.box([x, y0, z0 - 0.05], [x + 0.06, y1, z0], o); b.box([x, y0, z1], [x + 0.06, y1, z1 + 0.05], o);
}
function motorhome(WSB){
  var S = {id:'motorhome_remade', name:'Motorhome (remade)', cls:'rv', paint:['#dcd8c8', '#4a6a8a', '#3a3a3a'], top:60, hw:1.15, r:0.46, axles:[{z:2.7, steer:true}, {z:-2.2, driven:true}], F:3.8, B:-4.3, railY:0.45};
  var b = mkb(WSB, S), ops = chassis(b, S), hw = 1.15, fl = 0.98, bx = 1.28, lf = 0.95;
  cab(b, {hw:hw, fl:fl, belt:1.6, roof:2.6, zB:1.44, zF:3.3, F:3.8, ops:ops, frontCol:'paint2', drop:0.14, alpha:20});
  face(b, {hw:hw, F:3.8, bb:fl - 0.04, belt:1.6});
  arch(b, hw, ops[0], fl - 0.04, 'front arch trim');
  b.shell([-bx, lf, -4.2], [bx, 3.05, 1.44], {open:['left', 'right'], c:'paint1', floorC:'#8a6a48', wall:0.06, floor:0.1, name:'living area', room:'living area'});
  wall(b, -bx - 0.06, -bx, 0.62, 1.75, -4.2, 1.44, {c:'paint1', name:'left lower wall'}, ops);
  wall(b, bx, bx + 0.06, 0.62, 1.75, -4.2, -1.0, {c:'paint1', name:'right lower back'}, ops);
  b.box([bx, 0.62, 0.1], [bx + 0.06, 1.75, 1.44], {c:'paint1', name:'right lower front'}); b.box([bx, 0.62, -1.0], [bx + 0.06, 0.95, 0.1], {c:'paint1', name:'door sill panel'});
  b.box([-bx - 0.06, 2.55, -4.2], [-bx, 3.1, 1.44], {c:'paint1', name:'left upper wall'}); b.box([bx, 2.55, -4.2], [bx + 0.06, 3.1, -1.0], {c:'paint1', name:'right upper wall'}); b.box([bx, 2.55, 0.1], [bx + 0.06, 3.1, 1.44], {c:'paint1', name:'right upper wall'});
  b.box([bx, 1.75, -4.2], [bx + 0.06, 2.55, -3.6], {c:'paint1', name:'right pillar'}); b.box([bx, 1.75, -1.2], [bx + 0.06, 2.55, -1.0], {c:'paint1', name:'right pillar'}); b.box([bx, 1.75, 0.1], [bx + 0.06, 2.55, 0.35], {c:'paint1', name:'right pillar'}); b.box([bx, 1.75, 1.0], [bx + 0.06, 2.55, 1.44], {c:'paint1', name:'right pillar'});
  b.box([-bx - 0.06, 1.75, -4.2], [-bx, 2.55, -3.6], {c:'paint1', name:'left pillar'}); b.box([-bx - 0.06, 1.75, -1.2], [-bx, 2.55, -0.9], {c:'paint1', name:'left pillar'}); b.box([-bx - 0.06, 1.75, 1.0], [-bx, 2.55, 1.44], {c:'paint1', name:'left pillar'});
  winFrame(b, bx, 1.8, 2.5, -3.55, -1.25, true); winFrame(b, -bx - 0.06, 1.8, 2.5, -3.55, -1.25, false); winFrame(b, -bx - 0.06, 1.8, 2.5, -0.85, 0.95, false); winFrame(b, bx, 1.8, 2.5, 0.4, 0.95, true);
  b.box([bx, 2.62, -1.0], [bx + 0.06, 3.1, 0.1], {c:'paint1', name:'door header'});
  b.door([bx - 0.02, lf, -1.0], [bx + 0.06, 2.62, 0.1], {kind:'swing', hinge:'front', c:'paint2', name:'habitation door'});
  b.box([bx, 1.7, -0.9], [bx + 0.08, 2.3, 0.0], {c:'glassL', m:'glass', name:'door window'});
  b.box([bx - 0.02, 0.7, -0.9], [bx + 0.22, 0.8, 0.05], {c:DK, m:'steel', name:'entry step'});
  /* roof, stripe, awning, aircon, ladder, bumpers */
  b.box([-bx + 0.1, 3.05, -4.3], [bx - 0.1, 3.14, 1.5], {c:'paint1', name:'roof'}); b.box([-bx - 0.06, 3.1, -4.3], [bx + 0.06, 3.14, 1.5], {c:'paint1', name:'roof edge'});
  b.box([-0.5, 3.14, -2.4], [0.5, 3.4, -1.2], {c:'#e8e8e0', m:'plastic', name:'air conditioner'}); b.box([-0.2, 3.14, 0.2], [0.2, 3.22, 0.6], {c:DK, m:'plastic', name:'roof vent'});
  b.box([-bx - 0.07, 1.2, -4.2], [-bx - 0.05, 1.45, 1.44], {c:'paint2', name:'side stripe'}); b.box([bx + 0.06, 1.2, -4.2], [bx + 0.08, 1.45, 1.44], {c:'paint2', name:'side stripe'});
  b.box([bx + 0.06, 2.7, -3.55], [bx + 0.4, 2.78, -1.25], {c:'paint2', name:'awning'}); b.box([bx + 0.06, 2.55, -3.55], [bx + 0.1, 2.7, -1.25], {c:'paint2', name:'awning case'});
  b.box([-0.5, 1.0, -4.34], [-0.4, 3.05, -4.28], {c:DK, m:'steel', name:'ladder rail'}); b.box([0.4, 1.0, -4.34], [0.5, 3.05, -4.28], {c:DK, m:'steel', name:'ladder rail'});
  b.box([-bx, 0.5, -4.4], [bx, 0.9, -4.2], {c:BUMP, m:'steel', name:'rear bumper'}); b.box([-hw, 0.52, 3.8], [hw, 0.95, 4.0], {c:BUMP, m:'steel', name:'front bumper'});
  ops.forEach(function(o, i){ if (i) arch(b, bx + 0.06, o, 0.62, 'rear arch trim'); });
  [-1, 1].forEach(function(sx){ b.box([sx*(bx - 0.25) - 0.1, 1.2, -4.25], [sx*(bx - 0.25) + 0.1, 1.6, -4.2], {c:RED, m:'plastic', name:'tail lamp'}); });
  b.light('headlight', [0.8, 1.0, 3.82], [0.26, 0.16, 0.04]); b.light('taillight', [1.1, 1.2, -4.22], [0.16, 0.24, 0.04]);
  b.bed([-0.6, lf + 0.05, -3.1], [1.3, 0.3, 1.9], {name:'double bed'}); b.seat([0.7, lf - 0.04, 1.0], {size:[0.9, 0.12, 0.5], name:'dinette seat'}); b.box([-1.0, lf - 0.1, 0.5], [-0.4, 1.7, 1.3], {c:'paint2', fn:'storage', name:'galley counter'});
  b.engine([0, 1.1, 3.0], [0.9, 0.6, 1.0]); b.tank([0, 0.6, -1.0], [0.8, 0.3, 1.2]); b.battery([0.7, 1.2, 3.4]);
  return b;
}
/* ---------- APC ---------- */
function apc(WSB){
  var S = {id:'apc_8x8', name:'Armoured personnel carrier 8x8', cls:'bus', paint:['#5a6040', '#2b2d26', '#8a8a78'], top:60, extra:{tank:'large'}, hw:1.3, r:0.52, w:0.36, axles:[{z:3.0, steer:true, driven:true}, {z:1.0, steer:true, driven:true}, {z:-1.0, driven:true}, {z:-3.0, driven:true}], F:4.4, B:-4.5, railY:0.5};
  var b = mkb(WSB, S), ops = chassis(b, S), hw = 1.3;
  b.box([-hw, 0.6, -4.4], [hw, 0.8, 4.4], {c:'underside', m:'steel', name:'hull floor'});
  /* lower hull side skirts with the wheel openings cut out, dark wells */
  wall(b, hw - 0.1, hw, 0.62, 1.7, -4.4, 3.7, {c:'paint1', m:'steel', mx:true, name:'hull side'}, ops);
  ops.forEach(function(o, i){ arch(b, hw, o, 0.62, 'wheel well'); });
  quad(b, [[-hw, 0.8, 4.4], [hw, 0.8, 4.4], [hw, 1.75, 3.7], [-hw, 1.75, 3.7]], [0, 0.1, 0.07], {c:'paint1', m:'steel', name:'glacis'}); b.box([-hw, 0.62, 4.0], [hw, 0.8, 4.4], {c:'paint1', m:'steel', name:'glacis lower'}); b.box([-hw, 0.8, 3.0], [hw, 1.7, 3.7], {c:'paint1', m:'steel', name:'nose block'});
  /* driver compartment: hollow, open to the troop bay, with a vision block at the front left, a raised seat, dash, wheel and the eye point */
  b.shell([-hw, 0.8, 1.8], [hw, 2.3, 3.1], {open:['back', 'front'], c:'paint1', m:'steel', floorC:'underside', wall:0.1, floor:0.1, name:'driver compartment', room:'driver compartment'});
  b.box([-hw, 0.8, 3.0], [hw, 1.65, 3.1], {c:'paint1', m:'steel', name:'front plate lower'}); b.box([-hw, 2.05, 3.0], [hw, 2.3, 3.1], {c:'paint1', m:'steel', name:'front plate upper'});
  b.box([-hw, 1.65, 3.0], [-0.98, 2.05, 3.1], {c:'paint1', m:'steel', name:'front plate left'}); b.box([-0.12, 1.65, 3.0], [hw, 2.05, 3.1], {c:'paint1', m:'steel', name:'front plate right'});
  quad(b, [[-0.96, 1.67, 3.08], [-0.14, 1.67, 3.08], [-0.14, 2.03, 3.08], [-0.96, 2.03, 3.08]], [0, 0, 0.03], {c:'glassL', m:'glass', name:'driver vision block'});
  b.box([-1.0, 2.03, 3.1], [-0.1, 2.12, 3.2], {c:'paint2', m:'steel', name:'vision hood'}); b.box([-1.0, 1.58, 3.1], [-0.1, 1.67, 3.18], {c:'paint2', m:'steel', name:'vision sill'});
  b.box([-0.9, 1.0, 2.0], [-0.2, 1.1, 2.7], {fitting:true, c:'#2c2c30', m:'steel', name:'driver pedestal'});
  CK.driverKit(b, {hw:hw, belt:1.62, cabF:3.0, driverX:-0.55, seatY:1.2, dashDepth:0.45, dashTop:1.64, rake:-70});
  b.seat([-0.55, 1.2, 2.3], {size:[0.5, 0.1, 0.5], c:'#6a4a34', name:'driver seat'}); b.box([-0.8, 1.25, 2.02], [-0.3, 1.8, 2.1], {fitting:true, c:'#6a4a34', m:'cloth', name:'driver seat back'});
  b.seat([0.55, 0.9, 2.3], {size:[0.5, 0.1, 0.5], c:'#6a4a34', name:'commander seat'});
  b.box([-0.5, 2.3, 2.1], [0.1, 2.4, 2.7], {c:'paint1', m:'steel', name:'driver hatch'}); b.block('cyl', [-0.2, 2.45, 2.4], [0.55, 0.1, 0.55], {c:'paint2', m:'steel', name:'driver hatch ring'});
  b.shell([-hw, 0.8, -4.4], [hw, 2.45, 1.8], {open:['back', 'front'], c:'paint1', m:'steel', floorC:'underside', wall:0.1, floor:0.1, name:'troop bay', room:'troop bay'});
  b.door([-hw, 0.8, -4.55], [hw, 2.45, -4.5], {kind:'ramp', c:'paint1', name:'rear ramp'});
  b.box([-0.5, 2.45, -1.0], [0.5, 2.55, 1.4], {c:'paint1', m:'steel', name:'roof hatch plate'}); b.box([-0.45, 2.55, -0.3], [0.45, 3.0, 0.7], {c:'paint1', m:'steel', name:'turret'}); b.box([-0.2, 2.7, 0.7], [0.2, 2.82, 0.8], {c:'paint2', m:'steel', name:'gun mantlet'}); b.box([-0.05, 2.74, 0.8], [0.05, 2.8, 2.4], {c:'black', m:'steel', name:'autocannon'});
  [-1, 1].forEach(function(sx){ b.box([sx*0.3 - 0.06, 2.45, -2.2], [sx*0.3 + 0.06, 2.6, -1.9], {c:'paint2', m:'steel', name:'hatch ring'}); b.box([sx*(hw + 0.02) - 0.01, 1.4, -3.2], [sx*(hw + 0.02) + 0.01, 1.52, -2.5], {c:'#16191d', m:'glass', name:'vision slit'}); b.box([sx*(hw + 0.02) - 0.01, 1.4, -2.0], [sx*(hw + 0.02) + 0.01, 1.52, -1.3], {c:'#16191d', m:'glass', name:'vision slit'}); b.box([sx*0.9 - 0.12, 2.45, 1.0], [sx*0.9 + 0.12, 2.6, 1.4], {c:'paint2', m:'steel', name:'smoke launcher'}); });
  b.box([-0.03, 2.55, -1.6], [0.03, 3.6, -1.56], {c:DK, m:'steel', name:'antenna'});
  b.light('headlight', [1.0, 1.0, 3.72], [0.2, 0.16, 0.04]); b.light('taillight', [1.1, 1.2, -4.58], [0.16, 0.2, 0.04]);
  b.engine([0, 1.2, 2.4], [1.2, 0.7, 0.8]); b.tank([-1.0, 0.95, 0.5], [0.4, 0.3, 1.2]); b.battery([0.8, 1.3, 2.6]);
  [0.8, -0.2, -1.2, -2.2, -3.2].forEach(function(z){ b.seat([1.0, 0.9, z], {size:[0.4, 0.08, 0.45], name:'bench'}); b.seat([-1.0, 0.9, z], {size:[0.4, 0.08, 0.45], name:'bench'}); });
  return b;
}
/* ---------- trailers ---------- */
function boxTrailer(WSB){
  var b = WSB.create({id:'box_trailer', name:'53 ft box trailer', domain:'land', cls:'trailer', paint:{paint1:'#dcd8ce', paint2:'#9a9a9a', paint3:'#3a3a3a'}});
  b.wheels(0.5, 0.3); wheelLook(b, 0.5, 0.3); b.axle(-6.0, {track:1.0, name:'trailer axle 1'}); b.axle(-7.25, {track:1.0, name:'trailer axle 2'});
  b.shell([-1.24, 1.32, -8.05], [1.24, 4.05, 8.0], {open:['back'], c:'paint1', floorC:'#7a5a3a', wall:0.04, floor:0.08, name:'trailer box', room:'trailer'});
  b.door([0, 1.32, -8.12], [1.24, 4.05, -8.07], {c:'paint1', mx:true, hinge:'outer', name:'barn door'});
  b.box([-0.55, 0.78, -8.05], [0.55, 1.24, -5.4], {c:'underside', m:'steel', name:'slider subframe'}); b.box([0.3, 1.0, -5.4], [0.42, 1.24, 7.9], {c:'underside', m:'steel', mx:true, name:'main rail'});
  b.box([-1.2, 0.9, -8.2], [1.2, 1.12, -8.05], {c:'underside', m:'steel', name:'underride guard'}); b.box([0.7, 0.15, 5.0], [0.8, 1.24, 5.15], {c:'underside', m:'steel', mx:true, name:'landing leg'});
  b.coupler([0, 1.18, 7.1], 'kingpin');
  for (var z = -7.4; z < 7.8; z += 0.65){ b.box([1.24, 1.32, z], [1.27, 4.05, z + 0.05], {c:'paint2', mx:true, name:'panel rib'}); }
  b.box([1.24, 1.32, -8.05], [1.28, 1.5, 8.0], {c:'paint2', mx:true, name:'bottom rail'}); b.box([1.24, 3.95, -8.05], [1.28, 4.05, 8.0], {c:'paint2', mx:true, name:'top rail'});
  b.box([1.28, 2.2, 1.0], [1.30, 3.2, 6.8], {c:'#2f5f8a', mx:true, name:'side panel'});
  text(b, 'FREIGHT', {side:1, x:1.31, y:2.4, z:6.4, px:0.12, c:'#dcd8ce', name:'lettering'}); text(b, 'FREIGHT', {side:-1, x:1.31, y:2.4, z:6.4 - textLen('FREIGHT', 0.12), px:0.12, c:'#dcd8ce', name:'lettering'});
  b.box([1.0, 0.95, -7.7], [1.26, 1.32, -5.5], {c:DK, m:'plastic', mx:true, name:'side skirt'});
  [-6.0, -7.25].forEach(function(z){ b.box([1.0, 0.2, z - 0.5], [1.3, 0.28, z + 0.5], {c:DK, m:'steel', mx:true, name:'wheel guard'}); });
  markers(b, 1.24, 1.4, -7.8, 7.6, 9); [-1, 1].forEach(function(sx){ b.box([sx*1.1 - 0.1, 3.9, 7.95], [sx*1.1 + 0.1, 4.0, 8.03], {c:AMB, m:'plastic', name:'front clearance lamp'}); b.box([sx*1.1 - 0.1, 1.4, 7.95], [sx*1.1 + 0.1, 1.5, 8.03], {c:AMB, m:'plastic', name:'front marker lamp'}); }); b.box([-1.0, 4.0, -8.1], [1.0, 4.05, -8.05], {c:RED, m:'plastic', name:'marker bar'});
  [-1, 1].forEach(function(sx){ b.box([sx*0.9 - 0.12, 1.4, -8.12], [sx*0.9 + 0.12, 1.6, -8.07], {c:RED, m:'plastic', name:'tail lamp'}); });
  b.light('taillight', [1.05, 1.45, -8.1], [0.16, 0.12, 0.04]);
  return b;
}
function ammoTrailer(WSB){
  var b = WSB.create({id:'ammo_trailer', name:'Ammo trailer', domain:'land', cls:'trailer', paint:{paint1:'#5a6040', paint2:'#2b2d26', paint3:'#8a8a78'}, topSpeed:50});
  b.wheels(0.45, 0.28); wheelLook(b, 0.45, 0.28); b.axle(-0.6, {driven:false, track:0.85, name:'trailer axle'});
  b.box([-0.95, 0.6, -1.9], [0.95, 0.72, 1.6], {c:'underside', m:'steel', name:'bed'});
  b.shell([-0.95, 0.72, -1.9], [0.95, 1.9, 1.3], {open:['back'], c:'paint1', m:'steel', floorC:'underside', wall:0.05, floor:0.08, name:'box', room:'box'}); b.door([-0.95, 0.72, -1.97], [0.95, 1.9, -1.92], {kind:'swing', hinge:'outer', c:'paint1', name:'rear doors'});
  b.box([-0.05, 0.62, 1.3], [0.05, 0.72, 2.6], {c:'underside', m:'steel', name:'drawbar'}); b.coupler([0, 0.67, 2.62], 'tongue'); b.storage([-0.8, 0.8, -1.8], [0.8, 1.6, 0.8], 'crates');
  b.box([-0.12, 0.62, 2.0], [0.12, 0.7, 2.62], {c:'paint2', m:'steel', name:'drawbar brace'});
  for (var z = -1.6; z < 1.2; z += 0.6) b.box([0.95, 0.72, z], [0.98, 1.9, z + 0.05], {c:'paint2', mx:true, name:'body rib'});
  b.box([0.95, 1.8, -1.9], [0.98, 1.9, 1.3], {c:'paint2', mx:true, name:'top rail'});
  [-1, 1].forEach(function(sx){ b.box([sx*0.85 - 0.5, 0.95, -1.9 - 0.0], [sx*0.85 + 0.5, 1.0, -1.88], {c:RED, m:'plastic', name:'tail lamp'}); });
  b.box([0.7, 0.75, -0.6 - 0.55], [1.0, 0.82, -0.6 + 0.55], {c:DK, m:'steel', mx:true, name:'wheel guard'});
  b.box([0.95, 0.15, 1.3], [1.0, 0.72, 1.35], {c:'paint2', m:'steel', mx:true, name:'jack'}); [-1, 1].forEach(function(sx){ b.box([sx*0.8 - 0.1, 1.75, 1.3], [sx*0.8 + 0.1, 1.85, 1.36], {c:AMB, m:'plastic', name:'front lamp'}); });
  return b;
}
function cityBusOld(WSB){ var b = cityBus(WSB); b.doc.id = 'city_bus'; b.doc.name = 'City bus'; return b; }
module.exports = function(WSB){ return [cityBusOld, motorhome, apc, boxTrailer, ammoTrailer, boxTruck, semi, cargo, jeep, humvee, armoured, cityBus, schoolBus].map(function(f){ return f(WSB); }); };
