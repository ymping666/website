import { emptyJourney, normalizeJourney, localDay, shiftDay, summarize } from './progress.mjs';
import { locale } from './i18n.js';

const $ = selector => document.querySelector(selector);
const text = (selector, value) => { const element = $(selector); if (element) element.textContent = value; };
const node = (tag, value, cls) => { const element = document.createElement(tag); if (value !== undefined) element.textContent = value; if (cls) element.className = cls; return element; };

export async function mountProgressUI(store) {
  const response = await fetch(new URL(locale === 'zh' ? './catalog-zh.json' : './catalog.json', import.meta.url));
  if (!response.ok) throw new Error('Unable to load the practice index.');
  const { problems, sets } = await response.json();
  const ids = problems.map(p => p.id);
  const byId = new Map(problems.map(p => [p.id, p]));
  const href = path => new URL('../' + (locale === 'zh' ? 'zh/' : '') + path, import.meta.url).href;
  const link = (label, path, cls = '') => { const element = node('a', label, cls); element.href = href(path); return element; };
  const completed = () => {
    const raw = store.get('completed', {});
    return Object.fromEntries(ids.filter(id => raw?.[id] === true).map(id => [id, true]));
  };
  const state = () => normalizeJourney(store.get('journey', emptyJourney()));
  const dailyProblem = today => {
    const pool = problems.filter(p => p.difficulty === 'Easy' && ['AI Foundations', 'Transformer & Vision'].includes(p.track));
    const seed = [...today].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
    return pool[seed % pool.length];
  };
  const setProgress = (element, value, total) => { if (element) { element.max = total; element.value = value; } };
  function downloadBackup() {
    const data = store.backup(ids);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = node('a'); anchor.href = url; anchor.download = `frontiercode-backup-${localDay()}.json`;
    document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    text('#backup-status', 'Backup downloaded. It contains your code drafts; keep it private.');
  }
  function refresh() {
    const today = localDay(), journey = state(), solved = completed();
    const summary = summarize(journey, solved, today);
    text('#header-progress', `${summary.solved}/${problems.length} solved`);
    text('#solved-total', summary.solved);
    text('#practice-streak', summary.streak);
    text('#practice-best', summary.best);
    text('#practice-week', `${summary.weekDays}/7`);
    text('#today-goal-count', `${summary.todayAccepted}/${summary.goal}`);
    text('#today-status', summary.todayAccepted >= summary.goal ? 'Daily goal complete. Nice work!' : summary.todayRuns ? 'Practice recorded today. Keep working toward your goal.' : 'Run tests on any problem to record a practice day.');
    setProgress($('#today-goal-bar'), Math.min(summary.todayAccepted, summary.goal), summary.goal);
    if ($('#daily-goal')) $('#daily-goal').value = String(journey.goal);
    const daily = dailyProblem(today);
    const resume = byId.get(journey.lastProblem) || problems.find(p => !solved[p.id]) || problems[0];
    for (const selector of ['#daily-challenge', '#home-daily-challenge']) {
      const element = $(selector); if (!element) continue;
      element.href = href(`problems/${daily.id}/`);
      element.textContent = daily.title + (solved[daily.id] ? ' · Review' : ' →');
    }
    for (const selector of ['#resume-practice', '#home-resume-practice']) {
      const element = $(selector); if (!element) continue;
      element.href = href(`problems/${resume.id}/`);
      element.textContent = journey.lastProblem ? `Continue: ${resume.title} →` : 'Start your first exercise →';
    }
    text('#home-progress-summary', summary.solved ? `${summary.solved}/${problems.length} solved · ${summary.streak} day practice streak · ${summary.weekDays} active days this week` : 'Build a small daily habit. Your drafts and progress save on this browser.');
    for (const element of document.querySelectorAll('[data-solved]')) {
      const done = Boolean(solved[element.dataset.solved]);
      element.textContent = done ? '✓' : '○'; element.classList.toggle('done', done);
      element.setAttribute('aria-label', done ? 'Previously solved' : 'Not yet solved');
    }
    const storageWarning = $('#storage-warning');
    if (storageWarning) { storageWarning.hidden = !store.error; storageWarning.textContent = store.error; }
    const notice = $('#global-storage-notice');
    if (notice) {
      notice.hidden = !store.error;
      notice.replaceChildren();
      if (store.error) {
        notice.append(node('span', store.error + ' Download here before reloading or leaving this page. '));
        const button = node('button', 'Download backup', 'button outline small');
        button.type = 'button'; button.id = 'export-unsaved-progress';
        button.addEventListener('click', downloadBackup); notice.append(button);
      }
    }
    if ($('#activity-calendar')) {
      const calendar = $('#activity-calendar'); calendar.replaceChildren();
      for (let offset = -27; offset <= 0; offset++) {
        const day = shiftDay(today, offset), entry = journey.days[day];
        const description = `${day}: ${entry?.runs || 0} test runs, ${entry?.accepted.length || 0} problems accepted`;
        const cell = node('li', day.slice(8), entry?.runs ? 'active-day' : '');
        cell.title = description; cell.setAttribute('aria-label', description); calendar.append(cell);
      }
      text('#calendar-range', `${shiftDay(today, -27)} — ${today}`);
    }
    if ($('#topic-progress')) {
      const container = $('#topic-progress'); container.replaceChildren();
      for (const track of [...new Set(problems.map(p => p.track))]) {
        const group = problems.filter(p => p.track === track), done = group.filter(p => solved[p.id]).length;
        const row = node('div', undefined, 'topic-progress-row');
        row.append(node('strong', track), node('span', `${done}/${group.length}`));
        const bar = node('progress'); bar.setAttribute('aria-label', track + ' solved'); setProgress(bar, done, group.length);
        row.append(bar); container.append(row);
      }
    }
    if ($('#plan-progress')) {
      const container = $('#plan-progress'); container.replaceChildren();
      for (const set of sets) {
        const done = set.ids.filter(id => solved[id]).length;
        const card = node('article', undefined, 'plan-progress-card');
        card.append(link(set.title, `practice-sets/${set.slug}/`), node('span', `${done}/${set.ids.length} solved`));
        const bar = node('progress'); bar.setAttribute('aria-label', set.title + ' progress'); setProgress(bar, done, set.ids.length);
        card.append(bar);
        const next = set.ids.find(id => !solved[id]);
        card.append(next ? link('Next: ' + byId.get(next).title + ' →', `problems/${next}/`, 'plan-next') : node('strong', '✓ Practice set completed', 'plan-complete'));
        container.append(card);
      }
    }
    if ($('#practice-badges')) {
      const completeSets = sets.filter(set => set.ids.every(id => solved[id])).length;
      const milestones = [
        ['First implementation', summary.solved >= 1, `${Math.min(summary.solved, 1)}/1 solved`],
        ['10 building blocks', summary.solved >= 10, `${Math.min(summary.solved, 10)}/10 solved`],
        ['25 building blocks', summary.solved >= 25, `${Math.min(summary.solved, 25)}/25 solved`],
        ['Halfway there', summary.solved >= 50, `${Math.min(summary.solved, 50)}/50 solved`],
        ['Complete the library', summary.solved === problems.length, `${summary.solved}/${problems.length} solved`],
        ['Three-day rhythm', summary.best >= 3, `${Math.min(summary.best, 3)}/3 day best streak`],
        ['One-week rhythm', summary.best >= 7, `${Math.min(summary.best, 7)}/7 day best streak`],
        ['First focused set', completeSets >= 1, `${Math.min(completeSets, 1)}/1 set completed`]
      ];
      const container = $('#practice-badges'); container.replaceChildren();
      for (const [title, unlocked, detail] of milestones) {
        const badge = node('div', undefined, 'practice-badge' + (unlocked ? ' earned' : ''));
        badge.append(node('span', unlocked ? '✓ Earned' : 'In progress'), node('strong', title), node('small', detail)); container.append(badge);
      }
    }
    if ($('#progress-filter')) $('#progress-filter').dispatchEvent(new Event('input'));
  }
  $('#daily-goal')?.addEventListener('change', event => {
    const journey = state(); journey.goal = Number(event.target.value); store.set('journey', journey);
  });
  $('#export-progress')?.addEventListener('click', downloadBackup);
  $('#import-progress-file')?.addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 3000000) throw new Error('Choose a backup smaller than 3 MB.');
      const result = store.importBackup(await file.text(), ids);
      text('#backup-status', `Backup merged. ${result.imported} solved records read; ${result.retainedDrafts} existing drafts kept. Your current goal is preserved on this browser.`);
      refresh();
    } catch (error) { text('#backup-status', error.message); }
    event.target.value = '';
  });
  window.addEventListener('fc-progress-change', refresh);
  window.addEventListener('storage', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  // Refresh across midnight even if the dashboard stays open.
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  refresh();
}
