/* The look check: one sheet with the design from the front, the left side, the top and three-quarters, from the driver's eye
   (vehicles with a cabin), and at the size it shows in the game's lists (64 px). Made from the Check tab, or by
   workshop/tools/render.js for any chat (designs, saved Workshop files, shipped models) without opening the editor by hand.
   Gaps, floating bits, glass you cannot see through and a look that does not read small all show at a glance.
   Loaded before app.js; it plugs in through window.WSX. MIT licence. */
(window.WSX = window.WSX || []).push(function(A){
  var S = A.S, X = A.X, M = A.M, esc = A.esc;
  var HIDE = ['gz', 'gzl', 'sel', 'selLines', 'grid', 'ghost', 'pts', 'bones', 'planes', 'person', 'fx'];
  var TW = 400, TH = 300, HEAD = 44;
  /* the design's box: everything drawn (wheels sit at their hubs: the ground is the bottom of a land vehicle) */
  function bounds(){
    var all = []; S.doc.pieces.forEach(function(p){ if (!p.hidden && p.g !== 'wheel' && !(p.fn === 'room' || p.fn === 'hull')) all = all.concat(M.toNativeAlways(p)); });
    var B = M.boundsOf(all); if (!B.ok) return {mn:[-1, 0, -1], mx:[1, 1, 1]};
    if (S.doc.type === 'vehicle' && (S.doc.domain || 'land') === 'land') B.mn[1] = Math.min(B.mn[1], 0);
    return B;
  }
  /* the driver's eye: the cabin.eye point, else just above the first seat looking forward */
  function eyePoint(){
    var pt = (S.doc.points || []).filter(function(p){ return p.name === 'cabin.eye' || p.kind === 'eye'; })[0];
    if (pt) return {pos:pt.pos, dir:pt.dir || [0, 0, 1]};
    var seat = S.doc.pieces.filter(function(p){ return p.fn === 'seat'; })[0];
    if (seat && S.doc.type === 'vehicle') return {pos:[seat.pos[0], seat.pos[1] + 0.68, seat.pos[2] - 0.05], dir:[0, -0.08, 1]};
    return null;
  }
  function draw(ctx, cv, x, y, w, h){   /* the whole view, letterboxed into the tile */
    var k = Math.min(w/cv.width, h/cv.height), dw = cv.width*k, dh = cv.height*k;
    ctx.drawImage(cv, x + (w - dw)/2, y + (h - dh)/2, dw, dh);
  }
  /* the sheet as a PNG data URL */
  A.lookSheet = function(){
    var view = A.view; if (!view || !S.doc) return null;
    var cam0 = JSON.parse(JSON.stringify(view.cam)), B = bounds(), eye = eyePoint();
    HIDE.forEach(function(n){ view.opt(n, {hidden:true}); });
    var tiles = [['Front', 0, 0.03], ['Left side', Math.PI/2, 0.03], ['Top', 0, 1.55], ['Three-quarters', 0.75, 0.32]];
    var cols = 3, rows = 2, sheet = document.createElement('canvas'); sheet.width = cols*TW; sheet.height = rows*TH + HEAD;
    var ctx = sheet.getContext('2d'), bg = view.bg.map(function(v){ return Math.round(v*255); });
    ctx.fillStyle = 'rgb(' + bg.join(',') + ')'; ctx.fillRect(0, 0, sheet.width, sheet.height);
    function label(t, x, y){ ctx.font = '600 15px system-ui, sans-serif'; var w = ctx.measureText(t).width + 14; ctx.fillStyle = 'rgba(42,36,30,0.82)'; ctx.fillRect(x + 8, y + 8, w, 24); ctx.fillStyle = '#fbf6ec'; ctx.fillText(t, x + 15, y + 25); }
    var slot = 0;
    function at(i){ return [(i % cols)*TW, HEAD + Math.floor(i/cols)*TH]; }
    tiles.forEach(function(t){ view.cam.yaw = t[1]; view.cam.pitch = t[2]; view.frame(B.mn, B.mx, true); view.render(); var p = at(slot++); draw(ctx, view.canvas, p[0], p[1], TW, TH); label(t[0], p[0], p[1]); });
    if (eye){
      var d = eye.dir, l = Math.hypot(d[0], d[1], d[2]) || 1, f = [d[0]/l, d[1]/l, d[2]/l], dist = 0.25;
      view.cam.pitch = Math.asin(-f[1]); view.cam.yaw = Math.atan2(-f[0], -f[2]); view.cam.dist = dist; view.cam.target = [eye.pos[0] + f[0]*dist, eye.pos[1] + f[1]*dist, eye.pos[2] + f[2]*dist];
      var fov = view.cam.fov; view.cam.fov = 70; view.render(); view.cam.fov = fov;
      var pe = at(slot++); draw(ctx, view.canvas, pe[0], pe[1], TW, TH); label('Driver\'s eye', pe[0], pe[1]);
    }
    /* the size it shows in lists: 64 px, then the same pixels four times bigger */
    view.cam.yaw = 0.75; view.cam.pitch = 0.32; view.frame(B.mn, B.mx, true); view.cam.dist *= 0.8; view.render();   /* closer: a box shows smaller than the ball round it */
    var small = document.createElement('canvas'); small.width = small.height = 64; var sc = small.getContext('2d');
    sc.fillStyle = ctx.fillStyle = 'rgb(' + bg.join(',') + ')'; sc.fillRect(0, 0, 64, 64);
    var side = Math.min(view.canvas.width, view.canvas.height); sc.drawImage(view.canvas, (view.canvas.width - side)/2, (view.canvas.height - side)/2, side, side, 0, 0, 64, 64);
    var ps = at(slot++); ctx.drawImage(small, ps[0] + 24, ps[1] + 60); ctx.imageSmoothingEnabled = false; ctx.drawImage(small, ps[0] + 112, ps[1] + 40, 256, 256); ctx.imageSmoothingEnabled = true;
    label('64 px (and 4 times bigger)', ps[0], ps[1]);
    /* the heading: name and size */
    var As = A.asset(), sz = [B.mx[0] - B.mn[0], B.mx[1] - B.mn[1], B.mx[2] - B.mn[2]];
    ctx.fillStyle = '#2a241e'; ctx.font = '700 19px system-ui, sans-serif'; ctx.fillText(S.doc.name || S.doc.id || 'Design', 14, 29);
    ctx.font = '400 14px system-ui, sans-serif'; ctx.fillStyle = '#5a5046';
    ctx.fillText(A.fmtLen(sz[2]) + ' long · ' + A.fmtLen(sz[0]) + ' wide · ' + A.fmtLen(sz[1]) + ' tall · ' + (As && As.stats ? As.stats.total + ' triangles' : '') + ' · ' + new Date().toISOString().slice(0, 10), 280, 29);
    /* put the view back as it was */
    Object.keys(cam0).forEach(function(k){ view.cam[k] = cam0[k]; });
    HIDE.forEach(function(n){ view.opt(n, {hidden:false}); });
    A.rebuildScene(); A.gzDraw(); view.dirty();
    return sheet.toDataURL('image/png');
  };
  function card(){
    return '<div class="card"><h3>Look check</h3><p class="muted">The design from the front, the side, the top and three-quarters' + (eyePoint() ? ', from the driver\'s eye' : '') +
      ' and at the size the game shows it in lists, on one sheet: gaps, floating bits and glass you cannot see through all show at a glance.</p><div class="row"><button class="alt" data-a="lookSheet">Make the look sheet</button></div></div>';
  }
  X.check.push(card);
  A.ACTIONS.lookSheet = function(){
    var url; try { url = A.lookSheet(); } catch (e){ console.error(e); return A.toast('Could not make the sheet: ' + e.message); }
    if (!url) return A.toast('Open a design first.');
    var name = (S.doc.id || 'design') + '_look.png';
    A.modal('<h2>Look sheet</h2><img src="' + url + '" alt="The design from six views" style="width:100%;height:auto;border:1px solid var(--edge);border-radius:4px">' +
      '<div class="row"><a class="btnlink" href="' + url + '" download="' + esc(name) + '"><button>Save the picture</button></a><button class="alt" data-a="close">Close</button></div>');
  };
});
