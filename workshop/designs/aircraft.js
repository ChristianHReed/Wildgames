/* Aircraft beyond the two samples (helicopter.js, bush_plane.js): a gyrocopter and a hot-air balloon. */
var AK = require('./parts/air_kit.js'), AH = require('./refs.js').H, aq = AH.quad, ADK = AH.DK, ARED = AH.RED;
module.exports = function(WSB){
  var g = WSB.create({id:'gyrocopter_ws', name:'Gyrocopter', domain:'air', cls:'gyro', paint:{paint1:'#c9552e', paint2:'#e8e4da', paint3:'#2a2a2a'}});
  g.wheels(0.2, 0.1); AH.wheelLook(g, 0.2, 0.1); g.axle(1.0, {steer:true, track:0.08, name:'nose gear'}); g.axle(-0.4, {track:0.6, name:'main gear'});
  g.box([-0.08, 0.35, -1.2], [0.08, 0.5, 1.4], {c:'paint1', m:'sheet', name:'keel'});
  AK.tube(g, [[-0.55, 0.72, 0.16, 0.12], [-0.2, 0.72, 0.34, 0.25], [0.3, 0.72, 0.42, 0.28], [0.8, 0.70, 0.38, 0.25], [1.2, 0.66, 0.24, 0.17], [1.38, 0.64, 0.12, 0.09]], {c:'paint1', name:'pod'});
  g.box([-0.06, 0.5, 1.0], [0.06, 0.7, 1.4], {c:'underside', m:'steel', name:'nose leg'});
  g.box([0.2, 0.2, -0.45], [0.3, 0.5, -0.35], {c:'underside', m:'steel', mx:true, name:'main leg'});
  g.box([-0.06, 0.5, -0.3], [0.06, 2.32, -0.2], {c:'underside', m:'steel', name:'mast'});
  g.rotor([0, 2.35, -0.25], 3.6, {blades:2});
  AK.slab(g, [[-0.04, 0.5, -0.95], [-0.04, 0.5, -1.25], [-0.04, 1.3, -1.25], [-0.04, 1.3, -1.1]], [0.08, 0, 0], {c:'paint2', name:'fin'}); g.rudder([-0.04, 0.5, -1.4], [0.04, 1.3, -1.2]);
  AK.wing(g, {span:1.1, y:0.48, z:-1.0, root:0.3, tip:0.22, thick:0.12, fn:false, c:'paint2', name:'tailplane'}); g.elevator([-0.5, 0.45, -1.45], [0.5, 0.52, -1.3]);
  AK.tube(g, [[-0.92, 0.82, 0.1, 0.12], [-0.75, 0.84, 0.19, 0.27], [-0.5, 0.86, 0.2, 0.3], [-0.3, 0.84, 0.14, 0.22]], {c:'paint2', name:'engine cowl'});
  g.propeller([0, 0.95, -0.94], 0.7); g.engine([0, 1.0, -0.6], [0.4, 0.4, 0.5]); g.tank([0, 0.4, 0.2], [0.3, 0.1, 0.3]);
  g.seat([0, 0.55, 0.4], {size:[0.4, 0.08, 0.4], name:'pilot seat'}); g.seat([0, 0.55, -0.15], {size:[0.4, 0.08, 0.3], name:'back seat'});
  aq(g, [[-0.38, 0.95, 0.85], [0.38, 0.95, 0.85], [0.3, 1.3, 0.72], [-0.3, 1.3, 0.72]], [0, 0.0, 0.03], {c:'glassL', m:'glass', name:'windscreen'});
  g.box([-0.3, 0.94, 0.05], [0.3, 0.99, 0.8], {c:'paint2', name:'pod rim'});
  g.box([-0.2, 0.6, -0.2], [0.2, 1.05, -0.08], {c:'paint1', m:'cloth', name:'seat back'});
  g.box([-0.14, 0.95, 0.05], [0.14, 1.0, 0.25], {c:ADK, m:'plastic', name:'instrument pod'});
  g.box([-0.3, 0.38, 0.3], [0.3, 0.5, 1.0], {c:'paint2', name:'pod belly'});
  g.box([-0.04, 1.9, -0.3], [0.04, 2.35, -0.2], {c:ADK, m:'steel', name:'rotor head'});
  g.box([-0.14, 0.3, -0.5], [0.14, 0.5, -0.3], {c:'paint1', m:'sheet', name:'wheel fairing'});
  return [g];
};
