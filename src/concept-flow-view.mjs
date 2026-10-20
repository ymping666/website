import {flowTrace} from './lesson-round4-math.mjs';
import {formatNumber as f} from './lesson-math.mjs';
import {mathExpression,mathMarkup,escapeMath as e} from './math-expression.mjs';

export const flowConceptTranslations={};
const t=(en,zh)=>{flowConceptTranslations[en]=zh;return en;};
const words={
 axis:t('One fixed endpoint pair, not a learned trajectory','一对固定端点的条件路径，并非模型生成轨迹'),
 legend:t('Blue: source x₀ = 0. Purple: target x₁ = 10. Green: current interpolated point xₜ. The vertical marker keeps overlapping endpoints readable.','蓝色：源端点 x₀ = 0。紫色：目标端点 x₁ = 10。绿色：当前插值点 xₜ。竖向标记让端点重合时仍能看清位置。'),
 source:t('Source contribution','源端点的贡献'),target:t('Target contribution','目标端点的贡献'),point:t('Current position','当前位置'),velocity:t('Conditional target velocity','条件目标速度'),
 fixed:t('The velocity is 10 for every t because these endpoints stay fixed. Position changes with time; its derivative does not.','这对端点固定，所以任意 t 下条件目标速度都是 10。位置随时间变化，导数不变。'),
 time:t('Time t, from 0 to 1','时间 t，范围 0 到 1'),reset:t('Reset to t = 0.3','重置到 t = 0.3')
};
const say=(key,zh)=>zh?flowConceptTranslations[words[key]]:words[key];
export const conceptEquation=source=>mathMarkup(mathExpression(source),source,true);
export function conceptFlowTrace(time=.3){
 if(typeof time!=='number'||!Number.isFinite(time)||time<0||time>1)throw new RangeError('Time must be in [0,1]');
 return flowTrace([0],[10],time);
}
export function renderConceptFlow(time=.3,zh=false){
 const tr=conceptFlowTrace(time),n=f(tr.output[0]),pos=80+time*440;
 return `<figure class="cf-figure"><figcaption>${say('axis',zh)}</figcaption><svg viewBox="0 0 600 142" role="img" aria-label="${e(say('axis',zh))}"><line x1="80" y1="83" x2="520" y2="83" stroke="#b4c5bd" stroke-width="3"/><line x1="80" y1="83" x2="${pos}" y2="83" stroke="#147d64" stroke-width="5"/><circle cx="80" cy="83" r="7" fill="#526fae"/><circle cx="520" cy="83" r="7" fill="#8056b3"/><line x1="${pos}" y1="61" x2="${pos}" y2="93" stroke="#147d64" stroke-width="2"/><circle data-cf-point cx="${pos}" cy="61" r="7" fill="#147d64"/><text x="${pos}" y="39" text-anchor="middle">xₜ = ${n}</text><text x="80" y="121" text-anchor="middle">x₀ = 0</text><text x="520" y="121" text-anchor="middle">x₁ = 10</text></svg><p class="fineprint">${say('legend',zh)}</p></figure><dl class="cf-values"><div><dt>${say('source',zh)}</dt><dd>(1 − ${f(time)}) × 0 = ${f(tr.sourcePart[0])}</dd></div><div><dt>${say('target',zh)}</dt><dd>${f(time)} × 10 = ${f(tr.targetPart[0])}</dd></div><div><dt>${say('point',zh)}</dt><dd>xₜ = ${f(tr.sourcePart[0])} + ${f(tr.targetPart[0])} = <output id="cf-position">${n}</output></dd></div><div><dt>${say('velocity',zh)}</dt><dd>uₜ = 10 − 0 = <output id="cf-velocity">10</output></dd></div></dl><p>${say('fixed',zh)}</p>`;
}
export function conceptFlowExperiment(){return `<div class="lesson-experiment cf-experiment" data-concept-flow><div class="lesson-controls"><label for="cf-time">${words.time} <output id="cf-time-value">0.3</output><input id="cf-time" type="range" min="0" max="1" step="0.01" value="0.3" disabled></label><button class="button outline small" type="button" id="cf-reset" disabled>${words.reset}</button></div><div id="cf-view">${renderConceptFlow()}</div><noscript><p>${t('The default example remains fully readable: t = 0.3 gives xₜ = 3 and uₜ = 10. Enable JavaScript to change time.','默认例子无需脚本即可阅读：t = 0.3 时 xₜ = 3，uₜ = 10。启用 JavaScript 后可以拖动时间滑块。')}</p></noscript></div>`;}
// Register fallback-only translations before the localization dictionary is loaded.
conceptFlowExperiment();
