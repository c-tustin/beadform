(function(root){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), key=(x,y,z)=>`${x},${y},${z}`;
 const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
 function scene(input){
   if(!input||typeof input.title!=='string'||input.title.length>100||!Array.isArray(input.parts)||!input.parts.length||input.parts.length>48)throw Error('The generator did not return a usable shape.');
   const vector=(v,name,positive=false)=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||Math.abs(n)>100||(positive&&n<=0)))throw Error('Invalid '+name+' in generated shape.');return v.slice();};
   const parts=input.parts.map(p=>{if(!p||!['ellipsoid','capsule','box'].includes(p.type)||!['solid','paint','cut'].includes(p.role)||typeof p.name!=='string'||p.name.length>60||!/^#[a-f0-9]{6}$/i.test(p.color))throw Error('Invalid shape part.');return {name:p.name,type:p.type,role:p.role,center:vector(p.center,'center'),size:vector(p.size,'radius',true),end:vector(p.end,'endpoint'),color:p.color.toLowerCase()};});
   if(!parts.some(p=>p.role==='solid'))throw Error('The shape needs a solid body.');
   return {kind:'scene',title:input.title,notes:typeof input.notes==='string'?input.notes.slice(0,1600):'',parts};
 }
 function contains(p,q){
   if(p.type==='box')return q.every((v,j)=>Math.abs(v-p.center[j])<=p.size[j]);
   let center=p.center;
   if(p.type==='capsule'){const d=p.end.map((v,j)=>v-p.center[j]),dd=d.reduce((a,v)=>a+v*v,0),t=dd?clamp(q.reduce((a,v,j)=>a+(v-p.center[j])*d[j],0)/dd,0,1):0;center=p.center.map((v,j)=>v+t*d[j]);}
   return q.reduce((a,v,j)=>a+((v-center[j])/p.size[j])**2,0)<=1;
 }
 function bounds(s){const solids=s.parts.filter(p=>p.role==='solid');return {min:[0,1,2].map(j=>Math.min(...solids.map(p=>Math.min(p.center[j],p.type==='capsule'?p.end[j]:p.center[j])-p.size[j]))),max:[0,1,2].map(j=>Math.max(...solids.map(p=>Math.max(p.center[j],p.type==='capsule'?p.end[j]:p.center[j])+p.size[j])))};}
 function validateImage(d){
   if(!d||d.kind!=='image'||!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<2||d.height<2||d.width>160||d.height>160||!Array.isArray(d.mask)||d.mask.length!==d.width*d.height||d.mask.some(v=>v!==0&&v!==1)||!Array.isArray(d.rgb)||d.rgb.length!==d.width*d.height*3||d.rgb.some(v=>!Number.isInteger(v)||v<0||v>255)||!d.mask.some(Boolean))throw Error('Invalid image silhouette.');
   return d;
 }
 function imageData(width,height,rgba,tolerance=36,background='auto'){
   if(width<2||height<2||width>160||height>160||rgba.length!==width*height*4)throw Error('Resize the reference before tracing.');
   const border=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x===0||y===0||x===width-1||y===height-1)border.push((y*width+x)*4);
   const transparent=border.filter(i=>rgba[i+3]<128).length>border.length*.2;
   // Estimate the dominant border color, then remove only matching pixels that
   // connect to the outside. Enclosed white details are retained.
   const bins=new Map();for(const i of border){const k=[0,1,2].map(j=>Math.floor(rgba[i+j]/32)).join(',');if(!bins.has(k))bins.set(k,[]);bins.get(k).push(i);}
   const dominant=[...bins.values()].sort((a,b)=>b.length-a.length)[0];
   const bg=background!=='auto'&&/^#[0-9a-f]{6}$/i.test(background)?[1,3,5].map(i=>parseInt(background.slice(i,i+2),16)):[0,1,2].map(j=>dominant.reduce((a,i)=>a+rgba[i+j],0)/dominant.length);
   const mask=new Array(width*height).fill(1),seen=new Uint8Array(width*height),queue=[];
   const isBG=i=>rgba[i*4+3]<128||(!transparent&&Math.hypot(...bg.map((v,j)=>rgba[i*4+j]-v))<=tolerance*2);
   function add(i){if(!seen[i]&&isBG(i)){seen[i]=1;mask[i]=0;queue.push(i);}}
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x===0||y===0||x===width-1||y===height-1)add(y*width+x);
   for(let q=0;q<queue.length;q++){const i=queue[q],x=i%width,y=Math.floor(i/width);if(x)add(i-1);if(x+1<width)add(i+1);if(y)add(i-width);if(y+1<height)add(i+width);}
   for(let i=0;i<mask.length;i++)if(rgba[i*4+3]<128)mask[i]=0;
   const rgb=Array.from({length:width*height*3},(_,i)=>rgba[Math.floor(i/3)*4+i%3]);
   return validateImage({kind:'image',width,height,mask,rgb,notes:transparent?'Transparent background preserved.':'Border background removed; check the outline before building.'});
 }
 function imageBounds(d){let x0=d.width,y0=d.height,x1=0,y1=0;d.mask.forEach((v,i)=>{if(v){const x=i%d.width,y=Math.floor(i/d.width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}});return {x0,y0,x1,y1};}
 function connected(cells,maxGap=3){
   const all=new Map(cells.map(v=>[key(v.x,v.y,v.z),v]));if(!all.size)throw Error('No beads fit this outline. Add to the mask or choose more detail.');
   const seed=[...all.values()].sort((a,b)=>a.y-b.y||a.z-b.z||a.x-b.x)[0];let seen,ordered;
   const flood=()=>{seen=new Set([key(seed.x,seed.y,seed.z)]);ordered=[seed];for(let i=0;i<ordered.length;i++){const v=ordered[i];for(const d of dirs){const k=key(v.x+d[0],v.y+d[1],v.z+d[2]);if(all.has(k)&&!seen.has(k)){seen.add(k);ordered.push(all.get(k));}}}};
   flood();let bridges=0;
   while(seen.size<all.size){let pair,best=Infinity;for(const a of ordered)for(const [k,b]of all)if(!seen.has(k)){const d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.z-b.z);if(d<best){best=d;pair=[a,b];}}
     if(best>maxGap)throw Error('Separate pieces need a join. Paint a connection in the outline, or describe how the parts attach.');
     const a={...pair[0]},b=pair[1];for(const axis of ['x','y','z'])while(a[axis]!==b[axis]){a[axis]+=Math.sign(b[axis]-a[axis]);const k=key(a.x,a.y,a.z);if(!all.has(k)){all.set(k,{...a,support:true});bridges++;}}
     flood();if(bridges>Math.max(16,cells.length*.15))throw Error('Too many disconnected details. Clean up the outline or use a simpler pose.');
   }
   return ordered;
 }
 function voxels(design,detail=3,depth=100){
   const resolution={2:8,3:12,4:18}[detail];if(!resolution)throw Error('Invalid detail.');let out=[],mapping;
   if(design.kind==='image'){
     const d=validateImage(design),b=imageBounds(d),scale=resolution/Math.max(b.x1-b.x0+1,b.y1-b.y0+1),W=Math.max(2,Math.round((b.x1-b.x0+1)*scale)),H=Math.max(2,Math.round((b.y1-b.y0+1)*scale));
     const mask=new Uint8Array(W*H),samples=[];
     for(let y=0;y<H;y++)for(let x=0;x<W;x++){let hits=0,total=0;for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){const ix=clamp(Math.floor(b.x0+(x+(dx+.5)/3)/W*(b.x1-b.x0+1)),0,d.width-1),iy=clamp(Math.floor(b.y0+(y+(dy+.5)/3)/H*(b.y1-b.y0+1)),0,d.height-1),i=iy*d.width+ix;hits+=d.mask[i];total++;}mask[y*W+x]=hits/total>=.34?1:0;}
     // A distance field inflates the actual silhouette. Thin limbs stay slim,
     // while broader body regions acquire depth; no animal templates are used.
     const background=[];for(let y=-1;y<=H;y++)for(let x=-1;x<=W;x++)if(x<0||y<0||x>=W||y>=H||!mask[y*W+x])background.push([x,y]);
     const maxHalf=Math.max(.5,resolution*.17*depth/100);
     for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(mask[y*W+x]){const dist=Math.sqrt(Math.min(...background.map(([bx,by])=>(x-bx)**2+(y-by)**2)));const half=Math.max(.5,Math.min(maxHalf,(dist-.2)*depth/100));for(let z=Math.ceil(-half);z<half;z++)out.push({x:x-Math.floor(W/2),y:H-1-y-Math.floor(H/2),z,part:'reference silhouette'});}
     mapping={kind:'image',bounds:b,W,H};
   }else{
     const s=scene(design),b=bounds(s),center=b.min.map((v,j)=>(v+b.max[j])/2),pitch=Math.max(...b.max.map((v,j)=>v-b.min[j]))/resolution;
     const lo=b.min.map((v,j)=>Math.floor((v-center[j])/pitch)),hi=b.max.map((v,j)=>Math.ceil((v-center[j])/pitch));
     for(let y=lo[1];y<hi[1];y++)for(let z=Math.floor(lo[2]*depth/100);z<Math.ceil(hi[2]*depth/100);z++)for(let x=lo[0];x<hi[0];x++){
       const q=[x+.5,y+.5,(z+.5)*100/depth].map((v,j)=>center[j]+v*pitch);let on=false,part='body';
       for(const p of s.parts)if(contains(p,q)){if(p.role==='solid'){on=true;part=p.name;}else if(p.role==='cut')on=false;}
       if(on)out.push({x,y,z,part});
     }
     mapping={kind:'scene',center,pitch};
   }
   if(out.length>1800)throw Error('This design needs too many stitch cells. Choose Small or Standard detail.');
   out=connected(out);out.mapping=mapping;return out;
 }
 function colors(g,design,mapping){
   const hex=rgb=>'#'+rgb.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
   if(design.kind==='image'){
     const d=design,b=mapping.bounds,{W,H}=mapping;
     return g.nodes.map(n=>{const u=clamp((n.p[0]+Math.floor(W/2))/W,0,1),v=clamp((H-Math.floor(H/2)-n.p[1])/H,0,1);let x=clamp(Math.round(b.x0+u*(b.x1-b.x0)),0,d.width-1),y=clamp(Math.round(b.y0+v*(b.y1-b.y0)),0,d.height-1),i=y*d.width+x;
       if(!d.mask[i]){let best=Infinity,jj=i;for(let j=0;j<d.mask.length;j++)if(d.mask[j]){const dist=(x-j%d.width)**2+(y-Math.floor(j/d.width))**2;if(dist<best){best=dist;jj=j;}}i=jj;}
       return hex(d.rgb.slice(i*3,i*3+3));});
   }
   const s=scene(design),base=s.parts.find(p=>p.role==='solid').color;
   const result=g.nodes.map(n=>{const q=n.p.map((v,j)=>mapping.center[j]+v*mapping.pitch*(j===2?100/g.settings.depth:1));let color=base;for(const p of s.parts)if(p.role!=='cut'&&contains(p,q))color=p.color;return color;});
   // Preserve isolated landmarks (eyes, spots, etc.) as physical surface beads
   // even when a color region is smaller than one cell at the selected detail.
   const used=new Set();for(const p of s.parts.filter(p=>p.role==='paint')){let best,dist=Infinity;for(const n of g.nodes)if(n.surface&&!used.has(n.id)){const q=n.p.map((v,j)=>mapping.center[j]+v*mapping.pitch*(j===2?100/g.settings.depth:1)),dd=q.reduce((a,v,j)=>a+((v-p.center[j])/p.size[j])**2,0);if(dd<dist){best=n;dist=dd;}}if(best){result[best.index]=p.color;best.landmark=true;used.add(best.id);}}
   return result;
 }
 root.BeadShape={scene,contains,bounds,imageData,validateImage,voxels,colors,connected,imageBounds};
 if(typeof module!=='undefined')module.exports=root.BeadShape;
})(typeof window!=='undefined'?window:globalThis);
