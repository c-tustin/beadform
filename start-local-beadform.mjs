import {spawn,execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const children=[];
async function alive(url){try{return (await fetch(url,{signal:AbortSignal.timeout(1500)})).ok;}catch{return false;}}
for(const [url,file] of [['http://127.0.0.1:8197/health','local-image-qwen.mjs'],['http://127.0.0.1:8198/','local-image-workbench.mjs']]){
 if(!await alive(url)){
  const child=spawn(process.execPath,[root+file,...(file==='local-image-qwen.mjs'?['--serve']:[])],{cwd:root,stdio:'inherit'});
  child.on('error',e=>console.error(e.message));children.push(child);
 }
}
let ready=false;
for(let i=0;i<120;i++){
 if(await alive('http://127.0.0.1:8197/health')&&await alive('http://127.0.0.1:8198/')){ready=true;break;}
 await new Promise(r=>setTimeout(r,1000));
}
if(ready){console.log('Open http://127.0.0.1:8198');if(process.platform==='darwin'&&!process.env.BEADFORM_NO_OPEN)execFile('open',['http://127.0.0.1:8198']);}
else console.error('The model is still unavailable. Check the server messages above.');
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{for(const child of children)child.kill(sig);});
