(function(root){
'use strict';
// Candidate weave-in routes only. Three distinct beads is an explicit search
// heuristic, not a tested knot or proof that a fishing-line finish will hold.
function propose(g,{minimumBeads=3,maxStates=4000}={}){
 if(!Number.isInteger(minimumBeads)||minimumBeads<1||minimumBeads>8)throw Error('Finishing search requires 1–8 distinct beads.');
 if(!Number.isInteger(maxStates)||maxStates<1||maxStates>100000)throw Error('Finishing search requires a bounded state budget.');
 const operations=g.stages.flatMap(st=>st.operations),sections=new Map(),adj=new Map(),bridges=new Map();
 for(const n of g.nodes)for(const port of n.ends){if(!adj.has(port))adj.set(port,[]);adj.get(port).push(n.id);}
 const connect=(a,b)=>{if(a===b)return;if(!bridges.has(a))bridges.set(a,new Set());if(!bridges.has(b))bridges.set(b,new Set());bridges.get(a).add(b);bridges.get(b).add(a);};
 let previous=null;
 for(const o of operations){
  if(!sections.has(o.section))sections.set(o.section,[]);sections.get(o.section).push(o);
  if(previous&&previous.section===o.section&&!o.newThread&&previous.to!==o.from)connect(previous.to,o.from);
  previous=o;
 }
 const ends=[...sections].flatMap(([section,ops])=>[
  {id:'length-'+section+'-tail',section,end:'starting-tail',port:ops[0].from,bead:ops[0].id},
  {id:'length-'+section+'-working',section,end:'working-end',port:ops.at(-1).to,bead:ops.at(-1).id}
 ]),counts=new Map(g.counts),results=[];
 function search(end){
  const originPart=g.byId.get(end.bead).component,queue=[{port:end.port,used:new Set(),moves:[],bridge:false,cost:0}],candidates=[];let visited=0;
  while(queue.length&&visited<maxStates){
   queue.sort((a,b)=>a.cost-b.cost);const state=queue.shift();visited++;
   if(state.used.size===minimumBeads){candidates.push(state);if(candidates.length>=12)break;continue;}
   for(const id of adj.get(state.port)||[]){
    if(state.used.has(id)||(counts.get(id)||0)>=g.passLimit)continue;
    const n=g.byId.get(id),to=n.ends[0]===state.port?n.ends[1]:n.ends[0];
    queue.push({port:to,used:new Set([...state.used,id]),moves:[...state.moves,{id,from:state.port,to,kind:'pass',phase:'finish'}],bridge:false,
     cost:state.cost+1+(counts.get(id)||0)/g.passLimit+(n.component===originPart?0:4)});
   }
   if(!state.bridge)for(const to of bridges.get(state.port)||[]){
    // A bridge must be followed by a bead passage, never another bridge.
    queue.push({port:to,used:state.used,moves:[...state.moves,{id:null,from:state.port,to,kind:'existing-connection'}],bridge:true,cost:state.cost+.1});
   }
  }
  return {route:candidates.sort((a,b)=>a.cost-b.cost)[0],candidateCount:candidates.length,visited,limitReached:visited>=maxStates};
 }
 // More constrained ends reserve their candidate first. The greedy allocation
 // may miss a joint solution; an unresolved end is never labelled impossible.
 let pending=ends.slice();
 while(pending.length){
  const options=pending.map(end=>({end,...search(end)}));
  options.sort((a,b)=>a.candidateCount-b.candidateCount||a.end.id.localeCompare(b.end.id));
  const choice=options[0];pending=pending.filter(e=>e.id!==choice.end.id);
  if(choice.route)for(const id of choice.route.used)counts.set(id,counts.get(id)+1);
  results.push({...choice.end,status:choice.route?'candidate':'unresolved',moves:choice.route?.moves||[],visitedStates:choice.visited,searchLimitReached:choice.limitReached});
 }
 const added=g.nodes.filter(n=>counts.get(n.id)!==g.counts.get(n.id)).map(n=>({id:n.id,assemblyPasses:g.counts.get(n.id),finishingPasses:counts.get(n.id)-g.counts.get(n.id),totalPasses:counts.get(n.id)}));
 const result={format:'beadform-finishing-candidates',version:1,status:'draft',minimumDistinctBeads:minimumBeads,
  endpoints:results,candidateEndpoints:results.filter(r=>r.status==='candidate').length,totalEndpoints:ends.length,
  assemblyMaxPasses:g.maxPasses,proposedMaxPasses:Math.max(...counts.values()),passLimit:g.passLimit,additionalPasses:added,
  completeFinish:false,knotMethod:null,physicalSampleRequired:true,
  note:'Routes use only existing bead holes and observed assembly connections. Counts include all proposed routes together. Search is bounded and greedy. Knot choice, tension, hole access and holding strength remain unverified.'};
 result.checks=validate(g,result);if(!result.checks.valid)throw Error(result.checks.errors.join('; '));return result;
}
function validate(g,proposal){
 const ops=g.stages.flatMap(st=>st.operations),sections=new Map(),connections=new Set(),errors=[],counts=new Map(g.counts);
 const key=(a,b)=>JSON.stringify([a,b]);let previous=null;
 for(const o of ops){if(!sections.has(o.section))sections.set(o.section,[]);sections.get(o.section).push(o);if(previous&&previous.section===o.section&&!o.newThread&&previous.to!==o.from){connections.add(key(previous.to,o.from));connections.add(key(o.from,previous.to));}previous=o;}
 const expected=new Map([...sections].flatMap(([section,moves])=>[['length-'+section+'-tail',{port:moves[0].from,bead:moves[0].id}],['length-'+section+'-working',{port:moves.at(-1).to,bead:moves.at(-1).id}]])),seen=new Set();
 for(const end of proposal.endpoints){
  const original=expected.get(end.id);if(!original||seen.has(end.id)||original.port!==end.port||original.bead!==end.bead){errors.push('wrong or repeated thread endpoint');continue;}seen.add(end.id);
  if(end.status!=='candidate'){if(end.status!=='unresolved'||end.moves.length)errors.push('invalid unresolved route');continue;}
  let cursor=end.port,bridge=false;const used=new Set();
  for(const move of end.moves){
   if(move.from!==cursor)errors.push('disconnected finishing route');
   if(move.id===null){if(bridge||!connections.has(key(move.from,move.to)))errors.push('unobserved or chained finishing connection');bridge=true;}
   else{const bead=g.byId.get(move.id);if(!bead||used.has(move.id)||move.from===move.to||!bead.ends.includes(move.from)||!bead.ends.includes(move.to))errors.push('invalid finishing hole traversal');else{counts.set(move.id,counts.get(move.id)+1);used.add(move.id);}bridge=false;}
   cursor=move.to;
  }
  if(bridge||used.size!==proposal.minimumDistinctBeads)errors.push('incomplete finishing candidate');
 }
 if(seen.size!==expected.size)errors.push('missing thread endpoints');
 if([...counts.values()].some(n=>n>g.passLimit))errors.push('combined assembly and finishing passage budget exceeded');
 const added=new Map(proposal.additionalPasses.map(n=>[n.id,n]));
 if(added.size!==proposal.additionalPasses.length||[...added].some(([id])=>!g.byId.has(id)||counts.get(id)===g.counts.get(id)))errors.push('unexpected finishing inventory entry');
 for(const n of g.nodes){const record=added.get(n.id),extra=counts.get(n.id)-g.counts.get(n.id);if(extra>0&&(!record||record.assemblyPasses!==g.counts.get(n.id)||record.finishingPasses!==extra||record.totalPasses!==counts.get(n.id)))errors.push('incorrect finishing inventory');}
 if(proposal.proposedMaxPasses!==Math.max(...counts.values()))errors.push('incorrect finishing maximum');
 if(proposal.totalEndpoints!==expected.size||proposal.candidateEndpoints!==proposal.endpoints.filter(e=>e.status==='candidate').length)errors.push('incorrect finishing endpoint total');
 return {valid:!errors.length,errors:[...new Set(errors)],physicalSampleRequired:true};
}
root.BeadFinishing={propose,validate};if(typeof module!=='undefined')module.exports=root.BeadFinishing;
})(typeof window!=='undefined'?window:globalThis);
