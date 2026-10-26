/* Afterstreet vehicle fit (reference module). Works out how to dress a vehicle from the vehicle kit (vehiclekit.js): wheel swaps, bolt-on parts, lift and paint.
   Pure data in, plain placements out: no three.js. Use in the game and in the album:
     const plan = VEHICLEFIT.plan(kit, 'pickup', { tyre: 'mud_terrain', rim: 'beadlock', parts: ['bull_bar_M', 'roof_bars_C'], paint: { paint1: '#7a2a24' } });
     plan.lift            metres to raise the body (and everything on it) so a bigger tyre clears the arch
     plan.wheels[]        { pos:[x,y,z], r, w, tyre, rim, flip }   draw the tyre model scaled (w, r, r) then the rim model scaled (w, r*rimFrac, r*rimFrac); flip = turn half a turn about y
     plan.parts[]         { name, pos:[x,y,z], mirror, group }     draw the part's model at pos (y already includes the lift); mirror = scale.x = -1
     plan.rejected[]      { part, why }                            parts that did not fit
     plan.stats           summed stats of the tyre and parts (armor, storage, light, mass, speed, grip{}) */
(function (root) {
  var EPS = 0.03;
  function fits(kit, vname, pname, tyreR, taken) {
    var v = kit.vehicles[vname], p = kit.partInfo[pname];
    if (!v) return { ok: false, why: 'unknown vehicle ' + vname };
    if (!p) return { ok: false, why: 'unknown part ' + pname };
    if (p.slot === 'transom_prop') return { ok: false, why: 'props come with their motor' };
    var keys = mountKeys(v, p.slot); if (!keys.length) return { ok: false, why: v.kind + ' has no ' + p.slot + ' mount' };
    var why = '';
    for (var i = 0; i < keys.length; i++) {
      if (taken && taken[keys[i]]) { why = 'slot ' + keys[i] + ' already holds ' + taken[keys[i]]; continue; }
      var r = check(v.mounts[keys[i]], p, tyreR); if (r.ok) return { ok: true, key: keys[i] }; why = r.why;
    }
    return { ok: false, why: why };
  }
  function mountKeys(v, slot) { var k = []; [slot, slot + '2', slot + '3'].forEach(function (n) { if (v.mounts[n]) k.push(n); }); return k; }
  function check(m, p, tyreR) {
    if (p.mirror && !m.mirror && !m.points) return { ok: false, why: 'mount is not two-sided' };
    if (m.w && p.w > m.w + EPS) return { ok: false, why: 'too wide (' + p.w + ' > ' + m.w + ')' };
    if (m.d && p.d > m.d + EPS) return { ok: false, why: 'too long (' + p.d + ' > ' + m.d + ')' };
    if (p.hMax && m.hMax && p.hMax > m.hMax + EPS) return { ok: false, why: 'too tall' };
    if (p.rCap && tyreR && tyreR > p.rCap + EPS) return { ok: false, why: 'tyre too big for these flares' };
    return { ok: true };
  }
  function plan(kit, vname, o) {
    o = o || {}; var v = kit.vehicles[vname]; if (!v) throw new Error('unknown vehicle ' + vname);
    var out = { vehicle: vname, lift: 0, wheels: [], parts: [], rejected: [], paint: o.paint || {}, stats: { mass: 0 } };
    var tyreInfo = null, rimInfo = null, r = 0, w = 0;
    if (v.wheel) {
      var wh = v.wheel, stock = wh.stock || {};
      if (wh.bike) {
        var bn = o.wheel || stock.wheel, bi = kit.bikeWheelInfo[bn]; out.wheelSet = bn;
        r = wh.r * (bi.rMul || 1); w = wh.w * (bi.wMul || 1);
        out.lift = Math.max(0, 2 * (r - wh.r) * 0.5);
        wh.points.forEach(function (pt) { out.wheels.push({ pos: [pt[0], r, pt[2]], r: r, w: w, bike: bn, flip: false }); });
        tyreInfo = bi;
      } else {
        var tn = o.tyre || stock.tyre, rn = o.rim || stock.rim; tyreInfo = kit.tyreInfo[tn]; rimInfo = kit.rimInfo[rn];
        if (!tyreInfo) throw new Error('unknown tyre ' + tn); if (!rimInfo) throw new Error('unknown rim ' + rn);
        r = wh.r * tyreInfo.rMul; w = wh.w * tyreInfo.wMul;
        if (r > wh.maxR + 1e-6) { r = wh.maxR; out.rejected.push({ part: tn, why: 'tyre capped at the vehicle maximum radius ' + wh.maxR }); }
        out.lift = Math.max(0, 2 * (r - wh.r) - wh.archClear + 0.02); if (r <= wh.r) out.lift = 0;
        out.tyre = tn; out.rim = rn;
        wh.points.forEach(function (pt) { out.wheels.push({ pos: [pt[0], r, pt[2]], r: r, w: w, tyre: tn, rim: rn, rimFrac: tyreInfo.rimFrac, flip: pt[0] < 0 }); });
      }
    }
    var used = {}, lift = out.lift;
    function add(p, pos, mirror, m) {
      out.parts.push({ name: p.name, pos: [pos[0], pos[1] + lift, pos[2]], mirror: !!mirror, group: p.group || m.group || 'body' });
    }
    (o.parts || []).forEach(function (pn) {
      var p = kit.partInfo[pn]; if (!p) { out.rejected.push({ part: pn, why: 'unknown part' }); return; }
      p = Object.assign({ name: pn }, p);
      var f = fits(kit, vname, pn, r, used);
      if (!f.ok) { out.rejected.push({ part: pn, why: f.why }); return; }
      used[f.key] = pn;
      var m = v.mounts[f.key];
      if (m.points) {
        m.points.forEach(function (pt) {
          if (p.mirror) { if (pt[0] >= 0) { add(p, pt, false, m); add(p, [-pt[0], pt[1], pt[2]], true, m); } }
          else add(p, pt, false, m);
        });
      } else {
        var z = m.pos[2];
        if (m.d) { if (p.anchor === 'front') z += m.d / 2; else if (p.anchor === 'rear') z -= m.d / 2; }
        if (p.mirror) { add(p, [m.pos[0], m.pos[1], z], false, m); add(p, [-m.pos[0], m.pos[1], z], true, m); }
        else add(p, [m.pos[0], m.pos[1], z], false, m);
        if (/^outboard_/.test(pn) && kit.partInfo[pn + '_prop']) add(Object.assign({ name: pn + '_prop' }, kit.partInfo[pn + '_prop']), [m.pos[0], m.pos[1], z], false, m);
      }
      var s = p.stats || {}; for (var k in s) if (typeof s[k] === 'number') out.stats[k] = (out.stats[k] || 0) + s[k];
    });
    if (tyreInfo && tyreInfo.grip) out.stats.grip = tyreInfo.grip;
    return out;
  }
  function compatible(kit, vname) {
    var res = [], tyreR = kit.vehicles[vname].wheel ? kit.vehicles[vname].wheel.r : 0;
    Object.keys(kit.partInfo).forEach(function (pn) { if (fits(kit, vname, pn, tyreR).ok) res.push(pn); });
    return res;
  }
  root.VEHICLEFIT = { fits: fits, plan: plan, compatible: compatible };
  if (typeof module !== 'undefined') module.exports = root.VEHICLEFIT;
})(typeof window !== 'undefined' ? window : globalThis);
