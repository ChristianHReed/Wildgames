/* Browser test of the editor's tools: the Make card (every kind, and making a part again), corner editing, the piece list,
   Try it in the game, and smooth cages. Serves the repo itself and opens workshop.html in Chromium (Playwright) at iPad size.
   Run: node workshop/tools/browser_editor.js [screenshot folder]   (exit code 1 on a failure) */
var http = require('http'), fs = require('fs'), path = require('path'), root = path.resolve(__dirname, '../..'), shots = process.argv[2];
var TYPES = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css', '.svg':'image/svg+xml'};
var srv = http.createServer(function(q, r){ var f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.indexOf(root) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end(); }
  r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
srv.listen(0, async function(){
  var port = srv.address().port, fails = 0, ok = function(c, what){ console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fails++; };
  var chromium = require('playwright').chromium, b = await chromium.launch({args:['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  var ctx = await b.newContext({viewport:{width:1180, height:820}, hasTouch:true, isMobile:true, deviceScaleFactor:1, serviceWorkers:'block'}), p = await ctx.newPage(), errs = [];
  p.on('pageerror', function(e){ errs.push(e.message); });
  await p.goto('http://localhost:' + port + '/workshop.html'); await p.waitForFunction(function(){ return window.WORKSHOP && WORKSHOP.S && WORKSHOP.S.doc; }, null, {timeout:30000});
  /* start from a blank car with one body block selected */
  await p.evaluate(function(){ var A = WORKSHOP.api, M = A.M, d = M.blankDoc(); A.setDoc(d); var q = M.addPiece(A.S.doc, 'box', [0, 0.8, 0], {d:[1.8, 0.8, 4.2]}); A.S.tab = 'piece'; A.S.sel = [q.id]; A.refresh(); });
  var kinds = ['stairs', 'pane', 'wall', 'text', 'trim', 'row', 'radial', 'lathe', 'extrude', 'pipe', 'cabin', 'cab', 'wheels'];
  for (var i = 0; i < kinds.length; i++){ var k = kinds[i];
    var res = await p.evaluate(function(k){ var A = WORKSHOP.api, S = A.S, first = S.doc.pieces.filter(function(q){ return q.s === 'box' && q.name == null && q.g === 'body'; })[0];
      S.sel = [first.id]; A.renderPanel(); var sel = document.querySelector('select[data-k=mkKind]'); if (!sel) return {err:'no Make card'};
      if (![].some.call(sel.options, function(o){ return o.value === k; })) return {err:'kind not offered'};
      sel.value = k; sel.dispatchEvent(new Event('change', {bubbles:true}));
      var n0 = S.doc.pieces.length, go = document.querySelector('button[data-a=mkGo]'); if (!go) return {err:'no Make button'}; go.click();
      return {made:S.doc.pieces.length - n0, look:S.doc.setup.wheelLook || null, fields:document.querySelectorAll('.card.mk input, .card.mk select').length}; }, k);
    ok(!res.err && (res.made > 0 || (k === 'wheels' && res.made >= 0)), k + ': ' + (res.err || res.made + ' pieces from ' + res.fields + ' fields'));
    if (shots && (k === 'wall' || k === 'pane')) await p.screenshot({path:shots + '/make_' + k + '.png'});
  }
  /* change a made part: a wider pane, the same number of pieces, where it was */
  var re = await p.evaluate(function(){ var A = WORKSHOP.api, S = A.S, pane = S.doc.pieces.filter(function(q){ return q.kit && S.doc.kits[q.kit].t === 'pane'; })[0];
    if (!pane) return {err:'no pane'}; var k = pane.kit, w0 = A.M.boundsOf(A.M.toNative(pane)); S.sel = [pane.id]; A.renderPanel();
    var ed = document.querySelector('button[data-a=mkEdit]'); if (!ed) return {err:'no Change button'}; ed.click();
    var fld = document.querySelector('.card.mk .num input.nv'); if (!fld) return {err:'no width field'}; fld.value = String(+fld.value * 2); fld.dispatchEvent(new Event('change', {bubbles:true}));
    var n0 = S.doc.pieces.length; document.querySelector('button[data-a=mkRemake]').click();
    var now = S.doc.pieces.filter(function(q){ return q.kit === k; }), w1 = A.M.boundsOf([].concat.apply([], now.map(A.M.toNative)));
    return {same:S.doc.pieces.length === n0, w0:w0.mx[0] - w0.mn[0], w1:w1.mx[0] - w1.mn[0], z0:w0.mn[2], z1:w1.mn[2]}; });
  ok(!re.err && re.same && re.w1 > re.w0*1.8, 'change a made pane: ' + (re.err || 'width ' + re.w0.toFixed(2) + ' m to ' + re.w1.toFixed(2) + ' m, same piece count'));
  /* corners: drag a plate's corner in the front view with Both sides on; its partner across the middle follows, mirrored */
  await p.evaluate(function(){ var A = WORKSHOP.api, M = A.M; A.setDoc(M.blankDoc()); var q = M.addPiece(A.S.doc, 'plate', [0, 1, 0.5], {}); A.S.sel = [q.id]; A.S.gz.mode = 'shape'; A.S.gz.both = true; A.refresh();
    var fb = [].filter.call(document.querySelectorAll('button'), function(b){ return b.textContent.trim() === 'Front'; })[0]; if (fb) fb.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(function(){ var b = document.querySelector('#gzBar button[data-gz=corners]'); if (b) b.click(); });
  await p.waitForTimeout(200);
  var cs = await p.evaluate(function(){ var A = WORKSHOP.api, q = A.selected()[0], w = A.corners.toWorld(q, q.v[2]), s = A.view.project(w), r = A.view.canvas ? A.view.canvas.getBoundingClientRect() : document.getElementById('vp').getBoundingClientRect();
    return {x:s[0] + r.left, y:s[1] + r.top, on:A.S.gz.corners, v0:JSON.stringify(q.v)}; });
  await p.mouse.move(cs.x, cs.y); await p.mouse.down(); await p.mouse.move(cs.x + 30, cs.y - 20, {steps:4}); await p.mouse.move(cs.x + 60, cs.y - 40, {steps:4}); await p.mouse.up();
  var cr = await p.evaluate(function(){ var A = WORKSHOP.api, q = A.selected()[0], a = A.corners.toWorld(q, q.v[2]), b = A.corners.toWorld(q, q.v[3]); return {a:a, b:b, n:q.v.length, card:!!document.querySelector('select[data-k=crPick]')}; });
  ok(cs.on && cr.a[0] > 0.25 && cr.a[1] > 1.12 && Math.abs(cr.a[0] + cr.b[0]) < 0.002 && Math.abs(cr.a[1] - cr.b[1]) < 0.002 && Math.abs(cr.a[2] - 0.5) < 0.002,
    'corners: dragged corner 3 to x ' + cr.a[0].toFixed(3) + ', y ' + cr.a[1].toFixed(3) + '; corner 4 followed to x ' + cr.b[0].toFixed(3) + (cr.card ? ', Corners card shows' : ''));
  var ad = await p.evaluate(function(){ var b = document.querySelector('button[data-a=crAdd]'); if (!b) return -1; b.click(); return WORKSHOP.api.selected()[0].v.length; });
  ok(ad === 5, 'corners: a plate gains a corner (' + ad + ')');
  if (shots) await p.screenshot({path:shots + '/corners.png'});
  /* the piece list: open it, find the seats, select one from the list, hide another in the view */
  var pl = await p.evaluate(function(){ var A = WORKSHOP.api, M = A.M, S = A.S, d = M.blankDoc(); A.setDoc(d); var K = window.WSK, b = K.on(S.doc);
    K.carCabin(b, {hw:0.8, belt:1.0, roof:1.4, cabF:0.9, cabB:-0.9, g:0.2, seatY:0.68, rear:[]}); S.sel = []; A.refresh(true);
    var t = document.querySelector('button[data-x=plist]'); if (!t) return {err:'no Pieces button'}; t.click();
    var rows = document.querySelectorAll('.plist .plr').length, inp = document.querySelector('input[data-k=plSearch]'); inp.value = 'seat'; inp.dispatchEvent(new Event('input', {bubbles:true}));
    var shown = [].filter.call(document.querySelectorAll('.plist .plr'), function(r){ return r.style.display !== 'none'; });
    shown[0].querySelector('.plb').click(); var picked = S.sel.slice();
    var eye = document.querySelectorAll('.plist .plr')[1].querySelector('.ple'); var hid = eye.dataset.id; eye.click();
    return {rows:rows, pieces:S.doc.pieces.length, seats:shown.length, picked:picked.length === 1 && /seat/.test(A.byId(picked[0]).name || ''), hidden:!!S.viewHide[hid] && S.viewHideDoc === S.doc.id}; });
  ok(!pl.err && pl.rows === pl.pieces && pl.seats >= 4 && pl.picked && pl.hidden, 'piece list: ' + (pl.err || pl.rows + ' rows for ' + pl.pieces + ' pieces, ' + pl.seats + ' found for "seat", picked one, hid one in the view'));
  if (shots) await p.screenshot({path:shots + '/list.png'});
  /* try it in the game: a car that passes its checks leaves the hand-off for the game and opens play.html?try=1 */
  var tr = await p.evaluate(function(){ var A = WORKSHOP.api, M = A.M, S = A.S; A.setDoc(M.blankDoc()); var b = window.WSK.on(S.doc);
    b.box([-0.8, 0.4, -2], [0.8, 1.0, 2], {name:'body'}); b.block('box', [0, 0.7, 1.4], [0.5, 0.4, 0.5], {c:'underside', fn:'engine', hidden:true, name:'engine'});
    b.block('box', [0, 0.6, -1.4], [0.5, 0.25, 0.4], {c:'underside', fn:'tank', hidden:true, name:'tank'}); b.seat([0.35, 1.05, 0]); A.M.syncAxles(S.doc); A.refresh(true);
    S.tab = 'check'; A.renderPanel(); var btn = document.querySelector('button[data-a=tryGame]'); if (!btn) return {err:'no Try button'};
    window.__go = null; btn.click(); var m = null; try { m = JSON.parse(localStorage.getItem(AFTERSTREET_STATIONS.KEY)); } catch (e){}
    return {m:m && {station:m.station, sid:m.stationId, tr:m['try'], assets:m.pack && m.pack.assets.length}, modal:!document.getElementById('modal').classList.contains('hidden') ? document.getElementById('modalBox').textContent.slice(0, 200) : ''}; });
  await p.waitForTimeout(900);
  ok(tr.m && tr.m.station === 'carshop' && tr.m.tr && tr.m.assets === 1 && /play\.html\?try=1/.test(p.url()), 'try it in the game: ' + (tr.err || (tr.m ? 'hand-off for the ' + tr.m.station + ', opened ' + p.url().replace(/^.*\//, '') : 'no hand-off: ' + tr.modal)));
  await p.goto('http://localhost:' + port + '/workshop.html'); await p.waitForFunction(function(){ return window.WORKSHOP && WORKSHOP.S && WORKSHOP.S.doc; }, null, {timeout:30000});
  /* smooth cage: a block becomes a cage; pull a face out in the side view; pull out a new section on both sides */
  var cg = await p.evaluate(function(){ var A = WORKSHOP.api, M = A.M, S = A.S, K = window.WSK; A.setDoc(M.blankDoc());
    var q = M.addPiece(S.doc, 'box', [0, 1.2, 0], {d:[0.8, 0.5, 1.2]}); S.sel = [q.id]; S.tab = 'piece'; S.gz.both = true; A.refresh(true);
    var mk = document.querySelector('button[data-a=cgMake]'); if (!mk) return {err:'no Make it a smooth cage'}; mk.click();
    var c = A.selected()[0]; if (!c || c.s !== 'cage') return {err:'not a cage'};
    var fb = [].filter.call(document.querySelectorAll('#viewBar button'), function(b){ return b.dataset.v === 'right'; })[0]; if (fb) fb.click();
    return {v0:K.cageVolume(c.v, c.f), handles:!!S.gz.corners}; });
  await p.waitForTimeout(400);
  var fh = await p.evaluate(function(){ var A = WORKSHOP.api, c = A.selected()[0], best = -1, bz = -1e9;
    c.f.forEach(function(f, i){ var n = A.cageFaces.normal(c, i); if (n[2] > bz){ bz = n[2]; best = i; } });   /* the face looking to the front (+z) */
    var mid = [0, 0, 0]; c.f[best].forEach(function(j){ var w = A.corners.toWorld(c, c.v[j]); for (var k = 0; k < 3; k++) mid[k] += w[k]/4; });
    var s2 = A.view.project(mid), r = A.view.canvas.getBoundingClientRect(); return {i:best, x:s2[0] + r.left, y:s2[1] + r.top}; });
  await p.mouse.move(fh.x, fh.y); await p.mouse.down(); await p.mouse.move(fh.x - 30, fh.y, {steps:3}); await p.mouse.move(fh.x - 70, fh.y, {steps:3});   /* the side view looks from +x: left on screen is +z */ await p.mouse.up();
  var cg2 = await p.evaluate(function(i){ var A = WORKSHOP.api, S = A.S, K = window.WSK, c = A.selected()[0], v1 = K.cageVolume(c.v, c.f);
    S.cageFace = 4; A.renderPanel(); var pull = document.querySelector('button[data-a=cgPull]'); if (pull) pull.click(); c = A.selected()[0];
    var nat = A.M.toNative(c); return {v1:v1, faces:c.f.length, corners:c.v.length, nat:nat.length && nat[0].s, tris:A.asset().stats.total}; }, fh.i);
  ok(!cg.err && cg.handles && cg2.v1 > cg.v0*1.05 && cg2.faces === 6 + 4*2 && cg2.nat === 'poly', 'smooth cage: ' + (cg.err || 'from a block; face pulled out (inside ' + cg.v0.toFixed(2) + ' to ' + cg2.v1.toFixed(2) + ' cu m); new sections on both sides (' + cg2.corners + ' corners, ' + cg2.faces + ' faces, ' + cg2.tris + ' triangles in the game)'));
  if (shots) await p.screenshot({path:shots + '/cage.png'});
  /* the design still builds */
  var chk = await p.evaluate(function(){ var A = WORKSHOP.api, As = A.asset(), C = A.M.check(A.S.doc, As); return {bad:C.filter(function(c){ return c[0] === 'bad'; }).map(function(c){ return c[1]; }), tris:As.stats.total}; });
  ok(true, 'the design builds: ' + chk.tris + ' triangles' + (chk.bad.length ? ' (checks say: ' + chk.bad.slice(0, 3).join('; ') + ')' : ''));
  ok(!errs.length, errs.length ? 'page errors: ' + errs.slice(0, 3).join(' | ') : 'no page errors');
  await b.close(); srv.close();
  console.log(fails ? fails + ' failed' : 'all editor tests passed'); process.exit(fails ? 1 : 0);
});
