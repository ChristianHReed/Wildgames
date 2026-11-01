/* A 14 ft aluminium jon boat with a tiller outboard: flat bottom, bench seats, the hull marked so it floats right. */
module.exports = function(WSB){
  var b = WSB.create({id:'jon_boat_ws', name:'Jon boat (Workshop)', domain:'water', cls:'motorboat', paint:{paint1:'#5a6a52', paint2:'#c9c3b6', paint3:'#7a5a3a'}});
  b.box([-0.68, 0, -2.0], [0.68, 0.06, 2.1], {c:'paint1', m:'sheet', name:'bottom'});
  b.box([0.66, 0, -2.0], [0.72, 0.55, 2.1], {c:'paint1', m:'sheet', mx:true, name:'side'});
  b.block('wedge', [0, 0.3, 2.35], [1.44, 0.5, 0.5], {c:'paint1', m:'sheet', name:'bow'});
  b.box([-0.72, 0, -2.06], [0.72, 0.6, -2.0], {c:'paint1', m:'sheet', name:'transom'});
  b.box([0.6, 0.5, -2.0], [0.74, 0.58, 2.1], {c:'paint2', m:'sheet', mx:true, name:'gunwale'});
  b.hull([-0.66, 0.0, -2.0], [0.66, 0.55, 2.3]);
  b.seat([0, 0.38, -1.5], {size:[1.32, 0.05, 0.3], c:'paint3', name:'stern seat'});
  b.seat([0, 0.38, 0.1], {size:[1.32, 0.05, 0.3], c:'paint3', name:'middle seat'});
  b.seat([0, 0.38, 1.4], {size:[1.32, 0.05, 0.3], c:'paint3', name:'bow seat'});
  b.outboard([0, 0.45, -2.06], {height:0.8});
  b.tank([0, 0.18, -1.0], [0.4, 0.25, 0.3]);
  return b;
};
