// Verify that parts and construction checks inspect actual bead coordinates.
const fs=require('node:fs');require('../shape-engine.js');
const priorP=require('./fixtures/parts-before-clearance-check.js'),priorG=require('./fixtures/construction-before-clearance-check.js'),P=require('../parts-engine.js'),G=require('../construction-graph.js'),Geometry=require('../bead-geometry.js');globalThis.BeadParts=P;globalThis.BeadConstruction=G;
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new report.');
const snapshot=require('./evaluation_provenance.cjs').capture(['bead-geometry.js','parts-engine.js','construction-graph.js','training/fixtures/parts-before-clearance-check.js','training/fixtures/construction-before-clearance-check.js','training/approved-expanded.jsonl','training/audit_clearance_controls.cjs']);
const scene=fs.readFileSync('training/approved-expanded.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse).find(r=>r.group==='frog').scene,model=P.build(scene,{detail:3,threadDiameter:.25}),controls=[];
for(const kind of ['overlapped-eye','nonfinite-position','invalid-diameter']){
 const g=structuredClone(model),eye=g.components.find(c=>c.mesh.eye),bead=g.byId.get(eye.ids[0]);
 if(kind==='overlapped-eye'){const join=g.joins.find(j=>j.component===eye.id),target=g.byId.get(join.pairs[0].a),shift=target.p.map((v,i)=>v-bead.p[i]);bead.p=target.p.slice();eye.world=eye.world.map((v,i)=>v+shift[i]);eye.vertices=eye.vertices.map(p=>p.map((v,i)=>v+shift[i]));}
 if(kind==='nonfinite-position')bead.p[0]=NaN;
 if(kind==='invalid-diameter')bead.diameterMm=0;
 const oldParts=priorP.validate(g),oldGraph=priorG.validate(g,g.constructionGraph),parts=P.validate(g),graph=G.validate(g,g.constructionGraph),actual=Geometry.clearance(g,{exampleLimit:0});
 if(!oldParts.valid||!oldGraph.valid||parts.valid||graph.valid||actual.valid||!graph.errors.includes('invalid nominal cross-part bead clearance'))throw Error('Clearance control failed: '+kind);
 // The graph still contains its prior valid/zero-overlap claim. Rechecking the
 // actual model must reject it instead of trusting that cached claim.
 if(g.constructionGraph.nominalClearance.valid!==true)throw Error('Expected prior zero-overlap metadata.');
 controls.push({kind,priorPartsAccepted:oldParts.valid,priorGraphAccepted:oldGraph.valid,currentPartsRejected:!parts.valid,currentGraphRejected:!graph.valid,cachedClearanceClaimIgnored:true,nominalOverlapPairs:actual.nominalOverlapPairs,invalidBeads:actual.invalidBeads});
}
const pair=d=>({nodes:[{id:'a',component:'A',diameterMm:2,p:[0,0,0]},{id:'b',component:'B',diameterMm:2,p:[d,0,0]}]}),boundary=Geometry.clearance(pair(1.95)),within=Geometry.clearance(pair(1.951)),beyond=Geometry.clearance(pair(1.949));
if(!boundary.valid||!within.valid||beyond.valid)throw Error('Nominal tolerance boundary failed.');
const clustered={nodes:['A','B','C'].map((component,i)=>({id:'n'+i,component,diameterMm:2,p:[0,0,0]}))},limited=Geometry.clearance(clustered,{exampleLimit:1});if(limited.nominalOverlapPairs!==3||limited.examples.length!==1||limited.pairsChecked!==3)throw Error('Example cap truncated the pair count.');
const samePart=pair(0);samePart.nodes[1].component='A';const excluded=Geometry.clearance(samePart);if(!excluded.valid||excluded.pairsChecked!==0)throw Error('Cross-part guard unexpectedly checked a within-part pair.');
const stale=structuredClone(model);stale.validation.nominalClearance.valid=false;const exported=G.compile(stale).constructionGraph;const freshExportIgnoresStaleValidation=exported.checks.valid&&exported.nominalClearance.valid;if(!freshExportIgnoresStaleValidation)throw Error('Export reused a stale clearance claim.');
snapshot.assertUnchanged();fs.writeFileSync(output,JSON.stringify({note:'Deliberately altered computed frog models and synthetic boundary controls, not natural generated failures or physical samples. Cached graph claims are not trusted. Within-part geometry is outside this guard.',sourceSha256:snapshot.hashes,controls,boundary:{atToleranceAccepted:boundary.valid,withinAccepted:within.valid,beyondRejected:!beyond.valid,numericalEpsilonMm:boundary.numericalEpsilonMm},exampleLimitPreservesAllCounts:true,samePartPairsExcluded:true,freshExportIgnoresStaleValidation,physicalSamples:0},null,2)+'\n');console.log(JSON.stringify({rejectedPreviouslyAcceptedModels:controls.length,toleranceControlsPassed:true,allPairsCounted:true}));
