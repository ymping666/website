import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import {labPaths,labAssets,releaseLabHtml} from './build-labs.mjs';
import {groupPracticeItems,practiceItems} from '../src/labs/practice-catalog.mjs';
import {renderHub} from '../src/labs/scenario-view.mjs';

// Execute real Python tests and independent oracles without starting a server in CI.
process.env.LAB_LOGIC_ONLY='1';
await import('../explorations/ai-review-lab/test.mjs');
await import('../explorations/ai-review-lab/test-scenarios.mjs');
delete process.env.LAB_LOGIC_ONLY;

assert.deepEqual(groupPracticeItems().map(g=>[g.id,g.items.length]),[['debug',1],['review',2],['extend',1]]);
const expanded=groupPracticeItems([...practiceItems,{id:'future-review',mode:'review'}]);
assert.equal(expanded.find(g=>g.id==='review').items.length,3);
assert.throws(()=>groupPracticeItems([...practiceItems,practiceItems[0]]),/Duplicate/);
assert.throws(()=>groupPracticeItems([{id:'invalid',mode:'unknown'}]),/Unknown/);
const base=siteBase(),origin=(process.env.SITE_ORIGIN||'').replace(/\/$/,'');
for(const locale of ['en','zh']){
  const prefix=locale==='zh'?'zh/':'';
  const home=await readFile(join(siteRoot,prefix,'index.html'),'utf8');
  assert.equal((home.match(/class="home-lab-entry"/g)||[]).length,1,'One small homepage entry');
  assert.ok(home.includes(`href="${base}${prefix}labs/"`));
  assert.ok(home.indexOf('class="learning-paths"')<home.indexOf('class="home-lab-entry"'));
  assert.ok(home.indexOf('class="home-lab-entry"')<home.indexOf('class="habit-teaser"'));
  for(const path of labPaths){
    const html=await readFile(join(siteRoot,prefix,path.slice(1),'index.html'),'utf8');
    assert.ok(html.includes(`lang="${locale==='zh'?'zh-CN':'en'}"`));
    assert.doesNotMatch(html,/Local preview|LOCAL PREVIEW|本地预览|Local prototype|本地原型/);
    assert.doesNotMatch(html.match(/<body>[\s\S]*<\/body>/)[0],/ymping666|github\.com\/ymping666/);
    assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
    const languagePath=path==='/review/'?'review/':path.slice(1);
    for(const language of ['en','zh'])assert.ok(html.includes(`href="${base}${language==='zh'?'zh/':''}${languagePath}" lang="${language==='zh'?'zh-CN':'en'}"`));
    if(origin)assert.ok(html.includes(`rel="canonical" href="${origin+base+prefix+path.slice(1)}"`));
    for(const policy of ['privacy','terms','contact','cookies','advertising'])assert.ok(html.includes(`href="${base+prefix+policy}/"`));
    if(path==='/labs/'){
      for(const item of practiceItems)assert.equal((html.match(new RegExp(`data-practice-id="${item.id}"`,'g'))||[]).length,1);
      const groups=[...html.matchAll(/<section class="practice-group" id="category-([^"]+)"[\s\S]*?<\/section>/g)];
      const review=groups.find(g=>g[1]==='review')[0];
      for(const id of ['tool-reply-review','load-balancer-review'])assert.ok(review.includes(`data-practice-id="${id}"`));
      assert.ok(html.indexOf('id="lab-context-title"')<html.indexOf('class="practice-groups"'));
    }
  }
}
for(const asset of labAssets)await readFile(join(siteRoot,'assets/labs',asset));
for(const name of ['lab.js','scenario-ui.js']){
  const script=await readFile(join(siteRoot,'assets/labs',name),'utf8');
  assert.ok(script.includes("from '../editor.js'"));
  assert.ok(script.includes("new URL('../runner.worker.js',import.meta.url)"),'Runner follows asset base');
  assert.ok(script.includes(name==='lab.js'?"'tensordrill:review-lab:'":"'tensordrill:comprehension-lab:'"),'Keep existing local draft namespace');
}
for(const base of ['/','/website/']){
  const html=releaseLabHtml(renderHub('zh'),'/labs/','zh',{base,origin:'https://example.com'});
  for(const [,url] of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g))assert.ok(url.startsWith(base),url);
  assert.ok(html.includes(`href="${base}assets/labs/home-entry.css"`));
}
const css=await readFile(join(siteRoot,'assets/labs/home-entry.css'),'utf8');
assert.ok(css.includes('.hub-heading .eyebrow{color:#51418b}'));
console.log('PASS 10 released lab routes: bilingual categories, portable runtime assets, metadata, policies, preserved draft keys and purple module styling');
