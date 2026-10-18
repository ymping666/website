import {formatNumber as f} from './lesson-math.mjs';
import {calcNode,calcLine,calcStep,calcStory,calcCarry,calcContext,calcValue,calcRoot,calcEqual} from './lesson-calculation-view.mjs';
export const round16Translations={};
export const t=(en,zh)=>{round16Translations[en]=zh;return en;};
export const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const n=v=>v!==0&&Math.abs(v)<1e-5?v.toExponential(3):f(v);
const L={
 input:t('Given feature vector','给定特征向量'),square:t('1 · Square each input','1 · 各输入分别平方'),meanSquare:t('2 · Average the squares','2 · 对平方值取均值'),
 divisor:t('3 · Shared positive divisor','3 · 共用的正除数'),raw:t('Selected input channel','选中的输入通道'),normalized:t('Normalized channel value','归一化后的通道值'),
 gain:t('Apply this channel’s gain','应用该通道的 gain'),output:t('Component output','组件输出'),rmsTable:t('RMS normalization followed by channel gain','先做 RMS 归一化，再应用通道增益'),
 rmsNote:t('No mean is subtracted. Every channel shares the same divisor, while its gain is applied only afterward.','这里不减均值；各通道共用同一除数，之后才分别应用各自的 gain。'),
 mean:t('Feature mean','特征均值'),variance:t('Population variance','总体方差'),lnDivisor:t('LayerNorm divisor','LayerNorm 除数'),
 normalize:t('1 · Call the supplied normalize function','1 · 调用给定的 normalize 函数'),sublayer:t('2 · Call the supplied sublayer function','2 · 调用给定的 sublayer 函数'),
 bypass:t('Unchanged residual path','保持原样的残差旁路'),merge:t('Add original x to the branch result','将原始 x 与分支结果相加'),
 normInput:t('Function input','函数输入'),normOutput:t('Function output','函数输出'),calls:t('Actual helper call order','辅助函数的实际调用顺序'),
 empty:t('The vector is empty. Both supplied functions are still called once, and the output is [].','向量为空时，仍各调用一次给定函数，输出为 []。'),
 residualTable:t('Original input, transformed branch and sum','原始输入、变换分支与求和'),
 ln:t('1 · Normalize over this token’s features','1 · 沿当前 token 的特征维归一化'),factor:t('2 · Multiply by 1 + scale','2 · 乘以 1 + scale'),shift:t('3 · Add the supplied shift','3 · 加上给定 shift'),
 factorValue:t('Selected channel multiplier','所选通道的乘数'),affine:t('Selected channel: scale, then shift','所选通道：先缩放，再平移'),
 modulationTable:t('Per-channel AdaLN modulation','AdaLN 逐通道调制'),
 condNote:t('Zero scale and shift return LayerNorm(x), not the original x. A scale of −1 instead removes that channel’s normalized term.','scale 与 shift 均为 0 时返回 LayerNorm(x)，不是原始 x；scale 为 −1 时才会消去该通道的归一化项。'),
 block:t('Given block output','给定的 block 输出'),gate:t('Given channel gates','给定通道门值'),update:t('Gated update branch','经过 gate 的更新分支'),
 multiply:t('Multiply block output, not the bypass','乘在 block 输出上，不乘旁路'),identity:t('All gates are zero: exact identity','所有 gate 为零：精确保持恒等'),
 inspect:t('Inspect each channel’s residual update','逐通道查看残差更新'),
 gateEmpty:t('There are no channels. Preserve the empty shape and return [].','没有通道时，保留空形状并返回 []。'),gateTable:t('Gate only the block contribution','只对 block 的贡献做门控'),
 gateNote:t('Gate values are coefficients, not probabilities. Negative values subtract a contribution; values above 1 amplify it. No sigmoid or clipping is specified.','gate 是系数，不是概率；负值会减去贡献，大于 1 的值会放大贡献。本题没有指定 sigmoid 或截断。'),
 precision:t('Intermediate displays are approximate, using up to 6 decimals; tiny nonzero values use scientific notation. Component outputs retain full precision.','中间显示为约值，最多保留 6 位小数，微小非零值用科学计数法；组件输出保留完整精度。'),
 gateStory:t('Two steps for one channel','一个通道，两步算清'),gateChannel:t('Inspecting channel','当前通道'),
 gateScope:t('Only the selected channel is expanded here. The table below shows every channel.','下图只展开当前通道；下方表格列出所有通道。'),
 gateStepOne:t('Compute the update: branch × gate','先算更新：分支 × 门值'),gateStepTwo:t('Add the update to the original input','再把更新加回原始输入'),
 gateBranchLabel:t('Branch output','分支输出'),gateCoefficient:t('Gate coefficient','门控系数'),gateUpdateLabel:t('This update','本次更新'),
 gateInputLabel:t('Original input','原始输入'),gateFinalLabel:t('Final output','最终输出'),gateCarry:t('Use the same update in step 2','将这次更新带入第 2 步'),
 gateZeroMeaning:t('This channel’s gate is zero: its update is zero and its original input is preserved.','当前通道的门值为 0，更新为 0，因此输出保留原始输入。'),
 gateNegativeMeaning:t('The negative gate reverses the branch contribution. The original input is still added unchanged.','负门值会反转分支贡献的方向，原始输入仍原样参与相加。'),
 gateOpenMeaning:t('The gate scales only the branch contribution. Add that update to the unchanged original input.','门值只缩放分支贡献，再把这次更新加到保持原样的输入上。'),
 sharedStats:t('Shared statistics from the entire vector','由完整向量计算的共享统计量'),squaredMean:t('Mean square m₂','平方均值 m₂'),sharedDen:t('Shared divisor den','共同除数 den'),
 divideRms:t('Divide this input by the shared divisor','当前输入除以共同除数'),multiplyGain:t('Multiply by this channel’s gain','再乘以当前通道的 gain'),
 channelInput:t('Channel input','通道输入'),normalizedValue:t('Normalized value','归一化值'),channelGain:t('Channel gain','通道增益'),keepNormalized:t('Use this normalized value in the next step','将这个归一化值带入下一步'),
 rmsScope:t('The divisor uses all features. The two steps below expand only the selected channel.','除数由所有特征共同计算；下方两步只展开所选通道。'),
 residualStory:t('Compute the branch, then add the original input','先算分支，再加回原始输入'),vectorInput:t('Complete input vector','完整输入向量'),vectorNormalized:t('Normalized vector','归一化向量'),vectorBranch:t('Sublayer result','子层计算结果'),
 residualScope:t('The first two calls process whole vectors. Only the final addition is expanded for the selected channel.','前两次调用处理完整向量；最后只展开所选通道的相加过程。'),
 feedSublayer:t('Pass the complete normalization result to the sublayer','把完整归一化结果交给子层'),pickBranch:t('Take this channel from the branch; add the original x, not the normalized x','取出当前通道的分支值，加回原始 x，不是归一化后的 x'),
 centeredValue:t('Centered value','中心化值'),subtractMean:t('Subtract the shared feature mean','减去共享的特征均值'),divideLayer:t('Divide by the LayerNorm divisor','除以 LayerNorm 的除数'),multiplyCondition:t('Multiply by the conditioning factor','乘以条件给定的乘数'),addCondition:t('Add the conditioning shift','加上条件给定的平移量'),
 featureMean:t('Shared feature mean','共享特征均值'),conditionFactor:t('Multiplier = 1 + scale','乘数 = 1 + scale'),scaledValue:t('Scaled value','缩放后数值'),shiftValue:t('Conditioning shift','条件平移量'),
 carryCentered:t('Use the centered value in the division','将中心化值带入除法'),carryScaled:t('Add shift to this scaled value','在这个缩放结果上加 shift'),
 modulationStory:t('Follow one feature through four operations','沿一个特征，走完四步计算'),modulationScope:t('Mean and variance use the whole vector. Scale and shift below belong only to the selected channel.','均值与方差由完整向量计算；下方 scale 与 shift 只取所选通道的值。'),
 callNormalize:t('Call normalize(x)','调用 normalize(x)'),callSublayer:t('Call sublayer(z)','调用 sublayer(z)'),
 branchChannel:t('Branch value','分支值'),conditionMultiplier:t('Condition multiplier','条件乘数')
};
const say=(k,zh)=>zh?round16Translations[L[k]]:L[k];
const samp=v=>`<samp>${esc(typeof v==='number'?n(v):v)}</samp>`;
const result=(id,value,zh)=>`<h4>${say('output',zh)}</h4><pre class="r16-output" id="${id}">${esc(JSON.stringify(value,null,2))}</pre><p class="fineprint">${say('precision',zh)}</p>`;
const table=(heads,rows,label,i)=>`<div class="lesson-table-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><table class="lesson-table"><caption>${label}</caption><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row,j)=>`<tr class="${j===i?'r16-highlight':''}">${row.map(v=>`<td>${samp(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function renderRmsGain(tr,i=0,zh=false){
 const node=(key,symbol,value,opts={})=>calcNode(say(key,zh),symbol,value,{index:i,...opts});
 const stats=`<h4>${say('sharedStats',zh)}</h4>`+calcContext([[say('vectorInput',zh),calcValue(tr.x)],[say('squaredMean',zh),`<samp>(${tr.squares.map(n).join(' + ')}) / ${tr.x.length} ≈ ${n(tr.meanSquare)}</samp>`],[say('sharedDen',zh),calcRoot(tr.meanSquare,tr.eps,tr.den)]]);
 const first=calcStep(1,say('divideRms',zh),calcLine([node('channelInput','x',tr.x[i],{tone:'input',key:'rms-x'}),node('sharedDen','den',tr.den,{index:null,key:'rms-den'}),node('normalizedValue','z',tr.z[i],{tone:'update',key:'rms-z'})],['÷',calcEqual(tr.x[i],tr.den,tr.z[i])],say('divideRms',zh)));
 const second=calcStep(2,say('multiplyGain',zh),calcLine([node('normalizedValue','z',tr.z[i],{tone:'carried',key:'rms-z-again'}),node('channelGain','gain',tr.gain[i],{key:'rms-gain'}),node('gateFinalLabel','y',tr.output[i],{tone:'final',id:'rms-gain-number'})],['×',calcEqual(tr.z[i],tr.gain[i],tr.output[i])],say('multiplyGain',zh)),true);
 return stats+`<p>${say('rmsNote',zh)}</p>`+calcStory(say('gateStory',zh),say('gateChannel',zh),i,first+calcCarry(say('keepNormalized',zh))+second,say('rmsScope',zh))+table(['i','x[i]','x[i]²','z[i]','gain[i]','y[i]'],tr.x.map((v,j)=>[j,v,tr.squares[j],tr.z[j],tr.gain[j],tr.output[j]]),say('rmsTable',zh),i)+result('rms-gain-output',tr.output,zh);
}
export function renderPreNorm(tr,i=0,zh=false){
 const v=(key,symbol,value,keyName,tone='block')=>calcNode(say(key,zh),symbol,value,{key:keyName,tone});
 const first=calcStep(1,say('callNormalize',zh),calcLine([v('vectorInput','x',tr.x,'prenorm-x-vector','input'),v('vectorNormalized','z = N(x)',tr.z,'prenorm-z-vector','update')],['→'],say('callNormalize',zh)));
 const second=calcStep(2,say('callSublayer',zh),calcLine([v('vectorNormalized','z',tr.z,'prenorm-z-again','carried'),v('vectorBranch','u = F(z)',tr.branch,'prenorm-branch-vector','update')],['→'],say('callSublayer',zh)));
 const last=tr.x.length?calcStep(3,say('merge',zh),calcLine([calcNode(say('gateInputLabel',zh),'x',tr.x[i],{index:i,tone:'input',key:'prenorm-x'}),calcNode(say('branchChannel',zh),'u',tr.branch[i],{index:i,tone:'carried',key:'prenorm-u'}),calcNode(say('gateFinalLabel',zh),'y',tr.output[i],{index:i,tone:'final',id:'prenorm-number'})],['+',calcEqual(tr.x[i],tr.branch[i],tr.output[i])],say('merge',zh)),true):'';
 return calcStory(say('residualStory',zh),say('gateChannel',zh),tr.x.length?i:null,first+calcCarry(say('feedSublayer',zh))+second+(tr.x.length?calcCarry(say('pickBranch',zh)):'')+last,say(tr.x.length?'residualScope':'empty',zh))+table(['i','x[i]','N(x)[i]','F(N(x))[i]','y[i]'],tr.x.map((v,j)=>[j,v,tr.z[j],tr.branch[j],tr.output[j]]),say('residualTable',zh),i)+result('prenorm-output',tr.output,zh);
}
export function renderModulation(tr,i=1,zh=false){
 const node=(key,symbol,value,opts={})=>calcNode(say(key,zh),symbol,value,{index:i,...opts});
 const stats=`<h4>${say('sharedStats',zh)}</h4>`+calcContext([[say('vectorInput',zh),calcValue(tr.x)],[say('featureMean',zh),calcValue(tr.mean)],[say('variance',zh),calcValue(tr.variance)],[say('lnDivisor',zh),calcRoot(tr.variance,tr.eps,tr.den)]]);
 const first=calcStep(1,say('subtractMean',zh),calcLine([node('channelInput','x',tr.x[i],{tone:'input',key:'adaln-x'}),node('mean','m',tr.mean,{index:null,key:'adaln-mean'}),node('centeredValue','c',tr.centered[i],{tone:'update',key:'adaln-c'})],['−',calcEqual(tr.x[i],tr.mean,tr.centered[i])],say('subtractMean',zh)));
 const second=calcStep(2,say('divideLayer',zh),calcLine([node('centeredValue','c',tr.centered[i],{tone:'carried',key:'adaln-c-again'}),node('lnDivisor','den',tr.den,{index:null,key:'adaln-den'}),node('normalizedValue','z',tr.z[i],{tone:'update',key:'adaln-z'})],['÷',calcEqual(tr.centered[i],tr.den,tr.z[i])],say('divideLayer',zh)));
 const third=calcStep(3,say('multiplyCondition',zh),`<p class="lesson-calc-hint"><span>${say('conditionFactor',zh)}</span>: 1 + (${n(tr.scale[i])}) = ${n(tr.factor[i])}</p>`+calcLine([node('normalizedValue','z',tr.z[i],{tone:'carried',key:'adaln-z-again'}),node('conditionMultiplier','a',tr.factor[i],{key:'adaln-factor'}),node('scaledValue','s',tr.scaled[i],{tone:'update',key:'adaln-scaled'})],['×',calcEqual(tr.z[i],tr.factor[i],tr.scaled[i])],say('multiplyCondition',zh)));
 const fourth=calcStep(4,say('addCondition',zh),calcLine([node('scaledValue','s',tr.scaled[i],{tone:'carried',key:'adaln-scaled-again'}),node('shiftValue','shift',tr.shift[i],{key:'adaln-shift'}),node('gateFinalLabel','y',tr.output[i],{tone:'final',id:'modulation-number'})],['+',calcEqual(tr.scaled[i],tr.shift[i],tr.output[i])],say('addCondition',zh)),true);
 return stats+calcStory(say('modulationStory',zh),say('gateChannel',zh),i,first+calcCarry(say('carryCentered',zh))+second+calcCarry(say('keepNormalized',zh))+third+calcCarry(say('carryScaled',zh))+fourth,say('modulationScope',zh))+`<p class="lesson-warning">${say('condNote',zh)}</p>`+table(['i','z[i]','scale[i]','1 + scale[i]','shift[i]','y[i]'],tr.x.map((_,j)=>[j,tr.z[j],tr.scale[j],tr.factor[j],tr.shift[j],tr.output[j]]),say('modulationTable',zh),i)+result('modulation-output',tr.output,zh);
}
export function renderGatedResidual(tr,i=0,zh=false){
 if(!tr.x.length)return `<p>${say('gateEmpty',zh)}</p>${result('residual-gate-output',[],zh)}`;
 const node=(label,symbol,value,kind)=>`<div class="r16-gate-node r16-gate-${kind}" data-gate-node="${kind}"><span class="r16-gate-label">${label}</span><span class="r16-gate-symbol">${symbol}<sub>${i}</sub></span>${kind==='final'?`<output id="residual-gate-number">${n(value)}</output>`:`<samp data-gate-value="${esc(value)}">${n(value)}</samp>`}</div>`;
 const operator=s=>`<span class="r16-gate-operator" aria-hidden="true">${s}</span>`;
 const equals=(...values)=>operator(values.every(v=>Number(n(v))===v)?'=':'≈');
 return `<figure class="r16-gate-story"><figcaption><strong>${say('gateStory',zh)}</strong><span class="r16-gate-channel"><span>${say('gateChannel',zh)}</span> ${i}</span></figcaption><p class="r16-gate-scope">${say('gateScope',zh)}</p>
 <section class="r16-gate-step r16-gate-step-update"><h4><span class="r16-gate-step-number">1</span><span>${say('gateStepOne',zh)}</span></h4><div class="r16-gate-arithmetic" role="group" aria-label="${say('gateStepOne',zh)}">${node(say('gateBranchLabel',zh),'block',tr.block[i],'block')}${operator('×')}${node(say('gateCoefficient',zh),'gate',tr.gate[i],'coefficient')}${equals(tr.block[i],tr.gate[i],tr.update[i])}${node(say('gateUpdateLabel',zh),'u',tr.update[i],'update')}</div></section>
 <p class="r16-gate-carry"><span aria-hidden="true">↓</span><span>${say('gateCarry',zh)}</span></p>
 <section class="r16-gate-step r16-gate-step-merge"><h4><span class="r16-gate-step-number">2</span><span>${say('gateStepTwo',zh)}</span></h4><div class="r16-gate-arithmetic" role="group" aria-label="${say('gateStepTwo',zh)}">${node(say('gateInputLabel',zh),'x',tr.x[i],'input')}${operator('+')}${node(say('gateUpdateLabel',zh),'u',tr.update[i],'carried')}${equals(tr.x[i],tr.update[i],tr.output[i])}${node(say('gateFinalLabel',zh),'y',tr.output[i],'final')}</div></section>
 <p class="r16-gate-takeaway">${say(tr.gate[i]===0?'gateZeroMeaning':tr.gate[i]<0?'gateNegativeMeaning':'gateOpenMeaning',zh)}</p></figure>
 ${table(['i','x[i]','block[i]','gate[i]','gate[i] × block[i]','y[i]'],tr.x.map((v,j)=>[j,v,tr.block[j],tr.gate[j],tr.update[j],tr.output[j]]),say('gateTable',zh),i)}<p>${say('gateNote',zh)}</p>${result('residual-gate-output',tr.output,zh)}`;
}
