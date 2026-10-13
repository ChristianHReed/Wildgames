/* Afterstreet shaped pieces: turns a list of pieces into flat-shaded triangles.
   No 3D library needed: the output is plain arrays the game's own WebGL code can upload.
   Used by the game and by every preview page in art-tests/, so both draw exactly the same thing.
   Coordinates are metres. Y is up, models face +Z, a model's left is +X.

   Every piece has  s (shape), p [x,y,z] (where it sits), c (colour name or slot), and optionally ry (quarter turns about Y).
   Colours: a name from the pack palette, or a slot the player picks (SKIN, HAIR, SHIRT, PANTS, ACC).
   The pack explains suffixes such as _D (darker). colourOf() resolves them.

   Block shapes (size d [w,h,d] centred on p):
     'box'    plain box                                    12 triangles
     'bev'    box with 45-degree bevelled edges            44
     'wedge'  slope rising from front (-Z) to back (+Z); fy:true turns it upside down   8
     'cyl'    8-sided tube along ax ('x','y','z')          28
   Faceted shapes (the character style):
     'loft'   a faceted tube through rings.  r: [[x,y,z,a,b], ...] ring centres relative to p, with radii a and b.
              A ring may add two optional lists, one value per corner: [x,y,z,a,b, k, d].
              k scales each corner's distance from the centre (shaped cross-sections: a flat chest front, a jutting brow,
              a jaw corner); d moves each corner along the ring axis (sloping hems, jagged fringes). Use null to skip k.
              ax: ring axis 'y' (rings lie flat: a along X, b along Z), 'z' (a along X, b along Y), 'x' (a along Z, b along Y).
              n: sides (default 8), rot: degrees to turn the ring (default 180/n so a flat side faces front),
              ang: explicit list of corner angles in degrees (0 = +X or the first radius, 90 = the second), overrides n and rot.
              closed: false makes an open arc (only the faces between listed corners); caps: [start, end] (default true when closed).
              both: true draws both sides of an open arc; cin: colour of the inner side.
              triangles: closed n*(rings-1)*2 + caps*(n-2); open (corners-1)*(rings-1)*2, doubled when both.
     'decal'  one flat polygon, v: [[x,y,z], ...] relative to p, facing n: [nx,ny,nz]. Eyes, brows, lips, stripes.   corners-2
     'poly'   small solid from corners v and faces f: [[i,j,k,...], ...]; faces are turned to face away from its middle.

   SHAPED.build(pieces, colourOf, out?, opt?) appends to out = {pos:[], nor:[], col:[]} and returns it.
   colourOf(name) returns [r, g, b] in 0-1 (sRGB).
   opt.tone = {y0, y1, lo, hi, jitter} paints the soft character gradient into the colours: brightness goes from lo at
   height y0 to hi at y1, and each facet gets a fixed brightness change of up to +-jitter (so big planes don't look like
   plastic). opt.oy is added to heights first, for pieces that were moved next to their bone. A pack gives its values as 'tone'.
   SHAPED.count(pieces) gives the triangle count. SHAPED.scaleXZ(piece, bx, bz) returns a copy stretched across and front to back. */
(function(){
  var S = (typeof window !== 'undefined' ? (window.SHAPED = window.SHAPED || {}) : (module.exports = {}));
  S.TRIS = {box:12, bev:44, wedge:8, cyl:28};

  function tri(o, a, b, c, ctr, cl){
    var ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2], vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
    var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
    var mx=(a[0]+b[0]+c[0])/3-ctr[0], my=(a[1]+b[1]+c[1])/3-ctr[1], mz=(a[2]+b[2]+c[2])/3-ctr[2];
    if (nx*mx+ny*my+nz*mz < 0){ var t=b; b=c; c=t; nx=-nx; ny=-ny; nz=-nz; }
    var l=Math.sqrt(nx*nx+ny*ny+nz*nz); if (l<1e-12) return; nx/=l; ny/=l; nz/=l;
    o.p.push(a,b,c); o.n.push([nx,ny,nz],[nx,ny,nz],[nx,ny,nz]); o.c.push(cl||null,cl||null,cl||null);
  }
  function triFacing(o, a, b, c, nrm, cl){   // orient by a wanted direction instead of a centre
    tri(o, a, b, c, [ (a[0]+b[0]+c[0])/3-nrm[0], (a[1]+b[1]+c[1])/3-nrm[1], (a[2]+b[2]+c[2])/3-nrm[2] ], cl);
  }
  function poly(o, pts, ctr, cl){ for (var i=1;i<pts.length-1;i++) tri(o, pts[0], pts[i], pts[i+1], ctr, cl); }

  function shapeBox(o,w,h,d){
    var x=w/2,y=h/2,z=d/2, C=[0,0,0];
    poly(o,[[x,-y,-z],[x,y,-z],[x,y,z],[x,-y,z]],C); poly(o,[[-x,-y,-z],[-x,y,-z],[-x,y,z],[-x,-y,z]],C);
    poly(o,[[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]],C); poly(o,[[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]],C);
    poly(o,[[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],C); poly(o,[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z]],C);
  }
  function shapeBev(o,w,h,d){
    var r=Math.min(0.04, Math.min(w,h,d)*0.2), H=[w/2,h/2,d/2], C=[0,0,0];
    function P(a,s){ var q=[0,0,0]; for (var i=0;i<3;i++) q[i]=s[i]*(i===a?H[i]:H[i]-r); return q; }
    var ord=[[-1,-1],[1,-1],[1,1],[-1,1]];
    for (var a=0;a<3;a++){ var b=(a+1)%3, c=(a+2)%3;
      for (var sa=-1; sa<=1; sa+=2){ var pts=[]; for (var k=0;k<4;k++){ var s=[0,0,0]; s[a]=sa; s[b]=ord[k][0]; s[c]=ord[k][1]; pts.push(P(a,s)); } poly(o,pts,C); } }
    for (var a2=0;a2<3;a2++){ var b2=(a2+1)%3, c2=(a2+2)%3;
      for (var s1=-1;s1<=1;s1+=2) for (var s2=-1;s2<=1;s2+=2){
        var lo=[0,0,0], hi=[0,0,0]; lo[a2]=s1; lo[b2]=s2; lo[c2]=-1; hi[a2]=s1; hi[b2]=s2; hi[c2]=1;
        poly(o,[P(a2,lo),P(b2,lo),P(b2,hi),P(a2,hi)],C); } }
    for (var sx=-1;sx<=1;sx+=2) for (var sy=-1;sy<=1;sy+=2) for (var sz=-1;sz<=1;sz+=2){ var s3=[sx,sy,sz]; tri(o,P(0,s3),P(1,s3),P(2,s3),C); }
  }
  function shapeWedge(o,w,h,d,fy){
    var f=fy?-1:1, x=w/2, y=h/2*f, z=d/2;
    var b0=[-x,-y,-z], b1=[x,-y,-z], b2=[x,-y,z], b3=[-x,-y,z], t0=[-x,y,z], t1=[x,y,z];
    var C=[0,-y/3,z/3];
    poly(o,[b0,b1,b2,b3],C); poly(o,[b3,b2,t1,t0],C); poly(o,[b0,b1,t1,t0],C); tri(o,b0,b3,t0,C); tri(o,b1,b2,t1,C);
  }
  function shapeCyl(o,w,h,d,ax){
    var r0=[], r1=[], C=[0,0,0];
    for (var k=0;k<8;k++){
      var t=Math.PI/8+k*Math.PI/4, cs=Math.cos(t)/2, sn=Math.sin(t)/2;
      if (ax==='x'){ r0.push([-w/2,cs*h,sn*d]); r1.push([w/2,cs*h,sn*d]); }
      else if (ax==='z'){ r0.push([cs*w,sn*h,-d/2]); r1.push([cs*w,sn*h,d/2]); }
      else { r0.push([cs*w,-h/2,sn*d]); r1.push([cs*w,h/2,sn*d]); }
    }
    for (var i=0;i<8;i++){ var j=(i+1)%8; poly(o,[r0[i],r0[j],r1[j],r1[i]],C); }
    poly(o,r0,C); poly(o,r1,C);
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
        poly(o,q,ctr);
        if (!closed && pc.both){   // inner side, turned towards the middle
          var m=[(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2,(q[0][2]+q[2][2])/2], away=[2*m[0]-ctr[0],2*m[1]-ctr[1],2*m[2]-ctr[2]];
          poly(o,q,away,inner); }
      }
    }
    var caps=pc.caps||[closed,closed];
    if (closed && rings.length>1){
      if (caps[0]) poly(o,rings[0],[R[1][0],R[1][1],R[1][2]]);
      if (caps[1]){ var L=rings.length-1; poly(o,rings[L],[R[L-1][0],R[L-1][1],R[L-1][2]]); }
    }
  }
  function shapeDecal(o, pc){
    var v=pc.v, n=pc.n||[0,0,1];
    for (var i=1;i<v.length-1;i++) triFacing(o, v[0], v[i], v[i+1], n);
  }
  function shapePoly(o, pc){
    var v=pc.v, c=[0,0,0];
    for (var i=0;i<v.length;i++){ c[0]+=v[i][0]/v.length; c[1]+=v[i][1]/v.length; c[2]+=v[i][2]/v.length; }
    for (var f=0; f<pc.f.length; f++){ var pts=pc.f[f].map(function(k){ return v[k]; }); poly(o,pts,c); }
  }

  function hash3(x,y,z){ var h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453; return (h-Math.floor(h))*2-1; }
  S.build = function(pieces, colourOf, out, opt){
    out = out || {pos:[], nor:[], col:[]};
    var tn = opt && opt.tone, oy = (opt && opt.oy) || 0;
    for (var i=0;i<pieces.length;i++){
      var pc=pieces[i], o={p:[],n:[],c:[]};
      if (pc.s==='loft') shapeLoft(o,pc,pc.cin||null);
      else if (pc.s==='decal') shapeDecal(o,pc);
      else if (pc.s==='poly') shapePoly(o,pc);
      else { var w=pc.d[0], h=pc.d[1], d=pc.d[2];
        if (pc.s==='bev') shapeBev(o,w,h,d); else if (pc.s==='wedge') shapeWedge(o,w,h,d,pc.fy); else if (pc.s==='cyl') shapeCyl(o,w,h,d,pc.ax||'y'); else shapeBox(o,w,h,d); }
      var k=((pc.ry||0)%4+4)%4, cl=colourOf(pc.c), cache={};
      for (var v=0; v<o.p.length; v++){
        var q=o.p[v], n=o.n[v], X=q[0], Z=q[2], NX=n[0], NZ=n[2];
        for (var r=0;r<k;r++){ var tx=X; X=Z; Z=-tx; var tn=NX; NX=NZ; NZ=-tn; }
        var cv=cl; if (o.c[v]){ cv=cache[o.c[v]]||(cache[o.c[v]]=colourOf(o.c[v])); }
        var px=X+pc.p[0], py=q[1]+pc.p[1], pz=Z+pc.p[2];
        out.pos.push(px, py, pz); out.nor.push(NX, n[1], NZ);
        if (tn){
          if (v%3===0){   // one random brightness per facet, from its middle in model space
            var t0=o.p[v], t1=o.p[v+1], t2=o.p[v+2];
            var fj=1+(tn.jitter||0)*hash3((t0[0]+t1[0]+t2[0])/3+pc.p[0], (t0[1]+t1[1]+t2[1])/3+pc.p[1]+oy, (t0[2]+t1[2]+t2[2])/3+pc.p[2]);
          }
          var f=Math.min(1,Math.max(0,(py+oy-tn.y0)/(tn.y1-tn.y0))), m=(tn.lo+(tn.hi-tn.lo)*f)*fj;
          out.col.push(Math.min(1,cv[0]*m), Math.min(1,cv[1]*m), Math.min(1,cv[2]*m));
        } else out.col.push(cv[0], cv[1], cv[2]);
      }
    }
    return out;
  };
  S.count = function(pieces){
    var t=0;
    for (var i=0;i<pieces.length;i++){ var pc=pieces[i];
      if (pc.s==='loft'){ var A=pc.ang?pc.ang.length:(pc.n||8), R=pc.r.length, closed=pc.closed!==false;
        if (closed){ var caps=pc.caps||[true,true]; t+=A*(R-1)*2+((caps[0]?1:0)+(caps[1]?1:0))*(A-2); }
        else t+=(A-1)*(R-1)*2*(pc.both?2:1); }
      else if (pc.s==='decal') t+=pc.v.length-2;
      else if (pc.s==='poly'){ for (var f=0;f<pc.f.length;f++) t+=pc.f[f].length-2; }
      else t+=S.TRIS[pc.s]||12;
    }
    return t;
  };
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
