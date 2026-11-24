/* Look sheets for any chat: the design from the front, side, top and three-quarters, from the driver's eye and at 64 px, as one PNG.
   It opens the Workshop in Chromium (Playwright), loads the design and calls its look check (workshop/ed_look.js).
   Run:
     node workshop/tools/render.js --design box_truck [--design sedan ...]      designs in workshop/designs/ (built with the build library)
     node workshop/tools/render.js --doc my_car.json                             a saved Workshop file
     node workshop/tools/render.js --model props.vehicles.sedan                    a shipped model (pack.group.name, as the Workshop's Open list)
     --out folder    where the PNGs go (default: the current folder); --phone renders at iPhone size */
global.window = global;
var http = require('http'), fs = require('fs'), path = require('path'), root = path.resolve(__dirname, '../..');
var args = process.argv.slice(2), jobs = [], out = '.', phone = false;
for (var i = 0; i < args.length; i++){ var a = args[i];
  if (a === '--out') out = args[++i]; else if (a === '--phone') phone = true;
  else if (a === '--design' || a === '--doc' || a === '--model') jobs.push([a.slice(2), args[++i]]); }
if (!jobs.length){ console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 8).join('\n')); process.exit(1); }
/* designs are built here, in Node, with the build library, then handed to the page as Workshop files */
function designDocs(name){
  require(root + '/assets/shaped/shapes.js'); require(root + '/assets/shaped/props.js');
  var M = require(root + '/workshop/model.js'); M.setShaped(SHAPED); global.AFTERSTREET_STATIONS = require(root + '/workshop/stations.js');
  var WSB = require(root + '/workshop/build.js'), made = require(root + '/workshop/designs/' + name + '.js')(WSB);
  return (Array.isArray(made) ? made : [made]).map(function(b){ M.syncAxles(b.doc); b.doc.pieces.forEach(function(p){ if (!p.fn && /^steering wheel$/i.test(p.name || '')) M.setJob(p, 'steering'); }); return b.doc; });
}
var TYPES = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css', '.svg':'image/svg+xml'};
var srv = http.createServer(function(q, r){ var f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.indexOf(root) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end(); }
  r.writeHead(200, {'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
srv.listen(0, async function(){
  var chromium = require('playwright').chromium, b = await chromium.launch({args:['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  var ctx = await b.newContext({viewport:phone ? {width:390, height:844} : {width:1280, height:900}, deviceScaleFactor:phone ? 3 : 1, serviceWorkers:'block'}), p = await ctx.newPage(), bad = 0;
  p.on('pageerror', function(e){ console.log('page error: ' + e.message); });
  await p.goto('http://localhost:' + srv.address().port + '/workshop.html'); await p.waitForFunction(function(){ return window.WORKSHOP && WORKSHOP.S && WORKSHOP.S.doc; }, null, {timeout:30000});
  fs.mkdirSync(out, {recursive:true});
  for (var j = 0; j < jobs.length; j++){
    var kind = jobs[j][0], what = jobs[j][1], docs = [];
    try {
      if (kind === 'design') docs = designDocs(what).map(function(d){ return {doc:d}; });
      else if (kind === 'doc') docs = [{doc:JSON.parse(fs.readFileSync(what, 'utf8'))}];
      else docs = [{model:what.split('.')}];
    } catch (e){ console.log('FAIL ' + what + ': ' + e.message); bad++; continue; }
    for (var k = 0; k < docs.length; k++){
      var res = await p.evaluate(function(job){ var A = WORKSHOP.api, M = A.M;
        try { var d = job.doc;
          if (job.model){ var m = job.model; d = M.importModel(SHAPED, m[0], m.slice(1, -1).join('.'), m[m.length - 1]); if (!d) return {err:'no such model'}; }
          A.setDoc(d); A.S.sel = []; A.refresh(true); return {id:A.S.doc.id, url:A.lookSheet()}; } catch (e){ return {err:e.message}; } }, docs[k]);
      if (res.err || !res.url){ console.log('FAIL ' + what + ': ' + (res.err || 'no sheet')); bad++; continue; }
      var file = path.join(out, String(res.id || what).replace(/[^\w.-]+/g, '_') + '_look.png');
      fs.writeFileSync(file, Buffer.from(res.url.split(',')[1], 'base64')); console.log('wrote ' + file);
    }
  }
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
});
