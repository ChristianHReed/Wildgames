/* Browser test of the Workshop's layout on an iPhone held upright and on its side, and an iPad: how much of the screen
   the view gets, how many visible controls are smaller than 44 points, and that nothing scrolls sideways.
   Run: node workshop/tools/browser_layout.js [screenshot folder]   (exit code 1 on a failure) */
var http = require('http'), fs = require('fs'), path = require('path'), root = path.resolve(__dirname, '../..'), shots = process.argv[2];
var TYPES = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css', '.svg':'image/svg+xml'};
var srv = http.createServer(function(q, r){ var f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.indexOf(root) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end(); }
  r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
var SIZES = [['iphone', {width:390, height:844}, 0.6], ['iphone_side', {width:844, height:390}, 0.6], ['ipad', {width:1180, height:820}, 0.45], ['ipad_upright', {width:820, height:1180}, 0.6]];
srv.listen(0, async function(){
  var fails = 0, ok = function(c, what){ console.log((c ? 'ok   ' : 'FAIL ') + what); if (!c) fails++; };
  var chromium = require('playwright').chromium, b = await chromium.launch({args:['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  for (var i = 0; i < SIZES.length; i++){ var nm = SIZES[i][0], vp = SIZES[i][1], want = SIZES[i][2];
    var ctx = await b.newContext({viewport:vp, hasTouch:true, isMobile:true, deviceScaleFactor:2, serviceWorkers:'block'}), p = await ctx.newPage(), errs = [];
    p.on('pageerror', function(e){ errs.push(e.message); });
    await p.goto('http://localhost:' + srv.address().port + '/workshop.html'); await p.waitForFunction(function(){ return window.WORKSHOP && WORKSHOP.S && WORKSHOP.S.doc; }, null, {timeout:30000});
    /* a piece selected: the panel with the most controls */
    await p.evaluate(function(){ var A = WORKSHOP.api, S = A.S, q = S.doc.pieces.filter(function(x){ return x.g !== 'wheel'; })[0] || A.M.addPiece(S.doc, 'box', [0, 0.6, 0], {}); S.sel = [q.id]; S.tab = 'piece'; A.refresh(); if (A.sheet && A.sheet.on()) A.sheet.set('half'); });
    await p.waitForTimeout(500);
    var m = await p.evaluate(function(){
      var vis = function(e){ var r = e.getBoundingClientRect(), st = getComputedStyle(e); if (!r.width || !r.height || st.visibility === 'hidden') return null;
        for (var el = e; el; el = el.parentElement) if (getComputedStyle(el).display === 'none') return null; return r; };
      var vpR = document.getElementById('vp').getBoundingClientRect(), panel = document.getElementById('panel').getBoundingClientRect();
      var sheet = WORKSHOP.api.sheet && WORKSHOP.api.sheet.on(), seen = vpR.height - (sheet ? Math.max(0, vpR.bottom - panel.top) : 0);
      var ctl = [].slice.call(document.querySelectorAll('button, select, input:not([type=hidden]):not([type=file])')).filter(function(e){ var r = vis(e); return r && r.bottom > 0 && r.top < innerHeight; });
      var small = ctl.filter(function(e){ var r = e.getBoundingClientRect(); if (e.type === 'checkbox' || e.type === 'radio'){ var l = e.closest('label'); r = l ? l.getBoundingClientRect() : r; } return r.height < 43.5; });
      return {view:Math.round(vpR.width) + ' x ' + Math.round(vpR.height), seen:Math.round(seen), share:seen/innerHeight, ctl:ctl.length, small:small.length, smallList:small.slice(0, 6).map(function(e){ return (e.id || e.dataset.a || e.dataset.k || e.textContent || e.type).toString().trim().slice(0, 18) + ' ' + Math.round(e.getBoundingClientRect().height); }), sideways:document.documentElement.scrollWidth > innerWidth + 1};
    });
    ok(m.share >= want - 0.25 && !m.sideways, nm + ': view ' + m.view + ', ' + m.seen + ' px of it showing with the panel open (' + Math.round(m.share*100) + '% of the screen)' + (m.sideways ? ', SCROLLS SIDEWAYS' : ''));
    ok(m.small === 0, nm + ': ' + m.small + ' of ' + m.ctl + ' controls on screen under 44 points' + (m.small ? ' (' + m.smallList.join(', ') + ')' : ''));
    if (shots) await p.screenshot({path:shots + '/layout_' + nm + '.png'});
    ok(!errs.length, nm + ': ' + (errs.length ? errs.slice(0, 2).join(' | ') : 'no page errors'));
    await ctx.close();
  }
  await b.close(); srv.close(); console.log(fails ? fails + ' failed' : 'all layout tests passed'); process.exit(fails ? 1 : 0);
});
