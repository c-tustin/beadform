// Local CPU evaluation. Does not approve examples or claim physical success.
const fs=require('node:fs'),path=require('node:path');
require('../shape-engine.js');const Parts=require('../parts-engine.js'),Quality=require('../pattern-quality.js');
const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const input=option('--predictions'),requirements=option('--requirements'),output=option('--output');
if(!input||!requirements||!output)throw Error('Usage: node training/evaluate_pattern_quality.cjs --predictions model.jsonl --requirements benchmark.jsonl --output results.json');
if(fs.existsSync(output))throw Error('Output exists; choose a new path to preserve previous evidence.');
const rows=file=>fs.readFileSync(file,'utf8').split(/\r?\n/).filter(x=>x.trim()).map(JSON.parse);
const specs=rows(requirements),byId=new Map(specs.map(r=>[r.id,r]));
if(byId.size!==specs.length)throw Error('Duplicate benchmark IDs.');
const predictions=rows(input),seen=new Set();
function measure(scene,spec){
 const shape=Quality.inspectScene(scene,{requirements:spec.requirements});let graph;
 try{graph=Quality.inspectGraph(Parts.build(scene,{detail:3,threadDiameter:.25}));}catch(e){graph={compiler_valid:false,error:e.message,physicalSampleRequired:true};}
 return {scene:shape,graph};
}
const results=predictions.map(row=>{
 const spec=byId.get(row.id);if(!spec||seen.has(row.id)||row.prompt!==spec.prompt||row.group!==spec.group)throw Error('Predictions must match unique benchmark IDs, prompts and families.');seen.add(row.id);
 let scene;try{scene=row.prediction_raw?JSON.parse(row.prediction_raw):row.scene;}catch(e){return {id:row.id,group:row.group,parse_error:e.message};}
 const original=measure(scene,spec),proposal=Quality.separatePaintedEyes(scene);
 return {id:row.id,group:row.group,original,proposal:proposal.changes.length?{...proposal,quality:measure(proposal.scene,spec)}:null};
});
if(seen.size!==byId.size)throw Error('Supply the complete benchmark, not a favorable subset.');
const summary={examples:results.length,original_scene_checks_pass:results.filter(r=>r.original?.scene.passes).length,original_compiler_pass:results.filter(r=>r.original?.graph.compiler_valid).length,original_cross_component_clearance_pass:results.filter(r=>r.original?.graph.compiler_valid&&r.original.graph.cross_component_overlap_pairs===0).length,eye_spacing_proposals:results.filter(r=>r.proposal).length,physically_tested:0,note:'Feature checks are explicit lower-bound requirements; clearance uses conservative nominal spherical envelopes. Neither establishes recognizable or physically buildable patterns.'};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({summary,results},null,2)+'\n');console.log(JSON.stringify(summary,null,2));
