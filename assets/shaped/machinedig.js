/* Afterstreet machine digging (reference module, goes with machines.js version 2). No three.js.
     MACHINEDIG.tip(m, 'excavator', {boom, stick, bucket})            where the bucket teeth are: { y, z } in machine space (before the house swings)
     MACHINEDIG.pose(m, 'excavator', d, depth)                         { boom, stick, bucket } to put the teeth d metres out from the house axis and depth metres below ground
     MACHINEDIG.dumpPose(m, 'excavator', d, height)                    the same for dumping at a height (over a truck: 2.8 to 3.2)
     MACHINEDIG.cycle(m, 'excavator', { d, depth, dumpD, dumpH, swing })  key frames for one scoop at that hole, dumped dumpD out at dumpH after swinging `swing` degrees
     MACHINEDIG.scoop(m, 'excavator', depth)                           blocks one scoop takes
     MACHINEDIG.canReach(m, 'excavator', d, depth)                     true when the table has a pose for it
   m is window.SHAPED.machines. Soil is in blocks 0.5 m square and 0.5 m deep. */
(function (root) {
  function rot(y, z, py, pz, th) { var c = Math.cos(th), s = Math.sin(th), a = y - py, b = z - pz; return [py + a * c - b * s, pz + a * s + b * c]; }
  function tip(m, name, v) {
    var D = m.dig[name], R = m.rig[name], pt = [D.tip[1], D.tip[2]];
    ['bucket', 'stick', 'boom'].forEach(function (p) { var r = R[p], th = (v[p] || 0) * Math.PI / 180 * r.turn[0]; pt = rot(pt[0], pt[1], r.pivot[1], r.pivot[2], th); });
    return { y: pt[0], z: pt[1] };
  }
  function near(tab, d, h) {
    var best = null, bv = null;
    for (var k in tab) { var p = k.split(','), e = Math.abs(+p[0] - d) + Math.abs(+p[1] - h); if (best === null || e < best) { best = e; bv = tab[k]; } }
    return bv && { boom: bv[0], stick: bv[1], bucket: bv[2], error: best };
  }
  function pose(m, name, d, depth) { return near(m.dig[name].poses, d, depth); }
  function dumpPose(m, name, d, h) { return near(m.dig[name].dumpPoses, d, h); }
  function canReach(m, name, d, depth) { var p = pose(m, name, d, depth); return !!p && p.error <= m.dig[name].poseStep; }
  function scoop(m, name, depth) { var D = m.dig[name]; return D.scoopBlocks; }
  function cycle(m, name, o) {
    var D = m.dig[name], st = D.poseStep, rg = m.rig[name], sr = rg.stick.range[1], br = rg.bucket.range[1];
    var d = o.d, dep = Math.min(o.depth, D.maxDepth), dd = o.dumpD == null ? d - 1 : o.dumpD, dh = o.dumpH == null ? 2 : o.dumpH, sw = o.swing == null ? 90 : o.swing;
    var ready = dumpPose(m, name, d, 1.5), p0 = pose(m, name, d, 0), p1 = pose(m, name, d, dep), lf = dumpPose(m, name, dd, dh);
    function f(t, p, x) { var r = { t: t, boom: p.boom, stick: p.stick, bucket: p.bucket }; for (var k in x) r[k] = x[k]; return r; }
    return [f(0, ready, { house: 0 }), f(1, p0, {}), f(2, p1, {}), f(3, { boom: p1.boom, stick: Math.min(sr, p1.stick + 25), bucket: br }, {}),
            f(4, { boom: lf.boom, stick: lf.stick, bucket: br }, { house: 0 }), f(5.4, { boom: lf.boom, stick: lf.stick, bucket: br }, { house: sw }),
            f(6.2, lf, { house: sw }), f(7.8, ready, { house: 0 })];
  }
  root.MACHINEDIG = { tip: tip, pose: pose, dumpPose: dumpPose, cycle: cycle, scoop: scoop, canReach: canReach };
  if (typeof module !== 'undefined') module.exports = root.MACHINEDIG;
})(typeof window !== 'undefined' ? window : globalThis);
