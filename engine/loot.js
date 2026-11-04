/* ---- 0.115.0: what is inside things. Every searchable thing has its own list of what it can hold, and the list depends on where it is.
   A bin holds scraps and rubbish; a medicine cabinet holds medicine, more of it in a hospital; a nightstand in a house where someone keeps a pistol holds the pistol and its rounds.
   LOOTDEF[thing] = {n: searches per opening (rolls), cust: chance of a Workshop item, s: {scope: {item: weight}}}
   scope: 'any' (everywhere without a better match), 'k:<kind of building>' (see KIND), 'h:<kind of household>' (added on top in homes that keep weapons)
   A table's weights are relative; none = nothing there. '_n' inside a table sets how many searches that scope gets. Items are keys of ITEMS, or the street weapons (st-axe, st-crowbar...).
   Players change any list in Settings (kept in this browser as LOOTUSER) and the rules for which homes keep weapons (LOOTCFG). */
var LOOTDEF = {}, LOOTUSER = {}, LOOTCFG = {guns:1, north:true};
var HOMEKINDS = {house:1, apartments:1, garage:1};
var HHN = {defense:'a home with a pistol or shotgun for defence', hunter:'a hunter\'s home', woodsman:'a woodsman\'s home (axes, bows)', handyman:'a handyman\'s home', sporty:'a sporty home (bats, sticks)'};
var STREETW = {'st-axe':'Axe', 'st-crowbar':'Crowbar', 'st-wrench':'Wrench', 'st-cricket-bat':'Cricket bat', 'st-frying-pan':'Frying pan', 'st-hockey-stick':'Hockey stick', 'st-garden-rake':'Garden rake', 'st-broom-spear':'Broom spear', 'st-umbrella':'Umbrella'};
(function(){
  var D = function(name, o, s){ LOOTDEF[name] = {n:o.n || 1, cust:o.cust || 0, s:s}; };
  var CLO = {sweater:2, coat:1.2, thermals:1, beanie:1, gloves:.8, cap:.8, boots:.5, trousers:.6};
  /* rubbish: scraps, and old food only where food is kept */
  D('bin', {}, {any:{scrap:2, rotten:.5, tape:.2, wood:.3, none:7}, 'k:restaurant':{rotten:3, food:.4, scrap:1, none:3}, 'k:grocery':{rotten:3, food:.5, scrap:1, none:3}, 'k:bar':{rotten:1.5, water:.4, scrap:1, none:4}, 'k:hospital':{scrap:1, bandage:.4, none:6}, 'k:clinic':{scrap:1, bandage:.4, none:6},
    'k:garage':{scrap:3, tape:.5, wood:.5, none:4}, 'k:hardware':{scrap:3, tape:.5, wood:.8, none:4}, 'k:office':{scrap:.8, battery:.3, none:7}, 'k:school':{scrap:1, rotten:.8, food:.3, none:6}});
  D('washing machine', {}, {any:{sweater:1, thermals:.5, coat:.5, gloves:.2, scrap:.5, none:5}});
  /* medicine */
  D('medicine cabinet', {n:2}, {any:{bandage:4, antibio:1, medkit:2, splint:.4, none:2}, 'k:hospital':{_n:3, medkit:5, bandage:6, antibio:4, splint:2.5, none:.8}, 'k:clinic':{_n:3, medkit:5, bandage:6, antibio:4, splint:2.5, none:.8}, 'k:fire':{medkit:4, bandage:4, splint:1.5, none:1}, 'k:school':{bandage:4, medkit:1.5, none:2}, 'k:police':{bandage:3, medkit:2.5, none:1.5}, 'k:gym':{bandage:3, medkit:2, splint:.5, none:2}});
  D('bathroom cabinet', {}, {any:{bandage:3, antibio:.5, medkit:1.2, water:.6, none:3}, 'k:hospital':{bandage:4, medkit:3, antibio:2, none:1.5}, 'k:clinic':{bandage:4, medkit:3, antibio:2, none:1.5}, 'k:hotel':{bandage:1, water:.4, none:6}});
  D('dresser', {}, {any:CLO, 'k:house':{sweater:2, thermals:1, beanie:1, gloves:.8, cap:.8, battery:.6, flashlight:.3, none:3}, 'k:hotel':{sweater:.6, thermals:.3, none:7}, 'k:church':{sweater:1.5, beanie:1, none:3}, 'k:library':{map:1.5, book:.8, none:6},
    'h:defense':{ammo:1.2}, 'h:hunter':{rifle:.8}});
  D('wardrobe', {cust:.02}, {any:{coat:2, raincoat:1.5, leather:.4, sweater:1.5, boots:1, trousers:.8, 'st-umbrella':.3, none:3},
    'k:house':{coat:2, raincoat:1.5, leather:.4, sweater:1.5, boots:1, trousers:.8, 'st-umbrella':.4, none:3}, 'k:hotel':{coat:.6, raincoat:.4, none:7},
    'h:defense':{pump_shotgun:.5, shell:2.5, ammo:.6}, 'h:hunter':{hunting_rifle:.5, double_barrel:.35, rifle:2.5, shell:2}, 'h:sporty':{'st-cricket-bat':.7, 'st-hockey-stick':.5}, 'h:woodsman':{'st-axe':.3, quiver:.4, arrow:1.5}});
  D('bookshelf', {}, {any:{book:3, map:.8, none:3}, 'k:library':{book:7, map:1.5, none:.8}, 'k:school':{book:4, map:.8, none:2}, 'k:office':{book:1.5, map:.5, none:5}, 'k:house':{book:1.5, map:.6, none:4}});
  D('nightstand', {}, {any:{battery:2, flashlight:1, medkit:.5, key:.8, none:3}, 'k:hotel':{battery:.6, flashlight:.3, book:.3, none:7}, 'k:hospital':{battery:.5, bandage:1, water:1, none:4},
    'h:defense':{revolver:.6, ammo:2.5}, 'h:hunter':{ammo:.5}});
  /* food and drink */
  D('fridge', {n:2}, {any:{fresh:4, food:1, water:3, none:2}, 'k:restaurant':{fresh:4, food:3, water:2, none:1}, 'k:grocery':{fresh:4, food:2, water:3, none:1}, 'k:hotel':{water:3, food:2, fresh:.6, none:1.5}, 'k:hospital':{water:2.5, food:1.5, fresh:.8, none:2}, 'k:clinic':{water:1.5, antibio:.8, bandage:.3, none:3}, 'k:office':{fresh:2, water:2, food:1, none:3}, 'k:fire':{fresh:2, food:2, water:2.5, none:1.5}, 'k:police':{fresh:1.5, food:2, water:2.5, none:2}});
  D('reach in fridge', {n:2}, {any:{fresh:5, food:2, water:3, none:1}});
  D('cupboard', {}, {any:{food:4, water:1, battery:.5, tape:.3, none:2}, 'k:house':{food:4, water:1, battery:.5, 'st-frying-pan':.5, none:2}, 'k:restaurant':{food:4, water:1.5, 'st-frying-pan':.6, none:1.5}, 'k:office':{food:2.5, water:1.5, none:3}, 'k:fire':{food:3, water:1.5, none:2}, 'h:woodsman':{'st-frying-pan':.2}});
  D('vending machine', {}, {any:{food:4, water:4, none:1}, 'k:gym':{water:7, food:1, none:1}, 'k:school':{food:5, water:3, none:1.5}, 'k:hospital':{food:3, water:5, none:1}});
  D('vending soda', {}, {any:{water:6, food:.6, none:1}}); D('vending snack', {}, {any:{food:6, water:1, none:1}});
  D('wire rack', {}, {any:{food:3, scrap:.6, none:3}}); D('snack rack', {}, {any:{food:5, none:2}});
  D('roller grill', {}, {any:{food:2.5, scrap:.3, none:2}}); D('hot case', {}, {any:{food:3, scrap:.2, none:2}}); D('steam table', {}, {any:{food:2, none:4}});
  D('slush machine', {}, {any:{water:3, none:3}}); D('coffee station', {}, {any:{water:1.5, food:.8, battery:.2, none:3}}); D('tap tower', {}, {any:{water:3, none:2}}); D('keg stack', {}, {any:{water:2, scrap:1, none:3}});
  D('fryer single', {}, {any:{scrap:.5, none:7}}); D('flat top grill', {}, {any:{scrap:.5, food:.4, none:7}}); D('sink three comp', {}, {any:{water:1.5, scrap:.3, none:5}}); D('dish machine', {}, {any:{scrap:1, none:6}}); D('host stand', {}, {any:{map:.6, key:.3, flashlight:.5, none:5}});
  /* shelves and crates: they are what the place sells or stores */
  var SH = {food:5, fresh:3, water:4, battery:.4, seeds:.4, none:1.2};
  D('shelves', {n:2}, {any:{food:2.5, water:1.5, battery:.8, tape:.8, scrap:1, seeds:.4, none:3},
    'k:house':{food:3, water:1.5, battery:.8, tape:.6, scrap:1, seeds:.4, wood:.5, 'st-garden-rake':.25, 'st-broom-spear':.25, none:3}, 'k:apartments':{food:3, water:1.5, battery:.8, tape:.5, none:3},
    'k:grocery':Object.assign({_n:3}, SH), 'k:restaurant':{food:5, water:2.5, none:2}, 'k:bar':{water:5, food:2, none:2}, 'k:fuel':{food:3, water:3, battery:1, map:1.2, none:2},
    'k:clinic':{_n:3, medkit:4, bandage:5, antibio:3, splint:2, water:1.5, none:1}, 'k:hospital':{_n:3, medkit:4, bandage:5, antibio:3, splint:2, water:1.5, none:1},
    'k:hardware':{scrap:4, wood:3, tape:3, battery:1.5, flashlight:.8, lantern:.6, seeds:1.2, fuel:.8, nails:1.5, none:1.5}, 'k:garage':{scrap:4, tape:1.5, wood:1.5, battery:1, fuel:1.5, none:2},
    'k:outdoors':{lantern:1.5, flashlight:1.5, battery:1.5, map:1.5, tape:1, arrow:1.2, bolt:.5, quiver:.4, flareshell:.4, food:1, 'st-axe':.5, none:1.5},
    'k:electronics':{battery:5, radio:1.5, flashlight:2, scrap:1, none:1.5}, 'k:clothes':{boots:2, cap:2, gloves:1.5, beanie:1.5, none:1.5}, 'k:shop':{food:2, water:2, battery:1.5, map:.8, scrap:1.5, tape:.6, none:2},
    'k:police':{ammo:1.5, flashlight:1, battery:1.5, tape:.8, none:3}, 'k:fire':{medkit:1.5, bandage:2, flashlight:1, battery:1, tape:.8, scrap:.8, none:2},
    'k:warehouse':{scrap:4, wood:3, fuel:1.5, battery:1, tape:1.2, none:2}, 'k:school':{book:2, food:1, battery:1, scrap:.8, none:4}, 'k:church':{water:2, food:1.5, lantern:1, none:3}, 'k:office':{battery:2, scrap:1, water:1, none:4}, 'k:library':{book:3, none:3}, 'k:hotel':{water:2, food:1.5, battery:1, none:3},
    'h:woodsman':{'st-axe':.6, 'st-garden-rake':.3, arrow:1, bolt:.5}, 'h:handyman':{'st-crowbar':.7, 'st-wrench':.6, toolkit:.4}, 'h:sporty':{'st-hockey-stick':.4}});
  D('crate', {n:2, cust:.04}, {any:{scrap:3, wood:2, food:1, water:.8, battery:.6, tape:.5, none:2},
    'k:house':{scrap:2, wood:2, food:1.5, water:1, battery:.6, tape:.5, seeds:.3, 'st-garden-rake':.2, none:2.5}, 'k:apartments':{scrap:2, food:2, water:1.5, battery:.6, none:3},
    'k:warehouse':{scrap:4, wood:3, fuel:2, battery:1, tape:1, tire:.5, chunk:1, none:1.5}, 'k:garage':{scrap:3.5, fuel:2, wood:1.5, tire:.8, parts:.8, tape:1, none:1.5}, 'k:parking':{fuel:2, scrap:2, tire:1.2, carbat:.8, none:2},
    'k:hardware':{scrap:3.5, wood:3, tape:1.5, fuel:1, nails:1.5, 'st-axe':.3, 'st-garden-rake':.3, seeds:.8, none:1}, 'k:grocery':{food:6, water:4, fresh:1, none:1}, 'k:restaurant':{food:5, water:3, none:1.5},
    'k:outdoors':{arrow:2, bolt:1, shell:2, rifle:1.5, lantern:1.2, flashlight:.8, quiver:.5, recurve_bow:.15, crossbow:.1, none:1.5}, 'k:police':{ammo:5, rifle:3, shell:3, flareshell:1, flare_gun:.15, none:1}, 'k:fire':{medkit:2, bandage:2, 'st-axe':.8, fuel:1, flareshell:.6, flare_gun:.15, radio:.5, water:1, none:1.5},
    'k:church':{water:2, food:1.5, lantern:1.5, none:3}, 'k:venue':{flashlight:1, battery:1.5, lantern:.6, scrap:1, none:3}, 'k:hotel':{coat:1, water:1, scrap:.5, none:4}, 'k:school':{book:1.5, scrap:1, food:.8, none:3}, 'k:clinic':{bandage:2, medkit:1.5, splint:.8, none:2}, 'k:hospital':{bandage:3, medkit:2.5, antibio:1.5, splint:1, none:1.5},
    'k:electronics':{battery:4, radio:1, scrap:1.5, none:1.5}, 'k:clothes':{sweater:2, boots:1, coat:1, none:2}, 'k:fuel':{fuel:3, food:1.5, water:1.5, none:1.5}, 'k:shop':{food:2, water:1.5, scrap:1.5, battery:.8, none:2}, 'k:gym':{water:3, bandage:.6, none:3}, 'k:bank':{scrap:1, none:6}, 'k:office':{scrap:1.5, battery:1.5, none:3},
    'h:woodsman':{'st-axe':.8, arrow:2, bolt:1, quiver:.4, crossbow:.3, recurve_bow:.3}, 'h:hunter':{arrow:1, shell:1, rifle:1}, 'h:handyman':{'st-crowbar':.8, 'st-wrench':.5, toolkit:.4, tape:.5}, 'h:sporty':{'st-hockey-stick':.5, 'st-cricket-bat':.4}, 'h:defense':{shell:.8}});
  D('storage rack', {n:2, cust:.05}, {any:{scrap:3, wood:2, fuel:1, battery:.8, tape:.8, none:2}, 'k:warehouse':{scrap:4, wood:3.5, fuel:2, battery:1, tape:1.2, tire:.4, parts:.4, chunk:1, none:1.5}, 'k:garage':{scrap:3, parts:1.5, tire:.8, fuel:1, toolkit:.4, none:1.5},
    'k:grocery':{food:6, water:4, fresh:1, none:1}, 'k:outdoors':{lantern:1.5, flashlight:1, battery:1.2, arrow:1, bolt:.5, boots:1, raincoat:1, none:1.5}, 'k:hardware':{scrap:3, wood:2.5, tape:2, nails:1.5, battery:1, none:1}, 'k:clothes':{sweater:2, coat:1.5, boots:1.5, none:1.5}, 'k:electronics':{battery:4, radio:1.5, flashlight:1, none:1.5},
    'k:hospital':{medkit:3, bandage:4, antibio:2, splint:1.5, none:1}, 'k:clinic':{medkit:3, bandage:4, antibio:2, splint:1.5, none:1}, 'k:office':{scrap:1, battery:1, none:5}, 'k:venue':{flashlight:1, battery:1.5, scrap:1.5, none:2}, 'k:school':{book:2, scrap:1, food:1, none:3}});
  D('display case', {}, {any:{battery:1, flashlight:.8, map:.6, scrap:1, none:3}, 'k:electronics':{battery:3, radio:1.5, flashlight:1.5, scrap:1, none:1.5}, 'k:shop':{battery:1.2, flashlight:.8, map:.8, seeds:.4, scrap:1, none:2}});
  D('clothes rack', {}, {any:{coat:2, sweater:2, raincoat:2, leather:.8, beanie:1, cap:1, thermals:1, trousers:1, none:2}, 'k:outdoors':{raincoat:3, boots:2.5, gloves:2, thermals:1.5, beanie:1.5, cap:1.5, helmet:.4, none:1.5}, 'k:clothes':{coat:2, sweater:2.5, raincoat:2, leather:1, beanie:1.5, cap:1.5, thermals:1.2, trousers:1.2, boots:1.5, none:1.2}});
  D('luggage cart', {}, {any:{coat:1, sweater:1, raincoat:.5, boots:.3, none:3}});
  D('till', {}, {any:{battery:.8, scrap:.6, key:.3, none:4}, 'k:grocery':{battery:.6, key:.3, 'st-cricket-bat':.2, none:4}, 'k:fuel':{battery:.6, key:.4, 'st-cricket-bat':.2, revolver:.06, none:4}, 'k:bar':{'st-cricket-bat':.4, flashlight:.4, key:.3, revolver:.06, none:3}, 'k:outdoors':{ammo:1.5, shell:.8, key:.3, map:.3, revolver:.15, none:2.5}, 'k:hardware':{tape:.5, key:.4, 'st-crowbar':.15, none:3}, 'k:electronics':{battery:2, flashlight:.5, none:3}, 'k:clothes':{key:.3, none:5}});
  D('filing cabinet', {}, {any:{map:.4, key:.4, scrap:.6, none:6}, 'k:police':{key:1, map:.5, ammo:.4, none:4}, 'k:bank':{key:.8, none:6}, 'k:school':{map:.8, key:.4, book:.5, none:5}, 'k:hospital':{none:8, bandage:.2}});
  D('safe', {n:2, cust:.08}, {any:{ammo:2, revolver:.6, key:1, battery:.6, none:3}, 'k:bank':{key:2, scrap:1.5, ammo:1, revolver:.4, radio:.5, none:2.5}, 'k:house':{ammo:1, key:1.5, battery:.5, none:4}, 'h:defense':{revolver:1.2, ammo:3, pump_shotgun:.3, shell:1.5}, 'h:hunter':{hunting_rifle:.7, double_barrel:.3, rifle:3, shell:1.5}, 'k:hotel':{key:1, none:6}});
  D('locker', {cust:.03}, {any:{coat:.8, battery:.8, key:.5, none:4}, 'k:school':{food:1.5, water:1, book:2, cap:.6, sweater:.6, battery:.4, 'st-cricket-bat':.25, 'st-hockey-stick':.2, none:3},
    'k:gym':{water:3, sweater:1, cap:1, gloves:.6, bandage:1, 'st-cricket-bat':.4, none:3}, 'k:police':{helmet:1.5, leather:.5, ammo:1.5, radio:.8, flashlight:1, bandage:1, key:1, none:2},
    'k:fire':{helmet:2, gloves:1.5, boots:1.5, coat:1, 'st-axe':1, flashlight:1, none:1.5}, 'k:hospital':{coat:.6, sweater:.6, medkit:1.2, bandage:1, flashlight:.5, none:3},
    'k:garage':{gloves:1, boots:.8, trousers:.8, 'st-wrench':.4, tape:.6, none:3}, 'k:hardware':{gloves:1, boots:.8, trousers:.8, 'st-wrench':.3, none:3}, 'k:warehouse':{gloves:1, boots:1, helmet:.6, 'st-crowbar':.3, none:3}, 'k:bank':{key:1, scrap:.8, ammo:.4, none:5}, 'k:office':{coat:1, battery:.6, key:.8, none:4}, 'k:church':{none:6, coat:.5}, 'k:venue':{flashlight:.8, battery:.8, none:5}, 'k:electronics':{battery:2, scrap:1, none:3}});
  D('gun locker', {n:2, cust:.08}, {any:{ammo:6, flashlight:1, none:1}, 'k:police':{ammo:6, rifle:3, shell:3, pump_shotgun:.7, carbine:.5, revolver:.5, flashlight:1, none:1}, 'k:outdoors':{hunting_rifle:1.2, double_barrel:.8, pump_shotgun:.5, rifle:3, shell:3, ammo:2, crossbow:.3, recurve_bow:.3, arrow:1.5, bolt:1, none:1}});
  D('tool bench', {n:1, cust:.05}, {any:{scrap:4, battery:1, flashlight:.5, wood:1, tape:1.5, 'st-wrench':.3, 'st-crowbar':.2, none:1}, 'k:garage':{scrap:3, tape:1.5, toolkit:.6, parts:.8, tire:.4, 'st-wrench':.7, 'st-crowbar':.6, 'st-axe':.2, none:1}, 'k:hardware':{scrap:3, tape:2, toolkit:.6, 'st-wrench':.7, 'st-crowbar':.6, 'st-axe':.5, wood:1, none:1},
    'k:fire':{'st-axe':.9, 'st-crowbar':.8, tape:1, flashlight:.8, scrap:1.5, none:1}, 'k:police':{tape:1, flashlight:.8, battery:1, ammo:1, scrap:1, none:2}, 'k:warehouse':{scrap:3, tape:1.5, 'st-crowbar':.5, wood:1, none:1.5}, 'k:house':{scrap:3, tape:1.5, battery:.8, wood:1, none:2},
    'h:handyman':{'st-crowbar':1, 'st-wrench':1, toolkit:.5}, 'h:woodsman':{'st-axe':1, tape:.5}});
  D('tool cabinet rollaway', {}, {any:{scrap:3, toolkit:.9, tape:1.2, 'st-wrench':.6, 'st-crowbar':.4, none:2}}); D('parts shelf', {n:2}, {any:{scrap:2.5, parts:2, tire:.6, carbat:.4, none:2}});
  D('tire changer', {}, {any:{tire:.5, scrap:1, none:4}}); D('wheel balancer', {}, {any:{scrap:1, tape:.3, none:5}}); D('air compressor', {}, {any:{scrap:1, fuel:.3, battery:.3, none:4}}); D('oil drum rack', {}, {any:{fuel:3, scrap:.5, none:2}}); D('lift two post', {}, {any:{scrap:1, none:6}}); D('service desk', {}, {any:{key:1.2, map:.5, tape:.5, none:4}});
  D('front desk', {}, {any:{key:2, map:1, flashlight:1, battery:.8, none:3}}); D('key rack wall', {}, {any:{key:4, none:2}}); D('hotel bed', {}, {any:{battery:.2, none:7}}); D('hotel dresser tv', {}, {any:{sweater:.8, coat:.5, battery:1, none:3}});
  D('deposit table', {}, {any:{key:.2, none:6}}); D('queue stanchion', {}, {any:{scrap:1, none:6}}); D('brochure rack', {}, {any:{map:3, book:.5, none:3}}); D('po box wall', {}, {any:{key:.5, map:.3, none:5}}); D('parcel scale', {}, {any:{scrap:.3, none:6}});
  D('mail sort rack', {}, {any:{food:.5, battery:.8, medkit:.3, coat:.3, book:.3, none:3}}); D('dental chair', {}, {any:{antibio:.5, bandage:.6, none:4}}); D('sterilizer counter', {}, {any:{bandage:2, antibio:1, splint:.3, none:3}});
  /* what a car, truck or army vehicle carries */
  D('trunk', {n:3}, {any:{scrap:3, water:1, food:1, tire:.8, carbat:.5, toolkit:.25, fuel:1, ammo:.5, battery:.6, none:4},
    'k:wreck':{_n:2, scrap:3, water:1, food:1, tire:.8, carbat:.5, toolkit:.25, fuel:1, ammo:.5, battery:.6, none:4},
    'k:military':{_n:5, ammo:3, rifle:3.5, shell:2.5, flareshell:1, flare_gun:.25, carbine:.7, pump_shotgun:.4, revolver:.3, hunting_rifle:.15, medkit:1.8, bandage:1.5, radio:1.2, battery:1, flashlight:.8, helmet:1.2, shovel:.4, fuel:.8, none:1.5},
    'k:police':{_n:3, ammo:3, shell:2.5, rifle:1, pump_shotgun:.4, revolver:.3, flashlight:1.5, radio:1, medkit:1, bandage:1, battery:1, helmet:.6, flareshell:1, flare_gun:.1, key:.4, none:2},
    'k:ambulance':{_n:4, medkit:5, bandage:6, antibio:2.5, splint:3, water:1.5, flashlight:.8, battery:.8, none:1},
    'k:fire':{_n:4, medkit:2, bandage:2, splint:1, helmet:1.5, gloves:1.2, boots:1, 'st-axe':1.2, 'st-crowbar':.8, flashlight:1, flareshell:.8, flare_gun:.2, fuel:1, water:2, none:1.5},
    'k:work':{_n:3, scrap:4, toolkit:1, tape:1.5, fuel:2, tire:.8, parts:.8, 'st-wrench':.7, 'st-crowbar':.5, gloves:.8, helmet:.5, none:1.5},
    'k:truck':{_n:3, scrap:3, wood:1.5, fuel:1.5, tire:1, carbat:.6, toolkit:.4, food:1.2, water:1.2, tape:.8, none:3}});
  /* supplies lying about in the open on the map, by the kind of place they belong to */
  D('supply stash', {n:2, cust:.06}, {any:{scrap:3, food:2, water:2, battery:1, none:1}, 'k:food':{food:6, fresh:3, water:4, none:.5}, 'k:medical':{medkit:6, bandage:3, antibio:1.5, splint:1, water:1, none:.5}, 'k:police':{ammo:8, rifle:2, shell:2.5, medkit:1, radio:1, battery:2, carbine:.35, pump_shotgun:.5, revolver:.6, helmet:.8, none:.5},
    'k:industrial':{scrap:5, wood:4, fuel:2, battery:1, chunk:2.5, tape:1.2, toolkit:.4, 'st-crowbar':.3, 'st-axe':.2, none:.5}, 'k:shop':{food:2, water:2, scrap:2, battery:1.6, medkit:1, coat:.6, map:.8, radio:.3, none:.8}, 'k:civic':{water:2, food:2, battery:2, flashlight:1, medkit:.8, scrap:1, none:1.5}, 'k:house':{food:3, water:2, scrap:1.5, wood:1, battery:.9, medkit:.5, seeds:.25, none:1.5}});
})();
var LOOTKINDS = ['house', 'apartments', 'garage', 'grocery', 'restaurant', 'bar', 'clinic', 'hospital', 'police', 'fire', 'outdoors', 'hardware', 'fuel', 'warehouse', 'parking', 'clothes', 'electronics', 'shop', 'school', 'library', 'church', 'office', 'bank', 'hotel', 'gym', 'venue'];
var LOOTVEH = {wreck:'a wrecked car', military:'an army vehicle', police:'a police car', ambulance:'an ambulance', fire:'a fire engine', work:'a work truck (tow, dump, digger...)', truck:'a truck or van'};
var LOOTCAT = {food:'a food stash', medical:'a medical stash', police:'an armoury stash', industrial:'a workshop stash', shop:'a shop stash', civic:'a public-building stash', house:'a home stash'};
function lootScopeName(sc){
  var t = sc.slice(2); if (sc === 'any') return 'Anywhere else'; if (sc.charAt(0) === 'h') return HHN[t] || t;
  if (LOOTVEH[t]) return LOOTVEH[t]; if (LOOTCAT[t] && !KIND[t]) return LOOTCAT[t]; return (KIND[t] ? KIND[t].label : t);
}
function lootThingName(k){ return k.replace(/\b[a-z]/, function(c){ return c.toUpperCase(); }); }
function lootLoadUser(){
  LOOTUSER = {}; try { var s = JSON.parse(localStorage.getItem('lastblock:lootdef') || 'null'); if (s && typeof s === 'object') LOOTUSER = s; } catch (e) {}
  try { var c = JSON.parse(localStorage.getItem('lastblock:lootcfg') || 'null'); if (c){ LOOTCFG.guns = +c.guns >= 0 ? +c.guns : 1; LOOTCFG.north = c.north !== false; } } catch (e) {}
}
function lootSave(){ try { localStorage.setItem('lastblock:lootdef', JSON.stringify(LOOTUSER)); localStorage.setItem('lastblock:lootcfg', JSON.stringify(LOOTCFG)); } catch (e) {} }
/* the table for a scope: the player's own if they changed it, else the built-in one */
function lootScope(name, sc){ var u = LOOTUSER[name] && LOOTUSER[name].s && LOOTUSER[name].s[sc]; if (u) return u; var d = LOOTDEF[name]; return d && d.s[sc] || null; }
function lootScopes(name){ var o = {}, d = LOOTDEF[name], u = LOOTUSER[name]; if (d) for (var k in d.s) o[k] = 1; if (u && u.s) for (var k2 in u.s) o[k2] = 1; return Object.keys(o); }
function lootRolls(name){ var u = LOOTUSER[name]; return u && u.n > 0 ? u.n : (LOOTDEF[name] ? LOOTDEF[name].n : 1); }
/* ---- which homes keep weapons ---- */
function lootCity(b){   /* 0 in the country, 1 in the dense middle: how many buildings stand within 90 m */
  var G0 = 16, r0 = Math.ceil(90/G0), cx0 = Math.floor(b.cx/G0), cy0 = Math.floor(b.cy/G0), n = 0, seen = {};
  for (var gy = cy0 - r0; gy <= cy0 + r0; gy++) for (var gx = cx0 - r0; gx <= cx0 + r0; gx++){ var l = world.grid.get(gk(gx, gy)); if (l) for (var i = 0; i < l.length; i++){ var q = l[i]; if (q === b || seen[q.id] || Math.hypot(q.cx - b.cx, q.cy - b.cy) > 90) continue; seen[q.id] = 1; n++; } }
  return Math.max(0, Math.min(1, (n - 6)/30));
}
function lootNorth(b){ var y0 = world.core ? world.core.y0 : world.miny, y1 = world.core ? world.core.y1 : world.maxy; return y1 > y0 && (b.cy - y0)/(y1 - y0) < 0.36; }   /* north is toward smaller y */
function householdOf(b){
  if (b.hh) return b.hh;
  if (!HOMEKINDS[b.kind] || !world) return b.hh = {type:'none'};
  var north = LOOTCFG.north && lootNorth(b), city = north ? 0 : lootCity(b), base = b.kind === 'apartments' ? 0.2 : b.kind === 'garage' ? 0.3 : 0.38;
  var p = Math.max(0, Math.min(0.95, base*(north ? 1.5 : 1 - 0.7*city)*LOOTCFG.guns));
  if (hash(b.id, 41, 3) >= p) return b.hh = {type:'none', p:p, north:north, city:city};
  var W = b.kind === 'apartments' ? {defense:50, sporty:25, handyman:25} : b.kind === 'garage' ? {handyman:50, woodsman:30, sporty:10, hunter:10} : {defense:30, hunter:26, woodsman:16, handyman:16, sporty:12};
  if (north){ if (W.hunter) W.hunter *= 1.7; if (W.woodsman) W.woodsman *= 1.5; } else if (city > 0.5) W.defense = (W.defense || 0)*1.5;
  var tot = 0, k; for (k in W) tot += W[k]; var r = hash(b.id, 42, 4)*tot; for (k in W){ r -= W[k]; if (r <= 0) break; }
  return b.hh = {type:k, p:p, north:north, city:city};
}
/* the table for one thing in one place: {tab, n, cust} or null when the game has nothing special for it */
function lootNameOf(o){ return o.corpse ? null : !o.b && o.cat ? 'supply stash' : (o.name || '').toLowerCase(); }
function lootTable(o, scopeKind, extra){
  var name = o.trunk ? 'trunk' : lootNameOf(o); if (!name || !(LOOTDEF[name] || LOOTUSER[name])) return null;
  var kind = scopeKind || (o.b && o.b.kind) || o.cat, tab = lootScope(name, 'k:' + kind) || lootScope(name, 'any'); if (!tab) return null;
  var t = {}, k, n = tab._n || lootRolls(name); for (k in tab) if (k !== '_n') t[k] = tab[k];
  var hh = extra || (o.b && HOMEKINDS[o.b.kind] ? householdOf(o.b) : null);
  if (hh && hh.type !== 'none'){ var h = lootScope(name, 'h:' + hh.type); if (h) for (k in h) t[k] = (t[k] || 0) + h[k]; }
  return {tab:t, n:n, cust:LOOTUSER[name] && LOOTUSER[name].cust !== undefined ? LOOTUSER[name].cust : LOOTDEF[name] ? LOOTDEF[name].cust : 0};
}
/* which vehicle scope a car's boot belongs to */
function lootVehKind(v, key){
  var k = String(key || v.kind || '').toLowerCase();
  if (/army|humvee|armou?red|apc|ammo_trailer|military|transport_heli|patrol_boat|jeep/.test(k)) return 'military';
  if (v.dead === 'wreck' || v.dead === true || v.dead) return 'wreck';
  if (/police/.test(k)) return 'police'; if (/ambulance/.test(k)) return 'ambulance'; if (/fire/.test(k)) return 'fire';
  if (/tow|dump|mixer|garbage|excavator|bulldozer|crane|loader/.test(k)) return 'work';
  if (/truck|van|bus|semi|flatbed|trailer|motorhome/.test(k)) return 'truck';
  return 'any';
}
