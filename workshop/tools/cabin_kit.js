/* Cabin parts for the vehicle designs (car interiors request, 1 Nov 2026): dashboard with instrument binnacle, steering wheel, centre console and
   gearstick, door cards, floor, headliner and seats with backrests. Used by workshop/designs/*.js.
   Driver is on the LEFT (x < 0), the first Seat piece. Points written for the game: 'cabin.eye' (kind eye, the driver's eye) and 'steer.wheel'
   (kind hinge: pivot at the wheel centre, dir = the column axis, so the game turns the wheel piece named 'steering wheel' about it). */
var M = require('../model.js');
var DARK = '#2c2c30', DASH = '#34343a', TRIM = '#4a4640', CARPET = '#3a3733', LINER = '#b9b3a3';
function sy(S){ return Math.round(S*1e4)/1e4; }
/* a slab from four corner points [x,y,z] pushed by a vector d (any convex four-corner plate) */
function slab(b, c, d, opt){
  var pts = c.concat(c.map(function(q){ return [q[0] + d[0], q[1] + d[1], q[2] + d[2]]; })), cx = 0, cy = 0, cz = 0, i;
  pts.forEach(function(q){ cx += q[0]/8; cy += q[1]/8; cz += q[2]/8; });
  var f = [[0, 3, 2, 1], [4, 5, 6, 7]];
  for (i = 0; i < 4; i++) f.push([i, (i + 1) % 4, (i + 1) % 4 + 4, i + 4]);
  opt.v = pts.map(function(q){ return [q[0] - cx, q[1] - cy, q[2] - cz]; }); opt.f = f;
  return b.block('corner', [cx, cy, cz], null, opt);
}
/* a steering wheel: a 12-sided rim and three spokes in the plane at right angles to the column, all pieces named 'steering wheel' */
function wheelRing(b, cx, cy, cz, phiDeg){
  var ph = phiDeg*Math.PI/180, n = [0, Math.cos(ph), Math.sin(ph)], v = [0, -Math.sin(ph), Math.cos(ph)], u = [1, 0, 0], Ro = 0.19, Ri = 0.158, th = 0.026, N = 10, i;
  function P(R, t){ return [cx + R*(Math.cos(t)*u[0] + Math.sin(t)*v[0]) - n[0]*th/2, cy + R*(Math.cos(t)*u[1] + Math.sin(t)*v[1]) - n[1]*th/2, cz + R*(Math.cos(t)*u[2] + Math.sin(t)*v[2]) - n[2]*th/2]; }
  var o = {fitting:true, c:DARK, m:'rubber', name:'steering wheel'}, d = [n[0]*th, n[1]*th, n[2]*th];
  for (i = 0; i < N; i++){ var t0 = i*2*Math.PI/N, t1 = (i + 1)*2*Math.PI/N; slab(b, [P(Ro, t0), P(Ro, t1), P(Ri, t1), P(Ri, t0)], d, Object.assign({}, o)); }
  [Math.PI/2, Math.PI*7/6, Math.PI*11/6].forEach(function(t){
    var w = 0.022, tp = [-Math.sin(t)*w, 0, 0];
    var a0 = P(0.03, t), a1 = P(Ri + 0.01, t);
    function sh(q, k){ return [q[0] + k*(-Math.sin(t))*w*u[0] + k*(Math.cos(t))*w*(-v[0]), q[1] + k*(Math.cos(t))*w*(-v[1]) , q[2] + k*(Math.cos(t))*w*(-v[2])]; }
    slab(b, [P(0.03, t - 0.2), P(0.03, t + 0.2), P(Ri + 0.012, t + 0.07), P(Ri + 0.012, t - 0.07)], d, Object.assign({}, o, {c:DASH}));
  });
  b.block('box', [cx, cy, cz], [0.1, 0.04, 0.1], {fitting:true, c:DASH, m:'plastic', rot:[phiDeg, 0, 0], name:'steering wheel'});
}
/* dashboard with vents, glovebox, centre stack and round gauges; the wheel, column and the eye point */
function driverKit(b, o){
  var hw = o.hw, belt = o.belt, zF = o.cabF, dx = o.driverX == null ? -0.4 : o.driverX, seatY = o.seatY, dep = o.dashDepth || 0.38, top = o.dashTop || belt + 0.02, rake = o.rake == null ? -62 : o.rake;
  var fit = {fitting:true, m:'plastic'}, F = function(c, name){ return Object.assign({c:c, name:name}, fit); };
  b.box([-hw + 0.08, top - 0.32, zF - dep], [hw - 0.08, top, zF - 0.01], F(DASH, 'dashboard'));
  b.box([-hw + 0.08, top - 0.05, zF - dep - 0.02], [hw - 0.08, top - 0.01, zF - dep], F('#2a2a30', 'dash pad lip'));
  b.box([dx - 0.27, top, zF - dep + 0.08], [dx + 0.27, top + 0.09, zF - dep + 0.3], F(DARK, 'instrument binnacle'));
  [-0.12, 0.12].forEach(function(gx, i){
    b.block('cyl', [dx + gx, top + 0.045, zF - dep + 0.075], [0.12, 0.12, 0.012], {fitting:true, c:'#9aa3a8', m:'plastic', ax:'z', name:'gauge ring'});
    b.block('cyl', [dx + gx, top + 0.045, zF - dep + 0.07], [0.1, 0.1, 0.012], {fitting:true, c:i ? '#d8dee2' : '#e6e0c8', m:'plastic', ax:'z', name:'gauge face'});
    b.box([dx + gx - 0.004, top + 0.045, zF - dep + 0.062], [dx + gx + 0.004, top + 0.085, zF - dep + 0.07], F('#c0392b', 'gauge needle'));
  });
  b.box([-0.14, top - 0.34, zF - dep - 0.07], [0.14, top - 0.04, zF - dep + 0.02], F('#26262b', 'centre stack'));
  b.box([-0.11, top - 0.14, zF - dep - 0.075], [0.11, top - 0.06, zF - dep - 0.07], F('#5a636b', 'radio'));
  b.box([-0.11, top - 0.26, zF - dep - 0.075], [0.11, top - 0.18, zF - dep - 0.07], F('#3d4349', 'climate panel'));
  [dx + 0.42, 0.62, -0.62 + 0*dx].forEach(function(vx, i){ b.box([vx - 0.09, top - 0.09, zF - dep - 0.02], [vx + 0.09, top - 0.04, zF - dep + 0.0], F('#1a1b1f', 'vent')); });
  b.box([0.25, top - 0.29, zF - dep - 0.015], [0.72, top - 0.1, zF - dep], F('#3d3d46', 'glovebox'));
  var wz = zF - dep - 0.18, wy = top - 0.1, ph = rake - 4;
  b.box([dx - 0.025, wy - 0.08, wz + 0.04], [dx + 0.025, wy + 0.05, zF - dep + 0.05], F(DARK, 'steering column'));
  wheelRing(b, dx, wy + 0.03, wz, ph);
  M.addPoint(b.doc, 'steer.wheel', 'hinge', [dx, sy(wy + 0.03), sy(wz)], [0, 0.4, -0.9]);
  M.addPoint(b.doc, 'cabin.eye', 'eye', [dx, sy(seatY + 0.66), sy(wz - 0.42)], [0, -0.06, 1]);
}
/* a seat: pedestal, cushion (the Seat job) and backrest */
function seat(b, o, x, z, w, name, floorTop){
  b.box([x - 0.1, floorTop, z - 0.1], [x + 0.1, o.seatY - 0.06, z + 0.1], {fitting:true, c:TRIM, m:'plastic', name:'seat rail'});
  var sc = o.seatC || '#4a4a44'; b.seat([x, o.seatY, z], {size:[w, 0.12, 0.5], c:sc, name:name});
  b.block('box', [x, o.seatY + 0.33, z - 0.33], [w, 0.55, 0.1], {fitting:true, c:sc, m:'cloth', rot:[-9, 0, 0], name:name + ' back'});
  [-1, 1].forEach(function(k){ b.box([x + k*w/2 - 0.03 - (k > 0 ? 0 : -0.0), o.seatY, z - 0.25], [x + k*w/2 + 0.03, o.seatY + 0.14, z + 0.25], {fitting:true, c:sc, m:'cloth', name:name + ' bolster'}); });
  b.block('box', [x, o.seatY + 0.69, z - 0.37], [0.24, 0.13, 0.08], {fitting:true, c:sc, m:'cloth', rot:[-9, 0, 0], name:name + ' headrest'});
}
/* the whole cabin of a car or pickup */
function carCabin(b, o){
  var hw = o.hw, belt = o.belt, roof = o.roof, zF = o.cabF, zB = o.cabB, g = o.g, floorTop = g + 0.28;
  b.box([-hw + 0.08, g + 0.22, zB + 0.04], [hw - 0.08, floorTop, zF - 0.02], {fitting:true, c:CARPET, m:'cloth', name:'floor carpet'});
  b.box([-hw + 0.1, roof - 0.14, zB + 0.05], [hw - 0.1, roof - 0.1, o.headF == null ? zF - 0.02 : o.headF], {fitting:true, c:LINER, m:'cloth', name:'headliner'});
  b.box([hw - 0.12, g + 0.3, zB + 0.1], [hw - 0.07, belt + 0.02, zF - 0.1], {fitting:true, c:TRIM, m:'plastic', mx:true, name:'door card'});
  b.box([hw - 0.2, belt - 0.2, zB + 0.35], [hw - 0.1, belt - 0.12, zF - 0.45], {fitting:true, c:DASH, m:'plastic', mx:true, name:'door armrest'});
  b.box([hw - 0.14, belt - 0.12, zF - 0.55], [hw - 0.1, belt - 0.02, zF - 0.4], {fitting:true, c:'#8a8f94', m:'plastic', mx:true, name:'door handle inner'});
  b.box([-0.1, floorTop, zF - 0.95], [0.1, floorTop + 0.22, zF - 0.1], {fitting:true, c:DASH, m:'plastic', name:'centre console'});
  b.block('cyl', [0, floorTop + 0.34, zF - 0.55], [0.05, 0.2, 0.05], {fitting:true, c:DARK, m:'plastic', name:'gear lever'});
  driverKit(b, o);
  var sz = zF - 0.78;
  seat(b, o, -0.4, sz, 0.5, 'driver seat', floorTop); seat(b, o, 0.4, sz, 0.5, 'passenger seat', floorTop);
  (o.rear || []).forEach(function(z, i){ seat(b, o, i % 2 ? 0.4 : -0.4, z, 0.5, 'rear seat ' + (i + 1), floorTop); });
}
module.exports = {driverKit:driverKit, seat:seat, carCabin:carCabin, COLORS:{DARK:DARK, DASH:DASH, TRIM:TRIM, CARPET:CARPET, LINER:LINER}};

/* a hollow truck / van / motorhome cab between zB (back wall) and zF (windscreen): floor, side skins, back wall, roof and headliner, A pillars,
   windscreen pane, doors with their own glass, door cards, dashboard, wheel, console, two seats and the cabin.eye point.
   o: {hw, zB, zF, fl (floor top), belt (sill), roof, seatY, driverX} */
function truckCab(b, o){
  var hw = o.hw, zB = o.zB, zF = o.zF, fl = o.fl, belt = o.belt, roof = o.roof, seatY = o.seatY || fl + 0.3, dx = o.driverX == null ? -0.45 : o.driverX, c = o.c || 'paint1';
  b.box([-hw + 0.1, fl - 0.12, zB], [hw - 0.1, fl - 0.05, zF], {fitting:true, c:'underside', m:'steel', name:'cab floor pan'});
  b.box([-hw + 0.08, fl - 0.05, zB + 0.05], [hw - 0.08, fl, zF - 0.02], {fitting:true, c:CARPET, m:'cloth', name:'floor carpet'});
  b.box([hw - 0.06, fl - 0.12, zB], [hw, belt, zF], {fitting:true, c:c, mx:true, name:'cab side skin'});
  b.box([-hw + 0.04, fl - 0.12, zB - 0.06], [hw - 0.04, roof - 0.1, zB], {fitting:true, c:c, name:'cab back wall'});
  b.box([hw - 0.07, belt, zF - 0.04], [hw - 0.01, roof - 0.1, zF + 0.1], {fitting:true, c:c, mx:true, name:'A pillar'});
  b.box([-hw + 0.02, roof - 0.1, zB - 0.06], [hw - 0.02, roof, zF + 0.12], {fitting:true, c:c, name:'cab roof'});
  b.box([-hw + 0.1, roof - 0.14, zB + 0.05], [hw - 0.1, roof - 0.1, o.headF == null ? zF - 0.02 : o.headF], {fitting:true, c:LINER, m:'cloth', name:'headliner'});
  b.box([-hw + 0.08, belt + 0.04, zF + 0.03], [hw - 0.08, roof - 0.1, zF + 0.07], {fitting:true, c:'glass', m:'glass', name:'windscreen'});
  b.box([hw - 0.12, fl + 0.05, zB + 0.1], [hw - 0.07, belt + 0.02, zF - 0.1], {fitting:true, c:TRIM, m:'plastic', mx:true, name:'door card'});
  var z0 = zB + 0.25, z1 = zF - 0.1;
  b.door([hw, fl - 0.1, z0], [hw + 0.05, belt, z1], {fitting:true, c:c, mx:true, hinge:'front', name:'cab door'});
  b.box([hw + 0.01, belt, z0 + 0.04], [hw + 0.04, roof - 0.12, z1 - 0.04], {fitting:true, c:'glass', m:'glass', mx:true, name:'cab door'});
  b.box([hw, roof - 0.12, z0], [hw + 0.05, roof - 0.1, z1], {fitting:true, c:c, mx:true, name:'cab door'});
  b.box([hw, belt, z0], [hw + 0.05, roof - 0.12, z0 + 0.04], {fitting:true, c:c, mx:true, name:'cab door'});
  b.box([-0.1, fl, zF - 1.05], [0.1, fl + 0.22, zF - 0.45], {fitting:true, c:DASH, m:'plastic', name:'centre console'});
  b.block('cyl', [0, fl + 0.34, zF - 0.7], [0.05, 0.2, 0.05], {fitting:true, c:DARK, m:'plastic', name:'gear lever'});
  driverKit(b, {hw:hw, belt:belt, cabF:zF, driverX:dx, seatY:seatY, dashDepth:0.42, dashTop:belt + 0.02});
  var sz = zF - 1.0;
  seat(b, {seatY:seatY}, dx, sz, 0.5, 'driver seat', fl); seat(b, {seatY:seatY}, -dx, sz, 0.5, 'passenger seat', fl);
}
module.exports.truckCab = truckCab;
