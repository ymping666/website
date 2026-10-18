import {presets,fromPreset,initialIndex,indexLabel} from './lesson-round22-math.mjs';
import {renders,renderInvalid} from './lesson-round22-view.mjs';
export function mountRound22Lesson(root){
 if(!root.dataset.lesson.startsWith('r22-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r22-'+kind+'-'+key);
 function update(resetIndex=false){const p=presets[kind][$('preset').value],value=kind==='sinusoid'?Number($('position').value):kind==='rope'?Number($('base').value):kind==='gelu'?Number($('x').value):undefined;let tr;try{tr=fromPreset(kind,p,$('preset').value==='invalid'?undefined:value);}catch(e){if(!(e instanceof RangeError))throw e;if($('index')){$('index').replaceChildren();$('index').disabled=true;}root.querySelectorAll('input[type=range]').forEach(el=>el.disabled=true);if($('base'))$('base').disabled=true;$('view').innerHTML=renderInvalid(zh);return;}
  let selected=resetIndex===true?initialIndex(kind,tr):Number($('index')?.value)||0;if($('index')){$('index').replaceChildren(...tr.rows.map((r,i)=>new Option(indexLabel(kind,r),String(i))));$('index').disabled=!tr.rows.length;selected=tr.rows.length?Math.min(selected,tr.rows.length-1):0;if(tr.rows.length)$('index').value=String(selected);}
  if(kind==='sinusoid'){$('position-value').textContent=$('position').value;$('position').disabled=false;}
  if(kind==='rope')$('base').disabled=!tr.rows.length;
  if(kind==='gelu'){$('x-value').textContent=$('x').value;$('x').disabled=false;}
  $('view').innerHTML=renders[kind](tr,selected,zh);
 }
 function preset(){const p=presets[kind][$('preset').value];if(kind==='sinusoid')$('position').value=String(p.position);if(kind==='rope')$('base').value=String(p.base);if(kind==='gelu')$('x').value=String(p.x??0);update(true);}
 $('preset').addEventListener('change',preset);$('index')?.addEventListener('change',update);$('base')?.addEventListener('change',update);root.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',update));root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';preset();});update();
}
