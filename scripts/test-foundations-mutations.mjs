import {pythonCommand} from './config.mjs';
// v0.9 independent plausibly incorrect implementation checks.
// Purpose: catch well-defined conceptual errors, not just empty stubs.
import {problems} from '../src/problems.mjs';
import {spawnSync} from 'node:child_process';
const wrong={
 'foundation-matmul':`def matmul(a,b):\n    return [[x*y for x,y in zip(row,b[0])] for row in a]`,
 'foundation-layer-normalization':`def layer_norm(x,eps):\n    mean=sum(x)/len(x)\n    return [v-mean for v in x]`,
 'foundation-gelu':`def gelu(x):\n    return max(0,x)`,
 'foundation-sinusoidal-positions':`import math\ndef position_encoding(position,d_model):\n    return [math.sin(position/10000**(i/d_model)) for i in range(d_model)]`,
 'attention-scaled-dot-product':`import math\ndef scaled_attention(q,keys,values):\n    scores=[sum(x*y for x,y in zip(q,k)) for k in keys]\n    z=sum(math.exp(s-max(scores)) for s in scores)\n    w=[math.exp(s-max(scores))/z for s in scores]\n    return [sum(w[i]*v[j] for i,v in enumerate(values)) for j in range(len(values[0]))]`,
 'attention-causal-mask':`def causal_mask(logits):\n    return [[v if j<i else float('-inf') for j,v in enumerate(row)] for i,row in enumerate(logits)]`,
 'attention-split-heads':`def split_heads(tokens,n_heads):\n    if not tokens:return [[] for _ in range(n_heads)]\n    return [[[row[i] for i in range(h,len(row),n_heads)] for row in tokens] for h in range(n_heads)]`,
 'attention-merge-heads':`def merge_heads(heads):\n    return [[sum(head[t][i] for head in heads) for i in range(len(heads[0][0]))] for t in range(len(heads[0]))] if heads[0] else []`,
 'transformer-cross-attention':`def cross_attention(queries,keys,values):\n    return [values[0][:] for q in queries]`,
 'vit-patchify':`def patchify(image,patch_size):\n    return [row[i:i+patch_size] for row in image for i in range(0,len(row),patch_size)]`,
 'vit-class-token':`def prepare_vit_tokens(patches,cls_token,positions):\n    return [cls_token[:]]+[p[:] for p in patches]`,
 'transformer-prenorm-residual':`def pre_norm_residual(x,normalize,sublayer):\n    return normalize([a+b for a,b in zip(x,sublayer(x))])`,
 'gan-discriminator-bce':`import math\ndef discriminator_loss(real_logits,fake_logits):\n    sp=lambda x:max(x,0)+math.log1p(math.exp(-abs(x)))\n    return sum(sp(r)+sp(f) for r,f in zip(real_logits,fake_logits))/len(real_logits)`,
 'gan-generator-nonsaturating':`import math\ndef generator_loss(fake_logits):\n    sp=lambda x:max(x,0)+math.log1p(math.exp(-abs(x)))\n    return sum(sp(x) for x in fake_logits)/len(fake_logits)`,
 'gan-gradient-penalty':`def gradient_penalty(gradients,penalty_weight):\n    return penalty_weight*sum((sum(x*x for x in g)-1)**2 for g in gradients)/len(gradients)`,
 'diffusion-linear-beta':`def linear_beta_schedule(steps,beta_start,beta_end):\n    return [beta_start+(beta_end-beta_start)*i/steps for i in range(steps)]`,
 'diffusion-alpha-bar':`def cumulative_alphas(betas):\n    return [1-sum(betas[:i+1]) for i in range(len(betas))]`,
 'diffusion-forward-sampling':`def q_sample(x0,noise,alpha_bar):\n    return [alpha_bar*x+(1-alpha_bar)*y for x,y in zip(x0,noise)]`,
 'diffusion-noise-mse':`def epsilon_prediction_mse(predicted,target):\n    return sum(abs(x-y) for x,y in zip(predicted,target))/len(predicted) if predicted else 0.0`,
 'diffusion-reconstruct-x0':`import math\ndef predict_x0_from_eps(xt,eps,alpha_bar):\n    return [(x-math.sqrt(1-alpha_bar)*e)/alpha_bar for x,e in zip(xt,eps)]`,
 'diffusion-ddpm-posterior':`import math\ndef ddpm_posterior_mean(xt,x0,alpha_t,alpha_bar_prev):\n    d=1-alpha_t*alpha_bar_prev\n    return [((1-alpha_t)*math.sqrt(alpha_t)*a+math.sqrt(alpha_t)*(1-alpha_bar_prev)*b)/d for a,b in zip(x0,xt)]`,
 'diffusion-cfg-epsilon':`def cfg_epsilon(eps_uncond,eps_cond,guidance_scale):\n    return [c+guidance_scale*(c-u) for u,c in zip(eps_uncond,eps_cond)]`,
 'diffusion-classifier-guidance':`def classifier_guided_mean(mean,variance,log_prob_gradient,scale):\n    return [m+scale*g for m,g in zip(mean,log_prob_gradient)]`,
 'diffusion-ddim-deterministic':`def ddim_step(xt,eps_hat,alpha_bar_t,alpha_bar_prev):\n    return list(xt)`,
 'dit-adaln-modulation':`def adaptive_layer_norm(x,shift,scale,eps):\n    return [v*(1+s)+b for v,s,b in zip(x,scale,shift)]`,
 'dit-adaln-zero-gate':`def gated_adaln_residual(x,block_output,gate):\n    return [g*a+b for a,b,g in zip(x,block_output,gate)]`
};
const newOnes=problems.filter(p=>p.number>=51 && p.number<=76);
if(newOnes.length!==26 || Object.keys(wrong).length!==newOnes.length)throw Error('v0.9 mutation definition count mismatch');
const cases=newOnes.map(p=>({id:p.id,solution:wrong[p.id],tests:p.tests}));
if(cases.some(p=>!p.solution))throw Error('Missing deliberate mutation');
const runner=`import json,sys\nitems=json.load(sys.stdin)\nsurvived=[]\nfor p in items:\n  killed=False\n  for t in p['tests']:\n    ns={}\n    try:\n      exec(p['solution'],ns,ns)\n      exec(t['code'],ns,ns)\n    except Exception:\n      killed=True\n      break\n  print(('CAUGHT' if killed else 'SURVIVED'),p['id'])\n  if not killed: survived.append(p['id'])\nif survived: print('SURVIVORS:',survived);sys.exit(1)\nprint('PASS',len(items),'new foundation mutations rejected')`;
const r=spawnSync(pythonCommand,['-c',runner],{input:JSON.stringify(cases),encoding:'utf8'});
if(r.stdout)process.stdout.write(r.stdout);
if(r.stderr)process.stderr.write(r.stderr);
if(r.status!==0)process.exit(1);
