/* AfterStreet Workshop: damage made from the car itself.
   Given a car's game pieces, makes the same damage set the design chat makes by hand for the stock cars
   (props.js vehicles[name].damage), plus the wreck and the burnt-out shell:
     body_crumple_light, body_crumple_heavy, body_bumper_bent           replace body
     bonnet_crumple_light, bonnet_crumple_heavy, bonnet_buckled          replace bonnet
     windscreen_cracked, windscreen_missing, smoke, fire                 drawn on top
     wreck {body, bonnet, wheel}, burnt {body, bonnet, wheel}            whole cars, sunk by rigWreck/rigBurnt.sitDrop
   The game already knows when to show each one (docs/SHAPED.md, "Vehicle damage").

   How: every vertex of a piece in the crush zone is moved by a smooth push that grows towards the nose, with a little noise
   that depends only on the vertex position, so pieces that touch stay touching. Convex pieces stay one solid piece;
   tubes and plates become one plate per face. The piece's material says how much it dents (glass and lamps do not).
   Needs SHAPED and WSM (model.js). */
(function(root){
  var M = (typeof WSM !== 'undefined') ? WSM : (typeof window !== 'undefined' ? window.WSM : null);
  var D = {};
  D.setModel = function(m){ M = m; };
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function r4(v){ return Math.round(v*1e4)/1e4; }
  function v3r(a){ return [r4(a[0]), r4(a[1]), r4(a[2])]; }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  /* noise that depends only on where a corner is (and the seed) */
  function noise(q, seed, k){ var h = Math.sin(Math.round(q[0]*200)*12.9898 + Math.round(q[1]*200)*78.233 + Math.round(q[2]*200)*37.719 + seed*19.19 + (k||0)*4.7)*43758.5453; return (h - Math.floor(h))*2 - 1; }
  function bounds(pc){ return M.boundsOf([pc]); }
  function matOf(pc){ return pc._m || M.guessMaterial(pc.c); }
  function dentOf(pc){ var m = M.MATERIALS[matOf(pc)]; return m ? m.dent : 1; }

  /* move the corners of the pieces that touch a zone; pieces outside it stay as they are */
  function deform(pcs, inZone, fn, refine){
    var out = [];
    pcs.forEach(function(pc){
      var B = bounds(pc);
      if (!B.ok || !inZone(B)){ out.push(clone(pc)); return; }
      var dk = dentOf(pc);
      if (dk === 0){   /* glass and lamps move with the panel they sit in but do not crumple themselves: shift them by their middle's push */
        var mid = [(B.mn[0]+B.mx[0])/2, (B.mn[1]+B.mx[1])/2, (B.mn[2]+B.mx[2])/2], t = fn(mid, 1), dv = [t[0]-mid[0], t[1]-mid[1], t[2]-mid[2]];
        var q = clone(pc); q.p = v3r([pc.p[0]+dv[0], pc.p[1]+dv[1], pc.p[2]+dv[2]]); out.push(q); return;
      }
      out = out.concat(refine ? refined(pc, function(q){ return fn(q, dk); }, refine, inZone) : M.bakePiece(pc, function(q){ return fn(q, dk); }));
    });
    return out;
  }
  /* split a piece's faces into triangles no longer than 'edge' where they cross the zone, then move every corner:
     a long panel then bends where it is hit instead of just getting shorter. One plate per triangle. */
  function refined(pc, fn, edge, inZone){
    var tris = [];
    M.faces(pc).forEach(function(f){ for (var i = 1; i < f.pts.length - 1; i++) split([f.pts[0], f.pts[i], f.pts[i+1]], f.n, 0); });
    function split(t, n, depth){
      var L = [0,1,2].map(function(i){ var a = t[i], b = t[(i+1)%3]; return Math.abs(a[2]-b[2]); });   /* only spans along the car's length are split */
      var k = L[0] >= L[1] && L[0] >= L[2] ? 0 : L[1] >= L[2] ? 1 : 2;
      var mn = [0,1,2].map(function(i){ return Math.min(t[0][i], t[1][i], t[2][i]); }), mx = [0,1,2].map(function(i){ return Math.max(t[0][i], t[1][i], t[2][i]); });
      if (L[k] <= edge || depth > 7 || !inZone({mn:mn, mx:mx})){ tris.push({t:t, n:n}); return; }
      var a = t[k], b = t[(k+1)%3], c = t[(k+2)%3], m = [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2];
      split([a, m, c], n, depth + 1); split([m, b, c], n, depth + 1);
    }
    return tris.map(function(T){
      var P = T.t.map(fn), u = [P[1][0]-P[0][0], P[1][1]-P[0][1], P[1][2]-P[0][2]], v = [P[2][0]-P[0][0], P[2][1]-P[0][1], P[2][2]-P[0][2]];
      var n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]], l = Math.hypot(n[0], n[1], n[2]) || 1;
      n = [n[0]/l, n[1]/l, n[2]/l]; if (n[0]*T.n[0] + n[1]*T.n[1] + n[2]*T.n[2] < 0) n = [-n[0], -n[1], -n[2]];
      var q = plate(P, n, pc.c); if (pc.glow) q.glow = true; if (pc._m) q._m = pc._m; return q;
    });
  }

  /* ---------------------------------------------------------------- the crush shapes */
  function crumpleFn(sp, depth, push, seed){
    var z0 = sp.nose - depth, top = sp.hood, low = sp.ground;
    return function(q, dk){
      var u = clamp((q[2] - z0)/depth, 0, 1); if (u <= 0) return q;
      var n1 = noise(q, seed, 1), n2 = noise(q, seed, 2), n3 = noise(q, seed, 3), p = push*dk;
      var up = clamp((q[1] - low)/Math.max(0.2, top - low), 0, 1.4);
      return [q[0] + Math.sign(q[0])*p*0.14*u*(0.6 + 0.4*n2) + p*0.04*n3*u,
              q[1] - p*0.35*u*u*up + p*0.05*n1*u,
              q[2] - p*Math.pow(u, 1.6)*(0.78 + 0.22*n1)];
    };
  }
  function bumperFn(sp, seed, s){
    var z0 = sp.nose - 0.45, yTop = sp.bumperY + 0.28, hw = sp.width/2 || 0.9, side = noise([seed, 0, 0], seed) > 0 ? 1 : -1;
    return function(q, dk){
      var w = clamp((q[2] - z0)/0.45, 0, 1)*clamp((yTop - q[1])/0.15, 0, 1); if (w <= 0) return q;
      var t = clamp((side*q[0]/hw + 1)/2, 0, 1);
      return [q[0], q[1] - 0.045*s*t*w*dk, q[2] - 0.15*s*t*t*w*dk];
    };
  }
  function buckleFn(B, seed, s){
    var z0 = B.mn[2], z1 = B.mx[2], L = Math.max(0.2, z1 - z0);
    return function(q, dk){
      var u = clamp((q[2] - z0)/L, 0, 1), ridge = Math.sin(Math.PI*clamp(u*1.15, 0, 1));
      return [q[0]*(1 - 0.04*u), q[1] + 0.24*s*ridge*(0.85 + 0.15*noise(q, seed, 5))*(dk || 1), z0 + (q[2] - z0)*(1 - 0.28*s)];
    };
  }
  function dentFn(seed, amp){
    return function(q, dk){ return [q[0] + amp*dk*noise(q, seed, 7)*0.5, q[1] + amp*dk*noise(q, seed, 8), q[2] + amp*dk*noise(q, seed, 9)*0.5]; };
  }

  /* ---------------------------------------------------------------- the windscreen */
  /* the biggest glass face that looks forward: that is the windscreen */
  function windscreen(body){
    var best = null;
    body.forEach(function(pc){
      if (matOf(pc) !== 'glass') return;
      M.faces(pc).forEach(function(f){ if (f.n[2] < 0.25 || f.n[1] < -0.2) return; var a = M.area(f.pts); if (!best || a > best.a) best = {a:a, f:f}; });
    });
    return best && best.f;
  }
  function frame(f){
    var n = f.n, c = [0,0,0]; f.pts.forEach(function(q){ c[0] += q[0]/f.pts.length; c[1] += q[1]/f.pts.length; c[2] += q[2]/f.pts.length; });
    var u = [1,0,0], d = u[0]*n[0]; u = [u[0]-n[0]*d, u[1]-n[1]*d, u[2]-n[2]*d]; var l = Math.hypot(u[0],u[1],u[2]); u = [u[0]/l, u[1]/l, u[2]/l];
    var v = [n[1]*u[2]-n[2]*u[1], n[2]*u[0]-n[0]*u[2], n[0]*u[1]-n[1]*u[0]];
    var P2 = f.pts.map(function(q){ var r = [q[0]-c[0], q[1]-c[1], q[2]-c[2]]; return [r[0]*u[0]+r[1]*u[1]+r[2]*u[2], r[0]*v[0]+r[1]*v[1]+r[2]*v[2]]; });
    return {c:c, u:u, v:v, n:n, P2:P2, to3:function(x, y, off){ return [c[0]+u[0]*x+v[0]*y+n[0]*off, c[1]+u[1]*x+v[1]*y+n[1]*off, c[2]+u[2]*x+v[2]*y+n[2]*off]; }};
  }
  function inside(P, x, y){ var s = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++){ var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1]) + a[0]) s = !s; } return s; }
  function strip(F, x0, y0, x1, y1, w, col){
    var dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy/l*w/2, ny = dx/l*w/2;
    var pts = [F.to3(x0+nx, y0+ny, 0.004), F.to3(x0-nx, y0-ny, 0.004), F.to3(x1-nx, y1-ny, 0.004), F.to3(x1+nx, y1+ny, 0.004)];
    return plate(pts, F.n, col);
  }
  function plate(pts, n, col){ var c = [0,0,0]; pts.forEach(function(q){ c[0] += q[0]/pts.length; c[1] += q[1]/pts.length; c[2] += q[2]/pts.length; }); c = v3r(c);
    return {s:'decal', p:c, v:pts.map(function(q){ return v3r([q[0]-c[0], q[1]-c[1], q[2]-c[2]]); }), n:v3r(n), c:col}; }
  function cracked(f, seed){
    var F = frame(f), out = [], hit = [0, 0];
    var xs = F.P2.map(function(p){ return p[0]; }), ys = F.P2.map(function(p){ return p[1]; });
    var W = Math.max.apply(null, xs) - Math.min.apply(null, xs), H = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    hit = [W*0.22*(noise([seed,1,0], seed) > 0 ? 1 : -1), -H*0.12];
    var rays = 7 + Math.round(2*Math.abs(noise([seed,2,0], seed)));
    for (var i = 0; i < rays; i++){
      var a = i/rays*Math.PI*2 + 0.4*noise([i,seed,1], seed), L = (0.18 + 0.3*Math.abs(noise([i,seed,2], seed)))*Math.min(W, H*2);
      var x0 = hit[0], y0 = hit[1], seg = 3;
      for (var k = 0; k < seg; k++){
        var aa = a + 0.35*noise([i,k,seed], seed), x1 = x0 + Math.cos(aa)*L/seg, y1 = y0 + Math.sin(aa)*L/seg;
        if (!inside(F.P2, x1*1.04, y1*1.04)) break;
        out.push(strip(F, x0, y0, x1, y1, 0.008, 'crackGX'));
        x0 = x1; y0 = y1;
      }
    }
    /* a ring of short cracks round the hit */
    for (var j = 0; j < 6; j++){ var b0 = j/6*Math.PI*2, b1 = b0 + 0.8, rr = 0.07;
      out.push(strip(F, hit[0]+Math.cos(b0)*rr, hit[1]+Math.sin(b0)*rr, hit[0]+Math.cos(b1)*rr, hit[1]+Math.sin(b1)*rr, 0.007, 'crackGX')); }
    return out;
  }
  function missing(f, seed){
    var F = frame(f), out = [];
    var hole = F.P2.map(function(p){ var s = 0.93; return F.to3(p[0]*s, p[1]*s, 0.003); });
    out.push(plate(hole, F.n, 'black'));
    /* jagged shards left along the bottom edge */
    var ys = F.P2.map(function(p){ return p[1]; }), yb = Math.min.apply(null, ys), xs = F.P2.map(function(p){ return p[0]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    for (var i = 0; i < 5; i++){
      var cx = x0 + (x1 - x0)*(0.12 + 0.76*i/4) + 0.04*noise([i,seed,3], seed), y = yb*0.93 + 0.01, w = 0.09 + 0.03*noise([i,seed,4], seed), h = 0.07 + 0.05*Math.abs(noise([i,seed,5], seed));
      out.push(plate([F.to3(cx - w, y, 0.006), F.to3(cx + w, y, 0.006), F.to3(cx + 0.3*w*noise([i,seed,6], seed), y + h, 0.006)], F.n, 'glassBroken'));
    }
    return out;
  }

  /* ---------------------------------------------------------------- smoke and fire: the stock sedan's, moved to this car's bonnet */
  function borrowed(props, key, at){
    var S = props && props.models.vehicles.sedan, R = props && props.vehicleRig.sedan;
    if (!S || !S.damage || !S.damage[key]) return [];
    var o = R.smokeAt, d = [at[0]-o[0], at[1]-o[1], at[2]-o[2]];
    return S.damage[key].map(function(pc){ var q = clone(pc); q.p = v3r([pc.p[0]+d[0], pc.p[1]+d[1], pc.p[2]+d[2]]); return q; });
  }

  /* ---------------------------------------------------------------- recolouring wrecks and burnt shells */
  function recolour(pcs, map, seed){
    var out = [];
    pcs.forEach(function(pc, i){ var c = map(pc, noise(pc.p, seed, 11 + i%7)); if (c === null) return; var q = clone(pc); q.c = c; delete q.glow; out.push(q); });
    return out;
  }
  function wreckColour(pc, r){
    var c = String(pc.c).replace(/_D$/, ''), m = matOf(pc);
    if (m === 'wood') return /_D$/.test(pc.c) ? pc.c : pc.c + '_D';   /* old wood just darkens */
    if (/^paint/.test(c) || /^x[0-9a-f]{6}$/i.test(c) || m === 'sheet') return r > 0.3 ? 'rustD' : 'rustBody';
    if (m === 'glass') return 'glassBroken';
    if (m === 'lamp' || pc.glow) return 'black';
    if (m === 'chrome') return 'rust';
    return pc.c;
  }
  function burntColour(pc, r){
    var c = String(pc.c), m = matOf(pc);
    if (m === 'glass') return null;
    if (c === 'underside') return c;
    if (m === 'cloth') return 'ash';
    if (/^paint/.test(c) || /^x[0-9a-f]{6}$/i.test(c) || m === 'sheet') return r > -0.2 ? 'burntD' : 'burnt';
    return 'burntD';
  }

  /* ---------------------------------------------------------------- everything at once */
  D.generate = function(doc, nat, sp, rig, props){
    props = props || (typeof SHAPED !== 'undefined' && SHAPED.props) || (typeof window !== 'undefined' && window.SHAPED && window.SHAPED.props);
    var seed = (doc.dmg && doc.dmg.seed) || 7, s = (doc.dmg && doc.dmg.strength != null) ? doc.dmg.strength : 1;
    var body = nat.body, bonnet = nat.bonnet || [];
    var all = function(z0){ return function(B){ return B.mx[2] > z0; }; };
    var L = sp.length, light = Math.min(0.5, L*0.11), heavy = Math.min(1.0, L*0.22);
    var dmg = {};
    dmg.body_crumple_light = deform(body, all(sp.nose - light), crumpleFn(sp, light, 0.1*s, seed));
    dmg.body_crumple_heavy = deform(body, all(sp.nose - heavy), crumpleFn(sp, heavy, 0.32*s, seed), 0.4);
    dmg.body_bumper_bent = deform(body, function(B){ return B.mx[2] > sp.nose - 0.45 && B.mn[1] < sp.bumperY + 0.28; }, bumperFn(sp, seed, s));
    if (bonnet.length){
      var BB = M.boundsOf(bonnet);
      dmg.bonnet_crumple_light = deform(bonnet, all(sp.nose - light), crumpleFn(sp, light, 0.1*s, seed));
      dmg.bonnet_crumple_heavy = deform(bonnet, all(sp.nose - heavy), crumpleFn(sp, heavy, 0.32*s, seed), 0.4);
      dmg.bonnet_buckled = deform(bonnet, function(){ return true; }, buckleFn(BB, seed, s), 0.3);
    }
    var ws = windscreen(body);
    dmg.windscreen_cracked = ws ? cracked(ws, seed) : [];
    dmg.windscreen_missing = ws ? missing(ws, seed) : [];
    dmg.smoke = borrowed(props, 'smoke', rig.smokeAt);
    dmg.fire = borrowed(props, 'fire', rig.smokeAt);

    /* the wreck: dented all over, rusted, glass broken, tyres flat */
    var R = doc.setup.wheelR, dent = dentFn(seed + 3, 0.012*s);
    var wreck = {body:recolour(deform(body, function(){ return true; }, dent), wreckColour, seed)};
    if (bonnet.length) wreck.bonnet = recolour(deform(bonnet, function(){ return true; }, dent), wreckColour, seed);
    var flat = -0.8*R;
    wreck.wheel = [];
    nat.wheel.forEach(function(pc){
      if (matOf(pc) === 'rubber') wreck.wheel = wreck.wheel.concat(M.bakePiece(pc, function(q){ if (q[1] >= flat) return q; return [q[0]*1.12, flat + (q[1] - flat)*0.3, q[2]*1.04]; }));
      else { var q = clone(pc); q.c = matOf(pc) === 'steel' ? 'rust' : pc.c; wreck.wheel.push(q); }
    });
    var wreckDrop = r4(R - (-flat + 0.2*R*0.3));
    /* the burnt shell: charred, no glass, no tyres, sat on its rims */
    var burnt = {body:recolour(deform(body, function(){ return true; }, dentFn(seed + 5, 0.02*s)), burntColour, seed)};
    if (bonnet.length) burnt.bonnet = recolour(bonnet, burntColour, seed);
    burnt.wheel = []; var rimR = 0;
    nat.wheel.forEach(function(pc){ if (matOf(pc) === 'rubber') return; var q = clone(pc); q.c = 'burntRim'; burnt.wheel.push(q);
      M.faces(q).forEach(function(f){ f.pts.forEach(function(p){ rimR = Math.max(rimR, Math.hypot(p[1], p[2])); }); }); });
    if (!burnt.wheel.length){ burnt.wheel = [{s:'loft', p:[0,0,0], ax:'x', n:6, r:[[-0.1,0,0,R*0.33,R*0.33],[0.1,0,0,R*0.33,R*0.33]], c:'burntRim'}]; rimR = R*0.33; }
    var rigW = {wheels:rig.wheels.map(function(w){ return w.slice(); }), wheelAxis:'x', sitDrop:wreckDrop}, rigB = clone(rigW);
    rigB.sitDrop = r4(Math.max(0.05, Math.min(R*0.5, R - rimR)));
    if (rig.bonnetHinge){ rigW.bonnetHinge = rig.bonnetHinge.slice(); rigW.bonnetAxis = 'x'; rigB.bonnetHinge = rig.bonnetHinge.slice(); rigB.bonnetAxis = 'x'; }
    return {damage:dmg, wreck:wreck, burnt:burnt, rigWreck:rigW, rigBurnt:rigB};
  };

  /* the looks the game shows at each health, as docs/SHAPED.md describes: [replace body, replace bonnet, drawn on top] */
  D.LOOKS = [
    {key:'whole',    label:'Whole',                 body:null, bonnet:null, over:[]},
    {key:'knock',    label:'Knocked (70 to 40)',    body:'body_bumper_bent', bonnet:null, over:['windscreen_cracked']},
    {key:'light',    label:'Crumpled (40 to 15)',   body:'body_crumple_light', bonnet:'bonnet_crumple_light', over:['windscreen_cracked']},
    {key:'heavy',    label:'Smashed (under 15)',    body:'body_crumple_heavy', bonnet:'bonnet_buckled', over:['windscreen_cracked','smoke']},
    {key:'wrecked',  label:'Wrecked (0)',           body:'body_crumple_heavy', bonnet:'bonnet_buckled', over:['windscreen_missing']},
    {key:'burning',  label:'Burning',               body:'body_crumple_heavy', bonnet:'bonnet_buckled', over:['windscreen_missing','fire']},
    {key:'wreck',    label:'Old wreck (parked)',    whole:'wreck'},
    {key:'burnt',    label:'Burnt-out shell',       whole:'burnt'}
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.WSD = D;
})(typeof window !== 'undefined' ? window : this);
