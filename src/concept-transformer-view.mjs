import {attentionTrace,ropeTrace,formatNumber as f} from './lesson-math.mjs';
import {splitTrace} from './lesson-round11-math.mjs';
import {layerTrace} from './lesson-round6-math.mjs';
import {maskTrace,swigluTrace} from './lesson-round17-math.mjs';
import {patchTrace,patchPresets} from './lesson-round19-math.mjs';
import {escapeMath as e} from './math-expression.mjs';
export const transformerViewTranslations={};
const t=(en,zh)=>{transformerViewTranslations[en]=zh;return en;};
const w={choose:t('Choose supplied inputs','选择给定输入'),reset:t('Reset chapter example','重置本章示例'),input:t('Supplied example input','示例的给定输入'),output:t('Calculated component output','计算得到的组件输出'),error:t('Input outside this component contract','输入超出该组件契约'),invalidHeads:t('Four channels cannot be evenly split into three heads. Choose 1, 2 or 4 heads. No rounded split is returned.','四个通道无法均分为三个头。请选择 1、2 或 4 个头，不返回取整后的拆分结果。'),invalidPatch:t('Patch size 3 does not divide this 4 × 4 image. Choose 1, 2 or 4. No border pixels are silently discarded.','Patch 尺寸 3 无法整除这张 4 × 4 图像。请选择 1、2 或 4，不会静默丢弃边缘像素。'),fallback:t('The default input, diagram and calculated result remain readable without JavaScript. Enable it to change the example.','不启用 JavaScript 也可阅读默认输入、图示和计算结果；启用后可以切换示例。'),pair:t('One coordinate pair before and after rotation','一个坐标对旋转前后'),pairLegend:t('Blue line: input (1, 0). Green line: rotated pair. The two axes use the same scale.','蓝线：输入 (1, 0)；绿线：旋转后的坐标对。横纵轴使用相同尺度。'),image:t('Original 4 × 4 image, grouped by patch','按 Patch 分组的原始 4 × 4 图像'),imageLegend:t('Numbers are pixel values; colors group the non-overlapping patches. Returned vectors follow row-major order.','数字是像素值，颜色用于区分不重叠 Patch；输出向量按行优先顺序排列。'),key:t('Key index','键索引'),score:t('Supplied score','给定分数'),masked:t('Masked score','遮罩后分数'),prob:t('Softmax weight','Softmax 权重'),coordinate:t('Feature index','特征索引'),value:t('Value input','数值输入'),gate:t('Gate input','门控输入'),silu:t('SiLU value','SiLU 数值'),mean:t('Feature mean','特征均值'),variance:t('Feature variance','特征方差'),norm:t('Squared pair norm','坐标对的平方范数'),head:t('Head layout','Head 布局'),weights:t('Key weights for this query','当前查询对各键的权重')};
const sample=(label,zh,args)=>({label:t(label,zh),args});
export const transformerSamples={
 attention:{balanced:sample('Balanced query (0, 0)','均衡查询 (0, 0)',[[0,0]]),first:sample('Favor the first key','更偏向第一个键',[[2,0]]),second:sample('Favor the second key','更偏向第二个键',[[0,2]])},
 heads:{two:sample('Two heads, two channels each','两个头，每头两个通道',[2]),one:sample('One head, four channels','一个头，四个通道',[1]),four:sample('Four heads, one channel each','四个头，每头一个通道',[4]),invalid:sample('Invalid: three heads','无效：三个头',[3])},
 block:{mixed:sample('Different feature values','不同特征值',[[1,3],.01]),constant:sample('Constant features with epsilon','常量特征与 epsilon',[[3,3],.01]),signed:sample('Signed feature values','正负特征值',[[-2,2],.01])},
 mask:{exclude:sample('Exclude the highest-scoring padding key','排除最高分的补齐键',[[-2,4,-1],[true,false,true]]),all:sample('Keep every supplied key','保留全部给定键',[[-2,4,-1],[true,true,true]]),only:sample('Keep one supplied key','只保留一个给定键',[[-2,4,-1],[true,false,false]])},
 rope:{quarter:sample('Quarter turn, π/2 radians','四分之一周，π/2 弧度',[1,0,Math.PI/2]),zero:sample('Zero rotation angle','零旋转角',[1,0,0]),half:sample('Half turn, π radians','半周，π 弧度',[1,0,Math.PI]),negative:sample('Negative quarter turn','负四分之一周',[1,0,-Math.PI/2])},
 swiglu:{mixed:sample('Negative and positive gates','负 gate 与正 gate',[[3,2],[-1,1]]),zero:sample('Both gates are zero','两个 gate 均为零',[[3,2],[0,0]]),empty:sample('Empty input vectors','空输入向量',[[],[]])},
 vit:{two:sample('2 × 2 pixel patches','2 × 2 像素 Patch',[2]),one:sample('One pixel per patch','每个 Patch 一个像素',[1]),four:sample('One whole-image patch','整张图像一个 Patch',[4]),invalid:sample('Invalid: 3 × 3 patches','无效：3 × 3 Patch',[3])}
};
export function transformerExample(kind,choice=Object.keys(transformerSamples[kind]||{})[0]){
 const args=transformerSamples[kind]?.[choice]?.args;if(!args)throw new RangeError('Unknown chapter example');let tr;
 if(kind==='attention'){tr=attentionTrace(...args);return {kind,args,tr,output:tr.output};}
 if(kind==='heads'){if(4%args[0])return {kind,args,error:'invalidHeads'};tr=splitTrace([[1,2,3,4],[5,6,7,8]],args[0]);return {kind,args,tr,output:tr.output};}
 if(kind==='block'){tr=layerTrace(...args);return {kind,args,tr,output:tr.output};}
 if(kind==='mask'){tr=maskTrace(...args);return {kind,args,tr,output:tr.output};}
 if(kind==='rope'){tr=ropeTrace(...args);return {kind,args,tr,output:tr.output};}
 if(kind==='swiglu'){tr=swigluTrace(...args);return {kind,args,tr,output:tr.output};}
 if(kind==='vit'){if(4%args[0])return {kind,args,error:'invalidPatch'};tr=patchTrace(patchPresets.basic.image,args[0]);return {kind,args,tr,output:tr.output};}
}
const print=value=>typeof value==='number'?(Number.isFinite(value)?f(value):value===-Infinity?'-inf':String(value)):Array.isArray(value)?'['+value.map(print).join(', ')+']':String(value);
export function renderTransformerExample(kind,choice,zh=false){
 const result=transformerExample(kind,choice),s=key=>zh?transformerViewTranslations[w[key]]:w[key],tr=result.tr;
 if(result.error)return `<div class="ct-error" role="status" data-ct-error><strong>${s('error')}</strong><p>${s(result.error)}</p></div>`;
 const table=(heads,rows)=>`<table class="ct-table"><thead><tr>${heads.map(key=>`<th scope="col">${s(key)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td><code>${e(print(value))}</code></td>`).join('')}</tr>`).join('')}</tbody></table>`;
 let input=result.args,figure='';
 if(kind==='attention'){input={Q:tr.query,K:tr.keys,V:tr.values};figure=`<figure class="ct-mini"><figcaption>${s('weights')}</figcaption>${tr.probabilities.map((p,i)=>`<div class="ct-weight"><code>${i}</code><span aria-hidden="true"><i style="width:${100*p}%"></i></span><output>${f(100*p)}%</output></div>`).join('')}</figure>`;}
 if(kind==='heads'){input={tokens:tr.tokens,heads:argsFirst(result)};figure=`<div class="ct-heads">${tr.heads.map((head,i)=>`<figure class="ct-mini"><figcaption><span>${s('head')}</span> ${i}</figcaption><code>${e(print(head))}</code></figure>`).join('')}</div>`;}
 if(kind==='block'){input={x:tr.x,epsilon:tr.eps};}if(kind==='mask')input={scores:tr.scores,valid:tr.valid};if(kind==='rope')input={pair:tr.input,angle:tr.angle};if(kind==='swiglu')input={x:tr.x,gate:tr.gate};
 if(kind==='block')figure=`<dl class="ct-stats"><div><dt>${s('mean')}</dt><dd>${f(tr.mean)}</dd></div><div><dt>${s('variance')}</dt><dd>${f(tr.variance)}</dd></div></dl>`;
 if(kind==='mask')figure=table(['key','score','masked','prob'],tr.scores.map((v,i)=>[i,v,tr.output[i],tr.probabilities[i]]));
 if(kind==='swiglu')figure=table(['coordinate','value','gate','silu'],tr.x.map((v,i)=>[i,v,tr.gate[i],tr.silu[i]]));
 if(kind==='rope'){const out=result.output;figure=`<figure class="ct-mini"><figcaption>${s('pair')}</figcaption><svg class="ct-rotation" viewBox="0 0 240 200" role="img" aria-label="${s('pair')}"><path d="M30 100H210 M120 10V190" stroke="#c5d1c9" fill="none"/><circle cx="120" cy="100" r="65" fill="none" stroke="#dae4de"/><line x1="120" y1="100" x2="185" y2="100" stroke="#526fae" stroke-width="7"/><line x1="120" y1="100" x2="${120+65*out[0]}" y2="${100-65*out[1]}" stroke="#147d64" stroke-width="3"/><circle cx="${120+65*out[0]}" cy="${100-65*out[1]}" r="5" fill="#147d64"/></svg><p class="fineprint">${s('pairLegend')}</p></figure><p><span>${s('norm')}</span>: ${f(out[0]**2+out[1]**2)}</p>`;}
 if(kind==='vit'){input={image:patchPresets.basic.image,patchSize:argsFirst(result)};const size=argsFirst(result);figure=`<figure class="ct-mini"><figcaption>${s('image')}</figcaption><div class="ct-image" aria-hidden="true">${patchPresets.basic.image.flatMap((row,r)=>row.map((v,c)=>`<span style="--patch:${(Math.floor(r/size)*(4/size)+Math.floor(c/size))%4}">${v}</span>`)).join('')}</div><p class="fineprint">${s('imageLegend')}</p></figure>`;}
 const inputText=Array.isArray(input)?print(input):Object.entries(input).map(([k,v])=>k+' = '+print(v)).join('\n');
 return `<div class="ct-input"><strong>${s('input')}</strong><pre><code>${e(inputText)}</code></pre></div>${figure}<div class="ct-result" role="status"><strong>${s('output')}</strong><code data-ct-output>${e(print(result.output))}</code></div>`;
}
function argsFirst(result){return result.args[0];}
export function transformerExperiment(kind){const presets=transformerSamples[kind];return `<div class="cf-experiment ct-experiment" data-transformer-example="${kind}"><div class="lesson-controls"><label for="ct-example"><span>${w.choose}</span><select id="ct-example" disabled>${Object.entries(presets).map(([key,p])=>`<option value="${key}">${e(p.label)}</option>`).join('')}</select></label><button class="button outline small" id="ct-reset" disabled type="button">${w.reset}</button></div><div id="ct-example-view">${renderTransformerExample(kind)}</div><noscript><p>${w.fallback}</p></noscript></div>`;}
