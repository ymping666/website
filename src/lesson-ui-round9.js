import {flowPairs,velocityTrace,odeTrace} from './lesson-round9-math.mjs';
import {renderVelocity,renderSolver} from './lesson-round9-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound9Lesson(root){
  const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN',kind=root.dataset.lesson;
  if(!['flow-target','flow-euler','flow-heun'].includes(kind))return;
  const update=()=>{
    if(kind==='flow-target'){
      const pair=flowPairs[$('#flow-pair').value],time=Number($('#flow-time').value);
      $('#flow-time-value').textContent=f(time);
      $('#flow-target-view').innerHTML=renderVelocity(velocityTrace(pair.x0,pair.x1,time),zh);
    }else{
      const steps=Number($('#flow-steps').value),x0=Number($('#flow-initial').value),input=$('#flow-inspect');
      input.max=String(steps);input.value=String(Math.min(steps,Math.max(1,Number(input.value))));
      $('#flow-initial-value').textContent=f(x0);$('#flow-inspect-value').textContent=input.value;
      $('#flow-solver-view').innerHTML=renderSolver(odeTrace(kind==='flow-heun'?'heun':'euler',x0,$('#flow-field').value,steps),Number(input.value),zh);
    }
  };
  root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
  root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));
  $('[data-reset-lesson]').addEventListener('click',()=>{
    const defaults=kind==='flow-target'?{'flow-pair':'forward','flow-time':'0.5'}:{'flow-field':'growth','flow-steps':'4','flow-initial':'1','flow-inspect':'1'};
    // Restore the inspector range before its value, after a prior S=1 selection.
    if(kind!=='flow-target')$('#flow-inspect').max='4';
    for(const [id,v] of Object.entries(defaults))$('#'+id).value=v;update();
  });update();
}
