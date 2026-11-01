/* AfterStreet build stations: the places in the game where the Workshop opens for one kind of thing.
   Shared by the Workshop (workshop.html?station=<key>) and the game (play.html), so both agree on what each station makes,
   how big a design can be to fit, what the station costs to build, and how a finished design comes back to the game.
   Sizes are metres [width, height, length]; costs are the game's item keys. Runs in the browser and in Node. */
(function(root){
  var ST = {
    version:1,
    list:['workbench', 'carshop', 'hangar', 'dock', 'wardrobe'],
    workbench:{label:'Workbench', makes:'Hand-held items: weapons and tools', kinds:['held', 'item'], domain:null,
      maxSize:[1.2, 1.2, 2.6], cost:{wood:6, scrap:3}, footprint:[1.6, 0.8], spawn:'hand',
      needs:'The tool bench the game already has becomes the workbench: no new building.',
      gives:'The item goes into the backpack (or on the bench if the backpack is full).'},
    carshop:{label:'Car shop', makes:'Land vehicles: cars, pickups, vans, trucks, buses, semis, trailers, motorhomes', kinds:['vehicle'], domain:'land',
      maxSize:[3.2, 4.4, 17], cost:{wood:20, scrap:40, nails:20, car_parts:2}, footprint:[6, 20], spawn:'bay',
      needs:'Flat ground beside a road, or inside a garage, warehouse or car dealer.',
      gives:'The vehicle rolls out of the bay, facing the door, with an empty tank.'},
    hangar:{label:'Air hangar', makes:'Aircraft: helicopters, planes, gyrocopters, airships', kinds:['vehicle'], domain:'air',
      maxSize:[16, 12, 24], cost:{wood:40, scrap:80, nails:30, car_parts:4}, footprint:[20, 28], spawn:'apron',
      needs:'Open flat ground (a field, car park or airfield) with 200 ft clear in front for planes.',
      gives:'The aircraft waits on the apron in front of the doors, with an empty tank.'},
    dock:{label:'Boat dock', makes:'Watercraft: rowboats, motorboats, sailboats, houseboats, rafts', kinds:['vehicle'], domain:'water',
      maxSize:[6, 8, 16], cost:{wood:30, scrap:10, nails:30}, footprint:[5, 18], spawn:'slip',
      needs:'A shore: one end on land, the slip over water at least 3 ft deep.',
      gives:'The boat floats in the slip, tied to the dock.'},
    wardrobe:{label:'Wardrobe', makes:'Clothes and character parts', kinds:['clothing'], domain:null,
      maxSize:null, cost:null, footprint:null, spawn:'wardrobe',
      needs:'Any wardrobe or closet, found in a building or carried home: nothing to build.',
      gives:'The garment hangs in the wardrobe, ready to wear.'}
  };
  /* which station makes a Workshop design */
  ST.forDoc = function(doc){
    if (!doc) return null;
    if (doc.type === 'vehicle') return ({land:'carshop', air:'hangar', water:'dock'})[doc.domain || 'land'];
    if (doc.type === 'model'){ if (doc.kind === 'held' || doc.kind === 'item') return 'workbench'; if (doc.kind === 'clothing') return 'wardrobe'; }
    return null;
  };
  ST.allows = function(key, doc){ return !!key && ST.forDoc(doc) === key; };
  /* does a design of this size fit the station's bay? size = [width, height, length] in metres */
  ST.fits = function(key, size){
    var s = ST[key]; if (!s || !s.maxSize || !size) return {ok:true};
    var names = ['wide', 'tall', 'long'], why = [];
    for (var i = 0; i < 3; i++) if (size[i] > s.maxSize[i] + 1e-6) why.push(names[i]);
    return {ok:!why.length, why:why};
  };
  /* the hand-off: what the Workshop sends back to the game when the player presses "Build in the game".
     In an iframe it is posted to the parent window; on its own page it is left in localStorage under KEY and the page goes back to the game. */
  ST.KEY = 'afterstreet.station.out';
  ST.MESSAGE = 'afterstreet-station-build';
  ST.handoff = function(o){
    return {type:ST.MESSAGE, v:1, station:o.station, stationId:o.stationId || '', made:new Date().toISOString(), name:o.name, id:o.id,
      kind:o.kind, domain:o.domain || null, size:o.size || null, cost:o.cost || {}, pack:o.pack};
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ST; else root.AFTERSTREET_STATIONS = ST;
})(typeof window !== 'undefined' ? window : this);
