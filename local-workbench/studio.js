const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pattern=null,stepIndex=0,moveIndex=0,timer=null,graph=null,chartBlob=null,instructionsBlob=null,yaw=-.5,pitch=.28,zoom=1,hitBeads=[];
const operations=step=>pattern.dimension==='volume'?[...(step.travel||[]).map(id=>({kind:'pass',id,phase:'position'})),...step.ops]:step.operations;
const words=op=>op.kind==='thread-bridge'?`Go under the existing thread bridge between ${op.between.join(' and ')}.`:op.kind==='pick'?`Pick up new bead ${op.id}.`:`Pass through existing bead ${op.id}${op.phase==='position'?' to move into position':''}.`;
function stop(){clearInterval(timer);timer=null;$('play').textContent='Play thread';}
function instructions(p){
 const lines=[p.title||`${p.recipe.stitch} ${p.recipe.shape}`,'BEADFORM · DRAFT BEADING GUIDE',`${p.beadCount} physical beads · 11/0 round seed beads · 0.20 mm thread`,`${p.technique||p.recipe.stitch} · preferred maximum 5 assembly passages; actual maximum ${p.passagePreference.maximumAssemblyPasses}.`,'Finishing, tails and reinforcement are not included. Test with your actual materials.','',p.note||'',''];
 for(const [i,s] of p.steps.entries()){lines.push(`${i+1}. ${s.label}`);if(s.threadStart)lines.push(`Start working thread section ${s.threadSection} at junction ${s.entryCorner}; ${i?'anchor beside existing bead '+s.anchor:'leave a tail and secure a tested start'}. Starting/finishing method needs a physical sample.`);for(const [j,op] of operations(s).entries())lines.push(`   ${j+1}. ${words(op)}`);if(s.note)lines.push(s.note);if(s.endThread)lines.push('Finish this working thread section using a separately tested method.');lines.push('');}
 return lines.join('\n');
}
function setPattern(p,svg){
 stop();pattern=p;stepIndex=0;moveIndex=operations(p.steps[0]).length;
 graph=p.dimension==='volume'?{nodes:p.beads,byId:new Map(p.beads.map(b=>[b.id,b])),faces:p.faces}:null;
 $('empty').hidden=true;$('result').hidden=false;$('title').textContent=p.title||`${p.recipe.stitch} ${p.recipe.shape}`;
 $('technique').textContent=p.dimension==='volume'?'3D · CRAW':`${p.recipe.stitch} · flat`;
 $('source').textContent=p.dimension==='volume'?(p.source.kind==='catalog'?'Saved starter geometry · computed 3D bead and thread plan.':'Base Qwen geometry proposal · computed 3D bead and thread plan. The flat-stitch adapter is not applied to this 3D proposal. Shape accuracy needs your review.'):'Your image-trained Qwen adapter selected this recipe. Beadform computed the pattern.';
 const count=p.dimension==='volume'?p.cubes.length:p.steps.length,kind=p.dimension==='volume'?'shared-face cubes':'construction steps';
 $('stats').innerHTML=`<div><strong>${p.beadCount}</strong><small>physical beads</small></div><div><strong>${count}</strong><small>${kind}</small></div><div><strong>${p.passagePreference.maximumAssemblyPasses} / 5</strong><small>max assembly passes / preferred</small></div>`;
 $('volumePreview').hidden=p.dimension!=='volume';$('notes').textContent=p.note;
 $('step').max=p.steps.length-1;$('step').value=0;
 if(chartBlob)URL.revokeObjectURL(chartBlob);if(instructionsBlob)URL.revokeObjectURL(instructionsBlob);
 chartBlob=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));$('saveChart').href=chartBlob;
 instructionsBlob=URL.createObjectURL(new Blob([instructions(p)],{type:'text/plain'}));$('saveInstructions').href=instructionsBlob;
 $('printSteps').innerHTML='<h3>Complete construction guide</h3><ol>'+p.steps.map(s=>'<li><b>'+esc(s.label)+'</b>'+((s.threadStart)?'<p>Start thread section '+s.threadSection+' at '+esc(s.entryCorner)+'. Finish separately; finishing passes excluded.</p>':'')+'<p>'+operations(s).map(words).map(esc).join(' → ')+'</p></li>').join('')+'</ol>';
 renderStep();$('result').scrollIntoView({behavior:'smooth',block:'start'});
}
function flatSvg(){
 const p=pattern,beads=p.beads,byId=new Map(beads.map(b=>[b.id,b])),active=operations(p.steps[stepIndex]),past=p.steps.slice(0,stepIndex).flatMap(operations),visible=active.slice(0,moveIndex),known=new Set([...past,...visible].filter(o=>o.kind==='pick').map(o=>o.id)),fresh=new Set(active.filter(o=>o.kind==='pick').map(o=>o.id));
 const minX=Math.min(...beads.map(b=>b.xMm)),minY=Math.min(...beads.map(b=>b.yMm)),scaleX=40,scaleY=70,W=Math.max(480,(Math.max(...beads.map(b=>b.xMm))-minX)*scaleX+100),H=Math.max(260,(Math.max(...beads.map(b=>b.yMm))-minY)*scaleY+130),pos=b=>[(b.xMm-minX)*scaleX+50,(b.yMm-minY)*scaleY+65];
 const vertical=b=>['brick','ladder'].includes(p.recipe.stitch)||(p.recipe.stitch==='raw'&&b.id.startsWith('V'));
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Interactive beads and thread for ${esc(p.steps[stepIndex].label)}"><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7L2 3.5Z" fill="#ad406d"/></marker></defs><rect width="${W}" height="${H}" fill="#fffdf9"/>`;
 for(const b of beads){const [x,y]=pos(b),v=vertical(b),selected=visible.at(-1)?.id===b.id;svg+=`<g data-bead="${esc(b.id)}" opacity="${known.has(b.id)?1:.22}" role="button" tabindex="0" aria-label="Bead ${esc(b.id)}, ${b.assemblyPasses} assembly passages"><title>${esc(b.id)} · ${b.assemblyPasses} assembly passages</title><ellipse cx="${x}" cy="${y}" rx="${v?22:17}" ry="${v?17:22}" fill="${selected?'#f1c6d5':'#e3ebd8'}" stroke="${fresh.has(b.id)?'#345c41':'#8b9e86'}" stroke-width="${fresh.has(b.id)?2:1}"/><path d="${v?`M${x} ${y-15}V${y+15}`:`M${x-15} ${y}H${x+15}`}" stroke="#fff" stroke-width="4"/><text x="${x}" y="${y+34}" text-anchor="middle" font-family="Arial" font-size="10" fill="#405640">${esc(b.id)}</text></g>`;}
 let prev=null;
 const prior=past.filter(o=>o.id&&byId.has(o.id)).at(-1);if(prior)prev=pos(byId.get(prior.id));
 for(const [i,op] of visible.entries()){
  if(op.kind==='thread-bridge'){const a=pos(byId.get(op.between[0])),b=pos(byId.get(op.between[1])),x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;if(prev)svg+=`<path d="M${prev} Q${x+12} ${y-18} ${x} ${y}" stroke="#ad406d" fill="none" marker-end="url(#arrow)"/>`;svg+=`<path d="M${x-8} ${y}C${x-8} ${y+15} ${x+8} ${y+15} ${x+8} ${y}" fill="none" stroke="#ad406d" stroke-width="2"/><text x="${x}" y="${y+26}" text-anchor="middle" font-size="10" fill="#ad406d">↶ ${i+1}</text>`;prev=[x+8,y];continue;}
  const b=byId.get(op.id),[x,y]=pos(b),v=vertical(b),next=visible.slice(i+1).find(o=>o.id&&byId.has(o.id)),n=next?pos(byId.get(next.id)):null;
  const direction=prev?(v?Math.sign(y-prev[1]):Math.sign(x-prev[0]))||1:n?(v?Math.sign(n[1]-y):Math.sign(n[0]-x))||1:1;
  const offset=(visible.slice(0,i).filter(o=>o.id===op.id).length%3-1)*3,entry=[x-(v?0:20*direction)+(v?offset:0),y-(v?20*direction:0)+(v?0:offset)],exit=[x+(v?0:20*direction)+(v?offset:0),y+(v?20*direction:0)+(v?0:offset)];
  if(prev){const cx=(prev[0]+entry[0])/2+(v?20:0),cy=(prev[1]+entry[1])/2+(v?0:-24);svg+=`<path d="M${prev}Q${cx} ${cy} ${entry}" fill="none" stroke="#ad406d" stroke-width="1.8" marker-end="url(#arrow)"/>`;}
  svg+=`<path data-through-hole="${esc(op.id)}" d="M${entry}L${exit}" stroke="#ad406d" stroke-width="2" fill="none" marker-end="url(#arrow)"/>`;
  if(!visible.slice(i+1).some(o=>o.id===op.id))svg+=`<text x="${x}" y="${y-27}" text-anchor="middle" font-size="10" fill="#ad406d">${visible.map((o,j)=>o.id===op.id?j+1:null).filter(Boolean).join(', ')}</text>`;
  prev=exit;
 }
 if(prev)svg+=`<circle cx="${prev[0]}" cy="${prev[1]}" r="4" fill="#ad406d"/><text x="${prev[0]+8}" y="${prev[1]-8}" fill="#ad406d" font-size="10">working exit</text>`;
 return svg+'</svg>';
}
function renderStep(){
 if(!pattern)return;
 const step=pattern.steps[stepIndex],ops=operations(step);moveIndex=Math.max(0,Math.min(moveIndex,ops.length));
 $('step').value=stepIndex;$('stepNumber').textContent=`${stepIndex+1} of ${pattern.steps.length}`;$('stepTitle').textContent=step.label;
 $('move').max=ops.length;$('move').value=moveIndex;
 $('threadNotice').textContent=step.threadStart?`Start thread section ${step.threadSection} here${stepIndex?'; beside existing bead '+step.anchor:''}. Finish and anchor using a tested method; those extra passages are not counted.`:step.note||'Follow the numbered arrows. Thread crossings between beads are not joins.';
 $('chart').innerHTML=pattern.dimension==='volume'?window.BeadThread.svg(graph,step,pattern.colors,pattern.palette,{reveal:moveIndex}):flatSvg();
 for(const bead of $('chart').querySelectorAll('[data-diagram-bead]')){bead.setAttribute('role','button');bead.setAttribute('tabindex','0');bead.setAttribute('aria-label','Inspect bead '+bead.dataset.diagramBead);}
 if(chartBlob)URL.revokeObjectURL(chartBlob);chartBlob=URL.createObjectURL(new Blob([$('chart').innerHTML],{type:'image/svg+xml'}));$('saveChart').href=chartBlob;$('saveChart').download='thread-step-'+(stepIndex+1)+'.svg';
 $('action').textContent=moveIndex?`${moveIndex} of ${ops.length}: ${words(ops[moveIndex-1])}`:'Ready at the start of this step.';
 $('moves').innerHTML=ops.map((o,i)=>`<li class="${i===moveIndex-1?'active':''}"><button data-move="${i+1}">${esc(words(o))}</button></li>`).join('');
 $('previousStep').disabled=stepIndex===0;$('nextStep').disabled=stepIndex===pattern.steps.length-1;
 if(pattern.dimension==='volume')drawModel();
}
function selectStep(index){stop();stepIndex=Math.max(0,Math.min(index,pattern.steps.length-1));moveIndex=operations(pattern.steps[stepIndex]).length;renderStep();}
function advance(delta){if(!pattern)return;const n=operations(pattern.steps[stepIndex]).length;moveIndex+=delta;if(moveIndex>n){if(stepIndex<pattern.steps.length-1){stepIndex++;moveIndex=1;}else{moveIndex=n;stop();}}else if(moveIndex<0){if(stepIndex){stepIndex--;moveIndex=operations(pattern.steps[stepIndex]).length;}else moveIndex=0;}renderStep();}
function inspectBead(id){if(!pattern)return;const bead=pattern.beads.find(b=>b.id===id);if(!bead)return;const index=pattern.steps.findIndex(s=>operations(s).some(o=>o.kind==='pick'&&o.id===id));$('beadInfo').textContent=`${id}: ${bead.assemblyPasses} assembly passages; picked up in step ${index+1}. Finishing passages excluded.`;if(index>=0)selectStep(index);}
const canvas=$('model'),ctx=canvas.getContext('2d');
function drawModel(){
 if(pattern?.dimension!=='volume')return;
 const p=pattern,W=900,H=580,center=p.center,project=q=>{const [x,y,z]=q.map((v,i)=>v-center[i]),a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);return [a,-y*Math.cos(pitch)+b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)];};
 const extent=Math.max(...p.beads.flatMap(b=>project(b.p).slice(0,2).map(Math.abs)),1),scale=Math.min(390,235)/extent*zoom;
 const xy=q=>{const a=project(q);return [W/2+a[0]*scale,H/2+a[1]*scale,a[2]];};
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#eff2e9';ctx.fillRect(0,0,W,H);
 const step=p.steps[stepIndex],ops=operations(step).slice(0,moveIndex),active=new Set(ops.map(o=>o.id)),known=new Set(p.steps.slice(0,stepIndex).flatMap(operations).filter(o=>o.kind==='pick').map(o=>o.id));ops.filter(o=>o.kind==='pick').forEach(o=>known.add(o.id));
 hitBeads=[];
 for(const b of p.beads.map(b=>({b,q:xy(b.p)})).sort((a,b)=>a.q[2]-b.q[2])){
  const n=b.b;if($('builtOnly').checked&&!known.has(n.id))continue;
  const ends=n.ends.map(s=>xy(s.split(',').map(Number))),angle=Math.atan2(ends[1][1]-ends[0][1],ends[1][0]-ends[0][0]),r=Math.max(2.5,Math.min(16,scale*.32));
  ctx.save();ctx.translate(b.q[0],b.q[1]);ctx.rotate(angle);ctx.globalAlpha=1;ctx.beginPath();ctx.ellipse(0,0,r*.8,r,0,0,Math.PI*2);ctx.fillStyle=active.has(n.id)?'#e5a0b9':n.color;ctx.fill();ctx.lineWidth=active.has(n.id)?2:.7;ctx.strokeStyle=active.has(n.id)?'#a33561':'#65785f';ctx.stroke();ctx.beginPath();ctx.moveTo(-r*.75,0);ctx.lineTo(r*.75,0);ctx.strokeStyle='#fff9';ctx.stroke();ctx.restore();hitBeads.push({id:n.id,x:b.q[0],y:b.q[1],r});
 }
 let cursor=step.start;ctx.lineWidth=2.5;
 for(const op of ops){const n=graph.byId.get(op.id);if(!n.ends.includes(cursor))continue;const end=n.ends.find(e=>e!==cursor),a=xy(cursor.split(',').map(Number)),b=xy(end.split(',').map(Number));ctx.strokeStyle=op.phase==='position'?'#3c7970':'#ad406d';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();cursor=end;}
 const exit=xy(cursor.split(',').map(Number));ctx.beginPath();ctx.arc(exit[0],exit[1],5,0,Math.PI*2);ctx.fillStyle='#ad406d';ctx.fill();
}
let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;yaw+=dx*.008;pitch=Math.max(-1.3,Math.min(1.3,pitch+dy*.008));drag.x=e.clientX;drag.y=e.clientY;drawModel();});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*900/r.width,y=(e.clientY-r.top)*580/r.height;const hit=hitBeads.slice().reverse().find(b=>Math.hypot(b.x-x,b.y-y)<Math.max(9,b.r));if(hit)inspectBead(hit.id);}drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.5,Math.min(3,zoom*Math.exp(-e.deltaY*.001)));drawModel();},{passive:false});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;pitch+=e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0;drawModel();}});
$('resetView').onclick=()=>{yaw=-.5;pitch=.28;zoom=1;drawModel();};$('builtOnly').onchange=drawModel;
$('previousStep').onclick=()=>selectStep(stepIndex-1);$('nextStep').onclick=()=>selectStep(stepIndex+1);
$('step').oninput=e=>selectStep(Number(e.target.value));$('move').oninput=e=>{stop();moveIndex=Number(e.target.value);renderStep();};
$('previousMove').onclick=()=>{stop();advance(-1);};$('nextMove').onclick=()=>{stop();advance(1);};
$('play').onclick=()=>{if(timer){stop();return;}if(moveIndex===operations(pattern.steps[stepIndex]).length)moveIndex=0;$('play').textContent='Pause thread';renderStep();timer=setInterval(()=>advance(1),850);};
$('moves').onclick=e=>{const b=e.target.closest('[data-move]');if(b){stop();moveIndex=Number(b.dataset.move);renderStep();}};
 $('chart').onclick=e=>{const b=e.target.closest('[data-bead],[data-diagram-bead]');if(b)inspectBead(b.dataset.bead||b.dataset.diagramBead);};
$('chart').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('[data-bead],[data-diagram-bead]');if(b){e.preventDefault();inspectBead(b.dataset.bead||b.dataset.diagramBead);}}};
$('print').onclick=()=>window.print();
$('mode').onchange=()=>{$('starters').hidden=$('mode').value==='flat';$('flatSettings').hidden=$('mode').value!=='flat';if($('mode').value==='flat')$('prompt').value='A brick stitch triangle.';};
$('template').onchange=()=>{if($('template').value){$('prompt').value='Make a '+$('template').selectedOptions[0].textContent+'.';$('image').value='';$('referencePreview').hidden=true;}};
$('image').onchange=()=>{const f=$('image').files[0];$('referencePreview').hidden=!f;if(f)$('referencePreview').src=URL.createObjectURL(f);};
$('form').onsubmit=async e=>{
 e.preventDefault();stop();$('generate').disabled=true;$('status').textContent=$('mode').value==='volume'&&!$('template').value?'Your local model is sketching the shape, then Beadform will compute its thread path. This can take a few minutes.':'Computing your bead pattern…';
 try{const f=$('image').files[0];if(f&&f.size>10*1024*1024)throw Error('Use an image smaller than 10 MB.');const image=f?await new Promise((ok,fail)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=fail;r.readAsDataURL(f);}):null;
 const response=await fetch('/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:$('mode').value,template:$('mode').value==='volume'?$('template').value:null,prompt:$('prompt').value,image,width:Number($('width').value),rows:Number($('rows').value)})});const d=await response.json();if(!response.ok)throw Error(d.error);
 if(d.pattern.needsClarification){$('status').textContent='The model could not select a supported flat pattern. Specify brick, peyote, ladder, RAW or square and compatible dimensions.';return;}
 setPattern(d.pattern,d.svg);$('status').textContent='Your draft is ready. Follow the thread arrows one movement at a time.';
 }catch(e){$('status').textContent=e.message;}finally{$('generate').disabled=false;}
};
const catalog=await (await fetch('/catalog')).json();for(const e of catalog){const o=document.createElement('option');o.value=e.id;o.textContent=e.title;$('template').append(o);}
const saved=await (await fetch('/latest')).json();
if(saved?.pattern&&!saved.pattern.needsClarification){
 const p=saved.pattern,volume=p.dimension==='volume';$('mode').value=volume?'volume':'flat';$('starters').hidden=!volume;$('flatSettings').hidden=volume;
 $('template').value=volume&&p.source.kind==='catalog'?p.source.id:'';
 $('prompt').value=saved.prompt||(volume?'Make a '+p.title+'.':`A ${p.recipe.stitch} ${p.recipe.shape}.`);
 if(!volume){$('width').value=p.recipe.width;$('rows').value=p.recipe.rows;}
 setPattern(p,saved.svg);
}
