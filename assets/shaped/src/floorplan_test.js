// Runs the floor-plan generator over many footprints and storeys and fails if any room cannot be reached. node assets/shaped/src/floorplan_test.js
const F=require('../floorplan.js');
let bad=0,n=0,t0=Date.now(); const fails={};
for (const k of F.kinds) for (let w=5; w<=50; w+=9.5) for (let d=5; d<=36; d+=6.5) for (const st of [1,2,3]) { const seed=(w*7+d*3+st)|0;
  const p=F.gen(k,w,d,{seed,storeys:st}); const r=F.check(p); n++; if(!r.ok){ bad++; (fails[k]=fails[k]||[]).push([w,d,st,r.errors[0]]); } }
console.log(n,'plans',bad,'bad',(Date.now()-t0)/1000+'s'); for (const k in fails) console.log(k,fails[k].length,JSON.stringify(fails[k].slice(0,3)));
process.exit(bad?1:0);
