import assert from 'node:assert/strict';
import { problems } from '../src/problems.mjs';
import { checkWorkbenchUX } from './browser-workbench.mjs';

export async function checkPracticeUX(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const softmax = problems.find(p => p.id === 'stable-softmax');
  const waitForPass = () => page.waitForFunction(() => /5\/5 (passed|通过)/.test(document.querySelector('#status').textContent), null, { timeout: 120000 });
  try {
    await page.goto(base + 'problems/stable-softmax/');
    await page.waitForFunction(() => document.querySelector('[data-next-practice]').textContent.startsWith('Next:'));
    assert.match(await page.locator('[data-next-practice]').first().getAttribute('href'), /foundation-matmul/);
    assert.match(await page.locator('.example-block').innerText(), /Expected output/);
    assert.match(await page.locator('.example-io').nth(1).innerText(), /0\.268941/);
    assert.equal(await page.locator('.example-assertion[open]').count(), 0);
    await page.locator('.example-assertion summary').first().click();
    assert.match(await page.locator('.example-assertion[open]').innerText(), /assert/);
    const unsafe = 'import math\ndef stable_softmax(logits, temperature):\n    w = [math.exp(x / temperature) for x in logits]\n    return [x / sum(w) for x in w]';
    await page.locator('#code-editor').fill(unsafe);
    await page.locator('#run-samples').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === '1/2 passed', null, { timeout: 120000 });
    assert.match(await page.locator('.case-error').innerText(), /OverflowError/);
    assert.match(await page.locator('.error-guidance').innerText(), /subtract/);
    assert.equal(await page.locator('#success-panel').isVisible(), false);
    assert.match(await page.locator('#runtime-metrics').innerText(), /Python setup: [\d.]+s · Tests: [\d.]+s/);
    await page.locator('#code-editor').fill(softmax.solution);
    await page.locator('#submit-solution').click();
    await waitForPass();
    assert.equal(await page.locator('#success-title').innerText(), 'First implementation unlocked!');
    assert.equal(await page.locator('.case-detail.good').count(), 5);
    await page.screenshot({ path: 'artifacts/practice-softmax-desktop.png', fullPage: true });
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#reset-code').click();
    assert.equal(await page.locator('#code-editor').inputValue(), softmax.starter);
    assert.equal(await page.locator('#success-panel').isVisible(), false);
    await page.locator('#code-editor').fill(softmax.solution);
    await page.locator('[data-language="zh"]').click();
    await page.waitForFunction(() => document.querySelector('#completion-indicator').textContent.includes('已在本地通过'));
    assert.equal(await page.locator('#code-editor').inputValue(), softmax.solution);
    assert.match(await page.locator('.example-block').innerText(), /预期输出/);
    await page.locator('#code-editor').fill(unsafe);
    await page.locator('#run-samples').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === '1/2 通过', null, { timeout: 120000 });
    assert.match(await page.locator('.error-guidance').innerText(), /数值运算溢出/);
    await page.locator('#code-editor').fill(softmax.solution);
    await page.locator('#submit-solution').click();
    await waitForPass();
    await page.waitForFunction(() => document.querySelector('#success-title').textContent === '复习完成');
    assert.match(await page.locator('#runtime-metrics').innerText(), /Python 环境准备/);
    await page.screenshot({ path: 'artifacts/practice-softmax-zh-desktop.png', fullPage: true });
    await page.goto(base + 'zh/progress/');
    await page.waitForFunction(() => document.querySelector('#solved-total').textContent === '1');
    assert.match(await page.locator('#resume-practice').getAttribute('href'), /foundation-matmul/);
    assert.match(await page.locator('#daily-challenge').getAttribute('href'), /foundation-matmul/);
    await page.goto(base + 'zh/practice-sets/attention-from-scratch/');
    await page.locator('.practice-step').nth(1).locator('a').first().click();
    assert.match(page.url(), /foundation-matmul\/\?set=attention-from-scratch$/);
    await page.waitForFunction(() => document.querySelector('[data-next-practice]').getAttribute('href').includes('set=attention-from-scratch'));
    assert.match(await page.locator('[data-next-practice]').first().getAttribute('href'), /foundation-layer-normalization/);
    await page.locator('[data-language="en"]').click();
    assert.match(page.url(), /\/problems\/foundation-matmul\/\?set=attention-from-scratch$/);
    await page.waitForFunction(() => document.querySelector('.panel-tabs a').getAttribute('href').includes('set=attention-from-scratch'));
    await page.locator('.panel-tabs a').click();
    assert.match(page.url(), /editorials\/foundation-matmul\/\?set=attention-from-scratch$/);
    await page.waitForFunction(() => [...document.querySelectorAll('.editorial-callout a')].some(a => a.href.includes('set=attention-from-scratch')));
    await page.getByRole('link', { name: 'Return to editor →', exact: true }).click();
    assert.match(page.url(), /problems\/foundation-matmul\/\?set=attention-from-scratch$/);
    for (const width of [1366, 768, 651, 375]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['problems/stable-softmax/', 'zh/problems/stable-softmax/', 'problems/mpc-first-action/', 'zh/progress/']) {
        await page.goto(base + path);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px overflow: ${path}`);
        if (path.includes('/problems/') || path.startsWith('problems/')) {
          assert.equal(await page.locator('.panel-content').evaluate(el => getComputedStyle(el).overflowY), 'visible');
          assert.equal(await page.locator('.results-pane').evaluate(el => getComputedStyle(el).overflowY), 'visible');
        }
      }
    }
    await page.goto(base + 'zh/problems/stable-softmax/');
    await page.screenshot({ path: 'artifacts/practice-softmax-zh-mobile.png', fullPage: true });
    // A fresh test fixture covers the all-completed edge case without changing real user storage.
    await page.evaluate(ids => localStorage.setItem('frontiercode:v04:completed', JSON.stringify(Object.fromEntries(ids.map(id => [id, true])))), problems.map(p => p.id));
    await page.goto(base + 'zh/progress/');
    await page.waitForFunction(count => document.querySelector('#solved-total').textContent === String(count), problems.length);
    assert.match(await page.locator('#resume-practice').innerText(), /复习/);
    assert.match(await page.locator('#daily-challenge').innerText(), /复习/);
    assert.deepEqual(errors, []);
    console.log('PASS real Softmax failure/pass, bilingual guidance/timing, first milestone, resume/daily ordering, sequence through language/editorial, responsive scroll and all-solved review');
  } finally { await context.close(); }
  await checkWorkbenchUX(browser, base);
}
