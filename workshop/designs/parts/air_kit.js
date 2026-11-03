/* Shared shaping for aircraft: lofted bodies and wings so they read as aircraft, not boxes. Every loft is rings of the same corner angles, so each face
   between two rings is one flat quad (parallel edges), the way the low-poly references are built. Coordinates: metres, nose +z, up +y, left +x.
   fuselage(): stations [z, centreY, halfWidth, halfHeight] (nose to tail or tail to nose) -> a closed solid skin.
   wing(): a tapered wing in one piece, root to tip each side, with a flat-bottomed airfoil section, a rounded leading edge and a thin trailing edge. */
var ANG8 = [32, 62, 118, 148, 212, 242, 298, 328];             /* flat sides, flat top, flat belly, chamfered shoulders */
var ANG6 = [0, 60, 120, 180, 240, 300];
/* stations [z, centreY, W, H]: W is where the flat side stands (x = +-W), H is the height of the flat top above the centre and of the belly below it */
function tube(b, st, o){ o = o || {};
  var r = st.map(function(s){ return [o.cx || 0, s[1], s[0], s[2]/0.848, s[3]/0.883, s[4] || null, s[5] || null]; });
  return b.block('tube', [0, 0, 0], null, {s:'loft', ax:'z', ang:o.ang || ANG8, r:r, c:o.c || 'paint1', m:o.m || 'sheet', name:o.name || 'fuselage', caps:o.caps});
}
/* a wing from -span/2 to span/2 at height y, leading edge z0 at the root: chord root/tip, thickness fraction, dihedral rise at the tips, sweep (z shift of the tip) */
function wing(b, o){ var h = o.span/2, n = o.stations || [0, 0.35, 1], r = [], A = [14, 44, 136, 180, 224, 316, 346];   /* corner angles: blunt leading edge, upper front, upper rear, trailing edge, flat underside, lower front */
  function ring(x, t){ var ch = o.root + (o.tip - o.root)*t, zc = o.z + (o.sweep || 0)*t - ch/2, th = (o.thick || 0.11)*ch/2, y = o.y + (o.rise || 0)*t*t;
    return [x, y, zc, ch/2, th]; }
  var xs = []; n.forEach(function(t){ xs.push(t); });
  var left = n.slice().reverse().map(function(t){ return ring(-h*t, t); }), right = n.slice(1).map(function(t){ return ring(h*t, t); });
  r = left.concat(right);
  return b.block('tube', [0, 0, 0], null, {s:'loft', ax:'x', ang:A, r:r, c:o.c || 'paint2', m:'sheet', fn:o.fn === false ? undefined : 'wing', name:o.name || 'wing'});
}
/* a fin or any slab from four corners in one plane plus a thickness offset: corners [[x,y,z]*4] */
function slab(b, q, th, o){ o = o || {}; var H = require('../refs.js').H;
  return H.quad(b, q, th, {c:o.c || 'paint1', m:o.m || 'sheet', name:o.name || 'fin'}); }
module.exports = {tube:tube, wing:wing, slab:slab, ANG8:ANG8};
