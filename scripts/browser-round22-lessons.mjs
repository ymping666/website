import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import * as M from '../src/lesson-round22-math.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),dir='artifacts/editorial-round22',metrics=[];
const ids={matmul:'foundation-matmul',sinusoid:'foundation-sinusoidal-positions',vit:'vit-class-token',rope:'rope-position-encoding',gelu:'foundation-gelu'};
function close(actual,expected){if(Array.isArray(expected)){assert.ok(Array.isArray(actual));assert.equal(actual.length,expected.length);actual.forEach((x,i)=>close(x,expected[i]));}else {assert.ok(Number.isFinite(actual));assert.ok(Math.abs(actual-expected)<=1e-13+1e-13*Math.abs(expected),`Cross-runtime floating-point mismatch: ${actual} versus ${expected}`);}}
async function routeFiles(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const file=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!file.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(file);return route.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/javascript'});}catch{return route.fulfill({status:404});}});}
async function layout(page,root,tag){const value=await root.evaluate(el=>({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,boxes:[...el.querySelectorAll('.r16-gate-node,.r22-cell,.r22-token-calc>div')].map(e=>({text:e.textContent,w:e.clientWidth,s:e.scrollWidth})),svg:[...el.querySelectorAll('svg text')].map(t=>{const b=t.getBBox(),vb=t.ownerSVGElement.viewBox.baseVal;return {text:t.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height,w:vb.width,h:vb.height};})}));assert.ok(value.pageWidth<=value.viewport+1,'Page overflow: '+tag);for(const box of value.boxes)assert.ok(box.s<=box.w+1,'Clipped arithmetic/token: '+JSON.stringify({tag,...box}));for(const b of value.svg)assert.ok(b.x>=-1&&b.y>=-1&&b.right<=b.w+1&&b.bottom<=b.h+1,'Clipped plot label: '+JSON.stringify({tag,...b}));return value;}
try{
 await mkdir(dir,{recursive:true});
 for(const width of [1280,390])for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width,height:950}});await routeFiles(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const[kind,id]of Object.entries(ids)){
   await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson]'),view=page.locator('#r22-'+kind+'-view'),output=page.locator('#r22-'+kind+'-output'),preset=page.locator('#r22-'+kind+'-preset'),index=page.locator('#r22-'+kind+'-index'),reset=root.locator('[data-reset-lesson]');await root.locator('[data-reset-lesson]:enabled').waitFor();const original=await output.getAttribute('data-trace-output');
   if(kind!=='gelu')assert.equal(await index.inputValue(),String(M.initialIndex(kind,M.fromPreset(kind,M.presets[kind].basic))));
   for(const[name,p]of Object.entries(M.presets[kind])){
    await preset.selectOption(name);
    if(name==='invalid'){assert.equal(await output.count(),0);assert.equal(await view.locator('[role=alert]').count(),1);if(kind!=='gelu')assert.ok(await index.isDisabled());}
    else {const tr=M.fromPreset(kind,p);close(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);if(kind!=='gelu'&&!tr.rows.length)assert.ok(await index.isDisabled());
     for(let i=0;i<tr.rows.length;i++){
      if(kind!=='gelu')await index.selectOption(String(i));close(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);assert.doesNotMatch(await view.innerText(),/NaN|undefined|Infinity/);
      if(kind==='matmul'){const[rA,rB,rC]=await view.locator('.r22-board').all(),r=tr.rows[i];assert.equal(await rA.locator('.r22-purple').count(),tr.k);assert.equal(await rB.locator('.r22-green').count(),tr.k);assert.equal(await rC.locator('.r22-green').getAttribute('data-r22-cell'),r.i+','+r.j);}
      if(kind==='vit')assert.equal(await view.locator('.r22-selected').getAttribute('data-r22-token'),String(tr.rows[i].i));
      await layout(page,root,[kind,name,i,locale,width].join('/'));
     }
     if(kind==='rope')assert.equal(await page.locator('#r22-rope-base').isDisabled(),!tr.rows.length);
    }
    await layout(page,root,[kind,name,locale,width].join('/'));await reset.click();assert.equal(await output.getAttribute('data-trace-output'),original);
   }
   if(kind==='sinusoid'){const slider=page.locator('#r22-sinusoid-position');for(const p of [0,1,13,32]){await slider.fill(String(p));await slider.dispatchEvent('input');close(JSON.parse(await output.getAttribute('data-trace-output')),M.sinusoidTrace(p,4).output);}await slider.press('Home');close(JSON.parse(await output.getAttribute('data-trace-output')),[0,1,0,1]);await slider.press('End');close(JSON.parse(await output.getAttribute('data-trace-output')),M.sinusoidTrace(32,4).output);}
   if(kind==='rope')for(const b of [100,10000]){await page.locator('#r22-rope-base').selectOption(String(b));close(JSON.parse(await output.getAttribute('data-trace-output')),M.ropeTrace(M.ropePresets.basic.tokens,b).output);}
   if(kind==='gelu'){const slider=page.locator('#r22-gelu-x');for(let x=-6;x<=6;x+=.25){await slider.fill(String(x));await slider.dispatchEvent('input');close(JSON.parse(await output.getAttribute('data-trace-output')),M.geluTrace(x).output);await layout(page,root,['gelu',x,locale,width].join('/'));}await slider.press('Home');assert.ok(JSON.parse(await output.getAttribute('data-trace-output'))<0);await slider.press('End');assert.ok(JSON.parse(await output.getAttribute('data-trace-output'))>5.9);}
   await reset.click();if(kind!=='gelu'){await index.focus();await index.press('End');assert.equal(await index.inputValue(),String(await index.locator('option').count()-1));await reset.click();}
   const dimensions=await layout(page,root,[kind,locale,width].join('/'));if(width===390){for(const font of ['serif','monospace']){const style=await page.addStyleTag({content:'body{font-family:'+font+'!important}'});await layout(page,root,'fallback-font/'+font+'/'+kind+'/'+locale);await style.evaluate(e=>e.remove());}}if(width===1280){const style=await page.addStyleTag({content:'.r22-cell small{font-family:"Courier New",monospace!important;font-size:12px!important}.r22-cell samp,.r22-token-calc samp{font-family:"Courier New",monospace!important;font-size:14px!important}'});await layout(page,root,'wide-font/'+kind+'/'+locale);await style.evaluate(e=>e.remove());}
   await root.locator('.r22-figure').first().screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-figure.png`});await root.locator('.lesson-calculation').screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-calculation.png`});await root.screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}.png`});metrics.push({kind,locale,...dimensions});
   if(width===390&&locale&&kind==='gelu'){await preset.selectOption('tail');await view.screenshot({path:`${dir}/gelu-tail-mobile.png`});await reset.click();}
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});await routeFiles(context);const page=await context.newPage();for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){await page.goto(base+locale+'editorials/'+id+'/');assert.ok((await page.locator('#r22-'+kind+'-output').innerText()).length);assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);assert.ok(await page.locator('.r22-figure').count());assert.ok(await page.locator('.visual-lesson math').count());}await context.close();await writeFile(dir+'/browser-metrics.json',JSON.stringify(metrics,null,2));console.log('PASS 20 bilingual desktop/mobile editorials: all presets and indexed components, matrix highlights, token order, sine/RoPE controls, GELU range/negative tails, empty/error/reset recovery, unclipped cells/plot labels; 10 no-JS examples');
}finally{await browser.close();}
