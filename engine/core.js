/* Shared engine: page handles (canvas, GL context), resize and the position hash. Loaded by play.html and the Maps Builder.
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
var el = function(id){ return document.getElementById(id); };
var cv = el('game'), W = 0, H = 0;
var gl = cv.getContext('webgl', {antialias:true}) || cv.getContext('experimental-webgl');
/* 0.120.1: drawing resolution. The game can draw fewer pixels than the screen has and let the browser scale them up (Settings > Drawing sharpness): far less work for the graphics chip on big tablets and weak devices */
var RSCALE = (function(){ var v = 1; try { v = +(localStorage.getItem('lastblock:rscale') || 1); } catch (e){} var q = /[?&]rs=([0-9.]+)/.exec(location.search); if (q) v = +q[1]; return v >= 0.4 && v <= 1 ? v : 1; })();
function resize(){ W = cv.width = Math.max(1, Math.round(window.innerWidth*RSCALE)); H = cv.height = Math.max(1, Math.round(window.innerHeight*RSCALE)); }
window.addEventListener('resize', resize); resize();
function hash(x, y, s){
  var h = Math.imul(x|0, 374761393) ^ Math.imul(y|0, 668265263) ^ Math.imul(s|0, 1442695041);
  h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; h = Math.imul(h, 3266489917); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
