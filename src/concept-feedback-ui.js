import {renderFeedbackExample,feedbackSamples} from './concept-feedback-view.mjs';
const root=document.querySelector('[data-feedback-course]');
if(root){
 const directory=root.querySelector('.ct-directory');if(directory&&matchMedia('(max-width:850px)').matches)directory.open=false;
 for(const experiment of root.querySelectorAll('[data-feedback-example]')){
  const kind=experiment.dataset.feedbackExample,select=experiment.querySelector('select'),reset=experiment.querySelector('[data-cf-reset]'),view=experiment.querySelector('[data-cf-view]'),zh=document.documentElement.lang==='zh-CN';
  const update=()=>{view.innerHTML=renderFeedbackExample(kind,select.value,zh);};
  select.addEventListener('change',update);reset.addEventListener('click',()=>{select.value=Object.keys(feedbackSamples[kind])[0];update();});select.disabled=false;reset.disabled=false;update();
 }
}
