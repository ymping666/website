import {topkPresets,topkTrace,cfgPresets,cfgTrace,clipPresets,clipTrace} from './lesson-round5-math.mjs';
import {renderTopk,renderCfg,renderClip} from './lesson-round5-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound5Lesson(root){
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
 const handlers={
  topk:()=>{const x=topkPresets[$('#topk-preset').value],k=$('#topk-k');k.max=String(x.length);k.value=String(Math.min(Number(k.value),x.length));$('#topk-k-value').textContent=k.value;$('#topk-view').innerHTML=renderTopk(topkTrace(x,Number(k.value)),zh);},
  cfg:()=>{const pair=cfgPresets[$('#cfg-preset').value],s=Number($('#cfg-scale').value);$('#cfg-scale-value').textContent=f(s);$('#cfg-view').innerHTML=renderCfg(cfgTrace(pair.u,pair.c,s),zh);},
  clip:()=>{const grad=clipPresets[$('#clip-preset').value],m=Number($('#clip-limit').value);$('#clip-limit-value').textContent=f(m);$('#clip-view').innerHTML=renderClip(clipTrace(grad,m),zh);}
 };
 const update=handlers[root.dataset.lesson];if(!update)return;
 for(const input of root.querySelectorAll('input'))input.addEventListener('input',update);
 for(const select of root.querySelectorAll('select'))select.addEventListener('change',update);
 $('[data-reset-lesson]').addEventListener('click',()=>{
  if(root.dataset.lesson==='topk'){$('#topk-preset').value='mixed';$('#topk-k').max='4';$('#topk-k').value='2';}
  if(root.dataset.lesson==='cfg'){$('#cfg-preset').value='different';$('#cfg-scale').value='1.5';}
  if(root.dataset.lesson==='clip'){$('#clip-preset').value='threeFour';$('#clip-limit').value='2.5';}
  update();
 });update();
}
