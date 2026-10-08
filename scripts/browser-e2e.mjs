import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { problems } from '../src/problems.mjs';
import { siteBase } from './config.mjs';

// Test a real browser, actual served files and the CDN Python runtime. No mocked Worker.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || `http://127.0.0.1:${process.env.PORT || 4173}${siteBase()}`;
const server = process.env.TEST_URL ? null : spawn(process.execPath, ['scripts/serve.mjs'], {
  env: process.env, stdio: ['ignore', 'pipe', 'inherit']
});
let browser;
const checks = [];
const pass = message => { checks.push(message); console.log('PASS', message); };
try {
  if (server) {
    await new Promise((resolve, reject) => {
      server.stdout.once('data', resolve);
      server.once('error', reject);
      server.once('exit', code => reject(new Error(`Preview server exited: ${code}`)));
    });
  }
  browser = await chromium.launch({ headless: true,
    ...(process.env.TEST_PROXY ? { proxy: { server: process.env.TEST_PROXY, bypass: '127.0.0.1,localhost' } } : {}),
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  assert.equal((await page.goto(base)).status(), 200);
  assert.equal(await page.locator('h1').count(), 1);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/home-desktop.png', fullPage: true });
  await page.goto(base + 'problems/');
  assert.equal(await page.locator('.problem-row:visible').count(), 100);
  await page.locator('#query').fill('RMSNorm');
  assert.equal(await page.locator('.problem-row:visible').count(), 2);
  pass('100-problem catalog and concept search');

  const selected = problems.find(p => p.id === 'rope-rotate-pair');
  await page.goto(base + `problems/${selected.id}/`);
  await page.locator('#run-samples').click();
  await page.waitForFunction(() => /\d+\/\d+ passed/.test(document.querySelector('#status').textContent), null, { timeout: 120000 });
  assert.equal(await page.locator('.case-detail.bad').count(), 2);
  assert.equal(await page.locator('#completion-indicator').isVisible(), false);
  pass('Real CDN Python executes starter code and displays failed samples');
  await page.locator('#code-editor').fill(selected.solution);
  await page.locator('#submit-solution').click();
  await page.waitForFunction(() => document.querySelector('#run-note').textContent.startsWith('Accepted'), null, { timeout: 30000 });
  assert.equal(await page.locator('.case-detail.good').count(), selected.tests.length);
  await page.reload();
  assert.equal(await page.locator('#code-editor').inputValue(), selected.solution);
  assert.equal(await page.locator('#completion-indicator').isVisible(), true);
  pass('Submit, draft persistence and solved persistence with real Python');
  await page.locator('#code-editor').fill('while True:\n    pass');
  await page.locator('#run-samples').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent === 'Time limit exceeded', null, { timeout: 120000 });
  assert.equal(await page.locator('#run-samples').isEnabled(), true);
  await page.locator('#code-editor').fill(selected.solution);
  await page.locator('#submit-solution').click();
  await page.waitForFunction(() => document.querySelector('#run-note').textContent.startsWith('Accepted'), null, { timeout: 120000 });
  pass('Infinite loop is terminated and subsequent submission recovers');

  await page.goto(base + 'progress/');
  await page.waitForFunction(() => document.querySelector('#solved-total').textContent === '1');
  assert.equal(await page.locator('#practice-streak').textContent(), '1');
  assert.equal(await page.locator('#today-goal-count').textContent(), '1/1');
  assert.equal(await page.locator('#practice-badges .earned').count(), 1);
  assert.equal(await page.locator('#activity-calendar .active-day').count(), 1);
  const dailyHref = await page.locator('#daily-challenge').getAttribute('href');
  await page.locator('#daily-goal').selectOption('2');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#today-goal-count').textContent === '1/2');
  assert.equal(await page.locator('#daily-challenge').getAttribute('href'), dailyHref);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-progress').click();
  const download = await downloadPromise;
  await download.saveAs('artifacts/progress-backup.json');
  const payload = JSON.parse(await (await import('node:fs/promises')).readFile('artifacts/progress-backup.json', 'utf8'));
  assert.equal(payload.completed[selected.id], true);
  assert.equal(payload.drafts[selected.id], selected.solution);
  assert.equal(payload.journey.goal, 2);
  // A fresh browser context represents a second device without any account.
  const freshContext = await browser.newContext();
  const fresh = await freshContext.newPage();
  await fresh.goto(base + 'progress/');
  await fresh.waitForFunction(() => document.querySelector('#plan-progress').children.length === 19);
  assert.equal(await fresh.locator('#solved-total').textContent(), '0');
  await fresh.locator('#import-progress-file').setInputFiles('artifacts/progress-backup.json');
  await fresh.waitForFunction(() => document.querySelector('#solved-total').textContent === '1');
  assert.equal(await fresh.locator('#today-goal-count').textContent(), '1/2');
  await fresh.locator('#import-progress-file').setInputFiles('artifacts/progress-backup.json');
  await fresh.waitForFunction(() => document.querySelector('#backup-status').textContent.startsWith('Backup merged'));
  assert.equal(await fresh.locator('#today-goal-count').textContent(), '1/2');
  await fresh.goto(base + `problems/${selected.id}/`);
  assert.equal(await fresh.locator('#code-editor').inputValue(), selected.solution);
  assert.equal(await fresh.locator('#completion-indicator').isVisible(), true);
  await freshContext.close();
  // If writes fail, export the in-memory draft directly from the workbench.
  // Navigating to the dashboard first would discard that unsaved memory.
  const blockedContext = await browser.newContext();
  await blockedContext.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  const blocked = await blockedContext.newPage();
  await blocked.goto(base + `problems/${selected.id}/`);
  await blocked.waitForFunction(() => document.querySelector('#header-progress').textContent === '0/100 solved');
  await blocked.locator('#code-editor').fill('unsaved draft to recover');
  assert.match(await blocked.locator('#editor-save').textContent(), /not saved/i);
  assert.equal(await blocked.locator('#global-storage-notice').isVisible(), true);
  const unsavedDownloadPromise = blocked.waitForEvent('download');
  await blocked.locator('#export-unsaved-progress').click();
  await (await unsavedDownloadPromise).saveAs('artifacts/unsaved-progress-backup.json');
  const unsaved = JSON.parse(await (await import('node:fs/promises')).readFile('artifacts/unsaved-progress-backup.json', 'utf8'));
  assert.equal(unsaved.drafts[selected.id], 'unsaved draft to recover');
  await blockedContext.close();
  pass('Storage failure is visible and the unsaved draft can be downloaded without leaving the workbench');
  await page.screenshot({ path: 'artifacts/progress-desktop.png', fullPage: true });
  await page.goto(base + 'problems/');
  await page.locator('#progress-filter').selectOption('solved');
  assert.equal(await page.locator('.problem-row:visible').count(), 1);
  await page.locator('#progress-filter').selectOption('unsolved');
  assert.equal(await page.locator('.problem-row:visible').count(), 99);
  pass('Daily progress, stable recommendation, goal persistence, backup transfer to a fresh browser and solved filtering');

  // Exercise every published reference through the production Worker and actual Pyodide.
  const verdicts = await page.evaluate(async ({ items, workerUrl }) => {
    const worker = new Worker(workerUrl);
    let sequence = 0;
    const run = item => new Promise((resolve, reject) => {
      const requestId = ++sequence;
      const timer = setTimeout(() => reject(new Error(`Worker timed out: ${item.id}`)), 120000);
      worker.onerror = event => { clearTimeout(timer); reject(new Error(event.message)); };
      worker.onmessage = ({ data }) => {
        if (data.requestId !== requestId) return;
        if (data.type === 'error') { clearTimeout(timer); reject(new Error(data.error)); }
        if (data.type === 'results') { clearTimeout(timer); resolve({ id: item.id, results: data.results }); }
      };
      worker.postMessage({ type: 'run', requestId, code: item.solution, tests: item.tests });
    });
    try {
      const results = [];
      for (const item of items) results.push(await run(item));
      return results;
    } finally { worker.terminate(); }
  }, { items: problems.map(({ id, solution, tests }) => ({ id, solution, tests })), workerUrl: base + 'assets/runner.worker.js' });
  for (const result of verdicts) {
    assert.ok(result.results.every(test => test.pass), JSON.stringify(result));
  }
  pass(`${verdicts.reduce((n, p) => n + p.results.length, 0)} real Pyodide assertions across all 100 problems`);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['', 'problems/', `problems/${selected.id}/`, 'progress/', 'privacy/', 'contact/']) {
    await page.goto(base + path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, `Mobile overflow at ${path}`);
  }
  await page.goto(base);
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await page.goto(base + 'progress/');
  await page.waitForFunction(() => document.querySelector('#solved-total').textContent === '1');
  await page.screenshot({ path: 'artifacts/progress-mobile.png', fullPage: true });
  await page.goto(base + `problems/${selected.id}/`);
  await page.screenshot({ path: 'artifacts/workbench-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  pass('375px mobile layout and no uncaught page errors');
  await writeFile('artifacts/browser-report.json', JSON.stringify({ base, checks, problems: verdicts.length,
    assertions: verdicts.reduce((n, p) => n + p.results.length, 0) }, null, 2));
} finally {
  await browser?.close();
  server?.kill();
}
