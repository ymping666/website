import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { softmaxTrace, attentionTrace, convolutionTrace, convolutionKernels, ropeTrace, ropeVectors, diffusionTrace, diffusionExamples } from '../src/lesson-math.mjs';
import { additionalLessonTranslations } from '../src/visual-lessons-extra.mjs';
import { decodeHtml } from './localize.mjs';
import { originalMathText } from '../src/lesson-notation.mjs';
import { problems } from '../src/problems.mjs';
import { siteRoot, siteBase, pythonCommand } from './config.mjs';

const softmax = problems.find(p => p.id === 'stable-softmax');
const attention = problems.find(p => p.id === 'attention-scaled-dot-product');
const cases = [];
for (let offset = 0; offset <= 1000; offset += 100) {
  for (let temperature = 0.5; temperature <= 2; temperature += 0.25) {
    const logits = [0, 1, 2].map(x => x + offset), trace = softmaxTrace(logits, temperature);
    cases.push({ kind: 'softmax', args: [logits, temperature], actual: trace.probabilities });
    assert.ok(Math.abs(trace.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.equal(Math.max(...trace.shifted), 0);
    assert.equal(Math.max(...trace.exponentials), 1);
  }
}
for (let x = -2; x <= 2; x += 0.25) {
  for (let y = -2; y <= 2; y += 0.25) {
    const trace = attentionTrace([x, y]);
    cases.push({ kind: 'attention', args: [trace.query, trace.keys, trace.values], actual: trace.output });
    cases.push({ kind: 'softmax', args: [trace.scores, 1], actual: trace.probabilities });
    assert.ok(trace.output[0] >= 0 && trace.output[0] <= 2);
    assert.ok(trace.output[1] >= 0 && trace.output[1] <= 4);
  }
}
for (const kernel of Object.values(convolutionKernels)) {
  for (let index = 0; index < 4; index++) {
    const trace = convolutionTrace(undefined, kernel, Math.floor(index / 2), index % 2);
    cases.push({ kind: 'convolution', args: [trace.image, kernel], position: [trace.row, trace.column], actual: [...trace.output.flat(), trace.value] });
    assert.equal(trace.terms.reduce((sum, term) => sum + term.product, 0), trace.value);
    assert.equal(trace.terms.length, 4);
    for (const term of trace.terms) {
      assert.equal(term.product, trace.image[term.imageRow][term.imageColumn] * trace.kernel[term.a][term.b]);
    }
  }
}
assert.deepEqual(convolutionTrace().output, [[0, 2], [6, 8]]);
assert.deepEqual(convolutionTrace(undefined, convolutionKernels.sum).output, [[12, 16], [24, 28]]);
assert.deepEqual(convolutionTrace(undefined, convolutionKernels.difference).output, [[-4, -4], [-4, -4]]);
for (const [x, y] of Object.values(ropeVectors)) {
  for (let degrees = -180; degrees <= 180; degrees += 15) {
    const angle = degrees * Math.PI / 180, trace = ropeTrace(x, y, angle);
    cases.push({ kind: 'rope', args: [x, y, angle], actual: trace.output });
    assert.ok(Math.abs(trace.inputNorm - trace.outputNorm) < 1e-12);
    const inverse = ropeTrace(...trace.output, -angle).output;
    assert.ok(Math.abs(inverse[0] - x) < 1e-12 && Math.abs(inverse[1] - y) < 1e-12);
  }
}
for (const { x0, noise } of Object.values(diffusionExamples)) {
  for (let i = 0; i <= 20; i++) {
    const trace = diffusionTrace(x0, noise, i / 20);
    cases.push({ kind: 'diffusion', args: [x0, noise, i / 20], actual: trace.output });
    assert.ok(Math.abs(trace.signalScale ** 2 + trace.noiseScale ** 2 - 1) < 1e-12);
    trace.output.forEach((value, j) => assert.equal(value, trace.signalPart[j] + trace.noisePart[j]));
  }
  assert.deepEqual(diffusionTrace(x0, noise, 1).output, x0);
  assert.deepEqual(diffusionTrace(x0, noise, 0).output, noise);
}
assert.deepEqual(diffusionTrace([2, 0], [-2, 0], 0.5).output, [0, 0]);
// Independent Python reference implementations validate every reachable slider/preset state.
const source = `import json,sys,math
payload=json.load(sys.stdin)
functions={}
for kind,item in payload['references'].items():
    scope={};exec(item['solution'],scope);functions[kind]=scope[item['name']]
for case in payload['cases']:
    expected=functions[case['kind']](*case['args'])
    if case['kind']=='convolution':
        i,j=case['position']; expected=[v for row in expected for v in row]+[expected[i][j]]
    assert len(expected)==len(case['actual'])
    for actual,want in zip(case['actual'],expected):
        assert math.isclose(actual,want,rel_tol=1e-12,abs_tol=1e-12), (case,expected)
print('PASS',len(payload['cases']),'visualization outputs match independent Python reference solutions')
`;
const references = Object.fromEntries([
  ['softmax', softmax.id, 'stable_softmax'], ['attention', attention.id, 'scaled_attention'],
  ['convolution', 'cnn-valid-convolution', 'conv2d_valid'], ['rope', 'rope-rotate-pair', 'rope_pair'], ['diffusion', 'diffusion-forward-sampling', 'q_sample']
].map(([kind, id, name]) => [kind, { solution: problems.find(p => p.id === id).solution, name }]));
const result = spawnSync(pythonCommand, ['-c', source], { input: JSON.stringify({ references, cases }), encoding: 'utf8' });
if (result.stdout) process.stdout.write(result.stdout);
if (result.status !== 0) throw new Error(result.stderr || 'Lesson/reference comparison failed');
assert.deepEqual(attentionTrace([0, 0]).output, [1, 2]);
for (const temperature of [0.5, 1, 2]) {
  const small = softmaxTrace([0, 1, 2], temperature), large = softmaxTrace([1000, 1001, 1002], temperature);
  small.probabilities.forEach((p, i) => assert.ok(Math.abs(p - large.probabilities[i]) < 1e-12));
}
assert.ok(softmaxTrace([0, 1, 2], 0.5).probabilities[2] > softmaxTrace([0, 1, 2], 2).probabilities[2]);
for (const language of ['', 'zh/']) {
  for (const id of [softmax.id, attention.id, 'cnn-valid-convolution', 'rope-rotate-pair', 'diffusion-forward-sampling']) {
    const html = await readFile(join(siteRoot, language, 'editorials', id, 'index.html'), 'utf8');
    assert.match(html, /data-lesson=/);
    const code = html.indexOf('<pre class="code-pre">');
    const resources = html.indexOf('<section class="lesson-resources">');
    const lesson = html.slice(html.indexOf('<section class="visual-lesson"'), code);
    assert.ok(code >= 0 && resources > code, 'Complete reference code appears before external reading');
    const tests = html.indexOf(language ? '代表性测试' : 'Representative tests');
    assert.ok(tests > code && resources > tests, 'External reading follows the worked solution and tests');
    assert.doesNotMatch(lesson, /href="https?:/, 'Visual explanations keep external links in the bottom reading section');
    assert.ok(html.includes(`src="${siteBase()}assets/lesson-ui.js"`));
    assert.match(html, /<noscript>/);
    assert.match(html, /value="[\d.-]+" disabled/);
    assert.doesNotMatch(html, /<iframe/);
    if ([softmax.id, attention.id].includes(id)) assert.ok(html.includes(language ? '表格与向量最多显示 6 位小数' : 'Table and vector values use up to 6 decimal places'));
    assert.ok(html.includes(language ? '继续阅读与观看原始资料' : 'Learn more from the original sources'));
    const requiredSources = { [softmax.id]: 'jaykmody.com/blog/stable-softmax/', [attention.id]: '3blue1brown.com/lessons/attention/', 'cnn-valid-convolution': 'd2l.ai/chapter_convolutional-neural-networks/conv-layer.html', 'rope-rotate-pair': 'arxiv.org/html/2104.09864v5', 'diffusion-forward-sampling': 'huggingface.co/blog/annotated-diffusion' };
    assert.ok(html.includes(requiredSources[id]));
    if (language) {
      const en = decodeHtml(originalMathText(await readFile(join(siteRoot, 'editorials', id, 'index.html'), 'utf8')));
      const zh = decodeHtml(originalMathText(html));
      for (const [original, translated] of Object.entries(additionalLessonTranslations)) {
        const exactText = en.includes(`>${original}<`) || en.includes(`="${original}"`) || en.includes(`>${original} ↗<`);
        if (exactText) assert.ok(zh.includes(translated), `Translated lesson text: ${original}`);
      }
    }
  }
}
const untouched = await readFile(join(siteRoot, 'editorials', 'foundation-matmul', 'index.html'), 'utf8');
assert.doesNotMatch(untouched, /data-lesson=|assets\/lesson-ui.js/);
assert.match(untouched, /Step-by-step reasoning/);
console.log('PASS numerical invariants, ten bilingual lessons, static fallback, complete translations, bottom resource links and unchanged other editorials');
