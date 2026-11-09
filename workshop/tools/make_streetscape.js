/* Builds packs/afterstreet-streetscape.js: street, roof and roadside pieces from the visual reference request (8 November 2026).
   Made-up brands only. Run: node workshop/tools/make_streetscape.js */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); require(root + 'assets/shaped/land.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'afterstreet-streetscape', name:'AfterStreet streetscape', author:'AfterStreet content chat', licence:'MIT',
  notes:'Street, roof and roadside pieces: fire escapes, roof unit sets, booths, burning barrel, camp tents, house parts, signs, strip mall, rural gas station, ground decals and tall grass.'});
var C = function(h){ return M.customName(h); };
var K = {brick:C('#8a4a3a'), brickD:C('#6e3a2e'), conc:C('#9a988e'), concD:C('#7a786e'), concL:C('#b4b2a6'), iron:C('#3a3d40'), ironL:C('#55595c'), rust:C('#7a4a30'), tin:C('#a8adb0'), tinD:C('#868b8e'),
  white:C('#e4e2da'), cream:C('#d8cfae'), red:C('#a8362c'), yel:C('#d8b02c'), grn:C('#4a6a44'), grnD:C('#364e32'), blu:C('#3e5a78'), bluD:C('#2e4660'), teal:C('#3f7a78'), org:C('#d0702c'), orgD:C('#a85420'),
  wood:C('#8a6a46'), woodD:C('#6a5034'), woodL:C('#b0916a'), sage:C('#8a9468'), sageD:C('#6a7450'), grass:C('#6a8a40'), grassL:C('#8aa850'), grassD:C('#4a6a30'), dry:C('#b0a060'), dirt:C('#6a5a44'), oil:C('#26272a'),
  lamp:C('#f0e0a0'), fire:C('#f08a28'), fireL:C('#f8c850'), lens:'glassTint', rub:C('#26272a'), pl:C('#c8c4b6'), siding:C('#cfc9b4'), roofG:C('#4a4e52'), tarp:C('#4a6a8a')};
var info = {};
function fix(d){ d.colours = d.colours || {}; d.colours.glassTint = '#86a8b4'; var pal = SHAPED.land.palette;
  d.pieces.forEach(function(p){ if (typeof p.c !== 'string' || /^x[0-9a-fA-F]{6}/.test(p.c) || p.c === 'glassTint') return; var dark = /_D$/.test(p.c), nm = p.c.replace(/_D$/, ''); if (pal[nm]) return; var hex = SHAPED.props.palette[nm]; if (!hex) return; var cn = M.customName(hex); d.colours[cn] = hex; p.c = cn + (dark ? '_D' : ''); }); }
function model(name, label, note, w, len, h, build){
  var d = M.newModelDoc('structure', 'land', 'land', name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var a = {
    box:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'box', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'sheet'}, o || {})); },
    bev:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'bev', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'sheet'}, o || {})); },
    wedge:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'wedge', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'sheet'}, o || {})); },
    cyl:function(x, y, z, r, len, ax, c, o){ var dd = ax === 'z' ? [r*2, r*2, len] : ax === 'x' ? [len, r*2, r*2] : [r*2, len, r*2]; return M.addPiece(d, 'cyl', [x, y, z], Object.assign({d:dd, ax:ax, c:c, m:'steel'}, o || {})); },
    cone:function(x, y, z, r, hh, c, o){ return M.addPiece(d, 'cone', [x, y, z], Object.assign({scl:[r/0.12, hh/0.3, r/0.12], c:c, m:'cloth'}, o || {})); },
    glow:function(x, y, z, sx, sy, sz, c){ return M.addPiece(d, 'box', [x, y, z], {d:[sx, sy, sz], c:c || K.lamp, m:'glass', glow:true}); },
    pane:function(x, y, z, sx, sy, sz){ return M.addPiece(d, 'box', [x, y, z], {d:[sx, sy, sz], c:K.lens, m:'glass'}); },
    raw:function(shape, pos, o){ return M.addPiece(d, shape === 'decal' ? 'plate' : shape, pos, o); },
    pt:function(n, k, pos, dir){ M.addPoint(d, n, k, pos, dir || [0, 1, 0]); }
  };
  build(a); fix(d); d.extra = [{path:['info', name], value:{w:w, len:len, h:h, note:note}}]; M.addModelToPack(pack, d); info[name] = 1;
}
function gable(a, x, y, z, w, h, len, c, m){ return a.raw('prism', [x, y, z], {scl:[w/0.3118, h/0.27, len/0.4], c:c, m:m || 'sheet'}); }
/* ============================================ A. street clutter and roofs ============================================ */
/* one landing per floor: 3 m storey; wall at z = 0, platform out to +z. A steep stair runs along the wall from the landing's far end down to the next landing; alternate floors with the _mirror piece so the stairs zigzag */
function fireEscape(sx){ return function(a){
  var H = 3.0, ang = Math.atan2(2.9, 2.0)*180/Math.PI, L = Math.sqrt(2.9*2.9 + 2.0*2.0);
  a.box(0, H - 0.03, 0.6, 2.4, 0.05, 1.2, K.iron, {m:'steel'}); a.box(0, H - 0.12, 0.6, 2.4, 0.1, 0.05, K.ironL, {m:'steel'}); a.box(0, H - 0.12, 1.15, 2.4, 0.1, 0.05, K.ironL, {m:'steel'});
  [-1.18, 1.18].forEach(function(x){ a.box(x, H + 0.48, 0.6, 0.04, 0.04, 1.2, K.iron, {m:'steel'}); a.box(x, H + 0.95, 0.6, 0.05, 0.05, 1.2, K.iron, {m:'steel'}); [0.02, 0.6, 1.18].forEach(function(z){ a.box(x, H + 0.5, z, 0.04, 1.0, 0.04, K.iron, {m:'steel'}); }); });
  a.box(0, H + 0.95, 1.18, 2.4, 0.05, 0.05, K.iron, {m:'steel'}); a.box(0, H + 0.48, 1.18, 2.4, 0.04, 0.04, K.iron, {m:'steel'}); [-0.6, 0.6].forEach(function(x){ a.box(x, H + 0.5, 1.18, 0.04, 1.0, 0.04, K.iron, {m:'steel'}); });
  [0.3, 0.9].forEach(function(z){ a.box(sx*0.0, 1.5 + 0.02, z, L, 0.07, 0.05, K.iron, {m:'steel', rot:[0, 0, sx*ang]}); });
  for (var i = 0; i < 10; i++){ var f = i/9, x = sx*(1.0 - 2.0*f), y = 2.9 - 2.8*f; a.box(x, y, 0.6, 0.24, 0.04, 0.7, K.ironL, {m:'steel'}); }
  [0.2, 1.0].forEach(function(z){ a.box(0, 1.5 + 0.85, z, L - 0.9, 0.04, 0.04, K.iron, {m:'steel', rot:[0, 0, sx*ang]}); });
  [-1.0, 1.0].forEach(function(x){ a.box(x, H - 0.5, 0.05, 0.06, 1.0, 0.06, K.rust, {m:'steel'}); });
  a.box(0, H - 0.15, 0.02, 2.4, 0.08, 0.04, K.rust, {m:'steel'});
  a.pt('stairs', 'stairs', [sx*0.0, 1.5, 0.6], [sx*-1, -1, 0]); }; }
model('fire_escape_floor_3', 'Fire escape, one floor', 'One storey (3 m) of a steel fire escape for brick tenements: a 2.4 m landing with rail and plate floor, anchored to the wall, and a steep stair along the wall down to the next landing. Stack one per floor; use the _mirror piece on alternate floors so the stairs zigzag. Wall side at z = 0, platform toward +z. Stairs point for climbing later.', 2.4, 1.3, 4.0, fireEscape(1));
model('fire_escape_floor_3_mirror', 'Fire escape, one floor (mirror)', 'The same fire escape storey with the stair running the other way; alternate with fire_escape_floor_3.', 2.4, 1.3, 4.0, fireEscape(-1));
model('fire_escape_drop_ladder', 'Fire escape, drop ladder', 'The counterweighted ladder that swings down from the lowest landing to the pavement; 3 m, rungs every 0.3 m, wall side at z = 0.', 0.6, 0.4, 3.2, function(a){
  [-0.25, 0.25].forEach(function(x){ a.box(x, 1.5, 0.3, 0.05, 3.1, 0.05, K.iron, {m:'steel'}); }); for (var i = 0; i < 10; i++) a.box(0, 0.2 + i*0.3, 0.3, 0.5, 0.04, 0.04, K.ironL, {m:'steel'}); a.pt('stairs', 'stairs', [0, 1.5, 0.3], [0, 1, 0]); });
/* roof units: S 3x3 m, M 5x5 m, L 8x8 m; flat footprints with 0.1 m curb, placed at y = 0 on the roof surface */
function unit(a, x, z, kind, rot){ var o = rot ? {rot:[0, rot, 0]} : {};
  if (kind === 'ac'){ a.box(x, 0.45, z, 1.0, 0.7, 0.8, K.tin, o); a.cyl(x, 0.82, z, 0.34, 0.06, 'y', K.iron); a.box(x, 0.12, z, 1.1, 0.14, 0.9, K.concD, {m:'stone'}); }
  if (kind === 'ac2'){ a.box(x, 0.4, z, 1.6, 0.6, 0.9, K.pl, o); [-0.4, 0.4].forEach(function(s){ a.cyl(x + s, 0.72, z, 0.3, 0.05, 'y', K.iron); }); a.box(x, 0.1, z, 1.7, 0.12, 1.0, K.concD, {m:'stone'}); }
  if (kind === 'vent'){ a.cyl(x, 0.25, z, 0.14, 0.5, 'y', K.tin); a.cone(x, 0.62, z, 0.24, 0.2, K.tinD, {m:'steel'}); }
  if (kind === 'hatch'){ a.box(x, 0.25, z, 0.9, 0.5, 0.9, K.concL, {m:'stone'}); a.wedge(x, 0.58, z, 1.0, 0.18, 1.0, K.iron, {rot:[0, 90, 0]}); a.box(x, 0.12, z, 1.0, 0.06, 1.0, K.concD, {m:'stone'}); }
  if (kind === 'dish'){ a.cyl(x, 0.2, z, 0.04, 0.4, 'y', K.tin); a.cyl(x, 0.62, z, 0.36, 0.05, 'z', K.white, {rot:[30, rot || 0, 0]}); a.cyl(x, 0.5, z - 0.05, 0.02, 0.3, 'y', K.iron); }
  if (kind === 'tank'){ [-0.4, 0.4].forEach(function(s){ [-0.4, 0.4].forEach(function(t){ a.box(x + s, 0.6, z + t, 0.08, 1.2, 0.08, K.woodD, {m:'wood'}); }); }); a.cyl(x, 1.9, z, 0.7, 1.3, 'y', K.wood, {m:'wood', n:10}); a.cone(x, 2.75, z, 0.78, 0.35, K.woodD, {m:'wood'}); a.box(x, 1.2, z, 1.0, 0.05, 1.0, K.woodD, {m:'wood'}); }
  if (kind === 'duct'){ a.box(x, 0.35, z, 0.5, 0.45, 2.4, K.tin, {m:'sheet', rot:[0, rot || 0, 0]}); a.box(x, 0.12, z, 0.1, 0.25, 2.4, K.iron, {rot:[0, rot || 0, 0]}); }
  if (kind === 'ladder'){ [-0.2, 0.2].forEach(function(s){ a.box(x + s, 0.6, z, 0.04, 1.2, 0.04, K.iron); }); for (var i = 0; i < 4; i++) a.box(x, 0.2 + i*0.3, z, 0.4, 0.03, 0.03, K.ironL); a.box(x, 0.05, z, 0.5, 0.1, 0.1, K.concD, {m:'stone'}); }
  if (kind === 'pipe'){ var rr = (rot || 0)*Math.PI/180, dx = Math.sin(rr)*0.8, dz = Math.cos(rr)*0.8; a.cyl(x, 0.3, z, 0.07, 2.0, 'z', K.tinD, {rot:[0, rot || 0, 0]}); [-1, 1].forEach(function(q){ a.box(x + q*dx, 0.15, z + q*dz, 0.06, 0.3, 0.06, K.iron); }); }
  if (kind === 'box'){ a.box(x, 0.4, z, 0.9, 0.8, 0.6, K.concL, {m:'stone'}); a.box(x, 0.82, z, 1.0, 0.06, 0.7, K.concD, {m:'stone'}); }
}
model('roof_units_s', 'Roof units, small', 'A 3 m by 3 m patch for a small flat roof: an air conditioner, a vent stack, a roof hatch and a pipe run. Place on the roof surface at y = 0.', 3, 3, 1.0, function(a){ unit(a, -0.8, -0.6, 'ac'); unit(a, 0.9, 0.9, 'hatch'); unit(a, 0.9, -0.9, 'vent'); unit(a, -1.1, 1.0, 'pipe', 90); });
model('roof_units_m', 'Roof units, medium', 'A 5 m by 5 m patch for a shop or block roof: two air conditioners, vents, a roof hatch with a ladder, a duct run, a satellite dish and a control box.', 5, 5, 1.4, function(a){
  unit(a, -1.6, -1.6, 'ac2'); unit(a, 1.4, -1.8, 'ac'); unit(a, -1.8, 0.8, 'duct', 90); unit(a, 1.8, 1.4, 'hatch'); unit(a, 1.8, 0.4, 'ladder'); unit(a, 0.0, -0.1, 'vent'); unit(a, -0.6, 1.9, 'vent'); unit(a, 0.2, 1.7, 'dish', 20); unit(a, 0.8, -0.8, 'box'); });
model('roof_units_l', 'Roof units, large', 'An 8 m by 8 m patch for a warehouse or apartment block roof: four air conditioners, a wooden water tank on legs, ducts, vents, a hatch with ladder, a dish and boxes.', 8, 8, 3.1, function(a){
  unit(a, -2.8, -2.8, 'ac2'); unit(a, -2.8, -1.4, 'ac2'); unit(a, 0.4, -3.0, 'ac'); unit(a, 1.8, -3.0, 'ac'); unit(a, 2.6, 0.6, 'tank'); unit(a, -3.0, 1.0, 'duct', 90); unit(a, -1.0, 0.2, 'duct', 0); unit(a, -3.0, 3.0, 'hatch'); unit(a, -3.0, 2.0, 'ladder');
  unit(a, 0.2, 2.2, 'vent'); unit(a, 1.0, 3.0, 'vent'); unit(a, -0.6, 3.2, 'dish', 40); unit(a, 3.0, -1.6, 'box'); unit(a, 0.4, -1.4, 'pipe', 0); });
model('guard_booth', 'Guard booth', 'A small street guard booth 1.6 m by 1.6 m: white walls, a sliding window pane on three sides, a flat roof with a lamp, a door in the back and a striped bar; cover and a quick loot spot.', 1.8, 1.8, 2.6, function(a){
  a.box(0, 0.05, 0, 1.8, 0.1, 1.8, K.concD, {m:'stone'}); a.box(0, 0.65, 0, 1.6, 1.1, 1.6, K.white); a.box(0, 1.55, 0, 1.6, 0.8, 1.6, K.white);
  [[0, 0.82], [0.82, 0], [-0.82, 0]].forEach(function(p, i){ i ? a.pane(p[0], 1.55, p[1], 0.04, 0.7, 1.3) : a.pane(p[0], 1.55, p[1], 1.3, 0.7, 0.04); }); a.box(0, 1.1, 0.83, 1.5, 0.08, 0.1, K.yel);
  a.box(0, 2.05, 0, 1.9, 0.16, 1.9, K.concD); a.box(0, 2.18, 0, 0.3, 0.1, 0.3, K.iron); a.glow(0, 2.1, 0.96, 0.4, 0.06, 0.06); a.box(0, 0.8, -0.82, 0.7, 1.5, 0.04, K.yel, {m:'sheet'}); a.box(0, 0.5, 0.82, 1.5, 0.06, 0.04, K.red); });
model('phone_stand', 'Public phone stand', 'A hooded payphone on a steel post with a coin box and a lit number panel, 1.0 m wide; vandal-proof, with a small shelf.', 0.8, 0.6, 2.1, function(a){
  a.box(0, 0.05, 0, 0.8, 0.1, 0.6, K.concD, {m:'stone'}); a.box(0, 0.8, -0.2, 0.1, 1.6, 0.1, K.iron); a.box(0, 1.55, 0, 0.7, 0.7, 0.3, K.blu); a.box(0, 1.95, 0.05, 0.8, 0.12, 0.5, K.bluD); a.box(0, 1.5, 0.16, 0.5, 0.4, 0.04, K.ironL); a.box(0.28, 1.5, 0.19, 0.06, 0.3, 0.06, K.rub); a.glow(0, 1.78, 0.16, 0.3, 0.1, 0.03); a.box(0, 1.15, 0.2, 0.5, 0.04, 0.24, K.iron); });
model('burning_barrel', 'Burning barrel', 'A rusted 200 L drum with holes punched near the rim and a fire burning inside, a few bricks round the base; a survivor camp light at night. Point "fire" is where the game lights a flame and a point light (about 8 m, warm orange).', 0.9, 0.9, 1.5, function(a){
  a.cyl(0, 0.45, 0, 0.3, 0.9, 'y', K.rust, {n:10}); a.cyl(0, 0.9, 0, 0.32, 0.04, 'y', K.iron, {n:10}); a.cyl(0, 0.9, 0, 0.26, 0.03, 'y', K.oil, {n:10}); for (var i = 0; i < 4; i++){ var t = i*Math.PI/2; a.box(Math.sin(t)*0.31, 0.7, Math.cos(t)*0.31, 0.04, 0.1, 0.04, K.oil, {rot:[0, i*90, 0]}); }
  a.glow(0, 1.02, 0, 0.36, 0.14, 0.36, K.fire); a.glow(0.02, 1.14, 0.02, 0.2, 0.18, 0.2, K.fireL); a.cone(0.02, 1.3, 0.02, 0.1, 0.25, K.fire, {glow:true}); [0, 120, 240].forEach(function(r){ a.box(0, 0.08, 0.46, 0.22, 0.14, 0.12, K.brickD, {m:'stone', rot:[0, r, 0]}); });
  a.pt('fire', 'light', [0, 1.2, 0], [0, 1, 0]); a.pt('fire_emit', 'emit', [0, 1.1, 0], [0, 1, 0]); a.pt('smoke', 'smoke', [0, 1.5, 0], [0, 1, 0]); });
model('wheelie_bins_pair', 'Wheelie bins, pair', 'Two kerbside wheelie bins, one green and one blue, 0.6 m wide each, lids closed; set them at the kerb on collection day.', 1.4, 0.7, 1.1, function(a){
  [[-0.38, K.grn, K.grnD], [0.38, K.blu, K.bluD]].forEach(function(b){ a.bev(b[0], 0.5, 0, 0.58, 1.0, 0.62, b[1], {m:'plastic'}); a.bev(b[0], 1.04, 0, 0.62, 0.1, 0.66, b[2], {m:'plastic'}); a.box(b[0], 0.1, -0.31, 0.5, 0.2, 0.04, K.rub, {m:'rubber'}); a.cyl(b[0], 0.07, -0.25, 0.07, 0.56, 'x', K.rub, {m:'rubber'}); a.box(b[0], 0.9, 0.33, 0.3, 0.06, 0.04, K.rub); }); });
/* ============================================ B. ground wear, grass ============================================ */
/* flat irregular decals */
function blob(a, cx, cz, rx, rz, c, y, seed, n){ n = n || 9; var v = []; for (var i = 0; i < n; i++){ var t = i/n*Math.PI*2, r = 0.7 + 0.3*Math.sin(seed*7.1 + i*2.3)*Math.cos(seed + i*1.7); v.push([cx + Math.cos(t)*rx*r, y, cz + Math.sin(t)*rz*r]); }
  var q = a.raw('decal', [0, 0, 0], {v:v, n:[0, 1, 0], c:c, m:'stone'}); return q; }
model('oil_stain_decal', 'Oil stain', 'A dark irregular oil stain about 1.6 m across with a smaller drip beside it: a flat decal 2 cm above the ground for parking bays, garages and drives.', 1.8, 1.8, 0.03, function(a){ blob(a, 0, 0, 0.8, 0.65, K.oil, 0.02, 1); blob(a, 0.6, 0.55, 0.28, 0.22, K.oil, 0.025, 2, 7); blob(a, -0.45, -0.5, 0.2, 0.16, K.oil, 0.025, 3, 7); });
model('wheel_track_decal_4', 'Wheel tracks, 4 m', 'Two darker strips of worn tarmac 4 m long, 1.5 m apart, with a faint drip stain between: tiles along z on drives and parking lot lanes.', 2.0, 4, 0.03, function(a){ [-0.75, 0.75].forEach(function(x){ a.raw('decal', [0, 0, 0], {v:[[x - 0.14, 0.02, -2], [x + 0.14, 0.02, -2], [x + 0.17, 0.02, 2], [x - 0.17, 0.02, 2]], n:[0, 1, 0], c:K.oil, m:'stone'}); }); blob(a, 0, 0.6, 0.3, 0.12, K.oil, 0.025, 4, 7); });
model('worn_path_decal_4', 'Worn path, 4 m', 'A 1 m wide strip of bare dirt worn into grass, with ragged edges, 4 m long; tiles along z where people cut corners.', 1.4, 4, 0.03, function(a){ var v = [[-0.5, 0.02, -2], [-0.62, 0.02, -1], [-0.45, 0.02, 0], [-0.58, 0.02, 1], [-0.5, 0.02, 2], [0.5, 0.02, 2], [0.6, 0.02, 1], [0.44, 0.02, 0], [0.56, 0.02, -1], [0.5, 0.02, -2]]; a.raw('decal', [0, 0, 0], {v:v, n:[0, 1, 0], c:K.dirt, m:'earth'}); a.raw('decal', [0, 0, 0], {v:[[-0.2, 0.025, -1.9], [0.2, 0.025, -1.9], [0.25, 0.025, 1.9], [-0.25, 0.025, 1.9]], n:[0, 1, 0], c:C('#85735a'), m:'earth'}); });
model('crack_weeds_decal', 'Crack with weeds', 'A jagged tarmac crack 2 m long with tufts of weed growing along it; flat decal plus small blades.', 2.2, 0.6, 0.35, function(a){
  a.raw('decal', [0, 0, 0], {v:[[-1.0, 0.02, 0.0], [-0.4, 0.02, -0.12], [0.2, 0.02, 0.1], [0.7, 0.02, -0.05], [1.0, 0.02, 0.06], [0.7, 0.02, 0.02], [0.2, 0.02, 0.15], [-0.4, 0.02, -0.06]], n:[0, 1, 0], c:K.oil, m:'stone'});
  [[-0.7, -0.05], [-0.1, 0.0], [0.4, 0.06], [0.85, 0.01]].forEach(function(p, i){ for (var b = 0; b < 3; b++) a.wedge(p[0] + b*0.04, 0.12, p[1], 0.04, 0.24 + (i + b)%2*0.1, 0.02, b % 2 ? K.grass : K.grassL, {m:'plant', rot:[(b - 1)*18, b*40, (b - 1)*14]}); }); });
/* tall grass: blades as thin leaning wedges in clumps; three sizes */
function clump(a, n, r, hgt, seed){ for (var i = 0; i < n; i++){ var t = i*2.399 + seed, rr = r*Math.sqrt((i + 0.5)/n), x = Math.cos(t)*rr, z = Math.sin(t)*rr, hh = hgt*(0.7 + 0.3*Math.sin(i*3.1 + seed));
  a.wedge(x, hh/2, z, 0.07, hh, 0.02, i % 3 === 0 ? K.grassL : i % 3 === 1 ? K.grass : K.grassD, {m:'plant', rot:[Math.sin(i*5.3)*14, (i*67) % 180, Math.cos(i*2.9)*12]}); } }
model('tall_grass_clump', 'Tall grass clump', 'A clump of 22 tall blades 0.9 m high in three greens, leaning every way; scatter along forest edges, road shoulders, fences and banks.', 0.9, 0.9, 0.95, function(a){ clump(a, 22, 0.4, 0.9, 1); });
model('tall_grass_dry', 'Tall grass clump, dry', 'A clump of tall dry-summer grass in straw yellow, 1.1 m high; for highway shoulders and dry maps.', 0.9, 0.9, 1.15, function(a){ for (var i = 0; i < 22; i++){ var t = i*2.399, rr = 0.4*Math.sqrt((i + 0.5)/22), hh = 1.1*(0.7 + 0.3*Math.sin(i*3.1)); a.wedge(Math.cos(t)*rr, hh/2, Math.sin(t)*rr, 0.07, hh, 0.02, i % 2 ? K.dry : C('#c4b476'), {m:'plant', rot:[Math.sin(i*5.3)*16, (i*67) % 180, Math.cos(i*2.9)*14]}); } });
model('tall_grass_patch', 'Tall grass patch', 'Five clumps of tall grass 3 m across with a few seed heads: fills a verge or fence line; 0.9 m high.', 3, 3, 0.95, function(a){ [[0, 0], [1.0, 0.7], [-1.0, 0.5], [0.4, -1.0], [-0.6, -0.9]].forEach(function(p, i){ var q = a; for (var k = 0; k < 14; k++){ var t = k*2.399 + i, rr = 0.45*Math.sqrt((k + 0.5)/14), hh = 0.9*(0.7 + 0.3*Math.sin(k*3.1 + i)); a.wedge(p[0] + Math.cos(t)*rr, hh/2, p[1] + Math.sin(t)*rr, 0.07, hh, 0.02, k % 3 === 0 ? K.grassL : k % 3 === 1 ? K.grass : K.grassD, {m:'plant', rot:[Math.sin(k*5.3)*14, (k*67) % 180, Math.cos(k*2.9)*12]}); } }); });

/* ============================================ F. camps ============================================ */
function dome(col, colD){ return function(a){ var r = 1.6; a.cyl(0, 0.03, 0, r + 0.1, 0.06, 'y', K.dirt, {m:'earth', n:10});
  a.raw('dome', [0, 0, 0], {scl:[r/0.2, 1.25/0.2, r/0.2], c:col, m:'cloth'}); a.box(0, 0.6, r*0.92, 0.7, 1.1, 0.04, colD, {m:'cloth'}); a.box(0, 0.62, r*0.935, 0.5, 0.9, 0.02, K.oil, {m:'cloth'});
  [-1, 1].forEach(function(sx){ a.box(sx*r*0.92, 0.85, 0.0, 0.03, 0.5, 0.5, K.lens, {m:'glass'}); a.cyl(sx*0.9, 0.6, 1.0, 0.012, 0.9, 'y', K.tin, {rot:[0, 0, sx*8]}); a.box(sx*1.1, 0.02, 1.3, 0.04, 0.08, 0.04, K.iron); });
  a.box(0, 1.28, 0, 0.1, 0.04, r*1.8, colD, {m:'cloth'}); a.pt('door', 'door', [0, 0.6, r*0.93], [0, 0, 1]); }; }
model('dome_tent_orange', 'Dome tent, orange', 'A 3.2 m dome tent in orange with a dark front door panel, side windows and guy lines; camps in parks and school fields.', 3.4, 3.4, 1.4, dome(K.org, K.orgD));
model('dome_tent_blue', 'Dome tent, blue', 'A 3.2 m dome tent in blue with a dark door panel; same shape as the orange one.', 3.4, 3.4, 1.4, dome(K.blu, K.bluD));
model('dome_tent_green', 'Dome tent, green', 'A 3.2 m dome tent in faded green with a dark door panel; same shape as the orange one.', 3.4, 3.4, 1.4, dome(K.grn, K.grnD));
model('relief_tent', 'Relief tent', 'A white relief-camp ridge tent 6 m by 4 m with a high ridge, a red cross-free blue stripe, two doors and a lantern at each end; for quarantine camps. No insignia.', 4, 6, 3.0, function(a){
  a.box(0, 0.03, 0, 4.0, 0.06, 6.0, K.dirt, {m:'earth'}); a.box(0, 1.0, 0, 3.6, 2.0, 5.6, K.white, {m:'cloth'}); gable(a, 0, 2.5, 0, 3.8, 1.0, 5.8, K.white, 'cloth'); a.box(0, 0.9, 2.82, 1.2, 1.8, 0.05, K.concD, {m:'cloth'}); a.box(0, 0.9, -2.82, 1.2, 1.8, 0.05, K.concD, {m:'cloth'});
  [-1, 1].forEach(function(sx){ a.box(sx*1.82, 1.2, 0, 0.04, 0.8, 4.4, K.blu, {m:'cloth'}); a.cyl(sx*1.9, 0.7, 3.2, 0.015, 1.4, 'y', K.tin, {rot:[0, 0, sx*10]}); a.cyl(sx*1.9, 0.7, -3.2, 0.015, 1.4, 'y', K.tin, {rot:[0, 0, sx*10]}); a.box(sx*1.4, 0.02, 3.1, 0.04, 0.08, 0.04, K.iron); });
  a.glow(0.0, 1.9, 2.9, 0.2, 0.2, 0.2); a.glow(0.0, 1.9, -2.9, 0.2, 0.2, 0.2); a.pt('door', 'door', [0, 0.9, 2.85], [0, 0, 1]); a.pt('door2', 'door', [0, 0.9, -2.85], [0, 0, -1]); });
model('camp_barrier_4', 'Camp barrier, 4 m', 'A 4 m run of orange plastic fence on steel feet with a white sign panel (blank), used round camps and cordons; tiles along z.', 0.5, 4, 1.2, function(a){
  [-1.9, -0.65, 0.65, 1.9].forEach(function(z){ a.box(0, 0.05, z, 0.5, 0.1, 0.14, K.iron, {m:'steel'}); a.cyl(0, 0.55, z, 0.025, 1.0, 'y', K.iron, {m:'steel'}); }); a.box(0, 0.85, 0, 0.04, 0.5, 3.9, K.org, {m:'plastic'}); a.box(0, 0.3, 0, 0.04, 0.3, 3.9, K.org, {m:'plastic'}); a.box(0, 0.88, 0, 0.05, 0.28, 0.9, K.white, {m:'plastic'}); });
/* ============================================ D. house parts and roadside buildings ============================================ */
model('dormer_window', 'Dormer window', 'A gabled dormer 1.6 m wide that stands out of a pitched roof: cheeks, a small gable roof and a window pane. Roof side at z = 0 (set it on a 35 to 45 degree roof); 1.7 m high.', 1.8, 1.6, 1.7, function(a){
  a.box(-0.7, 0.55, 0.5, 0.08, 1.1, 1.0, K.siding); a.box(0.7, 0.55, 0.5, 0.08, 1.1, 1.0, K.siding); a.box(0, 0.55, 1.0, 1.4, 1.1, 0.08, K.siding); a.box(0, 0.35, 1.04, 1.2, 0.04, 0.06, K.concL); a.pane(0, 0.65, 1.05, 0.9, 0.7, 0.04); a.box(0, 0.65, 1.07, 0.04, 0.7, 0.04, K.siding); a.box(0, 0.3, 1.07, 1.0, 0.06, 0.06, K.siding);
  gable(a, 0, 1.4, 0.55, 1.9, 0.6, 1.2, K.roofG); gable(a, 0, 1.18, 1.0, 1.4, 0.45, 0.1, K.siding); });
model('pole_sign_store', 'Pole sign, store', 'A 6 m steel pole with a lit double-sided panel 2.4 m by 1.4 m reading nothing: blank panel with a plain coloured band and a made-up wordmark block; for shops and strip malls. Place at the road edge by a driveway.', 2.6, 0.6, 6.4, function(a){
  a.box(0, 0.15, 0, 0.7, 0.3, 0.7, K.concD, {m:'stone'}); a.cyl(0, 2.9, 0, 0.12, 5.6, 'y', K.ironL, {m:'steel'}); a.box(0, 5.1, 0, 2.5, 1.5, 0.3, K.white, {m:'sheet'}); a.box(0, 5.1, 0.16, 2.3, 1.3, 0.04, K.cream, {m:'plastic'}); a.box(0, 5.1, -0.16, 2.3, 1.3, 0.04, K.cream, {m:'plastic'});
  a.box(0, 5.45, 0.19, 2.1, 0.35, 0.03, K.teal, {m:'plastic'}); a.box(-0.6, 4.9, 0.19, 0.7, 0.4, 0.03, K.teal, {m:'plastic'}); a.box(0.4, 4.9, 0.19, 1.1, 0.12, 0.03, K.grnD, {m:'plastic'}); a.glow(0, 5.1, 0.215, 1.9, 1.0, 0.01, K.lamp); a.box(0, 5.9, 0, 2.6, 0.12, 0.4, K.ironL, {m:'steel'}); a.box(0, 4.3, 0, 2.6, 0.12, 0.4, K.ironL, {m:'steel'}); });
model('pole_sign_station', 'Pole sign, fuel station', 'A 8 m price pole: a lit canopy-colour head with a blank brand plate and three fuel price rows (blank digits) on a steel pole; marks a fuel stop from a car.', 2.0, 0.6, 8.4, function(a){
  a.box(0, 0.2, 0, 0.8, 0.4, 0.8, K.concD, {m:'stone'}); a.cyl(0, 3.8, 0, 0.14, 7.2, 'y', K.ironL, {m:'steel'}); a.box(0, 7.5, 0, 1.8, 1.2, 0.3, K.red, {m:'sheet'}); a.box(0, 7.5, 0.17, 1.5, 0.8, 0.04, K.white, {m:'plastic'}); a.glow(0, 7.5, 0.2, 1.2, 0.5, 0.01, K.lamp);
  for (var i = 0; i < 3; i++){ a.box(0, 6.4 - i*0.8, 0, 1.8, 0.7, 0.3, K.iron, {m:'sheet'}); a.box(0, 6.4 - i*0.8, 0.17, 1.6, 0.5, 0.04, K.iron, {m:'plastic'}); a.glow(0.2, 6.4 - i*0.8, 0.2, 0.9, 0.3, 0.01, i === 0 ? K.fireL : K.lamp); a.box(-0.6, 6.4 - i*0.8, 0.19, 0.3, 0.3, 0.02, i === 0 ? K.grn : i === 1 ? K.yel : K.red); } });
model('strip_mall', 'Strip mall', 'A single-storey strip of three shops under one flat roof, 24 m by 9 m: each shop has a glass front, a door and its own awning colour; blank sign bands over each shop and a parapet with two roof billboards. Park in front (+z).', 24, 9, 6.0, function(a){
  a.box(0, 0.1, 0, 24, 0.2, 9, K.concD, {m:'stone'}); a.box(0, 2.0, -0.2, 24, 3.8, 8.6, K.brick, {m:'stone'}); a.box(0, 3.95, -0.2, 24.4, 0.3, 9.0, K.concD, {m:'stone'}); a.box(0, 4.2, 4.1, 24.4, 0.5, 0.2, K.concL, {m:'stone'});
  var cols = [K.red, K.teal, K.yel];
  [-8, 0, 8].forEach(function(x, i){ a.box(x, 1.5, 4.1, 6.4, 2.6, 0.12, K.concL, {m:'stone'}); a.pane(x - 1.2, 1.5, 4.18, 3.0, 2.0, 0.04); a.box(x + 2.2, 1.2, 4.18, 1.1, 2.2, 0.06, K.iron, {m:'steel'}); a.pane(x + 2.2, 1.3, 4.22, 0.8, 1.6, 0.04);
    a.box(x, 2.9, 4.6, 6.4, 0.07, 1.1, cols[i], {m:'cloth', rot:[16, 0, 0]}); a.box(x, 3.5, 4.12, 5.8, 0.6, 0.1, K.cream, {m:'sheet'}); a.box(x, 3.5, 4.2, 4.0, 0.2, 0.03, cols[i], {m:'plastic'}); });
  [-9, 9].forEach(function(x){ a.box(x, 5.2, 0, 4.8, 1.7, 0.2, K.woodL, {m:'wood'}); a.box(x, 5.2, 0.12, 4.4, 1.4, 0.04, K.cream, {m:'plastic'}); [-1.4, 1.4].forEach(function(s){ a.box(x + s, 4.6, -0.1, 0.12, 1.3, 0.12, K.iron); }); });
  a.box(0, 4.3, -2, 3.0, 0.6, 2.0, K.concL, {m:'stone'}); a.cyl(-4, 4.4, -2, 0.4, 0.4, 'y', K.tin); a.box(-8, 0.5, -4.5, 1.6, 1.0, 0.8, K.grn, {m:'sheet'}); a.box(-8, 1.05, -4.5, 1.7, 0.1, 0.9, K.grnD, {m:'sheet'}); });
model('rural_gas_station', 'Rural gas station', 'A small country fuel stop: one 8 m by 6 m flat canopy on four posts over two old pumps, a weatherboard shed shop with a tin roof and a porch, crates and a tyre rack out front, and a pole sign. Faces +z.', 14, 12, 8.4, function(a){
  a.box(0, 0.05, 0, 14, 0.1, 12, K.concD, {m:'stone'}); a.box(-3, 1.5, -3.2, 5.6, 2.8, 4.0, K.siding, {m:'wood'}); for (var i = 0; i < 9; i++) a.box(-3, 0.35 + i*0.3, -1.19, 5.6, 0.03, 0.03, K.woodD, {m:'wood'});
  gable(a, -3, 3.35, -3.2, 6.2, 0.9, 4.6, K.roofG); a.box(-3, 1.2, -1.15, 1.0, 2.1, 0.08, K.woodD, {m:'wood'}); a.pane(-4.5, 1.6, -1.15, 1.2, 1.0, 0.04); a.pane(-1.5, 1.6, -1.15, 1.2, 1.0, 0.04); a.box(-3, 0.12, -0.7, 5.6, 0.14, 1.0, K.woodL, {m:'wood'}); [-5.4, -0.6].forEach(function(x){ a.box(x, 1.3, -0.3, 0.12, 2.5, 0.12, K.woodD, {m:'wood'}); }); a.box(-3, 2.65, -0.3, 5.8, 0.12, 0.8, K.roofG, {m:'sheet'});
  [-0.6, 0.6].forEach(function(s){}); [[2.2, 3.5], [5.8, 3.5], [2.2, 7.5], [5.8, 7.5]].forEach(function(p){ a.cyl(p[0], 2.1, p[1] - 1.5, 0.15, 4.2, 'y', K.ironL, {m:'steel'}); }); a.box(4.0, 4.3, 3.0, 8.0, 0.4, 6.0, K.red, {m:'sheet'}); a.box(4.0, 4.1, 3.0, 7.6, 0.06, 5.6, K.white, {m:'sheet'});
  [3.2, 4.8].forEach(function(x){ a.box(x, 0.5, 3.0, 0.9, 0.12, 0.5, K.concL, {m:'stone'}); a.box(x, 0.85, 3.0, 0.5, 1.5, 0.4, K.red, {m:'sheet'}); a.box(x, 1.65, 3.0, 0.4, 0.3, 0.3, K.cream, {m:'plastic'}); a.pane(x, 1.4, 3.22, 0.3, 0.2, 0.03); a.cyl(x + 0.3, 1.1, 3.1, 0.03, 0.9, 'y', K.rub, {m:'rubber'}); });
  a.box(-5.0, 0.3, 0.4, 0.7, 0.55, 0.5, K.woodL, {m:'wood'}); a.box(-4.2, 0.25, 0.5, 0.6, 0.45, 0.5, K.wood, {m:'wood'}); for (var t = 0; t < 3; t++) a.cyl(-1.2, 0.18 + t*0.24, 0.4, 0.4, 0.2, 'y', K.rub, {m:'rubber'});
  a.cyl(-5.9, 2.6, -4, 0.8, 1.6, 'y', K.tin, {m:'steel', n:10}); a.cyl(6.5, 2.9, 9.0, 0.1, 5.6, 'y', K.ironL, {m:'steel'}); a.box(6.5, 5.1, 9.0, 1.8, 1.0, 0.2, K.red, {m:'sheet'}); a.glow(6.5, 5.1, 9.12, 1.4, 0.6, 0.02, K.lamp); });

fs.writeFileSync(root + 'packs/afterstreet-streetscape.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-streetscape.js:', pack.assets.length, 'models');
