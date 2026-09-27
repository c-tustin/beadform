// Local-only Ollama bridge; no API keys or uploaded images leave this computer.
export const localModel=()=>process.env.OLLAMA_MODEL||'qwen3-vl:4b';
export async function ollamaStatus(model,{fetchImpl=fetch}={}){
 try{const r=await fetchImpl('http://127.0.0.1:11434/api/show',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model}),signal:AbortSignal.timeout(3000)});if(!r.ok)return false;const d=await r.json();return d.capabilities?.includes('vision')===true;}catch{return false;}
}
export function ollamaBridge(fetchImpl){return async(_url,options)=>{
 const p=JSON.parse(options.body),messages=[{role:'system',content:p.instructions}];
 for(const message of p.input){
  // Keep each reference's description beside its image, distinct from the requested subject.
  let pending=null;
  for(const item of message.content){
   if(item.type==='input_text'){pending={role:'user',content:item.text};messages.push(pending);}
   else if(item.type==='input_image'){if(!pending)throw Error('missing image description');(pending.images??=[]).push(item.image_url.split(',')[1]);}
  }
 }
 let response;
 try{response=await fetchImpl('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:p.model,messages,stream:false,think:false,format:p.text.format.schema,options:{temperature:0.2,num_ctx:16384,num_predict:11000}}),signal:options.signal});}
 catch(e){if(e.name==='AbortError')throw e;throw Object.assign(Error('start ollama and download your qwen vision model, then try again.'),{status:503});}
 if(!response.ok)return response;
 const d=await response.json();
 if(d.error)throw Object.assign(Error('ollama could not run this model. check its terminal output and available memory.'),{status:502});
 return {ok:true,json:async()=>({status:d.done_reason==='length'?'incomplete':'completed',output:[{content:[{type:'output_text',text:d.message?.content||''}]}]})};
};}
