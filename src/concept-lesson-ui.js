import {renderConceptFlow} from './concept-flow-view.mjs';
import {renderAgentTrace,agentTracePresets} from './concept-agent-view.mjs';
import {renderStateCorrection,statePresets} from './concept-state-view.mjs';
const root=document.querySelector('[data-concept-flow]');
if(root){
 const time=root.querySelector('#cf-time'),label=root.querySelector('#cf-time-value'),view=root.querySelector('#cf-view'),reset=root.querySelector('#cf-reset'),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{label.textContent=time.value;view.innerHTML=renderConceptFlow(Number(time.value),zh);};
 time.addEventListener('input',update);reset.addEventListener('click',()=>{time.value='0.3';update();});time.disabled=false;reset.disabled=false;update();
}
const state=document.querySelector('[data-concept-state]');
if(state){
 const preset=state.querySelector('#cs-preset'),reset=state.querySelector('#cs-reset'),view=state.querySelector('#cs-view'),zh=document.documentElement.lang==='zh-CN',controls=Object.fromEntries(['p','r','z'].map(key=>[key,state.querySelector('#cs-'+key)]));
 const update=()=>{for(const[key,input]of Object.entries(controls))state.querySelector('#cs-'+key+'-value').textContent=input.value;view.innerHTML=renderStateCorrection(...['p','r','z'].map(key=>Number(controls[key].value)),zh);};
 const apply=key=>{for(const name of ['p','r','z'])controls[name].value=String(statePresets[key][name]);update();};
 preset.addEventListener('change',()=>apply(preset.value));reset.addEventListener('click',()=>{preset.value='balanced';apply('balanced');});
 for(const input of Object.values(controls)){input.addEventListener('input',()=>{preset.value='custom';update();});input.disabled=false;}
 preset.disabled=false;reset.disabled=false;update();
}
const agent=document.querySelector('[data-concept-agent]');
if(agent){
 const preset=agent.querySelector('#ca-preset'),cursor=agent.querySelector('#ca-cursor'),reset=agent.querySelector('#ca-reset'),view=agent.querySelector('#ca-view'),zh=document.documentElement.lang==='zh-CN';
 const update=()=>{view.innerHTML=renderAgentTrace(preset.value,Number(cursor.value),zh);};
 preset.addEventListener('change',()=>{cursor.max=String(agentTracePresets[preset.value].events.length);cursor.value='0';cursor.disabled=Number(cursor.max)===0;update();});
 cursor.addEventListener('input',update);reset.addEventListener('click',()=>{cursor.value='0';update();cursor.focus();});
 preset.disabled=false;cursor.disabled=false;reset.disabled=false;update();
}
