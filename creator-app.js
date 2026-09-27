(() => {
 'use strict';
 const T=window.Beadform3D,S=window.BeadShape,U=window.Beadform.ui,$=id=>document.getElementById(id),state=T.state;
 let trace=null,raster=null,maskUndo=[],paint=false,paintMode='add',lastPaint=null,request=null,revision=0,serviceReady=false;
 const generationButtons=['vGenerateText','vInterpretImage','vBuildImage'];
 function status(message,error=false){$('vGenerationStatus').textContent=message;$('vGenerationStatus').classList.toggle('error',error);}
 function busy(on){$('makingAnimation').hidden=!on;document.body.classList.toggle('is-making',on);generationButtons.forEach(id=>$(id).disabled=on);$('vCancelGenerate').hidden=!on;}
 function inputMode(mode){state.inputMode=mode;for(const [id,m]of [['vFromText','text'],['vFromImage','image']]){$(id).classList.toggle('active',mode===m);$(id).setAttribute('aria-pressed',mode===m);}$('vTextInput').hidden=mode!=='text';$('vImageInput').hidden=mode!=='image';$('referencePreview').hidden=!state.sourceData;$('outlineAdvanced').hidden=true;if(mode==='image'&&state.construction==='lattice'&&!trace&&state.source)makeTrace();}
 function toRaster(){if(!state.source)throw Error('Choose a reference image first.');const im=state.source,scale=Math.min(1,96/Math.max(im.naturalWidth,im.naturalHeight)),cv=document.createElement('canvas');cv.width=Math.max(2,Math.round(im.naturalWidth*scale));cv.height=Math.max(2,Math.round(im.naturalHeight*scale));const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0,cv.width,cv.height);return {width:cv.width,height:cv.height,data:c.getImageData(0,0,cv.width,cv.height).data};}
 function makeTrace(){try{raster=toRaster();trace=S.imageData(raster.width,raster.height,raster.data,+$('vTraceTolerance').value);maskUndo=[];showTrace();return true;}catch(e){status(e.message,true);return false;}}
 function showTrace(){if(!trace)return;$('vMaskTools').hidden=false;const cv=$('vMaskCanvas'),ctx=cv.getContext('2d'),d=trace;cv.width=d.width*4;cv.height=d.height*4;
   ctx.clearRect(0,0,cv.width,cv.height);for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++){const i=y*d.width+x;ctx.fillStyle=`rgb(${d.rgb.slice(i*3,i*3+3).join(',')})`;ctx.globalAlpha=d.mask[i]?1:.16;ctx.fillRect(x*4,y*4,4,4);if(!d.mask[i]){ctx.globalAlpha=.18;ctx.fillStyle='#b05583';ctx.fillRect(x*4,y*4,4,4);}}ctx.globalAlpha=1;
   const pct=Math.round(d.mask.filter(Boolean).length/d.mask.length*100);$('vTraceSummary').textContent=`${pct}% of image kept. ${pct>92?'Most of the frame is included; remove the background or use AI interpretation.':'Bright areas are kept; faded pink areas are removed.'}`;$('vMaskUndo').disabled=!maskUndo.length;
 }
 function stroke(e){if(!trace)return;const r=$('vMaskCanvas').getBoundingClientRect(),point=[Math.floor((e.clientX-r.left)/r.width*trace.width),Math.floor((e.clientY-r.top)/r.height*trace.height)];const prev=lastPaint||point,steps=Math.max(1,Math.ceil(Math.hypot(point[0]-prev[0],point[1]-prev[1])));
   for(let q=0;q<=steps;q++){const x=Math.round(prev[0]+(point[0]-prev[0])*q/steps),y=Math.round(prev[1]+(point[1]-prev[1])*q/steps);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=5&&x+dx>=0&&y+dy>=0&&x+dx<trace.width&&y+dy<trace.height)trace.mask[(y+dy)*trace.width+x+dx]=paintMode==='add'?1:0;}
   lastPaint=point;showTrace();
 }
 function applyDesign(design,title,origin){
 state.makerProgress=null;
   const oldSettings=state.settings,oldTitle=state.title,oldConstruction=state.construction;
   state.construction=design.kind==='image'?'lattice':'parts';
   state.settings={...state.settings,shape:'custom',design,routeVersion:2,orderVersion:2,colorSource:'design',beadSize:2};state.title=title.slice(0,70)||'my beaded project';
   if(!T.generate(true)){state.settings=oldSettings;state.title=oldTitle;state.construction=oldConstruction;T.sync();throw Error(state.lastError);}
   state.partsStage=0;state.partsReveal=Infinity;state.view='thread';state.focusStage=false;state.yaw=-28;state.pitch=18;state.zoom=100;state.sourceCustom=true;state.edits=true;T.renderAll();T.setMode('volume');window.BeadJourney?.created();
   const bridgeCount=state.model.cubes.filter(c=>c.support).length;
   status(`${origin}. ${bridgeCount?bridgeCount+' supporting cells connect thin details. ':''}${design.kind==='image'?'The visible outline defines the shape; depth is a rounded estimate.':'Review the proportions and small details before making it.'}`);
 }
 function buildOutline(){try{if(!trace&&!makeTrace())return;const d=JSON.parse(JSON.stringify(S.validateImage(trace)));T.confirmEdits(()=>{try{applyDesign(d,(state.sourceName||'my reference').replace(/\.[^.]+$/,''),'Built from your outline');}catch(e){status(e.message,true);}});}catch(e){status(e.message,true);}}
 async function upload(file){if(!file)return;cancel(false);const token=++revision;busy(true);status('getting your picture ready…');let url;try{
   if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Choose a PNG, JPG, or WebP image.');if(file.size>20*1024*1024)throw Error('Choose an image smaller than 20 MB.');url=URL.createObjectURL(file);const im=await U.loadImage(url);if(im.naturalWidth*im.naturalHeight>60000000)throw Error('Resize the image below 60 megapixels and try again.');const scale=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(im.naturalWidth*scale));cv.height=Math.max(1,Math.round(im.naturalHeight*scale));cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);const data=cv.toDataURL('image/png'),safe=await U.loadImage(data);if(token!==revision)return;
   state.source=safe;state.sourceData=data;state.sourceName=file.name.slice(0,100);state.sourceCustom=true;trace=null;raster=null;T.sync();inputMode('image');if(state.construction==='lattice'&&!trace)makeTrace();status('Picture ready. Add any details, then choose Make from this picture.');
 }catch(e){status(e.message,true);}finally{if(token===revision)busy(false);if(url)URL.revokeObjectURL(url);$('vFileInput').value='';}}
 function cancel(announce=true){revision++;if(request){request.abort();request=null;if(announce)status('Generation cancelled. Your existing project is still here.');}busy(false);}
 async function generateAI(withImage=false){
   const prompt=$('vPrompt').value.trim();if(!prompt&&!withImage){status('Describe the animal or object you would like to make.',true);return;}if(withImage&&!state.source){status('Choose an image first.',true);return;}
   if(!serviceReady){if(window.BeadConnection)await window.BeadConnection.open(()=>generateAI(withImage));else status('Connect your API key to enable text and image generation.',true);return;}
   cancel(false);const token=++revision,originModel=state.model,controller=new AbortController();request=controller;busy(true);status('Interpreting the subject and its proportions…');
   const timeout=setTimeout(()=>controller.abort(),310000);
   try{
     let imageData=null;if(withImage){const im=state.source,cv=document.createElement('canvas'),scale=Math.min(1,768/Math.max(im.naturalWidth,im.naturalHeight));cv.width=Math.max(1,Math.round(im.naturalWidth*scale));cv.height=Math.max(1,Math.round(im.naturalHeight*scale));cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);imageData=cv.toDataURL('image/png');}
     const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,imageData,construction:'parts',buildReferences:window.BeadFinished?.references(prompt)||[],detail:state.settings.detail,depth:state.settings.depth,threadDiameter:state.settings.threadDiameter||.25}),signal:controller.signal});const body=await response.json();if(!response.ok)throw Error(body.error||'The generation service could not complete this project.');if(token!==revision)return;
     const design=S.scene(body.scene);window.BeadParts.build(design,state.settings);if(state.model!==originModel)throw Error('The project changed while generating. Your current project has been kept; please generate again.');
     T.confirmEdits(()=>{try{applyDesign(design,design.title,withImage?'Interpreted your image':'Created from your description');if(design.notes)status($('vGenerationStatus').textContent+' '+design.notes);}catch(e){status(e.message,true);}});
   }catch(e){if(token===revision)status(e.name==='AbortError'?'Generation timed out. Your existing project is unchanged; try again with a simpler description.':e.message,true);}finally{clearTimeout(timeout);if(token===revision){request=null;busy(false);}}
 }
 async function checkService(){if(!/^https?:$/.test(window.location?.protocol||'')){$('vServiceStatus').textContent='Open the included launcher for AI generation, or try an animal below.';return;}
   try{const response=await fetch('/api/status',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error();const d=await response.json();serviceReady=d.ready===true;window.BeadConnection?.setStatus(d);$('vServiceStatus').textContent=serviceReady?'Text + image interpretation is connected.':'connect a model below to enable text + image generation.';}catch(e){$('vServiceStatus').textContent='connect a model below to enable text + image generation.';}
 }
 function projectOpened(d){cancel(false);trace=null;raster=null;maskUndo=[];if(state.settings.design?.kind==='image'){trace=JSON.parse(JSON.stringify(state.settings.design));showTrace();}inputMode(d.creation?.inputMode==='image'?'image':'text');status('Opened your project, including its generated shape and stitch progress.');}
 $('vFromText').onclick=()=>inputMode('text');$('vFromImage').onclick=()=>inputMode('image');$('vUpload').onclick=()=>$('vFileInput').click();$('vFileInput').onchange=e=>upload(e.target.files[0]);$('vBuildImage').onclick=buildOutline;$('vGenerateText').onclick=()=>generateAI(false);$('vInterpretImage').onclick=()=>generateAI(true);$('vCancelGenerate').onclick=()=>cancel();
 $('vTraceTolerance').oninput=()=>$('vTraceValue').value=$('vTraceTolerance').value;$('vTraceTolerance').onchange=makeTrace;
 for(const [id,mode]of [['vMaskAdd','add'],['vMaskRemove','remove']])$(id).onclick=()=>{paintMode=mode;for(const [other,m]of [['vMaskAdd','add'],['vMaskRemove','remove']]){$(other).classList.toggle('active',m===mode);$(other).setAttribute('aria-pressed',m===mode);}};
 $('vMaskUndo').onclick=()=>{if(maskUndo.length){trace.mask=maskUndo.pop();showTrace();}};
 $('vMaskCanvas').addEventListener('pointerdown',e=>{if(e.button!==0||!trace)return;e.preventDefault();maskUndo.push(trace.mask.slice());if(maskUndo.length>20)maskUndo.shift();paint=true;lastPaint=null;$('vMaskCanvas').setPointerCapture?.(e.pointerId);stroke(e);});$('vMaskCanvas').addEventListener('pointermove',e=>{if(paint)stroke(e);});for(const name of ['pointerup','pointercancel'])$('vMaskCanvas').addEventListener(name,()=>{paint=false;lastPaint=null;});
 const oldSource=T.receiveFlatSource;T.receiveFlatSource=()=>{oldSource();if(state.inputMode==='image'&&!trace&&state.source)makeTrace();};
 window.BeadCreator={cancel,makeTrace,buildOutline,applyDesign,upload,generateAI,projectOpened,inputMode,checkService,get trace(){return trace;}};
 inputMode('text');
})();
