import {layoutPresets,headChoices,splitTrace,mergeTrace,crossPresets,crossTrace} from './lesson-round11-math.mjs';
import {renderLayout,renderCross} from './lesson-round11-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound11Lesson(root){
 const kind=root.dataset.lesson;if(!['heads-split','heads-merge','cross-sequences'].includes(kind))return;
 const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';let selected=0;
 const update=()=>{
  if(kind==='cross-sequences'){
   const p=crossPresets[$('#cross-preset').value],scale=Number($('#cross-scale').value),inspector=$('#cross-inspect'),old=Number(inspector.value)||0;
   inspector.replaceChildren(...p.queries.map((_,i)=>new Option('q'+i,String(i))));inspector.value=String(Math.min(old,p.queries.length-1));
   $('#cross-scale-value').textContent=f(scale);
   $('#cross-view').innerHTML=renderCross(crossTrace(p.queries.map(q=>q.map(x=>x*scale)),p.keys,p.values),Number(inspector.value),zh);
  }else{
   const tokens=layoutPresets[$('#head-preset').value],count=$('#head-count'),choices=headChoices(tokens),old=Number(count.value);
   count.replaceChildren(...choices.map(h=>new Option(String(h),String(h))));count.value=String(choices.includes(old)?old:choices[0]);
   const tr=splitTrace(tokens,Number(count.value));selected=Math.min(selected,Math.max(0,tr.mapping.length-1));
   $('#heads-view').innerHTML=renderLayout(kind==='heads-split'?tr:mergeTrace(tr.heads),kind==='heads-split'?'split':'merge',selected,zh);
   root.querySelectorAll('[data-layout-cell]').forEach(e=>e.disabled=false);
  }
 };
 root.querySelectorAll('select').forEach(e=>e.addEventListener('change',()=>{if(e.id==='head-preset')selected=0;update();}));
 root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
 root.addEventListener('click',event=>{
  const cell=event.target.closest('[data-layout-cell]');if(!cell)return;
  const position=[...root.querySelectorAll('[data-layout-cell]')].indexOf(cell);selected=Number(cell.dataset.layoutCell);update();
  root.querySelectorAll('[data-layout-cell]')[position]?.focus({preventScroll:true});
 });
 $('[data-reset-lesson]').addEventListener('click',()=>{
  if(kind==='cross-sequences'){
   $('#cross-preset').value='basic';$('#cross-scale').value='1';$('#cross-inspect').replaceChildren(new Option('q0','0'),new Option('q1','1'));$('#cross-inspect').value='0';
  }else{
   $('#head-preset').value='basic';$('#head-count').replaceChildren(new Option('2','2'));$('#head-count').value='2';selected=0;
  }update();
 });update();
}
