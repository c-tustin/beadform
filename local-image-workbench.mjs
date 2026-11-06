import {createServer} from 'node:http';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {catalog,fromCatalog,volumeSvg} from './local-3d-planner.mjs';
const run=promisify(execFile),root=fileURLToPath(new URL('.',import.meta.url));
const origin='http://127.0.0.1:8198',latest=resolve(root,'.local-qwen/outputs/workbench-latest.json');
const staticFiles=new Map([
 ['/', ['local-workbench/index.html','text/html; charset=utf-8']],
 ['/studio.js',['local-workbench/studio.js','text/javascript; charset=utf-8']],
 ['/studio.css',['local-workbench/studio.css','text/css; charset=utf-8']],
 ['/thread-diagram.js',['thread-diagram.js','text/javascript; charset=utf-8']],
]);
let busy=false;
createServer(async(req,res)=>{
 const json=(code,obj)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
 if(req.headers.host!=='127.0.0.1:8198')return json(403,{error:'Use the localhost URL.'});
 if(req.method==='GET'){
  const file=staticFiles.get(req.url);if(file){res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store'});return res.end(readFileSync(resolve(root,file[0])));}
  if(req.url==='/catalog')return json(200,catalog);
  if(req.url==='/latest')return json(200,existsSync(latest)?JSON.parse(readFileSync(latest)):null);
 }
 if(req.method!=='POST'||req.url!=='/generate')return json(404,{error:'Not found.'});
 if(req.headers.origin!==origin)return json(403,{error:'Use the local Beadform page.'});
 if(busy)return json(409,{error:'A pattern is already generating. Please wait.'});
 busy=true;
 try{
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>15*1024*1024)throw Error('Image too large.');chunks.push(chunk);}
  const data=JSON.parse(Buffer.concat(chunks).toString());
  if(typeof data.prompt!=='string'||!data.prompt.trim()||data.prompt.length>4000)throw Error('Enter a description of 1–4000 characters.');
  if(data.mode!==undefined&&!['flat','volume'].includes(data.mode))throw Error('Choose a flat or 3D pattern.');
  const out=resolve(root,'.local-qwen/outputs',Date.now().toString());mkdirSync(out,{recursive:true});
  let pattern,svg;
  if(data.mode==='volume'&&data.template){
   if(data.image)throw Error('Choose “New design with local Qwen” to use an image. Starters use their saved geometry.');
   pattern=fromCatalog(data.template);svg=volumeSvg(pattern);
   writeFileSync(resolve(out,'pattern.json'),JSON.stringify(pattern));writeFileSync(resolve(out,'bead-chart.svg'),svg);
  }else{
   const dimensions=data.mode==='flat'?`\nDimensions: starter width ${data.width}; rows ${data.rows}.`:'';
   if(data.mode==='flat'&&(!Number.isInteger(data.width)||!Number.isInteger(data.rows)||data.width<2||data.width>12||data.rows<1||data.rows>12))throw Error('Use width 2–12 and rows 1–12.');
   const args=[resolve(root,'local-image-qwen.mjs'),'--prompt',data.prompt+dimensions,'--out',out];
   if(data.mode==='volume')args.push('--scene');
   if(data.image){const m=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data.image);if(!m)throw Error('Use a PNG, JPEG or WebP image.');const path=resolve(out,'reference.'+m[1]);writeFileSync(path,Buffer.from(m[2],'base64'));args.push('--image',path);}
   await run(process.execPath,args,{cwd:root,timeout:600000,maxBuffer:1024*1024});
   pattern=JSON.parse(readFileSync(resolve(out,'pattern.json')));
   svg=pattern.needsClarification?null:readFileSync(resolve(out,'bead-chart.svg'),'utf8');
  }
  const result={pattern,svg,prompt:data.prompt};if(!pattern.needsClarification)writeFileSync(latest,JSON.stringify(result));
  json(200,result);
 }catch(e){
  const message=String(e.stderr||e.message),reason=message.match(/Error: ([^\n]+)/)?.[1]||e.message;
  json(400,{error:String(reason).slice(0,500)});
 }finally{busy=false;}
}).listen(8198,'127.0.0.1',()=>console.log('Beadform local studio: '+origin));
