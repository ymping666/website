import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {problems} from '../src/problems.mjs';
import {stateEstimationLesson} from '../src/concept-state-lesson.mjs';
import {statePresets,stateCorrection} from '../src/concept-state-view.mjs';
import {siteBase} from './config.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});
let browser;
try{
 const origin=await new Promise((resolve,reject)=>{server.stdout.once('data',data=>resolve(String(data).match(/http:\/\/localhost:\d+/)[0].replace('localhost','127.0.0.1')));server.once('error',reject);server.once('exit',code=>reject(Error('Server exit '+code)));});
 const base=origin+siteBase(),dir='artifacts/concept-state-pilot',ids=stateEstimationLesson.stages.map(s=>s.id);await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 const blockAds=context=>context.route('**/pagead2.googlesyndication.com/**',r=>r.abort());
 async function layout(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow');const over=await page.locator('.cf-stage,.cf-values>div,.cf-section .code-pre,.cf-experiment,.cf-figure,.cs-symbols>div').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className));assert.deepEqual(over,[]);assert.ok(await page.locator('.cs-position-track i').evaluateAll(es=>es.every(e=>{const b=e.getBoundingClientRect(),p=e.closest('figure').getBoundingClientRect();return b.left>=p.left&&b.right<=p.right;})),'Position dots clipped');}
 async function assertValue(page,p,r,z){const state=stateCorrection(p,r,z);assert.equal(await page.locator('[data-cs-error]').count(),state.error?1:0);if(!state.error)for(const [id,value]of [['cs-mean',state.trace.updatedMean],['cs-updated',state.trace.updatedMean],['cs-gain',state.trace.gain],['cs-variance',state.trace.updatedVariance],['cs-innovation',state.trace.innovation],['cs-correction',state.trace.correction]])assert.ok(Math.abs(Number(await page.locator('#'+id).innerText())-value)<=.000001,id);else assert.equal(await page.locator('#cs-mean').count(),0);await layout(page);}
 for(const locale of ['','zh/'])for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});await blockAds(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+locale+'concepts/state-estimation/');await page.locator('#cs-preset:enabled').waitFor();assert.equal(await page.locator('.cf-stage .problem-row').count(),4);await assertValue(page,4,4,14);
  for(const [key,preset]of Object.entries(statePresets)){await page.locator('#cs-preset').selectOption(key);for(const name of ['p','r','z'])assert.equal(await page.locator('#cs-'+name).inputValue(),String(preset[name]));await assertValue(page,preset.p,preset.r,preset.z);await page.locator('#cs-reset').click();await assertValue(page,4,4,14);}
  for(const [p,r,z]of [[0,0,10],[16,16,14],[1,16,6],[16,1,10],[4,4,6],[0,4,14],[4,0,14]]){for(const [name,value]of Object.entries({p,r,z})){await page.locator('#cs-'+name).fill(String(value));await page.locator('#cs-'+name).dispatchEvent('input');}assert.equal(await page.locator('#cs-preset').inputValue(),'custom');await assertValue(page,p,r,z);}
  await page.locator('#cs-reset').click();const r=page.locator('#cs-r');await r.focus();await r.press('Home');await assertValue(page,4,0,14);await r.press('End');await assertValue(page,4,16,14);await r.press('ArrowLeft');assert.equal(await r.inputValue(),'15');
  await page.locator('#cs-preset').focus();await page.keyboard.press('Home');await page.keyboard.press('Tab');assert.equal(await page.locator('#cs-reset').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Enter');await assertValue(page,4,4,14);
  for(const id of ['cs-overview','cs-intuition','cs-python','cs-path'])await page.locator('#'+id).screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-${id}.png`,style:'header.site-header{visibility:hidden!important}'});
  await page.locator('.cf-intro').screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-intro.png`,style:'header.site-header{visibility:hidden!important}'});
  await page.locator('#cs-preset').selectOption('invalid');await page.locator('#cs-intuition').screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-error.png`,style:'header.site-header{visibility:hidden!important}'});await page.locator('#cs-reset').click();
  await page.addStyleTag({content:'.concept-lesson{font-family:monospace!important}.concept-lesson h1{font-family:monospace!important}'});await layout(page);
  await page.locator('[data-language="'+(locale?'en':'zh')+'"]').click();await page.locator('#cs-preset:enabled').waitFor();assert.ok(page.url().includes((locale?'':'zh/')+'concepts/state-estimation/'));await assertValue(page,4,4,14);assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS State Concept EN/ZH desktop/390/320: seven presets, all slider boundaries, gain/mean/variance, invalid state and recovery, keyboard, reset, localization and fallback font');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});await blockAds(context);const page=await context.newPage();await page.goto(base+locale+'concepts/state-estimation/');assert.equal(await page.locator('.cf-section').count(),7);assert.equal(await page.locator('#cs-preset').isDisabled(),true);for(const id of ['p','r','z'])assert.equal(await page.locator('#cs-'+id).isDisabled(),true);await assertValue(page,4,4,14);await context.close();
 }
 console.log('PASS no-JS EN/ZH static worked example, native math and four exercise links');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width:1280,height:900}});await blockAds(context);const page=await context.newPage();await page.goto(base+locale+'concepts/state-estimation/');await page.locator('.cf-intro .button.primary').click();
  for(const [i,id]of ids.entries()){
   await page.locator('#practice-route').waitFor({state:'visible'});await page.waitForLoadState('load');assert.ok(page.url().includes(`/problems/${id}/?concept=state-estimation`));const problem=problems.find(p=>p.id===id);assert.ok(await page.locator(`a[href*="${siteBase()+locale}editorials/${id}/"]`).count());
   await page.locator('#code-editor').fill(problem.solution);await page.locator('#run-samples').click();
   try{await page.waitForFunction(()=>/\d+\/\d+ (passed|通过)/.test(document.querySelector('#status').textContent),null,{timeout:120000});}catch(error){throw Error(`${locale}${id}: ${await page.locator('#status').innerText()} / ${await page.locator('#run-note').innerText()}`,{cause:error});}
   assert.match(await page.locator('#status').innerText(),/2\/2 (passed|通过)/,await page.locator('#test-results').innerText());assert.equal(await page.locator('#completion-indicator').isVisible(),false);
   await page.locator('#submit-solution').click();await page.waitForFunction(()=>/^(Accepted|完整本地测试全部通过)/.test(document.querySelector('#run-note').textContent),null,{timeout:120000});assert.equal(await page.locator('.case-detail.good').count(),problem.tests.length);assert.equal(await page.locator('#completion-indicator').isVisible(),true);console.log('PASS real Python',locale||'en',id);
   if(i<ids.length-1){const next=page.locator('#success-panel [data-next-practice]');assert.ok((await next.getAttribute('href')).includes(ids[i+1]+'/?concept=state-estimation'));await next.click();}
  }
  await page.goto(base+locale+'concepts/state-estimation/');await page.waitForFunction(()=>document.querySelectorAll('.cf-stage [data-solved].done').length===4);await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.cf-stage [data-solved].done').length===4);
  // Shared lesson assets must still initialize the two earlier teaching pages.
  await page.goto(base+locale+'concepts/flow-matching/');await page.locator('#cf-time:enabled').waitFor();await page.locator('#cf-time').fill('1');await page.locator('#cf-time').dispatchEvent('input');assert.equal(await page.locator('#cf-position').innerText(),'10');
  await page.goto(base+locale+'concepts/agent-control/');await page.locator('#ca-preset:enabled').waitFor();await page.locator('#ca-preset').selectOption('missing');assert.equal(await page.locator('#ca-verdict').getAttribute('data-valid'),'false');await context.close();
 }
 console.log('PASS four real Python problems in both locales, next-problem context, editorial links, persisted progress and Flow/Agent interaction regression');
}finally{if(browser)await browser.close();server.kill();}
