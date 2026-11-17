import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {compileRecipe} from '../../stitch-programs.mjs';
import {checkPattern} from '../../pattern-checker.mjs';
const code=readFileSync(new URL('../ios/Beadform/Resources/pattern-engine.js',import.meta.url),'utf8');
assert.ok(!/node:|process\.argv|import\.meta/.test(code));
const context=vm.createContext({});vm.runInContext(code,context);
for(const recipe of [
 {stitch:'brick',shape:'triangle',width:6,rows:4},
 {stitch:'brick',shape:'rectangle',width:6,rows:4},
 {stitch:'peyote',shape:'rectangle',width:8,rows:6},
 {stitch:'raw',shape:'rectangle',width:3,rows:3},
 {stitch:'square',shape:'rectangle',width:4,rows:3},
 {stitch:'ladder',shape:'strip',width:6,rows:1},
]){
 const native=JSON.parse(context.mobileCompile(JSON.stringify(recipe)));
 const expected=compileRecipe(recipe);
 assert.equal(native.rows.flat().length,expected.beadCount);
 assert.deepEqual(native.rows.flat().slice().sort(),expected.beads.map(b=>b.id).sort());
 assert.equal(native.steps.length,expected.steps.length);
 assert.deepEqual(native.beadPositions,expected.beads.map(b=>({id:b.id,x:b.xMm,y:b.yMm})));
 for(let i=0;i<native.steps.length;i++)assert.deepEqual(native.steps[i].match(/[A-Z][\w-]*\d[\w-]*/g),expected.steps[i].operations.flatMap(op=>op.kind==='thread-bridge'?op.between:[op.id]));
 assert.ok(checkPattern(expected,{requireSelection:false}).passed);
}
for(const recipe of [
 {stitch:'unknown',shape:'unknown',width:0,rows:0},
 {stitch:'peyote',shape:'rectangle',width:5,rows:4},
 {stitch:'brick',shape:'triangle',width:6,rows:6},
 {stitch:'brick',shape:'triangle',width:6,rows:4,extra:'ignored?'},
 {stitch:'brick',shape:'triangle',width:600,rows:4},
])assert.throws(()=>context.mobileCompile(JSON.stringify(recipe)));
if(process.argv[2]){
 const recipe=JSON.parse(readFileSync(process.argv[2],'utf8'));
 const generated=JSON.parse(context.mobileCompile(JSON.stringify(recipe)));
 assert.equal(generated.rows.flat().length,18);
 assert.equal(generated.steps.length,4);
}
console.log('Mobile bundle matches all six supported flat recipe variants; invalid/unknown recipes rejected.');
