import {formatNumber as f,formatVector as vector} from './lesson-math.mjs';
export const round11Translations={};
export const t=(en,zh)=>{round11Translations[en]=zh;return en;};
const labels={
 tokens:t('Token matrix','Token 矩阵'),heads:t('Head matrices','各个头的矩阵'),head:t('Head','注意力头'),token:t('Token','Token'),
 input:t('Input layout','输入布局'),output:t('Output layout','输出布局'),split:t('Cut each token’s feature row into contiguous chunks, then group by head.','把每个 token 的特征行切成连续小段，再按头归组。'),merge:t('For each token, concatenate head 0, head 1 and the remaining heads in order.','对每个 token，依次拼接头 0、头 1 以及后续头的向量。'),
 click:t('Click any numbered cell to trace it through the layout change. The outlined cells are the same element, not a new computation.','点击任意数值格，追踪它换位置前后的对应关系。带描边的两格是同一个元素，没有重新计算数值。'),
 inspect:t('Trace the selected element','追踪选中的元素'),from:t('Source index','来源索引'),to:t('Destination index','目标索引'),value:t('Unchanged value','数值不变'),
 empty:t('No tokens: each head is an empty list. There are no feature cells to select.','没有 token：每个头都是空列表，没有可选择的特征格。'),
 zero:t('There are tokens, but every feature row is empty. The head width is zero; keep every empty token row.','有 token，但每行特征为空。每个头的宽度为零，仍须保留每个 token 的空行。'),
 functionOutput:t('Function output','函数输出'),
 queries:t('Queries: the requesting sequence','Query：发起查询的序列'),source:t('Keys and values: the source sequence','Key 与 Value：被读取的源序列'),
 dimensions:t('Input and output shapes','输入与输出形状'),selected:t('Inspect one query row','查看一个 Query 的计算'),
 dots:t('1 · Match the query against every key','1 · 与每个 Key 计算匹配分数'),normalize:t('2 · Normalize across source tokens','2 · 沿源 token 维度归一化'),weighted:t('3 · Multiply each value row by its weight','3 · 每个 Value 行乘以对应权重'),sum:t('4 · Add contributions into one output row','4 · 各项相加，得到一个输出行'),
 dot:t('Dot product','点积'),score:t('Scaled score','缩放后的分数'),shifted:t('After subtracting maximum','减去最大分数后'),exp:t('Exponential','指数值'),weight:t('Attention weight','注意力权重'),contribution:t('Weighted value','加权后的 Value'),
 weights:t('Attention weights for the inspected query','当前 Query 对各源 token 的权重'),sourceToken:t('Source token','源 token'),queryOutput:t('Output for the inspected query','当前 Query 的输出'),
 all:t('All query outputs','全部 Query 的输出'),sumWeights:t('Sum of this row’s weights','这一行的权重之和'),
 normalNote:t('Each query has its own normalization. The probabilities sum across keys, not across queries or value features.','每个 Query 单独归一化。概率沿 Key 维度求和，不是沿 Query 维度或 Value 特征维度求和。'),
 sourceNote:t('K row j and V row j refer to the same source position. Q can have a different number of rows; no matching query row is required.','K 的第 j 行和 V 的第 j 行对应同一个源位置。Q 的行数可以不同，不需要存在同编号的 Query 行。'),
 precision:t('Values display up to 6 decimals. A tiny attention weight may round to zero in the display, or underflow to zero during exponentiation. Computation uses unrounded values.','数值最多显示 6 位小数。极小权重可能显示为零，指数运算也可能下溢为零。计算使用未舍入值。'),
 matrix:t('Numerical matrix','数值矩阵')
};
const say=(k,zh)=>zh?round11Translations[labels[k]]:labels[k];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const matrixText=rows=>'['+rows.map(vector).join(', ')+']';
function layoutMatrix(tr,head,selected,zh){
 const rows=head===null?tr.tokens:tr.heads[head],width=head===null?tr.width:tr.depth;
 return `<div class="r11-matrix" style="--r11-columns:${Math.max(1,width)}">${rows.length?rows.map((row,t)=>`<div class="r11-matrix-row"><span class="r11-row-label">t${t}</span><div class="r11-cells">${row.length?row.map((value,j)=>{
  const c=head===null?j:head*tr.depth+j,index=t*tr.width+c,h=head===null?Math.floor(c/tr.depth):head;
  return `<button type="button" class="r11-cell r11-head-${h%4}" data-layout-cell="${index}" aria-pressed="${index===selected}" aria-label="${esc(`${say('token',zh)} ${t}, ${head===null?'c'+c:'h'+head+', j'+j}, ${f(value)}`)}" disabled>${f(value)}</button>`;
 }).join(''):'<span class="r11-empty-row">[]</span>'}</div></div>`).join(''):'<span class="r11-empty-row">[]</span>'}</div>`;
}
function tokenPanel(tr,selected,zh){return `<section class="r11-layout-panel"><h4><span>${say('tokens',zh)}</span> <small>[${tr.length}, ${tr.length?tr.width:'?'}]</small></h4>${layoutMatrix(tr,null,selected,zh)}</section>`;}
function headsPanel(tr,selected,zh){return `<section class="r11-layout-panel"><h4><span>${say('heads',zh)}</span> <small>[${tr.count}, ${tr.length}, ${tr.length?tr.depth:'?'}]</small></h4><div class="r11-heads">${tr.heads.map((_,h)=>`<section class="r11-head-panel r11-head-${h%4}"><h5><span>${say('head',zh)}</span> ${h}</h5>${layoutMatrix(tr,h,selected,zh)}</section>`).join('')}</div></section>`;}
export function renderLayout(tr,mode='split',selected=0,zh=false){
 const mapping=tr.mapping[selected],from=mapping?`tokens[${mapping.t}][${mapping.c}]`:'',to=mapping?`heads[${mapping.h}][${mapping.t}][${mapping.j}]`:'';
 const input=mode==='split'?tokenPanel(tr,selected,zh):headsPanel(tr,selected,zh),out=mode==='split'?headsPanel(tr,selected,zh):tokenPanel(tr,selected,zh);
 const result=mode==='split'?'['+tr.heads.map(matrixText).join(', ')+']':matrixText(tr.tokens);
 return `<p class="fineprint">${say('click',zh)}</p><div class="r11-layout-flow"><p class="r11-stage-label">${say('input',zh)}</p>${input}<p class="r11-layout-arrow"><span aria-hidden="true">↓</span> <span>${say(mode,zh)}</span></p><p class="r11-stage-label">${say('output',zh)}</p>${out}</div>${mapping?`<section class="r11-index-map"><h4>${say('inspect',zh)}</h4><div><span>${say('from',zh)}</span><samp id="head-source-index">${mode==='split'?from:to}</samp><span aria-hidden="true">→</span><span>${say('to',zh)}</span><samp id="head-target-index">${mode==='split'?to:from}</samp></div><p><span>${say('value',zh)}</span>: <output id="head-selected-value">${f(mapping.value)}</output></p></section>`:`<p class="lesson-warning">${say(tr.length?'zero':'empty',zh)}</p>`}<p><span>${say('functionOutput',zh)}</span>:</p><pre class="r11-output" id="head-output">${esc(result)}</pre>`;
}
const table=(headers,rows,zh)=>`<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="${say('matrix',zh)}"><table class="lesson-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${typeof v==='number'?f(v):esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function renderCross(tr,index=0,zh=false){
 const r=tr.rows[index];
 const q=table(['i','Q[i]'],tr.queries.map((v,i)=>[i,vector(v)]),zh),kv=table(['j','K[j]','V[j]'],tr.keys.map((v,j)=>[j,vector(v),vector(tr.values[j])]),zh);
 const bars=r.weights.map((w,j)=>`<div class="r11-weight-row"><span><span>${say('sourceToken',zh)}</span> ${j}</span><div class="r11-weight-track" aria-hidden="true"><span style="width:${w*100}%"></span></div><output>${f(w)}</output></div>`).join('');
 return `<section class="r11-cross-inputs"><div><h4>${say('queries',zh)}</h4>${q}</div><div><h4>${say('source',zh)}</h4>${kv}</div></section><p class="fineprint">${say('sourceNote',zh)}</p><section class="r11-shapes"><h4>${say('dimensions',zh)}</h4><p>Q [${tr.nq}, ${tr.dk}] · K [${tr.nk}, ${tr.dk}] · V [${tr.nk}, ${tr.dv}] → <strong>O [${tr.nq}, ${tr.dv}]</strong></p></section><h4><span>${say('selected',zh)}</span>: q${index} = ${vector(r.query)}</h4><section class="r11-cross-step"><h5>${say('dots',zh)}</h5>${table(['j',say('dot',zh),say('score',zh)],r.dots.map((d,j)=>[j,d,r.scores[j]]),zh)}</section><section class="r11-cross-step"><h5>${say('normalize',zh)}</h5><p>max = ${f(r.maximum)}; Σ exp = ${f(r.denominator)}</p>${table(['j',say('shifted',zh),say('exp',zh),say('weight',zh)],r.weights.map((w,j)=>[j,r.shifted[j],r.exponentials[j],w]),zh)}<figure class="r11-weights"><figcaption>${say('weights',zh)}</figcaption>${bars}</figure><p><span>${say('sumWeights',zh)}</span>: <output id="cross-weight-sum">${f(r.weights.reduce((s,w)=>s+w,0))}</output></p><p class="fineprint">${say('normalNote',zh)}</p></section><section class="r11-cross-step"><h5>${say('weighted',zh)}</h5>${table(['j',say('weight',zh),'V[j]',say('contribution',zh)],r.weights.map((w,j)=>[j,w,vector(tr.values[j]),vector(r.contributions[j])]),zh)}</section><section class="r11-cross-step r11-cross-result"><h5>${say('sum',zh)}</h5><p><span>${say('queryOutput',zh)}</span>: <output id="cross-query-output">${vector(r.output)}</output></p></section><h4>${say('all',zh)}</h4>${table(['i','O[i]'],tr.output.map((v,i)=>[i,vector(v)]),zh)}<p role="status"><span>${say('functionOutput',zh)}</span>: <output id="cross-output">${esc(matrixText(tr.output))}</output></p><p class="fineprint">${say('precision',zh)}</p>`;
}
