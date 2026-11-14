import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileRecipe} from './stitch-programs.mjs';
import {catalog,fromCatalog} from './local-3d-planner.mjs';
import {checkPattern,checkStitchSelection} from './pattern-checker.mjs';
import {generateCheckedPattern} from './local-pattern-pipeline.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const manifest=JSON.parse(readFileSync(new URL('./training/local-image-runtime.json',import.meta.url)));
const selected=(recipe,mode='flat')=>({recipe,mode,scope:mode==='volume'?'experimental-3d':'trained-flat',adapterApplied:true,adapterSha256:manifest.adapter_source_sha256,convertedAdapterSha256:manifest.converted_adapter_sha256});
const recipe={stitch:'brick',shape:'triangle',width:6,rows:4},selection=selected(recipe),good=compileRecipe(recipe);
assert.equal(checkPattern(good,{selection}).status,'passed-digital');
const corrupt=(change,code)=>{const p=clone(good);change(p);const report=checkPattern(p,{selection});assert.equal(report.passed,false,code);assert.ok(report.issues.some(i=>i.code===code),code);};
corrupt(p=>p.beadCount++,'inventory_count');
corrupt(p=>p.beads[0].assemblyPasses++,'pass_ledger_mismatch');
corrupt(p=>p.steps[0].operations[0].kind='pass','pass_before_pickup');
corrupt(p=>p.operations.pop(),'step_route_mismatch');
corrupt(p=>{const op=p.steps[1].operations.find(o=>o.kind==='thread-bridge');op.between=['B1-1','B1-6'];},'missing_thread_bridge');
corrupt(p=>p.recipe.width=8,'recipe_mismatch');
corrupt(p=>p.passagePreference.maximumAssemblyPasses=0,'max_pass_mismatch');
corrupt(p=>p.physicalSampleRequired=false,'physical_scope_mismatch');
corrupt(p=>p.beads[0].xMm=NaN,'invalid_bead_geometry');
assert.equal(checkPattern(good).passed,false);
assert.equal(checkPattern(good,{selection:{...selection,adapterApplied:false}}).passed,false);
assert.equal(checkPattern(good,{selection:{...selection,convertedAdapterSha256:'wrong-weights'}}).passed,false);
assert.equal(checkStitchSelection(selected({...recipe,stitch:'peyote',shape:'rectangle',width:5})).passed,false);
assert.equal(checkStitchSelection({...selection,requestedDimensions:{width:8,rows:4}}).passed,false);
let calls=0;
const unsupported=await generateCheckedPattern({prompt:'Smooth sphere',mode:'volume',template:'bunny-original-01',selectImpl:async()=>selected({stitch:'peyote',shape:'sphere',width:0,rows:0},'volume'),fetchImpl:async()=>{calls++;throw Error('Saved starters need no geometry call.');}});
assert.equal(calls,0);assert.ok(unsupported.pattern);assert.ok(unsupported.svg);assert.equal(unsupported.pattern.technique,'craw');assert.equal(unsupported.selection.recipe.stitch,'peyote');assert.equal(unsupported.checker.passed,false);assert.equal(unsupported.checker.advisoryOnly,true);assert.equal(unsupported.checker.status,'needs-review');assert.ok(unsupported.checker.issues.some(i=>i.code==='unsupported_3d_stitch'));
const unknown=await generateCheckedPattern({prompt:'Unclear',selectImpl:async()=>selected({stitch:'unknown',shape:'unknown',width:0,rows:0})});assert.ok(unknown.pattern);assert.ok(unknown.svg);assert.ok(unknown.pattern.approximation);assert.equal(unknown.checker.status,'needs-review');
const parity=await generateCheckedPattern({prompt:'Peyote',requestedDimensions:{width:5,rows:4},selectImpl:async()=>selected({stitch:'peyote',shape:'rectangle',width:5,rows:4})});assert.equal(parity.pattern.recipe.width,6);assert.equal(parity.selection.recipe.width,5);assert.ok(parity.pattern.approximation);
const valid=await generateCheckedPattern({prompt:'Brick triangle',selectImpl:async()=>selection});assert.equal(valid.pattern.beadCount,good.beadCount);assert.equal(valid.checker.status,'passed-digital');
// Failed geometry gets a bounded second attempt with compilation feedback.
let attempts=0;
const retried=await generateCheckedPattern({prompt:'Bunny',mode:'volume',selectImpl:async()=>selected({stitch:'peyote',shape:'volume',width:0,rows:0},'volume'),fetchImpl:async(url,options)=>{
 if(url.endsWith('/lora-adapters'))return {ok:true,json:async()=>[{id:0,path:new URL('./.local-qwen/models/image-stitch-v1.gguf',import.meta.url).pathname,scale:1}]};
 const body=JSON.parse(options.body);attempts++;
 if(attempts===2)assert.match(body.messages[1].content[0].text,/previous geometry could not compile/);
 return {ok:true,json:async()=>({choices:[{message:{content:attempts===1?'not json':JSON.stringify(globalThis.BeadPartsLibrary.entries[0].scene)}}]})};
}});
assert.equal(attempts,2);assert.ok(retried.pattern);assert.ok(retried.svg);assert.equal(retried.checker.status,'needs-review');
const exhausted=await generateCheckedPattern({prompt:'Broken proposal',mode:'volume',selectImpl:async()=>selected({stitch:'craw',shape:'volume',width:0,rows:0},'volume'),fetchImpl:async(url)=>url.endsWith('/lora-adapters')?{ok:true,json:async()=>[{id:0,path:new URL('./.local-qwen/models/image-stitch-v1.gguf',import.meta.url).pathname,scale:1}]}:{ok:false}});
assert.equal(exhausted.pattern,null);assert.ok(exhausted.checker.issues.some(i=>i.code==='compilation_failed'));
const craw=selected({stitch:'craw',shape:'volume',width:0,rows:0},'volume');
for(const c of catalog){const report=checkPattern(fromCatalog(c.id),{selection:craw});assert.equal(report.passed,true,c.id+JSON.stringify(report.issues));assert.equal(report.status,'needs-review');}
const p=fromCatalog('bunny-original-01');
const bad=clone(p);bad.steps[1].travel.unshift('not-a-bead');assert.equal(checkPattern(bad,{selection:craw}).passed,false);
const missing=clone(p);missing.cubes.pop();assert.ok(checkPattern(missing,{selection:craw}).issues.some(i=>i.code==='voxel_inventory_mismatch'));
// A genuinely continuous but over-budget positioning loop is a soft review, not a false success or hard rejection.
const soft=clone(p),byId=new Map(soft.beads.map(b=>[b.id,b]));let cursor=soft.steps[1].start;const cycle=[];
for(let i=0;i<4;i++){const id=soft.steps[0].ring.find(id=>!cycle.includes(id)&&byId.get(id).ends.includes(cursor));assert.ok(id);cycle.push(id);cursor=byId.get(id).ends.find(v=>v!==cursor);}
soft.steps[1].travel.unshift(...cycle,...cycle);const counts=new Map();for(const s of soft.steps)for(const op of [...s.travel.map(id=>({id})),...s.ops])counts.set(op.id,(counts.get(op.id)||0)+1);
for(const b of soft.beads)b.assemblyPasses=counts.get(b.id);
soft.passagePreference.maximumAssemblyPasses=Math.max(...counts.values());soft.passagePreference.exceptions=soft.beads.filter(b=>b.assemblyPasses>5).map(b=>({id:b.id,passes:b.assemblyPasses}));
const report=checkPattern(soft,{selection:craw});assert.equal(report.passed,true,JSON.stringify(report.issues));assert.ok(report.issues.some(i=>i.code==='five_pass_review'));
console.log('Advisory checker, best-effort flat and 3D drafts, geometry retry, compilation failure reporting, corruption diagnostics, all 32 starters and soft five-pass review passed.');
