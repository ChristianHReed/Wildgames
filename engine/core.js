/* Shared engine: page handles (canvas, GL context), resize and the position hash. Loaded by play.html and the Maps Builder.
   Classic script (no modules) so it also opens from a USB drive. Load order: core, mapparse, world, meshes, buildings, interiors, collision. */
'use strict';
var el = function(id){ return document.getElementById(id); };
var cv = el('game'), W = 0, H = 0;
var gl = cv.getContext('webgl', {antialias:true}) || cv.getContext('experimental-webgl');
function resize(){ W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();
function hash(x, y, s){
  var h = Math.imul(x|0, 374761393) ^ Math.imul(y|0, 668265263) ^ Math.imul(s|0, 1442695041);
  h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; h = Math.imul(h, 3266489917); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
