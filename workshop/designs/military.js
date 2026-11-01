/* Military vehicles built with the vehicle build library: jeep, humvee, 6x6 cargo truck (walk-in, canvas tilt), 8-wheel APC
   (walk-in with a rear ramp), armoured car, ammo trailer, patrol boat and a transport helicopter. Olive drab / sand paints. */
var OD = ['#5a6040', '#2b2d26', '#8a8a78'], SAND = ['#a89870', '#3a3428', '#8a8a78'];
function mk(WSB, id, name, domain, cls, paint, extra){ return WSB.create(Object.assign({id:id, name:name, domain:domain, cls:cls, paint:{paint1:paint[0], paint2:paint[1], paint3:paint[2]}}, extra || {})); }
function body4x4(b, o){ /* jeep / humvee shape */
  var hw = o.hw, F = o.F, B = o.B, g = 0.38, belt = o.belt, roof = o.roof, cabF = o.cabF, cabB = o.cabB;
  b.wheels(o.r, 0.28); b.axle(o.fz, {steer:true, track:hw - 0.14, name:'front axle'}); b.axle(o.rz, {driven:true, track:hw - 0.14, name:'rear axle'});
  b.box([hw - 0.55, g, B + 0.1], [hw - 0.42, g + 0.16, F - 0.1], {c:'underside', m:'steel', mx:true, name:'chassis rail'});
  b.box([-hw + 0.1, g + 0.1, B + 0.1], [hw - 0.1, g + 0.24, cabF], {c:'underside', m:'steel', name:'floor pan'});
  b.box([-hw, g + 0.2, B], [hw, belt, F], {c:'paint1', name:'lower body'});
  b.box([-hw + 0.05, belt, cabF], [hw - 0.05, belt + 0.12, F - 0.05], {c:'paint1', name:'hood'});
  b.box([-hw + 0.03, belt, cabF], [hw - 0.03, roof - 0.12, cabF + 0.08], {c:'glass', m:'glass', name:'windscreen'});
  b.box([-hw + 0.03, roof - 0.12, cabB], [hw - 0.03, roof, cabF + 0.12], {c:'paint1', name:'roof'});
  b.box([hw - 0.08, belt, cabB], [hw - 0.03, roof - 0.12, cabF], {c:'paint1', mx:true, name:'cab side'});
  b.box([-hw + 0.03, belt, cabB - 0.05], [hw - 0.03, roof - 0.12, cabB], {c:'paint1', name:'tailgate'});
  b.box([-hw - 0.04, g + 0.1, F - 0.05], [hw + 0.04, g + 0.32, F + 0.12], {c:'paint2', m:'steel', name:'front bumper'});
  b.box([-hw - 0.04, g + 0.1, B - 0.12], [hw + 0.04, g + 0.32, B + 0.05], {c:'paint2', m:'steel', name:'rear bumper'});
  b.box([-0.4, belt - 0.4, F - 0.02], [0.4, belt - 0.05, F + 0.04], {c:'black', m:'plastic', name:'grille'});
  b.box([hw - 0.04, g + 0.3, cabB + 0.1], [hw + 0.2, g + 0.5, cabF - 0.1], {c:'paint2', m:'steel', mx:true, name:'side step'});
  b.door([hw, g + 0.5, cabB + 0.3], [hw + 0.05, roof - 0.14, cabF - 0.3], {c:'paint1', mx:true, hinge:'front', name:'front door'});
  b.light('headlight', [hw - 0.25, belt - 0.2, F + 0.04], [0.22, 0.2, 0.04]); b.light('taillight', [hw - 0.2, belt - 0.1, B], [0.2, 0.14, 0.04]);
  b.seat([0.4, belt - 0.5, cabF - 0.5], {mx:true, name:'front seat'}); b.seat([0, belt - 0.5, cabB + 0.6], {size:[hw*1.5, 0.1, 0.45], name:'back seat'});
  b.engine([0, belt - 0.3, (cabF + F)/2], [hw*1.1, 0.5, Math.max(0.6, F - cabF - 0.2)]); b.tank([0, g + 0.3, B + 0.5], [0.7, 0.25, 0.5]); b.battery([hw - 0.35, belt - 0.2, F - 0.4]);
}
function jeep(WSB){ var b = mk(WSB, 'army_jeep', 'Army jeep', 'land', 'car', OD, {topSpeed:70}); body4x4(b, {hw:0.9, F:1.9, B:-1.7, belt:1.0, roof:1.12, cabF:0.45, cabB:-0.4, fz:1.15, rz:-1.0, r:0.36});
  /* open top: remove nothing, the roof is a thin canvas bow */ b.box([-0.88, 1.0, -1.7], [0.88, 1.12, -1.2], {c:'paint3', m:'cloth', name:'spare wheel mount'}); return b; }
function humvee(WSB){ var b = mk(WSB, 'humvee', 'Humvee', 'land', 'car', SAND, {topSpeed:65}); body4x4(b, {hw:1.1, F:2.3, B:-2.3, belt:1.25, roof:1.95, cabF:0.9, cabB:-1.8, fz:1.45, rz:-1.45, r:0.42});
  b.door([-1.1, 0.9, -0.2], [-1.15, 1.8, 0.6], {c:'paint1', hinge:'front', name:'rear door'}); b.hitch([0, 0.55, -2.4], 'ball');
  b.box([-0.3, 1.95, -0.6], [0.3, 2.1, 0.0], {c:'paint2', m:'steel', name:'gun ring'}); b.box([-0.05, 2.1, -0.7], [0.05, 2.25, 0.4], {c:'paint2', m:'steel', name:'mounted gun'}); return b; }
function cargoTruck(WSB){ var b = mk(WSB, 'army_cargo_truck', 'Army 6x6 cargo truck', 'land', 'truck', OD, {tank:'large', topSpeed:60});
  b.wheels(0.5, 0.3); b.axle(2.6, {steer:true, track:1.0, name:'front axle'}); b.axle(-1.2, {driven:true, track:1.0, name:'rear axle 1'}); b.axle(-2.6, {driven:true, track:1.0, name:'rear axle 2'});
  b.box([0.35, 0.55, -4.0], [0.48, 0.85, 3.5], {c:'underside', m:'steel', mx:true, name:'chassis rail'}); b.box([-0.48, 0.8, -4.0], [0.48, 0.92, 0.4], {c:'underside', m:'steel', name:'subframe'});
  b.box([-1.0, 0.9, 2.4], [1.0, 1.7, 3.5], {c:'paint1', name:'hood'}); b.box([-1.1, 0.9, 0.7], [1.1, 1.6, 2.4], {c:'paint1', name:'cab lower'});
  b.box([-1.1, 1.6, 0.7], [1.1, 2.7, 1.4], {c:'paint1', name:'cab back'}); b.box([-1.05, 1.6, 1.4], [1.05, 2.65, 2.3], {c:'glass', m:'glass', name:'cab glass'}); b.box([-1.1, 2.65, 0.7], [1.1, 2.75, 2.35], {c:'paint1', name:'cab roof'});
  b.door([1.1, 1.0, 1.3], [1.15, 2.6, 2.3], {c:'paint1', mx:true, hinge:'front', name:'cab door'});
  b.box([-1.1, 0.7, 3.5], [1.1, 1.0, 3.7], {c:'paint2', m:'steel', name:'bumper'}); b.box([-0.7, 1.0, 3.5], [0.7, 1.6, 3.55], {c:'black', m:'plastic', name:'grille'});
  b.light('headlight', [0.75, 1.3, 3.57], [0.24, 0.2, 0.04]); b.light('taillight', [1.0, 1.3, -4.05], [0.16, 0.24, 0.04]);
  b.engine([0, 1.3, 2.9], [0.8, 0.6, 1.0]); b.tank([0.8, 0.65, -0.6], [0.4, 0.4, 0.9]); b.battery([0.6, 1.3, 3.2]); b.seat([0.45, 1.15, 1.0], {mx:true, name:'cab seat'});
  b.shell([-1.1, 1.0, -4.0], [1.1, 3.0, 0.5], {open:['back'], c:'paint3', floorC:'#6a5a3e', wall:0.05, floor:0.1, name:'tilt', room:'cargo'});
  b.door([-1.1, 1.0, -4.07], [1.1, 3.0, -4.02], {kind:'roll', c:'paint1', name:'tailgate flap'}); b.box([-1.1, 0.75, -4.2], [1.1, 1.0, -4.0], {c:'underside', m:'steel', name:'rear step'});
  b.hitch([0, 0.7, -4.25], 'pintle'); b.storage([-1.0, 1.02, -3.9], [1.0, 2.2, -2.0], 'load'); return b; }
function apc(WSB){ var b = mk(WSB, 'apc_8x8', 'Armoured personnel carrier 8x8', 'land', 'bus', OD, {tank:'large', topSpeed:60});
  b.wheels(0.5, 0.35); [3.0, 1.0, -1.0, -3.0].forEach(function(z, i){ b.axle(z, {steer:i < 2, driven:true, track:1.2, name:'axle ' + (i + 1)}); });
  b.box([-1.3, 0.55, -4.4], [1.3, 0.75, 4.4], {c:'underside', m:'steel', name:'hull floor'});
  /* armoured hull: sloped nose, box body */
  b.block('wedge', [0, 1.2, 4.2], [2.6, 1.0, 1.1], {c:'paint1', m:'steel', name:'glacis'}); b.box([-1.3, 0.75, 3.0], [1.3, 1.7, 3.7], {c:'paint1', m:'steel', name:'nose block'});
  b.box([-1.3, 1.7, 1.8], [1.3, 2.3, 3.0], {c:'paint1', m:'steel', name:'driver hump'}); b.box([-0.9, 1.9, 3.0], [0.9, 2.1, 3.1], {c:'glass', m:'glass', name:'driver visor'});
  b.shell([-1.3, 0.8, -4.4], [1.3, 2.45, 1.8], {open:['back'], c:'paint1', m:'steel', floorC:'underside', wall:0.1, floor:0.1, name:'troop bay', room:'troop bay'});
  b.door([-1.3, 0.8, -4.55], [1.3, 2.45, -4.5], {kind:'ramp', c:'paint1', name:'rear ramp'});
  b.box([-0.5, 2.45, -1.0], [0.5, 2.55, 1.4], {c:'paint1', m:'steel', name:'roof hatch plate'}); b.box([-0.35, 2.55, -0.2], [0.35, 3.0, 0.6], {c:'paint1', m:'steel', name:'turret'}); b.box([-0.05, 2.7, 0.6], [0.05, 2.8, 2.2], {c:'black', m:'steel', name:'autocannon'});
  b.light('headlight', [1.0, 1.0, 3.72], [0.2, 0.16, 0.04]); b.light('taillight', [1.1, 1.2, -4.58], [0.16, 0.2, 0.04]);
  b.engine([0, 1.2, 2.4], [1.2, 0.7, 0.8]); b.tank([-1.0, 0.95, 0.5], [0.4, 0.3, 1.2]); b.battery([0.8, 1.3, 2.6]);
  b.seat([0.55, 0.81, 2.4], {name:'driver seat'}); [0.8, -0.2, -1.2, -2.2, -3.2].forEach(function(z){ b.seat([1.0, 0.9, z], {size:[0.4, 0.08, 0.45], name:'bench'}); b.seat([-1.0, 0.9, z], {size:[0.4, 0.08, 0.45], name:'bench'}); }); return b; }
function armouredCar(WSB){ var b = mk(WSB, 'armoured_car', 'Armoured car', 'land', 'car', SAND, {topSpeed:80});
  b.wheels(0.45, 0.3); b.axle(1.7, {steer:true, track:1.05, name:'front axle'}); b.axle(-1.7, {driven:true, track:1.05, name:'rear axle'});
  b.box([-1.15, 0.5, -2.8], [1.15, 0.7, 2.8], {c:'underside', m:'steel', name:'hull floor'}); b.box([-1.2, 0.7, -2.8], [1.2, 1.5, 2.4], {c:'paint1', m:'steel', name:'hull'}); b.block('wedge', [0, 1.1, 2.7], [2.4, 0.8, 0.6], {c:'paint1', m:'steel', name:'bonnet slope'});
  b.box([-1.1, 1.5, -2.4], [1.1, 2.1, 1.0], {c:'paint1', m:'steel', name:'cabin'}); b.box([-1.0, 1.7, 1.0], [1.0, 2.0, 1.08], {c:'glass', m:'glass', name:'windscreen'}); b.box([-0.9, 2.1, -1.0], [0.9, 2.18, 0.8], {c:'paint1', m:'steel', name:'roof'});
  b.door([1.2, 0.8, 0.0], [1.26, 1.95, 0.9], {mx:true, hinge:'front', c:'paint1', name:'door'});
  b.light('headlight', [0.9, 1.0, 3.0], [0.2, 0.16, 0.04]); b.light('taillight', [1.0, 1.1, -2.8], [0.16, 0.2, 0.04]);
  b.engine([0, 1.1, 2.0], [1.0, 0.6, 0.8]); b.tank([0, 0.8, -1.8], [0.8, 0.3, 0.6]); b.battery([0.8, 1.2, 2.2]); b.seat([0.45, 0.85, 0.4], {mx:true, name:'front seat'}); b.seat([0, 0.85, -0.8], {size:[1.6, 0.1, 0.45], name:'bench'}); return b; }
function ammoTrailer(WSB){ var b = mk(WSB, 'ammo_trailer', 'Ammo trailer', 'land', 'trailer', OD, {topSpeed:50});
  b.wheels(0.4, 0.26); b.axle(-0.6, {driven:false, track:0.85, name:'trailer axle'});
  b.box([-0.95, 0.6, -1.9], [0.95, 0.72, 1.6], {c:'underside', m:'steel', name:'bed'});
  b.shell([-0.95, 0.72, -1.9], [0.95, 1.9, 1.3], {open:['back'], c:'paint1', m:'steel', floorC:'underside', wall:0.05, floor:0.08, name:'box', room:'box'}); b.door([-0.95, 0.72, -1.97], [0.95, 1.9, -1.92], {kind:'swing', hinge:'outer', c:'paint1', name:'rear doors'});
  b.box([-0.05, 0.62, 1.3], [0.05, 0.72, 2.6], {c:'underside', m:'steel', name:'drawbar'}); b.coupler([0, 0.67, 2.62], 'tongue'); b.storage([-0.8, 0.8, -1.8], [0.8, 1.6, 0.8], 'crates'); return b; }
function patrolBoat(WSB){ var b = mk(WSB, 'patrol_boat', 'Patrol boat', 'water', 'motorboat', ['#7a8088', '#2b2d26', '#5a5a52']);
  b.box([-1.2, 0, -4.0], [1.2, 0.08, 4.0], {c:'paint1', m:'sheet', name:'bottom'}); b.box([1.15, 0, -4.0], [1.25, 1.0, 4.0], {c:'paint1', m:'sheet', mx:true, name:'side'}); b.block('wedge', [0, 0.5, 4.5], [2.4, 1.0, 1.0], {c:'paint1', m:'sheet', name:'bow'}); b.box([-1.25, 0, -4.08], [1.25, 1.0, -4.0], {c:'paint1', m:'sheet', name:'transom'});
  b.hull([-1.15, 0, -4.0], [1.15, 1.0, 4.6]); b.box([-1.15, 1.0, -4.0], [1.15, 1.06, 4.0], {c:'paint2', name:'deck'});
  b.box([-1.0, 1.06, -1.2], [1.0, 2.3, 1.2], {c:'paint1', name:'wheelhouse'}); b.box([-0.95, 1.6, 1.2], [0.95, 2.1, 1.26], {c:'glass', m:'glass', name:'bridge glass'}); b.box([-1.05, 2.3, -1.3], [1.05, 2.38, 1.3], {c:'paint2', name:'bridge roof'});
  b.box([-0.05, 1.06, 2.6], [0.05, 1.5, 2.7], {c:'paint2', m:'steel', name:'gun mount post'}); b.box([-0.05, 1.5, 2.5], [0.05, 1.6, 3.3], {c:'black', m:'steel', name:'bow gun'});
  b.seat([0.5, 1.1, 0.6], {name:'helm seat'}); b.seat([0, 1.085, -2.0], {size:[1.8, 0.05, 0.4], c:'paint2', name:'crew bench'});
  b.outboard([-0.6, 0.9, -4.08], {height:1.2}); b.outboard([0.6, 0.9, -4.08], {height:1.2}); b.tank([0, 0.3, -2.5], [0.8, 0.3, 0.6]); return b; }
function transportHeli(WSB){ var b = mk(WSB, 'transport_heli', 'Transport helicopter', 'air', 'heli', OD);
  b.box([-1.1, 0.7, -2.6], [1.1, 0.82, 2.4], {c:'underside', m:'steel', name:'floor'}); b.box([-1.1, 0.82, 0.8], [1.1, 2.7, 2.4], {c:'paint1', name:'cockpit'}); b.box([-1.0, 1.5, 2.4], [1.0, 2.6, 3.0], {c:'glass', m:'glass', name:'nose glass'});
  b.box([-1.1, 2.7, -2.6], [1.1, 2.8, 2.4], {c:'paint1', name:'roof'}); b.box([-1.1, 0.82, -2.7], [1.1, 2.7, -2.6], {c:'paint1', name:'cabin back'}); b.box([1.1, 0.82, 0.8], [1.15, 2.7, 2.4], {c:'paint1', mx:true, name:'pilot side'});
  b.room([-1.08, 0.82, -2.6], [1.08, 2.7, 0.8], 'troop cabin'); b.door([1.12, 0.82, -2.6], [1.18, 2.65, 0.8], {kind:'slide', c:'paint1', mx:true, name:'cabin door'});
  b.box([-0.6, 2.8, -2.2], [0.6, 3.3, 0.6], {c:'paint1', name:'engine cowl'}); b.box([-0.25, 1.9, -8.0], [0.25, 2.5, -2.6], {c:'paint1', name:'tail boom'}); b.box([-0.05, 2.2, -8.3], [0.05, 3.5, -7.6], {c:'paint1', name:'fin'});
  b.box([-0.12, 3.3, -0.4], [0.12, 3.6, -0.1], {c:'underside', m:'steel', name:'mast'}); b.rotor([0, 3.65, -0.25], 7.2, {blades:4}); b.tailRotor([0.09, 3.1, -8.0], 0.9);
  b.skid([0.8, 0, -2.2], [0.9, 0.1, 2.4], {mx:true, name:'skid'}); b.box([0.8, 0.1, -1.4], [0.9, 0.7, -1.3], {c:'underside', m:'steel', mx:true, name:'skid strut'}); b.box([0.8, 0.1, 1.4], [0.9, 0.7, 1.5], {c:'underside', m:'steel', mx:true, name:'skid strut'});
  b.seat([0.5, 0.88, 1.6], {mx:true, name:'pilot seat'}); b.seat([0, 0.88, -0.7], {size:[2.0, 0.1, 0.4], name:'troop bench'}); b.seat([0, 0.88, -2.0], {size:[2.0, 0.1, 0.4], name:'rear bench'});
  b.engine([0, 2.7, -0.8], [0.9, 0.5, 1.2]); b.tank([0, 0.62, 0], [1.4, 0.1, 1.0]); return b; }
module.exports = function(WSB){ return [jeep, humvee, cargoTruck, apc, armouredCar, ammoTrailer, patrolBoat, transportHeli].map(function(f){ return f(WSB); }); };
