import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {feedbackConcept as course,feedbackChapters,feedbackIds} from '../src/concept-feedback.mjs';
import {feedbackSamples,feedbackExample} from '../src/concept-feedback-view.mjs';
import {problems} from '../src/problems.mjs';
import {PREFIX} from '../src/progress.mjs';
import {siteBase} from './config.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright'),server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});let browser;
try{
 const origin=await new Promise((resolve,reject)=>{server.stdout.once('data',data=>resolve(String(data).match(/http:\/\/localhost:\d+/)[0].replace('localhost','127.0.0.1')));server.once('error',reject);server.once('exit',code=>reject(Error('Server exit '+code)));}),base=origin+siteBase(),dir='artifacts/feedback-course';await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 const block=context=>context.route('**/pagead2.googlesyndication.com/**',r=>r.abort());
 async function layout(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Document overflow');const overflow=await page.locator('.ct-content,.ct-chapter-card,.ct-input,.ct-result,.fb-experiment,.fb-formula,.fb-revisions,.fb-distribution,.ct-table,.code-pre').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({class:e.className,width:e.clientWidth,scroll:e.scrollWidth})));assert.deepEqual(overflow,[],'Component overflow');}
 for(const locale of ['','zh/'])for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});await block(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+locale+`concepts/${course.slug}/`);await page.locator('[data-course-progress]:visible').first().waitFor();assert.equal(await page.locator('.ct-chapter-card').count(),2);assert.equal(await page.locator('.ct-area').count(),2);await layout(page);
  if(width<=850){await page.waitForFunction(()=>!document.querySelector('.ct-directory').open);await page.locator('.ct-directory summary').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('.ct-directory').evaluate(e=>e.open));await page.keyboard.press('Enter');}
  await page.screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-overview.png`,fullPage:true});
  for(const chapter of feedbackChapters){
   await page.goto(base+locale+`concepts/${chapter.slug}/`);assert.equal(await page.locator('h1').count(),1);
   for(const kind of chapter.experiments){
    const exp=page.locator(`[data-feedback-example="${kind}"]`),select=exp.locator('select');await page.waitForFunction(kind=>!document.querySelector(`[data-feedback-example="${kind}"] select`).disabled,kind);
    for(const choice of Object.keys(feedbackSamples[kind])){await select.selectOption(choice);assert.equal(await exp.locator('[data-cf-error]').count(),feedbackExample(kind,choice).error?1:0);assert.equal(await exp.locator('[data-cf-output]').count(),feedbackExample(kind,choice).error?0:1);if(choice==='empty')assert.equal(await exp.locator('[data-cf-output]').innerText(),'[]');await layout(page);}
    await exp.locator('[data-cf-reset]').click();assert.equal(await select.inputValue(),Object.keys(feedbackSamples[kind])[0]);await select.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await select.inputValue(),Object.keys(feedbackSamples[kind])[1]);await exp.locator('[data-cf-reset]').focus();await page.keyboard.press('Enter');assert.equal(await select.inputValue(),Object.keys(feedbackSamples[kind])[0]);
   }
   await layout(page);await page.locator('.ct-content').screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-${chapter.slug}.png`});
   if(width===320){await page.addStyleTag({content:'code,pre{font-family:monospace!important}'});await layout(page);}
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS EN/ZH overview and 2 chapters at desktop/390/320: all presets, invalid/empty/reset, keyboard, mobile directory, component controls and no overflow');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});await block(context);const page=await context.newPage();for(const slug of [course.slug,...feedbackChapters.map(c=>c.slug)]){await page.goto(base+locale+'concepts/'+slug+'/');assert.equal(await page.locator('h1').count(),1);if(slug!==course.slug){assert.ok(await page.locator('[data-cf-output]').count());assert.ok(await page.locator('.cf-experiment select:disabled').count());}await layout(page);}await context.close();
 }
 console.log('PASS 6 static/no-JS pages: readable teaching content and worked calculations');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width:1280,height:900}});await block(context);await context.route(/\/assets\/catalog(?:-zh)?\.json$/,async route=>{await new Promise(resolve=>setTimeout(resolve,350));await route.continue();});const page=await context.newPage();await page.goto(base+locale+`concepts/${course.slug}/`);await page.locator('[data-course-progress]:visible').first().waitFor();
  await page.evaluate(prefix=>{localStorage.setItem(prefix+'completed',JSON.stringify({'rlef-shaped-turn-reward':true,'constitutional-soft-preference':true,'unknown-test-id':true}));window.dispatchEvent(new Event('storage'));},PREFIX);await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='2');
  await page.goto(base+locale+'concepts/constitutional-ai-feedback/');await page.waitForFunction(()=>document.querySelectorAll('[data-solved].done').length===1);
  // Row ticks initialize before the asynchronous catalog-backed course totals.
  await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='2');assert.equal(await page.locator('[data-course-solved]').first().innerText(),'2');
  await page.evaluate(({prefix,ids})=>{localStorage.setItem(prefix+'completed',JSON.stringify(Object.fromEntries(ids.map(id=>[id,true]))));window.dispatchEvent(new Event('storage'));},{prefix:PREFIX,ids:feedbackIds});await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='6');assert.ok((await page.locator('[data-course-continue]').getAttribute('href')).includes(feedbackIds[0]));
  await page.evaluate(prefix=>{localStorage.removeItem(prefix+'completed');window.dispatchEvent(new Event('storage'));},PREFIX);await page.goto(base+locale+`concepts/${course.slug}/`);await page.locator('.ct-intro [data-course-continue]').click();await page.locator('#practice-route').waitFor({state:'visible'});await page.waitForLoadState('load');
  const p=problems.find(p=>p.id===feedbackIds[0]);assert.ok(page.url().includes(p.id+'/?concept='+course.slug));await page.locator('#code-editor').fill(p.solution);await page.locator('#run-samples').click();try{await page.waitForFunction(()=>/\d+\/\d+ (passed|通过)/.test(document.querySelector('#status').textContent),null,{timeout:120000});assert.match(await page.locator('#status').innerText(),/2\/2 (passed|通过)/);await page.locator('#submit-solution').click();await page.waitForFunction(()=>/^(Accepted|完整本地测试全部通过)/.test(document.querySelector('#run-note').textContent),null,{timeout:120000});}catch(error){console.error('Python practice failure',locale||'en',await page.locator('#status').innerText(),await page.locator('#run-note').innerText());throw error;}
  assert.equal(await page.locator('.case-detail.good').count(),p.tests.length);assert.ok((await page.locator('#success-panel [data-next-practice]').getAttribute('href')).includes(feedbackIds[1]+'/?concept='+course.slug));
  await page.goto(base+locale+`concepts/${course.slug}/`);await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='1');assert.ok((await page.locator('.ct-intro [data-course-continue]').getAttribute('href')).includes(feedbackIds[1]));await page.reload();await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='1');await context.close();console.log('PASS shared completion IDs, unique totals, review/resume, actual Python submission, next navigation and reload:',locale||'en');
 }
}finally{if(browser)await browser.close();server.kill();}
