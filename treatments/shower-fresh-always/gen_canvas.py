# -*- coding: utf-8 -*-
import json
A="assets/"

# id,x,y,group,title,sub,thumbs,video
N=[
 ["brief",     80, 380,"pipeline","CREATIVE BRIEF","NIVEA · Father’s Day",["image3.png"], "media1.mp4"],
 ["casting",   380,360,"pipeline","AI CASTING","Father · Daughter",["image1.jpeg","image2.jpeg"], None],
 ["location",  680,360,"pipeline","LOCATION SCOUTING","9 tailored sets",["image8.jpeg","image9.jpeg","image10.jpeg","image11.jpeg"], None],
 ["storyboard",980,360,"pipeline","SKETCHED STORYBOARD","narrative pass",["image17.jpeg","image18.jpeg","image20.jpeg","image22.jpeg"], None],
 ["styleframes",1280,360,"pipeline","STYLE FRAMES","photoreal board",["image121.jpeg","image69.jpeg","image89.jpeg","image109.jpeg"], None],
 ["animation", 1580,360,"pipeline","ANIMATION","frames → motion",["image6.png"], "media2.mp4"],
 ["delivery",  1880,360,"pipeline","EDIT + DELIVERY","final film",["image3.png"], "media1.mp4"],
 ["consistency",380,640,"consistency","CHARACTER CONSISTENCY","age 1 → 28",["image3.jpeg","image5.jpeg","image7.jpeg","image2.jpeg"], None],
 ["localize",  2180,250,"localize","LOCALIZATION","EMEA → Thai",["image122.jpeg","image123.jpeg","image124.jpeg","image125.jpeg"], None],
 ["thaifilm",  2180,500,"localize","THAI FILM","market version",["image7.png"], "media3.mp4"],
 ["alwaysbrief",680,940,"always","ALWAYS’ BRIEF","new talent · consent",["image138.jpeg","image139.jpeg"], None],
 ["char1",     980,860,"always","CHARACTER #1","regenerated",["image140.jpeg"], None],
 ["char1sc",  1280,860,"always","SCENES · CHAR #1","",["image8.png","image9.png"], "media4.mp4"],
 ["char2",     980,1090,"always","CHARACTER #2","regenerated",["image141.jpeg"], None],
 ["char2sc",  1280,1090,"always","SCENES · CHAR #2","",["image10.png","image11.png"], "media6.mp4"],
 ["emmaref",  1580,970,"always","EMMA · REF PHOTOS","real person",["image142.jpeg","image143.jpeg","image144.jpeg","image145.jpeg"], None],
 ["emmasheet",1880,970,"always","EMMA · AI SHEET","character sheet",["image12.png"], None],
 ["emmascenes",2180,880,"always","SCENES · AI EMMA","",["image13.png","image14.png"], "media8.mp4"],
 ["emmaalt",  2180,1110,"always","EMMA · ALT OUTFIT","alt scenes",["image15.png"], "media10.mp4"],
]
E=[
 ["brief","casting","pipeline"],["casting","location","pipeline"],["location","storyboard","pipeline"],
 ["storyboard","styleframes","pipeline"],["styleframes","animation","pipeline"],["animation","delivery","pipeline"],
 ["casting","consistency","consistency"],
 ["delivery","localize","localize"],["localize","thaifilm","localize"],
 ["alwaysbrief","char1","always"],["alwaysbrief","char2","always"],["char1","char1sc","always"],["char2","char2sc","always"],
 ["alwaysbrief","emmaref","always"],["emmaref","emmasheet","always"],["emmasheet","emmascenes","always"],["emmasheet","emmaalt","always"],
]
nodes=[{"id":i,"x":x,"y":y,"g":g,"t":t,"s":s,"thumbs":[A+u for u in th],"v":(A+v if v else None)} for i,x,y,g,t,s,th,v in N]
edges=[{"a":a,"b":b,"g":g} for a,b,g in E]

CSS=r'''
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:#8b6ff0;--pipeline:#8b6ff0;--consistency:#33c2b4;--localize:#e0a24a;--always:#e069a6;--body:"Poppins","Helvetica Neue",Arial,sans-serif;--head:"Archivo",Arial,sans-serif}
html,body{height:100%;overflow:hidden;background:#141026;font-family:var(--body);color:#efeaff}
#viewport{position:fixed;inset:0;overflow:hidden;cursor:grab;background:
  radial-gradient(circle at 1px 1px,rgba(255,255,255,.07) 1px,transparent 0) 0 0/28px 28px,
  radial-gradient(120% 120% at 30% 0%,#211a3d 0%,#120e22 70%)}
#viewport.grabbing{cursor:grabbing}
#world{position:absolute;top:0;left:0;width:2600px;height:1560px;transform-origin:0 0}
#edges{position:absolute;top:0;left:0;width:2600px;height:1560px;overflow:visible;pointer-events:none}
#edges path{fill:none;stroke-width:2.4;stroke-linecap:round;opacity:.85;filter:drop-shadow(0 0 5px currentColor);stroke-dasharray:1 9;animation:flow 1.4s linear infinite}
@keyframes flow{to{stroke-dashoffset:-100}}
.e-pipeline{color:var(--pipeline);stroke:var(--pipeline)}.e-consistency{color:var(--consistency);stroke:var(--consistency)}
.e-localize{color:var(--localize);stroke:var(--localize)}.e-always{color:var(--always);stroke:var(--always)}
.node{position:absolute;width:214px;background:rgba(31,25,54,.92);border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:10px;cursor:grab;backdrop-filter:blur(6px);box-shadow:0 14px 34px rgba(0,0,0,.45);transition:box-shadow .2s,transform .08s,border-color .2s;user-select:none}
.node:hover{border-color:rgba(255,255,255,.28);box-shadow:0 18px 46px rgba(0,0,0,.6);z-index:20}
.node.drag{cursor:grabbing;z-index:30}
.node::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:4px;border-radius:4px}
.node.grp-pipeline::before{background:var(--pipeline)}.node.grp-consistency::before{background:var(--consistency)}
.node.grp-localize::before{background:var(--localize)}.node.grp-always::before{background:var(--always)}
.thumbs{display:grid;gap:3px;border-radius:8px;overflow:hidden;position:relative}
.thumbs.t1{grid-template-columns:1fr}.thumbs.t2{grid-template-columns:1fr 1fr}.thumbs.t3,.thumbs.t4{grid-template-columns:1fr 1fr}
.thumbs img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;background:#2a2247;pointer-events:none}
.thumbs.t1 img{aspect-ratio:16/9}
.vbadge{position:absolute;right:8px;bottom:8px;width:34px;height:34px;border-radius:50%;background:rgba(20,16,38,.7);border:1.5px solid rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3}
.vbadge::after{content:"";border-left:11px solid #fff;border-top:7px solid transparent;border-bottom:7px solid transparent;margin-left:3px}
.meta{padding:9px 4px 3px}
.ntitle{display:block;font-family:var(--head);font-weight:800;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;line-height:1.15}
.nsub{display:block;margin-top:3px;font-size:11px;color:#b3a9d6;font-weight:300}
.node video{width:100%;border-radius:8px;display:block}
/* fixed chrome */
.topbar{position:fixed;top:0;left:0;right:0;height:60px;display:flex;align-items:center;gap:18px;padding:0 20px;z-index:100;background:linear-gradient(to bottom,rgba(15,11,30,.92),rgba(15,11,30,0));pointer-events:none}
.topbar>*{pointer-events:auto}
.brand{font-family:var(--head);font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:13px}
.brand b{color:var(--accent)}
.navbtns{display:flex;gap:8px;margin-left:8px}
.navbtns button,.zoom button,.fitbtn{font-family:var(--head);font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#efeaff;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);padding:8px 12px;border-radius:8px;cursor:pointer;transition:.15s}
.navbtns button:hover,.zoom button:hover,.fitbtn:hover{background:rgba(139,111,240,.32);border-color:var(--accent)}
.navbtns button i{font-style:normal;display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}
.zoom{position:fixed;bottom:22px;right:22px;z-index:100;display:flex;align-items:center;gap:8px;background:rgba(20,16,38,.8);padding:8px;border-radius:12px;border:1px solid rgba(255,255,255,.12)}
.zoom button{width:36px;height:36px;padding:0;font-size:18px;line-height:1}
.zpct{min-width:48px;text-align:center;font-size:12px;font-weight:600}
.legend{position:fixed;left:22px;bottom:22px;z-index:100;background:rgba(20,16,38,.82);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 16px;font-size:11px}
.legend h4{font-family:var(--head);font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:10px;color:#b3a9d6;margin-bottom:9px}
.legend div{display:flex;align-items:center;gap:8px;margin:5px 0}
.legend i{width:20px;height:3px;border-radius:3px;display:inline-block}
.hint{position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:100;font-size:11.5px;color:#b3a9d6;background:rgba(20,16,38,.7);padding:7px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.1);transition:opacity .5s}
.hint b{color:#efeaff;font-weight:600}
@media(max-width:700px){.legend{display:none}.navbtns{display:none}}
'''

JS='''
const NODES=__NODES__, EDGES=__EDGES__;
const vp=document.getElementById('viewport'), world=document.getElementById('world'), svg=document.getElementById('edges');
let scale=1,tx=0,ty=0; const MIN=.25,MAX=2.4;
const els={};
// build nodes
NODES.forEach(n=>{
  const d=document.createElement('div');
  d.className='node grp-'+n.g; d.style.left=n.x+'px'; d.style.top=n.y+'px'; d.dataset.id=n.id;
  const tc=Math.min(n.thumbs.length,4);
  let th='<div class="thumbs t'+tc+'">'+n.thumbs.slice(0,4).map(u=>'<img src="'+u+'" alt="">').join('');
  if(n.v) th+='<div class="vbadge" data-src="'+n.v+'"></div>';
  th+='</div>';
  d.innerHTML=th+'<div class="meta"><span class="ntitle">'+n.t+'</span>'+(n.s?'<span class="nsub">'+n.s+'</span>':'')+'</div>';
  world.appendChild(d); els[n.id]=d; n.el=d;
});
function apply(){world.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')';document.getElementById('zpct').textContent=Math.round(scale*100)+'%';}
function anchors(a,b){
  const ax=a.offsetLeft,ay=a.offsetTop,aw=a.offsetWidth,ah=a.offsetHeight;
  const bx=b.offsetLeft,by=b.offsetTop,bw=b.offsetWidth,bh=b.offsetHeight;
  const acx=ax+aw/2,acy=ay+ah/2,bcx=bx+bw/2,bcy=by+bh/2;
  const dx=bcx-acx,dy=bcy-acy;
  let p1,p2,c1,c2;
  if(Math.abs(dx)>=Math.abs(dy)){ // horizontal
    const s=dx>=0?1:-1; p1=[acx+s*aw/2,acy]; p2=[bcx-s*bw/2,bcy];
    const o=Math.abs(p2[0]-p1[0])*.45; c1=[p1[0]+s*o,p1[1]]; c2=[p2[0]-s*o,p2[1]];
  }else{ const s=dy>=0?1:-1; p1=[acx,acy+s*ah/2]; p2=[bcx,bcy-s*bh/2];
    const o=Math.abs(p2[1]-p1[1])*.45; c1=[p1[0],p1[1]+s*o]; c2=[p2[0],p2[1]-s*o]; }
  return 'M'+p1[0]+','+p1[1]+' C'+c1[0]+','+c1[1]+' '+c2[0]+','+c2[1]+' '+p2[0]+','+p2[1];
}
function drawEdges(){
  svg.innerHTML=EDGES.map(e=>{const a=els[e.a],b=els[e.b];if(!a||!b)return'';return '<path class="e-'+e.g+'" d="'+anchors(a,b)+'"/>';}).join('');
}
drawEdges(); apply();
// pan + node drag
let mode=null,sx,sy,stx,sty,dragNode,nsx,nsy,moved;
vp.addEventListener('pointerdown',e=>{
  const badge=e.target.closest('.vbadge');
  if(badge){playVideo(badge);return;}
  const node=e.target.closest('.node');
  if(node){mode='node';dragNode=node;nsx=e.clientX;nsy=e.clientY;stx=node.offsetLeft;sty=node.offsetTop;moved=false;node.classList.add('drag');}
  else{mode='pan';sx=e.clientX;sy=e.clientY;stx=tx;sty=ty;vp.classList.add('grabbing');}
  vp.setPointerCapture(e.pointerId);
});
vp.addEventListener('pointermove',e=>{
  if(mode==='pan'){tx=stx+(e.clientX-sx);ty=sty+(e.clientY-sy);apply();}
  else if(mode==='node'){const nx=stx+(e.clientX-nsx)/scale,ny=sty+(e.clientY-nsy)/scale;dragNode.style.left=nx+'px';dragNode.style.top=ny+'px';if(Math.abs(e.clientX-nsx)+Math.abs(e.clientY-nsy)>3)moved=true;drawEdges();}
});
vp.addEventListener('pointerup',e=>{if(dragNode)dragNode.classList.remove('drag');mode=null;dragNode=null;vp.classList.remove('grabbing');vp.releasePointerCapture(e.pointerId);hideHint();});
// zoom
vp.addEventListener('wheel',e=>{e.preventDefault();const r=vp.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const wx=(mx-tx)/scale,wy=(my-ty)/scale;const f=e.deltaY<0?1.12:1/1.12;scale=Math.max(MIN,Math.min(MAX,scale*f));tx=mx-wx*scale;ty=my-wy*scale;apply();hideHint();},{passive:false});
function zoomBtn(f){const r=vp.getBoundingClientRect();const mx=r.width/2,my=r.height/2;const wx=(mx-tx)/scale,wy=(my-ty)/scale;scale=Math.max(MIN,Math.min(MAX,scale*f));tx=mx-wx*scale;ty=my-wy*scale;apply();}
document.getElementById('zin').onclick=()=>zoomBtn(1.2);
document.getElementById('zout').onclick=()=>zoomBtn(1/1.2);
// fit helpers
function bbox(ids){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;(ids||NODES.map(n=>n.id)).forEach(id=>{const el=els[id];x0=Math.min(x0,el.offsetLeft);y0=Math.min(y0,el.offsetTop);x1=Math.max(x1,el.offsetLeft+el.offsetWidth);y1=Math.max(y1,el.offsetTop+el.offsetHeight);});return[x0,y0,x1,y1];}
function focusTo(ids,pad){pad=pad||90;const[b0,c0,b1,c1]=bbox(ids);const r=vp.getBoundingClientRect();const w=b1-b0,h=c1-c0;const ns=Math.max(MIN,Math.min(MAX,Math.min((r.width-pad*2)/w,(r.height-pad*2)/h)));const ntx=(r.width-w*ns)/2-b0*ns;const nty=(r.height-h*ns)/2-c0*ns;animateTo(ns,ntx,nty);}
function animateTo(ns,ntx,nty){const s0=scale,x0=tx,y0=ty,t0=performance.now(),D=520;function st(t){let k=Math.min(1,(t-t0)/D);k=1-Math.pow(1-k,3);scale=s0+(ns-s0)*k;tx=x0+(ntx-x0)*k;ty=y0+(nty-y0)*k;apply();if(k<1)requestAnimationFrame(st);}requestAnimationFrame(st);}
const CL={pipeline:['brief','casting','location','storyboard','styleframes','animation','delivery'],localize:['delivery','localize','thaifilm'],always:['alwaysbrief','char1','char1sc','char2','char2sc','emmaref','emmasheet','emmascenes','emmaalt']};
document.getElementById('fit').onclick=()=>focusTo(null,70);
document.querySelectorAll('.navbtns button').forEach(b=>b.onclick=()=>focusTo(CL[b.dataset.cl],80));
// video
function playVideo(badge){const src=badge.dataset.src;const th=badge.parentElement;const v=document.createElement('video');v.src=src;v.controls=true;v.autoplay=true;v.playsInline=true;v.onerror=()=>{badge.style.display='none';const n=document.createElement('div');n.textContent='Clip not bundled — add '+src;n.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px;padding:8px;color:#fff;background:rgba(20,16,38,.85)';th.appendChild(n);};th.innerHTML='';th.appendChild(v);}
// hint
let hinted=false;function hideHint(){if(hinted)return;hinted=true;const h=document.getElementById('hint');if(h){h.style.opacity=0;setTimeout(()=>h.remove(),500);}}
// initial fit
window.addEventListener('load',()=>focusTo(null,70));
setTimeout(()=>focusTo(null,70),60);
'''

JS=JS.replace("__NODES__",json.dumps(nodes)).replace("__EDGES__",json.dumps(edges))

DOC=f'''<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Always — AI Production Canvas</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
<style>{CSS}</style></head>
<body>
<div class="topbar">
  <span class="brand">ALWAYS <b>/</b> AI PRODUCTION CANVAS</span>
  <span class="navbtns">
    <button data-cl="pipeline"><i style="background:var(--pipeline)"></i>Pipeline</button>
    <button data-cl="localize"><i style="background:var(--localize)"></i>Localization</button>
    <button data-cl="always"><i style="background:var(--always)"></i>Always / Emma</button>
  </span>
  <button class="fitbtn" id="fit">Fit all</button>
</div>
<div class="hint" id="hint"><b>Drag</b> to pan &nbsp;·&nbsp; <b>Scroll</b> to zoom &nbsp;·&nbsp; <b>Drag a node</b> to rearrange &nbsp;·&nbsp; <b>▶</b> to play</div>
<div class="legend">
  <h4>Workflows</h4>
  <div><i style="background:var(--pipeline)"></i>Core pipeline</div>
  <div><i style="background:var(--consistency)"></i>Character consistency</div>
  <div><i style="background:var(--localize)"></i>Localization</div>
  <div><i style="background:var(--always)"></i>Always brief · character regen</div>
</div>
<div class="zoom"><button id="zout">–</button><span class="zpct" id="zpct">100%</span><button id="zin">+</button></div>
<div id="viewport"><div id="world"><svg id="edges" xmlns="http://www.w3.org/2000/svg"></svg></div></div>
<script>{JS}</script>
</body></html>'''
open("/sessions/gifted-festive-mccarthy/mnt/outputs/shower_fresh_treatment/index_canvas.html","w").write(DOC)
print("nodes:",len(nodes),"edges:",len(edges),"bytes:",len(DOC))
