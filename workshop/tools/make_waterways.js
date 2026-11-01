/* Builds packs/afterstreet-waterways.js with the Workshop engine: flowing water and its banks and shores (Nov 2026).
   Run: node workshop/tools/make_waterways.js
   Datum for every piece: y = 0 is the WATER SURFACE. The stream runs along +Z, water toward -X, the bank toward +X, x = 0 is the waterline; bank pieces are 4 m long and
   about 3 m deep (x 0 to 3) and go 0.9 m under water so a low water level never shows a gap. Flow-cue pieces lie 1 cm above the water (y = 0.01). */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/land.js'); require(root + 'assets/shaped/waterside.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'afterstreet-waterways', name:'AfterStreet waterways: banks, shores and flow', author:'AfterStreet content chat', licence:'MIT',
  notes:'Bank profiles from mud to concrete channel, shore plants and drift, flow cues (wakes, chutes, eddies, foam) and the junk a city creek collects. Water surface is y = 0, water toward -x, flow toward +z.'});
var info = {}, seedv = 1;
function seed(n){ seedv = n; } function rnd(){ seedv = (seedv * 16807) % 2147483647; return (seedv - 1) / 2147483646; } function between(a, b){ return a + (b - a) * rnd(); }
function pick(l){ return l[Math.floor(rnd() * l.length) % l.length]; }
function q(v, s){ return Math.round(v / s) * s; }
var C = function(hex){ return M.customName(hex); };
var K = {concreteD:C('#88867e'), algae:C('#4a6a2e'), stain:C('#6a6458'), wire:C('#8a8c8e'), willow:C('#7a9a4c'), willowD:C('#5e7e38'), willowL:C('#9ab45c'), cane:C('#8aa04a'), caneD:C('#6a8438'),
  sedge:C('#6f8a3c'), sedgeD:C('#55702e'), sedgeL:C('#8fa84c'), wet:C('#3e342a'), strata1:C('#9a6a4a'), strata2:C('#7a5a3e'), cress:C('#3f8a3a'), bag:C('#d8d8d0'), cart:C('#9aa0a6'), rustO:C('#8a4a2a'), tyre:C('#26272a'),
  pallet:C('#a08a62'), whiteW:C('#e8f0f2'), glass:C('#6aa88a'), blue:C('#3a5a8a'), bottle:C('#c8b848'), catB:C('#5a3a22')};

function model(name, label, note, w, len, h, kind, build){
  var d = M.newModelDoc(kind || 'structure', 'land', 'land', name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var api = {
    box:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'box', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'stone'}, o || {})); },
    bev:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'bev', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'stone'}, o || {})); },
    cone:function(x, y, z, r, h2, c, o){ return M.addPiece(d, 'cone', [x, y, z], Object.assign({c:c, m:'leaf', r:[[0, -h2/2, 0, r, r], [0, h2/2, 0, 0, 0]], n:6}, o || {})); },
    /* a rounded boulder: a bevelled block, tipped a little and turned */
    rock:function(x, y, z, sx, sy, sz, c){ return M.addPiece(d, Math.max(sx, sz) > 0.7 ? 'bev' : 'box', [x, y + sy/2, z], {d:[sx, sy, sz], c:c, m:'stone', rot:[between(-8, 8), between(0, 90), between(-8, 8)]}); },
    /* a stalk or blade leaning from its foot: foot (x, y, z), height, lean (x, z) in metres at the tip */
    blade:function(x, y, z, hgt, t, lx, lz, c){ var tip = [x + lx, y + hgt, z + lz]; return api.line([x, y, z], tip, t, c, 'leaf'); },
    line:function(a, b, t, c, m){ var dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.sqrt(dx*dx + dy*dy + dz*dz), mid = [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2];
      var yaw = Math.atan2(dx, dz) * 180/Math.PI, pitch = -Math.atan2(dy, Math.sqrt(dx*dx + dz*dz)) * 180/Math.PI;
      return M.addPiece(d, 'box', mid, {d:[t, t, L], c:c, m:m || 'wood', rot:[pitch, yaw, 0]}); },
    cyl:function(x, y, z, r, len, ax, c, o){ var dd = ax === 'z' ? [r*2, r*2, len] : ax === 'x' ? [len, r*2, r*2] : [r*2, len, r*2]; return M.addPiece(d, 'cyl', [x, y, z], Object.assign({d:dd, ax:ax, c:c, m:'stone'}, o || {})); },
    pt:function(n, k, pos, dir){ M.addPoint(d, n, k, pos, dir || [0, 1, 0]); },
    /* a stepped voxel bank: segs = [{x0, x1, y, c:[colours]}], built in 0.5 m cells along z so the edge is never straight; jitter is the cell-to-cell height change */
    bank:function(segs, o){ o = o || {}; var cells = Math.round(4 / (o.cell || 0.5)), cz = 4 / cells;
      for (var i = 0; i < cells; i++){ var z = -2 + cz*(i + 0.5);
        segs.forEach(function(s, si){ var jit = (o.jitter == null ? 0.05 : o.jitter) * (si === 0 ? 1.4 : 1), top = q(s.y + between(-jit, jit), 0.05), bot = s.bot != null ? s.bot : -0.9, x0 = s.x0 + (si ? between(-0.12, 0.12) * (o.wobble == null ? 1 : o.wobble) : 0), x1 = s.x1;
          if (top - bot < 0.04) return; api.box((x0 + x1)/2, (top + bot)/2, z, x1 - x0, top - bot, cz + 0.002, pick(s.c)); }); } }
  };
  build(api);
  d.extra = [{path:['info', name], value:{w:w, len:len, h:h, note:note}}];
  M.addModelToPack(pack, d); info[name] = 1;
}

/* ============================== bank profiles (bank toward +x; water surface y = 0) ============================== */
model('bank_shelf_4', 'Bank: wet shelf, 4 m', 'a low natural bank in four steps: wet mud at the waterline, a gravel shingle, a drift line of twigs, then a grass lip 0.5 m above the water; the standard bank for a slow creek or river; the edge is broken every 0.5 m so it never reads as a straight line', 3, 4, 0.55, 'structure', function(a){
  seed(11); a.bank([{x0:-0.5, x1:0.5, y:-0.05, c:['mud', K.wet, 'mud']}, {x0:0.5, x1:1.2, y:0.15, c:['gravelD', 'gravel', 'sandD']}, {x0:1.2, x1:1.7, y:0.35, c:['earthL', 'earth', 'sandD']}, {x0:1.7, x1:3, y:0.5, c:['grass', 'grassD', 'grassL']}]);
  for (var i = 0; i < 7; i++) a.box(between(0.9, 1.4), 0.38, between(-1.9, 1.9), between(0.3, 0.7), 0.04, 0.05, 'twig', {rot:[0, between(0, 180), 0]});
  for (var j = 0; j < 8; j++) a.rock(between(0.1, 1.1), 0.1, between(-1.9, 1.9), between(0.1, 0.25), between(0.06, 0.14), between(0.1, 0.22), pick(['gravel', 'gravelD', 'gravelW', 'chertL']));
});
model('bank_gravel_4', 'Bank: gravel shingle, 4 m', 'a clean gravel beach that shelves gently: dark wet cobbles at the waterline, pale dry gravel above, scattered rounded stones; for riffles and the inside of bends; 0.45 m above the water', 3, 4, 0.5, 'structure', function(a){
  seed(12); a.bank([{x0:-0.6, x1:0.8, y:-0.1, c:['gravelD', 'gravel', 'chert']}, {x0:0.8, x1:1.7, y:0.15, c:['gravel', 'gravelW', 'gravelD']}, {x0:1.7, x1:2.3, y:0.35, c:['gravelW', 'sandD', 'gravel']}, {x0:2.3, x1:3, y:0.5, c:['dry', 'grass', 'grassD']}], {jitter:0.04});
  for (var i = 0; i < 12; i++) a.rock(between(-0.2, 2.2), i < 6 ? -0.05 : 0.18, between(-1.9, 1.9), between(0.1, 0.32), between(0.07, 0.16), between(0.1, 0.28), pick(['gravel', 'gravelW', 'chertL', 'limeL', 'gravelD']));
  for (var j = 0; j < 5; j++) a.box(between(0.0, 0.7), 0.04, between(-1.9, 1.9), between(0.2, 0.5), 0.015, 0.05, K.wet);
});
model('bank_sand_4', 'Bank: sand, 4 m', 'a sandy bank with ripple marks and a darker wet band; for slow reaches and lake shores; 0.4 m above the water', 3, 4, 0.45, 'structure', function(a){
  seed(13); a.bank([{x0:-0.8, x1:0.7, y:-0.08, c:['sandD', 'sandD', K.wet]}, {x0:0.7, x1:2.0, y:0.2, c:['sand', 'sand', 'sandD']}, {x0:2.0, x1:3, y:0.4, c:['sand', 'dry', 'grassL']}], {jitter:0.03, wobble:0.7});
  for (var i = 0; i < 9; i++) a.box(between(0.9, 1.9), 0.205, -1.7 + i*0.42, between(0.9, 1.5), 0.015, 0.05, 'sandD');
  for (var j = 0; j < 3; j++) a.box(between(0.9, 1.5), 0.22, between(-1.5, 1.5), 0.2, 0.02, 0.12, K.wet);
});
model('bank_mud_4', 'Bank: slick mud, 4 m', 'a steep wet mud bank with slide marks, an exposed root and hoof prints; the bank of a slow muddy river or a pond a deer drinks from; 0.8 m above the water', 3, 4, 0.9, 'structure', function(a){
  seed(14); a.bank([{x0:-0.5, x1:0.4, y:-0.02, c:['mud', K.wet]}, {x0:0.4, x1:1.0, y:0.45, c:['earthD', 'mud', 'earthD']}, {x0:1.0, x1:1.5, y:0.7, c:['earth', 'earthD']}, {x0:1.5, x1:3, y:0.8, c:['grass', 'grassD', 'grassL']}], {jitter:0.06});
  [-1.2, 0.2, 1.4].forEach(function(z){ a.box(0.7, 0.4, z, 0.5, 0.03, 0.14, K.wet, {rot:[0, 0, -35]}); });
  [[0.4, -0.6], [0.5, 0.9]].forEach(function(p){ a.line([1.3, 0.75, p[1]], [0.55, 0.3, p[1] + 0.3], 0.07, 'root', 'wood'); });
  for (var i = 0; i < 4; i++){ a.box(0.2 + i*0.05, 0.05, 1.0 + i*0.35, 0.07, 0.03, 0.1, 'earthD'); }
});
model('bank_cut_clay_4', 'Bank: cut bank with strata, 4 m', 'the steep outer bank of a bend, 1.8 m: bands of clay, chert gravel and topsoil show in the face, roots hang out, a lip of grass overhangs and a slumped block sits at the foot; water is deep here', 3, 4, 2.0, 'structure', function(a){
  seed(15); a.bank([{x0:-0.4, x1:0.5, y:0.0, c:['mud', 'gravelD']}, {x0:0.5, x1:1.1, y:0.55, c:[K.strata1, 'clay', K.strata1]}, {x0:0.65, x1:1.25, y:1.05, c:['gravelD', 'chert', 'gravel']}, {x0:0.75, x1:1.4, y:1.5, c:[K.strata2, 'earth']}, {x0:0.55, x1:3, y:1.8, c:['grass', 'grassD', 'grassL']}], {jitter:0.04, wobble:0.5, cell:1.0});
  for (var i = 0; i < 6; i++){ var z = -1.7 + i*0.7; a.line([0.62, between(1.3, 1.7), z], [between(0.2, 0.5), between(0.5, 1.1), z + between(-0.3, 0.3)], 0.05, 'root', 'wood'); }
  a.box(0.3, 0.3, 0.6, 0.55, 0.5, 0.8, 'earthD', {rot:[0, 15, 6]}); a.box(0.9, 1.88, -1.2, 0.8, 0.14, 1.2, 'grassL'); a.box(0.9, 1.88, 1.2, 0.8, 0.14, 1.4, 'grassD');
});
model('bank_slump_4', 'Bank: slumped bank, 4 m', 'a bank that has fallen in: a scar in the face, grassed blocks tumbled to the water, a leaning small tree with its roots in the air; 1.4 m above the water; shows where a flood has been', 3, 4, 1.8, 'structure', function(a){
  seed(16); a.bank([{x0:-0.4, x1:0.6, y:-0.05, c:['mud', 'earthD']}, {x0:0.6, x1:1.3, y:0.6, c:['earthD', 'earth']}, {x0:1.1, x1:1.9, y:1.1, c:['earth', 'earthL']}, {x0:1.7, x1:3, y:1.4, c:['grass', 'grassD']}], {jitter:0.08, wobble:1.5});
  [[0.2, -0.9], [0.5, 0.5], [0.0, 1.5]].forEach(function(p, i){ a.box(p[0], 0.15 + i*0.05, p[1], 0.7, 0.4, 0.6, 'earth', {rot:[0, 20*i, 10]}); a.box(p[0], 0.4 + i*0.05, p[1], 0.7, 0.1, 0.6, 'grass', {rot:[0, 20*i, 10]}); });
  a.line([1.8, 1.4, 0.2], [0.6, 3.0, 0.5], 0.14, 'bark', 'wood'); [[0.6, 3.0, 0.5, 0.4, 0.6], [0.8, 2.5, 0.4, 0.3, 0.5]].forEach(function(b){ a.cone(b[0], b[1], b[2], b[3], b[4], 'sapling'); });
  a.line([1.6, 1.35, 0.1], [1.2, 0.8, -0.2], 0.06, 'root', 'wood'); a.line([1.7, 1.35, 0.4], [1.4, 0.9, 0.9], 0.06, 'root', 'wood');
});
model('bank_roots_4', 'Bank: tree roots, 4 m', 'a bank held by a big streamside tree: the trunk base sits on the lip and four thick roots run down the face to the water, with sand and gravel caught between them; 1.2 m above the water; put a sycamore or willow above it', 3, 4, 1.4, 'structure', function(a){
  seed(17); a.bank([{x0:-0.4, x1:0.5, y:0.0, c:['mud', 'gravelD']}, {x0:0.5, x1:1.0, y:0.5, c:['earthD', 'earth']}, {x0:1.0, x1:1.5, y:0.95, c:['earth', 'earthL']}, {x0:1.5, x1:3, y:1.2, c:['grass', 'grassD']}], {jitter:0.04});
  a.box(2.0, 1.6, 0, 0.9, 0.8, 0.9, 'bark', {m:'wood'}); a.box(2.0, 2.2, 0, 0.7, 0.5, 0.7, 'barkD', {m:'wood'});
  [-1.3, -0.5, 0.5, 1.3].forEach(function(z, i){ a.line([1.9, 1.3, z*0.3], [0.5, 0.45, z], 0.2, 'root', 'wood'); a.line([0.6, 0.5, z], [-0.1, -0.2, z + 0.2], 0.12, 'root', 'wood'); });
});
model('bank_riprap_4', 'Bank: rip-rap, 4 m', 'a bank armoured with big angular limestone blocks laid to a slope, gaps dark, weeds growing through; the way a city or road protects a creek; 0.9 m above the water', 3, 4, 1.0, 'structure', function(a){
  seed(18); a.box(1.6, -0.3, 0, 3.2, 1.2, 4, 'earthD');
  for (var row = 0; row < 3; row++) for (var i = 0; i < 5; i++){ var x = -0.4 + row*0.65 + between(-0.1, 0.1), z = -1.8 + i*0.85 + between(-0.12, 0.12); a.rock(x, -0.4 + row*0.42, z, between(0.7, 1.0), between(0.4, 0.6), between(0.7, 1.0), pick(['limeD', 'lime', 'limeL', 'dolo'])); }
  a.box(2.3, 0.45, 0, 1.4, 0.1, 4, 'grass');
  for (var j = 0; j < 8; j++) a.blade(between(0.4, 2.2), 0.45, between(-1.9, 1.9), between(0.25, 0.5), 0.04, between(-0.1, 0.1), between(-0.1, 0.1), K.sedge);
});
model('bank_gabion_4', 'Bank: gabion wall, 4 m', 'a stepped wall of wire baskets full of stone, two baskets high, grass growing from the top; for a creek in town; 1.0 m above the water', 3, 4, 1.1, 'structure', function(a){
  seed(19); a.box(1.4, -0.4, 0, 3.2, 0.9, 4, 'earthD');
  [[0.4, 0.0], [0.95, 0.5]].forEach(function(r, ri){ for (var i = 0; i < 4; i++){ var z = -1.5 + i*1.0; a.box(r[0], r[1] + 0.25, z, 0.9 - ri*0.1, 0.5, 0.98, 'limeD'); [0.3, 0.7].forEach(function(f){ a.box(r[0] - 0.46 + ri*0.05, r[1] + 0.25, z - 0.5 + f, 0.02, 0.5, 0.02, K.wire); }); a.box(r[0] - 0.455 + ri*0.05, r[1] + 0.5, z, 0.02, 0.02, 0.98, K.wire); a.box(r[0] - 0.455 + ri*0.05, r[1] + 0.25, z, 0.02, 0.02, 0.98, K.wire); a.box(r[0] - 0.47 + ri*0.05, r[1] + 0.25, z, 0.04, 0.4, 0.9, pick(['lime', 'limeL', 'dolo'])); } });
  a.box(1.9, 0.52, 0, 2.2, 0.06, 4, 'grass'); for (var j = 0; j < 8; j++) a.blade(between(0.8, 2.2), 0.55, between(-1.9, 1.9), between(0.2, 0.45), 0.04, 0, 0.05, K.sedgeL);
});
model('bank_stone_wall_4', 'Bank: dry-laid stone wall, 4 m', 'an old limestone retaining wall 1.5 m above the water, courses of cut stone with a coping, weep holes, a mossy waterline and an iron ladder; for the old mill and park creeks', 3, 4, 1.6, 'structure', function(a){
  seed(20); a.box(1.0, -0.2, 0, 2.6, 1.4, 4, 'earthD');
  for (var row = 0; row < 5; row++){ var off = row % 2 ? 0.5 : 0; for (var i = 0; i < 4; i++){ var z = -1.5 + i*1.0 + off - (off ? 1 : 0); if (z > 1.6 || z < -2.0) continue; a.box(-0.02 + 0.2*row*0, -0.35 + row*0.37 + 0.18, z + 0.5*(off ? 1 : 0), 0.4, 0.36, 0.96, pick(['lime', 'limeL', 'dolo', 'limeD'])); } }
  a.box(0.15, 1.55, 0, 0.7, 0.12, 4, 'limeL'); a.box(1.7, 1.52, 0, 2.2, 0.06, 4, 'grass');
  a.box(-0.22, -0.1, 0, 0.05, 0.3, 4, 'mossD'); [-1, 1].forEach(function(z){ a.box(-0.215, 0.5, z, 0.05, 0.08, 0.2, 'dark'); });
  a.box(-0.24, 0.55, 1.6, 0.04, 2.0, 0.04, K.rustO); a.box(-0.24, 0.55, 1.95, 0.04, 2.0, 0.04, K.rustO); for (var r2 = 0; r2 < 6; r2++) a.box(-0.25, -0.2 + r2*0.35, 1.78, 0.04, 0.04, 0.36, K.rustO);
});
model('bank_concrete_channel_4', 'Bank: concrete channel, 4 m', 'a trapezoid concrete flood channel as in a city creek: two sloped slabs with expansion joints, green algae at the waterline, a low-flow trough in the bed, a trickle of rust and stain; 1.6 m above the water; also fits the bank of a river through downtown', 3, 4, 1.7, 'structure', function(a){
  a.box(1.2, -0.45, 0, 2.6, 0.1, 4, 'concrete');
  a.box(1.0, 0.55, 0, 0.18, 2.6, 4, 'concrete', {rot:[0, 0, -45]}); a.box(1.05, 0.5, 0, 0.1, 2.2, 4, K.concreteD, {rot:[0, 0, -45]});
  [[0.5, 1.0, 0.0], [1.0, 1.5, 0.5], [1.5, 2.0, 1.0]].forEach(function(f){ a.box((f[0] + f[1])/2, (f[2] - 0.45)/2 - 0.02, 0, f[1] - f[0], f[2] + 0.41, 4, 'earthD'); });   /* the fill under the slab */
  a.box(2.5, 0.5, 0, 1.0, 2.0, 4, 'earthD');
  a.box(2.55, 1.6, 0, 0.9, 0.2, 4, 'concrete'); a.box(2.0, 1.62, 0, 0.1, 0.1, 4, K.concreteD);
  [-2, 0, 2].forEach(function(z){ a.box(1.0, 0.55, z, 0.2, 2.6, 0.04, 'dark', {rot:[0, 0, -45]}); });
  for (var i = 0; i < 5; i++) (function(t){ a.box(0.25 + t*1.5, -0.25 + t*1.6, between(-1.8, 1.8), 0.05, 0.4, between(0.4, 1.0), K.stain, {rot:[0, 0, -45]}); })(rnd());
  a.box(0.15, -0.12, 0, 0.35, 0.18, 4, K.algae, {rot:[0, 0, -45]}); a.box(2.0, 1.4, 0, 0.3, 0.4, 4, K.concreteD);
  a.box(2.4, 1.9, -1.9, 0.06, 0.6, 0.06, K.wire); a.box(2.4, 2.15, 0, 0.04, 0.04, 4, K.wire); a.box(2.4, 1.9, 1.9, 0.06, 0.6, 0.06, K.wire);
  for (var j = 0; j < 6; j++) a.blade(between(1.6, 2.7), 1.7, between(-1.9, 1.9), between(0.2, 0.5), 0.04, between(-0.08, 0.08), 0, K.sedge);
});
model('bank_timber_crib_4', 'Bank: timber crib wall, 4 m', 'a log crib retaining wall of squared timbers in layers with dark ends, soil behind, 1.1 m above the water; for old farm and mill banks', 3, 4, 1.2, 'structure', function(a){
  seed(21); a.box(1.4, -0.3, 0, 3.2, 1.2, 4, 'earthD');
  for (var l = 0; l < 4; l++){ a.box(0.0 - l*0.02, -0.1 + l*0.28, 0, 0.3, 0.26, 4.0, pick(['log', 'woodD', 'bark']), {m:'wood'}); for (var i = 0; i < 5; i++) a.box(0.9, -0.1 + l*0.28, -1.9 + i*0.95, 1.8, 0.2, 0.2, 'barkD', {m:'wood'}); }
  a.box(2.0, 1.04, 0, 2.2, 0.1, 4, 'grass'); a.box(-0.16, -0.05, 0, 0.04, 0.3, 4.0, K.algae);
});
model('bank_stairs_4', 'Bank: stone steps to the water, 4 m', 'five stone steps down to the water for a park or a fishing spot, with a worn middle and moss on the lowest; 1.2 m above the water; the steps are 2 m wide at z = 0', 3, 4, 1.3, 'structure', function(a){
  seed(22); a.bank([{x0:-0.5, x1:0.4, y:-0.1, c:['mud', 'gravelD']}, {x0:0.4, x1:3, y:1.2, c:['earth', 'earthD']}], {jitter:0.0, wobble:0});
  for (var i = 0; i < 5; i++){ a.box(0.4 + i*0.38 + 0.2, 0.15 + i*0.21, 0, 0.42, 0.22, 2.0, i === 0 ? 'limeD' : 'limeL'); a.box(0.4 + i*0.38 + 0.2, 0.25 + i*0.21, 0, 0.3, 0.03, 1.0, 'lime'); }
  a.box(2.6, 1.22, 0, 1.0, 0.1, 4, 'grass'); a.box(0.25, 0.1, 0, 0.3, 0.1, 1.9, 'mossD');
  [-1.05, 1.05].forEach(function(z){ a.box(1.4, 0.8, z, 1.9, 0.08, 0.1, 'limeD', {rot:[0, 0, -21]}); });
});
model('bank_landing_4', 'Bank: boat landing, 4 m', 'a gravel landing where a boat is pulled up: a notch in the bank, flat gravel, two timber stakes and a rope, scuffed ground; 0.5 m above the water; put a canoe or jon_boat on it', 3, 4, 0.9, 'structure', function(a){
  seed(23); a.bank([{x0:-0.6, x1:1.0, y:-0.1, c:['gravelD', 'gravel']}, {x0:1.0, x1:1.8, y:0.2, c:['gravel', 'earthL', 'sandD']}, {x0:1.8, x1:3, y:0.5, c:['grass', 'grassD']}], {jitter:0.03});
  [-0.6, 0.6].forEach(function(z){ a.box(1.5, 0.55, z, 0.14, 0.7, 0.14, 'woodD', {m:'wood'}); }); a.line([1.5, 0.75, -0.6], [1.5, 0.75, 0.6], 0.04, 'sandD', 'wood'); a.box(0.7, 0.03, 0.0, 0.3, 0.02, 1.8, 'earthD');
  for (var i = 0; i < 6; i++) a.rock(between(0.0, 1.2), 0.0, between(-1.9, 1.9), 0.18, 0.1, 0.18, pick(['gravel', 'gravelW', 'chertL']));
});

/* ---- built edges: outfalls and culverts ---- */
model('outfall_pipe_4', 'Outfall: storm pipe, 4 m', 'a concrete storm pipe 0.9 m wide ending in a headwall in the bank, a rock apron below, a rust-and-algae stain streak down the bank and a thread of water into the creek; 1.3 m above the water', 3, 4, 1.5, 'structure', function(a){
  seed(24); a.bank([{x0:-0.5, x1:0.5, y:-0.02, c:['mud', 'gravelD']}, {x0:0.5, x1:3, y:1.2, c:['earth', 'earthD']}], {jitter:0.03, wobble:0});
  a.box(0.62, 0.7, 0, 0.3, 1.1, 2.0, 'concrete'); a.box(0.58, 1.3, 0, 0.5, 0.12, 2.1, K.concreteD);
  a.cyl(0.5, 0.6, 0, 0.45, 0.4, 'x', 'dark'); a.cyl(0.45, 0.6, 0, 0.5, 0.1, 'x', K.concreteD);
  a.box(0.3, 0.1, 0, 0.6, 0.05, 0.4, K.stain); a.box(0.3, 0.3, 0.0, 0.06, 0.3, 0.3, K.algae, {rot:[0, 0, -20]}); a.box(0.2, 0.04, 0.0, 0.5, 0.02, 0.22, 'waterL');
  for (var i = 0; i < 7; i++) a.rock(between(-0.2, 0.7), 0.0, between(-1.2, 1.2), between(0.25, 0.5), between(0.15, 0.3), between(0.25, 0.5), pick(['limeD', 'lime', 'dolo']));
  [-1.2, 1.2].forEach(function(z){ a.box(0.62, 0.5, z, 0.3, 1.0, 0.5, 'concrete', {rot:[0, 0, 0]}); });
});
model('culvert_mouth_4', 'Outfall: box culvert mouth, 4 m', 'where a creek comes out from under a road: a square concrete culvert mouth in a headwall with two angled wing walls, a scour pool of rock below, a dark tunnel and silt on the floor; 2.2 m above the water; the road is above (x +)', 3, 4, 2.4, 'structure', function(a){
  seed(25); a.bank([{x0:-0.6, x1:0.4, y:-0.05, c:['gravelD', 'gravel']}, {x0:0.4, x1:3, y:2.0, c:['earthD', 'earth']}], {jitter:0.02, wobble:0, cell:1.0});
  a.box(0.55, 1.45, 0, 0.5, 1.3, 4.0, 'concrete'); a.box(0.4, 2.0, 0, 0.8, 0.2, 4.0, K.concreteD);
  a.box(0.52, 0.85, 0, 0.2, 1.9, 1.7, 'dark'); a.box(0.52, -0.3, 0, 0.3, 0.02, 1.7, 'mud');
  [-1, 1].forEach(function(s){ a.box(0.55, 1.1, s*1.4, 0.4, 2.1, 1.0, 'concrete'); a.box(0.2, 0.9, s*1.8, 0.3, 1.9, 0.9, 'concrete', {rot:[0, s*30, 0]}); });
  for (var i = 0; i < 8; i++) a.rock(between(-0.4, 0.5), 0.0, between(-1.7, 1.7), between(0.25, 0.55), between(0.15, 0.3), between(0.25, 0.5), pick(['limeD', 'lime', 'dolo']));
  for (var j = 0; j < 4; j++) a.blade(between(0.4, 0.8), -0.1, between(-1.8, 1.8), between(0.2, 0.4), 0.04, 0, 0, K.cress);
});

/* ============================== shore plants and drift (stand-alone, origin on the ground at the waterline; y = 0 water) ============================== */
model('sedge_edge_4', 'Shore: sedge and rush edge, 4 m', 'a ragged line of sedge, rush and soft grass clumps at the water margin: the plants that hide the exact edge of a bank; lay along any bank piece at x = 0.4 to 1.2; 4 m, 0.8 m tall', 1.4, 4, 0.9, 'plant', function(a){
  seed(30);
  for (var i = 0; i < 14; i++){ var x = between(0.2, 1.1), z = -1.9 + i*0.29 + between(-0.1, 0.1), y = x < 0.5 ? -0.02 : 0.1, hgt = between(0.4, 0.85), n = 3 + Math.floor(rnd()*3), c = pick([K.sedge, K.sedgeD, K.sedgeL, 'reed']);
    for (var k = 0; k < n; k++) a.blade(x + between(-0.07, 0.07), y, z + between(-0.07, 0.07), hgt*between(0.7, 1), 0.035, between(-0.25, 0.25), between(-0.25, 0.25), c); }
  a.pt('sway_0', 'sway', [0.6, 0.4, 0]);
});
model('cattail_edge_4', 'Shore: cattail margin, 4 m', 'a stand of cattails and bur-reed growing out of the shallows: brown seed heads on tall stems, the signature of a slow Ozark pond or backwater; 4 m, 1.4 m tall; use on the quiet inside of a bend', 1.6, 4, 1.5, 'plant', function(a){
  seed(31);
  for (var i = 0; i < 10; i++){ var x = between(-0.7, 0.8), z = -1.8 + i*0.4 + between(-0.12, 0.12), hgt = between(1.0, 1.5), lean = between(-0.15, 0.15);
    a.blade(x, -0.1, z, hgt, 0.03, lean, between(-0.1, 0.1), pick([K.sedge, K.sedgeD])); a.box(x + lean*0.95, -0.1 + hgt*0.88, z, 0.06, 0.22, 0.06, K.catB); for (var k = 0; k < 2; k++) a.blade(x, -0.1, z, hgt*0.7, 0.03, between(-0.3, 0.3), between(-0.3, 0.3), K.sedgeL); }
  a.pt('sway_0', 'sway', [0, 1.2, 0]);
});
model('cane_brake_4', 'Shore: river cane brake, 4 m', 'a dense strip of native river cane (a tall bamboo-like grass) 2.5 m high with leaf tufts in whorls at the top; grows on the banks and low terraces of Ozark rivers and hides the edge from a distance', 1.5, 4, 2.8, 'plant', function(a){
  seed(32);
  for (var i = 0; i < 12; i++){ var x = between(0.6, 1.8), z = -1.9 + i*0.33 + between(-0.12, 0.12), hgt = between(1.8, 2.6), lean = between(-0.2, 0.2);
    a.blade(x, 0.4, z, hgt, 0.05, lean, between(-0.1, 0.1), K.cane); for (var k = 0; k < 3; k++){ a.blade(x + lean, 0.4 + hgt*(0.6 + k*0.14), z, 0.3, 0.04, between(0.25, 0.4)*(k % 2 ? 1 : -1), between(-0.2, 0.2), K.caneD); } }
  a.pt('sway_0', 'sway', [1.2, 2.0, 0]);
});
model('willow_whips', 'Shore: willow thicket', 'a clump of black willow and buttonbush 3.5 m tall that leans over the water, with drooping pale-green whips down to the surface: it makes the bank feel soft; stand it on the lip of a bank at x about 1.5', 3, 3, 3.8, 'plant', function(a){
  seed(33);
  [[0, 0], [0.7, 0.8], [-0.5, 0.9], [0.6, -0.9]].forEach(function(p, i){ var h2 = between(2.4, 3.4); a.line([p[0], 0, p[1]], [p[0] - 0.7, h2, p[1] + between(-0.3, 0.3)], 0.14 - i*0.01, 'bark', 'wood'); });
  for (var i = 0; i < 9; i++){ var x = between(-1.4, 0.6), z = between(-1.2, 1.4), y = between(2.5, 3.5); a.bev(x, y, z, between(0.9, 1.5), between(0.5, 0.8), between(0.9, 1.4), pick([K.willow, K.willowD, K.willowL]), {m:'leaf'}); }
  for (var j = 0; j < 22; j++){ var x2 = between(-1.9, 0.4), z2 = between(-1.4, 1.5), top = between(2.2, 3.1); a.blade(x2, top - between(1.6, 2.4), z2, between(1.6, 2.4), 0.03, between(-0.05, 0.1), between(-0.05, 0.05), pick([K.willowL, K.willow])); }
  a.pt('sway_0', 'sway', [-0.8, 3.0, 0]);
});
model('sycamore_lean', 'Shore: leaning sycamore', 'a big streamside sycamore 9 m tall leaning out over the water, mottled pale bark in the upper trunk, a broad crown and exposed roots on the bank; stand it at the lip of a bank_roots piece', 6, 6, 9.5, 'plant', function(a){
  seed(34);
  a.line([0, 0, 0], [-1.0, 4.0, 0.2], 0.55, 'bark', 'wood'); a.line([-1.0, 4.0, 0.2], [-2.0, 7.0, 0.1], 0.4, 'ash', 'wood'); a.line([-1.0, 4.0, 0.2], [-2.8, 6.0, -1.1], 0.22, 'ash', 'wood'); a.line([-1.5, 5.0, 0.2], [0.2, 7.2, 0.7], 0.2, 'ash', 'wood');
  [[0, 0, 0], [-0.5, 1.0, 0.2]].forEach(function(p){ a.line([0.2, 0.4, 0.2], [1.3, -0.2, 0.9], 0.2, 'root', 'wood'); a.line([0.1, 0.4, -0.2], [0.9, -0.2, -1.0], 0.2, 'root', 'wood'); });
  for (var i = 0; i < 11; i++){ var cx = between(-4.2, 0.8), cy = between(6.0, 9.2), cz = between(-2.6, 2.4); a.bev(cx, cy, cz, between(1.8, 3.0), between(1.0, 1.8), between(1.8, 2.8), pick(['sapling', 'moss', 'mossD', K.willowD]), {m:'leaf'}); }
  a.pt('sway_0', 'sway', [-2.5, 8, 0]);
});
model('drift_line_4', 'Shore: drift line, 4 m', 'the line of flood leftovers on a bank: a windrow of twigs, reeds and leaves, a bleached branch, bits of foam, a plastic bottle and a bag; ground decal pieces 3 cm high; lay at x 1.0 to 1.5 of a gravel or shelf bank', 1.2, 4, 0.3, 'tile', function(a){
  seed(35);
  for (var i = 0; i < 22; i++) a.box(between(0.0, 0.5), 0.03 + rnd()*0.02, -1.95 + i*0.18 + between(-0.05, 0.05), between(0.25, 0.8), 0.02, 0.04, pick(['twig', 'twig', 'reed', 'leaf', 'barkD']), {rot:[0, between(0, 180), 0]});
  a.line([-0.2, 0.08, -1.1], [0.5, 0.12, -0.6], 0.07, 'wood', 'wood'); a.line([0.1, 0.1, 0.8], [-0.2, 0.14, 1.7], 0.05, 'wood', 'wood');
  for (var j = 0; j < 4; j++) a.box(between(-0.3, 0.6), 0.04, between(-1.8, 1.8), between(0.15, 0.3), 0.02, between(0.1, 0.25), 'foam');
  a.cyl(0.1, 0.07, 0.35, 0.04, 0.2, 'z', K.bottle); a.box(0.4, 0.04, -0.4, 0.2, 0.01, 0.18, K.bag);
});
model('fallen_tree_bank', 'Shore: tree fallen into the water, 8 m', 'a streamside tree down across the margin with its root wad on the bank and branches in the water; trapped foam and leaves on the upstream side, a calm pocket behind it; the trunk is 8 m along z, 0.2 m above the water; a sit-and-fish log and a fish shelter', 4, 8, 1.8, 'structure', function(a){
  seed(36);
  a.line([1.2, 0.8, -3.6], [-0.3, 0.2, 3.8], 0.5, 'bark', 'wood'); a.line([1.0, 0.7, -2.6], [-1.2, 0.0, -2.2], 0.12, 'bark', 'wood');
  for (var i = 0; i < 7; i++){ var t = i/6, z = -3.0 + t*6.2, x = 1.2 - t*1.5 + 0.1; a.line([x, 0.6 - t*0.5, z], [x - between(0.5, 1.4), between(-0.15, 0.2), z + between(-0.6, 0.6)], 0.09, 'barkD', 'wood'); }
  a.bev(1.6, 0.7, -4.0, 1.4, 1.2, 1.2, 'earthD'); [[0, 0.3], [0.4, -0.4], [-0.3, 0.1]].forEach(function(r){ a.line([1.6, 0.9, -4.0], [1.6 + r[0]*2, 1.8, -4.0 + r[1]*2], 0.1, 'root', 'wood'); });
  for (var j = 0; j < 6; j++) a.box(between(-0.7, 0.4), 0.012, between(-3.4, -1.0), between(0.2, 0.5), 0.01, between(0.15, 0.4), 'foam');
  a.box(-0.5, 0.012, 0.8, 1.0, 0.01, 1.6, 'waterL');
});
model('wet_margin_4', 'Shore: wet margin decal, 4 m', 'a darker, wet band of ground with glints along the waterline, 0.6 m wide, ends tapered, 1 cm above the ground; lay it at the foot of any bank or beach so the edge between dry and wet is soft', 0.8, 4, 0.02, 'tile', function(a){
  seed(37);
  for (var i = 0; i < 8; i++){ var z = -1.75 + i*0.5, w = between(0.35, 0.8); a.box(w/2 - 0.05, 0.01, z, w, 0.01, 0.5, K.wet); }
  for (var j = 0; j < 5; j++) a.box(between(0.0, 0.5), 0.02, between(-1.8, 1.8), between(0.1, 0.3), 0.005, 0.04, 'waterL');
});
model('mud_prints_4', 'Shore: tracks in the mud, 4 m', 'tracks at a water margin: deer hooves, a raccoon, heron toes and a boot; hide a hint of who drinks here; ground decals', 1.4, 4, 0.03, 'tile', function(a){
  seed(38);
  for (var i = 0; i < 5; i++){ var z = -1.6 + i*0.7; a.box(0.4, 0.015, z, 0.05, 0.015, 0.09, K.wet); a.box(0.52, 0.015, z + 0.02, 0.05, 0.015, 0.09, K.wet); }
  for (var j = 0; j < 4; j++){ var zj = 1.0 + j*0.25; [0, 0.06].forEach(function(o){ a.box(0.9 + o, 0.015, zj + o, 0.025, 0.012, 0.025, K.wet); }); }
  [-0.7, -0.3, 0.1].forEach(function(z, i){ a.box(1.0, 0.015, z, 0.12, 0.015, 0.28 - i*0.02, K.wet); a.box(1.0 + 0.25, 0.015, z + 0.1, 0.12, 0.015, 0.28, K.wet); });
});
model('mud_cracks_4', 'Shore: dried mud, 4 m', 'sun-baked mud on an exposed flat in a dry summer: pale polygon plates with dark cracks and curled edges; ground decals; for low water and the edge of a pond', 2.4, 4, 0.03, 'tile', function(a){
  seed(39);
  for (var i = 0; i < 20; i++){ var x = between(0.1, 2.2), z = between(-1.9, 1.9); a.box(x, 0.012, z, between(0.25, 0.5), 0.012, between(0.25, 0.5), pick(['earthL', 'sandD', 'earth']), {rot:[0, between(0, 90), 0]}); }
  for (var j = 0; j < 8; j++) a.box(between(0.2, 2.2), 0.008, between(-1.9, 1.9), 0.02, 0.01, between(0.3, 0.7), 'mud', {rot:[0, between(0, 180), 0]});
});

/* ============================== flow cues: water-surface pieces, y = 0.01 above the surface, water flows toward +z ============================== */
function wake(a, r, len, strength){
  /* a boulder (radius r) breaking the surface with a V of foam streaming downstream and a calm shadow behind it */
  a.rock(0, -0.4, 0, r*2, 0.4 + r*0.9, r*1.8, pick(['limeD', 'gravelD', 'dolo', 'lime']));
  a.box(0, 0.012, -r*1.1, r*2.6, 0.01, 0.12, 'foam'); a.box(0, 0.012, -r*0.95, r*1.7, 0.01, 0.1, 'foam');
  a.box(0, 0.011, r + len/2, r*1.2, 0.01, len, 'waterL');
  for (var i = 0; i < strength; i++){ var t = i/strength, zz = r*0.6 + t*len, off = r*0.8 + t*len*0.35, L = 0.7 + rnd()*0.7;
    [-1, 1].forEach(function(s){ a.box(s*off, 0.013, zz, 0.08, 0.01, L, 'foam', {rot:[0, -s*13, 0]}); }); }
  for (var k = 0; k < 5; k++) a.box(between(-r*0.6, r*0.6), 0.013, r + 0.2 + k*len/6, between(0.1, 0.3), 0.01, between(0.3, 0.7), 'foam');
}
model('rock_wake_s', 'Flow: small rock with wake', 'a boulder 0.5 m wide breaking the surface with a short V of foam streaming away downstream (+z), a bow ripple on the upstream face and a calm lighter shadow behind it; scatter in riffles and chutes; 1.6 m by 3 m', 1.6, 3, 0.7, 'structure', function(a){ seed(40); wake(a, 0.3, 2.2, 4); });
model('rock_wake_m', 'Flow: medium rock with wake', 'a boulder 1 m wide with a long V of foam, an upstream bow wave and a quiet eddy; 2.6 m by 5 m; use where the data shows shoals or rapids', 2.6, 5, 1.1, 'structure', function(a){ seed(41); wake(a, 0.55, 3.8, 6); });
model('rock_pair_chute', 'Flow: two rocks and a chute', 'two boulders with a gap between them and a V of fast water through the gap, standing waves below and foam on both outsides; for rapids and the head of a riffle; 5 m by 6 m', 5, 6, 1.1, 'structure', function(a){
  seed(42); [-1.3, 1.3].forEach(function(x){ a.rock(x, -0.4, 0, 1.2, 1.1, 1.1, pick(['limeD', 'dolo', 'lime'])); a.box(x, 0.012, -0.8, 1.7, 0.01, 0.1, 'foam'); });
  for (var i = 0; i < 5; i++){ var z = 0.9 + i*0.8, w = 0.5 + i*0.3; a.box(0, 0.02, z, w, 0.03, 0.14, 'foam'); a.box(-w*0.6, 0.015, z + 0.2, w*0.5, 0.02, 0.1, 'waterL'); a.box(w*0.6, 0.015, z + 0.2, w*0.5, 0.02, 0.1, 'waterL'); }
  a.box(0, 0.011, -0.6, 1.2, 0.01, 1.6, 'waterL');
});
model('flow_streaks_4', 'Flow: current streaks, 4 m', 'long pale streaks and darker lanes along the flow (+z) so a river tile reads as moving even when still; 4 m by 4 m; the game scrolls this piece slowly along +z, and the ends repeat cleanly at z = -2 and 2', 4, 4, 0.02, 'tile', function(a){
  seed(43);
  for (var i = 0; i < 9; i++){ var x = -1.8 + i*0.45 + between(-0.1, 0.1), L = between(0.9, 1.9), z = between(-2, 2 - L); a.box(x, 0.011, z + L/2, between(0.06, 0.12), 0.01, L, pick(['waterL', 'waterL', 'foam'])); }
  for (var j = 0; j < 4; j++){ var x2 = -1.6 + j*1.0 + between(-0.2, 0.2); a.box(x2, 0.01, 0, 0.35, 0.005, 4, 'waterD'); }
});
model('rapids_4', 'Flow: rapids, 4 m', 'a 4 m reach of fast shallow white water: chevrons of foam, humps over hidden rocks and a few rocks breaking the surface; for steep creeks; the chevrons point upstream; scroll along +z', 4, 4, 0.5, 'structure', function(a){
  seed(44);
  for (var i = 0; i < 8; i++){ var z = -1.8 + i*0.5, w = between(1.2, 3.2); a.box(0, 0.016, z, w, 0.02, 0.1, 'foam'); a.box(-w*0.4, 0.013, z + 0.18, w*0.3, 0.01, 0.08, 'waterL'); }
  for (var k = 0; k < 4; k++) a.rock(between(-1.5, 1.5), -0.3, between(-1.8, 1.8), between(0.3, 0.55), between(0.35, 0.55), between(0.3, 0.5), pick(['limeD', 'dolo', 'gravelD']));
  for (var m = 0; m < 6; m++) a.box(between(-1.7, 1.7), 0.02, between(-1.8, 1.8), between(0.3, 0.6), 0.04, 0.1, 'foam', {rot:[0, between(-30, 30), 0]});
});
model('eddy_4', 'Flow: eddy behind a point, 4 m', 'a slow circular eddy on the inside of a bend: a ring of spinning foam and floating leaves, calm lighter water at the middle, a seam where it meets the main current; 4 m by 4 m', 4, 4, 0.02, 'tile', function(a){
  seed(45);
  for (var i = 0; i < 12; i++){ var t = i/12*Math.PI*2, r = 1.2; a.box(Math.cos(t)*r, 0.012, Math.sin(t)*r, 0.5, 0.01, 0.1, 'foam', {rot:[0, -t*180/Math.PI + 90, 0]}); }
  for (var j = 0; j < 8; j++){ var u = j/8*Math.PI*2 + 0.3, r2 = 0.65; a.box(Math.cos(u)*r2, 0.012, Math.sin(u)*r2, 0.35, 0.01, 0.08, 'waterL', {rot:[0, -u*180/Math.PI + 90, 0]}); }
  for (var k = 0; k < 6; k++) a.box(between(-1.2, 1.2), 0.012, between(-1.2, 1.2), 0.1, 0.01, 0.07, pick(['leaf', 'leafY', 'leafR']));
  a.box(1.8, 0.011, 0, 0.1, 0.01, 3.4, 'foam');
});
model('foam_scum_4', 'Flow: foam line at the bank, 4 m', 'a line of dirty foam, leaves and pollen on the water along a slow bank, wider in the pockets, 4 m: the thin edge that says water meets land; lay at x = -0.2 to -0.6 beside any bank; unlike shore_foam it is broken and drifts', 0.9, 4, 0.02, 'tile', function(a){
  seed(46);
  var z = -2; while (z < 1.9){ var L = between(0.3, 0.9), w = between(0.12, 0.38); a.box(-0.1 - w/2, 0.012, z + L/2, w, 0.01, L, pick(['foam', 'foam', K.whiteW])); a.box(-0.1 - w*0.5, 0.013, z + L/2, w*0.5, 0.01, L*0.6, 'sandD'); z += L + between(0.1, 0.5); }
  for (var i = 0; i < 6; i++) a.box(between(-0.7, -0.1), 0.012, between(-1.9, 1.9), 0.08, 0.01, 0.06, pick(['leaf', 'leafY', 'twig']));
});
model('ledge_drop_4', 'Flow: low limestone ledge, 4 m', 'a natural step across a creek: a 0.5 m limestone ledge with water spilling over it in a white sheet, a plunge pool and foam below, moss on the lip; 4 m wide; the water falls toward +z; the creek-sized cousin of the weir', 4, 4, 0.7, 'structure', function(a){
  seed(47);
  a.box(0, -0.25, -0.6, 4.0, 0.5, 0.8, 'limeD'); a.box(0, -0.02, -0.6, 4.0, 0.06, 0.8, 'lime'); for (var i = 0; i < 6; i++) a.rock(-1.8 + i*0.72, -0.2, -0.6 + between(-0.2, 0.2), 0.8, 0.5, 0.7, pick(['limeD', 'lime', 'limeL']));
  a.box(0, -0.12, -0.18, 2.4, 0.5, 0.06, 'foam'); a.box(0, -0.35, 0.0, 2.2, 0.01, 0.05, 'waterL'); a.box(0, 0.011, 0.6, 3.2, 0.01, 1.2, 'waterD');
  for (var j = 0; j < 9; j++) a.box(between(-1.6, 1.6), 0.016, between(0.2, 1.3), between(0.3, 0.6), 0.01, 0.1, 'foam'); a.box(-1.9, 0.05, -0.55, 0.3, 0.06, 0.7, 'mossD'); a.box(1.9, 0.05, -0.55, 0.3, 0.06, 0.7, 'mossD');
});
model('stream_mouth_4', 'Flow: where a creek joins, 4 m', 'a small creek entering a river: a fan of gravel and silt, a sediment plume of paler water curling downstream and a seam of foam where the two currents meet; 4 m by 4 m; the little creek comes in from +x', 4, 4, 0.25, 'structure', function(a){
  seed(48);
  a.box(1.0, -0.15, 0, 3.0, 0.3, 1.8, 'sandD'); a.bev(0.2, -0.02, 0.2, 1.8, 0.08, 1.6, 'gravelW');
  for (var i = 0; i < 7; i++) a.box(1.6 - i*0.4, 0.012, 0.2 + i*0.2, 0.4, 0.01, 0.3 + i*0.06, pick(['waterL', 'sandD']));
  a.box(0.2, 0.013, 0, 2.0, 0.01, 0.2, 'foam'); a.box(0.2, 0.013, 0.9, 0.12, 0.01, 1.6, 'foam');
  for (var j = 0; j < 8; j++) a.rock(between(-0.3, 1.6), 0.0, between(-0.8, 1.0), 0.15, 0.08, 0.15, pick(['gravel', 'gravelW', 'chertL']));
});
model('seep_bank_4', 'Bank: spring seep, 4 m', 'a wet seep on a bank: pale water running down a mossy limestone face into the creek, watercress and ferns, dark streaks; 1.6 m above the water; Ozark creek banks are full of these', 3, 4, 1.8, 'structure', function(a){
  seed(49); a.bank([{x0:-0.4, x1:0.5, y:0.0, c:['mud', 'gravelD']}, {x0:0.5, x1:1.0, y:0.9, c:['limeD', 'lime']}, {x0:0.8, x1:1.3, y:1.5, c:['lime', 'limeL']}, {x0:1.2, x1:3, y:1.6, c:['grass', 'grassD']}], {jitter:0.04, cell:1.0});
  for (var i = 0; i < 4; i++){ var z = -1.2 + i*0.8; a.box(0.52, 0.7, z, 0.05, 1.3, 0.14, 'moss'); a.box(0.545, 0.7, z, 0.02, 1.2, 0.06, 'waterL'); }
  a.box(0.4, 0.04, 0, 0.5, 0.03, 3.0, K.cress); for (var j = 0; j < 7; j++) a.blade(between(0.3, 0.9), 0.05, between(-1.8, 1.8), between(0.2, 0.45), 0.04, between(-0.1, 0.1), between(-0.1, 0.1), K.cress);
  a.box(0.7, 0.2, 0, 0.5, 0.35, 3.2, 'mossD');
});

/* ============================== what a city creek collects ============================== */
model('creek_junk_cart', 'Junk: shopping cart in the creek', 'a rusted shopping cart on its side half buried in silt, a bag caught in the wire, algae on the lower wires; 1 m by 0.9 m; for any urban creek', 1.1, 0.9, 0.6, 'structure', function(a){
  seed(50);
  a.box(0, -0.05, 0, 0.9, 0.04, 0.6, K.cart, {rot:[0, 0, 12]}); [-0.3, 0.3].forEach(function(z){ a.box(0, 0.25, z, 0.9, 0.04, 0.03, K.cart, {rot:[0, 0, 12]}); a.box(0, 0.45, z, 0.9, 0.03, 0.03, K.cart); });
  [-0.4, -0.15, 0.1, 0.35, 0.45].forEach(function(x){ a.box(x, 0.22, 0, 0.025, 0.4, 0.6, K.cart); }); a.box(-0.45, 0.4, 0, 0.04, 0.5, 0.6, K.cart); a.box(0.5, 0.3, 0.3, 0.03, 0.5, 0.03, K.rustO);
  [-0.25, 0.25].forEach(function(z){ a.cyl(0.4, -0.08, z, 0.06, 0.04, 'z', 'dark'); }); a.box(0.1, 0.35, -0.1, 0.25, 0.2, 0.15, K.bag); a.box(0, -0.12, 0, 1.1, 0.12, 0.8, K.algae);
});
model('creek_junk_tyres', 'Junk: tyres in the shallows', 'three old tyres, one standing against the bank and two flat in the silt, with a plastic bucket; for urban creeks and old farm banks', 1.4, 1.2, 0.5, 'structure', function(a){
  seed(51);
  a.cyl(0, -0.03, 0, 0.32, 0.22, 'y', K.tyre); a.cyl(0, -0.03, 0, 0.14, 0.23, 'y', 'earthD'); a.cyl(0.55, 0.04, 0.3, 0.32, 0.22, 'y', K.tyre); a.cyl(0.55, 0.04, 0.3, 0.14, 0.23, 'y', 'mud');
  a.cyl(-0.5, 0.3, 0.4, 0.32, 0.22, 'z', K.tyre, {rot:[0, 25, 0]}); a.cyl(-0.5, 0.3, 0.4, 0.14, 0.23, 'z', 'earthD', {rot:[0, 25, 0]}); a.box(0.05, 0.1, -0.55, 0.3, 0.3, 0.3, K.blue, {rot:[0, 0, -40]});
  a.box(0, -0.12, 0, 1.6, 0.1, 1.4, K.algae);
});
model('creek_junk_pallet_a', 'Junk: pallet and trash in the weeds', 'a wooden pallet half in the water, plastic bags and bottles hung in the weeds above it, a flood-line in debris on the bank 1 m above the water; for the downtown creeks after rain', 1.6, 1.8, 1.3, 'structure', function(a){
  seed(52);
  for (var i = 0; i < 4; i++) a.box(-0.25 + i*0.17, 0.08, 0, 0.12, 0.03, 1.1, K.pallet, {rot:[0, 0, 8]}); [-0.5, 0, 0.5].forEach(function(z){ a.box(0, 0.02, z, 0.8, 0.07, 0.1, K.pallet, {rot:[0, 0, 8]}); });
  for (var j = 0; j < 7; j++) a.box(between(-0.7, 0.8), between(0.5, 1.2), between(-0.8, 0.9), between(0.1, 0.25), between(0.02, 0.1), between(0.1, 0.2), pick([K.bag, K.bag, K.blue, K.bottle, K.glass]));
  for (var k = 0; k < 9; k++) a.blade(between(0.3, 0.9), 0.4, between(-0.8, 0.9), between(0.5, 1.0), 0.04, between(-0.1, 0.1), between(-0.1, 0.1), K.sedgeD);
});
model('creek_junk_bike', 'Junk: bicycle frame in the silt', 'a rusted bicycle frame with one wheel sticking out of the water at the bank, a chain trailing, algae on the tube; for any creek the city has lived beside', 1.4, 0.4, 0.8, 'structure', function(a){
  seed(53);
  a.line([-0.4, 0.15, 0], [0.1, 0.5, 0], 0.04, K.rustO, 'steel'); a.line([0.1, 0.5, 0], [0.5, 0.15, 0], 0.04, K.rustO, 'steel'); a.line([-0.4, 0.15, 0], [0.5, 0.15, 0], 0.035, K.rustO, 'steel'); a.line([0.1, 0.5, 0], [0.12, 0.7, 0], 0.04, K.rustO, 'steel');
  a.line([0.12, 0.7, 0], [0.35, 0.72, 0], 0.03, 'steelD', 'steel'); a.cyl(0.6, 0.35, 0, 0.35, 0.03, 'z', K.tyre); a.cyl(0.6, 0.35, 0, 0.3, 0.04, 'z', 'dark'); a.cyl(-0.5, 0.0, 0.0, 0.3, 0.03, 'z', K.tyre);
  a.box(-0.1, -0.1, 0.05, 1.4, 0.08, 0.4, K.algae); a.line([-0.4, 0.15, 0.05], [-0.9, -0.05, 0.2], 0.015, K.rustO, 'steel');
});

/* ---- the pack ---- */
fs.writeFileSync(root + 'packs/afterstreet-waterways.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-waterways.js:', pack.assets.length, 'models');
