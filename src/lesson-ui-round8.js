import {codebooks,distortionPresets,nearestTrace,usageTrace,indicesFromCounts,distortionInputs,distortionTrace} from './lesson-round8-math.mjs';
import {renderNearest,renderUsage,renderDistortion} from './lesson-round8-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound8Lesson(root){
  const $=s=>root.querySelector(s),zh=document.documentElement.lang==='zh-CN';
  const value=id=>Number($('#'+id).value),show=id=>$('#'+id+'-value').textContent=f(value(id));
  const handlers={
    'vq-nearest':()=>{
      const book=codebooks[$('#vq-codebook').value];show('vq-x');show('vq-y');
      $('#vq-nearest-view').innerHTML=renderNearest(nearestTrace(book[0].length?[value('vq-x'),value('vq-y')]:[],book),zh);
    },
    'vq-usage':()=>{
      const counts=[0,1,2,3].map(k=>{show('vq-count-'+k);return value('vq-count-'+k);});
      $('#vq-usage-view').innerHTML=renderUsage(usageTrace(indicesFromCounts(counts,value('vq-usage-repeat')),value('vq-ncodes')),zh);
    },
    'vq-distortion':()=>{
      show('vq-residual-scale');const pair=distortionInputs(distortionPresets[$('#vq-error-preset').value],value('vq-residual-scale'),value('vq-row-repeat'),value('vq-feature-repeat'));
      $('#vq-distortion-view').innerHTML=renderDistortion(distortionTrace(pair.encoder,pair.quantized),zh);
    }
  };
  const update=handlers[root.dataset.lesson];if(!update)return;
  root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
  root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));
  root.querySelectorAll('[data-usage-preset]').forEach(button=>button.addEventListener('click',()=>{
    const counts={uniform:[2,2,2,2],collapsed:[8,0,0,0],empty:[0,0,0,0]}[button.dataset.usagePreset];
    counts.forEach((c,k)=>$('#vq-count-'+k).value=String(c));update();
  }));
  $('[data-reset-lesson]').addEventListener('click',()=>{
    const defaults={
      'vq-nearest':{'vq-codebook':'square','vq-x':'1.5','vq-y':'0.5'},
      'vq-usage':{'vq-count-0':'4','vq-count-1':'2','vq-count-2':'1','vq-count-3':'1','vq-ncodes':'4','vq-usage-repeat':'1'},
      'vq-distortion':{'vq-error-preset':'mixed','vq-residual-scale':'1','vq-row-repeat':'1','vq-feature-repeat':'1'}
    };
    for(const [id,v] of Object.entries(defaults[root.dataset.lesson]))$('#'+id).value=v;update();
  });update();
}
