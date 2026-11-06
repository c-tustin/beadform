// Local image-stitch-v1 inference. No hosted provider or base-model fallback.
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn, spawnSync} from 'node:child_process';
import {compileRecipe, patternSvg} from './stitch-programs.mjs';
import {sceneSchema,sceneSystem,compileVolume,volumeSvg} from './local-3d-planner.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
const config=JSON.parse(readFileSync(new URL('./training/local-image-system.json',import.meta.url)));
const args=process.argv.slice(2);
const flag=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const image=flag('--image'), prompt=flag('--prompt');
const isScene=args.includes('--scene');
const base='http://127.0.0.1:8197';
const model=resolve(root,'.local-qwen/models/Qwen3VL-2B-Instruct-Q8_0.gguf');
const mmproj=resolve(root,'.local-qwen/models/mmproj-Qwen3VL-2B-Instruct-F16.gguf');
const adapter=resolve(root,'.local-qwen/models/image-stitch-v1.gguf');

if(args.includes('--serve')){
 for(const f of [model,mmproj,adapter])if(!existsSync(f))throw Error(`Missing ${f}. Complete local adapter setup first.`);
 const child=spawn(resolve(root,'.local-qwen/runtime/llama-b12119/llama-server'),[
  '--model',model,'--mmproj',mmproj,'--lora',adapter,'--host','127.0.0.1',
  '--port','8197','--alias','beadform-image-stitch-v1','--ctx-size','4096',
  '--n-gpu-layers','0','--no-mmproj-offload','--parallel','1',
  '--cors-origins','http://127.0.0.1:8197',
 ],{stdio:'inherit'});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
 child.on('exit',code=>process.exitCode=code??1);
}else if(prompt){
 const health=await fetch(`${base}/health`).catch(()=>{throw Error('Start the local model first: node local-image-qwen.mjs --serve');});
 if(!health.ok)throw Error('Model is still loading; try again when its log says ready.');
 // Verify the active runtime has the adapter, rather than silently calling a base model.
 const adapterResponse=await fetch(`${base}/lora-adapters`);
 if(!adapterResponse.ok)throw Error('Cannot verify the active adapter.');
 const active=await adapterResponse.json();
 if(!active.some(a=>a.path===adapter&&a.scale===1))throw Error('Expected trained adapter is not active. Refusing base-model inference.');
 const content=[{type:'text',text:prompt}];
 if(image){
  const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[extname(image).toLowerCase()];
  if(!mime)throw Error('Use a PNG, JPEG or WebP image.');
  const prepared=spawnSync(resolve(root,'.local-qwen/venv/bin/python'),[resolve(root,'training/prepare_local_image.py'),resolve(image)],{maxBuffer:1024*1024});
  if(prepared.status!==0)throw Error(`Image preparation failed: ${prepared.stderr?.toString()}`);
  content.unshift({type:'image_url',image_url:{url:`data:image/png;base64,${prepared.stdout.toString('base64')}`}});
 }
 const response=await fetch(`${base}/v1/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
  model:'beadform-image-stitch-v1',messages:[{role:'system',content:isScene?sceneSystem:config.system},{role:'user',content}],
  ...(isScene?{lora:[{id:0,scale:0}]}:{}),
  temperature:0,max_tokens:isScene?2400:128,response_format:{type:'json_schema',json_schema:{name:isScene?'scene':'recipe',strict:true,schema:isScene?sceneSchema:config.schema}},
 })});
 if(!response.ok)throw Error(`Local generation failed: ${response.status} ${await response.text()}`);
 const result=await response.json();
 if(result.choices[0].finish_reason==='length')throw Error('The geometry proposal was incomplete. Try a simpler design.');
 const recipe=JSON.parse(result.choices[0].message.content);
 const pattern=isScene?compileVolume(recipe,{source:{kind:'local-qwen-base',adapterApplied:false}}):compileRecipe(recipe);
 const out=resolve(flag('--out')||resolve(root,'.local-qwen/outputs',new Date().toISOString().replaceAll(':','-')));
 mkdirSync(out,{recursive:true});
 writeFileSync(resolve(out,'pattern.json'),JSON.stringify(pattern,null,2)+'\n');
 writeFileSync(resolve(out,'generation.json'),JSON.stringify({recipe,prompt,image:image?resolve(image):null,adapter,adapterApplied:!isScene,task:isScene?'3d-geometry-proposal':'image-stitch-v1',quantization:'Q8_0',physicalBeadabilityVerified:false},null,2)+'\n');
 if(!pattern.needsClarification)writeFileSync(resolve(out,'bead-chart.svg'),isScene?volumeSvg(pattern):patternSvg(pattern));
 console.log(JSON.stringify({recipe,beadCount:pattern.beadCount,passages:pattern.passagePreference,needsClarification:pattern.needsClarification??false,output:out},null,2));
}else{
 console.log('Start model: node local-image-qwen.mjs --serve\nGenerate: node local-image-qwen.mjs --image reference.png --prompt "Make a flat triangle, foundation 6 beads, 4 rows."');
}
