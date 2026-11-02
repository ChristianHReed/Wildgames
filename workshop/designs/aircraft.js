/* Aircraft beyond the two samples (helicopter.js, bush_plane.js): a gyrocopter and a hot-air balloon. */
var AH = require('./refs.js').H, aq = AH.quad, ADK = AH.DK, ARED = AH.RED;
module.exports = function(WSB){
  var g = WSB.create({id:'gyrocopter_ws', name:'Gyrocopter', domain:'air', cls:'gyro', paint:{paint1:'#c9552e', paint2:'#e8e4da', paint3:'#2a2a2a'}});
  g.wheels(0.2, 0.1); AH.wheelLook(g, 0.2, 0.1); g.axle(1.0, {steer:true, track:0.08, name:'nose gear'}); g.axle(-0.4, {track:0.6, name:'main gear'});
  g.box([-0.08, 0.35, -1.2], [0.08, 0.5, 1.4], {c:'paint1', m:'sheet', name:'keel'});
  g.box([-0.4, 0.5, 0.0], [0.4, 0.95, 0.9], {c:'paint1', m:'sheet', name:'pod'});
  g.box([-0.06, 0.5, 1.0], [0.06, 0.7, 1.4], {c:'underside', m:'steel', name:'nose leg'});
  g.box([0.2, 0.2, -0.45], [0.3, 0.5, -0.35], {c:'underside', m:'steel', mx:true, name:'main leg'});
  g.box([-0.06, 0.5, -0.3], [0.06, 2.32, -0.2], {c:'underside', m:'steel', name:'mast'});
  g.rotor([0, 2.35, -0.25], 3.6, {blades:2});
  g.box([-0.06, 0.5, -1.2], [0.06, 1.3, -1.1], {c:'paint2', name:'fin'}); g.rudder([-0.04, 0.5, -1.4], [0.04, 1.3, -1.2]);
  g.box([-0.5, 0.45, -1.3], [0.5, 0.52, -1.0], {c:'paint2', name:'tailplane'}); g.elevator([-0.5, 0.45, -1.45], [0.5, 0.52, -1.3]);
  g.box([-0.2, 0.5, -0.9], [0.2, 1.2, -0.3], {c:'underside', m:'steel', name:'engine block'});
  g.propeller([0, 0.95, -0.94], 0.7); g.engine([0, 1.0, -0.6], [0.4, 0.4, 0.5]); g.tank([0, 0.4, 0.2], [0.3, 0.1, 0.3]);
  g.seat([0, 0.55, 0.4], {size:[0.4, 0.08, 0.4], name:'pilot seat'}); g.seat([0, 0.55, -0.15], {size:[0.4, 0.08, 0.3], name:'back seat'});
  aq(g, [[-0.38, 0.95, 0.85], [0.38, 0.95, 0.85], [0.3, 1.3, 0.72], [-0.3, 1.3, 0.72]], [0, 0.0, 0.03], {c:'glassL', m:'glass', name:'windscreen'});
  g.box([-0.42, 0.9, 0.0], [0.42, 0.97, 0.9], {c:'paint2', name:'pod rim'});
  g.box([-0.2, 0.6, -0.2], [0.2, 1.05, -0.08], {c:'paint1', m:'cloth', name:'seat back'});
  g.box([-0.14, 0.95, 0.05], [0.14, 1.0, 0.25], {c:ADK, m:'plastic', name:'instrument pod'});
  g.box([-0.3, 0.38, 0.3], [0.3, 0.5, 1.0], {c:'paint2', name:'pod belly'});
  g.box([-0.04, 1.9, -0.3], [0.04, 2.35, -0.2], {c:ADK, m:'steel', name:'rotor head'});
  g.box([-0.14, 0.3, -0.5], [0.14, 0.5, -0.3], {c:'paint1', m:'sheet', name:'wheel fairing'});
  return [g];
};
