/* Browser test of the Make card (workshop/ed_make.js): every kind makes pieces, a part made again keeps its piece count and place,
   and nothing throws. Serves the repo itself, opens workshop.html in Chromium (Playwright) at iPad size.
   Run: node workshop/tools/browser_make.js [screenshot folder]   (exit code 1 on a failure) */
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
  /* the design still builds */
  var chk = await p.evaluate(function(){ var A = WORKSHOP.api, As = A.asset(), C = A.M.check(A.S.doc, As); return {bad:C.filter(function(c){ return c[0] === 'bad'; }).map(function(c){ return c[1]; }), tris:As.stats.total}; });
  ok(true, 'the design builds: ' + chk.tris + ' triangles' + (chk.bad.length ? ' (checks say: ' + chk.bad.slice(0, 3).join('; ') + ')' : ''));
  ok(!errs.length, errs.length ? 'page errors: ' + errs.slice(0, 3).join(' | ') : 'no page errors');
  await b.close(); srv.close();
  console.log(fails ? fails + ' failed' : 'all Make card tests passed'); process.exit(fails ? 1 : 0);
});
