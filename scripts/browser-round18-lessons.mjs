import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import * as M from '../src/lesson-round18-math.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),directory='artifacts/editorial-round18';
const ids={linear:'linear-dynamics-rollout',belief:'world-belief-propagation',kalman:'kalman-scalar-update',curve:'world-rollout-error-curve',kl:'world-diagonal-gaussian-kl'},metrics=[];
async function routeFiles(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const file=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!file.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(file);return route.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':file.endsWith('.ico')?'image/x-icon':'text/javascript'});}catch{return route.fulfill({status:404});}});}
try{
 await mkdir(directory,{recursive:true});
 for(const width of [1280,390])for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width,height:950}});await routeFiles(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const[kind,id]of Object.entries(ids)){
   await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson]'),output=page.locator('#r18-'+kind+'-output'),select=page.locator('#r18-'+kind+'-preset'),view=page.locator('#r18-'+kind+'-view');
   await page.locator('[data-reset-lesson]:enabled').waitFor();const initial=await view.innerText(),initialOutput=await output.getAttribute('data-trace-output');
   const layouts=await root.evaluate(el=>({pageWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,cards:[...el.querySelectorAll('.r16-gate-node')].map(e=>({width:e.clientWidth,scroll:e.scrollWidth,text:e.textContent})),formulaFonts:[...el.querySelectorAll('.lesson-equations math')].map(e=>getComputedStyle(e).fontSize)}));
   assert.ok(layouts.scrollWidth<=width+1,'No horizontal page overflow');for(const c of layouts.cards)assert.ok(c.scroll<=c.width+2,'Calculation card must not clip: '+JSON.stringify(c));
   const presets=Object.keys(M[kind+'Presets']);for(const preset of presets){await select.selectOption(preset);
    if(preset==='invalid'){assert.equal(await output.count(),0);assert.match(await root.locator('[role=alert]').innerText(),locale?/必须为正/:/must be positive/);await page.locator('#r18-kalman-p').press('End');assert.equal(await root.locator('[role=alert]').count(),0);assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[2,0]);}
    else{assert.doesNotMatch(await view.innerText(),/NaN|undefined|Infinity/);const result=JSON.parse(await output.getAttribute('data-trace-output'));if(preset==='empty'){assert.deepEqual(result,kind==='linear'?[7]:kind==='kl'?0:[]);assert.ok(await page.locator('#r18-'+kind+'-index').isDisabled());if(kind==='curve'||kind==='kl')assert.ok(await page.locator('#r18-'+kind+'-delta').isDisabled());}
     if(preset==='tiny'){assert.match(await output.innerText(),/e-7/);assert.match(await view.innerText(),/-0\.0009995003331/);await root.locator('.r16-gate-step').first().screenshot({path:`${directory}/kl-tiny-${locale?'zh':'en'}-${width}.png`});}
    }
    await root.locator('[data-reset-lesson]').click();assert.equal(await output.getAttribute('data-trace-output'),initialOutput);assert.equal(await view.innerText(),initial,'Reset restores the full default diagram');
   }
   if(kind==='linear'){await page.locator('#r18-linear-a').press('Home');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.linearTrace(1,[1,-1,2],-2,2).output);await page.locator('#r18-linear-index').selectOption('2');assert.equal(await page.locator('#r18-linear-number').innerText(),'8');}
   if(kind==='belief'){const axes=await root.locator('.r18-belief-track,.r18-axis-ticks').evaluateAll(es=>es.map(e=>({left:e.getBoundingClientRect().left,width:e.getBoundingClientRect().width})));for(const a of axes){assert.ok(Math.abs(a.left-axes[0].left)<1);assert.ok(Math.abs(a.width-axes[0].width)<1,'Every belief row must share an identical axis');}await select.selectOption('contract');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.beliefTrace(4,4,.5,.25,[0,0,0]).output);await page.locator('#r18-belief-q').press('End');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.beliefTrace(4,4,.5,2,[0,0,0]).output);}
   if(kind==='kalman'){await page.locator('#r18-kalman-z').press('Home');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[-2,.5]);await select.selectOption('priorCertain');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[2,0]);}
   if(kind==='curve'){await page.locator('#r18-curve-index').selectOption('1');await page.locator('#r18-curve-delta').press('End');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[4,4,8/3]);await page.locator('#r18-curve-index').selectOption('2');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[4,2,8/3]);}
   if(kind==='kl'){await select.selectOption('same');await page.locator('#r18-kl-index').selectOption('1');await page.locator('#r18-kl-delta').press('End');assert.equal(JSON.parse(await output.getAttribute('data-trace-output')),1);await page.locator('#r18-kl-index').selectOption('0');assert.equal(JSON.parse(await output.getAttribute('data-trace-output')),2);}
   await root.locator('[data-reset-lesson]').click();assert.equal(await output.getAttribute('data-trace-output'),initialOutput);await root.screenshot({path:`${directory}/${kind}-${locale?'zh':'en'}-${width}.png`});await root.locator('figure').first().screenshot({path:`${directory}/${kind}-${locale?'zh':'en'}-${width}-figure.png`});await root.locator('.lesson-equations').screenshot({path:`${directory}/${kind}-${locale?'zh':'en'}-${width}-formula.png`});
   metrics.push({kind,locale,width,initialOutput,layouts});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 // The default trace remains substantive without client JavaScript.
 const staticContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});await routeFiles(staticContext);const page=await staticContext.newPage();
 for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){await page.goto(base+locale+'editorials/'+id+'/');assert.ok((await page.locator('#r18-'+kind+'-output').innerText()).length);assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);assert.ok(await page.locator('.visual-lesson math').count());assert.ok((await page.locator('.visual-lesson figure').count())>0);}
 await staticContext.close();await writeFile(directory+'/browser-metrics.json',JSON.stringify(metrics,null,2));console.log('PASS 20 desktop/mobile bilingual pages: all presets, sliders, indexing, reset/empty/error recovery, unclipped cards, no JS errors; 10 complete no-JavaScript defaults');
}finally{await browser.close();}
