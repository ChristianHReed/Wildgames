/* Builds packs/afterstreet-fleet.js with the Workshop engine: the city bus (opened from the fleet pack and finished as a working vehicle) and a semi tractor
   with three axles. Run: node workshop/tools/make_fleet.js. The school bus and fire engine are not repeated here: `machines` has them. */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); require(root + 'assets/shaped/fleet.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); global.WSM = M;
var D = require(root + 'workshop/damage.js'); D.setModel(M);
var pack = M.newPack({id:'afterstreet-fleet', name:'AfterStreet fleet: city bus and semi tractor', author:'AfterStreet content chat', licence:'MIT',
  notes:'A 12 m city bus and a three-axle semi tractor, built in the Workshop.'});
var F = SHAPED.fleet, PALETTE = Object.assign({}, SHAPED.props.palette, F.palette);

/* ---- the city bus: the fleet pack's body, with its own colours, wheels at the real track, seats and a rear engine ---- */
var shim = {models:{vehicles:F.models.vehicles}, vehicleSpec:F.vehicleSpec, palette:PALETTE};
var bus = M.fromStock(shim, 'city_bus');
bus.id = 'city_bus'; bus.name = 'City bus'; bus.author = 'AfterStreet content chat'; delete bus.from; bus.cls = 'truck';
bus.notes = 'A 12.2 m low-floor city bus: two doors on the right, a rear engine, 38 seats (the driver and ten more usable) and a long luggage-free aisle.';
bus.paint = {paint1:PALETTE.cityBlue, paint2:PALETTE.cityGrey, paint3:PALETTE.white};
bus.pieces = bus.pieces.filter(function(p){ return !p.fn || p.fn === 'headlight' || p.fn === 'taillight'; });
bus.pieces.forEach(function(p){ var nm = p.c && p.c.replace(/_D$/, ''), h = nm && PALETTE[nm]; if (h && SHAPED.props.palette[nm] !== h){ { bus.colours[M.customName(h)] = h; p.c = M.customName(h) + (/_D$/.test(p.c) ? '_D' : ''); } } });
bus.setup.track = 1.12; bus.setup.archClear = 0.14; bus.setup.tank = 'large'; bus.setup.topSpeed = 60; delete bus.setup.drawShaft;
bus.pieces = bus.pieces.filter(function(p){ return p.fn !== 'axle'; });
M.makeAxle(bus, 3.6, {steer:true, track:1.12}); M.makeAxle(bus, -3.4, {driven:true, track:1.12});
function add(doc, s, pos, o){ return M.addPiece(doc, s, pos, o); }
add(bus, 'box', [0.45, 0.95, 5.0], {d:[0.5, 0.1, 0.5], c:'black', m:'cloth', fn:'seat', mx:true, hidden:true, name:'driver seat'});
[3.0, 1.6, 0.2, -1.2, -2.6].forEach(function(z, i){ add(bus, 'box', [0.78, 0.8, z], {d:[0.5, 0.1, 0.5], c:'black', m:'cloth', fn:'seat', mx:true, hidden:true, name:'passenger seat ' + (i + 1)}); });
add(bus, 'box', [0, 0.95, -5.0], {d:[1.0, 0.7, 1.1], c:'underside', m:'steel', fn:'engine', hidden:true, name:'rear engine'});
add(bus, 'box', [0.6, 0.8, 2.0], {d:[0.3, 0.2, 0.3], c:'black', m:'plastic', fn:'battery', hidden:true, name:'battery'});
add(bus, 'box', [-0.7, 0.55, -1.0], {d:[0.5, 0.4, 1.4], c:'underside', m:'steel', fn:'tank', hidden:true, name:'fuel tank'});
add(bus, 'box', [0, 0.6, 0.0], {d:[1.6, 0.4, 3.0], c:'underside', m:'steel', fn:'storage', hidden:true, name:'luggage bay'});
pack.assets.push(M.buildAsset(bus, D));

/* ---- the semi tractor: conventional cab, sleeper, long hood, three axles (steer, two driven) and a fifth wheel ---- */
var T = M.blankDoc();
T.id = 'semi_tractor'; T.name = 'Semi tractor'; T.author = 'AfterStreet content chat'; T.cls = 'truck';
T.notes = 'A conventional long-haul tractor with a sleeper and a fifth wheel for a trailer: three axles, the rear two driven.';
T.paint = {paint1:'#a8322a', paint2:'#d8d4c8', paint3:'#2b2d31'};
T.setup = {wheelR:0.5, wheelW:0.3, track:1.0, axles:[3.1, -0.95, -2.3], archClear:0.16, bed:null, tank:'large', topSpeed:70};
T.pieces = M.makeWheel(T, 0.5, 0.3).filter(function(p){ return p.fn !== 'axle'; });
M.makeAxle(T, 3.1, {steer:true, track:1.0, name:'steer axle'}); M.makeAxle(T, -0.95, {driven:true, track:1.0, name:'drive axle 1'}); M.makeAxle(T, -2.3, {driven:true, track:1.0, name:'drive axle 2'});
add(T, 'box', [0, 0.92, 0.2], {d:[0.9, 0.2, 7.2], c:'underside', m:'steel', name:'frame rails'});
add(T, 'box', [0, 1.45, 3.35], {d:[1.4, 1.0, 2.1], c:'paint1', name:'hood'});
add(T, 'wedge', [0, 1.95, 3.05], {d:[1.3, 0.12, 1.5], rot:[0, 180, 0], c:'paint1', name:'hood top slope'});
add(T, 'box', [0, 1.5, 4.43], {d:[1.2, 0.8, 0.06], c:'chrome', m:'steel', name:'grille'});
add(T, 'box', [0, 1.5, 4.46], {d:[1.0, 0.05, 0.02], c:'black', m:'plastic', name:'grille bars'});
add(T, 'box', [0.62, 1.45, 4.42], {d:[0.22, 0.2, 0.05], c:'head', mx:true, fn:'headlight', name:'headlight'});
add(T, 'box', [0, 0.82, 4.43], {d:[2.3, 0.28, 0.16], c:'chrome', m:'steel', name:'bumper'});
add(T, 'box', [0, 2.15, 1.55], {d:[2.4, 1.7, 1.9], c:'paint1', name:'cab'});
add(T, 'box', [0, 2.5, 2.51], {d:[2.2, 0.8, 0.04], c:'glass', name:'windscreen'});
add(T, 'box', [1.21, 2.35, 1.45], {d:[0.04, 0.7, 1.0], c:'glass', mx:true, name:'door window'});
add(T, 'box', [1.22, 2.0, 1.45], {d:[0.03, 1.5, 1.05], c:'paint1', mx:true, name:'door'});
add(T, 'box', [0, 2.35, -0.3], {d:[2.4, 1.9, 1.7], c:'paint2', name:'sleeper'});
add(T, 'box', [0, 2.5, 0.51], {d:[2.4, 0.5, 0.08], c:'paint3', m:'plastic', name:'sun visor'});
add(T, 'box', [0, 3.15, 1.0], {d:[2.3, 0.28, 1.2], c:'paint2', name:'roof fairing'});
add(T, 'box', [1.3, 0.95, 3.0], {d:[0.1, 0.1, 0.6], c:'underside', m:'steel', mx:true, name:'cab step'});
add(T, 'bev', [1.3, 0.75, 1.55], {d:[0.1, 0.1, 0.6], c:'chrome', m:'steel', mx:true, name:'step'});
add(T, 'box', [1.45, 2.25, 2.1], {d:[0.1, 0.34, 0.06], c:'black', m:'plastic', mx:true, name:'mirror'});
add(T, 'cyl', [1.0, 1.0, 0.3], {d:[0.5, 0.5, 1.1], ax:'z', c:'metal', m:'steel', mx:true, fn:'tank', name:'fuel tank'});
add(T, 'cyl', [0.9, 2.3, -1.2], {d:[0.14, 3.4, 0.14], ax:'y', c:'chrome', m:'steel', mx:true, name:'exhaust stack'});
add(T, 'cyl', [0, 1.1, -1.35], {d:[0.8, 0.1, 0.8], ax:'y', c:'underside', m:'steel', name:'fifth wheel'});
add(T, 'box', [0, 1.14, -1.9], {d:[0.5, 0.06, 0.6], c:'black', m:'steel', name:'fifth wheel throat'});
add(T, 'box', [0, 1.08, -3.2], {d:[2.1, 0.12, 0.2], c:'paint3', m:'plastic', name:'rear crossmember'});
add(T, 'box', [0.8, 0.9, -3.35], {d:[0.3, 0.14, 0.03], c:'tail', mx:true, fn:'taillight', name:'tail light'});
add(T, 'box', [0, 1.8, 1.0], {d:[2.1, 0.12, 1.0], c:'cloth', fn:'sleep', hidden:true, name:'sleeper bunk'});
add(T, 'box', [0.6, 1.5, 1.7], {d:[0.5, 0.1, 0.5], c:'seat', m:'cloth', fn:'seat', mx:true, hidden:true, name:'cab seat'});
add(T, 'box', [0, 1.2, 3.35], {d:[1.0, 0.8, 1.4], c:'underside', m:'steel', fn:'engine', hidden:true, name:'diesel engine'});
add(T, 'box', [0.5, 1.3, 4.0], {d:[0.3, 0.2, 0.3], c:'black', m:'plastic', fn:'battery', hidden:true, name:'battery'});
add(T, 'box', [0, 1.9, -0.3], {d:[1.6, 0.6, 1.3], c:'underside', m:'steel', fn:'storage', hidden:true, name:'sleeper lockers'});
pack.assets.push(M.buildAsset(T, D));

fs.writeFileSync(root + 'packs/afterstreet-fleet.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-fleet.js:', pack.assets.map(function(a){ return a.id + ' ' + JSON.stringify(a.game) + ' ' + a.stats.total + ' triangles'; }).join('\n  '));
console.log(JSON.stringify(M.check(bus, pack.assets[0])), JSON.stringify(M.check(T, pack.assets[1])));
