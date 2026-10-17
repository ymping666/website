import assert from 'node:assert/strict';
export async function checkRlefLessons(page,base){
 for(const locale of ['','zh/']){
  await page.goto(base+locale+'editorials/rlef-public-test-controller/');await page.locator('#episode-preset:enabled').waitFor();
  assert.equal(await page.locator('#episode-output').innerText(),'retry');
  await page.locator('[data-episode-feedback=pass]').press('Enter');assert.equal(await page.locator('#episode-output').innerText(),'private_eval');assert.ok(await page.locator('[data-episode-feedback=fail]').isDisabled());
  await page.locator('[data-episode-undo]').press('Enter');assert.equal(await page.locator('#episode-output').innerText(),'retry');
  await page.locator('#episode-preset').selectOption('afterSuccess');assert.equal(await page.locator('#episode-output').innerText(),'raises ValueError');
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#episode-output').innerText(),'retry');
  await page.locator('[data-episode-feedback=fail]').press('Enter');await page.locator('[data-episode-feedback=fail]').press('Enter');assert.equal(await page.locator('#episode-output').innerText(),'private_eval');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+locale+'editorials/rlef-shaped-turn-reward/');await page.locator('#reward-state:enabled').waitFor();
  const initial=await page.locator('#reward-output').innerText();assert.equal(Number(initial),-0.5);
  await page.locator('#reward-repeat').selectOption('4');assert.equal(await page.locator('#reward-output').innerText(),initial);
  await page.locator('#reward-tokens').selectOption('cancel');assert.ok(Math.abs(Number(await page.locator('#reward-output').innerText())+1/6)<1e-12);
  await page.locator('#reward-state').selectOption('finalInvalid');await page.locator('#reward-beta').press('Home');assert.equal(Number(await page.locator('#reward-output').innerText()),-1);
  await page.locator('[data-reset-lesson]').press('Enter');await page.locator('#reward-tokens').selectOption('negative');assert.equal(Number(await page.locator('#reward-output').innerText()),0.75);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+locale+'editorials/rlef-undiscounted-advantages/');await page.locator('#advantages-preset:enabled').waitFor();
  await page.locator('#advantages-step').selectOption('1');assert.equal(await page.locator('#advantage-number').innerText(),'0.7');
  await page.locator('#advantages-shift').press('ArrowRight');assert.equal(await page.locator('#advantage-number').innerText(),'0.45');
  await page.locator('#advantages-preset').selectOption('empty');assert.equal(await page.locator('#advantages-output').innerText(),'[]');assert.ok(await page.locator('#advantages-step').isDisabled());
  await page.locator('[data-reset-lesson]').press('Enter');await page.locator('#advantages-preset').selectOption('sparse');assert.deepEqual(JSON.parse(await page.locator('#advantages-output').innerText()),[1,1,1]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS RLEF bilingual controls: episode termination/undo/errors, signed reward/cancellation, suffix credit, empty input and reset');
}
export async function checkStaticRlefLessons(page,base){
 const cases=[['rlef-public-test-controller','episode-output','retry'],['rlef-shaped-turn-reward','reward-output',-0.5],['rlef-undiscounted-advantages','advantages-output',[0.6,0.7,0.7]]];
 for(const locale of ['','zh/'])for(const[id,selector,expected]of cases){
  await page.goto(base+locale+'editorials/'+id+'/');const raw=await page.locator('#'+selector).innerText();
  if(typeof expected==='string')assert.equal(raw,expected);else if(Array.isArray(expected))JSON.parse(raw).forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-12));else assert.equal(Number(raw),expected);
  assert.ok(await page.locator('.visual-lesson noscript p').isVisible());assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS 6 RLEF no-JS pages: complete default traces, disabled controls, readable native math and mobile widths');
}
