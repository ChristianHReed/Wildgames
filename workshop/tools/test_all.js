/* Every Workshop test, one after another: run before pushing.  node workshop/tools/test_all.js [--quick]   (--quick skips the browser tests) */
var cp = require('child_process'), path = require('path'), dir = __dirname, quick = process.argv.indexOf('--quick') >= 0;
var T = [['round trips', 'roundtrip.js'], ['vehicle designs', 'test_crafts.js'], ['kit and cages', 'test_kit.js']];
if (!quick) T.push(['editor in the browser', 'browser_editor.js'], ['phone and iPad layout', 'browser_layout.js']);
var bad = 0;
T.forEach(function(t){ var t0 = Date.now(), r = cp.spawnSync(process.execPath, [path.join(dir, t[1])], {encoding:'utf8', timeout:600000}), out = (r.stdout || '') + (r.stderr || '');
  var last = out.trim().split('\n').slice(-1)[0], ok = r.status === 0; if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + t[0] + ' (' + Math.round((Date.now() - t0)/1000) + ' s): ' + last);
  if (!ok) out.split('\n').filter(function(l){ return /^FAIL/.test(l); }).slice(0, 8).forEach(function(l){ console.log('       ' + l); }); });
console.log(bad ? bad + ' failed' : 'all Workshop tests passed'); process.exit(bad ? 1 : 0);
