/* Corner editing for free-form pieces (Corner slope, Inside corner, Pyramid, Prism, imported polys) and plates.
   Select one such piece and press Corners on the handle bar: a handle sits on every corner. Drag one and it slides
   on the flat the view faces most (front view: across and up; top view: across and front to back), snapping to the grid;
   turn the view to move it the third way, or type exact numbers in the Corners card. With Both sides on, the matching
   corner across the middle (x = 0) moves too, mirrored, and a corner on the middle stays on it. Plates can gain and lose corners.
   Like Blender's vertex tools and Tinkercad's workplane, but for a finger: big handles, one flat at a time.
   Loaded before app.js; it plugs in through window.WSX. MIT licence. */
(window.WSX = window.WSX || []).push(function(A){
  var S = A.S, X = A.X, M = A.M, r4 = A.r4, clone = A.clone, esc = A.esc;
  var TOL = 0.002, AXW = ['across (x)', 'up (y)', 'front to back (z)'];
  function editable(p){ return p && (p.s === 'poly' || p.s === 'decal') && Array.isArray(p.v) && p.v.length >= 3; }
  function target(){
    if (!S.gz || !S.gz.corners || S.gz.mode !== 'shape' || !S.doc || S.layer === 'look' || S.placing || !A.view) return null;
    var sel = A.selected(); return sel.length === 1 && editable(sel[0]) ? sel[0] : null;
  }
  /* a corner's place in the world and back (the piece's size, turn and place; a held item's grip) */
  function toWorld(p, v){ var s = p.scl || [1, 1, 1], q = M.app3(M.rotMat(p.rot || [0, 0, 0]), [v[0]*s[0], v[1]*s[1], v[2]*s[2]]), o = A.gzOff(); return [q[0] + p.pos[0] + o[0], q[1] + p.pos[1] + o[1], q[2] + p.pos[2] + o[2]]; }
  function toLocal(p, w){
    var s = p.scl || [1, 1, 1], R = M.rotMat(p.rot || [0, 0, 0]), o = A.gzOff(), d = [w[0] - o[0] - p.pos[0], w[1] - o[1] - p.pos[1], w[2] - o[2] - p.pos[2]];
    var q = [R[0]*d[0] + R[3]*d[1] + R[6]*d[2], R[1]*d[0] + R[4]*d[1] + R[7]*d[2], R[2]*d[0] + R[5]*d[1] + R[8]*d[2]];   /* the turn undone (R is a rotation) */
    return [r4(q[0]/(s[0] || 1)), r4(q[1]/(s[1] || 1)), r4(q[2]/(s[2] || 1))];
  }
  /* a plate's facing follows its corners (Newell's method), keeping the side it faced */
  function refacePlate(p){
    if (p.s !== 'decal') return; var n = [0, 0, 0], v = p.v;
    for (var i = 0; i < v.length; i++){ var a = v[i], b = v[(i + 1) % v.length]; n[0] += (a[1] - b[1])*(a[2] + b[2]); n[1] += (a[2] - b[2])*(a[0] + b[0]); n[2] += (a[0] - b[0])*(a[1] + b[1]); }
    var l = Math.hypot(n[0], n[1], n[2]); if (l < 1e-9) return; n = n.map(function(x){ return x/l; });
    var o = p.n || [0, 0, 1]; if (n[0]*o[0] + n[1]*o[1] + n[2]*o[2] < 0) n = n.map(function(x){ return -x; });
    p.n = n.map(r4);
  }
  /* the corner across the middle from corner i (same height and depth, x the other way), if there is one */
  function partner(p, i){
    var w = toWorld(p, p.v[i]), best = -1;
    if (Math.abs(w[0]) < TOL) return -1;
    p.v.forEach(function(v, j){ if (j === i) return; var q = toWorld(p, v); if (Math.abs(q[0] + w[0]) < TOL && Math.abs(q[1] - w[1]) < TOL && Math.abs(q[2] - w[2]) < TOL) best = j; });
    return best;
  }
  /* put corner i at world point w (and its partner, mirrored, when Both sides is on) */
  function setCorner(p, i, w, v0){
    var both = S.gz.both, w0 = toWorld(p, (v0 || p.v)[i]), j = both ? partnerOf(p, i, v0) : -1;
    if (both && Math.abs(w0[0]) < TOL) w = [w0[0], w[1], w[2]];   /* on the middle: it stays there */
    p.v[i] = toLocal(p, w);
    if (j >= 0) p.v[j] = toLocal(p, [-w[0], w[1], w[2]]);
    refacePlate(p);
  }
  function partnerOf(p, i, v0){ if (!v0) return partner(p, i); var keep = p.v; p.v = v0; var j = partner(p, i); p.v = keep; return j; }
  function corner(){ var p = A.selected()[0]; if (!editable(p)) return 0; return Math.max(0, Math.min(p.v.length - 1, S.cornerIdx || 0)); }

  /* ---------------------------------------------------------------- handles */
  X.handles.push(function(){
    var p = target(); if (!p) return null;
    var H = [], k = corner(), W = p.v.map(function(v){ return toWorld(p, v); });
    W.forEach(function(w, i){ H.push({type:'corner', i:i, sg:0, pos:w, dir:[0, 0, 0], box:true, col:i === k ? '#f0922a' : '#e8c24a'}); });
    if (p.s === 'decal') H.push({type:'outline', pts:W.concat([W[0]]), col:'#f0922a', pos:W[0]});
    else (p.f || []).forEach(function(f){ H.push({type:'outline', pts:f.map(function(j){ return W[j]; }).concat([W[f[0]]]), col:'#e8c24a', pos:W[f[0]]}); });
    return H;
  });
  function hit(R, k, c){ if (Math.abs(R.d[k]) < 1e-6) return null; var t = (c - R.o[k])/R.d[k]; return [R.o[0] + R.d[0]*t, R.o[1] + R.d[1]*t, R.o[2] + R.d[2]*t]; }
  X.gz.corner = {
    start:function(h, x, y, D){
      var p = D.sel[0].p, R = A.view.ray(x, y), k = 0;
      [1, 2].forEach(function(a){ if (Math.abs(R.d[a]) > Math.abs(R.d[k])) k = a; });   /* the flat the view faces most */
      S.cornerIdx = h.i; D.i = h.i; D.k = k; D.w0 = toWorld(p, p.v[h.i]); D.v0 = clone(p.v); D.h0 = hit(R, k, D.w0[k]);
      A.renderPanel();
    },
    move:function(h, x, y, D){
      var p = D.sel[0].p, q = hit(A.view.ray(x, y), D.k, D.w0[D.k]); if (!q || !D.h0) return;
      var w = [0, 1, 2].map(function(a){ if (a === D.k) return D.w0[a]; var v = D.w0[a] + q[a] - D.h0[a], st = S.snap; return st ? Math.round(v/st)*st : v; });
      p.v = clone(D.v0); setCorner(p, D.i, w, D.v0);
      var nw = toWorld(p, p.v[D.i]);
      A.gzLabel('Corner ' + (D.i + 1) + ': ' + [0, 1, 2].filter(function(a){ return a !== D.k; }).map(function(a){ return 'xyz'[a] + ' ' + A.fmtLen(nw[a]); }).join(', ') + ' (turn the view to move it ' + AXW[D.k] + ')', x, y);
    }
  };
  /* the Corners button on the handle bar */
  X.bar.push(function(){ var sel = A.selected(); if (S.gz.mode !== 'shape' || sel.length !== 1 || !editable(sel[0])) return '';
    return '<button class="sm ' + (S.gz.corners ? 'on' : 'alt') + '" data-gz="corners" title="Move its corners one by one">Corners</button>'; });
  X.barTap.corners = function(){ S.gz.corners = !S.gz.corners; A.renderPanel(); };

  /* ---------------------------------------------------------------- the Corners card */
  X.piece.push(function(p){
    if (!editable(p)) return '';
    var h = '<div class="card"><h3>Corners</h3>';
    if (!S.gz.corners) return h + '<p class="muted">Move this piece\'s ' + p.v.length + ' corners one by one: in the view, or by numbers.</p><div class="row"><button class="alt" data-a="crOn">Edit its corners</button></div></div>';
    var k = corner(), w = toWorld(p, p.v[k]), j = partner(p, k);
    h += '<p class="muted">Tap a corner handle in the view, or pick it here. ' + (p.mx || p.mz ? 'The mirrored copy follows. ' : '') + (S.gz.both ? 'Both sides is on: ' + (j >= 0 ? 'corner ' + (j + 1) + ' moves with it.' : Math.abs(w[0]) < TOL ? 'this corner stays on the middle.' : 'this corner has no partner across the middle.') : 'Turn on Both sides to move a matching corner across the middle with it.') + '</p>';
    h += '<div class="row"><label class="l">Corner</label><select class="grow" data-k="crPick" aria-label="Corner">' + p.v.map(function(_, i){ return '<option value="' + i + '"' + (i === k ? ' selected' : '') + '>Corner ' + (i + 1) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="trio">' + ['x', 'y', 'z'].map(function(a, i){ return A.num('corner ' + a, w[i], 'len', function(v){ A.edit(function(q){ var nw = toWorld(q, q.v[k]); nw[i] = v; setCorner(q, k, nw); }, true); }, {ax:a}); }).join('') + '</div>';
    h += '<div class="row">' + (p.s === 'decal' ? '<button class="alt sm" data-a="crAdd">Add a corner after this one</button>' + (p.v.length > 3 ? '<button class="alt sm" data-a="crDel">Remove this corner</button>' : '') : '') +
      '<button class="alt sm" data-a="crOff">Done</button></div>';
    return h + '</div>';
  });
  var AC = A.ACTIONS;
  AC.crOn = function(){ S.gz.corners = true; S.gz.mode = 'shape'; S.cornerIdx = 0; A.renderPanel(); A.gzDraw(); };
  AC.crOff = function(){ S.gz.corners = false; A.renderPanel(); A.gzDraw(); };
  AC.crAdd = function(){ var k = corner(); A.edit(function(q){ if (q.s !== 'decal') return; var a = q.v[k], b = q.v[(k + 1) % q.v.length]; q.v.splice(k + 1, 0, [r4((a[0] + b[0])/2), r4((a[1] + b[1])/2), r4((a[2] + b[2])/2)]); }, true); S.cornerIdx = k + 1; A.renderPanel(); };
  AC.crDel = function(){ var k = corner(); A.edit(function(q){ if (q.s !== 'decal' || q.v.length <= 3) return; q.v.splice(k, 1); refacePlate(q); }, true); S.cornerIdx = Math.max(0, k - 1); A.renderPanel(); };
  A.CHANGES.crPick = function(t){ S.cornerIdx = +t.value; A.renderPanel(); A.gzDraw(); };
  A.corners = {toWorld:toWorld, toLocal:toLocal, partner:partner};
});
