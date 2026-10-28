import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import {examples,parameters,trace} from '../src/rsi-math.mjs';
import {formatReturn} from '../src/rsi-view.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),dir='artifacts/rsi-review-20261028',metrics=[];
async function routes(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const path=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!path.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(path);return route.fulfill({body,contentType:path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':path.endsWith('.png')?'image/png':path.endsWith('.svg')?'image/svg+xml':'text/javascript'});}catch{return route.fulfill({status:404});}});}
async function layout(page,tag){const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,svg:[...document.querySelectorAll('[data-rsi] svg text')].map(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return {text:t.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height,width:v.width,height:v.height};})}));assert.ok(m.scroll<=m.width+1,tag+' page overflow '+m.scroll);for(const b of m.svg)assert.ok(b.x>=-1&&b.y>=-1&&b.right<=b.width+1&&b.bottom<=b.height+1,tag+' clipped SVG '+JSON.stringify(b));return m;}
try{
 await mkdir(dir,{recursive:true});
 for(const width of [1280,390,320])for(const locale of ['','zh/']){
  const ctx=await browser.newContext({viewport:{width,height:950}});await routes(ctx);const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const key of Object.keys(examples)){const f=x=>formatReturn(key,x);
   await page.goto(base+locale+'editorials/rsi-'+key+'/');const root=page.locator('[data-rsi]'),select=root.locator('[data-rsi-case]'),reset=root.locator('[data-rsi-reset]');await reset.waitFor();await page.waitForFunction(()=>!document.querySelector('[data-rsi-reset]').disabled);
   const out=()=>root.locator('[data-rsi-output] samp').innerText();assert.equal(await out(),f(trace(key,examples[key].basic).output));
   const text=await root.innerText();if(locale){assert.match(text,/完整中间计算/);if(parameters[key])assert.match(await root.locator('label[for="rsi-parameter"]').innerText(),/调整给定参数/);}else assert.doesNotMatch(text,/[\u3400-\u9fff]/);
   for(const [name,data] of Object.entries(examples[key])){
    await select.selectOption(name);
    if(name==='invalid'){assert.equal(await root.locator('[role=alert]').count(),1);assert.equal(await root.locator('[data-rsi-output]').count(),0);}else{assert.equal(await out(),f(trace(key,data).output));assert.doesNotMatch(await root.locator('[data-rsi-view]').innerText(),/NaN|undefined|Infinity/);}
    await layout(page,`${locale}/${width}/${key}/${name}`);
    await reset.click();assert.equal(await out(),f(trace(key,examples[key].basic).output));
   }
   if(parameters[key]){const [field,min,max]=parameters[key],control=root.locator('[data-rsi-parameter]');for(const value of [min,max]){await reset.click();await control.fill(String(value));await control.dispatchEvent('input');let expected;try{expected=trace(key,{...examples[key].basic,[field]:value}).output;}catch{assert.equal(await root.locator('[role=alert]').count(),1);continue;}assert.equal(await out(),f(expected));}await reset.click();}
   const focus=root.locator('[data-rsi-focus]');if(Number(await focus.getAttribute('max'))>0){await focus.fill('1');await focus.dispatchEvent('input');assert.equal(await root.locator('tbody tr.is-focus').count(),1);assert.equal(await out(),f(trace(key,examples[key].basic).output));}
   await root.locator('details').evaluate(e=>e.open=true);const input=root.locator('textarea');await input.fill('null');await root.locator('[data-rsi-apply]').click();assert.equal(await root.locator('[role=alert]').count(),1);await reset.click();await input.fill('{oops');await root.locator('[data-rsi-apply]').click();assert.equal(await root.locator('[role=alert]').count(),1);await reset.click();await root.locator('details').evaluate(e=>e.open=false);
   if(width!==320)await root.screenshot({style:".site-header{visibility:hidden!important}",path:`${dir}/${locale?'zh':'en'}-${key}-${width}.png`});metrics.push({key,locale,width,...await layout(page,'default '+key)});
  }
  await page.goto(base+locale+'concepts/recursive-self-improvement/');await page.waitForFunction(()=>!document.querySelector('[data-rsi-router] select').disabled);const router=page.locator('[data-rsi-router]');for(const name of ['balanced','overfit','aggressive']){await router.locator('select').selectOption(name);assert.match(await router.innerText(),name==='aggressive'?/router-v1/:/router-v2/);await layout(page,'hub '+name);}await router.locator('button').click();assert.equal(await router.locator('select').inputValue(),'aggressive');assert.equal(await page.locator('.rsi-chapter').count(),6);if(width!==320)await page.screenshot({path:`${dir}/${locale?'zh':'en'}-hub-${width}.png`,fullPage:true});assert.deepEqual(errors,[],'No browser runtime errors');await ctx.close();
 }
 // Static default is complete with JS disabled, and controls do not suggest nonexistent interactivity.
 const ctx=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});await routes(ctx);const page=await ctx.newPage();for(const locale of ['','zh/'])for(const key of Object.keys(examples)){const f=x=>formatReturn(key,x);await page.goto(base+locale+'editorials/rsi-'+key+'/');assert.equal(await page.locator('[data-rsi-output] samp').innerText(),f(trace(key,examples[key].basic).output));assert.ok(await page.locator('[data-rsi-reset]').isDisabled());await layout(page,'no-js '+key);}await ctx.close();
 await writeFile(`${dir}/metrics.json`,JSON.stringify(metrics,null,2));console.log('PASS RSI browser: 10 editorials × 2 locales × 3 widths, cases, controls, reset, invalid JSON, router audit and no-JS defaults');
}finally{await browser.close();}
