/* Phones and narrow tablets: the panel as a sheet over the view, and the view's show-and-hide buttons in one menu.
   Held upright, the panel peeks (just its tabs) so the view gets the screen; it opens half way when a piece is
   selected or a tab is tapped, and the grab bar steps it peek, half, full (Apple's sheet detents). The CSS is in
   workshop.html (max-width 900 px, portrait; and short landscape screens). Loaded before app.js; plugs in through window.WSX. MIT licence. */
(window.WSX = window.WSX || []).push(function(A){
  var S = A.S, X = A.X, body = document.body, STEPS = ['peek', 'half', 'full'];
  function sheetOn(){ return window.matchMedia('(max-width:900px) and (orientation:portrait)').matches; }
  function step(){ return body.classList.contains('sheet-full') ? 'full' : body.classList.contains('sheet-half') ? 'half' : 'peek'; }
  function setStep(k){ body.classList.remove('sheet-half', 'sheet-full'); if (k !== 'peek') body.classList.add('sheet-' + k); S.sheet = k;
    var g = document.getElementById('sheetGrab'); if (g) g.setAttribute('aria-label', k === 'full' ? 'Show less of the panel' : 'Show more of the panel'); }
  A.sheet = {set:setStep, get:step, on:sheetOn};
  var grab = document.getElementById('sheetGrab');
  if (grab){
    grab.addEventListener('click', function(){ var k = step(); setStep(k === 'peek' ? 'half' : k === 'half' ? 'full' : 'peek'); });
    /* drag the grab bar up or down */
    var y0 = null, k0 = null;
    grab.addEventListener('pointerdown', function(e){ y0 = e.clientY; k0 = step(); });
    window.addEventListener('pointerup', function(e){ if (y0 == null) return; var dy = e.clientY - y0; y0 = null; if (Math.abs(dy) < 24) return;
      var i = STEPS.indexOf(k0) + (dy < 0 ? 1 : -1) * (Math.abs(dy) > 220 ? 2 : 1); setStep(STEPS[Math.max(0, Math.min(2, i))]); });
  }
  /* a tab tapped while the sheet only peeks opens it */
  var tabs = document.getElementById('tabs');
  if (tabs) tabs.addEventListener('click', function(){ if (sheetOn() && step() === 'peek') setStep('half'); }, true);
  /* selecting a piece in the view opens the sheet half way (not when it is already open further) */
  X.tap.push(function(){ setTimeout(function(){ if (sheetOn() && S.sel.length && step() === 'peek') setStep('half'); }, 0); return false; });
  /* the show-and-hide buttons (hood open, doors open, person, planes...) behind one button on small screens */
  var pv = document.getElementById('pvToggle');
  if (pv) pv.addEventListener('click', function(){ var on = body.classList.toggle('pv-open'); pv.setAttribute('aria-expanded', on ? 'true' : 'false'); pv.textContent = on ? 'Show ▴' : 'Show ▾'; });
  /* short button words where the header has no room for the long ones */
  var narrow = window.matchMedia('(max-width:520px)'), SHORT = {bExport:['Export pack', 'Export'], bLib:['Designs', 'Open']};
  function words(){ Object.keys(SHORT).forEach(function(id){ var el = document.getElementById(id); if (el && SHORT[id].indexOf(el.textContent) >= 0) el.textContent = SHORT[id][narrow.matches ? 1 : 0]; }); }
  if (narrow.addEventListener) narrow.addEventListener('change', words); words();
  setStep('peek');
});
