/* Builds packs/afterstreet-military.js with the Workshop engine: military held weapons (with worn and broken states) and the base
   structures (towers, gates, fences, bunkers, barracks, hangar, tents, helipad, depot). Vehicles are in workshop/designs/military.js.
   Run: node workshop/tools/make_military.js */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); require(root + 'assets/shaped/held.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'afterstreet-military', name:'AfterStreet military: weapons and bases', author:'AfterStreet content chat', licence:'MIT',
  notes:'Service weapons (worn and broken states, grip/muzzle points) and base structures: towers, gates, fences, bunkers, barracks, hangar, tents, helipad, fuel depot.'});
var C = function(h){ return M.customName(h); };
var K = {od:C('#5a6040'), odD:C('#454a30'), odL:C('#7a8058'), tan:C('#a89870'), tanD:C('#8a7a56'), tanL:C('#c4b48c'), camo:C('#6a7048'), cammo:C('#3e4a30'), bag:C('#b0a078'), bagD:C('#8e7e5c'),
  conc:C('#9a988e'), concD:C('#7a786e'), concL:C('#b4b2a6'), wire:C('#8a8c8e'), razor:C('#aab0b6'), tarp:C('#4e5a3a'), canvas:C('#7a7a54'), lamp:C('#f0e0a0'), paintW:C('#e8e8e0'), paintR:C('#a8322a'), paintY:C('#d8b830'),
  grn:C('#3a4a2a'), rubber:C('#26272a'), lens:C('#2a3a48'), mag:C('#2b2d31'), pol:C('#34363a')};

/* ======================================================= held weapons ======================================================= */
var info = {};
require(root + 'assets/shaped/land.js');
/* stock colour names the target palette lacks become custom colours with the props palette's hex, so every viewer draws the same colour */
function fixColours(d, pal){ d.pieces.forEach(function(p){ if (typeof p.c !== 'string' || /^x[0-9a-fA-F]{6}/.test(p.c)) return; var dark = /_D$/.test(p.c), nm = p.c.replace(/_D$/, '');
  if (pal[nm]) return; var hex = SHAPED.props.palette[nm]; if (!hex) return; d.colours = d.colours || {}; var cn = M.customName(hex); d.colours[cn] = hex; p.c = cn + (dark ? '_D' : ''); }); }
function weapon(name, label, note, I, build){
  var d = M.blankHeld(name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var a = {
    box:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'box', [x, y, z], Object.assign({g:'new', d:[sx, sy, sz], c:c, m:'steel'}, o || {})); },
    cyl:function(x, y, z, r, len, c, o){ return M.addPiece(d, 'cyl', [x, y, z], Object.assign({g:'new', d:[r*2, r*2, len], ax:'z', c:c, m:'steel'}, o || {})); },
    cylY:function(x, y, z, r, len, c, o){ return M.addPiece(d, 'cyl', [x, y, z], Object.assign({g:'new', d:[r*2, len, r*2], ax:'y', c:c, m:'steel'}, o || {})); },
    bev:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'bev', [x, y, z], Object.assign({g:'new', d:[sx, sy, sz], c:c, m:'plastic'}, o || {})); },
    pt:function(n, p){ M.addPoint(d, n, n, p, [0, 0, 1]); }
  };
  build(a); M.makeWorn(d); M.makeBroken(d); fixColours(d, SHAPED.held.palette);
  a.pt('grip', [0, 0, 0]); if (I.offhandAt != null) a.pt('offhand', [0, -0.03, I.offhandAt]); if (I.muzzle) a.pt('muzzle', I.muzzle);
  d.extra = [{path:['info', name], value:I}]; if (I.twoHanded) d.design.twoHanded = true;
  M.addModelToPack(pack, d); info[name] = 1;
}
/* generic rifle body: receiver, barrel, handguard, stock, pistol grip, magazine, sights */
function rifle(a, o){
  var rz = o.recvZ, rl = o.recvLen, top = 0.04;
  a.box(0, 0.035, rz, 0.036, 0.075, rl, o.body || 'black');                                   /* receiver */
  a.box(0, 0.082, rz, 0.02, 0.012, rl - 0.04, 'gunMetal', {m:'steel'});                       /* top rail */
  a.box(0, 0.03, rz + rl/2 + o.hgLen/2, 0.05, 0.06, o.hgLen, o.hg || o.body || 'polymer', {m:'plastic'}); /* handguard */
  a.cyl(0, 0.045, rz + rl/2 + o.hgLen + o.barLen/2, 0.009, o.barLen, 'gunMetal');            /* barrel */
  a.cyl(0, 0.045, rz + rl/2 + o.hgLen + o.barLen + 0.03, 0.015, 0.07, 'black');               /* muzzle device */
  a.box(0, 0.025, rz - rl/2 - o.stockLen/2, 0.04, 0.085, o.stockLen, o.stock || o.body || 'polymer', {m:'plastic'}); /* stock */
  a.box(0, -0.005, rz - rl/2 - o.stockLen - 0.01, 0.046, 0.12, 0.025, 'rubber' in K ? K.rubber : 'black', {m:'rubber'});
  a.box(0, -0.045, 0.0, 0.028, 0.09, 0.04, 'black', {rot:[-18, 0, 0], m:'plastic'});          /* pistol grip */
  a.box(0, -0.095, rz + 0.04, 0.026, o.magH, 0.055, K.mag, {rot:[o.magRake || 8, 0, 0], m:'steel'}); /* magazine */
  a.box(0, 0.1, rz + rl/2 + o.hgLen - 0.02, 0.012, 0.03, 0.012, 'black');                      /* front sight */
  a.box(0, 0.1, rz - rl/2 + 0.03, 0.02, 0.025, 0.03, 'black');                                 /* rear sight */
  a.box(0.022, 0.05, rz + 0.07, 0.008, 0.02, 0.06, 'gunMetal');                                /* charging handle side */
}
weapon('assault_rifle', 'Assault rifle', 'A 5.56 mm service rifle: polymer furniture, 30-round magazine, folding-free fixed stock; two hands.', {length:0.95, ground:{roll:90, yaw:0, lift:0.03}, note:'two hands; empty = magazine out (show a rifle_magazine in the left hand while reloading); throws a rifle_case to +X each shot', offhandAt:0.34, muzzle:[0, 0.045, 0.78], ammo:'rifle_round', holds:30, twoHanded:true}, function(a){
  rifle(a, {recvZ:0.05, recvLen:0.30, hgLen:0.2, barLen:0.22, stockLen:0.24, magH:0.16, body:K.od}); a.box(0, 0.07, 0.4, 0.02, 0.015, 0.1, 'gunMetal'); });
weapon('battle_rifle', 'Battle rifle', 'A 7.62 mm semi-automatic battle rifle with a wooden-look stock and a 20-round magazine; heavier and slower than the assault rifle; two hands.', {length:1.1, ground:{roll:90, yaw:0, lift:0.03}, note:'two hands; empty = magazine out', offhandAt:0.38, muzzle:[0, 0.045, 0.9], ammo:'rifle_round', holds:20, twoHanded:true}, function(a){
  rifle(a, {recvZ:0.06, recvLen:0.34, hgLen:0.24, barLen:0.26, stockLen:0.3, magH:0.14, body:'black', stock:'woodD', hg:'woodD', magRake:4}); });
weapon('sniper_rifle', 'Sniper rifle', 'A bolt-action 7.62 mm rifle with a heavy barrel, scope and bipod; slow, accurate, loud; two hands.', {length:1.25, ground:{roll:90, yaw:0, lift:0.03}, note:'two hands; bolt_open state while cycling; 5-round internal box', offhandAt:0.4, muzzle:[0, 0.045, 1.0], ammo:'rifle_round', holds:5, twoHanded:true}, function(a){
  rifle(a, {recvZ:0.06, recvLen:0.3, hgLen:0.3, barLen:0.38, stockLen:0.34, magH:0.06, body:K.tanD, stock:K.tanD, hg:K.tanD, magRake:0});
  a.cyl(0, 0.115, 0.08, 0.02, 0.26, 'black'); a.cyl(0, 0.115, 0.24, 0.026, 0.05, K.lens); a.cyl(0, 0.115, -0.05, 0.026, 0.04, K.lens);
  a.box(0, 0.085, 0.08, 0.02, 0.03, 0.06, 'black'); a.box(0.025, 0.045, 0.06, 0.04, 0.012, 0.012, 'gunMetal');
  [-1, 1].forEach(function(s){ a.box(s*0.03, -0.01, 0.62, 0.008, 0.2, 0.008, 'gunMetal', {rot:[0, 0, s*14]}); }); });
weapon('smg', 'Submachine gun', 'A compact 9 mm submachine gun with a collapsed stock and a long stick magazine; one or two hands.', {length:0.55, ground:{roll:90, yaw:0, lift:0.03}, note:'two hands (offhand on the front grip); empty = magazine out', offhandAt:0.2, muzzle:[0, 0.04, 0.48], ammo:'pistol_round', holds:32, twoHanded:true}, function(a){
  a.box(0, 0.035, 0.1, 0.04, 0.075, 0.3, 'black'); a.cyl(0, 0.045, 0.34, 0.01, 0.18, 'gunMetal'); a.cyl(0, 0.045, 0.45, 0.018, 0.1, 'black'); a.box(0, -0.045, 0.0, 0.028, 0.09, 0.04, 'black', {rot:[-14, 0, 0], m:'plastic'});
  a.box(0, -0.12, 0.12, 0.026, 0.16, 0.04, K.mag); a.box(0, 0.02, -0.12, 0.012, 0.012, 0.22, 'gunMetal'); a.box(0, 0.0, -0.24, 0.04, 0.07, 0.02, 'black'); a.box(0, -0.04, 0.28, 0.025, 0.07, 0.03, 'black', {m:'plastic'}); a.box(0, 0.082, 0.1, 0.014, 0.015, 0.2, 'gunMetal'); });
weapon('light_machine_gun', 'Light machine gun', 'A belt-fed squad machine gun with a bipod and a box of belt on the side; heavy; two hands; sprays.', {length:1.0, ground:{roll:90, yaw:0, lift:0.05}, note:'two hands; a box of belt hangs under the receiver', offhandAt:0.4, muzzle:[0, 0.05, 0.85], ammo:'rifle_round', holds:100, twoHanded:true}, function(a){
  rifle(a, {recvZ:0.06, recvLen:0.36, hgLen:0.22, barLen:0.3, stockLen:0.28, magH:0.0, body:'black', hg:'black'});
  a.box(0, -0.08, 0.1, 0.09, 0.1, 0.16, K.od); a.box(0.0, -0.015, 0.1, 0.06, 0.03, 0.12, 'brass', {m:'steel'}); a.box(0, 0.095, 0.05, 0.05, 0.02, 0.2, 'black', {m:'steel'});
  [-1, 1].forEach(function(s){ a.box(s*0.035, -0.05, 0.6, 0.008, 0.16, 0.008, 'gunMetal', {rot:[0, 0, s*16]}); }); });
weapon('combat_shotgun', 'Combat shotgun', 'A pump-action 12-gauge with a short barrel, tube magazine and a pistol grip; two hands.', {length:0.9, ground:{roll:90, yaw:0, lift:0.03}, note:'two hands; pumped state after each shot; throws a shotgun_hull', offhandAt:0.3, muzzle:[0, 0.04, 0.78], ammo:'shotgun_shell', holds:7, twoHanded:true}, function(a){
  a.box(0, 0.03, 0.05, 0.04, 0.07, 0.26, 'black'); a.cyl(0, 0.04, 0.5, 0.012, 0.5, 'gunMetal'); a.cyl(0, 0.0, 0.46, 0.011, 0.4, 'gunMetal'); a.box(0, 0.0, 0.3, 0.05, 0.05, 0.16, 'black', {m:'plastic'}); a.box(0, -0.045, 0.0, 0.028, 0.09, 0.04, 'black', {rot:[-18, 0, 0], m:'plastic'});
  a.box(0, 0.015, -0.16, 0.04, 0.08, 0.2, 'black', {m:'plastic'}); a.box(0, 0.0, -0.28, 0.046, 0.1, 0.025, K.rubber); a.box(0, 0.075, 0.5, 0.012, 0.012, 0.5, 'gunMetal'); });
weapon('service_pistol', 'Service pistol', 'A 9 mm semi-automatic service pistol with a 15-round magazine; one hand.', {length:0.24, ground:{roll:90, yaw:0, lift:0.02}, note:'one hand; slide back when empty', muzzle:[0, 0.04, 0.16], ammo:'pistol_round', holds:15}, function(a){
  a.box(0, 0.04, 0.06, 0.03, 0.04, 0.22, 'black', {m:'steel'}); a.box(0, 0.015, 0.05, 0.026, 0.02, 0.2, K.pol, {m:'plastic'}); a.box(0, -0.04, -0.01, 0.028, 0.1, 0.04, K.pol, {rot:[-14, 0, 0], m:'plastic'}); a.box(0, -0.06, 0.0, 0.026, 0.08, 0.036, K.mag, {rot:[-14, 0, 0]});
  a.box(0, 0.01, 0.07, 0.012, 0.012, 0.03, 'gunMetal'); a.box(0, 0.068, 0.15, 0.008, 0.012, 0.01, 'black'); a.box(0, 0.068, -0.04, 0.012, 0.012, 0.01, 'black'); });
weapon('combat_knife', 'Combat knife', 'A fixed-blade combat knife with a black blade and a rubber grip; quick, quiet, short reach.', {length:0.28, ground:{roll:0, yaw:0, lift:0.012}, note:'stab; one hand'}, function(a){
  a.box(0, 0, -0.02, 0.026, 0.03, 0.12, K.rubber, {m:'rubber'}); a.box(0, 0, 0.05, 0.05, 0.016, 0.014, 'gunMetal'); a.bev(0, 0, 0.17, 0.006, 0.034, 0.23, K.mag, {m:'steel'}); a.box(0, -0.016, 0.17, 0.004, 0.006, 0.22, 'chrome', {m:'chrome'}); a.box(0, 0, -0.09, 0.03, 0.034, 0.014, 'gunMetal'); });
weapon('machete', 'Machete', 'A 50 cm machete with a black steel blade and a wrapped grip; chops.', {length:0.6, ground:{roll:0, yaw:0, lift:0.012}, note:'chop; one hand'}, function(a){
  a.box(0, 0, -0.04, 0.03, 0.04, 0.14, 'woodD', {m:'wood'}); a.box(0, 0, 0.04, 0.012, 0.05, 0.016, 'gunMetal'); a.bev(0, 0.006, 0.32, 0.006, 0.07, 0.52, K.mag, {m:'steel'}); a.box(0, -0.028, 0.32, 0.004, 0.006, 0.5, 'chrome', {m:'chrome'}); });
weapon('hand_grenade', 'Hand grenade', 'A fragmentation grenade with a pin and spoon; thrown, fuse 4 seconds; area damage.', {length:0.11, ground:{roll:0, yaw:0, lift:0.04}, note:'throw; pull the pin first'}, function(a){
  a.cylY(0, 0, 0.0, 0.032, 0.09, K.odD, {m:'steel'}); a.cylY(0, 0.055, 0.0, 0.018, 0.03, 'gunMetal'); a.box(0.014, 0.0, 0.0, 0.01, 0.1, 0.012, 'gunMetal'); a.cyl(0.02, 0.07, 0.0, 0.006, 0.026, 'chrome', {ax:'x', m:'chrome'}); });
weapon('rocket_launcher', 'Rocket launcher', 'A reusable shoulder-fired anti-armour launcher: olive tube, sight on the left, flared muzzle; one shot then reload; two hands.', {length:1.1, ground:{roll:90, yaw:0, lift:0.06}, note:'two hands; shoulder fired; empty = tube only', offhandAt:0.3, muzzle:[0, 0.07, 0.75], ammo:'rocket', holds:1, twoHanded:true}, function(a){
  a.cyl(0, 0.07, 0.15, 0.045, 0.9, K.od); a.cyl(0, 0.07, 0.62, 0.058, 0.08, K.odD); a.cyl(0, 0.07, -0.3, 0.06, 0.06, 'gunMetal'); a.box(0, -0.02, 0.05, 0.03, 0.09, 0.04, 'black', {rot:[-14, 0, 0], m:'plastic'}); a.box(0, 0.0, 0.28, 0.03, 0.05, 0.03, 'black'); a.box(-0.04, 0.12, 0.2, 0.02, 0.03, 0.12, 'black'); a.cyl(0, 0.07, -0.04, 0.05, 0.05, K.odD); });

/* ======================================================= base structures ======================================================= */
function model(name, label, note, w, len, h, build, kind){
  var d = M.newModelDoc(kind || 'structure', 'land', 'land', name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var a = {
    box:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'box', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'stone'}, o || {})); },
    bev:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'bev', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'stone'}, o || {})); },
    wedge:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'wedge', [x, y, z], Object.assign({d:[sx, sy, sz], c:c, m:'sheet'}, o || {})); },
    cyl:function(x, y, z, r, len, ax, c, o){ var dd = ax === 'z' ? [r*2, r*2, len] : ax === 'x' ? [len, r*2, r*2] : [r*2, len, r*2]; return M.addPiece(d, 'cyl', [x, y, z], Object.assign({d:dd, ax:ax, c:c, m:'steel'}, o || {})); },
    glow:function(x, y, z, sx, sy, sz){ return M.addPiece(d, 'box', [x, y, z], {d:[sx, sy, sz], c:K.lamp, m:'glass', glow:true}); },
    pt:function(n, k, pos, dir){ M.addPoint(d, n, k, pos, dir || [0, 1, 0]); }
  };
  build(a); fixColours(d, SHAPED.land.palette); d.extra = [{path:['info', name], value:{w:w, len:len, h:h, note:note}}];
  M.addModelToPack(pack, d); info[name] = 1;
}
/* a pitched corrugated roof over a box: ridge along z */
function roof(a, w, len, y, c){ a.wedge(0, y + 0.4, 0, w + 0.4, 0.8, len + 0.4, c); }
model('guard_tower', 'Guard tower', 'A 9 m steel-and-concrete tower: four legs with cross bracing, a ladder, a walled cab with slit windows and a flat roof with a searchlight; 4 m square.', 4, 4, 9.5, function(a){
  [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(function(p){ a.box(p[0], 3.5, p[1], 0.3, 7, 0.3, K.conc); a.box(p[0], 0.1, p[1], 0.7, 0.2, 0.7, K.concD); });
  for (var lv = 0; lv < 3; lv++){ var y = 1.5 + lv*2.5; a.box(0, y, -1.6, 3.2, 0.12, 0.12, K.wire); a.box(0, y, 1.6, 3.2, 0.12, 0.12, K.wire); a.box(-1.6, y, 0, 0.12, 0.12, 3.2, K.wire); a.box(1.6, y, 0, 0.12, 0.12, 3.2, K.wire);
    a.box(0, y + 1.2, 1.6, 0.1, 3.0, 0.1, K.wire, {rot:[0, 0, 40]}); a.box(0, y + 1.2, -1.6, 0.1, 3.0, 0.1, K.wire, {rot:[0, 0, -40]}); }
  a.box(0, 7.1, 0, 4.2, 0.2, 4.2, K.concD); a.box(0, 8.4, 2.0, 4.0, 2.4, 0.2, K.od); a.box(0, 8.4, -2.0, 4.0, 2.4, 0.2, K.od); a.box(-2.0, 8.4, 0, 0.2, 2.4, 3.8, K.od); a.box(2.0, 8.4, 0, 0.2, 2.4, 3.8, K.od);
  [-1.0, 1.0].forEach(function(x){ a.box(x, 8.6, 2.1, 1.0, 0.4, 0.05, K.lens, {m:'glass'}); a.box(x, 8.6, -2.1, 1.0, 0.4, 0.05, K.lens, {m:'glass'}); }); a.box(-2.1, 8.6, 0, 0.05, 0.4, 2.0, K.lens, {m:'glass'});
  a.box(0, 9.7, 0, 4.4, 0.2, 4.4, K.odD); a.box(1.2, 10.0, 1.2, 0.5, 0.5, 0.5, K.od); a.glow(1.2, 10.0, 1.46, 0.36, 0.36, 0.04);
  a.box(0.5, 3.3, 2.05, 0.06, 7, 0.06, K.wire); a.box(-0.5, 3.3, 2.05, 0.06, 7, 0.06, K.wire); for (var r = 0; r < 14; r++) a.box(0, 0.4 + r*0.5, 2.05, 1.0, 0.04, 0.04, K.wire); });
model('watchtower_wood', 'Watchtower (timber)', 'A 6 m improvised timber watchtower: log legs, a plank platform with a rail and a corrugated roof, rope ladder; 3 m square; for outposts and camps.', 3, 3, 7, function(a){
  [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(function(p){ a.box(p[0], 2.8, p[1], 0.22, 5.6, 0.22, 'woodD', {m:'wood'}); }); [1.2, 3.0, 4.6].forEach(function(y){ a.box(0, y, 1.2, 2.5, 0.12, 0.08, 'wood', {m:'wood'}); a.box(0, y, -1.2, 2.5, 0.12, 0.08, 'wood', {m:'wood'}); a.box(1.2, y, 0, 0.08, 0.12, 2.5, 'wood', {m:'wood'}); a.box(-1.2, y, 0, 0.08, 0.12, 2.5, 'wood', {m:'wood'}); });
  a.box(0, 5.7, 0, 3.0, 0.14, 3.0, 'woodL', {m:'wood'}); [[0, 1.45, 3, 0.08], [0, -1.45, 3, 0.08]].forEach(function(r){ a.box(r[0], 6.25, r[1], r[2], 0.9, r[3], 'wood', {m:'wood'}); }); a.box(1.45, 6.25, 0, 0.08, 0.9, 3, 'wood', {m:'wood'}); a.box(-1.45, 6.25, 0, 0.08, 0.9, 3, 'wood', {m:'wood'});
  [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(function(p){ a.box(p[0], 6.9, p[1], 0.1, 1.4, 0.1, 'woodD', {m:'wood'}); }); a.wedge(0, 7.7, 0, 3.4, 0.7, 3.4, K.tarp, {rot:[0, 90, 0]}); a.box(0, 3.0, 1.4, 0.06, 5.6, 0.06, K.tanL, {m:'cloth'}); a.box(0.4, 3.0, 1.4, 0.06, 5.6, 0.06, K.tanL, {m:'cloth'}); });
model('gatehouse', 'Base gatehouse', 'A checkpoint gatehouse: a small concrete guard booth on the left, a striped barrier arm across a 5 m lane, sliding-gate track and a lamp; 8 m wide.', 8, 4, 4, function(a){
  a.box(-3, 0.05, 0, 2.4, 0.1, 3.0, K.concD); a.box(-3, 1.4, 0, 2.2, 2.7, 2.8, K.conc); a.box(-3, 1.9, 1.45, 1.6, 0.9, 0.06, K.lens, {m:'glass'}); a.box(-1.85, 1.9, 0, 0.06, 0.9, 1.8, K.lens, {m:'glass'}); a.box(-3, 2.9, 0, 2.8, 0.18, 3.4, K.odD);
  a.box(-3, 1.0, 1.5, 0.9, 2.0, 0.05, K.od, {m:'sheet'}); a.box(-1.2, 0.6, 0.0, 0.3, 1.2, 0.3, K.conc); a.cyl(-1.2, 1.2, 0, 0.14, 0.4, 'y', K.od); a.box(1.0, 1.3, 0.0, 4.4, 0.12, 0.12, K.paintW); for (var i = 0; i < 5; i++) a.box(-0.8 + i*0.9, 1.3, 0, 0.45, 0.14, 0.14, K.paintR);
  a.box(3.4, 1.2, 0, 0.25, 2.4, 0.25, K.conc); a.box(3.4, 2.5, 0, 0.35, 0.2, 0.35, K.odD); a.box(0, 0.03, 0, 5.4, 0.06, 3.0, K.concL); a.box(-3, 3.2, 0.8, 0.4, 0.3, 0.3, 'black'); a.glow(-3, 3.2, 1.0, 0.3, 0.2, 0.04); });
model('chainlink_fence_4', 'Perimeter fence, 4 m', 'A 3 m chain-link perimeter panel on steel posts with three strands of razor wire on outriggers; tiles every 4 m along z (runs along z, face toward +x).', 0.4, 4, 3.6, function(a){
  [-2, 0, 2].forEach(function(z){ a.box(0, 1.6, z, 0.1, 3.2, 0.1, K.wire); a.box(0.15, 3.3, z, 0.4, 0.06, 0.06, K.wire, {rot:[0, 0, 40]}); a.box(-0.15, 3.3, z, 0.4, 0.06, 0.06, K.wire, {rot:[0, 0, -40]}); });
  a.box(0, 1.6, 0, 0.02, 3.0, 4.0, K.wire, {m:'glass', trans:true}); a.box(0, 3.05, 0, 0.04, 0.04, 4.0, K.wire); a.box(0, 0.1, 0, 0.04, 0.04, 4.0, K.wire); for (var i = 0; i < 3; i++){ a.cyl(0.3 - i*0.3, 3.4, 0, 0.1, 4.0, 'z', K.razor); } });
model('razor_wire_coil', 'Razor wire coils, 4 m', 'Three stacked coils of concertina wire along a 4 m run, on the ground or on top of a wall; low and wide.', 1.0, 4, 0.9, function(a){
  [[0, 0.2], [0.4, 0.2], [0.2, 0.6]].forEach(function(p){ for (var z = -1.9; z < 2; z += 0.4) a.cyl(p[0] - 0.2, p[1], z, 0.28, 0.04, 'z', K.razor, {rot:[0, 0, 0]}); a.cyl(p[0] - 0.2, p[1], 0, 0.06, 4, 'z', K.wire); }); });
model('hesco_barrier_4', 'Gabion wall (earth-filled), 4 m', 'Four earth-filled wire-and-fabric cells, 1.4 m high, in a row: the quick blast and bullet wall around a base; tiles along z.', 1.1, 4, 1.4, function(a){
  for (var i = 0; i < 4; i++){ var z = -1.5 + i; a.box(0, 0.7, z, 1.1, 1.4, 0.98, K.tanD, {m:'cloth'}); a.box(0, 1.41, z, 1.0, 0.04, 0.9, K.bag, {m:'earth'}); a.box(0.56, 0.7, z, 0.02, 1.4, 0.98, K.wire); a.box(-0.56, 0.7, z, 0.02, 1.4, 0.98, K.wire); } });
model('sandbag_wall_4', 'Sandbag wall, 4 m', 'A staggered sandbag wall 1.2 m high in running bond, 4 m long and two bags thick.', 0.7, 4, 1.2, function(a){
  for (var r = 0; r < 6; r++) for (var i = 0; i < 8; i++){ var z = -1.9 + i*0.5 + (r % 2 ? 0.25 : 0); if (z > 1.95) continue; [-0.17, 0.17].forEach(function(x){ a.bev(x, 0.1 + r*0.2, z, 0.34, 0.19, 0.48, (i + r) % 3 ? K.bag : K.bagD, {m:'cloth'}); }); } });
model('sandbag_nest', 'Sandbag gun nest', 'A horseshoe sandbag nest 1.2 m high around a pintle gun on a tripod, ammo boxes and a stool; open at the back; 3.4 m across.', 3.4, 3.4, 1.4, function(a){
  for (var r = 0; r < 6; r++){ for (var i = 0; i < 7; i++){ var t = -Math.PI*0.9 + i*(Math.PI*1.8/6) + (r % 2 ? 0.18 : 0); a.bev(Math.sin(t)*1.4, 0.1 + r*0.2, Math.cos(t)*1.2 + 0.2, 0.55, 0.19, 0.4, (i + r) % 3 ? K.bag : K.bagD, {m:'cloth', rot:[0, t*180/Math.PI + 90, 0]}); } }
  a.cyl(0, 0.75, 0.3, 0.025, 1.0, 'y', 'gunMetal'); [0, 120, 240].forEach(function(r){ a.box(0, 0.3, 0.3, 0.04, 0.8, 0.04, 'gunMetal', {rot:[0, r, 20]}); }); a.box(0, 1.25, 0.6, 0.08, 0.1, 0.8, 'black'); a.box(0, 1.25, 0.15, 0.2, 0.2, 0.3, 'black'); a.box(-0.7, 0.18, -0.4, 0.4, 0.3, 0.25, K.odD); a.box(-0.7, 0.4, -0.4, 0.3, 0.14, 0.2, K.od); a.box(0.6, 0.2, -0.5, 0.35, 0.4, 0.35, 'wood', {m:'wood'}); });
model('pillbox_bunker', 'Concrete pillbox', 'A hexagon-ish concrete pillbox 3.6 m across and 2.2 m high with a 1.6 m wide firing slit on three sides, a flat thick roof and a back door; half-buried.', 3.6, 3.6, 2.2, function(a){
  a.box(0, 1.0, 0, 3.4, 2.0, 3.0, K.conc); a.bev(0, 2.15, 0, 3.8, 0.3, 3.4, K.concD); [[0, 1.5, 1.0], [1.3, 1.5, 0], [-1.3, 1.5, 0]].forEach(function(s, i){ a.box(s[0], 1.5, s[2] + (i ? 0 : 0.5), i ? 0.1 : 1.6, i ? 0.35 : 0.35, i ? 1.6 : 0.1, 'black'); }); a.box(0, 0.7, -1.52, 0.9, 1.4, 0.06, K.od, {m:'sheet'}); a.box(0, 0.05, 0, 4.0, 0.1, 3.6, K.concD); a.box(0, 2.35, 0, 3.3, 0.16, 2.9, K.tarp, {m:'earth'}); });
model('earth_bunker', 'Earth-covered ammo bunker', 'A grassed mound 8 m long with a concrete front wall and a steel double door, a vent pipe and a drainage ditch; ammunition and supplies; 6 m wide.', 6, 8, 3.2, function(a){
  a.bev(0, 1.5, -0.5, 6, 3.0, 7, K.camo, {m:'earth'}); a.box(0, 1.5, 3.1, 5, 3.0, 0.5, K.conc); a.box(0, 3.15, 3.1, 5.4, 0.3, 0.7, K.concD); a.box(0, 1.2, 3.38, 2.4, 2.4, 0.1, K.od, {m:'sheet'}); a.box(-0.6, 1.2, 3.46, 0.04, 2.3, 0.06, K.odD); a.box(0.6, 1.2, 3.46, 0.04, 2.3, 0.06, K.odD);
  a.cyl(1.8, 3.4, -1, 0.12, 1.0, 'y', K.wire); a.box(0, 0.06, 4, 3.0, 0.1, 1.6, K.concL); a.box(0, 0.35, 3.45, 2.8, 0.7, 0.3, K.tanD, {m:'earth'}); });
model('barracks_hut', 'Barracks hut', 'A 12 m by 6 m barracks: tan walls, a low pitched roof, windows along both sides, a door at each end and porch lights; sleeps twelve.', 6, 12, 4, function(a){
  a.box(0, 0.1, 0, 6.2, 0.2, 12.2, K.concD); a.box(0, 1.7, 0, 5.8, 3.0, 11.8, K.tan); roof(a, 5.8, 11.8, 3.2, K.od); for (var i = 0; i < 5; i++){ var z = -4.4 + i*2.2; [-1, 1].forEach(function(s){ a.box(s*2.92, 1.9, z, 0.06, 1.0, 1.2, K.lens, {m:'glass'}); a.box(s*2.94, 1.9, z, 0.04, 1.1, 1.3, K.tanD); }); }
  a.box(0, 1.2, 5.95, 1.0, 2.2, 0.06, K.od, {m:'sheet'}); a.box(0, 1.2, -5.95, 1.0, 2.2, 0.06, K.od, {m:'sheet'}); a.glow(0.9, 2.6, 6.0, 0.25, 0.2, 0.05); a.glow(-0.9, 2.6, -6.0, 0.25, 0.2, 0.05); a.box(0, 0.12, 6.7, 2.0, 0.2, 1.2, K.concL); });
model('command_building', 'Command post', 'A two-storey concrete command building 10 m by 8 m: flat roof with antennas and a small dish, steel doors, barred windows; 7.5 m high.', 8, 10, 8.5, function(a){
  a.box(0, 0.1, 0, 8.4, 0.2, 10.4, K.concD); a.box(0, 3.7, 0, 8.0, 7.2, 10.0, K.conc); a.box(0, 7.4, 0, 8.4, 0.3, 10.4, K.concD); for (var f = 0; f < 2; f++) for (var i = 0; i < 4; i++){ a.box(-4.02, 1.8 + f*3.4, -3.6 + i*2.4, 0.06, 1.3, 1.2, K.lens, {m:'glass'}); a.box(4.02, 1.8 + f*3.4, -3.6 + i*2.4, 0.06, 1.3, 1.2, K.lens, {m:'glass'}); }
  a.box(0, 1.2, 5.03, 1.6, 2.4, 0.08, K.od, {m:'sheet'}); a.box(-2.2, 2.0, 5.03, 1.2, 1.2, 0.06, K.lens, {m:'glass'}); a.box(2.2, 2.0, 5.03, 1.2, 1.2, 0.06, K.lens, {m:'glass'}); a.box(0, 3.1, 5.3, 3.0, 0.15, 0.8, K.odD);
  a.cyl(2.5, 9.2, -2, 0.04, 3.2, 'y', K.wire); a.cyl(-2.5, 9.0, 1, 0.03, 2.8, 'y', K.wire); a.cyl(0, 8.3, -3, 0.8, 0.1, 'y', K.paintW, {rot:[60, 0, 0]}); a.box(-3.4, 7.8, 3, 0.8, 0.6, 0.8, K.odD); });
model('hangar_small', 'Aircraft hangar', 'A 20 m by 16 m arched hangar with a full-width sliding door at the front, a side man-door and roof vents; fits a helicopter or small plane; 7 m high.', 16, 20, 7.5, function(a){
  a.box(0, 0.1, 0, 16.4, 0.2, 20.4, K.concD); a.box(-7.9, 3.0, 0, 0.2, 6.0, 20, K.tan, {m:'sheet'}); a.box(7.9, 3.0, 0, 0.2, 6.0, 20, K.tan, {m:'sheet'}); a.box(0, 3.0, -9.9, 15.6, 6.0, 0.2, K.tan, {m:'sheet'});
  a.cyl(0, 6.0, 0, 7.9, 20, 'z', K.od, {m:'sheet', n:12, trans:false}); a.box(0, 0.25, 0, 16.0, 0.1, 20, K.concL); a.box(0, 3.3, 10.05, 15.0, 6.2, 0.2, K.odL, {m:'sheet'}); for (var i = -3; i <= 3; i++) a.box(i*2.1, 3.3, 10.2, 0.08, 6.0, 0.06, K.odD);
  a.box(0, 6.6, 10.1, 15.4, 0.2, 0.3, K.wire); a.box(-8.05, 1.1, 3, 0.1, 2.1, 1.0, K.od, {m:'sheet'}); a.box(0, 7.9, 0, 0.8, 0.3, 14, K.odD); a.glow(0, 7.7, 10.2, 1.2, 0.2, 0.05); });
model('motor_pool_shed', 'Motor pool shed', 'A long open-front vehicle shed 18 m by 7 m: steel posts, a corrugated roof, a concrete apron, tyre stacks and oil drums; shelters four vehicles.', 7, 18, 4.5, function(a){
  a.box(0, 0.1, 0, 7.2, 0.2, 18.2, K.concD); [-3.2, 3.2].forEach(function(x){ [-8.5, -4.25, 0, 4.25, 8.5].forEach(function(z){ a.box(x, 2.1, z, 0.2, 4.0, 0.2, K.wire); }); }); a.box(0, 2.1, -8.9, 6.8, 4.0, 0.15, K.tan, {m:'sheet'}); a.box(-3.4, 2.1, 0, 0.15, 4.0, 18, K.tan, {m:'sheet'});
  a.wedge(0, 4.4, 0, 7.6, 0.8, 18.4, K.od, {rot:[0, 90, 0]}); for (var i = 0; i < 3; i++) a.cyl(2.6, 0.45 + i*0.28, -7.8, 0.45, 0.25, 'y', K.rubber, {m:'rubber'}); [0, 1, 2].forEach(function(i){ a.cyl(-2.6, 0.5, -7.6 + i*0.7, 0.3, 0.9, 'y', i % 2 ? K.odD : K.paintR); }); a.box(2.6, 0.05, 6, 2.0, 0.04, 3.0, K.tanD); });
model('command_tent', 'Command tent', 'A canvas ridge tent 8 m by 5 m with a front flap tied back, guy ropes and pegs, a camo net over the entrance and a generator beside it.', 5, 8, 3.2, function(a){
  a.box(0, 0.05, 0, 5.0, 0.1, 8.0, K.tanD, {m:'earth'}); a.wedge(0, 1.7, 0, 5.0, 3.0, 8.0, K.canvas, {m:'cloth', rot:[0, 90, 0]}); a.box(0, 1.1, 0, 4.4, 2.2, 7.4, K.canvas, {m:'cloth'}); a.box(0, 1.0, 4.02, 1.6, 2.0, 0.05, K.cammo, {m:'cloth'});
  a.wedge(0, 2.5, 4.9, 3.2, 0.9, 2.0, K.camo, {m:'cloth', rot:[0, 90, 0]}); [-1, 1].forEach(function(s){ a.cyl(s*1.5, 1.2, 5.7, 0.04, 2.4, 'y', 'woodD', {m:'wood'}); a.box(s*3.5, 0.6, 3.5, 0.02, 1.4, 0.02, K.tanL, {m:'cloth', rot:[0, 0, s*30]}); a.box(s*3.5, 0.6, -3.5, 0.02, 1.4, 0.02, K.tanL, {m:'cloth', rot:[0, 0, s*30]}); }); a.box(3.6, 0.45, 2, 0.8, 0.8, 1.2, K.odD); a.cyl(3.6, 1.0, 1.6, 0.04, 0.4, 'y', 'gunMetal'); });
model('helipad', 'Helipad', 'A 16 m square concrete pad with a painted circle and H, edge lights, a wind sock and a fuel hose point; flush with the ground.', 16, 16, 4, function(a){
  a.box(0, 0.04, 0, 16, 0.08, 16, K.concL); a.cyl(0, 0.1, 0, 6.5, 0.04, 'y', K.paintW); a.cyl(0, 0.12, 0, 6.1, 0.04, 'y', K.concL); a.box(-1.4, 0.15, 0, 0.5, 0.04, 4.2, K.paintW); a.box(1.4, 0.15, 0, 0.5, 0.04, 4.2, K.paintW); a.box(0, 0.15, 0, 2.8, 0.04, 0.5, K.paintW);
  [[-7.6, -7.6], [7.6, -7.6], [-7.6, 7.6], [7.6, 7.6], [0, -7.8], [0, 7.8], [-7.8, 0], [7.8, 0]].forEach(function(p){ a.glow(p[0], 0.14, p[1], 0.24, 0.12, 0.24); }); a.cyl(7.2, 2.0, -7.2, 0.04, 4, 'y', K.wire); a.cyl(7.2, 3.9, -6.7, 0.18, 1.2, 'z', K.paintR, {rot:[0, 10, 0]}); a.box(-7.5, 0.5, 7.2, 0.7, 1.0, 0.5, K.odD); });
model('fuel_depot', 'Fuel depot', 'Two horizontal 20,000 L fuel tanks on concrete saddles inside a bund wall, a pump house, gantry pipework and a filling point; 14 m by 10 m.', 10, 14, 3.8, function(a){
  a.box(0, 0.1, 0, 10, 0.2, 14, K.concD); [[-6.6, 0.4], [6.6, 0.4]].forEach(function(p){}); a.box(0, 0.6, 0, 10, 1.0, 0.4, K.conc); a.box(0, 0.6, 0, 0.4, 1.0, 14, K.conc); /* bund */
  [-2.5, 2.5].forEach(function(x){ a.cyl(x, 1.9, -1.0, 1.3, 9, 'z', K.od); [-4.2, -1.0, 2.2].forEach(function(z){ a.box(x, 0.6, z, 2.4, 1.0, 0.5, K.concL); }); a.cyl(x, 3.3, -1.0, 0.35, 0.5, 'y', K.odD); a.box(x, 3.6, -1.0, 0.8, 0.1, 0.8, K.wire); });
  a.box(-3.4, 1.6, -5.8, 3.0, 2.6, 2.4, K.conc); a.box(-3.4, 3.0, -5.8, 3.3, 0.2, 2.7, K.odD); a.cyl(0, 2.6, -4.8, 0.08, 6, 'x', K.wire); a.box(3.4, 0.9, -5.8, 0.6, 1.6, 0.6, K.paintY); a.cyl(3.4, 1.8, -5.8, 0.06, 0.8, 'x', K.rubber); a.box(0, 0.12, -6.4, 9, 0.04, 0.4, K.paintY); });
model('radio_mast', 'Radio mast', 'A 18 m lattice radio mast on a concrete footing with guy wires to three anchors, a cable run to a shelter, and a red beacon at the top.', 6, 6, 18.5, function(a){
  a.box(0, 0.15, 0, 1.4, 0.3, 1.4, K.concD); [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(function(p){ a.box(p[0], 9, p[1], 0.06, 18, 0.06, K.wire); }); for (var i = 0; i < 18; i++){ a.box(0, 0.6 + i*1.0, 0.3, 0.6, 0.04, 0.04, K.wire, {rot:[0, 0, i % 2 ? 35 : -35]}); a.box(0, 0.6 + i*1.0, -0.3, 0.6, 0.04, 0.04, K.wire, {rot:[0, 0, i % 2 ? -35 : 35]}); }
  [[0, 2.8, 0], [2.4, -1.4, 120], [-2.4, -1.4, 240]].forEach(function(g){ a.box(g[0]*0.5, 6.5, g[1]*0.5, 0.02, 14, 0.02, K.wire, {rot:[g[2] ? 0 : 0, 0, 0]}); a.box(g[0], 0.2, g[1], 0.4, 0.4, 0.4, K.concD); }); a.glow(0, 18.3, 0, 0.3, 0.3, 0.3); a.box(0, 15, 0.5, 1.2, 0.04, 0.04, K.wire); a.cyl(0.2, 16, 0.3, 0.3, 0.05, 'y', K.paintW, {rot:[70, 0, 0]}); });
model('tank_trap', 'Tank trap (hedgehog)', 'A czech hedgehog: three crossed steel beams, 1.4 m across, rusted; blocks vehicles on roads and bridges.', 1.4, 1.4, 1.2, function(a){
  [[0, 0, 0], [0, 90, 0], [0, 0, 90]].forEach(function(r, i){ a.box(0, 0.6, 0, 0.14, 1.5, 0.14, 'rust', {m:'steel', rot:[i === 2 ? 55 : 0, i === 1 ? 55 : 0, i === 0 ? 55 : 0]}); }); a.box(0, 0.6, 0, 0.2, 0.2, 0.2, 'rustD', {m:'steel'}); });
model('hardened_checkpoint', 'Vehicle checkpoint', 'A road checkpoint 8 m wide: two rows of jersey barriers in a chicane, a spike strip, stop sign and a sandbagged booth; slows and funnels vehicles.', 8, 9, 2.6, function(a){
  [[-3, -3], [3, -1.2], [-3, 1.2], [3, 3.6]].forEach(function(p){ for (var i = 0; i < 2; i++){ a.box(p[0], 0.4, p[1] + i*1.9 - 0.9, 1.0, 0.8, 1.8, K.conc); a.box(p[0], 0.9, p[1] + i*1.9 - 0.9, 0.5, 0.4, 1.8, K.concD); } });
  a.box(0, 0.03, -1.0, 4.5, 0.06, 0.5, K.rubber); for (var j = 0; j < 12; j++) a.box(-2 + j*0.35, 0.1, -1.0, 0.03, 0.12, 0.03, K.razor); a.cyl(-3.8, 1.3, -3.2, 0.04, 2.6, 'y', K.wire); a.box(-3.8, 2.5, -3.2, 0.5, 0.5, 0.04, K.paintR); a.box(3.8, 0.7, 4.6, 1.8, 1.4, 1.8, K.bag, {m:'cloth'}); a.box(3.8, 1.8, 4.6, 2.2, 0.15, 2.2, K.odD); });
model('flagpole', 'Base flagpole', 'A 9 m steel flagpole on a low concrete plinth with a halyard and a plain olive pennant (no insignia); marks the base entrance.', 1.2, 1.2, 9.5, function(a){
  a.box(0, 0.2, 0, 1.2, 0.4, 1.2, K.concL); a.cyl(0, 4.7, 0, 0.06, 9, 'y', K.razor); a.cyl(0, 9.2, 0, 0.1, 0.2, 'y', 'brass'); a.box(0.7, 8.2, 0, 1.4, 0.9, 0.02, K.od, {m:'cloth'}); a.box(0.08, 4, 0, 0.02, 4.5, 0.02, K.tanL, {m:'cloth'}); });

fs.writeFileSync(root + 'packs/afterstreet-military.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-military.js:', pack.assets.length, 'models');
