(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=id=>Number(id.replace(/^[A-Z]+/,''));
function side(g,id,port){const n=g.byId.get(id),i=n?.ends.indexOf(port);if(i!==0&&i!==1)throw Error('Unknown finishing hole end.');return i===0?'A':'B';}
function describe(g,end){
 const origin=g.byId.get(end.bead);if(!origin)throw Error('Unknown finishing origin.');
 return {id:end.id,section:end.section,end:end.end,status:end.status,origin:{id:end.bead,side:side(g,end.bead,end.port),part:g.components.find(c=>c.id===origin.component).name},
  passes:end.moves.filter(m=>m.id!==null).map((m,i)=>{const n=g.byId.get(m.id);if(!n)throw Error('Unknown finishing bead.');return {number:i+1,id:m.id,entrance:side(g,m.id,m.from),exit:side(g,m.id,m.to),part:g.components.find(c=>c.id===n.component).name,color:g.palette[g.colors[n.index]],colorNumber:g.colors[n.index]+1,symbol:String.fromCharCode(65+g.colors[n.index])};})};
}
function text(g){const f=g.finishing;if(!f)return 'Finishing routes have not been planned.';
 return ['FINISHING ROUTE DRAFTS',`${f.candidateEndpoints}/${f.totalEndpoints} ends have candidate weave-in routes. Maximum passages including all candidates: ${f.proposedMaxPasses}/${f.passLimit}.`,
 'Use these existing tails after assembly. Do not cut or start a new line for a finishing route. A and B identify the hole ends in the finishing diagram; locate bead IDs in the assembled preview first.',
 ...f.endpoints.flatMap(end=>{const d=describe(g,end),title=`Length ${d.section}, ${d.end==='starting-tail'?'starting tail':'working end'}: exits bead ${number(d.origin.id)}, end ${d.origin.side} (${d.origin.part}).`;
 return [title,...(d.status==='candidate'?d.passes.map(p=>`${p.number}. Pass bead ${number(p.id)}, ${p.part}, color ${p.colorNumber}: enter ${p.entrance}, exit ${p.exit}.`):['Unresolved: revise the route before finishing.'])];}),
 'Route ends are not secure finishes. Knots and additional securing passes are not specified or included. Test the finish with your actual beads and line before cutting.'].join('\n');
}
function map(g,end){
 const Stages=root.BeadStages||(typeof require==='function'?require('./stage-guide.js'):null);if(!Stages)throw Error('Finishing diagram layout is missing.');
 const ids=[...new Set([end.bead,...end.moves.filter(m=>m.id).map(m=>m.id)])],stage={nodeIds:ids},l=Stages.layout(g,stage);
 // Preserve a consistent spatial ordering, then give each existing bead its
 // own slot. These are deliberately spread-out route maps, not placement maps.
 const ordered=l.nodes.map((n,i)=>({n,i,p:l.pos[i]})).sort((a,b)=>a.p.y-b.p.y||a.p.x-b.p.x),columns=ordered.length>4?3:2,rows=Math.ceil(ordered.length/columns),height=Math.max(460,104+end.moves.filter(m=>m.id).length*88+80),bottom=height-105;
 const nodes=ordered.map(({n,i},slot)=>({id:n.id,x:columns===2?110+(slot%columns)*220:90+(slot%columns)*130,y:rows===1?220:150+Math.floor(slot/columns)*(bottom-150)/(rows-1),axis:l.axes[i],diameter:n.diameterMm||2}));
 return {nodes,byId:new Map(nodes.map(n=>[n.id,n]))};
}
function svg(g,end,{width=800,prefix='finishing'}={}){
 const d=describe(g,end);if(d.status!=='candidate')return '';
 const H=Math.max(460,104+d.passes.length*88+80),layout=map(g,end),uid=(prefix+'-'+end.id).replace(/[^a-zA-Z0-9_-]/g,''),ports=(id,which)=>{const n=layout.byId.get(id),sign=which==='A'?-1:1,r=11*(n.diameter/2);return [n.x+n.axis[0]*r*sign,n.y+n.axis[1]*r*sign];},origin=ports(d.origin.id,d.origin.side);
 let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(width*H/800)}" viewBox="0 0 800 ${H}" role="img" aria-label="Length ${d.section}, ${d.end==='starting-tail'?'starting tail':'working end'}: ${d.passes.length}-bead finishing route"><title>Candidate finishing route ${esc(end.id)}; no knot specified</title><defs><marker id="${uid}-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#a83f6e"/></marker></defs><rect width="800" height="${H}" rx="14" fill="#fffdf9"/><g font-family="Arial,sans-serif" fill="#355b45"><text x="24" y="30" font-size="19" font-weight="bold">Length ${d.section} · ${d.end==='starting-tail'?'starting tail':'working end'}</text><text x="24" y="53" font-size="12">Continue the existing tail from bead ${number(d.origin.id)}, end ${d.origin.side}.</text><text x="24" y="78" font-size="11" fill="#876d7a">Schematic route map · find these beads in the assembled preview</text><path d="M440 85V386" stroke="#e1d4da"/>`;
 let beadLabels='';
 for(const point of layout.nodes){const n=g.byId.get(point.id),color=g.palette[g.colors[n.index]],a=ports(n.id,'A'),b=ports(n.id,'B'),angle=Math.atan2(point.axis[1],point.axis[0])*180/Math.PI;
 out+=`<g data-finishing-bead="${n.id}"><title>bead ${number(n.id)}; ${esc(g.components.find(c=>c.id===n.component).name)}</title><ellipse transform="translate(${point.x} ${point.y}) rotate(${angle})" rx="${11*point.diameter/2}" ry="${14*point.diameter/2}" fill="${esc(color)}" fill-opacity=".35" stroke="#687c6c"/></g>`;
 beadLabels+=`<g pointer-events="none"><text x="${point.x}" y="${point.y-23*point.diameter/2}" text-anchor="middle" font-size="12" stroke="#fffdf9" stroke-width="3" paint-order="stroke">${number(n.id)}</text><text x="${a[0]-point.axis[1]*12}" y="${a[1]+point.axis[0]*12}" text-anchor="middle" font-size="9">A</text><text x="${b[0]-point.axis[1]*12}" y="${b[1]+point.axis[0]*12}" text-anchor="middle" font-size="9">B</text></g>`;
 }
 let previous=origin;
 for(const p of d.passes){const a=ports(p.id,p.entrance),b=ports(p.id,p.exit);
 if(Math.hypot(a[0]-previous[0],a[1]-previous[1])>.1)out+=`<path data-finishing-link="${p.number}" d="M${previous.join(' ')} Q${(previous[0]+a[0])/2+12} ${(previous[1]+a[1])/2-12} ${a.join(' ')}" fill="none" stroke="#a83f6e" stroke-width="1.7" marker-end="url(#${uid}-arrow)"/>`;
 out+=`<path data-finishing-pass="${p.id}" data-pass="${p.number}" data-from="${p.entrance}" data-to="${p.exit}" d="M${a.join(' ')} L${b.join(' ')}" stroke="#a83f6e" stroke-width="2.5" marker-end="url(#${uid}-arrow)"/><circle cx="${a[0]}" cy="${a[1]}" r="3" fill="#387b79"/>`;
 const y=104+(p.number-1)*88;out+=`<g data-finishing-instruction="${p.number}"><text x="463" y="${y}" font-size="14" font-weight="bold">${p.number}. Pass bead ${number(p.id)} · color ${p.colorNumber}</text><text x="463" y="${y+22}" font-size="12">${esc(p.part.length>38?p.part.slice(0,37)+'…':p.part)}</text><path d="M470 ${y+48}H746" stroke="#a83f6e" stroke-width="2" marker-end="url(#${uid}-arrow)"/><ellipse cx="605" cy="${y+48}" rx="18" ry="13" fill="${esc(p.color)}" fill-opacity=".45" stroke="#687c6c"/><text x="472" y="${y+67}" font-size="11">enter ${p.entrance}</text><text x="686" y="${y+67}" font-size="11">exit ${p.exit}</text></g>`;previous=b;
 }
 out+=beadLabels;
 out+=`<circle data-tail-origin="${d.origin.id}" cx="${origin[0]}" cy="${origin[1]}" r="5" fill="#387b79" stroke="#fffdf9"/><rect data-route-end="true" x="${previous[0]-4}" y="${previous[1]-4}" width="8" height="8" fill="#a83f6e" stroke="#fffdf9"/><text x="24" y="${H-55}" font-size="12">Green dot: enter the hole · rose square: route ends, still unsecured</text><text x="24" y="${H-34}" font-size="11" fill="#876d7a">Spacing and rotation are schematic. Crossings are not joins; A/B mark the pictured ends.</text><text x="24" y="${H-14}" font-size="11" fill="#876d7a">No new beads or new line. Knots and extra securing passes still need a tested finish.</text></g></svg>`;return out;
}
function html(g,{prefix='finishing'}={}){const f=g.finishing;if(!f)return '<p>Finishing routes have not been planned.</p>';return `<p>${esc(text(g)).replace(/\n/g,'<br>')}</p>`+f.endpoints.map(end=>end.status==='candidate'?`<figure class="finishing-route-card">${svg(g,end,{prefix})}<figcaption>Candidate weave-in route; secure it with a finish tested on your actual beads and line before cutting.</figcaption></figure>`:'').join('');}
root.BeadFinishingGuide={describe,map,svg,text,html};if(typeof module!=='undefined')module.exports=root.BeadFinishingGuide;
})(typeof window!=='undefined'?window:globalThis);
