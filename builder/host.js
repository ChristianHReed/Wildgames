/* AfterStreet Maps Builder: the host page side of the shared engine (engine/README.md, "Host contract").
   The engine's files expect some names from the page that loads them. The game defines them in play.html; here the builder defines the
   same names with its own values: a fly camera for the viewer, and empty stand-ins for game rules, sound and multiplayer.
   Loaded (with the art and the engine) only when the 3D view is first opened. Classic script: everything here is a page global, as the engine expects. */
var BUILD = 'builder-' + ((window.BLIB && window.ASMB_VERSION) || '1');
var ART = window.ART || {};
var ARTSET = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 'lite' : 'full';
/* quality settings: the game's three levels (play.html QUAL), the middle one by default; phones get the lightest */
var QUAL = [{fog:0.016, trees:60, chunk:150, intR:26, zmul:0.6, models:true, facR:42, facMax:110000, far:400, treeR:90, treeN:36, clutR:30, clutN:70},
            {fog:0.011, trees:95, chunk:220, intR:32, zmul:0.8, models:true, facR:62, facMax:240000, far:800, treeR:150, treeN:80, clutR:45, clutN:160},
            {fog:0.0085, trees:130, chunk:300, intR:38, zmul:1, models:true, facR:90, facMax:420000, far:1400, treeR:240, treeN:170, clutR:60, clutN:260}];
var QS = QUAL[ARTSET === 'lite' ? 0 : 1];
/* the viewer: what the engine's loaders and drawing read from the game's player */
var P = {x:0, y:0, yaw:0, pitch:0, gy:0, inside:null, lvl:0, roof:null, veh:null, climbL:null, items:{}, worn:{}, hp:100, light:false, fl:1, rd:1, bob:0};
/* clock, flags and game state the engine looks at; the builder passes its own hour and season to drawScene */
var DAY = 43200, time = 0, inRun = false, running = false, keys = {}, gait = 0, LAYDBG = null, ROOMAUD = null, dist = 0, dark = 0;
var inv = {}, wx = {w:0, until:0, tor:null, flash:0}, lamps = [], fires = [], flares = [];
function season(){ return window.View3D ? View3D.env.season : 1; }
/* messages and sound */
function toast(msg){ if (window.View3D) View3D.note(msg); }
function feed(msg){ if (window.View3D) View3D.note(msg); }
function updateHud(){}
function sfx(){}
function makeNoise(){}
function emit(){}
/* game rules: nothing to do in a builder */
function allBeds(){ return []; }
function doEdit(){}
function breachApply(){}
function rubbleAt(){ return null; }
/* art helpers. These three are copied from play.html (0.93.1) so buildings look the same; the main chat has been asked to move them into
   the engine, and then these copies go */
var SPB = {};
function spB(path){ if (!SPON) return null; if (SPB[path] !== undefined) return SPB[path]; SPB[path] = null; var pcs = spPieces(path); if (pcs) try { SPB[path] = spModel(pcs, spColour(SHAPED.props.palette)); } catch (er){} return SPB[path]; }
var BKM = {};
function bkMod(grp, fin, name){
  var key = grp + '.' + fin + '.' + name; if (BKM[key] !== undefined) return BKM[key]; BKM[key] = null;
  try { var BK = SHAPED.buildings, pcs = grp === 'breach' ? BK.models.breach[fin][name] : BK.models.house[name]; if (!pcs) return null; var out = [];
    pcs.forEach(function(q){ var o = SHAPED.build([q], function(){ return [0, 0, 0]; }, null, {}), P0 = o.pos, glass = /^glass/.test(q.c);
      for (var t = 0; t < P0.length; t += 9) out.push({p:P0.slice(t, t + 9), c:q.c, g:glass, f:false}); }); BKM[key] = out; } catch (e){}
  return BKM[key];
}
function segX(ax, ay, bx, by, cx, cy, dx, dy){ var rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy, den = rx*sy - ry*sx; if (Math.abs(den) < 1e-9) return false; var t = ((cx - ax)*sy - (cy - ay)*sx)/den, u = ((cx - ax)*ry - (cy - ay)*rx)/den; return t > 0.001 && t < 0.999 && u >= 0 && u <= 1; }
function segsX(L, ax, ay, bx, by){ for (var i = 0; i < L.length; i += 4) if (segX(ax, ay, bx, by, L[i], L[i+1], L[i+2], L[i+3])) return true; return false; }
