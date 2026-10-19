import {presets,fromPreset,returnTrace,initialIndex} from './lesson-round24-math.mjs';
import {renders,renderInvalid} from './lesson-round24-view.mjs';
export function mountRound24Lesson(root){
 if(!root.dataset.lesson.startsWith('r24-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r24-'+kind+'-'+key),key={train:'eps',eval:'companion',adam:'decay',noise:'noise',return:'gamma'}[kind];let flags=[];
 const sync=()=>{for(const k of kind==='return'?['gamma','bootstrap']:[key])if($(k+'-value'))$(k+'-value').textContent=$(k).value;};
 function update(resetIndex=false){const p=presets[kind][$('preset').value];let tr,index=Number($('index')?.value)||0;sync();
  try{tr=$('preset').value==='invalid'?fromPreset(kind,p):kind==='return'?returnTrace(p.rewards,flags,Number($('gamma').value),Number($('bootstrap').value)):fromPreset(kind,p,Number($(key).value),kind==='noise'?$('final').checked:undefined);}catch(e){if(!(e instanceof RangeError))throw e;$(key).disabled=true;if($('index')){$('index').replaceChildren();$('index').disabled=true;}if(kind==='noise')$('final').disabled=true;if(kind==='return'){$('bootstrap').disabled=true;root.querySelectorAll('[data-r24-terminal]').forEach(e=>e.disabled=true);}$('view').innerHTML=renderInvalid(zh);return;}
  if(resetIndex===true)index=initialIndex(kind,tr);if($('index')){index=tr.rows.length?Math.min(index,tr.rows.length-1):0;$('index').replaceChildren(...tr.rows.map((r,i)=>new Option(kind==='return'?'t='+r.i:'('+r.i+','+r.j+')',String(i))));$('index').disabled=!tr.rows.length;if(tr.rows.length)$('index').value=String(index);}
  $(key).disabled=kind==='eval'?tr.b<2||!tr.d:kind==='train'||kind==='return'?!tr.rows.length:false;if(kind==='noise')$('final').disabled=false;if(kind==='return'){$('bootstrap').disabled=false;root.querySelectorAll('[data-r24-terminal]').forEach(e=>e.disabled=false);}
  $('view').innerHTML=renders[kind](tr,index,zh);
 }
 function setPreset(){const p=presets[kind][$('preset').value];$(key).value=String(kind==='train'?p.eps:kind==='eval'?0:kind==='adam'?p.decay:kind==='noise'?p.noise:p.gamma);
  if(kind==='noise')$('final').checked=p.timestep===0;
  if(kind==='return'){flags=[...p.terminals];$('bootstrap').value=String(p.bootstrap);$('terminals').replaceChildren(...flags.map((v,i)=>{const label=document.createElement('label'),input=document.createElement('input');label.className='r24-flag';input.type='checkbox';input.dataset.r24Terminal=String(i);input.checked=v;input.addEventListener('change',()=>{flags[i]=input.checked;update();});label.append(input,document.createTextNode((zh?'此奖励之后终止':'Terminal after reward')+' t='+i));return label;}));}
  update(true);
 }
 $('preset').addEventListener('change',setPreset);$('index')?.addEventListener('change',update);$(key).addEventListener(kind==='train'?'change':'input',update);if(kind==='noise')$('final').addEventListener('change',update);if(kind==='return')$('bootstrap').addEventListener('input',update);root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';setPreset();});setPreset();
}
