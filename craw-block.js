(function(root){
'use strict';
function dimensions(a,b,c){if([a,b,c].some(n=>!Number.isInteger(n)||n<1||n>6))throw Error('CRAW block dimensions must be integers from 1 to 6.');}
function count(a,b,c){dimensions(a,b,c);return a*(b+1)*(c+1)+b*(a+1)*(c+1)+c*(a+1)*(b+1);}
function block(a,b,c,{entrySide=[-1,-1,-1]}={}){
 dimensions(a,b,c);if(entrySide.length!==3||entrySide.some(n=>![-1,1].includes(n)))throw Error('CRAW entry sides must be three signs.');const v=[],f=[],edges=[],faceCells=[],cells=[],vertices=new Map(),edgeIds=new Map(),faceIds=new Map(),pitch=Math.SQRT2*2.05;
 function vertex(x,y,z){const key=[x,y,z].join(',');if(!vertices.has(key)){vertices.set(key,v.length);v.push([(x-a/2)*pitch,(y-b/2)*pitch,(z-c/2)*pitch]);}return vertices.get(key);}
 // Each cell after the first shares a full face with an earlier cell.
 const order=(n,side)=>Array.from({length:n},(_,i)=>side>0?n-1-i:i);
 for(const x of order(a,entrySide[0]))for(const y of order(b,entrySide[1]))for(const z of order(c,entrySide[2])){
  const corners=[[x,y,z],[x+1,y,z],[x+1,y+1,z],[x,y+1,z],[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]].map(p=>vertex(...p)),faces=[];
  for(const local of [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]]){
   const ids=local.map(i=>corners[i]),key=ids.slice().sort((a,b)=>a-b).join(',');
   if(!faceIds.has(key)){faceIds.set(key,f.length);f.push(ids);faceCells.push(cells.length);}
   faces.push(faceIds.get(key));
   for(let i=0;i<4;i++){const pair=[ids[i],ids[(i+1)%4]].sort((a,b)=>a-b),key=pair.join(',');if(!edgeIds.has(key)){edgeIds.set(key,edges.length);edges.push(pair);}}
  }
  cells.push({index:cells.length,coordinate:[x,y,z],faces});
 }
 if(edges.length!==count(a,b,c))throw Error('CRAW edge inventory does not match the exact block formula.');
 return {v,f,edges,faceCells,cells,dimensions:[a,b,c],kind:'craw',stitch:'craw',radius:Math.max(...v.map(p=>Math.hypot(...p))),count:edges.length};
}
root.BeadCraw={block,count};if(typeof module!=='undefined')module.exports=root.BeadCraw;
})(typeof window!=='undefined'?window:globalThis);
