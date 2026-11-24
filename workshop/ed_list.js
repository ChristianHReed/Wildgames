/* The piece list: every piece of the design, grouped by part or by job, to find, select, and hide in the view.
   A design with a cabin has a hundred pieces or more, many of them inside others; the list is how you reach them
   (Blender's outliner, Tinkercad's and Shapr3D's parts lists). Hiding here is for the view only: the game still draws them.
   Opens from Pieces on the toolbar. Loaded before app.js; it plugs in through window.WSX. MIT licence. */
(window.WSX = window.WSX || []).push(function(A){
  var S = A.S, X = A.X, M = A.M, esc = A.esc;
  var SHAPE = {box:'Block', bev:'Soft block', wedge:'Slope', cyl:'Cylinder', decal:'Plate', poly:'Shaped piece', loft:'Tube'};
  var PART = {body:'Body', bonnet:'Bonnet', boot:'Boot', wheel:'Wheel', part:'Moving parts', leaves:'Leaves'};
  var LIMIT = 60;
  S.viewHide = S.viewHide || {}; S.list = {open:false, by:'part', q:'', more:{}, several:false};
  function label(p){ return p.name || SHAPE[p.s] || p.s; }
  function jobOf(p){ return p.fn && M.FUNCTIONS[p.fn] ? M.FUNCTIONS[p.fn].label : ''; }
  function groupOf(p){
    if (S.list.by === 'job') return p.fn ? jobOf(p) || p.fn : p.hidden ? 'Inside parts' : 'No job';
    if (S.list.by === 'shape') return SHAPE[p.s] || p.s;
    return PART[p.g] || String(p.g || 'body').replace(/_/g, ' ');
  }
  function hay(p){ return (label(p) + ' ' + jobOf(p) + ' ' + (SHAPE[p.s] || '') + ' ' + (p.c || '') + ' ' + (p.m || '') + ' ' + p.id).toLowerCase(); }
  function card(){
    if (!S.list.open || !S.doc) return '';
    if (S.viewHideDoc !== S.doc.id){ S.viewHide = {}; S.viewHideDoc = S.doc.id; }
    var L = A.ownerList(), sel = {}, groups = {}, order = [], hid = 0;
    S.sel.forEach(function(i){ sel[i] = 1; });
    L.forEach(function(p){ var g = groupOf(p); if (!groups[g]){ groups[g] = []; order.push(g); } groups[g].push(p); if (S.viewHide[p.id]) hid++; });
    var h = '<div class="card plist"><h3>Pieces (' + L.length + ')</h3>' +
      '<div class="row"><input class="grow" type="search" data-k="plSearch" placeholder="Find by name, job, shape or colour" value="' + esc(S.list.q) + '" aria-label="Find a piece"></div>' +
      '<div class="row"><label class="l">Group by</label><select class="grow" data-k="plBy" aria-label="Group by">' + [['part', 'Part'], ['job', 'Job'], ['shape', 'Shape']].map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === S.list.by ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><label><input type="checkbox" data-k="plSeveral"' + (S.list.several ? ' checked' : '') + '>Tap to add to the selection</label>' + (hid ? '<button class="alt sm" data-a="plShowAll">Show all ' + hid + ' hidden</button>' : '') + '</div>';
    order.forEach(function(g){
      var list = groups[g], allHid = list.every(function(p){ return S.viewHide[p.id]; }), more = S.list.more[g], shown = more ? list : list.slice(0, LIMIT);
      h += '<details class="plg" open><summary><span>' + esc(g) + ' (' + list.length + ')</span>' +
        '<button class="alt sm" data-a="plPickGroup" data-g="' + esc(g) + '">Select</button><button class="alt sm" data-a="plEyeGroup" data-g="' + esc(g) + '" aria-label="' + (allHid ? 'Show' : 'Hide') + ' ' + esc(g) + '">' + (allHid ? 'Show' : 'Hide') + '</button></summary>';
      shown.forEach(function(p){ var hd = !!S.viewHide[p.id];
        h += '<div class="plr' + (sel[p.id] ? ' on' : '') + (hd ? ' off' : '') + '" data-q="' + esc(hay(p)) + '"><button class="plb" data-a="plPick" data-id="' + esc(p.id) + '"><span>' + esc(label(p)) + '</span>' +
          '<small>' + esc([S.list.by === 'job' ? '' : jobOf(p), p.hidden ? 'inside' : '', p.mx || p.mz ? 'mirrored' : '', p.kit ? 'made' : ''].filter(Boolean).join(' · ')) + '</small></button>' +
          '<button class="alt sm ple" data-a="plEye" data-id="' + esc(p.id) + '" aria-label="' + (hd ? 'Show ' : 'Hide ') + esc(label(p)) + ' in the view" title="' + (hd ? 'Show in the view' : 'Hide in the view') + '">' + (hd ? 'Show' : 'Hide') + '</button></div>'; });
      if (list.length > shown.length) h += '<div class="row"><button class="alt sm" data-a="plMore" data-g="' + esc(g) + '">Show the other ' + (list.length - shown.length) + '</button></div>';
      h += '</details>';
    });
    return h + '<p class="muted">Hide is for this view only: the game still draws the piece.</p></div>';
  }
  X.top.push(card);
  X.tools.push({group:'Find', items:function(){ return S.doc ? [{key:'plist', label:'Pieces', title:'The list of every piece: find, select, hide in the view', on:S.list.open,
    icon:'<svg viewBox="0 0 30 24"><path d="M5 5h20M5 12h20M5 19h20" stroke="#3d3029" stroke-width="2.2" stroke-linecap="round"/></svg>'}] : []; }});
  X.toolTap.plist = function(){ S.list.open = !S.list.open; if (S.list.open) S.tab = 'piece'; A.refresh(); };
  function filter(){ var q = S.list.q.toLowerCase().trim(); [].forEach.call(document.querySelectorAll('.plist .plr'), function(r){ r.style.display = !q || r.dataset.q.indexOf(q) >= 0 ? '' : 'none'; }); }
  var AC = A.ACTIONS, CH = A.CHANGES;
  AC.plPick = function(b){ var id = b.dataset.id; if (S.list.several){ var i = S.sel.indexOf(id); if (i >= 0) S.sel.splice(i, 1); else S.sel.push(id); } else S.sel = [id]; A.refresh(); filter(); };
  AC.plPickGroup = function(b){ var g = b.dataset.g; S.sel = A.ownerList().filter(function(p){ return groupOf(p) === g && !S.viewHide[p.id]; }).map(function(p){ return p.id; }); A.refresh(); filter(); };
  AC.plEye = function(b){ var id = b.dataset.id; S.viewHideDoc = S.doc.id; if (S.viewHide[id]) delete S.viewHide[id]; else { S.viewHide[id] = 1; S.sel = S.sel.filter(function(i){ return i !== id; }); } A.rebuildScene(); A.refresh(); filter(); };
  AC.plEyeGroup = function(b){ S.viewHideDoc = S.doc.id; var g = b.dataset.g, list = A.ownerList().filter(function(p){ return groupOf(p) === g; }), all = list.every(function(p){ return S.viewHide[p.id]; });
    list.forEach(function(p){ if (all) delete S.viewHide[p.id]; else S.viewHide[p.id] = 1; }); if (!all) S.sel = S.sel.filter(function(i){ return !S.viewHide[i]; }); A.rebuildScene(); A.refresh(); filter(); };
  AC.plShowAll = function(){ S.viewHide = {}; A.rebuildScene(); A.refresh(); filter(); };
  AC.plMore = function(b){ S.list.more[b.dataset.g] = true; A.renderPanel(); filter(); };
  CH.plBy = function(t){ S.list.by = t.value; A.renderPanel(); filter(); };
  CH.plSeveral = function(t){ S.list.several = t.checked; };
  CH.plSearch = function(t){ S.list.q = t.value; filter(); };
  document.addEventListener('input', function(e){ var t = e.target; if (t && t.dataset && t.dataset.k === 'plSearch'){ S.list.q = t.value; filter(); } });
  var st = document.createElement('style');
  st.textContent = '.plist details{margin:6px 0;border-top:1px solid var(--edge,#d9c9ad)}.plist summary{display:flex;align-items:center;gap:6px;min-height:44px;cursor:pointer;font-weight:700}.plist summary span{flex:1}' +
    '.plr{display:flex;gap:6px;align-items:stretch;margin:3px 0}.plr .plb{flex:1;display:flex;flex-direction:column;align-items:flex-start;text-align:left;min-height:44px;background:var(--paper2,#f6efe2);color:var(--ink,#2a241e);box-shadow:none;border:1px solid var(--edge,#d9c9ad);font-weight:600}' +
    '.plr .plb small{font-weight:400;opacity:.7;font-size:11px}.plr.on .plb{background:var(--sage,#6f8f5a);color:#fff;border-color:transparent}.plr.off .plb{opacity:.5}.plr .ple{min-width:60px;min-height:44px}';
  document.head.appendChild(st);
});
