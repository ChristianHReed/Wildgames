/* Finds loose pieces: for each vehicle model, joins pieces whose boxes touch (within TOL m) and reports any group not joined to the biggest one.
   Usage: node audit.js <pack> [tol] [filter]. Wheels are measured at their wheel points. */
global.window = {};
const fs = require('fs'), path = require('path');
require(path.join(__dirname, '..', 'shapes.js'));
const name = process.argv[2], TOL = +process.argv[3] || 0.03, FILT = process.argv[4] || '';
eval(fs.readFileSync(path.join(__dirname, '..', name + '.js'), 'utf8'));
const S = window.SHAPED, P = S[name], ONE = () => [1, 1, 1];
const isPiece = q => q && typeof q === 'object' && typeof q.s === 'string';
function bb(q){ const m = S.buildIndexed([q], ONE), p = m.pos; if (!p.length) return null; const a = [1e9,1e9,1e9], b = [-1e9,-1e9,-1e9];
  for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++){ a[k] = Math.min(a[k], p[i+k]); b[k] = Math.max(b[k], p[i+k]); } return [a, b]; }
function groups(list){ const n = list.length, par = [...Array(n).keys()]; const f = i => par[i] === i ? i : (par[i] = f(par[i]));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++){ const A = list[i].b, B = list[j].b; let ok = true;
    for (let k = 0; k < 3; k++) if (A[0][k] > B[1][k] + TOL || B[0][k] > A[1][k] + TOL) { ok = false; break; } if (ok) par[f(i)] = f(j); }
  const g = {}; list.forEach((x, i) => (g[f(i)] = g[f(i)] || []).push(x)); return Object.values(g).sort((a, b) => b.length - a.length); }
function modelPieces(m, key){ const out = [];
  if (Array.isArray(m)) { m.forEach((q, i) => { if (isPiece(q)) { const b = bb(q); if (b) out.push({ b, q, tag: key + '#' + i }); } }); }
  else for (const k in m) { if (k === 'wheel' || k === 'damage') continue; out.push(...modelPieces(m[k], key + '.' + k)); }
  return out; }
function visit(v, key, depth){
  if (!v || typeof v !== 'object') return;
  if (!Array.isArray(v) && (v.body || v.hull || v.frame || v.chassis || v.cab) && depth > 0) {
    if (FILT && !key.includes(FILT)) return;
    const list = modelPieces(v, key); if (list.length < 2) return; const g = groups(list);
    if (g.length > 1) { console.log(key + ': ' + g.length + ' groups; loose:'); g.slice(1).forEach(gr => console.log('   ' + gr.map(x => x.tag + ' ' + x.q.s + ' ' + x.q.c + ' [' + x.b[0].map(n => n.toFixed(2)) + ']..[' + x.b[1].map(n => n.toFixed(2)) + ']').join('\n   '))); }
    return; }
  if (Array.isArray(v)) return;
  for (const k in v) visit(v[k], key ? key + '.' + k : k, depth + 1);
}
visit(P.models, '', 0);
