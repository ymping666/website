import assert from 'node:assert/strict';
export async function checkCalculationLayouts(page,base){
 const cases=[['transformer-prenorm-residual','prenorm-number','-1'],['norm-rmsnorm-gain','rms-gain-number','1.99889'],['dit-adaln-modulation','modulation-number','3.990074'],['autograd-relu-backward','relu-number','-5'],['autograd-mse-gradient','mse-number','1']];
 const value=async key=>JSON.parse(await page.locator(`[data-calc-key="${key}"]`).getAttribute('data-calc-value'));
 async function fits(){
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await page.locator('.lesson-calculation .r16-gate-node:not(.lesson-calc-vector) > samp,.lesson-calculation .r16-gate-node > output').evaluateAll(nodes=>nodes.every(el=>el.scrollWidth<=el.clientWidth+1&&el.getBoundingClientRect().height<=parseFloat(getComputedStyle(el).lineHeight)*1.2)),'Numeric operands stay on one line, including negative six-decimal values');
 }
 for(const width of [1280,375])for(const locale of ['','zh/']){
  await page.setViewportSize({width,height:900});
  for(const[id,number,expected]of cases){
   await page.goto(base+locale+'editorials/'+id+'/');await page.locator('[data-reset-lesson]:enabled').waitFor();assert.equal(await page.locator('#'+number).innerText(),expected);await fits();
   if(id==='transformer-prenorm-residual'){
    assert.deepEqual(await value('prenorm-x-vector'),[1,3]);assert.deepEqual(await value('prenorm-z-vector'),[-1,1]);
    await page.locator('#prenorm-normalize').selectOption('layer');await fits();
    await page.locator('#prenorm-example').selectOption('empty');assert.equal(await page.locator('.lesson-calculation .r16-gate-channel').count(),0);
   }else if(id==='norm-rmsnorm-gain'){
    await page.locator('#rms-index').selectOption('1');await page.locator('#rms-eps').selectOption('0.000001');assert.equal(await value('rms-gain'),-1);assert.equal(await value('rms-z'),await value('rms-z-again'));await fits();
   }else if(id==='dit-adaln-modulation'){
    assert.equal(await value('adaln-factor'),2);await page.locator('#modulation-index').selectOption('0');await fits();
    await page.locator('#modulation-example').selectOption('cancel');assert.equal(await value('adaln-factor'),0);assert.equal(await page.locator('#modulation-number').innerText(),'5');
   }else if(id==='autograd-relu-backward'){
    assert.equal(await value('relu-mask'),1);assert.equal(await value('relu-g'),-5);await page.locator('#relu-example').selectOption('zeros');assert.equal(await value('relu-mask'),0);assert.equal(await page.locator('#relu-number').innerText(),'0');
   }else{
    await page.locator('#mse-example').selectOption('mixed');await page.locator('#mse-repeat').selectOption('4');assert.equal(await value('mse-n'),12);assert.equal(await value('mse-two-r'),-4);assert.equal(await value('mse-square'),4);await fits();
   }
   await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#'+number).innerText(),expected);await fits();
  }
 }
 console.log('PASS five calculation layouts in EN/ZH at 1280/375px: actual operands, carried intermediates, whole-vector calls, mask decision, residual fork, empty state, reset and unbroken decimals');
}
