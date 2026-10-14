import {layerPresets,layerTrace,gradientPresets,momentumTrace,adamTrace} from './lesson-round6-math.mjs';
import {renderLayer,renderMomentum,renderAdam} from './lesson-round6-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound6Lesson(root){
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
 const handlers={
  layer:()=>{const shift=Number($('#layer-shift').value);$('#layer-shift-value').textContent=f(shift);$('#layer-view').innerHTML=renderLayer(layerTrace(layerPresets[$('#layer-preset').value].map(v=>v+shift),Number($('#layer-eps').value)),zh);},
  momentum:()=>{const lr=Number($('#momentum-lr').value),steps=Number($('#momentum-steps').value);$('#momentum-lr-value').textContent=f(lr);$('#momentum-steps-value').textContent=steps;$('#momentum-view').innerHTML=renderMomentum(momentumTrace(gradientPresets[$('#momentum-preset').value],lr,Number($('#momentum-mu').value),steps,Number($('#momentum-initial').value)),zh);},
  'adam-bias':()=>{const steps=Number($('#adam-steps').value);$('#adam-steps-value').textContent=steps;$('#adam-view').innerHTML=renderAdam(adamTrace(gradientPresets[$('#adam-preset').value],Number($('#adam-beta1').value),Number($('#adam-beta2').value),steps),zh);}
 };
 const update=handlers[root.dataset.lesson];if(!update)return;
 for(const input of root.querySelectorAll('input'))input.addEventListener('input',update);
 for(const select of root.querySelectorAll('select'))select.addEventListener('change',update);
 $('[data-reset-lesson]').addEventListener('click',()=>{
  const defaults={layer:{'layer-preset':'mixed','layer-shift':'0','layer-eps':'0.01'},momentum:{'momentum-preset':'reversal','momentum-mu':'0.9','momentum-lr':'0.1','momentum-steps':'3','momentum-initial':'0'},'adam-bias':{'adam-preset':'constant','adam-beta1':'0.9','adam-beta2':'0.999','adam-steps':'3'}};
  for(const [id,value] of Object.entries(defaults[root.dataset.lesson]))$('#'+id).value=value;update();
 });update();
}
