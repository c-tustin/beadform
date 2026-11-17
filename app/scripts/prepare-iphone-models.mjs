// Validate existing weights before preparing a folder for transfer using Files.
import {createReadStream,existsSync,mkdirSync,copyFileSync,constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const manifest=JSON.parse(readFileSync(resolve(root,'training/local-image-runtime.json')));
const source=resolve(process.argv[2]||resolve(root,'.local-qwen/models'));
const output=resolve(root,'.local-qwen/iphone-transfer');
const files=[['Qwen3VL-2B-Instruct-Q8_0.gguf',manifest.files['Qwen3VL-2B-Instruct-Q8_0.gguf']],['image-stitch-v1.gguf',manifest.converted_adapter_sha256]];
for(const [name,expected] of files){
 const hash=createHash('sha256');for await(const data of createReadStream(resolve(source,name)))hash.update(data);
 if(hash.digest('hex')!==expected)throw Error('Hash mismatch: '+name);
}
mkdirSync(output,{recursive:true});
for(const [name] of files){
 const target=resolve(output,name);
 if(existsSync(target)){
  const hash=createHash('sha256');for await(const data of createReadStream(target))hash.update(data);
  if(hash.digest('hex')!==files.find(f=>f[0]===name)[1])throw Error('Existing transfer file differs: '+name);
 }else copyFileSync(resolve(source,name),target,constants.COPYFILE_EXCL|constants.COPYFILE_FICLONE);
}
console.log('Verified model and adapter ready for transfer: '+output);
console.log('AirDrop these two files to the iPhone, save them in Files, then import them in the app’s Model tab.');
