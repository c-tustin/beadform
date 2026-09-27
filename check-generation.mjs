import assert from 'node:assert/strict';
import {generateScene,createServer} from './server.mjs';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),S=require('./shape-engine.js'),V=globalThis.BeadVolume;
const G=require('./stage-guide.js');
function checkStages(g){
 const stages=G.build(g);assert.deepEqual(stages.flatMap(s=>s.steps),g.steps);assert.deepEqual(stages.flatMap(s=>s.ids),g.steps.flatMap(s=>s.ids));
 const cubes=stages.flatMap(s=>s.blocks.map(b=>b.cubeId));assert.equal(new Set(cubes).size,cubes.length,'A complete unit must never be split across stages.');
 const operations=stages.flatMap(s=>s.operations);assert.deepEqual(operations.map(o=>o.id),g.steps.flatMap(s=>[...s.travel,...s.ops.map(o=>o.id)]));
 for(let i=1;i<operations.length;i++){const a=operations[i-1],b=operations[i];if(!b.newThread)assert.equal(b.from,a.to,'The working line must continue across stage boundaries.');}
 for(const s of stages){assert.deepEqual(G.cursor(s,0),{step:s.start,reveal:0});assert.equal(G.cursor(s,s.operations.length).step,s.end);assert.ok(s.ids.length<=60);}
}
const part=(name,type,center,size,color,role='solid',end=center)=>({name,type,center,size,end,color,role});
// Original geometric test subjects. These are contract fixtures, not canned
// production outputs and not evidence of live model interpretation quality.
const giraffe={title:'a little giraffe',notes:'Shortened legs and a broad neck help keep the pose connected.',parts:[
 part('body','ellipsoid',[0,-1,0],[1.4,1.6,1],'#d9b872'),part('neck','capsule',[.45,0,0],[.57,.57,.55],'#d9b872','solid',[.9,2.8,0]),part('head','ellipsoid',[1.05,3,0],[1,.6,.65],'#d9b872'),part('left leg','capsule',[-.8,-1.7,0],[.4,.45,.45],'#bd855d','solid',[-.8,-3,0]),part('right leg','capsule',[.8,-1.7,0],[.4,.45,.45],'#bd855d','solid',[.8,-3,0]),part('left ear','ellipsoid',[.45,3.6,0],[.48,.3,.4],'#d9b872'),part('right ear','ellipsoid',[1.65,3.55,0],[.45,.3,.4],'#d9b872'),part('left eye','ellipsoid',[.65,3.08,.57],[.15,.16,.2],'#253b30','paint'),part('right eye','ellipsoid',[1.4,3.08,.57],[.15,.16,.2],'#253b30','paint'),part('spot','ellipsoid',[0,-.7,.9],[.4,.4,.2],'#916341','paint')
]};
const teapot={title:'a green teapot',notes:'A broad spout and handle are simplified at bead scale.',parts:[
 part('pot','ellipsoid',[0,0,0],[2,1.7,1.5],'#7aaa80'),part('lid','ellipsoid',[0,1.5,0],[1.5,.35,1.2],'#d993b1'),part('knob','ellipsoid',[0,1.85,0],[.4,.4,.4],'#d993b1'),part('spout base','capsule',[1.3,-.3,0],[.65,.65,.6],'#7aaa80','solid',[2.8,.3,0]),part('spout tip','capsule',[2.6,.3,0],[.4,.4,.45],'#7aaa80','solid',[3.3,1.2,0]),part('handle upper','capsule',[-1.2,1,0],[.4,.4,.4],'#d993b1','solid',[-2.7,.5,0]),part('handle side','capsule',[-2.7,.5,0],[.4,.4,.4],'#d993b1','solid',[-2.7,-.7,0]),part('handle lower','capsule',[-2.7,-.7,0],[.4,.4,.4],'#d993b1','solid',[-1.2,-1,0])
]};
let count=0;
for(const shape of Object.keys(V.shapes))for(const detail of [2,3,4])for(const depth of [75,100,125])for(const threadDiameter of [.2,.25]){
 const g=V.build({shape,detail,depth,beadSize:2,threadDiameter,routeVersion:2,orderVersion:2}),v=V.validate(g,g.colors,g.palette);assert.ok(v.valid,v.errors.join(' '));assert.ok(v.maxPasses<=(threadDiameter===.2?8:6));checkStages(g);
 const constructed=g.steps.flatMap(s=>s.ids);assert.equal(new Set(constructed).size,g.nodes.length);assert.equal(constructed.length,g.nodes.length);count++;
}
for(const d of [giraffe,teapot])for(const detail of [2,3]){const g=V.build({shape:'custom',design:d,detail,depth:100,beadSize:2,threadDiameter:.25,routeVersion:2,orderVersion:2});assert.ok(g.validation.valid);assert.ok(g.nodes.length>20);assert.ok(g.cubes.some(c=>c.part==='body'||c.part==='pot'));checkStages(g);}
const modelResponse=scene=>({ok:true,status:200,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(scene)}]}]})});
let captured;
const fakeFetch=async(url,options)=>{captured={url,options,body:JSON.parse(options.body)};return modelResponse(giraffe);};
const generated=await generateScene({prompt:'a giraffe with spots',imageData:null,detail:3},{apiKey:'fixture-key',fetchImpl:fakeFetch});assert.equal(generated.scene.title,giraffe.title);assert.ok(generated.checks.maxPasses<=6);assert.equal(captured.body.store,false);assert.equal(captured.body.text.format.strict,true);assert.ok(!JSON.stringify(generated).includes('fixture-key'));
await generateScene({prompt:'a giraffe made from balls and tubes',construction:'parts',detail:2},{apiKey:'fixture-key',fetchImpl:fakeFetch});assert.ok(captured.body.instructions.includes('human-readable parts plan'));
await generateScene({prompt:'from this image',imageData:'data:image/png;base64,aGVsbG8=',detail:2},{apiKey:'fixture-key',fetchImpl:fakeFetch});assert.equal(captured.body.input[0].content[1].type,'input_image');
await assert.rejects(()=>generateScene({prompt:'test'},{apiKey:'',fetchImpl:fakeFetch}),/not connected/);
await assert.rejects(()=>generateScene({prompt:'test',imageData:'https://untrusted.invalid/photo.png'},{apiKey:'fixture-key',fetchImpl:fakeFetch}),/embedded PNG/);
await assert.rejects(()=>generateScene({prompt:'test'},{apiKey:'fixture-key',fetchImpl:async()=>modelResponse({title:'bad',parts:[]})}),/invalid shape/);
await assert.rejects(()=>generateScene({prompt:'test'},{apiKey:'fixture-key',fetchImpl:async()=>({ok:false,status:429})}),/usage limit/);
await assert.rejects(()=>generateScene({prompt:'test'},{apiKey:'fixture-key',fetchImpl:async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})})}),/too long/);
await assert.rejects(()=>generateScene({prompt:'test'},{apiKey:'fixture-key',fetchImpl:async()=>({ok:true,json:async()=>({output:[{content:[{type:'refusal'}]}]})})}),/could not create/);
const disconnected={title:'separate',parts:[part('one','ellipsoid',[-20,0,0],[1,1,1],'#789456'),part('two','ellipsoid',[20,0,0],[1,1,1],'#789456')]};
await assert.rejects(()=>generateScene({prompt:'test'},{apiKey:'fixture-key',fetchImpl:async()=>modelResponse(disconnected)}),/needs adjustment/);
const server=createServer({apiKey:'fixture-key',fetchImpl:fakeFetch,htmlPath:fileURLToPath(new URL('./beadform.html',import.meta.url))});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{const base=`http://127.0.0.1:${server.address().port}`,status=await fetch(base+'/api/status'),health=await status.json();assert.equal(health.ready,true);assert.equal(health.app,'beadform');assert.equal(health.canConfigure,true);const html=await fetch(base);assert.equal(html.status,200);assert.ok((await html.text()).includes('vGenerateText'));
 const ok=await fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'an original giraffe',detail:2})});assert.equal(ok.status,200);assert.equal((await ok.json()).scene.title,giraffe.title);
 const blocked=await fetch(base+'/api/generate',{method:'POST',headers:{Origin:'https://unrelated.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(blocked.status,403);
 const traversal=await fetch(base+'/server.mjs');assert.equal(traversal.status,404);const bad=await fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(bad.status,400);
}finally{await new Promise(resolve=>server.close(resolve));}
await writeFile(new URL('./test-subjects.json',import.meta.url),JSON.stringify({giraffe,teapot},null,2));
console.log(`${count} fishing-line route configurations passed, plus custom animal/object geometry, structured text/image API contracts, upstream error handling, disconnected-part rejection, and local HTTP/security checks. No live model call was made.`);
