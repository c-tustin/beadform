(function(root){
'use strict';
function compose(g,stage,{width=950,minimumSpacing=32}={}){
 const owners=new Set([stage.component,...stage.operations.map(o=>g.byId.get(o.id).component)]);if(stage.parent)owners.add(stage.parent);
 const components=g.components.filter(c=>owners.has(c.id)),tiles=[];
 for(const c of components){
  const source=g.stages[c.stage].layout,points=c.ids.map(id=>source.pos[source.index.get(id)]);let scale=.6;
  for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++){
   const d=Math.hypot(points[a].x-points[b].x,points[a].y-points[b].y);
   if(d<1e-6)throw Error('A component diagram contains coincident bead positions.');
   const radii=11*((g.byId.get(c.ids[a]).diameterMm||2)+(g.byId.get(c.ids[b]).diameterMm||2))/2;
   scale=Math.max(scale,Math.max(minimumSpacing,radii+10)/d);
  }
  const minX=Math.min(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxX=Math.max(...points.map(p=>p.x)),maxY=Math.max(...points.map(p=>p.y)),padding=44,tileWidth=Math.max(180,(maxX-minX)*scale+padding*2);
  const chars=Math.max(12,Math.floor((tileWidth-24)/9)),words=c.name.split(/\s+/),lines=[];for(const word of words){if(lines.length&&lines.at(-1).length+word.length+1<=chars)lines[lines.length-1]+=' '+word;else lines.push(word);}
  const header=lines.length*20+14,tileHeight=Math.max(140,(maxY-minY)*scale+padding*2+header);
  tiles.push({c,source,scale,minX,minY,padding,width:tileWidth,height:tileHeight,header,lines});
 }
 const W=Math.max(width,...tiles.map(t=>t.width)),rows=[];let row=[];for(const tile of tiles){if(row.length&&row.reduce((n,t)=>n+t.width+24,0)+tile.width>W){rows.push(row);row=[];}row.push(tile);}if(row.length)rows.push(row);
 const nodes=[],pos=[],axes=[],labels=[],sections=[];let y=10;
 for(const row of rows){const used=row.reduce((n,t)=>n+t.width,0)+(row.length-1)*24;let x=(W-used)/2;
  for(const t of row){labels.push({component:t.c.id,x:x+12,y:y+22,lines:t.lines});for(const section of t.source.sections||[])sections.push({text:section.text,x:x+t.padding+(section.x-t.minX)*t.scale,y:y+t.header+t.padding+(section.y-t.minY)*t.scale});for(const id of t.c.ids){const n=g.byId.get(id),i=t.source.index.get(id),p=t.source.pos[i];nodes.push(n);pos.push({x:x+t.padding+(p.x-t.minX)*t.scale,y:y+t.header+t.padding+(p.y-t.minY)*t.scale});axes.push(t.source.axes[i]);}x+=t.width+24;}
  y+=Math.max(...row.map(t=>t.height))+24;
 }
 return {nodes,pos,axes,index:new Map(nodes.map((n,i)=>[n.id,i])),W,H:y,components,labels,sections};
}
function measure(layout,{renderedWidth=950}={}){let minimum=Infinity,crowded=0;for(let a=0;a<layout.nodes.length;a++)for(let b=a+1;b<layout.nodes.length;b++){const d=Math.hypot(layout.pos[a].x-layout.pos[b].x,layout.pos[a].y-layout.pos[b].y),clearance=(d-11*((layout.nodes[a].diameterMm||2)+(layout.nodes[b].diameterMm||2))/2)*renderedWidth/layout.W;minimum=Math.min(minimum,clearance);if(clearance<2)crowded++;}return {beads:layout.nodes.length,crowded_pairs:crowded,minimum_nominal_glyph_clearance_px:Number.isFinite(minimum)?minimum:null,viewbox_width:layout.W,viewbox_height:layout.H};}
root.BeadPartsLayout={compose,measure};if(typeof module!=='undefined')module.exports=root.BeadPartsLayout;
})(typeof window!=='undefined'?window:globalThis);
