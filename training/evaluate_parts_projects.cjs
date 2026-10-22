// Actual parts entry and project round-trip audit, independent of voxelization.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const Projects=require('../parts-project.js'),Library=require('../parts-library.js');
const provenance=require('./evaluation_provenance.cjs').capture(['training/approved-expanded.jsonl','beadform.html','volume-app.js','parts-app.js','creator-app.js','maker-tools.js','finished-app.js','build.py','shell.html','shape-engine.js', 'volume-engine.js', 'bead-geometry.js', 'parts-engine.js', 'parts-project.js', 'parts-library.js', 'craw-block.js', 'peyote-ball.js', 'continuous-thread.js', 'thread-finishing.js', 'construction-graph.js', 'parts-layout.js', 'stage-guide.js', 'pattern-quality.js', 'training/evaluation_provenance.cjs', 'training/evaluate_parts_projects.cjs']);
const args=process.argv.slice(2),i=args.indexOf('--output');if(i<0||!args[i+1])throw Error('Use --output new-report.json');const output=args[i+1];if(fs.existsSync(output))throw Error('Preserve previous evidence.');
const results=[];
for(const detail of [3,4])for(const threadDiameter of [.2,.25]){
 const cases=Library.entries.map(row=>{try{
  const settings={shape:'custom',design:row.scene,detail,threadDiameter,depth:100,beadSize:2,routeVersion:2,orderVersion:2,colorSource:'design',projection:'front',maxColors:6,keepEyes:true},g=Projects.build(settings);
  const project={format:'beadform-project',version:5,dimension:'volume',construction:'parts',settings,palette:g.palette,colors:g.colors,partsGuide:{version:Projects.guideVersion,routeKey:Projects.routeKey(g),stage:0,reveal:null}};
  const loaded=Projects.open(JSON.parse(JSON.stringify(project))),legacy=Projects.open({...project,version:4,partsGuide:{version:11},palette:['#ffffff'],colors:[0],manualEdits:true});
  const stale={...project,partsGuide:{...project.partsGuide,routeKey:'prior-route-reference',stage:3},makerProgress:{finished:[1,2]},manualEdits:true},revised=Projects.open(stale);
  const matches=Projects.routeKey(loaded.model)===Projects.routeKey(g),legacyPreserved=legacy.legacyProjectData?.manualEdits===true&&legacy.legacyProjectData.colors.length===1,revisedPreserved=!revised.resume&&revised.legacyProjectData?.partsGuide?.routeKey===stale.partsGuide.routeKey&&revised.legacyProjectData?.makerProgress?.finished?.length===2;
  if(!loaded.resume||!matches||legacy.resume||!legacyPreserved||!revisedPreserved||g.structure!=='modules')throw Error('Parts project round-trip or migration failed.');
  return {id:row.id,group:row.group,valid:true,beads:g.nodes.length,matchingRouteResumes:true,legacyMigrationResetsProgress:true,legacyVoxelEditsPreserved:true,revisedVersion5PreservesOldGuide:true};
 }catch(e){return {id:row.id,group:row.group,valid:false,error:e.message};}});
 const summary={examples:cases.length,valid:cases.filter(c=>c.valid).length};results.push({settings:{detail,threadDiameter},summary,cases});console.log(JSON.stringify(summary));
}
provenance.assertUnchanged();fs.writeFileSync(output,JSON.stringify({note:'Parts entry, version-5 round trips and legacy-parts migration. Physical buildability and browser rendering are separate checks.',sourceSha256:provenance.hashes,results},null,2)+'\n');
