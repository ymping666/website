import {formatNumber as f,formatVector as vector} from './lesson-math.mjs';
import {fields,solverComparison} from './lesson-round9-math.mjs';
export const round9Translations={};
export const t=(en,zh)=>{round9Translations[en]=zh;return en;};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={
  positions:t('Positions along the fixed endpoint pair','固定端点对上的位置'),
  positionNote:t('Purple circle: x₀. Blue circle: x₁. Green square: xₜ. Each row uses the same position scale. Changing t moves xₜ but leaves the velocity target unchanged.','紫色圆点：x₀；蓝色圆点：x₁；绿色方块：xₜ。各行共用同一位置尺度。改变 t 会移动 xₜ，但不会改变目标速度。'),
  empty:t('Empty endpoints have no coordinates to draw; the function returns an empty list.','空端点没有可绘制坐标，函数返回空列表。'),
  velocity:t('Function output: velocity per unit t','函数输出：每单位 t 的速度'),
  trajectory:t('Numerical trajectory and analytic solution','数值轨迹与解析解'),
  curveNote:t('Green: numerical states joined by straight segments. Purple dashed curve: analytic solution of the supplied toy ODE. Orange ring: Heun predictor for the inspected step. The joins do not define a continuous solver output.','绿色：以线段连接的数值状态；紫色虚线：给定示例 ODE 的解析解；橙色空心点：所查看 Heun 步骤的预测值。连接线不代表求解器的连续输出。'),
  eulerCurveNote:t('Green: numerical states joined by straight segments. Purple dashed curve: analytic solution of the supplied toy ODE. The joins do not define a continuous solver output.','绿色：以线段连接的数值状态；紫色虚线：给定示例 ODE 的解析解。连接线不代表求解器的连续输出。'),
  selected:t('Inspect one update','查看一次更新'),
  step:t('Step','步数'),time:t('Start time','起始时间'),start:t('Start state','起始状态'),predictor:t('Predictor','预测值'),average:t('Slope used','使用的斜率'),after:t('Updated state','更新后状态'),
  trace:t('Every integration step','全部积分步骤'),exact:t('Analytic x(1)','解析解 x(1)'),error:t('Absolute endpoint error','终点绝对误差'),calls:t('Velocity calls','速度场调用次数'),output:t('Function output x(1)','函数输出 x(1)'),
  compare:t('Compare step counts on the same toy ODE','在同一示例 ODE 上比较步数'),
  budget:t('Rows use equal step counts, not equal evaluation budgets: Euler calls the field S times and this Heun implementation calls it 2S times. Errors measure discretization of this fixed field, not a trained generator’s quality.','每行使用相同步数，调用预算并不相同：Euler 调用 S 次速度场，本题 Heun 实现调用 2S 次。误差衡量对固定速度场的离散化效果，不代表训练后生成器的质量。'),
  eulerError:t('Euler error','Euler 误差'),heunError:t('Heun error','Heun 误差'),
  rowNote:t('The highlighted row is the inspected step. Moving the inspection control does not change the final function output.','高亮行是当前查看的步骤。移动步骤查看控件不会改变函数最终输出。')
};
const say=(k,zh)=>zh?round9Translations[labels[k]]:labels[k];
const table=(headers,rows,label,selected=-1)=>`<div class="lesson-table-scroll" role="region" tabindex="0" aria-label="${esc(label)}"><table class="lesson-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr${i===selected?' class="r9-selected"':''}>${r.map(v=>`<td><code>${esc(v)}</code></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function renderVelocity(tr,zh=false){
  const bound=Math.max(1,Math.ceil(Math.max(0,...tr.rows.flatMap(r=>[Math.abs(r.x0),Math.abs(r.x1)]))));
  const px=x=>260+x*180/bound;
  const plot=tr.rows.length?`<figure class="r7-chart" tabindex="0"><figcaption>${say('positions',zh)}</figcaption><svg viewBox="0 0 540 ${60+tr.rows.length*68}" role="img" aria-label="${say('positions',zh)}">${[-bound,0,bound].map(v=>`<text x="${px(v)}" y="20" text-anchor="middle">${f(v)}</text>`).join('')}${tr.rows.map(r=>{const y=52+r.i*68;return `<text x="12" y="${y+5}">${r.i}</text><line x1="80" x2="440" y1="${y}" y2="${y}" stroke="#e3e8e5"/><line x1="${px(r.x0)}" x2="${px(r.x1)}" y1="${y}" y2="${y}" stroke="#a1b7ab" stroke-width="3"/><circle cx="${px(r.x0)}" cy="${y}" r="8" fill="#8558ad"/><circle cx="${px(r.x1)}" cy="${y}" r="6" fill="#526fae"/><rect x="${px(r.position)-4}" y="${y-4}" width="8" height="8" fill="#147d64"/><text x="80" y="${y+27}">x₀=${f(r.x0)} → xₜ=${f(r.position)} → x₁=${f(r.x1)}</text>`;}).join('')}</svg></figure><p class="fineprint">${say('positionNote',zh)}</p>`:`<p>${say('empty',zh)}</p>`;
  return `${plot}${table(['i','x₀','x₁','(1−t) × x₀','t × x₁','xₜ','dxₜ/dt'],tr.rows.map(r=>[r.i,...['x0','x1','startPart','endPart','position','velocity'].map(k=>f(r[k]))]),say('positions',zh))}<p role="status"><span>${say('velocity',zh)}</span>: <output id="flow-target-output">${vector(tr.output)}</output></p>`;
}
function trajectory(tr,selected,zh){
  const exactPoints=Array.from({length:101},(_,i)=>({t:i/100,x:fields[tr.field].exact(tr.x0,i/100)}));
  const states=[{t:0,x:tr.x0},...tr.rows.map(r=>({t:r.endTime,x:r.after}))],r=tr.rows[selected-1];
  const all=[...states.map(p=>p.x),...exactPoints.map(p=>p.x),...(tr.method==='heun'?[r.predicted]:[])];
  const lo=Math.min(...all),hi=Math.max(...all),pad=Math.max(.5,(hi-lo)*.1),min=lo-pad,max=hi+pad;
  const ticks=lo===hi?[lo-.5,lo,lo+.5]:[lo,(lo+hi)/2,hi];
  const px=t=>74+t*410,py=x=>240-(x-min)*200/(max-min);
  return `<figure class="r7-chart" tabindex="0"><figcaption>${say('trajectory',zh)}</figcaption><svg viewBox="0 0 560 300" role="img" aria-label="${say('trajectory',zh)}"><text x="18" y="25">x</text>${ticks.map(x=>`<line x1="74" x2="484" y1="${py(x)}" y2="${py(x)}" stroke="#e3e8e5"/><text x="65" y="${py(x)+5}" text-anchor="end">${f(Math.round(x*100)/100)}</text>`).join('')}${[0,.25,.5,.75,1].map(t=>`<text x="${px(t)}" y="273" text-anchor="middle">${t}</text>`).join('')}<text x="510" y="273">t</text><polyline points="${exactPoints.map(p=>`${px(p.t)},${py(p.x)}`).join(' ')}" fill="none" stroke="#8558ad" stroke-width="3" stroke-dasharray="6 4"/><polyline points="${states.map(p=>`${px(p.t)},${py(p.x)}`).join(' ')}" fill="none" stroke="#147d64" stroke-width="2"/>${states.map(p=>`<circle cx="${px(p.t)}" cy="${py(p.x)}" r="4" fill="#147d64"/>`).join('')}<line x1="${px(r.t)}" x2="${px(r.endTime)}" y1="${py(r.x)}" y2="${py(r.after)}" stroke="#147d64" stroke-width="5"/>${tr.method==='heun'?`<line x1="${px(r.t)}" x2="${px(r.endTime)}" y1="${py(r.x)}" y2="${py(r.predicted)}" stroke="#b35c1e" stroke-dasharray="4 4"/><circle cx="${px(r.endTime)}" cy="${py(r.predicted)}" r="7" fill="none" stroke="#b35c1e" stroke-width="3"/>`:''}</svg></figure><p class="fineprint">${say(tr.method==='heun'?'curveNote':'eulerCurveNote',zh)}</p>`;
}
export function renderSolver(tr,selected=1,zh=false){
  const r=tr.rows[selected-1],heun=tr.method==='heun';
  const headers=[say('step',zh),'t','x','k₁',...(heun?[say('predictor',zh),'k₂']:[]),say('average',zh),say('after',zh)];
  const cells=r=>[r.step,f(r.t),f(r.x),f(r.k1),...(heun?[f(r.predicted),f(r.k2)]:[]),f(r.slope),f(r.after)];
  const comparison=solverComparison(tr.x0,tr.field);
  return `${trajectory(tr,selected,zh)}<h3>${say('selected',zh)}</h3><p><code>h = ${f(tr.h)}; t = ${f(r.t)} → ${f(r.endTime)}</code></p>${table(headers,[cells(r)],say('selected',zh))}<p role="status"><span>${say('output',zh)}</span>: <output id="flow-solver-output">${f(tr.output)}</output> · <span>${say('calls',zh)}</span>: <output id="flow-solver-calls">${tr.calls.length}</output></p><p><span>${say('exact',zh)}</span>: ${f(tr.exact)} · <span>${say('error',zh)}</span>: <output id="flow-solver-error">${f(tr.error)}</output></p><h3>${say('trace',zh)}</h3><p class="fineprint">${say('rowNote',zh)}</p>${table(headers,tr.rows.map(cells),say('trace',zh),selected-1)}<h3>${say('compare',zh)}</h3>${table(['S','Euler x(1)','Heun x(1)',say('eulerError',zh),say('heunError',zh),'Euler NFE','Heun NFE'],comparison.map(r=>[r.steps,f(r.euler),f(r.heun),f(r.eulerError),f(r.heunError),r.eulerCalls,r.heunCalls]),say('compare',zh))}<p class="fineprint">${say('budget',zh)}</p>`;
}
