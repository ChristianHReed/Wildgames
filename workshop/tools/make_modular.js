/* Builds packs/afterstreet-modular.js from workshop/tools/data/modular_parts.json (made by import_modular.py from the CC0 Quaternius
   Ultimate Modular Men / Women packs): a top, trousers, shoes and head with hair for each character, and a ready-made look for each.
   Run: python3 workshop/tools/import_modular.py <glb folder> && node workshop/tools/make_modular.js */
global.window = global;
var root = __dirname + '/../../', fs = require('fs');
require(root + 'assets/shaped/shapes.js'); require(root + 'assets/shaped/props.js'); require(root + 'assets/shaped/survivor.js');
var M = require(root + 'workshop/model.js'); M.setShaped(SHAPED); require(root + 'workshop/assets.js');
var data = JSON.parse(fs.readFileSync(__dirname + '/data/modular_parts.json', 'utf8'));
var pack = M.newPack({id:'afterstreet-modular', name:'AfterStreet modular people (from Quaternius, CC0)', author:'AfterStreet content chat',
  notes:'Re-posed and simplified versions of the CC0 Quaternius Ultimate Modular Men and Women characters, split into tops, trousers, shoes and heads with hair, with a ready-made player character for each. Source: https://quaternius.com/packs/ultimatemodularcharacters.html (CC0, credit given with thanks).'});
function layoutOf(by){ var L = {}; Object.keys(by).forEach(function(b){ L[b] = {$part:b}; }); return L; }
function docOf(slot, body, id, label, by){
  var d = M.importGarment(SHAPED, 'top', 'masculine', 'tshirt');
  d.pieces = []; d.parts = {}; d.points = []; d.extra = []; d.states = {}; delete d.from;
  d.id = id + (body ? '_' + body.charAt(0) : ''); d.name = label + (body ? ' (' + body + ')' : ''); d.author = 'Quaternius (CC0), converted by the AfterStreet content chat'; d.licence = 'CC0';
  d.target = {pack:'survivor', path:body ? ['parts', slot, body, id] : ['parts', slot, id]}; d.garment = {slot:slot, body:body || 'masculine', choice:id};
  d.layout = layoutOf(by);
  Object.keys(by).forEach(function(bn){ d.parts[bn] = {}; by[bn].forEach(function(np){ var ep = M.fromNative(np, bn, null); ep.id = M.newId(d); d.pieces.push(ep); }); });
  d.slotColours = M.slotDefaults(SHAPED, 'survivor', null, id);
  return d;
}
var SLOT = {Body:'top', Legs:'bottoms', Feet:'shoes', Head:'hair', Backpack:'gear'}, LAB = {top:'top', bottoms:'trousers', shoes:'shoes', hair:'head and hair', gear:'backpack'};
var LOOKS = {}, n = 0, tri = 0;
Object.keys(data).forEach(function(k){
  var c = data[k], pre = 'q' + k.charAt(0) + '_' + c.name.toLowerCase(), who = (k.charAt(0) === 'm' ? 'M ' : 'F ') + c.name;
  Object.keys(c.parts).forEach(function(part){
    var slot = SLOT[part]; if (!slot) return;
    var by = c.parts[part]; Object.keys(by).forEach(function(b){ by[b].forEach(function(q){ tri += q.f.length; }); });
    M.addModelToPack(pack, docOf(slot, slot === 'top' || slot === 'bottoms' ? c.body : null, pre, who + ' ' + LAB[slot], by)); n++;
  });
  LOOKS[pre] = {label:'Modular ' + c.name + (k.charAt(0) === 'm' ? ' (man)' : ' (woman)'), body:c.body, build:'average', skin:2, hairColour:1, hair:pre, hat:'none', face:'calm', top:pre, bottoms:pre, shoes:pre, shirt:c.defaults.shirt || '#8a8a8a', pants:c.defaults.pants || '#4a4a4a', acc:'#c9742a', gear:c.parts.Backpack ? [pre] : [], worn:[], npc:[], note:'imported and re-posed from the CC0 Quaternius modular characters'};
});
Object.keys(LOOKS).forEach(function(k){ var L = JSON.parse(JSON.stringify(LOOKS[k])), label = L.label; delete L.label; pack.assets.push({type:'look', id:k, name:label, kind:'character', author:'Quaternius (CC0), converted by the AfterStreet content chat', look:L}); });
fs.writeFileSync(root + 'packs/afterstreet-modular.js', M.packToJS(pack));
console.log('wrote packs/afterstreet-modular.js:', n, 'parts,', Object.keys(LOOKS).length, 'looks,', tri, 'triangles,', Math.round(fs.statSync(root + 'packs/afterstreet-modular.js').size / 1024), 'KB');
