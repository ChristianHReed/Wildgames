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

  /* a design is a vehicle (the car editor) or a model (any other asset: see workshop/assets.js) */
  function isModel(){ return !!S.doc && S.doc.type === 'model'; }
  function isSound(){ return !!S.doc && S.doc.type === 'sound'; }
  function partNames(){ return isModel() ? Object.keys(S.doc.parts || {body:{}}) : ['body', 'bonnet', 'boot']; }
  function partOpts(){ return isModel() ? partNames().map(function(n){ return [n, n.replace(/_/g, ' ')]; }) : [['body', 'Body'], ['bonnet', 'Bonnet (opens)'], ['boot', 'Boot lid (opens)']]; }
  var POINTC = {grip:'xff3b30', offhand:'xff8a30', seat:'x3b82ff', sit:'x3b82ff', saddle:'x3b82ff', thwart:'x3b82ff', hinge:'xffd23b', joint:'xffd23b', light:'xfff2b0', socket:'x35d07f', muzzle:'xff3b30', smoke:'xb0b0b0'};

  /* ---------------------------------------------------------------- state */
  var S = {
    doc:null, sel:[], layer:'car', look:'whole', state:null,
    units:store.get('units', 'imp'), snap:store.get('snap', null), faceSnap:store.get('faceSnap', true),
    sym:{x:true, z:false}, lock:null, placing:null, multi:false, tab:'piece',
    preview:{bonnet:false, boot:false, markers:true, person:true, planes:true, hand:true, bones:true, fx:true, guides:true},
    brush:'paint1', prefabs:store.get('prefabs', []), undo:[], redo:[], asset:null, assetFor:null, part:null, hideParts:{}, selPoint:-1, pose:{}, clip:null, clipT:0, variant:null, aClip:null, aFrame:0, aBone:null, onion:false, build:'average', aPlay:false
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
    if (doc.type === 'sound'){ doc.pieces = doc.pieces || []; doc.parts = {}; doc.points = []; doc.states = {}; S.tab = 'sound'; }
    doc.states = doc.states || {}; doc.dmg = doc.dmg || {seed:7, strength:1}; if (doc.type === 'model'){ doc.points = doc.points || []; doc.parts = doc.parts || {body:{}}; if (Array.isArray(doc.extra) === false) doc.extra = []; S.part = null; S.hideParts = {}; S.selPoint = -1; if (S.tab === 'car' || S.tab === 'damage') S.tab = 'piece'; } else if (S.tab === 'model') S.tab = 'piece';
    playClip(null); S.pose = {}; S.variant = null; stopAnim(); setTimeout(fxRun, 0); S.waveData = null; S.aClip = null; S.aFrame = 0; S.aBone = null; manBoned = null;
    if (doc.type !== 'model' && doc.type !== 'sound' && doc.setup) M.ensureAxles(doc);
    S.doc = doc; S.sel = []; S.undo = []; S.redo = []; S.layer = 'car'; S.look = 'whole'; S.state = null; S.asset = null;
    $('docName').value = doc.name;
    refresh(true); if (!keepView) fitView();
  }
  function uniqueId(base){ var d = drafts(), id = slug(base) || 'design', n = 2, b = id; while (d[id] && d[id] !== S.doc) id = b + '_' + n++; return id; }
  function slug(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40); }

  /* undo: a snapshot before every change */
  function commit(){ if (S.liveField || S.gzDrag){ if (S.liveCommitted) return; S.liveCommitted = true; } S.undo.push(JSON.stringify(S.doc)); if (S.undo.length > 120) S.undo.shift(); S.redo = []; }
  function changed(full){ S.asset = null; saveSoon(); refresh(full); }
  function undo(){ if (!S.undo.length) return; S.redo.push(JSON.stringify(S.doc)); S.doc = JSON.parse(S.undo.pop()); keepSel(); changed(true); }
  function redo(){ if (!S.redo.length) return; S.undo.push(JSON.stringify(S.doc)); S.doc = JSON.parse(S.redo.pop()); keepSel(); changed(true); }
  function keepSel(){ var ids = {}; active().forEach(function(p){ ids[p.id] = 1; }); S.sel = S.sel.filter(function(i){ return ids[i]; }); }

  /* the pieces being edited: the car's (body, bonnet, boot), the wheel, or a hand-edited damage state */
  function stateList(){ return S.doc.states[S.state] || []; }
  function active(){
    if (S.layer === 'state') return stateList();
    if (isModel() && S.variant && S.doc.variants && S.doc.variants[S.variant]) return S.doc.variants[S.variant].pieces;
    if (isModel() && S.doc.kind === 'held' && S.doc.parts && S.doc.parts['new']) return S.doc.pieces.filter(function(p){ return p.g === (S.part || 'new'); });
    if (isModel()) return S.doc.pieces.filter(function(p){ return !S.part || p.g === S.part || !S.hideOthers; });
    return S.doc.pieces.filter(function(p){ return S.layer === 'wheel' ? p.g === 'wheel' : p.g !== 'wheel'; });
  }
  function ownerList(){ if (isModel() && S.variant && S.doc.variants && S.doc.variants[S.variant]) return S.doc.variants[S.variant].pieces; return S.layer === 'state' ? stateList() : S.doc.pieces; }
  function byId(id){ var L = ownerList(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function selected(){ return S.sel.map(byId).filter(Boolean); }

  /* ---------------------------------------------------------------- the finished asset (measurements, damage, checks) */
  function asset(){
    if (S.asset && S.assetFor === S.doc) return S.asset;
    if (isSound()){ S.asset = soundAsset(S.doc); S.assetFor = S.doc; return S.asset; }
    if (isModel()){ S.asset = M.buildModelAsset(S.doc); S.assetFor = S.doc; return S.asset; }
    try { S.asset = M.buildAsset(S.doc, D); } catch (e){ console.error(e); S.asset = M.buildAsset(S.doc, null); }
    S.assetFor = S.doc; return S.asset;
  }

  /* ---------------------------------------------------------------- 3D scene */
  var view, meshCache = {};
  /* cars use the props palette; any other model uses its own pack's palette, colour slots and shading */
  function pal(){ return isModel() ? M.modelPalette(SH, S.doc) : PAL; }
  function colourFn(){
    if (!isModel()) return M.colourOf(S.doc, PAL);
    var P = pal(), dk = M.modelDarker(SH, S.doc);
    return function(name){ var c = M.colourHex(S.doc, P, name), rgb = SH.hex(c.hex); return c.dark ? rgb.map(function(v){ return v*dk; }) : rgb; };
  }
  function nativesOf(p){ return M.toNativeAlways(p); }
  /* game pieces -> triangles (with lit flag in alpha), cached by the piece's JSON */
  function trisOf(pcs, key){
    var k = key ? key + JSON.stringify(S.doc.paint) + JSON.stringify(S.doc.colours) + JSON.stringify(S.doc.slotColours || null) + (S.doc.target ? S.doc.target.pack : '') : null;
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
  function wheelAt(w, left, yaw){ var c = Math.cos(yaw || 0), s = Math.sin(yaw || 0), ry = function(v){ return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c]; };
    return function(p, n){ var q = left ? [-p[0], p[1], -p[2]] : p, m = left ? [-n[0], n[1], -n[2]] : n; if (yaw){ q = ry(q); m = ry(m); } return [[q[0] + w[0], q[1] + w[1], q[2] + w[2]], m]; }; }
  /* where the wheels go: on the hubs at the ends of each axle block (older designs: the setup numbers) */
  function hubs(){ var A = M.axlesOf(S.doc), r = S.doc.setup.wheelR;
    if (!A.length) return S.doc.setup.axles.map(function(z){ return {z:z, track:S.doc.setup.track, y:r, steer:false}; });
    return A.map(function(a){ return {z:a.z, track:a.track, y:r, steer:a.steer}; }); }
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
    var out = [], yaw = S.preview.steer ? 0.42 : 0;
    hubs().forEach(function(h){ var y = h.steer ? yaw : 0; out.push(xform(wm, wheelAt([h.track, h.y, h.z], false, y))); out.push(xform(wm, wheelAt([-h.track, h.y, h.z], true, y))); });
    return out;
  }
  function rebuildScene(){
    if (!view) return;
    var wf = $('wave'); if (wf) wf.classList.toggle('hidden', !isSound());
    var tl = $('tools'); if (tl) tl.classList.toggle('hidden', isSound());
    if (isSound()){ ['solid','ghost','sel','selLines','pts','bones','person','shadow','planes','fx','grid'].forEach(function(k){ view.set(k, null); }); updateReadout(); drawWave(); return; }
    picks = [];
    if (!isModel() && S.doc.setup) M.syncAxles(S.doc);   /* axles stay on the middle line at wheel height; only front/back moves */
    var solid = [], selM = [], ghost = [], lines = [], selIds = {}; S.sel.forEach(function(i){ selIds[i] = 1; });
    if (S.layer === 'look'){
      var A = asset(), L = D.LOOKS.filter(function(l){ return l.key === S.look; })[0] || D.LOOKS[0], pcs = [], wheel = A.model.wheel, drop = 0;
      if (L.whole){ var W = A[L.whole]; pcs = W.body.concat(W.bonnet || []); wheel = W.wheel; drop = (L.whole === 'wreck' ? A.rigWreck : A.rigBurnt).sitDrop; }
      else { pcs = (L.body ? A.model.damage[L.body] : A.model.body).concat(L.bonnet && A.model.damage[L.bonnet] ? A.model.damage[L.bonnet] : (A.model.bonnet || []), A.model.boot || []);
        L.over.forEach(function(k){ pcs = pcs.concat(A.model.damage[k] || []); }); }
      var m = trisOf(pcs, 'look:' + S.look + JSON.stringify(S.doc.dmg) + JSON.stringify(S.doc.states) + JSON.stringify(S.doc.pieces));
      solid.push(drop ? xform(m, function(p, n){ return [[p[0], p[1] - drop, p[2]], n]; }) : m);
      var wm = trisOf(wheel, 'lookwheel:' + S.look + JSON.stringify(S.doc.pieces.filter(function(p){ return p.g === 'wheel'; })));
      hubs().forEach(function(h){ solid.push(xform(wm, wheelAt([h.track, h.y - drop, h.z], false))); solid.push(xform(wm, wheelAt([-h.track, h.y - drop, h.z], true))); });
    } else {
      var list = active();
      list.forEach(function(p){
        if (p.hidden && !S.preview.markers) return;
        if (isModel() && S.hideParts[p.g]) return;
        var m = trisOf(nativesOf(p), 'p:' + JSON.stringify(p)), f = openFn(p);
        if (f) m = xform(m, f);
        if (isSkel()){ m = skelMesh(m, p.g, curFrame()); }
        else if (isModel()){
          var pf = M.poseFn(S.doc, p.g, S.pose); if (pf) m = xform(m, function(q, n){ return pf(q, n); });
          var gp = handGrip(); if (gp) m = xform(m, function(q, n){ return [[q[0] + gp[0], q[1] + gp[1], q[2] + gp[2]], n]; });
          var inst = S.part !== p.g && M.instancesOf(S.doc, p.g);
          if (inst){ inst.forEach(function(pt){ var w = pt.pos, left = w[0] < -0.01; solid.push(xform(m, wheelAt(w, left))); }); return; }
        }
        if (p.hidden) ghost.push(m); else solid.push(m);
        if (selIds[p.id]) selM.push(m);
        picks.push({id:p.id, pos:m.pos});
      });
      if (S.layer === 'car' && !isModel()){ solid = solid.concat(wheelMeshes());
        var DT = M.drivetrain(S.doc); if (DT.pieces.length){ var dm = trisOf(DT.pieces.reduce(function(a, q){ return a.concat(M.toNative(q)); }, []), 'dt:' + JSON.stringify(DT.pieces)); if (S.doc.setup.drawShaft === false) ghost.push(dm); else solid.push(dm); } }
      if (S.layer === 'state'){ /* show the clean car faintly round the state being edited */
        var base = []; S.doc.pieces.forEach(function(p){ if (p.g !== 'wheel' && !p.hidden) base = base.concat(nativesOf(p)); });
        ghost.push(trisOf(base, 'base:' + JSON.stringify(S.doc.pieces)));
      }
    }
    var man = handGrip() ? mannequin() : null; if (man) solid.push(man);
    if (isSkel() && S.layer !== 'look'){
      if (S.doc.garment) refBody(curFrame()).forEach(function(mm){ solid.push(mm); });
      if (S.onion && S.aClip && S.doc.frames[S.aClip] && S.doc.frames[S.aClip].length > 1){ var fr = S.doc.frames[S.aClip], pi = (S.aFrame - 1 + fr.length) % fr.length;
        S.doc.pieces.forEach(function(p){ ghost.push(skelMesh(trisOf(nativesOf(p), 'p:' + JSON.stringify(p)), p.g, fr[pi])); }); }
    }
    view.set('solid', {tris:merge(solid)}, {order:1});
    view.set('ghost', ghost.length ? {tris:merge(ghost)} : null, {order:3, alpha:0.35, depthWrite:false});
    view.set('sel', selM.length ? {tris:merge(selM)} : null, {order:4, tint:[0.85, 0.45, 0.18, 0.38], offset:-1});
    view.set('selLines', selM.length ? {lines:outline(S.sel)} : null, {order:5, depth:false, alpha:0.9, lit:false});
    view.set('bones', isSkel() && S.preview.bones ? {lines:boneLines()} : null, {order:8, depth:false, alpha:0.95, lit:false});
    var ptp = isModel() && S.preview.markers ? pointPieces() : [];
    view.set('pts', ptp.length ? {tris:trisOf(ptp)} : null, {order:7, depth:false, alpha:0.95, lit:false});
    sceneDecor();
    updateReadout();
    gzDraw();
  }
  function pointPieces(){
    var out = [];
    (S.doc.points || []).forEach(function(pt, i){
      var k = i === S.selPoint ? 0.09 : 0.06, c = POINTC[pt.kind] || 'xff7a30', d = pt.dir || [0, 0, 1];
      out.push({s:'box', p:pt.pos.slice(), d:[k, k, k], c:c, glow:true});
      out.push({s:'box', p:[pt.pos[0] + d[0]*0.1, pt.pos[1] + d[1]*0.1, pt.pos[2] + d[2]*0.1], d:[0.02 + Math.abs(d[0])*0.18, 0.02 + Math.abs(d[1])*0.18, 0.02 + Math.abs(d[2])*0.18], c:c, glow:true});
    });
    return out;
  }
  /* the edges of the selected pieces' faces, drawn through everything so a piece inside another still shows */
  function outline(ids){
    var pos = [], col = [];
    ids.forEach(function(id){ var p = byId(id); if (!p) return; var f = openFn(p);
      if (!f && isModel()){ var pf = M.poseFn(S.doc, p.g, S.pose); if (pf) f = function(q, n){ return pf(q, n); }; }
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
    if (isModel() && S.preview.guides && /building|structure|tile/.test(S.doc.kind)){
      var gc = [0.78, 0.36, 0.12, 1], ln = function(a, b){ pos.push(a[0], a[1], a[2], b[0], b[1], b[2]); col.push.apply(col, gc.concat(gc)); };
      if (S.doc.kind === 'tile'){ var hw = 2; [[-hw,-hw],[hw,-hw],[hw,hw],[-hw,hw]].forEach(function(c, i, A){ var d2 = A[(i+1)%4]; ln([c[0], 0.003, c[1]], [d2[0], 0.003, d2[1]]); }); }
      else { [0, 3, 6].forEach(function(y){ ln([-1.2, y, 0], [1.2, y, 0]); }); [-1.2, 1.2].forEach(function(x){ ln([x, 0, 0], [x, 6, 0]); }); ln([-1.2, 0, 0.3], [1.2, 0, 0.3]); }
    }
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
    if (S.preview.person && S.layer !== 'wheel' && !handGrip() && !isSkel()){
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
    if (isSound()){ el.textContent = S.doc.key + ' · ' + S.doc.length + ' s · ' + S.doc.variations + ' takes'; return; }
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
      if (S.gzTapped){ S.gzTapped = false; return; }
      if (S.layer === 'look') return;
      var h = hit(x, y);
      if (S.placing){ place(S.placing, h, x, y); return; }
      if (!h){ if (!S.multi && !(ev && (ev.shiftKey || ev.metaKey || ev.ctrlKey))) S.sel = []; refresh(); return; }
      var add = S.multi || (ev && (ev.shiftKey || ev.metaKey || ev.ctrlKey));
      if (add){ var k = S.sel.indexOf(h.id); if (k >= 0) S.sel.splice(k, 1); else S.sel.push(h.id); }
      else S.sel = [h.id];
      if (isSkel()){ var hp = byId(h.id); if (hp) S.aBone = hp.g; }
      if (S.tab !== 'piece' && S.tab !== 'paint') S.tab = 'piece';
      refresh();
    },
    doubleTap:function(x, y){ var h = hit(x, y); if (h){ var p = byId(h.id); var B = M.boundsOf(nativesOf(p)); if (B.ok) view.frame(B.mn.map(function(v, i){ return Math.min(v, h.p[i] - 0.3); }), B.mx.map(function(v, i){ return Math.max(v, h.p[i] + 0.3); }), true); } else fitView(true); },
    dragStart:function(x, y){
      var gh = gzHit(x, y); if (gh){ gzStart(gh, x, y); return true; }
      if (S.layer === 'look' || S.placing || !S.sel.length) return false;
      var h = hit(x, y); if (!h || S.sel.indexOf(h.id) < 0) return false;
      var pl = dragPlane(h.p), start = WSV.hitPlane(view.ray(x, y).o, view.ray(x, y).d, h.p, pl.n); if (!start) return false;
      commit();
      drag = {pl:pl, at:h.p, start:start, orig:selected().map(function(p){ return {p:p, pos:p.pos.slice()}; })};
      return true;
    },
    drag:function(x, y){
      if (S.gzDrag){ gzMove(x, y); return; }
      if (!drag) return; var R = view.ray(x, y), q = WSV.hitPlane(R.o, R.d, drag.at, drag.pl.n); if (!q) return;
      var dv = [q[0]-drag.start[0], q[1]-drag.start[1], q[2]-drag.start[2]];
      if (drag.pl.ax){ var t = WSV.dot(dv, drag.pl.ax); dv = [drag.pl.ax[0]*t, drag.pl.ax[1]*t, drag.pl.ax[2]*t]; }
      dv = dv.map(function(v){ return snapV(v); });
      drag.orig.forEach(function(o){ o.p.pos = [r4(o.pos[0]+dv[0]), r4(o.pos[1]+dv[1]), r4(o.pos[2]+dv[2])]; });
      banner('Moved ' + ['x','y','z'].map(function(a, i){ return a.toUpperCase() + ' ' + (dv[i] >= 0 ? '+' : '') + fmtNum(toUnit(dv[i])); }).join('  ') + ' ' + unitLabel());
      rebuildScene();
    },
    dragEnd:function(tapped){ if (S.gzDrag){ gzEnd(!tapped); return; } if (!drag) return; drag = null; banner(null); if (tapped){ S.undo.pop(); return; } changed(false); }
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
    var g = S.layer === 'wheel' ? 'wheel' : (isModel() ? (S.part || partNames()[0]) : 'body');
    if (kind.kind === 'shape'){
      var p = M.addPiece({pieces:ownerList()}, kind.key, [0, 0, 0], {g:g, c:S.brush, m:M.guessMaterial(S.brush)});
      if (S.layer !== 'state') {} /* addPiece pushed into ownerList */
      seat(p, at, n, !!h || x != null);
      made = [p];
    } else if (kind.kind === 'axle'){
      /* an axle goes under the car at the tapped front/back position; it sits at wheel height on the middle line */
      var nA = M.axlesOf(S.doc).length, ax = M.makeAxle(S.doc, r4(snapV(at[2])), {steer:false, driven:false, name:'axle ' + (nA + 1)});
      made = [ax];
    } else if (kind.kind === 'gearbox'){
      var gbx = M.addPiece(S.doc, 'bev', [0, 0, 0], {g:'body', c:'underside', m:'steel', fn:'gearbox', d:[0.3, 0.26, 0.45], name:'gearbox'});
      seat(gbx, at, n, !!h || x != null); gbx.pos[0] = 0; gbx.mx = false; made = [gbx];
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
    corner:'<svg viewBox="0 0 30 24"><path d="M4 18l12 4 10-6-4-12z M16 22l6-18 M4 18l18-14" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    incorner:'<svg viewBox="0 0 30 24"><path d="M4 18l12 4 10-6V5L14 3 4 8z M4 8l12 4 10-7 M16 12v10" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 8l12 4" stroke="#3d3029" stroke-width="1.4"/></svg>',
    pyramid:'<svg viewBox="0 0 30 24"><path d="M15 3L4 17l11 5 11-5z M15 3v19" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    prism:'<svg viewBox="0 0 30 24"><path d="M5 19l5-13 16-2-5 13z M21 17l5-13 3 13z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    hex:'<svg viewBox="0 0 30 24"><path d="M8 5h14l4 4-4 4H8L4 9z M4 9v8l4 4h14l4-4V9 M8 13v8 M22 13v8" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    ball:'<svg viewBox="0 0 30 24"><circle cx="15" cy="12" r="9" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4"/><path d="M6 12c3 3 15 3 18 0" fill="none" stroke="#3d3029" stroke-width="1"/></svg>',
    dome:'<svg viewBox="0 0 30 24"><path d="M5 18a10 10 0 0 1 20 0z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4"/><ellipse cx="15" cy="18" rx="10" ry="3" fill="#f3dcc4" stroke="#3d3029" stroke-width="1.2"/></svg>',
    arch:'<svg viewBox="0 0 30 24"><path d="M3 20a8 8 0 0 1 16 0z M11 12l10-6a8 8 0 0 1 6 8l-8 6" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    quarter:'<svg viewBox="0 0 30 24"><path d="M4 20V10a10 10 0 0 1 10 10z M4 10l10-6a10 10 0 0 1 10 10l-10 6" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    axle:'<svg viewBox="0 0 30 24"><path d="M7 12h16" stroke="#3d3029" stroke-width="2.4"/><ellipse cx="5" cy="12" rx="3" ry="7" fill="#57524c" stroke="#3d3029" stroke-width="1.3"/><ellipse cx="25" cy="12" rx="3" ry="7" fill="#57524c" stroke="#3d3029" stroke-width="1.3"/><rect x="12" y="9" width="6" height="6" rx="1" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.2"/></svg>',
    gearbox:'<svg viewBox="0 0 30 24"><circle cx="11" cy="12" r="6" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.4" stroke-dasharray="2.2 1.2"/><circle cx="21" cy="9" r="4" fill="#f3dcc4" stroke="#3d3029" stroke-width="1.4" stroke-dasharray="2 1"/><circle cx="11" cy="12" r="1.6" fill="#3d3029"/></svg>',
    prefab:'<svg viewBox="0 0 30 24"><path d="M5 8h9v9H5z M16 5h9v9h-9z M12 13h9v8h-9z" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.3"/></svg>'
  };
  function renderTools(){
    var h = '<div class="grp">Add</div>';
    M.SHAPE_ORDER.forEach(function(k){ var on = S.placing && S.placing.kind === 'shape' && S.placing.key === k;
      h += '<button class="tool' + (on ? ' on' : '') + '" data-add="' + k + '" title="Add a ' + M.SHAPES[k].label.toLowerCase() + '">' + ICON[k] + M.SHAPES[k].label + '</button>'; });
    h += '<div class="grp">More blocks</div>';
    M.SHAPE_MORE.forEach(function(k){ var on = S.placing && S.placing.kind === 'shape' && S.placing.key === k;
      h += '<button class="tool' + (on ? ' on' : '') + '" data-add="' + k + '" title="Add a ' + M.SHAPES[k].label.toLowerCase() + '">' + ICON[k] + M.SHAPES[k].label + '</button>'; });
    if (!isModel() && S.layer === 'car'){ h += '<div class="grp">Vehicle parts</div>';
      [['axle', 'Axle', 'An axle: its wheels mount on its ends'], ['gearbox', 'Gearbox', 'Where the driveshaft leaves the engine']].forEach(function(v){ var on = S.placing && S.placing.kind === v[0];
        h += '<button class="tool' + (on ? ' on' : '') + '" data-veh="' + v[0] + '" title="' + v[2] + '">' + ICON[v[0]] + v[1] + '</button>'; }); }
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
    if (b.dataset.veh) return startPlacing({kind:b.dataset.veh, key:b.dataset.veh, label:b.dataset.veh === 'axle' ? 'Axle' : 'Gearbox'});
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
    if (isSound()){ $('layerBar').innerHTML = ''; $('previewBar').innerHTML = ''; return; }
    if (isModel()){
      var nm = partNames(), hb = (S.variant ? '<button class="sm on" data-a2="noop">State: ' + esc(S.variant.replace(/_/g, ' ')) + '</button><button class="sm alt" data-state="">Done</button> ' : '') + '<button class="sm ' + (!S.part ? 'on' : 'alt') + '" data-part="">All parts</button>' + nm.map(function(n){ return '<button class="sm ' + (S.part === n ? 'on' : 'alt') + '" data-part="' + esc(n) + '">' + esc(n.replace(/_/g, ' ')) + '</button>'; }).join('');
      $('layerBar').innerHTML = hb;
      $('previewBar').innerHTML = (S.doc.kind === 'effect' ? tog('fx', 'Effect') : '') + (/building|structure|tile/.test(S.doc.kind) ? tog('guides', 'Guides') : '') + (S.doc.kind === 'held' ? tog('hand', 'In hand') : '') + (isSkel() ? tog('bones', 'Bones') + (S.doc.garment ? '<select id="buildSel">' + ['slim','average','broad'].map(function(b){ return '<option' + (S.build === b ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select>' : '') : '') + tog('markers', 'Points') + (isSkel() ? '' : tog('person', 'Person')) + tog('planes', 'Planes');
      var bs = $('buildSel'); if (bs) bs.onchange = function(){ S.build = bs.value; manBoned = null; meshCache = {}; rebuildScene(); };
      return;
    }
    var h = '<button class="sm ' + (S.layer === 'car' ? 'on' : 'alt') + '" data-l="car">Car</button><button class="sm ' + (S.layer === 'wheel' ? 'on' : 'alt') + '" data-l="wheel">Wheel</button>' +
      '<button class="sm ' + (S.layer === 'look' ? 'on' : 'alt') + '" data-l="look">Damage</button>';
    if (S.layer === 'state') h += '<button class="sm on" data-l="state">Editing: ' + esc(stateLabel(S.state)) + '</button><button class="sm alt" data-l="car">Done</button>';
    $('layerBar').innerHTML = h;
    var p = '';
    if (S.layer === 'car') p = tog('bonnet', 'Bonnet open') + tog('boot', 'Boot open') + tog('steer', 'Steer') + tog('markers', 'Inside parts') + tog('person', 'Person') + tog('planes', 'Planes');
    else if (S.layer === 'look') p = '<select id="lookSel">' + D.LOOKS.map(function(l){ return '<option value="' + l.key + '"' + (l.key === S.look ? ' selected' : '') + '>' + l.label + '</option>'; }).join('') + '</select>';
    $('previewBar').innerHTML = p;
    var ls = $('lookSel'); if (ls) ls.onchange = function(){ S.look = ls.value; rebuildScene(); };
  }
  function tog(k, label){ return '<button class="sm ' + (S.preview[k] ? 'on' : 'alt') + '" data-p="' + k + '">' + label + '</button>'; }
  $('layerBar').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; if (b.dataset.part !== undefined){ S.part = b.dataset.part || null; renderBars(); return; } if (b.dataset.state !== undefined){ S.variant = b.dataset.state || null; S.sel = []; refresh(true); return; } if (b.dataset.a2) return; var l = b.dataset.l;
    if (l === 'state') return; S.layer = l; S.sel = []; S.placing = null; banner(null); if (l !== 'state') S.state = null;
    if (l === 'look') S.tab = 'damage'; refresh(true); fitView(true); });
  $('previewBar').addEventListener('click', function(e){ var b = e.target.closest('button[data-p]'); if (!b) return; S.preview[b.dataset.p] = !S.preview[b.dataset.p]; renderBars(); rebuildScene(); if (b.dataset.p === 'fx') fxRun(); });
  $('viewBar').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; if (b.dataset.v === 'fit') fitView(true); else view.preset(b.dataset.v); });

  /* ---------------------------------------------------------------- side panel */
  var TABS_CAR = [['piece', 'Piece'], ['car', 'Car'], ['paint', 'Paint'], ['damage', 'Damage'], ['check', 'Check']], TABS_MODEL = [['piece', 'Piece'], ['model', 'Model'], ['moves', 'Moves'], ['paint', 'Paint'], ['check', 'Check']], TABS_SKEL = [['piece', 'Piece'], ['anim', 'Animate'], ['model', 'Model'], ['paint', 'Paint'], ['check', 'Check']];
  function renderTabs(){ $('tabs').innerHTML = (isSound() ? [['sound', 'Sound']] : isSkel() ? TABS_SKEL : isModel() ? TABS_MODEL : TABS_CAR).map(function(t){ return '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join(''); }
  $('tabs').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; S.tab = b.dataset.tab; renderTabs(); renderPanel(); });

  /* a number field with - and + buttons, in the chosen units ('len'), degrees ('deg'), percent ('pct') or plain */
  var fieldSeq = 0, fields = {};
  /* a number: a slider to try values, and the value itself to type an exact one. Lengths show in the chosen units */
  function shownOf(kind, value){ return kind === 'len' ? fmtNum(toUnit(value)) : kind === 'pct' ? Math.round(value*100) : fmtNum(value); }
  function num(label, value, kind, set, opt){
    opt = opt || {}; var id = 'f' + (fieldSeq++), shown = shownOf(kind, value), lo, hi, st;
    fields[id] = {kind:kind, set:set, step:opt.step, min:opt.min, max:opt.max};
    if (kind === 'deg'){ lo = opt.min != null ? opt.min : -180; hi = opt.max != null ? opt.max : 180; st = 1; }
    else if (kind === 'pct'){ lo = 0; hi = Math.max(300, Math.round(value*200)); st = 1; }
    else if (kind === 'len'){ var u = toUnit(value), big = S.units === 'imp' ? 120 : 300;
      if (opt.min != null){ lo = Math.max(0, toUnit(opt.min)); hi = Math.max(u*3, S.units === 'imp' ? 24 : 60); hi = Math.min(Math.max(hi, u + 1), Math.max(big*2, u*1.5)); }
      else { var R = Math.max(Math.abs(u)*2, big); lo = -R; hi = R; }
      st = S.snap ? toUnit(S.snap) : (S.units === 'imp' ? 0.1 : 0.1);
      if (opt.max != null) hi = Math.min(hi, toUnit(opt.max)); }
    else { lo = opt.min != null ? opt.min : Math.min(0, value*3); hi = opt.max != null ? opt.max : Math.max(10, Math.abs(value)*3); st = opt.step || 1; }
    if (st > 0){ lo = Math.floor(lo/st + 1e-9)*st; hi = Math.ceil(hi/st - 1e-9)*st; lo = Math.round(lo*1e4)/1e4; hi = Math.round(hi*1e4)/1e4; }   /* slider steps land on whole grid steps */
    return '<div class="num">' + (opt.ax ? '<span class="ax ' + opt.ax + '">' + opt.ax.toUpperCase() + '</span>' : '') +
      '<input type="range" class="sl" data-sf="' + id + '" min="' + lo + '" max="' + hi + '" step="' + st + '" value="' + shown + '" aria-label="' + esc(label) + ' slider">' +
      '<input class="nv" id="' + id + '" inputmode="decimal" value="' + shown + '" aria-label="' + esc(label) + '"></div>';
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
  $('body').addEventListener('input', function(e){
    var t = e.target;
    if (t.dataset && t.dataset.sf && fields[t.dataset.sf]){ var id = t.dataset.sf, v = fieldValue(id, t.value); if (v == null) return;
      S.liveField = id; var box = $(id); if (box) box.value = t.value; fields[id].set(r4(v)); return; }
    if (t.dataset && t.dataset.k === 'arot'){ var fr = curFrame(); if (!fr) return; if (!S.arotUndo){ commit(); S.arotUndo = true; } var r = (fr[S.aBone] || [0, 0, 0]).slice(); r[+t.dataset.i] = +t.value; fr[S.aBone] = r; var lab = t.nextElementSibling; if (lab) lab.textContent = Math.round(+t.value) + '°'; rebuildScene(); return; }
    if (t.dataset && t.dataset.k === 'jpose'){ S.pose[t.dataset.n] = +t.value; var lab = t.nextElementSibling, j = S.doc.rig[t.dataset.n]; if (lab) lab.textContent = j && j.slide ? fmtLen(+t.value) : Math.round(+t.value) + '°'; rebuildScene(); }
  });
  $('body').addEventListener('change', function(e){
    var t = e.target;
    if (t.dataset && t.dataset.sf){ S.liveField = null; S.liveCommitted = false; renderPanel(); return; }
    if (fields[t.id]){ var v = fieldValue(t.id, t.value); if (v != null) fields[t.id].set(r4(v)); return; }
    if (t.dataset.k && CHANGES[t.dataset.k]) CHANGES[t.dataset.k](t);
  });
  $('body').addEventListener('keydown', function(e){ if (e.key === 'Enter' && fields[e.target.id]){ e.target.blur(); } });

  function renderPanel(){
    fieldSeq = 0; fields = {};
    var f = {sound:panelSound, piece:panelPiece, car:panelCar, model:panelModel, moves:panelMoves, anim:panelAnim, paint:panelPaint, damage:panelDamage, check:isModel() ? panelCheckModel : panelCheck}[S.tab] || panelPiece;
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
        makeCard() + '<div class="card"><h3>Keys (keyboard)</h3><p class="muted">Delete removes · Ctrl+D duplicates · Ctrl+Z undo · arrows move left/right and front/back, Page Up/Down up and down · M mirror · F fit · Esc stop adding</p></div>';
    }
    if (sel.length > 1) return panelMany(sel);
    var p = sel[0], h = '<span class="stamp">' + esc(shapeName(p)) + '</span> <span class="muted">' + esc(p.name || p.id) + '</span>';
    h += '<div class="row"><label class="l">Name</label><input class="grow" type="text" data-k="name" value="' + esc(p.name || '') + '" placeholder="e.g. left door"></div>';
    if (p.g !== 'wheel' && S.layer === 'car') h += '<div class="row"><label class="l">Part of</label><select class="grow" data-k="g">' + partOpts().map(function(o){ return '<option value="' + o[0] + '"' + (p.g === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
    if (p.fn === 'axle' && !isModel()){
      var ax1 = p.axle || {};
      h += '<div class="card"><h3>Axle</h3><div class="row"><label><input type="checkbox" data-k="asteer"' + (ax1.steer ? ' checked' : '') + '>Steers (its wheels turn)</label><label><input type="checkbox" data-k="adrive"' + (ax1.driven ? ' checked' : '') + '>Driven (the engine turns it)</label></div>' +
        '<div class="row"><label class="l">Wheels apart</label>' + num('axle track', M.axlesOf(S.doc).filter(function(a){ return a.p === p; })[0].track*2, 'len', function(v){ edit(function(q){ q.d = (q.d || [1.4, 0.07, 0.07]).slice(); q.d[0] = r4(Math.max(0.2, v - S.doc.setup.wheelW)); }); }, {min:0.3, ax:'x'}) + '</div>' +
        '<p class="muted">Its wheels sit on its two ends, so moving it moves them. It stays on the middle line at wheel height; drag it forward or back. Turn on <b>Steer</b> below the view to see the steering wheels turn.</p></div>';
    }
    h += '<div class="card"><h3>Where (' + unitLabel() + ')</h3><div class="trio">' + ['x','y','z'].map(function(a, i){ return num(a, p.pos[i], 'len', function(v){ edit(function(q){ q.pos[i] = v; }); }, {ax:a}); }).join('') + '</div>' +
      '<p class="muted">X right, Y up, Z forward. The car\'s middle is X 0, the ground Y 0.</p></div>';
    h += '<div class="card"><h3>Size</h3>' + sizeFields(p) + '</div>';
    h += '<div class="card"><h3>Turn (degrees)</h3><div class="trio">' + ['x','y','z'].map(function(a, i){ return num(a, p.rot[i], 'deg', function(v){ edit(function(q){ q.rot[i] = v; }); }, {ax:a}); }).join('') + '</div>' +
      '<div class="row"><button class="alt sm" data-a="turnY">Quarter turn</button><button class="alt sm" data-a="unturn">Square up</button></div>' +
      (p.rot[0] || p.rot[2] || (p.rot[1] % 90) ? '<p class="muted">A turn that is not a quarter turn about Y is saved as a shaped piece, exactly as you see it.</p>' : '') + '</div>';
    h += '<div class="card"><h3>Look</h3><div class="row"><label class="l">Colour</label><button class="sw" style="background:' + esc(M.colourHex(S.doc, pal(), p.c).hex) + '" data-a="toPaint"></button><span class="muted">' + esc(colourLabel(p.c)) + '</span>' +
      '<label><input type="checkbox" data-k="dark"' + (/_D$/.test(p.c) ? ' checked' : '') + '>Shade</label></div>' +
      '<div class="swatches">' + quickSwatches(p.c) + '</div>' +
      '<div class="row"><label><input type="checkbox" data-k="glow"' + (p.glow ? ' checked' : '') + '>Glows (lamps)</label></div></div>';
    h += '<div class="card"><h3>What it is</h3><div class="row"><label class="l">Material</label><select class="grow" data-k="m">' + Object.keys(M.MATERIALS).map(function(k){ return '<option value="' + k + '"' + ((p.m || M.guessMaterial(p.c)) === k ? ' selected' : '') + '>' + M.MATERIALS[k].label + '</option>'; }).join('') + '</select></div>' +
      (p.g !== 'wheel' && !isModel() ? '<div class="row"><label class="l">Job</label><select class="grow" data-k="fn"><option value="">None</option>' + Object.keys(M.FUNCTIONS).map(function(k){ return '<option value="' + k + '"' + (p.fn === k ? ' selected' : '') + '>' + M.FUNCTIONS[k].label + '</option>'; }).join('') + '</select></div>' +
        (p.fn ? '<p class="muted">' + esc(M.FUNCTIONS[p.fn].hint) + '</p>' : '') +
        '<div class="row"><label><input type="checkbox" data-k="hidden"' + (p.hidden ? ' checked' : '') + '>Inside part (not drawn in the game)</label></div>' : '') + '</div>';
    if (S.layer !== 'state' && p.g !== 'wheel') h += '<div class="card"><h3>Symmetry</h3><div class="row"><label><input type="checkbox" data-k="mx"' + (p.mx ? ' checked' : '') + '>Mirror left / right</label><label><input type="checkbox" data-k="mz"' + (p.mz ? ' checked' : '') + '>Mirror front / back</label></div></div>';
    h += makeCard();
    h += actionsRow(1);
    return h;
  }
  function panelMany(sel){
    var h = '<span class="stamp">' + sel.length + ' pieces</span>';
    h += '<div class="card"><h3>Move together</h3><div class="trio">' + ['x','y','z'].map(function(a, i){ return '<div class="num"><span class="ax ' + a + '">' + a.toUpperCase() + '</span><button data-a="nudge" data-i="' + i + '" data-d="-1">−</button><button data-a="nudge" data-i="' + i + '" data-d="1">+</button></div>'; }).join('') + '</div><p class="muted">Each tap moves one grid step. Or drag any selected piece.</p></div>';
    h += '<div class="card"><h3>Look</h3><div class="swatches">' + quickSwatches(null) + '</div></div>';
    h += '<div class="card"><h3>What they are</h3><div class="row"><label class="l">Material</label><select class="grow" data-k="m"><option value="">(mixed)</option>' + Object.keys(M.MATERIALS).map(function(k){ return '<option value="' + k + '">' + M.MATERIALS[k].label + '</option>'; }).join('') + '</select></div>' +
      (S.layer === 'car' ? '<div class="row"><label class="l">Part of</label><select class="grow" data-k="g"><option value="">(mixed)</option>' + partOpts().map(function(o){ return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></div>' : '') + '</div>';
    h += makeCard();
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
    return list.map(function(c){ return '<button class="sw' + (c === cur ? ' on' : '') + '" title="' + esc(colourLabel(c)) + '" style="background:' + esc(M.colourHex(S.doc, pal(), c).hex) + '" data-a="col" data-c="' + esc(c) + '"></button>'; }).join('') +
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

      '<div class="row"><label class="l">Arch room</label>' + num('arch clearance', s.archClear, 'len', function(v){ setup(function(st){ st.archClear = v; }); }, {min:0}) + '</div>' +
      '<div class="row"><button class="alt sm" data-a="makeWheel">Make a new plain wheel at this size</button></div>' +
      '<p class="muted">Arch room is the gap over the tyre; bigger tyres from the vehicle kit lift the car to clear it.</p></div>';
    var AX = M.axlesOf(d), DT = M.drivetrain(d);
    h += '<div class="card"><h3>Axles and drive</h3><p class="muted">Wheels are not loose: each axle carries a pair. Power goes engine → gearbox → driveshaft → each <b>driven</b> axle; <b>steering</b> axles turn their wheels.</p><div class="list">' +
      AX.map(function(a, i){ return '<div class="it"><span class="nm">' + esc(a.p.name || 'axle ' + (i + 1)) + ' <span class="muted">' + fmtLen(a.z) + (a.steer ? ' · steers' : '') + (a.driven ? ' · driven' : '') + (a.p.hidden ? ' · inside' : '') + '</span></span><button class="alt sm" data-a="selAxle" data-id="' + esc(a.p.id) + '">Select</button></div>'; }).join('') + '</div>' +
      '<div class="row"><button class="alt sm" data-a="addAxle">Add an axle</button></div>' +
      '<table>' + tr('Drive', {FWD:'front-wheel drive', RWD:'rear-wheel drive', '4WD':'four-wheel drive', AWD:'all-wheel drive', none:'nothing driven'}[DT.layout]) + tr('Wheels', AX.length*2) + '</table>' +
      DT.issues.map(function(c){ return '<div class="msg ' + c[0] + '">' + esc(c[1]) + '</div>'; }).join('') +
      '<div class="row"><label><input type="checkbox" data-k="dshaft"' + (s.drawShaft === false ? '' : ' checked') + '>Draw the driveshaft and differentials in the game</label></div></div>';
    h += '<div class="card"><h3>Load bed</h3><div class="row"><label><input type="checkbox" data-k="bed"' + (s.bed ? ' checked' : '') + '>Has an open load bed (pickups, flatbeds)</label></div>' +
      (s.bed ? '<div class="row"><label class="l">Floor height</label>' + num('bed y', s.bed.y, 'len', function(v){ setup(function(st){ st.bed.y = v; }); }) + '</div><div class="row"><label class="l">Middle</label>' + num('bed z', s.bed.z, 'len', function(v){ setup(function(st){ st.bed.z = v; }); }, {ax:'z'}) + '</div>' +
        '<div class="row"><label class="l">Size</label>' + num('bed width', s.bed.w, 'len', function(v){ setup(function(st){ st.bed.w = v; }); }, {ax:'x'}) + num('bed length', s.bed.d, 'len', function(v){ setup(function(st){ st.bed.d = v; }); }, {ax:'z'}) + '</div>' : '') + '</div>';
    h += '<div class="card"><h3>On the road</h3><div class="row"><label class="l">Fuel tank</label><select class="grow" data-k="tank">' + [['small','Small (about 250 miles)'],['medium','Medium (about 350 miles)'],['large','Large (about 450 miles)']].map(function(o){ return '<option value="' + o[0] + '"' + (s.tank === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><label class="l">Top speed</label>' + num('top speed', s.topSpeed || 85, 'n', function(v){ setup(function(st){ st.topSpeed = Math.round(v); }); }, {min:10, max:160, step:5}) + '<span class="muted">mph</span></div></div>';
    h += '<div class="card"><h3>What the game will get</h3><table>' +
      tr('Seats', g.seats) + tr('Drives', g.driveable ? 'yes' : 'no (needs an engine and a seat)') + tr('Range on a full tank', g.rangeMiles ? g.rangeMiles + ' miles' : 'no tank') +
      tr('Cargo', g.cargoSlots + ' slots') + tr('Sleeps', g.sleeps || '—') + tr('Engine', g.power) +
      tr('Length', fmtLen(sp.length)) + tr('Width', fmtLen(sp.width)) + tr('Roof', fmtLen(sp.roof.y)) + tr('Wheelbase', fmtLen(s.axles[0] - s.axles[s.axles.length - 1])) + tr('Ground clearance', fmtLen(sp.ground)) +
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
    if (!isModel()) h += '<div class="card"><h3>The car\'s paint</h3><p class="muted">Pieces in Paint 1, 2 or 3 take these colours. Players can repaint them in the game; found cars come in other colours.</p>' +
      ['paint1','paint2','paint3'].map(function(k){ return '<div class="row"><button class="sw' + (cur === k ? ' on' : '') + '" style="background:' + esc(d.paint[k]) + '" data-a="col" data-c="' + k + '"></button><label class="l">' + colourLabel(k) + '</label><input type="color" data-k="paint" data-slot="' + k + '" value="' + esc(d.paint[k]) + '"></div>'; }).join('') + '</div>';
    h += '<div class="card"><h3>Your colours</h3><div class="swatches">' + Object.keys(d.colours).map(function(c){ return '<button class="sw' + (cur === c ? ' on' : '') + '" style="background:' + esc(d.colours[c]) + '" data-a="col" data-c="' + esc(c) + '"></button>'; }).join('') +
      '</div><div class="row"><input type="color" id="newCol" value="#6a7a5a"><button class="alt sm" data-a="addCol">Add colour</button></div><p class="muted">The game shares one palette; your own colours travel inside the pack.</p></div>';
    var PL = pal(), keys = Object.keys(isModel() ? ((SH[S.doc.target.pack] || {}).palette || PL) : PL).filter(function(k){ return !/^paint/.test(k); });
    if (isModel()){
      var used = {}; S.doc.pieces.forEach(function(p){ var n = String(p.c).replace(/_D$/, ''); if (/^[A-Z][A-Z0-9_]*$/.test(n)) used[n] = 1; });
      var sl = Object.keys(used).concat(Object.keys(S.doc.slotColours || {})).filter(function(v, i, a){ return a.indexOf(v) === i; });
      if (sl.length) h += '<div class="card"><h3>Colour slots</h3><p class="muted">The game fills these (a bike\'s paint, a wall\'s colour, the survivor\'s skin). Pick a colour to preview with; the model keeps the slot.</p>' +
        sl.map(function(k){ var hx = PL[k] || '#888888'; return '<div class="row"><button class="sw' + (cur === k ? ' on' : '') + '" style="background:' + esc(hx) + '" data-a="col" data-c="' + esc(k) + '"></button><label class="l">' + esc(k) + '</label><input type="color" data-k="slotcol" data-slot="' + esc(k) + '" value="' + esc(/^#[0-9a-f]{6}$/i.test(hx) ? hx : '#888888') + '"></div>'; }).join('') + '</div>';
    }
    h += '<div class="card"><h3>' + (isModel() ? esc(S.doc.target.pack) + ' palette' : 'Game palette') + '</h3><div class="swatches">' + keys.map(function(c){ return '<button class="sw' + (cur === c ? ' on' : '') + '" title="' + esc(c) + '" style="background:' + esc(PL[c]) + '" data-a="col" data-c="' + esc(c) + '"></button>'; }).join('') + '</div></div>';
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
    h += '<div class="card"><h3>Joined up</h3><p class="muted">As in Space Engineers, every block should touch the rest; a floating piece usually means a gap.</p><div class="row"><button class="alt sm" data-a="selLoose">Select loose pieces</button></div></div>';
    h += '<div class="card"><h3>Pieces</h3><table>' + tr('Pieces you placed', S.doc.pieces.filter(function(p){ return !p.hidden; }).length) + tr('Inside parts', S.doc.pieces.filter(function(p){ return p.hidden; }).length) +
      tr('Mirrored', S.doc.pieces.filter(function(p){ return p.mx || p.mz; }).length) + tr('Pack size', Math.round(JSON.stringify(A).length/1024) + ' KB') + '</table></div>';
    h += '<div class="card"><h3>Units</h3><div class="row"><button class="' + (S.units === 'imp' ? 'on' : 'alt') + ' sm" data-a="units" data-u="imp">Inches and feet</button><button class="' + (S.units === 'met' ? 'on' : 'alt') + ' sm" data-a="units" data-u="met">Centimetres and metres</button></div></div>';
    return h;
  }

  /* ---------------------------------------------------------------- models: kind, parts, points (any asset that is not a car) */
  var DIRS = [['+Z (forward)', [0, 0, 1]], ['-Z (back)', [0, 0, -1]], ['+X (right)', [1, 0, 0]], ['-X (left)', [-1, 0, 0]], ['+Y (up)', [0, 1, 0]], ['-Y (down)', [0, -1, 0]]];
  function dirIndex(d){ d = d || [0, 0, 1]; for (var i = 0; i < DIRS.length; i++) if (DIRS[i][1][0] === d[0] && DIRS[i][1][1] === d[1] && DIRS[i][1][2] === d[2]) return i; return 0; }
  function panelModel(){
    var d = S.doc, A = asset(), K = M.KINDS[d.kind] || M.KINDS.furniture, h = '<span class="stamp">Model</span>';
    h += '<div class="card"><h3>What it is</h3>' +
      '<div class="row"><label class="l">Kind</label><select class="grow" data-k="kind">' + Object.keys(M.KINDS).map(function(k){ return '<option value="' + k + '"' + (d.kind === k ? ' selected' : '') + '>' + esc(M.KINDS[k].label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><label class="l">Made by</label><input class="grow" type="text" data-k="author" value="' + esc(d.author || '') + '"></div>' +
      '<div class="row"><label class="l">Pack</label><select class="grow" data-k="tpack">' + M.STOCK_PACKS.concat(['props']).filter(function(v, i, a){ return a.indexOf(v) === i; }).sort().map(function(k){ return '<option' + (d.target.pack === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><label class="l">Group</label><input class="grow" type="text" data-k="tgroup" value="' + esc(d.target.group) + '"></div>' +
      '<div class="row"><label class="l">Name</label><input class="grow" type="text" data-k="tname" value="' + esc(d.target.name) + '"></div>' +
      '<p class="muted">' + (d.from ? 'Opened from <b>' + esc(d.from) + '</b>. Saved into a pack, it <b>replaces</b> that model in the game when the pack loads (give it another name above to add a new model instead).' : 'A new model: it is added to <b>' + esc(d.target.pack + '.' + d.target.group) + '</b> when a pack with it loads.') + '</p></div>';
    h += '<div class="card"><h3>Parts</h3><div class="list">' + partNames().map(function(n){
      var cnt = d.pieces.filter(function(p){ return p.g === n; }).length;
      return '<div class="it"><span class="nm">' + esc(n.replace(/_/g, ' ')) + ' <span class="muted">' + cnt + ' pieces</span></span><button class="alt sm" data-a="hidePart" data-n="' + esc(n) + '">' + (S.hideParts[n] ? 'Show' : 'Hide') + '</button>' +
        (cnt || partNames().length < 2 ? '' : '<button class="alt sm" data-a="delPart" data-n="' + esc(n) + '">Remove</button>') + '</div>'; }).join('') + '</div>' +
      '<div class="row"><input class="grow" id="partName" type="text" placeholder="New part (e.g. lid, door, searched)"><button class="sm" data-a="addPart">Add part</button></div>' +
      '<p class="muted">A part is one list of pieces the game draws together. Models with states (a container closed and searched) or moving parts keep each in its own part. Pick the part a piece belongs to on the Piece tab.</p></div>';
    h += '<div class="card"><h3>Points</h3>';
    var pts = d.points || [];
    h += pts.length ? '<div class="list">' + pts.map(function(pt, i){
      return '<div class="it" style="flex-wrap:wrap"><button class="' + (i === S.selPoint ? 'on' : 'alt') + ' sm" data-a="selPoint" data-i="' + i + '">' + esc(pt.name) + '</button>' +
        '<select data-k="ptkind" data-i="' + i + '">' + Object.keys(M.POINT_KINDS).map(function(k){ return '<option value="' + k + '"' + (pt.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' +
        [0, 1, 2].map(function(ax){ return '<input style="width:62px" inputmode="decimal" data-k="ptv" data-i="' + i + '" data-ax="' + ax + '" value="' + fmtNum(toUnit(pt.pos[ax])) + '" aria-label="' + 'xyz'[ax] + '">'; }).join('') +
        '<select data-k="ptdir" data-i="' + i + '">' + DIRS.map(function(o, j){ return '<option value="' + j + '"' + (dirIndex(pt.dir) === j ? ' selected' : '') + '>' + o[0] + '</option>'; }).join('') + '</select>' +
        '<button class="alt sm" data-a="delPoint" data-i="' + i + '">Delete</button>' +
        (pt.kind === 'light' ? '<div class="row" style="width:100%"><label class="l">Light</label><input type="color" data-k="ptcol" data-i="' + i + '" value="' + esc(pt.colour || '#ffd9a0') + '">' + num('reach', pt.radius || 6, 'len', function(v){ commit(); S.doc.points[i].radius = v; changed(false); }, {min:0.5}) + '</div>' : '') + '</div>'; }).join('') + '</div>' : '<p class="muted">No points yet.</p>';
    h += '<div class="row"><select id="ptNew" class="grow">' + Object.keys(M.POINT_KINDS).map(function(k){ return '<option value="' + k + '"' + (K.points.indexOf(k) >= 0 ? '' : '') + '>' + k + ' - ' + esc(M.POINT_KINDS[k]) + '</option>'; }).join('') + '</select><button class="sm" data-a="addPoint">Add point</button></div>' +
      '<p class="muted">Points are measured in the units you chose (X right, Y up, Z forward), drawn as coloured markers. A new point goes at the middle of the selected piece. For this kind, useful points: <b>' + esc(K.points.join(', ')) + '</b>.</p></div>';
    if (d.kind === 'plant'){
      var sw = d.sway || (d.sway = {}), hv = d.harvest || (d.harvest = {});
      h += '<div class="card"><h3>Plant</h3><p class="muted">Grow a tree from Make on the Piece tab. Wind moves each part by its sway (0 still, 1 the most). Growth stages and seasons are States below (ripe, fall, b and c for variety).</p>' +
        partNames().map(function(n){ return '<div class="row"><label class="l">Sway: ' + esc(n) + '</label><input class="grow" type="range" min="0" max="1" step="0.05" data-k="sway" data-n="' + esc(n) + '" value="' + (sw[n] != null ? sw[n] : 0.5) + '"></div>'; }).join('') +
        '<div class="muted" style="margin-top:6px"><b>Picked or cut, it gives</b></div>' + Object.keys(hv).map(function(k){ return '<div class="row"><label class="l">' + esc(k.replace(/_/g, ' ')) + '</label>' + num(k, hv[k], 'n', function(v){ commit(); if (v <= 0) delete S.doc.harvest[k]; else S.doc.harvest[k] = Math.round(v); changed(true); }, {min:0}) + '</div>'; }).join('') +
        '<div class="row"><input class="grow" id="hvAdd" type="text" placeholder="item (e.g. berries, wood, seed_packet)"><button class="alt sm" data-a="hvAdd">Add</button></div></div>';
    }
    if (d.kind === 'effect'){
      var E = d.effect || (d.effect = M.defaultEffect());
      h += '<div class="card"><h3>Effect</h3><div class="row"><label class="l">Looks like</label><select data-k="fxshape"><option value="puff"' + (E.shape === 'puff' ? ' selected' : '') + '>Puffs (smoke, dust)</option><option value="spark"' + (E.shape === 'spark' ? ' selected' : '') + '>Streaks (sparks, rain)</option><option value="chunk"' + (E.shape === 'chunk' ? ' selected' : '') + '>Chunks (debris)</option></select><label><input type="checkbox" data-k="fxglow"' + (E.glow ? ' checked' : '') + '>Glows</label></div>' +
        [['count','How many',1,200,1], ['life','Lasts (s)',0.1,10,0.1], ['spread','Spread (°)',0,180,5], ['gravity','Falls (−) or rises (+)',-20,20,0.5]].map(function(f){ return '<div class="row"><label class="l">' + f[1] + '</label>' + num('fx' + f[0], E[f[0]], 'n', function(v){ commit(); S.doc.effect[f[0]] = Math.max(f[2], Math.min(f[3], v)); changed(false); fxRun(); }, {min:f[2], max:f[3], step:f[4]}) + '</div>'; }).join('') +
        '<div class="row"><label class="l">Size</label>' + num('fxs0', E.size[0], 'len', function(v){ commit(); S.doc.effect.size[0] = v; changed(false); fxRun(); }) + num('fxs1', E.size[1], 'len', function(v){ commit(); S.doc.effect.size[1] = v; changed(false); fxRun(); }) + '</div>' +
        '<div class="row"><label class="l">Speed</label>' + num('fxv0', E.speed[0], 'n', function(v){ commit(); S.doc.effect.speed[0] = v; changed(false); fxRun(); }, {step:0.25}) + num('fxv1', E.speed[1], 'n', function(v){ commit(); S.doc.effect.speed[1] = v; changed(false); fxRun(); }, {step:0.25}) + '<span class="muted">m/s</span></div>' +
        '<div class="row"><label class="l">Colour</label><input type="color" data-k="fxc0" value="' + esc(E.colour[0]) + '"><span class="muted">to</span><input type="color" data-k="fxc1" value="' + esc(E.colour[1] || E.colour[0]) + '"></div>' +
        '<p class="muted">The view plays it on a loop (Effect, below the view). The pieces you build are what each particle looks like in the game\'s own effects; the numbers travel as asset.effect.</p></div>';
    }
    if (d.kind === 'held'){
      var z = d.design || (d.design = M.defaultDesign(d));
      h += '<div class="card"><h3>As an item in the game</h3>' +
        '<div class="row"><label class="l">Used as</label><select class="grow" data-k="dkind"><option value="melee"' + (z.kind === 'melee' ? ' selected' : '') + '>Weapon you swing</option><option value="throw"' + (z.kind === 'throw' ? ' selected' : '') + '>Thrown</option><option value="use"' + (z.kind === 'use' ? ' selected' : '') + '>Tool you use</option></select></div>' +
        (z.kind === 'melee' ? '<div class="row"><label class="l">Fights like</label><select class="grow" data-k="dshape">' + M.HELD_SHAPES.map(function(t, i){ return '<option value="' + i + '"' + ((z.shape | 0) === i ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' : '') +
        '<div class="row"><label class="l">Power</label><input class="grow" type="range" min="1" max="100" data-k="dpower" value="' + z.power + '"><span class="muted" style="width:34px;text-align:right">' + z.power + '</span></div>' +
        (z.kind === 'melee' ? '<div class="row"><label class="l">Reach</label>' + num('reach', z.reach || 1.5, 'len', function(v){ commit(); S.doc.design.reach = Math.max(1.5, Math.min(3.2, v)); changed(false); }, {step:0.1}) + '<span class="muted">1.5 to 3.2 m</span></div>' +
          '<div class="row"><label class="l">Speed</label>' + num('speed', z.spd || 1, 'n', function(v){ commit(); S.doc.design.spd = Math.max(0.7, Math.min(1.4, v)); changed(false); }, {step:0.05}) + '<span class="muted">0.7 slow to 1.4 quick</span></div>' : '') +
        '<div class="row"><label class="l">Icon colour</label><input type="color" data-k="dcolor" value="' + esc(z.color || '#8f959c') + '"><label><input type="checkbox" data-k="dtwo"' + (z.twoHanded ? ' checked' : '') + '>Two hands</label></div>' +
        '<p class="muted">These are the game\'s own item rules: power, reach and speed are kept in range so no pack can make an overpowered item.</p></div>';
      h += '<div class="card"><h3>Grip and wear</h3><p class="muted">The model\'s origin is where the right fist holds it; +Z points out of the fist. Turn on <b>In hand</b> below the view to see it held.</p>' +
        '<div class="row"><button class="alt sm" data-a="gripSel">Grip at the selected piece</button>' + (S.selPoint >= 0 ? '<button class="alt sm" data-a="gripPt">Grip at the selected point</button>' : '') + '</div>' +
        '<div class="row"><button class="alt sm" data-a="mkWorn">Make worn from new</button><button class="alt sm" data-a="mkBroken">Make broken from new</button></div>' +
        '<p class="muted">The game shows <b>worn</b> under a quarter condition. Make them again after changing <b>new</b>; edit them by picking the part above the view.</p></div>';
    }
    if (d.kind === 'item'){
      var it = d.item || (d.item = M.defaultItem(d)), rec = it.recipe || {};
      h += '<div class="card"><h3>As an item</h3>' +
        '<div class="row"><label class="l">Item key</label><input class="grow" type="text" data-k="ikey" value="' + esc(it.key) + '"></div>' +
        '<div class="row"><label class="l">Shown as</label><input class="grow" type="text" data-k="iname" value="' + esc(it.name) + '"></div>' +
        '<div class="row"><label class="l">Weight</label>' + num('weight', it.weightLb, 'n', function(v){ commit(); S.doc.item.weightLb = Math.max(0, v); changed(false); }, {step:0.5, min:0}) + '<span class="muted">lb</span></div>' +
        '<div class="row"><label class="l">Stacks to</label>' + num('stack', it.stack, 'n', function(v){ commit(); S.doc.item.stack = Math.max(1, Math.round(v)); changed(false); }, {min:1}) + '</div>' +
        '<div class="row"><label class="l">Uses</label>' + num('uses', it.uses, 'n', function(v){ commit(); S.doc.item.uses = Math.max(0, Math.round(v)); changed(false); }, {min:0}) + '<span class="muted">0 = not used up</span></div>' +
        '<div class="muted" style="margin-top:8px"><b>Made from</b></div>' + Object.keys(rec).map(function(k){ return '<div class="row"><label class="l">' + esc(k.replace(/_/g, ' ')) + '</label>' + num(k, rec[k], 'n', function(v){ commit(); if (v <= 0) delete S.doc.item.recipe[k]; else S.doc.item.recipe[k] = Math.round(v); changed(true); }, {min:0}) + '</div>'; }).join('') +
        '<div class="row"><select id="recAdd">' + M.RECIPE_ITEMS.filter(function(k){ return !rec[k]; }).map(function(k){ return '<option>' + k + '</option>'; }).join('') + '</select><button class="alt sm" data-a="recAdd">Add to recipe</button></div>' +
        '<p class="muted">The game decides what each item does by its key; a new key needs the game to know it (the main chat adds behaviours).</p></div>';
    }
    if (d.kind === 'held' || d.kind === 'item' || d.kind === 'furniture' || d.kind === 'container'){
      h += '<div class="card"><h3>Icon</h3><div class="row">' + (d.icon ? '<img src="' + d.icon + '" alt="icon" style="width:96px;height:96px;border-radius:6px;border:1px solid var(--edge)">' : '<span class="muted grow">No icon yet.</span>') +
        '<button class="alt sm" data-a="icon">' + (d.icon ? 'Draw it again' : 'Draw the icon') + '</button></div><p class="muted">Drawn from the model in a three-quarter view, for the backpack and the Items panel.</p></div>';
    }
    /* states */
    var V = d.variants || {}, hints = (M.STATE_HINT[d.kind] || ['broken']).filter(function(x){ return !V[x]; });
    h += '<div class="card"><h3>States</h3><p class="muted">The same model in another state: a container searched, a wall damaged, a fire out. Each is saved as <b>' + esc((d.target.name || d.target.group) + '_<state>') + '</b>.</p><div class="list">' +
      '<div class="it"><span class="nm">' + (S.variant ? '' : '<b>') + 'As it is' + (S.variant ? '' : ' (editing)</b>') + '</span>' + (S.variant ? '<button class="alt sm" data-a="editState2" data-s="">Edit</button>' : '') + '</div>' +
      Object.keys(V).map(function(st){ return '<div class="it"><span class="nm">' + (S.variant === st ? '<b>' + esc(st.replace(/_/g, ' ')) + ' (editing)</b>' : esc(st.replace(/_/g, ' '))) + ' <span class="muted">' + V[st].pieces.length + ' pieces</span></span>' +
        (S.variant === st ? '' : '<button class="alt sm" data-a="editState2" data-s="' + esc(st) + '">Edit</button>') + '<button class="alt sm" data-a="delState2" data-s="' + esc(st) + '">Delete</button></div>'; }).join('') + '</div>' +
      '<div class="row"><select id="newState">' + hints.concat(M.STATES.filter(function(x){ return hints.indexOf(x) < 0 && !V[x]; })).map(function(x){ return '<option>' + x + '</option>'; }).join('') + '</select><button class="sm" data-a="addState2">Add state (copy of the model)</button></div></div>';
    /* size and weight (furniture that can be carried) */
    var fs = M.extraOf(d, 'furnitureSize');
    if (d.target.pack === 'props' && (d.kind === 'furniture' || d.kind === 'container')){
      var fv = fs ? fs.value : null;
      h += '<div class="card"><h3>Carrying</h3>' + (fv ? '<div class="row"><label class="l">Size</label><select class="grow" data-k="fsize">' + M.SIZE_CLASSES.map(function(c){ return '<option value="' + c[0] + '"' + (fv[0] === c[0] ? ' selected' : '') + '>' + esc(c[1]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="row"><label class="l">Weight</label>' + num('weight', Math.round(fv[1]*2.20462), 'n', function(v){ commit(); M.extraOf(S.doc, 'furnitureSize').value[1] = Math.round(v/2.20462); changed(true); }, {min:1, step:5}) + '<span class="muted">lb</span></div>'
        : '<p class="muted">It cannot be picked up and carried.</p><button class="alt sm" data-a="makeCarry">Let survivors carry it</button>') + '</div>';
    }
    /* creatures: what it eats and how it behaves (stored in the pack's creatures.<name>.info, beside height, speeds and health) */
    var ci = d.kind === 'creature' ? M.creatureInfo(d) : null;
    if (ci){
      var opt = function(L, cur, none){ return (none ? '<option value="">' + none + '</option>' : '') + L.map(function(o){ return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); };
      var MPH = 2.23694, gr = ci.group || [1, 1];
      h += '<div class="card"><h3>Food and temper</h3>' +
        '<div class="row"><label class="l">Diet</label><select class="grow" data-k="cdiet">' + opt(M.DIETS, ci.diet, 'Not set') + '</select></div>' +
        '<div class="muted" style="margin-top:6px"><b>Eats</b></div><div class="row" style="flex-wrap:wrap">' + M.FOODS.map(function(f){ return '<label style="min-width:46%"><input type="checkbox" data-k="ceat" data-f="' + f[0] + '"' + ((ci.eats || []).indexOf(f[0]) >= 0 ? ' checked' : '') + '>' + esc(f[1]) + '</label>'; }).join('') + '</div>' +
        '<div class="row"><label class="l">Temper</label><select class="grow" data-k="ctemper">' + opt(M.TEMPERS, ci.temper, 'Not set') + '</select></div>' +
        '<div class="row"><label class="l">Out and about</label><select class="grow" data-k="cactive">' + opt(M.ACTIVE, ci.active, 'Not set') + '</select></div>' +
        '<div class="row"><label class="l">Group of</label>' + num('group min', gr[0], 'n', function(v){ cinfo(function(i){ var g = (i.group || [1, 1]).slice(); g[0] = Math.max(1, Math.round(v)); g[1] = Math.max(g[0], g[1]); i.group = g; }); }, {min:1}) +
          '<span class="muted">to</span>' + num('group max', gr[1], 'n', function(v){ cinfo(function(i){ var g = (i.group || [1, 1]).slice(); g[1] = Math.max(1, Math.round(v)); g[0] = Math.min(g[0], g[1]); i.group = g; }); }, {min:1}) + '</div>' +
        '<div class="row"><label><input type="checkbox" data-k="cflag" data-f="flies"' + (ci.flies ? ' checked' : '') + '>Flies</label><label><input type="checkbox" data-k="cflag" data-f="water"' + (ci.water ? ' checked' : '') + '>Lives in water</label><label><input type="checkbox" data-k="cflag" data-f="tameable"' + (ci.tameable ? ' checked' : '') + '>Can be tamed</label></div>' +
        '<p class="muted">' + esc(M.behaviourText(ci)) + '</p></div>';
      h += '<div class="card"><h3>Body and strength</h3>' +
        '<div class="row"><label class="l">Health</label>' + num('health', ci.health || 0, 'n', function(v){ cinfo(function(i){ i.health = Math.max(1, Math.round(v)); }); }, {min:1, step:5}) + '</div>' +
        '<div class="row"><label class="l">Bite or hit</label>' + num('damage', ci.damage || 0, 'n', function(v){ cinfo(function(i){ i.damage = Math.max(0, Math.round(v)); }); }, {min:0}) + '</div>' +
        '<div class="row"><label class="l">Walks at</label>' + num('walk', Math.round((ci.walk || 1)*MPH*10)/10, 'n', function(v){ cinfo(function(i){ i.walk = r4(Math.max(0.1, v)/MPH); }); }, {min:0.1, step:0.5}) + '<span class="muted">mph</span></div>' +
        '<div class="row"><label class="l">Runs at</label>' + num('run', Math.round((ci.run || 1)*MPH*10)/10, 'n', function(v){ cinfo(function(i){ i.run = r4(Math.max(0.1, v)/MPH); }); }, {min:0.1, step:1}) + '<span class="muted">mph</span></div>' +
        '<div class="row"><label class="l">Runs off at</label>' + num('flee', ci.fleeAt || 0, 'n', function(v){ cinfo(function(i){ i.fleeAt = Math.max(0, Math.min(100, Math.round(v))); }); }, {min:0, max:100, step:5}) + '<span class="muted">% health</span></div></div>';
    }
    /* the pack's own details for this model, editable where they are simple values */
    var ex = d.extra || [];
    h += '<div class="card"><h3>Game details</h3>' + (ex.length ? ex.map(function(e, i){ return extraFields(e, i); }).join('') : '<p class="muted">Nothing else is stored with it.</p>') +
      (ex.some(function(e){ return e.path[0] === 'sizes' || e.path[0] === 'info'; }) ? '<div class="row"><button class="alt sm" data-a="measure">Measure it again from the pieces</button></div>' : '') + '</div>';
    return h;
  }
  /* ---------------------------------------------------------------- held items in a survivor's hand (W9) */
  function handGrip(){
    if (!isModel() || S.doc.kind !== 'held' || !S.preview.hand) return null;
    if (!SH.held || !SH.survivor){ if (!handGrip.loading){ handGrip.loading = true; M.loadStock(['held', 'survivor'], 'assets/shaped/', function(){ handGrip.loading = false; rebuildScene(); }); } return null; }
    return SH.held.grip.pos;
  }
  var manMesh = null;
  function mannequin(){
    if (manMesh) return manMesh;
    var V = SH.survivor, P = V.parts, pcs = [], add = function(o){ if (!o) return; if (Array.isArray(o)) pcs = pcs.concat(o); else for (var k in o) add(o[k]); };
    var b = 'masculine'; add(P.body[b]); add(P.top && P.top[b] && (P.top[b].tshirt || P.top[b][Object.keys(P.top[b])[0]])); add(P.bottoms && P.bottoms[b] && (P.bottoms[b].jeans || P.bottoms[b][Object.keys(P.bottoms[b])[0]]));
    var sh = P.shoes && (P.shoes.trainers || P.shoes[b] && P.shoes[b].trainers); add(sh);
    var pal = {}, k; for (k in (V.palette || {})) pal[k] = V.palette[k]; var sl = {SKIN:'#c99a7a', HAIR:'#4a3426', SHIRT:'#6a7a5a', PANTS:'#3e4a5a', ACC:'#9a3a30'}; for (k in sl) pal[k] = pal[k] || sl[k];
    pal.SKIN = '#c99a7a'; pal.SHIRT = '#6a7a5a'; pal.PANTS = '#3e4a5a';
    var dk = V.darker || 0.78, cf = function(n){ var d = /_D$/.test(n), h = pal[n.replace(/_D$/, '')] || '#999999', c = SH.hex(h); return d ? c.map(function(v){ return v*dk; }) : c; };
    var A = SH.build(pcs, cf), n = A.pos.length/3, col = new Float32Array(n*4);
    for (var i = 0; i < n; i++){ col[i*4] = A.col[i*3]; col[i*4+1] = A.col[i*3+1]; col[i*4+2] = A.col[i*3+2]; col[i*4+3] = 1; }
    manMesh = {pos:new Float32Array(A.pos), nor:new Float32Array(A.nor), col:col};
    return manMesh;
  }
  /* ---------------------------------------------------------------- icons (W10): the model drawn on its own, three-quarter view */
  /* the game takes icons up to 60,000 characters: a busy model is drawn again smaller until it fits */
  function renderIcon(cb, px){
    px = px || 256;
    var cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;left:-400px;top:0;width:' + px + 'px;height:' + px + 'px'; document.body.appendChild(cv);
    var v;
    try { v = WSV.create(cv, {}); } catch (e){ cv.remove(); toast('Could not draw the icon: ' + e.message); return; }
    var pcs = []; S.doc.pieces.forEach(function(p){ if (p.hidden) return; if (S.doc.kind === 'held' && p.g !== 'new') return; if (S.doc.variants && S.variant) return; pcs = pcs.concat(nativesOf(p)); });
    var m = trisOf(pcs), B = M.boundsOf(pcs);
    v.bg = [0.957, 0.918, 0.847]; v.set('m', {tris:m}, {order:1});
    if (B.ok){ v.cam.fov = 26; v.frame(B.mn, B.mx, true); v.cam.yaw = S.doc.kind === 'held' ? 1.25 : 0.7; v.cam.pitch = S.doc.kind === 'held' ? 0.55 : 0.42; v.cam.dist *= 1.08; }
    setTimeout(function(){ v.render(); var url = cv.toDataURL('image/png'); cv.remove(); if (url.length > 58000 && px > 64) renderIcon(cb, Math.round(px*0.7)); else cb(url); }, 60);
  }

  /* ---------------------------------------------------------------- skeletons, clips, characters (W5, W4) */
  function isSkel(){ return isModel() && !!S.doc.skeleton; }
  function curFrame(){ var F = S.aClip && S.doc.frames && S.doc.frames[S.aClip]; return F && F.length ? F[Math.min(S.aFrame, F.length - 1)] : null; }
  var BUILD = {slim:[0.9, 0.93], average:[1, 1], broad:[1.14, 1.08]};
  /* a bone's mesh: stretched for the build (not the head and neck, as the game does), then posed */
  function skelMesh(m, bone, frame){
    if (S.doc.garment && S.build !== 'average' && bone !== 'Head' && bone !== 'neck_01'){ var bb = BUILD[S.build]; m = xform(m, function(q, n){ return [[q[0]*bb[0], q[1], q[2]*bb[1]], n]; }); }
    var f = frame && M.skinFn(S.doc, bone, frame); return f ? xform(m, function(q, n){ return f(q, n); }) : m;
  }
  /* the survivor under a garment: the body and a plain outfit, leaving out the slot being made */
  var manBoned = null;
  function refPieces(){
    if (manBoned) return manBoned;
    var V = SH.survivor, P = V.parts, g = S.doc.garment, b = g.body || 'masculine', out = {}, add = function(o){ if (!o) return; for (var bone in o) if (Array.isArray(o[bone])) out[bone] = (out[bone] || []).concat(o[bone]); };
    add(P.body[b]);
    if (g.slot !== 'top') add(P.top[b].tshirt); if (g.slot !== 'bottoms' && !(g.slot === 'worn' && /trousers|thermals/.test(g.choice))) add(P.bottoms[b].jeans);
    if (g.slot !== 'shoes') add(P.shoes.trainers); if (g.slot !== 'hair' && g.slot !== 'hat') add(P.hair.short);
    manBoned = out; return out;
  }
  /* what a layer is fitted over: always the whole body shape (body, T-shirt, jeans, shoes), whatever is being made */
  function fitSource(){
    var V = SH.survivor, P = V.parts, b = (S.doc.garment && S.doc.garment.body) || 'masculine', out = {}, add = function(o){ if (!o) return; for (var bone in o) if (Array.isArray(o[bone])) out[bone] = (out[bone] || []).concat(o[bone]); };
    add(P.body[b]); add(P.top[b].tshirt); add(P.bottoms[b].jeans); add(P.shoes.trainers); return out;
  }
  function refBody(frame){
    var pal = {}, k, V = SH.survivor; for (k in (V.palette || {})) pal[k] = V.palette[k];
    var sd = S.doc.slotColours || {}; ['SKIN','HAIR','SHIRT','PANTS','ACC'].forEach(function(k2){ pal[k2] = sd[k2] || {SKIN:'#dcae8c', HAIR:'#4a3426', SHIRT:'#6a7a5a', PANTS:'#3e4a5a', ACC:'#9a3a30'}[k2]; });
    if (!/^#/.test(pal.SHIRT)) pal.SHIRT = '#6a7a5a'; if (!/^#/.test(pal.PANTS)) pal.PANTS = '#3e4a5a';
    var dk = V.darker || 0.78, cf = function(n){ var d = /_D$/.test(n), c = SH.hex(pal[n.replace(/_D$/, '')] || '#999999'); return d ? c.map(function(v){ return v*dk; }) : c; };
    var R = refPieces(), out = [];
    Object.keys(R).forEach(function(bone){ var A = SH.build(R[bone], cf), n = A.pos.length/3, col = new Float32Array(n*4);
      for (var i = 0; i < n; i++){ col[i*4] = A.col[i*3]; col[i*4+1] = A.col[i*3+1]; col[i*4+2] = A.col[i*3+2]; col[i*4+3] = 1; }
      out.push(skelMesh({pos:new Float32Array(A.pos), nor:new Float32Array(A.nor), col:col}, bone, frame)); });
    return out;
  }
  function boneLines(){
    var B = S.doc.skeleton, pos = [], col = [], fr = curFrame();
    Object.keys(B).forEach(function(b){ var j = B[b], f = fr && M.skinFn(S.doc, b, fr), a = j.pivot, t = j.tip || [a[0], a[1] + 0.1, a[2]];
      if (f){ a = f(a)[0]; t = f(t)[0]; }
      var on = b === S.aBone, c = on ? [0.95, 0.45, 0.15, 1] : [0.2, 0.55, 0.85, 1];
      pos.push(a[0], a[1], a[2], t[0], t[1], t[2]); col.push.apply(col, c.concat(c));
      var s = on ? 0.03 : 0.018; [[s,0,0],[0,s,0],[0,0,s]].forEach(function(d){ pos.push(a[0]-d[0], a[1]-d[1], a[2]-d[2], a[0]+d[0], a[1]+d[1], a[2]+d[2]); col.push.apply(col, c.concat(c)); }); });
    return {pos:pos, col:col};
  }
  var animT = 0;
  function stopAnim(){ clearInterval(animT); animT = 0; S.aPlay = false; }
  function playAnim(){ stopAnim(); var F = S.doc.frames[S.aClip]; if (!F || F.length < 2) return; S.aPlay = true; var fps = S.doc.fps || 4;
    animT = setInterval(function(){ S.aFrame = (S.aFrame + 1) % F.length; rebuildScene(); var lab = $('frameLab'); if (lab) lab.textContent = 'Frame ' + (S.aFrame + 1) + ' of ' + F.length; }, 1000/fps); }
  function panelAnim(){
    var d = S.doc, B = d.skeleton || {}, C = d.frames || {}, names = Object.keys(C), shared = !!d.skeletonShared, h = '<span class="stamp">Animate</span>';
    if (S.aClip && !C[S.aClip]) S.aClip = null;
    h += '<p>' + (shared ? 'This part rides the survivor\'s skeleton: play the game\'s clips to see it move with the body. The survivor\'s bones and clips are shared by everyone, so they are shown here, not saved with the part.' : 'Bones carry the pieces; a clip is a run of frames, each turning bones about their pivots (X, then Y, then Z, children carried).') + '</p>';
    h += '<div class="card"><h3>Clip</h3><div class="row"><select class="grow" data-k="aclip"><option value="">Rest pose</option>' + names.map(function(n){ return '<option' + (S.aClip === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div>';
    if (S.aClip){ var F = C[S.aClip];
      h += '<div class="row"><span id="frameLab" class="muted grow">Frame ' + (Math.min(S.aFrame, F.length - 1) + 1) + ' of ' + F.length + '</span><button class="alt sm" data-a="fprev">◀</button><button class="' + (S.aPlay ? 'on' : 'alt') + ' sm" data-a="aplay">' + (S.aPlay ? 'Stop' : 'Play') + '</button><button class="alt sm" data-a="fnext">▶</button></div>' +
        '<div class="row" style="flex-wrap:wrap">' + F.map(function(fr, i){ return '<button class="' + (i === S.aFrame ? 'on' : 'alt') + ' sm" data-a="fgo" data-i="' + i + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
        '<div class="row"><label><input type="checkbox" data-k="onion"' + (S.onion ? ' checked' : '') + '>Show the frame before</label><label class="l" style="width:auto">Speed</label>' + num('fps', d.fps || 4, 'n', function(v){ S.doc.fps = Math.max(1, Math.min(30, Math.round(v))); if (S.aPlay) playAnim(); renderPanel(); }, {min:1, max:30}) + '<span class="muted">frames a second</span></div>';
      if (!shared) h += '<div class="row"><button class="alt sm" data-a="fadd">Add a frame (copy of this one)</button><button class="alt sm" data-a="fdel">Delete this frame</button></div>';
    }
    if (!shared) h += '<div class="row"><input class="grow" id="newClip" type="text" placeholder="New clip (e.g. walk, attack)"><button class="sm" data-a="aclipNew">Add clip</button></div>';
    h += '</div>';
    /* the selected bone */
    var bn = S.aBone && B[S.aBone] ? S.aBone : null;
    h += '<div class="card"><h3>Bone</h3><div class="row"><select class="grow" data-k="abone"><option value="">Pick a bone (or tap the model)</option>' + Object.keys(B).map(function(b){ return '<option' + (bn === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') + '</select></div>';
    if (bn){
      var fr = curFrame(), rv = (fr && fr[bn]) || [0, 0, 0];
      if (S.aClip && !shared) h += '<div class="muted">Turn in this frame (degrees)</div>' + [0, 1, 2].map(function(i){ return '<div class="row"><span class="ax ' + 'xyz'[i] + '" style="color:#fff;border-radius:3px;padding:2px 6px;font-size:11px">' + 'XYZ'[i] + '</span><input class="grow" type="range" min="-180" max="180" step="1" data-k="arot" data-i="' + i + '" value="' + rv[i] + '"><span class="muted" style="width:40px;text-align:right">' + Math.round(rv[i]) + '°</span></div>'; }).join('') + '<div class="row"><button class="alt sm" data-a="aclear">Clear this bone in this frame</button></div>';
      else if (S.aClip) h += '<p class="muted">Turn in this frame: ' + rv.map(function(v){ return Math.round(v) + '°'; }).join(', ') + '</p>';
      if (!shared){ var j = B[bn];
        h += '<div class="muted" style="margin-top:6px">Pivot (' + unitLabel() + ')</div><div class="trio">' + [0, 1, 2].map(function(i){ return num('pivot ' + 'xyz'[i], j.pivot[i], 'len', function(v){ commit(); S.doc.skeleton[bn].pivot[i] = v; changed(true); }, {ax:'xyz'[i]}); }).join('') + '</div>' +
          '<div class="row"><label class="l">Hangs from</label><select class="grow" data-k="bparent"><option value="">(nothing: the root)</option>' + Object.keys(B).filter(function(x){ return x !== bn; }).map(function(x){ return '<option' + (j.parent === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>';
      }
      h += '<p class="muted">' + S.doc.pieces.filter(function(p){ return p.g === bn; }).length + ' pieces ride this bone. Change a piece\'s bone on the Piece tab (Part of).</p>';
    }
    if (!shared) h += '<div class="row"><input class="grow" id="newBone" type="text" placeholder="New bone (e.g. tail_2)"><button class="alt sm" data-a="boneNew">Add bone at the selected piece</button></div>';
    h += '</div>';
    if (d.garment){
      h += '<div class="card"><h3>Fit to the body</h3><p class="muted">Makes a layer a set distance out from the survivor\'s own pieces on the bones you pick (a sleeve, a trouser leg, a coat), so it fits every build the way the game\'s clothes do.</p>' +
        '<div class="row" style="flex-wrap:wrap">' + Object.keys(fitSource()).map(function(b){ return '<label style="font-size:13px"><input type="checkbox" class="fitb" value="' + esc(b) + '"' + (b === S.aBone ? ' checked' : '') + '>' + esc(b) + '</label>'; }).join('') + '</div>' +
        '<div class="row"><label class="l">Gap</label>' + num('gap', S.fitGap || 0.012, 'len', function(v){ S.fitGap = Math.max(0.002, v); renderPanel(); }, {min:0.002}) + '<select id="fitCol"><option>SHIRT</option><option>PANTS</option><option>ACC</option><option>SKIN</option></select><button class="sm" data-a="fitLayer">Make the layer</button></div></div>';
    }
    return h;
  }

  /* ---------------------------------------------------------------- sounds (W15): a recipe of layers, recorded by the browser into WAV takes */
  function panelSound(){
    var d = S.doc, h = '<span class="stamp">Sound</span>';
    h += '<div class="row"><label class="l">Game key</label><input class="grow" type="text" data-k="skey" value="' + esc(d.key) + '" list="skeys"><datalist id="skeys">' + M.SOUND_KEYS_HINT.map(function(k){ return '<option value="' + k + '">'; }).join('') + '</datalist></div>' +
      '<p class="muted">The game plays sounds by key (step_gravel, hit_metal ...). A pack sound with a key the game already has replaces it; a new key needs the game to play it.</p>';
    h += '<div class="row"><label class="l">Length</label>' + num('length', d.length, 'n', function(v){ commit(); S.doc.length = Math.max(0.05, Math.min(4, v)); changed(true); }, {step:0.05, min:0.05}) + '<span class="muted">s</span></div>' +
      '<div class="row"><label class="l">Takes</label>' + num('takes', d.variations, 'n', function(v){ commit(); S.doc.variations = Math.max(1, Math.min(6, Math.round(v))); changed(true); }, {min:1, max:6}) + '<label class="l" style="width:auto">Vary</label>' + num('vary', Math.round(d.vary*100), 'n', function(v){ commit(); S.doc.vary = Math.max(0, Math.min(0.5, v/100)); changed(true); }, {min:0, max:50}) + '<span class="muted">%</span></div>';
    d.layers.forEach(function(L, i){
      h += '<div class="card"><h3>Layer ' + (i + 1) + '</h3><div class="row"><select data-k="slk" data-i="' + i + '"><option value="noise"' + (L.kind === 'noise' ? ' selected' : '') + '>Noise</option><option value="tone"' + (L.kind === 'tone' ? ' selected' : '') + '>Tone</option></select>' +
        (L.kind === 'tone' ? '<select data-k="slw" data-i="' + i + '">' + ['sine','triangle','square','sawtooth'].map(function(w){ return '<option' + (L.wave === w ? ' selected' : '') + '>' + w + '</option>'; }).join('') + '</select>' : '') +
        '<select data-k="slf" data-i="' + i + '">' + ['none','lowpass','highpass','bandpass'].map(function(w){ return '<option' + (L.filter === w ? ' selected' : '') + '>' + w + '</option>'; }).join('') + '</select><button class="alt sm" data-a="sdel" data-i="' + i + '">Remove</button></div>' +
        [['freq', 'Pitch from', 20, 12000, 'Hz'], ['freq2', 'Slides to', 20, 12000, 'Hz'], ['attack', 'Attack', 0, 1, 's'], ['hold', 'Hold', 0, 2, 's'], ['release', 'Release', 0, 3, 's'], ['gain', 'Level', 0, 1, ''], ['delay', 'Starts at', 0, 2, 's']].map(function(f){
          return '<div class="row"><label class="l">' + f[1] + '</label>' + num(f[0] + i, L[f[0]], 'n', function(v){ commit(); S.doc.layers[i][f[0]] = Math.max(f[2], Math.min(f[3], v)); changed(true); }, {min:f[2], max:f[3], step:f[3] > 100 ? 20 : f[3] > 1 ? 0.05 : 0.01}) + '<span class="muted">' + f[4] + '</span></div>'; }).join('') + '</div>';
    });
    h += '<div class="row"><button class="alt sm" data-a="sadd">Add a layer</button></div>';
    h += '<div class="card"><h3>Hear it</h3><div class="row"><button class="sm" data-a="srec">' + (d.rendered && d.rendered.length ? 'Record again' : 'Record the takes') + '</button>' + (d.rendered || []).map(function(_, i){ return '<button class="alt sm" data-a="splay" data-i="' + i + '">Play take ' + (i + 1) + '</button>'; }).join('') + '</div>' +
      '<p class="muted">Recording makes the takes the game will play (one picked at random each time). Record again after changing the recipe.</p></div>';
    return h;
  }
  function wavB64(buf){
    var ch = buf.getChannelData(0), sr = buf.sampleRate, n = ch.length, b = new ArrayBuffer(44 + n*2), v = new DataView(b), w = function(o, t){ for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n*2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr*2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n*2, true);
    for (var i = 0; i < n; i++){ var x = Math.max(-1, Math.min(1, ch[i])); v.setInt16(44 + i*2, x < 0 ? x*0x8000 : x*0x7fff, true); }
    var u = new Uint8Array(b), str = ''; for (var k = 0; k < u.length; k += 0x8000) str += String.fromCharCode.apply(null, u.subarray(k, k + 0x8000)); return btoa(str);
  }
  function renderTake(d, take){
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, sr = 22050, len = Math.ceil(sr*d.length);
    var ctx = new OAC(1, len, sr), rnd = function(k){ var x = Math.sin((take + 1)*91.7 + k*13.1)*43758.5; return (x - Math.floor(x))*2 - 1; };
    var nb = ctx.createBuffer(1, sr*2, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++){ var x = Math.sin(i*12.9898 + take*78.233)*43758.5453; nd[i] = (x - Math.floor(x))*2 - 1; }
    d.layers.forEach(function(L, li){
      var pv = 1 + d.vary*rnd(li), t0 = Math.max(0, L.delay + d.vary*0.05*rnd(li + 9)), src;
      if (L.kind === 'noise'){ src = ctx.createBufferSource(); src.buffer = nb; src.loop = true; }
      else { src = ctx.createOscillator(); src.type = L.wave || 'sine'; src.frequency.setValueAtTime(L.freq*pv, t0); src.frequency.exponentialRampToValueAtTime(Math.max(20, L.freq2*pv), t0 + L.attack + L.hold + L.release); }
      var node = src;
      if (L.filter && L.filter !== 'none'){ var f = ctx.createBiquadFilter(); f.type = L.filter; f.Q.value = L.q || 1; f.frequency.setValueAtTime(L.freq*pv, t0); f.frequency.exponentialRampToValueAtTime(Math.max(20, L.freq2*pv), t0 + L.attack + L.hold + L.release); node.connect(f); node = f; }
      var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(L.gain, t0 + Math.max(0.001, L.attack)); g.gain.setValueAtTime(L.gain, t0 + L.attack + L.hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + L.attack + L.hold + Math.max(0.01, L.release));
      node.connect(g); g.connect(ctx.destination); src.start(t0); src.stop(Math.min(d.length, t0 + L.attack + L.hold + L.release + 0.05));
    });
    return ctx.startRendering();
  }
  function recordSound(){
    var d = S.doc, takes = [], n = d.variations, i = 0;
    if (!(window.OfflineAudioContext || window.webkitOfflineAudioContext)) return toast('This browser cannot record sounds.');
    (function next(){ if (i >= n){ commit(); S.doc.rendered = takes; changed(true); toast('Recorded ' + n + ' takes.'); return; }
      renderTake(d, i).then(function(buf){ takes.push(wavB64(buf)); if (i === 0) S.waveData = buf.getChannelData(0).slice(); i++; next(); }).catch(function(e){ toast('Could not record: ' + e.message); }); })();
  }
  var actx = null;
  function playTake(i){
    var b64 = S.doc.rendered && S.doc.rendered[i]; if (!b64) return;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; actx = actx || new AC(); if (actx.state === 'suspended') actx.resume();
    var bin = atob(b64), a = new Uint8Array(bin.length); for (var k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
    actx.decodeAudioData(a.buffer, function(buf){ S.waveData = buf.getChannelData(0).slice(); drawWave(); var src = actx.createBufferSource(); src.buffer = buf; src.connect(actx.destination); src.start(); }, function(){ toast('Could not play it.'); });
  }
  function drawWave(){
    var cv = $('wave'); if (!cv || !isSound()) return; var r = cv.getBoundingClientRect(); cv.width = Math.max(10, r.width); cv.height = Math.max(10, r.height);
    var g = cv.getContext('2d'), W = cv.width, H = cv.height, d = S.waveData; g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(251,243,228,.85)'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d9c7a8'; g.strokeRect(0.5, 0.5, W - 1, H - 1);
    g.fillStyle = '#6b5e50'; g.font = '13px system-ui'; g.fillText(d ? 'take 1' : 'Record the takes to see the sound', 12, 20);
    if (!d) return; g.strokeStyle = '#c67139'; g.beginPath();
    for (var x = 0; x < W; x++){ var a = Math.floor(x/W*d.length), b = Math.floor((x + 1)/W*d.length), mn = 1, mx = -1; for (var i = a; i < b; i++){ if (d[i] < mn) mn = d[i]; if (d[i] > mx) mx = d[i]; } g.moveTo(x + 0.5, H/2 - mx*H*0.45); g.lineTo(x + 0.5, H/2 - mn*H*0.45); }
    g.stroke();
  }
  function soundAsset(d){ return {type:'sound', id:d.id, name:d.name, author:d.author, notes:d.notes, sound:{key:d.key, length:d.length, variants:(d.rendered || []).slice()}, recipe:{layers:clone(d.layers), length:d.length, variations:d.variations, vary:d.vary}, stats:{total:0}, source:clone(d)}; }

  /* ---------------------------------------------------------------- effects (W14): particles previewed live */
  var fxT = 0, fxStart = 0;
  function fxRun(){
    cancelAnimationFrame(fxT);
    if (!isModel() || S.doc.kind !== 'effect' || !S.doc.effect || !S.preview.fx){ if (view) view.set('fx', null); return; }
    fxStart = performance.now();
    (function tick(now){ if (!isModel() || S.doc.kind !== 'effect' || !S.preview.fx){ view.set('fx', null); return; }
      var E = S.doc.effect, t = ((now - fxStart)/1000) % (E.life*1.4), ps = M.effectState(E, t, 1), pcs = [], c0 = SH.hex(E.colour[0]), c1 = SH.hex(E.colour[1] || E.colour[0]);
      ps.forEach(function(p){ var c = c0.map(function(v, i){ return v + (c1[i] - v)*p.k; }), hx = '#' + c.map(function(v){ return ('0' + Math.round(v*255).toString(16)).slice(-2); }).join('');
        pcs.push({s:E.shape === 'spark' ? 'box' : 'bev', p:[p.pos[0], p.pos[1] + 0.3, p.pos[2]], d:E.shape === 'spark' ? [p.size*0.25, p.size*0.25, p.size*1.6] : [p.size, p.size, p.size], c:M.customName(hx), glow:!!E.glow}); });
      view.set('fx', pcs.length ? {tris:trisOf(pcs)} : null, {order:2});
      fxT = requestAnimationFrame(tick); })(fxStart);
  }

  /* ---------------------------------------------------------------- the Make card: shapes built from settings */
  function makeCard(){
    var sel = selected(), h = '<div class="card"><h3>Make</h3><div class="row"><select id="mkKind">' +
      [['stairs','Stairs'],['lathe','Spun shape (vase, post, shade)'],['extrude','Raised outline (sign, bracket, counter)'],['pipe','Pipe or cable']].concat(isModel() && S.doc.kind === 'plant' ? [['tree','Tree']] : []).concat(sel.length ? [['array','Copies in a row'],['radial','Copies round the middle']] : []).map(function(o){ return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select><button class="sm" data-a="mkGo">Make</button></div>' +
      '<div class="row"><input class="grow" id="mkArgs" type="text" placeholder="settings (see below)"></div>' +
      '<p class="muted">Stairs: steps, width, rise, run (e.g. <b>5, 36, 7, 11</b> in ' + unitLabel() + '). Spun shape: radius,height pairs from the bottom (<b>4,0; 5,2; 2,20; 6,24</b>). Raised outline: x,z corners then the height (<b>0,0; 24,0; 24,6; 6,6; 6,24; 0,24 | 36</b>). Pipe: x,y,z points then the thickness (<b>0,0,0; 0,40,0; 30,40,0 | 1.5</b>). Copies: how many, then the step x,y,z (<b>6 | 0,0,8</b>) or how many round (<b>8</b>).</p></div>';
    return h;
  }
  function parsePts(t){ return t.split(';').map(function(q){ return q.split(',').map(function(x){ return parseFloat(x); }); }).filter(function(a){ return a.length && a.every(isFinite); }); }
  function makeGo(){
    var kind = $('mkKind').value, raw = ($('mkArgs').value || '').trim(), U = function(v){ return fromUnit(v); }, made = [], L = ownerList();
    var at = (function(){ var sel = selected(); if (sel.length){ var B = M.boundsOf([].concat.apply([], sel.map(nativesOf))); if (B.ok) return [(B.mn[0]+B.mx[0])/2, B.mx[1], (B.mn[2]+B.mx[2])/2]; } return [0, 0, 0]; })();
    var g = S.layer === 'wheel' ? 'wheel' : (isModel() ? (S.part || partNames()[0]) : 'body'), o = {g:g, c:S.brush, m:M.guessMaterial(S.brush)};
    try {
      if (kind === 'stairs'){ var a = (raw || '5, 36, 7, 11').split(',').map(parseFloat); made = M.stairs(a[0] | 0, U(a[1]), U(a[2]), U(a[3]), at, o); }
      else if (kind === 'lathe'){ var pr = parsePts(raw || '4,0; 5,2; 2,20; 6,24').map(function(q){ return [U(q[0]), U(q[1])]; }); made = M.lathe(pr, 10, at, o); }
      else if (kind === 'extrude'){ var parts = (raw || '0,0; 24,0; 24,6; 6,6; 6,24; 0,24 | 36').split('|'); made = M.extrude(parsePts(parts[0]).map(function(q){ return [U(q[0]), U(q[1])]; }), U(parseFloat(parts[1] || '12')), at, o); }
      else if (kind === 'pipe'){ var pp = (raw || '0,0,0; 0,40,0; 30,40,0 | 1.5').split('|'); made = M.pipe(parsePts(pp[0]).map(function(q){ return [at[0] + U(q[0]), at[1] + U(q[1]), at[2] + U(q[2])]; }), U(parseFloat(pp[1] || '1'))/2, 6, o); }
      else if (kind === 'array'){ var ap = (raw || '4 | 0,0,8').split('|'), st = (ap[1] || '0,0,8').split(',').map(function(x){ return U(parseFloat(x)); }); made = M.arrayOf(selected(), parseInt(ap[0], 10) || 4, st); }
      else if (kind === 'radial'){ made = M.radialOf(selected(), parseInt(raw, 10) || 6, [0, 0, 0]); }
      else if (kind === 'tree'){ var tv = (raw || '').split(',').map(parseFloat); commit(); S.doc.pieces = S.doc.pieces.filter(function(p){ return p.g !== 'body' && p.g !== 'leaves'; });
        M.growTree({height:tv[0] > 0 ? U(tv[0]*12) : 6, branches:tv[1] > 0 ? tv[1] | 0 : 6, seed:tv[2] > 0 ? tv[2] : 3}).forEach(function(q){ q.id = M.newId(S.doc); S.doc.pieces.push(q); }); changed(true); toast('Grew a tree. Settings: height in feet, branches, seed (e.g. 20, 7, 4).'); return; }
    } catch (e){ return toast('Could not make it: ' + e.message); }
    if (!made.length) return toast('Nothing made: check the settings.');
    commit(); made.forEach(function(q){ q.id = M.newId({pieces:L}); if (kind !== 'array' && kind !== 'radial') q.g = g; L.push(q); }); S.sel = made.map(function(q){ return q.id; }); changed(true);
  }

  /* ---------------------------------------------------------------- handles in the view
     Tinkercad and Shapr3D style: visible handles you grab. A push/pull handle on each face stretches that side while the opposite
     side stays put ("Both sides" stretches from the middle); arrows move along X, Y or Z; Turn shows a ring per axis that snaps
     every 15 degrees (1 degree with the grid off). Handles keep the same size on screen, sit on top of the model, and are
     big enough for a finger (about 44 points). Numbers snap to the grid; a label shows the size, move or angle while dragging. */
  S.gz = {mode:'shape', both:false};
  var GZC = {x:'#d4553e', y:'#4f9a3c', z:'#3a76c0', hot:'#f0922a'};
  var AXV = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], AXN = ['x', 'y', 'z'];
  function gzTarget(){ if (!S.doc || isSound() || S.layer === 'look' || S.placing || !view) return null; var sel = selected(); return sel.length ? sel : null; }
  function localBounds(p){ var q = clone(p); q.pos = [0, 0, 0]; q.rot = [0, 0, 0]; q.mx = false; q.mz = false; delete q.hidden; var B = M.boundsOf(M.toNativeAlways(q)); return B.ok ? B : null; }
  function wpp(at){ var e = view.eye(), d = Math.hypot(at[0]-e[0], at[1]-e[1], at[2]-e[2]); return 2*d*Math.tan(view.cam.fov*Math.PI/360)/Math.max(1, view.size()[1]); }
  function gzOff(){ return (isModel() && handGrip()) || [0, 0, 0]; }
  function add3(a, b){ return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
  function sub3(a, b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function mul3(a, k){ return [a[0]*k, a[1]*k, a[2]*k]; }
  function selBounds(sel){ var all = []; sel.forEach(function(p){ all = all.concat(M.toNativeAlways(Object.assign(clone(p), {mx:false, mz:false}))); }); return M.boundsOf(all); }
  function gzHandles(){
    var sel = gzTarget(); if (!sel) return [];
    var off = gzOff(), H = [], WB = selBounds(sel); if (!WB.ok) return [];
    var C = add3([(WB.mn[0]+WB.mx[0])/2, (WB.mn[1]+WB.mx[1])/2, (WB.mn[2]+WB.mx[2])/2], off), px = wpp(C);
    if (S.gz.mode === 'shape'){
      if (sel.length === 1){ var p = sel[0], B = localBounds(p);
        if (B){ var R = M.rotMat(p.rot || [0, 0, 0]), c = [0, 1, 2].map(function(i){ return (B.mn[i]+B.mx[i])/2; }), h = [0, 1, 2].map(function(i){ return (B.mx[i]-B.mn[i])/2; });
          [0, 1, 2].forEach(function(i){ if (h[i] < 0.0015) return; [-1, 1].forEach(function(sg){ var L = c.slice(); L[i] += sg*h[i]; var e = [0, 0, 0]; e[i] = sg;
            H.push({type:'face', i:i, sg:sg, pos:add3(add3(M.app3(R, L), p.pos), off), dir:M.app3(R, e), col:GZC[AXN[i]]}); }); }); } }
      [0, 1, 2].forEach(function(a){ var ext = (WB.mx[a]-WB.mn[a])/2, k = Math.max(ext + 64*px, 90*px); H.push({type:'move', a:a, base:C, pos:add3(C, mul3(AXV[a], k)), col:GZC[AXN[a]]}); });
    } else {
      var rad = Math.max(Math.hypot(WB.mx[0]-WB.mn[0], WB.mx[1]-WB.mn[1], WB.mx[2]-WB.mn[2])/2 + 18*px, 80*px);
      [0, 1, 2].forEach(function(a){ var u = AXV[(a+1)%3], v = AXV[(a+2)%3], ring = [];
        for (var k = 0; k <= 64; k++){ var t = k/64*Math.PI*2; ring.push(add3(C, add3(mul3(u, Math.cos(t)*rad*(1 - a*0.06)), mul3(v, Math.sin(t)*rad*(1 - a*0.06))))); }
        H.push({type:'turn', a:a, centre:C, ring:ring, pos:ring[8], col:GZC[AXN[a]]}); });
    }
    /* an axle only slides forward and back and only gets longer or shorter: drop the handles that would fight that */
    if (sel.length === 1 && sel[0].fn === 'axle' && !isModel()) H = H.filter(function(h){ return h.type === 'move' ? h.a === 2 : h.type === 'face' ? h.i === 0 : false; });
    return H;
  }
  function gzDraw(){
    if (!view) return;
    var H = gzHandles(), pcs = [], pos = [], col = [], hot = S.gzDrag && S.gzDrag.h;
    var line = function(a, b, hex){ var c = SH.hex(hex); pos.push(a[0], a[1], a[2], b[0], b[1], b[2]); col.push(c[0], c[1], c[2], 1, c[0], c[1], c[2], 1); };
    H.forEach(function(h){
      var isHot = hot && hot.type === h.type && hot.i === h.i && hot.sg === h.sg && hot.a === h.a, hex = isHot ? GZC.hot : h.col, px = wpp(h.pos), cn = M.customName(hex);
      if (h.type === 'face'){ var sz = (isHot ? 20 : 16)*px; pcs.push({s:'bev', p:h.pos, d:[sz, sz, sz], c:cn, glow:true}); pcs.push({s:'bev', p:h.pos, d:[sz*0.55, sz*0.55, sz*0.55], c:'x' + 'fbf6ec', glow:true});
        line(h.pos, add3(h.pos, mul3(h.dir, 14*px)), hex); }
      else if (h.type === 'move'){ line(h.base, h.pos, hex); var r = (isHot ? 10 : 8)*px, a = h.a, ax = AXN[a], rr = [[0, 0, 0, r, r], [0, 0, 0, 0, 0]]; var d2 = 22*px;
        rr[1][a === 0 ? 0 : a === 1 ? 1 : 2] = d2; pcs.push({s:'loft', p:h.pos, ax:ax, n:8, r:rr, c:cn, glow:true}); pcs.push({s:'bev', p:h.pos, d:[r*1.6, r*1.6, r*1.6], c:cn, glow:true}); }
      else if (h.type === 'turn'){ for (var k = 0; k < h.ring.length - 1; k++) line(h.ring[k], h.ring[k+1], hex);
        [8, 24, 40, 56].forEach(function(k){ var q = h.ring[k], s2 = (isHot ? 15 : 12)*wpp(q); pcs.push({s:'bev', p:q, d:[s2, s2, s2], c:cn, glow:true}); }); }
    });
    view.set('gz', pcs.length ? {tris:trisOf(pcs)} : null, {order:20, depth:false, lit:false});
    view.set('gzl', pos.length ? {lines:{pos:pos, col:col}} : null, {order:19, depth:false, lit:false, alpha:0.95});
    gzBar();
  }
  function gzBar(){
    var el = $('gzBar'); if (!el) return; var on = !!gzTarget();
    el.classList.toggle('hidden', !on); if (!on) return;
    var h = '<button class="sm ' + (S.gz.mode === 'shape' ? 'on' : 'alt') + '" data-gz="shape">Shape</button><button class="sm ' + (S.gz.mode === 'turn' ? 'on' : 'alt') + '" data-gz="turn">Turn</button>';
    if (S.gz.mode === 'shape' && selected().length === 1) h += '<button class="sm ' + (S.gz.both ? 'on' : 'alt') + '" data-gz="both" title="Stretch from the middle, both sides at once">Both sides</button>';
    if (el.innerHTML !== h) el.innerHTML = h;
  }
  $('gzBar').addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; var g = b.dataset.gz; if (g === 'both') S.gz.both = !S.gz.both; else S.gz.mode = g; gzDraw(); });
  /* the handle under a finger or the mouse, in screen space */
  function gzHit(x, y){
    var H = gzHandles(), best = null, bd = 30;
    H.forEach(function(h){
      if (h.type === 'turn') return;
      var q = view.project(h.pos); if (q[2] > 1 || q[2] < -1) return; var d = Math.hypot(q[0]-x, q[1]-y); if (d < bd || (best && best.type === 'move' && h.type === 'face' && d < bd + 6)){ bd = d; best = h; } });
    if (best) return best;
    var bt = null, btd = 18;
    H.forEach(function(h){ if (h.type !== 'turn') return; for (var k = 0; k < h.ring.length - 1; k++){ var a = view.project(h.ring[k]), b = view.project(h.ring[k+1]);
      var dx = b[0]-a[0], dy = b[1]-a[1], l2 = dx*dx + dy*dy || 1, t = Math.max(0, Math.min(1, ((x-a[0])*dx + (y-a[1])*dy)/l2)), d = Math.hypot(a[0] + dx*t - x, a[1] + dy*t - y);
      if (d < btd){ btd = d; bt = h; } } });
    return bt;
  }
  /* where the pointer's ray comes closest to a line through A along u */
  function lineParam(A, u, x, y){ var R = view.ray(x, y), w = sub3(R.o, A), b = WSV.dot(u, R.d), dn = 1 - b*b; if (Math.abs(dn) < 1e-6) return null; return (WSV.dot(w, u) - b*WSV.dot(w, R.d))/dn; }
  function eulerOf(m){
    var y = Math.asin(Math.max(-1, Math.min(1, -m[6]))), x, z;
    if (Math.abs(Math.cos(y)) > 1e-6){ x = Math.atan2(m[7], m[8]); z = Math.atan2(m[3], m[0]); } else { x = Math.atan2(-m[5], m[4]); z = 0; }
    return [x, y, z].map(function(v){ var d = v*180/Math.PI; d = Math.round(d*100)/100; if (Math.abs(d - Math.round(d)) < 0.02) d = Math.round(d); if (d === -180) d = 180; return d === 0 ? 0 : d; });
  }
  function mulM(a, b){ var o = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) o[i*3+j] = a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j]; return o; }
  /* change a piece's size along its own axis i by a factor, in the way its panel shows it */
  function setSize(p, i, k){
    if (p.d && p.s !== 'loft'){ p.d = p.d.slice(); p.d[i] = r4(Math.max(0.002, p.d[i]*k)); return; }
    if (rectPlate(p) && i < 2){ p.v = p.v.map(function(v){ var q = v.slice(); q[i] = r4(q[i]*k); return q; }); return; }
    if (simpleTube(p)){ var ax = p.ax || 'y', ia = ax === 'x' ? 0 : ax === 'y' ? 1 : 2;
      if (i === ia){ p.r = p.r.map(function(r){ var o = r.slice(); o[ia] = r4(o[ia]*k); return o; }); return; }
      var ri = i === (ax === 'x' ? 2 : 0) ? 3 : i === (ax === 'y' ? 2 : 1) ? 4 : -1;
      if (ri > 0){ p.r = p.r.map(function(r){ var o = r.slice(); o[ri] = r4(o[ri]*k); return o; }); return; } }
    p.scl = (p.scl || [1, 1, 1]).slice(); p.scl[i] = r4(p.scl[i]*k);
  }
  var AXWORD = ['Width', 'Height', 'Length'];
  function gzLabel(t, x, y){ var el = $('gzLabel'); if (!t){ el.classList.add('hidden'); return; } el.textContent = t; el.classList.remove('hidden');
    var W = view.size()[0]; el.style.left = Math.min(W - 160, x + 22) + 'px'; el.style.top = Math.max(4, y - 48) + 'px'; }
  function gzStart(h, x, y){
    var sel = selected(); S.gzDrag = {h:h, sel:sel.map(function(p){ return {p:p, p0:clone(p)}; })}; S.liveCommitted = false; commit();
    var D = S.gzDrag;
    if (h.type === 'face'){ var p = sel[0], B = localBounds(p); D.size0 = B.mx[h.i] - B.mn[h.i]; D.c = (B.mn[h.i] + B.mx[h.i])/2; D.half = D.size0/2; D.t0 = lineParam(h.pos, h.dir, x, y); D.R = M.rotMat(p.rot || [0, 0, 0]); }
    else if (h.type === 'move'){ D.t0 = lineParam(h.base, AXV[h.a], x, y); }
    else { var n = AXV[h.a], hit = WSV.hitPlane(view.ray(x, y).o, view.ray(x, y).d, h.centre, n); D.v0 = hit ? sub3(hit, h.centre) : null; D.C = sub3(h.centre, gzOff()); }
    gzDraw();
  }
  function gzMove(x, y){
    var D = S.gzDrag, h = D.h, st = S.snap;
    if (h.type === 'face'){
      var t = lineParam(h.pos, h.dir, x, y); if (t == null || D.t0 == null) return;
      var size = D.size0 + (t - D.t0)*(S.gz.both ? 2 : 1); if (st) size = Math.round(size/st)*st; size = Math.max(st || 0.003, size);
      var k = size/D.size0, it = D.sel[0], p = it.p; Object.assign(p, clone(it.p0)); setSize(p, h.i, k);
      var fixed = S.gz.both ? D.c : D.c - h.sg*D.half, shift = -fixed*(k - 1), e = [0, 0, 0]; e[h.i] = 1; var w = M.app3(D.R, e);
      p.pos = [0, 1, 2].map(function(j){ return r4(it.p0.pos[j] + w[j]*shift); });
      gzLabel(AXWORD[h.i] + ' ' + fmtLen(size), x, y);
    } else if (h.type === 'move'){
      var t2 = lineParam(h.base, AXV[h.a], x, y); if (t2 == null || D.t0 == null) return; var dv = t2 - D.t0; if (st) dv = Math.round(dv/st)*st;
      D.sel.forEach(function(it){ it.p.pos = it.p0.pos.slice(); it.p.pos[h.a] = r4(it.p0.pos[h.a] + dv); });
      gzLabel('Move ' + AXN[h.a].toUpperCase() + ' ' + (dv >= 0 ? '+' : '−') + fmtLen(Math.abs(dv)), x, y);
    } else {
      if (!D.v0) return; var n = AXV[h.a], hit = WSV.hitPlane(view.ray(x, y).o, view.ray(x, y).d, h.centre, n); if (!hit) return;
      var v = sub3(hit, h.centre), ang = Math.atan2(WSV.dot(WSV.cross(D.v0, v), n), WSV.dot(D.v0, v))*180/Math.PI, step = st ? 15 : 1; ang = Math.round(ang/step)*step;
      var e2 = [0, 0, 0]; e2[h.a] = ang; var RA = M.rotMat(e2);
      D.sel.forEach(function(it){ var R0 = M.rotMat(it.p0.rot || [0, 0, 0]); it.p.rot = eulerOf(mulM(RA, R0)); var d0 = sub3(it.p0.pos, D.C); it.p.pos = add3(D.C, M.app3(RA, d0)).map(r4); });
      gzLabel('Turn ' + AXN[h.a].toUpperCase() + ' ' + ang + '°', x, y);
    }
    S.asset = null; rebuildScene();
  }
  function gzEnd(moved){
    var D = S.gzDrag; S.gzDrag = null; S.liveCommitted = false; gzLabel(null);
    if (!moved){ S.undo.pop(); S.gzTapped = true; gzDraw(); return; }
    changed(true);
  }
  var gzRaf = 0; hooks.changed = function(){ if (gzRaf) return; gzRaf = requestAnimationFrame(function(){ gzRaf = 0; gzDraw(); }); };

  /* ---------------------------------------------------------------- moving parts (W2) */
  var AXES = [['X', [1, 0, 0]], ['−X', [-1, 0, 0]], ['Y', [0, 1, 0]], ['−Y', [0, -1, 0]], ['Z', [0, 0, 1]], ['−Z', [0, 0, -1]]];
  function axisIndex(v){ v = v || [0, 1, 0]; var best = 2, bd = -2; AXES.forEach(function(a, i){ var d = a[1][0]*v[0] + a[1][1]*v[1] + a[1][2]*v[2]; if (d > bd){ bd = d; best = i; } }); return best; }
  function panelMoves(){
    var d = S.doc, R = d.rig || {}, names = partNames(), h = '<span class="stamp">Moves</span>';
    h += '<p>Parts that turn or slide: doors, lids, drawers, handlebars, cranks, an excavator\'s boom. Each turns about its pivot and carries the parts hung from it.</p>';
    names.forEach(function(n){
      var j = R[n];
      h += '<div class="card"><h3>' + esc(n.replace(/_/g, ' ')) + '</h3>';
      if (!j){ h += '<div class="row"><span class="muted grow">Does not move.</span><button class="alt sm" data-a="joint" data-n="' + esc(n) + '" data-k="turn">Make it turn</button><button class="alt sm" data-a="joint" data-n="' + esc(n) + '" data-k="slide">Make it slide</button></div></div>'; return; }
      if (!j.turn && !j.slide){ h += '<div class="row"><span class="muted grow">The part everything else hangs from' + (j.note ? ': ' + esc(j.note) : '') + '.</span><button class="alt sm" data-a="joint" data-n="' + esc(n) + '" data-k="turn">Make it turn</button></div></div>'; return; }
      var slide = !!j.slide, unit = slide ? 'len' : 'deg', v = S.pose[n] != null ? S.pose[n] : (j.rest || 0), rg = j.range || (slide ? [0, 0.4] : [-90, 90]);
      h += '<div class="row"><label class="l">Hangs from</label><select class="grow" data-k="jparent" data-n="' + esc(n) + '"><option value="">(nothing: the model itself)</option>' + names.filter(function(x){ return x !== n; }).map(function(x){ return '<option' + (j.parent === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>';
      h += '<div class="row"><label class="l">' + (slide ? 'Slides along' : 'Turns about') + '</label><select data-k="jaxis" data-n="' + esc(n) + '">' + AXES.map(function(a, i){ return '<option value="' + i + '"' + (axisIndex(slide ? j.slide : j.turn) === i ? ' selected' : '') + '>' + a[0] + '</option>'; }).join('') + '</select>' +
        '<button class="alt sm" data-a="jkind" data-n="' + esc(n) + '">' + (slide ? 'Turn instead' : 'Slide instead') + '</button></div>';
      if (!slide) h += '<div class="card" style="margin:6px 0"><h3>Pivot (' + unitLabel() + ')</h3><div class="trio">' + [0, 1, 2].map(function(i){ return num('pivot ' + 'xyz'[i], (j.pivot || [0,0,0])[i], 'len', function(val){ commit(); S.doc.rig[n].pivot[i] = val; changed(true); }, {ax:'xyz'[i]}); }).join('') + '</div>' +
        '<div class="row"><button class="alt sm" data-a="pivotSel" data-n="' + esc(n) + '">Pivot at selected piece</button>' + (S.selPoint >= 0 ? '<button class="alt sm" data-a="pivotPt" data-n="' + esc(n) + '">Pivot at selected point</button>' : '') + '</div></div>';
      h += '<div class="row"><label class="l">Range</label>' + num('from', rg[0], unit, function(val){ commit(); S.doc.rig[n].range = [val, (S.doc.rig[n].range || rg)[1]]; changed(true); }) + num('to', rg[1], unit, function(val){ commit(); S.doc.rig[n].range = [(S.doc.rig[n].range || rg)[0], val]; changed(true); }) + '</div>';
      h += '<div class="row"><label class="l">Try it</label><input class="grow" type="range" data-k="jpose" data-n="' + esc(n) + '" min="' + rg[0] + '" max="' + rg[1] + '" step="' + (slide ? 0.01 : 1) + '" value="' + v + '"><span class="muted" style="width:56px;text-align:right">' + (slide ? fmtLen(v) : Math.round(v) + '°') + '</span></div>';
      h += '<div class="row"><button class="alt sm" data-a="jrest" data-n="' + esc(n) + '">Use as rest</button><button class="alt sm" data-a="jdel" data-n="' + esc(n) + '">Stop it moving</button></div>';
      if (j.note) h += '<p class="muted">' + esc(j.note) + '</p>';
      h += '</div>';
    });
    var C = d.clips || {};
    h += '<div class="card"><h3>Clips</h3><p class="muted">Short movements the game plays (pedalling, steering, a door opening). Pose the parts with the sliders, then add a key.</p>';
    h += Object.keys(C).length ? '<div class="list">' + Object.keys(C).map(function(c){ var on = S.clip === c; return '<div class="it"><span class="nm">' + esc(c) + ' <span class="muted">' + C[c].length + ' keys, ' + (C[c].length ? C[c][C[c].length - 1].t : 0) + ' s</span></span><button class="' + (on ? 'on' : 'alt') + ' sm" data-a="clipPlay" data-c="' + esc(c) + '">' + (on ? 'Stop' : 'Play') + '</button><button class="alt sm" data-a="clipKey" data-c="' + esc(c) + '">Add key</button><button class="alt sm" data-a="clipDel" data-c="' + esc(c) + '">Delete</button></div>'; }).join('') + '</div>' : '<p class="muted">No clips.</p>';
    h += '<div class="row"><input class="grow" id="clipName" type="text" placeholder="New clip (e.g. open, pedal)"><button class="sm" data-a="clipNew">Add clip</button></div>';
    h += '<div class="row"><button class="alt sm" data-a="poseReset">Back to rest</button></div></div>';
    return h;
  }
  var clipTimer = 0;
  function playClip(c){
    cancelAnimationFrame(clipTimer);
    if (!c){ S.clip = null; return; }
    S.clip = c; var t0 = performance.now();
    (function tick(now){ if (S.clip !== c) return; S.pose = M.clipPose(S.doc, c, (now - t0)/1000); rebuildScene(); clipTimer = requestAnimationFrame(tick); })(t0);
  }

  function extraFields(e, i){
    var v = e.value, h = '<div class="muted" style="margin-top:8px"><b>' + esc(e.path[0]) + '</b></div>';
    var simple = function(x){ return x == null || typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean' || (Array.isArray(x) && x.every(function(y){ return typeof y === 'number' || typeof y === 'string'; })); };
    if (simple(v)) return h + '<div class="row"><input class="grow" type="text" data-k="extra" data-i="' + i + '" value="' + esc(Array.isArray(v) ? v.join(', ') : String(v)) + '"></div>';
    if (v && typeof v === 'object' && !Array.isArray(v)){
      return h + Object.keys(v).map(function(k){ var x = v[k]; if (!simple(x)) return '<div class="row"><label class="l">' + esc(k) + '</label><span class="muted">kept as it is</span></div>';
        return '<div class="row"><label class="l">' + esc(k) + '</label><input class="grow" type="text" data-k="extra" data-i="' + i + '" data-f="' + esc(k) + '" value="' + esc(Array.isArray(x) ? x.join(', ') : String(x)) + '"></div>'; }).join('');
    }
    return h + '<p class="muted">Kept as it is.</p>';
  }
  /* text back to the type it had: numbers stay numbers, lists stay lists */
  function asLike(old, text){
    if (Array.isArray(old)) return text.split(',').map(function(t, k){ t = t.trim(); return typeof old[k] === 'number' || (old[k] === undefined && typeof old[0] === 'number') ? +t : t; });
    if (typeof old === 'number'){ var n = parseFloat(text); return isFinite(n) ? n : old; }
    if (typeof old === 'boolean') return /^(true|yes|1)$/i.test(text.trim());
    return text;
  }

  /* change the creature's info and keep the plain-words behaviour line in step (unless someone wrote their own) */
  function cinfo(fn){ commit(); var i = M.creatureInfo(S.doc); if (!i) return; var auto = !i.behaviour || i.behaviour === M.behaviourText(i); fn(i); if (auto) i.behaviour = M.behaviourText(i); changed(false); }
  function panelCheckModel(){
    var A = asset(), C = M.checkModel(S.doc, A), tot = A.stats.total, h = '<span class="stamp">Check</span>';
    h += C.length ? C.map(function(c){ return '<div class="msg ' + c[0] + '">' + esc(c[1]) + '</div>'; }).join('') : '<div class="msg info">Ready for the game.</div>';
    h += '<div class="card"><h3>Detail budget</h3><div class="meter"><i style="width:' + Math.min(100, tot/40) + '%;background:' + (tot > 4000 ? 'var(--bad)' : tot > 2000 ? 'var(--ochre)' : 'var(--sage)') + '"></i></div>' +
      '<table>' + tr('Whole model', tot + ' triangles') + A.parts.map(function(n){ return tr('Part: ' + n, S.doc.pieces.filter(function(p){ return p.g === n; }).length + ' pieces'); }).join('') + tr('Points', (S.doc.points || []).length) + tr('Pack size', Math.round(JSON.stringify(A).length/1024) + ' KB') + '</table></div>';
    if (!isSkel()) h += '<div class="card"><h3>Joined up</h3><p class="muted">Every block should touch the rest; a floating piece usually means a gap.</p><div class="row"><button class="alt sm" data-a="selLoose">Select loose pieces</button></div></div>';
    h += '<div class="card"><h3>Units</h3><div class="row"><button class="' + (S.units === 'imp' ? 'on' : 'alt') + ' sm" data-a="units" data-u="imp">Inches and feet</button><button class="' + (S.units === 'met' ? 'on' : 'alt') + ' sm" data-a="units" data-u="met">Centimetres and metres</button></div></div>';
    return h;
  }

  /* ---------------------------------------------------------------- panel actions */
  var ACTIONS = {
    selAll:selectAll,
    mkGo:function(){ makeGo(); },
    hvAdd:function(){ var k = slug(($('hvAdd') || {}).value); if (!k) return; commit(); S.doc.harvest = S.doc.harvest || {}; S.doc.harvest[k] = 1; changed(true); },
    sadd:function(){ commit(); S.doc.layers.push({kind:'tone', wave:'triangle', freq:440, freq2:220, filter:'none', q:1, attack:0.005, hold:0.05, release:0.2, gain:0.4, delay:0}); changed(true); },
    sdel:function(b){ if (S.doc.layers.length < 2) return toast('A sound keeps at least one layer.'); commit(); S.doc.layers.splice(+b.dataset.i, 1); changed(true); },
    srec:function(){ recordSound(); },
    splay:function(b){ playTake(+b.dataset.i); },
    fprev:function(){ var F = S.doc.frames[S.aClip]; S.aFrame = (S.aFrame - 1 + F.length) % F.length; refresh(); },
    fnext:function(){ var F = S.doc.frames[S.aClip]; S.aFrame = (S.aFrame + 1) % F.length; refresh(); },
    fgo:function(b){ S.aFrame = +b.dataset.i; stopAnim(); refresh(); },
    aplay:function(){ if (S.aPlay) stopAnim(); else playAnim(); renderPanel(); },
    fadd:function(){ var F = S.doc.frames[S.aClip]; commit(); F.splice(S.aFrame + 1, 0, clone(F[S.aFrame] || {})); S.aFrame++; changed(true); },
    fdel:function(){ var F = S.doc.frames[S.aClip]; if (F.length < 2) return toast('A clip keeps at least one frame.'); commit(); F.splice(S.aFrame, 1); S.aFrame = Math.max(0, S.aFrame - 1); changed(true); },
    aclipNew:function(){ var n = slug(($('newClip') || {}).value); if (!n) return toast('Give the clip a name.'); commit(); S.doc.frames = S.doc.frames || {}; if (!S.doc.frames[n]) S.doc.frames[n] = [{}]; S.aClip = n; S.aFrame = 0; changed(true); },
    aclear:function(){ var fr = curFrame(); if (!fr) return; commit(); delete fr[S.aBone]; changed(true); },
    boneNew:function(){ var n = slug(($('newBone') || {}).value); if (!n) return toast('Give the bone a name.'); if (S.doc.skeleton[n]) return toast('There is a bone called that.'); var sel = selected(), at = [0, 1, 0];
      if (sel.length){ var Bx = M.boundsOf([].concat.apply([], sel.map(nativesOf))); if (Bx.ok) at = [0, 1, 2].map(function(i){ return r4((Bx.mn[i] + Bx.mx[i])/2); }); }
      commit(); M.addBone(S.doc, n, at, S.aBone || undefined); sel.forEach(function(p){ p.g = n; }); S.aBone = n; changed(true); },
    fitLayer:function(){ var bones = [].slice.call(document.querySelectorAll('.fitb:checked')).map(function(i){ return i.value; }); if (!bones.length) return toast('Tick at least one bone.');
      var R = fitSource(), col = ($('fitCol') || {}).value || 'SHIRT', made = []; commit();
      bones.forEach(function(b){ var eps = (R[b] || []).filter(function(np){ return /^SKIN/.test(np.c) || /^SHIRT|^PANTS/.test(np.c); }).map(function(np){ return M.fromNative(np, b, null); });
        M.inflate(eps, S.fitGap || 0.012, col).forEach(function(q){ q.id = M.newId(S.doc); q.g = b; S.doc.pieces.push(q); made.push(q.id); }); });
      S.sel = made; changed(true); toast('Made ' + made.length + ' pieces over ' + bones.join(', ') + '.'); },
    gripSel:function(){ var sel = selected(); if (!sel.length) return toast('Select the piece the hand holds.'); var B = M.boundsOf([].concat.apply([], sel.map(nativesOf))); if (!B.ok) return; commit(); M.gripAt(S.doc, [0, 1, 2].map(function(i){ return (B.mn[i] + B.mx[i])/2; })); changed(true); toast('The grip is now the middle of that piece.'); },
    gripPt:function(){ var pt = S.doc.points[S.selPoint]; if (!pt) return; commit(); M.gripAt(S.doc, pt.pos.slice()); changed(true); },
    mkWorn:function(){ commit(); M.makeWorn(S.doc); changed(true); toast('Worn made from new.'); },
    mkBroken:function(){ commit(); M.makeBroken(S.doc); changed(true); toast('Broken made from new.'); },
    recAdd:function(){ var k = ($('recAdd') || {}).value; if (!k) return; commit(); S.doc.item.recipe = S.doc.item.recipe || {}; S.doc.item.recipe[k] = 1; changed(true); },
    icon:function(){ renderIcon(function(url){ commit(); S.doc.icon = url; changed(true); }); },
    editState2:function(b){ S.variant = b.dataset.s || null; S.sel = []; refresh(true); },
    addState2:function(){ var st = ($('newState') || {}).value; if (!st) return; commit(); M.addState(S.doc, st); S.variant = st; S.sel = []; changed(true); toast('New state "' + st + '": a copy of the model to change.'); },
    delState2:function(b){ if (b.dataset.sure !== '1'){ b.dataset.sure = '1'; b.textContent = 'Tap again'; return; } commit(); delete S.doc.variants[b.dataset.s]; if (S.variant === b.dataset.s) S.variant = null; changed(true); },
    makeCarry:function(){ commit(); S.doc.extra = S.doc.extra || []; S.doc.extra.push({path:['furnitureSize', S.doc.target.name || S.doc.id], value:['medium', 20]}); changed(true); },
    measure:function(){ commit(); var r = M.measureInto(S.doc, S.doc.extra); changed(true); if (r) toast('Measured: ' + fmtLen(r.w) + ' wide, ' + fmtLen(r.len) + ' long, ' + fmtLen(r.h) + ' tall'); },
    joint:function(b){ commit(); M.addJoint(S.doc, b.dataset.n, b.dataset.k); changed(true); },
    jkind:function(b){ commit(); var j = S.doc.rig[b.dataset.n]; if (j.slide){ j.turn = j.slide; delete j.slide; j.range = [-90, 90]; } else { j.slide = j.turn || [0, 0, 1]; delete j.turn; j.range = [0, 0.4]; } j.rest = 0; delete S.pose[b.dataset.n]; changed(true); },
    jdel:function(b){ commit(); delete S.doc.rig[b.dataset.n]; delete S.pose[b.dataset.n]; changed(true); },
    jrest:function(b){ var n = b.dataset.n; if (S.pose[n] == null) return; commit(); S.doc.rig[n].rest = Math.round(S.pose[n]*1e4)/1e4; changed(true); },
    pivotSel:function(b){ var sel = selected(); if (!sel.length) return toast('Select a piece first: the pivot goes to its middle.'); var B = M.boundsOf([].concat.apply([], sel.map(nativesOf))); if (!B.ok) return; commit(); S.doc.rig[b.dataset.n].pivot = [0, 1, 2].map(function(i){ return r4((B.mn[i] + B.mx[i])/2); }); changed(true); },
    pivotPt:function(b){ var pt = S.doc.points[S.selPoint]; if (!pt) return; commit(); S.doc.rig[b.dataset.n].pivot = pt.pos.slice(); changed(true); },
    poseReset:function(){ playClip(null); S.pose = {}; refresh(true); },
    clipNew:function(){ var n = slug(($('clipName') || {}).value); if (!n) return toast('Give the clip a name.'); commit(); S.doc.clips = S.doc.clips || {}; if (!S.doc.clips[n]) S.doc.clips[n] = []; changed(true); },
    clipDel:function(b){ commit(); if (S.clip === b.dataset.c) playClip(null); delete S.doc.clips[b.dataset.c]; changed(true); },
    clipPlay:function(b){ playClip(S.clip === b.dataset.c ? null : b.dataset.c); renderPanel(); },
    clipKey:function(b){ var C = S.doc.clips[b.dataset.c], t = C.length ? Math.round((C[C.length - 1].t + 0.5)*100)/100 : 0, key = {t:t}; Object.keys(S.doc.rig || {}).forEach(function(n){ var v = S.pose[n] != null ? S.pose[n] : (S.doc.rig[n].rest || 0); key[n] = Math.round(v*1e4)/1e4; }); commit(); C.push(key); changed(true); toast('Key at ' + t + ' s'); },
    hidePart:function(b){ S.hideParts[b.dataset.n] = !S.hideParts[b.dataset.n]; refresh(true); },
    addPart:function(){ var n = slug(($('partName') || {}).value); if (!n) return toast('Give the part a name.'); if (S.doc.parts[n]) return toast('There is a part called that already.'); commit(); M.addPart(S.doc, n); S.part = n; changed(true); },
    delPart:function(b){ var n = b.dataset.n; if (S.doc.pieces.some(function(p){ return p.g === n; })) return toast('Move its pieces to another part first.'); commit(); M.removePart(S.doc, n); if (S.part === n) S.part = null; changed(true); },
    addPoint:function(){
      var kind = ($('ptNew') || {}).value || 'grip', at = [0, 0.5, 0], sel = selected();
      if (sel.length){ var B = M.boundsOf(M.toNativeAlways ? sel.reduce(function(a, p){ return a.concat(M.toNativeAlways(p)); }, []) : []); if (B.ok) at = [(B.mn[0] + B.mx[0])/2, (B.mn[1] + B.mx[1])/2, (B.mn[2] + B.mx[2])/2].map(r4); }
      commit(); var n = kind, k = 2; while ((S.doc.points || []).some(function(q){ return q.name === n; })) n = kind + '_' + k++;
      M.addPoint(S.doc, n, kind, at); S.selPoint = S.doc.points.length - 1; changed(true);
    },
    selPoint:function(b){ S.selPoint = +b.dataset.i; refresh(true); },
    delPoint:function(b){ commit(); S.doc.points.splice(+b.dataset.i, 1); S.selPoint = -1; changed(true); },
    stockBack:function(){ stockBrowser(); },
    selAxle:function(b){ S.sel = [b.dataset.id]; S.tab = 'piece'; refresh(true); },
    addAxle:function(){ commit(); var A = M.axlesOf(S.doc), z = A.length ? r4(A[A.length - 1].z - 1.2) : 0; M.makeAxle(S.doc, z, {driven:true, name:'axle ' + (A.length + 1)}); S.sel = [S.doc.pieces[S.doc.pieces.length - 1].id]; changed(true); },
    selLoose:function(){ S.sel = M.loosePieces(S.doc, ownerList()); if (!S.sel.length) toast('Every piece touches the rest.'); S.tab = 'piece'; refresh(true); },
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
    kind:function(t){ commit(); S.doc.kind = t.value; changed(true); },
    tpack:function(t){ commit(); S.doc.target.pack = t.value; changed(false); },
    tgroup:function(t){ commit(); S.doc.target.group = slug(t.value) || S.doc.target.group; changed(false); },
    tname:function(t){ var v = slug(t.value) || S.doc.target.name; commit(); if ((S.doc.extra || []).length) S.doc.extra.forEach(function(e){ e.path[e.path.length - 1] = v; }); S.doc.target.name = v; if (S.doc.from && v !== S.doc.from.split('.').pop()) delete S.doc.from; changed(true); },
    ptkind:function(t){ commit(); S.doc.points[+t.dataset.i].kind = t.value; changed(true); },
    ptdir:function(t){ commit(); S.doc.points[+t.dataset.i].dir = DIRS[+t.value][1].slice(); changed(true); },
    ptv:function(t){ var v = parseFloat(String(t.value).replace(',', '.')); if (!isFinite(v)) return; commit(); S.doc.points[+t.dataset.i].pos[+t.dataset.ax] = r4(fromUnit(v)); changed(false); },
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
    sway:function(t){ commit(); S.doc.sway = S.doc.sway || {}; S.doc.sway[t.dataset.n] = +t.value; changed(false); },
    fxshape:function(t){ commit(); S.doc.effect.shape = t.value; changed(false); fxRun(); },
    fxglow:function(t){ commit(); S.doc.effect.glow = t.checked; changed(false); fxRun(); },
    fxc0:function(t){ commit(); S.doc.effect.colour[0] = t.value; changed(false); fxRun(); },
    fxc1:function(t){ commit(); S.doc.effect.colour[1] = t.value; changed(false); fxRun(); },
    skey:function(t){ commit(); S.doc.key = slug(t.value) || S.doc.key; changed(true); },
    slk:function(t){ commit(); S.doc.layers[+t.dataset.i].kind = t.value; if (t.value === 'tone' && !S.doc.layers[+t.dataset.i].wave) S.doc.layers[+t.dataset.i].wave = 'sine'; changed(true); },
    slw:function(t){ commit(); S.doc.layers[+t.dataset.i].wave = t.value; changed(true); },
    slf:function(t){ commit(); S.doc.layers[+t.dataset.i].filter = t.value; changed(true); },
    aclip:function(t){ stopAnim(); S.aClip = t.value || null; S.aFrame = 0; refresh(true); },
    abone:function(t){ S.aBone = t.value || null; refresh(); },
    onion:function(t){ S.onion = t.checked; rebuildScene(); },
    bparent:function(t){ commit(); var j = S.doc.skeleton[S.aBone]; if (t.value) j.parent = t.value; else delete j.parent; changed(true); },
    arot:function(t){ var fr = curFrame(); if (!fr) return; if (!S.arotUndo) commit(); S.arotUndo = false; var r = (fr[S.aBone] || [0, 0, 0]).slice(); r[+t.dataset.i] = +t.value; fr[S.aBone] = r; changed(true); },
    dkind:function(t){ commit(); S.doc.design.kind = t.value; changed(true); },
    dshape:function(t){ commit(); S.doc.design.shape = +t.value; changed(false); },
    dpower:function(t){ commit(); S.doc.design.power = +t.value; changed(true); },
    dcolor:function(t){ commit(); S.doc.design.color = t.value; changed(false); },
    dtwo:function(t){ commit(); S.doc.design.twoHanded = t.checked; changed(false); },
    ikey:function(t){ commit(); S.doc.item.key = slug(t.value).slice(0, 24) || S.doc.item.key; changed(true); },
    iname:function(t){ commit(); S.doc.item.name = t.value.slice(0, 24); changed(false); },
    fsize:function(t){ commit(); M.extraOf(S.doc, 'furnitureSize').value[0] = t.value; changed(false); },
    extra:function(t){ commit(); var e = S.doc.extra[+t.dataset.i]; if (t.dataset.f) e.value[t.dataset.f] = asLike(e.value[t.dataset.f], t.value); else e.value = asLike(e.value, t.value); changed(false); },
    ptcol:function(t){ commit(); S.doc.points[+t.dataset.i].colour = t.value; changed(false); },
    jparent:function(t){ commit(); var j = S.doc.rig[t.dataset.n]; if (t.value) j.parent = t.value; else delete j.parent; changed(true); },
    jaxis:function(t){ commit(); var j = S.doc.rig[t.dataset.n], a = AXES[+t.value][1].slice(); if (j.slide) j.slide = a; else j.turn = a; changed(true); },
    jpose:function(t){ S.pose[t.dataset.n] = +t.value; rebuildScene(); },
    slotcol:function(t){ commit(); S.doc.slotColours = S.doc.slotColours || {}; S.doc.slotColours[t.dataset.slot] = t.value; meshCache = {}; changed(true); },
    dstr:function(t){ commit(); S.doc.dmg.strength = +t.value; changed(true); },
    asteer:function(t){ edit(function(p){ p.axle = Object.assign({}, p.axle, {steer:t.checked}); }, true); },
    adrive:function(t){ edit(function(p){ p.axle = Object.assign({}, p.axle, {driven:t.checked}); }, true); },
    dshaft:function(t){ commit(); S.doc.setup.drawShaft = t.checked; changed(true); },
    cdiet:function(t){ cinfo(function(i){ i.diet = t.value; }); },
    ceat:function(t){ cinfo(function(i){ var e = (i.eats || []).filter(function(k){ return k !== t.dataset.f; }); if (t.checked) e.push(t.dataset.f); i.eats = e; }); },
    ctemper:function(t){ cinfo(function(i){ i.temper = t.value; }); },
    cactive:function(t){ cinfo(function(i){ i.active = t.value; }); },
    cflag:function(t){ cinfo(function(i){ if (t.checked) i[t.dataset.f] = true; else delete i[t.dataset.f]; }); }
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
    h += '<div class="card"><h3>Start something new</h3><div class="row"><button class="alt sm" data-m="blank">Blank car</button>' + M.BLANK_KINDS.map(function(k){ return (k === 'creature' ? M.CREATURE_TEMPLATES.map(function(t){ return '<button class="alt sm" data-m="blankCreature" data-t="' + t + '">Creature: ' + esc(M.CREATURE_LABELS[t] || t) + '</button>'; }).join('') : '<button class="alt sm" data-m="blankKind" data-k="' + k + '">Blank ' + esc(k === 'sound' ? 'sound' : M.KINDS[k].label.toLowerCase()) + '</button>'); }).join('') + '</div><div class="row"><button class="sm" data-m="stockBrowser">Open any model in the game…</button></div><p class="muted">Or start from one of the design chat\'s cars (a copy; the game\'s own car is not changed):</p><div class="row">' +
      STOCK.map(function(n){ return '<button class="alt sm" data-m="stock" data-n="' + n + '">' + n.replace(/_/g, ' ') + '</button>'; }).join('') + '</div></div>';
    if (S.prefabs.length) h += '<div class="card"><h3>Prefabs</h3><div class="list">' + S.prefabs.map(function(pf){ return '<div class="it"><span class="nm">' + esc(pf.name) + ' <span class="muted">' + pf.pieces.length + ' pieces</span></span><button class="alt sm" data-m="pfdel" data-id="' + esc(pf.id) + '">Delete</button></div>'; }).join('') + '</div></div>';
    h += '<div class="row" style="justify-content:flex-end"><button class="alt sm" data-m="close">Close</button></div>';
    modal(h);
  }
  /* every model of every pack the game has, opened as an editable copy */
  function stockBrowser(){
    var h = '<h2>Models in the game</h2><p>Pick a pack, then a model. You get a copy to change; the game\'s own model is not touched until you export a pack that replaces it.</p><div class="row" style="flex-wrap:wrap">' +
      M.STOCK_PACKS.map(function(n){ return '<button class="alt sm" data-m="stockPack" data-n="' + n + '">' + n + '</button>'; }).join('') + '</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="alt sm" data-m="close">Close</button></div>';
    modal(h);
  }
  function stockPack(name){
    var box = $('modalBox'); box.innerHTML = '<h2>' + esc(name) + '</h2><p>Loading…</p>';
    if (name === 'survivor' || name === 'aliens' || name === 'animals') return M.loadStock([name], 'assets/shaped/', function(){
      var P = SH[name], h = '<h2>' + esc(name) + '</h2><div class="row"><input class="grow" id="stockFilter" type="text" placeholder="Filter by name"><button class="alt sm" data-m="stockBrowser">Back</button><button class="alt sm" data-m="close">Close</button></div><div class="list" id="stockList" style="max-height:52vh;overflow:auto">';
      if (!P){ box.innerHTML = '<p>Could not load ' + esc(name) + '.</p>'; return; }
      if (name === 'survivor'){ var last = '';
        M.survivorIndex(SH).forEach(function(g){ var head = g.slot + (g.body ? ' · ' + g.body : ''); if (head !== last){ h += '<div class="muted" style="margin-top:6px">' + esc(head) + '</div>'; last = head; }
          h += '<div class="it stk" data-n="' + esc(g.choice.toLowerCase()) + '"><span class="nm">' + esc(g.choice.replace(/_/g, ' ')) + '</span><button class="alt sm" data-m="openGarment" data-s="' + esc(g.slot) + '" data-b="' + esc(g.body || '') + '" data-c="' + esc(g.choice) + '">Open a copy</button></div>'; }); }
      else Object.keys(P.creatures || {}).filter(function(n){ return P.parts && P.parts[n]; }).forEach(function(n){ h += '<div class="it stk" data-n="' + esc(n) + '"><span class="nm">' + esc(n.replace(/_/g, ' ')) + ' <span class="muted">' + Object.keys(P.creatures[n].bones || {}).length + ' bones, ' + Object.keys(P.creatures[n].clips || {}).length + ' clips</span></span><button class="alt sm" data-m="openCreature" data-p="' + esc(name) + '" data-n="' + esc(n) + '">Open a copy</button></div>'; });
      box.innerHTML = h + '</div>';
      var f = $('stockFilter'); if (f) f.addEventListener('input', function(){ var q = f.value.trim().toLowerCase().replace(/ /g, '_'); [].slice.call(document.querySelectorAll('#stockList .stk')).forEach(function(el){ el.classList.toggle('hidden', !!q && el.dataset.n.indexOf(q) < 0); }); });
    });
    M.loadStock([name], 'assets/shaped/', function(){
      var idx = M.stockIndex(name), groups = Object.keys(idx), total = 0; groups.forEach(function(g){ total += idx[g] ? idx[g].length : 1; });
      if (!groups.length){ box.innerHTML = '<h2>' + esc(name) + '</h2><p>This pack has no models to open (or could not load).</p><div class="row"><button class="alt sm" data-m="stockBrowser">Back</button></div>'; return; }
      var h = '<h2>' + esc(name) + ' <span class="muted">' + total + ' models</span></h2><div class="row"><input class="grow" id="stockFilter" type="text" placeholder="Filter by name"><button class="alt sm" data-m="stockBrowser">Back</button><button class="alt sm" data-m="close">Close</button></div><div class="list" id="stockList" style="max-height:52vh;overflow:auto">';
      var wholes = groups.filter(function(g){ return !idx[g]; });
      if (wholes.length) h += '<div class="muted" style="margin-top:6px">whole models</div>' + wholes.map(function(g){ return '<div class="it stk" data-n="' + esc(g.toLowerCase()) + '"><span class="nm">' + esc(g.replace(/_/g, ' ')) + '</span><button class="alt sm" data-m="stockOpen" data-p="' + esc(name) + '" data-g="' + esc(g) + '" data-n="">Open a copy</button></div>'; }).join('');
      groups.filter(function(g){ return idx[g]; }).forEach(function(g){ h += '<div class="muted" style="margin-top:6px">' + esc(g) + '</div>' + idx[g].map(function(n){ return '<div class="it stk" data-n="' + esc(n.toLowerCase()) + '"><span class="nm">' + esc(n.replace(/_/g, ' ')) + '</span><button class="alt sm" data-m="stockOpen" data-p="' + esc(name) + '" data-g="' + esc(g) + '" data-n="' + esc(n) + '">Open a copy</button></div>'; }).join(''); });
      h += '</div>'; box.innerHTML = h;
      var f = $('stockFilter'); if (f) f.addEventListener('input', function(){ var q = f.value.trim().toLowerCase().replace(/ /g, '_'); [].slice.call(document.querySelectorAll('#stockList .stk')).forEach(function(el){ el.classList.toggle('hidden', !!q && el.dataset.n.indexOf(q) < 0); }); });
    });
  }
  var MODAL = {
    close:closeModal,
    open:function(b){ saveDraft(); setDoc(clone(drafts()[b.dataset.id])); closeModal(); },
    del:function(b){ if (b.dataset.sure !== '1'){ b.dataset.sure = '1'; b.textContent = 'Tap again to delete'; return; } var d = drafts(); delete d[b.dataset.id]; store.set('drafts', d); library(); },
    blank:function(){ saveDraft(); var d = M.blankDoc(); d.id = uniqueId('my_car'); d.name = 'My car'; setDoc(d); closeModal(); },
    blankKind:function(b){ saveDraft(); var k = b.dataset.k, d = M.blankOfKind(k, uniqueId('my_' + k)); d.name = 'My ' + (k === 'sound' ? 'sound' : M.KINDS[k].label.toLowerCase()); setDoc(d); S.tab = k === 'sound' ? 'sound' : k === 'creature' ? 'anim' : 'model'; refresh(true); closeModal(); },
    blankCreature:function(b){ saveDraft(); var d = M.blankCreature(b.dataset.t, uniqueId('my_' + b.dataset.t)); d.name = 'My creature'; setDoc(d); S.tab = 'anim'; refresh(true); closeModal(); toast('A starter creature: reshape its pieces, then pose its clips on the Animate tab.'); },
    stockBrowser:function(){ stockBrowser(); },
    openCreature:function(b){ saveDraft(); try { var d = M.importCreature(SH, b.dataset.p, b.dataset.n); d.id = uniqueId(d.id); setDoc(d); S.tab = 'anim'; refresh(true); closeModal(); toast('Opened a copy of the ' + b.dataset.n.replace(/_/g, ' ') + ': its bones and clips are on the Animate tab.'); } catch (e){ toast('Could not open it: ' + e.message); } },
    openGarment:function(b){ saveDraft(); try { var d = M.importGarment(SH, b.dataset.s, b.dataset.b || null, b.dataset.c); d.id = uniqueId(d.id); setDoc(d); S.tab = 'model'; refresh(true); closeModal(); toast('Opened a copy of ' + b.dataset.s + ' ' + b.dataset.c.replace(/_/g, ' ') + ', on a survivor.'); } catch (e){ toast('Could not open it: ' + e.message); } },
    stockPack:function(b){ stockPack(b.dataset.n); },
    stockOpen:function(b){ var pk = b.dataset.p, g = b.dataset.g, n = b.dataset.n || null; saveDraft(); try { var d = M.importModel(SH, pk, g, n); d.id = uniqueId(d.id); setDoc(d); S.tab = 'model'; refresh(true); closeModal(); toast('Opened a copy of ' + pk + '.' + g + (n ? '.' + n : '') + ' (' + d.pieces.length + ' pieces). The game\'s own model is not changed.'); } catch (e){ toast('Could not open it: ' + e.message); } },
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
    exportIds.forEach(function(id){ var doc = d[id]; if (!doc) return; try { if (doc.type === 'sound'){ if (!doc.rendered || !doc.rendered.length) throw new Error('record it first'); pk.assets.push(soundAsset(doc)); pk.version = 2; } else if (doc.type === 'model'){ pk.assets.push(M.buildModelAsset(doc)); pk.version = 2; } else pk.assets.push(M.buildAsset(doc, D)); } catch (e){ console.error(e); bad.push(doc.name); } });
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
      (pk.assets || []).forEach(function(a){ if (a.type !== 'vehicle' && !(a.type === 'model' && a.source)) return; var doc = a.type === 'model' ? clone(a.source) : M.docFromAsset(a); doc.id = uniqueId(doc.id || doc.name); d[doc.id] = doc; last = doc; n++; });
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
    if (!S.liveField && !S.gzDrag) renderPanel();
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
  window.WORKSHOP = {S:S, refresh:refresh, asset:asset, view:view, importText:importText, exportPack:function(ids){ exportIds = ids || [S.doc.id]; }, place:place, hit:hit, changed:changed, fitView:fitView};
})();
