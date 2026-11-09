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
      wall:{barrier:'wall', wall:'brick', height:'1.1', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      wire:{barrier:'fence', fence_type:'wire', height:'1.2', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      rail:{barrier:'fence', fence_type:'split_rail', height:'1.2', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      hedge:{barrier:'hedge', height:'1.5', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      pick:{barrier:'fence', fence_type:'picket', height:'1.0', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      drive:{highway:'service', service:'driveway', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      shed:{building:'shed', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'},
      pool:{leisure:'swimming_pool', access:'private', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'}
    };
    var round6 = function(v){ return Math.round(v*1e6)/1e6; };

    L.lots = function(F, loc){
      var out = {kerbCars:0, driveCars:0, lotCars:0, jamCars:0, bigVehicles:0, camps:0, roadblocks:0, bankTrees:0, reeds:0, edgeGrass:0, edgeShrubs:0, edgeTrees:0, roadTrees:0, hedges:0, fields:0, landmarks:0, towers:0, shops:0, parking:0, kerbCuts:0, signs:0, dumpsters:0, serviceFences:0, houses:0, drives:0, fences:0, fenceKm:0, sheds:0, pools:0, yardItems:0, roofUnits:0, chimneys:0, dishes:0};
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
        for (var s = 0; s + 3 < pts.length; s += 2) segs.push([pts[s], pts[s + 1], pts[s + 2], pts[s + 3], HALF[hw], hw, t['asmb:street'], wi]);
      });
      var sIdx = L.spatial(segs.length || 1); segs.forEach(function(s){ sIdx.add(Math.min(s[0], s[2]), Math.min(s[1], s[3]), Math.max(s[0], s[2]), Math.max(s[1], s[3])); }); if (!segs.length) sIdx.add(-1e9, -1e9, -1e9, -1e9); sIdx.finish();
      var nearRoad = function(x, y, rad){ var l = sIdx.search(x - rad, y - rad, x + rad, y + rad), res = []; for (var i = 0; i < l.length; i++){ var s = segs[l[i]]; if (!s) continue; var d = L.segDist(x, y, s[0], s[1], s[2], s[3]); if (d < rad) res.push({d:d, s:s}); } return res; };
      var inBox = function(o, x, y, mg){ var dx = x - o.x, dy = y - o.y; return Math.abs(dx*o.ux + dy*o.uy) < o.hu + mg && Math.abs(-dx*o.uy + dy*o.ux) < o.hv + mg; };
      var inAny = function(x, y, mg, skip){ return each(bgrid, x, y, CELL, 40, function(o){ return o !== skip && Math.hypot(o.x - x, o.y - y) < o.r + mg + 1 && inBox(o, x, y, mg); }); };
      var clearOfRoads = function(x, y, mg){ var r = nearRoad(x, y, 12); for (var i = 0; i < r.length; i++) if (r[i].d < r[i].s[4] + mg) return false; return true; };
      var wayOut = function(tags, pts, poly){ var c = []; for (var i = 0; i < pts.length; i += 2){ var p = ll(pts[i], pts[i + 1]); c.push(p[0], p[1]); } F.ways.push({t:tags, c:c, poly:!!poly, src:'gen'}); };
      var prop = function(piece, x, y, yaw, band, z){ var p = ll(x, y), tg = {'asmb:prop':piece, 'asmb:ry':String(((Math.round(yaw/90) % 4) + 4) % 4), 'asmb:yaw':String(Math.round(yaw)), generated:'yes', 'asmb:made':'yes', 'asmb:band':band}; if (z) tg['asmb:z'] = String(Math.round(z*10)/10); F.pois.push({lon:p[0], lat:p[1], t:tg}); };
      /* facing direction (fx, fy) as the yaw used by the props: atan2(east, south) (the 3D view and the game turn a prop by -yaw about the vertical axis, the prop model faces +z) in the game's metre space, where y grows south */
      var yawOf = function(fx, fy){ return Math.atan2(fx, fy)*180/Math.PI; };
      var heightOf = function(t){ var h = parseFloat(t.height); if (h > 0) return h; var lv = parseInt(t['building:levels'], 10); return (lv > 0 ? lv : 1)*3.2; };

      var CAP = 90000, nH = 0, nCom = 0, lotJobs = [], driveJobs = [], bigJobs = [], fieldJobs = [];
      bl.forEach(function(b){
        var t = b.t, ar = b.a, seedA = Math.round(b.x), seedB = Math.round(b.y);
        var comm = !!(t.shop || t.office || t.amenity || FLAT[t.building]);
        var house = !comm && ar >= 45 && ar <= 450 && (t.building === 'house' || t.building === 'detached' || t.building === 'residential' || t.building === 'semidetached_house' || t.building === 'yes' || t.building === 'bungalow');
        var h = heightOf(t);
        /* ---- roofs ---- */
        var flat = t['roof:shape'] === 'flat' || (comm && !t['roof:shape']) || (!house && FLAT[t.building] === 1 && !t['roof:shape']);
        if (flat && ar >= 80 && ar < 20000 && t.building !== 'shed'){
          var bigRoof = ar >= 200, nU = bigRoof ? Math.max(1, Math.min(6, Math.round(ar/(ar < 1200 ? 350 : 900)))) : Math.max(1, Math.min(8, Math.round(ar/140))), tries = 0, placed = 0;
          var kinds = ['street.ac_unit', 'street.ac_unit', 'street.ac_unit', 'street.roof_hatch', 'street.satellite_dish', 'street.water_tank'];
          while (placed < nU && tries++ < nU*4){
            var a = (h3(seedA, seedB, tries, 71) - 0.5)*(b.hu*2 - 3), c = (h3(seedA, seedB, tries, 72) - 0.5)*(b.hv*2 - 3);
            var px = b.x + b.ux*a - b.uy*c, py = b.y + b.uy*a + b.ux*c;
            if (!L.pip(b.m, px, py)) continue;
            var kd = bigRoof ? (ar < 450 ? 'land.roof_units_s' : ar < 1200 ? 'land.roof_units_m' : 'land.roof_units_l') : kinds[Math.floor(h3(seedA, seedB, tries, 73)*kinds.length)];
            if (bigRoof && placed === 0 && h >= 9 && h3(seedA, seedB, 74) < 0.3) kd = 'street.water_tank'; if (kd === 'street.water_tank' && (h < 9 || placed > 0 || h3(seedA, seedB, 74) > 0.35)) kd = 'street.ac_unit';
            prop(kd, px, py, Math.round(h3(seedA, seedB, tries, 75)*4)*90, 'roof', h); placed++; out.roofUnits++;
          }
        } else if (house){
          if (h3(seedA, seedB, 76) < 0.22){ var a2 = (h3(seedA, seedB, 77) - 0.5)*b.hu*0.8, px2 = b.x + b.ux*a2, py2 = b.y + b.uy*a2; prop('street.chimney', px2, py2, 0, 'roof', h + 1); out.chimneys++; }
          else if (h3(seedA, seedB, 78) < 0.12){ prop('street.satellite_dish', b.x + b.ux*b.hu*0.4, b.y + b.uy*b.hu*0.4, Math.round(h3(seedA, seedB, 79)*360), 'roof', h + 0.6); out.dishes++; }
        }
        /* ---- shops, fuel, food and motels on a lot: parking between the building and the road, two kerb cuts, a sign, a service side ---- */
        if ((t.building === 'industrial' || t.building === 'warehouse' || t.industrial === 'warehouse') && ar >= 1200) b.job = 'dock'; else if (t.amenity === 'fire_station' || t.building === 'fire_station') b.job = 'fire'; else if (t.amenity === 'police' || t.building === 'police') b.job = 'police'; else if (t.amenity === 'hospital' || t.building === 'hospital') b.job = 'hospital'; if (b.job) bigJobs.push(b);
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
                  wayOut(pt, rect, true); out.parking++; if (t.amenity === 'fuel'){ prop('land.gas_canopy_pumps', pcx, pcy, yawOf(cfx, cfy), 'canopy'); out.canopies = (out.canopies || 0) + 1; } put(pk, pcx, pcy, CELL, 1); out.shops++; lotJobs.push({cx:pcx, cy:pcy, fx:cfx, fy:cfy, gx:cgx, gy:cgy, pw:pw, pd:parkD, bx:b.x, by:b.y, fh:cfh, cap:+pt.capacity});
                  /* two kerb cuts from the road edge to the front of the parking, and a pole sign by one of them */
                  var yawC = yawOf(cfx, cfy), sgn2 = h3(Math.round(b.x), Math.round(b.y), 97) < 0.5 ? 1 : -1;
                  [-1, 1].forEach(function(sg){
                    var lat = sg*(pw/2 - 3.2), qx2 = pcx + cgx*lat + cfx*parkD/2, qy2 = pcy + cgy*lat + cfy*parkD/2, rr3 = nearRoad(qx2, qy2, 30); rr3.sort(function(p, q){ return p.d - q.d; }); if (!rr3.length) return;
                    var s3 = rr3[0].s, e3x = s3[2] - s3[0], e3y = s3[3] - s3[1], e3l = Math.hypot(e3x, e3y) || 1, t3 = Math.max(0, Math.min(1, ((qx2 - s3[0])*e3x + (qy2 - s3[1])*e3y)/(e3l*e3l))), p3x = s3[0] + e3x*t3, p3y = s3[1] + e3y*t3, d3x = qx2 - p3x, d3y = qy2 - p3y, d3l = Math.hypot(d3x, d3y) || 1;
                    if (d3l - s3[4] < 1.5 || d3l - s3[4] > 14) return;
                    var tg = {}; for (var kk in T.drive) tg[kk] = T.drive[kk]; tg['asmb:kerbcut'] = 'yes'; tg.width = '7';
                    wayOut(tg, [p3x + d3x/d3l*(s3[4] + 0.3), p3y + d3y/d3l*(s3[4] + 0.3), qx2, qy2]); out.kerbCuts++;
                    if (sg === sgn2){ prop(t.amenity === 'fuel' ? 'land.pole_sign_station' : 'land.pole_sign_store', qx2 + cgx*sg*2.5 - cfx*1.5, qy2 + cgy*sg*2.5 - cfy*1.5, yawC, 'sign'); out.signs++; }
                  });
                }
              }
              if (h3(Math.round(b.x), Math.round(b.y), 160) < 0.3) prop(h3(Math.round(b.x), Math.round(b.y), 161) < 0.7 ? 'land.shop_shelf_outdoor' : 'land.water_barrels_3', b.x + cfx*(cfh + 0.9) + cgx*(h3(Math.round(b.x), Math.round(b.y), 162) - 0.5)*cgh, b.y + cfy*(cfh + 0.9) + cgy*(h3(Math.round(b.x), Math.round(b.y), 162) - 0.5)*cgh, yawOf(cfx, cfy), 'front');
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
            if (dl2 > s2[4] + 3 && !inAny((ex2 + qx)/2, (ey2 + qy)/2, 1, b)){ wayOut(T.drive, [ex2, ey2, qx, qy]); out.drives++; hasDrive = true; driveJobs.push([ex2, ey2, qx, qy]); }
          }
        }
        /* ---- fences and hedges on the lot lines ---- */
        var sty = h3(seedA, seedB, 85), kind = sty < 0.42 ? 'wood' : sty < 0.67 ? 'hedge' : sty < 0.82 ? 'chain' : null; if ((t['asmb:ring'] === '0' || t['asmb:ring'] === '1') && h3(seedA, seedB, 89) < 0.45) kind = 'wall';
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
        /* ---- one slightly-off detail on about one lot in nine: a tarp on the roof, or the garage door standing open ---- */
        var offD = h3(seedA, seedB, 86 + 40);
        if (offD < 0.05){ prop('land.roof_tarp', b.x + gx*(h3(seedA, seedB, 150) - 0.5)*gh*0.8, b.y + gy*(h3(seedA, seedB, 150) - 0.5)*gh*0.8, yawOf(fx, fy), 'off', h + 0.2); out.offDetails = (out.offDetails || 0) + 1; }
        else if (offD < 0.11 && hasDrive && driveJobs.length){ var dj = driveJobs[driveJobs.length - 1]; if (Math.hypot(dj[2] - b.x, dj[3] - b.y) < 30){ prop('land.garage_door_open', dj[2] + fx*0.05, dj[3] + fy*0.05, yawOf(fx, fy), 'off'); out.offDetails = (out.offDetails || 0) + 1; } }
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
            var items = ['garden.garden_plot', 'garden.garden_plot', 'garden.rain_barrel', 'build.compost_bin', 'build.drying_rack', 'plants.bush', 'land.swing_set', 'land.trampoline', 'land.wood_pile', 'land.picnic_table', 'land.bbq_grill', 'land.doghouse'];
            prop(items[Math.floor(h3(seedA, seedB, 96 + y)*items.length)], px2, py2, yaw, 'yard'); out.yardItems++;
          }
        }
      });
      /* ---- the green edges (from the layout request, step 8): tree rows along streams and rivers, reeds round ponds and lakes, a band of tall grass,
         shrubs and young trees round woods, hedges and a crop mix on fields, tree rows on country roads. Real trees keep their place; new ones keep 5 m clear. ---- */
      var tg = new Map(); F.pois.forEach(function(p){ if (p.t && p.t.natural === 'tree'){ var q = loc.m(p.lon, p.lat); put(tg, q[0], q[1], 10, [q[0], q[1]]); } });
      var EDGE_CAP = 160000, nEdge = 0;
      var treeNear = function(x, y, r){ return each(tg, x, y, 10, r, function(v){ return Math.hypot(v[0] - x, v[1] - y) < r; }); };
      var okSpot = function(x, y, rt){ return nEdge < EDGE_CAP && !inAny(x, y, 1.5, null) && clearOfRoads(x, y, 3) && !treeNear(x, y, rt || 5); };
      var addTree = function(x, y, band){ var p = ll(x, y); F.pois.push({lon:p[0], lat:p[1], t:{natural:'tree', generated:'yes', 'asmb:made':'yes', 'asmb:band':band}}); put(tg, x, y, 10, [x, y]); nEdge++; };
      var toM = function(c){ var m = []; for (var i = 0; i < c.length; i += 2){ var p = loc.m(c[i], c[i + 1]); m.push(p[0], p[1]); } return m; };
      /* walk a line of metre points: fn(x, y, nx, ny, k) every step (+/- jitter) with a left-hand unit normal */
      var walk = function(m, step, jit, sd, fn){
        var carry = h3(Math.round(m[0]), Math.round(m[1]), sd)*step, k = 0;
        for (var i = 0; i + 3 < m.length; i += 2){
          var ax = m[i], ay = m[i + 1], bx = m[i + 2], by = m[i + 3], L0 = Math.hypot(bx - ax, by - ay); if (L0 < 0.5) continue; var dx = (bx - ax)/L0, dy = (by - ay)/L0, t0 = carry;
          while (t0 < L0){ fn(ax + dx*t0, ay + dy*t0, -dy, dx, k++); t0 += step + (h3(Math.round(ax), Math.round(ay), k, sd + 1) - 0.5)*2*jit; }
          carry = t0 - L0;
        }
      };
      F.ways.forEach(function(w){
        var t = w.t, hwid = {river:7, stream:2.5, canal:4}[t.waterway];
        if (!w.poly && hwid){
          var m = toM(w.c), rowOn = false;
          [-1, 1].forEach(function(sd){
            walk(m, 15, 5, 101 + sd, function(x, y, nx, ny, k){
              if (k % 6 === 0) rowOn = h3(Math.round(x), Math.round(y), 102 + sd) < 0.6;   /* trees come in runs of about six, then a gap */
              if (!rowOn) return;
              var off = hwid + 2.5 + h3(Math.round(x), Math.round(y), 103)*3, px = x + nx*off*sd, py = y + ny*off*sd;
              if (okSpot(px, py, 5)){ if (h3(Math.round(x), Math.round(y), 106) < 0.18){ prop('land.willow', px, py, h3(Math.round(x), Math.round(y), 107)*360, 'bank'); nEdge++; put(tg, px, py, 10, [px, py]); } else addTree(px, py, 'bank'); out.bankTrees++; }
              if (t.waterway !== 'canal' && h3(Math.round(x), Math.round(y), 104) < 0.3){ var rx = x + nx*(hwid + 0.6)*sd, ry = y + ny*(hwid + 0.6)*sd; if (!inAny(rx, ry, 1, null) && clearOfRoads(rx, ry, 2)){ prop('plants.reeds', rx, ry, h3(Math.round(rx), Math.round(ry), 105)*360, 'shore'); out.reeds++; nEdge++; } }
            });
          });
          return;
        }
        if (!w.poly) return;
        var isWater = t.natural === 'water' && t.water !== 'pool' || t.landuse === 'reservoir' || t.landuse === 'basin';
        var isWood = t.natural === 'wood' || t.landuse === 'forest' || t.natural === 'scrub';
        var isField = t.landuse === 'farmland' || t.landuse === 'meadow' || t.landuse === 'orchard' && false;
        if (!isWater && !isWood && !isField) return;
        var pm = toM(w.c), ar = Math.abs(L.area(pm)); if (ar < 400) return;
        var outward = function(x, y, nx, ny, d){ var ax = x + nx*d, ay = y + ny*d; return L.pip(pm, ax, ay) ? [x - nx*d, y - ny*d] : [ax, ay]; };
        if (isWater){
          walk(pm, 5, 2, 110, function(x, y, nx, ny){ if (h3(Math.round(x), Math.round(y), 111) > 0.45) return; var q = outward(x, y, nx, ny, 0.8); if (!inAny(q[0], q[1], 1, null) && clearOfRoads(q[0], q[1], 2) && nEdge < EDGE_CAP){ prop(h3(Math.round(q[0]), Math.round(q[1]), 113) < 0.3 ? 'land.cattails' : 'plants.reeds', q[0], q[1], h3(Math.round(q[0]), Math.round(q[1]), 112)*360, 'shore'); out.reeds++; nEdge++; } });
        } else if (isWood){
          walk(pm, 5, 1.5, 120, function(x, y, nx, ny, k){
            var q = outward(x, y, nx, ny, 2 + h3(Math.round(x), Math.round(y), 121)*2.5);   /* tall grass first */
            if (okSpot(q[0], q[1], 1.5)){ prop('plants.grass_tuft', q[0], q[1], h3(Math.round(q[0]), Math.round(q[1]), 122)*360, 'edge'); out.edgeGrass++; nEdge++; }
            if (k % 2 === 0){ var q2 = outward(x, y, nx, ny, 5 + h3(Math.round(x), Math.round(y), 123)*3); if (okSpot(q2[0], q2[1], 3)){ prop('plants.bush', q2[0], q2[1], h3(Math.round(q2[0]), Math.round(q2[1]), 124)*360, 'edge'); out.edgeShrubs++; nEdge++; } }
            if (k % 3 === 0 && h3(Math.round(x), Math.round(y), 125) < 0.6){ var q3 = outward(x, y, nx, ny, 8 + h3(Math.round(x), Math.round(y), 126)*4); if (okSpot(q3[0], q3[1], 6)){ if (h3(Math.round(x), Math.round(y), 127) < 0.5){ prop('land.young_tree', q3[0], q3[1], h3(Math.round(x), Math.round(y), 128)*360, 'edge'); nEdge++; out.edgeTrees++; } else { addTree(q3[0], q3[1], 'edge'); out.edgeTrees++; } if (h3(Math.round(x), Math.round(y), 129) < 0.06){ prop(h3(Math.round(x), Math.round(y), 130) < 0.5 ? 'land.fallen_log' : 'land.stump', q3[0] + nx*2, q3[1] + ny*2, h3(Math.round(x), Math.round(y), 131)*360, 'edge'); nEdge++; } } }
          });
        } else if (isField && ar >= 4000){
          out.fields++;
          if (!t['asmb:crop']){ var CROPS = ['wheat', 'corn', 'soy', 'hay', 'fallow']; t['asmb:crop'] = CROPS[Math.floor(h3(Math.round(pm[0]), Math.round(pm[1]), 130)*CROPS.length)]; t['asmb:shade'] = String(Math.floor(h3(Math.round(pm[0]), Math.round(pm[1]), 131)*4)); }
          var hs = h3(Math.round(pm[0]), Math.round(pm[1]), 132);
          if (hs < 0.55 && !w.t.barrier){ wayOut(hs < 0.3 ? T.hedge : hs < 0.45 ? T.rail : T.wire, pm, false); out.hedges++; }
          if (ar >= 20000 && h3(Math.round(pm[0]), Math.round(pm[1]), 134) < 0.25){ var kx = 0, ky = 0, kn = 0, ki; for (ki = 0; ki + 1 < pm.length; ki += 2){ kx += pm[ki]; ky += pm[ki + 1]; kn++; } kx /= kn; ky /= kn; if (L.pip(pm, kx, ky) && !inAny(kx, ky, 4, null)){ var cp = ['vehicles.pk_workshop_crafts_combine', 'vehicles.pk_workshop_crafts_farm_tractor'][h3(Math.round(kx), Math.round(ky), 135) < 0.6 ? 0 : 1]; fieldJobs.push([cp, kx, ky, h3(Math.round(kx), Math.round(ky), 136)*360]); } }
          if (hs < 0.3) walk(pm, 24, 8, 133, function(x, y, nx, ny){ var q = outward(x, y, nx, ny, 3); if (okSpot(q[0], q[1], 8)){ addTree(q[0], q[1], 'edge'); out.edgeTrees++; } });
        }
      });
      /* country roads: runs of trees close to the road, on and off in stretches of about 120 m */
      F.ways.forEach(function(w){
        var t = w.t; if (w.poly || t['asmb:street'] !== 'rural') return;
        var half = HALF[t.highway] || 3, m = toM(w.c);
        [-1, 1].forEach(function(sd){ var on = false; walk(m, 18, 6, 140 + sd, function(x, y, nx, ny, k){
          if (k % 7 === 0) on = h3(Math.round(x), Math.round(y), 141 + sd) < 0.35; if (!on) return;
          var off = half + 4.5 + h3(Math.round(x), Math.round(y), 142)*2.5, px = x + nx*off*sd, py = y + ny*off*sd; if (okSpot(px, py, 6)){ addTree(px, py, 'verge'); out.roadTrees++; } }); });
      });
      /* ---- abandoned traffic (step 9): cars at kerbs and in driveways, nose-in at shops, jams on the main roads out, big vehicles at warehouse docks and bus stops,
         quarantine camps in parks, roadblocks on the roads out. After the fall: some are wrecks or burnt out. Vehicles are `vehicles.<kind>`; buses and semis
         come from the fleet pack (the game skips what the map's packs do not hold). All seeded by position, marked generated=yes and asmb:made=yes. ---- */
      var CARS = ['hatchback', 'sedan', 'sedan', 'wagon', 'suv', 'pickup', 'van', 'offroader', 'crew_pickup'], cg = new Map(), nCar = 0, CAR_CAP = 70000;
      var pickCar = function(sx, sy, sd, ruin){ var k = CARS[Math.floor(h3(sx, sy, sd)*CARS.length)], r = h3(sx, sy, sd + 1); if (r < ruin*0.3) return 'vehicles.' + k + '_burnt'; if (r < ruin) return 'vehicles.' + k + '_wreck'; return 'vehicles.' + k; };
      var carAt = function(piece, x, y, yaw, band, minGap){ if (nCar >= CAR_CAP || each(cg, x, y, 8, minGap || 5.5, function(v){ return Math.hypot(v[0] - x, v[1] - y) < (minGap || 5.5); }) || inAny(x, y, 0.8, null)) return false; var p = ll(x, y); F.pois.push({lon:p[0], lat:p[1], t:{'asmb:prop':piece, 'asmb:ry':String(((Math.round(yaw/90) % 4) + 4) % 4), 'asmb:yaw':String(Math.round(yaw)), generated:'yes', 'asmb:made':'yes', 'asmb:band':band}}); put(cg, x, y, 8, [x, y]); nCar++; return true; };
      /* where the town is: the 250 m cell with the most buildings */
      var cnt = new Map(), cenBX = 0, cenBY = 0, cenBN = 0; bl.forEach(function(b){ var k = Math.floor(b.x/250) + ',' + Math.floor(b.y/250), v = (cnt.get(k) || 0) + 1; cnt.set(k, v); if (v > cenBN){ cenBN = v; cenBX = (Math.floor(b.x/250) + 0.5)*250; cenBY = (Math.floor(b.y/250) + 0.5)*250; } });
      /* in driveways: about a third of houses with a drive have a car in it, nose to the garage */
      driveJobs.forEach(function(d){ var sx = Math.round(d[2]), sy = Math.round(d[3]); if (h3(sx, sy, 200) > 0.3) return; var dx = d[2] - d[0], dy = d[3] - d[1], dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl; var px = d[2] - dx*3.2, py = d[3] - dy*3.2; if (dl > 6 && carAt(h3(sx, sy, 202) < 0.07 ? 'vehicles.pk_workshop_crafts_boat_trailer' : pickCar(sx, sy, 201, 0.22), px, py, yawOf(dx, dy), 'drive', h3(sx, sy, 202) < 0.07 ? 6 : 5.5)) out.driveCars++; });
      /* nose-in at shops: a row at the building's front, 2.6 m apart */
      lotJobs.forEach(function(j){ var sx = Math.round(j.bx), sy = Math.round(j.by), n = Math.min(8, Math.round(j.cap*0.35)), ln = Math.min(j.pw - 4, n*2.7), row = j.cx - j.fx*(j.pd/2 - 3.0), roy = j.cy - j.fy*(j.pd/2 - 3.0); for (var i = 0; i < n; i++){ var off = -ln/2 + i*(ln/Math.max(1, n - 1)); if (h3(sx, sy, 210 + i) < 0.25) continue; if (carAt(pickCar(sx, sy, 220 + i, 0.15), row + j.gx*off, roy + j.gy*off, yawOf(-j.fx, -j.fy), 'lot', 2.4)) out.lotCars++; } });
      /* big vehicles at warehouse and depot docks: box trucks and semis nose to the building, 4.5 m apart */
      bigJobs.forEach(function(b){ var rs2 = nearRoad(b.x, b.y, 80 + b.r); if (!rs2.length) return; rs2.sort(function(p, q){ return p.d - q.d; }); var s4 = rs2[0].s, ex = s4[2] - s4[0], ey = s4[3] - s4[1], el = Math.hypot(ex, ey) || 1, t4 = Math.max(0, Math.min(1, ((b.x - s4[0])*ex + (b.y - s4[1])*ey)/(el*el))), tx = s4[0] + ex*t4 - b.x, ty = s4[1] + ey*t4 - b.y, tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        var du = tx*b.ux + ty*b.uy, dv = -tx*b.uy + ty*b.ux, fx, fy, fh, gh; if (Math.abs(du) >= Math.abs(dv)){ var q = du >= 0 ? 1 : -1; fx = b.ux*q; fy = b.uy*q; fh = b.hu; gh = b.hv; } else { var q2 = dv >= 0 ? 1 : -1; fx = -b.uy*q2; fy = b.ux*q2; fh = b.hv; gh = b.hu; }
        var gx = -fy, gy = fx, sx = Math.round(b.x), sy = Math.round(b.y), n = Math.min(b.job === 'dock' ? 4 : 2, Math.max(1, Math.round(gh/6)));
        for (var i = 0; i < n; i++){ var off = (i - (n - 1)/2)*5.2, kd = h3(sx, sy, 230 + i), pc = b.job === 'fire' ? 'vehicles.pk_workshop_crafts_fire_engine_remade' : b.job === 'police' ? 'vehicles.pk_workshop_crafts_police' : b.job === 'hospital' ? 'vehicles.pk_workshop_crafts_ambulance' : kd < 0.3 ? 'vehicles.box_truck' : kd < 0.55 ? 'vehicles.pk_workshop_crafts_box_trailer' : kd < 0.8 ? 'vehicles.pk_afterstreet_fleet_semi_tractor' : 'vehicles.flatbed'; if (h3(sx, sy, 240 + i) < 0.7 && carAt(pc, b.x + fx*(fh + 7) + gx*off, b.y + fy*(fh + 7) + gy*off, yawOf(-fx, -fy), b.job === 'dock' ? 'dock' : 'station', 4.5)) out.bigVehicles++; } });
      fieldJobs.forEach(function(j){ if (carAt(j[0], j[1], j[2], j[3], 'field', 6)) out.fieldMachines = (out.fieldMachines || 0) + 1; });
      /* buses at the stops: one in four bus stops has a bus alongside, stopped */
      F.pois.slice().forEach(function(p){ if (!p.t || p.t.highway !== 'bus_stop') return; var q = loc.m(p.lon, p.lat), sx = Math.round(q[0]), sy = Math.round(q[1]); if (h3(sx, sy, 250) > 0.25) return; var rs3 = nearRoad(q[0], q[1], 14); if (!rs3.length) return; rs3.sort(function(a, c){ return a.d - c.d; }); var s5 = rs3[0].s, dx = s5[2] - s5[0], dy = s5[3] - s5[1], dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl; var rx = -dy, ry = dx, ps = (q[0] - (s5[0] + dx*((q[0] - s5[0])*dx + (q[1] - s5[1])*dy)))*rx + (q[1] - (s5[1] + dy*((q[0] - s5[0])*dx + (q[1] - s5[1])*dy)))*ry, sg = ps >= 0 ? 1 : -1; if (carAt('vehicles.pk_afterstreet_fleet_city_bus', q[0] + rx*sg*(s5[4] - 2.2 - (rs3[0].d)) , q[1] + ry*sg*(s5[4] - 2.2 - (rs3[0].d)), yawOf(dx*sg, dy*sg), 'stop', 12)) out.bigVehicles++; });
      /* on every road: kerb cars, and stuck traffic on the main roads out of town */
      F.ways.forEach(function(w, wi){
        var t = w.t, half = HALF[t.highway]; if (w.poly || !half || t.bridge || t.tunnel || t.highway === 'service') return;
        var m = toM(w.c), cls = t['asmb:street'] || 'suburb', pr = {main:0.4, town:0.3, suburb:0.1, rural:0}[cls] || 0, isMain = t.highway === 'primary' || t.highway === 'secondary' || t.highway === 'tertiary';
        walk(m, 16, 6, 300, function(x, y, nx, ny, k){
          var sx = Math.round(x), sy = Math.round(y), dx = ny, dy = -nx;   /* nx,ny is the left normal (-dy, dx), so the way's direction is (ny, -nx) */
          var other = nearRoad(x, y, half + 12).some(function(r){ return r.s[7] !== wi; });
          var dc = Math.hypot(x - cenBX, y - cenBY);
          /* jam: 150 m stretches, one in nine, between 500 m and 3 km from the centre, in the lane leading out */
          if (isMain && dc > 500 && dc < 3000 && !other){ var chunk = Math.floor(k*16/150), on = h3(Math.round(m[0]), Math.round(m[1]), 310 + chunk) < 0.11; if (on){ var outx = x - cenBX, outy = y - cenBY, sgn = (dx*outx + dy*outy) >= 0 ? 1 : -1, rx = -dy*sgn, ry = dx*sgn, big = h3(sx, sy, 320) < 0.1, pc = big ? (h3(sx, sy, 321) < 0.5 ? 'vehicles.pk_afterstreet_fleet_city_bus' : 'vehicles.box_truck') : pickCar(sx, sy, 322, 0.18); var ang = h3(sx, sy, 323) < 0.1 ? 25 + h3(sx, sy, 324)*20 : (h3(sx, sy, 325) - 0.5)*8; if (carAt(pc, x + rx*half*0.5, y + ry*half*0.5, yawOf(dx*sgn, dy*sgn) + ang, 'jam', big ? 9 : 5.2)){ out.jamCars++; if (!big && h3(sx, sy, 326) < 0.2) F.pois[F.pois.length - 1].t['asmb:door_open'] = 'yes'; return; } } }
          if (!pr || other) return;
          if (h3(sx, sy, 330) > pr) return;
          var side = h3(sx, sy, 331) < 0.5 ? 1 : -1, off = half - 1.15, px = x + nx*off*side, py = y + ny*off*side;   /* right-hand traffic: cars on the right of travel face along the way, on the left against it */
          var face = side === -1 ? 1 : -1; if (carAt(pickCar(sx, sy, 332, 0.18), px, py, yawOf(dx*face, dy*face), 'kerb')) out.kerbCars++;
        });
      });
      var campKeys = {};
      /* quarantine camps in parks and pitches (about one in seven, 3,000 m2 or more): tents in two rows, burning barrels, barriers at the corners, a wreck at the gate */
      F.ways.forEach(function(w){ var t = w.t; if (!w.poly || !(t.leisure === 'park' || t.leisure === 'pitch' || t.leisure === 'common')) return; var pm = toM(w.c), ar = Math.abs(L.area(pm)); if (ar < 3000) return; var cx = 0, cy = 0, n = 0, i; for (i = 0; i + 1 < pm.length; i += 2){ cx += pm[i]; cy += pm[i + 1]; n++; } cx /= n; cy /= n; var sx = Math.round(cx), sy = Math.round(cy); if (h3(sx, sy, 340) > 0.14 || !L.pip(pm, cx, cy) || inAny(cx, cy, 4, null)) return;
        var TENTS = ['land.dome_tent_blue', 'land.dome_tent_green', 'land.dome_tent_orange', 'land.relief_tent'], ok = true, items = [];
        for (var r = -1; r <= 1; r += 2) for (var c = -2; c <= 2; c++){ var px = cx + c*5.5, py = cy + r*4.5; if (!L.pip(pm, px, py) || inAny(px, py, 2, null)) { ok = false; break; } items.push([TENTS[Math.floor(h3(sx, sy, 341 + c + r*7)*TENTS.length)], px, py, r > 0 ? 180 : 0, 'camp']); }
        if (!ok) return; items.push(['land.burning_barrel', cx - 3, cy, 0, 'camp'], ['land.burning_barrel', cx + 3, cy, 0, 'camp'], ['land.camp_barrier_4', cx - 14, cy - 8, 0, 'camp'], ['land.camp_barrier_4', cx + 14, cy - 8, 0, 'camp'], ['land.camp_barrier_4', cx - 14, cy + 8, 0, 'camp'], ['land.camp_barrier_4', cx + 14, cy + 8, 0, 'camp'], ['vehicles.van_wreck', cx, cy + 12, 90, 'camp'], ['land.generator_floodlight', cx + 8, cy + 3, 0, 'camp'], ['land.portable_toilets_3', cx - 16, cy + 2, 90, 'camp'], ['land.hazard_tape_fence_6', cx - 6, cy - 12, 0, 'camp'], ['land.hazard_tape_fence_6', cx + 6, cy - 12, 0, 'camp'], ['vehicles.pk_workshop_crafts_ambulance', cx + 14, cy + 10, 200, 'camp']);
        items.forEach(function(it){ if (L.pip(pm, it[1], it[2])) prop(it[0], it[1], it[2], it[3], it[4]); }); out.camps++; campKeys[sx + ',' + sy] = 1; });
      /* park centres: a fountain, bandstand, statue or memorial in the middle of a park of 5,000 m2 or more that has no camp */
      F.ways.forEach(function(w){ var t = w.t; if (!w.poly || t.leisure !== 'park') return; var pm = toM(w.c), ar = Math.abs(L.area(pm)); if (ar < 5000) return; var cx = 0, cy = 0, n = 0, i; for (i = 0; i + 1 < pm.length; i += 2){ cx += pm[i]; cy += pm[i + 1]; n++; } cx /= n; cy /= n; var sx = Math.round(cx), sy = Math.round(cy);
        if (campKeys[sx + ',' + sy] || !L.pip(pm, cx, cy) || inAny(cx, cy, 5, null) || h3(sx, sy, 360) > 0.6) return; var r = h3(sx, sy, 361), pc = ar >= 8000 && r < 0.4 ? 'land.fountain_round' : r < 0.65 ? 'land.bandstand' : r < 0.85 ? 'land.statue_plinth' : 'land.war_memorial'; prop(pc, cx, cy, 0, 'centre'); out.parkCentres = (out.parkCentres || 0) + 1; });
      /* a farm at the road corner of a big field (one in three fields of 15,000 m2 or more, one per 1 km cell): farmhouse and barn facing the road, silos, grain bin, hay bales, a pen with a trough, a windmill, a tractor, a drive and a farmyard */
      var farmCells = {};
      F.ways.forEach(function(w){ var t = w.t; if (!w.poly || t.landuse !== 'farmland') return; var pm = toM(w.c), ar = Math.abs(L.area(pm)); if (ar < 15000) return; var sx = Math.round(pm[0]), sy = Math.round(pm[1]); if (h3(sx, sy, 400) > 0.35 || farmCells[Math.floor(pm[0]/1000) + ',' + Math.floor(pm[1]/1000)]) return;
        var best = null, cx = 0, cy = 0, n = 0, i; for (i = 0; i + 1 < pm.length; i += 2){ cx += pm[i]; cy += pm[i + 1]; n++; var rr = nearRoad(pm[i], pm[i + 1], 45); if (rr.length){ rr.sort(function(a, b){ return a.d - b.d; }); if (!best || rr[0].d < best.d) best = {x:pm[i], y:pm[i + 1], d:rr[0].d, s:rr[0].s}; } } if (!best) return; cx /= n; cy /= n;
        var vx = cx - best.x, vy = cy - best.y, vl = Math.hypot(vx, vy) || 1, Cx = best.x + vx/vl*22, Cy = best.y + vy/vl*22, s = best.s, ex = s[2] - s[0], ey = s[3] - s[1], el = Math.hypot(ex, ey) || 1, tt = Math.max(0, Math.min(1, ((Cx - s[0])*ex + (Cy - s[1])*ey)/(el*el))), rx = s[0] + ex*tt, ry = s[1] + ey*tt, fx = rx - Cx, fy = ry - Cy, fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl; var gx = -fy, gy = fx, yawF = yawOf(fx, fy);
        if (fl < 12 || !L.pip(pm, Cx, Cy)) return;
        var PL = [['land.farmhouse_white', -17, 4, 0], ['land.barn_red', 14, -2, 0], ['land.silo_pair', 28, -16, 0], ['land.grain_bin', 6, -20, 0], ['land.hay_bale_round', -4, -10, 40], ['land.hay_bale_round', -7, -12, 80], ['land.hay_bale_stack', -10, -16, 0], ['land.livestock_pen_8', -22, -14, 0], ['land.trough', -22, -8, 0], ['land.farm_windmill', -32, -18, 0]], placed = 0;
        var sgf = L.pip(pm, Cx - gx*20, Cy - gy*20) ? 1 : -1;
        PL.forEach(function(q){ var x = Cx + gx*q[1]*sgf + fx*q[2], y = Cy + gy*q[1]*sgf + fy*q[2]; if (!L.pip(pm, x, y) || inAny(x, y, 1, null) || !clearOfRoads(x, y, 3)) return; prop(q[0], x, y, yawF + q[3], 'farm'); placed++; });
        if (placed < 3) return; var tx = Cx + gx*2 + fx*10, ty = Cy + gy*2 + fy*10; carAt('vehicles.pk_workshop_crafts_farm_tractor', tx, ty, yawF + 90, 'farm', 4);
        var ed = Math.hypot(rx - Cx, ry - Cy), exx = rx - fx*0, eyy = ry - fy*0; wayOut(T.drive, [rx - fx*0 + (Cx - rx)/ed*(s[4] + 0.3), ry + (Cy - ry)/ed*(s[4] + 0.3), Cx + fx*8, Cy + fy*8]);
        var yd = []; [[-40, -30], [20, -30], [20, 14], [-40, 14]].forEach(function(c){ yd.push(Cx + gx*c[0] + fx*c[1], Cy + gy*c[0] + fy*c[1]); }); yd.push(yd[0], yd[1]); wayOut({landuse:'farmyard', generated:'yes', 'asmb:made':'yes', 'asmb:lot':'yes'}, yd, true);
        farmCells[Math.floor(pm[0]/1000) + ',' + Math.floor(pm[1]/1000)] = 1; out.farms = (out.farms || 0) + 1; });
      /* roadblocks: where a main road leaves the town at 1.6 km, one in three: barriers across the road, two wrecks, two burning barrels */
      F.ways.forEach(function(w){
        var t = w.t, half = HALF[t.highway]; if (w.poly || !half || t.bridge || t.tunnel || !(t.highway === 'primary' || t.highway === 'secondary')) return; var m = toM(w.c);
        for (var i = 0; i + 3 < m.length; i += 2){ var sl = Math.hypot(m[i + 2] - m[i], m[i + 3] - m[i + 1]), ns = Math.max(1, Math.ceil(sl/40)), hit = -1, f = 0, k2, x = 0, y = 0;
          for (k2 = 0; k2 < ns; k2++){ var fa = k2/ns, fb = (k2 + 1)/ns, da = Math.hypot(m[i] + (m[i + 2] - m[i])*fa - cenBX, m[i + 1] + (m[i + 3] - m[i + 1])*fa - cenBY), db = Math.hypot(m[i] + (m[i + 2] - m[i])*fb - cenBX, m[i + 1] + (m[i + 3] - m[i + 1])*fb - cenBY); if ((da - 1600)*(db - 1600) < 0){ hit = k2; f = fa + (fb - fa)*(1600 - da)/(db - da); break; } }
          if (hit < 0) continue; x = m[i] + (m[i + 2] - m[i])*f; y = m[i + 1] + (m[i + 3] - m[i + 1])*f; var sx = Math.round(x), sy = Math.round(y); if (h3(sx, sy, 350) > 0.34 || inAny(x, y, 3, null)) continue;
          var dx = m[i + 2] - m[i], dy = m[i + 3] - m[i + 1], dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl; var nx = -dy, ny = dx, yw = yawOf(nx, ny);
          for (var o = -half + 1.5; o <= half - 1.5; o += 3.6) prop(h3(sx, sy, 351 + Math.round(o)) < 0.5 ? 'land.jersey_barrier_3' : 'land.sawhorse_barricade', x + nx*o, y + ny*o, yw, 'roadblock'); prop('land.checkpoint_post', x - dx*3 + nx*(half + 2.2), y - dy*3 + ny*(half + 2.2), yw, 'roadblock'); carAt('vehicles.pk_workshop_crafts_police', x - dx*9 - nx*half*0.4, y - dy*9 - ny*half*0.4, yawOf(dx, dy) + 160, 'roadblock', 3);
          carAt('vehicles.sedan_wreck', x - dx*6 + nx*half*0.45, y - dy*6 + ny*half*0.45, yawOf(dx, dy) + 20, 'roadblock', 3); carAt('vehicles.van_wreck', x + dx*7 - nx*half*0.4, y + dy*7 - ny*half*0.4, yawOf(dx, dy) - 160, 'roadblock', 3);
          prop('land.burning_barrel', x - nx*(half + 1.2), y - ny*(half + 1.2), 0, 'roadblock'); prop('land.burning_barrel', x + nx*(half + 1.2), y + ny*(half + 1.2), 0, 'roadblock'); out.roadblocks++; break; }
      });
      /* ---- landmarks: every 1 km cell with a town in it has one tall thing to see down its streets. A tall building, a tower, a mast, a silo or a
         chimney that is mapped counts; if there is none, a water tower goes in a park or an industrial lot (man_made=water_tower, marked made-up) ---- */
      var CELLK = 1000, cells = new Map(), kk = function(x, y){ return Math.floor(x/CELLK) + ',' + Math.floor(y/CELLK); };
      var cellOf = function(x, y){ var k = kk(x, y), c = cells.get(k); if (!c){ c = {n:0, tall:false, spots:[]}; cells.set(k, c); } return c; };
      bl.forEach(function(b){ var c = cellOf(b.x, b.y); c.n++; if ((b.t.shop || b.t.building === 'retail' || b.t.building === 'commercial' || b.t.building === 'industrial' || b.t.building === 'warehouse') && b.a >= 400 && (!c.big || b.a > c.big.a)) c.big = b; var t = b.t, lv = parseInt(t['building:levels'], 10) || 0, hh = parseFloat(t.height) || 0; if (hh >= 25 || lv >= 8 || t.man_made === 'tower' || (t.amenity === 'place_of_worship' && (hh >= 18 || t.tower_type || t['tower:type']))) c.tall = true; });
      F.pois.forEach(function(p){ var t = p.t; if (!t || !(t.man_made === 'water_tower' || t.man_made === 'tower' || t.man_made === 'mast' || t.man_made === 'silo' || t.man_made === 'chimney' || t.man_made === 'communications_tower' || t['tower:type'])) return; var q = loc.m(p.lon, p.lat); cellOf(q[0], q[1]).tall = true; });
      F.ways.forEach(function(w){
        var t = w.t; if (!w.poly) return;
        if (t.man_made === 'water_tower' || t.man_made === 'silo' || t.man_made === 'chimney' || t.man_made === 'tower'){ var q0 = loc.m(w.c[0], w.c[1]); cellOf(q0[0], q0[1]).tall = true; return; }
        if (!(t.leisure === 'park' || t.landuse === 'industrial' || t.landuse === 'retail' && false)) return;
        var m = [], i, cx = 0, cy = 0, n = 0; for (i = 0; i < w.c.length; i += 2){ var p = loc.m(w.c[i], w.c[i + 1]); m.push(p[0], p[1]); cx += p[0]; cy += p[1]; n++; } if (n < 4) return; cx /= n; cy /= n;
        var ar = Math.abs(L.area(m)); if (ar < 1500 || !L.pip(m, cx, cy)) return;
        cellOf(cx, cy).spots.push({x:cx, y:cy, a:ar, ind:t.landuse === 'industrial'});
      });
      cells.forEach(function(c){
        if (c.n < 15) return; out.landmarks++;
        if (c.tall){ out.tallCells = (out.tallCells || 0) + 1; return; } if (!c.spots.length && c.big){ var bb = c.big, ds = bb.r + 12, dirs = [[bb.ux, bb.uy], [-bb.ux, -bb.uy], [-bb.uy, bb.ux], [bb.uy, -bb.ux]]; for (var di = 0; di < 4; di++){ var tx = bb.x + dirs[di][0]*ds, ty = bb.y + dirs[di][1]*ds; c.spots.push({x:tx, y:ty, a:1, ind:false}); } }
        if (!c.spots.length){ out.noSpot = (out.noSpot || 0) + 1; return; }
        c.spots.sort(function(p, q){ return (q.ind - p.ind) || (q.a - p.a); });
        for (var i = 0; i < c.spots.length; i++){ var sp = c.spots[i]; if (inAny(sp.x, sp.y, 6, null) || !clearOfRoads(sp.x, sp.y, 8)){ out.blocked = (out.blocked || 0) + 1; continue; }
          var pp = ll(sp.x, sp.y); F.pois.push({lon:pp[0], lat:pp[1], t:{man_made:'water_tower', 'tower:type':'water', height:'30', generated:'yes', 'asmb:made':'yes', 'asmb:landmark':'yes'}}); out.towers++; break; }
      });
      out.fenceKm = Math.round(out.fenceKm*10)/10;
      return out;
    };
  };
})();
