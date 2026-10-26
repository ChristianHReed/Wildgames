// Writes every triangle of the shaped trees and plants as JSON for tools/build_nature.py:
// assets/shaped/flora.js (trees with three variants each, bushes, shrubs, grass) and the rest of the plants from assets/shaped/props.js.
// usage: node tools/export_shaped_plants.js > tools/out/shaped_plants.json
global.window = global; require('../assets/shaped/shapes.js'); require('../assets/shaped/props.js'); require('../assets/shaped/flora.js'); require('../assets/shaped/woods.js');
var out = {};
function dump(pack, models, pre){
  var pal = pack.palette;
  function colourOf(n){ var dk = n.slice(-2) === '_D', b = dk ? n.slice(0, -2) : n, c = SHAPED.hex(pal[b] || '#ff00ff'); return dk ? c.map(function(v){ return v*0.78; }) : c; }
  Object.keys(models).forEach(function(k){
    var A = SHAPED.build(models[k], colourOf, null, {}), t = [], n = A.pos.length/9;
    for (var i = 0; i < n; i++){ var r = []; for (var j = 0; j < 9; j++) r.push(Math.round(A.pos[i*9 + j]*10000)/10000); for (j = 0; j < 3; j++) r.push(Math.round(Math.max(0, Math.min(1, A.col[i*9 + j]))*255)); t.push(r); }
    out[(pre || '') + k] = t;
  });
}
dump(SHAPED.props, SHAPED.props.models.plants);   /* flowers, fern, mushrooms, rock, log, stump, reeds... */
dump(SHAPED.flora, SHAPED.flora.models.plants);   /* overrides the older oak, pine, bush and grass_tuft of the props pack */
dump(SHAPED.woods, SHAPED.woods.models.woods, 'w_');   /* 0.98.0: the content chat's woods pack (undergrowth, dead wood, thickets) */
process.stdout.write(JSON.stringify(out));
