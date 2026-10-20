import {reactTrace,reactAllowed,reactPresets} from './lesson-frontier-math.mjs';
import {escapeMath as e} from './math-expression.mjs';
export const agentViewTranslations={};
const t=(en,zh)=>{agentViewTranslations[en]=zh;return en;};
const words={
 preset:t('Choose a trace','选择轨迹'),cursor:t('Events inspected','已检查事件数'),reset:t('Reset this trace','重置当前轨迹'),
 full:t('Full-trace verdict','完整轨迹判定'),valid:t('Valid → True','合法 → True'),invalid:t('Invalid → False','不合法 → False'),unfinished:t('Unfinished → False','未完成 → False'),
 current:t('Inspection state','当前检查状态'),allowed:t('Allowed next event','下一步允许的事件'),none:t('No next event','不允许后续事件'),
 start:t('Waiting for the first Thought','等待第一个 Thought'),ready:t('Thought recorded; choose Action or Finish','已记录 Thought；允许 Action 或 Finish'),waiting:t('Action recorded; awaiting its Observation','已记录 Action；等待其 Observation'),observed:t('Observation recorded; reason again or Finish','已记录 Observation；允许再次 Thought 或 Finish'),done:t('Finished; no events may follow','已结束；不能再有事件'),stopped:t('Validation stopped at the first error','校验已在第一个错误处停止'),
 unexpected:t('This event violates the required transition.','此事件违反了规定的转移顺序。'),expected:t('Expected before this event','此事件出现前应等待'),finishNotLast:t('Finish must be the last event. The validator can already see the trailing events in this list.','Finish 必须是最后一个事件。校验器已能看到列表后面仍有事件。'),afterFinish:t('An event cannot follow Finish.','Finish 后不能再有事件。'),skipped:t('Skipped after the first error.','首个错误之后不再处理。'),
 empty:t('An empty list has no Thought or Finish, so it is not a complete trace.','空列表没有 Thought 或 Finish，因此不是完整轨迹。'),incomplete:t('No transition failed, but the list ended without Finish. A legal prefix is not a complete valid trace.','没有转移出错，但列表结束时仍无 Finish。合法前缀不等于完整合法轨迹。'),ok:t('Every event obeys the protocol, and Finish is last. This says nothing about answer quality.','每个事件都符合协议，且 Finish 位于末尾；这不说明答案质量。'),
 progress:t('Inspection progress','检查进度'),pending:t('Not inspected yet','尚未检查'),passed:t('Checked: allowed','已检查：允许'),failure:t('First protocol error','第一个协议错误'),
 legend:t('Green with a check: accepted event. Red with an exclamation mark: first error. Gray: pending or skipped. The event label alone never proves the tool result or reasoning is correct.','绿色加勾：已接受的事件；红色加叹号：首个错误；灰色：尚未检查或已跳过。事件标签本身不证明工具结果或推理正确。'),
 staticTitle:t('Read two complete traces without interaction','无需交互也能读懂的两条完整轨迹'),staticGood:t('Valid: Thought → Action → Observation → Finish. The action receives its observation before termination.','合法：Thought → Action → Observation → Finish。行动收到观察结果后才结束。'),staticBad:t('Invalid: Thought → Action → Finish. At event 3, Observation is required; Finish arrives too soon.','不合法：Thought → Action → Finish。第 3 个事件应为 Observation，Finish 提前出现。'),
 nojs:t('The full default trace and both worked examples remain readable without JavaScript. Enable JavaScript to choose a trace and inspect its events.','不启用 JavaScript 也可阅读默认完整轨迹与两个示例。启用后可以切换轨迹并逐步检查事件。')
};
export const agentTracePresets={
 short:{label:t('Valid · Thought → Finish','合法 · Thought → Finish'),events:reactPresets.short},
 tool:{label:t('Valid · One complete tool cycle','合法 · 一次完整工具循环'),events:['thought','action','observation','finish']},
 cycle:{label:t('Valid · Observe, think again, then finish','合法 · 观察后再次思考，再结束'),events:reactPresets.valid},
 missing:{label:t('Invalid · Missing Observation','不合法 · 缺少 Observation'),events:reactPresets.missing},
 early:{label:t('Invalid · Action before Thought','不合法 · Action 早于 Thought'),events:['action','observation','finish']},
 trailing:{label:t('Invalid · Event after Finish','不合法 · Finish 后仍有事件'),events:reactPresets.trailing},
 unfinished:{label:t('Incomplete · No Finish','未完成 · 缺少 Finish'),events:reactPresets.incomplete},
 unknown:{label:t('Invalid · Unknown event','不合法 · 未知事件'),events:reactPresets.unknown},
 empty:{label:t('Invalid · Empty list','不合法 · 空列表'),events:reactPresets.empty}
};
const say=(key,zh)=>zh?agentViewTranslations[words[key]]:words[key];
const eventLabel=event=>event[0].toUpperCase()+event.slice(1);
export function agentInspection(key='tool',cursor=agentTracePresets[key]?.events.length){
 const preset=agentTracePresets[key];
 if(!preset)throw new RangeError('Unknown trace preset');
 if(!Number.isInteger(cursor)||cursor<0||cursor>preset.events.length)throw new RangeError('Invalid inspection cursor');
 const trace=reactTrace(preset.events),last=trace.steps[cursor-1],failed=trace.error!==null&&trace.error<cursor;
 return {trace,cursor,failed,phase:last?.after||'start',allowed:failed?[]:reactAllowed[last?.after||'start']};
}
export function renderAgentTrace(key='tool',cursor=agentTracePresets[key]?.events.length,zh=false){
 const {trace,failed,phase,allowed}=agentInspection(key,cursor),s=k=>say(k,zh),error=trace.error===null?null:trace.steps[trace.error];
 const status=trace.accepted?'valid':error?'invalid':trace.steps.length?'unfinished':'invalid';
 const explanation=trace.accepted?s('ok'):error?`<code>${error.index+1}. ${e(eventLabel(error.event))}</code>: <span>${e(s(error.reason))}</span>`:s(trace.steps.length?'incomplete':'empty');
 return `<div class="ca-verdict ${trace.accepted?'is-valid':'is-invalid'}"><span>${s('full')}</span><strong id="ca-verdict" data-valid="${trace.accepted}">${s(status)}</strong><p>${error?explanation:e(explanation)}</p>${error?.reason==='unexpected'?`<p><span>${s('expected')}</span>: <code>${error.allowed.map(eventLabel).join(' / ')}</code></p>`:''}</div><div class="ca-state" role="status" aria-live="polite" aria-atomic="true"><div><span>${s('current')}</span><strong id="ca-state" data-phase="${phase}" data-failed="${failed}">${s(failed?'stopped':phase)}</strong></div><div><span>${s('allowed')}</span><strong id="ca-allowed">${allowed.length?`<code>${allowed.map(eventLabel).join(' / ')}</code>`:s('none')}</strong></div><p class="ca-progress"><span>${s('progress')}</span>: <output id="ca-progress">${cursor} / ${trace.steps.length}</output></p></div><ol class="ca-events" aria-label="${s('progress')}">${trace.steps.map(step=>{const inspected=step.index<cursor,kind=!inspected?'pending':step.reason==='skipped'?'skipped':step.reason?'error':'passed',label=kind==='error'?s('failure'):kind==='skipped'?s('skipped'):kind==='pending'?s('pending'):s('passed');return `<li class="ca-event ${kind}" ${step.index===cursor-1?'aria-current="step"':''}><span class="ca-event-number">${step.index+1}</span><div><strong><code>${e(eventLabel(step.event))}</code></strong><span><span aria-hidden="true">${kind==='passed'?'✓ ':kind==='error'?'! ':''}</span><span>${e(label)}</span></span></div><code>${e(step.event)}</code></li>`;}).join('')}</ol><p class="fineprint">${s('legend')}</p>`;
}
export function conceptAgentExperiment(){return `<div class="lesson-experiment cf-experiment ca-experiment" data-concept-agent><div class="lesson-controls"><label for="ca-preset">${words.preset}<select id="ca-preset" disabled>${Object.entries(agentTracePresets).map(([key,preset])=>`<option value="${key}" ${key==='tool'?'selected':''}>${e(preset.label)}</option>`).join('')}</select></label><button class="button outline small" id="ca-reset" type="button" disabled>${words.reset}</button></div><label class="ca-cursor" for="ca-cursor">${words.cursor}<input id="ca-cursor" type="range" min="0" max="4" step="1" value="4" disabled></label><div id="ca-view">${renderAgentTrace()}</div><noscript><p>${words.nojs}</p></noscript></div><aside class="ca-static"><h3>${words.staticTitle}</h3><p>${words.staticGood}</p><p>${words.staticBad}</p></aside>`;}
conceptAgentExperiment();
