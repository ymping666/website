import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { siteRoot } from './config.mjs';
import { problems } from '../src/problems.mjs';
import { concepts } from '../src/concepts.mjs';
import { practiceSets } from '../src/practice-sets.mjs';
import { practiceCollections } from '../src/practice-collections.mjs';
import { searchSite } from '../src/site-search.mjs';

const entries = JSON.parse(await readFile(join(siteRoot, 'assets/search-index.json'), 'utf8'));
assert.equal(entries.length, problems.length * 2 + concepts.length + practiceSets.length + practiceCollections.length + new Set(problems.map(problem => problem.track)).size);
assert.equal(new Set(entries.map(entry => entry.path)).size, entries.length);
for (const entry of entries) {
  assert.ok(entry.title.en && /\p{Script=Han}/u.test(entry.title.zh), entry.path + ' bilingual title');
  for (const prefix of ['', 'zh/']) await stat(join(siteRoot, prefix + entry.path.slice(1), 'index.html'));
}
const paths = (query, type) => searchSite(entries, query, type).map(entry => entry.path);
assert.equal(paths('Implement Scaled Dot-Product Attention')[0], '/problems/attention-scaled-dot-product/');
assert.ok(paths('注意力').includes('/problems/attention-scaled-dot-product/'));
assert.ok(paths('矩阵乘法').includes('/problems/foundation-matmul/'));
assert.ok(paths('扩散').includes('/editorials/diffusion-forward-sampling/'));
assert.ok(paths('ReAct').includes('/concepts/agent-control/'));
assert.deepEqual(paths('  FLOW-MATCHING  '), paths('flow matching'));
assert.deepEqual(paths('ＲｏＰＥ'), paths('rope'));
assert.equal(paths('attention mask')[0], '/problems/attention-causal-mask/');
assert.equal(paths('1')[0], '/problems/stable-softmax/');
assert.equal(paths('#1', 'editorial')[0], '/editorials/stable-softmax/');
for (const type of ['problem', 'editorial', 'concept', 'set', 'topic']) {
  const matches = searchSite(entries, 'Attention', type);
  assert.ok(matches.length);
  assert.ok(matches.every(entry => entry.type === type));
}
for (const query of ['', '   ', 'no-such-concept-zzzz', '<script>alert(1)</script>']) assert.deepEqual(paths(query), []);
console.log('PASS bilingual site search coverage, real links, title ranking, multiword matching, Unicode, type filters and empty queries');
