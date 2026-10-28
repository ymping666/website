// Only send predefined practice actions and a published problem identifier.
// No editor contents, test details, free-form input, or stored progress are sent.
const events = new Set(['practice_run', 'practice_submit', 'practice_pass', 'practice_next']);

export function trackPractice(target, name, problemId, language) {
  if (!events.has(name) || typeof problemId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(problemId)) return;
  if (typeof target?.gtag !== 'function') return;
  try {
    target.gtag('event', name, {
      problem_id: problemId,
      content_language: language === 'zh-CN' ? 'zh' : 'en',
      transport_type: 'beacon'
    });
  } catch {
    // Analytics must never prevent a learner from using the workbench.
  }
}
