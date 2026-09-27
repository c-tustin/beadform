const assert=require('node:assert/strict');require('../volume-engine.js');const V=global.BeadVolume;let configurations=0;
for(const shape of Object.keys(V.shapes))for(const detail of [2,3,4])for(const depth of [75,100,125]){
 const g=V.build({shape,detail,depth,beadSize:2});assert.equal(g.validation.valid,true,g.validation.errors.join(';'));
 assert.equal(g.faces.filter(f=>f.uses.length===1).length+2*g.faces.filter(f=>f.uses.length===2).length,6*g.cubes.length);
 for(const c of g.cubes){assert.equal(c.faces.length,6);assert.equal(new Set(c.faces.flatMap(x=>x.face.ids)).size,12);}
 const layers=g.layers.flatMap(y=>g.nodes.filter(n=>n.p[1]===y).map(n=>n.id));assert.equal(layers.length,g.nodes.length);assert.equal(new Set(layers).size,g.nodes.length);
 const added=new Set(),seenVertices=new Set(),seenFaces=new Set();let at=g.faces.find(f=>f.id===g.steps[0].faceId).corners[0];
 for(const step of g.steps){
   const fresh=[];
   for(const op of [...step.travel.map(id=>({kind:'pass',id})),...step.ops]){
     const n=g.byId.get(op.id);assert.ok(n.ends.includes(at),'Every pass must reach an adjacent bead hole');
     if(op.kind==='pick'){assert.ok(!added.has(op.id));added.add(op.id);fresh.push(op.id);}else assert.ok(added.has(op.id));
     at=n.ends[0]===at?n.ends[1]:n.ends[0];seenVertices.add(at);
   }
   assert.deepEqual(fresh,step.ids);assert.equal(at,step.end);assert.equal(new Set(step.ring).size,4);step.ring.forEach(id=>assert.ok(added.has(id)));seenFaces.add(step.faceId);
 }
 assert.equal(added.size,g.nodes.length);assert.equal(seenFaces.size,g.faces.length);assert.equal(g.steps.filter(s=>s.cubeIndex===0).flatMap(s=>s.ids).length,12);
 assert.ok(g.validation.maxPasses<=20);assert.equal(g.validation.longRoutes,0);
 assert.equal(V.validate(g,g.colors.slice(1),g.palette).valid,false);
 configurations++;
}
const a=V.build({shape:'frog',detail:3,depth:100,beadSize:2}),b=V.build({shape:'frog',detail:3,depth:100,beadSize:4});assert.deepEqual(a.nodes.map(n=>n.id),b.nodes.map(n=>n.id));assert.deepEqual(b.size,a.size.map(x=>x*2));assert.deepEqual(a.colors,b.colors);assert.deepEqual(a.steps,b.steps);
assert.throws(()=>V.build({shape:'fox',detail:3,depth:100,beadSize:2}));assert.throws(()=>V.build({shape:'frog',detail:30,depth:100,beadSize:2}));
console.log(`${configurations} 3D shape/detail/depth combinations passed: shared faces, 12-bead cubes, exact inventory, every layer, continuous thread traversal, closed rings, bounded thread passes, stable IDs, and physical size scaling.`);
