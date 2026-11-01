/* A 26 ft box truck you can walk into: roll-up door at the back, a 7 ft tall cargo box on a wooden floor, cab doors that swing.
   Big enough to live in: the cargo box is a mobile base. Remake of the stock box_truck with working parts. */
module.exports = function(WSB){
  var b = WSB.create({id:'box_truck_walkin', name:'Box truck (walk-in)', domain:'land', cls:'truck', paint:{paint1:'#e8e4da', paint2:'#2f5f8a', paint3:'#3a3a3a'}, tank:'large', topSpeed:70});
  b.wheels(0.42, 0.28);
  b.axle(2.05, {steer:true, name:'front axle'});
  b.axle(-1.9, {driven:true, track:0.9, name:'rear axle'});
  /* chassis: two rails and a subframe the box sits on */
  b.box([0.34, 0.5, -3.85], [0.46, 0.78, 2.9], {c:'underside', m:'steel', mx:true, name:'chassis rail'});
  b.box([-0.46, 0.78, -3.85], [0.46, 0.92, 0.45], {c:'underside', m:'steel', name:'subframe'});
  /* cab */
  b.box([-0.95, 0.78, 2.2], [0.95, 1.45, 3.15], {c:'paint2', name:'hood'});
  b.box([-1.05, 0.78, 0.6], [1.05, 1.45, 2.2], {c:'paint2', name:'cab lower'});
  b.box([-1.05, 1.45, 0.6], [1.05, 2.55, 1.35], {c:'paint2', name:'cab back'});
  b.box([-1.0, 1.45, 1.35], [1.0, 2.5, 2.1], {c:'glass', m:'glass', name:'cab glass'});
  b.box([-1.05, 2.5, 0.6], [1.05, 2.6, 2.15], {c:'paint2', name:'cab roof'});
  b.door([1.05, 0.95, 1.2], [1.1, 2.45, 2.15], {c:'paint2', mx:true, hinge:'front', name:'cab door'});
  b.box([-1.1, 0.55, 3.15], [1.1, 0.8, 3.3], {c:'chrome', m:'chrome', name:'bumper'});
  b.box([-0.7, 0.85, 3.15], [0.7, 1.4, 3.2], {c:'black', m:'plastic', name:'grille'});
  b.light('headlight', [0.78, 1.15, 3.17], [0.24, 0.18, 0.04]);
  b.light('taillight', [1.0, 1.25, -3.9], [0.16, 0.24, 0.04]);
  b.engine([0, 1.1, 2.6], [0.8, 0.55, 0.9]); b.tank([0.8, 0.55, -0.5], [0.4, 0.4, 0.8]); b.battery([0.6, 1.2, 2.9]);
  b.seat([0.45, 1.05, 1.0], {mx:true, name:'cab seat'});
  /* the cargo box: open at the back, a roll-up door closes it */
  b.shell([-1.12, 1.0, -3.85], [1.12, 3.0, 0.45], {open:['back'], c:'paint1', floorC:'#8a6a48', wall:0.05, floor:0.08, name:'cargo box', room:'cargo'});
  b.door([-1.12, 1.0, -3.92], [1.12, 3.0, -3.87], {kind:'roll', c:'paint1', name:'roll-up door'});
  b.box([-1.15, 0.72, -4.05], [1.15, 0.92, -3.85], {c:'underside', m:'steel', name:'rear step'});
  b.storage([-1.0, 1.02, -0.5], [1.0, 2.2, 0.4], 'shelving');
  return b;
};
