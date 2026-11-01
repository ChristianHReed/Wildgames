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
  b.box([-hw + 0.08, top - 0.32, zF - dep], [hw - 0.08, top, zF - 0.01], {c:DASH, m:'plastic', name:'dashboard'});
  b.box([dx - 0.3, top, zF - dep + 0.08], [dx + 0.3, top + 0.12, zF - dep + 0.3], {c:DARK, m:'plastic', name:'instrument binnacle'});
  b.box([dx - 0.2, top + 0.02, zF - dep + 0.07], [dx + 0.2, top + 0.1, zF - dep + 0.09], {c:'#7ab0c8', m:'glass', name:'gauges'});
  var wz = zF - dep - 0.18, wy = top - 0.1;
  b.box([dx - 0.025, wy - 0.08, wz + 0.06], [dx + 0.025, wy, zF - dep + 0.05], {c:DARK, m:'plastic', name:'steering column'});
  b.block('tube', [dx, wy + 0.03, wz], [0.38, 0.03, 0.38], {c:DARK, m:'rubber', ax:'y', rot:[rake - 4, 0, 0], name:'steering wheel'});
  b.block('box', [dx, wy + 0.03, wz], [0.34, 0.03, 0.04], {c:DARK, m:'plastic', rot:[rake - 4, 0, 0], name:'steering wheel'});
  M.addPoint(b.doc, 'steer.wheel', 'hinge', [dx, sy(wy + 0.03), sy(wz)], [0, 0.4, -0.9]);
  M.addPoint(b.doc, 'cabin.eye', 'eye', [dx, sy(seatY + 0.66), sy(wz - 0.42)], [0, -0.06, 1]);
}
/* a seat: pedestal, cushion (the Seat job) and backrest */
function seat(b, o, x, z, w, name, floorTop){
  b.box([x - 0.1, floorTop, z - 0.1], [x + 0.1, o.seatY - 0.06, z + 0.1], {c:TRIM, m:'plastic', name:'seat rail'});
  b.seat([x, o.seatY, z], {size:[w, 0.12, 0.5], c:'#4a4a44', name:name});
  b.box([x - w/2, o.seatY + 0.05, z - 0.36], [x + w/2, o.seatY + 0.6, z - 0.26], {c:'#4a4a44', m:'cloth', name:name + ' back'});
  b.box([x - 0.12, o.seatY + 0.6, z - 0.35], [x + 0.12, o.seatY + 0.72, z - 0.28], {c:'#4a4a44', m:'cloth', name:name + ' headrest'});
}
/* the whole cabin of a car or pickup */
function carCabin(b, o){
  var hw = o.hw, belt = o.belt, roof = o.roof, zF = o.cabF, zB = o.cabB, g = o.g, floorTop = g + 0.28;
  b.box([-hw + 0.08, g + 0.22, zB + 0.04], [hw - 0.08, floorTop, zF - 0.02], {c:CARPET, m:'cloth', name:'floor carpet'});
  b.box([-hw + 0.1, roof - 0.14, zB + 0.05], [hw - 0.1, roof - 0.1, zF - 0.02], {c:LINER, m:'cloth', name:'headliner'});
  b.box([hw - 0.12, g + 0.3, zB + 0.1], [hw - 0.07, belt + 0.02, zF - 0.1], {c:TRIM, m:'plastic', mx:true, name:'door card'});
  b.box([-0.1, floorTop, zF - 0.95], [0.1, floorTop + 0.22, zF - 0.1], {c:DASH, m:'plastic', name:'centre console'});
  b.block('cyl', [0, floorTop + 0.34, zF - 0.55], [0.05, 0.2, 0.05], {c:DARK, m:'plastic', name:'gear lever'});
  driverKit(b, o);
  var sz = zF - 0.78;
  seat(b, o, -0.4, sz, 0.5, 'driver seat', floorTop); seat(b, o, 0.4, sz, 0.5, 'passenger seat', floorTop);
  (o.rear || []).forEach(function(z, i){ seat(b, o, i % 2 ? 0.4 : -0.4, z, 0.5, 'rear seat ' + (i + 1), floorTop); });
}
module.exports = {driverKit:driverKit, seat:seat, carCabin:carCabin, COLORS:{DARK:DARK, DASH:DASH, TRIM:TRIM, CARPET:CARPET, LINER:LINER}};
