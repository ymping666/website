import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {feedbackFormUrl,validateFeedbackUrl} from '../src/feedback.mjs';
import {problems} from '../src/problems.mjs';
import {siteRoot,siteBase} from './config.mjs';

assert.equal(validateFeedbackUrl(feedbackFormUrl),feedbackFormUrl);
for(const value of ['https://evil.example/forms','http://forms.gle/example','https://docs.google.com/forms/d/private/edit','https://docs.google.com/forms/d/e/example/formResponse','https://forms.gle.evil.example/a','javascript:alert(1)']) {
  assert.throws(()=>validateFeedbackUrl(value));
}
let count=0;
async function walk(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory())await walk(path);
  else if(entry.name.endsWith('.html')){
   const html=await readFile(path,'utf8');
   assert.doesNotMatch(html,/mailto:|pym123amingge@gmail\.com|forms\/d\/[\w-]+\/edit/);
   assert.ok(html.includes('contact/'),path+': feedback entry');
   assert.doesNotMatch(html,/<iframe[^>]+(?:docs\.google\.com|forms\.gle)/,path+': Google loads only after choosing the form');
   count++;
  }
 }
}
await walk(siteRoot);
for(const [locale,language] of [['','en'],['zh/','zh']]){
 const contact=await readFile(join(siteRoot,locale,'contact/index.html'),'utf8');
 const link=contact.match(/<a\b[^>]*data-feedback-form[^>]*>/)?.[0];
 assert.ok(link?.includes(`href="${feedbackFormUrl}"`));
 assert.ok(link.includes('target="_blank"'));
 assert.ok(link.includes('noopener noreferrer'));
 assert.ok(contact.includes(language==='zh'?'回复邮箱为选填':'Reply email is optional'));
 for(const problem of problems) for(const kind of ['problems','editorials']){
  const html=await readFile(join(siteRoot,locale,kind,problem.id,'index.html'),'utf8');
  const entry=html.match(/<aside[^>]*data-feedback-entry[\s\S]*?<\/aside>/)?.[0];
  assert.ok(entry?.includes(`href="${siteBase()}${locale}contact/"`));
  assert.ok(entry.includes(language==='zh'?'提交反馈':'Send feedback'));
 }
}
console.log(`PASS feedback form URL, bilingual contact and ${problems.length*4} contextual entries; ${count} HTML pages without public email or form embed`);
