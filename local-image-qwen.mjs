// Local image-stitch-v1 inference. No hosted provider or base-model fallback.
import {writeFileSync, mkdirSync, existsSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {generateCheckedPattern} from './local-pattern-pipeline.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
const args=process.argv.slice(2);
const flag=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const image=flag('--image'), prompt=flag('--prompt');
const isScene=args.includes('--scene');
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
 const mode=isScene?'volume':'flat';
 const requestedDimensions=mode==='flat'&&flag('--width')&&flag('--rows')?{width:Number(flag('--width')),rows:Number(flag('--rows'))}:undefined;
 const result=await generateCheckedPattern({prompt,image,mode,template:flag('--template'),requestedDimensions});
 const out=resolve(flag('--out')||resolve(root,'.local-qwen/outputs',new Date().toISOString().replaceAll(':','-')));
 mkdirSync(out,{recursive:true});
 writeFileSync(resolve(out,'result.json'),JSON.stringify(result,null,2)+'\n');
 writeFileSync(resolve(out,'selection.json'),JSON.stringify(result.selection,null,2)+'\n');
 writeFileSync(resolve(out,'checker.json'),JSON.stringify(result.checker,null,2)+'\n');
 writeFileSync(resolve(out,'pattern.json'),JSON.stringify(result.pattern,null,2)+'\n');
 if(result.svg)writeFileSync(resolve(out,'bead-chart.svg'),result.svg);
 else rmSync(resolve(out,'bead-chart.svg'),{force:true});
 writeFileSync(resolve(out,'generation.json'),JSON.stringify({prompt,image:image?resolve(image):null,selection:result.selection,checker:result.checker,task:mode==='volume'?'trained-stitch-then-3d-geometry':'image-stitch-v1',quantization:'Q8_0',physicalBeadabilityVerified:false},null,2)+'\n');
 console.log(JSON.stringify({selectedStitch:result.selection.recipe.stitch,checker:result.checker.status,beadCount:result.pattern?.beadCount,output:out},null,2));
}else{
 console.log('Start model: node local-image-qwen.mjs --serve\nGenerate: node local-image-qwen.mjs --image reference.png --prompt "Make a flat triangle, foundation 6 beads, 4 rows."');
}
