import {renderConceptFlow} from './concept-flow-view.mjs';
import {renderAgentTrace,agentTracePresets} from './concept-agent-view.mjs';
const root=document.querySelector('[data-concept-flow]');
if(root){
 const time=root.querySelector('#cf-time'),label=root.querySelector('#cf-time-value'),view=root.querySelector('#cf-view'),reset=root.querySelector('#cf-reset'),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{label.textContent=time.value;view.innerHTML=renderConceptFlow(Number(time.value),zh);};
 time.addEventListener('input',update);reset.addEventListener('click',()=>{time.value='0.3';update();});time.disabled=false;reset.disabled=false;update();
}
const agent=document.querySelector('[data-concept-agent]');
if(agent){
 const preset=agent.querySelector('#ca-preset'),cursor=agent.querySelector('#ca-cursor'),reset=agent.querySelector('#ca-reset'),view=agent.querySelector('#ca-view'),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{view.innerHTML=renderAgentTrace(preset.value,Number(cursor.value),zh);};
 preset.addEventListener('change',()=>{cursor.max=String(agentTracePresets[preset.value].events.length);cursor.value='0';cursor.disabled=Number(cursor.max)===0;update();});
 cursor.addEventListener('input',update);reset.addEventListener('click',()=>{cursor.value='0';update();cursor.focus();});
 preset.disabled=false;cursor.disabled=false;reset.disabled=false;update();
}
