// Compare old and fitted geometry with the same current routing policy and scenes.
const fs=require('node:fs'),vm=require('node:vm');require('../shape-engine.js');
const Current=require('../peyote-ball.js'),P=require('../parts-engine.js'),Projects=require('../parts-project.js'),Q=require('../pattern-quality.js');
const fixture='training/fixtures/peyote-before-spacing.js',sandbox={};vm.runInNewContext(fs.readFileSync(fixture,'utf8'),sandbox);const Before=sandbox.BeadPeyote;
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new --output report.');
const snapshot=require('./evaluation_provenance.cjs').capture([fixture,'peyote-ball.js','parts-engine.js','parts-project.js','continuous-thread.js','bead-geometry.js','construction-graph.js','craw-block.js','thread-finishing.js','pattern-quality.js','training/approved-expanded.jsonl','training/compare_peyote_spacing.cjs']);
const profiles=[];
for(const profile of ['ball','body','dome','pear'])for(const big of [false,true])for(const economy of [false,true]){
 const old=Before.ball(big,profile,economy),m=Current.ball(big,profile,economy),n=m.count;
 if(n!==old.count||JSON.stringify(m.groups)!==JSON.stringify(old.groups))throw Error('Template count or stitch sequence changed.');
 profiles.push({profile,big,economy,beads:n,identicalScheduleAndSequence:true,minimumNominalCenterPlaneClearanceMm:m.geometry.minimumCenterPlaneClearanceMm});
}
const rows=fs.readFileSync('training/approved-expanded.jsonl','utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse),cases=[];
const inventory=g=>JSON.stringify(g.components.map(c=>[c.id,c.name,c.kind,c.mesh.stitch,c.ids])),route=g=>JSON.stringify([g.nodes.map(n=>[n.id,n.p.map(v=>+v.toFixed(6)),n.material]),g.stages.map(st=>st.operations.map(o=>[o.id,o.kind,o.from,o.to,o.phase,o.section]))]);
const metrics=g=>({beads:g.nodes.length,connections:g.threadAccess.connections,nominalFlags:g.threadAccess.nominalStraightPathConflicts,crossPart:g.threadAccess.crossPartConflicts,threadSections:g.threadSections,maxPasses:g.maxPasses,detectedCrossPartOverlaps:Q.inspectGraph(g).cross_component_overlap_pairs});
for(const detail of [3,4])for(const threadDiameter of [.2,.25])for(const row of rows){
 try{
  const settings={shape:'custom',design:row.scene,detail,threadDiameter,depth:100,beadSize:2,routeVersion:2,orderVersion:2,colorSource:'design',projection:'front',maxColors:6,keepEyes:true};
  globalThis.BeadPeyote=Before;const before=P.build(row.scene,settings);
  globalThis.BeadPeyote=Current;const after=P.build(row.scene,settings);
  const project={format:'beadform-project',version:5,dimension:'volume',construction:'parts',settings,palette:before.palette,colors:before.colors,partsGuide:{version:Projects.guideVersion,routeKey:Projects.routeKey(before),stage:2,reveal:3},makerProgress:{finished:[1]},manualEdits:true},loaded=Projects.open(project),sameRoute=route(before)===route(after),archive=loaded.legacyProjectData;
  const migrationValid=loaded.resume===sameRoute&&(sameRoute||archive?.partsGuide?.routeKey===project.partsGuide.routeKey&&archive?.makerProgress?.finished?.length===1);
  if(!migrationValid)throw Error('Old geometry progress was lost or resumed against a changed route.');
  cases.push({group:row.group,detail,threadDiameter,compiled:true,identicalPartInventory:inventory(before)===inventory(after),priorProjectMigrationValid:migrationValid,priorRouteStillMatches:sameRoute,before:metrics(before),after:metrics(after)});
 }catch(e){cases.push({group:row.group,detail,threadDiameter,compiled:false,error:e.message});}
 finally{globalThis.BeadPeyote=Current;}
}
const sum=(key,side)=>cases.reduce((n,c)=>n+(c[side]?.[key]||0),0),summary={cases:cases.length,compiled:cases.filter(c=>c.compiled).length,identicalPartInventory:cases.filter(c=>c.identicalPartInventory).length,priorProjectMigrationValid:cases.filter(c=>c.priorProjectMigrationValid).length,unchangedRoutesResume:cases.filter(c=>c.priorRouteStillMatches).length,before:{flags:sum('nominalFlags','before'),crossPart:sum('crossPart','before'),connections:sum('connections','before'),threadSections:sum('threadSections','before')},after:{flags:sum('nominalFlags','after'),crossPart:sum('crossPart','after'),connections:sum('connections','after'),threadSections:sum('threadSections','after')}};
snapshot.assertUnchanged();fs.writeFileSync(output,JSON.stringify({note:'Paired nominal geometry and project-migration audit. Not a physical build or independent generalization benchmark.',sourceSha256:snapshot.hashes,summary,profiles,cases},null,2)+'\n');console.log(JSON.stringify(summary));
