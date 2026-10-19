import {presets,fromPreset} from './lesson-round25-math.mjs';
import {renders,L,renderInvalid} from './lesson-round25-view.mjs';
export function mountRound25Lesson(root){
 if(!root.dataset.lesson.startsWith('r25-'))return;
 const kind=root.dataset.lesson.slice(4),zh=document.documentElement.lang==='zh-CN',$=key=>root.querySelector('#r25-'+kind+'-'+key);let outcomes=[];
 function update(){
  const p=structuredClone(presets[kind][$('preset').value]);let tr;
  if(kind==='backoff'){p.outcomes=outcomes;p.base=Number($('base').value);$('cap').min=String(p.base);p.cap=Number($('cap').value);for(const k of ['base','cap'])$(k+'-value').textContent=$(k).value;}
  if(kind==='merge')$('progress-value').textContent=$('progress').value;
  try{tr=fromPreset(kind,p,kind==='merge'?Number($('progress').value):undefined);}catch(e){if(!(e instanceof RangeError))throw e;$('view').innerHTML=renderInvalid(zh);return;}
  const items=tr.gates?tr.gates.map((g,i)=>[i,L(g.key,zh)]):tr.rows.map((_,i)=>[i,'i='+i]),old=Number($('index').value)||0,index=items.length?Math.min(old,items.length-1):0;
  $('index').replaceChildren(...items.map(([i,label])=>new Option(label,String(i))));$('index').disabled=items.length===0;if(items.length)$('index').value=String(index);
  if(kind==='merge')$('progress').disabled=p.responses.length===0;
  $('view').innerHTML=renders[kind](tr,index,zh);
 }
 function setPreset(){const p=presets[kind][$('preset').value];$('index').replaceChildren(new Option('0','0'));
  if(kind==='merge'){$('progress').max=String(p.responses.length);$('progress').value=String(p.responses.length);}
  if(kind==='backoff'){outcomes=[...p.outcomes];$('cap').min=String(p.base);for(const k of ['base','cap'])$(k).value=String(p[k]);$('flags').replaceChildren(...outcomes.map((v,i)=>{const label=document.createElement('label'),input=document.createElement('input');label.className='r25-flag';input.type='checkbox';input.dataset.r25Success=String(i);input.checked=v;input.addEventListener('change',()=>{outcomes[i]=input.checked;update();});label.append(input,document.createTextNode('i='+i+' · '+(zh?'标记本次调用成功':'Mark this call as successful')));return label;}));}
  update();
 }
 $('preset').addEventListener('change',setPreset);$('index').addEventListener('change',update);
 if(kind==='merge')$('progress').addEventListener('input',update);if(kind==='backoff')for(const key of ['base','cap'])$(key).addEventListener('input',update);
 root.querySelector('[data-reset-lesson]').addEventListener('click',()=>{$('preset').value='basic';setPreset();});setPreset();
}
