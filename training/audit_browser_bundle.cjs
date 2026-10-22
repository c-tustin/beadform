// Verify the generated single-file app contains the saved source modules.
const fs=require('node:fs'),vm=require('node:vm');
const args=process.argv.slice(2),output=args[args.indexOf('--output')+1];if(!args.includes('--output')||fs.existsSync(output))throw Error('Choose a new output.');
const build=fs.readFileSync('build.py','utf8'),html=fs.readFileSync('beadform.html','utf8'),modules=[...build.matchAll(/\('([A-Z_]+)','([^']+\.(?:js|css))'\)/g)].map(m=>({label:m[1],path:m[2]}));
if(modules.length<25)throw Error('Build module inventory is incomplete.');
const craftNames=['frog','caterpillar','blue-lizard','jellyfish','starfish','crocodile'];
const craftExpression="['frog','caterpillar','blue-lizard','jellyfish','starfish','crocodile'].map(name=>({name,src:'assets/'+name+'.webp'}))";
const embedded='['+craftNames.map(name=>'{"name": '+JSON.stringify(name)+', "src": '+JSON.stringify('data:image/webp;base64,'+fs.readFileSync('assets/'+name+'.webp').toString('base64'))+'}').join(', ')+']';
const snapshot=require('./evaluation_provenance.cjs').capture(['build.py','shell.html','beadform.html',...modules.map(m=>m.path),...craftNames.map(n=>'assets/'+n+'.webp'),'training/audit_browser_bundle.cjs']);
const checks=modules.map(m=>({...m,sourceIncluded:html.includes(fs.readFileSync(m.path,'utf8').replace(craftExpression,embedded)),placeholderRemoved:!html.includes('/*'+m.label+'*/')}));
if(checks.some(m=>!m.sourceIncluded||!m.placeholderRemoved))throw Error('Browser bundle does not contain current source modules.');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];if(!scripts.length)throw Error('No bundled scripts.');for(const [i,m]of scripts.entries())new vm.Script(m[1],{filename:'beadform.html:inline-'+i});
snapshot.assertUnchanged();const result={note:'Source inclusion and script syntax only. This does not cover all browser interactions or physical construction.',modules:checks,scriptsParsed:scripts.length,sourceSha256:snapshot.hashes};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({modules:checks.length,allCurrentSourcesIncluded:true,scriptsParsed:scripts.length}));
