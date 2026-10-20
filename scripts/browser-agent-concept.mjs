import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {problems} from '../src/problems.mjs';
import {agentControlConceptLesson} from '../src/concept-agent-lesson.mjs';
import {agentTracePresets,agentInspection} from '../src/concept-agent-view.mjs';
import {siteBase} from './config.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});
let browser;
try{
 const origin=await new Promise((resolve,reject)=>{server.stdout.once('data',data=>resolve(String(data).match(/http:\/\/localhost:\d+/)[0].replace('localhost','127.0.0.1')));server.once('error',reject);server.once('exit',code=>reject(Error('Server exit '+code)));});
 const base=origin+siteBase(),dir='artifacts/concept-agent-pilot',ids=agentControlConceptLesson.stages.map(s=>s.id);await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 async function blockAds(context){await context.route('**/pagead2.googlesyndication.com/**',r=>r.abort());}
 async function layout(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow');const over=await page.locator('.cf-stage,.ca-event,.ca-state,.ca-code-pair article,.ca-rules article,.cf-experiment,.code-pre').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({class:e.className,width:e.clientWidth,scroll:e.scrollWidth})));assert.deepEqual(over,[]);}
 for(const locale of ['','zh/'])for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});await blockAds(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+locale+'concepts/agent-control/');await page.locator('#ca-preset:enabled').waitFor();assert.equal(await page.locator('.cf-stage .problem-row').count(),4);assert.equal(await page.locator('#ca-progress').innerText(),'4 / 4');
  for(const [key,preset]of Object.entries(agentTracePresets)){
   await page.locator('#ca-preset').selectOption(key);assert.equal(await page.locator('#ca-cursor').inputValue(),'0');
   assert.equal(await page.locator('#ca-cursor').isDisabled(),preset.events.length===0);
   for(let cursor=0;cursor<=preset.events.length;cursor++){
    if(preset.events.length){await page.locator('#ca-cursor').fill(String(cursor));await page.locator('#ca-cursor').dispatchEvent('input');}
    const state=agentInspection(key,cursor);assert.equal(await page.locator('#ca-state').getAttribute('data-phase'),state.phase);assert.equal(await page.locator('#ca-state').getAttribute('data-failed'),String(state.failed));assert.equal(await page.locator('#ca-verdict').getAttribute('data-valid'),String(state.trace.accepted));assert.equal(await page.locator('.ca-event.error').count(),state.failed?1:0);assert.equal(await page.locator('#ca-progress').innerText(),`${cursor} / ${preset.events.length}`);await layout(page);
   }
   await page.locator('#ca-reset').click();assert.equal(await page.locator('#ca-progress').innerText(),`0 / ${preset.events.length}`);
  }
  await page.locator('#ca-preset').selectOption('tool');const cursor=page.locator('#ca-cursor');await cursor.focus();await cursor.press('Home');await cursor.press('ArrowRight');assert.equal(await cursor.inputValue(),'1');await cursor.press('End');assert.equal(await cursor.inputValue(),'4');
  // Native select and button remain operable with keyboard only.
  await page.locator('#ca-preset').focus();await page.keyboard.press('Home');await page.keyboard.press('Tab');assert.equal(await page.locator('#ca-reset').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Enter');assert.equal(await cursor.inputValue(),'0');
  await page.locator('#ca-preset').selectOption('missing');await cursor.fill('3');await cursor.dispatchEvent('input');
  await page.locator('#ca-explore').screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-invalid.png`,style:'header.site-header{visibility:hidden!important}'});
  await page.locator('#ca-preset').selectOption('tool');await cursor.fill('4');await cursor.dispatchEvent('input');
  await page.screenshot({path:`${dir}/${locale?'zh':'en'}-${width}.png`,fullPage:true});
  for(const id of ['ca-overview','ca-failure','ca-explore','ca-python','ca-path'])await page.locator('#'+id).screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-${id}.png`,style:'header.site-header{visibility:hidden!important}'});
  await page.addStyleTag({content:'.concept-lesson{font-family:monospace!important}'});await layout(page);
  await page.locator('[data-language="'+(locale?'en':'zh')+'"]').click();await page.locator('#ca-preset:enabled').waitFor();assert.ok(page.url().includes((locale?'':'zh/')+'concepts/agent-control/'));assert.equal(await page.locator('#ca-progress').innerText(),'4 / 4');
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS Agent Concept EN/ZH desktop/390/320: nine presets, every cursor state, keyboard, reset, empty/error recovery, language switch and fallback font');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});await blockAds(context);const page=await context.newPage();await page.goto(base+locale+'concepts/agent-control/');assert.equal(await page.locator('.cf-section').count(),7);assert.equal(await page.locator('#ca-preset').isDisabled(),true);assert.equal(await page.locator('.ca-static p').count(),2);assert.equal(await page.locator('#ca-progress').innerText(),'4 / 4');await layout(page);await context.close();
 }
 console.log('PASS no-JS bilingual static teaching, complete trace, valid/invalid examples and four core exercise links');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width:1280,height:900}});await blockAds(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+locale+'concepts/agent-control/');await page.locator('.cf-intro .button.primary').click();
  for(const [i,id]of ids.entries()){
   await page.locator('#practice-route').waitFor({state:'visible'});assert.ok(page.url().includes(`/problems/${id}/?concept=agent-control`));
   const problem=problems.find(p=>p.id===id);assert.ok(await page.locator(`a[href*="${siteBase()+locale}editorials/${id}/"]`).count());await page.locator('#code-editor').fill(problem.solution);await page.locator('#run-samples').click();
   try{await page.waitForFunction(()=>/\d+\/\d+ (passed|通过)/.test(document.querySelector('#status').textContent),null,{timeout:120000});}catch(error){throw Error(`${locale}${id}: ${await page.locator('#run-note').innerText()} / ${await page.locator('#status').innerText()}`,{cause:error});}
   assert.match(await page.locator('#status').innerText(),/2\/2 (passed|通过)/,await page.locator('#test-results').innerText());assert.equal(await page.locator('#completion-indicator').isVisible(),false);
   await page.locator('#submit-solution').click();await page.waitForFunction(()=>/^(Accepted|完整本地测试全部通过)/.test(document.querySelector('#run-note').textContent),null,{timeout:120000});assert.equal(await page.locator('.case-detail.good').count(),problem.tests.length);assert.equal(await page.locator('#completion-indicator').isVisible(),true);
   console.log('PASS real Python',locale||'en',id);
   if(i<ids.length-1){const next=page.locator('#success-panel [data-next-practice]');assert.ok((await next.getAttribute('href')).includes(ids[i+1]+'/?concept=agent-control'));await next.click();}
  }
  await page.goto(base+locale+'concepts/agent-control/');await page.waitForFunction(()=>document.querySelectorAll('.cf-stage [data-solved].done').length===4);await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.cf-stage [data-solved].done').length===4);assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS real Python samples/full submissions for four Agent exercises in both locales, editorial links, ordered next navigation and persisted progress');
}finally{if(browser)await browser.close();server.kill();}
