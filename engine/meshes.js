/* Shared engine: mesh helpers.
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
/* ================= meshes ================= */
var ROAD_COL = {road:'#4b5059', path:'#b9a57e', water:'#3f86b8', rail:'#2c2f35'};
var FLOOR = {civic:'#a89f8e', house:'#8a6a48', food:'#b9b4a6', shop:'#b9b4a6', medical:'#cfd6d8', police:'#6f7780', industrial:'#8b8b88'};
var COLC = {};
function C(h){ var c = COLC[h]; if (!c){ var n = parseInt(h.slice(1), 16); c = COLC[h] = [n >> 16, (n >> 8) & 255, n & 255]; } return c; }
function Mesh(){ this.p = []; this.c = []; this.t = []; this.al = 255; this.pl = null; this.wt = null; this.yo = 0; }
Mesh.prototype.tri = function(ax,ay,az,bx,by,bz,cx,cy,cz,col,a){
  this.p.push(ax,ay,az,bx,by,bz,cx,cy,cz); var r = col[0], g = col[1], b = col[2]; this.c.push(r,g,b,a,r,g,b,a,r,g,b,a);
  var pl = this.pl; if (pl){ var k = pl[1]; this.t.push(ax*k,az*k,pl[0], bx*k,bz*k,pl[0], cx*k,cz*k,pl[0]); } else this.t.push(0,0,-1, 0,0,-1, 0,0,-1);
};
/* a quad shaded from its first edge (a, b: bottom) to its second (c, d: top), for contact shadows */
Mesh.prototype.quadV = function(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz,c0,c1){
  this.p.push(ax,ay,az,bx,by,bz,cx,cy,cz, ax,ay,az,cx,cy,cz,dx,dy,dz);
  [c0,c0,c1, c0,c1,c1].forEach(function(c){ this.c.push(c[0],c[1],c[2],255); }, this);
  for (var i = 0; i < 6; i++) this.t.push(0,0,-1);
};
Mesh.prototype.quad = function(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz,col,a){ this.tri(ax,ay,az,bx,by,bz,cx,cy,cz,col,a); this.tri(ax,ay,az,cx,cy,cz,dx,dy,dz,col,a); };
/* a quad with its own texture coordinates: P = 4 corners (12 numbers), UV = 4 corners (8 numbers) */
Mesh.prototype.quadUV = function(P, UV, tile, col, a, K){
  var r = col[0], g = col[1], b = col[2], o = [0,1,2, 0,2,3];
  for (var q = 0; q < 6; q++){ var i = o[q], k = K ? K[i] : 1; this.p.push(P[i*3], P[i*3+1], P[i*3+2]); this.c.push(r*k, g*k, b*k, a === 0 && K ? Math.round((1 - k)*0.6*255) : a); this.t.push(UV[i*2], UV[i*2+1], tile); }   /* an outside wall keeps its shading in alpha too, for its inside face */
};
/* textured wall: (x0,z0) is the left end seen from the front; u runs left to right, v0 at the bottom and v1 at the top */
Mesh.prototype.wallT = function(x0,z0,x1,z1,y0,y1,u0,u1,v0,v1,tile,col,a,kL,kR,kB){ var K = kL === undefined ? null : [kL*kB, kR*kB, kR, kL]; this.quadUV([x0,y0,z0, x1,y0,z1, x1,y1,z1, x0,y1,z0], [u0,v0, u1,v0, u1,v1, u0,v1], tile, col, a, K); };
Mesh.prototype.wall = function(x0,z0,x1,z1,y0,y1,col,a){
  var w = this.wt; if (w){ var l = Math.hypot(x1 - x0, z1 - z0), ke = l < 0.3 ? 1 : 0.84; this.wallT(x0,z0,x1,z1,y0,y1, 0, l/w[1], 1 - y0/w[2], 1 - y1/w[2], w[0], col, a, ke, ke, y0 < 0.3 ? 0.9 : 1); }   /* room walls darken toward their ends and the floor */
  else this.quad(x0,y0,z0,x1,y0,z1,x1,y1,z1,x0,y1,z0,col,a);
};
Mesh.prototype.line = function(ax,ay,az,bx,by,bz,col){ this.p.push(ax,ay,az,bx,by,bz); this.c.push(col[0],col[1],col[2],191, col[0],col[1],col[2],191); this.t.push(0,0,-1, 0,0,-1); };
/* an upright textured panel on the side face of a ybox (lateral offset lo), for shelf and fridge fronts */
Mesh.prototype.panel = function(x,z,yaw,lo,y0,y1,hf,tile){
  var c = Math.cos(yaw), s = Math.sin(yaw), bx = x - s*lo, bz = z + c*lo;
  this.wallT(bx - c*hf, bz - s*hf, bx + c*hf, bz + s*hf, y0, y1, 0, 1, 1, 0, tile, [255,255,255], 255);
};
var BF = [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
Mesh.prototype.box = function(cx,cy,cz,X,Y,Z,col){
  var v = [], i, j, k; cy += this.yo;
  for (i = -1; i <= 1; i += 2) for (j = -1; j <= 1; j += 2) for (k = -1; k <= 1; k += 2) v.push(cx + i*X[0] + j*Y[0] + k*Z[0], cy + i*X[1] + j*Y[1] + k*Z[1], cz + i*X[2] + j*Y[2] + k*Z[2]);
  for (i = 0; i < 6; i++){ var f = BF[i], a = f[0]*3, b = f[1]*3, c = f[2]*3, d = f[3]*3; this.quad(v[a],v[a+1],v[a+2],v[b],v[b+1],v[b+2],v[c],v[c+1],v[c+2],v[d],v[d+1],v[d+2],col,this.al); }
};
/* box at ground position (x,z) turned by yaw: fo/lo = forward/sideways offset, hf/hy/hl = half sizes */
Mesh.prototype.ybox = function(x,z,yaw,fo,lo,cy,hf,hy,hl,col){
  var c = Math.cos(yaw), s = Math.sin(yaw);
  this.box(x + c*fo - s*lo, cy, z + s*fo + c*lo, [c*hf,0,s*hf], [0,hy,0], [-s*hl,0,c*hl], col);
};
Mesh.prototype.pyr = function(x,z,y0,r,h,col,rot){ y0 += this.yo;
  for (var k = 0; k < 4; k++){ var a = rot + k*1.5708, b = a + 1.5708; this.tri(x + Math.cos(a)*r, y0, z + Math.sin(a)*r, x + Math.cos(b)*r, y0, z + Math.sin(b)*r, x, y0 + h, z, col, this.al); }
};
function upload(m, old){
  var o = old || {vb:gl.createBuffer(), cb:gl.createBuffer(), tb:gl.createBuffer(), n:0}, mode = old ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
  gl.bindBuffer(gl.ARRAY_BUFFER, o.vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.p), mode);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.cb); gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(m.c), mode);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.tb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.t), mode);
  o.n = m.p.length/3; return o;
}
function freeMesh(o){ gl.deleteBuffer(o.vb); gl.deleteBuffer(o.cb); gl.deleteBuffer(o.tb); }
function earclip(p){
  var n = p.length/2, idx = [], out = [], i, ar = 0, guard = 0;
  for (i = 0; i < n; i++){ idx.push(i); var j = (i+1) % n; ar += p[i*2]*p[j*2+1] - p[j*2]*p[i*2+1]; }
  if (ar < 0) idx.reverse();
  while (idx.length > 3 && guard++ < 20000){
    var ear = false, m = idx.length;
    for (i = 0; i < m; i++){
      var a = idx[(i+m-1) % m], b = idx[i], c = idx[(i+1) % m];
      var ax = p[a*2], ay = p[a*2+1], bx = p[b*2], by = p[b*2+1], cx = p[c*2], cy = p[c*2+1];
      if ((bx-ax)*(cy-ay) - (by-ay)*(cx-ax) <= 1e-9) continue;
      var ok = true;
      for (var q = 0; q < m; q++){
        var k = idx[q]; if (k === a || k === b || k === c) continue;
        var px = p[k*2], py = p[k*2+1];
        var d1 = (bx-ax)*(py-ay) - (by-ay)*(px-ax), d2 = (cx-bx)*(py-by) - (cy-by)*(px-bx), d3 = (ax-cx)*(py-cy) - (ay-cy)*(px-cx);
        if (d1 >= 0 && d2 >= 0 && d3 >= 0){ ok = false; break; }
      }
      if (ok){ out.push(a, b, c); idx.splice(i, 1); ear = true; break; }
    }
    if (!ear) break;
  }
  for (i = 1; i < idx.length - 1; i++) out.push(idx[0], idx[i], idx[i+1]);
  return out;
}

