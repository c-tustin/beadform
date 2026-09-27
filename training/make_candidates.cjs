// Original app scenes: review candidates only, never approved training targets.
const fs=require('node:fs');
require('../shape-engine.js');const P=require('../parts-engine.js');
const rows=['frog','fish','bunny','bear','butterfly','turtle','bird'].map(group=>{
 const scene=P.example(group);scene.notes='original generated draft; physical review required';
 const g=P.build(scene,{detail:3,threadDiameter:.25});
 return {id:group+'-original-01',group,prompt:'a small '+group+' bead animal with a rounded body and simple features',scene,
 source:{kind:'original-app-scene',creator:'beadform',external_material:false},training_consent:false,reviewed:false,physically_tested:false,
 review_notes:'build this exact scene, correct it, record the outcome, and attach the original input image if applicable',
 compiler_check:{valid:g.validation.valid,beads:g.nodes.length,thread_sections:g.threadSections,max_passes:g.maxPasses},image:null};
});
fs.writeFileSync(__dirname+'/candidates.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log(rows.length+' original candidates; none approved for training');
