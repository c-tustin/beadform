// Exercise actual selection decisions and controlled non-regression inputs.
const fs=require('node:fs');require('../shape-engine.js');const P=require('../parts-engine.js');
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new report.');
const snapshot=require('./evaluation_provenance.cjs').capture(['parts-engine.js','continuous-thread.js','construction-graph.js','thread-finishing.js','bead-geometry.js','training/approved-expanded.jsonl','training/audit_joint_selection.cjs']);
const rows=fs.readFileSync('training/approved-expanded.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse),cases=[];
for(const [group,detail,line,weight,reason]of [['sailboat',4,.25,0,'widest joint increased'],['robot',3,.25,0,'requested arm height worsened'],['flower',3,.25,0,'no net joint improvement'],['whale',3,.2,0,'widest joint increased'],['turtle',3,.25,250,null],['ladybug',4,.25,250,null]]){
 const g=P.build(rows.find(r=>r.group===group).scene,{detail,threadDiameter:line}),s=g.jointSelection;if(s.selectedWeight!==weight||reason&&!s.comparison.reasons.includes(reason)||s.attempts.length!==2||s.attempts.some(a=>!a.compiled))throw Error('Unexpected joint selection for '+group);
 cases.push({group,detail,line,selectedWeight:s.selectedWeight,reasons:s.comparison.reasons,workingLengths:g.threadSections});
}
const model=P.build(rows.find(r=>r.group==='turtle').scene,{detail:3,threadDiameter:.25}),controls=[];
for(const kind of ['geometry','fewer-loops','finishing-coverage','pass-budget','assembly-flags','finishing-flags']){
 const changed=structuredClone(model);
 if(kind==='geometry')changed.nodes[0].p[0]+=.1;
 if(kind==='fewer-loops')changed.joins.find(j=>j.pairs.length===2).pairs.pop();
 if(kind==='finishing-coverage')changed.finishing.candidateEndpoints--;
 if(kind==='pass-budget')changed.finishing.proposedMaxPasses=changed.passLimit+1;
 if(kind==='assembly-flags')changed.threadAccess.nominalStraightPathConflicts++;
 if(kind==='finishing-flags')changed.finishing.nominalAccess.nominalStraightPathConflicts++;
 const expected={geometry:'geometry or colored inventory changed','fewer-loops':'fewer attachment loops','finishing-coverage':'finishing coverage or passage budget worsened','pass-budget':'finishing coverage or passage budget worsened','assembly-flags':'more nominal approach flags','finishing-flags':'more nominal approach flags'};const result=P.compareJointPlans(model,changed);if(result.preferCandidate||!result.reasons.includes(expected[kind]))throw Error('Regression guard was not applied: '+kind);controls.push({kind,rejected:true,reasons:result.reasons});
}
const flagged=structuredClone(model);flagged.threadAccess.nominalStraightPathConflicts++;
const accessPrioritized=P.compareJointPlans(flagged,model).preferCandidate;if(!accessPrioritized)throw Error('A clear approach did not win over an artificial extra flag.');
snapshot.assertUnchanged();fs.writeFileSync(output,JSON.stringify({note:'Six actual scene decisions plus deliberately altered selector inputs. The altered inputs are not claimed valid physical plans or training targets.',sourceSha256:snapshot.hashes,cases,controls,accessPrioritized,physicalSamples:0},null,2)+'\n');console.log(JSON.stringify({actualDecisions:cases.length,rejectedControls:controls.length,accessPrioritized}));
