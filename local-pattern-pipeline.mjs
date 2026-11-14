import {compileRecipe,patternSvg} from './stitch-programs.mjs';
import {catalog,fromCatalog,sceneSystem,sceneSchema,compileVolume,volumeSvg} from './local-3d-planner.mjs';
import {selectTrainedStitch,activeTrainedAdapter,userContent} from './local-trained-selector.mjs';
import {checkPattern} from './pattern-checker.mjs';

export async function generateCheckedPattern({prompt,image,mode='flat',template,requestedDimensions,fetchImpl=fetch,selectImpl=selectTrainedStitch}){
 let selectionPrompt=prompt;
 if(template){
  const entry=catalog.find(e=>e.id===template);if(mode!=='volume'||!entry)throw Error('Choose a listed 3D starter.');
  selectionPrompt+='\nThe user selected the saved CRAW starter "'+entry.title+'". Its existing construction is CRAW. Recommend a stitch, but always attempt this saved CRAW construction. Any different recommendation will be disclosed.';
 }
 const selection=await selectImpl({prompt:selectionPrompt,image,mode,fetchImpl});
 if(requestedDimensions)selection.requestedDimensions=requestedDimensions;
 let pattern,svg;
 try{
  if(mode==='flat'){
   const recipe=bestEffortRecipe(selection.recipe||{},requestedDimensions);
   pattern=compileRecipe(recipe);
   if(['stitch','shape','width','rows'].some(key=>recipe[key]!==selection.recipe?.[key]))pattern.approximation={selectedRecipe:selection.recipe,compiledRecipe:recipe,message:'Used the nearest supported flat recipe to produce a best-effort draft.'};
  }
  else if(template)pattern=fromCatalog(template);
  else{
   const active=await activeTrainedAdapter({fetchImpl});
   let lastError;
   for(let attempt=0;attempt<2;attempt++){
    const request=prompt+(lastError?'\nThe previous geometry could not compile: '+lastError.message+'\nTry again with fewer, thicker, overlapping solid parts while preserving the requested subject.':'');
    try{
     const response=await fetchImpl('http://127.0.0.1:8197/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'beadform-image-stitch-v1',messages:[{role:'system',content:sceneSystem},{role:'user',content:userContent(request,image)}],lora:[{id:active.id,scale:0}],temperature:0,max_tokens:2400,response_format:{type:'json_schema',json_schema:{name:'geometry_only',strict:true,schema:sceneSchema}}})});
     if(!response.ok)throw Error('The geometry proposal failed.');
     const result=await response.json();if(result.choices?.[0]?.finish_reason==='length')throw Error('The geometry proposal was incomplete.');
     pattern=compileVolume(JSON.parse(result.choices[0].message.content),{source:{kind:'local-qwen-base',adapterApplied:false,role:'geometry-only'}});
     break;
    }catch(e){lastError=e;}
   }
   if(!pattern)throw lastError;
  }
  const checker=checkPattern(pattern,{selection});
  checker.advisoryOnly=true;
  if(!checker.passed||pattern.approximation)checker.status='needs-review';
  pattern.stitchSelection=selection;pattern.checker=checker;
  svg=mode==='volume'?volumeSvg(pattern):patternSvg(pattern);
  return {pattern,svg,selection,checker};
 }catch(e){
  const checker=checkPattern(null,{selection});checker.advisoryOnly=true;checker.issues.unshift({code:'compilation_failed',severity:'error',message:e.message});
  return {pattern:null,svg:null,selection,checker};
 }
}

// Keep the model's original recommendation on selection; disclose any compiler adaptation.
function bestEffortRecipe(input={},dimensions){
 const stitch=['brick','peyote','raw','square','ladder'].includes(input.stitch)?input.stitch:'brick';
 const bounded=(value,fallback,min)=>Number.isFinite(value)&&value>0?Math.max(min,Math.min(12,Math.round(value))):fallback;
 let width=bounded(dimensions?.width??input.width,6,2),rows=bounded(dimensions?.rows??input.rows,4,2);
 if(stitch==='ladder')return {stitch,shape:'strip',width,rows:1};
 if(stitch==='peyote'&&width%2)width=width<12?width+1:width-1;
 const shape=stitch==='brick'&&input.shape==='triangle'?'triangle':'rectangle';
 if(shape==='triangle'){width=Math.max(3,width);rows=Math.min(rows,width-1);}
 return {stitch,shape,width,rows};
}
