/* Builds every design in workshop/designs/ with the build library and checks it against the vehicle rules.
   Run: node workshop/tools/test_crafts.js [name ...] [--pack] [--verbose]
     --pack     also writes packs/workshop-crafts.js (every design that passes); the Workshop opens copies from it
     --verbose  prints every check, not only the problems
   Exit code 1 when a design has a 'bad' problem or breaks a rule below, so it can run before every push. */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED);
global.AFTERSTREET_STATIONS = require(root + 'workshop/stations.js');
var WSB = require(root + 'workshop/build.js'), D = require(root + 'workshop/damage.js'); D.setModel(M);
var args = process.argv.slice(2), want = args.filter(function(a){ return a[0] !== '-'; }), makePack = args.indexOf('--pack') >= 0, verbose = args.indexOf('--verbose') >= 0;
var dir = root + 'workshop/designs/', files = fs.readdirSync(dir).filter(function(f){ return /\.js$/.test(f) && (!want.length || want.indexOf(f.replace(/\.js$/, '')) >= 0); }).sort();

/* the rules a remade vehicle must keep, beyond the Workshop's own checks */
var EXPECT = {
  truck:{walkIn:true}, trailer:{walkIn:true, coupler:true}, rv:{walkIn:true, mobileBase:true}, bus:{walkIn:true},
  semi:{hitch:true}, houseboat:{walkIn:true, mobileBase:true, floats:true}, motorboat:{floats:true}, rowboat:{floats:true}, sailboat:{floats:true}, raft:{floats:true}, barge:{floats:true},
  heli:{flies:true}, plane:{flies:true}, gyro:{flies:true}, airship:{flies:true}
};
function rules(r){
  var A = r.asset, d = r.doc, e = EXPECT[d.cls] || {}, out = [], g = A.game || {};
  if (e.walkIn && !g.walkIn) out.push('a ' + d.cls + ' must have a walk-in room (a Room with a door or open side)');
  if (e.mobileBase && !g.mobileBase) out.push('a ' + d.cls + ' must be a mobile base (a walk-in room 5 ft 9 in tall and 43 sq ft)');
  if (e.floats && !(A.water && A.water.floats)) out.push('it must float');
  if (e.flies && !(A.air && A.air.flies)) out.push('it must be able to fly');
  if (e.hitch && !(A.coupling && A.coupling.hitch)) out.push('it needs a hitch');
  if (e.coupler && !(A.coupling && A.coupling.coupler)) out.push('it needs a coupling');
  /* every wheel sits on an axle: the wheel list is exactly the axles' hubs */
  if (A.domain === 'land' && A.rig.wheels.length !== M.axlesOf(d).length*2) out.push('wheels not on axles');
  if (A.domain === 'land' && !M.axlesOf(d).length) out.push('no axles');
  /* nothing loose */
  var loose = M.loosePieces(d); if (loose.length) out.push(loose.length + ' loose piece(s): ' + loose.map(function(id){ return d.pieces.filter(function(p){ return p.id === id; })[0].name || id; }).join(', '));
  /* every moving part has a rig, every door opens */
  var R = A.rig && A.rig.parts ? A.rig.parts : A.boat ? A.boat.rig : A.aircraft ? A.aircraft.rig : {};
  Object.keys(R).forEach(function(k){ if (k !== 'body' && !(R[k].turn || R[k].slide)) out.push('part ' + k + ' has no movement'); });
  /* the station can build it */
  var key = AFTERSTREET_STATIONS.forDoc(d), fit = AFTERSTREET_STATIONS.fits(key, A.size); if (!fit.ok) out.push('too big for the ' + key + ' (' + fit.why.join(', ') + ')');
  if (A.stats.total > 6000) out.push('too heavy for phones: ' + A.stats.total + ' triangles');
  return out;
}

var results = [], failed = 0;
files.forEach(function(f){
  var name = f.replace(/\.js$/, '');
  try {
    delete require.cache[require.resolve(dir + f)];
    var made = require(dir + f)(WSB); (Array.isArray(made) ? made : [made]).forEach(function(b){
      var r = b.finish(D), bad = r.bad.map(function(x){ return x[1]; }).concat(rules(r));
      r.file = f; r.problems = bad; results.push(r);
      var o = r.report, line = [o.id, o.domain + '/' + o.cls, o.size, o.massLb + ' lb', o.tris + ' tris'];
      if (o.axles) line.push(o.axles + ' axles ' + (o.drive || ''));
      if (o.doors) line.push(o.doors + ' doors');
      if (o.walkIn) line.push('walk-in' + (o.mobileBase ? ', mobile base ' + o.baseSlots + ' spaces' : ''));
      if (o.floats != null) line.push(o.floats ? 'floats, draught ' + o.draughtIn + ' in, carries ' + o.capacity : 'SINKS');
      if (o.flies != null) line.push((o.flies ? 'flies' : 'CANNOT FLY') + ' (lifts ' + o.liftLb + ' lb, needs ' + o.needLb + ' lb)');
      if (o.coupling) line.push(o.coupling);
      console.log((bad.length ? 'FAIL ' : 'ok   ') + line.join(' | '));
      if (o.rooms) console.log('       rooms: ' + o.rooms);
      bad.forEach(function(x){ console.log('       - ' + x); });
      if (verbose) r.checks.forEach(function(x){ console.log('       ' + x[0] + ': ' + x[1]); });
      else r.checks.filter(function(x){ return x[0] === 'warn'; }).forEach(function(x){ console.log('       warn: ' + x[1]); });
      if (bad.length) failed++;
    });
  } catch (e){ failed++; console.log('FAIL ' + name + ': ' + (e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }
});

/* a tractor and a trailer must couple: fifth wheel to kingpin, at about the same height */
var hitches = results.filter(function(r){ return r.asset.coupling && r.asset.coupling.hitch; }), couplers = results.filter(function(r){ return r.asset.coupling && r.asset.coupling.coupler; });
hitches.forEach(function(h){ couplers.forEach(function(c){ var H = h.asset.coupling.hitch, C = c.asset.coupling.coupler, ok = (M.COUPLES[H.type] || []).indexOf(C.type) >= 0, dy = Math.abs(H.pos[1] - C.pos[1]);
  console.log((ok && dy < 0.15 ? 'ok   ' : 'FAIL ') + 'couple ' + h.asset.id + ' (' + H.type + ' at ' + H.pos[1] + ' m) + ' + c.asset.id + ' (' + C.type + ' at ' + C.pos[1] + ' m)' + (ok ? '' : ': they do not fit') + (dy >= 0.15 ? ': heights differ by ' + Math.round(dy*39.37) + ' in' : ''));
  if (!(ok && dy < 0.15) && ok) failed++; }); });

/* the pack installs into the game's tables (cars, boats, aircraft) */
var good = results.filter(function(r){ return !r.problems.length; });
if (good.length){
  require(root + 'assets/shaped/boats.js'); require(root + 'assets/shaped/vehiclekit.js');
  global.AFTERSTREET_PACKS = []; var text = WSB.pack({id:'workshop-crafts', name:'Workshop vehicles', author:'AfterStreet content chat', licence:'MIT', notes:'Vehicles built with workshop/build.js: walk-in trucks and trailers, a semi, boats and aircraft.'}, good);
  require(root + 'packs/packload.js'); var P = global.AfterstreetPacks; P.add(P.parse(text)); P.install(SHAPED);
  console.log('pack: ' + Math.round(text.length/1024) + ' KB; installed ' + P.vehicles.length + ' land, ' + (P.boats || []).length + ' boats, ' + (P.aircraft || []).length + ' aircraft' + (P.errors.length ? '; errors: ' + P.errors.join('; ') : ''));
  if (P.errors.length) failed++;
  if (makePack){
    /* phones: the ten damage looks of each vehicle go to their own file (loaded when a vehicle is first hit), and the editable source to a file only the Workshop loads */
    var pk = P.parse(text), dmg = {}, src = {}, head = text.slice(0, text.indexOf('(window.')), nDmg = 0;
    pk.assets.forEach(function(a){
      if (a.model && a.model.damage && Object.keys(a.model.damage).length){ dmg[a.id] = a.model.damage; a.model.damage = {}; nDmg++; }
      if (a.source){ src[a.id] = a.source; delete a.source; }
    });
    var pre = function(what){ return '/* AfterStreet content pack "Workshop vehicles": ' + what + ' */\n'; };
    fs.writeFileSync(root + 'packs/workshop-crafts.js', head + '(window.AFTERSTREET_PACKS = window.AFTERSTREET_PACKS || []).push(' + JSON.stringify(pk) + ');\n');
    fs.writeFileSync(root + 'packs/workshop-crafts.damage.js', pre('damage looks, loaded by AfterstreetPacks.loadDamage the first time one of its vehicles is hit') + '(window.AFTERSTREET_PACK_DAMAGE = window.AFTERSTREET_PACK_DAMAGE || []).push(' + JSON.stringify({format:'afterstreet-pack-damage', pack:'workshop-crafts', damage:dmg}) + ');\n');
    fs.writeFileSync(root + 'packs/workshop-crafts.source.js', pre('editable designs, loaded only by the Workshop') + '(window.AFTERSTREET_PACK_SOURCE = window.AFTERSTREET_PACK_SOURCE || []).push(' + JSON.stringify({format:'afterstreet-pack-source', pack:'workshop-crafts', source:src}) + ');\n');
    console.log('wrote packs/workshop-crafts.js, .damage.js and .source.js (the game loads it once its name is in packs/index.js: the main chat adds it with walk-in rooms, trailers, boats and aircraft)');
  }
}
console.log(results.length + ' designs, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
