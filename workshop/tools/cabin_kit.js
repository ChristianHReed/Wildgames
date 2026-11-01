/* Cabin parts for the vehicle designs (car interiors request, 1 Nov 2026): dashboard with instrument binnacle, steering wheel, centre console and
   gearstick, door cards, floor, headliner and seats with backrests. Used by workshop/designs/*.js.
   Driver is on the LEFT (x < 0), the first Seat piece. Points written for the game: 'cabin.eye' (kind eye, the driver's eye) and 'steer.wheel'
   (kind hinge: pivot at the wheel centre, dir = the column axis, so the game turns the wheel piece named 'steering wheel' about it). */
var M = require('../model.js');
var DARK = '#2c2c30', DASH = '#34343a', TRIM = '#4a4640', CARPET = '#3a3733', LINER = '#b9b3a3';
function sy(S){ return Math.round(S*1e4)/1e4; }
/* dashboard, binnacle, wheel, column, eye */
function driverKit(b, o){
  var hw = o.hw, belt = o.belt, zF = o.cabF, dx = o.driverX == null ? -0.4 : o.driverX, seatY = o.seatY, dep = o.dashDepth || 0.38, top = o.dashTop || belt + 0.02, rake = o.rake == null ? -62 : o.rake;
  b.box([-hw + 0.08, top - 0.32, zF - dep], [hw - 0.08, top, zF - 0.01], {fitting:true, c:DASH, m:'plastic', name:'dashboard'});
  b.box([dx - 0.3, top, zF - dep + 0.08], [dx + 0.3, top + 0.12, zF - dep + 0.3], {fitting:true, c:DARK, m:'plastic', name:'instrument binnacle'});
  b.box([dx - 0.2, top + 0.02, zF - dep + 0.07], [dx + 0.2, top + 0.1, zF - dep + 0.09], {fitting:true, c:'#7ab0c8', m:'glass', name:'gauges'});
  var wz = zF - dep - 0.18, wy = top - 0.1;
  b.box([dx - 0.025, wy - 0.08, wz + 0.06], [dx + 0.025, wy, zF - dep + 0.05], {fitting:true, c:DARK, m:'plastic', name:'steering column'});
  b.block('tube', [dx, wy + 0.03, wz], [0.38, 0.03, 0.38], {fitting:true, c:DARK, m:'rubber', ax:'y', rot:[rake - 4, 0, 0], name:'steering wheel'});
  b.block('box', [dx, wy + 0.03, wz], [0.34, 0.03, 0.04], {fitting:true, c:DARK, m:'plastic', rot:[rake - 4, 0, 0], name:'steering wheel'});
  M.addPoint(b.doc, 'steer.wheel', 'hinge', [dx, sy(wy + 0.03), sy(wz)], [0, 0.4, -0.9]);
  M.addPoint(b.doc, 'cabin.eye', 'eye', [dx, sy(seatY + 0.66), sy(wz - 0.42)], [0, -0.06, 1]);
}
/* a seat: pedestal, cushion (the Seat job) and backrest */
function seat(b, o, x, z, w, name, floorTop){
  b.box([x - 0.1, floorTop, z - 0.1], [x + 0.1, o.seatY - 0.06, z + 0.1], {fitting:true, c:TRIM, m:'plastic', name:'seat rail'});
  b.seat([x, o.seatY, z], {size:[w, 0.12, 0.5], c:'#4a4a44', name:name});
  b.box([x - w/2, o.seatY + 0.05, z - 0.36], [x + w/2, o.seatY + 0.6, z - 0.26], {fitting:true, c:'#4a4a44', m:'cloth', name:name + ' back'});
  b.box([x - 0.12, o.seatY + 0.6, z - 0.35], [x + 0.12, o.seatY + 0.72, z - 0.28], {fitting:true, c:'#4a4a44', m:'cloth', name:name + ' headrest'});
}
/* the whole cabin of a car or pickup */
function carCabin(b, o){
  var hw = o.hw, belt = o.belt, roof = o.roof, zF = o.cabF, zB = o.cabB, g = o.g, floorTop = g + 0.28;
  b.box([-hw + 0.08, g + 0.22, zB + 0.04], [hw - 0.08, floorTop, zF - 0.02], {fitting:true, c:CARPET, m:'cloth', name:'floor carpet'});
  b.box([-hw + 0.1, roof - 0.14, zB + 0.05], [hw - 0.1, roof - 0.1, zF - 0.02], {fitting:true, c:LINER, m:'cloth', name:'headliner'});
  b.box([hw - 0.12, g + 0.3, zB + 0.1], [hw - 0.07, belt + 0.02, zF - 0.1], {fitting:true, c:TRIM, m:'plastic', mx:true, name:'door card'});
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
  b.box([-hw + 0.1, roof - 0.14, zB + 0.05], [hw - 0.1, roof - 0.1, zF - 0.02], {fitting:true, c:LINER, m:'cloth', name:'headliner'});
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
