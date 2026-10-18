import {mathMarkup} from './math-expression.mjs';

// A focused statement layout; executable examples and contracts stay in the catalog.
export const gateStatementTranslations = {
  'Function to implement':'实现函数',
  'Parameters':'参数说明',
  'Parameter':'参数',
  'Meaning':'含义',
  'Residual input':'残差输入',
  'Output already produced by the Transformer sub-layer':'Transformer 子层已计算好的输出',
  'Per-element multiplier for the block output':'模块输出各元素的乘数',
  'Core calculation':'核心计算',
  'For each index i:':'对每个索引 i：',
  'In the formula:':'公式符号：',
  'Required behavior':'边界要求',
  'Return a new vector of the same length. Empty inputs return an empty list.':'返回一个相同长度的新向量。输入均为空时，返回空列表。',
  'Function call':'函数调用',
  'Zero gate keeps the residual input unchanged.':'门控为零，保留原始残差输入。',
  'A gate of one adds the full block output.':'门控为一，加上完整的模块输出。'
};

export function renderGateStatement(p, examples, e) {
  if (p.id !== 'dit-adaln-zero-gate') return '';
  const parameters = [
    ['x', 'Residual input'],
    ['block_output', 'Output already produced by the Transformer sub-layer'],
    ['gate', 'Per-element multiplier for the block output']
  ];
  return `<div class="gate-statement">
    <p class="gate-intro">${e(p.description)}</p>
    <section class="gate-section" aria-labelledby="gate-function-title">
      <h2 id="gate-function-title">Function to implement</h2>
      <div class="gate-signature"><pre><code>def ${e(p.signature.split('(')[0])}(
    x, block_output, gate
):</code></pre></div>
    </section>
    <section class="gate-section" aria-labelledby="gate-calculation-title">
      <h2 id="gate-calculation-title">Task specification</h2>
      <p>${e(p.requirements[0])}</p>
      <ul class="gate-parameters">${parameters.map(([name, meaning])=>`<li><code>${name}</code><span class="gate-parameter-separator" aria-hidden="true"> — </span><span>${meaning}</span></li>`).join('')}</ul>
      <p class="gate-calculation"><span>For each index i:</span> <span class="gate-equation-source">${e(p.requirements[1])}</span></p>
      <p class="gate-symbols"><span>In the formula:</span> <span><var>g</var> = <code>gate</code></span><span><var>b</var> = <code>block_output</code></span></p>
      <p>${e(p.requirements[2])}</p>
      <p>Return a new vector of the same length. Empty inputs return an empty list.</p>
    </section>
    <section class="gate-section gate-examples" aria-labelledby="gate-examples-title">
      <h2 id="gate-examples-title">Examples</h2>
      ${p.tests.slice(0, 2).map((test,i)=>`<article class="gate-example"><h3>Example ${i+1} — ${e(test.name)}</h3><p>${i===0?'Zero gate keeps the residual input unchanged.':'A gate of one adds the full block output.'}</p>${examples[i].map(call=>{
        // Only reflow these known Python keyword arguments; keep the call inspectable.
        const formatted=call.input.replace('(x=', '(\n    x=').replace(', block_output=', ',\n    block_output=').replace(', gate=', ',\n    gate=').replace(/\)$/, '\n)');
        return `<dl class="gate-example-io"><dt>Input</dt><dd><pre><code>${e(formatted)}</code></pre></dd><dt>Expected output</dt><dd class="gate-output"><samp>${e(call.output)}</samp></dd></dl>`;
      }).join('')}<details class="example-assertion"><summary>View test assertion</summary><pre><code>${e(test.code)}</code></pre></details></article>`).join('')}
    </section>
  </div>`;
}

// Run after localization. Keep the complete authored requirement as reversible,
// accessible notation, while the nearby legend defines the compact math symbols.
export function typesetGateCalculation(html) {
  const sub=name=>`<msub><mi>${name}</mi><mi>i</mi></msub>`;
  const body=`<mrow>${sub('y')}<mo>=</mo>${sub('x')}<mo>+</mo>${sub('g')}<mo>·</mo>${sub('b')}</mrow>`;
  return html.replace(/<span class="gate-equation-source">([^<]+)<\/span>/g,(_,source)=>`<span class="gate-equation-source">${mathMarkup(body,source)}</span>`);
}
