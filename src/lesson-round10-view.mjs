import {formatNumber as f,formatVector as vector} from './lesson-math.mjs';
export const round10Translations={};
export const t=(en,zh)=>{round10Translations[en]=zh;return en;};
const labels={
  breakdown:t('Signed contributions, coordinate by coordinate','逐坐标查看带符号的贡献'),
  legend:t('Purple: first contribution. Orange: second contribution, added from the end of the first. Green: their sum. A leftward segment is negative; all rows share one scale.','紫色：第一项；橙色：从第一项末端接着相加的第二项；绿色：两项之和。向左的线段表示负值，各行共用同一尺度。'),
  empty:t('Empty vectors have no coordinates to draw. The function returns a new empty list.','空向量没有可绘制的坐标，函数返回新的空列表。'),
  steps:t('Numerical walkthrough','数值计算过程'),output:t('Function output','函数输出'),
  gain:t('Noise-error amplification factor','噪声预测误差放大系数'),
  weights:t('Posterior coefficients','后验系数'),variance:t('Posterior variance (context only)','后验方差（仅辅助理解）'),
  density:t('First-coordinate posterior: relative density','第一个坐标的后验：相对密度'),
  densityNote:t('This Gaussian is conditioned on the supplied x₀ and xₜ. Height is scaled to a peak of 1, not probability. The green line is its mean; dashed lines mark mean ± one standard deviation. The function returns only the mean, and draws no random sample.','这个高斯分布以给定的 x₀ 和 xₜ 为条件。高度缩放为峰值 1，不表示概率。绿线表示均值，虚线标出均值左右一个标准差。函数只返回均值，不抽取随机样本。'),
  identity:t('Equal noise levels: the update is the identity up to floating-point rounding.','噪声水平相同：更新等于原输入，允许浮点舍入误差。'),
  endpoint:t('Target cumulative alpha is 1: the output is the reconstructed clean estimate.','目标累积 α 为 1：输出就是重建的干净样本估计。'),
  remix:t('The same predicted noise is reused with a smaller noise coefficient. No fresh noise is injected.','复用同一个预测噪声，降低其混合系数，不注入新的噪声。'),
  subtract:t('Subtract predicted noise','减去预测噪声'),clean:t('Clean contribution','干净样本贡献'),noise:t('Noise contribution','噪声贡献'),mean:t('Posterior mean','后验均值'),error:t('Estimation error','估计误差'),scaled:t('Scaled clean estimate','缩放后的干净样本估计'),input:t('Noisy input','带噪输入'),negative:t('Negative predicted-noise term','预测噪声项的相反数'),
  reconstruction:t('From noisy input to the clean estimate','从带噪输入到重建结果'),
  route:t('Subtract the predicted-noise term, then divide by the signal coefficient. Follow each coordinate from left to right; on a phone, read from top to bottom.','先减去预测噪声项，再除以信号系数。每个坐标从左到右读，手机上从上到下读。'),
  coordinate:t('Vector coordinate','向量坐标'),remove:t('Subtract the noise term','减去噪声项'),remaining:t('Remaining value','剩余数值'),undo:t('Undo the signal scaling','还原信号尺度'),divide:t('Divide by the signal coefficient','除以信号系数'),result:t('Reconstructed estimate','重建结果'),
  intermediate:t('The value after subtraction is an intermediate result. Only the last card is the function’s clean-sample estimate.','减完噪声只是中间结果，最后一格才是函数返回的干净样本估计。'),
  details:t('Show the full numerical table','展开逐项数值表'),
  known:t('Known clean value in this demo','演示中的已知原样本值'),
  errorNote:t('The last card shows an estimate. If the noise prediction is wrong, it can differ from the known clean value.','最后一格是估计值，噪声预测不准时，它可能与已知原样本值不同。')
};
const say=(k,zh)=>zh?round10Translations[labels[k]]:labels[k];
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const table=(headers,rows,zh)=>`<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="${say('steps',zh)}"><table class="lesson-table"><thead><tr>${headers.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td><code>${typeof x==='number'?f(x):esc(x)}</code></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function contributions(rows,first,second,zh){
  if(!rows.length)return `<p>${say('empty',zh)}</p>`;
  const bound=Math.max(1,...rows.flatMap(r=>[Math.abs(r[0]),Math.abs(r[0]+r[1])])),px=x=>300+x*200/bound;
  return `<figure class="r7-chart" tabindex="0"><figcaption>${say('breakdown',zh)}</figcaption><svg viewBox="0 0 580 ${65+rows.length*92}" role="img" aria-label="${say('breakdown',zh)}">${[-bound,0,bound].map(x=>`<text x="${px(x)}" y="22" text-anchor="middle">${f(x)}</text>`).join('')}${rows.map(([a,b],i)=>{const y=58+i*92;return `<line x1="100" x2="500" y1="${y}" y2="${y}" stroke="#dce5e0"/><line x1="${px(0)}" x2="${px(a)}" y1="${y-6}" y2="${y-6}" stroke="#8558ad" stroke-width="7"/><line x1="${px(a)}" x2="${px(a+b)}" y1="${y+6}" y2="${y+6}" stroke="#b35c1e" stroke-width="7"/><circle cx="${px(a+b)}" cy="${y}" r="5" fill="#147d64"/><text x="18" y="${y+5}">[${i}]</text><text x="100" y="${y+38}">${f(a)} + (${f(b)}) = ${f(a+b)}</text>`;}).join('')}</svg><p class="fineprint"><span>${esc(first)}</span> + <span>${esc(second)}</span></p></figure><p class="fineprint">${say('legend',zh)}</p>`;
}
const output=(values)=>`<p role="status"><output id="diffusion-output">${vector(values)}</output></p>`;
function reconstructionSteps(tr,zh){
  if(!tr.rows.length)return `<p>${say('empty',zh)}</p>`;
  const arrow='<span class="r10-process-arrow" aria-hidden="true"></span>';
  const card=(step,label,value,note,extra='')=>`<div class="r10-process-card ${extra}"><span class="r10-process-label"><b>${step}</b> ${say(label,zh)}</span><strong class="r10-process-value">${value}</strong>${note||''}</div>`;
  return `<section class="r10-reconstruction" aria-label="${say('reconstruction',zh)}"><h4>${say('reconstruction',zh)}</h4><p>${say('route',zh)}</p>${tr.rows.map(r=>`<section class="r10-coordinate" aria-label="${say('coordinate',zh)} ${r.i}"><h5><span>${say('coordinate',zh)}</span> [${r.i}]</h5><div class="r10-process">${card(1,'input',f(r.xt),'')}${arrow}${card(2,'remove',`− (${f(r.removed)})`,`<span class="r10-process-note"><span>${say('remaining',zh)}</span>: <strong data-reconstruction-residual="${r.i}">${f(r.residual)}</strong></span>`)}${arrow}${card(3,'undo',`÷ ${f(tr.signalScale)}`,`<span class="r10-process-note">${say('divide',zh)}</span>`)}${arrow}${card(4,'result',`<output data-reconstruction-result="${r.i}">${f(r.estimate)}</output>`,'','r10-process-result')}</div><p class="fineprint"><span>${say('known',zh)}</span>: ${f(r.x0)}; <span>${say('error',zh)}</span>: ${f(r.error)}</p></section>`).join('')}<p class="r10-process-explanation">${say('intermediate',zh)}</p><p class="fineprint">${say('errorNote',zh)}</p></section>`;
}
export function renderReconstruction(tr,zh=false){
  return `${reconstructionSteps(tr,zh)}<details class="r10-numerical-details"><summary>${say('details',zh)}</summary>${table(['i','x₀','ε','ε̂','xₜ',say('subtract',zh),say('scaled',zh),'x̂₀',say('error',zh)],tr.rows.map(r=>[r.i,r.x0,r.eps,r.hat,r.xt,r.removed,r.residual,r.estimate,r.error]),zh)}</details><p><span>${say('gain',zh)}</span>: <strong>${f(tr.gain)}</strong></p><p><span>${say('output',zh)}</span> x̂₀</p>${output(tr.output)}`;
}
export function renderPosterior(tr,zh=false){
  let density='';
  if(tr.rows.length){
    const mu=tr.rows[0].mean,sd=tr.sd,px=z=>290+z*52,py=z=>192-140*Math.exp(-z*z/2),points=Array.from({length:81},(_,i)=>{const z=-4+i/10;return `${px(z)},${py(z)}`;}).join(' ');
    density=`<figure class="r7-chart" tabindex="0"><figcaption>${say('density',zh)}</figcaption><svg viewBox="0 0 580 270" role="img" aria-label="${say('density',zh)}"><line x1="82" x2="498" y1="192" y2="192" stroke="#dce5e0"/><polyline points="${points}" fill="none" stroke="#8558ad" stroke-width="3"/>${[-1,0,1].map(z=>`<line x1="${px(z)}" x2="${px(z)}" y1="${z===0?45:65}" y2="192" stroke="${z===0?'#147d64':'#99a4a2'}" ${z===0?'stroke-width="2"':'stroke-dasharray="4 4"'}/><text x="${px(z)}" y="${z===0?248:222}" text-anchor="${z<0?'end':z>0?'start':'middle'}">${f(mu+z*sd)}</text>`).join('')}</svg></figure><p class="fineprint">${say('densityNote',zh)}</p>`;
  }
  return `<p>ᾱₜ = ${f(tr.current)}; βₜ = ${f(tr.beta)}</p><p><span>${say('weights',zh)}</span>: c₀ = ${f(tr.c0)}, cₜ = ${f(tr.ct)}; c₀ + cₜ = ${f(tr.c0+tr.ct)}</p>${contributions(tr.rows.map(r=>[r.clean,r.noisy]),'c₀ x₀','cₜ xₜ',zh)}${table(['i','x₀','xₜ',say('clean',zh),'cₜ xₜ',say('mean',zh)],tr.rows.map(r=>[r.i,r.x0,r.xt,r.clean,r.noisy,r.mean]),zh)}${density}<p><span>${say('variance',zh)}</span>: ${f(tr.variance)}</p><p><span>${say('output',zh)}</span></p>${output(tr.output)}`;
}
export function renderDDIM(tr,zh=false){
  return `<p>ᾱₜ = ${f(tr.current)} → ᾱₚᵣₑᵥ = ${f(tr.prev)}</p>${contributions(tr.rows.map(r=>[r.clean,r.noise]),say('clean',zh),say('noise',zh),zh)}${table(['i','xₜ','ε̂','x̂₀',say('clean',zh),say('noise',zh),'xₚᵣₑᵥ'],tr.rows.map(r=>[r.i,r.xt,r.eps,r.estimate,r.clean,r.noise,r.after]),zh)}<p class="lesson-warning">${say(tr.current===tr.prev?'identity':tr.prev===1?'endpoint':'remix',zh)}</p><p><span>${say('output',zh)}</span> xₚᵣₑᵥ</p>${output(tr.output)}`;
}
