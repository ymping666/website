import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { problems } from '../src/problems.mjs';
import { concepts } from '../src/concepts.mjs';
import { practiceSets } from '../src/practice-sets.mjs';
import { siteRoot, siteBase } from './config.mjs';
import { loadChinese, decodeHtml } from './localize.mjs';
import { translate } from '../src/locales/zh-ui.mjs';

const base = siteBase(), chinese = await loadChinese();
const parseChallenge = html => JSON.parse(html.match(/id="challenge-json">([\s\S]*?)<\/script>/)[1]);
assert.equal(translate('✓ 5/5 passed'), '✓ 5/5 通过');
assert.equal(translate('Full local suite · 4 of 5 passed · 0.25s'), '完整本地测试 · 4/5 通过 · 0.25 秒');
assert.equal(translate('15 min · Python 3'), '15 分钟 · Python 3');
assert.equal(translate('print("passed")'), 'print("passed")', 'Unknown code is never translated');
for (const problem of problems) {
  const en = await readFile(join(siteRoot, 'problems', problem.id, 'index.html'), 'utf8');
  const zh = await readFile(join(siteRoot, 'zh', 'problems', problem.id, 'index.html'), 'utf8');
  const editorial = await readFile(join(siteRoot, 'zh', 'editorials', problem.id, 'index.html'), 'utf8');
  assert.match(en, /<html lang="en">/);
  assert.match(zh, /<html lang="zh-CN">/);
  assert.ok(decodeHtml(zh).includes(chinese.translate(problem.title)));
  assert.ok(decodeHtml(editorial).includes(chinese.translate(problem.description)));
  const original = parseChallenge(en), localized = parseChallenge(zh);
  assert.equal(original.id, localized.id);
  assert.equal(original.starter, localized.starter, 'Shared executable starter');
  assert.deepEqual(original.tests.map(t => t.code), localized.tests.map(t => t.code), 'Identical test assertions');
  assert.deepEqual(localized.hints, problem.hints.map(chinese.translate));
  assert.equal(decodeHtml(editorial.match(/<pre class="code-pre">([\s\S]*?)<\/pre>/)[1]), problem.solution, 'Unchanged reference implementation');
  assert.ok(zh.includes(`data-language="en" href="${base}problems/${problem.id}/"`));
  assert.ok(en.includes(`data-language="zh" href="${base}zh/problems/${problem.id}/"`));
  const search = decodeHtml((await readFile(join(siteRoot,'zh','problems','index.html'),'utf8')).match(new RegExp('data-title="([^"]*)"[^>]*><span[^>]*data-solved="'+problem.id+'"'))[1]);
  assert.ok(search.includes(problem.title.toLowerCase()) && search.includes(chinese.translate(problem.title)), 'Bilingual search keywords');
  for (const field of ['title','description','requirements','explanation','pitfall','hints','complexity']) {
    for (const text of [problem[field]].flat()) assert.notEqual(chinese.translate(text), text, `${problem.id}.${field} translated`);
  }
}
for (const item of [...concepts,...practiceSets]) {
  const path = item.ids ? 'concepts' : 'practice-sets';
  const html = decodeHtml(await readFile(join(siteRoot,'zh',path,item.slug,'index.html'),'utf8'));
  assert.ok(html.includes(chinese.translate(item.title)));
  for (const text of [...(item.outcomes || []), ...(item.segments || []).map(s => s.note)]) assert.ok(html.includes(chinese.translate(text)));
}
for (const path of ['index.html','progress/index.html','privacy/index.html']) {
  const html = await readFile(join(siteRoot,'zh',path),'utf8');
  assert.match(html, /aria-current="page">中文<\/a>/);
  if (process.env.SITE_ORIGIN) assert.ok(html.includes('hreflang="zh-CN"') && html.includes('hreflang="x-default"'));
}
assert.ok((await readFile(join(siteRoot,'zh','progress','index.html'),'utf8')).includes('name="robots" content="noindex"'));
console.log('PASS all 100 Chinese problem contracts/editorials, 26 concepts, 19 sets, unchanged Python, language links and bilingual search');
