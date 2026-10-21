import {renderGenerativeExample,generativeSamples} from './concept-generative-view.mjs';
const root=document.querySelector('[data-generative-course]');
if(root){
 const directory=root.querySelector('.ct-directory');if(directory&&matchMedia('(max-width:850px)').matches)directory.open=false;
 for(const experiment of root.querySelectorAll('[data-generative-example]')){
  const kind=experiment.dataset.generativeExample,select=experiment.querySelector('select'),reset=experiment.querySelector('[data-cg-reset]'),view=experiment.querySelector('[data-cg-view]'),zh=document.documentElement.lang==='zh-CN';
  const update=()=>{view.innerHTML=renderGenerativeExample(kind,select.value,zh);};
  select.addEventListener('change',update);reset.addEventListener('click',()=>{select.value=Object.keys(generativeSamples[kind])[0];update();});select.disabled=false;reset.disabled=false;update();
 }
}
