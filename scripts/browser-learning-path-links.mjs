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
 const routes=[
  {topic:'agent-control',first:'tool-call-parser',next:'agent-retry-guard',query:'concept=agent-control'},
  {topic:'flow-matching',first:'flow-linear-interpolation',next:'flow-conditional-velocity',query:'set=flow-matching-ode-practice'}
 ];
 for(const locale of ['','zh/']) for(const width of [1366,375]) for(const route of routes) {
  const page=await browser.newPage({viewport:{width,height:850}});
  await page.goto(`${base}${locale}concepts/${route.topic}/`);
  const card=page.locator('.concept-exercise').filter({has:page.locator(`a[href*="/problems/${route.first}/"]`)}).first();
  assert.equal(await card.locator('.concept-editorial-link').count(),1);
  if(locale==='zh/'&&route.topic==='agent-control') assert.equal(await card.locator('.concept-editorial-link .sr-only span').textContent(),'安全解析工具调用');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${locale}${route.topic} ${width}px overflow`);
  await card.locator('.problem-row').click();
  await page.waitForFunction(query=>document.querySelector('.panel-tabs a')?.href.includes(query),route.query);
  await page.locator('.panel-tabs a').click();
  assert.ok(page.url().includes(`/editorials/${route.first}/?${route.query}`));
  await page.waitForFunction(query=>document.querySelector('[data-next-practice]')?.href.includes(query),route.query);
  const next=await page.locator('[data-next-practice]').first().getAttribute('href');
  assert.ok(next.includes(`/problems/${route.next}/?${route.query}`),next);
  await page.goto(`${base}${locale}concepts/${route.topic}/`);
  const direct=page.locator('.concept-exercise').filter({has:page.locator(`a[href*="/problems/${route.first}/"]`)}).first().locator('.concept-editorial-link');
  await direct.click();
  assert.ok(page.url().includes(`/editorials/${route.first}/?${route.query}`));
  await page.waitForFunction(query=>document.querySelector('[data-next-practice]')?.href.includes(query),route.query);
  assert.ok((await page.locator('[data-next-practice]').first().getAttribute('href')).includes(`/problems/${route.next}/?${route.query}`));
  await page.close();
 }
 const nojs=await browser.newContext({javaScriptEnabled:false});
 const page=await nojs.newPage();
 await page.goto(`${base}zh/concepts/agent-control/`);
 assert.ok(await page.locator('.concept-editorial-link[href*="/editorials/tool-call-parser/?concept=agent-control"]').isVisible());
 await nojs.close();
 console.log('PASS bilingual desktop/mobile course → problem → editorial → next flow, static links and no-JS access');
} finally {if(browser)await browser.close();if(server)server.kill();}
