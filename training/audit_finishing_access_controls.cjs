// Verify that geometry checks reject known obstructed prior candidates.
const fs=require('node:fs');require('../shape-engine.js');
const P=require('../parts-engine.js'),prior=require('./fixtures/finishing-before-access.js'),current=require('../thread-finishing.js');
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new output.');
const snapshot=require('./evaluation_provenance.cjs').capture(['thread-finishing.js','training/fixtures/finishing-before-access.js','continuous-thread.js','bead-geometry.js','parts-engine.js','training/approved-expanded.jsonl','training/audit_finishing_access_controls.cjs']);
const rows=fs.readFileSync('training/approved-expanded.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse),cases=[];
for(const [group,detail,threadDiameter]of [['cactus',3,.25],['sailboat',4,.2],['sailboat',4,.25]]){
 const scene=rows.find(r=>r.group===group).scene;globalThis.BeadFinishing=prior;const oldGraph=P.build(scene,{detail,threadDiameter}),proposal=oldGraph.finishing;
 const access=current.auditAccess(oldGraph,proposal),check=current.validate(oldGraph,proposal),forged=JSON.parse(JSON.stringify(proposal));forged.nominalAccess={nominalStraightPathConflicts:0};
 const forgedCheck=current.validate(oldGraph,forged);globalThis.BeadFinishing=current;const revised=P.build(scene,{detail,threadDiameter});
 const blockedRouteRejected=!check.valid&&check.errors.includes('finishing route intersects a nominal bead envelope'),forgedClaimRejected=!forgedCheck.valid&&forgedCheck.errors.includes('finishing route intersects a nominal bead envelope');
 if(access.nominalStraightPathConflicts!==1||!blockedRouteRejected||!forgedClaimRejected||!revised.finishing.checks.valid||revised.finishing.nominalAccess.nominalStraightPathConflicts||revised.finishing.candidateEndpoints!==revised.finishing.totalEndpoints)throw Error('Finishing access control failed.');
 cases.push({group,detail,threadDiameter,priorConflicts:access.nominalStraightPathConflicts,blockedRouteRejected,forgedClaimRejected,revisedConflicts:revised.finishing.nominalAccess.nominalStraightPathConflicts,allEndsHaveCandidate:true});
}
snapshot.assertUnchanged();fs.writeFileSync(output,JSON.stringify({note:'Focused controls using three actual obstructed candidates from the preceding published finisher. Not physical validation.',sourceSha256:snapshot.hashes,cases},null,2)+'\n');console.log(JSON.stringify(cases));
