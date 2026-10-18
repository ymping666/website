import * as M from './lesson-round18-math.mjs';
import {renderLinear,renderBelief,renderKalman,renderInvalidKalman,renderCurve,renderKl} from './lesson-round18-view.mjs';
export function mountRound18Lesson(root){
 if(!root.dataset.lesson.startsWith('r18-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r18-'+kind+'-'+key),defaults={linear:'basic',belief:'basic',kalman:'equal',curve:'decreasing',kl:'mixed'};
 function resetInputs(){const preset=M[kind+'Presets'][$('preset').value];if($('index'))$('index').value='0';if($('delta'))$('delta').value='0';if(kind==='linear'||kind==='belief')$('a').value=String(preset.a);if(kind==='belief')$('q').value=String(preset.q);if(kind==='kalman'){for(const [key,prop]of [['p','variance'],['r','r'],['z','observation']])$(key).value=String(preset[prop]);}}
 function inspect(length){const el=$('index');if(!el)return 0;const old=Number(el.value)||0;el.replaceChildren(...Array.from({length},(_,i)=>new Option(kind==='kl'?'i'+i:kind==='curve'?'h'+(i+1):'t'+(i+1),String(i))));el.disabled=!length;if(length)el.value=String(Math.min(old,length-1));return Number(el.value)||0;}
 function update(){
  const p=M[kind+'Presets'][$('preset').value];let tr,render,i=0;
  root.querySelectorAll('input[type=range]').forEach(e=>root.querySelector('#'+e.id+'-value').textContent=e.value);
  if(kind==='linear'){i=inspect(p.actions.length);tr=M.linearTrace(p.x0,p.actions,Number($('a').value),p.b);render=renderLinear;}
  if(kind==='belief'){i=inspect(p.controls.length);tr=M.beliefTrace(p.mean,p.variance,Number($('a').value),Number($('q').value),p.controls);render=renderBelief;}
  if(kind==='kalman'){const variance=Number($('p').value),r=Number($('r').value);if(variance+r<=0){$('view').innerHTML=renderInvalidKalman(zh);return;}tr=M.kalmanTrace(p.mean,variance,Number($('z').value),r);render=renderKalman;}
  if(kind==='curve'){i=inspect(p.predicted.length);$('delta').disabled=!p.predicted.length;const predicted=p.predicted.map((row,j)=>row.map((v,k)=>v+(j===i&&k===0?Number($('delta').value):0)));tr=M.curveTrace(predicted,p.target);render=renderCurve;}
  if(kind==='kl'){i=inspect(p.qm.length);$('delta').disabled=!p.qm.length;tr=M.klTrace(p.qm.map((v,j)=>v+(i===j?Number($('delta').value):0)),p.qv,p.pm,p.pv);render=renderKl;}
  $('view').innerHTML=render(tr,i,zh);
 }
 $('preset').addEventListener('change',()=>{resetInputs();update();});if($('index'))$('index').addEventListener('change',update);root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
 root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value=defaults[kind];resetInputs();update();});update();
}
