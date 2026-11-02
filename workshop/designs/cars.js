/* The stock cars and trucks, remade with the vehicle build library: wheels on axles, driven rear axle, swinging doors,
   engine/tank/battery markers and seats. Each keeps the look and size of the model it replaces (see SPEC below). */
var SPEC = {
  hatchback:{name:'Hatchback', cls:'car', kind:'hatch', front:1.95, back:-1.95, hw:0.85, belt:0.95, hood:1.02, roof:1.46, cabF:0.85, cabB:-1.85, floor:0.42, fz:1.25, rz:-1.2, r:0.31, paint:['#b8453a','#2b2b2b','#c9c9c9'], top:55},
  sedan:{name:'Sedan', cls:'car', kind:'sedan', front:2.3, back:-2.3, hw:0.88, belt:0.95, hood:1.02, roof:1.46, cabF:0.95, cabB:-1.3, floor:0.42, fz:1.4, rz:-1.4, r:0.31, paint:['#3f5f86','#2b2b2b','#c9c9c9'], top:60},
  wagon:{name:'Station wagon', cls:'car', kind:'wagon', front:2.35, back:-2.35, hw:0.87, belt:0.97, hood:1.04, roof:1.5, cabF:0.95, cabB:-2.25, floor:0.42, fz:1.45, rz:-1.45, r:0.31, paint:['#6a7d5a','#2b2b2b','#c9c9c9'], top:55},
  suv:{name:'SUV', cls:'car', kind:'suv', front:2.25, back:-2.25, hw:0.93, belt:1.15, hood:1.25, roof:1.86, cabF:0.95, cabB:-2.15, floor:0.55, fz:1.4, rz:-1.35, r:0.38, paint:['#2f4f3f','#2b2b2b','#c9c9c9'], top:60},
  offroader:{name:'Off-roader', cls:'car', kind:'suv', front:1.9, back:-1.9, hw:0.9, belt:1.2, hood:1.3, roof:1.86, cabF:0.75, cabB:-1.8, floor:0.6, fz:1.2, rz:-1.15, r:0.42, paint:['#a07a3a','#2b2b2b','#c9c9c9'], top:50},
  pickup:{name:'Pickup', cls:'pickup', kind:'pickup', front:2.6, back:-2.84, hw:0.95, belt:1.1, hood:1.2, roof:1.75, cabF:1.0, cabB:-0.2, floor:0.52, fz:1.7, rz:-1.5, r:0.38, paint:['#8a3a2a','#2b2b2b','#c9c9c9'], top:55, bedTo:-2.84},
  crew_pickup:{name:'Crew pickup', cls:'pickup', kind:'pickup', front:2.6, back:-2.84, hw:0.95, belt:1.1, hood:1.2, roof:1.75, cabF:1.0, cabB:-1.2, floor:0.52, fz:1.7, rz:-1.7, r:0.38, paint:['#2f3f5f','#2b2b2b','#c9c9c9'], top:55, bedTo:-2.84, crew:true},
  flatbed:{name:'Flatbed truck', cls:'pickup', kind:'flatbed', front:2.6, back:-3.84, hw:0.95, belt:1.1, hood:1.2, roof:1.75, cabF:1.0, cabB:-0.2, floor:0.52, fz:1.7, rz:-2.4, r:0.38, paint:['#c9a23a','#2b2b2b','#c9c9c9'], top:50, bedTo:-3.84},
  van:{name:'Van', cls:'van', kind:'van', front:2.5, back:-2.4, hw:1.0, belt:1.1, hood:1.15, roof:2.25, cabF:1.95, cabB:0.9, floor:0.55, fz:1.6, rz:-1.5, r:0.34, paint:['#dcdcd2','#2b2b2b','#c9c9c9'], top:50}
};

var CK = require('../tools/cabin_kit.js');
function car(WSB, id, S){
  var b = WSB.create({id:id + '_remade', name:S.name + ' (remade)', domain:'land', cls:S.cls, paint:{paint1:S.paint[0], paint2:S.paint[1], paint3:S.paint[2]}, topSpeed:S.top});
  var hw = S.hw, F = S.front, B = S.back, belt = S.belt, roof = S.roof, g = 0.32, r = S.r, fl = S.floor, bb = fl - 0.04, cabF = S.cabF, cb = S.cabB, k = S.kind;
  var four = S.crew || k === 'sedan' || k === 'wagon' || k === 'suv';
  b.wheels(r, 0.24);
  b.axle(S.fz, {steer:true, track:hw - 0.12, name:'front axle'});
  b.axle(S.rz, {driven:true, track:hw - 0.12, name:'rear axle'});
  /* chassis and floor pan */
  b.box([hw - 0.5, g, B + 0.1], [hw - 0.38, g + 0.14, F - 0.1], {c:'underside', m:'steel', mx:true, name:'chassis rail'});
  b.box([-hw + 0.1, fl - 0.14, B + 0.05], [hw - 0.1, fl - 0.05, cabF], {c:'underside', m:'steel', name:'floor pan'});
  /* body below the window line: engine bay, side skins, a rear panel or trunk (the cabin between is open) */
  b.box([-hw, bb, cabF], [hw, belt, F], {c:'paint1', name:'engine bay'});
  b.box([-hw + 0.04, belt, cabF], [hw - 0.04, S.hood, F - 0.05], {c:'paint1', name:'hood'});
  b.box([hw - 0.06, bb, k === 'van' ? cb : B], [hw, belt, cabF], {c:'paint1', mx:true, name:'side skin'});
  var tail = (k === 'sedan') ? cb : B + 0.1;
  if (k === 'sedan'){ b.box([-hw, bb, B], [hw, belt, cb], {c:'paint1', name:'trunk'}); b.box([-hw + 0.04, belt, B], [hw - 0.04, belt + 0.12, cb - 0.05], {c:'paint1', name:'boot lid'}); }
  else if (k !== 'van') b.box([-hw, bb, B], [hw, belt, B + 0.1], {c:'paint1', name:'rear panel'});
  /* cabin frame: pillars, roof, glass panes */
  var dz1 = cabF - 0.1, dz0 = Math.max(cb + 0.15, dz1 - (four ? 0.8 : 1.1)), rz1 = dz0 - 0.03, rz0 = Math.max(cb + 0.15, rz1 - 0.85);
  b.box([hw - 0.07, belt, cabF - 0.04], [hw - 0.01, roof - 0.1, cabF + 0.1], {c:'paint1', mx:true, name:'A pillar'});
  b.box([-hw + 0.02, roof - 0.1, cb - 0.05], [hw - 0.02, roof, cabF + 0.12], {c:'paint1', name:'roof'});
  b.box([-hw + 0.08, belt + 0.04, cabF + 0.03], [hw - 0.08, roof - 0.1, cabF + 0.06], {c:'glass', m:'glass', name:'windscreen'});
  if (k === 'pickup' || k === 'flatbed'){
    b.box([-hw + 0.04, belt, cb - 0.05], [hw - 0.04, belt + 0.14, cb], {c:'paint1', name:'cab back lower'});
    b.box([-hw + 0.1, belt + 0.14, cb - 0.05], [hw - 0.1, roof - 0.12, cb - 0.02], {c:'glass', m:'glass', name:'rear window'});
    b.box([hw - 0.07, belt, cb - 0.05], [hw - 0.01, roof - 0.1, cb + 0.08], {c:'paint1', mx:true, name:'C pillar'});
    b.box([-hw, bb, B], [hw, belt - 0.3, cb - 0.05], {c:'paint1', name:'bed floor'});
    if (k === 'pickup'){
      b.box([hw - 0.1, belt - 0.3, B], [hw, belt + 0.1, cb - 0.05], {c:'paint1', mx:true, name:'bed side'});
      b.box([-hw + 0.1, belt - 0.3, B], [hw - 0.1, belt + 0.1, B + 0.1], {c:'paint1', name:'tailgate'});
      b.box([-hw + 0.1, belt - 0.3, cb - 0.15], [hw - 0.1, belt + 0.1, cb - 0.05], {c:'paint1', name:'bed front'});
    } else {
      b.box([-hw - 0.05, belt - 0.3, B], [hw + 0.05, belt - 0.15, cb - 0.05], {c:'#8a6a48', m:'wood', name:'flat deck'});
      b.box([-hw - 0.05, belt - 0.15, cb - 0.2], [hw + 0.05, belt + 0.35, cb - 0.1], {c:'paint2', name:'headboard'});
    }
  } else if (k === 'van'){
    b.box([-hw + 0.04, belt, cb - 0.05], [hw - 0.04, roof - 0.12, cb], {c:'paint1', name:'bulkhead'});
    b.box([hw - 0.07, belt, cb - 0.05], [hw - 0.01, roof - 0.1, cb + 0.08], {c:'paint1', mx:true, name:'cab rear pillar'});
  } else {
    b.box([-hw + 0.08, belt + 0.04, tail - 0.03], [hw - 0.08, roof - 0.1, tail], {c:'glass', m:'glass', name:'rear window'});
    b.box([hw - 0.07, belt, tail - 0.04], [hw - 0.01, roof - 0.1, tail + 0.12], {c:'paint1', mx:true, name:'C pillar'});
    var qz = four ? rz0 : dz0;
    if (qz - tail > 0.2) b.box([hw - 0.05, belt + 0.03, tail + 0.12], [hw - 0.02, roof - 0.12, qz - 0.03], {c:'glass', m:'glass', mx:true, name:'quarter window'});
  }
  /* doors: lower panel, window glass and frame, one door named together */
  function door(z0, z1, nm){
    b.door([hw, bb + 0.04, z0], [hw + 0.05, belt, z1], {c:'paint1', mx:true, hinge:'front', name:nm});
    b.box([hw + 0.01, belt, z0 + 0.04], [hw + 0.04, roof - 0.12, z1 - 0.04], {c:'glass', m:'glass', mx:true, name:nm});
    b.box([hw, roof - 0.12, z0], [hw + 0.05, roof - 0.1, z1], {c:'paint1', mx:true, name:nm});
    b.box([hw, belt, z0], [hw + 0.05, roof - 0.12, z0 + 0.04], {c:'paint1', mx:true, name:nm});
  }
  door(dz0, dz1, 'front door');
  if (four) door(rz0, rz1, 'rear door');
  /* looks rules (docs/VEHICLE_DESIGN_GUIDE.md): dark arch trims frame each wheel, a sill closes the gap under the doors, mirrors and handles break the flat side */
  [S.fz, S.rz].forEach(function(az, i){ /* an arch frame: a lip over the tyre and a post each side, so it reads as an opening the wheel sits in */
    var nm = i ? 'rear arch trim' : 'front arch trim', t = 2*r + 0.1;
    b.box([hw - 0.02, 2*r + 0.02, az - r - 0.1], [hw + 0.06, t, az + r + 0.1], {c:'black', m:'plastic', mx:true, name:nm});
    b.box([hw - 0.02, r + 0.15, az + r + 0.04], [hw + 0.06, t, az + r + 0.1], {c:'black', m:'plastic', mx:true, name:nm});
    b.box([hw - 0.02, r + 0.15, az - r - 0.1], [hw + 0.06, t, az - r - 0.04], {c:'black', m:'plastic', mx:true, name:nm});
  });
  b.box([hw - 0.02, bb, S.rz + r + 0.08], [hw + 0.04, bb + 0.1, S.fz - r - 0.08], {c:'underside', m:'plastic', mx:true, name:'sill'});
  b.box([hw - 0.02, belt - 0.05, dz0 + 0.05], [hw + 0.12, belt + 0.05, dz0 + 0.1], {c:'black', m:'plastic', mx:true, name:'wing mirror'});
  b.box([hw + 0.05, belt - 0.12, dz0 + 0.08], [hw + 0.08, belt - 0.08, dz0 + 0.28], {c:'chrome', m:'chrome', mx:true, name:'door handle'});
  /* nose and tail fittings */
  b.box([-hw - 0.02, bb, F - 0.05], [hw + 0.02, bb + 0.2, F + 0.1], {c:'chrome', m:'chrome', name:'front bumper'});
  b.box([-hw - 0.02, bb, B - 0.1], [hw + 0.02, bb + 0.2, B + 0.05], {c:'chrome', m:'chrome', name:'rear bumper'});
  b.box([-0.5, belt - 0.4, F - 0.02], [0.5, belt - 0.05, F + 0.03], {c:'black', m:'plastic', name:'grille'});
  b.light('headlight', [hw - 0.2, belt - 0.2, F + 0.03], [0.26, 0.14, 0.04]);
  b.light('taillight', [hw - 0.2, belt - 0.1, B], [0.24, 0.14, 0.04]);
  /* the cabin: floor, headliner, dash, wheel, console, door cards, seats (4 in the four-seaters, 2 in the others) */
  var rear = [];
  if (four || (k !== 'pickup' && k !== 'flatbed' && k !== 'van')) { rear = [cabF - 0.78 - 0.95, cabF - 0.78 - 0.95]; }
  CK.carCabin(b, {hw:hw, belt:belt, roof:roof, cabF:cabF, cabB:cb, g:g, floor:fl, seatY:fl + 0.18, rear:rear});
  b.engine([0, belt - 0.3, (cabF + F)/2 + 0.1], [hw*1.1, 0.5, Math.max(0.5, F - cabF - 0.2)]);
  b.tank([0, bb + 0.2, B + 0.6], [0.7, 0.25, 0.5]); b.battery([hw - 0.35, belt - 0.2, F - 0.4]);
  if (k === 'van'){
    b.shell([-hw + 0.04, fl, B + 0.1], [hw - 0.04, roof - 0.05, cb - 0.05], {open:['back'], c:'paint1', wall:0.04, floor:0.06, name:'cargo', room:'cargo'});
    b.door([-hw + 0.04, fl - 0.06, B - 0.06], [hw - 0.04, roof, B + 0.1], {kind:'swing', hinge:'outer', c:'paint1', name:'rear doors'});
  }
  return b;
}
module.exports = function(WSB){ return []; }; /* the stock cars are rebuilt in refs.js (Q table); car() stays for red_truck */
module.exports.SPEC = SPEC; module.exports.car = car;
