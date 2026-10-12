import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {inspectDescriptions,descriptions,attributes,characterCount} from './meta-descriptions.mjs';
import {descriptionOverrides} from '../src/meta-descriptions.mjs';
import {siteRoot} from './config.mjs';

// Measure decoded Unicode characters, rather than HTML entities or UTF-16 units.
assert.deepEqual(descriptions(`<META content='A &amp; B &#x1F9E0; &#39; &quot; &lt; &gt;' NAME='Description'>`),['A & B 🧠 \' " < >']);
assert.equal(characterCount(descriptions('<meta name="description" content="🧠 &amp; AI">')[0]),6);
assert.deepEqual(descriptions('<meta name="other" content="Ignored"><meta content="First" name="description"><meta name="description" content="Second">'),['First','Second']);

const pages=await inspectDescriptions(),failures=[],byPath=new Map(pages.map(p=>[p.path,p]));
for(const page of pages) {
 const errors=[];
 if(page.count!==1)errors.push(`expected one description, found ${page.count}`);
 if(page.length<25||page.length>160)errors.push(`length ${page.length} is outside 25–160`);
 if(page.description!==page.description.trim()||/\s{2,}/u.test(page.description))errors.push('leading, trailing or repeated whitespace');
 if(page.path.startsWith('zh/')) {
  if(page.language!=='zh-CN'||! /\p{Script=Han}/u.test(page.description))errors.push('Chinese page needs a Chinese description');
  if(page.description===byPath.get(page.path.slice(3))?.description)errors.push('Chinese page reuses its English description');
 } else if(page.language!=='en'||!/\p{Script=Latin}/u.test(page.description)||/\p{Script=Han}/u.test(page.description))errors.push('English page needs an English description');
 const html=await readFile(join(siteRoot,page.path),'utf8');
 const social=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attributes(m[0]));
 for(const key of ['og:description','twitter:description']) {
  const values=social.filter(a=>(a.property||a.name)===key);
  if(values.length!==1||values[0].content!==page.description)errors.push(`${key} differs from the page description`);
 }
 if(errors.length)failures.push(`${page.url}: ${errors.join('; ')}\n  ${page.description}`);
}
// Hand-written replacements must exist on real routes and use the tighter English target.
for(const [route,locales] of Object.entries(descriptionOverrides))for(const [locale,text] of Object.entries(locales)) {
 const path=(locale==='zh'?'zh/':'')+(route==='/'?'index.html':route.slice(1)+(route.endsWith('/')?'index.html':''));
 assert.equal(byPath.get(path)?.description,text,`Applied metadata override: ${locale} ${route}`);
 if(locale==='en')assert.ok(characterCount(text)>=120&&characterCount(text)<=155,`Natural English rewrite: ${route}`);
}
assert.equal(failures.length,0,'Meta description regression:\n'+failures.join('\n'));
assert.ok(pages.some(p=>p.path==='404.html')&&pages.some(p=>p.path==='zh/404.html'),'Audit also covers non-index HTML pages');
console.log(`PASS ${pages.length} HTML meta descriptions: decoded 25–160 characters, correct EN/ZH language and matching social descriptions; rewritten English 120–155`);
