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

    await page.goto(base + language + 'editorials/cnn-valid-convolution/');
    await page.locator('#conv-position:enabled').waitFor();
    const expectedKernels = { asymmetric: [0,2,6,8], sum: [12,16,24,28], difference: [-4,-4,-4,-4] };
    for (const [preset, outputs] of Object.entries(expectedKernels)) {
      await page.locator('#conv-kernel').selectOption(preset);
      assert.deepEqual((await page.locator('[data-conv-cell]').allTextContents()).map(Number), outputs);
      await page.locator('#conv-position').press('Home');
      for (let index = 0; index < 4; index++) {
        if (index) await page.locator('#conv-position').press('ArrowRight');
        assert.equal(await page.locator('#conv-sum').textContent(), String(outputs[index]));
        assert.equal(await page.locator(`[data-conv-cell="${index}"]`).getAttribute('aria-pressed'), 'true');
        const cells = await page.locator('#conv-image .is-window').evaluateAll(elements => elements.map(el => [Number(el.dataset.imageRow), Number(el.dataset.imageColumn)]));
        const r = Math.floor(index / 2), c = index % 2;
        assert.deepEqual(cells, [[r,c],[r,c+1],[r+1,c],[r+1,c+1]]);
        const products = (await page.locator('#conv-products tr td:last-child').allTextContents()).map(Number);
        assert.equal(products.reduce((a,b)=>a+b,0), outputs[index]);
      }
    }
    await page.locator('[data-reset-lesson]').click();
    await page.locator('[data-conv-cell="2"]').click();
    assert.equal(await page.locator('#conv-position').inputValue(), '2');
    assert.equal(await page.locator('#conv-sum').textContent(), '6');
    await page.locator('[data-reset-lesson]').click();
    await captureExperiment(page, `artifacts/lessons/convolution-${language ? 'zh' : 'en'}-desktop.png`);
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language}Convolution ${width}px overflow`);
    }
    await captureExperiment(page, `artifacts/lessons/convolution-${language ? 'zh' : 'en'}-mobile.png`);
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(base + language + 'editorials/rope-rotate-pair/');
    await page.locator('#rope-angle:enabled').waitFor();
    assert.equal(await page.locator('#rope-output').textContent(), '[0, 1]');
    assert.equal(await page.locator('[data-rope-end]').getAttribute('cx'), '160');
    assert.equal(await page.locator('[data-rope-end]').getAttribute('cy'), '112', 'SVG must invert the mathematical y axis');
    assert.equal(await page.locator('#rope-radians').textContent(), '1.570796');
    await page.locator('#rope-angle').press('Home');
    assert.equal(await page.locator('#rope-output').textContent(), '[-1, 0]');
    for (let i = 0; i < 6; i++) await page.locator('#rope-angle').press('ArrowRight');
    assert.equal(await page.locator('#rope-output').textContent(), '[0, -1]');
    await page.locator('#rope-vector').selectOption('diagonal');
    assert.equal(await page.locator('#rope-output').textContent(), '[1, -1]');
    assert.equal(await page.locator('#rope-after-norm').textContent(), '1.414214');
    await page.locator('#rope-angle').press('End');
    assert.equal(await page.locator('#rope-output').textContent(), '[-1, -1]');
    await page.locator('#rope-vector').selectOption('zero');
    assert.equal(await page.locator('#rope-output').textContent(), '[0, 0]');
    assert.equal(await page.locator('#rope-diagram circle[r="0"]').count(), 1);
    await page.locator('[data-reset-lesson]').click();
    assert.equal(await page.locator('#rope-angle').inputValue(), '90');
    assert.equal(await page.locator('#rope-vector').inputValue(), 'axis');
    assert.equal(await page.locator('#rope-output').textContent(), '[0, 1]');
    await captureExperiment(page, `artifacts/lessons/rope-${language ? 'zh' : 'en'}-desktop.png`);
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language}RoPE ${width}px overflow`);
    }
    await captureExperiment(page, `artifacts/lessons/rope-${language ? 'zh' : 'en'}-mobile.png`);
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(base + language + 'editorials/diffusion-forward-sampling/');
    await page.locator('#diffusion-alpha:enabled').waitFor();
    assert.equal(await page.locator('#diffusion-output').textContent(), '[1.414214, 1.414214]');
    assert.equal(await page.locator('#diffusion-signal-scale').textContent(), '0.707107');
    assert.equal(await page.locator('#diffusion-noise-scale').textContent(), '0.707107');
    assert.ok(Math.abs(Number(await page.locator('[data-diffusion-end]').getAttribute('cx'))-(160+48*Math.sqrt(2))) < 1e-10);
    assert.ok(Math.abs(Number(await page.locator('[data-diffusion-end]').getAttribute('cy'))-(160-48*Math.sqrt(2))) < 1e-10);
    await page.locator('#diffusion-alpha').press('Home');
    assert.equal(await page.locator('#diffusion-output').textContent(), '[0, 2]');
    await page.locator('#diffusion-alpha').press('End');
    assert.equal(await page.locator('#diffusion-output').textContent(), '[2, 0]');
    await page.locator('#diffusion-example').selectOption('opposing');
    await page.locator('#diffusion-alpha').press('Home');
    for (let i = 0; i < 10; i++) await page.locator('#diffusion-alpha').press('ArrowRight');
    assert.equal(await page.locator('#diffusion-output').textContent(), '[0, 0]');
    assert.equal(await page.locator('[data-diffusion-end]').getAttribute('cx'), '160');
    assert.equal(await page.locator('[data-diffusion-end]').getAttribute('cy'), '160');
    await page.locator('#diffusion-example').selectOption('mixed');
    assert.equal(await page.locator('#diffusion-output').textContent(), '[0.707107, 0.707107]');
    await page.locator('#diffusion-alpha').press('Home');
    for (let i = 0; i < 5; i++) await page.locator('#diffusion-alpha').press('ArrowRight');
    assert.equal(await page.locator('#diffusion-output').textContent(), '[0.133975, 1.232051]');
    assert.equal(await page.locator('#diffusion-x0').textContent(), '[2, -1]');
    assert.equal(await page.locator('#diffusion-noise').textContent(), '[-1, 2]');
    await page.locator('[data-reset-lesson]').click();
    assert.equal(await page.locator('#diffusion-alpha').inputValue(), '0.5');
    assert.equal(await page.locator('#diffusion-example').inputValue(), 'orthogonal');
    assert.equal(await page.locator('#diffusion-output').textContent(), '[1.414214, 1.414214]');
    await page.locator('.lesson-check summary').click();
    assert.match(await page.locator('.lesson-check').innerText(), language ? /相互抵消/ : /cancel exactly/);
    await captureExperiment(page, `artifacts/lessons/diffusion-${language ? 'zh' : 'en'}-desktop.png`);
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language}Diffusion ${width}px overflow`);
    }
    await captureExperiment(page, `artifacts/lessons/diffusion-${language ? 'zh' : 'en'}-mobile.png`);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  // Inspect the formulas themselves, including phones and 200% text scaling.
  for (const language of ['', 'zh/']) {
    for (const id of ['stable-softmax','attention-scaled-dot-product','cnn-valid-convolution','rope-rotate-pair','diffusion-forward-sampling']) {
      await page.goto(base + language + `editorials/${id}/`);
      assert.equal(await page.locator('.lesson-formula code').count(), 0);
      assert.ok(await page.locator('.lesson-formula math').count() >= 2);
      assert.ok(await page.locator('math').evaluateAll(elements => elements.every(el => el.namespaceURI === 'http://www.w3.org/1998/Math/MathML')));
      const formula = page.locator('.lesson-formula');
      for (const width of [1280,375]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id} math ${width}px overflow`);
        await formula.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 90));
        await formula.screenshot({ path: `artifacts/lessons/formula-${id}-${language ? 'zh' : 'en'}-${width}.png` });
      }
      if (id === 'diffusion-forward-sampling') {
        assert.equal(await formula.locator('msqrt').count(), 2);
        assert.equal(await formula.locator('munderover').count(), 1);
        assert.equal(await formula.locator('msqrt').nth(1).locator('mrow > mn').textContent(), '1');
        assert.equal(await formula.locator('msqrt').nth(1).locator('mrow > mo').textContent(), '−');
        assert.equal(await page.locator('.lesson-coefficients msqrt').count(), 2);
        assert.equal(await page.locator('.lesson-table th msqrt').count(), 2);
        // Root bars must have space for the whole radicand, not just a loose √ glyph.
        assert.ok(await formula.locator('msqrt').evaluateAll(roots => roots.every(root => {
          const a=root.getBoundingClientRect(), b=root.firstElementChild.getBoundingClientRect();
          return a.width > b.width && a.height > b.height;
        })));
      }
      if (id === 'attention-scaled-dot-product') {
        await page.locator('[data-attention-step="2"]').click();
        assert.equal(await page.locator('#attention-step-note msqrt').count(), 1, 'Updated step notes retain typeset roots');
      }
      await page.addStyleTag({ content: '.lesson-formula{font-size:34px!important}' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id} enlarged math remains in its scroll area`);
    }
  }
  const {checkDiffusionLessons}=await import('./browser-round10-checks.mjs');
  await checkDiffusionLessons(page,base);
  const {checkHeadAndCrossLessons}=await import('./browser-round11-checks.mjs');
  await checkHeadAndCrossLessons(page,base);
  const {checkPlanningLessons,checkStaticPlanningLessons}=await import('./browser-round12-checks.mjs');
  await checkPlanningLessons(page,base);
  const {checkRlefLessons,checkStaticRlefLessons}=await import('./browser-round13-checks.mjs');
  await checkRlefLessons(page,base);
  const {checkConstitutionalLessons,checkStaticConstitutionalLessons}=await import('./browser-round14-checks.mjs');
  await checkConstitutionalLessons(page,base);
  const {checkGradientLessons,checkStaticGradientLessons}=await import('./browser-round15-checks.mjs');
  await checkGradientLessons(page,base);
  const {checkNormalizationLessons,checkStaticNormalizationLessons}=await import('./browser-round16-checks.mjs');
  await page.setViewportSize({width:1280,height:900});
  await checkNormalizationLessons(page,base);
  await page.setViewportSize({width:375,height:900});
  await checkNormalizationLessons(page,base);
  const {checkRound17Lessons,checkStaticRound17Lessons}=await import('./browser-round17-checks.mjs');
  await checkRound17Lessons(page,base);
  const {checkCalculationLayouts}=await import('./browser-calculation-checks.mjs');
  await checkCalculationLayouts(page,base);
  assert.deepEqual(errors, []);
  await context.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  await routeFiles(staticContext);
  const staticPage = await staticContext.newPage();
  for (const language of ['', 'zh/']) {
    for (const id of ['stable-softmax', 'attention-scaled-dot-product', 'cnn-valid-convolution', 'rope-rotate-pair', 'diffusion-forward-sampling']) {
      await staticPage.goto(base + language + `editorials/${id}/`);
      assert.equal(await staticPage.locator('.visual-lesson input:disabled').count(), ['stable-softmax', 'attention-scaled-dot-product'].includes(id) ? 2 : 1);
      assert.equal(await staticPage.locator('.visual-lesson select:disabled').count(), ['stable-softmax', 'attention-scaled-dot-product'].includes(id) ? 0 : 1);
      const expectedRows = { 'stable-softmax': 3, 'attention-scaled-dot-product': 2, 'cnn-valid-convolution': 4, 'rope-rotate-pair': 2, 'diffusion-forward-sampling': 2 };
      assert.equal(await staticPage.locator('.lesson-table tbody tr').count(), expectedRows[id]);
      const staticOutputs = { 'stable-softmax': ['#soft-sum','1'], 'attention-scaled-dot-product': ['#attention-output','[1.608859, 0.782281]'], 'cnn-valid-convolution': ['#conv-sum','0'], 'rope-rotate-pair': ['#rope-output','[0, 1]'], 'diffusion-forward-sampling': ['#diffusion-output','[1.414214, 1.414214]'] };
      const [selector, expected] = staticOutputs[id];
      assert.equal(await staticPage.locator(selector).textContent(), expected, 'Default worked example remains complete without JavaScript');
      assert.equal(await staticPage.locator('.visual-lesson noscript p').isVisible(), true);
      assert.ok(await staticPage.locator('.lesson-formula math').count() >= 2, 'Math does not depend on JavaScript or a CDN');
      assert.ok(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
  }
  await checkStaticPlanningLessons(staticPage,base);
  await checkStaticRlefLessons(staticPage,base);
  await checkStaticConstitutionalLessons(staticPage,base);
  await checkStaticGradientLessons(staticPage,base);
  await checkStaticNormalizationLessons(staticPage,base);
  await checkStaticRound17Lessons(staticPage,base);
  await staticContext.close();
  console.log('PASS real browser lesson controls, mathematical golden outputs, both languages, keyboard, reset, stage highlighting, 375/768px layout and no-JS fallbacks');
} finally { await browser.close(); }
