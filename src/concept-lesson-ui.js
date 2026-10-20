import {renderConceptFlow} from './concept-flow-view.mjs';
const root=document.querySelector('[data-concept-flow]');
if(root){
 const time=root.querySelector('#cf-time'),label=root.querySelector('#cf-time-value'),view=root.querySelector('#cf-view'),reset=root.querySelector('#cf-reset'),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{label.textContent=time.value;view.innerHTML=renderConceptFlow(Number(time.value),zh);};
 time.addEventListener('input',update);reset.addEventListener('click',()=>{time.value='0.3';update();});time.disabled=false;reset.disabled=false;update();
}
