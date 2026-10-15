import {mathExpression as E,identifier as I,escapeMath} from './math-expression.mjs';
const r=(...s)=>`<mrow>${s.join('')}</mrow>`,op=s=>`<mo>${escapeMath(s)}</mo>`,frac=(a,b)=>`<mfrac>${a}${b}</mfrac>`;
const sum=(low,high,value)=>r(high?`<munderover>${op('∑')}${low}${high}</munderover>`:`<munder>${op('∑')}${low}</munder>`,value);
const equals=(a,b)=>r(a,op('='),b),sub=(a,b)=>`<msub>${a}${b}</msub>`;
export const specialExpressions={
 'foundation-matmul':{
  'output[i][j] = sum(a[i][t]*b[t][j] for t in range(k))':equals(E('output[i][j]'),sum(E('t=0'),E('k-1'),E('a[i][t]*b[t][j]')))
 },
 'foundation-layer-normalization':{
  'variance=sum((v-mean)**2)/len(x)':equals(I('variance'),frac(sum(I('i'),null,E('(x[i]-mean)**2')),E('len(x)')))
 },
 'norm-rmsnorm':{
  'rms=sqrt(sum(v*v for v in x)/len(x)+eps)':equals(I('rms'),`<msqrt>${r(frac(sum(I('i'),null,E('x[i]**2')),E('len(x)')),op('+'),I('eps'))}</msqrt>`)
 },
 'vqvae-codebook-perplexity':{
  'perplexity = exp(-sum(p[k]*log(p[k]) for p[k]>0))':equals(I('perplexity'),r(I('exp'),op('('),op('−'),sum(r(I('k'),op(':'),E('p[k]>0')),null,E('p[k]*log(p[k])')),op(')')))
 },
 'rlef-undiscounted-advantages':{
  'advantages[t] = sum(rewards[t:]) - values[t]':equals(E('advantages[t]'),r(sum(E('j=t'),E('len(rewards)-1'),E('rewards[j]')),op('−'),E('values[t]')))
 },
 'world-discrete-bayes-filter':{
  'predicted[j] = sum_i belief[i] * transition[i][j]':equals(E('predicted[j]'),sum(I('i'),null,E('belief[i]*transition[i][j]'))),
  'posterior[j] ∝ predicted[j] * likelihood[j]':r(E('posterior[j]'),op('∝'),E('predicted[j]*likelihood[j]'))
 },
 'linear-dynamics-rollout':{
  'x_(t+1) = a*x_t + b*u_t':equals(sub(I('x'),E('t+1')),E('a*x_t+b*u_t'))
 },
 'world-belief-propagation':{
  'x_(t+1) = a*x_t + u_t + noise':equals(sub(I('x'),E('t+1')),E('a*x_t+u_t+noise'))
 },
 'autograd-linear-backward':{
  'y=Wx+b':E('y=W*x+b'),
  'dL/dy':frac(r(I('d'),I('L')),r(I('d'),I('y')))
 },
 'attention-scaled-dot-product':{
  'softmax(QKᵀ/√dₖ)V':r(I('softmax'),op('('),frac(r(I('Q'),`<msup>${I('K')}<mi mathvariant="normal">T</mi></msup>`),`<msqrt>${I('dₖ')}</msqrt>`),op(')'),I('V'))
 },
 'vae-reparameterization':{
  '∂z/∂μ = 1':equals(frac(r(op('∂'),I('z')),r(op('∂'),I('μ'))),E('1')),
  '∂z/∂logvar = 0.5 × exp(logvar/2) × epsilon':equals(frac(r(op('∂'),I('z')),r(op('∂'),I('logvar'))),E('0.5*exp(logvar/2)*epsilon'))
 },
 'vae-standard-normal-kl':{
  'KLᵢ = μᵢ²/2 + (vᵢ − 1 − ln(vᵢ))/2':E('KL_i=μ_i**2/2+(v_i-1-ln(v_i))/2')
 }
};
