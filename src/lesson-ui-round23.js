import {presets,fromPreset,initialIndex} from './lesson-round23-math.mjs';
import {renders,renderInvalid} from './lesson-round23-view.mjs';
export function mountRound23Lesson(root){
 if(!root.dataset.lesson.startsWith('r23-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r23-'+kind+'-'+key),control=kind==='disc'||kind==='gen'?'offset':kind==='penalty'?'weight':kind==='grads'?'rate':'scale';
 function update(resetIndex=false){const p=presets[kind][$('preset').value];let index=Number($('index')?.value)||0,tr;
  if(resetIndex===true)index=kind==='disc'||kind==='penalty'?Math.min(1,(kind==='disc'?p.real.length:p.gradients.length)-1):0;
  try{tr=fromPreset(kind,p,$('preset').value==='invalid'?undefined:Number($(control).value),index);}catch(e){if(!(e instanceof RangeError))throw e;if($('index')){$('index').replaceChildren();$('index').disabled=true;}$(control).disabled=true;$('view').innerHTML=renderInvalid(zh);return;}
  if($('index')){$('index').replaceChildren(...tr.rows.map((_,i)=>new Option('i='+i,String(i))));$('index').disabled=!tr.rows.length;index=tr.rows.length?Math.min(index,tr.rows.length-1):0;if(tr.rows.length)$('index').value=String(index);}
  $(control).disabled=!tr.rows.length;$(control+'-value').textContent=$(control).value;$('view').innerHTML=renders[kind](tr,index,zh);
 }
 function preset(){const p=presets[kind][$('preset').value];$(control).value=String(control==='offset'?0:control==='weight'?p.weight:control==='rate'?.5:p.scale);update(true);}
 $('preset').addEventListener('change',preset);$('index')?.addEventListener('change',update);$(control).addEventListener('input',update);root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';preset();});update();
}
