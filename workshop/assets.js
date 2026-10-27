/* AfterStreet Workshop: every asset type (W1), importing the game's models (W3) and points (W6).
   Needs model.js (WSM) loaded first; runs in the browser and in Node.

   A "model" design is any shaped model of the game, opened as editable pieces:
     doc = {format:'afterstreet-workshop', v:2, type:'model', id, name, author, licence, notes, kind,
            target:{pack, group, name},        where the finished model goes in SHAPED (SHAPED[pack].models[group][name])
            layout,                            the model's own nesting, with each piece list replaced by {"$part": "<name>"}
            parts:{name:{...}},                the part names, in order (a part is one piece list: body, bonnet, closed, searched, ...)
            pieces:[editor pieces, each with g = its part name],
            points:[{name, kind, pos:[x,y,z], dir:[x,y,z]}],    named anchors (grip, seat, hinge, socket, light, ...)
            extra:{key: value},                the pack's own tables for this model (info, moving, grip, spec ...), copied as they are
            colours:{x7a2a24: '#7a2a24', ...}, paint (optional)}
   exportModel(doc) gives back the nested value; opening a stock model and exporting it unchanged returns the same pieces
   (tools/roundtrip.js checks every model of every pack). */
(function(root){
  var M = (typeof module !== 'undefined' && module.exports) ? require('./model.js') : root.WSM;
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function isPiece(q){ return q && typeof q === 'object' && !Array.isArray(q) && typeof q.s === 'string' && Array.isArray(q.p); }
  function isPieceList(a){ return Array.isArray(a) && a.length > 0 && a.every(isPiece); }

  /* ------------------------------------------------------------------ what kinds of assets there are and which pack tables they live in */
  /* kind: how the Workshop treats it (setup panel, points and checks). Every pack group maps to one. */
  M.KINDS = {
    vehicle:   {label:'Vehicle',            points:['seat','hinge','light','smoke','exhaust']},
    machine:   {label:'Machine',            points:['seat','hinge','joint','light','smoke']},
    boat:      {label:'Boat or bike',       points:['seat','grip','pedal','thwart','tiller','saddle','hinge']},
    held:      {label:'Held item',          points:['grip','offhand','muzzle','strike','eject']},
    item:      {label:'Item (on the ground)', points:['grip','label']},
    furniture: {label:'Furniture or prop',  points:['hinge','sit','light','sound','loot','socket']},
    container: {label:'Searchable container', points:['hinge','loot','light']},
    building:  {label:'Building or module', points:['door','window','socket','light','stairs','spawn']},
    structure: {label:'Structure',          points:['socket','light','hinge']},
    plant:     {label:'Plant or tree',      points:['harvest','sway','socket']},
    creature:  {label:'Creature',           points:['eye','mouth','hit','drop']},
    tile:      {label:'Ground tile or decal', points:['socket']},
    effect:    {label:'Effect or sky',      points:['emit']},
    sign:      {label:'Sign or interior fitting', points:['text','light','socket']},
    clothing:  {label:'Clothing or character part', points:['bone','hide']}
  };
  var PACK_KIND = {props:'furniture', interiors:'sign', shopfit:'furniture', services:'furniture', foodservice:'furniture', furniture2:'furniture', autotrade:'furniture', businesses:'furniture',
    bikes:'boat', boats:'boat', machines:'machine', machinedig:'machine', fleet:'vehicle', vehiclekit:'item', held:'held', buildings:'building', walls:'building', civic:'building', roadside:'building',
    structures:'structure', rail:'structure', towers:'structure', barriers:'structure', digging:'furniture', pitworks:'furniture', solar:'furniture', power:'structure', parks:'structure', waterside:'structure',
    flora:'plant', woods:'plant', farm:'plant', animals:'creature', aliens:'creature', ground:'tile', world:'tile', land:'tile', fx:'effect', survivor:'clothing'};
  var GROUP_KIND = {'props.items':'item', 'props.containers':'container', 'props.vehicles':'vehicle', 'props.plants':'plant', 'props.garden':'plant', 'props.doors':'furniture', 'props.build':'furniture'};
  M.kindOf = function(pack, group){ return GROUP_KIND[pack + '.' + group] || PACK_KIND[pack] || 'furniture'; };

  /* ------------------------------------------------------------------ W3: open a stock model */
  /* the pack's own tables that have an entry for this model name (info, moving, grip, stats, vehicleRig ...) */
  function extrasFor(shaped, pack, group, name){
    var P = shaped[pack], out = [], own = Object.prototype.hasOwnProperty;
    for (var k in P){
      if (k === 'models' || k === 'palette' || k === 'stats') continue;
      var v = P[k]; if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
      if (k === 'darker') continue;
      if (own.call(v, name)) out.push({path:[k, name], value:clone(v[name])});
      else if (v[group] && typeof v[group] === 'object' && !Array.isArray(v[group]) && own.call(v[group], name)) out.push({path:[k, group, name], value:clone(v[group][name])});
    }
    return out;
  }
  function splitLayout(value, path, parts, pieces, doc){
    if (isPieceList(value)){
      var part = path.join('.') || 'body';
      parts[part] = {};
      value.forEach(function(np){ var ep = {id:'p' + (++doc._n), g:part, pos:np.p.slice(), rot:[0, (np.ry || 0)*90, 0], scl:[1,1,1], c:np.c, m:M.guessMaterial(np.c), s:np.s};
        ['d','fy','ax','r','n','rot','ang','closed','caps','both','cin','v','f'].forEach(function(k){ if (np[k] !== undefined){ ep[k === 'rot' ? 'lrot' : k] = clone(np[k]); } });
        if (np.glow) ep.glow = true; pieces.push(ep); });
      return {$part:part};
    }
    if (Array.isArray(value)) return clone(value);
    if (value && typeof value === 'object'){ var o = {}; for (var k in value) o[k] = splitLayout(value[k], path.concat(k), parts, pieces, doc); return o; }
    return value;
  }
  /* packs whose groups are whole models (a bike is models.bicycle_city = {body, bars, crank, wheel}); and groups that are one bare piece list (power) */
  M.WHOLE_PACKS = {bikes:1, boats:1, machines:1};
  M.isWholeGroup = function(shaped, pack, group){ var G = shaped[pack] && shaped[pack].models && shaped[pack].models[group]; return !!G && (!!M.WHOLE_PACKS[pack] || isPieceList(G)); };
  /* shaped = window.SHAPED; the model is shaped[pack].models[group][name], or the whole group when name is null */
  M.importModel = function(shaped, pack, group, name){
    var P = shaped[pack], whole = name == null, value = P && P.models && P.models[group] && (whole ? P.models[group] : P.models[group][name]);
    if (value == null) throw new Error('no model ' + pack + '.' + group + (whole ? '' : '.' + name));
    var key = whole ? group : name;
    var doc = {format:'afterstreet-workshop', v:2, type:'model', id:key + '_copy', name:key.replace(/_/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }) + ' (copy)', author:'', licence:'MIT', notes:'',
      kind:M.kindOf(pack, group), target:{pack:pack, group:group, name:whole ? null : name}, from:pack + '.' + group + (whole ? '' : '.' + name), _n:0};
    var parts = {}, pieces = [];
    doc.layout = splitLayout(value, [], parts, pieces, doc);
    doc.parts = parts; doc.pieces = pieces; doc.points = []; doc.colours = {}; doc.states = {};
    doc.extra = extrasFor(shaped, pack, group, whole ? group : name);
    doc.slotColours = M.slotDefaults(shaped, pack, group, whole ? group : name);
    delete doc._n;
    /* a grip point or hinge the pack already records becomes a visible point */
    M.pointsFromExtra(doc);
    return doc;
  };
  function joinLayout(layout, byPart){
    if (layout && typeof layout === 'object' && !Array.isArray(layout)){
      if (layout.$part !== undefined) return byPart[layout.$part] || [];
      var o = {}; for (var k in layout) o[k] = joinLayout(layout[k], byPart); return o;
    }
    return Array.isArray(layout) ? clone(layout) : layout;
  }
  /* the nested model value of a design, in the game's own format */
  M.exportModel = function(doc){
    var byPart = {};
    Object.keys(doc.parts).forEach(function(g){ byPart[g] = []; });
    doc.pieces.forEach(function(ep){ if (!byPart[ep.g]) byPart[ep.g] = []; byPart[ep.g] = byPart[ep.g].concat(M.toNative(ep)); });
    var v = joinLayout(doc.layout, byPart); M.stripM(v); return v;
  };

  /* ------------------------------------------------------------------ W6: points */
  M.POINT_KINDS = {grip:'where the hand holds it', offhand:'the second hand', muzzle:'where a shot leaves', strike:'where a blow lands', eject:'where a case leaves',
    seat:'where someone sits', sit:'where a survivor sits on it', saddle:'bike seat', pedal:'pedal', thwart:'boat seat', tiller:'outboard handle', hinge:'turning point of a door, lid or hatch',
    joint:'a machine joint', light:'a light source', smoke:'where smoke rises', exhaust:'exhaust', sound:'a sound plays here', loot:'a loot slot', socket:'where another piece snaps on',
    door:'a door opening', window:'a window opening', stairs:'a stair run', spawn:'an enemy or item may appear', harvest:'where it is picked', sway:'wind moves from here', eye:'an eye',
    mouth:'a mouth', hit:'a hit zone', drop:'what it drops appears here', emit:'where particles start', text:'a text decal goes here', label:'a label', bone:'a bone attach', hide:'what it hides'};
  M.addPoint = function(doc, name, kind, pos, dir){
    doc.points = doc.points || [];
    var p = {name:name, kind:kind || name, pos:pos.slice(), dir:(dir || [0, 0, 1]).slice()}; doc.points.push(p); return p;
  };
  /* points the pack already keeps in its own tables */
  function extraOf(doc, table){ var r = null; (doc.extra || []).forEach(function(e){ if (e.path[0] === table) r = e; }); return r; }
  M.extraOf = extraOf;
  /* points the pack already keeps in its own tables; each remembers where it came from (src) so a moved point is written back.
     src: {t: table, i: index in a list (or null), f: field of an object (or null)} */
  function vec3(v){ return Array.isArray(v) && v.length === 3 && v.every(function(x){ return typeof x === 'number'; }); }
  function addFrom(doc, name, kind, pos, dir, src){ var p = M.addPoint(doc, name, kind, pos, dir); p.src = src; return p; }
  M.pointsFromExtra = function(doc){
    var T = function(t){ var e = extraOf(doc, t); return e ? e.value : null; };
    var mv = T('moving');
    if (mv) (Array.isArray(mv) ? mv : [mv]).forEach(function(m, i){ if (m && vec3(m.hinge)) addFrom(doc, 'hinge_' + (m.piece || i), 'hinge', m.hinge, m.axis === 'x' ? [1, 0, 0] : m.axis === 'z' ? [0, 0, 1] : [0, 1, 0], {t:'moving', i:Array.isArray(mv) ? i : null, f:'hinge'}); });
    var vr = T('vehicleRig');
    if (vr){ (vr.wheels || []).forEach(function(w, i){ if (vec3(w)) addFrom(doc, 'wheel_' + i, 'socket', w, [1, 0, 0], {t:'vehicleRig', f:'wheels', i:i}); });
      ['bonnetHinge', 'bootHinge', 'doorHinge'].forEach(function(k){ if (vec3(vr[k])) addFrom(doc, k.replace('Hinge', '_hinge'), 'hinge', vr[k], [1, 0, 0], {t:'vehicleRig', f:k}); });
      if (vec3(vr.smokeAt)) addFrom(doc, 'smoke', 'smoke', vr.smokeAt, [0, 1, 0], {t:'vehicleRig', f:'smokeAt'});
      if (vec3(vr.fuelCap)) addFrom(doc, 'fuel_cap', 'socket', vr.fuelCap, [-1, 0, 0], {t:'vehicleRig', f:'fuelCap'}); }
    /* bikes, boats and machines */
    var one = {saddle:'saddle', helm:'tiller'}, many = {grips:'grip', pedals:'pedal', seats:'seat', wheels:'socket'};
    Object.keys(one).forEach(function(t){ var v = T(t); if (vec3(v)) addFrom(doc, t, one[t], v, [0, 1, 0], {t:t}); });
    Object.keys(many).forEach(function(t){ var v = T(t); if (Array.isArray(v)) v.forEach(function(q, i){ if (vec3(q)) addFrom(doc, t.replace(/s$/, '') + '_' + i, many[t], q, t === 'wheels' ? [1, 0, 0] : [0, 1, 0], {t:t, i:i}); }); });
  };
  /* put moved points back into the tables they came from */
  M.writePoints = function(doc, extra){
    (doc.points || []).forEach(function(p){
      var sr = p.src; if (!sr) return; var e = extraOf({extra:extra}, sr.t); if (!e) return;
      var pos = p.pos.slice();
      if (sr.f && sr.i != null){ if (Array.isArray(e.value)) e.value[sr.i][sr.f] = pos; else if (e.value[sr.f]) e.value[sr.f][sr.i] = pos; }
      else if (sr.f){ e.value[sr.f] = pos; }
      else if (sr.i != null){ e.value[sr.i] = pos; }
      else e.value = pos;
    });
  };

  /* ------------------------------------------------------------------ colours: each pack's own palette, shading and colour slots */
  var SLOT_FALLBACK = {BODY:'#8a6a4a', SKIN:'#c99a7a', HAIR:'#4a3426', SHIRT:'#5a6a7a', PANTS:'#3e4a5a', ACC:'#9a3a30', SLEEVE:'#5a6a7a',
    WALL:'#9fb3a6', TRIM:'#e8e0d0', FRAME:'#e8e0d0', ROOF:'#4a4446', INNER:'#d8d0bc', BASE:'#6a6a5a', DETAIL:'#7a7a6a', DETAIL2:'#5a5a4a', WATER:'#3e5a6a', WATER_L:'#5a7a8a', FOAM:'#e8ecec', LAND:'#6a7a4a'};
  /* what the game would fill each colour slot with for this model (a preview; the exported model keeps the slot names) */
  M.slotDefaults = function(shaped, pack, group, key){
    var P = shaped[pack] || {}, out = {}, v;
    if (P.paint){ v = P.paint[key] || P.paint[group]; if (typeof v === 'string') out.BODY = v; else if (v && typeof v === 'object') for (var k in v) if (/^#/.test(v[k])) out[k] = v[k]; }
    if (P.examples){ var ex = P.examples[Object.keys(P.examples)[0]]; for (var k2 in ex) if (out[k2] == null) out[k2] = ex[k2]; }
    if (P.seasons && P.seasons[key] && P.seasons[key].summer) for (var k3 in P.seasons[key].summer) out[k3] = P.seasons[key].summer[k3];
    return out;
  };
  /* the full palette a model design is drawn with: the pack's palette, its slots, then the design's own colours */
  M.modelPalette = function(shaped, doc){
    var P = (doc.target && shaped[doc.target.pack]) || {}, pal = {}, k;
    var base = (shaped.props && shaped.props.palette) || {};
    for (k in base) pal[k] = base[k];
    for (k in (P.palette || {})) pal[k] = P.palette[k];
    for (k in SLOT_FALLBACK) if (pal[k] == null) pal[k] = SLOT_FALLBACK[k];
    for (k in (doc.slotColours || {})) pal[k] = doc.slotColours[k];
    return pal;
  };
  M.modelDarker = function(shaped, doc){ var P = (doc.target && shaped[doc.target.pack]) || {}; return typeof P.darker === 'number' ? P.darker : 0.78; };
  M.SLOT_NAMES = Object.keys(SLOT_FALLBACK);

  /* ------------------------------------------------------------------ W1: the finished asset, and a blank design of any kind */
  M.newModelDoc = function(kind, pack, group, name){
    var K = M.KINDS[kind] || M.KINDS.furniture, nm = name || ('my_' + kind);
    return {format:'afterstreet-workshop', v:2, type:'model', id:nm, name:nm.replace(/_/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }), author:'', licence:'MIT', notes:'', kind:kind,
      target:{pack:pack || 'props', group:group || 'furniture', name:nm}, layout:{$part:'body'}, parts:{body:{}}, pieces:[], points:[], extra:[], colours:{}, states:{}};
  };
  M.countModel = function(value){
    var n = 0; (function walk(o){ if (isPieceList(o)){ if (M.countTris) n += M.countTris(o); } else if (Array.isArray(o)){} else if (o && typeof o === 'object') for (var k in o) walk(o[k]); })(value); return n;
  };
  var CUSTOM = /^x[0-9a-f]{6}$/i;
  /* a pack asset (type 'model'): the value goes to SHAPED[target.pack].models[target.group][target.name] at install */
  M.buildModelAsset = function(doc){
    var value = M.exportModel(doc), pal = {};
    (function walk(o){ if (isPieceList(o)) o.forEach(function(q){ var n = String(q.c).replace(/_D$/, ''); if (CUSTOM.test(n)) pal[n] = '#' + n.slice(1); }); else if (o && typeof o === 'object' && !Array.isArray(o)) for (var k in o) walk(o[k]); })(value);
    var extra = clone(doc.extra || []);
    /* points that came from the pack's tables go back to them */
    M.writePoints(doc, extra);
    var A = {type:'model', id:doc.id, name:doc.name, kind:doc.kind, author:doc.author, notes:doc.notes, target:clone(doc.target), mode:doc.from ? 'replace' : 'add',
      value:value, extra:extra, palette:pal, points:clone(doc.points || []), parts:Object.keys(doc.parts), stats:{total:M.countModel(value)}, source:clone(doc)};
    return A;
  };
  /* generic checks for any model */
  M.checkModel = function(doc, A){
    var out = [];
    if (!doc.pieces.length) out.push(['bad', 'There are no pieces yet.']);
    if (A.stats.total > 4000) out.push(['warn', 'Heavy model: ' + A.stats.total + ' triangles.']);
    var K = M.KINDS[doc.kind] || {points:[]}, have = {}; (doc.points || []).forEach(function(p){ have[p.kind] = 1; });
    if (doc.kind === 'held' && !have.grip) out.push(['warn', 'No grip point: the hand uses the pack\'s common grip (origin of the model).']);
    if (doc.kind === 'container' && !have.hinge) out.push(['info', 'No hinge point: the lid will not open in the game.']);
    if (doc.kind === 'boat' && !have.seat && !have.thwart && !have.saddle) out.push(['warn', 'No seat, saddle or thwart point: nobody can ride it.']);
    return out;
  };
  /* a pack from model designs (version 2 packs may mix vehicles and models) */
  M.addModelToPack = function(pack, doc){ pack.version = 2; var A = M.buildModelAsset(doc); pack.assets.push(A); return A; };


  /* ------------------------------------------------------------------ the game's own packs, loaded when asked for (browser) */
  M.STOCK_PACKS = ['aliens','animals','autotrade','barriers','bikes','boats','buildings','businesses','civic','digging','farm','fleet','floorplan','flora','foodservice','furniture2','fx','ground','held','interiors','land','machinedig','machines','parks','pitworks','power','props','rail','roadside','services','shopfit','solar','structures','towers','vehiclekit','walls','waterside','woods','world'];
  /* load SHAPED packs by name from base ('assets/shaped/'); cb() when done. Packs that are not there are skipped. */
  M.loadStock = function(names, base, cb){
    var SHp = root.SHAPED || {}, todo = names.filter(function(n){ return !SHp[n]; }), left = todo.length;
    if (!left){ if (cb) cb(); return; }
    todo.forEach(function(n){ var el = document.createElement('script'); el.src = base + n + '.js';
      el.onload = el.onerror = function(){ if (--left === 0 && cb) cb(); }; document.head.appendChild(el); });
  };
  /* what a loaded pack holds: {group: [names]} */
  M.stockIndex = function(pack){
    var P = root.SHAPED && root.SHAPED[pack], out = {}; if (!P || !P.models) return out;
    Object.keys(P.models).forEach(function(g){ out[g] = M.isWholeGroup(root.SHAPED, pack, g) ? null : Object.keys(P.models[g]); }); return out;
  };
  var BLANK = {furniture:['props', 'furniture'], container:['props', 'containers'], item:['props', 'items'], held:['held', 'weapons'], building:['buildings', 'modules'],
    structure:['structures', 'structures'], plant:['flora', 'plants'], tile:['ground', 'tiles'], sign:['interiors', 'signs']};
  M.BLANK_KINDS = Object.keys(BLANK);
  M.blankOfKind = function(kind, name){ var t = BLANK[kind] || BLANK.furniture; return M.newModelDoc(kind, t[0], t[1], name || ('my_' + kind)); };

  /* ------------------------------------------------------------------ the round trip test (also used by tools/roundtrip.js) */
  function norm(o){
    if (Array.isArray(o)) return o.map(norm);
    if (o && typeof o === 'object'){ var r = {}; Object.keys(o).sort().forEach(function(k){ if (k === '_m') return; if (k === 'ry' && (((o[k] % 4) + 4) % 4) === 0) return; if (o[k] === null || o[k] === false) return; if (k === 'n' && o.s === 'decal' && Array.isArray(o[k])){ var l = Math.sqrt(o[k][0]*o[k][0] + o[k][1]*o[k][1] + o[k][2]*o[k][2]) || 1; r[k] = o[k].map(function(t){ return Math.round(t/l*1e3)/1e3; }); return; } r[k] = norm(o[k]); }); return r; }
    return typeof o === 'number' ? Math.round(o*1e4)/1e4 : o;
  }
  M.sameModel = function(a, b){ return JSON.stringify(norm(a)) === JSON.stringify(norm(b)); };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : this);
