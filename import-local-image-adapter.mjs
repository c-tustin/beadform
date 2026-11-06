// Import the private final Colab adapter without changing the downloaded originals.
import {mkdirSync, readFileSync, copyFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('.',import.meta.url));
const source=resolve(process.argv[2]||resolve(homedir(),'Downloads'));
const manifest=JSON.parse(readFileSync(new URL('./training/local-image-runtime.json',import.meta.url)));
const weight=resolve(source,'adapter_model.safetensors');
const config=resolve(source,'adapter_config.json');
for(const path of [weight,config])if(!existsSync(path))throw Error(`Still needed: ${path}. Download both final adapter files from Drive.`);
const sha=createHash('sha256').update(readFileSync(weight)).digest('hex');
if(sha!==manifest.adapter_source_sha256)throw Error('This is not the audited image-trained adapter. No files were imported.');
const settings=JSON.parse(readFileSync(config));
if(settings.r!==16||settings.lora_alpha!==32||settings.use_dora||settings.use_rslora)throw Error('Unexpected adapter configuration. No files were imported.');
const dest=resolve(root,'.local-qwen/adapter');
mkdirSync(dest,{recursive:true});
copyFileSync(weight,resolve(dest,'adapter_model.safetensors'));
copyFileSync(config,resolve(dest,'adapter_config.json'));
const result=spawnSync(resolve(root,'.local-qwen/venv/bin/python'),[
 resolve(root,'training/convert_local_image_adapter.py'),dest,resolve(root,'.local-qwen/models/image-stitch-v1.gguf'),
],{stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
console.log('Adapter converted. Start it with: node local-image-qwen.mjs --serve');
