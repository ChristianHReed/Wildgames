/* A high-wing bush plane: wing above the cabin, prop at the nose, tail with elevator and rudder, wheels on two axles
   (a steering nose wheel and the main gear). */
var AK = require('./parts/air_kit.js'), AH = require('./refs.js').H, aq = AH.quad, ADK = AH.DK, ARED = AH.RED;
module.exports = function(WSB){
  var b = WSB.create({id:'bush_plane', name:'Bush plane', domain:'air', cls:'plane', paint:{paint1:'#c8a030', paint2:'#e8e2d6', paint3:'#2a2a2a'}});
  b.wheels(0.25, 0.14); AH.wheelLook(b, 0.25, 0.14);
  b.axle(1.7, {steer:true, track:0.12, name:'nose gear'});
  b.axle(-0.1, {track:0.85, name:'main gear'});
  /* body: one lofted skin, nose cowl to tail (flat quads between rings); glass and door sit proud on the flat sides */
  AK.tube(b, [[-3.55, 1.52, 0.07, 0.11], [-2.9, 1.40, 0.19, 0.26], [-2.0, 1.28, 0.34, 0.42], [-0.9, 1.17, 0.53, 0.61], [0.4, 1.15, 0.575, 0.62], [1.3, 1.15, 0.575, 0.62], [1.7, 1.14, 0.49, 0.53], [2.05, 1.13, 0.37, 0.40], [2.18, 1.13, 0.29, 0.31]], {c:'paint1', name:'fuselage'});
  /* the wing: tapered, flat-bottomed airfoil, slightly rising tips; the strut braces it to the body */
  AK.wing(b, {span:12.2, y:1.81, z:1.4, root:1.9, tip:1.35, thick:0.11, rise:0.12, stations:[0, 0.12, 0.55, 1], c:'paint2', name:'wing'});
  b.block('box', [1.62, 1.24, 0.3], [2.3, 0.07, 0.09], {c:'underside', m:'steel', mx:true, rot:[0, 0, 25.5], name:'wing strut'});
  AK.wing(b, {span:3.4, y:1.23, z:-2.8, root:0.62, tip:0.42, thick:0.1, stations:[0, 1], c:'paint2', fn:false, name:'tailplane'});
  b.elevator([-1.7, 1.2, -3.7], [1.7, 1.26, -3.4]);
  AK.slab(b, [[-0.04, 1.45, -2.9], [-0.04, 1.45, -3.5], [-0.04, 2.4, -3.5], [-0.04, 2.4, -3.2]], [0.08, 0, 0], {c:'paint1', name:'fin'});
  b.rudder([-0.035, 1.45, -3.75], [0.035, 2.35, -3.5]);
  b.box([0.575, 1.12, 0.2], [0.6, 1.5, 1.3], {c:'glassL', m:'glass', mx:true, name:'side window'});
  b.door([0.575, 0.84, -0.5], [0.62, 1.48, 0.15], {mx:true, hinge:'front', c:'paint1', name:'cabin door'});
  b.propeller([0, 1.15, 2.21], 0.95);
  b.box([-0.06, 0.25, 1.65], [0.06, 0.65, 1.75], {c:'underside', m:'steel', name:'nose leg'});
  b.box([0.4, 0.25, -0.15], [0.5, 0.6, -0.05], {c:'underside', m:'steel', mx:true, name:'main leg'});
  b.engine([0, 1.15, 1.7], [0.6, 0.55, 0.7]); b.tank([0, 1.8, 0.5], [1.2, 0.08, 0.6]);
  b.seat([0.27, 0.95, 0.6], {mx:true, name:'front seat'}); b.seat([0.27, 0.95, -0.3], {mx:true, name:'back seat'});
  aq(b, [[-0.5, 1.46, 1.3], [0.5, 1.46, 1.3], [0.34, 1.77, 0.95], [-0.34, 1.77, 0.95]], [0, 0.03, 0.03], {c:'glassL', m:'glass', name:'windscreen'});
  b.box([-0.5, 1.4, 1.28], [0.5, 1.48, 1.42], {c:'paint3', m:'plastic', name:'glare shield'});
  b.block('cyl', [0, 1.15, 2.26], [0.28, 0.28, 0.14], {c:'chrome', m:'steel', ax:'z', name:'spinner'});
  b.box([0.575, 0.98, -0.9], [0.595, 1.06, 1.3], {c:'paint3', mx:true, name:'cheat line'});
  b.box([6.0, 1.76, 0.2], [6.15, 1.88, 0.45], {c:'#d2342b', m:'plastic', name:'wing tip light'}); b.box([-6.15, 1.76, 0.2], [-6.0, 1.88, 0.45], {c:'#2f9a55', m:'plastic', name:'wing tip light'});
  [[0.8, 5.9]].forEach(function(f){ b.box([f[0], 1.72, -0.5], [f[1], 1.75, -0.1], {c:'paint3', mx:true, name:'flap'}); });
  b.box([-0.02, 1.75, -1.0], [0.02, 2.25, -0.96], {c:ADK, m:'steel', name:'antenna'});
  b.box([0.2, 0.62, -0.3], [0.62, 0.7, 0.25], {c:ADK, m:'steel', mx:true, name:'step'});
  b.box([-0.06, 0.65, 1.65], [0.06, 0.72, 1.95], {c:ADK, m:'steel', name:'nose gear fork'});
  return b;
};
