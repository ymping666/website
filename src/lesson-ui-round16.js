import {rmsPresets,rmsGainTrace,residualPresets,normalizers,sublayers,preNormTrace,modulationPresets,modulationTrace,gatePresets,gatedResidualTrace} from './lesson-round16-math.mjs';
import {renderRmsGain,renderPreNorm,renderModulation,renderGatedResidual,n} from './lesson-round16-view.mjs';
export function mountRound16Lesson(root){
 const kind=root.dataset.lesson;if(!['rms-gain','pre-norm-path','adaln-modulation','adaln-output-gate'].includes(kind))return;
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
 function inspect(id,length){const el=$('#'+id),old=Number(el.value)||0;el.replaceChildren(...Array.from({length},(_,i)=>new Option('i'+i,String(i))));el.disabled=length===0;if(length)el.value=String(Math.min(old,length-1));return Number(el.value)||0;}
 function update(){
  root.querySelectorAll('input[type=range]').forEach(e=>$('#'+e.id+'-value').textContent=n(Number(e.value)));
  if(kind==='rms-gain'){
   const p=rmsPresets[$('#rms-example').value],i=inspect('rms-index',p.x.length),shift=Number($('#rms-shift').value),delta=Number($('#rms-gain-delta').value),gain=p.gain.map((v,j)=>v+(j===i?delta:0));
   $('#rms-gain-view').innerHTML=renderRmsGain(rmsGainTrace(p.x.map(v=>v+shift),gain,Number($('#rms-eps').value)),i,zh);
  }else if(kind==='pre-norm-path'){
   const x=residualPresets[$('#prenorm-example').value],i=inspect('prenorm-index',x.length);$('#prenorm-view').innerHTML=renderPreNorm(preNormTrace(x,normalizers[$('#prenorm-normalize').value],sublayers[$('#prenorm-block').value]),i,zh);
  }else if(kind==='adaln-modulation'){
   const p=modulationPresets[$('#modulation-example').value],i=inspect('modulation-index',p.x.length),ds=Number($('#modulation-scale').value),db=Number($('#modulation-shift').value);
   $('#modulation-view').innerHTML=renderModulation(modulationTrace(p.x,p.shift.map((v,j)=>v+(i===j?db:0)),p.scale.map((v,j)=>v+(i===j?ds:0)),Number($('#modulation-eps').value)),i,zh);
  }else{
   const p=gatePresets[$('#gate-example').value],i=inspect('gate-index',p.x.length),delta=Number($('#gate-delta').value);$('#residual-gate-view').innerHTML=renderGatedResidual(gatedResidualTrace(p.x,p.block,p.gate.map((v,j)=>v+(i===j?delta:0))),i,zh);
  }
 }
 root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
 $('[data-reset-lesson]').addEventListener('click',()=>{
  const defaults=kind==='rms-gain'?{'rms-example':'constant','rms-index':'0','rms-shift':'0','rms-gain-delta':'0','rms-eps':'0.01'}:kind==='pre-norm-path'?{'prenorm-example':'basic','prenorm-index':'0','prenorm-normalize':'center','prenorm-block':'double'}:kind==='adaln-modulation'?{'modulation-example':'basic','modulation-index':'1','modulation-scale':'0','modulation-shift':'0','modulation-eps':'0.01'}:{'gate-example':'zero','gate-index':'0','gate-delta':'0'};
  for(const[id,value]of Object.entries(defaults)){const e=$('#'+id);if(e.tagName==='SELECT'&&!Array.from(e.options).some(o=>o.value===value))e.add(new Option(value,value));e.value=value;}update();
 });update();
}
