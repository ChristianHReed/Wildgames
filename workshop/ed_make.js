/* The Workshop's Make card: ready-made parts built from settings, with proper fields instead of typed codes.
   Stairs, panes, walls with openings, lettering, trim, copies in a row, spun shapes, raised outlines, pipes, cabins, wheel looks and trees.
   The parts come from workshop/kit.js (the same code the build library uses), so a part made here matches one made by a script.
   Each part remembers its settings: select any of its pieces and "Change its settings" makes it again in the same place.
   Loaded before app.js; it plugs in through window.WSX (see the extension table in app.js). MIT licence. */
(window.WSX = window.WSX || []).push(function(A){
  var S = A.S, X = A.X, M = A.M, K = window.WSK || M.kit, $ = A.$, esc = A.esc, clone = A.clone, r4 = A.r4;
  if (!K) return;
  var FACES = [['front', 'The front (+z)'], ['back', 'The back (-z)'], ['left', 'The left side (+x)'], ['right', 'The right side (-x)']];
  var TURN = {front:0, back:180, left:90, right:-90}, DIRS = {x:[1, 0, 0], y:[0, 1, 0], z:[0, 0, 1], '-x':[-1, 0, 0], '-z':[0, 0, -1]};
  /* what each kind asks for: [key, label, type, default, extra]. Types: len (shown in inches or cm), int, deg, bool, sel, text, face, pts2, pts3, ops */
  var KINDS = [
    {k:'stairs', label:'Stairs', help:'Steps going up towards the back (-z to +z), from where the selection is or the middle.',
      f:[['steps', 'Steps', 'int', 5, {min:1, max:60}], ['w', 'Width', 'len', 0.9], ['rise', 'Rise of each step', 'len', 0.18], ['run', 'Depth of each step', 'len', 0.28]]},
    {k:'pane', label:'Pane (windscreen, window, sloped panel)', help:'A flat pane standing on its bottom edge, leaning back and narrower at the top if you ask. With a piece selected it sits on that face.',
      f:[['w', 'Width', 'len', 1.4], ['h', 'Height up the slope', 'len', 0.8], ['t', 'Thickness', 'len', 0.02], ['lean', 'Leans back', 'deg', 25, {min:0, max:85}],
         ['rake', 'Narrower at the top, each side', 'len', 0.06], ['turn', 'Faces', 'face', 'front'], ['glass', 'Glass (see-through)', 'bool', true]]},
    {k:'wall', label:'Wall with openings (doors, windows, arches)', help:'A wall with doors and windows cut out. Openings are measured from the wall\'s left end (seen from the side it faces) and from the floor; a sill of 0 makes a door.',
      f:[['w', 'Length', 'len', 3], ['h', 'Height', 'len', 2.4], ['t', 'Thickness', 'len', 0.1], ['turn', 'Faces', 'face', 'front'],
         ['ops', 'Openings', 'ops', [[0.4, 0.9, 0, 2.0], [1.8, 1.0, 0.9, 0.8]]], ['glass', 'Glass in the windows', 'bool', true], ['frame', 'Frame round each (0 for none)', 'len', 0.05]]},
    {k:'text', label:'Lettering (signs, number plates, names)', help:'Raised block letters. With a piece selected they sit on its face, centred. Letters A to Z, numbers and - . , / ! ? \' : & + #.',
      f:[['str', 'Words', 'text', 'OPEN'], ['h', 'Letter height', 'len', 0.15], ['depth', 'Stands out', 'len', 0.012], ['turn', 'Faces', 'face', 'front'],
         ['align', 'Line up', 'sel', 'centre', [['left', 'From the left'], ['centre', 'Centred'], ['right', 'To the right']]]]},
    {k:'trim', label:'Trim round the selection (corner boards, base strip, fascia)', need:'sel', help:'Boards up the corners, a darker strip round the bottom and a band round the top of the selected box body: what makes a plain box read as a building or a truck body.',
      f:[['corners', 'Corner boards', 'bool', true], ['cw', 'Board width', 'len', 0.12], ['base', 'Base strip', 'bool', true], ['baseH', 'Strip height', 'len', 0.25],
         ['fascia', 'Fascia along the top', 'bool', true], ['fasciaH', 'Fascia height', 'len', 0.2], ['proud', 'Stands out', 'len', 0.03]]},
    {k:'row', label:'Copies in a row', need:'sel', help:'Copies of the selection in a straight line: fence posts, windows, pickets, rail ties.',
      f:[['dir', 'Direction', 'sel', 'z', [['x', 'To the left (+x)'], ['-x', 'To the right (-x)'], ['z', 'To the front (+z)'], ['-z', 'To the back (-z)'], ['y', 'Up (+y)']]],
         ['every', 'Spacing', 'len', 0.5], ['by', 'How many', 'sel', 'count', [['count', 'A number of copies'], ['length', 'Fill a length']]],
         ['count', 'Copies (with the first)', 'int', 4, {min:2, max:200}], ['length', 'Length to fill', 'len', 3]]},
    {k:'radial', label:'Copies round the middle', need:'sel', help:'Copies of the selection turned round the up axis through the middle of the design: spokes, blades, a ring of posts.',
      f:[['count', 'Copies (with the first)', 'int', 6, {min:2, max:72}]]},
    {k:'lathe', label:'Spun shape (vase, post, lamp shade)', help:'An outline spun round the up axis. Each point is how far out and how high, from the bottom up.',
      f:[['pts', 'Outline: out, up', 'pts2', [[0.1, 0], [0.12, 0.05], [0.05, 0.5], [0.15, 0.6]]], ['sides', 'Sides', 'int', 10, {min:3, max:24}]]},
    {k:'extrude', label:'Raised outline (sign, bracket, counter)', help:'Corners of a flat outline (across, front to back), raised to a height.',
      f:[['pts', 'Corners: across, front to back', 'pts2', [[0, 0], [0.6, 0], [0.6, 0.15], [0.15, 0.15], [0.15, 0.6], [0, 0.6]]], ['h', 'Height', 'len', 0.9]]},
    {k:'pipe', label:'Pipe or cable', help:'A pipe through points, measured from where the selection is (or the middle).',
      f:[['pts', 'Points: across, up, front to back', 'pts3', [[0, 0, 0], [0, 1, 0], [0.75, 1, 0]]], ['d', 'Thickness', 'len', 0.04, {min:0.005}]]},
    {k:'cabin', label:'Car cabin (dashboard, wheel, seats)', vehicle:true, guess:true, help:'A whole cabin inside the body: dashboard with gauges, steering wheel (it turns with the steering), console, gear lever, door cards, carpet, headliner and seats. The settings start from the body you drew; check them in the side view.',
      f:[['w', 'Inside width', 'len', 1.56], ['cabF', 'Windscreen foot (front to back)', 'len', 0.9], ['cabB', 'Back of the cabin', 'len', -0.9], ['g', 'Underside height', 'len', 0.2],
         ['belt', 'Window sill height', 'len', 1.0], ['roof', 'Roof height', 'len', 1.38], ['seatY', 'Seat height', 'len', 0.68], ['rear', 'Back seats', 'bool', true],
         ['side', 'Driver sits', 'sel', 'left', [['left', 'On the left (+x)'], ['right', 'On the right (-x)']]]]},
    {k:'cab', label:'Truck or van cab (hollow, with doors)', vehicle:true, guess:true, help:'A hollow cab you can sit in: floor, skins, back wall, roof, windscreen, doors with their own glass, dashboard, wheel and two seats.',
      f:[['w', 'Width', 'len', 2.2], ['zF', 'Windscreen (front to back)', 'len', 3.6], ['zB', 'Back wall', 'len', 2.0], ['fl', 'Floor height', 'len', 1.1], ['belt', 'Window sill height', 'len', 1.9], ['roof', 'Roof height', 'len', 2.9],
         ['side', 'Driver sits', 'sel', 'left', [['left', 'On the left (+x)'], ['right', 'On the right (-x)']]]]},
    {k:'wheels', label:'Wheel look', vehicle:true, help:'How the wheel looks. The game copies it onto every hub; it keeps this look when you change the wheel size.',
      f:[['style', 'Look', 'sel', 'plain', Object.keys(K.WHEEL_LOOKS).map(function(k){ return [k, K.WHEEL_LOOKS[k]]; })]]},
    {k:'tree', label:'Tree', plant:true, help:'Grows a new trunk, branches and leaves in place of the ones there now.',
      f:[['height', 'Height', 'len', 6, {min:1}], ['branches', 'Branches', 'int', 6, {min:1, max:16}], ['seed', 'Seed (a different tree each number)', 'int', 3, {min:1, max:999}]]}
  ];
  var BY = {}; KINDS.forEach(function(k){ BY[k.k] = k; });
  var F = {kind:'stairs', v:null, redo:null};
  function defaults(k){ var v = {}; BY[k].f.forEach(function(f){ v[f[0]] = clone(f[3]); }); if (BY[k].guess) Object.assign(v, guess(k)); return v; }
  function landVehicle(){ return S.doc && S.doc.type === 'vehicle' && (S.doc.domain || 'land') === 'land'; }
  function usable(k){ var d = BY[k]; if (d.vehicle && !landVehicle()) return false; if (d.plant && !(A.isModel() && S.doc.kind === 'plant')) return false; if (d.need === 'sel' && !A.selected().length && F.redo == null) return false; return true; }
  function selBounds(sel){ var all = [].concat.apply([], sel.map(A.nativesOf)), B = M.boundsOf(all); return B.ok ? B : null; }

  /* starting settings for a cabin from the body already drawn */
  function guess(k){
    if (!S.doc || S.doc.type !== 'vehicle') return {};
    var G = K.cabinGuess(S.doc);
    if (k === 'cabin') return {w:r4(G.hw*2), cabF:G.cabF, cabB:G.cabB, g:G.g, belt:G.belt, roof:G.roof, seatY:G.seatY, rear:G.rear.length > 0};
    var body = []; S.doc.pieces.forEach(function(p){ if (p.g === 'body' && !p.hidden) body = body.concat(M.toNative(p)); });
    var B = M.boundsOf(body); if (!B.ok) return {};
    var zF = r4(B.mx[2] - 0.12), fl = r4(Math.max(B.mn[1] + 0.5, 0.9));
    return {w:r4(Math.max(1.4, Math.max(-B.mn[0], B.mx[0])*2 - 0.04)), zF:zF, zB:r4(zF - 1.6), fl:fl, belt:r4(fl + 0.8), roof:r4(Math.min(B.mx[1], fl + 1.8))};
  }

  /* ---------------------------------------------------------------- the card */
  function row(l, inner){ return '<div class="row"><label class="l">' + esc(l) + '</label>' + inner + '</div>'; }
  function setter(key, kind){ return function(v){ F.v[key] = kind === 'int' ? Math.round(v) : v; A.renderPanel(); }; }
  function field(f){
    var key = f[0], lab = f[1], type = f[2], val = F.v[key], ex = f[4] || {};
    if (type === 'len') return row(lab, A.num(lab, val, 'len', setter(key), {min:ex.min != null ? ex.min : 0}));
    if (type === 'int') return row(lab, A.num(lab, val, 'n', setter(key, 'int'), {min:ex.min, max:ex.max, step:1}));
    if (type === 'deg') return row(lab, A.num(lab, val, 'deg', setter(key), {min:ex.min, max:ex.max}));
    if (type === 'bool') return '<div class="row"><label><input type="checkbox" data-k="mkb" data-key="' + key + '"' + (val ? ' checked' : '') + '>' + esc(lab) + '</label></div>';
    if (type === 'text') return row(lab, '<input class="grow" type="text" maxlength="60" data-k="mkt" data-key="' + key + '" value="' + esc(val) + '" aria-label="' + esc(lab) + '">');
    if (type === 'sel' || type === 'face'){ var opts = type === 'face' ? FACES : f[4];
      return row(lab, '<select class="grow" data-k="mks" data-key="' + key + '" aria-label="' + esc(lab) + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'); }
    if (type === 'pts2' || type === 'pts3' || type === 'ops'){
      var n = type === 'pts2' ? 2 : type === 'pts3' ? 3 : 4, heads = type === 'ops' ? ['From the left', 'Width', 'Sill (0: door)', 'Height'] : null;
      var h = '<div class="mkhd">' + esc(lab) + ' (' + A.unitLabel() + ')</div>' + (heads ? '<div class="mkpts mkh" style="--n:' + n + '">' + heads.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('') + '<span></span></div>' : '');
      (val || []).forEach(function(q, i){ h += '<div class="mkpts" style="--n:' + n + '">' + q.map(function(x, j){ return '<input inputmode="decimal" data-k="mkpt" data-key="' + key + '" data-i="' + i + '" data-j="' + j + '" value="' + A.fmtNum(A.toUnit(x)) + '" aria-label="' + esc(lab) + ' ' + (i + 1) + ' ' + (heads ? heads[j] : 'xyz'[j]) + '">'; }).join('') +
        '<button class="alt sm" data-a="mkptDel" data-key="' + key + '" data-i="' + i + '" aria-label="Remove this row" title="Remove">&times;</button></div>'; });
      if (type === 'ops') h += '<div class="row"><button class="alt sm" data-a="mkptAdd" data-key="' + key + '" data-door="1">Add a door</button><button class="alt sm" data-a="mkptAdd" data-key="' + key + '">Add a window</button></div>';
      else h += '<div class="row"><button class="alt sm" data-a="mkptAdd" data-key="' + key + '">Add a point</button></div>';
      return h;
    }
    return '';
  }
  function card(){
    if (!S.doc) return '';
    var list = KINDS.filter(function(k){ return usable(k.k); }); if (!list.length) return '';
    if (!BY[F.kind] || !usable(F.kind)){ F.kind = list[0].k; F.v = null; F.redo = null; }
    if (!F.v) F.v = defaults(F.kind);
    var d = BY[F.kind], R = F.redo != null ? kits()[F.redo] : null;
    var h = '<div class="card mk"><h3>' + (R ? 'Change: ' + esc(d.label) : 'Make') + '</h3>';
    if (!R) h += '<div class="row"><select class="grow" data-k="mkKind" aria-label="What to make">' + list.map(function(k){ return '<option value="' + k.k + '"' + (k.k === F.kind ? ' selected' : '') + '>' + esc(k.label) + '</option>'; }).join('') + '</select></div>';
    h += '<p class="muted">' + esc(d.help) + '</p>';
    d.f.forEach(function(f){ if (F.kind === 'row' && ((f[0] === 'count' && F.v.by !== 'count') || (f[0] === 'length' && F.v.by !== 'length'))) return; h += field(f); });
    h += R ? '<div class="row"><button class="go" data-a="mkRemake">Make it again (' + R.ids.length + ' pieces)</button><button class="alt" data-a="mkCancel">Cancel</button></div>'
           : '<div class="row"><button class="go" data-a="mkGo">Make</button>' + (BY[F.kind].guess ? '<button class="alt sm" data-a="mkGuess">Start from the body</button>' : '') + '</div>';
    return h + '</div>';
  }

  /* ---------------------------------------------------------------- making */
  function kits(){ return (S.doc.kits = S.doc.kits || {}); }
  function anchor(kind, v){
    var sel = A.selected(), B = sel.length ? selBounds(sel) : null;
    if (!B) return [0, kind === 'text' ? 1 : 0, 0];
    var c = [(B.mn[0] + B.mx[0])/2, (B.mn[1] + B.mx[1])/2, (B.mn[2] + B.mx[2])/2];
    if (kind === 'text' || kind === 'wall' || kind === 'pane'){
      var y = kind === 'text' ? c[1] - v.h/2 : kind === 'wall' ? B.mn[1] : B.mx[1], f = v.turn;
      return (f === 'back' ? [c[0], y, B.mn[2]] : f === 'left' ? [B.mx[0], y, c[2]] : f === 'right' ? [B.mn[0], y, c[2]] : [c[0], y, B.mx[2]]).map(r4); }
    return [c[0], B.mx[1], c[2]].map(r4);
  }
  /* the pieces a kind makes (not yet in the design) */
  function build(kind, v, at, sel){
    var tmp = [], b = K.on(S.doc, tmp), c = S.brush || 'paint1', o = {c:c, m:M.guessMaterial(c)}, dx = v.side === 'right' ? -1 : 1;
    if (kind === 'stairs') return M.stairs(Math.max(1, v.steps | 0), v.w, v.rise, v.run, at, o);
    if (kind === 'lathe') return M.lathe(v.pts.map(function(q){ return [Math.max(0, q[0]), q[1]]; }), v.sides | 0, at, o);
    if (kind === 'extrude'){ if (v.pts.length < 3) throw new Error('an outline needs three corners or more'); return M.extrude(v.pts, v.h, at, o); }
    if (kind === 'pipe'){ if (v.pts.length < 2) throw new Error('a pipe needs two points or more'); return M.pipe(v.pts.map(function(q){ return [at[0] + q[0], at[1] + q[1], at[2] + q[2]]; }), v.d/2, 6, o); }
    if (kind === 'pane') K.pane(b, {at:at, w:v.w, h:v.h, t:v.t, lean:v.lean, rake:v.rake, turn:TURN[v.turn], c:v.glass ? 'glass' : c});
    else if (kind === 'wall') K.wall(b, {at:at, w:v.w, h:v.h, t:v.t, turn:TURN[v.turn], c:c, glass:v.glass, frame:v.frame,
      openings:v.ops.map(function(q){ return {a:q[0], b:q[0] + q[1], y0:q[2], y1:q[2] + q[3]}; })});
    else if (kind === 'text'){ if (!String(v.str || '').trim()) throw new Error('type the words first'); K.text(b, v.str, {at:at, h:v.h, depth:v.depth, turn:TURN[v.turn], align:v.align, c:c}); }
    else if (kind === 'trim'){ var B = selBounds(sel); if (!B) throw new Error('select the body to trim first'); K.trim(b, B, v); }
    else if (kind === 'row') return K.along(sel, {dir:DIRS[v.dir], every:v.every, count:v.by === 'count' ? Math.max(2, v.count | 0) : 0, length:v.by === 'length' ? v.length : 0});
    else if (kind === 'radial') return M.radialOf(sel, Math.max(2, v.count | 0), [0, 0, 0]);
    else if (kind === 'cabin') K.carCabin(b, {hw:v.w/2, cabF:v.cabF, cabB:v.cabB, g:v.g, belt:v.belt, roof:v.roof, seatY:v.seatY, driverX:0.4*dx, rear:v.rear ? [r4(v.cabF - 1.7), r4(v.cabF - 1.7)] : []});
    else if (kind === 'cab') K.truckCab(b, {hw:v.w/2, zF:v.zF, zB:v.zB, fl:v.fl, belt:v.belt, roof:v.roof, driverX:0.45*dx});
    return tmp;
  }
  function make(kind, v, at, redo){
    var d = BY[kind], sel = A.selected(), L = A.ownerList();
    if (kind === 'wheels'){ A.commit(); K.setWheelLook(S.doc, v.style); A.changed(true); return A.toast('The wheels now look ' + v.style + '.'); }
    if (kind === 'tree'){ A.commit(); S.doc.pieces = S.doc.pieces.filter(function(p){ return p.g !== 'body' && p.g !== 'leaves'; });
      M.growTree({height:v.height, branches:v.branches, seed:v.seed}).forEach(function(q){ q.id = M.newId(S.doc); S.doc.pieces.push(q); }); A.changed(true); return A.toast('Grew a tree.'); }
    var pts0 = S.doc.points ? clone(S.doc.points) : null, made;
    try { made = build(kind, v, at, sel); }
    catch (e){ if (pts0) S.doc.points = pts0; return A.toast('Could not make it: ' + e.message); }
    if (!made.length){ if (pts0) S.doc.points = pts0; return A.toast('Nothing made: check the settings.'); }
    if (made.length > 1500) return A.toast('That would make ' + made.length + ' pieces: too many for phones. Try fewer.');
    A.commit();
    if (kind === 'cabin' || kind === 'cab'){   /* one driver's eye and one wheel hinge: the new ones */
      var pts = S.doc.points || []; ['steer.wheel', 'cabin.eye'].forEach(function(n){ var mine = pts.filter(function(p){ return p.name === n; }); mine.slice(0, -1).forEach(function(p){ pts.splice(pts.indexOf(p), 1); }); }); }
    if (redo){ var R0 = kits()[redo]; for (var i = L.length - 1; i >= 0; i--) if (R0.ids.indexOf(L[i].id) >= 0) L.splice(i, 1); }
    var g = S.layer === 'wheel' ? 'wheel' : A.isModel() ? (S.part || (sel[0] && sel[0].g) || (L[0] && L[0].g) || 'body') : null;
    made.forEach(function(q){ q.id = M.newId({pieces:L}); if (g && kind !== 'row' && kind !== 'radial') q.g = g; L.push(q); });
    var id = redo || ('k' + (Object.keys(kits()).reduce(function(n, k){ return Math.max(n, +k.slice(1) || 0); }, 0) + 1));
    if (kind !== 'row' && kind !== 'radial'){ kits()[id] = {t:kind, v:clone(v), at:at, p0:made[0].pos.slice(), ids:made.map(function(q){ return q.id; })}; made.forEach(function(q){ q.kit = id; }); }
    S.sel = made.map(function(q){ return q.id; }); F.redo = null;
    A.changed(true);
    A.toast('Made ' + d.label.replace(/ \(.*/, '').toLowerCase() + ': ' + made.length + ' piece' + (made.length === 1 ? '' : 's') + '.');
  }
  /* the part a piece came from, if its record still knows it */
  function kitOf(p){ if (!p || !p.kit || !S.doc.kits) return null; var R = S.doc.kits[p.kit]; return R && R.ids.indexOf(p.id) >= 0 && BY[R.t] ? R : null; }
  function madeCard(id, R){
    return '<div class="card"><h3>Made with Make</h3><p class="muted">' + esc(BY[R.t].label) + ', ' + R.ids.length + ' pieces. Change its settings to make it again in the same place (pieces you changed by hand are made afresh).</p>' +
      '<div class="row"><button class="alt sm" data-a="mkEdit" data-kit="' + esc(id) + '">Change its settings</button><button class="alt sm" data-a="mkPick" data-kit="' + esc(id) + '">Select all of it</button></div></div>';
  }
  X.piece.push(function(p){ var R = kitOf(p); return R && F.redo !== p.kit ? madeCard(p.kit, R) : ''; });
  X.many.push(function(sel){ var k = sel[0] && sel[0].kit, R = kitOf(sel[0]); if (!R || F.redo === k || !sel.every(function(p){ return p.kit === k; })) return ''; return madeCard(k, R); });

  X.make = {
    card:card,
    go:function(){ if (!F.v) F.v = defaults(F.kind); make(F.kind, F.v, anchor(F.kind, F.v), null); }
  };
  var AC = A.ACTIONS, CH = A.CHANGES;
  AC.mkEdit = function(b){ var R = kits()[b.dataset.kit]; if (!R) return; F.kind = R.t; F.v = clone(R.v); F.redo = b.dataset.kit; A.renderPanel(); };
  AC.mkCancel = function(){ F.redo = null; F.v = null; A.renderPanel(); };
  AC.mkPick = function(b){ var R = kits()[b.dataset.kit]; if (!R) return; var L = A.ownerList(); S.sel = R.ids.filter(function(id){ return L.some(function(p){ return p.id === id; }); }); A.refresh(); };
  AC.mkRemake = function(){
    var id = F.redo, R = kits()[id]; if (!R) return AC.mkCancel();
    var L = A.ownerList(), first = L.filter(function(p){ return p.id === R.ids[0]; })[0], at = R.at.slice();
    if (first && R.p0) for (var i = 0; i < 3; i++) at[i] = r4(at[i] + first.pos[i] - R.p0[i]);   /* the part was moved: make it where it is now */
    make(R.t, F.v, at, id);
  };
  AC.mkGuess = function(){ Object.assign(F.v, guess(F.kind)); A.renderPanel(); };
  AC.mkptAdd = function(b){ var k = b.dataset.key, list = F.v[k] = F.v[k] || [], last = list[list.length - 1];
    if (F.kind === 'wall'){ var x = last ? r4(last[0] + last[1] + 0.4) : 0.3; list.push(b.dataset.door ? [x, 0.9, 0, 2.0] : [x, 1.0, 0.9, 0.8]); }
    else list.push(last ? last.map(function(q, j){ return j === 0 ? r4(q + 0.2) : q; }) : (F.kind === 'pipe' ? [0, 0, 0] : [0, 0]));
    A.renderPanel(); };
  AC.mkptDel = function(b){ var list = F.v[b.dataset.key]; if (list) list.splice(+b.dataset.i, 1); A.renderPanel(); };
  CH.mkKind = function(t){ F.kind = t.value; F.v = defaults(F.kind); F.redo = null; A.renderPanel(); };
  CH.mkb = function(t){ F.v[t.dataset.key] = t.checked; };
  CH.mkt = function(t){ F.v[t.dataset.key] = t.value; };
  CH.mks = function(t){ F.v[t.dataset.key] = t.value; if (t.dataset.key === 'by') A.renderPanel(); };
  CH.mkpt = function(t){ var v = parseFloat(String(t.value).replace(',', '.')); if (!isFinite(v)) return; F.v[t.dataset.key][+t.dataset.i][+t.dataset.j] = r4(A.fromUnit(v)); };
  /* rows of point fields: big enough for a finger */
  var st = document.createElement('style');
  st.textContent = '.mkpts{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr)) 44px;gap:6px;margin:4px 0}.mkpts input{min-height:40px;width:100%;min-width:0;box-sizing:border-box}' +
    '.mkpts.mkh span{font-size:11px;opacity:.7}.mkpts button{min-height:40px}.mkhd{margin:8px 0 2px;font-size:13px}.card.mk .go{min-height:44px}';
  document.head.appendChild(st);
  A.WSK = K;
});
