import {kalmanTrace} from './lesson-round18-math.mjs';
import {formatNumber as f} from './lesson-math.mjs';
import {conceptEquation} from './concept-flow-view.mjs';
import {escapeMath as e} from './math-expression.mjs';
export const stateViewTranslations={};
const t=(en,zh)=>{stateViewTranslations[en]=zh;return en;};
const words={
 custom:t('Custom values','自定义数值'),preset:t('Choose an uncertainty example','选择不确定性示例'),reset:t('Reset the measurement example','重置观测示例'),
 p:t('Predicted variance P','预测方差 P'),r:t('Sensor noise variance R','传感器噪声方差 R'),z:t('Observation z','观测值 z'),
 prior:t('Predicted mean μ','预测均值 μ'),observation:t('Sensor reading z','传感器读数 z'),posterior:t('Corrected mean μ⁺','校正后的均值 μ⁺'),
 figure:t('Three positions on the same scale','同一尺度上的三个位置'),legend:t('Blue: predicted mean. Purple: observation. Green: corrected mean. Dots show positions, not uncertainty widths. The true position is not supplied.','蓝色：预测均值；紫色：观测读数；绿色：校正均值。圆点表示位置，不表示不确定性的宽度。这里没有提供真实位置。'),
 weightTitle:t('How the two inputs are weighted','两个输入如何加权'),priorWeight:t('Weight of predicted mean: 1 − K','预测均值的权重：1 − K'),sensorWeight:t('Weight of observation: K','观测的权重：K'),
 gain:t('Observation weight K','观测权重 K'),innovation:t('Innovation: observation minus prediction','新息：观测减预测'),correction:t('Correction applied to the mean','施加到均值上的修正'),variance:t('Corrected variance P⁺','校正后的方差 P⁺'),
 valid:t('A defined scalar measurement update','可计算的标量观测更新'),invalid:t('Outside the exercise contract','超出练习契约'),zero:t('P + R = 0, so the gain would divide by zero. No updated mean or variance is defined by this rule. Increase either variance or reset the example.','P + R = 0，增益会除以零。这个规则无法给出更新后的均值或方差。请增大任一方差，或重置示例。'),
 fixed:t('The predicted mean stays at 10. P and R are variances; change one at a time to compare its effect. These are supplied numbers, not live sensor data.','预测均值固定为 10。P、R 都是方差；每次只调整一个，更容易比较其影响。这些是给定数值，不是实时传感器数据。'),
 nojs:t('Without JavaScript, the complete default example remains visible: P = R = 4 and z = 14 give K = 0.5, corrected mean 12 and corrected variance 2. Enable JavaScript to change the supplied values.','不启用 JavaScript 也可阅读完整默认示例：P = R = 4、z = 14 时，K = 0.5，校正均值为 12、方差为 2。启用后可以调整给定数值。'),
 noCorrection:t('K = 0: this model treats the prior state as certain and leaves its mean unchanged. This is an assumption, not proof that the sensor is wrong.','K = 0：模型认为先验状态已确定，因此不改变均值。这是建模假设，不证明传感器出错。'),
 exactSensor:t('K = 1: zero sensor variance makes the corrected mean equal to the reading. A real sensor is not made error-free by setting R to zero.','K = 1：传感器方差为零，使校正均值等于读数。把 R 设为零，并不会让真实传感器变得无误差。'),
 mixed:t('Between the two inputs: μ⁺ = (1 − K)μ + Kz. A positive innovation shifts right; a negative innovation shifts left.','在两个输入之间加权：μ⁺ = (1 − K)μ + Kz。正新息使估计右移，负新息使估计左移。')
};
export const statePresets={
 balanced:{label:t('Balanced prior and sensor','先验与传感器同等权重'),p:4,r:4,z:14},
 noisy:{label:t('High sensor-noise variance','传感器噪声方差较大'),p:4,r:16,z:14},
 precise:{label:t('More precise sensor','更精确的传感器'),p:4,r:1,z:14},
 left:{label:t('Observation below prediction','观测小于预测'),p:4,r:4,z:6},
 priorCertain:{label:t('Prior variance is zero','先验方差为零'),p:0,r:4,z:14},
 sensorCertain:{label:t('Sensor variance is zero','传感器方差为零'),p:4,r:0,z:14},
 invalid:{label:t('Invalid: P and R are both zero','无效：P 与 R 同时为零'),p:0,r:0,z:14}
};
const say=(key,zh)=>zh?stateViewTranslations[words[key]]:words[key];
export function stateCorrection(p=4,r=4,z=14){
 if([p,r,z].some(n=>typeof n!=='number'||!Number.isFinite(n))||p<0||r<0||p>16||r>16||z<6||z>14)throw new RangeError('Invalid teaching controls');
 return {p,r,z,error:p+r===0,trace:p+r===0?null:kalmanTrace(10,p,z,r)};
}
export function renderStateCorrection(p=4,r=4,z=14,zh=false){
 const s=k=>say(k,zh),result=stateCorrection(p,r,z),tr=result.trace;
 if(result.error)return `<div class="cs-status cs-invalid" role="status" aria-live="polite" aria-atomic="true" data-cs-error><strong>${s('invalid')}</strong><p>${s('zero')}</p></div>`;
 const position=(key,value,color)=>`<div class="cs-position-row"><div><span>${s(key)}</span><output ${key==='posterior'?'id="cs-mean"':''}>${f(value)}</output></div><div class="cs-position-track" aria-hidden="true"><i class="${color}" style="left:${(value-6)/8*100}%"></i></div></div>`;
 const stat=(title,formula,id,value)=>`<div><dt>${s(title)}</dt><dd>${conceptEquation(formula)}<span>=</span><output id="${id}">${f(value)}</output></dd></div>`;
 return `<div class="cs-status" role="status" aria-live="polite"><span>${s('valid')}</span>: <span>μ⁺ = ${f(tr.updatedMean)}, P⁺ = ${f(tr.updatedVariance)}</span></div><figure class="cf-figure cs-figure"><figcaption>${s('figure')}</figcaption>${position('prior',10,'cs-prior')}${position('observation',z,'cs-sensor')}${position('posterior',tr.updatedMean,'cs-posterior')}<div class="cs-axis-labels" aria-hidden="true"><span>6</span><span>10</span><span>14</span></div><p class="fineprint">${s('legend')}</p></figure><figure class="cf-figure"><figcaption>${s('weightTitle')}</figcaption><div class="cs-weight-track" aria-hidden="true"><span class="cs-prior" style="width:${(1-tr.gain)*100}%"></span><span class="cs-sensor" style="width:${tr.gain*100}%"></span></div><div class="cs-weight-labels"><p><span>${s('priorWeight')}</span>: <strong>${f((1-tr.gain)*100)}%</strong></p><p><span>${s('sensorWeight')}</span>: <strong>${f(tr.gain*100)}%</strong></p></div></figure><dl class="cf-values cs-values">${stat('gain',`K = ${p}/(${p}+${r})`,'cs-gain',tr.gain)}${stat('innovation',`z-mu = ${z}-10`,'cs-innovation',tr.innovation)}${stat('correction','K*(z-mu)','cs-correction',tr.correction)}${stat('posterior','mu_next = mu+K*(z-mu)','cs-updated',tr.updatedMean)}${stat('variance',`P_next = (1-K)*${p}`,'cs-variance',tr.updatedVariance)}</dl><p class="cf-note">${s(tr.gain===0?'noCorrection':tr.gain===1?'exactSensor':'mixed')}</p>`;
}
export function conceptStateExperiment(){
 const range=(key,min,max,value)=>`<label for="cs-${key}"><span>${words[key]}</span>: <output id="cs-${key}-value">${value}</output><input id="cs-${key}" type="range" min="${min}" max="${max}" step="1" value="${value}" disabled></label>`;
 return `<div class="lesson-experiment cf-experiment cs-experiment" data-concept-state><div class="lesson-controls"><label for="cs-preset"><span>${words.preset}</span><select id="cs-preset" disabled>${Object.entries(statePresets).map(([key,preset])=>`<option value="${key}" ${key==='balanced'?'selected':''}>${e(preset.label)}</option>`).join('')}<option value="custom" disabled>${words.custom}</option></select></label><button class="button outline small" id="cs-reset" type="button" disabled>${words.reset}</button></div><p class="fineprint">${words.fixed}</p><div class="cs-controls">${range('p',0,16,4)}${range('r',0,16,4)}${range('z',6,14,14)}</div><div id="cs-view">${renderStateCorrection()}</div><noscript><p>${words.nojs}</p></noscript></div>`;
}
conceptStateExperiment();
