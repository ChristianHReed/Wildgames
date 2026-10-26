/* Measures every model in a pack with shapes.js: prints JSON {key: [width x, depth z, height, lowest y]} in metres. Usage: node bounds.js <pack> */
global.window = {};
const fs = require('fs'), path = require('path');
require(path.join(__dirname, '..', 'shapes.js'));
const name = process.argv[2];
eval(fs.readFileSync(path.join(__dirname, '..', name + '.js'), 'utf8'));
const S = window.SHAPED, P = S[name], out = {}, ONE = () => [1, 1, 1];
const isPiece = q => q && typeof q === 'object' && typeof q.s === 'string';
function walk(v, key){
  if (Array.isArray(v) && v.every(isPiece)){ const m = S.buildIndexed(v, ONE), p = m.pos; let a = [1e9,1e9,1e9], b = [-1e9,-1e9,-1e9];
    for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++){ a[k] = Math.min(a[k], p[i+k]); b[k] = Math.max(b[k], p[i+k]); }
    out[key] = [+(b[0]-a[0]).toFixed(2), +(b[2]-a[2]).toFixed(2), +b[1].toFixed(2), +a[1].toFixed(2), +a[0].toFixed(3), +b[0].toFixed(3), +a[2].toFixed(3), +b[2].toFixed(3)]; return; }
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const k in v) walk(v[k], key ? key + '.' + k : k);
}
walk(P.models, ''); process.stdout.write(JSON.stringify(out));
