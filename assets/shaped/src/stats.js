/* Counts triangles and vertices for every model in a pack, using shapes.js itself.
   Usage: node stats.js <pack>. Prints JSON {key: [triangles, indexed vertices, welded vertices]}.
   A model is a plain piece list, or (unless the pack sets flatModels) an object whose values are piece lists, grouped by bone. */
global.window = {};
const fs = require('fs'), path = require('path');
require(path.join(__dirname, '..', 'shapes.js'));
const name = process.argv[2];
eval(fs.readFileSync(path.join(__dirname, '..', name + '.js'), 'utf8'));
const S = window.SHAPED, P = S[name], out = {}, ONE = () => [1, 1, 1];
const isPiece = q => q && typeof q === 'object' && typeof q.s === 'string';
function pieces(v){
  if (Array.isArray(v) && v.every(isPiece)) return v;
  if (v && typeof v === 'object' && !Array.isArray(v) && !P.flatModels){   // a model grouped by bone
    const ks = Object.keys(v); if (ks.length && ks.every(k => Array.isArray(v[k]) && v[k].every(isPiece))) return [].concat(...ks.map(k => v[k]));
  }
  return null;
}
function walk(v, key){
  const ps = pieces(v);
  if (ps){ const m = S.buildIndexed(ps, ONE); out[key] = [S.count(ps), m.pos.length/3, S.weld(m).pos.length/3]; return; }
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const k in v) walk(v[k], key ? key + '.' + k : k);
}
walk(P.parts || P.models, '');
process.stdout.write(JSON.stringify(out));
