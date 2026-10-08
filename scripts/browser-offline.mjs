import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { problems } from '../src/problems.mjs';
import { siteRoot, siteBase } from './config.mjs';

// Offline UI validation only. A mocked Worker cannot validate actual Pyodide.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
// A trusted loopback origin also permits native Blob downloads in Chrome.
const base = `http://127.0.0.1:4199${siteBase()}`;
const browser = await chromium.launch({ headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.route('http://127.0.0.1:4199/**', async route => {
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
  await page.goto(base + 'progress/');
  await page.waitForFunction(() => document.querySelector('#solved-total').textContent === '1');
  assert.equal(await page.locator('#practice-streak').textContent(), '1');
  assert.equal(await page.locator('#today-goal-count').textContent(), '1/1');
  assert.equal(await page.locator('#activity-calendar .active-day').count(), 1);
  assert.equal(await page.locator('#practice-badges .earned').count(), 1);
  await page.locator('#daily-goal').selectOption('2');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#today-goal-count').textContent === '1/2');
  // Routing every request can cancel Chrome downloads. Inspect the export Blob here;
  // the live browser suite verifies the actual native download and device transfer.
  await page.evaluate(() => {
    const createURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { window.backupBlob = blob; return createURL(blob); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { window.backupFilename = this.download; return; }
      click.call(this);
    };
  });
  await page.locator('#export-progress').click();
  assert.match(await page.evaluate(() => window.backupFilename), /^frontiercode-backup-\d{4}-\d{2}-\d{2}\.json$/);
  await writeFile('artifacts/progress-backup.json', await page.evaluate(() => window.backupBlob.text()));
  const payload = JSON.parse(await readFile('artifacts/progress-backup.json', 'utf8'));
  assert.equal(payload.completed[selected.id], true);
  assert.equal(payload.journey.goal, 2);
  assert.equal(payload.drafts[selected.id], 'while True:\n    pass');
  await page.locator('#import-progress-file').setInputFiles('artifacts/progress-backup.json');
  await page.waitForFunction(() => document.querySelector('#backup-status').textContent.startsWith('Backup merged'));
  assert.equal(await page.locator('#today-goal-count').textContent(), '1/2');
  await page.locator('#import-progress-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await page.waitForFunction(() => document.querySelector('#backup-status').textContent.includes('not valid JSON'));
  assert.equal(await page.locator('#solved-total').textContent(), '1');
  await page.screenshot({ path: 'artifacts/progress-desktop.png', fullPage: true });
  await page.goto(base + 'problems/');
  await page.locator('#progress-filter').selectOption('solved');
  assert.equal(await page.locator('.problem-row:visible').count(), 1);
  await page.locator('#progress-filter').selectOption('unsolved');
  assert.equal(await page.locator('.problem-row:visible').count(), 99);
  console.log('PASS offline progress dashboard, goals, earned milestones, backup Blob/merge/rejection and solved filters');
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['', 'problems/', `problems/${selected.id}/`, 'progress/', 'privacy/', 'contact/']) {
    await page.goto(base + path);
    const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert.ok(widths.content <= widths.viewport + 1, `Mobile overflow at ${path}: ${JSON.stringify(widths)}`);
  }
  await page.goto(base);
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await page.goto(base + 'progress/');
  await page.waitForFunction(() => document.querySelector('#solved-total').textContent === '1');
  await page.screenshot({ path: 'artifacts/progress-mobile.png', fullPage: true });
  await page.goto(base + `problems/${selected.id}/`);
  await page.locator('#code-editor').fill(selected.starter);
  await page.screenshot({ path: 'artifacts/workbench-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS offline 375px mobile pages and no uncaught UI errors');
  await writeFile('artifacts/offline-report.json', JSON.stringify({ mode: 'offline-ui', pythonRuntime: 'mocked',
    base, checks: ['catalog', 'sample failure', 'submission success', 'draft persistence', 'solved persistence', 'stop', 'goals', 'milestones', 'backup Blob/merge/rejection', 'solved filters', 'mobile overflow'],
    realPyodideVerified: false }, null, 2));
} finally { await browser.close(); }
