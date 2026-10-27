/* Opens every model of every pack in the Workshop and writes it back: the result must equal the original.
   Run: node workshop/tools/roundtrip.js [pack]    (prints only the failures and a total) */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js');
var only = process.argv[2];
fs.readdirSync(root + 'assets/shaped').filter(function(f){ return /\.js$/.test(f) && f !== 'shapes.js'; }).forEach(function(f){ try { require(root + 'assets/shaped/' + f); } catch (e){ console.log('could not load', f, e.message); } });
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var total = 0, bad = 0, pieces = 0, pcount = {}, whole = 0, npts = 0;
Object.keys(SHAPED).sort().forEach(function(pack){
  var P = SHAPED[pack]; if (!P || !P.models || (only && only !== pack)) return;
  Object.keys(P.models).forEach(function(g){
    if (M.isWholeGroup(SHAPED, pack, g)){
      total++;
      try { var dw = M.importModel(SHAPED, pack, g, null); pieces += dw.pieces.length; whole++;
        var A = M.buildModelAsset(dw);
        if (!M.sameModel(A.value, P.models[g])){ bad++; if (bad <= 15) console.log('DIFFERENT (whole)', pack + '.' + g); }
        A.extra.forEach(function(e){ var o = P; e.path.forEach(function(k){ o = o == null ? o : o[k]; }); if (!M.sameModel(e.value, o)){ bad++; if (bad <= 15) console.log('TABLE CHANGED', pack + '.' + e.path.join('.')); } });
        npts += dw.points.length;
      } catch (e){ bad++; if (bad <= 15) console.log('ERROR (whole)', pack + '.' + g, e.message); }
      return;
    }
    Object.keys(P.models[g]).forEach(function(n){
      total++;
      try {
        var doc = M.importModel(SHAPED, pack, g, n); pieces += doc.pieces.length; pcount[pack] = (pcount[pack] || 0) + 1;
        var A2 = M.buildModelAsset(doc), out = A2.value; npts += doc.points.length;
        if (!M.sameModel(out, P.models[g][n])){ bad++; if (bad <= 15) console.log('DIFFERENT', pack + '.' + g + '.' + n); }
        A2.extra.forEach(function(e){ var o = P; e.path.forEach(function(k){ o = o == null ? o : o[k]; }); if (!M.sameModel(e.value, o)){ bad++; if (bad <= 15) console.log('TABLE CHANGED', pack + '.' + e.path.join('.')); } });
      } catch (e){ bad++; if (bad <= 15) console.log('ERROR', pack + '.' + g + '.' + n, e.message); }
    });
  });
});
console.log(total + ' models opened and saved (' + whole + ' whole vehicles and groups), ' + pieces + ' pieces, ' + npts + ' points, ' + bad + ' differ');
process.exitCode = bad ? 1 : 0;
