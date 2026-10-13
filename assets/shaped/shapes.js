/* Afterstreet shaped pieces: turns a list of pieces into flat-shaded triangles.
   No 3D library needed: the output is plain arrays the game's own WebGL code can upload.
   Used by the game and by every preview page in art-tests/, so both draw exactly the same thing.

   A piece:  { s: 'box' | 'bev' | 'wedge' | 'cyl',   shape
               p: [x, y, z],                           centre, metres (Y up, model faces +Z, its left is +X)
               d: [w, h, d],                           size along X, Y, Z before turning, metres
               c: 'name',                              colour name (pack palette) or slot (SKIN, SHIRT, ...; add _D for the darker shade)
               ry: 0-3,                                quarter turns about Y (optional)
               ax: 'x' | 'y' | 'z',                    tube axis for 'cyl' (default 'y')
               fy: true }                              wedge upside down (optional)
   'bev' is a box with 45-degree bevelled edges; 'wedge' rises from the front (-Z) to the back (+Z); 'cyl' has 8 flat sides.

   SHAPED.build(pieces, colourOf, out?) appends to out = {pos:[], nor:[], col:[]} and returns it.
   colourOf(name) must return [r, g, b] in 0-1 (sRGB). Triangle count per shape: box 12, bev 44, wedge 8, cyl 28. */
(function(){
  var S = (typeof window !== 'undefined' ? (window.SHAPED = window.SHAPED || {}) : (module.exports = {}));
  S.TRIS = {box:12, bev:44, wedge:8, cyl:28};

  function tri(o, a, b, c, ctr, cl){
    var ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2], vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
    var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
    var mx=(a[0]+b[0]+c[0])/3-ctr[0], my=(a[1]+b[1]+c[1])/3-ctr[1], mz=(a[2]+b[2]+c[2])/3-ctr[2];
    if (nx*mx+ny*my+nz*mz < 0){ var t=b; b=c; c=t; nx=-nx; ny=-ny; nz=-nz; }
    var l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1; nx/=l; ny/=l; nz/=l;
    o.p.push(a,b,c); o.n.push([nx,ny,nz],[nx,ny,nz],[nx,ny,nz]);
  }
  function poly(o, pts, ctr){ for (var i=1;i<pts.length-1;i++) tri(o, pts[0], pts[i], pts[i+1], ctr); }

  function shapeBox(o,w,h,d){
    var x=w/2,y=h/2,z=d/2, C=[0,0,0];
    poly(o,[[x,-y,-z],[x,y,-z],[x,y,z],[x,-y,z]],C); poly(o,[[-x,-y,-z],[-x,y,-z],[-x,y,z],[-x,-y,z]],C);
    poly(o,[[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]],C); poly(o,[[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]],C);
    poly(o,[[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],C); poly(o,[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z]],C);
  }
  function shapeBev(o,w,h,d){
    var r=Math.min(0.04, Math.min(w,h,d)*0.2), H=[w/2,h/2,d/2], C=[0,0,0];
    // point on face 'a' (0=x,1=y,2=z) at the corner with signs s
    function P(a,s){ var q=[0,0,0]; for (var i=0;i<3;i++) q[i]=s[i]*(i===a?H[i]:H[i]-r); return q; }
    var ord=[[-1,-1],[1,-1],[1,1],[-1,1]];
    for (var a=0;a<3;a++){ var b=(a+1)%3, c=(a+2)%3;
      for (var sa=-1; sa<=1; sa+=2){ var pts=[]; for (var k=0;k<4;k++){ var s=[0,0,0]; s[a]=sa; s[b]=ord[k][0]; s[c]=ord[k][1]; pts.push(P(a,s)); } poly(o,pts,C); } }
    for (var a2=0;a2<3;a2++){ var b2=(a2+1)%3, c2=(a2+2)%3;   // edge between faces a2 and b2, running along c2
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

  S.build = function(pieces, colourOf, out){
    out = out || {pos:[], nor:[], col:[]};
    for (var i=0;i<pieces.length;i++){
      var pc=pieces[i], o={p:[],n:[]}, w=pc.d[0], h=pc.d[1], d=pc.d[2];
      if (pc.s==='bev') shapeBev(o,w,h,d); else if (pc.s==='wedge') shapeWedge(o,w,h,d,pc.fy); else if (pc.s==='cyl') shapeCyl(o,w,h,d,pc.ax||'y'); else shapeBox(o,w,h,d);
      var k=((pc.ry||0)%4+4)%4, cl=colourOf(pc.c);
      for (var v=0; v<o.p.length; v++){
        var q=o.p[v], n=o.n[v], X=q[0], Z=q[2], NX=n[0], NZ=n[2];
        for (var r=0;r<k;r++){ var tx=X; X=Z; Z=-tx; var tn=NX; NX=NZ; NZ=-tn; }
        out.pos.push(X+pc.p[0], q[1]+pc.p[1], Z+pc.p[2]); out.nor.push(NX, n[1], NZ); out.col.push(cl[0], cl[1], cl[2]);
      }
    }
    return out;
  };
  S.count = function(pieces){ var t=0; for (var i=0;i<pieces.length;i++) t+=S.TRIS[pieces[i].s]||12; return t; };
  S.hex = function(h){ h=parseInt(String(h).replace('#',''),16); return [((h>>16)&255)/255, ((h>>8)&255)/255, (h&255)/255]; };
})();
