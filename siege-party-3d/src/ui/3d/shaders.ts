/** The shaders: lit, shadowed low-poly surfaces, water, little sprites, marks on the ground, and the final soft-focus pass. */

const COMMON = `
uniform vec3 uSun;
uniform vec3 uSunCol;
uniform vec3 uSky;
uniform vec3 uBounce;
uniform highp sampler2DShadow uShadow;
uniform mat4 uLVP;
uniform sampler2D uFog;
uniform vec2 uMap;
uniform vec3 uEye;
uniform float uTime;
uniform float uShadowOn;

float shadowAt(vec3 w) {
  if (uShadowOn < 0.5) return 1.0;
  vec4 l = uLVP * vec4(w, 1.0);
  vec3 c = l.xyz / l.w * 0.5 + 0.5;
  if (c.x <= 0.001 || c.x >= 0.999 || c.y <= 0.001 || c.y >= 0.999 || c.z >= 1.0) return 1.0;
  vec2 t = 1.0 / vec2(textureSize(uShadow, 0));
  float s = 0.0;
  s += texture(uShadow, vec3(c.xy + vec2(-0.7, -0.7) * t, c.z));
  s += texture(uShadow, vec3(c.xy + vec2(0.7, -0.7) * t, c.z));
  s += texture(uShadow, vec3(c.xy + vec2(-0.7, 0.7) * t, c.z));
  s += texture(uShadow, vec3(c.xy + vec2(0.7, 0.7) * t, c.z));
  return s * 0.25;
}

vec3 faceNormal(vec3 w) {
  vec3 n = normalize(cross(dFdx(w), dFdy(w)));
  if (dot(n, uEye - w) < 0.0) n = -n;
  return n;
}

vec3 lit(vec3 base, vec3 n, vec3 w) {
  float d = dot(n, uSun);
  float sh = d > 0.0 ? shadowAt(w + n * 0.04) : 0.0;
  vec3 amb = mix(uBounce, uSky, n.y * 0.5 + 0.5);
  // a little light wrapping round the shaded side keeps it soft
  float wrap = max(d, 0.0) * sh + max(-d, 0.0) * 0.06;
  return base * (amb + uSunCol * wrap);
}

/** a warm, gently rich finish */
vec3 grade(vec3 c) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, 1.04);
  return c * vec3(1.02, 1.0, 0.97);
}

float fogAt(vec2 xz) {
  // several soft looks at the map of what is seen, so its edges are round, not tiled
  vec2 t = 1.0 / uMap;
  vec2 uv = xz * t;
  float v = texture(uFog, uv).r * 0.28;
  v += texture(uFog, uv + vec2(0.75, 0.3) * t).r * 0.18;
  v += texture(uFog, uv + vec2(-0.3, 0.75) * t).r * 0.18;
  v += texture(uFog, uv + vec2(-0.75, -0.3) * t).r * 0.18;
  v += texture(uFog, uv + vec2(0.3, -0.75) * t).r * 0.18;
  return v;
}

vec3 fogOfWar(vec3 c, vec3 w) {
  float v = fogAt(w.xz);
  v = v > 0.5 ? 0.5 + smoothstep(0.55, 0.95, v) * 0.5 : smoothstep(0.08, 0.5, v) * 0.5;
  float g = dot(c, vec3(0.3, 0.59, 0.11));
  vec3 seen = mix(vec3(g), c, 0.45) * vec3(0.52, 0.56, 0.66);
  float cloud = sin(w.x * 0.37 + sin(w.z * 0.29) * 2.0) * sin(w.z * 0.31 - uTime * 0.05) * 0.5 + 0.5;
  vec3 dark = mix(vec3(0.2, 0.24, 0.3), vec3(0.27, 0.31, 0.37), cloud);
  return v > 0.5 ? mix(seen, c, (v - 0.5) * 2.0) : mix(dark, seen, v * 2.0);
}
`;

export const MODEL_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aCol;
layout(location=2) in float aPart;
layout(location=3) in vec4 iPos;
layout(location=4) in vec4 iMisc;
layout(location=5) in vec4 iAnim;
uniform mat4 uVP;
uniform vec4 uPivot;
uniform vec3 uTeam[12];
uniform float uTime;
out vec3 vW;
out vec4 vCol;
out float vLocalY;
out float vClip;
out float vFlash;
vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
void main() {
  vec3 p = aPos;
  if (aPart > 0.5 && aPart < 2.5) {
    float a = (aPart < 1.5 ? 1.0 : -1.0) * sin(iAnim.x) * iAnim.y;
    vec3 pv = vec3(0.0, uPivot.x, uPivot.z);
    p = rotX(p - pv, a) + pv;
  } else if (aPart > 2.5 && aPart < 3.5) {
    float a = -abs(sin(iAnim.z)) * iAnim.w;
    vec3 pv = vec3(0.0, uPivot.y, 0.0);
    p = rotX(p - pv, a) + pv;
  } else if (aPart > 3.5) {
    // cloth that sways: sails and banners
    p.x += sin(uTime * 2.6 + iPos.x * 3.0 + p.y * 4.0) * 0.025 * (aPart - 3.5) * 2.0;
  }
  vLocalY = p.y;
  p *= iMisc.x;
  float c = cos(iPos.w), s = sin(iPos.w);
  vec3 w = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + iPos.xyz;
  vW = w;
  int t = int(iMisc.y + 0.5);
  vec3 col = aCol.rgb;
  if (aCol.a < 0.4) col *= uTeam[t * 2];
  else if (aCol.a < 0.7) col *= uTeam[t * 2 + 1];
  vCol = vec4(col, aCol.a > 0.8 && aCol.a < 0.9 ? 1.0 : 0.0);
  vClip = iMisc.w;
  vFlash = iMisc.z;
  gl_Position = uVP * vec4(w, 1.0);
}`;

export const MODEL_FS = `#version 300 es
precision highp float;
${COMMON}
in vec3 vW;
in vec4 vCol;
in float vLocalY;
in float vClip;
in float vFlash;
out vec4 o;
void main() {
  if (vLocalY > vClip) discard;
  vec3 n = faceNormal(vW);
  vec3 c = vCol.a > 0.5 ? vCol.rgb * 1.25 : lit(vCol.rgb, n, vW);
  c = mix(c, vec3(1.0, 0.96, 0.9), vFlash);
  o = vec4(grade(fogOfWar(c, vW)), 1.0);
}`;

export const DEPTH_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=2) in float aPart;
layout(location=3) in vec4 iPos;
layout(location=4) in vec4 iMisc;
layout(location=5) in vec4 iAnim;
uniform mat4 uVP;
uniform vec4 uPivot;
out float vLocalY;
out float vClip;
vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
void main() {
  vec3 p = aPos;
  if (aPart > 0.5 && aPart < 2.5) {
    float a = (aPart < 1.5 ? 1.0 : -1.0) * sin(iAnim.x) * iAnim.y;
    vec3 pv = vec3(0.0, uPivot.x, uPivot.z);
    p = rotX(p - pv, a) + pv;
  }
  vLocalY = p.y;
  vClip = iMisc.w;
  p *= iMisc.x;
  float c = cos(iPos.w), s = sin(iPos.w);
  vec3 w = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + iPos.xyz;
  gl_Position = uVP * vec4(w, 1.0);
}`;

export const DEPTH_FS = `#version 300 es
precision highp float;
in float vLocalY;
in float vClip;
out vec4 o;
void main() {
  if (vLocalY > vClip) discard;
  o = vec4(1.0);
}`;

export const GROUND_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aCol;
uniform mat4 uVP;
out vec3 vW;
out vec3 vCol;
void main() {
  vW = aPos;
  vCol = aCol;
  gl_Position = uVP * vec4(aPos, 1.0);
}`;

export const GROUND_FS = `#version 300 es
precision highp float;
${COMMON}
in vec3 vW;
in vec3 vCol;
out vec4 o;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 n = faceNormal(vW);
  // soft mottling, so the flat colours read as painted grass and earth
  vec2 q = vW.xz * 2.2;
  vec2 i = floor(q);
  vec2 f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  float nz = mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  float s = nz * 0.07 - 0.035;
  vec3 c = vCol * (1.0 + s);
  o = vec4(grade(fogOfWar(lit(c, n, vW), vW)), 1.0);
}`;

export const DECOR_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aCol;
layout(location=3) in vec4 iPos;
layout(location=4) in vec4 iCol;
uniform mat4 uVP;
uniform sampler2D uOcc;
uniform vec2 uMapD;
uniform float uTimeD;
out vec3 vW;
out vec3 vCol;
void main() {
  float taken = texture(uOcc, iPos.xz / uMapD).r;
  vec3 p = aPos * iCol.x * (taken > 0.5 ? 0.0 : 1.0);
  // grass and reeds lean in the wind, more at the top
  p.x += sin(uTimeD * 1.7 + iPos.x * 1.3 + iPos.z) * 0.03 * p.y * 3.0;
  float c = cos(iPos.w), s = sin(iPos.w);
  vec3 w = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + iPos.xyz;
  vW = w;
  vCol = aCol.a < 0.4 ? aCol.rgb * iCol.yzw : aCol.rgb;
  gl_Position = uVP * vec4(w, 1.0);
}`;

export const DECOR_FS = `#version 300 es
precision highp float;
${COMMON}
in vec3 vW;
in vec3 vCol;
out vec4 o;
void main() {
  vec3 n = faceNormal(vW);
  o = vec4(grade(fogOfWar(lit(vCol, n, vW), vW)), 1.0);
}`;

export const WATER_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
uniform mat4 uVP;
out vec3 vW;
void main() {
  vW = aPos;
  gl_Position = uVP * vec4(aPos, 1.0);
}`;

export const WATER_FS = `#version 300 es
precision highp float;
${COMMON}
uniform sampler2D uShore;
in vec3 vW;
out vec4 o;
void main() {
  vec2 uv = vW.xz / uMap;
  vec2 out2 = max(vec2(0.0), max(-uv, uv - 1.0)) * uMap;
  float d = texture(uShore, clamp(uv, 0.0, 1.0)).r * 8.0 + length(out2);
  vec3 shallow = vec3(0.42, 0.83, 0.82);
  vec3 mid = vec3(0.16, 0.62, 0.74);
  vec3 deep = vec3(0.09, 0.38, 0.6);
  vec3 c = mix(shallow, mid, smoothstep(0.5, 1.8, d));
  c = mix(c, deep, smoothstep(1.8, 6.0, d));
  // little waves: a normal from a few moving ripples
  vec2 p = vW.xz;
  float t = uTime;
  vec2 g = vec2(
    cos(p.x * 2.1 + t * 1.3) * 0.5 + cos(p.x * 3.7 - p.y * 1.9 + t * 1.9) * 0.35 + cos((p.x + p.y) * 5.3 + t * 2.7) * 0.2,
    cos(p.y * 2.3 - t * 1.1) * 0.5 + cos(p.y * 3.3 + p.x * 1.7 + t * 1.6) * 0.35 + cos((p.y - p.x) * 5.9 - t * 2.4) * 0.2);
  vec3 n = normalize(vec3(-g.x * 0.08, 1.0, -g.y * 0.08));
  vec3 v = normalize(uEye - vW);
  vec3 h = normalize(uSun + v);
  float spec = pow(max(dot(n, h), 0.0), 120.0) * 1.4;
  float sh = shadowAt(vW);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  c = c * (uSky * 0.55 + uSunCol * 0.6 * (0.55 + 0.45 * sh)) + vec3(0.72, 0.86, 0.95) * fres * 0.35;
  c += uSunCol * spec * sh;
  // foam along the shore, breathing in and out
  float wave = sin(d * 9.0 - t * 2.2 + sin(p.x * 0.7 + p.y * 0.5) * 2.0) * 0.5 + 0.5;
  float foam = smoothstep(1.0, 0.55, d) * (0.55 + 0.45 * wave);
  foam = max(foam, smoothstep(0.62, 0.5, d));
  c = mix(c, vec3(0.97, 0.99, 0.97), foam * 0.85);
  o = vec4(grade(fogOfWar(c, vW)), 1.0);
}`;

/** soft round sprites that face the camera: smoke, sparks, dust */
export const SPRITE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=3) in vec4 iPos;
layout(location=4) in vec4 iCol;
uniform mat4 uVP;
uniform vec3 uRight;
uniform vec3 uUp;
out vec2 vUv;
out vec4 vCol;
out vec3 vW;
void main() {
  vec3 w = iPos.xyz + (uRight * aCorner.x + uUp * aCorner.y) * iPos.w;
  vUv = aCorner;
  vCol = iCol;
  vW = iPos.xyz;
  gl_Position = uVP * vec4(w, 1.0);
}`;

export const SPRITE_FS = `#version 300 es
precision highp float;
uniform sampler2D uFog;
uniform vec2 uMap;
in vec2 vUv;
in vec4 vCol;
in vec3 vW;
out vec4 o;
void main() {
  float r = length(vUv);
  if (r > 1.0) discard;
  float a = vCol.a * smoothstep(1.0, 0.55, r);
  float v = texture(uFog, vW.xz / uMap).r;
  o = vec4(vCol.rgb * a, a * smoothstep(0.55, 0.9, v));
}`;

/** flat marks on the ground: rings round what is picked, squares where things will go */
export const DECAL_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=3) in vec4 iBox;
layout(location=4) in vec4 iCol;
layout(location=5) in vec4 iShape;
uniform mat4 uVP;
out vec2 vUv;
out vec4 vCol;
out vec4 vShape;
out vec2 vSize;
void main() {
  vec3 w = vec3(iBox.x + aCorner.x * iBox.z, iShape.w, iBox.y + aCorner.y * iBox.w);
  vUv = aCorner;
  vCol = iCol;
  vShape = iShape;
  vSize = iBox.zw;
  gl_Position = uVP * vec4(w, 1.0);
}`;

export const DECAL_FS = `#version 300 es
precision highp float;
uniform float uTime;
in vec2 vUv;
in vec4 vCol;
in vec4 vShape;
in vec2 vSize;
out vec4 o;
void main() {
  float a;
  if (vShape.x < 0.5) {
    // a ring
    float r = length(vUv);
    float w = vShape.y;
    a = smoothstep(1.0, 1.0 - w * 0.35, r) * smoothstep(1.0 - w * 1.4, 1.0 - w, r);
  } else if (vShape.x < 1.5) {
    // a filled box with a bright edge
    vec2 e = (1.0 - abs(vUv)) * vSize;
    float edge = 1.0 - smoothstep(0.0, 0.07, min(e.x, e.y));
    a = 0.35 + 0.65 * edge;
  } else if (vShape.x < 2.5) {
    // a soft round shadow or glow
    float r = length(vUv);
    a = smoothstep(1.0, 0.2, r);
  } else {
    // a solid patch with a bright edge
    vec2 e = (1.0 - abs(vUv)) * vSize;
    float edge = 1.0 - smoothstep(0.0, 0.18, min(e.x, e.y));
    a = 0.62 + 0.38 * edge;
  }
  a *= vCol.a;
  o = vec4(vCol.rgb * a, a);
}`;
