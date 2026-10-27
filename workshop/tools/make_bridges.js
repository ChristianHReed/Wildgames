/* Builds packs/afterstreet-bridges.js with the Workshop engine: the bridge and water-works pieces the structures pack still lacked (finish list section 10).
   Run: node workshop/tools/make_bridges.js. Same rules as structures: metres, deck surface at y = 0, pieces run along +Z, centred on x = 0, z = 0. */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/structures.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'afterstreet-bridges', name:'AfterStreet bridges and water works', author:'AfterStreet content chat', notes:'Arch and girder spans, suspension hangers, cable-stayed deck, trestles, railings, spillway chute, stilling basin and fish ladder, built in the Workshop.'});
var info = {};

function model(name, label, note, w, len, h, build, pts){
  var d = M.newModelDoc('structure', 'structures', 'structures', name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var api = {
    box:function(x, y, z, sx, sy, sz, c, o){ var p = M.addPiece(d, 'box', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'steel'}, o || {})); return p; },
    mirror:function(x, y, z, sx, sy, sz, c){ return api.box(x, y, z, sx, sy, sz, c, {mx:true}); },
    wedge:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'wedge', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'steel'}, o || {})); },
    cyl:function(x, y, z, r, len, ax, c){ var dd = ax === 'z' ? [r*2, r*2, len] : ax === 'x' ? [len, r*2, r*2] : [r*2, len, r*2]; return M.addPiece(d, 'cyl', [x, y, z], {d:dd, ax:ax, c:c, m:'steel'}); },
    /* a straight member between two points (a brace, a cable, a hanger) */
    bar:function(a, b, t, c, o2){ var dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.sqrt(dx*dx + dy*dy + dz*dz), mid = [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2];
      var yaw = Math.atan2(dx, dz) * 180/Math.PI, pitch = -Math.atan2(dy, Math.sqrt(dx*dx + dz*dz)) * 180/Math.PI;
      return M.addPiece(d, 'box', mid, Object.assign({d:[t, t, L], c:c, m:'steel', rot:[pitch, yaw, 0]}, o2 || {})); },
    pt:function(n, kind, pos, dir){ M.addPoint(d, n, kind, pos, dir || [0, 1, 0]); }
  };
  build(api);
  d.extra = [{path:['info', name], value:{w:w, len:len, h:h, note:note}}];
  M.addModelToPack(pack, d);
}

/* ---- railings: three styles, each 4 m long, standing on the deck edge at x = 0 (the game places one each side, the left one turned 180 degrees) ---- */
model('railing_steel_4m', 'Steel bridge railing, 4 m', 'a steel post and two-rail guardrail, 1.1 m high, on the deck edge; the left side is the same piece turned round', 0.2, 4, 1.1, function(a){
  [-1.9, -0.63, 0.63, 1.9].forEach(function(z){ a.box(0, 0.55, z, 0.1, 1.1, 0.1, 'steelD'); });
  a.box(0, 1.05, 0, 0.08, 0.08, 4, 'steel'); a.box(0, 0.6, 0, 0.06, 0.06, 4, 'steel'); a.box(0, 0.25, 0, 0.04, 0.2, 4, 'steelL');
});
model('railing_parapet_4m', 'Concrete bridge parapet, 4 m', 'a solid concrete parapet with a cap and a recessed panel, 1.0 m high', 0.35, 4, 1.0, function(a){
  a.box(0, 0.45, 0, 0.3, 0.9, 4, 'concrete'); a.box(0, 0.95, 0, 0.4, 0.1, 4, 'concreteL'); a.box(0.151, 0.5, 0, 0.02, 0.5, 3.4, 'concreteD');
  [-1.95, 1.95].forEach(function(z){ a.box(0, 0.5, z, 0.38, 1.0, 0.1, 'concreteL'); });
});
model('railing_timber_4m', 'Timber bridge railing, 4 m', 'a timber post and rail fence for old road, path and trestle bridges, 1.1 m high', 0.2, 4, 1.1, function(a){
  [-1.95, -0.65, 0.65, 1.95].forEach(function(z){ a.box(0, 0.55, z, 0.16, 1.1, 0.16, 'timberD', {m:'wood'}); });
  a.box(0, 1.0, 0, 0.12, 0.12, 4, 'timber', {m:'wood'}); a.box(0, 0.55, 0, 0.1, 0.1, 4, 'timber', {m:'wood'});
  [-1.3, 0, 1.3].forEach(function(z){ a.bar([0, 0.2, z - 0.6], [0, 1.0, z + 0.6], 0.08, 'timber'); });
});

/* ---- girder span: 12 m of road on four steel plate girders with cross bracing (a standard highway overpass) ---- */
model('girder_span_road_12', 'Girder span, road, 12 m', 'a 12 m road deck on four steel plate girders with cross bracing and parapets; surface at y = 0; lay two for 24 m', 7, 12, 1.9, function(a){
  a.box(0, -0.2, 0, 7, 0.4, 12, 'concrete', {m:'concrete'}); a.box(0, 0.009, 0, 6.1, 0.02, 12, 'asphalt');
  [-1.4, 1.4].forEach(function(z){ a.box(0, 0.025, z*3, 0.12, 0.01, 1.6, 'line'); });
  [-2.55, -0.85, 0.85, 2.55].forEach(function(x){ a.box(x, -1.15, 0, 0.14, 1.5, 12, 'steelD'); a.box(x, -0.46, 0, 0.55, 0.1, 12, 'steel'); a.box(x, -1.9, 0, 0.45, 0.08, 12, 'steel'); });
  [-5.2, -2.6, 0, 2.6, 5.2].forEach(function(z){ [[-2.55, -0.85], [-0.85, 0.85], [0.85, 2.55]].forEach(function(p){ a.bar([p[0], -1.8, z], [p[1], -0.6, z], 0.07, 'steel'); a.bar([p[0], -0.6, z], [p[1], -1.8, z], 0.07, 'steel'); }); });
  [3.4, -3.4].forEach(function(x){ a.box(x, 0.5, 0, 0.3, 1.0, 12, 'concreteD'); a.box(x, 1.02, 0, 0.4, 0.06, 12, 'concreteL'); });
});

/* ---- arch span: 16 m concrete deck arch (the stock one is 8 m) ---- */
model('arch_span_road_16', 'Arch span, road, 16 m', 'a 16 m concrete deck arch: the ring springs 7 m below the deck and rises to 2 m below it; spandrel walls fill the rest; abut two for 32 m', 7.4, 16, 8.3, function(a){
  a.box(0, -0.3, 0, 7, 0.6, 16, 'concrete'); a.box(0, 0.009, 0, 6.1, 0.02, 16, 'asphalt');
  [3.2, -3.2].forEach(function(x){ a.box(x, 0.55, 0, 0.3, 1.0, 16, 'concreteD'); a.box(x, 1.08, 0, 0.4, 0.08, 16, 'concreteL'); });
  var N = 16, R = 7, cy = -9; /* ring centred 9 m under the deck: springs at -9 on the abutments, crown at -2 */
  for (var i = 0; i < N; i++){ var t0 = (i/N) * Math.PI, t1 = ((i + 1)/N) * Math.PI, tm = (t0 + t1)/2,
      A0 = [0, cy + R*Math.sin(t0), -R*Math.cos(t0)], A1 = [0, cy + R*Math.sin(t1), -R*Math.cos(t1)], ym = cy + R*Math.sin(tm), zm = -R*Math.cos(tm);
    a.bar(A0, A1, 5.4, 'concreteL', {d:[5.4, 1.1, 2*R*Math.sin((t1 - t0)/2) + 0.08], m:'concrete'});
    /* spandrel wall above this stretch of ring, each side, up to the underside of the deck */
    var top = -0.6, bot = ym + 0.5; [2.9, -2.9].forEach(function(x){ a.box(x, (top + bot)/2, zm, 0.3, top - bot, 2*R*(Math.sin(t1) < 0 ? 0 : (Math.cos(t0) - Math.cos(t1))) + 0.02 || 0.9, 'concrete'); });
  }
  [-1, 1].forEach(function(s){ a.box(0, -5.0, s*7.9, 7, 8.8, 1.8, 'concreteD'); a.box(0, -9.4, s*7.8, 7.6, 0.4, 2.2, 'concrete'); });
});

/* ---- suspension: hanger set (several hangers over 12 m) with the attach points the game draws its cables to ---- */
model('suspension_hanger_set_12', 'Suspension deck and hangers, 12 m', 'a 12 m road deck with a stiffening truss and a hanger rod every 3 m each side; the points are where the game attaches the main cable (top of each hanger) and where it sits on the tower saddle', 7, 12, 8.3, function(a){
  a.box(0, -0.3, 0, 7, 0.6, 12, 'steelD'); a.box(0, 0.009, 0, 6.1, 0.02, 12, 'asphalt'); [3.35, -3.35].forEach(function(x){ a.box(x, 0.5, 0, 0.12, 1.0, 12, 'steel'); a.box(x, 1.02, 0, 0.18, 0.06, 12, 'steelL'); a.box(x, -0.8, 0, 0.5, 0.7, 12, 'steel'); });
  for (var i = 0; i < 4; i++){ var z = -4.5 + i*3; [3.35, -3.35].forEach(function(x){ a.box(x, 3.6, z, 0.06, 7.2, 0.06, 'steelL'); a.box(x, 7.25, z, 0.3, 0.3, 0.3, 'steelD'); a.pt('hanger_' + (x > 0 ? 'r' : 'l') + i, 'socket', [x, 7.4, z]); }); }
  a.pt('cable_in', 'socket', [0, 7.4, -6]); a.pt('cable_out', 'socket', [0, 7.4, 6]);
});
model('suspension_tower_saddle_road', 'Suspension tower saddles', 'saddle blocks to put on top of the stock suspension tower (y = 26): the game ends the main cables on these', 8.7, 1.6, 1.0, function(a){
  [4.0, -4.0].forEach(function(x){ a.box(x, 0.3, 0, 0.8, 0.5, 1.4, 'steelD'); a.cyl(x, 0.62, 0, 0.35, 1.4, 'z', 'steel'); a.pt('saddle_' + (x > 0 ? 'r' : 'l'), 'socket', [x, 1.0, 0]); });
});

/* ---- cable-stayed deck unit: a 4 m deck with the anchor blocks the stays reach ---- */
model('stay_deck_road', 'Cable-stayed deck unit, road', 'a 4 m deck with a stay anchor at each edge; the game draws a stay from each anchor point to the pylon (stay_pylon_road, y = 20)', 7.6, 4, 1.8, function(a){
  a.box(0, -0.45, 0, 6.2, 0.9, 4, 'concrete'); a.box(0, 0.009, 0, 5.9, 0.02, 4, 'asphalt'); a.box(0, 0.025, 0, 0.12, 0.01, 1.8, 'line');
  [3.1, -3.1].forEach(function(x){ a.box(x, 0.3, 0, 0.3, 0.6, 4, 'concreteD'); a.box(x * 1.1, 0.2, 0, 0.5, 0.8, 0.7, 'concreteL'); a.box(x * 1.1, 0.7, 0, 0.3, 0.2, 0.5, 'steelD'); a.pt('stay_' + (x > 0 ? 'r' : 'l'), 'socket', [x * 1.1, 0.8, 0]); });
});

/* ---- trestles: timber and steel, a bent each (stretch in y) and a span unit ---- */
model('trestle_span_timber_8', 'Timber trestle span, 8 m', 'a 8 m timber deck on stringers with a bent at each end; surface at y = 0; the bent legs run down 1 m, stretch in y to reach the ground', 4.6, 8, 2.6, function(a){
  a.box(0, -0.12, 0, 4.4, 0.12, 8, 'timber', {m:'wood'}); [-1.6, -0.5, 0.5, 1.6].forEach(function(x){ a.box(x, -0.5, 0, 0.3, 0.6, 8, 'timberD', {m:'wood'}); });
  for (var i = 0; i < 12; i++) a.box(0, -0.04, -3.7 + i*0.67, 4.2, 0.05, 0.4, 'timberD', {m:'wood'});
  [-3.6, 3.6].forEach(function(z){ a.box(0, -0.9, z, 4.2, 0.3, 0.8, 'timber', {m:'wood'}); [-1.8, 1.8].forEach(function(x){ a.box(x, -1.5, z, 0.35, 1.0, 0.35, 'timberD', {m:'wood'}); }); a.bar([-1.8, -2.0, z + 0.3], [1.8, -0.9, z + 0.3], 0.1, 'timber'); a.bar([1.8, -2.0, z + 0.3], [-1.8, -0.9, z + 0.3], 0.1, 'timber'); });
});
model('trestle_bent_steel_unit', 'Steel trestle bent', 'a steel viaduct bent: two columns with cross braces and a cap; stretch in y (it is 1 m tall as drawn)', 4.4, 1, 1, function(a){
  [1.8, -1.8].forEach(function(x){ [-0.35, 0.35].forEach(function(z){ a.box(x, 0, z, 0.22, 1.0, 0.22, 'steelD'); }); });
  a.box(0, 0.55, 0, 4.4, 0.3, 1.1, 'steel'); a.bar([-1.8, -0.5, 0.4], [1.8, 0.5, 0.4], 0.07, 'steel'); a.bar([1.8, -0.5, 0.4], [-1.8, 0.5, 0.4], 0.07, 'steel');
});
model('trestle_span_steel_12', 'Steel trestle span, 12 m', 'a 12 m open-deck steel deck girder for viaducts and rail trestles; surface at y = 0', 4.4, 12, 1.7, function(a){
  a.box(0, -0.1, 0, 4.2, 0.2, 12, 'steel'); [-1.7, 1.7].forEach(function(x){ a.box(x, -0.9, 0, 0.12, 1.5, 12, 'steelD'); a.box(x, -0.18, 0, 0.5, 0.08, 12, 'steel'); a.box(x, -1.65, 0, 0.45, 0.08, 12, 'steel'); });
  for (var z = -5.5; z <= 5.5; z += 2.75) a.bar([-1.7, -1.5, z], [1.7, -0.3, z], 0.07, 'steel'), a.bar([1.7, -1.5, z], [-1.7, -0.3, z], 0.07, 'steel');
});

/* ---- water works ---- */
model('spillway_chute_h8', 'Spillway chute, 8 m wide', 'a concrete spillway chute 8 m wide, 16 m long, falling 8 m; water runs toward +Z; stretch in y for other drops', 11, 16, 8.4, function(a){
  a.wedge(0, -4.0, 0, 8, 8, 16, 'concrete', {ry:2}); a.box(0, 0.05, -8, 8, 0.2, 0.6, 'concreteL');
  [4.2, -4.2].forEach(function(x){ a.box(x, -3.8, 0, 0.4, 8.6, 16.2, 'concreteD'); a.wedge(x, -4.1, 0, 0.4, 8.4, 16, 'concreteD', {ry:2}); });
  for (var i = 0; i < 6; i++) a.box(0, -1.2 - i*1.2, -6.2 + i*2.5, 6.4, 0.2, 0.25, 'concreteL');
  a.pt('water_in', 'socket', [0, 0.2, -8], [0, 0, 1]); a.pt('water_out', 'socket', [0, -7.6, 8], [0, 0, 1]);
});
model('stilling_basin_8', 'Stilling basin, 8 m wide', 'the concrete basin at the foot of a spillway: floor, baffle blocks, an end sill and side walls; the chute ends at -Z', 10, 12, 2.4, function(a){
  a.box(0, -0.25, 0, 8, 0.5, 12, 'concrete'); [4.2, -4.2].forEach(function(x){ a.box(x, 0.7, 0, 0.4, 2.4, 12, 'concreteD'); });
  [-2.8, -0.9, 0.9, 2.8].forEach(function(x){ a.box(x, 0.35, -3, 0.9, 0.7, 0.9, 'concreteL'); }); [-1.9, 0, 1.9].forEach(function(x){ a.box(x, 0.35, 0, 0.9, 0.7, 0.9, 'concreteL'); });
  a.box(0, 0.45, 5.6, 8, 0.9, 0.8, 'concreteL'); a.pt('water_out', 'socket', [0, 0.2, 6.2], [0, 0, 1]);
});
model('fish_ladder_4m', 'Fish ladder, 4 m step', 'a stepped concrete channel of pools for fish to climb a dam or weir: 4 m long, 2 m wide, rising 1.2 m toward -Z', 3, 4, 1.8, function(a){
  a.box(1.1, 0.0, 0, 0.2, 1.4, 4, 'concreteD'); a.box(-1.1, 0.0, 0, 0.2, 1.4, 4, 'concreteD');
  for (var i = 0; i < 4; i++){ a.box(0, 0.2 - i*0.3 + 0.0, -1.5 + i, 2, 0.3 + (3 - i)*0.0, 0.18, 'concreteL'); a.box(0, -0.1 - i*0.3, -1.0 + i, 2, 0.1, 0.8, 'water'); }
  a.pt('water_in', 'socket', [0, 0.5, -2], [0, 0, 1]); a.pt('water_out', 'socket', [0, -1.0, 2], [0, 0, 1]);
});

fs.writeFileSync(root + 'packs/afterstreet-bridges.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-bridges.js:', pack.assets.length, 'models,', pack.assets.reduce(function(n, a){ return n + a.stats.total; }, 0), 'triangles');
