/* Shared engine: digging (0.99.0).
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, dig, meshes, buildings, interiors, collision, render.
   The ground is a smooth height grid with, below it, soil in blocks 0.5 m square and up to 6 m deep. Nothing is stored for ground nobody has touched:
   a column (0.5 m by 0.5 m) is remembered only once it has been dug (a negative number of blocks) or filled (a positive one). hAt() adds the change,
   so people, trees and props follow the new ground; the terrain mesh is cut away over dug columns by a small mask picture (see render.js) and the
   holes get walls and floors of soil in layers (topsoil, subsoil, clay, limestone) here. Hosts call dgLoad(map) after a world is made, dgApply(list)
   for an edit, and manageDig() / drawDig() each frame (render.js does). */
'use strict';
var DGS = 0.5, DGN = 16, DG_MIN = -12, DG_MAX = 8;
var DG = {cols:new Map(), mesh:new Map(), dirty:new Set(), mask:null, mtex:null, mox:0, moy:0, mdirty:true, on:false};
var DGM_W = 256;   /* the mask covers 256 columns = 128 m round the player */
function dgKey(ix, iy){ return (ix + 32768)*65536 + (iy + 32768); }
function dgIx(k){ return Math.floor(k/65536) - 32768; }
function dgIy(k){ return k % 65536 - 32768; }
function dgVal(ix, iy){ return DG.cols.get(dgKey(ix, iy)) | 0; }
function dgBase(ix, iy){ return hAt0((ix + 0.5)*DGS, (iy + 0.5)*DGS); }
/* how far the ground at (x, y) now stands from the bare ground: 0 where nothing has changed */
function digOff(x, y){
  var ix = Math.floor(x/DGS), iy = Math.floor(y/DGS), v = DG.cols.get(dgKey(ix, iy)); if (!v) return 0;
  return dgBase(ix, iy) + v*DGS - hAt0(x, y);
}
/* the number of blocks dug (negative) or filled (positive) at (x, y) */
function digCol(x, y){ return DG.cols.get(dgKey(Math.floor(x/DGS), Math.floor(y/DGS))) | 0; }
/* set columns: list = [ix, iy, blocks, ix, iy, blocks ...]; blocks 0 puts the column back as it was */
function dgApply(list){
  for (var i = 0; i + 2 < list.length; i += 3){
    var ix = list[i] | 0, iy = list[i+1] | 0, v = Math.max(DG_MIN, Math.min(DG_MAX, list[i+2] | 0)), k = dgKey(ix, iy);
    if (v) DG.cols.set(k, v); else DG.cols.delete(k);
    var cx = Math.floor(ix/DGN), cy = Math.floor(iy/DGN);
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) DG.dirty.add(dgKey(cx + dx, cy + dy));
  }
  DGN_ON(); DG.mdirty = true;
}
function DGN_ON(){ DIGN = DG.cols.size; }   /* DIGN is world.js's switch: 0 means hAt() skips the lookup */
/* a saved map {"ix,iy": blocks} back into the world */
function dgLoad(map){
  DG.cols.clear(); DG.mesh.forEach(function(o){ if (o.g) freeMesh(o.g); }); DG.mesh.clear(); DG.dirty.clear();
  var list = [], k; for (k in (map || {})){ var p = k.split(','); if (p.length === 2 && isFinite(p[0]) && isFinite(p[1]) && isFinite(map[k])) list.push(p[0] | 0, p[1] | 0, map[k] | 0); }
  for (var i = 0; i + 2 < list.length; i += 3) DG.cols.set(dgKey(list[i], list[i+1]), Math.max(DG_MIN, Math.min(DG_MAX, list[i+2])));
  DG.cols.forEach(function(v, key){ var cx = Math.floor(dgIx(key)/DGN), cy = Math.floor(dgIy(key)/DGN); for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) DG.dirty.add(dgKey(cx + dx, cy + dy)); });
  DGN_ON(); DG.mdirty = true;
}
/* the soil's colours by depth below the ground's own surface (metres): topsoil, subsoil, clay, then limestone with chert bands */
var DG_LAYERS = [[0.5, [74, 55, 38]], [1.5, [108, 80, 54]], [3, [150, 108, 72]], [4.5, [150, 144, 128]], [99, [124, 120, 108]]];
function dgLayer(depth, h){
  var c, i; for (i = 0; i < DG_LAYERS.length; i++) if (depth < DG_LAYERS[i][0]){ c = DG_LAYERS[i][1]; break; } if (!c) c = DG_LAYERS[DG_LAYERS.length - 1][1];
  var j = 1 + (h - 0.5)*0.14; return [Math.min(255, c[0]*j), Math.min(255, c[1]*j), Math.min(255, c[2]*j)];
}
var DG_FILL = [118, 90, 60];
function dgBuild(ck){
  var cx = dgIx(ck), cy = dgIy(ck), g = new Mesh(), ix0 = cx*DGN, iy0 = cy*DGN, any = false; g.pl = null;
  var wall = function(ax, az, bx, bz, ya0, ya1, yb0, yb1, col){ g.quad(ax, ya0, az, bx, yb0, bz, bx, yb1, bz, ax, ya1, az, col, 255); };
  var NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (var iy = iy0; iy < iy0 + DGN; iy++) for (var ix = ix0; ix < ix0 + DGN; ix++){
    var v = DG.cols.get(dgKey(ix, iy)); if (!v) continue; any = true;
    var x0 = ix*DGS, z0 = iy*DGS, x1 = x0 + DGS, z1 = z0 + DGS, b = dgBase(ix, iy), top = b + v*DGS, hh = hash(ix, iy, 611), col = v < 0 ? dgLayer(-v*DGS, hh) : DG_FILL.map(function(q){ return q*(0.93 + hh*0.14); });
    g.quad(x0, top, z0, x1, top, z0, x1, top, z1, x0, top, z1, col, 255);
    for (var n = 0; n < 4; n++){
      var dx = NB[n][0], dy = NB[n][1], vN = DG.cols.get(dgKey(ix + dx, iy + dy)) | 0;
      /* the shared edge's two ends */
      var ex0, ez0, ex1, ez1; if (dx === 1){ ex0 = x1; ez0 = z0; ex1 = x1; ez1 = z1; } else if (dx === -1){ ex0 = x0; ez0 = z1; ex1 = x0; ez1 = z0; } else if (dy === 1){ ex0 = x1; ez0 = z1; ex1 = x0; ez1 = z1; } else { ex0 = x0; ez0 = z0; ex1 = x1; ez1 = z0; }
      var tn0, tn1;
      if (vN){ var tN = dgBase(ix + dx, iy + dy) + vN*DGS; tn0 = tn1 = tN; if (top >= tN) continue; }
      else { tn0 = hAt0(ex0, ez0); tn1 = hAt0(ex1, ez1);
        if (v < 0){ if (tn0 <= top && tn1 <= top) continue; }
        else { /* a filled column higher than bare ground: the wall belongs to this column, standing above the ground beside it */
          if (tn0 >= top && tn1 >= top) continue; wall(ex0, ez0, ex1, ez1, Math.min(tn0, top), top, Math.min(tn1, top), top, DG_FILL); continue; } }
      /* a dug column lower than its neighbour: soil in 0.5 m bands up to the neighbour's top */
      var hi = Math.max(tn0, tn1), nb = Math.max(1, Math.ceil((hi - top)/DGS - 1e-6));
      for (var q = 0; q < nb; q++){
        var ya = top + q*DGS, yb = ya + DGS, y0a = Math.min(ya, tn0), y1a = Math.min(yb, tn0), y0b = Math.min(ya, tn1), y1b = Math.min(yb, tn1);
        if (y1a - y0a < 0.002 && y1b - y0b < 0.002) continue;
        wall(ex0, ez0, ex1, ez1, y0a, y1a, y0b, y1b, dgLayer(Math.max(0, b - (ya + yb)/2), hash(ix*3 + q, iy, 612)));
      }
    }
  }
  var old = DG.mesh.get(ck); if (old && old.g) freeMesh(old.g);
  if (any && g.p.length) DG.mesh.set(ck, {g:upload(g), x:(cx + 0.5)*DGN*DGS, y:(cy + 0.5)*DGN*DGS}); else DG.mesh.delete(ck);
}
/* the mask: one byte per column, 255 where the ground is dug away, over 128 m round the player, drawn by the terrain shader to cut the hole */
function dgMask(px, py){
  if (!DG.mtex){ DG.mtex = gl.createTexture(); DG.mask = new Uint8Array(DGM_W*DGM_W); gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, DG.mtex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, DGM_W, DGM_W, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, DG.mask);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0); DG.mdirty = true; DG.mox = 1e9; }
  var cx = Math.round(px/DGS/16)*16, cy = Math.round(py/DGS/16)*16;   /* window origin in columns, moved in steps of 8 m */
  if (Math.abs(cx - DG.mox) > 48 || Math.abs(cy - DG.moy) > 48 || DG.mox === 1e9){ DG.mox = cx; DG.moy = cy; DG.mdirty = true; }
  if (!DG.mdirty) return; DG.mdirty = false; var m = DG.mask, ox = DG.mox - DGM_W/2, oy = DG.moy - DGM_W/2; m.fill(0);
  DG.cols.forEach(function(v, key){ if (v >= 0) return; var i = dgIx(key) - ox, j = dgIy(key) - oy; if (i >= 0 && j >= 0 && i < DGM_W && j < DGM_W) m[j*DGM_W + i] = 255; });
  gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, DG.mtex); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, DGM_W, DGM_W, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, m); gl.activeTexture(gl.TEXTURE0);
}
/* once a frame before the ground is drawn: rebuild a couple of changed chunks and tell the shader about the mask */
function dgPrep(px, py, U){
  if (!DG.cols.size){ gl.uniform1f(U.dmOn, 0); return; }
  var n = 0; DG.dirty.forEach(function(ck){ if (n < 3){ DG.dirty.delete(ck); dgBuild(ck); n++; } });
  dgMask(px, py);
  gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, DG.mtex); gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(U.dmask, 5); gl.uniform1f(U.dmOn, 1); gl.uniform2f(U.dmo, (DG.mox - DGM_W/2)*DGS, (DG.moy - DGM_W/2)*DGS); gl.uniform1f(U.dmS, DGM_W*DGS);
}
function drawDig(px, py){ if (!DG.mesh.size) return; DG.mesh.forEach(function(o){ if (Math.abs(o.x - px) < 90 && Math.abs(o.y - py) < 90) drawMesh(o.g); }); }
/* whether a spot may be dug or filled: bare ground only, not water, a building, a road, a bridge or a tree */
function dgOk(x, y){
  if (!world || !world.hg || buildingAt(x, y) || inWater(x, y, 0.6) || (world.roadOk && !world.roadOk(x, y, 1.2)) || (DK && deckBlock(x, y))) return false;
  if (world.trees){ var T = typeof nearTrees === 'function'; if (T){ var bad = false; nearTrees(x, y, 1.2, function(tr){ if (tr.alive && Math.hypot(tr.x - x, tr.y - y) < tr.r*0.5 + 0.5) bad = true; }); if (bad) return false; } }
  return true;
}
/* the columns of the 1 m square around (x, y), as [ix, iy, ...] */
function dgSquare(x, y){ var ix = Math.round(x/DGS) - 1, iy = Math.round(y/DGS) - 1; return [ix, iy, ix + 1, iy, ix, iy + 1, ix + 1, iy + 1]; }
