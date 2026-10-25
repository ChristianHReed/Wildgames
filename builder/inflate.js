/* AfterStreet Maps Builder: decompression for map files (zlib/deflate, TIFF LZW, PackBits).
   Classic script. Every builder library is a function that installs itself into a shared object L, so the same code runs on the page
   and inside the background worker (the worker gets the function's source text, which also works when opened from a USB drive). */
(window.BLIB = window.BLIB || {}).inflate = function(L){
'use strict';
/* zlib/deflate: the browser's own DecompressionStream where it exists (Safari 16.4+, Chrome, Firefox), else the small decoder below */
L.inflate = async function(u8, raw){
  if (typeof DecompressionStream !== 'undefined'){
    try {
      var s = new Blob([u8]).stream().pipeThrough(new DecompressionStream(raw ? 'deflate-raw' : 'deflate'));
      return new Uint8Array(await new Response(s).arrayBuffer());
    } catch (e){ /* fall through to the decoders below (a stream error on a slightly odd file) */ }
  }
  if (L.fflate) try { return raw ? L.fflate.inflateSync(u8) : L.fflate.unzlibSync(u8); } catch (e){}   /* fflate (MIT), much faster than the small decoder */
  return inflateJS(u8, raw);
};
/* ---- a plain deflate decoder (RFC 1951), used only when the browser has no DecompressionStream ---- */
var LBASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258], LEXT = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
var DBASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577], DEXT = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
var CLORD = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
function huff(lens, n){
  var count = new Uint16Array(16), offs = new Uint16Array(16), sym = new Uint16Array(n), i;
  for (i = 0; i < n; i++) count[lens[i]]++;
  count[0] = 0; for (i = 1; i < 16; i++) offs[i] = offs[i - 1] + count[i - 1];
  for (i = 0; i < n; i++) if (lens[i]) sym[offs[lens[i]]++] = i;
  return {count:count, sym:sym};
}
function inflateJS(src, raw){
  var pos = raw ? 0 : 2, bit = 0, bitn = 0, out = new Uint8Array(Math.max(1024, src.length*4)), op = 0;
  function need(n){ while (bitn < n){ if (pos >= src.length) throw new Error('compressed data ends early'); bit |= src[pos++] << bitn; bitn += 8; } }
  function bits(n){ need(n); var v = bit & ((1 << n) - 1); bit >>>= n; bitn -= n; return v; }
  function grow(n){ if (op + n <= out.length) return; var o = new Uint8Array(Math.max(out.length*2, op + n)); o.set(out); out = o; }
  function decode(h){
    var code = 0, first = 0, index = 0;
    for (var len = 1; len < 16; len++){
      code |= bits(1); var c = h.count[len];
      if (code - c < first) return h.sym[index + (code - first)];
      index += c; first += c; first <<= 1; code <<= 1;
    }
    throw new Error('bad compressed data');
  }
  var fixedL, fixedD;
  for (;;){
    var last = bits(1), type = bits(2);
    if (type === 0){
      bit = 0; bitn = 0; var len = src[pos] | (src[pos + 1] << 8); pos += 4; grow(len); out.set(src.subarray(pos, pos + len), op); op += len; pos += len;
    } else {
      var hl, hd;
      if (type === 1){
        if (!fixedL){ var l = new Uint8Array(288), i; for (i = 0; i < 144; i++) l[i] = 8; for (; i < 256; i++) l[i] = 9; for (; i < 280; i++) l[i] = 7; for (; i < 288; i++) l[i] = 8; fixedL = huff(l, 288); var d = new Uint8Array(30).fill(5); fixedD = huff(d, 30); }
        hl = fixedL; hd = fixedD;
      } else if (type === 2){
        var nl = bits(5) + 257, nd = bits(5) + 1, nc = bits(4) + 4, cl = new Uint8Array(19), k;
        for (k = 0; k < nc; k++) cl[CLORD[k]] = bits(3);
        var ch = huff(cl, 19), lens = new Uint8Array(nl + nd); k = 0;
        while (k < nl + nd){
          var s = decode(ch);
          if (s < 16) lens[k++] = s;
          else { var rep = 0, val = 0; if (s === 16){ val = lens[k - 1]; rep = 3 + bits(2); } else if (s === 17) rep = 3 + bits(3); else rep = 11 + bits(7); while (rep--) lens[k++] = val; }
        }
        hl = huff(lens.subarray(0, nl), nl); hd = huff(lens.subarray(nl), nd);
      } else throw new Error('bad compressed block');
      for (;;){
        var sy = decode(hl);
        if (sy < 256){ grow(1); out[op++] = sy; }
        else if (sy === 256) break;
        else {
          sy -= 257; var ln = LBASE[sy] + bits(LEXT[sy]), ds = decode(hd), dist = DBASE[ds] + bits(DEXT[ds]);
          grow(ln); for (var q = 0; q < ln; q++){ out[op] = out[op - dist]; op++; }
        }
      }
    }
    if (last) break;
  }
  return out.subarray(0, op);
}
L.inflateJS = inflateJS;
/* TIFF LZW (compression 5): MSB-first codes, 9 to 12 bits, early change */
L.lzw = function(src, expect){
  var out = new Uint8Array(expect || src.length*3), op = 0, dict = new Array(4096), dlen = new Uint16Array(4096), next = 258, width = 9, bitpos = 0, prev = -1, n = src.length*8;
  function grow(k){ if (op + k <= out.length) return; var o = new Uint8Array(Math.max(out.length*2, op + k)); o.set(out); out = o; }
  for (var i = 0; i < 256; i++){ dict[i] = new Uint8Array([i]); dlen[i] = 1; }
  while (bitpos + width <= n){
    var code = 0, b = bitpos;
    for (var k = 0; k < width; k++, b++) code = (code << 1) | ((src[b >> 3] >> (7 - (b & 7))) & 1);
    bitpos += width;
    if (code === 256){ next = 258; width = 9; prev = -1; continue; }
    if (code === 257) break;
    var entry;
    if (code < next && dict[code]) entry = dict[code];
    else if (prev >= 0){ var p = dict[prev]; entry = new Uint8Array(p.length + 1); entry.set(p); entry[p.length] = p[0]; }
    else throw new Error('bad LZW data');
    grow(entry.length); out.set(entry, op); op += entry.length;
    if (prev >= 0 && next < 4096){ var pp = dict[prev], ne = new Uint8Array(pp.length + 1); ne.set(pp); ne[pp.length] = entry[0]; dict[next] = ne; next++; }
    prev = code;
    if (next + 1 >= (1 << width) && width < 12) width++;
  }
  return out.subarray(0, op);
};
/* PackBits (compression 32773) */
L.packbits = function(src, expect){
  var out = new Uint8Array(expect), op = 0, i = 0;
  while (i < src.length && op < expect){
    var n = src[i++]; if (n > 127) n -= 256;
    if (n >= 0){ out.set(src.subarray(i, i + n + 1), op); op += n + 1; i += n + 1; }
    else if (n !== -128){ out.fill(src[i++], op, op + 1 - n); op += 1 - n; }
  }
  return out;
};
/* CRC-32, for the map file (zip) */
var CRCT = null;
L.crc32 = function(u8, c){
  if (!CRCT){ CRCT = new Uint32Array(256); for (var n = 0; n < 256; n++){ var v = n; for (var k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1; CRCT[n] = v >>> 0; } }
  c = (c === undefined ? 0 : c) ^ 0xFFFFFFFF;
  for (var i = 0; i < u8.length; i++) c = CRCT[(c ^ u8[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};
};
