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
 getBoundingClientRect(){return {left:0,right:1000,top:0,bottom:1000,width:1000,height:1000};}
 getContext(type){if(this.tagName!=='CANVAS')throw Error('Not a canvas');if(!this.canvas)this.canvas=createCanvas(+this.width||320,+this.height||320);if(this.canvas.width!==+this.width)this.canvas.width=+this.width;if(this.canvas.height!==+this.height)this.canvas.height=+this.height;return this.canvas.getContext(type);}
}
function parse(s,parent){const stack=[parent],rx=/<\/?([a-zA-Z][\w-]*)([^>]*?)\/?\s*>/g;let m;while(m=rx.exec(s)){const full=m[0],tag=m[1].toLowerCase();if(full.startsWith('</')){if(stack.length>1)stack.pop();continue;}const attrs={};const ar=/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let a;while(a=ar.exec(m[2]))attrs[a[1]]=decode(a[2]??a[3]??a[4]??'');const n=new Element(tag,attrs);stack[stack.length-1].append(n);if(!/^(img|input|br|hr|meta|link|path|rect|stop)$/.test(tag)&&!full.endsWith('/>'))stack.push(n);}}
const root=new Element('document');parse(fs.readFileSync(path.join(__dirname,'..','shell.html'),'utf8').replace('<!--VOLUME_HTML-->',fs.readFileSync(path.join(__dirname,'..','volume-shell.html'),'utf8')),root);
class BrowserImage extends NativeImage {set src(v){if(typeof v==='string'&&v.startsWith('data:image/svg+xml;charset=utf-8,'))super.src=Buffer.from(decodeURIComponent(v.split(',').slice(1).join(',')));else if(typeof v==='string'&&v.startsWith('blob:'))fetch(v).then(r=>r.arrayBuffer()).then(b=>{super.src=Buffer.from(b);});else super.src=v;}get src(){return super.src;}}
global.Image=BrowserImage;global.window=globalThis;
global.addEventListener=()=>{};global.print=()=>{};global.requestAnimationFrame=fn=>setTimeout(fn,0);
global.document={getElementById:id=>ids.get(id)||null,querySelectorAll:q=>root.querySelectorAll(q),addEventListener:()=>{},body:root,activeElement:{tagName:'BODY'},createElement:tag=>{if(tag==='canvas'){const cv=createCanvas(1,1);cv.toBlob=fn=>cv.encode('png').then(b=>fn(new Blob([b],{type:'image/png'})));return cv;}return new Element(tag);}};
const realTimer=global.setTimeout;global.setTimeout=(fn,t,...a)=>{const id=realTimer(fn,t,...a);if(t>1000)id.unref();return id;};
require('../engine.js');vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),{filename:'app.js'});
const wait=ms=>new Promise(r=>realTimer(r,ms));
async function until(fn){for(let i=0;i<100;i++){if(fn())return;await wait(20);}throw Error('App initialization did not finish: '+ids.get('toast').textContent);}

require('../shape-engine.js');require('../volume-engine.js');require('../thread-diagram.js');require('../stage-guide.js');require('../parts-engine.js');require('../continuous-thread.js');vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..','volume-app.js'),'utf8'),{filename:'volume-app.js'});

vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..','creator-app.js'),'utf8'),{filename:'creator-app.js'});
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..','connection-app.js'),'utf8'),{filename:'connection-app.js'});
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..','parts-app.js'),'utf8'),{filename:'parts-app.js'});
module.exports={ids,root,wait,until,createCanvas,sharp};
