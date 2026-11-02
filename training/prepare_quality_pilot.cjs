// Filter already approved scenes using the current digital quality checks.
// Approval flags and target scenes are retained exactly; no new approvals are created.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('../shape-engine.js');const Parts=require('../parts-engine.js'),Quality=require('../pattern-quality.js');
const args=process.argv.slice(2),value=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const input=value('--input',path.join(__dirname,'approved-expanded.jsonl')),output=value('--output',null);
if(!output)throw Error('Pass --output with a new directory.');if(fs.existsSync(output))throw Error('Output exists; choose a new directory.');
const heldout=new Set(value('--holdout','frog,mushroom,cloud').split(',').map(x=>x.trim()));
const rows=fs.readFileSync(input,'utf8').trim().split(/\r?\n/).map(JSON.parse),train=[],evaluation=[],excluded=[];
for(const row of rows){
 if(['training_consent','reviewed','scene_validated'].some(k=>row[k]!==true))throw Error('Input includes an unapproved row: '+row.id);
 const scene=Quality.inspectScene(row.scene);let graph;
 try{graph=Quality.inspectGraph(Parts.build(row.scene,{detail:3,threadDiameter:.25}));}catch(e){excluded.push({id:row.id,group:row.group,reason:e.message});continue;}
 if(!scene.passes||!graph.compiler_valid||graph.cross_component_overlap_pairs){excluded.push({id:row.id,group:row.group,reason:'Scene, compiler or conservative clearance check failed.',issues:scene.issues,overlap_pairs:graph.cross_component_overlap_pairs});continue;}
 (heldout.has(row.group)?evaluation:train).push(row);
}
if(!train.length||!evaluation.length)throw Error('Both training and evaluation need eligible examples.');
const trainGroups=new Set(train.map(r=>r.group));if(evaluation.some(r=>trainGroups.has(r.group)))throw Error('Family leakage.');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest={input_sha256:hash(input),parts_engine_sha256:hash(path.join(__dirname,'../parts-engine.js')),quality_checks_sha256:hash(path.join(__dirname,'../pattern-quality.js')),train_rows:train.length,eval_rows:evaluation.length,heldout_families:[...heldout],excluded,physically_tested:false,note:'Quality-filtered subset of existing approved synthetic scenes. Compiler and conservative nominal-clearance checks do not establish physical buildability or feature fidelity. Previously inspected held-out families are development evaluation, not a new generalization benchmark.'};
fs.mkdirSync(output,{recursive:true});for(const [name,data]of [['train',train],['eval',evaluation]])fs.writeFileSync(path.join(output,name+'.jsonl'),data.map(r=>JSON.stringify(r)).join('\n')+'\n');fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
