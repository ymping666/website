import {diffusionPairs,reconstructionTrace,posteriorTrace,ddimTrace} from './lesson-round10-math.mjs';
import {renderReconstruction,renderPosterior,renderDDIM} from './lesson-round10-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound10Lesson(root){
 const kind=root.dataset.lesson;if(!['diff-reconstruct','diff-posterior','diff-ddim'].includes(kind))return;
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{
  let html;
  if(kind==='diff-posterior')html=renderPosterior(posteriorTrace([1,2],[2,-1],Number($('#post-alpha').value),Number($('#post-prev').value)),zh);
  else{
   const pair=diffusionPairs[$('#diff-pair').value],bias=Number($('#diff-bias').value);
   if(kind==='diff-reconstruct')html=renderReconstruction(reconstructionTrace(pair.x0,pair.eps,Number($('#diff-alpha').value),bias),zh);
   else{
    const current=Number($('#ddim-current').value),target=$('#ddim-prev');target.min=String(current);target.value=String(Math.max(current,Number(target.value)));
    const forward=reconstructionTrace(pair.x0,pair.eps,current,bias);
    html=renderDDIM(ddimTrace(forward.rows.map(r=>r.xt),forward.rows.map(r=>r.hat),current,Number(target.value)),zh);
   }
  }
  root.querySelectorAll('input[type=range]').forEach(e=>$('#'+e.id+'-value').textContent=f(Number(e.value)));
  $('#diff-view').innerHTML=html;
 };
 root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));
 $('[data-reset-lesson]').addEventListener('click',()=>{
  const defaults=kind==='diff-posterior'?{'post-alpha':'0.9','post-prev':'0.8'}:kind==='diff-reconstruct'?{'diff-pair':'mixed','diff-alpha':'0.25','diff-bias':'0'}:{'diff-pair':'mixed','ddim-current':'0.25','ddim-prev':'0.75','diff-bias':'0'};
  if(kind==='diff-ddim')$('#ddim-prev').min='.25';
  for(const [id,v] of Object.entries(defaults))$('#'+id).value=v;update();
 });update();
}
