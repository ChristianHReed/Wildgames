/* Adds the brick footbridge pieces to assets/shaped/structures.js (the main chat's request of 1 November 2026): deck_path_brick, abutment_path_brick,
   arch_path_brick_8, pier_cap_path_brick. Built with the Workshop engine; the same measurements as deck_path / abutment_path / pier_cap_path so the game swaps them in.
   Run: node workshop/tools/make_brick_path.js (safe to run again: the pieces are replaced, the rest of the pack is untouched). */
global.window = global;
var root = __dirname + '/../../', fs = require('fs'), cp = require('child_process');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/structures.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var S = SHAPED.structures, models = S.models.structures, built = {}, info = {};
var PAL = {brick:'#a0503c', brickD:'#7c3a2c', brickL:'#b4644c', stonePale:'#cfc8b6', stonePaleD:'#b3ab98', paveBrick:'#94604c'};

function model(name, label, note, w, len, h, build){
  var d = M.newModelDoc('structure', 'structures', 'structures', name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var api = {
    box:function(x, y, z, sx, sy, sz, c){ return M.addPiece(d, 'box', [x, y, z], {d:[sx, sy, sz], c:c, m:'stone'}); },
    both:function(x, y, z, sx, sy, sz, c){ api.box(x, y, z, sx, sy, sz, c); if (x !== 0) api.box(-x, y, z, sx, sy, sz, c); },
    bar:function(a, b, t, wide, c){ var dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2], L = Math.sqrt(dx*dx + dy*dy + dz*dz), mid = [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2];
      var pitch = -Math.atan2(dy, Math.sqrt(dx*dx + dz*dz)) * 180/Math.PI;
      return M.addPiece(d, 'box', mid, {d:[wide, t, L], c:c, m:'stone', rot:[pitch, 0, 0]}); }
  };
  build(api);
  var A = M.buildModelAsset(d); models[name] = A.value; info[name] = {w:w, len:len, h:h, note:note}; built[name] = 1;
}

/* the walking surface, parapets, string course and pilasters of one 4 m length; z0 is the middle of the unit, len its length */
function top(a, z0, len, pilaster){
  a.box(0, 0.009, z0, 2.2, 0.02, len, 'paveBrick');
  a.both(0.95, 0.011, z0, 0.14, 0.02, len, 'brickD');                           /* a darker border course along each wall */
  a.both(1.3, 0.55, z0, 0.4, 1.1, len, 'brick');                                /* the parapet, 1.1 m with its coping */
  a.both(1.3, 1.1, z0, 0.56, 0.1, len, 'stonePale');
  [0.3, 0.6, 0.9].forEach(function(y){ a.both(1.505, y, z0, 0.012, 0.05, len, 'brickD'); a.both(1.095, y, z0, 0.012, 0.05, len, 'brickD'); });   /* soldier courses */
  a.both(1.53, -0.12, z0, 0.14, 0.12, len, 'stonePale');                       /* string course under the deck edge */
  if (pilaster){ a.both(1.3, 0.53, z0, 0.52, 1.06, 0.5, 'brickL'); a.both(1.3, 1.19, z0, 0.62, 0.08, 0.62, 'stonePaleD'); }
}

model('deck_path_brick', 'Brick footbridge deck, 4 m', 'a flat 4 m unit of a brick footbridge: brick parapets 1.1 m high with pale stone coping, brick paving and a stone string course under the deck edge; origin on the walking surface (y = 0.02); the ends meet cleanly', 3, 4, 1.25, function(a){
  a.box(0, -0.15, 0, 3.0, 0.3, 4.0, 'brickD'); a.box(0, -0.25, 0, 2.9, 0.1, 4.0, 'brick');
  top(a, 0, 4, true);
});

model('abutment_path_brick', 'Brick footbridge abutment', 'brick abutment for the footbridge: deck end at z = 0, y from -3 to 0.02, z from -4.5 (the bank) to 0.7 (the river face); stone coping and plinth, wing walls hold the bank', 4.6, 5.2, 3.1, function(a){
  a.box(0, -1.5, -0.55, 3.6, 3, 2.5, 'brick');                                  /* the solid body */
  a.box(0, -2.75, 0.73, 3.8, 0.5, 0.2, 'stonePaleD');                           /* footing */
  a.box(0, -0.2, 0.74, 3.7, 0.16, 0.08, 'stonePale');                           /* string course on the river face */
  [-2.6, -1.6, -0.6].forEach(function(y){ a.box(0, y, 0.705, 3.6, 0.04, 0.02, 'brickD'); });
  a.box(0, -0.04, -0.4, 3.0, 0.12, 2.0, 'paveBrick'); a.box(0, 0.009, 0.1, 2.2, 0.02, 1.2, 'paveBrick');
  a.both(1.3, 0.55, -0.4, 0.4, 1.1, 2.2, 'brick'); a.both(1.3, 1.1, -0.4, 0.56, 0.1, 2.2, 'stonePale');   /* the parapet runs on over the abutment */
  a.both(1.3, 0.53, 0.5, 0.52, 1.06, 0.4, 'brickL'); a.both(1.3, 1.19, 0.5, 0.62, 0.08, 0.5, 'stonePaleD');
  /* wing walls: brick, stone coping, a battered foot */
  a.both(2.05, -1.5, -2.5, 0.5, 3.0, 4.0, 'brick'); a.both(2.05, -0.05, -2.5, 0.64, 0.14, 4.1, 'stonePale');
  a.both(2.05, -2.8, -2.5, 0.64, 0.4, 4.1, 'stonePaleD'); a.both(2.31, -1.5, -2.5, 0.012, 0.1, 4.0, 'brickD');
  a.box(0, -1.5, -1.85, 3.6, 3.0, 0.5, 'brickD');                               /* back wall */
  a.box(0, -0.04, -2.2, 3.6, 0.12, 0.5, 'stonePaleD');
});

model('arch_path_brick_8', 'Brick arch footbridge span, 8 m', 'an 8 m brick arch for the footbridge: a segmental ring rising from skewbacks 3.4 m below the deck to 0.9 m below it, spandrel walls and fill above, the same parapets as deck_path_brick; 3 m wide; set a pier or abutment at each end', 3, 8, 4.4, function(a){
  var R = 4.45, cy = -5.35, N = 12, ang = Math.asin(4 / R), T = 0.55;
  for (var i = 0; i < N; i++){
    var t0 = -ang + 2*ang*i/N, t1 = -ang + 2*ang*(i + 1)/N, Rm = R + T/2;
    var A0 = [0, cy + Rm*Math.cos(t0), Rm*Math.sin(t0)], A1 = [0, cy + Rm*Math.cos(t1), Rm*Math.sin(t1)];
    a.bar(A0, A1, T, 3.0, i % 2 ? 'brickD' : 'brick');                          /* a voussoir run, alternate colours so the ring reads */
  }
  a.box(0, -0.2, 0, 3.0, 0.1, 8.0, 'brick');                                     /* deck soffit */
  for (var j = 0; j < 16; j++){
    var z0 = -4 + j*0.5, zm = z0 + 0.25, zf = Math.max(Math.abs(z0), Math.abs(z0 + 0.5)), Re = R + T + 0.02, ye = cy + Math.sqrt(Math.max(Re*Re - zf*zf, 0)), hgt = -0.25 - ye;
    if (hgt > 0.05){ a.both(1.3, ye + hgt/2, zm, 0.4, hgt, 0.5, 'brick'); a.box(0, ye + hgt/2, zm, 2.2, hgt, 0.5, 'brickD'); }
  }
  [-1, 1].forEach(function(s){ a.box(0, -3.8, s*3.75, 3.2, 0.8, 0.5, 'stonePale'); });   /* skewbacks */
  a.box(0, -0.1, 0, 3.0, 0.2, 8.0, 'brick');
  top(a, -2, 4, true); top(a, 2, 4, true);
});

model('pier_cap_path_brick', 'Brick footbridge pier cap', 'a brick pier cap with a pale stone slab, the same footprint as pier_cap_path (1 x 0.8 m) and the same height, for long brick spans', 1, 0.8, 0.3, function(a){
  a.box(0, -0.52, 0, 1.0, 0.16, 0.8, 'brick'); a.box(0, -0.38, 0, 1.1, 0.12, 0.9, 'stonePale');
});

/* palette, info, then write the pack back as it was (header line, then the object) and recount the triangles */
Object.keys(PAL).forEach(function(k){ S.palette[k] = PAL[k]; });
Object.keys(info).forEach(function(k){ S.info[k] = info[k]; });
var file = root + 'assets/shaped/structures.js', head = fs.readFileSync(file, 'utf8').split('\n')[0];
S.stats = S.stats || {};
fs.writeFileSync(file, head + '\n(window.SHAPED = window.SHAPED || {}).structures = ' + JSON.stringify(S) + ';\n');
var st = JSON.parse(cp.execFileSync('node', [root + 'assets/shaped/src/stats.js', 'structures'], {encoding:'utf8'}));
S.stats = st; fs.writeFileSync(file, head + '\n(window.SHAPED = window.SHAPED || {}).structures = ' + JSON.stringify(S) + ';\n');
console.log('added', Object.keys(built).map(function(k){ return k + ' ' + (st['structures.' + k] || [])[0] + ' tris'; }).join(', '));
