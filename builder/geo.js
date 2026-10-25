/* AfterStreet Maps Builder: map projections and geometry helpers. Classic script, installs into L (see inflate.js). */
(window.BLIB = window.BLIB || {}).geo = function(L){
'use strict';
var D2R = Math.PI/180;
/* ---- Transverse Mercator (UTM), GRS80/WGS84 ellipsoid (NAD83 and WGS84 differ by about a metre, well under a terrain cell) ---- */
var A = 6378137, F = 1/298.257222101, E2 = F*(2 - F), EP2 = E2/(1 - E2), K0 = 0.9996;
var M1 = 1 - E2/4 - 3*E2*E2/64 - 5*E2*E2*E2/256, M2 = 3*E2/8 + 3*E2*E2/32 + 45*E2*E2*E2/1024, M3 = 15*E2*E2/256 + 45*E2*E2*E2/1024, M4 = 35*E2*E2*E2/3072;
function merid(phi){ return A*(M1*phi - M2*Math.sin(2*phi) + M3*Math.sin(4*phi) - M4*Math.sin(6*phi)); }
L.tmFwd = function(lon, lat, lon0, k0, fe, fn){
  var phi = lat*D2R, s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi);
  var N = A/Math.sqrt(1 - E2*s*s), T = t*t, C = EP2*c*c, a = c*(lon - lon0)*D2R;
  var x = k0*N*(a + (1 - T + C)*a*a*a/6 + (5 - 18*T + T*T + 72*C - 58*EP2)*Math.pow(a, 5)/120) + fe;
  var y = k0*(merid(phi) + N*t*(a*a/2 + (5 - T + 9*C + 4*C*C)*Math.pow(a, 4)/24 + (61 - 58*T + T*T + 600*C - 330*EP2)*Math.pow(a, 6)/720)) + fn;
  return [x, y];
};
L.tmInv = function(x, y, lon0, k0, fe, fn){
  var M = (y - fn)/k0, mu = M/(A*M1), e1 = (1 - Math.sqrt(1 - E2))/(1 + Math.sqrt(1 - E2));
  var p1 = mu + (3*e1/2 - 27*e1*e1*e1/32)*Math.sin(2*mu) + (21*e1*e1/16 - 55*Math.pow(e1, 4)/32)*Math.sin(4*mu) + (151*e1*e1*e1/96)*Math.sin(6*mu) + (1097*Math.pow(e1, 4)/512)*Math.sin(8*mu);
  var s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1), N1 = A/Math.sqrt(1 - E2*s*s), T1 = t*t, C1 = EP2*c*c, R1 = A*(1 - E2)/Math.pow(1 - E2*s*s, 1.5), d = (x - fe)/(N1*k0);
  var lat = p1 - (N1*t/R1)*(d*d/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*EP2)*Math.pow(d, 4)/24 + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*EP2 - 3*C1*C1)*Math.pow(d, 6)/720);
  var lon = lon0*D2R + (d - (1 + 2*T1 + C1)*d*d*d/6 + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*EP2 + 24*T1*T1)*Math.pow(d, 5)/120)/c;
  return [lon/D2R, lat/D2R];
};
/* an EPSG code to a projection {fwd(lon,lat)->[x,y], inv(x,y)->[lon,lat], name}; null if the builder does not know it */
L.projOf = function(epsg){
  epsg = +epsg;
  var geo = {name:'geographic', fwd:function(lon, lat){ return [lon, lat]; }, inv:function(x, y){ return [x, y]; }, deg:true};
  if ([4326, 4269, 4267, 6318, 4152, 4258, 4283, 4617].indexOf(epsg) >= 0) return geo;
  if (epsg === 3857 || epsg === 900913) return {name:'web mercator', fwd:function(lon, lat){ return [A*lon*D2R, A*Math.log(Math.tan(Math.PI/4 + lat*D2R/2))]; }, inv:function(x, y){ return [x/A/D2R, (2*Math.atan(Math.exp(y/A)) - Math.PI/2)/D2R]; }};
  var zone = 0, south = false;
  if (epsg >= 32601 && epsg <= 32660) zone = epsg - 32600;            /* WGS84 UTM north */
  else if (epsg >= 32701 && epsg <= 32760){ zone = epsg - 32700; south = true; }
  else if (epsg >= 26901 && epsg <= 26923) zone = epsg - 26900;       /* NAD83 UTM */
  else if (epsg >= 6330 && epsg <= 6348) zone = epsg - 6329;          /* NAD83(2011) UTM 1N-19N (6344 = 15N, used by USGS 1 m DEMs in Missouri) */
  else if (epsg >= 3707 && epsg <= 3725) zone = epsg - 3706;          /* NAD83(NSRS2007) UTM */
  else if (epsg >= 25828 && epsg <= 25838) zone = epsg - 25800;       /* ETRS89 UTM */
  if (zone){ var l0 = -183 + 6*zone, fn = south ? 10000000 : 0;
    return {name:'UTM zone ' + zone + (south ? 'S' : 'N'), fwd:function(lon, lat){ return L.tmFwd(lon, lat, l0, K0, 500000, fn); }, inv:function(x, y){ return L.tmInv(x, y, l0, K0, 500000, fn); }}; }
  return null;
};
/* ---- local metres around a centre (the same flat projection the game uses: kx, ky metres per degree) ---- */
L.local = function(lat0, lon0){ var kx = Math.cos(lat0*D2R)*111320, ky = 110540; return {lat0:lat0, lon0:lon0, kx:kx, ky:ky,
  m:function(lon, lat){ return [(lon - lon0)*kx, (lat - lat0)*ky]; }, ll:function(x, y){ return [lon0 + x/kx, lat0 + y/ky]; }}; };
/* ---- geometry ---- */
L.pip = function(ring, x, y){   /* ring: flat [x0,y0,x1,y1,...] */
  var inside = false;
  for (var i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2){
    var xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
    if ((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) inside = !inside;
  }
  return inside;
};
L.area = function(ring){ var a = 0; for (var i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) a += (ring[j] - ring[i])*(ring[j + 1] + ring[i + 1]); return a/2; };
L.segDist = function(px, py, ax, ay, bx, by){ var dx = bx - ax, dy = by - ay, l2 = dx*dx + dy*dy, t = l2 ? Math.max(0, Math.min(1, ((px - ax)*dx + (py - ay)*dy)/l2)) : 0; return Math.hypot(px - ax - dx*t, py - ay - dy*t); };
/* a repeatable random number in 0..1 from some integers (the same mix as tools/build_region.py) */
L.h3 = function(){ var v = 2166136261; for (var i = 0; i < arguments.length; i++){ v = Math.imul(v ^ (arguments[i] | 0), 16777619) >>> 0; } v ^= v >>> 13; v = Math.imul(v, 1274126177) >>> 0; v ^= v >>> 16; return (v >>> 0)/4294967296; };
/* join open ways into closed rings (multipolygon members) */
L.stitch = function(segs){
  var rings = [], left = segs.filter(function(s){ return s && s.length >= 2; }).map(function(s){ return s.slice(); });
  var same = function(a, b){ return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9; };
  while (left.length){
    var r = left.shift(), guard = 0;
    while (!same(r[0], r[r.length - 1]) && guard++ < 10000){
      var hit = -1, rev = false;
      for (var i = 0; i < left.length; i++){ var s = left[i]; if (same(s[0], r[r.length - 1])){ hit = i; break; } if (same(s[s.length - 1], r[r.length - 1])){ hit = i; rev = true; break; } }
      if (hit < 0) break;
      var s2 = left.splice(hit, 1)[0]; if (rev) s2.reverse(); r = r.concat(s2.slice(1));
    }
    if (r.length >= 4 && same(r[0], r[r.length - 1])) rings.push(r);
  }
  return rings;
};
};
