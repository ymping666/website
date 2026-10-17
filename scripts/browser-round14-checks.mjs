import assert from 'node:assert/strict';
export async function checkConstitutionalLessons(page,base){
 for(const locale of ['','zh/']){
  await page.goto(base+locale+'editorials/constitutional-revision-dataset/');await page.locator('#revision-example:enabled').waitFor();
  assert.deepEqual(JSON.parse(await page.locator('#revision-output').innerText()),[['Q','revision_1'],['Q','revision_2']]);
  await page.locator('#revision-example').selectOption('broken');assert.equal(await page.locator('#revision-output').innerText(),'raises ValueError');
  await page.locator('#revision-example').selectOption('unknown');assert.equal(await page.locator('.r14-skipped').count(),1);
  await page.locator('#revision-example').selectOption('whitespace');assert.deepEqual(JSON.parse(await page.locator('#revision-output').innerText()),[[' Q ',' answer '],[' Q ','']]);
  await page.locator('#revision-example').selectOption('duplicates');assert.equal(JSON.parse(await page.locator('#revision-output').innerText()).length,2);
  await page.locator('#revision-example').selectOption('empty');assert.equal(await page.locator('#revision-output').innerText(),'[]');
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await page.locator('.r14-chain>li').count(),2);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+locale+'editorials/constitutional-soft-preference/');await page.locator('#preference-gap:enabled').waitFor();
  const readLabel=async()=>JSON.parse(await page.locator('#preference-output').innerText());
  const start=await readLabel();assert.ok(Math.abs(start[0]-.8807970779778823)<1e-12);
  await page.locator('#preference-clamp').check();assert.deepEqual(await readLabel(),[.6,.4]);
  await page.locator('#preference-gap').press('Home');assert.deepEqual(await readLabel(),[.4,.6]);
  await page.locator('[data-reset-lesson]').press('Enter');await page.locator('#preference-offset').press('End');assert.deepEqual(await readLabel(),start);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(base+locale+'editorials/constitutional-preference-loss/');await page.locator('#loss-gap:enabled').waitFor();
  const readLoss=async()=>Number(await page.locator('#preference-loss-output').innerText());
  const first=await readLoss();assert.ok(Math.abs(first-.9269280110429725)<1e-12);
  await page.locator('#loss-copies').selectOption('4');assert.equal(await readLoss(),first);
  await page.locator('#loss-shift').press('End');assert.equal(await readLoss(),first);
  await page.locator('#loss-gap').press('End');await page.locator('#loss-scale').selectOption('125');assert.equal(await readLoss(),400);
  await page.locator('#loss-target').press('End');assert.equal(await readLoss(),0);
  await page.locator('#loss-gap').press('Home');assert.equal(await readLoss(),1000);
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await readLoss(),first);assert.equal(await page.locator('.r14-curve svg circle').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS Constitutional AI bilingual controls: broken/empty/duplicate chains, preserved whitespace, label clamp/shift, stable extreme loss, mean reduction and reset');
}
export async function checkStaticConstitutionalLessons(page,base){
 const cases=[['constitutional-revision-dataset','revision-output',[['Q','revision_1'],['Q','revision_2']]],['constitutional-soft-preference','preference-output',[.8807970779778823,.11920292202211769]],['constitutional-preference-loss','preference-loss-output',.9269280110429725]];
 for(const locale of ['','zh/'])for(const[id,selector,expected]of cases){
  await page.goto(base+locale+'editorials/'+id+'/');assert.deepEqual(JSON.parse(await page.locator('#'+selector).innerText()),expected);
  assert.ok(await page.locator('.visual-lesson noscript p').isVisible());assert.equal(await page.locator('.visual-lesson input:enabled,.visual-lesson select:enabled,.visual-lesson button:enabled').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 console.log('PASS 6 Constitutional AI no-JS pages: complete default examples, disabled controls and mobile width');
}
