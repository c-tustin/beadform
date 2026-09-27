import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../server.mjs';
import {readCredentials,verifyKey} from '../key-setup.mjs';

// Synthetic keys and mocked upstream responses only. No live API requests.
const key='sk-beadform-synthetic-test-key-only',dir=await mkdtemp(join(tmpdir(),'beadform-setup-')),file=join(dir,'private','credentials.json');
const fixtures=JSON.parse(await readFile(new URL('./fixtures/test-subjects.json',import.meta.url),'utf8'));
let calls=[],rejectKey=false;
const fakeFetch=async(url,options)=>{
 const body=JSON.parse(options.body);calls.push({url,body,authorization:options.headers.Authorization});
 if(rejectKey)return {ok:false,status:401,json:async()=>({error:{message:key}})};
 return {ok:true,status:200,json:async()=>({id:'resp_synthetic',status:'completed',output:body.input==='Reply with READY.'?[]:[{type:'message',content:[{type:'output_text',text:JSON.stringify(fixtures.giraffe)}]}]})};
};
let server=createServer({apiKey:'',credentialsFile:file,fetchImpl:fakeFetch});
const listen=async s=>{await new Promise(r=>s.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${s.address().port}`;};
const close=s=>new Promise(r=>{s.close(r);s.closeAllConnections();});
try{
 let base=await listen(server);
 let health=await (await fetch(base+'/api/status')).json();assert.equal(health.ready,false);
 const setup=await (await fetch(base+'/api/setup')).json();assert.match(setup.token,/^[0-9a-f]{64}$/);assert.equal(setup.configured,false);
 const post=(body,headers={})=>fetch(base+'/api/setup',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,'X-Beadform-Setup':setup.token,...headers},body:JSON.stringify(body)});
 assert.equal((await post({apiKey:key},{Origin:'https://unrelated.invalid'})).status,403);
 assert.equal((await post({apiKey:key},{'X-Beadform-Setup':'wrong'})).status,403);
 assert.equal((await post({apiKey:'not-a-key'})).status,400);assert.equal(calls.length,0);
 const checked=await post({apiKey:key}),result=await checked.json();assert.equal(checked.status,200);assert.equal(result.ready,true);assert.ok(!JSON.stringify(result).includes(key));
 assert.equal(calls[0].body.store,false);assert.equal(calls[0].authorization,'Bearer '+key);assert.equal(calls[0].body.max_output_tokens,16);
 assert.equal((await readCredentials(file)).apiKey,key);if(process.platform!=='win32'){assert.equal((await stat(file)).mode&0o777,0o600);assert.equal((await stat(join(dir,'private'))).mode&0o777,0o700);}
 health=await (await fetch(base+'/api/status')).json();assert.equal(health.ready,true);assert.ok(!JSON.stringify(health).includes(key));assert.equal((await fetch(base+'/credentials.json')).status,404);
 rejectKey=true;const rejected=await post({apiKey:key+'replacement'});assert.equal(rejected.status,422);assert.ok(!(await rejected.text()).includes(key));assert.equal((await readCredentials(file)).apiKey,key);rejectKey=false;
 const generated=await fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({prompt:'a giraffe',detail:2})});assert.equal(generated.status,200);assert.equal((await generated.json()).scene.title,fixtures.giraffe.title);
 await close(server);server=createServer({credentialsFile:file,fetchImpl:fakeFetch});base=await listen(server);assert.equal((await (await fetch(base+'/api/status')).json()).ready,true,'The checked key must survive a studio restart.');
 await assert.rejects(()=>verifyKey(key,{fetchImpl:async()=>({ok:false,status:429,json:async()=>({error:{code:'insufficient_quota'}})})}),e=>e.code==='billing_required'&&e.message.includes('API billing'));
 console.log('Local key setup passed: origin/token checks, validation before saving, private file permissions, replacement failure preserves the key, restart persistence, sanitized errors, billing guidance, and generation after connection. No live API call.');
}finally{await close(server);await rm(dir,{recursive:true,force:true});}
