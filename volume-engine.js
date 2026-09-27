(function(root){
 'use strict';
 const S=root.BeadShape;
 const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 const k=p=>p.join(','), add=(a,b)=>a.map((v,i)=>v+b[i]);
 const edgeKey=(a,b)=>[k(a),k(b)].sort().join('|');
 const shapes={frog:'garden frog',fish:'little fish',bunny:'pocket bunny',bear:'round bear',heart:'puffy heart',ball:'beaded ball'};
 const palettes={frog:['#7caa80','#d9e6ba','#e69db4','#26382e','#a9c8a0'],fish:['#e5a1b8','#f3d8dd','#5d8968','#273e32','#c76f90'],bunny:['#f5e8dd','#d7b1be','#e8a0b4','#334337','#83a68a'],bear:['#bd957d','#efdbc8','#d897b0','#324638','#9db598'],heart:['#d889a6','#ecb7c7','#6f9277','#344b3c','#f6e0e7'],ball:['#d78fae','#e9bacd','#6a977e','#e5eee0','#395b46']};
 function settings(s){
   if(!s||(!shapes[s.shape]&&s.shape!=='custom')||![2,3,4].includes(s.detail)||![75,100,125].includes(s.depth)||!Number.isFinite(s.beadSize)||s.beadSize<1||s.beadSize>6)throw Error('Unsupported 3D shape settings.');
   const out={shape:s.shape,detail:s.detail,depth:s.depth,beadSize:s.beadSize,routeVersion:s.routeVersion===2?2:1,orderVersion:s.orderVersion===2?2:1,threadDiameter:s.threadDiameter===.2?.2:.25};
   if(s.shape==='custom'){if(!S)throw Error('The shape engine is missing.');out.design=s.design?.kind==='image'?S.validateImage(s.design):S.scene(s.design);}
   return out;
 }
 function inside(shape,x,y,z,n){
   const e=(cx,cy,cz,rx,ry,rz)=>((x-cx)/rx)**2+((y-cy)/ry)**2+((z-cz)/rz)**2<=1;
   if(shape==='ball')return e(0,0,0,n,n,n);
   if(shape==='heart'){const X=x/n,Y=y/n,Z=z/(n*.64),a=X*X+Y*Y+Z*Z-1;return a*a*a-X*X*Y*Y*Y-.18*Z*Z*Y*Y*Y<=0;}
   if(shape==='fish')return e(.15*n,0,0,1.2*n,.72*n,.52*n)||e(-1.25*n,0,0,.45*n,.3*n,.25*n)||((x< -1.15*n&&x> -2*n)&&Math.abs(y)<(-x/n-.95)*n*.85&&Math.abs(z)<.34*n)||e(.05*n,.68*n,0,.5*n,.32*n,.19*n)||e(.05*n,-.65*n,0,.45*n,.27*n,.19*n);
   if(shape==='frog')return e(0,0,0,.92*n,.8*n,.7*n)||e(-.84*n,-.55*n,0,.53*n,.42*n,.42*n)||e(.84*n,-.55*n,0,.53*n,.42*n,.42*n)||e(-.86*n,-.91*n,.27*n,.51*n,.2*n,.56*n)||e(.86*n,-.91*n,.27*n,.51*n,.2*n,.56*n)||e(-.5*n,.65*n,.42*n,.38*n,.36*n,.38*n)||e(.5*n,.65*n,.42*n,.38*n,.36*n,.38*n);
   if(shape==='bunny')return e(0,-.25*n,0,.78*n,.86*n,.62*n)||e(0,.72*n,.13*n,.72*n,.7*n,.64*n)||e(-.43*n,1.63*n,0,.27*n,.78*n,.28*n)||e(.43*n,1.63*n,0,.27*n,.78*n,.28*n)||e(-.57*n,-.94*n,.29*n,.47*n,.26*n,.57*n)||e(.57*n,-.94*n,.29*n,.47*n,.26*n,.57*n);
   return e(0,-.27*n,0,.82*n,.84*n,.65*n)||e(0,.73*n,.09*n,.85*n,.76*n,.65*n)||e(-.7*n,1.26*n,0,.38*n,.4*n,.32*n)||e(.7*n,1.26*n,0,.38*n,.4*n,.32*n)||e(-.74*n,-.53*n,.11*n,.43*n,.5*n,.39*n)||e(.74*n,-.53*n,.11*n,.43*n,.5*n,.39*n);
 }
 function voxelize(s){
   if(s.shape==='custom')return S.voxels(s.design,s.detail,s.depth);
   const all=new Map(),n=s.detail;
   for(let y=-2*n-1;y<=3*n;y++)for(let z=-2*n;z<=2*n;z++)for(let x=-3*n;x<=2*n;x++)if(inside(s.shape,x+.5,y+.5,(z+.5)*100/s.depth,n))all.set(k([x,y,z]),{x,y,z});
   if(!all.size)throw Error('The chosen shape has no stitch cells.');
   const seed=[...all.keys()].sort((a,b)=>{const A=all.get(a),B=all.get(b);return A.y-B.y||A.z-B.z||A.x-B.x;})[0];let seen,queue,ordered;
   // Face-connected cubes guarantee a four-bead joining face at every new cell.
   function flood(){seen=new Set([seed]);queue=[seed];ordered=[];for(let i=0;i<queue.length;i++){const id=queue[i],c=all.get(id);ordered.push(c);for(const d of dirs){const other=k([c.x+d[0],c.y+d[1],c.z+d[2]]);if(all.has(other)&&!seen.has(other)){seen.add(other);queue.push(other);}}}}
   flood();
   // Discretization can leave an ear or fin touching only along an edge. Add the
   // shortest cube bridge, and include those actual supporting beads in the model.
   while(seen.size!==all.size){let pair=null,distance=Infinity;for(const [id,a]of all)if(seen.has(id))for(const [other,b]of all)if(!seen.has(other)){const d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.z-b.z);if(d<distance){distance=d;pair=[a,b];}}const a={...pair[0]},b=pair[1];for(const axis of ['x','y','z'])while(a[axis]!==b[axis]){a[axis]+=Math.sign(b[axis]-a[axis]);const id=k([a.x,a.y,a.z]);if(!all.has(id))all.set(id,{x:a.x,y:a.y,z:a.z,support:true});}flood();}
   return ordered;
 }
 function faceCorners(x,y,z){return [
  {name:'bottom',p:[[x,y,z],[x+1,y,z],[x+1,y,z+1],[x,y,z+1]]},
  {name:'back',p:[[x,y,z],[x,y+1,z],[x+1,y+1,z],[x+1,y,z]]},
  {name:'right',p:[[x+1,y,z],[x+1,y+1,z],[x+1,y+1,z+1],[x+1,y,z+1]]},
  {name:'front',p:[[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]]},
  {name:'left',p:[[x,y,z],[x,y,z+1],[x,y+1,z+1],[x,y+1,z]]},
  {name:'top',p:[[x,y+1,z],[x,y+1,z+1],[x+1,y+1,z+1],[x+1,y+1,z]]}
 ];}
 function partName(s,c){
   if(c.part&&c.part!=='reference silhouette')return c.part;const n=s.detail,x=c.x+.5,y=c.y+.5;
   if(s.shape==='frog')return y<-.5*n?'feet + legs':y>.38*n?'head + eyes':'body';
   if(s.shape==='fish')return x< -1.05*n?'tail':Math.abs(y)>.5*n?'fins':x>.7*n?'head':'body';
   if(s.shape==='bunny')return y>1.25*n?'ears':y>.3*n?'head':y<-.65*n?'feet':'body';
   if(s.shape==='bear')return y>1.2*n?'ears':y>.35*n?'head':Math.abs(x)>.65*n?'arms':'body';
   if(s.shape==='heart')return y>0?'rounded lobes':'heart base';
   return s.shape==='ball'?'curved body':'reference form';
 }
 function partOrder(s,voxels){
   const all=new Map(voxels.map((c,i)=>[k([c.x,c.y,c.z]),{...c,part:partName(s,c),original:i}])),counts=new Map();for(const c of all.values())counts.set(c.part,(counts.get(c.part)||0)+1);
   let active=[...counts].sort((a,b)=>b[1]-a[1])[0][0];const central=[...all.values()].filter(c=>c.part===active),center=['x','y','z'].map(a=>central.reduce((n,c)=>n+c[a],0)/central.length),seed=central.sort((a,b)=>['x','y','z'].reduce((n,axis,j)=>n+(a[axis]-center[j])**2-(b[axis]-center[j])**2,0))[0];
   const frontier=new Map([[k([seed.x,seed.y,seed.z]),seed]]),seen=new Set(),out=[];let last=seed;
   while(frontier.size){let candidates=[...frontier.values()].filter(c=>c.part===active);if(!candidates.length){active=[...new Set([...frontier.values()].map(c=>c.part))].sort((a,b)=>(counts.get(b)||0)-(counts.get(a)||0))[0];candidates=[...frontier.values()].filter(c=>c.part===active);}
     candidates.sort((a,b)=>Math.abs(a.x-last.x)+Math.abs(a.y-last.y)+Math.abs(a.z-last.z)-Math.abs(b.x-last.x)-Math.abs(b.y-last.y)-Math.abs(b.z-last.z)||a.original-b.original);const c=candidates[0],id=k([c.x,c.y,c.z]);frontier.delete(id);seen.add(id);out.push(c);counts.set(c.part,counts.get(c.part)-1);last=c;
     for(const d of dirs){const other=k([c.x+d[0],c.y+d[1],c.z+d[2]]);if(all.has(other)&&!seen.has(other))frontier.set(other,all.get(other));}
   }
   if(out.length!==voxels.length)throw Error('Parts must connect before they can be assembled.');out.mapping=voxels.mapping;return out;
 }
 function build(input){
   const s=settings(input),raw=voxelize(s),voxels=s.orderVersion===2?partOrder(s,raw):raw,nodes=[],faces=[],cubes=[],byEdge=new Map(),byFace=new Map(),byId=new Map(),pitch=s.beadSize*Math.SQRT2;
   for(let i=0;i<voxels.length;i++){
     const v=voxels[i],cube={...v,id:'C'+String(i+1).padStart(3,'0'),faces:[],index:i};
     for(const def of faceCorners(v.x,v.y,v.z)){
       const fids=[];
       for(let j=0;j<4;j++){
         const a=def.p[j],b=def.p[(j+1)%4],ek=edgeKey(a,b);
         if(!byEdge.has(ek)){const id='B'+String(nodes.length+1).padStart(4,'0'),p=a.map((q,d)=>(q+b[d])/2),axis=a.findIndex((q,d)=>q!==b[d]);const node={id,index:nodes.length,p,ends:[k(a),k(b)],axis,firstCube:i,surface:false};nodes.push(node);byId.set(id,node);byEdge.set(ek,node);}
         fids.push(byEdge.get(ek).id);
       }
       const fk=def.p.map(k).sort().join('|');let face=byFace.get(fk);
       if(!face){face={id:'F'+String(faces.length+1).padStart(4,'0'),ids:fids,corners:def.p.map(k),uses:[],index:faces.length};faces.push(face);byFace.set(fk,face);}
       face.uses.push(cube.id);cube.faces.push({face,name:def.name});
     }
     cubes.push(cube);
   }
   for(const f of faces)if(f.uses.length===1)for(const id of f.ids)byId.get(id).surface=true;
   const min=[0,1,2].map(a=>Math.min(...nodes.map(n=>n.p[a]))),max=[0,1,2].map(a=>Math.max(...nodes.map(n=>n.p[a]))),center=min.map((v,i)=>(v+max[i])/2),size=min.map((v,i)=>(max[i]-v)*pitch+s.beadSize),layers=[...new Set(nodes.map(n=>n.p[1]))].sort((a,b)=>a-b);
   const g={settings:s,nodes,faces,cubes,byId,byEdge,min,max,center,size,pitch,layers};
   g.mapping=voxels.mapping;g.steps=s.routeVersion===2?construction2(g):construction(g);
   if(s.shape==='custom'){const hexes=S.colors(g,s.design,g.mapping);g.palette=[...new Set(hexes)];g.colors=hexes.map(h=>g.palette.indexOf(h));}else{g.palette=palettes[s.shape].slice();g.colors=templateColors(g);}
   g.validation=validate(g,g.colors,g.palette);return g;
 }
 function construction(g){
   const used=new Set(),stitched=new Set(),adj=new Map(),out=[];let cursor=null;
   function register(id){const n=g.byId.get(id);used.add(id);for(let i=0;i<2;i++){if(!adj.has(n.ends[i]))adj.set(n.ends[i],[]);adj.get(n.ends[i]).push({id,to:n.ends[1-i]});}}
   function pathTo(target){if(cursor===target)return[];const q=[cursor],prev=new Map([[cursor,null]]);for(let i=0;i<q.length;i++){const p=q[i];for(const e of adj.get(p)||[]){if(prev.has(e.to))continue;prev.set(e.to,{at:p,id:e.id});if(e.to===target){const result=[];let v=target;while(prev.get(v)){result.unshift(prev.get(v).id);v=prev.get(v).at;}return result;}q.push(e.to);}}throw Error('The 3D thread cannot reach the next ring.');}
   function pass(id){const e=g.byId.get(id);if(!e.ends.includes(cursor))throw Error('A thread segment is disconnected.');cursor=e.ends[0]===cursor?e.ends[1]:e.ends[0];}
   for(const cube of g.cubes){
     const todo=cube.faces.filter(f=>!stitched.has(f.face.id));
     while(todo.length){
       // Each ring is a genuine four-bead CRAW face. Prefer faces with anchors.
       let best=0;if(used.size)for(let i=1;i<todo.length;i++)if(todo[i].face.ids.filter(id=>used.has(id)).length>todo[best].face.ids.filter(id=>used.has(id)).length)best=i;
       const {face,name}=todo.splice(best,1)[0],ids=face.ids,known=ids.filter(id=>used.has(id)),ops=[],travel=[],newIds=[],start=cursor;
       if(!used.size){cursor=face.corners[0];for(const id of ids){register(id);newIds.push(id);ops.push({kind:'pick',id});pass(id);}ops.push({kind:'pass',id:ids[0]});pass(ids[0]);}
       else {
         if(!known.length)throw Error('A 3D ring has no existing anchor.');
         // The corner is used only for routing, never a bead or an added material.
         let first=ids.findIndex(id=>used.has(id)),route=pathTo(face.corners[first]);
         for(let j=first+1;j<4;j++)if(used.has(ids[j])){const candidate=pathTo(face.corners[j]);if(candidate.length<route.length){first=j;route=candidate;}}
         for(const id of route){travel.push(id);pass(id);}travel.push(ids[first]);pass(ids[first]);
         for(let j=1;j<=4;j++){const id=ids[(first+j)%4],kind=used.has(id)?'pass':'pick';if(kind==='pick'){register(id);newIds.push(id);}ops.push({kind,id});pass(id);}
       }
       stitched.add(face.id);
       const index=out.length;for(const id of newIds)g.byId.get(id).addedAt=index;
       out.push({index,cubeId:cube.id,cubeIndex:cube.index,faceId:face.id,faceName:name,ids:newIds,ring:ids.slice(),travel,ops,start,end:cursor,position:[cube.x,cube.y,cube.z],label:`${cube.id} · ${name} ring`,kind:newIds.length?'weave':'close'});
     }
   }
   return out;
 }
 function construction2(g){
   const used=new Set(),stitched=new Set(),adj=new Map(),usage=new Map(),remaining=new Map(),out=[];
   const limit=g.settings.threadDiameter===.2?8:6;let cursor=null,section=0;
   for(const f of g.faces)for(const id of f.ids)remaining.set(id,(remaining.get(id)||0)+1);
   function register(id){used.add(id);const n=g.byId.get(id);for(let j=0;j<2;j++){if(!adj.has(n.ends[j]))adj.set(n.ends[j],[]);adj.get(n.ends[j]).push({id,to:n.ends[1-j]});}}
   function move(id){const n=g.byId.get(id);if(!n.ends.includes(cursor))throw Error('The thread route is disconnected.');cursor=n.ends[0]===cursor?n.ends[1]:n.ends[0];usage.set(id,(usage.get(id)||0)+1);}
   function route(target){
     if(cursor===target)return [];const queue=[cursor],prev=new Map([[cursor,null]]);
     for(let i=0;i<queue.length;i++)for(const edge of (adj.get(queue[i])||[]).slice().sort((a,b)=>(usage.get(a.id)||0)-(usage.get(b.id)||0))){
       if(prev.has(edge.to)||(usage.get(edge.id)||0)+(remaining.get(edge.id)||0)+1>limit)continue;
       prev.set(edge.to,{at:queue[i],id:edge.id});if(edge.to===target){const result=[];let v=target;while(prev.get(v)){const p=prev.get(v);result.unshift(p.id);v=p.at;}return result;}queue.push(edge.to);
     }return null;
   }
   for(const cube of g.cubes){const todo=cube.faces.filter(f=>!stitched.has(f.face.id));while(todo.length){
     let pick=null;
     if(used.size)for(let i=0;i<todo.length;i++){const f=todo[i].face;for(let a=0;a<4;a++)if(used.has(f.ids[a])){
       const travel=route(f.corners[(a+1)%4]);if(travel===null)continue;
       const score=travel.length*10+travel.reduce((n,id)=>n+(usage.get(id)||0),0)-f.ids.filter(id=>used.has(id)).length;
       if(!pick||score<pick.score)pick={i,a,travel,score};
     }}
     let threadStart=false;
     if(!used.size){pick={i:0,a:3,travel:[]};threadStart=true;}
     else if(!pick){for(let i=0;i<todo.length&&!pick;i++){const a=todo[i].face.ids.findIndex(id=>used.has(id));if(a>=0)pick={i,a,travel:[]};}if(!pick)throw Error('No existing bead anchors this ring.');threadStart=true;}
     const {face,name}=todo.splice(pick.i,1)[0],first=(pick.a+1)%4,ops=[],travel=pick.travel,newIds=[];
     if(threadStart){if(out.length)out[out.length-1].endThread=true;section++;cursor=face.corners[first];}
     const entryCorner=cursor,start=cursor;
     for(const id of travel)move(id);
     const ringStart=cursor;
     for(let j=0;j<4;j++){const id=face.ids[(first+j)%4],kind=used.has(id)?'pass':'pick';if(kind==='pick'){register(id);newIds.push(id);}ops.push({kind,id});move(id);remaining.set(id,remaining.get(id)-1);}
     if(!out.length){const id=face.ids[first];ops.push({kind:'pass',id});move(id);}
     const index=out.length;for(const id of newIds)g.byId.get(id).addedAt=index;
     out.push({index,cubeId:cube.id,cubeIndex:cube.index,faceId:face.id,faceName:name,ids:newIds,ring:face.ids.slice(),travel,ops,start,end:cursor,entryCorner,ringStart,threadStart,threadSection:section,anchor:face.ids[pick.a],position:[cube.x,cube.y,cube.z],part:cube.part||'',label:`${cube.id} · ${name} ring`,kind:newIds.length?'weave':'close'});
     stitched.add(face.id);
   }}
   if(out.length)out[out.length-1].endThread=true;
   return out;
 }
 function templateColors(g){
   const {shape,detail:n}=g.settings,depth=g.settings.depth/100;
   const colors=g.nodes.map(a=>{const [x,y,z0]=a.p,z=z0/depth;
     if(shape==='ball')return ((Math.floor(y*1.15)+8)%4+4)%4;
     if(shape==='heart')return y>.5*n?1:0;
     if(shape==='fish'){if(x< -1.05*n||Math.abs(y)>.64*n)return 2;return Math.floor((x/n+1.2)*3)%3===0?4:0;}
     if(shape==='frog'){if(z>.48*n&&Math.abs(x)<.67*n&&y<.28*n)return 1;return y<-.48*n?4:0;}
     if(shape==='bunny'){if(y>1.25*n&&z>=0)return 2;if(z>.43*n&&y<.12*n)return 1;return 0;}
     if(z>.48*n&&y>.32*n&&y<.9*n)return 1;return y>1.2*n?1:0;
   });
   // Keep semantic landmarks readable by assigning actual surface beads.
   const landmarks=[];
   if(shape==='fish')for(const sign of [-1,1])landmarks.push({p:[.75*n,.16*n,sign*.49*n*depth],color:3});
   if(['frog','bunny','bear'].includes(shape)){
     const ey=shape==='frog'?.74*n:.88*n,ex=shape==='frog'?.52*n:.34*n,ez=shape==='frog'?.7*n:.73*n;
     for(const sign of [-1,1]){landmarks.push({p:[sign*ex,ey,ez*depth],color:3});landmarks.push({p:[sign*(ex+.16*n),ey-.28*n,ez*depth],color:2});}
     if(shape!=='frog')landmarks.push({p:[0,.53*n,.78*n*depth],color:3});
   }
   const assigned=new Set();for(const l of landmarks){let best=null,dist=Infinity;for(const a of g.nodes){if(!a.surface||assigned.has(a.index))continue;const d=a.p.reduce((v,q,j)=>v+(q-l.p[j])**2,0);if(d<dist){best=a;dist=d;}}if(best){colors[best.index]=l.color;best.landmark=true;assigned.add(best.index);}}
   return colors;
 }
 function validate(g,colors,palette){
   const errors=[],added=new Set(),stitched=new Set(),usage=new Map(),vertices=new Map();let cursor=null;
   const move=(id,kind)=>{const n=g.byId.get(id);if(!n){errors.push('Unknown bead in the thread path.');return;}if(kind==='pick'){if(added.has(id))errors.push('A physical bead is added twice.');added.add(id);}else if(!added.has(id))errors.push('Thread passes through a bead before it is added.');if(cursor!==null&&!n.ends.includes(cursor))errors.push('Thread continuity is broken.');if(cursor===null)cursor=n.ends[0];cursor=n.ends[0]===cursor?n.ends[1]:n.ends[0];usage.set(id,(usage.get(id)||0)+1);};
   if(!Array.isArray(colors)||colors.length!==g.nodes.length||colors.some(c=>!Number.isInteger(c)||c<0||c>=palette.length))errors.push('Every 3D bead needs a valid color.');
   if(g.byId.size!==g.nodes.length)errors.push('Duplicate 3D bead IDs.');
   for(const f of g.faces){if(f.ids.length!==4||new Set(f.ids).size!==4)errors.push('CRAW rings must contain four unique beads.');if(f.uses.length<1||f.uses.length>2)errors.push('Invalid shared cube face.');}
   for(let i=0;i<g.steps.length;i++){const st=g.steps[i];if(st.threadStart)cursor=st.entryCorner;else if(i===0)cursor=g.faces.find(f=>f.id===st.faceId).corners[0];for(const id of st.travel)move(id,'pass');for(const op of st.ops)move(op.id,op.kind);stitched.add(st.faceId);if(cursor!==st.end)errors.push('The step exit is inconsistent.');}
   if(added.size!==g.nodes.length)errors.push('The guide does not construct every bead.');if(stitched.size!==g.faces.length)errors.push('The guide leaves an incomplete ring.');
   const cells=new Set();for(const c of g.cubes){if(cells.size&&!dirs.some(d=>cells.has(k([c.x+d[0],c.y+d[1],c.z+d[2]]))))errors.push('A cube has no joining face.');cells.add(k([c.x,c.y,c.z]));}
   const maxPasses=Math.max(0,...usage.values()),longRoutes=g.steps.filter(s=>s.travel.length>16).length;
   const limit=g.settings.threadDiameter===.2?8:6;
   if(g.settings.routeVersion===2&&maxPasses>limit)errors.push('A bead exceeds the planned fishing-line passage budget.');
   return {valid:errors.length===0,errors:[...new Set(errors)],beads:added.size,closedRings:stitched.size,maxPasses,longRoutes,passLimit:limit,threadSections:Math.max(1,g.steps.filter(s=>s.threadStart).length),usage};
 }
 root.BeadVolume={build,settings,validate,shapes,palettes,faceCorners,voxelize};
})(typeof window!=='undefined'?window:globalThis);
