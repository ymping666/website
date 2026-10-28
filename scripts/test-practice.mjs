import assert from 'node:assert/strict';
import './test-learning-path-links.mjs';
import { problems as allProblems } from '../src/problems.mjs';
import { concepts } from '../src/concepts.mjs';
import { practiceSets } from '../src/practice-sets.mjs';
import { nextPractice, practiceContext, practicePath } from '../src/practice.mjs';
const problems = [...allProblems].sort((a, b) => a.number - b.number);
const sets = practiceSets.map(s => ({ ...s, ids: s.segments.map(p => p.id) }));
const next = (id, completed = {}, requested = {}) => nextPractice(problems, sets, concepts, id, completed, requested);
assert.equal(next('stable-softmax').problem.id, 'foundation-matmul', 'Default route stays in the numerical concept');
assert.equal(next('stable-softmax', { 'foundation-matmul': true }).problem.id, 'foundation-layer-normalization');
assert.equal(next('stable-softmax', {}, { set: 'attention-from-scratch' }).problem.id, 'foundation-matmul');
assert.deepEqual(next('stable-softmax', {}, { set: 'attention-from-scratch' }).context, { set: 'attention-from-scratch' });
const attention = sets.find(s => s.slug === 'attention-from-scratch');
const allAttentionExceptSoftmax = Object.fromEntries(attention.ids.filter(id => id !== 'stable-softmax').map(id => [id, true]));
assert.equal(next(attention.ids.at(-1), allAttentionExceptSoftmax, { set: attention.slug }).problem.id, 'stable-softmax', 'Finish earlier unsolved gaps before leaving a set');
assert.deepEqual(practiceContext('stable-softmax', sets, concepts, { set: 'vision-transformer-basics' }), { concept: 'numerical-building-blocks' }, 'Unrelated set cannot hijack the recommendation');
assert.deepEqual(practiceContext('stable-softmax', sets, concepts, { set: '<script>' }), { concept: 'numerical-building-blocks' });
const complete = Object.fromEntries(problems.map(p => [p.id, true]));
assert.equal(next('stable-softmax', complete), null, 'All solved has an explicit completion state');
for (const p of problems) {
  const candidate = next(p.id, { [p.id]: true });
  assert.ok(candidate && candidate.problem.id !== p.id, `No self-loop for ${p.id}`);
  const track = problems.filter(q => q.track === p.track && q.id !== p.id);
  // Concepts may intentionally connect foundations across tracks.
  assert.ok(track.some(q => q.id === candidate.problem.id) || concepts.some(c => c.ids.includes(p.id) && c.ids.includes(candidate.problem.id)));
}
assert.equal(practicePath('stable-softmax', { set: 'attention-from-scratch' }), 'problems/stable-softmax/?set=attention-from-scratch');
console.log('PASS related recommendations, solved skipping, explicit sequence, gap filling, invalid context and all-solved state');
