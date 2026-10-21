(function(root){
'use strict';
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),norm=a=>Math.hypot(...a);
// Nominal rocaille dimensions, not measurements of a particular bead or needle.
function annotate(g){
 const parts=new Map(g.components.map(c=>[c.id,c]));
 for(const n of g.nodes){
  const c=parts.get(n.component),[a,b]=n.vertices.map(i=>c?.vertices[i]);
  if(!a||!b)throw Error('Missing placed bead endpoints for '+n.id);
  const d=sub(b,a),length=norm(d);
  if(!Number.isFinite(length)||length<1e-8)throw Error('Undefined bead-hole axis for '+n.id);
  n.holeAxis=d.map(v=>v/length);n.holeLengthMm=n.diameterMm===4?4:1.3;
  n.holePorts=n.ends.map((end,i)=>({end,p:n.p.map((v,j)=>v+n.holeAxis[j]*n.holeLengthMm/2*(i?1:-1))}));
 }
 return g;
}
function port(n,end){const p=n.holePorts?.find(p=>p.end===end);if(!p)throw Error('Unknown bead-hole end for '+n.id);return p.p;}
// Straight line versus an oriented oblate envelope, enlarged by the line radius.
// A collision is a nominal warning: real thread may bend; needle access is not simulated.
function intersects(a,b,n,lineRadius=0){
 const q=sub(a,n.p),d=sub(b,a),axis=n.holeAxis,qa=dot(q,axis),da=dot(d,axis),
  along=n.holeLengthMm/2+lineRadius,across=(n.diameterMm||2)/2+lineRadius,
  metric=(u,v,ua,va)=>(dot(u,v)-ua*va)/(across*across)+ua*va/(along*along),
  A=metric(d,d,da,da),B=2*metric(q,d,qa,da),C=metric(q,q,qa,qa)-1;
 if(A<1e-12)return C< -1e-8;
 const t=Math.max(0,Math.min(1,-B/(2*A)));
 return A*t*t+B*t+C< -1e-8;
}
function blockers(g,a,exit,b,entrance,known,{limit=Infinity}={}){
 const from=port(a,exit),to=port(b,entrance),lineRadius=(g.settings.threadDiameter||.25)/2,out=[];
 for(const id of known){if(id===a.id||id===b.id)continue;const n=g.byId.get(id);if(intersects(from,to,n,lineRadius)){out.push(id);if(out.length>=limit)break;}}
 return out;
}
function audit(g){
 annotate(g);const known=new Set(),examples=[],byStage=[],unique=new Set();let previous=null,connections=0,conflicts=0,jointConflicts=0;
 for(const st of g.stages){let count=0,checked=0;
  for(const o of st.operations){
   const n=g.byId.get(o.id);
   if(previous&&!o.newThread&&previous.section===o.section){
    const a=g.byId.get(previous.id);if(a.id!==n.id){
     connections++;checked++;const blocked=blockers(g,a,previous.to,n,o.from,known);
     if(blocked.length){conflicts++;count++;if(a.component!==n.component)jointConflicts++;blocked.forEach(id=>unique.add(id));
      if(examples.length<24)examples.push({stage:st.index+1,from:a.id,exit:previous.to,to:n.id,entrance:o.from,blockingBeads:blocked,crossPart:a.component!==n.component});}
    }
   }
   known.add(o.id);previous=o;
  }
  byStage.push({stage:st.index+1,label:st.label,connections:checked,nominalStraightPathConflicts:count});
 }
 return {model:'oriented nominal oblate beads; straight inter-bead paths enlarged by line radius',
  seedBeadDiameterMm:2,seedBeadHoleLengthMm:1.3,lineDiameterMm:g.settings.threadDiameter,
  connections,nominalStraightPathConflicts:conflicts,crossPartConflicts:jointConflicts,blockingBeads:unique.size,byStage,examples,
  needleAccessVerified:false,physicalSampleRequired:true,
  note:'Warnings are not proof of impossible construction. Thread curvature, needle length, hole diameter, tension and deformed beadwork are not modeled. Unchecked finishes and reinforcement are not included.'};
}
root.BeadGeometry={annotate,port,intersects,blockers,audit};if(typeof module!=='undefined')module.exports=root.BeadGeometry;
})(typeof window!=='undefined'?window:globalThis);
