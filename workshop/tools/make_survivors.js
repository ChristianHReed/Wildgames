/* Builds packs/afterstreet-survivors.js with the Workshop engine: new clothes, hair, hats, faces, gear and outer layers for the survivor creator,
   and ready-made player characters ("looks") that use them. Run: node workshop/tools/make_survivors.js
   Every part is built on the survivor's own skeleton and sized from the stock garments, so it fits both bodies and all three builds. */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); require(root + 'assets/shaped/survivor.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var V = SHAPED.survivor, BONES = V.bones, BODIES = ['masculine', 'feminine'];
var pack = M.newPack({id:'afterstreet-survivors', name:'AfterStreet survivors: more to wear', author:'AfterStreet content chat',
  notes:'Tops, bottoms, shoes, hair, hats, faces, gear and outer layers for the survivor creator, and eight ready-made player characters.'});

function clone(o){ return JSON.parse(JSON.stringify(o)); }
function r4(v){ return Math.round(v * 1e4) / 1e4; }
function stock(slot, body, name){ var o = V.parts[slot]; return clone(body ? o[body][name] : o[name]); }

/* ---- pieces ---- */
function along(bone, t){ var b = BONES[bone]; return [0, 1, 2].map(function(i){ return b.pivot[i] + (b.tip[i] - b.pivot[i]) * t; }); }
/* a tube following a bone from fraction t0 to t1 (0 = pivot end), radii [x, z] or one number */
function tube(bone, t0, t1, ra, rb, c, o){
  var a = along(bone, t0), b = along(bone, t1), m = [0, 1, 2].map(function(i){ return (a[i] + b[i]) / 2; });
  ra = [].concat(ra); rb = [].concat(rb); if (ra.length < 2) ra[1] = ra[0] * 1.07; if (rb.length < 2) rb[1] = rb[0] * 1.07;
  return Object.assign({s:'loft', p:m.map(r4), r:[[r4(a[0] - m[0]), r4(a[1] - m[1]), r4(a[2] - m[2]), ra[0], ra[1]], [r4(b[0] - m[0]), r4(b[1] - m[1]), r4(b[2] - m[2]), rb[0], rb[1]]], c:c}, o || {});
}
function loft(p, rows, c, o){ return Object.assign({s:'loft', p:p, r:rows, c:c}, o || {}); }
function box(p, d, c, o){ return Object.assign({s:'box', p:p, d:d, c:c}, o || {}); }
function decal(p, v, c, o){ return Object.assign({s:'decal', p:p, v:v, n:[0, 0, 1], c:c}, o || {}); }
function sq(w, h, cx, cy){ cx = cx || 0; cy = cy || 0; return [[cx - w/2, cy - h/2, 0], [cx + w/2, cy - h/2, 0], [cx + w/2, cy + h/2, 0], [cx - w/2, cy + h/2, 0]]; }
var SQ4 = {ang:[45, 135, 225, 315]};
/* a loft grown outwards (a layer over a layer) */
function grow(q, d, c){ var p = clone(q); if (p.r) p.r = p.r.map(function(r){ var o = r.slice(); o[3] = r4(o[3] + d); o[4] = r4(o[4] + d); return o; }); if (c) p.c = c; return p; }
function recolour(list, from, to){ return list.map(function(q){ var p = clone(q); if (!from || p.c === from) p.c = to; return p; }); }
function add(by, bone, q){ (by[bone] = by[bone] || []).push(q); return by; }
function addAll(by, bone, list){ list.forEach(function(q){ add(by, bone, q); }); return by; }
function sides(by, bones, fn){ [['_l', 1], ['_r', -1]].forEach(function(s){ bones.forEach(function(b){ var piece = fn(b + s[0], s[1], b); if (piece) add(by, b + s[0], piece); }); }); }

/* the stock torso of a body, so a layer sits right on it */
function torso(body, d, c){
  var T = stock('top', body, 'tshirt'), by = {};
  add(by, 'spine_01', grow(T.spine_01[0], d, c)); add(by, 'spine_03', grow(T.spine_03[0], d, c));
  return by;
}
function collarRing(c, y, rx, rz, h){ return loft([0, y, 0.004], [[0, -h/2, 0, rx, rz], [0, h/2, 0, rx * 0.92, rz * 0.92]], c, SQ4); }
function buttons(by, bone, x, y0, n, step, z, c){ for (var i = 0; i < n; i++) add(by, bone, box([x, r4(y0 - i * step), z], [0.014, 0.014, 0.006], c)); }
function bothArms(by, fn){ sides(by, ['upperarm', 'lowerarm'], function(bone, sg, base){ return fn(bone, sg, base); }); }

/* ---- the parts: each is a function of the body returning pieces by bone ---- */
var TOPS = {
  tank_top: {label:'Tank top', build:function(b){
    var by = torso(b, 0.004, 'SHIRT'), L = by.spine_03[0].r; L[2][3] = r4(L[2][3] * 0.8); L[3][3] = r4(L[3][3] * 0.78);
    add(by, 'spine_03', loft([0, 1.43, 0.003], [[0, -0.03, 0, 0.255, 0.125], [0, 0.035, 0, 0.215, 0.11]], 'SKIN', SQ4));
    add(by, 'spine_03', box([0.105, 1.445, 0.003], [0.055, 0.075, 0.17], 'SHIRT')); add(by, 'spine_03', box([-0.105, 1.445, 0.003], [0.055, 0.075, 0.17], 'SHIRT'));
    add(by, 'spine_01', loft([0, 0.945, 0], [[0, -0.02, 0, 0.19, 0.134], [0, 0.02, 0, 0.184, 0.131]], 'SHIRT_D', SQ4));
    bothArms(by, function(bone, sg, base){ return base === 'upperarm' ? tube(bone, 0, 1, 0.056, 0.04, 'SKIN') : tube(bone, 0, 1, 0.04, 0.028, 'SKIN'); });
    return by; }},
  polo_shirt: {label:'Polo shirt', build:function(b){
    var by = torso(b, 0.006, 'SHIRT');
    add(by, 'spine_03', collarRing('SHIRT_D', 1.462, 0.13, 0.092, 0.03));
    add(by, 'spine_03', decal([0, 1.395, 0.1385], sq(0.022, 0.1), 'SHIRT_D')); buttons(by, 'spine_03', 0, 1.415, 3, 0.03, 0.141, 'ACC');
    bothArms(by, function(bone, sg, base){ return base === 'upperarm' ? tube(bone, 0, 0.55, 0.066, 0.062, 'SHIRT') : tube(bone, 0, 1, 0.04, 0.028, 'SKIN'); });
    sides(by, ['upperarm'], function(bone){ return tube(bone, 0.5, 1, 0.05, 0.04, 'SKIN'); });
    sides(by, ['upperarm'], function(bone){ return tube(bone, 0.5, 0.58, 0.063, 0.063, 'SHIRT_D'); });
    return by; }},
  henley: {label:'Henley', build:function(b){
    var by = torso(b, 0.006, 'SHIRT');
    add(by, 'spine_03', collarRing('SHIRT_D', 1.462, 0.115, 0.085, 0.024));
    add(by, 'spine_03', decal([0, 1.4, 0.1385], sq(0.05, 0.1), 'SHIRT_D')); buttons(by, 'spine_03', 0, 1.425, 3, 0.03, 0.141, 'ACC');
    bothArms(by, function(bone, sg, base){ return base === 'upperarm' ? tube(bone, 0, 1, 0.064, 0.055, 'SHIRT') : tube(bone, 0, 0.9, 0.055, 0.044, 'SHIRT'); });
    sides(by, ['lowerarm'], function(bone){ return tube(bone, 0.88, 1, 0.05, 0.05, 'SHIRT_D'); });
    sides(by, ['upperarm'], function(bone){ return tube(bone, 0.9, 1, 0.055, 0.055, 'SHIRT_D'); });
    return by; }},
  fleece_vest: {label:'Fleece vest over a long-sleeved tee', build:function(b){
    var by = torso(b, 0.024, 'SHIRT'), under = torso(b, 0.004, 'ACC');
    addAll(by, 'spine_01', under.spine_01); addAll(by, 'spine_03', under.spine_03);
    add(by, 'spine_03', loft([0, 1.47, 0.0], [[0, -0.03, 0, 0.14, 0.1], [0, 0.04, 0, 0.125, 0.09]], 'SHIRT', SQ4));
    add(by, 'spine_01', loft([0, 0.945, 0], [[0, -0.022, 0, 0.2, 0.142], [0, 0.022, 0, 0.196, 0.14]], 'SHIRT_D', SQ4));
    add(by, 'spine_03', decal([0, 1.3, 0.1555], sq(0.012, 0.3), 'ACC_D')); add(by, 'spine_01', decal([0, 1.07, 0.1265], sq(0.012, 0.2), 'ACC_D'));
    bothArms(by, function(bone, sg, base){ return base === 'upperarm' ? tube(bone, 0, 1, 0.06, 0.05, 'ACC') : tube(bone, 0, 1, 0.05, 0.04, 'ACC'); });
    return by; }},
  cardigan: {label:'Cardigan', build:function(b){
    var by = torso(b, 0.014, 'SHIRT'), under = torso(b, 0.002, 'ACC');
    addAll(by, 'spine_01', under.spine_01); addAll(by, 'spine_03', under.spine_03);
    [0.07, -0.07].forEach(function(x){ add(by, 'spine_03', decal([x, 1.3, 0.1525], sq(0.05, 0.34), 'SHIRT_D')); add(by, 'spine_01', decal([x, 1.07, 0.122], sq(0.05, 0.2), 'SHIRT_D')); });
    [0.1, -0.1].forEach(function(x){ add(by, 'spine_01', decal([x * 1.5, 1.01, 0.1235], sq(0.07, 0.07), 'SHIRT_D')); });
    add(by, 'spine_03', collarRing('SHIRT_D', 1.462, 0.125, 0.09, 0.03));
    bothArms(by, function(bone, sg, base){ return base === 'upperarm' ? tube(bone, 0, 1, 0.07, 0.06, 'SHIRT') : tube(bone, 0, 1, 0.06, 0.05, 'SHIRT'); });
    sides(by, ['lowerarm'], function(bone){ return tube(bone, 0.9, 1, 0.056, 0.056, 'SHIRT_D'); });
    return by; }},
  scrubs: {label:'Scrub top', build:function(b){
    var by = torso(b, 0.006, 'SHIRT');
    add(by, 'spine_03', decal([0, 1.42, 0.1385], [[-0.06, 0.04, 0], [0.06, 0.04, 0], [0, -0.07, 0]], 'SKIN'));
    add(by, 'spine_03', decal([0.075, 1.25, 0.1465], sq(0.065, 0.07), 'SHIRT_D')); add(by, 'spine_01', decal([0, 1.01, 0.1235], sq(0.2, 0.05), 'SHIRT_D'));
    bothArms(by, function(bone, sg, base){ return base === 'upperarm' ? tube(bone, 0, 0.62, 0.068, 0.062, 'SHIRT') : tube(bone, 0, 1, 0.04, 0.028, 'SKIN'); });
    sides(by, ['upperarm'], function(bone){ return tube(bone, 0.58, 1, 0.052, 0.04, 'SKIN'); });
    return by; }}
};

var BOTTOMS = {
  skirt: {label:'Skirt', build:function(b){
    var by = {}, S = stock('bottoms', b, 'shorts'), J = stock('bottoms', b, 'jeans');
    add(by, 'pelvis', J.pelvis[1]);
    add(by, 'pelvis', loft([0, 0.82, 0], [[0, 0.16, 0, 0.185, 0.132], [0, 0.04, 0, 0.215, 0.152], [0, -0.1, 0, 0.255, 0.19], [0, -0.2, 0, 0.275, 0.21]], 'PANTS', SQ4));
    add(by, 'pelvis', loft([0, 0.625, 0], [[0, -0.008, 0, 0.275, 0.21], [0, 0.008, 0, 0.275, 0.21]], 'PANTS_D', SQ4));
    ['thigh_l', 'thigh_r', 'calf_l', 'calf_r'].forEach(function(bn){ S[bn].filter(function(q){ return q.c === 'SKIN'; }).forEach(function(q){ add(by, bn, q); }); });
    return by; }},
  leggings: {label:'Leggings', build:function(b){
    var J = stock('bottoms', b, 'jeans'), by = {};
    Object.keys(J).forEach(function(bn){ J[bn].forEach(function(q){ if (q.c === 'belt' || q.c === 'buckle') return; var g = grow(q, -0.006, q.c === 'PANTS' ? 'PANTS' : q.c); add(by, bn, g); }); });
    ['calf_l', 'calf_r'].forEach(function(bn){ var sg = bn === 'calf_l' ? 1 : -1; add(by, bn, tube(bn, 0.88, 1, 0.058, 0.058, 'PANTS_D')); });
    add(by, 'pelvis', loft([0, 0.995, 0], [[0, -0.01, 0, 0.19, 0.13], [0, 0.012, 0, 0.187, 0.128]], 'PANTS_D', SQ4));
    return by; }},
  cargo_shorts: {label:'Cargo shorts', build:function(b){
    var by = stock('bottoms', b, 'shorts');
    [['thigh_l', 1], ['thigh_r', -1]].forEach(function(s){ add(by, s[0], box([r4(s[1] * 0.176), 0.8, 0.012], [0.032, 0.125, 0.115], 'PANTS_D')); add(by, s[0], box([r4(s[1] * 0.197), 0.84, 0.012], [0.01, 0.02, 0.02], 'buckle')); });
    return by; }},
  work_pants: {label:'Work pants with knee pads', build:function(b){
    var by = stock('bottoms', b, 'jeans');
    Object.keys(by).forEach(function(bn){ by[bn].forEach(function(q){ if (q.c === 'PANTS') q.c = 'PANTS'; }); });
    [['calf_l', 1], ['calf_r', -1]].forEach(function(s){
      add(by, s[0], box([r4(s[1] * 0.0757), 0.5, 0.082], [0.108, 0.115, 0.045], 'ACC'));
      add(by, s[0], box([r4(s[1] * 0.0757), 0.5, 0.108], [0.082, 0.07, 0.012], 'ACC_D'));
    });
    [['thigh_l', 1], ['thigh_r', -1]].forEach(function(s){ add(by, s[0], box([r4(s[1] * 0.172), 0.82, 0.012], [0.03, 0.2, 0.08], 'PANTS_D')); add(by, s[0], loft([r4(s[1] * 0.0745), 0.52, 0.01], [[0, -0.02, 0, 0.097, 0.098], [0, 0.02, 0, 0.097, 0.098]], 'PANTS_D', SQ4)); });
    return by; }}
};

var SHOES = {
  sandals: {label:'Sandals', build:function(){
    var by = {};
    [['foot_l', 1], ['foot_r', -1]].forEach(function(s){ var x = r4(s[1] * 0.077);
      add(by, s[0], box([x, 0.011, 0.037], [0.086, 0.022, 0.215], 'xa8845a')); add(by, s[0], box([x, 0.027, 0.032], [0.07, 0.03, 0.17], 'SKIN'));
      add(by, s[0], box([x, 0.047, 0.07], [0.09, 0.016, 0.034], 'xd8c8a8')); add(by, s[0], box([x, 0.043, -0.045], [0.088, 0.014, 0.03], 'xd8c8a8'));
      add(by, s[0], box([r4(x + s[1] * 0.04), 0.03, -0.075], [0.008, 0.045, 0.016], 'xd8c8a8')); add(by, s[0], box([r4(x - s[1] * 0.04), 0.03, -0.075], [0.008, 0.045, 0.016], 'xd8c8a8'));
    });
    return by; }},
  work_boots: {label:'Work boots', build:function(){
    var by = stock('shoes', null, 'boots'), tan = 'x6b4a2c', tanD = 'x4c331d';
    Object.keys(by).forEach(function(bn){ by[bn].forEach(function(q){ if (q.c === 'boot') q.c = tan; if (q.c === 'bootD') q.c = tanD; }); });
    [['foot_l', 'calf_l', 1], ['foot_r', 'calf_r', -1]].forEach(function(s){ var x = r4(s[2] * 0.077);
      add(by, s[0], box([x, 0.05, 0.115], [0.082, 0.05, 0.07], tanD)); add(by, s[0], box([x, 0.01, 0.037], [0.088, 0.024, 0.218], 'xd2c8b8'));
      add(by, s[1], loft([x, 0.2, -0.009], [[0, -0.05, 0, 0.06, 0.066], [0, 0.07, 0, 0.066, 0.072]], tan, SQ4)); add(by, s[1], loft([x, 0.265, -0.009], [[0, -0.01, 0, 0.069, 0.075], [0, 0.01, 0, 0.069, 0.075]], 'ACC', SQ4));
      add(by, s[1], decal([x, 0.17, 0.0645], sq(0.05, 0.12), tanD));
    });
    return by; }},
  high_tops: {label:'High-top trainers', build:function(){
    var by = stock('shoes', null, 'trainers');
    [['foot_l', 'calf_l', 1], ['foot_r', 'calf_r', -1]].forEach(function(s){ var x = r4(s[2] * 0.077);
      add(by, s[1], loft([x, 0.14, -0.009], [[0, -0.06, 0, 0.057, 0.063], [0, 0.07, 0, 0.062, 0.068]], 'trainer', SQ4));
      add(by, s[1], loft([x, 0.2, -0.009], [[0, -0.008, 0, 0.065, 0.07], [0, 0.008, 0, 0.065, 0.07]], 'ACC', SQ4));
      add(by, s[0], box([x, 0.055, 0.1], [0.082, 0.045, 0.06], 'trainerSole'));
    });
    return by; }}
};

function headBase(name){ return stock('hair', null, name); }
var HAIRS = {
  long_hair: {label:'Long hair', build:function(){
    var by = headBase('short');
    add(by, 'Head', loft([0, 1.55, -0.074], [[0, 0.2, 0, 0.088, 0.032], [0, 0.0, -0.005, 0.098, 0.042], [0, -0.17, -0.01, 0.092, 0.036]], 'HAIR', {hat:'hide'}));
    [1, -1].forEach(function(sg){ add(by, 'Head', loft([r4(sg * 0.084), 1.62, -0.005], [[0, 0.1, 0, 0.018, 0.05], [0, -0.1, 0, 0.02, 0.045]], 'HAIR', {hat:'hide'})); });
    return by; }},
  ponytail: {label:'Ponytail', build:function(){
    var by = headBase('short');
    add(by, 'Head', loft([0, 1.64, -0.117], [[0, 0.075, 0.015, 0.034, 0.034], [0, 0.0, -0.025, 0.03, 0.03], [0, -0.1, -0.045, 0.02, 0.02]], 'HAIR', {hat:'hide'}));
    add(by, 'Head', box([0, 1.716, -0.099], [0.045, 0.026, 0.045], 'ACC', {hat:'hide'}));
    return by; }},
  mohawk: {label:'Mohawk', build:function(){
    var by = headBase('buzzed'), hs = [0.05, 0.085, 0.105, 0.105, 0.085, 0.05];
    hs.forEach(function(h, i){ add(by, 'Head', box([0, r4(1.75 + h / 2), r4(-0.08 + i * 0.03)], [0.036, h, 0.034], i % 2 ? 'HAIR' : 'HAIR_D', {hat:'hide'})); });
    return by; }},
  curly: {label:'Curly hair', build:function(){
    var by = {};
    add(by, 'Head', loft([0, 1.75, 0.012], [[0, -0.07, 0, 0.1, 0.11], [0, -0.0, 0, 0.128, 0.138], [0, 0.07, 0, 0.12, 0.13], [0, 0.125, 0, 0.078, 0.088]], 'HAIR', {hat:'hide', n:10}));
    add(by, 'Head', loft([0, 1.665, 0.05], [[0, -0.03, 0, 0.085, 0.09], [0, 0.03, 0, 0.085, 0.09]], 'HAIR_D', {both:true, closed:false, ang:[150, 210, 270, 330, 390], hat:'hide'}));
    return by; }},
  braids: {label:'Braids', build:function(){
    var by = headBase('short');
    [1, -1].forEach(function(sg){
      add(by, 'Head', loft([r4(sg * 0.072), 1.51, -0.072], [[0, 0.15, 0, 0.024, 0.024], [0, 0.0, -0.01, 0.021, 0.021], [0, -0.13, -0.022, 0.018, 0.018]], 'HAIR', {hat:'hide'}));
      add(by, 'Head', box([r4(sg * 0.072), 1.378, -0.094], [0.032, 0.03, 0.032], 'ACC', {hat:'hide'}));
    });
    return by; }},
  top_knot: {label:'Top knot', build:function(){
    var by = headBase('short');
    add(by, 'Head', loft([0, 1.86, -0.012], [[0, -0.05, 0, 0.04, 0.04], [0, 0.0, 0, 0.062, 0.062], [0, 0.055, 0, 0.04, 0.04]], 'HAIR', {hat:'hide'}));
    add(by, 'Head', loft([0, 1.815, -0.012], [[0, -0.006, 0, 0.045, 0.045], [0, 0.006, 0, 0.045, 0.045]], 'ACC', SQ4));
    return by; }}
};

var HATS = {
  bucket_hat: {label:'Bucket hat', build:function(){
    var by = {};
    add(by, 'Head', loft([0, 1.78, 0.012], [[0, -0.06, 0, 0.108, 0.122], [0, 0.04, 0, 0.1, 0.115], [0, 0.065, 0, 0.08, 0.092]], 'ACC'));
    add(by, 'Head', loft([0, 1.72, 0.012], [[0, 0.012, 0, 0.125, 0.14], [0, -0.012, 0, 0.19, 0.205]], 'ACC_D', {n:12}));
    return by; }},
  bandana: {label:'Bandana', build:function(){
    var by = {};
    add(by, 'Head', loft([0, 1.745, 0.012], [[0, -0.03, 0, 0.108, 0.122], [0, 0.04, 0, 0.1, 0.112], [0, 0.07, 0, 0.082, 0.094]], 'ACC'));
    add(by, 'Head', box([0, 1.73, -0.117], [0.06, 0.05, 0.036], 'ACC_D')); add(by, 'Head', box([0.025, 1.7, -0.13], [0.03, 0.06, 0.012], 'ACC_D')); add(by, 'Head', box([-0.02, 1.695, -0.13], [0.03, 0.07, 0.012], 'ACC'));
    return by; }},
  hard_hat: {label:'Hard hat', build:function(){
    var by = {}, y = 'xe3b82a', yd = 'xb98d18';
    add(by, 'Head', loft([0, 1.78, 0.012], [[0, -0.07, 0, 0.112, 0.128], [0, 0.0, 0, 0.115, 0.131], [0, 0.05, 0, 0.098, 0.112], [0, 0.082, 0, 0.055, 0.065]], y, {n:10}));
    add(by, 'Head', box([0, 1.83, 0.012], [0.03, 0.03, 0.2], yd)); add(by, 'Head', box([0, 1.728, 0.12], [0.2, 0.012, 0.075], yd)); add(by, 'Head', loft([0, 1.708, 0.014], [[0, -0.004, 0, 0.12, 0.136], [0, 0.004, 0, 0.12, 0.136]], yd, {n:10}));
    return by; }},
  flat_cap: {label:'Flat cap', build:function(){
    var by = {};
    add(by, 'Head', loft([0, 1.762, 0.018], [[0, -0.06, 0, 0.108, 0.125], [0, 0.0, 0, 0.125, 0.14], [0, 0.03, 0, 0.1, 0.115]], 'ACC'));
    add(by, 'Head', {s:'wedge', p:[0, 1.727, 0.15], d:[0.16, 0.012, 0.075], c:'ACC_D', fy:true}); add(by, 'Head', box([0, 1.795, 0.018], [0.02, 0.012, 0.02], 'ACC_D'));
    return by; }},
  headband: {label:'Headband', build:function(){
    var by = {};
    add(by, 'Head', loft([0, 1.735, 0.018], [[0, -0.014, 0, 0.098, 0.112], [0, 0.014, 0, 0.098, 0.112]], 'ACC'));
    add(by, 'Head', box([0.05, 1.735, -0.1], [0.025, 0.04, 0.012], 'ACC_D'));
    return by; }}
};

var FACES = {
  eyepatch: {label:'Eye patch', build:function(){
    var by = {};
    add(by, 'Head', decal([0.033, 1.672, 0.1215], sq(0.045, 0.038), 'shades'));
    add(by, 'Head', decal([0.0, 1.708, 0.1], [[-0.07, 0.015, 0], [-0.06, 0.028, 0], [0.065, -0.025, 0.002], [0.055, -0.038, 0.002]], 'shades'));
    return by; }},
  bandaged: {label:'Bandaged head', build:function(){
    var by = {}, w = 'xe8e2d0';
    add(by, 'Head', loft([0, 1.735, 0.018], [[0, -0.02, 0, 0.1, 0.114], [0, 0.02, 0, 0.1, 0.114]], w));
    add(by, 'Head', decal([-0.045, 1.65, 0.1], sq(0.05, 0.04), w)); add(by, 'Head', decal([-0.048, 1.652, 0.1012], sq(0.012, 0.018), 'xa0302a'));
    return by; }},
  goggles: {label:'Goggles on the forehead', build:function(){
    var by = {};
    add(by, 'Head', loft([0, 1.727, 0.018], [[0, -0.016, 0, 0.101, 0.115], [0, 0.016, 0, 0.101, 0.115]], 'strap'));
    [0.04, -0.04].forEach(function(x){ add(by, 'Head', box([x, 1.727, 0.122], [0.062, 0.05, 0.02], 'shades')); add(by, 'Head', decal([x, 1.727, 0.1325], sq(0.048, 0.036), 'lens')); });
    return by; }},
  respirator: {label:'Respirator', build:function(){
    var by = {};
    add(by, 'Head', loft([0, 1.622, 0.09], [[0, 0.035, -0.002, 0.066, 0.03], [0, 0.0, 0.01, 0.072, 0.045], [0, -0.04, 0.0, 0.058, 0.04]], 'x4a4d4f', SQ4));
    [0.052, -0.052].forEach(function(x){ add(by, 'Head', loft([x, 1.608, 0.132], [[0, 0, -0.012, 0.024, 0.024], [0, 0, 0.012, 0.024, 0.024]], 'x2a2b2e', {ax:'z'})); });
    add(by, 'Head', loft([0, 1.655, 0.018], [[0, -0.008, 0, 0.099, 0.113], [0, 0.008, 0, 0.099, 0.113]], 'strap'));
    return by; }},
  war_paint: {label:'War paint', build:function(){
    var by = {}, p = 'x9a2a24';
    [1, -1].forEach(function(sg){ add(by, 'Head', decal([r4(sg * 0.052), 1.655, 0.098], [[-0.03, 0.012, 0], [0.03, 0.02, 0], [0.03, 0.006, 0], [-0.03, -0.002, 0]], p)); add(by, 'Head', decal([r4(sg * 0.052), 1.633, 0.0965], [[-0.03, 0.012, 0], [0.03, 0.02, 0], [0.03, 0.006, 0], [-0.03, -0.002, 0]], p)); });
    return by; }}
};

var GEARS = {
  tool_belt: {label:'Tool belt', build:function(){
    var by = {};
    add(by, 'pelvis', loft([0, 0.945, 0], [[0, -0.022, 0, 0.198, 0.136], [0, 0.022, 0, 0.198, 0.136]], 'belt', SQ4));
    [[0.12, 0.905, 0.125, 0.07, 0.11], [-0.04, 0.905, 0.132, 0.07, 0.1], [0.2, 0.9, 0.04, 0.05, 0.12]].forEach(function(q){ add(by, 'pelvis', box([q[0], q[1], q[2]], [q[3], q[4], 0.045], 'x7a5a38')); });
    add(by, 'pelvis', box([-0.14, 0.905, 0.12], [0.02, 0.2, 0.02], 'x5a3a22')); add(by, 'pelvis', box([-0.14, 0.82, 0.12], [0.08, 0.04, 0.03], 'x6a7078'));
    return by; }},
  bandolier: {label:'Bandolier', build:function(){
    var by = {}, z = 0.152, x0 = -0.12;
    add(by, 'spine_03', decal([0, 1.3, z], [[-0.14, 0.17, 0], [-0.09, 0.2, 0], [0.14, -0.15, 0], [0.09, -0.18, 0]], 'x4a3a2c'));
    for (var i = 0; i < 6; i++) add(by, 'spine_03', box([r4(-0.09 + i * 0.036), r4(1.425 - i * 0.056), z + 0.006], [0.022, 0.04, 0.014], 'xb08a3a'));
    add(by, 'spine_03', decal([0, 1.3, -z + 0.05], [[-0.14, 0.17, 0], [-0.09, 0.2, 0], [0.14, -0.15, 0], [0.09, -0.18, 0]], 'x4a3a2c', {n:[0, 0, -1]}));
    return by; }},
  shoulder_bag: {label:'Shoulder bag', build:function(){
    var by = {};
    add(by, 'spine_03', decal([0, 1.3, 0.152], [[-0.14, 0.17, 0], [-0.1, 0.2, 0], [0.14, -0.13, 0], [0.1, -0.16, 0]], 'strap'));
    add(by, 'pelvis', box([-0.255, 0.92, 0.0], [0.09, 0.24, 0.3], 'pack')); add(by, 'pelvis', box([-0.26, 1.04, 0.0], [0.1, 0.06, 0.31], 'packD'));
    add(by, 'pelvis', box([-0.3, 0.94, 0.0], [0.012, 0.1, 0.1], 'buckle'));
    return by; }},
  hip_pack: {label:'Hip pack', build:function(){
    var by = {};
    add(by, 'pelvis', loft([0, 0.965, 0], [[0, -0.016, 0, 0.196, 0.135], [0, 0.016, 0, 0.196, 0.135]], 'strap', SQ4));
    add(by, 'pelvis', box([0, 0.935, 0.155], [0.23, 0.11, 0.075], 'pack')); add(by, 'pelvis', box([0, 0.975, 0.158], [0.23, 0.03, 0.08], 'packD')); add(by, 'pelvis', box([0.04, 0.935, 0.196], [0.03, 0.012, 0.004], 'buckle'));
    return by; }}
};

/* outer layers keep the stock coat's proportions */
var WORN = {
  duster: {label:'Duster coat', build:function(b){
    var by = stock('worn', b, 'coat'), c = 'x7a6446', cd = 'x5a4630';
    Object.keys(by).forEach(function(bn){ by[bn] = by[bn].filter(function(q){ return q.c !== 'fur'; }).map(function(q){ var p = clone(q); if (p.c === 'coat') p.c = c; else if (p.c === 'coat_D') p.c = cd; else if (p.c === 'toggle') p.c = 'buckle'; return p; }); });
    [['thigh_l', 1], ['thigh_r', -1]].forEach(function(s){ add(by, s[0], loft([r4(s[1] * 0.074), 0.66, 0.005], [[0, 0.28, 0, 0.125, 0.14], [0, 0.0, 0, 0.14, 0.15], [0, -0.28, 0.0, 0.165, 0.16]], c, SQ4)); });
    add(by, 'spine_03', loft([0, 1.43, 0.0], [[0, -0.05, 0, 0.3, 0.19], [0, 0.0, 0, 0.32, 0.2], [0, 0.04, 0, 0.2, 0.15]], cd, SQ4));
    return by; }},
  parka: {label:'Parka', build:function(b){
    var by = stock('worn', b, 'coat'), c = 'x566448', cd = 'x3f4a34';
    Object.keys(by).forEach(function(bn){ by[bn] = by[bn].map(function(q){ var p = clone(q); if (p.c === 'coat') p.c = c; else if (p.c === 'coat_D') p.c = cd; return p; }); });
    add(by, 'spine_03', loft([0, 1.47, -0.114], [[0, -0.07, -0.01, 0.18, 0.09], [0, 0.07, 0.01, 0.15, 0.085]], cd, SQ4));
    add(by, 'spine_01', decal([0.12, 1.03, 0.1795], sq(0.09, 0.1), cd)); add(by, 'spine_01', decal([-0.12, 1.03, 0.1795], sq(0.09, 0.1), cd));
    [1.0, 0.82, 0.64].forEach(function(y){ add(by, 'spine_01', loft([0, y, 0.0], [[0, -0.008, 0, 0.255, 0.19], [0, 0.008, 0, 0.255, 0.19]], cd, SQ4)); });
    return by; }},
  apron: {label:'Work apron', build:function(){
    var by = {}, c = 'x9a8a6a', cd = 'x6e6048';
    add(by, 'spine_01', box([0, 0.97, 0.152], [0.29, 0.56, 0.016], c)); add(by, 'spine_03', box([0, 1.29, 0.14], [0.17, 0.2, 0.014], c));
    add(by, 'spine_01', box([0, 0.88, 0.162], [0.2, 0.1, 0.012], cd)); add(by, 'spine_01', loft([0, 1.0, 0.0], [[0, -0.012, 0, 0.215, 0.152], [0, 0.012, 0, 0.215, 0.152]], 'strap', SQ4));
    [1, -1].forEach(function(sg){ add(by, 'spine_03', decal([r4(sg * 0.085), 1.41, 0.128], [[-0.01, -0.08, 0.0], [0.01, -0.08, 0.0], [0.03, 0.06, -0.06], [0.01, 0.06, -0.06]], 'strap')); });
    return by; }},
  hi_vis_vest: {label:'Hi-vis vest', build:function(b){
    var by = {}, T = torso(b, 0.03, 'xd8741a'), r = 'xdcdcc8';
    addAll(by, 'spine_01', T.spine_01); addAll(by, 'spine_03', T.spine_03);
    [1.08, 1.27].forEach(function(y){ add(by, y > 1.18 ? 'spine_03' : 'spine_01', loft([0, y, 0.002], [[0, -0.018, 0, 0.26, 0.17], [0, 0.018, 0, 0.26, 0.17]], r, SQ4)); });
    [0.07, -0.07].forEach(function(x){ add(by, 'spine_03', decal([x, 1.3, 0.1745], sq(0.03, 0.26), r)); });
    return by; }}
};

/* ---- documents ---- */
function layoutOf(by){ var L = {}; Object.keys(by).forEach(function(b){ L[b] = {$part:b}; }); return L; }
function docOf(slot, body, name, label, by){
  var d = M.importGarment(SHAPED, 'top', 'masculine', 'tshirt');
  d.pieces = []; d.parts = {}; d.points = []; d.extra = []; d.states = {}; delete d.from;
  d.id = name + (body ? '_' + body.charAt(0) : ''); d.name = label + (body ? ' (' + body + ')' : ''); d.author = 'AfterStreet content chat'; d.licence = 'MIT';
  d.target = {pack:'survivor', path:body ? ['parts', slot, body, name] : ['parts', slot, name]}; d.garment = {slot:slot, body:body || 'masculine', choice:name};
  d.layout = layoutOf(by);
  Object.keys(by).forEach(function(bn){ d.parts[bn] = {}; by[bn].forEach(function(np){ var ep = M.fromNative(np, bn, null); ep.id = M.newId(d); d.pieces.push(ep); }); });
  d.slotColours = M.slotDefaults(SHAPED, 'survivor', null, name);
  return d;
}
function make(slot, table, bodied){
  Object.keys(table).forEach(function(name){
    if (bodied) BODIES.forEach(function(b){ M.addModelToPack(pack, docOf(slot, b, name, table[name].label, table[name].build(b))); });
    else M.addModelToPack(pack, docOf(slot, null, name, table[name].label, table[name].build()));
  });
}
make('top', TOPS, true); make('bottoms', BOTTOMS, true); make('worn', WORN, true);
make('shoes', SHOES, false); make('hair', HAIRS, false); make('hat', HATS, false); make('face', FACES, false); make('gear', GEARS, false);

/* ---- ready-made player characters: creator choices, as the stock npcLooks, plus the gear to wear ---- */
var LOOKS = {
  fixer: {label:'Fixer', body:'feminine', build:'average', skin:2, hairColour:1, hair:'ponytail', hat:'none', face:'goggles', top:'henley', bottoms:'work_pants', shoes:'work_boots', shirt:'#b8b2a4', pants:'#3e4a5e', acc:'#c9742a', gear:['tool_belt'], worn:[], npc:[], note:'ponytail, goggles up, tool belt and knee pads: someone who fixes things'},
  courier: {label:'Courier', body:'masculine', build:'slim', skin:4, hairColour:0, hair:'curly', hat:'headband', face:'calm', top:'tank_top', bottoms:'cargo_shorts', shoes:'high_tops', shirt:'#d8dcd6', pants:'#3a4a3a', acc:'#c04a3a', gear:['shoulder_bag'], worn:[], npc:[], note:'light and quick: a tank top, a bag across the chest and high-tops'},
  hiker: {label:'Hiker', body:'feminine', build:'slim', skin:1, hairColour:3, hair:'braids', hat:'bucket_hat', face:'freckles', top:'polo_shirt', bottoms:'cargo_shorts', shoes:'boots', shirt:'#6a8a6a', pants:'#8a7a5a', acc:'#d8ccb4', gear:['hip_pack'], worn:[], npc:[], note:'braids under a bucket hat, hip pack and boots'},
  scavenger: {label:'Scavenger', body:'masculine', build:'broad', skin:3, hairColour:0, hair:'mohawk', hat:'none', face:'respirator', top:'fleece_vest', bottoms:'work_pants', shoes:'work_boots', shirt:'#5a5048', pants:'#4a4636', acc:'#8a8272', gear:['bandolier'], worn:[], npc:[], note:'mask, mohawk and a bandolier: looks dangerous and probably is not'},
  nurse: {label:'Nurse', body:'feminine', build:'average', skin:1, hairColour:2, hair:'top_knot', hat:'none', face:'calm', top:'scrubs', bottoms:'track_pants', shoes:'high_tops', shirt:'#4a8a96', pants:'#4a8a96', acc:'#e2ddd2', gear:['hip_pack'], worn:[], npc:[], note:'scrubs, hair up and a small pack of supplies'},
  wanderer: {label:'Wanderer', body:'masculine', build:'average', skin:2, hairColour:1, hair:'short', hat:'flat_cap', face:'stubble', top:'henley', bottoms:'jeans', shoes:'boots', shirt:'#8a7a62', pants:'#4a5666', acc:'#5a4a3a', gear:[], worn:['duster'], npc:[], note:'a long dusty coat over a work shirt: someone who walked here'},
  foreman: {label:'Foreman', body:'masculine', build:'broad', skin:1, hairColour:4, hair:'none', hat:'hard_hat', face:'moustache', top:'henley', bottoms:'work_pants', shoes:'work_boots', shirt:'#7a8a98', pants:'#4a4a3e', acc:'#c9a23a', gear:['tool_belt'], worn:['hi_vis_vest'], npc:[], note:'hard hat, hi-vis vest and a tool belt: runs a crew'},
  librarian: {label:'Librarian', body:'feminine', build:'slim', skin:0, hairColour:4, hair:'long_hair', hat:'none', face:'glasses', top:'cardigan', bottoms:'skirt', shoes:'trainers', shirt:'#7a6a8a', pants:'#4a4a56', acc:'#e0d8c8', gear:[], worn:[], npc:[], note:'long grey hair, glasses, cardigan and skirt: knows where everything is'}
};
Object.keys(LOOKS).forEach(function(k){
  var L = clone(LOOKS[k]), label = L.label; delete L.label;
  pack.assets.push({type:'look', id:k, name:label, kind:'character', author:'AfterStreet content chat', look:L});
});

fs.writeFileSync(root + 'packs/afterstreet-survivors.js', M.packToJS(pack));
var n = pack.assets.filter(function(a){ return a.type === 'model'; });
console.log('wrote packs/afterstreet-survivors.js:', n.length, 'parts,', pack.assets.length - n.length, 'looks,', n.reduce(function(t, a){ return t + a.stats.total; }, 0), 'triangles');
