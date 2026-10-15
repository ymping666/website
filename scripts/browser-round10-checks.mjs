import assert from 'node:assert/strict';

// Reused by the existing offline browser harness, with no external requests.
export async function checkDiffusionLessons(page,base){
 const defaults={
  'diffusion-reconstruct-x0':'[2, -1]',
  'diffusion-ddpm-posterior':'[1.316507, 1.035824]',
  'diffusion-ddim-deterministic':'[2.232051, 0.133975]'
 };
 for(const locale of ['','zh/'])for(const[id,expected]of Object.entries(defaults)){
  await page.goto(base+locale+'editorials/'+id+'/');
  await page.locator('.visual-lesson button:enabled').waitFor();
  const output=()=>page.locator('#diffusion-output').innerText();
  assert.equal(await output(),expected);
  if(id==='diffusion-reconstruct-x0'){
   assert.deepEqual(await page.locator('[data-reconstruction-result]').allTextContents(),['2','-1']);
   assert.deepEqual(await page.locator('[data-reconstruction-residual]').allTextContents(),['1','-0.5']);
   await page.locator('#diff-bias').press('End');assert.equal(await output(),'[0.267949, -2.732051]');
   assert.deepEqual(await page.locator('[data-reconstruction-result]').allTextContents(),['0.267949','-2.732051']);
   await page.locator('#diff-alpha').press('End');assert.equal(await output(),'[2, -1]');
   await page.locator('#diff-pair').selectOption('empty');assert.equal(await output(),'[]');
   assert.equal(await page.locator('.r10-process-card').count(),0);
  }else if(id==='diffusion-ddpm-posterior'){
   await page.locator('#post-alpha').press('Home');await page.locator('#post-prev').press('End');assert.equal(await output(),'[1.95598, -0.948645]');
  }else{
   await page.locator('#diff-bias').press('End');await page.locator('#ddim-prev').press('Home');assert.equal(await output(),'[1.866025, 1.232051]');
   await page.locator('#ddim-prev').press('End');assert.equal(await output(),'[0.267949, -2.732051]');
   await page.locator('#ddim-current').selectOption('1');assert.equal(await output(),'[2, -1]');
   assert.equal(await page.locator('#ddim-prev').inputValue(),'1');
   await page.locator('#diff-pair').selectOption('empty');assert.equal(await output(),'[]');
  }
  await page.locator('[data-reset-lesson]').press('Enter');assert.equal(await output(),expected,'Reset restores a valid select option and target range');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.doesNotMatch(await page.locator('#diff-view').innerText(),/NaN|Infinity|undefined/);
 }
 console.log('PASS six bilingual diffusion pages: error amplification, endpoint identity, target clamping, empty vectors and reset regression');
}
