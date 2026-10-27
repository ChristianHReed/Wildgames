/* AfterStreet Workshop: the asset model.
   An editable design (a "doc") is a list of pieces with free transforms, symmetry, materials and function tags.
   It turns into the game's own shaped pieces (assets/shaped/shapes.js format) exactly as the design chat writes them,
   so the game, the Maps Builder and the album draw a Workshop car with the code they already have.
   Works in the browser (window.WSM) and in Node (module.exports); needs SHAPED (shapes.js) loaded first.

   Coordinates: metres, Y up, the car faces +Z, its right side is +X (as every shaped pack).

   Editor piece:
     {id, g, s, pos:[x,y,z], rot:[rx,ry,rz] degrees (applied X, then Y, then Z), scl:[sx,sy,sz],
      c colour, glow, mx (mirror across the left/right plane), mz (mirror across the front/back plane),
      m material, fn function tag, name,
      shape data: d [w,h,d] (box, bev, wedge, cyl) + fy (wedge upside down) + ax (cyl axis),
                  r rings + ax + n/rot/ang/closed/caps/both/cin (loft), v + f (poly), v + n + both (decal)}
   g (group): body, bonnet, boot, wheel. Bonnet and boot pieces open on their hinges; the wheel is one wheel at the origin,
   drawn at every wheel point of the rig (turned half a turn on the left side, as the stock cars). */
(function(root){
  var SH = (typeof SHAPED !== 'undefined') ? SHAPED : (typeof window !== 'undefined' ? window.SHAPED : null);
  var M = {};
  M.VERSION = '0.1.0';
  M.setShaped = function(s){ SH = s; };

  /* ------------------------------------------------------------------ small maths */
  var D2R = Math.PI/180;
  function r4(v){ return Math.round(v*1e4)/1e4; }
  function v3r(a){ return [r4(a[0]), r4(a[1]), r4(a[2])]; }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  M.clone = clone;
  function rotMat(rot){   /* X, then Y, then Z:  R = Rz * Ry * Rx */
    var x = (rot[0]||0)*D2R, y = (rot[1]||0)*D2R, z = (rot[2]||0)*D2R;
    var cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
    var Rx = [1,0,0, 0,cx,-sx, 0,sx,cx], Ry = [cy,0,sy, 0,1,0, -sy,0,cy], Rz = [cz,-sz,0, sz,cz,0, 0,0,1];
    return mul3(Rz, mul3(Ry, Rx));
  }
  function mul3(a, b){ var o = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) o[i*3+j] = a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j]; return o; }
  function app3(m, v){ return [m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2]]; }
  function norm(v){ var l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; }
  M.rotMat = rotMat; M.app3 = app3;
  function isQuarterY(rot){ var a = rot[0]||0, b = rot[1]||0, c = rot[2]||0;
    return Math.abs(a) < 1e-6 && Math.abs(c) < 1e-6 && Math.abs(b/90 - Math.round(b/90)) < 1e-6; }
  function q4(k){ return ((Math.round(k)%4)+4)%4; }

  /* ------------------------------------------------------------------ shapes the Workshop can add */
  /* default sizes are a hand's breadth to a door's width, ready to be stretched */
  M.SHAPES = {
    box:   {label:'Block',      make:function(){ return {s:'box', d:[0.4,0.2,0.4]}; }},
    bev:   {label:'Soft block', make:function(){ return {s:'bev', d:[0.4,0.2,0.4]}; }},
    wedge: {label:'Slope',      make:function(){ return {s:'wedge', d:[0.4,0.2,0.4]}; }},
    cyl:   {label:'Cylinder',   make:function(){ return {s:'cyl', d:[0.2,0.2,0.2], ax:'y'}; }},
    tube:  {label:'Tube',       make:function(){ return {s:'loft', ax:'z', n:8, r:[[0,0,-0.2,0.1,0.1],[0,0,0.2,0.1,0.1]]}; }},
    cone:  {label:'Cone',       make:function(){ return {s:'loft', ax:'y', n:8, r:[[0,-0.15,0,0.12,0.12],[0,0.15,0,0,0]]}; }},
    plate: {label:'Plate',      make:function(){ return {s:'decal', v:[[-0.2,-0.1,0],[0.2,-0.1,0],[0.2,0.1,0],[-0.2,0.1,0]], n:[0,0,1]}; }}
  };
  M.SHAPE_ORDER = ['box','bev','wedge','cyl','tube','cone','plate'];

  /* materials: how a piece breaks, what it salvages into and what it costs to build */
  M.MATERIALS = {
    sheet:   {label:'Sheet metal', dent:1,   scrapPerM2:0.8},
    steel:   {label:'Heavy steel', dent:0.4, scrapPerM2:1.6},
    glass:   {label:'Glass',       dent:0,   glassPerM2:2},
    chrome:  {label:'Chrome trim', dent:0.7, scrapPerM2:0.5},
    rubber:  {label:'Rubber',      dent:0.2},
    plastic: {label:'Plastic',     dent:0.5, plasticPerM2:1},
    lamp:    {label:'Lamp',        dent:0},
    cloth:   {label:'Cloth/seat',  dent:0.3, clothPerM2:1},
    wood:    {label:'Wood',        dent:0.3, woodPerM2:1.5}
  };
  M.guessMaterial = function(c){
    c = String(c || '');
    if (/^glass|lanternGlass/.test(c)) return 'glass';
    if (/^(head|tail|lamp|lit|lens|amberOn|redOn|flare)/.test(c)) return 'lamp';
    if (/^(tyre|rubber)/.test(c)) return 'rubber';
    if (/^chrome/.test(c)) return 'chrome';
    if (/^(underside|steel|metal|hub|rust|gunMetal)/.test(c)) return 'steel';
    if (/^(seat|fabric|cloth|blanket)/.test(c)) return 'cloth';
    if (/^(plastic|black|plateW|plate)/.test(c)) return 'plastic';
    if (/^(wood|plank|log)/.test(c)) return 'wood';
    return 'sheet';
  };

  /* function tags: the parts that make a car work. The game reads them from the asset (asset.functions). */
  M.FUNCTIONS = {
    seat:      {label:'Seat',        hint:'one person rides here (mirrored seats count twice); the first is the driver'},
    engine:    {label:'Engine',      hint:'needed to drive; its size sets the power'},
    tank:      {label:'Fuel tank',   hint:'sets how far a full tank goes'},
    storage:   {label:'Storage',     hint:'cargo space: boot, bed, roof box'},
    sleep:     {label:'Sleeping spot', hint:'somewhere to sleep (bed, rear bench)'},
    headlight: {label:'Headlight',   hint:'throws light forward at night'},
    taillight: {label:'Tail light',  hint:'glows red at the back'},
    battery:   {label:'Battery',     hint:'salvages as a car battery'}
  };

  M.GROUPS = ['body','bonnet','boot','wheel'];

  /* ------------------------------------------------------------------ new docs */
  var NID = 1;
  M.newId = function(doc){ var n = 1; if (doc) doc.pieces.forEach(function(p){ var k = +String(p.id).slice(1); if (k >= n) n = k + 1; }); return 'p' + Math.max(n, NID++); };
  M.blankDoc = function(){
    var d = {format:'afterstreet-workshop', v:1, type:'vehicle', id:'my_car', name:'My car', author:'', licence:'MIT', notes:'',
      cls:'car', colours:{}, paint:{paint1:'#7a2a24', paint2:'#c9c3b6', paint3:'#3e5a7a'},
      pieces:[], states:{},
      setup:{wheelR:0.32, wheelW:0.2, track:0.78, axles:[1.4, -1.4], archClear:0.12, bed:null, tank:'medium', topSpeed:85},
      dmg:{seed:7, strength:1}};
    d.pieces = M.makeWheel(d, 0.32, 0.2);
    return d;
  };
  /* a plain wheel like the design chat's: a chamfered 8-sided tyre and a 6-sided hub, axis X, outer face +X */
  M.makeWheel = function(doc, r, w){
    var keep = doc.pieces.filter(function(p){ return p.g !== 'wheel'; });
    var hw = w/2;
    var tyre = {id:M.newId({pieces:keep}), g:'wheel', s:'loft', ax:'x', pos:[0,0,0], rot:[0,0,0], scl:[1,1,1], c:'tyre', m:'rubber', name:'tyre',
      r:[[-hw,0,0,r*0.88,r*0.88],[-hw+0.03,0,0,r,r],[hw-0.03,0,0,r,r],[hw,0,0,r*0.88,r*0.88]]};
    keep.push(tyre);
    var hub = {id:M.newId({pieces:keep}), g:'wheel', s:'loft', ax:'x', n:6, pos:[0,0,0], rot:[0,0,0], scl:[1,1,1], c:'hub', m:'steel', name:'hub',
      r:[[-hw-0.006,0,0,r*0.6,r*0.6],[hw+0.006,0,0,r*0.6,r*0.6]]};
    keep.push(hub);
    return keep;
  };
  M.addPiece = function(doc, shapeKey, at, extra){
    var sp = M.SHAPES[shapeKey].make();
    var p = {id:M.newId(doc), g:'body', pos:(at || [0,0.5,0]).slice(), rot:[0,0,0], scl:[1,1,1], c:'paint1', m:'sheet'};
    for (var k in sp) p[k] = sp[k];
    if (extra) for (var k2 in extra) p[k2] = extra[k2];
    doc.pieces.push(p);
    return p;
  };

  /* ------------------------------------------------------------------ editor piece -> game pieces */
  function loftScale(r, ax, s){
    /* ring radii: ax y -> a along X, b along Z; ax z -> a along X, b along Y; ax x -> a along Z, b along Y. d (corner shift) runs along the axis */
    var ia = ax === 'x' ? 2 : 0, ib = ax === 'y' ? 2 : 1, iax = ax === 'x' ? 0 : ax === 'y' ? 1 : 2;
    return r.map(function(q){
      var o = [q[0]*s[0], q[1]*s[1], q[2]*s[2], q[3]*s[ia], q[4]*s[ib]];
      if (q.length > 5) o.push(q[5]);
      if (q.length > 6) o.push(q[6] == null ? null : (typeof q[6] === 'number' ? q[6]*s[iax] : q[6].map(function(t){ return t*s[iax]; })));
      return o;
    });
  }
  var GEO = ['d','fy','ax','r','n','lrot','ang','closed','caps','both','cin','v','f'];   /* a loft's ring turn 'rot' is kept as 'lrot' in the editor, since rot is the piece's rotation */
  /* the piece's own shape at the origin, with its scale folded in */
  function localNative(ep){
    var o = {s:ep.s, p:[0,0,0]}, s = ep.scl || [1,1,1];
    GEO.forEach(function(k){ if (ep[k] !== undefined && ep[k] !== null) o[k === 'lrot' ? 'rot' : k] = clone(ep[k]); });
    if (o.s === 'loft') o.r = loftScale(o.r, o.ax || 'y', s);
    else if (o.s === 'poly') o.v = o.v.map(function(v){ return [v[0]*s[0], v[1]*s[1], v[2]*s[2]]; });
    else if (o.s === 'decal'){ o.v = o.v.map(function(v){ return [v[0]*s[0], v[1]*s[1], v[2]*s[2]]; }); var n = o.n || [0,0,1]; o.n = norm([n[0]/(s[0]||1), n[1]/(s[1]||1), n[2]/(s[2]||1)]); }
    else o.d = [o.d[0]*s[0], o.d[1]*s[1], o.d[2]*s[2]];
    return o;
  }
  /* the faces of a game piece in model space: [{pts:[[x,y,z],...], n:[...]}] (the same faces shapes.js draws) */
  var WHITE = function(){ return [1,1,1]; };
  M.faces = function(pc){
    var m = SH.buildIndexed([pc], WHITE), out = [], i = 0, idx = m.idx;
    while (i < idx.length){
      var b = idx[i], last = idx[i+2];
      while (i + 3 < idx.length && idx[i+3] === b){ i += 3; last = idx[i+2]; }
      i += 3;
      var pts = []; for (var k = b; k <= last; k++) pts.push([m.pos[k*3], m.pos[k*3+1], m.pos[k*3+2]]);
      out.push({pts:pts, n:[m.nor[b*3], m.nor[b*3+1], m.nor[b*3+2]]});
    }
    return out;
  };
  var CONVEX = {box:1, bev:1, wedge:1, cyl:1, poly:1};
  /* bake any shape through a point transform: one solid poly for convex shapes, else one decal per face */
  M.bakePiece = function(pc, fn, nfn, keepConvex){
    var F = M.faces(pc), out;
    if (CONVEX[pc.s] && keepConvex !== false){
      var V = [], key = {}, f = [], c = [0,0,0], all = [];
      F.forEach(function(fc){ f.push(fc.pts.map(function(q){ var t = fn(q); all.push(t); return t; })); });
      all.forEach(function(t){ c[0] += t[0]/all.length; c[1] += t[1]/all.length; c[2] += t[2]/all.length; });
      c = v3r(c);
      var faces = f.map(function(fc){ return fc.map(function(t){ var q = v3r([t[0]-c[0], t[1]-c[1], t[2]-c[2]]), k = q.join(','); if (key[k] == null){ key[k] = V.length; V.push(q); } return key[k]; }); });
      faces = faces.filter(function(fc){ var u = {}; fc.forEach(function(k){ u[k] = 1; }); return Object.keys(u).length >= 3; });
      out = [{s:'poly', p:c, v:V, f:faces}];
    } else {
      out = F.map(function(fc){
        var P = fc.pts.map(fn), c = [0,0,0];
        P.forEach(function(t){ c[0] += t[0]/P.length; c[1] += t[1]/P.length; c[2] += t[2]/P.length; });
        c = v3r(c);
        return {s:'decal', p:c, v:P.map(function(t){ return v3r([t[0]-c[0], t[1]-c[1], t[2]-c[2]]); }), n:v3r(norm(nfn ? nfn(fc.n, fc.pts) : fc.n))};
      });
    }
    out.forEach(function(o){ o.c = pc.c; if (pc.glow) o.glow = true; if (pc._m) o._m = pc._m; });
    return out;
  };
  function mirrorAngles(pc){ var n = pc.n || 8, rot = pc.rot != null ? pc.rot : 180/n, A = pc.ang; if (!A){ A = []; for (var k = 0; k < n; k++) A.push(rot + k*360/n); } return A.map(function(t){ return r4(180 - t); }); }
  /* mirror a game piece across x = 0 */
  M.mirrorX = function(pc){
    var q = clone(pc);
    q.p = [-pc.p[0], pc.p[1], pc.p[2]];
    if (pc.ry) q.ry = q4(4 - pc.ry); if (!q.ry) delete q.ry;
    if (q.s === 'poly') q.v = q.v.map(function(v){ return [-v[0], v[1], v[2]]; });
    else if (q.s === 'decal'){ q.v = q.v.map(function(v){ return [-v[0], v[1], v[2]]; }); q.n = [-(q.n||[0,0,1])[0], (q.n||[0,0,1])[1], (q.n||[0,0,1])[2]]; }
    else if (q.s === 'loft'){
      var ax = q.ax || 'y';
      if (ax === 'x') q.r = q.r.map(function(r){ var o = r.slice(); o[0] = -o[0]; if (o.length > 6 && o[6] != null) o[6] = typeof o[6] === 'number' ? -o[6] : o[6].map(function(t){ return -t; }); return o; });
      else { q.r = q.r.map(function(r){ var o = r.slice(); o[0] = -o[0]; return o; }); q.ang = mirrorAngles(pc); delete q.rot; delete q.n; }
    }
    return q;
  };
  /* mirror across z = 0: turn half a turn about Y, then mirror across x = 0 */
  M.mirrorZ = function(pc){
    var t = clone(pc);
    t.p = [-pc.p[0], pc.p[1], -pc.p[2]]; t.ry = q4((pc.ry || 0) + 2); if (!t.ry) delete t.ry;
    return M.mirrorX(t);
  };
  /* one editor piece -> the game pieces it stands for (1, 2 or 4 with symmetry) */
  M.toNative = function(ep){
    var base = localNative(ep), out;
    if (isQuarterY(ep.rot || [0,0,0])){
      out = base; out.p = v3r(ep.pos); var k = q4((ep.rot ? ep.rot[1] : 0)/90); if (k) out.ry = k;
      out.c = ep.c; if (ep.glow) out.glow = true;
      out = [out];
    } else {
      var R = rotMat(ep.rot), P = ep.pos;
      out = M.bakePiece(base, function(q){ var t = app3(R, q); return [t[0]+P[0], t[1]+P[1], t[2]+P[2]]; }, function(n){ return app3(R, n); });
      out.forEach(function(o){ o.c = ep.c; if (ep.glow) o.glow = true; });
    }
    if (ep.mx) out = out.concat(out.map(M.mirrorX));
    if (ep.mz) out = out.concat(out.map(M.mirrorZ));
    var mat = ep.m || M.guessMaterial(ep.c);
    out.forEach(function(o){ tidy(o); o._m = mat; });
    return out;
  };
  function tidy(o){
    if (o.d) o.d = v3r(o.d);
    if (o.v && o.s !== 'poly' && o.s !== 'decal') delete o.v;
    if (o.v) o.v = o.v.map(v3r);
    if (o.r) o.r = o.r.map(function(r){ return r.map(function(x){ return typeof x === 'number' ? r4(x) : x; }); });
    if (o.p) o.p = v3r(o.p);
    return o;
  }
  /* all game pieces of one group */
  M.groupNative = function(doc, g){ var out = []; doc.pieces.forEach(function(p){ if (p.g === g) out = out.concat(M.toNative(p)); }); return out; };

  /* a game piece -> an editor piece (for opening the design chat's cars and packs without a Workshop source) */
  M.fromNative = function(np, g, doc){
    var ep = {id:M.newId(doc), g:g || 'body', pos:np.p.slice(), rot:[0, (np.ry||0)*90, 0], scl:[1,1,1], c:np.c, m:M.guessMaterial(np.c)};
    GEO.forEach(function(k){ var src = k === 'lrot' ? 'rot' : k; if (np[src] !== undefined) ep[k] = clone(np[src]); });
    ep.s = np.s; if (np.glow) ep.glow = true;
    if (doc) doc.pieces.push(ep);
    return ep;
  };

  /* ------------------------------------------------------------------ measuring */
  function boundsOf(pcs){
    var mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9], pts = [];
    pcs.forEach(function(pc){ M.faces(pc).forEach(function(f){ f.pts.forEach(function(q){ pts.push(q); for (var i = 0; i < 3; i++){ if (q[i] < mn[i]) mn[i] = q[i]; if (q[i] > mx[i]) mx[i] = q[i]; } }); }); });
    return {mn:mn, mx:mx, pts:pts, ok:pts.length > 0};
  }
  M.boundsOf = boundsOf;
  function area(pts){ var n = [0,0,0]; for (var i = 0; i < pts.length; i++){ var a = pts[i], b = pts[(i+1)%pts.length]; n[0] += (a[1]-b[1])*(a[2]+b[2]); n[1] += (a[2]-b[2])*(a[0]+b[0]); n[2] += (a[0]-b[0])*(a[1]+b[1]); } return Math.sqrt(n[0]*n[0]+n[1]*n[1]+n[2]*n[2])/2; }
  M.area = area;

  /* the car's measurements, as props.js vehicleSpec (the vehicle kit works its mounts out from these) */
  M.spec = function(doc, nat){
    var S = doc.setup, body = nat.body, all = body.concat(nat.bonnet, nat.boot), B = boundsOf(all);
    if (!B.ok) B = {mn:[-0.9,0.3,-2.2], mx:[0.9,1.4,2.2], pts:[]};
    var nose = B.mx[2], tail = B.mn[2], top = B.mx[1], halfW = 0;
    /* width from the bigger pieces only: wing mirrors and handles stick out past the body */
    all.forEach(function(pc){ var b = boundsOf([pc]); if (!b.ok) return; var vol = (b.mx[0]-b.mn[0])*(b.mx[1]-b.mn[1])*(b.mx[2]-b.mn[2]); if (vol >= 0.004) halfW = Math.max(halfW, -b.mn[0], b.mx[0]); });
    if (!halfW) halfW = Math.max(-B.mn[0], B.mx[0]);
    var roofPts = B.pts.filter(function(q){ return q[1] >= top - 0.04; });
    var rx = 0, rz0 = 1e9, rz1 = -1e9; roofPts.forEach(function(q){ rx = Math.max(rx, Math.abs(q[0])); rz0 = Math.min(rz0, q[2]); rz1 = Math.max(rz1, q[2]); });
    if (!roofPts.length){ rx = halfW*0.8; rz0 = -0.6; rz1 = 0.6; }
    var glass = []; doc.pieces.forEach(function(p){ if (p.g === 'body' && (p.m === 'glass' || /^glass/.test(p.c))) glass = glass.concat(M.toNative(p)); });
    var G = boundsOf(glass), gf = null, cb = null;
    if (G.ok){ var gt = G.mx[1]; var hi = G.pts.filter(function(q){ return q[1] >= gt - 0.06; }); gf = -1e9; hi.forEach(function(q){ gf = Math.max(gf, q[2]); }); cb = G.mn[2]; }
    var bon = boundsOf(nat.bonnet), hood;
    if (bon.ok) hood = bon.mx[1];
    else { hood = 0; B.pts.forEach(function(q){ if (q[2] > nose - 0.6) hood = Math.max(hood, q[1]); }); }
    var fr = B.pts.filter(function(q){ return q[2] > nose - 0.06; }), fy0 = 1e9, fy1 = -1e9; fr.forEach(function(q){ fy0 = Math.min(fy0, q[1]); fy1 = Math.max(fy1, q[1]); });
    var sp = {length:r4(nose - tail), width:r4(halfW*2), wheelR:S.wheelR, wheelW:S.wheelW, axles:S.axles.slice(), track:S.track, archClear:S.archClear,
      ground:r4(B.mn[1]), roof:{y:r4(top), z:r4((rz0 + rz1)/2), w:r4(rx*2), d:r4(Math.max(0.2, rz1 - rz0))},
      hood:r4(hood), nose:r4(nose), tail:r4(tail), bumperY:r4(fr.length ? (fy0 + fy1)/2 : 0.5)};
    if (gf != null){ sp.glassFront = r4(gf); sp.cabBack = r4(cb); }
    if (S.bed) sp.bed = {y:S.bed.y, z:S.bed.z, w:S.bed.w, d:S.bed.d};
    return sp;
  };
  /* the rig: wheel points, hinges and where smoke rises (props.js vehicleRig) */
  M.rig = function(doc, nat, sp){
    var S = doc.setup, t = S.track, r = S.wheelR, a = S.axles;
    var rig = {wheels:[[-t, r, a[1]], [-t, r, a[0]], [t, r, a[1]], [t, r, a[0]]], wheelAxis:'x',
      wheelRule:'Place the wheel model at each position (turned half a turn on the left side), spin it about x; the bonnet opens about its hinge.'};
    var bo = boundsOf(nat.bonnet), bt = boundsOf(nat.boot);
    if (bo.ok){ rig.bonnetHinge = v3r([0, bo.mx[1], bo.mn[2]]); rig.bonnetAxis = 'x'; rig.smokeAt = v3r([0, bo.mx[1] + 0.08, (bo.mn[2] + bo.mx[2])/2]); }
    else rig.smokeAt = v3r([0, sp.hood + 0.08, sp.nose - 0.7]);
    if (bt.ok){ rig.bootHinge = v3r([0, bt.mx[1], bt.mx[2]]); rig.bootAxis = 'x'; rig.bootRule = 'the boot lid opens upwards about its hinge (the edge nearest the cabin)'; }
    return rig;
  };
  /* the vehicle kit's mounts (a port of assets/shaped/src/kit_index.py car_mounts) */
  M.mounts = function(s){
    var W = s.width, L = s.length, r = s.wheelR, ro = s.roof, nose = s.nose, tail = s.tail, by = s.bumperY, Mt = {};
    Mt.roof = {pos:[0, ro.y, ro.z], w:r4(ro.w + 0.1), d:r4(ro.d + 0.3), group:'body'};
    Mt.roof_decal = {pos:[0, ro.y, ro.z], w:ro.w, d:r4(ro.d + 0.3), group:'body'};
    Mt.front = {pos:[0, by, nose], w:r4(W + 0.35), d:0, group:'body'};
    Mt.rear = {pos:[0, by, tail], w:r4(W + 0.35), d:0, group:'body'};
    var gf = s.glassFront;
    if (gf != null){ var hy = s.hood; Mt.hood = {pos:[0, hy, r4((nose + gf)/2 - 0.1)], w:r4(W*0.6), d:r4(nose - gf - 0.5), group:'bonnet'};
      Mt.pillar = {pos:[r4(W/2 - 0.1), hy, r4(gf + 0.1)], w:0.2, d:0.2, hMax:r4(ro.y - hy + 0.3), group:'body'}; }
    var cabBack = s.cabBack != null ? s.cabBack : -0.9, cabLen = Math.abs((gf != null ? gf : 0) - cabBack), sill = r4(2*r*0.8), zc = r4(((gf != null ? gf : 0) + cabBack)/2);
    Mt.side = {pos:[r4(W/2), sill, zc], w:0.4, d:r4(Math.min(cabLen + 1.0, L*0.5)), mirror:true, group:'body'};
    Mt.decal_side = {pos:[r4(W/2), r4(ro.y*0.55), zc], w:0.1, d:5, mirror:true, group:'body'};
    Mt.arch = {points:[], mirror:true, rCap:r4(r*1.6), group:'body'}; s.axles.forEach(function(z){ [1,-1].forEach(function(sx){ Mt.arch.points.push([r4(sx*W/2), r, z]); }); });
    Mt.flap = {points:[1,-1].map(function(sx){ return [r4(sx*(W/2 - 0.02)), 0.08, r4(s.axles[s.axles.length-1] - r - 0.12)]; }), mirror:true, group:'body'};
    if (s.bed){ Mt.bed = {pos:[0, s.bed.y, s.bed.z], w:s.bed.w, d:s.bed.d, group:'bed'};
      Mt.cab_back = {pos:[0, s.bed.y, cabBack], w:W, d:0.3, group:'body'};
      Mt.chassis_side = {pos:[r4(W/2 - 0.1), 0.3, s.axles[s.axles.length-1]], w:0.6, d:2.2, mirror:true, group:'body'}; }
    else if (gf != null) Mt.rear_door = {pos:[0, r4(ro.y*0.5), tail], w:0.9, d:0, group:'body'};
    return Mt;
  };
  M.kitEntry = function(doc, s){
    var S = doc.setup, wp = [];
    s.axles.forEach(function(z){ [1,-1].forEach(function(sx){ wp.push([sx*s.track, s.wheelR, z]); }); });
    return {pack:'workshop', group:'car', kind:'car', wheel:{r:S.wheelR, w:S.wheelW, points:wp, archClear:S.archClear, maxR:r4(S.wheelR*1.4), stock:{tyre:S.tyre || 'road', rim:S.rim || 'steel'}},
      paintSlots:['paint1','paint2','paint3'], mounts:M.mounts(s)};
  };

  /* ------------------------------------------------------------------ what the car can do, from its parts */
  var TANK = {small:250, medium:350, large:450};
  M.functions = function(doc){
    var F = {seats:[], engine:null, tanks:0, storageL:0, sleep:0, headlights:[], taillights:[], battery:false}, engineVol = 0;
    doc.pieces.forEach(function(p){
      if (!p.fn || p.g === 'wheel') return;
      var nat = M.toNative(p), B = boundsOf(nat);
      if (!B.ok) return;
      var copies = nat.length, vol = (B.mx[0]-B.mn[0])*(B.mx[1]-B.mn[1])*(B.mx[2]-B.mn[2])/copies;
      var cs = []; nat.forEach(function(np){ var b = boundsOf([np]); cs.push(v3r([(b.mn[0]+b.mx[0])/2, (b.mn[1]+b.mx[1])/2, (b.mn[2]+b.mx[2])/2])); });
      if (p.fn === 'seat') F.seats = F.seats.concat(cs);
      else if (p.fn === 'engine'){ engineVol += vol*copies; F.engine = cs[0]; }
      else if (p.fn === 'tank') F.tanks += copies;
      else if (p.fn === 'storage') F.storageL += vol*copies*1000;
      else if (p.fn === 'sleep') F.sleep += copies;
      else if (p.fn === 'headlight') F.headlights = F.headlights.concat(cs);
      else if (p.fn === 'taillight') F.taillights = F.taillights.concat(cs);
      else if (p.fn === 'battery') F.battery = true;
    });
    /* the driver sits in the front seat on the left (a US car) */
    F.seats.sort(function(a, b){ return b[2] - a[2] || b[0] - a[0]; });
    F.storageL = Math.round(F.storageL);
    F.engineL = Math.round(engineVol*1000);
    return F;
  };
  /* game numbers for the main chat to use: seats, range, cargo slots, speed, salvage and build cost */
  M.gameStats = function(doc, F){
    var S = doc.setup, st = {};
    st.seats = Math.max(F.seats.length, 0);
    st.driveable = !!F.engine && F.seats.length > 0;
    st.rangeMiles = F.tanks ? (TANK[S.tank] || 350) : 0;
    st.cargoSlots = Math.round(F.storageL/40);
    st.sleeps = F.sleep;
    st.topSpeedMph = S.topSpeed || 85;
    st.power = F.engineL > 160 ? 'strong' : F.engineL > 70 ? 'normal' : F.engineL > 0 ? 'weak' : 'none';
    return st;
  };
  M.salvage = function(doc){
    var s = {scrap:0, glass:0, plastic:0, cloth:0, wood:0, tyre:0, car_parts:0, car_battery:0, fuel:0};
    doc.pieces.forEach(function(p){
      var mat = M.MATERIALS[p.m || M.guessMaterial(p.c)] || M.MATERIALS.sheet, a = 0;
      M.toNative(p).forEach(function(np){ M.faces(np).forEach(function(f){ a += area(f.pts); }); });
      if (p.g === 'wheel'){ if (p.m === 'rubber') s.tyre = 4; return; }
      a = a/2;   /* a panel has two faces; count one */
      if (mat.scrapPerM2) s.scrap += a*mat.scrapPerM2;
      if (mat.glassPerM2) s.glass += a*mat.glassPerM2;
      if (mat.plasticPerM2) s.plastic += a*mat.plasticPerM2;
      if (mat.clothPerM2) s.cloth += a*mat.clothPerM2;
      if (mat.woodPerM2) s.wood += a*mat.woodPerM2;
      if (p.fn === 'engine') s.car_parts += 2;
      if (p.fn === 'battery') s.car_battery = 1;
      if (p.fn === 'tank') s.fuel = 1;
    });
    for (var k in s){ s[k] = Math.round(s[k]); if (!s[k]) delete s[k]; }
    return s;
  };
  /* building the design in the game costs what it salvages into, plus a toolkit's worth of work */
  M.buildCost = function(sal){ var c = {}; for (var k in sal) if (k !== 'fuel') c[k] = Math.max(1, Math.round(sal[k]*1.25)); if (!c.car_parts) c.car_parts = 1; return c; };

  /* ------------------------------------------------------------------ colours */
  M.isCustom = function(name){ return /^x[0-9a-f]{6}$/i.test(name); };
  M.customName = function(hex){ return 'x' + String(hex).replace('#','').toLowerCase(); };
  M.colourHex = function(doc, pal, name){
    var d = /_D$/.test(name), n = d ? name.slice(0, -2) : name;
    var h = (doc && doc.paint && doc.paint[n]) || (doc && doc.colours && doc.colours[n]) || (M.isCustom(n) ? '#' + n.slice(1) : null) || (pal && pal[n]) || '#ff00ff';
    return {hex:h, dark:d};
  };
  M.colourOf = function(doc, pal, over){
    return function(name){ var c = M.colourHex(doc, pal, name), rgb = SH.hex((over && over[name]) || c.hex); return c.dark ? rgb.map(function(v){ return v*0.78; }) : rgb; };
  };
  /* custom colours used by a set of pieces (the loader adds them to the palette) */
  function usedCustom(doc, lists){
    var out = {};
    lists.forEach(function(L){ L.forEach(function(pc){ var n = String(pc.c).replace(/_D$/, ''); if (M.isCustom(n)) out[n] = '#' + n.slice(1); }); });
    return out;
  }

  /* ------------------------------------------------------------------ the finished asset */
  M.countTris = function(pcs){ return SH.count(pcs); };
  M.buildAsset = function(doc, DMG){
    var nat = {}; M.GROUPS.forEach(function(g){ nat[g] = M.groupNative(doc, g); });
    var sp = M.spec(doc, nat), rig = M.rig(doc, nat, sp), kit = M.kitEntry(doc, sp), F = M.functions(doc);
    var model = {body:nat.body, wheel:nat.wheel};
    if (nat.bonnet.length) model.bonnet = nat.bonnet;
    if (nat.boot.length) model.boot = nat.boot;
    var gen = DMG ? DMG.generate(doc, nat, sp, rig) : null, damage = {}, wreck = null, burnt = null;
    if (gen){
      for (var k in gen.damage) damage[k] = doc.states && doc.states[k] ? M.groupNativeList(doc.states[k]) : gen.damage[k];
      wreck = gen.wreck; burnt = gen.burnt;
      ['wreck','burnt'].forEach(function(w){ ['body','bonnet','wheel'].forEach(function(g){ var key = w + '.' + g; if (doc.states && doc.states[key]) gen[w][g] = M.groupNativeList(doc.states[key]); }); });
    }
    model.damage = damage;
    var sal = M.salvage(doc), lists = [nat.body, nat.bonnet, nat.boot, nat.wheel];
    for (var dk in damage) lists.push(damage[dk]);
    if (wreck){ lists.push(wreck.body, wreck.bonnet || [], wreck.wheel); lists.push(burnt.body, burnt.bonnet || [], burnt.wheel); }
    var A = {type:'vehicle', id:doc.id, name:doc.name, cls:doc.cls, author:doc.author, notes:doc.notes,
      paint:clone(doc.paint), palette:usedCustom(doc, lists),
      model:model, rig:rig, spec:sp, kit:kit,
      functions:F, game:M.gameStats(doc, F), salvage:sal, buildCost:M.buildCost(sal),
      stats:{body:M.countTris(nat.body.concat(nat.bonnet, nat.boot)), wheel:M.countTris(nat.wheel)}};
    A.stats.total = A.stats.body + 4*A.stats.wheel;
    if (wreck){ A.wreck = wreck; A.burnt = burnt; A.rigWreck = gen.rigWreck; A.rigBurnt = gen.rigBurnt; }
    stripM(A.model); if (A.wreck){ stripM(A.wreck); stripM(A.burnt); }
    A.source = clone(doc);
    return A;
  };
  function stripM(o){ if (Array.isArray(o)) o.forEach(stripM); else if (o && typeof o === 'object'){ delete o._m; for (var k in o) if (o[k] && typeof o[k] === 'object') stripM(o[k]); } }
  M.stripM = stripM;
  M.groupNativeList = function(eps){ var out = []; eps.forEach(function(p){ out = out.concat(M.toNative(p)); }); return out; };

  /* ------------------------------------------------------------------ opening the design chat's cars */
  M.fromStock = function(props, name){
    var V = props.models.vehicles[name], sp = props.vehicleSpec[name.replace(/_(wreck|burnt)$/, '')];
    if (!V) throw new Error('no car ' + name);
    var doc = M.blankDoc(); doc.pieces = []; doc.id = name + '_copy'; doc.name = name.replace(/_/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }) + ' (copy)';
    ['body','bonnet','boot','wheel'].forEach(function(g){ (V[g] || []).forEach(function(np){ M.fromNative(np, g, doc); }); });
    var pal = props.palette;
    doc.paint = {paint1:pal.paint1, paint2:pal.paint2, paint3:pal.paint3};
    if (sp) doc.setup = {wheelR:sp.wheelR, wheelW:sp.wheelW, track:sp.track, axles:sp.axles.slice(), archClear:sp.archClear,
      bed:sp.bed ? {y:sp.bed.y, z:sp.bed.z, w:sp.bed.w, d:sp.bed.d} : null, tank:'medium', topSpeed:/truck|flatbed/.test(name) ? 70 : 85};
    doc.cls = /pickup|flatbed/.test(name) ? 'pickup' : /van/.test(name) ? 'van' : /truck/.test(name) ? 'truck' : 'car';
    doc.from = 'props.vehicles.' + name;
    autoTag(doc, sp);
    return doc;
  };
  /* guess the function parts of a car that has none: seats inside the cabin, lamps by colour, an engine under the bonnet */
  function autoTag(doc, sp){
    doc.pieces.forEach(function(p){
      if (p.g === 'wheel') return;
      if (/^seat/.test(p.c)) p.fn = 'seat';
      else if (/^head/.test(p.c)) p.fn = 'headlight';
      else if (/^tail/.test(p.c)) p.fn = 'taillight';
    });
    var hasSeat = doc.pieces.some(function(p){ return p.fn === 'seat'; });
    var hasEngine = doc.pieces.some(function(p){ return p.fn === 'engine'; });
    var h = sp || {hood:0.9, nose:2.2, glassFront:0.5, cabBack:-0.9, width:1.7};
    var gf = h.glassFront != null ? h.glassFront : h.nose - 1.6, cb = h.cabBack != null ? h.cabBack : gf - 1.4;
    /* invisible markers sit inside the body: plates facing down, so nothing new shows */
    if (!hasEngine) M.addPiece(doc, 'box', [0, h.hood - 0.3, (h.nose + gf)/2], {d:[0.6,0.4,0.6], fn:'engine', c:'underside', m:'steel', name:'engine (inside)', hidden:true});
    if (!hasSeat){
      M.addPiece(doc, 'box', [0.38, 0.62, gf - 0.65], {d:[0.45,0.1,0.45], fn:'seat', mx:true, c:'black', m:'cloth', name:'front seats (inside)', hidden:true});
      if (gf - cb > 1.4) M.addPiece(doc, 'box', [0.38, 0.62, cb + 0.4], {d:[0.45,0.1,0.45], fn:'seat', mx:true, c:'black', m:'cloth', name:'back seats (inside)', hidden:true});
    }
    M.addPiece(doc, 'box', [0, 0.35, h.tail + 0.6], {d:[0.5,0.15,0.3], fn:'tank', c:'underside', m:'steel', name:'fuel tank (inside)', hidden:true});
    if (h.bed) M.addPiece(doc, 'box', [0, h.bed.y + 0.25, h.bed.z], {d:[h.bed.w*0.9, 0.45, h.bed.d*0.9], fn:'storage', c:'underside', m:'steel', name:'load bed space', hidden:true});
    else M.addPiece(doc, 'box', [0, 0.75, (cb + h.tail)/2], {d:[1.2, 0.4, Math.max(0.4, cb - h.tail - 0.2)], fn:'storage', c:'underside', m:'steel', name:'boot space', hidden:true});
  }
  /* hidden pieces are function markers inside the body: they are not drawn in the game */
  var baseToNative = M.toNative;
  M.toNative = function(ep){ return ep.hidden ? [] : baseToNative(ep); };
  M.toNativeAlways = baseToNative;
  /* functions() measures hidden markers too */
  var baseFunctions = M.functions;
  M.functions = function(doc){
    var saved = M.toNative; M.toNative = baseToNative;
    try { return baseFunctions(doc); } finally { M.toNative = saved; }
  };

  /* ------------------------------------------------------------------ packs */
  M.newPack = function(o){ o = o || {}; return {format:'afterstreet-pack', version:1, id:o.id || 'my-pack', name:o.name || 'My pack', author:o.author || '', licence:o.licence || 'MIT',
    made:o.made || new Date().toISOString().slice(0, 10), madeWith:'AfterStreet Workshop ' + M.VERSION, notes:o.notes || '', assets:[], prefabs:[]}; };
  /* a pack is a .js file the game can load from a drive (file://) with a script tag; the same text is valid JSON after the first '{' */
  M.packToJS = function(pack){
    return '/* AfterStreet content pack "' + String(pack.name).replace(/\*\//g, '') + '": made with the AfterStreet Workshop (workshop.html). Load packs/packload.js, then this file. */\n' +
      '(window.AFTERSTREET_PACKS = window.AFTERSTREET_PACKS || []).push(' + JSON.stringify(pack) + ');\n';
  };
  M.parsePack = function(text){
    text = String(text);
    var a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('This file is not an AfterStreet pack');
    var p = JSON.parse(text.slice(a, b + 1));
    if (p.format === 'afterstreet-workshop') { var pk = M.newPack({name:p.name}); pk.assets.push({type:'vehicle', id:p.id, name:p.name, source:p}); return pk; }
    if (p.format !== 'afterstreet-pack') throw new Error('This file is not an AfterStreet pack');
    return p;
  };
  /* a doc from a pack asset: its Workshop source when it has one, else its finished pieces */
  M.docFromAsset = function(a){
    if (a.source) { var d = clone(a.source); d.states = d.states || {}; return d; }
    var doc = M.blankDoc(); doc.pieces = []; doc.id = a.id; doc.name = a.name;
    ['body','bonnet','boot','wheel'].forEach(function(g){ ((a.model && a.model[g]) || []).forEach(function(np){ M.fromNative(np, g, doc); }); });
    if (a.spec) doc.setup = {wheelR:a.spec.wheelR, wheelW:a.spec.wheelW, track:a.spec.track, axles:a.spec.axles.slice(), archClear:a.spec.archClear, bed:a.spec.bed || null, tank:'medium', topSpeed:85};
    if (a.paint) doc.paint = clone(a.paint);
    for (var k in (a.palette || {})) doc.colours[k] = a.palette[k];
    return doc;
  };

  /* ------------------------------------------------------------------ prefabs: saved groups of pieces, placed again on any design */
  M.makePrefab = function(doc, ids, name){
    var sel = doc.pieces.filter(function(p){ return ids.indexOf(p.id) >= 0; });
    if (!sel.length) return null;
    var c = [0,0,0]; sel.forEach(function(p){ for (var i = 0; i < 3; i++) c[i] += p.pos[i]/sel.length; });
    var minY = 1e9; sel.forEach(function(p){ var B = boundsOf(baseToNative(p)); if (B.ok) minY = Math.min(minY, B.mn[1]); });
    c[1] = minY < 1e8 ? minY : c[1];
    return {id:'pf_' + Date.now().toString(36), name:name || 'Prefab', pieces:sel.map(function(p){ var q = clone(p); q.pos = v3r([p.pos[0]-c[0], p.pos[1]-c[1], p.pos[2]-c[2]]); delete q.id; return q; })};
  };
  M.placePrefab = function(doc, pf, at, g){
    return pf.pieces.map(function(q){ var p = clone(q); p.id = M.newId(doc); p.pos = [q.pos[0]+at[0], q.pos[1]+at[1], q.pos[2]+at[2]]; if (g && p.g !== 'wheel') p.g = g; doc.pieces.push(p); return p; });
  };

  /* ------------------------------------------------------------------ checks a builder should know about */
  M.check = function(doc, A){
    var out = [], s = A.spec, S = doc.setup;
    if (!doc.pieces.some(function(p){ return p.g === 'body'; })) out.push(['bad', 'There is no body yet: add a block and stretch it.']);
    if (!A.functions.engine) out.push(['bad', 'No engine: tag a piece under the bonnet as the Engine, or the car will not drive.']);
    if (!A.functions.seats.length) out.push(['bad', 'No seats: tag a seat so someone can drive it.']);
    if (!A.functions.tanks) out.push(['warn', 'No fuel tank: tag one, or the car cannot be refuelled.']);
    if (S.track + S.wheelW/2 > s.width/2 + 0.06) out.push(['warn', 'The wheels stick out past the body (track ' + S.track + ' m, half-width ' + r4(s.width/2) + ' m).']);
    if (s.ground < 0.06) out.push(['warn', 'The body nearly touches the ground: it will scrape on kerbs.']);
    if (S.axles[0] + S.wheelR > s.nose + 0.05 || S.axles[1] - S.wheelR < s.tail - 0.05) out.push(['warn', 'A wheel sits outside the body: move the axles in or lengthen the body.']);
    if (A.stats.total > 3000) out.push(['warn', 'Heavy model: ' + A.stats.total + ' triangles (the stock cars use about 600). Phones will feel it in a car park.']);
    var asym = 0; if (!doc.from) doc.pieces.forEach(function(p){ if (p.g === 'body' && !p.mx && Math.abs(p.pos[0]) > 0.05 && !p.hidden) asym++; });
    if (asym) out.push(['info', asym + ' piece' + (asym > 1 ? 's sit' : ' sits') + ' off-centre without left/right symmetry.']);
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.WSM = M;
})(typeof window !== 'undefined' ? window : this);
