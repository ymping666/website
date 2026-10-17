import assert from 'node:assert/strict';
export async function checkPlanningLessons(page,base){
 for(const locale of ['','zh/']){
  await page.goto(base+locale+'editorials/prediction-vs-decision/');await page.locator('#forecast-preset:enabled').waitFor();
  const initial=await page.locator('#forecast-output').innerText();
  assert.equal(JSON.parse(initial).lower_regret,'B');assert.equal(JSON.parse(initial).lower_mse,'A');
  await page.locator('#forecast-adjust').press('Home');assert.equal(JSON.parse(await page.locator('#forecast-output').innerText()).regret_a,0);
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#forecast-output').innerText(),initial);
  await page.locator('#forecast-preset').selectOption('tie');assert.equal(JSON.parse(await page.locator('#forecast-output').innerText()).regret_a,5);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+locale+'editorials/risk-sensitive-planner/');await page.locator('#risk-preset:enabled').waitFor();
  assert.equal(await page.locator('#risk-choice').innerText(),'safe');
  await page.locator('#risk-weight').press('Home');assert.equal(await page.locator('#risk-choice').innerText(),'risky');
  await page.locator('#risk-weight').press('ArrowRight');await page.locator('#risk-weight').press('ArrowRight');
  assert.equal(await page.locator('#risk-weight-value').innerText(),'0.5');assert.equal(await page.locator('#risk-choice').innerText(),'risky');
  await page.locator('#risk-weight').press('ArrowRight');assert.equal(await page.locator('#risk-choice').innerText(),'safe');
  await page.locator('#risk-preset').selectOption('empty');assert.equal(await page.locator('#risk-output').innerText(),'None');
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#risk-choice').innerText(),'safe');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+locale+'editorials/cem-categorical-update/');await page.locator('#cem-preset:enabled').waitFor();
  const output=async()=>JSON.parse(await page.locator('#cem-output').innerText());
  assert.deepEqual(await output(),[[0.5,0.5,0],[0,1,0],[0.5,0,0.5]]);
  await page.locator('#cem-step').selectOption('2');assert.equal(await page.locator('.r12-column').count(),4);
  await page.locator('#cem-preset').selectOption('ties');assert.deepEqual(await output(),[[0,0.5,0.5]]);
  await page.locator('#cem-count').selectOption('1');assert.deepEqual(await output(),[[0,0,1]]);
  await page.locator('#cem-preset').selectOption('empty');assert.deepEqual(await output(),[]);assert.equal(await page.locator('#cem-step').isDisabled(),true);
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('#cem-step').isEnabled(),true);
  assert.deepEqual(await output(),[[0.5,0.5,0],[0,1,0],[0.5,0,0.5]]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS bilingual planning controls, exact tie thresholds, empty sets/horizons, reset and responsive widths');
}
export async function checkStaticPlanningLessons(page,base){
 const examples=[['prediction-vs-decision','forecast-output',x=>x.lower_mse==='A'&&x.lower_regret==='B'],['risk-sensitive-planner','risk-output',x=>x==='safe'],['cem-categorical-update','cem-output',x=>JSON.stringify(x)==='[[0.5,0.5,0],[0,1,0],[0.5,0,0.5]]']];
 for(const locale of ['','zh/'])for(const[id,output,check]of examples){
  await page.goto(base+locale+'editorials/'+id+'/');
  assert.ok(check(JSON.parse(await page.locator('#'+output).innerText())));
  assert.ok(await page.locator('.visual-lesson noscript p').isVisible());
  assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS six planning editorials without JavaScript: complete default outputs, disabled controls and mobile widths');
}
