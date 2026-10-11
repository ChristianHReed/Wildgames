
var INK='#3d3029',CR='#f5ead8',PA='#fff8ee',WD='#c99a62',WDD='#a2733f',CL='#c67139',CLD='#9a5226',SG='#7a8a5e',SGL='#a9b78c',SGD='#56643f',OC='#d9a845',RV='#5f8a9a',RVL='#9cc0c9',PL='#8a6a8a',GR='#b8b0a2',MT='#8f99a0',MTL='#c9d0d3',UD='#a8b894',UDD='#7f8f6c';
var CEL='<defs><filter id="cel" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="erode" radius="1.6" result="in"/><feOffset in="in" dx="-7" dy="-8" result="o"/><feComposite in="in" in2="o" operator="out" result="band"/><feFlood flood-color="#5b2f3a" flood-opacity=".26"/><feComposite in2="band" operator="in" result="shade"/><feOffset in="in" dx="2.5" dy="3" result="o2"/><feComposite in="in" in2="o2" operator="out" result="rimA"/><feFlood flood-color="#fff6e0" flood-opacity=".75"/><feComposite in2="rimA" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="rim"/></feMerge></filter></defs>';
var F=function(f,ex){return (f!=='none'&&!/opacity/.test(ex||''))?' filter="url(#cel)"':'';};
var r=function(x,y,w,h,f,rx,ex){rx=rx==null?6:rx;ex=ex||'';return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+f+'" '+ex+F(f,ex)+'/>';};
var c=function(x,y,R,f,ex){ex=ex||'';return '<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+f+'" '+ex+F(f,ex)+'/>';};
var e=function(x,y,a,b,f,ex){ex=ex||'';return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+a+'" ry="'+b+'" fill="'+f+'" '+ex+F(f,ex)+'/>';};
var p=function(d,f,ex){f=f||'none';ex=ex||'';return '<path d="'+d+'" fill="'+f+'" '+ex+F(f,ex)+'/>';};
var hl=function(d){return '<path d="'+d+'" fill="none" stroke="#fff6e0" stroke-opacity=".85" stroke-width="2.5"/>';};
var NS='stroke="none"';
var svg=function(body,w,h,shadow){w=w||128;h=h||128;if(shadow==null)shadow=true;return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'">'+CEL+(shadow?'<ellipse cx="'+(w/2)+'" cy="'+(h-10)+'" rx="'+(w*0.38)+'" ry="7" fill="#3d3029" opacity=".14"/>':'')+'<g stroke="'+INK+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">'+body+'</g></svg>';};
var rot=function(a,body,cx,cy){cx=cx==null?64:cx;cy=cy==null?64:cy;return '<g transform="rotate('+a+' '+cx+' '+cy+')">'+body+'</g>';};

// ---- v2: 3/4 view primitives (box, cylinder, ball) ----
var hex=function(h){return [1,3,5].map(function(i){return parseInt(h.slice(i,i+2),16)});};
var mix=function(a,b,t){var A=hex(a),B=hex(b);return '#'+A.map(function(v,i){return Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')}).join('');};
var sh=function(c,t){return mix(c,'#5b2f3a',t==null?.28:t);};
var tn=function(c,t){return mix(c,'#fff6e0',t==null?.3:t);};
var poly=function(pts,f,ex){return '<path d="M'+pts.map(function(p){return p.join(' ')}).join(' L')+'Z" fill="'+f+'" '+(ex||'')+'/>';};
var box=function(x,y,w,h,d,col,o){o=o||{};var dx=d*.55,dy=d*.45;var s='';
 if(!o.noSide)s+=poly([[x+w,y],[x+w+dx,y-dy],[x+w+dx,y+h-dy],[x+w,y+h]],o.side||sh(col));
 if(!o.noTop)s+=poly([[x,y],[x+w,y],[x+w+dx,y-dy],[x+dx,y-dy]],o.top||tn(col));
 s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+col+'"/>';
 if(!o.noRim)s+='<path d="M'+(x+3)+' '+(y+3)+' L'+(x+w-3)+' '+(y+3)+'" stroke="#fff6e0" stroke-opacity=".8" stroke-width="2"/>';
 return s;};
var cyl=function(cx,y,rx,h,col,o){o=o||{};var ry=rx*.32;var s='';
 s+='<path d="M'+(cx-rx)+' '+y+' L'+(cx-rx)+' '+(y+h)+' A'+rx+' '+ry+' 0 0 0 '+(cx+rx)+' '+(y+h)+' L'+(cx+rx)+' '+y+'Z" fill="'+col+'"/>';
 s+='<path d="M'+(cx+rx*.35)+' '+(y+ry*.95)+' L'+(cx+rx*.35)+' '+(y+h+ry*.95)+' A'+rx+' '+ry+' 0 0 0 '+(cx+rx)+' '+(y+h)+' L'+(cx+rx)+' '+y+'Z" fill="'+sh(col)+'" stroke="none"/>';
 s+='<path d="M'+(cx-rx)+' '+y+' L'+(cx-rx)+' '+(y+h)+' A'+rx+' '+ry+' 0 0 0 '+(cx+rx)+' '+(y+h)+' L'+(cx+rx)+' '+y+'" fill="none"/>';
 if(!o.noTop)s+='<ellipse cx="'+cx+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+(o.top||tn(col))+'"/>';
 s+='<path d="M'+(cx-rx*.62)+' '+(y+ry+4)+' L'+(cx-rx*.62)+' '+(y+h-2)+'" stroke="#fff6e0" stroke-opacity=".7" stroke-width="2.5"/>';
 return s;};
var ball=function(x,y,R,col){return '<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+col+'"/><path d="M'+(x+R*.95)+' '+(y-R*.3)+' A'+R+' '+R+' 0 0 1 '+(x-R*.3)+' '+(y+R*.95)+' A'+(R*1.15)+' '+(R*1.15)+' 0 0 0 '+(x+R*.95)+' '+(y-R*.3)+'Z" fill="'+sh(col)+'" stroke="none"/><circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="none"/><path d="M'+(x-R*.7)+' '+(y-R*.35)+' A'+(R*.8)+' '+(R*.8)+' 0 0 1 '+(x-R*.2)+' '+(y-R*.75)+'" stroke="#fff6e0" stroke-opacity=".85" stroke-width="2.5" fill="none"/>';};
var W=function(body,w,h,gs){w=w||128;h=h||128;return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'">'+(gs===false?'':'<ellipse cx="'+(w/2+6)+'" cy="'+(h-11)+'" rx="'+(w*.4)+'" ry="7" fill="#3d3029" opacity=".16"/>')+'<g stroke="#3d3029" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">'+body+'</g></svg>';};
