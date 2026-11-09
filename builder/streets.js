/* Street dressing (builder 1.24.0): the bands across a street and what stands in them.
   OpenStreetMap gives the road line and class but almost never the kerb, the verge, the pavement, the trees, poles, lamps or mailboxes. This pass reads
   each road's surroundings (how close and how many buildings), calls it a main street, a town street, a suburb street or a rural road, writes the bands onto
   the road as tags the game can draw, and sets the street furniture in its band. Real data wins: nothing is added within a few metres of a mapped tree,
   pole, lamp, bench, bin or mailbox, and nothing is put inside a building or on another road. Everything is seeded by position, so a map builds the same
   way every time. Rules from docs/VISUAL_REFERENCE.md "Third look", sections 1 and 2 of the main chat's request. */
window.BLIB = window.BLIB || {};
window.BLIB.streets = function(L){
  var h3 = L.h3;
  var HALF = {primary:6.5, secondary:5, tertiary:4.2, residential:3.3, unclassified:3, living_street:2.6};   /* half the carriageway, metres */
  /* the cross-section by class: kerb yes/no, verge, pavement and gravel shoulder widths in metres (main chat request, table in section 1) */
  var BAND = {main:{k:1, v:0, w:4, s:0}, town:{k:1, v:1.5, w:1.75, s:0}, suburb:{k:1, v:2.5, w:1.35, s:0}, rural:{k:0, v:4, w:0, s:1.2}};
  var CAP = {tree:150000, other:120000};
  var T_TREE = {natural:'tree', generated:'yes', 'asmb:made':'yes', 'asmb:band':'verge'};   /* one shared object for all street trees */

  L.streets = function(F, loc){
    var out = {trees:0, poles:0, lamps:0, benches:0, bins:0, meters:0, mailboxes:0, roads:{main:0, town:0, suburb:0, rural:0}, km:{main:0, town:0, suburb:0, rural:0}};
    /* ---- what is already there ---- */
    var CELL = 40, QID = 0, r0cap = 120, grid = new Map(), keyOf = function(x, y){ return Math.floor(x/CELL) + ',' + Math.floor(y/CELL); };
    var bl = [], have = new Map();   /* buildings; existing street furniture by kind */
    var place = function(m, x, y, item){ var k = keyOf(x, y), l = m.get(k); if (!l) m.set(k, l = []); l.push(item); };
    F.ways.forEach(function(w){
      if (!w.poly || !w.t.building) return; var t = w.t, m = new Array(w.c.length), i;
      for (i = 0; i < w.c.length; i += 2){ var p = loc.m(w.c[i], w.c[i + 1]); m[i] = p[0]; m[i + 1] = p[1]; }
      var x = 0, y = 0, n = 0; for (i = 0; i + 2 < m.length; i += 2){ x += m[i]; y += m[i + 1]; n++; } if (!n) return; x /= n; y /= n;
      var ar = Math.abs(L.area(m)), b = {x:x, y:y, r:Math.sqrt(ar)/2, a:ar, comm:!!(t.shop || t.office || t.building === 'retail' || t.building === 'commercial' || t.building === 'office' || t.amenity),
        house:!t.shop && !t.amenity && !t.office && ar >= 45 && ar <= 450 && (t.building === 'house' || t.building === 'detached' || t.building === 'residential' || t.building === 'semidetached_house' || t.building === 'yes' || t.building === 'bungalow')};
      bl.push(b); b.q = 0; var rr2 = Math.min(r0cap, b.r); for (var gx2 = Math.floor((x - rr2)/CELL); gx2 <= Math.floor((x + rr2)/CELL); gx2++) for (var gy2 = Math.floor((y - rr2)/CELL); gy2 <= Math.floor((y + rr2)/CELL); gy2++){ var kk2 = gx2 + ',' + gy2, ll2 = grid.get(kk2); if (!ll2) grid.set(kk2, ll2 = []); ll2.push(b); }
    });
    var KIND = function(t){ return t.natural === 'tree' ? 'tree' : t.highway === 'street_lamp' ? 'lamp' : t.power === 'pole' ? 'pole' : t.amenity === 'bench' ? 'bench' : t.amenity === 'waste_basket' ? 'bin' : t.amenity === 'letter_box' ? 'mail' : t['asmb:prop'] && /mailbox/.test(t['asmb:prop']) ? 'mail' : null; };
    F.pois.forEach(function(p){ var k = p.t && KIND(p.t); if (k){ var q = loc.m(p.lon, p.lat); place(have, q[0], q[1], {x:q[0], y:q[1], k:k}); } });
    var near = function(x, y, kind, r){ var gx = Math.floor(x/CELL), gy = Math.floor(y/CELL), i, j, k, l; for (i = gx - 1; i <= gx + 1; i++) for (j = gy - 1; j <= gy + 1; j++){ l = have.get(i + ',' + j); if (l) for (k = 0; k < l.length; k++) if (l[k].k === kind && Math.hypot(l[k].x - x, l[k].y - y) < r) return true; } return false; };
    var reg = function(kind, x, y){ place(have, x, y, {x:x, y:y, k:kind}); };
    var inBuilding = function(x, y){ var gx = Math.floor(x/CELL), gy = Math.floor(y/CELL), i, j, k, l; for (i = gx - 1; i <= gx + 1; i++) for (j = gy - 1; j <= gy + 1; j++){ l = grid.get(i + ',' + j); if (l) for (k = 0; k < l.length; k++) if (Math.hypot(l[k].x - x, l[k].y - y) < l[k].r*0.9 + 0.5) return true; } return false; };
    /* ---- the roads, and an index of their pieces so an item is never put on another road ---- */
    var roads = [], segs = [];
    F.ways.forEach(function(w, wi){
      var t = w.t, hw = t.highway; if (w.poly || !hw) return;
      if (HALF[hw] && !t.bridge && !t.tunnel && !t.covered && !(+t.layer < 0)){ var m = []; for (var i = 0; i < w.c.length; i += 2){ var p = loc.m(w.c[i], w.c[i + 1]); m.push(p[0], p[1]); } roads.push({w:w, hw:hw, pts:m, half:HALF[hw], wi:wi}); }
      var pts = []; for (var j = 0; j < w.c.length; j += 2){ var q = loc.m(w.c[j], w.c[j + 1]); pts.push(q[0], q[1]); }
      var hh = HALF[hw] || (hw === 'motorway' ? 11 : hw === 'trunk' ? 8 : hw === 'service' ? 2.5 : hw === 'track' ? 1.8 : hw === 'path' || hw === 'footway' || hw === 'cycleway' || hw === 'steps' ? 0.8 : 0); if (!hh) return;
      for (var s = 0; s + 3 < pts.length; s += 2) segs.push([pts[s], pts[s + 1], pts[s + 2], pts[s + 3], hh, wi]);
    });
    var sIdx = L.spatial(segs.length || 1); segs.forEach(function(s){ sIdx.add(Math.min(s[0], s[2]), Math.min(s[1], s[3]), Math.max(s[0], s[2]), Math.max(s[1], s[3])); }); if (!segs.length) sIdx.add(-1e9, -1e9, -1e9, -1e9); sIdx.finish();
    var onOther = function(x, y, wi, pad){ var l = sIdx.search(x - 14, y - 14, x + 14, y + 14), i; for (i = 0; i < l.length; i++){ var s = segs[l[i]]; if (s[5] !== wi && L.segDist(x, y, s[0], s[1], s[2], s[3]) < s[4] + pad) return true; } return false; };
    /* ---- what kind of street is this point on ---- */
    var COV = 9*CELL*CELL;
    var coverAt = function(x, y){ var gx = Math.floor(x/CELL), gy = Math.floor(y/CELL), a = 0, i, j, k, l, q = ++QID; for (i = gx - 1; i <= gx + 1; i++) for (j = gy - 1; j <= gy + 1; j++){ l = grid.get(i + ',' + j); if (l) for (k = 0; k < l.length; k++) if (l[k].q !== q){ l[k].q = q; a += l[k].a; } } return Math.min(1, a/COV); };   /* the share of the ground within 60 m that is built on */
    var classAt = function(x, y, half, hw){
      var gx = Math.floor(x/CELL), gy = Math.floor(y/CELL), i, j, k, l, n = 0, d1 = 1e9, comm = 0, cov = coverAt(x, y), q = ++QID;
      for (i = gx - 1; i <= gx + 1; i++) for (j = gy - 1; j <= gy + 1; j++){ l = grid.get(i + ',' + j); if (!l) continue;
        for (k = 0; k < l.length; k++){ if (l[k].q === q) continue; l[k].q = q; var d = Math.hypot(l[k].x - x, l[k].y - y), f = d - l[k].r; if (f < 40){ n++; if (l[k].comm) comm++; if (f < d1) d1 = f; } } }
      if (!n) return 'rural';
      var art = hw === 'primary' || hw === 'secondary' || hw === 'tertiary';
      if (cov >= 0.3 && d1 < half + 8 && (comm >= n*0.4 || art)) return 'main';
      if (cov >= 0.12 && d1 < half + 7.5) return 'town';
      if (cov >= 0.05) return 'suburb';
      return 'rural';
    };
    var spacing = function(base, jit, x, y, k){ return base + (h3(Math.round(x), Math.round(y), k, 61) - 0.5)*2*jit; };
    var llOf = function(x, y){ var p = loc.ll(x, y); return [Math.round(p[0]*1e6)/1e6, Math.round(p[1]*1e6)/1e6]; };
    var plain = {}, push = function(x, y, tags){ var p = llOf(x, y); F.pois.push({lon:p[0], lat:p[1], t:tags}); };
    var prop = function(kind, piece, x, y, yaw, extra){ var t = {'asmb:prop':piece, 'asmb:ry':String(((Math.round(yaw/90) % 4) + 4) % 4), 'asmb:yaw':String(((Math.round(yaw) % 360) + 360) % 360), 'asmb:made':'yes', generated:'yes', 'asmb:band':kind.band}; if (extra) for (var k in extra) t[k] = extra[k]; push(x, y, t); };
    var other = 0;
    roads.forEach(function(rd, ri){
      var pts = rd.pts, half = rd.half, w = rd.w, t = w.t, STEP = 6, acc = 0, i, tot = 0;
      var side = h3(ri, 7, 11, 62) < 0.5 ? 1 : -1;   /* the side the poles stand on along this road */
      var N = {tree:[ -1e9, -1e9 ], lamp:[ -1e9, -1e9 ], bench:[ -1e9, -1e9 ], meter:[ -1e9, -1e9 ], pole:-1e9};
      var tally = {main:0, town:0, suburb:0, rural:0}, lastPole = null, lastPoleS = -1e9, s0 = 0;
      for (i = 0; i + 3 < pts.length; i += 2){
        var ax = pts[i], ay = pts[i + 1], bx = pts[i + 2], by = pts[i + 3], Lg = Math.hypot(bx - ax, by - ay); if (Lg < 0.5) continue;
        var ux = (bx - ax)/Lg, uy = (by - ay)/Lg, nx = -uy, ny = ux;   /* nx, ny: to the left of the way */
        for (var d = (STEP - acc) % STEP; d < Lg; d += STEP){
          var x = ax + ux*d, y = ay + uy*d, s = tot + d, cls = classAt(x, y, half, rd.hw), B = BAND[cls]; tally[cls] += STEP;
          var sw = t.sidewalk, noWalk = sw === 'no' || sw === 'none', walk = noWalk ? 0 : (cls === 'rural' && (sw === 'both' || sw === 'left' || sw === 'right' || sw === 'yes') ? 1.5 : B.w);
          var e0 = half + (B.k ? 0.25 : B.s), yaw0 = (Math.atan2(ux, uy)*180/Math.PI + 360) % 360;
          for (var sd = 0; sd < 2; sd++){
            var sg = sd ? -1 : 1, px = function(off){ return x + nx*sg*off; }, py = function(off){ return y + ny*sg*off; };
            var face = (Math.atan2(-nx*sg, -ny*sg)*180/Math.PI + 360) % 360;   /* looks towards the road; degrees as atan2(east, south) of the way it faces */
            /* street trees in the verge (on a main street, in pits on the pavement) */
            if (out.trees < CAP.tree && cls !== 'rural' && s >= N.tree[sd]){
              var off = cls === 'main' ? e0 + 1.0 : e0 + B.v*0.5, tx = px(off), ty = py(off);
              N.tree[sd] = s + spacing(cls === 'town' ? 26 : cls === 'suburb' ? 30 : 34, 5, x, y, 1 + sd);
              if (!(cls === 'main' && walk < 3) && !inBuilding(tx, ty) && !onOther(tx, ty, rd.wi, 2.5) && !near(tx, ty, 'tree', 7) && h3(Math.round(tx), Math.round(ty), 3, 63) < 0.85){ push(tx, ty, T_TREE); reg('tree', tx, ty); out.trees++; }
            }
            /* lamps: main and town both sides, suburb one side, none on a rural road */
            if (other < CAP.other && (cls === 'main' || cls === 'town' || (cls === 'suburb' && sg === side)) && s >= N.lamp[sd]){
              var lo = cls === 'main' ? e0 + 0.5 : e0 + B.v + 0.3, lx = px(lo), ly = py(lo); N.lamp[sd] = s + spacing(cls === 'suburb' ? 46 : cls === 'town' ? 34 : 30, 4, x, y, 3 + sd) + (sd ? 15 : 0);
              if (!inBuilding(lx, ly) && !onOther(lx, ly, rd.wi, 2) && !near(lx, ly, 'lamp', 12)){ prop({band:'verge'}, 'street.street_lamp', lx, ly, face); reg('lamp', lx, ly); out.lamps++; other++; }
            }
            /* benches, bins and meters on a main street's pavement */
            if (other < CAP.other && cls === 'main' && walk >= 3){
              if (s >= N.bench[sd]){ var bo = e0 + walk*0.55, bx2 = px(bo), by2 = py(bo); N.bench[sd] = s + spacing(55, 15, x, y, 5 + sd) + (sd ? 25 : 0);
                if (!inBuilding(bx2, by2) && !onOther(bx2, by2, rd.wi, 2) && !near(bx2, by2, 'bench', 12)){ prop({band:'pavement'}, 'street.bench', bx2, by2, face); reg('bench', bx2, by2); out.benches++; other++;
                  var tx2 = bx2 + ux*1.6, ty2 = by2 + uy*1.6; if (!near(tx2, ty2, 'bin', 6)){ prop({band:'pavement'}, 'street.trash_bin', tx2, ty2, face); out.bins++; other++; } } }
              if (sg === side && s >= N.meter[sd] && (rd.hw === 'primary' || rd.hw === 'secondary' || rd.hw === 'tertiary')){ var mo = e0 + 0.5, mx = px(mo), my = py(mo); N.meter[sd] = s + spacing(20, 3, x, y, 7);
                if (!inBuilding(mx, my) && !onOther(mx, my, rd.wi, 2)){ prop({band:'pavement'}, 'street.parking_meter', mx, my, face); out.meters++; other++; } }
            }
          }
          /* power poles: one side, every 35 to 45 m, wires between them; none on the dense city main streets (cables are underground there) */
          var dense = cls === 'main' && coverAt(x, y) >= 0.45;
          if (other < CAP.other && !dense && rd.hw !== 'living_street' && s >= N.pole){
            var po = e0 + (B.v > 0 ? B.v*0.85 : 1.0), qx = x + nx*side*po, qy = y + ny*side*po; N.pole = s + spacing(40, 5, x, y, 9);
            if (!inBuilding(qx, qy) && !onOther(qx, qy, rd.wi, 2) && !near(qx, qy, 'pole', 24)){
              var ll = llOf(qx, qy), pt = {'asmb:prop':'street.power_pole', 'asmb:ry':'0', 'asmb:yaw':String(Math.round(yaw0) % 360), 'asmb:made':'yes', generated:'yes', 'asmb:band':'verge', power:'pole'};
              if (lastPole && s - lastPoleS < 60){ lastPole.t['asmb:wire'] = ll[0] + ',' + ll[1]; }
              F.pois.push({lon:ll[0], lat:ll[1], t:pt}); reg('pole', qx, qy); lastPole = F.pois[F.pois.length - 1]; lastPoleS = s; out.poles++; other++;
            }
          }
        }
        acc = (acc + Lg) % STEP; tot += Lg;
      }
      /* the way's own class is the one it spends the most length in; the bands go on the road for the game to draw */
      var best = 'rural', bv = -1, k2; for (k2 in tally) if (tally[k2] > bv){ bv = tally[k2]; best = k2; }
      var BB = BAND[best], sw2 = t.sidewalk, nw = sw2 === 'no' || sw2 === 'none';
      t['asmb:street'] = best; t['asmb:kerb'] = BB.k ? 'yes' : 'no'; t['asmb:verge'] = String(BB.v); t['asmb:walk'] = String(nw ? 0 : (best === 'rural' && (sw2 === 'both' || sw2 === 'left' || sw2 === 'right' || sw2 === 'yes') ? 1.5 : BB.w));
      if (BB.s) t['asmb:shoulder'] = String(BB.s);
      out.roads[best]++; out.km[best] += tot/1000;
    });
    /* ---- mailboxes at the verge edge in front of houses, on suburb and town streets ---- */
    bl.forEach(function(b){
      if (!b.house || other >= CAP.other || h3(Math.round(b.x), Math.round(b.y), 4, 64) > 0.8) return;
      var l = sIdx.search(b.x - 34, b.y - 34, b.x + 34, b.y + 34), best = null, bd = 1e9, i;
      for (i = 0; i < l.length; i++){ var s = segs[l[i]]; if (s[4] > 7 || s[4] < 2.6) continue; var dd = L.segDist(b.x, b.y, s[0], s[1], s[2], s[3]); if (dd < bd){ bd = dd; best = s; } }
      if (!best || bd > 30) return;
      var sx = best[2] - best[0], sy = best[3] - best[1], sl = Math.hypot(sx, sy) || 1, tx = sx/sl, ty = sy/sl, tt = Math.max(0, Math.min(1, ((b.x - best[0])*sx + (b.y - best[1])*sy)/(sl*sl))), cx = best[0] + sx*tt, cy = best[1] + sy*tt;
      var dx = b.x - cx, dy = b.y - cy, dl = Math.hypot(dx, dy) || 1, ox = dx/dl, oy = dy/dl;   /* from the road towards the house */
      var cls = classAt(cx, cy, best[4], 'residential'); if (cls !== 'suburb' && cls !== 'town') return; var B = BAND[cls];
      var off = best[4] + 0.25 + B.v*0.9 + 0.3, mx = cx + ox*off + tx*3.2, my = cy + oy*off + ty*3.2;
      if (inBuilding(mx, my) || onOther(mx, my, -1, 1.5) || near(mx, my, 'mail', 14)) return;
      prop({band:'verge'}, 'street.mailbox', mx, my, (Math.atan2(-ox, -oy)*180/Math.PI + 360) % 360); place(have, mx, my, {x:mx, y:my, k:'mail'}); out.mailboxes++; other++;
    });
    return out;
  };
};
