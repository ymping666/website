import assert from 'node:assert/strict';
export async function checkNormalizationLessons(page,base){
 for(const locale of ['','zh/']){
  const go=async id=>{await page.goto(base+locale+'editorials/'+id+'/');await page.locator('[data-reset-lesson]:enabled').waitFor();};
  const out=async id=>JSON.parse(await page.locator('#'+id).innerText());
  const width=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await go('norm-rmsnorm-gain');assert.ok((await out('rms-gain-output'))[0]>1.99);
  await page.locator('#rms-example').selectOption('single');assert.equal(await page.locator('#rms-index option').count(),1);
  await page.locator('#rms-example').selectOption('zero');assert.deepEqual(await out('rms-gain-output'),[0,0]);
  await page.locator('[data-reset-lesson]').press('Enter');const initial=await out('rms-gain-output');
  await page.locator('#rms-gain-delta').press('End');const changed=await out('rms-gain-output');assert.ok(changed[0]>initial[0]);assert.equal(changed[1],initial[1]);
  await page.locator('#rms-index').selectOption('1');assert.equal((await out('rms-gain-output'))[0],initial[0]);
  await page.locator('#rms-eps').selectOption('1');await width();
  await go('transformer-prenorm-residual');assert.deepEqual(await out('prenorm-output'),[-1,5]);
  await page.locator('#prenorm-block').selectOption('zero');assert.deepEqual(await out('prenorm-output'),[1,3]);
  await page.locator('#prenorm-normalize').selectOption('identity');await page.locator('#prenorm-block').selectOption('double');assert.deepEqual(await out('prenorm-output'),[3,9]);
  await page.locator('#prenorm-normalize').selectOption('layer');assert.ok((await out('prenorm-output'))[1]>4.99);
  await page.locator('#prenorm-example').selectOption('empty');assert.deepEqual(await out('prenorm-output'),[]);assert.ok(await page.locator('#prenorm-index').isDisabled());
  await page.locator('[data-reset-lesson]').press('Enter');assert.deepEqual(await out('prenorm-output'),[-1,5]);assert.ok(await page.locator('#prenorm-index').isEnabled());await width();
  await go('dit-adaln-modulation');assert.ok((await out('modulation-output'))[1]>3.99);
  await page.locator('#modulation-example').selectOption('cancel');assert.deepEqual(await out('modulation-output'),[5,6]);
  await page.locator('#modulation-example').selectOption('constant');assert.deepEqual(await out('modulation-output'),[3,4]);
  await page.locator('#modulation-example').selectOption('neutral');const neutral=await out('modulation-output');assert.ok(neutral[0]<0&&neutral[1]<1);
  await page.locator('#modulation-scale').press('End');assert.equal((await out('modulation-output'))[0],neutral[0]);assert.ok((await out('modulation-output'))[1]>2.9);
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#modulation-index').inputValue(),'1');await width();
  await go('dit-adaln-zero-gate');assert.deepEqual(await out('residual-gate-output'),[1,2]);
  assert.equal(await page.locator('[data-gate-node]').count(),6);assert.equal(await page.locator('[data-gate-node=update] samp').innerText(),'0');assert.equal(await page.locator('[data-gate-node=carried] samp').innerText(),'0');
  await page.locator('#gate-delta').press('End');assert.deepEqual(await out('residual-gate-output'),[5,2]);
  assert.equal(await page.locator('[data-gate-node=update] samp').innerText(),'4');assert.equal(await page.locator('[data-gate-node=input] samp').innerText(),'1');assert.equal(await page.locator('#residual-gate-number').innerText(),'5');
  await page.locator('[data-reset-lesson]').press('Enter');await page.locator('#gate-example').selectOption('signed');assert.deepEqual(await out('residual-gate-output'),[3,0]);
  await page.locator('#gate-index').selectOption('1');assert.equal(await page.locator('[data-gate-node=carried] samp').innerText(),'-2');assert.equal(await page.locator('#residual-gate-number').innerText(),'0');
  await page.locator('#gate-example').selectOption('outside');assert.deepEqual(await out('residual-gate-output'),[1,0,6]);
  await page.locator('#gate-example').selectOption('empty');assert.deepEqual(await out('residual-gate-output'),[]);assert.ok(await page.locator('#gate-index').isDisabled());
  await page.locator('[data-reset-lesson]').press('Enter');assert.deepEqual(await out('residual-gate-output'),[1,2]);assert.ok(await page.locator('#gate-index').isEnabled());await width();
 }
 console.log('PASS normalization/residual browser controls: bilingual per-channel updates, normalization choices, zero/negative gates, empty shapes and resets');
}
export async function checkStaticNormalizationLessons(page,base){
 for(const locale of ['','zh/'])for(const[id,output,expected]of [['norm-rmsnorm-gain','rms-gain-output',[1.998889813958309,-.9994449069791544]],['transformer-prenorm-residual','prenorm-output',[-1,5]],['dit-adaln-modulation','modulation-output',[.004962809790010736,3.9900743804199785]],['dit-adaln-zero-gate','residual-gate-output',[1,2]]]){
  await page.goto(base+locale+'editorials/'+id+'/');const actual=JSON.parse(await page.locator('#'+output).innerText());assert.equal(actual.length,expected.length);assert.ok(actual.every((v,i)=>Math.abs(v-expected[i])<1e-12));
  assert.ok(await page.locator('.visual-lesson noscript p').isVisible());assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);
  assert.ok(await page.locator('.visual-lesson math').count()>=2);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS 8 normalization no-JS editorials: complete default traces, native math, disabled controls and mobile widths');
}
