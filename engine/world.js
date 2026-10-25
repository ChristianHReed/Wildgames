/* Shared engine: world building from map data (roads, water, buildings, trees, terrain heights, bridges).
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
/* ================= world building ================= */
var HW = {motorway:12,trunk:11,primary:10,secondary:9,tertiary:8,residential:7,unclassified:7,living_street:6,service:4.5,pedestrian:5,track:3.5,footway:2,path:2,cycleway:2.2,steps:2,bridleway:2};
var PATHS = {footway:1,path:1,cycleway:1,steps:1,bridleway:1,track:1,pedestrian:1};
var WW = {river:11,canal:8,stream:3,ditch:2,drain:2};
var IN = function(v, list){ return !!v && list.indexOf(v) >= 0; };
function catOf(t, isBuilding){
  var a = t.amenity, s = t.shop, b = t.building;
  if (IN(a, ['pharmacy','hospital','clinic','doctors','dentist','veterinary']) || IN(s, ['chemist','medical_supply']) || t.healthcare) return 'medical';
  if (IN(a, ['police','fire_station']) || IN(s, ['weapons','hunting','outdoor']) || t.military) return 'police';
  if (IN(a, ['restaurant','cafe','fast_food','bar','pub','food_court','ice_cream','biergarten']) || IN(s, ['supermarket','convenience','bakery','butcher','greengrocer','deli','beverages','alcohol','general','farm'])) return 'food';
  if (IN(s, ['hardware','doityourself','car_repair','car_parts','trade','tyres']) || a === 'fuel' || t.craft || IN(b, ['industrial','warehouse','garage','garages','shed','hangar','barn'])) return 'industrial';
  if (s) return 'shop';
  return isBuilding ? 'house' : null;
}
function areaKind(t){
  if (t.natural === 'water' || IN(t.landuse, ['reservoir','basin']) || t.waterway === 'riverbank' || t.leisure === 'swimming_pool') return 'water';
  if (t.natural === 'wood' || t.landuse === 'forest') return 'forest';
  if (IN(t.leisure, ['park','garden','playground','golf_course']) || IN(t.landuse, ['recreation_ground','village_green','cemetery','allotments'])) return 'park';
  if (IN(t.landuse, ['grass']) || t.leisure === 'pitch') return 'grass';
  if (IN(t.landuse, ['meadow','farmland','orchard']) || IN(t.natural, ['grassland','scrub','heath']) || t.leisure === 'nature_reserve') return 'field';
  if (t.amenity === 'parking') return 'parking';
  if (IN(t.natural, ['sand','beach'])) return 'sand';
  return null;
}
/* ---- what a building was used for, read from the map's tags; this decides its shape, furniture and loot ---- */
function kindOf(t){
  var a = t.amenity, s = t.shop, b = t.building, l = t.leisure, to = t.tourism;
  if (a === 'hospital' || b === 'hospital') return 'hospital';
  if (IN(a, ['pharmacy','clinic','doctors','dentist','veterinary']) || IN(s, ['chemist','medical_supply']) || t.healthcare) return 'clinic';
  if (IN(a, ['police','prison']) || t.military) return 'police';
  if (a === 'fire_station' || b === 'fire_station') return 'fire';
  if (IN(s, ['weapons','hunting','outdoor','fishing','sports'])) return 'outdoors';
  if (IN(a, ['bar','pub','biergarten','nightclub']) || IN(s, ['alcohol','beverages'])) return 'bar';
  if (IN(a, ['restaurant','cafe','fast_food','food_court','ice_cream'])) return 'restaurant';
  if (IN(s, ['supermarket','convenience','bakery','butcher','greengrocer','deli','general','farm','confectionery']) || a === 'marketplace') return 'grocery';
  if (a === 'fuel') return 'fuel';
  if (IN(s, ['hardware','doityourself','trade','car_repair','car_parts','tyres','car','bicycle','storage_rental']) || t.craft) return 'hardware';
  if (IN(s, ['clothes','shoes','department_store','second_hand','laundry','fashion'])) return 'clothes';
  if (IN(s, ['electronics','mobile_phone','computer','hifi','music'])) return 'electronics';
  if (IN(a, ['school','university','college','kindergarten','childcare']) || IN(b, ['school','university','college','kindergarten'])) return 'school';
  if (a === 'library' || s === 'books') return 'library';
  if (a === 'place_of_worship' || IN(b, ['church','chapel','cathedral','mosque','temple','synagogue'])) return 'church';
  if (a === 'bank') return 'bank';
  if (IN(to, ['hotel','motel','hostel']) || b === 'hotel') return 'hotel';
  if (IN(l, ['fitness_centre','sports_centre','ice_rink'])) return 'gym';
  if (IN(a, ['theatre','cinema','arts_centre','events_venue','community_centre']) || l === 'stadium' || IN(b, ['stadium','grandstand'])) return 'venue';
  if (a === 'parking' || b === 'parking') return 'parking';
  if (t.office || IN(a, ['townhall','courthouse','post_office']) || IN(b, ['office','commercial','government','public','civic'])) return 'office';
  if (IN(b, ['industrial','warehouse','hangar','barn','factory','manufacture'])) return 'warehouse';
  if (IN(b, ['garage','garages','shed','carport','roof'])) return 'garage';
  if (IN(b, ['apartments','dormitory','residential'])) return 'apartments';
  if (s || b === 'retail') return 'shop';
  if (IN(b, ['house','detached','semidetached_house','terrace','bungalow','cabin','hut'])) return 'house';
  return null;
}
/* cat = broad group (map colour, shopfront art); lv = floors when the map does not say; lh = height of a floor; awn = awning colour for places with a shopfront */
var KIND = {
  house:{cat:'house', label:'home', lv:[1,2], roof:'hip'},
  apartments:{cat:'house', label:'apartment block', lv:[3,5], fac:['brick','brickDark','stucco']},
  garage:{cat:'industrial', label:'garage', lv:[1,1], lh:2.7, roof:'hip', fac:['sidingCream','stucco']},
  grocery:{cat:'food', label:'grocery store', lv:[1,1], lh:4.4, awn:'#7a8a5e'},
  restaurant:{cat:'food', label:'restaurant', lv:[1,2], lh:3.6, awn:'#c67139'},
  bar:{cat:'food', label:'bar', lv:[1,2], lh:3.6, awn:'#8a6a8a'},
  clinic:{cat:'medical', label:'clinic', lv:[1,2], lh:3.6, awn:'#f5ead8', fac:['stucco']},
  hospital:{cat:'medical', label:'hospital', lv:[4,6], fac:['stucco','stone']},
  police:{cat:'police', label:'police station', lv:[2,2], fac:['stone','brickDark']},
  fire:{cat:'police', label:'fire station', lv:[2,2], lh:4, fac:['brick']},
  outdoors:{cat:'police', label:'outdoor store', lv:[1,1], lh:4.2, awn:'#56643f'},
  hardware:{cat:'industrial', label:'hardware store', lv:[1,1], lh:4.6, awn:'#d9a845'},
  fuel:{cat:'industrial', label:'gas station', lv:[1,1], lh:3.6, awn:'#c8553a'},
  warehouse:{cat:'industrial', label:'warehouse', lv:[1,1], lh:7, fac:['stucco','brickDark']},
  parking:{cat:'industrial', label:'parking garage', lv:[3,4], lh:3, fac:['stucco']},
  clothes:{cat:'shop', label:'clothing store', lv:[1,2], lh:4, awn:'#5f8a9a'},
  electronics:{cat:'shop', label:'electronics store', lv:[1,2], lh:4, awn:'#3d3029'},
  shop:{cat:'shop', label:'shop', lv:[1,2], lh:4, awn:'#5f8a9a'},
  school:{cat:'civic', label:'school', lv:[2,3], fac:['brick','stone']},
  library:{cat:'civic', label:'library', lv:[2,2], lh:4, fac:['stone']},
  church:{cat:'civic', label:'church', lv:[1,1], lh:8, roof:'hip', fac:['stone','brick']},
  office:{cat:'civic', label:'office building', lv:[2,6], fac:['stucco','stone','brickDark','brick']},
  bank:{cat:'civic', label:'bank', lv:[2,3], lh:4, fac:['stone']},
  hotel:{cat:'civic', label:'hotel', lv:[3,5], fac:['brick','stucco']},
  gym:{cat:'civic', label:'gym', lv:[1,2], lh:5, fac:['stucco']},
  venue:{cat:'civic', label:'event hall', lv:[2,3], lh:5, fac:['stone','brickDark']}
};
function kindLabel(b){ var l = KIND[b.kind].label; return (/^[aeiou]/.test(l) ? 'an ' : 'a ') + l; }
var LOOTK = {
  apartments:{key:0.4, food:3, water:2, medkit:0.6, coat:0.6, battery:1, scrap:1, none:1.5},
  garage:{scrap:4, fuel:2.5, wood:2, battery:1, flashlight:0.3, none:1},
  grocery:{food:7, water:4, battery:0.5},
  restaurant:{food:6, water:3, scrap:0.5, none:1},
  bar:{water:5, food:2, medkit:0.3, none:1.5},
  clinic:{medkit:6, water:1, battery:0.4}, hospital:{medkit:7, water:2, battery:0.6, coat:0.4, none:1},
  police:{ammo:8, medkit:1, radio:1, battery:2, flashlight:0.6, key:1.2},
  fire:{medkit:3, coat:2, fuel:2, radio:1, flashlight:1, scrap:1, water:2},
  outdoors:{ammo:5, coat:2, lantern:1.5, flashlight:1, food:1, battery:1},
  hardware:{scrap:5, wood:4, battery:2, fuel:1, flashlight:0.8, lantern:0.6},
  fuel:{fuel:6, food:2, water:2, battery:1},
  warehouse:{scrap:5, wood:4, fuel:2, battery:1}, parking:{fuel:4, scrap:3, battery:1, none:2},
  clothes:{coat:5, scrap:1, none:2},
  electronics:{battery:5, radio:2, flashlight:2, scrap:2},
  school:{food:2, water:2, medkit:1, battery:1.5, scrap:1, none:2},
  library:{battery:1, lantern:0.4, water:1, scrap:1, none:4},
  church:{water:3, food:2, lantern:1, medkit:0.5, coat:0.5, none:2},
  office:{key:0.6, battery:2.5, water:2, scrap:1.5, radio:0.5, flashlight:0.5, medkit:0.5, food:0.8, none:2.5},
  bank:{scrap:2, battery:1, ammo:0.6, none:4},
  hotel:{food:2, water:3, coat:1.5, medkit:0.8, battery:1, none:1.5},
  gym:{water:5, medkit:1.5, food:1, coat:0.6, none:1.5},
  venue:{water:3, food:2, flashlight:0.5, battery:1, none:3}
};
var CIVIC = ['library', 'school', 'place_of_worship', 'townhall', 'courthouse', 'university', 'college', 'community_centre'];
var CAT = {
  house:{label:'Home', icon:'', cols:['#d9c7a8','#e0cfb2','#cdb895']},
  food:{label:'Food', icon:'F', cols:['#d9a845']},
  medical:{label:'Medical', icon:'+', cols:['#c67139']},
  police:{label:'Armory', icon:'A', cols:['#8a7a5a']},
  industrial:{label:'Workshop', icon:'S', cols:['#8a6a8a']},
  shop:{label:'Shop', icon:'$', cols:['#5f8a9a']},
  civic:{label:'Public', icon:'', cols:['#b9ad98','#c4b79e']}
};
var ICON_COL = {food:'#b3541e', medical:'#c8322b', police:'#f2d14a', industrial:'#22262b', shop:'#0f4a44'};
var POWER_DAY = 3, WATER_DAY = 5;   /* 0.36: the power fails at midnight going into day 3, the water mains going into day 5 */
var LOOT = {
  house:{map:0.35, food:3, water:2, medkit:0.5, ammo:0.4, wood:1, scrap:1.5, coat:0.4, battery:0.9, rifle:0.15, shell:0.3, arrow:0.2, hunting_rifle:0.07, double_barrel:0.09, revolver:0.05, none:1.5},
  food:{food:6, water:4}, medical:{medkit:6, water:1}, police:{ammo:8, medkit:1, radio:1, battery:2, rifle:2, shell:2.5, revolver:0.6, pump_shotgun:0.5, carbine:0.35},
  industrial:{scrap:5, wood:4, fuel:2, battery:1, chunk:2.5, bolt:0.4, crossbow:0.05}, shop:{map:0.8, food:2, water:2, scrap:2, ammo:0.6, shell:0.5, arrow:0.4, recurve_bow:0.08, medkit:1, coat:0.6, radio:0.3, battery:1.6}
};
var ITEMS = {food:['Food','#e8a04a','1'], water:['Water','#58b8f0','2'], medkit:['Medkit','#f06a6a','3'], ammo:['Ammo','#f2d14a','F'], wood:['Wood','#a8743e',''], scrap:['Scrap','#a9b0ba',''], nails:['Nails','#8c8f94',''], sheet:['Sheet metal','#9fb0bd',''], chunk:['Concrete chunk','#9a9890',''], map:['Paper map','#d9c9a0',''], rifle:['Rifle rounds','#d9b34a',''], shell:['Shotgun shells','#c8553d',''], arrow:['Arrows','#c9a56a',''], bolt:['Crossbow bolts','#9fa6ad',''],
  revolver:['Revolver','#8d949c',''], hunting_rifle:['Hunting rifle','#7a5a3c',''], pump_shotgun:['Pump shotgun','#6b6f75',''], double_barrel:['Double-barrel shotgun','#6b5a48',''], carbine:['Carbine','#4f565e',''], crossbow:['Crossbow','#7a6a4a',''], recurve_bow:['Recurve bow','#a8743e',''], flare_gun:['Flare gun','#c8553d',''], flareshell:['Flare shells','#e8632a',''], quiver:['Quiver','#8a6a44','']};
ITEMS.coat = ['Coat','#8a6f5a','']; ITEMS.key = ['Keys','#d9a845','']; ITEMS.meal = ['Hot meal','#d9873a','']; ITEMS.fuel = ['Fuel','#c8553a','']; ITEMS.radio = ['Radio','#7fd6c2','']; ITEMS.flashlight = ['Flashlight','#e8d27a','']; ITEMS.lantern = ['Lantern','#f6de96','']; ITEMS.battery = ['Batteries','#b9c46a','']; ITEMS.berry = ['Berries','#b3476a','']; ITEMS.herb = ['Herbs','#7fae6a','']; ITEMS.fiber = ['Plant fibre','#c9b98a','']; ITEMS.stone = ['Stones','#a8a096','']; ITEMS.bandage = ['Bandages','#e9e2d0','4']; ITEMS.antibio = ['Antibiotics','#9ad0a0','']; ITEMS.splint = ['Splint','#b08a5a','']; ITEMS.fresh = ['Fresh food','#e07a4a','']; ITEMS.rotten = ['Rotten food','#9a9a62','']; ITEMS.dirty = ['Unboiled water','#7aa0b0','']; ITEMS.tape = ['Duct tape','#9aa3aa',''];
ITEMS.generator = ['Generator','#d9a845',''];
/* 0.40: clothes, worn in six slots. warm = degrees F of warmth when cold; rain = how much rain it keeps off (outer and head);
   armor = how much of an alien's hit it takes; glass = no cuts climbing through broken windows; sun = shade on hot days */
var CLOTHES = {
  beanie:{n:'Beanie', s:'head', warm:4, rain:0.05, c:'#4f6f7a'}, cap:{n:'Cap', s:'head', warm:1, rain:0.1, sun:6, c:'#8a5a3a'}, helmet:{n:'Helmet', s:'head', warm:2, rain:0.15, armor:0.12, c:'#d9a845'},
  sweater:{n:'Sweater', s:'top', warm:8, c:'#7a8a5e'},
  coat:{n:'Winter coat', s:'outer', warm:16, rain:0.35, armor:0.06, c:'#8a6f5a'}, raincoat:{n:'Rain jacket', s:'outer', warm:5, rain:0.9, c:'#c8a23a'}, leather:{n:'Leather jacket', s:'outer', warm:8, rain:0.5, armor:0.2, c:'#4a3a32'},
  gloves:{n:'Work gloves', s:'hands', warm:3, armor:0.03, glass:1, c:'#8a6a48'},
  trousers:{n:'Work trousers', s:'legs', warm:3, armor:0.07, c:'#5d6670'}, thermals:{n:'Thermals', s:'legs', warm:6, c:'#c9b8a0'},
  boots:{n:'Boots', s:'feet', warm:3, rain:0.05, armor:0.05, c:'#5a4028'}
};
var SLOTS = [['head', 'Head'], ['top', 'Top'], ['outer', 'Outer'], ['hands', 'Hands'], ['legs', 'Legs'], ['feet', 'Feet']];
for (var ck in CLOTHES) ITEMS[ck] = [CLOTHES[ck].n, CLOTHES[ck].c, ''];
ITEMS.seeds = ['Seed packets', '#7a9a4a', ''];   /* 0.43: planted in a garden plot */
(function(){ var add = function(t, o){ for (var k in o) t[k] = (t[k] || 0) + o[k]; };
  add(LOOT.house, {seeds:.25}); add(LOOT.shop, {seeds:.3}); add(LOOT.industrial, {seeds:.2}); add(LOOTK.hardware, {seeds:1.5}); add(LOOTK.grocery, {seeds:.8}); add(LOOTK.outdoors, {seeds:.8}); add(LOOTK.garage, {seeds:.3}); })();
(function(){
  var add = function(t, o){ for (var k in o) t[k] = (t[k] || 0) + o[k]; };
  add(LOOT.house, {sweater:.3, beanie:.2, gloves:.15, raincoat:.12, thermals:.12, boots:.12, cap:.15}); add(LOOT.shop, {sweater:.3, raincoat:.2, cap:.2, gloves:.15});
  add(LOOT.industrial, {gloves:.8, boots:.5, helmet:.35, trousers:.6}); add(LOOT.police, {helmet:.8, leather:.3, boots:.4, gloves:.4});
  add(LOOTK.apartments, {sweater:.5, beanie:.3, raincoat:.3, thermals:.2, cap:.2}); add(LOOTK.clothes, {sweater:4, raincoat:3, leather:1.5, beanie:3, cap:3, gloves:2, thermals:2, trousers:2, boots:2.5});
  add(LOOTK.outdoors, {raincoat:2.5, boots:2, gloves:1.5, beanie:1.5, cap:1.5, thermals:1.2, trousers:1}); add(LOOTK.fire, {helmet:2, gloves:1.5, boots:1.5});
  add(LOOTK.police, {helmet:1.5, leather:.6, boots:.8, gloves:.8}); add(LOOTK.hardware, {gloves:2, boots:1.2, helmet:1, trousers:1.5}); add(LOOTK.garage, {gloves:1, trousers:.8, boots:.5});
  add(LOOTK.warehouse, {gloves:.8, boots:.5, helmet:.4}); add(LOOTK.hotel, {sweater:.5, raincoat:.3}); add(LOOTK.gym, {cap:.6, sweater:.4}); add(LOOTK.church, {sweater:.6, beanie:.4});
})();
ITEMS.toolkit = ['Toolkit','#c64834','']; ITEMS.book = ['Skill book','#b0804a','']; ITEMS.tire = ['Spare tire','#3a383a','']; ITEMS.carbat = ['Car battery','#d9a845','']; ITEMS.parts = ['Engine parts','#8a9199',''];
(function(){   /* 0.39: what it takes to get the truck at the safe house running, found in garages, auto shops and gas stations */
  var add = function(t, o){ for (var k in o) t[k] = (t[k] || 0) + o[k]; };
  add(LOOTK.fuel, {map:3}); add(LOOTK.outdoors, {map:2}); add(LOOTK.hardware, {map:1, shell:.8, arrow:.6, bolt:.4, flareshell:.3, hunting_rifle:.1, crossbow:.08, quiver:.15}); add(LOOTK.outdoors, {arrow:1.2, bolt:.5, recurve_bow:.15, quiver:.5, flare_gun:.1, flareshell:.6, shell:.4, hunting_rifle:.12}); add(LOOTK.police, {flareshell:.8, flare_gun:.15});
  add(LOOTK.garage, {toolkit:1, tire:1.4, carbat:1, parts:1}); add(LOOTK.hardware, {toolkit:.8, tire:1.2, carbat:.9, parts:1.2}); add(LOOTK.fuel, {carbat:.7, parts:.7, tire:.4, toolkit:.2});
  add(LOOTK.parking, {tire:.6, carbat:.4}); add(LOOTK.warehouse, {tire:.3, parts:.3, toolkit:.2}); add(LOOT.industrial, {toolkit:.4, tire:.5, carbat:.4, parts:.5}); add(LOOT.house, {toolkit:.12, tire:.06, book:.22}); add(LOOT.shop, {book:.12}); add(LOOTK.library, {book:3}); if (LOOTK.school) add(LOOTK.school, {book:1.5});
})();
(function(){   /* 0.29: medical supplies, fresh food and tape join the loot */
  var add = function(t, o){ for (var k in o) t[k] = (t[k] || 0) + o[k]; };
  add(LOOT.house, {bandage:.6, fresh:1, tape:.3}); add(LOOT.food, {fresh:3}); add(LOOT.medical, {bandage:3, antibio:1.5, splint:1}); add(LOOT.industrial, {tape:1.2, generator:0.35}); add(LOOT.house, {generator:0.04}); add(LOOT.shop, {bandage:.6, tape:.5, fresh:.6});
  add(LOOTK.grocery, {fresh:4}); add(LOOTK.restaurant, {fresh:4}); add(LOOTK.clinic, {bandage:4, antibio:2, splint:1.5}); add(LOOTK.hospital, {bandage:4, antibio:3, splint:2}); add(LOOTK.fire, {bandage:2, splint:1}); add(LOOTK.police, {bandage:1});
  add(LOOTK.outdoors, {bandage:1, tape:1}); add(LOOTK.hardware, {tape:3}); add(LOOTK.garage, {tape:1.5}); add(LOOTK.warehouse, {tape:1}); add(LOOTK.school, {bandage:1}); add(LOOTK.gym, {bandage:1}); add(LOOTK.apartments, {fresh:1, bandage:.5}); add(LOOTK.hotel, {fresh:1, bandage:.5});
})();
var CORE = {food:1, water:1, medkit:1, ammo:1, wood:1, scrap:1};
function newInv(start){ var o = {}; for (var k in ITEMS) o[k] = 0; if (start){ o.map = 1; o.food = 1; o.water = 1; o.ammo = 8; o.radio = 1; o.flashlight = 1; o.battery = 2; } return o; }
var AREA_COL = {grass:'#7f9a5c', park:'#6fa25a', forest:'#4f7f4a', sand:'#cdbb8a', parking:'#6a6e75', water:'#3f86b8'};
var AREA_RANK = {field:0, grass:0, park:1, forest:2, sand:3, parking:4, water:5};
var G = 16, world = null;
function gk(cx, cy){ return (cx + 50000)*100000 + (cy + 50000); }
function bbox(o){
  var p = o.pts; o.minx = o.miny = 1e12; o.maxx = o.maxy = -1e12;
  for (var i = 0; i < p.length; i += 2){ if (p[i] < o.minx) o.minx = p[i]; if (p[i] > o.maxx) o.maxx = p[i]; if (p[i+1] < o.miny) o.miny = p[i+1]; if (p[i+1] > o.maxy) o.maxy = p[i+1]; }
  return o;
}
function pip(p, x, y){
  var inside = false;
  for (var i = 0, j = p.length - 2; i < p.length; j = i, i += 2){
    var yi = p[i+1], yj = p[j+1];
    if ((yi > y) !== (yj > y) && x < (p[j] - p[i])*(y - yi)/(yj - yi) + p[i]) inside = !inside;
  }
  return inside;
}
function segDist(x, y, ax, ay, bx, by){
  var dx = bx - ax, dy = by - ay, l = dx*dx + dy*dy, t = l ? ((x-ax)*dx + (y-ay)*dy)/l : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(x - ax - dx*t, y - ay - dy*t);
}
function polyDist(p, x, y, closed){
  var best = 1e9, n = p.length;
  for (var i = 0; i < n - (closed ? 0 : 2); i += 2){ var j = (i + 2) % n, d = segDist(x, y, p[i], p[i+1], p[j], p[j+1]); if (d < best) best = d; }
  return best;
}
function buildWorld(raw, name){
  var a = 1e9, b = -1e9, c = 1e9, d = -1e9, i;
  raw.ways.forEach(function(w){ for (var q = 0; q < w.c.length; q++){ var p = w.c[q]; if (p[0] < a) a = p[0]; if (p[0] > b) b = p[0]; if (p[1] < c) c = p[1]; if (p[1] > d) d = p[1]; } });
  var Z = raw.zone; if (Z){ var mgx = 0.0045/Math.cos((Z.s + Z.n)/2*Math.PI/180), mgy = 0.0045; a = Z.w - mgx; b = Z.e + mgx; c = Z.s - mgy; d = Z.n + mgy; }
  if (a > b) throw new Error('No map shapes found in this file.');
  var lon0 = (a+b)/2, lat0 = (c+d)/2, kx = Math.cos(lat0*Math.PI/180)*111320, ky = 110540;
  var proj = function(cs){ var o = []; for (var q = 0; q < cs.length; q++) o.push((cs[q][0]-lon0)*kx, -(cs[q][1]-lat0)*ky); return o; };
  var w = {name:name, buildings:[], roads:[], areas:[], trees:[], cut:{}, crates:[], grid:new Map(),
    minx:(a-lon0)*kx, maxx:(b-lon0)*kx, miny:-(d-lat0)*ky, maxy:-(c-lat0)*ky,
    start:raw.spawn ? {x:(raw.spawn[0]-lon0)*kx, y:-(raw.spawn[1]-lat0)*ky} : {x:0, y:0}, pin:!!raw.pin};
  w.geo = {lon0:lon0, lat0:lat0, kx:kx, ky:ky}; w.core = Z ? {x0:(Z.w - lon0)*kx, x1:(Z.e - lon0)*kx, y0:-(Z.n - lat0)*ky, y1:-(Z.s - lat0)*ky} : null;
  buildHeights(w, raw, lon0, lat0, kx, ky); w.tcls = decodeCls(raw.tclass, lon0, lat0, kx, ky);
  var holesOf = {}; (raw.holes || []).forEach(function(h){ if (h && h.length === 2 && h[1] && h[1].length >= 6){ var hp = []; for (var hq = 0; hq + 1 < h[1].length; hq += 2) hp.push((h[1][hq] - lon0)*kx, -(h[1][hq+1] - lat0)*ky); (holesOf[h[0]] = holesOf[h[0]] || []).push(hp); } });
  raw.ways.forEach(function(way, wayIx){
    var t = way.tags || {}, cs = way.c; if (!cs || cs.length < 2) return;
    var closed = cs.length >= 4 && same(cs[0], cs[cs.length-1]), pts = proj(cs);
    if (closed && t.building && t.building !== 'no'){
      pts.length -= 2; var ar = 0, cx = 0, cy = 0, n = pts.length;
      for (i = 0; i < n; i += 2){ var j = (i+2) % n; ar += pts[i]*pts[j+1] - pts[j]*pts[i+1]; cx += pts[i]; cy += pts[i+1]; }
      ar = Math.abs(ar)/2; if (ar < 6) return;
      var hls = holesOf[wayIx]; if (hls) hls.forEach(function(hp){ var ha = 0; for (var hi = 0; hi < hp.length; hi += 2){ var hj = (hi + 2) % hp.length; ha += hp[hi]*hp[hj+1] - hp[hj]*hp[hi+1]; } ar = Math.max(6, ar - Math.abs(ha)/2); });   /* courtyards and light wells (map format 2) do not count as floor */
      var id = w.buildings.length, kind = kindOf(t), kg = !kind; if (kg){ var hk = hash(id, 17, 4); kind = ar < 280 ? 'house' : hk < 0.45 ? 'office' : hk < 0.7 ? 'shop' : 'apartments'; }
      var cat = KIND[kind].cat;
      w.buildings.push(bbox({pts:pts, cat:cat, kind:kind, kg:kg, name:t.name || '', hn:t['addr:housenumber'] || '', st:t['addr:street'] || '', area:ar, cx:cx/(n/2), cy:cy/(n/2), levels:Math.round(+t['building:levels']) || levelsOfHeight(t), rs:roofShape(t), civic:IN(t.amenity, CIVIC), looted:false, stamp:0,
        col:CAT[cat].cols[Math.floor(hash(id, 3, 5)*CAT[cat].cols.length)], rolls:Math.max(1, Math.min(6, Math.round(1 + ar/160))), time:Math.min(4, 1.2 + ar/400), id:id}));
      return;
    }
    if (closed && (t.place === 'square' || (t.highway === 'pedestrian' && pts.length >= 8) || (t.name && /\b(square|plaza)\b/i.test(t.name) && !t.building))){ var sq = bbox({pts:pts}); (w.squares = w.squares || []).push({x:(sq.minx + sq.maxx)/2, y:(sq.miny + sq.maxy)/2, r:Math.hypot(sq.maxx - sq.minx, sq.maxy - sq.miny)/2, name:t.name || ''}); }
    if (t.highway && t.area !== 'yes'){ w.roads.push(bbox({pts:pts, w:HW[t.highway] || 6, kind:PATHS[t.highway] ? 'path' : 'road', hw:t.highway, name:t.name || ''})); return; }
    if (t.waterway && WW[t.waterway]){ w.roads.push(bbox({pts:pts, w:WW[t.waterway], kind:'water'})); return; }
    if (IN(t.railway, ['rail','tram','light_rail'])){ w.roads.push(bbox({pts:pts, w:2.4, kind:'rail'})); return; }
    if (closed){ var k = areaKind(t); if (k){ pts.length -= 2; w.areas.push(bbox({pts:pts, kind:k})); } }
  });
  if (!w.buildings.length && !w.roads.length) throw new Error('This file has no buildings or roads. Try exporting a built-up area.');
  w.areas.sort(function(p, q){ return AREA_RANK[p.kind] - AREA_RANK[q.kind]; });
  w.water = w.areas.filter(function(r){ return r.kind === 'water'; });
  w.waterLines = w.roads.filter(function(r){ return r.kind === 'water'; });
  w.roads.sort(function(p, q){ return (p.kind === 'water' ? -1 : p.w) - (q.kind === 'water' ? -1 : q.w); });
  /* street names (0.49.1): the map pack names no roads, so each road takes the street its addressed neighbours say they are on */
  (function(){
    var rs = w.roads.filter(function(r){ return r.kind === 'road' && r.w >= 6; }), votes = new Map();
    w.buildings.forEach(function(bd){
      if (!bd.st) return; var px = bd.cx, py = bd.cy, best = null, bd2 = 1e9;
      rs.forEach(function(r){
        if (px < r.minx - 45 || px > r.maxx + 45 || py < r.miny - 45 || py > r.maxy + 45) return;
        var p = r.pts; for (var q = 0; q + 3 < p.length; q += 2){ var ax = p[q], ay = p[q+1], bx = p[q+2] - ax, by = p[q+3] - ay, l2 = bx*bx + by*by || 1, u = Math.max(0, Math.min(1, ((px - ax)*bx + (py - ay)*by)/l2)), d = Math.hypot(px - ax - bx*u, py - ay - by*u); if (d < bd2){ bd2 = d; best = r; } }
      });
      if (best && bd2 < 45){ var m = votes.get(best); if (!m) votes.set(best, m = {}); m[bd.st] = (m[bd.st] || 0) + 1; }
    });
    votes.forEach(function(m, r){ var bn = '', bc = 0; for (var k in m) if (m[k] > bc){ bc = m[k]; bn = k; } if (bn && !r.name) r.name = bn; });
    /* street signs: a post at the roadside every 150 m or so along each named road, and one at its start */
    var GENLAB = {motorway:'Motorway', trunk:'Highway', primary:'Main road', secondary:'Through road'};
    w.roads.forEach(function(r){ if (r.kind === 'road' && !r.name && GENLAB[r.hw]) r.lab = GENLAB[r.hw]; });   /* no name known: the HUD still says what kind of road you are on, but no sign is put up */
    w.labeled = w.roads.filter(function(r){ return r.kind === 'road' && (r.name || r.lab); });
    w.signs = []; w.named = rs.filter(function(r){ return r.name; });
    w.named.forEach(function(r, ri){
      var p = r.pts, acc = 0, nxt = 6 + hash(ri, 31, 4)*40;
      for (var q = 0; q + 3 < p.length && w.signs.length < 700; q += 2){
        var ax = p[q], ay = p[q+1], dx = p[q+2] - ax, dy = p[q+3] - ay, L = Math.hypot(dx, dy); if (L < 0.5) continue;
        while (nxt < acc + L){ var u = nxt - acc, nx = -dy/L, ny = dx/L, off = r.w/2 + 1.6, sd = (w.signs.length % 2 ? -1 : 1); w.signs.push({x:ax + dx/L*u + nx*off*sd, y:ay + dy/L*u + ny*off*sd, yaw:Math.atan2(dy, dx), name:r.name}); nxt += 140 + hash(ri, w.signs.length, 32)*60; }
        acc += L;
      }
    });
  })();
  w.buildings.forEach(function(bd){
    for (var cy = Math.floor(bd.miny/G); cy <= Math.floor(bd.maxy/G); cy++) for (var cx = Math.floor(bd.minx/G); cx <= Math.floor(bd.maxx/G); cx++){
      var key = gk(cx, cy), cell = w.grid.get(key); if (!cell) w.grid.set(key, cell = []); cell.push(bd);
    }
  });
  world = w;
  raw.pois.forEach(function(p, n){
    var x = (p.lon-lon0)*kx, y = -(p.lat-lat0)*ky, t = p.tags;
    if (t.natural === 'tree'){ addTree(x, y, n); return; }
    var pk = kindOf(t), cat = catOf(t, false), bd = buildingAt(x, y); if (!pk && !cat) return;
    if (bd){
      if (IN(t.amenity, CIVIC)) bd.civic = true;
      if (pk && (bd.kg || bd.kind === 'house' || bd.kind === 'apartments' || bd.kind === 'office' || bd.kind === 'shop')){ bd.kind = pk; bd.kg = false; bd.cat = KIND[pk].cat; bd.col = CAT[bd.cat].cols[0]; }
      if (t.name && !bd.name) bd.name = t.name;
    }
    else if (cat && w.crates.length < 400) w.crates.push({x:x, y:y, cat:cat, name:t.name || CAT[cat].label + ' stash', looted:false, rolls:2, time:1.2});
  });
  plantTrees(w, buildCover(w));
  return w;
}
/* ---- terrain types from the built-in region (tools/build_region.py): a coarse grid of what covers the land, read with soft edges ---- */
var CLS_N = 22;
function decodeCls(t, lon0, lat0, kx, ky){
  try {
    if (!t || !(t.n > t.s) || !(t.e > t.w) || !(t.cols >= 1 && t.cols <= 4000) || !(t.rows >= 1 && t.rows <= 4000) || typeof t.d !== 'string') return null;
    var bin = atob(t.d); if (bin.length !== t.cols*t.rows) return null; var d = new Uint8Array(bin.length); for (var i = 0; i < d.length; i++) d[i] = bin.charCodeAt(i);
    var x0 = (t.w - lon0)*kx, y0 = -(t.n - lat0)*ky, cw = (t.e - t.w)*kx/t.cols, chh = (t.n - t.s)*ky/t.rows;
    /* the four cells round a point, weighted by distance, so the 79 m cells blend instead of showing as squares */
    return function(x, y, out){
      var u = (x - x0)/cw - 0.5, v = (y - y0)/chh - 0.5, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
      for (var q = 0; q < CLS_N; q++) out[q] = 0;
      var add = function(ii, jj, wgt){ ii = ii < 0 ? 0 : ii >= t.cols ? t.cols - 1 : ii; jj = jj < 0 ? 0 : jj >= t.rows ? t.rows - 1 : jj; var c = d[jj*t.cols + ii]; if (c < CLS_N) out[c] += wgt; };
      add(i, j, (1 - fu)*(1 - fv)); add(i + 1, j, fu*(1 - fv)); add(i, j + 1, (1 - fu)*fv); add(i + 1, j + 1, fu*fv);
      return out;
    };
  } catch (e){ return null; }
}
/* what each terrain type means for the ground and trees: forest, lawn, field, built-up, wet, rock (0-1), trees per hectare, share of pines.
   1 paved, 2 industrial, 3 yards, 4 oak-hickory, 5 shortleaf pine-oak, 6 fescue pasture, 7 park lawn, 8 golf, 9 cemetery, 10 quarry, 11 wetland,
   12 scrub and old field, 13 prairie and glade, 14 water, 16 campus lawn, 17 military, 18 rail yard, 19 farmyard, 20 orchard, 21 riverbank woods */
var CLSF = {1:[0,0,0,1,0,0,0.5,0], 2:[0,0,0,1,0,0,1,0], 3:[0,1,0,0,0,0,0,0.1], 4:[1,0,0,0,0,0,160,0.12], 5:[1,0,0,0,0,0,150,0.6], 6:[0,0,1,0,0,0,1.2,0.3],
  7:[0,1,0,0,0,0,14,0.1], 8:[0,1,0,0,0,0,10,0.3], 9:[0,1,0,0,0,0,14,0.5], 10:[0,0,0,0.6,0,1,0,0], 11:[0,0,0.7,0,1,0,12,0], 12:[0.25,0,0.85,0,0,0,45,0.35],
  13:[0,0,1,0,0,0.35,6,0.45], 14:[0,0,0,0,1,0,0,0], 16:[0,1,0,0,0,0,10,0.2], 17:[0,0,0.5,0.6,0,0,2,0.2], 18:[0,0,0,1,0,0,1,0], 19:[0,0.4,0.3,0.5,0,0,4,0.1],
  20:[0.2,0.3,0.5,0,0,0,70,0], 21:[0.6,0,0.2,0,0.6,0,120,0]};
/* ---- terrain: real elevation, stored with the map as a grid of heights ---- */
function decodeElev(e){
  try {
    if (!e || !(e.n > e.s) || !(e.e > e.w) || !(e.cols >= 2 && e.cols <= 2000) || !(e.rows >= 2 && e.rows <= 2000) || typeof e.d !== 'string') return null;
    var bin = atob(e.d); if (bin.length !== e.cols*e.rows*2) return null;
    var d = new Int16Array(e.cols*e.rows); for (var i = 0; i < d.length; i++){ var v = bin.charCodeAt(i*2) | (bin.charCodeAt(i*2 + 1) << 8); d[i] = v > 32767 ? v - 65536 : v; }
    return {s:+e.s, n:+e.n, w:+e.w, e:+e.e, cols:e.cols | 0, rows:e.rows | 0, d:d};
  } catch (er){ return null; }
}
function buildHeights(w, raw, lon0, lat0, kx, ky){
  w.hg = null; var E = decodeElev(raw.elev); if (!E) return;
  var M = 400, wd = w.maxx - w.minx + 2*M, ht = w.maxy - w.miny + 2*M, cell = Math.max((window.QS && QS.hgCell) || 10, Math.ceil(Math.max(wd, ht)/1400)), cols = Math.ceil(wd/cell) + 1, rows = Math.ceil(ht/cell) + 1, d = new Float32Array(cols*rows);
  var samp = function(x, y){
    var u = ((lon0 + x/kx) - E.w)/(E.e - E.w)*(E.cols - 1), v = (E.n - (lat0 - y/ky))/(E.n - E.s)*(E.rows - 1);
    u = Math.max(0, Math.min(E.cols - 1.001, u)); v = Math.max(0, Math.min(E.rows - 1.001, v)); var i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, k = j*E.cols + i;
    return ((E.d[k]*(1 - fu) + E.d[k + 1]*fu)*(1 - fv) + (E.d[k + E.cols]*(1 - fu) + E.d[k + E.cols + 1]*fu)*fv)/10;
  };
  var z0 = samp(w.start.x, w.start.y), mn = 1e9, mx = -1e9;
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++){ var h = samp(w.minx - M + i*cell, w.miny - M + j*cell) - z0; d[j*cols + i] = h; if (h < mn) mn = h; if (h > mx) mx = h; }
  if (mx - mn < 0.3) return;
  w.hg = {x0:w.minx - M, y0:w.miny - M, cell:cell, cols:cols, rows:rows, d:d, min:mn, max:mx};
}
/* height of the bare ground; each grid square is two flat triangles, the same ones that are drawn */
function hAt(x, y){
  var g = world.hg; if (!g) return 0;
  var u = (x - g.x0)/g.cell, v = (y - g.y0)/g.cell; u = u < 0 ? 0 : u > g.cols - 1.001 ? g.cols - 1.001 : u; v = v < 0 ? 0 : v > g.rows - 1.001 ? g.rows - 1.001 : v;
  var i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, k = j*g.cols + i, d = g.d, a = d[k], b = d[k + 1], c = d[k + g.cols], e = d[k + g.cols + 1];
  return fu + fv <= 1 ? a + (b - a)*fu + (c - a)*fv : e + (c - e)*(1 - fu) + (b - e)*(1 - fv);
}
/* ---- 0.89 bridges and overpasses. Roads that cross water get a raised deck at bank height with piers; a road that crosses a motorway or trunk road with no junction goes over it on a deck with long ramps. The deck is its own mesh, and cars and people stand on it by height (baseAt with the height they are at) ---- */
var DK = null, LASTDECK = false, DKG = null, BRHW = {motorway:1, trunk:1};
function roadLen(r){ if (r.cum) return r.cum; var c = [0], p = r.pts; for (var q = 0; q + 3 < p.length; q += 2) c.push(c[c.length - 1] + Math.hypot(p[q+2] - p[q], p[q+3] - p[q+1])); return r.cum = c; }
function roadPt(r, s){ var c = roadLen(r), n = c.length - 1, i = 0; s = Math.max(0, Math.min(c[n], s)); while (i < n - 1 && c[i+1] < s) i++; var l = c[i+1] - c[i] || 1, u = (s - c[i])/l, p = r.pts; return [p[i*2] + (p[i*2+2] - p[i*2])*u, p[i*2+1] + (p[i*2+3] - p[i*2+1])*u, i]; }
function brH(sp, s, terr){ var k = s < sp.a ? Math.max(0, 1 - (sp.a - s)/sp.rs) : s > sp.b ? Math.max(0, 1 - (s - sp.b)/sp.re) : 1; k = k*k*(3 - 2*k); var base = sp.ba + (sp.bb - sp.ba)*Math.max(0, Math.min(1, (s - sp.a)/Math.max(1, sp.b - sp.a))); return terr + (base - terr)*k; }
function bridgeScan(w){
  DK = null; DKG = null; if (!w.hg) return; var spans = {}, cand = [], mws = [];
  w.roads.forEach(function(r, ri){ r.br = null; r.gap = null; r.cum = null; if (r.kind === 'road' && r.w >= 6 && r.pts.length >= 4){ cand.push(ri); if (BRHW[r.hw]) mws.push(ri); } });
  var add = function(ri, a, b, ba, bb, ramp, wet){ (spans[ri] = spans[ri] || []).push({a:a, b:b, ba:ba, bb:bb, ramp:ramp, wet:wet}); };
  cand.forEach(function(ri){ var r = w.roads[ri], c = roadLen(r), L = c[c.length - 1], run = -1, s;
    for (s = 0; s <= L + 3; s += 3){ var pt = roadPt(r, Math.min(s, L)), wet = s <= L && inWater(pt[0], pt[1], 0.4);
      if (wet && run < 0) run = s;
      if (!wet && run >= 0){ var e = s - 3; if (e - run >= 7 && e - run < 160){ var a = Math.max(0, run - 6), b = Math.min(L, e + 6), pa = roadPt(r, a), pb = roadPt(r, b); add(ri, a, b, hAt(pa[0], pa[1]) + 0.45, hAt(pb[0], pb[1]) + 0.45, 22, 1); } run = -1; } } });
  mws.forEach(function(mi){ var A = w.roads[mi], ca = roadLen(A);
    cand.forEach(function(bi){ if (bi === mi) return; var B = w.roads[bi]; if (BRHW[B.hw] && bi < mi) return; if (A.maxx < B.minx || A.minx > B.maxx || A.maxy < B.miny || A.miny > B.maxy) return; var cb = roadLen(B);
      for (var q = 0; q + 3 < A.pts.length; q += 2) for (var t = 0; t + 3 < B.pts.length; t += 2){
        var ax = A.pts[q], ay = A.pts[q+1], bx = A.pts[q+2], by = A.pts[q+3], cx = B.pts[t], cy = B.pts[t+1], dx = B.pts[t+2], dy = B.pts[t+3], d = (bx - ax)*(dy - cy) - (by - ay)*(dx - cx); if (Math.abs(d) < 1e-9) continue;
        var u = ((cx - ax)*(dy - cy) - (cy - ay)*(dx - cx))/d, v = ((cx - ax)*(by - ay) - (cy - ay)*(bx - ax))/d; if (u <= 0.002 || u >= 0.998 || v <= 0.002 || v >= 0.998) continue;
        var x = ax + u*(bx - ax), y = ay + u*(by - ay), upR = BRHW[B.hw] ? B : B, hh = hAt(x, y) + 5.6, half = (BRHW[B.hw] ? A.w : A.w)/2 + 12 + (BRHW[B.hw] ? 0 : 0);
        if (BRHW[B.hw]){ /* two controlled roads: the later one goes over */ half = A.w/2 + 12; add(bi, cb[t/2] + v*Math.hypot(dx - cx, dy - cy) - half, cb[t/2] + v*Math.hypot(dx - cx, dy - cy) + half, hh, hh, 75, 0); }
        else { half = A.w/2 + 12; add(bi, cb[t/2] + v*Math.hypot(dx - cx, dy - cy) - half, cb[t/2] + v*Math.hypot(dx - cx, dy - cy) + half, hh, hh, 75, 0); }
        q = A.pts.length; break; } }); });
  var any = 0;
  Object.keys(spans).forEach(function(k){ var r = w.roads[k], c = roadLen(r), L = c[c.length - 1], list = spans[k].sort(function(a, b){ return a.a - b.a; }), m = [];
    list.forEach(function(sp){ sp.a = Math.max(0, sp.a); sp.b = Math.min(L, sp.b); var l = m[m.length - 1]; if (l && sp.a - sp.ramp <= l.b + l.ramp && sp.b - l.a < 260){ l.b = Math.max(l.b, sp.b); l.bb = sp.bb; l.ramp = Math.max(l.ramp, sp.ramp); l.wet = l.wet && sp.wet; } else m.push(sp); });
    m = m.filter(function(sp){ sp.rs = Math.max(1, Math.min(sp.ramp, sp.a)); sp.re = Math.max(1, Math.min(sp.ramp, L - sp.b)); return sp.wet || (sp.rs >= 30 && sp.re >= 30); }); if (!m.length) return;
    r.br = m; r.gap = [];
    m.forEach(function(sp){ var ga = Math.max(0, sp.a - sp.rs), gb = Math.min(L, sp.b + sp.re), i0 = 0, i1 = c.length - 2; while (i0 < i1 && c[i0 + 1] <= ga) i0++; while (i1 > i0 && c[i1] >= gb) i1--; sp.ga = c[i0]; sp.gb = c[i1 + 1]; r.gap.push([i0*2, i1*2]); any++; }); });
  w.bridgeCount = any;
}
function bridgeBuild(g){
  var w = world, segs = []; if (!w.hg) return;
  var wall = function(ax, az, bx, bz, y0a, y1a, y0b, y1b, col){ g.pl = null; g.quad(ax, y0a, az, bx, y0b, bz, bx, y1b, bz, ax, y1a, az, col, 255); g.quad(ax, y0a, az, ax, y1a, az, bx, y1b, bz, bx, y0b, bz, col, 255); };
  w.roads.forEach(function(r){ if (!r.br) return; var hw = r.w/2;
    r.br.forEach(function(sp){
      var ga = sp.ga, gb = sp.gb, n = Math.max(2, Math.ceil((gb - ga)/3)), P = [], i;
      for (i = 0; i <= n; i++){ var s = ga + (gb - ga)*i/n, q = roadPt(r, s), q2 = roadPt(r, s + 0.6), q1 = roadPt(r, s - 0.6), dx = q2[0] - q1[0], dy = q2[1] - q1[1], l = Math.hypot(dx, dy) || 1, t = hAt(q[0], q[1]);
        P.push({s:s, x:q[0], y:q[1], nx:-dy/l, ny:dx/l, t:t, H:brH(sp, s, t) + 0.14, core:s >= sp.a && s <= sp.b}); }
      var run = 0;
      for (i = 0; i < n; i++){ var a = P[i], b = P[i+1], l = Math.hypot(b.x - a.x, b.y - a.y), nxa = a.nx*hw, nya = a.ny*hw, nxb = b.nx*hw, nyb = b.ny*hw;
        if (r.w >= 8){ g.pl = null; g.quadUV([a.x + nxa, a.H, a.y + nya, b.x + nxb, b.H, b.y + nyb, b.x - nxb, b.H, b.y - nyb, a.x - nxa, a.H, a.y - nya], [0, run/8, 0, (run + l)/8, 1, (run + l)/8, 1, run/8], TX.lanes, WHITE, 255); }
        else { g.pl = [TX.asphalt, 0.25]; g.quad(a.x + nxa, a.H, a.y + nya, b.x + nxb, b.H, b.y + nyb, b.x - nxb, b.H, b.y - nyb, a.x - nxa, a.H, a.y - nya, WHITE, 255); }
        run += l; var e = Math.min(a.H - a.t, b.H - b.t);
        if (e > 0.5) [1, -1].forEach(function(sg){
          var ex = a.x + sg*nxa, ey = a.y + sg*nya, fx = b.x + sg*nxb, fy = b.y + sg*nyb;
          wall(ex, ey, fx, fy, a.H - 0.7, a.H, b.H - 0.7, b.H, [150, 148, 142]);   /* the edge of the slab */
          wall(ex, ey, fx, fy, a.H, a.H + 0.85, b.H, b.H + 0.85, [176, 174, 168]);   /* parapet */
          g.pl = null; g.quad(ex, a.H + 0.85, ey, fx, b.H + 0.85, fy, fx - sg*b.nx*0.28, b.H + 0.85, fy - sg*b.ny*0.28, ex - sg*a.nx*0.28, a.H + 0.85, ey - sg*a.ny*0.28, [196, 194, 188], 255);
          if (!sp.wet && !(a.core && b.core)){ var ta = hAt(ex, ey) - 0.3, tb = hAt(fx, fy) - 0.3; wall(ex, ey, fx, fy, ta, a.H - 0.7, tb, b.H - 0.7, [102, 88, 68]); }   /* earth bank under a ramp */
        });
        segs.push({x0:a.x, y0:a.y, x1:b.x, y1:b.y, h0:a.H, h1:b.H, hw:hw, e:e});
      }
      if (sp.wet) for (i = 2; i < n - 1; i += 4){ var c = P[i], hb = hAt(c.x, c.y) - 1.5, hx = hw*0.92, ux = -c.ny, uy = c.nx, o = 0.55;
        var pc = function(sx, sy){ return [c.x + c.nx*hx*sx + ux*o*sy, c.y + c.ny*hx*sx + uy*o*sy]; }, p1 = pc(1, 1), p2 = pc(1, -1), p3 = pc(-1, -1), p4 = pc(-1, 1), col = [142, 140, 134];
        wall(p1[0], p1[1], p2[0], p2[1], hb, c.H - 0.7, hb, c.H - 0.7, col); wall(p2[0], p2[1], p3[0], p3[1], hb, c.H - 0.7, hb, c.H - 0.7, col); wall(p3[0], p3[1], p4[0], p4[1], hb, c.H - 0.7, hb, c.H - 0.7, col); wall(p4[0], p4[1], p1[0], p1[1], hb, c.H - 0.7, hb, c.H - 0.7, col); }
    }); });
  g.pl = null; DK = segs; DKG = new Map();
  segs.forEach(function(sg, i){ var x0 = Math.floor((Math.min(sg.x0, sg.x1) - sg.hw)/16), x1 = Math.floor((Math.max(sg.x0, sg.x1) + sg.hw)/16), y0 = Math.floor((Math.min(sg.y0, sg.y1) - sg.hw)/16), y1 = Math.floor((Math.max(sg.y0, sg.y1) + sg.hw)/16);
    for (var cy = y0; cy <= y1; cy++) for (var cx = x0; cx <= x1; cx++){ var k = gk(cx, cy), l = DKG.get(k); if (!l) DKG.set(k, l = []); l.push(i); } });
}
/* the deck under (x, y) nearest the height hint (within 2.6 m), or the highest raised one for hint 'hi'; null when none */
function deckHit(x, y, hint){
  if (!DK) return null; var l = DKG.get(gk(Math.floor(x/16), Math.floor(y/16))); if (!l) return null; var best = null, bd = 1e9;
  for (var i = 0; i < l.length; i++){ var sg = DK[l[i]], dx = sg.x1 - sg.x0, dy = sg.y1 - sg.y0, l2 = dx*dx + dy*dy || 1, u = Math.max(0, Math.min(1, ((x - sg.x0)*dx + (y - sg.y0)*dy)/l2)), px = sg.x0 + dx*u, py = sg.y0 + dy*u, lat = Math.hypot(x - px, y - py);
    if (lat > sg.hw) continue; var h = sg.h0 + (sg.h1 - sg.h0)*u;
    if (hint === 'hi'){ if (sg.e > 0.5 && -h < bd){ bd = -h; best = {h:h, lat:((x - sg.x0)*dy - (y - sg.y0)*dx)/Math.sqrt(l2), hw:sg.hw, e:sg.e, dx:dx, dy:dy}; } continue; }
    var dh = Math.abs(h - hint); if (dh < 2.6 && dh < bd){ bd = dh; best = {h:h, lat:((x - sg.x0)*dy - (y - sg.y0)*dx)/Math.sqrt(l2), hw:sg.hw, e:sg.e, dx:dx, dy:dy}; } }
  return best;
}
function baseAt(x, y, hint){ LASTDECK = false; if (DK && hint !== undefined){ var d = deckHit(x, y, hint); if (d){ LASTDECK = true; return d.h; } } return hAt(x, y); }
function deckBlock(x, y){ if (!DK) return false; var l = DKG.get(gk(Math.floor(x/16), Math.floor(y/16))); if (!l) return false; for (var i = 0; i < l.length; i++){ var sg = DK[l[i]]; if (sg.e < 0.3) continue; if (segDist(x, y, sg.x0, sg.y0, sg.x1, sg.y1) < sg.hw + 2.5) return true; } return false; }
function deckOfRoad(r, s, x, y){ if (!r.br) return null; for (var i = 0; i < r.br.length; i++){ var sp = r.br[i]; if (s >= sp.ga && s <= sp.gb){ var t = hAt(x, y), H = brH(sp, s, t) + 0.14; return H - t > 0.3 || inWater(x, y, 2) ? H : null; } } return null; }
/* height you stand at: a building's level floor indoors, the ground outdoors */
function groundAt(x, y){ if (!world.hg) return 0; var b = buildingAt(x, y); return b ? b.base : hAt(x, y); }
/* the height something is standing at, counting stairs and upper floors */
function entY(e){ return groundAt(e.x, e.y) + lvlY(buildingAt(e.x, e.y), e); }
/* lay a flat mesh over the hills: cut every triangle along the terrain's own triangles, so each piece lies flat on the ground */
function drape(m, lift){
  var g = world.hg, P0 = m.p, C0 = m.c, T0 = m.t, p = [], c = [], t = [], cs = g.cell, n = P0.length/9;
  var clip = function(poly, a, b, cc){ /* keep the side where a*x + b*z <= cc */
    var out = [], k = poly.length; if (!k) return out;
    for (var q = 0; q < k; q += 2){
      var x0 = poly[q], z0 = poly[q+1], x1 = poly[(q+2) % k], z1 = poly[(q+3) % k], d0 = a*x0 + b*z0 - cc, d1 = a*x1 + b*z1 - cc;
      if (d0 <= 0) out.push(x0, z0);
      if ((d0 < 0 && d1 > 0) || (d0 > 0 && d1 < 0)){ var f = d0/(d0 - d1); out.push(x0 + (x1 - x0)*f, z0 + (z1 - z0)*f); }
    }
    return out;
  };
  for (var i = 0; i < n; i++){
    var o = i*9, ax = P0[o], az = P0[o+2], bx = P0[o+3], bz = P0[o+5], cx = P0[o+6], cz = P0[o+8], den = (bz - cz)*(ax - cx) + (cx - bx)*(az - cz);
    if (Math.abs(den) < 1e-6) continue;
    var y0 = P0[o+1], y1 = P0[o+4], y2 = P0[o+7], co = i*12, to = i*9, tri = [ax, az, bx, bz, cx, cz];
    var i0 = Math.floor((Math.min(ax, bx, cx) - g.x0)/cs), i1 = Math.floor((Math.max(ax, bx, cx) - g.x0)/cs), j0 = Math.floor((Math.min(az, bz, cz) - g.y0)/cs), j1 = Math.floor((Math.max(az, bz, cz) - g.y0)/cs);
    for (var gj = j0; gj <= j1; gj++) for (var gi = i0; gi <= i1; gi++){
      var X = g.x0 + gi*cs, Z = g.y0 + gj*cs, cell = clip(clip(clip(clip(tri, -1, 0, -X), 1, 0, X + cs), 0, -1, -Z), 0, 1, Z + cs); if (cell.length < 6) continue;
      for (var half = 0; half < 2; half++){
        var poly = clip(cell, half ? -1 : 1, half ? -1 : 1, (half ? -1 : 1)*(X + Z + cs)); if (poly.length < 6) continue;
        for (var q = 2; q + 3 < poly.length; q += 2){
          var vs = [poly[0], poly[1], poly[q], poly[q+1], poly[q+2], poly[q+3]];
          if (Math.abs((vs[2] - vs[0])*(vs[5] - vs[1]) - (vs[4] - vs[0])*(vs[3] - vs[1])) < 1e-4) continue;
          for (var k = 0; k < 6; k += 2){
            var x = vs[k], z = vs[k+1], w0 = ((bz - cz)*(x - cx) + (cx - bx)*(z - cz))/den, w1 = ((cz - az)*(x - cx) + (ax - cx)*(z - cz))/den, w2 = 1 - w0 - w1;
            p.push(x, y0*w0 + y1*w1 + y2*w2 + hAt(x, z) + lift, z); c.push(C0[co], C0[co+1], C0[co+2], C0[co+3]);
            t.push(T0[to]*w0 + T0[to+3]*w1 + T0[to+6]*w2, T0[to+1]*w0 + T0[to+4]*w1 + T0[to+7]*w2, T0[to+2]);
          }
        }
      }
    }
  }
  m.p = p; m.c = c; m.t = t;
}
/* ---- the ground cover generator (docs/TERRAIN.md) ----
   The map is covered by a grid of points (half the height grid's spacing, or 10 m on flat maps). Each point gets weights for three layers
   painted over mown grass: long grass (meadow), bare earth and leaf litter, and rock, plus a colour. They follow a few rules found in
   how real ground cover is laid out: grass is mown near houses and roads and grows long further out; woods have soft edges 50-100 m
   wide with a band of tall grass and scrub; ground near water is lush, with mud right at the bank; steep slopes lose their soil and
   show rock, above all the bluffs along rivers; ridges are drier than hollows; and patches come in clusters (smooth noise), not evenly. */
function vnoise(x, y, s){
  var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j; fx = fx*fx*(3 - 2*fx); fy = fy*fy*(3 - 2*fy);
  var a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return (a + (b - a)*fx)*(1 - fy) + (c + (d - c)*fx)*fy;
}
function fbm2(x, y, s){ return vnoise(x, y, s)*0.57 + vnoise(x*2.1, y*2.1, s + 1)*0.29 + vnoise(x*4.3, y*4.3, s + 2)*0.14; }
function sstep(a, b, x){ var t = (x - a)/(b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t*t*(3 - 2*t); }
/* chamfer distance (in cells) from the marked points, two passes */
function chamfer(d, cols, rows){
  var i, j, k, D = 1.4142;
  for (j = 0; j < rows; j++) for (i = 0; i < cols; i++){ k = j*cols + i; var v = d[k];
    if (i > 0 && d[k - 1] + 1 < v) v = d[k - 1] + 1;
    if (j > 0){ if (d[k - cols] + 1 < v) v = d[k - cols] + 1; if (i > 0 && d[k - cols - 1] + D < v) v = d[k - cols - 1] + D; if (i < cols - 1 && d[k - cols + 1] + D < v) v = d[k - cols + 1] + D; }
    d[k] = v; }
  for (j = rows - 1; j >= 0; j--) for (i = cols - 1; i >= 0; i--){ k = j*cols + i; var u = d[k];
    if (i < cols - 1 && d[k + 1] + 1 < u) u = d[k + 1] + 1;
    if (j < rows - 1){ if (d[k + cols] + 1 < u) u = d[k + cols] + 1; if (i < cols - 1 && d[k + cols + 1] + D < u) u = d[k + cols + 1] + D; if (i > 0 && d[k + cols - 1] + D < u) u = d[k + cols - 1] + D; }
    d[k] = u; }
}
/* box blur, both ways, radius r cells */
function blur(d, cols, rows, r){
  var t = new Float32Array(d.length), i, j, s, n = 2*r + 1;
  for (j = 0; j < rows; j++){ s = 0; for (i = -r; i <= r; i++) s += d[j*cols + Math.max(0, Math.min(cols - 1, i))];
    for (i = 0; i < cols; i++){ t[j*cols + i] = s/n; s += d[j*cols + Math.min(cols - 1, i + r + 1)] - d[j*cols + Math.max(0, i - r)]; } }
  for (i = 0; i < cols; i++){ s = 0; for (j = -r; j <= r; j++) s += t[Math.max(0, Math.min(rows - 1, j))*cols + i];
    for (j = 0; j < rows; j++){ d[j*cols + i] = s/n; s += t[Math.min(rows - 1, j + r + 1)*cols + i] - t[Math.max(0, j - r)*cols + i]; } }
}
function buildCover(w){
  var hg = w.hg, sub = 1, cell, x0, y0, cols, rows;
  if (hg){ sub = hg.cell >= 12 && hg.cols*hg.rows*4 <= 2400000 ? 2 : 1;   /* 0.95.1: ground already finer than 12 m is not halved again */ cell = hg.cell/sub; x0 = hg.x0; y0 = hg.y0; cols = (hg.cols - 1)*sub + 1; rows = (hg.rows - 1)*sub + 1; }
  else { var M = 300; cell = 10; x0 = w.minx - M; y0 = w.miny - M; cols = Math.ceil((w.maxx - w.minx + 2*M)/cell) + 1; rows = Math.ceil((w.maxy - w.miny + 2*M)/cell) + 1;
    while (cols*rows > 2400000){ cell *= 1.5; cols = Math.ceil((w.maxx - w.minx + 2*M)/cell) + 1; rows = Math.ceil((w.maxy - w.miny + 2*M)/cell) + 1; } }
  var n = cols*rows, BIG = 1e6, dev = new Float32Array(n).fill(BIG), wat = new Float32Array(n).fill(BIG), fm = new Float32Array(n), pk = new Uint8Array(n), fd = new Uint8Array(n);
  var node = function(x, y){ var i = Math.round((x - x0)/cell), j = Math.round((y - y0)/cell); return i < 0 || j < 0 || i >= cols || j >= rows ? -1 : j*cols + i; };
  var walk = function(p, arr){ for (var q = 0; q + 3 < p.length; q += 2){ var l = Math.hypot(p[q+2] - p[q], p[q+3] - p[q+1]), st = Math.max(1, Math.ceil(l/(cell*0.5)));
    for (var k = 0; k <= st; k++){ var nd = node(p[q] + (p[q+2] - p[q])*k/st, p[q+1] + (p[q+3] - p[q+1])*k/st); if (nd >= 0) arr[nd] = 0; } } };
  var fill = function(a, fn){ var i0 = Math.max(0, Math.ceil((a.minx - x0)/cell)), i1 = Math.min(cols - 1, Math.floor((a.maxx - x0)/cell)), j0 = Math.max(0, Math.ceil((a.miny - y0)/cell)), j1 = Math.min(rows - 1, Math.floor((a.maxy - y0)/cell));
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) if (pip(a.pts, x0 + i*cell, y0 + j*cell)) fn(j*cols + i); };
  w.roads.forEach(function(r){ if (r.kind === 'water') walk(r.pts, wat); else if (r.kind !== 'path') walk(r.pts, dev); });
  w.buildings.forEach(function(b){ var nd = node(b.cx, b.cy); if (nd >= 0) dev[nd] = 0; fill(b, function(k){ dev[k] = 0; }); });
  w.areas.forEach(function(a){
    if (a.kind === 'water'){ walk(a.pts.concat(a.pts.slice(0, 2)), wat); fill(a, function(k){ wat[k] = 0; }); }
    else if (a.kind === 'forest') fill(a, function(k){ fm[k] = 1; });
    else if (a.kind === 'park' || a.kind === 'grass') fill(a, function(k){ pk[k] = 1; });
    else if (a.kind === 'field') fill(a, function(k){ fd[k] = 1; });
    else if (a.kind === 'parking') fill(a, function(k){ dev[k] = 0; });
  });
  chamfer(dev, cols, rows); chamfer(wat, cols, rows);
  var fr = new Float32Array(fm); blur(fr, cols, rows, Math.max(1, Math.round(30/cell)));   /* soft wood edges, about 60 m across */
  var span = hg ? Math.max(1, hg.max - hg.min) : 1, out = new Uint8Array(n*6), TD = new Uint8Array(n), TP = new Uint8Array(n), WD = new Uint8Array(n), CW = new Float32Array(CLS_N), CL = w.tcls;
  for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++){
    var k = j*cols + i, x = x0 + i*cell, y = y0 + j*cell, D = dev[k]*cell, Wd = wat[k]*cell, f = fr[k];
    var n1 = fbm2(x/170, y/170, 31), n2 = fbm2(x/45, y/45, 47), sl = 0, alt = 0.5, cf = 0, cl = 0, cfd = 0, cdv = 0, cwt = 0, crk = 0, td = f > 0.5 ? 160*f : 0, tp = 0.3, tw = 0;
    if (CL){ CL(x, y, CW); td = 0; tp = 0;
      for (var q = 1; q < CLS_N; q++){ var wq = CW[q], F = CLSF[q]; if (!wq || !F) continue; cf += F[0]*wq; cl += F[1]*wq; cfd += F[2]*wq; cdv += F[3]*wq; cwt += F[4]*wq; crk += F[5]*wq; td += F[6]*wq; tp += F[7]*wq; tw += wq; }
      if (tw > 0) tp /= tw; f = Math.max(f, cf); if (fm[k] && f > 0.5) td = Math.max(td, 160*fr[k]); }
    if (hg){ sl = Math.hypot(hAt(x + cell, y) - hAt(x - cell, y), hAt(x, y + cell) - hAt(x, y - cell))/(2*cell); alt = (hAt(x, y) - hg.min)/span; }
    var wet = 1 - sstep(8, 70, Wd), bank = 1 - sstep(3, 14, Wd);
    var wild = sstep(25, 95, D + (n1 - 0.5)*60);                                   /* mown near homes and roads, long grass further out */
    wet = Math.max(wet, cwt*0.9); var lawn = pk[k] || cl > 0.5;
    if (fd[k]) wild = Math.max(wild, 0.85); if (cfd > 0.01) wild = Math.max(wild, Math.min(0.9, cfd)); wild *= 1 - cdv*0.6; if (lawn) wild = Math.min(wild, 0.12);
    var wm = wild*(0.45 + 0.55*n2) + f*(1 - f)*1.8 + wet*0.6*(1 - bank) + (1 - wild)*sstep(0.74, 0.86, n2)*0.35;
    var we = f*0.95*(0.75 + 0.25*n2) + bank*0.75 + sstep(0.2, 0.42, sl)*0.7 + (1 - wild)*(1 - pk[k])*sstep(0.8, 0.9, n2)*0.4;
    var wr = sstep(0.38, 0.8, sl + (n2 - 0.5)*0.2) + (1 - sstep(25, 90, Wd))*sstep(0.15, 0.45, sl)*0.55*(0.4 + n2);
    we += cdv*0.3*sstep(0.5, 0.8, n2) + cwt*0.35*(0.5 + n2)*0.6; wr += crk;
    if (lawn){ we *= 0.4; wr *= 0.5; }
    var tr = 246, tg = 250, tb = 238, fdk = f*0.2;                                   /* colour: shade under trees, lush near water, dry on ridges */
    tr *= 1 - fdk; tg *= 1 - fdk*0.8; tb *= 1 - fdk;
    tr -= wet*18; tb -= wet*6; var dry = sstep(0.55, 0.95, alt)*(1 - wet)*0.6; tr += dry*12; tb -= dry*30;
    var br = 0.93 + 0.1*n1; tr *= br; tg *= br; tb *= br;
    TD[k] = Math.min(255, td); TP[k] = Math.min(255, tp*255); WD[k] = Math.min(255, Wd);
    if (CL && cf > 0.4){ var pn = Math.min(1, tp*1.4); tr *= 1 - 0.06*pn; tb *= 1 + 0.02*pn; }                  /* pine woods are a little bluer */
    var o = k*6; out[o] = Math.min(255, wm*255); out[o+1] = Math.min(255, we*255); out[o+2] = Math.min(255, wr*255); out[o+3] = Math.min(255, tr); out[o+4] = Math.min(255, tg); out[o+5] = Math.min(255, tb);
  }
  w.tg = {x0:x0, y0:y0, cell:cell, cols:cols, rows:rows, sub:sub, c:out, td:TD, tp:TP, wd:WD, min:hg ? hg.min : 0};
  return {dev:dev, wat:wat, fr:fr, fm:fm, pk:pk, fd:fd, node:node, cell:cell};
}
/* terrain tiles: 24 cover cells square near you, every second point further away (the same surface either way) */
var TT = 24;
function terrTile(ti, tj, lod){
  var g = world.tg, m = new Mesh(), P = m.p, C = m.c, Tt = m.t, fl = !world.hg, st = lod;
  var vx = function(i, j){
    var x = g.x0 + i*g.cell, y = g.y0 + j*g.cell, o = (j*g.cols + i)*6, c = g.c;
    P.push(x, (fl ? 0 : hAt(x, y)) - 0.03, y); C.push(c[o+3], c[o+4], c[o+5], 255); Tt.push(c[o+1]/255, c[o+2]/255, 45 + c[o]/255*1.2);
  };
  for (var j = tj*TT; j < (tj + 1)*TT && j + st < g.rows; j += st) for (var i = ti*TT; i < (ti + 1)*TT && i + st < g.cols; i += st){
    vx(i, j); vx(i + st, j); vx(i, j + st); vx(i + st, j + st); vx(i, j + st); vx(i + st, j);
  }
  return m;
}
function manageTerrain(budget){
  var g = world.tg; if (!g) return; var T = world.gl.terr, sz = TT*g.cell, R = QS.far + sz, n = 0; budget *= 4;
  var i0 = Math.floor((P.x - R - g.x0)/sz), i1 = Math.floor((P.x + R - g.x0)/sz), j0 = Math.floor((P.y - R - g.y0)/sz), j1 = Math.floor((P.y + R - g.y0)/sz);
  for (var tj = Math.max(0, j0); tj <= j1 && tj*TT < g.rows - 1; tj++) for (var ti = Math.max(0, i0); ti <= i1 && ti*TT < g.cols - 1; ti++){
    var key = tj*100000 + ti, o = T.get(key), cx = g.x0 + (ti + 0.5)*sz, cy = g.y0 + (tj + 0.5)*sz;
    var lod = g.sub > 1 && Math.max(Math.abs(cx - P.x), Math.abs(cy - P.y)) > sz*0.5 + 260 ? 2 : 1;
    if ((o && o.lod === lod) || n >= budget) continue; n++;
    if (o) freeMesh(o.g); T.set(key, {g:upload(terrTile(ti, tj, lod)), x:cx, y:cy, lod:lod});
  }
  T.forEach(function(o, key){ if (Math.max(Math.abs(o.x - P.x), Math.abs(o.y - P.y)) > R + sz + 200){ freeMesh(o.g); T.delete(key); } });
}
/* trees, planted by where they grow (docs/TERRAIN.md): street trees about every 13 m along residential streets, a tree or two in
   back yards at least 6 m from the house, clusters in parks with open lawn between, thick woods that thin out toward their edges, and
   lines of trees along rivers and ponds. Every tree keeps a minimum distance from the next (Poisson-disk placement), and none stand
   in roads, buildings or water. On very big maps each kind is thinned evenly so the total stays light enough for a phone. */
function bldNear(x, y, r){
  for (var cy = Math.floor((y - r)/G); cy <= Math.floor((y + r)/G); cy++) for (var cx = Math.floor((x - r)/G); cx <= Math.floor((x + r)/G); cx++){
    var l = world.grid.get(gk(cx, cy)); if (l) for (var i = 0; i < l.length; i++){ var b = l[i]; if (Math.max(b.minx - x, x - b.maxx, b.miny - y, y - b.maxy) < r) return true; } }
  return false;
}
function plantTrees(w, cov){
  var RC = 40, RG = new Map(), TC = 8, TG = new Map(), ri;
  var cellOf = function(M, c, x, y, mk){ var k = gk(Math.floor(x/c), Math.floor(y/c)), l = M.get(k); if (!l && mk) M.set(k, l = []); return l; };
  w.roads.forEach(function(r){ if (r.kind === 'water') return; var p = r.pts, hw = r.w/2, gv = r.kind === 'rail' || (r.kind === 'path' && r.w >= 3) ? 'gravel' : 'paved';
    for (var q = 0; q + 3 < p.length; q += 2){ var sg = [p[q], p[q+1], p[q+2], p[q+3], hw, gv];
      for (var cy = Math.floor((Math.min(p[q+1], p[q+3]) - hw)/RC); cy <= Math.floor((Math.max(p[q+1], p[q+3]) + hw)/RC); cy++)
        for (var cx = Math.floor((Math.min(p[q], p[q+2]) - hw)/RC); cx <= Math.floor((Math.max(p[q], p[q+2]) + hw)/RC); cx++){ var k = gk(cx, cy), l = RG.get(k); if (!l) RG.set(k, l = []); l.push(sg); } } });
  var roadOk = function(x, y, e){ var l = RG.get(gk(Math.floor(x/RC), Math.floor(y/RC))); if (l) for (var i = 0; i < l.length; i++){ var s = l[i]; if (segDist(x, y, s[0], s[1], s[2], s[3]) < s[4] + e) return false; } return true; };
  var spaceOk = function(x, y, md){ for (var cy = Math.floor((y - md)/TC); cy <= Math.floor((y + md)/TC); cy++) for (var cx = Math.floor((x - md)/TC); cx <= Math.floor((x + md)/TC); cx++){ var l = TG.get(gk(cx, cy)); if (l) for (var i = 0; i < l.length; i++) if (Math.hypot(l[i].x - x, l[i].y - y) < md) return false; } return true; };
  var bldOk = function(x, y, c){ return !blocked(x, y) && !blocked(x + c, y) && !blocked(x - c, y) && !blocked(x, y + c) && !blocked(x, y - c); };
  var wetAt = function(x, y){ var nd = cov.node(x, y); return nd < 0 ? 1e9 : cov.wat[nd]*cov.cell; };
  var count = {};
  var put = function(x, y, h, md, bc, rc){
    if (x < w.minx || x > w.maxx || y < w.miny || y > w.maxy || w.trees.length >= 18000) return false;
    if (!spaceOk(x, y, md) || !roadOk(x, y, rc) || !bldOk(x, y, bc) || wetAt(x, y) < 5 || inWater(x, y, 1)) return false;
    addTree(x, y, w.trees.length, h); cellOf(TG, TC, x, y, true).push(w.trees[w.trees.length - 1]); count[h] = (count[h] || 0) + 1; return true;
  };
  w.trees.forEach(function(t){ cellOf(TG, TC, t.x, t.y, true).push(t); });
  /* how much of each kind there would be, so a huge map can be thinned evenly */
  var streets = w.roads.filter(function(r){ return r.kind === 'road' && r.w >= 6 && r.w <= 9.5; }), slen = 0;
  streets.forEach(function(r){ for (var q = 0; q + 3 < r.pts.length; q += 2) slen += Math.hypot(r.pts[q+2] - r.pts[q], r.pts[q+3] - r.pts[q+1]); });
  var houses = w.buildings.filter(function(b){ return b.kind === 'house'; });
  var keepS = Math.min(1, 3500/(slen/13*1.2 + 1)), keepY = Math.min(1, 2500/(houses.length*1.1 + 1));
  /* street trees, on the verge beyond the pavement, both sides, starting clear of the junctions */
  streets.forEach(function(r, n){
    if (hash(n, 3, 71) > 0.62) return;                                   /* not every street is planted, and only streets with homes along them */
    var p = r.pts, off = r.w/2 + 3.2, run = 9;
    for (var q = 0; q + 3 < p.length; q += 2){
      var ax = p[q], ay = p[q+1], l = Math.hypot(p[q+2] - ax, p[q+3] - ay); if (l < 0.1) continue; var dx = (p[q+2] - ax)/l, dy = (p[q+3] - ay)/l;
      for (; run < l - 9; run += 13){ for (var sd = -1; sd <= 1; sd += 2){ var rr = run + (sd > 0 ? 6.5 : 0); if (rr > l - 9 || hash(n*7 + q, Math.floor(rr), sd + 5) > keepS) continue;   /* the two sides alternate */
        var stx = ax + dx*rr - dy*off*sd, sty = ay + dy*rr + dx*off*sd; if (!bldNear(stx, sty, 35)) continue;
        put(stx, sty, 'street', 8, 2.5, 1.5); } }
      run = Math.max(9, run - l);
    }
  });
  /* yard trees: behind and beside houses, never right against the walls */
  houses.forEach(function(b, n){
    var rad = Math.sqrt(Math.max(30, (b.maxx - b.minx)*(b.maxy - b.miny)))/2;
    for (var t = 0; t < 2; t++){ if (hash(n, t, 91) > (t ? 0.45 : 0.8)*keepY) continue;
      var a = hash(n, t, 92)*6.283, d = rad + 5 + hash(n, t, 93)*7; put(b.cx + Math.cos(a)*d, b.cy + Math.sin(a)*d, 'yard', 7, 5, 3); }
  });
  /* along rivers, streams and ponds: a broken line of trees on each bank */
  var bank = function(p, hw, closed, n){
    var pts = closed ? p.concat(p.slice(0, 2)) : p;
    for (var q = 0; q + 3 < pts.length; q += 2){ var ax = pts[q], ay = pts[q+1], l = Math.hypot(pts[q+2] - ax, pts[q+3] - ay); if (l < 0.1) continue; var dx = (pts[q+2] - ax)/l, dy = (pts[q+3] - ay)/l;
      for (var r = 0; r < l; r += 7) for (var sd = -1; sd <= 1; sd += 2){ var x = ax + dx*r, y = ay + dy*r;
        if (hash(Math.floor(x), Math.floor(y), 55 + sd) > 0.65*fbm2(x/70, y/70, 61)*1.4) continue;
        var o = hw + 5 + hash(Math.floor(x), Math.floor(y), 57)*12; put(x - dy*o*sd, y + dx*o*sd, 'river', 5.5, 3, 2); } }
  };
  w.waterLines.forEach(function(r, n){ bank(r.pts, r.w/2, false, n); });
  w.water.forEach(function(a, n){ bank(a.pts, 0, true, n); });
  /* parks: groves with open lawn between them, and a few lone trees */
  w.areas.forEach(function(ar, n){
    if (ar.kind === 'park' || ar.kind === 'field'){
      var st = ar.kind === 'park' ? 9 : 22;
      for (var y = ar.miny; y < ar.maxy; y += st) for (var x = ar.minx; x < ar.maxx; x += st){
        var tx = x + hash(x, y, n)*st, ty = y + hash(x, y, n + 77)*st, c = fbm2(tx/50, ty/50, 83);
        var pr = ar.kind === 'park' ? sstep(0.52, 0.68, c)*0.85 + 0.05 : 0.12;
        if (hash(tx, ty, 79) < pr && pip(ar.pts, tx, ty)) put(tx, ty, ar.kind === 'park' ? 'park' : 'field', 6, 3, 2);
      }
    }
  });
  w.treeCount = count; w.roadOk = roadOk;
  w.roadCell = function(cx, cy){ return RG.get(gk(cx, cy)); }; w.RC = RC;
  w.roadAt = function(x, y){ var l = RG.get(gk(Math.floor(x/RC), Math.floor(y/RC))), best = null; if (l) for (var i = 0; i < l.length; i++){ var s = l[i]; if (segDist(x, y, s[0], s[1], s[2], s[3]) < s[4] + (s[5] === 'paved' && s[4] >= 3 ? 2 : 0)){ best = s[5]; if (best === 'gravel') return best; } } return best; };
}
/* 0.38: which kind of tree, by where it grows (Kenney Nature Kit models): 0 oak, 1 maple, 2 sycamore, 3 poplar, 4 pine, 5 cedar */
var SPECIES = {street:[0, 1, 1, 0], yard:[1, 0, 5, 3, 1], park:[0, 2, 1, 0], river:[2, 2, 3], field:[0, 5, 5], poi:[0, 1, 2]};
function addTree(x, y, n, h){ var L = SPECIES[h || 'poi'] || SPECIES.poi; world.trees.push({x:x, y:y, h:h || 'poi', r:1.5 + hash(n, 1, 3)*1.2, hp:3, alive:true, shake:0, sp:L[Math.floor(hash(n, 4, 9)*L.length)], yw:hash(n, 5, 9)*6.283, sc:0.75 + hash(n, 6, 9)*0.4}); }
/* the model and picture for a tree: deciduous trees turn in autumn */
/* 0.95.0: every tree has three shapes (the content chat's flora pack); which one grows where is fixed by the spot */
function treeVarKey(tr){ var k = treeKey(tr), v = Math.floor(hash(Math.round(tr.x*10), Math.round(tr.y*10), 41)*3); return v ? k + (v === 1 ? '_b' : '_c') : k; }
function treeKey(tr){ var nm = TREES[tr.sp] || 'oak'; return season() === 2 && tr.sp < 4 ? nm + '_fall' : nm; }
/* 0.92.0: real heights and roof shapes from map format 2. "12", "12 m" and "40 ft" all work; a building mapped by height only gets the storeys that fit */
function metres(v){ if (v === undefined || v === null) return 0; var m = String(v).match(/^\s*(-?[\d.]+)\s*(m|ft|feet|')?/i); if (!m) return 0; var n = +m[1]; if (!isFinite(n)) return 0; return m[2] && /^(ft|feet|')$/i.test(m[2]) ? n*0.3048 : n; }
function levelsOfHeight(t){ var h = metres(t.height) - metres(t.min_height); return h >= 2.5 ? Math.max(1, Math.min(15, Math.round(h/3.2))) : 0; }
function roofShape(t){ var r = String(t['roof:shape'] || '').toLowerCase(); return r === 'flat' ? 'flat' : r === 'gabled' || r === 'gable' ? 'gabled' : r === 'hipped' || r === 'half-hipped' || r === 'pyramidal' || r === 'hip' ? 'hipped' : ''; }
function buildingAt(x, y){
  var cell = world.grid.get(gk(Math.floor(x/G), Math.floor(y/G))); if (!cell) return null;
  for (var i = 0; i < cell.length; i++){ var b = cell[i]; if (!b.gone && x >= b.minx && x <= b.maxx && y >= b.miny && y <= b.maxy && pip(b.pts, x, y)) return b; }
  return null;
}
function blocked(x, y){ return buildingAt(x, y) !== null; }
var CX = [1,0.707,0,-0.707,-1,-0.707,0,0.707], CY = [0,0.707,1,0.707,0,-0.707,-1,-0.707];
function circ(x, y, r){
  if (blocked(x, y)) return true;
  for (var i = 0; i < 8; i++) if (blocked(x + CX[i]*r, y + CY[i]*r)) return true;
  return false;
}
function inWater(x, y, r){
  var i, a;
  for (i = 0; i < world.water.length; i++){
    a = world.water[i]; if (x < a.minx - r || x > a.maxx + r || y < a.miny - r || y > a.maxy + r) continue;
    if (pip(a.pts, x, y) || (r > 0 && polyDist(a.pts, x, y, true) < r)) return true;
  }
  for (i = 0; i < world.waterLines.length; i++){
    a = world.waterLines[i]; var m = a.w/2 + r; if (x < a.minx - m || x > a.maxx + m || y < a.miny - m || y > a.maxy + m) continue;
    if (polyDist(a.pts, x, y, false) < m) return true;
  }
  return false;
}


