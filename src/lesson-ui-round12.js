import {forecastPresets,forecastTrace,riskPresets,riskTrace,cemPresets,cemTrace} from './lesson-round12-math.mjs';
import {renderForecast,renderRisk,renderCem} from './lesson-round12-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound12Lesson(root){
 const kind=root.dataset.lesson;if(!['forecast-decision','risk-action','cem-frequencies'].includes(kind))return;
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{
  if(kind==='forecast-decision'){
   const p=forecastPresets[$('#forecast-preset').value],adjust=Number($('#forecast-adjust').value);
   $('#forecast-adjust-value').textContent=f(adjust);
   $('#forecast-view').innerHTML=renderForecast(forecastTrace({...p.a,a:p.a.a+adjust},p.b,p.truth),zh);
  }else if(kind==='risk-action'){
   const p=riskPresets[$('#risk-preset').value],weight=Number($('#risk-weight').value);
   $('#risk-weight-value').textContent=f(weight);$('#risk-view').innerHTML=renderRisk(riskTrace(p.means,p.variances,weight),zh);
  }else{
   const p=cemPresets[$('#cem-preset').value],count=$('#cem-count'),step=$('#cem-step'),e=Number(count.value)||1,t=Number(step.value)||0,h=p.candidates[0].length;
   count.replaceChildren(...p.candidates.map((_,i)=>new Option(String(i+1),String(i+1))));count.value=String(Math.min(e,p.candidates.length));
   step.replaceChildren(...Array.from({length:h},(_,i)=>new Option('t'+i,String(i))));step.disabled=h===0;
   if(h)step.value=String(Math.min(t,h-1));
   $('#cem-view').innerHTML=renderCem(cemTrace(p.candidates,p.costs,Number(count.value),p.n),h?Number(step.value):0,zh);
  }
 };
 root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));
 root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
 $('[data-reset-lesson]').addEventListener('click',()=>{
  if(kind==='forecast-decision'){$('#forecast-preset').value='trap';$('#forecast-adjust').value='0';}
  else if(kind==='risk-action'){$('#risk-preset').value='tradeoff';$('#risk-weight').value='1';}
  else{$('#cem-preset').value='basic';$('#cem-count').replaceChildren(new Option('2','2'));$('#cem-step').replaceChildren(new Option('t0','0'));}
  update();
 });update();
}
