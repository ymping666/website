import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { siteRoot, siteBase } from './config.mjs';
import { decodeHtml } from './localize.mjs';

const base=siteBase(), origin=(process.env.SITE_ORIGIN || '').replace(/\/$/,'');
const read=path=>readFile(join(siteRoot,path.replace(/^\//,''),'index.html'),'utf8');
const meta=(html,key)=>decodeHtml(html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1] || '');
const title=html=>decodeHtml(html.match(/<title>(.*?)<\/title>/)?.[1] || '');
const main=html=>decodeHtml(html.match(/<main[\s\S]*?<\/main>/)?.[0] || '');
// Check search intent in the rendered document, independently of its copy configuration.
const entryPoints=[
 ['/', 'AI coding challenges', 'AI 编程刷题'],
 ['/problems/', 'AI Coding Challenges', 'AI 编程刷题'],
 ['/tracks/ai-foundations/', 'Machine Learning', '机器学习编程练习'],
 ['/tracks/llm-systems/', 'LLM Engineering Practice', 'LLM 工程编程练习'],
 ['/tracks/transformer-vision/', 'Transformer Coding Exercises', 'Transformer 编程练习题'],
 ['/concepts/attention-fundamentals/', 'Attention Mechanism Code Implementation', 'Attention 机制代码实现'],
 ['/concepts/flow-matching/', 'Flow Matching Coding Exercises', 'Flow Matching 编程练习'],
 ['/practice-sets/diffusion-core-and-sampling/', 'Diffusion Model Coding Practice', 'Diffusion 扩散模型编程练习'],
 ['/concepts/agent-control/', 'ReAct Agent Implementation Exercises', 'ReAct 智能体实现练习']
];
for (const [path,english,chinese] of entryPoints) {
 for (const [locale,phrase] of [['en',english],['zh',chinese]]) {
  const localized=(locale==='zh'?'/zh':'')+path, html=await read(localized);
  assert.ok(title(html).toLowerCase().includes(phrase.toLowerCase()),`${localized}: descriptive title`);
  assert.ok(main(html).toLowerCase().includes(phrase.toLowerCase()),`${localized}: visible search intent`);
  assert.equal((html.match(/<h1[ >]/g) || []).length,1,`${localized}: one main heading`);
  assert.ok(meta(html,'description').length>35,`${localized}: useful description`);
  if(origin) {
   const canonical=origin+base+localized.slice(1);
   assert.ok(html.includes(`rel="canonical" href="${canonical}"`),`${localized}: self canonical`);
   assert.ok(html.includes(`hreflang="en" href="${origin+base+path.slice(1)}"`));
   assert.ok(html.includes(`hreflang="zh-CN" href="${origin+base+'zh/'+path.slice(1)}"`));
  }
 }
}
let total=0;
const seenTitles=new Set();
async function walk(directory) {
 for (const entry of await readdir(directory,{withFileTypes:true})) {
  const file=join(directory,entry.name);
  if(entry.isDirectory())await walk(file);
  else if(entry.name==='index.html') {
   const html=await readFile(file,'utf8'), pageTitle=title(html);
   assert.ok(!seenTitles.has(pageTitle),`Distinct page title: ${file}`);seenTitles.add(pageTitle);
   assert.ok(pageTitle.endsWith(' | TensorDrill'));
   assert.equal(meta(html,'og:title'),pageTitle);
   assert.equal(meta(html,'og:description'),meta(html,'description'));
   if(html.includes('<html lang="zh-CN">')) {
    assert.match(pageTitle,/\p{Script=Han}/u,`Chinese title: ${file}`);
    assert.match(meta(html,'description'),/\p{Script=Han}/u,`Chinese description: ${file}`);
   }
   assert.ok(!html.includes('name="keywords"'),'No obsolete keyword list');total++;
  }
 }
}
await walk(siteRoot);
const enHome=await read('/'), zhHome=await read('/zh/');
for(const [path] of entryPoints.slice(4)) {
 for(const [home,prefix] of [[enHome,''],[zhHome,'zh/']]) {
  assert.ok(home.includes(`href="${base+prefix+path.slice(1)}"`),'Crawlable search entry from homepage');
 }
}
for(const path of ['/progress/','/zh/progress/'])assert.ok((await read(path)).includes('name="robots" content="noindex"'));
if(origin) {
 const sitemap=await readFile(join(siteRoot,'sitemap.xml'),'utf8');
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>decodeHtml(match[1]));
 assert.equal(new Set(urls).size,urls.length,'No repeated sitemap entries');
 assert.equal(urls.length,total-2,'Only public routes in sitemap');
 assert.ok(urls.every(url=>url.startsWith(origin+base) && !url.endsWith('/progress/')));
 for(const [path] of entryPoints)for(const prefix of ['', 'zh/'])assert.ok(urls.includes(origin+base+prefix+path.slice(1)));
 for(const html of [enHome,zhHome]) {
  const website=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(website['@type'],'WebSite');assert.equal(website.name,'TensorDrill');assert.equal(website.url,origin+base);
 }
 assert.ok((await readFile(join(siteRoot,'robots.txt'),'utf8')).includes('Sitemap: '+origin+base+'sitemap.xml'));
}
console.log(`PASS ${total} distinct localized titles and share metadata, search entry links, canonical/hreflang, public sitemap and private progress exclusion`);
