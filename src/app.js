import { createStore, recordPractice, localDay } from './progress.mjs';
import { mountProgressUI } from './progress-ui.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
// Preserve v0.4/v0.5 user drafts and solved records after upgrades.
const store = createStore(() => localStorage, () => window.dispatchEvent(new Event('fc-progress-change')));
const initialSolved = store.get('completed', {});
const solved = initialSolved && typeof initialSolved === 'object' && !Array.isArray(initialSolved) ? initialSolved : {};
mountProgressUI(store).catch(() => {
  const notice = $('#global-storage-notice');
  if (notice) { notice.hidden = false; notice.textContent = 'The progress dashboard could not load. Your saved drafts are still available; reload to retry.'; }
});
for (const element of $$('[data-solved]')) {
  if (solved[element.dataset.solved]) { element.textContent = '✓'; element.classList.add('done'); }
}
if ($('#catalog-list')) {
  const filter = () => {
    const query = ($('#query').value || '').toLowerCase().trim();
    const track = $('#track-filter').value;
    const difficulty = $('#level-filter').value;
    const progress = $('#progress-filter')?.value || 'all';
    const completedNow = store.get('completed', {}) || {};
    let count = 0;
    for (const row of $$('.problem-row')) {
      const done = completedNow[row.querySelector('[data-solved]').dataset.solved] === true;
      const visible = (!query || row.dataset.title.includes(query)) && (track === 'all' || row.dataset.track === track) && (difficulty === 'all' || row.dataset.level === difficulty) && (progress === 'all' || (progress === 'solved' ? done : !done));
      row.hidden = !visible;
      count += Number(visible);
    }
    $('#catalog-empty').hidden = count > 0;
  };
  ['#query', '#track-filter', '#level-filter', '#progress-filter'].forEach(selector => $(selector)?.addEventListener('input', filter));
}

if ($('#challenge-json')) {
  const problem = JSON.parse($('#challenge-json').textContent);
  const editor = $('#code-editor');
  const saved = $('#editor-save');
  const status = $('#status');
  const results = $('#test-results');
  const note = $('#run-note');
  const runSamples = $('#run-samples');
  const submit = $('#submit-solution');
  const stop = $('#stop-execution');
  const completed = $('#completion-indicator');
  const sampleCount = Math.min(2, problem.tests.length);
  let worker = null;
  let loadingTimer = null;
  let executionTimer = null;
  let active = null;
  let sequence = 0;
  let hintIndex = 0;

  editor.value = store.get('draft:' + problem.id, problem.starter);
  const updateCompletion = () => {
    completed.hidden = !store.get('completed', {})?.[problem.id];
    if (!completed.hidden) completed.textContent = '✓ Solved locally';
  };
  updateCompletion();
  window.addEventListener('storage', updateCompletion);
  window.addEventListener('fc-progress-change', updateCompletion);
  editor.addEventListener('input', () => { const ok = store.set('draft:' + problem.id, editor.value); saved.textContent = ok ? 'Draft saved on this browser' : 'Draft not saved · Download a backup'; });
  editor.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end');
      editor.dispatchEvent(new Event('input'));
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      (event.shiftKey ? submit : runSamples).click();
    }
  });
  $('#reset-code').addEventListener('click', () => {
    if (editor.value !== problem.starter && !window.confirm('Restore the original starter code? Your current draft will be replaced.')) return;
    editor.value = problem.starter;
    const ok = store.set('draft:' + problem.id, problem.starter);
    saved.textContent = ok ? 'Starter restored and saved' : 'Starter restored · Not saved · Download a backup';
    editor.focus();
  });
  $('#reveal-hint').addEventListener('click', () => {
    const text = $('#hint-text');
    text.hidden = false;
    text.textContent = problem.hints[hintIndex];
    hintIndex++;
    $('#reveal-hint').disabled = hintIndex >= problem.hints.length;
    $('#reveal-hint').textContent = hintIndex < problem.hints.length ? `Show hint ${hintIndex + 1} / ${problem.hints.length}` : 'All hints shown';
  });

  function setBusy(isBusy) {
    runSamples.disabled = isBusy;
    submit.disabled = isBusy;
    stop.hidden = !isBusy;
  }
  function clearTimers() {
    clearTimeout(loadingTimer); clearTimeout(executionTimer);
    loadingTimer = null; executionTimer = null;
  }
  function terminate() {
    if (worker) { worker.terminate(); worker = null; }
    clearTimers();
  }
  function finish() {
    clearTimers();
    active = null;
    setBusy(false);
  }
  function fail(message, title = 'Unable to run') {
    terminate(); finish();
    status.textContent = title;
    note.textContent = message;
    note.classList.add('run-warning');
  }
  function resetResults(mode, tests) {
    results.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'result-intro';
    heading.textContent = mode === 'submit' ? 'Full local suite · All tests are inspectable' : 'Published examples · Fast feedback';
    results.append(heading);
    for (const test of tests) {
      const row = document.createElement('div');
      row.className = 'result-row pending';
      const marker = document.createElement('span'); marker.textContent = '○';
      const content = document.createElement('div'); content.textContent = test.name;
      row.append(marker, content); results.append(row);
    }
    note.classList.remove('run-warning');
  }
  function renderResults(rows, mode, tests, elapsedMs) {
    const passing = rows.filter(item => item.pass).length;
    store.set('journey', recordPractice(store.get('journey', null), { id: problem.id, day: localDay(), accepted: rows.length > 0 && passing === rows.length && mode === 'submit' }));
    results.replaceChildren();
    const intro = document.createElement('div');
    intro.className = 'result-intro';
    intro.textContent = `${mode === 'submit' ? 'Full local suite' : 'Sample tests'} · ${passing} of ${rows.length} passed · ${(elapsedMs / 1000).toFixed(2)}s`;
    results.append(intro);
    for (let i = 0; i < rows.length; i++) {
      const result = rows[i];
      const testcase = tests[i];
      const details = document.createElement('details');
      details.className = 'case-detail ' + (result.pass ? 'good' : 'bad');
      if (!result.pass) details.open = true;
      const summary = document.createElement('summary');
      const icon = document.createElement('span'); icon.className = 'case-icon'; icon.textContent = result.pass ? '✓' : '✕';
      const title = document.createElement('span'); title.textContent = testcase.name;
      const verdict = document.createElement('span'); verdict.className = 'case-verdict'; verdict.textContent = result.pass ? 'Passed' : 'Failed';
      summary.append(icon, title, verdict); details.append(summary);
      const body = document.createElement('div'); body.className = 'case-body';
      const caption = document.createElement('strong'); caption.textContent = 'Test assertion'; body.append(caption);
      const code = document.createElement('pre'); code.textContent = testcase.code; body.append(code);
      if (!result.pass) {
        const error = document.createElement('p'); error.className = 'case-error';
        error.textContent = `${result.error_type || 'Error'}${result.location ? ' at ' + result.location : ''}\n${result.error || 'Test failed'}`;
        body.append(error);
      }
      if (result.stdout) {
        const output = document.createElement('strong'); output.textContent = 'Program output'; body.append(output);
        const stdout = document.createElement('pre'); stdout.textContent = result.stdout; body.append(stdout);
      }
      details.append(body); results.append(details);
    }
    status.textContent = passing === rows.length ? `✓ ${passing}/${rows.length} passed` : `${passing}/${rows.length} passed`;
    if (passing === rows.length && mode === 'submit') {
      Object.assign(solved, store.get('completed', {}) || {});
      solved[problem.id] = true;
      store.set('completed', solved);
      updateCompletion();
      note.textContent = 'Accepted by the complete local test suite. This is not a secure server-side submission.';
    } else if (passing === rows.length) {
      note.textContent = 'Samples passed. Press Submit to check all published tests and save a solved mark.';
    } else {
      note.textContent = 'Open a failed case to inspect its assertion, error type, expected/actual values (when available), and output.';
    }
  }
  function ensureWorker() {
    if (worker) return worker;
    worker = new Worker(new URL('./runner.worker.js', import.meta.url));
    worker.onmessage = event => {
      const data = event.data;
      if (!active || data.requestId !== active.id) return;
      if (data.type === 'loading') {
        status.textContent = 'Downloading Python runtime…';
        note.textContent = 'First run needs Pyodide from an external CDN. Subsequent runs on this page reuse it.';
      } else if (data.type === 'ready' || data.type === 'running') {
        clearTimeout(loadingTimer);
        status.textContent = 'Running ' + (active.mode === 'submit' ? 'full suite' : 'samples') + '…';
        // Enforce a wall-clock limit even for Python code that never yields.
        clearTimeout(executionTimer);
        executionTimer = setTimeout(() => fail('Your code or tests exceeded the 15-second execution limit. The Python worker was stopped; try a bounded implementation.', 'Time limit exceeded'), 15000);
      } else if (data.type === 'progress') {
        status.textContent = `Running ${data.finished}/${data.total} tests…`;
        clearTimeout(executionTimer);
        executionTimer = setTimeout(() => fail('No test completed within 15 seconds. The Python worker was stopped.', 'Time limit exceeded'), 15000);
      } else if (data.type === 'error') {
        fail('Python runtime error: ' + data.error + '. Check your network and retry.', 'Runtime error');
      } else if (data.type === 'results') {
        renderResults(data.results, active.mode, active.tests, performance.now() - active.startedAt);
        finish();
      }
    };
    worker.onerror = () => fail('Python worker could not load. Your browser or network may block the Pyodide CDN.', 'Runtime blocked');
    return worker;
  }
  function execute(mode) {
    if (active) return;
    const tests = mode === 'submit' ? problem.tests : problem.tests.slice(0, sampleCount);
    const requestId = ++sequence;
    const code = editor.value;
    store.set('draft:' + problem.id, code);
    resetResults(mode, tests);
    active = { id: requestId, tests, mode, startedAt: performance.now() };
    setBusy(true);
    status.textContent = 'Preparing Python…';
    note.textContent = 'Local execution in your browser · No code sent to our server.';
    loadingTimer = setTimeout(() => fail('Could not load Python within 90 seconds. Check your internet connection or CDN access.', 'Load timeout'), 90000);
    try { ensureWorker().postMessage({ type: 'run', requestId, code, tests }); }
    catch (error) { fail('Unable to start Python: ' + error.message, 'Runtime blocked'); }
  }
  runSamples.addEventListener('click', () => execute('samples'));
  submit.addEventListener('click', () => execute('submit'));
  stop.addEventListener('click', () => { if (!active) return; terminate(); finish(); status.textContent = 'Stopped'; note.textContent = 'Execution stopped; the Python runtime will reload on the next run.'; });
  window.addEventListener('pagehide', terminate, { once: true });
}
