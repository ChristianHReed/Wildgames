/* Smooth cages: model a body by moving a few corners and pushing and pulling faces, and see it smoothed (Catmull-Clark
   subdivision, as Blender's Subdivision Surface and Nomad's box modelling). For survivor bodies, clothes and animals:
   start from Smooth cage on the toolbar, or turn a block or a lofted body into one; pull limbs out of its faces; Both sides
   keeps it the same left and right. The game gets the smoothed result as an ordinary shaped piece (workshop/model.js M.subdivide).
   Handles come from workshop/ed_corners.js (Corners on the handle bar). Loaded before app.js; plugs in through window.WSX. MIT licence. */
(window.WSX = window.WSX || []).push(function(A){
  var S = A.S, X = A.X, M = A.M, K = window.WSK || M.kit, esc = A.esc, clone = A.clone, r4 = A.r4;
  if (!K || !K.cageFrom) return;
  A.ICON.cage = '<svg viewBox="0 0 30 24"><path d="M7 6h16v13H7z" fill="none" stroke="#5f8a9a" stroke-width="1.2" stroke-dasharray="2 2"/><ellipse cx="15" cy="12.5" rx="7" ry="5.6" fill="#e9c7a5" stroke="#3d3029" stroke-width="1.3"/></svg>';
  A.renderTools();
  S.cagePull = S.cagePull || 0.15;
  function faces(p, sub){ var n = p.f.length; for (var i = 0; i < sub; i++) n = i === 0 ? p.f.reduce(function(s, f){ return s + f.length; }, 0) : n*4; return n; }
  var CONVERT = {box:1, bev:1, wedge:1, cyl:1, loft:1, poly:1};
  X.piece.push(function(p){
    if (p.s !== 'cage'){
      if (!CONVERT[p.s] || p.g === 'wheel' || p.fn === 'axle') return '';
      return '<div class="card"><h3>Smooth it</h3><p class="muted">Turn this ' + (p.s === 'loft' ? 'tube' : 'piece') + ' into a smooth cage: move its corners and pull faces out to shape a body, a head or an animal, smoothed as you go.</p>' +
        '<div class="row"><button class="alt" data-a="cgMake">Make it a smooth cage</button></div></div>';
    }
    var sub = p.sub == null ? 2 : p.sub, fi = S.cageFace != null && S.cageFace < p.f.length ? S.cageFace : null;
    var h = '<div class="card"><h3>Smooth cage</h3><p class="muted">' + p.v.length + ' corners and ' + p.f.length + ' faces. ' + (S.gz.corners ? 'Drag a corner (yellow) or a face (blue) in the view; Both sides keeps it the same left and right.' : 'Press Corners on the handle bar to shape it in the view.') + '</p>';
    h += '<div class="row"><label class="l">Smoothness</label><select class="grow" data-k="cgSub" aria-label="Smoothness">' + [0, 1, 2, 3].map(function(k){ return '<option value="' + k + '"' + (k === sub ? ' selected' : '') + '>' + ['The cage itself (flat)', 'Smooth', 'Smoother', 'Smoothest'][k] + ' · ' + faces(p, k)*2 + ' triangles</option>'; }).join('') + '</select></div>';
    if (!S.gz.corners) h += '<div class="row"><button class="alt" data-a="crOn">Shape it in the view</button></div>';
    h += '<div class="row"><label class="l">Face</label><select class="grow" data-k="cgFace" aria-label="Face"><option value="">Tap a blue handle, or pick</option>' + p.f.map(function(_, i){ return '<option value="' + i + '"' + (i === fi ? ' selected' : '') + '>Face ' + (i + 1) + '</option>'; }).join('') + '</select></div>';
    if (fi != null){
      h += '<div class="row"><label class="l">Pull out by</label>' + A.num('pull out by', S.cagePull, 'len', function(v){ S.cagePull = Math.max(0.01, v); A.renderPanel(); }, {min:0.01}) + '</div>' +
        '<div class="row"><button class="alt" data-a="cgPull">Pull out a new section</button></div><p class="muted">A new section grows out of face ' + (fi + 1) + (S.gz.both ? ' (and the face across the middle)' : '') + ': do it again for a longer limb, then move its corners.</p>';
    }
    h += '<div class="row"><button class="alt sm" data-a="cgDetail">Add detail to the cage</button></div><p class="muted">Splits every face in four, for finer shaping (' + faces(p, 1) + ' faces after).</p>';
    return h + '</div>';
  });
  var AC = A.ACTIONS, CH = A.CHANGES;
  AC.cgMake = function(){ var p = A.selected()[0]; if (!p) return; var c = K.cageFrom(p); if (!c) return A.toast('This piece cannot become a cage.');
    A.commit(); var L = A.ownerList(), i = L.indexOf(p); if (i < 0) return; L[i] = c; S.gz.corners = true; S.gz.mode = 'shape'; S.cageFace = null; A.changed(true); A.toast('Now a smooth cage: drag its corners and faces.'); };
  AC.cgPull = function(){ var fi = S.cageFace; A.edit(function(q){ if (q.s !== 'cage' || fi == null || !q.f[fi]) return;
      var j = S.gz.both && A.cageFaces ? A.cageFaces.partner(q, fi) : -1;
      K.extrudeFace(q.v, q.f, fi, S.cagePull); if (j >= 0) K.extrudeFace(q.v, q.f, j, S.cagePull); }, true); A.renderPanel(); };
  AC.cgDetail = function(){ A.edit(function(q){ if (q.s !== 'cage') return; var sd = M.subdivide(q.v, q.f, 1); q.v = sd.v; q.f = sd.f; }, true); S.cageFace = null; A.renderPanel(); };
  CH.cgSub = function(t){ var k = +t.value; A.edit(function(q){ if (q.s === 'cage') q.sub = k; }, true); };
  CH.cgFace = function(t){ S.cageFace = t.value === '' ? null : +t.value; A.renderPanel(); A.gzDraw(); };
});
