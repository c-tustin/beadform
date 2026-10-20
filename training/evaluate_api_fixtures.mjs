// Offline model-response fixtures. This script performs no network/model calls.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {generateScene} from '../server.mjs';
const require=createRequire(import.meta.url),Library=require('../parts-library.js'),Projects=require('../parts-project.js');
const provenance=require('./evaluation_provenance.cjs').capture(['training/approved-expanded.jsonl','beadform.html','volume-app.js','parts-app.js','creator-app.js','maker-tools.js','finished-app.js','build.py','shell.html','shape-engine.js', 'volume-engine.js', 'parts-engine.js', 'parts-project.js', 'parts-library.js', 'craw-block.js', 'peyote-ball.js', 'continuous-thread.js', 'thread-finishing.js', 'construction-graph.js', 'parts-layout.js', 'stage-guide.js', 'pattern-quality.js', 'training/evaluation_provenance.cjs', 'server.mjs', 'scene-schema.json', 'training/evaluate_api_fixtures.mjs']);
const args=process.argv.slice(2),i=args.indexOf('--output');if(i<0||!args[i+1])throw Error('Use --output new-report.json');const output=args[i+1];if(fs.existsSync(output))throw Error('Preserve previous evidence.');
let fixtureRequests=0;
const responseFor=scene=>async()=>{fixtureRequests++;return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(scene)}]}]})};};
const results=[];
for(const detail of [3,4])for(const threadDiameter of [.2,.25]){
 const cases=[];
 for(const row of Library.entries){try{
  const result=await generateScene({prompt:row.title,construction:'parts',detail,threadDiameter,depth:100},{provider:'openai',apiKey:'offline-fixture-placeholder',fetchImpl:responseFor(row.scene)}),g=Projects.build({shape:'custom',design:row.scene,detail,threadDiameter,depth:100,beadSize:2,routeVersion:2,orderVersion:2});
  if(result.checks.beads!==g.nodes.length||result.checks.parts!==g.components.length||result.checks.construction!=='parts'||!result.physicalSampleRequired)throw Error('API inventory differs from actual parts.');
  cases.push({id:row.id,group:row.group,valid:true,beads:result.checks.beads,parts:result.checks.parts,crawCubes:result.checks.cubes});
 }catch(e){cases.push({id:row.id,group:row.group,valid:false,error:e.message});}}
 const summary={examples:cases.length,valid:cases.filter(c=>c.valid).length};results.push({settings:{detail,threadDiameter},summary,cases});console.log(JSON.stringify(summary));
}
const invalid={title:'Collapsed arm control',parts:[{name:'body',type:'ellipsoid',role:'solid',center:[0,0,0],end:[0,0,0],size:[1,1,1],color:'#808080'},{name:'arm',type:'capsule',role:'solid',center:[1,0,0],end:[1,0,0],size:[.1,.1,.1],color:'#808080'}]};
let collapsedCapsuleRejected=false;try{await generateScene({prompt:'offline collapsed capsule control',construction:'parts',detail:3,threadDiameter:.25,depth:100},{provider:'openai',apiKey:'offline-fixture-placeholder',fetchImpl:responseFor(invalid)});}catch(e){collapsedCapsuleRejected=e.status===422&&/no meaningful capsule length/.test(e.message);}
provenance.assertUnchanged();const sourceSha256=provenance.hashes;
fs.writeFileSync(output,JSON.stringify({note:'Controlled response fixtures only: zero live provider or model calls, zero paid requests. This does not measure Qwen output quality.',fixtureRequests,liveModelCalls:0,collapsedCapsuleRejected,sourceSha256,results},null,2)+'\n');
