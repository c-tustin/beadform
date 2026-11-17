import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const files=new Map([['/',['index.html','text/html']],['/style.css',['style.css','text/css']],['/app.js',['app.js','text/javascript']]]);
createServer((req,res)=>{const file=files.get(req.url);if(req.method!=='GET'||!file){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8','Cache-Control':'no-store'});res.end(readFileSync(new URL('./app/preview/'+file[0],import.meta.url)));}).listen(8199,'127.0.0.1',()=>console.log('iPhone design preview: http://127.0.0.1:8199'));
