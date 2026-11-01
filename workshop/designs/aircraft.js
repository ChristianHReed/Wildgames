/* Aircraft beyond the two samples (helicopter.js, bush_plane.js): a gyrocopter and a hot-air balloon. */
module.exports = function(WSB){
  var g = WSB.create({id:'gyrocopter_ws', name:'Gyrocopter', domain:'air', cls:'gyro', paint:{paint1:'#c9552e', paint2:'#e8e4da', paint3:'#2a2a2a'}});
  g.wheels(0.2, 0.1); g.axle(1.0, {steer:true, track:0.08, name:'nose gear'}); g.axle(-0.4, {track:0.6, name:'main gear'});
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
  return [g];
};
