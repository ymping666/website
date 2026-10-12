// Pure traces for the exercise contracts; no model calls or environment actions.
export const reactPresets = {
  valid: ['thought', 'action', 'observation', 'thought', 'finish'],
  short: ['thought', 'finish'],
  missing: ['thought', 'action', 'finish'],
  trailing: ['thought', 'finish', 'thought'],
  incomplete: ['thought', 'action', 'observation'],
  unknown: ['thought', 'wait', 'finish'],
  empty: []
};
export const reactAllowed = {
  start: ['thought'], ready: ['action', 'finish'], observed: ['thought', 'finish'],
  waiting: ['observation'], done: []
};
export function reactTrace(events) {
  let phase = 'start', error = null;
  const steps = events.map((event, index) => {
    const before = phase, allowed = reactAllowed[before];
    let reason = null;
    if (error !== null) reason = 'skipped';
    else if (!allowed.includes(event)) reason = before === 'done' ? 'afterFinish' : 'unexpected';
    else if (event === 'finish' && index !== events.length - 1) reason = 'finishNotLast';
    else if (event === 'finish') phase = 'done';
    else phase = { thought: 'ready', action: 'waiting', observation: 'observed' }[event];
    if (reason && reason !== 'skipped') error = index;
    return { index, event, before, after: phase, allowed, reason };
  });
  return { steps, phase, error, accepted: error === null && phase === 'done' };
}
export const mpcPresets = { lookahead: [[1, 5], [2, 0]], tie: [[1, 0], [-1, 0]], empty: [] };
export function mpcTrace(state = 0, candidates = mpcPresets.lookahead, target = 0) {
  let bestIndex = null, bestCost = Infinity;
  const plans = candidates.map((actions, index) => {
    let current = state, total = 0;
    const steps = actions.map(action => {
      current += action;
      const cost = (current - target) ** 2;
      total += cost;
      return { action, state: current, cost, total };
    });
    if (total < bestCost) { bestIndex = index; bestCost = total; }
    return { actions: [...actions], states: [state, ...steps.map(s => s.state)], steps, total };
  });
  return { plans, bestIndex, action: bestIndex === null ? null : plans[bestIndex].actions[0] };
}
export const bayesTransitions = { drift: [[0.9, 0.1], [0.2, 0.8]], identity: [[1, 0], [0, 1]], swap: [[0, 1], [1, 0]] };
export function bayesTrace(belief = [0.8, 0.2], transition = bayesTransitions.drift, likelihood = [0.25, 0.75]) {
  const contributions = transition.map((row, i) => row.map(value => value * belief[i]));
  const predicted = belief.map((_, j) => contributions.reduce((sum, row) => sum + row[j], 0));
  const weighted = predicted.map((value, j) => value * likelihood[j]);
  const evidence = weighted.reduce((a, b) => a + b, 0);
  return { belief: [...belief], transition, likelihood: [...likelihood], contributions, predicted, weighted, evidence,
    posterior: evidence === 0 ? null : weighted.map(value => value / evidence) };
}
