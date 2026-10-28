import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {siteBase} from './config.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base=process.env.TEST_URL || `http://127.0.0.1:${process.env.PORT || 4173}${siteBase()}`;
const server=process.env.TEST_URL ? null : spawn(process.execPath,['scripts/serve.mjs'],{env:process.env,stdio:['ignore','pipe','inherit']});
let browser;
try {
  if(server) await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`server exited ${code}`)));});
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
  for(const [prefix,language] of [['','en'],['zh/','zh']]) {
    const page=await browser.newPage();
    await page.addInitScript(()=>{
      window.recordedEvents=[];
      window.gtag=(...args)=>window.recordedEvents.push(args);
      window.Worker=class {
        postMessage({requestId,tests,mode}) {
          const rows=tests.map(()=>({pass:mode==='submit'}));
          setTimeout(()=>this.onmessage({data:{type:'results',requestId,results:rows}}),0);
        }
        terminate() {}
      };
    });
    await page.goto(`${base}${prefix}problems/stable-softmax/`);
    await page.locator('#code-editor').fill('# private code must never reach analytics');
    await page.locator('#run-samples').click();
    await page.waitForFunction(()=>document.querySelector('#run-samples').disabled===false);
    await page.locator('#submit-solution').click();
    await page.waitForFunction(()=>!document.querySelector('#success-panel').hidden);
    await page.locator('[data-next-practice]').first().evaluate(el=>el.addEventListener('click',event=>event.preventDefault()));
    await page.locator('[data-next-practice]').first().click();
    const calls=await page.evaluate(()=>window.recordedEvents);
    assert.deepEqual(calls.map(call=>call[1]),['practice_run','practice_submit','practice_pass','practice_next']);
    for(const call of calls) assert.deepEqual(call[2],{problem_id:'stable-softmax',content_language:language,transport_type:'beacon'});
    assert.ok(!JSON.stringify(calls).includes('private code'));
    await page.close();
  }
  console.log('PASS bilingual workbench event flow, no code or test payload, and next-link interaction');
} finally { if(browser) await browser.close(); if(server) server.kill(); }
