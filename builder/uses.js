/* AfterStreet Maps Builder: what each building is for. Reads the tags on a building (and on the shop, amenity or office points inside it),
   the brand and the name, and writes on the building:
     asmb:use    what it is, in a short key the floor-plan rules know (bigbox, club, home_improvement, supermarket, police, fire, gym, ...)
     asmb:label  a plain name for it ("Walmart Supercenter", "Police station", "Fitness centre")
     asmb:brand  the chain, when one is known
   and, where a chain or a name makes the map's own tags wrong or missing, the shop / amenity / leisure tags the game already understands, so the
   game's building kinds (engine/world.js kindOf) come out right: Walmart is a supermarket and not a clothes shop, Lowe's is a hardware store.
   OpenStreetMap tags win over guesses: a building already tagged amenity=police stays police whatever its name. Chains fix the known mistakes;
   names only fill gaps. The layouts for each use are in docs/MAP_BUILDING_USES.md. Classic script, installs into L (see inflate.js). */
(window.BLIB = window.BLIB || {}).uses = function(L){
'use strict';

/* chains: [pattern on "brand | name | operator", use, label, tags to set, brand]. The first match wins. */
var CHAINS = [
  [/wal-?mart\s*(neighbou?rhood|market)|neighbou?rhood market/i, 'supermarket', 'Walmart Neighborhood Market', {shop:'supermarket'}, 'Walmart'],
  [/wal-?mart/i, 'bigbox', 'Walmart Supercenter', {shop:'supermarket'}, 'Walmart'],
  [/\bsam'?s club\b/i, 'club', "Sam's Club", {shop:'wholesale'}, "Sam's Club"],
  [/\bcostco\b/i, 'club', 'Costco Wholesale', {shop:'wholesale'}, 'Costco'],
  [/\bbj'?s wholesale\b/i, 'club', "BJ's Wholesale Club", {shop:'wholesale'}, "BJ's"],
  [/(^|\| )target\b(?! (shooting|range|practice))/i, 'bigbox', 'Target', {shop:'supermarket'}, 'Target'],
  [/\bmeijer\b|fred meyer|\bkmart\b/i, 'bigbox', 'Supercentre', {shop:'supermarket'}],
  [/home depot/i, 'home_improvement', 'The Home Depot', {shop:'doityourself'}, 'The Home Depot'],
  [/\blowe'?s\b/i, 'home_improvement', "Lowe's", {shop:'doityourself'}, "Lowe's"],
  [/\bmenards\b|\bfleet farm\b|tractor supply/i, 'home_improvement', 'Home and farm store', {shop:'doityourself'}],
  [/\bace hardware\b|true value/i, 'hardware', 'Hardware store', {shop:'hardware'}],
  [/\bkroger\b|\baldi\b|safeway|publix|hy-?vee|schnucks|dillons|price chopper|food lion|harris teeter|whole foods|sprouts|trader joe|winco|save a lot|piggly|giant eagle|\bheb\b|albertsons|ingles/i, 'supermarket', 'Supermarket', {shop:'supermarket'}],
  [/walgreens|\bcvs\b|rite aid|duane reade/i, 'pharmacy_store', 'Pharmacy', {amenity:'pharmacy'}],
  [/dollar general|dollar tree|family dollar|five below|big lots/i, 'dollar_store', 'Variety store', {shop:'variety_store'}],
  [/best buy|gamestop|micro center/i, 'electronics', 'Electronics store', {shop:'electronics'}],
  [/autozone|o'?reilly auto|advance auto|napa auto|pep boys|jiffy lube|discount tire|\bmidas\b/i, 'auto_parts', 'Auto parts and service', {shop:'car_parts'}],
  [/mcdonald|burger king|wendy'?s|taco bell|\bkfc\b|\bsubway\b|sonic drive|chick-?fil-?a|popeyes|jack in the box|arby'?s|dairy queen|culver|whataburger|five guys|panda express|domino|pizza hut|little caesars|jimmy john|jersey mike|chipotle|panera/i, 'fast_food', 'Fast food', {amenity:'fast_food'}],
  [/starbucks|dunkin|tim hortons|caribou coffee|scooter'?s coffee|krispy kreme/i, 'cafe', 'Coffee shop', {amenity:'cafe'}],
  [/applebee|chili'?s|olive garden|\bihop\b|denny'?s|waffle house|cracker barrel|texas roadhouse|outback steak|red lobster|buffalo wild|perkins|golden corral/i, 'restaurant', 'Restaurant', {amenity:'restaurant'}],
  [/planet fitness|anytime fitness|la fitness|24 hour fitness|snap fitness|orangetheory|gold'?s gym|crunch fitness|life time fitness|\bymca\b|curves|crossfit/i, 'gym', 'Fitness centre', {leisure:'fitness_centre'}],
  [/casey'?s|quiktrip|phillips 66|exxon|chevron|sunoco|conoco|kum & go|love'?s travel|pilot flying|flying j|murphy usa|circle k|7-?eleven|\bwawa\b|sheetz|maverik|(^|\| )shell( |$|\|)|(^|\| )bp( |$|\|)/i, 'fuel', 'Gas station', {amenity:'fuel'}],
  [/(^|\| )chase( bank)?( |$|\|)|wells fargo|bank of america|\bus bank\b|u\.s\. bank|regions bank|pnc bank|truist|citibank|capital one|fifth third|credit union/i, 'bank', 'Bank', {amenity:'bank'}],
  [/marriott|hampton inn|holiday inn|hilton|best western|comfort inn|super 8|motel 6|days inn|la quinta|courtyard by|fairfield inn|sleep inn|econo lodge|quality inn|red roof|hyatt|residence inn|candlewood|staybridge|extended stay/i, 'hotel', 'Hotel', {tourism:'hotel'}],
  [/\bikea\b|bass pro|cabela|academy sports|dick'?s sporting|scheels/i, 'bigbox_special', 'Large specialty store', {shop:'sports'}]
];
/* names, for buildings with no brand and no useful tags of their own: [pattern, use, label, tags] */
var NAMES = [
  [/\b(police|sheriff|marshal|constable|public safety)\b/i, 'police', 'Police station', {amenity:'police'}],
  [/\bfire\s*(dept|department|station|house|district|protection)\b|\bfire & rescue\b/i, 'fire', 'Fire station', {amenity:'fire_station'}],
  [/\bhospital\b|medical cent(er|re)/i, 'hospital', 'Hospital', {amenity:'hospital'}],
  [/urgent care|\bclinic\b|\bdental\b|\bdentist\b|\bpediatric|family medicine|\bphysician/i, 'clinic', 'Clinic', {amenity:'clinic'}],
  [/\bpharmacy\b/i, 'pharmacy_store', 'Pharmacy', {amenity:'pharmacy'}],
  [/post office|\busps\b/i, 'post_office', 'Post office', {amenity:'post_office'}],
  [/city hall|town hall|village hall|county (building|office|admin)|municipal building/i, 'townhall', 'Town hall', {amenity:'townhall'}],
  [/court ?house/i, 'courthouse', 'Courthouse', {amenity:'courthouse'}],
  [/\blibrary\b/i, 'library', 'Library', {amenity:'library'}],
  [/elementary|middle school|high school|\bschool\b|preschool|kindergarten|\bdaycare\b|child ?care|learning cent(er|re)/i, 'school', 'School', {amenity:'school'}],
  [/\buniversity\b|\bcollege\b/i, 'college', 'College', {amenity:'college'}],
  [/church|chapel|cathedral|baptist|methodist|lutheran|catholic|presbyterian|pentecostal|assembly of god|\bmosque\b|synagogue|\btemple\b|\bparish\b|ministries|kingdom hall/i, 'church', 'Church', {amenity:'place_of_worship'}],
  [/farmers'? market|flea market|public market|\bmarket ?place\b/i, 'market', 'Market', {amenity:'marketplace'}],
  [/\bconvenience\b|\bmini ?mart\b|\bcorner (store|market)\b|\bquick stop\b|\bfood mart\b/i, 'convenience', 'Convenience store', {shop:'convenience'}],
  [/\bsupermarket\b|\bsupercenter\b|\bgrocery\b|\bfood market\b/i, 'supermarket', 'Grocery store', {shop:'supermarket'}],
  [/\bmarket$/i, 'grocery_small', 'Market', {shop:'convenience'}],
  [/\b(gym|fitness|athletic club|health club|recreation cent(er|re)|rec cent(er|re)|aquatic)\b/i, 'gym', 'Fitness centre', {leisure:'fitness_centre'}],
  [/\bbowling\b|\bskating\b|\bcinema\b|\btheat(er|re)\b|\bmovies?\b/i, 'venue', 'Entertainment venue', {amenity:'cinema'}],
  [/\bpub\b|\btavern\b|\bsaloon\b|\bbrewing\b|\btaproom\b|\bnight ?club\b|\bbar & grill\b/i, 'bar', 'Bar', {amenity:'bar'}],
  [/\bdiner\b|\bgrill\b|\bcafe\b|\bcafé\b|\bbistro\b|\bpizza\b|\bbbq\b|\brestaurant\b|\bsteakhouse\b/i, 'restaurant', 'Restaurant', {amenity:'restaurant'}],
  [/\bhotel\b|\binn\b|\bmotel\b|\blodge\b|\bsuites\b/i, 'hotel', 'Hotel', {tourism:'hotel'}],
  [/\bbank\b/i, 'bank', 'Bank', {amenity:'bank'}],
  [/\bhardware\b|\blumber\b|\bbuilding suppl/i, 'hardware', 'Hardware store', {shop:'hardware'}]
];
/* what plain building=* values mean, when nothing else says */
var PLAIN = {house:'house', detached:'house', semidetached_house:'house', terrace:'house', bungalow:'house', residential:'house', apartments:'apartments', dormitory:'apartments', hotel:'hotel',
  retail:'retail', commercial:'commercial', office:'office', industrial:'factory', warehouse:'warehouse', hangar:'hangar', barn:'barn', farm_auxiliary:'barn', stable:'barn', cowshed:'barn', greenhouse:'greenhouse',
  garage:'garage', garages:'garage', carport:'garage', shed:'shed', parking:'parking', church:'church', chapel:'church', mosque:'church', synagogue:'church', school:'school', university:'college', college:'college',
  hospital:'hospital', fire_station:'fire', civic:'townhall', government:'townhall', public:'townhall', stadium:'stadium', train_station:'station', transportation:'station', kindergarten:'school', supermarket:'supermarket'};
/* buildings a chain or name must not turn into a shop (a block of flats called "Chase Apartments") */
var HOMES = /^(house|detached|semidetached_house|terrace|bungalow|residential|apartments|dormitory|garage|garages|carport|shed|barn|farm_auxiliary|stable|cowshed|greenhouse|roof|ruins|hut|cabin)$/;
var STREETY = /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|place|pl|way|boulevard|blvd|circle|cir|terrace|trail|highway|hwy|apartments|apts|condos?|townhomes?|lofts?|estates|villas?)\.?$/i;
var AM = {police:['police', 'Police station'], fire_station:['fire', 'Fire station'], hospital:['hospital', 'Hospital'], clinic:['clinic', 'Clinic'], doctors:['clinic', 'Doctor'], dentist:['clinic', 'Dentist'],
  pharmacy:['pharmacy_store', 'Pharmacy'], school:['school', 'School'], kindergarten:['school', 'Kindergarten'], childcare:['school', 'Child care'], college:['college', 'College'], university:['college', 'University'],
  library:['library', 'Library'], place_of_worship:['church', 'Place of worship'], bank:['bank', 'Bank'], post_office:['post_office', 'Post office'], townhall:['townhall', 'Town hall'], courthouse:['courthouse', 'Courthouse'],
  restaurant:['restaurant', 'Restaurant'], cafe:['cafe', 'Cafe'], fast_food:['fast_food', 'Fast food'], bar:['bar', 'Bar'], pub:['bar', 'Pub'], nightclub:['bar', 'Night club'], fuel:['fuel', 'Gas station'],
  marketplace:['market', 'Market'], cinema:['venue', 'Cinema'], theatre:['venue', 'Theatre'], community_centre:['venue', 'Community centre'], arts_centre:['venue', 'Arts centre'], prison:['police', 'Prison'], parking:['parking', 'Parking']};
var SH = {supermarket:['supermarket', 'Supermarket'], convenience:['convenience', 'Convenience store'], bakery:['grocery_small', 'Bakery'], butcher:['grocery_small', 'Butcher'], greengrocer:['grocery_small', 'Greengrocer'],
  deli:['grocery_small', 'Deli'], department_store:['department_store', 'Department store'], doityourself:['home_improvement', 'Home improvement store'], hardware:['hardware', 'Hardware store'], wholesale:['club', 'Wholesale store'],
  mall:['mall', 'Shopping mall'], variety_store:['dollar_store', 'Variety store'], clothes:['clothes', 'Clothing store'], shoes:['clothes', 'Shoe store'], electronics:['electronics', 'Electronics store'], car:['car_dealer', 'Car dealer'],
  car_repair:['garage_shop', 'Car repair'], car_parts:['auto_parts', 'Auto parts'], books:['library', 'Book shop'], chemist:['pharmacy_store', 'Chemist'], alcohol:['bar', 'Liquor store'], sports:['bigbox_special', 'Sports store'], furniture:['furniture', 'Furniture store']};
var LE = {fitness_centre:['gym', 'Fitness centre'], sports_centre:['gym', 'Sports centre'], ice_rink:['gym', 'Ice rink'], stadium:['stadium', 'Stadium']};

/* the use of a set of tags: {use, label, brand, set, chain, byName, plain} or null. `set` is the tags to write where the map's own are missing or wrong. */
L.useOf = function(t){
  var home = HOMES.test(t.building || '') && !(t.shop || t.amenity || t.office || t.leisure || t.tourism), nm = ((t.brand || '') + ' | ' + (t.name || '') + ' | ' + (t.operator || '')), i, c;
  var nameOk = !home && !(t.name && STREETY.test(t.name));
  var soft = !t.brand && (t.amenity || (t.shop && !/^(department_store|variety_store|supermarket|general|wholesale|yes)$/.test(t.shop)));   /* a name alone does not overrule a shop or amenity tag */
  if ((nameOk && !soft) || t.brand){ for (i = 0; i < CHAINS.length; i++){ c = CHAINS[i]; if (c[0].test(t.brand ? (t.brand + ' | ' + (t.name || '')) : nm)) return {use:c[1], label:c[2], brand:c[4] || t.brand || undefined, set:c[3], chain:true}; } }
  if (t.amenity && AM[t.amenity]) return {use:AM[t.amenity][0], label:AM[t.amenity][1]};
  if (t.shop && SH[t.shop]) return {use:SH[t.shop][0], label:SH[t.shop][1]};
  if (t.shop) return {use:'retail', label:'Shop'};
  if (t.leisure && LE[t.leisure]) return {use:LE[t.leisure][0], label:LE[t.leisure][1]};
  if (t.tourism === 'hotel' || t.tourism === 'motel' || t.tourism === 'hostel') return {use:'hotel', label:'Hotel'};
  if (t.office) return {use:'office', label:'Office'};
  if (t.craft) return {use:'workshop', label:'Workshop'};
  if (t.healthcare) return {use:'clinic', label:'Clinic'};
  if (t.military) return {use:'police', label:'Military'};
  if (t.name && nameOk){ for (i = 0; i < NAMES.length; i++){ c = NAMES[i]; if (c[0].test(t.name)) return {use:c[1], label:c[2], set:c[3], byName:true}; } }
  var b = t.building; if (b && PLAIN[b]) return {use:PLAIN[b], label:null, plain:true};
  return null;
};


/* ---- framed structure ---- the wall kinds of the content chat's walls pack (assets/shaped/walls.js, docs/SHAPED.md "walls"): what a building is built from
   follows from its use, its floors, its size and its facing. Written as `asmb:wall` (the kind) and `asmb:frame` (wood, lightsteel, steel or concrete). */
L.WALLS = {wood_siding:['Wood frame, siding', 'wood', 3.0], wood_brick:['Wood frame, brick', 'wood', 3.0], lightsteel_sheet:['Light steel frame, sheet', 'lightsteel', 3.5], steel_cladding:['Steel frame, cladding', 'steel', 4.5],
  steel_curtain:['Steel frame, glass curtain wall', 'steel', 3.5], concrete_poured:['Poured concrete', 'concrete', 3.5], concrete_block:['Concrete block', 'concrete', 3.0], concrete_brick:['Brick on block', 'concrete', 3.5]};
L.frameOf = function(t, use, area){
  var lv = parseInt(t['building:levels'], 10) || (parseFloat(t.height) ? Math.max(1, Math.round(parseFloat(t.height)/3.4)) : 1), mat = t['building:material'] || '', brick = /brick/.test(mat), glass = /glass/.test(mat), big = area > 1200;
  switch (use){
    case 'house': case 'shed': case 'barn': case 'greenhouse': return brick && use === 'house' ? 'wood_brick' : 'wood_siding';
    case 'garage': return 'concrete_block';
    case 'garage_shop': case 'auto_parts': return area > 400 ? 'steel_cladding' : 'concrete_block';
    case 'apartments': return lv <= 3 ? (brick ? 'wood_brick' : 'wood_siding') : lv <= 5 ? (brick ? 'concrete_brick' : 'lightsteel_sheet') : 'concrete_poured';
    case 'bigbox': case 'club': case 'home_improvement': case 'bigbox_special': case 'warehouse': case 'factory': case 'hangar': case 'station': case 'stadium': case 'mall': case 'department_store': return 'steel_cladding';
    case 'supermarket': case 'gym': case 'venue': return area > 2500 ? 'steel_cladding' : 'lightsteel_sheet';
    case 'office': case 'bank': return glass || lv >= 4 ? (lv >= 6 ? 'concrete_poured' : 'steel_curtain') : (brick ? 'concrete_brick' : 'lightsteel_sheet');
    case 'hospital': case 'parking': return 'concrete_poured';
    case 'hotel': return lv >= 4 ? 'concrete_poured' : (brick ? 'concrete_brick' : 'lightsteel_sheet');
    case 'church': return area < 250 ? 'wood_siding' : 'concrete_brick';
    case 'school': case 'college': case 'police': case 'fire': case 'townhall': case 'courthouse': case 'library': case 'post_office': case 'clinic': return lv >= 2 || brick || big ? 'concrete_brick' : 'lightsteel_sheet';
    default: return big ? 'steel_cladding' : (brick ? 'wood_brick' : 'lightsteel_sheet');
  }
};
/* the footprint area in square metres of a flat lon/lat ring */
L.ringArea = function(c){ var a = 0, cl = Math.cos(c[1]*Math.PI/180); for (var i = 0; i + 3 < c.length; i += 2) a += c[i]*c[i + 3] - c[i + 2]*c[i + 1]; return Math.abs(a)/2*111320*cl*110540; };

/* the use of every building in a square; sq = {ways:[[tags, coords]], pois:[[lon, lat, tags]]}. Returns counts by use. */
L.uses = function(sq){
  var ways = sq.ways, G = {}, cs = 0.0015, counts = {}, bbs = {}, i;
  var cellOf = function(v){ return Math.floor(v/cs); };
  for (i = 0; i < ways.length; i++){ var t = ways[i][0], c = ways[i][1]; if (!t.building || !c || c.length < 8) continue;
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (var q = 0; q < c.length; q += 2){ if (c[q] < x0) x0 = c[q]; if (c[q] > x1) x1 = c[q]; if (c[q + 1] < y0) y0 = c[q + 1]; if (c[q + 1] > y1) y1 = c[q + 1]; }
    bbs[i] = [x0, y0, x1, y1];
    for (var gx = cellOf(x0); gx <= cellOf(x1); gx++) for (var gy = cellOf(y0); gy <= cellOf(y1); gy++) (G[gx + ',' + gy] = G[gx + ',' + gy] || []).push(i); }
  /* the named, shop, amenity and office points inside each building (the smallest building that holds the point) */
  var inside = {};
  (sq.pois || []).forEach(function(p){ var pt = p[2] || {}; if (pt.natural || !(pt.shop || pt.amenity || pt.office || pt.leisure || pt.craft || pt.tourism || pt.healthcare || pt.brand)) return;
    var cand = G[cellOf(p[0]) + ',' + cellOf(p[1])]; if (!cand) return; var best = -1, area = 1e18;
    for (var k = 0; k < cand.length; k++){ var bb = bbs[cand[k]]; if (p[0] < bb[0] || p[0] > bb[2] || p[1] < bb[1] || p[1] > bb[3]) continue;
      if (L.pip(ways[cand[k]][1], p[0], p[1])){ var ar = (bb[2] - bb[0])*(bb[3] - bb[1]); if (ar < area){ area = ar; best = cand[k]; } } }
    if (best >= 0) (inside[best] = inside[best] || []).push(p); });
  for (i = 0; i < ways.length; i++){ var tags = ways[i][0]; if (!tags.building) continue; if (tags.generated === 'yes' && tags['asmb:use']){ if (!tags['asmb:wall']){ var wa = L.frameOf(tags, tags['asmb:use'], 0); tags['asmb:wall'] = wa; tags['asmb:frame'] = L.WALLS[wa][1]; } counts[tags['asmb:use']] = (counts[tags['asmb:use']] || 0) + 1; continue; }
    var own = L.useOf(tags), pu = null, shops = 0, pts = tags.generated === 'yes' ? null : inside[i];   /* made-up buildings share one tag object per kind: never change it from a point inside one */
    if (pts){ pts.forEach(function(p){ var r = L.useOf(p[2]); if (!r || r.plain) return; if (p[2].shop) shops++; if (!pu || (r.chain && !pu.chain) || (pu.byName && !r.byName && !r.chain)) pu = r;
        if (r.set && (r.chain || r.byName)){ for (var kk in r.set) if (r.chain || !(p[2].shop || p[2].amenity || p[2].leisure || p[2].tourism)) p[2][kk] = r.set[kk]; } });
      if (shops >= 4 && (!own || own.plain || own.use === 'retail' || own.use === 'commercial')) pu = {use:'mall', label:'Shopping mall'}; }
    var use = own && own.chain ? own : (pu && pu.chain ? pu : (own && !own.plain && !own.byName ? own : (pu || own)));
    if (!use) continue;
    if (use.set && (use.chain || use.byName || use === pu)){ for (var k2 in use.set) if (use.chain || !(tags.shop || tags.amenity || tags.leisure || tags.tourism || tags.office)) tags[k2] = use.set[k2]; }
    if (!tags['asmb:wall'] && tags.generated !== 'yes'){ var wk = L.frameOf(tags, use.use, L.ringArea(ways[i][1])); tags['asmb:wall'] = wk; tags['asmb:frame'] = L.WALLS[wk][1]; }
    else if (!tags['asmb:wall']){ var wg = L.frameOf(tags, use.use, 0); tags['asmb:wall'] = wg; tags['asmb:frame'] = L.WALLS[wg][1]; }
    tags['asmb:use'] = use.use; if (use.label) tags['asmb:label'] = use.label; if (use.brand) tags['asmb:brand'] = use.brand;
    counts[use.use] = (counts[use.use] || 0) + 1;
  }
  return counts;
};
};
