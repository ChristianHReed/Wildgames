/* Builds packs/workshop-sample.js: a car made only from Workshop shapes, to show and test the whole path
   (shapes -> pack -> packload.js -> the game's tables). Run: node workshop/tools/make_sample.js */
global.window = global;
var root = __dirname + '/../../';
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); global.WSM = M;
var D = require(root + 'workshop/damage.js'); D.setModel(M);
var fs = require('fs');

var doc = M.blankDoc();
doc.id = 'ozark_rambler'; doc.name = 'Ozark Rambler'; doc.author = 'AfterStreet Workshop sample'; doc.cls = 'car';
doc.notes = 'A 1970s wood-panelled family wagon, built from Workshop shapes only.';
doc.paint = {paint1:'#7d8a6a', paint2:'#e2ddd2', paint3:'#3e5a7a'};
doc.setup = {wheelR:0.33, wheelW:0.21, track:0.79, axles:[1.45, -1.5], archClear:0.12, bed:null, tank:'large', topSpeed:80};
doc.pieces = M.makeWheel(doc, 0.33, 0.21);
function add(s, pos, o){ return M.addPiece(doc, s, pos, o); }
var W = '#8a5a34';   /* the wood panel, our own colour */
doc.colours[M.customName(W)] = W;
/* body: a long low tub, the bonnet on top of its front, a glass greenhouse, a two-tone roof */
add('box', [0, 0.57, -0.02], {d:[1.76, 0.44, 4.56], c:'paint1', name:'lower body'});
add('box', [0, 0.33, 0], {d:[1.5, 0.08, 4.2], c:'underside', m:'steel', name:'underbody'});
add('box', [0, 0.815, 1.55], {d:[1.66, 0.05, 1.28], c:'paint1', g:'bonnet', name:'bonnet'});
add('wedge', [0, 1.045, 0.64], {d:[1.58, 0.5, 0.56], rot:[0, 180, 0], c:'glass', name:'windscreen'});
add('box', [0, 1.045, -0.83], {d:[1.6, 0.5, 2.38], c:'glass', name:'cabin glass'});
add('box', [0, 1.325, -0.66], {d:[1.62, 0.06, 2.64], c:'paint2', name:'roof'});
add('box', [0.79, 1.045, 0.5], {d:[0.05, 0.5, 0.05], rot:[-28, 0, 0], c:'paint2', mx:true, name:'front pillar'});
add('box', [0.8, 1.045, -0.45], {d:[0.06, 0.5, 0.08], c:'paint2', mx:true, name:'middle pillar'});
add('box', [0.8, 1.045, -1.98], {d:[0.06, 0.5, 0.12], c:'paint2', mx:true, name:'back pillar'});
add('box', [0, 1.045, -2.0], {d:[1.56, 0.5, 0.05], c:'glass', g:'boot', name:'tailgate glass'});
/* bumpers, lamps, grille */
add('bev', [0, 0.43, 2.32], {d:[1.84, 0.13, 0.12], c:'chrome', name:'front bumper'});
add('bev', [0, 0.43, -2.34], {d:[1.84, 0.13, 0.12], c:'chrome', name:'rear bumper'});
add('box', [0, 0.63, 2.265], {d:[0.86, 0.2, 0.03], c:'black', m:'plastic', name:'grille'});
add('cyl', [0.64, 0.63, 2.268], {d:[0.19, 0.19, 0.04], ax:'z', c:'head', mx:true, fn:'headlight', name:'headlight'});
add('box', [0.7, 0.66, -2.31], {d:[0.24, 0.13, 0.03], c:'tail', mx:true, fn:'taillight', name:'tail light'});
add('plate', [0, 0.53, -2.315], {v:[[-0.16,-0.075,0],[0.16,-0.075,0],[0.16,0.075,0],[-0.16,0.075,0]], n:[0,0,1], rot:[0, 180, 0], c:'plateW', m:'plastic', name:'number plate'});
/* the wood panels down each side, with dark wheel arches cut over them */
add('box', [0.885, 0.6, -0.32], {d:[0.02, 0.24, 3.3], c:M.customName(W), m:'wood', mx:true, name:'wood panel'});
add('box', [0.885, 0.6, 1.45], {d:[0.025, 0.32, 0.86], c:'black', m:'plastic', mx:true, name:'front arch'});
add('box', [0.885, 0.6, -1.5], {d:[0.025, 0.32, 0.86], c:'black', m:'plastic', mx:true, name:'rear arch'});
/* door handles and mirrors */
add('box', [0.9, 0.74, 0.0], {d:[0.02, 0.03, 0.13], c:'chrome', mx:true, name:'front door handle'});
add('box', [0.9, 0.74, -0.95], {d:[0.02, 0.03, 0.13], c:'chrome', mx:true, name:'back door handle'});
add('bev', [0.93, 0.93, 0.42], {d:[0.12, 0.1, 0.06], c:'black', m:'plastic', mx:true, name:'mirror'});
/* roof rack: two bars and a rail each side */
add('tube', [0, 1.39, -0.1], {ax:'x', r:[[-0.78,0,0,0.022,0.022],[0.78,0,0,0.022,0.022]], c:'metal', m:'steel', name:'rack bar'});
add('tube', [0, 1.39, -1.4], {ax:'x', r:[[-0.78,0,0,0.022,0.022],[0.78,0,0,0.022,0.022]], c:'metal', m:'steel', name:'rack bar'});
add('box', [0.72, 1.37, -0.75], {d:[0.04, 0.04, 2.3], c:'metal', m:'steel', mx:true, name:'roof rail'});
/* inside parts: what makes it work */
add('box', [0.38, 0.62, -0.15], {d:[0.5, 0.1, 0.5], c:'seat', m:'cloth', fn:'seat', mx:true, hidden:true, name:'front seat'});
add('box', [0.38, 0.62, -1.05], {d:[0.5, 0.1, 0.5], c:'seat', m:'cloth', fn:'seat', mx:true, hidden:true, name:'back seat'});
add('box', [0, 0.85, -1.7], {d:[1.3, 0.1, 0.6], c:'seat', m:'cloth', fn:'sleep', hidden:true, name:'fold-flat load floor'});
add('box', [0, 0.55, 1.55], {d:[0.7, 0.4, 0.8], c:'underside', m:'steel', fn:'engine', hidden:true, name:'engine'});
add('box', [0.5, 0.65, 1.95], {d:[0.25, 0.18, 0.18], c:'black', m:'plastic', fn:'battery', hidden:true, name:'battery'});
add('box', [0, 0.35, -1.9], {d:[0.7, 0.18, 0.4], c:'underside', m:'steel', fn:'tank', hidden:true, name:'fuel tank'});
add('box', [0, 1.0, -1.65], {d:[1.4, 0.45, 0.7], c:'underside', m:'steel', fn:'storage', hidden:true, name:'load space'});

var A = M.buildAsset(doc, D), pk = M.newPack({id:'workshop-sample', name:'Workshop sample', author:'AfterStreet Workshop', licence:'MIT',
  notes:'One car built from Workshop shapes, to test packs end to end. Open it in workshop.html (Designs, Import a pack file) to see how it is made.'});
pk.assets.push(A);
pk.prefabs.push(M.makePrefab(doc, doc.pieces.filter(function(p){ return /headlight|grille/.test(p.name || ''); }).map(function(p){ return p.id; }), 'Round headlights and grille'));
fs.writeFileSync(root + 'packs/workshop-sample.js', M.packToJS(pk));
console.log('wrote packs/workshop-sample.js', Math.round(M.packToJS(pk).length/1024) + ' KB', JSON.stringify(A.game), JSON.stringify(A.stats), JSON.stringify(M.check(doc, A)));
