// Independent post-generation checks. Do not trust compiler "valid" flags or ledgers.
import './shape-engine.js';
import './pattern-quality.js';
const key=(a,b)=>[a,b].sort().join('|');
export function checkStitchSelection(selection,{mode='flat',actualStitch,actualRecipe}={}){
 const issues=[],r=selection?.recipe,add=(code,message)=>issues.push({code,severity:'error',message});
 if(selection?.adapterApplied!==true||selection.adapterSha256!=='4037c83f7e07b9bf6c11361b433eaef416c344d1dbe8c9f6c671760a3adc00f1'||selection.convertedAdapterSha256!=='a5a1f5977028b3f4ec4c87912fbbe2000a27f3904128c01e4f7f4554bd54ee55')add('missing_trained_selection','Regenerate with the audited trained stitch selector.');
 if(!r){if(selection)add('invalid_selection','The stitch selector did not return a recipe.');}
 else if(r.stitch==='unknown')add('stitch_unresolved','The trained model could not select a stitch for this design. Clarify the design or choose a simpler supported draft.');
 else if(mode==='volume'){
  if(r.width!==0||r.rows!==0||!['volume','sphere','tube'].includes(r.shape))add('invalid_volume_selection','The 3D stitch decision has incompatible dimensions or shape.');
  if(r.stitch!=='craw')add('unsupported_3d_stitch',`The model selected ${r.stitch}. This local 3D generator currently implements CRAW only; it cannot produce a ${r.stitch} thread pattern. No stitch has been substituted.`);
 }else{
  if(!['brick','peyote','raw','square','ladder'].includes(r.stitch))add('unsupported_flat_stitch','This stitch is not implemented by the flat generator.');
  if(r.width<2||r.width>12||r.rows<1||r.rows>12)add('invalid_dimensions','Use width 2–12 and rows 1–12.');
  if(r.stitch==='peyote'&&r.width%2)add('peyote_parity','Even-count peyote needs an even starter width.');
  if(r.stitch==='ladder'&&(r.rows!==1||r.shape!=='strip'))add('ladder_shape','The ladder generator supports one foundation strip.');
  if(r.stitch!=='ladder'&&r.rows<2)add('too_few_rows','Use at least two rows.');
  if(['peyote','raw','square'].includes(r.stitch)&&r.shape!=='rectangle')add('flat_shape','This stitch generator supports a rectangular swatch.');
  if(r.stitch==='brick'&&(!['triangle','rectangle'].includes(r.shape)||(r.shape==='triangle'&&r.rows>r.width-1)))add('brick_decrease','A brick triangle must stop at at least two beads.');
  if(selection?.requestedDimensions&&(r.width!==selection.requestedDimensions.width||r.rows!==selection.requestedDimensions.rows))add('requested_dimensions_mismatch','The model dimensions do not match the width and rows you entered.');
 }
 if(actualStitch&&r&&r.stitch!==actualStitch)add('stitch_mismatch',`The model selected ${r.stitch}, but the pattern uses ${actualStitch}.`);
 if(actualRecipe&&r&&['stitch','shape','width','rows'].some(k=>r[k]!==actualRecipe[k]))add('recipe_mismatch','The compiled recipe differs from the trained model decision.');
 return {passed:!issues.length,issues};
}
export function checkPattern(pattern,{selection,requireSelection=true}={}){
 const issues=[],checks=[],add=(code,message,severity='error',extra={})=>issues.push({code,message,severity,...extra});
 const volume=pattern?.dimension==='volume'||selection?.mode==='volume';
 if(requireSelection){const gate=checkStitchSelection(selection,{mode:volume?'volume':'flat',actualStitch:volume?pattern?.technique:pattern?.recipe?.stitch,actualRecipe:volume?undefined:pattern?.recipe});issues.push(...gate.issues);checks.push({name:'Trained stitch selection matches an implemented generator',passed:gate.passed});}
 if(!pattern||pattern.needsClarification||!Array.isArray(pattern.beads)||!Array.isArray(pattern.steps))add('missing_pattern','No complete bead pattern was generated.');
 else try{
  const beads=pattern.beads,byId=new Map(beads.map(b=>[b.id,b])),known=new Set(),usage=new Map(),links=new Set();let previous=null,cursor=null;
  if(byId.size!==beads.length)add('duplicate_bead','Physical bead IDs must be unique.');
  if(beads.some(b=>typeof b.id!=='string'||(volume?(!Array.isArray(b.p)||b.p.length!==3||!b.p.every(Number.isFinite)||!Array.isArray(b.ends)||b.ends.length!==2):![b.xMm,b.yMm,b.diameterMm,b.holeLengthMm].every(Number.isFinite))))add('invalid_bead_geometry','A bead has invalid geometry or hole endpoints.');
  if(pattern.beadCount!==beads.length)add('inventory_count','The reported inventory does not match the physical beads.');
  if(!volume){
   const r=pattern.recipe;
   const expected=r.stitch==='raw'?r.width*(r.rows+1)+r.rows*(r.width+1):r.stitch==='peyote'?r.width*r.rows/2:r.stitch==='brick'&&r.shape==='triangle'?r.rows*r.width-r.rows*(r.rows-1)/2:r.stitch==='ladder'?r.width:r.width*r.rows;
   if(beads.length!==expected)add('formula_count_mismatch','The bead inventory does not match the stitch geometry formula.');
  }
  if(volume){
   const geometry=globalThis.BeadPatternQuality.inspectScene(pattern.scene);
   for(const issue of geometry.issues)add(issue.code,issue.message,issue.severity);
   checks.push({name:'Scene geometry quality checker',passed:geometry.passes});
   const edgeKeys=beads.map(b=>key(...b.ends));if(new Set(edgeKeys).size!==beads.length)add('duplicate_edge','Two bead IDs occupy the same CRAW edge.');
   if(beads.some(b=>{const ends=b.ends.map(e=>e.split(',').map(Number));return ends.some(e=>e.length!==3||!e.every(Number.isInteger))||b.p.some((v,i)=>Math.abs(v-(ends[0][i]+ends[1][i])/2)>1e-9);}))add('bead_position_mismatch','A bead preview position does not match its physical hole endpoints.');
   const expectedEdges=new Set(),built=new Set();for(const cube of pattern.cubes){const p=[cube.x,cube.y,cube.z];if(!p.every(Number.isInteger)||built.has(p.join(',')))add('invalid_cube','Cube coordinates must be unique integers.');if(built.size&&![0,1,2].some(axis=>[-1,1].some(sign=>built.has(p.map((v,i)=>v+(i===axis?sign:0)).join(',')))))add('unsupported_cube','A cube does not share a face with earlier beadwork.');built.add(p.join(','));
    for(const axis of [0,1,2])for(const a of [0,1])for(const b of [0,1]){const start=p.slice(),others=[0,1,2].filter(i=>i!==axis);start[others[0]]+=a;start[others[1]]+=b;const end=start.slice();end[axis]++;expectedEdges.add(key(start.join(','),end.join(',')));}
   }
   if(expectedEdges.size!==beads.length||edgeKeys.some(k=>!expectedEdges.has(k)))add('voxel_inventory_mismatch','The physical beads do not exactly cover the unique edges of the occupied cubes.');
  }
  const stitchedFaces=new Set();
  for(const step of pattern.steps){
   if(volume&&step.threadStart)cursor=step.entryCorner;
   const ops=volume?[...(step.travel||[]).map(id=>({kind:'pass',id})),...step.ops]:step.operations;
   if(!Array.isArray(ops)||!ops.length){add('missing_operations','A construction step has no thread movements.');continue;}
   if(volume){const face=pattern.faces.find(f=>f.id===step.faceId);if(!face||new Set(face.ids).size!==4||new Set(step.ring).size!==4||step.ring.some(id=>!face.ids.includes(id)))add('invalid_ring','A CRAW face is not a four-bead ring.');if(stitchedFaces.has(step.faceId))add('repeated_face','A CRAW face is constructed twice.');stitchedFaces.add(step.faceId);if(step.ops.length!==4&&!(stitchedFaces.size===1&&step.ops.length===5))add('ring_operation_count','A CRAW face must complete its four bead edges.');if(face&&(new Set(step.ops.slice(0,4).map(o=>o.id)).size!==4||step.ops.slice(0,4).some(o=>!face.ids.includes(o.id))))add('ring_edges_mismatch','The face operations do not cover its four distinct edge beads.');}
   for(const op of ops){
    if(op.kind==='thread-bridge'){
     if(volume||op.between?.length!==2||op.between.some(id=>!known.has(id))||!links.has(key(...op.between)))add('missing_thread_bridge','A brick attachment uses a thread bridge that has not been constructed.');
     previous=null;continue;
    }
    const bead=byId.get(op.id);if(!bead){add('unknown_bead','A thread movement uses a bead outside the inventory.');continue;}
    if(!['pick','pass'].includes(op.kind)){add('unknown_movement','Unknown thread movement.');continue;}
    if(op.kind==='pick'){if(known.has(op.id))add('duplicate_pickup','A physical bead is picked up twice.');known.add(op.id);}else if(!known.has(op.id))add('pass_before_pickup','Thread enters a bead before it has been picked up.');
    if(volume){if(!bead.ends?.includes(cursor))add('thread_disconnected','The thread route does not reach the next bead hole.');else cursor=bead.ends.find(v=>v!==cursor);}
    if(previous&&previous!==op.id)links.add(key(previous,op.id));previous=op.id;usage.set(op.id,(usage.get(op.id)||0)+1);
   }
   if(volume&&cursor!==step.end)add('wrong_exit','The step exit does not match the actual thread route.');
  }
  if(known.size!==beads.length)add('unbuilt_beads','The instructions do not construct every bead.');
  if(volume&&(stitchedFaces.size!==pattern.faces.length||new Set(pattern.faces.map(f=>f.id)).size!==pattern.faces.length))add('unbuilt_faces','The route does not construct every distinct CRAW face.');
  if(!volume&&JSON.stringify(pattern.steps.flatMap(s=>s.operations))!==JSON.stringify(pattern.operations))add('step_route_mismatch','The step charts and full thread route disagree.');
  let max=0;const over=[];
  for(const bead of beads){const count=usage.get(bead.id)||0;max=Math.max(max,count);if(count!==bead.assemblyPasses)add('pass_ledger_mismatch','The passage ledger disagrees with the actual thread route.');if(count>5)over.push({id:bead.id,passes:count});}
  if(pattern.passagePreference?.maximumAssemblyPasses!==max)add('max_pass_mismatch','The reported maximum passage count is incorrect.');
  if(JSON.stringify(pattern.passagePreference?.exceptions)!==JSON.stringify(over))add('pass_exception_mismatch','The list of beads above five passages is incorrect.');
  if(over.length)add('five_pass_review',`${over.length} bead(s) exceed the soft preference of five assembly passages. Review hole space and finishing.`, 'warning',{reviewRequired:true,beads:over});
  if(pattern.materials?.threadDiameterMm!==.2||pattern.materials?.beads!=='11/0 round seed beads')add('materials_mismatch','This checker expects 11/0 round seed beads and 0.20 mm thread.');
  if(!pattern.finishing||pattern.finishing.status!=='not-planned'||pattern.passagePreference?.finishingPassesIncluded!==false||pattern.physicalSampleRequired!==true)add('physical_scope_mismatch','Unplanned finishing and physical sampling must be disclosed.');
  checks.push({name:'Independent bead inventory, pickup order and thread-route checks',passed:!issues.some(i=>i.severity==='error'&&!['missing_trained_selection','stitch_unresolved','stitch_mismatch','unsupported_3d_stitch'].includes(i.code))});
  checks.push({name:'Recounted passages with a soft five-pass preference',passed:!issues.some(i=>['pass_ledger_mismatch','max_pass_mismatch','pass_exception_mismatch','five_pass_review'].includes(i.code)),maximumAssemblyPasses:max,overFive:over});
 }catch(e){add('malformed_pattern','The checker could not read this pattern: '+e.message);}
 if(selection?.scope==='experimental-3d')add('experimental_3d_selection','The adapter was trained on flat stitches. Its 3D stitch recommendation is experimental.', 'warning',{reviewRequired:true});
 add('physical_sample_required','Finishing, needle access, tension and strength still need a physical sample.','notice');
 const passed=!issues.some(i=>i.severity==='error');
 return {version:1,status:passed?(issues.some(i=>i.reviewRequired)?'needs-review':'passed-digital'):'failed',passed,checks,issues:[...new Map(issues.map(i=>[i.code+'|'+i.message,i])).values()],physicalBeadabilityVerified:false};
}
