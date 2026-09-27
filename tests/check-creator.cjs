const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ids,root,until,createCanvas,sharp}=require('./test-dom.cjs');
const $=id=>ids.get(id);
function shapeImage(type){const cv=createCanvas(160,160),c=cv.getContext('2d');c.clearRect(0,0,160,160);c.fillStyle='#80b884';if(type==='mushroom'){c.beginPath();c.ellipse(80,71,57,49,0,Math.PI,2*Math.PI);c.lineTo(137,80);c.lineTo(23,80);c.closePath();c.fill();c.fillRect(65,78,30,62);}else {c.beginPath();for(let i=0;i<10;i++){const r=i%2?25:65,a=i*Math.PI/5-Math.PI/2,x=80+Math.cos(a)*r,y=80+Math.sin(a)*r;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.fill();}return cv;}
(async()=>{
 await until(()=>global.Beadform?.state.geometry&&global.Beadform3D?.state.model);
 const T=Beadform3D,C=BeadCreator,s=T.state;s.construction='lattice';BeadPartsStudio.refresh();
 assert.equal(s.settings.beadSize,2);assert.equal(s.settings.threadDiameter,.25);assert.equal(s.validation.valid,true);assert.ok(s.validation.maxPasses<=6);
 await $('vThreadView').click();assert.equal(s.view,'thread');assert.ok($('vViewport').innerHTML.includes('data-stage-card'));
 assert.ok(s.model.stages.length<s.model.steps.length/10);assert.equal(s.model.stages.flatMap(st=>st.ids).length,s.model.nodes.length);
 T.goStage(0);const stage=T.currentStage();assert.ok(stage.ids.length>30);assert.equal(($('vViewport').innerHTML.match(/data-stage-bead=/g)||[]).length,stage.nodeIds.length);
 assert.deepEqual([...$('vViewport').innerHTML.matchAll(/data-stage-pass="([^"]+)"/g)].map(m=>m[1]),stage.operations.map(o=>o.id));
 await $('vRewindRing').click();assert.equal(s.stageReveal,0);assert.equal(($('vViewport').innerHTML.match(/data-stage-pass=/g)||[]).length,0);
 await $('vNextMove').click();assert.equal(s.stageReveal,1);assert.equal(($('vViewport').innerHTML.match(/data-stage-pass=/g)||[]).length,1);
 T.setView('step');$('vBuiltOnly').checked=true;await $('vBuiltOnly').event('change');assert.equal(new Set([...$('vViewport').innerHTML.matchAll(/data-vbead="([^"]+)"/g)].map(m=>m[1])).size,1);
 T.setStageReveal(stage.operations.length);assert.equal(new Set([...$('vViewport').innerHTML.matchAll(/data-vbead="([^"]+)"/g)].map(m=>m[1])).size,stage.ids.length);
 T.goStage(1);assert.equal(s.stage,1);assert.equal(s.step,T.currentStage().end);await $('vAllStages').click();assert.equal(s.focusStage,false);assert.ok($('vViewport').innerHTML.includes('data-stage-card'));
 T.setReveal(0);assert.equal(s.reveal,0);T.goStep(2);assert.equal(s.reveal,Infinity);s.builtOnly=false;
 const first=new File([shapeImage('mushroom').toBuffer('image/png')],'my-mushroom.png',{type:'image/png'});
 await C.upload(first);assert.ok(C.trace.mask.includes(0)&&C.trace.mask.includes(1));assert.equal(s.inputMode,'image');await $('vBuildImage').click();assert.equal(s.settings.shape,'custom');assert.equal(s.settings.design.kind,'image');assert.ok(s.validation.valid);assert.ok(s.model.size[1]>s.model.size[2]);const mushroom=s.model.nodes.map(n=>n.p.join(',')).join(';');
 fs.writeFileSync(path.join(__dirname,'mushroom-reference.png'),shapeImage('mushroom').toBuffer('image/png'));
 fs.writeFileSync(path.join(__dirname,'mushroom-3d.svg'),T.sheetSVG().svg);await sharp(Buffer.from(T.sheetSVG().svg)).resize({width:1000}).png().toFile(path.join(__dirname,'mushroom-3d.png'));
 const priorMask=C.trace.mask.slice();await $('vMaskRemove').click();await $('vMaskCanvas').event('pointerdown',{clientX:500,clientY:450,pointerId:1});await $('vMaskCanvas').event('pointerup');assert.notDeepEqual(C.trace.mask,priorMask);await $('vMaskUndo').click();assert.deepEqual(C.trace.mask,priorMask);
 const saved=T.project();s.edits=false;await C.upload(new File([shapeImage('star').toBuffer('image/png')],'star.png',{type:'image/png'}));await $('vBuildImage').click();assert.notEqual(s.model.nodes.map(n=>n.p.join(',')).join(';'),mushroom,'Same colors, different outlines must change physical geometry.');
 s.edits=false;await T.importProject({size:JSON.stringify(saved).length,text:async()=>JSON.stringify(saved)});assert.equal(s.model.nodes.map(n=>n.p.join(',')).join(';'),mushroom);assert.deepEqual(s.settings.design.mask,saved.settings.design.mask);assert.equal(s.validation.valid,true);
 T.goStep(12);T.setReveal(2);const paused=T.project();s.edits=false;await T.importProject({size:50000,text:async()=>JSON.stringify(paused)});assert.equal(s.step,12);assert.equal(s.reveal,2);
 const before=s.model;await T.importProject({size:100,text:async()=>JSON.stringify({...saved,settings:{...saved.settings,design:{...saved.settings.design,mask:[1]}}})});assert.equal(s.model,before);assert.ok($('toast').textContent.includes('silhouette'));
 const byId=s.model.nodes[30].id,color=s.colors[30];s.activeColor=(color+1)%s.palette.length;if(s.palette.length>1){T.selectBead(byId,true);assert.notEqual(s.colors[30],color);await $('vUndo').click();assert.equal(s.colors[30],color);}
 T.goStep(0);const sheet=T.threadSheetSVG(0);assert.ok(sheet.svg.includes('marker-end'));fs.writeFileSync(path.join(__dirname,'thread-pattern.svg'),sheet.svg);await sharp(Buffer.from(sheet.svg)).resize({width:1100}).png().toFile(path.join(__dirname,'thread-pattern.png'));
 for(const st of s.model.steps){const diagram=T.ringSVG(st,500,true),ids=[...diagram.matchAll(/data-through-hole="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(ids,st.ops.map(o=>o.id),'Diagram must show the actual ordered operations.');}
 assert.ok(T.textGuide().includes('0.25 mm'));assert.ok(T.textGuide().includes('MOVE THROUGH'));assert.equal(T.beadCSV().split('\r\n').length,s.model.nodes.length+1);
 await $('vExport').click();assert.ok($('vOutThread'));$('modal').close();T.printPattern();assert.equal(($('printArea').innerHTML.match(/class="v-stage-print"/g)||[]).length,s.model.stages.length);assert.ok(!$('printArea').innerHTML.includes('v-print-layer'));assert.ok(!$('printArea').innerHTML.includes('v-thread-cell'));
 // No API service must produce an explicit state, never silently pick an animal.
 $('vPrompt').value='a giraffe with a long neck';const original=s.model;await C.generateAI(false);assert.equal(s.model,original);assert.ok($('modalBody').innerHTML.includes('start.command'));assert.ok(!$('vApiKey'));$('modal').close();
 await $('modeFlat').click();assert.equal(Beadform.state.settings.beadDiameter,2);assert.ok(Beadform.state.geometry.nodes.length>0);await $('modeVolume').click();assert.equal(s.model,original);
 await $('helpBtn').click();assert.ok($('modalBody').innerHTML.includes('No third-party'));assert.ok($('modalBody').innerHTML.includes('physical sample'));
 const fixtures=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','test-subjects.json'),'utf8')),realFetch=global.fetch;let sent;
 global.location={protocol:'http:'};global.fetch=async(url,options)=>{if(url==='/api/status')return {ok:true,json:async()=>({ready:true})};sent=JSON.parse(options.body);return {ok:true,json:async()=>({scene:fixtures.giraffe})};};
 await C.checkService();s.edits=false;$('vPrompt').value='a giraffe with a long neck';await C.generateAI(false);assert.equal(s.settings.design.kind,'scene');assert.equal(s.title,fixtures.giraffe.title);assert.equal(sent.imageData,null);assert.ok(s.validation.valid);assert.notEqual(s.model,original);
 s.edits=false;await C.generateAI(true);assert.ok(sent.imageData.startsWith('data:image/png;base64,'));const interpreted=s.model;
 global.fetch=async()=>({ok:true,json:async()=>({scene:{title:'broken',parts:[]}})});s.edits=false;await C.generateAI(false);assert.equal(s.model,interpreted);assert.ok($('vGenerationStatus').textContent.includes('usable shape'));global.fetch=realFetch;
 const eyed=s.model.nodes.filter(n=>n.landmark&&BeadEngine.lab(BeadEngine.rgb(s.model.palette[s.model.colors[n.index]]))[0]<.35);assert.equal(eyed.length,2);assert.ok(eyed.every(n=>BeadEngine.lab(BeadEngine.rgb(s.palette[s.colors[n.index]]))[0]<.35));
 const n=s.model.nodes[5],c=s.colors[n.index];s.activeColor=(c+1)%s.palette.length;T.selectBead(n.id,true);assert.notEqual(s.colors[n.index],c);await $('vUndo').click();assert.equal(s.colors[n.index],c);
 fs.writeFileSync(path.join(__dirname,'giraffe-3d.svg'),T.sheetSVG().svg);await sharp(Buffer.from(T.sheetSVG().svg)).resize({width:1000}).png().toFile(path.join(__dirname,'giraffe-3d.png'));
 // The local connection wizard clears the password and resumes the requested design.
 global.location={protocol:'http:',hostname:'localhost'};let connected=false,setupSent=null;
 global.fetch=async(url,options)=>{
  if(url==='/api/status')return {ok:true,json:async()=>({ready:connected})};
  if(url==='/api/setup'&&!options?.method)return {ok:true,json:async()=>({token:'a'.repeat(64),configured:connected})};
  if(url==='/api/setup'){setupSent=JSON.parse(options.body);assert.equal(options.headers['X-Beadform-Setup'],'a'.repeat(64));connected=true;return {ok:true,json:async()=>({ready:true})};}
  return {ok:true,json:async()=>({scene:fixtures.teapot})};
 };
 await C.checkService();s.edits=false;$('vPrompt').value='a green teapot';await C.generateAI(false);const password=$('vApiKey');assert.equal(password.type,'password');
 password.value='sk-synthetic-ui-test-key-only';await $('vSaveApiKey').click();assert.equal(password.value,'');assert.equal(setupSent.apiKey,'sk-synthetic-ui-test-key-only');assert.equal(s.title,fixtures.teapot.title);assert.ok(!JSON.stringify(T.project()).includes(setupSent.apiKey));assert.equal($('modal').open,false);global.fetch=realFetch;
 console.log('Creator UI/canvas tests passed: genuine image-derived geometry, mask editing and undo, connected significant-stage diagrams, exact movement replay, materials, project round-trip and invalid imports, exports, print completeness, flat-mode preservation, and disconnected-service state.');
})().catch(e=>{console.error(e);process.exitCode=1;});
