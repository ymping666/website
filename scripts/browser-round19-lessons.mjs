import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import * as M from '../src/lesson-round19-math.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),dir='artifacts/editorial-round19',metrics=[];
const ids={conv:'cnn-zero-padded-convolution',point:'cnn-pointwise-projection',max:'cnn-max-pooling',avg:'cnn-average-pooling',patch:'vit-patchify'};
async function routeFiles(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const file=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!file.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(file);return route.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/javascript'});}catch{return route.fulfill({status:404});}});}
try{
 await mkdir(dir,{recursive:true});
 for(const width of [1280,390])for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width,height:950}});await routeFiles(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const[kind,id]of Object.entries(ids)){
   await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson]'),view=page.locator('#r19-'+kind+'-view'),output=page.locator('#r19-'+kind+'-output'),preset=page.locator('#r19-'+kind+'-preset'),index=page.locator('#r19-'+kind+'-index'),reset=root.locator('[data-reset-lesson]');
   await root.locator('[data-reset-lesson]:enabled').waitFor();const initial=await view.innerText(),original=await output.getAttribute('data-trace-output');
   const presets=M[{conv:'convPresets',point:'pointPresets',max:'poolPresets',avg:'poolPresets',patch:'patchPresets'}[kind]];
   for(const name of Object.keys(presets)){
    await preset.selectOption(name);
    if(name==='invalid'){
     assert.equal(await output.count(),0);assert.ok(await index.isDisabled());assert.match(await view.locator('[role=alert]').innerText(),locale?/请切换/:/Choose|choose/);if(kind==='point')assert.ok(await page.locator('#r19-point-weight').isDisabled());
    }else{
     const p=presets[name],trace=kind==='conv'?M.convTrace(p.image,p.kernel):kind==='point'?M.pointTrace(p.channels,p.weights,p.biases):kind==='patch'?M.patchTrace(p.image,p.p):M.poolTrace(p.image,kind);
     assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),trace.output);
     for(let i=0;i<trace.rows.length;i++){
      await index.selectOption(String(i));assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),trace.output);assert.doesNotMatch(await view.innerText(),/NaN|undefined|Infinity/);
      const row=trace.rows[i],board=view.locator('.r19-board').first();
      if(kind==='conv'){
       assert.equal(await board.locator('.r19-picked').count(),trace.kh*trace.kw);
       const zeros=await board.locator('.r19-muted').evaluateAll(es=>es.map(e=>Number(e.dataset.r19Value)));assert.ok(zeros.every(v=>v===0));
       const picked=view.locator('.r19-final');assert.equal(Number(await picked.getAttribute('data-r19-row')),row.i);assert.equal(Number(await picked.getAttribute('data-r19-col')),row.j);assert.equal(Number(await picked.getAttribute('data-r19-value')),row.value);
      }
      if(kind==='point'){assert.equal(await view.locator('.r19-picked').count(),trace.channels.length);assert.equal(Number(await view.locator('.r19-final').getAttribute('data-r19-value')),row.value);}
      if(kind==='max'||kind==='avg'){
       assert.equal(await board.locator('.r19-picked').count(),4);assert.equal(await board.locator('.r19-muted').count(),trace.h*trace.w-4*trace.oh*trace.ow);
       const picked=await board.locator('.r19-picked').evaluateAll(es=>es.map(e=>({r:Number(e.dataset.r19Row),c:Number(e.dataset.r19Col)})));assert.deepEqual(picked,row.terms.map(t=>({r:t.r,c:t.c})));
       if(kind==='max'){assert.equal(await board.locator('.r19-winner').count(),row.values.filter(v=>v===row.value).length);assert.equal(await board.locator('.r19-winner').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(229, 243, 237)','Winning values must have a clearly distinct green fill');}
      }
      if(kind==='patch'){assert.equal(await board.locator('.r19-picked').count(),trace.p*trace.p);assert.match(await view.locator('.r19-token-picked').innerText(),new RegExp('k='+i));}
     }
    }
    await reset.click();assert.equal(await output.getAttribute('data-trace-output'),original);assert.equal(await view.innerText(),initial,'Reset must restore the complete default example');
   }
   if(kind==='point'){
    await page.locator('#r19-point-weight').press('Home');const expected=M.pointTrace(M.pointPresets.basic.channels,[[-2,2],[-1,1]],[1,-2]).output;assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),expected);
    assert.deepEqual(expected[1],JSON.parse(original)[1],'Other output channels retain their weights');await index.selectOption('7');await reset.click();assert.equal(await output.getAttribute('data-trace-output'),original);assert.equal(await index.inputValue(),'0');
   }
   const layout=await root.evaluate(el=>({width:innerWidth,scroll:document.documentElement.scrollWidth,cells:[...el.querySelectorAll('.r19-cell')].map(e=>({w:e.clientWidth,s:e.scrollWidth,text:e.textContent,font:getComputedStyle(e).fontFamily})),cards:[...el.querySelectorAll('.r16-gate-node')].map(e=>({w:e.clientWidth,s:e.scrollWidth,text:e.textContent,font:getComputedStyle(e).fontFamily})),formulas:[...el.querySelectorAll('.lesson-equations math')].map(e=>getComputedStyle(e).fontSize)}));
   await writeFile(`${dir}/${kind}-${locale?'zh':'en'}-${width}-layout.json`,JSON.stringify(layout,null,2));assert.ok(layout.scroll<=width+1,'No page overflow');for(const item of [...layout.cells,...layout.cards])assert.ok(item.s<=item.w+1,'Numeric cells and arithmetic cards must not clip: '+JSON.stringify({kind,locale,width,...item}));
   // Wider monospace metrics catch coordinate clipping seen on Linux runners.
   if(kind==='conv'&&width===1280){const style=await page.addStyleTag({content:'.r19-cell small{font-family:"Courier New",monospace!important;font-size:12px!important}'});const cells=await root.locator('.r19-cell').evaluateAll(es=>es.map(e=>({text:e.textContent,w:e.clientWidth,s:e.scrollWidth})));for(const c of cells)assert.ok(c.s<=c.w+1,'Wide-font coordinate must fit: '+JSON.stringify(c));await style.evaluate(e=>e.remove());}
   // Selects also work through keyboard rather than only mouse input.
   await index.focus();await index.press('End');assert.equal(await index.inputValue(),String(await index.locator('option').count()-1));await reset.click();
   await root.locator('.r19-figure').screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-figure.png`});await root.locator('.lesson-calculation').screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-calculation.png`});await root.screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}.png`});
   metrics.push({kind,locale,...layout});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});await routeFiles(context);const page=await context.newPage();
 for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){await page.goto(base+locale+'editorials/'+id+'/');assert.ok((await page.locator('#r19-'+kind+'-output').innerText()).length);assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);assert.ok(await page.locator('.r19-grid').count());assert.ok(await page.locator('.visual-lesson math').count());}
 await context.close();await writeFile(dir+'/browser-metrics.json',JSON.stringify(metrics,null,2));console.log('PASS 20 bilingual desktop/mobile pages: all presets and positions, matching grid highlights, padding/discarded borders, tied maxima, shared-weight control, keyboard selection, reset/error recovery, no clipping/page errors; 10 static no-JS examples');
}finally{await browser.close();}
