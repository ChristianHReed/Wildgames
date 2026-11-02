/* A 53 ft dry van trailer: a kingpin for the semi's fifth wheel, two axles at the back, barn doors that swing open on their
   outer hinges. Inside: 8 ft 11 in of headroom on a wooden floor, a mobile base on wheels. */
module.exports = function(WSB){
  var b = WSB.create({id:'box_trailer', name:'53 ft box trailer', domain:'land', cls:'trailer', paint:{paint1:'#dcd8ce', paint2:'#9a9a9a', paint3:'#3a3a3a'}});
  b.wheels(0.5, 0.3);
  b.axle(-6.0, {track:1.0, name:'trailer axle 1'});
  b.axle(-7.25, {track:1.0, name:'trailer axle 2'});
  b.shell([-1.24, 1.32, -8.05], [1.24, 4.05, 8.0], {open:['back'], c:'paint1', floorC:'#7a5a3a', wall:0.04, floor:0.08, name:'trailer box', room:'trailer'});
  b.door([0, 1.32, -8.12], [1.24, 4.05, -8.07], {c:'paint1', mx:true, hinge:'outer', name:'barn door'});
  b.box([-0.55, 0.78, -8.05], [0.55, 1.24, -5.4], {c:'underside', m:'steel', name:'slider subframe'});
  b.box([0.3, 1.0, -5.4], [0.42, 1.24, 7.9], {c:'underside', m:'steel', mx:true, name:'main rail'});
  b.box([-1.2, 0.9, -8.2], [1.2, 1.12, -8.05], {c:'underside', m:'steel', name:'underride guard'});
  b.box([0.7, 0.15, 5.0], [0.8, 1.24, 5.15], {c:'underside', m:'steel', mx:true, name:'landing leg'});
  b.coupler([0, 1.18, 7.1], 'kingpin');
  b.light('taillight', [1.05, 1.45, -8.1], [0.16, 0.12, 0.04]);
  return b;
};
