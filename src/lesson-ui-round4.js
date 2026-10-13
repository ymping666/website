import {causalPresets,causalTrace,rmsPresets,rmsTrace,flowPresets,flowTrace} from './lesson-round4-math.mjs';
import {renderCausal,renderRms,renderFlow} from './lesson-round4-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound4Lesson(root){
 const $=selector=>root.querySelector(selector),zh=document.documentElement.lang==='zh-CN';
 const handlers={
  causal:()=>{
   const logits=causalPresets[$('#causal-preset').value],row=$('#causal-row');
   row.max=String(Math.max(0,logits.length-1));row.value=String(Math.min(Number(row.value),Number(row.max)));row.disabled=!logits.length;
   $('#causal-row-value').textContent=row.value;$('#causal-view').innerHTML=renderCausal(causalTrace(logits),Number(row.value),zh);
  },
  rms:()=>{
   const scale=Number($('#rms-scale').value),x=rmsPresets[$('#rms-preset').value].map(v=>v*scale);
   $('#rms-scale-value').textContent=f(scale);$('#rms-view').innerHTML=renderRms(rmsTrace(x,Number($('#rms-eps').value)),zh);
  },
  'linear-flow':()=>{
   const t=Number($('#flow-time').value),pair=flowPresets[$('#flow-preset').value];
   $('#flow-time-value').textContent=f(t);$('#flow-view').innerHTML=renderFlow(flowTrace(pair.x0,pair.x1,t),zh);
  }
 };
 const update=handlers[root.dataset.lesson];if(!update)return;
 for(const input of root.querySelectorAll('input'))input.addEventListener('input',update);
 for(const select of root.querySelectorAll('select'))select.addEventListener('change',update);
 $('[data-reset-lesson]').addEventListener('click',()=>{
  if(root.dataset.lesson==='causal'){$('#causal-preset').value='mixed';$('#causal-row').value='0';}
  if(root.dataset.lesson==='rms'){$('#rms-preset').value='positive';$('#rms-scale').value='1';$('#rms-eps').value='0.000001';}
  if(root.dataset.lesson==='linear-flow'){$('#flow-preset').value='diagonal';$('#flow-time').value='0.25';}
  update();
 });
 update();
}
