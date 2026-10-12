import { reactAllowed } from './lesson-frontier-math.mjs';
import { formatNumber as f } from './lesson-math.mjs';

export const frontierTranslations = {};
export const t = (en, zh) => { frontierTranslations[en] = zh; return en; };
const labels = {
  start: t('Start: expect thought', '开始：等待 thought'),
  ready: t('After thought: action or finish', 'thought 后：action 或 finish'),
  waiting: t('Pending tool: expect observation', '工具调用待返回：等待 observation'),
  observed: t('After observation: thought or finish', 'observation 后：thought 或 finish'),
  done: t('Finished: no more events', '已结束：不能再有事件'),
  accepted: t('Complete and valid → True', '完整且合法 → True'),
  invalid: t('Invalid trace → False', '轨迹不合法 → False'),
  incomplete: t('Valid prefix, but unfinished → False', '前缀合法，但未结束 → False'),
  unexpected: t('Event is not allowed in this state.', '当前状态不允许此事件。'),
  finishNotLast: t('finish must be the final event.', 'finish 必须是最后一个事件。'),
  afterFinish: t('No events may follow finish.', 'finish 后不能再有事件。'),
  skipped: t('Not processed after the first error.', '首个错误之后不再处理。'),
  next: t('Allowed next', '接下来允许'),
  stopped: t('Validation stopped at the first error.', '验证已在首个错误处停止。'),
  none: t('None', '无'),
  passed: t('OK', '通过'),
  empty: t('No events. A complete trace must end with finish.', '没有事件。完整轨迹必须以 finish 结束。'),
  plan: t('Plan', '方案'),
  action: t('Action', '动作'),
  total: t('Total cost', '总代价'),
  selected: t('Selected', '选中'),
  predicted: t('Predicted only', '仅为预测'),
  first: t('First action eligible for execution', '仅首个动作可用于执行'),
  noPlans: t('No candidates → None. No action is selected.', '没有候选方案 → None，不选择动作。'),
  axis: t('Horizontal: step · vertical: predicted state', '横轴：步数 · 纵轴：预测状态'),
  prior: t('Prior belief', '更新前的信念'),
  prediction: t('Predicted belief', '预测分布'),
  posterior: t('Posterior belief', '后验分布'),
  zero: t('Evidence is zero → ValueError. A posterior cannot be normalized.', '证据概率为零 → ValueError，无法归一化为后验分布。'),
  evidence: t('Evidence', '证据概率'),
  source: t('Source → next state', '来源 → 下一状态'),
  contribution: t('Probability mass', '流入的概率质量'),
  state: t('Next state', '下一状态'),
  weight: t('Unnormalized weight', '未归一化权重')
};
export const say = (value, zh = false) => zh ? frontierTranslations[value] || value : value;
export const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const cell = value => `<td>${esc(value)}</td>`;
export const rows = data => data.map(values => `<tr>${values.map(cell).join('')}</tr>`).join('');
const table = (headers, data, label) => `<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="${esc(label)}"><table class="lesson-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows(data)}</tbody></table></div>`;

export function renderReactState(trace, cursor = 0, zh = false) {
  const tr = key => say(labels[key], zh);
  const processed = trace.steps.slice(0, cursor), last = processed.at(-1);
  const failed = trace.error !== null && trace.error < cursor;
  const phase = last?.after || 'start';
  const stateCards = ['start','ready','waiting','observed','done'].map(key => `<div class="frontier-state ${phase === key ? 'active' : ''}" ${phase === key ? 'aria-current="step"' : ''}><strong>${esc(tr(key))}</strong><code>${esc(reactAllowed[key].join(' / ') || '—')}</code></div>`).join('');
  const verdict = trace.accepted ? tr('accepted') : trace.error !== null ? tr('invalid') : tr('incomplete');
  const detail = failed ? esc(tr('stopped')) : `<span>${esc(tr('next'))}</span>: <code>${esc(reactAllowed[phase].join(' / ') || tr('none'))}</code>`;
  const body = trace.steps.map(step => [String(step.index),step.event, say(labels[step.before],zh),step.allowed.join(' / ') || '—',step.reason ? say(labels[step.reason],zh) : tr('passed')]);
  return `<div class="frontier-states">${stateCards}</div><p id="react-current" role="status">${detail}</p><div class="frontier-events">${trace.steps.map(step => `<span class="${step.index < cursor ? 'visited' : ''} ${step.reason && step.reason !== 'skipped' ? 'invalid' : ''}" ${step.index === cursor - 1 ? 'aria-current="step"' : ''}><code>${step.index}: ${esc(step.event)}</code></span>`).join('') || `<p>${esc(tr('empty'))}</p>`}</div><p class="lesson-warning ${trace.accepted ? 'finite' : ''}" id="react-verdict">${esc(verdict)}</p>${table(['i','event',say(t('State before event','事件前的状态'),zh),say(labels.next,zh),say(t('Validation','验证结果'),zh)],body,say(t('Complete trace validation','完整轨迹验证'),zh))}`;
}

export function mpcDiagram(trace, target = 0, zh = false) {
  if (!trace.plans.length) return '';
  const values = trace.plans.flatMap(p => p.states).concat(target), low = Math.min(...values) - 1, high = Math.max(...values) + 1;
  const horizon = trace.plans[0].steps.length, x = i => 50 + i * 235, y = v => 220 - (v - low) / (high - low) * 190;
  const colors = ['#087f72','#b35c1e'];
  const labelY = (step,p,i) => {
    const own = y(step.state), other = trace.plans.length > 1 ? y(trace.plans[1-p].states[i+1]) : own;
    return own + (own > other || (own === other && p === 1) ? 20 : -10);
  };
  return `<svg class="frontier-plan-svg" viewBox="0 0 570 270" aria-hidden="true"><line x1="50" y1="220" x2="535" y2="220" stroke="#9da9b3"/><line x1="50" y1="25" x2="50" y2="220" stroke="#9da9b3"/><line x1="50" y1="${y(target)}" x2="535" y2="${y(target)}" stroke="#8492a6" stroke-dasharray="3 5"/><text x="535" y="${y(target)-7}" text-anchor="end"><tspan>${esc(say(t('Target','目标'),zh))}</tspan>: ${f(target)}</text>${[0,horizon].map(i=>`<text x="${x(i)}" y="243" text-anchor="middle">${i}</text>`).join('')}${horizon === 2 ? '<text x="285" y="243" text-anchor="middle">1</text>' : ''}${[low,high].map(v=>`<text x="42" y="${y(v)+4}" text-anchor="end">${f(v)}</text>`).join('')}${trace.plans.map((plan,p)=>plan.steps.map((step,i)=>`<line x1="${x(i)}" y1="${y(plan.states[i])}" x2="${x(i+1)}" y2="${y(step.state)}" stroke="${colors[p]}" stroke-width="${p===trace.bestIndex?4:2}" ${i === 0 && p === trace.bestIndex ? '' : 'stroke-dasharray="7 5"'}/><circle cx="${x(i+1)}" cy="${y(step.state)}" r="5" fill="${colors[p]}"/><text x="${x(i+1)-10}" y="${labelY(step,p,i)}" text-anchor="end" style="fill:${colors[p]}">${p===0?'A':'B'}: ${f(step.state)}</text>`).join('')).join('')}<circle cx="50" cy="${y(trace.plans[0].states[0])}" r="5" fill="#263744"/><text x="290" y="264" text-anchor="middle">${esc(say(labels.axis,zh))}</text></svg>`;
}
export function renderMpcState(trace, target = 0, zh = false) {
  if (!trace.plans.length) return `<p id="mpc-selection" role="status">${esc(say(labels.noPlans,zh))}</p>`;
  const plans = trace.plans.map((plan,p)=>`<section class="frontier-plan ${p===trace.bestIndex?'selected':''}"><h4><span class="frontier-plan-key plan-${p}">${p===0?'A':'B'}</span> <span>${esc(say(labels.plan,zh))}</span> ${p===trace.bestIndex?`· <span>${esc(say(labels.selected,zh))}</span>`:''}</h4><p><code>[${plan.actions.join(', ')}]</code> · <span>${esc(say(labels.total,zh))}</span>: <strong>${f(plan.total)}</strong></p>${table(['k',say(labels.action,zh),'s(next)','cost(s(next))',say(t('Running total','累计代价'),zh)],plan.steps.map((s,i)=>[i+1,f(s.action),f(s.state),f(s.cost),f(s.total)]),say(t('Candidate rollout costs','候选轨迹代价'),zh))}</section>`).join('');
  return `${mpcDiagram(trace,target,zh)}<p class="fineprint">${esc(say(t('Solid segment: selected first action. Dashed segments: other predicted moves; none are executed here.','实线：选中方案的首个动作。虚线：其余预测动作；此处不会实际执行任何动作。'),zh))}</p><div class="frontier-plan-grid">${plans}</div><p class="lesson-warning finite" role="status" id="mpc-selection"><span>${esc(say(labels.first,zh))}</span>: <output id="mpc-action">${f(trace.action)}</output> (${trace.bestIndex===0?'A':'B'})</p>`;
}
const bars = (name, values, zh) => `<section class="frontier-distribution"><h4>${esc(say(labels[name],zh))}</h4>${values.map((value,i)=>`<div class="probability-row"><code>${i===0?'A':'B'}</code><div class="probability-track" aria-hidden="true"><span style="width:${value*100}%"></span></div><output>${(value*100).toFixed(2)}%</output></div>`).join('')}</section>`;
export function renderBayesState(trace, zh = false) {
  return `<div class="frontier-beliefs">${bars('prior',trace.belief,zh)}<span class="frontier-arrow" aria-hidden="true">→</span>${bars('prediction',trace.predicted,zh)}<span class="frontier-arrow" aria-hidden="true">→</span>${trace.posterior?bars('posterior',trace.posterior,zh):`<section class="frontier-distribution"><h4>${esc(say(labels.posterior,zh))}</h4><code>—</code></section>`}</div>${table([say(labels.source,zh),'b[i] × T[i][j]',say(labels.contribution,zh)],trace.contributions.flatMap((row,i)=>row.map((value,j)=>[`${i===0?'A':'B'} → ${j===0?'A':'B'}`,`${f(trace.belief[i])} × ${f(trace.transition[i][j])}`,f(value)])),say(t('Prediction contributions','预测分布的来源'),zh))}${table([say(labels.state,zh),'predicted[j]','P(o | j)',say(labels.weight,zh),'posterior[j]'],trace.predicted.map((value,j)=>[j===0?'A':'B',f(value),f(trace.likelihood[j]),f(trace.weighted[j]),trace.posterior?f(trace.posterior[j]):'—']),say(t('Observation weighting and normalization','观测加权与归一化'),zh))}<p id="bayes-evidence"><span>${esc(say(labels.evidence,zh))}</span> = ${trace.weighted.map(f).join(' + ')} = <output>${f(trace.evidence)}</output></p><p id="bayes-status" class="lesson-warning ${trace.posterior?'finite':''}" role="status">${trace.posterior?`posterior = [${trace.posterior.map(f).join(', ')}]`:esc(say(labels.zero,zh))}</p>`;
}
