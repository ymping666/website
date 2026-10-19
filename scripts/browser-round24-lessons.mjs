import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import * as M from '../src/lesson-round24-math.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),dir='artifacts/editorial-round24',metrics=[];
const ids={train:'norm-batch-training',eval:'norm-batch-inference',adam:'optimizer-adamw-update',noise:'diffusion-ddpm-stochastic-step',return:'foundation-nstep-return'},keys={train:'eps',eval:'companion',adam:'decay',noise:'noise',return:'gamma'};
function close(a,b){if(Array.isArray(b)){assert.ok(Array.isArray(a));assert.equal(a.length,b.length);a.forEach((x,i)=>close(x,b[i]));}else assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-12*(1+Math.abs(b)),`Cross-runtime mismatch ${a} vs ${b}`);}
async function routeFiles(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const file=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!file.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(file);return route.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/javascript'});}catch{return route.fulfill({status:404});}});}
async function layout(page,root,tag){const v=await root.evaluate(el=>({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,boxes:[...el.querySelectorAll('.lesson-calc-context dd,.r24-invariance>div')].map(e=>({text:e.textContent,w:e.clientWidth,s:e.scrollWidth})),svg:[...el.querySelectorAll('svg text')].map(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return{text:t.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height,w:v.width,h:v.height};})}));assert.ok(v.pageWidth<=v.viewport+1,'Page overflow: '+tag);for(const b of v.boxes)assert.ok(b.s<=b.w+1,'Clipped value: '+JSON.stringify({tag,...b}));for(const b of v.svg)assert.ok(b.x>=-1&&b.y>=-1&&b.right<=b.w+1&&b.bottom<=b.h+1,'Clipped plot: '+JSON.stringify({tag,...b}));return v;}
try{
 await mkdir(dir,{recursive:true});
 for(const width of [1280,390,320])for(const locale of ['','zh/']){
  const context=await browser.newContext({viewport:{width,height:950}});await routeFiles(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const[kind,id]of Object.entries(ids)){
   await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson]'),view=page.locator('#r24-'+kind+'-view'),output=page.locator('#r24-'+kind+'-output'),preset=page.locator('#r24-'+kind+'-preset'),index=page.locator('#r24-'+kind+'-index'),reset=root.locator('[data-reset-lesson]'),key=keys[kind],control=page.locator('#r24-'+kind+'-'+key);await root.locator('[data-reset-lesson]:enabled').waitFor();const original=JSON.parse(await output.getAttribute('data-trace-output'));
   for(const[name,p]of Object.entries(M.presets[kind])){
    await preset.selectOption(name);if(kind!=='train')assert.equal(await page.locator('#r24-'+kind+'-'+key+'-value').innerText(),await control.inputValue());
    if(name==='invalid'){assert.equal(await output.count(),0);assert.equal(await view.locator('[role=alert]').count(),1);assert.ok(await control.isDisabled());}
    else{const tr=M.fromPreset(kind,p);close(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);if(['train','eval','return'].includes(kind))assert.equal(await index.isDisabled(),!tr.rows.length);
     if(kind==='eval')assert.equal(await control.isDisabled(),tr.b<2||!tr.d);if(kind==='train'||kind==='return')assert.equal(await control.isDisabled(),!tr.rows.length);
     for(let i=0;i<tr.rows.length;i++){
      if(['train','eval','return'].includes(kind))await index.selectOption(String(i));close(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);assert.doesNotMatch(await view.innerText(),/NaN|undefined|Infinity/);
      if(kind==='train'||kind==='eval'){assert.equal(await view.locator('.r24-column').count(),2*tr.b);assert.equal(await view.locator('.r24-active').getAttribute('data-r24-cell'),tr.rows[i].i+','+tr.rows[i].j);}
      if(kind==='return'){assert.equal(await view.locator('.r24-active').getAttribute('data-r24-reward'),String(i));assert.equal(await view.locator('.r24-timeline>.r24-excluded').count(),tr.rows.filter(r=>!r.used).length+(tr.terminalIndex<0?0:1));}
      await layout(page,root,[kind,name,i,locale,width].join('/'));
     }
    }
    await layout(page,root,[kind,name,locale,width].join('/'));await reset.click();close(JSON.parse(await output.getAttribute('data-trace-output')),original);
   }
   const basic=M.presets[kind].basic;
   if(kind==='train')for(const eps of [1e-8,1e-5,.01,1]){await control.selectOption(String(eps));close(JSON.parse(await output.getAttribute('data-trace-output')),M.fromPreset(kind,basic,eps).output);await layout(page,root,'train/eps/'+eps+'/'+locale+'/'+width);}
   if(kind==='eval')for(const offset of [-10,0,10]){await control.fill(String(offset));await control.dispatchEvent('input');const result=JSON.parse(await output.getAttribute('data-trace-output'));close(result,M.fromPreset(kind,basic,offset).output);close(result[0],original[0]);}
   if(kind==='adam')for(let d=0;d<=10;d++){await control.fill(String(d/10));await control.dispatchEvent('input');const result=JSON.parse(await output.getAttribute('data-trace-output'));close(result,M.fromPreset(kind,basic,d/10).output);close(result.slice(1),original.slice(1));}
   if(kind==='noise')for(const final of [false,true])for(const z of [-20,-2,0,.5,20]){await page.locator('#r24-noise-final').setChecked(final);await control.fill(String(z));await control.dispatchEvent('input');close(JSON.parse(await output.getAttribute('data-trace-output')),M.fromPreset(kind,basic,z,final).output);if(final)assert.equal(JSON.parse(await output.getAttribute('data-trace-output')),basic.mean);await layout(page,root,'noise/'+final+'/'+z+'/'+locale+'/'+width);}
   if(kind==='return'){
    const flags=[...basic.terminals],boxes=root.locator('[data-r24-terminal]');await boxes.nth(2).check();flags[2]=true;close(JSON.parse(await output.getAttribute('data-trace-output')),original);await boxes.nth(1).uncheck();flags[1]=false;close(JSON.parse(await output.getAttribute('data-trace-output')),M.returnTrace(basic.rewards,flags,basic.gamma,basic.bootstrap).output);
    for(const g of [0,.5,1])for(const v of [-100,0,100]){await control.fill(String(g));await control.dispatchEvent('input');const bootstrap=page.locator('#r24-return-bootstrap');await bootstrap.fill(String(v));await bootstrap.dispatchEvent('input');close(JSON.parse(await output.getAttribute('data-trace-output')),M.returnTrace(basic.rewards,flags,g,v).output);await layout(page,root,'return/'+g+'/'+v+'/'+locale+'/'+width);}
    await preset.selectOption('empty');assert.ok(await control.isDisabled());await page.locator('#r24-return-bootstrap').fill('9');await page.locator('#r24-return-bootstrap').dispatchEvent('input');assert.equal(JSON.parse(await output.getAttribute('data-trace-output')),9);
   }
   await reset.click();if(['train','eval','return'].includes(kind)){await index.focus();await index.press('End');assert.equal(await index.inputValue(),String(await index.locator('option').count()-1));await reset.click();}
   if(kind!=='train'){await control.press('Home');await control.press('End');await reset.click();}
   const dimensions=await layout(page,root,[kind,locale,width].join('/'));if(width<650)for(const font of ['serif','monospace']){const style=await page.addStyleTag({content:'body{font-family:'+font+'!important}.lesson-calc-context dt{font-size:15px!important}'});await layout(page,root,'wide-font/'+font+'/'+kind+'/'+locale+'/'+width);await style.evaluate(e=>e.remove());}
   for(const[selector,suffix]of [['.lesson-formula','formula'],['.r24-figure','figure'],['.lesson-calculation','calculation']])await root.locator(selector).first().screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-${suffix}.png`,style:'header{visibility:hidden!important}'});await root.screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}.png`,style:'header{visibility:hidden!important}'});metrics.push({kind,locale,...dimensions});
   if(kind==='noise'&&locale&&width===390){await preset.selectOption('tiny');assert.match(await view.innerText(),/5(?:\.000)?e-9/);await view.screenshot({path:dir+'/noise-tiny-mobile.png',style:'header{visibility:hidden!important}'});}
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});await routeFiles(context);const page=await context.newPage();for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(ids)){await page.goto(base+locale+'editorials/'+id+'/');assert.ok((await page.locator('#r24-'+kind+'-output').innerText()).length);assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);assert.ok(await page.locator('.r24-figure').count());assert.ok(await page.locator('.visual-lesson math').count());}await context.close();await writeFile(dir+'/browser-metrics.json',JSON.stringify(metrics,null,2));console.log('PASS 30 EN/ZH desktop/390px/320px pages: feature-column highlights, frozen-stat invariance, decoupled moments, final-noise mask, editable terminal prefix, empty/error/reset, keyboard, fallback fonts and plot bounds; 10 no-JS worked examples');
}finally{await browser.close();}
