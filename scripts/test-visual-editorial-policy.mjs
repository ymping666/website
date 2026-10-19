import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {problems} from '../src/problems.mjs';
import {renderVisualLesson,renderLessonResources} from '../src/visual-lessons.mjs';
import {assertVisualEditorialCoverage,assertBuiltVisualEditorial,legacyTextEditorialIds} from './visual-editorial-policy.mjs';
import {siteRoot} from './config.mjs';

assert.deepEqual(legacyTextEditorialIds,[],'The cleared text-only backlog must stay empty; new problems require bilingual visual editorials');
const required=assertVisualEditorialCoverage(problems),id='future-problem-needing-a-visual-editorial';
assert.throws(()=>assertVisualEditorialCoverage([...problems,{id}]),/requires a complete bilingual visual editorial.*future-problem/);
const protectedId='rlef-public-test-controller';
assert.throws(()=>assertVisualEditorialCoverage(problems,{lesson:x=>x===protectedId?'':renderVisualLesson(x)}),/requires a complete bilingual visual editorial/);
assert.throws(()=>assertVisualEditorialCoverage(problems,{resources:x=>x===protectedId?'':renderLessonResources(x)}),/requires bottom reference/);
assert.throws(()=>assertVisualEditorialCoverage(problems,{legacyIds:[...legacyTextEditorialIds,protectedId]}),/remove its legacy exemption/);
assert.throws(()=>assertVisualEditorialCoverage(problems,{legacyIds:[...legacyTextEditorialIds,'nonexistent-problem']}),/stale legacy/);
assert.throws(()=>assertVisualEditorialCoverage(problems,{legacyIds:[...legacyTextEditorialIds,protectedId,protectedId]}),/Duplicate legacy/);
// A genuinely complete new renderer, with references, can extend the catalog.
const lesson=x=>renderVisualLesson(x===id?protectedId:x),resources=x=>renderLessonResources(x===id?protectedId:x);
assert.ok(assertVisualEditorialCoverage([...problems,{id}],{lesson,resources}).includes(id));
for(const locale of ['en','zh'])for(const id of required){
 const html=await readFile(join(siteRoot,locale==='zh'?'zh':'','editorials',id,'index.html'),'utf8');
 assertBuiltVisualEditorial(html,id,locale);
 if(id===protectedId){
  assert.throws(()=>assertBuiltVisualEditorial(html.replace('class="visual-lesson"','class="missing-lesson"'),id,locale),/Missing built visual/);
  assert.throws(()=>assertBuiltVisualEditorial(html.replace('id="lesson-title">'+html.match(/id="lesson-title">([^<]+)/)[1],'id="lesson-title">'+(locale==='zh'?'English placeholder':'中文占位')),id,locale),/not localized/);
 }
}
console.log(`PASS visual editorial policy: ${required.length} protected problems, ${required.length*2} localized pages; future text-only additions, visual regressions and missing references rejected`);
