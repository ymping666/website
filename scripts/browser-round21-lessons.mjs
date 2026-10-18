import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import * as M from '../src/lesson-round21-math.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),dir='artifacts/editorial-round21',metrics=[];
const ids={pixel:'video-frame-mse',temporal:'video-temporal-difference-loss',velocity:'flow-velocity-regression',cfg:'flow-cfg-velocity',rollout:'video-action-conditioned-rollout'};
async function routeFiles(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const file=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!file.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(file);return route.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/javascript'});}catch{return route.fulfill({status:404});}});}
async function layout(page,root,tag){const value=await root.evaluate(el=>({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,boxes:[...el.querySelectorAll('.r16-gate-node,.r21-errors code,.r21-errors samp')].map(e=>({text:e.textContent,w:e.clientWidth,s:e.scrollWidth})),math:[...el.querySelectorAll('math')].map(e=>getComputedStyle(e).fontSize)}));assert.ok(value.pageWidth<=value.viewport+1,'Page overflow: '+tag);for(const box of value.boxes)assert.ok(box.s<=box.w+1,'Clipped calculation/index: '+JSON.stringify({tag,...box}));return value;}
try{
 await mkdir(dir,{recursive:true});
 for(const width of [1280,390])for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width,height:950}});await routeFiles(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const[kind,id]of Object.entries(ids)){
   await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson]'),view=page.locator('#r21-'+kind+'-view'),output=page.locator('#r21-'+kind+'-output'),preset=page.locator('#r21-'+kind+'-preset'),index=page.locator('#r21-'+kind+'-index'),reset=root.locator('[data-reset-lesson]');
   await root.locator('[data-reset-lesson]:enabled').waitFor();const original=await output.getAttribute('data-trace-output');assert.equal(await index.inputValue(),String(M.initialIndex(kind,M.fromPreset(kind,M.presets[kind].basic))));
   for(const[name,p]of Object.entries(M.presets[kind])){
    await preset.selectOption(name);
    if(name==='invalid'){assert.equal(await output.count(),0);assert.equal(await view.locator('[role=alert]').count(),1);assert.ok(await index.isDisabled());}
    else {const tr=M.fromPreset(kind,p);assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);if(!tr.rows.length)assert.ok(await index.isDisabled());for(let i=0;i<tr.rows.length;i++){
     await index.selectOption(String(i));assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);assert.doesNotMatch(await view.innerText(),/NaN|undefined|Infinity/);
     const inputs=await view.locator('[data-calc-value]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.dataset.calcValue)));
     if(['pixel','temporal','velocity'].includes(kind)){assert.ok(inputs.includes(tr.sum));assert.ok(inputs.includes(tr.count));assert.ok(inputs.includes(tr.output));assert.equal(await view.locator('.r21-errors [aria-current=true] code').textContent(),kind==='velocity'?'d='+tr.rows[i].d:'t='+tr.rows[i].t+', d='+tr.rows[i].d);}
     if(kind==='cfg')assert.ok(inputs.includes(tr.rows[i].value));
     if(kind==='rollout')assert.ok(inputs.includes(tr.rows[i].next));
     await layout(page,root,[kind,name,i,locale,width].join('/'));
    }
    if(kind==='rollout')assert.equal(await page.locator('#r21-rollout-gain').isDisabled(),p.mode!=='affine'||!tr.rows.length);
    if(kind==='cfg')assert.equal(await page.locator('#r21-cfg-scale').isDisabled(),!tr.rows.length);
    }
    await layout(page,root,[kind,name,locale,width].join('/'));await reset.click();assert.equal(await output.getAttribute('data-trace-output'),original);assert.equal(await index.inputValue(),String(M.initialIndex(kind,M.fromPreset(kind,M.presets[kind].basic))));
   }
   if(kind==='cfg'){const slider=page.locator('#r21-cfg-scale');for(let s=-1;s<=3;s+=.25){await slider.fill(String(s));await slider.dispatchEvent('input');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.fromPreset(kind,M.cfgPresets.basic,s).output);}await slider.press('Home');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.cfgTrace([1,2],[4,-2],-1).output);await slider.press('End');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.cfgTrace([1,2],[4,-2],3).output);}
   if(kind==='rollout'){const slider=page.locator('#r21-rollout-gain');for(let a=.5;a<=2;a+=.5){await slider.fill(String(a));await slider.dispatchEvent('input');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.fromPreset(kind,M.rolloutPresets.basic,a).output);}await slider.press('Home');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[1,1.5,-.25,1.875]);await slider.press('End');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[1,3,5,12]);}
   await reset.click();await index.focus();await index.press('End');assert.equal(await index.inputValue(),String(await index.locator('option').count()-1));await reset.click();
   const dimensions=await layout(page,root,[kind,locale,width].join('/'));if(width===1280){const style=await page.addStyleTag({content:'.r21-errors code,.r21-errors samp{font-family:"Courier New",monospace!important;font-size:14px!important}'});await layout(page,root,'wide-font/'+kind+'/'+locale);await style.evaluate(e=>e.remove());}
   await root.locator('.r21-figure').first().screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-figure.png`});await root.locator('.lesson-calculation').screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-calculation.png`});await root.screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}.png`});metrics.push({kind,locale,...dimensions});
   if(width===390&&locale){if(kind==='pixel'||kind==='velocity'){await preset.selectOption('tiny');assert.match(await output.innerText(),/e-10/);await view.screenshot({path:`${dir}/${kind}-tiny-mobile.png`});}if(kind==='temporal'){await preset.selectOption('offset');assert.equal(await output.getAttribute('data-trace-output'),'0');await view.screenshot({path:`${dir}/temporal-offset-mobile.png`});}if(kind==='cfg'){await preset.selectOption('same');await view.screenshot({path:`${dir}/cfg-coincident-mobile.png`});}await reset.click();}
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});await routeFiles(context);const page=await context.newPage();for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){await page.goto(base+locale+'editorials/'+id+'/');assert.ok((await page.locator('#r21-'+kind+'-output').innerText()).length);assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);assert.ok(await page.locator('.r21-figure').count());assert.ok(await page.locator('.visual-lesson math').count());}await context.close();await writeFile(dir+'/browser-metrics.json',JSON.stringify(metrics,null,2));console.log('PASS 20 bilingual desktop/mobile editorials: all presets and indices, scalar highlights, guidance/gain controls, keyboard, empty/error/reset recovery, tiny loss, coincident markers, unclipped calculations; 10 no-JS static examples');
}finally{await browser.close();}
