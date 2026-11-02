// Audit instruction parity and nominal diagram spacing, not physical buildability.
const fs=require('node:fs');require('../shape-engine.js');
const P=require('../parts-engine.js'),Guide=require('../finishing-guide.js');
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new report.');
const snapshot=require('./evaluation_provenance.cjs').capture(['finishing-guide.js','thread-finishing.js','parts-engine.js','continuous-thread.js','bead-geometry.js','parts-app.js','training/approved-expanded.jsonl','training/audit_finishing_guides.cjs']);
const rows=fs.readFileSync('training/approved-expanded.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse),cases=[];
for(const detail of [3,4])for(const threadDiameter of [.2,.25]){
 for(const row of rows){try{const g=P.build(row.scene,{detail,threadDiameter}),before=JSON.stringify(g.constructionGraph),positions=JSON.stringify(g.nodes.map(n=>n.p));let diagrams=0,passes=0,minClearance=Infinity,labelGlyphConflicts=0;
 for(const end of g.finishing.endpoints){const d=Guide.describe(g,end),moves=end.moves.filter(m=>m.id),svg=Guide.svg(g,end,{prefix:'audit'}),layout=Guide.map(g,end);if(d.passes.length!==moves.length)throw Error('Missing displayed passes.');
  moves.forEach((m,i)=>{const p=d.passes[i],n=g.byId.get(m.id);if(p.id!==m.id||n.ends[p.entrance==='A'?0:1]!==m.from||n.ends[p.exit==='A'?0:1]!==m.to)throw Error('Wrong displayed hole direction.');});
  if(end.status==='candidate'){diagrams++;passes+=moves.length;if((svg.match(/data-finishing-pass=/g)||[]).length!==moves.length||!svg.includes('route ends, still unsecured')||/NaN|Infinity|undefined/.test(svg))throw Error('Incomplete or invalid finishing diagram.');}
  for(let i=0;i<layout.nodes.length;i++)for(let j=i+1;j<layout.nodes.length;j++){const a=layout.nodes[i],b=layout.nodes[j];minClearance=Math.min(minClearance,Math.hypot(a.x-b.x,a.y-b.y)-14*(a.diameter+b.diameter)/2);}
  for(const a of layout.nodes){const width=String(Number(a.id.slice(1))).length*7.2,baseline=a.y-23*a.diameter/2,box={x1:a.x-width/2,x2:a.x+width/2,y1:baseline-12,y2:baseline+2};for(const b of layout.nodes){if(a.id===b.id)continue;const dx=Math.max(box.x1-b.x,0,b.x-box.x2),dy=Math.max(box.y1-b.y,0,b.y-box.y2);if(Math.hypot(dx,dy)<14*b.diameter/2)labelGlyphConflicts++;}}
 }
 const html=Guide.html(g),text=Guide.text(g);if(diagrams!==g.finishing.candidateEndpoints||(html.match(/class="finishing-route-card"/g)||[]).length!==diagrams||!text.includes('Do not cut or start a new line')||JSON.stringify(g.constructionGraph)!==before||JSON.stringify(g.nodes.map(n=>n.p))!==positions)throw Error('Guide coverage or model mutation.');
 cases.push({group:row.group,detail,threadDiameter,valid:true,diagrams,passes,minimumGlyphClearancePx:minClearance,labelGlyphConflicts});
 }catch(e){cases.push({group:row.group,detail,threadDiameter,valid:false,error:e.stack});}}
 console.log(JSON.stringify({detail,threadDiameter,completed:cases.length}));
}
snapshot.assertUnchanged();const summary={cases:cases.length,valid:cases.filter(c=>c.valid).length,diagrams:cases.reduce((n,c)=>n+(c.diagrams||0),0),displayedPasses:cases.reduce((n,c)=>n+(c.passes||0),0),glyphOverlaps:cases.filter(c=>c.minimumGlyphClearancePx<0).length,labelGlyphConflicts:cases.reduce((n,c)=>n+(c.labelGlyphConflicts||0),0),physicalSamples:0};
fs.writeFileSync(output,JSON.stringify({note:'Computed pass directions, diagram coverage, bead glyph spacing, labels against other bead glyphs, and no model mutation. Does not prove every label or line is visually clear, or prove physical construction.',sourceSha256:snapshot.hashes,summary,cases},null,2)+'\n');console.log(JSON.stringify(summary));
