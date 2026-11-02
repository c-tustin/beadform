// Exhaustive digital inventory/order audit of the bounded block generator.
const fs=require('node:fs'),crypto=require('node:crypto'),Craw=require('../craw-block.js');
const args=process.argv.slice(2),i=args.indexOf('--output');if(i<0||!args[i+1])throw Error('Use --output new-report.json');const output=args[i+1];if(fs.existsSync(output))throw Error('Preserve previous evidence.');
const cases=[];let orders=0;
for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++){
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
  const m=Craw.block(a,b,c,{entrySide:[x,y,z]}),expected=a*(b+1)*(c+1)+b*(a+1)*(c+1)+c*(a+1)*(b+1),faces=new Set(),coordinates=new Set();
  if(m.edges.length!==expected||new Set(m.edges.map(e=>e.slice().sort((a,b)=>a-b).join(','))).size!==expected)throw Error('Wrong edge inventory.');
  if(m.f.length!==a*b*(c+1)+a*c*(b+1)+b*c*(a+1))throw Error('Wrong shared face inventory.');
  if(m.cells.length!==a*b*c)throw Error('Wrong cube inventory.');
  for(const [i,cell]of m.cells.entries()){
   if(cell.index!==i||coordinates.has(cell.coordinate.join(',')))throw Error('Repeated or unordered cube.');coordinates.add(cell.coordinate.join(','));
   if(i&&!cell.faces.some(f=>faces.has(f)))throw Error('Cube does not share a built face.');cell.faces.forEach(f=>faces.add(f));
  }
  if(m.cells[0].coordinate.some((v,i)=>v!==([x,y,z][i]>0?[a,b,c][i]-1:0)))throw Error('Wrong parent-facing entry corner.');
  for(const face of m.f){if(new Set(face).size!==4)throw Error('Degenerate square face.');for(let j=0;j<4;j++){const p=m.v[face[j]],q=m.v[face[(j+1)%4]];if(Math.abs(Math.hypot(...p.map((v,i)=>v-q[i]))-Math.SQRT2*2.05)>1e-7)throw Error('Non-unit face edge.');}}
  orders++;
 }
 cases.push({dimensions:[a,b,c],beads:Craw.count(a,b,c),cubes:a*b*c,entryOrdersAudited:8});
}
const report={summary:{dimensionCases:cases.length,entryOrders:orders,unitCubeBeads:Craw.count(1,1,1),twoCubeRowBeads:Craw.count(2,1,1),rowIncrement:Craw.count(2,1,1)-Craw.count(1,1,1),physicallyTested:0,note:'Exact edge/face inventories and face-connected cube orders only; not an audit of physical thread tension or joint strength.'},sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(require('node:path').join(__dirname,'../craw-block.js'))).digest('hex'),cases};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary,null,2));
