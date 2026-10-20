import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {problems} from '../src/problems.mjs';
import {transformerConcept as course,transformerChapters,transformerIds} from '../src/concept-transformer.mjs';
import {transformerSamples,transformerExample} from '../src/concept-transformer-view.mjs';
import {PREFIX} from '../src/progress.mjs';
import {siteBase} from './config.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright'),server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});let browser;
try{
 const origin=await new Promise((resolve,reject)=>{server.stdout.once('data',data=>resolve(String(data).match(/http:\/\/localhost:\d+/)[0].replace('localhost','127.0.0.1')));server.once('error',reject);server.once('exit',code=>reject(Error('Server exit '+code)));}),base=origin+siteBase(),dir='artifacts/transformer-course';await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 const block=context=>context.route('**/pagead2.googlesyndication.com/**',r=>r.abort());
 async function layout(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Document overflow');const over=await page.locator('.ct-content,.ct-chapter-card,.ct-mini,.ct-table,.ct-experiment,.ct-input,.ct-result,.code-pre').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({cls:e.className,width:e.clientWidth,scroll:e.scrollWidth})));assert.deepEqual(over,[]);}
 for(const locale of ['','zh/'])for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});await block(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+locale+'concepts/');assert.equal(await page.locator('.course-entry').count(),1);await page.locator('.course-entry').click();await page.locator('[data-course-progress]:visible').first().waitFor();assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.ct-chapter-card').count(),7);await layout(page);await page.screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-overview.png`,fullPage:true});
  for(const chapter of transformerChapters){
   await page.goto(base+locale+`concepts/${chapter.slug}/`);await page.locator('#ct-example:enabled').waitFor();assert.equal(await page.locator('.ct-directory a[aria-current="page"]').count(),1);assert.equal(await page.locator('h1').count(),1);
   for(const [key]of Object.entries(transformerSamples[chapter.kind])){await page.locator('#ct-example').selectOption(key);const state=transformerExample(chapter.kind,key);assert.equal(await page.locator('[data-ct-error]').count(),state.error?1:0);if(state.error)assert.equal(await page.locator('[data-ct-output]').count(),0);await layout(page);}
   await page.locator('#ct-reset').click();assert.equal(await page.locator('#ct-example').inputValue(),Object.keys(transformerSamples[chapter.kind])[0]);
   await page.locator('#ct-example').focus();await page.keyboard.press('End');await page.keyboard.press('Tab');assert.equal(await page.locator('#ct-reset').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Enter');assert.equal(await page.locator('#ct-example').inputValue(),Object.keys(transformerSamples[chapter.kind])[0]);
   if(width<850){assert.equal(await page.locator('.ct-directory').getAttribute('open'),null);await page.locator('.ct-directory summary').click();assert.ok(await page.locator('.ct-directory').getAttribute('open')!==null);await page.locator('.ct-directory summary').click();}
   await page.locator('.ct-content').screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-${chapter.kind}.png`,style:'header.site-header{visibility:hidden!important}'});
   await page.addStyleTag({content:'.ct-course{font-family:monospace!important}'});await layout(page);
  }
  await page.locator('[data-language="'+(locale?'en':'zh')+'"]').click();await page.locator('#ct-example:enabled').waitFor();assert.ok(page.url().includes((locale?'':'zh/')+'concepts/vision-transformer/'));assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS EN/ZH overview and 7 chapters at desktop/390/320: all presets, error/empty/reset states, keyboard, mobile directory, no overflow, language switch and fallback font');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});await block(context);const page=await context.newPage();for(const slug of [course.slug,...transformerChapters.map(c=>c.slug)]){await page.goto(base+locale+'concepts/'+slug+'/');assert.equal(await page.locator('h1').count(),1);if(slug!==course.slug){assert.equal(await page.locator('#ct-example').isDisabled(),true);assert.equal(await page.locator('[data-ct-output]').count(),1);}await layout(page);}await context.close();
 }
 console.log('PASS all 16 static/no-JS course/chapter pages and worked examples');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width:1280,height:900}});await block(context);const page=await context.newPage();await page.goto(base+locale+`concepts/${course.slug}/`);await page.locator('[data-course-progress]:visible').first().waitFor();
  // Reuse existing problem IDs: shared reviews count once across all chapters.
  await page.evaluate(({prefix})=>{localStorage.setItem(prefix+'completed',JSON.stringify({'attention-split-heads':true,'transformer-prenorm-residual':true,'foundation-gelu':true,'unknown-test-id':true}));window.dispatchEvent(new Event('storage'));},{prefix:PREFIX});await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='3');
  await page.goto(base+locale+'concepts/vision-transformer/');await page.waitForFunction(()=>document.querySelectorAll('[data-solved].done').length===2);assert.equal(await page.locator('[data-course-solved]').first().innerText(),'3');
  await page.evaluate(({prefix,ids})=>{localStorage.setItem(prefix+'completed',JSON.stringify(Object.fromEntries(ids.map(id=>[id,true]))));window.dispatchEvent(new Event('storage'));},{prefix:PREFIX,ids:transformerIds});await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='15');assert.ok((await page.locator('[data-course-continue]').getAttribute('href')).includes(transformerIds[0]));
  await page.evaluate(prefix=>{localStorage.removeItem(prefix+'completed');window.dispatchEvent(new Event('storage'));},PREFIX);await page.goto(base+locale+`concepts/${course.slug}/`);await page.locator('[data-course-progress]:visible').first().waitFor();await page.locator('.ct-intro [data-course-continue]').click();await page.locator('#practice-route').waitFor({state:'visible'});await page.waitForLoadState('load');
  assert.ok(page.url().includes(`/problems/${transformerIds[0]}/?concept=${course.slug}`));const problem=problems.find(p=>p.id===transformerIds[0]);await page.locator('#code-editor').fill(problem.solution);await page.locator('#run-samples').click();
  try{await page.waitForFunction(()=>/\d+\/\d+ (passed|通过)/.test(document.querySelector('#status').textContent),null,{timeout:120000});assert.match(await page.locator('#status').innerText(),/2\/2 (passed|通过)/);await page.locator('#submit-solution').click();await page.waitForFunction(()=>/^(Accepted|完整本地测试全部通过)/.test(document.querySelector('#run-note').textContent),null,{timeout:120000});}catch(error){console.error('Python practice failure',locale||'en',await page.locator('#status').innerText(),await page.locator('#run-note').innerText());throw error;}
  assert.equal(await page.locator('.case-detail.good').count(),problem.tests.length);assert.ok((await page.locator('#success-panel [data-next-practice]').getAttribute('href')).includes(transformerIds[1]+'/?concept='+course.slug));
  await page.goto(base+locale+`concepts/${course.slug}/`);await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='1');assert.ok((await page.locator('.ct-intro [data-course-continue]').getAttribute('href')).includes(transformerIds[1]));await page.reload();await page.waitForFunction(()=>document.querySelector('[data-course-solved]').textContent==='1');console.log('PASS actual Python submission and persisted course progress:',locale||'en');await context.close();
 }
 console.log('PASS existing completion IDs, deduplicated/shared progress, completed-course review, actual Python samples/submission, resume/next navigation and reload persistence in both locales');
}finally{if(browser)await browser.close();server.kill();}
