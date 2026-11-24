/* AfterStreet Workshop kit: ready-made parts built from settings, shared by the editor's Make card (workshop/ed_make.js)
   and the build library (workshop/build.js), so a part made by hand and a part made by a script come out the same.
   Every function makes ordinary editor pieces (box, poly, cyl, loft), so the result opens, saves, mirrors and builds like
   anything else, and the game needs nothing new. Ported from the content chat's own helpers (workshop/designs/refs.js and
   workshop/tools/cabin_kit.js), which now live here for every chat.
     K.on(doc, list)          a small builder that adds pieces to a list (default doc.pieces): block, box, seat, door, point
     K.pane(b, o)             a pane from its width and height, leaning back and narrower at the top (windscreens, raked panels)
     K.quad(b, corners, d, o) any four-corner plate pushed by a thickness vector
     K.wall(b, o)             a wall with openings cut out (doors, windows, wheel arches), with glass and frames if asked
     K.text(b, str, o)        raised lettering in a 3 x 5 block font: signs, number plates, shop names
     K.trim(b, B, o)          corner boards, a darker base strip and a fascia round a box body (bounds B)
     K.along(pieces, o)       copies of pieces in a row: a count, a spacing, or a length filled at a spacing
     K.wheelPieces(doc, r, w, style)  the wheel model in a style: plain, rounded or truck
     K.carCabin(b, o), K.truckCab(b, o)  a whole cabin: dashboard, gauges, steering wheel, seats, door cards, floor, headliner
   Sizes are metres. Runs in the browser (after model.js, assets.js and craft.js) and in Node. MIT licence. */
(function(root){
  var node = typeof module !== 'undefined' && module.exports;
  var M = node ? require('./model.js') : root.WSM;
  if (node){ require('./assets.js'); require('./craft.js'); }
  var K = {};
  function r4(v){ return Math.round(v*1e4)/1e4; }
  function v3(q){ return [r4(q[0]), r4(q[1]), r4(q[2])]; }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function colour(doc, c){ if (typeof c === 'string' && c[0] === '#'){ var n = M.customName(c); doc.colours = doc.colours || {}; doc.colours[n] = c.toLowerCase(); return n; } return c || 'paint1'; }
  /* turn a local point about Y by deg and move it to at */
  function place(at, deg, q){ var a = (deg || 0)*Math.PI/180, c = Math.cos(a), s = Math.sin(a); return [at[0] + q[0]*c + q[2]*s, at[1] + q[1], at[2] - q[0]*s + q[2]*c]; }

  /* ---------------------------------------------------------------- the builder */
  K.on = function(doc, list){
    list = list || doc.pieces;
    var b = {doc:doc, list:list, made:[]};
    function nid(){ return M.newId({pieces:list === doc.pieces ? list : doc.pieces.concat(list)}); }
    /* any shape from the toolbar (box, bev, wedge, cyl, tube, cone, plate, corner, ...): centre, size, settings */
    b.block = function(shape, pos, sz, opt){
      opt = opt || {}; var sp = M.SHAPES[shape].make(), p = {id:nid(), g:opt.g || 'body', pos:v3(pos), rot:[0, 0, 0], scl:[1, 1, 1], c:'paint1', m:'sheet'}, k;
      for (k in sp) p[k] = sp[k];
      for (k in opt) if (k !== 'fn' && k !== 'c' && k !== 'g' && opt[k] !== undefined) p[k] = clone(opt[k]);
      if (sz) p.d = v3(sz);
      p.c = colour(doc, opt.c); if (!opt.m) p.m = M.guessMaterial(p.c);
      if (shape === 'cyl') p.ax = opt.ax || 'y';
      if (opt.rot) p.rot = v3(opt.rot);
      if (opt.fn && M.setJob) M.setJob(p, opt.fn);
      list.push(p); b.made.push(p); return p;
    };
    b.box = function(mn, mx, opt){ return b.block('box', [(mn[0] + mx[0])/2, (mn[1] + mx[1])/2, (mn[2] + mx[2])/2], [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]], opt); };
    b.seat = function(pos, opt){ opt = opt || {}; return b.block('box', pos, opt.size || [0.48, 0.1, 0.48], {c:opt.c || 'seat', m:'cloth', fn:'seat', mx:!!opt.mx, name:opt.name || 'seat', hidden:!!opt.hidden, fitting:opt.fitting}); };
    b.door = function(mn, mx, opt){ opt = opt || {}; var o = {c:opt.c || 'paint1', m:opt.m || 'sheet', mx:!!opt.mx, name:opt.name || 'door'}; if (opt.g) o.g = opt.g;
      var p = b.box(mn, mx, o); if (M.setJob) M.setJob(p, 'door'); p.door = {kind:opt.kind || 'swing', hinge:opt.hinge || 'front'}; return p; };
    b.point = function(name, kind, pos, dir){ return M.addPoint(doc, name, kind, v3(pos), dir); };
    return b;
  };

  /* ---------------------------------------------------------------- panes */
  /* a four-corner plate (corners in order round the edge) pushed by a thickness vector d */
  K.quad = function(b, c, d, opt){
    var pts = c.concat(c.map(function(q){ return [q[0] + d[0], q[1] + d[1], q[2] + d[2]]; })), cx = 0, cy = 0, cz = 0, i;
    pts.forEach(function(q){ cx += q[0]/8; cy += q[1]/8; cz += q[2]/8; });
    var f = [[0, 3, 2, 1], [4, 5, 6, 7]]; for (i = 0; i < 4; i++) f.push([i, (i + 1) % 4, (i + 1) % 4 + 4, i + 4]);
    var o = Object.assign({}, opt || {}); o.v = pts.map(function(q){ return v3([q[0] - cx, q[1] - cy, q[2] - cz]); }); o.f = f;
    return b.block('corner', [cx, cy, cz], null, o);
  };
  /* a pane standing on its bottom edge at o.at, facing +z turned by o.turn degrees (90 faces +x):
     o.w width, o.h height along the slope, o.t thickness (pushed inwards), o.lean degrees back from upright,
     o.rake how much narrower the top is on each side, o.topW the top width instead of rake */
  K.pane = function(b, o){
    o = Object.assign({w:1.2, h:0.6, t:0.02, lean:0, rake:0, turn:0, c:'glass', at:[0, 0, 0]}, o);
    var L = o.lean*Math.PI/180, hw = o.w/2, tw = o.topW != null ? o.topW/2 : hw - o.rake, hy = o.h*Math.cos(L), hz = -o.h*Math.sin(L);
    var n = [0, Math.sin(L), Math.cos(L)], loc = [[-hw, 0, 0], [hw, 0, 0], [tw, hy, hz], [-tw, hy, hz]];
    var cs = loc.map(function(q){ return place(o.at, o.turn, q); }), d0 = place([0, 0, 0], o.turn, [-n[0]*o.t, -n[1]*o.t, -n[2]*o.t]);
    var opt = {c:o.c, m:o.m || (/^glass/.test(o.c) ? 'glass' : undefined), name:o.name || (/^glass/.test(o.c) ? 'window' : 'panel'), mx:o.mx, fitting:o.fitting, g:o.g};
    Object.keys(opt).forEach(function(k){ if (opt[k] === undefined) delete opt[k]; });
    return K.quad(b, cs, d0, opt);
  };

  /* ---------------------------------------------------------------- walls with openings */
  /* the solid cells of a wall w long and h tall once the openings [{a, b, y0, y1}] (from the left end and the bottom) are cut out */
  K.wallCells = function(w, h, ops){
    var xs = [0, w], cells = [], i;
    ops.forEach(function(o){ xs.push(Math.max(0, Math.min(w, o.a)), Math.max(0, Math.min(w, o.b))); });
    xs = xs.sort(function(a, c){ return a - c; }).filter(function(x, k, A){ return !k || x - A[k - 1] > 1e-6; });
    for (i = 0; i < xs.length - 1; i++){
      var x0 = xs[i], x1 = xs[i + 1], xm = (x0 + x1)/2, ys = [[0, h]];
      ops.forEach(function(o){ if (o.a < xm && o.b > xm){ var y0 = Math.max(0, o.y0 || 0), y1 = Math.min(h, o.y1 == null ? h : o.y1), nx = [];
        ys.forEach(function(r){ if (y1 <= r[0] || y0 >= r[1]){ nx.push(r); return; } if (y0 > r[0]) nx.push([r[0], y0]); if (y1 < r[1]) nx.push([y1, r[1]]); }); ys = nx; } });
      ys.forEach(function(r){ if (r[1] - r[0] > 1e-4) cells.push([x0, x1, r[0], r[1]]); });
    }
    /* join cells side by side with the same top and bottom: one long piece instead of many */
    cells.sort(function(p, q){ return p[2] - q[2] || p[3] - q[3] || p[0] - q[0]; });
    var out = [];
    cells.forEach(function(c){ var l = out[out.length - 1]; if (l && Math.abs(l[2] - c[2]) < 1e-6 && Math.abs(l[3] - c[3]) < 1e-6 && Math.abs(l[1] - c[0]) < 1e-6) l[1] = c[1]; else out.push(c.slice()); });
    return out;
  };
  /* a wall standing on o.at (the middle of its bottom edge), running along x and facing +z, turned by o.turn degrees.
     o.w length, o.h height, o.t thickness, o.openings [{a, b, y0, y1}] from the left end (seen from the front) and the bottom;
     y0 0 is a door. o.glass puts a pane in each opening that does not reach the floor; o.frame is the width of a frame round each one */
  K.wall = function(b, o){
    o = Object.assign({w:3, h:2.4, t:0.1, turn:0, at:[0, 0, 0], openings:[], c:'paint1'}, o);
    var ops = o.openings.map(function(q){ return {a:q.a, b:q.b, y0:q.y0 || 0, y1:q.y1 == null ? o.h : q.y1}; }).filter(function(q){ return q.b - q.a > 0.01 && q.y1 - q.y0 > 0.01; });
    var out = [], nm = o.name || 'wall', rot = o.turn ? [0, o.turn, 0] : null;
    function put(x0, x1, y0, y1, z0, z1, opt){
      var c = place(o.at, o.turn, [(x0 + x1)/2 - o.w/2, (y0 + y1)/2, (z0 + z1)/2]), q = Object.assign({}, opt); if (rot) q.rot = rot;
      out.push(b.block('box', c, [x1 - x0, y1 - y0, z1 - z0], q)); }
    var base = {c:o.c, m:o.m, name:nm, mx:o.mx, fitting:o.fitting, g:o.g}; Object.keys(base).forEach(function(k){ if (base[k] === undefined) delete base[k]; });
    K.wallCells(o.w, o.h, ops).forEach(function(c){ put(c[0], c[1], c[2], c[3], -o.t/2, o.t/2, base); });
    ops.forEach(function(q){
      if (o.glass && q.y0 > 0.01) put(q.a, q.b, q.y0, q.y1, -0.01, 0.01, Object.assign({}, base, {c:'glass', m:'glass', name:nm + ' window'}));
      if (o.frame > 0){ var fw = o.frame, z0 = o.t/2, z1 = o.t/2 + Math.min(0.03, fw/2), fc = Object.assign({}, base, {c:o.frameC || base.c, name:nm + ' frame'});
        put(q.a - fw, q.b + fw, q.y1, Math.min(o.h, q.y1 + fw), z0, z1, fc);
        if (q.y0 > 0.01) put(q.a - fw, q.b + fw, Math.max(0, q.y0 - fw), q.y0, z0, z1, fc);
        put(q.a - fw, q.a, q.y0, q.y1, z0, z1, fc); put(q.b, q.b + fw, q.y0, q.y1, z0, z1, fc); }
    });
    return out;
  };

  /* ---------------------------------------------------------------- lettering */
  /* a 3 x 5 block font (M, N, W and a few marks are wider); rows from the top, 1 = filled */
  K.FONT = {
    A:['010','101','111','101','101'], B:['110','101','110','101','110'], C:['011','100','100','100','011'], D:['110','101','101','101','110'],
    E:['111','100','110','100','111'], F:['111','100','110','100','100'], G:['011','100','101','101','011'], H:['101','101','111','101','101'],
    I:['111','010','010','010','111'], J:['001','001','001','101','010'], K:['101','101','110','101','101'], L:['100','100','100','100','111'],
    M:['10001','11011','10101','10001','10001'], N:['1001','1101','1011','1001','1001'], O:['010','101','101','101','010'], P:['110','101','110','100','100'],
    Q:['010','101','101','110','011'], R:['110','101','110','101','101'], S:['011','100','010','001','110'], T:['111','010','010','010','010'],
    U:['101','101','101','101','111'], V:['101','101','101','101','010'], W:['10001','10001','10101','11011','10001'], X:['101','101','010','101','101'],
    Y:['101','101','010','010','010'], Z:['111','001','010','100','111'],
    '0':['111','101','101','101','111'], '1':['010','110','010','010','111'], '2':['110','001','010','100','111'], '3':['110','001','010','001','110'],
    '4':['101','101','111','001','001'], '5':['111','100','110','001','110'], '6':['011','100','110','101','010'], '7':['111','001','010','010','010'],
    '8':['010','101','010','101','010'], '9':['010','101','011','001','110'],
    ' ':['00','00','00','00','00'], '-':['000','000','111','000','000'], '.':['0','0','0','0','1'], ',':['00','00','00','01','10'],
    '/':['001','001','010','100','100'], '!':['1','1','1','0','1'], '?':['110','001','010','000','010'], "'":['1','1','0','0','0'],
    ':':['0','1','0','1','0'], '&':['010','101','010','101','011'], '+':['000','010','111','010','000'], '#':['101','111','101','111','101']
  };
  /* the filled rectangles of one glyph [x0, y0 (from the top), w, h] in font pixels: runs in a row, joined down the rows */
  function glyphRects(g){
    var runs = [], open = {};
    g.forEach(function(row, y){ var x = 0, now = {};
      while (x < row.length){ if (row[x] !== '1'){ x++; continue; } var s = x; while (x < row.length && row[x] === '1') x++; var k = s + ':' + x;
        if (open[k]){ open[k][3]++; now[k] = open[k]; } else { var r = [s, y, x - s, 1]; runs.push(r); now[k] = r; } }
      open = now; });
    return runs;
  }
  K.textWidth = function(str, px){ var w = 0, n = 0; String(str).toUpperCase().split('').forEach(function(ch){ var g = K.FONT[ch]; if (!g) return; w += g[0].length; n++; }); return (w + Math.max(0, n - 1))*px; };
  /* raised letters standing on o.at (the middle of the line's bottom, or its left or right end with o.align), facing +z turned by o.turn:
     o.h letter height, o.depth how far they stand out. Unknown characters are left out. */
  K.text = function(b, str, o){
    o = Object.assign({h:0.15, depth:0.012, turn:0, align:'centre', at:[0, 0, 0], c:'white', name:'lettering'}, o);
    var px = o.h/5, W = K.textWidth(str, px), x = o.align === 'left' ? 0 : o.align === 'right' ? -W : -W/2, out = [], rot = o.turn ? [0, o.turn, 0] : null;
    var base = {c:o.c, m:o.m || 'plastic', name:o.name, mx:o.mx, fitting:o.fitting, g:o.g}; Object.keys(base).forEach(function(k){ if (base[k] === undefined) delete base[k]; });
    String(str).toUpperCase().split('').forEach(function(ch){ var g = K.FONT[ch]; if (!g) return;
      glyphRects(g).forEach(function(r){ var q = Object.assign({}, base); if (rot) q.rot = rot;
        var c = place(o.at, o.turn, [x + (r[0] + r[2]/2)*px, (5 - r[1] - r[3]/2)*px, o.depth/2]);
        out.push(b.block('box', c, [r[2]*px, r[3]*px, o.depth], q)); });
      x += (g[0].length + 1)*px; });
    return out;
  };

  /* ---------------------------------------------------------------- trim round a box body */
  /* B {mn, mx}: the body's box. o.corners boards up each corner (o.cw wide), o.base a darker strip round the bottom (o.baseH tall),
     o.fascia a band round the top (o.fasciaH tall); o.proud how far they stand out; o.c and o.baseC their colours */
  K.trim = function(b, B, o){
    o = Object.assign({corners:true, base:true, fascia:true, cw:0.12, baseH:0.25, fasciaH:0.2, proud:0.03, c:'#e8e2d4', baseC:'#3a3632', name:'trim'}, o);
    var mn = B.mn, mx = B.mx, p = o.proud, out = [], g = o.g ? {g:o.g} : {};
    if (o.corners) [[mn[0], mn[2]], [mx[0], mn[2]], [mn[0], mx[2]], [mx[0], mx[2]]].forEach(function(cn){
      var sx = cn[0] === mn[0] ? 1 : -1, sz = cn[1] === mn[2] ? 1 : -1, x0 = cn[0] - sx*p, x1 = cn[0] + sx*(o.cw - p), z0 = cn[1] - sz*p, z1 = cn[1] + sz*(o.cw - p);
      out.push(b.box([Math.min(x0, x1), mn[1] + (o.base ? o.baseH : 0), Math.min(z0, z1)], [Math.max(x0, x1), mx[1] - (o.fascia ? o.fasciaH : 0), Math.max(z0, z1)], Object.assign({c:o.c, m:'wood', name:o.name + ' corner board'}, g))); });
    function band(y0, y1, c, nm, pp){
      out.push(b.box([mn[0] - pp, y0, mx[2]], [mx[0] + pp, y1, mx[2] + pp], Object.assign({c:c, name:nm}, g)));
      out.push(b.box([mn[0] - pp, y0, mn[2] - pp], [mx[0] + pp, y1, mn[2]], Object.assign({c:c, name:nm}, g)));
      out.push(b.box([mx[0], y0, mn[2]], [mx[0] + pp, y1, mx[2]], Object.assign({c:c, name:nm}, g)));
      out.push(b.box([mn[0] - pp, y0, mn[2]], [mn[0], y1, mx[2]], Object.assign({c:c, name:nm}, g))); }
    if (o.base) band(mn[1], mn[1] + o.baseH, o.baseC, o.name + ' base strip', p*0.7);
    if (o.fascia) band(mx[1] - o.fasciaH, mx[1], o.c, o.name + ' fascia', p);
    return out;
  };

  /* ---------------------------------------------------------------- copies in a row */
  /* copies of pieces in a straight row: o.dir the direction, o.every the spacing, and o.count copies (counting the first)
     or o.length to fill at that spacing. Returns only the new copies. */
  K.along = function(pieces, o){
    var d = o.dir || [1, 0, 0], L = Math.hypot(d[0], d[1], d[2]) || 1, u = [d[0]/L, d[1]/L, d[2]/L], e = o.every || 0.5;
    var n = o.count || (o.length ? Math.floor(o.length/e + 1e-6) + 1 : 2), out = [];
    for (var i = 1; i < n; i++) pieces.forEach(function(p){ var q = clone(p); q.id = 'n' + Math.random().toString(36).slice(2, 9);
      q.pos = v3([p.pos[0] + u[0]*e*i, p.pos[1] + u[1]*e*i, p.pos[2] + u[2]*e*i]); out.push(q); });
    return out;
  };

  /* ---------------------------------------------------------------- wheel looks */
  K.WHEEL_LOOKS = {plain:'Plain (8-sided tyre, 6-sided hub)', rounded:'Rounded (smoother tyre, silver hub, hub cap)', truck:'Truck (deep steel hub, wheel nuts)'};
  var plainWheel = M.makeWheel;
  /* the wheel model (group 'wheel', axis x, outer face +x) in a look; the game copies it onto every hub */
  K.wheelPieces = function(doc, r, w, style){
    var keep = plainWheel(doc, r, w); if (!style || style === 'plain') return keep;
    var b = K.on(doc, keep), hw = w/2;
    keep.forEach(function(p){ if (p.g !== 'wheel') return;
      if (p.name === 'tyre'){ p.n = 12; if (style === 'truck') p.r = [[-hw, 0, 0, r4(r*0.9), r4(r*0.9)], [r4(-hw + 0.02), 0, 0, r, r], [r4(hw - 0.02), 0, 0, r, r], [hw, 0, 0, r4(r*0.9), r4(r*0.9)]]; }
      if (p.name === 'hub'){ p.n = 10; p.c = colour(doc, style === 'truck' ? '#9aa0a6' : '#8f9aa5');
        if (style === 'truck') p.r = [[r4(-hw - 0.006), 0, 0, r4(r*0.62), r4(r*0.62)], [r4(hw - 0.04), 0, 0, r4(r*0.62), r4(r*0.62)], [r4(hw + 0.006), 0, 0, r4(r*0.55), r4(r*0.55)]]; } });
    if (style === 'rounded') b.block('cyl', [r4(hw + 0.012), 0, 0], [0.03, r4(r*0.5), r4(r*0.5)], {c:'#59626b', m:'steel', ax:'x', g:'wheel', name:'hub cap'});
    if (style === 'truck'){
      b.block('cyl', [r4(hw - 0.01), 0, 0], [0.04, r4(r*0.3), r4(r*0.3)], {c:'#4a4f55', m:'steel', ax:'x', g:'wheel', name:'hub centre'});
      for (var i = 0; i < 6; i++){ var a = i*Math.PI/3, rr = r*0.4; b.block('box', [r4(hw - 0.005), r4(Math.cos(a)*rr), r4(Math.sin(a)*rr)], [0.03, r4(r*0.07), r4(r*0.07)], {c:'#2f3338', m:'steel', g:'wheel', name:'wheel nut'}); }
    }
    return keep;
  };
  /* the look stays when the wheel size changes: doc.setup.wheelLook */
  M.makeWheel = function(doc, r, w){ return K.wheelPieces(doc, r, w, doc && doc.setup && doc.setup.wheelLook); };
  K.setWheelLook = function(doc, style){ doc.setup.wheelLook = style === 'plain' ? undefined : style; if (!doc.setup.wheelLook) delete doc.setup.wheelLook; doc.pieces = M.makeWheel(doc, doc.setup.wheelR, doc.setup.wheelW); return doc; };

  /* ---------------------------------------------------------------- cabins (the content chat's cabin kit) */
  var DARK = '#2c2c30', DASH = '#34343a', TRIM = '#4a4640', CARPET = '#3a3733', LINER = '#b9b3a3';
  K.CABIN_COLOURS = {DARK:DARK, DASH:DASH, TRIM:TRIM, CARPET:CARPET, LINER:LINER};
  function sy(v){ return r4(v); }
  /* a steering wheel: a 10-sided rim and three spokes at right angles to the column, all pieces named 'steering wheel' (they turn with the steering) */
  function wheelRing(b, cx, cy, cz, phiDeg){
    var ph = phiDeg*Math.PI/180, n = [0, Math.cos(ph), Math.sin(ph)], v = [0, -Math.sin(ph), Math.cos(ph)], u = [1, 0, 0], Ro = 0.19, Ri = 0.158, th = 0.026, N = 10, i;
    function P(R, t){ return [cx + R*(Math.cos(t)*u[0] + Math.sin(t)*v[0]) - n[0]*th/2, cy + R*(Math.cos(t)*u[1] + Math.sin(t)*v[1]) - n[1]*th/2, cz + R*(Math.cos(t)*u[2] + Math.sin(t)*v[2]) - n[2]*th/2]; }
    var o = {fitting:true, c:DARK, m:'rubber', name:'steering wheel'}, d = [n[0]*th, n[1]*th, n[2]*th];
    for (i = 0; i < N; i++){ var t0 = i*2*Math.PI/N, t1 = (i + 1)*2*Math.PI/N; K.quad(b, [P(Ro, t0), P(Ro, t1), P(Ri, t1), P(Ri, t0)], d, Object.assign({}, o)); }
    [Math.PI/2, Math.PI*7/6, Math.PI*11/6].forEach(function(t){ K.quad(b, [P(0.03, t - 0.2), P(0.03, t + 0.2), P(Ri + 0.012, t + 0.07), P(Ri + 0.012, t - 0.07)], d, Object.assign({}, o, {c:DASH})); });
    b.block('box', [cx, cy, cz], [0.1, 0.04, 0.1], {fitting:true, c:DASH, m:'plastic', rot:[phiDeg, 0, 0], name:'steering wheel'});
  }
  /* dashboard with vents, glovebox, centre stack and round gauges; the wheel, column, and the points steer.wheel and cabin.eye */
  K.driverKit = function(b, o){
    var hw = o.hw, belt = o.belt, zF = o.cabF, dx = o.driverX == null ? 0.4 : o.driverX, seatY = o.seatY, dep = o.dashDepth || 0.38, top = o.dashTop || belt + 0.02, rake = o.rake == null ? -62 : o.rake;
    var F = function(c, name){ return {c:c, name:name, fitting:true, m:'plastic'}; };
    b.box([-hw + 0.08, top - 0.32, zF - dep], [hw - 0.08, top, zF - 0.01], F(DASH, 'dashboard'));
    b.box([-hw + 0.08, top - 0.05, zF - dep - 0.02], [hw - 0.08, top - 0.01, zF - dep], F('#2a2a30', 'dash pad lip'));
    b.box([dx - 0.27, top, zF - dep + 0.08], [dx + 0.27, top + 0.09, zF - dep + 0.3], F(DARK, 'instrument binnacle'));
    [-0.12, 0.12].forEach(function(gx, i){
      b.block('cyl', [dx + gx, top + 0.045, zF - dep + 0.075], [0.12, 0.12, 0.012], {fitting:true, c:'#9aa3a8', m:'plastic', ax:'z', name:'gauge ring'});
      b.block('cyl', [dx + gx, top + 0.045, zF - dep + 0.07], [0.1, 0.1, 0.012], {fitting:true, c:i ? '#d8dee2' : '#e6e0c8', m:'plastic', ax:'z', name:'gauge face'});
      b.box([dx + gx - 0.004, top + 0.045, zF - dep + 0.062], [dx + gx + 0.004, top + 0.085, zF - dep + 0.07], F('#c0392b', 'gauge needle')); });
    b.box([-0.14, top - 0.34, zF - dep - 0.07], [0.14, top - 0.04, zF - dep + 0.02], F('#26262b', 'centre stack'));
    b.box([-0.11, top - 0.14, zF - dep - 0.075], [0.11, top - 0.06, zF - dep - 0.07], F('#5a636b', 'radio'));
    b.box([-0.11, top - 0.26, zF - dep - 0.075], [0.11, top - 0.18, zF - dep - 0.07], F('#3d4349', 'climate panel'));
    [dx + 0.42, 0.62, -0.62].forEach(function(vx){ b.box([vx - 0.09, top - 0.09, zF - dep - 0.02], [vx + 0.09, top - 0.04, zF - dep], F('#1a1b1f', 'vent')); });
    b.box([0.25, top - 0.29, zF - dep - 0.015], [0.72, top - 0.1, zF - dep], F('#3d3d46', 'glovebox'));
    var wz = zF - dep - 0.18, wy = top - 0.1, ph = rake - 4;
    b.box([dx - 0.025, wy - 0.08, wz + 0.04], [dx + 0.025, wy + 0.05, zF - dep + 0.05], F(DARK, 'steering column'));
    wheelRing(b, dx, wy + 0.03, wz, ph);
    b.point('steer.wheel', 'hinge', [dx, sy(wy + 0.03), sy(wz)], [0, 0.4, -0.9]);
    b.point('cabin.eye', 'eye', [dx, sy(o.roof ? Math.min(seatY + 0.66, o.roof - 0.3) : seatY + 0.66), sy(wz - 0.42)], [0, -0.06, 1]);
  };
  /* a seat: pedestal, cushion (the Seat job), backrest, bolsters and headrest */
  K.seat = function(b, o, x, z, w, name, floorTop){
    b.box([x - 0.1, floorTop, z - 0.1], [x + 0.1, o.seatY - 0.06, z + 0.1], {fitting:true, c:TRIM, m:'plastic', name:'seat rail'});
    var sc = o.seatC || '#4a4a44'; b.seat([x, o.seatY, z], {size:[w, 0.12, 0.5], c:sc, name:name});
    b.block('box', [x, o.seatY + 0.33, z - 0.33], [w, 0.55, 0.1], {fitting:true, c:sc, m:'cloth', rot:[-9, 0, 0], name:name + ' back'});
    [-1, 1].forEach(function(k){ b.box([x + k*w/2 - 0.03, o.seatY, z - 0.25], [x + k*w/2 + 0.03, o.seatY + 0.14, z + 0.25], {fitting:true, c:sc, m:'cloth', name:name + ' bolster'}); });
    b.block('box', [x, o.seatY + 0.69, z - 0.37], [0.24, 0.13, 0.08], {fitting:true, c:sc, m:'cloth', rot:[-9, 0, 0], name:name + ' headrest'});
  };
  /* the cabin of a car or pickup inside its body. o: hw (half the inside width), cabF (z of the windscreen foot), cabB (z of the back of the cabin),
     g (z of the underside), belt (window sill height), roof (inside of the roof), seatY (cushion height), rear [z of each rear seat], driverX */
  K.carCabin = function(b, o){
    var hw = o.hw, belt = o.belt, roof = o.roof, zF = o.cabF, zB = o.cabB, g = o.g, floorTop = g + 0.28;
    b.box([-hw + 0.08, g + 0.22, zB + 0.04], [hw - 0.08, floorTop, zF - 0.02], {fitting:true, c:CARPET, m:'cloth', name:'floor carpet'});
    b.box([-hw + 0.1, roof - 0.14, zB + 0.05], [hw - 0.1, roof - 0.1, o.headF == null ? zF - 0.02 : o.headF], {fitting:true, c:LINER, m:'cloth', name:'headliner'});
    b.box([hw - 0.12, g + 0.3, zB + 0.1], [hw - 0.07, belt + 0.02, zF - 0.1], {fitting:true, c:TRIM, m:'plastic', mx:true, name:'door card'});
    b.box([hw - 0.2, belt - 0.2, zB + 0.35], [hw - 0.1, belt - 0.12, zF - 0.45], {fitting:true, c:DASH, m:'plastic', mx:true, name:'door armrest'});
    b.box([hw - 0.14, belt - 0.12, zF - 0.55], [hw - 0.1, belt - 0.02, zF - 0.4], {fitting:true, c:'#8a8f94', m:'plastic', mx:true, name:'door handle inner'});
    b.box([-0.1, floorTop, zF - 0.95], [0.1, floorTop + 0.22, zF - 0.1], {fitting:true, c:DASH, m:'plastic', name:'centre console'});
    b.block('cyl', [0, floorTop + 0.34, zF - 0.55], [0.05, 0.2, 0.05], {fitting:true, c:DARK, m:'plastic', name:'gear lever'});
    K.driverKit(b, o);
    var sz = zF - 0.78, dx = o.driverX == null ? 0.4 : o.driverX;
    K.seat(b, o, dx, sz, 0.5, 'driver seat', floorTop); K.seat(b, o, -dx, sz, 0.5, 'passenger seat', floorTop);
    (o.rear || []).forEach(function(z, i){ K.seat(b, o, i % 2 ? -dx : dx, z, 0.5, 'rear seat ' + (i + 1), floorTop); });
    return b.made;
  };
  /* a hollow truck, van or motorhome cab between zB (back wall) and zF (windscreen): floor, skins, back wall, roof, A pillars, windscreen,
     doors with their own glass, door cards, dashboard, wheel, console, two seats and cabin.eye. o: hw, zB, zF, fl (floor top), belt, roof, seatY, driverX, c */
  K.truckCab = function(b, o){
    var hw = o.hw, zB = o.zB, zF = o.zF, fl = o.fl, belt = o.belt, roof = o.roof, seatY = o.seatY || fl + 0.3, dx = o.driverX == null ? 0.45 : o.driverX, c = o.c || 'paint1';
    b.box([-hw + 0.1, fl - 0.12, zB], [hw - 0.1, fl - 0.05, zF], {fitting:true, c:'underside', m:'steel', name:'cab floor pan'});
    b.box([-hw + 0.08, fl - 0.05, zB + 0.05], [hw - 0.08, fl, zF - 0.02], {fitting:true, c:CARPET, m:'cloth', name:'floor carpet'});
    b.box([hw - 0.06, fl - 0.12, zB], [hw, belt, zF], {fitting:true, c:c, mx:true, name:'cab side skin'});
    b.box([-hw + 0.04, fl - 0.12, zB - 0.06], [hw - 0.04, roof - 0.1, zB], {fitting:true, c:c, name:'cab back wall'});
    b.box([hw - 0.07, belt, zF - 0.04], [hw - 0.01, roof - 0.1, zF + 0.1], {fitting:true, c:c, mx:true, name:'A pillar'});
    b.box([-hw + 0.02, roof - 0.1, zB - 0.06], [hw - 0.02, roof, zF + 0.12], {fitting:true, c:c, name:'cab roof'});
    b.box([-hw + 0.1, roof - 0.14, zB + 0.05], [hw - 0.1, roof - 0.1, o.headF == null ? zF - 0.02 : o.headF], {fitting:true, c:LINER, m:'cloth', name:'headliner'});
    b.box([-hw + 0.08, belt + 0.04, zF + 0.03], [hw - 0.08, roof - 0.1, zF + 0.07], {fitting:true, c:'glass', m:'glass', name:'windscreen'});
    b.box([hw - 0.12, fl + 0.05, zB + 0.1], [hw - 0.07, belt + 0.02, zF - 0.1], {fitting:true, c:TRIM, m:'plastic', mx:true, name:'door card'});
    var z0 = zB + 0.25, z1 = zF - 0.1;
    b.door([hw, fl - 0.1, z0], [hw + 0.05, belt, z1], {fitting:true, c:c, mx:true, hinge:'front', name:'cab door'});
    b.box([hw + 0.01, belt, z0 + 0.04], [hw + 0.04, roof - 0.12, z1 - 0.04], {fitting:true, c:'glass', m:'glass', mx:true, name:'cab door'});
    b.box([hw, roof - 0.12, z0], [hw + 0.05, roof - 0.1, z1], {fitting:true, c:c, mx:true, name:'cab door'});
    b.box([hw, belt, z0], [hw + 0.05, roof - 0.12, z0 + 0.04], {fitting:true, c:c, mx:true, name:'cab door'});
    b.box([-0.1, fl, zF - 1.05], [0.1, fl + 0.22, zF - 0.45], {fitting:true, c:DASH, m:'plastic', name:'centre console'});
    b.block('cyl', [0, fl + 0.34, zF - 0.7], [0.05, 0.2, 0.05], {fitting:true, c:DARK, m:'plastic', name:'gear lever'});
    K.driverKit(b, {hw:hw, belt:belt, cabF:zF, driverX:dx, seatY:seatY, dashDepth:0.42, dashTop:belt + 0.02});
    var sz = zF - 1.0;
    K.seat(b, {seatY:seatY}, dx, sz, 0.5, 'driver seat', fl); K.seat(b, {seatY:seatY}, -dx, sz, 0.5, 'passenger seat', fl);
    return b.made;
  };
  /* good starting settings for a cabin from a body already drawn (its glass gives the windscreen foot and the cabin's back) */
  K.cabinGuess = function(doc){
    var body = [];
    doc.pieces.forEach(function(p){ if (p.g === 'body' && !p.hidden && !p.fitting) body = body.concat(M.toNative(p)); });
    var B = M.boundsOf(body), glass = [];
    doc.pieces.forEach(function(p){ if (p.g === 'body' && (p.m === 'glass' || /^glass/.test(p.c || ''))) glass = glass.concat(M.toNative(p)); });
    var G = M.boundsOf(glass);
    if (!B.ok) B = {mn:[-0.9, 0.3, -2.2], mx:[0.9, 1.45, 2.2]};
    var hw = r4(Math.max(0.5, Math.max(-B.mn[0], B.mx[0]) - 0.06)), roof = r4(B.mx[1] - 0.04);
    var belt = G.ok ? r4(G.mn[1]) : r4(B.mn[1] + (B.mx[1] - B.mn[1])*0.6);
    var cabF = G.ok ? r4(Math.min(B.mx[2] - 0.8, G.mx[2] - 0.15)) : r4(B.mx[2]*0.35), cabB = G.ok ? r4(Math.max(B.mn[2] + 0.4, G.mn[2])) : r4(B.mn[2]*0.5);
    var g = r4(Math.max(0.12, B.mn[1] + 0.05)), seatY = r4(g + 0.28 + 0.2);
    return {hw:hw, cabF:cabF, cabB:cabB, g:g, belt:belt, roof:roof, seatY:seatY, rear:cabF - cabB > 1.8 ? [r4(cabF - 1.7), r4(cabF - 1.7)] : []};
  };

  /* ---------------------------------------------------------------- smooth cages (bodies and animals) */
  function newell(V, f){ var n = [0, 0, 0]; for (var i = 0; i < f.length; i++){ var a = V[f[i]], b = V[f[(i + 1) % f.length]]; n[0] += (a[1] - b[1])*(a[2] + b[2]); n[1] += (a[2] - b[2])*(a[0] + b[0]); n[2] += (a[0] - b[0])*(a[1] + b[1]); }
    var l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0]/l, n[1]/l, n[2]/l]; }
  K.faceNormal = newell;
  /* the volume inside a closed cage (negative when its faces wind inwards) */
  K.cageVolume = function(V, F){ var s = 0; F.forEach(function(f){ for (var i = 1; i < f.length - 1; i++){ var a = V[f[0]], b = V[f[i]], c = V[f[i + 1]];
    s += (a[0]*(b[1]*c[2] - b[2]*c[1]) - a[1]*(b[0]*c[2] - b[2]*c[0]) + a[2]*(b[0]*c[1] - b[1]*c[0]))/6; } }); return s; };
  /* pull a new section out of face fi by h along its normal (Blender's extrude): the face moves out and four sides join it to where it was */
  K.extrudeFace = function(V, F, fi, h){
    var f = F[fi], n = newell(V, f), base = V.length, nf = f.map(function(_, i){ return base + i; });
    f.forEach(function(i){ var q = V[i]; V.push([r4(q[0] + n[0]*h), r4(q[1] + n[1]*h), r4(q[2] + n[2]*h)]); });
    var sides = f.map(function(a, i){ var j = (i + 1) % f.length; return [a, f[j], nf[j], nf[i]]; });   /* each side shares its edges the other way round from its neighbours */
    F[fi] = nf; Array.prototype.push.apply(F, sides);
    return fi;
  };
  /* a smooth cage from a block, soft block, tube or shaped piece, in the same place: the start of a body or an animal */
  K.cageFrom = function(p){
    var V, F, c;
    if (p.s === 'box' || p.s === 'bev' || p.s === 'wedge' || p.s === 'cyl'){ var d = p.d || [0.4, 0.3, 0.4], x = d[0]/2, y = d[1]/2, z = d[2]/2;
      c = M.SHAPES.cage.make(); V = c.v.map(function(q){ return [r4(Math.sign(q[0])*x), r4(Math.sign(q[1])*y), r4(Math.sign(q[2])*z)]; }); F = c.f; }
    else if (p.s === 'loft' && p.r && p.r.length >= 2){
      var ax = p.ax || 'y', A = ax === 'z' ? {a:0, b:1} : ax === 'x' ? {a:2, b:1} : {a:0, b:2}, n = Math.max(3, Math.min(16, p.n || 8)), rings = [];
      V = []; F = [];
      p.r.forEach(function(r){ var tip = !(r[3] > 1e-4 || r[4] > 1e-4), ids = [];
        if (tip) { V.push([r4(r[0]), r4(r[1]), r4(r[2])]); for (var t = 0; t < n; t++) ids.push(V.length - 1); }
        else for (var k = 0; k < n; k++){ var t2 = k/n*Math.PI*2, q = [r[0], r[1], r[2]]; q[A.a] += Math.cos(t2)*r[3]; q[A.b] += Math.sin(t2)*r[4]; V.push(q.map(r4)); ids.push(V.length - 1); }
        rings.push({ids:ids, tip:tip}); });
      for (var i = 0; i < rings.length - 1; i++){ var R0 = rings[i], R1 = rings[i + 1];
        for (var k2 = 0; k2 < n; k2++){ var a = R0.ids[k2], b = R0.ids[(k2 + 1) % n], cc = R1.ids[(k2 + 1) % n], dd = R1.ids[k2], q4 = [a, b, cc, dd].filter(function(v, j, L){ return L.indexOf(v) === j; });
          if (q4.length >= 3) F.push(q4); } }
      if (!rings[0].tip) F.push(rings[0].ids.slice().reverse());
      if (!rings[rings.length - 1].tip) F.push(rings[rings.length - 1].ids.slice());
    }
    else if (p.s === 'poly' && p.v && p.f){ V = p.v.map(function(q){ return q.slice(); }); F = p.f.map(function(f){ return f.slice(); }); }
    else return null;
    if (K.cageVolume(V, F) < 0) F = F.map(function(f){ return f.slice().reverse(); });
    var out = {s:'cage', sub:2, v:V, f:F};
    var keep = ['id', 'g', 'pos', 'rot', 'scl', 'c', 'm', 'name', 'fn', 'mx', 'mz', 'hidden', 'fitting', 'glow', 'kit'];
    keep.forEach(function(k){ if (p[k] !== undefined) out[k] = clone(p[k]); });
    return out;
  };

  M.kit = K;
  if (node) module.exports = K; else root.WSK = K;
})(typeof window !== 'undefined' ? window : this);
