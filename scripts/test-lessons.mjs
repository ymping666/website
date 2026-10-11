import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { softmaxTrace, attentionTrace } from '../src/lesson-math.mjs';
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
// Independent Python reference implementations validate every reachable slider state.
const source = `import json,sys,math
payload=json.load(sys.stdin)
soft_scope={}; attention_scope={}
exec(payload['softmax'],soft_scope); exec(payload['attention'],attention_scope)
for case in payload['cases']:
    fn=soft_scope['stable_softmax'] if case['kind']=='softmax' else attention_scope['scaled_attention']
    expected=fn(*case['args'])
    assert len(expected)==len(case['actual'])
    for actual,want in zip(case['actual'],expected):
        assert math.isclose(actual,want,rel_tol=1e-12,abs_tol=1e-12), (case,expected)
print('PASS',len(payload['cases']),'visualization outputs match independent Python reference solutions')
`;
const result = spawnSync(pythonCommand, ['-c', source], { input: JSON.stringify({ softmax: softmax.solution, attention: attention.solution, cases }), encoding: 'utf8' });
if (result.stdout) process.stdout.write(result.stdout);
if (result.status !== 0) throw new Error(result.stderr || 'Lesson/reference comparison failed');
assert.deepEqual(attentionTrace([0, 0]).output, [1, 2]);
for (const temperature of [0.5, 1, 2]) {
  const small = softmaxTrace([0, 1, 2], temperature), large = softmaxTrace([1000, 1001, 1002], temperature);
  small.probabilities.forEach((p, i) => assert.ok(Math.abs(p - large.probabilities[i]) < 1e-12));
}
assert.ok(softmaxTrace([0, 1, 2], 0.5).probabilities[2] > softmaxTrace([0, 1, 2], 2).probabilities[2]);
for (const language of ['', 'zh/']) {
  for (const id of [softmax.id, attention.id]) {
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
    assert.ok(html.includes(language ? '表格与向量最多显示 6 位小数' : 'Table and vector values use up to 6 decimal places'));
    assert.ok(html.includes(language ? '继续阅读与观看原始资料' : 'Learn more from the original sources'));
    assert.match(html, id === softmax.id ? /jaykmody.com\/blog\/stable-softmax\// : /3blue1brown.com\/lessons\/attention\//);
  }
}
const untouched = await readFile(join(siteRoot, 'editorials', 'foundation-matmul', 'index.html'), 'utf8');
assert.doesNotMatch(untouched, /data-lesson=|assets\/lesson-ui.js/);
assert.match(untouched, /Step-by-step reasoning/);
console.log('PASS numerical invariants, four bilingual lessons, static fallback, resource links and unchanged other editorials');
