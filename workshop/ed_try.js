/* Try it in the game: from the Workshop on its own page, straight into the game's Test World with the design built at the
   free station that makes it (car shop, boathouse, hangar, workbench or wardrobe), so you can drive it, sail it, hold it or wear it.
   The protocol is in workshop/stations.js (ST.tryHandoff, ST.tryURL); the game's side reads it from localStorage.
   Loaded before app.js; it plugs in through window.WSX. MIT licence. */
(window.WSX = window.WSX || []).push(function(A){
  var S = A.S, X = A.X, M = A.M, esc = A.esc, ST = window.AFTERSTREET_STATIONS;
  if (!ST || !ST.tryHandoff) return;
  function inFrame(){ try { return window.parent && window.parent !== window; } catch (e){ return true; } }
  function where(){ var k = ST.forDoc(S.doc); return k && ST[k] ? k : null; }
  function card(){
    if (!S.doc || inFrame() || A.STATION) return '';
    var k = where(); if (!k) return '';
    return '<div class="card"><h3>Try it in the game</h3><p class="muted">Opens the game\'s Test World with this design built at the ' + esc(ST[k].label.toLowerCase()) + ' by the spawn, free, so you can ' +
      ({carshop:'drive it', hangar:'fly it', dock:'take it out on the lake', workbench:'hold and use it', wardrobe:'wear it'})[k] + '. Your work here is kept: come back with the Workshop button.</p>' +
      '<div class="row"><button data-a="tryGame">Try it in the game</button></div></div>';
  }
  X.check.push(card);
  A.ACTIONS.tryGame = function(){
    var k = where(); if (!k) return A.toast('The game has no station that makes this yet.');
    A.saveDraft();
    var As, C = [];
    try { As = A.isModel() ? M.buildModelAsset(S.doc) : A.asset(); C = A.isModel() ? M.checkModel(S.doc, As) : M.check(S.doc, As); } catch (e){ return A.toast('Could not build it: ' + e.message); }
    var bad = C.filter(function(c){ return c[0] === 'bad'; }), fit = ST.fits(k, As.size || null);
    if (bad.length || !fit.ok) return A.modal('<h2>Not ready to try</h2><p>Fix these first (the Check tab says how):</p>' + bad.map(function(c){ return '<div class="msg bad">' + esc(c[1]) + '</div>'; }).join('') +
      (fit.ok ? '' : '<div class="msg bad">Too ' + esc(fit.why.join(' and ')) + ' for the ' + esc(ST[k].label.toLowerCase()) + '.</div>') + '<div class="row" style="justify-content:flex-end"><button class="alt" data-a="close">Back to work</button></div>');
    var pk = M.newPack({id:'try-' + String(S.doc.id || 'design').replace(/[^\w-]+/g, '-').replace(/_/g, '-'), name:S.doc.name, author:S.doc.author || ''}); pk.version = 2; pk.assets.push(M.slimAsset ? M.slimAsset(As) : As);
    var msg = ST.tryHandoff({station:k, name:S.doc.name, id:S.doc.id, kind:S.doc.type === 'model' ? S.doc.kind : 'vehicle', domain:M.domainOf ? M.domainOf(S.doc) : null, size:As.size || null, cost:{}, pack:pk});
    try { localStorage.setItem(ST.KEY, JSON.stringify(msg)); } catch (e){ return A.toast('Could not hand it to the game (storage full): export a pack instead.'); }
    A.toast('Opening the Test World…');
    setTimeout(function(){ location.href = ST.tryURL(); }, 500);
  };
});
