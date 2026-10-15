import {latentPresets,klPresets,pixelPresets,contributionPresets,sampleTrace,klTrace,betaTrace} from './lesson-round7-math.mjs';
import {renderSample,renderKL,renderBeta} from './lesson-round7-view.mjs';
import {formatNumber as f} from './lesson-math.mjs';
export function mountRound7Lesson(root) {
  const $ = s => root.querySelector(s), zh = document.documentElement.lang === 'zh-CN';
  const handlers = {
    'vae-sample': () => {
      const p = latentPresets[$('#vae-sample-preset').value], scale = Number($('#vae-epsilon-scale').value);
      $('#vae-epsilon-scale-value').textContent = f(scale);
      $('#vae-sample-view').innerHTML = renderSample(sampleTrace(p.mu,p.logvar,p.epsilon.map(e=>e*scale)),zh);
    },
    'vae-kl': () => {
      const p = klPresets[$('#vae-kl-preset').value], shift = Number($('#vae-kl-shift').value), scale = Number($('#vae-kl-variance-scale').value);
      $('#vae-kl-shift-value').textContent = f(shift);
      $('#vae-kl-view').innerHTML = renderKL(klTrace(p.mu.map(m=>m+shift),p.logvar.map(lv=>lv+Math.log(scale))),zh);
    },
    'vae-beta': () => {
      const beta = Number($('#vae-beta-weight').value);
      $('#vae-beta-weight-value').textContent = f(beta);
      $('#vae-beta-view').innerHTML = renderBeta(betaTrace(pixelPresets[$('#vae-beta-pixels').value],contributionPresets[$('#vae-beta-latents').value],beta),zh);
    }
  };
  const update = handlers[root.dataset.lesson]; if (!update) return;
  root.querySelectorAll('input').forEach(e=>e.addEventListener('input',update));
  root.querySelectorAll('select').forEach(e=>e.addEventListener('change',update));
  $('[data-reset-lesson]').addEventListener('click',()=>{
    const defaults = {
      'vae-sample': {'vae-sample-preset':'mixed','vae-epsilon-scale':'1'},
      'vae-kl': {'vae-kl-preset':'mixed','vae-kl-shift':'0','vae-kl-variance-scale':'1'},
      'vae-beta': {'vae-beta-pixels':'typical','vae-beta-latents':'typical','vae-beta-weight':'2'}
    };
    for (const [id,value] of Object.entries(defaults[root.dataset.lesson])) $('#'+id).value=value;
    update();
  });
  update();
}
