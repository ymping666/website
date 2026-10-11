import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { siteRoot, siteBase } from './config.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const origin = 'http://127.0.0.1:4197', base = origin + siteBase();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let indexRequests = 0, failIndex = false;
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname.endsWith('/search-index.json')) {
      indexRequests++;
      if (failIndex) return route.fulfill({ status: 503 });
    }
    const file = resolve(siteRoot, url.pathname.slice(siteBase().length), ...(url.pathname.endsWith('/') ? ['index.html'] : []));
    if (!file.startsWith(resolve(siteRoot) + sep)) return route.fulfill({ status: 403 });
    try { await route.fulfill({ body: await readFile(file), contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : file.endsWith('.json') ? 'application/json' : 'text/javascript' }); }
    catch { await route.fulfill({ status: 404 }); }
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await mkdir('artifacts/search', { recursive: true });
  for (const language of ['', 'zh/']) {
    await page.goto(base + language + 'editorials/diffusion-forward-sampling/');
    await page.locator('.site-search-link').click();
    assert.equal(new URL(page.url()).pathname, siteBase() + language + 'search/');
    const before = indexRequests;
    assert.equal(await page.locator('#search-results li').count(), 0);
    assert.equal(indexRequests, before);
    await page.locator('#site-query').fill('attention');
    await page.waitForFunction(() => document.querySelectorAll('#search-results li').length > 0);
    assert.equal(indexRequests, before + 1, 'Index is fetched lazily');
    await page.locator('#search-type').selectOption('editorial');
    await page.waitForFunction(() => [...document.querySelectorAll('.site-search-result')].every(a => a.pathname.includes('/editorials/')));
    assert.ok((await page.locator('.site-search-result').count()) > 0);
    assert.equal(new URL(page.url()).searchParams.get('type'), 'editorial');
    await page.locator('#site-query').fill('矩阵乘法');
    await page.waitForFunction(() => document.querySelector('.site-search-result')?.pathname.includes('/editorials/foundation-matmul/'));
    assert.equal(indexRequests, before + 1, 'Reuse the same index for subsequent searches');
    assert.equal(new URL(await page.locator('[data-language="' + (language ? 'en' : 'zh') + '"]').getAttribute('href'), page.url()).searchParams.get('q'), '矩阵乘法');
    await page.locator('.site-search-result').first().click();
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('.site-search-result')?.pathname.includes('foundation-matmul'));
    assert.equal(await page.locator('#site-query').inputValue(), '矩阵乘法');
    await page.locator('#search-type').selectOption('all');
    await page.locator('#site-query').fill('model');
    await page.waitForFunction(() => document.querySelectorAll('#search-results li').length === 30);
    await page.locator('#search-more').click();
    await page.waitForFunction(() => document.querySelectorAll('#search-results li').length > 30);
    await page.locator('#site-query').fill('<img src=x onerror=alert(1)>');
    await page.waitForFunction(() => !document.querySelector('[data-site-search]').hasAttribute('aria-busy') && document.querySelectorAll('#search-results li').length === 0);
    assert.equal(await page.locator('#search-results img').count(), 0);
    await page.locator('#search-clear').click();
    assert.equal(await page.locator('#site-query').inputValue(), '');
    assert.equal(new URL(page.url()).searchParams.has('q'), false);
    await page.goto(base + language + 'search/?q=RoPE&type=editorial');
    await page.waitForFunction(() => document.querySelectorAll('#search-results li').length > 0);
    assert.equal(await page.locator('#site-query').inputValue(), 'RoPE');
    assert.equal(await page.locator('#search-type').inputValue(), 'editorial');
    await page.locator('[data-language="' + (language ? 'en' : 'zh') + '"]').click();
    await page.waitForFunction(() => document.querySelectorAll('#search-results li').length > 0);
    assert.equal(await page.locator('#site-query').inputValue(), 'RoPE');
    assert.equal(await page.locator('#search-type').inputValue(), 'editorial');
    assert.equal(new URL(page.url()).pathname, siteBase() + (language ? '' : 'zh/') + 'search/');
    await page.goBack();
    await page.waitForFunction(() => document.querySelectorAll('#search-results li').length > 0);
    for (const width of [320, 375, 390, 650, 768, 960, 961, 1024, 1199, 1200, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => {
        const elements = [...document.querySelector('.header-inner').children].filter(e => getComputedStyle(e).display !== 'none');
        const boxes = elements.map(e => e.getBoundingClientRect());
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1, overlaps: boxes.some((b, i) => b.left < 0 || b.right > innerWidth + 1 || (i > 0 && boxes[i-1].right > b.left + 1)) };
      });
      assert.deepEqual(layout, { overflow: false, overlaps: false }, language + ' header/search layout at ' + width);
      if ([375, 1440, 1920].includes(width)) await page.screenshot({ path: `artifacts/search/${language ? 'zh' : 'en'}-${width}.png`, fullPage: true });
    }
    console.log('PASS ' + (language ? 'Chinese' : 'English') + ' search, URL restoration, pagination and responsive header');
  }
  // A failed index request must recover without reloading the page.
  failIndex = true;
  await page.goto(base + 'search/?q=RoPE');
  await page.locator('#search-retry').waitFor({ state: 'visible' });
  failIndex = false;
  await page.locator('#search-retry').click();
  await page.waitForFunction(() => document.querySelectorAll('#search-results li').length > 0);
  // IME composition must finish before the query is updated.
  await page.locator('#site-query').evaluate(input => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '扩';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await page.waitForTimeout(250);
  assert.equal(new URL(page.url()).searchParams.get('q'), 'RoPE');
  await page.locator('#site-query').evaluate(input => {
    input.value = '扩散';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  });
  await page.waitForFunction(() => new URL(location.href).searchParams.get('q') === '扩散' && document.querySelectorAll('#search-results li').length > 0);
  // Slow old requests must not overwrite a newer empty query.
  await page.route('**/search-index.json', async route => {
    await new Promise(resolve => setTimeout(resolve, 400));
    await route.fulfill({ body: await readFile(resolve(siteRoot, 'assets/search-index.json')), contentType: 'application/json' });
  });
  await page.goto(base + 'search/?q=RoPE');
  await page.locator('#search-clear').click();
  await page.waitForTimeout(600);
  assert.equal(await page.locator('#search-results li').count(), 0);
  assert.equal(await page.locator('#search-retry').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS browser site search, bilingual queries, URL restore, filters, pagination, XSS text, retry, stale requests and 320–2560px layout');
} finally { await browser.close(); }
