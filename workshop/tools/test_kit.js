/* Tests the Workshop kit (workshop/kit.js): the parts the Make card and the build library share.
   Run: node workshop/tools/test_kit.js   (exit code 1 on a failure) */
global.window = global;
var root = __dirname + '/../../';
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED);
global.AFTERSTREET_STATIONS = require(root + 'workshop/stations.js');
var WSB = require(root + 'workshop/build.js'), K = require(root + 'workshop/kit.js'), D = require(root + 'workshop/damage.js'); D.setModel(M);
var fails = 0;
function ok(cond, what){ console.log((cond ? 'ok   ' : 'FAIL ') + what); if (!cond) fails++; }
/* the same pieces, to a tenth of a millimetre (the kit rounds its sizes; the old helpers did not) */
function strip(list){ return JSON.stringify(list.map(function(p){ var q = JSON.parse(JSON.stringify(p)); delete q.id; return q; }), function(k, v){ return typeof v === 'number' ? Math.round(v*1e4)/1e4 : v; }); }

/* 1. the cabin kit makes exactly what the content chat's own copy made */
var CK = require(root + 'workshop/tools/cabin_kit.js');
var car = {hw:0.78, belt:1.0, roof:1.38, cabF:0.9, cabB:-0.9, g:0.2, seatY:0.68, rear:[-0.4, -0.4]};
var b1 = WSB.create({id:'a'}), b2 = WSB.create({id:'b'}); CK.carCabin(b1, JSON.parse(JSON.stringify(car))); b2.carCabin(JSON.parse(JSON.stringify(car)));
ok(strip(b1.doc.pieces) === strip(b2.doc.pieces) && JSON.stringify(b1.doc.points) === JSON.stringify(b2.doc.points), 'car cabin: ' + b2.doc.pieces.length + ' pieces, the same as cabin_kit.js');
var tc = {hw:1.1, zB:2.0, zF:3.6, fl:1.1, belt:1.9, roof:2.9};
var b3 = WSB.create({id:'c'}), b4 = WSB.create({id:'d'}); CK.truckCab(b3, JSON.parse(JSON.stringify(tc))); b4.truckCab(JSON.parse(JSON.stringify(tc)));
ok(strip(b3.doc.pieces) === strip(b4.doc.pieces) && JSON.stringify(b3.doc.points) === JSON.stringify(b4.doc.points), 'truck cab: ' + b4.doc.pieces.length + ' pieces, the same as cabin_kit.js');

/* 2. a wall with a door and a window: the solid part is the wall less the openings, and no piece is in an opening */
var ops = [{a:0.4, b:1.3, y0:0, y1:2.0}, {a:2.0, b:3.2, y0:0.9, y1:1.8}];
var cells = K.wallCells(4, 2.4, ops), area = cells.reduce(function(s, c){ return s + (c[1] - c[0])*(c[3] - c[2]); }, 0);
ok(Math.abs(area - (4*2.4 - 0.9*2.0 - 1.2*0.9)) < 1e-6, 'wall cells: ' + cells.length + ' pieces cover ' + area.toFixed(3) + ' sq m (the wall less a door and a window)');
var inHole = cells.filter(function(c){ var xm = (c[0] + c[1])/2, ym = (c[2] + c[3])/2; return ops.some(function(o){ return xm > o.a && xm < o.b && ym > o.y0 && ym < o.y1; }); });
ok(!inHole.length, 'wall cells: nothing left in the openings');
var bw = K.on(M.blankDoc()), wall = K.wall(bw, {w:4, h:2.4, t:0.1, turn:90, at:[1, 0, 0], openings:ops, glass:true, frame:0.06});
var WB = M.boundsOf([].concat.apply([], wall.map(M.toNative)));
ok(Math.abs(WB.mx[2] - WB.mn[2] - 4) < 0.15 && Math.abs(WB.mn[0] - 0.95) < 0.01, 'wall turned to face +x runs along z (' + wall.length + ' pieces with glass and frames)');

/* 3. lettering: letters are boxes standing on the line, as wide as the font says */
var bt = K.on(M.blankDoc()), txt = K.text(bt, 'Gas 24', {h:0.2, at:[0, 1, 0]}), TB = M.boundsOf([].concat.apply([], txt.map(M.toNative)));
ok(txt.length > 10 && Math.abs(TB.mn[1] - 1) < 1e-6 && Math.abs(TB.mx[1] - 1.2) < 1e-6, 'lettering: ' + txt.length + ' boxes, 0.2 m tall on the line');
ok(Math.abs((TB.mx[0] - TB.mn[0]) - K.textWidth('Gas 24', 0.04)) < 1e-6 && Math.abs(TB.mn[0] + TB.mx[0]) < 1e-6, 'lettering: centred, ' + (TB.mx[0] - TB.mn[0]).toFixed(2) + ' m wide');
ok(Object.keys(K.FONT).length >= 47, 'font: ' + Object.keys(K.FONT).length + ' characters (A to Z, 0 to 9 and marks)');

/* 4. a pane leaning back 30 degrees and narrower at the top */
var bp = K.on(M.blankDoc()), pn = K.pane(bp, {w:1.4, h:0.8, t:0.02, lean:30, rake:0.1, at:[0, 1, 1]}), PB = M.boundsOf(M.toNative(pn));
ok(Math.abs(PB.mx[1] - (1 + 0.8*Math.cos(Math.PI/6))) < 0.02 && PB.mn[2] < 1 - 0.38, 'pane: leans back (top at ' + PB.mx[1].toFixed(2) + ' m, ' + (1 - PB.mn[2]).toFixed(2) + ' m back)');

/* 5. wheel looks keep their look when the wheel size changes */
['plain', 'rounded', 'truck'].forEach(function(st){ var d = M.blankDoc(); K.setWheelLook(d, st); var n0 = d.pieces.filter(function(p){ return p.g === 'wheel'; }).length;
  d.setup.wheelR = 0.4; d.pieces = M.makeWheel(d, 0.4, 0.25); var n1 = d.pieces.filter(function(p){ return p.g === 'wheel'; }).length;
  ok(n0 === n1 && n0 >= 2, 'wheel look ' + st + ': ' + n0 + ' wheel pieces, kept after a new wheel size'); });

/* 6. trim round a box body */
var bb = K.on(M.blankDoc()), tr = K.trim(bb, {mn:[-1, 0.5, -2], mx:[1, 2.5, 2]}, {});
ok(tr.length === 12, 'trim: 4 corner boards, a base strip and a fascia (' + tr.length + ' pieces)');

/* 7. copies in a row: fill 2 m every 0.5 m */
var src = [{id:'p1', g:'body', s:'box', pos:[0, 0, 0], rot:[0, 0, 0], scl:[1, 1, 1], d:[0.1, 1, 0.1], c:'paint1', m:'wood'}], row = K.along(src, {dir:[0, 0, 1], every:0.5, length:2});
ok(row.length === 4 && row[3].pos[2] === 2, 'copies in a row: 4 more posts, the last at 2 m');

/* 8. a whole vehicle made with the kit passes the vehicle checks */
var b = WSB.create({id:'kit_van', name:'Kit van', cls:'van'});
b.wheels(0.36, 0.24).wheelLook('truck'); b.axle(1.6, {steer:true, track:0.85}); b.axle(-1.5, {driven:true, track:0.85});
b.box([-0.95, 0.45, -2.5], [0.95, 0.6, 2.5], {c:'underside', name:'floor'});
b.wall({w:5, h:1.6, t:0.06, turn:-90, at:[0.92, 0.6, 0], openings:[{a:3.6, b:4.4, y0:0.6, y1:1.3}], glass:true, frame:0.04, c:'paint1', name:'right side', mx:true});
b.box([-0.95, 2.2, -2.5], [0.95, 2.26, 2.5], {name:'roof'});
b.pane({at:[0, 1.2, 2.5], w:1.8, h:1.05, lean:20, rake:0.05});
b.box([-0.95, 0.6, 2.4], [0.95, 1.2, 2.55], {name:'front'}); b.box([-0.95, 0.6, -2.55], [0.95, 2.2, -2.45], {name:'back'});
b.text('KIT VAN', {at:[0, 1.0, 2.55], h:0.12, c:'white'});
b.engine([0, 0.9, 1.9]); b.tank([0, 0.55, -1.0]); b.battery([0.5, 0.8, 2.1]); b.gearbox([0, 0.7, 1.3]);
b.carCabin({hw:0.86, belt:1.3, roof:2.2, cabF:2.3, cabB:0.6, g:0.4, seatY:0.95});
b.light('headlight', [0.7, 0.9, 2.56]); b.light('taillight', [0.8, 1.0, -2.56]);
var r = b.finish(D);
ok(!r.bad.length, 'kit van: ' + r.report.tris + ' triangles, ' + r.doc.pieces.length + ' pieces' + (r.bad.length ? ': ' + r.bad.map(function(x){ return x[1]; }).join('; ') : ', no problems'));
var stw = r.asset.rig && r.asset.rig.parts ? Object.keys(r.asset.rig.parts).filter(function(k){ return r.asset.rig.parts[k].kind === 'steer'; }) : [];
ok(stw.length === 1, 'kit van: the steering wheel turns (' + stw.join(', ') + ')');

/* 9. smooth cages: a cube cage smooths into a closed rounded body inside the cage, winding outwards; tubes and blocks become cages */
var cube = M.SHAPES.cage.make(), sd = M.subdivide(cube.v, cube.f, 2), SB = M.boundsOf([{s:'poly', p:[0, 0, 0], v:sd.v, f:sd.f, c:'paint1'}]);
ok(sd.f.length === 96 && sd.v.length === 98 && K.cageVolume(sd.v, sd.f) > 0 && SB.mx[0] < 0.2 && SB.mx[0] > 0.12, 'cage: a cube smooths to 96 faces, closed, inside its cage (' + SB.mx[0].toFixed(3) + ' of 0.2)');
var cp = {id:'c1', g:'body', s:'cage', pos:[0, 1, 0], rot:[0, 90, 0], scl:[1, 1, 1], c:'paint1', m:'sheet', sub:1, v:cube.v, f:cube.f}, nat = M.toNative(cp);
ok(nat.length === 1 && nat[0].s === 'poly' && nat[0].f.length === 24 && !nat[0].sub, 'cage: the game gets one shaped piece (' + nat[0].f.length + ' faces at smoothness 1)');
var tube = K.cageFrom({id:'t', g:'body', s:'loft', ax:'z', n:8, pos:[0, 0, 0], rot:[0, 0, 0], scl:[1, 1, 1], c:'paint1', r:[[0, 0, -0.5, 0.2, 0.15], [0, 0, 0, 0.25, 0.2], [0, 0, 0.5, 0, 0]]});
ok(tube && tube.v.length === 17 && K.cageVolume(tube.v, tube.f) > 0 && M.subdivide(tube.v, tube.f, 1).f.length > 0, 'cage from a tube: ' + tube.v.length + ' corners, ' + tube.f.length + ' faces, winding outwards');
var bx = K.cageFrom({id:'b', g:'body', s:'box', pos:[1, 1, 1], rot:[0, 0, 0], scl:[1, 1, 1], c:'paint1', d:[1, 0.5, 2], name:'torso'});
var fi = K.extrudeFace(bx.v, bx.f, 2, 0.4), ext = M.subdivide(bx.v, bx.f, 1);
ok(bx.v.length === 12 && bx.f.length === 10 && K.cageVolume(bx.v, bx.f) > 1*0.5*2 && ext.f.length === 40 && bx.name === 'torso' && bx.pos[0] === 1, 'cage: pull out a face (12 corners, 10 faces, bigger inside), name and place kept');

console.log(fails ? fails + ' failed' : 'all kit tests passed');
process.exit(fails ? 1 : 0);
