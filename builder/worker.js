/* AfterStreet Maps Builder: starts the background worker from the library functions' own source text (a Blob URL), which also works
   when the builder is opened straight from a USB drive, where a separate worker file would be refused. Falls back to running on the page. */
(function(){
'use strict';
var LIBS = ['inflate', 'geo', 'pbf', 'tiff', 'gen', 'build'];
function workerMain(){
  var L = {}; for (var k in BLIB) BLIB[k](L);
  var stopFlag = false;
  self.onmessage = async function(e){
    var m = e.data;
    if (m.t === 'stop'){ stopFlag = true; return; }
    if (m.t !== 'build') return;
    stopFlag = false;
    try {
      var r = await L.runBuild(m.job, function(x){ self.postMessage(x); }, function(){ return stopFlag; });
      var p = r.preview; self.postMessage({t:'done', man:r.man, preview:p, single:r.single}, [p.segs.buffer, p.scls.buffer, p.pts.buffer, p.pofs.buffer, p.pcls.buffer]);
    } catch (er){ self.postMessage({t:'error', text:er && er.message || String(er)}); }
  };
}
window.BuildWorker = function(onMsg){
  var w = null;
  try {
    var src = 'var window = self; var BLIB = {};\n' + LIBS.map(function(k){ return 'BLIB.' + k + ' = ' + window.BLIB[k].toString() + ';'; }).join('\n') + '\n(' + workerMain.toString() + ')();';
    w = new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})));
    w.onmessage = function(e){ onMsg(e.data); };
    w.onerror = function(e){ onMsg({t:'error', text:'the background worker failed: ' + (e.message || 'unknown error')}); };
  } catch (e){ w = null; }
  if (w) return {post:function(m){ w.postMessage(m); }, inPage:false};
  /* no workers: run on the page (the screen may pause while it builds) */
  var L = {}, stopFlag = false; LIBS.forEach(function(k){ window.BLIB[k](L); });
  return {inPage:true, post:function(m){
    if (m.t === 'stop'){ stopFlag = true; return; }
    stopFlag = false;
    L.runBuild(m.job, onMsg, function(){ return stopFlag; }).then(function(r){ onMsg({t:'done', man:r.man, preview:r.preview, single:r.single}); }, function(er){ onMsg({t:'error', text:er.message}); });
  }};
};
})();
