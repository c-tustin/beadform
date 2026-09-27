import {readFile,writeFile,mkdir,rename,chmod,unlink} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join,dirname} from 'node:path';
import {randomBytes} from 'node:crypto';

export function credentialPath(){
  if(process.env.BEADFORM_CONFIG_PATH)return process.env.BEADFORM_CONFIG_PATH;
  return process.platform==='darwin'?join(homedir(),'Library','Application Support','Beadform','credentials.json'):join(homedir(),'.config','beadform','credentials.json');
}
export function validateKey(key){
  if(typeof key!=='string')throw Object.assign(Error('Paste your OpenAI API key into the private key field.'),{status:400});
  key=key.trim();if(!key.startsWith('sk-')||key.length<20||key.length>2048||/[^\x21-\x7e]/.test(key))throw Object.assign(Error('That does not look like an OpenAI secret API key. Copy the complete key from your API account.'),{status:400});
  return key;
}
export async function readCredentials(file=credentialPath()){
  try{const data=JSON.parse(await readFile(file,'utf8'));return {apiKey:validateKey(data.apiKey),model:typeof data.model==='string'?data.model:'gpt-4.1',verifiedAt:typeof data.verifiedAt==='string'?data.verifiedAt:null};}catch(e){return null;}
}
export async function saveCredentials(data,file=credentialPath()){
  const dir=dirname(file),temp=file+'.'+randomBytes(10).toString('hex')+'.tmp';await mkdir(dir,{recursive:true,mode:0o700});if(process.platform!=='win32')await chmod(dir,0o700);
  try{await writeFile(temp,JSON.stringify({apiKey:validateKey(data.apiKey),model:data.model,verifiedAt:data.verifiedAt}),{mode:0o600,flag:'wx'});await rename(temp,file);if(process.platform!=='win32')await chmod(file,0o600);}finally{await unlink(temp).catch(()=>{});}
}
export async function verifyKey(apiKey,{model='gpt-4.1',fetchImpl=fetch,signal}={}){
  apiKey=validateKey(apiKey);let response;
  try{response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,store:false,input:'Reply with READY.',max_output_tokens:16}),signal});}catch(e){throw Object.assign(Error(e.name==='AbortError'?'The connection check timed out. Try again.':'Could not reach OpenAI. Check your connection and try again.'),{status:502});}
  if(!response.ok){let code='';try{code=(await response.json()).error?.code||'';}catch(e){}
    const message=response.status===401?'OpenAI rejected this key. Create a new secret key and try again.':response.status===429&&code==='insufficient_quota'?'Your API account has no available quota. Add API billing or credits, then connect again.':response.status===429?'OpenAI is rate limiting this account. Wait a moment and try again.':response.status===403?'This key cannot access the selected model. Check its project permissions.':response.status===404?'The selected model is unavailable to this project. Check the server model setting.':'OpenAI could not complete the connection check. Check the key permissions and try again.';
    throw Object.assign(Error(message),{status:422,code:code==='insufficient_quota'?'billing_required':'connection_failed'});
  }
  const data=await response.json();if(!data.id||!Array.isArray(data.output))throw Object.assign(Error('OpenAI returned an unexpected connection-check response.'),{status:502});
  return {verifiedAt:new Date().toISOString()};
}
