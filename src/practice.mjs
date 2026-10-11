// Shared by the static build and the browser so every entry uses the same order.
export function practiceContext(id, sets, concepts, requested = {}) {
  requested ||= {};
  const set = sets.find(s => s.slug === requested.set && s.ids.includes(id));
  if (set) return { set: set.slug };
  const concept = concepts.find(c => c.slug === requested.concept && c.ids.includes(id))
    || concepts.find(c => c.ids.includes(id));
  return concept ? { concept: concept.slug } : {};
}

export function nextPractice(problems, sets, concepts, id, completed = {}, requested = {}) {
  const context = practiceContext(id, sets, concepts, requested);
  const group = context.set ? sets.find(s => s.slug === context.set) : concepts.find(c => c.slug === context.concept);
  const current = problems.find(p => p.id === id);
  const pending = ids => ids.map(key => problems.find(p => p.id === key)).find(p => p && p.id !== id && completed?.[p.id] !== true);
  if (group) {
    const position = group.ids.indexOf(id);
    const problem = pending([...group.ids.slice(position + 1), ...group.ids.slice(0, position)]);
    if (problem) return { problem, context };
  }
  const peers = problems.filter(p => p.track === current?.track);
  const position = peers.findIndex(p => p.id === id);
  const problem = pending([...peers.slice(position + 1), ...peers.slice(0, Math.max(0, position))].map(p => p.id))
    || pending(problems.map(p => p.id));
  return problem ? { problem, context: practiceContext(problem.id, sets, concepts) } : null;
}

export function practicePath(id, context = {}) {
  const query = context.set ? '?set=' + encodeURIComponent(context.set)
    : context.concept ? '?concept=' + encodeURIComponent(context.concept) : '';
  return `problems/${id}/${query}`;
}
