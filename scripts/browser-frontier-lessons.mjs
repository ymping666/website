import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { siteRoot, siteBase } from './config.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase();
const ids=['react-trace-validator','mpc-first-action','world-discrete-bayes-filter'];
const views=['#react-view','#mpc-view','#bayes-view'];
async function routeFiles(context) {
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort();
    const path=resolve(siteRoot,url.pathname.slice(siteBase().length),...(url.pathname.endsWith('/')?['index.html']:[]));
    if(!path.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});
    try {
      const body=await readFile(path);
      const contentType=path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.png')?'image/png':'text/javascript';
      await route.fulfill({body,contentType});
    }catch {await route.fulfill({status:404});}
  });
}
const defaults=new Map();
const noOverflow=async page=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page must not overflow');
try {
  await mkdir('artifacts/frontier-lessons',{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:950}});
  await routeFiles(context);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  for(const language of ['','zh/']) {
    const zh=Boolean(language);
    for(let i=0;i<ids.length;i++) {
      await page.goto(base+language+'editorials/'+ids[i]+'/');
      await page.locator('.visual-lesson select:enabled').waitFor();
      defaults.set(language+ids[i],await page.locator(views[i]).innerText());
      if(i===0) {
        assert.match(await page.locator('#react-verdict').innerText(),zh?/完整且合法/:/Complete and valid/);
        await page.locator('#react-cursor').press('End');
        assert.equal(await page.locator('#react-cursor-value').textContent(),'5');
        assert.match(await page.locator('.frontier-state.active').innerText(),zh?/已结束/:/Finished/);
        for(const [preset,error] of [['missing',2],['trailing',1],['unknown',1]]) {
          await page.locator('#react-preset').selectOption(preset);
          assert.equal(await page.locator('#react-cursor-value').textContent(),'0');
          await page.locator('#react-cursor').press('End');
          assert.match(await page.locator('#react-verdict').innerText(),zh?/不合法/:/Invalid/);
          assert.equal(await page.locator('.frontier-events .invalid').innerText().then(x=>x.split(':')[0]),String(error));
          assert.match(await page.locator('#react-current').innerText(),zh?/首个错误/:/first error/);
        }
        await page.locator('#react-preset').selectOption('incomplete');
        assert.match(await page.locator('#react-verdict').innerText(),zh?/未结束/:/unfinished/);
        await page.locator('#react-preset').selectOption('empty');
        assert.equal(await page.locator('#react-cursor').getAttribute('max'),'0');
        assert.equal(await page.locator('.lesson-table tbody tr').count(),0);
        await page.locator('#react-preset').selectOption('short');
        await page.locator('#react-cursor').press('End');
        assert.equal(await page.locator('#react-cursor-value').textContent(),'2');
      } else if(i===1) {
        assert.equal(await page.locator('#mpc-action').textContent(),'2');
        assert.deepEqual(await page.locator('.frontier-plan p strong').allTextContents(),['37','8']);
        await page.locator('#mpc-horizon').press('Home');
        assert.equal(await page.locator('#mpc-action').textContent(),'1');
        assert.deepEqual(await page.locator('.frontier-plan p strong').allTextContents(),['1','4']);
        await page.locator('#mpc-horizon').press('End');
        await page.locator('#mpc-preset').selectOption('tie');
        assert.equal(await page.locator('#mpc-action').textContent(),'1');
        assert.deepEqual(await page.locator('.frontier-plan p strong').allTextContents(),['2','2']);
        for(const id of ['mpc-state','mpc-target']) {
          await page.locator('#'+id).press('Home');await page.locator('#'+id).press('End');
          assert.equal(await page.locator('#'+id+'-value').textContent(),'2');
        }
        await page.locator('#mpc-preset').selectOption('empty');
        assert.match(await page.locator('#mpc-selection').innerText(),/None/);
        assert.equal(await page.locator('svg.frontier-plan-svg').count(),0);
      } else {
        assert.equal(await page.locator('#bayes-status').textContent(),'posterior = [0.513514, 0.486486]');
        assert.equal(await page.locator('#bayes-evidence output').textContent(),'0.37');
        await page.locator('[data-bayes-preset="neutral"]').click();
        assert.equal(await page.locator('#bayes-status').textContent(),'posterior = [0.76, 0.24]');
        await page.locator('[data-bayes-preset="impossible"]').click();
        assert.match(await page.locator('#bayes-status').textContent(),/ValueError/);
        assert.equal(await page.locator('.frontier-distribution').last().locator('output').count(),0);
        assert.doesNotMatch(await page.locator('#bayes-view').innerText(),/NaN|Infinity/);
        await page.locator('[data-bayes-preset="neutral"]').click();
        await page.locator('#bayes-transition').selectOption('identity');
        assert.equal(await page.locator('#bayes-status').textContent(),'posterior = [0.8, 0.2]');
        await page.locator('#bayes-prior').press('Home');
        assert.equal(await page.locator('#bayes-status').textContent(),'posterior = [0, 1]');
        await page.locator('#bayes-transition').selectOption('swap');
        assert.equal(await page.locator('#bayes-status').textContent(),'posterior = [1, 0]');
      }
      await page.locator('[data-reset-lesson]').click();
      assert.equal(await page.locator(views[i]).innerText(),defaults.get(language+ids[i]),'Reset restores all outputs and controls');
      if(zh) assert.doesNotMatch(await page.locator('.visual-lesson').innerText(),/Allowed next|Total cost|Complete and valid|Prior belief|No candidates|First action eligible/);
      await page.locator('.lesson-check summary').click();
      assert.ok(await page.locator('.lesson-check p').isVisible());
      for(const width of [1280,768,375]) {
        await page.setViewportSize({width,height:2200});await noOverflow(page);
        if(width!==768) {
          await page.locator('.lesson-experiment').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-90));
          await page.locator('.lesson-experiment').screenshot({path:`artifacts/frontier-lessons/${ids[i]}-${zh?'zh':'en'}-${width}.png`});
        }
      }
      await page.setViewportSize({width:1280,height:950});
    }
  }
  assert.deepEqual(errors,[]);
  await context.close();
  const staticContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:950}});
  await routeFiles(staticContext);
  const staticPage=await staticContext.newPage();
  for(const language of ['','zh/'])for(let i=0;i<ids.length;i++) {
    await staticPage.goto(base+language+'editorials/'+ids[i]+'/');
    assert.equal(await staticPage.locator(views[i]).innerText(),defaults.get(language+ids[i]),'Static example and interactive initialization agree in both languages');
    assert.equal(await staticPage.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);
    assert.ok(await staticPage.locator('noscript p').isVisible());
    if(i>0)assert.ok(await staticPage.locator('.lesson-formula math').count()>=3);
    await noOverflow(staticPage);
  }
  await staticContext.close();
  console.log('PASS frontier browser interactions, errors, resets, keyboard controls, EN/ZH, 375/768/1280px and exact no-JS fallback parity');
} finally {await browser.close();}
