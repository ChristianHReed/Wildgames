/* AfterStreet Maps Builder: GeoTIFF elevation reader (USGS 3DEP 1 m and 1/3 arc-second DEMs, and most other elevation GeoTIFFs).
   Reads only the parts of the file it needs, and uses a file's smaller overview copies when a coarser terrain grid is enough.
   Handles classic and Big TIFF, tiles or strips, no compression, deflate, LZW and PackBits, predictors 2 and 3, 8 to 64-bit samples.
   Classic script, installs into L (see inflate.js). Needs geo.js. */
(window.BLIB = window.BLIB || {}).tiff = function(L){
'use strict';
var TSZ = {1:1, 2:1, 3:2, 4:4, 5:8, 6:1, 7:1, 8:2, 9:4, 10:8, 11:4, 12:8, 16:8, 17:8, 18:8};
async function bytes(file, off, n){ return new Uint8Array(await file.slice(off, off + n).arrayBuffer()); }
function rd(dv, off, type, le){
  switch (type){
    case 1: case 2: case 7: return dv.getUint8(off); case 6: return dv.getInt8(off);
    case 3: return dv.getUint16(off, le); case 8: return dv.getInt16(off, le);
    case 4: return dv.getUint32(off, le); case 9: return dv.getInt32(off, le);
    case 5: return dv.getUint32(off, le)/dv.getUint32(off + 4, le); case 10: return dv.getInt32(off, le)/dv.getInt32(off + 4, le);
    case 11: return dv.getFloat32(off, le); case 12: return dv.getFloat64(off, le);
    case 16: case 18: return dv.getUint32(off, le) + dv.getUint32(off + 4, le)*4294967296;
    case 17: return dv.getUint32(off, le) + dv.getInt32(off + 4, le)*4294967296;
  }
  return 0;
}
L.tiffOpen = async function(file){
  var h = await bytes(file, 0, 16), dv = new DataView(h.buffer), le;
  if (h[0] === 0x49 && h[1] === 0x49) le = true; else if (h[0] === 0x4D && h[1] === 0x4D) le = false; else throw new Error('not a TIFF file');
  var magic = dv.getUint16(2, le), big = magic === 43; if (magic !== 42 && !big) throw new Error('not a TIFF file');
  var next = big ? rd(dv, 8, 16, le) : dv.getUint32(4, le), ifds = [], guard = 0;
  while (next && guard++ < 64){
    var cntB = await bytes(file, next, big ? 8 : 2), cdv = new DataView(cntB.buffer), n = big ? rd(cdv, 0, 16, le) : cdv.getUint16(0, le);
    var es = big ? 20 : 12, eb = await bytes(file, next + (big ? 8 : 2), n*es + (big ? 8 : 4)), edv = new DataView(eb.buffer), tags = {};
    for (var i = 0; i < n; i++){
      var o = i*es, tag = edv.getUint16(o, le), type = edv.getUint16(o + 2, le), count = big ? rd(edv, o + 4, 16, le) : edv.getUint32(o + 4, le);
      var sz = (TSZ[type] || 1)*count, inl = big ? 8 : 4, vdv = edv, voff = o + (big ? 12 : 8);
      if (sz > inl){ var at = big ? rd(edv, voff, 16, le) : edv.getUint32(voff, le); if (sz > 64 << 20) continue; var vb = await bytes(file, at, sz); vdv = new DataView(vb.buffer); voff = 0; }
      if (type === 2){ var s = ''; for (var k = 0; k < count; k++){ var ch = vdv.getUint8(voff + k); if (ch) s += String.fromCharCode(ch); } tags[tag] = s; }
      else { var arr = new Array(count); for (var k2 = 0; k2 < count; k2++) arr[k2] = rd(vdv, voff + k2*(TSZ[type] || 1), type, le); tags[tag] = count === 1 ? arr[0] : arr; }
    }
    ifds.push(tags);
    next = big ? rd(edv, n*es, 16, le) : edv.getUint32(n*es, le);
  }
  if (!ifds.length) throw new Error('the TIFF has no images');
  var t0 = ifds[0], arr = function(v){ return Array.isArray(v) ? v : v === undefined ? [] : [v]; };
  /* where it is: tie point + pixel scale, or a transformation matrix */
  var sx, sy, tx, ty, ti = 0, tj = 0;
  if (t0[33550] && t0[33922]){ var sc = arr(t0[33550]), tp = arr(t0[33922]); sx = sc[0]; sy = sc[1]; ti = tp[0]; tj = tp[1]; tx = tp[3]; ty = tp[4]; }
  else if (t0[34264]){ var m = arr(t0[34264]); sx = m[0]; sy = -m[5]; tx = m[3]; ty = m[7]; }
  else throw new Error('this TIFF has no map position (it is a picture, not a GeoTIFF)');
  /* which projection: GeoKey directory */
  var gk = {}, kd = arr(t0[34735]), dbl = arr(t0[34736]);
  for (var q = 4; q + 3 < kd.length; q += 4){ var key = kd[q], loc = kd[q + 1], val = kd[q + 3]; gk[key] = loc === 0 ? val : loc === 34736 ? dbl[val] : val; }
  var model = gk[1024], epsg = model === 2 ? (gk[2048] || 4326) : (gk[3072] || (model === 1 ? 0 : 4326)), proj = L.projOf(epsg);
  if (!proj){
    if (model === 1 && gk[3075] === 1 && gk[3080] !== undefined) proj = null;   /* user-defined transverse mercator could be added here */
    throw new Error('this elevation file uses a map projection the builder does not read yet' + (epsg ? ' (EPSG ' + epsg + ')' : '') + '. USGS 3DEP files (UTM or geographic) work.');
  }
  var unit = gk[3076] === 9002 ? 0.3048 : gk[3076] === 9003 ? 1200/3937 : 1;   /* coordinates in feet */
  var area = gk[1025] !== 2;   /* PixelIsArea (default) or PixelIsPoint */
  var nodata = t0[42113] !== undefined && t0[42113] !== '' ? parseFloat(t0[42113]) : NaN;
  var W0 = t0[256], H0 = t0[257];
  var levels = ifds.filter(function(t, i){ return i === 0 || ((t[254] | 0) & 1) && t[256] && t[256] < W0; }).map(function(t){
    var tiled = !!t[322];
    return {w:t[256], h:t[257], tiled:tiled, tw:tiled ? t[322] : t[256], th:tiled ? t[323] : (t[278] || t[257]), offs:arr(tiled ? t[324] : t[273]), cnts:arr(tiled ? t[325] : t[279]),
      comp:t[259] || 1, pred:t[317] || 1, bps:arr(t[258])[0] || 8, fmt:arr(t[339])[0] || 1, spp:t[277] || 1, planar:t[284] || 1, scale:W0/t[256]};
  });
  levels.forEach(function(lv){ if ([1, 5, 8, 32946, 32773].indexOf(lv.comp) < 0) throw new Error('this TIFF uses a compression the builder does not read (' + lv.comp + ')'); });
  var T = {name:file.name, epsg:epsg, proj:proj, levels:levels, nodata:nodata, le:le, file:file, cache:new Map(), cacheBytes:0, lv:levels[0]};
  /* pixel centre coordinates (full resolution) of a lon/lat */
  T.pix = function(lon, lat){
    var p = proj.fwd(lon, lat), x = p[0]/unit, y = p[1]/unit, i = (x - tx)/sx + ti, j = (ty - y)/sy + tj;
    return area ? [i - 0.5, j - 0.5] : [i, j];
  };
  T.ll = function(i, j){ if (area){ i += 0.5; j += 0.5; } var x = (tx + (i - ti)*sx)*unit, y = (ty - (j - tj)*sy)*unit; return proj.inv(x, y); };
  /* outline in lon/lat */
  var w = 1e9, s = 1e9, e = -1e9, nn = -1e9;
  for (var a = 0; a <= 8; a++){ [[a/8*W0, 0], [a/8*W0, H0], [0, a/8*H0], [W0, a/8*H0]].forEach(function(c){ var ll = T.ll(c[0] - 0.5, c[1] - 0.5); w = Math.min(w, ll[0]); e = Math.max(e, ll[0]); s = Math.min(s, ll[1]); nn = Math.max(nn, ll[1]); }); }
  T.bbox = [w, s, e, nn];
  var c0 = T.ll(W0/2, H0/2), c1 = T.ll(W0/2 + 1, H0/2);
  T.res = Math.hypot((c1[0] - c0[0])*111320*Math.cos(c0[1]*Math.PI/180), (c1[1] - c0[1])*110540);   /* metres per pixel */
  T.covers = function(lon, lat){ var p = T.pix(lon, lat); return p[0] >= -0.5 && p[1] >= -0.5 && p[0] <= W0 - 0.5 && p[1] <= H0 - 0.5; };
  /* get ready to sample a box at about `res` metres: pick the level, load its pieces */
  T.prepare = async function(bw, bs, be, bn, res){
    var lv = levels[0]; for (var k = 1; k < levels.length; k++) if (T.res*levels[k].scale <= res/1.5) lv = levels[k];
    T.lv = lv;
    var i0 = 1e9, j0 = 1e9, i1 = -1e9, j1 = -1e9;
    for (var a = 0; a <= 4; a++) for (var b = 0; b <= 4; b++){ var p = T.pix(bw + (be - bw)*a/4, bs + (bn - bs)*b/4); i0 = Math.min(i0, p[0]); i1 = Math.max(i1, p[0]); j0 = Math.min(j0, p[1]); j1 = Math.max(j1, p[1]); }
    i0 = Math.max(0, Math.floor(i0/lv.scale) - 2); j0 = Math.max(0, Math.floor(j0/lv.scale) - 2); i1 = Math.min(lv.w - 1, Math.ceil(i1/lv.scale) + 2); j1 = Math.min(lv.h - 1, Math.ceil(j1/lv.scale) + 2);
    if (i1 < i0 || j1 < j0) return false;
    var across = Math.ceil(lv.w/lv.tw), want = [];
    for (var cy = Math.floor(j0/lv.th); cy <= Math.floor(j1/lv.th); cy++) for (var cx = Math.floor(i0/lv.tw); cx <= Math.floor(i1/lv.tw); cx++) want.push(cy*across + cx);
    for (var q = 0; q < want.length; q++) await chunk(lv, want[q]);
    return true;
  };
  async function chunk(lv, k){
    var key = levels.indexOf(lv) + ':' + k, got = T.cache.get(key);
    if (got){ T.cache.delete(key); T.cache.set(key, got); return got; }   /* most recently used last */
    var off = lv.offs[k], cnt = lv.cnts[k], rows = lv.tiled ? lv.th : Math.min(lv.th, lv.h - Math.floor(k)*lv.th), cols = lv.tw;
    var bpp = lv.bps/8, spp = lv.planar === 1 ? lv.spp : 1, expect = cols*rows*bpp*spp, out;
    if (!cnt || off === undefined){ out = new Float32Array(cols*rows).fill(NaN); }
    else {
      var raw = await bytes(T.file, off, cnt), d;
      if (lv.comp === 1) d = raw; else if (lv.comp === 5) d = L.lzw(raw, expect); else if (lv.comp === 32773) d = L.packbits(raw, expect); else d = await L.inflate(raw);
      if (d.length < expect){ var dd = new Uint8Array(expect); dd.set(d); d = dd; }
      out = decode(d, lv, cols, rows, bpp, spp);
    }
    T.cache.set(key, out); T.cacheBytes += out.length*4;
    while (T.cacheBytes > (96 << 20) && T.cache.size > 1){ var first = T.cache.keys().next().value; T.cacheBytes -= T.cache.get(first).length*4; T.cache.delete(first); }
    return out;
  }
  function decode(d, lv, cols, rows, bpp, spp){
    var n = cols*rows, out = new Float32Array(n), le2 = T.le;
    if (lv.pred === 3){   /* floating point predictor: undo byte differencing per row, then put the bytes back in order */
      var rowB = cols*bpp*spp, tmp = new Uint8Array(rowB), fixed = new Uint8Array(d.length);
      for (var r = 0; r < rows; r++){
        var base = r*rowB; for (var b = spp; b < rowB; b++) d[base + b] = (d[base + b] + d[base + b - spp]) & 255;
        tmp.set(d.subarray(base, base + rowB)); var wn = cols*spp;
        for (var i = 0; i < wn; i++) for (var bb = 0; bb < bpp; bb++) fixed[base + i*bpp + (bpp - 1 - bb)] = tmp[bb*wn + i];
      }
      d = fixed; le2 = true;
    }
    var dv = new DataView(d.buffer, d.byteOffset, d.byteLength), st = bpp*spp, get;
    if (lv.fmt === 3) get = bpp === 8 ? function(o){ return dv.getFloat64(o, le2); } : function(o){ return dv.getFloat32(o, le2); };
    else if (lv.fmt === 2) get = bpp === 1 ? function(o){ return dv.getInt8(o); } : bpp === 2 ? function(o){ return dv.getInt16(o, le2); } : function(o){ return dv.getInt32(o, le2); };
    else get = bpp === 1 ? function(o){ return dv.getUint8(o); } : bpp === 2 ? function(o){ return dv.getUint16(o, le2); } : function(o){ return dv.getUint32(o, le2); };
    for (var i2 = 0; i2 < n; i2++) out[i2] = get(i2*st);
    if (lv.pred === 2 && lv.fmt !== 3){   /* horizontal differencing, modulo the sample size */
      var M = Math.pow(2, lv.bps), H = M/2, sgn = lv.fmt === 2;
      for (var r2 = 0; r2 < rows; r2++) for (var c = 1; c < cols; c++){ var v2 = out[r2*cols + c] + out[r2*cols + c - 1]; v2 = sgn ? ((v2 + H) % M + M) % M - H : (v2 % M + M) % M; out[r2*cols + c] = v2; }
    }
    if (!isNaN(T.nodata)) for (var i3 = 0; i3 < n; i3++) if (out[i3] === T.nodata || Math.abs(out[i3] - T.nodata) < 1e-3*Math.max(1, Math.abs(T.nodata))) out[i3] = NaN;
    for (var i4 = 0; i4 < n; i4++) if (out[i4] < -1000 || out[i4] > 9000) out[i4] = NaN;   /* no ground on Earth is outside this */
    return out;
  }
  /* height at a lon/lat from the prepared level, bilinear; NaN where the file has no data */
  T.at = function(lon, lat){
    var lv = T.lv, p = T.pix(lon, lat), u = (p[0] + 0.5)/lv.scale - 0.5, v = (p[1] + 0.5)/lv.scale - 0.5;
    if (u < -0.5 || v < -0.5 || u > lv.w - 0.5 || v > lv.h - 0.5) return NaN;
    u = Math.max(0, Math.min(lv.w - 1.0001, u)); v = Math.max(0, Math.min(lv.h - 1.0001, v));
    var i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, sum = 0, wsum = 0, across = Math.ceil(lv.w/lv.tw), li = levels.indexOf(lv);
    for (var b = 0; b < 2; b++) for (var a = 0; a < 2; a++){
      var x = i + a, y = j + b, k = Math.floor(y/lv.th)*across + Math.floor(x/lv.tw), c = T.cache.get(li + ':' + k);
      if (!c) continue; var val = c[(y - Math.floor(y/lv.th)*lv.th)*lv.tw + (x - Math.floor(x/lv.tw)*lv.tw)];
      if (val !== val) continue; var wt = (a ? fu : 1 - fu)*(b ? fv : 1 - fv) + 1e-6; sum += val*wt; wsum += wt;
    }
    return wsum ? sum/wsum : NaN;
  };
  T.free = function(){ T.cache.clear(); T.cacheBytes = 0; };
  return T;
};
};
