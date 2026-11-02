/* A day-cab semi tractor with a sleeper: three axles (steer, two driven), a fifth wheel to pull the box trailer. */
module.exports = function(WSB){
  var b = WSB.create({id:'semi_tractor', name:'Semi tractor', domain:'land', cls:'semi', paint:{paint1:'#8a1f1f', paint2:'#c9c3b6', paint3:'#2a2a2a'}, tank:'large', topSpeed:70});
  b.wheels(0.5, 0.3);
  b.axle(3.2, {steer:true, track:1.0, name:'steer axle'});
  b.axle(-0.2, {driven:true, track:0.95, name:'drive axle 1'});
  b.axle(-1.5, {driven:true, track:0.95, name:'drive axle 2'});
  b.box([0.36, 0.6, -2.3], [0.5, 0.95, 4.4], {c:'underside', m:'steel', mx:true, name:'frame rail'});
  b.box([-0.36, 0.7, -2.3], [0.36, 0.95, 4.4], {c:'underside', m:'steel', name:'cross members'});
  b.hitch([0, 1.06, -0.85], 'fifth');
  b.box([-0.5, 0.95, -1.3], [0.5, 1.0, -0.4], {c:'underside', m:'steel', name:'fifth wheel plate'});
  b.box([-1.0, 0.95, 3.4], [1.0, 1.95, 5.1], {c:'paint1', name:'hood'});
  b.box([-1.25, 0.95, 1.6], [1.25, 1.9, 3.4], {c:'paint1', name:'cab lower'});
  b.box([-1.2, 1.9, 3.26], [1.2, 2.8, 3.3], {c:'glass', m:'glass', name:'windscreen'}); b.box([1.16, 1.9, 2.5], [1.2, 2.8, 3.26], {c:'glass', m:'glass', mx:true, name:'side glass'});
  b.box([-1.25, 1.9, 1.6], [1.25, 3.2, 2.5], {c:'paint1', name:'cab upper'});
  b.box([-1.25, 2.8, 2.5], [1.25, 3.2, 3.35], {c:'paint1', name:'cab roof'});
  b.box([-1.25, 0.95, 0.4], [1.25, 3.2, 1.6], {c:'paint1', name:'sleeper'});
  b.door([1.25, 1.05, 2.1], [1.3, 2.75, 3.25], {c:'paint1', mx:true, hinge:'front', name:'cab door'});
  b.box([-1.25, 0.6, 5.1], [1.25, 0.95, 5.3], {c:'chrome', m:'chrome', name:'bumper'});
  b.box([-0.8, 1.0, 5.1], [0.8, 1.9, 5.15], {c:'chrome', m:'chrome', name:'grille'});
  b.block('cyl', [1.15, 2.6, 0.33], [0.14, 2.2, 0.14], {c:'chrome', m:'chrome', mx:true, name:'exhaust stack'});
  b.box([0.5, 0.65, 0.5], [1.05, 1.15, 1.6], {c:'chrome', m:'chrome', mx:true, name:'fuel tank'});
  b.light('headlight', [0.95, 1.3, 5.12], [0.26, 0.2, 0.04]);
  b.light('taillight', [0.45, 0.8, -2.32], [0.16, 0.12, 0.04]);
  b.engine([0, 1.4, 4.2], [0.9, 0.7, 1.2]); b.tank([0.78, 0.9, 1.05], [0.5, 0.45, 1.0]); b.battery([0.7, 0.8, 0.2]);
  b.seat([0.55, 1.4, 2.5], {mx:true, name:'cab seat'});
  b.bed([0, 1.3, 1.0], [2.1, 0.25, 0.9], {name:'sleeper bunk'});
  return b;
};
