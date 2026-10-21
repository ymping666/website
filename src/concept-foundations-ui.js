import {renderFoundationsExample,foundationsSamples} from './concept-foundations-view.mjs';
const root=document.querySelector('[data-foundations-course]');
if(root){
 const directory=root.querySelector('.ct-directory');if(directory&&matchMedia('(max-width:850px)').matches)directory.open=false;
 for(const experiment of root.querySelectorAll('[data-foundations-example]')){
  const kind=experiment.dataset.foundationsExample,select=experiment.querySelector('select'),reset=experiment.querySelector('[data-cn-reset]'),view=experiment.querySelector('[data-cn-view]'),zh=document.documentElement.lang==='zh-CN';
  const update=()=>{view.innerHTML=renderFoundationsExample(kind,select.value,zh);};
  select.addEventListener('change',update);reset.addEventListener('click',()=>{select.value=Object.keys(foundationsSamples[kind])[0];update();});select.disabled=false;reset.disabled=false;update();
 }
}
