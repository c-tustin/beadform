(function(root){
'use strict';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const midpoint=p=>p.type==='capsule'?p.center.map((v,i)=>(v+p.end[i])/2):p.center;
const canonical=name=>name.toLowerCase().replace(/\b(left|right)\b/g,'').replace(/\s+/g,' ').trim();
function inspectScene(input,{requirements=[]}={}){
 const Shape=root.BeadShape||(typeof require==='function'?require('./shape-engine.js'):null);
 const issues=[];let scene;
 try{scene=Shape.scene(input);}catch(e){return {numeric_valid:false,passes:false,issues:[{code:'invalid_scene',severity:'error',message:e.message}],physicalSampleRequired:true};}
 const solids=scene.parts.filter(p=>p.role==='solid'),bounds=Shape.bounds(scene),span=Math.max(...bounds.max.map((v,i)=>v-bounds.min[i]));
 for(const [i,p] of scene.parts.entries()){
  if(p.type==='capsule'&&distance(p.center,p.end)<Math.max(...p.size)*.05)issues.push({code:'collapsed_capsule',severity:'error',parts:[i],message:p.name+' has no meaningful capsule length; its pose is not represented.'});
  if(p.type!=='capsule'&&distance(p.center,p.end)>1e-6)issues.push({code:'ignored_endpoint',severity:'warning',parts:[i],message:p.name+' has an endpoint that this primitive ignores.'});
 }
 const pairs=new Map();
 scene.parts.forEach((p,i)=>{const side=/\bleft\b/i.test(p.name)?'left':/\bright\b/i.test(p.name)?'right':null;if(!side)return;const key=canonical(p.name);if(!pairs.has(key))pairs.set(key,{});(pairs.get(key)[side]??=[]).push({p,i});});
 for(const [name,pair] of pairs)if(pair.left?.length===1&&pair.right?.length===1){const a=pair.left[0],b=pair.right[0],separation=distance(midpoint(a.p),midpoint(b.p));if(separation<Math.max(span*.025,Math.min(...a.p.size,...b.p.size)))issues.push({code:'coincident_pair',severity:'error',parts:[a.i,b.i],message:'Left and right '+name+' occupy the same region.'});}
 for(const spec of requirements){
  const matcher=new RegExp(spec.pattern,'i'),matches=scene.parts.map((p,i)=>({p,i})).filter(({p})=>matcher.test(p.name)&&(!spec.roles||spec.roles.includes(p.role)));
  if(matches.length<spec.min_count)issues.push({code:'missing_feature',severity:'error',feature:spec.name,expected:spec.min_count,found:matches.length,message:'Expected '+spec.min_count+' separately represented '+spec.name+'; found '+matches.length+'.'});
  if(spec.distinct&&matches.length>1){let close=false;for(let a=0;a<matches.length;a++)for(let b=a+1;b<matches.length;b++)if(distance(midpoint(matches[a].p),midpoint(matches[b].p))<span*.025)close=true;if(close)issues.push({code:'collapsed_feature_group',severity:'error',feature:spec.name,message:spec.name+' are named separately but occupy coincident positions.'});}
 }
 return {numeric_valid:true,passes:!issues.some(i=>i.severity==='error'),issues,solid_parts:solids.length,scene_span:span,physicalSampleRequired:true};
}
function inspectGraph(g){
 const collisions=[],joins=[];let collisionCount=0,minClearance=Infinity;
 for(let a=0;a<g.nodes.length;a++)for(let b=a+1;b<g.nodes.length;b++){
  const x=g.nodes[a],y=g.nodes[b];if(x.component===y.component)continue;
  const clearance=distance(x.p,y.p)-((x.diameterMm||2)+(y.diameterMm||2))/2;
  minClearance=Math.min(minClearance,clearance);
  if(clearance<-.05){collisionCount++;if(collisions.length<20)collisions.push({a:x.id,b:y.id,components:[x.component,y.component],clearance_mm:Math.round(clearance*1000)/1000});}
 }
 for(const join of g.joins)for(const pair of join.pairs)joins.push({parent:join.parent,child:join.component,a:pair.a,b:pair.b,center_span_mm:distance(g.byId.get(pair.a).p,g.byId.get(pair.b).p)});
 return {compiler_valid:g.validation.valid,beads:g.nodes.length,thread_sections:g.threadSections,max_passes:g.maxPasses,pass_limit:g.passLimit,cross_component_overlap_pairs:collisionCount,min_cross_component_clearance_mm:Number.isFinite(minClearance)?minClearance:null,overlap_examples:collisions,max_join_center_span_mm:joins.length?Math.max(...joins.map(j=>j.center_span_mm)):0,joins,clearance_model:'Conservative spherical envelopes from nominal bead diameters; not a tension, hole-axis or physical-build simulation.',physicalSampleRequired:true};
}
function separatePaintedEyes(input){
 // Produce an explicit proposal, never silently replace a saved training label.
 const scene=input===undefined?null:JSON.parse(JSON.stringify(input)),changes=[];
 if(!inspectScene(scene).numeric_valid)return {scene,changes,requiresReview:true,physicallyTested:false};
 for(const left of scene.parts.filter(p=>p.role==='paint'&&/\bleft\b.*\b(eye|pupil)\b/i.test(p.name))){
  const right=scene.parts.find(p=>p.role==='paint'&&/\bright\b/i.test(p.name)&&canonical(p.name)===canonical(left.name));if(!right)continue;
  const hosts=scene.parts.filter(p=>p.role==='solid'&&p.type==='ellipsoid');if(!hosts.length)continue;
  const host=hosts.slice().sort((a,b)=>Number(/head/i.test(b.name))-Number(/head/i.test(a.name))||distance(a.center,left.center)-distance(b.center,left.center))[0];
  if(distance(left.center,right.center)>=host.size[0]*.2)continue;
  const y=Math.max(-.65,Math.min(.65,((left.center[1]+right.center[1])/2-host.center[1])/host.size[1])),x=.35,z=Math.sqrt(Math.max(.01,1-x*x-y*y));
  for(const [part,side] of [[left,-1],[right,1]]){const before=part.center.slice();part.center=[host.center[0]+side*x*host.size[0],host.center[1]+y*host.size[1],host.center[2]+z*host.size[2]];part.end=part.center.slice();if(part.type==='capsule')part.type='ellipsoid';changes.push({part:part.name,before,after:part.center.slice(),reason:'Separate coincident painted eyes on the host ellipsoid surface.'});}
 }
 return {scene,changes,requiresReview:true,physicallyTested:false};
}
root.BeadPatternQuality={inspectScene,inspectGraph,separatePaintedEyes};if(typeof module!=='undefined')module.exports=root.BeadPatternQuality;
})(typeof window!=='undefined'?window:globalThis);
