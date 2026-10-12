import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import {server} from './serve.mjs';
import {scenarios} from '../../src/labs/scenarios.mjs';
import {hubURL,scenarioURL} from '../../src/labs/scenario-view.mjs';
import {groupPracticeItems,practiceItems} from '../../src/labs/practice-catalog.mjs';

assert.deepEqual(groupPracticeItems().map(g=>g.id),['debug','review','extend']);
for(const [id,mode] of [['maze-debugging','debug'],['load-balancer-review','review'],['tool-reply-review','review'],['canvas-history','extend']]) {
  assert.ok(groupPracticeItems().find(g=>g.id===mode).items.some(item=>item.id===id),id+' must be in '+mode);
}
const expanded=groupPracticeItems([...practiceItems,{id:'future-review',mode:'review'}]);
assert.equal(expanded.find(g=>g.id==='review').items.length,groupPracticeItems().find(g=>g.id==='review').items.length+1,'New review exercises should join the review group');
assert.throws(()=>groupPracticeItems([...practiceItems,{id:'unsupported',mode:'unknown'}]),/Unknown practice category/);
assert.throws(()=>groupPracticeItems([...practiceItems,practiceItems[0]]),/Duplicate practice exercise/);

server.listen(0,'127.0.0.1'); await once(server,'listening');
try {
  const origin='http://127.0.0.1:'+server.address().port;
  for(const locale of ['en','zh']) {
    const homePath=locale==='zh'?'/zh/':'/';
    const built=await readFile(new URL(`../../site${homePath}index.html`,import.meta.url),'utf8');
    const homeResponse=await fetch(origin+homePath);
    assert.equal(homeResponse.status,200);
    const home=await homeResponse.text();
    assert.ok(built.includes('home-lab-entry'),'Release output includes the approved entry');
    assert.equal(home.split('class="home-lab-entry"').length,2);
    assert.ok(home.includes(`href="${hubURL(locale)}"`));
    assert.ok(home.includes(locale==='zh'?'新型编程面试实战 →':'AI-Era Coding Interview Lab →'));
    assert.ok(home.includes(locale==='zh'?'读题 → 从零实现解法':'Read a prompt → Implement from scratch'));
    assert.ok(home.includes(locale==='zh'?'接手代码 → 审查 AI 建议 → 调试与迭代 → 测试验证':'Read existing code → Review AI suggestions → Debug & extend → Verify with tests'));
    assert.ok(home.indexOf('class="learning-paths"')<home.indexOf('class="home-lab-entry"'));
    assert.ok(home.indexOf('class="home-lab-entry"')<home.indexOf('class="habit-teaser"'));
    for(const pattern of [/<title>[\s\S]*?<\/title>/g,/<meta[^>]+>/g,/<link rel="(?:canonical|alternate)"[^>]+>/g]) {
      assert.deepEqual([...home.matchAll(pattern)].map(x=>x[0]),[...built.matchAll(pattern)].map(x=>x[0]));
    }
    const hub=await (await fetch(origin+hubURL(locale))).text();
    assert.ok(hub.includes(locale==='zh'?'从接手代码开始，练习新型编程面试。':'Practice a different interview format: start with existing code.'));
    assert.ok(hub.includes('class="practice-format"'));
    assert.ok(hub.includes(locale==='zh'?'为什么做这类练习？':'Why practice this now?'));
    assert.ok(hub.indexOf('id="lab-context-title"')<hub.indexOf('class="scenario-cards"'));
    assert.ok(hub.includes('canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/'));
    assert.ok(hub.includes('activity-7386046074240737280-wnwA'));
    assert.ok(hub.includes(`href="${homePath}"`));
    const groups=[...hub.matchAll(/<section class="practice-group" id="category-([^"]+)"[\s\S]*?<\/section>/g)];
    assert.equal(groups.length,3);
    assert.equal((hub.match(/data-practice-id=/g)||[]).length,practiceItems.length);
    const reviewGroup=groups.find(match=>match[1]==='review')[0];
    for(const id of ['load-balancer-review','tool-reply-review']) assert.ok(reviewGroup.includes(`data-practice-id="${id}"`));
    assert.ok(!hub.includes('existing-review'));
    const agentReview=await (await fetch(origin+homePath+'review/')).text();
    assert.ok(agentReview.includes(`href="${hubURL(locale)}#category-review"`));
    for(const group of groupPracticeItems()) assert.ok(hub.includes(`href="#category-${group.id}"`));
    for(const scenario of scenarios) {
      assert.ok(hub.includes(`href="${scenarioURL(scenario.id,locale)}"`));
      const detail=await (await fetch(origin+scenarioURL(scenario.id,locale))).text();
      assert.ok(detail.includes(`class="back-link" href="${hubURL(locale)}"`));
    }
    // Verify the real homepage's ordinary links and assets still resolve.
    for(const path of [`${homePath}problems/`,`${homePath}search/`,`${homePath}review/`,'/assets/app.js','/assets/locales/zh-ui.mjs','/assets/catalog.json','/assets/labs/home-entry.css']) {
      assert.equal((await fetch(origin+path)).status,200,path);
    }
  }
  for(const path of ['/.git/config','/package.json','/src/problems.mjs','/%2e%2e%5cpackage.json']) {
    assert.equal((await fetch(origin+path)).status,404,path);
  }
  console.log('PASS bilingual homepage → introduction → exercises, preserved metadata, built assets and source isolation');
} finally {server.close(); await once(server,'close');}
