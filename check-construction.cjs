const assert=require('node:assert/strict');require('./shape-engine.js');const P=require('./parts-engine.js'),G=require('./construction-graph.js');
const g=P.build(P.example('frog')),graph=g.constructionGraph;
assert.equal(graph.beadCount,116);assert.equal(graph.parts.length,7);assert.equal(graph.joints.length,6);assert.equal(graph.checks.valid,true);assert.ok(graph.joints.every(j=>j.status==='draft'));assert.ok(graph.parts.some(p=>p.technique==='circular-peyote'&&p.rounds.reduce((n,r)=>n+r.newBeads,0)===100));
const bad=structuredClone(graph);bad.joints[0].type='invented';assert.equal(G.validate(g,bad).valid,false);
const wrong=structuredClone(graph);wrong.joints[0].anchors[0].parent=wrong.joints[0].anchors[0].child;assert.equal(G.validate(g,wrong).valid,false);
const pair=graph.joints[0].anchors[0],node=g.byId.get(pair.child),old=node.p;node.p=[999,999,999];assert.ok(G.validate(g,graph).errors.includes('unsupported thread span'));node.p=old;
const joint=g.joins[0],ops=joint.operations;joint.operations=[];assert.ok(G.validate(g,graph).errors.includes('missing joint reinforcement'));joint.operations=ops;
assert.ok(G.validate(g,graph).valid);console.log('Construction graph checks passed: exact inventory, typed joints, draft status, invalid anchors, spans and reinforcement.');
