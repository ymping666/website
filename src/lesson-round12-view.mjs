import {formatNumber as f} from './lesson-math.mjs';
export const round12Translations={};
export const t=(en,zh)=>{round12Translations[en]=zh;return en;};
export const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const L={
 modelA:t('Model A','模型 A'),modelB:t('Model B','模型 B'),inputs:t('Inputs and standard deviations','输入及标准差'),probabilities:t('Probabilities by time step','逐时间步的概率'),
 action:t('Action','动作'),truth:t('True cost','真实代价'),prediction:t('Predicted cost','预测代价'),error:t('Squared error','平方误差'),selected:t('Chosen action','选中动作'),best:t('Lowest true cost','最低真实代价'),
 choose:t('1 · Choose by predicted cost','1 · 按预测代价选动作'),execute:t('2 · Look up its true cost','2 · 查找该动作的真实代价'),regret:t('3 · Subtract the true optimum','3 · 减去真实最优代价'),
 mse:t('Average over all actions','对全部动作取平均'),lowerMse:t('Lower forecast MSE','预测 MSE 更低'),lowerRegret:t('Lower planning regret','规划 regret 更低'),tie:t('Tie','平局'),
 legend:t('Chosen action marks the action this model would execute. The true optimum is shown separately; lower cost is better.','“选中动作”表示该模型会执行的动作。真实最优值单独展示；代价越低越好。'),
 precision:t('Tables and diagrams show up to 6 decimals; function output retains full numeric values. Choices and comparisons use unrounded values.','表格与图示最多显示 6 位小数；函数输出保留完整数值。选择与比较使用未舍入值。'),
 output:t('Function output','函数输出'),mean:t('Mean cost','平均代价'),variance:t('Variance','方差'),std:t('Standard deviation','标准差'),penalty:t('Risk penalty','风险惩罚'),score:t('Selection score','选择分数'),
 curve:t('How each action’s score changes with risk weight','各动作的选择分数随风险权重的变化'),weight:t('Risk weight λ','风险权重 λ'),
 curveNote:t('Each line uses mean + λ × standard deviation. The dashed vertical line marks the current weight. Line crossings are possible choice boundaries, not measured outcomes.','每条线为“均值 + λ × 标准差”。竖虚线标记当前权重；线的交点可能是选择边界，不是真实结果测量值。'),
 noActions:t('No actions: return None. There is no score or selected action.','没有动作：返回 None，没有可计算的分数或选中动作。'),
 candidate:t('Candidate','候选序列'),cost:t('Cost','代价'),elite:t('Elite','精英'),other:t('Not elite','未入选'),
 pick:t('1 · Rank whole sequences by cost','1 · 按整条序列的代价排序'),count:t('2 · Count actions at the inspected time step','2 · 统计当前时间步的动作次数'),fit:t('3 · Fit a separate distribution at each time step','3 · 每个时间步单独拟合分布'),
 counts:t('Elite count for this action','精英中的出现次数'),prob:t('Probability = count / elite count','概率 = 次数 / 精英数量'),time:t('Time step','时间步'),rank:t('Ranking (original candidate indices)','排序结果（原始候选索引）'),
 emptyH:t('The horizon is zero. There are still ranked candidates, but no time-step distributions; return [].','时域长度为零。仍可对候选排序，但没有时间步分布，返回 []。'),
 total:t('Probability sum','概率之和'),eliteIds:t('Selected elite indices','选中的精英索引'),
 ties:t('Equal costs keep original candidate order. Highlighted rows are elites; the outlined column is the inspected time step.','代价相同则保留原始候选顺序。高亮行为精英；描边列为当前查看的时间步。'),
 marginals:t('These are per-time-step marginals. Sampling them independently can create an action sequence absent from the elite set. No smoothing is applied here.','这是逐时间步的边缘分布。独立采样可能得到精英集合中从未出现的动作组合。本题不做平滑。')
};
const say=(k,zh)=>zh?round12Translations[L[k]]:L[k];
const table=(heads,rows,caption)=>`<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="${esc(caption)}"><table class="lesson-table r12-table"><caption>${esc(caption)}</caption><thead><tr>${heads.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const td=x=>`<td>${typeof x==='number'?f(x):esc(x)}</td>`;
const json=x=>esc(JSON.stringify(x,null,2));
const result=(id,value,zh)=>`<h4>${say('output',zh)}</h4><pre class="r12-output" id="${id}">${value===null?'None':json(value)}</pre>`;
export function renderForecast(tr,zh=false){
 const model=(key,label)=>{
  const m=tr[key];
  return `<section class="r12-model"><h4>${say('model'+label,zh)}</h4>${table([say('action',zh),say('truth',zh),say('prediction',zh),say('error',zh)],tr.actions.map((a,i)=>`<tr${a===m.chosen?' class="r12-picked"':''}>${td(a+(a===m.chosen?' · '+say('selected',zh):''))}${td(tr.truth[a])}${td(m.pred[a])}${td(m.errors[i])}</tr>`),say('model'+label,zh))}<p><span>${say('mse',zh)}</span><br><strong>MSE = (${m.errors.map(f).join(' + ')}) / ${tr.actions.length} = ${f(m.mse)}</strong></p><ol class="r12-decision"><li><span>${say('choose',zh)}</span><strong>${esc(m.chosen)}</strong></li><li><span>${say('execute',zh)}</span><strong>${f(m.actual)}</strong></li><li><span>${say('regret',zh)}</span><strong>regret = ${f(m.actual)} − (${f(tr.best)}) = ${f(m.regret)}</strong></li></ol></section>`;
 };
 const win=value=>value==='tie'?say('tie',zh):value;
 return `<p>${say('best',zh)}: <strong>${f(tr.best)}</strong></p><p class="fineprint">${say('legend',zh)}</p><div class="r12-models">${model('a','A')}${model('b','B')}</div><div class="r12-verdict" role="status"><p>${say('lowerMse',zh)}: <strong id="forecast-mse-winner">${win(tr.output.lower_mse)}</strong></p><p>${say('lowerRegret',zh)}: <strong id="forecast-regret-winner">${win(tr.output.lower_regret)}</strong></p></div>${result('forecast-output',tr.output,zh)}<p class="fineprint">${say('precision',zh)}</p>`;
}
const colors=['#147d73','#7950b6','#bd5b1e'];
function riskPlot(tr,zh){
 const low=Math.min(0,...tr.rows.map(r=>r.mean)),high=Math.max(1,...tr.rows.map(r=>r.mean+3*r.std)),span=high-low||1;
 const x=w=>58+w/3*448,y=s=>208-(s-low)/span*174;
 return `<figure class="r12-plot"><figcaption>${say('curve',zh)}</figcaption><svg viewBox="0 0 550 270" role="img" aria-label="${esc(say('curve',zh))}"><title>${say('curve',zh)}</title>${[0,0.5,1,2,3].map(w=>`<path class="r12-grid" d="M${x(w)} 34V208"/><text x="${x(w)}" y="230" text-anchor="middle">${f(w)}</text>`).join('')}${[low,(low+high)/2,high].map(v=>`<path class="r12-grid" d="M58 ${y(v)}H506"/><text x="50" y="${y(v)+4}" text-anchor="end">${f(v)}</text>`).join('')}<path class="r12-current" d="M${x(tr.weight)} 28V213"/>${tr.rows.map((r,i)=>`<path stroke="${colors[i%3]}" stroke-width="3" fill="none" d="M58 ${y(r.mean)}L506 ${y(r.mean+3*r.std)}"/><circle cx="${x(tr.weight)}" cy="${y(r.score)}" r="${r.action===tr.output?6:4}" fill="${colors[i%3]}" stroke="white" stroke-width="2"/>`).join('')}<text x="282" y="257" text-anchor="middle">${say('weight',zh)}</text></svg><div class="r12-legend">${tr.rows.map((r,i)=>`<span style="--r12-color:${colors[i%3]}">${esc(r.action)}</span>`).join('')}</div><p class="fineprint">${say('curveNote',zh)}</p></figure>`;
}
export function renderRisk(tr,zh=false){
 if(!tr.rows.length)return `<p class="lesson-warning">${say('noActions',zh)}</p>${result('risk-output',tr.output,zh)}`;
 return `${riskPlot(tr,zh)}${table([say('action',zh),say('mean',zh),say('variance',zh),say('std',zh)],tr.rows.map(r=>`<tr${r.action===tr.output?' class="r12-picked"':''}>${td(r.action)}${td(r.mean)}${td(r.variance)}${td(r.std)}</tr>`),say('inputs',zh))}<div class="r12-risk-cards">${tr.rows.map((r,i)=>`<section class="r12-risk-card${r.action===tr.output?' r12-picked':''}" style="--r12-color:${colors[i%3]}"><h4>${esc(r.action)}${r.action===tr.output?' · '+say('selected',zh):''}</h4><div class="r12-sum"><div><small>${say('mean',zh)}</small><strong>${f(r.mean)}</strong></div><b>+</b><div><small>${say('penalty',zh)}</small><strong>${f(tr.weight)} × ${f(r.std)} = ${f(r.penalty)}</strong></div><b>=</b><div><small>${say('score',zh)}</small><strong>${f(r.score)}</strong></div></div></section>`).join('')}</div><p role="status">${say('selected',zh)}: <strong id="risk-choice">${esc(tr.output)}</strong></p>${result('risk-output',tr.output,zh)}<p class="fineprint">${say('precision',zh)}</p>`;
}
export function renderCem(tr,step=0,zh=false){
 const h=tr.counts.length;
 const grid=table([say('candidate',zh),say('cost',zh),say('elite',zh),...Array.from({length:h},(_,i)=>'t'+i)],tr.candidates.map((row,i)=>`<tr${tr.elites.includes(i)?' class="r12-picked"':''}>${td(i)}${td(tr.costs[i])}${td(tr.elites.includes(i)?say('elite',zh):say('other',zh))}${row.map((a,t)=>`<td${t===step?' class="r12-column"':''}><span class="r12-action" style="--r12-color:${colors[a%3]}">${a}</span></td>`).join('')}</tr>`),say('pick',zh));
 const selected=h?table([say('action',zh),say('counts',zh),say('prob',zh)],tr.counts[step].map((count,a)=>`<tr>${td(a)}${td(count)}<td>${count} / ${tr.eliteCount} = ${f(tr.output[step][a])}<span class="r12-prob-track" aria-hidden="true"><span style="width:${100*count/tr.eliteCount}%;background:${colors[a%3]}"></span></span></td></tr>`),say('count',zh)):`<p class="lesson-warning">${say('emptyH',zh)}</p>`;
 return `<p class="fineprint">${say('ties',zh)}</p>${grid}<p>${say('rank',zh)}: <samp>${tr.ranked.join(' → ')}</samp></p><p>${say('eliteIds',zh)}: <samp id="cem-elites">[${tr.elites.join(', ')}]</samp></p>${selected}${h?`<h4>${say('fit',zh)}</h4>${table([say('time',zh),...Array.from({length:tr.nActions},(_,a)=>'P('+a+')'),say('total',zh)],tr.output.map((row,t)=>`<tr${t===step?' class="r12-picked"':''}>${td('t'+t)}${row.map(td).join('')}${td(row.reduce((s,p)=>s+p,0))}</tr>`),say('probabilities',zh))}`:''}<p class="fineprint">${say('marginals',zh)}</p>${result('cem-output',tr.output,zh)}<p class="fineprint">${say('precision',zh)}</p>`;
}
