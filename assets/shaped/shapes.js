/* Afterstreet shaped pieces: turns a list of pieces into flat-shaded meshes.
   No 3D library needed: the output is plain arrays the game's own WebGL code can upload.
   Used by the game and by every preview page in art-tests/, so both draw exactly the same thing.
   Coordinates are metres. Y is up, models face +Z, a model's left is +X.

   Every piece has  s (shape), p [x,y,z] (where it sits), c (colour name or slot), and optionally ry (quarter turns about Y)
   and glow: true (drawn without lighting: lamps, lit windows, alien eyes).
   Colours: a name from the pack palette, or a slot the player picks (SKIN, HAIR, SHIRT, PANTS, ACC).
   The pack explains suffixes such as _D (darker). colourOf() resolves them.

   Block shapes (size d [w,h,d] centred on p):
     'box'    plain box                                    12 triangles, 24 vertices indexed
     'bev'    box with 45-degree bevelled edges            44
     'wedge'  slope rising from front (-Z) to back (+Z); fy:true turns it upside down   8
     'cyl'    8-sided tube along ax ('x','y','z')          28
   Faceted shapes:
     'loft'   a faceted tube through rings.  r: [[x,y,z,a,b], ...] ring centres relative to p, with radii a and b.
              A ring may add two optional lists, one value per corner: [x,y,z,a,b, k, d].
              k scales each corner's distance from the centre (shaped cross-sections: a flat chest front, a jutting brow,
              a jaw corner); d moves each corner along the ring axis (sloping hems, jagged fringes). Use null to skip k.
              A ring with a = b = 0 is a point: the tube ends in a tip (tapering arms, claws, spikes).
              ax: ring axis 'y' (rings lie flat: a along X, b along Z), 'z' (a along X, b along Y), 'x' (a along Z, b along Y).
              n: sides (default 8), rot: degrees to turn the ring (default 180/n so a flat side faces front),
              ang: explicit list of corner angles in degrees (0 = +X or the first radius, 90 = the second), overrides n and rot.
              closed: false makes an open arc (only the faces between listed corners); caps: [start, end] (default true when closed).
              both: true draws both sides of an open arc; cin: colour of the inner side.
     'decal'  one flat polygon, v: [[x,y,z], ...] relative to p, facing n: [nx,ny,nz]. Eyes, brows, stripes.
              both: true draws the back too (fletching, flags, thin sheets seen from either side).
     'poly'   small solid from corners v and faces f: [[i,j,k,...], ...]; faces are turned to face away from its middle.

   Two ways to build, same picture:
   SHAPED.build(pieces, colourOf, out?, opt?)         every triangle has its own three corners: {pos, nor, col}.
   SHAPED.buildIndexed(pieces, colourOf, out?, opt?)  each flat face keeps one set of corners that its triangles share:
              {pos, nor, col, idx}. A quad needs 4 vertices instead of 6, an 8-sided cap 8 instead of 18.
              With opt.splitGlow, pieces marked glow:true go to out.glow (another {pos, nor, col, idx}).
   colourOf(name) returns [r, g, b] in 0-1 (sRGB).
   opt.tone = {y0, y1, lo, hi, jitter} paints the soft gradient into the colours: brightness goes from lo at height y0
   to hi at y1, and each face gets a fixed brightness change of up to +-jitter. opt.oy is added to heights first,
   for pieces that were moved next to their bone. A pack gives its values as 'tone'.

   SHAPED.weld(mesh) merges corners that share a position and colour in a buildIndexed mesh and drops the normals: the
              fewest vertices, for a shader that works out each face's normal itself (normalize(cross(dFdx(p), dFdy(p))),
              core in WebGL2, OES_standard_derivatives in WebGL1). Typically half the vertices of buildIndexed again.
   SHAPED.count(pieces) gives the triangle count, SHAPED.countVerts(pieces) the vertices buildIndexed makes.
   SHAPED.scaleXZ(piece, bx, bz) returns a copy stretched across and front to back. */
(function(){
  var S = (typeof window !== 'undefined' ? (window.SHAPED = window.SHAPED || {}) : (module.exports = {}));
  S.TRIS = {box:12, bev:44, wedge:8, cyl:28};

  /* every shape is made of flat faces: {p:[corners], n:normal, c:colour or null} */
  function face(o, pts, ctr, cl){
    var nx=0, ny=0, nz=0, k, q;
    for (k=0;k<pts.length;k++){ var a=pts[k], b=pts[(k+1)%pts.length]; nx+=(a[1]-b[1])*(a[2]+b[2]); ny+=(a[2]-b[2])*(a[0]+b[0]); nz+=(a[0]-b[0])*(a[1]+b[1]); }
    var l=Math.sqrt(nx*nx+ny*ny+nz*nz); if (l<1e-12) return;
    nx/=l; ny/=l; nz/=l;
    var mx=0,my=0,mz=0; for (k=0;k<pts.length;k++){ mx+=pts[k][0]; my+=pts[k][1]; mz+=pts[k][2]; }
    mx=mx/pts.length-ctr[0]; my=my/pts.length-ctr[1]; mz=mz/pts.length-ctr[2];
    // Newell's normal follows the corner order; turn the face so it looks away from ctr
    if (nx*mx+ny*my+nz*mz < 0){ q=pts.slice().reverse(); nx=-nx; ny=-ny; nz=-nz; } else q=pts;
    // drop repeated corners (a tube tapering to a tip makes them)
    var u=[]; for (k=0;k<q.length;k++){ var p=q[k], r=u[u.length-1]; if (!r || Math.abs(p[0]-r[0])+Math.abs(p[1]-r[1])+Math.abs(p[2]-r[2])>1e-7) u.push(p); }
    if (u.length>2){ var f=u[0], e=u[u.length-1]; if (Math.abs(f[0]-e[0])+Math.abs(f[1]-e[1])+Math.abs(f[2]-e[2])<=1e-7) u.pop(); }
    if (u.length<3) return;
    o.push({p:u, n:[nx,ny,nz], c:cl||null});
  }
  function faceFacing(o, pts, nrm, cl){
    var m=[0,0,0]; for (var k=0;k<pts.length;k++){ m[0]+=pts[k][0]/pts.length; m[1]+=pts[k][1]/pts.length; m[2]+=pts[k][2]/pts.length; }
    face(o, pts, [m[0]-nrm[0], m[1]-nrm[1], m[2]-nrm[2]], cl);
  }
  function planar(q){
    if (q.length<4) return true;
    var a=q[0], b=q[1], c=q[2], ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2], vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
    var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx, l=Math.sqrt(nx*nx+ny*ny+nz*nz);
    if (l<1e-12) return false;
    for (var i=3;i<q.length;i++){ var d=((q[i][0]-a[0])*nx+(q[i][1]-a[1])*ny+(q[i][2]-a[2])*nz)/l; if (Math.abs(d)>1e-4) return false; }
    return true;
  }
  function flatFace(o, pts, ctr, cl){   // a face that may not be flat is split into flat triangles
    if (planar(pts)) face(o, pts, ctr, cl); else for (var i=1;i<pts.length-1;i++) face(o,[pts[0],pts[i],pts[i+1]],ctr,cl);
  }

  function shapeBox(o,w,h,d){
    var x=w/2,y=h/2,z=d/2, C=[0,0,0];
    face(o,[[x,-y,-z],[x,y,-z],[x,y,z],[x,-y,z]],C); face(o,[[-x,-y,-z],[-x,y,-z],[-x,y,z],[-x,-y,z]],C);
    face(o,[[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]],C); face(o,[[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]],C);
    face(o,[[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],C); face(o,[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z]],C);
  }
  function shapeBev(o,w,h,d){
    var r=Math.min(0.04, Math.min(w,h,d)*0.2), H=[w/2,h/2,d/2], C=[0,0,0];
    function P(a,s){ var q=[0,0,0]; for (var i=0;i<3;i++) q[i]=s[i]*(i===a?H[i]:H[i]-r); return q; }
    var ord=[[-1,-1],[1,-1],[1,1],[-1,1]];
    for (var a=0;a<3;a++){ var b=(a+1)%3, c=(a+2)%3;
      for (var sa=-1; sa<=1; sa+=2){ var pts=[]; for (var k=0;k<4;k++){ var s=[0,0,0]; s[a]=sa; s[b]=ord[k][0]; s[c]=ord[k][1]; pts.push(P(a,s)); } face(o,pts,C); } }
    for (var a2=0;a2<3;a2++){ var b2=(a2+1)%3, c2=(a2+2)%3;
      for (var s1=-1;s1<=1;s1+=2) for (var s2=-1;s2<=1;s2+=2){
        var lo=[0,0,0], hi=[0,0,0]; lo[a2]=s1; lo[b2]=s2; lo[c2]=-1; hi[a2]=s1; hi[b2]=s2; hi[c2]=1;
        face(o,[P(a2,lo),P(b2,lo),P(b2,hi),P(a2,hi)],C); } }
    for (var sx=-1;sx<=1;sx+=2) for (var sy=-1;sy<=1;sy+=2) for (var sz=-1;sz<=1;sz+=2){ var s3=[sx,sy,sz]; face(o,[P(0,s3),P(1,s3),P(2,s3)],C); }
  }
  function shapeWedge(o,w,h,d,fy){
    var f=fy?-1:1, x=w/2, y=h/2*f, z=d/2;
    var b0=[-x,-y,-z], b1=[x,-y,-z], b2=[x,-y,z], b3=[-x,-y,z], t0=[-x,y,z], t1=[x,y,z];
    var C=[0,-y/3,z/3];
    face(o,[b0,b1,b2,b3],C); face(o,[b3,b2,t1,t0],C); face(o,[b0,b1,t1,t0],C); face(o,[b0,b3,t0],C); face(o,[b1,b2,t1],C);
  }
  function shapeCyl(o,w,h,d,ax){
    var r0=[], r1=[], C=[0,0,0];
    for (var k=0;k<8;k++){
      var t=Math.PI/8+k*Math.PI/4, cs=Math.cos(t)/2, sn=Math.sin(t)/2;
      if (ax==='x'){ r0.push([-w/2,cs*h,sn*d]); r1.push([w/2,cs*h,sn*d]); }
      else if (ax==='z'){ r0.push([cs*w,sn*h,-d/2]); r1.push([cs*w,sn*h,d/2]); }
      else { r0.push([cs*w,-h/2,sn*d]); r1.push([cs*w,h/2,sn*d]); }
    }
    for (var i=0;i<8;i++){ var j=(i+1)%8; face(o,[r0[i],r0[j],r1[j],r1[i]],C); }
    face(o,r0,C); face(o,r1,C);
  }
  function angles(pc){
    if (pc.ang) return pc.ang;
    var n=pc.n||8, rot=(pc.rot!=null?pc.rot:180/n), out=[];
    for (var k=0;k<n;k++) out.push(rot+k*360/n);
    return out;
  }
  function ringPoint(ax, ctr, a, b, deg, k, d){
    var t=deg*Math.PI/180, c=Math.cos(t)*a*k, s=Math.sin(t)*b*k;
    if (ax==='z') return [ctr[0]+c, ctr[1]+s, ctr[2]+d];
    if (ax==='x') return [ctr[0]+d, ctr[1]+s, ctr[2]+c];
    return [ctr[0]+c, ctr[1]+d, ctr[2]+s];
  }
  function per(v, k, dflt){ if (v==null) return dflt; return typeof v==='number' ? v : (v[k]!=null ? v[k] : dflt); }
  function shapeLoft(o, pc, inner){
    var A=angles(pc), ax=pc.ax||'y', closed=pc.closed!==false, R=pc.r, rings=[];
    for (var i=0;i<R.length;i++){ var row=[]; for (var k=0;k<A.length;k++) row.push(ringPoint(ax,[R[i][0],R[i][1],R[i][2]],R[i][3],R[i][4],A[k],per(R[i][5],k,1),per(R[i][6],k,0))); rings.push(row); }
    var K=closed?A.length:A.length-1;
    for (var i2=0;i2<rings.length-1;i2++){
      var c0=[R[i2][0],R[i2][1],R[i2][2]], c1=[R[i2+1][0],R[i2+1][1],R[i2+1][2]], ctr=[(c0[0]+c1[0])/2,(c0[1]+c1[1])/2,(c0[2]+c1[2])/2];
      for (var k2=0;k2<K;k2++){
        var j=(k2+1)%A.length, q=[rings[i2][k2],rings[i2][j],rings[i2+1][j],rings[i2+1][k2]];
        if (closed) flatFace(o,q,ctr);
        else {   // open shells: the outer side faces away from the axis
          var m=[(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2,(q[0][2]+q[2][2])/2];
          flatFace(o,q,ctr);
          if (pc.both){ var away=[2*m[0]-ctr[0],2*m[1]-ctr[1],2*m[2]-ctr[2]]; flatFace(o,q,away,inner); }
        }
      }
    }
    var caps=pc.caps||[closed,closed];
    if (closed && rings.length>1){
      if (caps[0]) flatFace(o,rings[0],[R[1][0],R[1][1],R[1][2]]);
      if (caps[1]){ var L=rings.length-1; flatFace(o,rings[L],[R[L-1][0],R[L-1][1],R[L-1][2]]); }
    }
  }
  function shapeDecal(o, pc){ var n=pc.n||[0,0,1]; faceFacing(o, pc.v, n); if (pc.both) faceFacing(o, pc.v, [-n[0],-n[1],-n[2]]); }
  function shapePoly(o, pc){
    var v=pc.v, c=[0,0,0];
    for (var i=0;i<v.length;i++){ c[0]+=v[i][0]/v.length; c[1]+=v[i][1]/v.length; c[2]+=v[i][2]/v.length; }
    for (var f=0; f<pc.f.length; f++) flatFace(o, pc.f[f].map(function(k){ return v[k]; }), c);
  }
  function faces(pc){
    var o=[];
    if (pc.s==='loft') shapeLoft(o,pc,pc.cin||null);
    else if (pc.s==='decal') shapeDecal(o,pc);
    else if (pc.s==='poly') shapePoly(o,pc);
    else { var w=pc.d[0], h=pc.d[1], d=pc.d[2];
      if (pc.s==='bev') shapeBev(o,w,h,d); else if (pc.s==='wedge') shapeWedge(o,w,h,d,pc.fy); else if (pc.s==='cyl') shapeCyl(o,w,h,d,pc.ax||'y'); else shapeBox(o,w,h,d); }
    return o;
  }
  function hash3(x,y,z){ var h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453; return (h-Math.floor(h))*2-1; }
  /* walk every face of every piece in model space, colours already toned */
  function each(pieces, colourOf, opt, fn){
    var tn=opt && opt.tone, oy=(opt && opt.oy)||0;
    for (var i=0;i<pieces.length;i++){
      var pc=pieces[i], F=faces(pc), k=((pc.ry||0)%4+4)%4, base=colourOf(pc.c), cache={};
      for (var f=0; f<F.length; f++){
        var fc=F[f], pts=[], n=fc.n.slice(), m=[0,0,0];
        for (var r=0;r<k;r++){ var t0=n[0]; n[0]=n[2]; n[2]=-t0; }
        for (var v=0; v<fc.p.length; v++){
          var X=fc.p[v][0], Z=fc.p[v][2];
          for (var r2=0;r2<k;r2++){ var tx=X; X=Z; Z=-tx; }
          var q=[X+pc.p[0], fc.p[v][1]+pc.p[1], Z+pc.p[2]]; pts.push(q); m[0]+=q[0]; m[1]+=q[1]; m[2]+=q[2];
        }
        var cv=base; if (fc.c){ cv=cache[fc.c]||(cache[fc.c]=colourOf(fc.c)); }
        var cols;
        if (tn && !pc.glow){
          var fj=1+(tn.jitter||0)*hash3(m[0]/pts.length, m[1]/pts.length+oy, m[2]/pts.length);
          cols=pts.map(function(q){ var t=Math.min(1,Math.max(0,(q[1]+oy-tn.y0)/(tn.y1-tn.y0))), s=(tn.lo+(tn.hi-tn.lo)*t)*fj; return [Math.min(1,cv[0]*s), Math.min(1,cv[1]*s), Math.min(1,cv[2]*s)]; });
        } else cols=pts.map(function(){ return cv; });
        fn(pts, n, cols, pc);
      }
    }
  }
  S.build = function(pieces, colourOf, out, opt){
    out = out || {pos:[], nor:[], col:[]};
    each(pieces, colourOf, opt, function(pts, n, cols){
      for (var i=1;i<pts.length-1;i++){ var t=[0,i,i+1];
        for (var j=0;j<3;j++){ var q=pts[t[j]], c=cols[t[j]]; out.pos.push(q[0],q[1],q[2]); out.nor.push(n[0],n[1],n[2]); out.col.push(c[0],c[1],c[2]); } }
    });
    return out;
  };
  S.buildIndexed = function(pieces, colourOf, out, opt){
    out = out || {pos:[], nor:[], col:[], idx:[]};
    if (opt && opt.splitGlow && !out.glow) out.glow = {pos:[], nor:[], col:[], idx:[]};
    each(pieces, colourOf, opt, function(pts, n, cols, pc){
      var o=(pc.glow && out.glow) ? out.glow : out, b=o.pos.length/3;
      for (var j=0;j<pts.length;j++){ o.pos.push(pts[j][0],pts[j][1],pts[j][2]); o.nor.push(n[0],n[1],n[2]); o.col.push(cols[j][0],cols[j][1],cols[j][2]); }
      for (var i=1;i<pts.length-1;i++) o.idx.push(b, b+i, b+i+1);
    });
    return out;
  };
  S.weld = function(m){
    var map={}, pos=[], col=[], idx=[], i;
    for (i=0;i<m.pos.length/3;i++){
      var key=Math.round(m.pos[i*3]*2000)+','+Math.round(m.pos[i*3+1]*2000)+','+Math.round(m.pos[i*3+2]*2000)+','+Math.round(m.col[i*3]*255)+','+Math.round(m.col[i*3+1]*255)+','+Math.round(m.col[i*3+2]*255);
      if (map[key]==null){ map[key]=pos.length/3; pos.push(m.pos[i*3],m.pos[i*3+1],m.pos[i*3+2]); col.push(m.col[i*3],m.col[i*3+1],m.col[i*3+2]); }
      m.__r = m.__r || []; m.__r[i]=map[key];
    }
    for (i=0;i<m.idx.length;i++) idx.push(m.__r[m.idx[i]]);
    delete m.__r;
    return {pos:pos, col:col, idx:idx};
  };
  var ONE=function(){ return [1,1,1]; };
  S.count = function(pieces){ var t=0; each(pieces, ONE, null, function(p){ t+=p.length-2; }); return t; };
  S.countVerts = function(pieces){ var v=0; each(pieces, ONE, null, function(p){ v+=p.length; }); return v; };
  S.scaleXZ = function(pc, bx, bz){
    var q={}; for (var k in pc) q[k]=pc[k];
    q.p=[pc.p[0]*bx, pc.p[1], pc.p[2]*bz];
    if (pc.d) q.d=[pc.d[0]*bx, pc.d[1], pc.d[2]*bz];
    if (pc.v) q.v=pc.v.map(function(v){ return [v[0]*bx, v[1], v[2]*bz]; });
    if (pc.r){ var ax=pc.ax||'y';
      q.r=pc.r.map(function(r){ var o=[r[0]*bx, r[1], r[2]*bz, r[3]*(ax==='x'?bz:bx), r[4]*(ax==='y'?bz:1)]; if (r.length>5) o.push(r[5]); if (r.length>6) o.push(r[6]); return o; }); }
    return q;
  };
  S.hex = function(h){ h=parseInt(String(h).replace('#',''),16); return [((h>>16)&255)/255, ((h>>8)&255)/255, (h&255)/255]; };
})();
