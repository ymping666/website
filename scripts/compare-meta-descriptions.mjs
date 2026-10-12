import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {writeAudit} from './meta-descriptions.mjs';

const before=JSON.parse(await readFile('artifacts/meta-descriptions/before.json','utf8'));
const {pages,invalid}=await writeAudit('after');
const after=JSON.parse(await readFile('artifacts/meta-descriptions/after.json','utf8'));
const originals=new Map(before.pages.map(p=>[p.path,p]));
assert.equal(pages.length,before.pages.length,'No pages added or removed');
assert.deepEqual(after.protectedFiles,before.protectedFiles,'robots.txt, sitemap.xml and ads.txt must remain identical');
const changed=[];
for(const page of pages) {
 const previous=originals.get(page.path);assert.ok(previous,'Same generated route');
 assert.equal(page.nonDescriptionHash,previous.nonDescriptionHash,`${page.path}: only description and corresponding social descriptions may change`);
 if(page.description!==previous.description)changed.push({url:page.url,language:page.language,beforeLength:previous.length,afterLength:page.length,before:previous.description,after:page.description});
}
assert.equal(invalid.length,0,'No length violations remain');
const cell=v=>String(v).replace(/\|/g,'\\|').replace(/\n/g,' ');
await writeFile('artifacts/meta-descriptions/changes.json',JSON.stringify(changed,null,2)+'\n');
await writeFile('artifacts/meta-descriptions/changes.md','# Meta description changes\n\n| URL | Language | Before → after | Original | Replacement |\n| --- | --- | ---: | --- | --- |\n'+changed.map(p=>`| ${cell(p.url)} | ${p.language} | ${p.beforeLength} → ${p.afterLength} | ${cell(p.before)} | ${cell(p.after)} |`).join('\n')+'\n');
for(const language of ['en','zh-CN'])console.log(`${language}: ${changed.filter(p=>p.language===language).length} descriptions changed`);
console.log('PASS every HTML byte outside descriptions is unchanged; robots.txt, sitemap.xml and ads.txt are identical');
