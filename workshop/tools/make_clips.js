/* Builds packs/afterstreet-clips.js: new survivor clips for bikes, boats, vehicles, digging, hunting and vaulting (finish list sections 1, 11 and 12).
   Riding, rowing, paddling and steering poses are solved against the bike and boat models' own saddle, grip, pedal, seat and helm points, so a survivor
   sits on them and holds them. Run: node workshop/tools/make_clips.js
   How the game uses a clip: frames are the pack's own (bone -> [x, y, z] degrees). A clip with an anchor (survivor.clipAnchor[name]) puts the survivor's
   pelvis pivot at (the model's point + pelvis offset); the survivor's origin is then that point minus the rest pelvis pivot (0, 0.96, 0), and the frames carry no root. */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); ['survivor', 'bikes', 'boats', 'held', 'machines'].forEach(function(n){ require(root + 'assets/shaped/' + n + '.js'); });
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var SV = SHAPED.survivor, BK = SHAPED.bikes, BT = SHAPED.boats, K = require('./pose_kit.js')(SV), REST = SV.bones.pelvis.pivot;
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function plus(a, b){ return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
var CLIPS = {}, ANCHORS = {}, NOTES = {};

/* a seated pose: the pelvis sits at `hips` in model space, solved so hands reach `hands` ([left, right] or null) and balls of the feet reach `feet` ([left, right] or null) */
function sit(hips, hands, feet, o){
  o = o || {};
  var f = {pelvis:[o.tilt || 0, o.turn || 0, 0], root:[hips[0] - REST[0], hips[1] - REST[1], hips[2] - REST[2]]};
  Object.keys(o.start || {}).forEach(function(k){ if (Array.isArray(o.start[k]) && k !== 'root' && k !== 'pelvis') f[k] = o.start[k].slice(); });
  var targets = [], V = [];
  if (hands){ targets.push({get:function(W){ return K.hand(W, 'l'); }, to:hands[0], w:2}, {get:function(W){ return K.hand(W, 'r'); }, to:hands[1], w:2}); V = V.concat(K.vars(['upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'spine_01', 'spine_03'])); }
  if (feet){ targets.push({get:function(W){ return K.ball(W, 'l'); }, to:feet[0], w:2}, {get:function(W){ return K.ball(W, 'r'); }, to:feet[1], w:2}); V = V.concat(K.vars(['thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r'])); }
  var out = K.solve(f, V, targets, {passes:o.passes || 80, reg:o.reg}); out.root = f.root; out.__err = K.err(out, targets); if (process.env.DEBUG) console.log('  targets', targets.map(function(t){ var W = K.fk(out), p = t.get(W); return [p.map(function(x){ return +x.toFixed(2); }), t.to.map(function(x){ return +x.toFixed(2); })].join(' -> '); }).join(' | ')); return out;
}
function finish(frames, name, anchor, note){
  CLIPS[name] = frames.map(function(f){ var o = {}; Object.keys(f).forEach(function(k){ if (k === '__cost' || k === '__err' || k === 'root') return; var v = f[k]; if (v.some(function(x){ return x !== 0; })) o[k] = v; }); return o; });
  if (anchor) ANCHORS[name] = anchor; NOTES[name] = note;
  var e = Math.max.apply(null, frames.map(function(f){ return f.__err || 0; })); console.log(name, frames.length + ' frames', e ? 'worst reach error ' + (e * 100).toFixed(1) + ' cm' : '');
}
function pelvisOffset(f){ return [r(f.root[0] + REST[0]), r(f.root[1] + REST[1]), r(f.root[2] + REST[2])]; }
function r(v){ return Math.round(v * 1e4) / 1e4; }

/* ---------------- bikes ---------------- */
function pedalAt(model, theta, side, zShift){
  var P = BK.pedals[model], low = P[0], up = P[1], cy = (low[1] + up[1]) / 2, R = (up[1] - low[1]) / 2, th = theta * Math.PI / 180, ph = side === 'r' ? Math.PI : 0;
  return [side === 'l' ? up[0] : low[0], cy - R * Math.cos(th + ph), (zShift || 0) - R * Math.sin(th + ph)];
}
function lift(p, dy){ return [p[0], p[1] + (dy == null ? 0.02 : dy), p[2]]; }   /* the ball of the foot sits a little above the pedal */
(function(){
  var m = 'bicycle_city', S = BK.saddle[m], G = BK.grips[m], hips = plus(S, [0, 0.04, 0]), frames = [], prev = null;
  for (var i = 0; i < 8; i++){
    var f = sit(hips, [G[1], G[0]], [lift(pedalAt(m, i * 45, 'l')), lift(pedalAt(m, i * 45, 'r'))], {tilt:12, start:prev || {spine_01:[24, 0, 0], spine_03:[8, 0, 0], thigh_l:[-70, 0, 0], thigh_r:[-70, 0, 0], calf_l:[70, 0, 0], calf_r:[70, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-30, 0, 0], lowerarm_r:[-30, 0, 0]}});
    frames.push(f); prev = f;
  }
  finish(frames, 'ride_bicycle', {point:'saddle', pelvis:pelvisOffset(frames[0]), ref:m}, 'Eight frames of one pedal turn (45 degrees of the crank each), solved on bicycle_city: hands on the grips, balls of the feet on the pedals. Play at the crank speed: one loop per crank turn. Other bikes: move the survivor by (their saddle - bicycle_city saddle).');
  var rest = sit(hips, [G[1], G[0]], [lift(pedalAt(m, 90, 'l')), lift(pedalAt(m, 90, 'r'))], {tilt:12, start:frames[2]});
  finish([rest], 'ride_bicycle_coast', {point:'saddle', pelvis:pelvisOffset(rest), ref:m}, 'Coasting on a bicycle: both feet level on the pedals.');
})();
(function(){
  var m = 'motorbike_road', S = BK.saddle[m], G = BK.grips[m], P = BK.pedals[m], hips = plus(S, [0, 0.04, 0.0]);
  var f = sit(hips, [G[1], G[0]], [lift(P[1]), lift(P[0])], {tilt:14, start:{spine_01:[28, 0, 0], spine_03:[10, 0, 0], thigh_l:[-70, 0, 0], thigh_r:[-70, 0, 0], calf_l:[75, 0, 0], calf_r:[75, 0, 0], upperarm_l:[-55, 0, 0], upperarm_r:[-55, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
  finish([f], 'ride_moto', {point:'saddle', pelvis:pelvisOffset(f), ref:m}, 'Leaning forward on a motorbike or moped, both hands on the grips and feet on the pegs (solved on motorbike_road).');
  var q = 'quad_bike', QS = BK.saddle[q], QG = BK.grips[q], QP = BK.pedals[q];
  var g = sit(plus(QS, [0, 0.04, 0]), [QG[1], QG[0]], [lift(QP[1]), lift(QP[0])], {tilt:8, start:{spine_01:[16, 0, 0], thigh_l:[-75, 0, 0], thigh_r:[-75, 0, 0], calf_l:[70, 0, 0], calf_r:[70, 0, 0], upperarm_l:[-60, 0, 10], upperarm_r:[-60, 0, -10], lowerarm_l:[-30, 0, 0], lowerarm_r:[-30, 0, 0]}});
  finish([g], 'ride_quad', {point:'saddle', pelvis:pelvisOffset(g), ref:q}, 'Sitting up on a quad bike, wide hands, feet on the footboards (solved on quad_bike).');
  var P2 = plus(S, [0, 0, -0.5]), waist = [[0.17, 1.02, S[2] + 0.12], [-0.17, 1.02, S[2] + 0.12]], pegs = [[0.17, 0.3, S[2] - 0.35], [-0.17, 0.3, S[2] - 0.35]];
  var p = sit(plus(P2, [0, 0.04, 0]), waist, pegs, {tilt:10, start:{spine_01:[12, 0, 0], thigh_l:[-70, 0, 0], thigh_r:[-70, 0, 0], calf_l:[75, 0, 0], calf_r:[75, 0, 0], upperarm_l:[-45, 0, 10], upperarm_r:[-45, 0, -10], lowerarm_l:[-50, 0, 0], lowerarm_r:[-50, 0, 0]}});
  finish([p], 'pillion', {point:'saddle', pelvis:pelvisOffset(p), ref:m, note:'rear seat: 0.5 m behind the rider\'s saddle'}, 'Sitting behind a rider, arms round their waist (the hands are 0.12 m ahead of the rider\'s hips), feet on rear pegs. Put the survivor 0.5 m behind the saddle point.');
  var tm = 'tandem', TS = BK.saddle[tm][1], TG = BK.grips[tm], frames = [], prev = null;
  for (var i = 0; i < 8; i++){
    var pd = function(side){ return lift(pedalAt(tm, i * 45, side, -0.55)); };
    var t = sit(plus(TS, [0, 0.04, 0]), [[0.16, 1.15, 0.0], [-0.16, 1.15, 0.0]], [pd('l'), pd('r')], {tilt:12, start:prev || {spine_01:[20, 0, 0], thigh_l:[-70, 0, 0], thigh_r:[-70, 0, 0], calf_l:[70, 0, 0], calf_r:[70, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-30, 0, 0], lowerarm_r:[-30, 0, 0]}});
    frames.push(t); prev = t;
  }
  finish(frames, 'tandem_rear', {point:'saddle_2', pelvis:pelvisOffset(frames[0]), ref:tm}, 'The back rider of a tandem pedalling (8 frames, 45 degrees of crank each), hands on the front rider\'s hips. Anchor: the second saddle point; the rear crank is 0.55 m behind the front one.');
})();

/* ---------------- boats ---------------- */
function oarGrip(side, a){   /* the oar's inboard grip, 0.38 m in from the rowlock, with the oar swept by a degrees */
  var rl = BT.rig.rowboat['oar_' + side].pivot, s = side === 'l' ? 1 : -1, t = a * Math.PI / 180, h = [s * 0.38, 0, 0];
  return [rl[0] + h[0] * Math.cos(t) + h[2] * Math.sin(t), rl[1] - 0.02, rl[2] - h[0] * Math.sin(t) + h[2] * Math.cos(t)];
}
(function(){
  var S = BT.seats.rowboat[0], hips = plus(S, [0, 0.04, 0]), frames = [], prev = null;
  /* the rower faces the stern (turned half a turn about Y). stroke: catch (reach), drive, finish (lean back), recover */
  var strokes = [{a:28, lean:-18, knee:-110}, {a:6, lean:-6, knee:-90}, {a:-26, lean:12, knee:-62}, {a:-4, lean:2, knee:-84}];
  strokes.forEach(function(s){
    var feet = [[0.15, 0.1, -0.5 + (s.knee + 90) * -0.004], [-0.15, 0.1, -0.5 + (s.knee + 90) * -0.004]];
    var f = sit(hips, [oarGrip('l', s.a), oarGrip('r', -s.a)], feet, {turn:180, tilt:s.lean * 0.5, start:prev || {thigh_l:[-70, 0, 0], thigh_r:[-70, 0, 0], calf_l:[70, 0, 0], calf_r:[70, 0, 0], upperarm_l:[-50, 0, 0], upperarm_r:[-50, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
    f.pelvis = [s.lean, 180, 0]; frames.push(f); prev = f;
  });
  var oar = {catch:28, drive:6, finish:-26, recover:-4};
  finish(frames, 'row', {point:'thwart', pelvis:pelvisOffset(frames[0]), ref:'rowboat', oar:[28, 6, -26, -4], note:'oar_l / oar_r values per frame (the left oar takes the number, the right oar its negative)'}, 'One stroke in four frames (catch, drive, finish, recover), seated facing the stern with both hands on the oars. The oar angles that go with the frames are in the anchor: oar_l = a, oar_r = -a (the left and right oars are mirror images, so the same turn value would scissor them).');
  var k = 'kayak', KS = BT.seats.kayak[0], KP = BT.rig.kayak.paddle.pivot, ff = [], pv = null;
  [-28, 0, 28, 0].forEach(function(a){
    var t = a * Math.PI / 180, gl = [KP[0] - 0.3 * Math.cos(t), KP[1] - 0.3 * Math.sin(t), KP[2]], gr = [KP[0] + 0.3 * Math.cos(t), KP[1] + 0.3 * Math.sin(t), KP[2]];
    var f = sit(plus(KS, [0, 0.04, 0]), [gr, gl], [[0.1, 0.12, 0.62], [-0.1, 0.12, 0.62]], {tilt:-4, start:pv || {thigh_l:[-80, 0, 0], thigh_r:[-80, 0, 0], calf_l:[28, 0, 0], calf_r:[28, 0, 0], upperarm_l:[-70, 0, 10], upperarm_r:[-70, 0, -10], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
    ff.push(f); pv = f;
  });
  finish(ff, 'paddle_kayak', {point:'seat', pelvis:pelvisOffset(ff[0]), ref:k, paddle:[-28, 0, 28, 0]}, 'Double-blade paddling in four frames (left blade down, level, right blade down, level); both hands on the shaft. The kayak\'s `paddle` roll for each frame is in the anchor (-28, 0, 28, 0).');
})();


/* ---------------- standing, kneeling and crouching work ---------------- */
function figure(root, o){
  o = o || {};
  var f = {root:root.slice()};
  Object.keys(o.start || {}).forEach(function(k){ if (Array.isArray(o.start[k]) && k !== 'root') f[k] = o.start[k].slice(); });
  var targets = [], V = [];
  (o.hands ? [['l', o.hands[0]], ['r', o.hands[1]]] : []).forEach(function(h){ if (h[1]) targets.push({get:function(W){ return K.hand(W, h[0]); }, to:h[1], w:2}); });
  (o.feet ? [['l', o.feet[0]], ['r', o.feet[1]]] : []).forEach(function(h){ if (h[1]) targets.push({get:function(W){ return K.ball(W, h[0]); }, to:h[1], w:2}); });
  (o.pts || []).forEach(function(q){ targets.push({get:function(W){ return K.at(W, q.bone, q.p || SV.bones[q.bone].pivot); }, to:q.to, w:q.w || 2}); });
  var names = (o.vars || ['upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r', 'spine_01', 'spine_03']);
  V = K.vars(names, o.axes);
  var out = K.solve(f, V, targets, {passes:o.passes || 80, reg:o.reg}); out.root = f.root; out.__err = targets.length ? K.err(out, targets) : 0; if (process.env.DEBUG && out.__err > 0.03) console.log('  miss', targets.map(function(t){ var p = t.get(K.fk(out)); return p.map(function(x){ return +x.toFixed(2); }) + ' -> ' + t.to.map(function(x){ return +x.toFixed(2); }); }).join(' | '));
  Object.keys(o.fix || {}).forEach(function(k){ out[k] = o.fix[k].slice(); });
  return out;
}
var GROUND = {l:[0.077, 0.03, 0.08], r:[-0.077, 0.03, 0.08]};   /* the balls of the feet on the ground at rest */
function ground(dz, dx){ dz = dz || 0; dx = dx || 0; return [[GROUND.l[0] + dx, GROUND.l[1], GROUND.l[2] + dz], [GROUND.r[0] + dx, GROUND.r[1], GROUND.r[2] + dz]]; }
var STAND = {thigh_l:[0, 0, 0], thigh_r:[0, 0, 0]};

/* siphon: crouched at the fuel cap, hose in the neck, can on the ground; second frame holds still, head turned to watch the flow */
(function(){
  var a = figure([0, -0.46, 0.05], {hands:[[0.12, 0.62, 0.42], [-0.12, 0.2, 0.34]], feet:ground(0.02), start:{thigh_l:[-100, 0, 0], thigh_r:[-100, 0, 0], calf_l:[110, 0, 0], calf_r:[110, 0, 0], spine_01:[22, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-50, 0, 0], lowerarm_r:[-50, 0, 0]}});
  var b = JSON.parse(JSON.stringify(a)); b.Head = [14, -22, 0]; b.spine_03 = (b.spine_03 || [0, 0, 0]).map(function(x, i){ return i === 0 ? x + 4 : x; });
  finish([a, b], 'siphon', null, 'Crouched with the left hand holding the hose in the fuel cap (0.4 m ahead, 0.6 m up) and the right hand steadying a can on the ground. Frame 1 sets the hose, frame 2 waits and watches (loop the second). Stand the survivor 0.4 m from the cap, facing it.');
})();
/* pull_winch: leaning back, hand over hand on the line, four frames */
(function(){
  var fr = [], pv = null;
  [[[0.1, 1.2, 0.55], [-0.1, 1.05, 0.3]], [[0.1, 1.1, 0.4], [-0.1, 1.2, 0.55]], [[0.1, 1.05, 0.3], [-0.1, 1.2, 0.55]], [[0.1, 1.2, 0.55], [-0.1, 1.1, 0.4]]].forEach(function(h, i){
    var f = figure([0, -0.05, -0.1], {hands:h, feet:[[0.15, 0.03, 0.3], [-0.15, 0.03, -0.12]], start:pv || {spine_01:[-10, 0, 0], thigh_l:[-30, 0, 0], thigh_r:[14, 0, 0], calf_l:[28, 0, 0], calf_r:[16, 0, 0], upperarm_l:[-50, 0, 0], upperarm_r:[-50, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
    fr.push(f); pv = f;
  });
  finish(fr, 'pull_winch', null, 'Hand over hand, body leaning back with feet apart; four frames, loop at about 1.6 s a pull. The line runs ahead of the survivor at chest height.');
})();
/* change_wheel: kneeling at a wheel, two hands turning a wrench */
(function(){
  var fr = [], pv = null;
  [[[0.04, 0.46, 0.52], [0.12, 0.42, 0.5]], [[0.0, 0.5, 0.5], [0.1, 0.38, 0.52]], [[0.04, 0.46, 0.52], [0.12, 0.42, 0.5]]].forEach(function(h){
    var f = figure([0, -0.42, 0.1], {hands:h, pts:[{bone:'calf_r', to:[-0.077, 0.04, 0.0]}, {bone:'foot_r', to:[-0.08, 0.08, -0.38]}], feet:[[0.12, 0.03, 0.5], null], start:pv || {thigh_l:[-95, 0, 0], thigh_r:[-60, 0, 0], calf_l:[95, 0, 0], calf_r:[130, 0, 0], spine_01:[24, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
    fr.push(f); pv = f;
  });
  finish(fr, 'change_wheel', null, 'Kneeling on the right knee in front of a wheel, both hands on a wrench turning a nut (three frames, loop). The wheel centre is 0.45 m ahead and 0.45 m up.');
})();
/* dig_pick: two-handed swing, raise, strike, lever */
(function(){
  var fr = [];
  [{h:[[0.04, 2.0, 0.1], [-0.02, 1.7, 0.02]], root:[0, 0, -0.04], s:-10}, {h:[[0.05, 0.8, 0.62], [-0.01, 1.05, 0.5]], root:[0, -0.12, 0.08], s:34}, {h:[[0.05, 1.1, 0.52], [-0.01, 1.3, 0.4]], root:[0, -0.08, 0.02], s:20}].forEach(function(k){
    fr.push(figure(k.root, {hands:k.h, feet:[[0.17, 0.03, 0.16], [-0.17, 0.03, -0.1]], start:{spine_01:[k.s, 0, 0], thigh_l:[-10, 0, 0], thigh_r:[8, 0, 0], upperarm_l:[-100, 0, 0], upperarm_r:[-100, 0, 0], lowerarm_l:[-30, 0, 0], lowerarm_r:[-30, 0, 0]}}));
  });
  finish(fr, 'dig_pick', null, 'Overhead, strike, lever: a two-handed pickaxe swing in three frames (0.45 s, 0.15 s, 0.3 s). The pickaxe is held as the other two-handed tools are, turned by heldTurn.dig_pick (none: the head points forward in the raised frame). Loop for a survivor breaking rock.');
})();
/* dig_trowel: kneeling, short scraping strokes */
(function(){
  var fr = [], pv = null;
  [[[-0.09, 0.2, 0.42], [0.2, 0.14, 0.32]], [[-0.09, 0.17, 0.56], [0.2, 0.14, 0.32]], [[-0.09, 0.2, 0.42], [0.2, 0.14, 0.32]]].forEach(function(h){
    var f = figure([0, -0.46, 0.14], {hands:[h[1], h[0]], pts:[{bone:'calf_r', to:[-0.077, 0.04, 0.02]}, {bone:'foot_r', to:[-0.08, 0.08, -0.4]}], feet:[[0.12, 0.03, 0.42], null], start:pv || {thigh_l:[-95, 0, 0], thigh_r:[-70, 0, 0], calf_l:[100, 0, 0], calf_r:[135, 0, 0], spine_01:[32, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
    fr.push(f); pv = f;
  });
  finish(fr, 'dig_trowel', null, 'Kneeling on the right knee, left hand steadying on the ground and the right hand scraping with a trowel in short strokes (three frames, loop at 0.5 s).');
})();
/* shore_pit: kneeling at the edge, setting a panel */
(function(){
  var fr = [], pv = null;
  [[[0.2, 0.52, 0.55], [-0.2, 0.52, 0.55]], [[0.2, 0.34, 0.66], [-0.2, 0.34, 0.66]], [[0.2, 0.25, 0.7], [-0.2, 0.25, 0.7]]].forEach(function(h){
    var f = figure([0, -0.46, 0.1], {hands:h, pts:[{bone:'calf_r', to:[-0.077, 0.04, 0.0]}, {bone:'foot_r', to:[-0.08, 0.08, -0.4]}], feet:[[0.12, 0.03, 0.42], null], start:pv || {thigh_l:[-95, 0, 0], thigh_r:[-70, 0, 0], calf_l:[100, 0, 0], calf_r:[135, 0, 0], spine_01:[26, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
    fr.push(f); pv = f;
  });
  finish(fr, 'shore_pit', null, 'Kneeling at the pit edge: lift a panel, lower it over the edge, press it into place (three frames, 0.6 s each). The panel is held in both hands in front, 0.5 m up in the first frame.');
})();
/* climb_rope_ladder: loose alternating climb; the survivor's origin is carried up the ladder one rung (0.3 m) every two frames */
(function(){
  var fr = [], pv = null, z = 0.3;
  [{l:[0.18, 1.75, z], r:[-0.18, 1.45, z], fl:[0.12, 0.8, z + 0.05], fr:[-0.12, 0.6, z + 0.05], sway:6}, {l:[0.18, 1.75, z], r:[-0.18, 1.75, z], fl:[0.12, 0.8, z + 0.05], fr:[-0.12, 0.8, z + 0.05], sway:0},
   {l:[0.18, 1.45, z], r:[-0.18, 1.75, z], fl:[0.12, 0.6, z + 0.05], fr:[-0.12, 0.8, z + 0.05], sway:-6}, {l:[0.18, 1.75, z], r:[-0.18, 1.75, z], fl:[0.12, 0.8, z + 0.05], fr:[-0.12, 0.8, z + 0.05], sway:0}].forEach(function(k){
    var f = figure([0, 0.55, -0.12], {hands:[k.l, k.r], feet:[k.fl, k.fr], axes:[0, 1, 2], start:pv || {spine_01:[10, 0, 0], thigh_l:[-60, 0, 0], thigh_r:[-30, 0, 0], calf_l:[70, 0, 0], calf_r:[50, 0, 0], upperarm_l:[-150, 0, 20], upperarm_r:[-150, 0, -20], lowerarm_l:[-20, 0, 0], lowerarm_r:[-20, 0, 0]}});
    f.spine_03 = [0, 0, k.sway]; f.pelvis = [0, 0, -k.sway * 0.6]; fr.push(f); pv = f;
  });
  finish(fr, 'climb_rope_ladder', null, 'A looser climb than the rigid ladder: body swings a little side to side, feet and hands alternate on rungs 0.3 m apart (four frames per two rungs). Origin is 0.55 m above the foot rung and 0.12 m in front of the ladder; lift the survivor 0.3 m at frames 3 and 1 of the loop.');
})();
/* hunting: skinning kneeling, butchering a hanging carcass */
(function(){
  var a = figure([0, -0.46, 0.12], {hands:[[0.1, 0.2, 0.5], [-0.1, 0.18, 0.5]], pts:[{bone:'calf_r', to:[-0.077, 0.04, 0.02]}, {bone:'foot_r', to:[-0.08, 0.08, -0.4]}], feet:[[0.12, 0.03, 0.4], null], start:{thigh_l:[-95, 0, 0], thigh_r:[-70, 0, 0], calf_l:[100, 0, 0], calf_r:[135, 0, 0], spine_01:[34, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
  var b = figure([0, -0.46, 0.12], {hands:[[0.12, 0.2, 0.55], [-0.1, 0.18, 0.42]], pts:[{bone:'calf_r', to:[-0.077, 0.04, 0.02]}, {bone:'foot_r', to:[-0.08, 0.08, -0.4]}], feet:[[0.12, 0.03, 0.4], null], start:a});
  finish([a, b, a], 'skin_kneel', null, 'Kneeling over a carcass: the left hand holds, the right hand cuts in long strokes (three frames, loop at 0.9 s).');
  var c = figure([0, 0, 0], {hands:[[0.12, 1.55, 0.42], [-0.1, 1.4, 0.4]], feet:ground(0.05), start:{spine_01:[8, 0, 0], upperarm_l:[-110, 0, 0], upperarm_r:[-100, 0, 0], lowerarm_l:[-50, 0, 0], lowerarm_r:[-60, 0, 0]}});
  var d = figure([0, 0, 0], {hands:[[0.12, 1.55, 0.42], [-0.1, 1.15, 0.4]], feet:ground(0.05), start:c});
  finish([c, d, c], 'butcher_hang', null, 'Standing at a hanging carcass: the left hand steadies at head height and the right hand cuts down (three frames, loop at 1 s). The carcass hangs 0.45 m ahead.');
})();
/* vault_low: one-hand hop over a low fence or counter (0.9 m), four frames in 0.7 s: approach, plant, swing, land */
(function(){
  var a = figure([0, 0, 0], {hands:[[0.2, 0.9, 0.5], null], start:{spine_01:[16, 0, 0], thigh_l:[-24, 0, 0], thigh_r:[16, 0, 0], calf_l:[30, 0, 0], calf_r:[10, 0, 0], upperarm_l:[-70, 0, 0], upperarm_r:[20, 0, 0], lowerarm_l:[-30, 0, 0], lowerarm_r:[-20, 0, 0]}});
  var b = figure([0.02, 0.22, 0.15], {hands:[null, [-0.24, 0.92, 0.5]], start:{spine_01:[34, 0, 0], thigh_l:[-70, 0, 8], thigh_r:[-30, 0, -6], calf_l:[90, 0, 0], calf_r:[60, 0, 0], upperarm_l:[-30, 0, 0], upperarm_r:[-70, 0, -8], lowerarm_l:[-30, 0, 0], lowerarm_r:[-10, 0, 0]}});
  var c = JSON.parse(JSON.stringify(b)); c.root = [-0.1, 0.34, 0.5]; c.pelvis = [0, 0, -30]; c.thigh_l = [-60, 0, 40]; c.calf_l = [80, 0, 0]; c.thigh_r = [-40, 0, -4]; c.calf_r = [30, 0, 0]; c.spine_01 = [20, 0, 10];
  var d = figure([0, -0.1, 0.9], {start:{spine_01:[18, 0, 0], thigh_l:[-50, 0, 0], thigh_r:[-40, 0, 0], calf_l:[70, 0, 0], calf_r:[60, 0, 0], upperarm_l:[-30, 0, 0], upperarm_r:[-30, 0, 0], lowerarm_l:[-40, 0, 0], lowerarm_r:[-40, 0, 0]}});
  finish([a, b, c, d], 'vault_low', null, 'One hand on the top, legs swung sideways over, landing crouched: four frames (0.12 s each, 0.7 s with the run-up). The survivor travels about 1.1 m forward over the loop: the root offsets here are small steps the game can add to the real motion.');
})();

/* ---------------- boats: seats, tiller, helm, poles ---------------- */
(function(){
  var rb = BT.seats.rowboat[1], a = sit(plus(rb, [0, 0.04, 0]), null, null, {start:{thigh_l:[-75, 0, 4], thigh_r:[-75, 0, -4], calf_l:[62, 0, 0], calf_r:[62, 0, 0], upperarm_l:[-22, 0, 4], upperarm_r:[-22, 0, -4], lowerarm_l:[-52, 0, 0], lowerarm_r:[-52, 0, 0], spine_01:[-3, 0, 0]}});
  finish([a], 'seated_boat', {point:'seat', pelvis:pelvisOffset(a), ref:'rowboat'}, 'A passenger on a thwart or bench in a small boat: knees bent up, hands resting on the lap or the gunwale. Anchor: the boat\'s seat point (seat_0 ...).');
  var pb = BT.seats.pontoon_boat[1], b = sit(plus(pb, [0, 0.04, 0]), null, null, {start:{thigh_l:[-88, 0, 4], thigh_r:[-88, 0, -4], calf_l:[86, 0, 0], calf_r:[86, 0, 0], upperarm_l:[-18, 0, 4], upperarm_r:[-18, 0, -4], lowerarm_l:[-58, 0, 0], lowerarm_r:[-58, 0, 0], spine_01:[-4, 0, 0]}});
  finish([b], 'seated_pontoon', {point:'seat', pelvis:pelvisOffset(b), ref:'pontoon_boat'}, 'A passenger on a pontoon deck bench: upright, feet down, arms on the lap (the same pose as sit, held at the boat\'s seat point).');
  var js = BT.seats.jon_boat[0], tl = BT.helm.jon_boat, c = sit(plus(js, [0, 0.04, 0]), [[0.2, js[1] + 0.2, js[2] + 0.1], [-0.08, tl[1] + 0.05, tl[2] + 0.0]], null, {start:{thigh_l:[-75, 0, 4], thigh_r:[-75, 0, -4], calf_l:[62, 0, 0], calf_r:[62, 0, 0], upperarm_l:[-22, 0, 4], upperarm_r:[10, 0, -20], lowerarm_l:[-52, 0, 0], lowerarm_r:[-30, 0, 0], spine_01:[-3, 10, 0]}});
  finish([c], 'steer_outboard', {point:'seat', pelvis:pelvisOffset(c), ref:'jon_boat'}, 'Seated at the stern, right hand back on the outboard tiller (reaching about 0.4 m behind), left hand on the knee. Solved on jon_boat (seat 0, helm at the stern).');
  var ph = BT.helm.pontoon_boat, hs = figure([0, 0, 0], {hands:[[0.2, 1.1, 0.5], [-0.04, 1.1, 0.5]], feet:ground(0.05), start:{upperarm_l:[-70, 0, 8], upperarm_r:[-70, 0, -8], lowerarm_l:[-30, 0, 0], lowerarm_r:[-30, 0, 0]}});
  finish([hs], 'helm_stand', {point:'helm', stand:[0, -ph[1], -0.5], ref:'pontoon_boat', note:'origin = helm point + stand (feet 0.9 m below the helm point, 0.5 m behind it)'}, 'Standing at a console with both hands on the wheel (the wheel is 0.5 m ahead and 1.1 m up). Stand the survivor 0.5 m behind the helm point with feet on the deck.');
  var cs = BT.seats.canoe[1], fr = [], pv = null;
  [0.3, 0.12, -0.06, 0.12].forEach(function(s){
    var f = sit(plus(cs, [0, 0.04, 0]), [[0.22, cs[1] + 0.62, cs[2] + 0.28 - s * 0.5], [0.37, cs[1] + 0.3, cs[2] + 0.5 - s * 0.7]], null, {start:pv || {thigh_l:[-68, 0, 6], thigh_r:[-68, 0, -6], calf_l:[55, 0, 0], calf_r:[55, 0, 0], spine_01:[8, 0, 0], upperarm_l:[-60, 0, 0], upperarm_r:[-60, 0, 0], lowerarm_l:[-50, 0, 0], lowerarm_r:[-50, 0, 0]}});
    fr.push(f); pv = f;
  });
  finish(fr, 'paddle_canoe', {point:'seat', pelvis:pelvisOffset(fr[0]), ref:'canoe', paddle:[-45, -15, 20, -15]}, 'Single-blade paddling on the right side: reach, pull, finish, recover (four frames, 0.8 s loop), seated at the stern seat. The canoe\'s `paddle` sweep for each frame is in the anchor.');
  var pr = [], pq = null;
  [[[0.1, 1.55, 0.35], [0.08, 1.2, 0.38]], [[0.1, 1.15, 0.5], [0.08, 0.8, 0.52]], [[0.1, 1.0, 0.18], [0.08, 0.66, 0.2]], [[0.1, 1.35, 0.3], [0.08, 1.0, 0.32]]].forEach(function(h, i){
    var f = figure([0, 0, i === 1 ? 0.04 : 0], {hands:h, feet:ground(0.05), start:pq || {spine_01:[10, 0, 0], upperarm_l:[-80, 0, 8], upperarm_r:[-80, 0, -8], lowerarm_l:[-30, 0, 0], lowerarm_r:[-30, 0, 0]}});
    pr.push(f); pq = f;
  });
  finish(pr, 'pole_raft', null, 'Standing and poling: reach forward, push down and back as the raft moves, lift and recover (four frames, 1.2 s loop). The pole is planted ahead of the feet and runs to the river bed.');
})();

/* ---------------- the pack ---------------- */
var anchors = {}; Object.keys(ANCHORS).forEach(function(k){ anchors[k] = ANCHORS[k]; });
var pack = M.newPack({id:'afterstreet-clips', name:'AfterStreet survivor clips', author:'AfterStreet content chat', licence:'MIT',
  notes:'Clips for bikes, boats, vehicle work, digging, hunting and vaulting. Riding and boating poses are solved on the bike and boat models\' own points.'});
pack.version = 2;
pack.assets.push({type:'clips', id:'survivor_clips_1', name:'Survivor clips: bikes, boats, work', author:'AfterStreet content chat', clips:CLIPS, anchors:anchors, notes:NOTES});
fs.writeFileSync(root + 'packs/afterstreet-clips.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-clips.js:', Object.keys(CLIPS).length, 'clips,', Object.keys(CLIPS).reduce(function(n, k){ return n + CLIPS[k].length; }, 0), 'frames');
