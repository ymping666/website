import assert from 'node:assert/strict';
export async function checkHeadAndCrossLessons(page,base){
 for(const locale of ['','zh/']){
  for(const mode of ['split','merge']){
   await page.goto(base+locale+'editorials/attention-'+mode+'-heads/');
   await page.locator('#head-count:enabled').waitFor();
   const initial=await page.locator('#head-output').innerText();
   await page.locator('[data-layout-cell="2"]').first().press('Enter');
   assert.equal(await page.locator('#head-selected-value').innerText(),'3');
   assert.equal(await page.locator(mode==='split'?'#head-target-index':'#head-source-index').innerText(),'heads[1][0][0]');
   assert.equal(await page.locator('.r11-cell[aria-pressed=true]').count(),2);
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.layoutCell),'2','Keyboard inspection retains focus');
   await page.locator('#head-count').selectOption('4');
   assert.equal(await page.locator(mode==='split'?'#head-target-index':'#head-source-index').innerText(),'heads[2][0][0]');
   await page.locator('#head-preset').selectOption('six');await page.locator('#head-count').selectOption('6');
   await page.locator('#head-preset').selectOption('empty');
   assert.equal(await page.locator('#head-output').innerText(),mode==='split'?'[[], [], [], [], [], []]':'[]');
   assert.equal(await page.locator('.r11-cell').count(),0);
   await page.locator('#head-preset').selectOption('zero');
   assert.equal(await page.locator('#head-output').innerText(),mode==='split'?'[[[], []], [[], []], [[], []], [[], []], [[], []], [[], []]]':'[[], []]');
   await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#head-output').innerText(),initial);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.goto(base+locale+'editorials/transformer-cross-attention/');
  await page.locator('#cross-preset:enabled').waitFor();
  const initial=await page.locator('#cross-output').innerText();
  await page.locator('#cross-inspect').selectOption('1');assert.equal(await page.locator('#cross-output').innerText(),initial);
  assert.equal(await page.locator('#cross-query-output').innerText(),'[0.49651, 2.013959, 2]');
  await page.locator('#cross-preset').selectOption('reversed');assert.equal(await page.locator('#cross-output').innerText(),initial);
  for(const[preset,expected]of [['uniform','[[0.666667, 1.333333, 2], [0.666667, 1.333333, 2]]'],['single','[[3, -1, 2], [3, -1, 2], [3, -1, 2]]'],['large','[[1, 0], [1, 0]]'],['scalar','[[4]]']]){
   await page.locator('#cross-preset').selectOption(preset);assert.equal(await page.locator('#cross-output').innerText(),expected);assert.equal(await page.locator('#cross-weight-sum').innerText(),'1');
  }
  await page.locator('#cross-scale').press('Home');await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#cross-output').innerText(),initial);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS bilingual head cell tracing, keyboard focus, dynamic head counts, zero-width rows, cross-attention presets and reset');
}
