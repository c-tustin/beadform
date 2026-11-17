const $=id=>document.getElementById(id);
let step=0;
function show(id){for(const name of ['create','patterns','model','guide'])$(name).hidden=name!==id;for(const b of document.querySelectorAll('nav button')){if(b.dataset.tab===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}window.scrollTo(0,0);if(id==='patterns')renderSaved();}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>show(b.dataset.tab);
const rows=Array.from({length:4},(_,r)=>Array.from({length:6-r},(_,i)=>`B${r+1}-${i+1}`));
const steps=[['Ladder foundation',['Pick up B1-1 and B1-2.','Pass through B1-1, then B1-2.',...rows[0].slice(2).map((id,i)=>`Pick up ${id}; pass through ${rows[0][i+1]}, then ${id}.`)]]];
for(let r=1;r<4;r++){const ids=rows[r],a=rows[r-1].slice().reverse();steps.push([`Brick row ${r+1}`,[`Pick up ${ids[0]} and ${ids[1]}.`,`Go under the existing thread bridge between ${a[1]} and ${a[2]}; pass through ${ids[1]}, then ${ids[0]}, then ${ids[1]}.`,...ids.slice(2).map((id,j)=>`Pick up ${id}; go under the bridge between ${a[j+2]} and ${a[j+3]}; pass through ${id}.`)]]);}
function render(){ $('stepLabel').textContent=`Step ${step+1} of 4`;$('stepTitle').textContent=steps[step][0];$('back').disabled=step===0;$('next').disabled=step===3;$('instructions').replaceChildren(...steps[step][1].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));$('beads').innerHTML=rows.map((row,r)=>`<div class="bead-row">${row.map(id=>`<span class="bead ${r<=step?'active':''}" title="${id}"></span>`).join('')}</div>`).join('');}
document.querySelector('.brand').onclick=e=>{e.preventDefault();show('create');};
$('sample').onclick=()=>{step=0;render();show('guide');};$('back').onclick=()=>{step--;render();};$('next').onclick=()=>{step++;render();};
$('save').onclick=()=>{try{localStorage.setItem('beadform-mobile-sample','1');$('saveStatus').textContent='Saved on this device.';}catch{$('saveStatus').textContent='Storage unavailable. This browser could not save the sample.';}};
function renderSaved(){let saved=false;try{saved=localStorage.getItem('beadform-mobile-sample')==='1';}catch{}$('noPatterns').hidden=saved;$('savedList').replaceChildren();if(saved){const button=document.createElement('button');button.className='sample';button.textContent='Little brick triangle · 18 beads →';button.onclick=()=>{render();show('guide');};$('savedList').append(button);}}
render();
