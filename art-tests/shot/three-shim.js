/* A small stand-in for the parts of three.js r160 that art-tests/album.html uses, for rendering here with no network.
   Lambert lighting (hemisphere + directional), sun shadow map, fog, vertex colours, see-through glass. Colours are
   handled in linear space and written out as sRGB, like three.js. */
export const SRGBColorSpace = 'srgb', PCFSoftShadowMap = 2, DoubleSide = 2;
const s2l = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
export class Color {
  constructor(r, g, b) { this.r = 1; this.g = 1; this.b = 1; if (r instanceof Color) { this.r = r.r; this.g = r.g; this.b = r.b; } else if (g === undefined && r !== undefined) this.setHex(r); else if (r !== undefined) { this.r = r; this.g = g; this.b = b; } }
  setHex(h) { this.r = s2l(((h >> 16) & 255) / 255); this.g = s2l(((h >> 8) & 255) / 255); this.b = s2l((h & 255) / 255); return this; }
  setRGB(r, g, b, sp) { if (sp === SRGBColorSpace) { r = s2l(r); g = s2l(g); b = s2l(b); } this.r = r; this.g = g; this.b = b; return this; }
}
const V3 = () => { const v = { x: 0, y: 0, z: 0, set(a, b, c) { v.x = a; v.y = b; v.z = c; return v; }, setScalar(s) { v.x = v.y = v.z = s; return v; } }; return v; };
export class Object3D {
  constructor() { this.position = V3(); this.rotation = V3(); this.scale = V3().set(1, 1, 1); this.children = []; this.visible = true; this.renderOrder = 0; }
  add(...o) { for (const c of o) { this.children.push(c); c.parent = this; } return this; }
  remove(o) { this.children = this.children.filter(c => c !== o); }
  traverse(f) { f(this); for (const c of this.children) c.traverse(f); }
  lookAt() {}
  local() { const p = this.position, r = this.rotation, s = this.scale;
    const cx = Math.cos(r.x), sx = Math.sin(r.x), cy = Math.cos(r.y), sy = Math.sin(r.y), cz = Math.cos(r.z), sz = Math.sin(r.z);
    // Euler XYZ: R = Rx * Ry * Rz (three.js order 'XYZ')
    const m00 = cy * cz, m01 = -cy * sz, m02 = sy;
    const m10 = cx * sz + sx * sy * cz, m11 = cx * cz - sx * sy * sz, m12 = -sx * cy;
    const m20 = sx * sz - cx * sy * cz, m21 = sx * cz + cx * sy * sz, m22 = cx * cy;
    return [m00 * s.x, m10 * s.x, m20 * s.x, 0, m01 * s.y, m11 * s.y, m21 * s.y, 0, m02 * s.z, m12 * s.z, m22 * s.z, 0, p.x, p.y, p.z, 1]; }
}
function mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
export class Group extends Object3D {}
export class Scene extends Object3D { constructor() { super(); this.background = null; this.fog = null; } }
export class Fog { constructor(c, n, f) { this.color = new Color(c); this.near = n; this.far = f; } }
export class BufferAttribute { constructor(a, n) { this.array = a instanceof Float32Array ? a : new Float32Array(a); this.itemSize = n; } }
export class Float32BufferAttribute extends BufferAttribute {}
export class BufferGeometry { constructor() { this.attributes = {}; this.index = null; } setAttribute(k, a) { this.attributes[k] = a; return this; } setIndex(i) { this.index = i ? (i.array ? i.array : i) : null; return this; } dispose() { this._gl = null; } }
function fromQuads(P, N) { const g = new BufferGeometry(), pos = [], nor = [], idx = []; for (let q = 0; q < P.length; q++) { const b = pos.length / 3; for (const p of P[q]) { pos.push(...p); nor.push(...N[q]); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; }
export class PlaneGeometry extends BufferGeometry { constructor(w = 1, h = 1) { super(); const a = w / 2, b = h / 2; Object.assign(this, fromQuads([[[-a, -b, 0], [a, -b, 0], [a, b, 0], [-a, b, 0]]], [[0, 0, 1]])); } }
export class BoxGeometry extends BufferGeometry { constructor(w = 1, h = 1, d = 1) { super(); const x = w / 2, y = h / 2, z = d / 2;
  Object.assign(this, fromQuads([
    [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]],
    [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]],
    [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
    [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]])); } }
class Material { constructor(o = {}) { this.color = new Color(o.color !== undefined ? o.color : 0xffffff); this.vertexColors = !!o.vertexColors; this.transparent = !!o.transparent; this.opacity = o.opacity === undefined ? 1 : o.opacity; this.depthWrite = o.depthWrite !== false; this.side = o.side || 0; this.emissive = new Color(0); } }
export class MeshLambertMaterial extends Material {}
export class MeshBasicMaterial extends Material { constructor(o) { super(o); this.basic = true; } }
export class LineBasicMaterial extends Material { constructor(o) { super(o); this.basic = true; } }
export class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m || new MeshLambertMaterial(); this.isMesh = true; } }
export class LineSegments extends Mesh { constructor(g, m) { super(g, m); this.isLine = true; } }
class Light extends Object3D { constructor(c, i) { super(); this.color = new Color(c); this.intensity = i === undefined ? 1 : i; this.isLight = true; } }
export class HemisphereLight extends Light { constructor(s, g, i) { super(s, i); this.groundColor = new Color(g); this.isHemi = true; } }
export class DirectionalLight extends Light { constructor(c, i) { super(c, i); this.isDir = true; this.target = new Object3D(); this.shadow = { mapSize: { set() {} }, camera: { left: -40, right: 40, top: 40, bottom: -40, near: 0.5, far: 120 }, bias: 0 }; } }
export class PointLight extends Light { constructor(c, i, d) { super(c, i); this.isPoint = true; this.distance = d || 0; } }
export class SpotLight extends PointLight { constructor(c, i, d) { super(c, i, d); this.target = new Object3D(); } }
export class PerspectiveCamera extends Object3D {
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) { super(); Object.assign(this, { fov, aspect, near, far }); this._t = [0, 0, -1]; }
  updateProjectionMatrix() {}
  lookAt(x, y, z) { this._t = typeof x === 'object' ? [x.x, x.y, x.z] : [x, y, z]; }
}
export class WebGLRenderer {
  constructor(o) { this.domElement = o.canvas; this.shadowMap = { enabled: false, type: 0 }; this.pr = 1;
    const gl = this.gl = o.canvas.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true });
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const prog = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, 'p'); gl.bindAttribLocation(p, 1, 'n'); gl.bindAttribLocation(p, 2, 'c'); gl.linkProgram(p); return p; };
    this.main = prog(`#version 300 es
      in vec3 p; in vec3 n; in vec3 c; uniform mat4 M, VP, SVP; uniform mat3 NM; uniform float useVC; uniform vec3 mc;
      out vec3 vn; out vec3 vc; out vec3 wp; out vec4 sp;
      void main(){ vec4 w=M*vec4(p,1.0); wp=w.xyz; vn=normalize(NM*n); vc=mix(mc, c*mc, useVC); sp=SVP*w; gl_Position=VP*w; }`,
    `#version 300 es
      precision highp float; in vec3 vn; in vec3 vc; in vec3 wp; in vec4 sp; out vec4 o;
      uniform vec3 hs, hg, d0c, d0d, d1c, d1d; uniform float basic, op, fogOn, fn, ff, shOn; uniform vec3 fc, cam; uniform sampler2D sm; uniform vec3 pl[8]; uniform vec3 plc[8]; uniform int npl;
      float shadow(){ vec3 q=sp.xyz/sp.w*0.5+0.5; if(q.x<0.0||q.x>1.0||q.y<0.0||q.y>1.0||q.z>1.0) return 1.0; float s=0.0; vec2 t=1.0/vec2(textureSize(sm,0));
        for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++){ float d=texture(sm,q.xy+vec2(i,j)*t).r; s+= q.z-0.0015>d?0.0:1.0; } return s/9.0; }
      void main(){ vec3 N=normalize(vn); if(!gl_FrontFacing) N=-N; vec3 col;
        if(basic>0.5) col=vc; else { float h=0.5*N.y+0.5; vec3 irr=mix(hg,hs,h); float s=shOn>0.5?shadow():1.0;
          irr+=d0c*max(dot(N,d0d),0.0)*s + d1c*max(dot(N,d1d),0.0);
          for(int i=0;i<8;i++){ if(i>=npl) break; vec3 L=pl[i]-wp; float d=length(L); irr+=plc[i]*max(dot(N,L/d),0.0)/(1.0+d*d*0.6); }
          col=vc*irr; }
        if(fogOn>0.5){ float f=smoothstep(fn,ff,length(wp-cam)); col=mix(col,fc,f); }
        col=pow(clamp(col,0.0,1.0)/(1.0), vec3(1.0/2.2)); o=vec4(col,op); }`);
    this.depth = prog(`#version 300 es
      in vec3 p; uniform mat4 M, VP; void main(){ gl_Position=VP*M*vec4(p,1.0); }`, `#version 300 es
      precision highp float; out vec4 o; void main(){ o=vec4(1.0); }`);
    this.smTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.smTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, 4096, 4096, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.smTex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  setPixelRatio(r) { this.pr = r; }
  setSize(w, h) { this.w = w; this.h = h; this.domElement.width = w * this.pr; this.domElement.height = h * this.pr; this.domElement.style.width = w + 'px'; this.domElement.style.height = h + 'px'; }
  setAnimationLoop(f) { const go = () => { if (f) f(); requestAnimationFrame(go); }; requestAnimationFrame(go); }
  buf(g) { const gl = this.gl; if (g._gl) return g._gl; const A = g.attributes, o = { vao: gl.createVertexArray() }; gl.bindVertexArray(o.vao);
    const put = (k, loc) => { const a = A[k]; if (!a) { gl.disableVertexAttribArray(loc); return; } const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a.array, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0); };
    put('position', 0); put('normal', 1); put('color', 2); if (!A.normal) gl.vertexAttrib3f(1, 0, 1, 0); if (!A.color) gl.vertexAttrib3f(2, 1, 1, 1);
    if (g.index) { const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(g.index), gl.STATIC_DRAW); o.n = g.index.length; o.idx = true; } else o.n = A.position.array.length / 3;
    gl.bindVertexArray(null); g._gl = o; return o; }
  render(scene, cam) {
    const gl = this.gl, items = [], lights = [];
    const walk = (o, M) => { if (o.visible === false) return; const W = mul(M, o.local()); o._w = W; if (o.isMesh) items.push(o); if (o.isLight) lights.push(o); for (const c of o.children) walk(c, W); };
    walk(scene, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    // camera
    const e = [cam.position.x, cam.position.y, cam.position.z], t = cam._t;
    let f = [t[0] - e[0], t[1] - e[1], t[2] - e[2]]; const nz = Math.hypot(...f); f = f.map(v => v / nz);
    let r = [f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0]; const nr = Math.hypot(...r) || 1; r = r.map(v => v / nr);
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const V = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -(r[0] * e[0] + r[1] * e[1] + r[2] * e[2]), -(u[0] * e[0] + u[1] * e[1] + u[2] * e[2]), (f[0] * e[0] + f[1] * e[1] + f[2] * e[2]), 1];
    const ty = 1 / Math.tan(cam.fov * Math.PI / 360), n = cam.near, fr = cam.far;
    const P = [ty / cam.aspect, 0, 0, 0, 0, ty, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, 2 * fr * n / (n - fr), 0];
    const VP = mul(P, V);
    // lights
    let hs = [0, 0, 0], hg = [0, 0, 0]; const dirs = [], pls = [];
    for (const L of lights) { const k0 = L.intensity / Math.PI, c = [L.color.r * k0, L.color.g * k0, L.color.b * k0];
      if (L.isHemi) { hs = c; hg = [L.groundColor.r * k0, L.groundColor.g * k0, L.groundColor.b * k0]; }
      else if (L.isDir) { const w = L._w, d = [w[12] - (L.target.position.x), w[13] - L.target.position.y, w[14] - L.target.position.z], k = Math.hypot(...d); dirs.push({ c, d: d.map(v => v / k), L }); }
      else if (L.isPoint && pls.length < 8) { const w = L._w; pls.push({ p: [w[12], w[13], w[14]], c: c.map(v => v * 0.35) }); } }
    while (dirs.length < 2) dirs.push({ c: [0, 0, 0], d: [0, 1, 0] });
    // shadow map from the first directional light, centred on the camera target
    const sun = dirs[0], SC = sun.L && sun.L.shadow.camera; let SVP = null;
    if (this.shadowMap.enabled && sun.L && sun.L.castShadow) {
      const ext = Math.max(SC.right - SC.left, SC.top - SC.bottom) / 2, c0 = t, d = sun.d, se = [c0[0] + d[0] * 60, c0[1] + d[1] * 60, c0[2] + d[2] * 60];
      let sf = [-d[0], -d[1], -d[2]]; let sr = [sf[1] * 0 - sf[2] * 1, 0, sf[0] * 1]; const k = Math.hypot(...sr) || 1; sr = sr.map(v => v / k);
      const su = [sr[1] * sf[2] - sr[2] * sf[1], sr[2] * sf[0] - sr[0] * sf[2], sr[0] * sf[1] - sr[1] * sf[0]];
      const SV = [sr[0], su[0], -sf[0], 0, sr[1], su[1], -sf[1], 0, sr[2], su[2], -sf[2], 0, -(sr[0] * se[0] + sr[1] * se[1] + sr[2] * se[2]), -(su[0] * se[0] + su[1] * se[1] + su[2] * se[2]), (sf[0] * se[0] + sf[1] * se[1] + sf[2] * se[2]), 1];
      const a = ext, nn = 1, ff = 160, SP = [1 / a, 0, 0, 0, 0, 1 / a, 0, 0, 0, 0, -2 / (ff - nn), 0, 0, 0, -(ff + nn) / (ff - nn), 1];
      SVP = mul(SP, SV);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.viewport(0, 0, 4096, 4096); gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.useProgram(this.depth);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2, 4);
      const ul = k => gl.getUniformLocation(this.depth, k); gl.uniformMatrix4fv(ul('VP'), false, SVP);
      for (const m of items) { if (m.isLine || m.material.transparent || m.material.basic) continue; const b = this.buf(m.geometry); gl.uniformMatrix4fv(ul('M'), false, m._w); gl.bindVertexArray(b.vao); b.idx ? gl.drawElements(gl.TRIANGLES, b.n, gl.UNSIGNED_INT, 0) : gl.drawArrays(gl.TRIANGLES, 0, b.n); }
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.viewport(0, 0, this.domElement.width, this.domElement.height);
    const bg = scene.background || new Color(0); const lin2s = v => Math.pow(v, 1 / 2.2);
    gl.clearColor(lin2s(bg.r), lin2s(bg.g), lin2s(bg.b), 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    const p = this.main, U = k => gl.getUniformLocation(p, k); gl.useProgram(p);
    gl.uniformMatrix4fv(U('VP'), false, VP); gl.uniform3fv(U('hs'), hs); gl.uniform3fv(U('hg'), hg);
    gl.uniform3fv(U('d0c'), dirs[0].c); gl.uniform3fv(U('d0d'), dirs[0].d); gl.uniform3fv(U('d1c'), dirs[1].c); gl.uniform3fv(U('d1d'), dirs[1].d);
    gl.uniform1f(U('shOn'), SVP ? 1 : 0); if (SVP) { gl.uniformMatrix4fv(U('SVP'), false, SVP); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.smTex); gl.uniform1i(U('sm'), 0); } else gl.uniformMatrix4fv(U('SVP'), false, VP);
    gl.uniform1i(U('npl'), pls.length); if (pls.length) { gl.uniform3fv(U('pl'), pls.flatMap(x => x.p)); gl.uniform3fv(U('plc'), pls.flatMap(x => x.c)); }
    const fog = scene.fog; gl.uniform1f(U('fogOn'), fog ? 1 : 0); if (fog) { gl.uniform3f(U('fc'), fog.color.r, fog.color.g, fog.color.b); gl.uniform1f(U('fn'), fog.near); gl.uniform1f(U('ff'), fog.far); }
    gl.uniform3fv(U('cam'), e);
    const draw = m => { const b = this.buf(m.geometry), w = m._w, mt = m.material;
      // normal matrix: inverse transpose of the upper 3x3
      const a = [w[0], w[1], w[2], w[4], w[5], w[6], w[8], w[9], w[10]], det = a[0] * (a[4] * a[8] - a[5] * a[7]) - a[3] * (a[1] * a[8] - a[2] * a[7]) + a[6] * (a[1] * a[5] - a[2] * a[4]) || 1;
      const inv = [(a[4] * a[8] - a[5] * a[7]) / det, (a[6] * a[5] - a[3] * a[8]) / det, (a[3] * a[7] - a[6] * a[4]) / det, (a[7] * a[2] - a[1] * a[8]) / det, (a[0] * a[8] - a[6] * a[2]) / det, (a[6] * a[1] - a[0] * a[7]) / det, (a[1] * a[5] - a[4] * a[2]) / det, (a[3] * a[2] - a[0] * a[5]) / det, (a[0] * a[4] - a[3] * a[1]) / det];
      gl.uniformMatrix4fv(U('M'), false, w); gl.uniformMatrix3fv(U('NM'), false, inv);
      gl.uniform1f(U('useVC'), mt.vertexColors ? 1 : 0); gl.uniform3f(U('mc'), mt.color.r, mt.color.g, mt.color.b); gl.uniform1f(U('basic'), mt.basic ? 1 : 0); gl.uniform1f(U('op'), mt.transparent ? mt.opacity : 1);
      gl.bindVertexArray(b.vao); const mode = m.isLine ? gl.LINES : gl.TRIANGLES; b.idx ? gl.drawElements(mode, b.n, gl.UNSIGNED_INT, 0) : gl.drawArrays(mode, 0, b.n); };
    gl.disable(gl.BLEND); gl.depthMask(true); for (const m of items) if (!m.material.transparent) draw(m);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); for (const m of items) if (m.material.transparent) draw(m); gl.depthMask(true); gl.disable(gl.BLEND);
  }
}
