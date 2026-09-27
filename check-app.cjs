// Local DOM/canvas smoke harness. This does not replace a real browser test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const sharp=require('sharp');
const ids=new Map();
function decode(s){return s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');}
class Element {
 constructor(tag,attrs={}) {this.tagName=tag.toUpperCase();this.attributes=attrs;this.children=[];this.listeners={};this.style={};this.parentNode=null;this.dataset={};this.value=attrs.value||'';this.checked='checked'in attrs;this.disabled='disabled'in attrs;this.open=false;this._text='';this._html='';this.classSet=new Set((attrs.class||'').split(/\s+/).filter(Boolean));this.classList={add:(...a)=>a.forEach(x=>this.classSet.add(x)),remove:(...a)=>a.forEach(x=>this.classSet.delete(x)),contains:a=>this.classSet.has(a),toggle:(a,v)=>{const on=v===undefined?!this.classSet.has(a):v;if(on)this.classSet.add(a);else this.classSet.delete(a);return on;}};for(const [k,v]of Object.entries(attrs)){if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;else this[k]=v;}if(attrs.id)ids.set(attrs.id,this);}
 set innerHTML(s){this.children.forEach(n=>n.removeIds());this.children=[];this._html=s;parse(s,this);}
 get innerHTML(){return this._html;}
 set textContent(v){this._text=String(v);}
 get textContent(){return this._text;}
 removeIds(){if(this.id&&ids.get(this.id)===this)ids.delete(this.id);this.children.forEach(n=>n.removeIds());}
 matches(q){if(q.startsWith('.'))return this.classSet.has(q.slice(1));const a=q.match(/^\[([^\]=]+)(?:="([^"]*)")?\]$/);if(a)return a[1]in this.attributes&&(a[2]===undefined||this.attributes[a[1]]===a[2]);return this.tagName.toLowerCase()===q;}
 querySelectorAll(q){const a=[];for(const c of this.children){if(c.matches(q))a.push(c);a.push(...c.querySelectorAll(q));}return a;}
 closest(q){return this.matches(q)?this:this.parentNode?.closest(q)||null;}
 append(child){child.parentNode=this;this.children.push(child);}
 appendChild(child){this.append(child);return child;}
 remove(){this.removeIds();if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 getAttribute(k){return this.attributes[k];}
 insertAdjacentHTML(where,s){this._html+=s;parse(s,this);}
 addEventListener(t,fn){(this.listeners[t]||=[]).push(fn);}
 async event(t,props={}){const e={target:this,button:0,preventDefault(){},...props};if(this['on'+t])await this['on'+t](e);for(const fn of this.listeners[t]||[])await fn(e);}
 click(){return this.event('click');}
 showModal(){this.open=true;}
 close(){this.open=false;for(const fn of this.listeners.close||[])fn();}
 getBoundingClientRect(){return {left:0,right:1000,top:0,bottom:1000};}
}
function parse(s,parent){const stack=[parent],rx=/<\/?([a-zA-Z][\w-]*)([^>]*?)\/?\s*>/g;let m;while(m=rx.exec(s)){const full=m[0],tag=m[1].toLowerCase();if(full.startsWith('</')){if(stack.length>1)stack.pop();continue;}const attrs={};const ar=/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let a;while(a=ar.exec(m[2]))attrs[a[1]]=decode(a[2]??a[3]??a[4]??'');const n=new Element(tag,attrs);stack[stack.length-1].append(n);if(!/^(img|input|br|hr|meta|link|path|rect|stop)$/.test(tag)&&!full.endsWith('/>'))stack.push(n);}}
const root=new Element('document');parse(fs.readFileSync(path.join(__dirname,'shell.html'),'utf8').replace('<!--VOLUME_HTML-->',fs.readFileSync(path.join(__dirname,'volume-shell.html'),'utf8')),root);
class BrowserImage extends NativeImage {set src(v){if(typeof v==='string'&&v.startsWith('data:image/svg+xml;charset=utf-8,'))super.src=Buffer.from(decodeURIComponent(v.split(',').slice(1).join(',')));else if(typeof v==='string'&&v.startsWith('blob:'))fetch(v).then(r=>r.arrayBuffer()).then(b=>{super.src=Buffer.from(b);});else super.src=v;}get src(){return super.src;}}
global.Image=BrowserImage;global.window=globalThis;
global.addEventListener=()=>{};global.print=()=>{};
global.document={getElementById:id=>ids.get(id)||null,querySelectorAll:q=>root.querySelectorAll(q),addEventListener:()=>{},body:root,activeElement:{tagName:'BODY'},createElement:tag=>{if(tag==='canvas'){const cv=createCanvas(1,1);cv.toBlob=fn=>cv.encode('png').then(b=>fn(new Blob([b],{type:'image/png'})));return cv;}return new Element(tag);}};
const realTimer=global.setTimeout;global.setTimeout=(fn,t,...a)=>{const id=realTimer(fn,t,...a);if(t>1000)id.unref();return id;};
require('./engine.js');vm.runInThisContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),{filename:'app.js'});
const wait=ms=>new Promise(r=>realTimer(r,ms));
async function until(fn){for(let i=0;i<100;i++){if(fn())return;await wait(20);}throw Error('App initialization did not finish: '+ids.get('toast').textContent);}
(async()=>{
 await until(()=>global.Beadform?.state.geometry);
 const B=global.Beadform,$=id=>ids.get(id),s=B.state;
 assert.equal(s.geometry.nodes.length,1120);assert.equal(s.validation.valid,true);assert.ok(s.palette.length<=6);assert.ok(s.colors.every(v=>Number.isInteger(v)));
 assert.equal($('totalBeads').textContent,'1,120');
 const sampleCanvas=createCanvas(300,220),sampleCtx=sampleCanvas.getContext('2d');sampleCtx.fillStyle='#ce7846';sampleCtx.fillRect(70,30,170,160);const uploadFile=new File([sampleCanvas.toBuffer('image/png')],'shape.png',{type:'image/png'});await $('fileInput').event('change',{target:{files:[uploadFile]}});await until(()=>s.sourceName==='shape.png');assert.equal(s.validation.valid,true);
 await root.querySelectorAll('.sample').find(e=>e.dataset.sample==='fox').click();await until(()=>s.sourceName==='Woodland fox');
 fs.writeFileSync(path.join(__dirname,'fox-pattern.svg'),B.exportSVG().svg);
 await sharp(Buffer.from(B.exportSVG().svg)).resize({width:1100}).png().toFile(path.join(__dirname,'fox-pattern.png'));
 await $('symbolsView').click();assert.equal(s.view,'symbols');assert.ok($('patternStage').innerHTML.includes('dominant-baseline'));
 const before=s.colors.slice();await $('paintTool').click();s.activeColor=(s.colors[0]+1)%s.palette.length;
 const bead=$('patternStage').querySelectorAll('[data-bead]')[0];await $('patternStage').event('pointerdown',{target:bead});assert.notDeepEqual(s.colors,before);assert.equal(s.edits,true);
 await $('undoBtn').click();assert.deepEqual(s.colors,before);assert.equal(s.edits,false);
 $('width').value='41';await $('width').event('change');assert.equal(s.settings.width,42);assert.equal(s.geometry.C,42);
 await root.querySelectorAll('[data-stitch]').find(e=>e.dataset.stitch==='raw').click();assert.equal(s.geometry.nodes.length,544);assert.equal(s.validation.valid,true);assert.equal(s.guide[0].ids.length,4);assert.equal(s.guide[17].ids.length,2);
 B.goStep(18);$('highlight').checked=true;await $('highlight').event('change');assert.ok($('patternStage').innerHTML.includes('opacity="0.18"'));
 const t=B.textGuide();assert.ok(t.includes('PICK H2-1'));assert.ok(t.includes('Move through:'));assert.equal(B.csv().split('\r\n').length,545);
 fs.writeFileSync(path.join(__dirname,'raw-pattern.svg'),B.exportSVG().svg);
 await sharp(Buffer.from(B.exportSVG().svg)).resize({width:1100}).png().toFile(path.join(__dirname,'raw-pattern.png'));
 const project={format:'beadform-project',version:1,dimension:'flat',settings:s.settings,sourceData:s.sourceData,sourceName:'test fox',title:'<img src=x onerror=alert(1)>',palette:s.palette.slice(),colors:s.colors.slice(),step:18,manualEdits:true};project.colors[0]=(project.colors[0]+1)%project.palette.length;
 await B.importProject({size:50000,text:async()=>JSON.stringify(project)});assert.equal(s.colors[0],project.colors[0]);assert.equal(s.step,18);assert.equal($('projectTitle').value,project.title);assert.ok(!B.exportSVG().svg.includes('<img src=x'));
 const prior=s.colors.slice();await B.importProject({size:50000,text:async()=>JSON.stringify({...project,colors:[999]})});assert.deepEqual(s.colors,prior);assert.ok($('toast').textContent.includes('Every bead'));
 s.edits=false;await root.querySelectorAll('[data-stitch]').find(e=>e.dataset.stitch==='square').click();assert.equal(s.geometry.nodes.length,1080);assert.equal(s.validation.valid,true);assert.ok(B.textGuide().includes('Row 2 — Right → left'));
 await $('exportBtn').click();assert.equal($('modal').open,true);assert.ok($('downloadSvg'));await $('downloadPng').click();assert.equal($('toast').textContent,'Your download is ready.');
 s.settings.width=80;s.settings.rows=80;B.generate();B.printPattern();assert.ok($('printArea').innerHTML.includes('Chart tile'));assert.ok($('printArea').innerHTML.includes('Construction guide'));
 await $('helpBtn').click();assert.ok($('modalBody').innerHTML.includes('3D'));
 console.log('App DOM/canvas smoke checks passed: initialization, image conversion, painting, undo, even-count correction, stitch switching, highlighting, valid/invalid project import, escaped export titles, CSV, PNG/SVG generation, print tiles, and 3D roadmap.');
})().catch(e=>{console.error(e);process.exitCode=1;});
