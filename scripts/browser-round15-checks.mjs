import assert from 'node:assert/strict';
export async function checkGradientLessons(page,base){
 for(const locale of ['','zh/']){
  const go=async id=>{await page.goto(base+locale+'editorials/'+id+'/');await page.locator('[data-reset-lesson]:enabled').waitFor();};
  const out=async id=>JSON.parse(await page.locator('#'+id).innerText());
  const width=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await go('autograd-linear-forward');assert.deepEqual(await out('linear-forward-output'),[12,0]);
  await page.locator('#fwd-row').selectOption('1');assert.equal(await page.locator('#forward-number').innerText(),'0');
  await page.locator('#fwd-bias').press('End');assert.deepEqual(await out('linear-forward-output'),[14,2]);
  await page.locator('[data-reset-lesson]').press('Enter');await page.locator('#fwd-example').selectOption('rectangular');assert.deepEqual(await out('linear-forward-output'),[0,3]);
  await page.locator('#fwd-example').selectOption('noInputs');assert.deepEqual(await out('linear-forward-output'),[2,-1]);
  await page.locator('#fwd-example').selectOption('noOutputs');assert.deepEqual(await out('linear-forward-output'),[]);assert.ok(await page.locator('#fwd-row').isDisabled());
  await page.locator('[data-reset-lesson]').press('Enter');assert.ok(await page.locator('#fwd-row').isEnabled());await width();
  await go('autograd-mse-gradient');assert.deepEqual(await out('mse-gradient-output'),[1,2]);
  await page.locator('#mse-repeat').selectOption('2');assert.deepEqual(await out('mse-gradient-output'),[.5,1,.5,1]);
  await page.locator('#mse-index').selectOption('3');assert.equal(await page.locator('#mse-number').innerText(),'1');
  await page.locator('[data-reset-lesson]').press('Enter');await page.locator('#mse-example').selectOption('matched');assert.deepEqual(await out('mse-gradient-output'),[0,0]);await width();
  await go('autograd-relu-backward');assert.equal(await page.locator('#relu-number').innerText(),'-5');
  await page.locator('#relu-offset').press('Home');await page.locator('#relu-offset').press('ArrowRight');await page.locator('#relu-offset').press('ArrowRight');assert.equal(await page.locator('#relu-number').innerText(),'0');
  await page.locator('#relu-example').selectOption('empty');assert.deepEqual(await out('relu-backward-output'),[]);assert.ok(await page.locator('#relu-index').isDisabled());
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#relu-number').innerText(),'-5');await width();
  await go('autograd-linear-backward');assert.deepEqual(await out('linear-backward-output'),[[0,5],[[1,2],[-2,-4]],[1,-2]]);
  await page.locator('#back-input').selectOption('1');await page.locator('#back-row').selectOption('1');assert.equal(await page.locator('#backward-number').innerText(),'5');
  await page.locator('#back-scale').press('Home');assert.deepEqual(await out('linear-backward-output'),[[0,-10],[[-2,-4],[4,8]],[-2,4]]);
  await page.locator('[data-reset-lesson]').press('Enter');await page.locator('#back-example').selectOption('noInputs');assert.deepEqual(await out('linear-backward-output'),[[],[[],[]],[3,-2]]);assert.ok(await page.locator('#back-input').isDisabled());
  await page.locator('#back-example').selectOption('noOutputs');assert.deepEqual(await out('linear-backward-output'),[[0,0],[],[]]);
  await page.locator('[data-reset-lesson]').press('Enter');await width();
  await go('autograd-central-difference');assert.equal(await out('central-difference-output'),3.25);
  await page.locator('#central-h').selectOption('0.01');assert.ok(Math.abs(await out('central-difference-output')-3.0001)<1e-12);
  await page.locator('#central-function').selectOption('absolute');await page.locator('#central-x').press('Home');for(let i=0;i<8;i++)await page.locator('#central-x').press('ArrowRight');assert.equal(await out('central-difference-output'),0);
  assert.ok(await page.locator('#central-view .lesson-warning').isVisible());
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await out('central-difference-output'),3.25);await width();
 }
 console.log('PASS five bilingual gradient lessons: inspected paths, rectangular/empty shapes, mean scaling, signed/zero ReLU gates, central probes, reset and mobile widths');
}
export async function checkStaticGradientLessons(page,base){
 const cases=[['autograd-linear-forward','linear-forward-output',[12,0]],['autograd-mse-gradient','mse-gradient-output',[1,2]],['autograd-relu-backward','relu-backward-output',[0,0,-5]],['autograd-linear-backward','linear-backward-output',[[0,5],[[1,2],[-2,-4]],[1,-2]]],['autograd-central-difference','central-difference-output',3.25]];
 for(const locale of ['','zh/'])for(const[id,output,expected]of cases){
  await page.goto(base+locale+'editorials/'+id+'/');assert.deepEqual(JSON.parse(await page.locator('#'+output).innerText()),expected);
  assert.ok(await page.locator('.visual-lesson noscript p').isVisible());assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS 10 gradient no-JS editorials: complete worked examples, disabled controls and mobile widths');
}
