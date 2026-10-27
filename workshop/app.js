/* AfterStreet Workshop: the editor. Free building from shapes, the way crafting games do it:
   pick a shape, tap where it goes (it lands flush on the face you tapped), stretch and turn it, mirror it across the car's
   symmetry planes, paint it, give it a material and a job (seat, engine, tank...), and the car's numbers come from its parts.
   Designs save in this browser as you go; Export pack writes the file the game and the Maps Builder load. */
(function(){
  'use strict';
  var M = window.WSM, D = window.WSD, SH = window.SHAPED, PROPS = SH.props, PAL = PROPS.palette;
  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function r4(v){ return Math.round(v*1e4)/1e4; }

  /* ---------------------------------------------------------------- storage (this browser) */
  var store = {
    get:function(k, d){ try { var v = localStorage.getItem('afterstreet.workshop.' + k); return v ? JSON.parse(v) : d; } catch (e){ return d; } },
    set:function(k, v){ try { localStorage.setItem('afterstreet.workshop.' + k, JSON.stringify(v)); return true; } catch (e){ toast('Could not save in this browser (storage full or private mode). Export a pack to keep your work.'); return false; } }
  };

  /* ---------------------------------------------------------------- state */
  var S = {
    doc:null, sel:[], layer:'car', look:'whole', state:null,
    units:store.get('units', 'imp'), snap:store.get('snap', null), faceSnap:store.get('faceSnap', true),
    sym:{x:true, z:false}, lock:null, placing:null, multi:false, tab:'piece',
    preview:{bonnet:false, boot:false, markers:true, person:true, planes:true},
    brush:'paint1', prefabs:store.get('prefabs', []), undo:[], redo:[], asset:null, assetFor:null
  };
  if (S.snap == null) S.snap = S.units === 'imp' ? 0.0254 : 0.01;

  /* ---------------------------------------------------------------- units: inches and feet by default, centimetres when chosen */
  var IN = 0.0254;
  function toUnit(m){ return S.units === 'imp' ? m/IN : m*100; }
  function fromUnit(v){ return S.units === 'imp' ? v*IN : v/100; }
  function unitLabel(){ return S.units === 'imp' ? 'in' : 'cm'; }
  function fmtNum(v){ var a = Math.abs(v); return (Math.round(v*(a < 10 ? 100 : 10))/(a < 10 ? 100 : 10)).toString(); }
  function fmtLen(m){
    if (S.units !== 'imp') return m >= 1 ? (Math.round(m*100)/100) + ' m' : Math.round(m*100) + ' cm';
    var inch = m/IN; if (Math.abs(inch) < 24) return fmtNum(inch) + ' in';
    var ft = Math.floor(Math.round(inch)/12), i = Math.round(inch) - ft*12; return ft + ' ft ' + i + ' in';
  }
  var SNAPS = {imp:[[0, 'off'], [IN/2, '½ in'], [IN, '1 in'], [3*IN, '3 in'], [6*IN, '6 in']], met:[[0, 'off'], [0.01, '1 cm'], [0.05, '5 cm'], [0.1, '10 cm'], [0.25, '25 cm']]};
  function snapV(v){ return S.snap ? Math.round(v/S.snap)*S.snap : v; }

  /* ---------------------------------------------------------------- the design being edited */
  function drafts(){ return store.get('drafts', {}); }
  function saveDraft(){ if (!S.doc) return; var d = drafts(); S.doc.saved = Date.now(); d[S.doc.id] = S.doc; store.set('drafts', d); store.set('current', S.doc.id); }
  var saveT = 0; function saveSoon(){ clearTimeout(saveT); saveT = setTimeout(saveDraft, 700); }
  function setDoc(doc, keepView){
    doc.states = doc.states || {}; doc.dmg = doc.dmg || {seed:7, strength:1};
    S.doc = doc; S.sel = []; S.undo = []; S.redo = []; S.layer = 'car'; S.look = 'whole'; S.state = null; S.asset = null;
    $('docName').value = doc.name;
    refresh(true); if (!keepView) fitView();
  }
  function uniqueId(base){ var d = drafts(), id = slug(base) || 'design', n = 2, b = id; while (d[id] && d[id] !== S.doc) id = b + '_' + n++; return id; }
  function slug(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40); }

  /* undo: a snapshot before every change */
  function commit(){ S.undo.push(JSON.stringify(S.doc)); if (S.undo.length > 120) S.undo.shift(); S.redo = []; }
  function changed(full){ S.asset = null; saveSoon(); refresh(full); }
  function undo(){ if (!S.undo.length) return; S.redo.push(JSON.stringify(S.doc)); S.doc = JSON.parse(S.undo.pop()); keepSel(); changed(true); }
  function redo(){ if (!S.redo.length) return; S.undo.push(JSON.stringify(S.doc)); S.doc = JSON.parse(S.redo.pop()); keepSel(); changed(true); }
  function keepSel(){ var ids = {}; active().forEach(function(p){ ids[p.id] = 1; }); S.sel = S.sel.filter(function(i){ return ids[i]; }); }

  /* the pieces being edited: the car's (body, bonnet, boot), the wheel, or a hand-edited damage state */
  function stateList(){ return S.doc.states[S.state] || []; }
  function active(){
    if (S.layer === 'state') return stateList();
    return S.doc.pieces.filter(function(p){ return S.layer === 'wheel' ? p.g === 'wheel' : p.g !== 'wheel'; });
  }
  function ownerList(){ return S.layer === 'state' ? stateList() : S.doc.pieces; }
  function byId(id){ var L = ownerList(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function selected(){ return S.sel.map(byId).filter(Boolean); }

  /* ---------------------------------------------------------------- the finished asset (measurements, damage, checks) */
  function asset(){
    if (S.asset && S.assetFor === S.doc) return S.asset;
    try { S.asset = M.buildAsset(S.doc, D); } catch (e){ console.error(e); S.asset = M.buildAsset(S.doc, null); }
    S.assetFor = S.doc; return S.asset;
  }

  /* ---------------------------------------------------------------- 3D scene */
  var view, meshCache = {};
  function colourFn(){ return M.colourOf(S.doc, PAL); }
  function nativesOf(p){ return M.toNativeAlways(p); }
  /* game pieces -> triangles (with lit flag in alpha), cached by the piece's JSON */
  function trisOf(pcs, key){
    var k = key ? key + JSON.stringify(S.doc.paint) + JSON.stringify(S.doc.colours) : null;
    if (k && meshCache[k]) return meshCache[k];
    var cf = colourFn(), lit = [], glo = [];
    pcs.forEach(function(pc){ (pc.glow ? glo : lit).push(pc); });
    var A = SH.build(lit, cf), G = SH.build(glo, cf), n = (A.pos.length + G.pos.length)/3;
    var pos = new Float32Array(n*3), nor = new Float32Array(n*3), col = new Float32Array(n*4), i, j = 0;
    [[A, 1], [G, 0]].forEach(function(pr){ var m = pr[0];
      for (i = 0; i < m.pos.length/3; i++, j++){ pos[j*3] = m.pos[i*3]; pos[j*3+1] = m.pos[i*3+1]; pos[j*3+2] = m.pos[i*3+2]; nor[j*3] = m.nor[i*3]; nor[j*3+1] = m.nor[i*3+1]; nor[j*3+2] = m.nor[i*3+2];
        col[j*4] = m.col[i*3]; col[j*4+1] = m.col[i*3+1]; col[j*4+2] = m.col[i*3+2]; col[j*4+3] = pr[1]; } });
    var out = {pos:pos, nor:nor, col:col};
    if (k){ meshCache[k] = out; if (Object.keys(meshCache).length > 4000) meshCache = {}; }
    return out;
  }
  function merge(list){
    var n = 0; list.forEach(function(m){ n += m.pos.length/3; });
    var o = {pos:new Float32Array(n*3), nor:new Float32Array(n*3), col:new Float32Array(n*4)}, a = 0;
    list.forEach(function(m){ o.pos.set(m.pos, a*3); o.nor.set(m.nor, a*3); o.col.set(m.col, a*4); a += m.pos.length/3; });
    return o;
  }
  /* move a mesh: rotate about x through a hinge (bonnet and boot open), or place a wheel (turn half round on the left side) */
  function xform(m, fn){
    var n = m.pos.length/3, o = {pos:new Float32Array(n*3), nor:new Float32Array(n*3), col:m.col};
    for (var i = 0; i < n; i++){ var r = fn([m.pos[i*3], m.pos[i*3+1], m.pos[i*3+2]], [m.nor[i*3], m.nor[i*3+1], m.nor[i*3+2]]); o.pos[i*3] = r[0][0]; o.pos[i*3+1] = r[0][1]; o.pos[i*3+2] = r[0][2]; o.nor[i*3] = r[1][0]; o.nor[i*3+1] = r[1][1]; o.nor[i*3+2] = r[1][2]; }
    return o;
  }
  function hingeX(h, ang){ var c = Math.cos(ang), s = Math.sin(ang);
    return function(p, n){ var y = p[1]-h[1], z = p[2]-h[2]; return [[p[0], h[1] + y*c - z*s, h[2] + y*s + z*c], [n[0], n[1]*c - n[2]*s, n[1]*s + n[2]*c]]; }; }
  function wheelAt(w, left){ return function(p, n){ return left ? [[-p[0] + w[0], p[1] + w[1], -p[2] + w[2]], [-n[0], n[1], -n[2]]] : [[p[0] + w[0], p[1] + w[1], p[2] + w[2]], n]; }; }
  function groupBounds(g){ var pcs = []; S.doc.pieces.forEach(function(p){ if (p.g === g && !p.hidden) pcs = pcs.concat(nativesOf(p)); }); return M.boundsOf(pcs); }
  function openFn(p){
    if (S.layer !== 'car') return null;
    if (p.g === 'bonnet' && S.preview.bonnet){ var b = groupBounds('bonnet'); if (b.ok) return hingeX([0, b.mx[1], b.mn[2]], -1.0); }
    if (p.g === 'boot' && S.preview.boot){ var t = groupBounds('boot'); if (t.ok) return hingeX([0, t.mx[1], t.mx[2]], 1.0); }
    return null;
  }
  var picks = [];   /* [{id, pos}] world-space triangles that taps can hit */
  function wheelMeshes(){
    var wm = trisOf(S.doc.pieces.filter(function(p){ return p.g === 'wheel'; }).reduce(function(a, p){ return a.concat(nativesOf(p)); }, []), 'wheelset:' + JSON.stringify(S.doc.pieces.filter(function(p){ return p.g === 'wheel'; })));
    var t = S.doc.setup.track, r = S.doc.setup.wheelR, out = [];
    S.doc.setup.axles.forEach(function(z){ out.push(xform(wm, wheelAt([t, r, z], false))); out.push(xform(wm, wheelAt([-t, r, z], true))); });
    return out;
  }
  function rebuildScene(){
    if (!view) return;
    picks = [];
    var solid = [], selM = [], ghost = [], lines = [], selIds = {}; S.sel.forEach(function(i){ selIds[i] = 1; });
    if (S.layer === 'look'){
      var A = asset(), L = D.LOOKS.filter(function(l){ return l.key === S.look; })[0] || D.LOOKS[0], pcs = [], wheel = A.model.wheel, drop = 0;
      if (L.whole){ var W = A[L.whole]; pcs = W.body.concat(W.bonnet || []); wheel = W.wheel; drop = (L.whole === 'wreck' ? A.rigWreck : A.rigBurnt).sitDrop; }
      else { pcs = (L.body ? A.model.damage[L.body] : A.model.body).concat(L.bonnet && A.model.damage[L.bonnet] ? A.model.damage[L.bonnet] : (A.model.bonnet || []), A.model.boot || []);
        L.over.forEach(function(k){ pcs = pcs.concat(A.model.damage[k] || []); }); }
      var m = trisOf(pcs, 'look:' + S.look + JSON.stringify(S.doc.dmg) + JSON.stringify(S.doc.states) + JSON.stringify(S.doc.pieces));
      solid.push(drop ? xform(m, function(p, n){ return [[p[0], p[1] - drop, p[2]], n]; }) : m);
      var wm = trisOf(wheel, 'lookwheel:' + S.look + JSON.stringify(S.doc.pieces.filter(function(p){ return p.g === 'wheel'; })));
      var t = S.doc.setup.track, r = S.doc.setup.wheelR - drop;
      S.doc.setup.axles.forEach(function(z){ solid.push(xform(wm, wheelAt([t, r, z], false))); solid.push(xform(wm, wheelAt([-t, r, z], true))); });
    } else {
      var list = active();
      list.forEach(function(p){
        if (p.hidden && !S.preview.markers) return;
        var m = trisOf(nativesOf(p), 'p:' + JSON.stringify(p)), f = openFn(p);
        if (f) m = xform(m, f);
        if (p.hidden) ghost.push(m); else solid.push(m);
        if (selIds[p.id]) selM.push(m);
        picks.push({id:p.id, pos:m.pos});
      });
      if (S.layer === 'car') solid = solid.concat(wheelMeshes());
      if (S.layer === 'state'){ /* show the clean car faintly round the state being edited */
        var base = []; S.doc.pieces.forEach(function(p){ if (p.g !== 'wheel' && !p.hidden) base = base.concat(nativesOf(p)); });
        ghost.push(trisOf(base, 'base:' + JSON.stringify(S.doc.pieces)));
      }
    }
    view.set('solid', {tris:merge(solid)}, {order:1});
    view.set('ghost', ghost.length ? {tris:merge(ghost)} : null, {order:3, alpha:0.35, depthWrite:false});
    view.set('sel', selM.length ? {tris:merge(selM)} : null, {order:4, tint:[0.85, 0.45, 0.18, 0.38], offset:-1});
    view.set('selLines', selM.length ? {lines:outline(S.sel)} : null, {order:5, depth:false, alpha:0.9, lit:false});
    sceneDecor();
    updateReadout();
  }
  /* the edges of the selected pieces' faces, drawn through everything so a piece inside another still shows */
  function outline(ids){
    var pos = [], col = [];
    ids.forEach(function(id){ var p = byId(id); if (!p) return; var f = openFn(p);
      nativesOf(p).forEach(function(np){ M.faces(np).forEach(function(fc){ for (var i = 0; i < fc.pts.length; i++){ var a = fc.pts[i], b = fc.pts[(i+1)%fc.pts.length];
        if (f){ a = f(a, [0,1,0])[0]; b = f(b, [0,1,0])[0]; }
        pos.push(a[0], a[1], a[2], b[0], b[1], b[2]); col.push(0.78, 0.36, 0.12, 1, 0.78, 0.36, 0.12, 1); } }); }); });
    return {pos:pos, col:col};
  }
  /* grid, symmetry planes, a person for scale, the shadow */
  function sceneDecor(){
    var pos = [], col = [], step = S.units === 'imp' ? 6*IN : 0.1, major = S.units === 'imp' ? 2 : 10, ext = S.layer === 'wheel' ? 1.2 : 4.2, n = Math.ceil(ext/step);
    var y0 = S.layer === 'wheel' ? -S.doc.setup.wheelR - 0.002 : 0.001;
    for (var i = -n; i <= n; i++){ var v = i*step, mj = i % major === 0, c = mj ? [0.62, 0.55, 0.45, 1] : [0.80, 0.73, 0.62, 1];
      pos.push(v, y0, -n*step, v, y0, n*step, -n*step, y0, v, n*step, y0, v); col.push.apply(col, c.concat(c, c, c)); }
    /* axes: X red (right), Z blue (front), Y green (up) */
    pos.push(0, y0, 0, 0.6, y0, 0,  0, y0, 0, 0, y0, 0.6,  0, y0, 0, 0, 0.6 + y0, 0);
    col.push(0.71,0.32,0.24,1, 0.71,0.32,0.24,1, 0.31,0.45,0.58,1, 0.31,0.45,0.58,1, 0.42,0.54,0.25,1, 0.42,0.54,0.25,1);
    view.set('grid', {lines:{pos:pos, col:col}}, {order:0, lit:false});
    /* symmetry planes */
    var pl = [];
    if (S.preview.planes && S.layer !== 'wheel' && S.layer !== 'look'){
      var L = 2.8, H = 2.2;
      if (S.sym.x) pl.push(quad([0, 0, -L], [0, 0, L], [0, H, L], [0, H, -L], [0.75, 0.3, 0.22]));
      if (S.sym.z) pl.push(quad([-1.4, 0, 0], [1.4, 0, 0], [1.4, H, 0], [-1.4, H, 0], [0.3, 0.45, 0.62]));
    }
    view.set('planes', pl.length ? {tris:merge(pl)} : null, {order:6, alpha:0.12, lit:false, depthWrite:false});
    /* a 6 ft person beside the car, and a soft shadow under it */
    var extra = [];
    if (S.preview.person && S.layer !== 'wheel'){
      var A = carBounds(), x = -(Math.max(0.9, A.ok ? Math.max(-A.mn[0], A.mx[0]) : 0.9) + 0.75);
      extra.push(trisOf(person(x), 'person' + x));
    }
    view.set('person', extra.length ? {tris:merge(extra)} : null, {order:2});
    if (S.layer !== 'wheel'){
      var B = carBounds(), w = B.ok ? Math.max(-B.mn[0], B.mx[0]) + 0.1 : 1, z0 = B.ok ? B.mn[2] - 0.1 : -2.3, z1 = B.ok ? B.mx[2] + 0.1 : 2.3;
      view.set('shadow', {tris:quad([-w, 0.004, z0], [w, 0.004, z0], [w, 0.004, z1], [-w, 0.004, z1], [0.35, 0.28, 0.2])}, {order:0.5, alpha:0.22, lit:false, depthWrite:false});
    } else view.set('shadow', null);
  }
  function quad(a, b, c, d, rgb){ var pos = [].concat(a, b, c, a, c, d), col = []; for (var i = 0; i < 6; i++) col.push(rgb[0], rgb[1], rgb[2], 1); return {pos:new Float32Array(pos), nor:new Float32Array([0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0]), col:new Float32Array(col)}; }
  function person(x){
    var c = 'plastic';
    return [{s:'box', p:[x-0.1, 0.43, 0], d:[0.15, 0.86, 0.18], c:c}, {s:'box', p:[x+0.1, 0.43, 0], d:[0.15, 0.86, 0.18], c:c},
      {s:'bev', p:[x, 1.18, 0], d:[0.46, 0.64, 0.26], c:c}, {s:'box', p:[x-0.3, 1.12, 0], d:[0.11, 0.62, 0.12], c:c}, {s:'box', p:[x+0.3, 1.12, 0], d:[0.11, 0.62, 0.12], c:c},
      {s:'bev', p:[x, 1.66, 0], d:[0.22, 0.28, 0.24], c:c}];
  }
  var cbCache = null, cbKey = '';
  function carBounds(){ var k = JSON.stringify(S.doc.pieces); if (k === cbKey) return cbCache; var pcs = []; S.doc.pieces.forEach(function(p){ if (p.g !== 'wheel' && !p.hidden) pcs = pcs.concat(nativesOf(p)); }); cbCache = M.boundsOf(pcs); cbKey = k; return cbCache; }
  function fitView(keep){
    var B;
    if (S.layer === 'wheel'){ var r = S.doc.setup.wheelR; B = {ok:true, mn:[-0.3, -r, -r], mx:[0.3, r, r]}; }
    else { B = carBounds(); if (!B.ok) B = {ok:true, mn:[-1, 0, -2], mx:[1, 1.5, 2]}; B = {ok:true, mn:[B.mn[0], 0, B.mn[2]], mx:[B.mx[0], B.mx[1], B.mx[2]]}; }
    view.frame(B.mn, B.mx, keep);
  }
  function updateReadout(){
    var el = $('readout');
    if (S.layer === 'wheel'){ el.innerHTML = 'Wheel ' + fmtLen(S.doc.setup.wheelR*2) + ' across'; return; }
    var B = carBounds(); if (!B.ok){ el.textContent = 'Empty'; return; }
    el.innerHTML = fmtLen(B.mx[2] - B.mn[2]) + ' long · ' + fmtLen(B.mx[0] - B.mn[0]) + ' wide · ' + fmtLen(B.mx[1]) + ' tall';
  }

  /* ---------------------------------------------------------------- picking and moving */
  function hit(x, y){
    var R = view.ray(x, y), best = null;
    picks.forEach(function(pk){ var P = pk.pos;
      for (var i = 0; i < P.length; i += 9){
        var t = WSV.hitTri(R.o, R.d, [P[i], P[i+1], P[i+2]], [P[i+3], P[i+4], P[i+5]], [P[i+6], P[i+7], P[i+8]]);
        if (t > 0 && (!best || t < best.t)){ var e1 = [P[i+3]-P[i], P[i+4]-P[i+1], P[i+5]-P[i+2]], e2 = [P[i+6]-P[i], P[i+7]-P[i+1], P[i+8]-P[i+2]], n = WSV.norm(WSV.cross(e1, e2));
          if (WSV.dot(n, R.d) > 0) n = [-n[0], -n[1], -n[2]];
          best = {id:pk.id, t:t, p:[R.o[0]+R.d[0]*t, R.o[1]+R.d[1]*t, R.o[2]+R.d[2]*t], n:n}; } } });
    return best;
  }
  var drag = null;
  function dragPlane(origin){
    var e = view.eye(), d = WSV.norm([origin[0]-e[0], origin[1]-e[1], origin[2]-e[2]]);
    if (S.lock){ var ax = {x:[1,0,0], y:[0,1,0], z:[0,0,1]}[S.lock], n = WSV.norm(WSV.cross(ax, WSV.cross(ax, d))); if (Math.hypot(n[0], n[1], n[2]) < 0.1) n = [0,1,0]; return {n:n, ax:ax}; }
    var a = [Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])];
    if (a[1] > 0.2) return {n:[0,1,0]};   /* from above or at an angle: slide along the ground (Y lock for up and down) */
    return {n:a[0] > a[2] ? [1,0,0] : [0,0,1]};   /* looking from the side or front: slide up and along */
  }
  var hooks = {
    tap:function(x, y, ev){
      if (S.layer === 'look') return;
      var h = hit(x, y);
      if (S.placing){ place(S.placing, h, x, y); return; }
      if (!h){ if (!S.multi && !(ev && (ev.shiftKey || ev.metaKey || ev.ctrlKey))) S.sel = []; refresh(); return; }
      var add = S.multi || (ev && (ev.shiftKey || ev.metaKey || ev.ctrlKey));
      if (add){ var k = S.sel.indexOf(h.id); if (k >= 0) S.sel.splice(k, 1); else S.sel.push(h.id); }
      else S.sel = [h.id];
      if (S.tab !== 'piece' && S.tab !== 'paint') S.tab = 'piece';
      refresh();
    },
    doubleTap:function(x, y){ var h = hit(x, y); if (h){ var p = byId(h.id); var B = M.boundsOf(nativesOf(p)); if (B.ok) view.frame(B.mn.map(function(v, i){ return Math.min(v, h.p[i] - 0.3); }), B.mx.map(function(v, i){ return Math.max(v, h.p[i] + 0.3); }), true); } else fitView(true); },
    dragStart:function(x, y){
      if (S.layer === 'look' || S.placing || !S.sel.length) return false;
      var h = hit(x, y); if (!h || S.sel.indexOf(h.id) < 0) return false;
      var pl = dragPlane(h.p), start = WSV.hitPlane(view.ray(x, y).o, view.ray(x, y).d, h.p, pl.n); if (!start) return false;
      commit();
      drag = {pl:pl, at:h.p, start:start, orig:selected().map(function(p){ return {p:p, pos:p.pos.slice()}; })};
      return true;
    },
    drag:function(x, y){
      if (!drag) return; var R = view.ray(x, y), q = WSV.hitPlane(R.o, R.d, drag.at, drag.pl.n); if (!q) return;
      var dv = [q[0]-drag.start[0], q[1]-drag.start[1], q[2]-drag.start[2]];
      if (drag.pl.ax){ var t = WSV.dot(dv, drag.pl.ax); dv = [drag.pl.ax[0]*t, drag.pl.ax[1]*t, drag.pl.ax[2]*t]; }
      dv = dv.map(function(v){ return snapV(v); });
      drag.orig.forEach(function(o){ o.p.pos = [r4(o.pos[0]+dv[0]), r4(o.pos[1]+dv[1]), r4(o.pos[2]+dv[2])]; });
      banner('Moved ' + ['x','y','z'].map(function(a, i){ return a.toUpperCase() + ' ' + (dv[i] >= 0 ? '+' : '') + fmtNum(toUnit(dv[i])); }).join('  ') + ' ' + unitLabel());
      rebuildScene();
    },
    dragEnd:function(tapped){ if (!drag) return; drag = null; banner(null); if (tapped){ S.undo.pop(); return; } changed(false); }
  };

  /* ---------------------------------------------------------------- adding pieces */
  function startPlacing(kind){
    if (S.placing && S.placing.kind === kind.kind && S.placing.key === kind.key){ place(kind, null); return; }
    S.placing = kind; renderTools();
    banner('Tap a face to put the ' + kind.label.toLowerCase() + ' against it, or the ground. Tap the button again to drop it in the middle.');
  }
  function place(kind, h, x, y){
    commit();
    var at, n = [0,1,0], made = [];
    if (h){ at = h.p; n = h.n; }
    else if (x != null){ var R = view.ray(x, y), g = WSV.hitPlane(R.o, R.d, [0, 0, 0], [0, 1, 0]); at = g || view.cam.target.slice(); }
    else at = view.cam.target.slice();
    if (S.layer === 'wheel' && !h) at = [S.doc.setup.wheelW/2 + 0.02, 0, 0];
    var g = S.layer === 'wheel' ? 'wheel' : 'body';
    if (kind.kind === 'shape'){
      var p = M.addPiece({pieces:ownerList()}, kind.key, [0, 0, 0], {g:g, c:S.brush, m:M.guessMaterial(S.brush)});
      if (S.layer !== 'state') {} /* addPiece pushed into ownerList */
      seat(p, at, n, !!h || x != null);
      made = [p];
    } else if (kind.kind === 'prefab'){
      var pf = S.prefabs.filter(function(f){ return f.id === kind.key; })[0]; if (!pf) return;
      var base = [snapV(at[0]), Math.max(0, snapV(at[1])), snapV(at[2])];
      if (S.sym.x && Math.abs(base[0]) < 0.05) base[0] = 0;
      made = M.placePrefab({pieces:ownerList()}, pf, base, g === 'wheel' ? null : undefined);
    }
    S.placing = null; banner(null);
    S.sel = made.map(function(p){ return p.id; }); S.tab = 'piece';
    changed(true); renderTools();
  }
  /* put a new piece flush on the face it was dropped on, snapped to the grid; mirrored when it sits off the symmetry plane */
  function seat(p, at, n, onSurface){
    var B = M.boundsOf(M.toNativeAlways(p)), half = [(B.mx[0]-B.mn[0])/2, (B.mx[1]-B.mn[1])/2, (B.mx[2]-B.mn[2])/2];
    var a = [Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])], k = a[0] > a[1] && a[0] > a[2] ? 0 : a[1] > a[2] ? 1 : 2, s = n[k] >= 0 ? 1 : -1;
    var pos = [snapV(at[0]), snapV(at[1]), snapV(at[2])];
    if (S.faceSnap && onSurface){ pos[k] = at[k] + s*half[k]; if (S.snap) pos[k] = r4(pos[k]); }
    else if (!onSurface) pos[1] = p.g === 'wheel' ? pos[1] : half[1];   /* dropped in the middle: it sits on the ground */
    if (p.g !== 'wheel' && S.layer !== 'state'){
      if (S.sym.x && Math.abs(pos[0]) < Math.max(0.04, half[0]*0.6)) pos[0] = 0; else if (S.sym.x) p.mx = true;
      if (S.sym.z && Math.abs(pos[2]) > 0.04) p.mz = true;
    }
    p.pos = pos.map(r4);
  }

  /* ---------------------------------------------------------------- editing the selection */
  function edit(fn, full){ var sel = selected(); if (!sel.length) return; commit(); sel.forEach(fn); changed(full); }
  function nudge(i, dir){ var st = S.snap || (S.units === 'imp' ? IN : 0.01); edit(function(p){ p.pos[i] = r4(p.pos[i] + dir*st); }); }
  function removeSel(){ if (!S.sel.length) return; commit(); var ids = {}; S.sel.forEach(function(i){ ids[i] = 1; }); var L = ownerList();
    for (var i = L.length - 1; i >= 0; i--) if (ids[L[i].id]) L.splice(i, 1); S.sel = []; changed(true); }
  function duplicate(mirrorCopy){
    var sel = selected(); if (!sel.length) return; commit(); var L = ownerList(), out = [], st = S.snap || 0.05;
    sel.forEach(function(p){ var q = clone(p); q.id = M.newId({pieces:L});
      if (mirrorCopy){ q.pos[0] = -q.pos[0]; q.rot = [q.rot[0], -q.rot[1], -q.rot[2]]; mirrorShapeX(q); q.mx = false; }
      else if (p.mx && Math.abs(p.pos[0]) > 0) q.pos[2] = r4(q.pos[2] - Math.max(st, 0.1)); else q.pos[0] = r4(q.pos[0] + Math.max(st, 0.1));
      L.push(q); out.push(q.id); });
    S.sel = out; changed(true);
  }
  /* turn an editor piece into its mirror image (so a copied left part is a right part) */
  function mirrorShapeX(q){
    if (q.s === 'poly' || q.s === 'decal'){ q.v = q.v.map(function(v){ return [-v[0], v[1], v[2]]; }); if (q.n) q.n = [-q.n[0], q.n[1], q.n[2]]; }
    else if (q.s === 'loft'){ var tmp = M.mirrorX({s:'loft', p:[0,0,0], r:q.r, ax:q.ax, n:q.n, rot:q.lrot, ang:q.ang, closed:q.closed}); q.r = tmp.r; if (tmp.ang){ q.ang = tmp.ang; delete q.lrot; delete q.n; } }
  }
  function selectAll(){ S.sel = active().map(function(p){ return p.id; }); refresh(); }

  /* ---------------------------------------------------------------- toolbar */
  var ICON = {
    box:'<svg viewBox="0 0 30 24"><path d="M6 8l9-4 9 4v9l-9 4-9-4z M6 8l9 4 9-4 M15 12v9" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    bev:'<svg viewBox="0 0 30 24"><path d="M8 7l7-3 7 3 2 2v7l-2 2-7 3-7-3-2-2V9z M6 9l9 4 9-4 M15 13v8" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    wedge:'<svg viewBox="0 0 30 24"><path d="M4 19l20-2V6z M4 19l6 3 20-3-6-2 M24 6l6 2v11" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    cyl:'<svg viewBox="0 0 30 24"><ellipse cx="15" cy="6" rx="8" ry="3" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4"/><path d="M7 6v12c0 2 4 3 8 3s8-1 8-3V6" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4"/></svg>',
    tube:'<svg viewBox="0 0 30 24"><path d="M5 9l18-3 3 3v6l-3 3-18-3z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="23" cy="12" rx="3" ry="6" fill="#f3dcc4" stroke="#3d3029" stroke-width="1.4"/></svg>',
    cone:'<svg viewBox="0 0 30 24"><path d="M15 3L6 18c0 2 4 3 9 3s9-1 9-3z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    plate:'<svg viewBox="0 0 30 24"><path d="M5 7l16-3 4 13-16 3z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    prefab:'<svg viewBox="0 0 30 24"><path d="M5 8h9v9H5z M16 5h9v9h-9z M12 13h9v8h-9z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.3"/></svg>'
  };
  function renderTools(){
    var h = '<div class="grp">Add</div>';
    M.SHAPE_ORDER.forEach(function(k){ var on = S.placing && S.placing.kind === 'shape' && S.placing.key === k;
      h += '<button class="tool' + (on ? ' on' : '') + '" data-add="' + k + '" title="Add a ' + M.SHAPES[k].label.toLowerCase() + '">' + ICON[k] + M.SHAPES[k].label + '</button>'; });
    if (S.prefabs.length){ h += '<div class="grp">Prefabs</div>'; S.prefabs.forEach(function(pf){ var on = S.placing && S.placing.kind === 'prefab' && S.placing.key === pf.id;
      h += '<button class="tool' + (on ? ' on' : '') + '" data-pf="' + esc(pf.id) + '">' + ICON.prefab + esc(pf.name.slice(0, 12)) + '</button>'; }); }
    h += '<div class="grp">Build</div>';
    h += '<button class="tool' + (S.sym.x ? ' on' : '') + '" data-t="symx" title="Mirror new pieces left and right">' + '<svg viewBox="0 0 30 24"><path d="M15 2v20" stroke="#b5523d" stroke-width="2" stroke-dasharray="3 2"/><path d="M4 8h7v8H4z M19 8h7v8h-7z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.3"/></svg>L | R</button>';
    h += '<button class="tool' + (S.sym.z ? ' on' : '') + '" data-t="symz" title="Mirror new pieces front and back">' + '<svg viewBox="0 0 30 24"><path d="M3 12h24" stroke="#4e7393" stroke-width="2" stroke-dasharray="3 2"/><path d="M11 2h8v7h-8z M11 15h8v7h-8z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.3"/></svg>F | B</button>';
    h += '<button class="tool' + (S.faceSnap ? ' on' : '') + '" data-t="face" title="New pieces land flush on the face you tap">' + '<svg viewBox="0 0 30 24"><path d="M4 16h22v5H4z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.3"/><path d="M10 6h10v10H10z" fill="#f3dcc4" stroke="#3d3029" stroke-width="1.3"/><path d="M15 1v4" stroke="#c67139" stroke-width="2"/></svg>Face snap</button>';
    h += '<button class="tool" data-t="snap" title="Grid step for moving">' + '<svg viewBox="0 0 30 24"><path d="M5 4v16M11 4v16M17 4v16M23 4v16M3 6h24M3 12h24M3 18h24" stroke="#3d3029" stroke-width="1"/></svg>Grid ' + (SNAPS[S.units].filter(function(s){ return Math.abs(s[0] - S.snap) < 1e-9; })[0] || [0, '?'])[1] + '</button>';
    h += '<button class="tool" data-t="lock" title="Lock dragging to one direction">' + '<svg viewBox="0 0 30 24"><path d="M4 12h22M22 8l4 4-4 4M8 8l-4 4 4 4" fill="none" stroke="' + (S.lock ? '#c67139' : '#3d3029') + '" stroke-width="1.8"/></svg>' + (S.lock ? 'Move ' + S.lock.toUpperCase() : 'Move free') + '</button>';
    h += '<button class="tool' + (S.multi ? ' on' : '') + '" data-t="multi" title="Tap several pieces to select them together">' + '<svg viewBox="0 0 30 24"><path d="M4 4h9v9H4z M17 11h9v9h-9z" fill="none" stroke="#3d3029" stroke-width="1.4" stroke-dasharray="2 1.5"/><path d="M7 7l3 3M20 14l3 3" stroke="#c67139" stroke-width="2"/></svg>Pick many</button>';
    $('tools').innerHTML = h;
  }
  $('tools').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.add) return startPlacing({kind:'shape', key:b.dataset.add, label:M.SHAPES[b.dataset.add].label});
    if (b.dataset.pf){ var pf = S.prefabs.filter(function(f){ return f.id === b.dataset.pf; })[0]; return startPlacing({kind:'prefab', key:pf.id, label:pf.name}); }
    var t = b.dataset.t;
    if (t === 'symx') S.sym.x = !S.sym.x;
    else if (t === 'symz') S.sym.z = !S.sym.z;
    else if (t === 'face'){ S.faceSnap = !S.faceSnap; store.set('faceSnap', S.faceSnap); }
    else if (t === 'snap'){ var L = SNAPS[S.units], i = 0; L.forEach(function(s, k){ if (Math.abs(s[0] - S.snap) < 1e-9) i = k; }); S.snap = L[(i + 1) % L.length][0]; store.set('snap', S.snap); }
    else if (t === 'lock'){ S.lock = S.lock === null ? 'x' : S.lock === 'x' ? 'y' : S.lock === 'y' ? 'z' : null; }
    else if (t === 'multi') S.multi = !S.multi;
    renderTools(); sceneDecor();
  });

  /* ---------------------------------------------------------------- layer bar and preview toggles */
  function renderBars(){
    var h = '<button class="sm ' + (S.layer === 'car' ? 'on' : 'alt') + '" data-l="car">Car</button><button class="sm ' + (S.layer === 'wheel' ? 'on' : 'alt') + '" data-l="wheel">Wheel</button>' +
      '<button class="sm ' + (S.layer === 'look' ? 'on' : 'alt') + '" data-l="look">Damage</button>';
    if (S.layer === 'state') h += '<button class="sm on" data-l="state">Editing: ' + esc(stateLabel(S.state)) + '</button><button class="sm alt" data-l="car">Done</button>';
    $('layerBar').innerHTML = h;
    var p = '';
    if (S.layer === 'car') p = tog('bonnet', 'Bonnet open') + tog('boot', 'Boot open') + tog('markers', 'Inside parts') + tog('person', 'Person') + tog('planes', 'Planes');
    else if (S.layer === 'look') p = '<select id="lookSel">' + D.LOOKS.map(function(l){ return '<option value="' + l.key + '"' + (l.key === S.look ? ' selected' : '') + '>' + l.label + '</option>'; }).join('') + '</select>';
    $('previewBar').innerHTML = p;
    var ls = $('lookSel'); if (ls) ls.onchange = function(){ S.look = ls.value; rebuildScene(); };
  }
  function tog(k, label){ return '<button class="sm ' + (S.preview[k] ? 'on' : 'alt') + '" data-p="' + k + '">' + label + '</button>'; }
  $('layerBar').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; var l = b.dataset.l;
    if (l === 'state') return; S.layer = l; S.sel = []; S.placing = null; banner(null); if (l !== 'state') S.state = null;
    if (l === 'look') S.tab = 'damage'; refresh(true); fitView(true); });
  $('previewBar').addEventListener('click', function(e){ var b = e.target.closest('button[data-p]'); if (!b) return; S.preview[b.dataset.p] = !S.preview[b.dataset.p]; renderBars(); rebuildScene(); });
  $('viewBar').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; if (b.dataset.v === 'fit') fitView(true); else view.preset(b.dataset.v); });

  /* ---------------------------------------------------------------- side panel */
  var TABS = [['piece', 'Piece'], ['car', 'Car'], ['paint', 'Paint'], ['damage', 'Damage'], ['check', 'Check']];
  function renderTabs(){ $('tabs').innerHTML = TABS.map(function(t){ return '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join(''); }
  $('tabs').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; S.tab = b.dataset.tab; renderTabs(); renderPanel(); });

  /* a number field with - and + buttons, in the chosen units ('len'), degrees ('deg'), percent ('pct') or plain */
  var fieldSeq = 0, fields = {};
  function num(label, value, kind, set, opt){
    opt = opt || {}; var id = 'f' + (fieldSeq++), shown;
    if (kind === 'len') shown = fmtNum(toUnit(value)); else if (kind === 'pct') shown = Math.round(value*100); else shown = fmtNum(value);
    fields[id] = {kind:kind, set:set, step:opt.step, min:opt.min, max:opt.max};
    return '<div class="num">' + (opt.ax ? '<span class="ax ' + opt.ax + '">' + opt.ax.toUpperCase() + '</span>' : '') +
      '<button data-f="' + id + '" data-d="-1">−</button><input id="' + id + '" inputmode="decimal" value="' + shown + '" aria-label="' + esc(label) + '"><button data-f="' + id + '" data-d="1">+</button></div>';
  }
  function fieldValue(id, raw){
    var F = fields[id], v = parseFloat(String(raw).replace(',', '.')); if (!isFinite(v)) return null;
    if (F.kind === 'len') v = fromUnit(v); else if (F.kind === 'pct') v = v/100;
    if (F.min != null) v = Math.max(F.min, v); if (F.max != null) v = Math.min(F.max, v);
    return v;
  }
  function stepOf(F){ if (F.step) return F.step; if (F.kind === 'len') return S.snap || (S.units === 'imp' ? IN : 0.01); if (F.kind === 'deg') return 15; if (F.kind === 'pct') return 0.05; return 1; }
  $('body').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.f){ var F = fields[b.dataset.f], inp = $(b.dataset.f), cur = fieldValue(b.dataset.f, inp.value); if (cur == null) return;
      var v = cur + (+b.dataset.d)*stepOf(F); if (F.min != null) v = Math.max(F.min, v); if (F.max != null) v = Math.min(F.max, v); F.set(r4(v)); return; }
    var a = b.dataset.a; if (a && ACTIONS[a]) ACTIONS[a](b);
  });
  $('body').addEventListener('change', function(e){
    var t = e.target;
    if (fields[t.id]){ var v = fieldValue(t.id, t.value); if (v != null) fields[t.id].set(r4(v)); return; }
    if (t.dataset.k && CHANGES[t.dataset.k]) CHANGES[t.dataset.k](t);
  });
  $('body').addEventListener('keydown', function(e){ if (e.key === 'Enter' && fields[e.target.id]){ e.target.blur(); } });

  function renderPanel(){
    fieldSeq = 0; fields = {};
    var f = {piece:panelPiece, car:panelCar, paint:panelPaint, damage:panelDamage, check:panelCheck}[S.tab];
    $('body').innerHTML = f();
  }
  function shapeName(p){
    if (p.s === 'loft') return p.r.length === 2 && (p.r[1][3] === 0 || p.r[0][3] === 0) ? 'Cone' : 'Tube';
    return {box:'Block', bev:'Soft block', wedge:'Slope', cyl:'Cylinder', decal:'Plate', poly:'Shaped piece'}[p.s] || p.s;
  }
  function simpleTube(p){ return p.s === 'loft' && p.r.length === 2 && !p.ang && p.r.every(function(r){ return r.length <= 5 && !r[0] && (p.ax === 'y' ? !r[2] : p.ax === 'x' ? !r[2] && !r[1] : !r[1]) && (p.ax === 'z' ? !r[0] && !r[1] : true); }); }
  function rectPlate(p){ return p.s === 'decal' && p.v.length === 4 && !p.v.some(function(v){ return Math.abs(v[2]) > 1e-6; }) && Math.abs(p.v[0][0] + p.v[1][0]) < 1e-6 && Math.abs(p.v[0][1] - p.v[1][1]) < 1e-6 && (p.n || [0,0,1])[2] > 0.999; }

  function panelPiece(){
    var sel = selected();
    if (!sel.length){
      var hint = S.layer === 'wheel' ? 'This is one wheel; the game puts it at all four corners and turns the left two round. Its outside face points right (+X).' :
        S.layer === 'state' ? 'You are editing this damage look by hand. Tap a piece to change it, or go back to automatic on the Damage tab.' :
        'Pick a shape on the left, then tap where it goes: it lands flush on the face you tap. Tap a piece to select it; drag a selected piece to move it. Two fingers zoom and pan.';
      return '<span class="stamp">Piece</span><p>' + hint + '</p>' +
        '<div class="row"><button class="alt sm" data-a="selAll">Select all</button>' + (S.layer === 'car' && S.doc.pieces.some(function(p){ return p.hidden; }) ? '<button class="alt sm" data-a="selHidden">Select inside parts</button>' : '') + '</div>' +
        (S.layer === 'car' && S.doc.pieces.filter(function(p){ return p.g !== 'wheel'; }).length < 2 ? '<div class="card"><h3>Starting out</h3><p>Lay a long Block on the ground for the floor of the car, a shorter one on top for the cabin, Slopes for the bonnet and windscreen. Turn on <b>L | R</b> (on by default) so every piece off the middle is mirrored.</p><p>Or open one of the design chat\'s cars from <b>Designs</b> and change it.</p></div>' : '') +
        '<div class="card"><h3>Keys (keyboard)</h3><p class="muted">Delete removes · Ctrl+D duplicates · Ctrl+Z undo · arrows move left/right and front/back, Page Up/Down up and down · M mirror · F fit · Esc stop adding</p></div>';
    }
    if (sel.length > 1) return panelMany(sel);
    var p = sel[0], h = '<span class="stamp">' + esc(shapeName(p)) + '</span> <span class="muted">' + esc(p.name || p.id) + '</span>';
    h += '<div class="row"><label class="l">Name</label><input class="grow" type="text" data-k="name" value="' + esc(p.name || '') + '" placeholder="e.g. left door"></div>';
    if (p.g !== 'wheel' && S.layer === 'car') h += '<div class="row"><label class="l">Part of</label><select class="grow" data-k="g">' + [['body','Body'],['bonnet','Bonnet (opens)'],['boot','Boot lid (opens)']].map(function(o){ return '<option value="' + o[0] + '"' + (p.g === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    h += '<div class="card"><h3>Where (' + unitLabel() + ')</h3><div class="trio">' + ['x','y','z'].map(function(a, i){ return num(a, p.pos[i], 'len', function(v){ edit(function(q){ q.pos[i] = v; }); }, {ax:a}); }).join('') + '</div>' +
      '<p class="muted">X right, Y up, Z forward. The car\'s middle is X 0, the ground Y 0.</p></div>';
    h += '<div class="card"><h3>Size</h3>' + sizeFields(p) + '</div>';
    h += '<div class="card"><h3>Turn (degrees)</h3><div class="trio">' + ['x','y','z'].map(function(a, i){ return num(a, p.rot[i], 'deg', function(v){ edit(function(q){ q.rot[i] = v; }); }, {ax:a}); }).join('') + '</div>' +
      '<div class="row"><button class="alt sm" data-a="turnY">Quarter turn</button><button class="alt sm" data-a="unturn">Square up</button></div>' +
      (p.rot[0] || p.rot[2] || (p.rot[1] % 90) ? '<p class="muted">A turn that is not a quarter turn about Y is saved as a shaped piece, exactly as you see it.</p>' : '') + '</div>';
    h += '<div class="card"><h3>Look</h3><div class="row"><label class="l">Colour</label><button class="sw" style="background:' + esc(M.colourHex(S.doc, PAL, p.c).hex) + '" data-a="toPaint"></button><span class="muted">' + esc(colourLabel(p.c)) + '</span>' +
      '<label><input type="checkbox" data-k="dark"' + (/_D$/.test(p.c) ? ' checked' : '') + '>Shade</label></div>' +
      '<div class="swatches">' + quickSwatches(p.c) + '</div>' +
      '<div class="row"><label><input type="checkbox" data-k="glow"' + (p.glow ? ' checked' : '') + '>Glows (lamps)</label></div></div>';
    h += '<div class="card"><h3>What it is</h3><div class="row"><label class="l">Material</label><select class="grow" data-k="m">' + Object.keys(M.MATERIALS).map(function(k){ return '<option value="' + k + '"' + ((p.m || M.guessMaterial(p.c)) === k ? ' selected' : '') + '>' + M.MATERIALS[k].label + '</option>'; }).join('') + '</select></div>' +
      (p.g !== 'wheel' ? '<div class="row"><label class="l">Job</label><select class="grow" data-k="fn"><option value="">None</option>' + Object.keys(M.FUNCTIONS).map(function(k){ return '<option value="' + k + '"' + (p.fn === k ? ' selected' : '') + '>' + M.FUNCTIONS[k].label + '</option>'; }).join('') + '</select></div>' +
        (p.fn ? '<p class="muted">' + esc(M.FUNCTIONS[p.fn].hint) + '</p>' : '') +
        '<div class="row"><label><input type="checkbox" data-k="hidden"' + (p.hidden ? ' checked' : '') + '>Inside part (not drawn in the game)</label></div>' : '') + '</div>';
    if (S.layer !== 'state' && p.g !== 'wheel') h += '<div class="card"><h3>Symmetry</h3><div class="row"><label><input type="checkbox" data-k="mx"' + (p.mx ? ' checked' : '') + '>Mirror left / right</label><label><input type="checkbox" data-k="mz"' + (p.mz ? ' checked' : '') + '>Mirror front / back</label></div></div>';
    h += actionsRow(1);
    return h;
  }
  function panelMany(sel){
    var h = '<span class="stamp">' + sel.length + ' pieces</span>';
    h += '<div class="card"><h3>Move together</h3><div class="trio">' + ['x','y','z'].map(function(a, i){ return '<div class="num"><span class="ax ' + a + '">' + a.toUpperCase() + '</span><button data-a="nudge" data-i="' + i + '" data-d="-1">−</button><button data-a="nudge" data-i="' + i + '" data-d="1">+</button></div>'; }).join('') + '</div><p class="muted">Each tap moves one grid step. Or drag any selected piece.</p></div>';
    h += '<div class="card"><h3>Look</h3><div class="swatches">' + quickSwatches(null) + '</div></div>';
    h += '<div class="card"><h3>What they are</h3><div class="row"><label class="l">Material</label><select class="grow" data-k="m"><option value="">(mixed)</option>' + Object.keys(M.MATERIALS).map(function(k){ return '<option value="' + k + '">' + M.MATERIALS[k].label + '</option>'; }).join('') + '</select></div>' +
      (S.layer === 'car' ? '<div class="row"><label class="l">Part of</label><select class="grow" data-k="g"><option value="">(mixed)</option><option value="body">Body</option><option value="bonnet">Bonnet</option><option value="boot">Boot lid</option></select></div>' : '') + '</div>';
    h += '<div class="card"><h3>Prefab</h3><p class="muted">Save these pieces to place again on any design (a headlight cluster, a grille, a roof rack). Prefabs go into packs too.</p><div class="row"><input class="grow" id="pfName" type="text" placeholder="Prefab name"><button class="sm" data-a="prefab">Save prefab</button></div></div>';
    h += actionsRow(sel.length);
    return h;
  }
  function actionsRow(n){
    return '<div class="row" style="margin-top:12px"><button class="alt sm" data-a="dup">Duplicate</button>' + (S.layer !== 'state' ? '<button class="alt sm" data-a="mirrorCopy">Mirrored copy</button>' : '') +
      (n === 1 ? '<button class="alt sm" data-a="prefabOne">Save as prefab</button>' : '') + '<button class="sm" style="background:var(--bad);box-shadow:0 3px 0 #6e2414" data-a="del">Delete</button></div>';
  }
  function sizeFields(p){
    var L = function(lbl, v, set, ax){ return num(lbl, v, 'len', set, {min:0.002, ax:ax}); };
    if (p.d) return '<div class="trio">' + [['x','width'],['y','height'],['z','length']].map(function(a, i){ return L(a[1], p.d[i], function(v){ edit(function(q){ q.d[i] = v; }); }, a[0]); }).join('') + '</div>' +
      '<p class="muted">Width (X), height (Y), length (Z) before turning, in ' + unitLabel() + '.</p>' +
      (p.s === 'wedge' ? '<div class="row"><label><input type="checkbox" data-k="fy"' + (p.fy ? ' checked' : '') + '>Upside down</label></div>' : '') +
      (p.s === 'cyl' ? '<div class="row"><label class="l">Runs along</label><select data-k="ax">' + ['x','y','z'].map(function(a){ return '<option' + ((p.ax || 'y') === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' : '');
    if (simpleTube(p)){
      var ia = p.ax === 'x' ? 0 : p.ax === 'y' ? 1 : 2, len = Math.abs(p.r[1][ia] - p.r[0][ia]);
      var setR = function(k, j){ return function(v){ edit(function(q){ q.r[k][j] = v/2; }); }; };
      return '<div class="row"><label class="l">Length</label>' + L('length', len, function(v){ edit(function(q){ var s = q.r[1][ia] >= q.r[0][ia] ? 1 : -1; q.r[0][ia] = -s*v/2; q.r[1][ia] = s*v/2; }); }) + '</div>' +
        '<div class="row"><label class="l">Start across</label>' + L('start width', p.r[0][3]*2, setR(0, 3)) + L('start height', p.r[0][4]*2, setR(0, 4)) + '</div>' +
        '<div class="row"><label class="l">End across</label>' + num('end width', p.r[1][3]*2, 'len', setR(1, 3), {min:0}) + num('end height', p.r[1][4]*2, 'len', setR(1, 4), {min:0}) + '</div>' +
        '<div class="row"><label class="l">Sides</label>' + num('sides', p.n || 8, 'n', function(v){ edit(function(q){ q.n = Math.round(v); }); }, {min:3, max:16, step:1}) + '</div>' +
        '<div class="row"><label class="l">Runs along</label><select data-k="tax">' + ['x','y','z'].map(function(a){ return '<option' + ((p.ax || 'y') === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
        '<p class="muted">An end of 0 across makes a point (a cone or a spike).</p>';
    }
    if (rectPlate(p)){
      var w = Math.abs(p.v[1][0] - p.v[0][0]), hh = Math.abs(p.v[2][1] - p.v[1][1]);
      return '<div class="trio">' + L('width', w, function(v){ edit(function(q){ q.v = [[-v/2,-hh/2,0],[v/2,-hh/2,0],[v/2,hh/2,0],[-v/2,hh/2,0]]; }); }, 'x') + L('height', hh, function(v){ edit(function(q){ q.v = [[-w/2,-v/2,0],[w/2,-v/2,0],[w/2,v/2,0],[-w/2,v/2,0]]; }); }, 'y') + '</div>' +
        '<p class="muted">A plate is flat and shows from the front (+Z) only.</p><div class="row"><label><input type="checkbox" data-k="both"' + (p.both ? ' checked' : '') + '>Show both sides</label></div>';
    }
    return '<div class="trio">' + ['x','y','z'].map(function(a, i){ return num('scale ' + a, (p.scl || [1,1,1])[i], 'pct', function(v){ edit(function(q){ q.scl = (q.scl || [1,1,1]).slice(); q.scl[i] = Math.max(0.01, v); }); }, {ax:a}); }).join('') + '</div><p class="muted">Stretch in percent. This piece came from a finished model, so it scales as a whole.</p>';
  }
  var QUICK = ['paint1','paint2','paint3','glass','glassL','chrome','black','white','underside','tyre','hub','head','tail','lamp','seat','plastic','rust','metal','steel','plateW'];
  function quickSwatches(cur){
    var list = QUICK.concat(Object.keys(S.doc.colours));
    return list.map(function(c){ return '<button class="sw' + (c === cur ? ' on' : '') + '" title="' + esc(colourLabel(c)) + '" style="background:' + esc(M.colourHex(S.doc, PAL, c).hex) + '" data-a="col" data-c="' + esc(c) + '"></button>'; }).join('') +
      '<button class="alt sm" data-a="toPaint">More…</button>';
  }
  function colourLabel(c){ c = String(c).replace(/_D$/, ''); return {paint1:'Paint 1', paint2:'Paint 2', paint3:'Paint 3'}[c] || (M.isCustom(c) ? 'Your colour #' + c.slice(1) : c); }

  function panelCar(){
    var d = S.doc, s = d.setup, A = asset(), sp = A.spec, g = A.game;
    var h = '<span class="stamp">Car</span>';
    h += '<div class="row"><label class="l">Name</label><input class="grow" type="text" data-k="docName" value="' + esc(d.name) + '"></div>';
    h += '<div class="row"><label class="l">Kind</label><select class="grow" data-k="cls">' + [['car','Car'],['pickup','Pickup'],['van','Van'],['truck','Truck']].map(function(o){ return '<option value="' + o[0] + '"' + (d.cls === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    h += '<div class="row"><label class="l">Made by</label><input class="grow" type="text" data-k="author" value="' + esc(d.author || '') + '" placeholder="your name"></div>';
    h += '<div class="card"><h3>Wheels</h3>' +
      '<div class="row"><label class="l">Size across</label>' + num('wheel size', s.wheelR*2, 'len', function(v){ setup(function(st){ st.wheelR = r4(v/2); }); }, {min:0.2}) + '</div>' +
      '<div class="row"><label class="l">Tyre width</label>' + num('tyre width', s.wheelW, 'len', function(v){ setup(function(st){ st.wheelW = v; }); }, {min:0.05}) + '</div>' +
      '<div class="row"><label class="l">Apart</label>' + num('track', s.track*2, 'len', function(v){ setup(function(st){ st.track = r4(v/2); }); }, {min:0.3}) + '</div>' +
      '<div class="row"><label class="l">Front axle</label>' + num('front axle', s.axles[0], 'len', function(v){ setup(function(st){ st.axles[0] = v; }); }, {ax:'z'}) + '</div>' +
      '<div class="row"><label class="l">Rear axle</label>' + num('rear axle', s.axles[1], 'len', function(v){ setup(function(st){ st.axles[1] = v; }); }, {ax:'z'}) + '</div>' +
      '<div class="row"><label class="l">Arch room</label>' + num('arch clearance', s.archClear, 'len', function(v){ setup(function(st){ st.archClear = v; }); }, {min:0}) + '</div>' +
      '<div class="row"><button class="alt sm" data-a="makeWheel">Make a new plain wheel at this size</button></div>' +
      '<p class="muted">Arch room is the gap over the tyre; bigger tyres from the vehicle kit lift the car to clear it.</p></div>';
    h += '<div class="card"><h3>Load bed</h3><div class="row"><label><input type="checkbox" data-k="bed"' + (s.bed ? ' checked' : '') + '>Has an open load bed (pickups, flatbeds)</label></div>' +
      (s.bed ? '<div class="row"><label class="l">Floor height</label>' + num('bed y', s.bed.y, 'len', function(v){ setup(function(st){ st.bed.y = v; }); }) + '</div><div class="row"><label class="l">Middle</label>' + num('bed z', s.bed.z, 'len', function(v){ setup(function(st){ st.bed.z = v; }); }, {ax:'z'}) + '</div>' +
        '<div class="row"><label class="l">Size</label>' + num('bed width', s.bed.w, 'len', function(v){ setup(function(st){ st.bed.w = v; }); }, {ax:'x'}) + num('bed length', s.bed.d, 'len', function(v){ setup(function(st){ st.bed.d = v; }); }, {ax:'z'}) + '</div>' : '') + '</div>';
    h += '<div class="card"><h3>On the road</h3><div class="row"><label class="l">Fuel tank</label><select class="grow" data-k="tank">' + [['small','Small (about 250 miles)'],['medium','Medium (about 350 miles)'],['large','Large (about 450 miles)']].map(function(o){ return '<option value="' + o[0] + '"' + (s.tank === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><label class="l">Top speed</label>' + num('top speed', s.topSpeed || 85, 'n', function(v){ setup(function(st){ st.topSpeed = Math.round(v); }); }, {min:10, max:160, step:5}) + '<span class="muted">mph</span></div></div>';
    h += '<div class="card"><h3>What the game will get</h3><table>' +
      tr('Seats', g.seats) + tr('Drives', g.driveable ? 'yes' : 'no (needs an engine and a seat)') + tr('Range on a full tank', g.rangeMiles ? g.rangeMiles + ' miles' : 'no tank') +
      tr('Cargo', g.cargoSlots + ' slots') + tr('Sleeps', g.sleeps || '—') + tr('Engine', g.power) +
      tr('Length', fmtLen(sp.length)) + tr('Width', fmtLen(sp.width)) + tr('Roof', fmtLen(sp.roof.y)) + tr('Wheelbase', fmtLen(s.axles[0] - s.axles[1])) + tr('Ground clearance', fmtLen(sp.ground)) +
      '</table><p class="muted">Seats, range, cargo and lights come from the pieces you give a Job (Piece tab).</p></div>';
    h += '<div class="card"><h3>Salvage and build cost</h3><table>' + Object.keys(A.salvage).map(function(k){ return tr(k.replace(/_/g, ' '), A.salvage[k] + ' → ' + (A.buildCost[k] || '—')); }).join('') +
      '</table><p class="muted">Left: what taking it apart gives. Right: what building it from the design would cost (for the game to use).</p></div>';
    return h;
  }
  var sedanTris = 0;
  function stockSedanTris(){ if (!sedanTris){ var V = PROPS.models.vehicles.sedan; sedanTris = SH.count(V.body.concat(V.bonnet || [], V.boot || [])) + 4*SH.count(V.wheel); } return sedanTris; }
  function tr(a, b){ return '<tr><td>' + esc(a) + '</td><td class="n">' + esc(b) + '</td></tr>'; }
  function setup(fn){ commit(); fn(S.doc.setup); changed(true); }

  function panelPaint(){
    var d = S.doc, sel = selected(), cur = sel.length === 1 ? sel[0].c : S.brush;
    var h = '<span class="stamp">Paint</span><p>' + (sel.length ? 'Tap a colour to paint the selected piece' + (sel.length > 1 ? 's' : '') + '.' : 'Tap a colour to use it for new pieces.') + '</p>';
    h += '<div class="card"><h3>The car\'s paint</h3><p class="muted">Pieces in Paint 1, 2 or 3 take these colours. Players can repaint them in the game; found cars come in other colours.</p>' +
      ['paint1','paint2','paint3'].map(function(k){ return '<div class="row"><button class="sw' + (cur === k ? ' on' : '') + '" style="background:' + esc(d.paint[k]) + '" data-a="col" data-c="' + k + '"></button><label class="l">' + colourLabel(k) + '</label><input type="color" data-k="paint" data-slot="' + k + '" value="' + esc(d.paint[k]) + '"></div>'; }).join('') + '</div>';
    h += '<div class="card"><h3>Your colours</h3><div class="swatches">' + Object.keys(d.colours).map(function(c){ return '<button class="sw' + (cur === c ? ' on' : '') + '" style="background:' + esc(d.colours[c]) + '" data-a="col" data-c="' + esc(c) + '"></button>'; }).join('') +
      '</div><div class="row"><input type="color" id="newCol" value="#6a7a5a"><button class="alt sm" data-a="addCol">Add colour</button></div><p class="muted">The game shares one palette; your own colours travel inside the pack.</p></div>';
    var keys = Object.keys(PAL).filter(function(k){ return !/^paint/.test(k); });
    h += '<div class="card"><h3>Game palette</h3><div class="swatches">' + keys.map(function(c){ return '<button class="sw' + (cur === c ? ' on' : '') + '" title="' + esc(c) + '" style="background:' + esc(PAL[c]) + '" data-a="col" data-c="' + esc(c) + '"></button>'; }).join('') + '</div></div>';
    return h;
  }
  function stateLabel(k){ return {body_crumple_light:'Body, light crumple', body_crumple_heavy:'Body, heavy crumple', body_bumper_bent:'Body, bent bumper', bonnet_crumple_light:'Bonnet, light crumple', bonnet_crumple_heavy:'Bonnet, heavy crumple', bonnet_buckled:'Bonnet, buckled',
    windscreen_cracked:'Cracked windscreen', windscreen_missing:'Missing windscreen', smoke:'Smoke', fire:'Fire', 'wreck.body':'Old wreck, body', 'wreck.bonnet':'Old wreck, bonnet', 'wreck.wheel':'Old wreck, wheel', 'burnt.body':'Burnt shell, body', 'burnt.bonnet':'Burnt shell, bonnet', 'burnt.wheel':'Burnt shell, wheel'}[k] || k; }
  function panelDamage(){
    var d = S.doc, A = asset();
    var h = '<span class="stamp">Damage</span><p>Made from your car automatically: the game shows these as it gets hurt. Change the strength or roll a new variation; edit any one by hand if you want.</p>';
    h += '<div class="row"><button class="' + (S.layer === 'look' ? 'on' : 'alt') + ' sm" data-a="showLooks">Show the damage looks</button></div>';
    h += '<div class="card"><h3>Automatic damage</h3><div class="row"><label class="l">Strength</label><input class="grow" type="range" min="0.3" max="1.8" step="0.1" data-k="dstr" value="' + (d.dmg.strength || 1) + '"></div>' +
      '<div class="row"><button class="alt sm" data-a="reroll">New variation</button><span class="muted">variation ' + d.dmg.seed + '</span></div></div>';
    var keys = Object.keys(A.model.damage).concat(['wreck.body','wreck.bonnet','wreck.wheel','burnt.body','burnt.bonnet','burnt.wheel']);
    h += '<div class="card"><h3>Each piece of damage</h3><div class="list">' + keys.map(function(k){
      var own = !!d.states[k], n = own ? '' : '';
      return '<div class="it"><span class="nm">' + esc(stateLabel(k)) + (own ? ' <b style="color:var(--clayDeep)">· by hand</b>' : '') + '</span>' +
        '<button class="alt sm" data-a="editState" data-s="' + k + '">Edit</button>' + (own ? '<button class="alt sm" data-a="autoState" data-s="' + k + '">Automatic</button>' : '') + '</div>'; }).join('') + '</div></div>';
    return h;
  }
  function panelCheck(){
    var A = asset(), C = M.check(S.doc, A), tot = A.stats.total;
    var h = '<span class="stamp">Check</span>';
    h += C.length ? C.map(function(c){ return '<div class="msg ' + c[0] + '">' + esc(c[1]) + '</div>'; }).join('') : '<div class="msg info">Ready for the game.</div>';
    h += '<div class="card"><h3>Detail budget</h3><div class="meter"><i style="width:' + Math.min(100, tot/30) + '%;background:' + (tot > 3000 ? 'var(--bad)' : tot > 1500 ? 'var(--ochre)' : 'var(--sage)') + '"></i></div>' +
      '<table>' + tr('Body, bonnet, boot', A.stats.body + ' triangles') + tr('Each wheel', A.stats.wheel + ' triangles') + tr('Whole car', tot + ' triangles') + tr('Stock sedan for comparison', stockSedanTris() + ' triangles') + '</table>' +
      '<p class="muted">Like the performance limits in building games: towns park dozens of cars, so lighter cars keep phones smooth.</p></div>';
    h += '<div class="card"><h3>Pieces</h3><table>' + tr('Pieces you placed', S.doc.pieces.filter(function(p){ return !p.hidden; }).length) + tr('Inside parts', S.doc.pieces.filter(function(p){ return p.hidden; }).length) +
      tr('Mirrored', S.doc.pieces.filter(function(p){ return p.mx || p.mz; }).length) + tr('Pack size', Math.round(JSON.stringify(A).length/1024) + ' KB') + '</table></div>';
    h += '<div class="card"><h3>Units</h3><div class="row"><button class="' + (S.units === 'imp' ? 'on' : 'alt') + ' sm" data-a="units" data-u="imp">Inches and feet</button><button class="' + (S.units === 'met' ? 'on' : 'alt') + ' sm" data-a="units" data-u="met">Centimetres and metres</button></div></div>';
    return h;
  }

  /* ---------------------------------------------------------------- panel actions */
  var ACTIONS = {
    selAll:selectAll,
    selHidden:function(){ S.sel = S.doc.pieces.filter(function(p){ return p.hidden; }).map(function(p){ return p.id; }); refresh(); },
    del:removeSel, dup:function(){ duplicate(false); }, mirrorCopy:function(){ duplicate(true); },
    turnY:function(){ edit(function(p){ p.rot[1] = ((p.rot[1] || 0) + 90) % 360; }); },
    unturn:function(){ edit(function(p){ p.rot = [0, Math.round((p.rot[1] || 0)/90)*90 % 360, 0]; }); },
    nudge:function(b){ nudge(+b.dataset.i, +b.dataset.d); },
    toPaint:function(){ S.tab = 'paint'; renderTabs(); renderPanel(); },
    col:function(b){ var c = b.dataset.c; S.brush = c; if (S.sel.length) edit(function(p){ var dark = /_D$/.test(p.c); p.c = c + (dark && !/_D$/.test(c) ? '_D' : ''); if (!p.mSet) p.m = M.guessMaterial(c) === 'sheet' && p.m && p.m !== 'glass' && p.m !== 'lamp' ? p.m : M.guessMaterial(c); }); else renderPanel(); },
    addCol:function(){ var hex = $('newCol').value, n = M.customName(hex); commit(); S.doc.colours[n] = hex; S.brush = n; if (S.sel.length) selected().forEach(function(p){ p.c = n; }); changed(true); },
    prefab:function(){ makePrefab(($('pfName') || {}).value); },
    prefabOne:function(){ makePrefab((selected()[0] || {}).name || ''); },
    makeWheel:function(){ commit(); S.doc.pieces = M.makeWheel(S.doc, S.doc.setup.wheelR, S.doc.setup.wheelW); changed(true); },
    showLooks:function(){ S.layer = S.layer === 'look' ? 'car' : 'look'; S.sel = []; refresh(true); },
    reroll:function(){ commit(); S.doc.dmg.seed = (S.doc.dmg.seed % 97) + 1 + Math.floor(Math.random()*7); changed(true); },
    editState:function(b){ editState(b.dataset.s); },
    autoState:function(b){ commit(); delete S.doc.states[b.dataset.s]; if (S.state === b.dataset.s){ S.layer = 'car'; S.state = null; } changed(true); },
    units:function(b){ S.units = b.dataset.u; store.set('units', S.units); S.snap = SNAPS[S.units][2][0]; store.set('snap', S.snap); renderTools(); refresh(true); }
  };
  var CHANGES = {
    name:function(t){ edit(function(p){ p.name = t.value; }, false); },
    g:function(t){ if (t.value) edit(function(p){ p.g = t.value; }); },
    dark:function(t){ edit(function(p){ var b = p.c.replace(/_D$/, ''); p.c = t.checked ? b + '_D' : b; }); },
    glow:function(t){ edit(function(p){ if (t.checked) p.glow = true; else delete p.glow; }); },
    m:function(t){ if (t.value) edit(function(p){ p.m = t.value; p.mSet = true; }); },
    fn:function(t){ edit(function(p){ if (t.value) p.fn = t.value; else delete p.fn; }); },
    hidden:function(t){ edit(function(p){ if (t.checked) p.hidden = true; else delete p.hidden; }); },
    mx:function(t){ edit(function(p){ p.mx = t.checked; }); },
    mz:function(t){ edit(function(p){ p.mz = t.checked; }); },
    fy:function(t){ edit(function(p){ p.fy = t.checked; }); },
    ax:function(t){ edit(function(p){ p.ax = t.value; }); },
    both:function(t){ edit(function(p){ p.both = t.checked; }); },
    tax:function(t){ edit(function(p){ retube(p, t.value); }); },
    docName:function(t){ renameDoc(t.value); },
    cls:function(t){ commit(); S.doc.cls = t.value; changed(false); },
    author:function(t){ S.doc.author = t.value; saveSoon(); },
    bed:function(t){ setup(function(st){ var sp = asset().spec; st.bed = t.checked ? {y:0.75, z:r4(sp.tail + 0.9), w:r4(Math.min(1.6, sp.width - 0.15)), d:1.6} : null; }); },
    tank:function(t){ setup(function(st){ st.tank = t.value; }); },
    paint:function(t){ commit(); S.doc.paint[t.dataset.slot] = t.value; meshCache = {}; changed(true); },
    dstr:function(t){ commit(); S.doc.dmg.strength = +t.value; changed(true); }
  };
  function retube(p, ax){
    var ia = p.ax === 'x' ? 0 : p.ax === 'y' ? 1 : 2, len = Math.abs(p.r[1][ia] - p.r[0][ia]), ib = ax === 'x' ? 0 : ax === 'y' ? 1 : 2;
    p.ax = ax; p.r = p.r.map(function(r, k){ var o = [0, 0, 0, r[3], r[4]]; o[ib] = (k ? 1 : -1)*len/2; return o; });
  }
  function renameDoc(name){
    name = String(name || '').trim() || 'My car'; commit();
    var old = S.doc.id, d = drafts(); S.doc.name = name; S.doc.id = uniqueId(name);
    if (old !== S.doc.id && d[old]){ delete d[old]; store.set('drafts', d); }
    $('docName').value = name; changed(false);
  }
  function makePrefab(name){
    var pf = M.makePrefab({pieces:ownerList()}, S.sel, (name || '').trim() || 'Prefab ' + (S.prefabs.length + 1));
    if (!pf) return; S.prefabs.push(pf); store.set('prefabs', S.prefabs); renderTools(); toast('Saved prefab "' + pf.name + '": find it in the tools on the left.');
  }
  function editState(key){
    var A = asset(); commit();
    if (!S.doc.states[key]){
      var pcs = key.indexOf('.') > 0 ? (A[key.split('.')[0]][key.split('.')[1]] || []) : (A.model.damage[key] || []);
      var tmp = {pieces:[]}; pcs.forEach(function(np){ M.fromNative(np, 'body', tmp); });
      S.doc.states[key] = tmp.pieces;
    }
    S.layer = 'state'; S.state = key; S.sel = []; S.tab = 'piece'; changed(true);
  }

  /* ---------------------------------------------------------------- designs: library, open, import, export */
  function modal(html){ $('modalBox').innerHTML = html; $('modal').classList.remove('hidden'); }
  function closeModal(){ $('modal').classList.add('hidden'); }
  $('modal').addEventListener('click', function(e){ if (e.target.id === 'modal') closeModal(); var b = e.target.closest('button'); if (b && b.dataset.m && MODAL[b.dataset.m]) MODAL[b.dataset.m](b); });
  var STOCK = ['hatchback','sedan','wagon','suv','offroader','pickup','crew_pickup','flatbed','van','box_truck'];
  function library(){
    saveDraft();
    var d = drafts(), ids = Object.keys(d).sort(function(a, b){ return (d[b].saved || 0) - (d[a].saved || 0); });
    var h = '<h2>Designs</h2><p>Your designs are kept in this browser. Export a pack to keep them on the drive or send them to a friend.</p>';
    h += '<div class="list">' + ids.map(function(id){ var x = d[id]; return '<div class="it"><input type="checkbox" class="pk" value="' + esc(id) + '"' + (id === S.doc.id ? ' checked' : '') + '><span class="nm">' + esc(x.name) + ' <span class="muted">' + (x.saved ? new Date(x.saved).toLocaleDateString() : '') + '</span></span>' +
      (id === S.doc.id ? '<span class="muted">open</span>' : '<button class="alt sm" data-m="open" data-id="' + esc(id) + '">Open</button>') + '<button class="alt sm" data-m="del" data-id="' + esc(id) + '">Delete</button></div>'; }).join('') + '</div>';
    h += '<div class="row" style="margin-top:12px"><button class="sm" data-m="exportSel">Export ticked as one pack</button><button class="alt sm" data-m="import">Import a pack file</button></div>';
    h += '<div class="card"><h3>Start something new</h3><div class="row"><button class="alt sm" data-m="blank">Blank car</button></div><p class="muted">Or start from one of the design chat\'s cars (a copy; the game\'s own car is not changed):</p><div class="row">' +
      STOCK.map(function(n){ return '<button class="alt sm" data-m="stock" data-n="' + n + '">' + n.replace(/_/g, ' ') + '</button>'; }).join('') + '</div></div>';
    if (S.prefabs.length) h += '<div class="card"><h3>Prefabs</h3><div class="list">' + S.prefabs.map(function(pf){ return '<div class="it"><span class="nm">' + esc(pf.name) + ' <span class="muted">' + pf.pieces.length + ' pieces</span></span><button class="alt sm" data-m="pfdel" data-id="' + esc(pf.id) + '">Delete</button></div>'; }).join('') + '</div></div>';
    h += '<div class="row" style="justify-content:flex-end"><button class="alt sm" data-m="close">Close</button></div>';
    modal(h);
  }
  var MODAL = {
    close:closeModal,
    open:function(b){ saveDraft(); setDoc(clone(drafts()[b.dataset.id])); closeModal(); },
    del:function(b){ if (b.dataset.sure !== '1'){ b.dataset.sure = '1'; b.textContent = 'Tap again to delete'; return; } var d = drafts(); delete d[b.dataset.id]; store.set('drafts', d); library(); },
    blank:function(){ saveDraft(); var d = M.blankDoc(); d.id = uniqueId('my_car'); d.name = 'My car'; setDoc(d); closeModal(); },
    stock:function(b){ saveDraft(); var d = M.fromStock(PROPS, b.dataset.n); d.id = uniqueId(d.id); setDoc(d); closeModal(); toast('Opened a copy of the ' + b.dataset.n.replace(/_/g, ' ') + '. Pieces marked "inside" are its seats, engine, tank and boot space.'); },
    exportSel:function(){ var ids = [].slice.call(document.querySelectorAll('.pk:checked')).map(function(i){ return i.value; }); if (!ids.length) return toast('Tick at least one design.'); exportDialog(ids); },
    import:function(){ $('fileIn').click(); },
    pfdel:function(b){ S.prefabs = S.prefabs.filter(function(p){ return p.id !== b.dataset.id; }); store.set('prefabs', S.prefabs); renderTools(); library(); },
    doExport:function(){ doExport(); }
  };
  var exportIds = [];
  function exportDialog(ids){
    saveDraft(); exportIds = ids || [S.doc.id];
    var d = drafts(), names = exportIds.map(function(i){ return d[i] ? d[i].name : i; });
    var h = '<h2>Export pack</h2><p>' + esc(names.join(', ')) + '</p>' +
      '<div class="row"><label class="l">Pack name</label><input class="grow" id="xName" type="text" value="' + esc(exportIds.length === 1 ? names[0] : 'My vehicles') + '"></div>' +
      '<div class="row"><label class="l">Made by</label><input class="grow" id="xAuthor" type="text" value="' + esc(S.doc.author || '') + '"></div>' +
      '<div class="row"><label class="l">Licence</label><select class="grow" id="xLic"><option value="MIT">MIT (same as the game)</option><option value="CC0">CC0 (public domain)</option><option value="CC-BY-4.0">CC BY 4.0 (credit me)</option></select></div>' +
      (S.prefabs.length ? '<div class="row"><label><input type="checkbox" id="xPf" checked>Include my ' + S.prefabs.length + ' prefab' + (S.prefabs.length > 1 ? 's' : '') + '</label></div>' : '') +
      '<p class="muted">Saves a .js file. Put it in the <b>packs</b> folder on the drive and add its name to packs/index.js; friends can import it here to edit it.</p>' +
      '<div class="row" style="justify-content:flex-end"><button class="alt sm" data-m="close">Cancel</button><button class="sm" data-m="doExport">Export</button></div>';
    modal(h);
  }
  function doExport(){
    var name = $('xName').value.trim() || 'My vehicles', pk = M.newPack({id:slug(name).replace(/_/g, '-') || 'my-pack', name:name, author:$('xAuthor').value.trim(), licence:$('xLic').value});
    var d = drafts(), bad = [];
    exportIds.forEach(function(id){ var doc = d[id]; if (!doc) return; try { pk.assets.push(M.buildAsset(doc, D)); } catch (e){ console.error(e); bad.push(doc.name); } });
    if ($('xPf') && $('xPf').checked) pk.prefabs = clone(S.prefabs);
    var text = M.packToJS(pk), file = pk.id + '.js';
    download(file, text);
    closeModal(); toast(bad.length ? 'Exported, but these failed: ' + bad.join(', ') : 'Exported ' + file + ' (' + Math.round(text.length/1024) + ' KB)');
  }
  function download(name, text){
    var blob = new Blob([text], {type:'text/javascript'});
    if (navigator.canShare && /iPad|iPhone|iPod/.test(navigator.userAgent) && window.File){
      var f = new File([blob], name, {type:'text/javascript'});
      if (navigator.canShare({files:[f]})){ navigator.share({files:[f], title:name}).catch(function(){ saveLink(blob, name); }); return; }
    }
    saveLink(blob, name);
  }
  function saveLink(blob, name){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
  $('fileIn').addEventListener('change', function(){
    var files = [].slice.call(this.files || []); this.value = '';
    files.forEach(function(f){ var rd = new FileReader(); rd.onload = function(){ importText(rd.result, f.name); }; rd.readAsText(f); });
  });
  function importText(text, fname){
    try {
      var pk = M.parsePack(text), d = drafts(), n = 0, last = null;
      (pk.assets || []).forEach(function(a){ if (a.type !== 'vehicle') return; var doc = M.docFromAsset(a); doc.id = uniqueId(doc.id || doc.name); d[doc.id] = doc; last = doc; n++; });
      (pk.prefabs || []).forEach(function(pf){ if (!S.prefabs.some(function(q){ return q.id === pf.id; })) S.prefabs.push(pf); });
      store.set('drafts', d); store.set('prefabs', S.prefabs); renderTools();
      if (last){ setDoc(clone(last)); }
      closeModal(); toast('Imported ' + n + ' design' + (n === 1 ? '' : 's') + (pk.prefabs && pk.prefabs.length ? ' and ' + pk.prefabs.length + ' prefabs' : '') + ' from ' + fname);
    } catch (e){ toast('Could not read ' + fname + ': ' + e.message); }
  }
  /* drop a pack onto the page (computers) */
  document.addEventListener('dragover', function(e){ e.preventDefault(); });
  document.addEventListener('drop', function(e){ e.preventDefault(); [].slice.call(e.dataTransfer.files || []).forEach(function(f){ var rd = new FileReader(); rd.onload = function(){ importText(rd.result, f.name); }; rd.readAsText(f); }); });

  /* ---------------------------------------------------------------- little messages */
  var toastT = 0;
  function toast(t){ var el = $('toast'); el.textContent = t; el.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(function(){ el.classList.add('hidden'); }, 3800); }
  function banner(t){ var el = $('banner'); if (!t){ el.classList.add('hidden'); return; } el.textContent = t; el.classList.remove('hidden'); }

  /* ---------------------------------------------------------------- refresh everything that shows the design */
  function refresh(full){
    keepSel();
    $('bUndo').disabled = !S.undo.length; $('bRedo').disabled = !S.redo.length;
    renderBars(); renderTabs();
    var ae = document.activeElement, focusId = ae && ae.id && fields[ae.id] ? ae.id : null;
    renderPanel();
    rebuildScene();
  }

  /* ---------------------------------------------------------------- header and keys */
  $('bUndo').onclick = undo; $('bRedo').onclick = redo; $('bLib').onclick = library; $('bExport').onclick = function(){ exportDialog([S.doc.id]); };
  $('docName').addEventListener('change', function(){ renameDoc(this.value); });
  document.addEventListener('keydown', function(e){
    if (/INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return;
    var k = e.key, c = e.ctrlKey || e.metaKey;
    if (c && (k === 'z' || k === 'Z')){ e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (c && (k === 'y' || k === 'Y')){ e.preventDefault(); redo(); }
    else if (c && (k === 'd' || k === 'D')){ e.preventDefault(); duplicate(false); }
    else if (c && (k === 'a' || k === 'A')){ e.preventDefault(); selectAll(); }
    else if (k === 'Delete' || k === 'Backspace'){ e.preventDefault(); removeSel(); }
    else if (k === 'Escape'){ S.placing = null; banner(null); S.sel = []; renderTools(); refresh(); }
    else if (k === 'ArrowLeft'){ e.preventDefault(); nudge(0, -1); } else if (k === 'ArrowRight'){ e.preventDefault(); nudge(0, 1); }
    else if (k === 'ArrowUp'){ e.preventDefault(); nudge(2, 1); } else if (k === 'ArrowDown'){ e.preventDefault(); nudge(2, -1); }
    else if (k === 'PageUp'){ e.preventDefault(); nudge(1, 1); } else if (k === 'PageDown'){ e.preventDefault(); nudge(1, -1); }
    else if (k === 'm' || k === 'M'){ edit(function(p){ p.mx = !p.mx; }); }
    else if (k === 'f' || k === 'F'){ fitView(true); }
  });

  /* ---------------------------------------------------------------- start */
  try { view = WSV.create($('cv'), hooks); }
  catch (e){ document.body.innerHTML = '<p style="padding:20px">The Workshop needs WebGL, which this browser has turned off: ' + esc(e.message) + '</p>'; return; }
  renderTools();
  var cur = store.get('current', null), all = drafts();
  if (cur && all[cur]) setDoc(clone(all[cur]));
  else { var first = M.fromStock(PROPS, 'pickup'); first.id = uniqueId('my_pickup'); first.name = 'My pickup'; setDoc(first); setTimeout(function(){ toast('Welcome! This is a copy of the pickup to try things on. Designs → Blank car to start from nothing.'); }, 400); }
  window.WORKSHOP = {S:S, refresh:refresh, asset:asset, view:view, importText:importText, exportPack:function(ids){ exportIds = ids || [S.doc.id]; }, place:place, hit:hit};
})();
