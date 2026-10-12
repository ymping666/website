import { reactTrace, reactPresets, mpcTrace, mpcPresets, bayesTrace, bayesTransitions } from './lesson-frontier-math.mjs';
import { renderReactState, renderMpcState, renderBayesState } from './lesson-frontier-view.mjs';
import { formatNumber as f } from './lesson-math.mjs';

export function mountFrontierLesson(root) {
  const $ = selector => root.querySelector(selector), zh = document.documentElement.lang === 'zh-CN';
  const value = id => Number($('#'+id).value);
  const display = ids => ids.forEach(id => $('#'+id+'-value').textContent = f(value(id)));
  const reset = $('[data-reset-lesson]');
  if (root.dataset.lesson === 'react') {
    const update = () => {
      const trace = reactTrace(reactPresets[$('#react-preset').value]);
      $('#react-cursor').max = String(trace.steps.length);
      display(['react-cursor']);
      $('#react-view').innerHTML = renderReactState(trace,value('react-cursor'),zh);
    };
    $('#react-preset').addEventListener('change',()=>{ $('#react-cursor').value='0'; update(); });
    $('#react-cursor').addEventListener('input',update);
    reset.addEventListener('click',()=>{ $('#react-preset').value='valid'; $('#react-cursor').value='0'; update(); });
    update();
  } else if (root.dataset.lesson === 'mpc') {
    const update = () => {
      display(['mpc-horizon','mpc-state','mpc-target']);
      const candidates = mpcPresets[$('#mpc-preset').value].map(actions=>actions.slice(0,value('mpc-horizon')));
      $('#mpc-view').innerHTML = renderMpcState(mpcTrace(value('mpc-state'),candidates,value('mpc-target')),value('mpc-target'),zh);
    };
    for (const input of root.querySelectorAll('input')) input.addEventListener('input',update);
    $('#mpc-preset').addEventListener('change',update);
    reset.addEventListener('click',()=>{ $('#mpc-preset').value='lookahead'; $('#mpc-horizon').value='2'; $('#mpc-state').value='0'; $('#mpc-target').value='0'; update(); });
    update();
  } else if (root.dataset.lesson === 'bayes') {
    const update = () => {
      display(['bayes-prior','bayes-la','bayes-lb']);
      const p=value('bayes-prior');
      $('#bayes-view').innerHTML=renderBayesState(bayesTrace([p,1-p],bayesTransitions[$('#bayes-transition').value],[value('bayes-la'),value('bayes-lb')]),zh);
    };
    for (const input of root.querySelectorAll('input')) input.addEventListener('input',update);
    $('#bayes-transition').addEventListener('change',update);
    for (const button of root.querySelectorAll('[data-bayes-preset]')) button.addEventListener('click',()=>{
      $('#bayes-la').value=$('#bayes-lb').value=button.dataset.bayesPreset==='neutral'?'0.5':'0'; update();
    });
    reset.addEventListener('click',()=>{ $('#bayes-prior').value='0.8'; $('#bayes-transition').value='drift'; $('#bayes-la').value='0.25'; $('#bayes-lb').value='0.75'; update(); });
    update();
  }
}
