/* Farm machines for the map builder's farm cluster: a drivable farm tractor, a combine harvester, and a boat trailer with a small boat.
   Same recipe as the other heavy designs (flat quads, silhouette first, glass is a thin tinted pane, driver on the left = +x). */
var R = require('./refs.js'), H = R.H;
var wheelLook = H.wheelLook, DK = H.DK, AMB = H.AMB, RED = H.RED;
function tractor(WSB){
  var G = '#3f7a42', Y = '#d8b02c', b = WSB.create({id:'farm_tractor', name:'Farm tractor', domain:'land', cls:'land', paint:{paint1:G, paint2:Y, paint3:'#2a2a28'}, topSpeed:35});
  var r = 0.62, hw = 1.0, fz = 1.35, rz = -1.0;
  b.wheels(r, 0.4); wheelLook(b, r, 0.4); b.axle(fz, {steer:true, track:hw - 0.2, name:'front axle'}); b.axle(rz, {driven:true, track:hw - 0.2, name:'rear axle'});
  b.box([-0.45, 0.5, -2.0], [0.45, 0.75, 2.2], {c:'underside', m:'steel', name:'chassis'}); b.engine([0, 1.1, 1.3], [0.7, 0.6, 1.0]); b.tank([0, 0.95, -0.5], [0.6, 0.3, 0.6]); b.battery([0.3, 0.95, 0.7]);
  /* engine hood, grille, weights */
  b.box([-0.42, 0.75, 0.55], [0.42, 1.5, 2.1], {c:'paint1', m:'steel', name:'engine hood'}); b.box([-0.4, 1.5, 0.55], [0.4, 1.58, 2.0], {c:'paint2', m:'steel', name:'hood top stripe'});
  b.box([-0.38, 0.85, 2.1], [0.38, 1.4, 2.16], {c:'paint3', m:'steel', name:'grille'}); for (var i = 0; i < 5; i++) b.box([-0.3 + i*0.15, 0.9, 2.16], [-0.26 + i*0.15, 1.35, 2.19], {c:'#8a8a82', m:'steel', name:'grille slat'});
  b.box([-0.35, 0.55, 2.16], [0.35, 0.85, 2.4], {c:'paint3', m:'steel', name:'front weight'}); [-1, 1].forEach(function(sx){ b.box([sx*0.3 - 0.12, 1.18, 2.15], [sx*0.3 + 0.12, 1.34, 2.2], {c:AMB, m:'plastic', name:'headlight'}); });
  b.light('headlight', [0.3, 1.26, 2.2], [0.14, 0.1, 0.04]);
  b.box([0.28, 1.58, 0.9], [0.36, 2.35, 0.98], {c:'paint3', m:'steel', name:'exhaust stack'});
  /* rear fenders over the big wheels (wheels sit at x = 0.8 +- 0.2) */
  b.box([0.62, 1.34, rz - 0.8], [1.15, 1.42, rz + 0.8], {c:'paint1', m:'steel', mx:true, name:'rear fender'}); b.box([0.62, 1.0, rz - 0.8], [0.68, 1.42, rz + 0.8], {c:'paint1', m:'steel', mx:true, name:'fender inner'});
  b.box([-0.5, 1.0, -1.4], [0.5, 1.32, -0.25], {c:'paint1', m:'steel', name:'cab floor housing'});
  /* open-sided cab: four posts, glass front and rear, roof */
  var cf = 0.45, cb = -1.45, fl = 1.32, rf = 3.0, cw = 0.58;
  [[-1, cf], [1, cf], [-1, cb], [1, cb]].forEach(function(p){ b.box([p[0]*cw - 0.03, fl, p[1] - 0.03], [p[0]*cw + 0.03, rf, p[1] + 0.03], {c:'paint1', m:'steel', name:'cab post'}); });
  b.box([-cw - 0.06, rf, cb - 0.06], [cw + 0.06, rf + 0.08, cf + 0.06], {c:'paint1', m:'steel', name:'cab roof'}); b.box([-cw, fl + 0.7, cf - 0.01], [cw, rf - 0.05, cf + 0.01], {c:'glassL', m:'glass', name:'windscreen'}); b.box([-cw, fl + 0.7, cb - 0.01], [cw, rf - 0.05, cb + 0.01], {c:'glassL', m:'glass', name:'rear window'});
  b.box([-cw - 0.02, fl + 0.7, cb], [-cw + 0.02, rf - 0.05, cf], {c:'glassL', m:'glass', name:'side window right'}); b.box([cw - 0.02, fl + 0.7, cb], [cw + 0.02, rf - 0.05, cf], {c:'glassL', m:'glass', name:'side window left'});
  b.box([-cw, fl, cb], [cw, fl + 0.05, cf], {c:'underside', m:'steel', name:'cab deck'});
  b.box([0.1, fl + 0.05, -0.8], [0.5, fl + 0.34, -0.4], {fitting:true, c:'#4a4640', m:'plastic', name:'seat pedestal'}); b.seat([0.3, fl + 0.4, -0.6], {size:[0.5, 0.12, 0.5], c:'#3a3a38', name:'driver seat'}); b.box([0.05, fl + 0.34, -0.88], [0.55, fl + 1.0, -0.82], {fitting:true, c:'#3a3a38', m:'cloth', name:'driver seat back'});
  b.box([0.3 - 0.02, fl + 0.05, -0.1], [0.3 + 0.02, fl + 0.95, 0.0], {fitting:true, c:DK, m:'plastic', name:'steering column'});
  b.box([-1.1, 0.35, -2.0], [1.1, 0.45, -1.8], {c:'paint3', m:'steel', name:'rear bar'}); b.box([-0.05, 0.4, -2.0], [0.05, 0.9, -1.75], {c:'paint3', m:'steel', name:'hitch drawbar'}); b.hitch([0, 0.5, -2.05], 'ball');
  b.box([-1.0, 0.45, -2.0], [-0.85, 0.5, -1.95], {c:RED, m:'plastic', name:'tail lamp right'}); b.box([0.85, 0.45, -2.0], [1.0, 0.5, -1.95], {c:RED, m:'plastic', name:'tail lamp left'});
  return b;
}
function combine(WSB){
  var G = '#c8382c', W = '#e8e4d8', b = WSB.create({id:'combine', name:'Combine harvester', domain:'land', cls:'land', paint:{paint1:G, paint2:W, paint3:'#2a2a28'}, topSpeed:25});
  var r = 0.85, hw = 1.65, fz = 1.6, rz = -2.4;
  b.wheels(r, 0.5); wheelLook(b, r, 0.5); b.axle(fz, {driven:true, steer:false, track:hw - 0.35, name:'front axle'}); b.axle(rz, {steer:true, track:hw - 0.5, name:'rear axle'});
  b.box([-1.0, 0.9, -3.3], [1.0, 1.3, 2.7], {c:'underside', m:'steel', name:'chassis'}); b.engine([0, 2.0, -2.6], [1.4, 0.8, 1.0]); b.tank([0, 1.6, -1.2], [1.2, 0.3, 0.8]); b.battery([1.0, 1.7, 0.2]);
  b.box([-1.4, 1.3, -3.2], [1.4, 3.3, 0.6], {c:'paint1', m:'steel', name:'grain body'}); b.box([-1.4, 3.3, -3.2], [1.4, 3.45, 0.6], {c:'paint2', m:'steel', name:'body roof'});
  b.box([-1.2, 1.3, 0.6], [1.2, 2.6, 2.4], {c:'paint1', m:'steel', name:'feeder housing'}); b.box([-1.4, 1.3, -3.4], [1.4, 2.0, -3.2], {c:'paint3', m:'steel', name:'rear engine cover'});
  /* grain tank and unloading auger */
  b.box([-1.3, 3.45, -2.9], [1.3, 3.9, 0.3], {c:'paint2', m:'steel', name:'grain tank top'}); b.box([1.0, 3.9, -0.5], [1.2, 4.2, -0.3], {c:'paint2', m:'steel', mx:false, name:'auger riser'}); b.block('cyl', [0.6, 4.2, -0.4], [0.3, 1.2, 0.3], {c:'paint2', m:'steel', rot:[0, 0, 90], name:'unloading auger'});
  /* cab on the front, glass all round */
  var cw = 1.0, cf = 2.5, cb = 0.65, fl = 2.3, rf = 4.0;
  b.box([-cw, fl, cb], [cw, fl + 0.08, cf], {c:'underside', m:'steel', name:'cab floor'});
  [[-1, cf], [1, cf], [-1, cb], [1, cb]].forEach(function(p){ b.box([p[0]*cw - 0.04, fl, p[1] - 0.04], [p[0]*cw + 0.04, rf, p[1] + 0.04], {c:'paint1', m:'steel', name:'cab post'}); });
  b.box([-cw - 0.06, rf, cb - 0.06], [cw + 0.06, rf + 0.1, cf + 0.08], {c:'paint2', m:'steel', name:'cab roof'}); b.box([-cw, fl + 0.7, cf - 0.01], [cw, rf - 0.05, cf + 0.01], {c:'glassL', m:'glass', name:'windscreen'});
  b.box([-cw + 0.01, fl + 0.7, cb + 0.05], [-cw + 0.03, rf - 0.05, cf - 0.05], {c:'glassL', m:'glass', name:'side window right'}); b.box([cw - 0.03, fl + 0.7, cb + 0.05], [cw - 0.01, rf - 0.05, cf - 0.05], {c:'glassL', m:'glass', name:'side window left'}); b.box([-cw, fl + 0.7, cb - 0.01], [cw, rf - 0.05, cb + 0.01], {c:'glassL', m:'glass', name:'rear window'});
  b.box([0.3, fl + 0.08, 1.1], [0.7, fl + 0.38, 1.5], {fitting:true, c:'#4a4640', m:'plastic', name:'seat pedestal'}); b.seat([0.5, fl + 0.45, 1.3], {size:[0.55, 0.12, 0.55], c:'#3a3a38', name:'driver seat'}); b.box([0.25, fl + 0.38, 1.0], [0.75, fl + 1.1, 1.06], {fitting:true, c:'#3a3a38', m:'cloth', name:'driver seat back'});
  /* header: wide cutting platform with a reel */
  b.box([-1.55, 1.0, 2.4], [1.55, 1.2, 3.8], {c:'paint1', m:'steel', name:'header floor'}); b.box([-1.55, 1.2, 2.4], [1.55, 1.9, 2.5], {c:'paint1', m:'steel', name:'header back'}); b.box([-1.55, 1.0, 3.8], [1.55, 1.3, 3.9], {c:'paint3', m:'steel', name:'cutter bar'});
  [-1, 1].forEach(function(sx){ b.box([sx*1.55 - (sx > 0 ? 0.1 : 0), 1.0, 2.4], [sx*1.55 + (sx > 0 ? 0 : 0.1), 1.9, 3.8], {c:'paint1', m:'steel', name:'header end'}); b.box([sx*1.5 - 0.04, 1.85, 2.8], [sx*1.5 + 0.04, 2.35, 3.0], {c:'paint3', m:'steel', name:'reel arm'}); });
  b.block('cyl', [0, 2.3, 2.95], [0.8, 3.0, 0.8], {c:'paint2', m:'steel', rot:[0, 0, 90], name:'reel'}); for (var i = 0; i < 6; i++) b.box([-1.4 + i*0.56, 2.0, 3.3], [-1.3 + i*0.56, 2.3, 3.4], {c:'paint3', m:'steel', name:'reel tine'});
  [-1, 1].forEach(function(sx){ b.box([sx*0.9 - 0.15, 1.4, 2.4], [sx*0.9 + 0.15, 1.7, 2.45], {c:AMB, m:'plastic', name:'work lamp'}); b.box([sx*1.4 - 0.08, 2.0, -3.4], [sx*1.4 + 0.08, 2.15, -3.38], {c:RED, m:'plastic', name:'tail lamp'}); });
  return b;
}
function boatTrailer(WSB){
  var b = WSB.create({id:'boat_trailer', name:'Boat trailer', domain:'land', cls:'trailer', paint:{paint1:'#8a8a86', paint2:'#e8e4d8', paint3:'#2a6a9a'}, topSpeed:60});
  b.wheels(0.33, 0.2); wheelLook(b, 0.33, 0.2); b.axle(-0.6, {driven:false, track:0.85, name:'trailer axle'});
  b.box([-0.08, 0.55, -2.4], [0.08, 0.7, 1.4], {c:'underside', m:'steel', name:'centre rail'}); b.box([-0.9, 0.55, -0.9], [0.9, 0.68, -0.8], {c:'underside', m:'steel', name:'cross member rear'}); b.box([-0.9, 0.55, 0.3], [0.9, 0.68, 0.4], {c:'underside', m:'steel', name:'cross member front'});
  b.box([-0.08, 0.57, 1.4], [0.08, 0.68, 2.9], {c:'underside', m:'steel', name:'tongue'}); b.coupler([0, 0.68, 2.92], 'tongue'); b.box([-0.08, 0.3, 1.3], [0.08, 0.57, 1.4], {c:'underside', m:'steel', name:'jockey wheel post'});
  [-1, 1].forEach(function(sx){ b.box([sx*0.55 - 0.05, 0.68, -2.0], [sx*0.55 + 0.05, 0.78, 1.1], {c:'#5a4a38', m:'wood', name:'bunk'}); b.box([sx*0.55 - 0.02, 0.5, -0.9], [sx*0.55 + 0.02, 0.68, -0.8], {c:'underside', m:'steel', name:'bunk post'}); });
  b.box([0.7, 0.2, -0.9 - 0.45], [0.8, 0.66, -0.9 + 0.45], {c:'underside', m:'steel', mx:true, name:'fender stay'});
  /* a small aluminium boat on the bunks: hull sides, bench seats and a pointed bow */
  b.box([-0.62, 0.78, -2.1], [-0.55, 1.2, 1.1], {c:'paint1', m:'steel', name:'boat side right'}); b.box([0.55, 0.78, -2.1], [0.62, 1.2, 1.1], {c:'paint1', m:'steel', name:'boat side left'}); b.box([-0.55, 0.78, -2.1], [0.55, 0.84, 1.1], {c:'paint1', m:'steel', name:'boat bottom'}); b.box([-0.62, 0.78, -2.12], [0.62, 1.2, -2.08], {c:'paint1', m:'steel', name:'boat transom'});
  /* a tarp cover over the boat, open at the back, so the boat can be climbed into and searched (the trailer class needs a way in) */
  b.shell([-0.62, 1.24, -2.1], [0.62, 2.2, 0.9], {open:['back'], c:'#4a6a8a', m:'cloth', floorC:'paint1', floorM:'steel', wall:0.03, floor:0.04, name:'boat cover', room:'boat'});
  b.block('box', [-0.5, 1.0, 1.3], [0.04, 0.42, 0.9], {c:'paint1', m:'steel', rot:[0, 25, 0], name:'bow right'}); b.block('box', [0.5, 1.0, 1.3], [0.04, 0.42, 0.9], {c:'paint1', m:'steel', rot:[0, -25, 0], name:'bow left'}); b.box([-0.6, 1.2, -2.1], [0.6, 1.24, 1.1], {c:'paint2', m:'steel', name:'gunwale cap'});
  [-0.9, -0.1].forEach(function(z){ b.box([-0.55, 0.98, z], [0.55, 1.02, z + 0.3], {c:'paint3', m:'steel', name:'bench seat'}); }); b.box([-0.3, 0.95, -2.5], [0.3, 1.25, -2.12], {c:'#2a2a28', m:'steel', name:'outboard'});
  [-1, 1].forEach(function(sx){ b.box([sx*0.45 - 0.1, 0.9, -2.14], [sx*0.45 + 0.1, 1.0, -2.1], {c:RED, m:'plastic', name:'tail lamp'}); });
  return b;
}
module.exports = function(WSB){ return [tractor, combine, boatTrailer].map(function(f){ return f(WSB); }); };
