// Audit candidate weave-in routes; never label a finish physically secure.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('../shape-engine.js');const Parts=require('../parts-engine.js'),Finishing=require('../thread-finishing.js');
const args=process.argv.slice(2),option=k=>args[args.indexOf(k)+1];
if(!args.includes('--data')||!args.includes('--output'))throw Error('Use --data scenes.jsonl --output new-report.json');
const input=option('--data'),output=option('--output');if(fs.existsSync(output))throw Error('Preserve previous evidence; choose a new output.');
const rows=fs.readFileSync(input,'utf8').split(/\r?\n/).filter(s=>s.trim()).map(JSON.parse);
if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate case IDs.');
const results=rows.map(row=>{
 const g=Parts.build(row.scene,{detail:3,threadDiameter:.25}),assembly=new Map(g.nodes.map(n=>[n.id,0]));
 for(const stage of g.stages)for(const op of stage.operations)assembly.set(op.id,assembly.get(op.id)+1);
 if([...assembly].some(([id,count])=>g.counts.get(id)!==count))throw Error('Assembly inventory differs from actual operations.');
 const before=JSON.stringify([...g.counts]),candidate=g.finishing,checks=Finishing.validate(g,candidate);
 if(before!==JSON.stringify([...g.counts])||!checks.valid)throw Error('Finishing audit failed or changed assembly counts.');
 return {id:row.id,group:row.group,finishing:candidate};
});
const summary={examples:results.length,candidateEndpoints:results.reduce((n,r)=>n+r.finishing.candidateEndpoints,0),totalEndpoints:results.reduce((n,r)=>n+r.finishing.totalEndpoints,0),allEndpointsHaveCandidate:results.filter(r=>r.finishing.candidateEndpoints===r.finishing.totalEndpoints).length,validCandidateInventories:results.filter(r=>r.finishing.checks.valid).length,completeFinishes:0,physicallyTested:0,note:'Three-bead search heuristic only. Routes and combined passage counts are audited; knots, hole access, tension and holding strength remain unverified.'};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),provenance={dataSha256:hash(input),detail:3,threadDiameterMm:.25,sourceSha256:Object.fromEntries(['parts-engine.js','thread-finishing.js','continuous-thread.js','construction-graph.js'].map(p=>[p,hash(path.join(__dirname,'..',p))]))};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({summary,provenance,results},null,2)+'\n');console.log(JSON.stringify(summary,null,2));
