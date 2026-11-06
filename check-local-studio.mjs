import assert from 'node:assert/strict';
import {catalog,fromCatalog,compileVolume} from './local-3d-planner.mjs';
import {compileRecipe} from './stitch-programs.mjs';
for(const item of catalog){
 const p=fromCatalog(item.id),byId=new Map(p.beads.map(b=>[b.id,b])),known=new Set(),usage=new Map();let cursor=null;
 const edges=new Set(p.beads.map(b=>b.ends.slice().sort().join('|')));assert.equal(edges.size,p.beadCount);
 for(const step of p.steps){
  if(step.threadStart)cursor=step.entryCorner;
  for(const op of [...step.travel.map(id=>({kind:'pass',id})),...step.ops]){
   const bead=byId.get(op.id);assert.ok(bead,item.id);assert.ok(bead.ends.includes(cursor),'Thread must enter an adjacent bead hole.');
   if(op.kind==='pick'){assert.ok(!known.has(op.id));known.add(op.id);}else assert.ok(known.has(op.id),'No pass before pickup.');
   cursor=bead.ends.find(v=>v!==cursor);usage.set(op.id,(usage.get(op.id)||0)+1);
  }
  assert.equal(cursor,step.end);assert.equal(new Set(step.ring).size,4);step.ring.forEach(id=>assert.ok(known.has(id)));
 }
 assert.equal(known.size,p.beadCount);
 for(const bead of p.beads){assert.equal(usage.get(bead.id),bead.assemblyPasses);assert.ok(bead.assemblyPasses<=5);}
 const built=new Set();for(const cube of p.cubes){const q=[cube.x,cube.y,cube.z];if(built.size)assert.ok([0,1,2].some(axis=>[-1,1].some(sign=>built.has(q.map((v,i)=>v+(i===axis?sign:0)).join(',')))));built.add(q.join(','));}
}
assert.equal(catalog.length,32);assert.ok(!catalog.some(c=>c.group==='fish'));
assert.throws(()=>fromCatalog('missing'));
const p=compileRecipe({stitch:'brick',shape:'triangle',width:6,rows:4});assert.equal(p.beadCount,18);assert.equal(p.passagePreference.maximumAssemblyPasses,3);
assert.ok(p.operations.some(o=>o.kind==='thread-bridge'));
const part={name:'body',type:'ellipsoid',role:'solid',center:[0,0,0],size:[1,1,1],end:[0,0,0],color:'#aaaaaa'};
assert.throws(()=>compileVolume({title:'collapsed',parts:[part,{...part,name:'head',size:[.5,.5,.5]}]}),/collapsed/);
console.log('32 3D starters: unique beads, continuous routes, correct pickup order, face-attached cubes, recomputed passage counts ≤5. Flat triangle and collapsed-shape rejection passed.');
