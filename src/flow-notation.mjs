// Presentation only: exact expressions are recoverable through data-notation.
// Scope is deliberately limited to the three checked Flow exercises.
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mi = s => `<mi>${s}</mi>`, mn = s => `<mn>${s}</mn>`, mo = s => `<mo>${s}</mo>`;
const r = (...s) => `<mrow>${s.join('')}</mrow>`;
const sub = (a,b) => `<msub>${a}${b}</msub>`;
const frac = (a,b) => `<mfrac>${a}${b}</mfrac>`;
const par = a => r(mo('('),a,mo(')'));
const x=mi('x'),t=mi('t'),h=mi('h'),S=mi('S'),one=mn(1);
const x0=sub(x,mn(0)),x1=sub(x,mn(1)),xt=sub(x,t);
const k1=sub(mi('k'),mn(1)),k2=sub(mi('k'),mn(2));
const pred=`<mover accent="true">${x}<mo>~</mo></mover>`;
const v = (a,b) => r(mi('v'),par(r(a,mo(','),b)));
const eq = (a,b) => [a,r(mo('='),b)];
const deriv = a => frac(r(`<mi mathvariant="normal">d</mi>`,a),r(`<mi mathvariant="normal">d</mi>`,t));
const math = (content,original='',block=false) => `<math xmlns="http://www.w3.org/1998/Math/MathML" class="lesson-math flow-math${block?' flow-math-block':''}"${block?' display="block"':''}${original?` data-notation="${escape(original)}"`:''}><mstyle displaystyle="${block}">${content}</mstyle></math>`;
const aligned = rows => `<mtable columnalign="right left" columnspacing="0.65em" rowspacing="0.65em">${rows.map(row=>`<mtr>${row.map(c=>`<mtd>${c}</mtd>`).join('')}</mtr>`).join('')}</mtable>`;
const velocity = r(`<mi mathvariant="normal">velocity</mi>`,par(r(x,mo(','),t)));
const predictor = r(x,mo('+'),h,k1), corrector=r(x,mo('+'),frac(h,mn(2)),par(r(k1,mo('+'),k2)));
const legacy = {
  'x0':x0, 'x1':x1, 'x_pred':pred, 'k1':k1, 'k2':k2,
  'x₁':x1, 'k₁':k1, 'k₂':k2, 'v(x,t)':v(x,t),
  'dx/dt = velocity(x,t)':r(deriv(x),mo('='),velocity),
  'x_t = (1-t)*x0 + t*x1':r(xt,mo('='),par(r(one,mo('−'),t)),x0,mo('+'),t,x1),
  'dx_t/dt = x1 - x0':r(deriv(xt),mo('='),x1,mo('−'),x0),
  't=0':r(t,mo('='),mn(0)), 't=1':r(t,mo('='),one),
  '(x,t) -> float':r(par(r(x,mo(','),t)),mo('↦'),`<mi mathvariant="normal">float</mi>`),
  '(x,t)':par(r(x,mo(','),t)),
};
const algorithmExpressions = {
  'k1=v(x,t)、x_pred=x+dt*k1、k2=v(x_pred,t+dt)':aligned([eq(k1,v(x,t)),eq(pred,predictor),eq(k2,v(pred,r(t,mo('+'),h)))]),
  'k1=v(x,t), x_pred=x+dt*k1, k2=v(x_pred,t+dt)':aligned([eq(k1,v(x,t)),eq(pred,predictor),eq(k2,v(pred,r(t,mo('+'),h)))]),
  'x <- x + dt*(k1+k2)/2':r(x,mo('←'),corrector),
  'dt=1/steps':r(h,mo('='),frac(one,S)),
  'v(x, i*dt)':v(x,r(mi('i'),h)),
  'x <- x + dt*v':r(x,mo('←'),x,mo('+'),h,mi('v')),
};
for(const original of Object.keys(algorithmExpressions))if(original.startsWith('k1=v('))algorithmExpressions[original+(original.includes('、')?'。':'.')]=algorithmExpressions[original];
const entries=Object.entries({...legacy,...algorithmExpressions}).sort((a,b)=>b[0].length-a[0].length);
const pattern=new RegExp(entries.map(([s])=>escape(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
const expressions=Object.fromEntries(entries.map(([original,body])=>[escape(original),{original,body}]));
const format = text => text.replace(pattern, encoded => {const {original,body}=expressions[encoded];return math(body,original,original.startsWith('k1=v('));});
const xi=sub(x,mi('i')),ti=sub(t,mi('i')),next=sub(x,r(mi('i'),mo('+'),one));
function formula(kind){
  if(kind==='flow-conditional-velocity')return aligned([
    eq(xt,r(par(r(one,mo('−'),t)),x0,mo('+'),t,x1)),
    eq(deriv(xt),r(x1,mo('−'),x0))
  ]);
  const rows=[eq(h,frac(one,S)),eq(ti,r(mi('i'),h)),eq(k1,v(xi,ti))];
  if(kind==='flow-heun-integration')rows.push(eq(pred,r(xi,mo('+'),h,k1)),eq(k2,v(pred,r(ti,mo('+'),h))),eq(next,r(xi,mo('+'),frac(h,mn(2)),par(r(k1,mo('+'),k2)))));
  else rows.push(eq(next,r(xi,mo('+'),h,k1)));
  return aligned(rows);
}
const ids=['flow-conditional-velocity','flow-euler-integration','flow-heun-integration'];
export function typesetFlowPage(html,path){
  const id=ids.find(id=>path===`/editorials/${id}/`||path===`/problems/${id}/`);
  if(!id)return html;
  const zh=html.includes('<html lang="zh-CN">');
  html=html.replace('<section class="editorial-body">','<section class="editorial-body flow-readable">');
  // Replace only the authored static equation card. Dynamic numeric tables stay numeric.
  html=html.replace(/<div class="lesson-formula"><code>[\s\S]*?<\/code><\/div>/,()=>`<div class="lesson-formula flow-equations">${math(formula(id),'',true)}</div>`);
  const start=html.indexOf('<main '),end=html.indexOf('</main>',start);
  if(start<0||end<0)return html;
  let skip=null;
  const body=html.slice(start,end).split(/(<[^>]+>)/g).map(token=>{
    if(token.startsWith('<')){
      const tag=/^<\/?([a-z0-9-]+)/i.exec(token)?.[1]?.toLowerCase();
      if(/^<\//.test(token)&&tag===skip)skip=null;
      else if(!skip&&!/^<\//.test(token)&&['script','style','pre','code','textarea','svg','math','select','output'].includes(tag))skip=tag;
      return token;
    }
    return skip?token:format(token);
  }).join('');
  html=html.slice(0,start)+body+html.slice(end);
  const note=zh
    ? `${math(mi('v'))} 表示 <code>velocity</code>，步长 ${math(h)} 对应 <code>dt</code>，步数 ${math(S)} 对应 <code>steps</code>${id==='flow-heun-integration'?`；${math(pred)} 是临时预测值`:''}。`
    : `${math(mi('v'))} denotes <code>velocity</code>; step size ${math(h)} is <code>dt</code>, and step count ${math(S)} is <code>steps</code>${id==='flow-heun-integration'?`; ${math(pred)} is the temporary predictor`:''}.`;
  html=html.replace('<ul class="req-list">',`${id==='flow-conditional-velocity'?'':`<p class="flow-symbol-key">${note}</p>`}<ul class="req-list flow-contract">`);
  return html;
}
