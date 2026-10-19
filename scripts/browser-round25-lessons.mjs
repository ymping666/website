import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {siteRoot,siteBase} from './config.mjs';
import * as M from '../src/lesson-round25-math.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const origin='http://127.0.0.1:4198',base=origin+siteBase(),dir='artifacts/editorial-round25',metrics=[];
async function routeFiles(context){await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();const file=resolve(siteRoot,u.pathname.slice(siteBase().length),...(u.pathname.endsWith('/')?['index.html']:[]));if(!file.startsWith(resolve(siteRoot)+sep))return route.fulfill({status:403});try{const body=await readFile(file);return route.fulfill({body,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/javascript'});}catch{return route.fulfill({status:404});}});}
async function layout(page,root,tag){const r=await root.evaluate(el=>({width:innerWidth,pageWidth:document.documentElement.scrollWidth,boxes:[...el.querySelectorAll('.r25-gates li,.r25-gates li>div,.r25-code pre,.r25-output,.r25-slots li,.r25-arrivals li,.r25-bars li,.lesson-calc-context dd')].map(e=>({text:e.textContent.slice(0,100),w:e.clientWidth,s:e.scrollWidth}))}));assert.ok(r.pageWidth<=r.width+1,'Page overflow '+tag);for(const b of r.boxes)assert.ok(b.s<=b.w+1,'Clipped '+JSON.stringify({tag,...b}));return r;}
try{await mkdir(dir,{recursive:true});for(const width of [1280,390,320])for(const locale of ['','zh/']){
 const context=await browser.newContext({viewport:{width,height:950}});await routeFiles(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const[kind,id]of Object.entries(M.ids)){
  await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson="r25-'+kind+'"]'),view=page.locator('#r25-'+kind+'-view'),output=page.locator('#r25-'+kind+'-output'),preset=page.locator('#r25-'+kind+'-preset'),index=page.locator('#r25-'+kind+'-index'),reset=root.locator('[data-reset-lesson]');await root.locator('[data-reset-lesson]:enabled').waitFor();const original=M.fromPreset(kind,M.presets[kind].basic).output;
  for(const[name,p]of Object.entries(M.presets[kind])){
   await preset.selectOption(name);const tr=M.fromPreset(kind,p);assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);const rows=tr.gates||tr.rows;assert.equal(await index.isDisabled(),rows.length===0);
   for(let i=0;i<Math.max(1,rows.length);i++){
    if(rows.length)await index.selectOption(String(i));assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),tr.output);assert.doesNotMatch(await view.innerText(),/NaN|undefined|Infinity/);
    if(tr.gates)for(const key of ['parse','schema'].includes(kind)?kind==='parse'?['decode','object','name','arguments']:['known','arguments','keys','types']:['version','id','exclusive','error']){const g=tr.gates.find(g=>g.key===key);assert.equal(await view.locator('[data-r25-gate="'+key+'"]').getAttribute('data-state'),g?g.pass?'passed':'failed':'skipped');}
    if(kind==='merge'&&rows.length)assert.equal(await view.locator('[aria-current=true]').getAttribute('data-r25-arrival'),String(i));
    if(kind==='backoff'&&rows.length)assert.equal(await view.locator('[aria-current=true]').getAttribute('data-r25-event'),String(i));
    await layout(page,root,[kind,name,i,locale,width].join('/'));
   }
   if(kind==='schema'&&name==='float'){assert.match(await root.locator('.r25-code').first().innerText(),/3\.0/);assert.match(await root.locator('.r25-table').innerText(),/float/);}
   if(kind==='rpc'&&name==='float')assert.match(await root.locator('.r25-code').innerText(),/1\.0/);
   if(kind==='merge'){const progress=page.locator('#r25-merge-progress');assert.equal(await progress.isDisabled(),p.responses.length===0);for(let i=0;p.responses.length&&i<=p.responses.length;i++){await progress.fill(String(i));await progress.dispatchEvent('input');const trace=M.mergeTrace(p,i);assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),trace.output);for(const row of trace.rows)assert.equal(await view.locator('[data-r25-arrival="'+row.i+'"]').getAttribute('data-state'),row.decision);for(const slot of trace.slots)assert.equal(await view.locator('[data-r25-slot="'+slot.id+'"]').getAttribute('data-received'),String(slot.received));await layout(page,root,'prefix/'+i+'/'+locale+'/'+width);}}
   await reset.click();assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),original);
  }
  if(kind==='backoff'){
   const p=structuredClone(M.presets.backoff.basic),flags=root.locator('[data-r25-success]'),base=page.locator('#r25-backoff-base'),cap=page.locator('#r25-backoff-cap');await flags.nth(1).check();p.outcomes[1]=true;assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.backoffTrace(p).output);assert.equal(await flags.nth(1).isChecked(),true);
   for(const b of [.25,.5,1,2])for(const c of [2,3,5,8]){await base.fill(String(b));await base.dispatchEvent('input');await cap.fill(String(c));await cap.dispatchEvent('input');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.backoffTrace({...p,base:b,cap:c}).output);assert.equal(await page.locator('#r25-backoff-base-value').innerText(),String(b));assert.equal(await page.locator('#r25-backoff-cap-value').innerText(),String(c));await layout(page,root,'delays/'+b+'/'+c+'/'+locale+'/'+width);}
   await base.fill('2');await base.dispatchEvent('input');await preset.selectOption('fraction');assert.equal(await cap.inputValue(),'1.5');assert.deepEqual(JSON.parse(await output.getAttribute('data-trace-output')),M.fromPreset(kind,M.presets.backoff.fraction).output);
  }
  await reset.click();await index.focus();await index.press('End');assert.equal(await index.inputValue(),String(await index.locator('option').count()-1));await reset.click();
  if(width<650)for(const font of ['serif','monospace']){const style=await page.addStyleTag({content:'body{font-family:'+font+'!important}.lesson-calc-context dt{font-size:15px!important}'});await layout(page,root,'fallback/'+font+'/'+locale+'/'+kind+'/'+width);await style.evaluate(e=>e.remove());}
  if(locale){assert.ok((await root.innerText()).includes('可视化讲解'));if(kind==='backoff')assert.doesNotMatch(await root.locator('.r25-flags').innerText(),/Mark this call/);}
  if(kind==='backoff')await root.locator('.lesson-formula').screenshot({path:`${dir}/backoff-${locale?'zh':'en'}-${width}-formula.png`,style:'header{visibility:hidden!important}'});await root.locator('.lesson-calculation').screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-calculation.png`,style:'header{visibility:hidden!important}'});
  metrics.push({kind,locale,...await layout(page,root,[kind,locale,width].join('/'))});await root.screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}.png`,style:'header{visibility:hidden!important}'});await root.locator('.r25-figure').first().screenshot({path:`${dir}/${kind}-${locale?'zh':'en'}-${width}-figure.png`,style:'header{visibility:hidden!important}'});
 }
 assert.deepEqual(errors,[]);await context.close();
}
const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:850}});await routeFiles(context);const page=await context.newPage();for(const locale of ['','zh/'])for(const[kind,id]of Object.entries(M.ids)){await page.goto(base+locale+'editorials/'+id+'/');const root=page.locator('[data-lesson="r25-'+kind+'"]');assert.deepEqual(JSON.parse(await page.locator('#r25-'+kind+'-output').getAttribute('data-trace-output')),M.fromPreset(kind,M.presets[kind].basic).output);assert.equal(await root.locator('input:enabled,select:enabled,button:enabled').count(),0);await layout(page,root,'no-js/'+locale+'/'+kind);if(locale&&kind==='backoff')assert.doesNotMatch(await root.locator('.r25-flags').innerText(),/Mark this call/);}await context.close();await writeFile(dir+'/browser-metrics.json',JSON.stringify(metrics,null,2));console.log('PASS 30 EN/ZH desktop/390px/320px pages: validation stop/skip states, float vs int, every arrival prefix, received None, retry cap/reset, preset/reset/empty and keyboard/fallback fonts; 10 no-JS examples');
}finally{await browser.close();}
