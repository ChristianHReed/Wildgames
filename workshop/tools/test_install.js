/* Loads every shaped pack and every pack in packs/, installs them, and checks that every installed asset is in SHAPED and draws.
   Run: node workshop/tools/test_install.js */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js');
fs.readdirSync(root + 'assets/shaped').filter(function(f){ return /\.js$/.test(f) && f !== 'shapes.js'; }).forEach(function(f){ require(root + 'assets/shaped/' + f); });
require(root + 'packs/packload.js'); require(root + 'packs/index.js');
(window.AFTERSTREET_PACK_FILES || []).forEach(function(f){ require(root + 'packs/' + f + '.js'); });
var P = AfterstreetPacks.install(SHAPED), bad = 0;
P.errors.forEach(function(e){ console.log('ERROR', e); bad++; });
function count(pcs){ return SHAPED.count(pcs); }
P.models.forEach(function(m){
  var v = m.whole ? SHAPED[m.pack].models[m.key] : SHAPED[m.pack].models[m.group][m.key]; if (!v){ console.log('MISSING', m.pack, m.group, m.key); bad++; return; }
  var tris = 0; (function walk(o){ if (Array.isArray(o) && o.length && o[0] && o[0].s) tris += count(o); else if (o && typeof o === 'object') for (var k in o) walk(o[k]); })(v);
  console.log('installed', m.pack + '.' + m.group + '.' + m.key, m.kind, tris + ' triangles', tris ? '' : 'EMPTY'); if (!tris) bad++;
});
P.vehicles.forEach(function(v){ console.log('installed car', v.key); });
console.log(bad ? bad + ' problems' : 'all good');
process.exitCode = bad ? 1 : 0;
