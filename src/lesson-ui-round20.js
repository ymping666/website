import * as M from './lesson-round20-math.mjs';
import {renderDelta,renderFlatten,renderPatch,renderContext,renderNll,renderInvalid,renderNllError,probabilityText} from './lesson-round20-view.mjs';
export function mountRound20Lesson(root){
 if(!root.dataset.lesson.startsWith('r20-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r20-'+kind+'-'+key),presets=M[kind+'Presets'],render={delta:renderDelta,flatten:renderFlatten,patch:renderPatch,context:renderContext,nll:renderNll}[kind];
 function populate(length){const old=Number($('index').value)||0;$('index').replaceChildren(...Array.from({length},(_,i)=>new Option((kind==='flatten'?'k=':kind==='patch'?'g=':kind==='context'?'i=':'t=')+(kind==='delta'?i+1:i),String(i))));$('index').disabled=!length;if(length)$('index').value=String(Math.min(old,length-1));return Number($('index').value)||0;}
 function update(){
  const p=presets[$('preset').value];let tr,index=Number($('index').value)||0,probabilities;
  try{
   if(kind==='delta'){index=populate(Math.max(0,p.frames.length-1));$('bump').disabled=!p.frames.length||!p.frames[0].length||p.frames.length<2;const frames=p.frames.map((row,t)=>row.map((v,d)=>v+(t===index+1&&d===0?Number($('bump').value):0)));tr=M.deltaTrace(frames);$('bump-value').textContent=$('bump').value;}
   if(kind==='flatten')tr=M.flattenTrace(p.codes);
   if(kind==='patch'){tr=M.patchTrace(p.frames,Number($('size').value));$('size-value').textContent=$('size').value;}
   if(kind==='context'){tr=M.contextTrace(p.tokens,Number($('size').value));$('size-value').textContent=$('size').value;}
   if(kind==='nll'){index=populate(p.targets.length);$('prob').disabled=!p.targets.length;$('prob-value').textContent=probabilityText(Number($('prob').value));probabilities=p.targets.length?M.adjustProbability(p.probabilities,p.targets,index,Number($('prob').value)):[];tr=M.nllTrace(probabilities,p.targets);}
  }catch(error){if(!(error instanceof RangeError))throw error;if(kind==='nll'&&error.message==='zero probability for target token'){$('view').innerHTML=renderNllError(probabilities,p.targets,index,zh);return;}$('index').replaceChildren();$('index').disabled=true;$('view').innerHTML=renderInvalid(zh);return;}
  if(kind!=='delta'&&kind!=='nll')index=populate(tr.rows.length);$('view').innerHTML=render(tr,index,zh);
 }
 function changedPreset(){const p=presets[$('preset').value];$('index').value='0';if(kind==='delta')$('bump').value='0';if(kind==='patch')$('size').value=String(p.p);if(kind==='context')$('size').value=String(p.size);if(kind==='nll')$('prob').value=String(p.targets.length?p.probabilities[0][p.targets[0]]:0);update();if(kind==='context'&&$('index').options.length){$('index').value=String(Math.min(3,$('index').options.length-1));update();}}
 $('preset').addEventListener('change',changedPreset);$('index').addEventListener('change',()=>{if(kind==='nll'){const p=presets[$('preset').value],i=Number($('index').value);$('prob').value=String(p.probabilities[i][p.targets[i]]);}update();});root.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',update));
 root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';changedPreset();});update();
}
