/* The stock boats, remade with the vehicle build library: a marked Hull block so they float at the right line,
   named motor / prop / sail / rudder / paddle parts the game's boat code drives, seats for the crew. Same sizes and looks. */
function open(b, id, name, cls, paint){ return WSBcreate(b, id, name, cls, paint); }
var WSBc; function WSBcreate(WSB, id, name, cls, paint){ return WSB.create({id:id + '_remade', name:name + ' (remade)', domain:'water', cls:cls, paint:{paint1:paint[0], paint2:paint[1], paint3:paint[2]}}); }
/* an open hull: bottom, two sides, bow wedge, transom, gunwales and the marked Hull block */
function hull(b, L, hw, h, o){ o = o || {}; var s = o.skin || 0.05, bow = o.bow || 0.45;
  b.box([-hw, 0, -L], [hw, s, L], {c:'paint1', m:'sheet', name:'bottom'});
  b.box([hw - s, 0, -L], [hw, h, L], {c:'paint1', m:'sheet', mx:true, name:'side'});
  b.block('wedge', [0, h/2, L + bow/2], [hw*2, h, bow], {c:'paint1', m:'sheet', name:'bow'});
  b.box([-hw, 0, -L - s], [hw, h, -L], {c:'paint1', m:'sheet', name:'transom'});
  b.box([hw - 0.12, h, -L], [hw, h + 0.06, L], {c:'paint2', m:'sheet', mx:true, name:'gunwale'});
  b.hull([-hw + s, 0, -L], [hw - s, h, L + bow*0.6]); }
function seatAt(b, z, w, nm, y){ return b.seat([0, y == null ? 0.3 : y, z], {size:[w, 0.05, 0.3], c:'paint3', name:nm}); }
function paddle(b, x, y, z, nm, len){ return b.block('box', [x, y, z], [len || 1.6, 0.04, 0.16], {c:'paint3', m:'wood', fn:'oars', name:nm || 'paddle'}); }
var DESIGNS = {
  kayak:function(b){ var L = 1.4, hw = 0.28; b.block('tube', [0,0,0], null, {s:'loft', ax:'z', n:10, r:[[0,0.05,-1.6,0,0],[0,0.08,-1.2,0.2,0.07],[0,0.1,-0.2,hw,0.1],[0,0.1,0.9,0.22,0.09],[0,0.12,1.6,0,0]], c:'paint1', m:'sheet', name:'hull shell'});
    b.hull([-0.26, 0, -1.4], [0.26, 0.2, 1.4]); b.box([-0.18, 0.08, -0.35], [0.18, 0.14, 0.3], {c:'paint2', name:'cockpit rim'}); b.seat([0, 0.1, -0.05], {size:[0.34, 0.05, 0.34], c:'paint3', name:'seat'});
    paddle(b, 0, 0.18, 0.3, 'paddle', 2.1); },
  canoe:function(b){ b.block('tube', [0,0,0], null, {s:'loft', ax:'z', n:10, r:[[0,0.1,-2.3,0,0],[0,0.1,-1.7,0.35,0.15],[0,0.12,0,0.5,0.22],[0,0.1,1.7,0.35,0.15],[0,0.12,2.3,0,0]], c:'paint1', m:'sheet', name:'hull shell'});
    b.hull([-0.46, 0, -2.2], [0.46, 0.45, 2.2]); seatAt(b, -1.1, 0.8, 'stern seat', 0.3); seatAt(b, 1.1, 0.8, 'bow seat', 0.3); paddle(b, 0, 0.35, -1.1, 'paddle', 1.2); },
  paddleboard:function(b){ b.box([-0.4, 0, -1.7], [0.4, 0.14, 1.5], {c:'paint1', m:'sheet', name:'board'}); b.block('wedge', [0, 0.07, 1.7], [0.8, 0.14, 0.4], {c:'paint1', m:'sheet', name:'nose'});
    b.hull([-0.38, 0, -1.7], [0.38, 0.14, 1.9]); b.seat([0, 0.16, 0], {size:[0.5, 0.04, 0.5], c:'paint2', name:'standing pad'}); paddle(b, 0, 0.17, 0.5, 'paddle', 1.7); },
  rowboat:function(b){ hull(b, 1.8, 0.7, 0.55, {bow:0.5}); seatAt(b, -1.1, 1.3, 'stern seat', 0.32); seatAt(b, 0, 1.3, 'rowing seat', 0.32); seatAt(b, 1.0, 1.3, 'bow seat', 0.32);
    paddle(b, 0.72, 0.6, 0, 'oar', 1.8); paddle(b, -0.72, 0.6, 0, 'oar', 1.8); b.rudder([-0.03, 0.05, -1.95], [0.03, 0.5, -1.85]); },
  jon_boat:function(b){ hull(b, 2.1, 0.7, 0.55, {bow:0.5}); seatAt(b, -1.5, 1.3, 'stern seat'); seatAt(b, 0.1, 1.3, 'middle seat'); seatAt(b, 1.4, 1.3, 'bow seat'); b.outboard([0, 0.45, -2.15], {height:0.8}); b.tank([0, 0.18, -1.0], [0.4, 0.25, 0.3]); },
  bass_boat:function(b){ hull(b, 2.6, 0.9, 0.7, {bow:0.6}); b.box([-0.88, 0.7, 0.8], [0.88, 0.76, 2.4], {c:'paint3', m:'sheet', name:'casting deck'}); b.box([-0.88, 0.4, 0.9], [0.88, 0.7, 0.95], {c:'paint1', name:'deck front'});
    seatAt(b, 0.0, 1.4, 'driver bench', 0.45); seatAt(b, -1.2, 1.4, 'rear bench', 0.45); b.box([0.3, 0.45, 0.4], [0.8, 1.0, 0.7], {c:'paint2', fitting:true, name:'console'}); b.outboard([0, 0.55, -2.65], {height:0.9}); b.tank([0, 0.18, -1.8], [0.5, 0.25, 0.4]); },
  runabout:function(b){ hull(b, 2.4, 0.9, 0.7, {bow:0.6}); b.box([-0.8, 0.7, 0.5], [0.8, 1.15, 0.58], {c:'glass', m:'glass', name:'windscreen'}); seatAt(b, 0.1, 1.5, 'front bench', 0.42); seatAt(b, -1.1, 1.5, 'rear bench', 0.42); b.outboard([0, 0.55, -2.45], {height:0.9}); b.tank([0, 0.18, -1.7], [0.5, 0.25, 0.4]); },
  fishing_boat:function(b){ hull(b, 3.0, 1.1, 0.9, {bow:0.8});
    b.box([-1.0, 0.9, -0.2], [1.0, 2.1, 1.4], {c:'paint1', name:'wheelhouse'}); b.box([-0.95, 1.3, 1.4], [0.95, 1.9, 1.46], {c:'glass', m:'glass', name:'wheelhouse glass'});
    b.box([-1.0, 2.1, -0.3], [1.0, 2.18, 1.5], {c:'paint2', name:'cabin roof'});
    seatAt(b, 0.9, 1.4, 'helm seat', 0.5); seatAt(b, -1.8, 1.8, 'stern bench', 0.4); b.outboard([0, 0.7, -3.05], {height:1.1}); b.tank([0, 0.2, -1.2], [0.7, 0.3, 0.6]); },
  jet_ski:function(b){ b.box([-0.5, 0, -1.4], [0.5, 0.35, 1.2], {c:'paint1', m:'sheet', name:'hull'}); b.block('wedge', [0, 0.18, 1.4], [1.0, 0.36, 0.4], {c:'paint1', m:'sheet', name:'bow'});
    b.box([-0.35, 0.35, -1.2], [0.35, 0.5, 0.3], {c:'paint2', name:'seat base'}); b.box([-0.25, 0.35, 0.3], [0.25, 0.6, 0.9], {c:'paint1', name:'steering housing'}); b.box([-0.3, 0.6, 0.55], [0.3, 0.66, 0.65], {c:'black', m:'plastic', name:'handlebar'});
    b.hull([-0.48, 0, -1.4], [0.48, 0.4, 1.4]); b.seat([0, 0.52, -0.6], {size:[0.36, 0.08, 0.9], c:'black', name:'saddle'});
    b.engine([0, 0.25, -0.5], [0.5, 0.3, 0.7]); b.tank([0, 0.2, 0.2], [0.4, 0.2, 0.4]); b.propeller([0, 0.12, -1.45], 0.12, {name:'prop'}); b.rudder([-0.05, 0.08, -1.62], [0.05, 0.28, -1.45]); },
  sailing_dinghy:function(b){ hull(b, 1.7, 0.7, 0.45, {bow:0.5}); seatAt(b, -0.5, 1.2, 'aft seat', 0.28); seatAt(b, 0.5, 1.2, 'fore seat', 0.28);
    b.block('cyl', [0, 1.7, 0.5], [0.08, 3.2, 0.08], {c:'chrome', m:'steel', name:'mast'}); b.box([-0.03, 0.55, -1.2], [0.03, 0.62, 0.5], {c:'paint3', m:'wood', name:'mast step rail'});
    b.box([-0.02, 0.4, -1.6], [0.02, 0.9, 0.5], {c:'paint2', fn:'sail', m:'cloth', name:'sail'}); b.box([-0.02, 0.95, 0.5], [0.02, 3.2, 0.55], {c:'paint2', m:'cloth', fn:'sail', name:'sail'});
    b.rudder([-0.03, 0.05, -1.95], [0.03, 0.55, -1.75]); b.box([-0.02, 0.9, -1.55], [0.02, 3.0, 0.5], {c:'paint2', m:'cloth', fn:'sail', name:'sail'}); },
  pontoon_boat:function(b){ [-1.0, 1.0].forEach(function(x){ b.block('tube', [x, 0.3, 0], [0.6, 0.6, 5.6], {c:'chrome', m:'steel', ax:'z', name:'pontoon'}); b.hull([x - 0.3, 0, -2.8], [x + 0.3, 0.6, 2.8]); });
    b.box([-1.5, 0.55, -2.8], [1.5, 0.65, 2.8], {c:'paint3', m:'wood', name:'deck'}); b.box([-1.5, 0.65, -2.8], [-1.44, 1.3, 2.8], {c:'paint1', name:'rail left'}); b.box([1.44, 0.65, -2.8], [1.5, 1.3, 2.8], {c:'paint1', name:'rail right'});
    [-1.4, 1.4].forEach(function(x){ [-2.6, 2.6].forEach(function(z){ b.box([x - 0.03, 1.3, z - 0.03], [x + 0.03, 2.4, z + 0.03], {c:'paint2', name:'canopy post'}); }); }); b.box([-1.6, 2.4, -2.8], [1.6, 2.46, 2.8], {c:'paint2', name:'canopy'});
    seatAt(b, 1.4, 2.4, 'bench front', 0.66); seatAt(b, -1.4, 2.4, 'bench rear', 0.66); seatAt(b, 0.2, 0.5, 'helm seat', 0.66); b.outboard([0, 0.65, -2.8], {height:1.0}); b.tank([0, 0.62, 0], [0.4, 0.1, 0.4]); },
  houseboat:function(b){ [-1.25, 1.25].forEach(function(x){ b.block('tube', [x, 0.38, 0], [0.7, 0.7, 10.6], {c:'chrome', m:'steel', ax:'z', name:'pontoon'}); b.hull([x - 0.35, 0, -5.3], [x + 0.35, 0.7, 5.3]); });
    b.box([-1.7, 0.7, -5.4], [1.7, 0.82, 5.4], {c:'paint3', m:'wood', name:'deck'});
    b.shell([-1.45, 0.82, -3.6], [1.45, 2.9, 3.4], {open:['front', 'back'], c:'paint1', floorC:'paint3', wall:0.06, floor:0.0001, name:'cabin', room:'cabin'});
    b.box([-1.45, 2.5, 3.4], [1.45, 2.9, 3.46], {c:'paint1', name:'front wall top'}); b.box([-1.45, 0.82, 3.4], [-0.45, 2.5, 3.46], {c:'paint1', name:'front wall left'}); b.box([0.45, 0.82, 3.4], [1.45, 2.5, 3.46], {c:'paint1', name:'front wall right'});
    b.door([-0.45, 0.82, 3.46], [0.45, 2.5, 3.5], {hinge:'outer', c:'paint2', name:'front door'});
    b.box([-1.45, 2.5, -3.66], [1.45, 2.9, -3.6], {c:'paint1', name:'back wall top'}); b.box([-1.45, 0.82, -3.66], [-0.45, 2.5, -3.6], {c:'paint1', name:'back wall left'}); b.box([0.45, 0.82, -3.66], [1.45, 2.5, -3.6], {c:'paint1', name:'back wall right'});
    b.door([-0.45, 0.82, -3.7], [0.45, 2.5, -3.66], {hinge:'outer', c:'paint2', name:'back door'}); b.box([1.51, 1.6, -2.5], [1.53, 2.3, 2.5], {c:'glass', m:'glass', mx:true, name:'windows'});
    b.bed([-0.8, 0.95, -2.4], [1.2, 0.25, 1.9], {name:'bunk'}); b.seat([0.9, 1.25, 2.6], {name:'helm seat'}); b.box([0.7, 0.82, 2.9], [1.3, 1.6, 3.3], {c:'paint3', m:'wood', fitting:true, name:'helm console'});
    b.box([-1.7, 0.82, 5.3], [1.7, 1.75, 5.4], {c:'chrome', m:'steel', name:'bow rail'}); b.outboard([0, 0.82, -5.4], {height:1.0}); b.tank([1.0, 1.0, -3.0], [0.4, 0.3, 0.4]); },
  ferry_barge:function(b){ b.box([-2.0, 0, -5.0], [2.0, 0.9, 5.0], {c:'paint1', m:'sheet', name:'barge hull'}); b.box([-2.0, 0.9, -5.0], [2.0, 1.0, 5.0], {c:'paint3', m:'wood', name:'deck'});
    b.box([-2.05, 1.0, -5.0], [-1.95, 1.6, 5.0], {c:'paint2', name:'rail left'}); b.box([1.95, 1.0, -5.0], [2.05, 1.6, 5.0], {c:'paint2', name:'rail right'}); b.box([-2.0, 1.0, -5.1], [2.0, 1.6, -5.0], {c:'paint2', name:'rail stern'});
    b.door([-1.9, 0.9, 5.0], [1.9, 1.05, 5.9], {kind:'ramp', c:'paint3', name:'ramp'}); b.hull([-2.0, 0, -5.0], [2.0, 0.9, 5.0]);
    b.box([-1.9, 1.0, -4.0], [-1.0, 2.6, -2.8], {c:'paint1', name:'wheelhouse'}); b.seat([-1.45, 1.2, -3.4], {name:'helm seat'}); b.outboard([-1.0, 0.7, -5.05], {height:1.2}); b.outboard([1.0, 0.7, -5.05], {height:1.2}); b.tank([0, 0.3, -4.0], [0.8, 0.3, 0.6]); },
  inflatable_raft:function(b){ b.block('tube', [0.75, 0.25, 0], [0.5, 0.5, 2.8], {c:'paint1', m:'cloth', ax:'z', mx:true, name:'tube side'}); b.block('tube', [0, 0.25, 1.4], [1.5, 0.5, 0.5], {c:'paint1', m:'cloth', ax:'x', name:'tube bow'}); b.block('tube', [0, 0.25, -1.4], [1.5, 0.5, 0.5], {c:'paint1', m:'cloth', ax:'x', name:'tube stern'});
    b.box([-0.6, 0, -1.4], [0.6, 0.06, 1.4], {c:'paint2', m:'cloth', name:'floor'}); b.hull([-0.9, 0, -1.6], [0.9, 0.5, 1.6]); seatAt(b, 0.0, 1.0, 'thwart', 0.4); paddle(b, 0.4, 0.48, 0, 'paddle', 1.5); },
  log_raft:function(b){ for (var i = -3; i <= 3; i++) b.block('tube', [i*0.3, 0.15, 0], [0.34, 0.34, 3.2], {c:'paint3', m:'wood', ax:'z', name:'log'}); b.box([-1.0, 0.28, -1.2], [1.0, 0.34, -1.0], {c:'paint3', m:'wood', name:'binding'}); b.box([-1.0, 0.28, 1.0], [1.0, 0.34, 1.2], {c:'paint3', m:'wood', name:'binding'});
    b.hull([-1.0, -0.05, -1.6], [1.0, 0.3, 1.6]); b.seat([0, 0.32, 0], {size:[0.5, 0.05, 0.4], c:'paint3', name:'seat'}); b.block('box', [0.6, 0.33, 0.2], [0.06, 0.06, 2.4], {c:'paint3', m:'wood', fn:'oars', name:'pole'}); },
  barrel_raft:function(b){ [[-0.5, -0.8], [0.5, -0.8], [-0.5, 0.8], [0.5, 0.8], [0, 0]].forEach(function(p){ b.block('tube', [p[0], 0.35, p[1]], [0.55, 0.6, 0.55], {c:'paint2', m:'steel', ax:'y', name:'barrel'}); });
    b.box([-1.0, 0.6, -1.3], [1.0, 0.68, 1.3], {c:'paint3', m:'wood', name:'deck'}); b.hull([-1.0, 0, -1.3], [1.0, 0.68, 1.3]); b.seat([0, 0.69, 0], {size:[0.6, 0.05, 0.4], c:'paint3', name:'seat'}); paddle(b, 0.4, 0.7, 0.4, 'paddle', 1.6); }
};
var META = {
  kayak:['Kayak','rowboat',['#c9552e','#2b2b2b','#c9c3b6']], canoe:['Canoe','rowboat',['#3e6a4e','#c9c3b6','#7a5a3a']], paddleboard:['Paddleboard','rowboat',['#3a8ac8','#c9c3b6','#2b2b2b']],
  rowboat:['Rowboat','rowboat',['#8a6a48','#c9c3b6','#5a4028']], jon_boat:['Jon boat','motorboat',['#5a6a52','#c9c3b6','#7a5a3a']], bass_boat:['Bass boat','motorboat',['#b8453a','#c9c3b6','#2b2b2b']],
  runabout:['Runabout','motorboat',['#e8e4da','#2f5f8a','#7a5a3a']], fishing_boat:['Fishing boat','motorboat',['#e8e4da','#2f5f8a','#7a5a3a']], jet_ski:['Jet ski','motorboat',['#2f5f8a','#e8e4da','#2b2b2b']],
  sailing_dinghy:['Sailing dinghy','sailboat',['#e8e4da','#c9552e','#7a5a3a']], pontoon_boat:['Pontoon boat','motorboat',['#c9c3b6','#2f5f8a','#7a5a3a']], houseboat:['Houseboat','houseboat',['#e6e0d2','#3e6a7a','#7a5a3a']],
  ferry_barge:['Ferry barge','barge',['#6a6a5a','#c9a23a','#7a5a3a']], inflatable_raft:['Inflatable raft','raft',['#d4602a','#3a3a3a','#7a5a3a']], log_raft:['Log raft','raft',['#7a5a3a','#5a4028','#7a5a3a']], barrel_raft:['Barrel raft','raft',['#8a8a8a','#3a6a8a','#7a5a3a']]
};
module.exports = function(WSB){ return Object.keys(META).map(function(k){ var m = META[k], b = WSBcreate(WSB, k, m[0], m[1], m[2]); DESIGNS[k](b); return b; }); };
