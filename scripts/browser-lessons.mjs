import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { siteRoot, siteBase } from './config.mjs';

// Real browser interaction; serve the built files via routes without external services.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const base = `http://127.0.0.1:4198${siteBase()}`;
async function routeFiles(context) {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://127.0.0.1:4198') return route.abort();
    const file = resolve(siteRoot, url.pathname.slice(siteBase().length), ...(url.pathname.endsWith('/') ? ['index.html'] : []));
    if (!file.startsWith(resolve(siteRoot) + sep)) return route.fulfill({ status: 403 });
    try {
      const body = await readFile(file);
      const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/javascript';
      await route.fulfill({ body, contentType: type });
    } catch { await route.fulfill({ status: 404 }); }
  });
}
const probabilityValues = async (page, id) => (await page.locator(`${id} output`).allTextContents()).map(x => Number(x.replace('%', '')));
async function captureExperiment(page, path) {
  // A tall capture viewport keeps the sticky header outside the component image.
  const viewport = page.viewportSize();
  await page.setViewportSize({ ...viewport, height: 1800 });
  await page.locator('.lesson-experiment').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 85));
  await page.locator('.lesson-experiment').screenshot({ path });
  await page.setViewportSize(viewport);
}
try {
  await mkdir('artifacts/lessons', { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await routeFiles(context);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(String(error)));
  for (const language of ['', 'zh/']) {
    await page.goto(base + language + 'editorials/stable-softmax/');
    await page.locator('#soft-offset:enabled').waitFor();
    assert.deepEqual(await probabilityValues(page, '#soft-bars'), [9.00, 24.47, 66.52]);
    const initial = await page.locator('#soft-trace').innerText();
    await page.locator('#soft-offset').press('Home');
    assert.equal(await page.locator('#soft-offset-value').textContent(), '0');
    assert.deepEqual(await probabilityValues(page, '#soft-bars'), [9.00, 24.47, 66.52]);
    assert.notEqual(await page.locator('#soft-trace').innerText(), initial);
    assert.equal(await page.locator('#soft-naive-status.finite').count(), 1);
    await page.locator('#soft-offset').press('End');
    assert.equal(await page.locator('#soft-naive-status.finite').count(), 0);
    await page.locator('#soft-temperature').press('End');
    assert.equal(await page.locator('#soft-temperature-value').textContent(), '2');
    assert.equal(await page.locator('#soft-naive-status.finite').count(), 1, 'At T=2 the largest raw exponent is only 501');
    assert.deepEqual(await probabilityValues(page, '#soft-bars'), [18.63, 30.72, 50.65]);
    await page.locator('#soft-temperature').press('Home');
    assert.deepEqual(await probabilityValues(page, '#soft-bars'), [1.59, 11.73, 86.68]);
    assert.equal(await page.locator('#soft-sum').innerText(), '1');
    await page.locator('[data-reset-lesson]').click();
    assert.equal(await page.locator('#soft-trace').innerText(), initial);
    await page.locator('.lesson-check summary').click();
    assert.match(await page.locator('.lesson-check').innerText(), language ? /相同正温度/ : /same positive temperature/);
    await captureExperiment(page, `artifacts/lessons/softmax-${language ? 'zh' : 'en'}-desktop.png`);
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language}Softmax ${width}px overflow`);
    }
    await captureExperiment(page, `artifacts/lessons/softmax-${language ? 'zh' : 'en'}-mobile.png`);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(base + language + 'editorials/attention-scaled-dot-product/');
    await page.locator('#attention-q1:enabled').waitFor();
    assert.equal(await page.locator('#attention-output').textContent(), '[1.608859, 0.782281]');
    assert.deepEqual(await probabilityValues(page, '#attention-bars'), [80.44, 19.56]);
    await page.locator('[data-query="0,0"]').click();
    assert.equal(await page.locator('#attention-output').textContent(), '[1, 2]');
    assert.deepEqual(await probabilityValues(page, '#attention-bars'), [50, 50]);
    await page.locator('[data-query="0,2"]').click();
    assert.equal(await page.locator('#attention-output').textContent(), '[0.391141, 3.217719]');
    await page.locator('[data-attention-step="4"]').click();
    assert.equal(await page.locator('[data-attention-step="4"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.attention-trace').getAttribute('data-active-step'), '4');
    assert.match(await page.locator('#attention-step-note').innerText(), language ? /不是概率分布/ : /not a probability distribution/);
    await page.locator('#attention-q1').press('Home');
    await page.locator('#attention-q2').press('Home');
    assert.equal(await page.locator('#attention-output').textContent(), '[1, 2]');
    await page.locator('[data-reset-lesson]').click();
    assert.equal(await page.locator('#attention-output').textContent(), '[1.608859, 0.782281]');
    assert.equal(await page.locator('[data-attention-step="1"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-attention-step="4"]').click();
    await captureExperiment(page, `artifacts/lessons/attention-${language ? 'zh' : 'en'}-desktop.png`);
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language}Attention ${width}px overflow`);
    }
    await page.locator('[data-attention-step="4"]').click();
    assert.ok(await page.locator('.attention-trace').evaluate(el => el.parentElement.scrollLeft > 0), 'A mobile step click must reveal its column');
    await captureExperiment(page, `artifacts/lessons/attention-${language ? 'zh' : 'en'}-mobile.png`);
    assert.equal(await page.locator('.lesson-resources a[href^="https://"]').count(), 4);
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(await page.locator('.visual-lesson img').count(), 0);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  assert.deepEqual(errors, []);
  await context.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  await routeFiles(staticContext);
  const staticPage = await staticContext.newPage();
  for (const language of ['', 'zh/']) {
    for (const id of ['stable-softmax', 'attention-scaled-dot-product']) {
      await staticPage.goto(base + language + `editorials/${id}/`);
      assert.equal(await staticPage.locator('.visual-lesson input:disabled').count(), 2);
      assert.ok((await staticPage.locator('.lesson-table tbody').innerText()).length > 40);
      assert.equal(await staticPage.locator('.visual-lesson noscript p').isVisible(), true);
      assert.ok(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
  }
  await staticContext.close();
  console.log('PASS real browser lesson controls, mathematical golden outputs, both languages, keyboard, reset, stage highlighting, 375/768px layout and no-JS fallbacks');
} finally { await browser.close(); }
