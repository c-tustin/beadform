import {createServer} from './server.mjs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
if(process.loadEnvFile){try{process.loadEnvFile(join(here,'.env'));}catch(e){if(e.code!=='ENOENT')console.log('The optional environment file could not be loaded. You can connect your key in the studio.');}}
let port=Number(process.env.PORT||4173);if(!Number.isInteger(port)||port<1024||port>65525)throw Error('Choose a PORT between 1024 and 65525.');
let server;
for(let attempt=0;attempt<10;attempt++,port++){
  server=createServer();try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});break;}catch(e){if(e.code!=='EADDRINUSE')throw e;if(attempt===9)throw Error('The local studio ports are busy. Close an earlier studio window and try again.');}
}
const url=`http://localhost:${port}`;
console.log(`Beadform is running at ${url}`);
console.log(process.env.BEADFORM_PROVIDER==='ollama'?'local qwen selected. keep ollama and this terminal open.':'Choose “Connect generation” in the studio to add your API key. Keep this Terminal window open while using the app.');
if(!process.env.BEADFORM_NO_OPEN){const command=process.platform==='darwin'?'open':process.platform==='win32'?'cmd':'xdg-open',args=process.platform==='win32'?['/c','start','',url]:[url];const child=spawn(command,args,{stdio:'ignore',detached:true});child.on('error',()=>console.log('Open the address above in your browser.'));child.unref();}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
