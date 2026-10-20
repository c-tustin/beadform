(function(root){
'use strict';
const guideVersion=12;
function volume(){if(!root.BeadVolume&&typeof require==='function'){require('./shape-engine.js');require('./volume-engine.js');}return root.BeadVolume;}
function parts(){return root.BeadParts||(typeof require==='function'?require('./parts-engine.js'):null);}
function source(settings){if(settings.shape==='custom'){if(settings.design?.kind==='image')throw Error('A parts project needs an interpreted subject, not an inflated image outline.');return settings.design;}return parts().example(settings.shape);}
function build(settings){volume().settings(settings);const scene=source(settings),g=parts().build(scene,settings);g.sceneKey=JSON.stringify([scene,settings.detail,settings.threadDiameter]);return g;}
function routeKey(g){return JSON.stringify([guideVersion,g.nodes.map(n=>[n.id,n.p.map(v=>Number(v.toFixed(6))),n.material,g.palette[g.colors[n.index]]]),g.stages.map(st=>st.operations.map(o=>[o.id,o.kind,o.from,o.to,o.phase,o.section]))]);}
function open(project){
 if(project.format!=='beadform-project'||project.dimension!=='volume'||project.construction!=='parts'||![2,3,4,5].includes(project.version))throw Error('Unsupported parts project.');
 const input=project.settings,normalized=volume().settings(input),settings={...input,...normalized};
 if(!['template','image','design'].includes(settings.colorSource)||!['front','both'].includes(settings.projection)||!Number.isInteger(settings.maxColors)||settings.maxColors<2||settings.maxColors>10||typeof settings.keepEyes!=='boolean')throw Error('Invalid parts color settings.');
 const g=build(settings);
 if(project.version===5){
  if(!Array.isArray(project.palette)||!project.palette.length||project.palette.length>48||project.palette.some(h=>typeof h!=='string'||!/^#[0-9a-f]{6}$/i.test(h)))throw Error('Invalid parts palette.');
  if(!Array.isArray(project.colors)||project.colors.length!==g.nodes.length||project.colors.some(c=>!Number.isInteger(c)||c<0||c>=project.palette.length))throw Error('Saved colors do not match the parts inventory.');
  g.palette=project.palette.slice();g.colors=project.colors.slice();g.nodes.forEach(n=>{n.color=g.palette[g.colors[n.index]];});
 }
 const resume=project.version===5&&project.partsGuide?.version===guideVersion&&project.partsGuide.routeKey===routeKey(g);
 return {model:g,settings,resume,legacyProjectData:project.version<5?{formatVersion:project.version,settings:project.settings,palette:project.palette,colors:project.colors,manualEdits:project.manualEdits,partsGuide:project.partsGuide,makerProgress:project.makerProgress,guide:project.guide,step:project.step,layer:project.layer}:project.legacyProjectData||project.legacyVoxelEdits||null};
}
root.BeadPartsProject={build,open,routeKey,guideVersion};if(typeof module!=='undefined')module.exports=root.BeadPartsProject;
})(typeof window!=='undefined'?window:globalThis);
