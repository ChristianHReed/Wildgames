export class OrbitControls { constructor(cam){ this.cam=cam; const t={x:0,y:0,z:0,set(a,b,c){t.x=a;t.y=b;t.z=c;return t;}}; this.target=t; this.enableDamping=false; }
  update(){ this.cam.lookAt(this.target.x,this.target.y,this.target.z); } }
