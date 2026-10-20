// The parts studio still creates a legacy voxel model before showing parts.
// Audit that entry gate separately rather than assuming a parts pass opens UI.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');require('../shape-engine.js');
require('../volume-engine.js');const V=globalThis.BeadVolume,Stages=require('../stage-guide.js'),Library=require('../parts-library.js');
const args=process.argv.slice(2),i=args.indexOf('--output');if(i<0||!args[i+1])throw Error('Use --output new-report.json');const output=args[i+1];if(fs.existsSync(output))throw Error('Preserve previous evidence.');
const results=[];
for(const detail of [3,4])for(const threadDiameter of [.2,.25]){
 const cases=Library.entries.map(row=>{try{const g=V.build({shape:'custom',design:row.scene,detail,depth:100,beadSize:2,routeVersion:2,orderVersion:2,threadDiameter}),stages=Stages.build(g);return {id:row.id,group:row.group,valid:g.validation.valid,errors:g.validation.errors,legacyBeads:g.nodes.length,legacyStages:stages.length};}catch(e){return {id:row.id,group:row.group,valid:false,error:e.message};}});
 results.push({settings:{detail,threadDiameter},summary:{examples:cases.length,valid:cases.filter(r=>r.valid).length},cases});console.log(JSON.stringify(results.at(-1).summary));
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',p))).digest('hex');fs.writeFileSync(output,JSON.stringify({note:'Legacy voxel gate and stage construction only; not full browser coverage or physical validation.',sourceSha256:Object.fromEntries(['shape-engine.js','volume-engine.js','stage-guide.js','parts-library.js'].map(p=>[p,hash(p)])),results},null,2)+'\n');
