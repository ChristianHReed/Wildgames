/* AfterStreet Workshop: craft logic for every vehicle — land, air and water.
   Builds on model.js (pieces, axles, drivetrain) the way building games do it: a vehicle is blocks with jobs, and the jobs decide
   what it can do (Space Engineers' functional blocks, Stormworks' engine -> gearbox -> shaft, Trailmakers' wings and propellers).

   What this adds:
   - domain: land | air | water, and a class inside it (box truck, semi, trailer, helicopter, plane, airship, houseboat ...)
   - rooms: walk-in space inside a vehicle (the back of a box truck or a trailer, a motorhome, a houseboat cabin). A room is a
     hidden box; the Workshop checks headroom, floor, a way in and what is in the way, and works out the floor cells a player can
     fill with base fittings. A walk-in room big enough is a mobile base.
   - moving parts: doors (swing, roll-up, slide, ramp), rotors, tail rotors, propellers, rudders, elevators, outboard motors and
     sails. Each is exported as its own part with a rig (pivot, turn or slide, range), in the same rig format as the machines and
     boats packs.
   - coupling: a fifth wheel or tow ball on a tractor, a kingpin or tongue on a trailer.
   - mass, and from it buoyancy (waterline, freeboard, how many survivors it carries) for boats and lift for aircraft.
   - exports: land vehicles stay in the props vehicles format (plus parts, interior, coupling); boats are written in the boats
     pack format (water line at y = 0) and aircraft in a new aircraft format of the same shape.
   Runs in the browser (window.WSM) and in Node (require). Load after model.js and assets.js. */
(function(root){
  var M = (typeof module !== 'undefined' && module.exports) ? require('./model.js') : root.WSM;
  function r4(v){ return Math.round(v*1e4)/1e4; }
  function v3r(a){ return [r4(a[0]), r4(a[1]), r4(a[2])]; }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function slug(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  var LB = 2.20462;

  /* ------------------------------------------------------------------ domains and classes */
  M.DOMAINS = {land:{label:'Land vehicle', station:'carshop'}, air:{label:'Aircraft', station:'hangar'}, water:{label:'Boat', station:'dock'}};
  M.CLASSES = {
    land:[['car', 'Car'], ['pickup', 'Pickup'], ['van', 'Van'], ['truck', 'Box truck or lorry'], ['bus', 'Bus'], ['rv', 'Motorhome'], ['semi', 'Semi tractor'], ['trailer', 'Trailer']],
    air:[['heli', 'Helicopter'], ['plane', 'Plane'], ['gyro', 'Gyrocopter'], ['airship', 'Airship or balloon']],
    water:[['rowboat', 'Rowboat or canoe'], ['motorboat', 'Motorboat'], ['sailboat', 'Sailboat'], ['houseboat', 'Houseboat'], ['raft', 'Raft'], ['barge', 'Barge or ferry']]
  };
  M.domainOf = function(doc){ return doc && doc.type === 'vehicle' ? (doc.domain || 'land') : null; };

  /* ------------------------------------------------------------------ jobs (added to model.js's list) */
  var JOBS = {
    room:      {label:'Walk-in room',  on:['land', 'air', 'water'], hint:'a hidden box marking space people walk into (the back of a box truck, a cabin); it needs a door or an open side'},
    door:      {label:'Door or hatch', on:['land', 'air', 'water'], moving:true, hint:'opens: swing on a hinge, roll up, slide along, or drop as a ramp; pieces with the same name open together'},
    hitch:     {label:'Tow hitch',     on:['land'], hint:'a fifth wheel (semis) or tow ball at the back: a trailer couples here'},
    coupler:   {label:'Trailer coupling', on:['land'], hint:'a kingpin (under a semi trailer) or a tongue (front of a small trailer)'},
    rotor:     {label:'Main rotor',    on:['air'], moving:true, spin:'y', hint:'spins about Y and lifts a helicopter; its span is the disc that lifts'},
    tailrotor: {label:'Tail rotor',    on:['air'], moving:true, spin:'x', hint:'spins about X and stops a single-rotor helicopter turning round'},
    propeller: {label:'Propeller',     on:['air', 'water'], moving:true, spin:'z', hint:'spins about Z and pushes the craft forward'},
    jet:       {label:'Jet engine',    on:['air'], hint:'pushes a plane forward (no moving parts)'},
    wing:      {label:'Wing',          on:['air'], hint:'its area from above lifts a plane at speed'},
    envelope:  {label:'Gas envelope',  on:['air'], hint:'the bag of an airship or balloon: its volume lifts'},
    skid:      {label:'Skid or float', on:['air'], hint:'what it lands on when it has no wheels'},
    rudder:    {label:'Rudder',        on:['air', 'water'], moving:true, hint:'turns about its front edge to steer'},
    elevator:  {label:'Elevator or flap', on:['air'], moving:true, hint:'tilts about its front edge to climb and dive'},
    hull:      {label:'Hull (floats)', on:['water'], hint:'the watertight volume: its size below the waterline holds the boat up; use a hidden box filling the inside of the hull'},
    outboard:  {label:'Outboard motor', on:['water'], moving:true, hint:'swings left and right to steer; put a Propeller under it'},
    sail:      {label:'Sail',          on:['water'], moving:true, hint:'swings about its mast (its front edge) to catch the wind'},
    oars:      {label:'Oars or paddles', on:['water'], hint:'rowing: each seat beside them can row'}
  };
  for (var j in JOBS) M.FUNCTIONS[j] = JOBS[j];
  ['seat', 'engine', 'tank', 'storage', 'sleep', 'headlight', 'taillight', 'battery'].forEach(function(k){ M.FUNCTIONS[k].on = ['land', 'air', 'water']; });
  M.FUNCTIONS.axle.on = ['land', 'air']; M.FUNCTIONS.gearbox.on = ['land'];
  M.FUNCTIONS.axle.hint += ' (on aircraft: the landing gear)';
  M.jobsFor = function(doc){ var d = M.domainOf(doc) || 'land'; return Object.keys(M.FUNCTIONS).filter(function(k){ return !M.FUNCTIONS[k].on || M.FUNCTIONS[k].on.indexOf(d) >= 0; }); };
  M.isMoving = function(fn){ return !!(fn && M.FUNCTIONS[fn] && M.FUNCTIONS[fn].moving); };
  /* give a piece a job: moving jobs put it in its own part ('part'), markers (room, hull marker) are hidden */
  M.setJob = function(p, fn){
    if (fn) p.fn = fn; else delete p.fn;
    if (M.isMoving(fn)){ p.g = 'part'; if (fn === 'door' && !p.door) p.door = {kind:'swing', hinge:'front'}; }
    else if (p.g === 'part') p.g = 'body';
    if (fn === 'room') p.hidden = true;
    if (fn === 'hitch' && !p.hitch) p.hitch = {type:'fifth'};
    if (fn === 'coupler' && !p.coupler) p.coupler = {type:'kingpin'};
    return p;
  };
  M.DOOR_KINDS = [['swing', 'Swings on a hinge'], ['roll', 'Rolls up (shutter)'], ['slide', 'Slides back'], ['ramp', 'Drops down as a ramp']];
  M.HINGES = [['front', 'Front edge'], ['back', 'Back edge'], ['top', 'Top edge'], ['bottom', 'Bottom edge'], ['outer', 'Outer edge (away from the middle)'], ['inner', 'Inner edge (the middle)']];
  M.HITCHES = [['fifth', 'Fifth wheel (semi)'], ['ball', 'Tow ball'], ['pintle', 'Pintle hook']];
  M.COUPLERS = [['kingpin', 'Kingpin (semi trailer)'], ['tongue', 'Tongue and cup (small trailer)'], ['ring', 'Lunette ring']];
  M.COUPLES = {fifth:['kingpin'], ball:['tongue'], pintle:['ring', 'tongue']};

  var raw = function(p){ return M.toNativeAlways(Object.assign(clone(p), {hidden:false})); };
  function bbox(list){ var B = M.boundsOf(list); return B.ok ? B : null; }
  function overlap(a, b, pad){ pad = pad || 0; return a.mn[0] < b.mx[0] + pad && b.mn[0] < a.mx[0] + pad && a.mn[1] < b.mx[1] + pad && b.mn[1] < a.mx[1] + pad && a.mn[2] < b.mx[2] + pad && b.mn[2] < a.mx[2] + pad; }
  function centre(B){ return [(B.mn[0]+B.mx[0])/2, (B.mn[1]+B.mx[1])/2, (B.mn[2]+B.mx[2])/2]; }
  function size(B){ return [B.mx[0]-B.mn[0], B.mx[1]-B.mn[1], B.mx[2]-B.mn[2]]; }
  /* each native piece of an editor piece as its own box (mirrored copies are separate) */
  function boxesOf(p){ return raw(p).map(function(np){ return M.boundsOf([np]); }).filter(function(B){ return B.ok; }); }

  /* ------------------------------------------------------------------ moving parts */
  /* every moving part with its pieces and natives; a mirrored piece makes a left and a right part (doors on both sides) */
  M.movingParts = function(doc){
    var parts = {}, order = [];
    doc.pieces.forEach(function(p){
      if (!M.isMoving(p.fn) || p.hidden) return;
      var base = slug(p.name) || (p.fn + '_' + p.id), one = Object.assign(clone(p), {mx:false});
      var sides = [[one, p.mx ? (p.pos[0] >= 0 ? '_r' : '_l') : '']];
      if (p.mx) sides.push([null, p.pos[0] >= 0 ? '_l' : '_r']);
      var natO = M.toNative(one);
      sides.forEach(function(sd){
        var key = base + sd[1], nat = sd[0] ? natO : natO.map(M.mirrorX);
        if (!parts[key]){ parts[key] = {name:key, fn:p.fn, door:p.door ? clone(p.door) : null, mirrored:!sd[0], natives:[], ids:[]}; order.push(key); }
        parts[key].natives = parts[key].natives.concat(nat); parts[key].ids.push(p.id);
      });
    });
    order.forEach(function(k){ parts[k].B = bbox(parts[k].natives); });
    return {parts:parts, order:order.filter(function(k){ return parts[k].B; })};
  };
  var AX = {x:[1, 0, 0], y:[0, 1, 0], z:[0, 0, 1]}, AXI = ['x', 'y', 'z'];
  function hingeOf(part){
    var B = part.B, s = size(B), c = centre(B), d = part.door || {kind:'swing', hinge:'front'};
    var t = s[0] <= s[1] && s[0] <= s[2] ? 0 : s[1] <= s[2] ? 1 : 2;           /* the door's thin direction: it faces along this axis */
    var hinge = d.hinge, kind = d.kind || 'swing';
    if (part.mirrored && (hinge === 'outer' || hinge === 'inner')) hinge = hinge;   /* outer/inner are already symmetric */
    if (kind === 'ramp') hinge = 'bottom';
    var hAxis = {front:2, back:2, top:1, bottom:1, outer:0, inner:0}[hinge]; if (hAxis == null){ hAxis = 2; hinge = 'front'; }
    if (hAxis === t) hAxis = t === 1 ? 2 : 1;                                     /* a hinge along the face it faces is not a hinge: pick the next edge */
    var pv = c.slice();
    if (hinge === 'front') pv[2] = B.mx[2]; else if (hinge === 'back') pv[2] = B.mn[2]; else if (hinge === 'top') pv[1] = B.mx[1]; else if (hinge === 'bottom') pv[1] = B.mn[1];
    else if (hinge === 'outer') pv[0] = c[0] >= 0 ? B.mx[0] : B.mn[0]; else pv[0] = c[0] >= 0 ? B.mn[0] : B.mx[0];
    if (hAxis === 2 && (hinge === 'top' || hinge === 'bottom' || hinge === 'outer' || hinge === 'inner')){}
    var turn = [0, 1, 2].filter(function(i){ return i !== t && i !== hAxis; })[0];
    return {t:t, hAxis:hAxis, pivot:pv, turn:turn, hinge:hinge, kind:kind};
  }
  /* the rig entry for a part: the machines/boats rig format {parent, pivot, turn | slide, range, rest, kind, note} */
  M.partRig = function(part, all){
    var B = part.B, c = centre(B), s = size(B), fn = part.fn, j;
    var spin = M.FUNCTIONS[fn].spin;
    if (spin){ j = {pivot:v3r(c), turn:AX[spin].slice(), range:[-3600, 3600], rest:0, kind:'spin', note:'spins with the engine'}; }
    else if (fn === 'rudder' || fn === 'elevator'){ j = {pivot:v3r([c[0], c[1], B.mx[2]]), turn:fn === 'rudder' ? [0, 1, 0] : [1, 0, 0], range:fn === 'rudder' ? [-30, 30] : [-25, 25], rest:0, kind:'steer', note:'turns about its front edge'}; }
    else if (fn === 'outboard'){ j = {pivot:v3r([c[0], B.mx[1] - 0.05, B.mx[2]]), turn:[0, 1, 0], range:[-35, 35], rest:0, kind:'steer', note:'steers the boat: swing the whole motor about Y'}; }
    else if (fn === 'sail'){ j = {pivot:v3r([c[0], c[1], B.mx[2]]), turn:[0, 1, 0], range:[-80, 80], rest:0, kind:'sail', note:'swings about the mast with the wind'}; }
    else {   /* doors */
      var h = hingeOf(part), kind = h.kind;
      if (kind === 'roll') j = {pivot:v3r(c), slide:[0, 1, 0], range:[0, r4(s[1]*0.95)], rest:0, kind:'door', door:'roll', note:'rolls up into the roof'};
      else if (kind === 'slide') j = {pivot:v3r(c), slide:[0, 0, -1], range:[0, r4(Math.max(s[2], s[0])*0.9)], rest:0, kind:'door', door:'slide', note:'slides back along the side'};
      else {
        /* open outward: try both directions and keep the one whose far edge moves away from the vehicle */
        var far = c.slice(); far[h.hAxis] = c[h.hAxis]*2 - h.pivot[h.hAxis];
        var out = h.t === 1 ? (c[1] > 1.0 || kind !== 'ramp' ? 1 : -1) : (c[h.t] >= 0 ? 1 : -1), ang = kind === 'ramp' ? 95 : h.hinge === 'top' ? 80 : 85, best = ang;
        var test = function(a){ var r = M.rotAxis([far[0]-h.pivot[0], far[1]-h.pivot[1], far[2]-h.pivot[2]], AX[AXI[h.turn]], a); return (r[h.t] + h.pivot[h.t] - far[h.t])*out; };
        if (kind === 'ramp') test = function(a){ var r = M.rotAxis([far[0]-h.pivot[0], far[1]-h.pivot[1], far[2]-h.pivot[2]], AX[AXI[h.turn]], a); return -(r[1] + h.pivot[1]); };
        best = test(ang) >= test(-ang) ? ang : -ang;
        j = {pivot:v3r(h.pivot), turn:AX[AXI[h.turn]].slice(), range:best > 0 ? [0, best] : [best, 0], rest:0, kind:'door', door:kind, open:best,
          note:kind === 'ramp' ? 'drops down to make a ramp: walk up it' : 'swings open about its ' + h.hinge + ' edge'};
      }
    }
    /* a propeller or rotor that sits in another moving part (the prop under an outboard) turns with it */
    j.parent = 'body';
    if (spin && all) all.order.forEach(function(k){ var q = all.parts[k]; if (q !== part && !M.FUNCTIONS[q.fn].spin && overlap(q.B, part.B, 0.05)) j.parent = k; });
    return j;
  };
  /* the part a vertex of an editor piece belongs to (a mirrored door has a left and a right part) */
  M.partNameOf = function(p, x){ var base = slug(p.name) || (p.fn + '_' + p.id); if (!p.mx) return base; var own = p.pos[0] >= 0 ? '_r' : '_l'; return base + ((x >= 0) === (p.pos[0] >= 0) ? own : (own === '_r' ? '_l' : '_r')); };
  M.rigParts = function(doc, MP){ MP = MP || M.movingParts(doc); var R = {}; MP.order.forEach(function(k){ R[k] = M.partRig(MP.parts[k], MP); }); return R; };
  /* the open pose for the Workshop's "Doors open" preview: every door at its open end */
  M.openPose = function(R){ var P = {}; for (var k in R) if (R[k].kind === 'door') P[k] = R[k].slide ? R[k].range[1] : R[k].open; return P; };

  /* ------------------------------------------------------------------ rooms: walk-in space */
  M.STAND = 1.75; M.CROUCH = 0.95; M.BASE_AREA = 4; M.CELL = 0.5;
  var FITTINGS = {seat:1, sleep:1, storage:1, room:1, tank:1, battery:1};
  M.roomsOf = function(doc, MP){
    MP = MP || M.movingParts(doc);
    var solids = [];
    doc.pieces.forEach(function(p){ if (p.hidden || p.g === 'wheel' || p.fn === 'room') return; boxesOf(p).forEach(function(B){ solids.push({id:p.id, fn:p.fn || '', B:B, fit:!!(FITTINGS[p.fn] || p.fitting), part:p.g === 'part'}); }); });
    var rooms = [];
    doc.pieces.forEach(function(p){
      if (p.fn !== 'room') return;
      boxesOf(p).forEach(function(R, ri){
        var s = size(R), area = s[0]*s[2], head = s[1], fy = R.mn[1], inner = {mn:[R.mn[0] + 0.03, R.mn[1] + 0.03, R.mn[2] + 0.03], mx:[R.mx[0] - 0.03, R.mx[1] - 0.03, R.mx[2] - 0.03]};
        var blockers = solids.filter(function(q){ return !q.fit && !q.part && overlap(q.B, inner); }).map(function(q){ return q.id; });
        /* floor: pieces whose top is at the floor, under the room */
        var cov = 0; solids.forEach(function(q){ if (q.part || q.B.mx[1] < fy - 0.1 || q.B.mx[1] > fy + 0.05) return;
          var ox = Math.max(0, Math.min(q.B.mx[0], R.mx[0]) - Math.max(q.B.mn[0], R.mn[0])), oz = Math.max(0, Math.min(q.B.mx[2], R.mx[2]) - Math.max(q.B.mn[2], R.mn[2])); cov += ox*oz; });
        var floor = Math.min(1, area > 0 ? cov/area : 0);
        /* the sides: covered by a wall, a door, or open */
        var doors = [], open = [];
        MP.order.forEach(function(k){ var q = MP.parts[k]; if (q.fn === 'door' && overlap(q.B, R, 0.15)) doors.push(k); });
        var SIDES = [['left', 0, -1], ['right', 0, 1], ['back', 2, -1], ['front', 2, 1], ['roof', 1, 1]];
        var sides = {};
        SIDES.forEach(function(sd){ var ax = sd[1], sg = sd[2], at = sg > 0 ? R.mx[ax] : R.mn[ax], u = [0, 1, 2].filter(function(i){ return i !== ax; }), n = 0, hit = 0, door = 0;
          for (var a = 0; a < 5; a++) for (var b = 0; b < 5; b++){ var q = [0, 0, 0]; q[ax] = at + sg*0.04; q[u[0]] = R.mn[u[0]] + (a + 0.5)/5*s[u[0]]; q[u[1]] = R.mn[u[1]] + (b + 0.5)/5*s[u[1]]; n++;
            var inB = function(B){ return q[0] >= B.mn[0] - 0.08 && q[0] <= B.mx[0] + 0.08 && q[1] >= B.mn[1] - 0.08 && q[1] <= B.mx[1] + 0.08 && q[2] >= B.mn[2] - 0.08 && q[2] <= B.mx[2] + 0.08; };
            if (doors.some(function(k){ return inB(MP.parts[k].B); })) door++; else if (solids.some(function(z){ return !z.part && inB(z.B); })) hit++; }
          sides[sd[0]] = door/n > 0.3 ? 'door' : hit/n > 0.6 ? 'wall' : 'open'; if (sides[sd[0]] === 'open' && sd[0] !== 'roof') open.push(sd[0]); });
        /* the way in: the biggest door (or open side); a walk-in needs one at least 5 ft 3 in tall */
        var entry = null, entryH = 0;
        doors.forEach(function(k){ var B = MP.parts[k].B, h = Math.min(B.mx[1], R.mx[1]) - Math.max(B.mn[1], R.mn[1]); if (h > entryH){ entryH = h; var c = centre(B); entry = [c[0], fy, c[2]]; } });
        if (!entry && open.length){ var o = open[0], c2 = centre(R); entry = o === 'left' ? [R.mn[0], fy, c2[2]] : o === 'right' ? [R.mx[0], fy, c2[2]] : o === 'back' ? [c2[0], fy, R.mn[2]] : [c2[0], fy, R.mx[2]]; entryH = head; }
        if (entry){ var cc = centre(R); entry = [entry[0] + Math.sign(cc[0] - entry[0])*Math.min(0.5, Math.abs(cc[0] - entry[0])), fy, entry[2] + Math.sign(cc[2] - entry[2])*Math.min(0.5, Math.abs(cc[2] - entry[2]))]; }
        /* floor cells a player can fill with base fittings: 1 ft 8 in squares not taken by seats, beds or anything in the way */
        var cells = [], C = M.CELL;
        for (var x = R.mn[0] + C/2; x <= R.mx[0] - C/2 + 1e-6; x += C) for (var z = R.mn[2] + C/2; z <= R.mx[2] - C/2 + 1e-6; z += C){
          var cell = {mn:[x - C/2 + 0.02, fy + 0.05, z - C/2 + 0.02], mx:[x + C/2 - 0.02, fy + Math.min(1.2, head - 0.1), z + C/2 - 0.02]};
          if (!solids.some(function(q){ return !q.part && overlap(q.B, cell); })) cells.push([r4(x), r4(z)]); }
        var stand = head >= M.STAND, walkIn = !!entry && (stand ? entryH >= 1.6 : entryH >= M.CROUCH);
        rooms.push({name:(slug(p.name) || 'room') + (ri ? '_' + ri : ''), id:p.id, min:v3r(R.mn), max:v3r(R.mx), floorY:r4(fy), headroom:r4(head), area:r4(area),
          stand:stand, crouch:head >= M.CROUCH, floor:r4(floor), doors:doors, open:open, sides:sides, entry:entry ? v3r(entry) : null, entryHeight:r4(entryH),
          blockers:blockers, cells:cells, walkIn:walkIn, mobileBase:walkIn && stand && area >= M.BASE_AREA && floor >= 0.6, baseSlots:Math.floor(cells.length*C*C)});
      });
    });
    return rooms;
  };
  /* the interior the game needs: rooms plus the walls to collide with while inside (boxes in the vehicle's own coordinates) */
  M.interiorOf = function(doc, MP){
    var rooms = M.roomsOf(doc, MP); if (!rooms.length) return null;
    var walls = [];
    doc.pieces.forEach(function(p){ if (p.hidden || p.g === 'wheel' || p.g === 'part' || p.fn === 'room' || FITTINGS[p.fn] || p.fitting) return;
      boxesOf(p).forEach(function(B){ if (rooms.some(function(r){ return overlap(B, {mn:r.min, mx:r.max}, 0.2); })) walls.push([v3r(B.mn), v3r(B.mx)]); }); });
    return {rooms:rooms.map(function(r){ var o = clone(r); delete o.blockers; delete o.id; return o; }), walls:walls,
      mobileBase:rooms.some(function(r){ return r.mobileBase; }), baseSlots:rooms.reduce(function(a, r){ return a + (r.mobileBase ? r.baseSlots : 0); }, 0),
      rule:'Rooms are in the vehicle\'s own coordinates (Y up, +Z forward). While a door is open (or a side is open) and the vehicle is stopped, a player at the entry can walk in: keep them inside min/max, standing on floorY, colliding with walls. A mobileBase room takes base fittings on its cells (one fitting per cell; beds take two); they move with the vehicle.'};
  };

  /* ------------------------------------------------------------------ coupling */
  M.couplingOf = function(doc){
    var o = {};
    doc.pieces.forEach(function(p){ if (p.fn !== 'hitch' && p.fn !== 'coupler') return; var B = M.boundsOf(raw(Object.assign(clone(p), {mx:false, mz:false}))); if (!B.ok) return; var c = centre(B);
      if (p.fn === 'hitch') o.hitch = {pos:v3r([c[0], B.mx[1], c[2]]), type:(p.hitch || {}).type || 'fifth'};
      else o.coupler = {pos:v3r([c[0], B.mn[1], c[2]]), type:(p.coupler || {}).type || 'kingpin'}; });
    return o.hitch || o.coupler ? o : null;
  };

  /* ------------------------------------------------------------------ mass (rough, for floating and flying) */
  /* kilograms per square metre of panel, by material (one face counted, as for salvage) */
  M.AREAL = {sheet:12, steel:40, glass:10, chrome:10, rubber:12, plastic:5, lamp:4, cloth:1.5, wood:14};
  M.massOf = function(doc){
    var m = {shell:0, parts:0, kit:0, wheels:0}, nWheels = 0, F = {};
    doc.pieces.forEach(function(p){
      if (p.g === 'wheel') return;
      if (p.hidden){
        var Bh = M.boundsOf(raw(p)), vol = Bh.ok ? size(Bh)[0]*size(Bh)[1]*size(Bh)[2] : 0, n = raw(p).length;
        if (p.fn === 'engine') m.kit += Math.max(40, vol*1100);
        else if (p.fn === 'gearbox' || p.fn === 'axle') m.kit += 45*n;
        else if (p.fn === 'tank') m.kit += 25*n;
        else if (p.fn === 'battery') m.kit += 18*n;
        else if (p.fn === 'seat') m.kit += 12*n;
        return;
      }
      var a = 0; raw(p).forEach(function(np){ M.faces(np).forEach(function(f){ a += M.area(f.pts); }); });
      var kg = a/2*(M.AREAL[p.m || M.guessMaterial(p.c)] || 12);
      if (p.fn === 'envelope') kg = a/2*0.4;   /* envelope fabric */
      if (p.g === 'part') m.parts += kg; else m.shell += kg;
      if (p.fn === 'engine') m.kit += 60; if (p.fn === 'outboard') m.kit += 30; if (p.fn === 'jet') m.kit += 150;
    });
    var AXL = M.axlesOf(doc); nWheels = AXL.length*2;
    var S = doc.setup || {}; m.wheels = nWheels*Math.max(4, 18*Math.pow((S.wheelR || 0.32)/0.32, 2)*((S.wheelW || 0.2)/0.2));
    var kg = m.shell + m.parts + m.kit + m.wheels, seats = M.functions(doc).seats.length;
    return {kg:Math.round(kg), lb:Math.round(kg*LB), crewKg:seats*85, split:{shell:Math.round(m.shell), moving:Math.round(m.parts), engineAndKit:Math.round(m.kit), wheels:Math.round(m.wheels)}};
  };

  /* ------------------------------------------------------------------ boats: how deep it sits and how many it carries */
  M.BLOCK = 0.85;   /* hull boxes are not full boxes: about this much of each is real hull */
  M.buoyancyOf = function(doc, mass){
    mass = mass || M.massOf(doc);
    var hulls = []; doc.pieces.forEach(function(p){ if (p.fn === 'hull') boxesOf(p).forEach(function(B){ hulls.push(B); }); });
    var guessed = !hulls.length, k = M.BLOCK;
    if (guessed){ var all = []; doc.pieces.forEach(function(p){ if (!p.hidden && p.g === 'body') all = all.concat(raw(p)); }); var BA = bbox(all); if (BA){ hulls = [BA]; k = 0.5; } }
    if (!hulls.length) return null;
    var bottom = Math.min.apply(null, hulls.map(function(B){ return B.mn[1]; })), top = Math.max.apply(null, hulls.map(function(B){ return B.mx[1]; }));
    var vol = function(h){ var v = 0; hulls.forEach(function(B){ var d = Math.min(h, B.mx[1]) - B.mn[1]; if (d > 0) v += (B.mx[0]-B.mn[0])*(B.mx[2]-B.mn[2])*d*k; }); return v; };
    var line = function(kg){ if (vol(top)*1000 < kg) return null; var lo = bottom, hi = top; for (var i = 0; i < 40; i++){ var mid = (lo + hi)/2; if (vol(mid)*1000 < kg) lo = mid; else hi = mid; } return hi; };
    var empty = line(mass.kg), crewed = line(mass.kg + 85), safeTop = top - 0.15;
    /* how many it carries: what the hull holds up with 6 in to spare, and no more than the US Coast Guard rule for small boats
       (length x beam in feet / 15) */
    var hb = {mn:[1e9, 0, 1e9], mx:[-1e9, 0, -1e9]}; hulls.forEach(function(B){ hb.mn[0] = Math.min(hb.mn[0], B.mn[0]); hb.mn[2] = Math.min(hb.mn[2], B.mn[2]); hb.mx[0] = Math.max(hb.mx[0], B.mx[0]); hb.mx[2] = Math.max(hb.mx[2], B.mx[2]); });
    var uscg = Math.floor((hb.mx[2] - hb.mn[2])*3.2808*(hb.mx[0] - hb.mn[0])*3.2808/15);
    var capacity = Math.max(0, Math.min(uscg, Math.floor((vol(safeTop)*1000 - mass.kg)/85)));
    return {guessed:guessed, bottom:r4(bottom), top:r4(top), waterline:empty == null ? null : r4(empty), waterlineCrewed:crewed == null ? null : r4(crewed),
      draught:crewed == null ? null : r4(crewed - bottom), freeboard:crewed == null ? null : r4(top - crewed), floats:empty != null, capacity:capacity, volumeM3:r4(vol(top))};
  };

  /* ------------------------------------------------------------------ aircraft: what lifts it */
  /* rules of thumb from real aircraft: a light helicopter carries about 18 kg per square metre of rotor disc (a Robinson R22 is
     about 14, a Bell 206 about 18); a light plane about 60 kg per square metre of wing (a Cessna 172 is about 68); helium lifts
     about 1 kg per cubic metre */
  M.DISC = 18; M.WING = 60; M.GAS = 1.0;
  M.liftOf = function(doc, mass){
    mass = mass || M.massOf(doc);
    var MP = M.movingParts(doc), rotors = [], tails = 0, props = 0, jets = 0, wingA = 0, gasV = 0, ctrl = {rudder:0, elevator:0};
    MP.order.forEach(function(k){ var q = MP.parts[k], s = size(q.B);
      if (q.fn === 'rotor') rotors.push(Math.max(s[0], s[2])/2); else if (q.fn === 'tailrotor') tails++; else if (q.fn === 'propeller') props++; else if (ctrl[q.fn] != null) ctrl[q.fn]++; });
    doc.pieces.forEach(function(p){ if (p.hidden && p.fn !== 'envelope') return;
      if (p.fn === 'jet') jets++;
      if (p.fn === 'wing') boxesOf(p).forEach(function(B){ wingA += (B.mx[0]-B.mn[0])*(B.mx[2]-B.mn[2]); });
      if (p.fn === 'envelope') boxesOf(p).forEach(function(B){ var s = size(B); gasV += s[0]*s[1]*s[2]*Math.PI/6; }); });
    var disc = rotors.reduce(function(a, r){ return a + Math.PI*r*r; }, 0), cls = doc.cls;
    var lift = {rotor:Math.round(disc*M.DISC), wing:Math.round(wingA*M.WING), gas:Math.round(gasV*M.GAS)};
    var total = cls === 'heli' || cls === 'gyro' ? lift.rotor + (cls === 'gyro' ? lift.wing : 0) : cls === 'airship' ? lift.gas : lift.wing + lift.gas;
    var need = mass.kg + mass.crewKg, F = M.functions(doc);
    var issues = [];
    if (cls === 'heli'){ if (!rotors.length) issues.push(['bad', 'No main rotor: give a set of blades the Main rotor job.']);
      if (rotors.length === 1 && !tails) issues.push(['bad', 'One main rotor and no tail rotor: it would spin round. Add a Tail rotor (or a second main rotor).']);
      if (!F.engine) issues.push(['bad', 'No engine to turn the rotor.']); }
    if (cls === 'gyro'){ if (!rotors.length) issues.push(['bad', 'No rotor: a gyrocopter lifts on a free-spinning rotor.']); if (!props) issues.push(['bad', 'No propeller to push it along.']); }
    if (cls === 'plane'){ if (!wingA) issues.push(['bad', 'No wings: give the wing pieces the Wing job.']); if (!props && !jets) issues.push(['bad', 'Nothing pushes it: add a Propeller or a Jet engine.']);
      if (props && !F.engine) issues.push(['bad', 'A propeller with no engine to turn it.']);
      if (!ctrl.elevator) issues.push(['warn', 'No elevator: it cannot climb or dive under control.']); if (!ctrl.rudder) issues.push(['warn', 'No rudder: it cannot turn well in the air.']);
      if (!M.axlesOf(doc).length && !doc.pieces.some(function(p){ return p.fn === 'skid'; })) issues.push(['warn', 'Nothing to land on: add landing gear (axles with wheels) or skids or floats.']); }
    if (cls === 'airship'){ if (!gasV) issues.push(['bad', 'No gas envelope: give the bag the Gas envelope job.']); if (!props) issues.push(['info', 'No propeller: it drifts with the wind like a balloon.']); }
    if ((cls === 'heli' || cls === 'gyro') && !doc.pieces.some(function(p){ return p.fn === 'skid'; }) && !M.axlesOf(doc).length) issues.push(['warn', 'Nothing to land on: add skids (Skid or float) or wheels.']);
    if (total && total < need) issues.push(['bad', 'Too heavy to fly: about ' + Math.round(need*LB) + ' lb with a pilot, and it lifts about ' + Math.round(total*LB) + ' lb. Make it lighter or the ' + (cls === 'airship' ? 'envelope bigger' : cls === 'plane' ? 'wings bigger' : 'rotor longer') + '.']);
    if (!F.seats.length) issues.push(['bad', 'No seat for a pilot.']);
    return {cls:cls, liftKg:total, needKg:need, spare:total - need, flies:total >= need && !issues.some(function(x){ return x[0] === 'bad'; }), split:lift, rotorR:rotors.map(r4), tailRotors:tails, propellers:props, jets:jets,
      wingM2:r4(wingA), gasM3:r4(gasV), controls:ctrl, issues:issues, cruiseMph:cls === 'airship' ? 35 : cls === 'heli' ? 110 : cls === 'gyro' ? 70 : jets ? 300 : 120};
  };

  /* ------------------------------------------------------------------ boats: what moves and steers it */
  M.waterIssues = function(doc, buoy){
    var F = M.functions(doc), MP = M.movingParts(doc), has = function(fn){ return doc.pieces.some(function(p){ return p.fn === fn; }); }, out = [];
    var motor = MP.order.some(function(k){ return MP.parts[k].fn === 'outboard'; }), prop = MP.order.some(function(k){ return MP.parts[k].fn === 'propeller'; }), sail = has('sail'), oars = has('oars');
    if (!buoy) out.push(['bad', 'No hull: add pieces, then mark the hull (Hull job) so the Workshop knows what floats.']);
    else if (!buoy.floats) out.push(['bad', 'It sinks: about ' + Math.round(M.massOf(doc).lb) + ' lb and the hull holds up about ' + Math.round(buoy.volumeM3*1000*LB) + ' lb. Make the hull bigger or the boat lighter.']);
    else { if (buoy.freeboard != null && buoy.freeboard < 0.12) out.push(['warn', 'Low in the water: only ' + Math.round(buoy.freeboard*39.37) + ' in above the waterline with one aboard. Waves will come in.']);
      if (buoy.guessed) out.push(['info', 'No Hull job: the Workshop guessed the hull from the whole body. Mark the hull for a truer waterline.']); }
    if (!motor && !prop && !sail && !oars) out.push(['bad', 'Nothing moves it: add an Outboard motor with a Propeller, a Sail, or Oars.']);
    if ((motor || prop) && !F.engine && !motor) out.push(['warn', 'A propeller with no engine: tag an Engine (an outboard counts as its own engine).']);
    if (prop && !motor && !has('rudder')) out.push(['warn', 'An inboard propeller needs a Rudder to steer.']);
    if (sail && !has('rudder') && !motor) out.push(['warn', 'A sailboat needs a Rudder to steer.']);
    if (!F.seats.length) out.push(['bad', 'No seat for whoever steers it.']);
    return out;
  };

  /* ------------------------------------------------------------------ exports */
  /* every colour as its own hex name, so a boat or aircraft pack is self-contained (no shared palette names) */
  function ownColours(doc, list, pal){ return list.map(function(np){ var q = clone(np); var h = M.colourHex(doc, pal, q.c).hex; q.c = M.customName(h); delete q._m; return q; }); }
  function paletteOf(lists){ var P = {}; lists.forEach(function(L){ L.forEach(function(q){ if (M.isCustom(q.c)) P[q.c] = '#' + q.c.slice(1); }); }); return P; }
  function shiftY(list, dy){ return list.map(function(np){ var q = clone(np); q.p = [q.p[0], r4(q.p[1] + dy), q.p[2]]; return q; }); }
  function moveRig(R, dy){ for (var k in R){ if (R[k].pivot) R[k].pivot = v3r([R[k].pivot[0], R[k].pivot[1] + dy, R[k].pivot[2]]); } return R; }
  function seatsOf(doc){ return M.functions(doc).seats; }

  var baseBuild = M.buildAsset, baseCheck = M.check;
  M.buildAsset = function(doc, DMG){
    var dom = M.domainOf(doc) || 'land';
    if (dom === 'land'){
      var A = baseBuild(doc, DMG), MP = M.movingParts(doc), R = M.rigParts(doc, MP);
      A.domain = 'land';
      if (MP.order.length){ A.model.parts = {}; MP.order.forEach(function(k){ A.model.parts[k] = MP.parts[k].natives; }); A.rig.parts = R;
        A.rig.partRule = 'Draw each of model.parts at rest beside the body. rig.parts[name] is the machines/boats rig: turn (degrees, right-hand rule about the axis through pivot) or slide (metres along the direction) within range; doors open to range end.';
        A.stats.parts = M.countTris([].concat.apply([], MP.order.map(function(k){ return MP.parts[k].natives; }))); A.stats.total += A.stats.parts; }
      var IN = M.interiorOf(doc, MP); if (IN) A.interior = IN;
      var CP = M.couplingOf(doc); if (CP) A.coupling = CP;
      var ms = M.massOf(doc); A.game.massLb = ms.lb; A.game.walkIn = !!(IN && IN.rooms.some(function(r){ return r.walkIn; })); A.game.mobileBase = !!(IN && IN.mobileBase); A.game.baseSlots = IN ? IN.baseSlots : 0;
      if (doc.cls === 'trailer') A.game.driveable = false;
      A.station = 'carshop'; A.size = sizeOf(doc, A);
      return A;
    }
    return buildCraft(doc, dom);
  };
  function sizeOf(doc, A){ var all = []; doc.pieces.forEach(function(p){ if (!p.hidden && p.g !== 'wheel') all = all.concat(raw(p)); }); var B = bbox(all); if (!B) return [0, 0, 0];
    var S = doc.setup || {}, AXL = M.axlesOf(doc), w = AXL.length ? Math.max(B.mx[0]-B.mn[0], 2*(AXL[0].track + (S.wheelW || 0.2)/2)) : B.mx[0]-B.mn[0];
    return [r4(w), r4(B.mx[1] - Math.min(0, B.mn[1])), r4(B.mx[2]-B.mn[2])]; }
  /* boats and aircraft */
  function buildCraft(doc, dom){
    M.syncAxles(doc);
    var pal = (M._palette && M._palette()) || ((root.SHAPED || {}).props || {}).palette || {};
    var MP = M.movingParts(doc), R = M.rigParts(doc, MP), F = M.functions(doc), mass = M.massOf(doc);
    var body = []; doc.pieces.forEach(function(p){ if (p.g === 'body' || p.g === 'bonnet' || p.g === 'boot') body = body.concat(M.toNative(p)); });
    var wheel = M.groupNative(doc, 'wheel'), sal = M.salvage(doc), IN = M.interiorOf(doc, MP), size = sizeOf(doc);
    var A = {type:'vehicle', domain:dom, id:doc.id, name:doc.name, cls:doc.cls, author:doc.author, notes:doc.notes, paint:clone(doc.paint), functions:F, salvage:sal, buildCost:M.buildCost(sal), size:size,
      station:dom === 'water' ? 'dock' : 'hangar', model:{body:body, damage:{}}, spec:{length:size[2], width:size[0], height:size[1]},
      game:{seats:F.seats.length, driveable:!!F.seats.length, rangeMiles:F.tanks ? 300 : 0, cargoSlots:Math.round(F.storageL/40), sleeps:F.sleep, massLb:mass.lb, power:F.engineL > 160 ? 'strong' : F.engineL > 70 ? 'normal' : F.engineL > 0 ? 'weak' : 'none'}};
    var models = {body:ownColours(doc, body, pal)}, rename = {}, used = {};
    /* boats: the boats pack's own part names, so the game's boat code drives a pack boat as it is (motor, prop, sail, rudder) */
    var NAMES = dom === 'water' ? {outboard:'motor', propeller:'prop', sail:'sail', rudder:'rudder'} : {rotor:'rotor', tailrotor:'tail_rotor', propeller:'prop', rudder:'rudder', elevator:'elevator'};
    MP.order.forEach(function(k){ var fn = MP.parts[k].fn, nm = NAMES[fn] && !used[NAMES[fn]] ? NAMES[fn] : k; used[nm] = 1; rename[k] = nm; });
    var rig = {body:{pivot:[0, 0, 0]}};
    MP.order.forEach(function(k){ models[rename[k]] = ownColours(doc, MP.parts[k].natives, pal); var j = clone(R[k]); if (j.parent && j.parent !== 'body') j.parent = rename[j.parent]; rig[rename[k]] = j; });
    var seats = F.seats.map(v3r);
    if (dom === 'water'){
      var buoy = M.buoyancyOf(doc, mass), wl = buoy && buoy.waterline != null ? buoy.waterlineCrewed : 0;
      /* the boats pack puts the water line at y = 0 */
      for (var k2 in models) models[k2] = shiftY(models[k2], -wl);
      moveRig(rig, -wl); seats = seats.map(function(s){ return v3r([s[0], s[1] - wl, s[2]]); });
      var helm = seats[0] || [0, 0.4, 0];
      A.boat = {models:models, rig:rig, seats:seats, helm:helm, buoy:buoy ? Math.max(1, Math.min(buoy.capacity, 40)) : 0, draught:buoy && buoy.draught != null ? buoy.draught : 0, palette:paletteOf(Object.keys(models).map(function(k){ return models[k]; })),
        rule:'As the boats pack: water line at y = 0, bow +Z; parts at rest; rig is the boats rig (motor swings about Y to steer, prop spins about Z under it, sail and rudder turn about Y).'};
      A.water = buoy; A.game.capacity = A.boat.buoy; A.game.floats = !!(buoy && buoy.floats);
      if (IN) { IN.rooms.forEach(function(r){ r.min[1] = r4(r.min[1] - wl); r.max[1] = r4(r.max[1] - wl); r.floorY = r4(r.floorY - wl); if (r.entry) r.entry[1] = r4(r.entry[1] - wl); }); IN.walls.forEach(function(w){ w[0][1] = r4(w[0][1] - wl); w[1][1] = r4(w[1][1] - wl); }); }
    } else {
      var L = M.liftOf(doc, mass);
      if (wheel.length && M.axlesOf(doc).length){ models.wheel = ownColours(doc, wheel, pal); }
      var gearWheels = []; M.axlesOf(doc).forEach(function(a){ [-1, 1].forEach(function(sd){ gearWheels.push([r4(sd*a.track), doc.setup.wheelR, r4(a.z)]); }); });
      A.aircraft = {models:models, rig:rig, seats:seats, pilot:seats[0] || [0, 1, 0], wheels:gearWheels, kind:doc.cls, liftKg:L.liftKg, massKg:mass.kg, cruiseMph:L.cruiseMph,
        palette:paletteOf(Object.keys(models).map(function(k){ return models[k]; })),
        rule:'Bottom of the gear (or skids) at y = 0, nose +Z. Parts at rest; rotors spin about Y, tail rotors about X, propellers about Z (rig kind spin); rudder and elevator turn within range. Wheels: place the wheel model at each point as for cars. It can take off when liftKg >= massKg + 85 per person aboard.'};
      A.air = L; A.game.flies = L.flies; A.game.liftLb = Math.round(L.liftKg*LB); A.game.cruiseMph = L.cruiseMph;
    }
    if (IN) A.interior = IN;
    A.game.walkIn = !!(IN && IN.rooms.some(function(r){ return r.walkIn; })); A.game.mobileBase = !!(IN && IN.mobileBase); A.game.baseSlots = IN ? IN.baseSlots : 0;
    var lists = [body, wheel]; MP.order.forEach(function(k){ lists.push(MP.parts[k].natives); });
    A.palette = {}; lists.forEach(function(L2){ L2.forEach(function(q){ if (M.isCustom(String(q.c).replace(/_D$/, ''))) A.palette[String(q.c).replace(/_D$/, '')] = '#' + String(q.c).slice(1, 7); }); });
    A.stats = {body:M.countTris(body), wheel:M.countTris(wheel), parts:M.countTris([].concat.apply([], lists.slice(2)))};
    A.stats.total = A.stats.body + A.stats.parts + (A.aircraft ? A.aircraft.wheels.length*A.stats.wheel : 0);
    A.source = clone(doc);
    return A;
  }

  /* ------------------------------------------------------------------ checks for every domain */
  var LAND_ONLY = /axle|wheels stick out|wheel sits outside|nearly touches the ground|driven|steers|Only one axle|No engine|engine but no driven/i;
  M.check = function(doc, A){
    var dom = M.domainOf(doc) || 'land', out = [];
    if (dom === 'land'){
      out = baseCheck(doc, A);
      if (doc.cls === 'trailer') out = out.filter(function(x){ return !/No engine|No seats|No fuel tank|is driven but there is no engine|nothing steers|No axle steers/i.test(x[1]); });
    } else {
      out = baseCheck(doc, Object.assign({}, A, {spec:A.spec.width ? Object.assign({ground:1, nose:99, tail:-99}, A.spec) : A.spec})).filter(function(x){ return !LAND_ONLY.test(x[1]) && !/No seats|No fuel tank/.test(x[1]); });
      if (dom === 'water') M.waterIssues(doc, A.water).forEach(function(x){ out.unshift(x); });
      else (A.air ? A.air.issues : []).forEach(function(x){ out.unshift(x); });
    }
    /* trailers and semis */
    var cp = M.couplingOf(doc);
    if (doc.cls === 'trailer'){ if (!cp || !cp.coupler) out.unshift(['bad', 'A trailer needs a coupling: a Kingpin under the front (semi trailer) or a Tongue (small trailer).']); if (!M.axlesOf(doc).length) out.unshift(['bad', 'A trailer needs at least one axle.']); }
    if (doc.cls === 'semi' && (!cp || !cp.hitch)) out.unshift(['warn', 'A semi tractor needs a Fifth wheel hitch to pull a trailer.']);
    if (cp && cp.hitch && cp.coupler) out.push(['info', 'It has both a hitch and a coupling: it can be pulled and can pull (a dolly or a double).']);
    /* rooms */
    var IN = A.interior;
    (IN ? M.roomsOf(doc) : []).forEach(function(r){
      var nm = r.name.replace(/_/g, ' ');
      if (!r.crouch) out.push(['warn', 'The ' + nm + ' is only ' + Math.round(r.headroom*39.37) + ' in tall: too low to get into.']);
      else if (!r.stand) out.push(['info', 'The ' + nm + ' has ' + Math.round(r.headroom*39.37) + ' in of headroom: people crouch in it (5 ft 9 in to stand).']);
      if (!r.entry) out.push(['bad', 'There is no way into the ' + nm + ': add a Door touching it, or leave a side open.']);
      else if (!r.walkIn) out.push(['warn', 'The way into the ' + nm + ' is only ' + Math.round(r.entryHeight*39.37) + ' in tall.']);
      if (r.floor < 0.6) out.push(['warn', 'The ' + nm + ' has no floor under most of it (' + Math.round(r.floor*100) + '% covered).']);
      if (r.blockers.length) out.push(['warn', r.blockers.length + ' piece' + (r.blockers.length > 1 ? 's are' : ' is') + ' in the way inside the ' + nm + ' (seats, beds and storage are fine).']);
      if (r.mobileBase) out.push(['info', 'The ' + nm + ' is a mobile base: ' + r.baseSlots + ' floor spaces for beds, storage, benches and the like.']);
      else if (r.walkIn && r.stand && r.area < M.BASE_AREA) out.push(['info', 'The ' + nm + ' is walk-in but small (' + Math.round(r.area*10.764) + ' sq ft): a mobile base needs 43 sq ft.']);
    });
    /* doors that touch nothing: a door must be part of the vehicle */
    var MP = M.movingParts(doc);
    MP.order.forEach(function(k){ var q = MP.parts[k]; if (q.fn === 'door' && !doc.pieces.some(function(p){ return p.g !== 'part' && !p.hidden && p.g !== 'wheel' && boxesOf(p).some(function(B){ return overlap(B, q.B, 0.03); }); })) out.push(['warn', 'The door "' + k.replace(/_/g, ' ') + '" does not touch the body.']); });
    /* the station it is built at */
    var STN = root.AFTERSTREET_STATIONS || (typeof require !== 'undefined' ? (function(){ try { return require('./stations.js'); } catch (e){ return null; } })() : null);
    if (STN && A.size){ var key = STN.forDoc(doc), fit = STN.fits(key, A.size); if (!fit.ok) out.push(['warn', 'Too big for a ' + STN[key].label.toLowerCase() + ' (' + fit.why.join(', ') + '): it can be made here and exported in a pack, but not built at a ' + STN[key].label.toLowerCase() + ' in the game.']); }
    return out;
  };

  /* ------------------------------------------------------------------ starting designs for the new domains */
  M.blankCraft = function(domain, cls){
    var d = M.blankDoc(); d.domain = domain; d.cls = cls || M.CLASSES[domain][0][0];
    var add = function(s, pos, o){ var p = M.addPiece(d, s, pos, o); if (o && o.fn) M.setJob(p, o.fn); return p; };
    if (domain === 'land'){ d.name = 'My ' + (M.CLASSES.land.filter(function(c){ return c[0] === d.cls; })[0] || ['', 'vehicle'])[1].toLowerCase(); return d; }
    d.pieces = d.pieces.filter(function(p){ return p.fn !== 'axle'; }); d.setup.axles = [];
    if (domain === 'water'){
      d.pieces = []; d.name = 'My boat'; d.paint = {paint1:'#4e6a52', paint2:'#c9c3b6', paint3:'#7a4a2a'};
      add('box', [0, 0.04, 0], {d:[1.3, 0.08, 3.4], c:'paint1', m:'sheet', name:'bottom'});
      add('box', [0.63, 0.3, 0], {d:[0.06, 0.5, 3.4], c:'paint1', m:'sheet', mx:true, name:'side'});
      add('wedge', [0, 0.3, 1.95], {d:[1.32, 0.5, 0.5], c:'paint1', m:'sheet', name:'bow'});
      add('box', [0, 0.3, -1.68], {d:[1.32, 0.5, 0.06], c:'paint1', m:'sheet', name:'transom'});
      add('box', [0, 0.34, 0], {d:[1.2, 0.5, 3.3], c:'paint2', fn:'hull', hidden:true, name:'hull'});
      add('box', [0, 0.36, -1.1], {d:[1.2, 0.05, 0.3], c:'paint3', m:'wood', fn:'seat', name:'stern seat'});
      add('box', [0, 0.36, 0.5], {d:[1.2, 0.05, 0.3], c:'paint3', m:'wood', fn:'seat', name:'middle seat'});
      add('box', [0, 0.62, -1.86], {d:[0.22, 0.42, 0.3], c:'black', m:'plastic', fn:'outboard', name:'outboard'});
      add('box', [0, 0.26, -1.9], {d:[0.08, 0.34, 0.1], c:'black', m:'steel', fn:'outboard', name:'outboard'});
      add('box', [0, 0.1, -1.965], {d:[0.26, 0.26, 0.03], c:'chrome', m:'steel', fn:'propeller', name:'prop'});
      add('box', [0, 0.52, -1.82], {d:[0.18, 0.18, 0.18], c:'underside', m:'steel', fn:'engine', hidden:true, name:'engine'});
      return d;
    }
    /* air */
    d.pieces = []; d.paint = {paint1:'#b23a2a', paint2:'#e8e2d6', paint3:'#2a2a2a'};
    if (d.cls === 'airship'){
      d.name = 'My airship';
      add('tube', [0, 0, 0], {s:'loft', ax:'z', n:12, r:[[0, 6.2, -10, 0, 0], [0, 6.2, -8, 3, 3], [0, 6.2, -2, 4.6, 4.6], [0, 6.2, 4, 4.3, 4.3], [0, 6.2, 8.5, 2.2, 2.2], [0, 6.2, 10, 0, 0]], c:'paint2', m:'cloth', fn:'envelope', name:'envelope'});
      add('bev', [0, 1.2, 0], {d:[1.4, 1.2, 3.2], c:'paint1', name:'gondola'});
      add('box', [0, 1.75, 0], {d:[0.08, 0.3, 0.08], c:'underside', m:'steel', name:'strut'});
      add('box', [0, 1.0, 0.9], {d:[0.5, 0.1, 0.5], c:'seat', m:'cloth', fn:'seat', name:'pilot seat'});
      add('box', [0, 1.2, -1.4], {d:[0.5, 0.4, 0.5], c:'underside', m:'steel', fn:'engine', hidden:true, name:'engine'});
      add('box', [0, 1.2, -1.62], {d:[1.4, 0.12, 0.04], c:'black', m:'wood', fn:'propeller', name:'prop'});
      add('box', [0, 6.2, -9.0], {d:[0.06, 3.0, 1.6], c:'paint1', fn:'rudder', name:'rudder'});
      add('box', [0, 0.45, 0], {d:[1.0, 0.3, 2.4], c:'underside', m:'sheet', fn:'skid', name:'skid'});
      return d;
    }
    if (d.cls === 'plane'){
      d.name = 'My plane';
      d.pieces = M.makeWheel(d, 0.22, 0.12); d.setup.wheelR = 0.22; d.setup.wheelW = 0.12;
      add('bev', [0, 1.05, 0], {d:[1.1, 1.1, 4.8], c:'paint2', name:'fuselage'});
      add('box', [0, 1.62, 0.2], {d:[10.4, 0.12, 1.7], c:'paint2', fn:'wing', name:'wing'});
      add('bev', [0, 1.1, -3.0], {d:[0.5, 0.5, 1.4], c:'paint2', name:'tail cone'});
      add('box', [0, 1.1, -3.0], {d:[3.2, 0.08, 0.8], c:'paint2', name:'tailplane'});
      add('box', [0, 1.1, -3.5], {d:[3.2, 0.06, 0.3], c:'paint1', fn:'elevator', name:'elevator'});
      add('box', [0, 1.75, -3.0], {d:[0.08, 1.2, 0.8], c:'paint1', name:'fin'});
      add('box', [0, 1.75, -3.5], {d:[0.06, 1.1, 0.3], c:'paint1', fn:'rudder', name:'rudder'});
      add('box', [0, 1.05, 2.42], {d:[1.8, 0.16, 0.05], c:'black', m:'wood', fn:'propeller', name:'prop'});
      add('box', [0, 1.05, 1.8], {d:[0.7, 0.6, 0.8], c:'underside', m:'steel', fn:'engine', hidden:true, name:'engine'});
      add('box', [0, 0.95, 0.5], {d:[0.5, 0.1, 0.5], c:'seat', m:'cloth', fn:'seat', name:'pilot seat'});
      add('box', [0.55, 1.3, 0.5], {d:[0.04, 0.5, 0.9], c:'glass', m:'glass', mx:true, name:'side window'});
      add('box', [0, 0.45, 1.6], {d:[0.08, 0.5, 0.08], c:'underside', m:'steel', name:'nose leg'});
      add('box', [0.5, 0.45, -0.1], {d:[0.08, 0.6, 0.08], c:'underside', m:'steel', mx:true, name:'main leg'});
      M.makeAxle(d, 1.6, {steer:true, track:0.12, name:'nose gear'}); M.makeAxle(d, -0.1, {track:0.75, name:'main gear'});
      d.setup.axles = [1.6, -0.1];
      return d;
    }
    d.name = d.cls === 'gyro' ? 'My gyrocopter' : 'My helicopter';
    add('bev', [0, 1.15, 0.3], {d:[1.5, 1.5, 2.4], c:'paint1', name:'cabin'});
    add('box', [0, 1.55, 0.95], {d:[1.3, 0.8, 0.9], c:'glass', m:'glass', name:'windscreen'});
    add('box', [0, 1.4, -2.2], {d:[0.3, 0.3, 3.2], c:'paint1', name:'tail boom'});
    add('box', [0, 1.85, -3.7], {d:[0.06, 0.9, 0.5], c:'paint1', name:'fin'});
    add('cyl', [0, 2.0, 0.2], {d:[0.18, 0.3, 0.18], c:'underside', m:'steel', name:'mast'});
    add('box', [0, 2.2, 0.2], {d:[8.4, 0.05, 0.28], c:'black', m:'steel', fn:'rotor', name:'rotor'});
    add('cyl', [0, 2.2, 0.2], {d:[0.3, 0.12, 0.3], c:'underside', m:'steel', fn:'rotor', name:'rotor'});
    if (d.cls === 'gyro') add('box', [0, 1.2, -1.0], {d:[1.6, 0.14, 0.05], c:'black', m:'wood', fn:'propeller', name:'prop'});
    else add('box', [0.12, 1.85, -3.7], {d:[0.03, 1.1, 0.14], c:'black', m:'steel', fn:'tailrotor', name:'tail rotor'});
    add('box', [0.55, 0.12, 0.3], {d:[0.08, 0.08, 2.6], c:'underside', m:'steel', mx:true, fn:'skid', name:'skid'});
    add('box', [0.55, 0.3, 0.3], {d:[0.06, 0.3, 0.06], c:'underside', m:'steel', mx:true, name:'skid strut'});
    add('box', [0, 0.65, 0.3], {d:[1.1, 0.15, 1.6], c:'underside', m:'steel', name:'floor'});
    add('box', [0.3, 0.85, 0.5], {d:[0.45, 0.1, 0.45], c:'seat', m:'cloth', fn:'seat', mx:true, name:'seat'});
    add('box', [0, 1.4, -0.8], {d:[0.7, 0.5, 0.6], c:'underside', m:'steel', fn:'engine', hidden:true, name:'engine'});
    return d;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : this);
