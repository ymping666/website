import { convolutionTrace, convolutionKernels, ropeTrace, ropeVectors, diffusionTrace, diffusionExamples, formatNumber as f, formatVector as vector } from './lesson-math.mjs';
import { ropeDiagram, diffusionDiagram } from './lesson-diagrams.mjs';

export function mountAdditionalLesson(root) {
  const $ = selector => root.querySelector(selector);
  const set = (selector, value) => { $(selector).textContent = value; };
  const rows = (selector, data) => {
    $(selector).replaceChildren(...data.map(values => {
      const row = document.createElement('tr');
      row.append(...values.map(value => {
        const cell = document.createElement('td'), code = document.createElement('code');
        code.textContent = value; cell.append(code); return cell;
      }));
      return row;
    }));
  };
  if (root.dataset.lesson === 'convolution') {
    const update = () => {
      const index = Number($('#conv-position').value), row = Math.floor(index / 2), column = index % 2;
      const trace = convolutionTrace(undefined, convolutionKernels[$('#conv-kernel').value], row, column);
      set('#conv-position-value', vector([row, column]));
      for (const cell of root.querySelectorAll('[data-image-row]')) {
        const i = Number(cell.dataset.imageRow), j = Number(cell.dataset.imageColumn);
        cell.classList.toggle('is-window', i >= row && i < row + 2 && j >= column && j < column + 2);
      }
      for (const [i, cell] of [...$('#conv-kernel-grid').children].entries()) cell.textContent = trace.kernel.flat()[i];
      for (const [i, button] of [...$('#conv-output-grid').children].entries()) {
        button.textContent = trace.output.flat()[i];
        button.setAttribute('aria-pressed', String(i === index));
      }
      rows('#conv-products', trace.terms.map(v => [`X[${v.imageRow},${v.imageColumn}]`, `${v.input} × (${v.weight})`, f(v.product)]));
      set('#conv-output-label', `Y[${row},${column}]`); set('#conv-sum', f(trace.value));
    };
    $('#conv-position').addEventListener('input', update);
    $('#conv-kernel').addEventListener('change', update);
    for (const button of root.querySelectorAll('[data-conv-cell]')) button.addEventListener('click', () => { $('#conv-position').value = button.dataset.convCell; update(); });
    $('[data-reset-lesson]').addEventListener('click', () => { $('#conv-position').value = '0'; $('#conv-kernel').value = 'asymmetric'; update(); });
    update();
  } else if (root.dataset.lesson === 'rope') {
    const update = () => {
      const degrees = Number($('#rope-angle').value), angle = degrees * Math.PI / 180;
      const trace = ropeTrace(...ropeVectors[$('#rope-vector').value], angle);
      set('#rope-angle-value', `${degrees}°`); set('#rope-radians', f(angle));
      $('#rope-diagram').innerHTML = ropeDiagram(trace);
      rows('#rope-products', [['x′', f(trace.products[0]), f(trace.products[1]), f(trace.output[0])], ['y′', f(trace.products[2]), f(trace.products[3]), f(trace.output[1])]]);
      set('#rope-output', vector(trace.output));
      set('#rope-before-norm', f(trace.inputNorm)); set('#rope-after-norm', f(trace.outputNorm));
    };
    $('#rope-angle').addEventListener('input', update); $('#rope-vector').addEventListener('change', update);
    $('[data-reset-lesson]').addEventListener('click', () => { $('#rope-angle').value = '90'; $('#rope-vector').value = 'axis'; update(); });
    update();
  } else if (root.dataset.lesson === 'diffusion') {
    const update = () => {
      const example = diffusionExamples[$('#diffusion-example').value], alpha = Number($('#diffusion-alpha').value);
      const trace = diffusionTrace(example.x0, example.noise, alpha);
      set('#diffusion-alpha-value', f(alpha));
      set('#diffusion-x0', vector(trace.x0)); set('#diffusion-noise', vector(trace.noise));
      set('#diffusion-signal-scale', f(trace.signalScale)); set('#diffusion-noise-scale', f(trace.noiseScale));
      $('#diffusion-diagram').innerHTML = diffusionDiagram(trace);
      rows('#diffusion-products', trace.output.map((x,i) => [i, trace.x0[i], trace.noise[i], f(trace.signalPart[i]), f(trace.noisePart[i]), f(x)]));
      set('#diffusion-output', vector(trace.output));
    };
    $('#diffusion-alpha').addEventListener('input', update); $('#diffusion-example').addEventListener('change', update);
    $('[data-reset-lesson]').addEventListener('click', () => { $('#diffusion-alpha').value = '0.5'; $('#diffusion-example').value = 'orthogonal'; update(); });
    update();
  }
}
