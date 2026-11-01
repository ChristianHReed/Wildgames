/* Builds packs/afterstreet-tools.js: held digging and fuel tools from ART_REQUESTS_FINISH section 2 (pickaxe, trowel, jerry can, big wrench), each with
   new / worn / broken states and grip, offhand and strike points. Origin = the right fist, +Z out of the fist, Y up. Run: node workshop/tools/make_held_tools.js */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); require(root + 'assets/shaped/held.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var pack = M.newPack({id:'afterstreet-tools', name:'AfterStreet tools: pickaxe, trowel, jerry can, big wrench', author:'AfterStreet content chat', licence:'MIT', notes:'Held tools for digging, fuel and wheel changes.'});
var C = function(h){ return M.customName(h); };
var K = {hickory:C('#a07a46'), hickoryD:C('#7a5a32'), steelH:C('#8a9096'), steelHD:C('#5e646a'), jerry:C('#4a5a38'), jerryD:C('#36442a'), cap:C('#c8a232'), tape:C('#2a2a2c')};
function tool(name, label, note, I, build){
  var d = M.blankHeld(name); d.name = label; d.notes = note; d.author = 'AfterStreet content chat';
  var a = {
    box:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'box', [x, y, z], Object.assign({g:'new', d:[sx, sy, sz], c:c, m:'steel'}, o || {})); },
    bev:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'bev', [x, y, z], Object.assign({g:'new', d:[sx, sy, sz], c:c, m:'steel'}, o || {})); },
    wedge:function(x, y, z, sx, sy, sz, c, o){ return M.addPiece(d, 'wedge', [x, y, z], Object.assign({g:'new', d:[sx, sy, sz], c:c, m:'steel'}, o || {})); },
    cyl:function(x, y, z, r, len, c, o){ return M.addPiece(d, 'cyl', [x, y, z], Object.assign({g:'new', d:[r*2, r*2, len], ax:'z', c:c, m:'wood'}, o || {})); }
  };
  build(a); M.makeWorn(d); M.makeBroken(d);
  M.addPoint(d, 'grip', 'grip', [0, 0, 0], [0, 0, 1]); if (I.offhandAt != null) M.addPoint(d, 'offhand', 'offhand', [0, -0.02, I.offhandAt], [0, 0, 1]); if (I.strike) M.addPoint(d, 'strike', 'strike', I.strike, [0, -1, 0]);
  d.extra = [{path:['info', name], value:I}]; if (I.twoHanded) d.design.twoHanded = true;
  /* stock palette names the held palette lacks become custom colours */
  d.colours = d.colours || {}; d.pieces.forEach(function(p){ if (typeof p.c !== 'string' || /^x[0-9a-f]{6}/i.test(p.c)) return; var dk = /_D$/.test(p.c), n = p.c.replace(/_D$/, ''); if (SHAPED.held.palette[n]) return; var h = SHAPED.props.palette[n]; if (!h) return; var cn = M.customName(h); d.colours[cn] = h; p.c = cn + (dk ? '_D' : ''); });
  M.addModelToPack(pack, d);
}
tool('pickaxe', 'Pickaxe', 'A 90 cm pickaxe: hickory handle, forged double-pointed steel head with a pick and a chisel end; two hands; heavy chopping and breaking ground.', {length:0.95, ground:{roll:90, yaw:0, lift:0.03}, note:'two hands; overhead swing; the pick end (+Z) hits', offhandAt:0.34, strike:[0, 0.04, 0.78], twoHanded:true}, function(a){
  a.cyl(0, 0, 0.3, 0.019, 0.9, K.hickory); a.box(0, 0, -0.17, 0.045, 0.045, 0.05, K.hickoryD, {m:'wood'});
  a.box(0, 0.0, 0.76, 0.05, 0.06, 0.07, K.steelHD); a.wedge(0, 0.0, 0.93, 0.04, 0.05, 0.26, K.steelH, {rot:[0, 0, 0]}); a.wedge(0, 0.0, 0.62, 0.04, 0.05, 0.24, K.steelH, {rot:[0, 180, 0]}); a.box(0, 0, 0.74, 0.07, 0.07, 0.012, K.steelHD); });
tool('trowel', 'Trowel', 'A 28 cm pointing trowel with a wooden handle and a flat steel blade; one hand; fine digging and scraping.', {length:0.28, ground:{roll:0, yaw:0, lift:0.012}, note:'one hand; scoops soil; blade at +Z', strike:[0, 0, 0.26]}, function(a){
  a.cyl(0, 0, -0.01, 0.017, 0.11, K.hickory); a.box(0, 0, 0.05, 0.03, 0.03, 0.02, K.steelHD); a.box(0, 0, 0.09, 0.008, 0.01, 0.07, K.steelHD); a.bev(0, -0.004, 0.19, 0.075, 0.005, 0.16, K.steelH); a.wedge(0, -0.004, 0.285, 0.075, 0.005, 0.04, K.steelH, {rot:[0, 0, 0]}); });
tool('jerry_can', 'Jerry can', 'A 20 litre steel fuel can in olive green with three pressed ribs, a carry handle on top and a spout with a yellow cap; one hand.', {length:0.4, ground:{roll:0, yaw:0, lift:0.0}, note:'carry by the top handle; for siphoning and fuel; sloshes when walking', capacity:20}, function(a){
  a.box(0, -0.14, 0, 0.16, 0.34, 0.4, K.jerry, {m:'sheet'}); [-0.1, 0, 0.1].forEach(function(z){ a.box(0, -0.14, z, 0.168, 0.3, 0.012, K.jerryD, {m:'sheet'}); }); a.box(0, 0.03, 0, 0.14, 0.04, 0.38, K.jerryD, {m:'sheet'});
  a.box(0, 0.08, 0.0, 0.03, 0.04, 0.26, K.jerry, {m:'sheet'}); a.box(0, 0.12, 0.0, 0.03, 0.03, 0.26, K.jerryD, {m:'sheet'}); a.box(0, 0.03, 0.16, 0.05, 0.12, 0.05, K.jerryD, {m:'sheet', rot:[-35, 0, 0]}); a.cyl(0, 0.09, 0.205, 0.022, 0.05, K.cap, {m:'plastic'}); a.box(0, -0.14, -0.2, 0.17, 0.2, 0.01, K.tape, {m:'sheet'}); });
tool('wrench_big', 'Big wrench (lug)', 'A 50 cm four-way-less lug wrench: long steel shaft with a socket end and a flat pry end; one or two hands; changes wheels and bangs things.', {length:0.5, ground:{roll:90, yaw:0, lift:0.02}, note:'one hand; used for wheel changes; strike at the socket end', strike:[0, 0, 0.5], offhandAt:0.22}, function(a){
  a.cyl(0, 0, 0.22, 0.014, 0.46, K.steelH, {m:'steel'}); a.cyl(0, 0, 0.47, 0.03, 0.06, K.steelHD, {m:'steel'}); a.cyl(0, 0, 0.47, 0.018, 0.065, K.tape, {m:'steel'}); a.box(0, 0, -0.03, 0.03, 0.03, 0.08, K.tape, {m:'rubber'}); a.wedge(0, 0, -0.1, 0.012, 0.045, 0.06, K.steelHD); a.box(0, 0.02, -0.075, 0.012, 0.045, 0.02, K.steelHD); });
fs.writeFileSync(root + 'packs/afterstreet-tools.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-tools.js:', pack.assets.length, 'models');
