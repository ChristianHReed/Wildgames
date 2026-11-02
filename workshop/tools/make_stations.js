/* Builds packs/afterstreet-stations.js with the Workshop engine: the models for the Workshop build stations (car shop, boathouse, dock, air hangar, wardrobe) and their build stages.
   Run: node workshop/tools/make_stations.js
   Rules: metres, origin at the centre of the base, y = 0 is the ground (for the boathouse and dock y = 0 is the WATER LINE and the land end stands 0.45 m above it),
   the front faces +Z and is the side the finished design comes out of. Points: station.use (where the player stands to open the Workshop, with the direction to face the terminal)
   and station.spawn (where the finished design appears, facing out). Timber frame, sheet roofing and plank walls: built by a survivor from wood, scrap and nails. */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/structures.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'afterstreet-stations', name:'AfterStreet Workshop stations', author:'AfterStreet content chat', licence:'MIT',
  notes:'Car shop, boathouse, plain dock, air hangar and open wardrobe, with frame / half built / done stages for the first three. Front faces +Z; points station.use and station.spawn.'});
var info = {};
var C = function(hex){ return M.customName(hex); };
var K = {plank:C('#a8885c'), plankD:C('#7e6240'), plankL:C('#c0a478'), ply:C('#b89a6a'), tin:C('#8c9190'), tinD:C('#6c716f'), tinR:C('#8a6a52'), tarp:C('#3c6c8c'), post:C('#8a6a44'),
  glassC:C('#7ea8b4'), screen:C('#6cd8a0'), paper:C('#e8e4d0'), red:C('#a83a2e'), yellow:C('#e0b82a'), orange:C('#e07a22'), white:C('#e8e8e2'), rope:C('#c8b078'), tyre:C('#26272a'),
  oil:C('#3a5a8a'), pegboard:C('#8a7a5a'), cabinet:C('#a83a2e'), steelPaint:C('#7a8088'), apron:C('#6a6c6e'), cloth1:C('#7a3a3a'), cloth2:C('#3a5a7a'), cloth3:C('#5a6a3a'), cloth4:C('#d8d0b8'), cloth5:C('#2c2c34'),
  mirror:C('#aab8be'), hull:C('#c9c2b0'), cleat:C('#4a4a4e'), pile:C('#5a4a36'), deck:C('#9a7c52')};

function model(name, label, note, w, len, h, build){
  var d = M.newModelDoc('structure', 'structures', 'structures', name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var api = {
    box:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'box', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'wood'}, o || {})); },
    steel:function(x, y, z, sx, sy, sz, c, o){ return api.box(x, y, z, sx, sy, sz, c, Object.assign({m:'steel'}, o || {})); },
    cyl:function(x, y, z, r, len, ax, c, o){ var dd = ax === 'z' ? [r*2, r*2, len] : ax === 'x' ? [len, r*2, r*2] : [r*2, len, r*2]; return M.addPiece(d, 'cyl', [x, y, z], Object.assign({d:dd, ax:ax, c:c, m:'steel'}, o || {})); },
    wedge:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'wedge', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'wood'}, o || {})); },
    bar:function(a, b, t, c, o2){ var dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.sqrt(dx*dx + dy*dy + dz*dz), mid = [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2];
      var yaw = Math.atan2(dx, dz) * 180/Math.PI, pitch = -Math.atan2(dy, Math.sqrt(dx*dx + dz*dz)) * 180/Math.PI;
      return M.addPiece(d, 'box', mid, Object.assign({d:[t, t, L], c:c, m:'wood', rot:[pitch, yaw, 0]}, o2 || {})); },
    pt:function(n, kind, pos, dir){ M.addPoint(d, n, kind, pos, dir || [0, 1, 0]); }
  };
  build(api);
  d.extra = [{path:['info', name], value:{w:w, len:len, h:h, note:note}}];
  M.addModelToPack(pack, d);
}
/* a sloped sheet from (x0,y0) to (x1,y1) across the width, running z0..z1 (roll about z) */
function sheetX(a, x0, y0, x1, y1, z0, z1, c, t){ var L = Math.hypot(x1 - x0, y1 - y0), roll = Math.atan2(y1 - y0, x1 - x0) * 180/Math.PI;
  return a.box((x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2, L, t || 0.06, z1 - z0, c, {m:'steel', rot:[0, 0, roll]}); }
/* a sloped sheet running along z, rising from y0 at z0 to y1 at z1 (pitch about x) */
function sheetZ(a, x0, x1, y0, y1, z0, z1, c, t){ var L = Math.hypot(z1 - z0, y1 - y0), pitch = -Math.atan2(y1 - y0, z1 - z0) * 180/Math.PI;
  return a.box((x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2, x1 - x0, t || 0.06, L, c, {m:'steel', rot:[pitch, 0, 0]}); }
function corrugate(a, x0, x1, y, z0, z1, c){ /* ribs on a flat roof sheet, every 0.5 m */ for (var x = x0 + 0.25; x < x1; x += 0.5) a.box(x, y, (z0 + z1)/2, 0.05, 0.05, z1 - z0, c, {m:'steel'}); }

/* ---------------- car shop: 6 x 20 m, open front on +Z, roll-up door coiled over the opening ---------------- */
var CS = {w:6, len:20, wallH:3.2, roofF:4.6, roofB:4.1};
function carshop(a, stage){
  var hw = CS.w/2, zB = -CS.len/2, zF = CS.len/2, wallH = CS.wallH;
  a.box(0, 0.06, 0, CS.w, 0.12, CS.len, 'concreteD', {m:'stone'});                       /* poured slab */
  a.box(0, 0.13, 8.2, 3.4, 0.02, 0.18, K.yellow, {m:'paint'});                           /* painted stop line at the door */
  var zs = [-9.8, -5, 0, 5, 9.8];
  var hz = function(z){ return CS.roofB - 0.3 + (z - zB)/CS.len*(CS.roofF - CS.roofB); };       /* wall height under the sloping roof */
  zs.forEach(function(z){ [-hw + 0.15, hw - 0.15].forEach(function(x){ a.box(x, hz(z)/2 + 0.12, z, 0.22, hz(z), 0.22, K.post); }); });   /* posts to the roof line */
  [-hw + 0.15, hw - 0.15].forEach(function(x){ a.bar([x, hz(zB) + 0.12, zB], [x, hz(zF) + 0.12, zF], 0.2, K.plankD); });                  /* wall plates follow the slope */
  a.box(0, hz(zB) + 0.12, zB + 0.15, CS.w, 0.2, 0.2, K.plankD);                         /* back plate */
  /* diagonal braces so the frame stage reads as a frame */
  [-hw + 0.15, hw - 0.15].forEach(function(x){ [[-9.8, -5], [5, 9.8]].forEach(function(p){ a.bar([x, 0.4, p[0]], [x, hz(p[1]) - 0.2, p[1]], 0.1, K.plankD); }); });
  if (stage === 1){ a.box(0, 0.35, 8.8, 1.2, 0.08, 0.3, K.plankL); a.box(-1.5, 0.3, 4, 3, 0.1, 0.25, K.plank, {rot:[0, 20, 0]}); a.box(1.6, 0.2, -3, 0.9, 0.35, 0.9, K.plank); return; }   /* a plank pile, a sawhorse */
  /* rafters (shed roof: high at the door, falling toward the back) */
  for (var i = 0; i < 5; i++){ var z = zB + 0.3 + i*(CS.len - 0.6)/4; a.box(0, hz(z) + 0.28, z, CS.w + 0.3, 0.14, 0.14, K.plankD); }
  [-2, 0, 2].forEach(function(x){ a.bar([x, hz(zB) + 0.28, zB], [x, hz(zF) + 0.28, zF], 0.1, K.plankD); });
  /* walls: plank cladding half height at stage 2, full height up to the roof at stage 3 (stepped every 2 m under the slope) */
  for (var k = -9; k <= 9; k += 2){ var top = stage === 2 ? 1.6 : hz(k) - 0.05;
    a.box(-hw + 0.08, top/2 + 0.12, k, 0.08, top, 1.96, (k/2 % 2) ? K.plank : K.plankL); a.box(hw - 0.08, top/2 + 0.12, k, 0.08, top, 1.96, (k/2 % 2) ? K.plank : K.plankL); }
  a.box(0, (stage === 2 ? 1.6 : hz(zB) - 0.05)/2 + 0.12, zB + 0.08, CS.w - 0.4, stage === 2 ? 1.6 : hz(zB) - 0.05, 0.08, K.plank);
  /* tool wall (left, inside), workbench with terminal (right, near the door) and the lift: present at every stage from half built */
  a.box(-hw + 0.2, 1.8, -2, 0.06, 1.3, 5, K.pegboard);
  [-4, -3, -2, -1, 0].forEach(function(z, j){ a.box(-hw + 0.26, 1.9 + (j % 2)*0.3, z, 0.04, 0.5, 0.06, 'steelD', {m:'steel'}); a.box(-hw + 0.26, 1.55, z + 0.2, 0.04, 0.12, 0.3, K.red, {m:'paint'}); });
  a.box(-hw + 0.4, 1.0, -2, 0.5, 0.06, 4.6, K.plankL); a.box(-hw + 0.4, 0.55, -2, 0.5, 0.08, 4.6, K.plankL);
  [-4.2, -2, 0.2].forEach(function(z){ a.box(-hw + 0.3, 0.5, z, 0.08, 1.0, 0.08, K.post); });
  a.box(-hw + 0.8, 0.5, 6.2, 0.7, 0.9, 0.9, K.cabinet, {m:'steel'}); a.box(-hw + 0.8, 0.96, 6.2, 0.74, 0.06, 0.94, K.steelPaint, {m:'steel'});
  /* the bench: 2 m long on the right wall near the door; terminal and clipboard on it */
  a.box(hw - 0.55, 0.9, 6.8, 0.8, 0.08, 2.2, K.plankL); [6, 7.6].forEach(function(z){ a.box(hw - 0.3, 0.45, z, 0.08, 0.9, 0.08, K.post); a.box(hw - 0.85, 0.45, z, 0.08, 0.9, 0.08, K.post); });
  a.box(hw - 0.55, 0.42, 6.8, 0.7, 0.05, 2.0, K.plank);
  a.box(hw - 0.5, 1.18, 7.3, 0.5, 0.36, 0.05, 'dark', {m:'plastic', rot:[0, -25, 0]}); a.box(hw - 0.53, 1.18, 7.28, 0.42, 0.28, 0.02, K.screen, {m:'plastic', rot:[0, -25, 0]}); a.box(hw - 0.5, 0.97, 7.3, 0.16, 0.1, 0.12, 'dark', {m:'plastic'});
  a.box(hw - 0.5, 0.95, 6.3, 0.26, 0.015, 0.34, K.paper, {m:'plastic', rot:[0, 15, 0]}); a.box(hw - 0.5, 0.96, 6.3, 0.22, 0.01, 0.3, K.plankD, {m:'plastic', rot:[0, 15, 0]});
  a.pt('station.use', 'use', [hw - 1.7, 0, 6.8], [1, 0, 0]);
  /* two-post lift in the middle of the bay: posts, arms, carriage */
  [-1.55, 1.55].forEach(function(x){ a.steel(x, 1.2, -1.5, 0.22, 2.4, 0.3, K.yellow, {m:'steel'}); a.steel(x, 0.15, -1.5, 0.5, 0.1, 0.7, 'steelD'); a.steel(x, 0.9, -1.5, 0.26, 0.3, 0.34, 'steelD'); });
  a.steel(0, 2.4, -1.5, 3.4, 0.14, 0.3, K.yellow); [[-1.1, -0.6], [-1.1, -2.4], [1.1, -0.6], [1.1, -2.4]].forEach(function(p){ a.steel(p[0], 0.82, p[1], 0.3, 0.1, 0.9, 'steelD', {rot:[0, p[0] > 0 ? 30 : -30, 0]}); });
  if (stage === 2){ a.pt('station.spawn', 'spawn', [0, 0, zF + 3.5], [0, 0, 1]); return; }
  /* tin roof, ribbed, with a small overhang at the door */
  sheetZ(a, -hw - 0.35, hw + 0.35, CS.roofB + 0.02, CS.roofF + 0.02, zB - 0.2, zF + 0.7, K.tin, 0.06);
  corrugate(a, -hw - 0.3, hw + 0.3, CS.roofB + 0.12, zB - 0.1, zF + 0.6, K.tinD);
  a.box(-hw + 0.9, 3.0, zB + 0.14, 1.3, 0.5, 0.04, K.tinR, {m:'steel'}); a.box(1.2, 2.2, zB + 0.14, 0.9, 0.9, 0.04, K.tarp, {m:'cloth'});   /* patches: scrap sheet, tarp */
  /* roll-up door, rolled up: coil at the head of the opening and the guide rails down both sides */
  a.cyl(0, CS.roofF - 0.75, zF - 0.15, 0.28, 5.4, 'x', K.tinD); a.steel(0, CS.roofF - 0.28, zF - 0.1, 5.8, 0.3, 0.3, K.plankD, {m:'wood'});
  [-hw + 0.45, hw - 0.45].forEach(function(x){ a.steel(x, 1.7, zF - 0.1, 0.1, 3.4, 0.12, 'steelD'); });
  a.box(0, CS.roofF - 1.1, zF - 0.16, 5.2, 0.3, 0.04, K.tinD, {m:'steel'});                          /* bottom bar of the door pulled up under the coil */
  /* lamp hung from the roof and the sign board */
  a.box(0, 3.7, 3, 0.04, 0.5, 0.04, 'dark'); a.box(0, 3.4, 3, 0.4, 0.14, 0.4, 'lamp', {m:'plastic'});
  a.box(0, CS.roofF - 0.5, zF + 0.7, 2.4, 0.4, 0.06, K.plankL); a.box(0, CS.roofF - 0.5, zF + 0.74, 2.0, 0.16, 0.02, K.red, {m:'paint'});
  /* clutter: tyre stack, oil drums, a jack stand pair, an engine on a stand */
  [0.2, 0.55, 0.9].forEach(function(y){ a.cyl(2.2, y, -8.5, 0.34, 0.2, 'y', K.tyre, {m:'rubber'}); });
  a.cyl(2.3, 0.45, -6.8, 0.28, 0.9, 'y', K.oil, {m:'steel'}); a.cyl(2.35, 0.45, -5.9, 0.28, 0.9, 'y', K.red, {m:'steel'});
  a.steel(-1.2, 0.3, -7.6, 0.8, 0.5, 0.6, 'steelD'); a.steel(-1.2, 0.62, -7.6, 0.5, 0.18, 0.4, K.steelPaint);
  a.pt('station.spawn', 'spawn', [0, 0, zF + 3.5], [0, 0, 1]);
}
model('station_carshop_s1', 'Car shop, stage 1: frame', 'timber posts, wall plates and braces on a poured slab, a plank pile and a sawhorse; the first stage of the car shop', CS.w, CS.len, 4.2, function(a){ carshop(a, 1); });
model('station_carshop_s2', 'Car shop, stage 2: half built', 'rafters, half-height plank walls, the tool wall, the bench with its terminal and the two-post lift, but no roof or door yet', CS.w, CS.len, 4.4, function(a){ carshop(a, 2); });
model('station_carshop', 'Car shop (built)', 'a survivor-built garage bay, 6 x 20 m: timber frame, plank walls, a ribbed tin shed roof (4.5 m at the door), a roll-up door coiled over the opening, a two-post lift, a tool wall and a bench with a terminal on the right; the car rolls out of the front', CS.w, CS.len, 4.6, function(a){ carshop(a, 3); });

/* ---------------- boathouse and dock: 5 x 18 m. y = 0 is the water line; the land end is z -9 to -3 at 0.45 m, the slip runs z -3 to +9 out over water ---------------- */
var BH = {w:5, len:18, deck:0.45};
function slip(a, stage, roofed){
  var hw = BH.w/2, D = BH.deck;
  /* land end: a gravel and plank apron */
  a.box(0, D/2 - 0.1, -6, BH.w, D + 0.2, 6, 'gravel', {m:'stone'}); a.box(0, D + 0.01, -6.5, BH.w - 0.4, 0.04, 4.6, K.deck);
  /* walkways on each side of the slip channel (channel x -1.5 to 1.5 open to the water) on piles */
  [-1, 1].forEach(function(s){
    var xc = s*2.0;
    for (var z = -3.4; z <= 9; z += 2.2){ a.box(xc + s*0.4, -0.6, z, 0.3, 2.4, 0.3, K.pile); a.box(xc - s*0.4, -0.6, z, 0.3, 2.4, 0.3, K.pile); a.box(xc, D - 0.1, z, 1.2, 0.14, 0.2, K.plankD); }
    a.box(xc, D + 0.04, 3, 1.1, 0.07, 12.6, K.deck);
    for (var j = -2.4; j <= 8.8; j += 0.9) a.box(xc, D + 0.082, j, 1.1, 0.01, 0.04, K.plankD);
    a.box(xc - s*0.58, D + 0.04, 3, 0.1, 0.14, 12.6, K.plankD);                         /* kerb rail along the channel */
    [1, 4, 7].forEach(function(z){ a.cyl(xc - s*0.35, D + 0.18, z, 0.07, 0.2, 'y', K.cleat, {m:'steel'}); a.box(xc - s*0.35, D + 0.3, z, 0.22, 0.05, 0.08, K.cleat, {m:'steel'}); });   /* mooring cleats */
    a.box(xc - s*0.46, D - 0.05, 8.9, 0.2, 0.3, 0.2, K.tyre, {m:'rubber'});               /* tyre fender at the end */
  });
  a.box(0, D + 0.04, -3, BH.w - 0.4, 0.07, 0.8, K.deck);                                 /* head of the slip, across the land end */
  /* a rope coiled on the right walkway, tied to the cleat */
  a.cyl(2.35, D + 0.14, 4.2, 0.22, 0.12, 'y', K.rope, {m:'cloth'}); a.bar([1.65, D + 0.3, 4], [1.65, D + 0.12, 5.3], 0.04, K.rope, {m:'cloth'}); a.bar([1.65, D + 0.12, 5.3], [0.9, -0.3, 6.5], 0.035, K.rope, {m:'cloth'});
  /* the design terminal: a post with a screen at the land end, right side */
  a.box(hw - 0.4, D + 0.55, -3.3, 0.14, 1.1, 0.14, K.post); a.box(hw - 0.4, D + 1.12, -3.3, 0.5, 0.38, 0.1, 'dark', {m:'plastic', rot:[0, -20, 0]}); a.box(hw - 0.43, D + 1.12, -3.25, 0.42, 0.3, 0.02, K.screen, {m:'plastic', rot:[0, -20, 0]});
  a.pt('station.use', 'use', [hw - 1.0, D, -3.5], [0, 0, 1]);
  a.pt('station.spawn', 'spawn', [0, 0, 9.5], [0, 0, 1]);
  if (stage === 1){ return; }
  if (!roofed) return;
  /* shed at the land end and the roof over the slip */
  var topY = 3.6;
  [[-hw + 0.15, -8.8], [hw - 0.15, -8.8], [-hw + 0.15, -3.2], [hw - 0.15, -3.2]].forEach(function(p){ a.box(p[0], D + 1.6, p[1], 0.2, 3.2, 0.2, K.post); });
  [[-hw + 0.15, 1], [hw - 0.15, 1], [-hw + 0.15, 5], [hw - 0.15, 5], [-hw + 0.15, 8.8], [hw - 0.15, 8.8]].forEach(function(p){ a.box(p[0], D + 1.6, p[1], 0.2, 3.2, 0.2, K.post); });
  a.box(-hw + 0.15, D + 3.25, 0, 0.18, 0.18, 18, K.plankD); a.box(hw - 0.15, D + 3.25, 0, 0.18, 0.18, 18, K.plankD);
  if (stage === 2){ for (var z = -8.8; z <= 8.8; z += 2.2) a.bar([-hw + 0.15, D + 3.2, z], [0, D + 4.0, z], 0.1, K.plankD), a.bar([hw - 0.15, D + 3.2, z], [0, D + 4.0, z], 0.1, K.plankD); return; }
  /* walls on the shed (planks, 0 to 2.4 m) with a door gap facing the slip, and a window */
  a.box(0, D + 1.4, -8.85, BH.w - 0.3, 2.8, 0.08, K.plank); a.box(-hw + 0.1, D + 1.4, -6, 0.08, 2.8, 5.4, K.plank); a.box(hw - 0.1, D + 1.4, -6, 0.08, 2.8, 5.4, K.plank);
  a.box(0.8, D + 1.7, -8.8, 0.7, 0.6, 0.04, K.glassC, {m:'glass'}); a.box(-hw + 0.05, D + 0.5, -5.8, 0.06, 1.0, 1.3, K.plankD, {m:'wood'});
  a.box(-hw + 0.15, D + 0.4, -4.4, 0.2, 0.8, 0.8, K.plankL); a.box(-hw + 0.2, D + 0.55, -5.2, 0.35, 0.5, 0.5, K.red, {m:'steel'});   /* a bench and a toolbox */
  /* gable roof of sheet, along the slip */
  for (var z2 = -8.8; z2 <= 8.8; z2 += 2.2){ a.bar([-hw + 0.15, D + 3.2, z2], [0, D + 4.1, z2], 0.1, K.plankD); a.bar([hw - 0.15, D + 3.2, z2], [0, D + 4.1, z2], 0.1, K.plankD); }
  sheetX(a, -hw - 0.3, D + 3.15, 0.05, D + 4.2, -9.1, 9.3, K.tin, 0.06); sheetX(a, hw + 0.3, D + 3.15, -0.05, D + 4.2, -9.1, 9.3, K.tin, 0.06);
  a.box(0, D + 4.24, 0.1, 0.5, 0.08, 18.6, K.tinD, {m:'steel'});
  a.box(0, D + 2.9, 9.3, 2.2, 0.35, 0.06, K.plankL); a.box(0, D + 2.9, 9.34, 1.8, 0.14, 0.02, K.red, {m:'paint'});       /* name board on the gable end */
}
model('station_boathouse_s1', 'Boathouse, stage 1: piles and deck', 'piles, walkways and mooring cleats of the slip, no roof yet; also the first stage of the plain dock', BH.w, BH.len, 1.5, function(a){ slip(a, 1, false); });
model('station_boathouse_s2', 'Boathouse, stage 2: roof frame', 'the slip with the posts, plates and rafters of the roof, no sheeting or walls', BH.w, BH.len, 4.6, function(a){ slip(a, 2, true); });
model('station_boathouse', 'Boathouse and slip (built)', 'a covered slip 5 x 18 m: the land end is a plank shed with the design terminal on a post at the right, the slip runs out over the water between two walkways, with mooring cleats, a rope and tyre fenders under a tin gable roof; y = 0 is the water line', BH.w, BH.len, 4.7, function(a){ slip(a, 3, true); });
model('station_dock', 'Dock and slip (plain)', 'the same slip without the roof or the shed: piles, two walkways, cleats, rope and the terminal post; for an open shore', BH.w, BH.len, 1.8, function(a){ slip(a, 3, false); });

/* ---------------- air hangar: 20 x 28 m, open front on +Z, apron marking, windsock ---------------- */
var HG = {w:20, len:28, eave:7, ridge:9};
function hangar(a, stage){
  var hw = HG.w/2, zB = -HG.len/2, zF = HG.len/2;
  a.box(0, 0.08, 0, HG.w, 0.16, HG.len, 'concreteD', {m:'stone'});
  /* apron marking: a yellow guide line out the door and a box for the aircraft */
  a.box(0, 0.17, 4, 0.2, 0.02, 24, K.yellow, {m:'paint'}); [-4.5, 4.5].forEach(function(x){ a.box(x, 0.17, 2, 0.14, 0.02, 20, K.white, {m:'paint'}); });
  a.box(0, 0.17, 14.2, 20, 0.02, 0.3, K.yellow, {m:'paint'});
  [-12.5, -5, 3, 10].forEach(function(z){ a.steel(-hw + 0.2, HG.eave/2 + 0.16, z, 0.45, HG.eave, 0.6, K.steelPaint); a.steel(hw - 0.2, HG.eave/2 + 0.16, z, 0.45, HG.eave, 0.6, K.steelPaint); });
  a.steel(0, HG.eave + 0.2, zF - 0.3, HG.w, 0.5, 0.4, K.steelPaint);                       /* front beam */
  if (stage === 1){ [-hw + 0.2, hw - 0.2].forEach(function(x){ a.bar([x, 0.4, -12.5], [x, HG.eave, -5], 0.2, K.steelPaint, {m:'steel'}); }); a.box(-3, 0.4, 6, 3, 0.2, 0.25, K.plank, {rot:[0, 30, 0]}); a.cyl(4, 0.5, 8, 0.4, 1, 'x', K.oil); return; }
  /* roof trusses: a rafter pair at every bay */
  [-13.6, -12.5, -5, 3, 10, 13.6].forEach(function(z){ a.bar([-hw + 0.2, HG.eave + 0.25, z], [0, HG.ridge + 0.1, z], 0.28, K.steelPaint, {m:'steel'}); a.bar([hw - 0.2, HG.eave + 0.25, z], [0, HG.ridge + 0.1, z], 0.28, K.steelPaint, {m:'steel'}); a.steel(0, HG.eave + 0.45, z, HG.w - 0.4, 0.16, 0.2, K.steelPaint); });
  a.steel(0, HG.ridge + 0.05, 0, 0.3, 0.3, HG.len - 0.4, K.steelPaint);
  [-hw + 0.2, hw - 0.2].forEach(function(x){ a.steel(x, HG.eave + 0.2, 0, 0.4, 0.4, HG.len, K.steelPaint); });
  /* back and side walls: corrugated steel to the eaves (half height at stage 2) */
  var wt = stage === 2 ? 3 : HG.eave;
  a.steel(0, wt/2 + 0.16, zB + 0.1, HG.w - 0.5, wt, 0.1, K.tin); a.steel(-hw + 0.08, wt/2 + 0.16, 0, 0.1, wt, HG.len - 0.5, K.tin); a.steel(hw - 0.08, wt/2 + 0.16, 0, 0.1, wt, HG.len - 0.5, K.tin);
  for (var x = -9.5; x <= 9.5; x += 1) a.steel(x, wt/2 + 0.16, zB + 0.16, 0.08, wt, 0.06, K.tinD);
  for (var z = -13; z <= 13; z += 1){ a.steel(-hw + 0.14, wt/2 + 0.16, z, 0.06, wt, 0.08, K.tinD); a.steel(hw - 0.14, wt/2 + 0.16, z, 0.06, wt, 0.08, K.tinD); }
  /* terminal kiosk on the left inside near the door: bench, screen, toolchest, drums */
  a.box(-hw + 1.0, 0.55, 11, 1.2, 1.1, 2.4, K.cabinet, {m:'steel'}); a.box(-hw + 1.0, 1.12, 11, 1.26, 0.06, 2.5, K.steelPaint, {m:'steel'});
  a.box(-hw + 1.0, 1.55, 11.4, 0.1, 0.5, 0.7, 'dark', {m:'plastic', rot:[0, 0, -12]}); a.box(-hw + 1.08, 1.55, 11.4, 0.02, 0.42, 0.62, K.screen, {m:'plastic', rot:[0, 0, -12]});
  a.box(-hw + 1.0, 1.2, 10.3, 0.3, 0.02, 0.36, K.paper, {m:'plastic'});
  a.pt('station.use', 'use', [-hw + 2.3, 0, 11], [-1, 0, 0]);
  [[hw - 1, -11], [hw - 1, -10.2], [hw - 1.9, -11]].forEach(function(p, i){ a.cyl(p[0], 0.5, p[1], 0.3, 1, 'y', i == 1 ? K.red : K.oil, {m:'steel'}); });
  a.box(hw - 1.4, 0.5, -3, 1.2, 1, 0.8, K.cabinet, {m:'steel'});
  /* windsock on a pole at the front right corner: 5 m pole, ring and four striped cones leaning with the wind */
  a.cyl(hw + 1.6, 2.6, 12, 0.07, 5.2, 'y', K.steelPaint); a.cyl(hw + 1.6, 0.1, 12, 0.3, 0.2, 'y', 'concreteD', {m:'stone'});
  a.cyl(hw + 1.6, 5.2, 12.45, 0.04, 0.9, 'z', K.steelPaint);
  [[0.85, K.orange], [0.62, K.white], [0.45, K.orange], [0.3, K.white]].forEach(function(r, i){ a.cyl(hw + 1.6, 5.2 - i*0.01, 12.55 + i*0.45, r[0]*0.34 - i*0.02, 0.4, 'z', r[1], {m:'cloth'}); });
  if (stage === 2){ a.pt('station.spawn', 'spawn', [0, 0, zF + 6], [0, 0, 1]); return; }
  sheetX(a, -hw - 0.4, HG.eave + 0.45, 0.05, HG.ridge + 0.5, zB - 0.2, zF + 0.5, K.tin, 0.08); sheetX(a, hw + 0.4, HG.eave + 0.45, -0.05, HG.ridge + 0.5, zB - 0.2, zF + 0.5, K.tin, 0.08);
  a.steel(0, HG.ridge + 0.6, 0, 0.5, 0.1, HG.len + 0.6, K.tinD);
  /* sliding doors parked folded at both sides of the open front, on a track along the beam */
  a.steel(0, HG.eave - 0.1, zF + 0.1, HG.w, 0.12, 0.2, 'steelD');
  [-1, 1].forEach(function(s){ a.steel(s*(hw - 1.5), (HG.eave - 0.4)/2 + 0.1, zF + 0.2, 3.2, HG.eave - 0.4, 0.14, K.tin); a.steel(s*(hw - 3.2), (HG.eave - 0.6)/2 + 0.1, zF + 0.4, 3.2, HG.eave - 0.6, 0.14, K.tinD); });
  /* name sign on the front beam */
  a.box(0, HG.eave + 0.6, zF + 0.1, 5, 0.9, 0.08, K.plankL, {m:'wood'}); a.box(0, HG.eave + 0.6, zF + 0.16, 4.6, 0.5, 0.02, K.red, {m:'paint'});
  /* roof light strip and a lamp over the door */
  a.box(0, HG.ridge - 0.4, 6, 1.6, 0.04, 8, K.glassC, {m:'glass'}); a.box(0, HG.eave - 0.5, zF + 0.2, 0.5, 0.2, 0.2, 'lamp', {m:'plastic'});
  a.pt('station.spawn', 'spawn', [0, 0, zF + 6], [0, 0, 1]);
}
model('station_hangar_s1', 'Hangar, stage 1: columns', 'the steel columns, eaves beams and front beam on the slab with the apron markings, a plank pile and a drum', HG.w, HG.len, 7.8, function(a){ hangar(a, 1); });
model('station_hangar_s2', 'Hangar, stage 2: trusses and half walls', 'trusses and the ridge, steel walls to 3 m, the terminal kiosk and the windsock, no roof sheets or doors', HG.w, HG.len, 9.4, function(a){ hangar(a, 2); });
model('station_hangar', 'Air hangar (built)', 'a 20 x 28 m steel-framed hangar with a gable roof of sheet, corrugated walls, the front open (two folded sliding doors parked at the sides), a painted apron box, a windsock on a pole and the terminal kiosk on the left; the aircraft waits in front of the doors', HG.w, HG.len, 10.2, function(a){ hangar(a, 3); });

/* ---------------- wardrobe, open: 1.8 x 0.6 x 2.1, doors swung wide, hangers and a mirror ---------------- */
model('station_wardrobe_open', 'Wardrobe, open', 'a plain timber wardrobe 1.8 m wide with both doors swung open: a hanging rail with coats, shirts and trousers on hangers, a shelf with folded clothes, a drawer and a mirror on the inside of the left door', 2.6, 1.6, 2.1, function(a){
  a.box(0, 0.05, 0, 1.8, 0.1, 0.6, K.plankD);                                              /* plinth */
  a.box(-0.88, 1.05, 0, 0.04, 2.0, 0.6, K.plank); a.box(0.88, 1.05, 0, 0.04, 2.0, 0.6, K.plank);   /* sides */
  a.box(0, 1.05, -0.28, 1.76, 2.0, 0.04, K.plankD);                                         /* back */
  a.box(0, 2.07, 0, 1.84, 0.06, 0.64, K.plankL);                                            /* top */
  a.box(0, 1.5, 0, 1.72, 0.03, 0.56, K.plank);                                              /* shelf above the rail */
  a.box(0.43, 0.7, 0, 0.8, 0.03, 0.56, K.plank); a.box(0.43, 0.38, 0.02, 0.76, 0.25, 0.5, K.plankL); a.box(0.43, 0.38, 0.28, 0.1, 0.03, 0.03, 'steelL', {m:'steel'});   /* shelf and a drawer */
  a.cyl(-0.4, 1.35, 0, 0.02, 1.2, 'x', 'steelL');                                           /* hanging rail */
  [[-0.78, K.cloth1, 0.55], [-0.62, K.cloth2, 0.5], [-0.46, K.cloth3, 0.7], [-0.3, K.cloth4, 0.45], [-0.14, K.cloth5, 0.6], [0.02, K.cloth2, 0.4]].forEach(function(c){
    a.box(c[0], 1.35, 0, 0.01, 0.03, 0.25, 'steelL', {m:'steel'}); a.box(c[0], 1.35 - c[2]/2 - 0.03, 0, 0.06, c[2], 0.3, c[1], {m:'cloth'}); a.box(c[0], 1.37, 0, 0.12, 0.02, 0.02, K.plankD); });
  [0.1, 0.3, 0.5].forEach(function(x, i){ a.box(x, 0.85, 0, 0.3, 0.12, 0.4, [K.cloth1, K.cloth4, K.cloth3][i], {m:'cloth'}); a.box(x, 0.97, 0, 0.3, 0.1, 0.38, [K.cloth2, K.cloth5, K.cloth1][i], {m:'cloth'}); });
  a.box(-0.4, 0.14, 0.1, 0.5, 0.08, 0.4, K.cloth5, {m:'rubber'}); a.box(0.0, 0.14, 0.1, 0.4, 0.08, 0.4, K.cloth3, {m:'rubber'});                /* shoes on the floor */
  /* doors swung open a little past 90 degrees on their front hinges; the left one carries the mirror on its inside face */
  a.box(-1.0, 1.05, 0.74, 0.04, 1.95, 0.9, K.plank, {rot:[0, 12, 0]}); a.box(-0.97, 1.05, 0.74, 0.02, 1.7, 0.66, K.mirror, {m:'glass', rot:[0, 12, 0]}); a.box(-1.06, 1.05, 1.14, 0.03, 0.1, 0.03, 'steelL', {m:'steel'});
  a.box(1.0, 1.05, 0.74, 0.04, 1.95, 0.9, K.plank, {rot:[0, -12, 0]}); a.box(0.97, 1.1, 0.78, 0.02, 1.3, 0.5, K.plankL, {rot:[0, -12, 0]});
  a.pt('station.use', 'use', [0, 0, 1.4], [0, 0, -1]);
});

fs.writeFileSync(root + 'packs/afterstreet-stations.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-stations.js:', pack.assets.length, 'models');
