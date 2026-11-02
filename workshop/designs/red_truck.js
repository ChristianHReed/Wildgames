/* Red work truck: a full-size pickup built with the look rules in docs/VEHICLE_DESIGN_GUIDE.md. Big wheels with close dark arches, high belt and
   chunky nose (tough read), bull bar, side steps, bed rails, a toolbox, a roof light bar and a tow hook. Built on the shared car() builder. */
var CARS = require('./cars.js');
module.exports = function(WSB){
  var S = {name:'Red truck', cls:'pickup', kind:'pickup', front:2.7, back:-3.0, hw:1.0, belt:1.15, hood:1.25, roof:1.85, cabF:1.05, cabB:-0.35, floor:0.66, fz:1.8, rz:-1.6, r:0.5, paint:['#b3261e', '#25272a', '#d4d4cc'], top:60};
  var b = CARS.car(WSB, 'red_truck', S);
  b.doc.id = 'red_truck'; b.doc.name = 'Red truck';
  var hw = S.hw, F = S.front, B = S.back, belt = S.belt, roof = S.roof, bb = S.floor - 0.04, cb = S.cabB;
  b.box([-0.75, bb + 0.2, F - 0.02], [0.75, bb + 0.58, F + 0.12], {c:'paint2', m:'steel', name:'bull bar'});
  b.box([hw + 0.02, bb - 0.05, -0.1], [hw + 0.2, bb + 0.05, 0.9], {c:'paint2', m:'steel', mx:true, name:'side step'});
  b.box([hw - 0.12, belt + 0.1, B], [hw + 0.02, belt + 0.18, cb - 0.05], {c:'paint2', m:'steel', mx:true, name:'bed rail'});
  b.box([-0.5, belt - 0.3, cb - 0.75], [0.5, belt + 0.1, cb - 0.15], {c:'paint2', m:'steel', name:'toolbox'});
  b.box([-0.6, roof, S.cabF - 0.6], [0.6, roof + 0.1, S.cabF - 0.3], {c:'paint2', m:'plastic', name:'light bar'});
  b.box([-0.5, roof + 0.1, S.cabF - 0.56], [-0.1, roof + 0.16, S.cabF - 0.34], {c:'#f2c14e', m:'plastic', name:'light bar lamp'});
  b.box([0.1, roof + 0.1, S.cabF - 0.56], [0.5, roof + 0.16, S.cabF - 0.34], {c:'#f2c14e', m:'plastic', name:'light bar lamp'});
  b.hitch([0, 0.6, B - 0.1], 'ball');
  return [b];
};
