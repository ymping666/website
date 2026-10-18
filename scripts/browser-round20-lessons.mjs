import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import * as M from '../src/lesson-round20-math.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),dir='artifacts/editorial-round20',metrics=[];
const ids={delta:'video-temporal-velocity',flatten:'video-latent-sequence',patch:'video-temporal-patchify',context:'video-causal-token-context',nll:'video-token-cross-entropy'};
async function routeFiles(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const file=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!file.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(file);return route.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/javascript'});}catch{return route.fulfill({status:404});}});}
async function layout(page,root,tag){
 const value=await root.evaluate(el=>({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,boxes:[...el.querySelectorAll('.r20-code-cell,.r20-tokens li,.r20-frames li,.r16-gate-node')].map(e=>({text:e.textContent,w:e.clientWidth,s:e.scrollWidth})),math:[...el.querySelectorAll('.lesson-equations math')].map(e=>getComputedStyle(e).fontSize)}));
 assert.ok(value.pageWidth<=value.viewport+1,'Page must not overflow: '+tag);for(const box of value.boxes)assert.ok(box.s<=box.w+1,'Coordinate/vector box must not clip: '+JSON.stringify({tag,...box}));return value;
}
try{
 await mkdir(dir,{recursive:true});
 for(const width of [1280,390])for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width,height:950}});await routeFiles(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const[kind,id]of Object.entries(ids)){
   await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson]'),view=page.locator('#r20-'+kind+'-view'),output=page.locator('#r20-'+kind+'-output'),preset=page.locator('#r20-'+kind+'-preset'),index=page.locator('#r20-'+kind+'-index'),reset=root.locator('[data-reset-lesson]');
   await root.locator('[data-reset-lesson]:enabled').waitFor();const initial=await view.innerText(),original=await output.getAttribute('data-trace-output');if(kind==='context')assert.equal(await index.inputValue(),'3','Default context demonstrates both included history and excluded positions');
   const presets=M[kind+'Presets'];
   for(const[name,p]of Object.entries(presets)){
    await preset.selectOption(name);
    if(name==='invalid'||name==='error'){
     assert.equal(await output.count(),0);assert.equal(await view.locator('[role=alert]').count(),1);if(name==='invalid')assert.ok(await index.isDisabled());if(name==='error'){assert.match(await view.innerText(),/ValueError/);assert.equal(await page.locator('#r20-nll-prob').isDisabled(),false);}
    }else{
     const tr=kind==='delta'?M.deltaTrace(p.frames):kind==='flatten'?M.flattenTrace(p.codes):kind==='patch'?M.patchTrace(p.frames,p.p):kind==='context'?M.contextTrace(p.tokens,p.size):M.nllTrace(p.probabilities,p.targets);
     assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);
     if(!tr.rows.length)assert.ok(await index.isDisabled());
     for(let i=0;i<tr.rows.length;i++){
      await index.selectOption(String(i));assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);assert.doesNotMatch(await view.innerText(),/NaN|undefined|Infinity/);
      if(kind==='delta'){
       assert.equal(await view.locator('.r20-old').getAttribute('data-r20-frame'),String(i));assert.equal(await view.locator('.r20-kept').getAttribute('data-r20-frame'),String(i+1));assert.deepEqual(JSON.parse(await view.locator('.r16-gate-final').getAttribute('data-calc-value')),tr.rows[i].delta);if(!tr.d)assert.ok(await page.locator('#r20-delta-bump').isDisabled());
      }
      if(kind==='flatten'){
       const grid=view.locator('.r20-code-cell.r20-current'),seq=view.locator('.r20-tokens .r20-current');assert.equal(await grid.count(),1);assert.equal(await grid.getAttribute('data-r20-pos'),String(i));assert.equal(await seq.getAttribute('data-r20-sequence-pos'),String(i));assert.equal(Number(await grid.locator('samp').innerText()),tr.rows[i].token);
      }
      if(kind==='patch'){
       assert.equal(await view.locator('.r20-frames .r20-current').count(),tr.p);assert.equal(await view.locator('.r20-frames .r20-discarded').count(),tr.dropped);assert.equal(await view.locator('.r20-patches .r20-current').getAttribute('data-r20-group'),String(i));
      }
      if(kind==='context'){
       const kept=await view.locator('.r20-kept').evaluateAll(es=>es.map(e=>Number(e.dataset.r20Token)));assert.deepEqual(kept,tr.rows[i].indices);assert.ok(kept.every(j=>j<i));assert.equal(await view.locator('.r20-current').getAttribute('data-r20-token'),String(i));
      }
      if(kind==='nll'){assert.equal(await view.locator('.r20-target').getAttribute('data-r20-class'),String(p.targets[i]));assert.equal(Number(await view.locator('.r20-target').getAttribute('data-r20-probability')),p.probabilities[i][p.targets[i]]);}
      await layout(page,root,[kind,name,i,locale,width].join('/'));
     }
     if(name==='tiny')await view.locator('.lesson-calculation').screenshot({path:`${dir}/tiny-${locale?'zh':'en'}-${width}.png`});
     if(name==='near'){assert.match(await view.innerText(),/0\.99999999/);assert.match(await output.innerText(),/e-8/);await view.locator('.lesson-calculation').screenshot({path:`${dir}/near-${locale?'zh':'en'}-${width}.png`});}
     if(name==='zero'&&kind==='patch')assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[[],[]]);
    }
    if((name==='zero'&&(kind==='delta'||kind==='patch'))||(name==='error'&&kind==='nll'))await view.screenshot({path:`${dir}/${kind}-${name}-${locale?'zh':'en'}-${width}.png`});
    await reset.click();assert.equal(await output.getAttribute('data-trace-output'),original);assert.equal(await view.innerText(),initial,'Reset restores the full default example: '+kind+'/'+name);
   }
   if(kind==='delta'){
    await page.locator('#r20-delta-bump').press('End');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[[5,-2],[-3,5]]);await index.selectOption('1');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[[3,-2],[1,5]]);
   }
   if(kind==='patch'){
    await page.locator('#r20-patch-size').press('End');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[[1,2,3,4,5,6,7,8]]);assert.equal(await view.locator('.r20-discarded').count(),1);await page.locator('#r20-patch-size').press('Home');assert.equal(JSON.parse(await output.getAttribute('data-trace-output')).length,5);assert.equal(await view.locator('.r20-discarded').count(),0);
   }
   if(kind==='context'){
    await index.selectOption('4');await page.locator('#r20-context-size').press('Home');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),[[],[],[],[],[]]);assert.equal(await view.locator('.r20-kept').count(),0);await page.locator('#r20-context-size').press('End');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output'))[4],[9,0,4,9]);
   }
   if(kind==='nll'){
    await index.selectOption('1');assert.equal(Number(await page.locator('#r20-nll-prob').inputValue()),.5);await page.locator('#r20-nll-prob').press('Home');assert.equal(await output.count(),0);assert.equal(await view.locator('[role=alert]').count(),1);await page.locator('#r20-nll-prob').press('End');assert.equal(await view.locator('[role=alert]').count(),0);assert.equal(JSON.parse(await output.getAttribute('data-trace-output')),-Math.log(.7)/2);
   }
   await reset.click();assert.equal(await output.getAttribute('data-trace-output'),original);
   await index.focus();await index.press('End');assert.equal(await index.inputValue(),String(await index.locator('option').count()-1));await reset.click();
   const dimensions=await layout(page,root,[kind,locale,width].join('/'));await writeFile(`${dir}/${kind}-${locale?'zh':'en'}-${width}-layout.json`,JSON.stringify(dimensions,null,2));
   if(width===1280){const style=await page.addStyleTag({content:'.r20-code-cell small,.r20-tokens small{font-family:"Courier New",monospace!important;font-size:12px!important}'});await layout(page,root,'wide-font/'+kind+'/'+locale);await style.evaluate(e=>e.remove());}
   await root.locator('.r20-figure').screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-figure.png`});await root.locator('.lesson-calculation').screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-calculation.png`});await root.screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}.png`});metrics.push({kind,locale,...dimensions});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});await routeFiles(context);const page=await context.newPage();
 for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){await page.goto(base+locale+'editorials/'+id+'/');assert.ok((await page.locator('#r20-'+kind+'-output').innerText()).length);assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);assert.ok(await page.locator('.r20-figure').count());assert.ok(await page.locator('.visual-lesson math').count());}
 await context.close();await writeFile(dir+'/browser-metrics.json',JSON.stringify(metrics,null,2));console.log('PASS 20 bilingual desktop/mobile video editorials: all presets/indexes, exact highlights, two affected deltas, dropped/zero-width groups, causal boundaries, target probabilities, near-zero loss, keyboard, reset/empty/error recovery, wide fonts and no clipping/page errors; 10 complete no-JS pages');
}finally{await browser.close();}
