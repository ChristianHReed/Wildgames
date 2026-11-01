'use strict';
/* Afterstreet voxel core (0.114.52). The base the whole game is meant to stand on: one grid of 0.5 m blocks, one material table, and every rule (drawing, walking, digging, burning,
   getting wet, falling) reads the same cells, so nothing can disagree about where the ground is. No page code in here (no DOM, no GL): voxel.html draws it and tests it,
   and the game will use it the same way. Design and open questions: docs/VOXEL.md.
   Grid: x east, y up, z south (the game's map y). A cell (ix, iy, iz) covers [ix, ix+1) * S metres each way. Chunks are 16 x 16 x 16 cells (8 m). */
var VOX = (function(){
  var S = 0.5, CS = 16, MAT = [], NAMES = {};
  /* ---- the material table: the one place that says what a block is ----
     hard: seconds to break by hand; tool: which tool is right for it ('any' = no preference); speed: walking speed multiplier on top of it; loud: footstep loudness 0 to 1;
     burn: catches fire; wet: becomes this material in rain; dry: becomes this when it dries; str: how many cells it can span without ground under it (ground: 1 = natural, always held);
     fall: granular, drops when nothing is under it; liquid / solid / glass flags drive collision and drawing */
  function mat(id, name, o){ var m = {id:id, name:name, solid:true, liquid:false, glass:false, ground:0, hard:1, tool:'any', drops:id, speed:1, loud:0.4, burn:0, wet:0, dry:0, str:99, fall:0, color:[200, 200, 200]}; for (var k in o) m[k] = o[k]; MAT[id] = m; NAMES[name] = id; }
  mat(0, 'air', {solid:false, hard:0, color:[0, 0, 0], drops:0});
  mat(1, 'grass', {ground:1, hard:0.6, tool:'shovel', color:[96, 146, 66], wet:8, drops:2, loud:0.3});
  mat(2, 'topsoil', {ground:1, hard:0.6, tool:'shovel', color:[112, 84, 58], wet:8, loud:0.3});
  mat(3, 'subsoil', {ground:1, hard:0.9, tool:'shovel', color:[134, 102, 72]});
  mat(4, 'clay', {ground:1, hard:1.4, tool:'shovel', color:[164, 112, 86], speed:0.92});
  mat(5, 'limestone', {ground:1, hard:4, tool:'pick', color:[192, 186, 172], loud:0.8});
  mat(6, 'gravel', {ground:1, hard:0.7, tool:'shovel', color:[142, 138, 130], fall:1, loud:1, speed:0.95});
  mat(7, 'sand', {ground:1, hard:0.5, tool:'shovel', color:[220, 198, 142], fall:1, loud:0.3, speed:0.85});
  mat(8, 'mud', {ground:1, hard:0.7, tool:'shovel', color:[88, 66, 48], speed:0.55, loud:0.15, dry:2});
  mat(9, 'water', {solid:false, liquid:true, hard:0, color:[58, 112, 152], speed:0.6, drops:0});
  mat(10, 'wood', {hard:1.5, tool:'axe', color:[170, 126, 74], burn:1, str:5});
  mat(11, 'brick', {hard:3, tool:'pick', color:[160, 86, 62], str:10, loud:0.7});
  mat(12, 'concrete', {hard:5, tool:'pick', color:[178, 176, 170], str:16, loud:0.7});
  mat(13, 'glass', {hard:0.3, color:[168, 212, 224], str:2, glass:true, loud:0.9});
  mat(14, 'asphalt', {hard:3.5, tool:'pick', color:[66, 68, 72], str:12, loud:0.7});
  mat(15, 'ash', {hard:0.2, color:[74, 72, 70], fall:1, speed:0.9, loud:0.2});
  mat(16, 'burning', {hard:0.5, color:[238, 110, 40], burn:0, str:3, drops:0, loud:0.3});
  var TOOLS = ['hand', 'shovel', 'pick', 'axe'];

  function World(nx, ny, nz){
    this.nx = nx; this.ny = ny; this.nz = nz; this.d = new Uint8Array(nx*ny*nz); this.cx = Math.ceil(nx/CS); this.cy = Math.ceil(ny/CS); this.cz = Math.ceil(nz/CS);
    this.dirty = new Set(); this.flow = [0, 0.8]; this.rain = false; this.fire = new Map(); this.fallQ = []; this.supQ = []; this.t = 0; this.seed = 1;
  }
  var P = World.prototype;
  P.i = function(x, y, z){ return x + this.nx*(z + this.nz*y); };
  P.inb = function(x, y, z){ return x >= 0 && y >= 0 && z >= 0 && x < this.nx && y < this.ny && z < this.nz; };
  /* below the grid is bedrock; the sides and the sky are open air */
  P.get = function(x, y, z){ if (y < 0) return 5; if (x < 0 || z < 0 || x >= this.nx || z >= this.nz || y >= this.ny) return 0; return this.d[x + this.nx*(z + this.nz*y)]; };
  P.set = function(x, y, z, m){
    if (!this.inb(x, y, z)) return; var k = this.i(x, y, z); if (this.d[k] === m) return; this.d[k] = m; this.mark(x, y, z);
    if (m === 0 || MAT[m].fall) this.queueSupport(x, y, z);
  };
  P.mark = function(x, y, z){
    var cx = Math.floor(x/CS), cy = Math.floor(y/CS), cz = Math.floor(z/CS); this.dirty.add(cx + this.cx*(cz + this.cz*cy));
    if (x % CS === 0 && cx > 0) this.dirty.add(cx - 1 + this.cx*(cz + this.cz*cy)); if (x % CS === CS - 1 && cx < this.cx - 1) this.dirty.add(cx + 1 + this.cx*(cz + this.cz*cy));
    if (z % CS === 0 && cz > 0) this.dirty.add(cx + this.cx*(cz - 1 + this.cz*cy)); if (z % CS === CS - 1 && cz < this.cz - 1) this.dirty.add(cx + this.cx*(cz + 1 + this.cz*cy));
    if (y % CS === 0 && cy > 0) this.dirty.add(cx + this.cx*(cz + this.cz*(cy - 1))); if (y % CS === CS - 1 && cy < this.cy - 1) this.dirty.add(cx + this.cx*(cz + this.cz*(cy + 1)));
  };
  P.solidAt = function(x, y, z){ return MAT[this.get(x, y, z)].solid; };
  /* ---- walking: a box (width w, height h, centred on px, pz, feet at py) against the blocks ---- */
  P.hits = function(px, py, pz, w, h){
    var x0 = Math.floor((px - w/2)/S), x1 = Math.floor((px + w/2 - 1e-6)/S), y0 = Math.floor(py/S), y1 = Math.floor((py + h - 1e-6)/S), z0 = Math.floor((pz - w/2)/S), z1 = Math.floor((pz + w/2 - 1e-6)/S);
    for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) for (var x = x0; x <= x1; x++) if (MAT[this.get(x, y, z)].solid) return true; return false;
  };
  /* the height of the ground under (px, pz) at or below py + reach: the top of the highest solid block in the column */
  P.groundY = function(px, pz, py, reach){
    var x = Math.floor(px/S), z = Math.floor(pz/S), y = Math.min(this.ny - 1, Math.floor((py + (reach || 0))/S)); for (; y >= 0; y--) if (MAT[this.get(x, y, z)].solid) return (y + 1)*S; return 0;
  };
  /* one step of a walker: p = {x, y, z, vx, vy, vz, on} moves by its velocity, stops against blocks, climbs one block (0.5 m) at a time, floats in water. Returns what it stands in and on */
  P.move = function(p, dt, w, h){
    var wet = MAT[this.get(Math.floor(p.x/S), Math.floor((p.y + h*0.5)/S), Math.floor(p.z/S))].liquid, ax = ['x', 'z'], i, k, n;
    var steps = Math.max(1, Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vz), Math.abs(p.vy))*dt/0.2));
    for (n = 0; n < steps; n++){ var q = dt/steps;
      for (i = 0; i < 2; i++){ k = ax[i]; var d = p['v' + k]*q; if (!d) continue; p[k] += d;
        if (this.hits(p.x, p.y, p.z, w, h)){
          if ((p.on || wet) && !this.hits(p.x, p.y + S + 0.01, p.z, w, h)){ p.y += S + 0.01; }   /* up one block */
          else { p[k] -= d; p['v' + k] = 0; } } }
      p.y += p.vy*q;
      if (this.hits(p.x, p.y, p.z, w, h)){ if (p.vy < 0){ p.y = Math.ceil(p.y/S - 1e-6)*S; if (this.hits(p.x, p.y, p.z, w, h)) p.y += S; p.on = true; } else p.y -= p.vy*q; p.vy = 0; }
    }
    /* stand on the ground when the box rests exactly on a block */
    if (!this.hits(p.x, p.y - 0.02, p.z, w, h)) p.on = false; else if (p.vy <= 0) p.on = true;
    var below = this.get(Math.floor(p.x/S), Math.floor((p.y - 0.05)/S), Math.floor(p.z/S));
    return {wet:wet, in:wet ? NAMES.water : 0, on:below};
  };
  /* ---- looking and digging: the first block along a ray ---- */
  P.ray = function(ox, oy, oz, dx, dy, dz, maxD){
    var x = Math.floor(ox/S), y = Math.floor(oy/S), z = Math.floor(oz/S), sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1, ux = Math.abs(dx) < 1e-9 ? 1e9 : Math.abs(S/dx), uy = Math.abs(dy) < 1e-9 ? 1e9 : Math.abs(S/dy), uz = Math.abs(dz) < 1e-9 ? 1e9 : Math.abs(S/dz);
    var tx = dx > 0 ? ((x + 1)*S - ox)/dx : dx < 0 ? (ox - x*S)/-dx : 1e9, ty = dy > 0 ? ((y + 1)*S - oy)/dy : dy < 0 ? (oy - y*S)/-dy : 1e9, tz = dz > 0 ? ((z + 1)*S - oz)/dz : dz < 0 ? (oz - z*S)/-dz : 1e9, t = 0, face = [0, 0, 0], px = x, py = y, pz = z;
    for (var n = 0; n < 200; n++){
      var m = this.get(x, y, z); if (m !== 0 && !MAT[m].liquid) return {x:x, y:y, z:z, m:m, px:px, py:py, pz:pz, t:t, f:face};
      px = x; py = y; pz = z;
      if (tx < ty && tx < tz){ t = tx; tx += ux; x += sx; face = [-sx, 0, 0]; } else if (ty < tz){ t = ty; ty += uy; y += sy; face = [0, -sy, 0]; } else { t = tz; tz += uz; z += sz; face = [0, 0, -sz]; }
      if (t > maxD) return null; if (y < 0 || y > this.ny + 4) return null;
    }
    return null;
  };
  /* seconds to break a block with a tool: the right tool is quick, the wrong one slow, bare hands slower than the right tool */
  function digTime(m, tool){ var M = MAT[m]; if (!M || !M.solid) return 0; var f = M.tool === 'any' ? 1 : tool === M.tool ? 0.35 : tool === 'hand' ? 3 : 1.6; return M.hard*f; }
  /* ---- the world moving on its own: wet, fire, falling, support. tick(dt) is cheap and bounded ---- */
  P.rnd = function(){ this.seed = (this.seed*1664525 + 1013904223) >>> 0; return this.seed/4294967296; };
  P.queueSupport = function(x, y, z){ this.supQ.push(x, y, z); };
  /* is the block at (x, y, z) held? Natural ground always is. A built block is held when a path of at most `str` blocks through solid blocks reaches natural ground */
  P.held = function(x, y, z){
    var m = MAT[this.get(x, y, z)]; if (!m.solid) return true; if (m.ground) return true; var lim = m.str, seen = new Map(), q = [[x, y, z, 0]], D = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], n = 0;
    seen.set(x + ',' + y + ',' + z, 1);
    while (q.length && n++ < 1500){ var c = q.shift(); if (c[3] >= lim) continue;
      for (var i = 0; i < 6; i++){ var a = c[0] + D[i][0], b = c[1] + D[i][1], e = c[2] + D[i][2], k = a + ',' + b + ',' + e; if (seen.has(k)) continue; seen.set(k, 1); var mm = MAT[this.get(a, b, e)]; if (!mm.solid) continue; if (mm.ground) return true; q.push([a, b, e, c[3] + 1]); } }
    return false;
  };
  P.tick = function(dt){
    this.t += dt; var i, n;
    /* support: look at the blocks around each change; granular blocks fall, unheld built blocks come down too */
    n = 0; while (this.supQ.length && n++ < 24){ var z = this.supQ.pop(), y = this.supQ.pop(), x = this.supQ.pop(), D = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]];
      for (i = 0; i < 6; i++){ var a = x + D[i][0], b = y + D[i][1], c = z + D[i][2], mm = MAT[this.get(a, b, c)]; if (!mm.solid || !this.inb(a, b, c)) continue;
        if ((mm.fall && !MAT[this.get(a, b - 1, c)].solid) || (!mm.ground && !this.held(a, b, c))) this.fallQ.push(a, b, c); } }
    var fq = this.fallQ; this.fallQ = []; for (i = 0; i + 2 < fq.length; i += 3){ var fx = fq[i], fy = fq[i+1], fz = fq[i+2], fm = this.get(fx, fy, fz); if (!MAT[fm].solid) continue;
      if (!MAT[this.get(fx, fy - 1, fz)].solid && fy > 0){ this.set(fx, fy, fz, 0); this.set(fx, fy - 1, fz, fm); this.fallQ.push(fx, fy - 1, fz); } }
    /* fire: a burning block lasts a few seconds, may light the flammable blocks around it, and leaves ash */
    var self = this; this.fire.forEach(function(left, k){
      var y2 = Math.floor(k/(self.nx*self.nz)), r = k - y2*self.nx*self.nz, z2 = Math.floor(r/self.nx), x2 = r - z2*self.nx; left -= dt;
      if (self.rain && self.rnd() < dt*0.8) left = 0;
      if (left <= 0){ self.fire.delete(k); if (self.get(x2, y2, z2) === NAMES.burning) self.set(x2, y2, z2, self.rain ? 0 : NAMES.ash); return; }
      self.fire.set(k, left);
      var N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]]; for (var j = 0; j < 6; j++){ var a2 = x2 + N[j][0], b2 = y2 + N[j][1], c2 = z2 + N[j][2]; if (MAT[self.get(a2, b2, c2)].burn && self.rnd() < dt*0.55) self.ignite(a2, b2, c2); }
    });
    /* weather: rain turns bare grass and soil to mud; when it stops, mud dries back to soil. A block counts as bare when it has air above it */
    var tries = Math.ceil(dt*400); for (i = 0; i < tries; i++){ var rx = Math.floor(this.rnd()*this.nx), rz = Math.floor(this.rnd()*this.nz), ry = this.topSolid(rx, rz); if (ry < 0) continue; var cm = MAT[this.get(rx, ry, rz)];
      if (this.rain && cm.wet && MAT[this.get(rx, ry + 1, rz)].id === 0) this.set(rx, ry, rz, cm.wet); else if (!this.rain && cm.dry && MAT[this.get(rx, ry + 1, rz)].id === 0 && this.rnd() < 0.25) this.set(rx, ry, rz, cm.dry); }
  };
  P.topSolid = function(x, z){ for (var y = this.ny - 1; y >= 0; y--){ var m = this.d[x + this.nx*(z + this.nz*y)]; if (m !== 0 && !MAT[m].liquid) return y; } return -1; };
  P.ignite = function(x, y, z){ var m = this.get(x, y, z); if (!MAT[m].burn) return false; this.set(x, y, z, NAMES.burning); this.fire.set(x + this.nx*(z + this.nz*y), 3 + this.rnd()*3); return true; };
  /* ---- drawing: faces that can be seen, per chunk. Two meshes: solid blocks, and water with its flow flag. Vertex = x, y, z, r, g, b, flag ---- */
  var FACE = [[1, 0, 0, [1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1]], [-1, 0, 0, [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0]], [0, 1, 0, [0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0]], [0, -1, 0, [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1]], [0, 0, 1, [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1]], [0, 0, -1, [0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0]]];
  var SHADE = [0.82, 0.82, 1.0, 0.55, 0.72, 0.72];
  P.mesh = function(cx, cy, cz){
    var solid = [], water = [], x0 = cx*CS, y0 = cy*CS, z0 = cz*CS, x1 = Math.min(this.nx, x0 + CS), y1 = Math.min(this.ny, y0 + CS), z1 = Math.min(this.nz, z0 + CS);
    for (var y = y0; y < y1; y++) for (var z = z0; z < z1; z++) for (var x = x0; x < x1; x++){
      var id = this.d[x + this.nx*(z + this.nz*y)]; if (!id) continue; var m = MAT[id], liq = m.liquid;
      for (var f = 0; f < 6; f++){ var F = FACE[f], nid = this.get(x + F[0], y + F[1], z + F[2]), nm = MAT[nid];
        if (liq){ if (nid !== 0) continue; } else { if (nm.solid && !(nm.glass && !m.glass)) continue; if (nm.liquid && false) continue; }
        /* a little colour change from block to block, so the blocks read as blocks */
        var h = (x*73856093 ^ y*19349663 ^ z*83492791) >>> 0, v = 0.93 + (h % 1000)/1000*0.12, sh = SHADE[f]*v, r = m.color[0]*sh, g = m.color[1]*sh, b = m.color[2]*sh, out = liq || m.glass ? water : solid, top = liq && f === 2 ? 0.88 : 1, q = F[3];
        var P0 = [], j; for (j = 0; j < 4; j++){ P0.push([(x + q[j*3])*S, (y + (q[j*3 + 1] ? top : 0))*S, (z + q[j*3 + 2])*S]); }
        var tri = [0, 1, 2, 0, 2, 3]; for (j = 0; j < 6; j++){ var pp = P0[tri[j]]; out.push(pp[0], pp[1], pp[2], r, g, b, liq ? 1 : (m.glass ? 2 : 0)); }
      } }
    return {solid:new Float32Array(solid), water:new Float32Array(water)};
  };
  /* ---- a test world: ground in the game's layers, a river in a real channel, a gorge, a road, a brick house, a wooden bridge ---- */
  function testWorld(){
    var nx = 256, ny = 96, nz = 256, w = new World(nx, ny, nz), x, y, z, LV = 7.0;
    var H = function(mx, mz){   /* ground height in metres */
      var h = 8 + 1.2*Math.sin(mx/17) + 0.8*Math.cos(mz/13), dr = Math.abs(mx - 64);
      h += 9*Math.max(0, 1 - Math.hypot(mx - 100, mz - 100)/26);                   /* a steep hill */
      var gx = Math.abs(mx - 108); if (mz > 70 && mz < 120 && gx < 6){ h -= 9*(gx < 2.5 ? 1 : (6 - gx)/3.5); }   /* a gorge */
      if (dr < 3) h = Math.min(h, LV - 1.5); else if (dr < 5) h = Math.min(h, LV - 1.5 + (dr - 3)*1.4);   /* the river channel: bed, then banks that rise */
      return h; };
    for (z = 0; z < nz; z++) for (x = 0; x < nx; x++){
      var mx = (x + 0.5)*S, mz = (z + 0.5)*S, top = Math.floor(H(mx, mz)/S), dr = Math.abs(mx - 64);
      for (y = 0; y <= top && y < ny; y++){ var depth = top - y, m = depth === 0 ? 1 : depth < 4 ? 2 : depth < 10 ? 3 : depth < 18 ? 4 : 5;
        if (dr < 3.2 && depth < 2) m = dr < 2 ? 6 : 7;                  /* gravel and sand on the river bed */
        else if (dr < 5.2 && y*S < LV + 0.6 && depth < 3) m = 8;        /* wet mud on the banks near the waterline */
        w.d[w.i(x, y, z)] = m; }
      for (y = top + 1; y*S < LV && y < ny; y++) w.d[w.i(x, y, z)] = NAMES.water;
    }
    var set = function(x, y, z, m){ w.d[w.i(x, y, z)] = m; };
    for (z = 20; z < 220; z++) for (x = 26; x < 34; x++){ var t2 = w.topSolid(x, z); if (t2 >= 0 && MAT[w.d[w.i(x, t2, z)]].ground) set(x, t2, z, NAMES.asphalt); }   /* the road */
    var hx = 70, hz = 30, hy = w.topSolid(hx + 2, hz + 2) + 1;   /* a brick house */
    for (y = 0; y < 12; y++) for (z = 0; z < 16; z++) for (x = 0; x < 20; x++){ var edge = x === 0 || x === 19 || z === 0 || z === 15, roof = y === 11, floor = y === 0;
      if (floor) set(hx + x, hy - 1 + y, hz + z, NAMES.concrete); else if (roof) set(hx + x, hy - 1 + y, hz + z, NAMES.wood); else if (edge){ var win = y >= 4 && y <= 7 && ((x % 5) >= 2 && (x % 5) <= 3 || (z % 5) >= 2 && (z % 5) <= 3) && !(x === 0 || x === 19) || (y >= 4 && y <= 7 && (x === 0 || x === 19) && (z % 5) >= 2 && (z % 5) <= 3);
        var door = z === 0 && x >= 8 && x <= 10 && y <= 4; if (door) continue; set(hx + x, hy - 1 + y, hz + z, win ? NAMES.glass : NAMES.brick); } }
    for (y = 1; y <= 3; y++) for (z = 0; z < 2; z++) for (x = 0; x < 6; x++) set(hx + 6 + x + 0, hy - 1 + y, hz - 2 + z, y === 1 ? NAMES.concrete : 0);
    for (x = 52; x < 78; x++) for (z = 80; z < 86; z++){ var by = Math.floor(8.2/S) + 1; set(x, by, z, NAMES.wood); if (z === 80 || z === 85) set(x, by + 1, z, NAMES.wood); }   /* a wooden bridge over the river */
    for (y = 0; y < 14; y++) for (z = 4; z < 9; z++) for (x = 200; x < 205; x++) set(x, w.topSolid(x, z) + 1, z, NAMES.wood);   /* a wooden tower: it burns and falls */
    w.spawn = {x:30.25, z:12.25, y:(w.topSolid(60, 24) + 1)*S + 0.05};
    for (var c = 0; c < w.cx*w.cy*w.cz; c++) w.dirty.add(c);
    return w;
  }
  return {S:S, CS:CS, MAT:MAT, NAMES:NAMES, TOOLS:TOOLS, World:World, digTime:digTime, testWorld:testWorld};
})();
if (typeof module !== 'undefined') module.exports = VOX;
