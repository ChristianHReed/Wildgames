/* Builds packs/workshop-props-sample.js: two non-car assets made with the Workshop engine (a new workbench, and a changed copy of a stock model),
   to prove the generic path: Workshop design -> version 2 pack -> packload.js -> SHAPED. Run: node workshop/tools/make_props_sample.js */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); require(root + 'assets/shaped/digging.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'workshop-props-sample', name:'Workshop props sample', author:'AfterStreet Workshop sample', notes:'A new workbench and a taller sandbag wall, made headlessly with the Workshop engine.'});

/* 1. a new piece of furniture: a workbench with a vise */
var d = M.newModelDoc('furniture', 'props', 'furniture', 'ozark_workbench');
d.name = 'Ozark workbench'; d.notes = 'A heavy plank bench with a steel vise and a lower shelf.';
function add(shape, pos, o){ var p = M.addPiece(d, shape, pos, o); p.g = 'body'; return p; }
add('box', [0, 0.88, 0], {d:[1.6, 0.08, 0.7], c:'wood', m:'wood', name:'top'});
add('box', [0.72, 0.4, 0.28], {d:[0.1, 0.8, 0.1], c:'woodD', m:'wood', mx:true, mz:true, name:'legs'});
add('box', [0, 0.25, 0], {d:[1.4, 0.04, 0.5], c:'woodD', m:'wood', name:'lower shelf'});
add('box', [0.55, 1.0, 0.35], {d:[0.12, 0.16, 0.06], c:'steel', m:'steel', name:'vise jaw'});
add('box', [0.55, 0.96, 0.25], {d:[0.1, 0.1, 0.3], c:'steelD', m:'steel', name:'vise screw'});
add('cyl', [0.8, 0.96, 0.35], {d:[0.05, 0.05, 0.05], c:'steelD', m:'steel', ax:'y', name:'vise handle knob'});
M.addPoint(d, 'sit_side', 'sit', [0, 0.45, 0.6], [0, 0, -1]);
d.extra = [{path:['furnitureSize', 'ozark_workbench'], value:['large', 45]}];
M.addModelToPack(pack, d);

/* 2. a stock model, changed: open the sandbag wall, add a second course, save it as a new model beside it (an asset opened from a stock model and saved with its own name; keep `from` to replace the stock one instead) */
var w = M.importModel(SHAPED, 'digging', 'digging', 'sandbag_wall');
w.id = 'sandbag_wall_tall'; w.target.name = 'sandbag_wall_tall'; delete w.from; w.name = 'Sandbag wall (taller)'; w.notes = 'The stock wall with a third course on top.';
var top = 0; w.pieces.forEach(function(p){ var b = M.boundsOf(M.toNative(p)); if (b.ok) top = Math.max(top, b.mx[1]); });
w.pieces.slice().filter(function(p){ var b = M.boundsOf(M.toNative(p)); return b.ok && b.mx[1] > top - 0.2; }).forEach(function(p){ var q = JSON.parse(JSON.stringify(p)); q.id = M.newId(w); q.pos[1] += 0.2; w.pieces.push(q); });
M.addModelToPack(pack, w);

fs.writeFileSync(root + 'packs/workshop-props-sample.js', M.packToJS(pack));
console.log('wrote packs/workshop-props-sample.js:', pack.assets.map(function(a){ return a.target.pack + '.' + a.target.group + '.' + a.target.name + ' (' + a.mode + ', ' + a.stats.total + ' triangles)'; }).join('; '));
