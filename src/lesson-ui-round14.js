import {revisionPresets,revisionTrace,preferenceInputs,preferenceTrace,preferenceLossTrace} from './lesson-round14-math.mjs';
import {renderRevision,renderPreference,renderPreferenceLoss} from './lesson-round14-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound14Lesson(root){
 const kind=root.dataset.lesson;if(!['cai-revisions','cai-labels','cai-loss'].includes(kind))return;
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{
  root.querySelectorAll('input[type=range]').forEach(e=>$('#'+e.id+'-value').textContent=f(Number(e.value)));
  if(kind==='cai-revisions'){const p=revisionPresets[$('#revision-example').value];$('#revision-view').innerHTML=renderRevision(revisionTrace(p.prompt,p.initial,p.principles,p.rounds),zh);}
  else if(kind==='cai-labels'){$('#preference-view').innerHTML=renderPreference(preferenceTrace(...preferenceInputs(Number($('#preference-gap').value),Number($('#preference-offset').value)),$('#preference-clamp').checked),zh);}
  else{
   const d=Number($('#loss-gap').value)*Number($('#loss-scale').value),q=Number($('#loss-target').value),shift=Number($('#loss-shift').value),copies=Number($('#loss-copies').value);
   $('#preference-loss-view').innerHTML=renderPreferenceLoss(preferenceLossTrace(Array(copies).fill(shift+d/2),Array(copies).fill(shift-d/2),Array(copies).fill(q)),zh);
  }
 };
 root.querySelectorAll('select,input[type=checkbox]').forEach(e=>e.addEventListener('change',update));
 root.querySelectorAll('input[type=range]').forEach(e=>e.addEventListener('input',update));
 $('[data-reset-lesson]').addEventListener('click',()=>{
  if(kind==='cai-revisions')$('#revision-example').value='chain';
  else if(kind==='cai-labels'){$('#preference-gap').value='2';$('#preference-offset').value='-1000';$('#preference-clamp').checked=false;}
  else{$('#loss-gap').value='2';$('#loss-scale').value='1';$('#loss-target').value='.6';$('#loss-shift').value='0';$('#loss-copies').value='1';}
  update();
 });update();
}
