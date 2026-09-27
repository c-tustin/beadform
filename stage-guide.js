(function(root){
 'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key=p=>p.join(','),norm=(x,y)=>{const d=Math.hypot(x,y)||1;return [x/d,y/d];};
 function build(g){
   const stages=[];let pending=[],newCount=0,used=new Set();
   const blocks=[];for(const step of g.steps){let b=blocks[blocks.length-1];if(!b||b.cubeId!==step.cubeId){b={cubeId:step.cubeId,steps:[]};blocks.push(b);}b.steps.push(step);}
   function flush(){if(!pending.length)return;const steps=pending.flatMap(b=>b.steps),ids=steps.flatMap(st=>st.ids),operations=[];
     for(const st of steps){let cursor=st.threadStart?st.entryCorner:st.start;if(cursor===null)cursor=g.faces.find(f=>f.id===st.faceId).corners[0];let local=0;
       for(const op of [...st.travel.map(id=>({kind:'pass',id,phase:'position'})),...st.ops.map(o=>({...o,phase:'weave'}))]){const n=g.byId.get(op.id);if(!n.ends.includes(cursor))throw Error('A stage contains a disconnected thread movement.');const to=n.ends[0]===cursor?n.ends[1]:n.ends[0];operations.push({...op,from:cursor,to,step:st.index,local:local++,section:st.threadSection||1,cube:st.cubeId,newThread:local===1&&!!st.threadStart});cursor=to;}
     }
     const parts=new Map();for(const b of pending){const c=g.cubes.find(c=>c.id===b.cubeId),p=c.part||'';if(p&&p!=='reference silhouette')parts.set(p,(parts.get(p)||0)+b.steps.reduce((n,s)=>n+s.ids.length,0));}
     const index=stages.length,main=[...parts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2).map(a=>a[0]),label=main.length?'shape '+main.join(' + '):index===0?'start the form':'grow the form';
     const nodeIds=[...new Set(operations.map(o=>o.id))];stages.push({index,label,start:steps[0].index,end:steps.at(-1).index,steps,blocks:pending,ids,nodeIds,operations,parts:main});pending=[];newCount=0;used=new Set();
   }
   // Stages consist of complete connected units in the existing construction
   // order. They are not horizontal layers and never omit a pass or a bead.
   for(const block of blocks){const ids=block.steps.flatMap(s=>s.ids),all=block.steps.flatMap(s=>[...s.ring,...s.travel]);const union=new Set([...used,...all]);
     if(pending.length&&(newCount+ids.length>60||union.size>100))flush();pending.push(block);newCount+=ids.length;all.forEach(id=>used.add(id));}
   flush();if(stages.length>1&&!stages.at(-1).parts.length)stages.at(-1).label='finish the form';
   const totals=new Map();for(const st of stages)totals.set(st.label,(totals.get(st.label)||0)+1);const numbers=new Map();for(const st of stages)if(totals.get(st.label)>1){const n=(numbers.get(st.label)||0)+1;numbers.set(st.label,n);st.label+=` · ${n}`;}
   return stages;
 }
 function atStep(stages,step){return Math.max(0,stages.findIndex(s=>step>=s.start&&step<=s.end));}
 function cursor(stage,n){n=Math.max(0,Math.min(stage.operations.length,n));if(!n)return {step:stage.start,reveal:0};const op=stage.operations[n-1];return {step:op.step,reveal:op.local+1};}
 function layout(g,stage){if(stage.layout)return stage.layout;
   const nodes=stage.nodeIds.map(id=>g.byId.get(id)),index=new Map(nodes.map((n,i)=>[n.id,i])),corners=new Map();
   for(const n of nodes)for(const c of n.ends){if(!corners.has(c))corners.set(c,[]);corners.get(c).push(index.get(n.id));}
   const links=[],linked=new Set();for(const ids of corners.values())for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){const k=[ids[a],ids[b]].sort((a,b)=>a-b).join(':');if(!linked.has(k)){linked.add(k);links.push([ids[a],ids[b]]);}}
   const pos=nodes.map((n,i)=>({x:(n.p[0]-.62*n.p[2])*68+Math.sin(i*7.17)*2,y:(-n.p[1]-.43*n.p[2])*68+Math.cos(i*9.31)*2})),base=pos.map(p=>({...p}));
   // Spread a 3D bead graph into a readable connected schematic. Bead IDs and
   // thread order are unchanged. Thread crossings are never treated as joins.
   for(let it=0;it<170;it++){
     const force=pos.map((p,i)=>({x:(base[i].x-p.x)*.006,y:(base[i].y-p.y)*.006}));
     for(let i=0;i<pos.length;i++)for(let j=i+1;j<pos.length;j++){let dx=pos[i].x-pos[j].x,dy=pos[i].y-pos[j].y,d=Math.hypot(dx,dy);if(d<.1){dx=Math.sin(i+j+.3);dy=Math.cos(i+j+.3);d=1;}const f=d<52?(52-d)*.48:Math.min(.75,160/(d*d));force[i].x+=dx/d*f;force[i].y+=dy/d*f;force[j].x-=dx/d*f;force[j].y-=dy/d*f;}
     for(const [a,b]of links){const dx=pos[b].x-pos[a].x,dy=pos[b].y-pos[a].y,d=Math.hypot(dx,dy)||1,f=(d-71)*.022;force[a].x+=dx/d*f;force[a].y+=dy/d*f;force[b].x-=dx/d*f;force[b].y-=dy/d*f;}
     const rate=it<110?.9:.4;for(let i=0;i<pos.length;i++){pos[i].x+=Math.max(-8,Math.min(8,force[i].x))*rate;pos[i].y+=Math.max(-8,Math.min(8,force[i].y))*rate;}
   }
   const minX=Math.min(...pos.map(p=>p.x)),maxX=Math.max(...pos.map(p=>p.x)),minY=Math.min(...pos.map(p=>p.y)),maxY=Math.max(...pos.map(p=>p.y)),spanX=maxX-minX,spanY=maxY-minY,W=Math.max(560,spanX+100),H=Math.max(450,spanY+115),shiftX=(W-spanX)/2-minX,shiftY=(H-spanY)/2-minY;
   pos.forEach(p=>{p.x+=shiftX;p.y+=shiftY;});
   const junctions=new Map([...corners].map(([c,ids])=>[c,{x:ids.reduce((n,i)=>n+pos[i].x,0)/ids.length,y:ids.reduce((n,i)=>n+pos[i].y,0)/ids.length}]));
   const axes=nodes.map(n=>{const a=junctions.get(n.ends[0]),b=junctions.get(n.ends[1]);if(Math.hypot(b.x-a.x,b.y-a.y)>.1)return norm(b.x-a.x,b.y-a.y);return [[1,0],[0,-1],[-.82,-.57]][n.axis];});
   return stage.layout={nodes,index,pos,axes,W,H};
 }
 function diagram(g,stage,colors,palette,{width=900,height,reveal=Infinity,labels=false,prefix='stage',quiet=false}={}){
   const l=layout(g,stage),{W,H}=l,newSet=new Set(stage.ids),shownOps=stage.operations.slice(0,reveal),added=new Set(shownOps.filter(o=>o.kind==='pick').map(o=>o.id)),uid=`${prefix}-${stage.index}`,top=65,bottom=63;
   let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height||Math.round(width*(H+top+bottom)/W)}" viewBox="0 0 ${W} ${H+top+bottom}" role="img" aria-label="Stage ${stage.index+1}: ${esc(stage.label)}, connected bead and thread diagram"><title>${esc(stage.label)} · ${stage.ids.length} new beads in ${stage.blocks.length} joined units</title><defs>${['rose','green'].map((c,i)=>`<marker id="${uid}-${c}" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="4.2" markerHeight="4.2" orient="auto"><path d="M0 0 8 4 0 8 2 4Z" fill="${i?'#387b79':'#b74472'}"/></marker>`).join('')}</defs><rect width="${W}" height="${H+top+bottom}" rx="12" fill="#fffdf9"/><g font-family="Arial,sans-serif"><text x="25" y="29" font-size="${Math.min(23,(W-50)/((stage.label.length+4)*.56))}" font-weight="bold" fill="#3e6149">${stage.index+1}. ${esc(stage.label)}</text><text x="25" y="51" font-size="13" fill="#8e7080">${stage.caption?esc(stage.caption):`${stage.ids.length} new beads · ${stage.blocks.length} complete units · ${stage.steps.length} rings shown together`}</text><g transform="translate(0 ${top})">`;
   if(l.peyote){for(let r=l.radii.length-1;r>=0;r--)s+=`<circle data-peyote-band="${r+1}" cx="${l.roundCenter.x}" cy="${l.roundCenter.y}" r="${l.radii[r]+20}" fill="${r%2?'#e5eee2':'#f4e2eb'}"/>`;s+=`<circle cx="${l.roundCenter.x}" cy="${l.roundCenter.y}" r="28" fill="#fffdf9"/>`;}
   let beadOverlay='';
   for(let i=0;i<l.nodes.length;i++){const n=l.nodes[i],p=l.pos[i],a=l.axes[i],beadScale=(n.diameterMm||2)/2,angle=Math.atan2(a[1],a[0])*180/Math.PI,fresh=newSet.has(n.id),visible=!fresh||added.has(n.id),h=palette[colors[n.index]],code=String.fromCharCode(65+colors[n.index]);
     s+=`<g data-stage-bead="${n.id}" opacity="${visible?1:.14}"><title>bead ${Number(n.id.replace(/^[A-Z]+/,''))} · ${n.material||'seed bead'} · ${fresh?'new in this stage':'already made'}</title><g transform="translate(${p.x} ${p.y}) rotate(${angle})"><ellipse rx="${8.5*beadScale}" ry="${11*beadScale}" fill="${h}" fill-opacity="${fresh?.35:.1}" stroke="${fresh?'#b9517a':stage.kind==='join'?(n.component===stage.parent?'#387b79':'#b74472'):'#b7c3b9'}" stroke-width="${fresh?1.9:1.3}"/><ellipse rx="${7.5*beadScale}" ry="${3.5*beadScale}" fill="#fffdf9" stroke="#a996a855" stroke-width=".6"/></g>${labels?`<text x="${p.x}" y="${p.y-16*beadScale}" text-anchor="middle" font-size="9" fill="${fresh?'#6e4f60':'#88998e'}">${Number(n.id.replace(/^[A-Z]+/,''))}</text>`:''}</g>`;
   }
   // Draw outlines and ID labels above the thread casing, so the closing passes
   // cannot erase beads or hide the last round's labels.
   for(let i=0;i<l.nodes.length;i++){const n=l.nodes[i],p=l.pos[i],a=l.axes[i],fresh=newSet.has(n.id),visible=!fresh||added.has(n.id),beadScale=(n.diameterMm||2)/2,angle=Math.atan2(a[1],a[0])*180/Math.PI;beadOverlay+=`<g opacity="${visible?1:.14}" pointer-events="none"><ellipse transform="translate(${p.x} ${p.y}) rotate(${angle})" rx="${8.5*beadScale}" ry="${11*beadScale}" fill="none" stroke="${fresh?'#b9517a':stage.kind==='join'?(n.component===stage.parent?'#387b79':'#b74472'):'#b7c3b9'}" stroke-width="1.4"/>${labels?`<text x="${p.x}" y="${p.y-16*beadScale}" text-anchor="middle" font-size="9" fill="#6e4f60" stroke="#fffdf9" stroke-width="3" paint-order="stroke">${Number(n.id.replace(/^[A-Z]+/,''))}</text>`:''}</g>`;}
   const usage=new Map();for(const op of stage.operations)usage.set(op.id,(usage.get(op.id)||0)+1);const visits=new Map();let prev=null,first=null,last=null;
   for(let j=0;j<shownOps.length;j++){const faded=quiet&&(!Number.isFinite(reveal)||j<shownOps.length-1);const op=shownOps[j],i=l.index.get(op.id),p=l.pos[i],axis=l.axes[i],n=l.nodes[i],beadScale=(n.diameterMm||2)/2,sign=op.from===n.ends[0]?1:-1,dir=axis.map(v=>v*sign),visit=visits.get(op.id)||0,offset=(visit-(usage.get(op.id)-1)/2)*1.05;visits.set(op.id,visit+1);
     const a=[p.x-dir[0]*9*beadScale-axis[1]*offset,p.y-dir[1]*9*beadScale+axis[0]*offset],b=[p.x+dir[0]*9*beadScale-axis[1]*offset,p.y+dir[1]*9*beadScale+axis[0]*offset],color=op.phase==='position'?'#387b79':'#b74472',arrow=op.phase==='position'?'green':'rose';
     if(prev&&op.newThread)s+=`<rect x="${prev.b[0]-3}" y="${prev.b[1]-3}" width="6" height="6" fill="#b74472"><title>Secure the previous working length here.</title></rect>`;
     if(prev&&(prev.to===op.from||op.bridge)&&prev.section===op.section&&!op.newThread){const gap=Math.hypot(a[0]-prev.b[0],a[1]-prev.b[1]),t=Math.min(32,Math.max(13,gap*.4));let d=`M${prev.b.join(' ')} C${prev.b[0]+prev.dir[0]*t} ${prev.b[1]+prev.dir[1]*t} ${a[0]-dir[0]*t} ${a[1]-dir[1]*t} ${a.join(' ')}`;
       const round=l.roundForId?.get(op.id);let ringArc=false;if(round!==undefined&&round===l.roundForId.get(prev.id)&&prev.id!==op.id){const c=l.roundCenter,u=Math.atan2(prev.b[1]-c.y,prev.b[0]-c.x),v=Math.atan2(a[1]-c.y,a[0]-c.x),delta=Math.atan2(Math.sin(v-u),Math.cos(v-u)),radius=l.radii[round]+offset;d=`M${prev.b.join(' ')} A${radius} ${radius} 0 0 ${delta>=0?1:0} ${a.join(' ')}`;ringArc=true;}
       s+=`<path d="${d}" fill="none" stroke="#fffdf9" stroke-width="3.5" opacity="${faded?0:1}"/><path data-stage-link="${j}" data-ring-arc="${ringArc}" d="${d}" fill="none" stroke="${color}" stroke-width="1.15" opacity="${faded?.06:.95}" ${!faded&&(ringArc||j%2===0)?`marker-end="url(#${uid}-${arrow})"`:''}/>`;
     }
     s+=`<path data-stage-pass="${op.id}" data-move="${j+1}" data-kind="${op.kind}" d="M${a.join(' ')} L${b.join(' ')}" fill="none" stroke="${color}" stroke-width="${quiet&&!faded?2.5:1.05}" opacity="${faded?.06:.95}"><title>Movement ${j+1}: ${op.kind} bead ${Number(op.id.replace(/^[A-Z]+/,''))}; ${esc(g.steps?.[op.step]?.label||("ring "+(op.step+1)))}</title></path>`;
     if(!first)first=a;last=b;prev={id:op.id,b,dir,to:op.to,section:op.section};
     if(op.newThread&&(j||op.section>1)){s+=`<text x="${a[0]-21}" y="${a[1]+18}" fill="#387b79" font-size="17">★</text>`;}
   }
   s+=beadOverlay;
   // The next bead and its hole direction are visual targets, independent of IDs.
   if(quiet){const nextIndex=Number.isFinite(reveal)?Math.min(shownOps.length,stage.operations.length):0,next=stage.operations[nextIndex];
    if(next){const i=l.index.get(next.id),p=l.pos[i],axis=l.axes[i],node=l.nodes[i],sign=next.from===node.ends[0]?1:-1,dx=axis[0]*sign,dy=axis[1]*sign,r=(node.diameterMm||2)*8;
     s+=`<g data-next-target="${next.id}"><circle cx="${p.x}" cy="${p.y}" r="${r+10}" fill="#f4c6da" fill-opacity=".28" stroke="#b74472" stroke-width="3" stroke-dasharray="${next.kind==='pick'?'4 4':'0'}"/><path d="M${p.x-dx*52} ${p.y-dy*52} L${p.x-dx*18} ${p.y-dy*18}" stroke="#244b37" stroke-width="4" marker-end="url(#${uid}-green)"/><circle cx="${p.x-dx*52}" cy="${p.y-dy*52}" r="5" fill="#244b37"/></g>`;
    }
   }
   if(l.peyote)for(let r=0;r<l.radii.length;r++)s+=`<text data-round-label="${r+1}" x="${l.roundCenter.x-l.radii[r]-9}" y="${l.roundCenter.y+17}" text-anchor="middle" font-size="10" fill="#6e4f60" stroke="#fffdf9" stroke-width="3" paint-order="stroke">R${r+1}</text>`;
   if(first)s+=`<circle cx="${first[0]}" cy="${first[1]}" r="4" fill="#387b79" stroke="#fffdf9" stroke-width="1.5"/><text x="${first[0]-8}" y="${first[1]+24}" fill="#387b79" font-size="12" font-weight="bold">${g.continuous?(stage.operations[0]?.newThread?(stage.operations[0].section>1?'new line':'start'):'continue'):'start'}</text>`;
   if(last)s+=`<rect x="${last[0]-4}" y="${last[1]-4}" width="8" height="8" fill="#b74472" stroke="#fffdf9" stroke-width="1.5"/><text x="${last[0]>W-110?last[0]-14:last[0]+14}" y="${last[1]-18}" text-anchor="${last[0]>W-110?'end':'start'}" fill="#b74472" stroke="#fffdf9" stroke-width="3" paint-order="stroke" font-size="12" font-weight="bold">${reveal<stage.operations.length?'here':g.continuous&&stage.index<g.stages.length-1?'continue →':'finish'}</text>`;
   s+=`</g><text x="25" y="${top+H+21}" font-size="12" fill="#b74472">rose: weave</text><text x="165" y="${top+H+21}" font-size="12" fill="#387b79">green: reposition</text><text x="345" y="${top+H+21}" font-size="12" fill="#839287">pale beads: already made</text><text x="25" y="${top+H+44}" font-size="11" fill="#887782">${l.peyote?"Shaded bands = peyote rounds, not bead colors. ":g.continuous?"Bead numbers stay the same across steps. ":labels?"Numbers identify beads. ":"Spread-out bead map. "}★ fresh line · crossings are not joins.</text></g></svg>`;
   return s;
 }
 function overview(g,stages,colors,palette,{title='my beaded project',width=1100,selected=-1}={}){
   const rowHeight=570,header=135+Math.ceil(palette.length/5)*28,H=header+Math.ceil(stages.length/2)*rowHeight+30;
   let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 1100 ${H}" role="img" aria-label="Complete pattern in ${stages.length} significant construction stages"><rect width="1100" height="${H}" fill="#fffdf9"/><text x="30" y="43" font-family="Georgia,serif" font-size="${Math.min(30,1000/(Math.max(1,title.length)*.6))}" fill="#3e6149">${esc(title)}</text><text x="30" y="75" font-family="Arial" font-size="15" fill="#9b7187">the whole pattern · ${stages.length} significant stages · ${g.nodes.length} physical beads</text><text x="30" y="102" font-family="Arial" font-size="12" fill="#70846a">Size 11/0 seed beads · ${g.settings.threadDiameter} mm fishing line · select a stage to enlarge or replay it</text>`;
   const counts=palette.map(()=>0);colors.forEach(c=>counts[c]++);for(let i=0;i<palette.length;i++){const x=40+(i%5)*214,y=128+Math.floor(i/5)*28;s+=`<circle cx="${x}" cy="${y}" r="8" fill="${palette[i]}" stroke="#66856d"/><text x="${x+15}" y="${y+4}" font-family="Arial" font-size="12" fill="#566d57">${String.fromCharCode(65+i)} · ${palette[i].toUpperCase()} · ${counts[i]} beads</text>`;}
   for(const st of stages){const x=20+(st.index%2)*540,y=header+Math.floor(st.index/2)*rowHeight;s+=`<g data-stage-card="${st.index}" role="button" tabindex="0" aria-label="Open stage ${st.index+1}: ${esc(st.label)}"><rect x="${x}" y="${y}" width="520" height="550" rx="14" fill="#fffdf9" stroke="${st.index===selected?'#82a080':'#ecdedc'}" stroke-width="${st.index===selected?2:1}"/>${diagram(g,st,colors,palette,{width:510,height:540,prefix:'overview'}).replace('<svg ',`<svg x="${x+5}" y="${y+5}" `)}</g>`;}
   return {W:1100,H,svg:s+'</svg>'};
 }
 root.BeadStages={build,atStep,cursor,layout,diagram,overview};if(typeof module!=='undefined')module.exports=root.BeadStages;
})(typeof window!=='undefined'?window:globalThis);
