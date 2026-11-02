// Audit the actual guide order using nominal oriented bead envelopes.
const fs=require('node:fs');require('../shape-engine.js');
const P=require('../parts-engine.js'),Geometry=require('../bead-geometry.js'),provenance=require('./evaluation_provenance.cjs');
const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
if(!args.includes('--output'))throw Error('Use --output a-new-report.json');
const output=value('--output');if(fs.existsSync(output))throw Error('Preserve existing evidence; choose a new output.');
const snapshot=provenance.capture(['bead-geometry.js','parts-engine.js','continuous-thread.js','craw-block.js','peyote-ball.js','thread-finishing.js','construction-graph.js','training/approved-expanded.jsonl','training/evaluate_thread_access.cjs']);
const rows=fs.readFileSync('training/approved-expanded.jsonl','utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse),results=[];
for(const detail of [3,4])for(const threadDiameter of [.2,.25]){
 const cases=[];
 for(const row of rows){try{const g=P.build(row.scene,{detail,threadDiameter}),audit=Geometry.audit(g);cases.push({group:row.group,compiled:true,beads:g.nodes.length,...audit});}catch(e){cases.push({group:row.group,compiled:false,error:e.message});}}
 const summary={cases:cases.length,compiled:cases.filter(c=>c.compiled).length,connections:cases.reduce((s,c)=>s+(c.connections||0),0),nominalStraightPathConflicts:cases.reduce((s,c)=>s+(c.nominalStraightPathConflicts||0),0),crossPartConflicts:cases.reduce((s,c)=>s+(c.crossPartConflicts||0),0)};
 results.push({settings:{detail,threadDiameter},summary,cases});console.log(JSON.stringify({detail,threadDiameter,...summary}));
}
snapshot.assertUnchanged();fs.writeFileSync(output,JSON.stringify({sourceSha256:snapshot.hashes,note:'Nominal access diagnostics, not physical validation or an independent pattern benchmark.',results},null,2)+'\n');
