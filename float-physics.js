(function(root){
'use strict';
const limit=700;
function cap(n){const speed=Math.hypot(n.vx,n.vy);if(speed>limit){n.vx*=limit/speed;n.vy*=limit/speed;}}
function walls(n,W,H){const maxX=Math.max(0,W-n.w),maxY=Math.max(0,H-n.h);if(n.x<0){n.x=0;n.vx=Math.abs(n.vx)*.88;}else if(n.x>maxX){n.x=maxX;n.vx=-Math.abs(n.vx)*.88;}if(n.y<0){n.y=0;n.vy=Math.abs(n.vy)*.88;}else if(n.y>maxY){n.y=maxY;n.vy=-Math.abs(n.vy)*.88;}}
function collide(a,b){let dx=b.x+b.w/2-a.x-a.w/2,dy=b.y+b.h/2-a.y-a.h/2,d=Math.hypot(dx,dy),r=a.r+b.r;if(d>=r)return;if(d<.001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d,ia=a.drag?0:1,ib=b.drag?0:1,total=ia+ib;if(!total)return;const overlap=r-d+.01;a.x-=nx*overlap*ia/total;a.y-=ny*overlap*ia/total;b.x+=nx*overlap*ib/total;b.y+=ny*overlap*ib/total;const approach=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(approach<0){const impulse=-(1+.9)*approach/total;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;cap(a);cap(b);
const tx=-ny,ty=nx,spinA=a.omega||0,spinB=b.omega||0,slip=(b.vx-a.vx)*tx+(b.vy-a.vy)*ty-spinA*a.r-spinB*b.r;
const friction=Math.max(-impulse*.18,Math.min(impulse*.18,-slip/(total*3)));
a.vx-=friction*tx*ia;a.vy-=friction*ty*ia;b.vx+=friction*tx*ib;b.vy+=friction*ty*ib;
a.omega=Math.max(-7,Math.min(7,spinA-2*friction/a.r*ia));b.omega=Math.max(-7,Math.min(7,spinB-2*friction/b.r*ib));}}
function settle(nodes,W,H){for(let pass=0;pass<3;pass++){for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)collide(nodes[i],nodes[j]);nodes.forEach(n=>{if(!n.drag)walls(n,W,H);});}}
function step(nodes,dt,W,H){const count=Math.max(1,Math.ceil(Math.min(dt,.05)*120)),h=Math.min(dt,.05)/count;for(let i=0;i<count;i++){for(const n of nodes)if(!n.drag){cap(n);n.omega=(n.omega||0)*Math.exp(-.45*h);n.angle=((n.angle||0)+n.omega*h)%(Math.PI*2);const speed=Math.hypot(n.vx,n.vy);if(speed>28){const next=28+(speed-28)*Math.exp(-.65*h);n.vx*=next/speed;n.vy*=next/speed;}n.x+=n.vx*h;n.y+=n.vy*h;walls(n,W,H);}settle(nodes,W,H);}}
root.BeadFloatPhysics={step,settle,cap,walls,collide};if(typeof module!=='undefined')module.exports=root.BeadFloatPhysics;
})(typeof window!=='undefined'?window:globalThis);
