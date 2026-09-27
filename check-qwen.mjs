import assert from 'node:assert/strict';
import {generateScene,createServer} from './server.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),scene=require('./parts-engine.js').example('frog');
let captured;
const fetchImpl=async(url,o)=>{assert.ok(url.startsWith('http://127.0.0.1:11434/'));assert.equal(o.headers.Authorization,undefined);captured=JSON.parse(o.body);return {ok:true,json:async()=>url.endsWith('/show')?{capabilities:['vision','completion']}:{done:true,message:{content:JSON.stringify(scene)}}};};
await generateScene({prompt:'frog',imageData:'data:image/png;base64,aGVsbG8=',construction:'parts'},{provider:'ollama',fetchImpl});
assert.equal(captured.model,'qwen3-vl:4b');assert.equal(captured.stream,false);assert.equal(captured.messages[1].images[0],'aGVsbG8=');assert.ok(captured.format.properties.parts);assert.equal(captured.messages[0].role,'system');
await assert.rejects(()=>generateScene({prompt:'frog'},{provider:'ollama',fetchImpl:async()=>{throw Error('offline');}}),/start ollama/);
await assert.rejects(()=>generateScene({prompt:'frog'},{provider:'ollama',fetchImpl:async()=>({ok:true,json:async()=>({message:{content:'not json'}})})}),/invalid shape/);
const server=createServer({provider:'ollama',fetchImpl});await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{const url=`http://127.0.0.1:${server.address().port}`;let r=await fetch(url+'/api/status');let d=await r.json();assert.equal(d.ready,true);assert.equal(d.provider,'ollama');r=await fetch(url+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'frog',construction:'parts'})});assert.equal(r.status,200);}finally{await new Promise(r=>server.close(r));}
console.log('qwen checks passed: local image/text conversion, schema, no key, status, generation, offline and malformed replies.');
