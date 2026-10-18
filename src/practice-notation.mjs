import {problems} from './problems.mjs';
import {mathExpression,mathTokens,mathMarkup,escapeMath,identifier} from './math-expression.mjs';
import {typesetMathText} from './lesson-notation.mjs';
import {typesetFormulaCards} from './formula-cards.mjs';
import {specialExpressions} from './practice-notation-special.mjs';
import {typesetGateCalculation} from './gate-statement.mjs';

// These are expressions in the existing contracts, not inferred new formulas.
export const practiceExpressions={
  'stable-softmax':['exp(value / temperature)'],
  'kalman-scalar-update':['K = variance / (variance + measurement_variance)','updated_mean = mean + K * (observation - mean)','updated_variance = (1 - K) * variance'],
  'linear-dynamics-rollout':['x_next = a * x_current + b * action'],
  'world-model-action':['sum(gamma ** t * cost[t])'],
  'llm-mean-reciprocal-rank':['1/r'],
  'foundation-nstep-return':['gamma**t * rewards[t]','gamma**len(rewards) * bootstrap_value'],
  'risk-sensitive-planner':['means[action] + risk_weight * sqrt(variances[action])','sqrt(variance)'],
  'agent-exponential-backoff':['min(max_delay, base_delay * 2**(n-1))'],
  'world-discrete-bayes-filter':['transition[i][j]','likelihood[j]'],
  'world-belief-propagation':['mean = a*mean + u','variance = (a*a)*variance + process_var'],
  'world-diagonal-gaussian-kl':['0.5 * sum(log(p_var/q_var) + (q_var + (q_mean-p_mean)**2)/p_var - 1)'],
  'vae-reparameterization':['mean[i] + exp(0.5 * logvar[i]) * epsilon[i]'],
  'vae-standard-normal-kl':['0.5 * sum(exp(logvar[i]) + mu[i]**2 - 1 - logvar[i])'],
  'vae-beta-objective':['beta * sum(kl_per_dim)'],
  'vqvae-nearest-code':['sum((vector[d]-code[d])**2)'],
  'vqvae-codebook-perplexity':['p[k] = occurrences(k)/len(indices)','log(0)'],
  'vqvae-quantization-error':['N*D'],
  'flow-linear-interpolation':['xt[d] = (1-t)*x0[d] + t*x1[d]'],
  'flow-velocity-regression':['(prediction[d] - target[d])**2','x1-x0'],
  'flow-cfg-velocity':['u + guidance_scale*(c-u)','scale=0','scale=1'],
  'video-temporal-difference-loss':['(pred[t][d]-pred[t-1][d])','(target[t][d]-target[t-1][d])','(T-1)*D'],
  'video-token-cross-entropy':['-log(probabilities[t][targets[t]])'],
  'foundation-layer-normalization':['mean=sum(x)/len(x)','(v-mean)/sqrt(variance+eps)'],
  'foundation-gelu':['x * 0.5 * (1 + erf(x/sqrt(2)))'],
  'foundation-sinusoidal-positions':['angle=position / (10000 ** (2*i/d_model))','d_model/2-1'],
  'attention-scaled-dot-product':['scores = dot(q,key)/sqrt(dₖ)'],
  'attention-split-heads':['d_model/n_heads'],
  'transformer-cross-attention':['sqrt(d_k)'],
  'vit-class-token':['row0=cls_token+positions[0]','patches[i]+positions[i+1]'],
  'transformer-prenorm-residual':['x + sublayer(normalize(x))'],
  'gan-discriminator-bce':['softplus(-real_logit) + softplus(fake_logit)'],
  'gan-generator-nonsaturating':['softplus(-fake_logit)','-log(sigmoid(fake_logit))'],
  'gan-gradient-penalty':['(sqrt(sum(g_i*g_i)) - 1)**2'],
  'diffusion-linear-beta':['beta[t]=beta_start+(beta_end-beta_start)*t/(steps-1)'],
  'diffusion-alpha-bar':['alpha_t=1-beta_t'],
  'diffusion-forward-sampling':['sqrt(alpha_bar)*x0[i] + sqrt(1-alpha_bar)*noise[i]'],
  'diffusion-noise-mse':['(predicted[i]-target[i])**2'],
  'diffusion-reconstruct-x0':['x0_hat=(xt - sqrt(1-alpha_bar)*eps)/sqrt(alpha_bar)','alpha_bar=1'],
  'diffusion-ddpm-posterior':['alpha_bar_t=alpha_t*alpha_bar_prev','beta_t=1-alpha_t','denom=1-alpha_t*alpha_bar_prev','coeff_x0*x0 + coeff_xt*xt','coeff_x0=beta_t*sqrt(alpha_bar_prev)/denom','coeff_xt=sqrt(alpha_t)*(1-alpha_bar_prev)/denom'],
  'diffusion-cfg-epsilon':['eps_uncond + guidance_scale * (eps_cond-eps_uncond)'],
  'diffusion-classifier-guidance':['mean[i] + scale*variance[i]*log_prob_gradient[i]'],
  'diffusion-ddim-deterministic':['x0_hat = (xt-sqrt(1-alpha_bar_t)*eps_hat)/sqrt(alpha_bar_t)','sqrt(alpha_bar_prev)*x0_hat + sqrt(1-alpha_bar_prev)*eps_hat'],
  'dit-adaln-modulation':['y=LN(x)*(1+scale)+shift','sqrt(var+eps)','normalized_x[i]*(1+scale[i])+shift[i]'],
  'dit-adaln-zero-gate':['y[i] = x[i] + gate[i]*block_output[i]'],
  'cnn-valid-convolution':['(H-Kh+1)','(W-Kw+1)','image[i+a][j+b]*kernel[a][b]'],
  'cnn-pointwise-projection':['out[o][i][j]=biases[o]+sum(weights[o][c]*channels[c][i][j])'],
  'cnn-max-pooling':['floor(H/2)','floor(W/2)'],
  'norm-batch-training':['gamma[j]*(x-mean[j])/sqrt(var[j]+eps)+beta[j]'],
  'norm-batch-inference':['y=gamma*(x-running_mean)/sqrt(running_var+eps)+beta'],
  'norm-rmsnorm':['x[i]/rms'],
  'norm-rmsnorm-gain':['y[i]=gain[i]*x[i]/sqrt(mean(x**2)+eps)'],
  'autograd-linear-forward':['y[o]=sum(weights[o][i]*x[i])+biases[o]'],
  'autograd-relu-backward':['x[i]>0','x[i]<=0'],
  'autograd-mse-gradient':['(1/n)*sum((pred-target)**2)','2*(predictions[i]-targets[i])/n'],
  'autograd-linear-backward':['dx[i]=sum(weights[o][i]*upstream[o])','dw[o][i]=upstream[o]*x[i]','db[o]=upstream[o]'],
  'autograd-central-difference':['(f(x+h)-f(x-h))/(2*h)'],
  'optimizer-sgd-momentum':['new_velocity=momentum*velocity+grad','param-lr*new_velocity'],
  'optimizer-adam-bias-correction':['m_hat=m/(1-beta1**step)','v_hat=v/(1-beta2**step)'],
  'optimizer-adamw-update':['m_new=beta1*m+(1-beta1)*g','v_new=beta2*v+(1-beta2)*g*g','p_new=p*(1-lr*weight_decay)-lr*m_hat/(sqrt(v_hat)+eps)'],
  'optimizer-global-norm-clipping':['max_norm/norm'],
  'rope-rotate-pair':['x*cos(angle)-y*sin(angle)','x*sin(angle)+y*cos(angle)'],
  'rope-position-encoding':['angle = p/(base ** (2*i/D))'],
  'transformer-swiglu':['SiLU(g)=g/(1+exp(-g))','x[i]*SiLU(gate[i])'],
  'diffusion-ddpm-stochastic-step':['mean+sqrt(variance)*noise'],
  'gan-discriminator-logit-gradients':['softplus(-real_logit)+softplus(fake_logit)','sigmoid(real_logit)-1','sigmoid(fake_logit)'],
  'rlef-shaped-turn-reward':['base - beta * mean(policy_logps[i] - reference_logps[i])'],
  'constitutional-soft-preference':['p_a=exp(logp_a)/(exp(logp_a)+exp(logp_b))','p_a=min(0.6,max(0.4,p_a))','1-p_a'],
  'constitutional-preference-loss':['d=scores_a[i]-scores_b[i]','p=sigmoid(d)','-target*log(p)-(1-target)*log(1-p)']
};
const quote=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const decode=s=>s.replace(/&(amp|lt|gt|quot|#39);/g,(_,s)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[s]));
const catalog=new Map();
for(const id of new Set([...Object.keys(practiceExpressions),...Object.keys(specialExpressions)])){
  if(!problems.some(p=>p.id===id))throw Error('Unknown notation problem: '+id);
  const candidates=(practiceExpressions[id]||[]).map(original=>({original,body:mathExpression(original),tokens:mathTokens(original)}));
  for(const[original,body]of Object.entries(specialExpressions[id]||{}))candidates.push({original,body,tokens:original.match(/[a-zA-Zα-ωΑ-Ω_][a-zA-Z0-9_α-ωΑ-Ω₀₁₂₃₄₅₆₇₈₉ᵢⱼₖₜ]*|\d+(?:\.\d+)?|\*\*|<=|>=|[^\s]/g)});
  candidates.sort((a,b)=>b.original.length-a.original.length);
  const byKey=new Map(candidates.map(c=>[c.original.replace(/\s/g,''),c.body]));
  const pattern=new RegExp(`(?<![a-zA-Z0-9_])(?:${candidates.map(c=>c.tokens.map(t=>quote(escapeMath(t))).join('\\s*')+(/[a-zA-Z0-9_]$/.test(c.tokens.at(-1))?'(?![a-zA-Z0-9_])':'')).join('|')})`,'g');
  catalog.set(id,{pattern,byKey});
}
const atoms=['alpha_bar_prev','alpha_bar_t','alpha_bar','alpha_t','beta_t','eps_uncond','eps_cond','eps_hat','x0_hat','m_hat','v_hat','beta1','beta2','d_k','d_v','xt','μᵢ²','μ²','σ²','m²','gₜ²','μᵢ','σᵢ','εᵢ','zᵢ','xᵢ','yᵢ','mₜ','vₜ','β₁ᵗ','β₂ᵗ','β₁','β₂','x₁','x0','x1'].sort((a,b)=>b.length-a.length);
const atomPattern=new RegExp(`(?<![a-zA-Z0-9_])(?:${atoms.map(quote).join('|')})(?![a-zA-Z0-9_])`,'g');
const atomBody=s=>identifier(s==='x0'?'x₀':s==='x1'?'x₁':s);
export function typesetPracticePage(html,path){
  const match=/^\/(problems|editorials)\/([^/]+)\/$/.exec(path);
  if(!match||!problems.some(p=>p.id===match[2]))return html;
  if(match[1]==='problems'&&match[2]==='dit-adaln-zero-gate')html=typesetGateCalculation(html);
  html=typesetFormulaCards(html,match[2]);
  const start=html.indexOf('<main '),end=html.indexOf('</main>',start);if(start<0||end<0)return html;
  const entry=catalog.get(match[2]);
  let skip=null;
  let body=html.slice(start,end).split(/(<[^>]+>)/g).map(token=>{
    if(token.startsWith('<')){const tag=/^<\/?([a-z0-9-]+)/i.exec(token)?.[1]?.toLowerCase();
      if(/^<\//.test(token)&&tag===skip)skip=null;
      else if(!skip&&!/^<\//.test(token)&&['script','style','pre','code','textarea','svg','math','select','output'].includes(tag))skip=tag;
      return token;
    }
    if(skip)return token;
    // One pass per original text fragment avoids matching newly generated markup.
    if(entry)token=token.replace(entry.pattern,original=>mathMarkup(entry.byKey.get(decode(original).replace(/\s/g,'')),decode(original)));
    return token.split(/(<math\b[\s\S]*?<\/math>)/g).map(part=>part.startsWith('<math')?part:typesetMathText(part.replace(atomPattern,s=>mathMarkup(atomBody(s),s)))).join('');
  }).join('');
  body=body.replace(/class="editorial-body(?: flow-readable)?"/,'class="editorial-body practice-readable"');
  html=html.slice(0,start)+body+html.slice(end);
  return html;
}
