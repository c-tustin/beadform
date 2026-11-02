// Paired digital route audit. No synthetic result establishes physical buildability.
const fs=require('node:fs');require('../shape-engine.js');
const P=require('../parts-engine.js'),Geometry=require('../bead-geometry.js'),Quality=require('../pattern-quality.js');
const prior=require('./fixtures/continuous-before-hole-routing.js'),current=require('../continuous-thread.js');
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];
if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new report.');
const snapshot=require('./evaluation_provenance.cjs').capture(['continuous-thread.js','training/fixtures/continuous-before-hole-routing.js','parts-engine.js','bead-geometry.js','peyote-ball.js','thread-finishing.js','construction-graph.js','pattern-quality.js','training/approved-expanded.jsonl','training/compare_joint_routes.cjs']);
const rows=fs.readFileSync('training/approved-expanded.jsonl','utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse),cases=[];
const inventory=g=>JSON.stringify(g.nodes.map(n=>[n.id,n.component,n.material,n.color,n.p]));
const schedule=g=>JSON.stringify(g.components.map(c=>[c.id,c.ids,c.mesh.groups]));
function measure(g){const a=Geometry.audit(g),q=Quality.inspectGraph(g);return {connections:a.connections,conflicts:a.nominalStraightPathConflicts,crossPart:a.crossPartConflicts,examples:a.examples,threadSections:g.threadSections,maxPasses:g.maxPasses,passLimit:g.passLimit,overlaps:q.cross_component_overlap_pairs,maxJoinSpan:q.max_join_center_span_mm,candidateEndpoints:g.finishing.candidateEndpoints,totalEndpoints:g.finishing.totalEndpoints,valid:g.validation.valid};}
for(const detail of [3,4])for(const threadDiameter of [.2,.25]){
 for(const row of rows){try{globalThis.BeadContinuous=prior;const before=P.build(row.scene,{detail,threadDiameter});globalThis.BeadContinuous=current;const after=P.build(row.scene,{detail,threadDiameter});cases.push({group:row.group,detail,threadDiameter,compiled:true,identicalInventoryAndPositions:inventory(before)===inventory(after),identicalStitchSchedules:schedule(before)===schedule(after),before:measure(before),after:measure(after)});}catch(e){cases.push({group:row.group,detail,threadDiameter,compiled:false,error:e.stack});}}
 console.log(JSON.stringify({detail,threadDiameter,completed:cases.length}));
}
const sum=(side,key)=>cases.reduce((n,c)=>n+(c[side]?.[key]||0),0),aggregate=side=>({conflicts:sum(side,'conflicts'),crossPart:sum(side,'crossPart'),connections:sum(side,'connections'),threadSections:sum(side,'threadSections'),candidateEndpoints:sum(side,'candidateEndpoints'),totalEndpoints:sum(side,'totalEndpoints'),clearCases:cases.filter(c=>c[side]?.overlaps===0).length,withinPassLimit:cases.filter(c=>c[side]?.maxPasses<=c[side]?.passLimit).length});
const summary={cases:cases.length,compiled:cases.filter(c=>c.compiled).length,identicalInventoryAndPositions:cases.filter(c=>c.identicalInventoryAndPositions).length,identicalStitchSchedules:cases.filter(c=>c.identicalStitchSchedules).length,before:aggregate('before'),after:aggregate('after'),physicallyTested:0};
snapshot.assertUnchanged();fs.writeFileSync(output,JSON.stringify({note:'Same authored synthetic scenes and geometry; compare route policies. Nominal straight-path flags are diagnostic, not physical success labels. Complete finishes and needle access remain unverified.',sourceSha256:snapshot.hashes,summary,cases},null,2)+'\n');console.log(JSON.stringify(summary));
