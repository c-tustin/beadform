// Controlled DOM facade: exercise actual parts-app export functions without a browser.
const fs=require('node:fs'),vm=require('node:vm');require('../shape-engine.js');
const Layout=require('../parts-layout.js'),P=require('../parts-engine.js'),Stages=require('../stage-guide.js'),Guide=require('../finishing-guide.js'),Geometry=require('../bead-geometry.js');
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new report.');
const snapshot=require('./evaluation_provenance.cjs').capture(['parts-app.js','finishing-guide.js','thread-finishing.js','parts-engine.js','continuous-thread.js','bead-geometry.js','stage-guide.js','parts-layout.js','training/approved-expanded.jsonl','training/audit_finishing_guide_exports.cjs']);
const source=fs.readFileSync('parts-app.js','utf8'),rows=fs.readFileSync('training/approved-expanded.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse),cases=[];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [group,detail,threadDiameter]of [['frog',3,.25],['cactus',3,.25],['sailboat',4,.2],['robot',3,.25]]){
 const scene=rows.find(r=>r.group===group).scene,g=P.build(scene,{detail,threadDiameter}),elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,innerHTML:'',textContent:'',hidden:false,classList:{toggle(){}},setAttribute(){},addEventListener(){},close(){},scrollIntoView(){}});return elements.get(id);};
 const document={getElementById:element,querySelectorAll:()=>[]},state={settings:{shape:'custom',design:scene,detail,threadDiameter},model:g,title:scene.title,construction:'parts',partsStage:0,partsReveal:Infinity};g.sceneKey=JSON.stringify([scene,detail,threadDiameter]);
 let printRequested=false;const window={Beadform3D:{state,download(){}},BeadParts:P,BeadStages:Stages,BeadPartsLayout:Layout,BeadGeometry:Geometry,BeadFinishingGuide:Guide,Beadform:{ui:{esc:escape,modal(){},toast(){}}},print(){printRequested=true;}};
 vm.runInNewContext(source,{window,document,setTimeout:fn=>fn(),console},{filename:'parts-app.js'});
 const studio=window.BeadPartsStudio;if(!studio?.model||!element('pThreadPlan').innerHTML)throw Error('Parts app did not render: '+element('pStatus').textContent);
 const screen=element('pThreadPlan').innerHTML,text=studio.textGuide();studio.printGuide();const print=element('printArea').innerHTML,expected=g.finishing.candidateEndpoints,count=s=>(s.match(/class="finishing-route-card"/g)||[]).length;
 if(count(screen)!==expected||count(print)!==expected||!printRequested||!screen.includes('finishing-screen-')||!print.includes('finishing-print-'))throw Error('Finishing diagram export wiring failed.');
 for(const end of g.finishing.endpoints)for(const p of Guide.describe(g,end).passes)if(!text.includes(`${p.number}. Pass bead ${Number(p.id.slice(1))}, ${p.part}, color ${p.colorNumber}: enter ${p.entrance}, exit ${p.exit}.`))throw Error('Text export differs from computed finishing route.');
 cases.push({group,detail,threadDiameter,screenDiagrams:count(screen),printDiagrams:count(print),textMatches:true,printRequested:true});
}
snapshot.assertUnchanged();fs.writeFileSync(output,JSON.stringify({note:'Actual parts-app rendering and export functions with a controlled DOM facade. No real browser clicks, print pagination, file downloads or physical construction are verified.',sourceSha256:snapshot.hashes,cases},null,2)+'\n');console.log(JSON.stringify(cases));
