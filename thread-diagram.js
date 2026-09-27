(function(root){
 'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function svg(g,step,colors,palette,{width=500,height=450,reveal=Infinity,context=true}={}){
   const face=g.faces.find(f=>f.id===step.faceId),corners=[[116,124],[344,124],[344,326],[116,326]],pts=[[230,124],[344,225],[230,326],[116,225]],newIds=new Set(step.ids),uid='thread-'+step.index;
   const ops=[...step.travel.map(id=>({id,kind:'pass',phase:'move'})),...step.ops.map(o=>({...o,phase:'ring'}))],visibleOps=ops.slice(0,reveal),added=new Set(visibleOps.filter(o=>o.kind==='pick').map(o=>o.id));
   const axis=(a,b)=>{const A=a.split(',').map(Number),B=b.split(',').map(Number),j=A.findIndex((v,i)=>v!==B[i]);return (B[j]>A[j]?'+':'−')+['X','Y','Z'][j];},orientation=`right ${axis(face.corners[0],face.corners[1])} · down ${axis(face.corners[0],face.corners[3])}`;
   const travelRows=Math.ceil(step.travel.length/9),viewH=452+(travelRows?travelRows*58+30:0);
   let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 500 ${viewH}" role="img" aria-label="Beads and thread for ${esc(step.label)}"><title>${esc(step.label)} · ${step.faceId} · arrows follow the working thread</title><defs><marker id="${uid}-rose" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 8 4 0 8 2 4Z" fill="#ad406d"/></marker><marker id="${uid}-green" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 8 4 0 8 2 4Z" fill="#3c7970"/></marker></defs><rect width="500" height="${viewH}" rx="12" fill="#fffdf9"/><g font-family="Arial,sans-serif"><text x="24" y="29" fill="#355b45" font-size="16" font-weight="bold">${step.index+1}. ${esc(step.label)}</text><text x="24" y="49" fill="#876d7a" font-size="11">${step.faceId} · ${step.ids.length} beads added · thread ${step.threadSection||1}${step.part?' · '+esc(step.part):''}</text>`;
   // Faint guide is geometry, never a thread route. The working line passes
   // through each bead's actual hole axis, then curves around the corner.
   if(context)s+='<path d="M116 124H344V326H116Z" fill="none" stroke="#eee6e3" stroke-dasharray="3 6"/>';
   for(let i=0;i<4;i++){
     const id=face.ids[i],n=g.byId.get(id),h=palette[colors[n.index]],code=String.fromCharCode(65+colors[n.index]),[x,y]=pts[i],newBead=newIds.has(id),shown=!newBead||added.has(id),horizontal=i%2===0;
     s+=`<g data-diagram-bead="${id}" opacity="${shown?1:.2}"><title>${id} · color ${code} · ${newBead?'add new':'already present'}</title><ellipse cx="${x}" cy="${y}" rx="${horizontal?17:25}" ry="${horizontal?25:17}" fill="${h}" fill-opacity="${newBead?.35:.12}" stroke="${newBead?'#b64e7a':'#9daca3'}" stroke-width="${newBead?2.3:1.4}"/><ellipse cx="${x}" cy="${y}" rx="${horizontal?16:4}" ry="${horizontal?4:16}" fill="#fffdf9" stroke="#9a7b8855" stroke-width=".8"/>`;
     const lx=x+(i===1?43:i===3?-43:0),ly=y+(i===0?-52:i===2?47:4);
     s+=`<text x="${lx}" y="${ly}" text-anchor="middle" fill="#355b45" font-size="12" font-weight="bold">${code}</text><text x="${lx}" y="${ly+13}" text-anchor="middle" fill="#7b6971" font-size="10">${id}</text></g>`;
   }
   let cursor=step.ringStart||(step.index===0?face.corners[0]:null);
   if(!cursor){cursor=step.start;for(const id of step.travel){const n=g.byId.get(id);cursor=n.ends[0]===cursor?n.ends[1]:n.ends[0];}}
   const ringOps=step.ops.slice(0,Math.max(0,reveal-step.travel.length));let prev=null;
   for(let j=0;j<ringOps.length;j++){
     const op=ringOps[j],n=g.byId.get(op.id),idx=face.ids.indexOf(op.id),[x,y]=pts[idx],entry=face.corners.indexOf(cursor);if(entry<0||idx<0)continue;
     const c=corners[entry],exit=n.ends[0]===cursor?n.ends[1]:n.ends[0],ex=corners[face.corners.indexOf(exit)],dx=(ex[0]-c[0])/Math.hypot(ex[0]-c[0],ex[1]-c[1]),dy=(ex[1]-c[1])/Math.hypot(ex[0]-c[0],ex[1]-c[1]),offset=j===4?4:0;
     const a=[x-dx*24-dy*offset,y-dy*24+dx*offset],b=[x+dx*24-dy*offset,y+dy*24+dx*offset];
     if(prev)s+=`<path data-thread="ring" d="M${prev.join(' ')} Q${c.join(' ')} ${a.join(' ')}" fill="none" stroke="#ad406d" stroke-width="1.8" marker-end="url(#${uid}-rose)"/>`;
     else{s+=`<path d="M${c[0]-dx*15} ${c[1]-dy*15} Q${c.join(' ')} ${a.join(' ')}" fill="none" stroke="#ad406d" stroke-width="1.8" marker-end="url(#${uid}-rose)"/><text x="${c[0]+12}" y="${c[1]-12}" font-size="12" fill="#3c7970">★ start</text>`;}
     s+=`<path data-through-hole="${op.id}" d="M${a.join(' ')} L${b.join(' ')}" stroke="#ad406d" stroke-width="1.6" fill="none"/>${ringOps.findIndex(o=>o.id===op.id)===j?`<text x="${x-dy*35}" y="${y+dx*35+3}" text-anchor="middle" fill="#ad406d" font-size="10">${ringOps.map((o,k)=>o.id===op.id?k+1:null).filter(Boolean).join(", ")}</text>`:""}`;
     prev=b;cursor=exit;
   }
   if(prev){const end=corners[face.corners.indexOf(cursor)];s+=`<path d="M${prev.join(' ')} Q${end.join(' ')} ${end[0]+12} ${end[1]+20}" fill="none" stroke="#ad406d" stroke-width="1.6" marker-end="url(#${uid}-rose)"/><text x="${end[0]+18}" y="${end[1]+33}" fill="#ad406d" font-size="10">${step.endThread?'secure end':'exit'}</text>`;}
   s+=`<text x="230" y="218" text-anchor="middle" font-size="13" fill="#355b45">${step.ids.length?'pick up + join':'close this face'}</text><text x="230" y="239" text-anchor="middle" font-size="10" fill="#89757c">numbers = thread order</text><text x="230" y="260" text-anchor="middle" font-size="9" fill="#89757c">face map: ${orientation}</text><text x="24" y="412" fill="#ad406d" font-size="11">— rose: work the ring</text><text x="258" y="412" fill="#3c7970" font-size="11">— green: move into position</text><text x="24" y="433" fill="#89757c" font-size="10">Strong bead outline = new · pale outline = existing · B IDs stay the same.</text>`;
   if(step.travel.length){s+=`<text x="24" y="463" font-size="11" fill="#3c7970">First, move through these existing beads (${step.travel.length} passes):</text>`;
     for(let i=0;i<step.travel.length;i++){const row=Math.floor(i/9),col=i%9,x=38+col*52,y=491+row*58,id=step.travel[i],n=g.byId.get(id),code=String.fromCharCode(65+colors[n.index]),on=i<reveal;s+=`<g opacity="${on?1:.2}"><ellipse cx="${x}" cy="${y}" rx="10" ry="14" fill="${palette[colors[n.index]]}" fill-opacity=".2" stroke="#9daca3"/><path d="M${x-14} ${y}H${x+19}" fill="none" stroke="#3c7970" stroke-width="1.5" marker-end="url(#${uid}-green)"/><text x="${x}" y="${y-19}" text-anchor="middle" font-size="9" fill="#3c7970">${i+1} · ${code}</text><text x="${x}" y="${y+26}" text-anchor="middle" font-size="8" fill="#6a7970">${id}</text></g>`;}
   }
   return s+'</g></svg>';
 }
 root.BeadThread={svg};if(typeof module!=='undefined')module.exports=root.BeadThread;
})(typeof window!=='undefined'?window:globalThis);
