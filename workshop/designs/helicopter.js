/* A light utility helicopter: main rotor and tail rotor, skids, sliding cabin doors on both sides and a crouch-in cabin. */
module.exports = function(WSB){
  var b = WSB.create({id:'utility_heli', name:'Utility helicopter', domain:'air', cls:'heli', paint:{paint1:'#3e5a3a', paint2:'#c9c3b6', paint3:'#2a2a2a'}});
  b.box([-0.8, 0.5, -1.2], [0.8, 0.65, 1.4], {c:'underside', m:'sheet', name:'floor'});
  b.box([-0.8, 0.65, 0.3], [0.8, 1.95, 1.4], {c:'paint1', m:'sheet', name:'cockpit'});
  b.box([-0.75, 1.0, 1.91], [0.75, 1.9, 1.95], {c:'glass', m:'glass', name:'nose glass'}); b.box([0.71, 1.0, 1.4], [0.75, 1.9, 1.91], {c:'glass', m:'glass', mx:true, name:'nose side glass'});
  b.box([-0.8, 1.95, -1.2], [0.8, 2.05, 1.4], {c:'paint1', m:'sheet', name:'roof'});
  b.box([-0.8, 0.65, -1.3], [0.8, 1.95, -1.2], {c:'paint1', m:'sheet', name:'cabin back'});
  b.box([0.8, 0.65, 0.3], [0.85, 1.95, 1.4], {c:'paint1', m:'sheet', mx:true, name:'pilot side'});
  b.room([-0.78, 0.65, -1.2], [0.78, 1.95, 0.3], 'cabin');
  b.door([0.82, 0.65, -1.2], [0.86, 1.9, 0.3], {kind:'slide', c:'paint1', mx:true, name:'cabin door'});
  b.box([-0.45, 2.05, -1.3], [0.45, 2.45, 0.6], {c:'paint1', name:'engine cowl'});
  b.box([-0.2, 1.4, -6.0], [0.2, 1.75, -1.3], {c:'paint1', name:'tail boom'});
  b.box([-0.04, 1.6, -6.3], [0.04, 2.6, -5.8], {c:'paint1', name:'fin'});
  b.block('cyl', [0, 2.6, -0.3], [0.2, 0.3, 0.2], {c:'underside', m:'steel', name:'mast'});
  b.rotor([0, 2.8, -0.3], 5.0, {blades:2});
  b.tailRotor([0.09, 2.2, -6.05], 0.75);
  b.skid([0.6, 0, -1.5], [0.68, 0.08, 1.9], {mx:true, name:'skid'});
  b.box([0.6, 0.08, -0.9], [0.66, 0.5, -0.8], {c:'underside', m:'steel', mx:true, name:'skid strut'});
  b.box([0.6, 0.08, 0.9], [0.66, 0.5, 1.0], {c:'underside', m:'steel', mx:true, name:'skid strut'});
  b.seat([0.35, 0.9, 0.85], {mx:true, name:'pilot seat'});
  b.seat([0, 0.85, -0.95], {size:[1.4, 0.1, 0.4], name:'cabin bench'});
  b.engine([0, 2.25, -0.4], [0.7, 0.35, 1.2]); b.tank([0, 0.55, -0.4], [1.0, 0.1, 0.6]);
  return b;
};
