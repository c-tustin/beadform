(function(root){
'use strict';
// Original circular-peyote draft. Each round records the actual up-bead anchors.
// The geometric surface is an illustration; tension and shaping require sampling.
function ball(big=false,profile="ball",economy=false){
 const sizes=profile==='body'?[5,10,10,15,15,15,15,10,5]:economy&&profile==='dome'?[5,5]:economy&&profile==='pear'?[5,5,5,5]:profile==='dome'?(big?[5,10,10,15,15]:[5,10,10]):profile==='pear'?[5,10,10,5,5,5]:big?[5,10,10,10,10,10,10,5]:[5,10,10,10,5];
 const v=[],edges=[],rounds=[],groups=[],angles=[];let next=0;
 for(let r=0;r<sizes.length;r++){
  const count=sizes[r],theta=(economy?.6:.3)+(profile==='dome'?(economy?.97:1.27):Math.PI-(economy?1.2:.6))*r/(sizes.length-1),radius=(profile==='body'?6.2:economy?(profile==='dome'?2.4:2.7):big?5.8:4.3),ring=[];
  let phi=[];if(!r)phi=Array.from({length:count},(_,i)=>i*2*Math.PI/count);else{const prev=angles[r-1],n=prev.length;if(count>=n){for(let i=0;i<n;i++){const num=Math.floor((i+1)*count/n)-Math.floor(i*count/n),end=i===n-1?prev[0]+2*Math.PI:prev[i+1];for(let k=0;k<num;k++)phi.push(prev[i]+(end-prev[i])*(k+1)/(num+1));}}else{let j=0;for(let i=0;i<count;i++){const num=Math.floor((i+1)*n/count)-Math.floor(i*n/count),end=j+num===n?prev[0]+2*Math.PI:prev[j+num];phi.push((prev[j]+end)/2);j+=num;}}}angles.push(phi);
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
 return {v,edges,f:[],kind:profile==='body'?'ball':profile,open:profile==='dome',stitch:'peyote',radius:profile==='body'?6.2:economy?(profile==='dome'?2.4:3.24):big?5.8:profile==='pear'?5.16:4.3,rounds,angles,groups,count:next};
}
root.BeadPeyote={ball};if(typeof module!=='undefined')module.exports=root.BeadPeyote;
})(typeof window!=='undefined'?window:globalThis);
