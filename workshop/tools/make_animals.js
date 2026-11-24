/* Builds packs/afterstreet-animals.js: the four-legged animals rebuilt in the Workshop (content chat, 24 November 2026).
   Each animal is opened from the stock animals pack with the Workshop's own importer (WSM.importCreature), so its bones,
   clips and info stay exactly as they were, and its pieces are replaced with Workshop lofts that give it a real body:
   a topline with withers and rump, a deep chest and a tucked belly, muscled shoulders and thighs, joints you can see,
   a skull and a muzzle, a lighter belly strip, and hooves or paws. The pack replaces the stock pieces when it is installed.
   Run: node workshop/tools/make_animals.js
   Everything here is made of Workshop shapes (loft rings, open arcs, plates). What the Workshop could not do in one step
   is listed in the Workshop request of 24 November 2026 (a sweep along a bent path, mainly). */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/animals.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'afterstreet-animals', name:'AfterStreet animals, rebuilt', author:'AfterStreet content chat', licence:'MIT',
  notes:'The four-legged animals with rounded, muscled bodies made in the Workshop. Bones, clips and butchering info are the stock ones.'});

function r4(v){ return Math.round(v*1e4)/1e4; }
function lerp(a, b, t){ return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t]; }
var ANG10 = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];

/* species: r and rh are the body's half width and half height (as the stock pack), the rest shapes the new body */
var SPEC = {
  deer:      {r:0.2, rh:0.24, c:'deer', cD:'deerD', cL:'deerL', hoof:true, tuck:0.8, chest:1.06, withers:0.06, neckTop:0.3, hr:0.085, legTop:0.07, cannon:0.022, thigh:1.0, neckW:0.5, ear:0.15, earW:0.5, earDir:[0.75, 0.6, -0.15], earIn:'deerL'},
  deer_buck: {r:0.21, rh:0.26, c:'deer', cD:'deerD', cL:'deerL', hoof:true, tuck:0.82, chest:1.08, withers:0.07, neckTop:0.32, hr:0.085, legTop:0.075, cannon:0.024, thigh:1.0, neckW:0.55, ear:0.14, earW:0.5, earDir:[0.75, 0.6, -0.15], earIn:'deerL'},
  wolf:      {r:0.17, rh:0.22, c:'wolf', cD:'wolfD', cL:'wolfL', paw:true, tuck:0.72, chest:1.12, withers:0.05, neckW:0.6, neckTop:0.38, hr:0.1, legTop:0.06, cannon:0.022, thigh:1.0, muzzle:0.82, ear:0.11, earW:0.55, earDir:[0.15, 0.95, -0.1], tail:{l:0.42, w:0.06}, jawC:'wolfL'},
  dog:       {r:0.15, rh:0.17, c:'dog', cD:'dogD', cL:'dog', paw:true, tuck:0.74, chest:1.1, withers:0.03, neckW:0.55, neckTop:0.36, hr:0.088, legTop:0.05, cannon:0.018, thigh:1.0, ear:0.09, earW:0.6, earDir:[0.25, 0.85, -0.05], tail:{l:0.3, w:0.03, up:true}},
  fox:       {r:0.1, rh:0.12, c:'fox', cD:'foxD', cL:'foxL', legC:'foxD', paw:true, tuck:0.8, chest:1.08, withers:0.02, neckW:0.6, neckTop:0.38, hr:0.072, legTop:0.035, cannon:0.012, thigh:1.0, muzzle:0.72, ear:0.08, earW:0.6, earDir:[0.2, 0.95, -0.05], tail:{l:0.38, w:0.055, tip:'foxL'}, jawC:'foxL'}
};

function build(name){
  var S = SPEC[name], doc = M.importCreature(SHAPED, 'animals', name), B = doc.skeleton, old = doc.pieces;
  doc.id = name; doc.name = name.replace(/_/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }); doc.author = 'AfterStreet content chat';
  doc.notes = 'Rebuilt in the Workshop with rounded, muscled lofts on the stock skeleton (24 November 2026).';
  var out = [];
  function add(g, o){ var p = Object.assign({id:'q' + (out.length + 1), g:g, pos:[0, 0, 0], rot:[0, 0, 0], scl:[1, 1, 1], m:'cloth'}, o); out.push(p); return p; }
  function loft(g, c, ax, rings, o){ return add(g, Object.assign({s:'loft', ax:ax, c:c, r:rings.map(function(q){ return q.map(function(v){ return Array.isArray(v) ? v : r4(v); }); })}, o || {})); }
  function plate(g, c, v, n){ return add(g, {s:'decal', c:c, v:v.map(function(q){ return q.map(r4); }), n:n}); }

  var r = S.r, rh = S.rh, yb = B.body.pivot[1], zs = B.body.tip[2], zh = -zs, c = S.c, cD = S.cD, cL = S.cL;
  /* ---- body: rump to chest, ten sides, with a topline (withers up, back level, rump round) and an underline (deep chest, tucked belly) */
  var body = [
    [-1.30, 0.10, 0.30, 0.34],
    [-1.10, 0.10, 0.72, 0.80],
    [-0.75, 0.06, 0.92, 0.94],
    [-0.30, 0.08, 0.86*(S.tuck/0.8), S.tuck],
    [ 0.15, 0.00, 1.00, 0.98],
    [ 0.60,-0.06, 0.98, S.chest],
    [ 0.95, S.withers/rh, 0.86, 1.00],
    [ 1.20, 0.14, 0.58, 0.74],
    [ 1.32, 0.22, 0.30, 0.42]];
  var bodyRings = body.map(function(b){ var z = b[0] > 0 ? b[0]*zs : -b[0]*zh; return [0, yb + b[1]*rh, z, b[2]*r, b[3]*rh]; });
  loft('body', c, 'z', bodyRings, {ang:ANG10});
  /* lighter belly: an open arc under the middle of the body */
  loft('body', cL, 'z', bodyRings.slice(2, 7).map(function(q){ return [q[0], q[1], q[2], q[3] + 0.004, q[4] + 0.004]; }), {ang:[216, 252, 288, 324], closed:false});
  /* shoulders: a flattened mass over the top of each front leg; hips the same over each hind leg (they ride on the leg bones) */
  [['l', 1], ['r', -1]].forEach(function(sd){
    var lf = B['leg_f' + sd[0]], lh = B['leg_h' + sd[0]], x = sd[1];
    var pf = lf.pivot, ph = lh.pivot;
    loft('leg_f' + sd[0], c, 'y', [
      [pf[0] - x*0.03, pf[1] + rh*0.45, pf[2] - r*0.25, r*0.08, r*0.22],
      [pf[0] - x*0.015, pf[1] + rh*0.05, pf[2] - r*0.2, r*0.22, r*0.48],
      [pf[0] - x*0.005, pf[1] - rh*0.5, pf[2] - r*0.06, r*0.2, r*0.34],
      [pf[0], pf[1] - rh*0.95, pf[2] + r*0.02, S.legTop*0.9, S.legTop*1.1],
      lerp(pf, lf.tip, 0.75).concat([S.legTop*0.62, S.legTop*0.72]),
      [lf.tip[0], lf.tip[1], lf.tip[2], S.cannon*1.35, S.cannon*1.45]], {n:8});
    /* thigh: big and long front to back, tapering into the hock */
    var hk = lh.tip;
    loft('leg_h' + sd[0], c, 'y', [
      [ph[0] - x*0.03, ph[1] + rh*0.5, ph[2] + r*0.1, r*0.1, r*0.3],
      [ph[0] - x*0.005, ph[1] + rh*0.1, ph[2] + r*0.04, r*0.27*S.thigh, r*0.62*S.thigh],
      [ph[0], ph[1] - rh*0.45, ph[2] - r*0.06, r*0.24*S.thigh, r*0.5*S.thigh],
      lerp(ph, hk, 0.62).concat([S.legTop*0.7, S.legTop*0.95]),
      lerp(ph, hk, 1.0).concat([S.cannon*1.25, S.cannon*1.6])], {n:8});
    /* lower legs: knee or hock bump, thin cannon, fetlock, then a hoof or a paw */
    ['f', 'h'].forEach(function(fh){
      var sh = B['shin_' + fh + sd[0]], a = sh.pivot, b = sh.tip, lc = S.legC || (fh === 'h' ? c : c);
      loft('shin_' + fh + sd[0], S.legC || c, 'y', [
        [a[0], a[1], a[2], fh === 'h' ? S.cannon*1.25 : S.cannon*1.35, fh === 'h' ? S.cannon*1.6 : S.cannon*1.45],
        lerp(a, b, 0.12).concat([S.cannon*1.2, S.cannon*1.3]),
        lerp(a, b, 0.5).concat([S.cannon, S.cannon*1.1]),
        [b[0], S.paw ? S.cannon*4 : 0.10, b[2] + (S.paw ? -0.005 : 0), S.cannon*1.25, S.cannon*1.35],
        [b[0], S.paw ? S.cannon*1.6 : 0.05, b[2] + (S.paw ? 0 : 0.005), S.cannon*1.05, S.cannon*1.15]], {n:8});
      if (S.hoof){
        loft('shin_' + fh + sd[0], 'hoof', 'y', [[b[0], 0.055, b[2] + 0.004, S.cannon*1.1, S.cannon*1.2], [b[0], 0.0, b[2] + 0.012, S.cannon*1.35, S.cannon*1.6]], {n:6});
      } else {
        var pw = S.cannon*1.35, ph2 = Math.max(0.012, pw*0.7);
        loft('shin_' + fh + sd[0], S.legC || c, 'z', [[b[0], ph2*1.1, b[2] - pw*0.7, pw*0.75, ph2], [b[0], ph2, b[2] + pw*0.2, pw*1.0, ph2], [b[0], ph2*0.6, b[2] + pw*1.1, pw*0.85, ph2*0.6], [b[0], ph2*0.3, b[2] + pw*1.4, pw*0.45, ph2*0.3]], {n:8});
      }
    });
  });
  /* ---- neck: deep at the base where it meets the chest, slim under the head */
  var nk = B.neck.pivot, hb = B.neck.tip, up = (hb[1] - nk[1]) > (hb[2] - nk[2]);
  var nr = [[-0.25, S.neckW*1.15, S.neckW*1.45], [0.1, S.neckW, S.neckW*1.2], [0.55, (S.neckW + S.neckTop)/2, (S.neckW + S.neckTop)/2*1.15], [0.92, S.neckTop, S.neckTop*1.2]];
  loft('neck', c, up ? 'y' : 'z', nr.map(function(q){ var p = lerp(nk, hb, q[0]); return [p[0], p[1], p[2], q[1]*r, q[2]*r]; }));
  if (S.ruff && 0) loft('neck', S.ruff, up ? 'y' : 'z', nr.slice(0, 3).map(function(q){ var p = lerp(nk, hb, q[0]); return [p[0], p[1] + 0.01, p[2] - 0.01, q[1]*r*1.12, q[2]*r*1.12]; }), {ang:[0, 36, 72, 108, 144, 180], closed:false, both:true, cin:S.ruff});
  /* ---- head: back of the skull, the forehead, the eyes, the muzzle, the nose */
  var sn = B.head.tip, hr = S.hr, H = function(t, dy){ var p = lerp(hb, sn, t); return [p[0], p[1] + dy*hr, p[2]]; };
  var mz = S.muzzle || 1, canid = !!S.paw, head = canid ?
    [[-0.12, 0.10, 0.70, 0.75], [0.05, 0.2, 1.08, 1.0], [0.3, 0.18, 1.0, 0.92], [0.45, 0.02, 0.66, 0.62], [0.7, -0.06, 0.5, 0.5], [0.9, -0.08, 0.42, 0.44], [0.97, -0.08, 0.26, 0.28]] :
    [[-0.18, 0.15, 0.62, 0.70], [0.02, 0.22, 1.0, 1.02], [0.32, 0.14, 0.92, 0.88], [0.58, 0.0, 0.62, 0.66], [0.84, -0.06, 0.48, 0.54], [1.0, -0.06, 0.38, 0.42], [1.04, -0.06, 0.2, 0.24]];
  if (canid) mz = 1;
  var hRings = head.map(function(q){ var p = H(q[0], q[1]), f = q[0] >= 0.5 ? mz : 1; return [p[0], p[1], p[2], q[2]*hr*f, q[3]*hr*(f < 1 ? (1 + f)/2 : 1)]; });
  loft('head', c, 'z', hRings, {ang:ANG10});
  /* lower jaw: a slimmer loft under the muzzle */
  loft('head', S.jawC || c, 'z', canid ? [H(0.15, -0.42).concat([0.6*hr, 0.32*hr]), H(0.55, -0.46).concat([0.4*hr, 0.24*hr]), H(0.86, -0.44).concat([0.3*hr, 0.16*hr])] :
    [H(0.12, -0.45).concat([0.55*hr, 0.32*hr]), H(0.55, -0.45).concat([0.42*hr*mz, 0.28*hr]), H(0.92, -0.38).concat([0.24*hr*mz, 0.16*hr])], {n:8});
  /* nose and eyes as plates on the surface */
  var nt = canid ? H(0.975, 0.0) : H(1.045, -0.02);
  plate('head', 'nose', [[nt[0] - hr*0.17, nt[1] - hr*0.1, nt[2]], [nt[0] + hr*0.17, nt[1] - hr*0.1, nt[2]], [nt[0] + hr*0.15, nt[1] + hr*0.14, nt[2]], [nt[0] - hr*0.15, nt[1] + hr*0.14, nt[2]]], [0, 0, 1]);
  [1, -1].forEach(function(sx){
    var e = H(canid ? 0.3 : 0.36, canid ? 0.3 : 0.34), ex = sx*(canid ? 0.92 : 0.88)*hr, w = hr*0.16, h = hr*0.12;
    plate('head', 'eye', [[e[0] + ex, e[1] - h, e[2] - w], [e[0] + ex, e[1] - h, e[2] + w], [e[0] + ex*0.96, e[1] + h, e[2] + w*0.8], [e[0] + ex*0.96, e[1] + h, e[2] - w]], [sx, 0.35, 0.15]);
  });
  /* ears: a leaf, wide in the middle, thin front to back, cupped forward */
  [1, -1].forEach(function(sx){
    var e0 = H(0.06, 0.78), ear = S.ear, ew = ear*(S.earW || 0.42), d = S.earDir || [0.5, 0.8, -0.2];
    e0 = [sx*hr*0.55, e0[1], e0[2]]; var e1 = [e0[0] + sx*ear*d[0], e0[1] + ear*d[1], e0[2] + ear*d[2]];
    loft('head', c, 'y', [e0.concat([ew*0.55, ew*0.22]), lerp(e0, e1, 0.45).concat([ew*0.62, ew*0.18]), lerp(e0, e1, 0.85).concat([ew*0.3, ew*0.1]), e1.concat([0, 0])], {n:6});
    if (S.earIn) loft('head', S.earIn, 'y', [lerp(e0, e1, 0.15).concat([ew*0.42, 0.003]), lerp(e0, e1, 0.45).concat([ew*0.48, 0.003]).map(function(v, i){ return i === 2 ? v + ew*0.17 : v; }), lerp(e0, e1, 0.8).concat([0, 0])], {n:4});
  });
  /* tails: a bushy brush that hangs down and back (wolf, fox) */
  if (S.tail){ var tb = B.tail.pivot, T = S.tail;
    if (T.up) loft('tail', c, 'y', [[0, tb[1] - 0.01, tb[2] + 0.02, T.w*0.9, T.w*0.9], [0, tb[1] + T.l*0.3, tb[2] - T.l*0.3, T.w*0.85, T.w*0.85], [0, tb[1] + T.l*0.62, tb[2] - T.l*0.42, T.w*0.6, T.w*0.6], [0, tb[1] + T.l*0.85, tb[2] - T.l*0.36, 0, 0]], {n:6});
    else loft('tail', c, 'y', [[0, tb[1] + 0.01, tb[2] + 0.02, T.w*0.45, T.w*0.45], [0, tb[1] - T.l*0.18, tb[2] - T.l*0.22, T.w, T.w*1.05], [0, tb[1] - T.l*0.55, tb[2] - T.l*0.36, T.w*1.05, T.w*1.0], [0, tb[1] - T.l*0.85, tb[2] - T.l*0.38, T.w*0.7, T.w*0.7], [0, tb[1] - T.l, tb[2] - T.l*0.36, 0, 0]], {n:8});
    if (T.tip) loft('tail', T.tip, 'y', [[0, tb[1] - T.l*0.8, tb[2] - T.l*0.385, T.w*0.76, T.w*0.76], [0, tb[1] - T.l*1.03, tb[2] - T.l*0.36, 0, 0]], {n:8}); }
  /* keep the stock ears, antlers, horns and tail: they hang on bones whose places did not change */
  old.forEach(function(p){
    var keep = (p.g === 'tail' && !S.tail) || (p.g === 'head' && p.s === 'loft' && /antler|horn|tusk/.test(p.c));
    if (keep){ var q = JSON.parse(JSON.stringify(p)); q.id = 'q' + (out.length + 1); out.push(q); }
  });
  doc.pieces = out;
  return doc;
}

Object.keys(SPEC).forEach(function(n){ var A = M.addModelToPack(pack, build(n)); console.log(n, A.stats.total, 'triangles, mode', A.mode); });
fs.writeFileSync(root + 'packs/afterstreet-animals.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-animals.js:', pack.assets.length, 'animals');
