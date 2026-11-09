/* Afterstreet smoke test: starts a world in a headless browser, plays it with random keys and clicks, and prints every fault it sees.
   Run it before a release, from the repo folder, with a web server on the repo (python3 -m http.server 8123):
     node tools/smoke.js                       demo town, Endless
     node tools/smoke.js spring reclaim        Springfield, Reclaim   (start button id, then the goal: endless, reclaim or escape)
     node tools/smoke.js testStreet            the Test World
     node tools/smoke.js asmap endless my.asmap    a map-builder file
   Needs Playwright with Chromium (npm i playwright). Exit code 1 when a fault was seen. The game is stepped by hand (update(0.05)), so about
   four game minutes go by in a few real seconds, with half a game day skipped between rounds to reach night, raids and weather. */
const {chromium} = require('playwright');
(async () => {
  const mode = process.argv[2] || 'demo', scen = process.argv[3] || 'endless', file = process.argv[4], base = process.env.AFTERSTREET_URL || 'http://localhost:8123/';
  const b = await chromium.launch({args:['--use-gl=swiftshader', '--enable-unsafe-swiftshader']}), p = await b.newPage({viewport:{width:400, height:260}});
  const errs = {}, add = k => { errs[k] = (errs[k] || 0) + 1; };
  p.on('pageerror', e => add('PAGE ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' && !/GL Driver|ReadPixels/.test(m.text())) add('CONSOLE ' + m.text().slice(0, 300)); });
  p.on('dialog', d => { d.dismiss().catch(() => {}); });
  p.on('requestfailed', r => add('REQUEST FAILED ' + r.url()));
  p.on('response', r => { if (r.status() >= 400) add('HTTP ' + r.status() + ' ' + r.url()); });
  await p.goto(base + 'play.html'); await p.waitForTimeout(2500);
  await p.evaluate(s => { try { localStorage.clear(); } catch (e){} var e = document.getElementById('scen'); if (e) e.value = s; }, scen);
  if (mode === 'asmap'){
    await p.setInputFiles('#file', file);
    for (let i = 0; i < 90; i++){ await p.waitForTimeout(2000); if (/Press Play|Could not/.test(await p.evaluate(() => document.getElementById('rgStatus').textContent))) break; }
    await p.evaluate(() => { [...document.querySelectorAll('#bmList button')].find(q => /^Play/.test(q.textContent.trim())).click(); });
  } else await p.evaluate(m => document.getElementById(m).click(), mode);
  await p.waitForFunction(() => typeof running !== 'undefined' && running && world && world.gl, null, {timeout:300000}); await p.waitForTimeout(3000);
  console.log('started', await p.evaluate(() => world.name + ': ' + world.buildings.length + ' buildings, ' + world.roads.length + ' roads, ' + world.vehicles.length + ' vehicles, ' + Object.keys(world.nests).length + ' nests. ' + goalText()));
  for (let round = 0; round < 12; round++){
    const res = await p.evaluate(round => {
      var out = [], n = 0, codes = ['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','Space','KeyR','KeyQ','KeyM','KeyI','KeyB','KeyC','KeyT','KeyG','KeyV','KeyX','KeyZ','Tab','Digit1','Digit2','Digit3','Digit4','ShiftLeft','Escape','KeyH','KeyJ','KeyK','KeyL','KeyN','KeyO','KeyU','KeyY','Enter'];
      var note = function(e, w){ var k = w + ': ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | ').replace(/https?:\/\/[^ )]*\//g, ''); if (out.indexOf(k) < 0 && out.length < 10) out.push(k); };
      window.confirm = function(){ return Math.random() < 0.5; }; window.prompt = function(){ return null; }; window.alert = function(){};
      P.hp = 100; time += DAY*0.11;
      try {
        if (round === 2 && world.vehicles.length){ var v = world.vehicles[(Math.random()*world.vehicles.length) | 0]; P.inside = null; P.x = v.x + 2; P.y = v.y; }
        if (round === 4 || round === 9){ var bb = world.buildings[(Math.random()*world.buildings.length) | 0]; if (bb && bb.door){ P.x = bb.door.x + bb.door.nx*1.2; P.y = bb.door.y + bb.door.ny*1.2; } }
        if (round === 6){ var k = Object.keys(world.nests)[0]; if (k){ var nb = world.buildings[k]; P.inside = null; P.x = nb.cx + 20; P.y = nb.cy; } }
        if (round === 7){ var wr = world.roads.find(function(r){ return r.kind === 'water'; }); if (wr){ P.inside = null; P.x = wr.pts[0]; P.y = wr.pts[1]; } }
        if (round === 8) for (var q = 0; q < 12; q++) addAlien(q % 3, P.x + 8 + q, P.y + 5);
        if (round === 10) for (var it in ITEMS) inv[it] = (inv[it] || 0) + 5;
      } catch (e){ note(e, 'setup ' + round); }
      for (var i = 0; i < 400; i++){
        if (i % 7 === 0){ var c = codes[(Math.random()*codes.length) | 0], o = {code:c, key:c.replace(/^Key|^Digit/, '').toLowerCase(), bubbles:true};
          try { window.dispatchEvent(new KeyboardEvent('keydown', o)); } catch (e){ note(e, 'keydown ' + c); } try { window.dispatchEvent(new KeyboardEvent('keyup', o)); } catch (e){ note(e, 'keyup ' + c); } }
        if (i % 50 === 0){ try { var cv = document.querySelector('canvas'); ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function(t){ cv.dispatchEvent(new MouseEvent(t, {bubbles:true, clientX:200, clientY:130, button:0})); }); } catch (e){ note(e, 'click'); } }
        try { update(0.05); n++; } catch (e){ note(e, 'update'); }
        if (i % 100 === 0) P.hp = 100;
      }
      return {steps:n, faults:out, aliens:zombies.length, day:dayNum()};
    }, round);
    res.faults.forEach(f => add('GAME ' + f)); console.log('round', round, JSON.stringify(res)); await p.waitForTimeout(2500);
  }
  const sv = await p.evaluate(() => { try { saveNow(); return ''; } catch (e){ return e.message + ' ' + e.stack; } }); if (sv) add('SAVE ' + sv);
  const n = Object.keys(errs).length; console.log(n ? 'FAULTS:\n' + JSON.stringify(errs, null, 1) : 'No faults.');
  await b.close(); process.exit(n ? 1 : 0);
})();
