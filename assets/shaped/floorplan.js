/* Afterstreet floor plans, version 1 (20 October 2026): one generator for every building kind, and a checker that proves it.
   Plain JavaScript, no dependencies: loads with a <script> tag (window.FLOORPLAN) or with require() in node.
   Written by the art chat; the rules are in docs/FLOORPLANS.md.

   FLOORPLAN.gen(kind, w, d, opt) -> plan        opt: {seed, storeys, entrance}  (w, d in metres; the plan is drawn with w the long side, see plan.turned)
   FLOORPLAN.check(plan)          -> {ok, errors[]}   walks an agent 0.6 m wide through every door; every room on every storey must be reached
   FLOORPLAN.ascii(plan, level)   -> string, for a quick look in a console

   A plan:  {kind, w, d, turned, mode:'hub'|'spine', storeys:[ {level, rooms, walls, doors, keepClear, stair}... ], entrance:{x, z}, note}
     rooms[]      {id, type, x0, z0, x1, z1}. They tile the footprint exactly. type is a room type of the game (living, kitchen, bedroom, market, nave...) or
                  'hall' (corridor, vestibule: never furnished) or 'stairs'. furnish:false marks rooms that must stay empty.
     walls[]      {x0, z0, x1, z1}: straight centre lines on the 0.5 m bay grid, thickness plan.t (0.18). Door gaps are already cut out.
     doors[]      {x, z, axis, w, a, b}: a gap 1.0 m wide centred at (x, z) in a wall running along `axis`; a and b are room ids (b = -1 is outside).
     keepClear[]  {x0, z0, x1, z1}: floor that must stay free of furniture: the apron each side of every door and the aisle from the entrance to every door.
     stair        {x0, z0, x1, z1, hole, landing} on storeys that have one: the run (1.0 x 3.6 m) and, upstairs, the hole to guard.
   Coordinates: x along the width, z along the depth, z = 0 is the front wall with the entrance. Rotate the whole plan to the building's footprint with plan.turned and the footprint's own angle. */
(function (root) {
  'use strict';
  var T = 0.18, BAY = 0.5, DOOR = 1.0, STAIRW = 2.5, STAIRBD = 5.0, AG = 0.3;
  var SZ = { bedroom: [2.8, 3.6], bath: [1.8, 2.2], wc: [1.5, 1.8], store: [1.8, 2.5], kitchen: [2.8, 3.6], living: [3.5, 5], living_k: [4, 6], studio: [3.5, 5], office: [2.8, 3.5], exam: [2.8, 3.4], ward: [3.5, 6], classroom: [6, 8], vault: [3, 4],
    cells: [2.5, 3.5], armory: [2.8, 3.5], kitchenC: [3.5, 5], stock: [2.5, 4], breakroom: [2.8, 3.5], bunkroom: [3.5, 5], hroom: [3.2, 3.8], lockers: [2.5, 3], lobby: [4, 6], waiting: [3.5, 5], bullpen: [5, 8], boardroom: [4, 5], openplan: [6, 9],
    cafeteria: [6, 8], vestry: [2.8, 3.5], control: [2.8, 3.5], pumphouse: [3.5, 5], workshop: [3.5, 5], plantroom: [4, 6] };
  var SPEC = {
    house: { mode: 'auto', hub: 'living_k', back: ['bedroom', 'bath', 'bedroom', 'store'], front: ['living', 'kitchen'], cw: 1.0, up: { front: ['bedroom', 'bedroom'], back: ['bath', 'bedroom', 'store'] }, maxL: 2 },
    apartments: { mode: 'spine', front: ['living_k', 'bedroom', 'living_k', 'bedroom'], back: ['bath', 'bedroom', 'studio', 'bedroom'], cw: 1.5, up: { front: ['living_k', 'bedroom', 'living_k', 'bedroom'], back: ['bath', 'bedroom', 'studio', 'bedroom'] }, maxL: 4 },
    grocery: { hub: 'market', back: ['stock', 'wc', 'office'] }, pharmacy: { hub: 'pharmacy', back: ['stock', 'office', 'wc'] }, hardware: { hub: 'hardware', back: ['stock', 'wc', 'office'] },
    restaurant: { hub: 'dining', back: ['kitchenC', 'stock', 'wc'] }, bar: { hub: 'barroom', back: ['stock', 'wc', 'kitchenC'] }, cafe: { hub: 'cafe', back: ['stock', 'wc'] },
    boutique: { hub: 'boutique', back: ['stock', 'wc'] }, electronics: { hub: 'estore', back: ['stock', 'wc'] }, shop: { hub: 'gshop', back: ['stock', 'wc'] }, fuel: { hub: 'cstore', back: ['stock', 'wc'] },
    outdoors: { hub: 'outfitter', back: ['stock', 'wc'] }, deli: { hub: 'deli', back: ['stock', 'wc'] }, jeweller: { hub: 'jeweller', back: ['vault', 'wc'] },
    clinic: { mode: 'spine', front: ['waiting', 'exam', 'exam'], back: ['exam', 'office', 'wc', 'store'], cw: 1.5, up: { front: ['ward', 'ward', 'exam'], back: ['ward', 'office', 'wc'] }, maxL: 3 },
    hospital: { mode: 'spine', front: ['waiting', 'ward', 'ward'], back: ['exam', 'ward', 'office', 'wc'], cw: 2.0, up: { front: ['ward', 'ward', 'ward'], back: ['ward', 'exam', 'office', 'wc'] }, maxL: 3 },
    police: { mode: 'spine', front: ['bullpen', 'office'], back: ['cells', 'armory', 'wc', 'store'], cw: 1.5, up: { front: ['office', 'office'], back: ['store', 'breakroom', 'wc'] }, maxL: 2 },
    fire: { hub: 'firebay', back: ['bunkroom', 'breakroom', 'office', 'wc'], up: { front: ['bunkroom', 'breakroom'], back: ['office', 'wc'] }, maxL: 2 },
    school: { mode: 'spine', front: ['classroom', 'classroom', 'classroom', 'classroom'], back: ['office', 'cafeteria', 'classroom', 'wc'], cw: 2.0, up: { front: ['classroom', 'classroom', 'classroom', 'classroom'], back: ['classroom', 'office', 'classroom', 'wc'] }, maxL: 2 },
    library: { hub: 'libhall', back: ['office', 'store', 'wc'], up: { front: ['libhall'], back: ['office', 'store'] }, maxL: 2 },
    church: { hub: 'nave', back: ['vestry', 'store', 'wc'] }, chapel: { hub: 'chapel_hall', back: ['vestry'] },
    office: { mode: 'spine', front: ['office', 'boardroom', 'office', 'openplan'], back: ['breakroom', 'office', 'wc', 'store'], cw: 1.5, up: { front: ['office', 'openplan', 'office', 'boardroom'], back: ['breakroom', 'office', 'wc', 'office'] }, maxL: 3 },
    bank: { hub: 'bankhall', back: ['vault', 'office', 'wc'], up: { front: ['office', 'office'], back: ['breakroom', 'store'] }, maxL: 2 },
    hotel: { hub: 'lobby', back: ['breakroom', 'office', 'wc'], up: { front: ['hroom', 'hroom', 'hroom', 'hroom', 'hroom', 'hroom'], back: ['hroom', 'hroom', 'bath', 'hroom', 'hroom', 'hroom'] }, maxL: 4 },
    gym: { hub: 'gymfloor', back: ['lockers', 'office', 'wc'] }, venue: { hub: 'hall', back: ['stock', 'breakroom', 'wc'] },
    warehouse: { hub: 'warehouse', back: ['office', 'breakroom', 'wc'] }, factory: { hub: 'factory', back: ['office', 'breakroom', 'workshop', 'wc'] }, garage: { hub: 'workshop', back: ['store', 'office', 'wc'] },
    pumphouse: { hub: 'pumphouse', back: ['control', 'store'] }, substation: { hub: 'substation', back: ['control'] }, boilerhouse: { hub: 'boilerhouse', back: ['control', 'store'] },
    waterworks: { hub: 'plantroom', back: ['control', 'office', 'wc', 'pumphouse'] }
  };
  ['food', 'medical', 'industrial', 'civic'].forEach(function (a) { });
  var ALIAS = { food: 'restaurant', medical: 'clinic', industrial: 'warehouse', civic: 'office', store: 'shop', parking: 'garage', townhall: 'office', post: 'office', utility: 'pumphouse', plant: 'waterworks' };
  var snapUp = function (v) { return Math.ceil(v / BAY - 1e-9) * BAY; }, snap = function (v) { return Math.round(v / BAY) * BAY; };
  function minW(t) { return snapUp((SZ[t] || [2.4, 3.2])[0]); }
  function prefW(t) { return (SZ[t] || [2.4, 3.2])[1]; }
  function rngf(seed) { var s = (seed | 0) || 1; return function () { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) / 4294967296); }; }

  // split [a, b] into rooms, in order, as many of `types` as fit; the room list may be shortened, the span is always filled exactly
  function split(a, b, types, rand) {
    var span = b - a, use = [], tot = 0, i;
    for (i = 0; i < types.length; i++) { var m = minW(types[i]); if (tot + m <= span + 1e-6) { use.push(types[i]); tot += m; } }
    if (!use.length) use = [types[0]];
    var extra = span - tot, pw = use.map(function (t) { return prefW(t) * (0.9 + 0.2 * rand()); }), ps = pw.reduce(function (p, q) { return p + q; }, 0), out = [], x = a;
    for (i = 0; i < use.length; i++) {
      var x1 = i === use.length - 1 ? b : Math.max(x + minW(use[i]), snap(x + minW(use[i]) + extra * pw[i] / ps));
      if (i < use.length - 1) { var left = 0; for (var j = i + 1; j < use.length; j++) left += minW(use[j]); x1 = Math.min(x1, b - left); }
      out.push({ type: use[i], x0: x, x1: x1 }); x = x1;
    }
    return out;
  }

  function levelRects(spec, kind, w, d, level, o) {
    var rects = [], doors = [], rand = o.rand, bd = o.bd, id = 0, hallId, R = function (type, x0, z0, x1, z1, extra) { var r = { id: id++, type: type, x0: x0, z0: z0, x1: x1, z1: z1 }; if (extra) for (var k in extra) r[k] = extra[k]; rects.push(r); return r; };
    var zb = d - bd, dl = function (r, ax, x, z, other) { doors.push({ x: x, z: z, axis: ax, w: DOOR, a: r.id, b: other }); };
    var up = level > 0, mode = up ? 'spine' : o.mode, cw = o.cw, stairs = o.stairs, bx0 = stairs ? STAIRW : 0, hall;
    var types = up ? spec.up : { front: spec.front, back: spec.back };
    var doorX = function (x0, x1, minx) { var lo = Math.max(x0 + 0.5 + 0.25, minx || 0), hi = x1 - 0.75; var c = snap((x0 + x1) / 2); c = Math.max(Math.ceil(lo / BAY - 1e-9) * BAY, Math.min(c, Math.floor(hi / BAY + 1e-9) * BAY)); return c; };
    if (mode === 'hub') {
      var hubD = bd > 0 ? zb : d, hub = R(spec.hub, 0, 0, w, hubD); hallId = hub.id;
      if (bd > 0) {
        if (stairs) { var sw = R('stairs', 0, zb, STAIRW, d, { furnish: false }); dl(sw, 'x', 1.5, zb, hub.id); }
        split(bx0, w, spec.back, rand).forEach(function (s) { var r = R(s.type, s.x0, zb, s.x1, d); dl(r, 'x', doorX(s.x0, s.x1), zb, hub.id); });
      }
      var xe = o.xe; doors.push({ x: xe, z: 0, axis: 'x', w: DOOR, a: hub.id, b: -1 }); return { rects: rects, doors: doors, hub: hub, mode: 'hub', entrance: { x: xe, z: 0 } };
    }
    // spine: front band, corridor, back band; upstairs of a hub building too
    var hz1 = zb, hz0 = zb - cw, frontD = hz0;
    if (frontD < 2.5) { hz0 = 0; frontD = 0; }
    hall = R('hall', 0, hz0, w, hz1, { furnish: false }); hallId = hall.id;
    var entrance = null, xe2 = o.xe;
    if (frontD > 0) {
      var tl = types.front, vx0 = snap(xe2 - 0.75), vx1 = vx0 + 1.5;
      if (level === 0) {
        if (vx0 < 2.5) vx0 = 0; if (w - vx1 < 2.5) vx1 = w;
        if (vx0 > 0 || vx1 < w) R('hall', vx0, 0, vx1, hz0, { furnish: false, merge: hall.id });
        rects[rects.length - 1].id = hall.id; id--;
        var half = Math.ceil(tl.length / 2), L = vx0 > 0 ? split(0, vx0, tl.slice(0, vx1 < w ? half : tl.length), rand) : [], Rr = vx1 < w ? split(vx1, w, tl.slice(vx0 > 0 ? half : 0), rand) : [];
        L.concat(Rr).forEach(function (s) { var r = R(s.type, s.x0, 0, s.x1, hz0); dl(r, 'x', doorX(s.x0, s.x1), hz0, hall.id); });
        entrance = { x: snap((vx0 + vx1) / 2), z: 0 }; doors.push({ x: entrance.x, z: 0, axis: 'x', w: DOOR, a: hall.id, b: -1 });
      } else split(0, w, tl, rand).forEach(function (s) { var r = R(s.type, s.x0, 0, s.x1, hz0); dl(r, 'x', doorX(s.x0, s.x1), hz0, hall.id); });
    } else if (level === 0) { entrance = { x: xe2, z: 0 }; doors.push({ x: xe2, z: 0, axis: 'x', w: DOOR, a: hall.id, b: -1 }); }
    if (stairs) { var sw2 = R('stairs', 0, zb, STAIRW, d, { furnish: false }); dl(sw2, 'x', 1.5, zb, hall.id); }
    split(bx0, w, types.back, rand).forEach(function (s) { var r = R(s.type, s.x0, zb, s.x1, d); dl(r, 'x', doorX(s.x0, s.x1), zb, hall.id); });
    return { rects: rects, doors: doors, mode: 'spine', entrance: entrance };
  }

  function ownerAt(rects, x, z) { for (var i = 0; i < rects.length; i++) { var r = rects[i]; if (x >= r.x0 - 1e-9 && x < r.x1 - 1e-9 && z >= r.z0 - 1e-9 && z < r.z1 - 1e-9) return r.id; } return -1; }
  function buildWalls(rects, doors, w, d) {
    var seg = [], st = 0.25, E = 1e-6;
    rects.forEach(function (r) {
      [['x', r.z0, r.x0, r.x1, -1], ['x', r.z1, r.x0, r.x1, 1], ['z', r.x0, r.z0, r.z1, -1], ['z', r.x1, r.z0, r.z1, 1]].forEach(function (e) {
        var ax = e[0], c = e[1], a0 = e[2], a1 = e[3], sd = e[4], run = null;
        for (var t = a0; t < a1 - E; t += st) {
          var m = t + st / 2, nx = ax === 'x' ? m : c + sd * 0.05, nz = ax === 'x' ? c + sd * 0.05 : m, other = ownerAt(rects, nx, nz);
          var wall = other !== r.id && (other < 0 || other > r.id || true);
          if (wall && other >= 0 && other < r.id) wall = false;   // a shared wall is drawn once, by the room that comes first
          if (wall) { if (!run) run = [t, t + st]; else run[1] = t + st; } else if (run) { seg.push([ax, c, run[0], run[1]]); run = null; }
        }
        if (run) seg.push([ax, c, run[0], run[1]]);
      });
    });
    // cut the door gaps
    var out = [];
    seg.forEach(function (s) {
      var ax = s[0], c = s[1], parts = [[s[2], s[3]]];
      doors.forEach(function (dr) {
        if (dr.axis !== 'x' || ax !== 'x' || Math.abs(dr.z - c) > E) return;
        var g0 = dr.x - DOOR / 2, g1 = dr.x + DOOR / 2, np = [];
        parts.forEach(function (p) { if (g1 <= p[0] + E || g0 >= p[1] - E) np.push(p); else { if (g0 > p[0] + E) np.push([p[0], g0]); if (g1 < p[1] - E) np.push([g1, p[1]]); } }); parts = np;
      });
      parts.forEach(function (p) { out.push(ax === 'x' ? { x0: p[0], z0: c, x1: p[1], z1: c } : { x0: c, z0: p[0], x1: c, z1: p[1] }); });
    });
    // merge touching collinear pieces
    out.sort(function (p, q) { return (p.z0 === p.z1 ? 0 : 1) - (q.z0 === q.z1 ? 0 : 1) || (p.z0 - q.z0) || (p.x0 - q.x0) || (p.z1 - q.z1); });
    var merged = [];
    out.forEach(function (p) { var l = merged[merged.length - 1]; if (l && l.z0 === l.z1 && p.z0 === p.z1 && l.z0 === p.z0 && Math.abs(l.x1 - p.x0) < E) l.x1 = p.x1; else if (l && l.x0 === l.x1 && p.x0 === p.x1 && l.x0 === p.x0 && Math.abs(l.z1 - p.z0) < E) l.z1 = p.z1; else merged.push({ x0: p.x0, z0: p.z0, x1: p.x1, z1: p.z1 }); });
    return merged;
  }
  function clearZones(L, w, d, mode, hubRect) {
    var kc = [];
    L.doors.forEach(function (dr) {
      var hw = DOOR / 2 + 0.1; kc.push({ x0: dr.x - hw, z0: dr.z - 1.1, x1: dr.x + hw, z1: dr.z + 1.1 });
    });
    if (hubRect) {   // the aisle across the back of a hub room and the lane from the entrance to it
      var ent = L.doors.filter(function (q) { return q.b === -1; })[0], hz = hubRect.z1;
      kc.push({ x0: 0.4, z0: hz - 1.2, x1: w - 0.4, z1: hz }); if (ent) kc.push({ x0: ent.x - 0.6, z0: 0, x1: ent.x + 0.6, z1: hz - 1.2 });
    }
    return kc.map(function (k) { return { x0: Math.max(0, k.x0), z0: Math.max(0, k.z0), x1: Math.min(w, k.x1), z1: Math.min(d, k.z1) }; });
  }

  function gen(kind, w, d, opt) {
    opt = opt || {}; kind = ALIAS[kind] || kind; var spec = SPEC[kind] || SPEC.shop, turned = d > w; if (turned) { var tmp = w; w = d; d = tmp; }
    w = Math.floor(w / BAY) * BAY; d = Math.floor(d / BAY) * BAY; var rand = rngf(opt.seed || 1), note = [];
    var mode = spec.mode === 'auto' ? (w * d < 110 ? 'hub' : 'spine') : (spec.mode || 'hub'), area = w * d;
    if (kind === 'house' && area < 42) { spec = Object.assign({}, spec, { hub: 'studio', back: ['bath'] }); }
    if (spec.mode !== 'auto' && spec.mode === 'spine' && d < 8) { mode = 'hub'; spec = Object.assign({}, spec, { hub: spec.front[0], back: spec.back }); note.push('too shallow for a corridor: one big room and rooms behind it'); }
    var want = Math.max(1, Math.min(opt.storeys || 1, spec.maxL || 1)), cw = spec.cw || 1.5;
    var stairs = want > 1;
    var bd = mode === 'hub' ? (d >= 6.5 ? Math.max(3, Math.min(6, snap(d * 0.3))) : 0) : Math.max(3.5, Math.min(6, snap(d * 0.33)));
    if (stairs) { if (d >= STAIRBD + 2.5 + (mode === 'spine' ? cw + 2.5 : 0) - (mode === 'spine' ? 2.5 : 0) && w >= STAIRW + 3) bd = Math.max(bd, STAIRBD); else { stairs = false; want = 1; note.push('too small for a staircase: one storey'); } }
    if (mode === 'spine') { var minD = 2.5 + cw + bd; if (d < minD) { mode = 'hub'; bd = d >= 6.5 ? Math.max(3, Math.min(6, snap(d * 0.3))) : 0; spec = Object.assign({}, spec, { hub: (spec.front || [spec.hub])[0] }); note.push('too shallow for a corridor'); } }
    if (stairs && mode === 'hub' && bd < STAIRBD) bd = STAIRBD;
    if (bd > 0 && d - bd < 3) { bd = Math.max(0, d - 3); if (bd < 3) bd = 0; }
    if (bd === 0 && stairs) { stairs = false; want = 1; note.push('no room for a staircase'); }
    var xe = Math.max(1, Math.min(w - 1, snap(w / 2 + (opt.entrance || 0))));
    var out = { kind: kind, w: w, d: d, turned: turned, t: T, mode: mode, note: note.join('; '), storeys: [], entrance: null }, upper = spec.up || { front: spec.front || [spec.hub], back: spec.back };
    if (!spec.up) spec = Object.assign({}, spec, { up: upper });
    for (var lv = 0; lv < want; lv++) {
      var L = levelRects(spec, kind, w, d, lv, { rand: rand, bd: bd, mode: mode, cw: cw, stairs: stairs, xe: xe });
      var walls = buildWalls(L.rects, L.doors, w, d), kc = clearZones(L, w, d, L.mode, lv === 0 && L.mode === 'hub' ? L.hub : null);
      var lvl = { level: lv, rooms: L.rects.map(function (r) { var q = { id: r.id, type: r.type, x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 }; if (r.furnish === false) q.furnish = false; return q; }), walls: walls, doors: L.doors, keepClear: kc };
      if (stairs) { var zb = d - bd; lvl.stair = { x0: 0.25, z0: zb + 0.2, x1: 1.25, z1: zb + 0.2 + 3.6, hole: lv > 0, landing: { x0: 0.25, z0: zb + 0.2 + 3.6, x1: STAIRW - 0.25, z1: d - 0.1 } }; if (lv < want - 1 || lv > 0) lvl.stair.up = lv < want - 1; }
      if (L.entrance && lv === 0) out.entrance = L.entrance;
      out.storeys.push(lvl);
    }
    return out;
  }

  // ---------- the checker: a 0.6 m wide agent on a 0.1 m grid ----------
  function distSeg(px, pz, s) { var dx = Math.max(s.x0 - px, 0, px - s.x1), dz = Math.max(s.z0 - pz, 0, pz - s.z1); return Math.sqrt(dx * dx + dz * dz); }
  function check(plan) {
    var err = [], R = 0.1, w = plan.w, d = plan.d, nx = Math.round(w / R), nz = Math.round(d / R), need = AG + plan.t / 2;
    plan.storeys.forEach(function (S) {
      var blocked = new Uint8Array(nx * nz), i, j, k;
      var near = function (px, pz) { for (var q = 0; q < S.walls.length; q++) if (distSeg(px, pz, S.walls[q]) < need - 1e-9) return true; return false; };
      // wall distance by rasterising each wall once
      S.walls.forEach(function (s) {
        var i0 = Math.max(0, Math.floor((s.x0 - need) / R)), i1 = Math.min(nx - 1, Math.ceil((s.x1 + need) / R)), j0 = Math.max(0, Math.floor((s.z0 - need) / R)), j1 = Math.min(nz - 1, Math.ceil((s.z1 + need) / R));
        for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) if (distSeg((i + 0.5) * R, (j + 0.5) * R, s) < need - 1e-9) blocked[j * nx + i] = 1;
      });
      if (S.stair && S.stair.hole) { var h = S.stair; for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) { var px = (i + 0.5) * R, pz = (j + 0.5) * R; if (px > h.x0 - AG && px < h.x1 + AG && pz > h.z0 - AG && pz < h.z1 + AG) blocked[j * nx + i] = 1; } }
      for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) { var qx = (i + 0.5) * R, qz = (j + 0.5) * R; if (qx < AG + 1e-9 || qz < AG + 1e-9 || qx > w - AG - 1e-9 || qz > d - AG - 1e-9) blocked[j * nx + i] = 1; }
      // start
      var starts = [];
      if (S.level === 0) { var en = S.doors.filter(function (q) { return q.b === -1; }); if (!en.length) err.push('level 0 has no entrance'); en.forEach(function (q) { starts.push([Math.floor(q.x / R), Math.floor(0.45 / R)]); }); }
      else if (S.stair) starts.push([Math.floor(1.8 / R), Math.floor((S.stair.landing.z0 + 0.4) / R)]);
      var seen = new Uint8Array(nx * nz), qu = [];
      var entranceDoorCells = [];
      starts.forEach(function (s) { var idx = s[1] * nx + s[0]; if (blocked[idx]) { /* nudge inwards */ var f = false; for (var dz = 0; dz < 8 && !f; dz++) for (var dx = -3; dx <= 3 && !f; dx++) { var ii = s[0] + dx, jj = s[1] + dz; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && !blocked[jj * nx + ii]) { s = [ii, jj]; f = true; } } if (!f) { err.push('level ' + S.level + ': the start is walled in'); return; } } qu.push(s[1] * nx + s[0]); seen[s[1] * nx + s[0]] = 1; });
      if (S.level === 0 && S.stair) { /* the stair run is passable at ground level */ }
      for (var qi = 0; qi < qu.length; qi++) { var c = qu[qi], cx = c % nx, cz = (c / nx) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { var ax = cx + dd[0], az = cz + dd[1]; if (ax < 0 || az < 0 || ax >= nx || az >= nz) return; var a = az * nx + ax; if (blocked[a] || seen[a]) return; seen[a] = 1; qu.push(a); }); }
      S.rooms.forEach(function (r) {
        var hit = false;
        for (j = Math.floor(r.z0 / R); j < Math.ceil(r.z1 / R) && !hit; j++) for (i = Math.floor(r.x0 / R); i < Math.ceil(r.x1 / R) && !hit; i++) if (seen[j * nx + i]) hit = true;
        if (!hit) err.push('level ' + S.level + ': room ' + r.id + ' (' + r.type + ') cannot be reached');
      });
      // structural checks
      var area = 0; S.rooms.forEach(function (r) { area += (r.x1 - r.x0) * (r.z1 - r.z0); if (r.type !== 'hall' && (r.x1 - r.x0 < 1.5 - 1e-9 || r.z1 - r.z0 < 1.5 - 1e-9) || r.type === 'hall' && Math.min(r.x1 - r.x0, r.z1 - r.z0) < 1.0 - 1e-9) err.push('level ' + S.level + ': room ' + r.id + ' is too thin'); });
      if (Math.abs(area - w * d) > 0.01) err.push('level ' + S.level + ': rooms do not tile the footprint (' + area + ' of ' + w * d + ')');
      S.doors.forEach(function (dr) { S.keepClear.forEach(function (k) { /* aprons may cross walls only at doors */ }); if (dr.x - DOOR / 2 < -1e-9 || dr.x + DOOR / 2 > w + 1e-9) err.push('level ' + S.level + ': a door sticks out of the building'); });
      S.keepClear.forEach(function (k) { S.walls.forEach(function (s) { /* an apron is clear of walls except along its own door line */ }); });
    });
    return { ok: err.length === 0, errors: err };
  }
  function ascii(plan, level) {
    var S = plan.storeys[level || 0], R = 0.5, nx = Math.round(plan.w / R) + 1, nz = Math.round(plan.d / R) + 1, g = [], i, j, L = { hall: '.', stairs: '=', bedroom: 'b', bath: 't', wc: 'w', store: 's', kitchen: 'k', living: 'L', living_k: 'L', studio: 'S', office: 'o', market: 'M', nave: 'N', warehouse: 'W' };
    for (j = 0; j < nz; j++) { g.push([]); for (i = 0; i < nx; i++) { var r = S.rooms.filter(function (q) { return i * R >= q.x0 && i * R < q.x1 && j * R >= q.z0 && j * R < q.z1; })[0]; g[j].push(r ? (L[r.type] || r.type[0]) : ' '); } }
    S.walls.forEach(function (s) { for (var z = s.z0; z <= s.z1 + 1e-9; z += R) for (var x = s.x0; x <= s.x1 + 1e-9; x += R) { var a = Math.round(x / R), b = Math.round(z / R); if (g[b] && g[b][a] !== undefined) g[b][a] = '#'; } });
    S.doors.forEach(function (dr) { var a = Math.round(dr.x / R), b = Math.round(dr.z / R); if (g[b] && g[b][a] !== undefined) g[b][a] = '+'; });
    return g.map(function (r) { return r.join(''); }).join('\n');
  }
  var API = { gen: gen, check: check, ascii: ascii, kinds: Object.keys(SPEC).concat(Object.keys(ALIAS)), SPEC: SPEC, constants: { wall: T, door: DOOR, bay: BAY, stairWell: [STAIRW, STAIRBD], agent: AG } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.FLOORPLAN = API;
})(typeof window !== 'undefined' ? window : this);
