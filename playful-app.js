(() => {
'use strict';
const host=document.getElementById('floatingCrafts'),pause=document.getElementById('pauseCrafts');
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
let paused=reduced,last=0,raf=0;
const physics=window.BeadFloatPhysics,clock=()=>performance.now();
const arena=()=>({W:host.clientWidth||window.innerWidth||1200,H:host.clientHeight||750});
const sources=['frog','caterpillar','blue-lizard','jellyfish','starfish','crocodile'].map(name=>({name,src:'assets/'+name+'.webp'}));
host.innerHTML=sources.map(({name,src},i)=>`<div class="floating-photo floating-character" data-float="${i}" aria-hidden="true"><img src="${src}" alt="canela’s beaded ${name}" draggable="false"></div>`).join('');
const nodes=[...host.querySelectorAll('[data-float]')].map(el=>{const angle=Math.random()*Math.PI*2,speed=14+Math.random()*15;return {el,x:0,y:0,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle:(Math.random()-.5)*.3,omega:(Math.random()-.5)*.4,drag:false,w:el.offsetWidth||128,h:el.offsetHeight||155,r:Math.min(el.offsetWidth||128,el.offsetHeight||155)*.37,samples:[]};});
function bounds(n){const W=host.clientWidth||window.innerWidth||1200,H=host.clientHeight||750,w=n.el.offsetWidth||128,h=n.el.offsetHeight||155;return {minX:0,maxX:Math.max(0,W-w),maxY:Math.max(0,H-h)};}
function place(n){const b=bounds(n);n.x=Math.max(b.minX,Math.min(b.maxX,n.x));n.y=Math.max(0,Math.min(b.maxY,n.y));n.el.style.transform=`translate(${n.x}px,${n.y}px) rotate(${(n.angle||0)*180/Math.PI}deg)`;}
for(const n of nodes){const b=bounds(n);n.x=b.maxX*(.08+Math.random()*.84);n.y=b.maxY*(.08+Math.random()*.84);place(n);n.el.querySelectorAll('img').forEach(im=>im.onerror=()=>{n.el.hidden=true;});}
const cursor={x:0,y:0,w:24,h:24,r:12,vx:0,vy:0,omega:0,drag:true,active:false,time:0};
window.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'||paused||BeadJourney.screen!=='welcome'||document.getElementById('modal')?.open){cursor.active=false;return;}
 const rect=host.getBoundingClientRect(),{W,H}=arena(),x=e.clientX-rect.left-12,y=e.clientY-rect.top-12,t=clock();
 if(x< -12||y< -12||x>W-12||y>H-12){cursor.active=false;return;}
 const prior=cursor.active&&t-cursor.time<150,startX=prior?cursor.x:x,startY=prior?cursor.y:y,dt=Math.max(.008,(t-cursor.time)/1000);
 cursor.vx=prior?(x-startX)/dt:0;cursor.vy=prior?(y-startY)/dt:0;physics.cap(cursor);cursor.active=true;cursor.time=t;
 const steps=Math.min(120,Math.max(1,Math.ceil(Math.hypot(x-startX,y-startY)/12)));
 for(let i=1;i<=steps;i++){cursor.x=startX+(x-startX)*i/steps;cursor.y=startY+(y-startY)*i/steps;physics.settle([...nodes,cursor],W,H);}nodes.forEach(place);
},{passive:true});
window.addEventListener('blur',()=>{cursor.active=false;});window.addEventListener('pointerout',e=>{if(!e.relatedTarget)cursor.active=false;});window.addEventListener('scroll',()=>{cursor.active=false;},{passive:true});
function tick(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(!paused&&BeadJourney.screen==='welcome'&&!document.hidden){const {W,H}=arena();if(clock()-cursor.time>90){cursor.vx=0;cursor.vy=0;}const cursorOn=cursor.active&&!document.getElementById('modal')?.open;physics.step(cursorOn?[...nodes,cursor]:nodes,dt,W,H);nodes.forEach(place);}raf=requestAnimationFrame(tick);}

pause.textContent=paused?'let the characters float':'pause the floating characters';pause.onclick=()=>{paused=!paused;pause.textContent=paused?'let the characters float':'pause the floating characters';pause.setAttribute('aria-pressed',String(paused));};window.addEventListener('resize',()=>nodes.forEach(n=>{n.w=n.el.offsetWidth||128;n.h=n.el.offsetHeight||155;n.r=Math.min(n.w,n.h)*.37;place(n);}));requestAnimationFrame(tick);
})();
