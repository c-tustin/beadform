// Isolated nominal-geometry experiment. Does not change the production planner.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync('training/fixtures/peyote-before-spacing.js','utf8'),Geometry=require('../bead-geometry.js');
const original=require('./fixtures/peyote-before-spacing.js'),args=process.argv.slice(2),output=args[args.indexOf('--output')+1];
if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new --output report.');
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a),sub=(a,b)=>a.map((v,i)=>v-b[i]);
function graph(m){const c={id:'P1',vertices:m.v,ids:[]},nodes=m.edges.map(([a,b],i)=>({id:'B'+i,index:i,component:c.id,vertices:[a,b],ends:['P1:'+a,'P1:'+b],p:m.v[a].map((v,j)=>(v+m.v[b][j])/2),diameterMm:2}));c.ids=nodes.map(n=>n.id);const g={settings:{threadDiameter:.25},components:[c],nodes,byId:new Map(nodes.map(n=>[n.id,n])),stages:m.groups.map((group,index)=>({index,label:group.label,operations:group.sequence.map((i,j)=>({id:nodes[i].id,from:nodes[i].ends[0],to:nodes[i].ends[1],newThread:index===0&&j===0,section:1}))}))};return Geometry.annotate(g);}
function measure(m){const g=graph(m),a=Geometry.audit(g),spans=[];let prev=null;
 for(const st of g.stages)for(const o of st.operations){if(prev&&prev.id!==o.id)spans.push(norm(sub(Geometry.port(g.byId.get(prev.id),prev.to),Geometry.port(g.byId.get(o.id),o.from))));prev=o;}
 let unseparated=0;for(let i=0;i<g.nodes.length;i++)for(let j=0;j<i;j++)if(!separated(g.nodes[i],g.nodes[j]))unseparated++;
 const dimensions=[0,1,2].map(k=>Math.max(...g.nodes.map(n=>n.p[k]))-Math.min(...g.nodes.map(n=>n.p[k])));
 return {beads:g.nodes.length,nominalFlags:a.nominalStraightPathConflicts,centerPlaneUnseparatedPairs:unseparated,dimensions,meanBridgeMm:spans.reduce((s,v)=>s+v,0)/spans.length,maxBridgeMm:Math.max(...spans),sequence:m.groups.map(g=>g.sequence),angles:m.angles,rounds:m.rounds.map((row,i)=>({count:row.length,radius:Math.hypot(g.nodes[row[0]].p[0],g.nodes[row[0]].p[2]),height:g.nodes[row[0]].p[1]}))};}
function separated(a,b){const delta=sub(b.p,a.p),d=norm(delta);if(d<1e-10)return false;const u=delta.map(v=>v/d),support=n=>Math.sqrt(1-(1-.65*.65)*dot(u,n.holeAxis)**2);return d>=support(a)+support(b)+.05-1e-8;}
function fit(m){
 const g=graph(m),heights=[],radii=[],angles=m.angles;
 for(let r=0;r<m.rounds.length;r++){
  const phi=angles[r],old=g.nodes[m.rounds[r][0]],minGap=Math.min(...phi.map((a,i)=>(i===phi.length-1?phi[0]+2*Math.PI:phi[i+1])-a));
  const minimum=Math.sqrt(1+(.65/Math.tan(minGap/2))**2)+.05/(2*Math.sin(minGap/2));
  radii[r]=Math.max(norm([old.p[0],old.p[2]]),minimum);
  heights[r]=r?heights[r-1]-(g.nodes[m.rounds[r-1][0]].p[1]-old.p[1]):old.p[1];
  const place=()=>m.rounds[r].forEach((i,j)=>{g.nodes[i].p=[radii[r]*Math.cos(phi[j]),heights[r],radii[r]*Math.sin(phi[j])];});
  place();let moves=0;
  while(r&&m.rounds[r].some(i=>m.rounds.slice(0,r).flat().some(j=>!separated(g.nodes[i],g.nodes[j])))){
   heights[r]-=.02;place();if(++moves>200)throw Error('Nominal packing failed to converge.');
  }
 }
 const center=(Math.max(...heights)+Math.min(...heights))/2;
 for(const n of g.nodes){n.p[1]-=center;const [a,b]=n.vertices;m.v[a]=n.p.map((v,k)=>v-n.holeAxis[k]*.65);m.v[b]=n.p.map((v,k)=>v+n.holeAxis[k]*.65);}
 return m;
}
const changed=source.replace('phi.push((prev[j]+end)/2);','phi.push((prev[j]+(j+1===n?prev[0]+2*Math.PI:prev[j+1]))/2);');
if(changed===source)throw Error('Cannot locate decrease geometry.');
const sandbox={};vm.runInNewContext(changed,sandbox);const proposal=sandbox.BeadPeyote;
function uniformAngles(prev,count){
 const n=prev.length,step=2*Math.PI/count;let lower=-Infinity,upper=Infinity,j=0;
 const allow=(pick,start)=>{const end=start+1===n?prev[0]+2*Math.PI:prev[start+1];lower=Math.max(lower,prev[start]-step*pick);upper=Math.min(upper,end-step*pick);};
 if(count>=n){for(let i=0;i<n;i++){const picks=Math.floor((i+1)*count/n)-Math.floor(i*count/n);for(let k=0;k<picks;k++)allow(j++,i);}}
 else{for(let i=0;i<count;i++){allow(i,j);j+=Math.floor((i+1)*n/count)-Math.floor(i*n/count);}}
 if(upper-lower<1e-8)throw Error('No uniformly spaced ring fits the scheduled anchor gaps.');
 const offset=(lower+upper)/2;return Array.from({length:count},(_,i)=>offset+i*step);
}
const uniformSource=source.replace('function ball(',uniformAngles.toString()+'\nfunction ball(').replace('angles.push(phi);','if(r)phi=uniformAngles(angles[r-1],count);angles.push(phi);');
const uniformSandbox={};vm.runInNewContext(uniformSource,uniformSandbox);const uniform=uniformSandbox.BeadPeyote;
const profiles=[['compact-ball',false,'ball',false],['expanded-ball',true,'ball',false],['body',true,'body',false],['compact-pear',false,'pear',true],['pear',false,'pear',false],['tiny-dome',false,'dome',true],['dome',false,'dome',false],['expanded-dome',true,'dome',false]];
const cases=profiles.map(([name,big,profile,economy])=>{const before=measure(original.ball(big,profile,economy)),angleOnly=measure(proposal.ball(big,profile,economy)),packed=measure(fit(proposal.ball(big,profile,economy))),uniformOnly=measure(uniform.ball(big,profile,economy)),uniformPacked=measure(fit(uniform.ball(big,profile,economy)));return {name,before,angleOnly,packed,uniformOnly,uniformPacked,sequencesPreserved:JSON.stringify(before.sequence)===JSON.stringify(uniformPacked.sequence)};});
fs.writeFileSync(output,JSON.stringify({sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),note:'Nominal illustration experiment, not a stitch validation or physical test. Center-plane separation is sufficient for disjoint envelopes; lack of separation is inconclusive.',cases},null,2)+'\n');
for(const c of cases)console.log(JSON.stringify({profile:c.name,sequencesPreserved:c.sequencesPreserved,before:{flags:c.before.nominalFlags,unseparated:c.before.centerPlaneUnseparatedPairs,meanBridge:c.before.meanBridgeMm,maxBridge:c.before.maxBridgeMm,dimensions:c.before.dimensions},uniformOnly:{flags:c.uniformOnly.nominalFlags,unseparated:c.uniformOnly.centerPlaneUnseparatedPairs},uniformPacked:{flags:c.uniformPacked.nominalFlags,unseparated:c.uniformPacked.centerPlaneUnseparatedPairs,meanBridge:c.uniformPacked.meanBridgeMm,maxBridge:c.uniformPacked.maxBridgeMm,dimensions:c.uniformPacked.dimensions}}));
