import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { problems } from '../src/problems.mjs';
import { siteRoot, siteBase } from './config.mjs';

// Offline UI validation only. A mocked Worker cannot validate actual Pyodide.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = `https://frontiercode.test${siteBase()}`;
const browser = await chromium.launch({ headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.route('https://frontiercode.test/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const relative = path.slice(siteBase().length);
    const file = resolve(siteRoot, relative, ...(path.endsWith('/') ? ['index.html'] : []));
    if (!file.startsWith(resolve(siteRoot) + sep)) return route.fulfill({ status: 403 });
    try {
      const body = await readFile(file);
      await route.fulfill({ body, contentType: file.endsWith('.html') ? 'text/html' :
        file.endsWith('.css') ? 'text/css' : 'text/javascript' });
    } catch { await route.fulfill({ status: 404 }); }
  });
  const selected = problems.find(p => p.id === 'rope-rotate-pair');
  await page.addInitScript(({ solution }) => {
    window.Worker = class {
      constructor() { this.dead = false; }
      postMessage({ requestId, code, tests }) {
        setTimeout(() => {
          if (this.dead) return;
          for (const type of ['loading', 'ready', 'running']) this.onmessage({ data: { type, requestId } });
          if (code.includes('while True')) return;
          const pass = code === solution;
          this.onmessage({ data: { type: 'results', requestId,
            results: tests.map(test => ({ name: test.name, pass, error_type: 'FCAssertionError',
              error: pass ? '' : 'Expected: reference value\nActual: None', stdout: '', source: test.code })) } });
        }, 20);
      }
      terminate() { this.dead = true; }
    };
  }, { solution: selected.solution });
  await mkdir('artifacts', { recursive: true });
  await page.goto(base);
  await page.screenshot({ path: 'artifacts/home-desktop.png', fullPage: true });
  await page.goto(base + 'problems/');
  assert.equal(await page.locator('.problem-row:visible').count(), 100);
  await page.locator('#query').fill('RMSNorm');
  assert.equal(await page.locator('.problem-row:visible').count(), 2);
  await page.locator('#query').fill('no-such-topic-123');
  assert.equal(await page.locator('#catalog-empty').isVisible(), true);
  console.log('PASS offline catalog filtering and empty-state UI');
  await page.goto(base + `problems/${selected.id}/`);
  await page.locator('#run-samples').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent === '0/2 passed');
  assert.equal(await page.locator('#completion-indicator').isVisible(), false);
  assert.equal(await page.locator('.case-detail.bad').count(), 2);
  await page.locator('#code-editor').fill(selected.solution);
  await page.locator('#submit-solution').click();
  await page.waitForFunction(() => document.querySelector('#run-note').textContent.startsWith('Accepted'));
  assert.equal(await page.locator('.case-detail.good').count(), selected.tests.length);
  await page.reload();
  assert.equal(await page.locator('#code-editor').inputValue(), selected.solution);
  assert.equal(await page.locator('#completion-indicator').isVisible(), true);
  await page.locator('#code-editor').fill('while True:\n    pass');
  await page.locator('#run-samples').click();
  await page.locator('#stop-execution').click();
  assert.equal(await page.locator('#status').textContent(), 'Stopped');
  assert.equal(await page.locator('#run-samples').isEnabled(), true);
  console.log('PASS offline mocked-Worker failure/pass, persistence and stop controls');
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['', 'problems/', `problems/${selected.id}/`, 'privacy/', 'contact/']) {
    await page.goto(base + path);
    const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert.ok(widths.content <= widths.viewport + 1, `Mobile overflow at ${path}: ${JSON.stringify(widths)}`);
  }
  await page.goto(base);
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await page.goto(base + `problems/${selected.id}/`);
  await page.locator('#code-editor').fill(selected.starter);
  await page.screenshot({ path: 'artifacts/workbench-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS offline 375px mobile pages and no uncaught UI errors');
  await writeFile('artifacts/offline-report.json', JSON.stringify({ mode: 'offline-ui', pythonRuntime: 'mocked',
    base, checks: ['catalog', 'sample failure', 'submission success', 'draft persistence', 'solved persistence', 'stop', 'mobile overflow'],
    realPyodideVerified: false }, null, 2));
} finally { await browser.close(); }
