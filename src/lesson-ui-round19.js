import * as M from './lesson-round19-math.mjs';
import {renderConv,renderPoint,renderPool,renderPatch,renderInvalid} from './lesson-round19-view.mjs';
export function mountRound19Lesson(root){
 if(!root.dataset.lesson.startsWith('r19-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r19-'+kind+'-'+key),presets=M[{conv:'convPresets',point:'pointPresets',max:'poolPresets',avg:'poolPresets',patch:'patchPresets'}[kind]],render={conv:renderConv,point:renderPoint,max:renderPool,avg:renderPool,patch:renderPatch}[kind];
 function update(){
  const preset=presets[$('preset').value];let trace;
  try{
   if(kind==='conv')trace=M.convTrace(preset.image,preset.kernel);
   if(kind==='point'){const weights=preset.weights.map(row=>row.slice());weights[0][0]=Number($('weight').value);trace=M.pointTrace(preset.channels,weights,preset.biases);}
   if(kind==='max'||kind==='avg')trace=M.poolTrace(preset.image,kind);
   if(kind==='patch')trace=M.patchTrace(preset.image,preset.p);
  }catch(error){if(!(error instanceof RangeError))throw error;$('index').replaceChildren();$('index').disabled=true;if($('weight'))$('weight').disabled=true;$('view').innerHTML=renderInvalid(kind,zh);return;}
  const index=Math.min(Number($('index').value)||0,trace.rows.length-1);$('index').replaceChildren(...trace.rows.map((r,i)=>new Option(kind==='point'?`o${r.o} · (${r.i},${r.j})`:kind==='patch'?`k${r.k} · (${r.pr},${r.pc})`:`(${r.i},${r.j})`,String(i))));$('index').disabled=false;$('index').value=String(index);
  if($('weight')){$('weight').disabled=false;$('weight-value').textContent=$('weight').value;}
  $('view').innerHTML=render(trace,index,zh);
 }
 function presetChanged(){if($('weight')){$('weight').value=presets[$('preset').value].weights[0][0];$('weight-value').textContent=$('weight').value;}$('index').value='0';update();}
 $('preset').addEventListener('change',presetChanged);$('index').addEventListener('change',update);if($('weight'))$('weight').addEventListener('input',update);
 root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';presetChanged();});update();
}
