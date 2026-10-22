(function(root){
'use strict';
// Computational contracts only: physical validation requires recorded sample builds.
const templates=Object.freeze({
 'eye-anchor':{label:'eye attachment',pairs:1,child:'eye',maxSpanMm:3.8,status:'draft'},
 'strand-return':{label:'return-strand attachment',pairs:1,child:'strand',maxSpanMm:3.8,status:'draft'},
 'surface-hinge':{label:'single flexible attachment',pairs:1,child:'surface',maxSpanMm:3.8,status:'draft'},
 'surface-double':{label:'two-point attachment',pairs:2,child:'surface',maxSpanMm:3.8,status:'draft'}
});
function kind(c){return c.mesh.eye?'eye':c.kind==='strand'?'strand':'surface';}
function validate(g,graph){
 const errors=[],byPart=new Map(graph.parts.map(p=>[p.id,p]));
 if(byPart.size!==g.components.length)errors.push('duplicate or missing part');
 if(graph.parts.reduce((sum,p)=>sum+p.beadCount,0)!==g.nodes.length)errors.push('incorrect inventory');
 for(const p of graph.parts){const c=g.components.find(c=>c.id===p.id),expected=c?.attachmentRegion?root.BeadParts?.attachmentRegion?.(g,c):null,r=p.attachmentRegion;
  if(!expected&&!r)continue;
  if(!expected||!r||r.kind!=='requested-arm-height'||['sourceFraction','toleranceFraction','minimumToleranceMm','targetHeightMm','toleranceMm'].some(k=>!Number.isFinite(r[k])||Math.abs(r[k]-expected[k])>1e-7)||r.sourceFraction<0||r.sourceFraction>1||r.toleranceMm<=0)errors.push('invalid arm attachment region');
 }

 for(const p of graph.parts)if(p.technique==='circular-peyote'){
  const rounds=p.rounds||[],ids=rounds.flatMap(r=>r.beads);
  if(rounds.reduce((n,r)=>n+r.newBeads,0)!==p.beadCount||new Set(ids).size!==p.beadCount||ids.some(id=>!p.beads.includes(id)))errors.push('incorrect circular-peyote round inventory');
  if(p.nominalGeometry){
   const geometry=p.nominalGeometry;
   if(geometry.version!==2||geometry.minimumCenterPlaneClearanceMm<geometry.centerPlaneClearanceMm-1e-8)errors.push('invalid nominal peyote spacing');
   for(const r of rounds){const angles=r.anglesRad;
    if(!Number.isFinite(r.radiusMm)||r.radiusMm<=0||!Number.isFinite(r.heightMm)||!Array.isArray(angles)||angles.length!==r.newBeads||angles.some(v=>!Number.isFinite(v))){errors.push('invalid peyote ring geometry');continue;}
    if(angles.some((a,i)=>Math.abs(((i===angles.length-1?angles[0]+Math.PI*2:angles[i+1])-a)-Math.PI*2/angles.length)>1e-7))errors.push('peyote ring angles are not uniformly spaced');
   }
  }
 }
 for(const p of graph.parts)if(p.technique==='craw'){
  const Craw=root.BeadCraw||(typeof require==='function'?require('./craw-block.js'):null),dims=p.dimensions;
  if(!Craw||!Array.isArray(dims)||dims.length!==3){errors.push('missing CRAW dimensions');continue;}
  try{if(p.beadCount!==Craw.count(...dims))errors.push('incorrect shared-edge CRAW count');}catch(e){errors.push('invalid CRAW dimensions');continue;}
  if(!p.cubes||p.cubes.length!==dims.reduce((a,b)=>a*b,1)){errors.push('missing CRAW cells');continue;}
  const faces=new Set(),coordinates=new Set();for(const [i,cube]of p.cubes.entries()){
   if(cube.index!==i||cube.coordinate.length!==3||cube.coordinate.some((v,j)=>!Number.isInteger(v)||v<0||v>=dims[j])||coordinates.has(cube.coordinate.join(',')))errors.push('invalid CRAW cell coordinate');coordinates.add(cube.coordinate.join(','));
   if(cube.faces.length!==6||new Set(cube.faces).size!==6)errors.push('invalid CRAW cube faces');
   if(i&&!cube.faces.some(id=>faces.has(id)))errors.push('CRAW cube does not attach to an earlier face');cube.faces.forEach(id=>faces.add(id));
  }
 }
 const parents=new Map();
 for(const j of graph.joints){const rule=templates[j.type],child=g.components.find(c=>c.id===j.child);
  if(!rule||!child){errors.push('unsupported joint');continue;}
  if(!byPart.has(j.parent)||j.parent===j.child||parents.has(j.child))errors.push('invalid parent');
  parents.set(j.child,j.parent);
  if(rule.child!==kind(child)||j.anchors.length!==rule.pairs)errors.push('joint interface mismatch');
  const used=new Set();for(const pair of j.anchors){const a=g.byId.get(pair.parent),b=g.byId.get(pair.child);
   if(!a||!b||a.component!==j.parent||b.component!==j.child){errors.push('wrong anchor ownership');continue;}
   if(used.has(a.id)||used.has(b.id))errors.push('repeated attachment anchor');used.add(a.id);used.add(b.id);
   if(child.allowedParentIds&&!child.allowedParentIds.includes(a.id))errors.push('anatomically invalid anchor');
   const region=byPart.get(j.child)?.attachmentRegion;if(region?.kind==='requested-arm-height'&&Math.abs(a.p[1]-region.targetHeightMm)>region.toleranceMm+1e-7)errors.push('arm anchor is outside its requested height band');
   if(Math.hypot(...a.p.map((x,i)=>x-b.p[i]))>rule.maxSpanMm+1e-5)errors.push('unsupported thread span');
   for(const n of [a,b])if(g.counts.get(n.id)>g.passLimit)errors.push('anchor passage budget exceeded');
   const stage=g.joins.find(s=>s.component===j.child);
   for(const n of [a,b])if(stage.operations.filter(o=>o.id===n.id&&o.kind==='pass').length<2)errors.push('missing joint reinforcement');
  }
 }
 const roots=graph.parts.filter(p=>!parents.has(p.id));if(roots.length!==1||graph.joints.length!==graph.parts.length-1)errors.push('parts must form one connected tree');
 for(const p of graph.parts){const seen=new Set();let id=p.id;while(parents.has(id)){if(seen.has(id)){errors.push('cyclic assembly');break;}seen.add(id);id=parents.get(id);}}
 return {valid:errors.length===0,errors:[...new Set(errors)],physicalSampleRequired:true};
}
function compile(g){
 const parts=g.components.map(c=>({id:c.id,name:c.name,parent:c.parent||null,
  technique:c.mesh.stitch==='craw'?'craw':c.mesh.eye?'single-bead':c.mesh.stitch==='peyote'?'circular-peyote':c.kind==='strand'?'return-strand':'angle-weave',
  template:c.mesh.eye?'eye':c.kind,placementRule:c.placementRule||null,attachmentRegion:root.BeadParts?.attachmentRegion?.(g,c)||c.attachmentRegion||null,planeNormalAxis:c.planeNormalAxis,dimensions:c.mesh.dimensions||null,cubes:c.mesh.cells||null,templateStatus:'draft',beadCount:c.ids.length,beads:c.ids.slice(),
  decision:c.mesh.stitch==='craw'?'cuboid volume at bead scale; shared edge beads and parent-facing cube order':c.mesh.stitch==='peyote'?'rounded hollow surface':c.kind==='strand'?'simple flexible appendage':'named part geometry',
  nominalGeometry:c.mesh.geometry||null,rounds:c.mesh.rounds?.map((ids,i)=>({round:i+1,newBeads:ids.length,beads:ids.map(id=>c.ids[id]),radiusMm:c.mesh.geometry?.roundRadiiMm[i]??null,heightMm:c.mesh.geometry?.roundHeightsMm[i]??null,anglesRad:c.mesh.angles[i]}))||null}));
 const joints=g.joins.map(j=>{const c=g.components.find(c=>c.id===j.component),type=kind(c)==='eye'?'eye-anchor':kind(c)==='strand'?'strand-return':j.pairs.length===2?'surface-double':'surface-hinge';j.jointType=type;return {id:'joint-'+j.component,type,parent:j.parent,child:j.component,status:'draft',anchors:j.pairs.map(p=>({parent:p.a,child:p.b,parentPasses:g.counts.get(p.a),childPasses:g.counts.get(p.b)}))};});
 const graph={format:'beadform-construction-graph',version:1,parts,joints,materials:g.materials,beadCount:g.nodes.length,threadSections:g.threadSections,finishing:g.finishing||null,finishingRepair:g.finishingRepair||null,threadAccess:g.threadAccess||null,physicalSampleRequired:true};
 graph.checks=validate(g,graph);if(!graph.checks.valid)throw Error(graph.checks.errors.join('; '));g.constructionGraph=graph;return g;
}
root.BeadConstruction={templates,compile,validate};if(typeof module!=='undefined')module.exports=root.BeadConstruction;
})(typeof window!=='undefined'?window:globalThis);
