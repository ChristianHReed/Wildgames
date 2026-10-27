/* AfterStreet content packs: the loader the game (play.html) and the Maps Builder (builder.html) share.
   A pack is a .js file in this folder that pushes one object onto window.AFTERSTREET_PACKS (made by the Workshop, workshop.html).
   It loads from a drive over file:// with a plain script tag, like every other asset file.

   Use:
     <script src="packs/packload.js"></script>
     <script src="packs/index.js"></script>          lists the pack files to load (window.AFTERSTREET_PACK_FILES)
     <script>AfterstreetPacks.writeTags('packs/')</script>   while the page is still loading (document.write, as play.html loads assets)
     ... after assets/shaped/props.js (and vehiclekit.js if used) have loaded:
     AfterstreetPacks.install(window.SHAPED)

   install() adds every Workshop vehicle to the same tables the design chat's cars live in, under the key pk_<pack>_<id>:
     SHAPED.props.models.vehicles[key]           {body, bonnet, boot, wheel, damage}   (as props.js; damage has the same ten looks)
     SHAPED.props.models.vehicles[key + '_wreck'] and [key + '_burnt']   {body, bonnet, wheel}
     SHAPED.props.vehicleRig[key], [key_wreck], [key_burnt]             wheels, hinges, smokeAt, sitDrop
     SHAPED.props.vehicleSpec[key]                                      measurements
     SHAPED.props.palette                                               plus the pack's own colours (named x + hex, so they never clash)
     SHAPED.vehiclekit.vehicles[key]                                    mounts and wheels for tyres, rims and bolt-on parts
   and lists them in AfterstreetPacks.vehicles: [{key, name, cls, pack, paint, game, functions, salvage, buildCost, stats}].
   The game's own car code then treats a pack car like the stock ones: draw body + bonnet with the wheel at each rig point,
   paint with entry.paint as the paint1..3 override, switch to damage looks by health. AfterstreetPacks.prefabs holds shared prefabs. */
(function(root){
  var P = root.AfterstreetPacks = root.AfterstreetPacks || {};
  P.FORMAT = 'afterstreet-pack'; P.VERSION = 2;
  P.vehicles = P.vehicles || []; P.models = P.models || []; P.designs = P.designs || []; P.items = P.items || []; P.sounds = P.sounds || []; P.prefabs = P.prefabs || []; P.installed = P.installed || {}; P.errors = P.errors || [];
  function slug(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'x'; }
  P.keyOf = function(pack, asset){ return 'pk_' + slug(pack.id) + '_' + slug(asset.id); };

  /* script tags for every listed pack, while the page is still being read */
  P.writeTags = function(base, files){
    files = files || root.AFTERSTREET_PACK_FILES || [];
    files.forEach(function(f){ document.write('<script src="' + base + String(f).replace(/\.js$/, '') + '.js"><\/script>'); });
  };
  /* the same after the page has loaded; cb() when all have loaded or failed */
  P.load = function(base, files, cb){
    files = files || root.AFTERSTREET_PACK_FILES || []; var left = files.length;
    if (!left){ if (cb) cb(); return; }
    files.forEach(function(f){ var s = document.createElement('script'); s.src = base + String(f).replace(/\.js$/, '') + '.js';
      s.onload = s.onerror = function(e){ if (e && e.type === 'error') P.errors.push('could not load pack ' + f); if (--left === 0 && cb) cb(); };
      document.head.appendChild(s); });
  };
  /* a pack from text (a file the player picked, or one kept in the browser) */
  P.parse = function(text){ var a = text.indexOf('{'), b = text.lastIndexOf('}'); var p = JSON.parse(text.slice(a, b + 1)); if (p.format !== P.FORMAT) throw new Error('not an AfterStreet pack'); return p; };
  P.add = function(pack){ (root.AFTERSTREET_PACKS = root.AFTERSTREET_PACKS || []).push(pack); };

  /* version 2: any other asset is a 'model': its value goes to SHAPED[target.pack].models[target.group][target.name], and the pack's own
     tables that hold an entry for the model (info, moving, furnitureSize, ...) get each a.extra entry ({path:[table, (group,) name], value}) under the model's key. mode 'add' never replaces a model the game has. */
  /* a part placed by path (survivor clothes parts.top.masculine.<id>, an alien parts.<name>) with its creature's bones and clips */
  function installAt(SH, pack, a){
    var t = a.target, PK = SH[t.pack]; if (!PK){ P.errors.push('pack ' + pack.id + ', ' + a.id + ': no pack ' + t.pack + ' to put it in'); return; }
    var path = t.path.slice(), last = path.pop(), o = PK; path.forEach(function(k){ o = o[k] = o[k] || {}; });
    var key = last; if (a.mode === 'add' && o[key] !== undefined) key = P.keyOf(pack, a);
    o[key] = a.value;
    /* a new survivor part is offered by the creator: its name joins survivor.choices[slot] */
    if (t.pack === 'survivor' && t.path[0] === 'parts' && PK.choices && Array.isArray(PK.choices[t.path[1]]) && PK.choices[t.path[1]].indexOf(key) < 0) PK.choices[t.path[1]].push(key);
    (a.extra || []).forEach(function(e){ var q = e.path.slice(), l = q.pop(), z = PK; q.forEach(function(k){ z = z[k] = z[k] || {}; }); z[l] = e.value; });
    if (a.creature && t.path[0] === 'parts'){ PK.creatures = PK.creatures || {}; PK.creatures[key] = a.creature; }
    for (var c in (a.palette || {})) if (/^x[0-9a-f]{6}$/i.test(c)){ PK.palette = PK.palette || {}; PK.palette[c] = a.palette[c]; }
    P.models.push({key:key, path:t.path.slice(0, -1).concat(key), pack:t.pack, kind:a.kind, name:a.name, packId:pack.id, author:a.author || pack.author, stats:a.stats || {}});
  }
  function installModel(SH, pack, a){
    if (a.target && a.target.path) return installAt(SH, pack, a);
    var t = a.target || {}, PK = SH[t.pack];
    if (!PK || !PK.models){ P.errors.push('pack ' + pack.id + ', ' + a.id + ': no pack ' + t.pack + ' to put it in'); return; }
    /* a whole model (a bike, a boat, a machine) has no name: it is models[group] itself */
    var whole = t.name == null, G = whole ? PK.models : (PK.models[t.group] = PK.models[t.group] || {}), key = whole ? t.group : t.name;
    if (a.mode === 'add' && G[key] !== undefined){ key = P.keyOf(pack, a); }
    if (P.installed[t.pack + '.' + (whole ? '' : t.group + '.') + key]) return;
    G[key] = a.value;
    /* states go beside it as <key>_<state> (cupboard_searched, wall_plain_damaged) */
    for (var st in (a.variants || {})) G[key + '_' + st] = a.variants[st];
    (a.extra || []).forEach(function(e){
      var path = e.path.slice(0, -1), o = PK; for (var i = 0; i < path.length; i++){ o[path[i]] = o[path[i]] || {}; o = o[path[i]]; }
      o[key] = e.value;
    });
    for (var c in (a.palette || {})) if (/^x[0-9a-f]{6}$/i.test(c)){ PK.palette = PK.palette || {}; PK.palette[c] = a.palette[c]; }
    /* a held item's game design (the game's custom item format) and an item's data travel with it */
    if (a.design){ var dz = JSON.parse(JSON.stringify(a.design)); dz.model = key; if (a.icon) dz.iconData = a.icon; P.designs.push(dz); if (dz.twoHanded && PK.twoHanded && PK.twoHanded.indexOf(key) < 0) PK.twoHanded.push(key); }
    if (a.item){ var it = JSON.parse(JSON.stringify(a.item)); it.model = t.pack + '.' + (whole ? '' : t.group + '.') + key; if (a.icon) it.icon = a.icon; P.items.push(it); }
    if (a.effect) (P.effects = P.effects || []).push({key:key, pack:t.pack, effect:a.effect});
    P.models.push({key:key, sway:a.sway || null, harvest:a.harvest || null, collide:a.collide || null, states:Object.keys(a.variants || {}), lights:a.lights || [], salvage:a.salvage || {}, rig:a.rig || null, clips:a.clips || null, pack:t.pack, group:whole ? null : t.group, whole:whole, name:a.name, kind:a.kind, packId:pack.id, author:a.author || pack.author, points:a.points || [], stats:a.stats || {}});
    P.installed[t.pack + '.' + (whole ? '' : t.group + '.') + key] = true;
  }
  P.install = function(SH){
    SH = SH || root.SHAPED; if (!SH || !SH.props) { P.errors.push('props.js must load before packs are installed'); return P; }
    var PR = SH.props, K = SH.vehiclekit;
    (root.AFTERSTREET_PACKS || []).forEach(function(pack){
      if (!pack || pack.format !== P.FORMAT){ P.errors.push('skipped something that is not a pack'); return; }
      if (pack.version > P.VERSION) P.errors.push('pack ' + pack.id + ' is version ' + pack.version + '; this game reads ' + P.VERSION + ' (trying anyway)');
      (pack.assets || []).forEach(function(a){
        try {
          /* a sound: recordings added to the game's sounds under its key (window.ART.sounds[key] = [base64, ...]); load packs before the first tap starts the audio */
          if (a.type === 'sound'){ if (a.sound && a.sound.key && a.sound.variants){ var AR = root.ART = root.ART || {}; AR.sounds = AR.sounds || {}; AR.sounds[a.sound.key] = a.sound.variants.slice(); P.sounds.push({key:a.sound.key, name:a.name, packId:pack.id}); } return; }
          if (a.type === 'model'){ installModel(SH, pack, a); return; }
          /* a ready-made character: creator choices (survivor.npcLooks[id]) the game offers as a player look or a recruitable survivor */
          if (a.type === 'look'){ var SV = SH.survivor; if (!SV || !a.look){ P.errors.push('pack ' + pack.id + ', ' + a.id + ': no survivor pack for a look'); return; } SV.npcLooks = SV.npcLooks || {}; var lk = a.id; if (SV.npcLooks[lk]) lk = P.keyOf(pack, a); SV.npcLooks[lk] = JSON.parse(JSON.stringify(a.look)); SV.presets = SV.presets || []; SV.presets.push({name:a.name, look:{build:a.look.build, skin:a.look.skin, body:a.look.body, hair:a.look.hair, hc:a.look.hairColour, shirt:a.look.shirt, pants:a.look.pants, hat:a.look.hat, top:a.look.top, bot:a.look.bottoms, shoe:a.look.shoes, face:a.look.face, acc:a.look.acc, gx:(a.look.gear || [])[0] || '', ow:(a.look.worn || [])[0] || ''}});
            (P.looks = P.looks || []).push({key:lk, name:a.name, packId:pack.id, author:a.author || pack.author}); return; }
          if (a.type !== 'vehicle' || !a.model || !a.model.body) return;
          var key = P.keyOf(pack, a);
          if (P.installed[key]) return;
          var m = a.model;
          PR.models.vehicles[key] = {body:m.body, bonnet:m.bonnet || [], boot:m.boot || [], wheel:m.wheel, damage:m.damage || {}};
          PR.vehicleRig[key] = a.rig; PR.vehicleSpec[key] = a.spec;
          if (a.wreck){ PR.models.vehicles[key + '_wreck'] = a.wreck; PR.vehicleRig[key + '_wreck'] = a.rigWreck; }
          if (a.burnt){ PR.models.vehicles[key + '_burnt'] = a.burnt; PR.vehicleRig[key + '_burnt'] = a.rigBurnt; }
          for (var c in (a.palette || {})) if (/^x[0-9a-f]{6}$/i.test(c)) PR.palette[c] = a.palette[c];
          if (K && K.vehicles && a.kit) K.vehicles[key] = a.kit;
          P.vehicles.push({key:key, name:a.name, cls:a.cls || 'car', pack:pack.id, packName:pack.name, author:a.author || pack.author, paint:a.paint || {},
            game:a.game || {}, functions:a.functions || {}, salvage:a.salvage || {}, buildCost:a.buildCost || {}, stats:a.stats || {}});
          P.installed[key] = true;
        } catch (e){ P.errors.push('pack ' + pack.id + ', ' + a.id + ': ' + e.message); }
      });
      (pack.prefabs || []).forEach(function(pf){ if (!P.prefabs.some(function(q){ return q.id === pf.id; })) P.prefabs.push(pf); });
    });
    return P;
  };
})(typeof window !== 'undefined' ? window : this);
