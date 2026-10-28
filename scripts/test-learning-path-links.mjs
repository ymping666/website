import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {concepts} from '../src/concepts.mjs';
import {siteRoot,siteBase} from './config.mjs';

const base=siteBase();
let pairs=0;
for(const locale of ['','zh/']) {
 for(const concept of concepts) {
  const html=await readFile(join(siteRoot,locale,'concepts',concept.slug,'index.html'),'utf8');
  for(const match of html.matchAll(/<div class="concept-exercise">([\s\S]*?)<\/div>/g)) {
   const fragment=match[1];
   const problem=fragment.match(/href="([^"]*\/problems\/([^/]+)\/[^" ]*)"/);
   const editorial=fragment.match(/class="concept-editorial-link" href="([^"]+)"/);
   assert.ok(problem&&editorial,`${locale}${concept.slug}: paired links`);
   assert.equal(editorial[1],problem[1].replace('/problems/','/editorials/'),`${locale}${concept.slug}/${problem[2]}: context preserved`);
   assert.ok(fragment.includes(locale?'可视化题解':'Visual explanation'));
   await readFile(join(siteRoot,locale,'editorials',problem[2],'index.html'));
   pairs++;
  }
 }
 for(const [track,slug] of [['agent-engineering','agent-control'],['world-models','state-estimation'],['video-world-models','flow-matching']]) {
  const html=await readFile(join(siteRoot,locale,'tracks',track,'index.html'),'utf8');
  assert.ok(html.includes(`href="${base}${locale}concepts/${slug}/"`),`${locale}${track} links to ${slug}`);
 }
 for(const slug of ['agent-control','flow-matching','state-estimation','attention-fundamentals']) {
  const html=await readFile(join(siteRoot,locale,'concepts',slug,'index.html'),'utf8');
  assert.ok(html.includes('class="concept-editorial-link"'),`${locale}${slug} has direct editorial links`);
 }
}
assert.ok(pairs>20,'Direct links cover the teaching courses in both languages');
console.log(`PASS ${pairs} bilingual concept-to-problem/editorial pairs retain their learning context; topic hubs link to relevant teaching pages`);
