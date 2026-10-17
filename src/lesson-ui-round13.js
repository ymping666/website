import {episodePresets,episodeTrace,rewardStates,tokenPresets,rewardTrace,advantagePresets,advantageTrace} from './lesson-round13-math.mjs';
import {renderEpisode,renderReward,renderAdvantages} from './lesson-round13-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound13Lesson(root){
 const kind=root.dataset.lesson;if(!['rlef-episode','rlef-reward','rlef-advantages'].includes(kind))return;
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';let history=[...episodePresets.repair];
 const update=()=>{
  if(kind==='rlef-episode'){
   const limit=Number($('#episode-limit').value),tr=episodeTrace(history,limit);$('#episode-limit-value').textContent=f(limit);
   root.querySelectorAll('[data-episode-feedback]').forEach(e=>e.disabled=tr.output!=='retry');$('[data-episode-undo]').disabled=history.length===0;
   $('#episode-view').innerHTML=renderEpisode(tr,zh);
  }else if(kind==='rlef-reward'){
   const state=rewardStates[$('#reward-state').value],tokens=tokenPresets[$('#reward-tokens').value],repeat=Number($('#reward-repeat').value),beta=Number($('#reward-beta').value);
   const repeated=xs=>Array.from({length:repeat},()=>xs).flat();$('#reward-beta-value').textContent=f(beta);
   $('#reward-view').innerHTML=renderReward(rewardTrace(...state,repeated(tokens.policy),repeated(tokens.reference),beta),zh);
  }else{
   const p=advantagePresets[$('#advantages-preset').value],inspector=$('#advantages-step'),old=Number(inspector.value)||0,shift=Number($('#advantages-shift').value);
   inspector.replaceChildren(...p.rewards.map((_,i)=>new Option('t'+i,String(i))));inspector.disabled=p.rewards.length===0;
   if(p.rewards.length)inspector.value=String(Math.min(old,p.rewards.length-1));$('#advantages-shift-value').textContent=f(shift);
   $('#advantages-view').innerHTML=renderAdvantages(advantageTrace(p.rewards,p.values.map(v=>v+shift)),p.rewards.length?Number(inspector.value):0,zh);
  }
 };
 root.querySelectorAll('select').forEach(e=>e.addEventListener('change',()=>{if(e.id==='episode-preset')history=[...episodePresets[e.value]];update();}));
 root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
 root.querySelectorAll('[data-episode-feedback]').forEach(e=>e.addEventListener('click',()=>{history.push(e.dataset.episodeFeedback==='pass');update();}));
 $('[data-episode-undo]')?.addEventListener('click',()=>{history.pop();update();});
 $('[data-reset-lesson]').addEventListener('click',()=>{
  if(kind==='rlef-episode'){$('#episode-preset').value='repair';$('#episode-limit').value='3';history=[...episodePresets.repair];}
  else if(kind==='rlef-reward'){$('#reward-state').value='intermediate';$('#reward-tokens').value='positive';$('#reward-repeat').value='1';$('#reward-beta').value='0.5';}
  else{$('#advantages-preset').value='penalties';$('#advantages-step').replaceChildren(new Option('t0','0'));$('#advantages-shift').value='0';}
  update();
 });update();
}
