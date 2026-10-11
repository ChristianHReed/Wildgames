
var INK='#3d3029',CR='#f5ead8',PA='#fff8ee',SAND='#ebddc5',WD='#c99a62',WDD='#a2733f',CL='#c67139',CLD='#9a5226',SG='#7a8a5e',SGL='#a9b78c',SGD='#56643f',OC='#d9a845',RV='#5f8a9a',RVL='#9cc0c9',PL='#8a6a8a',MT='#8f99a0',MTL='#c9d0d3',GR='#b8b0a2';
var hex=function(h){return [1,3,5].map(function(i){return parseInt(h.slice(i,i+2),16)});};
var mix=function(a,b,t){var A=hex(a),B=hex(b);return '#'+A.map(function(v,i){return Math.max(0,Math.min(255,Math.round(v+(B[i]-v)*t))).toString(16).padStart(2,'0')}).join('');};
var sh=function(c,t){return mix(c,'#5b2f3a',t==null?.28:t);};
var tn=function(c,t){return mix(c,'#fff6e0',t==null?.3:t);};
var seed=11;var rnd=function(){seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
var rr=function(a,b){return a+(b-a)*rnd();};
var pick=function(a){return a[Math.floor(rnd()*a.length)];};
var mk=function(w,h){var c=createCanvas(w,h);return {c:c,g:c.getContext('2d'),w:w,h:h};};
var tile9=function(t,x,y,fn){for(var i=-1;i<=1;i++)for(var j=-1;j<=1;j++)fn(x+i*t.w,y+j*t.h);};
var speckle=function(t,n,r0,r1,cols,a){var g=t.g;for(var k=0;k<n;k++){var x=rnd()*t.w,y=rnd()*t.h,r=rr(r0,r1),c=pick(cols);g.globalAlpha=a;g.fillStyle=c;tile9(t,x,y,function(X,Y){g.beginPath();g.arc(X,Y,r,0,7);g.fill();});}g.globalAlpha=1;};
var celRect=function(g,x,y,w,h,col,o){o=o||{};var b=o.band==null?Math.min(w,h)*.14:o.band;g.fillStyle=col;g.fillRect(x,y,w,h);if(b>0){g.fillStyle=sh(col,o.sd);g.fillRect(x,y+h-b,w,b);g.fillRect(x+w-b,y,b,h);g.fillStyle=tn(col,.5);var rm=Math.max(3,b*.35);g.fillRect(x,y,w-b,rm);g.fillRect(x,y,rm,h-b);}if(o.line!==false){g.strokeStyle=INK;g.lineWidth=o.lw||5;g.strokeRect(x,y,w,h);}};
var line=function(g,pts,lw,col){g.strokeStyle=col||INK;g.lineWidth=lw||5;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach(function(p,i){i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.stroke();};
