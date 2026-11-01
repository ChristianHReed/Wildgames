/* AfterStreet Workshop build library: make vehicles from a script, with the same logic as the Workshop's editor.
   For the content chat (and anyone) remaking the game's vehicles so they work as machines: wheels on axles, power through a
   driveshaft, doors that open, rooms you walk into, couplings, hulls that float and rotors that lift.

   A design is a small script in workshop/designs/<name>.js:
       module.exports = function(WSB){
         var b = WSB.create({id:'box_truck', name:'Box truck', domain:'land', cls:'truck'});
         b.wheels(0.42, 0.28);
         b.axle(2.05, {steer:true}); b.axle(-1.9, {driven:true});
         ... blocks, jobs, rooms, doors ...
         return b;
       };
   Then:  node workshop/tools/test_crafts.js            checks every design (exit code 1 if any has a 'bad' problem)
          node workshop/tools/test_crafts.js --pack     also writes packs/workshop-crafts.js for the game
   The design opens in the Workshop too (Designs -> Import a pack file), with every piece editable.

   Coordinates: metres, Y up, the vehicle faces +Z, its right side is +X, the ground (or a boat's keel) at y = 0.
   Sizes are [width (x), height (y), length (z)]. Colours are palette names (paint1, glass, underside, ...) or '#rrggbb'. */
(function(root){
  var M = (typeof module !== 'undefined' && module.exports) ? require('./model.js') : root.WSM;
  if (typeof module !== 'undefined' && module.exports){ require('./assets.js'); require('./craft.js'); }
  function r4(v){ return Math.round(v*1e4)/1e4; }
  var B = {};
  function colour(doc, c){ if (typeof c === 'string' && c[0] === '#'){ var n = M.customName(c); doc.colours[n] = c.toLowerCase(); return n; } return c || 'paint1'; }

  B.create = function(o){
    o = o || {};
    var dom = o.domain || 'land', doc = M.blankCraft(dom, o.cls);
    doc.pieces = []; doc.setup.axles = []; doc.id = o.id || 'design'; doc.name = o.name || doc.id; doc.author = o.author || 'AfterStreet content chat'; doc.notes = o.notes || '';
    if (o.paint) doc.paint = Object.assign({}, doc.paint, o.paint);
    if (o.tank) doc.setup.tank = o.tank; if (o.topSpeed) doc.setup.topSpeed = o.topSpeed;
    var b = {doc:doc};
    /* any shape from the Workshop's toolbar: box, bev, wedge, cyl, tube, cone, plate, corner, incorner, pyramid, prism, hex, ball, dome, arch, quarter */
    b.block = function(shape, pos, sz, opt){
      opt = opt || {}; var extra = {};
      for (var k in opt) if (k !== 'fn' && k !== 'c') extra[k] = opt[k];
      if (sz) extra.d = sz.slice();
      extra.c = colour(doc, opt.c); if (!extra.m) extra.m = M.guessMaterial(extra.c);
      if (shape === 'tube' || shape === 'cone' || shape === 'cyl') extra.ax = opt.ax || (shape === 'cyl' ? 'y' : 'z');
      var p = M.addPiece(doc, shape, pos.map(r4), extra);
      if (sz && (shape === 'tube' || shape === 'cone')){ var ia = {x:0, y:1, z:2}[p.ax], len = sz[ia]; p.r = p.r.map(function(r, i){ var q = [0, 0, 0, sz[ia === 0 ? 1 : 0]/2, sz[ia === 2 ? 1 : 2]/2]; q[ia] = (i ? 1 : -1)*len/2; if (shape === 'cone' && i) { q[3] = 0; q[4] = 0; } return q; }); delete p.d; }
      if (opt.fn) M.setJob(p, opt.fn);
      return p;
    };
    /* a box from two corners */
    b.box = function(mn, mx, opt){ return b.block('box', [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2], [mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]], opt); };
    b.job = function(p, fn, set){ M.setJob(p, fn); if (set) for (var k in set) p[k] = set[k]; return p; };
    /* wheels: one wheel model the game copies onto every hub */
    b.wheels = function(r, w){ doc.setup.wheelR = r; doc.setup.wheelW = w; doc.pieces = M.makeWheel(doc, r, w); return b; };
    b.axle = function(z, opt){ opt = opt || {}; var p = M.makeAxle(doc, z, opt); if (opt.track) p.d[0] = r4(Math.max(0.2, 2*opt.track - doc.setup.wheelW)); M.syncAxles(doc); return p; };
    b.gearbox = function(pos){ return b.block('bev', pos, [0.3, 0.26, 0.45], {c:'underside', m:'steel', fn:'gearbox', name:'gearbox'}); };
    /* jobs that are markers inside the body (not drawn in the game) */
    b.engine = function(pos, sz){ return b.block('box', pos, sz || [0.6, 0.45, 0.7], {c:'underside', m:'steel', fn:'engine', hidden:true, name:'engine'}); };
    b.tank = function(pos, sz){ return b.block('box', pos, sz || [0.6, 0.3, 0.4], {c:'underside', m:'steel', fn:'tank', hidden:true, name:'fuel tank'}); };
    b.battery = function(pos){ return b.block('box', pos, [0.25, 0.18, 0.18], {c:'black', m:'plastic', fn:'battery', hidden:true, name:'battery'}); };
    b.storage = function(mn, mx, name){ return b.box(mn, mx, {c:'underside', fn:'storage', hidden:true, name:name || 'storage'}); };
    /* seats show (they are fittings: allowed inside a room) */
    b.seat = function(pos, opt){ opt = opt || {}; return b.block('box', pos, opt.size || [0.48, 0.1, 0.48], {c:opt.c || 'seat', m:'cloth', fn:'seat', mx:!!opt.mx, name:opt.name || 'seat', hidden:!!opt.hidden}); };
    b.bed = function(pos, sz, opt){ opt = opt || {}; return b.block('box', pos, sz || [0.9, 0.25, 1.95], {c:opt.c || 'seat', m:'cloth', fn:'sleep', name:opt.name || 'bed'}); };
    b.light = function(kind, pos, sz, opt){ opt = opt || {}; return b.block(opt.shape || 'box', pos, sz || [0.2, 0.15, 0.04], {c:kind === 'headlight' ? 'head' : 'tail', fn:kind, mx:opt.mx !== false, name:kind, ax:opt.ax}); };
    /* a walk-in room: the space inside, as a hidden box (floor at mn[1]) */
    b.room = function(mn, mx, name){ return b.box(mn, mx, {c:'#5a8ac8', fn:'room', hidden:true, name:name || 'room'}); };
    /* a box body around a room: floor, roof, side walls, front wall and back wall, leaving out the sides named in opt.open
       (e.g. open:['back'] for a door at the back). wall = panel thickness. Returns {room, panels} */
    b.shell = function(mn, mx, opt){
      opt = opt || {}; var t = opt.wall || 0.05, fl = opt.floor || 0.08, c = opt.c || 'paint1', cf = opt.floorC || 'underside', m = opt.m || 'sheet', open = opt.open || [], nm = opt.name || 'box';
      var P = {};
      P.floor = b.box([mn[0], mn[1] - fl, mn[2]], [mx[0], mn[1], mx[2]], {c:cf, m:opt.floorM || 'wood', name:nm + ' floor'});
      if (open.indexOf('roof') < 0) P.roof = b.box([mn[0] - t, mx[1], mn[2] - t], [mx[0] + t, mx[1] + t, mx[2] + t], {c:c, m:m, name:nm + ' roof'});
      if (open.indexOf('left') < 0 && open.indexOf('right') < 0) P.side = b.box([mx[0], mn[1] - fl, mn[2] - t], [mx[0] + t, mx[1], mx[2] + t], {c:c, m:m, mx:true, name:nm + ' side'});
      else { if (open.indexOf('right') < 0) P.right = b.box([mx[0], mn[1] - fl, mn[2] - t], [mx[0] + t, mx[1], mx[2] + t], {c:c, m:m, name:nm + ' right side'});
             if (open.indexOf('left') < 0) P.left = b.box([mn[0] - t, mn[1] - fl, mn[2] - t], [mn[0], mx[1], mx[2] + t], {c:c, m:m, name:nm + ' left side'}); }
      if (open.indexOf('front') < 0) P.front = b.box([mn[0], mn[1] - fl, mx[2]], [mx[0], mx[1], mx[2] + t], {c:c, m:m, name:nm + ' front wall'});
      if (open.indexOf('back') < 0) P.back = b.box([mn[0], mn[1] - fl, mn[2] - t], [mx[0], mx[1], mn[2]], {c:c, m:m, name:nm + ' back wall'});
      P.room = b.room(mn, mx, opt.room || nm + ' inside');
      return P;
    };
    /* a door: kind swing | roll | slide | ramp; hinge front | back | top | bottom | outer | inner. Pieces with the same name open together */
    b.door = function(mn, mx, opt){ opt = opt || {}; var p = b.box(mn, mx, {c:opt.c || 'paint1', m:opt.m || 'sheet', mx:!!opt.mx, name:opt.name || 'door'}); M.setJob(p, 'door'); p.door = {kind:opt.kind || 'swing', hinge:opt.hinge || 'front'}; return p; };
    b.hitch = function(pos, type){ var p = b.block('cyl', pos, type === 'fifth' || !type ? [0.9, 0.12, 0.9] : [0.1, 0.1, 0.1], {c:'underside', m:'steel', name:type === 'ball' ? 'tow ball' : 'fifth wheel'}); M.setJob(p, 'hitch'); p.hitch = {type:type || 'fifth'}; return p; };
    b.coupler = function(pos, type){ var p = b.block('cyl', pos, type === 'tongue' ? [0.12, 0.08, 0.12] : [0.09, 0.12, 0.09], {c:'underside', m:'steel', name:type === 'tongue' ? 'tongue' : 'kingpin'}); M.setJob(p, 'coupler'); p.coupler = {type:type || 'kingpin'}; return p; };
    /* aircraft and boats */
    b.rotor = function(c, radius, opt){ opt = opt || {}; var n = opt.blades || 2, nm = opt.name || 'rotor', out = [];
      out.push(b.block('cyl', c, [0.3, 0.12, 0.3], {c:'underside', m:'steel', fn:'rotor', name:nm}));
      for (var i = 0; i < n/2; i++) out.push(b.block('box', c, [radius*2, 0.05, opt.chord || 0.26], {c:opt.c || 'black', m:'steel', fn:'rotor', name:nm, rot:[0, r4(i*360/n), 0]}));
      return out; };
    b.tailRotor = function(c, radius, opt){ opt = opt || {}; return [b.block('box', c, [0.03, radius*2, 0.14], {c:opt.c || 'black', m:'steel', fn:'tailrotor', name:opt.name || 'tail rotor'}),
      b.block('box', c, [0.03, 0.14, radius*2], {c:opt.c || 'black', m:'steel', fn:'tailrotor', name:opt.name || 'tail rotor'})]; };
    b.propeller = function(c, radius, opt){ opt = opt || {}; return [b.block('box', c, [radius*2, 0.14, 0.04], {c:opt.c || 'black', m:'wood', fn:'propeller', name:opt.name || 'prop'}),
      b.block('cone', [c[0], c[1], c[2] + 0.06], [0.16, 0.16, 0.14], {c:'chrome', m:'steel', fn:'propeller', name:opt.name || 'prop'})]; };
    b.wing = function(mn, mx, opt){ opt = opt || {}; return b.box(mn, mx, {c:opt.c || 'paint2', m:opt.m || 'sheet', fn:'wing', name:opt.name || 'wing'}); };
    b.envelope = function(c, len, dia, opt){ opt = opt || {}; var R = dia/2, L = len/2;
      return b.block('tube', [0, 0, 0], null, {s:'loft', ax:'z', n:12, r:[[c[0], c[1], c[2] - L, 0, 0], [c[0], c[1], c[2] - L*0.8, R*0.65, R*0.65], [c[0], c[1], c[2] - L*0.2, R, R], [c[0], c[1], c[2] + L*0.4, R*0.94, R*0.94], [c[0], c[1], c[2] + L*0.85, R*0.48, R*0.48], [c[0], c[1], c[2] + L, 0, 0]], c:opt.c || 'paint2', m:'cloth', fn:'envelope', name:opt.name || 'envelope'}); };
    b.hull = function(mn, mx){ return b.box(mn, mx, {c:'#3a6a8a', fn:'hull', hidden:true, name:'hull'}); };
    b.outboard = function(c, opt){ opt = opt || {}; var h = opt.height || 0.75;
      var top = b.box([c[0] - 0.12, c[1], c[2] - 0.32], [c[0] + 0.12, c[1] + 0.42, c[2]], {c:opt.c || 'black', m:'plastic', fn:'outboard', name:'outboard'});
      var leg = b.box([c[0] - 0.04, c[1] - h + 0.42, c[2] - 0.22], [c[0] + 0.04, c[1] + 0.02, c[2] - 0.1], {c:opt.c || 'black', m:'steel', fn:'outboard', name:'outboard'});
      var prop = b.box([c[0] - 0.14, c[1] - h + 0.32, c[2] - 0.27], [c[0] + 0.14, c[1] - h + 0.6, c[2] - 0.22], {c:'chrome', m:'steel', fn:'propeller', name:'prop'});
      b.block('box', [c[0], c[1] + 0.2, c[2] - 0.16], [0.2, 0.2, 0.2], {c:'underside', m:'steel', fn:'engine', hidden:true, name:'outboard engine'});
      return [top, leg, prop]; };
    b.rudder = function(mn, mx, opt){ opt = opt || {}; return b.box(mn, mx, {c:opt.c || 'paint1', m:opt.m || 'sheet', fn:'rudder', name:opt.name || 'rudder'}); };
    b.elevator = function(mn, mx, opt){ opt = opt || {}; return b.box(mn, mx, {c:opt.c || 'paint1', m:opt.m || 'sheet', fn:'elevator', name:opt.name || 'elevator'}); };
    b.skid = function(mn, mx, opt){ opt = opt || {}; return b.box(mn, mx, {c:opt.c || 'underside', m:opt.m || 'sheet', fn:'skid', mx:!!opt.mx, name:opt.name || 'skid'}); };
    /* build it: the finished pack asset, the checks, and a short report */
    b.finish = function(DMG){
      M.syncAxles(doc);
      var A = M.buildAsset(doc, DMG || null), C = M.check(doc, A);
      return {doc:doc, asset:A, checks:C, bad:C.filter(function(x){ return x[0] === 'bad'; }), report:B.report(doc, A)};
    };
    return b;
  };
  /* one line of numbers for the test table */
  B.report = function(doc, A){
    var ft = function(m){ var i = Math.round(m*39.37); return Math.floor(i/12) + "'" + (i % 12) + '"'; }, IN = A.interior, g = A.game || {};
    var o = {id:doc.id, domain:A.domain, cls:doc.cls, size:A.size ? A.size.map(ft).join(' x ') : '', massLb:g.massLb, tris:A.stats ? A.stats.total : 0,
      axles:M.axlesOf(doc).length, drive:g.drive || '', walkIn:!!g.walkIn, mobileBase:!!g.mobileBase, baseSlots:g.baseSlots || 0,
      doors:A.rig && A.rig.parts ? Object.keys(A.rig.parts).filter(function(k){ return A.rig.parts[k].kind === 'door'; }).length : A.boat ? 0 : A.aircraft ? Object.keys(A.aircraft.rig).filter(function(k){ return A.aircraft.rig[k].kind === 'door'; }).length : 0};
    if (A.water){ o.floats = A.water.floats; o.capacity = A.water.capacity; o.draughtIn = A.water.draught != null ? Math.round(A.water.draught*39.37) : null; }
    if (A.air){ o.flies = A.air.flies; o.liftLb = Math.round(A.air.liftKg*2.20462); o.needLb = Math.round(A.air.needKg*2.20462); }
    if (A.coupling) o.coupling = Object.keys(A.coupling).map(function(k){ return k + ':' + A.coupling[k].type; }).join(' ');
    if (IN) o.rooms = IN.rooms.map(function(r){ return r.name + ' ' + ft(r.headroom) + ' tall, ' + Math.round(r.area*10.764) + ' sq ft'; }).join('; ');
    return o;
  };
  /* a pack of finished designs, as the .js text the game loads */
  B.pack = function(o, results){
    var pk = M.newPack(o); pk.version = 2;
    results.forEach(function(r){ pk.assets.push(r.asset); });
    return M.packToJS(pk);
  };
  B.M = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = B; else root.WSB = B;
})(typeof window !== 'undefined' ? window : this);
