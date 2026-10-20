import {renderTransformerExample,transformerSamples} from './concept-transformer-view.mjs';
const root=document.querySelector('[data-transformer-course]');
if(root){
 const directory=root.querySelector('.ct-directory');if(matchMedia('(max-width: 850px)').matches)directory.open=false;
 const experiment=root.querySelector('[data-transformer-example]');
 if(experiment){const kind=experiment.dataset.transformerExample,select=experiment.querySelector('#ct-example'),reset=experiment.querySelector('#ct-reset'),view=experiment.querySelector('#ct-example-view'),zh=document.documentElement.lang==='zh-CN',first=Object.keys(transformerSamples[kind])[0];const update=()=>{view.innerHTML=renderTransformerExample(kind,select.value,zh);};select.addEventListener('change',update);reset.addEventListener('click',()=>{select.value=first;update();});select.disabled=false;reset.disabled=false;update();}
}
