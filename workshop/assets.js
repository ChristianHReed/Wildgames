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
        if (np.glow) ep.glow = true; var kp = M.keepOf(np); if (kp) ep.keep = kp; pieces.push(ep); });
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
    if (!whole) M.importStates(shaped, doc);
    if (doc.kind === 'held' && group === 'weapons'){ doc.design = M.defaultDesign(doc); var TH = shaped[pack].twoHanded; if (Array.isArray(TH) && TH.indexOf(name) >= 0) doc.design.twoHanded = true; }
    if (doc.kind === 'item') doc.item = M.defaultItem(doc);
    var rg = extraOf(doc, 'rig'), cl = extraOf(doc, 'clips');
    if (rg && rg.value && typeof rg.value === 'object' && !Array.isArray(rg.value)) doc.rig = clone(rg.value);
    if (cl && cl.value && typeof cl.value === 'object' && !Array.isArray(cl.value)) doc.clips = clone(cl.value);
    delete doc._n;
    /* a grip point or hinge the pack already records becomes a visible point */
    M.pointsFromExtra(doc);
    return doc;
  };
  function joinLayout(layout, byPart){
    if (layout && typeof layout === 'object' && !Array.isArray(layout)){
      if (layout.$part !== undefined) return byPart[layout.$part] || [];
      if (layout.$parts !== undefined){ var all = []; layout.$parts.forEach(function(n){ all = all.concat(byPart[n] || []); }); return all; }
      var o = {}; for (var k in layout) o[k] = joinLayout(layout[k], byPart); return o;
    }
    return Array.isArray(layout) ? clone(layout) : layout;
  }
  /* the nested model value of a design, in the game's own format */
  M.exportModel = function(doc){
    var byPart = {};
    /* a skeletal design saves every bone that has pieces, including bones that had none when it was opened */
    if (doc.target && doc.target.path && doc.layout && typeof doc.layout === 'object' && doc.layout.$part === undefined && !doc.layout.$parts)
      doc.pieces.forEach(function(ep){ if (!doc.layout[ep.g]) doc.layout[ep.g] = {$part:ep.g}; });
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
    if (P.slots) for (var ks in P.slots){ var sv = P.slots[ks]; if (Array.isArray(sv) && /^#/.test(sv[0]) && out[ks] == null) out[ks] = sv[Math.min(1, sv.length - 1)]; }
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

  /* ------------------------------------------------------------------ W2: moving parts
     doc.rig is the packs' own rig format (bikes, boats, machines), for any model:
       {part: {parent, pivot:[x,y,z], turn:[ax,ay,az] (axis, degrees) or slide:[ax,ay,az] (metres), range:[lo, hi], rest, note}}
     doc.clips: {name: [{t: seconds, part: value, ...}, ...]} (the bikes' and boats' clip format: keys in time, values per part)
     Pivots are in the model's rest pose; a child part is carried by its parent. */
  M.addPart = function(doc, n){
    doc.parts[n] = {};
    var L = doc.layout;
    if (L && L.$part !== undefined) doc.layout = {$parts:[L.$part, n]};          /* a single-list model stays one list: the new part is joined in */
    else if (L && L.$parts) L.$parts.push(n);
    else if (L && typeof L === 'object') L[n] = {$part:n};
    else doc.layout = {$part:n};
  };
  M.removePart = function(doc, n){
    delete doc.parts[n];
    (function strip(o){ if (o && typeof o === 'object' && !Array.isArray(o)){ if (o.$parts) o.$parts = o.$parts.filter(function(x){ return x !== n; }); for (var k in o){ if (o[k] && o[k].$part === n) delete o[k]; else strip(o[k]); } } })(doc.layout);
    if (doc.rig){ delete doc.rig[n]; for (var k in doc.rig) if (doc.rig[k].parent === n) doc.rig[k].parent = doc.rig[n] ? doc.rig[n].parent : undefined; }
  };
  function rotAxis(v, ax, deg){
    var a = deg*Math.PI/180, l = Math.hypot(ax[0], ax[1], ax[2]) || 1, x = ax[0]/l, y = ax[1]/l, z = ax[2]/l, c = Math.cos(a), sn = Math.sin(a), t = 1 - c;
    return [(t*x*x + c)*v[0] + (t*x*y - sn*z)*v[1] + (t*x*z + sn*y)*v[2],
            (t*x*y + sn*z)*v[0] + (t*y*y + c)*v[1] + (t*y*z - sn*x)*v[2],
            (t*x*z - sn*y)*v[0] + (t*y*z + sn*x)*v[1] + (t*z*z + c)*v[2]];
  }
  M.rotAxis = rotAxis;
  /* a function moving a point (and a normal) of 'part' to where the pose puts it; pose = {part: value} (degrees or metres) */
  M.poseFn = function(doc, part, pose){
    var R = doc.rig || {}, chain = [], p = part, guard = 0;
    while (p && R[p] && guard++ < 32){ chain.push(p); p = R[p].parent; }
    if (!chain.length) return null;
    var any = chain.some(function(q){ var v = pose && pose[q] != null ? pose[q] : (R[q].rest || 0); return Math.abs(v) > 1e-9; });
    if (!any) return null;
    return function(x, n){
      var q = x.slice(), nn = n ? n.slice() : null;
      chain.forEach(function(k){
        var j = R[k], v = pose && pose[k] != null ? pose[k] : (j.rest || 0), pv = j.pivot || [0, 0, 0];
        if (!v) return;
        if (j.slide){ var sl = j.slide, l = Math.hypot(sl[0], sl[1], sl[2]) || 1; q = [q[0] + sl[0]/l*v, q[1] + sl[1]/l*v, q[2] + sl[2]/l*v]; return; }
        if (!j.turn) return;
        var r = rotAxis([q[0]-pv[0], q[1]-pv[1], q[2]-pv[2]], j.turn, v); q = [r[0]+pv[0], r[1]+pv[1], r[2]+pv[2]];
        if (nn) nn = rotAxis(nn, j.turn, v);
      });
      return [q, nn];
    };
  };
  /* the pose a clip gives at time t (keys interpolate in a straight line; the clip loops) */
  M.clipPose = function(doc, name, t){
    var C = doc.clips && doc.clips[name]; if (!C || !C.length) return {};
    var end = C[C.length - 1].t || 1, tt = end > 0 ? t % end : 0, a = C[0], b = C[C.length - 1];
    for (var i = 0; i < C.length - 1; i++) if (tt >= C[i].t && tt <= C[i+1].t){ a = C[i]; b = C[i+1]; break; }
    var f = b.t > a.t ? (tt - a.t)/(b.t - a.t) : 0, out = {};
    Object.keys(a).concat(Object.keys(b)).forEach(function(k){ if (k === 't') return; var va = a[k] != null ? a[k] : (b[k] || 0), vb = b[k] != null ? b[k] : va; out[k] = va + (vb - va)*f; });
    return out;
  };
  /* a new joint for a part: turns about its own middle, about Y, a quarter turn each way */
  M.addJoint = function(doc, part, kind){
    doc.rig = doc.rig || {};
    var B = M.boundsOf([].concat.apply([], doc.pieces.filter(function(p){ return p.g === part; }).map(function(p){ return M.toNative(p); })));
    var c = B.ok ? [(B.mn[0]+B.mx[0])/2, (B.mn[1]+B.mx[1])/2, (B.mn[2]+B.mx[2])/2].map(function(v){ return Math.round(v*1e4)/1e4; }) : [0, 0, 0];
    var first = Object.keys(doc.parts).filter(function(n){ return n !== part; })[0];
    var j = {parent:first, pivot:c, rest:0};
    if (kind === 'slide'){ j.slide = [0, 0, 1]; j.range = [0, 0.4]; } else { j.turn = [0, 1, 0]; j.range = [-90, 90]; }
    if (!first) delete j.parent;
    doc.rig[part] = j;
    return j;
  };
  /* parts drawn at several points: a bike's or machine's single wheel model at each wheel point */
  M.instancesOf = function(doc, part){
    if (part !== 'wheel' && part !== 'wheels') return null;
    var at = (doc.points || []).filter(function(p){ return /^wheel_\d+$/.test(p.name); });
    return at.length ? at : null;
  };
  /* rig and clips into the asset: back into the pack's own tables where it has them, else as the asset's own */
  function writeRig(doc, extra, A){
    var hasRig = extraOf({extra:extra}, 'rig'), hasClips = extraOf({extra:extra}, 'clips');
    var key = doc.target.name == null ? doc.target.group : doc.target.name;
    if (doc.rig && Object.keys(doc.rig).length){
      if (hasRig) hasRig.value = clone(doc.rig);
      else if (doc.target.name == null && M.WHOLE_PACKS[doc.target.pack]) extra.push({path:['rig', key], value:clone(doc.rig)});
      A.rig = clone(doc.rig);
      /* props-style models keep their hinges in the pack's 'moving' table: {piece, hinge, axis} */
      var props = doc.target.pack === 'props' || doc.layout && doc.layout.$parts;
      if (props && !hasRig){
        var mv = [];
        Object.keys(doc.rig).forEach(function(n){ var j = doc.rig[n], t = j.turn; if (!t) return; var ax = Math.abs(t[0]) > 0.9 ? 'x' : Math.abs(t[2]) > 0.9 ? 'z' : 'y'; mv.push({piece:n, hinge:j.pivot.slice(), axis:ax}); });
        if (mv.length){ var m0 = extraOf({extra:extra}, 'moving');
          if (m0){ var old = Array.isArray(m0.value) ? m0.value : [m0.value]; mv.forEach(function(e){ var i = -1; old.forEach(function(o, k){ if (o && o.piece === e.piece) i = k; }); if (i >= 0) old[i] = e; else old.push(e); }); m0.value = old; }
          else extra.push({path:['moving', doc.target.group, key], value:mv}); }
      }
    }
    if (doc.clips && Object.keys(doc.clips).length){
      if (hasClips) hasClips.value = clone(doc.clips);
      else if (doc.target.name == null && M.WHOLE_PACKS[doc.target.pack]) extra.push({path:['clips', key], value:clone(doc.clips)});
      A.clips = clone(doc.clips);
    }
  }
  M.writeRig = writeRig;

  /* ------------------------------------------------------------------ W7: states (variants), sizes, lights, salvage
     A state is a sibling model named <name>_<state> (cupboard_searched, wall_plain_damaged, barricade_nearly_gone, campfire_out).
     It opens with its model as doc.variants[state] = {pieces}, is edited in place, and is saved back under its own name. */
  M.STATES = ['searched','damaged','nearly_gone','broken','snapped','lit','out','off','on','running','dead','open','closed','up','loaded','empty','flat','wrapped','fall','ripe','sprouting','growing','harvested','b','c','d'];
  M.STATE_HINT = {container:['searched'], furniture:['broken','open','lit','off'], building:['damaged','broken'], structure:['damaged','broken'], plant:['fall','ripe','b','c'], item:['flat','empty'], sign:['lit','off']};
  M.siblingStates = function(shaped, pack, group, name){
    var G = shaped[pack] && shaped[pack].models && shaped[pack].models[group]; if (!G || name == null) return [];
    return M.STATES.filter(function(st){ return G[name + '_' + st] !== undefined; });
  };
  function piecesOf(value, part, doc){
    var out = [];
    value.forEach(function(np){ var ep = M.fromNative(np, part, null); ep.id = 'v' + (++doc._vn); out.push(ep); });
    return out;
  }
  /* bring a model's states into the design (each must have the same layout as the model) */
  M.importStates = function(shaped, doc){
    var t = doc.target; if (t.name == null) return;
    var G = shaped[t.pack].models[t.group]; doc._vn = 0; doc.variants = doc.variants || {};
    M.siblingStates(shaped, t.pack, t.group, t.name).forEach(function(st){
      var v = G[t.name + '_' + st], parts = {}, pieces = [];
      var sub = {_n:0}; var lay = (function split(value, path){ if (isPieceList(value)){ var part = path.join('.') || 'body'; parts[part] = 1; pieces = pieces.concat(piecesOf(value, part, doc)); return {$part:part}; }
        if (Array.isArray(value)) return clone(value); if (value && typeof value === 'object'){ var o = {}; for (var k in value) o[k] = split(value[k], path.concat(k)); return o; } return value; })(v, []);
      doc.variants[st] = {layout:lay, pieces:pieces, from:t.pack + '.' + t.group + '.' + t.name + '_' + st};
    });
    delete doc._vn;
  };
  /* a new state starts as a copy of the model as it is now */
  M.addState = function(doc, st){
    doc.variants = doc.variants || {};
    doc.variants[st] = {layout:clone(doc.layout), pieces:doc.pieces.map(function(p){ var q = clone(p); q.id = 'v' + Math.random().toString(36).slice(2, 8); return q; })};
    return doc.variants[st];
  };
  M.exportVariant = function(doc, st){
    var V = doc.variants[st], byPart = {};
    V.pieces.forEach(function(ep){ (byPart[ep.g] = byPart[ep.g] || []).push.apply(byPart[ep.g], M.toNative(ep)); });
    var v = joinLayout(V.layout || doc.layout, byPart); M.stripM(v); return v;
  };
  /* furniture size classes (props furnitureSize: [class, kg]); carry rules come from the class */
  M.SIZE_CLASSES = [['small', 'Small: carried in front at walking speed less 10%'], ['medium', 'Medium: speed less 30%, no running'], ['large', 'Large: speed less 50%, two can carry it']];
  /* the pack tables that measure a model ([w, len, h] in 'sizes'; w, len, h in 'info') */
  M.measureInto = function(doc, extra){
    var all = []; doc.pieces.forEach(function(p){ all = all.concat(M.toNative(p)); });
    var B = M.boundsOf(all); if (!B.ok) return false;
    var r3 = function(v){ return Math.round(v*100)/100; }, w = r3(B.mx[0]-B.mn[0]), len = r3(B.mx[2]-B.mn[2]), h = r3(B.mx[1]);
    var sz = extraOf({extra:extra}, 'sizes'), inf = extraOf({extra:extra}, 'info');
    if (sz && Array.isArray(sz.value) && sz.value.length === 3) sz.value = [w, len, h];
    if (inf && inf.value && typeof inf.value === 'object'){ if ('w' in inf.value) inf.value.w = w; if ('len' in inf.value) inf.value.len = len; if ('h' in inf.value) inf.value.h = h; }
    return {w:w, len:len, h:h};
  };
  /* light points carry a colour and reach; the asset lists them for the game */
  M.lightsOf = function(doc){ return (doc.points || []).filter(function(p){ return p.kind === 'light'; }).map(function(p){ return {name:p.name, pos:p.pos.slice(), dir:(p.dir || [0, -1, 0]).slice(), colour:p.colour || '#ffd9a0', radius:p.radius || 6}; }); };

  /* ------------------------------------------------------------------ W9: held items
     A held model is {new, worn, broken}; its origin is the grip (the survivor's right fist), +Z points out of the fist.
     doc.design is the game's own item design (play.html cleanDesign): kind melee | use | throw, shape 0-3 (Bat, Blade, Hammer, Spear),
     power 1-100, colour, reach (m, 1.5-3.2), spd (0.7-1.4), and the held model's name. */
  M.HELD_SHAPES = ['Bat (swing)', 'Blade (chop)', 'Hammer (heavy)', 'Spear (thrust)'];
  M.defaultDesign = function(doc){ return {kind:'melee', shape:0, power:50, color:'#8f959c', reach:0, spd:1, twoHanded:false}; };
  M.blankHeld = function(name){
    var d = M.newModelDoc('held', 'held', 'weapons', name || 'my_weapon');
    d.layout = {'new':{$part:'new'}, worn:{$part:'worn'}, broken:{$part:'broken'}}; d.parts = {'new':{}, worn:{}, broken:{}};
    d.design = M.defaultDesign(d); return d;
  };
  /* worn and broken made from new: worn is darker with small dents and rust on metal; broken is snapped short and splintered */
  M.makeWorn = function(doc){
    var newP = doc.pieces.filter(function(p){ return p.g === 'new'; });
    doc.pieces = doc.pieces.filter(function(p){ return p.g !== 'worn'; });
    newP.forEach(function(p, i){ var q = clone(p); q.id = M.newId(doc); q.g = 'worn'; var m = q.m || M.guessMaterial(q.c);
      if (m === 'steel' || m === 'sheet' || m === 'chrome') q.c = i % 3 === 0 ? 'rust' : String(q.c).replace(/_D$/, '') + '_D';
      else if (!/_D$/.test(q.c)) q.c = q.c + '_D';
      q.pos = q.pos.map(function(v, k){ return Math.round((v + (k === 1 ? 0 : 0.004*Math.sin(i*7.1 + k*3.3)))*1e4)/1e4; });
      doc.pieces.push(q); });
  };
  M.makeBroken = function(doc){
    var newP = doc.pieces.filter(function(p){ return p.g === 'new'; });
    doc.pieces = doc.pieces.filter(function(p){ return p.g !== 'broken'; });
    var all = []; newP.forEach(function(p){ all = all.concat(M.toNative(p)); }); var B = M.boundsOf(all); if (!B.ok) return;
    var cut = B.mn[2] + (B.mx[2] - B.mn[2])*0.55;   /* the far end snaps off */
    newP.forEach(function(p){
      var b = M.boundsOf(M.toNative(p)); if (!b.ok || b.mn[2] >= cut) return;
      var q = clone(p); q.id = M.newId(doc); q.g = 'broken'; q.c = /_D$/.test(q.c) ? q.c : q.c + '_D';
      if (b.mx[2] > cut && q.d && Math.abs(q.rot[0]) < 1e-6 && Math.abs(q.rot[2]) < 1e-6 && (q.rot[1] % 180) === 0){ var keep = cut - b.mn[2]; q.d = q.d.slice(); q.d[2] = Math.max(0.01, keep); q.pos = q.pos.slice(); q.pos[2] = b.mn[2] + keep/2; }
      else if (b.mx[2] > cut){ var k = (cut - b.mn[2])/(b.mx[2] - b.mn[2]); q.scl = (q.scl || [1,1,1]).slice(); q.scl[2] *= k; q.pos = q.pos.slice(); q.pos[2] = b.mn[2] + (q.pos[2] - b.mn[2])*k; }
      doc.pieces.push(q);
    });
    /* a few splinters at the break */
    for (var i = 0; i < 3; i++) doc.pieces.push({id:M.newId(doc), g:'broken', s:'loft', ax:'z', n:4, pos:[(i - 1)*0.008, B.mn[1] + (B.mx[1] - B.mn[1])/2, cut + 0.012 + i*0.006], rot:[0, 0, 0], scl:[1, 1, 1], c:'woodL', m:'wood', r:[[0, 0, -0.012, 0.006, 0.006], [0, 0, 0.012 + i*0.006, 0, 0]]});
  };
  /* move every piece so the chosen spot becomes the grip (the origin) */
  M.gripAt = function(doc, at){ doc.pieces.forEach(function(p){ p.pos = [p.pos[0] - at[0], p.pos[1] - at[1], p.pos[2] - at[2]].map(function(v){ return Math.round(v*1e4)/1e4; }); }); (doc.points || []).forEach(function(p){ p.pos = [p.pos[0] - at[0], p.pos[1] - at[1], p.pos[2] - at[2]]; }); };
  /* the design the game reads, from the Workshop's fields */
  M.gameDesign = function(doc){
    var d = doc.design; if (!d) return null;
    var key = doc.target.name || doc.target.group, all = []; doc.pieces.forEach(function(p){ if (p.g === 'new') all = all.concat(M.toNative(p)); });
    var B = M.boundsOf(all), len = B.ok ? Math.round((B.mx[2] - B.mn[2])*100)/100 : 0;
    var o = {id:'ws-' + String(doc.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50), name:String(doc.name || 'Item').replace(/ \(copy\)$/, '').slice(0, 24), by:String(doc.author || 'Workshop').slice(0, 16),
      kind:d.kind, power:Math.max(1, Math.min(100, Math.round(d.power || 1))), color:d.color || '#8f959c', model:key, length:len};
    if (d.kind === 'melee'){ o.shape = Math.max(0, Math.min(3, d.shape | 0)); if (d.reach) o.reach = Math.max(1.5, Math.min(3.2, d.reach)); if (d.spd) o.spd = Math.max(0.7, Math.min(1.4, d.spd)); }
    else if (d.beh) o.beh = d.beh;
    if (d.twoHanded) o.twoHanded = true;
    return o;
  };

  /* ------------------------------------------------------------------ W10: items, recipes, icons
     doc.item: {key, name, weightLb, stack, uses, recipe: {item: count}, note}. The icon is rendered from the model (app.js) into doc.icon (a PNG data URL). */
  M.defaultItem = function(doc){ return {key:String(doc.target.name || doc.id).replace(/[^a-z0-9_]/g, '_').slice(0, 24), name:String(doc.name).replace(/ \(copy\)$/, ''), weightLb:1, stack:10, uses:0, recipe:{}, note:''}; };
  M.RECIPE_ITEMS = ['scrap','wood','nails','tape','plant_fibre','cloth','rope','glass','plastic','car_parts','battery','fuel','toolkit','sheet','chunk'];

  /* ------------------------------------------------------------------ W5: skeletons and clips (survivors, clothes, aliens, animals)
     The packs share one format: bones {name: {pivot, tip, parent}}, pieces grouped by bone {bone: [pieces]},
     clips {name: [frame, ...]} where a frame maps bone to [x, y, z] degrees about the bone's pivot, X then Y then Z, children carried.
     In a skeletal design each part is a bone (a piece's g is its bone); doc.skeleton holds the bones and doc.frames the clips. */
  function bonesToLayout(byBone){ var L = {}; Object.keys(byBone).forEach(function(b){ L[b] = {$part:b}; }); return L; }
  function importBoned(shaped, pack, path, byBone, kind, name){
    var doc = {format:'afterstreet-workshop', v:2, type:'model', id:name + '_copy', name:name.replace(/_/g, ' ').replace(/^./, function(c){ return c.toUpperCase(); }) + ' (copy)', author:'', licence:'MIT', notes:'',
      kind:kind, target:{pack:pack, path:path}, from:pack + '.' + path.join('.'), parts:{}, pieces:[], points:[], extra:[], colours:{}, states:{}, _n:0};
    Object.keys(byBone).forEach(function(b){ doc.parts[b] = {}; (byBone[b] || []).forEach(function(np){ var ep = M.fromNative(np, b, null); ep.id = 'p' + (++doc._n); doc.pieces.push(ep); }); });
    doc.layout = bonesToLayout(byBone); delete doc._n;
    doc.slotColours = M.slotDefaults(shaped, pack, null, name);
    return doc;
  }
  /* an alien or an animal: its pieces by bone, bones and clips (aliens.creatures[name], animals.creatures[name]) */
  M.importCreature = function(shaped, pack, name){
    var P = shaped[pack], C = P.creatures[name], byBone = P.parts[name];
    if (!C || !byBone) throw new Error('no creature ' + pack + '.' + name);
    var doc = importBoned(shaped, pack, ['parts', name], byBone, 'creature', name);
    doc.skeleton = clone(C.bones || {}); doc.frames = clone(C.clips || {});
    Object.keys(doc.skeleton).forEach(function(b){ if (!doc.parts[b]) doc.parts[b] = {}; });   /* bones with no pieces are parts to put pieces on, not saved while empty */
    doc.creature = {pack:pack, name:name};
    Object.keys(C).forEach(function(k){ if (k !== 'bones' && k !== 'clips') doc.extra.push({path:['creatures', name, k], value:clone(C[k])}); });
    return doc;
  };
  /* a survivor part: a garment, hair, hat, shoes, gear ... (survivor.parts[slot][body][choice] or parts[slot][choice]) on the survivor's skeleton */
  M.importGarment = function(shaped, slot, body, choice){
    var V = shaped.survivor, S0 = V.parts[slot], byBone = body ? S0[body][choice] : S0[choice];
    if (!byBone) throw new Error('no survivor part ' + slot + '.' + (body ? body + '.' : '') + choice);
    var path = body ? ['parts', slot, body, choice] : ['parts', slot, choice];
    var doc = importBoned(shaped, 'survivor', path, byBone, 'clothing', choice);
    doc.skeleton = clone(V.bones); doc.frames = clone(V.clips); doc.garment = {slot:slot, body:body || 'masculine', choice:choice};
    doc.skeletonShared = true;   /* the survivor's own skeleton and clips: shown for posing, not saved with the part */
    return doc;
  };
  M.SURVIVOR_SLOTS = ['top','bottoms','worn','shoes','hair','hat','face','gear','npc','body'];
  M.survivorIndex = function(shaped){
    var V = shaped.survivor, out = []; if (!V) return out;
    M.SURVIVOR_SLOTS.forEach(function(sl){ var S0 = V.parts[sl]; if (!S0) return;
      if (S0.masculine || S0.feminine) ['masculine','feminine'].forEach(function(b){ Object.keys(S0[b] || {}).forEach(function(c){ if (S0[b][c] && typeof S0[b][c] === 'object' && !Array.isArray(S0[b][c]) && !isPiece(S0[b][c])) out.push({slot:sl, body:b, choice:c}); }); });
      else Object.keys(S0).forEach(function(c){ out.push({slot:sl, body:null, choice:c}); }); });
    return out;
  };
  /* the pose of a bone chain for a frame: a function moving points and normals */
  M.skinFn = function(doc, bone, frame){
    var B = doc.skeleton || {}, chain = [], b = bone, guard = 0;
    while (b && B[b] && guard++ < 64){ chain.push(b); b = B[b].parent; }
    var used = chain.filter(function(k){ var r = frame && frame[k]; return r && (r[0] || r[1] || r[2]); });
    if (!used.length) return null;
    var mats = {}; used.forEach(function(k){ mats[k] = M.rotMat(frame[k]); });
    return function(x, n){
      var q = x.slice(), nn = n ? n.slice() : null;
      chain.forEach(function(k){ var R = mats[k]; if (!R) return; var pv = B[k].pivot; var t = M.app3(R, [q[0]-pv[0], q[1]-pv[1], q[2]-pv[2]]); q = [t[0]+pv[0], t[1]+pv[1], t[2]+pv[2]]; if (nn) nn = M.app3(R, nn); });
      return [q, nn];
    };
  };
  /* a new bone: from the middle of the given pieces, hung from the nearest bone */
  M.addBone = function(doc, name, at, parent){
    doc.skeleton = doc.skeleton || {};
    doc.skeleton[name] = {pivot:at.slice(), tip:[at[0], at[1] + 0.1, at[2]]}; if (parent) doc.skeleton[name].parent = parent;
    if (!doc.parts[name]){ doc.parts[name] = {}; if (doc.layout && typeof doc.layout === 'object' && doc.layout.$part === undefined && !doc.layout.$parts) doc.layout[name] = {$part:name}; }
    return doc.skeleton[name];
  };
  /* W4: a shell a set distance out from body pieces (sleeves, trousers, a coat): boxes grow on every side, tubes in radius */
  M.inflate = function(pieces, dist, colour){
    return pieces.map(function(ep){
      var q = clone(ep); delete q.id; q.c = colour || q.c; delete q.keep;
      if (q.d){ q.d = q.d.map(function(v){ return Math.round((v + dist*2)*1e4)/1e4; }); }
      else if (q.s === 'loft' && q.r){ q.r = q.r.map(function(r){ var o = r.slice(); o[3] = Math.round((o[3] + dist)*1e4)/1e4; o[4] = Math.round((o[4] + dist)*1e4)/1e4; return o; }); }
      else if (q.s === 'poly' || q.s === 'decal'){ var all = M.toNative(ep), B = M.boundsOf(all); if (B.ok){ var sz = [B.mx[0]-B.mn[0], B.mx[1]-B.mn[1], B.mx[2]-B.mn[2]]; q.scl = (q.scl || [1,1,1]).map(function(v, i){ return v*(sz[i] + dist*2)/Math.max(sz[i], 1e-3); }); } }
      return q;
    });
  };
  /* skeleton, clips and the part itself back into the pack */
  function writeBoned(doc, A){
    if (!doc.target.path) return;
    if (doc.creature){
      A.creature = {bones:clone(doc.skeleton || {}), clips:clone(doc.frames || {})};
      (doc.extra || []).forEach(function(e){ if (e.path[0] === 'creatures') A.creature[e.path[2]] = clone(e.value); });
    } else if (doc.skeletonShared === false && doc.skeleton){ A.skeleton = clone(doc.skeleton); A.clips = clone(doc.frames || {}); }
  }
  M.writeBoned = writeBoned;

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
    /* points that came from the pack's tables go back to them, and so do moving parts and clips */
    M.writePoints(doc, extra);
    var A = {type:'model', id:doc.id, name:doc.name, kind:doc.kind, author:doc.author, notes:doc.notes, target:clone(doc.target), mode:doc.from ? 'replace' : 'add',
      value:value, extra:extra, palette:pal, points:clone(doc.points || []), parts:Object.keys(doc.parts), stats:{total:M.countModel(value)}, source:clone(doc)};
    writeRig(doc, extra, A);
    writeBoned(doc, A);
    if (doc.target.path) A.extra = (A.extra || []).filter(function(e){ return e.path[0] !== 'creatures'; });
    if (doc.variants && Object.keys(doc.variants).length){ A.variants = {}; Object.keys(doc.variants).forEach(function(st){ A.variants[st] = M.exportVariant(doc, st); A.stats[st] = M.countModel(A.variants[st]); }); }
    var L = M.lightsOf(doc); if (L.length) A.lights = L;
    if (M.salvage) try { var sv = M.salvage(doc); if (Object.keys(sv).length) A.salvage = sv; } catch (e){}
    if (doc.kind === 'held' && doc.design){ A.design = M.gameDesign(doc); var th = extraOf({extra:extra}, 'twoHanded'); }
    if (doc.item) A.item = clone(doc.item);
    if (doc.icon) A.icon = doc.icon;
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
  M.STOCK_PACKS = ['survivor','aliens','animals','autotrade','barriers','bikes','boats','buildings','businesses','civic','digging','farm','fleet','floorplan','flora','foodservice','furniture2','fx','ground','held','interiors','land','machinedig','machines','parks','pitworks','power','props','rail','roadside','services','shopfit','solar','structures','towers','vehiclekit','walls','waterside','woods','world'];
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
  M.blankOfKind = function(kind, name){
    if (kind === 'held') return M.blankHeld(name || 'my_weapon');
    var t = BLANK[kind] || BLANK.furniture, d = M.newModelDoc(kind, t[0], t[1], name || ('my_' + kind));
    if (kind === 'item') d.item = M.defaultItem(d);
    return d;
  };

  /* ------------------------------------------------------------------ the round trip test (also used by tools/roundtrip.js) */
  function norm(o){
    if (Array.isArray(o)) return o.map(norm);
    if (o && typeof o === 'object'){ var r = {}; Object.keys(o).sort().forEach(function(k){ if (k === '_m') return; if (k === 'ry' && (((o[k] % 4) + 4) % 4) === 0) return; if (o[k] === null || o[k] === false) return; if (k === 'n' && o.s === 'decal' && Array.isArray(o[k])){ var l = Math.sqrt(o[k][0]*o[k][0] + o[k][1]*o[k][1] + o[k][2]*o[k][2]) || 1; r[k] = o[k].map(function(t){ return Math.round(t/l*1e3)/1e3; }); return; } r[k] = norm(o[k]); }); return r; }
    return typeof o === 'number' ? Math.round(o*1e4)/1e4 : o;
  }
  M.sameModel = function(a, b){ return JSON.stringify(norm(a)) === JSON.stringify(norm(b)); };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : this);
