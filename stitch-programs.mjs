// Original bounded flat-pattern compiler. These are draft swatches, not tested designs.
import './engine.js';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const E=globalThis.BeadEngine;
export const recipeSchema={type:'object',properties:{stitch:{type:'string',enum:['peyote','brick','ladder','raw','square','unknown']},shape:{type:'string',enum:['rectangle','triangle','strip','unknown']},width:{type:'integer',minimum:0,maximum:12},rows:{type:'integer',minimum:0,maximum:12}},required:['stitch','shape','width','rows'],additionalProperties:false};
export function compileRecipe(recipe){
 if(!recipe||Object.keys(recipe).sort().join(',')!=='rows,shape,stitch,width')throw Error('Use exactly stitch, shape, width and rows.');
 const {stitch,shape,width,rows}=recipe;
 if(!recipeSchema.properties.stitch.enum.includes(stitch)||!recipeSchema.properties.shape.enum.includes(shape)||![width,rows].every(Number.isInteger))throw Error('Invalid recipe.');
 if(stitch==='unknown'){if(shape!=='unknown'||width!==0||rows!==0)throw Error('Unknown requires zero dimensions.');return {recipe,needsClarification:true,physicalSampleRequired:true};}
 if(width<2||width>12||rows<1||rows>12)throw Error('Dimensions out of range.');
 if(stitch==='ladder'&&(shape!=='strip'||rows!==1))throw Error('Ladder supports one strip.');
 if(stitch!=='ladder'&&rows<2)throw Error('Use at least two rows.');
 if(!['brick','ladder'].includes(stitch)&&shape!=='rectangle')throw Error('This generator supports rectangles for this stitch.');
 if(stitch==='brick'&&(!['rectangle','triangle'].includes(shape)||(shape==='triangle'&&rows>width-1)))throw Error('Brick triangle must stop at two or more beads.');
 if(stitch==='peyote'&&width%2)throw Error('Even-count peyote requires an even starter count.');
 let beads=[],steps=[],operations=[];
 const add=(id,x,y)=>{beads.push({id,xMm:x,yMm:y,diameterMm:2,holeLengthMm:1.3});return id;};
 const emit=(kind,id,extra={})=>operations.push({kind,id,...extra});
 function save(label,start,note){steps.push({label,operations:operations.slice(start),note});}
 function ladder(n,prefix='L',y=0){const ids=[];
  for(let i=0;i<n;i++)ids.push(add(prefix+(i+1),i*2.05,y));
  const start=operations.length;emit('pick',ids[0]);emit('pick',ids[1]);emit('pass',ids[0]);emit('pass',ids[1]);
  for(let i=2;i<n;i++){emit('pick',ids[i]);emit('pass',ids[i-1]);emit('pass',ids[i]);}
  save('Ladder foundation',start,'Make adjacent bead loops in the listed order. The last bead is the working exit.');return ids;
 }
 if(stitch==='ladder')ladder(width);
 else if(stitch==='brick'){
  let previous=ladder(width,'B1-');
  for(let r=1;r<rows;r++){
   const anchors=previous.slice().reverse(),n=shape==='triangle'?width-r:width,start=operations.length,ids=[];
   for(let i=0;i<n;i++)ids.push(add('B'+(r+1)+'-'+(i+1),(r%2? n-1-i:i)*2.05+(shape==='triangle'?r*1.025:r%2*1.025),r*1.35));
   // Attach to existing thread between beads, never pass through a fictional bead.
   const firstBridge=shape==='triangle'?1:0;
   emit('pick',ids[0]);emit('pick',ids[1]);emit('thread-bridge',null,{between:[anchors[firstBridge],anchors[firstBridge+1]]});emit('pass',ids[1]);
   if(shape==='triangle'){emit('pass',ids[0]);emit('pass',ids[1]);} // Reinforce the two edge beads after a decrease.
   for(let i=2;i<n;i++){const j=shape==='triangle'?i:i-1;emit('pick',ids[i]);emit('thread-bridge',null,{between:[anchors[j],anchors[j+1]]});emit('pass',ids[i]);}
   save('Brick row '+(r+1),start,'A thread-bridge action goes under the named existing thread connection, then through the newly added bead. It is not another bead passage.');previous=ids;
  }
 }else{
  const g=E.geometry({stitch,width,rows,beadLength:1.3,beadDiameter:2});
  const validation=E.validate(g);if(!validation.valid)throw Error(validation.errors.join('; '));
  beads=g.nodes.map(n=>({id:n.id,xMm:n.x,yMm:n.y,diameterMm:2,holeLengthMm:1.3}));
  for(const step of E.steps(g)){
   const start=operations.length;
   if(stitch==='raw'){for(const id of step.travel||[])emit('pass',id);for(const o of step.ops)emit(o.kind,o.id);}
   else if(step.kind==='foundation')for(const id of step.ids)emit('pick',id);
   else if(stitch==='peyote')step.ids.forEach((id,i)=>{emit('pick',id);emit('pass',step.anchors[i]);});
   else for(const id of step.ids){emit('pick',id);const n=g.byId.get(id);emit('pass',`S${n.r}-${n.c+1}`);emit('pass',id);}
   save(step.label,start,step.note);
  }
 }
 const known=new Set(),counts=new Map(beads.map(b=>[b.id,0]));
 for(const op of operations){
  if(op.kind==='thread-bridge'){if(op.between.length!==2||op.between.some(id=>!known.has(id)))throw Error('Bridge uses missing beadwork.');continue;}
  if(!counts.has(op.id)||(op.kind==='pick')===known.has(op.id))throw Error('Invalid pickup or reuse.');
  known.add(op.id);counts.set(op.id,counts.get(op.id)+1);
 }
 if(known.size!==beads.length)throw Error('Inventory incomplete.');
 const ledger=beads.map(b=>({...b,assemblyPasses:counts.get(b.id)}));
 const exceptions=ledger.filter(b=>b.assemblyPasses>5).map(b=>({id:b.id,passes:b.assemblyPasses}));
 return {format:'beadform-stitch-program',version:1,recipe,materials:{beads:'11/0 round seed beads',threadDiameterMm:.2},beadCount:beads.length,beads:ledger,steps,operations,
  passagePreference:{preferredMax:5,maximumAssemblyPasses:Math.max(...counts.values()),exceptions,includesInitialPickup:true,finishingPassesIncluded:false},
  finishing:{status:'not-planned',instructions:'Reserve hole space for a separately sampled starting and finishing method. No knot or finish is certified.'},
  physicalSampleRequired:true,note:'Bounded original flat draft. Thread-bridge actions are not bead traversals. Assembly ledger excludes unplanned knots, tails and reinforcement; it cannot establish complete beadability.'};
}
export function patternSvg(pattern){
 if(pattern.needsClarification)throw Error('No pattern for an unknown recipe.');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const scale=26,xs=pattern.beads.map(b=>b.xMm),ys=pattern.beads.map(b=>b.yMm),minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(480,(Math.max(...xs)-minX)*scale+100),h=(Math.max(...ys)-minY)*scale+150;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(pattern.recipe.stitch)} draft bead chart</title><rect width="100%" height="100%" fill="white"/><text x="20" y="28" font-family="sans-serif" font-size="18">${esc(pattern.recipe.stitch)}: ${pattern.beadCount} beads; preferred maximum 5 passes</text><text x="20" y="52" font-family="sans-serif" font-size="12">Draft chart; use JSON steps for thread order. Finishing not planned.</text>${pattern.beads.map(b=>`<g transform="translate(${(b.xMm-minX)*scale+50},${(b.yMm-minY)*scale+100})"><ellipse rx="20" ry="14" fill="#e7eedf" stroke="#425f4c"/><text y="4" text-anchor="middle" font-family="sans-serif" font-size="9">${esc(b.id)}</text></g>`).join('')}</svg>`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const recipe=JSON.parse(readFileSync(0,'utf8')),plan=compileRecipe(recipe);
 console.log(process.argv.includes('--svg')?patternSvg(plan):JSON.stringify(plan,null,2));
}
