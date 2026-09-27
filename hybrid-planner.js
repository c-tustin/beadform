(function(root){
 'use strict';

 const DIRECTIONS=Object.freeze([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]);
 const coordinateKey=p=>p.join(',');
 const compare=(a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2];
 const add=(a,b)=>a.map((v,i)=>v+b[i]);

 function positiveInteger(value,name){
  if(!Number.isSafeInteger(value)||value<1)throw Error(`${name} must be a positive integer.`);
  return value;
 }

 // Exact unique-edge count for a completely filled a × b × c cube lattice.
 function countCuboidBeads(a,b,c){
  positiveInteger(a,'a');positiveInteger(b,'b');positiveInteger(c,'c');
  return a*(b+1)*(c+1)+b*(a+1)*(c+1)+c*(a+1)*(b+1);
 }

 function normalizeCubes(cubes){
  if(!Array.isArray(cubes)||!cubes.length)throw Error('At least one CRAW cube is required.');
  const unique=new Map();
  for(const p of cubes){
   if(!Array.isArray(p)||p.length!==3||!p.every(Number.isSafeInteger))throw Error('Cube coordinates must be three integers.');
   unique.set(coordinateKey(p),p.slice());
  }
  if(unique.size!==cubes.length)throw Error('Duplicate CRAW cube coordinates.');
  return [...unique.values()].sort(compare);
 }

 // Returns a deterministic face-connected build order; each non-root cube records
 // an earlier cube that shares a complete square face with it.
 function orderFaceConnectedCubes(cubes){
  const cells=normalizeCubes(cubes),byKey=new Map(cells.map(p=>[coordinateKey(p),p]));
  const remaining=new Set(byKey.keys()),first=cells[0],queue=[first],ordered=[],attachments=[];
  remaining.delete(coordinateKey(first));
  while(queue.length){
   const p=queue.shift();ordered.push(p);
   for(const d of DIRECTIONS){
    const n=add(p,d),key=coordinateKey(n);
    if(!remaining.has(key))continue;
    remaining.delete(key);queue.push(n);attachments.push({cube:n,attachedTo:p,face:d.map(v=>-v)});
   }
  }
  if(remaining.size)throw Error('CRAW cubes must form one face-connected structure.');
  return {order:ordered,attachments};
 }

 function countVoxelEdgeBeads(cubes){
  const cells=normalizeCubes(cubes),edges=new Set();
  for(const [x,y,z] of cells){
   const corners=[];
   for(let dx=0;dx<=1;dx++)for(let dy=0;dy<=1;dy++)for(let dz=0;dz<=1;dz++)corners.push([x+dx,y+dy,z+dz]);
   for(const p of corners){
    for(const axis of [0,1,2]){
     const q=p.slice();q[axis]++;
     if(q.some((v,i)=>v>[x+1,y+1,z+1][i]))continue;
     edges.add([coordinateKey(p),coordinateKey(q)].sort().join('|'));
    }
   }
  }
  return edges.size;
 }

 function validatePeyoteRounds(rounds){
  if(!Array.isArray(rounds)||!rounds.length)throw Error('At least one peyote round is required.');
  rounds.forEach((count,index)=>{
   if(!Number.isSafeInteger(count)||count<2||count%2!==0)throw Error(`Peyote round ${index+1} must have a positive even bead count.`);
  });
  return {rounds:rounds.slice(),beadCount:rounds.reduce((sum,n)=>sum+n,0)};
 }

 // Joint execution is allowed only for an exact, physically tested library entry.
 // Draft entries remain useful as metadata but cannot produce a build instruction.
 function validateJoint(joint,library,facePerimeter,tolerance){
  if(!joint||typeof joint.type!=='string'||!Array.isArray(library))throw Error('A typed joint and joint library are required.');
  if(!Number.isFinite(facePerimeter)||facePerimeter<0||!Number.isFinite(tolerance)||tolerance<0)throw Error('Joint perimeter and tolerance must be non-negative numbers.');
  const entry=library.find(item=>item&&item.id===joint.type);
  if(!entry||entry.status!=='physically-tested')throw Error(`Joint ${joint.type} is not in the physically tested library.`);
  if(!Number.isFinite(joint.circumference)||Math.abs(joint.circumference-facePerimeter)>tolerance)throw Error('Joint circumference does not match the target face perimeter within tolerance.');
  return {valid:true,jointId:entry.id,facePerimeter,circumference:joint.circumference};
 }

 root.BeadHybridPlanner={countCuboidBeads,countVoxelEdgeBeads,orderFaceConnectedCubes,validatePeyoteRounds,validateJoint};
 if(typeof module!=='undefined')module.exports=root.BeadHybridPlanner;
})(typeof window!=='undefined'?window:globalThis);
