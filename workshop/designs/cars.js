/* The stock cars and trucks, remade with the vehicle build library: wheels on axles, driven rear axle, swinging doors,
   engine/tank/battery markers and seats. Each keeps the look and size of the model it replaces (see SPEC below). */
var SPEC = {
  hatchback:{name:'Hatchback', cls:'car', kind:'hatch', front:1.95, back:-1.95, hw:0.85, belt:0.95, hood:1.02, roof:1.46, cabF:0.55, cabB:-1.75, fz:1.25, rz:-1.2, r:0.31, paint:['#b8453a','#2b2b2b','#c9c9c9'], top:55},
  sedan:{name:'Sedan', cls:'car', kind:'sedan', front:2.3, back:-2.3, hw:0.88, belt:0.95, hood:1.02, roof:1.46, cabF:0.7, cabB:-0.95, fz:1.4, rz:-1.4, r:0.31, paint:['#3f5f86','#2b2b2b','#c9c9c9'], top:60},
  wagon:{name:'Station wagon', cls:'car', kind:'wagon', front:2.35, back:-2.35, hw:0.87, belt:0.97, hood:1.04, roof:1.5, cabF:0.75, cabB:-2.2, fz:1.45, rz:-1.45, r:0.31, paint:['#6a7d5a','#2b2b2b','#c9c9c9'], top:55},
  suv:{name:'SUV', cls:'car', kind:'suv', front:2.25, back:-2.25, hw:0.93, belt:1.15, hood:1.25, roof:1.86, cabF:0.75, cabB:-2.1, fz:1.4, rz:-1.35, r:0.38, paint:['#2f4f3f','#2b2b2b','#c9c9c9'], top:60},
  offroader:{name:'Off-roader', cls:'car', kind:'suv', front:1.9, back:-1.9, hw:0.9, belt:1.2, hood:1.3, roof:1.86, cabF:0.5, cabB:-1.75, fz:1.2, rz:-1.15, r:0.42, paint:['#a07a3a','#2b2b2b','#c9c9c9'], top:50},
  pickup:{name:'Pickup', cls:'pickup', kind:'pickup', front:2.6, back:-2.84, hw:0.95, belt:1.1, hood:1.2, roof:1.75, cabF:1.0, cabB:0.0, fz:1.7, rz:-1.5, r:0.38, paint:['#8a3a2a','#2b2b2b','#c9c9c9'], top:55, bedTo:-2.84},
  crew_pickup:{name:'Crew pickup', cls:'pickup', kind:'pickup', front:2.6, back:-2.84, hw:0.95, belt:1.1, hood:1.2, roof:1.75, cabF:1.0, cabB:-0.75, fz:1.7, rz:-1.7, r:0.38, paint:['#2f3f5f','#2b2b2b','#c9c9c9'], top:55, bedTo:-2.84, crew:true},
  flatbed:{name:'Flatbed truck', cls:'pickup', kind:'flatbed', front:2.6, back:-3.84, hw:0.95, belt:1.1, hood:1.2, roof:1.75, cabF:1.0, cabB:0.0, fz:1.7, rz:-2.4, r:0.38, paint:['#c9a23a','#2b2b2b','#c9c9c9'], top:50, bedTo:-3.84},
  van:{name:'Van', cls:'van', kind:'van', front:2.5, back:-2.4, hw:1.0, belt:1.1, hood:1.15, roof:2.25, cabF:1.75, cabB:-2.4, fz:1.6, rz:-1.5, r:0.34, paint:['#dcdcd2','#2b2b2b','#c9c9c9'], top:50}
};
function car(WSB, id, S){
  var b = WSB.create({id:id + '_remade', name:S.name + ' (remade)', domain:'land', cls:S.cls, paint:{paint1:S.paint[0], paint2:S.paint[1], paint3:S.paint[2]}, topSpeed:S.top});
  var hw = S.hw, F = S.front, B = S.back, belt = S.belt, roof = S.roof, g = 0.32, r = S.r;
  b.wheels(r, 0.24);
  b.axle(S.fz, {steer:true, track:hw - 0.12, name:'front axle'});
  b.axle(S.rz, {driven:true, track:hw - 0.12, name:'rear axle'});
  /* chassis and floor */
  b.box([hw - 0.5, g, B + 0.1], [hw - 0.38, g + 0.14, F - 0.1], {c:'underside', m:'steel', mx:true, name:'chassis rail'});
  b.box([-hw + 0.1, g + 0.1, B + 0.1], [hw - 0.1, g + 0.22, S.cabF + 0.05], {c:'underside', m:'steel', name:'floor pan'});
  /* body below the window line, front to back */
  b.box([-hw, g + 0.18, S.kind === 'van' ? S.cabF - 0.05 : B], [hw, belt, F], {c:'paint1', name:'lower body'});
  b.box([-hw + 0.04, belt, S.cabF], [hw - 0.04, S.hood, F - 0.05], {c:'paint1', name:'hood'});
  /* cabin: glass between a belt line and a roof slab, solid pillars front and back */
  var cb = S.cabB;
  if (S.kind === 'pickup' || S.kind === 'flatbed'){
    b.box([-hw + 0.04, belt, cb], [hw - 0.04, roof - 0.1, S.cabF], {c:'glass', m:'glass', name:'cab glass'});
    b.box([-hw + 0.02, roof - 0.1, cb - 0.05], [hw - 0.02, roof, S.cabF + 0.05], {c:'paint1', name:'cab roof'});
    b.box([-hw + 0.02, belt, cb - 0.05], [hw - 0.02, roof - 0.1, cb], {c:'paint1', name:'cab back'});
    b.box([-hw, g + 0.18, B], [hw, belt - 0.35, cb - 0.05], {c:'paint1', name:'bed floor'});
    if (S.kind === 'pickup'){
      b.box([hw - 0.1, belt - 0.35, B], [hw, belt + 0.1, cb - 0.05], {c:'paint1', mx:true, name:'bed side'});
      b.box([-hw + 0.1, belt - 0.35, B], [hw - 0.1, belt + 0.1, B + 0.1], {c:'paint1', name:'tailgate'});
      b.box([-hw + 0.1, belt - 0.35, cb - 0.15], [hw - 0.1, belt + 0.1, cb - 0.05], {c:'paint1', name:'bed front'});
    } else {
      b.box([-hw - 0.05, belt - 0.35, B], [hw + 0.05, belt - 0.2, cb - 0.05], {c:'#8a6a48', m:'wood', name:'flat deck'});
      b.box([-hw - 0.05, belt - 0.2, cb - 0.2], [hw + 0.05, belt + 0.35, cb - 0.1], {c:'paint2', name:'headboard'});
    }
  } else if (S.kind === 'van'){
    b.box([-hw + 0.04, belt, S.cabF], [hw - 0.04, roof - 0.12, S.cabF + 0.55], {c:'glass', m:'glass', name:'windscreen'});
    b.box([-hw + 0.02, roof - 0.12, S.cabF - 0.05], [hw - 0.02, roof, S.cabF + 0.6], {c:'paint1', name:'cab roof'});
    b.box([-hw + 0.04, belt, S.cabF - 0.05], [hw - 0.04, roof - 0.12, S.cabF], {c:'paint1', name:'bulkhead'});
  } else {
    var tail = (S.kind === 'sedan') ? S.cabB : B + 0.1;
    b.box([-hw + 0.04, belt, tail], [hw - 0.04, roof - 0.1, S.cabF], {c:'glass', m:'glass', name:'glass'});
    b.box([-hw + 0.02, roof - 0.1, tail - 0.05], [hw - 0.02, roof, S.cabF + 0.05], {c:'paint1', name:'roof'});
    b.box([-hw + 0.02, belt, tail - 0.1], [hw - 0.02, roof - 0.1, tail], {c:'paint1', name:'rear pillar'});
    if (S.kind === 'sedan') b.box([-hw + 0.04, belt, B], [hw - 0.04, belt + 0.12, tail - 0.1], {c:'paint1', name:'boot lid'});
  }
  /* doors (front pair, and a second pair on crew cabs, sedans and wagons) */
  var dz1 = S.cabF - 0.1, dz0 = Math.max(cb + 0.15, dz1 - (S.crew || S.kind === 'sedan' || S.kind === 'wagon' ? 0.75 : 1.1));
  b.door([hw, g + 0.3, dz0], [hw + 0.04, roof - 0.12, dz1], {c:'paint1', mx:true, hinge:'front', name:'front door'});
  if (S.crew || S.kind === 'sedan' || S.kind === 'wagon' || S.kind === 'suv') b.door([hw, g + 0.3, Math.max(cb + 0.1, dz0 - 0.8)], [hw + 0.04, roof - 0.12, dz0 - 0.02], {c:'paint1', mx:true, hinge:'front', name:'rear door'});
  /* nose and tail fittings */
  b.box([-hw - 0.02, g + 0.1, F - 0.05], [hw + 0.02, g + 0.3, F + 0.1], {c:'chrome', m:'chrome', name:'front bumper'});
  b.box([-hw - 0.02, g + 0.1, B - 0.1], [hw + 0.02, g + 0.3, B + 0.05], {c:'chrome', m:'chrome', name:'rear bumper'});
  b.box([-0.5, belt - 0.4, F - 0.02], [0.5, belt - 0.05, F + 0.03], {c:'black', m:'plastic', name:'grille'});
  b.light('headlight', [hw - 0.2, belt - 0.2, F + 0.03], [0.26, 0.14, 0.04]);
  b.light('taillight', [hw - 0.2, belt - 0.1, B], [0.24, 0.14, 0.04]);
  /* seats and engine */
  var sz = S.cabF - 0.35;
  b.seat([0.4, belt - 0.5, sz], {mx:true, name:'front seat'});
  if (S.crew || S.kind !== 'pickup' && S.kind !== 'flatbed' && S.kind !== 'van') b.seat([0, belt - 0.5, Math.max(cb + 0.45, sz - 1.0)], {size:[hw*1.6, 0.1, 0.45], name:'back seat'});
  b.engine([0, belt - 0.35, (S.cabF + F)/2 + 0.1], [hw*1.1, 0.5, Math.max(0.6, F - S.cabF - 0.2)]);
  b.tank([0, g + 0.3, B + 0.6], [0.7, 0.25, 0.5]); b.battery([hw - 0.35, belt - 0.2, F - 0.4]);
  if (S.kind === 'van'){ b.shell([-hw + 0.04, 0.5, B + 0.1], [hw - 0.04, roof - 0.05, S.cabF - 0.05], {open:['back'], c:'paint1', wall:0.04, floor:0.06, name:'cargo', room:'cargo'}); b.door([-hw + 0.04, 0.44, B - 0.06], [hw - 0.04, roof, B + 0.1], {kind:'swing', hinge:'outer', c:'paint1', name:'rear doors'}); }
  return b;
}
module.exports = function(WSB){ return Object.keys(SPEC).map(function(k){ return car(WSB, k, SPEC[k]); }); };
module.exports.SPEC = SPEC;
