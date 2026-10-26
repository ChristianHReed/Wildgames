/* Shared engine: the renderer. GL set-up and shaders (initGL), the sky and the mood of the hour, the nature models, and drawScene, which draws the map itself.
   Classic script, loaded by play.html and by the Maps Builder. A host page must provide the names listed in engine/README.md (QS, inRun, ART, ...).
   Load order: after collision.js. */
'use strict';
/* ================= renderer ================= */
var prog3, aP, aC, aT, U = {}, dyn = null, vmb = null, glOK = false, texReady = false, natTex = false, pplTex = false, bldTex = false;
function initGL(){
  if (!gl) return false;
  var deriv = gl.getExtension('OES_standard_derivatives'), lod = deriv && gl.getExtension('EXT_shader_texture_lod');
  var vs = 'attribute vec3 p;attribute vec4 c;attribute vec3 t;uniform mat4 vp;uniform vec4 inst;uniform float iscl;varying vec4 vc;varying vec3 wp;varying vec3 vt;void main(){vc=c;vt=t;vec3 q=p*iscl;float cs=cos(inst.w);float sn=sin(inst.w);wp=vec3(q.x*cs-q.z*sn,q.y,q.x*sn+q.z*cs)+inst.xyz;gl_Position=vp*vec4(wp,1.0);}';
  var fs = (deriv ? '#extension GL_OES_standard_derivatives : enable\n' : '') + (lod ? '#extension GL_EXT_shader_texture_lod : enable\n' : '') +
    '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n' +
    'varying vec4 vc;varying vec3 wp;varying vec3 vt;uniform sampler2D atlas;uniform sampler2D atlas3;uniform sampler2D atlas4;uniform sampler2D atlas5;uniform float bldOn;uniform vec3 pp[8];uniform float texOn;uniform float pplOn;uniform vec3 cam;uniform vec3 fwd;uniform vec3 sky;uniform vec3 fogN;uniform vec3 sunc;uniform vec3 shd;uniform float winF;uniform float amb;uniform float dark;uniform float fogK;uniform vec2 fade;uniform float flash;uniform float hurtU;uniform float tm;uniform vec4 fires[8];uniform vec3 fcol[8];uniform vec4 gsea;uniform float gridU;uniform sampler2D dmask;uniform float dmOn;uniform vec2 dmo;uniform float dmS;' +
    'vec3 ppl(vec2 uv,float j){vec2 a4=(vec2(mod(j,8.0)*256.0,floor(j/8.0+0.01)*256.0)+1.0+fract(uv)*254.0)/2048.0;vec4 tp=texture2D(atlas4,a4);float idx=floor(tp.g*8.0);vec3 pc=pp[0];for(int i=1;i<8;i++){if(float(i)==idx)pc=pp[i];}return pc*tp.r*1.99;}' +
    'vec4 samp(float k,vec2 uv){float ss;float sx;float sy;' +
    'if(k>199.5){float j5=k-200.0;vec2 s5=vec2(252.0/2048.0);vec2 a5=(vec2(mod(j5,8.0)*256.0,floor(j5/8.0+0.01)*256.0)+2.0)/2048.0+fract(uv)*s5;' + (lod ? 'return texture2DGradEXT(atlas5,a5,dFdx(uv)*s5,dFdy(uv)*s5);}' : 'return texture2D(atlas5,a5);}') +
    'if(k>59.5){float j3=k-60.0;vec2 s3=vec2(504.0/2048.0,504.0/2048.0);vec2 a3=(vec2(mod(j3,4.0)*512.0,floor(j3/4.0+0.01)*512.0)+4.0)/vec2(2048.0,2048.0)+fract(uv)*s3;' + (lod ? 'return texture2DGradEXT(atlas3,a3,dFdx(uv)*s3,dFdy(uv)*s3);}' : 'return texture2D(atlas3,a3);}') +
    'if(k<11.5){ss=512.0;sx=mod(k,4.0)*512.0;sy=floor(k/4.0+0.01)*512.0;}else{float j=k-12.0;ss=256.0;sx=mod(j,8.0)*256.0;sy=1536.0+floor(j/8.0+0.01)*256.0;}' +
    'float sc=(ss-8.0)/2048.0;vec2 a=(vec2(sx,sy)+4.0)/2048.0+fract(uv)*sc;' +
    (lod ? 'return texture2DGradEXT(atlas,a,dFdx(uv)*sc,dFdy(uv)*sc);}' : 'return texture2D(atlas,a);}') +
    /* terrain: mown grass with long grass, earth and rock painted over it by weight; each layer shows first where its own picture is
       high (tufts, leaves, stone tops), and a soft noise breaks up the even spacing of the cover grid */
    'float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float vn(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),f.x),mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),f.x),f.y);}' +
    'float lay(float w,float h,float m){w=clamp(w+(m-0.5)*w*(1.0-w)*2.4,0.0,1.0);float t=(1.0-h)*0.8;return smoothstep(t+0.02,t+0.2,w);}' +
    'vec4 terr(vec2 uv,vec3 w,vec2 q){vec4 g=samp(0.0,uv);vec3 c=g.rgb;float hh=g.a;float m=vn(q*0.08)*0.65+vn(q*0.23)*0.35;' +
    'float wm=clamp((w.z-45.0)/1.2,0.0,1.0);float we=clamp(w.x,0.0,1.0);float wr=clamp(w.y,0.0,1.0);' +
    'if(wm>0.004){vec4 l=samp(1.0,uv*0.93+0.21);float f=lay(wm,l.a,m);c=mix(c,l.rgb,f);hh=mix(hh,l.a,f);}' +
    'if(we>0.004){vec4 l=samp(2.0,uv*1.07+0.53);float f=lay(we,l.a,1.0-m);c=mix(c,l.rgb,f);hh=mix(hh,l.a,f);}' +
    'if(wr>0.004){vec4 l=samp(3.0,uv*0.5+0.11);float f=lay(wr,l.a,m);c=mix(c,l.rgb,f);hh=mix(hh,0.4,f);}' +
    'return vec4(c,hh);}' +
    'void main(){vec3 V=wp-cam;float d=length(V);' +
    'bool unlit=vc.a>0.6&&vc.a<0.9;bool emis=vc.a>0.25&&vc.a<0.6;bool back=(vc.a<0.25&&!gl_FrontFacing)||(vt.z>190.5&&vt.z<191.5);' +
    'vec3 n=vec3(0.0,1.0,0.0);' + (deriv ? 'if(!unlit){n=normalize(cross(dFdx(wp),dFdy(wp)));if(dot(n,V)>0.0)n=-n;}' : '') +
    'vec3 col=vc.rgb;float glow=0.0;vec3 winc=vec3(1.0,0.8,0.48);float k=floor(vt.z+0.5);' +
    'if(back){if(texOn>0.5)col=samp(21.0,vec2((wp.x+wp.z)*0.5,-wp.y*0.5)).rgb;else col=vec3(0.92,0.86,0.76);col*=1.0-vc.a/0.6;}' +
    /* Art 5: the glass of a framed building's window; vt.x is the window's own number, so some windows are lit at night (warm, or cold and flickering) */
    'else if(k>189.5&&k<190.5){float wh=vt.x;float wc=fract(wh*71.37);float cold=winF>0.2?step(0.8,wc):1.0;float fk=cold>0.5?0.45+0.55*step(0.25,fract(sin(floor(tm*7.0+wh*60.0)*12.9898)*43758.5453)):1.0;glow=step(1.0-winF,wh)*1.7*fk;winc=mix(winc,vec3(0.55,0.75,1.0),cold);col=mix(col,col*0.5,dark);}' +
    'else if(k>199.5){if(texOn>0.5&&bldOn>0.5){vec4 tb=samp(k,vt.xy);if(tb.a>0.75)col=tb.rgb*vc.rgb;else{col=tb.rgb;if(tb.a>0.25){float wh=fract(sin(dot(floor(vec2(wp.x+wp.z,wp.y)*vec2(0.25,0.3125)),vec2(12.9898,78.233)))*43758.5453);float wc=fract(wh*71.37);float cold=winF>0.2?step(0.8,wc):1.0;float fk=cold>0.5?0.45+0.55*step(0.25,fract(sin(floor(tm*7.0+wh*60.0)*12.9898)*43758.5453)):1.0;glow=step(1.0-winF,wh)*1.7*fk;winc=mix(winc,vec3(0.55,0.75,1.0),cold);col=mix(col,col*0.5,dark);}}}}' +
    'else if(k>79.5){if(texOn>0.5&&pplOn>0.5)col=ppl(vt.xy,k-80.0);}' +
    'else if(k>44.5&&k<46.5){if(dmOn>0.5){vec2 du=(wp.xz-dmo)/dmS;if(du.x>0.0&&du.y>0.0&&du.x<1.0&&du.y<1.0&&texture2D(dmask,du).r>0.5)discard;}vec4 tr=texOn>0.5?terr(wp.xz*0.25,vt,wp.xz):vec4(0.5,0.62,0.36,0.5);col=tr.rgb*vc.rgb*gsea.rgb;' +
    'float sn=gsea.a*smoothstep(0.62,0.98,n.y);col=mix(col,vec3(0.9,0.92,0.95),smoothstep(0.0,0.25,sn-(1.0-tr.a)*0.7));}' +
    'else if(k>-0.5){if(texOn>0.5){vec4 tx=samp(k,vt.xy);col=tx.rgb*vc.rgb;glow=(1.0-tx.a)*2.0;if(k>59.5){if(tx.a<0.3)discard;glow=0.0;}if(k>18.5&&k<19.5){vec2 u1=vt.xy+vec2(tm*0.035,tm*0.02);vec2 u2=vt.xy*1.9+vec2(-tm*0.03,tm*0.045);vec3 ww=(samp(19.0,u1).rgb+samp(19.0,u2).rgb)*0.5;float fr=pow(1.0-abs(normalize(V).y),4.0);col=mix(ww*vec3(0.6,0.82,0.94),sky,0.12+fr*0.62);float sp=sin(u1.x*31.0+u2.y*17.0)*sin(u2.x*23.0-u1.y*29.0);col+=vec3(0.24)*smoothstep(0.84,1.0,sp)*(1.0-dark*0.8);glow=0.0;}}else col=vc.rgb*vec3(0.86,0.78,0.66);}' +
    /* light from the upper left and a little behind, at an uneven angle so the four sides of a house each get their own tone and a corner always shows */
    'vec3 LD=normalize(vec3(-0.62,0.72,0.3));float ld=dot(n,LD);float band=smoothstep(-0.55,0.7,ld);if(k>79.5)band=smoothstep(-0.45,0.6,ld);if(unlit||emis)band=1.0;' +
    'col=mix(col*shd*0.86,col*sunc,band);' +
    'float spot=smoothstep(0.78,0.95,dot(V/d,fwd))*0.95/(1.0+d*d*0.004)+0.22/(1.0+d*d*0.12);' +
    'vec3 lit=vec3(amb+dark*spot*flash);' +
    'vec3 lamp=vec3(0.0);for(int i=0;i<8;i++){float fd=distance(wp,fires[i].xyz);lamp+=fcol[i]*fires[i].w*dark/(1.0+fd*fd*0.05);}lit+=lamp;' +
    'if(emis)lit=vec3(1.0);' +
    'col=mix(col,vec3(1.0),hurtU);vec3 outc=col*min(lit,vec3(1.15));vec3 gl2=winc*glow*dark*0.85;' +
    /* the mood fog is darkness at night: lamp pools, a flashlight beam and lit windows show through it */
    'float mf=fogN.z*smoothstep(fogN.x,fogN.y,d)*(1.0-clamp(dot(lamp,vec3(0.33))*0.9+dark*spot*flash*0.8+(emis?0.6:0.0),0.0,0.85));' +
    'float fog=max(max(smoothstep(fade.x,fade.y,d),1.0-exp(-pow(d*fogK,2.0))),mf);gl_FragColor=vec4(mix(outc,sky,fog)+gl2*(1.0-0.55*fog),1.0);}';
  var mk = function(type, src){ var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  prog3 = gl.createProgram(); gl.attachShader(prog3, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(prog3, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog3);
  if (!gl.getProgramParameter(prog3, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog3));
  gl.useProgram(prog3); aP = gl.getAttribLocation(prog3, 'p'); aC = gl.getAttribLocation(prog3, 'c'); aT = gl.getAttribLocation(prog3, 't');
  ['vp','cam','fwd','sky','amb','dark','fogK','fade','fires','fcol','flash','tm','atlas','atlas3','atlas4','atlas5','bldOn','pp','texOn','pplOn','inst','iscl','hurtU','gsea','gridU','dmask','dmOn','dmo','dmS','fogN','sunc','shd','winF'].forEach(function(n){ U[n] = gl.getUniformLocation(prog3, n); });
  gl.uniform1f(U.pplOn, 0); gl.uniform1f(U.bldOn, 0);
  gl.uniform4f(U.inst, 0, 0, 0, 0); gl.uniform1f(U.iscl, 1); gl.uniform1f(U.hurtU, 0); (typeof loadCreatures === 'function' && loadCreatures()); (typeof loadPeople === 'function' && loadPeople());
  gl.enableVertexAttribArray(aP); gl.enableVertexAttribArray(aC); gl.enableVertexAttribArray(aT); gl.enable(gl.DEPTH_TEST);
  dyn = {vb:gl.createBuffer(), cb:gl.createBuffer(), tb:gl.createBuffer(), n:0}; vmb = {vb:gl.createBuffer(), cb:gl.createBuffer(), tb:gl.createBuffer(), n:0};
  /* the texture atlas is embedded in this file; the glow of lit windows lives in its alpha channel */
  var b64 = (ART.atlas || '').replace(/<!--.*?-->/g, '').trim();
  if (b64 && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= (ARTSET === 'full' ? 4096 : 2048)){
    var img = new Image();
    img.onload = function(){
      var tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (lod){ gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      texReady = true;
    };
    img.src = 'data:image/png;base64,' + b64;
    if (ART.btex){   /* the painted building fronts and roofs (tools/paint_buildings.py) */
      var im5 = new Image();
      im5.onload = function(){
        var tx5 = gl.createTexture(); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, tx5); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im5);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (lod){ gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.activeTexture(gl.TEXTURE0); bldTex = true;
      };
      im5.src = 'data:image/png;base64,' + ART.btex;
    }
    if (ART.ptex){   /* the survivors' painted texture: shade in red, which of their colours in green. Sharp pixels, so the colours never blend */
      var im4 = new Image();
      im4.onload = function(){
        var tx4 = gl.createTexture(); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, tx4); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im4);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.activeTexture(gl.TEXTURE0); pplTex = true;
      };
      im4.src = 'data:image/png;base64,' + ART.ptex;
    }
    if (ART.atlas3){
      var im3 = new Image();
      im3.onload = function(){
        var tx3 = gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tx3); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im3);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (lod){ gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.activeTexture(gl.TEXTURE0); natTex = true; loadNature(); if (world && world.gl && world.gl.trees && inRun) buildTrees();
      };
      im3.src = 'data:image/png;base64,' + ART.atlas3;
    }
  }
  return true;
}
function drawMesh(o, mode){
  if (!o || !o.n) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, o.vb); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.cb); gl.vertexAttribPointer(aC, 4, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.tb); gl.vertexAttribPointer(aT, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(mode || gl.TRIANGLES, 0, o.n);
}
/* Art 1 (docs/ART.md): cozy days, scary nights. For each time of day: sky top and horizon (the horizon is also the fog colour),
   where the fog starts and ends and how thick it gets, the sun or moon colour, the colour of shade, and how dark the screen edges are.
   By day the fog is a light haze so the town still shows far off; at night it closes in to about 30 m of near-black */
var MOODK = [
  [0,    '03050a', '0d1420', 5, 30, 1, '7f9ccc', [0.58, 0.64, 0.84], 0.6],
  [5,    '0b1222', '2b2c40', 10, 45, 1, '8ea2c8', [0.6, 0.64, 0.82], 0.45],
  [6.5,  '5f7aa0', 'f2bb8e', 30, 85, 0.7, 'ffb27a', [0.72, 0.64, 0.72], 0.1],
  [9,    '5f97d0', 'd3e4ec', 45, 115, 0.28, 'fff2da', [0.74, 0.7, 0.76], 0],
  [16,   '6a9bd0', 'e2e2d8', 45, 110, 0.28, 'ffe8c4', [0.74, 0.69, 0.74], 0],
  [18.5, '6f80aa', 'ffbe80', 35, 90, 0.5, 'ffa45a', [0.7, 0.6, 0.72], 0.12],
  [20,   '18213a', '4e4566', 16, 58, 1, '9db0de', [0.6, 0.62, 0.82], 0.4],
  [24,   '03050a', '0d1420', 5, 30, 1, '7f9ccc', [0.58, 0.64, 0.84], 0.6]
].map(function(k){ var h = function(x){ var v = parseInt(x, 16); return [(v >> 16 & 255)/255, (v >> 8 & 255)/255, (v & 255)/255]; }; return {h:k[0], top:h(k[1]), hor:h(k[2]), fn:k[3], ff:k[4], fm:k[5], sun:h(k[6]), shd:k[7], vig:k[8]}; });
function moodAt(hour){
  var i = 0; while (MOODK[i+1].h < hour) i++; var a = MOODK[i], b = MOODK[i+1], t = (hour - a.h)/(b.h - a.h), L = function(x, y){ return x + (y - x)*t; }, V = function(x, y){ return [L(x[0], y[0]), L(x[1], y[1]), L(x[2], y[2])]; };
  var sun = V(a.sun, b.sun), mx = Math.max(sun[0], sun[1], sun[2]) || 1;
  return {top:V(a.top, b.top), hor:V(a.hor, b.hor), fn:L(a.fn, b.fn), ff:L(a.ff, b.ff), fm:L(a.fm, b.fm), sun:sun.map(function(v){ return 1 + (v/mx - 1)*0.55; }), shd:V(a.shd, b.shd), vig:L(a.vig, b.vig)};
}
function skyAt(hour){ return moodAt(hour).hor; }
/* the sky is drawn first, behind everything: a gradient from the horizon up, the sun by day, the moon and stars at night */
var skyProg = null, skyU = {}, skyBuf = null;
function initSky(){
  var vs = 'attribute vec2 q;varying vec2 vq;void main(){vq=q;gl_Position=vec4(q,0.9999,1.0);}';
  var fs = 'precision mediump float;varying vec2 vq;uniform vec3 f;uniform vec3 s;uniform vec3 u;uniform vec2 tz;uniform vec3 top;uniform vec3 hor;uniform vec3 sund;uniform vec3 sunc;uniform float night;uniform float tm;' +
    'float hs(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}' +
    'void main(){vec3 r=normalize(f+s*vq.x*tz.x+u*vq.y*tz.y);float e=r.y;vec3 c=mix(hor,top,smoothstep(0.0,0.55,e));' +
    'float sd=dot(r,sund);c+=sunc*(smoothstep(0.9993,0.9997,sd)*1.2+pow(max(sd,0.0),180.0)*0.35)*(1.0-night);' +
    'vec3 md=normalize(vec3(0.35,0.55,-0.76));float m=dot(r,md);c+=vec3(0.75,0.82,0.95)*(smoothstep(0.99955,0.9998,m)*0.9+pow(max(m,0.0),400.0)*0.25)*night;' +
    'vec3 g=floor(r*190.0);float st=step(0.9972,hs(g))*smoothstep(0.04,0.3,e)*night;c+=vec3(0.85,0.88,1.0)*st*(0.55+0.45*sin(tm*2.3+hs(g+1.0)*40.0));' +
    'gl_FragColor=vec4(c,1.0);}';
  var mk = function(type, src){ var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  skyProg = gl.createProgram(); gl.attachShader(skyProg, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(skyProg, mk(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(skyProg, 0, 'q'); gl.linkProgram(skyProg);
  ['f', 's', 'u', 'tz', 'top', 'hor', 'sund', 'sunc', 'night', 'tm'].forEach(function(n){ skyU[n] = gl.getUniformLocation(skyProg, n); });
  skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
}
function drawSky(md, f, sv, u, hour, dk, tz){
  if (!skyProg){ try { initSky(); } catch (er){ skyProg = false; } } if (!skyProg) return;
  tz = tz || 1.19; var se = Math.sin((hour - 6)/12*Math.PI), sa = (hour - 12)/12*Math.PI, sd = [Math.sin(sa)*0.9, Math.max(-0.2, se)*0.85 + 0.03, -0.42], sl = Math.hypot(sd[0], sd[1], sd[2]);
  gl.useProgram(skyProg); gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disableVertexAttribArray(aC); gl.disableVertexAttribArray(aT);
  gl.uniform3fv(skyU.f, f); gl.uniform3fv(skyU.s, sv); gl.uniform3fv(skyU.u, u); gl.uniform2f(skyU.tz, tz*W/H, tz);
  gl.uniform3fv(skyU.top, md.top); gl.uniform3fv(skyU.hor, md.hor); gl.uniform3f(skyU.sund, sd[0]/sl, sd[1]/sl, sd[2]/sl); gl.uniform3fv(skyU.sunc, md.sun); gl.uniform1f(skyU.night, dk); gl.uniform1f(skyU.tm, (performance.now()/1000) % 1000);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.enableVertexAttribArray(aC); gl.enableVertexAttribArray(aT); gl.depthMask(true); gl.enable(gl.DEPTH_TEST); gl.useProgram(prog3);
}
function mul(a, b){ var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++){ var s = 0; for (var k = 0; k < 4; k++) s += a[k*4+r]*b[c*4+k]; o[c*4+r] = s; } return o; }
/* ---- nature models: Quaternius "Stylized Nature MegaKit" (CC0), converted by tools/build_nature.py. Each is one ready mesh, drawn wherever needed. ---- */
/* 0.98.0: the forest floor, from the content chat's woods pack: ferns, flowers, thickets and fungus, with one dead piece (log, stump, brush, root ball, snag) in five */
var FOREST_FLOOR = ['fern', 'w_fern_a', 'w_fern_b', 'w_mayapple', 'shrub', 'w_thicket_a', 'w_thicket_b', 'w_berry_bush', 'w_sumac', 'w_sapling', 'mushrooms', 'w_mushrooms', 'w_wildflower_a', 'w_wildflower_b', 'w_toadstool_ring', 'w_boulder_moss', 'rock', 'fern', 'w_fern_a', 'w_mayapple', 'w_wildflower_c', 'w_thicket_a', 'w_berry_bush', 'w_fern_b', 'mushrooms', 'shrub', 'w_log_mossy', 'w_log_hollow', 'w_stump_big', 'w_brush_pile', 'w_root_ball', 'w_snag_a', 'w_snag_b', 'fern', 'w_boulder_cluster', 'log'];
var IMPR = null, IMPT = {}, NAT = {}, TREES = ['oak', 'maple', 'sycamore', 'poplar', 'pine', 'cedar'], hiTrees = [], clutter = [], clutKey = '', natT = 0;
function loadNature(){
  var t = (ART.nature || '').trim(), nl = t.indexOf('\n'); if (nl < 0) return;
  try {
    var idx = JSON.parse(t.slice(0, nl)), bin = atob(t.slice(nl + 1)), buf = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    var dv = new DataView(buf.buffer);
    IMPR = idx._imp || null; IMPT = idx._imptile || {}; if (idx._trees) TREES = idx._trees; delete idx._imp; delete idx._imptile; delete idx._trees;
    for (var n in idx){
      var e = idx[n], nv = e.n*3, pos = new Float32Array(nv*3), tc = new Float32Array(nv*3), col = new Uint8Array(nv*4);
      for (i = 0; i < nv; i++){ var o = e.o + i*10, q = e.o + nv*10 + Math.floor(i/3)*4; pos[i*3] = dv.getInt16(o, true)/1000; pos[i*3+1] = dv.getInt16(o + 2, true)/1000; pos[i*3+2] = dv.getInt16(o + 4, true)/1000; tc[i*3] = dv.getInt16(o + 6, true)/2048; tc[i*3+1] = dv.getInt16(o + 8, true)/2048; tc[i*3+2] = 60 + buf[q]; col[i*4] = buf[q+1]; col[i*4+1] = buf[q+2]; col[i*4+2] = buf[q+3]; col[i*4+3] = 255; }
      var m = {vb:gl.createBuffer(), cb:gl.createBuffer(), tb:gl.createBuffer(), n:nv, h:e.h};
      gl.bindBuffer(gl.ARRAY_BUFFER, m.vb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, m.tb); gl.bufferData(gl.ARRAY_BUFFER, tc, gl.STATIC_DRAW);
      NAT[n] = m;
    }
  } catch (er){ NAT = {}; }
}
/* choose which trees are close enough to draw in full, and scatter small plants on the mapped green areas around you */
/* plant regrow time (s) and names */
var REGROW = 1500, PNAME = {bush:'the bush', bush_small:'the bush', shrub:'the shrub', flowers_y:'the flowers', flowers_p:'the flowers', flowers_r:'the flowers', grass:'the grass', grass_tall:'the tall grass', fern:'the fern', rock:'the rock', mushrooms:'the mushrooms', log:'the fallen log', stump:'the stump', w_fern_a:'the fern', w_fern_b:'the fern', w_mayapple:'the mayapple', w_wildflower_a:'the flowers', w_wildflower_b:'the flowers', w_wildflower_c:'the flowers', w_mushrooms:'the mushrooms', w_toadstool_ring:'the toadstools', w_thicket_a:'the thicket', w_thicket_b:'the thicket', w_berry_bush:'the berry bush', w_sumac:'the sumac', w_sapling:'the sapling', w_log_hollow:'the hollow log', w_log_mossy:'the mossy log', w_stump_big:'the stump', w_root_ball:'the root ball', w_brush_pile:'the brush pile', w_snag_a:'the dead tree', w_snag_b:'the dead tree', w_boulder_moss:'the mossy rock', w_boulder_cluster:'the rocks'};
function manageNature(){
  if (!NAT.pine || !world.gl.trees) return;
  var R = QS.treeR, cand = [], dirty = {}, i, k;
  nearTrees(P.x, P.y, R, function(tr){ if (!tr.alive) return; var d = Math.hypot(tr.x - P.x, tr.y - P.y); if (d < R) cand.push([d, tr]); });
  cand.sort(function(a, b){ return a[0] - b[0]; }); var next = cand.slice(0, QS.treeN).map(function(c){ return c[1]; });
  hiTrees.forEach(function(tr){ tr.hi2 = false; }); next.forEach(function(tr){ tr.hi2 = true; });
  hiTrees.concat(next).forEach(function(tr){ if (!!tr.hi !== !!tr.hi2){ tr.hi = tr.hi2; dirty[tr.tk] = 1; } });
  hiTrees = next; for (k in dirty) treeTile(+k);
  var cs = 12, cx0 = Math.floor(P.x/cs), cy0 = Math.floor(P.y/cs), key = cx0 + ',' + cy0 + ',' + world.name; if (key === clutKey) return; clutKey = key; clutter = [];
  var rc = Math.ceil(QS.clutR/cs), A = world.areas, pick = {grass:['grass', 'grass_tall', 'flowers_y', 'flowers_p', 'grass'], park:['flowers_r', 'bush_small', 'grass', 'bush', 'flowers_y'], forest:FOREST_FLOOR}, SC = {};
  for (var cy = cy0 - rc; cy <= cy0 + rc; cy++) for (var cx = cx0 - rc; cx <= cx0 + rc; cx++) for (i = 0; i < 4; i++){
    var x = (cx + hash(cx, cy, 70 + i))*cs, y = (cy + hash(cx, cy, 80 + i))*cs, d = Math.hypot(x - P.x, y - P.y); if (d > QS.clutR) continue;
    var kind = coverKind(x, y);
    if (!kind || blocked(x, y) || inWater(x, y, 0.3) || (world.roadOk && !world.roadOk(x, y, 0.8))) continue;
    var pkk = cx + ':' + cy + ':' + i, pkt = world.edits.picked[pkk]; if (pkt !== undefined && time - pkt < REGROW) continue;
    var nm = pick[kind][Math.floor(hash(cx, cy, 90 + i)*pick[kind].length)], vr = Math.floor(hash(cx, cy, 97 + i)*3); var vn = vr && NAT[nm + (vr === 1 ? '_b' : '_c')] ? nm + (vr === 1 ? '_b' : '_c') : nm; clutter.push({plant:true, key:pkk, nm:nm, name:PNAME[nm], d:d, m:NAT[vn], x:x, y:y, gy:hAt(x, y), yw:hash(cx, cy, 95 + i)*6.283, sc:(SC[nm] || 1)*(0.75 + hash(cx, cy, 99 + i)*0.5)});
  }
  clutter.sort(function(a, b){ return a.d - b.d; }); clutter.length = Math.min(clutter.length, QS.clutN);
}
/* which small plants grow at a spot, from the ground cover: woodland, long grass, or mown lawn (bushes and flowers) */
function coverKind(x, y){
  var g = world.tg; if (!g) return null; var i = Math.round((x - g.x0)/g.cell), j = Math.round((y - g.y0)/g.cell); if (i < 0 || j < 0 || i >= g.cols || j >= g.rows) return null;
  var k = j*g.cols + i, o = k*6; if (g.td[k] >= 90) return 'forest'; if (g.c[o] > 120) return 'grass'; return hash(Math.round(x), Math.round(y), 61) < 0.5 ? 'park' : null;
}
function drawNature(){
  if (!NAT.pine || !natTex) return; var i;
  for (i = 0; i < hiTrees.length; i++){ var tr = hiTrees[i]; if (!tr.alive) continue; gl.uniform4f(U.inst, tr.x, hAt(tr.x, tr.y) - 0.1, tr.y, tr.yw); gl.uniform1f(U.iscl, tr.sc); drawMesh(NAT[treeVarKey(tr)] || NAT[treeKey(tr)]); }
  for (i = 0; i < clutter.length; i++){ var c = clutter[i]; gl.uniform4f(U.inst, c.x, c.gy, c.y, c.yw); gl.uniform1f(U.iscl, c.sc); drawMesh(c.m); }
  gl.uniform4f(U.inst, 0, 0, 0, 0); gl.uniform1f(U.iscl, 1);
}
var GSEA = [[0.98, 1.04, 0.94, 0], [1.03, 1.0, 0.86, 0], [1.1, 0.93, 0.72, 0], [0.9, 0.9, 0.9, 0.66]];
/* ================= the scene: sky, ground, buildings, trees, terrain =================
   drawScene draws everything that is part of the map, for any host page (the game, the Maps Builder). The host works out the camera and the
   light of the moment and passes them in; it then draws its own moving things (people, aliens, vehicles, effects) on top.
   cam: {e: eye [x,y,z], f, s, u: forward, side and up unit vectors, V: view matrix, Pm: projection matrix, cx, cy: the map point to draw around, tz: tan of half the vertical field of view}
   env: {hour: 0..24, wd: weather brightness 0.6..1, fl: lightning flash 0 or 0.5, wtype: weather 0 clear, 1 rain, 2 storm, 3 snow, 4 fog, dark: 0..1 night, grid: street lights on,
         season: 0..3, lightOn: flashlight on, lights: up to 8 near lights {x, y, lamp, gen, sl, eye, ey} nearest first, now: seconds} */
function drawScene(cam, env){
  var e = cam.e, f = cam.f, s = cam.s, u = cam.u, cx = cam.cx, cy = cam.cy, wd = env.wd, fl = env.fl, dark = env.dark, now = env.now, hour0 = env.hour, i;
  gl.viewport(0, 0, W, H);
  var md = moodAt(hour0), grey = function(c){ var g = (c[0] + c[1] + c[2])/3; return [g + (c[0] - g)*wd, g + (c[1] - g)*wd, g + (c[2] - g)*wd]; };
  md.hor = grey(md.hor); md.top = grey(md.top).map(function(v, j){ return v*(0.75 + 0.25*wd) + (md.hor[j] - v)*(1 - wd); }); var sky = [md.hor[0]*wd + fl, md.hor[1]*wd + fl, md.hor[2]*wd + fl];
  if (env.wtype === 4){ sky[0] = sky[0]*0.6 + 0.36*(1 - dark); sky[1] = sky[1]*0.6 + 0.36*(1 - dark); sky[2] = sky[2]*0.6 + 0.37*(1 - dark); }
  gl.uniform1i(U.atlas, 0); gl.uniform1i(U.atlas3, 2); gl.uniform1i(U.atlas4, 3); gl.uniform1i(U.atlas5, 4); gl.uniform1f(U.bldOn, bldTex ? 1 : 0); gl.uniform1f(U.tm, (performance.now()/1000) % 10000); gl.uniform1f(U.texOn, texReady ? 1 : 0);
  gl.clearColor(sky[0], sky[1], sky[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (!fl) drawSky({top:md.top, hor:sky, sun:md.sun}, f, s, u, hour0, dark, cam.tz);
  gl.uniform3fv(U.fogN, [md.fn, md.ff, md.fm]); gl.uniform3fv(U.sunc, md.sun); gl.uniform3fv(U.shd, md.shd); gl.uniform1f(U.winF, env.grid ? 0.35 : 0.04);
  gl.uniformMatrix4fv(U.vp, false, mul(cam.Pm, cam.V)); gl.uniform3fv(U.cam, e); gl.uniform3fv(U.fwd, f); gl.uniform3fv(U.sky, sky);
  var gs = GSEA[env.season]; gl.uniform4f(U.gsea, gs[0], gs[1], gs[2], gs[3]); gl.uniform1f(U.gridU, env.grid ? 1 : 0); gl.uniform1f(U.amb, (1 - 0.88*dark)*(0.55 + 0.45*wd) + fl); gl.uniform1f(U.dark, dark); gl.uniform1f(U.fogK, [0, 0.004, 0.007, 0.0008, 0.01][env.wtype]); gl.uniform2f(U.fade, QS.far*0.8, QS.far*1.02); gl.uniform1f(U.flash, env.lightOn ? 1 : 0);
  var fu = new Float32Array(32), fcl = new Float32Array(24), near = env.lights || [];
  for (i = 0; i < 8 && i < near.length; i++){ var lp = near[i].lamp; fu[i*4] = near[i].x; fu[i*4+1] = 0.6 + groundAt(near[i].x, near[i].y); fu[i*4+2] = near[i].y; fu[i*4+3] = near[i].gen ? 2.4 : lp ? 1.5 : 1.6 + 0.3*Math.sin(now*13 + i); if (near[i].gen){ var gb2 = buildingAt(near[i].x, near[i].y); fu[i*4+1] = (gb2 ? gb2.base || 0 : groundAt(near[i].x, near[i].y)) + 2.2; } fcl[i*3] = 1; fcl[i*3+1] = lp ? 0.9 : 0.6; fcl[i*3+2] = lp ? 0.68 : 0.25; if (near[i].sl){ fu[i*4+1] = groundAt(near[i].x, near[i].y) + 5; fu[i*4+3] = 2.2; fcl[i*3+1] = 0.77; fcl[i*3+2] = 0.47; if (hash(Math.round(near[i].x), Math.round(near[i].y), 23) < 0.12) fu[i*4+3] *= Math.sin(now*31) > 0.6 || Math.sin(now*3.7 + near[i].x) > 0.85 ? 0.12 : 1; }
    if (near[i].eye){ fu[i*4+1] = near[i].ey; fu[i*4+3] = 0.4; fcl[i*3] = 0.35; fcl[i*3+1] = 1; fcl[i*3+2] = 0.45; } }   /* street lights burn while the grid is up */
  gl.uniform3fv(U.fcol, fcl);
  gl.uniform4fv(U.fires, fu);
  /* ground paint (parks, sidewalks, roads) is drawn in painting order and nudged toward the eye, so far-off layers do not flicker */
  var GR = Math.min(QS.far, 800) + 130; gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1.5, -6); gl.depthFunc(gl.LEQUAL);
  for (i = 0; i < world.gl.ground.length; i++){ var gq = world.gl.ground[i]; if (Math.abs(gq.x - cx) < GR && Math.abs(gq.y - cy) < GR) drawMesh(gq.g); }
  gl.disable(gl.POLYGON_OFFSET_FILL); gl.depthFunc(gl.LESS);
  /* buildings: the detailed version near you, the plain version out to the draw distance */
  var NR = QS.chunk + CH, FRR = QS.far + CH;
  for (i = 0; i < world.gl.chunks.length; i++){
    var ch = world.gl.chunks[i], cdx = Math.abs(ch.x - cx), cdy = Math.abs(ch.y - cy);
    if (ch.g && cdx < NR && cdy < NR){ drawMesh(ch.g); if (cdx < 170 && cdy < 170) drawMesh(ch.l, gl.LINES); }
    else if (ch.far && cdx < FRR && cdy < FRR) drawMesh(ch.far);
  }
  if (world.gl.det) world.gl.det.forEach(function(o){ if (o.g && Math.abs(o.x - cx) < QS.clutR*0.8 + 10 + DT && Math.abs(o.y - cy) < QS.clutR*0.8 + 10 + DT) drawMesh(o.g); });
  if (world.gl.trees) world.gl.trees.forEach(function(o){ if (o.g && Math.abs(o.x - cx) < FRR + 130 && Math.abs(o.y - cy) < FRR + 130) drawMesh(o.g); });
  if (world.fence && Math.abs(world.fence.x - cx) < 400 && Math.abs(world.fence.y - cy) < 400) drawMesh(world.fence.g);
  for (i = 0; i < loaded.length; i++){ var gsI = loaded[i].int.gs; for (var gq = 0; gq < gsI.length; gq++) drawMesh(gsI[gq]); }
  for (i = 0; i < facs.length; i++) if (facs[i].fac) drawMesh(facs[i].fac);
  if (typeof dgPrep === 'function') dgPrep(cx, cy, U);
  var TR = world.gl.terr, trR = QS.far + (world.tg ? TT*world.tg.cell : 0); TR.forEach(function(o){ if (Math.abs(o.x - cx) < trR && Math.abs(o.y - cy) < trR) drawMesh(o.g); });
  if (typeof drawDig === 'function') drawDig(cx, cy);

  return {md:md, sky:sky};
}
