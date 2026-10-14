import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {practiceSets} from '../src/practice-sets.mjs';
import {practiceCollections,collectionUnits,collectionProblemIds,collectionForSet} from '../src/practice-collections.mjs';
import {problems} from '../src/problems.mjs';
import {siteRoot,siteBase} from './config.mjs';
import {loadChinese,decodeHtml} from './localize.mjs';

const base=siteBase(),zh=await loadChinese();
const allUnits=practiceCollections.flatMap(c=>c.groups.flatMap(g=>g.sets));
assert.equal(practiceCollections.length,6,'Six primary entries');
assert.deepEqual([...allUnits].sort(),practiceSets.map(s=>s.slug).sort(),'Each learning unit belongs to exactly one topic and direction');
assert.equal(new Set([...practiceCollections,...practiceSets].map(s=>s.slug)).size,practiceCollections.length+practiceSets.length,'No route collisions');
for(const collection of practiceCollections){
 assert.equal(new Set(collection.groups.map(g=>g.slug)).size,collection.groups.length);
 assert.ok(collection.description.length>=120 && collection.description.length<=155,collection.slug+' English description');
 assert.deepEqual(collectionProblemIds(collection),[...new Set(collectionUnits(collection).flatMap(s=>s.segments.map(p=>p.id)))]);
 for(const id of collectionProblemIds(collection))assert.ok(problems.some(p=>p.id===id),'Published exercise only');
 for(const locale of ['','zh/']){
  const html=decodeHtml(await readFile(join(siteRoot,locale,'practice-sets',collection.slug,'index.html'),'utf8'));
  const tr=text=>locale?zh.translate(text):text;
  assert.ok(html.includes(`<h1>${tr(collection.title)}</h1>`));
  assert.ok(html.includes(tr(collection.description)));
  assert.equal((html.match(/class="collection-unit"/g)||[]).length,collectionUnits(collection).length);
  for(const group of collection.groups){
   assert.ok(html.includes(`id="${group.slug}"`) && html.includes(`href="#${group.slug}"`),'Crawlable section anchors');
   assert.ok(html.includes(tr(group.title)));
  }
  for(const unit of collectionUnits(collection)){
   assert.equal(collectionForSet(unit.slug),collection);
   assert.ok(html.includes(`href="${base+locale}practice-sets/${unit.slug}/"`));
   assert.ok(html.includes(`href="${base+locale}problems/${unit.segments[0].id}/?set=${unit.slug}"`),'Preserve learning sequence context');
   const detail=decodeHtml(await readFile(join(siteRoot,locale,'practice-sets',unit.slug,'index.html'),'utf8'));
   assert.ok(detail.includes(`href="${base+locale}practice-sets/${collection.slug}/"`),'Unit returns to parent topic');
  }
 }
}
for(const locale of ['','zh/']){
 const html=await readFile(join(siteRoot,locale,'practice-sets','index.html'),'utf8');
 assert.equal((html.match(/class="collection-card"/g)||[]).length,6);
 assert.doesNotMatch(html,/class="topic-card"/,'No flat wall of 21 units');
 for(const collection of practiceCollections)assert.ok(html.includes(`href="${base+locale}practice-sets/${collection.slug}/"`));
}
const entries=JSON.parse(await readFile(join(siteRoot,'assets/search-index.json'),'utf8'));
for(const collection of practiceCollections)assert.ok(entries.some(e=>e.type==='set'&&e.path===`/practice-sets/${collection.slug}/`),'New topic is searchable');
assert.equal(zh.translate('3 learning units · 13 distinct exercises'),'3 个学习单元 · 13 道题（去重）');
console.log(`PASS six bilingual topic collections, ${allUnits.length} uniquely grouped learning units, deduplicated counts, parent navigation, preserved sequences and search coverage`);
