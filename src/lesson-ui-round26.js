import {presets,fromPreset,mrrTrace} from './lesson-round26-math.mjs';
import {renders,renderInvalid} from './lesson-round26-view.mjs';
export function mountRound26Lesson(root){
 if(!root.dataset.lesson.startsWith('r26-'))return;const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r26-'+kind+'-'+key);
 function update(){const p=presets[kind][$('preset').value],options={},old=Number($('index').value)||0;
  for(const k of kind==='retry'?['count','budget']:kind==='memory'||kind==='pack'?['budget']:kind==='recall'?['k']:[]){options[k]=Number($(k).value);$(k+'-value').textContent=$(k).value;}
  if(kind==='mrr'){options.query=old;options.promote=$('promote').checked;const q=mrrTrace(p).queries[old];$('promote').disabled=!q||q.firstRank===null||q.firstRank===1;}
  let tr;try{tr=fromPreset(kind,p,options);}catch(e){if(!(e instanceof RangeError))throw e;$('view').innerHTML=renderInvalid(zh);return;}
  const index=tr.rows.length?Math.min(old,tr.rows.length-1):0;$('index').replaceChildren(...tr.rows.map((_,i)=>new Option((kind==='mrr'?'q=':'i=')+i,String(i))));$('index').disabled=tr.rows.length===0;if(tr.rows.length)$('index').value=String(index);if(kind==='retry')$('count').disabled=p.history.length===0;
  $('view').innerHTML=renders[kind](tr,index,zh);
 }
 function setPreset(){const p=presets[kind][$('preset').value];$('index').replaceChildren(new Option('0','0'));if(kind==='retry'){$('count').max=String(p.history.length);$('count').value=String(p.history.length);$('budget').value=String(p.budget);}if(kind==='memory'||kind==='pack')$('budget').value=String(p.budget);if(kind==='recall'){$('k').max=String(Math.max(p.k,p.retrieved.length+2));$('k').value=String(p.k);}if(kind==='mrr')$('promote').checked=false;update();}
 $('preset').addEventListener('change',setPreset);$('index').addEventListener('change',()=>{if(kind==='mrr')$('promote').checked=false;update();});for(const key of kind==='retry'?['count','budget']:kind==='memory'||kind==='pack'?['budget']:kind==='recall'?['k']:[])$(key).addEventListener('input',update);if(kind==='mrr')$('promote').addEventListener('change',update);root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';setPreset();});setPreset();
}
