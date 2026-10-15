import {mathExpression as E,identifier as I,mathMarkup} from './math-expression.mjs';
const op=s=>`<mo>${s}</mo>`,num=n=>`<mn>${n}</mn>`,r=(...s)=>`<mrow>${s.join('')}</mrow>`;
const par=s=>r(op('('),s,op(')')),frac=(a,b)=>`<mfrac>${a}${b}</mfrac>`,square=s=>`<msup>${s}${num(2)}</msup>`;
const sub=(a,b)=>`<msub>${a}${b}</msub>`,hat=a=>`<mover accent="true">${a}<mo>^</mo></mover>`;
const sum=(index,value)=>r(`<munder>${op('∑')}${index}</munder>`,value);
const eq=(a,b)=>[a,r(op('='),b)];
const rows=lines=>`<mtable>${lines.map(line=>`<mtr>${line.map(cell=>`<mtd>${cell}</mtd>`).join('')}</mtr>`).join('')}</mtable>`;
const expressionRows=lines=>lines.map(line=>{const i=line.indexOf('=');return eq(E(line.slice(0,i)),E(line.slice(i+1)));});
const cases=lines=>r(op('{'),rows(lines));
const pk=I('p_k'),mu=I('μ_i'),sigma=I('σ_i'),lv=I('logvar_i'),ki=I('KL_i');
const beta1=I('β₁'),beta2=I('β₂'),mt=I('m_t'),vt=I('v_t'),gt=I('g_t');
export const formulaCards={
 'attention-causal-mask':rows([eq(E('masked[i][j]'),cases([[E('logits[i][j]'),E('j <= i')],[r(op('−'),op('∞')),E('j > i')]]))]),
 'flow-linear-interpolation':rows(expressionRows(['x_t=(1-t)*x0+t*x1'])),
 'foundation-layer-normalization':rows([
  eq(I('mean'),frac(sum(I('i'),E('x[i]')),I('d'))),
  eq(I('variance'),frac(sum(I('i'),E('(x[i]-mean)**2')),I('d'))),
  eq(I('y_i'),E('(x[i]-mean)/sqrt(variance+eps)'))]),
 'optimizer-sgd-momentum':rows(expressionRows(['v_new=μ*v_old+g','param_new=param_old-lr*v_new'])),
 'optimizer-adam-bias-correction':rows([
  eq(mt,r(beta1,sub(I('m'),E('t-1')),op('+'),par(r(num(1),op('−'),beta1)),gt)),
  eq(vt,r(beta2,sub(I('v'),E('t-1')),op('+'),par(r(num(1),op('−'),beta2)),square(gt))),
  eq(sub(hat(I('m')),I('t')),frac(mt,r(num(1),op('−'),`<msup>${beta1}${I('t')}</msup>`))),
  eq(sub(hat(I('v')),I('t')),frac(vt,r(num(1),op('−'),`<msup>${beta2}${I('t')}</msup>`)))]),
 'llm-topk-softmax':rows([
  eq(I('S'),E('top_k_indices(logits,k)')),
  eq(I('m'),r(`<munder>${I('max')}${r(I('j'),op('∈'),I('S'))}</munder>`,E('logits[j]'))),
  eq(I('p_i'),cases([[frac(E('exp(logits[i]-m)'),sum(r(I('j'),op('∈'),I('S')),E('exp(logits[j]-m)'))),r(I('i'),op('∈'),I('S'))],[num(0),r(I('i'),op('∉'),I('S'))]]))]),
 'diffusion-cfg-epsilon':rows(expressionRows(['delta=c-u','guided=u+s*delta','guided=(1-s)*u+s*c'])),
 'optimizer-global-norm-clipping':rows([
  eq(I('n'),`<msqrt>${sum(I('i'),square(I('g_i')))}</msqrt>`),
  eq(I('a'),cases([[E('min(1,M/n)'),E('n>0')],[num(1),E('n=0')]])),eq(E('output[i]'),E('a*g[i]'))]),
 'vae-reparameterization':rows([
  eq(I('logvar'),E('ln(σ**2)')),eq(I('σ'),E('exp(logvar/2)')),eq(I('z_i'),r(mu,op('+'),sigma,op('·'),I('ε_i')))]),
 'vae-standard-normal-kl':rows([
  eq(I('v_i'),E('exp(logvar_i)')),eq(ki,r(frac(num(1),num(2)),par(r(I('v_i'),op('+'),square(mu),op('−'),num(1),op('−'),lv)))),
  eq(r(I('KL'),par(r(I('q'),op('∥'),I('p')))),sum(I('i'),ki))]),
 'vae-beta-objective':rows([
  eq(I('R'),cases([[E('mean(reconstruction)'),E('len(reconstruction)>0')],[num(0),E('len(reconstruction)=0')]])),
  eq(I('K'),E('sum(kl_per_dim)')),eq(I('L'),E('R+β*K'))]),
 'vqvae-nearest-code':rows([
  eq(E('distance[k]'),sum(I('d'),E('(vector[d]-codebook[k][d])**2'))),
  eq(I('index'),r(`<munder>${I('argmin')}${I('k')}</munder>`,E('distance[k]')))]),
 'vqvae-codebook-perplexity':rows([
  eq(pk,E('count[k]/N')),eq(I('H'),r(op('−'),sum(r(I('k'),op(':'),pk,op('>'),num(0)),r(pk,op('·'),I('ln'),par(pk))))),eq(I('perplexity'),E('exp(H)'))]),
 'vqvae-quantization-error':rows([
  eq(I('S'),sum(I('n'),sum(I('d'),E('(encoder[n][d]-quantized[n][d])**2')))),eq(I('MSE'),E('S/(N*D)'))])
};
export function typesetFormulaCards(html,id){
  if(!formulaCards[id])return html;
  return html.replace(/<div class="lesson-formula(?: lesson-equations)?">([\s\S]*?)<\/div>/g,(original,inside)=>inside.includes('<code>')?`<div class="lesson-formula lesson-equations unified-equations">${mathMarkup(formulaCards[id],'',true)}</div>`:original);
}
