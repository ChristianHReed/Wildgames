/* Opens every model of every pack in the Workshop and writes it back: the result must equal the original.
   Run: node workshop/tools/roundtrip.js [pack]    (prints only the failures and a total) */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js');
var only = process.argv[2];
fs.readdirSync(root + 'assets/shaped').filter(function(f){ return /\.js$/.test(f) && f !== 'shapes.js'; }).forEach(function(f){ try { require(root + 'assets/shaped/' + f); } catch (e){ console.log('could not load', f, e.message); } });
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var total = 0, bad = 0, pieces = 0, pcount = {};
Object.keys(SHAPED).sort().forEach(function(pack){
  var P = SHAPED[pack]; if (!P || !P.models || (only && only !== pack)) return;
  Object.keys(P.models).forEach(function(g){
    Object.keys(P.models[g]).forEach(function(n){
      total++;
      try {
        var doc = M.importModel(SHAPED, pack, g, n); pieces += doc.pieces.length; pcount[pack] = (pcount[pack] || 0) + 1;
        var out = M.exportModel(doc);
        if (!M.sameModel(out, P.models[g][n])){ bad++; if (bad <= 15) console.log('DIFFERENT', pack + '.' + g + '.' + n); }
      } catch (e){ bad++; if (bad <= 15) console.log('ERROR', pack + '.' + g + '.' + n, e.message); }
    });
  });
});
console.log(total + ' models opened and saved, ' + pieces + ' pieces, ' + bad + ' differ');
process.exitCode = bad ? 1 : 0;
