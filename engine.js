(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const key = (c, r) => `${c}:${r}`;
  const otherEnd = (edge, vertex) => edge.ends[0] === vertex ? edge.ends[1] : edge.ends[0];
  const code = i => String.fromCharCode(65 + i);
  function geometry(s) {
    const { stitch, width: C, rows: R, beadLength: L, beadDiameter: D } = s;
    if (!['peyote','raw','square'].includes(stitch) || !Number.isInteger(C) || !Number.isInteger(R) || C < 2 || R < 2 || C > 80 || R > 120 || !(L >= .5 && L <= 8) || !(D >= .5 && D <= 8)) throw Error('Pattern dimensions are outside the supported range.');
    if (stitch === 'peyote' && C % 2) throw Error('Even-count peyote needs an even starter count.');
    const nodes = [], cells = [], byId = new Map(), neighbors = new Map();
    function add(n) { nodes.push(n); byId.set(n.id, n); neighbors.set(n.id, new Set()); }
    function link(a,b) { neighbors.get(a).add(b); neighbors.get(b).add(a); }
    let W,H;
    if (stitch === 'raw') {
      const p=L+D, m=D/2; W=C*p+D; H=R*p+D;
      for(let r=0;r<=R;r++) for(let c=0;c<C;c++) add({id:`H${r+1}-${c+1}`,r,c,x:m+(c+.5)*p,y:m+r*p,w:L,h:D,orientation:'horizontal',ends:[key(c,r),key(c+1,r)]});
      for(let r=0;r<R;r++) for(let c=0;c<=C;c++) add({id:`V${r+1}-${c+1}`,r,c,x:m+c*p,y:m+(r+.5)*p,w:D,h:L,orientation:'vertical',ends:[key(c,r),key(c,r+1)]});
      for(let r=0;r<R;r++) for(let c=0;c<C;c++) {
        const cell={id:`U${r+1}-${c+1}`,r,c,x:m+(c+.5)*p,y:m+(r+.5)*p,n:`H${r+2}-${c+1}`,e:`V${r+1}-${c+2}`,s:`H${r+1}-${c+1}`,w:`V${r+1}-${c+1}`};
        cell.ids=[cell.n,cell.e,cell.s,cell.w]; cells.push(cell);
        for(let j=0;j<4;j++) link(cell.ids[j],cell.ids[(j+1)%4]);
      }
    } else if(stitch === 'peyote') {
      W=C*L; H=(R+1)*D/2;
      for(let r=0;r<R;r++) for(let c=0;c<C/2;c++) add({id:`P${r+1}-${c+1}`,r,c,x:(2*c+(r%2===0?1:0)+.5)*L,y:(r/2+.5)*D,w:L,h:D,orientation:'horizontal'});
      const starter=[]; for(let c=0;c<C/2;c++) starter.push(`P2-${c+1}`,`P1-${c+1}`);
      for(let i=1;i<starter.length;i++) link(starter[i-1],starter[i]);
      for(let r=2;r<R;r++) for(let c=0;c<C/2;c++) { link(`P${r+1}-${c+1}`,`P${r}-${c+1}`); const next=c+(r%2===0?1:-1); if(next>=0 && next<C/2) link(`P${r+1}-${c+1}`,`P${r}-${next+1}`); }
    } else {
      W=C*L; H=R*D;
      for(let r=0;r<R;r++) for(let c=0;c<C;c++) add({id:`S${r+1}-${c+1}`,r,c,x:(c+.5)*L,y:(r+.5)*D,w:L,h:D,orientation:'horizontal'});
      for(const n of nodes) { if(n.r) link(n.id,`S${n.r}-${n.c+1}`); if(n.c) link(n.id,`S${n.r+1}-${n.c}`); }
    }
    return {stitch,C,R,L,D,W,H,nodes,cells,byId,neighbors};
  }
  function steps(g) {
    if(g.stitch==='raw') return rawSteps(g);
    const out=[];
    if(g.stitch==='peyote') {
      const ids=[]; for(let c=0;c<g.C/2;c++) ids.push(`P2-${c+1}`,`P1-${c+1}`);
      out.push({label:'Foundation · rows 1 + 2',row:0,direction:'Left → right',ids,kind:'foundation',note:`String these ${g.C} beads in order after a temporary stop bead. They become the first two interleaved rows. The stop bead is extra.`});
      for(let r=2;r<g.R;r++) {
        let ns=g.nodes.filter(n=>n.r===r); if(r%2===0) ns.reverse();
        out.push({label:`Row ${r+1}`,row:r,direction:r%2===0?'Right → left':'Left → right',ids:ns.map(n=>n.id),anchors:ns.map(n=>`P${r}-${n.c+1}`),kind:'row',note:'Pick up each listed bead and pass through the corresponding raised bead in the previous row. At the end, turn and continue.'});
      }
    } else {
      for(let r=0;r<g.R;r++) {
        let ns=g.nodes.filter(n=>n.r===r); if(r%2) ns.reverse();
        out.push({label:`Row ${r+1}`,row:r,direction:r%2?'Right → left':'Left → right',ids:ns.map(n=>n.id),kind:r===0?'foundation':'row',note:r===0?'String this foundation from left to right after a temporary stop bead.':'For each new bead, loop through the bead directly below, then back through the new bead. Reinforce and turn at the end of the row.'});
      }
    }
    return out;
  }
  function rawSteps(g) {
    const order=[];
    for(let r=0;r<g.R;r++){ const row=g.cells.filter(c=>c.r===r); if(r%2) row.reverse(); order.push(...row); }
    const used=new Set(), out=[]; let vertex,prev,current;
    function next(cell) { return cell.ids.find(id=>id!==prev && g.byId.get(id).ends.includes(vertex)); }
    function pass(id) { const n=g.byId.get(id); if(!n.ends.includes(vertex)) throw Error('Disconnected RAW traversal.'); vertex=otherEnd(n,vertex); prev=id; }
    for(let i=0;i<order.length;i++) {
      const cell=order[i], travel=[], ops=[], ids=[], shared=cell.ids.filter(id=>used.has(id));
      if(i===0) {
        vertex=key(0,1);
        for(const id of cell.ids) { ops.push({kind:'pick',id}); ids.push(id); used.add(id); pass(id); }
        ops.push({kind:'pass',id:cell.n}); pass(cell.n);
      } else {
        const entry=current.ids.find(id=>cell.ids.includes(id));
        if(!entry) throw Error('RAW unit order is not adjacent.');
        for(let j=0;prev!==entry && j<4;j++) { const id=next(current); travel.push(id); pass(id); }
        if(prev!==entry) throw Error('RAW entry could not be reached.');
        for(let j=0;j<4;j++) {
          const id=next(cell); const kind=used.has(id)?'pass':'pick';
          ops.push({kind,id}); if(kind==='pick') { ids.push(id); used.add(id); } pass(id);
        }
      }
      current=cell;
      out.push({label:`Unit ${cell.r+1}.${cell.c+1}`,row:cell.r,col:cell.c,direction:cell.r%2?'Right → left':'Left → right',kind:'unit',cell,travel,ops,ids,shared,note:i===0?'Pick up the four beads in order. Circle back through the first bead to close the unit; secure the starting thread.':'First follow “move through,” then work the ring in order. Pick adds a bead; pass reuses an existing bead.'});
    }
    return out;
  }
  function validate(g,colors,palette) {
    const errors=[];
    const expected=g.stitch==='raw'?2*g.C*g.R+g.C+g.R:g.stitch==='peyote'?g.C/2*g.R:g.C*g.R;
    if(g.nodes.length!==expected || g.byId.size!==expected) errors.push('The bead count does not match the stitch geometry.');
    if(colors && (colors.length!==expected || colors.some(v=>!Number.isInteger(v)||v<0||v>=palette.length))) errors.push('Every bead must have a palette color.');
    const visited=new Set(), stack=[g.nodes[0].id];
    while(stack.length) { const id=stack.pop(); if(visited.has(id)) continue; visited.add(id); for(const other of g.neighbors.get(id)) if(!visited.has(other)) stack.push(other); }
    if(visited.size!==expected) errors.push('Some beads are disconnected.');
    const guide=steps(g), all=guide.flatMap(s=>s.ids);
    if(all.length!==expected || new Set(all).size!==expected) errors.push('Construction must add each bead exactly once.');
    if(g.stitch==='raw') {
      const hits=new Map(); for(const c of g.cells) { if(new Set(c.ids).size!==4) errors.push('A RAW unit is incomplete.'); for(const id of c.ids) hits.set(id,(hits.get(id)||0)+1); }
      if([...hits.values()].some(n=>n<1||n>2)) errors.push('A RAW bead has an invalid number of shared units.');
    }
    return {valid:errors.length===0,errors,expected,connected:visited.size,guide};
  }
  function rgb(hex) { return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; }
  function hex(a) { return '#'+a.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join(''); }
  function lab(a) {
    const [r,g,b]=a.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
    const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b), m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b), s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
    return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
  }
  const distance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;
  function nearest(v,p) { let best=0,d=Infinity; for(let i=0;i<p.length;i++){const x=distance(v,p[i]); if(x<d){d=x;best=i;}} return best; }
  function quantize(samples,maxColors) {
    const hist=new Map();
    for(const a of samples) { const k=a.map(v=>Math.round(v/8)*8).join(','); if(hist.has(k)) {const h=hist.get(k);h.n++;for(let j=0;j<3;j++)h.sum[j]+=a[j];} else hist.set(k,{n:1,sum:a.slice()}); }
    const points=[...hist.values()].map(h=>({n:h.n,rgb:h.sum.map(v=>v/h.n)})).map(h=>({...h,lab:lab(h.rgb)}));
    points.sort((a,b)=>b.n-a.n);
    const centers=[points[0].lab.slice()];
    while(centers.length<Math.min(maxColors,points.length)) {
      let best=null,score=-1;for(const p of points){const d=Math.min(...centers.map(c=>distance(p.lab,c)));const sc=d*Math.pow(p.n,.28);if(sc>score){score=sc;best=p;}}
      if(score<1e-9)break; centers.push(best.lab.slice());
    }
    let sums;
    for(let round=0;round<14;round++) {
      sums=centers.map(()=>({n:0,lab:[0,0,0],rgb:[0,0,0]}));
      for(const p of points){const z=sums[nearest(p.lab,centers)];z.n+=p.n;for(let j=0;j<3;j++){z.lab[j]+=p.lab[j]*p.n;z.rgb[j]+=p.rgb[j]*p.n;}}
      for(let i=0;i<centers.length;i++) if(sums[i].n) centers[i]=sums[i].lab.map(v=>v/sums[i].n);
    }
    const palette=[...new Set(sums.filter(s=>s.n).map(s=>hex(s.rgb.map(v=>v/s.n))))].sort((a,b)=>lab(rgb(b))[0]-lab(rgb(a))[0]);
    const pl=palette.map(p=>lab(rgb(p)));const colors=samples.map(s=>nearest(lab(s),pl));
    return {palette,colors};
  }
  function simplify(g,colors,palette) {
    const out=colors.slice(),idx=new Map(g.nodes.map((n,i)=>[n.id,i])), labs=palette.map(p=>lab(rgb(p)));
    for(let i=0;i<colors.length;i++) {
      const ns=[...g.neighbors.get(g.nodes[i].id)].map(id=>colors[idx.get(id)]); if(ns.includes(colors[i])||ns.length<2)continue;
      const counts=new Map();for(const c of ns)counts.set(c,(counts.get(c)||0)+1);
      const top=[...counts].sort((a,b)=>b[1]-a[1])[0];
      if(top[1]/ns.length>=.6 && distance(labs[colors[i]],labs[top[0]])<.035) out[i]=top[0];
    }
    return out;
  }
  function accents(g,colors) {
    const idx=new Map(g.nodes.map((n,i)=>[n.id,i]));
    return colors.reduce((n,c,i)=>n+([...g.neighbors.get(g.nodes[i].id)].every(id=>colors[idx.get(id)]!==c)?1:0),0);
  }
  function runs(ids,g,colors) {
    const idx=new Map(g.nodes.map((n,i)=>[n.id,i])), out=[];
    for(const id of ids) { const c=colors[idx.get(id)];if(out.length&&out[out.length-1].color===c) out[out.length-1].count++; else out.push({color:c,count:1}); }
    return out;
  }
  root.BeadEngine={geometry,steps,validate,quantize,simplify,accents,runs,rgb,hex,lab,nearest,distance,code,clamp};
})(typeof window!=='undefined'?window:globalThis);
