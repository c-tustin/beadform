import {compileRecipe,patternSvg} from './stitch-programs.mjs';
import {catalog,fromCatalog,sceneSystem,sceneSchema,compileVolume,volumeSvg} from './local-3d-planner.mjs';
import {selectTrainedStitch,activeTrainedAdapter,userContent} from './local-trained-selector.mjs';
import {checkStitchSelection,checkPattern} from './pattern-checker.mjs';

export async function generateCheckedPattern({prompt,image,mode='flat',template,requestedDimensions,fetchImpl=fetch,selectImpl=selectTrainedStitch}){
 let selectionPrompt=prompt;
 if(template){
  const entry=catalog.find(e=>e.id===template);if(mode!=='volume'||!entry)throw Error('Choose a listed 3D starter.');
  selectionPrompt+='\nThe user selected the saved CRAW starter "'+entry.title+'". Its existing construction is CRAW. Check that requested technique; if you select a different stitch this starter must be rejected, not relabeled.';
 }
 const selection=await selectImpl({prompt:selectionPrompt,image,mode,fetchImpl});
 if(requestedDimensions)selection.requestedDimensions=requestedDimensions;
 // Never ask a base model to replace an unresolved trained stitch decision.
 const gate=checkStitchSelection(selection,{mode});
 if(!gate.passed)return {pattern:null,svg:null,selection,checker:checkPattern(null,{selection})};
 let pattern,svg;
 try{
  if(mode==='flat')pattern=compileRecipe(selection.recipe);
  else if(template)pattern=fromCatalog(template);
  else{
   const active=await activeTrainedAdapter({fetchImpl});
   const response=await fetchImpl('http://127.0.0.1:8197/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'beadform-image-stitch-v1',messages:[{role:'system',content:sceneSystem},{role:'user',content:userContent(prompt,image)}],lora:[{id:active.id,scale:0}],temperature:0,max_tokens:2400,response_format:{type:'json_schema',json_schema:{name:'geometry_only',strict:true,schema:sceneSchema}}})});
   if(!response.ok)throw Error('The geometry proposal failed.');
   const result=await response.json();if(result.choices?.[0]?.finish_reason==='length')throw Error('The geometry proposal was incomplete.');
   pattern=compileVolume(JSON.parse(result.choices[0].message.content),{source:{kind:'local-qwen-base',adapterApplied:false,role:'geometry-only'}});
  }
  const checker=checkPattern(pattern,{selection});
  if(!checker.passed)return {pattern:null,svg:null,selection,checker};
  pattern.stitchSelection=selection;pattern.checker=checker;
  svg=mode==='volume'?volumeSvg(pattern):patternSvg(pattern);
  return {pattern,svg,selection,checker};
 }catch(e){
  const checker=checkPattern(null,{selection});checker.issues.unshift({code:'compilation_failed',severity:'error',message:e.message});
  return {pattern:null,svg:null,selection,checker};
 }
}
