/* A small pose kit for survivor clips: forward kinematics on the survivor's own skeleton and a solver that finds bone angles that put a hand on a grip
   or a foot on a pedal. Used by make_clips.js. Same rules as the pack's clipRule: degrees about each bone's pivot, order X then Y then Z (three.js Rx Ry Rz),
   children carried along, `root` moves the pelvis in metres. */
module.exports = function(SV){
  var B = SV.bones, NAMES = Object.keys(B), D = Math.PI / 180;
  function mul(a, b){ var o = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) o[i*3 + j] = a[i*3]*b[j] + a[i*3 + 1]*b[3 + j] + a[i*3 + 2]*b[6 + j]; return o; }
  function rx(t){ var c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function ry(t){ var c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function rz(t){ var c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
  function app(R, v){ return [R[0]*v[0] + R[1]*v[1] + R[2]*v[2], R[3]*v[0] + R[4]*v[1] + R[5]*v[2], R[6]*v[0] + R[7]*v[1] + R[8]*v[2]]; }
  var I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  /* world transforms of every bone for a frame ({bone: [x, y, z], root: [x, y, z]}) */
  function fk(frame){
    var W = {}, root = frame.root || [0, 0, 0];
    NAMES.forEach(function(n){
      var b = B[n], a = frame[n] || [0, 0, 0], R = mul(mul(rx(a[0]*D), ry(a[1]*D)), rz(a[2]*D)), par = b.parent ? W[b.parent] : null, pp = b.parent ? B[b.parent].pivot : null;
      if (!par) W[n] = {R:R, P:[b.pivot[0] + root[0], b.pivot[1] + root[1], b.pivot[2] + root[2]]};
      else { var off = app(par.R, [b.pivot[0] - pp[0], b.pivot[1] - pp[1], b.pivot[2] - pp[2]]); W[n] = {R:mul(par.R, R), P:[par.P[0] + off[0], par.P[1] + off[1], par.P[2] + off[2]]}; }
    });
    return W;
  }
  /* where a point fixed to a bone (given at rest, model space) is in this frame */
  function at(W, bone, p){ var b = B[bone], v = app(W[bone].R, [p[0] - b.pivot[0], p[1] - b.pivot[1], p[2] - b.pivot[2]]); return [W[bone].P[0] + v[0], W[bone].P[1] + v[1], W[bone].P[2] + v[2]]; }
  var PALM = {hand_l:[0.214, 0.838, 0.026], hand_r:[-0.214, 0.838, 0.026]};   /* the middle of a closed fist, at rest */
  function hand(W, side){ var b = 'hand_' + side; return at(W, b, PALM[b]); }
  function ball(W, side){ var b = 'ball_' + side; return at(W, b, B[b].pivot); }
  function dist2(a, b){ var x = a[0]-b[0], y = a[1]-b[1], z = a[2]-b[2]; return x*x + y*y + z*z; }

  /* vars: [{bone, axis (0 x, 1 y, 2 z), lo, hi}], targets: [{get(W) -> point, to: point, w}], start frame; returns a new frame */
  function solve(start, vars, targets, o){
    o = o || {}; var f = JSON.parse(JSON.stringify(start)), reg = o.reg == null ? 0.00002 : o.reg, init = JSON.parse(JSON.stringify(start));
    function get(v){ return (f[v.bone] || [0, 0, 0])[v.axis]; }
    function set(v, x){ f[v.bone] = f[v.bone] || [0, 0, 0]; f[v.bone][v.axis] = x; }
    function cost(){ var W = fk(f), c = 0; targets.forEach(function(t){ c += (t.w || 1) * dist2(t.get(W), t.to) * 100; });
      vars.forEach(function(v){ var d = get(v) - ((init[v.bone] || [0, 0, 0])[v.axis]); c += reg * d * d * (v.k || 1); }); return c; }
    var step = o.step || 20, best = cost();
    for (var pass = 0; pass < (o.passes || 60); pass++){
      vars.forEach(function(v){
        [step, -step, step/2, -step/2].forEach(function(d){ var cur = get(v), nx = Math.max(v.lo, Math.min(v.hi, cur + d)); if (nx === cur) return; set(v, nx); var c = cost(); if (c < best){ best = c; } else set(v, cur); });
      });
      if (pass % 6 === 5) step = Math.max(step * 0.6, 0.15);
    }
    Object.keys(f).forEach(function(k){ if (k !== 'root') f[k] = f[k].map(function(x){ return Math.round(x * 10) / 10; }); });
    f.__cost = best; return f;
  }
  function err(frame, targets){ var W = fk(frame), m = 0; targets.forEach(function(t){ m = Math.max(m, Math.sqrt(dist2(t.get(W), t.to)));}); return m; }
  /* the standard variable set: both arms and legs, the spine, the pelvis tilt */
  var LIM = {
    upperarm_l:[[-170, 40], [-40, 40], [-10, 100]], upperarm_r:[[-170, 40], [-40, 40], [-100, 10]], lowerarm_l:[[-150, 0], [-60, 60], [0, 0]], lowerarm_r:[[-150, 0], [-60, 60], [0, 0]],
    thigh_l:[[-120, 30], [-25, 25], [-5, 40]], thigh_r:[[-120, 30], [-25, 25], [-40, 5]], calf_l:[[0, 150], [0, 0], [0, 0]], calf_r:[[0, 150], [0, 0], [0, 0]],
    foot_l:[[-40, 50], [0, 0], [0, 0]], foot_r:[[-40, 50], [0, 0], [0, 0]], spine_01:[[-10, 50], [-20, 20], [-10, 10]], spine_03:[[-10, 40], [-20, 20], [-10, 10]], Head:[[-30, 30], [-30, 30], [0, 0]], pelvis:[[-20, 30], [-180, 180], [0, 0]]
  };
  function vars(names, axes){ var out = []; names.forEach(function(n){ for (var a = 0; a < 3; a++) if ((!axes || axes.indexOf(a) >= 0) && LIM[n][a][0] !== LIM[n][a][1]) out.push({bone:n, axis:a, lo:LIM[n][a][0], hi:LIM[n][a][1]}); }); return out; }
  return {fk:fk, at:at, hand:hand, ball:ball, solve:solve, err:err, vars:vars, LIM:LIM, REST_PELVIS:B.pelvis.pivot};
};
