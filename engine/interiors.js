/* Shared engine: building interiors, generated near the player.
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
/* ================= interiors (generated when you get close, freed when you leave) ================= */
var FURN = {
  bed:{boxes:[[0,.25,0,1,.25,.7,'#7a5a3c'],[0,.55,0,.95,.08,.65,'#c9d3e0'],[-.7,.68,0,.22,.07,.5,'#f2f2f2']]},
  table:{boxes:[[0,.72,0,.7,.05,.45,'#a8743e'],[0,.35,0,.08,.35,.08,'#6b4526']]},
  sofa:{boxes:[[0,.25,0,.9,.25,.42,'#5f7f9a'],[0,.6,-.32,.9,.3,.1,'#4f6b85']]},
  wardrobe:{name:'bookshelf', tex:24, boxes:[[0,.95,0,.75,.95,.22,'#6b4a30']]},
  fridge:{name:'fridge', tex:25, boxes:[[0,.85,0,.36,.85,.36,'#e9e2d2']]},
  shelf:{name:'shelves', tex:23, boxes:[[0,.9,0,1.1,.9,.22,'#d6c4a4']]},
  counter:{boxes:[[0,.5,0,1,.5,.35,'#5a6470'],[0,1.02,0,1.05,.03,.4,'#c9ccd1']]},
  cabinet:{name:'medicine cabinet', boxes:[[0,.9,0,.5,.9,.25,'#eef1f3'],[0,1.3,.26,.3,.07,.01,'#c8322b'],[0,1.3,.26,.07,.3,.01,'#c8322b']]},
  gurney:{fix:'bed', boxes:[[0,.55,0,1,.08,.4,'#e6eaee'],[0,.25,0,.9,.03,.35,'#8a9199']]},
  locker:{name:'locker', hide:1, boxes:[[0,1,0,.6,1,.28,'#3f5a85'],[0,1.5,.29,.5,.04,.01,'#22344f']]},
  desk:{boxes:[[0,.72,0,.8,.04,.4,'#7a5a3c'],[-.6,.35,0,.15,.35,.38,'#5a4028'],[.6,.35,0,.15,.35,.38,'#5a4028']]},
  crate:{name:'crate', tex:27, boxes:[[0,.45,0,.5,.45,.5,'#b98a52']]},
  barrel:{boxes:[[0,.5,0,.35,.5,.35,'#3d6b8c']]},
  bench:{boxes:[[0,.85,0,1,.05,.4,'#8b8b88'],[0,.42,0,.9,.42,.3,'#55595f']]}
};
FURN.bed.models = ['bed_single_A', 'bed_double_A', 'bed_double_B']; FURN.table.models = ['table_medium', 'table_small', 'table_low']; FURN.sofa.models = ['couch', 'couch_pillows', 'armchair'];
FURN.desk.models = ['table_medium_long'];
FURN.chair = {models:['chair_A', 'chair_B_wood', 'chair_C', 'chair_stool'], boxes:[[0,.25,0,.25,.25,.25,'#8a6a48']]};
FURN.lamp = {models:['lamp_standing'], boxes:[[0,.9,0,.08,.9,.08,'#c9b98f']]};
FURN.plant = {models:['cactus_medium_A'], boxes:[[0,.3,0,.2,.3,.2,'#7a8a5e']]};
FURN.dresser = {name:'dresser', models:['cabinet_medium_decorated', 'cabinet_small_decorated', 'cabinet_medium'], boxes:[[0,.45,0,.7,.45,.35,'#8a6a48']]};
/* furniture, cars and street props: KayKit Furniture Bits and City Builder Bits by Kay Lousberg (CC0), converted by tools/build_models.py */
var MODELS = {}, MS = 1;
(function(){
  var t = (ART.models || '').replace(/<!--.*?-->/g, '').replace(/^\s+/, ''), nl = t.indexOf('\n'); if (nl < 0) return;
  try {
    var idx = JSON.parse(t.slice(0, nl)), bin = atob(t.slice(nl + 1)), buf = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    var dv = new DataView(buf.buffer);
    for (var n in idx){ var e = idx[n], P0 = new Float32Array(e.n*9); for (i = 0; i < e.n*9; i++) P0[i] = dv.getInt16(e.o + i*2, true)/1000*MS; MODELS[n] = {n:e.n, p:P0, c:buf.subarray(e.o + e.n*18, e.o + e.n*21), hx:e.hx*MS, hz:e.hz*MS, h:e.h*MS}; }
  } catch (er){ MODELS = {}; }
})();
Mesh.prototype.modelS = function(M, x, z, yaw, y0, sc){
  var cs = Math.cos(yaw), sn = Math.sin(yaw), p = M.p, c = M.c, q = [0,0,0,0,0,0,0,0,0];
  for (var i = 0; i < M.n; i++){
    for (var j = 0; j < 3; j++){ var lx = p[i*9 + j*3]*sc, lz = p[i*9 + j*3 + 2]*sc; q[j*3] = x + cs*lx - sn*lz; q[j*3 + 1] = y0 + p[i*9 + j*3 + 1]*sc; q[j*3 + 2] = z + sn*lx + cs*lz; }
    this.tri(q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], [c[i*3], c[i*3 + 1], c[i*3 + 2]], M.a ? M.a[i] : 255);
  }
};
Mesh.prototype.model = function(M, x, z, yaw, y0){
  var cs = Math.cos(yaw), sn = Math.sin(yaw), p = M.p, c = M.c, q = [0,0,0,0,0,0,0,0,0];
  for (var i = 0; i < M.n; i++){
    for (var j = 0; j < 3; j++){ var lx = p[i*9 + j*3], lz = p[i*9 + j*3 + 2]; q[j*3] = x + cs*lx - sn*lz; q[j*3 + 1] = y0 + this.yo + p[i*9 + j*3 + 1]; q[j*3 + 2] = z + sn*lx + cs*lz; }
    this.tri(q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], [c[i*3], c[i*3 + 1], c[i*3 + 2]], M.a ? M.a[i] : 255);
  }
};
/* cars: Kenney Car Kit (CC0), converted by tools/build_vehicles.py. Body, wheels and the truck's bonnet are separate parts so they can move.
   In a car's own frame x runs forward, y up, z to the right; wheels sit at w = [x, y, z, front?, model] */
var VMOD = {};
(function(){
  var t = (ART.vehicles || '').replace(/^\s+/, ''), nl = t.indexOf('\n'); if (nl < 0) return;
  try {
    var idx = JSON.parse(t.slice(0, nl)), bin = atob(t.slice(nl + 1)), buf = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    var dv = new DataView(buf.buffer);
    for (var n in idx){ var e = idx[n], P0 = new Float32Array(e.n*9); for (i = 0; i < e.n*9; i++) P0[i] = dv.getInt16(e.o + i*2, true)/1000;
      var o = {n:e.n, p:P0, c:buf.subarray(e.o + e.n*18, e.o + e.n*21)}; for (var k in e) if (k !== 'o' && k !== 'n') o[k] = e[k]; VMOD[n] = o; }
  } catch (er){ VMOD = {}; }
})();
/* ---- Art 3 (0.44): the art chat's shaped props (assets/shaped/props.js) take the place of the KayKit and Kenney furniture, street props and cars.
   Each becomes the same triangle list the old models used, fitted to the old model's size so rooms lay out as before. Add ?oldart to the address for the old ones ---- */
var SPON = !!(window.SHAPED && SHAPED.build && SHAPED.props) && !/[?&]oldart/.test(location.search);
function spColour(pal, over, dk){ return function(name){ var d = name.slice(-2) === '_D', n = d ? name.slice(0, -2) : name, c = SHAPED.hex((over && over[n]) || pal[n] || '#ff00ff'); return d ? c.map(function(v){ return v*(dk || 0.78); }) : c; }; }
/* pieces to a triangle model {n, p, c, a, hx, hz, h}. opt.q: quarter turns; opt.car: turn a +z-facing model to face +x (the cars' frame);
   opt.fit {hx, hz, h}: stretch to that size, keeping the shape's proportions within a quarter. Glowing pieces (lamps) get alpha 128 so they stay bright */
function spModel(pieces, colourOf, opt){
  opt = opt || {}; var all = [], glo = [], i, k;
  pieces.forEach(function(q){ (q.glow ? glo : all).push(q); });
  var A = SHAPED.build(all, colourOf, null, {}), G = glo.length ? SHAPED.build(glo, colourOf, null, {}) : {pos:[], col:[]}, ng = A.pos.length/9;
  var pos = A.pos.concat(G.pos), col = A.col.concat(G.col), nv = pos.length/3, n = nv/3, P0 = new Float32Array(nv*3), C0 = new Uint8Array(n*3), A0 = new Uint8Array(n), mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (i = 0; i < nv; i++){ var x = pos[i*3], y = pos[i*3+1], z = pos[i*3+2], t;
    for (k = 0; k < (opt.q || 0) + (opt.car ? 1 : 0); k++){ t = x; x = z; z = -t; }
    P0[i*3] = x; P0[i*3+1] = y; P0[i*3+2] = z; for (k = 0; k < 3; k++){ mn[k] = Math.min(mn[k], P0[i*3+k]); mx[k] = Math.max(mx[k], P0[i*3+k]); } }
  var M = {n:n, p:P0, c:C0, a:A0, sp:1, hx:Math.max(-mn[0], mx[0]), hz:Math.max(-mn[2], mx[2]), h:mx[1]};
  if (opt.fit){ var f = opt.fit, sx = f.hx/(M.hx || 1), sz = f.hz/(M.hz || 1), sy = f.h ? f.h/(M.h || 1) : (sx + sz)/2, kk = Math.max(0.3, Math.min(2, (sx + sz)/2)), cl = function(v){ return Math.max(kk*0.8, Math.min(kk*1.25, v)); };
    sx = cl(sx); sz = cl(sz); sy = cl(sy); for (i = 0; i < nv; i++){ P0[i*3] *= sx; P0[i*3+1] *= sy; P0[i*3+2] *= sz; } M.hx *= sx; M.hz *= sz; M.h *= sy; }
  if (opt.s){ for (i = 0; i < nv; i++){ P0[i*3] *= opt.s[0]; P0[i*3+1] *= opt.s[1]; P0[i*3+2] *= opt.s[2]; } M.hx *= opt.s[0]; M.hz *= opt.s[2]; M.h *= opt.s[1]; }
  for (i = 0; i < n; i++){ for (k = 0; k < 3; k++) C0[i*3+k] = Math.round(Math.max(0, Math.min(1, col[i*9+k]))*255); A0[i] = i < ng ? 255 : 128; }
  return M;
}
/* which old model each shaped prop replaces (old name: [category, model]); quarter turn when the long side runs the other way */
var SP_OLD = {bed_single_A:'furniture.bed', bed_double_A:'furniture.bed', bed_double_B:'furniture.bed', couch:'furniture.sofa', couch_pillows:'furniture.sofa', armchair:'furniture.sofa',
  table_medium:'furniture.table', table_small:'furniture.table', table_low:'furniture.table', table_medium_long:'furniture.desk', k_desk:'furniture.desk', chair_A:'furniture.chair', chair_B_wood:'furniture.chair', chair_C:'furniture.chair',
  lamp_standing:'furniture.floor_lamp', k_lamp:'furniture.floor_lamp', k_stove:'furniture.stove', k_sink:'furniture.kitchen_counter', k_cab:'furniture.kitchen_counter', k_fridge:'furniture.fridge', k_toilet:'furniture.toilet',
  k_tub:'furniture.bathtub', k_tv:'furniture.tv', k_closet:'furniture.wardrobe', k_books:'furniture.bookshelf', k_trash:'street.trash_bin', k_box:'items.cardboard_box',
  streetlight:'street.street_lamp', firehydrant:'street.hydrant', bench:'street.bench', dumpster:'street.dumpster', bush:'plants.bush',
  chair_stool:'f2.chair_stool', cabinet_medium_decorated:'f2.cabinet_medium_decorated', cabinet_small_decorated:'f2.cabinet_small_decorated', cabinet_medium:'f2.cabinet_medium', cactus_medium_A:'f2.cactus_medium_A', k_basin:'f2.k_basin', k_night:'f2.k_night', k_bunk:'f2.k_bunk', k_plant:'f2.k_plant', k_rug:'f2.k_rug', k_washer:'f2.k_washer', k_coat:'f2.k_coat', k_stool:'f2.k_stool'};   /* 0.95.0: the last thirteen Kenney pieces, now the content chat's furniture set 2 (assets/shaped/furniture2.js) */
/* furniture that was plain boxes before and now has a model; its size comes from its floor space and its tallest box */
var SP_NEW = {locker:'furniture.locker', pew:'furniture.pew', crate:'furniture.crate', wardrobe:'furniture.bookshelf', shelf:'furniture.shop_shelf'};
function spPieces(path){ var a = path.split('.'), m; if (a[0] === 'ws'){ m = window.SHAPED && SHAPED.waterside && SHAPED.waterside.models.waterside; return m && m[a[1]]; } if (a[0] === 'f2'){ m = window.SHAPED && SHAPED.furniture2 && SHAPED.furniture2.models.furniture; return m && m[a[1]]; } m = SHAPED.props.models[a[0]]; return m && m[a[1]]; }
function spFitQ(pcs, hx, hz){ var M = spModel(pcs, function(){ return [0, 0, 0]; }); return (hx > hz*1.4 && M.hz > M.hx*1.4) || (hz > hx*1.4 && M.hx > M.hz*1.4) ? 1 : 0; }
var SPCAR = {}, MACH = [];
function spInstall(){ if (SPON) (function(){
  try {
    var PR = SHAPED.props, col = spColour(PR.palette), nm, pcs;
    for (nm in SP_OLD){ var O = MODELS[nm]; pcs = spPieces(SP_OLD[nm]); if (!O || !pcs) continue; MODELS[nm] = spModel(pcs, SP_OLD[nm].slice(0, 3) === 'f2.' ? spColour(SHAPED.furniture2.palette) : col, {q:nm === 'streetlight' ? 3 : spFitQ(pcs, O.hx, O.hz), fit:{hx:O.hx, hz:O.hz, h:O.h}}); }   /* the lamp's arm reaches over the road */
    for (nm in SP_NEW){ var F = FURN[nm]; pcs = spPieces(SP_NEW[nm]); if (!F || !pcs) continue; var s0 = F.s || [F.boxes[0][3], F.boxes[0][5]], hh = 0; F.boxes.forEach(function(b){ hh = Math.max(hh, b[1] + b[4]); });
      MODELS['sp_' + nm] = spModel(pcs, col, {q:spFitQ(pcs, s0[0], s0[1]), fit:{hx:s0[0]*0.96, hz:s0[1]*0.96, h:hh}}); F.models = ['sp_' + nm]; }
    /* cars: the body and bonnet as one model, and a wheel placed at each of the rig's wheel positions; taxis and police cars repaint the sedan */
    var CK = {sedan:['sedan'], hatch:['hatchback'], suv:['pickup'], van:['van'], taxi:['sedan', {paint3:'#c9a23a'}], police:['sedan', {paint3:'#e2ddd2', paint2:'#1f2024'}], truck:['pickup', {paint2:'#963e30'}]};
    for (nm in CK){ var V = PR.models.vehicles[CK[nm][0]], R = PR.vehicleRig[CK[nm][0]]; if (!V || !R || !VMOD[nm]) continue;
      var vc = spColour(PR.palette, CK[nm][1]), B = spModel(V.body.concat(V.bonnet || []), vc, {car:true}), Wm = spModel(V.wheel, vc, {car:true});
      VMOD['sp_' + nm + '_w'] = Wm; B.w = R.wheels.map(function(w){ return [w[2], w[1], -w[0], w[2] > 0 ? 1 : 0, 'sp_' + nm + '_w']; }); B.h = VMOD[nm].h; SPCAR[nm] = VMOD[nm]; VMOD[nm] = B; }
    /* 0.95.0: the safe-house truck is the pickup in its own red; its bonnet (copied, hinged at its back edge), driver's door, the gap the door leaves
       and the loose tyre are the content chat's pieces (vehicles.pickup.door_l / door_gap, items.tyre_loose) */
    try { var TV = PR.models.vehicles.pickup, TR = PR.vehicleRig.pickup, tcol = spColour(PR.palette, {paint2:'#963e30'}), TH = spModel(TV.bonnet, tcol, {car:true}), hpx = TR.bonnetHinge[2], hpy = TR.bonnetHinge[1], ti, tb = {};
      for (ti = 0; ti < TH.n*3; ti++){ TH.p[ti*3] -= hpx; TH.p[ti*3+1] -= hpy; }
      TH.px = hpx; TH.py = hpy; TH.x1 = TH.hx; TH.y1 = hpy; TH.hw = TH.hz; VMOD.truck_hood = TH;   /* hx and hz are the bonnet's farthest reach forward and across */
      var dh = TR.doorHinge;   /* the door, with its origin at its hinge, in the car's frame (x forward, z across) */
      VMOD.door = spModel(TV.door_l, tcol, {car:true}); for (ti = 0; ti < VMOD.door.n*3; ti++){ VMOD.door.p[ti*3] -= dh[2]; VMOD.door.p[ti*3+2] -= -dh[0]; }
      VMOD.truck_gap = spModel(TV.door_gap, tcol, {car:true});
      var tt = PR.models.items.tyre_loose; if (tt) VMOD.tire = spModel(tt, tcol); } catch (er3){ console.log('truck bits', er3); }
    /* wrecks and burnt-out shells of every car: the same parts with their own wheels, sunk by sitDrop */
    var WB = {sedan:'sedan', hatch:'hatchback', suv:'pickup', van:'van'};
    for (nm in WB) ['wreck', 'burnt'].forEach(function(st){ var pn = WB[nm] + '_' + st, V2 = PR.models.vehicles[pn], R2 = PR.vehicleRig[pn], key = nm + '_' + st; if (!V2 || !R2 || !VMOD[nm] && !SPCAR[nm]) return;
      var vc2 = spColour(PR.palette), B2 = spModel(V2.body.concat(V2.bonnet || []), vc2, {car:true}), W2 = spModel(V2.wheel, vc2, {car:true}); VMOD['sp_' + key + '_w'] = W2; B2.w = R2.wheels.map(function(w){ return [w[2], w[1], -w[0], w[2] > 0 ? 1 : 0, 'sp_' + key + '_w']; }); B2.h = (SPCAR[nm] || VMOD[nm]).h; B2.drop = R2.sitDrop || 0; VMOD[key] = B2; });
    /* 0.87: the art chat's service and construction vehicles (assets/shaped/machines.js), parked at rest as abandoned wrecks on the roads */
    try { var MC = SHAPED.machines; if (MC) for (var mn in MC.models){
      var mp = [], mw = MC.models[mn]; for (var pn2 in mw) if (pn2 !== 'wheel') mp = mp.concat(mw[pn2]);
      var mcol = spColour(MC.palette, {BODY:MC.paint[mn]}), MB = spModel(mp, mcol, {car:true}); MB.w = [];
      if (mw.wheel && MC.wheels[mn]){ var MW = spModel(mw.wheel, mcol, {car:true}); VMOD['sp_m_' + mn + '_w'] = MW; MB.w = MC.wheels[mn].map(function(w){ return [w[2], w[1], -w[0], 0, 'sp_m_' + mn + '_w']; }); }
      MB.drop = 0; VMOD['m_' + mn] = MB; MACH.push(mn); } } catch (er2){ console.log('machines', er2); }
  } catch (er){ console.log('shaped props', er); }
})(); }
/* a model part turned about its own sideways axis by rz (a wheel rolling, a bonnet lifting) and about the upright by ry (a wheel steering),
   placed at (ox, oy, oz) in the car's frame, then the car is turned by yaw and set at (x, z) */
Mesh.prototype.part = function(M, x, z, yaw, y0, ox, oy, oz, rz, ry){
  var cs = Math.cos(yaw), sn = Math.sin(yaw), cz = Math.cos(rz || 0), sz = Math.sin(rz || 0), cy = Math.cos(ry || 0), sy = Math.sin(ry || 0), p = M.p, c = M.c, q = [0,0,0,0,0,0,0,0,0], yb = y0 + this.yo;
  for (var i = 0; i < M.n; i++){
    for (var j = 0; j < 3; j++){ var o = i*9 + j*3, lx = p[o], ly = p[o + 1], lz = p[o + 2], ax = lx*cz + ly*sz, ay = -lx*sz + ly*cz, bx = ax*cy - lz*sy + ox, bz = ax*sy + lz*cy + oz;
      q[j*3] = x + cs*bx - sn*bz; q[j*3 + 1] = yb + ay + oy; q[j*3 + 2] = z + sn*bx + cs*bz; }
    this.tri(q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], [c[i*3], c[i*3 + 1], c[i*3 + 2]], M.a ? M.a[i] : 255);
  }
};
/* a flat quad given by four corners in a car's frame */
Mesh.prototype.cquad = function(v, y0, k, col){
  var cs = Math.cos(v.yaw), sn = Math.sin(v.yaw), w = [];
  for (var i = 0; i < 4; i++){ var lx = k[i*3], lz = k[i*3 + 2]; w.push(v.x + cs*lx - sn*lz, y0 + this.yo + k[i*3 + 1], v.y + sn*lx + cs*lz); }
  this.quad(w[0], w[1], w[2], w[3], w[4], w[5], w[6], w[7], w[8], w[9], w[10], w[11], col, 255);
};
/* ---- more furniture. Everything is built with its back at -z so the layout rules can push it against a wall. s = half width, half depth of the floor space it takes. ---- */
FURN.bed.boxes = [[0,.25,0,.7,.25,1,'#7a5a3c'],[0,.55,.04,.65,.08,.94,'#c9d3e0'],[0,.68,-.7,.5,.07,.22,'#f2f2f2'],[0,.55,-1.02,.72,.55,.04,'#5a4028']];
FURN.bed.models = ['bed_single_A']; FURN.bed.s = [.72,1.15]; FURN.bed.fix = 'bed';
FURN.bed2 = {fix:'bed', models:['bed_double_A','bed_double_B'], s:[1.2,1.15], boxes:[[0,.25,0,1.1,.25,1,'#7a5a3c'],[0,.55,.04,1.05,.08,.94,'#b9c7d6'],[0,.68,-.7,.9,.07,.22,'#f2f2f2'],[0,.55,-1.02,1.12,.55,.04,'#5a4028']]};
FURN.sofa.models = ['couch','couch_pillows']; FURN.sofa.s = [1.15,.62];
FURN.armchair = {models:['armchair'], s:[.7,.62], boxes:[[0,.25,0,.5,.25,.42,'#5f7f9a'],[0,.6,-.32,.5,.3,.1,'#4f6b85']]};
FURN.table.models = ['table_medium']; FURN.table.s = [.78,.78]; FURN.table.boxes = [[0,.72,0,.7,.04,.7,'#a8743e'],[0,.35,0,.08,.35,.08,'#6b4526']];
FURN.ctable = {models:['table_low'], s:[.9,.58], boxes:[[0,.34,0,.8,.04,.5,'#a8743e'],[0,.16,0,.6,.16,.3,'#6b4526']]};
FURN.stable = {models:['table_small'], s:[.4,.4], boxes:[[0,.72,0,.36,.04,.36,'#a8743e'],[0,.35,0,.06,.35,.06,'#6b4526']]};
FURN.desk.s = [1.13,.75]; FURN.desk.boxes = [[0,.72,0,1.1,.04,.7,'#7a5a3c'],[-.9,.35,0,.15,.35,.6,'#5a4028'],[.9,.35,0,.15,.35,.6,'#5a4028']];
FURN.odesk = {models:['k_desk'], s:[.77,.48], boxes:[[0,.72,0,.8,.04,.4,'#8b8f94'],[-.6,.35,0,.15,.35,.38,'#5d6268'],[.6,.35,0,.15,.35,.38,'#5d6268'],[0,1.02,-.2,.3,.2,.03,'#15171a'],[0,.8,-.2,.05,.06,.05,'#2a2c30'],[.1,.77,.12,.22,.01,.08,'#d9d9d6']]};
FURN.chair.models = ['chair_A','chair_B_wood','chair_C']; FURN.chair.s = [.3,.34]; FURN.chair.boxes = [[0,.22,0,.24,.22,.24,'#8a6a48'],[0,.66,-.22,.24,.24,.03,'#7a5a3c']];
FURN.stool = {models:['chair_stool'], s:[.28,.28], boxes:[[0,.3,0,.2,.3,.2,'#5a4028']]};
FURN.lamp.s = [.22,.22]; FURN.lamp.models = ['lamp_standing', 'k_lamp']; FURN.plant.models = ['cactus_medium_A', 'k_plant']; FURN.stool.models = ['chair_stool', 'k_stool']; FURN.fridge.models = ['k_fridge']; FURN.fridge.s = [.45,.33];
FURN.washer = {name:'washing machine', lt:{scrap:1, coat:.5, none:4}, models:['k_washer'], s:[.41,.41], boxes:[[0,.48,0,.4,.48,.4,'#e9ecee']]};
FURN.coatrack = {soft:1, models:['k_coat'], s:[.29,.29], boxes:[[0,.8,0,.05,.8,.05,'#7a5a3c']]};
FURN.bin = {name:'bin', lt:{food:.5, scrap:1, none:5}, models:['k_trash'], s:[.22,.25], boxes:[[0,.42,0,.2,.42,.2,'#55595f']]}; FURN.plant.s = [.33,.33]; FURN.dresser.s = [.78,.4];
FURN.dresser.lt = {coat:1, sweater:2, thermals:1, beanie:1, gloves:.8, cap:.8, battery:1, flashlight:.3, none:3};
FURN.fridge.lt = {fresh:4, food:1, water:3, none:2};
FURN.cabinet.lt = {medkit:5, bandage:3, antibio:1, splint:.6, none:1};
FURN.bench.name = 'tool bench'; FURN.bench.lt = {scrap:4, battery:1, flashlight:.5, wood:1, tape:1.5, none:1}; FURN.bench.fix2 = 'bench';
FURN.rug = {flat:1, models:['k_rug'], s:[1.3,.9], boxes:[[0,.006,0,1.3,.006,.9,'#9a5a4a'],[0,.008,0,1.1,.006,.7,'#c9a87a']]};
FURN.mat = {flat:1, s:[.9,.4], boxes:[[0,.03,0,.9,.03,.4,'#3d6b8c']]};
FURN.stove = {fix:'stove', models:['k_stove'], s:[.45,.47], boxes:[[0,.45,0,.38,.45,.32,'#d9d9d6'],[0,.91,0,.38,.01,.32,'#2a2c30'],[0,1.05,-.3,.38,.13,.03,'#c9c9c6'],[0,.5,.33,.3,.22,.005,'#2a2c30']]};
FURN.sink = {fix:'tap', taps:2, models:['k_sink'], s:[.45,.47], boxes:[[0,.45,0,.6,.45,.32,'#8a6a48'],[0,.91,0,.62,.02,.34,'#d6d2c8'],[0,.925,0,.25,.02,.2,'#9aa3aa'],[0,1.08,-.22,.03,.14,.03,'#b9c0c6']]};
FURN.kcab = {models:['k_cab'], s:[.45,.47], name:'cupboard', lt:{food:4, water:1, battery:.5, none:2}, boxes:[[0,.45,0,.6,.45,.32,'#8a6a48'],[0,.91,0,.62,.02,.34,'#d6d2c8'],[0,1.8,-.15,.6,.35,.17,'#8a6a48']]};
FURN.toilet = {fix:'tap', taps:1, models:['k_toilet'], s:[.33,.5], boxes:[[0,.2,.08,.2,.2,.26,'#f2f2ee'],[0,.42,.08,.22,.03,.28,'#e6e6e0'],[0,.6,-.24,.22,.3,.1,'#f2f2ee']]};
FURN.tub = {fix:'tap', taps:2, models:['k_tub'], s:[1.25,.59], boxes:[[0,.28,0,.85,.28,.4,'#f2f2ee'],[0,.5,0,.75,.07,.3,'#bcd6e0']]};
FURN.basin = {fix:'tap', taps:1, models:['k_basin'], s:[.36,.43], name:'bathroom cabinet', lt:{medkit:3, bandage:2, antibio:.4, water:1, none:3}, boxes:[[0,.42,0,.3,.42,.22,'#e9e6de'],[0,.86,0,.32,.03,.24,'#f6f6f2'],[0,1.5,-.2,.28,.3,.03,'#a9c4cf']]};
FURN.tv = {models:['k_tv'], s:[.84,.33], boxes:[[0,.25,0,.6,.25,.2,'#4a3a2c'],[0,.85,0,.55,.32,.03,'#15171a'],[0,.85,.031,.5,.27,.003,'#27323a']]};
FURN.nightstand = {models:['k_night'], s:[.28,.24], name:'nightstand', lt:{battery:2, flashlight:1, medkit:.5, ammo:.4, key:.8, none:3}, boxes:[[0,.28,0,.22,.28,.22,'#7a5a3c'],[0,.62,0,.05,.06,.05,'#6b4526'],[0,.78,0,.12,.1,.12,'#e8d9a8']]};
FURN.closet = {models:['k_closet'], s:[.42,.27], hide:1, name:'wardrobe', lt:{coat:2, raincoat:1.5, leather:.4, sweater:1.5, boots:1, trousers:.8, scrap:.5, none:3}, boxes:[[0,1,0,.6,1,.3,'#6b4a30'],[0,1,.305,.012,.92,.005,'#3a2a1c'],[-.08,1,.31,.02,.1,.01,'#c9a84a'],[.08,1,.31,.02,.1,.01,'#c9a84a']]};
FURN.pew = {s:[1.4,.26], boxes:[[0,.42,0,1.4,.04,.22,'#7a5230'],[0,.7,-.2,1.4,.3,.03,'#6b4526'],[-1.38,.4,0,.03,.4,.24,'#6b4526'],[1.38,.4,0,.03,.4,.24,'#6b4526']]};
FURN.altar = {boxes:[[0,.5,0,.8,.5,.35,'#e6e0d0'],[0,1.02,0,.85,.02,.4,'#f6f2e6'],[0,1.5,0,.04,.45,.04,'#c9a84a'],[0,1.65,0,.2,.04,.04,'#c9a84a']]};
FURN.checkout = {name:'till', lt:{battery:1, scrap:1, none:3}, boxes:[[0,.5,0,.9,.5,.3,'#4f5560'],[0,1.02,0,.92,.02,.32,'#c9ccd1'],[.5,1.2,0,.18,.16,.16,'#2a2c30']]};
FURN.rack = {name:'clothes rack', lt:{coat:2, sweater:2, raincoat:2, leather:.8, beanie:1, cap:1, thermals:1, trousers:1, none:2}, s:[.8,.22], boxes:[[0,1.05,0,.7,.4,.18,'#8a5a6a'],[0,1.5,0,.8,.03,.03,'#b9c0c6'],[-.78,.75,0,.03,.75,.03,'#b9c0c6'],[.78,.75,0,.03,.75,.03,'#b9c0c6'],[.3,1.0,0,.2,.42,.19,'#5a7a8a'],[-.35,1.02,0,.15,.4,.19,'#b9a05a']]};
FURN.vending = {name:'vending machine', lt:{food:4, water:4, none:1}, boxes:[[0,.95,0,.45,.95,.38,'#b03a2e'],[-.08,1.1,.385,.3,.6,.005,'#1c2a33'],[.36,1.1,.385,.05,.2,.005,'#d9d9d6']]};
FURN.filing = {name:'filing cabinet', lt:{scrap:1, battery:.5, none:5}, boxes:[[0,.65,0,.25,.65,.3,'#8a9199'],[0,.95,.305,.12,.02,.005,'#55595f'],[0,.55,.305,.12,.02,.005,'#55595f'],[0,.15,.305,.12,.02,.005,'#55595f']]};
FURN.bunk = {fix:'bed', models:['k_bunk'], s:[.6,1.15], boxes:[[0,.3,0,.48,.06,1,'#55595f'],[0,.42,0,.45,.07,.95,'#c9d3e0'],[0,1.4,0,.48,.06,1,'#55595f'],[0,1.52,0,.45,.07,.95,'#c9d3e0'],[-.46,.9,-.98,.03,.9,.03,'#3a3f46'],[.46,.9,-.98,.03,.9,.03,'#3a3f46'],[-.46,.9,.98,.03,.9,.03,'#3a3f46'],[.46,.9,.98,.03,.9,.03,'#3a3f46']]};
FURN.board = {soft:1, s:[1.2,.05], boxes:[[0,1.5,0,1.2,.5,.03,'#2f4a3a'],[0,.98,.03,1.2,.03,.05,'#8a6a48']]};
FURN.safe = {name:'safe', lt:{ammo:3, medkit:1, radio:1, battery:1, none:2}, boxes:[[0,.6,0,.45,.6,.4,'#3a3f46'],[0,.6,.405,.1,.1,.005,'#c9a84a'],[.25,.6,.405,.03,.15,.005,'#b9c0c6']]};
FURN.gunlocker = {name:'gun locker', lt:{ammo:7, flashlight:1, none:1}, boxes:[[0,1,0,.5,1,.28,'#3d4a3a'],[0,1,.285,.01,.9,.005,'#22291f'],[.1,1,.29,.02,.1,.01,'#c9ccd1']]};
FURN.irack = {name:'storage rack', s:[1.2,.42], boxes:[[0,.5,0,1.2,.04,.4,'#c96a2a'],[0,1.3,0,1.2,.04,.4,'#c96a2a'],[0,2.1,0,1.2,.04,.4,'#c96a2a'],[-1.17,1.1,-.37,.04,1.1,.04,'#2f4a7a'],[1.17,1.1,-.37,.04,1.1,.04,'#2f4a7a'],[-1.17,1.1,.37,.04,1.1,.04,'#2f4a7a'],[1.17,1.1,.37,.04,1.1,.04,'#2f4a7a'],[-.6,.8,0,.4,.26,.32,'#b98a52'],[.5,.75,0,.3,.21,.3,'#a87a48'],[.2,1.62,0,.5,.28,.32,'#b98a52'],[-.7,.26,0,.35,.2,.3,'#8a9199']]};
FURN.display = {name:'display case', boxes:[[0,.45,0,.8,.45,.35,'#e9e6de'],[0,1.0,0,.8,.1,.35,'#a9c4cf'],[-.4,.96,0,.15,.04,.1,'#15171a'],[.3,.96,.05,.2,.04,.12,'#3a3f46']]};
FURN.weights = {s:[.7,.28], boxes:[[0,.4,0,.7,.04,.25,'#2a2c30'],[0,.8,0,.7,.04,.25,'#2a2c30'],[-.68,.45,0,.03,.45,.26,'#55595f'],[.68,.45,0,.03,.45,.26,'#55595f'],[-.4,.52,0,.08,.08,.2,'#15171a'],[0,.52,0,.1,.1,.2,'#15171a'],[.4,.52,0,.12,.12,.2,'#15171a'],[-.2,.92,0,.1,.1,.2,'#15171a'],[.3,.92,0,.08,.08,.2,'#15171a']]};
FURN.treadmill = {s:[.4,.85], boxes:[[0,.12,0,.36,.08,.8,'#2a2c30'],[0,.7,-.75,.36,.6,.04,'#55595f'],[0,1.3,-.72,.3,.1,.06,'#15171a']]};
FURN.stage = {s:[2.5,1.2], boxes:[[0,.3,0,2.5,.3,1.2,'#5a4028'],[0,.61,0,2.5,.01,1.2,'#7a5a3c']]};
/* ---- what goes in each kind of room. [thing, where, how many, extras]
   where: wall (back to a wall), door (wall nearest the way in), far (wall farthest from it), corner, end (middle of the far end wall), mid (centre of the room), rows (lines with aisles)
   how many: a negative number means one per that many square metres. extras: ring = chairs around it, seat = a chair in front, side = something beside it, face 'far' = rows all facing the far end ---- */
['dresser', 'fridge', 'closet', 'locker', 'wardrobe', 'shelf', 'filing', 'gunlocker', 'vending'].forEach(function(n){ FURN[n].heavy = 1; });   /* things you can shove against a door */
spInstall();
var ROOMS = {
  living:[['rug','mid',1],['sofa','wall',1],['tv','wall',1],['ctable','mid',1],['armchair','corner',1],['wardrobe','wall',1],['lamp','corner',1],['plant','corner',1]],
  living_k:[['fridge','wall',1],['stove','wall',1],['kcab','wall',1],['sink','wall',1],['sofa','wall',1],['tv','wall',1],['table','mid',1,{ring:4}],['lamp','corner',1]],
  kitchen:[['fridge','wall',1],['stove','wall',1],['sink','wall',1],['kcab','wall',2],['bin','corner',1],['table','mid',1,{ring:4}]],
  bedroom:[['rug','mid',1],['bed','wall',1,{side:'nightstand', alt:'bed2'}],['closet','wall',1],['dresser','wall',1],['lamp','corner',1]],
  bath:[['toilet','wall',1],['basin','wall',1],['tub','wall',1]],
  wc:[['toilet','wall',2],['basin','wall',1]],
  store:[['washer','wall',1],['shelf','wall',1],['crate','wall',2],['barrel','corner',1]],
  studio:[['bed','wall',1,{side:'nightstand'}],['fridge','wall',1],['stove','wall',1],['kcab','wall',1],['sofa','wall',1],['tv','wall',1],['table','mid',1,{ring:2}],['closet','wall',1],['basin','corner',1]],
  market:[['checkout','door',2],['fridge','far',-40],['shelf','rows',-9,{gw:.06, gd:1.7, brk:4}],['vending','door',1],['crate','corner',2]],
  gshop:[['checkout','door',1],['shelf','rows',-12,{gw:.06, gd:1.8, brk:3}],['display','wall',-40],['crate','corner',1]],
  stock:[['shelf','wall',2],['crate','wall',-10],['irack','wall',1],['barrel','corner',1]],
  dining:[['counter','door',1],['table','rows',-11,{ring:4, gw:1.7, gd:1.7}],['fridge','far',1],['plant','corner',2]],
  kitchenC:[['stove','wall',2],['sink','wall',1],['fridge','wall',2],['kcab','wall',2],['counter','mid',1],['shelf','wall',1]],
  barroom:[['counter','far',2,{front:'stool'}],['fridge','far',1],['shelf','far',1],['stable','rows',-10,{ring:3, gw:1.9, gd:1.9}],['sofa','wall',1]],
  waiting:[['counter','door',1,{seat:1}],['chair','wall',-6],['plant','corner',2],['vending','wall',1],['cabinet','far',1]],
  exam:[['gurney','wall',1],['cabinet','wall',2],['odesk','wall',1,{seat:1}],['basin','wall',1],['chair','wall',1]],
  ward:[['cabinet','wall',3],['gurney','wall',-9,{side:'nightstand'}],['locker','wall',2],['basin','corner',1]],
  office:[['bin','corner',1],['odesk','wall',-11,{seat:1}],['filing','wall',-18],['wardrobe','wall',1],['plant','corner',1],['locker','wall',1]],
  lobby:[['coatrack','corner',1],['counter','door',1,{seat:1}],['sofa','wall',2],['ctable','mid',1],['plant','corner',2],['vending','wall',1],['filing','far',1]],
  breakroom:[['fridge','wall',1],['kcab','wall',1],['sink','wall',1],['vending','wall',1],['table','mid',1,{ring:4}]],
  classroom:[['board','end',1],['desk','end',1,{off:1.3}],['stable','rows',-7,{face:'far', seat:1, gw:.9, gd:1.1, mf:4.2}],['locker','wall',3],['wardrobe','wall',1]],
  libhall:[['counter','door',1,{seat:1}],['wardrobe','rows',-7,{gw:.05, gd:1.5, brk:4}],['table','mid',1,{ring:4}],['dresser','wall',2],['armchair','corner',2]],
  nave:[['altar','end',1],['pew','rows',-9,{face:'far', gw:1.3, gd:.75, mf:4}],['dresser','wall',1],['crate','corner',1]],
  vestry:[['closet','wall',1],['dresser','wall',1],['table','mid',1,{ring:2}],['crate','wall',1]],
  bullpen:[['counter','door',1,{seat:1}],['odesk','rows',-16,{face:'far', seat:1, gw:1.2, gd:1.6}],['gunlocker','far',2],['locker','wall',3],['filing','wall',2]],
  armory:[['gunlocker','wall',3],['locker','wall',2],['crate','wall',2],['bench','wall',1]],
  firebay:[['locker','wall',4],['bench','wall',1],['cabinet','wall',1],['crate','wall',2],['barrel','corner',2]],
  bunkroom:[['bunk','wall',-9],['locker','wall',2],['table','mid',1,{ring:4}],['fridge','wall',1]],
  workshop:[['bench','wall',2],['irack','wall',1],['locker','wall',1],['crate','wall',2],['barrel','corner',2]],
  warehouse:[['irack','rows',-22,{gw:.1, gd:2.4, brk:3}],['crate','wall',-30],['barrel','corner',2],['bench','door',1]],
  parking:[['barrel','corner',2],['crate','wall',2]],
  boutique:[['checkout','door',1],['rack','rows',-9,{gw:1.1, gd:1.5}],['dresser','wall',2],['closet','far',2],['armchair','corner',1]],
  estore:[['checkout','door',1],['display','rows',-12,{gw:1.2, gd:1.6}],['shelf','wall',2],['tv','wall',2],['locker','far',1]],
  hardware:[['checkout','door',1],['shelf','rows',-10,{gw:.06, gd:1.7, brk:4}],['bench','wall',1],['crate','wall',2],['barrel','corner',2]],
  outfitter:[['checkout','door',1],['rack','rows',-14,{gw:1.1, gd:1.6}],['gunlocker','far',2],['shelf','wall',2],['crate','corner',1]],
  cstore:[['checkout','door',1],['fridge','far',2],['shelf','rows',-12,{gw:.06, gd:1.7, brk:3}],['vending','wall',1],['crate','corner',1]],
  bankhall:[['counter','far',3,{seat:1}],['sofa','wall',1],['plant','corner',2],['odesk','wall',1,{seat:1}],['locker','far',1]],
  vault:[['safe','wall',3],['filing','wall',2],['locker','wall',1]],
  hroom:[['bed2','wall',1,{side:'nightstand', alt:'bed'}],['tv','wall',1],['dresser','wall',1],['armchair','corner',1],['fridge','corner',1]],
  gymfloor:[['weights','wall',3],['treadmill','wall',-25],['mat','rows',-14,{gw:1.2, gd:1.4}],['locker','far',3],['vending','door',1]],
  lockers:[['locker','wall',-5],['pew','mid',1],['basin','wall',1],['cabinet','wall',1]],
  hall:[['stage','end',1],['chair','rows',-4,{face:'far', gw:.35, gd:.6, mf:4.5, brk:6}],['table','wall',2],['locker','wall',1],['crate','corner',2]]
};
var PLAN = {
  house:{one:'studio', two:['living_k','bedroom'], rooms:['living','kitchen','bedroom','bedroom','store'], more:['bedroom','store','office'], small:'bath'},
  garage:{rooms:['workshop'], more:['store']},
  grocery:{rooms:['market'], more:['stock']},
  restaurant:{rooms:['dining','kitchenC'], more:['stock','wc']},
  bar:{rooms:['barroom'], more:['stock','wc']},
  clinic:{one:'exam', rooms:['waiting','exam'], more:['exam','office']},
  hospital:{one:'ward', rooms:['waiting','ward'], more:['exam','ward','office']},
  police:{rooms:['bullpen','armory'], more:['office','store']},
  fire:{rooms:['firebay','bunkroom'], more:['breakroom','office']},
  outdoors:{rooms:['outfitter'], more:['stock']},
  hardware:{rooms:['hardware'], more:['stock']},
  fuel:{rooms:['cstore'], more:['stock']},
  warehouse:{rooms:['warehouse'], more:['warehouse','office']},
  parking:{rooms:['parking'], more:['parking']},
  clothes:{rooms:['boutique'], more:['stock']},
  electronics:{rooms:['estore'], more:['stock']},
  shop:{rooms:['gshop'], more:['stock']},
  school:{rooms:['classroom','classroom','office'], more:['classroom','breakroom']},
  library:{rooms:['libhall'], more:['libhall','office']},
  church:{rooms:['nave'], more:['vestry']},
  office:{one:'office', rooms:['lobby','office'], more:['office','breakroom','office']},
  bank:{rooms:['bankhall','vault'], more:['office']},
  hotel:{one:'hroom', rooms:['lobby'], more:['hroom']},
  gym:{rooms:['gymfloor'], more:['lockers']},
  venue:{rooms:['hall'], more:['stock','breakroom']}
};
PLAN.apartments = PLAN.house; PLAN.food = PLAN.restaurant; PLAN.medical = PLAN.clinic; PLAN.industrial = PLAN.garage; PLAN.civic = PLAN.office;
/* ---- upstairs: homes two storeys or taller get a staircase and a second floor. FH is the height of one storey ---- */
var FH = 3.0, RUN = 3.6, PLAN_UP = {one:'bedroom', two:['bedroom', 'bath'], rooms:['bedroom', 'bath', 'bedroom'], more:['bedroom', 'store', 'office'], small:'bath'};
/* what is upstairs depends on the building: bedrooms over a home, a flat over a shop, offices, wards, bunks, classrooms... */
var UPP = {flat:{one:'studio', two:['living_k', 'bedroom'], rooms:['living_k', 'bedroom', 'bath'], more:['bedroom', 'store'], small:'bath'}, office:{one:'office', rooms:['office', 'breakroom', 'office'], more:['office', 'store']},
  clinic:{one:'ward', rooms:['ward', 'exam', 'office'], more:['ward', 'office']}, police:{one:'office', rooms:['office', 'store'], more:['office']}, fire:{one:'bunkroom', rooms:['bunkroom', 'breakroom'], more:['office']},
  school:{one:'classroom', rooms:['classroom', 'office'], more:['classroom']}, library:{one:'libhall', rooms:['libhall', 'office'], more:['office']}, hotel:{one:'hroom', rooms:['hroom', 'hroom', 'bath'], more:['hroom'], small:'bath'}};
var UPK = {house:PLAN_UP, apartments:PLAN_UP, office:UPP.office, bank:UPP.office, clinic:UPP.clinic, hospital:UPP.clinic, police:UPP.police, fire:UPP.fire, school:UPP.school, library:UPP.library, hotel:UPP.hotel}, NOUP = {garage:1, parking:1, church:1, warehouse:1, venue:1, gym:1, fuel:1};
function upPlan(b){ return UPK[b.kind] || (b.cat === 'house' ? PLAN_UP : b.cat === 'civic' ? UPP.office : b.cat === 'medical' ? UPP.clinic : UPP.flat); }
function hasUp(b){ return !NOUP[b.kind] && b.h > 6 && !!b.door && b.area >= 60 && b.area < (b.h > 14 ? 1800 : 900); }
/* how many floors a building has indoors: one for each 3 m of height, up to 14 */
function nFl(b){ return hasUp(b) ? Math.max(2, Math.min(14, Math.floor((b.h - 2.6)/FH) + 1)) : 1; }
function nLv(b){ return b && b.int && b.int.nl || 1; }
function lvSegs(b, l){ var I = b.int; return l && I.lv && I.lv[l] ? I.lv[l].segs : I.segs; }
function lvCircs(b, l){ var I = b.int; return l && I.lv && I.lv[l] ? I.lv[l].circs : I.circs; }
/* where along the stairs a point is: 0 at the bottom step, 1 at the top, -1 when not on them */
/* where along a flight a point is: 0 at the foot, 1 at the top, -1 when not on it */
function stairTS(S, x, y){
  var u = x*S.ux + y*S.uy, v = x*S.vx + y*S.vy, a = S.A ? v : u, c = S.A ? u : v;
  if (c < S.c0 - 0.05 || c > S.c1 + 0.05) return -1; var t = (a - S.s0)/(S.s1 - S.s0); return t < -0.02 || t > 1.02 ? -1 : Math.max(0, Math.min(1, t));
}
/* the flight someone on floor lvl is standing on at (x, y): shaft A carries flights 0, 2, 4..., shaft B flights 1, 3, 5... A flight f runs from floor f up to floor f+1; from floor f+1 the same flight is the way down */
function stairOn(b, x, y, lvl){
  var I = b && b.int, SS = I && I.stairs; if (!SS) return null; lvl = lvl | 0;
  for (var i = 0; i < SS.length; i++){ var S = SS[i], f = lvl%2 === S.par ? lvl : lvl - 1; if (f < S.min || f > I.nl - 2) continue; var t = stairTS(S, x, y); if (t >= 0) return {S:S, t:t, f:f}; }
  return null;
}
function stairT(b, x, y, lvl){ var o = stairOn(b, x, y, lvl); return o ? o.t : -1; }
/* the flight to use to go up (or down) from floor lvl */
function stairFor(b, lvl, up){
  var I = b && b.int, SS = I && I.stairs; if (!SS) return null; var f = up ? lvl : lvl - 1;
  for (var i = 0; i < SS.length; i++) if (SS[i].par === f%2 && f >= SS[i].min && f <= I.nl - 2) return SS[i];
  return null;
}
/* how high above the building's ground floor something is standing: on a flight of stairs, or on its floor */
function lvlY(b, e){ if (!b || !b.int || !b.int.stairs) return 0; var o = stairOn(b, e.x, e.y, e.lvl); return o ? (o.f + o.t)*FH : (e.lvl || 0)*FH; }
/* ---- survival depth: wounds, infection, broken legs, food poisoning, tiredness and food going off ---- */
var FRESH_S = 1800, MEAL_S = 1500, LEG_S = 600, REST_S = 3600, drops = [];
function loadConds(cs){
  var n = function(v, lo, hi, d){ v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; }; cs = cs || {};
  P.rest = n(cs.rest, 0, 100, 100); P.bleed = n(cs.bleed, 0, 300, 0); P.wound = cs.wound ? 1 : 0; P.woundT = 0; P.inf = n(cs.inf, 0, 1e6, 0); P.leg = [0, 1, 2].indexOf(cs.leg | 0) >= 0 ? cs.leg | 0 : 0; P.legT = n(cs.legT, 0, LEG_S, LEG_S);
  P.sick = n(cs.sick, 0, 300, 0); P.freshT = n(cs.freshT, 0, FRESH_S, 0); P.mealT = n(cs.mealT, 0, MEAL_S, 0); P.dur = {}; if (cs.dur) for (var k in cs.dur) if (typeof cs.dur[k] === 'number') P.dur[k] = n(cs.dur[k], 0.01, 1, 1);
  P.restWarn = 0;
}
function breakLeg(){ P.leg = 1; sfx('wood_hit', undefined, undefined, 0.9, 0.6); toast('Your leg is broken: you limp, and cannot run or climb. A splint (or 2 wood and 1 fibre to make one) lets it heal.', 7); }
function injure(k, armor){
  if (Math.random() < ([0.25, 0.4, 0.5][k] || 0)*(1 - (armor || 0)*1.5)){ var was = P.bleed > 0; P.bleed = Math.max(P.bleed || 0, 90 + Math.random()*60); P.wound = 1; P.woundT = 0; if (!was) toast('You are bleeding. Use a bandage (4) or a medkit (3).', 5); }
  if (k === 2 && !P.leg && Math.random() < 0.3) breakLeg();
}
function spoil(k, tk, secs, dt){
  if (!(inv[k] > 0)){ P[tk] = 0; return; } if (!(P[tk] > 0)) P[tk] = secs; P[tk] -= dt;
  if (P[tk] <= 0){ P[tk] = 0; feed((k === 'meal' ? 'Your hot meal' : 'Your fresh food') + ' has gone off (' + inv[k] + ')', ITEMS.rotten[1]); inv.rotten += inv[k]; inv[k] = 0; updateHud(); }
}
function condTick(dt){
  var sl = !!P.sleep, k = sl ? 0.04 : 1, kd = dt*k;   /* asleep, the night rushes past: everything but rest slows to match */
  if (sl) P.rest = Math.min(100, P.rest + dt*100/(DAY*7/24)); else P.rest = Math.max(0, P.rest - dt*100/REST_S*(P.run || keys.ShiftLeft ? 1.4 : 1)*(P.inf ? 1.3 : 1));
  if (!sl){ var rw = P.rest <= 0 ? 3 : P.rest < 12 ? 2 : P.rest < 30 ? 1 : 0; if (rw > (P.restWarn || 0)) toast(['', 'You are getting tired. Sleep in a bed when it is safe.', 'You are exhausted: slower, weaker, and your eyes keep closing. Find a bed.', 'You are collapsing from exhaustion and losing health. Sleep now.'][rw], 6); P.restWarn = P.rest > 40 ? 0 : Math.max(P.restWarn || 0, rw); }
  if (P.rest <= 0 && !sl){ P.hp -= 0.05*dt; P.cause = 'exhaustion'; }
  if (P.bleed > 0){ P.bleed -= kd; P.hp -= 0.25*kd; P.cause = 'bleeding'; P.dripT = (P.dripT || 0) - dt; if (P.dripT <= 0 && !sl){ P.dripT = 0.6; drops.push({x:P.x + (Math.random() - 0.5)*0.3, y:P.y + (Math.random() - 0.5)*0.3, y0:P.gy || 0, t:time}); if (drops.length > 80) drops.shift(); }
    if (P.bleed <= 0){ P.bleed = 0; feed('The bleeding has stopped, but the wound is open', '#d9a07a'); } }
  if (P.wound && !P.inf && !(P.bleed > 0)){ P.woundT += kd; if (P.woundT > 150){ P.wound = 0; P.woundT = 0; if (Math.random() < 0.5){ P.inf = 1; toast('Your wound is infected: fever, slow health loss, and you tire faster. Antibiotics cure it.', 7); } else feed('The wound is healing cleanly', '#9bb07a'); } }
  if (P.inf){ P.inf += kd; P.hp -= 0.04*kd; P.cause = 'an infection'; }
  if (P.leg === 2){ P.legT -= kd; if (P.legT <= 0){ P.leg = 0; P.legT = LEG_S; toast('Your leg has healed. You can run again.', 4); } }
  if (P.sick > 0){ P.sick -= kd; P.thirst = Math.max(0, P.thirst - kd*0.5); P.hp -= 0.04*kd; P.cause = 'food poisoning'; if (P.sick <= 0){ P.sick = 0; feed('Your stomach settles', '#9bb07a'); } }
  spoil('fresh', 'freshT', FRESH_S, kd); spoil('meal', 'mealT', MEAL_S, kd);
  for (var i = drops.length - 1; i >= 0; i--) if (time - drops[i].t > 90) drops.splice(i, 1);
  var tm = el('tiredMask'); if (tm) tm.style.opacity = sl ? 0 : P.rest < 12 ? (0.18 + 0.3*Math.max(0, Math.sin(time*0.8))*Math.max(0, Math.sin(time*0.23))).toFixed(2) : 0;
}
function drawHatch(m){ var H = P.roof && hatchOf(P.roof); if (!H) return; m.yo = roofY(P.roof); m.ybox(H.x, H.y, 0, 0, 0, 0.04, 0.46, 0.04, 0.46, [70,72,76]); m.ybox(H.x, H.y, 0, 0, 0, 0.085, 0.36, 0.01, 0.36, [120,124,128]); m.yo = 0; }
function drawDrops(m){ for (var i = 0; i < drops.length; i++){ var d = drops[i]; if (Math.abs(d.x - P.x) > 40 || Math.abs(d.y - P.y) > 40) continue; m.yo = d.y0; m.ybox(d.x, d.y, i, 0, 0, 0.025, 0.07, 0.006, 0.05, [120,18,18]); } m.yo = 0; }
/* ---- clothes (0.40) ---- */
function loadWorn(cs){
  P.worn = {}; var w = cs && cs.worn;
  if (w && typeof w === 'object') SLOTS.forEach(function(sl){ var o = w[sl[0]]; if (o && CLOTHES[o.k] && CLOTHES[o.k].s === sl[0]) P.worn[sl[0]] = {k:o.k, c:Math.max(0.05, Math.min(1, +o.c || 1))}; });
  else if (inv.coat > 0){ inv.coat--; P.worn.outer = {k:'coat', c:1}; }   /* a save from before 0.40: the coat you carried is now worn */
}
/* what you have on, added up. Wet clothes keep you less warm, except what is made for rain */
function dress(){
  var t = {warm:0, rain:0, armor:0, glass:0, sun:0, n:0}, wetK = 1 - Math.min(1, (P.wet || 0)/90)*0.6;
  for (var sl in (P.worn || {})){ var o = P.worn[sl], C = CLOTHES[o.k]; if (!C) continue; t.n++;
    t.warm += C.warm*((C.rain || 0) >= 0.5 ? 1 : wetK); if (sl === 'outer' || sl === 'head') t.rain += C.rain || 0; t.armor += (C.armor || 0)*o.c; if (C.glass) t.glass = 1; t.sun = Math.max(t.sun, C.sun || 0); }
  t.rain = Math.min(0.95, t.rain); t.armor = Math.min(0.45, t.armor); return t;
}
function wearItem(k){
  var C = CLOTHES[k]; if (!C || !(inv[k] > 0)) return; var old = P.worn[C.s];
  inv[k]--; P.worn[C.s] = {k:k, c:1}; if (old) inv[old.k] = (inv[old.k] || 0) + 1;
  sfx('search', undefined, undefined, 0.4); feed('Put on the ' + C.n.toLowerCase() + (old ? ' (the ' + CLOTHES[old.k].n.toLowerCase() + ' goes in your pack)' : ''), C.c); updateHud();
}
/* taking something off puts it in your pack; worn-down protection is not kept (a torn jacket comes back as good as new otherwise) */
function takeOff(slot){ var o = P.worn[slot]; if (!o) return; delete P.worn[slot]; inv[o.k] = (inv[o.k] || 0) + 1; feed('Took off the ' + CLOTHES[o.k].n.toLowerCase() + (o.c < 0.99 ? ' (patched up as you pack it)' : ''), '#cfd5db'); updateHud(); }
function patchWorn(slot){ var o = P.worn[slot]; if (!o || o.c >= 1) return; if (!(inv.tape > 0)){ toast('Patching clothes takes duct tape.', 2.5); return; } inv.tape--; o.c = Math.min(1, o.c + 0.5); feed('Patched the ' + CLOTHES[o.k].n.toLowerCase(), ITEMS.tape[1]); updateHud(); }
/* an alien's hit: protective clothes take some of it, and are torn a little each time */
function hitMe(dmg, k){
  var d = dress(); P.hp -= dmg*(1 - d.armor); P.hurt = 0.3;
  if (d.armor > 0) for (var sl in P.worn){ var o = P.worn[sl], C = CLOTHES[o.k]; if (!C.armor) continue; o.c -= 0.06 + Math.random()*0.05;
    if (o.c <= 0){ delete P.worn[sl]; toast('Your ' + C.n.toLowerCase() + ' is torn to rags.', 4); } }
  injure(k, d.armor); updateHud();
}
/* the art chat's status icons (assets/ui/*.svg) beside each condition */
var CONDI = {Bleeding:'bleeding', 'Open wound':'bleeding', Infected:'infected', 'Broken leg':'broken_leg', Splinted:'broken_leg', Soaked:'wet', Damp:'wet', 'Food poisoning':'sick', Exhausted:'tired', Tired:'tired', Cold:'cold', Hot:'hot', Hungry:'hungry', Thirsty:'thirsty'};
function condIcon(t){ var k = t.split(' ')[0], n = CONDI[t] || CONDI[k] || (t.indexOf('Splinted') === 0 ? 'broken_leg' : null); return n ? '<img src="assets/ui/' + n + '.svg" alt="">' : ''; }
function condText(){
  var c = []; if (P.bleed > 0) c.push('Bleeding'); else if (P.wound) c.push('Open wound'); if (P.inf) c.push('Infected'); if (P.leg === 1) c.push('Broken leg'); else if (P.leg === 2) c.push('Splinted leg ' + Math.ceil(P.legT/60) + ' min');
  if (P.wet > 45) c.push('Soaked'); else if (P.wet > 15) c.push('Damp'); if (P.sick > 0) c.push('Food poisoning'); if (P.rest < 12) c.push('Exhausted'); else if (P.rest < 30) c.push('Tired'); if (P.hunger < 20) c.push('Hungry'); if (P.thirst < 20) c.push('Thirsty'); if (P.body < -35) c.push('Cold'); else if (P.body > 50) c.push('Hot'); return c;
}
/* ---- roofs: up and down by a ladder, walk inside the edge, a fall hurts from above 3 m ---- */
function roofY(b){ return (b.base || 0) + b.h; }
function ladNear(x, y, r){
  var cx0 = Math.floor(x/G), cy0 = Math.floor(y/G), best = null, bd = r;
  for (var cy = cy0 - 1; cy <= cy0 + 1; cy++) for (var cx = cx0 - 1; cx <= cx0 + 1; cx++){ var cell = world.grid.get(gk(cx, cy)); if (!cell) continue; for (var i = 0; i < cell.length; i++){ var L = cell[i].lad; if (!L || cell[i].gone) continue; var d = Math.hypot(L.fx - x, L.fy - y); if (d < bd){ bd = d; best = L; } } }
  return best;
}
function hatchOf(b){ var h = b && b.int && b.int.hatch; if (!h) return null; return h.L || (h.L = {hatch:1, b:b, x:h.x, y:h.y, fx:h.x, fy:h.y, tx:h.x, ty:h.y, nx:1, ny:0}); }
function ladTarget(L, up){ var k = up ? 'tgU' : 'tgD'; return L[k] || (L[k] = {fix:'ladder', up:up, L:L, b:L.b, x:up ? L.fx : L.tx, y:up ? L.fy : L.ty}); }
function startClimb(L, up){
  if (P.hide || P.veh) return; if (P.leg === 1){ toast('You cannot climb a ladder on a broken leg. Splint it first.', 3); return; } P.climbL = {L:L, up:up, t:0, dur:Math.max(1.6, (roofY(L.b) - climbBase(L))/2.2)};
  P.x = L.fx; P.y = L.fy; if (!L.hatch) P.yaw = Math.atan2(-L.ny, -L.nx); P.roof = null; P.crouch = false; sfx('metal', L.x, L.y, 0.5, 0.8);
}
function climbTick(dt){
  var c = P.climbL; c.t += dt/c.dur; P.x = c.L.fx; P.y = c.L.fy; if (Math.floor(c.t*8) !== c.s){ c.s = Math.floor(c.t*8); sfx('metal', c.L.x, c.L.y, 0.25, 0.9 + Math.random()*0.3); }
  if (c.t < 1) return; P.climbL = null; if (!c.up && c.L.hatch){ P.lvl = nLv(c.L.b) - 1; return; }
  if (c.up){ P.roof = c.L.b; P.x = c.L.tx; P.y = c.L.ty; if (!P.roofSaid){ P.roofSaid = true; toast('On the roof. Most aliens cannot climb up, though stalkers use ladders, and they can see you from the street. Walk off the edge and you fall.', 6); } }
}
function climbBase(L){ return L.hatch ? (L.b.base || 0) + (nLv(L.b) - 1)*FH : groundAt(L.fx, L.fy); }
function climbH(){ var c = P.climbL, g = climbBase(c.L), r = roofY(c.L.b), f = c.up ? c.t : 1 - c.t; return g + (r - g)*Math.max(0, Math.min(1, f)); }
function roofOk(b, x, y){ return pip(b.pts, x, y) && polyDist(b.pts, x, y, true) > 0.3; }
function roofMove(e, dx, dy){
  var b = P.roof, n = Math.max(1, Math.ceil(Math.hypot(dx, dy)/0.2));
  for (var i = 0; i < n; i++){
    var nx = e.x + dx/n, ny = e.y + dy/n;
    if (roofOk(b, nx, ny)){ e.x = nx; e.y = ny; continue; }
    if (b.area > 70 && gait(true) !== 2){   /* the low wall round a bigger roof stops you, unless you run at it */
      if (roofOk(b, nx, e.y)) e.x = nx; else if (roofOk(b, e.x, ny)) e.y = ny;
      if (!P.edgeSaid){ P.edgeSaid = true; toast('A low wall runs round this roof. Sprint at it to jump down.', 4); } return;
    }
    return fallOff(e, nx, ny, dx, dy);
  }
}
function fallOff(e, nx, ny, dx, dy){
  var b = P.roof, l = Math.hypot(dx, dy) || 1, top = roofY(b), ox = e.x, oy = e.y, x = nx, y = ny, k, nb;
  for (k = 0; k < 30 && buildingAt(x, y) === b; k++){ x += dx/l*0.15; y += dy/l*0.15; }
  /* buildings built wall to wall (downtown): step across onto the next roof if it is about as high, otherwise stay put; never drop into one */
  nb = buildingAt(x, y);
  if (nb && nb !== b && !nb.gone){
    if (Math.abs(roofY(nb) - top) < 1.6 && roofOk(nb, x + dx/l*0.4, y + dy/l*0.4)){ P.roof = nb; e.x = x + dx/l*0.4; e.y = y + dy/l*0.4; return; }
    e.x = ox; e.y = oy; if (!P.wallSaid){ P.wallSaid = true; toast('The next building stands right against this one, too high or too low to step onto. Find another edge, or the ladder.', 5); } return;
  }
  if (buildingAt(x + dx/l*0.3, y + dy/l*0.3)){ e.x = ox; e.y = oy; return; }
  P.roof = null; e.x = x + dx/l*0.3; e.y = y + dy/l*0.3; collide(e, 0.35);
  var drop = top - groundAt(e.x, e.y), dmg = Math.max(0, Math.round((drop - 3)*8));
  sfx('hurt', undefined, undefined, Math.min(1, 0.3 + drop/10)); makeNoise(e.x, e.y, 6 + drop*1.5); P.fall = 0.01;
  if (drop > 4.5 && !P.leg && Math.random() < (drop - 4.5)*0.18) breakLeg();
  if (dmg > 0){ P.hp -= dmg; P.hurt = 0.4; P.cause = 'a fall'; feed('You fell ' + dist(drop) + ': -' + dmg + ' health', '#ff8f7a'); } else feed('You dropped down from the roof', '#c0c6cc');
}
function setLvl(e){ var b = buildingAt(e.x, e.y); if (!b || !b.int || !b.int.stairs){ if (!b) e.lvl = 0; return; } var o = stairOn(b, e.x, e.y, e.lvl); if (o) e.lvl = o.t > 0.5 ? o.f + 1 : o.f; }
function clipHalf(poly, ax, val, less){
  var out = [], n = poly.length; for (var i = 0; i < n; i++){ var a = poly[i], b = poly[(i + 1) % n], ia = less ? a[ax] <= val : a[ax] >= val, ib = less ? b[ax] <= val : b[ax] >= val;
    if (ia) out.push(a); if (ia !== ib){ var t = (val - a[ax])/(b[ax] - a[ax]); out.push([a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t]); } } return out;
}
function genInterior(b){
  var A = genLevel(b, 0, null, 0, nFl(b)); if (A.unreach) A = genLevel(b, 0, null, 0, 1);
  var I = {segs:A.segs, circs:A.circs, conts:A.conts, furn:A.furn, idoors:A.idoors, fixes:A.fixes, rooms:A.rooms, n:A.n, stairs:A.stairs, nl:A.nl, cn:A.cn, lv:[{segs:A.segs, circs:A.circs, iw:A.iw}]};
  if (!(A.stairs && A.stairs.length && A.nl >= 2)) I.nl = 1;
  I.gs = [upload(A.m)]; I.g = I.gs[0];
  if (I.nl >= 2) growInterior(b, I);   /* the first floor up at once; the rest are built as you climb (a tall tower would stall the game if all fourteen were built together) */
  return I;
}
/* build the next floor of a building's interior */
function growInterior(b, I){
  var L = I.lv.length; if (L >= I.nl) return false;
  var B = genLevel(b, L, I.stairs, I.cn, I.nl); if (B.unreach && L < I.nl - 1){ I.nl = L + 1; B = genLevel(b, L, I.stairs, I.cn, I.nl); } I.cn = B.cn; I.gs.push(upload(B.m));
  I.lv.push({segs:B.segs, circs:B.circs, iw:B.iw}); I.conts = I.conts.concat(B.conts); I.furn = I.furn.concat(B.furn); I.fixes = I.fixes.concat(B.fixes);
  if (L === I.nl - 1) I.hatch = B.hatch; I.rooms = I.rooms.concat(B.rooms.map(function(r){ return 'up' + L + ':' + r; })); I.n += B.n; return true;
}
function freeInt(b){ var I = b.int; if (I && I.gs) I.gs.forEach(freeMesh); }
function genLevel(b, lvl, SS, CB, NL){
  /* shafts (0.49.4): two staircases, A for flights 0, 2, 4... and B for 1, 3, 5..., so flights never sit on top of each other. At this floor a shaft may have a flight going up from it (DEP) or the top of a flight arriving (ARR) */
  var ARR = null, DEP = null, SSl = SS || [];
  SSl.forEach(function(S3){ if (lvl >= 1 && (lvl - 1)%2 === S3.par && lvl - 1 >= S3.min && lvl - 1 <= NL - 2) ARR = S3; if (lvl%2 === S3.par && lvl >= S3.min && lvl <= NL - 2) DEP = S3; });
  var ST = ARR;
  var m = new Mesh(), p = b.pts, n = p.length, k = 0, rnd = function(){ return hash(b.id + lvl*7919, k++, 31); }, i, j;
  var segs = [], circs = [], doors = [], conts = [], furn = [], idoors = [], t = b.tri, fc = C(FLOOR[b.cat]), cc = C('#d8d3c6'), pc = C(['#d9d2c2','#cfd3c8','#d6cabb'][b.id % 3]), sky = C('#b8d4e6');
  var ceilY = Math.min(lvl ? 2.95 : 3, b.h - lvl*FH - 0.06);
  for (i = 0; i < b.wins.length && lvl && !FRON; i += 6){   /* upstairs windows are painted only: a pale pane stands in for the view */
    var wx = b.wins[i] + b.wins[i+4]*0.04, wz = b.wins[i+1] + b.wins[i+5]*0.04, dx = b.wins[i+2]*0.6, dz = b.wins[i+3]*0.6;
    m.wall(wx - dx, wz - dz, wx + dx, wz + dz, 1, 2.1, sky, 255);
  }
  if (b.door && !lvl) doors.push(b.door.x + b.door.nx*0.4, b.door.y + b.door.ny*0.4);
  var bi = 0, bl = 0;
  for (i = 0; i < n; i += 2){ j = (i+2) % n; var l = Math.hypot(p[j]-p[i], p[j+1]-p[i+1]); if (l > bl){ bl = l; bi = i; } }
  j = (bi+2) % n; var ux = (p[j]-p[bi])/bl, uy = (p[j+1]-p[bi+1])/bl, vx = -uy, vy = ux, u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (i = 0; i < n; i += 2){ var pu = p[i]*ux + p[i+1]*uy, pv = p[i]*vx + p[i+1]*vy; if (pu < u0) u0 = pu; if (pu > u1) u1 = pu; if (pv < v0) v0 = pv; if (pv > v1) v1 = pv; }
  var leaves = [], maxD = b.cat === 'house' ? 4 : b.cat === 'industrial' ? 1 : 2, minS = b.cat === 'house' ? 7.5 : 12, CAPA = b.cat === 'house' ? 34 : b.cat === 'industrial' ? 260 : b.kind === 'church' || b.kind === 'school' || b.kind === 'stadium' || b.kind === 'warehouse' ? 200 : 78;
  var iw = [], BRL = (world.edits && world.edits.breach && world.edits.breach[b.id]) || [], iwk = 10000 + lvl*1000;
  /* 0.71: a partition is built like the outer walls: two skins with a core between (0.18 m), trimmed jambs at a doorway, one piece per solid stretch, each with hit points, breakable, saved */
  function ipiece(x0, y0, x1, y1, ya, yb, solid){
    var l = Math.hypot(x1 - x0, y1 - y0); if (l < 0.02) return; var nx = -(y1 - y0)/l, ny = (x1 - x0)/l, h = 0.09, tc = [226,222,212];
    if (solid){ var id = iw.length/4; iw.push(x0, y0, x1, y1); if (BRL.indexOf(iwk + id) >= 0){ rubbleAt(m, b.id + ':' + lvl, id, x0, y0, x1, y1, nx, ny); return; } segs.push(x0, y0, x1, y1); }
    m.wt = [TX.wallpaper, 2, 2]; m.wall(x0 + nx*h, y0 + ny*h, x1 + nx*h, y1 + ny*h, ya, yb, WHITE, 255); m.wall(x1 - nx*h, y1 - ny*h, x0 - nx*h, y0 - ny*h, ya, yb, WHITE, 255); m.wt = null;
    if (!solid) m.quad(x0 + nx*h, ya, y0 + ny*h, x1 + nx*h, ya, y1 + ny*h, x1 - nx*h, ya, y1 - ny*h, x0 - nx*h, ya, y0 - ny*h, tc, 255);   /* the underside of the header */
    if (solid) for (var e = 0; e < 2; e++){ var ex0 = e ? x1 : x0, ey0 = e ? y1 : y0; m.quad(ex0 - nx*h, ya, ey0 - ny*h, ex0 + nx*h, ya, ey0 + ny*h, ex0 + nx*h, yb, ey0 + ny*h, ex0 - nx*h, yb, ey0 - ny*h, tc, 255); }   /* the end of the wall: the jamb */
  }
  function part(ua, va, ub, vb){
    var ax = ua*ux + va*vx, ay = ua*uy + va*vy, bx = ub*ux + vb*vx, by = ub*uy + vb*vy, len = Math.hypot(bx-ax, by-ay), ts = [0, 1], q;
    if (len < 0.5) return;
    var rx = bx - ax, ry = by - ay;
    for (q = 0; q < n; q += 2){
      var e = (q+2) % n, sx = p[e] - p[q], sy = p[e+1] - p[q+1], den = rx*sy - ry*sx; if (Math.abs(den) < 1e-9) continue;
      var tt = ((p[q]-ax)*sy - (p[q+1]-ay)*sx)/den, ss = ((p[q]-ax)*ry - (p[q+1]-ay)*rx)/den;
      if (tt > 0 && tt < 1 && ss >= 0 && ss <= 1) ts.push(tt);
    }
    ts.sort(function(x, y){ return x - y; });
    var dxn = rx/len, dyn = ry/len;
    for (q = 0; q < ts.length - 1; q++){
      var t0 = ts[q], t1 = ts[q+1], L = (t1 - t0)*len; if (L < 1.7) continue;
      var tm = (t0 + t1)/2; if (!pip(p, ax + rx*tm, ay + ry*tm)) continue;
      var sx0 = ax + rx*t0, sy0 = ay + ry*t0;
      /* a wall that would meet the outside wall at a window stops a step short of it, so the window can still be climbed through */
      for (var wq = 0; wq < b.wins.length; wq += 6){ if (Math.hypot(b.wins[wq] - sx0, b.wins[wq+1] - sy0) < 0.95){ sx0 += dxn*1.0; sy0 += dyn*1.0; L -= 1.0; break; } }
      for (wq = 0; wq < b.wins.length; wq += 6){ if (Math.hypot(b.wins[wq] - (sx0 + dxn*L), b.wins[wq+1] - (sy0 + dyn*L)) < 0.95){ L -= 1.0; break; } }
      if (L < 1.7) continue;
      var g0 = L < 2.6 ? (L - 1.1)/2 : 0.6 + rnd()*(L - 2.3), g1, tr, gt;
      /* the doorway has to open onto floor on both sides, not onto a sliver behind the outside wall */
      for (tr = 0; tr < 40; tr++){ gt = tr === 0 ? g0 : L < 2.6 ? g0 : 0.6 + (L - 2.3)*((tr*0.381966) % 1); var mx0 = sx0 + dxn*(gt + 0.55), my0 = sy0 + dyn*(gt + 0.55), okd = true; for (var sd = -1; sd <= 1 && okd; sd += 2){ var qx = mx0 - dyn*sd*0.9, qy = my0 + dxn*sd*0.9; if (!pip(p, qx, qy) || polyDist(p, qx, qy, true) < 0.5) okd = false; } if (okd){ g0 = gt; break; } }
      g1 = g0 + 1.1;
      var ax1 = sx0 + dxn*g0, ay1 = sy0 + dyn*g0, ax2 = sx0 + dxn*g1, ay2 = sy0 + dyn*g1, ex = sx0 + dxn*L, ey = sy0 + dyn*L;
      if (g0 > 0.05) ipiece(sx0, sy0, ax1, ay1, 0.1, ceilY, true); if (L - g1 > 0.05) ipiece(ax2, ay2, ex, ey, 0.1, ceilY, true); ipiece(ax1, ay1, ax2, ay2, 2.2, ceilY, false);
      doors.push((ax1+ax2)/2, (ay1+ay2)/2); if (!lvl) idoors.push([ax1, ay1, ax2, ay2]);
    }
  }
  function split(a0, b0, a1, b1, d){
    var w = a1 - a0, h = b1 - b0;
    /* layout rule 1 (0.49.3): no room over its size cap while it can still be cut into two rooms at least 2.6 m across; the cut goes across the long side, near the middle */
    var big = w*h > CAPA && Math.max(w, h) >= 5.4 && d < 7;
    if (!big && (d >= maxD || Math.max(w, h) < minS || w*h < 24)){ leaves.push([a0, b0, a1, b1]); return; }
    /* supporting walls (0.49.4): the first two cuts are load-bearing. Where they go depends only on the shape of the region and the ground-floor door, never on the floor, so they stand directly above one another on every storey */
    var bear = d < 2, fb = bear ? hash(b.id + 313, Math.round(a0*8) + d*977, Math.round(b0*8) + 41) : 0;
    var f = bear ? (big ? 0.42 + fb*0.16 : 0.38 + fb*0.24) : big ? 0.42 + rnd()*0.16 : 0.38 + rnd()*0.24, s, dc = bear ? (w >= h ? gdu : gdv) : (w >= h ? eu0 : ev0), lo = w >= h ? a0 : b0, hi = w >= h ? a1 : b1;
    s = lo + (hi - lo)*f; if (hi - lo >= 5.4) s = Math.max(lo + 2.6, Math.min(hi - 2.6, s));
    if (Math.abs(s - dc) < 1.5){ s = dc + (s >= dc ? 1.5 : -1.5); if (s < lo + 2.2 || s > hi - 2.2) s = dc + (s >= dc ? -1.5 : 1.5); if (s < lo + 2.2 || s > hi - 2.2){ leaves.push([a0, b0, a1, b1]); return; } }   /* never run a wall into the front door */
    if (!bear) for (var hq = 0; hq < HRS.length && s !== null; hq++){ var HR = HRS[hq], sAx = w >= h ? 0 : 1, rl = sAx ? HR[1] : HR[0], rh = sAx ? HR[3] : HR[2], ol = sAx ? HR[0] : HR[1], oh = sAx ? HR[2] : HR[3], olo = sAx ? a0 : b0, ohi = sAx ? a1 : b1;
      if (s > rl - 1.1 && s < rh + 1.1 && ohi > ol - 1.1 && olo < oh + 1.1) s = rl - 1.2 >= lo + 2.2 ? rl - 1.2 : rh + 1.2 <= hi - 2.2 ? rh + 1.2 : null; }   /* upstairs, never wall across a stairwell */
    if (s === null){ leaves.push([a0, b0, a1, b1]); return; }
    if (w >= h){ part(s, b0, s, b1); split(a0, b0, s, b1, d+1); split(s, b0, a1, b1, d+1); }
    else { part(a0, s, a1, s); split(a0, b0, a1, s, d+1); split(a0, s, a1, b1, d+1); }
  }
  /* upstairs: the stairwell from the floor below, in this building's own u/v frame, and the landing at its top */
  var HRS = SSl.map(function(S3){ var a0s3 = Math.min(S3.s0, S3.s1), a1s3 = Math.max(S3.s0, S3.s1); return S3.A ? [S3.c0, a0s3, S3.c1, a1s3] : [a0s3, S3.c0, a1s3, S3.c1]; });
  var LX = 0, LY = 0, gdu = b.door ? b.door.x*ux + b.door.y*uy : 1e9, gdv = b.door ? b.door.x*vx + b.door.y*vy : 1e9;
  if (ST){ var a0s = Math.min(ST.s0, ST.s1), a1s = Math.max(ST.s0, ST.s1); var sgn0 = Math.sign(ST.s1 - ST.s0), la = ST.land === 'side' ? ST.s1 - sgn0*0.5 : ST.s1 + sgn0*0.9, lc = ST.land === 'side' ? (ST.wallHi ? ST.c0 - 0.95 : ST.c1 + 0.95) : (ST.c0 + ST.c1)/2, lu = ST.A ? lc : la, lv0 = ST.A ? la : lc; LX = lu*ux + lv0*vx; LY = lu*uy + lv0*vy; }
  var eu0 = ST ? LX*ux + LY*uy : b.door ? b.door.x*ux + b.door.y*uy : 1e9, ev0 = ST ? LX*vx + LY*vy : b.door ? b.door.x*vx + b.door.y*vy : 1e9;
  split(u0, v0, u1, v1, 0);
  /* ---- furnish: every room gets a job, then that job's list is laid out against walls, in rows or in the middle ---- */
  var keep = [], rects = [], total = 0, q, items = [], cls = 2;
  var LIMC = 0, FLIM = Math.max(110, Math.min(560, Math.round(60 + b.area/2.0)));   /* a big building gets furniture in every room, not just the first rooms from the door */
  LIMC = FLIM;
  for (i = 0; i < doors.length; i += 2) keep.push(doors[i]*ux + doors[i+1]*uy, doors[i]*vx + doors[i+1]*vy, 1.0);
  for (i = 0; i < b.wins.length; i += 6) keep.push(b.wins[i]*ux + b.wins[i+1]*uy, b.wins[i]*vx + b.wins[i+1]*vy, 0.75);
  var eu = ST ? eu0 : b.door ? b.door.x*ux + b.door.y*uy : b.cx*ux + b.cy*uy, ev = ST ? ev0 : b.door ? b.door.x*vx + b.door.y*vy : b.cx*vx + b.cy*vy;
  var rooms = leaves.map(function(lf){ var cu = (lf[0] + lf[2])/2, cv = (lf[1] + lf[3])/2; return {a0:lf[0], b0:lf[1], a1:lf[2], b1:lf[3], cu:cu, cv:cv, w:lf[2] - lf[0], h:lf[3] - lf[1], area:(lf[2] - lf[0])*(lf[3] - lf[1]), d:Math.hypot(cu - eu, cv - ev)}; });
  rooms.sort(function(x, y){ return x.d - y.d; });
  var plan = lvl ? upPlan(b) : PLAN[b.kind] || PLAN[b.cat] || PLAN.shop;
  rooms.forEach(function(R, ri){ R.type = rooms.length === 1 ? (plan.one || plan.rooms[0]) : rooms.length === 2 && plan.two ? plan.two[ri] : plan.rooms[ri] || plan.more[(ri - plan.rooms.length) % plan.more.length]; });
  if (plan.small && rooms.length >= 3){ var sm = 1; for (i = 2; i < rooms.length; i++) if (rooms[i].area < rooms[sm].area) sm = i; rooms[sm].type = plan.small; }
  function free(cu, cv, hu, hv, R, flat){
    if (cu - hu < R.a0 + 0.04 || cu + hu > R.a1 - 0.04 || cv - hv < R.b0 + 0.04 || cv + hv > R.b1 - 0.04) return false;
    for (q = 0; q < 5; q++){ var pu = cu + [0,-1,1,-1,1][q]*hu, pv = cv + [0,-1,-1,1,1][q]*hv; if (!pip(p, pu*ux + pv*vx, pu*uy + pv*vy)) return false; }
    if (flat) return true;
    for (q = 0; q < keep.length; q += 3){ var du = Math.max(Math.abs(keep[q] - cu) - hu, 0), dv = Math.max(Math.abs(keep[q+1] - cv) - hv, 0); if (du*du + dv*dv < keep[q+2]*keep[q+2]) return false; }
    for (q = 0; q < rects.length; q += 4) if (Math.abs(cu - rects[q]) < hu + rects[q+2] + 0.1 && Math.abs(cv - rects[q+1]) < hv + rects[q+3] + 0.1) return false;
    return true;
  }
  function put(name, cu, cv, dir, R){
    var f = FURN[name], s = f.s || [f.boxes[0][3], f.boxes[0][5]], hu = dir & 1 ? s[0] : s[1], hv = dir & 1 ? s[1] : s[0];
    if (total >= LIMC || !free(cu, cv, hu, hv, R, f.flat)) return null;
    var bu = [1,0,-1,0][dir], bv = [0,1,0,-1][dir], yaw = Math.atan2(bu*uy + bv*vy, bu*ux + bv*vx) + 1.5708, x = cu*ux + cv*vx, y = cu*uy + cv*vy;
    var mi = f.models ? Math.floor(rnd()*f.models.length) : 0, cl = [];
    total++; if (window.LAYDBG) LAYDBG.push([name, x, y, hu, hv, dir, ux, uy]);
    if (!f.flat){
      rects.push(cu, cv, hu, hv);
      if (!f.soft){ var r = Math.max(0.22, Math.min(0.6, hu, hv)), L = Math.max(hu, hv) - r, nc = L < 0.15 ? 1 : Math.ceil(2*L/(r*1.4)) + 1; for (q = 0; q < nc; q++){ var o = nc === 1 ? 0 : -L + 2*L*q/(nc - 1), pu = cu + (hu >= hv ? o : 0), pv = cv + (hu >= hv ? 0 : o); cl.push(pu*ux + pv*vx, pu*uy + pv*vy, r); } }
    }
    items.push({f:f, x:x, y:y, yaw:yaw, fx:-Math.sin(yaw), fy:Math.cos(yaw), mi:mi, cl:cl, R:R, cls:f.name ? 3 : cls, on:1});
    return {cu:cu, cv:cv, hu:hu, hv:hv, dir:dir, s:s};
  }
  function extras(it, o, R){
    if (!it || !o) return;
    var bu = [1,0,-1,0][it.dir], bv = [0,1,0,-1][it.dir], cs = FURN.chair.s, e, k2, c0 = cls; cls = 0;
    if (o.ring){ var sp = [[0, 1, 1], [0, -1, 3], [1, 0, 0], [-1, 0, 2]]; for (e = 0; e < o.ring && e < 4; e++) put('chair', it.cu + sp[e][0]*(it.hu + cs[1] + 0.12), it.cv + sp[e][1]*(it.hv + cs[1] + 0.12), sp[e][2], R); }
    if (o.seat) put('chair', it.cu - bu*(it.s[1] + cs[1] + 0.14), it.cv - bv*(it.s[1] + cs[1] + 0.14), (it.dir + 2) % 4, R);
    if (o.front){ var fs = FURN[o.front].s; for (e = -1; e <= 1; e += 2) put(o.front, it.cu - bu*(it.s[1] + fs[1] + 0.2) - bv*e*0.5, it.cv - bv*(it.s[1] + fs[1] + 0.2) + bu*e*0.5, (it.dir + 2) % 4, R); }
    if (o.side){ var ss = FURN[o.side].s; for (e = -1, k2 = null; e <= 1 && !k2; e += 2) k2 = put(o.side, it.cu + bu*(it.s[1] - ss[1]) - bv*e*(it.s[0] + ss[0] + 0.06), it.cv + bv*(it.s[1] - ss[1]) + bu*e*(it.s[0] + ss[0] + 0.06), it.dir, R); }
    cls = c0;
  }
  function farEnd(R){ return R.w >= R.h ? (Math.abs(eu - R.a0) < Math.abs(eu - R.a1) ? 0 : 2) : (Math.abs(ev - R.b0) < Math.abs(ev - R.b1) ? 1 : 3); }  /* which wall is the far end, as the direction a thing's back points when it stands against it */
  function onWall(name, R, mode){
    var s = FURN[name].s || [FURN[name].boxes[0][3], FURN[name].boxes[0][5]], cand = [], dir, t0, lo, hi, cu, cv, sc;
    for (dir = 0; dir < 4; dir++){
      lo = (dir & 1 ? R.a0 : R.b0) + s[0] + 0.1; hi = (dir & 1 ? R.a1 : R.b1) - s[0] - 0.1; if (hi < lo) continue;
      var fix = dir === 0 ? R.a1 - s[1] - 0.06 : dir === 2 ? R.a0 + s[1] + 0.06 : dir === 1 ? R.b1 - s[1] - 0.06 : R.b0 + s[1] + 0.06;
      for (t0 = lo; t0 <= hi + 0.001; t0 += 0.45){
        cu = dir & 1 ? t0 : fix; cv = dir & 1 ? fix : t0;
        sc = mode === 'door' ? Math.hypot(cu - eu, cv - ev) : mode === 'far' ? -Math.hypot(cu - eu, cv - ev) : mode === 'corner' ? Math.min(t0 - lo, hi - t0) + rnd()*0.3 : rnd();
        cand.push([sc, cu, cv, dir]);
      }
    }
    cand.sort(function(x, y){ return x[0] - y[0]; });
    for (var ci = 0; ci < cand.length; ci++){ var it = put(name, cand[ci][1], cand[ci][2], cand[ci][3], R); if (it) return it; }
    return null;
  }
  /* ---- the staircases: against the long wall of a big room, with space at the foot below and a landing at the top above. A tall building gets a second shaft in another place for the flights that start on the floors in between ---- */
  var wc = C('#a8743e'), wd = C('#7a5230'), STS = [], NLx = NL || 1, unreach = false;
  var U2W = function(a, c, A){ var uu = A ? c : a, vv = A ? a : c; return [uu*ux + vv*vx, uu*uy + vv*vy]; };
  var stairBox = function(S3){ var a0 = Math.min(S3.s0, S3.s1) - 1.5, a1 = Math.max(S3.s0, S3.s1) + 1.5; return S3.A ? [S3.c0 - 1.3, a0, S3.c1 + 1.3, a1] : [a0, S3.c0 - 1.3, a1, S3.c1 + 1.3]; };
  function placeStair(avoid){
    var cands = rooms.filter(function(R){ return R.type !== 'bath' && R.area > 9; }).sort(function(x, y){ return y.area - x.area; }), SR = null;
    for (var ri2 = 0; ri2 < cands.length && !SR; ri2++){ var R2 = cands[ri2];
      for (var A2 = 0; A2 < 2 && !SR; A2++){ var la0 = A2 ? R2.b0 : R2.a0, la1 = A2 ? R2.b1 : R2.a1, lc0 = A2 ? R2.a0 : R2.b0, lc1 = A2 ? R2.a1 : R2.b1;
        if (la1 - la0 < RUN + 1.15 || lc1 - lc0 < 2.2) continue;
        for (var vari = 0; vari < 4 && !SR; vari++){ var up = vari & 1 ? -1 : 1, wallHi = vari & 2, s0 = up > 0 ? la0 + 1.05 : la1 - 1.05, s1 = s0 + up*RUN, c0 = wallHi ? lc1 - 1.08 : lc0 + 0.08, c1 = c0 + 1.0, ok2 = true;
          var tests = [[s0, c0], [s0, c1], [s1, c1], [s1, c0], [(s0 + s1)/2, (c0 + c1)/2]];
          tests.forEach(function(tq){ var w2 = U2W(tq[0], tq[1], A2); if (!pip(p, w2[0], w2[1])) ok2 = false; });
          var inn = function(a, c, r){ var w2 = U2W(a, c, A2); return pip(p, w2[0], w2[1]) && polyDist(p, w2[0], w2[1], true) >= r; }, oc = wallHi ? c0 - 0.95 : c1 + 0.95, land = null;
          if (!inn(s0 - up*0.7, (c0 + c1)/2, 0.35)) ok2 = false;   /* room to step on at the foot */
          if (ok2) land = inn(s1 + up*0.9, (c0 + c1)/2, 0.45) ? 'end' : inn(s1 - up*0.5, oc, 0.45) ? 'side' : null; if (!land) ok2 = false;   /* and somewhere to step off at the top */
          var ra = Math.min(s0, s1) - 0.3, rb = Math.max(s0, s1) + 0.3;
          for (q = 0; ok2 && q < keep.length; q += 3){ var ka = A2 ? keep[q+1] : keep[q], kc = A2 ? keep[q] : keep[q+1]; if (ka > ra - keep[q+2] && ka < rb + keep[q+2] && kc > c0 - keep[q+2] && kc < c1 + keep[q+2]) ok2 = false; }
          if (ok2){ var cand2 = {A:A2, s0:s0, s1:s1, c0:c0, c1:c1, wallHi:!!wallHi, land:land, ux:ux, uy:uy, vx:vx, vy:vy}, bx2 = stairBox(cand2);
            for (var av = 0; av < avoid.length; av++){ var o2 = avoid[av]; if (bx2[0] < o2[2] && bx2[2] > o2[0] && bx2[1] < o2[3] && bx2[3] > o2[1]) ok2 = false; }
            if (ok2) SR = cand2; }
        } } }
    return SR;
  }
  if (!lvl && NLx > 1 && hasUp(b)){
    var SA = placeStair([]); if (SA){ SA.par = 0; SA.min = 0; STS.push(SA); NLx = Math.min(NLx, 14);
      if (NLx >= 3){ var SB = placeStair([stairBox(SA)]); if (SB){ SB.par = 1; SB.min = 1; STS.push(SB); } else NLx = 2; } }
    else NLx = 1;
  } else if (lvl) STS = SSl;
  STS.forEach(function(STR){
    var depR = lvl%2 === STR.par && lvl >= STR.min && lvl <= NLx - 2, arrR = lvl >= 1 && (lvl - 1)%2 === STR.par && lvl - 1 >= STR.min && lvl - 1 <= NLx - 2;
    if (!depR && !arrR) return;
    var S0 = STR.s0, S1 = STR.s1, upd = Math.sign(S1 - S0), cm = (STR.c0 + STR.c1)/2, am = (S0 + S1)/2, A3 = STR.A, cOpen = STR.wallHi ? STR.c0 : STR.c1, cWall = STR.wallHi ? STR.c1 : STR.c0;
    rects.push(A3 ? cm : am, A3 ? am : cm, A3 ? 0.55 : RUN/2 + 0.1, A3 ? RUN/2 + 0.1 : 0.55);
    var side = STR.land === 'side', footA = arrR ? (side ? S1 - upd*0.5 : S1 + upd*0.9) : S0 - upd*0.9, fw = U2W(footA, arrR && side ? (STR.wallHi ? STR.c0 - 0.95 : STR.c1 + 0.95) : cm, A3), fu = fw[0]*ux + fw[1]*uy, fv = fw[0]*vx + fw[1]*vy; keep.push(fu, fv, 0.95);
    var SEG = function(a0, c0, a1, c1){ var p0 = U2W(a0, c0, A3), p1 = U2W(a1, c1, A3); segs.push(p0[0], p0[1], p1[0], p1[1]); };
    SEG(arrR ? S0 : S0 + upd*0.9, cOpen, arrR && side ? S1 - upd*1.0 : S1, cOpen); SEG(S0, cWall, S1, cWall);   /* the bottom steps are open at the side, so you can step on from beside them */
    if (arrR){ SEG(S0, STR.c0, S0, STR.c1); if (side) SEG(S1, STR.c0, S1, STR.c1); } else SEG(S1, STR.c0, S1, STR.c1);
    var AX = A3 ? [vx, 0, vy] : [ux, 0, uy], CX = A3 ? [ux, 0, uy] : [vx, 0, vy], mul = function(v, f){ return [v[0]*f, v[1]*f, v[2]*f]; };
    if (depR){ for (var st2 = 0; st2 < 15; st2++){ var ta = S0 + upd*(st2 + 0.5)*RUN/15, top2 = (st2 + 1)*FH/15, cw = U2W(ta, cm, A3); m.box(cw[0], top2/2 + 0.05, cw[1], mul(AX, RUN/30), [0, top2/2, 0], mul(CX, 0.5), st2 & 1 ? wc : wd); }
      for (var rp = 0; rp <= 5; rp++){ var ta2 = S0 + upd*rp*RUN/5, h2 = rp*FH/5, pw = U2W(ta2, cOpen, A3); m.box(pw[0], h2 + 0.55, pw[1], [0.03, 0, 0], [0, 0.5, 0], [0, 0, 0.03], wd); } }
    else { [[S0, STR.c0, S0, STR.c1], [S0, cOpen, side ? S1 - upd*1.0 : S1, cOpen]].concat(side ? [[S1, STR.c0, S1, STR.c1]] : []).forEach(function(r4){ var p0 = U2W(r4[0], r4[1], A3), p1 = U2W(r4[2], r4[3], A3), mx2 = (p0[0] + p1[0])/2, mz2 = (p0[1] + p1[1])/2, L4 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
      m.box(mx2, 1.0, mz2, [(p1[0] - p0[0])/2, 0, (p1[1] - p0[1])/2], [0, 0.04, 0], [-(p1[1] - p0[1])/L4*0.04, 0, (p1[0] - p0[0])/L4*0.04], wd); for (var pp = 0; pp <= 4; pp++){ var px2 = p0[0] + (p1[0] - p0[0])*pp/4, pz2 = p0[1] + (p1[1] - p0[1])*pp/4; m.box(px2, 0.55, pz2, [0.03, 0, 0], [0, 0.45, 0], [0, 0, 0.03], wd); } }); }
  });
  /* ---- pillars: in big open rooms, on a six-metre grid fixed to the building, so they stand above one another on every storey; kept clear of walls, doorways, windows and stairs ---- */
  if (NLx >= 2 || b.area > 500) rooms.forEach(function(R){
    if (Math.min(R.w, R.h) < 7.5 || R.area < 60) return;
    for (var gu = u0 + 4.5; gu < u1; gu += 6) for (var gv = v0 + 4.5; gv < v1; gv += 6){
      if (gu < R.a0 + 1.6 || gu > R.a1 - 1.6 || gv < R.b0 + 1.6 || gv > R.b1 - 1.6) continue;
      var pxw = gu*ux + gv*vx, pyw = gu*uy + gv*vy, okp = pip(p, pxw, pyw) && polyDist(p, pxw, pyw, true) >= 1.2;
      for (q = 0; okp && q < keep.length; q += 3) if (Math.abs(keep[q] - gu) < keep[q+2] + 0.6 && Math.abs(keep[q+1] - gv) < keep[q+2] + 0.6) okp = false;
      for (q = 0; okp && q < segs.length; q += 4) if (segDist(pxw, pyw, segs[q], segs[q+1], segs[q+2], segs[q+3]) < 0.9) okp = false;
      for (q = 0; okp && q < HRS.length; q++){ var hb = stairBox(SSl[q] || STS[q]); if (hb && gu > hb[0] && gu < hb[2] && gv > hb[1] && gv < hb[3]) okp = false; }
      for (q = 0; okp && q < STS.length; q++){ var hb2 = stairBox(STS[q]); if (gu > hb2[0] && gu < hb2[2] && gv > hb2[1] && gv < hb2[3]) okp = false; }
      if (!okp) continue;
      m.box(pxw, ceilY/2 + 0.1, pyw, [ux*0.25, 0, uy*0.25], [0, ceilY/2, 0], [vx*0.25, 0, vy*0.25], C('#b4afa3'));
      var pq = [[-1, -1], [1, -1], [1, 1], [-1, 1]]; for (var pe = 0; pe < 4; pe++){ var pa = pq[pe], pb2 = pq[(pe + 1) % 4]; segs.push(pxw + (pa[0]*ux + pa[1]*vx)*0.27, pyw + (pa[0]*uy + pa[1]*vy)*0.27, pxw + (pb2[0]*ux + pb2[1]*vx)*0.27, pyw + (pb2[0]*uy + pb2[1]*vy)*0.27); }
      rects.push(gu, gv, 0.32, 0.32);
    }
  });
  rooms.forEach(function(R){
    (ROOMS[R.type] || ROOMS.store).forEach(function(rule){
      var name = rule[0], mode = rule[1], o = rule[3] || {}, cnt = rule[2] < 0 ? Math.max(1, Math.min(40, Math.round(R.area/-rule[2]))) : rule[2], f = FURN[name], s = f.s || [f.boxes[0][3], f.boxes[0][5]], e, it, fe;
      cls = mode === 'rows' || mode === 'mid' ? 1 : 2;
      if (mode === 'rows'){
        var dir = o.face === 'far' ? (farEnd(R) + (o.seat ? 0 : 2)) % 4 : (R.w >= R.h ? 1 : 0), hu = dir & 1 ? s[0] : s[1], hv = dir & 1 ? s[1] : s[0], mg = 1.25, ex = (o.ring || o.seat) ? 0.7 : 0;
        var su = 2*hu + (dir & 1 ? o.gw : o.gd) + (dir & 1 ? 0 : ex), sv = 2*hv + (dir & 1 ? o.gd : o.gw) + (dir & 1 ? ex : 0);
        var lu = R.a0 + mg + hu, hiu = R.a1 - mg - hu, lv = R.b0 + mg + hv, hiv = R.b1 - mg - hv;
        if (o.mf){ fe = farEnd(R); if (fe === 0) hiu -= o.mf - mg; else if (fe === 2) lu += o.mf - mg; else if (fe === 1) hiv -= o.mf - mg; else lv += o.mf - mg; }
        var nu = Math.floor((hiu - lu)/su) + 1, nv = Math.floor((hiv - lv)/sv) + 1, n2 = 0; if (hiu < lu || hiv < lv) return;
        lu += ((hiu - lu) - (nu - 1)*su)/2; lv += ((hiv - lv) - (nv - 1)*sv)/2;
        for (var iu = 0; iu < nu && n2 < cnt; iu++) for (var iv = 0; iv < nv && n2 < cnt; iv++){
          if (o.brk && ((dir & 1 ? iu : iv) + 1) % o.brk === 0) continue;
          it = put(name, lu + iu*su, lv + iv*sv, dir, R); if (it){ n2++; extras(it, o, R); }
        }
        return;
      }
      for (e = 0; e < cnt; e++){
        it = null;
        if (mode === 'mid'){ var offs = [0,0, 0.8,0, -0.8,0, 0,0.8, 0,-0.8, 1.6,0, -1.6,0, 0,1.6, 0,-1.6], md = R.w >= R.h ? 1 : 0; for (var q1 = 0; q1 < offs.length && !it; q1 += 2) it = put(name, R.cu + offs[q1], R.cv + offs[q1+1], md, R); }
        else if (mode === 'end'){ fe = farEnd(R); var off = o.off || 0, sh = [0, 0.7, -0.7, 1.4, -1.4, 2.1, -2.1]; for (var q2 = 0; q2 < sh.length && !it; q2++) it = fe === 0 ? put(name, R.a1 - s[1] - 0.06 - off, R.cv + sh[q2], 0, R) : fe === 2 ? put(name, R.a0 + s[1] + 0.06 + off, R.cv + sh[q2], 2, R) : fe === 1 ? put(name, R.cu + sh[q2], R.b1 - s[1] - 0.06 - off, 1, R) : put(name, R.cu + sh[q2], R.b0 + s[1] + 0.06 + off, 3, R); }
        else { it = onWall(name, R, mode); if (!it && o.alt){ it = onWall(o.alt, R, mode); } }
        if (!it) break; extras(it, o, R);
      }
    });
  });
  /* layout rule 2 (0.49.3): no room is left bare. A room with less than a tenth of its floor in use gets filler that suits the building, against its walls first and then in the middle */
  (function(){
    var FILL = {house:['dresser', 'armchair', 'plant', 'ctable', 'lamp', 'bin'], shop:['shelf', 'crate', 'display', 'barrel', 'shelf'], food:['table', 'plant', 'crate', 'table'], civic:['filing', 'odesk', 'plant', 'bin', 'locker'], medical:['cabinet', 'chair', 'locker', 'cabinet'], industrial:['crate', 'barrel', 'bench', 'crate'], office:['filing', 'odesk', 'plant', 'bin', 'locker']}, fl = FILL[b.cat] || FILL.shop, MID = {house:'ctable', shop:'crate', food:'table', civic:'odesk', medical:'cabinet', industrial:'crate'};
    LIMC = Math.round(FLIM*1.7);
    rooms.slice().sort(function(x, y){ var nx = 0, ny = 0; items.forEach(function(it){ if (it.R === x) nx++; if (it.R === y) ny++; }); return nx/x.area - ny/y.area; }).forEach(function(R){
      if (R.area < 9 || R.type === 'bath' || R.type === 'wc') return;
      var cov = function(){ var c0 = 0; items.forEach(function(it){ if (it.on && it.R === R && !it.f.flat){ var ss = it.f.s || [it.f.boxes[0][3], it.f.boxes[0][5]]; c0 += 4*ss[0]*ss[1]; } }); return c0/R.area; };
      var want = R.area > 30 ? 0.11 : 0.09, tries = 0, c1 = cov(); cls = 2;
      while (c1 < want && tries < 16){ var nm = fl[tries % fl.length]; if (FURN[nm]) onWall(nm, R, tries & 1 ? 'rand' : 'corner'); tries++; c1 = cov(); }
      if (c1 < want && R.area > 28 && FURN[MID[b.cat] || 'crate']){ var offs = [0,0, 1.4,0, -1.4,0, 0,1.4, 0,-1.4, 2.8,0, -2.8,0, 0,2.8, 0,-2.8, 1.4,1.4, -1.4,-1.4, 1.4,-1.4, -1.4,1.4], md = R.w >= R.h ? 1 : 0, nm2 = MID[b.cat] || 'crate';
        for (var q3 = 0; q3 < offs.length && c1 < want; q3 += 2){ if (put(nm2, R.cu + offs[q3], R.cv + offs[q3+1], md, R)) c1 = cov(); } }
    });
  })();
  rooms.forEach(function(R){ R.n0 = items.filter(function(it){ return it.R === R; }).length; });
  /* ---- walk test: flood out from the front door, and take furniture away until everything you can search can be walked to ---- */
  (function(){
    var st = 0.25, PR = 0.34, W = Math.ceil((u1 - u0)/st) + 1, H = Math.ceil((v1 - v0)/st) + 1, base = new Uint8Array(W*H), blk = new Uint8Array(W*H), seen = new Uint8Array(W*H), gi, gj, e, it, c, stage;
    if (W*H > 60000 || (!b.door && !lvl)) return;
    for (gj = 0; gj < H; gj++) for (gi = 0; gi < W; gi++){
      var gu = u0 + gi*st, gv = v0 + gj*st, x = gu*ux + gv*vx, y = gu*uy + gv*vy, ok = pip(p, x, y) && polyDist(p, x, y, true) >= PR;
      for (q = 0; ok && q < segs.length; q += 4) if (segDist(x, y, segs[q], segs[q+1], segs[q+2], segs[q+3]) < PR) ok = false;
      base[gj*W + gi] = ok ? 1 : 0;
    }
    function flood(bare){
      blk.set(base); seen.fill(0);
      for (e = 0; e < items.length; e++){ it = items[e]; if (!it.on || bare) continue; c = it.cl;
        for (q = 0; q < c.length; q += 3){ var cu = c[q]*ux + c[q+1]*uy, cv = c[q]*vx + c[q+1]*vy, rr = c[q+2] + PR - 0.03, i0 = Math.max(0, Math.floor((cu - rr - u0)/st)), i1 = Math.min(W - 1, Math.ceil((cu + rr - u0)/st)), j0 = Math.max(0, Math.floor((cv - rr - v0)/st)), j1 = Math.min(H - 1, Math.ceil((cv + rr - v0)/st));
          for (gj = j0; gj <= j1; gj++) for (gi = i0; gi <= i1; gi++){ var du = u0 + gi*st - cu, dv = v0 + gj*st - cv; if (du*du + dv*dv < rr*rr) blk[gj*W + gi] = 0; } } }
      var SX = lvl ? LX : b.door.x + b.door.nx*0.6, SY = lvl ? LY : b.door.y + b.door.ny*0.6, Q = [], si = Math.round((SX*ux + SY*uy - u0)/st), sj = Math.round((SX*vx + SY*vy - v0)/st), k2;
      for (gj = sj - 3; gj <= sj + 3; gj++) for (gi = si - 3; gi <= si + 3; gi++){ if (gi < 0 || gj < 0 || gi >= W || gj >= H) continue; k2 = gj*W + gi; if (blk[k2] && !seen[k2]){ seen[k2] = 1; Q.push(k2); } }
      while (Q.length){ k2 = Q.pop(); gi = k2 % W; if (gi > 0 && blk[k2-1] && !seen[k2-1]){ seen[k2-1] = 1; Q.push(k2-1); } if (gi < W - 1 && blk[k2+1] && !seen[k2+1]){ seen[k2+1] = 1; Q.push(k2+1); } if (k2 >= W && blk[k2-W] && !seen[k2-W]){ seen[k2-W] = 1; Q.push(k2-W); } if (k2 < W*H - W && blk[k2+W] && !seen[k2+W]){ seen[k2+W] = 1; Q.push(k2+W); } }
      var bad = [], RR = Math.ceil(1.6/st);
      for (e = 0; e < items.length; e++){ it = items[e]; if (!it.on || it.cls !== 3) continue;
        var ci = Math.round((it.x*ux + it.y*uy - u0)/st), cj = Math.round((it.x*vx + it.y*vy - v0)/st), hit = false;
        for (gj = Math.max(0, cj - RR); gj <= Math.min(H - 1, cj + RR) && !hit; gj++) for (gi = Math.max(0, ci - RR); gi <= Math.min(W - 1, ci + RR); gi++) if (seen[gj*W + gi] && (gi - ci)*(gi - ci) + (gj - cj)*(gj - cj) <= RR*RR){ hit = true; break; }
        if (!hit) bad.push(it); }
      return bad;
    }
    flood(true).forEach(function(x){ x.on = 0; });   /* walled off even in an empty building: not worth keeping */
    if (DEP){ var dpa = Math.sign(DEP.s1 - DEP.s0), dpw = U2W(DEP.s0 - dpa*0.9, (DEP.c0 + DEP.c1)/2, DEP.A), dpi = Math.round((dpw[0]*ux + dpw[1]*uy - u0)/st), dpj = Math.round((dpw[0]*vx + dpw[1]*vy - v0)/st), got = false;
      for (gj = dpj - 3; gj <= dpj + 3 && !got; gj++) for (gi = dpi - 3; gi <= dpi + 3; gi++) if (gi >= 0 && gj >= 0 && gi < W && gj < H && seen[gj*W + gi]){ got = true; break; }
      if (!got) unreach = true; }   /* the way up from this floor cannot be reached from the way in: this floor has to be the top one */
    var off = [], bad;
    for (stage = 0; stage < 6; stage++){
      bad = flood(); if (!bad.length) break;
      if (stage === 5){ bad.forEach(function(x){ x.on = 0; }); break; }
      var want = stage % 3, all = stage >= 3;
      items.forEach(function(x){ if (!x.on || x.cls > want || x.f.flat) return; var hit = all; for (var z = 0; z < bad.length && !hit; z++) if (bad[z].R === x.R) hit = true; if (hit){ x.on = 0; off.push(x); } });
    }
    /* put back whatever turns out not to have been in the way */
    off.sort(function(x, y){ return y.cls - x.cls; });
    /* layout rule 3 (0.49.3): put things back a whole room at a time (one walk test per room, not one per item), and only fall back to item by item for a room that does not take it all */
    var byR = [], lim1 = Math.max(60, Math.min(260, Math.floor(2500000/(W*H + 1)))), nf = 0;
    off.forEach(function(x){ var g = null; byR.forEach(function(r2){ if (r2.R === x.R) g = r2; }); if (!g) byR.push(g = {R:x.R, l:[]}); g.l.push(x); });
    byR.forEach(function(g){ if (nf >= lim1) return; g.l.forEach(function(x){ x.on = 1; }); nf++; if (!flood().length) return; g.l.forEach(function(x){ x.on = 0; });
      for (e = 0; e < g.l.length && nf < lim1; e++){ var x1 = g.l[e]; x1.on = 1; nf++; if (flood().length) x1.on = 0; } });
  })();
  var nOn = 0, cn = CB || 0, fixes = [], gone = (world.edits.moved || {})[b.id] || [];
  items.forEach(function(it, ii){
    if (!it.on) return; nOn++;
    ii += lvl*10000; var ci0 = it.f.name ? cn++ : -1; if (gone.indexOf(ii) >= 0) return;   /* pushed against a door: drawn there instead */
    if (it.f.fix || it.f.fix2) fixes.push({lvl:lvl, fix:it.f.fix || it.f.fix2, x:it.x, y:it.y, b:b, ii:ii, fx:it.fx, fy:it.fy, taps:it.f.taps || 0, name:it.f.fix2 === 'bench' ? 'tool bench' : it.f.fix === 'bed' ? 'bed' : it.f.fix === 'stove' ? 'stove' : {sink:'sink', toilet:'toilet', tub:'bath', basin:'basin'}[Object.keys(FURN).filter(function(n){ return FURN[n] === it.f; })[0]] || 'tap'});
    var f = it.f, x = it.x, y = it.y, yaw = it.yaw, M = f.models && QS.models ? MODELS[f.models[it.mi]] : null, top = f.boxes[0][1] + f.boxes[0][4];
    if (M){ m.model(M, x, y, yaw, 0.1); top = M.h; }
    else f.boxes.forEach(function(bx){ m.ybox(x, y, yaw, bx[0], bx[2], bx[1] + 0.1, bx[3], bx[4], bx[5], C(bx[6])); });
    if (f.tex !== undefined && !(M && M.sp)){ var b0 = f.boxes[0]; m.panel(x, y, yaw, b0[5] + 0.03, 0.1, b0[1] + b0[4] + 0.1, b0[3], f.tex); }
    for (q = 0; q < it.cl.length; q++) circs.push(it.cl[q]);
    if (!f.flat) furn.push({sv:'furn', lvl:lvl, x:x, y:y, ii:ii, f:f, b:b});
    if (f.name) conts.push({lvl:lvl, x:x, y:y, h:top + lvl*FH + 0.35, name:f.name, i:ci0, b:b, lt:f.lt, hide:!!f.hide, heavy:!!f.heavy, ii:ii, mdl:M ? f.models[it.mi] : (f.models ? f.models[0] : null), fx:it.fx, fy:it.fy});
  });
  total = nOn;
  if (window.ROOMAUD) rooms.forEach(function(R){ var cv = 0, nn = 0; items.forEach(function(it){ if (it.on && it.R === R && !it.f.flat){ var ss = it.f.s || [it.f.boxes[0][3], it.f.boxes[0][5]]; cv += 4*ss[0]*ss[1]; nn++; } }); var ins = 0; for (var gi2 = 0; gi2 < 25; gi2++){ var gu2 = R.a0 + (gi2 % 5 + 0.5)/5*R.w, gv2 = R.b0 + (Math.floor(gi2/5) + 0.5)/5*R.h; if (pip(p, gu2*ux + gv2*vx, gu2*uy + gv2*vy)) ins++; } ROOMAUD.push({ins:ins/25, n0:R.n0, tot:total, lim:FLIM, b:b.id, cat:b.cat, kind:b.kind, lvl:lvl, type:R.type, area:R.area, w:Math.min(R.w, R.h), l:Math.max(R.w, R.h), cover:cv/R.area, n:nn}); });
  /* a tiny building still gets one thing to search */
  if (!conts.length && !lvl && b.area > 9 && pip(p, b.cx, b.cy)){ m.ybox(b.cx, b.cy, 0, 0, 0, 0.55, 0.5, 0.45, 0.5, C('#b98a52')); circs.push(b.cx, b.cy, 0.5); conts.push({x:b.cx, y:b.cy, h:1.3, name:'crate', i:0, b:b}); }
  /* only some of what you can open is still stocked: the rest was picked over long ago */
  var ord = conts.map(function(c, ci){ return [hash(b.id, ci, 77), c]; }).sort(function(x, y){ return x[0] - y[0]; });
  ord.forEach(function(e2, ci){ if (ci > (lvl ? 0 : b.rolls + 1)) e2[1].poor = 1; });
  /* floors and ceilings, with the stairwell cut out of the ceiling below and the floor above */
  var holeOf = function(S3){ var h0 = Math.min(S3.s0, S3.s1), h1 = Math.max(S3.s0, S3.s1); return S3.A ? [S3.c0, h0, S3.c1, h1] : [h0, S3.c0, h1, S3.c1]; };
  var HUarr = lvl && ARR ? holeOf(ARR) : null, HUdep = DEP ? holeOf(DEP) : (!lvl && STS[0] ? holeOf(STS[0]) : null);
  var flat = function(y, col, tex, hole){
    for (var i3 = 0; i3 < b.tri.length; i3 += 3){ var tri3 = [b.tri[i3]*2, b.tri[i3+1]*2, b.tri[i3+2]*2].map(function(o){ return [p[o]*ux + p[o+1]*uy, p[o]*vx + p[o+1]*vy]; }), pieces = [tri3];
      if (hole) pieces = [clipHalf(tri3, 0, hole[0], true), clipHalf(tri3, 0, hole[2], false), clipHalf(clipHalf(clipHalf(tri3, 0, hole[0], false), 0, hole[2], true), 1, hole[1], true), clipHalf(clipHalf(clipHalf(tri3, 0, hole[0], false), 0, hole[2], true), 1, hole[3], false)];
      pieces.forEach(function(pg){ if (pg.length < 3) return; var W3 = pg.map(function(q3){ return [q3[0]*ux + q3[1]*vx, q3[0]*uy + q3[1]*vy]; }); m.pl = tex;
        for (var f3 = 1; f3 < W3.length - 1; f3++) m.tri(W3[0][0], y, W3[0][1], W3[f3][0], y, W3[f3][1], W3[f3+1][0], y, W3[f3+1][1], col, 255); m.pl = null; }); }
  };
  flat(0.1, WHITE, [b.cat === 'house' ? TX.wood : TX.floorTile, 0.5], HUarr);
  flat(ceilY, cc, null, HUdep);
  var hatch = null;
  if (lvl && lvl === NLx - 1 && b.lad !== undefined && b.h > FH + 2.4){   /* a flat roof: a ladder at the top of the stairs goes up through a hatch */
    hatch = {x:LX, y:LY}; var hc = C('#6a6e72'), hd2 = C('#3a3d40');
    for (var hs = -1; hs <= 1; hs += 2) m.box(LX + hs*0.22, ceilY/2, LY, [0.025, 0, 0], [0, ceilY/2, 0], [0, 0, 0.025], hc);
    for (var hr = 0.3; hr < ceilY - 0.1; hr += 0.32) m.box(LX, hr, LY, [0.22, 0, 0], [0, 0.015, 0], [0, 0, 0.018], hc);
    m.box(LX, ceilY - 0.02, LY, [0.42, 0, 0], [0, 0.02, 0], [0, 0, 0.42], hd2);
  }
  var yo = (world.hg ? b.base : 0) + lvl*FH; if (yo) for (i = 1; i < m.p.length; i += 3) m.p[i] += yo;
  return {unreach:unreach, hatch:hatch, m:m, cn:cn, stairs:lvl ? null : STS, nl:NLx, segs:segs, iw:iw, circs:circs, conts:conts, furn:furn, idoors:lvl ? [] : idoors, fixes:fixes, rooms:rooms.map(function(R){ return R.type; }), n:total};
}
var loaded = [], stampN = 0;
function bdist(b, x, y){ var dx = Math.max(b.minx - x, 0, x - b.maxx), dy = Math.max(b.miny - y, 0, y - b.maxy); return Math.hypot(dx, dy); }
function manageInteriors(budget){
  natT -= 1; if (natT <= 0 || budget > 10){ natT = 4; manageNature(); }
  manageFacades(budget > 10 ? 9999 : 1);
  manageChunks(budget > 10 ? 9999 : 2);
  var cand = [], c0x = Math.floor(P.x/G), c0y = Math.floor(P.y/G), i; stampN++;
  for (var cy = c0y - 3; cy <= c0y + 3; cy++) for (var cx = c0x - 3; cx <= c0x + 3; cx++){
    var cell = world.grid.get(gk(cx, cy)); if (!cell) continue;
    for (i = 0; i < cell.length; i++){ var b = cell[i]; if (b.int || b.gone || b.stamp === stampN) continue; b.stamp = stampN; var d = bdist(b, P.x, P.y); if (d < QS.intR) cand.push([d, b]); }
  }
  cand.sort(function(a, b){ return a[0] - b[0]; });
  for (i = 0; i < cand.length && i < budget; i++){ cand[i][1].int = genInterior(cand[i][1]); loaded.push(cand[i][1]); }
  if (P.inside && P.inside.int && P.inside.int.lv.length < Math.min(P.inside.int.nl, (P.lvl || 0) + 3)) growInterior(P.inside, P.inside.int);   /* one more floor above you, a floor at a time */
  for (i = loaded.length - 1; i >= 0; i--) if (bdist(loaded[i], P.x, P.y) > QS.intR + 37){ freeInt(loaded[i]); loaded[i].int = null; loaded.splice(i, 1); }
}
/* 0.94.1: moved here from play.html so the Maps Builder uses the same code */
function segX(ax, ay, bx, by, cx, cy, dx, dy){ var rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy, den = rx*sy - ry*sx; if (Math.abs(den) < 1e-9) return false; var t = ((cx - ax)*sy - (cy - ay)*sx)/den, u = ((cx - ax)*ry - (cy - ay)*rx)/den; return t > 0.001 && t < 0.999 && u >= 0 && u <= 1; }
function segsX(L, ax, ay, bx, by){ for (var i = 0; i < L.length; i += 4) if (segX(ax, ay, bx, by, L[i], L[i+1], L[i+2], L[i+3])) return true; return false; }
/* 0.100.0: the bikes pack's pedal bikes (assets/shaped/bikes.js): body, handlebars (turn with the front wheel), cranks (turn as you pedal) and two wheels, in the cars' frame (x forward) */
var BIKEM = {}, BIKEK = ['bicycle_city', 'bicycle_city', 'bicycle_mountain', 'bicycle_road', 'bicycle_city', 'bmx', 'cargo_bike'];
function spBike(name){
  if (BIKEM[name] !== undefined) return BIKEM[name]; BIKEM[name] = null;
  try { var S = window.SHAPED && SHAPED.bikes; if (!S || !S.models[name] || !SPON) return null; var P3 = S.models[name], col = spColour(S.palette, {BODY:S.paint[name]}, S.darker);
    var shift = function(M, px, py, pz){ for (var i = 0; i < M.n*3; i++){ M.p[i*3] -= pz; M.p[i*3+1] -= py; M.p[i*3+2] -= -px; } return M; };   /* the model's pivot (x right, y up, z forward) to the cars' frame (x forward, z right) */
    var bp = S.rig[name].bars.pivot, cp = S.rig[name].crank.pivot, W = S.wheels[name], R = S.wheelSize[name][0];
    BIKEM[name] = {B:spModel(P3.body, col, {car:true}), bars:shift(spModel(P3.bars, col, {car:true}), bp[0], bp[1], bp[2]), bp:[bp[2], bp[1], -bp[0]], crank:shift(spModel(P3.crank, col, {car:true}), cp[0], cp[1], cp[2]), cp:[cp[2], cp[1], -cp[0]], W:spModel(P3.wheel, col, {car:true}), wh:W.map(function(w, i){ return [w[2], w[1], -w[0], S.steer[name].indexOf(i) >= 0 ? 1 : 0]; }), R:R};
  } catch (er){ BIKEM[name] = null; }
  return BIKEM[name];
}
/* draws one parked or ridden bicycle; false when the pack is not loaded (the caller draws its plain boxes) */
function spBikeDraw(m, v){
  var name = BIKEK[Math.abs(hashStr(String(v.id))) % BIKEK.length], K = spBike(name); if (!K) return false;
  var st = v.steer || 0, sp = v.spin || 0, ws = 0.486/K.R;
  m.part(K.B, v.x, v.y, v.yaw, 0, 0, 0, 0, 0, 0);
  m.part(K.bars, v.x, v.y, v.yaw, 0, K.bp[0], K.bp[1], K.bp[2], 0, st);
  m.part(K.crank, v.x, v.y, v.yaw, 0, K.cp[0], K.cp[1], K.cp[2], sp*0.4, 0);
  K.wh.forEach(function(w){ m.part(K.W, v.x, v.y, v.yaw, 0, w[0], w[1], w[2], sp*ws, w[3] ? st : 0); });
  return true;
}
function hashStr(t){ var h = 0, i; for (i = 0; i < t.length; i++) h = (h*31 + t.charCodeAt(i)) | 0; return h; }
var SPB = {};
function spB(path){ if (!SPON) return null; if (SPB[path] !== undefined) return SPB[path]; SPB[path] = null; var pcs = spPieces(path); if (pcs) try { SPB[path] = spModel(pcs, spColour(path.slice(0, 3) === 'ws.' ? SHAPED.waterside.palette : SHAPED.props.palette)); } catch (er){} return SPB[path]; }
/* the art chat's torn, cracked and boarded wall pieces (buildings.breach), and the house number plaque */
var BKM = {};
function bkMod(grp, fin, name){
  var key = grp + '.' + fin + '.' + name; if (BKM[key] !== undefined) return BKM[key]; BKM[key] = null;
  try { var BK = SHAPED.buildings, pcs = grp === 'breach' ? BK.models.breach[fin][name] : BK.models.house[name]; if (!pcs) return null; var out = [];
    pcs.forEach(function(q){ var o = SHAPED.build([q], function(){ return [0, 0, 0]; }, null, {}), P0 = o.pos, glass = /^glass/.test(q.c);
      for (var t = 0; t < P0.length; t += 9) out.push({p:P0.slice(t, t + 9), c:q.c, g:glass, f:false}); }); BKM[key] = out; } catch (e){}
  return BKM[key];
}
