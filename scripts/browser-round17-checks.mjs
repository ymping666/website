import assert from 'node:assert/strict';
export const round17Cases=[['diffusion-linear-beta','beta',[.1,.2,.3,.4,.5]],['diffusion-alpha-bar','alpha',[.9,.72,.504]],['diffusion-noise-mse','noise',2.5],['transformer-swiglu','swiglu',[-.8068242641099853,1.4621171572600098]],['attention-key-padding-mask','mask',[-2,'-inf',-1]]];
function close(actual,expected){if(Array.isArray(expected)){assert.equal(actual.length,expected.length);expected.forEach((v,i)=>close(actual[i],v));}else if(typeof expected==='number')assert.ok(Math.abs(actual-expected)<6e-7);else assert.equal(actual,expected);}
const read=async(page,kind)=>JSON.parse((await page.locator('#r17-'+kind+'-output').innerText()).replace(/(?<!")-inf(?!")/g,'"-inf"'));
async function fits(page){
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow');
 assert.ok(await page.locator('.lesson-calculation .r16-gate-node:not(.lesson-calc-vector)>samp,.lesson-calculation .r16-gate-node>output').evaluateAll(nodes=>nodes.every(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)*1.2)),'Readable single-line numeric operands');
 assert.ok(await page.locator('.r17-prob samp,.r17-key dd,.r17-bars li>samp').evaluateAll(nodes=>nodes.every(e=>e.scrollWidth<=e.clientWidth+1)),'Bar labels and masks fit');
}
export async function checkRound17Lessons(page,base){
 for(const width of [1280,375])for(const locale of ['','zh/'])for(const[id,kind,initial]of round17Cases){
  await page.setViewportSize({width,height:900});await page.goto(base+locale+'editorials/'+id+'/');await page.locator('[data-reset-lesson]:enabled').waitFor();close(await read(page,kind),initial);await fits(page);
  const $=key=>page.locator('#r17-'+kind+'-'+key),reset=()=>page.locator('[data-reset-lesson]').press('Enter');
  if(kind==='beta'){
   await $('steps').press('Home');close(await read(page,kind),[.1]);assert.equal(await $('index').inputValue(),'0');await fits(page);
   await $('steps').press('End');assert.equal((await read(page,kind)).length,8);await $('index').selectOption('7');await $('preset').selectOption('paper');close((await read(page,kind))[7],.02);await fits(page);
   await $('preset').selectOption('constant');assert.ok((await read(page,kind)).every(v=>v===.05));
  }else if(kind==='alpha'){
   await $('preset').selectOption('strong');close(await read(page,kind),[.1,.01,.001]);await $('index').selectOption('2');await fits(page);
   await $('preset').selectOption('empty');close(await read(page,kind),[]);assert.ok(await $('index').isDisabled());await reset();assert.ok(await $('index').isEnabled());
  }else if(kind==='noise'){
   await $('preset').selectOption('signed');close(await read(page,kind),4);await $('delta').press('End');close(await read(page,kind),2);await $('index').selectOption('1');close(await read(page,kind),10);await fits(page);
   await $('preset').selectOption('empty');close(await read(page,kind),0);assert.ok(await $('delta').isDisabled());await reset();assert.ok(await $('delta').isEnabled());
  }else if(kind==='swiglu'){
   await $('preset').selectOption('extreme');close(await read(page,kind),[0,1000]);await $('index').selectOption('1');await $('delta').press('End');close(await read(page,kind),[0,1002]);await fits(page);
   await $('index').selectOption('0');assert.ok((await read(page,kind)).every(Number.isFinite));await $('preset').selectOption('empty');close(await read(page,kind),[]);assert.ok(await $('index').isDisabled());await reset();assert.ok(await $('delta').isEnabled());
  }else{
   await $('delta').press('End');close(await read(page,kind),initial);await $('index').selectOption('1');await fits(page);
   await $('preset').selectOption('large');close(await read(page,kind),[-1e9,'-inf']);await fits(page);
   await $('preset').selectOption('all');close(await read(page,kind),[-1,0,1]);assert.ok(await $('delta').isDisabled());await reset();assert.ok(await $('delta').isEnabled());
  }
  await reset();close(await read(page,kind),initial);await fits(page);
 }
 console.log('PASS round 17 EN/ZH at 1280/375px: five default examples, meaningful controls, bounds, extremes, empty states, disabling, reset and numeric readability');
}
export async function checkStaticRound17Lessons(page,base){
 for(const locale of ['','zh/'])for(const[id,kind,expected]of round17Cases){
  await page.goto(base+locale+'editorials/'+id+'/');close(await read(page,kind),expected);assert.ok(await page.locator('.visual-lesson noscript p').isVisible());assert.equal(await page.locator('.visual-lesson select:enabled,.visual-lesson input:enabled,.visual-lesson button:enabled').count(),0);await fits(page);
 }
 console.log('PASS round 17 no-JS: 10 complete worked examples, disabled controls and mobile layout');
}
