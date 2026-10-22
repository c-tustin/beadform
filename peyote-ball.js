(function(root){
'use strict';
// Original circular-peyote draft. Each round records the actual up-bead anchors.
// The geometric surface is an illustration; tension and shaping require sampling.
function uniformAngles(prev,count){
 const n=prev.length,step=2*Math.PI/count;let lower=-Infinity,upper=Infinity,j=0;
 const allow=(pick,start)=>{const end=start+1===n?prev[0]+2*Math.PI:prev[start+1];lower=Math.max(lower,prev[start]-step*pick);upper=Math.min(upper,end-step*pick);};
 if(count>=n){for(let i=0;i<n;i++){const picks=Math.floor((i+1)*count/n)-Math.floor(i*count/n);for(let k=0;k<picks;k++)allow(j++,i);}}
 else{for(let i=0;i<count;i++){allow(i,j);j+=Math.floor((i+1)*n/count)-Math.floor(i*n/count);}}
 if(upper-lower<1e-8)throw Error('No uniformly spaced ring fits the scheduled peyote anchor gaps.');
 const offset=(lower+upper)/2;return Array.from({length:count},(_,i)=>offset+i*step);
}
function fitGeometry(mesh){
 const halfLength=.65,radius=1,clearance=.05,sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),nodes=mesh.edges.map(([a,b],i)=>({p:mesh.v[a].map((v,k)=>(v+mesh.v[b][k])/2),axis:[-Math.sin(mesh.angles.flat()[i]),0,Math.cos(mesh.angles.flat()[i])]}));
 const planeGap=(a,b)=>{const delta=sub(b.p,a.p),d=Math.hypot(...delta);if(d<1e-10)return -Infinity;const u=delta.map(v=>v/d),support=n=>Math.sqrt(radius*radius-(radius*radius-halfLength*halfLength)*dot(u,n.axis)**2);return d-support(a)-support(b);},separated=(a,b)=>planeGap(a,b)>=clearance-1e-8;
 const originalCenter=(Math.max(...nodes.map(n=>n.p[1]))+Math.min(...nodes.map(n=>n.p[1])))/2,heights=[],radii=[],adjustments=[];
 for(let r=0;r<mesh.rounds.length;r++){
  const row=mesh.rounds[r],phi=mesh.angles[r],original=nodes[row[0]].p.slice(),gap=Math.min(...phi.map((a,i)=>(i===phi.length-1?phi[0]+2*Math.PI:phi[i+1])-a)),minimum=Math.sqrt(radius*radius+(halfLength/Math.tan(gap/2))**2)+clearance/(2*Math.sin(gap/2));
  radii[r]=Math.max(Math.hypot(original[0],original[2]),minimum);
  const previousHeight=r?mesh.v[mesh.edges[mesh.rounds[r-1][0]][0]][1]:null;
  heights[r]=r?heights[r-1]-(previousHeight-original[1]):original[1];
  const place=()=>row.forEach((id,j)=>{nodes[id].p=[radii[r]*Math.cos(phi[j]),heights[r],radii[r]*Math.sin(phi[j])];});
  const earlier=mesh.rounds.slice(0,r).flat();place();let moves=0;
  while(r&&row.some(id=>earlier.some(other=>!separated(nodes[id],nodes[other])))){
   heights[r]-=.02;place();if(++moves>200)throw Error('Nominal peyote spacing could not be fitted.');
  }
  adjustments.push({round:r+1,radiusDeltaMm:radii[r]-Math.hypot(original[0],original[2]),verticalCorrectionMm:moves*.02});
 }
 const center=(Math.max(...heights)+Math.min(...heights))/2-originalCenter;
 for(let i=0;i<nodes.length;i++){const n=nodes[i];n.p[1]-=center;const [a,b]=mesh.edges[i];mesh.v[a]=n.p.map((v,k)=>v-n.axis[k]*halfLength);mesh.v[b]=n.p.map((v,k)=>v+n.axis[k]*halfLength);}
 let minimumGap=Infinity;for(let i=0;i<nodes.length;i++)for(let j=0;j<i;j++)minimumGap=Math.min(minimumGap,planeGap(nodes[i],nodes[j]));
 if(minimumGap<clearance-1e-8)throw Error('Nominal peyote bead envelopes are not separated.');
 mesh.geometry={version:2,nominalDiameterMm:radius*2,nominalHoleLengthMm:halfLength*2,centerPlaneClearanceMm:clearance,minimumCenterPlaneClearanceMm:minimumGap,uniformRoundAngles:true,originPolicy:'preserve original bound center',roundRadiiMm:radii,roundHeightsMm:heights.map(y=>y-center),adjustments,physicallyTested:false};
 return mesh;
}
function ball(big=false,profile="ball",economy=false){
 const sizes=profile==='body'?[5,10,10,15,15,15,15,10,5]:economy&&profile==='dome'?[5,5]:economy&&profile==='pear'?[5,5,5,5]:profile==='dome'?(big?[5,10,10,15,15]:[5,10,10]):profile==='pear'?[5,10,10,5,5,5]:big?[5,10,10,10,10,10,10,5]:[5,10,10,10,5];
 const v=[],edges=[],rounds=[],groups=[],angles=[];let next=0;
 for(let r=0;r<sizes.length;r++){
  const count=sizes[r],theta=(economy?.6:.3)+(profile==='dome'?(economy?.97:1.27):Math.PI-(economy?1.2:.6))*r/(sizes.length-1),radius=(profile==='body'?6.2:economy?(profile==='dome'?2.4:2.7):big?5.8:4.3),ring=[];
  const phi=r?uniformAngles(angles[r-1],count):Array.from({length:count},(_,i)=>i*2*Math.PI/count);angles.push(phi);
  for(let i=0;i<count;i++){const a=phi[i],center=[radius*Math.sin(theta)*Math.cos(a)*(profile==='pear'?1-.45*r/(sizes.length-1):1),radius*Math.cos(theta)*(profile==='pear'?1.2:1),radius*Math.sin(theta)*Math.sin(a)*(profile==='pear'?1-.45*r/(sizes.length-1):1)],axis=[-Math.sin(a),0,Math.cos(a)],id=next++;ring.push(id);v.push(center.map((x,k)=>x-axis[k]*.65),center.map((x,k)=>x+axis[k]*.65));edges.push([id*2,id*2+1]);}
  rounds.push(ring);
 }
 const first=rounds[0];groups.push({label:'Foundation: string 5; circle through the first bead',phase:'foundation',sequence:[...first,first[0]]});
 for(let r=1;r<rounds.length;r++){
  const prev=rounds[r-1],row=rounds[r],sequence=[],stitches=[];let j=0;
  if(row.length>=prev.length){
   for(let i=0;i<prev.length;i++){const n=Math.floor((i+1)*row.length/prev.length)-Math.floor(i*row.length/prev.length),picks=row.slice(j,j+n),anchor=prev[(i+1)%prev.length];sequence.push(...picks,anchor);stitches.push({picks,anchors:[anchor]});j+=n;}
  }else{
   for(let i=0;i<row.length;i++){const n=Math.floor((i+1)*prev.length/row.length)-Math.floor(i*prev.length/row.length),anchors=Array.from({length:n},(_,k)=>prev[(j+k+1)%prev.length]);sequence.push(row[i],...anchors);stitches.push({picks:[row[i]],anchors});j+=n;}
  }
  sequence.push(row[0]);
  const phase=row.length>prev.length?'increase':row.length<prev.length?'decrease':'even';
  groups.push({label:`Round ${r+1}: ${phase==='increase'?'add two at marked increases':phase==='decrease'?'pass two up-beads at marked decreases':'one bead per gap'}; ${row.length} new beads; step up`,phase,sequence,stitches,stepUp:row[0]});
 }
 if(profile!=='dome'){const at=groups.findIndex(g=>g.phase==='decrease');if(at>0)groups[at].pauseBefore='Optional filling: before this decrease, tuck a small amount of clean, dry, soft plastic film or light craft filling through the opening. Keep the rim and bead holes clear; do not pack tightly. Continue the listed decreases and closure.';}
 const top=rounds.at(-1);if(profile!=='dome')groups.push({label:'Close: pass through the last five up-beads and draw snug',phase:'closure',sequence:[...top.slice(1),top[0]]});
 return fitGeometry({v,edges,f:[],kind:profile==='body'?'ball':profile,open:profile==='dome',stitch:'peyote',radius:profile==='body'?6.2:economy?(profile==='dome'?2.4:3.24):big?5.8:profile==='pear'?5.16:4.3,rounds,angles,groups,count:next});
}
root.BeadPeyote={ball};if(typeof module!=='undefined')module.exports=root.BeadPeyote;
})(typeof window!=='undefined'?window:globalThis);
