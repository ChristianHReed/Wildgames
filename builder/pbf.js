/* AfterStreet Maps Builder: OpenStreetMap PBF reader (.osm.pbf, the format Geofabrik's state files use).
   Reads the file in pieces, so a 200 MB state file never sits in memory at once. Classic script, installs into L (see inflate.js). */
(window.BLIB = window.BLIB || {}).pbf = function(L){
'use strict';
var TD = new TextDecoder();
function P(b, p, e){ this.b = b; this.p = p || 0; this.e = e === undefined ? b.length : e; }
P.prototype.v = function(){   /* varint as a Number (exact up to 2^53, enough for OSM ids) */
  var b = this.b, c = b[this.p++], r = c & 127; if (c < 128) return r;
  var s = 128; do { c = b[this.p++]; r += (c & 127)*s; s *= 128; } while (c >= 128);
  return r;
};
P.prototype.z = function(){ var n = this.v(); return n % 2 ? -(n + 1)/2 : n/2; };
P.prototype.skip = function(wt){ if (wt === 0) this.v(); else if (wt === 1) this.p += 8; else if (wt === 2){ var n = this.v(); this.p += n; } else if (wt === 5) this.p += 4; else throw new Error('bad PBF data'); };
P.prototype.sub = function(){ var n = this.v(), s = new P(this.b, this.p, this.p + n); this.p += n; return s; };
P.prototype.bytes = function(){ var n = this.v(), s = this.b.subarray(this.p, this.p + n); this.p += n; return s; };
function packed(p, zig){ var s = p.sub(), out = []; while (s.p < s.e) out.push(zig ? s.z() : s.v()); return out; }

/* the file, read through a window of a few megabytes */
function Win(file){ this.f = file; this.off = 0; this.buf = new Uint8Array(0); this.bufOff = 0; }
Win.prototype.get = async function(off, n){
  if (off >= this.bufOff && off + n <= this.bufOff + this.buf.length) return this.buf.subarray(off - this.bufOff, off - this.bufOff + n);
  var want = Math.max(n, 8 << 20), end = Math.min(this.f.size, off + want);
  this.buf = new Uint8Array(await this.f.slice(off, end).arrayBuffer()); this.bufOff = off;
  if (this.buf.length < n) throw new Error('the file ends early');
  return this.buf.subarray(0, n);
};

/* decode one PrimitiveBlock and hand nodes, ways and relations to the callbacks.
   cb.node(id, lat, lon, tags|null), cb.way(id, tags, refs), cb.rel(id, tags, members[[type, ref, role]]); any can be left out */
function block(u8, cb){
  var p = new P(u8), strs = [], groups = [], gran = 100, latOff = 0, lonOff = 0;
  while (p.p < p.e){
    var k = p.v(), f = Math.floor(k/8), wt = k & 7;
    if (f === 1 && wt === 2){ var s = p.sub(); while (s.p < s.e){ var kk = s.v(); if ((kk >> 3) === 1) strs.push(TD.decode(s.bytes())); else s.skip(kk & 7); } }
    else if (f === 2 && wt === 2){ var n = p.v(); groups.push([p.p, p.p + n]); p.p += n; }
    else if (f === 17) gran = p.v();
    else if (f === 19) latOff = p.v();   /* int64, almost always 0 */
    else if (f === 20) lonOff = p.v();
    else p.skip(wt);
  }
  if (latOff > 4.6e18) latOff -= 18446744073709551616; if (lonOff > 4.6e18) lonOff -= 18446744073709551616;   /* negative int64 */
  var g9 = gran*1e-9, la0 = latOff*1e-9, lo0 = lonOff*1e-9;
  function tagsOf(keys, vals){ if (!keys.length) return null; var t = {}; for (var i = 0; i < keys.length; i++) t[strs[keys[i]]] = strs[vals[i]]; return t; }
  for (var gi = 0; gi < groups.length; gi++){
    var g = new P(u8, groups[gi][0], groups[gi][1]);
    while (g.p < g.e){
      var kg = g.v(), fg = Math.floor(kg/8), wg = kg & 7;
      if (fg === 2 && wg === 2 && cb.node){   /* dense nodes */
        var d = g.sub(), ids = null, lats = null, lons = null, kv = null;
        while (d.p < d.e){ var kd = d.v(), fd = Math.floor(kd/8); if (fd === 1) ids = packed(d, true); else if (fd === 8) lats = packed(d, true); else if (fd === 9) lons = packed(d, true); else if (fd === 10) kv = packed(d, false); else d.skip(kd & 7); }
        var id = 0, la = 0, lo = 0, ki = 0;
        for (var i = 0; i < (ids ? ids.length : 0); i++){
          id += ids[i]; la += lats[i]; lo += lons[i]; var t = null;
          if (kv && ki < kv.length){ if (kv[ki] !== 0){ t = {}; while (kv[ki] !== 0){ t[strs[kv[ki]]] = strs[kv[ki + 1]]; ki += 2; } } ki++; }
          cb.node(id, la0 + la*g9, lo0 + lo*g9, t);
        }
      } else if (fg === 1 && wg === 2 && cb.node){   /* plain nodes */
        var nd = g.sub(), nid = 0, nla = 0, nlo = 0, nk = [], nv = [];
        while (nd.p < nd.e){ var kn = nd.v(), fn = Math.floor(kn/8); if (fn === 1) nid = nd.z(); else if (fn === 2) nk = packed(nd); else if (fn === 3) nv = packed(nd); else if (fn === 8) nla = nd.z(); else if (fn === 9) nlo = nd.z(); else nd.skip(kn & 7); }
        cb.node(nid, la0 + nla*g9, lo0 + nlo*g9, tagsOf(nk, nv));
      } else if (fg === 3 && wg === 2 && cb.way){
        var w = g.sub(), wid = 0, wk = [], wv = [], refs = [];
        while (w.p < w.e){ var kw = w.v(), fw = Math.floor(kw/8); if (fw === 1) wid = w.v(); else if (fw === 2) wk = packed(w); else if (fw === 3) wv = packed(w); else if (fw === 8) refs = packed(w, true); else w.skip(kw & 7); }
        for (var r = 1; r < refs.length; r++) refs[r] += refs[r - 1];
        cb.way(wid, tagsOf(wk, wv) || {}, refs);
      } else if (fg === 4 && wg === 2 && cb.rel){
        var rl = g.sub(), rid = 0, rk = [], rv = [], roles = [], mem = [], types = [];
        while (rl.p < rl.e){ var kr = rl.v(), fr = Math.floor(kr/8); if (fr === 1) rid = rl.v(); else if (fr === 2) rk = packed(rl); else if (fr === 3) rv = packed(rl); else if (fr === 8) roles = packed(rl); else if (fr === 9) mem = packed(rl, true); else if (fr === 10) types = packed(rl); else rl.skip(kr & 7); }
        var m = [], ref = 0; for (var mi = 0; mi < mem.length; mi++){ ref += mem[mi]; m.push([types[mi] === 0 ? 'n' : types[mi] === 1 ? 'w' : 'r', ref, strs[roles[mi]] || '']); }
        cb.rel(rid, tagsOf(rk, rv) || {}, m);
      } else g.skip(wg);
    }
  }
}

/* read every data block of the file; progress(fraction) is called as it goes; stop() returning true ends early */
L.pbfRead = async function(file, cb, progress, stop){
  var win = new Win(file), off = 0, size = file.size, nb = 0;
  while (off < size){
    if (stop && stop()) throw new Error('stopped');
    var hl = new DataView((await win.get(off, 4)).slice().buffer).getInt32(0, false); off += 4;
    if (hl <= 0 || hl > 65536) throw new Error('this does not look like an OpenStreetMap .pbf file');
    var hp = new P((await win.get(off, hl)).slice()), type = '', dsize = 0; off += hl;
    while (hp.p < hp.e){ var k = hp.v(), f = k >> 3; if (f === 1) type = TD.decode(hp.bytes()); else if (f === 3) dsize = hp.v(); else hp.skip(k & 7); }
    var bp = new P((await win.get(off, dsize)).slice()), raw = null, z = null, rawSize = 0; off += dsize;
    if (type !== 'OSMData'){ nb++; continue; }
    while (bp.p < bp.e){ var kb = bp.v(), fb = kb >> 3; if (fb === 1) raw = bp.bytes(); else if (fb === 2) rawSize = bp.v(); else if (fb === 3) z = bp.bytes(); else if (fb === 4 || fb === 6 || fb === 7) throw new Error('this .pbf uses a compression the builder does not read (lzma, lz4 or zstd); use a Geofabrik file'); else bp.skip(kb & 7); }
    var data = raw || (z ? await L.inflate(z) : null);
    if (data) block(data, cb);
    nb++; if (progress && nb % 8 === 0) progress(off/size);
  }
  if (progress) progress(1);
};
L.pbfBlock = block;
};
