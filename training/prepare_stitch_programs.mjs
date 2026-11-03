import {compileRecipe} from '../stitch-programs.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const families=['peyote','brick','ladder','raw','square'],rows=[],unknown={stitch:'unknown',shape:'unknown',width:0,rows:0};
const features={peyote:'dense staggered flat fabric with even-count construction',brick:'flat triangular silhouette with a changing outline, attached through thread bridges',ladder:'single narrow foundation strip of adjacent bead loops',raw:'open rectangular fabric built from connected four-bead right-angle units',square:'flat rectangular chart with aligned bead columns rather than staggered columns'};
const examples={train:[[4,2],[4,3],[4,4],[6,2],[6,3],[6,4],[8,2],[8,3],[8,4],[10,2],[10,3],[10,4]],dev:[[6,5],[8,5]],challenge:[[8,6],[10,5],[10,6]]};
for(const split of Object.keys(examples))for(const stitch of families)for(let k=0;k<examples[split].length;k++){
 let [width,n]=examples[split][k];if(stitch==='brick'&&n>width-1)continue;
 const recipe={stitch,shape:stitch==='brick'?'triangle':stitch==='ladder'?'strip':'rectangle',width,rows:stitch==='ladder'?1:n};
 // Ladder rows are always one; give each split distinct widths, then deduplicate.
 if(stitch==='ladder'){recipe.width=split==='train'?[2,3,4,5,6,7][k%6]:split==='dev'?9:11;}
 const pattern=compileRecipe(recipe);if(pattern.passagePreference.exceptions.length)continue;
 const dimensions=stitch==='ladder'?`${recipe.width} beads in one row`:stitch==='peyote'?`${width} beads in the starter string (the first two interleaved rows), ${n} rows total`:stitch==='raw'?`${width} units across and ${n} units high`:`${width} beads across the foundation and ${n} rows total`;
 const variants=split==='train'?[
 `Choose the stitch and create one ${features[stitch]}. Use ${dimensions}.`,
 `I need a ${features[stitch]}; plan ${dimensions}. Return a single bounded draft recipe.`,
 `For this swatch, use ${dimensions}. Its construction needs ${features[stitch]}.`
 ]:split==='dev'?[
 `Plan a sample of ${features[stitch]}, measuring ${dimensions}.`,
 `Which supported draft stitch fits ${features[stitch]}? Make the recipe for ${dimensions}.`
 ]:[
 `My specification is ${dimensions}. I want ${features[stitch]}. Produce its recipe.`,
 `Turn this requirement into one draft swatch: ${features[stitch]}; ${dimensions}.`
 ];
 for(let v=0;v<variants.length;v++){
  if(rows.some(r=>r.split===split&&r.prompt===variants[v]))continue;
  rows.push({id:`${split}-${stitch}-${k}-${v}`,split,prompt:variants[v],recipe,label_source:'authored-synthetic',user_reviewed:false,physical_success:null,bead_count:pattern.beadCount,maximum_assembly_passes:pattern.passagePreference.maximumAssemblyPasses,finishing_planned:false});
 }
}
const negatives={train:['Make a whole three-dimensional dragon.','A closed peyote ball with a joint.','A tubular brick bangle.','Choose a random object; I have no dimensions.','A tube in herringbone stitch.','A netted bottle covering.','A CRAW sculpture with three detachable limbs.','A fish and a turtle, separate patterns.','A flat peyote starter with five beads.','A ladder sheet with three rows.','Brick triangle, four foundation beads and six rows.','A square grid 100 beads wide.','A drawing of an unspecified animal.','Make a pattern but do not specify its size.','An odd-count peyote strip.','A mixed brick and CRAW animal.'],dev:['A round stuffed teddy-bear sculpture.','A ladder tube.','An even peyote strip with seven starter beads.','A detailed rocket without dimensions.'],challenge:['A seamless circular peyote sphere.','A brick tube with six beads around.','Three separate swatches in one recipe.','A square grid with 200 rows.','Pick a technique for my idea; no shape or dimensions supplied.']};
for(const [split,prompts] of Object.entries(negatives))for(let i=0;i<prompts.length;i++)rows.push({id:`${split}-reject-${i}`,split,prompt:prompts[i],recipe:unknown,label_source:'authored-synthetic',user_reviewed:false,physical_success:null,bead_count:0,maximum_assembly_passes:null,finishing_planned:false});
const normal=s=>s.toLowerCase().replace(/\W+/g,' ').trim();if(new Set(rows.map(r=>normal(r.prompt))).size!==rows.length)throw Error('Duplicate prompt.');
const recipeSets=Object.fromEntries(Object.keys(examples).map(split=>[split,new Set(rows.filter(r=>r.split===split&&r.recipe.stitch!=='unknown').map(r=>JSON.stringify(r.recipe)))]));
for(const a of Object.keys(recipeSets))for(const b of Object.keys(recipeSets))if(a!==b&&[...recipeSets[a]].some(r=>recipeSets[b].has(r)))throw Error('Recipe crosses frozen split boundaries.');
writeFileSync(new URL('./stitch-program-v1/examples.jsonl',import.meta.url),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
const provenance={created:'2026-11-03',splits:Object.fromEntries(['train','dev','challenge'].map(s=>[s,rows.filter(r=>r.split===s).length])),compilerSha256:createHash('sha256').update(readFileSync(new URL('../stitch-programs.mjs',import.meta.url))).digest('hex'),engineSha256:createHash('sha256').update(readFileSync(new URL('../engine.js',import.meta.url))).digest('hex'),scope:'Single flat draft swatches in five stitches, not complete 3D designs. All assembly routes compiled and counted before training. No finishes or physical success labels.',promotion:false};
writeFileSync(new URL('./stitch-program-v1/provenance.json',import.meta.url),JSON.stringify(provenance,null,2)+'\n');console.log(JSON.stringify(provenance));
