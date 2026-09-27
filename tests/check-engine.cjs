const assert = require('node:assert/strict');
require('../engine.js');
const E=globalThis.BeadEngine;
let cases=0;
function check(stitch,width,rows) {
 const g=E.geometry({stitch,width,rows,beadLength:1.3,beadDiameter:1.6});
 const guide=E.steps(g),colors=g.nodes.map((_,i)=>i%3),validation=E.validate(g,colors,['#000000','#ffffff','#994433']);
 assert.equal(validation.valid,true,validation.errors.join(' '));
 const unique=new Set(guide.flatMap(x=>x.ids));
 const expected=stitch==='raw'?width*(rows+1)+rows*(width+1):stitch==='peyote'?width*rows/2:width*rows;
 assert.equal(unique.size,expected); assert.equal(guide.flatMap(x=>x.ids).length,expected);
 for(const n of g.nodes){assert.ok(n.x-n.w/2>=-1e-9&&n.x+n.w/2<=g.W+1e-9);assert.ok(n.y-n.h/2>=-1e-9&&n.y+n.h/2<=g.H+1e-9);}
 if(stitch==='raw') {
  const existing=new Set();let pos='0:1';
  function traverse(id,kind){const edge=g.byId.get(id);assert.ok(edge.ends.includes(pos),'Thread must enter an adjacent corner');if(kind==='pick'){assert.ok(!existing.has(id),'A physical bead is added only once');existing.add(id);}else assert.ok(existing.has(id),'Only existing beads can be passed through');pos=edge.ends.find(p=>p!==pos);}
  for(let i=0;i<guide.length;i++) {
   const s=guide[i],start=existing.size;
   for(const id of s.travel)traverse(id,'pass');
   for(const op of s.ops)traverse(op.id,op.kind);
   assert.equal(existing.size-start,i===0?4:s.row===0||i%width===0?3:2);
   assert.equal(s.cell.ids.filter(id=>existing.has(id)).length,4);
  }
  assert.equal(existing.size,expected);
 } else if(stitch==='peyote') {
  assert.equal(guide[0].ids.length,width);
  assert.deepEqual(guide[0].ids.slice(0,4),['P2-1','P1-1','P2-2','P1-2']);
  for(let r=2;r<rows;r++) {
   const step=guide[r-1],coords=step.ids.map(id=>g.byId.get(id));
   assert.equal(coords.length,width/2);
   for(let i=0;i<coords.length;i++){const n=coords[i],a=g.byId.get(step.anchors[i]);assert.equal(a.r,r-1);assert.ok(Math.abs(Math.abs(n.x-a.x)-g.L)<1e-9);if(i)assert.ok(r%2===0?n.x<coords[i-1].x:n.x>coords[i-1].x);}
  }
 } else {
  for(let r=0;r<rows;r++){const ns=guide[r].ids.map(id=>g.byId.get(id));for(let i=1;i<ns.length;i++)assert.ok(r%2?ns[i].c<ns[i-1].c:ns[i].c>ns[i-1].c);}
 }
 assert.equal(E.validate(g,colors.slice(1),['#000000','#ffffff','#994433']).valid,false);
 cases++;
}
for(const w of [12,18,40,80])for(const r of [6,7,56,120])check('peyote',w,r);
for(const w of [2,3,8,16,30])for(const r of [2,3,10,40])check('raw',w,r);
for(const w of [6,7,36,80])for(const r of [6,7,30,120])check('square',w,r);
assert.throws(()=>E.geometry({stitch:'peyote',width:13,rows:20,beadLength:1.3,beadDiameter:1.6}),/even/i);
for(const s of [{stitch:'bad',width:40,rows:20,beadLength:1,beadDiameter:1},{stitch:'raw',width:NaN,rows:20,beadLength:1,beadDiameter:1}])assert.throws(()=>E.geometry(s));
for(const k of [2,3,6,12]){
 const samples=Array.from({length:600},(_,i)=>i%7===0?[20,20,20]:i%3?[235,220,201]:[180,91,48]);
 const a=E.quantize(samples,k),b=E.quantize(samples,k);assert.deepEqual(a,b);assert.ok(a.palette.length<=k);assert.equal(a.colors.length,600);assert.ok(a.colors.every(c=>c>=0&&c<a.palette.length));
}
const flat=E.quantize(Array(100).fill([255,255,255]),12);assert.deepEqual(flat.palette,['#ffffff']);assert.equal(new Set(flat.colors).size,1);
console.log(`${cases} geometry configurations passed; RAW thread continuity, unique inventory, peyote anchors, bounds, negative inputs, and deterministic color quantization verified.`);
