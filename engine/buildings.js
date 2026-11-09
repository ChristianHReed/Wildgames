/* Shared engine: building shells (walls, roofs, windows) built once per building.
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
/* ================= building shells (built once) ================= */
var CH = 96;
/* tiles of the ground and indoor atlas (tools/paint_ground.py, packed by tools/build_art.py); 0-3 are the terrain layers, blended as tile 45 */
var TX = {lawn:0, meadow:1, earth:2, rock:3, lanes:11, gravel:12, asphalt:15, sidewalk:16, grass:17, dirt:18, water:19, floorTile:20, wallpaper:21, wood:22}, TERR = 45;
var WHITE = [255,255,255], INK = [61,48,41];
/* ---- building fronts by use (docs/BUILDINGS.md): which painted tile goes on the front ground floor, the other ground-floor walls and the
   upper floors; the plain wall for short stretches; the wall and roof colours; and the trims built on (cornice, belt course, porch) ---- */
var BT = {siding_win_green:0, siding_win_blue:1, siding_win:2, brick_house_win:3, brick_win:4, storefront:5, comm_upper:6, office_ribbon:7, glass_lobby:8, metal_win:9, rollup:10, firebay:11, stone_arch:12, school_band:13, clinic_panel:14, parking_deck:15, stone_base:16, stucco_win:17, clapboard_arch:18, apt_pair:19, siding_apt:20, metal_high:21,
  plain_siding:24, plain_brick:25, plain_stucco:26, plain_concrete:27, plain_metal:28, plain_stone:29, plain_panel:30, roof_shingle:32, roof_flat:33, roof_metal:34};
/* 0.35.1: the glass of each ground-floor window front is a real opening, so you can see out (and in). [centre from the bay's left edge, half width,
   bottom, top] in the painted tile's metres (4 m wide, 3.2 m high); tiles with no glass at standing height have none */
var HOLES = {0:[[2,0.475,0.95,2.25]], 1:[[2,0.475,0.95,2.25]], 2:[[2,0.475,0.95,2.25]], 3:[[2,0.475,0.95,2.25]], 4:[[2,0.525,0.95,2.3]], 5:[[2,1.67,0.5,2.55]],
  8:[[2,1.9,0.12,2.3]], 9:[[2,0.45,1.0,2.2]], 12:[[2,0.5,0.7,2.45]], 13:[[2,1.65,1.0,2.6]], 14:[[2,1.2,1.0,2.2]], 15:[[2,1.75,1.0,2.65]], 16:[[2,0.5,0.95,2.4]],
  17:[[2,0.5,0.95,2.25]], 18:[[2,0.4,0.8,2.6]], 19:[[1.2,0.425,0.95,2.35],[2.8,0.425,0.95,2.35]], 20:[[1.2,0.425,0.95,2.25],[2.8,0.425,0.95,2.25]]};
/* where the window you can open sits in its bay (offset from the bay's middle): the left one of a pair */
function winOff(tile){ return tile === 19 || tile === 20 ? -0.8 : 0; }
var WALLC = {siding:['#ecdfc4', '#b9c6a8', '#a8bccd', '#ead08c', '#e6e3db', '#d9b6a2', '#c8d5cc', '#f2efe6'], brick:['#a65a44', '#b8754e', '#8f4a3a', '#c4946a', '#9b5c4a', '#7d4536'], buff:['#d2b994', '#dcc8a4', '#c7ab84'],
  stucco:['#e8decd', '#dcd2bc', '#d1c4ae', '#e3d6c2', '#cbd2cc'], concrete:['#cfcabe', '#bdbab2', '#d8d2c5', '#b4b8b8'], metal:['#9ca7ac', '#bbb4a4', '#8c9c8e', '#c6bfac', '#80909a'], stone:['#dcd3be', '#cec3a4', '#c2b9a9'], panel:['#eeebe5', '#e3e8ea', '#e9e4d8']};
var ROOFC = {shingle:['#5c5754', '#6d4c40', '#4b5761', '#7a6b5b', '#40474a', '#7d4f42'], flat:['#a9a59d', '#928f89', '#b5b0a5'], metal:['#7f8b91', '#9b4d40', '#60705f', '#a3a8a6']};
function bstyle(b){
  var h = hash(b.id, 17, 3), h2 = hash(b.id, 18, 3), pick = function(a, x){ return a[Math.floor(x*a.length) % a.length]; }, k = b.kind;
  var FR = {rollup:6, firebay:9, glass_lobby:8, stone_base:10};   /* how far either side of the door the special ground floor runs */
  var S = function(g, gs, u, plain, mat, o){ o = o || {}; return {g:BT[g], gs:BT[gs], u:BT[u], gp:BT[plain], fr:FR[g] || 1e9, mat:mat, wc:pick(WALLC[mat], h2), roof:o.roof || 'flat', rc:pick(ROOFC[o.roof || 'flat'], h), cornice:!!o.cornice, belt:!!o.belt, porch:!!o.porch}; };
  /* 0.113.0: the map's own wall (asmb:wall, set by the builder from the building's use and frame) decides the cladding where it is given */
  var fw = b.wall || '', big = !/^(house|apartments|church|school|clinic|hospital|police|fire|library|bank)$/.test(k || '');
  if (big && (fw === 'lightsteel_sheet' || fw === 'steel_cladding')) return S('rollup', 'metal_win', 'metal_high', 'plain_metal', 'metal', {roof:'metal'});
  if (big && fw === 'wood_siding' && k !== 'garage' && k !== 'warehouse') return S('storefront', 'siding_win', 'siding_win', 'plain_siding', 'siding');
  if (big && fw === 'concrete_brick') return S('storefront', 'brick_win', 'comm_upper', 'plain_brick', 'brick', {cornice:true});
  if (big && (fw === 'concrete_block' || fw === 'concrete_poured')) return S('stucco_win', 'stucco_win', 'stucco_win', 'plain_concrete', 'concrete');
  if (k === 'house'){ if (h < 0.18 && fw !== 'wood_siding') return S('brick_house_win', 'brick_house_win', 'brick_house_win', 'plain_brick', 'brick', {roof:'shingle', porch:true});
    var sw = h < 0.45 ? 'siding_win_green' : h < 0.7 ? 'siding_win_blue' : 'siding_win'; return S(sw, sw, sw, 'plain_siding', 'siding', {roof:'shingle', porch:true}); }
  if (k === 'apartments') return h < 0.6 ? S('apt_pair', 'apt_pair', 'apt_pair', 'plain_brick', h < 0.3 ? 'brick' : 'buff', {cornice:true}) : S('siding_apt', 'siding_apt', 'siding_apt', 'plain_siding', 'siding');
  if (k === 'garage') return S('rollup', 'metal_win', 'metal_win', 'plain_metal', 'metal', {roof:'metal'});
  if (k === 'warehouse') return S('rollup', 'metal_win', 'metal_high', 'plain_metal', 'metal', {roof:'metal'});
  if (k === 'parking') return S('parking_deck', 'parking_deck', 'parking_deck', 'plain_concrete', 'concrete');
  if (k === 'grocery' || k === 'hardware' || k === 'outdoors' || k === 'fuel') return S('storefront', 'stucco_win', 'stucco_win', 'plain_stucco', 'stucco', {cornice:true});
  if (k === 'restaurant' || k === 'bar' || k === 'shop' || k === 'clothes' || k === 'electronics') return S('storefront', 'brick_win', 'comm_upper', 'plain_brick', h < 0.75 ? 'brick' : 'buff', {cornice:true, belt:true});
  if (k === 'clinic' || k === 'hospital') return S('glass_lobby', 'clinic_panel', 'clinic_panel', 'plain_panel', 'panel', {cornice:true});
  if (k === 'police') return S('stone_base', 'brick_win', 'brick_win', 'plain_brick', 'buff', {cornice:true, belt:true});
  if (k === 'fire') return S('firebay', 'brick_win', 'brick_win', 'plain_brick', 'brick', {cornice:true, belt:true});
  if (k === 'school') return S('school_band', 'school_band', 'school_band', 'plain_brick', h < 0.7 ? 'brick' : 'buff', {cornice:true});
  if (k === 'library' || k === 'bank' || k === 'venue') return S('stone_base', 'stone_arch', 'stone_arch', 'plain_stone', 'stone', {cornice:true, belt:true});
  if (k === 'church') return h < 0.5 ? S('clapboard_arch', 'clapboard_arch', 'clapboard_arch', 'plain_siding', 'siding', {roof:'shingle'}) : S('stone_arch', 'stone_arch', 'stone_arch', 'plain_stone', 'stone', {roof:'shingle'});
  if (k === 'hotel') return S('glass_lobby', 'apt_pair', 'apt_pair', 'plain_brick', 'brick', {cornice:true, belt:true});
  if (k === 'gym') return S('glass_lobby', 'metal_high', 'metal_high', 'plain_metal', 'metal', {roof:'metal'});
  if (k === 'office') return h < 0.35 ? S('storefront', 'brick_win', 'brick_win', 'plain_brick', 'brick', {cornice:true, belt:true}) : S('glass_lobby', 'office_ribbon', 'office_ribbon', 'plain_concrete', 'concrete', {cornice:true});
  return S('stucco_win', 'stucco_win', 'stucco_win', 'plain_stucco', 'stucco');
}
/* ---- Art 5 (0.45): framed buildings from the art chat's building kit (assets/shaped/buildings.js). Every outside wall is a row of bays, each a frame (a post on
   its left and a beam on top) with an infill panel set back in it: plain, sided or brick wall, window, door, shopfront or garage door. The kit's modules are 2.4 m by 3 m;
   each is bent to its bay with a stretch that keeps windows and doors their real size (the game's own sashes and doors sit in the openings), and to the storey's height.
   Faces that look into the building are left out, so from inside you see the room's wallpaper as before. Add ?oldbld to the address for the painted walls ---- */
var FRON = !!(window.SHAPED && SHAPED.build && SHAPED.buildings) && !/[?&]oldbld/.test(location.search), FRM = {}, FRNOW = false, FRD = 100;   /* framed walls on the map pieces within FRD metres; painted ones further off */
/* one module as triangles in bay space, each with its colour slot; ground windows and doors lose the glass, door leaf and knob the game draws itself */
function frMod(name, cut){
  var key = name + (cut ? ':' + cut : ''); if (FRM[key]) return FRM[key]; var BK = SHAPED.buildings, pcs = BK.models.modules[name]; if (!pcs) return null;
  var out = []; pcs.forEach(function(q){
    if (cut === 'win' && q.c === 'TRIM' && q.p[2] < 0 && q.s === 'decal') return;
    if (cut === 'door' && (q.c === 'knob' || (q.c === 'TRIM' && q.s === 'box' && q.p[2] < -0.03))) return;
    var o = SHAPED.build([q], function(){ return [0, 0, 0]; }, null, {}), P0 = o.pos, glass = /^glass/.test(q.c), fr = name.slice(0, 5) === 'frame' || name.slice(0, 6) === 'corner', pl = name === 'plinth';
    for (var t = 0; t < P0.length; t += 9){ var ux = P0[t+3] - P0[t], uy = P0[t+4] - P0[t+1], uz = P0[t+5] - P0[t+2], vx = P0[t+6] - P0[t], vy = P0[t+7] - P0[t+1], vz = P0[t+8] - P0[t+2];
      var nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx, nl = Math.hypot(nx, ny, nz) || 1, cx = (P0[t] + P0[t+3] + P0[t+6])/3, cy = (P0[t+1] + P0[t+4] + P0[t+7])/3; nx /= nl; ny /= nl; nz /= nl;
      /* only faces that can be seen: none into the building, none hidden under a neighbour (bay edges, the ground, the beam above), glass only its outside */
      if (nz < -0.5 || (glass && nz < 0.5) || (cut === 'lite' && nz < 0.5 && !(fr && Math.abs(nx) > 0.5 && Math.abs(cx) > 1.05))) continue;   /* lite (high storeys): only the faces looking out, and the posts' sides */
      if (ny < -0.5 && cy < 0.05) continue;
      if (ny > 0.5 && cy > (fr ? 2.99 : 2.74)) continue;
      if (fr && (Math.abs(ny) > 0.5 || (Math.abs(nx) > 0.5 && Math.abs(cx) < 1.05))) continue;
      if (!fr && Math.abs(nx) > 0.5 && Math.abs(cx) > (pl ? 1.15 : 1.04)) continue;
      out.push({p:P0.slice(t, t + 9), c:q.c, g:glass, pn:glass && cut === 'win', f:fr || pl || (q.c.slice(0, 4) === 'TRIM' && q.p[2] >= 0)}); } });
  out.np = out.filter(function(t){ return !t.pn; }).length; return FRM[key] = out;
}
/* a piecewise-straight stretch through knots [[from, to], ...] (from 0 up), mirrored for negative values, carried on at slope 1 past the last knot */
function frMap(K){ return function(v){ var a = Math.abs(v), sg = v < 0 ? -1 : 1, x0 = 0, y0 = 0; for (var i = 0; i < K.length; i++){ var k = K[i]; if (a <= k[0]) return sg*(y0 + (a - x0)*(k[1] - y0)/((k[0] - x0) || 1)); x0 = k[0]; y0 = k[1]; } return sg*(y0 + a - x0); }; }
function frYMap(K){ return function(v){ var x0 = 0, y0 = 0; for (var i = 0; i < K.length; i++){ var k = K[i]; if (v <= k[0]) return y0 + (v - x0)*(k[1] - y0)/((k[0] - x0) || 1); x0 = k[0]; y0 = k[1]; } return y0 + v - x0; }; }
/* the building's look as kit pieces: which wall infill, which frame, and its four colours (the wall colour keeps the nest and safe-house tints) */
function frStyle(ST, tint, rcol){
  var mt = ST.mat, inf = mt === 'siding' ? 'siding' : mt === 'brick' || mt === 'buff' || mt === 'stone' ? 'brick' : 'plain', fk = mt === 'siding' ? 'timber' : mt === 'metal' ? 'steel' : 'concrete';
  var trim = mt === 'brick' || mt === 'buff' ? [226,218,202] : mt === 'stone' ? [214,206,188] : mt === 'metal' ? [96,100,104] : [236,232,224];
  var frame = mt === 'siding' ? [236,232,224] : mt === 'metal' ? [80,84,90] : mt === 'brick' ? tint.map(function(v){ return Math.round(v*0.74); }) : mt === 'stone' || mt === 'buff' ? trim.map(function(v){ return Math.round(v*0.9); }) : [188,182,170];
  var pal = SHAPED.buildings.palette, dk = SHAPED.buildings.darker, cols = {WALL:tint, TRIM:trim, FRAME:frame, ROOF:rcol};
  return {inf:inf, fk:fk, col:function(n){ if (cols[n]) return cols[n]; if (n.slice(-2) === '_D'){ var c0 = cols[n.slice(0, -2)] || SHAPED.hex(pal[n.slice(0, -2)] || '#ff00ff').map(function(v){ return v*255; }); return c0.map(function(v){ return Math.round(v*dk); }); } return SHAPED.hex(pal[n] || '#ff00ff').map(function(v){ return Math.round(v*255); }); }};
}
/* put one module into the mesh: bay centre (cx, cz) on the wall line, e along the wall (bay x), o out of the wall, storey from y0; fx, fy bend it to the bay.
   Colours darken toward the building's corners and the ground (as the painted walls did), and that shading goes in alpha for the inside face */
function frPut(m, M, FS, cx, cz, ex, ez, ox, oz, y0, fx, fy, ao, gid){
  if (!M || !M.length) return; var P = m.p, Cc = m.c, T = m.t, CC = FS.cc || (FS.cc = {}), np = P.length, nc = Cc.length, nt = T.length, nn = M.np === undefined ? M.length : M.np, n3 = nn*9;
  P.length = np + n3; Cc.length = nc + nn*12; T.length = nt + n3;
  for (var i = 0; i < M.length; i++){ var tr = M[i], col = CC[tr.c] || (CC[tr.c] = FS.col(tr.c)), q = tr.p, g = tr.g, ff = tr.f;
    if (tr.pn){ if (m === NULLM) continue; var gm = m.gm || (m.gm = new Mesh()); for (var v = 0; v < 3; v++){ var lx = fx(q[v*3]), ly = y0 + fy(q[v*3+1]), lz = q[v*3+2] - 0.04; gm.p.push(cx + ex*lx + ox*lz, ly, cz + ez*lx + oz*lz); gm.c.push(col[0], col[1], col[2], 255); gm.t.push(gid, 0, 190); } continue; }
    for (var v = 0; v < 3; v++){ var lx = fx(q[v*3]), ly = y0 + fy(q[v*3+1]), lz = q[v*3+2] - 0.04, wx = cx + ex*lx + ox*lz, wz = cz + ez*lx + oz*lz;
      if (ff && lz < 0){ wx -= ox*lz; wz -= oz*lz; }   /* posts, beams and the plinth stop at the wall, so they do not stick into the rooms */
      P[np++] = wx; P[np++] = ly; P[np++] = wz;
      if (g){ Cc[nc++] = col[0]; Cc[nc++] = col[1]; Cc[nc++] = col[2]; Cc[nc++] = 255; T[nt++] = gid; T[nt++] = 0; T[nt++] = 190; }   /* glass: lit at night by its own number */
      else { var k = ao(wx, wz)*(ly < 0.3 ? 0.88 : 1); Cc[nc++] = (col[0]*k) | 0; Cc[nc++] = (col[1]*k) | 0; Cc[nc++] = (col[2]*k) | 0; Cc[nc++] = ((1 - k)*153) | 0; T[nt++] = 0; T[nt++] = 0; T[nt++] = -1; } } }
}
/* one footprint edge as framed bays, storey by storey. Returns where the ground-floor windows are (metres from the edge's start), for the windows you can open.
   The door edge gets a door bay in the middle; shops get shopfronts and garages roll-up doors along the front; homes alternate windows and wall, other buildings
   have a window in every bay. The edge runs from a along d; the bays are laid looking at the wall from outside */
/* how wide the bays are: 2.4 m, the kit's own, on ordinary buildings; wider on very big ones (a hospital, a mall), so a whole block is not thousands of bays */
function frBayW(b, Ht){ var p = b.pts, per = 0; for (var i = 0; i < p.length; i += 2){ var j = (i + 2) % p.length; per += Math.hypot(p[j] - p[i], p[j+1] - p[i+1]); } var a = per*Math.max(1, Math.round(Ht/3.2)); return a > 1500 ? 4.8 : a > 600 ? 3.6 : 2.4; }
/* is another building built right against this stretch of wall? Looks just outside it at three points; returns the neighbour's height, or 0 */
function frParty(b, cx, cz, ox, oz, ex, ez, w){
  var h = 0; for (var k = -1; k <= 1; k++){ var px = cx + ox*0.35 + ex*k*w*0.3, pz = cz + oz*0.35 + ez*k*w*0.3, o = buildingAt(px, pz); if (o && o !== b && !o.gone) h = Math.max(h, (o.h || 3.2) + (o.base || 0) - (b.base || 0)); } return h;
}
/* a flat wallpapered panel where a neighbour's wall stands against this one */
function frFlat(m, cx, cz, ex, ez, w, y0, y1, col){   /* col: plain wall colour (for the part above a lower neighbour's roof), else wallpaper both sides */
  var hx = ex*w/2, hz = ez*w/2, P = [cx - hx, y0, cz - hz, cx + hx, y0, cz + hz, cx + hx, y1, cz + hz, cx - hx, y0, cz - hz, cx + hx, y1, cz + hz, cx - hx, y1, cz - hz];
  for (var i = 0; i < 6; i++){ m.p.push(P[i*3], P[i*3+1], P[i*3+2]); if (col){ m.c.push(col[0], col[1], col[2], 0); m.t.push(0, 0, -1); } else { m.c.push(255, 255, 255, 0); m.t.push(0, 0, 191); } }
}
/* the room side of a wall: a flat wallpapered panel 12 cm in from the wall line (the thickness of the kit's infill), so from inside the wall is one clean surface and the
   posts, beams, trims and plinth that stand proud outside cannot show through or poke in. Each bay gets its whole rectangle minus the opening (window, door, shopfront, garage) */
function frInQuad(m, cx, cz, ex, ez, ox, oz, xa, xb, ya, yb){
  if (xb - xa < 0.01 || yb - ya < 0.01) return;
  var d = -0.12, x1 = cx + ex*xa + ox*d, z1 = cz + ez*xa + oz*d, x2 = cx + ex*xb + ox*d, z2 = cz + ez*xb + oz*d, P = [x1, ya, z1, x2, ya, z2, x2, yb, z2, x1, ya, z1, x2, yb, z2, x1, yb, z1];
  for (var i = 0; i < 6; i++){ m.p.push(P[i*3], P[i*3+1], P[i*3+2]); m.c.push(255, 255, 255, 0); m.t.push(0, 0, 191); }
}
function frInner(m, cx, cz, ex, ez, ox, oz, half, y0, y1, op, fx, fy){
  if (!op){ frInQuad(m, cx, cz, ex, ez, ox, oz, -half, half, y0, y1); return; }
  var xa = fx(-op.x), xb = fx(op.x), ya = Math.min(y1, y0 + fy(op.y0)), yb = Math.min(y1, y0 + fy(op.y1));
  frInQuad(m, cx, cz, ex, ez, ox, oz, -half, half, y0, ya); frInQuad(m, cx, cz, ex, ez, ox, oz, -half, half, yb, y1);
  frInQuad(m, cx, cz, ex, ez, ox, oz, -half, xa, ya, yb); frInQuad(m, cx, cz, ex, ez, ox, oz, xb, half, ya, yb);
}
function frWall(m, b, FS, ST, K, ax, az, dx, dz, l, ei, isDoor, lhg, Ht, corner, CAO){
  var draw = m !== NULLM, ex = -dx, ez = -dz, ox = dz, oz = -dx, bays = [], wl = [], k, BW = b.frBW || (b.frBW = frBayW(b, Ht));
  if (isDoor){ var wd = Math.min(l, 2.4), L1 = (l - wd)/2; if (L1 < 0.8){ wd = l; L1 = 0; }
    var ns = L1 > 0 ? Math.max(1, Math.round(L1/BW)) : 0, w1 = ns ? L1/ns : 0;
    for (k = 0; k < ns; k++) bays.push({s:w1*(k + 0.5), w:w1, dd:ns - k}); bays.push({s:l/2, w:wd, door:true, dd:0}); for (k = 0; k < ns; k++) bays.push({s:l - L1 + w1*(k + 0.5), w:w1, dd:k + 1});
  } else { var nb = Math.max(1, Math.round(l/BW)), w0 = l/nb, c = (nb - 1)/2; for (k = 0; k < nb; k++) bays.push({s:w0*(k + 0.5), w:w0, dd:Math.floor(Math.abs(k - c)) + 1}); }
  var home = b.kind === 'house' || K.cat === 'house', inf = FS.inf, shop = isDoor && (ST.g === BT.storefront || ST.g === BT.glass_lobby), gar = isDoor && (ST.g === BT.rollup || ST.g === BT.firebay);
  var ao = function(wx, wz){ return CAO((wx - ax)*dx + (wz - az)*dz, l); }, hk = lhg/3.2, st = [[0, lhg]], y = lhg; while (y < Ht - 0.01){ var hs = Math.min(3.2, Ht - y); st.push([y, hs]); y += hs; }
  bays.forEach(function(B, bi){
    var w = B.w, cx = ax + dx*B.s, cz = az + dz*B.s, near = Math.abs(B.s - l/2), winOK = w >= 1.5 && l > 2.2, isWin = winOK && B.dd % 2 === 1, pH = frParty(b, cx, cz, ox, oz, ex, ez, w);   /* a window in every other bay, about as many as the painted walls had; pH: how high a neighbour built against this bay stands */
    var fF = w < 0.5 ? frMap([[1.2, w/2]]) : frMap([[1.1, w/2 - 0.1]]);
    st.forEach(function(S, si){
      var y0 = S[0], Hs = S[1], ground = si === 0, fyF = frYMap([[2.75, Hs - 0.25]]), M, fx = fF, fy = fyF, op = null;
      if (!B.door && y0 < pH - 0.8){ if (draw){ var yp = Math.min(y0 + Hs, pH); frFlat(m, cx, cz, ex, ez, w, y0, yp, null); if (yp < y0 + Hs - 0.02) frFlat(m, cx, cz, ex, ez, w, yp, y0 + Hs, FS.col('WALL')); } return; }   /* a wall shared with the building next door: flat, wallpaper on both sides, no windows, nothing sticking out */
      if (ground && B.door){ M = frMod('door_' + inf, 'door'); fx = frMap([[0.5, 0.65], [1.1, w/2 - 0.1]]); fy = frYMap([[2.2, 2.2], [2.75, Hs - 0.25]]); op = {x:0.5, y0:0, y1:2.2}; }
      else if (ground && shop && near < ST.fr){ M = frMod('shopfront'); op = {x:1.1, y0:0.4, y1:2.4}; }
      else if (ground && gar && near < ST.fr && w >= 1.8){ M = frMod('garage'); op = {x:1.1, y0:0, y1:2.5}; }
      else if (isWin || (!ground && winOK && B.door)){ M = frMod('window_' + inf, ground ? 'win' : si > 1 ? 'lite' : null); fx = frMap([[0.6, 0.47], [1.1, w/2 - 0.1]]); fy = ground ? frYMap([[0.9, hk], [2.2, 2.2*hk], [2.75, Hs - 0.25]]) : frYMap([[0.9, 1.0], [2.2, 2.25], [2.75, Hs - 0.25]]);
        op = {x:0.6, y0:0.9, y1:2.2}; if (ground) wl.push(B.s); }
      else M = frMod('wall_' + inf);
      if (!draw) return;
      frPut(m, M, FS, cx, cz, ex, ez, ox, oz, y0, fx, fy, ao, hash(b.id, ei*97 + bi, si));
      if (w >= 0.5) frInner(m, cx, cz, ex, ez, ox, oz, w/2, y0, y0 + Hs, op, fx, fy);
      if (w >= 0.5) frPut(m, frMod('frame_' + FS.fk, si > 1 ? 'lite' : null), FS, cx, cz, ex, ez, ox, oz, y0, fF, fyF, ao, 0);
      if (ground && !B.door) frPut(m, frMod('plinth'), FS, cx, cz, ex, ez, ox, oz, 0, frMap([[1.2, w/2]]), function(v){ return v; }, ao, 0);
    });
  });
  if (draw && corner && !frParty(b, ax, az, ox - dx, oz - dz, ex, ez, 0.2)) frPut(m, frMod('corner_' + FS.fk), FS, ax, az, ex, ez, ox, oz, 0, function(v){ return v; }, frYMap([[3, Ht]]), function(){ return 0.9; }, 0);
  return wl;
}
/* towers (0.49.4): in the dense middle of a city, about one in five offices, hotels, banks, apartment blocks and big shops is a tower of 6 to 14 storeys. Returns the number of storeys, or 0 */
var TOWK = {office:1, bank:1, hotel:1, apartments:1, shop:1, clothes:1, electronics:1};
function towerOf(b){
  if (!TOWK[b.kind] || b.area < 250 || b.area > 1400 || b.id === world.safe || hash(b.id, 9, 3) > 0.22) return 0;
  var cx = Math.floor(b.cx/G), cy = Math.floor(b.cy/G), n = 0; for (var yy = cy - 2; yy <= cy + 2; yy++) for (var xx = cx - 2; xx <= cx + 2; xx++){ var cell = world.grid.get(gk(xx, yy)); if (cell) n += cell.length; }
  return n >= 30 ? 6 + Math.floor(hash(b.id, 9, 4)*9) : 0;
}
function shell(b, m, lm){
  if (b.gone && m !== NULLM) return;
  var p = b.pts, n = p.length, i, j, ar = 0; lm = lm || NULLM;
  for (i = 0; i < n; i += 2){ j = (i+2) % n; ar += p[i]*p[j+1] - p[j]*p[i+1]; }
  if (ar < 0){ var q = []; for (i = n - 2; i >= 0; i -= 2) q.push(p[i], p[i+1]); p = b.pts = q; }
  var K = KIND[b.kind] || KIND.house, lv = b.levels || (b.kind === 'house' ? 1 + (hash(b.id, 5, 1) < 0.35 ? 1 : 0) : Math.min(b.area < 350 ? 2 : 9, K.lv[0] + Math.floor(hash(b.id, 5, 1)*(K.lv[1] - K.lv[0] + 1))));
  if (b.tw === undefined) b.tw = towerOf(b); if (b.tw && lv < b.tw) lv = b.tw;   /* some downtown buildings are towers, six to fourteen storeys */
  var Ht = b.h = Math.min(48, (K.lh || 3.2) + (Math.max(1, lv) - 1)*3.2), hf = hash(b.id, 4, 6);
  var ST = bstyle(b), lhg = Math.min(Ht, K.lh || 3.2), mark = world.nests && world.nests[b.id] ? [196,160,226] : b.id === world.safe ? [214,238,200] : WHITE;
  var wcol = (b.col0 ? C(b.col).map(function(v){ return Math.round(255 - (255 - v)*0.8); }) : C(ST.wc)).map(function(v, q){ return Math.round(v*mark[q]/255); }), rcol = C(ST.rc), tint = wcol;
  b.lhg = lhg; b.ft = 200 + ST.gp; b.fc = wcol; b.rt = 200 + BT['roof_' + ST.roof]; b.rc = rcol;
  var best = -1, bl = 1.9;
  for (var tries = 0; tries < 3 && best < 0; tries++) for (i = 0; i < n; i += 2){
    j = (i+2) % n; var l0 = Math.hypot(p[j]-p[i], p[j+1]-p[i+1]); if (l0 <= bl) continue;
    var ox = (p[j+1]-p[i+1])/l0, oz = -(p[j]-p[i])/l0, qx = (p[i]+p[j])/2, qz = (p[i+1]+p[j+1])/2;
    if (tries < 2 && (blocked(qx + ox*0.6, qz + oz*0.6) || (tries < 1 && (blocked(qx + ox*1.6, qz + oz*1.6) || blocked(qx + ox*2.8, qz + oz*2.8))))) continue;
    bl = l0; best = i;
  }
  b.segs = []; b.door = null; b.wins = []; b.wsegs = []; b.dseg = null; b.bar = null; b.sbar = null; b.gbar = null; b.php = null; 
  /* one stretch of wall from s = sL to sR (metres from the left end of an edge of length l), from height y0 up to the roof */
  /* each wall is laid in 4 m bays centred on its windows: a bay with a window gets the window tile, the stretches at the ends a plain one */
  /* corner shadowing: a wall darkens softly over the last 2.5 m toward each corner, and a little toward the ground, so corners always read */
  var CAO = function(s, l){ var e = Math.min(s, l - s); return 1 - 0.24*Math.max(0, 1 - e/2.5); }, GAO = function(y){ return y < 0.3 ? 0.88 : 1; };
  var FS = FRON ? frStyle(ST, tint, rcol) : null, FD = !!FS && m !== NULLM && FRNOW;   /* FS also on the plain pass (NULLM), so the windows you can open are where the framed walls put them; FD: draw framed (near you) */
  var W = function(xL, zL, xR, zR, sL, sR, l, y0, front){
    var lenS = sR - sL; if (lenS < 0.005) return;
    var cut = [sL], q0 = Math.ceil((sL - l/2)/4 - 1e-6); for (var qb = q0; l/2 + qb*4 < sR - 1e-6; qb++) if (l/2 + qb*4 > sL + 1e-6) cut.push(l/2 + qb*4); cut.push(sR);
    for (var ci = 0; ci + 1 < cut.length; ci++){
      var s0 = cut[ci], s1 = cut[ci + 1], f0 = (s0 - sL)/lenS, f1 = (s1 - sL)/lenS, x0 = xL + (xR - xL)*f0, z0 = zL + (zR - zL)*f0, x1 = xL + (xR - xL)*f1, z1 = zL + (zR - zL)*f1;
      var bc = l/2 + 4*Math.floor(((s0 + s1)/2 - l/2)/4) + 2, win = l > 3.2 && bc > 0.8 && bc < l - 0.8, u0 = (s0 - l/2)/4, u1 = (s1 - l/2)/4;
      if (y0 < lhg){ var tg = win ? (front && Math.abs(bc - l/2) < ST.fr ? ST.g : ST.gs) : ST.gp, hl = win && y0 < 0.3 && HOLES[tg] ? HOLES[tg].filter(function(H0){ return bc - 2 + H0[0] - H0[1] > s0 + 0.02 && bc - 2 + H0[0] + H0[1] < s1 - 0.02; }) : null; if (hl && !hl.length) hl = null;
        if (!hl) m.wallT(x0,z0,x1,z1, y0, lhg, u0, u1, 1 - y0/lhg, 0, 200 + tg, tint, 0, CAO(s0, l), CAO(s1, l), GAO(y0));
        else {   /* the wall round each window, leaving the glass open */
          /* 0.38: the wall has thickness at its openings (a reveal round the glass) and the window a sill: depth instead of a flat picture */
          var reveal = function(sa, sb, ya, yb, sill){ var fa = (sa - sL)/lenS, fb = (sb - sL)/lenS, ax0 = xL + (xR - xL)*fa, az0 = zL + (zR - zL)*fa, bx0 = xL + (xR - xL)*fb, bz0 = zL + (zR - zL)*fb, ux0 = (xR - xL)/Math.hypot(xR - xL, zR - zL), uz0 = (zR - zL)/Math.hypot(xR - xL, zR - zL), inx = uz0*0.16, inz = -ux0*0.16, rc = tint.map(function(v){ return Math.round(v*0.78); });
            m.quad(ax0, ya, az0, ax0 + inx, ya, az0 + inz, ax0 + inx, yb, az0 + inz, ax0, yb, az0, rc, 255); m.quad(bx0, ya, bz0, bx0, yb, bz0, bx0 + inx, yb, bz0 + inz, bx0 + inx, ya, bz0 + inz, rc, 255);
            m.quad(ax0, yb, az0, ax0 + inx, yb, az0 + inz, bx0 + inx, yb, bz0 + inz, bx0, yb, bz0, rc, 255); m.quad(ax0, ya, az0, bx0, ya, bz0, bx0 + inx, ya, bz0 + inz, ax0 + inx, ya, az0 + inz, rc, 255);
            if (sill){ var ex0 = ux0*0.09, ez0 = uz0*0.09, sx0 = ax0 - ex0 - inx*0.6, sz0 = az0 - ez0 - inz*0.6, sx1 = bx0 + ex0 - inx*0.6, sz1 = bz0 + ez0 - inz*0.6, sc0 = [232,228,218];
              m.quad(sx0, ya, sz0, sx1, ya, sz1, sx1 + inx*0.6, ya, sz1 + inz*0.6, sx0 + inx*0.6, ya, sz0 + inz*0.6, sc0, 255); m.quad(sx0, ya - 0.09, sz0, sx1, ya - 0.09, sz1, sx1, ya, sz1, sx0, ya, sz0, sc0, 255); } };
          var ulen = Math.hypot(xR - xL, zR - zL), inxG = function(){ return (zR - zL)/ulen*0.1; }, inzG = function(){ return -(xR - xL)/ulen*0.1; };
          var hk = lhg/3.2, piece = function(sa, sb, ya, yb){ if (sb - sa < 0.005 || yb - ya < 0.005) return; var fa = (sa - sL)/lenS, fb = (sb - sL)/lenS;
            m.wallT(xL + (xR - xL)*fa, zL + (zR - zL)*fa, xL + (xR - xL)*fb, zL + (zR - zL)*fb, ya, yb, (sa - l/2)/4, (sb - l/2)/4, 1 - ya/lhg, 1 - yb/lhg, 200 + tg, tint, 0, CAO(sa, l), CAO(sb, l), GAO(ya)); };
          var sc = s0;
          for (var hi = 0; hi < hl.length; hi++){ var H0 = hl[hi], ha = bc - 2 + H0[0] - H0[1], hb = bc - 2 + H0[0] + H0[1], ya = Math.max(y0, H0[2]*hk), yb = H0[3]*hk;
            piece(sc, ha, y0, lhg); piece(ha, hb, y0, ya); piece(ha, hb, yb, lhg); sc = hb; reveal(ha, hb, ya, yb, H0[2] > 0.45);
            if (m !== NULLM){ var gm = m.gm || (m.gm = new Mesh()), fa2 = (ha - sL)/lenS, fb2 = (hb - sL)/lenS, gx0 = xL + (xR - xL)*fa2 + inxG(), gz0 = zL + (zR - zL)*fa2 + inzG(), gx1 = xL + (xR - xL)*fb2 + inxG(), gz1 = zL + (zR - zL)*fb2 + inzG(); gm.quad(gx0, ya, gz0, gx1, ya, gz1, gx1, yb, gz1, gx0, yb, gz0, [150, 190, 205], 255); } }
          piece(sc, s1, y0, lhg);
        } }
      if (Ht > lhg + 0.01){ var yb = Math.max(y0, lhg); m.wallT(x0,z0,x1,z1, yb, Ht, u0, u1, 1 - (yb - lhg)/3.2, 1 - (Ht - lhg)/3.2, 200 + (win ? ST.u : ST.gp), tint, 0, CAO(s0, l), CAO(s1, l), 1); }
    }
  };
  for (i = 0; i < n; i += 2){
    j = (i+2) % n; var ax = p[i], az = p[i+1], bx = p[j], bz = p[j+1], l = Math.hypot(bx-ax, bz-az); if (l < 0.01) continue;
    var dx = (bx-ax)/l, dz = (bz-az)/l, nx = -dz, nz = dx;
    var wl = [], ops = [], k, ps = 0, h2 = (i + n - 2) % n, pl = Math.hypot(ax - p[h2], az - p[h2+1]) || 1, turn = ((ax - p[h2])/pl)*dz - ((az - p[h2+1])/pl)*dx;
    if (i === best){
      var mx = (ax+bx)/2, mz = (az+bz)/2, x1 = mx - dx*0.65, z1 = mz - dz*0.65, x2 = mx + dx*0.65, z2 = mz + dz*0.65;
      if (!FD) { W(x1,z1,ax,az, l/2 + 0.65, l, l, 0, true); W(bx,bz,x2,z2, 0, l/2 - 0.65, l, 0, true); W(x2,z2,x1,z1, l/2 - 0.65, l/2 + 0.65, l, 2.2, true); }
      b.door = {x:mx, y:mz, nx:nx, ny:nz}; b.dseg = [x1, z1, x2, z2];
      if (!FD){ lm.line(x1,0,z1, x1,2.2,z1, INK); lm.line(x2,0,z2, x2,2.2,z2, INK); lm.line(x1,2.2,z1, x2,2.2,z2, INK); }
    } else if (!FD) W(bx,bz,ax,az, 0, l, l, 0, false);
    if (FS) wl = frWall(FD ? m : NULLM, b, FS, ST, K, ax, az, dx, dz, l, i, i === best, lhg, Ht, Math.abs(turn) > 0.47, CAO);
    /* the solid wall is stored in pieces, with a separate short piece for each window so a window can be opened */
    else if (l > 3.2){ for (k = -Math.ceil(l/8) - 1; k <= Math.ceil(l/8); k++){ var tp = l/2 + (k + 0.5)*4; if (tp > 0.8 && tp < l - 0.8) wl.push(tp + winOff(i === best && Math.abs(tp - l/2) < ST.fr ? ST.g : ST.gs)); } }   /* the painted fronts have a window every 4 m, counted from the middle of the wall */
    wl.forEach(function(t){ ops.push([t - 0.45, t + 0.45, t]); }); if (i === best) ops.push([l/2 - 0.65, l/2 + 0.65, -1]); ops.sort(function(x, y){ return x[0] - y[0]; });
    ops.forEach(function(o){
      if (o[0] - ps > 0.01) b.segs.push(ax + dx*ps, az + dz*ps, ax + dx*o[0], az + dz*o[0]);
      if (o[2] >= 0){ b.wins.push(ax + dx*o[2], az + dz*o[2], dx, dz, nx, nz); b.wsegs.push(ax + dx*o[0], az + dz*o[0], ax + dx*o[1], az + dz*o[1]); }
      ps = o[1];
    });
    if (l - ps > 0.01) b.segs.push(ax + dx*ps, az + dz*ps, bx, bz);
    if (FD) continue;   /* framed walls bring their own plinth, posts and corners */
    lm.line(ax,Ht,az, bx,Ht,bz, INK); lm.line(ax,0.02,az, bx,0.02,bz, INK);
    if (Math.abs(turn) > 0.47) lm.line(ax,0,az, ax,Ht,az, INK);
    /* 0.38: base, middle, top. The base: a plinth of foundation a little proud of the wall, broken at the door */
    var ox2 = -nx, oz2 = -nz, PL = ST.mat === 'metal' ? 0.25 : 0.42, pcol = [150,146,138], plink = function(s0p, s1p){ if (s1p - s0p < 0.2) return; var x0p = ax + dx*s0p, z0p = az + dz*s0p, x1p = ax + dx*s1p, z1p = az + dz*s1p, f0 = 0.07;   /* only the faces that can be seen: front and top */
      m.quadV(x0p + ox2*f0, -0.1, z0p + oz2*f0, x1p + ox2*f0, -0.1, z1p + oz2*f0, x1p + ox2*f0, PL, z1p + oz2*f0, x0p + ox2*f0, PL, z0p + oz2*f0, [86,84,80], pcol); m.quad(x0p + ox2*f0, PL, z0p + oz2*f0, x1p + ox2*f0, PL, z1p + oz2*f0, x1p, PL, z1p, x0p, PL, z0p, pcol, 255); };
    if (i === best){ plink(0, l/2 - 0.75); plink(l/2 + 0.75, l); } else plink(0, l);
    /* corners turned in trim: boards on sided houses, pilasters on brick and stone fronts, flashing on sheds */
    if (Math.abs(turn) > 0.47){ var cc0 = ST.mat === 'siding' ? [238,234,226] : ST.mat === 'metal' ? [96,100,104] : tint.map(function(v){ return Math.round(v*0.86); }), cw0 = ST.mat === 'metal' ? 0.06 : ST.mat === 'siding' ? 0.09 : 0.16;
      var pdx = (ax - p[h2])/pl, pdz = (az - p[h2+1])/pl, pox = pdz, poz = -pdx, co = 0.035;   /* a board on each face meeting at the corner */
      m.quad(ax + ox2*co, 0, az + oz2*co, ax + dx*cw0*2 + ox2*co, 0, az + dz*cw0*2 + oz2*co, ax + dx*cw0*2 + ox2*co, Ht, az + dz*cw0*2 + oz2*co, ax + ox2*co, Ht, az + oz2*co, cc0, 255);
      m.quad(ax + pox*co, 0, az + poz*co, ax - pdx*cw0*2 + pox*co, 0, az - pdz*cw0*2 + poz*co, ax - pdx*cw0*2 + pox*co, Ht, az - pdz*cw0*2 + poz*co, ax + pox*co, Ht, az + poz*co, cc0, 255); }
  }
  b.segs0 = b.segs; breachApply(b, m, lhg, FS, ST);   /* 0.69: pieces of the outer wall that have been torn open */
  if (FS && FD && b.door && b.hn && b.kind === 'house'){   /* 0.75: the house number on a plaque beside the front door */
    var hd = String(b.hn).replace(/[^0-9]/g, '').slice(-3), pm0 = hd && bkMod('house', '', 'plaque');
    if (pm0){ var dr = b.door, ddx = dr.ny, ddz = -dr.nx, o2x = -dr.nx, o2z = -dr.ny, hx0 = dr.x + ddx*1.4 + o2x*0.09, hz0 = dr.y + ddz*1.4 + o2z*0.09, idf = function(v){ return v; }, aof = function(){ return 0.96; };
      if (!blocked(hx0 + o2x*0.5, hz0 + o2z*0.5) || true){ frPut(m, pm0, FS, hx0, hz0, -ddx, -ddz, o2x, o2z, 1.8, idf, idf, aof, 0);
        for (var di = 0; di < hd.length; di++){ var dm = bkMod('house', '', 'digit_' + hd[di]); if (dm) frPut(m, dm, FS, hx0, hz0, -ddx, -ddz, o2x, o2z, 1.8, function(off){ return function(v){ return v + off; }; }((di - (hd.length - 1)/2)*0.1), idf, aof, 0); } } } }
  /* the door: a casing round it, and over the entrance of glass-fronted buildings a canopy */
  if (b.door && !ST.porch && !K.awn){ var dr0 = b.door, dox = -dr0.nx, doz = -dr0.ny, tx0 = -doz, tz0 = dox, dc0 = ST.mat === 'metal' ? [96,100,104] : [234,230,220];
    for (var sd0 = -1; sd0 <= 1; sd0 += 2) m.box(dr0.x + tx0*0.72*sd0 + dox*0.03, 1.15, dr0.y + tz0*0.72*sd0 + doz*0.03, [tx0*0.07, 0, tz0*0.07], [0, 1.15, 0], [dox*0.05, 0, doz*0.05], dc0);
    m.box(dr0.x + dox*0.03, 2.32, dr0.y + doz*0.03, [tx0*0.79, 0, tz0*0.79], [0, 0.1, 0], [dox*0.05, 0, doz*0.05], dc0);
    if (ST.g === BT.glass_lobby && Ht > 3.3){ m.box(dr0.x + dox*1.2, 3.05, dr0.y + doz*1.2, [tx0*2.2, 0, tz0*2.2], [0, 0.09, 0], [dox*1.2, 0, doz*1.2], [200,204,206]);
      for (sd0 = -1; sd0 <= 1; sd0 += 2) m.box(dr0.x + dox*2.25 + tx0*2.0*sd0, 1.5, dr0.y + doz*2.25 + tz0*2.0*sd0, [tx0*0.06, 0, tz0*0.06], [0, 1.5, 0], [dox*0.06, 0, doz*0.06], [150,154,158]); }
  }
  /* trims: a cornice along the top of town fronts, a belt course over the shops, a porch over a home's front door */
  var TRIM = ST.mat === 'brick' || ST.mat === 'buff' ? [226,218,202] : ST.mat === 'stone' ? [214,206,188] : [236,232,224];
  for (i = 0; i < n && (ST.cornice || ST.belt); i += 2){
    j = (i+2) % n; var cl = Math.hypot(p[j]-p[i], p[j+1]-p[i+1]); if (cl < 0.5) continue; var cdx = (p[j]-p[i])/cl, cdz = (p[j+1]-p[i+1])/cl, cox = cdz, coz = -cdx, cmx = (p[i]+p[j])/2, cmz = (p[i+1]+p[j+1])/2;
    if (ST.cornice) m.box(cmx + cox*0.1, Ht - 0.16, cmz + coz*0.1, [cdx*(cl/2 + 0.1), 0, cdz*(cl/2 + 0.1)], [0, 0.16, 0], [cox*0.13, 0, coz*0.13], TRIM);
    if (ST.belt && Ht > lhg + 1) m.box(cmx + cox*0.05, lhg + 0.04, cmz + coz*0.05, [cdx*(cl/2 + 0.05), 0, cdz*(cl/2 + 0.05)], [0, 0.07, 0], [cox*0.07, 0, coz*0.07], TRIM);
  }
  if (ST.porch && b.door){
    var pd = b.door, pox = -pd.nx, poz = -pd.ny, pya = Math.atan2(poz, pox);
    m.ybox(pd.x, pd.y, pya, 0.95, 0, 2.62, 1.0, 0.06, 1.45, TRIM); m.ybox(pd.x, pd.y, pya, 0.95, 0, 2.7, 0.9, 0.03, 1.35, rcol);
    [-1.3, 1.3].forEach(function(sd){ m.ybox(pd.x, pd.y, pya, 1.82, sd, 1.28, 0.06, 1.28, 0.06, TRIM); });
    m.ybox(pd.x, pd.y, pya, 0.75, 0, 0.07, 0.75, 0.07, 1.2, [176,168,156]);
  }
  var tr = b.tri = earclip(p), cxr = b.cx, czr = b.cy, hip = (K.roof === 'hip' ? b.rs !== 'flat' : b.rs === 'gabled' || b.rs === 'hipped') && n <= 24 && b.area < 900 && pip(p, cxr, czr), q, r;   /* b.rs: the roof shape the map says (0.92) */
  /* the top: a roof that reaches past the walls. A plain box of a house (four square corners) gets a gable roof about half the time */
  var gab = null;
  if (hip && n === 8 && b.kind !== 'church' && b.rs !== 'hipped' && (b.rs === 'gabled' || hash(b.id, 21, 4) < 0.55)){ var sq = true; for (i = 0; i < 8; i += 2){ var i1 = (i + 2) % 8, i2 = (i + 4) % 8, e1x = p[i1] - p[i], e1z = p[i1+1] - p[i+1], e2x = p[i2] - p[i1], e2z = p[i2+1] - p[i1+1]; if (Math.abs(e1x*e2x + e1z*e2z)/(Math.hypot(e1x, e1z)*Math.hypot(e2x, e2z) || 1) > 0.12) sq = false; }
    if (sq){ var L0 = Math.hypot(p[2] - p[0], p[3] - p[1]), L1 = Math.hypot(p[4] - p[2], p[5] - p[3]), s0g = L0 >= L1 ? 0 : 2; gab = [0, 1, 2, 3].map(function(k){ var ii = ((s0g/2 + k) % 4)*2; return [p[ii], p[ii+1]]; }); } }
  var EV = 0.45, eaveRing = function(y){ var out = []; for (var k = 0; k < n; k += 2){ var kp = (k - 2 + n) % n, kn = (k + 2) % n, ax1 = p[k] - p[kp], az1 = p[k+1] - p[kp+1], ax2 = p[kn] - p[k], az2 = p[kn+1] - p[k+1], l1 = Math.hypot(ax1, az1) || 1, l2 = Math.hypot(ax2, az2) || 1;
      var o1x = az1/l1, o1z = -ax1/l1, o2x = az2/l2, o2z = -ax2/l2, mx = o1x + o2x, mz = o1z + o2z, dd = 1 + o1x*o2x + o1z*o2z, f = dd > 0.3 ? EV/dd : EV/0.3; out.push(p[k] + mx*f, p[k+1] + mz*f); } return out; };
  if (gab){
    /* ridge along the long side, eaves past the long walls, rakes past the gable ends, the gable ends walled in the house's own siding */
    var A = gab[0], B = gab[1], Cc = gab[2], D = gab[3], ex = (B[0] - A[0])/Math.hypot(B[0] - A[0], B[1] - A[1]), ez = (B[1] - A[1])/Math.hypot(B[0] - A[0], B[1] - A[1]), wid = Math.hypot(Cc[0] - B[0], Cc[1] - B[1]);
    var rise = Math.min(3.4, 0.9 + wid*0.32), top = Ht + rise, R1 = [(A[0] + D[0])/2, (A[1] + D[1])/2], R2 = [(B[0] + Cc[0])/2, (B[1] + Cc[1])/2], gx = -ez, gz = ex;   /* g points from AB toward DC */
    var ext = function(P0, along, out){ return [P0[0] + ex*along - gx*out, P0[1] + ez*along - gz*out]; }, dy = rise/(wid/2), lowY = Ht - EV*dy;
    var a1 = ext(A, -EV, EV), b1 = ext(B, EV, EV), d1 = ext(D, -EV, -EV), c1 = ext(Cc, EV, -EV), r1 = ext(R1, -EV, 0), r2 = ext(R2, EV, 0);
    m.pl = [200 + BT.roof_shingle, 1/4];
    m.quad(a1[0], lowY, a1[1], b1[0], lowY, b1[1], r2[0], top, r2[1], r1[0], top, r1[1], rcol, 255); m.quad(c1[0], lowY, c1[1], d1[0], lowY, d1[1], r1[0], top, r1[1], r2[0], top, r2[1], rcol, 255);
    m.pl = null;
    [[B, Cc, R2], [D, A, R1]].forEach(function(G2){ var gl0 = Math.hypot(G2[1][0] - G2[0][0], G2[1][1] - G2[0][1]); m.quadUV([G2[0][0], Ht, G2[0][1], G2[1][0], Ht, G2[1][1], G2[2][0], top, G2[2][1], G2[2][0], top, G2[2][1]], [0, 1, gl0/4, 1, gl0/8, 1 - rise/3.2, gl0/8, 1 - rise/3.2], 200 + ST.gp, tint, 255); lm.line(G2[0][0], Ht, G2[0][1], G2[2][0], top, G2[2][1], INK); lm.line(G2[1][0], Ht, G2[1][1], G2[2][0], top, G2[2][1], INK); });
    var FC = [238,234,226]; [[a1, b1, lowY, lowY], [c1, d1, lowY, lowY], [b1, r2, lowY, top], [r2, c1, top, lowY], [d1, r1, lowY, top], [r1, a1, top, lowY]].forEach(function(E2){ var mx = (E2[0][0] + E2[1][0])/2, mz = (E2[0][1] + E2[1][1])/2, hx = (E2[1][0] - E2[0][0])/2, hz = (E2[1][1] - E2[0][1])/2, hy = (E2[3] - E2[2])/2; m.box(mx, (E2[2] + E2[3])/2 - 0.1, mz, [hx, hy, hz], [0, 0.1, 0], [-hz/Math.hypot(hx, hz)*0.05, 0, hx/Math.hypot(hx, hz)*0.05], FC); });   /* fascia and barge boards */
    lm.line(r1[0], top, r1[1], r2[0], top, r2[1], INK); lm.line(a1[0], lowY, a1[1], b1[0], lowY, b1[1], INK); lm.line(c1[0], lowY, c1[1], d1[0], lowY, d1[1], INK);
    if (b.kind === 'house' && hash(b.id, 9, 2) < 0.6){ var cxh = R1[0] + (R2[0] - R1[0])*0.28, czh = R1[1] + (R2[1] - R1[1])*0.28; m.ybox(cxh, czh, Math.atan2(ez, ex), 0, 0, top - 0.1, 0.36, 0.95, 0.32, [150,92,72]); }
    hip = false; b.gable = true;
  }
  if (hip){
    /* a pitched roof: every wall leans in to a smaller copy of the outline held above the middle */
    var rise = b.kind === 'church' ? Math.min(6, Math.sqrt(b.area)*0.45) : Math.min(3.2, 0.8 + Math.sqrt(b.area)*0.2), f = 0.3, top = Ht + rise, ip = [], er = eaveRing(), eY = Ht - 0.22;
    for (i = 0; i < n; i += 2) ip.push(cxr + (p[i] - cxr)*f, czr + (p[i+1] - czr)*f);
    m.pl = [200 + BT['roof_' + (ST.roof === 'flat' ? 'shingle' : ST.roof)], 1/4];
    for (i = 0; i < n; i += 2){ j = (i+2) % n; m.quad(er[i], eY, er[i+1], er[j], eY, er[j+1], ip[j], top, ip[j+1], ip[i], top, ip[i+1], rcol, 255); lm.line(er[i], eY, er[i+1], ip[i], top, ip[i+1], INK); lm.line(ip[i], top, ip[i+1], ip[j], top, ip[j+1], INK); lm.line(er[i], eY, er[i+1], er[j], eY, er[j+1], INK); }
    m.pl = null;
    for (i = 0; i < n; i += 2){ j = (i+2) % n; m.quad(er[i], eY - 0.2, er[i+1], er[j], eY - 0.2, er[j+1], er[j], eY, er[j+1], er[i], eY, er[i+1], [238,234,226], 255);   /* fascia */
      m.quad(p[i], Ht - 0.02, p[i+1], p[j], Ht - 0.02, p[j+1], er[j], eY - 0.2, er[j+1], er[i], eY - 0.2, er[i+1], tint.map(function(v){ return Math.round(v*0.7); }), 255); }   /* soffit, in shadow */
    m.pl = [200 + BT['roof_' + (ST.roof === 'flat' ? 'shingle' : ST.roof)], 1/4];
    for (i = 0; i < tr.length; i += 3) m.tri(ip[tr[i]*2], top, ip[tr[i]*2+1], ip[tr[i+2]*2], top, ip[tr[i+2]*2+1], ip[tr[i+1]*2], top, ip[tr[i+1]*2+1], rcol, 255);
    m.pl = null;
    if (b.kind === 'house' && hash(b.id, 9, 2) < 0.6) m.ybox(cxr + (p[0] - cxr)*0.45, czr + (p[1] - czr)*0.45, 0, 0, 0, Ht + rise*0.55 + 0.5, 0.32, rise*0.45 + 0.5, 0.32, [150,92,72]);
    if (b.kind === 'church'){ m.ybox(cxr, czr, 0.4, 0, 0, top + 1.2, 1.3, 1.6, 1.3, [176,168,156]); m.pyr(cxr, czr, top + 2.8, 1.9, 7, [96,88,92], 0.4); }
  } else if (!gab) {
    if (b.kind === 'church' && pip(p, cxr, czr)){ m.ybox(cxr, czr, 0.4, 0, 0, Ht + 2, 1.6, 2, 1.6, [176,168,156]); m.pyr(cxr, czr, Ht + 4, 2.3, 8, [96,88,92], 0.4); }
    m.pl = [b.rt, 1/4];
    for (i = 0; i < tr.length; i += 3) m.tri(p[tr[i]*2], Ht, p[tr[i]*2+1], p[tr[i+2]*2], Ht, p[tr[i+2]*2+1], p[tr[i+1]*2], Ht, p[tr[i+1]*2+1], rcol, 255);
    m.pl = null;
    if (b.area <= 70){ for (i = 0; i < n; i += 2){ j = (i+2) % n; var fl0 = Math.hypot(p[j] - p[i], p[j+1] - p[i+1]) || 1, fdx = (p[j] - p[i])/fl0, fdz = (p[j+1] - p[i+1])/fl0; m.box((p[i] + p[j])/2 + fdz*0.06, Ht - 0.1, (p[i+1] + p[j+1])/2 - fdx*0.06, [fdx*(fl0/2 + 0.1), 0, fdz*(fl0/2 + 0.1)], [0, 0.13, 0], [fdz*0.07, 0, -fdx*0.07], [226,222,212]); } }
    if (b.area > 70){
      /* a low wall around the flat roof, and machinery on top of the bigger ones */
      var pc = tint.map(function(v){ return Math.round(v*0.92); });
      /* small-town shops: the front wall rises above the roof as a false front, so the street sees a taller, squarer building */
      var ff = (K.awn || ST.belt) && Ht <= 4.6 && b.area < 900 && hash(b.id, 23, 5) < 0.7 ? 1.1 : 0, cop = [228,224,214];
      for (i = 0; i < n; i += 2){ j = (i+2) % n; var ph = Ht + 0.55 + (i === best ? ff : 0), el0 = Math.hypot(p[j] - p[i], p[j+1] - p[i+1]) || 1, edx = (p[j] - p[i])/el0, edz = (p[j+1] - p[i+1])/el0;
        if (i === best && ff){ m.wallT(p[j], p[j+1], p[i], p[i+1], Ht, ph, -el0/8, el0/8, 0.9, 0.9 - ff/3.2, 200 + ST.gp, tint, 0); } else m.quad(p[i], Ht, p[i+1], p[j], Ht, p[j+1], p[j], ph, p[j+1], p[i], ph, p[i+1], pc, 255);
        lm.line(p[i], ph, p[i+1], p[j], ph, p[j+1], INK);
        var cx0 = p[i] - edx*0.1, cz0 = p[i+1] - edz*0.1, cx1 = p[j] + edx*0.1, cz1 = p[j+1] + edz*0.1, cpx = edz*0.12, cpz = -edx*0.12;
        m.quad(cx0 + cpx, ph + 0.1, cz0 + cpz, cx1 + cpx, ph + 0.1, cz1 + cpz, cx1 - cpx, ph + 0.1, cz1 - cpz, cx0 - cpx, ph + 0.1, cz0 - cpz, cop, 255); m.quad(cx0 + cpx, ph - 0.04, cz0 + cpz, cx1 + cpx, ph - 0.04, cz1 + cpz, cx1 + cpx, ph + 0.1, cz1 + cpz, cx0 + cpx, ph + 0.1, cz0 + cpz, cop, 255); }   /* a coping along the top */
      if (ff && best >= 0){ var bj = (best + 2) % n, bmx = (p[best] + p[bj])/2, bmz = (p[best+1] + p[bj+1])/2, bl0 = Math.hypot(p[bj] - p[best], p[bj+1] - p[best+1]), bdx = (p[bj] - p[best])/bl0, bdz = (p[bj+1] - p[best+1])/bl0;
        m.box(bmx, Ht + 0.6 + ff + 0.25, bmz, [bdx*Math.min(2.2, bl0*0.2), 0, bdz*Math.min(2.2, bl0*0.2)], [0, 0.25, 0], [bdz*0.12, 0, -bdx*0.12], tint); }   /* a raised centre step on the false front */
      if (b.area > 220) for (q = 0, r = Math.min(4, Math.floor(b.area/350) + 1); q < r; q++){ var ux = cxr + (hash(b.id, q, 61) - 0.5)*(b.maxx - b.minx)*0.5, uz = czr + (hash(b.id, q, 62) - 0.5)*(b.maxy - b.miny)*0.5; if (pip(p, ux, uz) && polyDist(p, ux, uz, true) > 1.6) m.ybox(ux, uz, hash(b.id, q, 63) < 0.5 ? 0 : 1.5708, 0, 0, Ht + 0.5, 0.9, 0.5, 0.65, [158,158,152]); }
    }
    /* a fixed ladder up one side wall of most low flat-roofed buildings: the roof is somewhere to look out from, or to wait it out */
    if (m === NULLM) b.lad = null;
    if (m === NULLM && Ht <= 13 && b.area >= 30 && hash(b.id, 8, 71) < 0.75){
      var lsc = -1;
      for (i = 0; i < n; i += 2){
        if (i === best) continue; j = (i+2) % n; var l1 = Math.hypot(p[j]-p[i], p[j+1]-p[i+1]); if (l1 < 3) continue;
        var ux1 = (p[j]-p[i])/l1, uz1 = (p[j+1]-p[i+1])/l1, wx0 = p[i] + ux1*(l1 - 0.8), wz0 = p[i+1] + uz1*(l1 - 0.8), ox1 = uz1, oz1 = -ux1, tx1 = wx0 - ox1*0.8, tz1 = wz0 - oz1*0.8;
        if (blocked(wx0 + ox1*1.1, wz0 + oz1*1.1) || blocked(wx0 + ox1*2.0, wz0 + oz1*2.0) || inWater(wx0 + ox1*1.1, wz0 + oz1*1.1, 0.4)) continue;
        if (!pip(p, tx1, tz1) || polyDist(p, tx1, tz1, true) < 0.5) continue;
        var sc1 = l1 + hash(b.id, i, 72)*6; if (sc1 > lsc){ lsc = sc1; b.lad = {x:wx0, y:wz0, nx:ox1, ny:oz1, fx:wx0 + ox1*1.05, fy:wz0 + oz1*1.05, tx:tx1, ty:tz1, b:b}; }
      }
    }
    if (b.lad){
      var LD = b.lad, lyaw = Math.atan2(LD.ny, LD.nx), ly0 = world.hg ? Math.min(0, hAt(LD.fx, LD.fy) - (b.base || 0)) : 0, ltop = Ht + 1.0, lcol = [138,140,138];
      /* it stands clear of the deepest kit facade, held to the wall by brackets */
      m.ybox(LD.x, LD.y, lyaw, 0.46, -0.25, (ly0 + ltop)/2, 0.035, (ltop - ly0)/2, 0.035, lcol); m.ybox(LD.x, LD.y, lyaw, 0.46, 0.25, (ly0 + ltop)/2, 0.035, (ltop - ly0)/2, 0.035, lcol);
      for (var ry = ly0 + 0.3; ry < ltop - 0.05; ry += 0.32) m.ybox(LD.x, LD.y, lyaw, 0.46, 0, ry, 0.022, 0.022, 0.25, lcol);
      for (var by = 1.5; by < Ht; by += 3) m.ybox(LD.x, LD.y, lyaw, 0.23, 0, by, 0.23, 0.03, 0.27, lcol);
      m.ybox(LD.x, LD.y, lyaw, 0.08, -0.25, ltop - 0.04, 0.4, 0.035, 0.035, lcol); m.ybox(LD.x, LD.y, lyaw, 0.08, 0.25, ltop - 0.04, 0.4, 0.035, 0.035, lcol);
    }
  }
  /* an awning and a sign board over the door of anything with a shopfront */
  if (K.awn && b.door && Ht > 3.3){ var dd = b.door, ox = -dd.nx, oz = -dd.ny, ya = Math.atan2(oz, ox), ac = C(K.awn); m.ybox(dd.x + ox*0.65, dd.y + oz*0.65, ya, 0, 0, 2.62, 0.65, 0.06, 1.7, ac); m.ybox(dd.x + ox*0.08, dd.y + oz*0.08, ya, 0, 0, 3.2, 0.05, 0.3, 1.5, [Math.round(ac[0]*0.7), Math.round(ac[1]*0.7), Math.round(ac[2]*0.7)]); }
}
var NULLM = {box:function(){}, ybox:function(){}, pyr:function(){}, wall:function(){}, tri:function(){}, quad:function(){}, quadV:function(){}, wallT:function(){}, quadUV:function(){}, line:function(){}};
/* ground tiles (roads, pavements, paths, water) on the graphics chip only near you: up within the draw distance plus a tile, gone when well past it */
function manageGroundTiles(){ var G = world.gl && world.gl.ground; if (!G) return; var R = Math.min(QS.far, 800) + 130 + 256, n = 0, have = 0, i, o, d;
  for (i = 0; i < G.length; i++) if (G[i].g) have++;
  var budget = have ? 3 : 64;
  for (i = 0; i < G.length; i++){ o = G[i]; d = Math.max(Math.abs(o.x - P.x), Math.abs(o.y - P.y));
    if (!o.g && d < R && n < budget){ if (o.d){ o.g = gtLen(o.d) ? upload(gtMesh(o.d)) : {n:0, nil:1}; n++; } else if (o.z && !o.wait){ gtUnpack(o, world); n++; } }
    else if (o.g && d > R + 320){ if (!o.g.nil) freeMesh(o.g); o.g = null; if (o.z) o.d = null; }
  } }
/* 0.117.4: a ground tile far from you is packed into a compressed blob (outside the page's working memory where the browser allows) and unpacked when you come near */
function gtCat(L, T){ var n = 0, i, o; for (i = 0; i < L.length; i++) n += L[i].length; o = new T(n); n = 0; for (i = 0; i < L.length; i++){ o.set(L[i], n); n += L[i].length; } return o; }
function gtMesh(d){ return d.pp ? {p:gtCat(d.pp, Float32Array), c:gtCat(d.pc, Uint8Array), t:gtCat(d.pt, Float32Array)} : d; }
function gtLen(d){ return d.pp ? d.n : d.p.length; }
var GTZ = {busy:0, ok:typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' && typeof Blob === 'function' && typeof Response === 'function'};
function gtPackAll(w){ if (!GTZ.ok) return; var G = w.gl.ground.slice(), k = 0, run = function(){ if (world !== w) return; while (k < G.length && !(G[k].d && gtLen(G[k].d))) k++; if (k >= G.length) return; gtPack(G[k++], w, run); }; for (var j = 0; j < 8; j++) run(); }
function gtPack(o, w, next){ var d = o.d; o.wait = 1;
  var M = d.pp ? null : d, sum = function(L){ var n = 0; L.forEach(function(a){ n += a.length; }); return n; }, head = M ? new Uint32Array([M.p.length, M.c.length, M.t.length]) : new Uint32Array([sum(d.pp), sum(d.pc), sum(d.pt)]), bl = new Blob(M ? [head, M.p, M.c, M.t] : [head].concat(d.pp, d.pc, d.pt));
  new Response(bl.stream().pipeThrough(new CompressionStream('deflate-raw'))).blob().then(function(z){ GTZ.busy = 0; o.wait = 0; if (world !== w) return; o.z = z; o.d = null; if (next) next(); })
    .catch(function(){ GTZ.busy = 0; o.wait = 0; GTZ.ok = false; }); }
function gtUnpack(o, w){ o.wait = 1;
  new Response(o.z.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(ab){ o.wait = 0; if (world !== w || o.g) return;
    var h = new Uint32Array(ab, 0, 3), off = 12, p = new Float32Array(ab, off, h[0]); off += h[0]*4; var c = new Uint8Array(ab, off, h[1]); off += h[1]; var t = new Float32Array(ab.slice(off, off + h[2]*4));
    var dm = {p:p, c:c, t:t}, dd = Math.max(Math.abs(o.x - P.x), Math.abs(o.y - P.y)); if (dd < Math.min(QS.far, 800) + 130 + 256 + 320) o.g = upload(dm); })
    .catch(function(e){ o.wait = 0; console.warn('ground tile', e); }); }
/* building outsides are meshed only for the map pieces near you, and dropped when you move away */
function manageChunks(budget){
  manageTerrain(budget); manageTrees(Math.max(1, budget >> 1)); manageGround(1); manageGroundTiles(); manageMapProps(Math.max(1, budget >> 1)); var cs = world.gl.chunks, R = QS.chunk + CH, n = 0, nf = 0;
  for (var i = 0; i < cs.length; i++){
    var c = cs[i], d = Math.max(Math.abs(c.x - P.x), Math.abs(c.y - P.y));
    var wantF = FRON && d < FRD;   /* Art 5: rebuild a piece when it comes near enough for framed walls, or goes far enough for painted ones */
    if (c.g && FRON && c.frm !== wantF && (wantF || d > FRD + 40) && n < budget){ freeMesh(c.g); freeMesh(c.l); c.g = null; c.l = null; if (c.gg){ freeMesh(c.gg); c.gg = null; } }
    if (!c.g){ if (d < R && n < budget){ var m = new Mesh(), lm = new Mesh(); FRNOW = wantF; for (var j = 0; j < c.list.length; j++){ var bb = c.list[j], s0 = m.p.length, l0 = lm.p.length, g0 = m.gm ? m.gm.p.length : 0; shell(bb, m, lm); if (world.hg && !bb.gone){ seat(bb, m, lm, s0, l0); if (m.gm) for (var gq = g0 + 1; gq < m.gm.p.length; gq += 3) m.gm.p[gq] += bb.base; }   /* 0.125.4: the window glass is lifted with its building (it floated above roofs on hills) */ if (!bb.gone) footShade(m, s0, bb.base || 0); } FRNOW = false; c.frm = wantF; c.g = upload(m); c.l = upload(lm); if (c.gg){ freeMesh(c.gg); c.gg = null; } c.gg = m.gm ? upload(m.gm) : null; n++; } }
    else if (d > R + 150){ freeMesh(c.g); freeMesh(c.l); c.g = null; c.l = null; if (c.gg){ freeMesh(c.gg); c.gg = null; } }
    if (!c.far){ if (d < QS.far + CH && nf < Math.min(budget*3, 90)){ var fm = new Mesh(); for (var q = 0; q < c.list.length; q++) shellFar(c.list[q], fm); c.far = upload(fm); nf++; } }
    else if (d > QS.far + CH + 300){ freeMesh(c.far); c.far = null; }
  }
}
function shellFar(b, m){
  if (b.gone || !b.tri) return; var p = b.pts, n = p.length, y0 = b.base || 0, lo = (world.hg ? b.low : 0) - 0.4, top = y0 + b.h, tr = b.tri, i, j;
  for (i = 0; i < n; i += 2){ j = (i+2) % n; var l = Math.hypot(p[j]-p[i], p[j+1]-p[i+1]); if (l < 0.01) continue; m.wallT(p[j], p[j+1], p[i], p[i+1], lo, top, 0, l/4, 1 - (lo - y0)/3.2, 1 - b.h/3.2, b.ft, b.fc || WHITE, 255); }
  m.pl = [b.rt, 1/4]; for (i = 0; i < tr.length; i += 3) m.tri(p[tr[i]*2], top, p[tr[i]*2+1], p[tr[i+2]*2], top, p[tr[i+2]*2+1], p[tr[i+1]*2], top, p[tr[i+1]*2+1], b.rc || WHITE, 255); m.pl = null;
}
var TREE_T = 256;
function treeTile(key){
  var T = world.gl.trees, o = T.get(key); if (!o) return; var m = new Mesh(), trunk = C('#6b4a32'), g1 = C('#56643f'), g2 = C('#7a8a5e');
  var each = function(tr){
    m.yo = hAt(tr.x, tr.y);
    if (tr.hi && tr.alive) return;
    if (!tr.alive){ m.ybox(tr.x, tr.y, 0, 0, 0, 0.2, 0.2, 0.2, 0.2, trunk); return; }
    if (IMPR && natTex){
      var tk2 = treeKey(tr), r = (IMPR[tk2] || 5)*tr.sc, y0 = m.yo - 0.1, y1 = y0 + 2*r, tile = 60 + (IMPT[tk2] || 1), UVQ = [0.003,0.997, 0.997,0.997, 0.997,0.003, 0.003,0.003];
      var tt = tr.tint || (tr.tint = treeTint(tr)), tcol = [Math.min(255, tt[0]*240) | 0, Math.min(255, tt[1]*240) | 0, Math.min(255, tt[2]*240) | 0];
      for (var q = 0; q < 2; q++){ var a = tr.yw + q*1.5708, cx = Math.cos(a)*r, cz = Math.sin(a)*r; m.quadUV([tr.x - cx, y0, tr.y - cz, tr.x + cx, y0, tr.y + cz, tr.x + cx, y1, tr.y + cz, tr.x - cx, y1, tr.y - cz], UVQ, tile, tcol, 255); }
      return;
    }
    m.ybox(tr.x, tr.y, tr.r, 0, 0, 0.8, 0.16, 0.8, 0.16, trunk); m.pyr(tr.x, tr.y, 1.2, tr.r, tr.r*1.5, g1, tr.r*3); m.pyr(tr.x, tr.y, 1.2 + tr.r*0.9, tr.r*0.7, tr.r*1.3, g2, tr.r*3 + 0.6);
  };
  o.list.forEach(each); if (o.wild) o.wild.forEach(each); m.yo = 0;
  if (o.g) freeMesh(o.g); o.g = upload(m);
}
function treeT(kx, ky, mk){
  var T = world.gl.trees, key = gk(kx, ky), o = T.get(key);
  if (!o && mk) T.set(key, o = {key:key, kx:kx, ky:ky, list:[], wild:null, g:null, x:(kx + 0.5)*TREE_T, y:(ky + 0.5)*TREE_T});
  return o;
}
function buildTrees(){
  var T = world.gl.trees; if (T) T.forEach(function(o){ if (o.g) freeMesh(o.g); }); world.gl.trees = new Map(); world.cut = world.cut || {};
  world.trees.forEach(function(tr){ var o = treeT(Math.floor(tr.x/TREE_T), Math.floor(tr.y/TREE_T), true); o.list.push(tr); tr.tk = o.key; });
  manageTrees(9999);
}
/* woods, scrub, riverbank trees and lone field trees, from the ground cover's trees-per-hectare; made per 256 m tile when you come near
   and dropped again when you leave, so a whole region of woodland costs nothing until you are in it. Felled ones are remembered by name. */
function wildTrees(o){
  var g = world.tg, list = [], st = 6, x0 = o.kx*TREE_T, y0 = o.ky*TREE_T; if (!g || !g.td) return list;
  for (var y = y0; y < y0 + TREE_T; y += st) for (var x = x0; x < x0 + TREE_T; x += st){
    var i = Math.round((x + st/2 - g.x0)/g.cell), j = Math.round((y + st/2 - g.y0)/g.cell); if (i < 0 || j < 0 || i >= g.cols || j >= g.rows) continue;
    var k = j*g.cols + i, td = g.td[k]; if (!td) continue;
    var hx = Math.round(x), hy = Math.round(y); if (hash(hx, hy, 301) > td*st*st/10000*(0.55 + 0.9*fbm2(x/60, y/60, 87))) continue;   /* in clumps */
    var tx = x + hash(hx, hy, 302)*st*0.8, ty = y + hash(hx, hy, 303)*st*0.8;
    if (g.wd[k] < 6 || tx < world.minx || tx > world.maxx || ty < world.miny || ty > world.maxy || blocked(tx, ty) || (world.roadOk && !world.roadOk(tx, ty, 2.5))) continue;
    var id = 'w' + hx + '_' + hy, pine = hash(hx, hy, 304) < g.tp[k]/255, n = hx*7 + hy*13;
    list.push({x:tx, y:ty, id:id, h:'wild', dn:td >= 90, r:1.5 + hash(n, 1, 3)*1.2, hp:3, alive:!world.cut[id], shake:0, sp:pine ? (hash(hx, hy, 305) < 0.75 ? 4 : 5) : [0, 0, 1, 3, 2][Math.floor(hash(hx, hy, 305)*5)], yw:hash(n, 5, 9)*6.283, sc:0.75 + hash(n, 6, 9)*0.4, tk:o.key});
  }
  return list;
}
/* 0.80 ground detail: the ground pack's tufts, leaves, pebbles and sand, scattered over 2 m cells in 32 m tiles near you. The terrain keeps its painted
   base; these small shapes stand on it. Tiles are built once per season and dropped when you walk away */
var DT = 32, GDM = {};
function grdModel(mat, sea){
  var key = mat + sea, M = GDM[key]; if (M !== undefined) return M; GDM[key] = null;
  try { var G = SHAPED.ground, pcs = G.models.tiles[mat], sc = G.seasons[mat] && G.seasons[mat][['spring', 'summer', 'autumn', 'winter'][sea]]; if (!pcs || !sc) return null;
    pcs = pcs.filter(function(q){ return q.c !== 'BASE'; }); if (!pcs.length) return null;
    GDM[key] = spModel(pcs, function(n){ return SHAPED.hex(sc[n.replace('_D', '')] || sc.DETAIL); }); } catch (er){ GDM[key] = null; }
  return GDM[key];
}
function grdKind(x, y, sea){
  var g = world.tg; if (!g) return null; var i = Math.round((x - g.x0)/g.cell), j = Math.round((y - g.y0)/g.cell); if (i < 0 || j < 0 || i >= g.cols || j >= g.rows) return null;
  var k = j*g.cols + i, o = k*6, rk = world.roadAt ? world.roadAt(x, y) : null; if (rk && rk !== 'gravel') return null; if (rk === 'gravel') return 'gravel';
  if (inWater(x, y, 0.4)) return null; if (sea === 3) return 'snow';
  if (g.wd && g.wd[k] < 10) return 'mud'; if (g.td[k] >= 90) return 'leaf_litter';
  if (g.c[o] > 120) return sea === 1 || sea === 2 ? 'dry_grass' : 'grass'; return 'grass';
}
function grdTile(o){
  var m = new Mesh(), sea = season(), x0 = o.kx*DT, y0 = o.ky*DT, a, b;
  for (a = 0; a < DT/2; a++) for (b = 0; b < DT/2; b++){
    var x = x0 + a*2 + 1, y = y0 + b*2 + 1, h = hash(Math.round(x), Math.round(y), 301); if (h > 0.3) continue;
    var kd = grdKind(x, y, sea); if (!kd) continue; var M = grdModel(kd, sea); if (!M) continue; if (buildingAt(x, y) || (DIGN && digCol(x, y))) continue;
    x += (hash(Math.round(x), Math.round(y), 302) - 0.5)*0.8; y += (hash(Math.round(x), Math.round(y), 303) - 0.5)*0.8;
    m.model(M, x, y, Math.floor(h*8)*1.5708, hAt(x, y) + 0.015);
  }
  grdKerbs(m, o, x0, y0);
  if (o.g) freeMesh(o.g); o.g = m.p.length ? upload(m) : null; o.sea = sea;
}
/* kerbs: a 12 in kerb along the edge of every paved street that has a pavement; none where another street crosses */
function grdKerbs(m, o, x0, y0){
  var G = SHAPED.ground, pcs = G.models.kerb && G.models.kerb.kerb_strip; if (!pcs || !world.roadCell) return; var K = GDM.kerb; if (!K){ try { K = GDM.kerb = spModel(pcs, spColour(G.palette)); } catch (er){ GDM.kerb = K = null; } } if (!K) return;
  var RC = world.RC, seen = new Set(), cx, cy, i, j;
  for (cy = Math.floor(y0/RC); cy <= Math.floor((y0 + DT)/RC); cy++) for (cx = Math.floor(x0/RC); cx <= Math.floor((x0 + DT)/RC); cx++){
    var L = world.roadCell(cx, cy); if (!L) continue;
    for (i = 0; i < L.length; i++){ var sg = L[i]; if (sg[5] !== 'paved' || sg[4] < 3 || seen.has(sg)) continue; seen.add(sg);
      var dx = sg[2] - sg[0], dy = sg[3] - sg[1], len = Math.hypot(dx, dy); if (len < 2) continue; dx /= len; dy /= len; var ang = Math.atan2(dy, dx);
      for (var side = -1; side <= 1; side += 2) for (var t = 1; t < len; t += 2){
        var px = sg[0] + dx*t - dy*sg[4]*side, py = sg[1] + dy*t + dx*sg[4]*side; if (px < x0 || px >= x0 + DT || py < y0 || py >= y0 + DT) continue;
        var skip = false, L2 = world.roadCell(Math.floor(px/RC), Math.floor(py/RC)); if (L2) for (j = 0; j < L2.length && !skip; j++){ var q = L2[j]; if (q !== sg && q[5] !== 'path' && segDist(px, py, q[0], q[1], q[2], q[3]) < q[4] - 0.2) skip = true; }
        if (skip || buildingAt(px, py) || inWater(px, py, 0.3)) continue;
        m.model(K, px, py, ang + (side > 0 ? 3.14159 : 0), SUNK ? hAt0(px, py) + 0.062 - ROAD_T : hAt(px, py));   /* the base stands on the sunk road surface, the top is level with the pavement */
      }
    }
  }
}
function manageGround(budget){
  var D = world.gl.det; if (!D) D = world.gl.det = new Map(); if (!SPON || !window.SHAPED || !SHAPED.ground) return; var R = QS.clutR*0.8 + 10, n = 0;
  for (var ky = Math.floor((P.y - R)/DT); ky <= Math.floor((P.y + R)/DT); ky++) for (var kx = Math.floor((P.x - R)/DT); kx <= Math.floor((P.x + R)/DT); kx++){
    var key = gk(kx, ky), o = D.get(key); if (!o){ o = {kx:kx, ky:ky, x:(kx + 0.5)*DT, y:(ky + 0.5)*DT, g:null, sea:-1}; D.set(key, o); }
    if (o.sea === season() || n >= budget) continue; grdTile(o); n++;
  }
  D.forEach(function(o, key){ if (Math.abs(o.x - P.x) > R + 2*DT || Math.abs(o.y - P.y) > R + 2*DT){ if (o.g) freeMesh(o.g); D.delete(key); } });
}
function manageTrees(budget){
  var T = world.gl.trees; if (!T) return; var R = QS.far + CH + 130, n = 0, K = TREE_T;
  for (var ky = Math.floor((P.y - R)/K); ky <= Math.floor((P.y + R)/K); ky++) for (var kx = Math.floor((P.x - R)/K); kx <= Math.floor((P.x + R)/K); kx++){
    var o = treeT(kx, ky, true); if ((o.g && o.sea === season()) || n >= budget) continue;   /* autumn colours come and go with the season */
    if (!o.wild) o.wild = wildTrees(o); o.sea = season(); treeTile(o.key); n++;
  }
  T.forEach(function(o){ if (o.g && (Math.abs(o.x - P.x) > R + 2*K || Math.abs(o.y - P.y) > R + 2*K)){ freeMesh(o.g); o.g = null; o.wild = null; } });
}
function nearTrees(x, y, r, fn){
  var T = world.gl && world.gl.trees; if (!T) return;
  for (var ky = Math.floor((y - r)/TREE_T); ky <= Math.floor((y + r)/TREE_T); ky++) for (var kx = Math.floor((x - r)/TREE_T); kx <= Math.floor((x + r)/TREE_T); kx++){
    var o = T.get(gk(kx, ky)); if (!o) continue; o.list.forEach(fn); if (o.wild) o.wild.forEach(fn);
  }
}
/* 0.124.0: walls darken toward their foot (the corner where wall meets ground gets less sky): every vertex of a building's outside within 1.5 m of its base is
   shaded down to 74% at ground level. A wall is one quad from foot to eaves, so the shade fades up the whole wall: strong on a house, a faint band on a tower */
function footShade(m, s0, base){
  var P2 = m.p, C2 = m.c; for (var v = s0/3; v < P2.length/3; v++){ var hy = P2[v*3 + 1] - base; if (hy > 1.5) continue; var f = hy <= 0 ? 0.74 : 0.74 + 0.26*hy/1.5, o = v*4; C2[o] = C2[o]*f | 0; C2[o + 1] = C2[o + 1]*f | 0; C2[o + 2] = C2[o + 2]*f | 0; }
}
/* 0.124.0: a lake's shallows: a strip round the inside of the shore, 1 cm over the water, that the shader turns paler and greener toward the bank with a line of
   foam breathing at the edge. The strip's vertex colour carries the distance (red 255 at the shore, 0 at its inner edge; green 0 marks it as a shore strip).
   Corners are mitred, so neighbouring pieces share their inner points and never overlap */
function shoreStrip(g, p, a){
  var n = p.length/2; if (n < 3) return; var ar = 0, i; for (i = 0; i < n; i++){ var j = (i + 1) % n; ar += p[i*2]*p[j*2+1] - p[j*2]*p[i*2+1]; }
  var sg = ar > 0 ? 1 : -1, W = Math.max(1.2, Math.min(4, 0.15*Math.min(a.maxx - a.minx, a.maxy - a.miny))), inn = [];
  for (i = 0; i < n; i++){ var pi = (i + n - 1) % n, ni = (i + 1) % n, e1x = p[i*2] - p[pi*2], e1y = p[i*2+1] - p[pi*2+1], e2x = p[ni*2] - p[i*2], e2y = p[ni*2+1] - p[i*2+1], l1 = Math.hypot(e1x, e1y) || 1, l2 = Math.hypot(e2x, e2y) || 1;
    var n1x = -e1y/l1*sg, n1y = e1x/l1*sg, n2x = -e2y/l2*sg, n2y = e2x/l2*sg, mx = n1x + n2x, my = n1y + n2y, ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml; var c = Math.max(0.5, mx*n2x + my*n2y), k = Math.min(W/c, W*2);
    inn.push(p[i*2] + mx*k, p[i*2+1] + my*k); }
  var y = 0.08, TZ = TX.water, put = function(x, z, d){ g.p.push(x, y, z); g.c.push(255, 0, 255, 255); g.t.push(d, 0, TZ); };   /* the distance rides in the uv (vertex colours are one per triangle once draped); the shader takes the water texture from the world position */
  for (i = 0; i < n; i++){ var j2 = (i + 1) % n, ax = p[i*2], az = p[i*2+1], bx = p[j2*2], bz = p[j2*2+1];
    put(ax, az, 1); put(bx, bz, 1); put(inn[j2*2], inn[j2*2+1], 0); put(ax, az, 1); put(inn[j2*2], inn[j2*2+1], 0); put(inn[i*2], inn[i*2+1], 0); }
}
function seat(b, m, lm, s0, l0){
  var q, p = b.pts, n = p.length, base = b.base, low = b.low - 0.5, fc = [172,160,146];
  for (q = s0 + 1; q < m.p.length; q += 3) m.p[q] += base; for (q = l0 + 1; q < lm.p.length; q += 3) lm.p[q] += base;
  if (base - low < 0.6) return;
  for (q = 0; q < n; q += 2){ var r = (q + 2) % n; m.quad(p[q], base, p[q+1], p[r], base, p[r+1], p[r], low, p[r+1], p[q], low, p[q+1], fc, 255); }
  if (b.door){ var ox = -b.door.nx, oy = -b.door.ny, sx = b.door.x + ox*0.8, sy = b.door.y + oy*0.8, lo = hAt(sx + ox*0.8, sy + oy*0.8) - 0.4; if (base - lo > 0.5) m.ybox(sx, sy, Math.atan2(oy, ox), 0, 0, (base + lo)/2, 0.8, (base - lo)/2, 1.0, [196,186,170]); }
}
/* street furniture: lights along main roads, hydrants on side streets, benches in parks, dumpsters by shops, bushes by houses */
/* 0.114.54: scenery you cannot walk or drive through (radius in metres) */
var SOLID = {'plants.stump':0.45, 'plants.fallen_log':0.5, 'plants.bramble':0.5, 'fm.bale_round':0.9, 'fm.hay_wagon':1.3, 'fm.tractor':1.3, 'fm.water_trough':0.8, 'fm.scarecrow':0.3, 'fm.windmill':1.0, 'street.power_pole':0.2, 'street.bike_rack':0.4, 'street.phone_box':0.5, 'street.newspaper_box':0.3, 'street.mailbox':0.25, 'street.parking_meter':0.15, 'street.bollard':0.2, 'street.traffic_light':0.2, 'rs.pump_island_modern':1.0, 'rs.billboard':0.4};
var OBR = {streetlight:0.25, firehydrant:0.3, bench:0.75, dumpster:1.3, bush:0.5};
function placeProps(g){
  var w = world, M = MODELS; if (!M.streetlight) return;
  var cand = {light:[], hyd:[], bench:[], dump:[], bush:[]}, i, ok = function(x, y){ return !blocked(x, y) && !deckBlock(x, y) && !inWater(x, y, 0.5) && x > w.minx && x < w.maxx && y > w.miny && y < w.maxy; };
  w.roads.forEach(function(r, ri){
    if (r.kind !== 'road' || r.w < 7) return; var p = r.pts, main = r.w >= 8, gap = main ? 55 : 130, run = gap*hash(ri, 3, 41), side = ri % 2 ? 1 : -1;
    for (var q = 0; q < p.length - 2; q += 2){
      var ax = p[q], ay = p[q+1], l = Math.hypot(p[q+2] - ax, p[q+3] - ay); if (l < 0.01) continue; var dx = (p[q+2] - ax)/l, dy = (p[q+3] - ay)/l;
      for (; run < l; run += gap){ var off = (r.w/2 + 1.25)*side, x = ax + dx*run - dy*off, y = ay + dy*run + dx*off; if (ok(x, y)) (main ? cand.light : cand.hyd).push([x, y, Math.atan2(dx*side, -dy*side)]); side = -side; }
      run -= l;
    }
  });
  w.areas.forEach(function(a, ai){ if (a.kind !== 'park') return; var n = Math.min(6, Math.floor((a.maxx - a.minx)*(a.maxy - a.miny)/2500)); for (var k = 0; k < n; k++){ var x = a.minx + hash(ai, k, 51)*(a.maxx - a.minx), y = a.miny + hash(ai, k, 52)*(a.maxy - a.miny); if (pip(a.pts, x, y) && ok(x, y)) cand.bench.push([x, y, hash(ai, k, 53)*6.28]); } });
  w.buildings.forEach(function(b){
    if (!b.door) return; var d = b.door, tx = -d.ny, ty = d.nx, h = hash(b.id, 13, 3), x, y;
    if (b.cat === 'house'){ if (h < 0.45){ var sd = h < 0.22 ? 1 : -1; x = d.x - d.nx*0.7 + tx*1.7*sd; y = d.y - d.ny*0.7 + ty*1.7*sd; if (ok(x, y)) cand.bush.push([x, y, h*20]); } }
    else if (h < 0.5){ x = d.x - d.nx*1.1 + tx*3.4; y = d.y - d.ny*1.1 + ty*3.4; if (ok(x, y) && ok(x + tx, y + ty) && ok(x - tx, y - ty)) cand.dump.push([x, y, Math.atan2(ty, tx), b.kind]); }
  });
  w.slights = []; w.obstL = []; w.dumps = []; var put = function(list, model, cap){ var st = Math.max(1, Math.ceil(list.length/cap)); for (var k = 0; k < list.length; k += st){ var c = list[k]; g.model(M[model], c[0], c[1], c[2], hAt(c[0], c[1]) + 0.05); (w.obstL = w.obstL || []).push([c[0], c[1], OBR[model] || 0.4]); if (model === 'dumpster'){ var di = w.dumps.length; w.dumps.push({dump:1, name:'dumpster', x:c[0], y:c[1], kind:c[3], looted:!!(w.dumpGone && w.dumpGone.indexOf(di) >= 0), t:0, i:di}); } if (model === 'streetlight') w.slights.push({x:c[0], y:c[1], sl:true}); } };
  if (!(w.mhas && w.mhas.lamp)) put(cand.light, 'streetlight', 700);   /* 0.123.0: a map with its own street lamps (builder 1.24) keeps only those */
  put(cand.hyd, 'firehydrant', 300); put(cand.bench, 'bench', 200); put(cand.dump, 'dumpster', 250); put(cand.bush, 'bush', 700);
}
/* 0.80 dressing from the art pack's unused street, plant and road pieces: signs and poles on the streets, mailboxes at houses, bus stops, manholes,
   and in the wild logs, stumps, ferns, mushrooms, brambles, flowers and reeds. All are small and decorative: nothing here blocks you */
var GB = {};
function gB(path){ if (GB[path] !== undefined) return GB[path]; GB[path] = null; var a = path.split('.'), m = window.SHAPED && SHAPED.ground && SHAPED.ground.models[a[0]], pcs = m && m[a[1]]; if (pcs) try { GB[path] = spModel(pcs, spColour(SHAPED.ground.palette)); } catch (er){} return GB[path]; }
function inFarmland(x, y){ var a = world.areas, i; for (i = 0; i < a.length; i++){ var ar = a[i]; if (ar.lu === 'farmland' && x > ar.minx && x < ar.maxx && y > ar.miny && y < ar.maxy && pip(ar.pts, x, y)) return true; } return false; }
function placeDress(g){
  var w = world; if (!SPON || !w.roadOk) return; var hasM = false;
  var ok = function(x, y, e){ return !blocked(x, y) && !deckBlock(x, y) && !inWater(x, y, 0.5) && x > w.minx && x < w.maxx && y > w.miny && y < w.maxy && w.roadOk(x, y, e === undefined ? 1.5 : e); };
  var out = {}, add = function(path, x, y, yaw, cap){ var L = out[path] || (out[path] = {c:cap, l:[]}); L.l.push([x, y, yaw]); };
  w.roads.forEach(function(r, ri){
    if (r.kind !== 'road' || r.w < 5) return; var p = r.pts, main = r.w >= 8, n = p.length; if (n < 4) return;
    var ends = [[p[0], p[1], p[2], p[3]], [p[n-2], p[n-1], p[n-4], p[n-3]]];
    ends.forEach(function(e, ei){ var dx = e[2] - e[0], dy = e[3] - e[1], l = Math.hypot(dx, dy); if (l < 8) return; dx /= l; dy /= l; var side = ei ? 1 : -1, off = r.w/2 + 2.4, yaw = Math.atan2(dx, dy), bk = main ? 10 : 5;
      var sx = e[0] + dx*bk - dy*off*side, sy = e[1] + dy*bk + dx*off*side;
      if (main && spB('wm.crosswalk_zebra') && r.w >= 7 && r.w <= 16 && (r.hw === 'primary' || r.hw === 'secondary' || r.hw === 'tertiary')){ var cx0 = e[0] + dx*7, cy0 = e[1] + dy*7, nn = Math.max(1, Math.round(r.w/6.5)), qq;   /* 0.114.15: a zebra crossing across each main road end, and a stop line before it */
        for (qq = 0; qq < nn; qq++){ var of = (qq - (nn - 1)/2)*6.5, zx = cx0 - dy*of, zy = cy0 + dx*of; if (ok(zx, zy, 0.2) || qq) add('wm.crosswalk_zebra', zx, zy, yaw, 600); }
        if (spB('wm.arrow_straight') && r.w >= 9) add('wm.arrow_straight', e[0] + dx*20 - dy*r.w*0.25*(ei ? 1 : -1), e[1] + dy*20 + dx*r.w*0.25*(ei ? 1 : -1), yaw + Math.PI, 400);
        add('wm.stop_line', e[0] + dx*11 - dy*r.w*0.25*(ei ? 1 : -1), e[1] + dy*11 + dx*r.w*0.25*(ei ? 1 : -1), yaw, 400); }
      if (main){ if (ok(sx, sy)) add('street.traffic_light', sx, sy, yaw, 120); }
      else { if (ok(sx, sy)) add('street.stop_sign', sx, sy, yaw, 300); var nx2 = e[0] + dx*bk + dy*off*side, ny2 = e[1] + dy*bk - dx*off*side; if (ok(nx2, ny2) && hash(ri, ei, 77) < 0.6) add('street.street_name_post', nx2, ny2, yaw, 250); } });
    /* 0.114.16: lane dashes down multi-lane main roads (a dash every 12 m on each lane line, clear of the junctions) and a straight arrow before each end */
    if (main && r.w >= 9 && r.w <= 22 && spB('wm.lane_dash_white') && (r.hw === 'primary' || r.hw === 'secondary' || r.hw === 'tertiary')){
      var tl = 0, lq; for (lq = 0; lq + 3 < n; lq += 2) tl += Math.hypot(p[lq + 2] - p[lq], p[lq + 3] - p[lq + 1]); var acc = 0;
      for (lq = 0; lq + 3 < n; lq += 2){ var lx0 = p[lq], ly0 = p[lq + 1], ll = Math.hypot(p[lq + 2] - lx0, p[lq + 3] - ly0); if (ll < 0.5) continue; var ldx = (p[lq + 2] - lx0)/ll, ldy = (p[lq + 3] - ly0)/ll, lyaw = Math.atan2(ldx, ldy);
        for (var lu = 6; lu < ll; lu += 12){ var along = acc + lu; if (along < 16 || along > tl - 16) continue; [-1, 1].forEach(function(sg){ var dxp = lx0 + ldx*lu - ldy*r.w*0.25*sg, dyp = ly0 + ldy*lu + ldx*r.w*0.25*sg; if (!blocked(dxp, dyp)) add('wm.lane_dash_white', dxp, dyp, lyaw, 9000); }); }
        acc += ll; }
    }
    /* 0.114.17: a storm drain in the kerb every 45 m or so, alternating sides, and a speed hump now and then on the quieter streets */
    if (spB('wm.storm_drain')){ var sq2, sacc = 0, sk = 0, stl = 0; for (sq2 = 0; sq2 + 3 < n; sq2 += 2) stl += Math.hypot(p[sq2 + 2] - p[sq2], p[sq2 + 3] - p[sq2 + 1]);
      for (sq2 = 0; sq2 + 3 < n; sq2 += 2){ var sx0 = p[sq2], sy0 = p[sq2 + 1], sl = Math.hypot(p[sq2 + 2] - sx0, p[sq2 + 3] - sy0); if (sl < 0.5) continue; var sdx = (p[sq2 + 2] - sx0)/sl, sdy = (p[sq2 + 3] - sy0)/sl;
        for (var su = 20 + hash(ri, sq2, 63)*20; su < sl; su += 70 + hash(ri, Math.floor(su), 64)*30, sk++){ var salong = sacc + su; if (salong < 14 || salong > stl - 14) continue; var ssd = sk % 2 ? 1 : -1, sof = r.w/2 - 0.35, sdx2 = sx0 + sdx*su - sdy*sof*ssd, sdy2 = sy0 + sdy*su + sdx*sof*ssd; if (!blocked(sdx2, sdy2)) add('wm.storm_drain', sdx2, sdy2, Math.atan2(-sdy, sdx), 1200); }
        if (!main && r.w <= 8 && sl > 60 && hash(ri, sq2, 65) < 0.12){ var hu = sl*0.5, hx2 = sx0 + sdx*hu, hy2 = sy0 + sdy*hu; if (sacc + hu > 20 && sacc + hu < stl - 20) add('wm.speed_hump', hx2, hy2, Math.atan2(sdx, sdy), 300); }
        sacc += sl; } }
    var run = 30 + hash(ri, 5, 61)*40, k = 0;
    for (var q = 0; q + 3 < n; q += 2){ var ax = p[q], ay = p[q+1], l = Math.hypot(p[q+2] - ax, p[q+3] - ay); if (l < 0.5) continue; var dx = (p[q+2] - ax)/l, dy = (p[q+3] - ay)/l, yaw = Math.atan2(dx, dy);
      for (; run < l; run += main ? 70 : 60, k++){
        var sd = k % 2 ? 1 : -1, off = r.w/2 + 3.6, x = ax + dx*run - dy*off*sd, y = ay + dy*run + dx*off*sd, h = hash(ri*13 + q, k, 83);
        if (!main && ok(x, y, 2) && !(w.mhas && w.mhas.pole)) add('street.power_pole', x, y, yaw, 450);
        var h2 = hash(ri*11 + q, k, 97), lat = (hash(ri, k + q, 98) - 0.5)*(r.w - 2.5), xd = ax + dx*run - dy*lat, yd = ay + dy*run + dx*lat;
        if (h2 < 0.45){ for (var cc = 0; cc < 3; cc++) add('ground.decals.crack', xd + (cc - 1)*0.5*dy, yd - (cc - 1)*0.5*dx, yaw + (hash(ri, k, 100 + cc) - 0.5)*1.4, 1500); }
        else if (h2 > 0.93) add('ground.decals.pothole', xd, yd, h2*40, 500); else if (h2 > 0.86 && main) add('ground.decals.skid_marks', xd, yd, yaw, 400);
        var xm = ax + dx*run + dy*1.8, ym = ay + dy*run - dx*1.8; if (h < 0.35 && !blocked(xm, ym)) add('street.manhole', xm, ym, h*6.28, 500);
        if (main){ var xs = ax + dx*run - dy*(r.w/2 + 2.2)*sd, ys = ay + dy*run + dx*(r.w/2 + 2.2)*sd;
          if (h > 0.9 && ok(xs, ys)) add('street.sign_speed', xs, ys, yaw + (sd > 0 ? 0 : 3.14159), 120);
          else if (h > 0.8 && ok(xs, ys) && bldNear(xs, ys, 25)) add(h > 0.86 && spB('rs.bus_shelter') ? 'rs.bus_shelter' : 'street.bus_stop', xs, ys, yaw + (sd > 0 ? 1.5708 : -1.5708), 90);
          else if (h > 0.66 && h < 0.7 && hash(ri, k, 99) < 0.5 && spB('rs.billboard') && !bldNear(xs, ys, 40)){ var bx = ax + dx*run - dy*(r.w/2 + 9)*sd, by = ay + dy*run + dx*(r.w/2 + 9)*sd; if (ok(bx, by, 2.5)) add('rs.billboard', bx, by, Math.atan2(dy*sd, -dx*sd), 60); }
          else if (h < 0.3 && ok(xs, ys) && bldNear(xs, ys, 12)) add('street.parking_meter', xs, ys, yaw, 200);
          else if (h > 0.7 && ok(xs, ys) && bldNear(xs, ys, 12)) add('street.bollard', xs, ys, 0, 150); }
      }
      run -= l; }
  });
  w.buildings.forEach(function(b){
    if (!b.door || b.gone) return; var d = b.door, tx = -d.ny, ty = d.nx, h = hash(b.id, 17, 5), x, y;
    if (b.cat === 'house'){ if (h < 0.5 && !(w.mhas && w.mhas.mailbox)){ x = d.x - d.nx*7 + tx*2.6; y = d.y - d.ny*7 + ty*2.6; if (ok(x, y, 3)) add('street.mailbox', x, y, Math.atan2(-d.nx, -d.ny), 600); } }
    else if (b.cat === 'shop' || b.cat === 'food'){
      if (h < 0.35){ x = d.x - d.nx*1.3 - tx*3.2; y = d.y - d.ny*1.3 - ty*3.2; if (ok(x, y, 0.3)) add('street.newspaper_box', x, y, Math.atan2(-d.nx, -d.ny), 150); }
      else if (h > 0.8){ x = d.x - d.nx*1.5 + tx*3.4; y = d.y - d.ny*1.5 + ty*3.4; if (ok(x, y, 0.3)) add('street.bike_rack', x, y, Math.atan2(tx, ty), 120); }
      else if (h > 0.72){ x = d.x - d.nx*2.2 - tx*4; y = d.y - d.ny*2.2 - ty*4; if (ok(x, y, 0.3)) add('street.phone_box', x, y, Math.atan2(-d.nx, -d.ny), 40); }
    }
  });
  /* 0.114.0: farmland (landuse=farmland) is laid with the farm pack's crop tiles in 4 m squares, one crop to a field with the rows running the same way, and round bales on the bare ones.
     The tiles nearest the start are kept (1800 in all), so the fields you meet are full rather than thinly spread over the whole map. */
  if (spB('fm.crop_corn')){ var fmT = [], sp0 = w.spawn || w.start || {x:0, y:0};
    w.areas.forEach(function(ar, ai){
      if (ar.lu !== 'farmland' || ar.pts.length < 6) return; var bw = ar.maxx - ar.minx, bh = ar.maxy - ar.miny; if (bw*bh > 4e6 || bw*bh < 400) return;
      var h = hash(ai, 71, 9), cr = h < 0.3 ? 'crop_corn' : h < 0.52 ? 'crop_wheat' : h < 0.74 ? 'crop_soy' : h < 0.84 ? 'crop_ploughed' : h < 0.92 ? 'crop_stubble' : 'crop_harvested', ya = hash(ai, 72, 9) < 0.5 ? 0 : Math.PI/2, x, y;
      for (x = ar.minx + 2; x < ar.maxx; x += 4) for (y = ar.miny + 2; y < ar.maxy; y += 4){
        if (!pip(ar.pts, x, y) || !pip(ar.pts, x + 2.1, y) || !pip(ar.pts, x - 2.1, y) || !pip(ar.pts, x, y + 2.1) || !pip(ar.pts, x, y - 2.1)) continue;
        fmT.push([Math.hypot(x - sp0.x, y - sp0.y), cr, x, y, ya, ai]); } });
    fmT.sort(function(a, b){ return a[0] - b[0]; });
    var fmF = {}; for (var fi = 0, fk = 0; fi < fmT.length && fk < 1800; fi++){ var ft = fmT[fi]; if (!ok(ft[2], ft[3], 0.5)) continue; add('fm.' + ft[1], ft[2], ft[3], ft[4], 1e6); fk++; fmF[ft[5]] = (fmF[ft[5]] || 0) + 1;
      if ((ft[1] === 'crop_stubble' || ft[1] === 'crop_harvested') && hash(Math.round(ft[2]), Math.round(ft[3]), 73) < 0.03) add('fm.bale_round', ft[2], ft[3], hash(Math.round(ft[2]), Math.round(ft[3]), 74)*6.28, 1e6); } }
    /* 0.114.1: fields with enough crop get a wire fence round the edge (4 m a piece, left open where a road or building is) and a scarecrow in the middle of a few */
    if (spB('fm.fence_wire_4')){ var fnc = 0; w.areas.forEach(function(ar, ai){ if (!fmF[ai] || fmF[ai] < 12 || fnc > 700) return; var pt = ar.pts, np = pt.length/2, q;
      for (q = 0; q < np; q++){ var p0 = {x:pt[q*2], y:pt[q*2+1]}, p1 = {x:pt[((q + 1) % np)*2], y:pt[((q + 1) % np)*2+1]}, ex = p1.x - p0.x, ey = p1.y - p0.y, L = Math.hypot(ex, ey), n = Math.floor(L/4), m; if (L < 4) continue; ex /= L; ey /= L;
        for (m = 0; m < n; m++){ var fx = p0.x + ex*(m*4 + 2), fy = p0.y + ey*(m*4 + 2); if (!ok(fx, fy, 0.4)) continue; add(hash(ai, q*50 + m, 75) < 0.04 ? 'fm.fence_rail_gap' : (m === 1 && q % 2 === 0) ? 'fm.gate_field' : 'fm.fence_wire_4', fx, fy, Math.atan2(-ey, ex), 1e6); fnc++; } }
      if (hash(ai, 76, 9) < 0.35){ var sx = (ar.minx + ar.maxx)/2, sy = (ar.miny + ar.maxy)/2; if (pip(ar.pts, sx, sy) && ok(sx, sy, 0.5)) add('fm.scarecrow', sx, sy, hash(ai, 77, 9)*6.28, 1e6); } }); }
  /* 0.114.2: farm buildings (building=barn, farm, farm_auxiliary, stable, cowshed, silo, greenhouse is left alone): a silo or grain bin and hay beside a barn, a trough and a mailbox out by the door of a farmhouse */
  if (spB('fm.silo')) w.buildings.forEach(function(b, bi){
    if (b.gone || !b.door) return; var d = b.door, bt = b.bt;
    if (bt === 'barn' || bt === 'stable' || bt === 'cowshed' || bt === 'farm_auxiliary'){
      var tx = -d.ny, ty = d.nx, side = hash(bi, 81, 9) < 0.5 ? 1 : -1, w2 = Math.max(b.maxx - b.minx, b.maxy - b.miny)/2 + 5, x = b.cx + tx*side*w2, y = b.cy + ty*side*w2;
      if (ok(x, y, 3.5)) add(hash(bi, 82, 9) < 0.6 ? 'fm.silo' : 'fm.grain_bin', x, y, hash(bi, 83, 9)*6.28, 1e6);
      var hx = b.cx - tx*side*w2, hy = b.cy - ty*side*w2; if (ok(hx, hy, 2.5)) add(hash(bi, 84, 9) < 0.5 ? 'fm.bale_stack' : 'fm.haystack', hx, hy, hash(bi, 85, 9)*6.28, 1e6);
      var vx = d.x - d.nx*9 + tx*side*3, vy = d.y - d.ny*9 + ty*side*3, vh = hash(bi, 87, 9);
      if (vh < 0.45 && ok(vx, vy, 2.5)){ add('fm.tractor', vx, vy, Math.atan2(-d.nx, -d.ny) + (hash(bi, 88, 9) - 0.5), 1e6); if (vh < 0.2 && ok(vx + tx*side*5, vy + ty*side*5, 2.5)) add('fm.hay_wagon', vx + tx*side*5, vy + ty*side*5, Math.atan2(-d.nx, -d.ny), 1e6); }
      var wx = b.cx - d.nx*(w2 + 8), wy = b.cy - d.ny*(w2 + 8); if (hash(bi, 89, 9) < 0.4 && ok(wx, wy, 2)) add('fm.windmill', wx, wy, hash(bi, 90, 9)*6.28, 1e6);
      var tq = d.x - d.nx*4, tr = d.y - d.ny*4; if (bt !== 'farm_auxiliary' && ok(tq, tr, 1)) add('fm.water_trough', tq, tr, Math.atan2(-d.nx, -d.ny) + Math.PI/2, 1e6);
    } else if (bt === 'farm' || (b.kind === 'house' && b.area > 80 && b.cat === 'house' && hash(bi, 86, 9) < 0.02 && inFarmland(b.cx, b.cy))){
      var mx = d.x - d.nx*7 + d.ny*3, my = d.y - d.ny*7 - d.nx*3; if (ok(mx, my, 0.5)) add('fm.mailbox', mx, my, Math.atan2(-d.nx, -d.ny), 1e6);
    }
  });
  /* 0.114.0: the content chat's roadside pack: a fuel station's pumps stand under a canopy in front of the shop, and bus stops get a shelter */
  if (spB('rs.canopy_flat')) w.buildings.forEach(function(b, bi){
    if (b.kind !== 'fuel' || !b.door || b.gone) return; var d = b.door, tx = -d.ny, ty = d.nx, o = 8, cx = d.x - d.nx*o, cy = d.y - d.ny*o, ya = Math.atan2(-d.nx, -d.ny), cn = hash(bi, 41, 8) < 0.3 ? 'rs.canopy_vee' : 'rs.canopy_flat';
    if (!ok(cx, cy, 0.3)) return;
    add(cn, cx, cy, ya, 200); [-1.5, 1.5].forEach(function(dd){ add('rs.pump_island_modern', cx - d.nx*dd, cy - d.ny*dd, ya + Math.PI/2, 400); });
  });
  /* the wild: round trees in woods and yards */
  w.trees.forEach(function(t, i){
    if (t.h !== 'wood' && t.h !== 'poi' && t.h !== 'river' && t.h !== 'field') return; var h = hash(i, 9, 31), a = hash(i, 10, 31)*6.283, d = 1.8 + hash(i, 11, 31)*2.2, x = t.x + Math.cos(a)*d, y = t.y + Math.sin(a)*d;
    var path = h < 0.10 ? 'plants.fallen_log' : h < 0.22 ? 'plants.fern' : h < 0.30 ? 'plants.mushrooms' : h < 0.36 ? 'plants.stump' : h < 0.42 ? 'plants.bramble' : null; if (!path) return;
    if (ok(x, y, 2) && !inWater(x, y, 2)) add(path, x, y, hash(i, 12, 31)*6.283, 700);
    if (t.h === 'river' && h > 0.9){ var rx = t.x + Math.cos(a)*(d + 2), ry = t.y + Math.sin(a)*(d + 2); if (ok(rx, ry, 2)) add('plants.reeds', rx, ry, a, 500); }
  });
  w.buildings.forEach(function(b, bi){ if (b.cat !== 'house' || b.gone || hash(bi, 21, 7) > 0.3) return; var a = hash(bi, 22, 7)*6.283, d = Math.sqrt(Math.max(30, (b.maxx - b.minx)*(b.maxy - b.miny)))/2 + 2.5, x = b.cx + Math.cos(a)*d, y = b.cy + Math.sin(a)*d, h = hash(bi, 23, 7);
    if (ok(x, y, 3) && !buildingAt(x, y)) add(h < 0.34 ? 'plants.flowers_red' : h < 0.67 ? 'plants.flowers_yellow' : 'plants.flowers_purple', x, y, h*60, 500); });
  w.areas.forEach(function(ar, ai){ if (ar.kind !== 'park') return; var n = Math.min(40, Math.floor((ar.maxx - ar.minx)*(ar.maxy - ar.miny)/900));
    for (var k = 0; k < n; k++){ var x = ar.minx + hash(ai, k, 91)*(ar.maxx - ar.minx), y = ar.miny + hash(ai, k, 92)*(ar.maxy - ar.miny); if (!pip(ar.pts, x, y) || !ok(x, y, 3)) continue;
      var h = hash(ai, k, 93); add(h < 0.34 ? 'plants.flowers_red' : h < 0.67 ? 'plants.flowers_yellow' : 'plants.flowers_purple', x, y, h*60, 300); } });
  /* 0.112.0: playgrounds and pitches the map names (leisure=playground, leisure=pitch with sport=): the parks pack's equipment placed on them */
  if (spB('pk.swing_set')) w.areas.forEach(function(ar, ai){
    if (ar.lei !== 'playground' && ar.lei !== 'pitch') return; var pt = ar.pts, np = pt.length, cx = 0, cy = 0, q, bl = 0, ux = 1, uy = 0, l, u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (q = 0; q < np; q += 2){ cx += pt[q]; cy += pt[q + 1]; } cx /= np/2; cy /= np/2; if (!pip(pt, cx, cy)){ cx = (ar.minx + ar.maxx)/2; cy = (ar.miny + ar.maxy)/2; }
    for (q = 0; q < np; q += 2){ var q2 = (q + 2) % np; l = Math.hypot(pt[q2] - pt[q], pt[q2 + 1] - pt[q + 1]); if (l > bl){ bl = l; ux = (pt[q2] - pt[q])/l; uy = (pt[q2 + 1] - pt[q + 1])/l; } }
    for (q = 0; q < np; q += 2){ var du = (pt[q] - cx)*ux + (pt[q + 1] - cy)*uy, dv = -(pt[q] - cx)*uy + (pt[q + 1] - cy)*ux; u0 = Math.min(u0, du); u1 = Math.max(u1, du); v0 = Math.min(v0, dv); v1 = Math.max(v1, dv); }
    var ya = Math.atan2(ux, uy), at = function(du, dv){ return [cx + du*ux - dv*uy, cy + du*uy + dv*ux]; }, put = function(nm, du, dv, rot){ var c = at(du, dv); if (ok(c[0], c[1], 0.5)) add('pk.' + nm, c[0], c[1], ya + (rot || 0), 400); };
    if (ar.lei === 'playground'){ var kit = ['swing_set', 'slide', 'climbing_frame', 'sandpit', 'seesaw', 'merry_go_round', 'monkey_bars', 'spring_rider'], span = Math.max(u1 - u0, v1 - v0), n = Math.min(6, Math.max(2, Math.floor(span/5)));
      for (q = 0; q < n; q++){ var a2 = q/n*6.283 + hash(ai, q, 61), rr = n > 2 ? Math.min(span*0.28, 6) : 0; put(kit[(q + ai) % kit.length], Math.cos(a2)*rr, Math.sin(a2)*rr, hash(ai, q, 62)*6.28); } return; }
    var sp = ar.sport || '', L2 = u1 - u0, W2 = v1 - v0;
    if (sp === 'basketball'){ put('basketball_hoop', u1 - 1.2, 0, Math.PI); put('basketball_hoop', u0 + 1.2, 0, 0); }
    else if (sp === 'soccer' || sp === 'american_football' || sp === 'football'){ put('soccer_goal', u1 - 0.3, 0, Math.PI/2*3); put('soccer_goal', u0 + 0.3, 0, Math.PI/2); }
    else if (sp === 'tennis' || sp === 'pickleball' || sp === 'volleyball'){ put(sp === 'volleyball' ? 'volleyball_net' : 'tennis_net', 0, 0, 0); }
    /* 0.114.32: the floor and its painted lines. Courts are 4 m tiles (blue, or green for tennis) with white lines round the edge and across the middle; fields get their lines on the grass */
    var court = sp === 'tennis' || sp === 'pickleball' || sp === 'volleyball' || sp === 'basketball', field = sp === 'soccer' || sp === 'american_football' || sp === 'football';
    if ((court || field) && L2 >= 6 && W2 >= 4 && L2 < 140 && W2 < 100){
      var cu0 = (u0 + u1)/2, cv0 = (v0 + v1)/2, nu = Math.max(1, Math.round(L2/4)), nv = Math.max(1, Math.round(W2/4)), tw = L2/nu, th = W2/nv, tile = sp === 'tennis' ? 'pk.court_green_plain' : 'pk.court_blue_plain', ln = function(nm, du, dv, rot){ var c = at(du, dv); if (ok(c[0], c[1], 0.3)) add('pk.' + nm, c[0], c[1], ya + rot, 4000); };
      if (court) for (var iu = 0; iu < nu; iu++) for (var iv = 0; iv < nv; iv++){ var c = at(u0 + tw*(iu + 0.5), v0 + th*(iv + 0.5)); if (ok(c[0], c[1], 0.3)) add(tile, c[0], c[1], ya, 4000); }
      for (var lu = u0 + 2; lu < u1 + 1.99; lu += 4){ var uu = Math.min(lu, u1 - 2); ln('field_line_4', uu, v0 + 0.15, Math.PI/2); ln('field_line_4', uu, v1 - 0.15, Math.PI/2); }
      for (var lv = v0 + 2; lv < v1 + 1.99; lv += 4){ var vv = Math.min(lv, v1 - 2); ln('field_line_4', u0 + 0.15, vv, 0); ln('field_line_4', u1 - 0.15, vv, 0); if (sp !== 'volleyball' && sp !== 'pickleball') ln('field_line_4', cu0, vv, 0); }
    }
    else if (sp === 'baseball' || sp === 'softball'){ put('home_plate', u0 + 3, 0, 0); put('baseball_backstop', u0 + 0.5, 0, Math.PI/2); put('pitchers_mound', u0 + 3 + Math.min(18, L2*0.35), 0, 0); }
  });
  w.waterLines.forEach(function(r, n){ var pt = r.pts, hw = r.w/2;
    for (var q = 0; q + 3 < pt.length; q += 2){ var ax = pt[q], ay = pt[q+1], l = Math.hypot(pt[q+2] - ax, pt[q+3] - ay); if (l < 0.5) continue; var dx = (pt[q+2] - ax)/l, dy = (pt[q+3] - ay)/l;
      for (var u = 0; u < l; u += 11){ var sd = hash(n + q, Math.floor(u), 5) < 0.5 ? 1 : -1; if (hash(n + q, Math.floor(u), 6) > 0.45) continue; var o = hw + 0.6 + hash(n, Math.floor(u), 7)*1.5, x = ax + dx*u - dy*o*sd, y = ay + dy*u + dx*o*sd;
        if (!inWater(x, y, 0.2) && !blocked(x, y)){ var hr = hash(q, u, 9); add(spB('ws.reeds') ? (hr < 0.4 ? 'ws.cattails' : hr < 0.55 ? 'ws.cattails_small' : 'ws.reeds') : 'plants.reeds', x, y, hash(q, u, 8)*6.28, 600); } } } });
  /* 0.98.1: the waterside pack: cattails and reeds round the edge of ponds and lakes, lily pads on small ponds, a heron now and then */
  if (spB('ws.reeds')) w.areas.forEach(function(ar, ai){ if (ar.kind !== 'water' || ar.pts.length < 6) return; var pt = ar.pts, np = pt.length, bw = ar.maxx - ar.minx, bh = ar.maxy - ar.miny, arA = bw*bh, cnt = 0;
    for (var q = 0; q < np && cnt < 120; q += 2){ var ax = pt[q], ay = pt[q+1], bx = pt[(q+2) % np], by = pt[(q+3) % np], l = Math.hypot(bx - ax, by - ay); if (l < 1) continue;
      for (var u = 0; u < l; u += 8){ var hh = hash(ai*97 + q, Math.floor(u), 41); if (hh > 0.3) continue; var x = ax + (bx - ax)*u/l, y = ay + (by - ay)*u/l; if (blocked(x, y) || deckBlock(x, y) || !w.roadOk(x, y, 2)) continue; cnt++;
        add(hh < 0.012 ? 'ws.heron' : hh < 0.12 ? 'ws.cattails' : hh < 0.2 ? 'ws.reeds' : 'ws.cattails_small', x, y, hash(q, u, 42)*6.28, 500); } }
    if (arA < 30000){ var nl = Math.min(14, Math.floor(arA/900)); for (var k = 0; k < nl; k++){ var lx = ar.minx + hash(ai, k, 43)*bw, ly = ar.miny + hash(ai, k, 44)*bh; if (pip(ar.pts, lx, ly)) add(hash(ai, k, 45) < 0.3 ? 'ws.lily_pads_bloom' : 'ws.lily_pads', lx, ly, hash(ai, k, 46)*6.28, 300); } } });
  var total = 0;
  Object.keys(out).forEach(function(path){ var L = out[path], M = path.indexOf('ground.') === 0 ? gB(path.slice(7)) : spB(path); if (!M) return; var st = Math.max(1, Math.ceil(L.l.length/L.c));
    for (var k = 0; k < L.l.length; k += st){ var c = L.l[k]; if (SOLID[path]){ (w.obstL = w.obstL || []).push([c[0], c[1], SOLID[path]]); w.obst = null; } g.model(M, c[0], c[1], c[2], hAt(c[0], c[1]) + (path.indexOf('ground.') === 0 || path === 'street.manhole' || path.slice(0, 3) === 'wm.' || path.slice(0, 9) === 'pk.court_' || path.slice(0, 13) === 'pk.field_line' ? 0.115 : path.slice(0, 8) === 'ws.lily_' ? 0.07 : 0.02)); if (path.indexOf('street.') === 0 && path !== 'street.manhole') (w.obstL = w.obstL || []).push([c[0], c[1], 0.25]); total++; } });
  w.dressCount = total; w.dressOut = out;
}
/* 0.123.0: the map's own props (builder 1.24 street dressing and props placed in the builder), kept in 96 m cells and meshed only near you, like the buildings.
   Power poles with an asmb:wire point carry four wires to the next pole: one per insulator on the crossarm (x -0.9, -0.3, 0.3, 0.9 at 8.06 m, the content chat's measure),
   sagging a fiftieth of the span in the middle, drawn as two thin crossed strips so they read from any side. Street lamps light pools at night like the game's own. */
var MPC = 96, MPWX = [-0.9, -0.3, 0.3, 0.9], MPWY = 8.06, MPWC = [38, 38, 42];
function mpPrepare(w){
  w.gl.mp = []; var L = w.mprops || []; if (!L.length && !w.fencesL) return; var cells = new Map(), poles = new Map(), pk = function(x, y){ return Math.round(x*2) + ':' + Math.round(y*2); };
  L.forEach(function(q){ if (/^vehicles\./.test(q.p)) return; var key = gk(Math.floor(q.x/MPC), Math.floor(q.y/MPC)), c = cells.get(key);
    if (!c){ c = {x:(Math.floor(q.x/MPC) + 0.5)*MPC, y:(Math.floor(q.y/MPC) + 0.5)*MPC, list:[], g:null}; cells.set(key, c); w.gl.mp.push(c); } c.list.push(q);
    if (q.p === 'street.power_pole') poles.set(pk(q.x, q.y), q);
    if (q.p === 'street.street_lamp') (w.slights = w.slights || []).push({x:q.x, y:q.y, sl:true});
    if (/burning_barrel/.test(q.p)) (w.barrels = w.barrels || []).push({lamp:true, x:q.x, y:q.y});   /* a fire barrel lights its own warm pool at night, power or not */
    var r = SOLID[q.p] || (/street_lamp|traffic_light|parking_meter|sign_|bollard|hydrant/.test(q.p) ? 0.2 : /bench|trash|bin|mailbox|newspaper|booth|vending|barrel/.test(q.p) ? 0.35 : 0); if (r){ (w.obstL = w.obstL || []).push([q.x, q.y, r]); w.obst = null; } });
  /* fences: each segment goes to the cell of its middle (long ones are cut at 24 m), and to a 16 m collision grid */
  var FG = w.fenceG = new Map(); (w.fencesL || []).forEach(function(f){ var P2 = f.pts; for (var k = 0; k + 3 < P2.length; k += 2){ var ax = P2[k], ay = P2[k+1], bx = P2[k+2], by = P2[k+3], L2 = Math.hypot(bx - ax, by - ay), ns = Math.max(1, Math.ceil(L2/24));
    for (var s = 0; s < ns; s++){ var x0 = ax + (bx - ax)*s/ns, y0 = ay + (by - ay)*s/ns, x1 = ax + (bx - ax)*(s + 1)/ns, y1 = ay + (by - ay)*(s + 1)/ns, mx = (x0 + x1)/2, my = (y0 + y1)/2, key = gk(Math.floor(mx/MPC), Math.floor(my/MPC)), c = cells.get(key);
      if (!c){ c = {x:(Math.floor(mx/MPC) + 0.5)*MPC, y:(Math.floor(my/MPC) + 0.5)*MPC, list:[], g:null}; cells.set(key, c); w.gl.mp.push(c); } (c.fs = c.fs || []).push(x0, y0, x1, y1, f.k);
      for (var gx = Math.floor(Math.min(x0, x1)/16); gx <= Math.floor(Math.max(x0, x1)/16); gx++) for (var gy = Math.floor(Math.min(y0, y1)/16); gy <= Math.floor(Math.max(y0, y1)/16); gy++){ var gkey = gk(gx, gy); (FG.get(gkey) || FG.set(gkey, []).get(gkey)).push(x0, y0, x1, y1); } } } });
  /* 0.126.1: the bigger land models (barns, tents, booths, barriers, the strip mall...) are solid: a box the size of the pack's info row (w across, len along),
     pushed into the fence grid. Flat or soft things (decals, grass, reeds, tape) and ones you walk under (canopies, the bandstand) are left open */
  var LI = window.SHAPED && SHAPED.land && SHAPED.land.models && SHAPED.land.models.land;
  if (LI) L.forEach(function(q){ if (q.p.slice(0, 5) !== 'land.' || q.z > 0.5) return; var id = q.p.slice(5), M = LI[id], I = M && (M.info || (SHAPED.land.info || {})[id]); if (!I || !(I.w > 0.4) || !(I.len > 0.4) || (I.h !== undefined && I.h < 0.6)) return;
    if (/decal|grass|reed|cattail|lily|tape|track|path|stain|crack|canopy|bandstand|vines|tarp|garden_pool|roof_units|fire_escape|young_tree|willow|cattails/.test(id)) return;
    var c = Math.cos(q.yw), sn = Math.sin(q.yw), hw = I.w/2, hl = I.len/2, P4 = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(function(a){ return [q.x + c*a[0] - sn*a[1], q.y + sn*a[0] + c*a[1]]; });
    for (var e = 0; e < 4; e++){ var A = P4[e], B = P4[(e + 1) % 4];
      for (var gx = Math.floor(Math.min(A[0], B[0])/16); gx <= Math.floor(Math.max(A[0], B[0])/16); gx++) for (var gy = Math.floor(Math.min(A[1], B[1])/16); gy <= Math.floor(Math.max(A[1], B[1])/16); gy++){ var gkey = gk(gx, gy); (FG.get(gkey) || FG.set(gkey, []).get(gkey)).push(A[0], A[1], B[0], B[1]); } } });
  /* 0.126.1: painted bays on surface car parks (builder 1.26 asmb:bays, or parking=surface): rows of white lines 2.6 m apart, 5 m long, along the lot's longest side
     and, on lots deeper than 12 m, the opposite side too. Kept with the props, drawn near the player */
  (w.areas || []).forEach(function(a){ if (!a.bays || a.pts.length < 6) return; var P2 = a.pts, n2 = P2.length/2, best = -1, bl = 0, i2;
    for (i2 = 0; i2 < n2; i2++){ var j2 = (i2 + 1) % n2, l2 = Math.hypot(P2[j2*2] - P2[i2*2], P2[j2*2+1] - P2[i2*2+1]); if (l2 > bl){ bl = l2; best = i2; } } if (bl < 6) return;
    var ax = P2[best*2], ay = P2[best*2+1], bx = P2[((best + 1) % n2)*2], by = P2[((best + 1) % n2)*2+1], ux = (bx - ax)/bl, uy = (by - ay)/bl, cx2 = (a.minx + a.maxx)/2, cy2 = (a.miny + a.maxy)/2, nx = -uy, ny = ux;
    if ((cx2 - ax)*nx + (cy2 - ay)*ny < 0){ nx = -nx; ny = -ny; } var depth = 0; for (i2 = 0; i2 < n2; i2++) depth = Math.max(depth, (P2[i2*2] - ax)*nx + (P2[i2*2+1] - ay)*ny);
    var rows = [[0.6, 5.6]]; if (depth > 12) rows.push([depth - 5.6, depth - 0.6]);
    var key = gk(Math.floor(cx2/MPC), Math.floor(cy2/MPC)), c = cells.get(key); if (!c){ c = {x:(Math.floor(cx2/MPC) + 0.5)*MPC, y:(Math.floor(cy2/MPC) + 0.5)*MPC, list:[], g:null}; cells.set(key, c); w.gl.mp.push(c); }
    rows.forEach(function(r){ for (var s = 1.3; s <= bl - 1.3; s += 2.6){ var x0 = ax + ux*s + nx*r[0], y0 = ay + uy*s + ny*r[0], x1 = ax + ux*s + nx*r[1], y1 = ay + uy*s + ny*r[1];
      if (pip(P2, x0, y0) && pip(P2, x1, y1)) (c.bays = c.bays || []).push(x0, y0, x1, y1); } }); });
  L.forEach(function(q){ if (q.wx !== undefined){ var o = poles.get(pk(q.wx, q.wy)); if (!o){ var best = 2.5; poles.forEach(function(z){ var d = Math.hypot(z.x - q.wx, z.y - q.wy); if (d < best){ best = d; o = z; } }); } q.to = o || {x:q.wx, y:q.wy, yw:q.yw}; } });
}
function mpWire(m, a, b){
  var ca = Math.cos(a.yw), sa = Math.sin(a.yw), cb = Math.cos(b.yw), sb = Math.sin(b.yw), flip = ca*cb + sa*sb < 0, ha = hAt(a.x, a.y), hb = hAt(b.x, b.y), span = Math.hypot(b.x - a.x, b.y - a.y), sag = span/50, N = 6;
  if (span < 4 || span > 90) return; var dx = (b.x - a.x)/span, dy = (b.y - a.y)/span, W = 0.025;
  for (var i = 0; i < 4; i++){ var la = MPWX[i], lb = MPWX[flip ? 3 - i : i], x0 = a.x + ca*la, y0 = a.y + sa*la, z0 = ha + MPWY, x1 = b.x + cb*lb, y1 = b.y + sb*lb, z1 = hb + MPWY, pv = null;
    for (var s = 0; s <= N; s++){ var t = s/N, px = x0 + (x1 - x0)*t, py = y0 + (y1 - y0)*t, pz = z0 + (z1 - z0)*t - sag*4*t*(1 - t);
      if (pv){ m.quad(pv[0] - dy*W, pv[2], pv[1] + dx*W, px - dy*W, pz, py + dx*W, px + dy*W, pz, py - dx*W, pv[0] + dy*W, pv[2], pv[1] - dx*W, MPWC, 255);
        m.quad(pv[0], pv[2] - W, pv[1], px, pz - W, py, px, pz + W, py, pv[0], pv[2] + W, pv[1], MPWC, 255); }
      pv = [px, py, pz]; } }
}
/* fence pieces by kind: [model path, length along its x, fallback path]. A piece is stretched a little to fill the run exactly */
var FENCEP = {wood:['land.fence_wood_4', 4, 'street.picket_fence', 2.4], picket:['street.picket_fence', 2.4], chain:['street.chainlink_fence', 2.4], wire:['land.fence_wire_4', 4, 'street.chainlink_fence', 2.4],
  rail:['land.fence_farm_post_rail_4', 4, 'street.picket_fence', 2.4], hedge:['land.hedge_run_4', 4, 'plants.bush', 1.2], wall:['land.wall_low_4', 4, 'street.picket_fence', 2.4]};
function mpFences(m, fs){
  for (var i = 0; i < fs.length; i += 5){ var ax = fs[i], ay = fs[i+1], bx = fs[i+2], by = fs[i+3], F = FENCEP[fs[i+4]] || FENCEP.wood, path = F[0], len = F[1], M = spB(path);
    if (!M && F[2]){ path = F[2]; len = F[3]; M = spB(path); } if (!M) continue;
    if (path === 'land.wall_low_4' && hash(Math.round(ax), Math.round(ay), 177) < 0.35){ var Mm = spB('land.wall_low_4_mossy'); if (Mm) M = Mm; }
    var L2 = Math.hypot(bx - ax, by - ay); if (L2 < 0.5) continue; var n = Math.max(1, Math.round(L2/len)), yw = Math.atan2(by - ay, bx - ax);
    for (var k = 0; k < n; k++){ var t = (k + 0.5)/n, x = ax + (bx - ax)*t, y = ay + (by - ay)*t; m.modelS(M, x, y, yw, mpH(x, y) + 0.02, 1); } }
}
/* the ground's surface where a map prop stands: the terrain, or on flat maps the raised ground beside the sunk roads */
function mpH(x, y){ return world.hg ? hAt(x, y) + (world.liftY || 0) + 0.03 : (typeof SUNK !== 'undefined' && SUNK ? roadOff(x, y) : 0); }   /* drape() lifts flat ground pieces by liftY on hills */
function mpBays(m, B){ var W = 0.06, C = [222, 222, 214];
  for (var i = 0; i < B.length; i += 4){ var ax = B[i], ay = B[i+1], bx = B[i+2], by = B[i+3], L = Math.hypot(bx - ax, by - ay) || 1, px = -(by - ay)/L*W, py = (bx - ax)/L*W, N = Math.max(1, Math.round(L/1.5)), pv = null;
    for (var k = 0; k <= N; k++){ var t = k/N, x = ax + (bx - ax)*t, y = ay + (by - ay)*t, z = mpH(x, y) + 0.03; if (pv) m.quad(pv[0] + px, pv[2], pv[1] + py, x + px, z, y + py, x - px, z, y - py, pv[0] - px, pv[2], pv[1] - py, C, 255); pv = [x, y, z]; } }
}
function manageMapProps(budget){
  var A = world.gl.mp; if (!A || !A.length) return; var R = QS.chunk + MPC, n = 0;
  for (var i = 0; i < A.length; i++){ var c = A[i], d = Math.max(Math.abs(c.x - P.x), Math.abs(c.y - P.y));
    if (!c.g && d < R && n < budget){ var m = new Mesh(); c.list.forEach(function(q){ var M = spB(q.p); if (M) m.modelS(M, q.x, q.y, q.yw, mpH(q.x, q.y) + (q.z || 0) + 0.02, 1); if (q.to) mpWire(m, q, q.to); }); if (c.fs) mpFences(m, c.fs); if (c.bays) mpBays(m, c.bays); c.g = upload(m); n++; }
    else if (c.g && d > R + 150){ freeMesh(c.g); c.g = null; } }
}
var facs = [], FKIND = {};   /* the old modelled fronts are gone: every front is now painted (tools/paint_buildings.py) */
function manageFacades(){}
function dirtyChunk(b){ if (b && b.fac){ freeMesh(b.fac); b.fac = null; } if (b && b.chunk && b.chunk.far){ freeMesh(b.chunk.far); b.chunk.far = null; } if (b && b.chunk && b.chunk.g){ freeMesh(b.chunk.g); freeMesh(b.chunk.l); b.chunk.g = null; b.chunk.l = null; } }
/* the kerb face: a vertical wall of 12 in down each side of every sunk road, from the pavement to the road surface, in 2 m pieces that follow the ground; none where another street joins */
function sunkWalls(w, g, LIFT, SWY, RDY){
  if (!SUNK) return; g.pl = null; var KC = [166, 162, 152];
  w.roads.forEach(function(r){
    if (r.kind !== 'road' || r.w < 6) return; var p = r.pts, hw = r.w/2, gp = (r.gap || []).concat(r.tun || []);
    for (var q = 0; q + 3 < p.length; q += 2){
      if (inRanges(gp, q)) continue; var ax = p[q], az = p[q+1], bx = p[q+2], bz = p[q+3], l = Math.hypot(bx - ax, bz - az); if (l < 0.01) continue;
      var ns = Math.max(1, Math.ceil(l/2)), ux = (bx - ax)/l, uz = (bz - az)/l, nx = -uz, nz = ux, si;
      [-1, 1].forEach(function(sd){ var r0 = -1;   /* 0.114.91: joined into runs of up to 10 m (the height grid's spacing), not a quad every 2 m */
        var put = function(a0, a1){ var s0 = l*a0/ns, s1 = l*a1/ns, x0 = ax + ux*s0 + nx*hw*sd, z0 = az + uz*s0 + nz*hw*sd, x1 = ax + ux*s1 + nx*hw*sd, z1 = az + uz*s1 + nz*hw*sd, h0 = hAt0(x0, z0), h1 = hAt0(x1, z1);
          g.quad(x0, h0 + RDY + LIFT, z0, x1, h1 + RDY + LIFT, z1, x1, h1 + SWY + LIFT, z1, x0, h0 + SWY + LIFT, z0, KC, 255); };
        for (si = 0; si <= ns; si++){ var off = si === ns || roadOff(ax + ux*l*(si + 0.5)/ns + nx*(hw + 0.4)*sd, az + uz*l*(si + 0.5)/ns + nz*(hw + 0.4)*sd, 0.1);
          if (!off && r0 < 0) r0 = si; else if (r0 >= 0 && (off || si - r0 >= 5)){ put(r0, si); r0 = off ? -1 : si; } } });
    }
  });
}
function prep3D(){
  var w = world, g = new Mesh(), chunks = new Map(), i;
  /* lawns in parks and on greens use the terrain's own grass (tile 45 = terrain blend, no other layers), so they meet it without a seam;
     woods and fields are not drawn as shapes at all: the ground cover generator paints them into the terrain with soft edges */
  var ATILE = {grass:[TERR, [240,250,232]], park:[TERR, [232,248,226]], sand:[TX.dirt, WHITE], parking:[TX.asphalt, [226,222,214]], water:[TX.water, WHITE]};
  w.areas.forEach(function(a){
    var p = a.pts; if (!ATILE[a.kind]) return;
    if (p.length > 800){ var st = Math.ceil(p.length/800)*2, q = []; for (i = 0; i < p.length; i += st) q.push(p[i], p[i+1]); p = q; }
    var idx = earclip(p), y = a.kind === 'water' ? 0.05 : 0.03, at = ATILE[a.kind]; g.pl = [at[0], at[0] === TERR ? 0 : a.kind === 'water' ? 0.12 : 0.25];   /* 0.114.75: lakes take a larger water texture, so the far surface does not break into noise */
    for (i = 0; i < idx.length; i += 3) g.tri(p[idx[i]*2], y, p[idx[i]*2+1], p[idx[i+1]*2], y, p[idx[i+1]*2+1], p[idx[i+2]*2], y, p[idx[i+2]*2+1], at[1], 255);
    /* 0.125.4: the lake shore strip (0.124.0) is off: on hills the draped strip and the lake under it are a few cm apart and the iPhone's depth buffer
       cannot tell them apart, so the whole lake shimmered. Kept for a later version that cuts the strip out of the lake instead of laying it on top */
  });
  bridgeScan(w); buildSunk(w); wwPlan(w);
  var LIFT = w.hg ? 0.12 : 0, SWY = 0.062, RDY = SWY - ROAD_T; w.liftY = LIFT;   /* pavement and sunk road surface heights (the lift is what drape() adds on hills) */
  /* sidewalk and road ribbons: cut = true leaves out the stretches that fall inside a sunk road (a path or lane meeting a sunk street stops at its kerb) */
  /* 0.114.55: a river is one surface: five strips across, flow along the river (the texture runs downstream), and the strip's distance from the bank goes to the shader in the uv
     so it can darken the deep middle and put foam on the edges. vt.z carries the half width: 19.05 + hw/100 */
  var waterRibbon = function(p, hw, gap){
    var run = 0, S = [-1, -0.5, 0, 0.5, 1], zz = 19.05 + Math.min(40, hw)/100, inGap = function(q){ if (gap) for (var gi = 0; gi < gap.length; gi++) if (q >= gap[gi][0] && q <= gap[gi][1]) return true; return false; };
    for (var q = 0; q < p.length - 2; q += 2){
      var ax = p[q], az = p[q+1], bx = p[q+2], bz = p[q+3], l = Math.hypot(bx - ax, bz - az); if (l < 0.01) continue; if (inGap(q)){ run += l; continue; }
      var nx = -(bz - az)/l, nz = (bx - ax)/l, k, i;
      for (k = 0; k < 4; k++){ var A = S[k], B = S[k+1], V = [[ax, az, A, run], [bx, bz, A, run + l], [bx, bz, B, run + l], [ax, az, B, run]], tr = [0, 1, 2, 0, 2, 3];
        for (i = 0; i < 6; i++){ var vv = V[tr[i]]; g.p.push(vv[0] + nx*hw*vv[2], 0.05, vv[1] + nz*hw*vv[2]); g.c.push(255, 255, 255, 255); g.t.push(vv[2]*hw/6, vv[3]/6, zz); } }
      run += l;
    }
  };
  var ribbon = function(p, hw, y, tile, col, lanes, gap, cut){
    var run = 0, inGap = function(q){ if (gap) for (var gi = 0; gi < gap.length; gi++) if (q >= gap[gi][0] && q <= gap[gi][1]) return true; return false; };
    for (var q = 0; q < p.length - 2; q += 2){
      if (inGap(q)) continue; var ax = p[q], az = p[q+1], bx = p[q+2], bz = p[q+3], l = Math.hypot(bx-ax, bz-az); if (l < 0.01) continue;
      if (cut && SUNK && l > 2.5){ var ns = Math.ceil(l/2), si, sx0, sz0, sx1, sz1, sl = l/ns;   /* long segments are cut into 2 m pieces so each can be tested */
        /* 0.114.91: tested in 2 m pieces, but the pieces that stay are joined into one quad per unbroken run (a quad per piece made a downtown square tens of millions of vertices once draped, and phones ran out of memory loading it) */
        var r0 = -1, snx = -(bz - az)/l*hw, snz = (bx - ax)/l*hw, flush = function(a0, a1){ sx0 = ax + (bx - ax)*a0/ns; sz0 = az + (bz - az)*a0/ns; sx1 = ax + (bx - ax)*a1/ns; sz1 = az + (bz - az)*a1/ns; g.pl = [tile, 0.25]; g.quad(sx0+snx,y,sz0+snz, sx1+snx,y,sz1+snz, sx1-snx,y,sz1-snz, sx0-snx,y,sz0-snz, col, 255); };
        for (si = 0; si <= ns; si++){ var off = si === ns || roadOff(ax + (bx - ax)*(si + 0.5)/ns, az + (bz - az)*(si + 0.5)/ns, 0.3);
          if (!off && r0 < 0) r0 = si; else if (off && r0 >= 0){ flush(r0, si); r0 = -1; } }
        continue; }
      if (cut && SUNK && roadOff((ax + bx)/2, (az + bz)/2, 0.3)) continue;
      var nx = -(bz-az)/l*hw, nz = (bx-ax)/l*hw;
      if (lanes){ g.pl = null; g.quadUV([ax+nx,y,az+nz, bx+nx,y,bz+nz, bx-nx,y,bz-nz, ax-nx,y,az-nz], [0,run/8, 0,(run+l)/8, 1,(run+l)/8, 1,run/8], TX.lanes, col, 255); run += l; }
      else { g.pl = [tile, 0.25]; g.quad(ax+nx,y,az+nz, bx+nx,y,bz+nz, bx-nx,y,bz-nz, ax-nx,y,az-nz, col, 255); }
    }
    if (hw >= 1.5){ g.pl = [lanes ? TX.asphalt : tile, 0.25]; for (q = 2; q < p.length - 2; q += 2) if (!inGap(q) && !inGap(q - 2)) for (var k = 0; k < 6; k++){ var a0 = k*1.0472, a1 = a0 + 1.0472; g.tri(p[q], y - 0.004, p[q+1], p[q] + Math.cos(a0)*hw, y - 0.004, p[q+1] + Math.sin(a0)*hw, p[q] + Math.cos(a1)*hw, y - 0.004, p[q+1] + Math.sin(a1)*hw, col, 255); } }
  };
  /* the pavement is two 2 m strips, one each side of the sunk road; none where another street crosses (that is the road's own surface) */
  w.roads.forEach(function(r){
    if (r.kind !== 'road' || r.w < 6) return; var p = r.pts, hw = r.w/2, gp = (r.gap || []).concat(r.tun || []);
    for (var q = 0; q + 3 < p.length; q += 2){
      if (inRanges(gp, q)) continue; var ax = p[q], az = p[q+1], bx = p[q+2], bz = p[q+3], l = Math.hypot(bx - ax, bz - az); if (l < 0.01) continue;
      var ns = Math.max(1, Math.ceil(l/2)), ux = (bx - ax)/l, uz = (bz - az)/l, nx = -uz, nz = ux, si;
      [-1, 1].forEach(function(sd){ var r0 = -1;   /* 0.114.91: one quad per unbroken run of 2 m pieces, not one per piece */
        /* 0.123.1: from the builder's street bands when the map has them: a grass verge (the ground shows through) between the kerb and the pavement, the pavement's own width,
           and a gravel shoulder instead of a pavement on rural roads. Without them, the old 2 m pavement at the kerb */
        var wk = r.wk === undefined ? 2 : r.wk, p0 = hw + (r.vg > 0 ? r.vg + 0.25 : 0), p1 = p0 + wk, sh = r.sh || 0;
        var strip = function(x0, z0, x1, z1, a, b){ g.quad(x0 + nx*a*sd, SWY, z0 + nz*a*sd, x1 + nx*a*sd, SWY, z1 + nz*a*sd, x1 + nx*b*sd, SWY, z1 + nz*b*sd, x0 + nx*b*sd, SWY, z0 + nz*b*sd, WHITE, 255); };
        var put = function(a0, a1){ var s0 = l*a0/ns, s1 = l*a1/ns, x0 = ax + ux*s0, z0 = az + uz*s0, x1 = ax + ux*s1, z1 = az + uz*s1;
          if (wk > 0){ g.pl = [TX.sidewalk, 0.25]; strip(x0, z0, x1, z1, p0, p1); }
          if (sh > 0){ g.pl = [TX.gravel, 0.5]; strip(x0, z0, x1, z1, hw, hw + sh); } };
        if (wk <= 0 && sh <= 0) return;
        for (si = 0; si <= ns; si++){ var off = true; if (si < ns){ var mx = ax + ux*l*(si + 0.5)/ns, mz = az + uz*l*(si + 0.5)/ns, pm = wk > 0 ? (p0 + p1)/2 : hw + sh/2; off = roadOff(mx + nx*pm*sd, mz + nz*pm*sd, 0.2) || roadOff(mx + nx*(hw + 0.1)*sd, mz + nz*(hw + 0.1)*sd, 0.0); }
          if (!off && r0 < 0) r0 = si; else if (off && r0 >= 0){ put(r0, si); r0 = -1; } } });
    }
  });
  w.roads.forEach(function(r){
    if (r.kind === 'water') waterRibbon(r.pts, r.w/2, r.cul);
    else if (r.kind === 'path') ribbon(r.pts, r.w/2, 0.07, TX.sidewalk, [240,226,200], false, r.tun, true);
    else if (r.kind === 'rail'){ g.pl = null; ribbon(r.pts, r.w/2, 0.075, TX.gravel, WHITE, false, r.tun, true); }
    else ribbon(r.pts, r.w/2, r.kind === 'road' && r.w >= 6 ? RDY : 0.09, TX.asphalt, WHITE, r.w >= 8, r.tun ? (r.gap || []).concat(r.tun) : r.gap, !(r.kind === 'road' && r.w >= 6));
  });
  g.pl = null; if (w.hg) drape(g, LIFT, true); w.liftY = LIFT;
  if (w.hg && typeof mapSrc !== 'undefined' && mapSrc && mapSrc.street) (g.parts || [g]).forEach(function(pm){ var WT = pm.t, WP = pm.p; for (var wi = 0; wi < WT.length/3; wi++) if (WT[wi*3 + 2] > 18.9 && WT[wi*3 + 2] < 19.5) WP[wi*3 + 1] = pm.c && pm.c[wi*4 + 1] === 0 ? 0.08 : 0.05; });   /* the test river's channel is cut, so its water stands at the level the bank pieces expect */
  var gD = g; g = new Mesh();   /* 0.114.92: the draped ground stays as it came back (typed arrays from the Rust core); what follows goes into a second list */
  sunkWalls(w, g, LIFT, SWY, RDY);
  try { bridgeBuild(g); } catch (er){ console.log('bridges', er); }
  try { structBuild(g); } catch (er){ console.log('structures', er); }
  try { waterwaysBuild(g); } catch (er){ console.log('waterways', er); }
  try { rackBuild(g); } catch (er){ console.log('rack', er); }
  w.buildings.forEach(function(b){
    b.base = 0; b.low = 0;
    if (w.hg){ var hi = hAt(b.cx, b.cy), lo = hi; for (var q = 0; q < b.pts.length; q += 2){ var hq = hAt(b.pts[q], b.pts[q+1]); if (hq > hi) hi = hq; if (hq < lo) lo = hq; } b.base = hi + 0.04; b.low = lo; }
    var cx = Math.floor(b.cx/CH), cy = Math.floor(b.cy/CH), key = gk(cx, cy), c = chunks.get(key);
    if (!c) chunks.set(key, c = {list:[], g:null, x:(cx+0.5)*CH, y:(cy+0.5)*CH});
    c.list.push(b); b.chunk = c; shell(b, NULLM); b.int = null; b.fac = null; b.got = {};
  });
  facs.forEach(function(fb){ if (fb.fac){ freeMesh(fb.fac); fb.fac = null; } }); facs = [];
  if (w.gl){ w.gl.ground.forEach(function(o){ if (o.g) freeMesh(o.g); o.g = null; }); w.gl.chunks.forEach(function(c){ if (c.g){ freeMesh(c.g); freeMesh(c.l); } if (c.far) freeMesh(c.far); }); if (w.gl.trees) w.gl.trees.forEach(function(o){ freeMesh(o.g); }); w.gl.terr.forEach(function(o){ freeMesh(o.g); }); }
  var list = []; chunks.forEach(function(c){ list.push(c); });
  g.pl = null; placeProps(g); try { placeDress(g); } catch (er){ console.log('dress', er); }
  /* the ground is cut into squares so only the part near you is drawn */
  /* 0.114.91: counted first, then copied straight into typed arrays (4 and 1 bytes a value, not 8 in growing lists), and the big lists let go before the upload:
     a town square's ground used to need its whole size twice over in plain lists at this point, which is where phones ran out of memory and the page reloaded */
  var GT = 256, gt = [], ids = new Map(), cnt = [], bxs = [], bys = [], SRC = (gD.parts || [gD]).concat([g]);
  var bks = SRC.map(function(sm){ var nT = sm.p.length/9, bk = new Int32Array(nT);
    for (var i2 = 0; i2 < nT; i2++){ var o9 = i2*9, kx = Math.floor((sm.p[o9] + sm.p[o9+3] + sm.p[o9+6])/3/GT), ky = Math.floor((sm.p[o9+2] + sm.p[o9+5] + sm.p[o9+8])/3/GT), key = gk(kx, ky), id = ids.get(key);
      if (id === undefined){ id = cnt.length; ids.set(key, id); cnt.push(0); bxs.push((kx + 0.5)*GT); bys.push((ky + 0.5)*GT); } bk[i2] = id; cnt[id]++; }
    return bk; });
  /* 0.117.5: each list's runs are copied out as small pieces into their tile, and the list is let go straight away: the ground is never held twice over (it was 340 MB at the peak for Springfield's centre, and iPhones closed the page) */
  var BK = cnt.map(function(n){ return {pp:[], pc:[], pt:[], n:n}; });
  SRC.forEach(function(sm, si){ var bk = bks[si], nT = bk.length, typed = !Array.isArray(sm.p), r0 = 0;
    var flush = function(a, b){ var bb = BK[bk[a]];
      if (typed){ bb.pp.push(sm.p.slice(a*9, b*9)); bb.pt.push(sm.t.slice(a*9, b*9)); bb.pc.push(sm.c.slice(a*12, b*12)); }
      else { bb.pp.push(new Float32Array(sm.p.slice(a*9, b*9))); bb.pt.push(new Float32Array(sm.t.slice(a*9, b*9))); bb.pc.push(new Uint8Array(sm.c.slice(a*12, b*12))); } };
    for (var i2 = 1; i2 <= nT; i2++) if (i2 === nT || bk[i2] !== bk[r0]){ if (nT) flush(r0, i2); r0 = i2; }
    sm.p = sm.c = sm.t = null; bks[si] = null; if (gD.parts && si < gD.parts.length) gD.parts[si] = null; });
  BK.forEach(function(bm, id){ gt.push({g:null, d:bm, x:bxs[id], y:bys[id]}); BK[id] = null; });
  w.gl = {ground:gt, chunks:list, terr:new Map()}; try { mpPrepare(w); } catch (er){ console.log('map props', er); } setTimeout(function(){ gtPackAll(w); }, 300);
}

