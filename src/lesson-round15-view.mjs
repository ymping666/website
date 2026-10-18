import {formatNumber as f} from './lesson-math.mjs';
import {scalarFunctions} from './lesson-round15-math.mjs';
export const round15Translations={};
export const t=(en,zh)=>{round15Translations[en]=zh;return en;};
export const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const n=v=>v!==0&&Math.abs(v)<1e-5?v.toExponential(3):f(v);
const L={
 input:t('Supplied input x','给定输入 x'),weights:t('Weight rows belong to output features','权重的每一行对应一个输出特征'),bias:t('Add the bias once','只加一次偏置'),
 shape:t('Weight shape: outputs × inputs','权重形状：输出数 × 输入数'),row:t('Trace one output row','追踪一个输出行'),products:t('Multiply matching input coordinates','相同输入坐标相乘'),sum:t('Sum the row, then add its bias','先将本行求和，再加上该行偏置'),
 noOutput:t('There are no output rows, so the output is [].','没有输出行，因此输出为 []。'),noInput:t('There are no input coordinates. The empty row sum is 0, so each output is its bias.','没有输入坐标；空行的和为 0，因此每个输出就是对应偏置。'),
 output:t('Component output','组件输出'),upstream:t('Supplied upstream gradient g = dL/dy','给定上游梯度 g = dL/dy'),
 backInput:t('1 · Add paths that reach this input','1 · 汇总到达这个输入的路径'),backWeight:t('2 · One product for each weight','2 · 每个权重对应一个乘积'),backBias:t('3 · Bias has local derivative 1','3 · 偏置的局部导数为 1'),
 inputIndex:t('Inspected input coordinate','查看的输入坐标'),rowIndex:t('Inspected output row','查看的输出行'),path:t('Path contribution','本路径的贡献'),
 weightNote:t('Each cell is g[o] × x[i]. This is an outer product; there is no sum inside a weight-gradient cell.','每格均为 g[o] × x[i]，这是外积；单个权重梯度格子内部不求和。'),
 dxNote:t('An input may influence several outputs. Sum every output path, including negative contributions and exact cancellation.','一个输入可能影响多个输出，应汇总所有输出路径，包括负贡献与恰好抵消的贡献。'),
 emptyBack:t('Empty dimensions are preserved. An input with no outgoing output paths receives gradient 0.','空维度按原样保留。输入没有通向任何输出的路径时，其梯度为 0。'),
 gradients:t('Returned gradients in order: dx, dw, db','返回梯度的顺序：dx、dw、db'),
 residual:t('1 · Prediction minus target','1 · 预测减目标'),square:t('2 · Square this residual','2 · 将此残差平方'),gradient:t('3 · Differentiate and divide by n','3 · 求导后除以元素数 n'),
 mseTable:t('Residuals and prediction gradients','残差与预测梯度'),pred:t('Prediction','预测'),target:t('Target','目标'),grad:t('Prediction gradient','预测梯度'),
 loss:t('Full mean squared loss','完整的均方损失'),mseLegend:t('Dashed line: target position. Green point: current prediction and full loss.','虚线：目标位置。绿色点：当前预测与完整损失。'),mseCurve:t('Move one prediction; hold all others fixed','只移动一个预测，其他坐标保持不变'),
 mseOther:t('The other coordinates contribute a fixed amount to the loss. The curve minimum need not be zero.','其他坐标为损失提供固定贡献，因此这条曲线的最低点不一定为 0。'),
 positive:t('Positive gradient: increasing this prediction locally increases the loss.','梯度为正：在当前位置略微增大该预测，会增大损失。'),
 negative:t('Negative gradient: increasing this prediction locally decreases the loss.','梯度为负：在当前位置略微增大该预测，会减小损失。'),
 zeroGrad:t('Zero gradient at the target for this coordinate. Other coordinates can still have errors.','此坐标的预测等于目标，梯度为 0；其他坐标仍可能有误差。'),
 repeat:t('Repeating the vector preserves the mean loss, but divides each repeated coordinate gradient by the repeat count.','重复整组数据不改变平均损失，但每个重复坐标的梯度会再除以重复份数。'),
 incoming:t('Incoming gradient','传入的上游梯度'),gate:t('Gate determined by x','由 x 决定的开关'),outgoing:t('Returned input gradient','返回的输入梯度'),
 open:t('Open: x is positive','打开：x 为正'),closed:t('Closed: x is nonpositive','关闭：x 非正'),
 zeroRule:t('At x = 0, ReLU is not differentiable. This exercise explicitly returns 0 at that point.','x = 0 处 ReLU 不可微；本题明确约定在该点返回 0。'),
 reluTable:t('ReLU forward values, masks and backward gradients','ReLU 前向值、开关与反向梯度'),mask:t('Mask','开关值'),
 reluNote:t('An open gate passes the upstream value with its original sign. A negative upstream gradient does not close a positive input gate.','开关打开后，原样传递上游梯度，包括其符号。上游梯度为负，不会关闭正输入对应的开关。'),
 emptyRelu:t('Empty vectors have no gates to inspect. Return a new empty vector.','空向量没有可查看的开关，返回新的空向量。'),
 samples:t('Two probe values used by the helper','辅助函数使用的两个探测值'),right:t('Right probe: x + h','右侧探测点：x + h'),left:t('Left probe: x − h','左侧探测点：x − h'),
 centralCurve:t('The secant joins the two sampled points','割线连接左右两个采样点'),offset:t('Horizontal axis: offset δ from x','横轴：相对于 x 的偏移 δ'),
 secant:t('Dashed segment: secant between x − h and x + h. Green is the right probe; purple is the left probe.','虚线段为 x − h 与 x + h 之间的割线；绿色点在右侧，紫色点在左侧。'),
 calls:t('The tested helper makes exactly two function calls. The curve is drawn with separate display samples.','被测辅助函数恰好调用 f 两次；曲线使用另外的展示采样绘制。'),
 arithmetic:t('Read rise divided by run','纵向变化量除以横向距离'),analytic:t('Analytic derivative at x','x 处的解析导数'),error:t('Absolute numerical error','数值估计的绝对误差'),
 kink:t('No derivative exists here. A centered estimate of 0 does not establish differentiability.','该点不存在导数；中心差分估计为 0，不能证明这里可微。'),
 precision:t('Most labels use up to 6 decimals; tiny nonzero values use scientific notation. Probe coordinates and component outputs retain full precision.','多数标签最多保留 6 位小数；微小非零值使用科学计数法。探测坐标与组件输出保留完整精度。')
};
const say=(k,zh)=>zh?round15Translations[L[k]]:L[k];
const vector=v=>JSON.stringify(v);
const code=v=>`<samp>${esc(typeof v==='number'?n(v):v)}</samp>`;
const card=(title,body,cls='')=>`<section class="r15-card ${cls}"><h4>${title}</h4>${body}</section>`;
const result=(id,value,zh)=>`<h4>${say('output',zh)}</h4><pre class="r15-output" id="${id}">${esc(JSON.stringify(value,null,2))}</pre>`;
const table=(heads,rows,label)=>`<div class="lesson-table-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><table class="lesson-table"><caption>${label}</caption><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${code(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function matrix(w,row=-1,col=-1,outer=null){
 return `<div class="lesson-table-scroll" tabindex="0" role="region" aria-label="${outer?'dw':'W'}"><table class="lesson-table r15-matrix"><caption>${outer?'dw':'W'}</caption><thead><tr><th scope="col">o / i</th>${(w[0]||[]).map((_,i)=>`<th scope="col" class="${i===col?'r15-focus':''}">i${i}</th>`).join('')}</tr></thead><tbody>${w.map((values,o)=>`<tr><th scope="row" class="${o===row?'r15-focus':''}">o${o}</th>${values.map((v,i)=>`<td class="${o===row&&i===col?'r15-cell':o===row||i===col?'r15-focus':''}">${outer?`<small>${n(outer.g[o])} × ${n(outer.x[i])}</small>`:''}${code(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function chart(points,markers,label,xLabel,zh,segment=false,vertical=null){
 const xmin=points[0][0],xmax=points.at(-1)[0],ys=points.map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys),pad=Math.max((hi-lo)*.12,Number.EPSILON*Math.max(Math.abs(lo),Math.abs(hi)),1e-300),ymin=lo-pad,ymax=hi+pad;
 const X=x=>55+(x-xmin)/(xmax-xmin)*530,Y=y=>270-(y-ymin)/(ymax-ymin)*185;
 const axisY=v=>hi-lo<1e-5*Math.max(Math.abs(lo),Math.abs(hi))?v.toPrecision(10):n(v);
 return `<figure class="r15-chart"><figcaption>${label}</figcaption><svg viewBox="0 0 640 360" role="img" aria-labelledby="r15-chart-title"><title id="r15-chart-title">${esc(label)}</title><path d="M55 80V270H585" class="r15-axis"/><polyline class="r15-curve" points="${points.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}"/>${vertical!==null?`<path d="M${X(vertical)} 80V270" class="r15-dashed"/>`:''}${segment?`<path class="r15-dashed" d="M${X(markers[0][0])} ${Y(markers[0][1])}L${X(markers[1][0])} ${Y(markers[1][1])}"/>`:''}${markers.map(([x,y],i)=>`<circle class="r15-probe r15-probe-${i}" cx="${X(x)}" cy="${Y(y)}" r="6"/>`).join('')}<text x="55" y="26">${xLabel==='p'?'L':'f(x + δ)'}</text><text x="55" y="56">${axisY(lo)} … ${axisY(hi)}</text><text x="55" y="296">${n(xmin)}</text><text x="585" y="296" text-anchor="end">${n(xmax)}</text><text x="320" y="345" text-anchor="middle">${xLabel}</text></svg></figure>`;
}
export function renderForward(tr,row=0,zh=false){
 const context=`<p><span>${say('input',zh)}</span>: ${code(vector(tr.x))}</p><p><span>${say('shape',zh)}</span>: ${tr.w.length} × ${tr.x.length}</p>`;
 if(!tr.w.length)return context+`<p>${say('noOutput',zh)}</p>`+result('linear-forward-output',[],zh);
 const terms=tr.products[row].map(v=>'('+n(v)+')').join(' + ')||'0';
 return context+matrix(tr.w,row)+`<p>${say('weights',zh)}</p><h4>${say('products',zh)}</h4><div class="r15-terms">${tr.x.map((v,i)=>card(`i${i}`,`<p>W[${row}][${i}] × x[${i}]</p><p>${n(tr.w[row][i])} × (${n(v)}) = <strong>${n(tr.products[row][i])}</strong></p>`)).join('')}${card(say('bias',zh),code(tr.b[row]),'r15-bias')}</div>${!tr.x.length?`<p>${say('noInput',zh)}</p>`:''}${card(say('sum',zh),`<p class="r15-equation">y[${row}] = ${terms} + (${n(tr.b[row])}) = <output id="forward-number">${n(tr.output[row])}</output></p>`)}${result('linear-forward-output',tr.output,zh)}`;
}
export function renderBackward(tr,i=0,o=0,zh=false){
 const [dx,dw,db]=tr.output;
 const paths=tr.contributions[i]||[];
 return `<p><span>${say('input',zh)}</span>: ${code(vector(tr.x))}</p><p><span>${say('upstream',zh)}</span>: ${code(vector(tr.g))}</p><p><span>${say('shape',zh)}</span>: ${tr.w.length} × ${tr.x.length}</p>${matrix(tr.w,o,i)}${card(say('backInput',zh),tr.x.length?`<p><span>${say('inputIndex',zh)}</span>: i${i}</p><div class="r15-terms">${paths.map((v,j)=>`<div class="r15-path"><small>o${j} → i${i}</small><p>g[${j}] × W[${j}][${i}]</p><strong>${n(tr.g[j])} × (${n(tr.w[j][i])}) = ${n(v)}</strong></div>`).join('')}</div><p class="r15-equation">dx[${i}] = ${paths.map(v=>'('+n(v)+')').join(' + ')||'0'} = <output id="backward-number">${n(dx[i])}</output></p><p class="fineprint">${say('dxNote',zh)}</p>`:`<p>${say('emptyBack',zh)}</p>`)}${card(say('backWeight',zh),`<p>${say('weightNote',zh)}</p>${matrix(dw,o,i,tr)}${tr.x.length&&tr.g.length?`<p class="r15-equation">dw[${o}][${i}] = ${n(tr.g[o])} × (${n(tr.x[i])}) = ${n(dw[o][i])}</p>`:''}`)}${card(say('backBias',zh),`<p>db = ${code(vector(db))}</p>${tr.g.length?`<p>db[${o}] = g[${o}] × 1 = ${code(db[o])}</p>`:`<p>${say('emptyBack',zh)}</p>`}`)}<p>${say('gradients',zh)}</p>${result('linear-backward-output',tr.output,zh)}`;
}
export function renderMse(tr,i=0,zh=false){
 const p=tr.p[i],target=tr.t[i],other=tr.squares.reduce((a,b)=>a+b,0)-tr.squares[i],xmin=Math.min(p,target)-2,xmax=Math.max(p,target)+2;
 const points=Array.from({length:81},(_,j)=>{const z=xmin+(xmax-xmin)*j/80;return [z,(other+(z-target)**2)/tr.n];});points.push([target,other/tr.n],[p,tr.loss]);points.sort((a,b)=>a[0]-b[0]);
 return `<p>n = ${tr.n}; <span>${say('loss',zh)}</span>: ${code(tr.loss)}</p><div class="r15-three">${card(say('residual',zh),`<p>p[${i}] − t[${i}]</p><p>${n(p)} − (${n(target)}) = ${code(tr.residuals[i])}</p>`)}${card(say('square',zh),`<p>r² = (${n(tr.residuals[i])})²</p><p>${code(tr.squares[i])}</p>`)}${card(say('gradient',zh),`<p>2r / n</p><p>2 × (${n(tr.residuals[i])}) / ${tr.n} = <output id="mse-number">${n(tr.output[i])}</output></p>`)}</div>${chart(points,[[p,tr.loss]],say('mseCurve',zh),'p',zh,false,target)}<p class="r15-key"><span class="r15-key-dot"></span> p[${i}] = ${n(p)}; t[${i}] = ${n(target)}; L = ${n(tr.loss)}</p><p>${say('mseLegend',zh)}</p><p class="fineprint">${say('mseOther',zh)}</p><p class="lesson-warning">${say(tr.output[i]>0?'positive':tr.output[i]<0?'negative':'zeroGrad',zh)}</p>${table(['i',say('pred',zh),say('target',zh),'r','r²',say('grad',zh)],tr.p.map((v,j)=>[j,v,tr.t[j],tr.residuals[j],tr.squares[j],tr.output[j]]),say('mseTable',zh))}<p>${say('repeat',zh)}</p>${result('mse-gradient-output',tr.output,zh)}`;
}
export function renderRelu(tr,i=2,zh=false){
 if(!tr.x.length)return `<p>${say('emptyRelu',zh)}</p>${result('relu-backward-output',[],zh)}`;
 return `<div class="r15-gate-flow">${card(say('incoming',zh),`<p>g[${i}]</p><strong>${n(tr.g[i])}</strong>`)}<span class="r15-arrow" aria-hidden="true">→</span>${card(say('gate',zh),`<p>x[${i}] = ${n(tr.x[i])}</p><strong>${say(tr.mask[i]?'open':'closed',zh)}</strong><p>mask = ${tr.mask[i]}</p>`,tr.mask[i]?'r15-open':'r15-closed')}<span class="r15-arrow" aria-hidden="true">→</span>${card(say('outgoing',zh),`<p>dx[${i}] = g[${i}] × mask</p><strong><output id="relu-number">${n(tr.output[i])}</output></strong>`)}</div><p>${say('reluNote',zh)}</p><p class="lesson-warning">${say('zeroRule',zh)}</p>${table(['i','x[i]','ReLU(x[i])',say('mask',zh),'g[i]','dx[i]'],tr.x.map((v,j)=>[j,v,tr.forward[j],tr.mask[j],tr.g[j],tr.output[j]]),say('reluTable',zh))}${result('relu-backward-output',tr.output,zh)}`;
}
export function renderCentral(tr,kind='cubic',zh=false){
 const def=scalarFunctions[kind],analytical=def.derivative(tr.x),points=Array.from({length:81},(_,i)=>{const delta=(-2+4*i/80)*tr.h;return [delta,def.fn(tr.x+delta)];});
 return `<p>${code(def.formula)}; x = ${code(tr.x)}; h = ${code(tr.h)}</p><div class="r15-two">${card(say('left',zh),`<p>x − h = <samp>${esc(String(tr.x-tr.h))}</samp></p><p>f(x − h) = <samp>${esc(String(tr.minus))}</samp></p>`)}${card(say('right',zh),`<p>x + h = <samp>${esc(String(tr.x+tr.h))}</samp></p><p>f(x + h) = <samp>${esc(String(tr.plus))}</samp></p>`)}</div>${chart(points,[[tr.h,tr.plus],[-tr.h,tr.minus]],say('centralCurve',zh),'δ',zh,true)}<p>${say('offset',zh)}</p><p class="r15-key"><span class="r15-key-dot"></span><span class="r15-key-dot r15-purple"></span> ${say('secant',zh)}</p>${card(say('arithmetic',zh),`<p>Δf = ${esc(String(tr.plus))} − (${esc(String(tr.minus))}) = ${code(tr.numerator)}</p><p>Δx = 2h = ${code(tr.denominator)}</p><p class="r15-equation">Δf / Δx = <output id="central-number">${n(tr.output)}</output></p>`)}<p class="fineprint">${say('calls',zh)}</p>${analytical===null?`<p class="lesson-warning">${say('kink',zh)}</p>`:`<div class="r15-two">${card(say('analytic',zh),code(analytical))}${card(say('error',zh),code(Math.abs(tr.output-analytical)))}</div>`}${result('central-difference-output',tr.output,zh)}<p class="fineprint">${say('precision',zh)}</p>`;
}
