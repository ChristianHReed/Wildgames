/* Renders one album scene to a PNG with no network: the album's three.js is swapped for a small stand-in (three-shim.js:
   Lambert light, sun shadow, fog, vertex colours, see-through glass). Day scenes match three.js closely; night lights do not.
   From the repo folder:  python3 -m http.server 8124 &   then   node art-tests/shot/shot.js <scene> out.png [w h] ['[[cx,cy,cz],[tx,ty,tz]]']
   EXTRA='{"__ids":["deer"],"__clip":"run","__t":2}' sets window values the scene reads before it is made. Needs Playwright (Chromium). */
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const [,,scene,out,w='1400',h='800',cam]=process.argv;
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:+w,height:+h}});
  p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE',m.text()); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@.*\/build\/three\.module\.js/, r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'three-shim.js'))}));
  await p.route(/OrbitControls\.js/, r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'orbit-shim.js'))}));
  if (process.env.EXTRA) await p.addInitScript(e=>{ Object.assign(window, JSON.parse(e)); }, process.env.EXTRA);
  if (cam) await p.addInitScript(c=>{ window.__cam2=JSON.parse(c); window.__cam=JSON.parse(c); }, cam);
  await p.goto('http://localhost:8124/art-tests/album.html?shot#'+scene);
  await p.waitForFunction(()=>window.__ready, null, {timeout:180000});
  if (cam) await p.evaluate(c=>{ const C=JSON.parse(c); window.__camera.position.set(...C[0]); window.__ctl.target.set(...C[1]); window.__ctl.update(); }, cam);
  await p.waitForTimeout(1500);
  await p.screenshot({path:out}); await b.close(); })();
