import {examples,trace,parameters} from './rsi-math.mjs';
import {renderTrace,labels,tr,esc} from './rsi-view.mjs';
for(const root of document.querySelectorAll('[data-rsi]')){
 const key=root.dataset.rsi,zh=document.documentElement.lang.startsWith('zh'),input=root.querySelector('[data-rsi-input]'),view=root.querySelector('[data-rsi-view]'),preset=root.querySelector('[data-rsi-case]'),parameter=root.querySelector('[data-rsi-parameter]'),focus=root.querySelector('[data-rsi-focus]');
 let data=structuredClone(examples[key].basic);
 const draw=()=>{let valid=false;try{const v=trace(key,data);valid=true;focus.max=Math.max(0,v.rows.length-1);focus.value=Math.min(Number(focus.value),Number(focus.max));view.innerHTML=renderTrace(v,zh,Number(focus.value));focus.disabled=!v.rows.length;}catch{view.innerHTML=`<p class="rsi-error" role="alert">${esc(tr(labels.error,zh))}</p>`;focus.max=0;focus.value=0;focus.disabled=true;}input.value=JSON.stringify(data,null,2);if(parameter){parameter.value=data?.[parameters[key][0]]??'';parameter.disabled=preset.value==='invalid'||!data||typeof data!=='object';}};
 for(const control of root.querySelectorAll('button,input,select,textarea'))control.disabled=false;
 preset.addEventListener('change',()=>{data=structuredClone(examples[key][preset.value]);focus.value=0;draw();});
 parameter?.addEventListener('input',()=>{const raw=parameter.value;data[parameters[key][0]]=raw===''?null:Number(raw);draw();});
 focus.addEventListener('input',draw);
 root.querySelector('[data-rsi-reset]').addEventListener('click',()=>{preset.value='basic';data=structuredClone(examples[key].basic);focus.value=0;draw();});
 root.querySelector('[data-rsi-apply]').addEventListener('click',()=>{try{data=JSON.parse(input.value);draw();}catch{view.innerHTML=`<p class="rsi-error" role="alert">${esc(tr(labels.error,zh))}</p>`;}});
 draw();
}
