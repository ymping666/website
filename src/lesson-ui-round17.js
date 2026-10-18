import {betaPresets,betaTrace,alphaPresets,alphaTrace,noisePresets,noiseTrace,swigluPresets,swigluTrace,maskPresets,maskTrace} from './lesson-round17-math.mjs';
import {renderBeta,renderAlpha,renderNoise,renderSwiglu,renderMask} from './lesson-round17-view.mjs';
export function mountRound17Lesson(root){
 const kind=root.dataset.lesson.replace('r17-','');if(!root.dataset.lesson.startsWith('r17-'))return;
 const $=id=>root.querySelector('#r17-'+kind+'-'+id),zh=document.documentElement.lang==='zh-CN';
 const defaults={beta:['teaching',2],alpha:['basic',1],noise:['basic',0],swiglu:['basic',0],mask:['negative',0]};
 function inspect(length){const el=$('index'),old=Number(el.value)||0;el.replaceChildren(...Array.from({length},(_,i)=>new Option('i'+i,String(i))));el.disabled=!length;if(length)el.value=String(Math.min(old,length-1));return Number(el.value)||0;}
 function update(){
  let tr,render,i;const preset=$('preset').value;
  root.querySelectorAll('input[type=range]').forEach(e=>root.querySelector('#'+e.id+'-value').textContent=e.value);
  if(kind==='beta'){const count=Number($('steps').value);i=inspect(count);tr=betaTrace(count,...betaPresets[preset]);render=renderBeta;}
  else if(kind==='alpha'){const betas=alphaPresets[preset];i=inspect(betas.length);tr=alphaTrace(betas);render=renderAlpha;}
  else if(kind==='noise'){const p=noisePresets[preset];i=inspect(p.predicted.length);$('delta').disabled=!p.predicted.length;tr=noiseTrace(p.predicted.map((v,j)=>v+(j===i?Number($('delta').value):0)),p.target);render=renderNoise;}
  else if(kind==='swiglu'){const p=swigluPresets[preset];i=inspect(p.x.length);$('delta').disabled=!p.x.length;tr=swigluTrace(p.x,p.gate.map((v,j)=>v+(j===i?Number($('delta').value):0)));render=renderSwiglu;}
  else{const p=maskPresets[preset];i=inspect(p.scores.length);$('delta').disabled=p.valid.every(Boolean);tr=maskTrace(p.scores.map((v,j)=>v+(!p.valid[j]?Number($('delta').value):0)),p.valid);render=renderMask;}
  $('view').innerHTML=render(tr,i,zh);
 }
 root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
 root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{
  const [preset,i]=defaults[kind];$('preset').value=preset;if(kind==='beta')$('steps').value='5';else if($('delta'))$('delta').value='0';
  if(!Array.from($('index').options).some(o=>o.value===String(i)))$('index').add(new Option('i'+i,String(i)));$('index').value=String(i);update();
 });update();
}
