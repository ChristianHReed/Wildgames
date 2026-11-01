/* A 36 ft pontoon houseboat: two pontoons, a deck, a cabin you walk into through doors at both ends. Lives on the water as a
   mobile base. */
module.exports = function(WSB){
  var b = WSB.create({id:'houseboat_ws', name:'Houseboat (Workshop)', domain:'water', cls:'houseboat', paint:{paint1:'#e6e0d2', paint2:'#3e6a7a', paint3:'#7a5a3a'}});
  [-1.25, 1.25].forEach(function(x){ b.block('tube', [x, 0.38, 0], [0.7, 0.7, 10.6], {c:'chrome', m:'steel', ax:'z', name:'pontoon'}); b.hull([x - 0.35, 0, -5.3], [x + 0.35, 0.7, 5.3]); });
  b.box([-1.7, 0.7, -5.4], [1.7, 0.82, 5.4], {c:'paint3', m:'wood', name:'deck'});
  b.shell([-1.45, 0.82, -3.6], [1.45, 2.9, 3.4], {open:['front', 'back'], c:'paint1', floorC:'paint3', wall:0.06, floor:0.0001, name:'cabin', room:'cabin'});
  b.box([-1.45, 2.5, 3.4], [1.45, 2.9, 3.46], {c:'paint1', name:'front wall top'});
  b.box([-1.45, 0.82, 3.4], [-0.45, 2.5, 3.46], {c:'paint1', name:'front wall left'});
  b.box([0.45, 0.82, 3.4], [1.45, 2.5, 3.46], {c:'paint1', name:'front wall right'});
  b.door([-0.45, 0.82, 3.46], [0.45, 2.5, 3.5], {hinge:'outer', c:'paint2', name:'front door'});
  b.box([-1.45, 2.5, -3.66], [1.45, 2.9, -3.6], {c:'paint1', name:'back wall top'});
  b.box([-1.45, 0.82, -3.66], [-0.45, 2.5, -3.6], {c:'paint1', name:'back wall left'});
  b.box([0.45, 0.82, -3.66], [1.45, 2.5, -3.6], {c:'paint1', name:'back wall right'});
  b.door([-0.45, 0.82, -3.7], [0.45, 2.5, -3.66], {hinge:'outer', c:'paint2', name:'back door'});
  b.box([1.51, 1.6, -2.5], [1.53, 2.3, 2.5], {c:'glass', m:'glass', mx:true, name:'windows'});
  b.bed([-0.8, 0.95, -2.4], [1.2, 0.25, 1.9], {name:'bunk'});
  b.seat([0.9, 1.25, 2.6], {name:'helm seat'});
  b.box([0.7, 0.82, 2.9], [1.3, 1.6, 3.3], {c:'paint3', m:'wood', fitting:true, name:'helm console'});
  b.box([-1.7, 0.82, 5.3], [1.7, 1.75, 5.4], {c:'chrome', m:'steel', name:'bow rail'});
  b.outboard([0, 0.82, -5.4], {height:1.0});
  b.tank([1.0, 1.0, -3.0], [0.4, 0.3, 0.4]);
  return b;
};
