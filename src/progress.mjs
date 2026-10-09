// Keep the original storage and backup identifiers so rebranding preserves existing records.
export const PREFIX = 'frontiercode:v04:';
export const emptyJourney = () => ({ version: 1, goal: 1, days: {}, stats: {}, lastProblem: null });
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000;
const validId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function shiftDay(day, amount) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function normalizeJourney(raw) {
  const result = emptyJourney();
  if (!plain(raw)) return result;
  if ([1, 2, 3].includes(raw.goal)) result.goal = raw.goal;
  if (validId(raw.lastProblem)) result.lastProblem = raw.lastProblem;
  for (const [day, entry] of Object.entries(raw.days || {})) {
    if (validDay(day) && plain(entry) && count(entry.runs)) {
      result.days[day] = { runs: entry.runs, accepted: [...new Set((Array.isArray(entry.accepted) ? entry.accepted : []).filter(validId))] };
    }
  }
  for (const [id, entry] of Object.entries(raw.stats || {})) {
    if (validId(id) && plain(entry) && count(entry.runs) && count(entry.passes) && validDay(entry.lastDay)) {
      result.stats[id] = { runs: entry.runs, passes: entry.passes, lastDay: entry.lastDay };
    }
  }
  return result;
}
export function recordPractice(raw, { id, day, accepted = false }) {
  if (!validId(id) || !validDay(day)) throw new Error('Invalid practice record');
  const journey = normalizeJourney(raw);
  const daily = journey.days[day] ||= { runs: 0, accepted: [] };
  daily.runs = Math.min(daily.runs + 1, 1000000);
  if (accepted && !daily.accepted.includes(id)) daily.accepted.push(id);
  const stat = journey.stats[id] ||= { runs: 0, passes: 0, lastDay: day };
  stat.runs = Math.min(stat.runs + 1, 1000000);
  stat.passes = Math.min(stat.passes + Number(accepted), 1000000);
  stat.lastDay = day;
  journey.lastProblem = id;
  return journey;
}
export function summarize(raw, completed, today = localDay()) {
  const journey = normalizeJourney(raw);
  const days = Object.keys(journey.days).filter(day => day <= today && journey.days[day].runs > 0).sort();
  const active = new Set(days);
  let streak = 0, best = 0, chain = 0, previous = null;
  for (const day of days) {
    chain = previous === shiftDay(day, -1) ? chain + 1 : 1;
    best = Math.max(best, chain); previous = day;
  }
  let cursor = active.has(today) ? today : shiftDay(today, -1);
  while (active.has(cursor)) { streak++; cursor = shiftDay(cursor, -1); }
  return { solved: Object.values(completed || {}).filter(value => value === true).length,
    streak, best, activeDays: days.length, todayRuns: journey.days[today]?.runs || 0,
    todayAccepted: journey.days[today]?.accepted.length || 0, goal: journey.goal,
    weekDays: Array.from({ length: 7 }, (_, n) => shiftDay(today, -n)).filter(day => active.has(day)).length };
}

// A failed write is reported to the UI; callers must not claim the data was saved.
export function createStore(getStorage, onChange = () => {}) {
  let error = '';
  const pending = new Map();
  const get = (key, fallback) => {
    if (pending.has(key)) return pending.get(key);
    try { const value = getStorage().getItem(PREFIX + key); return value === null ? fallback : JSON.parse(value); }
    catch { error = 'Browser storage is unavailable or contains unreadable data.'; return fallback; }
  };
  const set = (key, value) => {
    try { getStorage().setItem(PREFIX + key, JSON.stringify(value)); pending.delete(key); error = pending.size ? 'Some changes are only in memory. Export a backup before leaving.' : ''; onChange(); return true; }
    catch { pending.set(key, value); error = 'Browser storage could not save your changes. Export a backup before leaving.'; onChange(); return false; }
  };
  function backup(ids) {
    const drafts = {};
    for (const id of ids) { const value = get('draft:' + id, null); if (typeof value === 'string') drafts[id] = value; }
    return { app: 'frontiercode', version: 1, exportedAt: new Date().toISOString(),
      completed: get('completed', {}), journey: normalizeJourney(get('journey', null)), drafts };
  }
  function importBackup(text, ids) {
    const data = validateBackup(text, ids);
    const previousJourney = get('journey', null);
    const current = normalizeJourney(previousJourney);
    const incoming = data.journey;
    if (!previousJourney) current.goal = incoming.goal;
    // Merge overlap by maxima/union; importing the same backup twice does not inflate activity.
    for (const [day, entry] of Object.entries(incoming.days)) {
      const old = current.days[day] || { runs: 0, accepted: [] };
      current.days[day] = { runs: Math.max(old.runs, entry.runs), accepted: [...new Set([...old.accepted, ...entry.accepted])] };
    }
    for (const [id, entry] of Object.entries(incoming.stats)) {
      const old = current.stats[id];
      current.stats[id] = old ? { runs: Math.max(old.runs, entry.runs), passes: Math.max(old.passes, entry.passes), lastDay: old.lastDay > entry.lastDay ? old.lastDay : entry.lastDay } : entry;
    }
    current.lastProblem ||= incoming.lastProblem;
    const updates = { completed: { ...get('completed', {}), ...data.completed }, journey: current };
    let retainedDrafts = 0;
    for (const [id, draft] of Object.entries(data.drafts)) {
      if (get('draft:' + id, null) === null) updates['draft:' + id] = draft;
      else retainedDrafts++;
    }
    const storage = getStorage();
    const before = new Map(Object.keys(updates).map(key => [key, storage.getItem(PREFIX + key)]));
    try {
      for (const [key, value] of Object.entries(updates)) storage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      for (const [key, value] of before) {
        if (value === null) storage.removeItem(PREFIX + key); else storage.setItem(PREFIX + key, value);
      }
      throw new Error('Not enough browser storage. Import was cancelled; existing progress was preserved.');
    }
    for (const key of Object.keys(updates)) pending.delete(key);
    error = pending.size ? 'Some changes are only in memory. Export a backup before leaving.' : ''; onChange();
    return { imported: Object.keys(data.completed).length, retainedDrafts };
  }
  return { get, set, backup, importBackup, get error() { return error; } };
}
export function validateBackup(text, knownIds) {
  if (typeof text !== 'string' || text.length > 3000000) throw new Error('Backup must be a JSON file smaller than 3 MB.');
  let data; try { data = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  if (data?.app !== 'frontiercode' || data.version !== 1 || !plain(data.completed) || !plain(data.drafts) || !plain(data.journey) || data.journey.version !== 1) {
    throw new Error('This is not a supported TensorDrill backup.');
  }
  const known = new Set(knownIds);
  const completed = {}, drafts = {};
  const checkId = id => { if (!validId(id) || !known.has(id)) throw new Error('Backup contains an unknown exercise. Update the site before importing.'); };
  for (const [id, value] of Object.entries(data.completed)) { checkId(id); if (value !== true) throw new Error('Invalid completed record.'); completed[id] = true; }
  for (const [id, value] of Object.entries(data.drafts)) {
    checkId(id); if (typeof value !== 'string' || value.length > 100000) throw new Error('Invalid or oversized code draft.'); drafts[id] = value;
  }
  if (!plain(data.journey.days) || !plain(data.journey.stats) || Object.keys(data.journey.days).length > 3660 || ![1, 2, 3].includes(data.journey.goal)) throw new Error('Invalid activity history.');
  for (const [day, entry] of Object.entries(data.journey.days)) {
    if (!validDay(day) || !plain(entry) || !count(entry.runs) || !Array.isArray(entry.accepted)) throw new Error('Invalid activity day.');
    entry.accepted.forEach(checkId);
  }
  for (const [id, entry] of Object.entries(data.journey.stats)) {
    checkId(id); if (!plain(entry) || !count(entry.runs) || !count(entry.passes) || !validDay(entry.lastDay)) throw new Error('Invalid exercise history.');
  }
  if (data.journey.lastProblem !== null) checkId(data.journey.lastProblem);
  return { completed, drafts, journey: normalizeJourney(data.journey) };
}
