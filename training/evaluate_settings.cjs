// Full library settings sweep. A failed compile stays in the denominator.
const fs=require('node:fs'),crypto=require('node:crypto');require('../shape-engine.js');
const P=require('../parts-engine.js'),Q=require('../pattern-quality.js');
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
if(!args.includes('--data')||!args.includes('--output'))throw Error('Use --data scenes.jsonl --output new.json');
const input=arg('--data'),output=arg('--output');if(fs.existsSync(output))throw Error('Choose a new output to preserve evidence.');
const rows=fs.readFileSync(input,'utf8').split(/\r?\n/).filter(s=>s.trim()).map(JSON.parse),results=[];
if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate IDs.');
for(const detail of [3,4])for(const threadDiameter of [.2,.25]){
 const settings={detail,threadDiameter},cases=[];
 for(const row of rows){try{const g=P.build(row.scene,settings),q=Q.inspectGraph(g);cases.push({id:row.id,group:row.group,compilerValid:true,beads:g.nodes.length,overlapPairs:q.cross_component_overlap_pairs,finishingCandidateEndpoints:g.finishing.candidateEndpoints,totalEndpoints:g.finishing.totalEndpoints,finishingInventoryValid:g.finishing.checks.valid});}catch(e){cases.push({id:row.id,group:row.group,compilerValid:false,error:e.message});}}
 const summary={examples:rows.length,compilerValid:cases.filter(c=>c.compilerValid).length,clearanceValid:cases.filter(c=>c.compilerValid&&c.overlapPairs===0).length,allEndsHaveCandidate:cases.filter(c=>c.compilerValid&&c.finishingCandidateEndpoints===c.totalEndpoints&&c.finishingInventoryValid).length,physicallyTested:0};results.push({settings,summary,cases});console.log(JSON.stringify({settings,summary}));
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');fs.writeFileSync(output,JSON.stringify({note:'Digital settings sweep; clearance and draft weave-in routes do not establish physical buildability.',dataSha256:hash(input),sourceSha256:Object.fromEntries(['parts-engine.js','continuous-thread.js','thread-finishing.js','pattern-quality.js'].map(p=>[p,hash(require('node:path').join(__dirname,'..',p))])),results},null,2)+'\n');
