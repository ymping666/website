import {presets,fromPreset,initialIndex} from './lesson-round21-math.mjs';
import {renders,renderInvalid} from './lesson-round21-view.mjs';
export function mountRound21Lesson(root){
 if(!root.dataset.lesson.startsWith('r21-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r21-'+kind+'-'+key);
 function update(resetIndex=false){const p=presets[kind][$('preset').value],value=kind==='cfg'?Number($('scale').value):kind==='rollout'?Number($('gain').value):undefined;let tr;try{tr=fromPreset(kind,p,value);}catch(e){if(!(e instanceof RangeError))throw e;$('index').replaceChildren();$('index').disabled=true;root.querySelectorAll('input[type=range]').forEach(el=>el.disabled=true);$('view').innerHTML=renderInvalid(zh);return;}
  const selected=resetIndex===true?initialIndex(kind,tr):Number($('index').value)||0;$('index').replaceChildren(...tr.rows.map((r,i)=>new Option(kind==='rollout'?'t='+r.t:kind==='cfg'||kind==='velocity'?'d='+r.d:'t='+r.t+', d='+r.d,String(i))));$('index').disabled=!tr.rows.length;if(tr.rows.length)$('index').value=String(Math.min(selected,tr.rows.length-1));
  if(kind==='cfg'){$('scale-value').textContent=$('scale').value;$('scale').disabled=!tr.rows.length;}
  if(kind==='rollout'){$('gain-value').textContent=$('gain').value;$('gain').disabled=p.mode!=='affine'||!tr.rows.length;}
  $('view').innerHTML=renders[kind](tr,Number($('index').value)||0,zh);
 }
 function preset(){const p=presets[kind][$('preset').value];$('index').value='0';if(kind==='cfg')$('scale').value=String(p.scale);if(kind==='rollout')$('gain').value=String(p.gain);update(true);}
 $('preset').addEventListener('change',preset);$('index').addEventListener('change',update);root.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',update));root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';preset();});update();
}
