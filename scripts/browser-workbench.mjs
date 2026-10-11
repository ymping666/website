import assert from 'node:assert/strict';
import { problems } from '../src/problems.mjs';

export async function checkWorkbenchUX(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const attention = problems.find(p => p.id === 'attention-scaled-dot-product');
  const call = 'scaled_attention([1,1], [[1,1],[0,0]], [[1],[0]])';
  const average = 'def scaled_attention(q, keys, values):\n    return [sum(v[j] for v in values)/len(values) for j in range(len(values[0]))]';
  const waitStatus = expected => page.waitForFunction(value => document.querySelector('#status').textContent === value, expected, { timeout: 120000 });
  try {
    await page.goto(base);
    assert.equal(await page.locator('.beginner-path li').count(), 4);
    assert.equal(await page.locator('.problem-list .problem-row').count(), 4);
    for (const id of ['tool-call-parser','react-trace-validator','linear-dynamics-rollout','flow-linear-interpolation']) {
      assert.equal(await page.locator(`.problem-list a[href*="/problems/${id}/"]`).count(), 1);
    }
    await page.goto(base + 'problems/attention-scaled-dot-product/?set=attention-from-scratch');
    await page.waitForFunction(() => document.querySelector('.route-position')?.textContent === 'Step 4 of 8');
    await page.locator('#practice-route summary').click();
    assert.equal(await page.locator('#practice-route li').count(), 8);
    assert.match(await page.locator('#practice-route [aria-current="step"]').innerText(), /Scaled Dot-Product/);
    const editor = page.locator('#code-editor');
    await editor.fill('x'); await editor.press('End'); await editor.press('Tab');
    assert.equal(await editor.inputValue(), 'x    ');
    await editor.press('ControlOrMeta+z'); assert.equal(await editor.inputValue(), 'x', 'Tab must be undoable');
    await editor.fill('def f():'); await editor.press('End'); await editor.press('Enter');
    assert.equal(await editor.inputValue(), 'def f():\n    ');
    await editor.fill(average);
    assert.equal(await page.locator('#practice-route details').getAttribute('open'), '', 'Editing must keep the step directory expanded');
    assert.equal(await page.locator('.code-lines').innerText(), '1\n2');
    assert.match(await page.locator('.py-keyword').first().innerText(), /def/);
    await page.locator('#run-samples').click(); await waitStatus('1/2 passed');
    const observed = await page.locator('.failure-values').innerText();
    assert.match(observed, /0\.5/); assert.match(observed, /0\.804429/); assert.match(observed, /0\.304429/); assert.match(observed, /1e-09/);
    const journeyBefore = await page.evaluate(() => localStorage.getItem('frontiercode:v04:journey'));
    await page.locator('.custom-experiment summary').click();
    await page.locator('#custom-call').fill(call);
    await page.locator('#run-custom').click(); await waitStatus('Experiment complete');
    assert.match(await page.locator('#custom-result').innerText(), /\[0\.5\]/);
    assert.equal(await page.locator('#completion-indicator').isVisible(), false);
    assert.equal(await page.locator('#success-panel').isVisible(), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('frontiercode:v04:journey')), journeyBefore, 'Custom runs must not award progress');
    await page.locator('#custom-call').fill('other()');
    await page.locator('#run-custom').click(); await waitStatus('Experiment error');
    assert.match(await page.locator('#custom-result').innerText(), /ValueError/);
    await editor.fill('def scaled_attention(q, keys, values):\n    print("<img src=x onerror=alert(1)>")\n    return values[0]');
    await page.locator('#custom-call').fill(call);
    await page.locator('#run-custom').click(); await waitStatus('Experiment complete');
    assert.equal(await page.locator('#custom-result img').count(), 0);
    assert.match(await page.locator('#custom-result').innerText(), /<img src=x/);
    await editor.fill('def scaled_attention(q, keys, values):\n    while True: pass');
    await page.locator('#run-custom').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Running custom input…');
    await page.locator('#stop-execution').click(); await waitStatus('Stopped');
    assert.equal(await page.locator('#custom-result').innerText(), 'Stopped');
    await editor.fill(attention.solution);
    await page.locator('#run-custom').click(); await waitStatus('Experiment complete');
    assert.match(await page.locator('#custom-result').innerText(), /0\.804429/);
    assert.equal(await page.locator('#completion-indicator').isVisible(), false);
    await page.locator('#submit-solution').click(); await waitStatus('✓ 5/5 passed');
    assert.equal(await page.locator('#completion-indicator').isVisible(), true);
    await page.goto(base + 'progress/');
    await page.waitForFunction(() => document.querySelector('#solved-total').textContent === '1');
    const plan = page.locator('.plan-progress-card').filter({ hasText: 'Attention & Transformer Essentials' });
    assert.match(await plan.locator('.plan-next').first().innerText(), /Continue: Build a Causal/);
    assert.match(await plan.locator('.plan-next').nth(1).innerText(), /First unfinished: Implement Numerically Stable/);
    await page.goto(base + 'zh/problems/attention-scaled-dot-product/?set=attention-from-scratch');
    await page.waitForFunction(() => document.querySelector('.route-position')?.textContent === '第 4/8 步');
    await page.locator('.custom-experiment summary').click();
    assert.equal(await page.locator('#custom-call').inputValue(), call);
    assert.equal(await editor.inputValue(), attention.solution);
    await page.locator('#run-custom').click(); await waitStatus('试验运行完成');
    assert.match(await page.locator('#custom-result').innerText(), /返回值/);
    assert.match(await page.locator('#run-note').innerText(), /不改变完成标记/);
    await page.locator('#practice-route summary').click();
    for (const width of [1366, 768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('#custom-call').fill(call + ' '.repeat(1000));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px expanded workbench overflow`);
    }
    await page.locator('#custom-call').fill(call);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'artifacts/workbench-improved-zh-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'artifacts/workbench-improved-zh-desktop.png' });
    assert.deepEqual(errors, []);
    console.log('PASS nondegenerate Attention samples, observed errors/tolerance, custom input/stop/recovery without progress, native editor undo/indent, bilingual step directory and active plan, expanded mobile layout');
  } finally { await context.close(); }
}
