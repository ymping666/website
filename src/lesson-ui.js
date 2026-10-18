import { softmaxTrace, attentionTrace, formatNumber as f, formatVector as vector } from './lesson-math.mjs';
import { mountAdditionalLesson } from './lesson-ui-extra.js';
import { mountFrontierLesson } from './lesson-ui-frontier.js';
import { mathText } from './lesson-notation.mjs';
import { mountRound4Lesson } from './lesson-ui-round4.js';
import { mountRound5Lesson } from './lesson-ui-round5.js';
import { mountRound6Lesson } from './lesson-ui-round6.js';
import { mountRound7Lesson } from './lesson-ui-round7.js';
import { mountRound8Lesson } from './lesson-ui-round8.js';
import { mountRound9Lesson } from './lesson-ui-round9.js';
import { mountRound10Lesson } from './lesson-ui-round10.js';
import { mountRound11Lesson } from './lesson-ui-round11.js';
import { mountRound12Lesson } from './lesson-ui-round12.js';
import { mountRound13Lesson } from './lesson-ui-round13.js';
import { mountRound14Lesson } from './lesson-ui-round14.js';
import { mountRound15Lesson } from './lesson-ui-round15.js';
import { mountRound16Lesson } from './lesson-ui-round16.js';

const root = document.querySelector('[data-lesson]');
const zh = document.documentElement.lang === 'zh-CN';
const text = (en, cn) => zh ? cn : en;
const $ = selector => root.querySelector(selector);
const set = (selector, value) => { $(selector).textContent = value; };
const codeCell = (tag, value, stage) => {
  const cell = document.createElement(tag), code = document.createElement('code');
  code.textContent = value; cell.append(code);
  if (stage) cell.dataset.stage = stage;
  return cell;
};
function updateBars(selector, probabilities) {
  for (const [i, row] of [...$(selector).children].entries()) {
    row.querySelector('.probability-track span').style.width = `${probabilities[i] * 100}%`;
    row.querySelector('output').textContent = `${(probabilities[i] * 100).toFixed(2)}%`;
  }
}

if (root) {
  for (const control of root.querySelectorAll('input,button,select')) control.disabled = false;
  if (root.dataset.lesson === 'softmax') {
    const update = () => {
      const offset = Number($('#soft-offset').value), temperature = Number($('#soft-temperature').value);
      const trace = softmaxTrace([0, 1, 2].map(x => x + offset), temperature);
      set('#soft-offset-value', f(offset)); set('#soft-temperature-value', f(temperature));
      const rows = trace.logits.map((x, i) => {
        const row = document.createElement('tr');
        row.append(...[x, trace.scaled[i], trace.shifted[i], trace.exponentials[i], trace.probabilities[i]].map(n => codeCell('td', f(n))));
        return row;
      });
      $('#soft-trace').replaceChildren(...rows);
      const overflows = trace.scaled.some(x => !Number.isFinite(Math.exp(x)));
      const warning = $('#soft-naive-status');
      warning.classList.toggle('finite', !overflows);
      warning.textContent = overflows
        ? text('Direct exp(z): overflow. Shifted exp(z − max(z)): finite.', '直接计算 exp(z)：溢出。平移后计算 exp(z − max(z))：有限。')
        : text('Direct exp(z) is finite for this setting. Shifting still gives the same exact distribution.', '当前设置直接计算 exp(z) 为有限值；统一平移仍给出相同的精确分布。');
      updateBars('#soft-bars', trace.probabilities);
      set('#soft-sum', f(trace.probabilities.reduce((a, b) => a + b, 0)));
    };
    for (const control of root.querySelectorAll('input')) control.addEventListener('input', update);
    $('[data-reset-lesson]').addEventListener('click', () => { $('#soft-offset').value = '1000'; $('#soft-temperature').value = '1'; update(); });
    update();
  } else if (root.dataset.lesson === 'attention') {
    let activeStep = 1;
    const notes = [
      text('Dot products: q · [1, 0] = q₁ and q · [0, 1] = q₂. Changing a query component changes how it matches each key.', '点积：q · [1, 0] = q₁，q · [0, 1] = q₂。改变 query 的分量，就会改变它与每个 key 的匹配分数。'),
      text('Scale both scores by √2 because each key has two components. This is not division by the sum of scores.', '每个 key 有两个分量，所以两个分数都除以 √2；不是除以分数的总和。'),
      text('Subtract the largest scaled score, exponentiate, then normalize across keys. The two nonnegative weights sum to 1.', '减去缩放后分数的最大值，再求指数，最后沿 key 归一化。两个非负权重的总和为 1。'),
      text('Multiply each whole value vector by its weight, then add component by component. The output is a value mixture, not a probability distribution.', '用权重乘整个 value 向量，再逐分量相加。输出是值向量的组合，不是概率分布。')
    ];
    const selectStep = (step, reveal = false) => {
      activeStep = step;
      $('.attention-trace').dataset.activeStep = step;
      for (const button of root.querySelectorAll('[data-attention-step]')) button.setAttribute('aria-pressed', String(Number(button.dataset.attentionStep) === step));
      $('#attention-step-note').innerHTML = mathText(notes[step - 1]);
      if (reveal) {
        const table = $('.attention-trace'), container = table.parentElement;
        if (container.scrollWidth > container.clientWidth) {
          const cell = table.querySelector(`th[data-stage="${step}"]`);
          const left = cell.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
          container.scrollLeft = Math.max(0, left - 10);
        }
      }
    };
    const update = () => {
      const query = [Number($('#attention-q1').value), Number($('#attention-q2').value)];
      const trace = attentionTrace(query);
      query.forEach((x, i) => set(`#attention-q${i + 1}-value`, f(x)));
      const rows = trace.keys.map((key, i) => {
        const row = document.createElement('tr');
        row.append(codeCell('th', `k${i + 1}=${vector(key)}\nv${i + 1}=${vector(trace.values[i])}`),
          codeCell('td', f(trace.dots[i]), '1'), codeCell('td', f(trace.scores[i]), '2'),
          codeCell('td', f(trace.probabilities[i]), '3'), codeCell('td', vector(trace.contributions[i]), '4'));
        return row;
      });
      $('#attention-trace').replaceChildren(...rows);
      updateBars('#attention-bars', trace.probabilities);
      trace.contributions.forEach((part, i) => set(`#attention-part${i + 1}`, vector(part)));
      set('#attention-output', vector(trace.output));
      selectStep(activeStep);
    };
    const setQuery = query => { query.forEach((x, i) => { $(`#attention-q${i + 1}`).value = String(x); }); update(); };
    for (const control of root.querySelectorAll('input')) control.addEventListener('input', update);
    for (const button of root.querySelectorAll('[data-query]')) button.addEventListener('click', () => setQuery(button.dataset.query.split(',').map(Number)));
    for (const button of root.querySelectorAll('[data-attention-step]')) button.addEventListener('click', () => selectStep(Number(button.dataset.attentionStep), true));
    $('[data-reset-lesson]').addEventListener('click', () => { activeStep = 1; setQuery([2, 0]); selectStep(1, true); });
    update();
  } else {
    mountAdditionalLesson(root);
    mountFrontierLesson(root);
    mountRound4Lesson(root);
    mountRound5Lesson(root);
    mountRound6Lesson(root);
    mountRound7Lesson(root);
    mountRound8Lesson(root);
    mountRound9Lesson(root);
    mountRound10Lesson(root);
    mountRound11Lesson(root);
    mountRound12Lesson(root);
    mountRound13Lesson(root);
    mountRound14Lesson(root);
    mountRound15Lesson(root);
    mountRound16Lesson(root);
  }
}
