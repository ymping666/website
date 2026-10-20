import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {problems} from '../src/problems.mjs';
import {practiceSets} from '../src/practice-sets.mjs';
import {siteBase} from './config.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});
let browser;
try{
 const origin=await new Promise((resolve,reject)=>{server.stdout.once('data',data=>resolve(String(data).match(/http:\/\/localhost:\d+/)[0].replace('localhost','127.0.0.1')));server.once('error',reject);server.once('exit',code=>reject(Error('Server exit '+code)));});
 const base=origin+siteBase(),dir='artifacts/concept-flow-pilot',ids=practiceSets.find(s=>s.slug==='flow-matching-ode-practice').segments.map(s=>s.id);
 await mkdir(dir,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 async function blockAds(context){await context.route('**/pagead2.googlesyndication.com/**',r=>r.abort());}
 async function layout(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflows');const overflow=await page.locator('.cf-stage,.cf-values>div,.cf-section .code-pre,.cf-experiment').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className));assert.deepEqual(overflow,[]);const bounds=await page.locator('.cf-figure svg text').evaluateAll(es=>es.map(e=>{const b=e.getBBox(),v=e.ownerSVGElement.viewBox.baseVal;return {text:e.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height,w:v.width,h:v.height,ok:b.x>=0&&b.y>=0&&b.x+b.width<=v.width&&b.y+b.height<=v.height};}));assert.ok(bounds.every(b=>b.ok),'Figure label clipping '+JSON.stringify({width:page.viewportSize().width,t:await page.locator('#cf-time').inputValue(),bounds}));}
 for(const locale of ['','zh/'])for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}});await blockAds(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+locale+'concepts/flow-matching/');await page.locator('#cf-time:enabled').waitFor();
  const slider=page.locator('#cf-time');assert.equal(await slider.inputValue(),'0.3');assert.equal(await page.locator('#cf-position').innerText(),'3');assert.equal(await page.locator('.cf-stage').count(),4);assert.equal(await page.locator('.cf-stage .problem-row').count(),6);
  for(const t of [0,.01,.3,.5,.99,1]){await slider.fill(String(t));await slider.dispatchEvent('input');assert.equal(Number(await page.locator('#cf-position').innerText()),t*10);assert.equal(await page.locator('#cf-velocity').innerText(),'10');assert.equal(Number(await page.locator('[data-cf-point]').getAttribute('cx')),80+t*440);await layout(page);}
  await slider.focus();await slider.press('Home');assert.equal(await slider.inputValue(),'0');await slider.press('ArrowRight');assert.equal(await slider.inputValue(),'0.01');await slider.press('End');assert.equal(await slider.inputValue(),'1');await page.locator('#cf-reset').click();assert.equal(await slider.inputValue(),'0.3');assert.equal(await page.locator('#cf-position').innerText(),'3');
  await page.locator('.cf-intro').screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-intro.png`,style:'header.site-header{visibility:hidden!important}'});
  await page.screenshot({path:`${dir}/${locale?'zh':'en'}-${width}.png`,fullPage:true});
  for(const id of ['cf-intuition','cf-python','cf-path'])await page.locator('#'+id).screenshot({path:`${dir}/${locale?'zh':'en'}-${width}-${id}.png`,style:'header.site-header{visibility:hidden!important}'});
  await page.addStyleTag({content:'.concept-lesson{font-family:monospace!important}.concept-lesson h1{font-family:monospace!important}.cf-figure svg text{font-family:monospace!important;letter-spacing:.5px}'});await layout(page);for(const endpoint of ['0','1']){await slider.fill(endpoint);await slider.dispatchEvent('input');await layout(page);}await page.locator('#cf-reset').click();
  await page.locator('[data-language="'+(locale?'en':'zh')+'"]').click();await page.locator('#cf-time:enabled').waitFor();assert.ok(page.url().includes((locale?'':'zh/')+'concepts/flow-matching/'));assert.equal(await page.locator('#cf-position').innerText(),'3');
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS Flow Concept: 6 EN/ZH desktop/mobile layouts, slider boundaries, keyboard, reset, formulas, labels, language switch and fallback fonts');
 for(const locale of ['','zh/']){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});await blockAds(context);const page=await context.newPage();await page.goto(base+locale+'concepts/flow-matching/');assert.equal(await page.locator('#cf-position').innerText(),'3');assert.equal(await page.locator('#cf-time').isDisabled(),true);assert.equal(await page.locator('#cf-reset').isDisabled(),true);assert.equal(await page.locator('.cf-section').count(),6);assert.equal(await page.locator('.cf-stage .problem-row').count(),6);await layout(page);await context.close();
 }
 console.log('PASS no-JS EN/ZH teaching content, diagram, default calculation and six exercise links');
 // Real Python Worker, existing set context and persisted completion: no mocked judge.
 for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width:1280,height:900}});await blockAds(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+locale+'concepts/flow-matching/');
  await page.locator('.cf-intro .button.primary').click();
  for(const [i,id]of ids.entries()){
   await page.locator('#practice-route').waitFor({state:'visible'});
   assert.ok(page.url().includes('/problems/'+id+'/?set=flow-matching-ode-practice'));
   const p=problems.find(p=>p.id===id);await page.locator('#code-editor').fill(p.solution);await page.locator('#run-samples').click();await page.waitForFunction(()=>/\d+\/\d+ (passed|通过)/.test(document.querySelector('#status').textContent),null,{timeout:120000});assert.match(await page.locator('#status').innerText(),/2\/2 (passed|通过)/,await page.locator('#test-results').innerText());assert.equal(await page.locator('#completion-indicator').isVisible(),false);
   await page.locator('#submit-solution').click();await page.waitForFunction(()=>/^(Accepted|完整本地测试全部通过)/.test(document.querySelector('#run-note').textContent),null,{timeout:120000});assert.equal(await page.locator('.case-detail.good').count(),p.tests.length);assert.equal(await page.locator('#completion-indicator').isVisible(),true);console.log('PASS real Python',locale||'en',id);
   if(i<ids.length-1){const next=page.locator('#success-panel [data-next-practice]');assert.ok((await next.getAttribute('href')).includes(ids[i+1]+'/?set=flow-matching-ode-practice'));await next.click();}
  }
  await page.goto(base+locale+'concepts/flow-matching/');await page.waitForFunction(()=>document.querySelectorAll('.cf-stage [data-solved].done').length===6);assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS real Python samples/submission for six Flow exercises in both locales, ordered next-problem navigation and six persisted completion markers');
}finally{if(browser)await browser.close();server.kill();}
