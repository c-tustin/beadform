const assert=require('node:assert/strict'),P=require('./float-physics.js');
const bead=(x,y,vx,vy)=>({x,y,vx,vy,w:80,h:80,r:32,drag:false,angle:0,omega:0});
{const a=bead(100,100,80,0),b=bead(160,100,-80,0);P.collide(a,b);assert.ok(a.vx<0&&b.vx>0,'head-on collision exchanges momentum');assert.ok(b.x-a.x>=64);}
{const a=bead(100,100,150,40),b=bead(150,125,0,0);P.collide(a,b);assert.ok(Math.abs(a.omega)>0,'glancing impact spins');assert.ok(Math.hypot(b.vx,b.vy)>0);}
{const a=bead(100,100,300,0),b=bead(155,100,0,0);a.drag=true;P.collide(a,b);assert.equal(a.x,100);assert.ok(b.vx>0,'dragged body pushes its neighbor');}
{const a=bead(1,20,-200,0);a.omega=3;P.step([a],.05,600,400);assert.ok(a.vx>0);assert.ok(a.angle>0&&a.omega<3);}
{const a=bead(200,100,700,0);for(let i=0;i<100;i++)P.step([a],1/120,3000,1000);assert.ok(a.vx<700&&a.vx>28);assert.ok(Number.isFinite(a.x));}
console.log('Physics checks passed: collisions, glancing spin, pushing, wall bounce, spin damping and throw damping.');
