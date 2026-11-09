/* AfterStreet Maps Builder: lot fill and roof units (builder 1.25.0).
   Real houses and made-up homes get what the map never says: a driveway, side and back fences or hedges, one or two back-yard things;
   flat roofs get roof units, pitched roofs now and then a chimney or a dish. Everything is seeded by position, marked generated=yes and
   asmb:made=yes, and real mapped fences, hedges and driveways win. From the main chat's layout request, steps 3 and 6 (docs/MAP_LAYOUT_REPLY.md). */
(function(){
  window.BLIB = window.BLIB || {};
  window.BLIB.lots = function(L){
    var h3 = L.h3;
    var HALF = {primary:6.5, secondary:5, tertiary:4.2, residential:3.3, unclassified:3, living_street:2.6, service:2};
    var RANK = {living_street:0, residential:1, unclassified:2, service:3, tertiary:4, secondary:5, primary:6};
    var FLAT = {retail:1, commercial:1, office:1, industrial:1, warehouse:1, apartments:1, hotel:1, hospital:1, school:1, supermarket:1, civic:1, public:1, university:1, church:0};
    var T = {
      wood:{barrier:'fence', fence_type:'wood', height:'1.8', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      chain:{barrier:'fence', fence_type:'chain_link', height:'1.5', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      hedge:{barrier:'hedge', height:'1.5', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      pick:{barrier:'fence', fence_type:'picket', height:'1.0', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      drive:{highway:'service', service:'driveway', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      shed:{building:'shed', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      pool:{leisure:'swimming_pool', access:'private', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'}
    };
    var round6 = function(v){ return Math.round(v*1e6)/1e6; };

    L.lots = function(F, loc){
      var out = {shops:0, parking:0, kerbCuts:0, signs:0, dumpsters:0, serviceFences:0, houses:0, drives:0, fences:0, fenceKm:0, sheds:0, pools:0, yardItems:0, roofUnits:0, chimneys:0, dishes:0};
      var CELL = 40, bl = [], bgrid = new Map(), segs = [], drv = new Map(), pk = new Map(), fg = new Map(), existing = new Map();
      var key = function(x, y, c){ return Math.floor(x/c) + ',' + Math.floor(y/c); };
      var put = function(m, x, y, c, v){ var k = key(x, y, c), l = m.get(k); if (!l) m.set(k, l = []); l.push(v); };
      var each = function(m, x, y, c, r, fn){ var gx = Math.floor(x/c), gy = Math.floor(y/c), n = Math.ceil(r/c), i, j, l, k; for (i = gx - n; i <= gx + n; i++) for (j = gy - n; j <= gy + n; j++){ l = m.get(i + ',' + j); if (l) for (k = 0; k < l.length; k++) if (fn(l[k])) return true; } return false; };
      var ll = function(x, y){ var p = loc.ll(x, y); return [round6(p[0]), round6(p[1])]; };

      /* ---- buildings: oriented boxes, and the roads ---- */
      F.ways.forEach(function(w, wi){
        var t = w.t;
        if (w.poly && t.amenity === 'parking'){ var pxs = 0, pys = 0, pn = 0; for (var pi = 0; pi + 1 < w.c.length; pi += 2){ var pp = loc.m(w.c[pi], w.c[pi + 1]); pxs += pp[0]; pys += pp[1]; pn++; } if (pn) put(pk, pxs/pn, pys/pn, CELL, 1); return; }
        if (w.poly && t.building){
          var m = new Array(w.c.length), i;
          for (i = 0; i < w.c.length; i += 2){ var p = loc.m(w.c[i], w.c[i + 1]); m[i] = p[0]; m[i + 1] = p[1]; }
          var n = 0, cx = 0, cy = 0; for (i = 0; i + 2 < m.length; i += 2){ cx += m[i]; cy += m[i + 1]; n++; } if (n < 3) return; cx /= n; cy /= n;
          var best = 0, ux = 1, uy = 0; for (i = 0; i + 3 < m.length; i += 2){ var dx = m[i + 2] - m[i], dy = m[i + 3] - m[i + 1], d = dx*dx + dy*dy; if (d > best){ best = d; ux = dx; uy = dy; } }
          var ln = Math.hypot(ux, uy) || 1; ux /= ln; uy /= ln;
          var u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
          for (i = 0; i + 1 < m.length; i += 2){ var a = (m[i] - cx)*ux + (m[i + 1] - cy)*uy, b = -(m[i] - cx)*uy + (m[i + 1] - cy)*ux; if (a < u0) u0 = a; if (a > u1) u1 = a; if (b < v0) v0 = b; if (b > v1) v1 = b; }
          var o = {x:cx + ux*(u0 + u1)/2 - uy*(v0 + v1)/2, y:cy + uy*(u0 + u1)/2 + ux*(v0 + v1)/2, ux:ux, uy:uy, hu:(u1 - u0)/2, hv:(v1 - v0)/2, a:Math.abs(L.area(m)), t:t, m:m, id:bl.length};
          o.r = Math.hypot(o.hu, o.hv); bl.push(o); put(bgrid, o.x, o.y, CELL, o);
          return;
        }
        if (w.poly) return;
        var hw = t.highway; if (!hw) return;
        var pts = []; for (var j = 0; j < w.c.length; j += 2){ var q = loc.m(w.c[j], w.c[j + 1]); pts.push(q[0], q[1]); }
        if (hw === 'service' && t.service === 'driveway' && t['asmb:lot'] !== 'yes'){ for (var e = 0; e < pts.length; e += 2) put(existing, pts[e], pts[e + 1], 20, 1); }
        if (!HALF[hw] || t.bridge || t.tunnel) return;
        for (var s = 0; s + 3 < pts.length; s += 2) segs.push([pts[s], pts[s + 1], pts[s + 2], pts[s + 3], HALF[hw], hw, t['asmb:street']]);
      });
      var sIdx = L.spatial(segs.length || 1); segs.forEach(function(s){ sIdx.add(Math.min(s[0], s[2]), Math.min(s[1], s[3]), Math.max(s[0], s[2]), Math.max(s[1], s[3])); }); if (!segs.length) sIdx.add(-1e9, -1e9, -1e9, -1e9); sIdx.finish();
      var nearRoad = function(x, y, rad){ var l = sIdx.search(x - rad, y - rad, x + rad, y + rad), res = []; for (var i = 0; i < l.length; i++){ var s = segs[l[i]]; if (!s) continue; var d = L.segDist(x, y, s[0], s[1], s[2], s[3]); if (d < rad) res.push({d:d, s:s}); } return res; };
      var inBox = function(o, x, y, mg){ var dx = x - o.x, dy = y - o.y; return Math.abs(dx*o.ux + dy*o.uy) < o.hu + mg && Math.abs(-dx*o.uy + dy*o.ux) < o.hv + mg; };
      var inAny = function(x, y, mg, skip){ return each(bgrid, x, y, CELL, 40, function(o){ return o !== skip && Math.hypot(o.x - x, o.y - y) < o.r + mg + 1 && inBox(o, x, y, mg); }); };
      var clearOfRoads = function(x, y, mg){ var r = nearRoad(x, y, 12); for (var i = 0; i < r.length; i++) if (r[i].d < r[i].s[4] + mg) return false; return true; };
      var wayOut = function(tags, pts, poly){ var c = []; for (var i = 0; i < pts.length; i += 2){ var p = ll(pts[i], pts[i + 1]); c.push(p[0], p[1]); } F.ways.push({t:tags, c:c, poly:!!poly, src:'gen'}); };
      var prop = function(piece, x, y, yaw, band, z){ var p = ll(x, y), tg = {'asmb:prop':piece, 'asmb:ry':String(((Math.round(yaw/90) % 4) + 4) % 4), 'asmb:yaw':String(Math.round(yaw)), generated:'yes', 'asmb:made':'yes', 'asmb:band':band}; if (z) tg['asmb:z'] = String(Math.round(z*10)/10); F.pois.push({lon:p[0], lat:p[1], t:tg}); };
      /* facing direction (fx, fy) as the yaw used by the props: atan2(east, south) in the game's metre space, where y grows south */
      var yawOf = function(fx, fy){ return Math.atan2(fx, fy)*180/Math.PI; };
      var heightOf = function(t){ var h = parseFloat(t.height); if (h > 0) return h; var lv = parseInt(t['building:levels'], 10); return (lv > 0 ? lv : 1)*3.2; };

      var CAP = 90000, nH = 0, nCom = 0;
      bl.forEach(function(b){
        var t = b.t, ar = b.a, seedA = Math.round(b.x), seedB = Math.round(b.y);
        var comm = !!(t.shop || t.office || t.amenity || FLAT[t.building]);
        var house = !comm && ar >= 45 && ar <= 450 && (t.building === 'house' || t.building === 'detached' || t.building === 'residential' || t.building === 'semidetached_house' || t.building === 'yes' || t.building === 'bungalow');
        var h = heightOf(t);
        /* ---- roofs ---- */
        var flat = t['roof:shape'] === 'flat' || (comm && !t['roof:shape']) || (!house && FLAT[t.building] === 1 && !t['roof:shape']);
        if (flat && ar >= 80 && ar < 20000 && t.building !== 'shed'){
          var nU = Math.max(1, Math.min(8, Math.round(ar/140))), tries = 0, placed = 0;
          var kinds = ['street.ac_unit', 'street.ac_unit', 'street.ac_unit', 'street.roof_hatch', 'street.satellite_dish', 'street.water_tank'];
          while (placed < nU && tries++ < nU*4){
            var a = (h3(seedA, seedB, tries, 71) - 0.5)*(b.hu*2 - 3), c = (h3(seedA, seedB, tries, 72) - 0.5)*(b.hv*2 - 3);
            var px = b.x + b.ux*a - b.uy*c, py = b.y + b.uy*a + b.ux*c;
            if (!L.pip(b.m, px, py)) continue;
            var kd = kinds[Math.floor(h3(seedA, seedB, tries, 73)*kinds.length)];
            if (kd === 'street.water_tank' && (h < 9 || placed > 0 || h3(seedA, seedB, 74) > 0.35)) kd = 'street.ac_unit';
            prop(kd, px, py, Math.round(h3(seedA, seedB, tries, 75)*4)*90, 'roof', h); placed++; out.roofUnits++;
          }
        } else if (house){
          if (h3(seedA, seedB, 76) < 0.22){ var a2 = (h3(seedA, seedB, 77) - 0.5)*b.hu*0.8, px2 = b.x + b.ux*a2, py2 = b.y + b.uy*a2; prop('street.chimney', px2, py2, 0, 'roof', h + 1); out.chimneys++; }
          else if (h3(seedA, seedB, 78) < 0.12){ prop('street.satellite_dish', b.x + b.ux*b.hu*0.4, b.y + b.uy*b.hu*0.4, Math.round(h3(seedA, seedB, 79)*360), 'roof', h + 0.6); out.dishes++; }
        }
        /* ---- shops, fuel, food and motels on a lot: parking between the building and the road, two kerb cuts, a sign, a service side ---- */
        var SKIP = {parking:1, school:1, university:1, hospital:1, place_of_worship:1, college:1, kindergarten:1, townhall:1, police:1, fire_station:1, library:1, grave_yard:1};
        var shopLike = (t.shop || t.amenity || t.tourism === 'motel' || t.tourism === 'hotel' || t.building === 'retail' || t.building === 'commercial' || t.building === 'supermarket') && !SKIP[t.amenity] && t.building !== 'shed';
        if (shopLike && ar >= 120 && ar <= 9000 && nCom < 40000){
          var rs0 = nearRoad(b.x, b.y, 70 + b.r);
          if (rs0.length){
            var d00 = Infinity; rs0.forEach(function(r){ if (r.d < d00) d00 = r.d; }); rs0 = rs0.filter(function(r){ return r.d <= d00 + 10 && RANK[r.s[5]] >= 1; });
            if (rs0.length){
              rs0.sort(function(p, q){ return p.d - q.d; });
              var c0 = rs0[0], cs = c0.s, cex = cs[2] - cs[0], cey = cs[3] - cs[1], cel = Math.hypot(cex, cey) || 1, ct = Math.max(0, Math.min(1, ((b.x - cs[0])*cex + (b.y - cs[1])*cey)/(cel*cel)));
              var ctx = cs[0] + cex*ct - b.x, cty = cs[1] + cey*ct - b.y, ctl = Math.hypot(ctx, cty) || 1; ctx /= ctl; cty /= ctl;
              var cdu = ctx*b.ux + cty*b.uy, cdv = -ctx*b.uy + cty*b.ux, cfx, cfy, cfh, cgh;
              if (Math.abs(cdu) >= Math.abs(cdv)){ var q1 = cdu >= 0 ? 1 : -1; cfx = b.ux*q1; cfy = b.uy*q1; cfh = b.hu; cgh = b.hv; } else { var q2 = cdv >= 0 ? 1 : -1; cfx = -b.uy*q2; cfy = b.ux*q2; cfh = b.hv; cgh = b.hu; }
              var cgx = -cfy, cgy = cfx, gap = c0.d - cs[4] - cfh, parkD = Math.min(gap - 3.5, 26);
              var hasPark = each(pk, b.x + cfx*(cfh + 8), b.y + cfy*(cfh + 8), CELL, 40, function(){ return true; });
              if (gap >= 8 && parkD >= 7 && !hasPark){
                var pw = Math.min(cgh*2 + 6, 90), pcx = b.x + cfx*(cfh + 1 + parkD/2), pcy = b.y + cfy*(cfh + 1 + parkD/2), okp = true;
                [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].forEach(function(cn){ var qx = pcx + cgx*cn[0]*pw/2 + cfx*cn[1]*parkD/2, qy = pcy + cgy*cn[0]*pw/2 + cfy*cn[1]*parkD/2; if (inAny(qx, qy, 0.5, b) || !clearOfRoads(qx, qy, 1)) okp = false; });
                if (okp){
                  var rect = []; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(cn){ rect.push(pcx + cgx*cn[0]*pw/2 + cfx*cn[1]*parkD/2, pcy + cgy*cn[0]*pw/2 + cfy*cn[1]*parkD/2); }); rect.push(rect[0], rect[1]);
                  var pt = {amenity:'parking', parking:'surface', 'parking:orientation':'perpendicular', capacity:String(Math.max(6, Math.round(pw*parkD/25))), 'asmb:bays':'yes', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'};
                  wayOut(pt, rect, true); out.parking++; put(pk, pcx, pcy, CELL, 1); out.shops++;
                  /* two kerb cuts from the road edge to the front of the parking, and a pole sign by one of them */
                  var yawC = yawOf(cfx, cfy), sgn2 = h3(Math.round(b.x), Math.round(b.y), 97) < 0.5 ? 1 : -1;
                  [-1, 1].forEach(function(sg){
                    var lat = sg*(pw/2 - 3.2), qx2 = pcx + cgx*lat + cfx*parkD/2, qy2 = pcy + cgy*lat + cfy*parkD/2, rr3 = nearRoad(qx2, qy2, 30); rr3.sort(function(p, q){ return p.d - q.d; }); if (!rr3.length) return;
                    var s3 = rr3[0].s, e3x = s3[2] - s3[0], e3y = s3[3] - s3[1], e3l = Math.hypot(e3x, e3y) || 1, t3 = Math.max(0, Math.min(1, ((qx2 - s3[0])*e3x + (qy2 - s3[1])*e3y)/(e3l*e3l))), p3x = s3[0] + e3x*t3, p3y = s3[1] + e3y*t3, d3x = qx2 - p3x, d3y = qy2 - p3y, d3l = Math.hypot(d3x, d3y) || 1;
                    if (d3l - s3[4] < 1.5 || d3l - s3[4] > 14) return;
                    var tg = {}; for (var kk in T.drive) tg[kk] = T.drive[kk]; tg['asmb:kerbcut'] = 'yes'; tg.width = '7';
                    wayOut(tg, [p3x + d3x/d3l*(s3[4] + 0.3), p3y + d3y/d3l*(s3[4] + 0.3), qx2, qy2]); out.kerbCuts++;
                    if (sg === sgn2){ prop('street.hanging_sign', qx2 + cgx*sg*2.5 - cfx*1.5, qy2 + cgy*sg*2.5 - cfy*1.5, yawC, 'sign'); out.signs++; }
                  });
                }
              }
              /* the service side at the back: a dumpster or two and a chain-link fence round the rear */
              var bkx = b.x - cfx*(cfh + 3.5) + cgx*cgh*0.5, bky = b.y - cfy*(cfh + 3.5) + cgy*cgh*0.5;
              if (!inAny(bkx, bky, 0.8, b) && clearOfRoads(bkx, bky, 2)){
                prop('street.dumpster', bkx, bky, yawOf(cfx, cfy) + 180, 'service'); out.dumpsters++;
                if (h3(Math.round(b.x), Math.round(b.y), 98) < 0.5 && !inAny(bkx - cgx*3, bky - cgy*3, 0.8, b)){ prop('street.dumpster', bkx - cgx*3, bky - cgy*3, yawOf(cfx, cfy) + 180, 'service'); out.dumpsters++; }
              }
              var fhs = cgh + 4, fbk = cfh + 9, fpts = [b.x + cgx*(-fhs), b.y + cgy*(-fhs), 0, 0], ok2 = true, loop = [[-fhs, 0], [-fhs, -fbk], [fhs, -fbk], [fhs, 0]], pts2 = [];
              loop.forEach(function(q){ pts2.push(b.x + cgx*q[0] + cfx*q[1], b.y + cgy*q[0] + cfy*q[1]); });
              for (var z = 0; z < 8 && ok2; z += 2){ var mx = pts2[z], my = pts2[z + 1]; if (inAny(mx, my, 0.5, b) || !clearOfRoads(mx, my, 1.5)) ok2 = false; }
              if (ok2 && h3(Math.round(b.x), Math.round(b.y), 99) < 0.75){ wayOut(T.chain, pts2); out.serviceFences++; }
              nCom++;
            }
          }
        }
        if (!house || nH >= CAP) return;
        nH++;
        /* ---- the road in front: the quietest of the roads within 35 m ---- */
        var rs = nearRoad(b.x, b.y, 35); if (!rs.length) return;
        var d0 = Infinity; rs.forEach(function(r){ if (r.d < d0) d0 = r.d; }); rs = rs.filter(function(r){ return r.d <= d0 + 12; });
        rs.sort(function(p, q){ return (RANK[p.s[5]] - RANK[q.s[5]]) || (p.d - q.d); });
        var rd = rs[0], s = rd.s, ex = s[2] - s[0], ey = s[3] - s[1], el = Math.hypot(ex, ey) || 1, tt = Math.max(0, Math.min(1, ((b.x - s[0])*ex + (b.y - s[1])*ey)/(el*el)));
        var rx = s[0] + ex*tt, ry = s[1] + ey*tt, tx = rx - b.x, ty = ry - b.y, tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        /* house frame: f toward the road along the nearer box axis, side axis g */
        var du = tx*b.ux + ty*b.uy, dv = tx*(-b.uy) + ty*b.ux, fx, fy, fh, gh;   /* fh: half extent along f, gh along the side */
        if (Math.abs(du) >= Math.abs(dv)){ var sg = du >= 0 ? 1 : -1; fx = b.ux*sg; fy = b.uy*sg; fh = b.hu; gh = b.hv; }
        else { var sg2 = dv >= 0 ? 1 : -1; fx = -b.uy*sg2; fy = b.ux*sg2; fh = b.hv; gh = b.hu; }
        var gx = -fy, gy = fx;
        var toRoad = rd.d - s[4] - fh;   /* clear ground between the front wall and the road edge */
        if (toRoad < 2.5) return;
        out.houses++;
        var ff = Math.min(toRoad - 1.5, 9 + h3(seedA, seedB, 80)*5) + fh;   /* lot front line, from the house centre */
        var fb = fh + 7 + h3(seedA, seedB, 81)*8, hs = gh + 3 + h3(seedA, seedB, 82)*2.5;
        /* ---- driveway ---- */
        var hasDrive = each(existing, b.x, b.y, 20, 14, function(){ return true; }) || t.generated === 'yes' && t.building === 'barn';
        if (!hasDrive && toRoad >= 4 && h3(seedA, seedB, 83) < 0.92){
          var sgn = h3(seedA, seedB, 84) < 0.5 ? 1 : -1, lat = sgn*Math.max(1.2, gh - 1.8);
          var qx = b.x + fx*(fh + 0.3) + gx*lat, qy = b.y + fy*(fh + 0.3) + gy*lat;
          var rr = nearRoad(qx, qy, 40); rr.sort(function(p, q){ return p.d - q.d; });
          if (rr.length){
            var s2 = rr[0].s, e2x = s2[2] - s2[0], e2y = s2[3] - s2[1], e2l = Math.hypot(e2x, e2y) || 1, t2 = Math.max(0, Math.min(1, ((qx - s2[0])*e2x + (qy - s2[1])*e2y)/(e2l*e2l))), p2x = s2[0] + e2x*t2, p2y = s2[1] + e2y*t2, dx2 = qx - p2x, dy2 = qy - p2y, dl2 = Math.hypot(dx2, dy2) || 1;
            var ex2 = p2x + dx2/dl2*(s2[4] + 0.3), ey2 = p2y + dy2/dl2*(s2[4] + 0.3);
            if (dl2 > s2[4] + 3 && !inAny((ex2 + qx)/2, (ey2 + qy)/2, 1, b)){ wayOut(T.drive, [ex2, ey2, qx, qy]); out.drives++; hasDrive = true; }
          }
        }
        /* ---- fences and hedges on the lot lines ---- */
        var sty = h3(seedA, seedB, 85), kind = sty < 0.42 ? 'wood' : sty < 0.67 ? 'hedge' : sty < 0.82 ? 'chain' : null;
        var frontFence = rd.s[6] === 'town' && h3(seedA, seedB, 86) < 0.4;
        if (kind || frontFence){
          var lines = [];   /* each: from (s0,f0) to (s1,f1) in the lot frame */
          if (kind){ lines.push([-hs, -fb, hs, -fb, kind], [-hs, -fb, -hs, ff - 2, kind], [hs, -fb, hs, ff - 2, kind]); }
          if (frontFence) lines.push([-hs, ff, hs, ff, 'pick']);
          lines.forEach(function(ln){
            var len = Math.hypot(ln[2] - ln[0], ln[3] - ln[1]), steps = Math.max(2, Math.round(len/3)), run = [], flush = function(){ if (run.length >= 6){ wayOut(T[ln[4]], run); out.fences++; out.fenceKm += (run.length/2 - 1)*3/1000; } run = []; };
            for (var k = 0; k <= steps; k++){
              var ss = ln[0] + (ln[2] - ln[0])*k/steps, fv = ln[1] + (ln[3] - ln[1])*k/steps, px = b.x + gx*ss + fx*fv, py = b.y + gy*ss + fy*fv, ok = !inAny(px, py, 1.2, null) && clearOfRoads(px, py, ln[4] === 'pick' ? 0.8 : 1.5);
              if (ok) ok = !each(fg, px, py, 8, 2.2, function(v){ return Math.hypot(v[0] - px, v[1] - py) < 2.2; });
              if (ok){ run.push(px, py); put(fg, px, py, 8, [px, py]); } else flush();
            }
            flush();
          });
        }
        /* ---- back-yard things: one or two from the seed ---- */
        var nY = h3(seedA, seedB, 87) < 0.35 ? 1 : 2, backD = fb - fh;
        for (var y = 0; y < nY; y++){
          var pick = h3(seedA, seedB, 88 + y), bf = -(fh + 2.5 + h3(seedA, seedB, 90 + y)*Math.max(1, backD - 4)), bs = (h3(seedA, seedB, 92 + y) - 0.5)*Math.max(2, hs*1.4);
          var px2 = b.x + gx*bs + fx*bf, py2 = b.y + gy*bs + fy*bf;
          if (inAny(px2, py2, 0.8, null) || !clearOfRoads(px2, py2, 2)) continue;
          var yaw = yawOf(fx, fy);
          if (pick < 0.14 && backD >= 7){   /* a shed: its own small building */
            var fp = []; var sw = 1.6 + h3(seedA, seedB, 94)*0.8, sd = 1.3 + h3(seedA, seedB, 95)*0.6;
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(cn){ fp.push(px2 + gx*cn[0]*sw + fx*cn[1]*sd, py2 + gy*cn[0]*sw + fy*cn[1]*sd); }); fp.push(fp[0], fp[1]);
            wayOut(T.shed, fp, true); out.sheds++;
          } else if (pick < 0.17 && backD >= 9 && hs >= 6){   /* a swimming pool */
            var fp2 = []; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(cn){ fp2.push(px2 + gx*cn[0]*2 + fx*cn[1]*4, py2 + gy*cn[0]*2 + fy*cn[1]*4); }); fp2.push(fp2[0], fp2[1]);
            wayOut(T.pool, fp2, true); out.pools++;
          } else {
            var items = ['garden.garden_plot', 'garden.garden_plot', 'garden.rain_barrel', 'build.compost_bin', 'build.drying_rack', 'plants.bush'];
            prop(items[Math.floor(h3(seedA, seedB, 96 + y)*items.length)], px2, py2, yaw, 'yard'); out.yardItems++;
          }
        }
      });
      out.fenceKm = Math.round(out.fenceKm*10)/10;
      return out;
    };
  };
})();
