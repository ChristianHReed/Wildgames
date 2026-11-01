/* A high-wing bush plane: wing above the cabin, prop at the nose, tail with elevator and rudder, wheels on two axles
   (a steering nose wheel and the main gear). */
module.exports = function(WSB){
  var b = WSB.create({id:'bush_plane', name:'Bush plane', domain:'air', cls:'plane', paint:{paint1:'#c8a030', paint2:'#e8e2d6', paint3:'#2a2a2a'}});
  b.wheels(0.25, 0.14);
  b.axle(1.7, {steer:true, track:0.12, name:'nose gear'});
  b.axle(-0.1, {track:0.85, name:'main gear'});
  b.block('bev', [0, 1.15, 0.4], [1.15, 1.2, 3.6], {c:'paint1', name:'fuselage'});
  b.block('bev', [0, 1.2, -2.4], [0.6, 0.6, 2.4], {c:'paint1', name:'tail cone'});
  b.box([-5.6, 1.75, -0.5], [5.6, 1.87, 1.4], {c:'paint2', fn:'wing', name:'wing'});
  b.box([0.5, 1.2, 0.2], [0.56, 1.75, 0.3], {c:'underside', m:'steel', mx:true, rot:[0, 0, 0], name:'wing strut'});
  b.box([-1.7, 1.2, -3.4], [1.7, 1.27, -2.8], {c:'paint2', name:'tailplane'});
  b.elevator([-1.7, 1.2, -3.7], [1.7, 1.26, -3.4]);
  b.box([-0.04, 1.45, -3.5], [0.04, 2.4, -2.9], {c:'paint1', name:'fin'});
  b.rudder([-0.035, 1.45, -3.75], [0.035, 2.35, -3.5]);
  b.box([0.56, 1.25, 0.2], [0.59, 1.7, 1.3], {c:'glass', m:'glass', mx:true, name:'side window'});
  b.door([0.58, 0.75, -0.5], [0.62, 1.7, 0.15], {mx:true, hinge:'front', c:'paint1', name:'cabin door'});
  b.propeller([0, 1.15, 2.21], 0.95);
  b.box([-0.06, 0.25, 1.65], [0.06, 0.65, 1.75], {c:'underside', m:'steel', name:'nose leg'});
  b.box([0.4, 0.25, -0.15], [0.5, 0.6, -0.05], {c:'underside', m:'steel', mx:true, name:'main leg'});
  b.engine([0, 1.15, 1.7], [0.6, 0.55, 0.7]); b.tank([0, 1.8, 0.5], [1.2, 0.08, 0.6]);
  b.seat([0.27, 0.95, 0.6], {mx:true, name:'front seat'}); b.seat([0.27, 0.95, -0.3], {mx:true, name:'back seat'});
  return b;
};
