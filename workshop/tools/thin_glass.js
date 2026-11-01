/* Glass rule (1 Nov 2026): glass is a thin tinted pane, never a solid block. This one-off pass rewrites chunky glass BOXES (thinnest side >= 12 cm) in the
   generated shaped packs as five thin panes (front, back, two ends, top; no bottom) so the case, counter, tank or cab behind the glass can be seen.
   Panes keep the piece's glass colour (the tint) and material. Text-level edit, so the rest of each file is untouched. Run: node workshop/tools/thin_glass.js [--dry]
   Skips rotated or scaled pieces, lanternGlass (it glows as a block) and glassBroken. The python sources are frozen for these packs. */
var fs = require('fs'), dir = __dirname + '/../../assets/shaped/', dry = process.argv.indexOf('--dry') >= 0, T = 0.02, MIN = 0.12;
var totals = {};
fs.readdirSync(dir).filter(function(f){ return /\.js$/.test(f); }).forEach(function(f){
  var t = fs.readFileSync(dir + f, 'utf8'), n = 0;
  var out = t.replace(/\{[^{}]*"c":"glass[A-Za-z]*"[^{}]*\}/g, function(m){
    var q; try { q = JSON.parse(m); } catch (e) { return m; }
    if (q.s !== 'box' || !q.d || !q.p || q.rot || q.ry || q.scl || /^glassBroken|^glassDoor/.test(q.c)) return m;
    var w = q.d[0], h = q.d[1], l = q.d[2]; if (Math.min(w, h, l) < MIN) return m;
    function pane(dx, dy, dz, sx, sy, sz){ var o = Object.assign({}, q); o.p = [r(q.p[0] + dx), r(q.p[1] + dy), r(q.p[2] + dz)]; o.d = [r(sx), r(sy), r(sz)]; return JSON.stringify(o); }
    function r(v){ return Math.round(v*1e4)/1e4; }
    n++;
    return [pane(0, 0, l/2 - T/2, w, h, T), pane(0, 0, -l/2 + T/2, w, h, T), pane(w/2 - T/2, 0, 0, T, h, l - 2*T), pane(-w/2 + T/2, 0, 0, T, h, l - 2*T), pane(0, h/2 - T/2, 0, w - 2*T, T, l - 2*T)].join(',');
  });
  if (n){ totals[f] = n; if (!dry) fs.writeFileSync(dir + f, out); }
});
console.log((dry ? 'would change ' : 'changed ') + JSON.stringify(totals));
