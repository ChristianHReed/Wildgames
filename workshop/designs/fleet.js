/* The fleet, remade: city bus and school bus with a walk-in aisle and a sliding door, a fire engine with a roll-up locker,
   and a motorhome you can live in. (The semi tractor and trailers are the samples semi_tractor.js and box_trailer.js.) */
function mk(WSB, id, name, cls, paint, top){ return WSB.create({id:id + '_remade', name:name + ' (remade)', domain:'land', cls:cls, paint:{paint1:paint[0], paint2:paint[1], paint3:paint[2]}, topSpeed:top}); }
/* a box body with a walk-in room, window band, doorway on the right near the front, rows of seats */
function busBody(b, o){
  var hw = o.hw, f = o.zf, a = o.zb, fl = o.floor, rf = o.roof, doorA = o.doorA, doorB = o.doorB;
  b.shell([-hw + 0.06, fl, a], [hw - 0.06, rf - 0.06, f], {open:['left', 'right'], c:'paint1', floorC:'underside', wall:0.06, floor:0.1, name:'bus', room:'cabin'});
  /* left wall: skirt, glass band, belt rail */
  b.box([-hw, fl - 0.1, a], [-hw + 0.06, fl + 0.95, f], {c:'paint1', name:'left skirt'});
  b.box([-hw, fl + 0.95, a], [-hw + 0.06, rf - 0.3, f], {c:'glass', m:'glass', name:'left windows'});
  b.box([-hw, rf - 0.3, a], [-hw + 0.06, rf, f], {c:'paint1', name:'left rail'});
  /* right wall: same, with a doorway between doorA and doorB */
  b.box([hw - 0.06, fl - 0.1, a], [hw, fl + 0.95, doorA], {c:'paint1', name:'right skirt back'});
  b.box([hw - 0.06, fl - 0.1, doorB], [hw, fl + 0.95, f], {c:'paint1', name:'right skirt front'});
  b.box([hw - 0.06, fl + 0.95, a], [hw, rf - 0.3, doorA], {c:'glass', m:'glass', name:'right windows'});
  b.box([hw - 0.06, fl + 0.95, doorB], [hw, rf - 0.3, f], {c:'glass', m:'glass', name:'right windscreen side'});
  b.box([hw - 0.06, rf - 0.3, a], [hw, rf, f], {c:'paint1', name:'right rail'});
  b.box([hw - 0.06, fl + 1.95, doorA], [hw, rf - 0.3, doorB], {c:'paint1', name:'door header'});
  b.door([hw - 0.04, fl - 0.05, doorA], [hw, fl + 1.95, doorB], {kind:'slide', c:'paint2', name:'passenger door'});
  /* nose glass and rear window */
  b.box([-hw + 0.06, fl + 0.95, f], [hw - 0.06, rf - 0.3, f + 0.05], {c:'glass', m:'glass', name:'windscreen'});
  b.box([-hw + 0.06, fl + 0.95, a - 0.05], [hw - 0.06, rf - 0.3, a], {c:'glass', m:'glass', name:'rear window'});
  /* seats: driver at the front, rows down the length */
  b.seat([hw - 0.55, fl + 0.06, f - 0.7], {name:'driver seat'});
  for (var z = doorA - 0.9, i = 0; z > a + 0.8; z -= 1.0, i++){ b.seat([hw - 0.6, fl + 0.06, z], {size:[0.8, 0.1, 0.45], name:'seat'}); b.seat([-hw + 0.6, fl + 0.06, z], {size:[0.8, 0.1, 0.45], name:'seat'}); }
  /* floor line, bumpers, lights */
  b.box([-hw, fl - 0.25, a - 0.15], [hw, fl - 0.1, f + 0.15], {c:'underside', m:'steel', name:'frame'});
  b.box([-hw - 0.02, fl - 0.35, f + 0.05], [hw + 0.02, fl - 0.1, f + 0.2], {c:'chrome', m:'chrome', name:'front bumper'});
  b.box([-hw - 0.02, fl - 0.35, a - 0.2], [hw + 0.02, fl - 0.1, a - 0.05], {c:'chrome', m:'chrome', name:'rear bumper'});
  b.light('headlight', [hw - 0.35, fl + 0.3, f + 0.05], [0.3, 0.2, 0.04]); b.light('taillight', [hw - 0.3, fl + 0.4, a - 0.05], [0.2, 0.3, 0.04]);
  b.engine([0, fl - 0.1, a + 1.0], [1.2, 0.5, 1.2]); b.tank([-hw + 0.5, fl - 0.4, (f + a)/2], [0.5, 0.35, 1.2]); b.battery([0, fl - 0.3, f - 1.0]);
}
var DESIGNS = {
  city_bus:function(){ return function(b){ b.wheels(0.5, 0.3); b.axle(4.2, {steer:true, track:1.1, name:'front axle'}); b.axle(-3.6, {driven:true, track:1.1, name:'rear axle'});
    busBody(b, {hw:1.3, zf:5.95, zb:-5.95, floor:0.85, roof:3.2, doorA:3.9, doorB:5.0}); b.door([hw(1.3) - 0.04, 0.8, -1.6], [1.3, 2.8, -0.5], {kind:'slide', c:'paint2', name:'rear door'}); }; },
  school_bus:function(){ return function(b){ b.wheels(0.5, 0.3); b.axle(3.5, {steer:true, track:1.1, name:'front axle'}); b.axle(-3.3, {driven:true, track:1.1, name:'rear axle'});
    busBody(b, {hw:1.3, zf:3.8, zb:-5.3, floor:0.85, roof:3.1, doorA:2.2, doorB:3.3});
    b.box([-1.25, 0.6, 3.8], [1.25, 1.55, 4.7], {c:'paint1', name:'hood'}); b.box([-1.2, 0.5, 4.7], [1.2, 1.1, 4.75], {c:'black', m:'plastic', name:'grille'}); b.box([-1.3, 1.5, 3.8], [1.3, 1.6, 4.6], {c:'paint2', name:'hood stripe'}); }; },
  fire_engine:function(){ return function(b){ b.wheels(0.5, 0.3); b.axle(2.7, {steer:true, track:1.1, name:'front axle'}); b.axle(-2.4, {driven:true, track:1.1, name:'rear axle'});
    b.box([-0.45, 0.7, -4.8], [0.45, 0.9, 4.0], {c:'underside', m:'steel', name:'chassis'});
    b.box([-1.3, 0.9, 1.4], [1.3, 1.9, 4.1], {c:'paint1', name:'cab lower'}); b.box([-1.3, 1.9, 1.4], [1.3, 3.1, 2.5], {c:'paint1', name:'cab'}); b.box([-1.25, 1.9, 2.5], [1.25, 3.0, 3.3], {c:'glass', m:'glass', name:'cab glass'}); b.box([-1.3, 3.0, 1.4], [1.3, 3.1, 3.4], {c:'paint1', name:'cab roof'});
    b.door([1.3, 1.0, 1.7], [1.34, 3.0, 3.1], {mx:true, hinge:'front', c:'paint1', name:'cab door'});
    b.shell([-1.2, 1.0, -4.7], [1.2, 2.7, 1.3], {open:['back'], c:'paint1', floorC:'underside', wall:0.05, floor:0.1, name:'locker', room:'locker'}); b.door([-1.2, 1.0, -4.8], [1.2, 2.7, -4.72], {kind:'roll', c:'paint2', name:'locker door'});
    b.box([-1.3, 2.7, -4.8], [1.3, 3.0, 1.4], {c:'paint2', name:'upper body'}); b.box([-0.5, 3.0, -4.0], [0.5, 3.15, 1.0], {c:'chrome', m:'steel', name:'ladder rack'});
    b.box([-1.35, 0.8, 4.0], [1.35, 1.0, 4.25], {c:'chrome', m:'chrome', name:'bumper'}); b.light('headlight', [0.8, 1.4, 4.12], [0.3, 0.2, 0.04]); b.light('taillight', [1.1, 1.5, -4.82], [0.2, 0.3, 0.04]);
    b.engine([0, 1.4, 3.0], [1.2, 0.7, 1.0]); b.tank([0, 0.95, -1.5], [0.8, 0.25, 1.5]); b.battery([0.9, 1.3, 3.6]); b.seat([0.6, 1.6, 2.0], {mx:true, name:'cab seat'}); b.storage([-1.1, 1.05, -4.6], [1.1, 2.4, -2.0], 'hose lockers'); }; },
  motorhome:function(){ return function(b){ b.wheels(0.42, 0.28); b.axle(2.7, {steer:true, track:0.95, name:'front axle'}); b.axle(-2.2, {driven:true, track:0.95, name:'rear axle'});
    b.box([-0.5, 0.5, -4.1], [0.5, 0.7, 3.6], {c:'underside', m:'steel', name:'chassis'});
    b.box([-1.1, 0.7, 2.2], [1.1, 1.5, 3.7], {c:'paint1', name:'nose'}); b.box([-1.05, 1.5, 2.2], [1.05, 2.4, 3.3], {c:'glass', m:'glass', name:'windscreen'}); b.box([-1.1, 2.4, 1.6], [1.1, 2.5, 3.4], {c:'paint1', name:'cab roof'});
    b.door([1.1, 0.9, 2.3], [1.14, 2.35, 3.2], {mx:true, hinge:'front', c:'paint1', name:'cab door'});
    b.shell([-1.25, 0.8, -4.2], [1.25, 3.0, 2.2], {open:['left', 'right'], c:'paint1', floorC:'#8a6a48', wall:0.06, floor:0.1, name:'living area', room:'living area'});
    b.box([-1.31, 0.7, -4.2], [-1.25, 3.05, 2.2], {c:'paint1', name:'left wall'}); b.box([1.25, 0.7, -4.2], [1.31, 3.05, -1.0], {c:'paint1', name:'right wall back'}); b.box([1.25, 2.4, -1.0], [1.31, 3.05, 0.1], {c:'paint1', name:'door header'}); b.box([1.25, 0.7, 0.1], [1.31, 3.05, 2.2], {c:'paint1', name:'right wall front'});
    b.door([1.27, 0.8, -1.0], [1.33, 2.4, 0.1], {kind:'swing', hinge:'front', c:'paint2', name:'habitation door'});
    b.box([1.31, 1.6, -3.6], [1.33, 2.4, -1.2], {c:'glass', m:'glass', name:'right windows'}); b.box([-1.33, 1.6, -3.6], [-1.31, 2.4, 1.6], {c:'glass', m:'glass', name:'left windows'});
    b.bed([-0.6, 0.95, -3.1], [1.3, 0.3, 1.9], {name:'double bed'}); b.seat([0.7, 0.86, 1.2], {size:[0.9, 0.12, 0.5], name:'dinette seat'}); b.box([-1.0, 0.8, 0.8], [-0.4, 1.5, 1.8], {c:'paint2', fn:'storage', name:'galley counter'});
    b.box([-1.15, 3.0, -4.3], [1.15, 3.1, 2.3], {c:'paint1', name:'roof'}); b.box([-1.3, 0.5, -4.35], [1.3, 0.8, -4.2], {c:'chrome', m:'chrome', name:'rear bumper'}); b.box([-1.15, 0.5, 3.6], [1.15, 0.75, 3.8], {c:'chrome', m:'chrome', name:'front bumper'});
    b.light('headlight', [0.8, 1.0, 3.72], [0.26, 0.16, 0.04]); b.light('taillight', [1.1, 1.2, -4.22], [0.16, 0.24, 0.04]);
    b.engine([0, 1.0, 3.0], [0.9, 0.5, 0.9]); b.tank([0.9, 0.62, -1.0], [0.4, 0.3, 1.0]); b.battery([0.6, 1.2, 3.3]); b.seat([0.5, 1.0, 2.8], {mx:true, name:'cab seat'}); }; }
};
function hw(x){ return x; }
var META = {city_bus:['City bus','bus',['#d4d0c4','#2f5f8a','#3a3a3a'],60], school_bus:['School bus','bus',['#d9a62b','#2b2b2b','#c9c9c9'],55], fire_engine:['Fire engine','truck',['#b02a22','#e8e4da','#3a3a3a'],65], motorhome:['Motorhome','rv',['#e8e4da','#4a6a7a','#3a3a3a'],65]};
module.exports = function(WSB){ return Object.keys(META).map(function(k){ var m = META[k], b = mk(WSB, k, m[0], m[1], m[2], m[3]); DESIGNS[k]()(b); return b; }); };
