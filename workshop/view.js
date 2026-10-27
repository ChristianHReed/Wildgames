/* AfterStreet Workshop: the 3D view. Plain WebGL 1 (iPhone, iPad, any browser), no 3D library.
   Draws lists of world-space triangles and lines the app hands it, and turns mouse and touch into
   orbit, pan, zoom, taps and drags. The app decides what a tap or a drag does.

   WSV.create(canvas, hooks) -> view
     hooks.tap(x, y, ev), hooks.doubleTap(x, y), hooks.dragStart(x, y, ev) -> true to take the drag (moving a piece),
     hooks.drag(x, y), hooks.dragEnd(), hooks.changed() (camera moved)
   view.set(name, {tris:{pos, nor, col(rgba: a = 0 unlit/glowing)}} or {lines:{pos, col}}, opts)  opts: {tint:[r,g,b,a], depth:false, alpha, order}
   view.ray(x, y) -> {o, d}   view.project([x,y,z]) -> [sx, sy, depth]   view.cam {target, yaw, pitch, dist}   view.frame(min, max) */
(function(root){
  var V = {};
  function m4mul(a, b){ var o = new Float32Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++){ var s = 0; for (var k = 0; k < 4; k++) s += a[k*4+j]*b[i*4+k]; o[i*4+j] = s; } return o; }
  function persp(fov, asp, n, f){ var t = 1/Math.tan(fov/2), o = new Float32Array(16); o[0] = t/asp; o[5] = t; o[10] = (f+n)/(n-f); o[11] = -1; o[14] = 2*f*n/(n-f); return o; }
  function lookAt(e, c, u){
    var z = norm([e[0]-c[0], e[1]-c[1], e[2]-c[2]]), x = norm(cross(u, z)), y = cross(z, x), o = new Float32Array(16);
    o[0] = x[0]; o[4] = x[1]; o[8] = x[2]; o[1] = y[0]; o[5] = y[1]; o[9] = y[2]; o[2] = z[0]; o[6] = z[1]; o[10] = z[2];
    o[12] = -dot(x, e); o[13] = -dot(y, e); o[14] = -dot(z, e); o[15] = 1; return o;
  }
  function inv(m){
    var a = m, o = new Float32Array(16), b00 = a[0]*a[5]-a[1]*a[4], b01 = a[0]*a[6]-a[2]*a[4], b02 = a[0]*a[7]-a[3]*a[4], b03 = a[1]*a[6]-a[2]*a[5], b04 = a[1]*a[7]-a[3]*a[5], b05 = a[2]*a[7]-a[3]*a[6],
      b06 = a[8]*a[13]-a[9]*a[12], b07 = a[8]*a[14]-a[10]*a[12], b08 = a[8]*a[15]-a[11]*a[12], b09 = a[9]*a[14]-a[10]*a[13], b10 = a[9]*a[15]-a[11]*a[13], b11 = a[10]*a[15]-a[11]*a[14],
      d = b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06; if (!d) return o; d = 1/d;
    o[0] = (a[5]*b11-a[6]*b10+a[7]*b09)*d; o[1] = (a[2]*b10-a[1]*b11-a[3]*b09)*d; o[2] = (a[13]*b05-a[14]*b04+a[15]*b03)*d; o[3] = (a[10]*b04-a[9]*b05-a[11]*b03)*d;
    o[4] = (a[6]*b08-a[4]*b11-a[7]*b07)*d; o[5] = (a[0]*b11-a[2]*b08+a[3]*b07)*d; o[6] = (a[14]*b02-a[12]*b05-a[15]*b01)*d; o[7] = (a[8]*b05-a[10]*b02+a[11]*b01)*d;
    o[8] = (a[4]*b10-a[5]*b08+a[7]*b06)*d; o[9] = (a[1]*b08-a[0]*b10-a[3]*b06)*d; o[10] = (a[12]*b04-a[13]*b02+a[15]*b00)*d; o[11] = (a[9]*b02-a[8]*b04-a[11]*b00)*d;
    o[12] = (a[5]*b07-a[4]*b09-a[6]*b06)*d; o[13] = (a[0]*b09-a[1]*b07+a[2]*b06)*d; o[14] = (a[13]*b01-a[12]*b03-a[14]*b00)*d; o[15] = (a[8]*b03-a[9]*b01+a[10]*b00)*d;
    return o;
  }
  function xf(m, v, w){ var x = v[0], y = v[1], z = v[2]; var o = [m[0]*x+m[4]*y+m[8]*z+m[12]*w, m[1]*x+m[5]*y+m[9]*z+m[13]*w, m[2]*x+m[6]*y+m[10]*z+m[14]*w, m[3]*x+m[7]*y+m[11]*z+m[15]*w]; return o; }
  function cross(a, b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function dot(a, b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function norm(v){ var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; }
  V.cross = cross; V.dot = dot; V.norm = norm;

  var VS = 'attribute vec3 aP; attribute vec3 aN; attribute vec4 aC; uniform mat4 uVP; varying vec4 vC; varying vec3 vN; void main(){ vC = aC; vN = aN; gl_Position = uVP*vec4(aP, 1.0); gl_PointSize = 6.0; }';
  var FS = 'precision mediump float; varying vec4 vC; varying vec3 vN; uniform vec4 uTint; uniform float uLit; uniform float uAlpha;' +
    'void main(){ vec3 c = vC.rgb; if (uLit > 0.5 && vC.a > 0.5){ vec3 n = normalize(vN); vec3 L = normalize(vec3(0.42, 0.82, 0.38)); float d = max(dot(n, L), 0.0);' +
    ' vec3 hemi = mix(vec3(0.50, 0.46, 0.42), vec3(0.98, 0.95, 0.90), n.y*0.5 + 0.5); float rim = max(dot(n, normalize(vec3(-0.5, 0.2, -0.6))), 0.0)*0.12;' +
    ' c = c*(hemi*0.66 + vec3(1.0, 0.96, 0.88)*d*0.52 + rim); }' +
    ' c = mix(c, uTint.rgb, uTint.a); gl_FragColor = vec4(c, uAlpha); }';

  V.create = function(canvas, hooks){
    hooks = hooks || {};
    var gl = canvas.getContext('webgl', {antialias:true, alpha:false, preserveDrawingBuffer:true}) || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL is not available in this browser');
    var u32 = gl.getExtension('OES_element_index_uint');
    function sh(t, src){ var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    var aP = gl.getAttribLocation(pr, 'aP'), aN = gl.getAttribLocation(pr, 'aN'), aC = gl.getAttribLocation(pr, 'aC');
    var uVP = gl.getUniformLocation(pr, 'uVP'), uTint = gl.getUniformLocation(pr, 'uTint'), uLit = gl.getUniformLocation(pr, 'uLit'), uAlpha = gl.getUniformLocation(pr, 'uAlpha');
    var layers = {}, view = {gl:gl, canvas:canvas, cam:{target:[0,0.6,0], yaw:0.75, pitch:0.32, dist:7, fov:38}, bg:[0.914, 0.863, 0.773]};
    var VP = null, IVP = null, W = 1, H = 1, dirty = true;

    function upload(L, data, kind){
      if (!L.b) L.b = {p:gl.createBuffer(), n:gl.createBuffer(), c:gl.createBuffer()};
      var n = data.pos.length/3;
      gl.bindBuffer(gl.ARRAY_BUFFER, L.b.p); gl.bufferData(gl.ARRAY_BUFFER, data.pos instanceof Float32Array ? data.pos : new Float32Array(data.pos), gl.STATIC_DRAW);
      var nor = data.nor || new Float32Array(n*3);
      gl.bindBuffer(gl.ARRAY_BUFFER, L.b.n); gl.bufferData(gl.ARRAY_BUFFER, nor instanceof Float32Array ? nor : new Float32Array(nor), gl.STATIC_DRAW);
      var col = data.col; if (col.length === n*3){ var c4 = new Float32Array(n*4); for (var i = 0; i < n; i++){ c4[i*4] = col[i*3]; c4[i*4+1] = col[i*3+1]; c4[i*4+2] = col[i*3+2]; c4[i*4+3] = 1; } col = c4; }
      gl.bindBuffer(gl.ARRAY_BUFFER, L.b.c); gl.bufferData(gl.ARRAY_BUFFER, col instanceof Float32Array ? col : new Float32Array(col), gl.STATIC_DRAW);
      L.count = n; L.kind = kind;
    }
    view.set = function(name, data, opt){
      var L = layers[name] || (layers[name] = {}); L.opt = opt || {};
      if (!data || !(data.tris || data.lines || data.points)){ L.count = 0; dirty = true; return; }
      if (data.tris) upload(L, data.tris, gl.TRIANGLES); else if (data.lines) upload(L, data.lines, gl.LINES); else upload(L, data.points, gl.POINTS);
      dirty = true;
    };
    view.opt = function(name, opt){ if (layers[name]){ for (var k in opt) layers[name].opt[k] = opt[k]; dirty = true; } };
    view.dirty = function(){ dirty = true; };

    function eye(){ var c = view.cam, cp = Math.cos(c.pitch); return [c.target[0] + c.dist*cp*Math.sin(c.yaw), c.target[1] + c.dist*Math.sin(c.pitch), c.target[2] + c.dist*cp*Math.cos(c.yaw)]; }
    view.eye = eye;
    function matrices(){
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      var bw = Math.round(W*dpr), bh = Math.round(H*dpr); if (canvas.width !== bw || canvas.height !== bh){ canvas.width = bw; canvas.height = bh; }
      var c = view.cam, P = persp(c.fov*Math.PI/180, W/H, Math.max(0.02, c.dist*0.01), c.dist*40 + 50), Vw = lookAt(eye(), c.target, [0,1,0]);
      VP = m4mul(P, Vw); IVP = inv(VP);
    }
    view.render = function(){
      matrices();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(view.bg[0], view.bg[1], view.bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uVP, false, VP);
      var names = Object.keys(layers).sort(function(a, b){ return (layers[a].opt.order || 0) - (layers[b].opt.order || 0); });
      names.forEach(function(nm){
        var L = layers[nm], o = L.opt; if (!L.count || o.hidden) return;
        if (o.depth === false) gl.disable(gl.DEPTH_TEST); else gl.enable(gl.DEPTH_TEST);
        gl.depthMask(o.depthWrite !== false);
        var a = o.alpha != null ? o.alpha : 1;
        if (a < 1){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); } else gl.disable(gl.BLEND);
        if (o.offset){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(o.offset, o.offset); } else gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.uniform4fv(uTint, o.tint || [0,0,0,0]); gl.uniform1f(uLit, L.kind === gl.TRIANGLES && o.lit !== false ? 1 : 0); gl.uniform1f(uAlpha, a);
        gl.bindBuffer(gl.ARRAY_BUFFER, L.b.p); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, L.b.n); gl.enableVertexAttribArray(aN); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, L.b.c); gl.enableVertexAttribArray(aC); gl.vertexAttribPointer(aC, 4, gl.FLOAT, false, 0, 0);
        gl.drawArrays(L.kind, 0, L.count);
      });
      gl.depthMask(true);
      dirty = false;
    };
    (function loop(){ if (dirty) view.render(); requestAnimationFrame(loop); })();
    if (window.ResizeObserver) new ResizeObserver(function(){ dirty = true; }).observe(canvas); else window.addEventListener('resize', function(){ dirty = true; });

    view.ray = function(x, y){
      if (!IVP) matrices();
      var nx = x/W*2 - 1, ny = 1 - y/H*2, a = xf(IVP, [nx, ny, -1], 1), b = xf(IVP, [nx, ny, 1], 1);
      a = [a[0]/a[3], a[1]/a[3], a[2]/a[3]]; b = [b[0]/b[3], b[1]/b[3], b[2]/b[3]];
      return {o:a, d:norm([b[0]-a[0], b[1]-a[1], b[2]-a[2]])};
    };
    view.project = function(p){ if (!VP) matrices(); var c = xf(VP, p, 1); return [(c[0]/c[3]*0.5 + 0.5)*W, (0.5 - c[1]/c[3]*0.5)*H, c[2]/c[3]]; };
    view.size = function(){ return [W, H]; };
    /* fit a box in view */
    view.frame = function(mn, mx, keepAngle){
      var c = [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2], r = Math.max(0.15, Math.hypot(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2])/2);
      view.cam.target = c; view.cam.dist = r/Math.sin(view.cam.fov*Math.PI/360)*1.08;
      if (!keepAngle){ view.cam.yaw = 0.75; view.cam.pitch = 0.32; }
      dirty = true; if (hooks.changed) hooks.changed();
    };
    view.preset = function(k){
      var P = {front:[0, 0.05], back:[Math.PI, 0.05], left:[-Math.PI/2, 0.05], right:[Math.PI/2, 0.05], top:[0, 1.55], three:[0.75, 0.32]}[k];
      if (P){ view.cam.yaw = P[0]; view.cam.pitch = P[1]; dirty = true; if (hooks.changed) hooks.changed(); }
    };

    /* ---------------------------------------------------------- input */
    var pts = {}, mode = null, last = null, start = null, pinch = null, lastTap = 0, moved = false;
    canvas.style.touchAction = 'none';
    function xy(e){ var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function orbit(dx, dy){ var c = view.cam; c.yaw -= dx*0.008; c.pitch = Math.max(-0.2, Math.min(1.56, c.pitch + dy*0.008)); }
    function pan(dx, dy){
      var c = view.cam, e = eye(), f = norm([c.target[0]-e[0], c.target[1]-e[1], c.target[2]-e[2]]), r = norm(cross(f, [0,1,0])), u = cross(r, f), s = c.dist*0.0016*(38/c.fov);
      c.target = [c.target[0] - r[0]*dx*s + u[0]*dy*s, c.target[1] - r[1]*dx*s + u[1]*dy*s, c.target[2] - r[2]*dx*s + u[2]*dy*s];
    }
    function zoom(k){ var c = view.cam; c.dist = Math.max(0.15, Math.min(80, c.dist*k)); }
    canvas.addEventListener('pointerdown', function(e){
      canvas.setPointerCapture(e.pointerId); pts[e.pointerId] = xy(e);
      var ids = Object.keys(pts);
      if (ids.length === 1){
        var p = pts[e.pointerId]; start = p; last = p; moved = false;
        if (e.button === 2 || e.button === 1 || e.shiftKey && e.pointerType === 'mouse' && e.altKey) mode = 'pan';
        else if (hooks.dragStart && hooks.dragStart(p[0], p[1], e)) mode = 'piece';
        else mode = 'orbit';
      } else if (ids.length === 2){
        if (mode === 'piece' && hooks.dragEnd) hooks.dragEnd(true);
        var a = pts[ids[0]], b = pts[ids[1]]; pinch = {d:Math.hypot(a[0]-b[0], a[1]-b[1]), m:[(a[0]+b[0])/2, (a[1]+b[1])/2]}; mode = 'pinch'; moved = true;
      }
    });
    canvas.addEventListener('pointermove', function(e){
      if (!pts[e.pointerId]) return; var p = xy(e); pts[e.pointerId] = p;
      var ids = Object.keys(pts);
      if (mode === 'pinch' && ids.length >= 2){
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0]-b[0], a[1]-b[1]), m = [(a[0]+b[0])/2, (a[1]+b[1])/2];
        if (pinch.d > 0) zoom(pinch.d/Math.max(1, d)); pan(m[0]-pinch.m[0], m[1]-pinch.m[1]); pinch = {d:d, m:m};
        dirty = true; if (hooks.changed) hooks.changed(); return;
      }
      if (!last) return;
      var dx = p[0]-last[0], dy = p[1]-last[1]; last = p;
      if (Math.hypot(p[0]-start[0], p[1]-start[1]) > 6) moved = true;
      if (!moved) return;
      if (mode === 'piece'){ if (hooks.drag) hooks.drag(p[0], p[1]); }
      else if (mode === 'pan'){ pan(dx, dy); dirty = true; if (hooks.changed) hooks.changed(); }
      else if (mode === 'orbit'){ orbit(dx, dy); dirty = true; if (hooks.changed) hooks.changed(); }
    });
    function up(e){
      if (!pts[e.pointerId]) return; var p = pts[e.pointerId]; delete pts[e.pointerId];
      var left = Object.keys(pts).length;
      if (mode === 'pinch'){ if (!left){ mode = null; last = null; } else { last = pts[Object.keys(pts)[0]]; start = last; mode = 'orbit'; moved = true; } return; }
      if (mode === 'piece' && hooks.dragEnd) hooks.dragEnd(!moved);
      if (!moved && (mode === 'orbit' || mode === 'piece' || mode === 'pan') && e.type === 'pointerup'){
        var now = Date.now();
        if (now - lastTap < 320 && hooks.doubleTap) hooks.doubleTap(p[0], p[1]); else if (hooks.tap) hooks.tap(p[0], p[1], e);
        lastTap = now;
      }
      if (!left){ mode = null; last = null; }
    }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    canvas.addEventListener('wheel', function(e){ e.preventDefault();
      if (e.ctrlKey) zoom(Math.exp(e.deltaY*0.01)); else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && e.deltaMode === 0 && !e.shiftKey) pan(-e.deltaX, -e.deltaY); else zoom(Math.exp(e.deltaY*0.0015));
      dirty = true; if (hooks.changed) hooks.changed(); }, {passive:false});
    /* Safari's pinch on a trackpad */
    var gs = 1; canvas.addEventListener('gesturestart', function(e){ e.preventDefault(); gs = 1; });
    canvas.addEventListener('gesturechange', function(e){ e.preventDefault(); zoom(gs/e.scale); gs = e.scale; dirty = true; });
    view.zoom = function(k){ zoom(k); dirty = true; };
    view.orbit = function(dx, dy){ orbit(dx, dy); dirty = true; };
    return view;
  };

  /* ray against a triangle: distance or -1 (Moller-Trumbore) */
  V.hitTri = function(o, d, a, b, c){
    var e1 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], e2 = [c[0]-a[0], c[1]-a[1], c[2]-a[2]], p = cross(d, e2), det = dot(e1, p);
    if (Math.abs(det) < 1e-12) return -1; var id = 1/det, t = [o[0]-a[0], o[1]-a[1], o[2]-a[2]], u = dot(t, p)*id; if (u < 0 || u > 1) return -1;
    var q = cross(t, e1), v = dot(d, q)*id; if (v < 0 || u + v > 1) return -1; var s = dot(e2, q)*id; return s > 1e-5 ? s : -1;
  };
  /* ray against a plane through p with normal n */
  V.hitPlane = function(o, d, p, n){ var dn = dot(d, n); if (Math.abs(dn) < 1e-6) return null; var t = dot([p[0]-o[0], p[1]-o[1], p[2]-o[2]], n)/dn; if (t < 0) return null; return [o[0]+d[0]*t, o[1]+d[1]*t, o[2]+d[2]*t]; };

  root.WSV = V;
})(window);
