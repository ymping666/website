import {formatNumber as f} from './lesson-math.mjs';
export const round13Translations={};
export const t=(en,zh)=>{round13Translations[en]=zh;return en;};
export const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Math.abs(v)>=1e6?v.toExponential(2):f(v);
const L={
 history:t('Public-test attempt timeline','公开测试尝试时间线'),turn:t('Turn','轮次'),pass:t('Public tests passed','公开测试通过'),fail:t('Public tests failed','公开测试失败'),pending:t('Not attempted','尚未尝试'),
 count:t('Completed / allowed attempts','已完成 / 允许的尝试次数'),hasPass:t('Any public success?','是否已有公开测试成功？'),yes:t('Yes','是'),no:t('No','否'),
 validation:t('Validate history before choosing an action','先验证历史，再决定动作'),over:t('History exceeds the turn limit.','历史长度超过轮数上限。'),after:t('An attempt appears after an earlier public success.','已有公开测试成功后，又出现了后续尝试。'),
 retry:t('Another public-test repair attempt is allowed.','允许再进行一次公开测试修复尝试。'),private:t('End repair and request private evaluation of the final candidate. Correctness is still unknown.','结束修复，将最后的候选提交私有测试评估。此时尚不能判定最终正确性。'),
 invalid:t('Invalid history: raise ValueError. Do not return an action.','历史无效：抛出 ValueError，不返回动作。'),
 successReason:t('Termination reason: public success.','结束原因：公开测试通过。'),budgetReason:t('Termination reason: turn budget exhausted.','结束原因：轮数预算耗尽。'),bothReason:t('Both public success and the turn limit apply.','公开测试通过，并且恰好达到轮数上限。'),
 output:t('Component output','组件输出'),precision:t('Tables and diagrams round to 6 decimals; very large values use scientific notation. The output retains full precision.','表格与图示最多显示 6 位小数；极大值使用科学计数法。输出保留完整精度。'),
 token:t('Sampled token index','采样 token 索引'),policy:t('Policy log probability','策略对数概率'),reference:t('Reference log probability','参考策略对数概率'),ratio:t('Signed log ratio','带符号的对数比'),
 tokenNote:t('Each row compares the same sampled token under two policies. These are supplied natural log probabilities, not a full token distribution.','每行比较同一个采样 token 在两种策略下的概率。输入是给定的自然对数概率，不是完整 token 分布。'),
 base:t('1 · Select the execution reward','1 · 选择执行反馈奖励'),average:t('2 · Average the token log ratios','2 · 对 token 对数比取平均'),shape:t('3 · Subtract the weighted log ratio','3 · 减去加权对数比'),
 terminal:t('Terminal turn','终止轮'),valid:t('Valid code','代码有效'),all:t('All public AND private tests pass','公开和私有测试全部通过'),unused:t('Not used here','此轮不使用'),
 length:t('Response token count L','回复 token 数量 L'),sum:t('Compensated log-ratio sum','补偿求和后的对数比总和'),mean:t('Mean log ratio','平均对数比'),penalty:t('Weighted log-ratio term','加权对数比项'),
 signed:t('A sampled log ratio can be negative. Subtracting a negative term increases this sample’s shaped reward; this does not make exact KL divergence negative.','采样对数比可以为负。减去负项会提高这个样本的塑形奖励；这并不意味着精确 KL 散度为负。'),
 bars:t('Token log ratios: left is negative, right is positive','token 对数比：左侧为负，右侧为正'),
 reward:t('Shaped reward r[t]','塑形奖励 r[t]'),baseline:t('Pre-response baseline V[t]','生成回复前的 baseline V[t]'),returns:t('Remaining return G[t]','剩余回报 G[t]'),advantage:t('Advantage A[t]','优势 A[t]'),
 timeline:t('Select a turn; include its reward and all later rewards','选择一轮：计入本轮及之后所有奖励'),excluded:t('Earlier: excluded','更早：不计入'),included:t('Included in this suffix','计入当前后缀'),
 inspect:t('Work through the inspected turn','逐项计算当前轮次'),reverse:t('Reverse accumulation order','反向累计顺序'),subtract:t('Subtract this turn’s baseline once','只减一次本轮的 baseline'),
 empty:t('Empty episode: no turns or baselines to inspect. Return a new empty list.','空 episode：没有可查看的轮次或 baseline，返回新的空列表。'),
 baselineNote:t('Each baseline belongs to the state before generating that same turn. Baselines are not rewards and are not accumulated into the suffix.','每个 baseline 对应生成同一轮回复之前的状态。baseline 不是奖励，不应累计进后缀和。'),
 calculations:t('Per-turn calculation table','各轮计算表')
};
const say=(k,zh)=>zh?round13Translations[L[k]]:L[k];
const table=(heads,rows,caption)=>`<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="${esc(caption)}"><table class="lesson-table r13-table"><caption>${esc(caption)}</caption><thead><tr>${heads.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${esc(typeof x==='number'?n(x):x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const result=(id,value,zh)=>`<h4>${say('output',zh)}</h4><pre class="r13-output" id="${id}">${esc(typeof value==='string'?value:JSON.stringify(value,null,2))}</pre>`;
const card=(title,body)=>`<section class="r13-step"><h4>${title}</h4>${body}</section>`;
export function renderEpisode(tr,zh=false){
 const slots=Array.from({length:Math.max(tr.limit,tr.history.length)},(_,i)=>`<div class="r13-turn ${i<tr.history.length?(tr.history[i]?'r13-success':'r13-failure'):'r13-pending'}"><small><span>${say('turn',zh)}</span> ${i+1}</small><strong aria-hidden="true">${i<tr.history.length?(tr.history[i]?'✓':'×'):'…'}</strong><span>${say(i<tr.history.length?(tr.history[i]?'pass':'fail'):'pending',zh)}</span></div>`).join('');
 const reason=tr.passed&&tr.exhausted?'bothReason':tr.passed?'successReason':'budgetReason';
 return `<h4>${say('history',zh)}</h4><div class="r13-timeline">${slots}</div><div class="r13-gates"><p>${say('count',zh)}<strong>${tr.history.length} / ${tr.limit}</strong></p><p>${say('hasPass',zh)}<strong>${say(tr.passed?'yes':'no',zh)}</strong></p></div>${tr.error?card(say('validation',zh),`<p>${tr.exceeded?say('over',zh):''} ${tr.afterSuccess?say('after',zh):''}</p><p class="lesson-warning">${say('invalid',zh)}</p>`):`<div class="r13-result" role="status"><strong>${tr.output}</strong><p>${say(tr.output==='retry'?'retry':'private',zh)}</p>${tr.output==='private_eval'?`<p>${say(reason,zh)}</p>`:''}</div>`}${result('episode-output',tr.error?'raises ValueError':tr.output,zh)}`;
}
export function renderReward(tr,zh=false){
 const maximum=Math.max(1,...tr.ratios.map(Math.abs));
 const bars=`<figure class="r13-ratios"><figcaption>${say('bars',zh)}</figcaption>${tr.ratios.map((r,i)=>`<div class="r13-ratio"><samp>${i}</samp><div class="r13-signed-track" aria-hidden="true"><span class="${r<0?'r13-negative':'r13-positive'}" style="width:${Math.abs(r)/maximum*50}%;${r<0?'right':'left'}:50%"></span></div><output>${n(r)}</output></div>`).join('')}</figure>`;
 return `<p class="fineprint">${say('tokenNote',zh)}</p>${table([say('token',zh),'log π','log ρ',say('ratio',zh)],tr.policy.map((p,i)=>[i,p,tr.reference[i],tr.ratios[i]]),say('ratio',zh))}${bars}<div class="r13-reward-flow">${card(say('base',zh),`<dl class="r13-flags">${[['terminal',tr.terminal],['valid',tr.valid],['all',tr.allPass]].map(([k,v])=>`<div><dt>${say(k,zh)}</dt><dd>${say(k==='all'&&!tr.terminal?'unused':v?'yes':'no',zh)}</dd></div>`).join('')}</dl><p class="r13-number">base = ${n(tr.base)}</p>`)}${card(say('average',zh),`<p>${say('length',zh)}: ${tr.policy.length}</p><p>${say('sum',zh)}: ${n(tr.sum)}</p><p class="r13-number">mean = ${n(tr.sum)} / ${tr.policy.length} = ${n(tr.mean)}</p>`)}${card(say('shape',zh),`<p>${say('penalty',zh)}: ${n(tr.beta)} × (${n(tr.mean)}) = ${n(tr.penalty)}</p><p class="r13-number">R = ${n(tr.base)} − (${n(tr.penalty)}) = <output id="reward-number">${n(tr.output)}</output></p>`)}</div><p class="lesson-warning">${say('signed',zh)}</p>${result('reward-output',tr.output,zh)}<p class="fineprint">${say('precision',zh)}</p>`;
}
export function renderAdvantages(tr,step=0,zh=false){
 if(!tr.rewards.length)return `<p class="lesson-warning">${say('empty',zh)}</p>${result('advantages-output',[],zh)}`;
 const suffix=tr.rewards.slice(step).map(x=>'('+n(x)+')').join(' + ');
 return `<h4>${say('timeline',zh)}</h4><div class="r13-timeline">${tr.rewards.map((r,t)=>`<div class="r13-turn ${t<step?'r13-pending':'r13-included'}${t===step?' r13-inspected':''}"><small>t${t}</small><strong>${n(r)}</strong><span>${say(t<step?'excluded':'included',zh)}</span></div>`).join('')}</div><p class="fineprint">${say('reverse',zh)}: ${tr.rewards.map((_,t)=>'t'+t).reverse().join(' → ')}</p>${card('<span>'+say('inspect',zh)+'</span>: t'+step,`<p class="r13-number">G[${step}] = ${suffix} = ${n(tr.returns[step])}</p><p>${say('subtract',zh)}</p><p class="r13-number">A[${step}] = ${n(tr.returns[step])} − (${n(tr.values[step])}) = <output id="advantage-number">${n(tr.output[step])}</output></p>`)}${table(['t',say('reward',zh),say('returns',zh),say('baseline',zh),say('advantage',zh)],tr.rewards.map((r,t)=>['t'+t,r,tr.returns[t],tr.values[t],tr.output[t]]),say('calculations',zh))}<p class="fineprint">${say('baselineNote',zh)}</p>${result('advantages-output',tr.output,zh)}<p class="fineprint">${say('precision',zh)}</p>`;
}
