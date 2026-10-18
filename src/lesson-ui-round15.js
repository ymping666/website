import {linearPresets,linearForwardTrace,linearBackwardTrace,msePresets,mseTrace,reluPresets,reluBackwardTrace,scalarFunctions,centralTrace} from './lesson-round15-math.mjs';
import {renderForward,renderBackward,renderMse,renderRelu,renderCentral,n} from './lesson-round15-view.mjs';
export function mountRound15Lesson(root){
 const kind=root.dataset.lesson;if(!['grad-forward','grad-mse','grad-relu','grad-backward','grad-central'].includes(kind))return;
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
 function indices(id,length,prefix){const el=$('#'+id),old=Number(el.value)||0;el.replaceChildren(...Array.from({length},(_,i)=>new Option(prefix+i,String(i))));el.disabled=length===0;if(length)el.value=String(Math.min(old,length-1));return Number(el.value)||0;}
 function update(){
  root.querySelectorAll('input[type=range]').forEach(e=>$('#'+e.id+'-value').textContent=n(Number(e.value)));
  if(kind==='grad-forward'){
   const p=linearPresets[$('#fwd-example').value],scale=Number($('#fwd-scale').value),bias=Number($('#fwd-bias').value),row=indices('fwd-row',p.w.length,'o');
   $('#fwd-view').innerHTML=renderForward(linearForwardTrace(p.x.map(x=>x*scale),p.w,p.b.map(b=>b+bias)),row,zh);
  }else if(kind==='grad-backward'){
   const p=linearPresets[$('#back-example').value],i=indices('back-input',p.x.length,'i'),o=indices('back-row',p.w.length,'o'),scale=Number($('#back-scale').value);
   $('#back-view').innerHTML=renderBackward(linearBackwardTrace(p.x,p.w,p.g.map(g=>g*scale)),i,o,zh);
  }else if(kind==='grad-mse'){
   const p=msePresets[$('#mse-example').value],copies=Number($('#mse-repeat').value),shift=Number($('#mse-shift').value),repeat=a=>Array.from({length:copies},()=>a).flat();
   const tr=mseTrace(repeat(p.p.map(x=>x+shift)),repeat(p.t)),i=indices('mse-index',tr.n,'i');$('#mse-view').innerHTML=renderMse(tr,i,zh);
  }else if(kind==='grad-relu'){
   const p=reluPresets[$('#relu-example').value],offset=Number($('#relu-offset').value),i=indices('relu-index',p.x.length,'i');$('#relu-view').innerHTML=renderRelu(reluBackwardTrace(p.x.map(x=>x+offset),p.g),i,zh);
  }else{
   const key=$('#central-function').value;$('#central-view').innerHTML=renderCentral(centralTrace(scalarFunctions[key].fn,Number($('#central-x').value),Number($('#central-h').value)),key,zh);
  }
 }
 root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
 $('[data-reset-lesson]').addEventListener('click',()=>{
  const defaults=kind==='grad-forward'?{'fwd-example':'basic','fwd-row':'0','fwd-scale':'1','fwd-bias':'0'}:kind==='grad-backward'?{'back-example':'basic','back-input':'0','back-row':'0','back-scale':'1'}:kind==='grad-mse'?{'mse-example':'basic','mse-index':'0','mse-shift':'0','mse-repeat':'1'}:kind==='grad-relu'?{'relu-example':'mixed','relu-index':'2','relu-offset':'0'}:{'central-function':'cubic','central-x':'1','central-h':'0.5'};
  for(const[id,value]of Object.entries(defaults)){const e=$('#'+id);if(e.tagName==='SELECT'&&!Array.from(e.options).some(o=>o.value===value))e.add(new Option(value,value));e.value=value;}update();
 });update();
}
