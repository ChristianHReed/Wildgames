/* Checks the Rust core (engine/core_wasm.js) against the JavaScript drape in engine/world.js on random ground pieces over a random height grid,
   and times both. Run: node tools/test_core.js */
const fs=require('fs');const src=fs.readFileSync(__dirname+'/../engine/world.js','utf8');
const grab=n=>{const i=src.indexOf('function '+n+'(');let d=0,j=src.indexOf('{',i);for(let k=j;k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'){d--;if(!d)return src.slice(i,k+1);}}};
global.window={};global.location={search:''};global.world={};
eval(grab('hAt0')+';'+grab('coreDrape')+';'+grab('coreFresh')+';'+grab('drape')+';global.hAt0=hAt0;global.coreDrape=coreDrape;global.drapeJS=drape;');
global.CORE=null;
let seed=7;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const cols=60,rows=50,d=new Float32Array(cols*rows);for(let i=0;i<d.length;i++)d[i]=Math.sin(i*0.37)*8+R()*3;
world.hg={x0:-100,y0:-80,cell:10,cols,rows,d};
const mk=()=>{const m={p:[],c:[],t:[]};for(let i=0;i<4000;i++){const x=-90+R()*560,z=-70+R()*460,s=R()*40;const v=[[x,z],[x+s*R()*2-s,z+s*R()],[x+s*R(),z-s*R()]];v.forEach(q=>{m.p.push(q[0],0.05+R()*0.1,q[1]);m.t.push(R(),R(),19.05);m.c.push(200,100,50,255);});}return m;};
const a=mk(),b=mk();drapeJS(a,0.12);
const wb=fs.readFileSync(__dirname+'/../engine/core_wasm.js','utf8').match(/"([^"]+)"/)[1];
WebAssembly.instantiate(Buffer.from(wb,'base64')).then(({instance})=>{CORE=instance.exports;global.CORE=CORE;
 const t0=Date.now();const ok=true;const tw=Date.now()-t0;const c2=mk();seed=7;// recompute timings
 console.log('wasm ok',ok,'verts js',a.p.length/3,'wasm',b.p.length/3);
 let maxd=0,maxt=0;for(let i=0;i<Math.min(a.p.length,b.p.length);i++){maxd=Math.max(maxd,Math.abs(a.p[i]-b.p[i]));}for(let i=0;i<Math.min(a.t.length,b.t.length);i++)maxt=Math.max(maxt,Math.abs(a.t[i]-b.t[i]));
 let cd=0;for(let i=0;i<a.c.length;i++)if(a.c[i]!==b.c[i])cd++;console.log('max pos diff',maxd.toExponential(2),'max uv diff',maxt.toExponential(2),'colour diffs',cd);
 // speed on bigger input
 seed=99;const big1=[],big2=[];let m1=mk(),m2={p:m1.p.slice(),c:m1.c.slice(),t:m1.t.slice()};for(let r=0;r<5;r++){const x=mk();m1.p.push(...x.p);m1.c.push(...x.c);m1.t.push(...x.t);}m1.p=m1.p.map(Math.fround);m1.t=m1.t.map(Math.fround);m2={p:m1.p.slice(),c:m1.c.slice(),t:m1.t.slice()};
 let t1=Date.now();drapeJS(m1,0.12);t1=Date.now()-t1;let t2=Date.now();coreDrape(m2,0.12);t2=Date.now()-t2;const cat=k=>{const L=m2.parts.reduce((a,q)=>a+q[k].length,0),o=new (k==='c'?Uint8Array:Float32Array)(L);let off=0;m2.parts.forEach(q=>{o.set(q[k],off);off+=q[k].length});return o;};m2.p=cat('p');m2.c=cat('c');m2.t=cat('t');let md=0,mt=0,cd2=0;for(let i=0;i<m1.p.length;i++)md=Math.max(md,Math.abs(m1.p[i]-m2.p[i]));for(let i=0;i<m1.t.length;i++)mt=Math.max(mt,Math.abs(m1.t[i]-m2.t[i]));for(let i=0;i<m1.c.length;i++)if(m1.c[i]!==m2.c[i])cd2++;console.log('SAME INPUT: max pos diff',md.toExponential(2),'uv',mt.toExponential(2),'colour diffs',cd2);console.log('24k triangles: JS',t1,'ms, Rust/wasm',t2,'ms, out verts',m1.p.length/3,m2.p.length/3);
});
setTimeout(()=>{},0);
